import fs from 'node:fs/promises';
import path from 'node:path';
import { apiAccess } from '@/lib/apiSecurity';
import { isFirVisibleToUser } from '@/lib/firIntegrity';
import { canViewComplaint } from '@/utils/complaintPermissions';
import { diaryToday, validDiaryPeriod } from '@/lib/weeklyDiary';
import { buildIgpBriefing } from '@/lib/igpBriefing';
import { evidenceOwner } from '@/lib/evidenceOwnership';
import { readFirRecords } from '@/services/firRepository';
import { readComplaints } from '@/services/complaintRepository';
import type { UniversalEvidenceRecord } from '@/types/evidence';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const user = await apiAccess(req);
  if (user instanceof Response) return user;
  const today = diaryToday();
  const cutoff = new URL(req.url).searchParams.get('cutoff') || today;
  if (!validDiaryPeriod(cutoff, cutoff, today)) {
    return Response.json({error: 'Select a valid cutoff date on or before today.'}, {status:400});
  }
  try {
    const [allFirs, allComplaints] = await Promise.all([readFirRecords(), readComplaints()]);
    const district = user.district?.trim() || '';
    const inDistrict = (record: {district?: string; custodyUnit?: {district: string}}) => !!district && (record.custodyUnit?.district ?? record.district)?.trim().toLowerCase() === district.toLowerCase();
    const firs = allFirs.filter(fir=>inDistrict(fir) && isFirVisibleToUser(user,fir));
    const complaints = allComplaints.filter(complaint=>inDistrict(complaint) && canViewComplaint(user,complaint).allowed);
    const caseIds = new Set(firs.flatMap(fir=>[fir.id, fir.sourceComplaintId]));
    let evidence:UniversalEvidenceRecord[] = [];
    try {
      const saved:unknown = JSON.parse(await fs.readFile(path.join(process.cwd(),'prisma','processed-evidence-store.json'),'utf8'));
      if(Array.isArray(saved))evidence = saved.filter(item=>item?.caseId && caseIds.has(item.caseId)
        && (user.role==='SUPER_ADMIN' || evidenceOwner(item)===user.id));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code!=='ENOENT') console.error('IGP processed evidence unavailable.');
    }
    return Response.json(buildIgpBriefing(district,cutoff,firs,complaints,evidence), {headers:{'Cache-Control':'private, no-store'}});
  } catch {
    return Response.json({error:'IGP report sources unavailable.'}, {status:503});
  }
}
