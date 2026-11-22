import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const seedDataPath = path.join(__dirname, "seed-data.json");
const storesSeedPath = path.join(__dirname, "fir-complaint-seed.json");

const prisma = new PrismaClient();

function seedLocalRegisters() {
  if (!fs.existsSync(storesSeedPath)) return;
  const parsed = JSON.parse(fs.readFileSync(storesSeedPath, "utf8"));
  const data = parsed.data ?? {};
  const targets = [
    ["firs", "firs-store.json"],
    ["complaints", "complaints-store.json"],
  ];
  for (const [key, fileName] of targets) {
    if (!Array.isArray(data[key])) continue;
    fs.writeFileSync(path.join(__dirname, fileName), JSON.stringify(data[key], null, 2) + "\n", "utf8");
  }
  console.log("[db:seed] FIR/complaint registers seeded from prisma/fir-complaint-seed.json.");
}

async function upsertMany(items, upsertFn) {
  for (const item of items) {
    await upsertFn(item);
  }
}

async function main() {
  if (!fs.existsSync(seedDataPath)) {
    console.warn("[db:seed] No prisma/seed-data.json found. Run `npm run db:export-seed` first.");
    return;
  }

  const raw = fs.readFileSync(seedDataPath, "utf8");
  const parsed = JSON.parse(raw);
  const data = parsed.data ?? {};

  console.log("[db:seed] Seeding database from prisma/seed-data.json...");

  await upsertMany(data.policeUnits ?? [], (item) =>
    prisma.policeUnit.upsert({
      where: { id: item.id },
      update: item,
      create: item,
    })
  );

  await upsertMany(data.users ?? [], (item) =>
    prisma.user.upsert({
      where: { id: item.id },
      update: item,
      create: item,
    })
  );

  await upsertMany(data.complaints ?? [], (item) =>
    prisma.complaint.upsert({
      where: { id: item.id },
      update: item,
      create: item,
    })
  );

  await upsertMany(data.complaintAssignmentHistory ?? [], (item) =>
    prisma.complaintAssignmentHistory.upsert({
      where: { id: item.id },
      update: item,
      create: item,
    })
  );

  await upsertMany(data.enquiryActionLogs ?? [], (item) =>
    prisma.enquiryActionLog.upsert({
      where: { id: item.id },
      update: item,
      create: item,
    })
  );

  await upsertMany(data.complaintEvidences ?? [], (item) =>
    prisma.complaintEvidence.upsert({
      where: { id: item.id },
      update: item,
      create: item,
    })
  );

  await upsertMany(data.enquiryReports ?? [], (item) =>
    prisma.enquiryReport.upsert({
      where: { id: item.id },
      update: item,
      create: item,
    })
  );

  await upsertMany(data.approvalHistory ?? [], (item) =>
    prisma.approvalHistory.upsert({
      where: { id: item.id },
      update: item,
      create: item,
    })
  );

  await upsertMany(data.generalDiaryEntries ?? [], (item) =>
    prisma.generalDiaryEntry.upsert({
      where: { id: item.id },
      update: item,
      create: item,
    })
  );

  await upsertMany(data.auditLogs ?? [], (item) =>
    prisma.auditLog.upsert({
      where: { id: item.id },
      update: item,
      create: item,
    })
  );

  await upsertMany(data.builderTemplates ?? [], (item) =>
    prisma.builderTemplate.upsert({
      where: { id: item.id },
      update: item,
      create: item,
    })
  );

  await upsertMany(data.builderDrafts ?? [], (item) =>
    prisma.builderDraft.upsert({
      where: { id: item.id },
      update: item,
      create: item,
    })
  );

  await upsertMany(data.gdRecords ?? [], (item) =>
    prisma.gDRecord.upsert({
      where: { id: item.id },
      update: item,
      create: item,
    })
  );

  seedLocalRegisters();

  console.log("[db:seed] Database seeding completed successfully.");
}

main()
  .catch((err) => {
    console.error("[db:seed] Seeding failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
