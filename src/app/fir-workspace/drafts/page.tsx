"use client";

import {Suspense,useEffect,useState} from 'react';
import {useSearchParams} from 'next/navigation';
import {useAuth} from '@/context/AuthContext';
import {persistentFirService as firService} from '@/services/persistentFirService';
import type {FIRItem} from '@/types';
import {FIRWorkspaceNav} from '@/components/fir-workspace/FIRWorkspaceNav';
import {IIFVChargesheetForm} from '@/components/fir/FinalReportModal';

export type FinalFormType='CHARGESHEET'|'CLOSURE'|'UNTRACED'|'CANCELLED';
const labels:Record<FinalFormType,string>={CHARGESHEET:'Chargesheet / Challan',CLOSURE:'Closure Report',UNTRACED:'Untraced Report',CANCELLED:'Cancellation Report'};
function FIRFinalFormContent(){
 const {currentUser}=useAuth(),search=useSearchParams();
 const [firs,setFirs]=useState<FIRItem[]>([]),[selected,setSelected]=useState(''),[formType,setFormType]=useState<FinalFormType>('CHARGESHEET'),[message,setMessage]=useState('');
 useEffect(()=>{const load=()=>setFirs(firService.getAllFirs());load();return firService.subscribe(load);},[currentUser]);
 useEffect(()=>{const id=search.get('firId'),type=search.get('type');if(id){const matches=firService.getAllFirs().filter(f=>f.id===id || f.firNumber===id);setSelected(matches.length===1?matches[0].id:'');}if(type && type in labels)setFormType(type as FinalFormType);},[search]);
 const active=firs.find(f=>f.id===selected);
 return <div className="space-y-5 p-4 sm:p-6">
  <FIRWorkspaceNav />
  <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
   <h1 className="text-xl font-bold">Final Report / Chargesheet (I.I.F.-V)</h1>
   <p className="text-sm text-slate-600">Select an FIR and prepare a verified report. Saving a report does not complete the FIR; SHO review and court submission remain separate steps.</p>
   {message && <p role="status" className="text-sm text-emerald-800">{message}</p>}
   <div className="grid gap-3 sm:grid-cols-2">
    <label className="text-sm font-semibold">FIR<select className="mt-1 w-full rounded border p-2" value={selected} onChange={e=>{setSelected(e.target.value);setMessage('');}}><option value="">Select FIR</option>{firs.map(f=><option key={f.id} value={f.id}>{f.firNumber} — {f.policeStation} — {f.complainantName}</option>)}</select></label>
    <label className="text-sm font-semibold">Report category<select className="mt-1 w-full rounded border p-2" value={formType} onChange={e=>setFormType(e.target.value as FinalFormType)}>{(Object.keys(labels) as FinalFormType[]).map(type=><option key={type} value={type}>{labels[type]}</option>)}</select></label>
   </div>
  </div>
  {active?<IIFVChargesheetForm key={`${active.id}-${formType}`} fir={active} currentUser={currentUser} initialFormType={formType} inline onSaved={()=>setMessage('Report saved. Forward it to SHO for review before court submission.')} />:<p className="rounded-xl border border-dashed p-6 text-center text-sm text-slate-600">Select the case before preparing a final report.</p>}
 </div>;
}
export default function FIRFinalFormPage(){return <Suspense fallback={<p className="p-6">Loading final report workspace…</p>}><FIRFinalFormContent /></Suspense>;}
