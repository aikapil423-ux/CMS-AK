const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const exportsAdapter = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/referenceGraphAdapter.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
}).outputText, { exports: exportsAdapter });
const browser = { window: {} };
vm.runInNewContext(fs.readFileSync('public/investigation-graph/graph3d.js', 'utf8'), browser);
const { project, layout } = browser.window.CMSGraph3D;

test('adapter preserves case entities, person roles and exact source IDs without invented confidence', () => {
  const input = { firId: 'f1', nodes: [{ id: 'doc', type: 'Document', label: 'FIR', sourceIds: ['doc'] }, { id: 'p', type: 'Person', label: 'Ram', sourceIds: ['doc'] }, { id: 'role', type: 'Role', label: 'Witness', sourceIds: ['doc'] }, { id: 'phone', type: 'Phone', label: '9999999999', sourceIds: ['doc'] }],
    links: [{ id: 'a', source: 'doc', target: 'p', label: 'Named in source', sourceIds: ['doc'] }, { id: 'b', source: 'p', target: 'role', label: 'Recorded role', sourceIds: ['doc'] }, { id: 'c', source: 'p', target: 'phone', label: 'Recorded phone', sourceIds: ['doc'] }], sources: [{ id: 'doc', kind: 'FIR', name: 'FIR' }] };
  const data = exportsAdapter.referenceGraphData(input);
  assert.equal(data.entities.length, 2); assert.equal(data.entities.find(n => n.id === 'p').props.role, 'Witness');
  assert.ok(data.entities.every(n => !('confidence' in n)));
  assert.ok(data.relationships.some(l => l.source === 'p' && l.target === 'doc'));
  assert.ok(data.relationships.some(l => l.source === 'p' && l.target === 'phone'));
  assert.ok(data.relationships.every(l => l.target !== 'role'));
});
test('3D layout has depth and deterministic finite positions, preserving input data', () => {
  const nodes = Array.from({ length: 12 }, (_, i) => ({ id: String(i), name: `Node ${i}`, type: 'person' }));
  const links = nodes.slice(1).map(n => ({ source: '0', target: n.id }));
  const points = layout(nodes, links, 120);
  assert.equal(points.length, nodes.length);
  assert.ok(new Set(points.map(p => Math.round(p.z))).size > 2);
  assert.ok(points.every(p => Number.isFinite(p.x) && Number.isFinite(p.y) && Number.isFinite(p.z)));
  assert.equal('x' in nodes[0], false);
  assert.equal(JSON.stringify(points), JSON.stringify(layout(nodes, links, 120)));
});
test('perspective makes nearer nodes larger; orbit changes the projected position', () => {
  const camera = { yaw: 0, pitch: 0, zoom: 1, distance: 900, panX: 0, panY: 0 };
  const near = project({ x: 100, y: 0, z: -200 }, camera, 900, 600);
  const far = project({ x: 100, y: 0, z: 200 }, camera, 900, 600);
  assert.ok(near.scale > far.scale);
  const rotated = project({ x: 100, y: 0, z: 200 }, { ...camera, yaw: Math.PI / 2 }, 900, 600);
  assert.notEqual(rotated.x, far.x); assert.notEqual(rotated.z, far.z);
});
