const {test,after}=require('node:test');
const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'cms-complaints-'));fs.mkdirSync(path.join(temp,'prisma'));fs.writeFileSync(path.join(temp,'prisma','complaints-store.json'),'[]');
const modules=new Map(),storage=new Map(),events=[];let actor='usr_mhc_1',quota=false,failSave=false;let route;
const window={localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>{if(quota)throw new Error('Quota');storage.set(k,v);}},dispatchEvent:e=>events.push(e),addEventListener:()=>{}};
class CustomEvent{constructor(type,options){this.type=type;this.detail=options?.detail;}}
const process_={...process,cwd:()=>temp,env:{...process.env,NODE_ENV:'test',CMS_SESSION_SECRET:'test-secret-'.repeat(4)}};
function load(file){if(modules.has(file))return modules.get(file);const exports={};modules.set(file,exports);const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
vm.runInNewContext(code,{exports,console,Date,Intl,Map,Set,Buffer,URL,Request,Response,structuredClone,crypto:require('node:crypto').webcrypto,globalThis:{},process:process_,setTimeout,queueMicrotask,window,CustomEvent,fetch:async(url,options={})=>{if(failSave&&options.method==='POST')return Response.json({error:'Simulated backend failure'},{status:503});const auth=load('src/lib/serverSession.ts');const req=new Request('http://local'+url,{...options,headers:{...options.headers,cookie:'cms_session='+auth.issueSession(actor)}});return (options.method==='POST'?route.POST:route.GET)(req);},require(n){
 if(n==='next/server')return {NextResponse:Response};
 if(n==='./generalDiaryService')return {GeneralDiaryService:new Proxy({},{get:()=>async()=>({id:'qa-gd'})})};
 if(n==='./evidenceBlobStore')return {evidenceBlobStore:{put:async()=>{},get:async()=>null}};
 if(n==='./complaintAutoFillService')return {complaintAutoFillService:{}};
 if(n==='./universalEvidenceService')return {universalEvidenceService:{registerAndProcess:async()=>({id:'qa-processed'})}};
 if(n.startsWith('@/')){let f='src/'+n.slice(2);return load(fs.existsSync(f+'.ts')?f+'.ts':f+'/index.ts');}
 if(n.startsWith('.'))return load(path.join(path.dirname(file),n+'.ts'));
 return require(n);
 }});return exports;}
