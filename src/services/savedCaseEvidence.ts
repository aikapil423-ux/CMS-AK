import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { canReadCaseEvidence } from '@/services/evidenceCaseAccess';
import type { UserSession } from '@/types';
import type { UniversalEvidenceRecord } from '@/types/evidence';

export async function savedCaseEvidence(caseIds: string[], user: UserSession) {
  const file = path.join(process.cwd(), 'prisma', 'processed-evidence-store.json');
  const saved: UniversalEvidenceRecord[] = JSON.parse(await readFile(file, 'utf8').catch(error => {
    if (error.code === 'ENOENT') return '[]';
    throw error;
  }));
  const matching = saved.filter(record => record.processingStatus === 'COMPLETED' && record.caseId && caseIds.includes(record.caseId));
  const allowed = await Promise.all(matching.map(record => canReadCaseEvidence(user, record)));
  return matching.filter((_, index) => allowed[index]).map(record => ({
    id: record.id,
    name: record.rawDocument.fileName,
    text: record.extractedText,
    incident: record.structuredData?.incident,
  }));
}
