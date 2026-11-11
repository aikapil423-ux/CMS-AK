import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { apiAccess, forbidden } from '@/lib/apiSecurity';
import { prisma } from '@/lib/prisma';
import { currentJurisdiction, type CustodyUnit, type RecordTransfer } from '@/lib/recordCustody';
import { readFirRecords, updateFirTransfer, FirRepositoryConflict } from '@/services/firRepository';
import { readComplaints, updateComplaintTransfer, ComplaintConflict } from '@/services/complaintRepository';
import type { ComplaintItem, FIRItem, UserSession } from '@/types';

export const runtime = 'nodejs';
type CaseRecord = FIRItem | ComplaintItem;
const kinds = z.enum(['FIR', 'COMPLAINT']);
const id = z.string().min(1).max(200);
const request = z.discriminatedUnion('action', [
  z.object({ action: z.literal('request'), kind: kinds, recordId: id, destinationId: id, reason: z.string().trim().min(1).max(1000) }),
  z.object({ action: z.literal('decide'), kind: kinds, recordId: id, transferId: id, decision: z.enum(['APPROVED', 'REJECTED']), note: z.string().trim().min(1).max(1000) }),
]);
const normalize = (value: string) => value.trim().toLowerCase();
const sameDistrict = (a: string, b: string) => normalize(a) === normalize(b);
const supervisor = (user: UserSession) => user.role === 'SUPER_ADMIN' || user.role === 'SP_DISTRICT';
const eligible = (user: UserSession) => Boolean(user.unitId && (supervisor(user) || user.role === 'SHO'));

function controls(user: UserSession, unit: CustodyUnit) {
  return user.role === 'SUPER_ADMIN' || (user.role === 'SP_DISTRICT' && sameDistrict(user.district, unit.district)) || user.unitId === unit.id;
}

function canDecide(user: UserSession, transfer: RecordTransfer) {
  return supervisor(user) && user.id !== transfer.requestedBy && controls(user, transfer.from) && controls(user, transfer.to);
}

function sourceUnit(record: CaseRecord, units: CustodyUnit[]) {
  if (record.custodyUnit) return units.find(unit => unit.id === record.custodyUnit?.id);
  const scope = currentJurisdiction(record);
  const matches = units.filter(unit => sameDistrict(unit.district, scope.district ?? '') && normalize(unit.name) === normalize(scope.policeStation ?? ''));
  return matches.length === 1 ? matches[0] : undefined;
}

class TransferError extends Error {
  constructor(message: string, readonly status: number) { super(message); }
}

export async function GET(req: Request) {
  const user = await apiAccess(req);
  if (user instanceof Response) return user;
  if (!eligible(user)) return forbidden();
  const [units, firs, complaints] = await Promise.all([
    prisma.policeUnit.findMany({ select: { id: true, name: true, district: true }, orderBy: [{ district: 'asc' }, { name: 'asc' }] }),
    readFirRecords(), readComplaints(),
  ]);
  const rows = [...firs, ...complaints].flatMap(record => {
    const kind = 'complaintNumber' in record ? 'COMPLAINT' : 'FIR';
    const reference = 'complaintNumber' in record ? record.complaintNumber : record.firNumber;
    const unit = sourceUnit(record, units);
    const transfers = (record.recordTransfers ?? []).filter(transfer => controls(user, transfer.from) || controls(user, transfer.to));
    const canRequest = Boolean(unit && controls(user, unit) && !transfers.some(transfer => transfer.status === 'PENDING'));
    if (!canRequest && !transfers.length) return [];
    return [{ kind, id: record.id, reference, unit, canRequest, transfers: transfers.map(transfer => ({ ...transfer, canDecide: transfer.status === 'PENDING' && canDecide(user, transfer) })) }];
  });
  return Response.json({ units, rows }, { headers: { 'Cache-Control': 'private, no-store' } });
}

export async function POST(req: Request) {
  const user = await apiAccess(req);
  if (user instanceof Response) return user;
  if (!eligible(user)) return forbidden();
  const parsed = request.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: 'Enter the required transfer details.' }, { status: 400 });
  const input = parsed.data;
  const officer: UserSession = user;
  try {
    const units = await prisma.policeUnit.findMany({ select: { id: true, name: true, district: true } });
    function change<T extends CaseRecord>(record: T): T {
      const from = sourceUnit(record, units);
      const history = record.recordTransfers ?? [];
      if (input.action === 'request') {
        if (!from || !controls(officer, from)) throw new TransferError('Record is outside your unit or its registration unit needs review.', 403);
        if (history.some(transfer => transfer.status === 'PENDING')) throw new TransferError('A request is already pending.', 409);
        const to = units.find(unit => unit.id === input.destinationId);
        if (!to || to.id === from.id) throw new TransferError('Choose a different destination unit.', 400);
        return { ...record, recordTransfers: [...history, {
          id: randomUUID(), from, to, reason: input.reason, requestedBy: officer.id, requestedAt: new Date().toISOString(), status: 'PENDING',
        }] };
      }
      const pending = history.find(transfer => transfer.id === input.transferId);
      if (!pending || !canDecide(officer, pending)) throw new TransferError('You cannot decide this request.', 403);
      if (pending.status !== 'PENDING' || from?.id !== pending.from.id) throw new TransferError('This request has already changed. Refresh and retry.', 409);
      const destination = units.find(unit => unit.id === pending.to.id);
      if (input.decision === 'APPROVED' && (!destination || !controls(officer, destination))) throw new TransferError('Destination unit has changed. Review the request again.', 409);
      const updated = { ...record, recordTransfers: history.map(transfer => transfer.id === pending.id ? {
        ...transfer, status: input.decision, decidedBy: officer.id, decidedAt: new Date().toISOString(), decisionNote: input.note,
      } : transfer) };
      if (input.decision === 'REJECTED') return updated;
      return { ...updated, custodyUnit: destination,
        ...('complaintNumber' in record
          ? { assignedEoId: undefined, assignedEoPno: undefined, assignedEoName: undefined, currentComplaintOwnerId: undefined }
          : { assignedIoId: undefined, assignedIoPno: undefined, assignedIoName: undefined }),
      };
    }
    const saved = input.kind === 'FIR' ? await updateFirTransfer(input.recordId, change) : await updateComplaintTransfer(input.recordId, change);
    return saved ? Response.json({ success: true }) : Response.json({ error: 'Record not found.' }, { status: 404 });
  } catch (error) {
    const status = error instanceof TransferError ? error.status : error instanceof FirRepositoryConflict || error instanceof ComplaintConflict ? 409 : 503;
    return Response.json({ error: status === 503 ? 'Transfer could not be saved. Retry shortly.' : (error as Error).message }, { status });
  }
}
