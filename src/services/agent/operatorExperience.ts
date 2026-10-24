import type { WebsiteControl, WebsiteSnapshot } from './websiteOperator';

export type OperatorPhase='idle'|'planning'|'running'|'review'|'question'|'blocked'|'stopped'|'finished';
export interface OperatorExperience {
  phase:OperatorPhase; objective:string; steps:string[]; choices:string[];
  review:{label:string;before:string;after:string}[];
  metrics:{tasks:number;verifiedSteps:number;questions:number;failures:number;elapsedMs:number;helpful:number;unhelpful:number};
}
export function newExperience():OperatorExperience {
  return {phase:'idle',objective:'',steps:[],choices:[],review:[],metrics:{tasks:0,verifiedSteps:0,questions:0,failures:0,elapsedMs:0,helpful:0,unhelpful:0}};
}
export function sensitiveLabel(label:string):boolean {
  return /aadha[ar]*|आधार|\bpan\b|passport|password|otp|bank|account number|credit card|biometric/i.test(label);
}
export function redactSensitiveText(text:string):string {
  return text.replace(/\b\d{4}[ -]?\d{4}[ -]?\d{4}\b/g,'[REDACTED ID]').replace(/\b[A-Z]{5}\d{4}[A-Z]\b/g,'[REDACTED ID]');
}
/** Send control structure, not unrelated populated fields or every case in a dropdown. */
export function privatePlanningSnapshot(snapshot:WebsiteSnapshot,request:string):WebsiteSnapshot {
  const words=request.toLowerCase().split(/\s+/).filter(w=>w.length>3);
  return {...snapshot,errors:[],controls:snapshot.controls.filter(c=>!sensitiveLabel(c.label)).map(c=>{
    const related=words.some(w=>(c.label+' '+c.section).toLowerCase().includes(w));
    return {...c,value:related?redactSensitiveText(c.value || ''):undefined,
      options:/case|fir|complaint|person|recipient|अभियोग|व्यक्ति/i.test(c.label)?c.options?.filter(o=>o.value===c.value || words.some(w=>o.label.toLowerCase().includes(w))).slice(0,8):c.options};
  })};
}
export function normaliseFieldValue(control:WebsiteControl,value:string,now=new Date()):string {
  let v=value.replace(/[०-९]/g,c=>String(c.charCodeAt(0)-2406)).trim();
  if(control.type==='date') {
    const q=v.toLowerCase();
    const days=/^(today|aaj|आज)$/.test(q)?0:/^(tomorrow|kal|कल)$/.test(q)?1:/^(day after tomorrow|parso|परसों)$/.test(q)?2:undefined;
    if(days!==undefined){const india=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);const date=new Date(india+'T12:00:00+05:30');date.setTime(date.getTime()+days*86400000);return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(date);}
    const match=v.match(/^(\d{1,2})[/.](\d{1,2})[/.](\d{4})$/);if(match)return `${match[3]}-${match[2].padStart(2,'0')}-${match[1].padStart(2,'0')}`;
  }
  if(control.type==='time') {
    const m=v.match(/^(?:(subah|shaam|सुबह|शाम)\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm|baje|बजे)?$/i);
    if(m){let h=Number(m[2]);if(/shaam|शाम|pm/i.test((m[1]||'')+(m[4]||'')) && h<12)h+=12;if(/am/i.test(m[4]||'') && h===12)h=0;if(h<24 && Number(m[3]||0)<60)return `${String(h).padStart(2,'0')}:${m[3]||'00'}`;}
  }
  if(control.type==='tel') v=v.replace(/[ ()-]/g,'');
  return v;
}
