import { sessionUser, sameOrigin } from '@/lib/serverSession';
import type { UserSession } from '@/types';

export function apiAccess(req: Request): UserSession | Response {
  const user = sessionUser(req);
  if (!user) return Response.json({error:'Login required.'},{status:401});
  if (!['GET','HEAD','OPTIONS'].includes(req.method) && !sameOrigin(req)) return Response.json({error:'Invalid request origin.'},{status:403});
  const url = new URL(req.url);
  if (url.pathname.startsWith('/api/dev/') && (process.env.NODE_ENV === 'production' || user.role !== 'SUPER_ADMIN')) return Response.json({error:'Developer tools are disabled.'},{status:403});
  return user;
}

export function scopeAllowed(user: UserSession, record: {district?: string;policeStation?: string;stationName?: string}): boolean {
  if (user.role === 'SUPER_ADMIN') return true;
  const norm=(value?:string)=>(value||'').trim().toLowerCase();
  if (!norm(user.district) || norm(user.district)!==norm(record.district)) return false;
  if (['SP_DISTRICT','DSP_SUBDIV','ASP_HQ'].includes(user.role)) return true;
  return !!norm(user.stationName) && norm(user.stationName)===norm(record.policeStation || record.stationName);
}

export function officerDetails(user: UserSession) {
  return {name:user.name,rank:user.rankDisplay || user.rank || '',pno:user.pno, beltNumber:user.pno,role:user.role};
}

export function forbidden(message='Access denied.') { return Response.json({error:message},{status:403}); }
