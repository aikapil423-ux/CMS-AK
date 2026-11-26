import { apiAccess, forbidden, scopeAllowed } from '@/lib/apiSecurity';
import { getAllAccounts } from '@/services/accountMasterService';

export async function GET(request: Request) {
  const user = await apiAccess(request);
  if (user instanceof Response) return user;
  if (!['SHO', 'SUPER_ADMIN', 'SP_DISTRICT', 'DSP_SUBDIV', 'ASP_HQ'].includes(user.role)) return forbidden();

  const params = new URL(request.url).searchParams;
  const station = params.get('station');
  const district = params.get('district');
  if (!station || !district || !scopeAllowed(user, { stationName: station, district })) return forbidden();

  const normalize = (value: string) => value.trim().toLowerCase();
  try {
    const officers = (await getAllAccounts()).filter(account =>
      account.status === 'ACTIVE' && ['ENQUIRY_OFFICER', 'DUTY_OFFICER'].includes(account.role) &&
      normalize(account.district) === normalize(district) &&
      normalize(account.policeStation) === normalize(station)
    ).map(account => ({ id: account.id, name: account.fullName, rank: account.rankDisplay || account.rank,
      pno: account.pno, beltNumber: account.beltNumber, phone: account.mobileNumber }));
    return Response.json({ officers }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return Response.json({ error: 'Could not load the IO roster.' }, { status: 503 });
  }
}
