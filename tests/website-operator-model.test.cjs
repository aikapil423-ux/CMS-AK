const {test}=require('node:test'),assert=require('node:assert/strict');
const ts=require('typescript'),fs=require('node:fs'),vm=require('node:vm');
function fixture(statuses){const exports={};let calls=0;vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/services/agent/operatorModel.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,process:{env:{GEMINI_API_KEY:'test',CMS_AGENT_MODEL:'test-model'}},AbortSignal,fetch:async()=>{const status=statuses[calls++];return {ok:status===200,status,json:async()=>({candidates:[{content:{parts:[{text:'{"message":"ok","actions":[]}'}]}}]})};}});return {run:()=>exports.generateOperatorJson('test',[]),calls:()=>calls};}
test('transient provider failure retries planning once',async()=>{const f=fixture([503,200]);assert.equal((await f.run()).message,'ok');assert.equal(f.calls(),2);});
test('persistent provider failure stops after two attempts',async()=>{const f=fixture([503,503]);await assert.rejects(f.run(),/503/);assert.equal(f.calls(),2);});
test('quota failure is not repeatedly retried',async()=>{const f=fixture([429]);await assert.rejects(f.run(),/429/);assert.equal(f.calls(),1);});

for(const timedOut of [false,true])test(timedOut?'provider timeout has a clear bounded error':'network failure has a clear diagnostic',async()=>{
 const exports={};let timeout;
 vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/services/agent/operatorModel.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,process:{env:{GEMINI_API_KEY:'test',CMS_AGENT_MODEL:'test-model'}},AbortSignal:{timeout:ms=>{timeout=ms;return {aborted:timedOut}}},fetch:async()=>{throw Error('fetch failed')}});
 await assert.rejects(exports.generateOperatorJson('test',[]),timedOut?/AI service timed out/:/AI service connection failed/);assert.equal(timeout,25000);
});