route=load('src/app/api/complaints/route.ts');
const {DEMO_USERS}=load('src/lib/mockData.ts'),{issueSession,sessionUser,validLogin}=load('src/lib/serverSession.ts'),permissions=load('src/utils/complaintPermissions.ts');
const {nextComplaintNumber}=load('src/lib/complaintNumber.ts'),integrity=load('src/lib/complaintIntegrity.ts');
const {ComplaintService:s}=load('src/services/complaintService.ts');
const payload={source:'WALK_IN_STATION',category:'OTHER_GENERAL',priority:'ROUTINE',incidentDate:'2026-10-27',incidentPlace:'Test place',complainantName:'Test Citizen',complainantMobile:'9999999999',complainantAddress:'Test address',complainantCity:'Panipat',complainantDistrict:'Panipat',accusedList:[]};
const post=(body,user='usr_sho_1')=>route.POST(new Request('http://local/api/complaints',{method:'POST',headers:{cookie:'cms_session='+issueSession(user),'Content-Type':'application/json'},body:JSON.stringify(body)}));
let saved;
test('unsigned/forged sessions cannot access API; empty register stays empty',async()=>{
 assert.equal((await route.GET(new Request('http://local/api/complaints?viewerRole=SHO'))).status,401);
 assert.equal((await route.POST(new Request('http://local/api/complaints',{method:'POST',body:JSON.stringify({complaints:[]})}))).status,401);
 assert.equal(sessionUser(new Request('http://local',{headers:{cookie:'cms_session=forged.123'}})),null);
 assert.equal(validLogin('not-a-user','123456'),null);assert.equal(validLogin('HR-04291882','wrong'),null);
 const r=await route.GET(new Request('http://local/api/complaints',{headers:{cookie:'cms_session='+issueSession('usr_sho_1')}}));assert.equal((await r.json()).complaints.length,0);
});
test('permission checks use exact officer identity, station, district and document ownership',()=>{
 const c={assignedEoId:'other',assignedEoName:'SI Ram Kumar',policeStation:'PS City Panipat',district:'Panipat'};
 assert.equal(permissions.isUserAssignedEo({id:'different',name:'Ram',role:'ENQUIRY_OFFICER'},c),false);
 assert.equal(permissions.canViewComplaint({id:'other',role:'ENQUIRY_OFFICER',stationName:'Other PS'},c).allowed,false);
 assert.equal(permissions.canViewComplaint({id:'sho',role:'SHO'},c).allowed,false);
 assert.equal(permissions.canViewComplaint({id:'sp',role:'SP_DISTRICT',district:'Karnal'},c).allowed,false);
 assert.equal(permissions.canDeleteDocument({id:'other',pno:'123'},{createdByUserId:'HR-12345'}).allowed,false);
 assert.equal(permissions.isUserAssignedEo({id:'usr_eo_1',pno:'HR-07182930'}, {assignedEoName:'SI Vikram Singh',assignedEoPno:'07182930'}),true);
});
test('numbering resets yearly and uses the actual district',()=>{
 assert.equal(nextComplaintNumber([{complaintNumber:'HAR-PNP-2025-CMP-CTY-0099',policeStation:'PS City Panipat'}],2026,'PS City Panipat','Panipat'),'HAR-PNP-2026-CMP-CTY-0001');
 assert.equal(nextComplaintNumber([],2026,'PS City Gurugram','Gurugram'),'HAR-GGM-2026-CMP-CTY-0001');
 assert.equal(nextComplaintNumber([{complaintNumber:'HAR-PNP-2026-CMP-SAD-0099',policeStation:'PS Sadar',district:'Panipat'}],2026,'PS Sadar','Gurugram'),'HAR-GGM-2026-CMP-SAD-0001');
});
test('closed age freezes even after later edits, direct FIR queue remains pending',()=>{
 const closed=integrity.stabilizeComplaint({createdAt:'2026-10-01',updatedAt:'2026-10-10',status:'COMPLETE'});
 const edited=integrity.stabilizeComplaint({...closed,updatedAt:'2026-10-20'},closed);
 assert.equal(integrity.computeDaysPending(edited),9);
 assert.equal(integrity.computeDaysPending({createdAt:'2026-10-01',status:'FIR_REGISTER'},new Date('2026-10-20T10:00:00Z')),19);
});
test('registration is durable and storage quota cannot trim any complaints',async()=>{
 storage.set('haryana_police_cms_user',actor);quota=true;
 saved=await s.createComplaint(payload,'Test MHC','PS City Panipat','Panipat');
 assert.equal(saved.persistenceVersion,1);assert.ok(saved.complaintNumber.includes('-PNP-'));
 const actual=JSON.parse(fs.readFileSync(path.join(temp,'prisma','complaints-store.json')));assert.equal(actual.length,1);assert.equal(actual[0].id,saved.id);
 assert.ok(events.some(e=>e.type==='complaints_cache_warning'));quota=false;
});
test('MHC can attach the permanent intake docket before EO assignment',async()=>{
 const record=await s.addDocument(saved.id,{fileName:'Registered_Complaint_QA.pdf',fileCategory:'REGISTERED COMPLAINT DOCKET',uploadedBy:'Test MHC',fileSize:'1 KB',dataUrl:'data:application/pdf;base64,JVBERg==',isPermanentRegistrationDoc:true});
 assert.ok(record.id);const row=JSON.parse(fs.readFileSync(path.join(temp,'prisma','complaints-store.json')))[0];assert.equal(row.documents.length,1);
 saved=row;
});
test('backend rejects bulk replacement, stale updates, and another officer assignment',async()=>{
 assert.equal((await post({complaints:[]})).status,400);
 let r=await post({operation:'assignEnquiryOfficer',changes:[{complaint:{...saved,assignedEoId:'usr_eo_1'},expectedVersion:saved.persistenceVersion}]},'usr_mhc_1');assert.equal(r.status,403);
 r=await post({operation:'assignEnquiryOfficer',changes:[{complaint:{...saved,assignedEoId:'usr_eo_1',assignedEoName:'Sub-Inspector Vikram Singh'},expectedVersion:saved.persistenceVersion}]});assert.equal(r.status,200);saved=(await r.json()).complaints[0];
 const stale=await post({operation:'save',changes:[{complaint:saved,expectedVersion:1}]});assert.equal(stale.status,409);
 const hidden=await route.GET(new Request('http://local/api/complaints',{headers:{cookie:'cms_session='+issueSession('usr_eo_2')}}));assert.equal((await hidden.json()).complaints.length,0);
 const escalation=await post({operation:'save',changes:[{complaint:{...saved,shoDecision:'APPROVE'},expectedVersion:saved.persistenceVersion}]},'usr_eo_1');assert.equal(escalation.status,403);
});
test('service reports backend failures and rolls back failed registration',async()=>{
 const before=JSON.parse(fs.readFileSync(path.join(temp,'prisma','complaints-store.json'))).length;failSave=true;
 await assert.rejects(s.createComplaint(payload,'Test MHC','PS City Panipat','Panipat'),/Simulated backend failure/);failSave=false;
 assert.equal(JSON.parse(fs.readFileSync(path.join(temp,'prisma','complaints-store.json'))).length,before);
});
test('simultaneous writes use record versions and cannot clobber a newer save',async()=>{
 const body={operation:'save',changes:[{complaint:{...saved,subject:'Concurrent A'},expectedVersion:saved.persistenceVersion}]};
 const other={operation:'save',changes:[{complaint:{...saved,subject:'Concurrent B'},expectedVersion:saved.persistenceVersion}]};
 const results=await Promise.all([post(body),post(other)]);assert.deepEqual(results.map(r=>r.status).sort(),[200,409]);
 const rows=JSON.parse(fs.readFileSync(path.join(temp,'prisma','complaints-store.json')));assert.equal(rows.length,1);assert.equal(rows[0].persistenceVersion,saved.persistenceVersion+1);
});
test('malformed nested records and another users document deletion are rejected',async()=>{
 const current=JSON.parse(fs.readFileSync(path.join(temp,'prisma','complaints-store.json')))[0];
 let r=await post({operation:'save',changes:[{complaint:{...current,reports:'not-an-array'},expectedVersion:current.persistenceVersion}]});assert.equal(r.status,400);
 r=await post({operation:'save',changes:[{complaint:{...current,documents:[...(current.documents||[]),{id:'qa-doc',fileName:'evidence.pdf',createdByUserId:'usr_eo_2'}]},expectedVersion:current.persistenceVersion}]});assert.equal(r.status,200);
 const updated=(await r.json()).complaints[0];assert.equal(updated.documents.find(d=>d.id==='qa-doc').createdByUserId,'usr_sho_1');r=await post({operation:'deleteDocument',changes:[{complaint:{...updated,documents:[]},expectedVersion:updated.persistenceVersion}]},'usr_eo_1');assert.equal(r.status,403);
});
test('missing assignment actor cannot bypass the service and hidden profiles stay hidden',async()=>{
 storage.set('haryana_police_cms_user','usr_mhc_1');
 await assert.rejects(s.assignEnquiryOfficer(saved.id,'usr_eo_2','Other EO','ASI','TEST','Unverified actor'),/Access Denied/);
 actor='usr_eo_2';storage.set('haryana_police_cms_user',actor);
 assert.equal(await s.getComplaintById(saved.id),undefined);actor='usr_mhc_1';storage.set('haryana_police_cms_user',actor);
});
test('more than 30 records remain available when browser cache is full',async()=>{
 const changes=Array.from({length:35},(_,i)=>({complaint:{...saved,id:'quota-'+i,complaintNumber:`HAR-PNP-2026-CMP-CTY-${String(i+2).padStart(4,'0')}`,createdAt:'2026-10-27T00:00:00Z',updatedAt:'2026-10-27T00:00:00Z',assignedEoId:undefined,assignedEoName:undefined,persistenceVersion:undefined},expectedVersion:0}));
 const result=await post({operation:'createComplaint',changes});assert.equal(result.status,200);
 quota=true;const records=await s.getComplaints({viewerRole:'MHC_GD_INCHARGE',viewerStation:'PS City Panipat'});quota=false;
 assert.equal(records.length,36);assert.equal(JSON.parse(fs.readFileSync(path.join(temp,'prisma','complaints-store.json'))).length,36);
});
test('production rejects demo PIN and accepts only the configured officers credentials',()=>{
 const env=process_.env;const previous={NODE_ENV:env.NODE_ENV,CMS_LOGIN_CREDENTIALS:env.CMS_LOGIN_CREDENTIALS};env.NODE_ENV='production';env.CMS_LOGIN_CREDENTIALS='{}';
 assert.equal(validLogin('HR-04291882','123456'),null);
 const hash=require('node:crypto').scryptSync('test-secret-pin','test-salt',64).toString('hex');env.CMS_LOGIN_CREDENTIALS=JSON.stringify({'HR-04291882':'test-salt:'+hash});
 assert.equal(validLogin('HR-04291882','test-secret-pin').id,'usr_sho_1');assert.equal(validLogin('HR-06281923','test-secret-pin'),null);
 Object.assign(env,previous);
});
after(()=>fs.rmSync(temp,{recursive:true,force:true}));
