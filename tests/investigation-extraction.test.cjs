const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const modules = new Map();
function load(file) {
  if (modules.has(file)) return modules.get(file);
  const exports = {}; modules.set(file, exports);
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  vm.runInNewContext(code, { exports, process, console, require(name) {
    if (name.startsWith('@/') && name.endsWith('.cjs')) return require(path.resolve('src', name.slice(2)));
    if (name.startsWith('@/')) return load('src/' + name.slice(2) + '.ts');
    return require(name);
  } });
  return exports;
}
const { investigationPrompts, withInvestigationPrompt, normalizeInvestigation } = load('src/services/investigationPromptService.ts');
const { buildCaseGraph } = load('src/lib/caseAnalysisEngine.ts');
const { resolveInvestigationGraph } = load('src/services/investigationResolutionService.ts');
const audit = investigationPrompts().audit;

test('stored live-repo extraction prompt and resolution rules are included in the Gemini request', () => {
  const stored = investigationPrompts();
  assert.match(stored.extraction, /1\. ENTITY EXTRACTION/); assert.match(stored.extraction, /13\. OUTPUT/);
  const prompt = withInvestigationPrompt('Return CMS JSON fields.', 'actual-document');
  assert.ok(prompt.text.includes(stored.extraction)); assert.ok(prompt.text.includes(stored.resolution));
  assert.match(prompt.text, /actual-document/); assert.match(prompt.text, /NEVER.*separate entities/);
  assert.equal(prompt.audit.sourceCommit, '2972df8'); assert.equal(prompt.audit.extractionHash.length, 64);
});

test('extraction binds citations to actual evidence, excludes unsupported names and date/time entities', () => {
  const quote = 'Ram called phone 9999999999 at 20:00 on 2026-11-02.';
  const source = { documentId: 'model-invented-id', page: 3, verbatimQuote: quote };
  const normalized = normalizeInvestigation({ entities: [
    { id: 'p', type: 'PERSON', primaryName: 'Ram', role: 'Witness', source },
    { id: 'phone', type: 'PHONE', primaryName: '9999999999', source },
    { id: 'date', type: 'DATE', primaryName: '2026-11-02', source },
    { id: 'time', type: 'TIME', primaryName: '20:00', source },
    { id: 'invented', type: 'PERSON', primaryName: 'Shyam', source }
  ], relationships: [{ sourceEntityId: 'p', targetEntityId: 'phone', type: 'CALLED', date: '2026-11-02', time: '20:00', source }],
  events: [{ id: 'event', title: 'Phone call', type: 'CALL', date: '2026-11-02', time: '20:00', participantEntityIds: ['p'], source }] }, 'actual-evidence', quote, audit);
  assert.equal(normalized.entities.length, 2); assert.equal(normalized.relationships.length, 1);
  assert.equal(normalized.entities[0].source.documentId, 'actual-evidence'); assert.equal(normalized.entities[0].source.page, 3);
  assert.equal(normalized.relationships[0].time, '20:00'); assert.equal(normalized.events[0].date, '2026-11-02');
  assert.ok(normalized.validationWarnings.length);
  const graph = buildCaseGraph([{ id: 'doc', name: 'Statement.pdf', kind: 'EVIDENCE', date: '2026-11-02', facts: { 'Incident date': '2026-11-02', 'Incident time': '20:00' }, text: quote, investigation: normalized }]);
  assert.ok(!graph.nodes.some(n => /^(date|time)$/i.test(n.type) || ['2026-11-02', '20:00'].includes(n.label)));
  assert.ok(graph.nodes.some(n => n.type === 'event' && n.properties.time === '20:00'));
  assert.ok(graph.links.some(l => l.label === 'CALLED' && l.citations[0].page === 3));
});

test('identity rules retain every source citation and do not merge distinct people sharing a phone', () => {
  const node = (id, label, sourceId) => ({ id, label, type: 'Person', sourceIds: [sourceId], properties: { phone: '9999999999' }, citations: [{ sourceId, page: 1, quote: label }] });
  const graph = resolveInvestigationGraph({ nodes: [node('a', 'Ram', 'old'), node('b', 'Ram', 'new'), node('c', 'Shyam', 'other')], links: [] });
  assert.equal(graph.nodes.length, 2); const ram = graph.nodes.find(n => n.label === 'Ram');
  assert.equal(ram.sourceIds.length, 2); assert.equal(ram.citations.length, 2);
});
