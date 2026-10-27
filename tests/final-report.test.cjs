const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const generator = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/utils/iifvChargesheetGenerator.ts', 'utf8'), {compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022}}).outputText, {exports: generator, Date});
const exports_ = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/finalReport.ts', 'utf8'), {compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022}}).outputText, {exports: exports_, require: () => generator, Date, structuredClone, crypto: require('node:crypto').webcrypto});
const { initialFinalReport, validateFinalReport, finalReportHtml, buildFinalReport } = exports_;
const fir = { id: 'test-fir', firNumber: 'TEST/01', firDate: '2026-10-27', district: 'Test District', policeStation: 'Test PS', complainantName: 'Test Informant', actsAndSections: 'Test Act', incidentDetails: 'Test facts', accusedList: [], propertiesList: [], documents: [] };
function complete() { return {...initialFinalReport(fir), reportNo: 'TEST/FINAL/1', chargeSheetType: 'Complete', judicialCustody: 'No', pendingAccused: '0', pendingDocuments: 'NIL', investigationStatus: 'Completed', courtType: 'Judicial Magistrate 1st Class', judgeName: 'Test Judge', caseType: 'ADULT', prosecutorApproved: 'No', noticeServed: 'No'}; }
test('unknown evidence and outcomes are not fabricated', () => {const d = initialFinalReport(fir); assert.equal(d.labAnalysis, ''); assert.equal(d.prosecutorApproved, ''); assert.equal(d.accused.length, 0); assert.equal(d.witnesses.length, 0);});
test('incomplete forms cannot be finalized; conditional dates are required', () => {assert.ok(validateFinalReport(initialFinalReport(fir)).length); const d = complete(); assert.equal(validateFinalReport(d).length, 0); d.prosecutorApproved = 'Yes'; d.noticeServed = 'Yes'; assert.equal(validateFinalReport(d).length, 2); assert.throws(() => buildFinalReport(fir, d, {id:'test',name:'Tester'}));});
test('preview escapes text and only includes selected witnesses and enclosures', () => {const d = complete(); d.briefFacts = '<script>alert(1)</script>'; d.enclosures = [{selected: true,fileName:'Included.pdf',module:'IIF-I',registrationNo:'1',date:''},{selected:false,fileName:'Omitted.pdf',module:'',registrationNo:'',date:''}]; const html = finalReportHtml(fir,d); assert.ok(html.includes('&lt;script&gt;')); assert.ok(!html.includes('<script>')); assert.ok(html.includes('Included.pdf')); assert.ok(!html.includes('Omitted.pdf'));});
test('saved content equals preview and preserves all form fields for Edit', () => {const d = complete(); const r = buildFinalReport(fir,d,{id:'test',name:'Tester'}); assert.equal(r.contentHtml,finalReportHtml(fir,d)); assert.equal(decodeURIComponent(r.dataUrl.split(',')[1]),r.contentHtml); assert.equal(JSON.stringify(r.finalReportData),JSON.stringify(d)); d.judgeName='Changed'; assert.equal(r.finalReportData.judgeName,'Test Judge'); assert.equal(r.sentToSho,false);});
test('Edit updates same report ID, retains creator and requires fresh SHO forwarding', () => {const d=complete(); const original=buildFinalReport(fir,d,{id:'test',name:'Tester'}); original.sentToSho=true; original.sentToShoAt='old'; const edited=buildFinalReport(fir,{...d,briefFacts:'Revised facts'},{id:'editor',name:'Editor'},original); assert.equal(edited.id,original.id); assert.equal(edited.createdBy,'test'); assert.equal(edited.versionNumber,2); assert.equal(edited.sentToSho,false); assert.equal(edited.sentToShoAt,undefined); assert.ok(edited.contentHtml.includes('Revised facts'));});
test('negative pending accused count and incomplete selected rows are rejected', () => {const d=complete();d.pendingAccused='-1';d.accused=[{name:'Test',action:''}];d.witnesses=[{selected:true,name:'',evidence:''}];assert.equal(validateFinalReport(d).length,3);});
test('the original IIF-V preview markup is preserved exactly', () => {
  const original=fs.readFileSync('src/components/fir/FinalReportModal.tsx','utf8').replaceAll('\r\n','\n');
  const start=original.indexOf('          <div\n            ref={previewRef}',original.indexOf('{/* Printable Statutory Document Canvas */}'));
  const markup=original.slice(start,original.indexOf('          {/* Bottom Action Buttons in Preview */}',start)).trim();
  assert.ok(fs.readFileSync('src/components/fir/StatutoryFinalReportPreview.tsx','utf8').replaceAll('\r\n','\n').includes(markup));
});

