const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const { renderToStaticMarkup } = require('react-dom/server');

function render(analysis, mode = 'contradictions') {
  const exports = {};
  let firstState = true;
  const code = ts.transpileModule(fs.readFileSync('src/components/fir/FIRCaseAnalysisPanel.tsx', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX }
  }).outputText;
  vm.runInNewContext(code, { exports, Map, Set, Date, require(name) {
    if (name === '@/components/fir/FIRKnowledgeGraph') return { FIRKnowledgeGraph: () => null };
    if (name === 'react') return { useState(initial) { const value = firstState ? analysis : initial; firstState = false; return [value, () => {}]; }, useEffect() {}, useCallback: fn => fn, useRef: value => ({ current: value }) };
    return require(name);
  } });
  return renderToStaticMarkup(exports.FIRCaseAnalysisPanel({ firId: 'f1', mode }));
}
const analysis = { sources: [{ id: 'old', name: 'FIR original', date: '2026-11-01' }, { id: 'new', name: 'New witness statement', date: '2026-11-02' }], conflicts: [{ id: 'c1', title: 'Incident place mismatch', severity: 'HIGH', explanation: 'Verify both accounts.', oldSourceId: 'old', newSourceId: 'new', oldValue: 'करनाल', newValue: 'दिल्ली', method: 'AI' }], nodes: [], links: [], analyzedAt: '2026-11-02', aiStatus: 'COMPLETED', pendingEvidence: 0 };

test('contradiction panel separates highlighted previous/new claims with both source names', () => {
  const html = render(analysis);
  assert.match(html, /PREVIOUS/); assert.match(html, /NEW/);
  assert.match(html, /<mark[^>]*bg-red-200[^>]*>करनाल<\/mark>/);
  assert.match(html, /<mark[^>]*bg-yellow-200[^>]*>दिल्ली<\/mark>/);
  assert.match(html, /FIR original/); assert.match(html, /New witness statement/);
  assert.match(html, /HIGH/); assert.match(html, /AI • source checked/);
});
test('incomplete comparison never displays a clean no-contradictions result', () => {
  const html = render({ ...analysis, conflicts: [], aiStatus: 'FAILED', aiMessage: 'Retry AI comparison.' });
  assert.match(html, /Full comparison is incomplete/);
  assert.doesNotMatch(html, /No supported contradictions detected/);
});
