import { z } from 'zod';
import { apiAccess, forbidden } from '@/lib/apiSecurity';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

const postingChange = z.object({
  officerId: z.string().min(1).max(100),
  expectedUnitId: z.string().min(1).max(100),
  destinationUnitId: z.string().min(1).max(100),
  reason: z.string().trim().min(1).max(1000),
});

export async function POST(req: Request) {
  const actor = await apiAccess(req);
  if (actor instanceof Response) return actor;
  if (actor.role !== 'SUPER_ADMIN' || !actor.unitId) return forbidden();
  const parsed = postingChange.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: 'Invalid posting change.' }, { status: 400 });
  const { officerId, expectedUnitId, destinationUnitId, reason } = parsed.data;
  if (expectedUnitId === destinationUnitId) return Response.json({ error: 'Choose a different unit.' }, { status: 400 });

  try {
    return await prisma.$transaction(async tx => {
      const destination = await tx.policeUnit.findUnique({ where: { id: destinationUnitId } });
      if (!destination) return Response.json({ error: 'Destination unit not found.' }, { status: 404 });
      const updated = await tx.user.updateMany({
        where: { id: officerId, unitId: expectedUnitId, status: 'ACTIVE' },
        data: { unitId: destinationUnitId },
      });
      if (updated.count !== 1) return Response.json({ error: 'Officer posting changed or is unavailable.' }, { status: 409 });
      await tx.auditLog.create({
        data: {
          userId: actor.id, userPno: actor.pno, userRole: actor.role,
          action: 'OFFICER_POSTING_CHANGED', entityName: 'User', entityId: officerId,
          details: JSON.stringify({ previousUnitId: expectedUnitId, destinationUnitId, reason }),
        },
      });
      return Response.json({ officerId, unitId: destinationUnitId });
    });
  } catch {
    return Response.json({ error: 'Posting could not be updated. Refresh and retry.' }, { status: 503 });
  }
}
