import { createHash, randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';
import { NextRequest } from 'next/server';
import { apiAccess } from '@/lib/apiSecurity';
import { affidavitLabels, bailReplyTypes, statusReportTypes, type AffidavitField, type AffidavitFields, type CourtAffidavit } from '@/lib/courtAffidavit';
import { processWithAI } from '@/lib/openRouter';
import { authorizedAnalysisFir } from '@/services/caseAnalysisService';
import { readFirRecords } from '@/services/firRepository';
import { readComplaints } from '@/services/complaintRepository';
import { canViewComplaint } from '@/utils/complaintPermissions';
import { POST as processEvidence } from '@/app/api/evidence/process/route';
import { isFirVisibleToUser } from '@/lib/firIntegrity';
import { savedCaseEvidence } from '@/services/savedCaseEvidence';
import type { BailReplyRecord, CourtStatusReportRecord } from '@/types/prosecution';
import type { UserSession } from '@/types';

export const runtime = 'nodejs';
export const maxDuration = 180;

const kinds = z.enum(['bail', 'status']);
const promptVersion = 'court-affidavit-v1';
const fieldsSchema = z.partialRecord(z.enum(Object.keys(affidavitLabels) as [AffidavitField, ...AffidavitField[]]), z.string().max(60000));
const affidavitSchema = z.object({
  firId: z.string().min(1).max(200),
  fields: fieldsSchema,
  annexures: z.array(z.object({
    number: z.string().max(150), description: z.string().max(4000), date: z.string().max(100),
    pages: z.string().max(100), text: z.string().max(60000), sourceId: z.string().max(200).optional(),
    sourcePages: z.string().max(100).optional(), vernacular: z.boolean().optional(),
  })).max(100),
  blocks: z.array(z.object({ heading: z.string().max(500), text: z.string().max(60000), table: z.string().max(60000), afterFacts: z.boolean().optional() })).max(30).optional(),
  customType: z.string().trim().max(150).optional(),
  promptVersion: z.string().regex(/^court-affidavit-v\d+$/).optional(),
  sources: z.partialRecord(z.enum(Object.keys(affidavitLabels) as [AffidavitField, ...AffidavitField[]]), z.object({ id: z.string().max(200), name: z.string().max(1000) })),
});
const saveSchema = z.object({
  action: z.literal('save'), kind: kinds, id: z.string().min(1).max(200).optional(), category: z.string(),
  affidavit: affidavitSchema,
});
const prepareSchema = z.object({
  action: z.enum(['sources', 'prepare']), firId: z.string().min(1).max(200),
  kind: kinds.optional(), category: z.string().max(150).optional(), basic: fieldsSchema.optional(),
});
type Stored = { kind: z.infer<typeof kinds>; record: BailReplyRecord | CourtStatusReportRecord };
const directory = (owner: string) => path.join(process.cwd(), 'prisma', 'court-affidavits', createHash('sha256').update(owner).digest('hex'));
const recordPath = (owner: string, kind: string, id: string) => path.join(directory(owner), createHash('sha256').update(JSON.stringify([kind, id])).digest('hex') + '.json');
const protectedMatter = /pocso|child[ _-]+(?:marriage|sexual)|protection of children from sexual offences/i;

async function courtCase(key: string, user: UserSession) {
  if (key.startsWith('complaint:')) {
    const complaint = (await readComplaints()).find(row => row.id === key.slice('complaint:'.length) && canViewComplaint(user, row).allowed);
    if (!complaint) return null;
    return {
      key, caseIds: [complaint.id], reference: complaint.complaintNumber, module: 'COMPLAINTS',
      fields: { complaint: complaint.complaintNumber, station: complaint.policeStation, facts: complaint.incidentDetails || complaint.complaintDescription || '' } satisfies AffidavitFields,
      sensitive: protectedMatter.test([complaint.category, complaint.categoryDisplay, complaint.firSections].join(' ')),
    };
  }
  const fir = await authorizedAnalysisFir(key, user);
  if (!fir) return null;
  return {
    key, caseIds: fir.sourceComplaintId ? [fir.id, fir.sourceComplaintId] : [fir.id], reference: fir.firNumber, module: 'FIR',
    fields: { fir: fir.firNumber, firDate: fir.firDate || '', station: fir.policeStation, sections: fir.actsAndSections || '', facts: fir.briefFacts || '' } satisfies AffidavitFields,
    sensitive: protectedMatter.test(fir.actsAndSections || ''),
  };
}

async function readRecord(file: string): Promise<Stored | null> {
  try { return JSON.parse(await fs.readFile(file, 'utf8')); }
  catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null; throw error; }
}

