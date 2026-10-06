export type SystemRole =
  | 'SUPER_ADMIN'
  | 'SP_DISTRICT'
  | 'DSP_SUBDIV'
  | 'SHO'
  | 'MHC_GD_INCHARGE'
  | 'DUTY_OFFICER'
  | 'ENQUIRY_OFFICER'
  | 'READER_TO_SHO'
  | 'VIEWER_AUDITOR';

export type PoliceRank =
  | 'CONSTABLE'
  | 'HEAD_CONSTABLE'
  | 'ASSISTANT_SUB_INSPECTOR'
  | 'SUB_INSPECTOR'
  | 'INSPECTOR'
  | 'DEPUTY_SP'
  | 'ADDITIONAL_SP'
  | 'SUPERINTENDENT_OF_POLICE'
  | 'INSPECTOR_GENERAL'
  | 'ADGP'
  | 'DGP';

export interface UserSession {
  id: string;
  pno: string;
  name: string;
  rank: PoliceRank;
  rankDisplay: string;
  role: SystemRole;
  roleDisplay: string;
  stationName: string;
  stationCode: string;
  district: string;
  avatarUrl?: string;
}

export type ComplaintPriority = 'ROUTINE' | 'URGENT' | 'CRITICAL_SENSITIVE' | 'CM_WINDOW_VIP';

export type ComplaintStatus =
  | 'REGISTERED'
  | 'ASSIGNED_TO_EO'
  | 'ENQUIRY_IN_PROGRESS'
  | 'INTERIM_REPORT_SUBMITTED'
  | 'REPORT_SUBMITTED'
  | 'PENDING_SHO_REVIEW'
  | 'RECOMMENDED_FOR_FIR'
  | 'DISPOSED_MUTUAL_ACCORD'
  | 'DISPOSED_CIVIL_NATURE'
  | 'DISPOSED_UNSUBSTANTIATED'
  | 'TRANSFERRED_OTHER_PS';

export type ComplaintSource =
  | 'WALK_IN_STATION'
  | 'CM_WINDOW_HARYANA'
  | 'CITIZEN_PORTAL_HARPATH'
  | 'EMERGENCY_112'
  | 'SP_OFFICE_REFERENCE'
  | 'POSTAL_APPLICATION';

export type ComplaintCategory =
  | 'CYBER_CRIME'
  | 'PROPERTY_THEFT_BURGLARY'
  | 'FINANCIAL_FRAUD_CHEATING'
  | 'LAND_PROPERTY_DISPUTE'
  | 'PHYSICAL_ASSAULT_AFFRAY'
  | 'DOMESTIC_VIOLENCE_DOWRY'
  | 'PUBLIC_NUISANCE'
  | 'MISSING_PERSON'
  | 'NARCOTICS_DRUGS_INFO'
  | 'HARASSMENT_STALKING'
  | 'OTHER_GENERAL';

export type RelativeRelation = 'S/O' | 'D/O' | 'W/O' | 'C/O';

export interface ComplainantPerson {
  id?: string;
  name: string;
  relationType: RelativeRelation;
  relativeName: string;
  gender?: 'MALE' | 'FEMALE' | 'TRANSGENDER';
  nationality?: string;
  age?: number;
  presentAddress: string;
  presentCity: string;
  presentDistrict: string;
  presentState: string;
  presentCountry: string;
  isPermanentSameAsPresent: boolean;
  permanentAddress?: string;
  permanentCity?: string;
  permanentDistrict?: string;
  permanentState?: string;
  permanentCountry?: string;
  mobile: string;
}

export interface AccusedPerson {
  name: string;
  alias?: string;
  fatherName?: string;
  address?: string;
  phone?: string;
  relationWithComplainant?: string;
}

export interface ComplaintEvidenceAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  category: 'document' | 'video' | 'audio' | 'image' | 'other';
  dataUrl?: string;
  uploadedAt: string;
  description?: string;
}

export interface ComplaintItem {
  id: string;
  complaintNumber: string;
  source: ComplaintSource;
  category: ComplaintCategory;
  categoryDisplay: string;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  
  // Incident Info
  incidentDate: string;
  incidentTime?: string;
  isIncidentDateTimeKnown?: boolean;
  incidentPlace: string;
  incidentLandmark?: string;
  incidentDetails: string;
  
  // Complainant Info
  complainantName: string;
  complainantRelationType?: RelativeRelation;
  complainantRelativeName?: string;
  complainantFatherSpouse?: string;
  complainantNationality?: string;
  complainantGender: 'MALE' | 'FEMALE' | 'TRANSGENDER' | 'OTHER';
  complainantAge?: number;
  complainantMobile: string;
  complainantAltPhone?: string;
  complainantAddress: string;
  complainantCity: string;
  complainantDistrict: string;
  complainantState?: string;
  complainantCountry?: string;
  complainantPermanentAddress?: string;
  complainantPermanentCity?: string;
  complainantPermanentDistrict?: string;
  complainantPermanentState?: string;
  complainantPermanentCountry?: string;
  additionalComplainants?: ComplainantPerson[];
  
