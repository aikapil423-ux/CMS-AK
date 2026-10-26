const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),ts=require('typescript'),vm=require('node:vm');
function load(file){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,Date,Intl,require:()=>({MOCK_ENQUIRY_OFFICERS:[]})});return exports;}
const {nextFirNumber,firPendingDays}=load('src/lib/firIntegrity.ts');
const {comparativeCrimeRows}=load('src/lib/reportIntegrity.ts');
test('FIR numbering skips gaps and does not reuse an existing number',()=>assert.equal(nextFirNumber([{firNumber:'FIR/0001/2026',firYear:2026},{firNumber:'FIR/0003/2026',firYear:2026}],2026),'FIR/0004/2026'));
test('pending days advance using Indian calendar dates',()=>assert.equal(firPendingDays({firDate:'2026-10-14',status:'UNDER_INVESTIGATION'},new Date('2026-10-25T20:00:00Z')),12));
test('closed case age stops at final form date',()=>assert.equal(firPendingDays({firDate:'2026-10-14',status:'CHARGESHEET_FILED',finalFormDate:'2026-10-17'},new Date('2026-10-26')),3));
test('rates reflect actual case outcomes and exclude different years',()=>{
 const sample=(year,status,arrest)=>({firYear:year,category:'PROPERTY_THEFT_BURGLARY',status,accusedList:[{isArrested:arrest}]});
 const row=comparativeCrimeRows([sample(2026,'UNDER_INVESTIGATION',false),sample(2026,'CHARGESHEET_FILED',true),sample(2025,'UNDER_INVESTIGATION',false),sample(2024,'CHARGESHEET_FILED',true)]).find(r=>r.category==='Crime Against Property');
 assert.equal(row.reg2026,2);assert.equal(row.reg2025,1);assert.equal(row.workoutPct2026,50);assert.equal(row.arrestRate2026,50);assert.equal(row.changePct,100);
});
test('empty report does not fabricate outcomes',()=>{for(const row of comparativeCrimeRows([])){assert.equal(row.workoutPct2026,0);assert.equal(row.arrestRate2026,0);}});
