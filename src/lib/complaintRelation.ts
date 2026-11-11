import type { RelativeRelation } from '@/types';

export function complaintRelationFromSource(source: string, name: string): { type?: RelativeRelation; relative: string } {
  const subject = name.trim().split(/\s+/).map(word => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('\\s+');
  if (!subject) return { relative: '' };
  const pattern = new RegExp(
    '(?<![\\p{L}\\p{M}])' + subject + '\\s*[,;:]?\\s*(पुत्री|पुत्र|पत्नी|s\\s*[/ .]\\s*o|d\\s*[/ .]\\s*o|w\\s*[/ .]\\s*o|c\\s*[/ .]\\s*o|son of|daughter of|wife of|care of)(?![\\p{L}\\p{M}])\\s*[:.-]?\\s*([^\\n,।;]+)',
    'giu',
  );
  const matches = [...source.matchAll(pattern)].map(([, marker, value]) => {
    const key = marker.toLowerCase().replace(/[\s/.]/g, '');
    const type: RelativeRelation = /^(पत्नी|wo|wifeof)$/.test(key) ? 'W/O' :
      /^(पुत्री|do|daughterof)$/.test(key) ? 'D/O' : /^(co|careof)$/.test(key) ? 'C/O' : 'S/O';
    return { type, relative: value.split(/\s+(?:निवासी|रहने वाली|रहने वाला|r\s*\/\s*o|मो[०0.]|मोबाइल)/iu)[0].trim() };
  }).filter(match => match.relative);
  const first = matches[0];
  return first && matches.every(match => match.type === first.type && match.relative === first.relative) ? first : { relative: '' };
}
