"use client";

import React, { useEffect, useRef, useState } from 'react';
import type { ComplaintReportItem, FIRItem } from '@/types';
import { toStatutoryFinalReport, initialFinalReport, validateFinalReport, type FinalReportData } from '@/lib/finalReport';
import { finalReportClient } from '@/services/finalReportClient';
import { StatutoryFinalReportPreview } from './StatutoryFinalReportPreview';
import { getA4DocumentHtml } from '@/utils/printElement';
import { AccusedChargesheetDialog } from './AccusedChargesheetDialog';
import { autofillFinalReport } from '@/lib/finalReportAutofill';
import type { AccusedChargesheetDetails } from '@/lib/accusedChargesheet';
import type { FirReportAccused, FirReportWitness } from '@/lib/firReportAccused';
import { firService } from '@/services/firService';

const tabs = ['Final Report Information', 'Other Information', 'Property Information', 'List of Enclosure'];
const inputClass = 'w-full border border-slate-300 rounded-md p-2 text-sm bg-white text-slate-900';
const buttonClass = 'rounded-lg border px-4 py-2 text-sm font-semibold disabled:opacity-50';
type Props = { fir: FIRItem; currentUser: { id: string; name: string }; existing?: ComplaintReportItem; onClose: () => void; onSaved: (report: ComplaintReportItem) => void | Promise<void>; initialFormType?: string };

