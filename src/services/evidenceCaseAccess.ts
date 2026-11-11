import { authorizedAnalysisFir } from '@/services/caseAnalysisService';
import { readComplaints } from '@/services/complaintRepository';
import { canViewComplaint } from '@/utils/complaintPermissions';
import { evidenceOwner } from '@/lib/evidenceOwnership';
import type { UserSession } from '@/types';
import type { UniversalEvidenceRecord } from '@/types/evidence';

export async function canAccessEvidenceCase(user: UserSession, record: Pick<UniversalEvidenceRecord, 'module' | 'caseId'>) {
  if (!record.caseId) return true;
  if (record.module === 'FIR') return Boolean(await authorizedAnalysisFir(record.caseId, user));
  if (record.module === 'COMPLAINTS' || record.module === 'ENQUIRY_WORKSPACE') {
    const id = record.caseId.replace(/^complaint:/, '');
    const complaint = (await readComplaints()).find(row => row.id === id);
    return Boolean(complaint && canViewComplaint(user, complaint).allowed);
  }
  return false;
}

export async function canReadCaseEvidence(user: UserSession, record: UniversalEvidenceRecord) {
  const owner = user.role === 'SUPER_ADMIN' || evidenceOwner(record) === user.id;
  if (!record.caseId) return owner;
  if (record.module === 'FIR') {
    const fir = await authorizedAnalysisFir(record.caseId, user);
    return Boolean(fir && (owner || fir.custodyUnit));
  }
  if (record.module === 'COMPLAINTS' || record.module === 'ENQUIRY_WORKSPACE') {
    const id = record.caseId.replace(/^complaint:/, '');
    const complaint = (await readComplaints()).find(row => row.id === id);
    return Boolean(complaint && (owner || complaint.custodyUnit) && canViewComplaint(user, complaint).allowed);
  }
  return false;
}
