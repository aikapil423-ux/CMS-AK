import type { ComplaintReportItem, UserSession } from '@/types';
import { applyFinalReportState } from '@/lib/finalReportFirState';
import { readFirRecords, saveFirRecords, FirRepositoryConflict } from './firRepository';

export async function synchronizeFinalReportFir(report: ComplaintReportItem, user: UserSession) {
  for (let attempt = 0; attempt < 4; attempt++) {
    const fir = (await readFirRecords()).find(f => f.id === report.complaintId);
    if (!fir) throw new Error('FIR master record was not found.');
    const record = applyFinalReportState(fir, report);
    if (record === fir) return;
    try { await saveFirRecords([{record, expectedVersion: fir.persistenceVersion || 0}], user); return; }
    catch (error) { if (!(error instanceof FirRepositoryConflict) || attempt === 3) throw error; }
  }
}
