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

const { isUserAssignedIo, isFirVisibleToUser, nextFirNumber, firPendingDays } = loadModule('src/lib/firIntegrity.ts');

test('SHO sees only FIRs from their assigned police station', () => {
  const shoPanipat = { id: 'usr_sho_1', name: 'Inspector Rajesh Kumar', role: 'SHO', stationName: 'PS City Panipat' };
  const cityFir = { firNumber: 'FIR/0001/2026', policeStation: 'PS City Panipat', district: 'Panipat' };
  const chandniBaghFir = { firNumber: 'FIR/0001/2026', policeStation: 'PS Chandni Bagh Panipat', district: 'Panipat' };
  const modelTownFir = { firNumber: 'FIR/0001/2026', policeStation: 'PS Model Town Panipat' };

  assert.equal(isFirVisibleToUser(shoPanipat, cityFir), true);
  assert.equal(isFirVisibleToUser(shoPanipat, chandniBaghFir), false);
  assert.equal(isFirVisibleToUser(shoPanipat, modelTownFir), false);
});

test('Superior district officer (SP) sees FIRs from all police stations', () => {
  const spPanipat = { id: 'usr_sp_1', name: 'Sh. Mayank Mishra, IPS', role: 'SP_DISTRICT', district: 'Panipat', stationName: 'District Police Office Panipat' };
  const cityFir = { firNumber: 'FIR/0001/2026', policeStation: 'PS City Panipat', district: 'Panipat' };
  const chandniBaghFir = { firNumber: 'FIR/0001/2026', policeStation: 'PS Chandni Bagh Panipat', district: 'Panipat' };

  assert.equal(isFirVisibleToUser(spPanipat, cityFir), true);
  assert.equal(isFirVisibleToUser(spPanipat, chandniBaghFir), true);
});

test('SI Vikram matches FIR assigned via MOCK_ENQUIRY_OFFICERS id (eo_1)', () => {
  const vikramUser = { id: 'usr_eo_1', name: 'Sub-Inspector Vikram Singh', pno: 'HR-07182930', role: 'ENQUIRY_OFFICER' };
  const fir = { assignedIoId: 'eo_1', assignedIoName: 'SI Vikram Singh' };
  assert.equal(isUserAssignedIo(vikramUser, fir), true);
});

test('conflicting officer ID cannot be overridden by matching name)', () => {
  const vikramUser = { id: 'usr_eo_1', name: 'Sub-Inspector Vikram Singh', pno: 'HR-07182930', role: 'ENQUIRY_OFFICER' };
  const fir = { assignedIoId: 'eo-004', assignedIoName: 'ASI Vikram Singh' };
  assert.equal(isUserAssignedIo(vikramUser, fir), false);
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

test('nextFirNumber correctly scopes per police station and resets on new year', () => {
  const firs = [
    { firNumber: 'FIR/0001/2026', firYear: 2026, policeStation: 'PS City Panipat' },
    { firNumber: 'FIR/0002/2026', firYear: 2026, policeStation: 'PS City Panipat' },
    { firNumber: 'FIR/0003/2026', firYear: 2026, policeStation: 'PS City Panipat' },
    // Another station has registered up to 0005
    { firNumber: 'FIR/0005/2026', firYear: 2026, policeStation: 'PS Model Town Panipat' },
    // An old year 2025 has higher numbers
    { firNumber: 'FIR/0120/2025', firYear: 2025, policeStation: 'PS City Panipat' },
  ];

  // For PS City Panipat in 2026: last was 0003, next MUST be 0004/2026
  assert.equal(nextFirNumber(firs, 2026, 'PS City Panipat'), 'FIR/0004/2026');

  // For PS Model Town Panipat in 2026: last was 0005, next MUST be 0006/2026
  assert.equal(nextFirNumber(firs, 2026, 'PS Model Town Panipat'), 'FIR/0006/2026');

  // For a fresh station (e.g. PS Samalkha) with 0 records in 2026: next MUST start at 0001/2026
  assert.equal(nextFirNumber(firs, 2026, 'PS Samalkha'), 'FIR/0001/2026');

  // New year (1st Jan 12:00 AM onwards -> 2027): MUST reset to 0001/2027
  assert.equal(nextFirNumber(firs, 2027, 'PS City Panipat'), 'FIR/0001/2027');
});

test('visibility fails closed for missing stations and other districts', () => {
  assert.equal(isFirVisibleToUser({role:'SHO'}, {policeStation:'PS A'}), false);
  assert.equal(isFirVisibleToUser({role:'SHO',stationName:'PS A'}, {}), false);
  assert.equal(isFirVisibleToUser({role:'SP_DISTRICT',district:'Panipat'}, {district:'Karnal'}), false);
  assert.equal(isFirVisibleToUser({role:'SP_DISTRICT'}, {district:'Panipat'}), false);
  assert.equal(isFirVisibleToUser({role:'SUPER_ADMIN'}, {}), true);
});
test('partial names never grant IO access and station boundary applies', () => {
  assert.equal(isUserAssignedIo({name:'Ram'}, {assignedIoName:'SI Ram Kumar'}), false);
  assert.equal(isUserAssignedIo({name:'Ram Kumar'}, {assignedIoName:'SI Ram Kumar'}), true);
  assert.equal(isFirVisibleToUser({id:'io1',stationName:'PS A'}, {assignedIoId:'io1',policeStation:'PS B'}), false);
});