  // 4. Complaint Details
  intakeMode?: string;
  complaintSubject?: string;
  subject?: string;
  complaintDescription?: string;
  isFirRegistered?: boolean;
  firNumber?: string;
  firDate?: string;
  complaintAgeType?: 'FRESH' | 'OLD';
  complaintClassification?: string;
  complaintPurpose?: string;
  
  // Accused Info
  isAccusedKnown?: boolean;
  accusedList: AccusedPerson[];
  
  // Station & Officer Assignment
  policeStation: string;
  district: string;
  registeredBy: string;
  assignedEoId?: string;
  assignedEoName?: string;
  assignedEoRank?: string;
  assignedEoPno?: string;
  assignedEoBeltNumber?: string;
  assignedEoPhone?: string;
  mhcName?: string;
  mhcRank?: string;
  mhcBeltNumber?: string;
  mhcPhone?: string;
  assignedAt?: string;
  assignedDirections?: string;
  assignedRosterDuty?: string;
  daysPending: number;
  targetResolutionDate?: string;
  linkedComplaintNumber?: string;
  crossComplaintNumber?: string;
  isCrossComplaint?: boolean;
  linkedComplaintReason?: string;
  ncrNumber?: string;
  dispositionType?: string;
  dispositionCategory?: string;
  dispositionRemarks?: string;
  disposedAt?: string;
  disposedBy?: string;
  recommendedAction?: string;
  
  // Evidence Attachments (Documents, Audio, Video, Photos)
  attachments?: ComplaintEvidenceAttachment[];

  // Enquiry Notes, Documents, and Full Timeline
  enquiryNotes?: EnquiryNoteItem[];
  documents?: ComplaintDocumentItem[];
  timeline?: ComplaintTimelineEvent[];
  
  // EO Private Confidential Dossier (Never attached to public complaint or history)
  confidentialDossier?: ConfidentialDossierItem[];

  // Investigation Reports & Statutory Drafts
  reports?: ComplaintReportItem[];
  
  // Progress Report Demand from SHO
  progressReportRequested?: boolean;
  progressReportRequestedAt?: string;
  progressReportRemarks?: string;
  progressReportRequestedBy?: string;
  
  createdAt: string;
  updatedAt: string;
}

export interface ComplaintReportItem {
  id: string;
  complaintId: string;
  title: string;
  reportType: string;
  reportTypeLabel: string;
  dispatchNo?: string;
  generatedDate: string;
  officerName: string;
  officerRank?: string;
  officerPno?: string;
  conclusionSummary?: string;
  content?: string;
  fileName?: string;
  fileSize?: string;
  fileUrl?: string;
  dataUrl?: string;
  fileFormat?: string;
  isUploaded?: boolean;
  createdAt?: string;
}

export interface EnquiryNoteItem {
  id: string;
  complaintId: string;
  officerName: string;
  officerRank: string;
  officerPno: string;
  noteType: 'SPOT_VISIT' | 'WITNESS_EXAMINATION' | 'ACCUSED_EXAMINATION' | 'DOCUMENT_VERIFICATION' | 'INTERIM_PROGRESS' | 'GENERAL';
  content: string;
  createdAt: string;
  location?: string;
  attachment?: ComplaintEvidenceAttachment;
}

export interface ComplaintDocumentItem {
  id: string;
  complaintId: string;
  fileName: string;
  fileCategory: string;
  uploadedBy: string;
  uploadedAt: string;
  fileSize: string;
  fileUrl?: string;
  dataUrl?: string;
  mimeType?: string;
  description?: string;
}

export interface ConfidentialDossierItem {
  id: string;
  complaintId: string;
  officerName: string;
  officerRank?: string;
  officerPno: string;
  category: 'INFORMANT_LEAD' | 'FIELD_OBSERVATION' | 'OFF_RECORD_STATEMENT' | 'SUSPECT_INTEL' | 'PERSONAL_REMINDER' | 'GENERAL_CONFIDENTIAL';
  title: string;
  content: string;
  referenceTag?: string;
  attachmentName?: string;
  attachmentDataUrl?: string;
  attachmentType?: 'audio' | 'video' | 'document' | 'image' | 'other';
  attachmentSize?: string;
  createdAt: string;
}

export interface ComplaintTimelineEvent {
  id: string;
  complaintId: string;
  title: string;
  description: string;
  category: 'REGISTRATION' | 'ASSIGNMENT' | 'ENQUIRY_NOTE' | 'EVIDENCE' | 'DOCUMENT' | 'STATUS_CHANGE' | 'TRANSFER' | 'NOTICE' | 'PROGRESS_REQUEST';
  officerName: string;
  officerRank?: string;
  timestamp: string;
  documentName?: string;
}

