import { z } from 'zod';
import { apiAccess } from '@/lib/apiSecurity';
import { PROCESSING_MODEL, processingAIAvailable, processWithAI } from '@/lib/openRouter';
import { authorizedAnalysisFir } from '@/services/caseAnalysisService';
import { readComplaints } from '@/services/complaintRepository';
import { LegalAssistantService } from '@/services/legalAssistantService';
import { savedCaseEvidence } from '@/services/savedCaseEvidence';
import { canViewComplaint } from '@/utils/complaintPermissions';

export const runtime = 'nodejs';
export const maxDuration = 180;

const inputSchema = z.object({
  caseId: z.string().min(1).max(200),
  module: z.enum(['FIR', 'COMPLAINT']),
  purpose: z.enum(['legal', 'document', 'report', 'summary']),
  title: z.string().max(240).optional(),
  language: z.enum(["hi", "en"]).optional(),
});
const translationSchema = z.object({
  purpose: z.literal('translate-draft'),
  language: z.enum(['hi', 'en']),
  fields: z.array(z.string().max(60000)).min(1).max(500)
    .refine(fields => fields.join('').length <= 100000, 'Draft is too large to translate at once.'),
});

const summarySchema = z.object({
  caseSynopsis: z.string().trim().min(1).max(8000),
  workDoneSummary: z.string().trim().min(1).max(8000),
  pendingWorkSummary: z.string().trim().min(1).max(8000),
});

