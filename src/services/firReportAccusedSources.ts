import fs from 'node:fs/promises';
import path from 'node:path';
import type { FIRItem, UserSession } from '@/types';
import type { UniversalEvidenceRecord } from '@/types/evidence';
import { evidenceOwner } from '@/lib/evidenceOwnership';
import { firReportAccused, firReportWitnesses } from '@/lib/firReportAccused';

export async function firReportAccusedSources(fir: FIRItem, user: UserSession) {
  return (await firReportSources(fir, user)).accused;
}
export async function firReportSources(fir: FIRItem, user: UserSession) {
  // The authoritative FIR list remains available even if no processed evidence exists.
  let records: UniversalEvidenceRecord[] = [];
  try { records = JSON.parse(await fs.readFile(path.join(process.cwd(), 'prisma', 'processed-evidence-store.json'), 'utf8')); }
  catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
  if (!Array.isArray(records)) throw new Error('Invalid processed evidence store.');
  const accessible = records.filter(record => user.role === 'SUPER_ADMIN' || evidenceOwner(record) === user.id);
  return { accused: firReportAccused(fir, accessible), witnesses: firReportWitnesses(fir, accessible) };
}
