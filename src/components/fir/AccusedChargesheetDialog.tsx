"use client";

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { FIRItem } from '@/types';
import { accusedChargesheetSchema, addressFields, initialAccusedChargesheet, autofillAccusedChargesheet, type AccusedChargesheetDetails } from '@/lib/accusedChargesheet';

const tabs = ['General Information', 'Act & Sections', 'Personal Information', 'Bailer Details'];
const labels: Record<string, string> = {
  status: 'Status of Accused', regularCrimeNo: 'Regular Crime No. (if known)', arrestDate: 'Date of Arrest', bailDate: 'Date of Release on Bail', courtForwardedDate: 'Date on Which Forwarded to Court', verified: 'Whether Verified',
  uid: 'UID', npr: 'NPR', firstName: 'First Name', middleName: 'Middle Name', lastName: 'Last Name', gender: 'Gender', relation: 'Relation Type', relativeName: 'Relative Name', dob: 'Date of Birth', birthYear: 'Year of Birth', ageYears: 'Age (Years)', ageMonths: 'Age (Months)', ageFrom: 'Age Range — From', ageTo: 'Age Range — To', religion: 'Religion', category: 'Category', occupation: 'Occupation', nationality: 'Country of Nationality', passportIssueDate: 'Passport Issue Date', passportIssuePlace: 'Passport Issue Place',
  addressLine: 'Address from FIR / Processed Evidence', houseNo: 'House No.', street: 'Street Name', colony: 'Colony / Locality / Area', city: 'Village / Town / City', tehsil: 'Tehsil / Block / Mandal', country: 'Country', state: 'State', district: 'District', policeStation: 'Police Station', pincode: 'Pincode',
  firNo: 'FIR No.', description: 'Description of Case', outcome: 'Details of Conviction / Acquittal',
};
type Row = { accusedId: string; name: string; relation: string; relativeName: string; status: string; chargesheetDetails?: AccusedChargesheetDetails };

