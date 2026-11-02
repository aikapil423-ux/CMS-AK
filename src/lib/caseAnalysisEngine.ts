import { createHash } from 'node:crypto';
import type { CaseConflict, CaseGraphLink, CaseGraphNode, CaseSource } from '@/types/caseAnalysis';

export const analysisHash = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const normalized = (value: string) => value.normalize('NFKC').toLocaleLowerCase().replace(/\s+/g, ' ').trim();

// Every source chunk meets every other group: long cases are not silently truncated.
// Overlap preserves statements at text boundaries. IDs still refer to the full saved sources.
export function caseComparisonBatches(sources: CaseSource[]) {
  const groups: Pick<CaseSource, 'id' | 'name' | 'date' | 'text'>[][] = [];
  let group: Pick<CaseSource, 'id' | 'name' | 'date' | 'text'>[] = [], size = 0;
  for (const s of [...sources].sort((a, b) => a.id.localeCompare(b.id))) {
    for (let start = 0; start < s.text.length; start += 29000) {
      const text = s.text.slice(start, start + 30000);
      if (size + text.length > 65000 && group.length) { groups.push(group); group = []; size = 0; }
      group.push({ id: s.id, name: s.name, date: s.date, text }); size += text.length;
      if (start + 30000 >= s.text.length) break;
    }
  }
  if (group.length) groups.push(group);
  if (groups.length < 2) return groups;
  const batches = [];
  for (let i = 0; i < groups.length; i++) for (let j = i + 1; j < groups.length; j++) batches.push([...groups[i], ...groups[j]]);
  return batches;
}

// Differences are review candidates, never findings of dishonesty. Missing values are not conflicts.
export function compareCaseFacts(sources: CaseSource[]): CaseConflict[] {
  const result: CaseConflict[] = [];
  const ordered = [...sources].sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
  for (let i = 0; i < ordered.length; i++) for (let j = i + 1; j < ordered.length; j++) {
    const old = ordered[i], next = ordered[j];
    for (const [field, oldValue] of Object.entries(old.facts)) {
      const newValue = next.facts[field];
      if (!oldValue.trim() || !newValue?.trim() || normalized(oldValue) === normalized(newValue)) continue;
      result.push({ id: analysisHash([old.id, next.id, field, oldValue, newValue]), title: field,
        severity: /date|time|amount/i.test(field) ? 'HIGH' : 'MEDIUM',
        explanation: 'Different saved values for the same field. Verify identity, context and source before confirming a contradiction.',
        oldSourceId: old.id, newSourceId: next.id, oldValue, newValue, method: 'FIELD_COMPARISON' });
    }
  }
  return result;
}

// Reject model citations which cannot be traced verbatim to the supplied source.
export function validateAIConflicts(input: unknown, sources: CaseSource[]): CaseConflict[] {
  if (!Array.isArray(input)) throw new Error('AI returned an invalid conflicts list.');
  const byId = new Map(sources.map(s => [s.id, s]));
  return input.map((item: Record<string, unknown>) => {
    const a = byId.get(String(item.oldSourceId)), b = byId.get(String(item.newSourceId));
    const oldValue = String(item.oldValue || ''), newValue = String(item.newValue || '');
    if (!a || !b || a.id === b.id || !oldValue.trim() || !newValue.trim() ||
      !a.text.includes(oldValue) || !b.text.includes(newValue) || normalized(oldValue) === normalized(newValue)) {
      throw new Error('AI returned an unsupported source quotation. Retry analysis.');
    }
    const reversed = a.date > b.date;
    return { id: analysisHash(reversed ? [b.id, a.id, newValue, oldValue] : [a.id, b.id, oldValue, newValue]), title: String(item.title || 'Conflicting statements'),
      explanation: String(item.explanation || 'Verify the source statements.'),
      severity: (['HIGH', 'MEDIUM', 'LOW'].includes(String(item.severity)) ? item.severity : 'MEDIUM') as CaseConflict['severity'],
      oldSourceId: reversed ? b.id : a.id, newSourceId: reversed ? a.id : b.id,
      oldValue: reversed ? newValue : oldValue, newValue: reversed ? oldValue : newValue, method: 'AI' as const };
  });
}

