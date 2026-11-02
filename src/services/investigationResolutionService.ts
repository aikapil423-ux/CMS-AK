import identity from '@/lib/investigation/identity.cjs';
import type { CaseGraphNode, CaseGraphLink } from '@/types/caseAnalysis';
import { analysisHash } from '@/lib/caseAnalysisEngine';

/** Original reference matcher/merger, with conservative automatic decisions and full citations. */
export function resolveInvestigationGraph(graph: { nodes: CaseGraphNode[]; links: CaseGraphLink[] }) {
  const groups: CaseGraphNode[][] = [];
  const shape = (n: CaseGraphNode) => ({ id: n.id, name: n.label, type: n.type.toLowerCase(), props: n.properties || {}, source: n.sourceIds[0], sources: n.sourceIds, confidence: n.confidence });
  for (const node of graph.nodes) {
    if (['document', 'role', 'event', 'fact'].includes(node.type.toLowerCase())) { groups.push([node]); continue; }
    const group = groups.find(g => {
      if (g[0].type.toLowerCase() !== node.type.toLowerCase()) return false;
      // Distinct printed identifiers must remain separate; a shared phone never merges people alone.
      const a = g[0].properties || {}, b = node.properties || {};
      if (['fatherName', 'father', 'idDetails', 'aadhaar', 'pan', 'passport'].some(k => a[k] && b[k] && String(a[k]).toLowerCase() !== String(b[k]).toLowerCase())) return false;
      const decision = identity.sameIdentity(shape(g[0]), shape(node));
      return decision.same && ['same-spelling', 'same-value', 'alias', 'same-address', 'same-address-parts', 'same-place'].includes(decision.reason || '');
    });
    if (group) group.push(node); else groups.push([node]);
  }
  const remap = new Map<string, string>();
  const nodes = groups.map(group => {
    if (group.length === 1) { remap.set(group[0].id, group[0].id); return group[0]; }
    const merged = identity.mergeGroup(group.map(shape));
    group.forEach(n => remap.set(n.id, merged.id));
    return { ...group[0], id: merged.id, label: merged.name, properties: merged.props,
      sourceIds: [...new Set(group.flatMap(n => n.sourceIds))], citations: group.flatMap(n => n.citations || []), confidence: merged.confidence };
  });
  const links = new Map<string, CaseGraphLink>();
  for (const link of graph.links) {
    const source = remap.get(link.source), target = remap.get(link.target); if (!source || !target || source === target) continue;
    const id = analysisHash([source, target, link.label, link.properties || {}, link.citations?.map(c => [c.date, c.time, c.quote]) || []]);
    const existing = links.get(id);
    if (existing) { existing.sourceIds = [...new Set([...existing.sourceIds, ...link.sourceIds])]; existing.citations = [...(existing.citations || []), ...(link.citations || [])]; }
    else links.set(id, { ...link, id, source, target });
  }
  return { nodes, links: [...links.values()] };
}
