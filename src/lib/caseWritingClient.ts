import type { InvestigationSummaryReport, LegalAnalysisReport } from '@/types';

type CaseWritingInput = {
  module: 'FIR' | 'COMPLAINT';
  caseId: string;
  title?: string;
  language?: "hi" | "en";
};

async function caseWriting(input: CaseWritingInput & { purpose: 'legal' | 'document' | 'report' | 'summary' }) {
  const response = await fetch('/api/case-writing', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'AI drafting failed.');
  return result;
}

export async function writeCaseDraft(input: CaseWritingInput & { purpose: 'document' | 'report' }): Promise<string> {
  return (await caseWriting(input)).text;
}

export async function analyzeCaseLaw(input: CaseWritingInput): Promise<LegalAnalysisReport> {
  return (await caseWriting({ ...input, purpose: 'legal' })).report;
}

export async function summarizeCase(input: CaseWritingInput): Promise<
  Pick<InvestigationSummaryReport, 'caseSynopsis' | 'workDoneSummary' | 'pendingWorkSummary' | 'generatedBy'>
> {
  const result = await caseWriting({ ...input, purpose: 'summary' });
  return { ...result.summary, generatedBy: `OpenRouter (${result.modelUsed}) & CMS Intelligence` };
}

export async function translateCaseDraft(fields: string[], language: 'hi' | 'en'): Promise<string[]> {
  const unique = [...new Set(fields.filter(value => value.trim()))];
  const translated = new Map<string, string>();
  const batches: string[][] = [];
  let batch: string[] = [];
  let size = 0;
  for (const field of unique) {
    if (batch.length && (size + field.length > 6000 || batch.length >= 25)) {
      batches.push(batch); batch = []; size = 0;
    }
    batch.push(field); size += field.length;
  }
  if (batch.length) batches.push(batch);
  let cursor = 0;
  await Promise.all(Array.from({ length: Math.min(2, batches.length) }, async () => {
    while (cursor < batches.length) {
      const values = batches[cursor++];
      const result = await translateBatch(values, language);
      values.forEach((value, index) => translated.set(value, result[index]));
    }
  }));
  return fields.map(value => translated.get(value) ?? value);
}

async function translateBatch(fields: string[], language: 'hi' | 'en'): Promise<string[]> {
  const response = await fetch('/api/case-writing', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(170000),
    body: JSON.stringify({ purpose: 'translate-draft', fields, language }),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Draft translation failed.');
  if (!Array.isArray(result.fields) || result.fields.length !== fields.length ||
      result.fields.some((value: unknown) => typeof value !== 'string' || !value.trim())) {
    throw new Error('Translation was incomplete. Your original draft has been kept; please retry.');
  }
  return result.fields;
}
