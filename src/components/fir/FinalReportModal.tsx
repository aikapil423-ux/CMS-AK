"use client";

import {useState} from 'react';
import type {ComplaintReportItem,FIRItem} from '@/types';
import {CctnsFinalReportModal} from './CctnsFinalReportModal';
import {persistentFirService} from '@/services/persistentFirService';

export interface IIFVChargesheetFormProps {
 fir:FIRItem;
 currentUser:{id?:string;name?:string;rank?:string;role?:string;beltNumber?:string;pno?:string;stationName?:string;district?:string};
 onSaved?:(report:ComplaintReportItem)=>void;
 onClose?:()=>void;
 inline?:boolean;
 initialFormType?:string;
}

/** Every workspace uses the validated report editor and the same SHO review workflow. */
export function IIFVChargesheetForm({fir,currentUser,onSaved,onClose,inline=false,initialFormType}:IIFVChargesheetFormProps){
 const [open,setOpen]=useState(true);
 if(!currentUser.id || !currentUser.name)return <p role="alert">Sign in before preparing a final report.</p>;
 return <>
  {!open && inline && <button type="button" className="rounded-lg border px-4 py-2 font-semibold" onClick={()=>setOpen(true)}>Prepare final report for review</button>}
  {open && <CctnsFinalReportModal initialFormType={initialFormType} fir={fir} currentUser={{id:currentUser.id,name:currentUser.name}} onClose={()=>{setOpen(false);onClose?.();}} onSaved={async report=>{
   await persistentFirService.addReport(fir.id,report);
   onSaved?.(report);
  }}/>}
 </>;
}
