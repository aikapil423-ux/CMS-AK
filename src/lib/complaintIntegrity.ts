import type { ComplaintItem } from '@/types';
export function isComplaintResolved(c:Partial<ComplaintItem>){const status=(c.status||'').toUpperCase().replaceAll(' ','_');return ['COMPLETE','DISPOSED','FIR_REGISTERED'].includes(status)||status.startsWith('DISPOSED_');}
export function complaintResolvedAt(c:Partial<ComplaintItem>):string|undefined {
 return c.resolvedAt || c.firRegisteredAt || c.disposedAt || (isComplaintResolved(c)?c.shoApprovedAt:undefined);
}
export function computeDaysPending(c:Partial<ComplaintItem>,now=new Date()):number {
 const dateKey=(v:string|Date)=>{const d=new Date(v);return Number.isFinite(d.getTime())?new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(d):'';};
 if(!c.createdAt)return c.daysPending||0;
 const start=dateKey(c.createdAt);
 const end=isComplaintResolved(c)?dateKey(complaintResolvedAt(c)||c.updatedAt||c.createdAt):dateKey(now);
 const days=(Date.parse(end)-Date.parse(start))/86400000;
 return Number.isFinite(days)?Math.max(0,Math.floor(days)):0;
}
export function stabilizeComplaint(next:ComplaintItem,previous?:ComplaintItem):ComplaintItem {
 return {...next,resolvedAt:isComplaintResolved(next)?(previous&&isComplaintResolved(previous)?complaintResolvedAt(previous)||previous.updatedAt:undefined)||complaintResolvedAt(next)||next.updatedAt||new Date().toISOString():undefined};
}
