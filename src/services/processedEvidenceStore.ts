import path from "node:path";
import { readRuntimeJson, writeRuntimeJson } from "@/lib/runtimeJsonStore";
import type { UniversalEvidenceRecord } from "@/types/evidence";

const file = () => path.join(process.cwd(), "prisma", "processed-evidence-store.json");

export async function readEvidenceStore(): Promise<UniversalEvidenceRecord[]> {
  try {
    const records = await readRuntimeJson<UniversalEvidenceRecord[]>(file());
    if (!Array.isArray(records)) throw new Error("Invalid evidence store.");
    return records;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

export async function writeEvidenceStore(records: UniversalEvidenceRecord[]) {
  await writeRuntimeJson(file(), records);
}
