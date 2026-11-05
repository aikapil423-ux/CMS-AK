const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const exportsForTest = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/utils/complaintPermissions.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
}).outputText, { exports: exportsForTest, require(name) {
  if (name === '@/lib/mockData') return { MOCK_ENQUIRY_OFFICERS: [] };
  return require(name);
} });
const complaint = { assignedEoId: 'eo-1', assignedEoName: 'Assigned officer', policeStation: 'Station A', district: 'District A' };
test('assigned complaints retain document actions for authorized station and supervisory officers', () => {
  for (const role of ['SUPER_ADMIN', 'SHO', 'SP_DISTRICT', 'DSP_SUBDIV', 'DUTY_OFFICER', 'MHC_GD_INCHARGE']) {
    assert.equal(exportsForTest.canCreateDocument({ id: 'officer', role, stationName: 'Station A', district: 'District A' }, complaint).allowed, true, role);
  }
  assert.equal(exportsForTest.canCreateDocument({ id: 'eo-1', role: 'ENQUIRY_OFFICER', stationName: 'Station A' }, complaint).allowed, true);
});
test('document actions still reject unauthenticated, unrelated EO and out-of-scope officers', () => {
  for (const user of [{}, { id: 'other', role: 'ENQUIRY_OFFICER', stationName: 'Station A' },
    { id: 'sho', role: 'SHO', stationName: 'Station B' }, { id: 'sp', role: 'SP_DISTRICT', district: 'District B' }]) {
    assert.equal(exportsForTest.canCreateDocument(user, complaint).allowed, false);
  }
});
