const {test}=require('node:test');
const assert=require('node:assert/strict');
const ts=require('typescript');
const fs=require('node:fs');
const vm=require('node:vm');
const exportsObject={};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/services/agent/websiteOperator.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports:exportsObject});
const {planLocally}=exportsObject;
const field=(id,label)=>({id,label,kind:'field',type:'text',disabled:false,section:'',required:true,value:''});
const snapshot={path:'/new',title:'New',controls:[field('name','Name'),field('mobile','Mobile')],errors:[]};
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
