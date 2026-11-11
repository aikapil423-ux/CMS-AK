import {
  ScrutinyPerformaRecord,
  MalpracticeDeficiency,
  BailReplyRecord,
  CourtStatusReportRecord,
  CourtMiscApplicationRecord,
} from "@/types/prosecution";
import { firService } from "./firService";

const STORAGE_KEYS = {
  SCRUTINY: "cms_prosecution_scrutiny_v1",
  MALPRACTICES: "cms_prosecution_malpractices_v1",
  BAIL_REPLIES: "cms_prosecution_bail_replies_v1",
  STATUS_REPORTS: "cms_prosecution_status_reports_v1",
  MISC_COURT: "cms_prosecution_misc_court_v1",
};

// Standard statutory malpractices commonly identified in police final forms
const DEFAULT_MALPRACTICES: MalpracticeDeficiency[] = [
  {
    id: "mal-001",
    category: "EVIDENCE",
    title: "Non-compliance of Sec. 105 BNSS (Mandatory Audio-Video Recording)",
    statutoryRule: "Section 105 Bharatiya Nagarik Suraksha Sanhita, 2023",
    severity: "CRITICAL",
    description: "Search or seizure memo prepared without accompanying digital hash, audio-video file, or certificate.",
    courtPrecedentOrRisk: "Exclusion of seized articles during trial; prosecution benefit of doubt goes to accused.",
    rectificationMeasure: "Attach hash value certificate and mobile/body-cam footage log directly to seizure memo.",
    isChecked: false,
  },
  {
    id: "mal-002",
    category: "REGISTRATION",
    title: "Unexplained Delay in Dispatching FIR to Hon'ble Magistrate",
    statutoryRule: "Section 176 BNSS (Earlier Sec. 157 CrPC) & PPR Rule 24.5",
    severity: "CRITICAL",
    description: "FIR dispatched to Ilaga Magistrate beyond statutory timeline without Roznamcha GD justification.",
    courtPrecedentOrRisk: "Grave suspicion of anti-timed FIR and embellishment of facts as per Hon'ble Supreme Court guidelines.",
    rectificationMeasure: "Attach Special Report dispatch GD entry and explanation signed by SHO.",
    isChecked: false,
  },
  {
    id: "mal-003",
    category: "ARREST",
    title: "Failure to issue Notice of Appearance u/s 35(3) BNSS (< 7 Years Offenses)",
    statutoryRule: "Section 35(3) BNSS, 2023 (Arnesh Kumar v. State of Bihar)",
    severity: "MAJOR",
    description: "Accused arrested directly in offences punishable up to 7 years without serving Sec 35(3) notice or recording reasons.",
    courtPrecedentOrRisk: "Departmental scrutiny against IO; automatic grounds for immediate judicial bail to accused.",
    rectificationMeasure: "Annexe copy of served Section 35(3) Notice with acknowledgment or recorded reasons for custodial arrest.",
    isChecked: false,
  },
  {
    id: "mal-004",
    category: "EVIDENCE",
    title: "Delay in Dispatching Seized Parcels to FSL (Exceeding 72 Hours)",
    statutoryRule: "Haryana Police Rules / High Court Rules & Orders Vol. III",
    severity: "MAJOR",
    description: "Narcotics/Ballistics/Viscera parcels lying in Malkhana beyond permissible period without justification.",
    courtPrecedentOrRisk: "Contamination allegation; broken chain of custody defense accepted by trial courts.",
    rectificationMeasure: "Annexe RC (Road Certificate), Malkhana Register No. 19 entry, and courier receipt with timeline audit.",
    isChecked: false,
  },
  {
    id: "mal-005",
    category: "PROCEDURE",
    title: "Confessional Statements Recorded Without Discovery Memo (Sec. 23 BSA)",
    statutoryRule: "Section 23 Bharatiya Sakshya Adhiniyam, 2023 (Sec. 27 Evidence Act)",
    severity: "MAJOR",
    description: "Inadmissible confession recorded in police custody without leading to recovery of weapon or stolen property.",
    courtPrecedentOrRisk: "Wholly inadmissible under law; wastes court time and creates prosecutorial embarrassment.",
    rectificationMeasure: "Prune confessional text; retain only that part which directly led to the discovery of distinct fact/recovery.",
    isChecked: false,
  },
  {
    id: "mal-006",
    category: "INVESTIGATION",
    title: "Missing Scaled Site Plan / Rough Map (नक्शा मौका) Signed by Witnesses",
    statutoryRule: "PPR Rule 25.26 & Sec 193 BNSS",
    severity: "PROCEDURAL",
    description: "Site plan lacks marginal notes, compass direction, or signature of identifier/complainant.",
    courtPrecedentOrRisk: "Difficulty proving point of occurrence during cross-examination of spot witness.",
    rectificationMeasure: "Get scaled site plan prepared by Patwari / draftsman with clear compass directions and landmark distances.",
    isChecked: false,
  },
  {
    id: "mal-007",
    category: "ARREST",
    title: "Incomplete Arrest Memo (Missing Intimation to Nominated Relative)",
    statutoryRule: "Section 36 & 41 BNSS (D.K. Basu v. State of West Bengal)",
    severity: "MAJOR",
    description: "Arrest memo lacks time of intimation or signature/contact number of the relative informed.",
    courtPrecedentOrRisk: "Violation of constitutional safeguard under Article 22(1); bail granted on procedural breach.",
    rectificationMeasure: "Ensure signature, phone number, and relationship of the person informed are clearly recorded.",
    isChecked: false,
  },
  {
    id: "mal-008",
    category: "PROCEDURE",
    title: "Failure to Obtain Statutory Sanction for Prosecution (e.g. Sec. 218 BNSS / Arms Act)",
    statutoryRule: "Section 218 BNSS, 2023 & Section 39 Arms Act, 1959",
    severity: "CRITICAL",
    description: "Chargesheet presented without DM / State Government Sanction Order on record.",
    courtPrecedentOrRisk: "Trial court cannot take cognizance; challan rejected as non-maintainable ab-initio.",
    rectificationMeasure: "Procure District Magistrate sanction order before submitting final report to prosecution branch.",
    isChecked: false,
  },
];





