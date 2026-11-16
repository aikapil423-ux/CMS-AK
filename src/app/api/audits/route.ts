import { z } from 'zod';
import { apiAccess } from '@/lib/apiSecurity';
import { auditColumns, auditSources, auditDate, filterAudit, summarizeAudit } from '@/lib/audits';
import { advanceInspection, appendAudit, auditMetadata, auditSupervisor, loadAuditRows, recordReplyRequirement } from '@/services/auditRepository';

export const runtime='nodejs';
const filterSchema=z.preprocess(value=>value&&typeof value==='object'?Object.fromEntries(Object.entries(value).filter(([,v])=>v!=='')):value,z.object({
  source:z.enum(['all',...auditSources]).default('all'),search:z.string().max(200).optional(),
  replyKind:z.enum(['saved','required']).optional(),
  metric:z.string().max(100).optional(),
  from:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),to:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dateField:z.enum(['registered','updated','assigned','submitted']).default('registered'),
  station:z.string().max(200).optional(),district:z.string().max(200).optional(),officer:z.string().max(200).optional(),category:z.string().max(300).optional(),status:z.string().max(100).optional(),
  pending:z.enum(['yes','no']).optional(),minAge:z.string().regex(/^\d{1,5}$/).optional(),findings:z.enum(['yes']).optional(),
  logic:z.enum(['AND','OR']).optional(),rules:z.array(z.object({field:z.enum(['station','district','officer','category','status']),value:z.string().max(300)})).max(20).optional(),
  sort:z.enum(auditColumns).default('registered'),direction:z.enum(['asc','desc']).default('desc'),page:z.coerce.number().int().min(1).max(100000).default(1),pageSize:z.coerce.number().int().min(1).max(100).default(25),
  secondarySort:z.enum(auditColumns).optional(),
}).refine(f=>(!f.from||auditDate(f.from)===f.from)&&(!f.to||auditDate(f.to)===f.to),'Invalid calendar date')
  .refine(f=>!f.from||!f.to||f.from<=f.to,'From date must not exceed To date'));
