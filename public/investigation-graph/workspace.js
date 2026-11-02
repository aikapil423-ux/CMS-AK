(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  let full = { id: '', entities: [], documents: [], relationships: [], sources: [] }, view = full, mode = '2d', type = '', signature = '', searchTimer, threeDirty = true;
  const graph3d = new CMSGraph3D.Graph3D($('graph3d'), id => { if (id) inspect(id); else $('inspector').hidden = true; });
  window.App = { toast: message => status(message) };
  window.UI = { openEntityProfile: id => inspect(id) };
  window.Store = { personRoleText: e => e.props?.role || '' };
  window.previewDocument = id => openSource(id);
  function status(message, error = false) { $('status').textContent = message; $('status').classList.toggle('error', error); }
  function node(id) { return [...view.entities, ...view.documents.map(d => ({ ...d, type: 'document' }))].find(n => n.id === id); }
  function all3dNodes() { return [...view.documents.map(d => ({ ...d, type: 'document', props: {} })), ...view.entities]; }
  function sourceIds(record) { return view.documents.some(d => d.id === record?.id) ? [record.id] : record?.sources || [record?.source].filter(Boolean); }
  function originalLink(panel, source, page) {
    if (!source?.documentUrl || !/^\/(api\/evidence\/download\?|fir\/)/.test(source.documentUrl)) return;
    const link = document.createElement('a'); link.className = 'source original-link'; link.textContent = '↗ Open original document';
    const pageNumber = Number.parseInt(String(page || ''), 10);
    link.href = source.documentUrl + (pageNumber > 0 ? '#page=' + pageNumber : ''); link.target = '_blank'; link.rel = 'noopener noreferrer'; panel.append(link);
  }
  function openSource(id) {
    const source = full.sources.find(s => s.id === id) || full.sources.find(s => s.id === full.entities.find(e => e.id === id)?.source); if (!source) { status('No source text was recorded for this node.', true); return; }
    const panel = $('inspector'); panel.replaceChildren(); panel.hidden = false;
    const close = document.createElement('button'); close.className = 'close'; close.textContent = '×'; close.setAttribute('aria-label', 'Close source'); close.onclick = () => { panel.hidden = true; }; panel.append(close);
    const title = document.createElement('h3'); title.textContent = source.name; panel.append(title);
    const info = document.createElement('p'); info.textContent = `${source.kind} • ${source.date}`; panel.append(info);
    originalLink(panel, source);
    const text = document.createElement('pre'); text.style.cssText = 'white-space:pre-wrap;overflow-wrap:anywhere;font:12px/1.65 inherit;'; text.textContent = source.text; panel.append(text);
    parent.postMessage({ type: 'CMS_GRAPH_SOURCE', id: source.id }, '*');
  }
  function inspect(id) {
    const record = node(id); if (!record) return;
    if (mode === '3d') graph3d.focus(id); else { Graph.inspectNode(id); Graph.highlightNode(id); }
    const panel = $('inspector'); panel.replaceChildren(); panel.hidden = false;
    const close = document.createElement('button'); close.className = 'close'; close.textContent = '×'; close.setAttribute('aria-label', 'Close details'); close.onclick = () => { panel.hidden = true; if (mode === '3d') { graph3d.selected = null; graph3d.draw(); } else Graph.clearHighlight(); }; panel.append(close);
    const heading = document.createElement('h3'); heading.textContent = record.name; panel.append(heading);
    const meta = document.createElement('p'); meta.textContent = `${record.type || 'document'}${record.props?.role ? ' • ' + record.props.role : ''}`; panel.append(meta);
    for (const [key, value] of Object.entries(record.props || {})) {
      if (value == null || value === '' || ['role', 'sourceCount', 'quote', 'page'].includes(key)) continue;
      const row = document.createElement('p'); row.textContent = `${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`; panel.append(row);
    }
    for (const rel of view.relationships.filter(r => r.source === id || r.target === id)) {
      const other = node(rel.source === id ? rel.target : rel.source); if (!other) continue;
      const button = document.createElement('button'); button.className = 'relationship'; button.textContent = `${rel.source === id ? '→' : '←'} ${rel.type.replace(/_/g, ' ')}: ${other.name}`; button.onclick = () => inspect(other.id); panel.append(button);
      if (rel.date || rel.time) { const when = document.createElement('p'); when.textContent = `Date: ${rel.date || 'not stated'} • Time: ${rel.time || 'not stated'}`; panel.append(when); }
    }
    const label = document.createElement('p'); label.textContent = 'Evidence sources'; panel.append(label);
    for (const sid of sourceIds(record)) {
      const source = full.sources.find(s => s.id === sid); if (!source) continue;
      const button = document.createElement('button'); button.className = 'source'; button.textContent = '📄 ' + source.name; button.onclick = () => openSource(sid); panel.append(button);
      const refs = record.sourceRefs?.filter(r => r.id === sid) || [];
      for (const ref of refs) {
      if (ref?.page || ref?.quote || ref?.date || ref?.time || ref?.incidentDate || ref?.incidentTime) {
        const context = document.createElement('p'); context.textContent = [ref.page ? `Page ${ref.page}` : '', ref.date ? `Date: ${ref.date}` : '', ref.time ? `Time: ${ref.time}` : '', !ref.date && ref.incidentDate ? `Source incident date: ${ref.incidentDate}` : '', !ref.time && ref.incidentTime ? `Source incident time: ${ref.incidentTime}` : '', ref.quote ? `“${ref.quote}”` : ''].filter(Boolean).join(' • '); panel.append(context);
      }
      originalLink(panel, source, ref?.page);
      }
      if (!refs.length) originalLink(panel, source);
    }
  }
  function renderList() {
    const host = $('entityList'); host.replaceChildren(); $('entityCount').textContent = view.entities.length;
    view.entities.forEach(entity => {
      const button = document.createElement('button'); button.className = 'entity-item'; button.setAttribute('aria-label', `Inspect ${entity.name}`);
      const dot = document.createElement('i'); dot.className = 'entity-dot'; dot.style.background = CMSGraph3D.color(entity); button.append(dot);
      const text = document.createElement('span'), title = document.createElement('strong'), meta = document.createElement('small');
      title.textContent = entity.name; meta.textContent = entity.props?.role || entity.type; text.append(title, meta); button.append(text);
      button.onclick = () => { if (mode === '3d') inspect(entity.id); else { $('inspector').hidden = true; Graph.focusNode(entity.id); Graph.inspectNode(entity.id); } }; host.append(button);
    });
    $('typeFilters').replaceChildren();
    for (const key of ['', ...new Set(full.entities.map(e => e.type))]) {
      const button = document.createElement('button'); button.textContent = key || 'All'; button.classList.toggle('active', type === key); button.onclick = () => { type = type === key ? '' : key; updateView(); }; $('typeFilters').append(button);
    }
  }
  function updateView() {
    const query = $('entitySearch').value.trim().toLocaleLowerCase();
    const entities = full.entities.filter(e => (!type || e.type === type) && `${e.name} ${e.type} ${e.props?.role || ''}`.toLocaleLowerCase().includes(query));
    const entityIds = new Set(entities.map(e => e.id));
    const documents = full.documents.filter(d => (!type && d.name.toLocaleLowerCase().includes(query)) || full.relationships.some(r => (r.target === d.id && entityIds.has(r.source)) || (r.source === d.id && entityIds.has(r.target))));
    const ids = new Set([...entityIds, ...documents.map(d => d.id)]);
    view = { ...full, entities, documents, relationships: full.relationships.filter(r => ids.has(r.source) && ids.has(r.target)) };
    $('graphCounts').textContent = `${entities.length} entities • ${documents.length} sources • ${view.relationships.length} connections`;
    $('inspector').hidden = true; threeDirty = true; renderList(); Graph.pause(); Graph.build(view); Graph.clearPath(); render(true);
  }
  function render(rebuild3d = false) {
    $('graphPaneFull').hidden = mode === '3d'; $('graph3d').hidden = mode !== '3d'; graph3d.active = mode === '3d';
    $('emptyState').hidden = !!(view.entities.length + view.documents.length);
    document.querySelectorAll('[data-mode]').forEach(b => { const active = b.dataset.mode === mode; b.classList.toggle('active', active); b.setAttribute('aria-pressed', String(active)); });
    $('modeHint').textContent = mode === '3d' ? 'Drag background: rotate • Shift-drag: pan • Drag a node: move • Scroll: zoom' : 'Pan / zoom • Select nodes • Click legend entries to filter';
    $('export').textContent = mode === '3d' ? 'Export PNG' : 'Export SVG';
    if (mode === '3d') {
      Graph.pause();
      if (rebuild3d || threeDirty || !graph3d.nodes.length) { graph3d.setData(all3dNodes(), view.relationships, Number($('distance').value)); threeDirty = false; }
      else graph3d.draw();
    } else { Graph.setMode(mode); Graph.setNodeSize($('nodeSize').value); Graph.setLabelFade($('textSize').value); }
    Graph.populatePathSelectors();
  }
  function setMode(next) { mode = next; $('inspector').hidden = true; render(); status(mode === '3d' ? '3D perspective view. The graph uses exactly the same saved entities and connections as 2D.' : 'Live repository renderer • processed FIR sources only'); }
  document.querySelectorAll('[data-mode]').forEach(button => button.onclick = () => setMode(button.dataset.mode));
  $('entitySearch').oninput = () => { clearTimeout(searchTimer); searchTimer = setTimeout(updateView, 120); };
  $('sidebarToggle').onclick = () => { $('entitySide').hidden = !$('entitySide').hidden; requestAnimationFrame(() => render()); };
  $('distance').oninput = e => { $('distanceValue').textContent = e.target.value; threeDirty = true; if (mode === '3d') { graph3d.setData(all3dNodes(), view.relationships, Number(e.target.value)); threeDirty = false; } else Graph.setLinkDist(e.target.value); };
  $('nodeSize').oninput = e => { $('nodeSizeValue').textContent = e.target.value; graph3d.size = Number(e.target.value) / 100; if (mode === '3d') graph3d.draw(); else Graph.setNodeSize(e.target.value); };
  $('textSize').oninput = e => { $('textSizeValue').textContent = e.target.value; graph3d.text = Number(e.target.value) / 100; if (mode === '3d') graph3d.draw(); else Graph.setLabelFade(e.target.value); };
  $('zoomIn').onclick = () => mode === '3d' ? graph3d.zoomBy(1.3) : Graph.zoomBy(1.3);
  $('zoomOut').onclick = () => mode === '3d' ? graph3d.zoomBy(.77) : Graph.zoomBy(.77);
  $('fit').onclick = () => mode === '3d' ? graph3d.fit() : Graph.fit();
  $('relayout').onclick = () => { if (mode === '3d') graph3d.setData(all3dNodes(), view.relationships, Number($('distance').value)); else Graph.relayout(); };
  $('reset').onclick = () => { type = ''; $('entitySearch').value = ''; $('distance').value = '120'; $('distanceValue').textContent = '120'; $('nodeSize').value = '100'; $('nodeSizeValue').textContent = '100'; $('textSize').value = '100'; $('textSizeValue').textContent = '100'; graph3d.resetCamera(); graph3d.size = 1; graph3d.text = 1; Graph.setLinkDist(120); Graph.clearPath(); updateView(); };
  $('findPath').onclick = () => {
    if (mode !== '3d') { Graph.findPath(); return; }
    const from = $('pathSource').value, to = $('pathTarget').value, info = $('pathInfo');
    info.style.display = 'block';
    if (!from || !to || from === to) { graph3d.setPath([]); info.textContent = 'Select two different entities.'; return; }
    const adjacency = new Map(all3dNodes().map(n => [n.id, []]));
    view.relationships.forEach(r => { adjacency.get(r.source)?.push(r.target); adjacency.get(r.target)?.push(r.source); });
    const queue = [from], previous = new Map([[from, null]]);
    for (let i = 0; i < queue.length && !previous.has(to); i++) for (const next of adjacency.get(queue[i]) || []) if (!previous.has(next)) { previous.set(next, queue[i]); queue.push(next); }
    if (!previous.has(to)) { graph3d.setPath([]); info.textContent = 'No path found between these entities.'; return; }
    const path = []; for (let id = to; id; id = previous.get(id)) path.unshift(id);
    graph3d.setPath(path); info.textContent = `Path (${path.length} nodes): ` + path.map(id => node(id)?.name || id).join(' → ');
  };
  $('clearPath').onclick = () => { Graph.clearPath(); graph3d.setPath([]); };
  $('fullscreen').onclick = async () => { try { if (document.fullscreenElement) await document.exitFullscreen(); else await $('workspace').requestFullscreen(); } catch { status('Full screen is unavailable in this browser.'); } };
  document.addEventListener('fullscreenchange', () => { $('fullscreen').textContent = document.fullscreenElement ? 'Exit full screen' : 'Full screen'; requestAnimationFrame(() => render()); });
  $('export').onclick = () => {
    try {
      const anchor = document.createElement('a');
      if (mode === '3d') { graph3d.draw(); anchor.href = $('graph3d').toDataURL('image/png'); anchor.download = 'FIR-knowledge-graph-3D.png'; anchor.click(); }
      else { const svg = Graph.svgString(); if (!svg) return; const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' })); anchor.href = url; anchor.download = 'FIR-knowledge-graph-2D.svg'; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
    } catch { status('Graph export failed. Please try again.', true); }
  };
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { $('inspector').hidden = true; Graph.closeDetail(); Graph.clearHighlight(); graph3d.selected = null; graph3d.draw(); } });
  window.addEventListener('error', () => status('Graph could not render. Try Reset or reload the panel.', true));
  window.addEventListener('message', event => {
    if (event.source !== parent || event.data?.type !== 'CMS_GRAPH_DATA') return;
    const data = event.data.graph;
    if (!data || !Array.isArray(data.entities) || !Array.isArray(data.documents) || !Array.isArray(data.relationships) || !Array.isArray(data.sources)) return;
    const nextSignature = JSON.stringify(data); if (signature === nextSignature) return; signature = nextSignature;
    full = data; type = ''; $('entitySearch').value = ''; updateView(); status('Live repository renderer • processed FIR sources only');
  });
  new ResizeObserver(() => { if (mode !== '3d' && view.documents.length + view.entities.length) { clearTimeout(window.cmsResizeTimer); window.cmsResizeTimer = setTimeout(() => Graph.render(), 120); } }).observe($('graphPaneFull'));
  window.addEventListener('pagehide', () => { Graph.pause(); graph3d.destroy(); });
  parent.postMessage({ type: 'CMS_GRAPH_READY' }, '*');
})();
