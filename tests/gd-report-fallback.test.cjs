const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),ts=require('typescript'),vm=require('node:vm');
const file=ts.createSourceFile('gd.ts',fs.readFileSync('src/services/generalDiaryService.ts','utf8'),ts.ScriptTarget.Latest,true);
let method;function visit(node){if(ts.isMethodDeclaration(node)&&node.name.getText(file)==='getPaginatedEntries')method=node;ts.forEachChild(node,visit);}visit(file);
function service(records,remote){const code=ts.transpile(`const service={${method.getText(file)}};service`,{target:ts.ScriptTarget.ES2022});return vm.runInNewContext(code,{URLSearchParams,Date,gdApiGet:remote||(()=>Promise.reject(Error('offline'))),memoryRecordsStore:[],loadRecordsFromStorage:()=>records});}
const row=(id,date)=>({id,gdNumber:id,isLocked:true,status:'LOCKED',activityDateTime:date+' 10:00',sequencePerDay:1});
test('offline fallback with locked historical record does not crash before date helper initialization',async()=>{const result=await service([row('GD-1','14/10/2026')]).getPaginatedEntries();assert.equal(result.total,1);assert.equal(result.lockedCount,1);});
test('offline fallback correctly filters display-formatted dates',async()=>{const result=await service([row('older','14/10/2026'),row('selected','15/10/2026')]).getPaginatedEntries({startDate:'2026-10-15',endDate:'2026-10-15'});assert.equal(result.records.length,1);assert.equal(result.records[0].id,'selected');});
test('successful server response remains authoritative',async()=>{const expected={records:[],total:0};const result=await service([row('local','14/10/2026')],async()=>({data:expected})).getPaginatedEntries();assert.equal(result,expected);});
