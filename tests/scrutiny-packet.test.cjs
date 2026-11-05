const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),fsp=require('node:fs/promises'),os=require('node:os'),path=require('node:path'),vm=require('node:vm');
const ts=require('typescript'),React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
function loader(stubs={},extra={}) {
  const cache={};return function load(file){
    if(cache[file])return cache[file];const exports={};cache[file]=exports;
    vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,
      {exports,process,console,Response,AbortSignal,...extra,require(name){if(name in stubs)return stubs[name];if(name.startsWith('@/'))return load('src/'+name.slice(2)+'.ts');return require(name);}}, {filename:file});return exports;
  };
}
test('all 12 native pages expose every form field once, with no PDF or scan background',()=>{
  const load=loader(),template=load('src/lib/scrutinyPdfTemplate.ts');
  const view=load('src/components/prosecution/ScrutinyNativePages.tsx');
  const html=renderToStaticMarkup(React.createElement(view.ScrutinyNativePages,{values:{'forward.fir':{value:'TEST-001',origin:'FIR'}},page:1,busy:false,update(){},onSource(){}}));
  const fields=[...html.matchAll(/data-scrutiny-field="([^"]+)"/g)].map(m=>m[1]);
  assert.equal(new Set(fields).size,fields.length);
  assert.equal(fields.length,template.SCRUTINY_FIELDS.length);
  for(const f of template.SCRUTINY_FIELDS)assert.ok(fields.includes(f.id),f.id);
  assert.equal((html.match(/data-scrutiny-page=/g)||[]).length,12);
  assert.doesNotMatch(html,/<img|<iframe|<object|<embed/);
  assert.match(html,/#16a34a/);assert.match(html,/TEST-001/);
  for(let n=1;n<=58;n++)for(let c=0;c<3;c++)assert.ok(fields.includes(`review.${n}.${c}`));
  assert.ok(fields.includes('review.custody')); // point 59 is a free text cell in the PDF.
});
test('FIR autofill does not invent approvals or mix accused',()=>{
  const load=loader({'@/lib/evidenceOwnership':{evidenceOwner:e=>e.ownerId}});
  const {firScrutinyFields}=load('src/services/scrutinyAutofill.ts');
  const fields=firScrutinyFields({id:'case-a',firNumber:'FIR-A',policeStation:'Station A',district:'District A',firDate:'2026-11-05',complainantName:'Person C',accusedList:[{name:'Accused A',fatherName:'Father A',phone:'111',age:30},{name:'Accused B',fatherName:'Father B',phone:'222',age:40}]},1);
  assert.equal(fields['accused.name'].value,'Accused B');assert.equal(fields['accused.relative'].value,'Father B');assert.equal(fields['accused.mobile'].value,'222');assert.equal(fields['accused.age'].value,'40');
  assert.equal(fields['identity.accused'].value,'Accused B');
  assert.equal(Object.keys(fields).some(k=>k.startsWith('review.')),false);
  assert.equal(fields['identity.dangerous'],undefined);
});
test('backend survives reopen, isolates owners, and rejects stale revisions',async()=>{
  const dir=await fsp.mkdtemp(path.join(os.tmpdir(),'cms-scrutiny-test-'));
  const fir={id:'f1',firNumber:'F1',district:'D',policeStation:'P',accusedList:[]};
  const user={id:'u1'},other={id:'u2'};
  const load=loader({'@/services/caseAnalysisService':{authorizedAnalysisFir:async id=>id==='f1'?fir:null}},{process:{cwd:()=>dir,env:{}}});
  const repo=load('src/services/scrutinyRepository.ts');
  try {
    const first=await repo.savePdfScrutiny({firId:'f1',fields:{'io.name':{value:'Officer',origin:'MANUAL'}},status:'DRAFT'},user);
    assert.equal(first.decision,'DRAFT');assert.equal(first.checklist.fslForensicReport,false);
    assert.equal((await repo.readPdfScrutiny(first.id,user)).fields['io.name'].value,'Officer');
    assert.equal(await repo.readPdfScrutiny(first.id,other),null);
    assert.equal((await repo.listPdfScrutiny(other)).length,0);
    const updated=await repo.savePdfScrutiny({id:first.id,revision:first.revision,firId:'f1',fields:{'io.name':{value:'Edited',origin:'MANUAL'}},status:'SAVED'},user);
    assert.notEqual(updated.revision,first.revision);
    await assert.rejects(repo.savePdfScrutiny({id:first.id,revision:first.revision,firId:'f1',fields:{},status:'SAVED'},user),/changed/);
    assert.equal((await repo.readPdfScrutiny(first.id,user)).fields['io.name'].value,'Edited');
  } finally { await fsp.rm(dir,{recursive:true,force:true}); }
});
test('autofill uses only matching case/owner processed data and rejects unquoted model values',async()=>{
  const evidence=[{id:'own',caseId:'f1',ownerId:'u1',processingStatus:'COMPLETED',rawDocument:{fileName:'Own document'},extractedText:'Property value is 2500.',structuredData:{}},
    {id:'other-case',caseId:'f2',ownerId:'u1',processingStatus:'COMPLETED',rawDocument:{fileName:'Wrong case'},extractedText:'9999',structuredData:{}},
    {id:'other-owner',caseId:'f1',ownerId:'u2',processingStatus:'COMPLETED',rawDocument:{fileName:'Wrong owner'},extractedText:'8888',structuredData:{}}];
  const load=loader({'node:fs/promises':{readFile:async()=>JSON.stringify(evidence)},'@/lib/evidenceOwnership':{evidenceOwner:e=>e.ownerId}},
    {process:{cwd:()=>os.tmpdir(),env:{GEMINI_API_KEY:'synthetic'}},fetch:async(url,options)=>{
      const prompt=JSON.parse(options.body).contents[0].parts[0].text;
      assert.doesNotMatch(prompt,/Wrong case|Wrong owner/);
      return {ok:true,json:async()=>({candidates:[{content:{parts:[{text:JSON.stringify({fields:[{id:'complaint.propertyValue',value:'2500',sourceId:'own',quote:'Property value is 2500.'},{id:'forward.dueDate',value:'invented',sourceId:'own',quote:'not in source'},{id:'review.1.0',value:'yes',sourceId:'own',quote:'Property value is 2500.'}]})}]}}]})};
    }});
  const r=await load('src/services/scrutinyAutofill.ts').prepareScrutinyFields({id:'f1',firNumber:'F1',policeStation:'P',district:'D',accusedList:[]},{id:'u1',role:'ENQUIRY_OFFICER'});
  assert.equal(r.fields['complaint.propertyValue'].value,'2500');assert.equal(r.fields['complaint.propertyValue'].origin,'PROCESSED');assert.equal(r.fields['forward.dueDate'],undefined);assert.equal(r.fields['review.1.0'],undefined);
});
test('API preserves manual edits on reprocessing and rejects forged field identifiers',async()=>{
  const previous={id:'record',firId:'f1',revision:'r1',fields:{'io.name':{value:'Manual Officer',origin:'MANUAL'}}};
  let written;
  const route=loader({
    '@/lib/apiSecurity':{apiAccess:()=>({id:'u1'})},
    '@/services/caseAnalysisService':{authorizedAnalysisFir:async()=>({id:'f1',accusedList:[]})},
    '@/services/scrutinyAutofill':{prepareScrutinyFields:async()=>({fields:{'io.name':{value:'Suggested Officer',origin:'FIR'}},warnings:[]})},
    '@/services/scrutinyRepository':{readPdfScrutiny:async()=>previous,savePdfScrutiny:async input=>(written=input),listPdfScrutiny:async()=>[],deletePdfScrutiny:async()=>{}},
  })('src/app/api/prosecution/scrutiny/route.ts');
  const response=await route.POST({json:async()=>({action:'prepare',firId:'f1',id:'record',revision:'r1'})});
  assert.equal(response.status,200);assert.equal(written.fields['io.name'].value,'Manual Officer');
  const invalid=await route.POST({json:async()=>({action:'save',firId:'f1',fields:{invented:{value:'x'}}})});assert.equal(invalid.status,400);
  const unauth=loader({'@/lib/apiSecurity':{apiAccess:()=>Response.json({error:'Login required'},{status:401})},'@/services/caseAnalysisService':{},'@/services/scrutinyAutofill':{},'@/services/scrutinyRepository':{listPdfScrutiny(){throw Error('must not read');}}})('src/app/api/prosecution/scrutiny/route.ts');
  assert.equal((await unauth.GET({})).status,401);
});
