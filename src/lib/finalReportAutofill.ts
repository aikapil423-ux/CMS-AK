import type { FIRItem } from '@/types';
import type { UniversalEvidenceRecord } from '@/types/evidence';
import type { FinalReportData } from './finalReport';
import { initialAccusedChargesheet, autofillAccusedChargesheet } from './accusedChargesheet';
import { firReportAccused } from './firReportAccused';

export function autofillFinalReport(current: FinalReportData, fir: FIRItem, records: UniversalEvidenceRecord[], touched: ReadonlySet<string> = new Set()): FinalReportData {
  const next = structuredClone(current);
  next.autoFilled = { ...current.autoFilled };
  const normalized = (value: string) => value.trim().toLowerCase().replace(/\s+/g, ' ');
  for (const person of firReportAccused(fir, records)) {
    if (next.accused.some(row => row.accusedId === person.accusedId || normalized(row.name) === normalized(person.name))) continue;
    const index = next.accused.length;
    const { source, ...row } = person;
    next.accused.push(row);
    for (const key of ['name', 'relation', 'relativeName', 'status'] as const) if (row[key]) next.autoFilled[`accused.${index}.${key}`] = source;
  }
  for (const evidence of records) {
    if (![fir.id, fir.sourceComplaintId].filter(Boolean).includes(evidence.caseId) || evidence.processingStatus !== 'COMPLETED' || evidence.verificationStatus === 'FLAGGED_FOR_REVIEW') continue;
    const source = evidence.structuredData;
    if (!source) continue;
    const witnesses = [...(source.persons || []).filter(person => person.role === 'Witness'), ...(source.witnessList || []).map(person => ({ ...person, role: 'Witness', relativeName: '', relationType: '' }))];
    for (const person of witnesses) {
      if (person.role !== 'Witness' || !person.name.trim() || touched.has('witnesses') || next.witnesses.some(row => normalized(row.name) === normalized(person.name))) continue;
      const index = next.witnesses.length;
      next.witnesses.push({ selected: false, name: person.name, relation: person.relationType || '', relativeName: person.relativeName || '', dob: '', occupation: '', evidence: '', address: person.address || '', statement: '' });
      for (const key of ['name', 'relation', 'relativeName', 'address'] as const) if (next.witnesses[index][key]) next.autoFilled[`witnesses.${index}.${key}`] = evidence.id;
      if ('statementBrief' in person && person.statementBrief) {
        next.witnesses[index].statement = person.statementBrief;
        next.autoFilled[`witnesses.${index}.statement`] = evidence.id;
      }
    }
    for (const property of source.properties || []) {
      if (!property.description?.trim() || touched.has('properties') || next.properties.some(row => normalized(row.description) === normalized(property.description))) continue;
      const index = next.properties.length;
      const value = property.estimatedValue?.replace(/[,₹\s]/g, '') || '';
      next.properties.push({ type: property.category || '', description: property.description, value: /^\d+(\.\d+)?$/.test(value) ? value : '', recoveredFrom: '', disposal: property.status || '' });
      for (const key of ['type', 'description', 'value', 'disposal'] as const) if (next.properties[index][key]) next.autoFilled[`properties.${index}.${key}`] = evidence.id;
    }
  }
  if (!touched.has('accused')) next.accused.forEach((row, index) => {
    const details = autofillAccusedChargesheet(initialAccusedChargesheet(fir, row), fir, row, records);
    for (const [field, value, source] of [
      ['relativeName', details.personal.information.relativeName, details.autoFilled?.['personal.information.relativeName']],
      ['relation', details.personal.information.relation, details.autoFilled?.['personal.information.relation']],
      ['status', details.general.status, details.autoFilled?.['general.status']],
    ] as const) {
      if (!row[field] && value && source) { row[field] = value; next.autoFilled![`accused.${index}.${field}`] = source; }
    }
  });
  return next;
}
