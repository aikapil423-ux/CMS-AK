"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { TelecomResultsTable } from "./TelecomResultsTable";
import type { ActivitySpike, NormalizedCallRecord, ReciprocalAnalysis } from "@/types/telecom";

const titles = {
  SPIKES:"Activity Spikes",
  RECIPROCAL:"Reciprocal Ratio",
  SHORT_CALLS:"Short Calls (<30s)",
};
type Mode = keyof typeof titles;
type Analysis =
  | {mode:"SPIKES"; rows:ActivitySpike[]}
  | {mode:"RECIPROCAL"; result:ReciprocalAnalysis|null}
  | {mode:"SHORT_CALLS"; rows:NormalizedCallRecord[]};

const dates = new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeStyle:"medium",timeZone:"Asia/Kolkata"});
const field = "rounded border border-slate-300 bg-white px-2 py-1.5 text-xs";

export function CallAnalysisPanel({mode,firId,contacts,firLabel}:{mode:Mode;firId:string;firLabel?:string;contacts:Record<string,string[]>}) {
  const [target,setTarget]=useState("");
  const [contact,setContact]=useState("");
  const [multiplier,setMultiplier]=useState("2.5");
  const [analysis,setAnalysis]=useState<Analysis|null>(null);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const request=useRef<AbortController|null>(null);
  const validFir=!!firId && firId!=="ALL";
  const targets=Object.keys(contacts).sort();
  const parties=Object.hasOwn(contacts,target)?contacts[target]:[];
  const factor=Number(multiplier);
  const validInput=mode==="RECIPROCAL"?targets.includes(target)&&parties.includes(contact)
    :mode==="SPIKES"?Number.isFinite(factor)&&factor>=1&&factor<=100:true;
  useEffect(()=>()=>request.current?.abort(),[]);

  function clearResults(){
    setAnalysis(null);
    setError("");
  }

  async function run(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    if(!validFir || !validInput || loading)return;
    const controller=new AbortController();
    request.current=controller;
    clearResults();
    setLoading(true);
    const query=new URLSearchParams({firId});
    if(mode==="SPIKES"){
      query.set("action","spikes");
      query.set("multiplier",multiplier);
    }else if(mode==="RECIPROCAL"){
      query.set("action","reciprocal");
      query.set("numA",target);
      query.set("numB",contact);
    }else{
      query.set("action","short_calls");
      query.set("maxSec","30");
    }
    try{
      const response=await fetch("/api/telecom?"+query,{signal:controller.signal,cache:"no-store"});
      const data=await response.json();
      if(!response.ok || !data.success)throw new Error(data.error || "CDR analysis failed.");
      if(controller.signal.aborted)return;
      if(mode==="SPIKES")setAnalysis({mode,rows:data.spikes});
      else if(mode==="RECIPROCAL")setAnalysis({mode,result:data.result});
      else setAnalysis({mode,rows:data.calls});
    }catch(err){
      if(!controller.signal.aborted)setError(err instanceof Error?err.message:"CDR analysis failed.");
    }finally{
      if(!controller.signal.aborted)setLoading(false);
    }
  }

  return <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
    <h4 className="text-sm font-bold text-slate-900">{titles[mode]}</h4>
    {!validFir?<p className="text-xs text-slate-600">Select an FIR to analyze its CDR.</p>:
      <form onSubmit={run} className="flex flex-wrap items-end gap-3">
        {mode==="SPIKES" && <label className="grid gap-1 text-xs font-semibold">Daily baseline multiplier
          <input type="number" min={1} max={100} step="any" required value={multiplier} disabled={loading}
            className={field+" w-28"} onChange={e=>{setMultiplier(e.target.value);clearResults();}} />
        </label>}
        {mode==="RECIPROCAL" && <>
          <label className="grid gap-1 text-xs font-semibold">Party A (CDR target)
            <select value={target} disabled={!targets.length || loading} className={field}
              onChange={e=>{setTarget(e.target.value);setContact("");clearResults();}}>
              <option value="">{targets.length?"Select target":"No identified CDR targets"}</option>
              {targets.map(number=><option key={number}>{number}</option>)}
            </select>
          </label>
          <label className="grid gap-1 text-xs font-semibold">Party B (contact)
            <select value={contact} disabled={!parties.length || loading} className={field}
              onChange={e=>{setContact(e.target.value);clearResults();}}>
              <option value="">Select contact</option>
              {parties.map(number=><option key={number}>{number}</option>)}
            </select>
          </label>
        </>}
        <button type="submit" disabled={!validInput || loading}
          className="rounded bg-blue-900 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">
          {loading?"Analyzing…":mode==="SPIKES"?"Analyze Activity Spikes":mode==="RECIPROCAL"?"Analyze Reciprocal Ratio":"Find Short Calls"}
        </button>
      </form>}
    {error && <p role="alert" className="text-xs text-red-800">{error}</p>}
    {analysis?.mode==="SPIKES" && (analysis.rows.length?<TelecomResultsTable firLabel={firLabel} title={titles[mode]}
      headers={["Date (IST)","Records","Daily baseline","Spike multiplier","Associated numbers (sample)"]}
      rows={analysis.rows.map(row=>({key:row.date,values:[row.date,row.callCount,row.baselineAvg,
        row.deviationMultiplier+"×",row.associatedNumbers.join(", ")],sortValues:[row.date,row.callCount,row.baselineAvg,row.deviationMultiplier]}))}
    />:<p role="status" className="text-xs text-slate-600">No activity spikes matched this multiplier.</p>)}
    {analysis?.mode==="RECIPROCAL" && (analysis.result?<TelecomResultsTable firLabel={firLabel} title={titles[mode]}
      headers={["Party A","Party B","A to B records","B to A records","A/B ratio","First record (IST)","Last record (IST)"]}
      rows={[{key:"pair",values:[analysis.result.numberA,analysis.result.numberB,analysis.result.callsAtoB,
        analysis.result.callsBtoA,analysis.result.callsBtoA?analysis.result.ratioAtoB:"No return records",
        dates.format(new Date(analysis.result.firstCall)),dates.format(new Date(analysis.result.lastCall))]}]}
    />:<p role="status" className="text-xs text-slate-600">No recorded contact between these parties.</p>)}
    {analysis?.mode==="SHORT_CALLS" && (analysis.rows.length?<div className="space-y-2">
      <p role="status" className="text-xs text-slate-600">Showing {analysis.rows.length} recent short calls (up to 100).</p>
      <TelecomResultsTable firLabel={firLabel} title={titles[mode]} headers={["Time (IST)","Calling number","Called number","Direction","Duration (sec)"]}
        rows={analysis.rows.map(row=>({key:row.id,values:[dates.format(new Date(row.timestamp)),row.sourceNumber,
          row.destinationNumber,row.callType,row.durationSeconds],sortValues:[row.timestamp]}))} />
    </div>:<p role="status" className="text-xs text-slate-600">No recorded voice calls shorter than 30 seconds.</p>)}
  </section>;
}
