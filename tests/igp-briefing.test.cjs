const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ts=require('typescript');
const vm=require('node:vm');

function makeLoader(stubs={}) {
  const cache=new Map();
  return function load(file) {
    if(cache.has(file))return cache.get(file);
    const exports={};
    cache.set(file,exports);
    const source=ts.transpileModule(fs.readFileSync(file,'utf8'),{
      compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}
    }).outputText;
    vm.runInNewContext(source,{exports,URL,Response,process,console,require(id){
      if(id in stubs)return stubs[id];
      if(id.startsWith('@/'))return load('src/'+id.slice(2)+'.ts');
      if(id.endsWith('.json'))return JSON.parse(fs.readFileSync(path.resolve(path.dirname(file),id),'utf8'));
      return require(id);
    }},{filename:file});
    return exports;
  };
}
const load=makeLoader();
const {igpSlides,igpTables}=load('src/lib/igpTemplate.ts');
const {buildIgpBriefing}=load('src/lib/igpBriefing.ts');

function fir(id, date='2026-10-05') {
  return {id,firNumber:id,firDate:date,createdAt:date,updatedAt:date,category:'MURDER',
    district:'Karnal',policeStation:'PS City Karnal',isHeinous:true,status:'UNDER_INVESTIGATION'};
}

test('PPT template preserves all 27 slides and 28 tables without sample data',()=>{
  assert.equal(igpSlides.length,27);
  assert.equal(igpSlides.flat().filter(shape=>shape.kind==='table').length,28);
  assert.equal(igpTables(10)[0].columns.length,17);
  assert.equal(igpTables(26)[0].columns.length,9);
  for(const shape of igpSlides.flat()){
    if(shape.kind==='table')for(const row of shape.rows)for(const cell of row)if(cell.field)assert.equal(cell.text,'');
  }
  assert.deepEqual(Object.keys(buildIgpBriefing('Karnal','2026-10-10',[],[]).values),[]);
});

test('autofill compares matching periods, excludes future cases and uses linked processed evidence',()=>{
  const evidence=[{caseId:'CURRENT',processingStatus:'COMPLETED',updatedAt:'2026-10-08',structuredData:{incident:{summary:'Verified facts'}}}];
  const data=buildIgpBriefing('Karnal','2026-10-10',[
    fir('PRIOR','2025-10-07'),fir('LATE PRIOR','2025-11-07'),fir('CURRENT'),fir('FUTURE','2026-10-11'),
  ],[],evidence);
  assert.equal(data.values['2:0:3:2'],1);
  assert.equal(data.values['2:0:3:3'],1);
  assert.equal(Object.values(data.values).includes('Verified facts'),true);
  assert.ok(!JSON.stringify(data).includes('FUTURE'));
  assert.equal(data.values['20:0:3:2'],undefined);
});

test('API uses the signed-in district and rejects future cutoff dates',async()=>{
  const makeRoute=district=>makeLoader({
    '@/lib/apiSecurity':{apiAccess:()=>({district,id:'test',role:'SHO'})},
    '@/lib/firIntegrity':{isFirVisibleToUser:()=>true},
    '@/utils/complaintPermissions':{canViewComplaint:()=>({allowed:true})},
    '@/services/firRepository':{readFirRecords:async()=>[fir('LOCAL'),{...fir('OTHER'),district:'Panipat'}]},
    '@/services/complaintRepository':{readComplaints:async()=>[]},
    'node:fs/promises':{readFile:async()=>{throw Object.assign(Error(),{code:'ENOENT'});}},
    '@/lib/evidenceOwnership':{evidenceOwner:()=>''},
  })('src/app/api/reports/igp-briefing/route.ts');
  const route=makeRoute('Karnal');
  assert.equal((await route.GET({url:'http://example.test/?cutoff=2099-10-10'})).status,400);
  const data=await (await route.GET({url:'http://example.test/?cutoff=2026-10-10'})).json();
  assert.equal(data.district,'Karnal');
  assert.equal(data.values['2:0:3:3'],1);
  const noDistrict=await (await makeRoute('').GET({url:'http://example.test/?cutoff=2026-10-10'})).json();
  assert.equal(noDistrict.district,'');
  assert.deepEqual(noDistrict.values,{});
});
