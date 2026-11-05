'use client';
import { useEffect, useRef, useState } from 'react';
import type { FIRItem } from '@/types';
import type { PdfScrutinyRecord } from '@/services/scrutinyRepository';
import { SCRUTINY_PAGE_TITLES, type ScrutinyValues } from '@/lib/scrutinyPdfTemplate';
import { scrutinyPrintHtml } from '@/lib/scrutinyPrint';
import { ScrutinyNativePages } from './ScrutinyNativePages';

async function request(url:string,body?:unknown) {
  const response=await fetch(url,{method:body?'POST':'GET',credentials:'same-origin',headers:body?{'Content-Type':'application/json'}:undefined,body:body?JSON.stringify(body):undefined,cache:'no-store'});
  const result=await response.json();if(!response.ok)throw new Error(result.error || 'Request failed.');return result;
}
export function ScrutinyPdfForm({initial,onClose,onSaved}:{initial?:PdfScrutinyRecord;onClose:()=>void;onSaved:()=>void}) {
  const [firs,setFirs]=useState<FIRItem[]>([]),[firId,setFirId]=useState(initial?.firId || '');
  const [record,setRecord]=useState(initial),[values,setValues]=useState<ScrutinyValues>(initial?.fields || {});
  const [page,setPage]=useState(1),[busy,setBusy]=useState(''),[error,setError]=useState(''),[saved,setSaved]=useState('');
  const [source,setSource]=useState(''),[accusedIndex,setAccusedIndex]=useState(0),[dirty,setDirty]=useState(false);
  const [workflow,setWorkflow]=useState({decision:initial?.decision || 'DRAFT',courtName:initial?.courtName || '',scrutinyOfficer:initial?.scrutinyOfficer || '',challanType:initial?.challanType || 'FINAL_CHARGESHEET',objectionsNote:initial?.objectionsNote || ''});
  const upload=useRef<HTMLInputElement>(null),printFrame=useRef<HTMLIFrameElement | null>(null);
  const fir=firs.find(f=>f.id===firId);
  useEffect(()=>{let active=true;request('/api/fir/records').then(r=>{if(active)setFirs(r.records);}).catch(e=>{if(active)setError(e.message);});return()=>{active=false;printFrame.current?.remove();};},[]);
  async function prepare(processDocuments=false) {
    if(!firId)return;setError('');setSaved('');setBusy('Loading FIR data…');
    try {
      if(processDocuments) {
        const plan=await request('/api/fir/entities/process',{firId});
        if(!plan.aiAvailable)throw new Error('AI processing is unavailable. Existing saved data can still be loaded.');
        const failures:string[]=[];
        for(const job of plan.jobs || []) {
          setBusy('Processing '+job.name);
          try{await request('/api/fir/entities/process',{firId,sourceId:job.id});}catch(e){failures.push(`${job.name}: ${e instanceof Error?e.message:'Processing failed'}`);}
        }
        if(failures.length)setError(failures.join('\n'));
      }
      setBusy('Filling fields from saved FIR and processed evidence…');
      // Preserve unsaved edits before reprocessing so they cannot be overwritten.
      let current=record;
      if(current && dirty) {
        const savedRecord=await request('/api/prosecution/scrutiny',{action:'save',firId,id:current.id,revision:current.revision,fields:values,...workflow});
        current=savedRecord.record;setRecord(current);
      }
      const result=await request('/api/prosecution/scrutiny',{action:'prepare',firId,id:current?.id,revision:current?.revision,accusedIndex,...workflow});
      setRecord(result.record);setValues(result.record.fields);setDirty(false);onSaved();
      setSaved('Auto-filled draft saved in backend. Green fields have source data; please review.');
    }catch(e){setError(e instanceof Error?e.message:'Autofill failed.');}finally{setBusy('');}
  }
  async function save() {
    setBusy('Saving…');setError('');setSaved('');
    try{const result=await request('/api/prosecution/scrutiny',{action:'save',firId,id:record?.id,revision:record?.revision,fields:values,accusedIndex,...workflow});setRecord(result.record);setValues(result.record.fields);setDirty(false);setSaved('Saved in backend.');onSaved();}
    catch(e){setError(e instanceof Error?e.message:'Save failed.');}finally{setBusy('');}
  }
  async function processUpload(file:File) {
    if(!firId)return;setBusy('Uploading and processing '+file.name);setError('');
    try {
      const body=new FormData();body.set('file',file);body.set('fileName',file.name);body.set('fileId',crypto.randomUUID());body.set('caseId',firId);body.set('caseNumber',fir?.firNumber || record?.firNumber || '');body.set('module','FIR');body.set('deferCaseAnalysis','true');
      const response=await fetch('/api/prosecution/scrutiny/upload',{method:'POST',credentials:'same-origin',body});const result=await response.json();
      if(!response.ok || !result.success || result.record?.processingStatus!=='COMPLETED')throw new Error(result.error || 'Document could not be processed. Original retained where available.');
      setSaved('Document and processed evidence saved in backend. Use Autofill to load its facts.');
      return true;
    }catch(e){setError(e instanceof Error?e.message:'Upload failed.');return false;}finally{setBusy('');if(upload.current)upload.current.value='';}
  }
  function update(id:string,value:string) {setValues(v=>({...v,[id]:{value,origin:'MANUAL'}}));setDirty(true);setSaved('');}
  function close(){if(!dirty || confirm('Unsaved changes will be lost. Close this form?'))onClose();}
  async function print() {
    setError('');setBusy('Preparing 12 A4 pages…');
    try {
      printFrame.current?.remove();const frame=document.createElement('iframe');printFrame.current=frame;
      frame.style.cssText='position:fixed;width:0;height:0;border:0';frame.title='Scrutiny print';document.body.appendChild(frame);
      const doc=frame.contentDocument;if(!doc)throw new Error('Print preview unavailable.');
      const canvas=document.getElementById('scrutiny-native-pages');if(!canvas)throw new Error('Form unavailable.');
      doc.open();doc.write(scrutinyPrintHtml(canvas));doc.close();
      await Promise.all(Array.from(doc.images).map(img=>img.complete?Promise.resolve():new Promise<void>((resolve,reject)=>{img.onload=()=>resolve();img.onerror=()=>reject(new Error('A template page could not be loaded. Retry printing.'));})));
      await doc.fonts.ready;frame.contentWindow?.focus();frame.contentWindow?.print();
    }catch(e){setError(e instanceof Error?e.message:'Print failed.');}finally{setBusy('');}
  }
  return <div className="fixed inset-0 z-50 bg-slate-100 flex flex-col" role="dialog" aria-modal="true" aria-label="12-page Scrutiny Performa">
    <div className="bg-white border-b p-3 space-y-2 shrink-0">
      <div className="flex flex-wrap items-center gap-2"><strong className="mr-auto">Scrutiny Performa · 12 A4 Pages</strong><button onClick={close} disabled={!!busy} className="border px-3 py-1">Close</button></div>
      <div className="flex flex-wrap gap-2 items-center text-xs">
        <select aria-label="Select FIR" value={firId} disabled={!!busy || !!record} onChange={e=>{setFirId(e.target.value);setValues({});setAccusedIndex(0);}} className="border p-2 max-w-md"><option value="">Select FIR</option>{firs.map(f=><option key={f.id} value={f.id}>{f.firNumber} · {f.policeStation}</option>)}</select>
        {(fir?.accusedList?.length || 0)>1 && !record && <select aria-label="Accused for this packet" value={accusedIndex} onChange={e=>setAccusedIndex(Number(e.target.value))}>{fir!.accusedList.map((a,i)=><option key={a.id || i} value={i}>{a.name}</option>)}</select>}
        <button disabled={!firId || !!busy} onClick={()=>prepare()} className="border px-3 py-2">Autofill</button>
        <button disabled={!firId || !!busy} onClick={()=>prepare(true)} className="border px-3 py-2">Process FIR Documents &amp; Autofill</button>
        <button disabled={!firId || !!busy} onClick={()=>upload.current?.click()} className="border px-3 py-2">Upload &amp; Process</button>
        <input ref={upload} type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.txt,.docx" onChange={e=>{const f=e.target.files?.[0];if(f)void processUpload(f);}} />
        <button disabled={!firId || !!busy} onClick={save} className="bg-blue-900 text-white px-3 py-2">Save</button>
        <button disabled={!!busy} onClick={print} className="border px-3 py-2">Print / PDF</button>
      </div>
      <div className="flex flex-wrap gap-2 items-center text-xs"><label>Page <select aria-label="Page" value={page} onChange={e=>setPage(Number(e.target.value))}>{SCRUTINY_PAGE_TITLES.map((t,i)=><option key={t} value={i+1}>{i+1}. {t}</option>)}</select></label><button disabled={page===1} onClick={()=>setPage(p=>p-1)}>← Previous</button><button disabled={page===12} onClick={()=>setPage(p=>p+1)}>Next →</button><span className="text-emerald-700">Green glow = autofilled · click any field to edit</span><span>{dirty?'Unsaved changes':''}</span></div>
      <details className="text-xs"><summary>Scrutiny decision &amp; court details</summary><div className="flex flex-wrap gap-2 p-2">
        {(['decision','challanType'] as const).map(key=><label key={key}>{key==='decision'?'Decision':'Challan type'} <select disabled={!!busy} value={workflow[key]} onChange={e=>{setWorkflow(w=>({...w,[key]:e.target.value}));setDirty(true);}}>{(key==='decision'?['DRAFT','PASSED','OBJECTION_RETURNED','PENDING_FSL']:['FINAL_CHARGESHEET','SUPPLEMENTARY','CANCELLATION','UNTRACED']).map(v=><option key={v} value={v}>{v.replaceAll('_',' ')}</option>)}</select></label>)}
        {(['courtName','scrutinyOfficer','objectionsNote'] as const).map(key=><label key={key}>{key==='courtName'?'Court':key==='scrutinyOfficer'?'Scrutiny officer':'Objections'} <input disabled={!!busy} value={workflow[key]} onChange={e=>{setWorkflow(w=>({...w,[key]:e.target.value}));setDirty(true);}} className="border p-1" /></label>)}
      </div></details>
      {busy && <p role="status" className="text-xs text-blue-800">{busy}</p>}{saved && <p role="status" className="text-xs text-emerald-800">{saved}</p>}{error && <p role="alert" className="text-xs text-red-700 whitespace-pre-wrap">{error}</p>}
      {record?.processingWarnings?.map(w=><p key={w} className="text-xs text-amber-800">{w}</p>)}
      {source && <p className="text-xs text-slate-700 break-words">{source}</p>}
    </div>
    <div className="overflow-auto flex-1 p-4">
      <ScrutinyNativePages values={values} page={page} busy={!!busy} update={update} onSource={setSource} onPhoto={async file=>{
        if(file.size>1400000){setError('Use a PNG, JPG or WebP photograph smaller than 1.4 MB.');return;}
        if(!firId){setError('Select FIR before uploading a photograph.');return;}
        if(!await processUpload(file))return;
        const reader=new FileReader();reader.onload=()=>update('identity.photo',String(reader.result));reader.readAsDataURL(file);
      }} />
    </div>
  </div>;
}