export function CctnsFinalReportModal({ fir, currentUser, existing, onClose, onSaved, initialFormType }: Props) {
  const [data, setData] = useState<FinalReportData>(() => structuredClone(existing?.finalReportData || {...initialFinalReport(fir),...(initialFormType ? {formType:initialFormType} : {})}));
  const [tab, setTab] = useState(0);
  const [editingAccused, setEditingAccused] = useState<number | null>(null);
  const touched = useRef(new Set<string>());
  useEffect(() => {
    let cancelled = false, generation = 0;
    const refresh = () => {
      const requestId = ++generation;
      if (!existing) Promise.all([fir.id, fir.sourceComplaintId].filter(Boolean).map(async caseId => {
        const response = await fetch(`/api/evidence/store?caseId=${encodeURIComponent(caseId!)}`, { cache: 'no-store' });
        if (!response.ok) throw new Error('Processed data could not be loaded. You can fill the form manually.');
        return (await response.json()).records || [];
      })).then(records => { if (!cancelled && requestId === generation) setData(current => autofillFinalReport(current, fir, records.flat(), touched.current)); })
        .catch(error => { if (!cancelled && requestId === generation) setErrors([error.message]); });
      fetch(`/api/fir/accused-chargesheet?firId=${encodeURIComponent(fir.id)}`, { cache: 'no-store' }).then(async response => {
        if (!response.ok) throw new Error('FIR persons could not be loaded. Please reopen the form to retry.');
        const result = await response.json();
        if (cancelled || requestId !== generation) return;
        setData(current => {
          const accused = [...current.accused], witnesses = [...current.witnesses], autoFilled = { ...current.autoFilled };
          const normalized = (name: string) => name.trim().toLowerCase().replace(/\s+/g, ' ');
          for (const person of (result.accused || []) as FirReportAccused[]) {
            if (accused.some(row => row.accusedId === person.accusedId || normalized(row.name) === normalized(person.name))) continue;
            const { source, ...row } = person; const index = accused.length;
            accused.push({ ...row, action: '' });
            for (const key of ['name', 'relation', 'relativeName', 'status'] as const) if (row[key]) autoFilled[`accused.${index}.${key}`] = source;
          }
          for (const person of (result.witnesses || []) as FirReportWitness[]) {
            if (witnesses.some(row => normalized(row.name) === normalized(person.name))) continue;
            const { source, ...row } = person; const index = witnesses.length;
            witnesses.push(row);
            for (const key of ['name', 'relation', 'relativeName', 'dob', 'occupation', 'evidence', 'address', 'statement'] as const) if (row[key]) autoFilled[`witnesses.${index}.${key}`] = source;
          }
          for (const draft of result.drafts as NonNullable<FIRItem['accusedChargesheetDrafts']>[string][]) {
            const index = accused.findIndex(row => row.accusedId === draft.accusedId);
            if (index < 0 || draft.revision < (accused[index].draftRevision || 0)) continue;
            accused[index] = { ...accused[index], draftRevision: draft.revision,
              ...(!existing && !touched.current.has('accused') && !accused[index].chargesheetDetails ? { chargesheetDetails: draft.chargesheetDetails } : {}),
            };
          }
          return { ...current, accused, witnesses, autoFilled };
        });
      }).catch(error => { if (!cancelled && requestId === generation) setErrors([error.message]); });
    };
    refresh();
    window.addEventListener('focus', refresh);
    window.addEventListener('cms-evidence-updated', refresh);
    const unsubscribe = firService.subscribe(refresh);
    return () => { cancelled = true; unsubscribe(); window.removeEventListener('focus', refresh); window.removeEventListener('cms-evidence-updated', refresh); };
  }, [fir.id, fir.sourceComplaintId, existing]);
  const saveAccusedDetails = async (details: AccusedChargesheetDetails) => {
    if (editingAccused === null) return;
    const index = editingAccused, row = data.accused[index];
    const name = [details.personal.information.firstName, details.personal.information.middleName, details.personal.information.lastName].filter(Boolean).join(' ') || row.name;
    const updated = { ...row, name, relation: details.personal.information.relation, relativeName: details.personal.information.relativeName, status: details.general.status, action: 'ChargeSheeted', chargesheetDetails: details };
    const response = await fetch('/api/fir/accused-chargesheet', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ firId: fir.id, expectedRevision: row.draftRevision || 0, accused: updated }) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Details were not saved. Please retry.');
    if (result.fir) firService.replaceServerRecords(firService.getAllFirs().map(record => record.id === fir.id ? result.fir : record));
    touched.current.add('accused');
    setData(current => {
      const autoFilled = { ...current.autoFilled };
      for (const [field, detailPath] of Object.entries({ name: 'personal.information.firstName', relation: 'personal.information.relation', relativeName: 'personal.information.relativeName', status: 'general.status' })) {
        const source = details.autoFilled?.[detailPath];
        if (source) autoFilled[`accused.${index}.${field}`] = source;
        else delete autoFilled[`accused.${index}.${field}`];
      }
      return { ...current, autoFilled, accused: current.accused.map((person, i) => i === index ? { ...updated, draftRevision: result.draft.revision } : person) };
    });
    setEditingAccused(null);
  };
  const [preview, setPreview] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const uploadFiles = async (event: React.ChangeEvent<HTMLInputElement>, enclosureIndex?: number) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (!files.length) return;
    setUploading(true); setErrors([]);
    try {
      const replacedId = enclosureIndex === undefined ? undefined : data.enclosures[enclosureIndex]?.documentId;
      const existingFiles = (data.uploadedFiles || []).filter(file => !replacedId || file.id !== replacedId);
      const allowed = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png'];
      if (existingFiles.length + files.length > 5) throw new Error('Maximum 5 files allowed.');
      if (files.some(file => !allowed.includes(file.type) || file.size === 0 || file.size > 5 * 1024 * 1024)) throw new Error('Upload PDF, Word, JPG or PNG files up to 5 MB each.');
      if ([...existingFiles, ...files].reduce((sum, file) => sum + file.size, 0) > 10 * 1024 * 1024) throw new Error('Maximum total upload size is 10 MB.');
      const uploaded = await Promise.all(files.map(async file => ({ id: crypto.randomUUID(), name: file.name, type: file.type, size: file.size, dataUrl: await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error('File could not be read. Please retry.')); reader.readAsDataURL(file); }) })));
      setData(current => ({ ...current,
        uploadedFiles: [...(current.uploadedFiles || []).filter(file => !replacedId || file.id !== replacedId), ...uploaded],
        enclosures: enclosureIndex === undefined
          ? [...current.enclosures, ...uploaded.map(file => ({ selected: true, fileName: file.name, module: 'Uploaded File', registrationNo: '', date: new Date().toLocaleDateString('en-CA'), documentId: file.id }))]
          : current.enclosures.map((row, index) => index === enclosureIndex ? { ...row, selected: true, fileName: uploaded[0].name, documentId: uploaded[0].id, module: row.module || 'Uploaded File' } : row),
      }));
    } catch (error) { setErrors([error instanceof Error ? error.message : 'Upload failed.']); }
    finally { setUploading(false); }
  };
  const savingRef = useRef(false);
  const reportId = useRef(existing?.id || `final-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const previewRef = useRef<HTMLDivElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const change = <K extends keyof FinalReportData>(key: K, value: FinalReportData[K]) => {
    touched.current.add(key);
    setData(d => ({
    ...d, [key]: value, autoFilled: Object.fromEntries(Object.entries(d.autoFilled || {}).filter(([path]) => path !== key)),
    ...(key === 'formType' ? (value === 'CHARGESHEET' ? { finalReportReason: '', finalReportReasonDetails: '', investigationStatus: '' } : { chargeSheetType: '', ...(value === 'CLOSURE' ? { investigationStatus: 'Completed' } : {}) }) : {}),
    ...(key === 'prosecutorApproved' && value !== 'Yes' ? { approvalDate: '' } : {}),
    ...(key === 'noticeServed' && value !== 'Yes' ? { noticeDate: '' } : {}),
  })); };
  const field = (key: keyof FinalReportData, label: string, options?: string[], type = 'text', required = false) => (
    <label className="block space-y-1 text-xs font-semibold text-slate-700" key={key}>
      <span>{label}{required ? ' *' : ''}</span>
      {options ? <select className={`${inputClass} ${data.autoFilled?.[key] ? 'cms-autofilled' : ''}`} value={key === 'formType' && data.formType && data.formType !== 'CHARGESHEET' ? 'CLOSURE' : String(data[key])} onChange={e => change(key, e.target.value as never)}><option value="">Select</option>{options.map(o => <option key={o} value={o}>{key === 'formType' ? (o === 'CHARGESHEET' ? 'Chargesheet/Challan' : 'Final Report') : o}</option>)}</select>
        : type === 'textarea' ? <textarea className={`${inputClass} ${data.autoFilled?.[key] ? 'cms-autofilled' : ''}`} rows={4} value={String(data[key])} onChange={e => change(key, e.target.value as never)} />
        : <input className={`${inputClass} ${data.autoFilled?.[key] ? 'cms-autofilled' : ''}`} type={type} min={type === 'number' ? 0 : undefined} value={String(data[key])} onChange={e => change(key, e.target.value as never)} />}
    </label>
  );
  const rows = <K extends 'accused' | 'witnesses' | 'properties' | 'enclosures'>(key: K, fields: Array<{ key: string; label: string; options?: string[]; type?: string }>) => (
    <div className="space-y-3">{data[key].map((row, index) => <fieldset key={index} className="border rounded-lg p-3 bg-slate-50"><legend className="px-2 text-xs font-bold">{index + 1}</legend><div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">{fields.map(f => {
      const value = (row as unknown as Record<string, string | boolean>)[f.key];
      const update = (value: string | boolean) => {
        if (key === 'accused' && f.key === 'action' && value === 'ChargeSheeted') { touched.current.add('accused'); setEditingAccused(index); return; }
        const next = data[key].map((r, i) => i === index ? { ...r, [f.key]: value } : r) as FinalReportData[K];
        change(key, next);
        setData(current => ({ ...current, autoFilled: Object.fromEntries(Object.entries(current.autoFilled || {}).filter(([path]) => path !== `${key}.${index}.${f.key}`)) }));
      };
      return <label key={f.key} className="text-xs space-y-1 font-semibold"><span>{f.label}</span>{f.type === 'checkbox' ? <input className="ml-3" type="checkbox" checked={Boolean(value)} onChange={e => update(e.target.checked)} /> : f.options ? <select className={`${inputClass} ${data.autoFilled?.[`${key}.${index}.${f.key}`] ? 'cms-autofilled' : ''}`} value={String(value || '')} onChange={e => update(e.target.value)}><option value="">Select</option>{f.options.map(o => <option key={o}>{o}</option>)}</select> : <input className={`${inputClass} ${data.autoFilled?.[`${key}.${index}.${f.key}`] ? 'cms-autofilled' : ''}`} type={f.type || 'text'} value={String(value || '')} onChange={e => update(e.target.value)} />}</label>;
    })}</div>
    {key === 'accused' && (row as FinalReportData['accused'][number]).action === 'ChargeSheeted' && <button type="button" className="mt-3 border border-[#203c88] px-3 py-2 text-sm text-[#203c88]" onClick={() => setEditingAccused(index)}>Edit ChargeSheeted Details</button>}
    {key === 'enclosures' && <div className="mt-3 flex flex-wrap items-center gap-3">
      <label className="inline-flex items-center bg-[#203c88] text-white px-3 py-2 text-sm font-semibold hover:bg-[#172e70] cursor-pointer focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-blue-600">
        {uploading ? 'Uploading…' : 'Upload File'}
        <input type="file" className="sr-only" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" aria-label={`Upload file for enclosure row ${index + 1}`} disabled={uploading || saving} onChange={event => uploadFiles(event, index)} />
      </label>
      {(data.uploadedFiles || []).filter(file => file.id === (row as FinalReportData['enclosures'][number]).documentId).map(file => <a key={file.id} className="text-sm text-blue-700 underline" href={file.dataUrl} download={file.name}>{file.name}</a>)}
    </div>}
    <button type="button" disabled={uploading || saving} className="mt-3 text-xs text-red-700 underline" onClick={() => change(key, data[key].filter((_, i) => i !== index) as FinalReportData[K])}>Remove row {index + 1}</button></fieldset>)}</div>
  );
  const showPreview = () => { if (uploading) return; const next = validateFinalReport(data); setErrors(next); if (!next.length) setPreview(true); };
  const save = async () => {
    if (savingRef.current) return;
    savingRef.current = true; setSaving(true); setErrors([]);
    try {
      if (!previewRef.current) throw new Error('Open the preview before saving.');
      const html = getA4DocumentHtml(previewRef.current, `Final Report ${data.reportNo}`);
      const report = await finalReportClient.save(reportId.current, fir, data, html, currentUser, existing?.versionNumber || 0);
      await onSaved(report); onClose();
    } catch (error) { setErrors([error instanceof Error ? error.message : 'Save failed. Please retry.']); }
    finally { savingRef.current = false; setSaving(false); }
  };
  return <div className="fixed inset-0 z-[100] bg-slate-950/60 p-3 sm:p-6 flex justify-center" role="dialog" aria-modal="true" aria-labelledby="final-report-title">
    <section className="bg-white rounded-xl w-full max-w-6xl flex flex-col shadow-2xl overflow-hidden">
      <header className="p-4 border-b flex justify-between gap-3"><div><h2 id="final-report-title" className="text-lg font-bold">{existing ? 'Edit Final Report' : 'Final Report'} — IIF-V</h2><p className="text-xs text-white">FIR {fir.firNumber} · {fir.policeStation} · {fir.district}</p></div><button className={buttonClass} disabled={saving} onClick={onClose} aria-label="Close final report">Close</button></header>
      <div className="overflow-auto flex-1 p-4 space-y-4">
        <input ref={uploadInputRef} type="file" hidden multiple accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" aria-label="Upload report files" disabled={uploading || saving} onChange={uploadFiles} />
        {errors.length > 0 && <div role="alert" className="bg-red-50 text-red-800 border border-red-200 rounded-lg p-3"><ul className="list-disc pl-5 text-sm">{errors.map(e => <li key={e}>{e}</li>)}</ul></div>}
        {preview ? <StatutoryFinalReportPreview data={toStatutoryFinalReport(fir, data)} previewRef={previewRef} /> : <>
          <div className="bg-slate-50 border rounded-lg p-3 text-sm grid sm:grid-cols-2 gap-2"><p><strong>FIR Date:</strong> {fir.firDate}</p><p><strong>Complainant:</strong> {fir.complainantName}</p><p><strong>Relation:</strong> {fir.complainantRelationType || '—'} / {fir.complainantRelativeName || fir.complainantFatherSpouse || '—'}</p><p><strong>Acts & Sections:</strong> {fir.actsAndSections}</p></div>
          <div role="tablist" aria-label="Final report sections" className="flex flex-wrap gap-2">{tabs.map((name, i) => <button key={name} role="tab" aria-selected={tab === i} onClick={() => setTab(i)} className={`${buttonClass} ${tab === i ? 'bg-blue-900 text-white' : 'bg-slate-50'}`}>{name}</button>)}</div>
          <div role="tabpanel" aria-label={tabs[tab]} className="space-y-4">
            {tab === 0 && <>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {field('reportNo', 'Final report / Chargesheet number', undefined, 'text', true)}{field('reportDate', 'Report date', undefined, 'date', true)}
                {field('formType', 'Type of Final Form', ['CHARGESHEET', 'CLOSURE'], 'text', true)}
                {data.formType === 'CHARGESHEET' && field('chargeSheetType', 'Chargesheet / Challan type', ['Complete', 'Partial'], 'text', true)}
                {data.formType && data.formType !== 'CHARGESHEET' && field('finalReportReason', 'Final Report — reason / category', ['Untraced', 'FR Unoccured/Cancellation', 'Accused Dead Offence Abated', 'Transfer to other PS', 'Absconding', 'Withdrawal By Government'], 'text', true)}
                {data.formType && data.formType !== 'CHARGESHEET' && data.finalReportReason === 'FR Unoccured/Cancellation' && field('finalReportReasonDetails', 'Final Report — reason details', undefined, 'textarea', true)}
                {data.formType === 'CHARGESHEET' && <>{field('judicialCustody', 'Any accused in judicial custody?', ['Yes', 'No'], 'text', true)}
                {field('pendingAccused', 'No. of accused pending arrest / role verification', undefined, 'number', true)}
                {field('pendingDocuments', 'Type of documents pending', ['FSL Report Pending', 'Other Documents', 'NIL'], 'text', true)}</>}
                {field('limitationPeriod', 'Limitation period')}{field('investigationStatus', 'Investigation status', ['Completed', 'Pending / Further Investigation'], 'text', true)}
                {field('dispatchDate', 'Date of dispatch of final report / chargesheet', undefined, 'date')}
                {field('courtType', 'Court type', ['Judicial Magistrate 1st Class', 'Chief Judicial Magistrate', 'Sessions Court', 'Special Court', 'Juvenile Justice Board', 'Other'], 'text', true)}
                {field('judgeName', 'Name of Judge', undefined, 'text', true)}{field('caseType', 'Case Type', ['Criminal Case', 'Juvenile Case', 'Kalandra Case', 'Miscellaneous Case', 'Sessions Case', 'Summon Trial Case', 'Summons Case', 'Warrant Case'], 'text', true)}
              </div>
              {data.formType === 'CHARGESHEET' && <>
              <h3 className="font-bold">List of Accused</h3>
              {rows('accused', [{key:'name',label:'Accused name'},{key:'relation',label:'Relation type'},{key:'relativeName',label:'Relative name'},{key:'action',label:'Action',options:['ChargeSheeted','Not ChargeSheeted']},{key:'status',label:'Status'}])}
              {data.accused.length === 0 && <p className="text-sm text-slate-600">No accused are recorded in this FIR or its processed data.</p>}
              </>}
              <h3 className="font-bold">List of Witnesses</h3>
              {rows('witnesses', [{key:'selected',label:'Include witness',type:'checkbox'},{key:'name',label:'Witness name'},{key:'relation',label:'Relation type'},{key:'relativeName',label:'Relative name'},{key:'dob',label:'Date of birth',type:'date'},{key:'occupation',label:'Occupation'},{key:'evidence',label:'Type of evidence'},{key:'address',label:'Address'},{key:'statement',label:'Statement'}])}
              <button className={buttonClass} onClick={() => change('witnesses',[...data.witnesses,{selected:true,name:'',relation:'',relativeName:'',dob:'',occupation:'',evidence:'',address:'',statement:''}])}>Add witness</button>
            </>}
            {tab === 1 && <div className="grid sm:grid-cols-2 gap-4">
              {field('labAnalysis','Results of Laboratory Analysis',undefined,'textarea')}{field('briefFacts','Brief Facts of Case',undefined,'textarea',true)}
              {field('prosecutorApproved','Approved by Public Prosecutor',['Yes','No'],'text',true)}
              {data.prosecutorApproved === 'Yes' && field('approvalDate','Date of Approval',undefined,'date',true)}
              {field('noticeServed','Refer Notice Served',['Yes','No'],'text',true)}{data.noticeServed === 'Yes' && field('noticeDate','Date of Sending Notice',undefined,'date',true)}
              <label className="block space-y-1 text-xs font-semibold text-slate-700">
                <span>No. of enclosures</span>
                <input className={inputClass} type="number" min={0} step={1} value={data.enclosureCount ?? String(data.enclosures.filter(e => e.selected).length)} onChange={event => change('enclosureCount', event.target.value)} />
              </label>
              {field('enclosureNotes','List of enclosure / remarks',undefined,'textarea')}
              <div className="sm:col-span-2 border border-slate-300 p-3 space-y-2">
                <button type="button" disabled={uploading || saving} onClick={() => uploadInputRef.current?.click()} className="inline-flex items-center justify-center border border-[#203c88] bg-[#203c88] px-4 py-2 text-sm font-semibold text-white hover:bg-[#172e70] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 cursor-pointer disabled:opacity-50">{uploading ? 'Uploading…' : 'Upload Files'}</button>
                <p className="text-xs text-slate-600">PDF, Word, JPG, PNG · 5 MB per file · 10 MB total</p>
                {uploading && <p role="status" className="text-sm">Uploading…</p>}
                {(data.uploadedFiles || []).map(file => <div key={file.id} className="flex items-center gap-3 text-sm">
                  <a className="text-blue-700 underline" href={file.dataUrl} download={file.name}>{file.name}</a>
                  <button type="button" className="text-red-700 underline" disabled={uploading || saving} onClick={() => setData(current => ({ ...current, uploadedFiles: current.uploadedFiles?.filter(item => item.id !== file.id), enclosures: current.enclosures.filter(item => item.documentId !== file.id) }))}>Remove</button>
                </div>)}
              </div>

            </div>}
            {tab === 2 && <>{rows('properties',[{key:'type',label:'Type of Property'},{key:'description',label:'Property details'},{key:'value',label:'Estimated value (INR)'},{key:'recoveredFrom',label:'Person from whom property is recovered'},{key:'disposal',label:'Disposal / Status'}])}<button className={buttonClass} onClick={() => change('properties',[...data.properties,{type:'',description:'',value:'',recoveredFrom:'',disposal:''}])}>Add property</button></>}
            {tab === 3 && <><p className="text-sm text-slate-600">Select documents to include. FIR documents are listed below; additional entries record enclosure references.</p>{rows('enclosures',[{key:'selected',label:'Checklist — include',type:'checkbox'},{key:'fileName',label:'File Name'},{key:'module',label:'Module Name'},{key:'registrationNo',label:'Reg No.'},{key:'date',label:'Reg Date',type:'date'}])}<button className={buttonClass} onClick={() => change('enclosures',[...data.enclosures,{selected:true,fileName:'',module:'',registrationNo:'',date:''}])}>Add to List</button></>}
          </div>
        </>}
      </div>
      <footer className="p-4 border-t flex justify-between items-center gap-3"><p className="text-xs text-slate-500">{preview ? 'Review before saving. Send to SHO is available after save.' : '* Required fields. Submit opens preview; it does not save yet.'}</p><div className="flex gap-2">{preview ? <><button className={buttonClass} disabled={saving} onClick={() => setPreview(false)}>Back to Form</button><button className={`${buttonClass} bg-emerald-700 text-white`} disabled={saving} onClick={save}>{saving ? 'Saving…' : 'Final Submit & Save'}</button></> : <button className={`${buttonClass} bg-blue-900 text-white`} onClick={showPreview}>Submit — Preview</button>}</div></footer>
    </section>
    {editingAccused !== null && data.accused[editingAccused] && <AccusedChargesheetDialog
      key={data.accused[editingAccused].accusedId}
      fir={fir}
      accused={data.accused[editingAccused]}
      onClose={() => setEditingAccused(null)}
      onSave={saveAccusedDetails}
    />}
  </div>;
}
