"use client";
import { firService } from './firService';
import type { FIRItem,UserSession } from '@/types';
import { isFirVisibleToUser } from '@/lib/firIntegrity';

const writes=['registerFir','synchronizeSourceComplaint','updateFir','saveLegalAnalysis','saveCrimeDetails','issueChallan','recordCourtSubmission','reopenCompletedCase','assignIoWithCourtOrder','assignIo','addCaseDiary','deleteCaseDiary','addDocument','deleteDocument','addReport','deleteReport','submitFinalForm','addAuditRecord','transferMultipleFirsInterState','transferFirInterState','linkMultipleFirs','linkFirs','delinkFirs'] as const;
type Write=typeof writes[number];
type Persistent=Omit<typeof firService,Write> & {[K in Write]:(...args:Parameters<(typeof firService)[K]>)=>Promise<Awaited<ReturnType<(typeof firService)[K]>>>};
let activeUser:UserSession | undefined;
let queue:Promise<unknown>=Promise.resolve();
let failure='';
const listeners=new Set<()=>void>();
function publish(error=''){failure=error;listeners.forEach(fn=>fn());}
async function request(method='GET',changes?:unknown){
 const response=await fetch('/api/fir/records',{method,cache:'no-store',headers:{'Content-Type':'application/json'},...(changes?{body:JSON.stringify({changes})}:{})});
 const result=await response.json();if(!response.ok)throw new Error(result.error || 'FIR backend is unavailable.');return result.records as FIRItem[];
}
export const firPersistence={
 getError:()=>failure,
 flush:()=>queue,
 async refresh(){if(activeUser) await this.hydrate(activeUser);},
 subscribe(fn:()=>void){listeners.add(fn);return()=>{listeners.delete(fn);};},
 async hydrate(user:UserSession){
  await queue.catch(()=>{});
  activeUser=user;
  const legacy=firService.getLocalMigrationRecords().filter(f=>isFirVisibleToUser(user,f));
  try{
   let records=await request();
   const pending=legacy.filter(f=>!records.some(r=>r.id===f.id));
   if(pending.length && ['SHO','MHC_GD_INCHARGE','DUTY_OFFICER','SUPER_ADMIN','SP_DISTRICT','DSP_SUBDIV'].includes(user.role)){
    for(let start=0;start<pending.length;start+=500){const imported=await request('POST',pending.slice(start,start+500).map(record=>({record,expectedVersion:0,preserveNumber:true})));records=[...records,...imported];}
   }
   firService.replaceServerRecords(records);
   publish();
  }catch(error){firService.replaceServerRecords([]);publish(error instanceof Error?error.message:'FIR backend is unavailable.');throw error;}
 },
};

export const persistentFirService=new Proxy(firService,{
 get(target,key){
  const method=Reflect.get(target,key);
  if(!writes.includes(key as Write))return typeof method==='function'?method.bind(target):method;
  return (...args:unknown[])=>{
   const operation=queue.catch(()=>{}).then(async()=>{
    if(!activeUser)throw new Error('FIR session is not ready. Reload and sign in.');
    if(failure)throw new Error(failure);
    const before=structuredClone(target.getAllFirs());
    let result:unknown,operationError:unknown;
    try{result=await method.apply(target,args);}catch(error){operationError=error;}
    const after=target.getAllFirs(),changes=after.filter(record=>JSON.stringify(before.find(f=>f.id===record.id))!==JSON.stringify(record)).map(record=>({record,expectedVersion:before.find(f=>f.id===record.id)?.persistenceVersion || 0}));
    try{
     if(changes.length){const saved=await request('POST',changes);const merged=after.map(record=>saved.find(f=>f.id===record.id)||record);target.replaceServerRecords(merged);
      const canonical=(value:unknown)=>value && typeof value==='object' && 'id' in value?saved.find(f=>f.id===(value as FIRItem).id)||value:value;
      result=Array.isArray(result)?result.map(canonical):canonical(result);
     }
    }catch(error){target.replaceServerRecords(before);publish(error instanceof Error?error.message:'FIR could not be saved.');throw error;}
    if(operationError)throw operationError;
    return result;
   });
   queue=operation;return operation;
  };
 }
}) as unknown as Persistent;
