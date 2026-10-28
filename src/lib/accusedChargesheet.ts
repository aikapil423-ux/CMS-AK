import { z } from 'zod';
import type { FIRItem } from '@/types';
import type { UniversalEvidenceRecord } from '@/types/evidence';
import { savedArrestForm } from '@/lib/iifIIIAccused';

const text = z.string().max(10000);
const date = text.refine(value => !value || (/^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value), 'Enter a valid date.');
function normalizedValue(path: string, value: unknown): string {
  const raw = String(value ?? '').trim();
  if (path.endsWith('.gender')) return ({ male: 'Male', female: 'Female', transgender: 'Transgender', other: 'Other' } as Record<string, string>)[raw.toLowerCase()] || raw;
  if (/\.(arrestDate|bailDate|courtForwardedDate|passportIssueDate|dob)$/.test(path)) {
    const match = /^(\d{2})[/-](\d{2})[/-](\d{4})$/.exec(raw);
    const result = match ? `${match[3]}-${match[2]}-${match[1]}` : raw.slice(0, 10);
    return date.safeParse(result).success ? result : '';
  }
  if (/\.(ageYears|ageMonths|birthYear|ageFrom|ageTo)$/.test(path) && !/^\d+$/.test(raw)) return '';
  return raw;
}
export const addressFields = ['addressLine', 'houseNo', 'street', 'colony', 'city', 'tehsil', 'country', 'state', 'district', 'policeStation', 'pincode'] as const;
export const personFields = ['uid', 'npr', 'firstName', 'middleName', 'lastName', 'gender', 'relation', 'relativeName', 'dob', 'birthYear', 'ageYears', 'ageMonths', 'ageFrom', 'ageTo', 'religion', 'category', 'occupation', 'nationality', 'passportIssueDate', 'passportIssuePlace'] as const;
const strings = (keys: readonly string[]) => z.object(Object.fromEntries(keys.map(key => [key, text])));
const identitySchema = z.object({ nationality: text, type: text, number: text });
const personSchema = z.object({
  information: strings(personFields), presentAddress: strings(addressFields), permanentAddress: strings(addressFields),
  identifications: z.array(identitySchema).max(100),
});
export const accusedChargesheetSchema = z.object({
  autoFilled: z.record(z.string().max(300), z.string().max(300)).optional(),
  general: z.object({ status: text.trim().min(1), regularCrimeNo: text, arrestDate: date, bailDate: date, courtForwardedDate: date, verified: z.enum(['', 'Yes', 'No']).refine(value => value !== '', 'Select whether verified.') }),
  convictions: z.array(z.object({ firNo: text, state: text, district: text, policeStation: text, description: text, outcome: text })).max(100),
  acts: z.array(z.object({ selected: z.boolean(), act: text, sections: text })).max(500),
  personal: personSchema, bailer: personSchema,
});
export type AccusedChargesheetDetails = z.input<typeof accusedChargesheetSchema>;

