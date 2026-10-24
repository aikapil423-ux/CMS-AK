const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');const ts=require('typescript');const vm=require('node:vm');
function load(file,context={}){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,...context});return exports;}
const operator=load('src/services/agent/websiteOperator.ts');
function fixture(){
 const location={pathname:'/one',search:''};const performed=[];
 const controls=[{id:'search',label:'Search',kind:'field',type:'text',disabled:false,section:'',value:''},{id:'save',label:'Save',kind:'button',type:'button',disabled:false,section:''},{id:'next',label:'Next',kind:'button',type:'button',disabled:false,section:''}];
 class Bridge{snapshot(){return {path:location.pathname,title:'Test',controls,errors:[]}}requiresApproval(){return true}async perform(a){performed.push(a);if(a.type==='fill')controls.find(c=>c.id===a.id).value=a.value;return 'verified '+a.id}}
 const {WebsiteOperatorSession}=load('src/services/agent/websiteOperatorSession.ts',{require:()=>({...operator,LiveWebsiteBridge:Bridge}),fetch:async()=>({ok:true,json:async()=>({modelAvailable:false,routes:[{path:'/two',title:'Second page'}]})}),setTimeout:fn=>fn(),location,AbortSignal});
 return {s:new WebsiteOperatorSession(),location,performed,controls,navigate:p=>location.pathname=p};
}
test('multi-page queue executes only after reaching next page',async()=>{const f=fixture();const r=await f.s.run('second page kholo then search Alpha',f.navigate);assert.equal(f.location.pathname,'/two');assert.equal(f.performed[0].value,'alpha');assert.match(r,/verified/)});
test('confirmation resumes next action without auto-approving it',async()=>{const f=fixture();await f.s.run('Save then Next',f.navigate);assert.equal(f.performed.length,0);const r=await f.s.run('yes',f.navigate);assert.equal(f.performed.length,1);assert.match(r,/Next/);await f.s.run('yes',f.navigate);assert.equal(f.performed.length,2);});
test('changed form invalidates approval and remaining workflow',async()=>{const f=fixture();await f.s.run('Save then Next',f.navigate);f.controls[0].value='changed';await f.s.run('yes',f.navigate);assert.equal(f.performed.length,0);});
test('cancel clears queued actions',async()=>{const f=fixture();await f.s.run('Save then Next',f.navigate);await f.s.run('cancel',f.navigate);await f.s.run('yes',f.navigate);assert.equal(f.performed.length,0);});
