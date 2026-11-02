import type { CaseAnalysis } from '@/types/caseAnalysis';

export function referenceGraphData(analysis: CaseAnalysis) {
  const byId = new Map(analysis.nodes.map(n => [n.id, n]));
  const temporal = (id: string) => /^(date|time|date_time|datetime|timestamp|date_range|time_range|year|month)$/i.test(byId.get(id)?.type || '') || analysis.links.some(l => l.target === id && /^Incident (date|time)$/i.test(l.label));
  const references = (ids: string[], citations: typeof analysis.nodes[number]['citations']) => ids.flatMap(id => {
    const source = analysis.sources.find(s => s.id === id);
    const found = citations?.filter(c => c.sourceId === id && (c.page || c.quote || c.date || c.time)) || [];
    const refs = found.length ? found : [undefined];
    return refs.map(citation => ({ id, name: source?.name || id, documentUrl: source?.documentUrl, page: citation?.page, quote: citation?.quote,
      date: citation?.date, time: citation?.time, incidentDate: source?.facts?.['Incident date'], incidentTime: source?.facts?.['Incident time'] }));
  });
  const typeOf = (id: string) => {
    const node = byId.get(id)!;
    if (node.type !== 'Fact') return node.type.toLowerCase() === 'legal_reference' ? 'section' : node.type.toLowerCase();
    const label = analysis.links.find(l => l.target === id)?.label || '';
    return /section/i.test(label) ? 'section' : /date/i.test(label) ? 'date' : /time/i.test(label) ? 'event' : /property/i.test(label) ? 'property' : 'event';
  };
  const roles = new Map<string, string[]>();
  analysis.links.forEach(l => {
    if (byId.get(l.target)?.type === 'Role') roles.set(l.source, [...(roles.get(l.source) || []), byId.get(l.target)!.label]);
  });
  const documents = analysis.nodes.filter(n => n.type === 'Document').map(n => ({ id: n.id, name: n.label, tags: [analysis.sources.find(s => s.id === n.id)?.kind || 'Evidence'] }));
  const entities = analysis.nodes.filter(n => !['Document', 'Role'].includes(n.type) && !temporal(n.id)).map(n => ({
    id: n.id, name: n.label, type: typeOf(n.id), source: n.sourceIds[0], sources: n.sourceIds,
    ...(typeof n.confidence === 'number' ? { confidence: n.confidence } : {}),
    sourceRefs: references(n.sourceIds, n.citations),
    props: { ...Object.fromEntries(Object.entries(n.properties || {}).map(([k, v]) => [k, typeof v === 'object' ? JSON.stringify(v) : v])),
      role: [...new Set([String(n.properties?.role || ''), ...(roles.get(n.id) || [])].filter(Boolean))].join(' / '), sourceCount: n.sourceIds.length,
      ...(n.citations?.[0]?.page ? { page: n.citations[0].page } : {}), ...(n.citations?.[0]?.quote ? { quote: n.citations[0].quote } : {}) },
  }));
  const allowed = new Set([...documents, ...entities].map(n => n.id));
  const relationships = analysis.links.filter(l => allowed.has(l.source) && allowed.has(l.target)).map(l => ({
    id: l.id,
    source: byId.get(l.source)?.type === 'Document' ? l.target : l.source,
    target: byId.get(l.source)?.type === 'Document' ? l.source : l.target,
    type: byId.get(l.source)?.type === 'Document' ? 'named_in' : l.label,
    evidence: l.citations?.map(c => c.quote).filter(Boolean).join('\n') || l.sourceIds.map(id => analysis.sources.find(s => s.id === id)?.name || '').filter(Boolean).join('; '),
    date: l.properties?.date || '', time: l.properties?.time || '', sourceRefs: references(l.sourceIds, l.citations),
  }));
  return { id: analysis.firId, documents, entities, relationships, sources: analysis.sources };
}
