import type { FIRItem } from '@/types';
import { MOCK_ENQUIRY_OFFICERS } from '@/lib/mockData';

export function nextFirNumber(
  firs: Pick<FIRItem, 'firNumber' | 'firYear' | 'policeStation'>[],
  year: number,
  policeStation?: string
): string {
  const normPs = (ps?: string) => (ps || '').trim().toLowerCase();
  const targetPs = normPs(policeStation);

  const filtered = firs.filter((f) => {
    if (f.firYear !== year) return false;
    if (targetPs) {
      return normPs(f.policeStation) === targetPs;
    }
    return true;
  });

  const maximum = filtered.reduce((max, f) => {
    const match = /^FIR\/(\d+)\/(\d{4})$/.exec(f.firNumber);
    return match && Number(match[2]) === year ? Math.max(max, Number(match[1])) : max;
  }, 0);

  return `FIR/${String(maximum + 1).padStart(4, '0')}/${year}`;
}

export function firPendingDays(fir:Pick<FIRItem,'firDate'|'status'|'finalFormDate'>,now=new Date()):number {
  const dateKey=(date:Date)=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(date);
  const terminal=/CHARGESHEET|CLOSED|CLOSURE|CANCELLED|UNTRACED|DISPOSED/.test(fir.status);
  const end=terminal?fir.finalFormDate:dateKey(now);
  if(!end)return 0;
  const days=(Date.parse(end.slice(0,10))-Date.parse(fir.firDate.slice(0,10)))/86400000;
  return Number.isFinite(days)?Math.max(0,Math.floor(days)):0;
}

export function isFirVisibleToUser(
  user?: { id?: string; pno?: string; name?: string; role?: string; stationName?: string } | null,
  fir?: Pick<FIRItem, 'assignedIoId' | 'assignedIoName' | 'policeStation'> | null
): boolean {
  if (!user || !fir) return false;

  const role = user.role || '';
  const isSuperior =
    role === "DSP_SUBDIV" ||
    role === "SP_DISTRICT" ||
    role === "ASP_HQ" ||
    role === "SUPER_ADMIN";

  // Superior district officers (SP, ASP, DSP, Super Admin) see all FIRs across all stations in the district
  if (isSuperior) {
    return true;
  }

  // Station-level personnel: SHO, MHC, Duty Officer
  const isStationStaff =
    role === "SHO" ||
    role === "MHC_GD_INCHARGE" ||
    role === "DUTY_OFFICER" ||
    user.id === "usr_sho_1" ||
    user.id === "usr_mhc_1";

  if (isStationStaff) {
    // If user has a police station assigned, only show FIRs of their station
    if (user.stationName && fir.policeStation) {
      const norm = (s: string) => s.trim().toLowerCase();
      return norm(user.stationName) === norm(fir.policeStation);
    }
    return true;
  }

  // Investigating Officer (IO / EO): only see FIRs assigned to them in their station
  return isUserAssignedIo(user, fir);
}

export function isUserAssignedIo(
  user?: { id?: string; pno?: string; name?: string; role?: string } | null,
  fir?: Pick<FIRItem, 'assignedIoId' | 'assignedIoName'> | null
): boolean {
  if (!user || !fir) return false;
  if (!fir.assignedIoId && !fir.assignedIoName) return false;

  // 1. Direct ID / PNO match
  if (fir.assignedIoId && (fir.assignedIoId === user.id || fir.assignedIoId === user.pno)) {
    return true;
  }

  // 2. Cross-reference MOCK_ENQUIRY_OFFICERS (e.g. usr_eo_1 <=> eo_1, eo-001, etc.)
  const matchedOfficer = MOCK_ENQUIRY_OFFICERS.find((eo) => {
    if (user.id && (eo.id === user.id || `usr_${eo.id}` === user.id || eo.id === user.id.replace(/^usr_/, ""))) {
      return true;
    }
    if (user.pno && eo.pno && eo.pno === user.pno) {
      return true;
    }
    return false;
  });

  if (matchedOfficer) {
    if (
      fir.assignedIoId &&
      (fir.assignedIoId === matchedOfficer.id ||
        fir.assignedIoId === `usr_${matchedOfficer.id}` ||
        fir.assignedIoId.replace(/^eo-?0*/, "") === matchedOfficer.id.replace(/^eo_?0*/, ""))
    ) {
      return true;
    }
  }

  // 3. Name normalization comparison (strips titles/ranks: Sub-Inspector, SI, ASI, HC, Inspector, etc.)
  if (fir.assignedIoName && user.name) {
    const normalize = (s: string) =>
      s
        .toLowerCase()
        .replace(/\b(sho|inspector|sub-inspector|sub inspector|si|asi|hc|head constable|constable|dsp|sp)\b/gi, "")
        .replace(/[^a-z0-9]/g, "")
        .trim();

    const firIo = normalize(fir.assignedIoName);
    const uName = normalize(user.name);

    if (firIo && uName && (firIo === uName || firIo.includes(uName) || uName.includes(firIo))) {
      return true;
    }
  }

  return false;
}


import type { FIRTrackingState, ChallanMode, ChallanType } from '@/types';

/**
 * Resolves the authoritative tracking state of an FIR.
 * If trackingState is already set explicitly, returns it.
 * Otherwise, maps existing historical status cleanly:
 * - Direct closure/cancelled/untraced -> COMPLETED
 * - Chargesheet filed without ongoing reopen/partial -> COMPLETED
 * - Default -> PART_A_FRESH
 */
export function getAuthoritativeTrackingState(fir: Pick<FIRItem, 'trackingState' | 'status' | 'finalFormType' | 'reopenHistory' | 'challanRecords'>): FIRTrackingState {
  if (fir.trackingState) {
    return fir.trackingState;
  }

  const status = (fir.status || '').toUpperCase();
  const formType = (fir.finalFormType || '').toUpperCase();

  // If closed / cancelled / untraced -> COMPLETED
  if (
    status === 'CLOSURE_REPORT_FILED' ||
    status === 'UNTRACED' ||
    status === 'CANCELLED' ||
    status === 'QUASHED_BY_COURT' ||
    formType === 'CLOSURE' ||
    formType === 'UNTRACED' ||
    formType === 'CANCELLED'
  ) {
    return 'COMPLETED';
  }

  // If chargesheet filed in legacy data -> COMPLETED
  if (status === 'CHARGESHEET_FILED' || formType === 'CHARGESHEET') {
    return 'COMPLETED';
  }

  return 'PART_A_FRESH';
}
