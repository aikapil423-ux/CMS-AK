import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { evidenceOwner } from '@/lib/evidenceOwnership';
import type { UserSession } from '@/types';
import type { UniversalEvidenceRecord } from '@/types/evidence';

export async function savedCaseEvidence(caseIds: string[], user: UserSession) {
  const file = path.join(process.cwd(), 'prisma', 'processed-evidence-store.json');
  const saved: UniversalEvidenceRecord[] = JSON.parse(await readFile(file, 'utf8').catch(error => {
    if (error.code === 'ENOENT') return '[]';
    throw error;
  }));
  return saved.filter(record =>
    record.processingStatus === 'COMPLETED' && record.caseId && caseIds.includes(record.caseId) &&
    (user.role === 'SUPER_ADMIN' || evidenceOwner(record) === user.id)
  ).map(record => ({
    id: record.id,
    name: record.rawDocument.fileName,
    text: record.extractedText,
    incident: record.structuredData?.incident,
  }));
}
