export const auditSources = ['complaints', 'firs', 'gd', 'reports', 'courts', 'scrutiny'] as const;
export type AuditSource = typeof auditSources[number];
export interface AuditRow {
  id: string; source: AuditSource; caseId: string; reference: string; href: string;
  district: string; station: string; officer: string; category: string; status: string;
  registered: string; updated: string; assigned: string; submitted: string;
  title: string; age: number | null; pending: boolean | null; required?: boolean;
  findings: string[]; signals?: string[];
}
export interface AuditFilter {
  source?: string; search?: string; from?: string; to?: string;
  dateField?: string; station?: string; district?: string; officer?: string;
  category?: string; status?: string; pending?: string; minAge?: string; findings?: string;
  metric?: string; replyKind?: string; logic?: string; rules?: { field: string; value: string }[];
  sort?: string; direction?: string; secondarySort?: string; page?: number; pageSize?: number;
}
export const auditColumns = ['reference', 'source', 'title', 'station', 'district', 'officer', 'category', 'status', 'registered', 'updated', 'assigned', 'submitted', 'age'] as const;
export function auditPeriod(preset:string, now=new Date()) {
  const today=auditDate(now), date=new Date(today+'T00:00:00Z');
  const y=date.getUTCFullYear(),m=date.getUTCMonth();
  const key=(d:Date)=>d.toISOString().slice(0,10), at=(year:number,month:number,day:number)=>new Date(Date.UTC(year,month,day));
  let start=new Date(date),end=new Date(date);
  if(preset==='Yesterday'){start.setUTCDate(start.getUTCDate()-1);end=new Date(start);}
  else if(/^Last /.test(preset))start.setUTCDate(start.getUTCDate()-Number(preset.split(' ')[1])+1);
  else if(preset==='This month')start=at(y,m,1);
  else if(preset==='Previous month'){start=at(y,m-1,1);end=at(y,m,0);}
  else if(preset==='This quarter')start=at(y,Math.floor(m/3)*3,1);
  else if(preset==='This year'||preset==='Calendar year')start=at(y,0,1);
  else if(preset==='Previous year'){start=at(y-1,0,1);end=at(y-1,11,31);}
  else if(preset==='Financial year')start=at(m<3?y-1:y,3,1);
  return {from:key(start),to:key(end)};
}
export function auditDate(value: unknown): string {
  if (!value) return '';
  let text = value instanceof Date ? value.toISOString() : String(value);
  const display = /^(\d{2})[/.\-](\d{2})[/.\-](\d{4})$/.exec(text);
  if (display) text = `${display[3]}-${display[2]}-${display[1]}`;
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(text);
  if (!iso) return '';
  const check = new Date(Date.UTC(Number(iso[1]), Number(iso[2])-1, Number(iso[3])));
  if (check.toISOString().slice(0,10) !== iso[0]) return '';
  const date = new Date(text);
  if (!Number.isFinite(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-CA', {timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(date);
}
export function auditAge(value: unknown, now = new Date()): number | null {
  const start = auditDate(value), end = auditDate(now);
  return start && start <= end ? Math.floor((Date.parse(end) - Date.parse(start)) / 86400000) : null;
}
export function filterAudit(rows: AuditRow[], f: AuditFilter): AuditRow[] {
  const exact = (a: unknown, b: string) => String(a || '').toLowerCase() === b.toLowerCase();
  return rows.filter(r => {
    if (f.source && f.source !== 'all' && r.source !== f.source) return false;
    if (f.metric&&!r.signals?.includes(f.metric)) return false;
    if (f.replyKind==='saved'&&(r.source!=='courts'||r.required)) return false;
    if (f.replyKind==='required'&&!r.required) return false;
    if (f.search && ![r.reference,r.title,r.officer,r.station,r.category,r.status].join(' ').toLowerCase().includes(f.search.toLowerCase())) return false;
    for (const k of ['station','district','officer','category','status'] as const) if (f[k] && !exact(r[k], f[k]!)) return false;
    const date = r[(f.dateField || 'registered') as 'registered'];
    if ((f.from || f.to) && (!date || f.from && date < f.from || f.to && date > f.to)) return false;
    if (f.pending && (f.pending === 'yes' ? r.pending !== true : r.pending !== false)) return false;
    if (f.minAge && (r.age === null || r.age < Number(f.minAge))) return false;
    if (f.findings === 'yes' && !r.findings.length) return false;
    if (f.rules?.length) {
      const checks = f.rules.map(rule => exact(r[rule.field as keyof AuditRow], rule.value));
      if (!(f.logic === 'OR' ? checks.some(Boolean) : checks.every(Boolean))) return false;
    }
    return true;
  });
}
export function summarizeAudit(rows: AuditRow[], buckets=[0,8,16,31,61,91,181]) {
  const pending = rows.filter(r => r.pending === true), ages = pending.flatMap(r => r.age === null ? [] : [r.age]).sort((a,b)=>a-b);
  const groups = (key: 'source'|'status'|'officer'|'station'|'category') => Object.entries(rows.reduce<Record<string,number>>((out,r)=>{const v=r[key]||'Not recorded';out[v]=(out[v]||0)+1;return out;},{})).map(([name,count])=>({name,count}));
  return { total: rows.length, pending: pending.length, unknown: rows.filter(r=>r.pending===null).length,
    findings: rows.filter(r=>r.findings.length).length,
    averageAge: ages.length ? Math.round(ages.reduce((a,b)=>a+b,0)/ages.length) : null,
    medianAge: ages.length ? (ages[Math.floor((ages.length-1)/2)]+ages[Math.floor(ages.length/2)])/2 : null,
    oldestAge: ages.length ? ages[ages.length-1] : null,
    metrics:Object.entries(rows.reduce<Record<string,number>>((out,r)=>{for(const signal of r.signals||[])out[signal]=(out[signal]||0)+1;return out;},{})).map(([name,count])=>({name,count})),
    court: { saved:rows.filter(r=>r.source==='courts'&&!r.required).length, required:rows.filter(r=>r.required).length, prepared:rows.filter(r=>r.required&&r.pending===false).length, notPrepared:rows.filter(r=>r.required&&r.pending===true).length },
    bySource:groups('source'), byStatus:groups('status'), byOfficer:groups('officer'), byStation:groups('station'), byCategory:groups('category'),
    ageing:buckets.map((min,i,starts)=>({name: i===starts.length-1?`${min}+`:`${min}–${starts[i+1]-1}`,min,count:pending.filter(r=>r.age!==null&&r.age>=min&&(i===starts.length-1||r.age<starts[i+1])).length})) };
}
