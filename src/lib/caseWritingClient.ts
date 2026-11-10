import type { InvestigationSummaryReport, LegalAnalysisReport } from '@/types';

type CaseWritingInput = {
  module: 'FIR' | 'COMPLAINT';
  caseId: string;
  title?: string;
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
