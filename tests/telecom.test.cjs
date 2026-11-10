const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
function load(file,deps={}){const exported={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,{exports:exported,require:n=>Object.hasOwn(deps,n)?deps[n]:require(n),Buffer,Date,process,console,setTimeout,URL,Response});return exported;}
const parsing=load('src/lib/telecomParsing.ts');
const engine=load('src/services/telecomService.ts',{'@/lib/telecomParsing':parsing,'@/services/firService':{firService:{addDocument(){}}}});
function fixture(){const svc=new engine.TelecomService();let data=svc.getInitialStore();svc.getStore=async()=>structuredClone(data);svc.saveStore=async s=>{data=structuredClone(s)};return {svc,read:()=>data};}
function parse(csv,category='CDR',columnMapping){return fixture().svc.parseBuffer({fileBuffer:Buffer.from(csv),fileName:'test.csv',category,operator:'AIRTEL',fileId:'test',firId:'fir_1',columnMapping});}
const csv=(type='OUTGOING',date='15/10/2026')=>`Calling Party,Called Party,Call Date,Call Time,Call Type,Duration\n9811111111,9822222222,${date},22:15:00,${type},120`;
test('call and SMS direction classifications are exact',()=>{for(const type of ['OUTGOING','INCOMING','SMS_IN','SMS_OUT','MISSED'])assert.equal(parse(csv(type)).calls[0].callType,type);assert.equal(parsing.evidenceDirection('unknown'),'OTHER')});
test('Indian dates and IST timestamps do not depend on host timezone',()=>{const r=parse(csv()).calls[0];assert.equal(r.callDate,'2026-10-15');assert.equal(r.timestamp,'2026-10-15T16:45:00.000Z');assert.equal(r.originalTimezone,'Asia/Kolkata');assert.equal(parse(csv('OUTGOING','03/04/2026')).calls[0].callDate,'2026-04-03')});
test('invalid and absent dates reject rows without fabricating evidence',()=>{for(const date of ['invalid','31/02/2026','']){const r=parse(csv('OUTGOING',date));assert.equal(r.recordCount,0);assert.ok(r.errors.length)}});
test('explicit UTC offset is preserved in normalized instant',()=>assert.equal(parsing.evidenceTimestamp('2026-10-15T22:15:00Z').timestamp,'2026-10-15T22:15:00.000Z'));
test('custom mapping applies to dates times duration and direction',()=>{const r=parse('src,dst,day,clock,dur,kind\n9811111111,9822222222,15/10/2026,22:15:00,120,SMS_IN','CDR',{sourceNumberCol:'src',destinationNumberCol:'dst',callDateCol:'day',callTimeCol:'clock',durationCol:'dur',callTypeCol:'kind'}).calls[0];assert.equal(r.callDate,'2026-10-15');assert.equal(r.durationSeconds,120);assert.equal(r.callType,'SMS_IN')});
test('quoted commas and multiline CSV fields are preserved',()=>{const r=parse('MSISDN,Subscriber Name,Address,City\n9811111111,Test,"House 1, Street 2\nFloor 3",Delhi','CAF').subscribers[0];assert.equal(r.city,'Delhi');assert.equal(r.address,'House 1, Street 2\nFloor 3')});
test('empty evidence never reports successful parsing',()=>assert.ok(parse('garbage').errors.length));
test('CDR Excel import finds operator headers after a title and a cover sheet',()=>{
 const xlsx=require('xlsx'),book=xlsx.utils.book_new();
 xlsx.utils.book_append_sheet(book,xlsx.utils.aoa_to_sheet([['Export summary']]),'Cover');
 xlsx.utils.book_append_sheet(book,xlsx.utils.aoa_to_sheet([
  ['Operator call records'],[],['A Party No.','B-PARTY NUMBER','Call Date & Time','Duration (Sec)'],
  [9811111111,9822222222,'15/10/2026 22:15:00',120],[],[9811111111,'','15/10/2026 22:30:00',45],
 ]),'Calls');
 const result=fixture().svc.parseBuffer({fileBuffer:xlsx.write(book,{type:'buffer',bookType:'xlsx'}),fileName:'operator.xlsx',category:'CDR',operator:'AIRTEL',fileId:'excel'});
 assert.equal(result.recordCount,1);
 assert.equal(result.calls[0].sourceNumber,'9811111111');
 assert.equal(result.calls[0].sourceRowNumber,4);
 assert.match(result.errors[0],/^Row 6:/);
});
test('missing CDR number columns produce one actionable error',()=>{
 const result=parse('Subscriber,Date,Duration\n9811111111,15/10/2026,120\n9822222222,15/10/2026,10');
 assert.equal(result.recordCount,0);
 assert.equal(result.errors.length,1);
 assert.match(result.errors[0],/Calling Number.*Called Number/);
});
test('communication gaps endpoint applies FIR, contact pair and minimum-hour filters',async()=>{
 const {svc,read}=fixture();
 const base=read().callRecords[0];
 read().callRecords=[
  {...base,id:'first',firId:'fir_1',sourceNumber:'9811111111',destinationNumber:'9822222222',timestamp:'2026-10-15T00:00:00.000Z'},
  {...base,id:'second',firId:'fir_1',sourceNumber:'9822222222',destinationNumber:'9811111111',timestamp:'2026-10-16T06:00:00.000Z'},
  {...base,id:'other-party',firId:'fir_1',sourceNumber:'9811111111',destinationNumber:'9833333333',timestamp:'2026-10-15T12:00:00.000Z'},
  {...base,id:'other-fir',firId:'other',sourceNumber:'9811111111',destinationNumber:'9822222222',timestamp:'2026-10-15T13:00:00.000Z'},
 ];
 const api=load('src/app/api/telecom/route.ts',{
  '@/services/telecomAccess':{telecomAccess:async()=>({service:svc,firs:[]})},
  '@/lib/apiSecurity':{apiAccess:()=>({id:'io',role:'IO'})},
  '@/services/firService':{firService:{}},'next/server':{NextResponse:Response},
 });
 const url='http://localhost/api/telecom?action=gaps&firId=fir_1&numA=9811111111&numB=9822222222&gapHours=';
 assert.equal((await api.GET(new Request(url+'0'))).status,400);
 const result=await (await api.GET(new Request(url+'24'))).json();
 assert.equal(result.gaps.length,1);
 assert.equal(result.gaps[0].gapHours,30);
 assert.equal(result.gaps[0].lastCallBefore.id,'first');
 assert.equal(result.gaps[0].firstCallAfter.id,'second');
 assert.equal((await (await api.GET(new Request(url+'31'))).json()).gaps.length,0);
 const grouped=await (await api.GET(new Request(
  'http://localhost/api/telecom?action=gaps&firId=fir_1&numA=9811111111&gapHours=24&byContact=true'
 ))).json();
 assert.equal(grouped.gaps.length,1);
 assert.equal(grouped.gaps[0].numberA,'9811111111');
 assert.equal(grouped.gaps[0].numberB,'9822222222');
 assert.equal(grouped.gaps[0].gapHours,30);
});
test('short calls excludes SMS, zero durations and calls exactly 30 seconds long',async()=>{
 const {svc,read}=fixture();
 const base=read().callRecords[0];
 read().callRecords=[
  {...base,id:'voice',firId:'fir_1',callType:'OUTGOING',durationSeconds:29},
  {...base,id:'limit',firId:'fir_1',callType:'INCOMING',durationSeconds:30},
  {...base,id:'sms',firId:'fir_1',callType:'SMS_IN',durationSeconds:5},
  {...base,id:'zero',firId:'fir_1',callType:'INCOMING',durationSeconds:0},
  {...base,id:'other',firId:'other',callType:'INCOMING',durationSeconds:15},
 ];
 const calls=await svc.getShortDurationCalls(30,'fir_1');
 assert.equal(calls.length,1);
 assert.equal(calls[0].id,'voice');
});
test('SIM timeline uses the target device for incoming rows and keeps distinct IMSIs',async()=>{
 const {svc,read}=fixture();
 const base=read().callRecords[0];
 read().callRecords=[
  {...base,firId:'fir_1',cdrTargetNumber:'9811111111',sourceNumber:'9822222222',destinationNumber:'9811111111',imei:'device',imsi:'sim-1'},
  {...base,firId:'fir_1',cdrTargetNumber:'9811111111',sourceNumber:'9811111111',destinationNumber:'9822222222',imei:'device',imsi:'sim-2'},
 ];
 const timeline=await svc.getSimChangeTimeline('fir_1');
 assert.equal(timeline.length,2);
 assert.ok(timeline.every(item=>item.msisdn==='9811111111'));
 assert.deepEqual(Array.from(timeline,item=>item.imsi).sort(),['sim-1','sim-2']);
});
test('multi-operator reconciliation requires two operators and persists a matching pair',async()=>{
 const {svc,read}=fixture();
 const base=read().callRecords[0],file=read().files[0];
 read().files=[{...file,id:'a',operator:'AIRTEL'},{...file,id:'b',operator:'JIO'}];
 read().callRecords=[{...base,id:'r1',fileId:'a',firId:'fir_1',operator:'AIRTEL'}];
 await assert.rejects(svc.runReconciliation('fir_1',true),/two different operators/);
 read().callRecords.push({...base,id:'r2',fileId:'b',firId:'fir_1',operator:'JIO'});
 assert.equal((await svc.runReconciliation('fir_1',true)).matchedRecordsCount,1);
 assert.equal(read().reconciliations.length,1);
});
test('target-oriented Vodafone CDR imports incoming SMS sender IDs and skips export notes',()=>{
 const result=parse([
  'Target /A PARTY NUMBER,CALL_TYPE,B PARTY NUMBER,Call date,Call Initiation Time,Service Type',
  '-----',
  '9811111111,Incoming,AD-EXAMPLE,15-10-2026,22:15:00,SMS',
  '9811111111,Incoming,9822222222,15-10-2026,22:16:00,Voice',
  '9811111111,Outgoing,9822222222,15-10-2026,22:17:00,Voice',
  'Note :- Operator footer',
 ].join('\n'));
 assert.equal(result.recordCount,3);
 assert.equal(result.errors.length,0);
 assert.equal(result.calls[0].sourceNumber,'AD-EXAMPLE');
 assert.equal(result.calls[0].destinationNumber,'9811111111');
 assert.equal(result.calls[0].callType,'SMS_IN');
 assert.equal(result.calls[1].sourceNumber,'9822222222');
 assert.equal(result.calls[2].sourceNumber,'9811111111');
 assert.equal(result.calls[0].cdrTargetNumber,'9811111111');
});
test('first and last contact choices are target-specific and save the processed result once',async()=>{
 const {svc,read}=fixture();
 const base=read().callRecords[0];
 const file={...read().files[0],id:'cdr-target',linkedFirId:'fir_1',originalFilename:'Copy of CDR 9811111111_ FIR.xlsx'};
 read().files.push(file);
 read().callRecords.push(
  {...base,id:'incoming',firId:'fir_1',fileId:file.id,sourceNumber:'9822222222',destinationNumber:'9811111111',callType:'INCOMING'},
  {...base,id:'outgoing',firId:'fir_1',fileId:file.id,sourceNumber:'9811111111',destinationNumber:'9822222222',callType:'OUTGOING'},
  {...base,id:'not-target',firId:'fir_1',fileId:file.id,sourceNumber:'9833333333',destinationNumber:'9822222222',callType:'OUTGOING'},
  {...base,id:'other-fir',firId:'other',fileId:file.id,sourceNumber:'9811111111',destinationNumber:'9844444444',callType:'OUTGOING'}
 );
 assert.deepEqual([...svc.getCdrTargetContacts(read(),'fir_1').get('9811111111').keys()],['9822222222']);
 await assert.rejects(svc.analyzeAndSaveCdrContact('fir_1','FIR','9822222222','9833333333','Officer'),/CDR target/);
 const result=await svc.analyzeAndSaveCdrContact('fir_1','FIR','9811111111','9822222222','Officer');
 assert.equal(result.result.totalCalls,2);
 assert.equal(read().savedFindings[0].firstLastContact.incomingToA,1);
 assert.equal(read().savedFindings[0].supportingRecordIds.length,2);
 const repeated=await svc.analyzeAndSaveCdrContact('fir_1','FIR','9811111111','9822222222','Officer');
 assert.equal(repeated.finding.id,result.finding.id);
});
test('IPDR retains source time and NAT identifiers',()=>{const r=parse('Source IP,Destination IP,Session Start,Translated IP,Translated Port\n10.0.0.1,8.8.8.8,2020-01-01T12:00:00Z,1.2.3.4,5678','IPDR').ipdrs[0];assert.equal(r.sessionStart,'2020-01-01T12:00:00.000Z');assert.equal(r.translatedIp,'1.2.3.4');assert.equal(r.translatedPort,5678)});
test('tower dump retains evidence time and direction',()=>{const r=parse('Calling Party,Called Party,Timestamp,Call Type,Cell ID\n9811111111,9822222222,2020-01-01T12:00:00Z,INCOMING,C1','TOWER_DUMP').towerDumps[0];assert.equal(r.timestamp,'2020-01-01T12:00:00.000Z');assert.equal(r.callType,'INCOMING')});
test('exclusions affect totals and target is not its own contact',async()=>{const {svc,read}=fixture();read().callRecords[0].isExcluded=true;assert.equal((await svc.getCdrStatistics({})).totalCalls,5);read().files[0].isExcludedFromCalculations=true;assert.equal((await svc.getCdrStatistics({})).totalCalls,0);read().files[0].isExcludedFromCalculations=false;const r=await svc.getCdrStatistics({targetNumber:'9812044819'});assert.ok(!r.mostFrequentNumbers.some(x=>x.number==='9812044819'));assert.ok(r.mostFrequentNumbers.some(x=>x.number==='9876543210'&&x.total===2))});
test('empty-case reports contain no invented counts or milestones',async()=>{const {svc}=fixture();const r=await svc.runReconciliation('missing');assert.equal(r.totalRecordsChecked,0);assert.equal(r.matchedRecordsCount,0);assert.equal(r.potentialMatchesCount,0);assert.equal(r.conflictingRecordsCount,0);assert.equal((await svc.getCdrIpdrConsistencyReport('missing')).consistentCount,0);assert.equal(await svc.getBeforeAfterComparison('missing','default'),null)});
test('empty auto-analysis rejects without generating certification or hypotheses',async()=>{const {svc,read}=fixture();await assert.rejects(svc.runAutoAnalysis('missing'),/No evidence/);assert.equal(read().courtExhibits.length,0);assert.equal(read().evidenceCertificates.length,0);assert.equal(read().hypotheses.length,0)});
test('auto-analysis creates versioned observations without court readiness claims',async()=>{const {svc,read}=fixture();await svc.runAutoAnalysis('fir_1');assert.ok(read().savedFindings.some(f=>f.reproduction));assert.equal(read().courtExhibits.length,0);assert.equal(read().evidenceCertificates.length,0);assert.equal(read().hypotheses.length,0);assert.ok(read().savedFindings.every(f=>!f.savedToFirDocuments))});
test('reproduction checks an actual baseline and detects tampering',async()=>{const {svc,read}=fixture();await assert.rejects(svc.reproduceAnalysis('missing','IO'),/Finding not found/);await svc.runAutoAnalysis('fir_1');const f=read().savedFindings.find(f=>f.findingType==='NIGHT_ACTIVITY');assert.equal((await svc.reproduceAnalysis(f.id,'IO')).matched,true);read().callRecords[0].durationSeconds++;assert.equal((await svc.reproduceAnalysis(f.id,'IO')).matched,false);assert.equal(read().reproductionRuns[0].firId,'fir_1')});
test('legacy finding cannot claim reproducibility',async()=>{const {svc,read}=fixture();read().savedFindings.push({id:'old'});await assert.rejects(svc.reproduceAnalysis('old','IO'),/no versioned calculation/)});
test('dual approval is isolated by FIR and action, and requires distinct people',async()=>{const {svc}=fixture();const p={firId:'A',targetId:'x',actionType:'FINAL_FORENSIC_REPORT',approverName:'one'};await svc.processDualApproval(p);await assert.rejects(svc.processDualApproval(p),/different second/);const b=await svc.processDualApproval({...p,firId:'B',approverName:'two'});assert.equal(b.status,'PENDING_SECOND_APPROVAL');const a=await svc.processDualApproval({...p,approverName:'two'});assert.equal(a.status,'FULLY_APPROVED');const c=await svc.processDualApproval({...p,actionType:'EVIDENCE_DELETION',approverName:'two'});assert.equal(c.status,'PENDING_SECOND_APPROVAL')});
test('certificate drafts remain unsigned and reject cross-case files',async()=>{const {svc}=fixture();const args={firId:'fir_1',evidenceFileIds:['tel-file-001'],signatoryName:'Officer',signatoryDesignation:'IO',signatoryOrganization:'Police'};const r=await svc.generateSection63BsaCertificate(args);assert.equal(r.isSigned,false);assert.match(r.certificateHtml,/UNSIGNED DRAFT/);await assert.rejects(svc.generateSection63BsaCertificate({...args,firId:'other'}),/valid evidence/)});
test('unauthenticated API requests are rejected before reading or writing',async()=>{const deps={'@/services/telecomAccess':{telecomAccess(){throw Error('must not access')}},'@/lib/apiSecurity':{apiAccess:()=>Response.json({error:'Login required'},{status:401})},'@/services/firService':{firService:{}},'next/server':{NextResponse:Response}};for(const file of ['src/app/api/telecom/route.ts','src/app/api/telecom/finding/route.ts']){const api=load(file,deps);if(api.GET)assert.equal((await api.GET(new Request('http://localhost/api/telecom'))).status,401);assert.equal((await api.POST(new Request('http://localhost/api/telecom',{method:'POST'}))).status,401)}});
test('per-request service filters other FIRs and preserves them on save',async()=>{const {svc,read}=fixture();read().files.push({...read().files[0],id:'hidden-file',linkedFirId:'other'});read().callRecords.push({...read().callRecords[0],id:'hidden-call',fileId:'hidden-file',firId:'other'});const access=load('src/services/telecomAccess.ts',{'@/services/telecomService':{TelecomService:engine.TelecomService,telecomService:svc},'@/services/firService':{firService:{getAllFirs:()=>[{id:'fir_1'},{id:'other'}]}},'@/lib/firIntegrity':{isFirVisibleToUser:(_u,f)=>f.id==='fir_1'}});const {service}=await access.telecomAccess({role:'IO'});const scoped=await service.getStore();assert.ok(!scoped.files.some(f=>f.id==='hidden-file'));scoped.callRecords[0].isExcluded=true;await service.saveStore(scoped);assert.ok(read().callRecords.some(c=>c.id==='hidden-call'));await assert.rejects(access.telecomAccess({role:'IO'},'other'),/Access denied/);await assert.rejects(access.validateTelecomReferences(service,{supportingFileIds:['hidden-file']}),/Access denied/)});
test('Excel date/time cells retain the supplied operator date',()=>{const XLSX=require('xlsx');const sheet=XLSX.utils.aoa_to_sheet([['Calling Party','Called Party','Call Date','Call Time','Call Type'],['9811111111','9822222222',new Date('2026-10-15T00:00:00Z'),new Date('1899-12-30T22:15:00Z'),'OUTGOING']]);sheet.C2.z='dd/mm/yyyy';sheet.D2.z='hh:mm:ss';const book=XLSX.utils.book_new();XLSX.utils.book_append_sheet(book,sheet,'CDR');const r=fixture().svc.parseBuffer({fileBuffer:XLSX.write(book,{type:'buffer',bookType:'xlsx'}),fileName:'operator.xlsx',category:'CDR',operator:'AIRTEL',fileId:'excel'});assert.equal(r.recordCount,1);assert.equal(r.calls[0].callDate,'2026-10-15');assert.equal(r.calls[0].callTime,'22:15:00')});
test('partial imports report invalid rows and negative durations',()=>{const r=parse(csv()+'\n9811111111,9822222222,31/02/2026,22:15:00,OUTGOING,10\n9811111111,9822222222,15/10/2026,22:15:00,OUTGOING,-10');assert.equal(r.recordCount,1);assert.equal(r.errors.length,2)});
test('cross-origin mutations fail existing API security',()=>{const security=load('src/lib/apiSecurity.ts',{'@/lib/serverSession':{sessionUser:()=>({id:'io',role:'IO'}),sameOrigin:()=>false}});assert.equal(security.apiAccess(new Request('http://localhost/api/telecom',{method:'POST'})).status,403)});
test('non-supervisor cannot process approvals',async()=>{const {svc}=fixture();const access=load('src/services/telecomAccess.ts',{'@/services/telecomService':{TelecomService:engine.TelecomService,telecomService:svc},'@/services/firService':{firService:{getAllFirs:()=>[{id:'fir_1'}]}},'@/lib/firIntegrity':{isFirVisibleToUser:()=>true}});const api=load('src/app/api/telecom/route.ts',{'@/services/telecomAccess':access,'@/lib/apiSecurity':{apiAccess:()=>({id:'io',role:'IO'})},'@/services/firService':{firService:{}},'next/server':{NextResponse:Response}});const result=await api.POST({json:async()=>({action:'dual_approval_process',firId:'fir_1',targetId:'target',actionType:'FINAL_FORENSIC_REPORT'})});assert.equal(result.status,403)});
test('selected-case master payload excludes other cases even for administrators',async()=>{const {svc,read}=fixture();read().files.push({...read().files[0],id:'other-file',linkedFirId:'other'});const access=load('src/services/telecomAccess.ts',{'@/services/telecomService':{TelecomService:engine.TelecomService,telecomService:svc},'@/services/firService':{firService:{getAllFirs:()=>[{id:'fir_1'},{id:'other'}]}},'@/lib/firIntegrity':{isFirVisibleToUser:()=>true}});const {service,firs}=await access.telecomAccess({role:'SUPER_ADMIN'},'fir_1');assert.equal(firs.length,2);assert.ok((await service.getStore()).files.every(f=>f.linkedFirId==='fir_1'))});
test('authenticated full payload loads with selected FIR scope',async()=>{const {svc}=fixture();const access=load('src/services/telecomAccess.ts',{'@/services/telecomService':{TelecomService:engine.TelecomService,telecomService:svc},'@/services/firService':{firService:{getAllFirs:()=>[{id:'fir_1',firNumber:'FIR/2026/0124'}]}},'@/lib/firIntegrity':{isFirVisibleToUser:()=>true}});const api=load('src/app/api/telecom/route.ts',{'@/services/telecomAccess':access,'@/lib/apiSecurity':{apiAccess:()=>({id:'io',name:'Officer',role:'IO'})},'@/services/firService':{firService:{}},'next/server':{NextResponse:Response}});const response=await api.GET(new Request('http://localhost/api/telecom?firId=fir_1'));assert.equal(response.status,200);const payload=await response.json();assert.equal(payload.success,true);assert.equal(payload.stats.totalCalls,6);assert.equal(payload.files.length,3);assert.equal(payload.beforeAfter.milestoneTitle,'Incident Reported Time (Burglar Alarm & Break-in)')});
test('target-relative direction and normalized phone numbers are consistent',async()=>{const {svc}=fixture();const r=await svc.getCdrStatistics({targetNumber:'+91 9876543210'});assert.equal(r.incomingCalls,1);assert.equal(r.outgoingCalls,1);assert.equal(r.mostFrequentNumbers[0].number,'9812044819')});
test('nested foreign FIR references fail before any mutation',async()=>{const {svc}=fixture();const access=load('src/services/telecomAccess.ts',{'@/services/telecomService':{TelecomService:engine.TelecomService,telecomService:svc},'@/services/firService':{firService:{getAllFirs:()=>[{id:'fir_1'}]}},'@/lib/firIntegrity':{isFirVisibleToUser:()=>true}});const {service}=await access.telecomAccess({role:'IO'},'fir_1');await assert.rejects(access.validateTelecomReferences(service,{firId:'fir_1',finding:{firId:'foreign'}}),/Access denied to referenced FIR/)});
test('timestamp precision survives normalization with duplicate separate time columns',()=>assert.equal(parsing.evidenceTimestamp('2026-10-15T22:15:00.123+05:30','22:15:00').timestamp,'2026-10-15T16:45:00.123Z'));
