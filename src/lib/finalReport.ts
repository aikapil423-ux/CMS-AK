import type { ComplaintReportItem, FIRItem } from '@/types';
import { generateIIFVChargesheetHtml } from '@/utils/iifvChargesheetGenerator';

export interface FinalReportData {
  schemaVersion: 1;
  reportNo: string;
  reportDate: string;
  formType: string;
  chargeSheetType: string;
  finalReportReason: string;
  finalReportReasonDetails: string;
  judicialCustody: string;
  pendingAccused: string;
  pendingDocuments: string;
  limitationPeriod: string;
  investigationStatus: string;
  dispatchDate: string;
  courtType: string;
  judgeName: string;
  caseType: string;
  labAnalysis: string;
  briefFacts: string;
  prosecutorApproved: string;
  approvalDate: string;
  noticeServed: string;
  noticeDate: string;
  enclosureNotes: string;
  accused: Array<{ accusedId: string; name: string; relation: string; relativeName: string; action: string; status: string }>;
  witnesses: Array<{ selected: boolean; name: string; relation: string; relativeName: string; dob: string; occupation: string; evidence: string; address: string; statement: string }>;
  properties: Array<{ type: string; description: string; value: string; recoveredFrom: string; disposal: string }>;
  enclosures: Array<{ selected: boolean; fileName: string; module: string; registrationNo: string; date: string; documentId?: string }>;
}

export function initialFinalReport(fir: FIRItem): FinalReportData {
  return {
    schemaVersion: 1, reportNo: '', reportDate: new Date().toLocaleDateString('en-CA'),
    formType: 'CHARGESHEET', chargeSheetType: '', finalReportReason: '', finalReportReasonDetails: '', judicialCustody: '', pendingAccused: '', pendingDocuments: '',
    limitationPeriod: '', investigationStatus: '', dispatchDate: '', courtType: '', judgeName: '', caseType: fir.caseType || '',
    labAnalysis: '', briefFacts: fir.briefFacts || fir.incidentDetails || '', prosecutorApproved: '', approvalDate: '', noticeServed: '', noticeDate: '', enclosureNotes: '',
    accused: (fir.accusedList || []).map((a, i) => ({ accusedId: a.id || `${fir.id}-accused-${i + 1}`, name: a.name || '', relation: a.fatherName ? 'Father' : '', relativeName: a.fatherName || a.relativeName || '', action: '', status: a.custodyStatus || '' })),
    witnesses: [],
    properties: (fir.propertiesList || []).map(p => ({ type: p.propertyType, description: p.description, value: p.estimatedValue == null ? '' : String(p.estimatedValue), recoveredFrom: '', disposal: p.status || '' })),
    enclosures: (fir.documents || []).map(d => ({ selected: false, documentId: d.id, fileName: d.fileName || d.title, module: d.category, registrationNo: '', date: d.uploadedAt?.slice(0, 10) || '' })),
  };
}

export function validateFinalReport(data: FinalReportData): string[] {
  const errors: string[] = [];
  const required = { reportNo: 'Report number', reportDate: 'Report date', formType: 'Type of final form', judicialCustody: 'Judicial custody', pendingAccused: 'Pending accused count', pendingDocuments: 'Pending documents', investigationStatus: 'Investigation status', courtType: 'Court type', judgeName: 'Name of judge', caseType: 'Case type', briefFacts: 'Brief facts', prosecutorApproved: 'Public prosecutor approval', noticeServed: 'Refer notice served' } as const;
  for (const [key, label] of Object.entries(required)) if (!data[key as keyof typeof required].trim()) errors.push(`${label} is required.`);
  if (data.pendingAccused && !/^\d+$/.test(data.pendingAccused)) errors.push('Pending accused count must be a whole number.');
  if (data.formType === 'CHARGESHEET' && !data.chargeSheetType) errors.push('Chargesheet / challan type is required.');
  if (data.formType !== 'CHARGESHEET' && (!data.finalReportReason.trim() || !data.finalReportReasonDetails.trim())) errors.push('Final report reason and details are required.');
  if (data.prosecutorApproved === 'Yes' && !data.approvalDate) errors.push('Date of approval is required.');
  if (data.noticeServed === 'Yes' && !data.noticeDate) errors.push('Date of sending notice is required.');
  if (data.accused.some(a => !a.name.trim() || !a.action)) errors.push('Select an action for each named accused.');
  if (data.witnesses.some(w => w.selected && (!w.name.trim() || !w.evidence.trim()))) errors.push('Selected witnesses need a name and type of evidence.');
  if (data.enclosures.some(e => e.selected && !e.fileName.trim())) errors.push('Selected enclosures need a file name.');
  return errors;
}

