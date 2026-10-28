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

const INITIAL_SCRUTINY_RECORDS: ScrutinyPerformaRecord[] = [
  {
    id: "SCR-2026-0041",
    scrutinyNumber: "SCR/2026/0041",
    firNumber: "FIR/0004/2026",
    policeStation: "PS City Panipat",
    district: "Panipat",
    actsAndSections: "Sec 304, 3(5) BNS (Snatching)",
    complainantName: "Vikas Kumar R/o Model Town",
    accusedNames: "Amit @ Mita, Rahul",
    investigationOfficer: "SI Sandeep Singh",
    ioRankAndBelt: "Sub-Inspector, 412/PNP",
    submissionDate: "15/10/2026",
    scrutinyDate: "16/10/2026",
    scrutinyOfficer: "Sh. D.S. Yadav, Ld. Deputy ADA",
    decision: "PASSED",
    courtName: "Court of Ld. Chief Judicial Magistrate, Panipat",
    challanType: "FINAL_CHARGESHEET",
    checklist: {
      firAndGdCopies: true,
      statements180Bnss: true,
      sitePlanNaksha: true,
      arrestMemoNotice35: true,
      mlcPostMortemReport: true,
      fslForensicReport: true,
      section105AudioVideo: true,
      seizureMalkhanaEntry: true,
      antecedentRecord: true,
      seniorOfficerSupervision: true,
    },
    objectionsNote: "All statutory documents in order. Recovery of snatched mobile verified with IMEI and seizure memo. Fit for court submission.",
  },
  {
    id: "SCR-2026-0038",
    scrutinyNumber: "SCR/2026/0038",
    firNumber: "FIR/0003/2026",
    policeStation: "PS Model Town Panipat",
    district: "Panipat",
    actsAndSections: "Sec 103(1), 3(5) BNS (Murder)",
    complainantName: "Mohit Verma R/o Sec 12",
    accusedNames: "Rohit @ Kalu",
    investigationOfficer: "Insp. Rakesh Sharma",
    ioRankAndBelt: "Inspector (SHO)",
    submissionDate: "16/10/2026",
    scrutinyDate: "17/10/2026",
    scrutinyOfficer: "Sh. Rajesh Bishnoi, Ld. Assistant ADA",
    decision: "OBJECTION_RETURNED",
    courtName: "Court of Ld. Sessions Judge, Panipat",
    challanType: "FINAL_CHARGESHEET",
    checklist: {
      firAndGdCopies: true,
      statements180Bnss: true,
      sitePlanNaksha: true,
      arrestMemoNotice35: true,
      mlcPostMortemReport: true,
      fslForensicReport: false,
      section105AudioVideo: true,
      seizureMalkhanaEntry: true,
      antecedentRecord: false,
      seniorOfficerSupervision: true,
    },
    objectionsNote: "1. FSL Madhuban chemical report regarding weapon of offence (Iron Rod) is pending. 2. Verification of previous criminal antecedent list not annexed.",
  },
];

const INITIAL_BAIL_REPLIES: BailReplyRecord[] = [
  {
    id: "BAIL-2026-0012",
    applicationNo: "BA/142/2026",
    firNumber: "FIR/0003/2026",
    policeStation: "PS Model Town Panipat",
    courtName: "Court of Ld. Additional Sessions Judge-I, Panipat",
    applicantAccusedName: "Rohit @ Kalu S/o Mahesh",
    fatherName: "Sh. Mahesh Kumar",
    bailType: "REGULAR",
    ipcOrBnsSections: "Sec 103(1), 3(5) BNS (Murder)",
    hearingDate: "20/10/2026",
    status: "SUBMITTED",
    groundsOfOpposition: [
      "Grave and heinous nature of crime punishable with life imprisonment or capital penalty",
      "Weapon of offence (Iron Rod) recovered directly at the instance of accused",
      "Eyewitnesses belong to same locality; high probability of threat or tampering with witnesses",
      "FSL Madhuban report awaited; investigation in critical stage",
    ],
    ioCaseSummary: "Accused hit the deceased Sunil Kumar on the head with lethal force during a road scuffle resulting in fatal skull fracture. Eye-witness testimony firmly establishes prima-facie guilt.",
    antecedentsDetails: "Accused is previously involved in FIR No. 112/2024 u/s 323, 341 IPC at PS Sadar Panipat.",
    submittedByOfficer: "Insp. Rakesh Sharma, SHO",
    submissionDate: "17/10/2026",
  },
  {
    id: "BAIL-2026-0009",
    applicationNo: "ABA/89/2026",
    firNumber: "FIR/0004/2026",
    policeStation: "PS City Panipat",
    courtName: "Court of Ld. Sessions Judge, Panipat",
    applicantAccusedName: "Rahul S/o Naresh",
    fatherName: "Sh. Naresh Kumar",
    bailType: "ANTICIPATORY",
    ipcOrBnsSections: "Sec 304, 3(5) BNS (Snatching)",
    hearingDate: "19/10/2026",
    status: "SUBMITTED",
    groundsOfOpposition: [
      "Custodial interrogation is strictly required to unearth inter-district snatching syndicate",
      "Recovery of motorcycle used in commission of crime is still pending",
      "Accused has been evading arrest and not cooperating with IO",
    ],
    ioCaseSummary: "Applicant was rider of motorcycle who snatched complainant mobile phone at high speed near Red Light Chowk Panipat.",
    antecedentsDetails: "No other FIR verified yet.",
    submittedByOfficer: "SI Sandeep Singh, IO",
    submissionDate: "16/10/2026",
  },
];

