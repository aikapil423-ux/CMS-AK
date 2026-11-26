import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { prisma } from "./prisma";

function databaseKey(file: string) {
  const key = path.relative(path.join(process.cwd(), "prisma"), file);
  if (path.isAbsolute(key) || key === ".." || key.startsWith(".." + path.sep)) {
    throw new Error("Runtime JSON path must be inside the Prisma data directory.");
  }
  return key.split(path.sep).join("/");
}

export function usesPostgresStore() {
  return Boolean(process.env.POSTGRES_DATABASE_URL);
}

export async function readRuntimeJson<T>(file: string): Promise<T> {
  if (!usesPostgresStore()) return JSON.parse(await fs.readFile(file, "utf8")) as T;
  const key = databaseKey(file);
  const [row] = await prisma.$queryRaw<{ payload: T }[]>`
    SELECT payload FROM "ImportedJsonDocument" WHERE path = ${key}
  `;
  if (!row) {
    throw Object.assign(new Error(`Runtime store missing: ${key}`), { code: "ENOENT" });
  }
  return row.payload;
}

export async function writeRuntimeJson(file: string, value: unknown) {
  const json = JSON.stringify(value, null, 2);
  if (usesPostgresStore()) {
    const key = databaseKey(file);
    await prisma.$executeRaw`
      INSERT INTO "ImportedJsonDocument" (path, payload) VALUES (${key}, ${json}::jsonb)
      ON CONFLICT (path) DO UPDATE SET payload = EXCLUDED.payload
    `;
    return;
  }
  const temp = file + "." + randomUUID() + ".tmp";
  try {
    await fs.writeFile(temp, json, { mode: 0o600 });
    await fs.rename(temp, file);
  } finally {
    await fs.unlink(temp).catch(() => {});
  }
}

export async function listRuntimeJson(directory: string, recursive = false): Promise<string[]> {
  if (!usesPostgresStore()) {
    const files = await fs.readdir(directory, { withFileTypes: true, recursive })
      .catch((error: NodeJS.ErrnoException) => {
        if (error.code === "ENOENT") return [];
        throw error;
      });
    return files.filter((file) => file.isFile() && file.name.endsWith(".json"))
      .map((file) => path.join(file.parentPath, file.name));
  }
  const prefix = databaseKey(directory) + "/";
  const rows = await prisma.$queryRaw<{ path: string }[]>`
    SELECT path FROM "ImportedJsonDocument" WHERE starts_with(path, ${prefix}) ORDER BY path
  `;
  return rows.filter((row) => recursive || !row.path.slice(prefix.length).includes("/"))
    .map((row) => path.join(process.cwd(), "prisma", row.path));
}

export async function removeRuntimeJson(file: string) {
  if (!usesPostgresStore()) {
    await fs.rm(file, { force: true });
    return;
  }
  await prisma.$executeRaw`DELETE FROM "ImportedJsonDocument" WHERE path = ${databaseKey(file)}`;
}