export function AccusedChargesheetDialog({ fir, accused, onSave, onClose }: { fir: FIRItem; accused: Row; onSave: (details: AccusedChargesheetDetails) => Promise<void>; onClose: () => void }) {
  const [draft, setDraft] = useState(() => structuredClone(accused.chargesheetDetails || initialAccusedChargesheet(fir, accused)));
  const [tab, setTab] = useState(0);
  const [subtab, setSubtab] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const touched = useRef(new Set<string>());
  const pending = useRef(false);
  const close = useRef(onClose); close.current = onClose;
  useEffect(() => {
    let cancelled = false;
    Promise.all([fir.id, fir.sourceComplaintId].filter(Boolean).map(async caseId => {
      const response = await fetch(`/api/evidence/store?caseId=${encodeURIComponent(caseId!)}`, { cache: 'no-store' });
      if (!response.ok) throw new Error('Processed evidence could not be loaded. FIR details are still available.');
      return (await response.json()).records || [];
    })).then(records => { if (!cancelled) setDraft(current => autofillAccusedChargesheet(current, fir, accused, records.flat(), touched.current)); })
      .catch(error => { if (!cancelled) setErrors([error.message]); });
    return () => { cancelled = true; };
  }, [fir.id, fir.sourceComplaintId, accused.accusedId]);
  const panel = useRef<HTMLElement>(null);
  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    panel.current?.focus();
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); if (!pending.current) close.current(); }
      if (event.key === 'Tab') {
        const elements = Array.from(panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled)') || []);
        if (!elements.length) return;
        const first = elements[0], last = elements[elements.length - 1];
        if (event.shiftKey && (document.activeElement === first || document.activeElement === panel.current)) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', keyboard, true);
    return () => { document.removeEventListener('keydown', keyboard, true); previousFocus?.focus(); };
  }, []);

  const get = (path: string) => path.split('.').reduce<unknown>((value, key) => (value as Record<string, unknown>)?.[key], draft);
  const set = (path: string, value: unknown) => setDraft(current => {
    touched.current.add(path);
    const next = structuredClone(current);
    const keys = path.split('.');
    const target = keys.slice(0, -1).reduce<unknown>((object, key) => (object as Record<string, unknown>)[key], next) as Record<string, unknown>;
    target[keys[keys.length - 1]] = value;
    if (next.autoFilled) delete next.autoFilled[path];
    return next;
  });
  const input = (path: string, label: string, options?: string[], required = false) => {
    const key = path.split('.').pop()!;
    const type = /Date$/.test(key) || key === 'dob' ? 'date' : /^(birthYear|ageYears|ageMonths|ageFrom|ageTo)$/.test(key) ? 'number' : 'text';
    return <label key={path} className="block space-y-1 text-sm font-medium text-slate-800">
      <span>{label}{required ? ' *' : ''}</span>
      {options ? <select title={draft.autoFilled?.[path] ? 'Auto-filled from FIR / processed data' : undefined} className={`w-full border p-2 bg-white ${draft.autoFilled?.[path] ? 'cms-autofilled' : ''}`} value={String(get(path) ?? '')} onChange={event => set(path, event.target.value)}><option value="">Select</option>{options.map(value => <option key={value}>{value}</option>)}</select>
        : <input title={draft.autoFilled?.[path] ? 'Auto-filled from FIR / processed data' : undefined} className={`w-full border p-2 bg-white ${draft.autoFilled?.[path] ? 'cms-autofilled' : ''}`} type={type} min={type === 'number' ? 0 : undefined} value={String(get(path) ?? '')} onChange={event => set(path, event.target.value)} />}
    </label>;
  };
  const address = (person: 'personal' | 'bailer', kind: 'presentAddress' | 'permanentAddress') => <fieldset className="border p-3 space-y-3" key={kind}>
    <legend className="px-1 font-semibold">{kind === 'presentAddress' ? 'Present Address' : 'Permanent Address'}</legend>
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">{addressFields.map(key => input(`${person}.${kind}.${key}`, labels[key]))}</div>
  </fieldset>;
  const person = tab === 2 ? 'personal' : 'bailer';
  const identities = draft[person].identifications;
  const personalContent = <>
    <div role="tablist" aria-label={`${tabs[tab]} sections`} className="flex flex-wrap gap-2">{['General Information', 'Address', 'Other Information'].map((name, index) => <button key={name} type="button" role="tab" aria-selected={subtab === index} className="border px-3 py-2 text-sm bg-slate-50" onClick={() => setSubtab(index)}>{name}</button>)}</div>
    {subtab === 0 && <>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">{['uid', 'npr', 'firstName', 'middleName', 'lastName', 'relativeName', 'relation', 'gender', ...(person === 'bailer' ? ['occupation'] : [])].map(key => input(`${person}.information.${key}`, labels[key], key === 'gender' ? ['Male', 'Female', 'Transgender', 'Other'] : key === 'relation' ? ['Father', 'Mother', 'Husband', 'Wife', 'Guardian', 'Other'] : undefined))}</div>
      <fieldset className="border p-3"><legend className="px-1 font-semibold">Age Panel</legend><div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">{['dob', 'birthYear', 'ageYears', 'ageMonths', 'ageFrom', 'ageTo'].map(key => input(`${person}.information.${key}`, labels[key]))}</div></fieldset>
    </>}
    {subtab === 1 && <>{address(person, 'presentAddress')}{person === 'personal' && address(person, 'permanentAddress')}</>}
    {subtab === 2 && <>
      <h3 className="font-semibold">Identification Details</h3>
      {identities.map((_row, index) => <div key={index} className="border p-3 space-y-2"><div className="grid sm:grid-cols-3 gap-3">{(person === 'bailer' ? ['nationality', 'type', 'number'] : ['type', 'number']).map(key => input(`${person}.identifications.${index}.${key}`, key === 'nationality' ? 'Country of Nationality' : key === 'type' ? 'ID Type' : 'ID No.'))}</div><button type="button" className="text-red-700 underline" onClick={() => set(`${person}.identifications`, identities.filter((_, i) => i !== index))}>Remove ID</button></div>)}
      <button type="button" className="border px-3 py-2 text-sm" onClick={() => set(`${person}.identifications`, [...identities, { nationality: '', type: '', number: '' }])}>Add ID</button>
      <div className="grid sm:grid-cols-2 gap-3">{['passportIssueDate', 'passportIssuePlace', ...(person === 'personal' ? ['religion', 'occupation', 'category', 'nationality'] : [])].map(key => input(`${person}.information.${key}`, labels[key]))}</div>
    </>}
  </>;
  const save = async () => {
    if (pending.current) return;
    const result = accusedChargesheetSchema.safeParse(draft);
    if (!result.success) { setErrors(result.error.issues.map(issue => `${issue.path.map(part => labels[String(part)] || part).join(' / ')}: ${issue.message}`)); return; }
    pending.current = true; setSaving(true); setErrors([]);
    try { await onSave(result.data); }
    catch (error) { setErrors([error instanceof Error ? error.message : 'Save failed. Please retry.']); }
    finally { pending.current = false; setSaving(false); }
  };

  return createPortal(<div className="fixed inset-0 z-[180] bg-slate-950/60 p-2 sm:p-5 flex items-center justify-center" role="dialog" aria-modal="true" aria-labelledby="accused-chargesheet-title">
    <section ref={panel} tabIndex={-1} className="w-full max-w-6xl max-h-[94dvh] bg-white flex flex-col border shadow-xl overflow-hidden">
      <header className="flex items-center justify-between gap-3 px-4 py-3 bg-[#203c88] text-white"><div><h2 id="accused-chargesheet-title" className="font-bold text-lg">Particulars of Accused — Charge Sheeted</h2><p className="text-sm text-white">{accused.name || 'Accused details'}</p></div><button type="button" disabled={saving} className="border border-white/40 px-3 py-2" onClick={onClose}>Close</button></header>
      <div inert={saving} className="overflow-y-auto p-4 space-y-4">
        <div role="tablist" aria-label="Accused chargesheet details" className="flex flex-wrap gap-2">{tabs.map((name, index) => <button key={name} type="button" role="tab" aria-selected={tab === index} className="border px-3 py-2 text-sm bg-slate-50" onClick={() => { setTab(index); setSubtab(0); }}>{name}</button>)}</div>
        {errors.length > 0 && <div role="alert" className="border border-red-300 bg-red-50 text-red-800 p-3"><ul>{errors.map((error, index) => <li key={index}>{error}</li>)}</ul></div>}
        {tab === 0 && <>
          <div className="grid sm:grid-cols-2 gap-3">{Object.keys(draft.general).map(key => input(`general.${key}`, labels[key], key === 'verified' ? ['Yes', 'No'] : key === 'status' ? Array.from(new Set([draft.general.status, 'ARRESTED', 'ABSCONDING', 'JUDICIAL_CUSTODY', 'BAIL', 'NOT ARRESTED', 'SURRENDERED'].filter(Boolean))) : undefined, key === 'status' || key === 'verified'))}</div>
          <h3 className="font-semibold">Previous Convictions with Case References</h3>
          {draft.convictions.length === 0 && <p className="text-sm text-slate-600">No records added.</p>}
          {draft.convictions.map((_row, index) => <fieldset key={index} className="border p-3 space-y-2"><legend>Case {index + 1}</legend><div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">{['firNo', 'state', 'district', 'policeStation', 'description', 'outcome'].map(key => input(`convictions.${index}.${key}`, labels[key]))}</div><button type="button" className="text-red-700 underline" onClick={() => set('convictions', draft.convictions.filter((_, i) => i !== index))}>Remove case</button></fieldset>)}
          <button type="button" className="border px-3 py-2 text-sm" onClick={() => set('convictions', [...draft.convictions, { firNo: '', state: '', district: '', policeStation: '', description: '', outcome: '' }])}>Add Previous Case</button>
        </>}
        {tab === 1 && <>
          {draft.acts.map((act, index) => <div key={index} className="border p-3 space-y-2"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={act.selected} onChange={event => set(`acts.${index}.selected`, event.target.checked)} />Include Act & Sections</label><div className="grid sm:grid-cols-2 gap-3">{input(`acts.${index}.act`, 'Act')}{input(`acts.${index}.sections`, 'Sections')}</div><button type="button" className="text-red-700 underline" onClick={() => set('acts', draft.acts.filter((_, i) => i !== index))}>Remove Act</button></div>)}
          <button type="button" className="border px-3 py-2 text-sm" onClick={() => set('acts', [...draft.acts, { selected: true, act: '', sections: '' }])}>Add Act & Sections</button>
        </>}
        {(tab === 2 || tab === 3) && personalContent}
      </div>
      <footer className="border-t px-4 py-3 flex justify-end gap-2 bg-slate-50">
        <button type="button" disabled={saving} className="border px-4 py-2 text-sm" onClick={() => { setDraft(initialAccusedChargesheet(fir, accused)); touched.current.clear(); setErrors([]); }}>Clear</button>
        <button type="button" disabled={saving} className="border px-4 py-2 text-sm" onClick={onClose}>Cancel</button>
        <button type="button" disabled={saving} className="border border-[#203c88] bg-[#203c88] text-white px-4 py-2 text-sm font-semibold" onClick={save}>{saving ? 'Saving…' : 'Save Details'}</button>
      </footer>
    </section>
  </div>, document.body);
}
