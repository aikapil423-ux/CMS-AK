import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import type { IifViRecord } from "@/lib/iifVi";

export const iifViRecordPath = (id: string) => path.join(
  process.env.CMS_IIF_VI_STORE_DIR || path.join(process.cwd(), "prisma", "iif-vi"),
  createHash("sha256").update(id).digest("hex") + ".json",
);

export async function readIifViRecord(file: string): Promise<IifViRecord | null> {
  try {
    return JSON.parse(await fs.readFile(/* turbopackIgnore: true */ file, "utf8"));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}
