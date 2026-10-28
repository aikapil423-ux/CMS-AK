const {test}=require('node:test');
const assert=require('node:assert/strict');
const ts=require('typescript');
const fs=require('node:fs');
const vm=require('node:vm');
const exportsObject={};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/services/agent/websiteOperator.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports:exportsObject,require:()=>({operatorAdapters:()=>[]})});
const {planLocally}=exportsObject;

const firLink=(id,number,year=2026)=>({id,label:`FIR/${String(number).padStart(4,'0')}/${year}`,kind:'link',type:'a',href:`/fir/${id}`,disabled:false,section:''});
test('short FIR references resolve exact record and continue to requested panel',()=>{
 const page={path:'/fir',title:'Register',controls:[firLink('three',3),firLink('thirty',30)],errors:[]};
 for(const query of ['FIR 3 ke document panel ko kholo','FIR number 3 ki profile kholo','एफआईआर ३ के दस्तावेज खोलो','open FIR/0003/2026 documents']) {
  const result=planLocally(query,page,[]);assert.equal(result.actions[0].path,'/fir/three');assert.equal(result.continue,true);assert.equal(result.localOnly,true);
 }
});
test('FIR year ambiguity asks; explicit year resolves; missing record never chooses first',()=>{
 const page={path:'/fir',title:'Register',controls:[firLink('old',3,2025),firLink('new',3,2026)],errors:[]};
 assert.equal(planLocally('FIR 3 profile kholo',page,[]).choices.length,2);
 assert.equal(planLocally('FIR/3/2026 profile kholo',page,[]).actions[0].path,'/fir/new');
 const missing=planLocally('FIR 99 profile kholo',page,[]);assert.equal(missing.actions.length,0);assert.equal(missing.localOnly,true);
});
test('current FIR document request opens only its tab',()=>{
 const page={path:'/fir/three',title:'FIR',errors:[],caseFacts:{firNumber:'FIR/0003/2026',complainant:'Demo',accused:[]},controls:[{id:'docs',label:'Documents (0)',kind:'button',type:'button',disabled:false,section:''}]};
 const result=planLocally('FIR 3 ke document panel ko kholo',page,[]);assert.equal(result.actions[0].id,'docs');assert.equal(result.continue,undefined);
 assert.equal(planLocally('FIR number 3 ki profile kholo',page,[]).actions.length,0);
});

