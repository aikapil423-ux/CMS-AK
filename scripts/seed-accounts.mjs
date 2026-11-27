import fs from "node:fs";
import path from "node:path";
import { randomBytes, scryptSync } from "node:crypto";
import nextEnv from "@next/env";
import { PrismaClient } from "@prisma/client";

nextEnv.loadEnvConfig(process.cwd(), false);

const databaseUrl = process.env.POSTGRES_DATABASE_URL;
if (!databaseUrl) {
  console.error("[accounts] POSTGRES_DATABASE_URL is required — accounts must be seeded into Postgres.");
  process.exit(1);
}

const seedFile = process.env.CMS_ACCOUNTS_SEED_FILE
  ? path.resolve(process.env.CMS_ACCOUNTS_SEED_FILE)
  : path.join(process.cwd(), "prisma", "accounts-seed.json");
const exporting = process.argv.includes("--export");
const bootstrapping = process.argv.includes("--bootstrap");
const mergingMissing = process.argv.includes("--merge-missing");
const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });

const STORE_PATH = "accounts-master-store.json";
const PROFILE_FIELDS = [
  "username", "beltNumber", "designation", "rankDisplay", "roleDisplay",
  "assignedUnitType", "assignedUnitName", "state", "range", "district", "zone",
  "authorizedDistricts", "policeStation", "authorizedPoliceStations",
  "jurisdictionType", "specialAllocations", "createdAt", "updatedAt", "lastLoginAt",
];
const plaintextKey = "plainPin" + "Sample";

function profileOf(account) {
  if (!account) return {};
  return Object.fromEntries(PROFILE_FIELDS
    .filter((field) => account[field] !== undefined)
    .map((field) => [field, account[field]]));
}

function assertNoPlaintext(value, label) {
  if (!value || typeof value !== "object") return;
  for (const [key, nested] of Object.entries(value)) {
    if (key === plaintextKey || key === "pin" || key === "password") {
      throw new Error(`${label} contains a plaintext credential field: ${key}`);
    }
    assertNoPlaintext(nested, label);
  }
}

function assertHash(value, label) {
  if (typeof value !== "string" || !/^[a-f0-9]{32}:[a-f0-9]{128}$/i.test(value)) {
    throw new Error(`${label} has an invalid passwordHash (expected salt:hex-hash).`);
  }
}

