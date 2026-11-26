const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const vm = require('node:vm');

const cache = {};
function runTsModule(filePath, extra = {}) {
  const absPath = path.resolve(filePath);
  if (cache[absPath]) return cache[absPath];
  const source = fs.readFileSync(absPath, 'utf8');
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  }).outputText;

  const contextExports = {};
  const context = {
    exports: contextExports,
    module: { exports: contextExports },
    console,
    Date,
    Math,
    setTimeout,
    clearTimeout,
    Buffer,
    process,
    path: require('node:path'),
    require: (id) => {
      if (id.startsWith('node:')) return require(id);
      if (id === '@/types' || id === '../types' || id === '@/types/adminMaster' || id === '../types/adminMaster') {
        return {};
      }
      if (id === '@/lib/mockData' || id === '../lib/mockData' || id === '../lib/mockData.ts') {
        return runTsModule(path.resolve(__dirname, '../src/lib/mockData.ts'));
      }
      // Generic alias resolution: '@/x' -> src/x, './x' & '../x' relative to the importing file.
      let resolved = null;
      if (id.startsWith('@/')) {
        resolved = path.resolve(__dirname, '../src', id.slice(2));
      } else if (id.startsWith('./') || id.startsWith('../')) {
        resolved = path.resolve(path.dirname(absPath), id);
      }
      if (resolved) {
        for (const candidate of [`${resolved}.ts`, `${resolved}.tsx`, `${resolved}.json`, resolved]) {
          if (fs.existsSync(candidate)) {
            if (candidate.endsWith('.ts') || candidate.endsWith('.tsx')) {
              return runTsModule(candidate);
            }
            return require(candidate);
          }
        }
      }
      return require(id);
    },
    ...extra,
  };

  vm.createContext(context);
  vm.runInContext(transpiled, context);
  cache[absPath] = context.module.exports;
  return context.module.exports;
}

test('Location Master Service: Loads seed data, hierarchy tree and computes dynamic stats', async () => {
  const locService = runTsModule(path.resolve(__dirname, '../src/services/locationMasterService.ts'));

  const states = await locService.getAllStates();
  assert.ok(states.length >= 1, 'Should have at least Haryana state');
  assert.equal(states[0].code, 'HR');

  const ranges = await locService.getAllRanges();
  assert.ok(ranges.length >= 5, 'Should have Haryana Police ranges and commissionerates');
  assert.ok(ranges.some((r) => r.name.includes('Karnal Range')));

  const districts = await locService.getAllDistricts();
  assert.ok(districts.length >= 4, 'Should have Panipat, Karnal, Kurukshetra, Ambala');
  assert.ok(districts.some((d) => d.name === 'Panipat'));
  assert.ok(districts.some((d) => d.name === 'Karnal'));

  const stations = await locService.getAllPoliceStations();
  assert.ok(stations.length >= 6, 'Should have police stations');
  assert.ok(stations.some((ps) => ps.name === 'PS City Panipat'));

  const units = await locService.getAllSpecializedUnits();
  assert.ok(units.length >= 5, 'Should have specialized units');
  assert.ok(units.some((u) => u.unitType === 'CIA'));
  assert.ok(units.some((u) => u.unitType === 'CYBER_CELL'));
  assert.ok(units.some((u) => u.unitType === 'MHC_STORE'));

  const hierarchy = await locService.getOrganizationHierarchy();
  assert.ok(hierarchy.length >= 1, 'Hierarchy tree should exist');
  assert.equal(hierarchy[0].type, 'STATE');
  assert.ok(hierarchy[0].children && hierarchy[0].children.length > 0);

  const stats = await locService.getLocationStatistics();
  assert.ok(stats.totalDistricts >= 4);
  assert.ok(stats.totalPoliceStations >= 6);
  assert.ok(stats.stationsUnderDistrict['Panipat'] >= 4);
});

