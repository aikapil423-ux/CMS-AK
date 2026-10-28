const fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript'),path=require('node:path');
const {test}=require('node:test'),assert=require('node:assert/strict');
function environment(seed={},mocks={},fail=false){
 const values=new Map(Object.entries(seed));const modules=new Map();let failWrites=fail;
 const localStorage={getItem:k=>values.get(k)??null,setItem:(k,v)=>{if(failWrites)throw Error('quota');values.set(k,v);},removeItem:k=>values.delete(k)};
 const window={localStorage,dispatchEvent(){},addEventListener(){},removeEventListener(){}};
 function load(file){file=path.normalize(file);if(modules.has(file))return modules.get(file);const exports={};modules.set(file,exports);
 const context={exports,fetch:mocks["test:fetch"],window,localStorage,Date,Intl,Math,structuredClone,Response,Request,URL,Buffer,setTimeout,clearTimeout,process,CustomEvent:function(){},console:{warn(){},error(){},log(){}},require(n){if(n in mocks)return mocks[n];if(n.startsWith('@/'))return load('src/'+n.slice(2)+'.ts');if(n.startsWith('.'))return load(path.resolve(path.dirname(file),n)+'.ts');return require(n);}};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,context,{filename:file});return exports;}
 return {load,values,failWrites:()=>{failWrites=true;}};
}
test('report approval and CHI project into the FIR once and preserve later reopening',()=>{
 const apply=environment().load('src/lib/finalReportFirState.ts').applyFinalReportState;
 const fir={id:'f',status:'UNDER_INVESTIGATION',reports:[]};
 const report={id:'r',complaintId:'f',versionNumber:1,createdBy:'io',finalReportData:{formType:'CHARGESHEET',reportNo:'10',chargeSheetType:'Complete',courtType:'Court',judgeName:'Judge',briefFacts:'Recorded facts'},finalReportWorkflow:{state:'UNDER_CHECKING'}};
 const checked=apply(fir,report);assert.equal(checked.trackingState,'PART_B_UNDER_CHECKING');
 report.finalReportWorkflow={state:'COMPLETED',chiNumber:'CHI1',chiSubmittedAt:'2026-10-27T20:00:00Z',chiSubmittedBy:'io'};
 const complete=apply(checked,report);assert.equal(complete.status,'CHARGESHEET_FILED');assert.equal(complete.finalFormDate,'2026-10-28');assert.equal(complete.completionHistory.length,1);assert.equal(complete.challanRecords[0].courtSubmittedAt,report.finalReportWorkflow.chiSubmittedAt);
 assert.equal(apply(complete,report),complete);
 const reopened={...complete,trackingState:'PART_B_REOPEN',status:'UNDER_INVESTIGATION'};assert.equal(apply(reopened,report),reopened);
 report.finalReportWorkflow={...report.finalReportWorkflow,state:'PARTIAL'};
 const partial=apply(checked,report);assert.equal(partial.trackingState,'PART_B_PARTIAL');assert.equal(partial.completionHistory,undefined);assert.equal(partial.challanRecords[0].challanMode,'PARTIAL');
});
test('duplicate register numbers never replace records and ambiguous number updates fail',()=>{
 const s=environment({'cms_registrations_data':'[]'}).load('src/services/registrationService.ts').RegistrationService;
 s.addEntry({id:'a',type:'MISSING_PERSON',regNumber:'1/2026',stationName:'A'});
 assert.throws(()=>s.addEntry({id:'b',type:'MISSING_PERSON',regNumber:'1/2026',stationName:'A'}));
 s.addEntry({id:'c',type:'LOST_PROPERTY',regNumber:'1/2026',stationName:'A'});
 assert.throws(()=>s.updateEntry('1/2026',{status:'CLOSED'}));assert.equal(s.getEntries().length,2);
});
test('different registration types and stations retain equal registration numbers; empty stays empty',()=>{
 const env=environment({'cms_registrations_data':'[]'});const s=env.load('src/services/registrationService.ts').RegistrationService;
 assert.equal(s.getEntries().length,0);s.addEntry({id:'mp',type:'MISSING_PERSON',regNumber:'0002/2019',stationName:'A'});s.addEntry({id:'lp',type:'LOST_PROPERTY',regNumber:'0002/2019',stationName:'A'});s.addEntry({id:'mp-b',type:'MISSING_PERSON',regNumber:'0002/2019',stationName:'B'});assert.equal(s.getEntries().length,3);
 s.setAllEntries([]);assert.equal(s.getEntries().length,0);
});
test('registration save failure keeps previous record and never replaces photographs',()=>{
 const env=environment({'cms_registrations_data':'[]'});const s=env.load('src/services/registrationService.ts').RegistrationService;const photo='data:image/png;base64,'+'a'.repeat(50000);
 s.addEntry({id:'photo',type:'UIDB',regNumber:'1',photoUrl:photo});assert.equal(JSON.parse(env.values.get('cms_registrations_data'))[0].photoUrl,photo);
 env.failWrites();assert.throws(()=>s.updateEntry('photo',{personName:'not saved'}));assert.equal(s.getEntries()[0].personName,undefined);
});
test('missing person creation never supplies identity, old dates, GD, address or findings',()=>{
 const env=environment({'haryana_police_cms_missing_person_records_v1':'[]'});const s=env.load('src/services/missingPersonService.ts').missingPersonService;
 const record=s.saveRecord({id:'new',firstName:'Provided',registrationYear:'2028'});assert.equal(record.firstName,'Provided');for(const key of ['gdNumber','gdDateTime','firNumber','complainantUid','occupation','nameOfEo','remarks','dateSinceMissing'])assert.equal(record[key],'',key);assert.equal(record.idList.length,0);assert.equal(record.presentAddress.houseNo,'');
 env.failWrites();assert.throws(()=>s.saveRecord({id:'new',firstName:'Rejected',registrationNumber:record.registrationNumber}));assert.equal(s.getRecordById('new').firstName,'Provided');
});
test('lost property numbering uses maximum; empty year starts at one',()=>{
 const e=environment({'haryana_police_cms_lost_property_records_v1':JSON.stringify([{registrationNumber:'0001/2026',registrationYear:'2026'},{registrationNumber:'0003/2026',registrationYear:'2026'}])});const s=e.load('src/services/lostPropertyService.ts').lostPropertyService;assert.equal(s.getNextRegistrationNumber('2026'),'0004/2026');assert.equal(s.getNextRegistrationNumber('2028'),'0001/2028');
});
test('TA ownership never falls back to empty or partial names; deletion and edits check owner',()=>{
 const e=environment({'haryana_police_cms_tada_bills_v1':JSON.stringify([{id:'other',userId:'other',userName:'',form1TourProgramme:{employeeName:''}}])});const s=e.load('src/services/tadaService.ts').tadaService;assert.equal(s.getByUser('me','1234','Officer Name').length,0);assert.equal(s.delete('other','me'),false);assert.throws(()=>s.save({id:'other'},'me'));
});
test('TA extraction from no GD creates no invented journeys or financial approval',async()=>{
 const e=environment({}, {'@/services/generalDiaryService':{},'./generalDiaryService':{GeneralDiaryService:{getEntries:async()=>[]}}});const s=e.load('src/services/tadaAutoFillService.ts').tadaAutoFillService;
 const month=e.load('src/services/tadaAutoFillService.ts').getSpecificMonthInfo(2026,8);const user={id:'u',name:'Test',stationName:'A',district:'D'};assert.equal((await s.extractUserGDEntries(user,month)).length,0);const bill=s.buildTADABill(user,month,[]);assert.equal(bill.form2JourneyDetails.totalClaimAmount,0);assert.equal(bill.form3MainPage.certContentsVerified,false);assert.equal(bill.form3MainPage.appropriationAmount,0);
});
test('SITREP uses event dates from older FIRs and ignores unverified recoveries and undated arrests',async()=>{
 const firs=[{id:'old',firNumber:'1',firDate:'2025-01-01',district:'Panipat',policeStation:'PS City Panipat',category:'PROPERTY_THEFT_BURGLARY',actsAndSections:'164',status:'CHARGESHEET_FILED',finalFormDate:'2026-10-26',accusedList:[{name:'A',isArrested:true,arrestDate:'2026-10-26'},{name:'Undated',isArrested:true}],propertiesList:[{propertyType:'Recovered',status:'RECOVERED',recoveredAt:'2026-10-26'},{propertyType:'Stolen',status:'STOLEN',recoveredAt:'2026-10-26'}]},{id:'new',firNumber:'2',firDate:'2026-10-26',district:'Panipat',policeStation:'PS City Panipat',category:'OTHER',actsAndSections:'164',status:'UNDER_INVESTIGATION',accusedList:[{name:'Other day',isArrested:true,arrestDate:'2026-10-25'}]}];
 const e=environment({}, {'./firService':{firService:{getAllFirs:()=>firs}},'./generalDiaryService':{GeneralDiaryService:{getEntries:async()=>[]}},'./complaintService':{ComplaintService:{getComplaints:async()=>[]}}});const s=e.load('src/services/reportsService.ts').ReportsService;const r=await s.getCrimeSitrep('2026-10-27','PS City Panipat','Panipat');assert.equal(r.firEntries.length,1);assert.equal(r.arrests.length,1);assert.match(r.arrests[0].accusedDetails,/^A/);assert.equal(r.recoveries.length,1);assert.equal(r.completeChallans.length,1);assert.equal(r.completeChallans[0].firNo.startsWith('1'),true);assert.equal(r.section1HeadCounts.find(r=>r.head==='Rape').totalNumber,'--');
});
test('comparative report supports new years and IGP assigns actual disjoint pendency ages',async()=>{
 const firs=[{firYear:2027,category:'PROPERTY_THEFT_BURGLARY',status:'UNDER_INVESTIGATION',firDate:'2024-01-01',policeStation:'A',district:'D',accusedList:[]},{firYear:2028,category:'PROPERTY_THEFT_BURGLARY',status:'CHARGESHEET_FILED',firDate:'2028-01-01',policeStation:'A',district:'D',accusedList:[]}];const e=environment({}, {'./firService':{firService:{getAllFirs:()=>firs}},'./generalDiaryService':{GeneralDiaryService:{getEntries:async()=>[]}},'./complaintService':{ComplaintService:{getComplaints:async()=>[]}}});const rows=e.load('src/lib/reportIntegrity.ts').comparativeCrimeRows(firs,2028);assert.equal(rows.find(r=>r.category==='Crime Against Property').reg2026,1);const data=await e.load('src/services/reportsService.ts').ReportsService.getIgpPresentationData('D');assert.equal(data.uiPartAByStation[0].over2Year,1);assert.equal(data.uiPartAByStation[0].under3Month,0);
});
test('complaint drafting never invents a compromise, visit, witness or offence finding',()=>{const e=environment();const s=e.load('src/utils/complaintAnalysisEngine.ts');const r=s.analyzeComplaintForEnquiry({complaintNumber:'1',complainantName:'A',subject:'no compromise, theft',documents:[{fileName:'compromise.pdf'}]});assert.equal(r.classification,'REVIEW_REQUIRED');assert.equal(r.isFirRecommended,false);assert.equal(r.analyzedDocuments.length,0);assert.match(r.proformaFindingsText.standard_4row,/must be entered/);});
test('protected APIs reject unsigned requests before accessing records or invoking AI',async()=>{
 const mocks={'@/lib/serverSession':{sessionUser:()=>null,sameOrigin:()=>true},'@/lib/prisma':{prisma:{}},'next/server':{NextResponse:Response},'@/services/gdSmartSuggestionService':{getSmartVerifiedSuggestions:()=>[]},'@/services/losslessCompressionService':{},'@/lib/suggestionStore':{},'@/services/agent/operatorModel':{}};
 const e=environment({},mocks);
 for(const [file,method] of [['builder/drafts/route.ts','GET'],['builder/templates/[id]/route.ts','DELETE'],['fir/records/route.ts','POST'],['fir/final-reports/route.ts','PATCH'],['fir/bail-details/route.ts','POST'],['general-diary/route.ts','POST'],['evidence/store/route.ts','GET'],['evidence/download/route.ts','GET'],['evidence/compress/route.ts','POST'],['cms-agent/operator/route.ts','POST'],['acts/process/route.ts','POST'],['dev/magic-editor/route.ts','POST']]){
  const handler=e.load('src/app/api/'+file)[method];const result=await handler(new Request('http://localhost/api/'+file,{method}),{params:Promise.resolve({id:'other'})});assert.equal(result.status,401,file);
 }
});
test('API access refuses foreign origins and development tools even for authenticated ordinary officers',()=>{
 const e=environment({}, {'@/lib/serverSession':{sessionUser:()=>({id:'io',role:'ENQUIRY_OFFICER'}),sameOrigin:()=>false}});const access=e.load('src/lib/apiSecurity.ts').apiAccess;assert.equal(access(new Request('http://localhost/api/fir/final-reports',{method:'POST'})).status,403);assert.equal(access(new Request('http://localhost/api/dev/magic-editor')).status,403);
});
test('GD write failure does not report a locally locked or saved entry',async()=>{
 const e=environment({}, {'@/lib/suggestionStore':{suggestionStore:{}},'@/lib/generalDiaryConfig':{INITIAL_GD_TYPES:[]}});
 // This VM has no fetch: backend failure must propagate without fabricating a local receipt.
 const service=e.load('src/services/generalDiaryService.ts').GeneralDiaryService;await assert.rejects(service.addEntry({typeCode:'TEST',subject:'Test',narrative:'Facts'}));await assert.rejects(service.verifyAndLockEntry({subject:'Test'},{name:'Officer'}));
});