function newUnusableHash() {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(randomBytes(32), salt, 64).toString("hex")}`;
}

function unitOf(user) {
  return {
    id: user.unit.id,
    code: user.unit.code,
    name: user.unit.name,
    type: user.unit.type,
    district: user.unit.district,
    range: user.unit.range,
    contactPhone: user.unit.contactPhone,
    email: user.unit.email,
    address: user.unit.address,
    parentId: user.unit.parentId,
  };
}

async function exportAccounts() {
  const [users, units, rows, rosters] = await Promise.all([
    prisma.user.findMany({ include: { unit: true }, orderBy: { pno: "asc" } }),
    prisma.policeUnit.findMany({ orderBy: { id: "asc" } }),
    prisma.$queryRaw`SELECT payload FROM "ImportedJsonDocument" WHERE path = ${STORE_PATH}`,
    prisma.importedJsonDocument.findMany({ where: { path: { startsWith: "station-roster/" } } }),
  ]);
  const profiles = new Map(
    (rows[0]?.payload?.accounts ?? []).map((account) => [String(account.pno ?? "").toUpperCase(), account]),
  );
  const accounts = users.map((user) => ({
    id: user.id,
    pno: user.pno,
    beltNumber: user.beltNumber,
    fullName: user.fullName,
    rank: user.rank,
    role: user.role,
    status: user.status,
    mobileNumber: user.mobileNumber,
    email: user.email,
    passwordHash: /^[a-f0-9]{32}:[a-f0-9]{128}$/i.test(user.passwordHash) ? user.passwordHash : null,
    unitId: user.unitId,
    unit: unitOf(user),
    profile: profileOf(profiles.get(user.pno.toUpperCase())),
  }));

  const seed = {
    generatedAt: new Date().toISOString(),
    units: units.map((unit) => ({
      id: unit.id, code: unit.code, name: unit.name, type: unit.type,
      district: unit.district, range: unit.range, contactPhone: unit.contactPhone,
      email: unit.email, address: unit.address, parentId: unit.parentId,
    })),
    accounts,
    rosters,
  };
  fs.mkdirSync(path.dirname(seedFile), { recursive: true });
  fs.writeFileSync(seedFile, JSON.stringify(seed, null, 2) + "\n", { mode: 0o600, flag: "wx" });
  console.log(`[accounts] exported ${accounts.length} accounts and ${units.length} units (hashes only) to ${seedFile}`);
  console.log("[accounts] keep this file out of git; it contains credential hashes.");
}

async function applyAccounts() {
  if (bootstrapping && mergingMissing) throw new Error("Choose --bootstrap or --merge-missing.");
  if (!fs.existsSync(seedFile)) {
    throw new Error(`Seed file not found: ${seedFile}. Run with --export first, or set CMS_ACCOUNTS_SEED_FILE.`);
  }
  const seed = JSON.parse(fs.readFileSync(seedFile, "utf8"));
  if (!Array.isArray(seed.accounts) || seed.accounts.length === 0) {
    throw new Error("Seed file has no accounts.");
  }
  for (const account of seed.accounts) {
    assertNoPlaintext(account, `account ${account.pno}`);
    if (account.passwordHash !== null) assertHash(account.passwordHash, `account ${account.pno}`);
    if (!account.pno || !account.fullName || !account.unitId) {
      throw new Error(`Account ${account.pno ?? "(missing pno)"} is missing required identity fields.`);
    }
  }

  const units = Array.isArray(seed.units) ? seed.units : seed.accounts.map((account) => account.unit);
  const rosters = seed.rosters ?? [];
  if (!Array.isArray(rosters)) throw new Error("Invalid station roster seed.");
  for (const roster of rosters) {
    if (!/^station-roster\/[a-z0-9-]+\.json$/.test(roster.path) || !Array.isArray(roster.payload)) {
      throw new Error("Invalid station roster seed.");
    }
    assertNoPlaintext(roster.payload, "station roster");
  }
  const applied = await prisma.$transaction(async (tx) => {
    if (bootstrapping || mergingMissing) {
      await tx.$queryRaw`SELECT 1 AS locked FROM pg_advisory_xact_lock(186367421)`;
    }
    if (bootstrapping) {
      const marker = "deployment/account-bootstrap.json";
      if (await tx.importedJsonDocument.findUnique({ where: { path: marker } }) || await tx.user.count()) {
        return false;
      }
      await tx.importedJsonDocument.create({ data: { path: marker, payload: { completed: true } } });
    }
    const knownPnos = mergingMissing
      ? new Set((await tx.user.findMany({ select: { pno: true } })).map(account => account.pno.trim().toUpperCase()))
      : new Set();
    const accounts = seed.accounts.filter(account => !knownPnos.has(account.pno.trim().toUpperCase()));
    const mappedUnits = new Map();
    if (mergingMissing) {
      const byId = new Map(units.map(unit => [unit.id, unit]));
      const resolveUnit = async (id, visited = new Set()) => {
        if (mappedUnits.has(id)) return mappedUnits.get(id);
        const unit = byId.get(id);
        if (!unit || visited.has(id)) throw new Error("Missing or cyclic station hierarchy in the seed.");
        visited.add(id);
        const found = await tx.policeUnit.findFirst({
          where: { OR: [{ id }, { code: unit.code }] },
          orderBy: { id: "asc" },
        }) ?? await tx.policeUnit.findFirst({
          where: { name: { equals: unit.name, mode: "insensitive" }, district: { equals: unit.district, mode: "insensitive" } },
        });
        if (found && (found.name.toLowerCase() !== unit.name.toLowerCase() ||
                      found.district.toLowerCase() !== unit.district.toLowerCase())) {
          throw new Error("A seed station ID or code belongs to a different station on the server.");
        }
        const resolved = found ?? await tx.policeUnit.create({
          data: {
            id, code: unit.code, name: unit.name, type: unit.type, district: unit.district, range: unit.range,
            contactPhone: unit.contactPhone ?? null, email: unit.email ?? null, address: unit.address ?? null,
            parentId: unit.parentId ? await resolveUnit(unit.parentId, visited) : null,
          },
        });
        mappedUnits.set(id, resolved.id);
        return resolved.id;
      };
      for (const account of accounts) await resolveUnit(account.unitId);
    }
    // Parents first so PoliceUnit.parentId can reference a unit from the same seed.
    const ordered = mergingMissing ? [] : [...units].sort((a, b) => Number(Boolean(a.parentId)) - Number(Boolean(b.parentId)));
    for (const unit of ordered) {
      await tx.policeUnit.upsert({
        where: { id: unit.id },
        update: {
          code: unit.code, name: unit.name, type: unit.type, district: unit.district,
          range: unit.range, contactPhone: unit.contactPhone ?? null,
          email: unit.email ?? null, address: unit.address ?? null, parentId: unit.parentId ?? null,
        },
        create: {
          id: unit.id, code: unit.code, name: unit.name, type: unit.type,
          district: unit.district, range: unit.range, contactPhone: unit.contactPhone ?? null,
          email: unit.email ?? null, address: unit.address ?? null, parentId: unit.parentId ?? null,
        },
      });
    }

    for (const account of accounts) {
      const data = {
        pno: account.pno,
        beltNumber: account.beltNumber ?? account.pno,
        fullName: account.fullName,
        rank: account.rank,
        role: account.role,
        status: account.status ?? "ACTIVE",
        mobileNumber: account.mobileNumber || null,
        email: account.email ?? null,
        ...(account.passwordHash === null ? {} : { passwordHash: account.passwordHash }),
        unitId: mappedUnits.get(account.unitId) ?? account.unitId,
      };
      const create = { id: account.id, ...data, passwordHash: account.passwordHash ?? newUnusableHash(), createdAt: new Date(), updatedAt: new Date() };
      if (mergingMissing) {
        await tx.user.create({ data: create });
        continue;
      }
      await tx.user.upsert({
        where: { pno: account.pno },
        update: { ...data, updatedAt: new Date() },
        create,
      });
    }

    // The JSON document now carries only non-secret profile extensions.
    const payload = {
      accounts: accounts.map((account) => ({
        ...profileOf(account.profile),
        id: account.id,
        pno: account.pno,
        username: account.username ?? account.pno,
        fullName: account.fullName,
        mobileNumber: account.mobileNumber,
        email: account.email,
        rank: account.rank,
        role: account.role,
        status: account.status ?? "ACTIVE",
        assignedUnitId: mappedUnits.get(account.unitId) ?? account.unitId,
      })),
      updatedAt: new Date().toISOString(),
    };
    if (mergingMissing && accounts.length) {
      const existing = await tx.importedJsonDocument.findUnique({ where: { path: STORE_PATH } });
      const imported = new Set(accounts.map(account => account.pno.trim().toUpperCase()));
      const profiles = (existing?.payload?.accounts ?? []).filter(account =>
        !imported.has(String(account.pno ?? "").trim().toUpperCase()));
      payload.accounts.unshift(...profiles);
    }
    if (!mergingMissing || accounts.length) {
      await tx.importedJsonDocument.upsert({
        where: { path: STORE_PATH },
        update: { payload },
        create: { path: STORE_PATH, payload },
      });
    }
    let importedRosters = 0;
    for (const roster of rosters) {
      if (mergingMissing && await tx.importedJsonDocument.findUnique({ where: { path: roster.path } })) continue;
      await tx.importedJsonDocument.upsert({
        where: { path: roster.path },
        update: { payload: roster.payload },
        create: { path: roster.path, payload: roster.payload },
      });
      importedRosters++;
    }
    return { users: accounts.length, rosters: importedRosters };
  }, { timeout: 30000 });

  if (applied) console.log(`[accounts] seeded ${applied.users} users and ${applied.rosters} station rosters.`);
  else console.log("[accounts] startup seed skipped because this database already has accounts or was bootstrapped.");
}

try {
  if (exporting) await exportAccounts();
  else await applyAccounts();
} catch (error) {
  console.error(`[accounts] ${error instanceof Error ? error.message : error}`);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
