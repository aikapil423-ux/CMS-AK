const {test,after}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
const directory=fs.mkdtempSync(path.join(os.tmpdir(),'cms-fir-repository-'));
const file=path.join(directory,'firs.json');
function loader(){const modules=new Map();function load(fileName){const absolute=path.resolve(fileName);if(modules.has(absolute))return modules.get(absolute);const exports={};modules.set(absolute,exports);vm.runInNewContext(ts.transpileModule(fs.readFileSync(absolute,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,{exports,Date,Intl,Buffer,setTimeout,process:{cwd:()=>directory,env:{CMS_FIR_STORE_PATH:file}},require(n){if(n==='@/lib/mockData')return {MOCK_ENQUIRY_OFFICERS:[]};if(n.startsWith('@/'))return load('src/'+n.slice(2)+'.ts');return require(n);}});return exports;}return load('src/services/firRepository.ts');}
const repository=loader(),sho={id:'sho',name:'SHO',role:'SHO',stationName:'A',district:'D'},eo={id:'io',name:'IO',role:'ENQUIRY_OFFICER',stationName:'A',district:'D'};
const fir=(id='first')=>({id,firNumber:'FIR/0001/2026',firYear:2026,firDate:'2026-10-27',policeStation:'A',district:'D',status:'UNDER_INVESTIGATION',complainantName:'Informant',assignedIoId:'io'});
let versionOne;
test('FIR save is durable across repository instances; retries do not duplicate registration',async()=>{
 [versionOne]=await repository.saveFirRecords([{record:fir(),expectedVersion:0}],sho);assert.equal(versionOne.persistenceVersion,1);assert.equal((await repository.saveFirRecords([{record:fir(),expectedVersion:0}],sho))[0].id,versionOne.id);assert.equal((await loader().readFirRecords()).length,1);
});
test('parallel registrations allocate distinct station/year numbers without overwriting cases',async()=>{
 const results=await Promise.all(['second','third'].map(id=>repository.saveFirRecords([{record:fir(id),expectedVersion:0}],sho)));assert.equal(new Set(results.flat().map(r=>r.firNumber)).size,2);assert.equal((await repository.readFirRecords()).length,3);
});
test('stale writes, jurisdiction changes, unauthorized creators and IO reassignment are rejected',async()=>{
 const [saved]=await repository.saveFirRecords([{record:{...versionOne,incidentDetails:'Updated'},expectedVersion:1}],eo);assert.equal(saved.persistenceVersion,2);
 await assert.rejects(repository.saveFirRecords([{record:{...versionOne,incidentDetails:'Stale'},expectedVersion:1}],eo),/another device/);
 await assert.rejects(repository.saveFirRecords([{record:{...saved,policeStation:'B'},expectedVersion:2}],sho),/identity/);
 await assert.rejects(repository.saveFirRecords([{record:fir('io-create'),expectedVersion:0}],eo),/intake/);
 await assert.rejects(repository.saveFirRecords([{record:{...saved,assignedIoId:'other'},expectedVersion:2}],eo),/Supervisory/);
 await assert.rejects(repository.saveFirRecords([{record:fir('outside'),expectedVersion:0}],{...sho,stationName:'B'}),/jurisdiction/);
});
test('legacy number collisions abort a complete batch and retain all existing cases',async()=>{
 const previous=await repository.readFirRecords();await assert.rejects(repository.saveFirRecords([{record:{...fir('new-number'),firNumber:'FIR/0099/2026'},expectedVersion:0,preserveNumber:true},{record:fir('legacy-collision'),expectedVersion:0,preserveNumber:true}],sho),/Legacy FIR number/);assert.equal((await repository.readFirRecords()).length,previous.length);
});
after(()=>{const target=path.resolve(directory);assert.equal(path.dirname(target),path.resolve(os.tmpdir()));assert.ok(path.basename(target).startsWith('cms-fir-repository-'));fs.rmSync(target,{recursive:true,force:true});});
