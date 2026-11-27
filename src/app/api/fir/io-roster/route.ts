import { apiAccess, forbidden, scopeAllowed } from '@/lib/apiSecurity';
import { getActiveStationOfficers } from '@/services/accountMasterService';
import { isMhcOrMmRole } from '@/lib/officerRoles';

export async function GET(request: Request) {
  const user = await apiAccess(request);
  if (user instanceof Response) return user;
  const params = new URL(request.url).searchParams;
  const diary = params.get('purpose') === 'diary';
  if (!['SHO', 'SUPER_ADMIN', 'SP_DISTRICT', 'DSP_SUBDIV', 'ASP_HQ'].includes(user.role) &&
      !(diary && isMhcOrMmRole(user.role))) return forbidden();
  const station = params.get('station');
  const district = params.get('district');
  if (!station || !district || !scopeAllowed(user, { stationName: station, district })) return forbidden();

  try {
    const officers = (await getActiveStationOfficers(station, district)).filter(account =>
      account.role === 'ENQUIRY_OFFICER' || diary && (account.role === 'SHO' || isMhcOrMmRole(account.role))
    ).map(account => ({ id: account.id, name: account.fullName, rank: account.rankDisplay || account.rank,
      pno: account.pno, beltNumber: account.beltNumber, phone: account.mobileNumber, role: account.role }));
    return Response.json({ officers }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return Response.json({ error: 'Could not load the IO roster.' }, { status: 503 });
  }
}
