const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), os = require('node:os'), vm = require('node:vm'), ts = require('typescript');
const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'cms-accused-details-'));
const store = path.join(directory, 'firs.json');
let user = { id: 'sho', name: 'Test SHO', role: 'SHO', stationName: 'Test PS', district: 'Test District' };
const modules = new Map();
function load(file) {
  if (modules.has(file)) return modules.get(file);
  const exports = {}; modules.set(file, exports);
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  vm.runInNewContext(code, { exports, Date, Intl, Buffer, URL, Request, Response, structuredClone, setTimeout, crypto: require('node:crypto').webcrypto,
    process: { cwd: () => directory, env: { CMS_FIR_STORE_PATH: store } },
    require(name) {
      if (name === '@/lib/apiSecurity') return { apiAccess: () => user || Response.json({ error: 'Login required.' }, { status: 401 }), forbidden: () => Response.json({ error: 'Access denied.' }, { status: 403 }) };
      if (name === '@/lib/mockData') return { MOCK_ENQUIRY_OFFICERS: [] };
      if (name.startsWith('@/')) return load(`src/${name.slice(2)}.ts`);
      if (name.startsWith('./')) return load(path.join(path.dirname(file), name + '.ts'));
      return require(name);
    },
  });
  return exports;
}
const model = load('src/lib/accusedChargesheet.ts');
const report = load('src/lib/finalReport.ts');
const api = load('src/app/api/fir/accused-chargesheet/route.ts');
const fir = { id: 'test-fir', firNumber: 'FIR/0001/2026', firYear: 2026, firDate: '2026-10-28', policeStation: 'Test PS', district: 'Test District', state: 'Haryana', status: 'UNDER_INVESTIGATION', complainantName: 'Test Informant', incidentDetails: 'Known facts', persistenceVersion: 1,
  accusedList: [{ id: 'acc-1', name: 'Test Accused', fatherName: 'Test Parent', address: 'Known Address', custodyStatus: 'ARRESTED', isArrested: true, arrestDate: '2026-10-27' }, { id: 'acc-2', name: 'Other Person', isArrested: true }],
  documents: [{ id: 'arrest-1', documentType: 'IIF_III', arrestAccusedId: 'acc-1', fileName: 'arrest.html', title: 'Arrest Form', category: 'FIELD_REPORT', uploadedBy: 'Test SHO', uploadedAt: '2026-10-28', arrestFormData: { noticeeName: 'Test Accused', noticeeFather: 'Test Parent', noticeeCity: 'Known City', accusedGender: 'MALE', arrestDate: '27/10/2026', noticeeAge: '34' } }],
  actsAndSections: 'Test section', actsAndSectionsList: [{ id: 'act-1', act: 'Test Act', sections: '1' }],
};
fs.writeFileSync(store, JSON.stringify([fir]));
const row = { accusedId: 'acc-1', name: 'Test Accused', relation: 'Father', relativeName: 'Test Parent', status: 'ARRESTED' };
const details = () => ({ ...model.initialAccusedChargesheet(fir, row), general: { ...model.initialAccusedChargesheet(fir, row).general, verified: 'Yes' } });
const request = (accused, expectedRevision = 0) => new Request('http://localhost/api/fir/accused-chargesheet', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ firId: fir.id, expectedRevision, accused }) });

test('IIF-V includes all FIR accused without requiring IIF-III and never preselects Action', () => {
  const data = report.initialFinalReport(fir);
  assert.equal(data.accused.length, 2); assert.equal(data.accused[0].accusedId, 'acc-1'); assert.equal(data.accused[0].action, '');
  const initial = model.initialAccusedChargesheet(fir, row);
  assert.equal(initial.personal.information.gender, 'Male'); assert.equal(initial.personal.presentAddress.city, 'Known City');
  assert.equal(initial.general.arrestDate, '2026-10-27'); assert.equal(initial.autoFilled['personal.presentAddress.city'], 'arrest-1');
  assert.equal(initial.bailer.information.firstName, '');
});

test('processed evidence fills matching accused only; wrong-case, conflicting and edited fields stay unchanged', () => {
  const draft = model.initialAccusedChargesheet(fir, row);
  const evidence = (id, state, caseId = fir.id) => ({ id, caseId, processingStatus: 'COMPLETED', verificationStatus: 'AI_EXTRACTED', structuredData: { persons: [{ id: 'acc-1', role: 'Accused', name: 'Test Accused', state, district: 'Evidence District' }], accusedList: [] } });
  const next = model.autofillAccusedChargesheet(draft, fir, row, [evidence('one', 'First'), evidence('two', 'Second'), evidence('other', 'Wrong', 'other-case')], new Set(['personal.presentAddress.district']));
  assert.equal(next.personal.presentAddress.state, ''); assert.equal(next.personal.presentAddress.district, '');
  const filled = model.autofillAccusedChargesheet(draft, fir, row, [evidence('one', 'Known State')]);
  assert.equal(filled.personal.presentAddress.state, 'Known State'); assert.equal(filled.autoFilled['personal.presentAddress.state'], 'one');
});

