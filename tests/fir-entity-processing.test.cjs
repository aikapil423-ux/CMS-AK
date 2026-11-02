const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const { NextRequest } = require('next/server');

function session() {
  const user = { id: 'officer', role: 'ENQUIRY_OFFICER' }, audit = { extractionHash: 'new', resolutionHash: 'new' }, calls = [];
  const fir = { id: 'f1', firNumber: '001', documents: [] };
  const record = (id, ownerId, caseId) => ({ id, ownerId, caseId, module: 'FIR', fileId: 'file-' + id, rawDocument: { fileName: id + '.pdf', dataUrl: 'data:application/pdf;base64,UEZERg==' }, processingStatus: 'COMPLETED', structuredData: {} });
  const records = [record('allowed', user.id, 'f1'), record('private', 'another', 'f1'), record('other-case', user.id, 'f2')];
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/app/api/fir/entities/process/route.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true }
  }).outputText, { exports, process: { cwd: () => 'test', env: { GEMINI_API_KEY: 'test-key' } }, console, Headers, Response, FormData, File, URL,
    require(name) {
      if (name === 'node:fs/promises') return { readFile: async () => JSON.stringify(records) };
      if (name === '@/lib/apiSecurity') return { apiAccess: () => user };
      if (name === '@/lib/evidenceOwnership') return { evidenceOwner: r => r.ownerId };
      if (name === '@/services/caseAnalysisService') return { authorizedAnalysisFir: async id => id === fir.id ? fir : null };
      if (name === '@/services/investigationPromptService') return { investigationPrompts: () => ({ audit }) };
      if (name === '@/app/api/evidence/process/route') return { POST: async req => { calls.push(await req.formData()); return Response.json({ success: true, record: { structuredData: { investigation: { entities: [{ id: 'entity' }], promptAudit: audit } } } }); } };
      if (name === '@/app/api/evidence/download/route') return { GET: async () => new Response('unavailable', { status: 404 }) };
      return require(name);
    }
  });
  const request = body => new NextRequest('http://test/api/fir/entities/process', { method: 'POST', headers: { 'Content-Type': 'application/json', origin: 'http://test' }, body: JSON.stringify(body) });
  return { post: body => exports.POST(request(body)), calls, records, audit };
}
test('entity processing plan contains only authorized stale records from this FIR', async () => {
  const { post, records, audit } = session();
  const plan = await (await post({ firId: 'f1' })).json();
  assert.equal(plan.jobs.length, 1); assert.equal(plan.jobs[0].id, 'evidence:allowed');
  records[0].structuredData.investigation = { promptAudit: audit };
  assert.equal((await (await post({ firId: 'f1' })).json()).jobs.length, 0);
  assert.equal((await post({ firId: 'f2' })).status, 404);
});
test('processing uses saved original and canonical case IDs, rejecting another officer source', async () => {
  const { post, calls } = session();
  assert.equal((await post({ firId: 'f1', sourceId: 'evidence:private' })).status, 404);
  const response = await post({ firId: 'f1', sourceId: 'evidence:allowed', caseId: 'tampered' });
  assert.equal(response.status, 200); assert.equal(calls.length, 1);
  assert.equal(calls[0].get('caseId'), 'f1'); assert.equal(calls[0].get('fileId'), 'file-allowed');
  assert.equal(calls[0].get('deferCaseAnalysis'), 'true'); assert.match(calls[0].get('dataUrl'), /^data:application\/pdf/);
});