function officerStorageKey(key: string) {
  const officerId = localStorage.getItem("haryana_police_cms_user");
  if (!officerId) throw new Error("Sign in to access prosecution records.");
  return key + ":" + officerId;
}

export const ProsecutionService = {
  // 1. SCRUTINY PERFORMA
  getScrutinyRecords: async (): Promise<ScrutinyPerformaRecord[]> => {
    if (typeof window === "undefined") return [];
    const response = await fetch('/api/prosecution/scrutiny', {credentials:'same-origin',cache:'no-store'});
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Could not load backend scrutiny records.');
    const backend: ScrutinyPerformaRecord[] = result.records || [];
    try {
      const data = localStorage.getItem(officerStorageKey(STORAGE_KEYS.SCRUTINY));
      if (data) return [...backend,...JSON.parse(data).filter((r:ScrutinyPerformaRecord)=>!backend.some(b=>b.id===r.id))];
      return backend;
    } catch {
      return backend;
    }
  },

  saveScrutinyRecord: async (record: ScrutinyPerformaRecord): Promise<void> => {
    if (typeof window === "undefined") return;
    try {
      const existing = await ProsecutionService.getScrutinyRecords();
      const updated = [record, ...existing.filter((r) => r.id !== record.id)];
      localStorage.setItem(officerStorageKey(STORAGE_KEYS.SCRUTINY), JSON.stringify(updated));
    } catch (e) {
      throw new Error("Could not save scrutiny record. Check browser storage and retry.");
      throw new Error('Scrutiny record could not be saved. Check browser storage and retry.');
    }
  },

  deleteScrutinyRecord: async (id: string): Promise<void> => {
    if (typeof window === "undefined") return;
    if (id.startsWith('SCRPDF-')) {
      const response=await fetch('/api/prosecution/scrutiny?id='+encodeURIComponent(id),{method:'DELETE',credentials:'same-origin'});
      if(!response.ok)throw new Error('Could not delete backend scrutiny record.');
      return;
    }
    try {
      const existing = await ProsecutionService.getScrutinyRecords();
      const updated = existing.filter((r) => r.id !== id);
      localStorage.setItem(officerStorageKey(STORAGE_KEYS.SCRUTINY), JSON.stringify(updated));
    } catch (e) {
      throw new Error("Could not delete scrutiny record. Check browser storage and retry.");
    }
  },

  // 2. COMMON MALPRACTICES
  getMalpractices: async (): Promise<MalpracticeDeficiency[]> => {
    if (typeof window === "undefined") return DEFAULT_MALPRACTICES;
    try {
      const data = localStorage.getItem(officerStorageKey(STORAGE_KEYS.MALPRACTICES));
      if (data) return JSON.parse(data);
      localStorage.setItem(officerStorageKey(STORAGE_KEYS.MALPRACTICES), JSON.stringify(DEFAULT_MALPRACTICES));
      return DEFAULT_MALPRACTICES;
    } catch {
      return DEFAULT_MALPRACTICES;
    }
  },

  toggleMalpracticeCheck: async (id: string): Promise<MalpracticeDeficiency[]> => {
    if (typeof window === "undefined") return DEFAULT_MALPRACTICES;
    try {
      const list = await ProsecutionService.getMalpractices();
      const updated = list.map((item) => (item.id === id ? { ...item, isChecked: !item.isChecked } : item));
      localStorage.setItem(officerStorageKey(STORAGE_KEYS.MALPRACTICES), JSON.stringify(updated));
      return updated;
    } catch {
      return DEFAULT_MALPRACTICES;
    }
  },

  resetMalpractices: async (): Promise<MalpracticeDeficiency[]> => {
    if (typeof window === "undefined") return DEFAULT_MALPRACTICES;
    try {
      localStorage.setItem(officerStorageKey(STORAGE_KEYS.MALPRACTICES), JSON.stringify(DEFAULT_MALPRACTICES));
      return DEFAULT_MALPRACTICES;
    } catch {
      return DEFAULT_MALPRACTICES;
    }
  },

  // 3. BAIL REPLIES
  getBailReplies: async (): Promise<BailReplyRecord[]> => {
    if (typeof window === "undefined") return [];
    try {
      const data = localStorage.getItem(officerStorageKey(STORAGE_KEYS.BAIL_REPLIES));
      if (data) return JSON.parse(data);
      return [];
    } catch {
      return [];
    }
  },

  saveBailReply: async (reply: BailReplyRecord): Promise<void> => {
    if (typeof window === "undefined") return;
    try {
      const existing = await ProsecutionService.getBailReplies();
      const updated = [reply, ...existing.filter((r) => r.id !== reply.id)];
      localStorage.setItem(officerStorageKey(STORAGE_KEYS.BAIL_REPLIES), JSON.stringify(updated));
    } catch (e) {
      throw new Error("Could not save bail reply. Check browser storage and retry.");
    }
  },

  deleteBailReply: async (id: string): Promise<void> => {
    if (typeof window === "undefined") return;
    try {
      const existing = await ProsecutionService.getBailReplies();
      const updated = existing.filter((r) => r.id !== id);
      localStorage.setItem(officerStorageKey(STORAGE_KEYS.BAIL_REPLIES), JSON.stringify(updated));
    } catch (e) {
      throw new Error("Could not delete bail reply. Check browser storage and retry.");
    }
  },

  // 4. STATUS REPORTS
  getStatusReports: async (): Promise<CourtStatusReportRecord[]> => {
    if (typeof window === "undefined") return [];
    try {
      const data = localStorage.getItem(officerStorageKey(STORAGE_KEYS.STATUS_REPORTS));
      if (data) return JSON.parse(data);
      return [];
    } catch {
      return [];
    }
  },

  saveStatusReport: async (report: CourtStatusReportRecord): Promise<void> => {
    if (typeof window === "undefined") return;
    try {
      const existing = await ProsecutionService.getStatusReports();
      const updated = [report, ...existing.filter((r) => r.id !== report.id)];
      localStorage.setItem(officerStorageKey(STORAGE_KEYS.STATUS_REPORTS), JSON.stringify(updated));
    } catch (e) {
      throw new Error("Could not save status report. Check browser storage and retry.");
    }
  },

  deleteStatusReport: async (id: string): Promise<void> => {
    if (typeof window === "undefined") return;
    try {
      const existing = await ProsecutionService.getStatusReports();
      const updated = existing.filter((r) => r.id !== id);
      localStorage.setItem(officerStorageKey(STORAGE_KEYS.STATUS_REPORTS), JSON.stringify(updated));
    } catch (e) {
      throw new Error("Could not delete status report. Check browser storage and retry.");
    }
  },

  // 5. MISC COURT APPLICATIONS
  getMiscApplications: async (): Promise<CourtMiscApplicationRecord[]> => {
    if (typeof window === "undefined") return [];
    try {
      const data = localStorage.getItem(officerStorageKey(STORAGE_KEYS.MISC_COURT));
      if (data) return JSON.parse(data);
      return [];
    } catch {
      return [];
    }
  },

  saveMiscApplication: async (app: CourtMiscApplicationRecord): Promise<void> => {
    if (typeof window === "undefined") return;
    try {
      const existing = await ProsecutionService.getMiscApplications();
      const updated = [app, ...existing.filter((r) => r.id !== app.id)];
      localStorage.setItem(officerStorageKey(STORAGE_KEYS.MISC_COURT), JSON.stringify(updated));
    } catch (e) {
      throw new Error("Could not save misc court application. Check browser storage and retry.");
    }
  },

  deleteMiscApplication: async (id: string): Promise<void> => {
    if (typeof window === "undefined") return;
    try {
      const existing = await ProsecutionService.getMiscApplications();
      const updated = existing.filter((r) => r.id !== id);
      localStorage.setItem(officerStorageKey(STORAGE_KEYS.MISC_COURT), JSON.stringify(updated));
    } catch (e) {
      throw new Error("Could not delete misc court application. Check browser storage and retry.");
    }
  },

  // Helper to get all FIR options for dropdowns
  getAvailableFirs: () => {
    return firService.getAllFirs().map((f) => ({
      id: f.id,
      district: f.district,
      firNumber: f.firNumber,
      policeStation: f.policeStation,
      actsAndSections: f.actsAndSections || "BNS",
      complainantName: f.complainantName || "State",
      accusedNames: f.accusedList?.map((a) => a.name).join(", ") || "Unknown",
      ioName: f.actionTakenData?.investigationOfficerName || f.assignedIoName || "IO",
      ioRank: f.actionTakenData?.investigationOfficerRank || f.assignedIoRank || "SI",
    }));
  },
};