const INITIAL_STATUS_REPORTS: CourtStatusReportRecord[] = [
  {
    id: "SR-2026-0005",
    reportRefNo: "SR/HC/2026/005",
    firNumber: "FIR/0002/2026",
    policeStation: "PS Chandni Bagh Panipat",
    courtName: "Hon'ble High Court of Punjab & Haryana, Chandigarh",
    caseTitle: "Mukesh @ Billa v. State of Haryana",
    petitionNumber: "CRM-M-48921-2026",
    investigationStage: "UNDER_INVESTIGATION",
    keyEvidenceCollected: "110 Grams smack recovered from polythene packet during naka. Weighment memo, sampling in presence of Gazetted Officer (DSP) completed under Sec 50 NDPS Act.",
    accusedStatus: "Accused in judicial custody at District Jail Panipat since 15/10/2026.",
    policePrayer: "Humble prayer to dismiss the petition as commercial narcotics trafficking involves serious socio-economic peril.",
    hearingDate: "22/10/2026",
    submittedBy: "Sh. Suresh Kumar, DSP Headquarter Panipat",
    submissionDate: "17/10/2026",
  },
];

const INITIAL_MISC_COURT: CourtMiscApplicationRecord[] = [
  {
    id: "MCA-2026-0021",
    applicationType: "PRODUCTION_WARRANT",
    firNumber: "FIR/0003/2026",
    policeStation: "PS Model Town Panipat",
    courtName: "Court of Ld. CJM, Panipat",
    targetPersonName: "Rohit @ Kalu S/o Mahesh (District Jail Panipat)",
    groundsAndFacts: "Accused is currently lodged in judicial custody. Physical production required before court for voice sample collection / test identification proceedings.",
    hearingDate: "21/10/2026",
    status: "FILED",
    filingDate: "17/10/2026",
    officerName: "Insp. Rakesh Sharma",
  },
  {
    id: "MCA-2026-0019",
    applicationType: "PROCLAMATION_84_BNSS",
    firNumber: "FIR/0004/2026",
    policeStation: "PS City Panipat",
    courtName: "Court of Ld. JMIC, Panipat",
    targetPersonName: "Sanjay @ Sanju S/o Ramesh (Absconding Co-accused)",
    groundsAndFacts: "Non-Bailable Warrants repeatedly returned unexecuted. Accused has concealed himself to avoid execution of process.",
    hearingDate: "25/10/2026",
    status: "FILED",
    filingDate: "16/10/2026",
    officerName: "SI Sandeep Singh",
  },
];