const blanks = (keys: readonly string[]): Record<string, string> => Object.fromEntries(keys.map(key => [key, '']));
export function emptyChargesheetPerson(): AccusedChargesheetDetails['personal'] {
  return { information: blanks(personFields), presentAddress: blanks(addressFields), permanentAddress: blanks(addressFields), identifications: [] };
}
export function initialAccusedChargesheet(fir: FIRItem, row: { accusedId: string; name: string; relation: string; relativeName: string; status: string }): AccusedChargesheetDetails {
  const source = fir.accusedList?.find((person, index) => (person.id || `${fir.id}-accused-${index + 1}`) === row.accusedId);
  const personal = emptyChargesheetPerson();
  personal.information.firstName = row.name;
  personal.information.relation = row.relation;
  personal.information.relativeName = row.relativeName;
  if (source) {
    const record = source as unknown as Record<string, unknown>;
    for (const [key, sourceKey] of Object.entries({ gender: 'gender', dob: 'dob', ageYears: 'age', occupation: 'occupation', nationality: 'nationality', uid: 'uid', npr: 'npr', birthYear: 'yearOfBirth', religion: 'religion', category: 'category' })) {
      if (record[sourceKey] != null) personal.information[key] = normalizedValue(`personal.information.${key}`, record[sourceKey]);
    }
    personal.presentAddress.addressLine = source.address || '';
  }
  const result: AccusedChargesheetDetails = {
    general: { status: row.status || source?.custodyStatus || '', regularCrimeNo: '', arrestDate: normalizedValue('general.arrestDate', source?.arrestDate), bailDate: '', courtForwardedDate: '', verified: '' },
    convictions: [],
    acts: fir.actsAndSectionsList?.map(entry => ({ selected: true, act: entry.act, sections: entry.sections })) || (fir.actsAndSections ? [{ selected: true, act: fir.majorAct || '', sections: fir.actsAndSections }] : []),
    personal, bailer: emptyChargesheetPerson(),
  };
  const autoFilled: Record<string, string> = {};
  if (source) {
    for (const [key, value] of Object.entries(personal.information)) if (value) autoFilled[`personal.information.${key}`] = 'FIR';
    if (source.address) autoFilled['personal.presentAddress.addressLine'] = 'FIR';
    if (result.general.status) autoFilled['general.status'] = 'FIR';
    if (result.general.arrestDate) autoFilled['general.arrestDate'] = 'FIR';
  }
  result.acts.forEach((act, index) => { if (act.act) autoFilled[`acts.${index}.act`] = 'FIR'; if (act.sections) autoFilled[`acts.${index}.sections`] = 'FIR'; });
  result.autoFilled = autoFilled;
  const arrest = savedArrestForm(fir, row.accusedId);
  if (arrest?.arrestFormData) {
    const form = arrest.arrestFormData;
    const fill = (path: string, key: string) => {
      const value = form[key]; if (value == null || String(value).trim() === '') return;
      const keys = path.split('.');
      const target = keys.slice(0, -1).reduce<unknown>((current, part) => (current as Record<string, unknown>)[part], result) as Record<string, unknown>;
      const raw = normalizedValue(path, value); if (!raw) return;
      target[keys[keys.length - 1]] = raw;
      autoFilled[path] = arrest.id;
    };
    for (const [key, sourceKey] of Object.entries({ firstName: 'noticeeName', relativeName: 'noticeeFather', gender: 'accusedGender', ageYears: 'noticeeAge', occupation: 'occupation', nationality: 'nationality', religion: 'religion', category: 'casteCategory', passportIssueDate: 'passportIssueDate', passportIssuePlace: 'passportIssuePlace', uid: 'userIdentificationNo' })) fill(`personal.information.${key}`, sourceKey);
    for (const [path, key] of Object.entries({ 'general.arrestDate': 'arrestDate', 'personal.presentAddress.addressLine': 'noticeeAddress', 'personal.presentAddress.city': 'noticeeCity', 'personal.presentAddress.district': 'noticeeDistrict', 'personal.presentAddress.state': 'noticeeState', 'personal.permanentAddress.addressLine': 'permanentAddress', 'personal.permanentAddress.city': 'permanentCity', 'personal.permanentAddress.district': 'permanentDistrict', 'personal.permanentAddress.state': 'permanentState' })) fill(path, key);
    if (form.passportNo) {
      result.personal.identifications.push({ nationality: String(form.nationality || ''), type: 'Passport', number: String(form.passportNo) });
      autoFilled['personal.identifications.0.type'] = arrest.id; autoFilled['personal.identifications.0.number'] = arrest.id;
    }
  }
  return result;
}

/** Reuse only same-case, completed, unflagged evidence for the exact accused.
 * Conflicting values remain blank for the officer to review. */
export function autofillAccusedChargesheet(current: AccusedChargesheetDetails, fir: FIRItem, row: { accusedId: string; name: string }, records: UniversalEvidenceRecord[], touched: ReadonlySet<string> = new Set()): AccusedChargesheetDetails {
  const next = structuredClone(current);
  const candidates = new Map<string, Array<{ value: string; source: string }>>();
  const normalized = (value: string) => value.trim().toLowerCase().replace(/\s+/g, ' ');
  const add = (path: string, value: unknown, source: string) => {
    if (value == null || String(value).trim() === '') return;
    const values = candidates.get(path) || [];
    const normalized = normalizedValue(path, value); if (!normalized) return;
    values.push({ value: normalized, source }); candidates.set(path, values);
  };
  for (const evidence of records) {
    if (![fir.id, fir.sourceComplaintId].filter(Boolean).includes(evidence.caseId) || evidence.processingStatus !== 'COMPLETED' || evidence.verificationStatus === 'FLAGGED_FOR_REVIEW') continue;
    const persons = (evidence.structuredData?.persons || []).filter(person => person.role === 'Accused');
    const matches = persons.filter(person => person.id === row.accusedId || (row.name.trim() && normalized(person.name) === normalized(row.name)));
    if (matches.length > 1) continue;
    const person = matches[0];
    if (person) {
      for (const [target, source] of Object.entries({ relativeName: 'relativeName', relation: 'relationType', gender: 'gender', ageYears: 'age' })) add(`personal.information.${target}`, person[source as keyof typeof person], evidence.id);
      for (const key of ['address', 'city', 'district', 'state'] as const) add(`personal.presentAddress.${key === 'address' ? 'addressLine' : key}`, person[key], evidence.id);
    }
    const accused = (evidence.structuredData?.accusedList || []).filter(person => person.id === row.accusedId || (row.name.trim() && normalized(person.name) === normalized(row.name)));
    if (accused.length === 1) add('personal.presentAddress.addressLine', accused[0].address, evidence.id);
  }
  for (const [path, values] of candidates) {
    if (touched.has(path) || new Set(values.map(item => normalized(item.value))).size !== 1) continue;
    const keys = path.split('.');
    const target = keys.slice(0, -1).reduce<unknown>((value, key) => (value as Record<string, unknown>)[key], next) as Record<string, unknown>;
    if (target[keys[keys.length - 1]]) continue;
    target[keys[keys.length - 1]] = values[0].value;
    next.autoFilled = { ...next.autoFilled, [path]: values[0].source };
  }
  return next;
}