export async function POST(req: Request) {
  const user = await apiAccess(req);
  if (user instanceof Response) return user;
  const input = await req.json().catch(() => null);
  if (input?.purpose === 'translate-draft') {
    const translation = translationSchema.safeParse(input);
    if (!translation.success) return Response.json({ error: 'Draft is too large or could not be read.' }, { status: 400 });
    const { fields, language } = translation.data;
    try {
      const reply = await processWithAI([{ text: JSON.stringify(fields) }], {
        json: true, maxTokens: 16384, retryTransient: true,
        system: 'Translate only the draft strings into ' + (language === 'hi' ? 'Hindi' : 'English') +
          '. Return a JSON object with a fields array of the same length and order. Keep empty strings empty. Preserve facts, names, dates, identifiers, legal references and line breaks. Never add or remove information.',
      });
      const translated = z.object({ fields: z.array(z.string()).length(fields.length) }).parse(JSON.parse(reply)).fields;
      return Response.json({ fields: translated.map((value, index) => fields[index].trim() ? value.trim() || fields[index] : fields[index]) });
    } catch {
      return Response.json({ error: 'Draft translation could not complete. Please retry.' }, { status: 502 });
    }
  }
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) return Response.json({ error: 'Invalid case writing request.' }, { status: 400 });
  const { caseId, module, purpose, title, language } = parsed.data;

  try {
    const fir = module === 'FIR' ? await authorizedAnalysisFir(caseId, user) : null;
    const complaint = module === 'COMPLAINT'
      ? (await readComplaints()).find(row => row.id === caseId && canViewComplaint(user, row).allowed)
      : undefined;
    if (!fir && !complaint) return Response.json({ error: 'Saved case not found or access denied.' }, { status: 404 });

    const evidence = await savedCaseEvidence(fir?.sourceComplaintId ? [caseId, fir.sourceComplaintId] : [caseId], user);
    const facts = fir ? {
      number: fir.firNumber, date: fir.firDate, station: fir.policeStation, district: fir.district,
      complainant: fir.complainantName, allegations: fir.briefFacts, sectionsOnRecord: fir.actsAndSections,
      incidentPlace: fir.incidentPlace, accused: fir.accusedList?.map(row => ({ name: row.name, address: row.address })),
      diaries: fir.caseDiaries?.map(row => ({ date: row.date, summary: row.summary, details: row.details })),
    } : {
      number: complaint!.complaintNumber, station: complaint!.policeStation, district: complaint!.district,
      complainant: complaint!.complainantName, allegations: complaint!.incidentDetails || complaint!.complaintDescription,
      timeline: complaint!.timeline?.map(row => ({ title: row.title, date: row.timestamp, details: row.description })),
    };
    const source = JSON.stringify({ facts, evidence });
    if (purpose === 'legal') {
      const report = fir ? LegalAssistantService.analyzeFIRSync(fir) : LegalAssistantService.analyzeComplaintSync(complaint!);
      const localResult = (reason: string) => Response.json({
        report: { ...report, advisoryWarning: reason, summary: reason + ' The sections below are CMS rule-based suggestions for officer review.' },
        modelUsed: null,
      });
      if (source.length > 600000) return localResult('The saved sources are too large for an AI advisory.');
      if (!processingAIAvailable()) return localResult('AI advisory is unavailable with the current server settings.');
      try {
        const summary = await processWithAI([{ text: `Write a concise advisory for an investigating officer. Explain which facts support or weaken the supplied candidate provisions, and identify missing evidence. Use only the supplied provision references. Do not decide guilt, invent citations or claim an action was completed without a source. Respond in the language of the case facts.
  Candidate provisions: ${JSON.stringify(report.suggestedSections.map(item => ({ act: item.actShortName, section: item.sectionNumber, title: item.sectionTitle })))}
  Saved case sources: ${source}` }], { maxTokens: 4096, timeout: 120000, retryTransient: true });
        return Response.json({ report: { ...report, summary }, modelUsed: PROCESSING_MODEL });
      } catch (error) {
        console.warn('Legal advisory failed:', error instanceof Error ? error.message : 'Unknown error');
        const detail = error instanceof Error ? error.message : '';
        const status = /^OpenRouter processing failed \(HTTP (\d{3})\)\.$/.exec(detail)?.[1];
        return localResult(status ? 'OpenRouter could not complete the AI advisory (HTTP ' + status + ').'
          : detail === 'AI service timed out.' ? 'The AI advisory timed out.'
          : 'The AI advisory could not be completed.');
      }
    }

    if (source.length > 600000) return Response.json({ error: 'Case source is too large for a single draft. Prepare a smaller source set.' }, { status: 422 });

    if (purpose === 'summary') {
      const reply = await processWithAI([{ text: `Summarize the saved investigation in formal Hindi. Return JSON with caseSynopsis, workDoneSummary and pendingWorkSummary, each a concise string. Separate allegations from confirmed records. Mention only actions documented in the supplied sources. Describe missing details as not recorded. Do not invent actions, people or deadlines.
Saved case sources: ${source}` }], { json: true });
      return Response.json({ summary: summarySchema.parse(JSON.parse(reply)), modelUsed: PROCESSING_MODEL });
    }

    const text = await processWithAI([{ text: `Draft the factual narrative for a police ${purpose} titled ${JSON.stringify(title || 'Case draft')}. Return plain text suitable for an editable draft. ${language ? (language === "hi" ? "Write the draft in Hindi." : "Write the draft in English.") : ""} Attribute allegations and cite source names for evidence. Distinguish allegations, recorded actions and unresolved questions. Use only saved case facts. Omit missing details. Do not invent legal citations, dates, compliance, investigative actions, signatures or findings. Do not issue an order or make a legal determination.
Saved case sources: ${source}` }], { timeout: 120000, retryTransient: true });
    return Response.json({ text, modelUsed: PROCESSING_MODEL });
  } catch (error) {
    const detail = error instanceof Error ? error.message : '';
    console.warn('Case writing failed:', detail || 'Unknown error');
    if (detail === 'AI service timed out.') {
      return Response.json({ error: 'AI drafting timed out. Please retry.' }, { status: 504 });
    }
    if (/^(OpenRouter |OPENROUTER_API_KEY |AI service |External AI processing )/.test(detail)) {
      return Response.json({ error: detail }, { status: 502 });
    }
    return Response.json({ error: 'AI drafting could not complete. Please retry.' }, { status: 502 });
  }
}
