// Optional offline DOM QA. Install jsdom in a temporary directory and set
// CMS_GRAPH_QA_MODULE to that directory's node_modules/jsdom. No network/browser is used.
const { JSDOM } = require(process.env.CMS_GRAPH_QA_MODULE || 'jsdom');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.join(__dirname, '..', 'public', 'investigation-graph');
const dom = new JSDOM(fs.readFileSync(path.join(root, 'index.html'), 'utf8'), {
  runScripts: 'outside-only', pretendToBeVisual: true, url: 'https://graph-test.invalid/'
});
const w = dom.window, errors = [];
let drawCount = 0;
w.addEventListener('error', e => errors.push(e.error?.stack || e.message));
w.ResizeObserver = class { observe() {} disconnect() {} };
w.HTMLCanvasElement.prototype.getContext = () => new Proxy({ createRadialGradient: () => ({ addColorStop() {} }) }, {
  get(o, k) { return o[k] || (() => { drawCount++; }); }, set(o, k, v) { o[k] = v; return true; }
});
w.HTMLCanvasElement.prototype.setPointerCapture = () => {};
w.HTMLElement.prototype.getBoundingClientRect = () => ({ x: 0, y: 0, left: 0, top: 0, width: 900, height: 600, right: 900, bottom: 600 });
Object.defineProperty(w.SVGElement.prototype, 'viewBox', { get() { return { baseVal: { x: 0, y: 0, width: 900, height: 600 } }; } });
Object.defineProperty(w.SVGElement.prototype, 'width', { get() { return { baseVal: { value: 900 } }; } });
Object.defineProperty(w.SVGElement.prototype, 'height', { get() { return { baseVal: { value: 600 } }; } });
w.SVGElement.prototype.getBBox = () => ({ x: 0, y: 0, width: 900, height: 600 });

(async () => {
  try {
    for (const file of ['vendor/d3.v7.min.js', 'vendor/graph.js', 'graph3d.js', 'workspace.js']) w.eval(fs.readFileSync(path.join(root, file), 'utf8'));
    const graph = { id: 'test-fir', documents: [{ id: 'doc', name: 'Witness Statement', tags: ['EVIDENCE'] }],
      entities: [{ id: 'ram', name: 'Ram', type: 'person', source: 'doc', sources: ['doc'], sourceRefs: [{ id: 'doc', page: 3, quote: 'Ram uses phone 9999999999.', date: '2026-11-02', time: '20:00' }], props: { role: 'Witness' } }, { id: 'phone', name: '9999999999', type: 'phone', source: 'doc', sources: ['doc'], props: {} }],
      relationships: [{ id: 'r1', source: 'ram', target: 'phone', type: 'Recorded phone', evidence: 'Phone in statement' }, { id: 'r2', source: 'ram', target: 'doc', type: 'named_in' }],
      sources: [{ id: 'doc', name: 'Witness Statement', kind: 'EVIDENCE', date: '2026-11-02', text: 'Ram uses phone 9999999999.', documentUrl: '/api/evidence/download?id=doc&type=original' }] };
    w.dispatchEvent(new w.MessageEvent('message', { source: w, data: { type: 'CMS_GRAPH_DATA', graph } }));
    assert.equal(w.document.querySelectorAll('.graph-2d-node').length, 3);
    assert.ok([...w.document.querySelectorAll('.graph-2d-node-role')].some(e => e.textContent.includes('Witness')));
    assert.ok(w.document.querySelectorAll('.graph-2d-edge').length >= 2);
    const personNode = [...w.document.querySelectorAll('.graph-2d-node')].find(e => e.__data__.id === 'ram');
    personNode.dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
    assert.match(w.document.getElementById('entityDetailCard').textContent, /20:00/);
    assert.match(w.document.querySelector('#entityDetailCard .original-link').getAttribute('href'), /#page=3$/);
    w.Graph.populatePathSelectors();
    w.document.getElementById('pathSource').value = 'ram'; w.document.getElementById('pathTarget').value = 'phone'; w.document.getElementById('findPath').click();
    assert.match(w.document.getElementById('pathInfo').textContent, /Path/); assert.ok(w.document.querySelector('.graph-path-edge'));
    w.document.querySelector('[data-mode="3d"]').click();
    assert.equal(w.document.getElementById('graph3d').hidden, false); assert.equal(w.document.getElementById('graphPaneFull').hidden, true); assert.ok(drawCount > 0);
    w.document.querySelector('[aria-label="Inspect Ram"]').click(); assert.match(w.document.getElementById('inspector').textContent, /Witness/);
    w.document.getElementById('pathSource').value = 'ram'; w.document.getElementById('pathTarget').value = 'phone'; w.document.getElementById('findPath').click();
    assert.match(w.document.getElementById('pathInfo').textContent, /Path \(2 nodes\)/);
    w.document.querySelector('#inspector .source').click(); assert.match(w.document.getElementById('inspector').textContent, /Ram uses phone/);
    assert.ok(w.document.querySelector('#inspector .original-link'));
    w.document.querySelector('[data-mode="network"]').click(); assert.equal(w.document.querySelectorAll('.graph-node').length, 3);
    w.document.querySelector('[data-mode="2d"]').click(); assert.equal(w.document.querySelectorAll('.graph-2d-node').length, 3);
    w.document.getElementById('reset').click(); assert.equal(w.document.querySelectorAll('.graph-2d-node').length, 3);
    const search = w.document.getElementById('entitySearch'); search.value = 'not-present'; search.dispatchEvent(new w.Event('input'));
    await new Promise(resolve => setTimeout(resolve, 250));
    assert.equal(w.document.getElementById('emptyState').hidden, false); assert.equal(w.document.querySelectorAll('.graph-2d-node').length, 0);
    assert.equal(errors.length, 0, errors.join('\n'));
    console.log('PASS: reference 2D renderer, roles, edges, 2D/3D paths, 3D canvas, inspector, sources, Network, reset, empty filter; no DOM runtime errors.');
  } catch (error) { console.error(error); process.exitCode = 1; }
  finally { w.Graph?.pause(); w.close(); }
})();
