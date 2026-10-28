import type { ComplaintReportItem, FIRItem } from '@/types';
import { indiaDate } from './dataIntegrity';

/** Apply each durable report transition once, preserving later reopening decisions. */
export function applyFinalReportState(fir: FIRItem, report: ComplaintReportItem): FIRItem {
  const workflow = report.finalReportWorkflow;
  if (!workflow) return fir;
  const key = `${report.id}:${report.versionNumber}:${workflow.state}`;
  if (fir.finalReportAppliedKey === key) return fir;
  const next: FIRItem = { ...fir, finalReportAppliedKey: key, reports: [report, ...(fir.reports || []).filter(r => r.id !== report.id)] };
  if (workflow.state === 'UNDER_CHECKING') next.trackingState = 'PART_B_UNDER_CHECKING';
  if (!['COMPLETED', 'PARTIAL'].includes(workflow.state) || !workflow.chiSubmittedAt) return next;
  const data = report.finalReportData;
  if (!data) return next;
  const type = (['CHARGESHEET','CLOSURE','UNTRACED','CANCELLED'].includes(data.formType) ? data.formType : 'CLOSURE') as NonNullable<FIRItem['finalFormType']>;
  const courtName = [data.courtType, data.judgeName].filter(Boolean).join(' — ');
  const eventId = `final-report:${report.id}:${report.versionNumber}`;
  next.trackingState = workflow.state === 'COMPLETED' ? 'COMPLETED' : 'PART_B_PARTIAL';
  next.pendingChallanId = undefined;
  if (type === 'CHARGESHEET') next.challanRecords = [{ id: eventId, reportId: report.id, challanNumber: data.reportNo,
    challanType: /supplement/i.test(data.chargeSheetType) ? 'SUPPLEMENTARY' : 'INITIAL', challanMode: workflow.state === 'COMPLETED' ? 'COMPLETE' : 'PARTIAL',
    issuedAt: report.sentToShoAt || report.createdAt || workflow.chiSubmittedAt, issuedBy: report.createdBy || '', courtName,
    submittedToCourt: true, courtSubmittedAt: workflow.chiSubmittedAt, courtSubmittedBy: workflow.chiSubmittedBy, courtReceiptNo: workflow.chiNumber },
    ...(fir.challanRecords || []).filter(c => c.id !== eventId)];
  if (workflow.state === 'PARTIAL') { next.status = 'UNDER_INVESTIGATION'; return next; }
  next.status = type === 'CHARGESHEET' ? 'CHARGESHEET_FILED' : type === 'UNTRACED' ? 'UNTRACED' : type === 'CANCELLED' ? 'CANCELLED' : 'CLOSURE_REPORT_FILED';
  next.finalFormType = type;
  next.finalFormNumber = data.reportNo;
  next.finalFormDate = indiaDate(new Date(workflow.chiSubmittedAt));
  next.courtName = courtName;
  next.completionHistory = [{ id: eventId, completedAt: workflow.chiSubmittedAt, completedBy: workflow.chiSubmittedBy || '', completionType: type,
    courtName, referenceNumber: data.reportNo, summary: data.briefFacts }, ...(fir.completionHistory || []).filter(e => e.id !== eventId)];
  return next;
}