export const ProsecutionService = {
  // 1. SCRUTINY PERFORMA
  getScrutinyRecords: async (): Promise<ScrutinyPerformaRecord[]> => {
    if (typeof window === "undefined") return INITIAL_SCRUTINY_RECORDS;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SCRUTINY);
      if (data) return JSON.parse(data);
      localStorage.setItem(STORAGE_KEYS.SCRUTINY, JSON.stringify(INITIAL_SCRUTINY_RECORDS));
      return INITIAL_SCRUTINY_RECORDS;
    } catch {
      return INITIAL_SCRUTINY_RECORDS;
    }
  },

  saveScrutinyRecord: async (record: ScrutinyPerformaRecord): Promise<void> => {
    if (typeof window === "undefined") return;
    try {
      const existing = await ProsecutionService.getScrutinyRecords();
      const updated = [record, ...existing.filter((r) => r.id !== record.id)];
      localStorage.setItem(STORAGE_KEYS.SCRUTINY, JSON.stringify(updated));
    } catch (e) {
      throw new Error("Could not save scrutiny record. Check browser storage and retry.");
      throw new Error('Scrutiny record could not be saved. Check browser storage and retry.');
    }
  },

  deleteScrutinyRecord: async (id: string): Promise<void> => {
    if (typeof window === "undefined") return;
    try {
      const existing = await ProsecutionService.getScrutinyRecords();
      const updated = existing.filter((r) => r.id !== id);
      localStorage.setItem(STORAGE_KEYS.SCRUTINY, JSON.stringify(updated));
    } catch (e) {
      throw new Error("Could not delete scrutiny record. Check browser storage and retry.");
    }
  },

  // 2. COMMON MALPRACTICES
  getMalpractices: async (): Promise<MalpracticeDeficiency[]> => {
    if (typeof window === "undefined") return DEFAULT_MALPRACTICES;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MALPRACTICES);
      if (data) return JSON.parse(data);
      localStorage.setItem(STORAGE_KEYS.MALPRACTICES, JSON.stringify(DEFAULT_MALPRACTICES));
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
      localStorage.setItem(STORAGE_KEYS.MALPRACTICES, JSON.stringify(updated));
      return updated;
    } catch {
      return DEFAULT_MALPRACTICES;
    }
  },

  resetMalpractices: async (): Promise<MalpracticeDeficiency[]> => {
    if (typeof window === "undefined") return DEFAULT_MALPRACTICES;
    try {
      localStorage.setItem(STORAGE_KEYS.MALPRACTICES, JSON.stringify(DEFAULT_MALPRACTICES));
      return DEFAULT_MALPRACTICES;
    } catch {
      return DEFAULT_MALPRACTICES;
    }
  },

  // 3. BAIL REPLIES
  getBailReplies: async (): Promise<BailReplyRecord[]> => {
    if (typeof window === "undefined") return INITIAL_BAIL_REPLIES;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.BAIL_REPLIES);
      if (data) return JSON.parse(data);
      localStorage.setItem(STORAGE_KEYS.BAIL_REPLIES, JSON.stringify(INITIAL_BAIL_REPLIES));
      return INITIAL_BAIL_REPLIES;
    } catch {
      return INITIAL_BAIL_REPLIES;
    }
  },

  saveBailReply: async (reply: BailReplyRecord): Promise<void> => {
    if (typeof window === "undefined") return;
    try {
      const existing = await ProsecutionService.getBailReplies();
      const updated = [reply, ...existing.filter((r) => r.id !== reply.id)];
      localStorage.setItem(STORAGE_KEYS.BAIL_REPLIES, JSON.stringify(updated));
    } catch (e) {
      throw new Error("Could not save bail reply. Check browser storage and retry.");
    }
  },

  deleteBailReply: async (id: string): Promise<void> => {
    if (typeof window === "undefined") return;
    try {
      const existing = await ProsecutionService.getBailReplies();
      const updated = existing.filter((r) => r.id !== id);
      localStorage.setItem(STORAGE_KEYS.BAIL_REPLIES, JSON.stringify(updated));
    } catch (e) {
      throw new Error("Could not delete bail reply. Check browser storage and retry.");
    }
  },

  // 4. STATUS REPORTS
  getStatusReports: async (): Promise<CourtStatusReportRecord[]> => {
    if (typeof window === "undefined") return INITIAL_STATUS_REPORTS;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STATUS_REPORTS);
      if (data) return JSON.parse(data);
      localStorage.setItem(STORAGE_KEYS.STATUS_REPORTS, JSON.stringify(INITIAL_STATUS_REPORTS));
      return INITIAL_STATUS_REPORTS;
    } catch {
      return INITIAL_STATUS_REPORTS;
    }
  },

  saveStatusReport: async (report: CourtStatusReportRecord): Promise<void> => {
    if (typeof window === "undefined") return;
    try {
      const existing = await ProsecutionService.getStatusReports();
      const updated = [report, ...existing.filter((r) => r.id !== report.id)];
      localStorage.setItem(STORAGE_KEYS.STATUS_REPORTS, JSON.stringify(updated));
    } catch (e) {
      throw new Error("Could not save status report. Check browser storage and retry.");
    }
  },

  deleteStatusReport: async (id: string): Promise<void> => {
    if (typeof window === "undefined") return;
    try {
      const existing = await ProsecutionService.getStatusReports();
      const updated = existing.filter((r) => r.id !== id);
      localStorage.setItem(STORAGE_KEYS.STATUS_REPORTS, JSON.stringify(updated));
    } catch (e) {
      throw new Error("Could not delete status report. Check browser storage and retry.");
    }
  },

  // 5. MISC COURT APPLICATIONS
  getMiscApplications: async (): Promise<CourtMiscApplicationRecord[]> => {
    if (typeof window === "undefined") return INITIAL_MISC_COURT;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MISC_COURT);
      if (data) return JSON.parse(data);
      localStorage.setItem(STORAGE_KEYS.MISC_COURT, JSON.stringify(INITIAL_MISC_COURT));
      return INITIAL_MISC_COURT;
    } catch {
      return INITIAL_MISC_COURT;
    }
  },

  saveMiscApplication: async (app: CourtMiscApplicationRecord): Promise<void> => {
    if (typeof window === "undefined") return;
    try {
      const existing = await ProsecutionService.getMiscApplications();
      const updated = [app, ...existing.filter((r) => r.id !== app.id)];
      localStorage.setItem(STORAGE_KEYS.MISC_COURT, JSON.stringify(updated));
    } catch (e) {
      throw new Error("Could not save misc court application. Check browser storage and retry.");
    }
  },

  deleteMiscApplication: async (id: string): Promise<void> => {
    if (typeof window === "undefined") return;
    try {
      const existing = await ProsecutionService.getMiscApplications();
      const updated = existing.filter((r) => r.id !== id);
      localStorage.setItem(STORAGE_KEYS.MISC_COURT, JSON.stringify(updated));
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
