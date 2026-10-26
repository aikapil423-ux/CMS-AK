const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');

function loadModule(file, context = {}) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(code, { exports, require: () => ({ MOCK_ENQUIRY_OFFICERS: [
    { id: 'eo_1', name: 'SI Vikram Singh', pno: 'HR-07182930', rank: 'SI' },
    { id: 'eo_2', name: 'ASI Ramesh Chander', pno: 'HR-06281923', rank: 'ASI' },
  ] }), ...context });
  return exports;
}

const { isUserAssignedIo, nextFirNumber, firPendingDays } = loadModule('src/lib/firIntegrity.ts');

test('SI Vikram matches FIR assigned via MOCK_ENQUIRY_OFFICERS id (eo_1)', () => {
  const vikramUser = { id: 'usr_eo_1', name: 'Sub-Inspector Vikram Singh', pno: 'HR-07182930', role: 'ENQUIRY_OFFICER' };
  const fir = { assignedIoId: 'eo_1', assignedIoName: 'SI Vikram Singh' };
  assert.equal(isUserAssignedIo(vikramUser, fir), true);
});

test('SI Vikram matches FIR with normalized name even if id differs (eo-004 vs usr_eo_1)', () => {
  const vikramUser = { id: 'usr_eo_1', name: 'Sub-Inspector Vikram Singh', pno: 'HR-07182930', role: 'ENQUIRY_OFFICER' };
  const fir = { assignedIoId: 'eo-004', assignedIoName: 'ASI Vikram Singh' };
  assert.equal(isUserAssignedIo(vikramUser, fir), true);
});

test('SI Vikram does NOT match FIR assigned to another officer (ASI Ramesh Chander)', () => {
  const vikramUser = { id: 'usr_eo_1', name: 'Sub-Inspector Vikram Singh', pno: 'HR-07182930', role: 'ENQUIRY_OFFICER' };
  const fir = { assignedIoId: 'eo_2', assignedIoName: 'ASI Ramesh Chander' };
  assert.equal(isUserAssignedIo(vikramUser, fir), false);
});

test('Null or empty IO details safely return false', () => {
  const vikramUser = { id: 'usr_eo_1', name: 'Sub-Inspector Vikram Singh', pno: 'HR-07182930' };
  assert.equal(isUserAssignedIo(vikramUser, {}), false);
  assert.equal(isUserAssignedIo(null, { assignedIoName: 'SI Vikram Singh' }), false);
});
