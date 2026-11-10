"use client";

import { useEffect, useRef, useState } from "react";
import { TelecomResultsTable } from "./TelecomResultsTable";
import type { CdrIpdrConsistencyReport, MnpHistoryItem, ReconciliationDashboardSummary, SimChangeTimelineItem, TelecomEvidenceFile } from "@/types/telecom";

type Mode = "SIM_IMEI_MNP" | "CDR_IPDR_CONSISTENCY" | "RECONCILIATION";
type Result =
  | {mode:"SIM_IMEI_MNP"; timeline:SimChangeTimelineItem[]; mnpRecords:MnpHistoryItem[]}
  | {mode:"CDR_IPDR_CONSISTENCY"; report:CdrIpdrConsistencyReport}
  | {mode:"RECONCILIATION"; summary:ReconciliationDashboardSummary};

const panels = {
  SIM_IMEI_MNP: {title:"SIM, IMEI & MNP", button:"Analyze SIM & IMEI", description:"See observed device and SIM combinations alongside saved number-porting records."},
  CDR_IPDR_CONSISTENCY: {title:"CDR & IPDR Consistency", button:"Run Consistency Check", description:"Check for time overlaps between voice calls and IPDR sessions for the same number."},
  RECONCILIATION: {title:"Multi-Operator Reconciliation", button:"Run Reconciliation", description:"Compare CDRs from different operators for this FIR and save matches for review."},
};
const dateTime = new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeStyle:"medium",timeZone:"Asia/Kolkata"});
function time(value:string) {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed)?dateTime.format(parsed):"—";
}

export function EvidenceAnalysisPanel({mode,firId,files,firLabel}:{mode:Mode;firId:string;firLabel?:string;files:TelecomEvidenceFile[]}) {
  const [result,setResult]=useState<Result|null>(null);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const request=useRef<AbortController|null>(null);
  const panel=panels[mode];
  const validFir=!!firId && firId!=="ALL";
  useEffect(()=>()=>request.current?.abort(),[]);

  async function analyze() {
    if(!validFir || loading)return;
    const controller=new AbortController();
    request.current=controller;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const response=mode==="RECONCILIATION"
        ? await fetch("/api/telecom",{
          method:"POST",headers:{"Content-Type":"application/json"},
          body:JSON.stringify({action:"reconcile_run",firId}),signal:controller.signal,
        })
        : await fetch("/api/telecom?"+new URLSearchParams({firId,action:mode==="SIM_IMEI_MNP"?"sim_timeline":"cdr_ipdr_check"}),
          {signal:controller.signal,cache:"no-store"});
      const data=await response.json();
      if(!response.ok || !data.success)throw new Error(data.error || "Analysis failed.");
      if(controller.signal.aborted)return;
      if(mode==="SIM_IMEI_MNP")setResult({mode,timeline:data.timeline,mnpRecords:data.mnpRecords});
      else if(mode==="CDR_IPDR_CONSISTENCY")setResult({mode,report:data.report});
      else setResult({mode,summary:data.summary});
    } catch(err) {
      if(!controller.signal.aborted)setError(err instanceof Error?err.message:"Analysis failed.");
    } finally {
      if(!controller.signal.aborted)setLoading(false);
    }
  }

  return <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h4 className="text-sm font-bold text-slate-900">{panel.title}</h4>
        <p className="mt-1 text-xs text-slate-600">{panel.description}</p>
      </div>
      <button type="button" onClick={()=>void analyze()} disabled={!validFir || loading}
        className="rounded bg-blue-900 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">
        {loading?"Analyzing…":panel.button}
      </button>
    </div>
    {!validFir && <p className="text-xs text-slate-600">Select an FIR to run this analysis.</p>}
    {error && <p role="alert" className="text-xs text-red-800">{error}</p>}
    {result?.mode==="SIM_IMEI_MNP" && <>
      <h5 className="text-xs font-bold">SIM and device observations (IST)</h5>
      {result.timeline.length?<TelecomResultsTable firLabel={firLabel} title="SIM and Device Observations" headers={["Number","IMEI","IMSI","First seen","Last seen","Records","Operator","Source file"]}
        rows={result.timeline.map((row,index)=>({key:String(index),values:[
          row.msisdn,row.imei,row.imsi,time(row.firstObserved),time(row.lastObserved),row.totalCallsRecorded,row.operator || "—",row.sourceFile,
        ],sortValues:[row.msisdn,row.imei,row.imsi,row.firstObserved,row.lastObserved]}))} />:<p className="text-xs text-slate-600">No IMEI or IMSI values in the available CDR records.</p>}
      <h5 className="text-xs font-bold">Mobile number porting (MNP)</h5>
      {result.mnpRecords.length?<TelecomResultsTable firLabel={firLabel} title="Mobile Number Porting" headers={["Number","Previous operator","New operator","Porting date","Verification","Source"]}
        rows={result.mnpRecords.map(row=>({key:row.id,values:[
          row.msisdn,row.previousOperator,row.newOperator,row.portingDate,row.verificationStatus,row.sourceDocument,
        ]}))} />:<p className="text-xs text-slate-600">No saved MNP records for this FIR’s CDR numbers.</p>}
    </>}
    {result?.mode==="CDR_IPDR_CONSISTENCY" && <>
      <p role="status" className="text-xs text-slate-700">{result.report.consistentCount} overlaps · {result.report.unverifiableCount} IPDR sessions without a verified overlap</p>
      {result.report.findings.length?<TelecomResultsTable firLabel={firLabel} title="CDR and IPDR Consistency" headers={["Finding","CDR record","IPDR record","Details"]}
        rows={result.report.findings.map((row,index)=>({key:String(index),values:[
          row.issueType,row.cdrRecordId || "—",row.ipdrRecordId || "—",row.description,
        ]}))} />:<p className="text-xs text-slate-600">No matching voice and data time overlaps found.</p>}
    </>}
    {result?.mode==="RECONCILIATION" && <>
      <TelecomResultsTable firLabel={firLabel} title="Reconciliation Summary" headers={["Records checked","Matched pairs","Potential pairs","Conflicting pairs","Duplicate pairs"]}
        rows={[{key:"summary",values:[result.summary.totalRecordsChecked,result.summary.matchedRecordsCount,
          result.summary.potentialMatchesCount,result.summary.conflictingRecordsCount,result.summary.duplicateRecordsCount]}]} />
      {result.summary.overlappingDatasets.length?<TelecomResultsTable firLabel={firLabel} title="Operator File Overlaps" headers={["File A","File B","Overlap start (IST)","Overlap end (IST)","Common records"]}
        rows={result.summary.overlappingDatasets.map(row=>({key:row.fileA+"|"+row.fileB,values:[
          files.find(file=>file.id===row.fileA)?.originalFilename || row.fileA,
          files.find(file=>file.id===row.fileB)?.originalFilename || row.fileB,
          time(row.overlapStart),time(row.overlapEnd),row.commonCallCount,
        ],sortValues:[files.find(file=>file.id===row.fileA)?.originalFilename || row.fileA,files.find(file=>file.id===row.fileB)?.originalFilename || row.fileB,row.overlapStart,row.overlapEnd]}))} />:<p className="text-xs text-slate-600">No overlapping time ranges in the operator files.</p>}
    </>}
  </section>;
}