test('FIR browser mutations await server receipts, use server numbers, serialize versions and roll back rejected saves',async()=>{
 let state=[],server=[],fail=false,release;
 const gate=new Promise(resolve=>release=resolve);
 const target={getAllFirs:()=>structuredClone(state),getLocalMigrationRecords:()=>[],replaceServerRecords:records=>{state=structuredClone(records);},registerFir(record){state.push({...record});return record;},updateFir(id,updates){const record={...state.find(r=>r.id===id),...updates};state=state.map(r=>r.id===id?record:r);return record;}};
 let first=true;
 const e=environment({}, {'./firService':{firService:target},'test:fetch':async(url,options={})=>{
  if(options.method==='GET')return Response.json({records:server});
  if(first){first=false;await gate;}
  if(fail)return Response.json({error:'Server unavailable'},{status:503});
  const saved=[];
  for(const change of JSON.parse(options.body).changes){const old=server.find(r=>r.id===change.record.id);if((old?.persistenceVersion || 0)!==change.expectedVersion)return Response.json({error:'stale'},{status:409});const next={...change.record,firNumber:'SERVER/1',persistenceVersion:change.expectedVersion+1};server=[...server.filter(r=>r.id!==next.id),next];saved.push(next);}
  return Response.json({records:saved});
 }});
 const module=e.load('src/services/persistentFirService.ts'),service=module.persistentFirService,user={id:'sho',role:'SHO',stationName:'A',district:'D'};
 await module.firPersistence.hydrate(user);
 let settled=false;const pending=service.registerFir({id:'case',firNumber:'LOCAL/1'}).then(value=>{settled=true;return value;});await new Promise(resolve=>setImmediate(resolve));assert.equal(settled,false);release();const saved=await pending;assert.equal(saved.firNumber,'SERVER/1');assert.equal(saved.persistenceVersion,1);
 fail=true;await assert.rejects(service.updateFir('case',{incidentDetails:'Rejected'}),/Server unavailable/);assert.equal(state[0].incidentDetails,undefined);assert.match(module.firPersistence.getError(),/Server unavailable/);
 fail=false;await module.firPersistence.hydrate(user);await Promise.all([service.updateFir('case',{incidentDetails:'First'}),service.updateFir('case',{incidentDetails:'Second'})]);assert.equal(server[0].persistenceVersion,3);assert.equal(server[0].incidentDetails,'Second');
});
test('recorded dates accept display formats but reject impossible days; template examples never become case facts',()=>{
 const e=environment(),utils=e.load('src/lib/dataIntegrity.ts');assert.equal(utils.recordedCalendarDate('२६.१०.२०२६'),'2026-10-26');assert.equal(utils.recordedCalendarDate('30/02/2026'),'');
 const blank=utils.blankTemplateFacts({docTitle:'Arrest memo',noticeeName:'Invented',arrestDate:'18.09.2026',witnesses:[{name:'Invented witness'}],verified:true});assert.equal(blank.docTitle,'Arrest memo');assert.equal(blank.noticeeName,'');assert.equal(blank.arrestDate,'');assert.equal(blank.witnesses.length,0);assert.equal(blank.verified,false);
});
