import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { finalReportDbService, FinalReportConflict } from '@/services/finalReportDbService';

export const runtime = 'nodejs';
function failed(error: unknown) {
  console.error('Final report persistence failed:', error);
  if (error instanceof z.ZodError) return NextResponse.json({ error: 'Invalid final report data. Check all required fields.' }, { status: 400 });
  if (error instanceof FinalReportConflict) return NextResponse.json({ error: error.message }, { status: 409 });
  return NextResponse.json({ error: 'Backend could not save/load the report. Check database configuration and retry.' }, { status: 503 });
}
export async function GET(req: NextRequest) {
  const notifyUser = req.nextUrl.searchParams.get('notificationsFor');
  if (notifyUser) {
    try { return NextResponse.json({ notifications: await finalReportDbService.notifications(notifyUser) }, { headers: { 'Cache-Control': 'no-store' } }); }
    catch (error) { return failed(error); }
  }
  const firId = req.nextUrl.searchParams.get('firId');
  if (!firId) {
    const station = req.nextUrl.searchParams.get('station') || undefined;
    const district = req.nextUrl.searchParams.get('district') || undefined;
    if (!station && !district) return NextResponse.json({ error: 'FIR ID or station required.' }, { status: 400 });
    try { return NextResponse.json({ items: await finalReportDbService.stationReports(station, district) }, { headers: { 'Cache-Control': 'no-store' } }); }
    catch (error) { return failed(error); }
  }
  try { return NextResponse.json({ reports: await finalReportDbService.list(firId), history: await finalReportDbService.history(firId) }, { headers: { 'Cache-Control': 'no-store' } }); }
  catch (error) { return failed(error); }
}
export async function POST(req: NextRequest) {
  try { return NextResponse.json({ report: await finalReportDbService.save(await req.json()) }); }
  catch (error) { return failed(error); }
}
export async function PATCH(req: NextRequest) {
  try {
    const body = z.object({ action: z.enum(['SEND_TO_SHO', 'SUBMIT_CHI', 'VIEW_SHO', 'APPROVE_SHO', 'REJECT_SHO']).default('SEND_TO_SHO'), reason: z.string().trim().max(10000).optional(), chiNumber: z.string().trim().min(1).max(100).optional(), id: z.string().min(1), firId: z.string().min(1), expectedVersion: z.number().int().positive(), authorId: z.string().min(1) }).parse(await req.json());
    if (body.action === 'VIEW_SHO' || body.action === 'APPROVE_SHO' || body.action === 'REJECT_SHO') return NextResponse.json({ report: await finalReportDbService.review(body.id, body.firId, body.expectedVersion, body.authorId, body.action, body.reason) });
    if (body.action === 'SUBMIT_CHI') {
      if (!body.chiNumber) return NextResponse.json({ error: 'CHI number is required.' }, { status: 400 });
      return NextResponse.json({ report: await finalReportDbService.submitChi(body.id, body.firId, body.expectedVersion, body.authorId, body.chiNumber) });
    }
    return NextResponse.json({ report: await finalReportDbService.sendToSho(body.id, body.firId, body.expectedVersion, body.authorId) });
  } catch (error) { return failed(error); }
}
