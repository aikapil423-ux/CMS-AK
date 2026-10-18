export type ProsecutionMainTab = "challan_scrutiny" | "courts";

export type ChallanScrutinySubTab = "scrutiny_perform" | "common_malpractices";

export type CourtsSubTab = "bail_reply" | "status_report" | "other";

export interface ScrutinyChecklist {
  firAndGdCopies: boolean;
  statements180Bnss: boolean;
  sitePlanNaksha: boolean;
  arrestMemoNotice35: boolean;
  mlcPostMortemReport: boolean;
  fslForensicReport: boolean;
  section105AudioVideo: boolean;
  seizureMalkhanaEntry: boolean;
  antecedentRecord: boolean;
  seniorOfficerSupervision: boolean;
}

export interface ScrutinyPerformaRecord {
  id: string;
  scrutinyNumber: string;
  firNumber: string;
  policeStation: string;
  district: string;
  actsAndSections: string;
  complainantName: string;
  accusedNames: string;
  investigationOfficer: string;
  ioRankAndBelt: string;
  submissionDate: string;
  scrutinyDate: string;
  scrutinyOfficer: string;
  decision: "PASSED" | "OBJECTION_RETURNED" | "PENDING_FSL";
  checklist: ScrutinyChecklist;
  objectionsNote?: string;
  courtName: string;
  challanType: "FINAL_CHARGESHEET" | "SUPPLEMENTARY" | "CANCELLATION" | "UNTRACED";
}

export interface MalpracticeDeficiency {
  id: string;
  category: "REGISTRATION" | "INVESTIGATION" | "ARREST" | "EVIDENCE" | "PROCEDURE";
  title: string;
  statutoryRule: string;
  severity: "CRITICAL" | "MAJOR" | "PROCEDURAL";
  description: string;
  courtPrecedentOrRisk: string;
  rectificationMeasure: string;
  isChecked?: boolean;
}

export interface BailReplyRecord {
  id: string;
  applicationNo: string;
  firNumber: string;
  policeStation: string;
  courtName: string;
  applicantAccusedName: string;
  fatherName?: string;
  bailType: "REGULAR" | "ANTICIPATORY" | "INTERIM";
  ipcOrBnsSections: string;
  hearingDate: string;
  status: "DRAFT" | "SUBMITTED" | "GRANTED" | "REJECTED";
  groundsOfOpposition: string[];
  ioCaseSummary: string;
  antecedentsDetails: string;
  submittedByOfficer: string;
  submissionDate: string;
}

export interface CourtStatusReportRecord {
  id: string;
  reportRefNo: string;
  firNumber: string;
  policeStation: string;
  courtName: string;
  caseTitle: string;
  petitionNumber: string;
  investigationStage: "UNDER_INVESTIGATION" | "CHALLAN_PREPARED" | "PENDING_SANCTION" | "UNTRACED";
  keyEvidenceCollected: string;
  accusedStatus: string;
  policePrayer: string;
  hearingDate: string;
  submittedBy: string;
  submissionDate: string;
}

export interface CourtMiscApplicationRecord {
  id: string;
  applicationType:
    | "PRODUCTION_WARRANT"
    | "NON_BAILABLE_WARRANT"
    | "PROCLAMATION_84_BNSS"
    | "POLICE_REMAND"
    | "CASE_DIARY_SUBMISSION"
    | "DISPOSAL_OF_PROPERTY";
  firNumber: string;
  policeStation: string;
  courtName: string;
  targetPersonName: string;
  groundsAndFacts: string;
  hearingDate: string;
  status: "DRAFT" | "FILED" | "ALLOWED" | "REJECTED";
  filingDate: string;
  officerName: string;
}
