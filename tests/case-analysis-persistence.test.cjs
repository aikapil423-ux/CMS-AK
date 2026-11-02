const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function session({ ai = false, reply } = {}) {
  const disk = new Map(), modules = new Map();
  const user = { id: 'officer-1', role: 'ENQUIRY_OFFICER' };
  const fir = { id: 'f1', firNumber: '001', firDate: '2026-11-01', createdAt: '2026-11-01', incidentDateFrom: '2026-10-31', incidentPlace: 'Karnal', complainantName: 'Ram', complainantMobile: '9999999999', accusedList: [], caseDiaries: [] };
  const missing = () => Object.assign(new Error('Missing'), { code: 'ENOENT' });
  const fakeFs = {
    readFile: async name => { if (!disk.has(name)) throw missing(); return disk.get(name); },
    writeFile: async (name, data) => { disk.set(name, data); }, mkdir: async () => {},
    rename: async (a, b) => { disk.set(b, disk.get(a)); disk.delete(a); }, unlink: async name => { disk.delete(name); }
  };
  function load(file) {
    if (modules.has(file)) return modules.get(file);
    const exports = {}; modules.set(file, exports);
    const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
    vm.runInNewContext(code, { exports, console, Error, AbortSignal, process: { cwd: () => 'test-root', env: ai ? { GEMINI_API_KEY: 'test-key' } : {} },
      fetch: async () => ({ ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: JSON.stringify(reply || { conflicts: [] }) }] } }] }) }),
      require(name) {
        if (name === 'node:fs/promises') return fakeFs;
        if (name === '@/lib/evidenceOwnership') return { evidenceOwner: r => r.ownerId };
        if (name === '@/lib/firIntegrity') return { isFirVisibleToUser: u => u.id === user.id };
        if (name === '@/services/firRepository') return { readFirRecords: async () => [fir] };
        if (name.startsWith('@/') && name.endsWith('.cjs')) return require(path.resolve('src', name.slice(2)));
        if (name.startsWith('@/')) return load('src/' + name.slice(2) + '.ts');
        return require(name);
      }
    });
    return exports;
  }
  return { service: load('src/services/caseAnalysisService.ts'), disk, fir, user,
    setEvidence(records) { disk.set(path.join('test-root', 'prisma', 'processed-evidence-store.json'), JSON.stringify(records)); } };
}

test('backend saves old revisions, reloads them, and highlights an edited FIR value', async () => {
  const { service, fir, user, disk } = session();
  const first = await service.refreshCaseAnalysis(fir, user);
  assert.equal(first.aiStatus, 'UNAVAILABLE');
  assert.ok([...disk.keys()].some(k => k.includes('case-analysis') && k.endsWith('.json')));
  fir.incidentPlace = 'Delhi';
  const next = await service.refreshCaseAnalysis(fir, user);
  const flag = next.conflicts.find(c => c.title === 'Incident place');
  assert.equal(flag.oldValue, 'Karnal'); assert.equal(flag.newValue, 'Delhi');
  assert.equal((await service.readCaseAnalysis(fir.id, user)).sources.length, 2);
  const repeat = await service.refreshCaseAnalysis(fir, user);
  assert.equal(repeat.sources.length, 2, 'same content must not create extra revisions');
});

test('case and evidence access cannot leak another officer or another FIR data', async () => {
  const { service, fir, user, setEvidence } = session();
  const evidence = (id, caseId, ownerId, place) => ({ id, caseId, ownerId, module: 'FIR', processingStatus: 'COMPLETED', rawDocument: { fileName: id }, createdAt: '2026-11-02', structuredData: { persons: [], incident: { place } }, extractedText: place });
  setEvidence([evidence('allowed', 'f1', user.id, 'Delhi'), evidence('private', 'f1', 'other-officer', 'Secret place'), evidence('other-case', 'f2', user.id, 'Private FIR')]);
  const result = await service.refreshCaseAnalysis(fir, user);
  assert.equal(result.sources.length, 2);
  assert.ok(!JSON.stringify(result).includes('Secret place'));
  assert.ok(!JSON.stringify(result).includes('Private FIR'));
  assert.equal(await service.authorizedAnalysisFir('f1', { id: 'other' }), null);
  assert.equal(await service.readCaseAnalysis('f1', { id: 'other' }), null);
  setEvidence([]);
  const removed = await service.refreshCaseAnalysis(fir, user);
  assert.equal(removed.sources.length, 1); assert.equal(removed.conflicts.length, 0);
});

test('unprocessed evidence is reported as incomplete and not treated as analyzed', async () => {
  const { service, fir, user, setEvidence } = session();
  setEvidence([{ id: 'failed', caseId: fir.id, ownerId: user.id, module: 'FIR', processingStatus: 'FAILED' }]);
  const result = await service.refreshCaseAnalysis(fir, user);
  assert.equal(result.pendingEvidence, 1); assert.equal(result.sources.length, 1);
});

test('invalid AI citations persist a visible failure instead of an all-clear', async () => {
  const { service, fir, user, setEvidence } = session({ ai: true, reply: { conflicts: [{ oldSourceId: 'invented', newSourceId: 'invented', oldValue: 'x', newValue: 'y' }] } });
  setEvidence([{ id: 'e1', caseId: fir.id, ownerId: user.id, processingStatus: 'COMPLETED', rawDocument: { fileName: 'Witness' }, structuredData: { persons: [] }, extractedText: 'Witness account', createdAt: '2026-11-02' }]);
  const result = await service.refreshCaseAnalysis(fir, user);
  assert.equal(result.aiStatus, 'FAILED'); assert.match(result.aiMessage, /quotation/);
  assert.equal((await service.readCaseAnalysis(fir.id, user)).aiStatus, 'FAILED');
});
