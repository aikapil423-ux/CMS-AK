"use client";

import React, { useRef, useState } from 'react';
import type { ComplaintReportItem, FIRItem } from '@/types';
import { toStatutoryFinalReport, initialFinalReport, validateFinalReport, type FinalReportData } from '@/lib/finalReport';
import { finalReportClient } from '@/services/finalReportClient';
import { StatutoryFinalReportPreview } from './StatutoryFinalReportPreview';
import { getA4DocumentHtml } from '@/utils/printElement';

const tabs = ['Final Report Information', 'Other Information', 'Property Information', 'List of Enclosure'];
const inputClass = 'w-full border border-slate-300 rounded-md p-2 text-sm bg-white text-slate-900';
const buttonClass = 'rounded-lg border px-4 py-2 text-sm font-semibold disabled:opacity-50';
type Props = { fir: FIRItem; currentUser: { id: string; name: string }; existing?: ComplaintReportItem; onClose: () => void; onSaved: (report: ComplaintReportItem) => void };

export function CctnsFinalReportModal({ fir, currentUser, existing, onClose, onSaved }: Props) {
  const [data, setData] = useState<FinalReportData>(() => structuredClone(existing?.finalReportData || initialFinalReport(fir)));
  const [tab, setTab] = useState(0);
  const [preview, setPreview] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const reportId = useRef(existing?.id || `final-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const previewRef = useRef<HTMLDivElement>(null);
  const change = <K extends keyof FinalReportData>(key: K, value: FinalReportData[K]) => setData(d => ({
    ...d, [key]: value,
    ...(key === 'formType' ? (value === 'CHARGESHEET' ? { finalReportReason: '', finalReportReasonDetails: '' } : { chargeSheetType: '' }) : {}),
    ...(key === 'prosecutorApproved' && value !== 'Yes' ? { approvalDate: '' } : {}),
    ...(key === 'noticeServed' && value !== 'Yes' ? { noticeDate: '' } : {}),
  }));
  const field = (key: keyof FinalReportData, label: string, options?: string[], type = 'text', required = false) => (
    <label className="block space-y-1 text-xs font-semibold text-slate-700" key={key}>
      <span>{label}{required ? ' *' : ''}</span>
      {options ? <select className={inputClass} value={String(data[key])} onChange={e => change(key, e.target.value as never)}><option value="">Select</option>{options.map(o => <option key={o}>{o}</option>)}</select>
        : type === 'textarea' ? <textarea className={inputClass} rows={4} value={String(data[key])} onChange={e => change(key, e.target.value as never)} />
        : <input className={inputClass} type={type} min={type === 'number' ? 0 : undefined} value={String(data[key])} onChange={e => change(key, e.target.value as never)} />}
    </label>
  );
  const rows = <K extends 'accused' | 'witnesses' | 'properties' | 'enclosures'>(key: K, fields: Array<{ key: string; label: string; options?: string[]; type?: string }>) => (
    <div className="space-y-3">{data[key].map((row, index) => <fieldset key={index} className="border rounded-lg p-3 bg-slate-50"><legend className="px-2 text-xs font-bold">{index + 1}</legend><div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">{fields.map(f => {
      const value = (row as unknown as Record<string, string | boolean>)[f.key];
      const update = (value: string | boolean) => change(key, data[key].map((r, i) => i === index ? { ...r, [f.key]: value } : r) as FinalReportData[K]);
      return <label key={f.key} className="text-xs space-y-1 font-semibold"><span>{f.label}</span>{f.type === 'checkbox' ? <input className="ml-3" type="checkbox" checked={Boolean(value)} onChange={e => update(e.target.checked)} /> : f.options ? <select className={inputClass} value={String(value || '')} onChange={e => update(e.target.value)}><option value="">Select</option>{f.options.map(o => <option key={o}>{o}</option>)}</select> : <input className={inputClass} type={f.type || 'text'} value={String(value || '')} onChange={e => update(e.target.value)} />}</label>;
    })}</div><button type="button" className="mt-3 text-xs text-red-700 underline" onClick={() => change(key, data[key].filter((_, i) => i !== index) as FinalReportData[K])}>Remove row {index + 1}</button></fieldset>)}</div>
  );
  const showPreview = () => { const next = validateFinalReport(data); setErrors(next); if (!next.length) setPreview(true); };
  const save = async () => {
    if (savingRef.current) return;
    savingRef.current = true; setSaving(true); setErrors([]);
    try {
      if (!previewRef.current) throw new Error('Open the preview before saving.');
      const html = getA4DocumentHtml(previewRef.current, `Final Report ${data.reportNo}`);
      const report = await finalReportClient.save(reportId.current, fir, data, html, currentUser, existing?.versionNumber || 0);
      onSaved(report); onClose();
    } catch (error) { setErrors([error instanceof Error ? error.message : 'Save failed. Please retry.']); }
    finally { savingRef.current = false; setSaving(false); }
  };
  return <div className="fixed inset-0 z-[100] bg-slate-950/60 p-3 sm:p-6 flex justify-center" role="dialog" aria-modal="true" aria-labelledby="final-report-title">
    <section className="bg-white rounded-xl w-full max-w-6xl flex flex-col shadow-2xl overflow-hidden">
      <header className="p-4 border-b flex justify-between gap-3"><div><h2 id="final-report-title" className="text-lg font-bold">{existing ? 'Edit Final Report' : 'Final Report'} — IIF-V</h2><p className="text-xs text-slate-600">FIR {fir.firNumber} · {fir.policeStation} · {fir.district}</p></div><button className={buttonClass} disabled={saving} onClick={onClose} aria-label="Close final report">Close</button></header>
      <div className="overflow-auto flex-1 p-4 space-y-4">
        {errors.length > 0 && <div role="alert" className="bg-red-50 text-red-800 border border-red-200 rounded-lg p-3"><ul className="list-disc pl-5 text-sm">{errors.map(e => <li key={e}>{e}</li>)}</ul></div>}
        {preview ? <StatutoryFinalReportPreview data={toStatutoryFinalReport(fir, data)} previewRef={previewRef} /> : <>
          <div className="bg-slate-50 border rounded-lg p-3 text-sm grid sm:grid-cols-2 gap-2"><p><strong>FIR Date:</strong> {fir.firDate}</p><p><strong>Complainant:</strong> {fir.complainantName}</p><p><strong>Relation:</strong> {fir.complainantRelationType || '—'} / {fir.complainantRelativeName || fir.complainantFatherSpouse || '—'}</p><p><strong>Acts & Sections:</strong> {fir.actsAndSections}</p></div>
          <div role="tablist" aria-label="Final report sections" className="flex flex-wrap gap-2">{tabs.map((name, i) => <button key={name} role="tab" aria-selected={tab === i} onClick={() => setTab(i)} className={`${buttonClass} ${tab === i ? 'bg-blue-900 text-white' : 'bg-slate-50'}`}>{name}</button>)}</div>
          <div role="tabpanel" aria-label={tabs[tab]} className="space-y-4">
            {tab === 0 && <>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {field('reportNo', 'Final report / Chargesheet number', undefined, 'text', true)}{field('reportDate', 'Report date', undefined, 'date', true)}
                {field('formType', 'Type of Final Form', ['CHARGESHEET', 'CLOSURE', 'UNTRACED', 'CANCELLED'], 'text', true)}
                {data.formType === 'CHARGESHEET' && field('chargeSheetType', 'Chargesheet / Challan type', ['Complete', 'Partial'], 'text', true)}
                {data.formType !== 'CHARGESHEET' && field('finalReportReason', 'Final Report — reason / category', ['Untraced', 'False complaint', 'Mistake of fact', 'Mistake of law', 'Civil nature', 'Insufficient evidence', 'Death of accused', 'Other'], 'text', true)}
                {data.formType !== 'CHARGESHEET' && field('finalReportReasonDetails', 'Final Report — reason details', undefined, 'textarea', true)}
                {field('judicialCustody', 'Any accused in judicial custody?', ['Yes', 'No'], 'text', true)}
                {field('pendingAccused', 'No. of accused pending arrest / role verification', undefined, 'number', true)}
                {field('pendingDocuments', 'Type of documents pending', ['FSL Report Pending', 'Other Documents', 'NIL'], 'text', true)}
                {field('limitationPeriod', 'Limitation period')}{field('investigationStatus', 'Investigation status', ['Completed', 'Pending / Further Investigation'], 'text', true)}
                {field('dispatchDate', 'Date of dispatch of final report / chargesheet', undefined, 'date')}
                {field('courtType', 'Court type', ['Judicial Magistrate 1st Class', 'Chief Judicial Magistrate', 'Sessions Court', 'Special Court', 'Juvenile Justice Board', 'Other'], 'text', true)}
                {field('judgeName', 'Name of Judge', undefined, 'text', true)}{field('caseType', 'Case Type', ['ADULT', 'JUVENILE & ADULT', 'ONLY JUVENILE'], 'text', true)}
              </div>
              <h3 className="font-bold">List of Accused</h3>
              {rows('accused', [{key:'name',label:'Accused name'},{key:'relation',label:'Relation type'},{key:'relativeName',label:'Relative name'},{key:'action',label:'Action',options:['ChargeSheeted','Not ChargeSheeted']},{key:'status',label:'Status'}])}
              <button className={buttonClass} onClick={() => change('accused', [...data.accused,{accusedId:`${fir.id}-manual-${Date.now()}`,name:'',relation:'',relativeName:'',action:'',status:''}])}>Add accused</button>
              <h3 className="font-bold">List of Witnesses</h3>
              {rows('witnesses', [{key:'selected',label:'Include witness',type:'checkbox'},{key:'name',label:'Witness name'},{key:'relation',label:'Relation type'},{key:'relativeName',label:'Relative name'},{key:'dob',label:'Date of birth',type:'date'},{key:'occupation',label:'Occupation'},{key:'evidence',label:'Type of evidence'},{key:'address',label:'Address'},{key:'statement',label:'Statement'}])}
              <button className={buttonClass} onClick={() => change('witnesses',[...data.witnesses,{selected:true,name:'',relation:'',relativeName:'',dob:'',occupation:'',evidence:'',address:'',statement:''}])}>Add witness</button>
            </>}
            {tab === 1 && <div className="grid sm:grid-cols-2 gap-4">
              {field('labAnalysis','Results of Laboratory Analysis',undefined,'textarea')}{field('briefFacts','Brief Facts of Case',undefined,'textarea',true)}
              {field('prosecutorApproved','Approved by Public Prosecutor',['Yes','No'],'text',true)}
              {data.prosecutorApproved === 'Yes' && field('approvalDate','Date of Approval',undefined,'date',true)}
              {field('noticeServed','Refer Notice Served',['Yes','No'],'text',true)}{data.noticeServed === 'Yes' && field('noticeDate','Date of Sending Notice',undefined,'date',true)}
              <p className="text-sm">No. of enclosures: <strong>{data.enclosures.filter(e => e.selected).length}</strong></p>
              {field('enclosureNotes','List of enclosure / remarks',undefined,'textarea')}
            </div>}
            {tab === 2 && <>{rows('properties',[{key:'type',label:'Type of Property'},{key:'description',label:'Property details'},{key:'value',label:'Estimated value (INR)'},{key:'recoveredFrom',label:'Person from whom property is recovered'},{key:'disposal',label:'Disposal / Status'}])}<button className={buttonClass} onClick={() => change('properties',[...data.properties,{type:'',description:'',value:'',recoveredFrom:'',disposal:''}])}>Add property</button></>}
            {tab === 3 && <><p className="text-sm text-slate-600">Select documents to include. FIR documents are listed below; additional entries record enclosure references.</p>{rows('enclosures',[{key:'selected',label:'Checklist — include',type:'checkbox'},{key:'fileName',label:'File Name'},{key:'module',label:'Module Name'},{key:'registrationNo',label:'Reg No.'},{key:'date',label:'Reg Date',type:'date'}])}<button className={buttonClass} onClick={() => change('enclosures',[...data.enclosures,{selected:true,fileName:'',module:'',registrationNo:'',date:''}])}>Add to List</button></>}
          </div>
        </>}
      </div>
      <footer className="p-4 border-t flex justify-between items-center gap-3"><p className="text-xs text-slate-500">{preview ? 'Review before saving. Send to SHO is available after save.' : '* Required fields. Submit opens preview; it does not save yet.'}</p><div className="flex gap-2">{preview ? <><button className={buttonClass} disabled={saving} onClick={() => setPreview(false)}>Back to Form</button><button className={`${buttonClass} bg-emerald-700 text-white`} disabled={saving} onClick={save}>{saving ? 'Saving…' : 'Final Submit & Save'}</button></> : <button className={`${buttonClass} bg-blue-900 text-white`} onClick={showPreview}>Submit — Preview</button>}</div></footer>
    </section>
  </div>;
}
