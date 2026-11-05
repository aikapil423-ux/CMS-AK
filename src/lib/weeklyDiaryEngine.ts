import type { FIRItem, ComplaintItem } from '@/types';
import type { UniversalEvidenceRecord } from '@/types/evidence';
import { recordedCalendarDate } from '@/lib/dataIntegrity';
import { WEEKLY_TEMPLATE, fixedKey, type DiaryPacket, type DiaryRow, type DiaryValue } from '@/lib/weeklyDiary';

type Bag=Record<string,unknown>;
const object=(v:unknown):Bag=>v&&typeof v==='object'&&!Array.isArray(v)?v as Bag:{};
const text=(v:unknown)=>typeof v==='string'||typeof v==='number'?String(v):'';
const array=(v:unknown):Bag[]=>Array.isArray(v)?v.map(object):[];
export function diaryDate(v:unknown) {
  const s=text(v);if(!s)return '';
  if(/^\d{4}-\d{2}-\d{2}T/.test(s) && Number.isFinite(Date.parse(s)))return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(s));
  return recordedCalendarDate(s) || (/^\d{2}[./-]\d{2}[./-]\d{2}$/.test(s)?recordedCalendarDate(s.slice(0,-2)+'20'+s.slice(-2)):'');
}
export function buildWeeklyDiary(input:{from:string;to:string;station:string;district?:string;firs:FIRItem[];complaints:ComplaintItem[];evidence:UniversalEvidenceRecord[]}):DiaryPacket {
  const {from,to,station}=input,packet:DiaryPacket={version:WEEKLY_TEMPLATE.version,from,to,station,fixed:{},blocks:{},overrides:{},warnings:[],generatedAt:new Date().toISOString()};
  const inside=(date:unknown)=>{const d=diaryDate(date);return !!d && d>=from&&d<=to;};
  const before=(date:unknown)=>{const d=diaryDate(date);return !!d&&d<=to;};
  const auto=(v:unknown,source:string,sourceId?:string):DiaryValue=>({value:text(v),origin:'AUTO',source,sourceId});
  const row=(values:unknown[],source:string,id?:string):DiaryRow=>Object.fromEntries(values.map((v,i)=>[String(i+1),auto(v,source,id)]).filter(([,v])=>(v as DiaryValue).value!==''));
  const add=(key:string,values:unknown[],source:string,id?:string)=>{const list=packet.blocks[key] ||= [];list.push(row([list.length+1,...values],source,id));};
  const fixed=(sheet:string,r:number,c:number,value:unknown,source:string)=>{if(text(value)!=='')packet.fixed[fixedKey(sheet,r,c)]=auto(value,source);};
  const warnings=new Set<string>();
  const firs=input.firs.filter(f=>before(f.firDate));
  const evidence=input.evidence.filter(e=>e.processingStatus==='COMPLETED');
  const days=(date:unknown)=>Math.max(0,Math.floor((Date.parse(to)-Date.parse(diaryDate(date)))/86400000));
  const bandA=(d:number)=>d>730?'over2':d>365?'over1':d>180?'over6m':d>90?'over3m':'under3m';
  const bandB=(d:number)=>d>1095?'over3':d>730?'over2':d>365?'over1':d>180?'over6m':'under6m';
  const listA:{values:unknown[];date:string;amount:number;id:string}[]=[],listB:typeof listA=[];
  let partialCount=0,reopenedCount=0;
  for(const fir of firs) {
    const f=fir as unknown as Bag,source=`FIR ${fir.firNumber}`,id=fir.id;
    const own=evidence.filter(e=>e.caseId===id || Boolean(fir.sourceComplaintId&&e.caseId===fir.sourceComplaintId));
    const processed=own[0]?.structuredData;
    const io=[fir.actionTakenData?.investigationOfficerName || fir.assignedIoName,fir.actionTakenData?.investigationOfficerMobile || fir.assignedIoPhone].filter(Boolean).join(' / ');
    const sections=fir.actsAndSections || (processed?.legalSections || []).map(s=>`${s.section} ${s.act}`).join(', ');
    const facts=fir.briefFacts || fir.incidentDetails || own.map(e=>text(object(object(e.structuredData).summary).briefFacts)).filter(Boolean).join('\n');
    const amount=f.totalPropertyEstimatedValue,amountNumber=Number(text(amount).replace(/[^0-9.]/g,''))||0;
    const accused=fir.accusedList || [];
    // Dated arrests after the report cutoff cannot affect as-of counts.
    const arrested=accused.filter(a=>a.isArrested && before(a.arrestDate));
    const pending=accused.filter(a=>!a.isArrested || Boolean(a.arrestDate&&!before(a.arrestDate)));
    const arrestCount=accused.some(a=>a.isArrested&&!diaryDate(a.arrestDate))?undefined:arrested.length;
    if(arrestCount===undefined)warnings.add('Some arrests have no date; their historical arrest totals remain blank.');
    const action=text(object(f.actionTakenData).briefDescription) || text(f.workDoneSummary),pendingText=text(f.pendingReason);
    const reports=array(f.reports).filter(r=>{const d=object(r.finalReportData);return before(d.reportDate || r.generatedDate || r.createdAt);});
    const latest=reports.sort((a,b)=>diaryDate(object(b.finalReportData).reportDate || b.generatedDate).localeCompare(diaryDate(object(a.finalReportData).reportDate || a.generatedDate)))[0];
    const lastData=object(latest?.finalReportData),lastWorkflow=object(latest?.finalReportWorkflow);
    const challans=array(f.challanRecords).filter(c=>before(c.issuedAt)).sort((a,b)=>diaryDate(b.issuedAt).localeCompare(diaryDate(a.issuedAt)));
    const lastChallan=challans[0];
    const updated=diaryDate(f.updatedAt || f.createdAt),history=array(f.statusHistory).filter(s=>before(s.date || s.timestamp)).sort((a,b)=>diaryDate(text(b.date || b.timestamp)).localeCompare(diaryDate(text(a.date || a.timestamp))));
    const status=updated&&updated>to ? text(history[0]?.status) : fir.status;
    if(!status && !latest)warnings.add('Some records changed after the selected cutoff and have no historical status; their past pendency could not be reconstructed.');
    const active=/UNDER_INVESTIGATION|REGISTERED|ASSIGNED|ENQUIRY/i.test(status || '') && !latest && !lastChallan && !before(f.finalFormDate) && !array(f.reopenHistory || f.reopenEvents).some(e=>before(e.reopenedAt));
    const partial=lastChallan?lastChallan.challanMode==='PARTIAL':lastData.chargeSheetType==='Partial' || (status==='PARTIAL_CHARGESHEET' && before(f.finalFormDate));
    const reopen=array(f.reopenHistory || f.reopenEvents).filter(e=>before(e.reopenedAt)&&!array(f.completionHistory).some(c=>before(c.completedAt)&&diaryDate(c.completedAt)>=diaryDate(e.reopenedAt)));
    const recovery=array(f.recoveries || f.recoveryList);
    const recoveryText=recovery.filter(r=>before(r.recoveryDate || r.date)).map(r=>[r.description,r.value].map(text).filter(Boolean).join(' / ')).join('\n');
    const baseA=[fir.firNumber,fir.firDate,sections,fir.categoryDisplay || fir.category,amount,fir.incidentPlace,facts,accused.length,arrestCount,pending.length,io,action,pendingText];
    const baseB=[fir.firNumber,fir.firDate,sections,fir.categoryDisplay || fir.category,amount,recoveryText,lastData.reportDate || lastChallan?.issuedAt || f.finalFormDate,arrestCount,facts,action,pending.map(a=>[a.name,a.address].filter(Boolean).join(' / ')).join('\n'),io];
    if(active){add('uiA:'+bandA(days(fir.firDate)),baseA,source,id);listA.push({values:baseA,date:fir.firDate,amount:amountNumber,id});}
    if(partial || reopen.length){
      const key=reopen.length?'reopenedB:'+(days(fir.firDate)>1095?'over3':'other'):'uiB:'+bandB(days(fir.firDate));
      const values=[...baseB];if(reopen.length){values[6]=[reopen[0].orderNumber,reopen[0].orderDate,reopen[0].reason].map(text).filter(Boolean).join(' / ');values[7]=text(reopen[0].reason);}
      add(key,values,source,id);listB.push({values:baseB,date:fir.firDate,amount:amountNumber,id});if(reopen.length)reopenedCount++;else partialCount++;
    }
    for(const a of accused.filter(a=>a.isArrested&&inside(a.arrestDate)))add('arrests',[fir.firNumber,fir.firDate,sections,a.name,a.fatherName || a.relativeName,a.address,a.arrestDate,text(object(a).arrestLocation)],source,id);
    for(const c of challans) {
      const kind=c.challanMode==='PARTIAL'?'partial':'complete';
      if(inside(c.issuedAt)&&!reports.some(r=>inside(object(r.finalReportData).reportDate || r.generatedDate)))add(kind,[fir.firNumber,fir.firDate,sections,'','',c.issuedAt,'',arrestCount,pending.length,io,recoveryText],source,id);
      if(c.submittedToCourt===true && inside(c.courtSubmittedAt))add('courtSubmission',[fir.firNumber,fir.firDate,sections,c.challanMode,c.courtSubmittedAt,c.courtName,c.courtReceiptNo],source,id);
    }
    if(lastChallan && (!lastChallan.submittedToCourt || !before(lastChallan.courtSubmittedAt)))add('checking',[fir.firNumber,fir.firDate,sections,accused.length,'','',arrestCount,'',pending.length,lastChallan.challanMode,lastChallan.issuedAt,io],source,id);
    for(const r of recovery.filter(r=>inside(r.recoveryDate || r.date)))add('recovery',[fir.firNumber,fir.firDate,sections,r.recoveryDate || r.date,r.description,r.value],source,id);
    for(const r of reports) {
      const d=object(r.finalReportData),wf=object(r.finalReportWorkflow),form=text(d.formType),date=d.reportDate || r.generatedDate;
      const kind=form==='CHARGESHEET'?(d.chargeSheetType==='Partial'?'partial':'complete'):form==='UNTRACED'?'untraced':form==='CANCELLED'?'cancelled':form==='CLOSURE'?'closure':'';
      if(kind && inside(date))add(kind,['complete','partial'].includes(kind)?[fir.firNumber,fir.firDate,sections,text(d.sectionsAdded),text(d.sectionsRemoved),date,text(d.firIndexComplete),arrested.length,pending.length,io,recoveryText,...(kind==='partial'?[d.pendingDocuments || d.finalReportReasonDetails]:[])]:[fir.firNumber,fir.firDate,sections,date,text(d.firIndexComplete),'',d.briefFacts || facts,'','',io,d.finalReportReasonDetails || d.finalReportReason],`Saved final report ${text(r.id)}`,id);
      if(inside(d.dispatchDate) && text(d.rcNumber || r.rcNumber))add('dispatch',[fir.firNumber,fir.firDate,sections,form,d.rcNumber || r.rcNumber,d.dispatchDate],source,id);
      if(!challans.length && inside(wf.courtSubmittedAt) && wf.submittedToCourt===true)add('courtSubmission',[fir.firNumber,fir.firDate,sections,form,wf.courtSubmittedAt,d.courtName || d.courtType,wf.courtReceiptNo],source,id);
      if(!lastChallan && wf.state==='UNDER_CHECKING' && before(wf.chiSubmittedAt || wf.reviewedAt))add('checking',[fir.firNumber,fir.firDate,sections,accused.length,'','',arrestCount,'',pending.length,d.chargeSheetType,wf.chiSubmittedAt || wf.reviewedAt,io],source,id);
    }
    if(!reports.length && before(f.finalFormDate)) {
      const key=status==='UNTRACED'?'untraced':status==='CANCELLED'?'cancelled':status==='CHARGESHEET_FILED'?'complete':'';
      if(key&&inside(f.finalFormDate))add(key,key==='complete'?[fir.firNumber,fir.firDate,sections,'','',f.finalFormDate,'',arrested.length,pending.length,io,recoveryText]:[fir.firNumber,fir.firDate,sections,f.finalFormDate,'','',facts,'','',io,text(f.finalReportReason)],source,id);
    }
    if(['UNTRACED','CANCELLED'].includes(status) && before(f.finalFormDate))add('utRegister',[fir.firNumber,fir.firDate,sections,status==='UNTRACED'?f.finalFormDate:'',status==='CANCELLED'?f.finalFormDate:'',text(f.rcNumber),text(f.rcDate),io,text(f.courtSubmittedAt)?'जमा':''],source,id);
    if(inside(f.firDate)&&f.isZeroFir===true)add('zeroFir',[fir.firNumber,fir.firDate,sections,text(f.destinationPoliceStation)],source,id);
    if(inside(f.firDate)&&text(f.courtOrderDate))add('courtOrder',[fir.firNumber,fir.firDate,sections,text(f.courtName),f.courtOrderDate],source,id);
    for(const e of reopen.filter(e=>inside(e.reopenedAt))) {const reason=text(e.reason),key=/arrest/i.test(reason)?'reopenArrest':/disclosure/i.test(reason)?'reopenDisclosure':text(e.courtName)?'reopenCourt':'reopenSuperior';add(key,[fir.firNumber,fir.firDate,e.reopenedAt,e.courtName || e.reopenedBy,e.orderDate || e.orderNumber,io],source,id);}
    if(lastWorkflow.state==='UNDER_CHECKING' && !before(lastWorkflow.chiSubmittedAt || lastWorkflow.reviewedAt))warnings.add('Undated checking records were not counted.');
  }
  for(const [key,list] of [['amountA',[...listA].sort((a,b)=>b.amount-a.amount)],['dateA',[...listA].sort((a,b)=>a.date.localeCompare(b.date))],['amountB',[...listB].sort((a,b)=>b.amount-a.amount)],['dateB',[...listB].sort((a,b)=>a.date.localeCompare(b.date))]] as const)for(const item of list)add(key,item.values,'Same case list, sorted view',item.id);
  for(const c of input.complaints) {
    const b=c as unknown as Bag,received=diaryDate(c.createdAt),resolved=diaryDate(c.resolvedAt || c.disposedAt || c.firRegisteredAt);
    if(!received || received>to || (resolved && resolved<=to))continue;
    if(/COMPLETE|DISPOSED|FIR_REGISTERED/.test(c.status)&&!resolved){warnings.add('Resolved complaints without a disposal date cannot be reliably classified historically.');continue;}
    add('complaints',[c.complaintNumber,received,[c.complainantName,c.complainantMobile].filter(Boolean).join(' / '),c.assignedEoName,b.officeDiaryNo,b.officeDiaryDate,b.cctnsNo,String(days(received))],`Complaint ${c.complaintNumber}`,c.id);
  }
  // Reuse dated, quote-verified extracted events. Processing/upload timestamps
  // never stand in for the date of an arrest, recovery or court action.
  const seenEvents=new Set<string>();
  for(const e of evidence) {
    const fir=firs.find(f=>f.id===e.caseId || Boolean(f.sourceComplaintId&&f.sourceComplaintId===e.caseId));if(!fir)continue;
    const extraction=e.structuredData?.investigation;if(!extraction)continue;
    for(const event of extraction.events) {
      if(!inside(event.date) || event.source.verification!=='MATCHED_TEXT' || !event.source.verbatimQuote || !e.extractedText?.includes(event.source.verbatimQuote))continue;
      const type=event.type.toUpperCase().replace(/[ -]/g,'_'),date=diaryDate(event.date),io=fir.assignedIoName || '';
      const names=event.participantEntityIds.map(id=>extraction.entities.find(p=>p.id===id)?.primaryName || '').filter(Boolean).join(', ');
      const identity=JSON.stringify([fir.id,type,date,names,event.title]);if(seenEvents.has(identity))continue;seenEvents.add(identity);
      const source=`Processed: ${e.rawDocument.fileName} · ${event.source.verbatimQuote}`;
      const hasDated=(key:string,col:number)=>(packet.blocks[key] || []).some(r=>r['2']?.sourceId===fir.id&&diaryDate(r[String(col)]?.value)===date);
      if(type==='ARREST')for(const name of names.split(', ').filter(Boolean)) {
        const exists=(packet.blocks.arrests || []).some(r=>r['2']?.sourceId===fir.id&&diaryDate(r['8']?.value)===date&&r['5']?.value===name);
        if(!exists)add('arrests',[fir.firNumber,fir.firDate,fir.actsAndSections,name,'','',`${event.date} ${event.time}`,event.title],source,fir.id);
      }
      if(type==='RECOVERY' && !hasDated('recovery',5))add('recovery',[fir.firNumber,fir.firDate,fir.actsAndSections,event.date,event.title,''],source,fir.id);
      if(type==='COURT_SUBMISSION' && !hasDated('courtSubmission',6))add('courtSubmission',[fir.firNumber,fir.firDate,fir.actsAndSections,'',event.date,'',''],source,fir.id);
      if(type==='SECTION_CHANGE')add('sectionChanges',[fir.firNumber,fir.firDate,fir.actsAndSections,'','',io],source,fir.id);
      if(type==='PO_DECLARED' || type==='BAIL_JUMPER_DECLARED')add('poAdded',[names,type,event.date,event.title,'','','',fir.firNumber,fir.firDate,fir.actsAndSections,fir.policeStation],source,fir.id);
      if(type==='PO_ARRESTED' || type==='BAIL_JUMPER_ARRESTED')add('poRemoved',[names,type,event.date,event.title,'','','',fir.firNumber,fir.firDate,fir.actsAndSections,fir.policeStation],source,fir.id);
      if(type==='GANG_ARREST')add('gang',['',names,fir.categoryDisplay,'',event.title,''],source,fir.id);
    }
  }
  fixed('Performa',2,3,station,'Selected police station');fixed('Performa',3,1,`${from} TO ${to}`,'Selected inclusive date range');
  fixed('Performa',2,7,input.district || firs[0]?.district,'Authenticated district');
  const year=Number(to.slice(0,4)),yearDate=(y:number)=>`${y}${to.slice(4)}`;
  const curr=firs.filter(f=>f.firDate>=`${year}-01-01`).length,prev=firs.filter(f=>f.firDate>=`${year-1}-01-01`&&f.firDate<=yearDate(year-1)).length,prevTotal=firs.filter(f=>f.firDate.startsWith(String(year-1))).length;
  const annual=curr+prevTotal-prev;
  [[3,curr],[4,prev],[5,prevTotal],[6,annual]].forEach(([c,v])=>fixed('Performa',20,c,v,'Computed from scoped saved FIR registration dates'));
  fixed('Performa',21,5,listA.length,'As-of classified Part A cases');fixed('Performa',22,5,partialCount,'As-of classified partial-challan cases');
  if(annual){fixed('Performa',21,7,(listA.length/annual).toFixed(4),'Part A / last-one-year registrations');fixed('Performa',22,7,(partialCount/annual).toFixed(4),'Part B / last-one-year registrations');}
  const index:Record<number,string>={2:'courtOrder',3:'zeroFir',4:'complete',5:'partial',6:'cancelled',7:'untraced',8:'closure',9:'dispatch',10:'courtSubmission',11:'reopenArrest',12:'reopenDisclosure',13:'reopenCourt',14:'reopenSuperior',15:'arrests',16:'recovery',24:'checking',25:'poAdded',26:'poRemoved',28:'gang'};
  for(const [r,key] of Object.entries(index))if(packet.blocks[key]?.length)fixed('Index',Number(r),3,packet.blocks[key].length,'Matching dated backend records');
  fixed('Index',21,3,listA.length,'Part A classified cases');fixed('Index',22,3,partialCount,'Partial-challan classified cases');fixed('Index',23,3,reopenedCount,'Reopened pending cases');
  warnings.add('Blank means verified backend information was not available; it is not automatically NIL.');
  warnings.add('Staff, vehicles, PO/BJ, preventive, gang and Parcha-12 totals need dated verified backend records; missing information remains editable.');
  packet.warnings=[...warnings];return packet;
}