export async function GET(req: Request) {
  const user = apiAccess(req);
  if (user instanceof Response) return user;
  const kind = kinds.safeParse(new URL(req.url).searchParams.get('kind'));
  if (!kind.success) return Response.json({ error: 'Select a document kind.' }, { status: 400 });
  try {
    const root = directory(user.id);
    const names = await fs.readdir(root).catch(error => { if (error.code === 'ENOENT') return []; throw error; });
    const visible = new Set((await readFirRecords()).filter(fir => isFirVisibleToUser(user, fir)).map(fir => fir.id));
    if (kind.data === 'status') {
      for (const row of await readComplaints()) if (canViewComplaint(user, row).allowed) visible.add('complaint:' + row.id);
    }
    const saved = await Promise.all(names.filter(name => /^[a-f0-9]{64}\.json$/.test(name)).map(name => readRecord(path.join(root, name))));
    const records = saved.flatMap(item => item?.kind === kind.data && item.record.affidavit && visible.has(item.record.affidavit.firId) ? [item.record] : []);
    return Response.json({ records }, { headers: { 'Cache-Control': 'no-store' } });
  } catch { return Response.json({ error: 'Saved court documents could not be loaded.' }, { status: 503 }); }
}

export async function POST(req: Request) {
  const user = apiAccess(req);
  if (user instanceof Response) return user;
  if (req.headers.get('content-type')?.startsWith('multipart/form-data')) {
    try {
      const form = await req.formData();
      const key = form.get('caseId');
      const linked = typeof key === 'string' ? await courtCase(key, user) : null;
      if (!linked) return Response.json({ error: 'Case not found or access denied.' }, { status: 404 });
      form.set('caseId', linked.caseIds[0]);
      form.set('caseNumber', linked.reference);
      form.set('module', linked.module);
      form.set('deferCaseAnalysis', 'true');
      const headers = new Headers(req.headers);
      headers.delete('content-type'); headers.delete('content-length');
      return processEvidence(new NextRequest(new URL('/api/evidence/process', req.url), { method: 'POST', headers, body: form }));
    } catch { return Response.json({ error: 'Evidence upload failed.' }, { status: 503 }); }
  }
  const body = await req.json().catch(() => null);
  const parsed = z.union([saveSchema, prepareSchema]).safeParse(body);
  if (!parsed.success) return Response.json({ error: 'Invalid court document request.' }, { status: 400 });
  const input = parsed.data;
  try {
    const linked = await courtCase(input.action === 'save' ? input.affidavit.firId : input.firId, user);
    if (!linked) return Response.json({ error: 'Case not found or access denied.' }, { status: 404 });
    if (input.kind === 'bail' && linked.module !== 'FIR') return Response.json({ error: 'Select an FIR for a bail reply.' }, { status: 400 });
    const { caseIds } = linked;
    const firFields: AffidavitFields = { ...linked.fields };
    if (linked.sensitive) delete firFields.facts;
    if (input.action !== 'save') {
      const evidence = await savedCaseEvidence(caseIds, user);
      const documents = evidence.map(({ id, name }) => ({ id, name }));
      if (input.action === 'sources') return Response.json({ documents });
      const fields = { ...firFields };
      const sources: CourtAffidavit['sources'] = {};
      let warning = '';
      const prompt = await fs.readFile(path.join(process.cwd(), 'prompts', 'prosecution', promptVersion + '.txt'), 'utf8');
      const category = input.category || '';
      const labels: Record<string, string> = input.kind === 'bail' ? bailReplyTypes : statusReportTypes;
      const label = Object.hasOwn(labels, category) && category !== 'OTHER' ? labels[category] : '';
      const draftFields: AffidavitFields = {
        ...(label ? { title: `${label} by way of an affidavit` } : {}),
        ...(label && input.basic?.petition ? { subject: `${label} in ${input.basic.petition}` } : {}),
        ...(label && input.basic?.to && input.basic?.petition ? { forwarding: `The enclosed draft ${label.toLowerCase()} in ${input.basic.petition} is submitted for vetting.` } : {}),
      };
      const draftBlocks: NonNullable<CourtAffidavit['blocks']> = [];
      if (linked.sensitive) {
        warning = 'Sensitive case: review redacted records and enter narrative manually.';
      } else if (evidence.length) {
        const corpus = JSON.stringify(evidence.map(({ id, text }) => ({ id, text })));
        try {
          if (corpus.length > 600000) throw new Error('Sources too large');
          const allowed = ['from','to','memo','memoDate','subject','court','petition','petitioner','father','respondent','title','hearing','order','facts','role','custody','stage','trial','antecedents','grounds','deponent','place','date','petitionSection','relief','capacity','preliminary','paraWise','partyRole','priorFiling','compliance','complaint'] as const;
          const quote = z.object({ sourceId: z.string(), quote: z.string().trim().min(1).max(12000) });
          const entries = z.object({ fields: z.array(quote.extend({ field: z.enum(allowed) })).max(50), chronology: z.array(quote).max(12).optional() });
          const reply = await processWithAI([{ text: `Return JSON {"fields":[{"field":"allowed key","sourceId":"exact source ID","quote":"exact contiguous source text"}],"chronology":[{"sourceId":"exact source ID","quote":"exact contiguous source text"}]}. Chronology is optional. Use short, distinct excerpts in event order for material developments that do not already appear in facts or officer inputs. Allowed keys: ${allowed.join(', ')}. Selected case: ${JSON.stringify(linked.reference)}. Draft kind and type: ${JSON.stringify([input.kind, label])}. Officer-entered context: ${JSON.stringify(input.basic || {})}. Processed source records: ${corpus}` }], { json: true, system: prompt });
          const extracted = entries.parse(JSON.parse(reply));
          const conflicts = new Set<AffidavitField>();
          for (const item of extracted.fields) {
            const source = evidence.find(doc => doc.id === item.sourceId && doc.text?.includes(item.quote));
            if (!source || conflicts.has(item.field)) continue;
            if (sources[item.field]) {
              if (fields[item.field] !== item.quote) {
                delete sources[item.field];
                delete fields[item.field];
                conflicts.add(item.field);
              }
              continue;
            }
            fields[item.field] = item.quote;
            sources[item.field] = { id: source.id, name: source.name };
          }
          const chronology = new Set<string>();
          for (const item of extracted.chronology || []) {
            const source = evidence.find(doc => doc.id === item.sourceId && doc.text?.includes(item.quote));
            if (source && !fields.facts?.includes(item.quote) && !input.basic?.facts?.includes(item.quote)) {
              chronology.add(`Source: ${source.name}\n${item.quote}`);
            }
          }
          if (chronology.size) draftBlocks.push({ heading: 'Material developments on record', text: Array.from(chronology).join('\n\n').slice(0, 60000), table: '', afterFacts: true });
          if (conflicts.size) warning = `Conflicting source values need review: ${Array.from(conflicts, key => affidavitLabels[key]).join(', ')}.`;
        } catch { warning = 'Document autofill was unavailable. Saved case fields can still be used.'; }
      }
      return Response.json({ fields, draftFields, draftBlocks, sources, documents, warning, promptVersion });
    }

    const valid = input.kind === 'bail' ? bailReplyTypes : statusReportTypes;
    if (!Object.hasOwn(valid, input.category)) return Response.json({ error: 'Select a valid document type.' }, { status: 400 });
    if (input.category === 'OTHER' && !input.affidavit.customType) return Response.json({ error: 'Enter the custom document type.' }, { status: 400 });
    const id = input.id || randomUUID();
    const file = recordPath(user.id, input.kind, id);
    const previous = await readRecord(file);
    if (previous?.record.affidavit?.firId && previous.record.affidavit.firId !== linked.key) return Response.json({ error: 'This document is linked to another case.' }, { status: 409 });
    const f = input.affidavit.fields;
    const evidence = await savedCaseEvidence(caseIds, user);
    const sourceMap = new Map(evidence.map(source => [source.id, source]));
    const sources: CourtAffidavit['sources'] = {};
    for (const key of Object.keys(input.affidavit.sources) as AffidavitField[]) {
      const origin = input.affidavit.sources[key];
      const value = f[key];
      if (!origin || !value) continue;
      const source = sourceMap.get(origin.id);
      if (source?.text?.includes(value)) sources[key] = { id: source.id, name: source.name };
      else if (!origin.id && firFields[key] === value) sources[key] = { id: '', name: linked.module === 'FIR' ? 'Saved FIR' : 'Saved complaint' };
    }
    const annexures = input.affidavit.annexures.map(row => ({ ...row, sourceId: row.sourceId && sourceMap.has(row.sourceId) ? row.sourceId : undefined }));
    const common = { id, affidavit: { ...input.affidavit, sources, annexures, customType: input.category === 'OTHER' ? input.affidavit.customType : undefined }, firNumber: linked.module === 'FIR' ? f.fir || linked.reference : '', policeStation: f.station || '', courtName: f.court || '', hearingDate: f.hearing || '', submissionDate: f.date || '' };
    const record: BailReplyRecord | CourtStatusReportRecord = input.kind === 'bail' ? {
      ...common, applicationNo: f.petition || '', applicantAccusedName: f.petitioner || '', fatherName: f.father,
      bailType: input.category as BailReplyRecord['bailType'], ipcOrBnsSections: f.sections || '',
      status: previous && 'status' in previous.record ? previous.record.status : 'DRAFT',
      groundsOfOpposition: (f.grounds || '').split('\n').filter(Boolean), ioCaseSummary: f.facts || '',
      antecedentsDetails: f.antecedents || '', submittedByOfficer: f.deponent || '',
    } : {
      ...common, reportRefNo: f.memo || '', caseTitle: [f.petitioner, f.respondent].filter(Boolean).join(' vs '),
      petitionNumber: f.petition || '', reportType: input.category as keyof typeof statusReportTypes,
      keyEvidenceCollected: f.facts || '', accusedStatus: f.custody || '', policePrayer: f.prayer || '', submittedBy: f.deponent || '',
    };
    await fs.mkdir(directory(user.id), { recursive: true });
    const temp = file + '.' + randomUUID() + '.tmp';
    try {
      await fs.writeFile(temp, JSON.stringify({ kind: input.kind, record } satisfies Stored), { mode: 0o600 });
      await fs.rename(temp, file);
    } finally { await fs.rm(temp, { force: true }); }
    return Response.json({ record });
  } catch {
    return Response.json({ error: 'Court document could not be processed. Please retry.' }, { status: 503 });
  }
}

export async function DELETE(req: Request) {
  const user = apiAccess(req);
  if (user instanceof Response) return user;
  const params = new URL(req.url).searchParams;
  const kind = kinds.safeParse(params.get('kind'));
  const id = params.get('id');
  if (!kind.success || !id) return Response.json({ error: 'Invalid court document.' }, { status: 400 });
  const file = recordPath(user.id, kind.data, id);
  const saved = await readRecord(file);
  if (!saved) return Response.json({ deleted: false });
  if (!saved.record.affidavit || !await courtCase(saved.record.affidavit.firId, user)) return Response.json({ error: 'Case access denied.' }, { status: 403 });
  await fs.rm(file, { force: true });
  return Response.json({ deleted: true });
}