export function buildCaseGraph(sources: CaseSource[]): { nodes: CaseGraphNode[]; links: CaseGraphLink[] } {
  const nodes = new Map<string, CaseGraphNode>(), links: CaseGraphLink[] = [];
  for (const source of sources) {
    nodes.set(source.id, { id: source.id, label: source.name, type: 'Document', sourceIds: [source.id] });
    for (const [field, value] of Object.entries(source.facts)) {
      if (!value.trim() || /^(Incident date|Incident time|Complainant name)$/i.test(field)) continue;
      if (field.startsWith('Person:')) {
        const [, name, attribute] = field.split(':');
        const personId = 'entity-' + analysisHash(['Person', normalized(name)]);
        const detail = source.entityDetails?.[`Person:${name}`];
        const person: CaseGraphNode = nodes.get(personId) || { id: personId, label: detail?.label || name, type: 'Person', sourceIds: [], properties: {} };
        if (!person.sourceIds.includes(source.id)) person.sourceIds.push(source.id);
        person.properties = { ...person.properties, [attribute]: value };
        person.citations = [...(person.citations || []).filter(c => c.sourceId !== source.id), { sourceId: source.id, page: detail?.page, quote: detail?.quote }];
        nodes.set(personId, person);
        const documentLink = analysisHash([source.id, personId]);
        if (!links.some(l => l.id === documentLink)) links.push({ id: documentLink, source: source.id, target: personId, label: 'Named in source', sourceIds: [source.id] });
        // A residence is a person attribute, never proof of presence or a detached scene node.
        if (attribute === 'address') continue;
        const type = attribute === 'phone' ? 'Phone' : attribute === 'address' ? 'Location' : 'Role';
        const id = 'entity-' + analysisHash([type, normalized(value)]);
        const node = nodes.get(id) || { id, label: value, type, sourceIds: [] };
        if (!node.sourceIds.includes(source.id)) node.sourceIds.push(source.id);
        nodes.set(id, node);
        const linkId = analysisHash([personId, id, attribute]);
        const link = links.find(l => l.id === linkId);
        if (link) { if (!link.sourceIds.includes(source.id)) link.sourceIds.push(source.id); }
        else links.push({ id: linkId, source: personId, target: id, label: `Recorded ${attribute}`, sourceIds: [source.id] });
        continue;
      }
      const type = field.startsWith('Vehicle:') ? 'Vehicle' : field.startsWith('Section:') ? 'Section' : field.startsWith('Property:') ? 'Property' : /place|address/i.test(field) ? 'Location' : 'Fact';
      const label = field.startsWith('Person:') ? field.split(':')[1] : value;
      const id = 'entity-' + analysisHash([type, normalized(label)]);
      const node = nodes.get(id) || { id, label, type, sourceIds: [] };
      if (!node.sourceIds.includes(source.id)) node.sourceIds.push(source.id);
      nodes.set(id, node);
      links.push({ id: analysisHash([source.id, field, value]), source: source.id, target: id,
        label: field.startsWith('Person:') ? `${field.split(':').slice(2).join(':')}: ${value}` : field, sourceIds: [source.id] });
    }
    const extracted = source.investigation;
    if (!extracted) continue;
    for (const entity of extracted.entities) {
      const citation = { sourceId: source.id, page: entity.source.page, quote: entity.source.verbatimQuote };
      nodes.set(entity.id, { id: entity.id, label: entity.primaryName, type: entity.type.toLowerCase(), sourceIds: [source.id], confidence: entity.confidence,
        properties: { ...entity.attributes, role: entity.role, aliases: entity.aliases }, citations: [citation] });
      links.push({ id: analysisHash([entity.id, source.id]), source: entity.id, target: source.id, label: 'Named in source', sourceIds: [source.id], citations: [citation] });
    }
    for (const event of extracted.events) {
      const citation = { sourceId: source.id, page: event.source.page, quote: event.source.verbatimQuote, date: event.date, time: event.time };
      nodes.set(event.id, { id: event.id, label: event.title, type: 'event', sourceIds: [source.id], properties: { eventType: event.type, date: event.date, time: event.time }, citations: [citation] });
      links.push({ id: analysisHash([event.id, source.id]), source: event.id, target: source.id, label: 'Event recorded in', sourceIds: [source.id], citations: [citation] });
      for (const person of event.participantEntityIds) if (nodes.has(person)) links.push({ id: analysisHash([person, event.id]), source: person, target: event.id, label: 'Participant in', sourceIds: [source.id], citations: [citation], properties: { date: event.date, time: event.time } });
      if (event.locationEntityId && nodes.has(event.locationEntityId)) links.push({ id: analysisHash([event.id, event.locationEntityId]), source: event.id, target: event.locationEntityId, label: 'Event at', sourceIds: [source.id], citations: [citation], properties: { date: event.date, time: event.time } });
    }
    for (const rel of extracted.relationships) if (nodes.has(rel.sourceEntityId) && nodes.has(rel.targetEntityId)) links.push({ id: rel.id, source: rel.sourceEntityId, target: rel.targetEntityId, label: rel.type, sourceIds: [source.id],
      properties: { date: rel.date || '', time: rel.time || '' }, citations: [{ sourceId: source.id, page: rel.source.page, quote: rel.source.verbatimQuote, date: rel.date, time: rel.time }] });
  }
  return { nodes: [...nodes.values()], links };
}
