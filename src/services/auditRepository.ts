import { readRuntimeJson, writeRuntimeJson, listRuntimeJson } from "@/lib/runtimeJsonStore";
import { listStoredPdfScrutiny } from "@/services/scrutinyRepository";
import { readMasterLocationReferences } from "@/services/masterLocationReferences";
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import type { UserSession, ComplaintReportItem } from '@/types';
import type { CourtAffidavit } from '@/lib/courtAffidavit';
import { readComplaints } from '@/services/complaintRepository';
import { readFirRecords } from '@/services/firRepository';
import { canViewComplaint } from '@/utils/complaintPermissions';
import { isFirVisibleToUser } from '@/lib/firIntegrity';
import { scopeAllowed } from '@/lib/apiSecurity';
import { prisma } from '@/lib/prisma';
import { auditAge, auditDate, type AuditRow } from '@/lib/audits';
import { bailReplyTypes, statusReportTypes } from '@/lib/courtAffidavit';

const root = () => path.join(process.cwd(),'prisma','audits');
export const auditSupervisor = (user: UserSession) => ['SUPER_ADMIN','SP_DISTRICT','ASP_HQ','DSP_SUBDIV','SHO'].includes(user.role);
type Meta = { id: string; owner: string; action: string; at: string; name: string; data: Record<string, unknown> };
export async function auditMetadata(): Promise<Meta[]> {
  const files = await listRuntimeJson(root());
  return Promise.all(files.filter(file => /^[a-f0-9-]+\.json$/.test(path.basename(file))).map(file => readRuntimeJson<Meta>(file)));
}
// Each event is a new exclusive file: finalized inspections and their history are never overwritten.
export async function appendAudit(user: UserSession, action: string, name: string, data: Record<string,unknown>) {
  const event: Meta = {id:randomUUID(),owner:user.id,action,name,at:new Date().toISOString(),data};
  await fs.mkdir(root(),{recursive:true});
  await writeRuntimeJson(path.join(root(), event.id + '.json'), event);
  return event;
}
export async function recordReplyRequirement(user:UserSession,name:string,data:Record<string,unknown>) {
  await fs.mkdir(root(),{recursive:true});
  const key=createHash('sha256').update(JSON.stringify([data.caseId,String(data.reference).trim().toLowerCase(),name.trim().toLowerCase()])).digest('hex');
  const lock=path.join(root(),key+'.lock');
  try{await fs.mkdir(lock);}catch{throw new Error('This requirement is being saved. Refresh before retrying.');}
  try{
    if((await auditMetadata()).some(e=>e.action==='requirement'&&e.data.caseId===data.caseId&&String(e.data.reference).trim().toLowerCase()===String(data.reference).trim().toLowerCase()&&e.name.trim().toLowerCase()===name.trim().toLowerCase()))throw new Error('This reply requirement is already recorded. Link its prepared reply instead.');
    return await appendAudit(user,'requirement',name,data);
  }finally{await fs.rmdir(lock);}
}
export async function advanceInspection(user:UserSession,input:{runId:string;expectedId:string;status:string;remarks:string},visible:Set<string>) {
  const lock=path.join(root(),input.runId+'.lock');
  await fs.mkdir(root(),{recursive:true});
  try{await fs.mkdir(lock);}catch{throw new Error('Inspection update already in progress. Refresh and retry.');}
  try{
    const events=(await auditMetadata()).filter(e=>e.action==='inspection'&&(e.id===input.runId||e.data.runId===input.runId)).sort((a,b)=>a.at.localeCompare(b.at));
    const previous=events.find(e=>!events.some(next=>next.data.previousId===e.id));
    if(!previous||previous.owner!==user.id||previous.id!==input.expectedId)throw new Error('Inspection changed or access denied. Refresh and retry.');
    const ids=previous.data.authorizedIds;
    if(!Array.isArray(ids)||!ids.every(id=>visible.has(String(id))))throw new Error('Inspection scope is no longer authorized.');
    const next:Record<string,string>={Draft:'Running',Running:'Review Pending','Review Pending':'Finalized',Finalized:'Closed'};
    if(next[String(previous.data.status)]!==input.status)throw new Error('Invalid inspection transition.');
    return await appendAudit(user,'inspection',previous.name,{...previous.data,runId:input.runId,status:input.status,remarks:input.remarks,previousId:previous.id});
  }finally{await fs.rmdir(lock);}
}
async function jsonFiles(directory: string, nested = false): Promise<unknown[]> {
  const files = await listRuntimeJson(directory, nested);
  return Promise.all(files.filter(file => {
    const relative = path.relative(directory, file).split(path.sep);
    return /^[a-f0-9]{64}\.json$/.test(path.basename(file)) &&
      (relative.length === 1 || (nested && relative.length === 2 && /^[a-f0-9]{64}$/.test(relative[0])));
  }).map(file => readRuntimeJson(file)));
}
// Only project audit metadata; never send raw operational documents to this screen.
type Bag = Record<'id'|'status'|'workflowState'|'createdAt'|'updatedAt'|'firDate'|'assignedAt'|'sentToShoAt'|'complaintNumber'|'firNumber'|'district'|'policeStation'|'assignedEoName'|'assignedIoName'|'assignedEoId'|'assignedEoPno'|'categoryDisplay'|'category'|'actsAndSections'|'shoDecision'|'shoDecisionAt'|'sourceComplaintId'|'bailType'|'reportType'|'submittedByOfficer'|'submittedBy'|'submissionDate'|'firId'|'ownerId'|'scrutinyNumber'|'challanType'|'decision'|'scrutinyOfficer',string> & {
  firYear:number; isFirRegistered:boolean; isRecommendedForFir:boolean; isSentToSho:boolean;
  custodyUnit?:{district:string;name:string};reports?:ComplaintReportItem[];
  challanRecords?:{courtSubmittedAt?:string}[];affidavit:CourtAffidavit;
};
export async function loadAuditRows(user: UserSession) {
  const rows: AuditRow[]=[], warnings: string[]=[];
  const [complaints,firs]=await Promise.all([readComplaints(),readFirRecords()]);
  const visibleComplaints=complaints.filter(c=>canViewComplaint(user,c).allowed);
  const visibleFirs=firs.filter(f=>isFirVisibleToUser(user,f));
  const cases=new Map<string,AuditRow>();
  for(const [source,records] of [['complaints',visibleComplaints],['firs',visibleFirs]] as const) for(const record of records) {
    const c=record as unknown as Bag, isComplaint=source==='complaints';
    const status=String(c.workflowState||c.status||'Not recorded');
    const terminal=isComplaint?/^(COMPLETE|DISPOSED_|TRANSFERRED_|FIR_REGISTERED$)/i.test(status):/^(DISPOSED|CLOSED|CONVICTED|ACQUITTED|CANCELLED)/i.test(status);
    const registered=auditDate(isComplaint?c.createdAt:c.firDate);
    const row:AuditRow={id:source+':'+c.id,source,caseId:isComplaint?'complaint:'+c.id:c.id,reference:isComplaint?c.complaintNumber:c.firNumber,
      href:`/${isComplaint?'complaints':'fir'}/${encodeURIComponent(c.id)}`,district:c.custodyUnit?.district||c.district||'',station:c.custodyUnit?.name||c.policeStation||'',
      officer:(isComplaint?c.assignedEoName:c.assignedIoName)||'',category:c.categoryDisplay||c.category||c.actsAndSections||'',status,
      registered,updated:auditDate(c.updatedAt),assigned:auditDate(c.assignedAt),submitted:auditDate(c.sentToShoAt),
      title:isComplaint?'Complaint':'FIR',age:auditAge(registered),pending:terminal?false:status==='Not recorded'?null:true,findings:[]};
    if(!registered)row.findings.push('Registration date missing or invalid');
    if(isComplaint&&c.isFirRegistered&&!firs.some(f=>f.sourceComplaintId===c.id&&f.policeStation===c.policeStation&&f.district===c.district))row.findings.push('Marked FIR registered without matching saved FIR');
    if(c.shoDecision==='APPROVE'&&!c.shoDecisionAt)row.findings.push('SHO approval date not recorded');
    if(row.assigned&&registered&&row.assigned<registered)row.findings.push('Assignment date precedes registration date');
    if(isComplaint&&c.assignedEoName&&!c.assignedEoId&&!c.assignedEoPno)row.findings.push('Assigned EO has no recorded identifier');
    if(!isComplaint&&c.sourceComplaintId&&!complaints.some(parent=>parent.id===c.sourceComplaintId))row.findings.push('Source complaint reference does not exist');
    if(!isComplaint&&visibleFirs.filter(f=>f.firNumber===c.firNumber&&f.policeStation===c.policeStation&&f.district===c.district&&f.firYear===c.firYear).length>1)row.findings.push('Duplicate FIR number within station, district and year');
    if(!isComplaint&&c.status==='CHARGESHEET_FILED'&&!c.challanRecords?.some(r=>r.courtSubmittedAt))row.findings.push('FIR marked chargesheet filed without recorded court submission event');
    row.signals=[row.officer?'Assigned':'Unassigned',...(row.pending===true?['Pending']:row.pending===false?['Completed']:[])];
    if(isComplaint){
      if(c.isSentToSho)row.signals.push('Sent to SHO');
      if(c.shoDecision==='RE_ENQUIRY')row.signals.push('Returned for re-enquiry');
      if(c.isRecommendedForFir||/RECOMMEND.*FIR|FIR.*RECOMMEND/.test(status))row.signals.push('FIR recommended');
      if(firs.some(f=>f.sourceComplaintId===c.id&&f.policeStation===c.policeStation&&f.district===c.district))row.signals.push('Converted to FIR');
    }else{
      if(c.status==='UNDER_INVESTIGATION')row.signals.push('Under investigation');
      if(c.challanRecords?.some(r=>r.courtSubmittedAt))row.signals.push('Court submission recorded');
    }
    cases.set(row.caseId,row);rows.push(row);
    for(const report of c.reports||[]) rows.push({...row,id:`report:${c.id}:${report.id}`,source:'reports',title:report.title||'Report',category:report.reportTypeLabel||report.reportType||'',officer:report.officerName||row.officer,
      status:report.finalReportWorkflow?.state||(report.sentToSho||report.isSentToSho?'SENT_TO_SHO':report.status)||'Saved',
      registered:auditDate(report.createdAt||report.generatedDate),updated:auditDate(report.updatedAt),submitted:auditDate(report.sentToShoAt),age:auditAge(report.createdAt||report.generatedDate),pending:null,findings:[],signals:[report.isUploaded?'Uploaded report':'Saved report',...(report.sentToSho||report.isSentToSho?['Report sent to SHO']:[])]});
  }
  try {
    const [records, locations] = await Promise.all([prisma.gDRecord.findMany(), readMasterLocationReferences()]);
    for(const g of records.map(g => locations.location(g, 'name')).filter(g=>scopeAllowed(user,g))) {
      const author=JSON.parse(g.actualAuthorJson||'{}');
      // EO/IO audits do not broaden existing assignment access to station-wide diary contents.
      if(!auditSupervisor(user)&&!['MHC_GD_INCHARGE'].includes(user.role)&&author.id!==user.id&&author.pno!==user.pno)continue;
      rows.push({id:'gd:'+g.id,source:'gd',caseId:'',reference:g.gdNumber,href:'/general-diary',district:g.district,station:g.policeStation,officer:author.name||'',category:g.typeDisplay,status:g.status,title:g.subject,
        registered:auditDate(g.entryDateTime),updated:auditDate(g.updatedAt),assigned:'',submitted:'',age:auditAge(g.entryDateTime),pending:null,findings:[]});
    }
  }catch{warnings.push('GD source unavailable. GD totals are not certified zero.');}
  try {
    const ownerHash=createHash('sha256').update(user.id).digest('hex');
    const directory=path.join(process.cwd(),'prisma','court-affidavits');
    const documents=await jsonFiles(auditSupervisor(user)?directory:path.join(directory,ownerHash),auditSupervisor(user));
    for(const item of documents as {kind:string;record:Bag}[]) {
      const c=item.record,parent=cases.get(c?.affidavit?.firId);if(!parent)continue;
      const category=item.kind==='bail'?bailReplyTypes[c.bailType as keyof typeof bailReplyTypes]:statusReportTypes[c.reportType as keyof typeof statusReportTypes];
      rows.push({...parent,id:'court:'+c.id,source:'courts',title:category||c.affidavit.customType||'Court reply',category:category||'Other',
        status:c.status||'SAVED',officer:c.submittedByOfficer||c.submittedBy||'',registered:auditDate(c.createdAt),updated:auditDate(c.updatedAt),assigned:'',submitted:['SUBMITTED','FILED'].includes(c.status)?auditDate(c.submissionDate):'',age:auditAge(c.createdAt),pending:null,findings:[],signals:['Saved court reply']});
    }
  }catch{warnings.push('Court replies source unavailable. Prepared reply totals are incomplete.');}
  try {
    for(const c of await listStoredPdfScrutiny(auditSupervisor(user) ? undefined : user.id)) {
      const parent=cases.get(c.firId);if(!parent||!auditSupervisor(user)&&c.ownerId!==user.id)continue;
      rows.push({...parent,id:'scrutiny:'+c.id,source:'scrutiny',title:c.scrutinyNumber,category:c.challanType,status:c.decision,registered:auditDate(c.createdAt),updated:auditDate(c.updatedAt),submitted:'',officer:c.scrutinyOfficer||parent.officer,age:auditAge(c.createdAt),pending:c.decision==='PASSED'?false:true,findings:[],signals:[]});
    }
  }catch{warnings.push('Scrutiny source unavailable. Scrutiny totals are incomplete.');}
  const metadata=(await auditMetadata()).sort((a,b)=>a.at.localeCompare(b.at));
  for(const event of metadata) if(event.action==='requirement') {
    const parent=cases.get(String(event.data.caseId));if(!parent)continue;
    const latest=metadata.filter(e=>e.action==='linkReply'&&e.data.requirementId===event.id).at(-1);
    const prepared=rows.find(r=>r.id===(latest?.data.replyId||event.data.replyId)&&r.source==='courts'&&r.caseId===parent.caseId);
    rows.push({...parent,id:'requirement:'+event.id,source:'courts',title:event.name,category:'Recorded reply requirement',status:prepared?'PREPARED':'NOT_PREPARED',registered:auditDate(event.at),updated:auditDate(event.at),submitted:'',pending:!prepared,required:true,age:auditAge(event.at),findings:[],signals:[]});
  }
  warnings.push('Unrecorded reply requirements, browser-only miscellaneous court documents, statutory deadlines and court acceptance events are unavailable. Saved replies are not proof of filing. Older court replies without a recorded creation timestamp are excluded from creation-date filters.');
  return {rows,warnings,cases};
}
