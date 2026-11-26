import { readEvidenceStore } from "@/services/processedEvidenceStore";
import { canReadCaseEvidence } from '@/services/evidenceCaseAccess';
import type { UserSession } from '@/types';
import type { UniversalEvidenceRecord } from '@/types/evidence';
import { readComplaints } from '@/services/complaintRepository';
import { canViewComplaint } from '@/utils/complaintPermissions';

export async function savedCaseEvidence(caseIds: string[], user: UserSession) {
  const saved = await readEvidenceStore();
  const matching = saved.filter(record => record.processingStatus === 'COMPLETED' && record.caseId && caseIds.includes(record.caseId));
  const allowed = await Promise.all(matching.map(record => canReadCaseEvidence(user, record)));
  const documents = matching.filter((_, index) => allowed[index]).map(record => ({
    id: record.id,
    name: record.rawDocument.fileName,
    text: record.extractedText,
    incident: record.structuredData?.incident,
  }));
  const complaints = (await readComplaints()).filter(c => caseIds.includes(c.id) && canViewComplaint(user, c).allowed);
  for (const complaint of complaints) {
    for (const record of complaint.processedDocuments || []) {
      if (!record?.rawDocument?.rawExtractedText || !record.processedData) continue;
      if (documents.some(d => d.id === record.id)) continue;
      documents.push({ id: record.id, name: record.rawDocument.fileName,
        text: record.rawDocument.rawExtractedText, incident: record.processedData.incident });
    }
  }
  return documents;
}