const escape = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
export function toStatutoryFinalReport(fir: FIRItem, data: FinalReportData) {
  const actRows = [{ sNo: 1, act: fir.majorAct || '—', sections: fir.actsAndSections || '—' }];
  return {
    court: `${data.courtType} — ${data.judgeName}`, district: fir.district, ps: fir.policeStation,
    year: String(fir.firYear || ''), firNo: fir.firNumber, firDate: fir.firDate,
    reportNo: data.reportNo, reportDate: data.reportDate, actRows, finalFormType: data.formType === 'CHARGESHEET' ? data.formType : `${data.formType} — ${data.finalReportReason}: ${data.finalReportReasonDetails}`,
    ifFirUnoccurred: '—', ifChargeSheet: data.formType === 'CHARGESHEET' ? data.chargeSheetType : '—', ioName: fir.assignedIoName || '—', ioRank: fir.assignedIoRank || '—', ioNo: '—',
    complainantName: fir.complainantName, complainantFather: fir.complainantRelativeName || fir.complainantFatherSpouse || '—',
    propertyRows: data.properties.map((p, i) => ({ sNo: i + 1, propertyDescription: `${p.type}: ${p.description}`, estimatedValue: p.value, psPropertyRegisterNo: '', fromWhomWhereRecovered: p.recoveredFrom, disposal: p.disposal })),
    accusedPersonList: data.accused.filter(a => a.action === 'ChargeSheeted').map((a, i) => ({
      sNo: i + 1, name: a.name, whetherVerified: '', husbandFatherName: a.relativeName,
      dateOrYearOfBirth: '', sex: '', nationality: '', passportNo: '', passportDateOfIssue: '', passportPlaceOfIssue: '', religion: '', scStObc: '', occupation: '',
      addresses: [{sNo: 1, addressType: '', address: fir.accusedList.find(x => x.name === a.name)?.address || '', whetherVerified: ''}],
      regularCriminalNo: '', dateOfArrest: '', dateOfReleaseOnBail: '', dateForwardedToCourt: '', underActsSections: actRows,
      bailerName: '', bailerFatherHusbandName: '', bailerOccupation: '', bailerAddresses: [] as Array<{sNo:number;addressType:string;address:string}>,
      identificationDob: '', identificationUid: '', otherIdProofs: [] as Array<{sNo:number;idType:string;idNumber:string}>,
      previousConvictions: [] as Array<{sNo:number;firNo:string;state:string;district:string;policeStation:string;descriptionOfCase:string;convictionAcquittal:string}>, statusOfAccused: a.status,
    })),
    accusedNotChargeSheeted: data.accused.filter(a => a.action === 'Not ChargeSheeted').map(a => `${a.name} (${a.relation}: ${a.relativeName}) — ${a.status}`).join('\n') || '—',
    witnessesList: data.witnesses.filter(w => w.selected).map((w,i) => `${i+1}. ${w.name} (${w.relation}: ${w.relativeName}) | DOB: ${w.dob} | ${w.occupation} | Evidence: ${w.evidence} | ${w.address} | ${w.statement}`).join('\n') || '—',
    falseFirAction: data.formType !== 'CHARGESHEET' && data.finalReportReason === 'False complaint' ? data.finalReportReasonDetails : '—', labAnalysis: data.labAnalysis || '—',
    briefFacts: `${data.briefFacts}\n\nInvestigation status: ${data.investigationStatus}\nJudicial custody: ${data.judicialCustody}\nAccused pending arrest / role verification: ${data.pendingAccused}\nPending documents: ${data.pendingDocuments}\nLimitation period: ${data.limitationPeriod || '—'}\nCase type: ${data.caseType}\nApproved by Public Prosecutor: ${data.prosecutorApproved}${data.prosecutorApproved === 'Yes' ? `; Date: ${data.approvalDate}` : ''}`,
    referNoticeServed: data.noticeServed, referNoticeDate: data.noticeServed === 'Yes' ? data.noticeDate : '', referNoticeAck: '', despatchedOn: data.dispatchDate,
    noOfEnclosures: String(data.enclosures.filter(e => e.selected).length),
    listOfEnclosures: [data.enclosureNotes, ...data.enclosures.filter(e => e.selected).map((e,i) => `${i+1}. ${e.fileName} | ${e.module} | Reg No: ${e.registrationNo} | Date: ${e.date}`)].filter(Boolean).join('\n') || '—',
    shoName: '', shoRank: '', shoNo: '',
  };
}

export function finalReportHtml(fir: FIRItem, data: FinalReportData): string {
  // Escape strings at the generator boundary; the shared JSX preview escapes them through React.
  const escaped = JSON.parse(JSON.stringify(toStatutoryFinalReport(fir, data)), (_key, value) => typeof value === 'string' ? escape(value) : value);
  return generateIIFVChargesheetHtml(escaped);
}

export function buildFinalReport(fir: FIRItem, data: FinalReportData, author: { id: string; name: string }, existing?: ComplaintReportItem, previewHtml?: string): ComplaintReportItem {
  const errors = validateFinalReport(data);
  if (errors.length) throw new Error(errors.join(' '));
  const html = previewHtml || finalReportHtml(fir, data);
  const now = new Date().toISOString();
  return {
    ...existing, id: existing?.id || `final-${typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`}`, complaintId: fir.id,
    title: `Final Report / IIF-V — ${data.reportNo}`, reportType: data.formType, reportTypeLabel: 'Final Report (IIF-V)',
    dispatchNo: data.reportNo, generatedDate: data.reportDate, officerName: author.name, createdBy: existing?.createdBy || author.id,
    createdAt: existing?.createdAt || now, updatedAt: now, lastModifiedBy: author.id,
    content: data.briefFacts, conclusionSummary: data.briefFacts, contentHtml: html,
    finalReportData: structuredClone(data), fileName: `Final_Report_${data.reportNo.replace(/[^a-z0-9_-]/gi, '_')}.html`,
    dataUrl: `data:text/html;charset=utf-8,${encodeURIComponent(html)}`, fileFormat: 'HTML', status: 'Finalized',
    sentToSho: false, isSentToSho: false, sentToShoAt: undefined, sentToShoBy: undefined,
    finalReportWorkflow: { state: 'SAVED' },
    versionNumber: (existing?.versionNumber || 0) + 1,
  };
}
