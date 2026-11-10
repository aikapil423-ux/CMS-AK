"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { TelecomResultsTable } from "./TelecomResultsTable";
import type { CommunicationGap } from "@/types/telecom";

const dateTime = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "medium",
});
const fieldStyle = "rounded border border-slate-300 bg-white px-2 py-1.5 text-xs";

export function CommunicationGapsPanel({firId, contacts, firLabel}:{
  firId:string;
  firLabel?:string;
  contacts:Record<string,string[]>;
}) {
  const [target,setTarget] = useState("");
  const [contact,setContact] = useState("");
  const [hours,setHours] = useState("24");
  const [gaps,setGaps] = useState<CommunicationGap[]|null>(null);
  const [error,setError] = useState("");
  const [loading,setLoading] = useState(false);
  const request = useRef<AbortController|null>(null);
  const validFir = !!firId && firId !== "ALL";
  const minimum = Number(hours);
  const validHours = Number.isInteger(minimum) && minimum >= 1 && minimum <= 8760;
  const validPair = (!target || Object.hasOwn(contacts,target)) && (!contact || contacts[target]?.includes(contact));
  useEffect(() => () => request.current?.abort(), []);

  function clearResult() {
    setGaps(null);
    setError("");
  }

  async function analyze(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if(!validFir || !validHours || !validPair || loading)return;
    const controller = new AbortController();
    request.current?.abort();
    request.current=controller;
    clearResult();
    setLoading(true);
    const params = new URLSearchParams({action:"gaps",firId,gapHours:hours,byContact:"true"});
    if(target)params.set("numA",target);
    if(contact)params.set("numB",contact);
    try {
      const response = await fetch("/api/telecom?"+params,{signal:controller.signal,cache:"no-store"});
      const data = await response.json();
      if(!response.ok || !Array.isArray(data.gaps))throw new Error(data.error || "Could not load communication gaps.");
      if(!controller.signal.aborted)setGaps(data.gaps);
    }catch(err){
      if(!controller.signal.aborted)setError(err instanceof Error?err.message:"Could not load communication gaps.");
    }finally{
      if(!controller.signal.aborted)setLoading(false);
    }
  }

  return <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
    <div>
      <h4 className="text-sm font-bold text-slate-900">Communication Gaps</h4>
      <p className="mt-1 text-xs text-slate-600">Find time gaps between consecutive records for each contact pair.</p>
    </div>
    {!validFir ? <p className="text-xs text-slate-600">Select an FIR to analyze its CDR.</p> :
    <form onSubmit={analyze} className="flex flex-wrap items-end gap-3">
      <label className="grid gap-1 text-xs font-semibold">Party A (CDR target)
        <select className={fieldStyle} value={target} disabled={loading} onChange={event=>{
          setTarget(event.target.value);setContact("");clearResult();
        }}>
          <option value="">All FIR CDR activity</option>
          {Object.keys(contacts).sort().map(number=><option key={number}>{number}</option>)}
        </select>
      </label>
      <label className="grid gap-1 text-xs font-semibold">Party B (contact)
        <select className={fieldStyle} value={contact} disabled={!target || loading} onChange={event=>{
          setContact(event.target.value);clearResult();
        }}>
          <option value="">All contacts</option>
          {(contacts[target] || []).map(number=><option key={number}>{number}</option>)}
        </select>
      </label>
      <label className="grid gap-1 text-xs font-semibold">Minimum gap (hours)
        <input className={fieldStyle+" w-28"} type="number" min={1} max={8760} step={1} required value={hours}
          disabled={loading} onChange={event=>{setHours(event.target.value);clearResult();}} />
      </label>
      <button type="submit" className="rounded bg-blue-900 px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
        disabled={!validHours || !validPair || loading}>{loading?"Analyzing…":"Analyze Gaps"}</button>
    </form>}
    {error && <p role="alert" className="text-xs text-red-800">{error}</p>}
    {gaps && !gaps.length && <p role="status" className="text-xs text-slate-600">No gap of {hours} hours or longer was found in the available records.</p>}
    {!!gaps?.length && <div className="space-y-2">
      <p role="status" className="text-xs text-slate-700">{gaps.length} {gaps.length===1?"gap":"gaps"} found. Times shown in IST.</p>
      <TelecomResultsTable title="Communication Gaps" firLabel={firLabel}
        headers={["Party A","Party B","Last record before gap (IST)","First record after gap (IST)","Gap (hours)","Records in prior 24h","Records in next 24h"]}
        rows={gaps.map(gap=>({
          key:gap.lastCallBefore.id+"-"+gap.firstCallAfter.id,
          values:[gap.numberA,gap.numberB,dateTime.format(new Date(gap.gapStartTimestamp)),dateTime.format(new Date(gap.gapEndTimestamp)),
            Number(((Date.parse(gap.gapEndTimestamp)-Date.parse(gap.gapStartTimestamp))/3600000).toFixed(2)),gap.callsBeforeGap24h,gap.callsAfterGap24h],
          sortValues:[gap.numberA,gap.numberB,gap.gapStartTimestamp,gap.gapEndTimestamp],
        }))} />
    </div>}
  </section>;
}
