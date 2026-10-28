import { z } from 'zod';
import { apiAccess, forbidden } from '@/lib/apiSecurity';
import { isFirVisibleToUser } from '@/lib/firIntegrity';
import { accusedChargesheetSchema } from '@/lib/accusedChargesheet';
import { readFirRecords, saveFirRecords, FirRepositoryConflict } from '@/services/firRepository';
import { firReportAccusedSources, firReportSources } from '@/services/firReportAccusedSources';

export const runtime = 'nodejs';
const requestSchema = z.object({
  firId: z.string().min(1).max(200), expectedRevision: z.number().int().nonnegative(),
  accused: z.object({ accusedId: z.string().min(1).max(200), name: z.string().trim().min(1).max(500), relation: z.string().max(200), relativeName: z.string().max(500), status: z.string().max(200), chargesheetDetails: accusedChargesheetSchema }),
});

export async function GET(req: Request) {
  const user = apiAccess(req); if (user instanceof Response) return user;
  const firId = new URL(req.url).searchParams.get('firId');
  try {
    const fir = (await readFirRecords()).find(row => row.id === firId);
    if (!fir || !isFirVisibleToUser(user, fir)) return forbidden();
    const { accused, witnesses } = await firReportSources(fir, user);
    const ids = new Set(accused.map(person => person.accusedId));
    return Response.json({ accused, witnesses, drafts: Object.values(fir.accusedChargesheetDrafts || {}).filter(draft => ids.has(draft.accusedId)) }, { headers: { 'Cache-Control': 'no-store' } });
  } catch { return Response.json({ error: 'Accused details could not be loaded. Please retry.' }, { status: 503 }); }
}

export async function POST(req: Request) {
  const user = apiAccess(req); if (user instanceof Response) return user;
  try {
    const body = requestSchema.parse(await req.json());
    const fir = (await readFirRecords()).find(row => row.id === body.firId);
    if (!fir || !isFirVisibleToUser(user, fir)) return forbidden();
    if (!(await firReportAccusedSources(fir, user)).some(person => person.accusedId === body.accused.accusedId)) return Response.json({ error: 'This accused is not linked to this FIR or its processed evidence.' }, { status: 400 });
    if (!['SHO', 'MHC_GD_INCHARGE', 'DUTY_OFFICER', 'SUPER_ADMIN', 'SP_DISTRICT', 'DSP_SUBDIV', 'ENQUIRY_OFFICER'].includes(user.role)) return forbidden();
    const old = fir.accusedChargesheetDrafts?.[body.accused.accusedId];
    if ((old?.revision || 0) !== body.expectedRevision) return Response.json({ error: 'Accused details changed. Close and reopen the form before editing.' }, { status: 409 });
    const draft = { ...body.accused, revision: body.expectedRevision + 1, updatedAt: new Date().toISOString(), savedBy: user.id };
    const updated = { ...fir, accusedChargesheetDrafts: { ...fir.accusedChargesheetDrafts, [draft.accusedId]: draft },
      auditTrail: [...(fir.auditTrail || []), { id: crypto.randomUUID(), action: 'ACCUSED_CHARGESHEET_DETAILS_SAVED', timestamp: draft.updatedAt, officerName: user.name, role: user.role, details: `Saved reusable IIF-V accused details for ${draft.name} (revision ${draft.revision}).` }],
    };
    if (Object.keys(updated.accusedChargesheetDrafts).length > 500) return Response.json({ error: 'Maximum 500 accused details per FIR.' }, { status: 400 });
    const [savedFir] = await saveFirRecords([{ record: updated, expectedVersion: fir.persistenceVersion || 0 }], user);
    return Response.json({ draft, fir: savedFir }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const status = error instanceof z.ZodError || error instanceof SyntaxError ? 400 : error instanceof FirRepositoryConflict ? 409 : 503;
    return Response.json({ error: status === 400 ? 'Check all required accused details.' : status === 409 ? 'This FIR changed. Reload before saving again.' : 'Accused details were not saved. Please retry.' }, { status });
  }
}