export interface OfficerNotification {
  id: string;
  recipientPno: string;
  recipientName: string;
  complaintId: string;
  complaintNumber: string;
  title: string;
  message: string;
  directions: string;
  priority: string;
  createdAt: string;
  read: boolean;
}

export type GDEntryType =
  | 'OPENING_OF_DIARY'
  | 'SHIFT_RELIEF_TURNOVER'
  | 'OFFICER_DEPARTURE'
  | 'OFFICER_ARRIVAL'
  | 'PATROL_DEPARTURE_RETURN'
  | 'COMPLAINT_RECEIPT'
  | 'FIR_REGISTERED_ENTRY'
  | 'ARREST_INTIMATION'
  | 'SEIZURE_MUDDMAL'
  | 'SUPERVISORY_INSPECTION'
  | 'CLOSING_OF_DIARY'
  | 'MISCELLANEOUS_EVENT';

export * from "./generalDiary";

export interface GeneralDiaryItem {
  id: string;
  gdNumber: string;
  sequencePerDay: number;
  entryTime?: string;
  entryDate?: string;
  entryType?: any;
  entryTypeDisplay?: string;
  subject: string;
  narrative: string;
  policeStation: string;
  loggedByOfficer?: string;
  loggedByPno?: string;
  relatedComplaintNumber?: string;
  isLocked: boolean;
  activityDateTime?: string;
  officialCreationTimestamp?: string;
  verificationTimestamp?: string;
  status?: import("./generalDiary").GDStatus;
  source?: import("./generalDiary").GDSource;
  entryForOfficer?: import("./generalDiary").GDOfficerParticulars;
  actualAuthor?: import("./generalDiary").GDOfficerParticulars;
  auditTrail?: import("./generalDiary").GDAuditLog[];
  relatedRecords?: import("./generalDiary").GDRelatedRecords;
}

export interface HistoricalFirItem {
  id: string;
  firNumber: string;
  policeStation: string;
  district: string;
  registrationDate: string;
  sectionsOfLaw: string;
  complainantName: string;
  complainantPhone?: string;
  accusedNames: string[];
  accusedPhones?: string[];
  status: 'PENDING_TRIAL' | 'UNDER_INVESTIGATION' | 'CHARGESHEETED' | 'CONVICTED' | 'ACQUITTED';
  incidentBrief: string;
}

export interface CrossComplaintMatch {
  existingComplaint: ComplaintItem;
  matchType: 'CROSS_COMPLAINT' | 'REVERSE_PARTIES';
  reason: string;
  severity: 'HIGH' | 'MEDIUM';
}

export interface RepeatComplainantHistory {
  totalPreviousComplaints: number;
  complaints: ComplaintItem[];
  riskLevel: 'FREQUENT_COMPLAINANT' | 'MULTIPLE_PRIOR' | 'FIRST_TIME';
}

export interface LinkedComplaintMatch {
  existingComplaint: ComplaintItem;
  similarityScore: number;
  matchedOn: string[];
  summary: string;
}

export interface PriorFirMatch {
  fir: HistoricalFirItem;
  matchedParty: 'COMPLAINANT' | 'ACCUSED' | 'BOTH' | 'LOCATION';
  partyRole: 'ACCUSED_IN_FIR' | 'COMPLAINANT_IN_FIR' | 'NAMED_PERSON';
  reason: string;
}

export interface IntelligenceCheckResult {
  hasAlerts: boolean;
  crossComplaints: CrossComplaintMatch[];
  repeatHistory: RepeatComplainantHistory;
  linkedComplaints: LinkedComplaintMatch[];
  priorFirs: PriorFirMatch[];
  scannedAt: string;
}

export interface LegalSectionItem {
  sectionNumber: string;
  title: string;
  chapter?: string;
  description: string;
  verbatimText?: string;
  punishment?: string;
  cognizable?: 'Cognizable' | 'Non-cognizable';
  bailable?: 'Bailable' | 'Non-bailable';
  triableBy?: string;
}

export interface LegalActItem {
  id: string;
  title: string;
  shortName: string;
  actNumber: string;
  enactmentDate: string;
  effectiveDate: string;
  category: 'CRIMINAL_CODE' | 'PROCEDURAL_CODE' | 'EVIDENCE_CODE' | 'SPECIAL_ACT' | 'ECONOMIC_PROPERTY' | 'POLICE_RULES' | 'OTHER';
  categoryLabel: string;
  totalSections: number;
  totalChapters: number;
  fileFormat: 'PDF' | 'DOCX' | 'TXT' | 'IMAGE' | 'OTHER';
  fileName?: string;
  fileSize?: string;
  fileUrl?: string;
  fileDataUrl?: string;
  verbatimText?: string;
  preambleVerbatim?: string;
  isCustomUpload?: boolean;
  uploadedAt?: string;
  uploadedBy?: string;
  description: string;
  chapters?: {
    chapterNumber: string;
    title: string;
    sectionsRange: string;
  }[];
  keySections: LegalSectionItem[];
}