export async function GET(req:Request) {
  const user=await apiAccess(req);if(user instanceof Response)return user;
  try {
    const params=new URL(req.url).searchParams, raw=Object.fromEntries([...params].filter(([,v])=>v!==''));
    const f=filterSchema.parse({...raw,rules:raw.rules?JSON.parse(raw.rules):undefined});
    const {rows,warnings}=await loadAuditRows(user);
    const filtered=filterAudit(rows,f).sort((a,b)=>{const av=a[f.sort],bv=b[f.sort];const value=typeof av==='number'&&typeof bv==='number'?av-bv:String(av??'').localeCompare(String(bv??''),undefined,{numeric:true});return (f.direction==='asc'?value:-value)||(f.secondarySort?String(a[f.secondarySort]??'').localeCompare(String(b[f.secondarySort]??''),undefined,{numeric:true}):0)||a.id.localeCompare(b.id);});
    const authorizedIds=new Set(rows.map(r=>r.id));
    const allMetadata=await auditMetadata();
    const reviews:Record<string,{status:string;remarks:string;at:string}>={};
    for(const event of [...allMetadata].sort((a,b)=>a.at.localeCompare(b.at)))if(event.action==='review'&&rows.some(r=>r.id===event.data.recordId&&r.findings.includes(String(event.data.rule))))reviews[String(event.data.recordId)+'|'+String(event.data.rule)]={status:String(event.data.status),remarks:String(event.data.remarks),at:event.at};
    const policy=allMetadata.filter(e=>e.action==='ageingPolicy').sort((a,b)=>a.at.localeCompare(b.at)).at(-1);
    const buckets=Array.isArray(policy?.data.buckets)?policy.data.buckets as number[]:undefined;
    const metadata=allMetadata.filter(e=>e.owner===user.id &&
      (e.action==='definition'||Array.isArray(e.data.authorizedIds)&&e.data.authorizedIds.every(id=>authorizedIds.has(String(id)))));
    const mode=params.get('mode');
    if(mode==='replies')return Response.json({records:rows.filter(r=>r.source==='courts'&&!r.required&&r.caseId===params.get('caseId')).map(r=>({id:r.id,title:r.title,reference:r.reference,status:r.status}))},{headers:{'Cache-Control':'no-store'}});
    if(mode==='export') {
      if(filtered.length>20000)return Response.json({error:'Narrow filters to at most 20,000 records before exporting.'},{status:400});
      await appendAudit(user,'export','Audit export',{filters:f,total:filtered.length,authorizedIds:filtered.map(r=>r.id)});
    }
    const scope=`${user.role} · ${user.district} · ${user.stationName}`;
    const publicEvent=(event:typeof metadata[number])=>{
      const {snapshot,...rest}=event.data;
      delete rest.authorizedIds;
      const captured=snapshot as {records?:unknown[];summary?:unknown;warnings?:unknown}|undefined;
      return {...event,data:{...rest,...(captured?{snapshot:{summary:captured.summary,warnings:captured.warnings,recordCount:captured.records?.length||0}}:{})}};
    };
    let comparison=null;
    if(f.from&&f.to){const duration=Date.parse(f.to)-Date.parse(f.from)+86400000;const from=new Date(Date.parse(f.from)-duration).toISOString().slice(0,10),to=new Date(Date.parse(f.from)-86400000).toISOString().slice(0,10);const previous=filterAudit(rows,{...f,from,to});comparison={from,to,previous:previous.length,current:filtered.length,change:filtered.length-previous.length};}
    return Response.json({rows:mode==='export'?filtered:filtered.slice((f.page-1)*f.pageSize,f.page*f.pageSize),total:filtered.length,
      summary:summarizeAudit(filtered,buckets),comparison,reviews,warnings,scope,generatedBy:user.name,generatedAt:new Date().toISOString(),filters:f,canReview:auditSupervisor(user),canConfigure:user.role==='SUPER_ADMIN',
      options:Object.fromEntries(['station','district','officer','category','status'].map(key=>[key,[...new Set(rows.map(r=>r[key as 'station']).filter(Boolean))].sort()])),
      saved:metadata.filter(e=>e.action==='definition').map(publicEvent),history:metadata.filter(e=>e.action!=='definition').sort((a,b)=>b.at.localeCompare(a.at)).slice(0,100).map(publicEvent),
    },{headers:{'Cache-Control':'no-store'}});
  }catch(error){return Response.json({error:error instanceof z.ZodError||error instanceof SyntaxError?'Invalid audit filters.':'Audit sources could not be loaded. No totals have been substituted.'},{status:error instanceof z.ZodError||error instanceof SyntaxError?400:503});}
}
const command=z.discriminatedUnion('action',[
  z.object({action:z.literal('definition'),name:z.string().trim().min(1).max(150),filters:filterSchema,columns:z.array(z.enum(auditColumns)).min(1),group:z.enum(['status','station','officer','category','source']).default('status')}),
  z.object({action:z.literal('requirement'),name:z.string().trim().min(1).max(150),caseId:z.string().min(1),reference:z.string().trim().min(1).max(500),replyId:z.string().optional()}),
  z.object({action:z.literal('linkReply'),name:z.string().trim().min(1).max(150),requirementId:z.string().uuid(),replyId:z.string().min(1)}),
  z.object({action:z.literal('review'),name:z.string().trim().min(1).max(150),recordId:z.string(),rule:z.string().max(500),status:z.enum(['Under Verification','Confirmed','False Positive','Resolved']),remarks:z.string().trim().min(1).max(4000)}),
  z.object({action:z.literal('inspection'),name:z.string().trim().min(1).max(150),filters:filterSchema,remarks:z.string().max(4000)}),
  z.object({action:z.literal('inspectionTransition'),runId:z.string().uuid(),expectedId:z.string().uuid(),status:z.enum(['Running','Review Pending','Finalized','Closed']),remarks:z.string().max(4000)}),
  z.object({action:z.literal('ageingPolicy'),name:z.literal('Ageing policy'),buckets:z.array(z.number().int().min(0).max(36500)).min(2).max(15).refine(b=>b[0]===0&&b.every((v,i)=>i===0||v>b[i-1]))}),
]);
export async function POST(req:Request) {
  const user=await apiAccess(req);if(user instanceof Response)return user;
  try {
    const input=command.parse(await req.json());
    if(input.action==='ageingPolicy'&&user.role!=='SUPER_ADMIN')return Response.json({error:'Administrator permission required.'},{status:403});
    if(input.action!=='definition'&&!auditSupervisor(user))return Response.json({error:'Supervisory permission required.'},{status:403});
    const {rows,cases,warnings}=await loadAuditRows(user);
    if(input.action==='inspectionTransition') {
      try{return Response.json({event:await advanceInspection(user,input,new Set(rows.map(r=>r.id)))},{status:201});}
      catch(e){return Response.json({error:e instanceof Error?e.message:'Inspection update failed.'},{status:409});}
    }
    if(input.action==='requirement') {
      if(!cases.has(input.caseId))return Response.json({error:'Case not found or access denied.'},{status:404});
      if(input.replyId&&!rows.some(r=>r.id===input.replyId&&r.source==='courts'&&!r.required&&r.caseId===input.caseId))return Response.json({error:'Select a saved reply belonging to this case.'},{status:400});
    }
    if(input.action==='review'&&!rows.some(r=>r.id===input.recordId&&r.findings.includes(input.rule)))return Response.json({error:'Finding not found in your authorized scope.'},{status:404});
    const data:Record<string,unknown>={...input};
    data.authorizedIds=[];
    if(input.action==='linkReply') {
      const requirement=rows.find(r=>r.id==='requirement:'+input.requirementId);
      if(!requirement||!rows.some(r=>r.id===input.replyId&&!r.required&&r.source==='courts'&&r.caseId===requirement.caseId))return Response.json({error:'Requirement and reply must belong to the same authorized case.'},{status:400});
      data.authorizedIds=[requirement.id,input.replyId];
    }
    if(input.action==='requirement')data.authorizedIds=[cases.get(input.caseId)!.id];
    if(input.action==='review')data.authorizedIds=[input.recordId];
    if(input.action==='requirement') {
      try{return Response.json({event:await recordReplyRequirement(user,input.name,data)},{status:201});}
      catch(e){return Response.json({error:e instanceof Error?e.message:'Requirement could not be saved.'},{status:409});}
    }
    if(input.action==='inspection') {
      const selected=filterAudit(rows,input.filters);
      data.snapshot={summary:summarizeAudit(selected),records:selected.map(r=>({id:r.id,status:r.status,findings:r.findings})),warnings};
      data.status='Draft';
      data.authorizedIds=selected.map(r=>r.id);
    }
    return Response.json({event:await appendAudit(user,input.action,input.name,data)},{status:201});
  }catch(error){return Response.json({error:error instanceof z.ZodError?'Check required audit fields.':'Audit could not be saved.'},{status:error instanceof z.ZodError?400:503});}
}
