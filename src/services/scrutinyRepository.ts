import { readRuntimeJson, writeRuntimeJson, listRuntimeJson, removeRuntimeJson, usesPostgresStore } from "@/lib/runtimeJsonStore";
import { prisma } from "@/lib/prisma";
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import type { UserSession } from '@/types';
import type { ScrutinyPerformaRecord } from '@/types/prosecution';
import type { ScrutinyValues } from '@/lib/scrutinyPdfTemplate';
import { SCRUTINY_TEMPLATE_VERSION } from '@/lib/scrutinyPdfTemplate';
import { authorizedAnalysisFir } from '@/services/caseAnalysisService';

export interface PdfScrutinyRecord extends ScrutinyPerformaRecord {
  firId: string; ownerId: string; templateVersion: string; fields: ScrutinyValues;
  createdAt: string; updatedAt: string; revision: string; status: 'DRAFT' | 'SAVED';
  processingWarnings: string[]; accusedIndex: number;
}
const root = () => path.join(process.cwd(), 'prisma', 'scrutiny-records');
const file = (id: string) => path.join(root(), createHash('sha256').update(id).digest('hex') + '.json');
let queue: Promise<unknown> = Promise.resolve();
export async function listStoredPdfScrutiny(ownerId?: string) {
  if (usesPostgresStore()) {
    const rows = ownerId === undefined
      ? await prisma.$queryRaw<{ payload: PdfScrutinyRecord }[]>`SELECT payload FROM "ScrutinyRecord" ORDER BY "updatedAt" DESC`
      : await prisma.$queryRaw<{ payload: PdfScrutinyRecord }[]>`SELECT payload FROM "ScrutinyRecord" WHERE "ownerId" = ${ownerId} ORDER BY "updatedAt" DESC`;
    return rows.map(row => row.payload);
  }
  const files = await listRuntimeJson(root());
  return (await Promise.all(files.filter(item => /^[a-f0-9]{64}\.json$/.test(path.basename(item)))
    .map(location => readRuntimeJson<PdfScrutinyRecord>(location))))
    .filter(record => ownerId === undefined || record.ownerId === ownerId);
}
export async function listPdfScrutiny(user: UserSession) {
  const result: PdfScrutinyRecord[] = [];
  for (const record of await listStoredPdfScrutiny(user.id)) {
    if (await authorizedAnalysisFir(record.firId, user)) result.push(record);
  }
  return result.sort((a,b) => b.updatedAt.localeCompare(a.updatedAt));
}
export async function readPdfScrutiny(id: string, user: UserSession) {
  if (usesPostgresStore()) {
    const [row] = await prisma.$queryRaw<{ payload: PdfScrutinyRecord }[]>`
      SELECT payload FROM "ScrutinyRecord" WHERE id = ${id} AND "ownerId" = ${user.id}`;
    return row && await authorizedAnalysisFir(row.payload.firId, user) ? row.payload : null;
  }
  let r: PdfScrutinyRecord;
  try { r = await readRuntimeJson<PdfScrutinyRecord>(file(id)); } catch(e) { if ((e as NodeJS.ErrnoException).code === 'ENOENT') return null; throw e; }
  return r.ownerId === user.id && await authorizedAnalysisFir(r.firId, user) ? r : null;
}
export async function savePdfScrutiny(input: {id?: string; firId: string; fields: ScrutinyValues; revision?: string; status: 'DRAFT'|'SAVED'; warnings?: string[]; accusedIndex?:number; decision?:ScrutinyPerformaRecord['decision'];courtName?:string;scrutinyOfficer?:string;challanType?:ScrutinyPerformaRecord['challanType'];objectionsNote?:string}, user: UserSession) {
  const run = queue.then(async () => {
    const fir = await authorizedAnalysisFir(input.firId, user);
    if (!fir) throw new Error('FIR not found or access denied.');
    const previous = input.id ? await readPdfScrutiny(input.id, user) : null;
    if (input.id && !previous) throw new Error('Scrutiny record not found or access denied.');
    if (previous && (previous.firId !== input.firId || previous.revision !== input.revision)) throw new Error('This record changed. Reopen it before saving.');
    const now = new Date().toISOString(), id = previous?.id || 'SCRPDF-' + randomUUID();
    const record: PdfScrutinyRecord = {
      ...previous, id, firId: fir.id, ownerId: user.id, templateVersion: SCRUTINY_TEMPLATE_VERSION,
      scrutinyNumber: previous?.scrutinyNumber || `SCR/${now.slice(0,4)}/${id.slice(-8)}`,
      firNumber: fir.firNumber, policeStation: fir.policeStation, district: fir.district,
      actsAndSections: fir.actsAndSections || '', complainantName: fir.complainantName || '',
      accusedNames: (fir.accusedList || []).map(a=>a.name).join(', '), investigationOfficer: fir.assignedIoName || '',
      ioRankAndBelt: fir.assignedIoRank || '', submissionDate: now.slice(0,10), scrutinyDate: now.slice(0,10),
      scrutinyOfficer: input.scrutinyOfficer ?? previous?.scrutinyOfficer ?? '', decision: input.decision || previous?.decision || 'DRAFT',
      checklist: previous?.checklist || {firAndGdCopies:false,statements180Bnss:false,sitePlanNaksha:false,arrestMemoNotice35:false,mlcPostMortemReport:false,fslForensicReport:false,section105AudioVideo:false,seizureMalkhanaEntry:false,antecedentRecord:false,seniorOfficerSupervision:false},
      courtName: input.courtName ?? previous?.courtName ?? '', challanType: input.challanType || previous?.challanType || 'FINAL_CHARGESHEET',objectionsNote:input.objectionsNote ?? previous?.objectionsNote,
      fields: input.fields, createdAt: previous?.createdAt || now, updatedAt: now, revision: randomUUID(),
      status: input.status, processingWarnings: input.warnings || previous?.processingWarnings || [],accusedIndex:previous?.accusedIndex ?? input.accusedIndex ?? 0,
    };
    if (usesPostgresStore()) {
      await prisma.$transaction(async tx => {
        const payload = JSON.stringify(record);
        const changed = previous
          ? await tx.$executeRaw`UPDATE "ScrutinyRecord" SET payload = ${payload}::jsonb, revision = ${record.revision}, "updatedAt" = ${now}
              WHERE id = ${id} AND "ownerId" = ${user.id} AND revision = ${previous.revision}`
          : await tx.$executeRaw`INSERT INTO "ScrutinyRecord" (id, "firId", "ownerId", revision, "updatedAt", payload)
              VALUES (${id}, ${fir.id}, ${user.id}, ${record.revision}, ${now}, ${payload}::jsonb)`;
        if (!changed) throw new Error('This record changed. Reopen it before saving.');
        await tx.$executeRaw`INSERT INTO "CaseDocumentEvent" (kind, "recordId", "officerId", action)
          VALUES ('SCRUTINY', ${id}, ${user.id}, ${record.status})`;
      });
    } else {
      await fs.mkdir(root(), {recursive:true});
      await writeRuntimeJson(file(id), record);
    }
    return record;
  });
  queue = run.catch(()=>undefined); return run;
}
export async function deletePdfScrutiny(id: string, user: UserSession) {
  const run = queue.then(async () => {
    const previous = await readPdfScrutiny(id, user);
    if (!previous) throw new Error('Record not found or access denied.');
    if (!usesPostgresStore()) return removeRuntimeJson(file(id));
    await prisma.$transaction(async tx => {
      const removed = await tx.$executeRaw`DELETE FROM "ScrutinyRecord"
        WHERE id = ${id} AND "ownerId" = ${user.id} AND revision = ${previous.revision}`;
      if (!removed) throw new Error('This record changed. Reopen it before deleting.');
      await tx.$executeRaw`INSERT INTO "CaseDocumentEvent" (kind, "recordId", "officerId", action)
        VALUES ('SCRUTINY', ${id}, ${user.id}, 'DELETE')`;
    });
  });
  queue = run.catch(()=>undefined); return run;
}
