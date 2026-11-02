import { apiAccess } from '@/lib/apiSecurity';
import { authorizedAnalysisFir, refreshCaseAnalysis } from '@/services/caseAnalysisService';

export const runtime = 'nodejs';
export const maxDuration = 120;

export async function POST(req: Request) {
  const user = apiAccess(req); if (user instanceof Response) return user;
  try {
    const body = await req.json();
    if (typeof body.firId !== 'string' || !body.firId) return Response.json({ error: 'FIR ID is required.' }, { status: 400 });
    const fir = await authorizedAnalysisFir(body.firId, user);
    if (!fir) return Response.json({ error: 'FIR not found or access denied.' }, { status: 404 });
    return Response.json({ analysis: await refreshCaseAnalysis(fir, user, body.force === true) });
  } catch { return Response.json({ error: 'Case analysis could not be saved. Retry.' }, { status: 500 }); }
}
