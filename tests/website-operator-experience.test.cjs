const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const ts=require('typescript');const vm=require('node:vm');const exportsObject={};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/services/agent/operatorExperience.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports:exportsObject});
const {normaliseFieldValue,privatePlanningSnapshot,redactSensitiveText}=exportsObject;
const field=(id,label,value,type='text')=>({id,label,value,type,kind:'field',disabled:false,section:''});

test('secrets and bank accounts are masked in free text',()=>{
 for(const text of ['OTP 654321','password DemoOnly123!','bank account 1234567890123456','PIN: 3456','पासवर्ड: SecretDemo']) {
  assert.match(redactSensitiveText(text),/REDACTED/);assert.doesNotMatch(redactSensitiveText(text),/654321|DemoOnly123|1234567890123456|3456|SecretDemo/);
 }
});
test('selected case stays local and is excluded from provider snapshots',()=>{
 const result=privatePlanningSnapshot({path:'/fir/demo',title:'FIR',controls:[],errors:[],caseFacts:{firNumber:'FIR/1',complainant:'Private Name',accused:['Other Name']}},'help');
 assert.equal(result.caseFacts,undefined);
});
test('India tomorrow conversion works across month boundary',()=>assert.equal(normaliseFieldValue(field('d','Date','','date'),'कल',new Date('2026-10-31T20:00:00Z')),'2026-11-02'));
test('Hindi digits and evening time are normalized',()=>assert.equal(normaliseFieldValue(field('t','Time','','time'),'शाम ५ बजे'),'17:00'));
test('unrelated populated values and sensitive fields excluded',()=>{const s=privatePlanningSnapshot({path:'/',title:'Test',errors:[],controls:[field('n','Name','Private Person'),field('a','Aadhaar','123456789012'),field('s','Search','Arms')]},'Search Arms');assert.equal(s.controls.length,2);assert.equal(s.controls[0].value,undefined);assert.equal(s.controls[1].value,'Arms');});
test('redaction applies to user text and attachments',()=>assert.equal(redactSensitiveText('1234 5678 9012 ABCDE1234F'),'[REDACTED ID] [REDACTED ID]'));