test('Account Master Service: Generates accounts with secure scrypt PIN hash and audit logging', async () => {
  const accService = runTsModule(path.resolve(__dirname, '../src/services/accountMasterService.ts'));

  const accounts = await accService.getAllAccounts();
  assert.ok(accounts.length >= 5, 'Should contain existing initial accounts');

  const testPno = 'HR-TEST-' + Math.floor(1000 + Math.random() * 9000);
  const created = await accService.createAccount(
    {
      fullName: 'Inspector Test Officer',
      mobileNumber: '99999' + Math.floor(10000 + Math.random() * 90000),
      pno: testPno,
      designation: 'Station House Officer',
      rank: 'INSPECTOR',
      rankDisplay: 'Inspector',
      role: 'SHO',
      roleDisplay: 'Station House Officer (SHO)',
      assignedUnitType: 'POLICE_STATION',
      assignedUnitId: 'HAR-PNP-PS-01',
      assignedUnitName: 'PS City Panipat',
      state: 'Haryana',
      range: 'Karnal Range',
      district: 'Panipat',
      policeStation: 'PS City Panipat',
      jurisdictionType: 'SINGLE_STATION',
      pin: '987654',
    },
    'DEV-ADMIN',
    'Developer Administrator'
  );

  assert.equal(created.pno, testPno);
  assert.equal(created.status, 'ACTIVE');
  assert.ok(created.passwordHash, 'Should have secure scrypt password hash');
  assert.ok(created.passwordHash.includes(':'));

  // Test retrieval
  const fetched = await accService.getAccountByUsername(testPno);
  assert.ok(fetched);
  assert.equal(fetched.fullName, 'Inspector Test Officer');

  // Test PIN reset
  const resetOk = await accService.resetAccountPassword(created.id, '654321', 'DEV-ADMIN', 'Developer Administrator');
  assert.equal(resetOk, true);

  // Test Status Toggle
  const deactivated = await accService.toggleAccountStatus(created.id, 'INACTIVE', 'DEV-ADMIN', 'Developer Administrator');
  assert.equal(deactivated.status, 'INACTIVE');

  // Test Deletion
  const deleteOk = await accService.deleteAccount(created.id, 'DEV-ADMIN', 'Developer Administrator');
  assert.equal(deleteOk, true);

  // Attempting to delete DEV-ADMIN must fail
  const devAccount = accounts.find((a) => a.pno === 'DEV-ADMIN' || a.id === 'cms_developer_admin');
  if (devAccount) {
    await assert.rejects(
      async () => {
        await accService.deleteAccount(devAccount.id);
      },
      /cannot be deleted/,
      'Root developer administrator account cannot be deleted'
    );
  }

  // Audit Logs
  const logs = await accService.readAccountAuditLogs();
  assert.ok(logs.length > 0, 'Should have recorded audit logs');
  assert.ok(logs.some((l) => l.targetUsername === testPno && l.action === 'DELETE'));
});

test('Location Master Service: Enforces hierarchy integrity during deletion', async () => {
  const locService = runTsModule(path.resolve(__dirname, '../src/services/locationMasterService.ts'));

  const ranges = await locService.getAllRanges();
  const karnalRange = ranges.find((r) => r.name.toLowerCase().includes('karnal'));
  assert.ok(karnalRange);

  // Attempting to delete a range that has districts must throw error
  await assert.rejects(
    async () => {
      await locService.deleteRange(karnalRange.id);
    },
    /Hierarchy is not empty/,
    'Should block deletion of range with subordinate districts'
  );

  // Attempting to delete a district that has police stations must throw error
  const districts = await locService.getAllDistricts();
  const panipatDist = districts.find((d) => d.name.toLowerCase().includes('panipat'));
  assert.ok(panipatDist);

  await assert.rejects(
    async () => {
      await locService.deleteDistrict(panipatDist.id);
    },
    /Hierarchy is not empty/,
    'Should block deletion of district with subordinate stations'
  );

  // Create an isolated empty unit, verify deletion succeeds
  const createdUnit = await locService.createSpecializedUnit({
    name: 'Temporary Test Dog Squad',
    code: 'UNT-TEST-TMP-' + Date.now().toString().slice(-4),
    unitType: 'OTHER',
    stateId: 'st_hr_01',
    stateName: 'Haryana',
    rangeId: 'rng_knl_01',
    rangeName: 'Karnal Range',
    districtId: 'dst_pnp_01',
    districtName: 'Panipat',
    physicalLocation: 'Test Lines',
    unitHead: 'Head Constable Test',
    status: 'ACTIVE',
  });

  assert.ok(createdUnit.id);
  const deleteUnitResult = await locService.deleteSpecializedUnit(createdUnit.id);
  assert.equal(deleteUnitResult, true, 'Should successfully delete empty unit');
});