test('current FIR questions answer locally without actions or provider',()=>{
 const page={path:'/fir/demo',title:'FIR',controls:[],errors:[],caseFacts:{firNumber:'FIR/0003/2026',complainant:'Amit Demo',accused:['Vikram Demo']}};
 for(const query of ['Which FIR number is currently open? Answer only. Do not navigate, click, or fill anything.','Is demo FIR ka number, complainant aur accused ka naam batao. Sirf jawab do, koi field, record ya page change mat karna.']) {
  const result=planLocally(query,page,[]);assert.equal(result.actions.length,0);assert.equal(result.question,undefined);assert.match(result.message,/FIR\/0003\/2026/);assert.match(result.message,/Vikram Demo/);
 }
});
test('duplicate actions have distinguishable context labels',()=>{
 const page={path:'/',title:'Test',errors:[],controls:['Reports toolbar','Investigation In Progress'].map((section,index)=>({id:String(index),label:'Final Report',kind:'button',type:'button',disabled:false,section}))};
 const result=planLocally('Final Report',page,[]);assert.equal(result.choices.length,2);assert.notEqual(result.choices[0].label,result.choices[1].label);assert.match(result.choices[0].label,/Reports toolbar/);
});
const field=(id,label)=>({id,label,kind:'field',type:'text',disabled:false,section:'',required:true,value:''});
const snapshot={path:'/new',title:'New',controls:[field('name','Name'),field('mobile','Mobile')],errors:[]};
test('Hindi speech complaint navigation works without model',()=>{const p=planLocally('रजिस्टर कंप्लेंट पेज खोलो',snapshot,[{path:'/complaints/new',title:'Register Complaint'}]);assert.equal(p.actions[0]?.path,'/complaints/new');});
test('fills supplied facts and preserves spelling',()=>{const p=planLocally('name = Ramesh Kumar, mobile = 9812345678',snapshot,[]);assert.equal(p.actions.length,2);assert.equal(p.actions[0].value,'Ramesh Kumar');});
test('ambiguous names ask instead of selecting first',()=>{const p=planLocally('name = Ramesh',{...snapshot,controls:[field('a','Name'),field('b','Name')]},[]);assert.equal(p.actions.length,0);assert.ok(p.question);});
test('new route works without hardcoded command entry',()=>{const p=planLocally('evidence vault kholo',snapshot,[{path:'/evidence-vault',title:'Evidence vault'},{path:'/users',title:'Users'}]);assert.equal(p.actions[0].path,'/evidence-vault');});
test('asks for missing information without fabricating values',()=>{const p=planLocally('क्या जानकारी चाहिए',snapshot,[]);assert.equal(p.actions.length,0);assert.match(p.message,/Mobile/);});
test('unknown request cannot perform actions',()=>{assert.equal(planLocally('xyz123',snapshot,[]).actions.length,0);});
test('disabled fields cannot be filled',()=>{assert.equal(planLocally('mobile = 9812345678',{...snapshot,controls:[{...field('m','Mobile'),disabled:true}]},[]).actions.length,0);});
const button=(id,label)=>({id,label,kind:'button',type:'button',disabled:false,section:''});
for(const command of ['Print button click karo','प्रिंट बटन दबाओ','please click Print']) {
 test(`multilingual button: ${command}`,()=>{const p=planLocally(command,{...snapshot,controls:[button('p','Print'),button('d','Download')]},[]);assert.equal(p.actions[0]?.id,'p');});
}
for(const command of ['enquiry templates kholo','फील्ड इन्क्वायरी टेम्पलेट खोलो','open field enquiry templates']) {
 test(`multilingual templates: ${command}`,()=>{const p=planLocally(command,snapshot,[{path:'/enquiry-workspace/templates',title:'Enquiry templates'},{path:'/fir-workspace/templates',title:'FIR workspace templates'}]);assert.equal(p.actions[0]?.path,'/enquiry-workspace/templates');});
}
test('generic template request asks which workspace',()=>{const p=planLocally('templates kholo',snapshot,[{path:'/enquiry-workspace/templates',title:'Enquiry templates'},{path:'/fir-workspace/templates',title:'FIR templates'}]);assert.equal(p.actions.length,0);assert.match(p.question,/कौन सा page/);});
test('specific destructive command never falls back to generic delete',()=>{const p=planLocally('delete notice', {...snapshot,controls:[button('d','Delete')]},[]);assert.equal(p.actions.length,0);});
test('visible named template opens on current screen',()=>{const p=planLocally('नोटिस टेम्पलेट खोलो',{...snapshot,controls:[button('notice','Notice Template')]},[{path:'/templates',title:'Templates'}]);assert.equal(p.actions[0]?.id,'notice');});
const {splitWorkflow}=exportsObject;
test('workflow preserves explicit order across languages',()=>{assert.equal(splitWorkflow('acts kholo then search Arms').join('|'),'acts kholo|search Arms');assert.equal(splitWorkflow('टेम्पलेट खोलो फिर प्रिंट दबाओ').length,2);});
test('search button command is not treated as query text',()=>{const p=planLocally('Search button click karo',{...snapshot,controls:[field('q','Search query'),button('s','Search')]},[]);assert.equal(p.actions[0].type,'click');assert.equal(p.actions[0].id,'s');});
test('template option commas remain part of the supplied value',()=>{const p=planLocally('Notice Proforma = Witness Order (Section 179 BNSS, 2023)',{...snapshot,controls:[field('template','Notice Proforma')]},[]);assert.equal(p.actions[0].value,'Witness Order (Section 179 BNSS, 2023)');});
test('names containing and are preserved',()=>{const p=planLocally('name = Ram and Shyam',snapshot,[]);assert.equal(p.actions[0].value,'Ram and Shyam');});
