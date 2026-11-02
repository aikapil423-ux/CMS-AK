/* CMS 3D view. All nodes and links come from the same saved case graph as 2D. */
(function () {
  'use strict';
  const colors = { person: '#6366f1', phone: '#f97316', location: '#ef4444', document: '#94a3b8', event: '#8b5cf6', date: '#38bdf8', section: '#ca8a04', vehicle: '#06b6d4', property: '#10b981' };
  const icons = { person: '👤', phone: '📱', location: '📍', document: '📄', event: '📅', date: '🗓', section: '⚖', vehicle: '🚗', property: '📦' };
  function color(node) {
    if (node.type !== 'person') return colors[node.type] || '#64748b';
    const role = node.props?.role || '';
    if (/complainant|victim/i.test(role)) return '#dc2626';
    if (/witness/i.test(role)) return '#0ea5e9';
    if (/accused|suspect/i.test(role)) return '#475569';
    if (/officer|police/i.test(role)) return '#c4b458';
    return colors.person;
  }
  function project(point, camera, width, height) {
    const cy = Math.cos(camera.yaw), sy = Math.sin(camera.yaw), cp = Math.cos(camera.pitch), sp = Math.sin(camera.pitch);
    const x = point.x * cy + point.z * sy, z = -point.x * sy + point.z * cy;
    const y = point.y * cp - z * sp, depth = point.y * sp + z * cp;
    const scale = Math.min(width, height) * 1.8 * camera.zoom / Math.max(80, camera.distance + depth);
    return { x: width / 2 + camera.panX + x * scale, y: height / 2 + camera.panY + y * scale, z: depth, scale };
  }
  function layout(nodes, links, distance) {
    const radius = distance * 1.2 + Math.sqrt(nodes.length) * 16;
    const points = nodes.map((n, i) => {
      const y = 1 - 2 * (i + .5) / Math.max(1, nodes.length), angle = i * Math.PI * (3 - Math.sqrt(5)), r = Math.sqrt(1 - y * y);
      return { ...n, x: Math.cos(angle) * r * radius, y: y * radius, z: Math.sin(angle) * r * radius };
    });
    const byId = new Map(points.map(n => [n.id, n]));
    for (let step = 0; step < 45; step++) {
      const force = new Map(points.map(n => [n.id, { x: -n.x * .006, y: -n.y * .006, z: -n.z * .006 }]));
      for (const link of links) {
        const a = byId.get(link.source), b = byId.get(link.target); if (!a || !b) continue;
        const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z, d = Math.hypot(dx, dy, dz) || 1, f = (d - distance) * .04 / d;
        const fa = force.get(a.id), fb = force.get(b.id);
        fa.x += dx * f; fa.y += dy * f; fa.z += dz * f;
        fb.x -= dx * f; fb.y -= dy * f; fb.z -= dz * f;
      }
      // Bounded deterministic sampling keeps large case layouts responsive.
      const stride = Math.max(1, Math.ceil(points.length / 180));
      for (let i = 0; i < points.length; i++) for (let j = i + 1; j < points.length; j += stride) {
        const a = points[i], b = points[j], dx = a.x - b.x, dy = a.y - b.y, dz = a.z - b.z;
        const d = Math.max(25, Math.hypot(dx, dy, dz)), f = 1600 / (d * d * d);
        const fa = force.get(a.id), fb = force.get(b.id);
        fa.x += dx * f; fa.y += dy * f; fa.z += dz * f;
        fb.x -= dx * f; fb.y -= dy * f; fb.z -= dz * f;
      }
      points.forEach(n => { const f = force.get(n.id); n.x += f.x; n.y += f.y; n.z += f.z; });
    }
    return points;
  }

  class Graph3D {
    constructor(canvas, select) {
      this.canvas = canvas; this.ctx = canvas.getContext('2d'); this.select = select;
      this.nodes = []; this.links = []; this.projected = []; this.size = 1; this.text = 1; this.path = new Set(); this.active = false;
      this.resetCamera();
      canvas.addEventListener('pointerdown', e => {
        this.drag = { x: e.clientX, y: e.clientY, startX: e.clientX, startY: e.clientY, id: this.hit(e)?.id, pan: e.shiftKey || e.button === 2 };
        canvas.setPointerCapture(e.pointerId);
      });
      canvas.addEventListener('pointermove', e => {
        if (!this.drag) { canvas.style.cursor = this.hit(e) ? 'pointer' : 'grab'; return; }
        const dx = e.clientX - this.drag.x, dy = e.clientY - this.drag.y;
        this.drag.x = e.clientX; this.drag.y = e.clientY;
        if (this.drag.id) {
          const n = this.nodes.find(n => n.id === this.drag.id), p = this.projected.find(p => p.id === this.drag.id);
          if (n && p) {
            const x = dx / p.scale, y = dy / p.scale, sy = Math.sin(this.camera.yaw), cy = Math.cos(this.camera.yaw), sp = Math.sin(this.camera.pitch), cp = Math.cos(this.camera.pitch);
            n.x += x * cy + y * sp * sy; n.y += y * cp; n.z += x * sy - y * sp * cy;
          }
        } else if (this.drag.pan) { this.camera.panX += dx; this.camera.panY += dy; }
        else { this.camera.yaw += dx * .007; this.camera.pitch = Math.max(-1.5, Math.min(1.5, this.camera.pitch + dy * .007)); }
        this.draw();
      });
      canvas.addEventListener('pointerup', e => {
        if (this.drag && Math.hypot(e.clientX - this.drag.startX, e.clientY - this.drag.startY) < 5) {
          this.selected = this.drag.id || null; this.select(this.selected); this.draw();
        }
        this.drag = null;
      });
      canvas.addEventListener('pointercancel', () => { this.drag = null; });
      canvas.addEventListener('contextmenu', e => e.preventDefault());
      canvas.addEventListener('wheel', e => { e.preventDefault(); this.zoomBy(Math.exp(-e.deltaY * .001)); }, { passive: false });
      canvas.addEventListener('dblclick', () => this.fit());
      this.observer = new ResizeObserver(() => { if (this.active) this.draw(); }); this.observer.observe(canvas);
    }
    resetCamera() { this.camera = { yaw: -.2, pitch: .25, zoom: 1, distance: 900, panX: 0, panY: 0 }; }
    setData(nodes, links, distance = 120) {
      this.nodes = layout(nodes, links, distance); this.links = links;
      this.camera.distance = Math.max(700, ...this.nodes.map(n => Math.hypot(n.x, n.y, n.z) * 3));
      this.path.clear(); this.selected = null; this.draw();
    }
    fit() { this.camera.zoom = 1; this.camera.panX = 0; this.camera.panY = 0; this.draw(); }
    zoomBy(factor) { this.camera.zoom = Math.max(.2, Math.min(5, this.camera.zoom * factor)); this.draw(); }
    focus(id) { this.selected = id; this.draw(); }
    setPath(ids) { this.path = new Set(ids); this.draw(); }
    hit(event) {
      const rect = this.canvas.getBoundingClientRect(), x = event.clientX - rect.left, y = event.clientY - rect.top;
      return [...this.projected].reverse().find(p => Math.hypot(p.x - x, p.y - y) < p.radius + 7);
    }
    draw() {
      if (!this.active || !this.ctx) return;
      const rect = this.canvas.getBoundingClientRect(); if (!rect.width || !rect.height) return;
      const width = rect.width, height = rect.height, ratio = Math.min(2, window.devicePixelRatio || 1), ctx = this.ctx;
      this.canvas.width = Math.round(width * ratio); this.canvas.height = Math.round(height * ratio); ctx.scale(ratio, ratio);
      ctx.clearRect(0, 0, width, height);
      const background = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, Math.max(width, height) * .7);
      background.addColorStop(0, '#172b45'); background.addColorStop(1, '#081323'); ctx.fillStyle = background; ctx.fillRect(0, 0, width, height);
      const points = this.nodes.map(n => ({ ...n, ...project(n, this.camera, width, height) }));
      const byId = new Map(points.map(p => [p.id, p]));
      const neighbors = new Set([this.selected]);
      this.links.forEach(l => { if (l.source === this.selected) neighbors.add(l.target); if (l.target === this.selected) neighbors.add(l.source); });
      this.links.forEach(l => {
        const a = byId.get(l.source), b = byId.get(l.target); if (!a || !b) return;
        const path = this.path.has(a.id) && this.path.has(b.id), focused = !this.selected || a.id === this.selected || b.id === this.selected;
        ctx.globalAlpha = path ? 1 : focused ? .55 : .08; ctx.strokeStyle = path ? '#fbbf24' : '#7a9ecb'; ctx.lineWidth = path ? 2.5 : 1;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        if (this.text && (path || (this.selected && focused) || this.links.length < 30) && !/named_in/i.test(l.type)) {
          ctx.globalAlpha = this.text * .9; ctx.font = '10px Segoe UI, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#cbd5e1';
          const label = l.type.replace(/_/g, ' '); ctx.fillText(label.length > 32 ? label.slice(0, 31) + '…' : label, (a.x + b.x) / 2, (a.y + b.y) / 2 - 5);
        }
      });
      points.sort((a, b) => b.z - a.z);
      points.forEach(p => {
        p.radius = Math.max(5, Math.min(35, (p.type === 'person' ? 18 : p.type === 'document' ? 11 : 14) * p.scale * this.size));
        const active = !this.selected || neighbors.has(p.id), path = this.path.has(p.id);
        ctx.globalAlpha = active || path ? 1 : .2;
        const fill = color(p), glow = ctx.createRadialGradient(p.x - p.radius / 3, p.y - p.radius / 3, 1, p.x, p.y, p.radius);
        glow.addColorStop(0, '#ffffff'); glow.addColorStop(.32, fill); glow.addColorStop(1, fill);
        ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2); ctx.fillStyle = glow; ctx.fill();
        ctx.lineWidth = path || p.id === this.selected ? 3 : 1; ctx.strokeStyle = path || p.id === this.selected ? '#fbbf24' : '#ffffff66'; ctx.stroke();
        if (p.radius > 8) { ctx.font = `${Math.min(15, p.radius)}px Segoe UI, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff'; ctx.fillText(icons[p.type] || '•', p.x, p.y); }
        if (this.text && (active || path)) {
          ctx.globalAlpha *= this.text; ctx.font = '11px Segoe UI, sans-serif'; ctx.textBaseline = 'top'; ctx.textAlign = 'center'; ctx.fillStyle = '#e2e8f0';
          ctx.fillText(p.name.length > 30 ? p.name.slice(0, 29) + '…' : p.name, p.x, p.y + p.radius + 5);
        }
      });
      ctx.globalAlpha = 1; this.projected = points;
    }
    destroy() { this.active = false; this.observer.disconnect(); }
  }
  window.CMSGraph3D = { Graph3D, project, layout, color };
})();
