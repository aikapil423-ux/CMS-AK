// Comprehensive Data Models for Haryana Police Roznamcha GD (General Diary - Register No. II)
// Under Punjab Police Rules (PPR) 1934 / Rule 22.48 & BNSS 2023

export type GDStatus = "DRAFT" | "SUGGESTED" | "VERIFIED" | "LOCKED";

export type GDSource =
  | "MANUAL_ENTRY"
  | "SYSTEM_EVENT"
  | "COMPLAINT_INTEGRATION"
  | "FIR_INTEGRATION"
  | "PATROL_DISPATCH"
  | "MALKHANA"
  | "DUTY_ROSTER"
  | "COURT_PRODUCTION";

export type GDEntryCategory =
  | "ROUTINE_ADMINISTRATION"
  | "DUTY_MOVEMENT"
  | "INVESTIGATION_PROCESS"
  | "LAW_AND_ORDER"
  | "PROPERTY_MALKHANA"
  | "COURT_DOCUMENTATION"
  | "MISCELLANEOUS";

export interface GDOfficerParticulars {
  name: string;
  rank: string;
  pno: string;
  beltNumber: string;
  phone?: string;
  role?: string;
}

export interface GDUploadedDocument {
  id: string;
  name: string;
  size: number;
  type: string;
  dataUrl?: string;
  uploadedAt: string;
}

export interface GDRelatedRecords {
  complaintNumber?: string;
  firNumber?: string;
  caseNumber?: string;
  vehicleNumber?: string;
  personName?: string;
  propertyOrMalkhanaNo?: string;
  fslParcelNo?: string;
  courtName?: string;
  destinationLocation?: string;
  teamMembers?: string[];
  weaponsIssued?: string;
  purpose?: string;
  linkedDepartureGdNumber?: string;
  departureTime?: string;
  attachments?: GDUploadedDocument[];
}

export interface GDAuditLog {
  action: "CREATED" | "SUGGESTED" | "EDITED" | "REVIEWED" | "VERIFIED" | "LOCKED";
  performedBy: string;
  performedByPno: string;
  performedByRank: string;
  timestamp: string; // ISO server timestamp
  auditId: string;
  remarks?: string;
}

export interface GeneralDiaryRecord {
  id: string;
  gdNumber: string; // e.g. GD-2026-10-05-001 (Sequential & Immutable once locked)
  sequencePerDay: number; // Daily entry sequence number
  policeStation: string;
  policePost?: string;
  district: string;

  // Officers
  entryForOfficer: GDOfficerParticulars; // Officer regarding whom the entry is made
  actualAuthor: GDOfficerParticulars; // Officer physically typing/recording (MHC/DO)

  // Classification & Content
  typeCode: string; // e.g. "RAVANGI", "AAGAZ", "FIR_REGISTRATION"
  category: GDEntryCategory;
  typeDisplay: string;
  typeDisplayHi: string;
  subject: string; // विषय
  narrative: string; // विवरण (हिंदी / English / Mixed)

  // Separate Timestamps (Crucial requirement #2)
  activityDateTime: string; // User-entered activity time (e.g. 2026-10-05 14:30)
  officialCreationTimestamp: string; // Server-generated creation ISO timestamp
  verificationTimestamp?: string; // Server-generated verification ISO timestamp

  // Status & Integrity
  status: GDStatus; // "DRAFT" | "SUGGESTED" | "VERIFIED" | "LOCKED"
  source: GDSource;
  isLocked: boolean; // Once true, can NEVER be changed or deleted
  verificationAuditId?: string; // Cryptographic hash / audit ID for seniors
  verifiedBy?: GDOfficerParticulars;

  // Linked records
  relatedRecords?: GDRelatedRecords;
  attachments?: GDUploadedDocument[];

  // Audit trail
  auditTrail: GDAuditLog[];

  // Internal server sort keys (never rendered in UI)
  _sortGdDate?: string;  // yyyy-mm-dd of the GD day (immutable numbering day)
  _sortEntryMs?: number; // server entryDateTime epoch ms
}

export interface GDTemplateVariable {
  key: string;
  labelHi: string;
  labelEn: string;
  type: "text" | "officer" | "vehicle" | "time" | "date" | "number" | "select";
  options?: string[];
  required: boolean;
  defaultValue?: string;
  autoFillSource?: "currentUser" | "selectedOfficer" | "nowTime" | "todayDate" | "station";
}

export interface GDTemplate {
  id: string;
  typeCode: string;
  title: string;
  titleHi: string;
  language: "hi" | "en" | "mixed";
  subjectTemplate: string;
  bodyTemplate: string;
  variables: GDTemplateVariable[];
  isDefault?: boolean;
  isUserSaved?: boolean;
}

export interface GDEntryTypeConfig {
  code: string;
  category: GDEntryCategory;
  nameEn: string;
  nameHi: string;
  description: string;
  isCustom?: boolean;
  isEnabled: boolean;
  usedCount: number;
  requiresOfficer: boolean;
  requiresVehicle?: boolean;
  requiresCaseReference?: boolean;
  defaultTemplates: GDTemplate[];
}

export interface GDSearchFilter {
  gdNumber?: string;
  startDate?: string;
  endDate?: string;
  officerQuery?: string;
  officerName?: string;
  personName?: string;
  firNumber?: string;
  complaintNumber?: string;
  vehicleNumber?: string;
  typeCode?: string;
  status?: GDStatus | "ALL" | "SUGGESTED,DRAFT";
  isLocked?: boolean;
  keyword?: string;
  page?: number;
  pageSize?: number;
}

export interface GDPaginatedResponse {
  records: GeneralDiaryRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  todayCount: number;
  lockedCount: number;
  verifiedCount: number;
  draftCount: number;
  suggestedCount: number;
}
