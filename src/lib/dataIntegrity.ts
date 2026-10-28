/** Values used in generated documents must come from saved facts, never examples. */
export function indiaDate(value: string | Date = new Date()): string {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? new Intl.DateTimeFormat('en-CA', {timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(date) : '';
}

export function nextRegisterSequence(numbers: string[], year: string): number {
  return numbers.reduce((max, number) => {
    const match = /^(\d+)\/(\d{4})$/.exec(number);
    return match?.[2] === year ? Math.max(max, Number(match[1])) : max;
  }, 0) + 1;
}

export function escapeDocumentText(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]!));
}

export function sameJurisdiction(a: {district?:string;stationName?:string}, b: {district?:string;policeStation?:string;stationName?:string}): boolean {
  const norm=(s?:string)=>(s||'').trim().toLowerCase();
  return !!norm(a.district) && norm(a.district)===norm(b.district) && !!norm(a.stationName) && norm(a.stationName)===norm(b.policeStation||b.stationName);
}

/** Escape document values recursively before interpolation into HTML. */
export function escapeDocumentValue<T>(value:T):T {
  if(typeof value === 'string')return escapeDocumentText(value) as T;
  if(Array.isArray(value))return value.map(item=>escapeDocumentValue(item)) as T;
  if(value && typeof value === 'object')return Object.fromEntries(Object.entries(value).map(([key,item])=>[key,escapeDocumentValue(item)])) as T;
  return value;
}

export function recordedCalendarDate(value:string):string {
  const text=value.replace(/[०-९]/g,digit=>String('०१२३४५६७८९'.indexOf(digit))).trim();
  const iso=/^(\d{4}-\d{2}-\d{2})/.exec(text);
  const local=/^(\d{2})[./-](\d{2})[./-](\d{4})/.exec(text);
  const result=iso?.[1] || (local?`${local[3]}-${local[2]}-${local[1]}`:'');
  return result && Number.isFinite(Date.parse(result)) && new Date(result).toISOString().slice(0,10)===result?result:'';
}

/** Reusable document examples supply headings, never case facts or default findings. */
export function blankTemplateFacts<T extends object>(example:T):T {
  const headings=new Set(['headerDept','headerGovt','docTitle','docSubTitle','headerVersion']);
  return Object.fromEntries(Object.entries(example).map(([key,value])=>[key,headings.has(key)?value:Array.isArray(value)?[]:typeof value==='boolean'?false:typeof value==='number'?0:''])) as T;
}
