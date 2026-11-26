import { readRuntimeJson } from "@/lib/runtimeJsonStore";
import { createHash } from "node:crypto";
import path from "node:path";
import type { IifViRecord } from "@/lib/iifVi";

export const iifViRecordPath = (id: string) => path.join(
  process.env.CMS_IIF_VI_STORE_DIR || path.join(process.cwd(), "prisma", "iif-vi"),
  createHash("sha256").update(id).digest("hex") + ".json",
);

export async function readIifViRecord(file: string): Promise<IifViRecord | null> {
  try {
    return await readRuntimeJson<IifViRecord>(file);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}
