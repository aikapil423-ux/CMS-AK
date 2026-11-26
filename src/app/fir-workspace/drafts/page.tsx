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
 const linkedId=search.get('firId');
 const matches=linkedId ? firs.filter(f=>f.id===linkedId || f.firNumber===linkedId) : [];
 const linkedFirId=matches.length===1 ? matches[0].id : '';
 useEffect(()=>{const type=search.get('type');setSelected(linkedFirId);if(type && type in labels)setFormType(type as FinalFormType);},[search,linkedFirId]);
 const active=firs.find(f=>f.id===selected);
 return <div className="space-y-5 p-4 sm:p-6">
  <FIRWorkspaceNav />
  <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
   <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:gap-5">
    <h1 className="shrink-0 text-xl font-bold">Final Report / Chargesheet (I.I.F.-V)</h1>
    <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-2">
     <label className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-2 text-sm font-semibold">
      <span>FIR</span>
      <select className="w-full min-w-0 rounded border p-2" value={selected} onChange={e=>{setSelected(e.target.value);setMessage('');}}>
       <option value="">-- सक्रिय अभियोग (FIR) चुनें --</option>
       {firs.map(f=><option key={f.id} value={f.id}>{f.firNumber} — {f.policeStation} — {f.complainantName}</option>)}
      </select>
     </label>
     <label className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-2 text-sm font-semibold">
      <span>Report category</span>
      <select className="w-full min-w-0 rounded border p-2" value={formType} onChange={e=>setFormType(e.target.value as FinalFormType)}>
       {(Object.keys(labels) as FinalFormType[]).map(type=><option key={type} value={type}>{labels[type]}</option>)}
      </select>
     </label>
    </div>
   </div>
   {message && <p role="status" className="text-sm text-emerald-800">{message}</p>}
  </div>
  {active?<IIFVChargesheetForm key={`${active.id}-${formType}`} fir={active} currentUser={currentUser} initialFormType={formType} inline onSaved={()=>setMessage('Report saved. Forward it to SHO for review before court submission.')} />:<p className="rounded-xl border border-dashed p-6 text-center text-sm text-slate-600">Select the case before preparing a final report.</p>}
 </div>;
}
export default function FIRFinalFormPage(){return <Suspense fallback={<p className="p-6">Loading final report workspace…</p>}><FIRFinalFormContent /></Suspense>;}
