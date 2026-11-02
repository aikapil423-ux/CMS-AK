const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

function harness(isOpen = true) {
  const state = [], calls = [], alerts = [];
  let cursor = 0;
  const hooks = { ...React, useState(initial) {
    const i = cursor++; if (!(i in state)) state[i] = typeof initial === 'function' ? initial() : initial;
    return [state[i], value => { state[i] = typeof value === 'function' ? value(state[i]) : value; }];
  }, useMemo: fn => fn(), useEffect() {}, useRef: value => ({ current: value }) };
  const exports = {};
  const complaints = ['a', 'b', 'c'].map((id, i) => ({ id, complaintNumber: 'CMP-00' + (i + 1), complainantName: 'Test ' + id,
    createdAt: '2026-11-02', incidentPlace: 'Test place', categoryDisplay: 'Test category' }));
  vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/components/complaints/LinkDelinkComplaintsModal.tsx', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true }
  }).outputText, { exports, console, alert: message => alerts.push(message), setTimeout() {}, require(name) {
    if (name === 'react') return hooks;
    if (name === '@/context/AuthContext') return { useAuth: () => ({ currentUser: { name: 'Test officer' } }) };
    if (name === '@/lib/utils') return { formatDate: value => value };
    if (name === '@/services/complaintService') return { ComplaintService: { linkComplaintsFull: async input => { calls.push(input); return { primary: complaints[0] }; } } };
    return require(name);
  } });
  const render = () => { cursor = 0; return exports.LinkDelinkComplaintsModal({ isOpen, complaints, preSelectedComplaintId: 'a', onClose() {}, onSuccess() {} }); };
  return { render, calls, alerts };
}
function elements(node) {
  if (Array.isArray(node)) return node.flatMap(elements);
  if (!node || typeof node !== 'object') return [];
  return [node, ...elements(node.props?.children)];
}
function text(node) {
  if (Array.isArray(node)) return node.map(text).join('');
  if (node == null || typeof node === 'boolean') return '';
  return typeof node === 'object' ? text(node.props?.children) : String(node);
}
function select(h, number) {
  let tree = h.render();
  elements(tree).find(e => e.type === 'input' && e.props.placeholder?.startsWith('Search target complaints')).props.onFocus();
  tree = h.render();
  const row = elements(tree).find(e => e.type === 'div' && e.props.onClick && e.props.className?.includes('p-2.5') && text(e).includes(number));
  assert.ok(row, 'target must appear in the selector'); row.props.onClick();
}
test('closed modal mounted on complaint list renders without a ReferenceError', () => {
  assert.equal(harness(false).render(), null);
});
test('multi-select can add/remove targets and submits only the remaining selected complaints', async () => {
  const h = harness();
  assert.match(renderToStaticMarkup(h.render()), /Link &amp; Delink Complaints/);
  select(h, 'CMP-002'); select(h, 'CMP-003');
  let tree = h.render(); assert.match(text(tree), /2 selected/);
  elements(tree).find(e => e.type === 'button' && e.props.title === 'Remove').props.onClick();
  tree = h.render(); assert.match(text(tree), /1 selected/);
  const submit = elements(tree).find(e => e.type === 'button' && e.props.type === 'submit'); assert.equal(submit.props.disabled, false);
  await elements(tree).find(e => e.type === 'form').props.onSubmit({ preventDefault() {} });
  assert.equal(h.calls.length, 1); assert.equal(h.calls[0].primaryComplaintId, 'a'); assert.equal(h.calls[0].targetComplaintId, 'c'); assert.equal(h.alerts.length, 0);
});