test('Save Details is durable, revision checked, FIR linked and does not advance report workflow', async () => {
  const response = await api.POST(request({ ...row, chargesheetDetails: details() }));
  assert.equal(response.status, 200);
  const saved = JSON.parse(fs.readFileSync(store, 'utf8'))[0];
  assert.equal(saved.accusedChargesheetDrafts['acc-1'].chargesheetDetails.personal.presentAddress.city, 'Known City');
  assert.equal(saved.status, fir.status); assert.equal(saved.reports, undefined); assert.equal(saved.auditTrail.length, 1);
  const loaded = await api.GET(new Request('http://localhost/api/fir/accused-chargesheet?firId=test-fir'));
  assert.equal((await loaded.json()).drafts[0].revision, 1);
  assert.equal((await api.POST(request({ ...row, chargesheetDetails: details() }))).status, 409);
});

test('unlinked accused, missing verification and outside station access cannot save', async () => {
  assert.equal((await api.POST(request({ ...row, accusedId: 'not-linked', chargesheetDetails: details() }))).status, 400);
  const invalid = details(); invalid.general.verified = '';
  assert.equal((await api.POST(request({ ...row, chargesheetDetails: invalid }, 1))).status, 400);
  user = { ...user, stationName: 'Other PS' };
  assert.equal((await api.POST(request({ ...row, chargesheetDetails: details() }, 1))).status, 403);
  user = null;
  assert.equal((await api.GET(new Request('http://localhost/api/fir/accused-chargesheet?firId=test-fir'))).status, 401);
});

test('all direct FIR and IIF-II witnesses and accused merge with processed sources without duplicates', () => {
  const sources = load('src/lib/firReportAccused.ts');
  const expanded = { ...fir, witnessList: [{ name: 'Direct Witness', address: 'Direct Address' }], crimeDetailsData: { witnesses: [{ name: 'Crime Witness', relativeName: 'Parent', statement: 'Recorded statement' }], accusedSuspects: [{ id: 'later', name: 'Later Accused' }] } };
  const records = [{ id: 'processed-witness', caseId: fir.id, processingStatus: 'COMPLETED', verificationStatus: 'AI_EXTRACTED', structuredData: { persons: [{ name: 'Direct Witness', role: 'Witness' }, { name: 'Processed Accused', role: 'Accused' }], witnessList: [{ name: 'Processed Witness', statementBrief: 'Processed statement' }], accusedList: [] } }];
  const witnesses = sources.firReportWitnesses(expanded, records), accused = sources.firReportAccused(expanded, records);
  assert.equal(witnesses.length, 3); assert.ok(witnesses.some(row => row.name === 'Crime Witness')); assert.ok(witnesses.some(row => row.name === 'Processed Witness'));
  assert.equal(accused.length, 4); assert.ok(accused.every(row => row.action === ''));
  assert.equal(report.initialFinalReport(expanded).witnesses.length, 2);
});

test('Final Report can save hidden accused rows with Select actions', () => {
  const data = { ...report.initialFinalReport(fir), reportNo: 'FR/1', formType: 'CLOSURE', finalReportReason: 'Untraced', investigationStatus: 'Completed', courtType: 'Test Court', judgeName: 'Test Judge', caseType: 'Criminal Case', prosecutorApproved: 'No', noticeServed: 'No' };
  assert.equal(report.validateFinalReport(data).length, 0);
  assert.ok(load('src/lib/finalReportSchema.ts').finalReportSchema.safeParse(data).success);
});

test('saved accused details are preserved in report and rendered into the IIF-V preview', () => {
  const data = report.initialFinalReport(fir); data.accused[0] = { ...data.accused[0], action: 'ChargeSheeted', chargesheetDetails: details() };
  const output = report.toStatutoryFinalReport(fir, data).accusedPersonList[0];
  assert.equal(output.dateOfArrest, '2026-10-27'); assert.equal(output.sex, 'Male'); assert.equal(output.whetherVerified, 'Yes');
  assert.ok(output.addresses[0].address.includes('Known City')); assert.equal(output.underActsSections[0].act, 'Test Act');
});

test('IIF-V processed autofill reuses witnesses and property includes processed accused without changing Action', () => {
  const { autofillFinalReport } = load('src/lib/finalReportAutofill.ts');
  const initial = report.initialFinalReport(fir);
  const evidence = { id: 'processed', caseId: fir.id, processingStatus: 'COMPLETED', verificationStatus: 'AI_EXTRACTED', structuredData: {
    persons: [{ name: 'Other Person', role: 'Accused' }], accusedList: [{ name: 'Unregistered Person' }],
    witnessList: [{ name: 'Test Witness', statementBrief: 'Known statement', address: 'Witness Address' }], properties: [{ description: 'Known article', estimatedValue: '1,200', category: 'Property' }],
  } };
  const output = autofillFinalReport(initial, fir, [evidence]);
  assert.equal(output.accused.length, 3); assert.equal(output.accused[0].action, '');
  assert.equal(output.witnesses[0].statement, 'Known statement'); assert.equal(output.witnesses[0].selected, false);
  assert.equal(output.properties[0].value, '1200'); assert.equal(output.autoFilled['properties.0.value'], 'processed');
  const manual = autofillFinalReport(initial, fir, [evidence], new Set(['witnesses', 'properties']));
  assert.equal(manual.witnesses.length, 0); assert.equal(manual.properties.length, 0);
});

after(() => fs.rmSync(directory, { recursive: true, force: true }));
