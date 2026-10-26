import type { FIRItem } from '@/types';
import { MOCK_ENQUIRY_OFFICERS } from '@/lib/mockData';

export function nextFirNumber(firs:Pick<FIRItem,'firNumber'|'firYear'>[],year:number):string {
  const maximum=firs.filter(f=>f.firYear===year).reduce((max,f)=>{
    const match=/^FIR\/(\d+)\/(\d{4})$/.exec(f.firNumber);
    return match&&Number(match[2])===year?Math.max(max,Number(match[1])):max;
  },0);
  return `FIR/${String(maximum+1).padStart(4,'0')}/${year}`;
}

export function firPendingDays(fir:Pick<FIRItem,'firDate'|'status'|'finalFormDate'>,now=new Date()):number {
  const dateKey=(date:Date)=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(date);
  const terminal=/CHARGESHEET|CLOSED|CLOSURE|CANCELLED|UNTRACED|DISPOSED/.test(fir.status);
  const end=terminal?fir.finalFormDate:dateKey(now);
  if(!end)return 0;
  const days=(Date.parse(end.slice(0,10))-Date.parse(fir.firDate.slice(0,10)))/86400000;
  return Number.isFinite(days)?Math.max(0,Math.floor(days)):0;
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
