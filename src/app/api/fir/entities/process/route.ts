import { processingAIAvailable } from "@/lib/openRouter";
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { NextRequest } from 'next/server';
import { apiAccess } from '@/lib/apiSecurity';
import { evidenceOwner } from '@/lib/evidenceOwnership';
import { authorizedAnalysisFir } from '@/services/caseAnalysisService';
import { investigationPrompts } from '@/services/investigationPromptService';
import { POST as processEvidence } from '@/app/api/evidence/process/route';
import { GET as downloadEvidence } from '@/app/api/evidence/download/route';
import type { UniversalEvidenceRecord } from '@/types/evidence';

export const runtime = 'nodejs';
export const maxDuration = 180;

export async function POST(req: NextRequest) {
  const user = await apiAccess(req); if (user instanceof Response) return user;
  try {
    const body = await req.json();
    if (typeof body.firId !== 'string') return Response.json({ error: 'FIR ID required.' }, { status: 400 });
    const fir = await authorizedAnalysisFir(body.firId, user);
    if (!fir) return Response.json({ error: 'FIR not found or access denied.' }, { status: 404 });
    if (!processingAIAvailable()) return Response.json({ jobs: [], aiAvailable: false });
    let all: UniversalEvidenceRecord[] = [];
    try { all = JSON.parse(await fs.readFile(path.join(process.cwd(), 'prisma', 'processed-evidence-store.json'), 'utf8')); }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
    const records = all.filter(e => (e.caseId === fir.id || (fir.sourceComplaintId && e.caseId === fir.sourceComplaintId)) && (user.role === 'SUPER_ADMIN' || evidenceOwner(e) === user.id));
    const audit = investigationPrompts().audit;
    const needsProcessing = records.filter(e => {
      const saved = e.structuredData?.investigation?.promptAudit;
      return e.processingStatus !== 'PROCESSING' && (e.processingStatus !== 'COMPLETED' || saved?.extractionHash !== audit.extractionHash || saved?.resolutionHash !== audit.resolutionHash);
    });
    const documents = (fir.documents || []).filter(d => d.dataUrl && !records.some(e => e.fileId === d.id || e.id === d.id));
    const jobs = [...needsProcessing.map(e => ({ id: 'evidence:' + e.id, name: e.rawDocument.fileName })), ...documents.map(d => ({ id: 'document:' + d.id, name: d.fileName }))];
    if (body.sourceId === undefined) return Response.json({ jobs, aiAvailable: true });
    if (typeof body.sourceId !== 'string') return Response.json({ error: 'Invalid source ID.' }, { status: 400 });
    const e = records.find(e => 'evidence:' + e.id === body.sourceId);
    const d = documents.find(d => 'document:' + d.id === body.sourceId);
    if (!e && !d) return Response.json({ error: 'Source not found or access denied.' }, { status: 404 });
    if (e && evidenceOwner(e) !== user.id) return Response.json({ error: 'Only the evidence owner may reprocess this document.' }, { status: 403 });
    const form = new FormData();
    form.set('fileId', e?.fileId || d!.id); form.set('fileName', e?.rawDocument.fileName || d!.fileName);
    form.set('caseId', e?.caseId || fir.id); form.set('caseNumber', e?.caseNumber || fir.firNumber); form.set('module', e?.module || 'FIR');
    form.set('deferCaseAnalysis', 'true');
    if (d?.dataUrl) form.set('dataUrl', d.dataUrl);
    else if (e) {
      if (e.rawDocument.dataUrl) form.set('dataUrl', e.rawDocument.dataUrl);
      else if (e.extractedText && (!e.rawDocument.sha256Hash || createHash('sha256').update(e.extractedText).digest('hex') === e.rawDocument.sha256Hash)) form.set('text', e.extractedText);
      else {
        const url = new URL('/api/evidence/download', req.url); url.searchParams.set('id', e.id); url.searchParams.set('type', 'original');
        const download = await downloadEvidence(new NextRequest(url, { headers: req.headers }));
        if (!download.ok) return Response.json({ error: 'Original file is unavailable. Re-upload it to extract entities.' }, { status: 422 });
        form.set('file', new File([await download.arrayBuffer()], e.rawDocument.fileName, { type: e.rawDocument.mimeType || e.rawDocument.fileType || 'application/pdf' }));
      }
    }
    const headers = new Headers(req.headers); headers.delete('content-type'); headers.delete('content-length');
    const response = await processEvidence(new NextRequest(new URL('/api/evidence/process', req.url), { method: 'POST', headers, body: form }));
    const result = await response.json();
    if (!response.ok || !result.success || !result.record?.structuredData?.investigation) return Response.json({ error: result.error || 'Entity extraction did not complete. Retry this document.' }, { status: response.ok ? 422 : response.status });
    return Response.json({ success: true, entityCount: result.record.structuredData.investigation.entities.length, promptAudit: result.record.structuredData.investigation.promptAudit });
  } catch { return Response.json({ error: 'Entity processing failed. Saved originals are retained.' }, { status: 500 }); }
}
