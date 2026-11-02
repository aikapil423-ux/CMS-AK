const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const exported = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/caseAnalysisEngine.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
}).outputText, { exports: exported, require });
const { compareCaseFacts, validateAIConflicts, buildCaseGraph, caseComparisonBatches } = exported;
const source = (id, date, facts = {}, text = '') => ({ id, date, name: id, kind: 'EVIDENCE', facts, text });

test('new evidence highlights old/new values in chronological order, independent of input order', () => {
  const flags = compareCaseFacts([source('new', '2026-11-02', { 'Incident time': '22:00' }), source('old', '2026-11-01', { 'Incident time': '20:00' })]);
  assert.equal(flags.length, 1); assert.equal(flags[0].oldValue, '20:00'); assert.equal(flags[0].newValue, '22:00');
  assert.equal(flags[0].severity, 'HIGH'); assert.equal(flags[0].oldSourceId, 'old');
});
test('missing facts and whitespace/case variants are not contradictions', () => {
  assert.equal(compareCaseFacts([source('a', '1', { place: ' Karnal ', phone: '' }), source('b', '2', { place: 'karnal', phone: '12345' })]).length, 0);
});
test('different persons sharing a phone do not generate a contradiction', () => {
  assert.equal(compareCaseFacts([source('a', '1', { 'Person:ram:phone': '1234567890' }), source('b', '2', { 'Person:shyam:phone': '1234567890' })]).length, 0);
});
test('AI flags require two real sources and exact source quotations', () => {
  const sources = [source('a', '1', {}, 'मैं 8 बजे करनाल में था।'), source('b', '2', {}, 'मैं 8 बजे दिल्ली में था।')];
  const flag = { title: 'Location mismatch', severity: 'HIGH', oldSourceId: 'a', newSourceId: 'b', oldValue: sources[0].text, newValue: sources[1].text };
  assert.equal(validateAIConflicts([flag], sources)[0].method, 'AI');
  assert.throws(() => validateAIConflicts([{ ...flag, newValue: 'invented quote' }], sources));
  assert.throws(() => validateAIConflicts([{ ...flag, newSourceId: 'missing' }], sources));
  assert.throws(() => validateAIConflicts([{ ...flag, newSourceId: 'a' }], sources));
  assert.throws(() => validateAIConflicts(null, sources));
});
test('AI quotes are reordered when the model reverses source chronology', () => {
  const flags = validateAIConflicts([{ oldSourceId: 'b', newSourceId: 'a', oldValue: 'new fact', newValue: 'old fact' }], [source('a', '1', {}, 'old fact'), source('b', '2', {}, 'new fact')]);
  assert.equal(flags[0].oldValue, 'old fact'); assert.equal(flags[0].newSourceId, 'b');
});
test('graph retains evidence provenance and deduplicates person/phone relationships', () => {
  const facts = { 'Person:ram:phone': '9999999999', 'Person:ram:role': 'Witness' };
  const graph = buildCaseGraph([source('a', '1', facts), source('b', '2', facts)]);
  assert.equal(graph.nodes.filter(n => n.type === 'Person').length, 1);
  assert.equal(graph.nodes.filter(n => n.type === 'Phone').length, 1);
  const phoneLink = graph.links.find(l => l.label === 'Recorded phone');
  assert.equal(phoneLink.sourceIds.length, 2);
  assert.ok(graph.links.every(l => graph.nodes.some(n => n.id === l.source) && graph.nodes.some(n => n.id === l.target)));
});

test('large-case batching covers every source pair and the end of a long document', () => {
  const inputs = Array.from({ length: 6 }, (_, i) => source(`s${i}`, String(i), {}, 'a'.repeat(70000) + ` END-${i}`));
  const batches = caseComparisonBatches(inputs);
  for (let i = 0; i < inputs.length; i++) {
    assert.ok(batches.some(b => b.some(s => s.id === inputs[i].id && s.text.includes(`END-${i}`))));
    for (let j = i + 1; j < inputs.length; j++) assert.ok(batches.some(b => b.some(s => s.id === inputs[i].id) && b.some(s => s.id === inputs[j].id)));
  }
  assert.ok(batches.every(b => b.reduce((n, s) => n + s.text.length, 0) <= 130000));
});
