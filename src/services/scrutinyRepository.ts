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
export async function listPdfScrutiny(user: UserSession) {
  let names: string[];
  try { names = await fs.readdir(root()); } catch (e) { if ((e as NodeJS.ErrnoException).code === 'ENOENT') return []; throw e; }
  const result: PdfScrutinyRecord[] = [];
  for (const name of names.filter(n => /^[a-f0-9]{64}\.json$/.test(n))) {
    const r: PdfScrutinyRecord = JSON.parse(await fs.readFile(path.join(root(), name), 'utf8'));
    if (r.ownerId === user.id && await authorizedAnalysisFir(r.firId, user)) result.push(r);
  }
  return result.sort((a,b) => b.updatedAt.localeCompare(a.updatedAt));
}
export async function readPdfScrutiny(id: string, user: UserSession) {
  let r: PdfScrutinyRecord;
  try { r = JSON.parse(await fs.readFile(file(id), 'utf8')); } catch(e) { if ((e as NodeJS.ErrnoException).code === 'ENOENT') return null; throw e; }
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
    await fs.mkdir(root(), {recursive:true});
    const temporary = file(id) + '.' + randomUUID() + '.tmp';
    try { await fs.writeFile(temporary, JSON.stringify(record, null, 2), {mode:0o600}); await fs.rename(temporary, file(id)); }
    finally { await fs.rm(temporary, {force:true}); }
    return record;
  });
  queue = run.catch(()=>undefined); return run;
}
export async function deletePdfScrutiny(id: string, user: UserSession) {
  const run = queue.then(async()=>{ if (!await readPdfScrutiny(id,user)) throw new Error('Record not found or access denied.'); await fs.unlink(file(id)); });
  queue = run.catch(()=>undefined); return run;
}
