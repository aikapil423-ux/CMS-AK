const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const vm = require('node:vm');
const ts = require('typescript');
const { DatabaseSync } = require('node:sqlite');
const { PrismaClient } = require('@prisma/client');
const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'cms-final-report-test-'));
const dbPath = path.join(directory, 'test.db');
const db = new DatabaseSync(dbPath);
db.exec(fs.readFileSync('tests/fixtures/final-report-qa-schema.sql','utf8'));
db.close();
const prisma = new PrismaClient({datasources:{db:{url:`file:${dbPath.replaceAll('\\','/')}`}}});
const modules = new Map();
function load(file) {
  if(modules.has(file)) return modules.get(file);
  const exports = {}; modules.set(file,exports);
  const code = ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  vm.runInNewContext(code,{exports,Date,structuredClone,crypto:require('node:crypto').webcrypto,require(name){
    if(name==='@/lib/prisma') return {prisma};
    if(name.startsWith('@/')) return load(`src/${name.slice(2)}.ts`);
    return require(name);
  }});
  return exports;
}
const {finalReportDbService: service}=load('src/services/finalReportDbService.ts');
const {initialFinalReport,finalReportHtml}=load('src/lib/finalReport.ts');
const fir={id:'qa-fir',firNumber:'QA/1',firYear:2026,firDate:'2026-10-27',district:'QA',policeStation:'PS City Panipat',assignedIoId:'usr_eo_1',complainantName:'Test Informant',actsAndSections:'Test Act',accusedList:[{id:'qa-acc-1',name:'Test Accused'}],incidentDetails:'Test facts'};
function input(id='qa-report') {const data={...initialFinalReport(fir),reportNo:id,chargeSheetType:'Complete',judicialCustody:'No',pendingAccused:'0',pendingDocuments:'NIL',investigationStatus:'Completed',courtType:'Test Court',judgeName:'Test Judge',caseType:'ADULT',prosecutorApproved:'No',noticeServed:'No'};data.accused[0].action='ChargeSheeted';return {id,expectedVersion:0,author:{id:'qa-officer',name:'Tester'},fir,data,previewHtml:finalReportHtml(fir,data)};}
test('backend persists classification, accused and exact preview; retry does not duplicate',async()=>{
  const body=input();const saved=await service.save(body);const retry=await service.save(body);
  assert.equal(saved.id,retry.id);assert.equal(await prisma.firFinalReport.count(),1);
  const stored=await prisma.firFinalReport.findUnique({where:{id:body.id},include:{accused:true,events:true}});
  assert.equal(stored.reportCategory,'CHALLAN');assert.equal(stored.chargeSheetType,'Complete');assert.equal(stored.accused[0].accusedId,'qa-acc-1');assert.equal(stored.accused[0].action,'ChargeSheeted');assert.equal(stored.events.length,1);
  const loaded=(await service.list(fir.id))[0];assert.equal(loaded.contentHtml,body.previewHtml);assert.equal(loaded.finalReportData.reportNo,body.data.reportNo);
});
test('CHI requires SHO view and approval; completed goes to Completed Cases, edit resets workflow and preserves history',async()=>{
  await assert.rejects(service.submitChi('qa-report',fir.id,1,'qa-officer','CHI/1'));
  await service.sendToSho('qa-report',fir.id,1,'qa-officer');
  await assert.rejects(service.submitChi('qa-report',fir.id,1,'qa-officer','CHI/1'));
  await assert.rejects(service.review('qa-report',fir.id,1,'usr_sho_1','APPROVE_SHO'));
  await assert.rejects(service.review('qa-report',fir.id,1,'usr_eo_1','VIEW_SHO'));
  assert.equal((await service.notifications('usr_sho_1')).length,1);
  await service.review('qa-report',fir.id,1,'usr_sho_1','VIEW_SHO');
  await service.review('qa-report',fir.id,1,'usr_sho_1','APPROVE_SHO');
  assert.equal((await service.notifications('usr_sho_1')).length,0);
  const done=await service.submitChi('qa-report',fir.id,1,'qa-officer','CHI/1');assert.equal(done.finalReportWorkflow.state,'COMPLETED');
  const edit=input();edit.expectedVersion=1;edit.data.chargeSheetType='Partial';edit.data.investigationStatus='Pending / Further Investigation';edit.previewHtml=finalReportHtml(fir,edit.data);
  const saved=await service.save(edit);assert.equal(saved.versionNumber,2);assert.equal(saved.finalReportWorkflow.state,'SAVED');
  await assert.rejects(service.save(edit));
  await service.sendToSho('qa-report',fir.id,2,'qa-officer');await service.review('qa-report',fir.id,2,'usr_sho_1','VIEW_SHO');await service.review('qa-report',fir.id,2,'usr_sho_1','APPROVE_SHO');const partial=await service.submitChi('qa-report',fir.id,2,'qa-officer','CHI/2');assert.equal(partial.finalReportWorkflow.state,'PARTIAL');
  const events=await service.history(fir.id);assert.equal(events.length,10);assert.equal(JSON.parse(events[0].snapshotJson).data.chargeSheetType,'Complete');
});
test('Final Report reason is stored separately; invalid supplementary option never writes',async()=>{
  const body=input('qa-final');body.data.formType='UNTRACED';body.data.chargeSheetType='';body.data.finalReportReason='Untraced';body.data.finalReportReasonDetails='QA reason';body.previewHtml=finalReportHtml(fir,body.data);await service.save(body);
  const row=await prisma.firFinalReport.findUnique({where:{id:body.id}});assert.equal(row.reportCategory,'FINAL_REPORT');assert.equal(row.finalReportReason,'Untraced');assert.equal(row.chargeSheetType,'');
  const invalid=input('qa-invalid');invalid.data.chargeSheetType='Supplementary';await assert.rejects(service.save(invalid));assert.equal(await prisma.firFinalReport.count({where:{id:invalid.id}}),0);
});
test('SHO rejection returns to assigned IO with reason; fresh revision needs fresh review', async()=>{
  const body=input('qa-reject');await service.save(body);await service.sendToSho(body.id,fir.id,1,'qa-officer');
  await service.review(body.id,fir.id,1,'usr_sho_1','VIEW_SHO');
  await assert.rejects(service.review(body.id,fir.id,1,'usr_sho_1','REJECT_SHO',''));
  const rejected=await service.review(body.id,fir.id,1,'usr_sho_1','REJECT_SHO','Attach missing evidence');
  assert.equal(rejected.finalReportWorkflow.state,'REJECTED');assert.equal(rejected.finalReportWorkflow.assignedIoId,'usr_eo_1');
  assert.equal((await service.notifications('usr_eo_1'))[0].message,'Attach missing evidence');
  assert.equal((await service.notifications('usr_sho_1')).some(n=>n.id===body.id),false);
  await assert.rejects(service.submitChi(body.id,fir.id,1,'qa-officer','CHI/X'));
  body.expectedVersion=1;const revised=await service.save(body);assert.equal(revised.finalReportWorkflow.state,'SAVED');
  assert.equal((await service.notifications('usr_eo_1')).length,0);
  await service.sendToSho(body.id,fir.id,2,'qa-officer');
  await assert.rejects(service.review(body.id,fir.id,1,'usr_sho_1','APPROVE_SHO'));
  await assert.rejects(service.review(body.id,fir.id,2,'usr_sho_1','APPROVE_SHO'));
});
after(async()=>{
  await prisma.$disconnect();
  const resolved=fs.realpathSync(directory), root=fs.realpathSync(os.tmpdir());
  assert.equal(path.dirname(resolved).toLowerCase(),root.toLowerCase());
  assert.ok(path.basename(resolved).startsWith('cms-final-report-test-'));
  fs.rmSync(resolved,{recursive:true,force:true});
});
