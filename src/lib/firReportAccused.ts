import type { FIRItem } from '@/types';
import type { UniversalEvidenceRecord } from '@/types/evidence';

export type FirReportAccused = { accusedId: string; name: string; relation: string; relativeName: string; status: string; action: string; source: string };
export function firReportAccused(fir: FIRItem, records: UniversalEvidenceRecord[] = []): FirReportAccused[] {
  const normalized = (name: string) => name.trim().toLowerCase().replace(/\s+/g, ' ');
  const rows = (fir.accusedList || []).map((person, index) => ({ accusedId: person.id || `${fir.id}-accused-${index + 1}`, name: person.name || '', relation: person.fatherName ? 'Father' : '', relativeName: person.fatherName || person.relativeName || '', status: person.custodyStatus || '', action: '', source: 'FIR' }));
  for (const [index, person] of ((fir.crimeDetailsData?.accusedSuspects || []) as Array<Record<string, unknown>>).entries()) {
    const name = typeof person.name === 'string' ? person.name : '';
    if (!name.trim() || rows.some(row => normalized(row.name) === normalized(name))) continue;
    rows.push({ accusedId: typeof person.id === 'string' ? person.id : `${fir.id}-crime-accused-${index}`, name, relation: typeof person.relationType === 'string' ? person.relationType : '', relativeName: typeof person.relativeName === 'string' ? person.relativeName : '', status: typeof person.custodyStatus === 'string' ? person.custodyStatus : '', action: '', source: 'FIR IIF-II' });
  }
  for (const record of records) {
    if (![fir.id, fir.sourceComplaintId].filter(Boolean).includes(record.caseId) || record.processingStatus !== 'COMPLETED' || record.verificationStatus === 'FLAGGED_FOR_REVIEW') continue;
    const people = [...(record.structuredData?.accusedList || []), ...(record.structuredData?.persons || []).filter(person => person.role === 'Accused')];
    for (const [index, person] of people.entries()) {
      if (!person.name?.trim()) continue;
      if (rows.some(row => (person.id && row.accusedId === person.id) || normalized(row.name) === normalized(person.name))) continue;
      rows.push({ accusedId: person.id || `processed-${record.id}-accused-${index}`, name: person.name, relation: 'relationType' in person ? person.relationType || '' : '', relativeName: 'relativeName' in person ? person.relativeName || '' : '', status: '', action: '', source: record.id });
    }
  }
  return rows;
}

export type FirReportWitness = { selected: boolean; name: string; relation: string; relativeName: string; dob: string; occupation: string; evidence: string; address: string; statement: string; source: string };
export function firReportWitnesses(fir: FIRItem, records: UniversalEvidenceRecord[] = []): FirReportWitness[] {
  const rows: FirReportWitness[] = [];
  const add = (person: Record<string, unknown>, source: string) => {
    const text = (...keys: string[]) => keys.map(key => person[key]).find(value => typeof value === 'string' && value.trim()) as string || '';
    const name = text('name', 'witnessName');
    if (!name.trim() || rows.some(row => row.name.trim().toLowerCase() === name.trim().toLowerCase())) return;
    rows.push({ selected: false, name, relation: text('relationType', 'relation'), relativeName: text('relativeName', 'fatherName'), dob: text('dob'), occupation: text('occupation'), evidence: text('evidence', 'role'), address: text('address'), statement: text('statement', 'statementBrief'), source });
  };
  const data = fir as unknown as Record<string, unknown>;
  for (const key of ['witnessList', 'witnessesList', 'witnesses', 'arrestWitnesses']) {
    if (Array.isArray(data[key])) for (const person of data[key]) if (person && typeof person === 'object') add(person, 'FIR');
  }
  if (Array.isArray(fir.crimeDetailsData?.witnesses)) for (const person of fir.crimeDetailsData.witnesses) if (person && typeof person === 'object') add(person, 'FIR IIF-II');
  for (const record of records) {
    if (![fir.id, fir.sourceComplaintId].filter(Boolean).includes(record.caseId) || record.processingStatus !== 'COMPLETED' || record.verificationStatus === 'FLAGGED_FOR_REVIEW') continue;
    for (const person of record.structuredData?.witnessList || []) add(person as unknown as Record<string, unknown>, record.id);
    for (const person of record.structuredData?.persons || []) if (person.role === 'Witness') add(person as unknown as Record<string, unknown>, record.id);
  }
  return rows;
}
