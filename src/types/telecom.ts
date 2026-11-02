// src/types/telecom.ts
// Comprehensive Forensic Type Definitions for Haryana Police Telecom Evidence & Analysis Module (Phase 4)

export type TelecomCategory =
  | "CDR"
  | "IPDR"
  | "TOWER_DUMP"
  | "CAF"
  | "SDR"
  | "IMEI_IMSI"
  | "MNP"
  | "OTHER";

export type TelecomOperator =
  | "AIRTEL"
  | "JIO"
  | "VI"
  | "BSNL"
  | "OTHER";

export type CallDirection =
  | "INCOMING"
  | "OUTGOING"
  | "SMS_IN"
  | "SMS_OUT"
  | "MISSED"
  | "OTHER";

export interface TelecomEvidenceFile {
  id: string;
  originalFilename: string;
  category: TelecomCategory;
  operator: TelecomOperator;
  sha256Hash: string;
  fileSizeBytes: number;
  recordCount: number;
  uploadedBy: string;
  uploadedAt: string; // ISO string
  linkedFirId?: string;
  linkedFirNumber?: string;
  policeStation?: string;
  district?: string;
  parsingStatus: "SUCCESS" | "PARTIAL" | "FAILED";
  dateRangeStart?: string;
  dateRangeEnd?: string;
  sourceReference?: string;
  notes?: string;
  parsingErrors?: string[];
  dataUrl?: string; // Stored file reference
  duplicateOfFileId?: string;
  isExcludedFromCalculations?: boolean;
}

export interface NormalizedCallRecord {
  id: string;
  fileId: string;
  firId?: string;
  firNumber?: string;
  sourceNumber: string; // Calling party (A-Party)
  destinationNumber: string; // Called party (B-Party)
  callType: CallDirection;
  callDate: string; // YYYY-MM-DD
  callTime: string; // HH:MM:SS
  timestamp: string; // ISO 8601 internal standard
  originalTimestamp?: string; // Preserved raw timestamp
  originalTimezone?: string; // Preserved original timezone
  durationSeconds: number;
  firstCellId?: string;
  lastCellId?: string;
  firstLac?: string;
  imei?: string;
  imsi?: string;
  operator?: TelecomOperator;
  circle?: string;
  roamingState?: string;
  sourceRowNumber?: number;
  isExcluded?: boolean;
}

export interface NormalizedIpdrRecord {
  id: string;
  fileId: string;
  firId?: string;
  firNumber?: string;
  msisdn?: string;
  sourceIp: string;
  sourcePort: number;
  translatedIp?: string; // Public NAT IP
  translatedPort?: number;
  destinationIp: string;
  destinationPort: number;
  protocol: string; // TCP, UDP, etc.
  sessionStart: string; // ISO 8601
  sessionEnd?: string;
  durationSeconds?: number;
  bytesTransferred?: number;
  imei?: string;
  imsi?: string;
  firstCellId?: string;
  sourceRowNumber?: number;
}

export interface NormalizedTowerRecord {
  cellId: string;
  lac?: string;
  tac?: string;
  siteName: string;
  latitude: number;
  longitude: number;
  azimuth?: number; // 0 - 360 degrees
  operator?: TelecomOperator;
  technology?: "2G" | "3G" | "4G" | "5G";
  district?: string;
  address?: string;
  totalEventsObserved: number;
  uncertaintyRadiusMeters: number; // Radio cell coverage uncertainty (not exact GPS)
  sourceDocument?: string;
  verificationStatus?: "VERIFIED" | "PROVISIONAL" | "UNVERIFIED";
  effectiveDateStart?: string;
  effectiveDateEnd?: string;
  version?: number;
  updatedAt?: string;
}

export interface NormalizedTowerDumpRecord {
  id: string;
  fileId: string;
  firId?: string;
  cellId: string;
  lac?: string;
  timestamp: string;
  callingNumber: string;
  calledNumber?: string;
  durationSeconds: number;
  callType: CallDirection;
  imei?: string;
  imsi?: string;
  sourceRowNumber?: number;
}

export interface NormalizedSubscriberRecord {
  id: string;
  fileId: string;
  firId?: string;
  firNumber?: string;
  msisdn: string;
  subscriberName: string;
  fatherOrHusbandName?: string;
  gender?: string;
  dob?: string;
  address: string;
  city?: string;
  state?: string;
  pincode?: string;
  operator: TelecomOperator;
  activationDate?: string;
  idProofType?: string;
  idProofNumber?: string;
  alternateNumber?: string;
  linkedImeis?: string[];
  linkedImsis?: string[];
}

// Phase 3 & 4 Types

// Module 1 — Investigation Hypothesis Workspace
export interface InvestigationHypothesis {
  id: string;
  firId: string;
  title: string;
  description: string;
  relatedFirEventId?: string;
  supportingEvidenceRefs: string[];
  contradictoryEvidenceRefs: string[];
  missingEvidenceNotes: string;
  alternativeExplanations: string[];
  investigatorNotes: string;
  reviewStatus: "DRAFT" | "UNDER_REVIEW" | "REVISED" | "CLOSED";
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// Module 2 — Alternative Explanation Analyzer
export interface AlternativeExplanation {
  id: string;
  findingId: string;
  originalObservation: string;
  possibleInterpretations: string[];
  technicalLimitations: string[];
  additionalVerificationRequirements: string[];
  supportingReferences: string[];
}

// Module 3 — Source Reliability Matrix
export interface SourceReliabilityScore {
  fileId: string;
  operator: TelecomOperator;
  fileType: TelecomCategory;
  acquisitionRef: string;
  hashIntegrityStatus: "VERIFIED_MATCH" | "TAMPERED" | "UNVERIFIED";
  dateCoverageScore: number; // 0-100
  parsingCompletenessScore: number; // 0-100
  timestampReliabilityScore: number; // 0-100
  overallReliability: "HIGH" | "MEDIUM" | "LOW";
  notes: string;
}

// Module 4 — CDR & IPDR Consistency Checker
export interface CdrIpdrConsistencyReport {
  firId: string;
  consistentCount: number;
  potentialDiscrepanciesCount: number;
  missingRecordsCount: number;
  unverifiableCount: number;
  findings: {
    issueType: string;
    description: string;
    cdrRecordId?: string;
    ipdrRecordId?: string;
    severity: "HIGH" | "MEDIUM" | "LOW";
  }[];
}

// Module 5 — Analysis Reproducibility Engine
export interface AnalysisReproductionRun {
  id: string;
  firId: string;
  originalFindingId: string;
  originalHash: string;
  reproducedHash: string;
  matched: boolean;
  discrepancyCount: number;
  softwareVersion: string;
  executionTimestamp: string;
  executedBy: string;
  varianceDetails: string[];
}

// Module 6 — Automated Evidence Index
export interface EvidenceIndexItem {
  evidenceId: string;
  firId: string;
  fileName: string;
  evidenceType: TelecomCategory;
  sourceOperator: TelecomOperator;
  acquisitionDate: string;
  uploadDate: string;
  uploadedBy: string;
  sha256Hash: string;
  processingStatus: string;
  reviewStatus: string;
  relatedReportIds: string[];
  isRedacted: boolean;
}

// Module 9 — Evidence Redaction Tool
export interface EvidenceRedactionLog {
  id: string;
  firId: string;
  fileId: string;
  maskedFields: string[];
  redactedBy: string;
  redactedAt: string;
  justification: string;
  exportReference: string;
}

// Module 10 — Court Exhibit Builder
export interface CourtExhibitPackage {
  id: string;
  firId: string;
  firNumber: string;
  exhibitNumber: string; // e.g. "Exhibit P-1", "Annexure A-1"
  title: string;
  description: string;
  evidenceIds: string[];
  supportingFindingIds: string[];
  manifestHash: string;
  preparedBy: string;
  preparationDate: string;
  status: "DRAFT" | "READY_FOR_COURT" | "SUBMITTED_TO_PROSECUTION" | "ADMITTED_IN_COURT";
  bsaCertificateAttached: boolean;
}

// Module 11 — Evidence Relationship Graph
export interface EvidenceRelationshipNode {
  id: string;
  label: string;
  type: "FIR_EVENT" | "TELECOM_RECORD" | "EVIDENCE_FILE" | "FINDING" | "NOTE";
  metadata?: Record<string, any>;
}

export interface EvidenceRelationshipEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  relationshipType: "SOURCE_CONFIRMED" | "CALCULATED" | "INVESTIGATOR_HYPOTHESIS";
}

// Module 12 — Data Lineage Visualization
export interface DataLineageItem {
  stage: "ORIGINAL_FILE" | "PARSED_DATA" | "NORMALIZED_RECORD" | "CALCULATION" | "FINDING" | "COURT_EXHIBIT";
  title: string;
  identifier: string;
  timestamp: string;
  method: string;
  version: string;
  integrityVerified: boolean;
}

// Module 14 — AI Contradiction Review
export interface AiContradictionItem {
  id: string;
  firId: string;
  claimA: string;
  claimB: string;
  sourceRefA: string;
  sourceRefB: string;
  natureOfDiscrepancy: string;
  missingContext: string;
  status: "UNDER_REVIEW" | "RESOLVED";
}

// Module 15 — AI Analysis Verification
export interface AiAnalysisVerificationClaim {
  id: string;
  firId: string;
  claimedFact: string;
  claimedValue: string;
  recalculatedValue: string;
  status: "VERIFIED_AGAINST_SOURCE" | "INCONSISTENT" | "INSUFFICIENT_DATA" | "REQUIRES_HUMAN_REVIEW";
  sourceRecordIds: string[];
  formulaUsed: string;
}

// Module 16 — Investigation Coverage Matrix
export interface CoverageMatrixSlot {
  date: string;
  hour: number;
  hasCdr: boolean;
  hasIpdr: boolean;
  hasTower: boolean;
  operator: string;
  recordCount: number;
}

// Module 17 — Automated Review Questions
export interface EvidenceReviewQuestion {
  id: string;
  firId: string;
  question: string;
  category: "TOWER_VERIFICATION" | "TIMEZONE_AUDIT" | "SUBSCRIBER_IDENTITY" | "DATE_COVERAGE" | "SOURCE_LINKING";
  status: "PENDING" | "ANSWERED" | "WAIVED";
  assignedOfficer: string;
  resolutionNotes?: string;
}

// Module 18 — Report Quality Checker
export interface ReportValidationIssue {
  id: string;
  severity: "BLOCKING" | "WARNING" | "INFO";
  rule: string;
  message: string;
  suggestedFix: string;
}

// Module 19 — Electronic Evidence Certificate (Sec 63 BSA / Sec 65B IEA)
export interface ElectronicEvidenceCertificate {
  id: string;
  firId: string;
  certificateNumber: string;
  statutorySection: "Section 63 BSA 2023" | "Section 65B IEA 1872";
  evidenceFileIds: string[];
  deviceOrSourceDescription: string;
  hashManifest: string;
  signatoryName: string;
  signatoryDesignation: string;
  signatoryOrganization: string;
  isSigned: boolean;
  signatureDate?: string;
  certificateHtml: string;
}

// Module 22 — Evidence Disclosure Log
export interface EvidenceDisclosureRecord {
  id: string;
  firId: string;
  evidenceId: string;
  recipientName: string;
  recipientAgency: string;
  purpose: string;
  authorizationRef: string;
  disclosureTimestamp: string;
  disclosedBy: string;
  packageHash: string;
  acknowledgmentReceiptRef?: string;
}

// Module 23 — Court Query Response Workspace
export interface CourtQueryResponse {
  id: string;
  firId: string;
  queryRef: string;
  courtOrAuthority: string;
  queryText: string;
  dueDate: string;
  assignedOfficer: string;
  supportingEvidenceIds: string[];
  draftResponse: string;
  status: "DRAFT" | "UNDER_LEGAL_SCRUTINY" | "APPROVED";
  approvedBy?: string;
}

// Module 24 — Two-Person Dual Approval
export interface TwoPersonApproval {
  id: string;
  firId: string;
  actionType: "COURT_EXHIBIT_FINALIZATION" | "SENSITIVE_DATA_EXPORT" | "FINAL_FORENSIC_REPORT";
  targetId: string;
  firstApprover: string;
  firstApprovalAt: string;
  secondApprover?: string;
  secondApprovalAt?: string;
  status: "PENDING_SECOND_APPROVAL" | "FULLY_APPROVED" | "REJECTED";
}

// Module 25 — Evidence Access Justification
export interface EvidenceAccessJustification {
  id: string;
  firId: string;
  userId: string;
  userName: string;
  purposeOfAccess: string;
  authorizationBasis: string;
  accessedRecord: string;
  timestamp: string;
}

// Module 26 — Case Closure Archiving
export interface CaseArchiveRecord {
  firId: string;
  firNumber: string;
  archivedAt: string;
  archivedBy: string;
  disposalReviewDate: string;
  legalHoldActive: boolean;
  totalPreservedFiles: number;
  manifestHash: string;
}

// Module 27 — Knowledge Base
export interface KnowledgeBaseArticle {
  id: string;
  title: string;
  category: "TELECOM_PARSING" | "TOWER_METADATA" | "LEGAL_PROCEDURE" | "FORENSIC_STANDARDS";
  content: string;
  approvedBy: string;
  version: string;
}

// Module 28 — Analysis Method Registry
export interface AnalysisMethodDefinition {
  id: string;
  methodName: string;
  version: string;
  description: string;
  calculationLogic: string;
  assumptions: string;
  limitations: string;
  isApproved: boolean;
}

// Module 29 — Investigation Quality Control Center
export interface QualityControlChecklistState {
  firId: string;
  originalEvidenceVerified: boolean;
  hashIntegrityChecked: boolean;
  sourceMetadataReviewed: boolean;
  calculationsReproduced: boolean;
  findingsSourceLinked: boolean;
  dataLimitationsDocumented: boolean;
  redactionReviewed: boolean;
  supervisorApprovalCompleted: boolean;
  courtExhibitPackageChecked: boolean;
  lastUpdated: string;
  updatedBy: string;
}

// Existing Core Analytics Interfaces
export interface ReconciliationMatchItem {
  id: string;
  firId?: string;
  recordAId: string;
  recordBId: string;
  fileAId: string;
  fileBId: string;
  operatorA?: TelecomOperator;
  operatorB?: TelecomOperator;
  callingNumberA: string;
  callingNumberB: string;
  calledNumberA: string;
  calledNumberB: string;
  timestampA: string;
  timestampB: string;
  timeDifferenceSec: number;
  durationA: number;
  durationB: number;
  durationDifferenceSec: number;
  matchType: "CONFIRMED_MATCH" | "POTENTIAL_MATCH" | "CONFLICTING" | "DUPLICATE";
  matchConfidenceScore: number;
  criteriaExplanation: string;
  reviewStatus: "PENDING_REVIEW" | "ACCEPTED" | "REJECTED";
  reviewedBy?: string;
  reviewedAt?: string;
  notes?: string;
}

export interface ReconciliationDashboardSummary {
  totalRecordsChecked: number;
  matchedRecordsCount: number;
  potentialMatchesCount: number;
  conflictingRecordsCount: number;
  duplicateRecordsCount: number;
  unmatchedRecordsCount: number;
  overlappingDatasets: {
    fileA: string;
    fileB: string;
    overlapStart: string;
    overlapEnd: string;
    commonCallCount: number;
  }[];
}

export interface MnpHistoryItem {
  id: string;
  msisdn: string;
  previousOperator: TelecomOperator;
  newOperator: TelecomOperator;
  portingDate: string;
  sourceDocument: string;
  verificationStatus: "VERIFIED" | "UNVERIFIED";
  recordedBy: string;
  recordedAt: string;
  remarks?: string;
}

export interface ContactAlias {
  id: string;
  firId?: string;
  phoneNumber: string;
  aliasName: string;
  sourceOfAlias: string;
  verificationStatus: "VERIFIED" | "CLAIMED_BY_WITNESS" | "SUSPECT_STATEMENT" | "UNVERIFIED";
  createdBy: string;
  createdAt: string;
  remarks?: string;
}

export interface EvidenceCompletenessAssessment {
  firId?: string;
  coverageStart?: string;
  coverageEnd?: string;
  totalDaysSpan: number;
  totalRows: number;
  missingTimestamps: number;
  missingIdentifiers: number;
  missingTowerMetadata: number;
  unverifiedTowers: number;
  parsingFailures: number;
  incompleteFiles: number;
  overallCompletenessScorePercent: number;
  breakdown: {
    ruleName: string;
    weightPercent: number;
    achievedScore: number;
    description: string;
    recommendation: string;
  }[];
}

export interface ColumnMappingConfig {
  sourceNumberCol?: string;
  destinationNumberCol?: string;
  callDateCol?: string;
  callTimeCol?: string;
  timestampCol?: string;
  durationCol?: string;
  callTypeCol?: string;
  firstCellCol?: string;
  lastCellCol?: string;
  lacCol?: string;
  imeiCol?: string;
  imsiCol?: string;
}

export interface OperatorParsingProfile {
  id: string;
  profileName: string;
  operator: TelecomOperator;
  category: TelecomCategory;
  columnMapping: ColumnMappingConfig;
  dateFormat: string;
  timeFormat: string;
  timezone: string;
  isDefault?: boolean;
}

export interface TelecomEvidenceRequest {
  id: string;
  firId: string;
  firNumber: string;
  requestRefNumber: string;
  operator: TelecomOperator;
  requestedRecordType: TelecomCategory;
  requestedDateStart: string;
  requestedDateEnd: string;
  targetIdentifiers: string[];
  requestDate: string;
  legalAuthorization: string;
  requestedBy: string;
  status:
    | "DRAFT"
    | "SUBMITTED"
    | "ACKNOWLEDGED"
    | "PARTIALLY_RECEIVED"
    | "RECEIVED"
    | "VERIFIED"
    | "CLOSED"
    | "REJECTED"
    | "CANCELLED"
    | "CLARIFICATION_REQUIRED";
  expectedResponseDate?: string;
  receivedDate?: string;
  uploadedResponseFileId?: string;
  supervisorRemarks?: string;
  remarks?: string;
  auditTrail: {
    action: string;
    timestamp: string;
    actor: string;
    details: string;
  }[];
}

export interface UnifiedTimelineEvent {
  id: string;
  firId?: string;
  firNumber?: string;
  eventTime: string;
  eventType:
    | "FIR_INCIDENT_MILESTONE"
    | "CDR_CALL"
    | "IPDR_SESSION"
    | "TOWER_OBSERVATION"
    | "EVIDENCE_UPLOAD"
    | "IO_ANNOTATION";
  title: string;
  description: string;
  sourceType: "ORIGINAL_RECORD" | "USER_ENTERED" | "CALCULATED_INFERENCE";
  sourceRecordId?: string;
  sourceFileId?: string;
  sourceRowNumber?: number;
  identifiers: string[];
  metadata?: Record<string, any>;
}

export interface BeforeAfterComparison {
  milestoneTitle: string;
  milestoneTimestamp: string;
  windowMinutes: number;
  before: {
    callCount: number;
    totalDurationSeconds: number;
    uniqueContacts: number;
    towersObserved: string[];
    calls: NormalizedCallRecord[];
  };
  after: {
    callCount: number;
    totalDurationSeconds: number;
    uniqueContacts: number;
    towersObserved: string[];
    calls: NormalizedCallRecord[];
  };
  dataCoverageCaveat: string;
}

export interface EvidenceReviewChecklistItem {
  id: string;
  firId: string;
  key: string;
  title: string;
  description: string;
  isCompleted: boolean;
  completedBy?: string;
  completedAt?: string;
  remarks?: string;
  sourceReference?: string;
  assignedRole: string;
}

export interface AiQueryPlan {
  queryText: string;
  intentSummary: string;
  proposedFilters: {
    startDate?: string;
    endDate?: string;
    timeStart?: string;
    timeEnd?: string;
    direction?: CallDirection;
    numberPattern?: string;
    minDuration?: number;
    maxDuration?: number;
    cellId?: string;
  };
  filterExplanation: string;
  limitations: string;
  matchedRecordCount: number;
  matchingRecordIds: string[];
}

export interface EvidenceComparisonFactItem {
  id: string;
  claimSource: string;
  claimedFact: string;
  telecomEvidenceObservation: string;
  verdict: "CONSISTENT" | "CONTRADICTORY" | "NO_RECORDS_AVAILABLE";
  sourceReference: string;
  notes: string;
}

export interface CustomTableLayout {
  id: string;
  firId?: string;
  layoutName: string;
  selectedColumns: string[];
  columnOrder: string[];
  filters: Record<string, any>;
  sortBy: string;
  sortDirection: "asc" | "desc";
  groupBy?: string;
  aggregation?: "COUNT" | "SUM_DURATION" | "AVG_DURATION";
  createdBy: string;
  createdAt: string;
}

export interface InvestigationNote {
  id: string;
  firId: string;
  title: string;
  category: "CALL_OBSERVATION" | "TOWER_TRAIL" | "SUSPECT_MOVEMENT" | "MNP_TRAIL" | "RECONCILIATION_NOTE" | "GENERAL";
  content: string;
  attachedSourceRefs: string[];
  linkedEventId?: string;
  author: string;
  createdAt: string;
  updatedAt: string;
  aiSummary?: string;
}

export interface InvestigationBoardCard {
  id: string;
  type: "NUMBER" | "FILE" | "CALL" | "TOWER" | "EVENT" | "NOTE" | "SUBSCRIBER";
  title: string;
  subtitle: string;
  x: number;
  y: number;
  color?: string;
  data: Record<string, any>;
}

export interface InvestigationBoardConnection {
  id: string;
  sourceCardId: string;
  targetCardId: string;
  label: string;
  relationshipType: "SOURCE_CONFIRMED" | "CALCULATED" | "INVESTIGATOR_HYPOTHESIS";
}

export interface InvestigationBoard {
  id: string;
  firId: string;
  boardName: string;
  cards: InvestigationBoardCard[];
  connections: InvestigationBoardConnection[];
  savedBy: string;
  updatedAt: string;
}

export interface SavedAnalysisView {
  id: string;
  firId?: string;
  viewName: string;
  viewCategory: "CALLS" | "TIMELINE" | "TOWER" | "BOARD" | "CUSTOM_TABLE";
  filters: Record<string, any>;
  isShared: boolean;
  createdBy: string;
  createdAt: string;
}

export interface SupervisorReviewWorkflow {
  firId: string;
  status: "DRAFT" | "SUBMITTED_FOR_REVIEW" | "UNDER_REVIEW" | "APPROVED" | "RETURNED_FOR_CLARIFICATION";
  submittedBy?: string;
  submittedAt?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  comments: {
    author: string;
    role: string;
    date: string;
    message: string;
    isSupervisoryDirective: boolean;
  }[];
}

export interface InvestigationHandoverRecord {
  id: string;
  firId: string;
  firNumber: string;
  previousIo: string;
  newIo: string;
  transferAuthority: string;
  transferredAt: string;
  remarks: string;
  evidenceFileCount: number;
  savedFindingsCount: number;
  pendingRequestsCount: number;
}

export interface ReportVersion {
  id: string;
  reportId: string;
  firId: string;
  versionNumber: number;
  title: string;
  contentHtml: string;
  sha256Hash: string;
  createdBy: string;
  createdAt: string;
  reviewStatus: "DRAFT" | "APPROVED" | "SUPERSEDED";
  sourceDatasetVersions: string[];
}

export interface OfflineEvidencePackage {
  id: string;
  firId: string;
  packageName: string;
  recipientName: string;
  recipientDesignation: string;
  purpose: string;
  authorizationRef: string;
  fileIdsIncluded: string[];
  manifestHash: string;
  generatedAt: string;
  generatedBy: string;
  retentionExpiryDate: string;
}

export interface DataRetentionPolicy {
  firId: string;
  classification: "ACTIVE_TRIAL" | "UNDER_INVESTIGATION" | "CLOSED_ARCHIVE" | "APPEAL_PENDING";
  legalHoldActive: boolean;
  legalHoldAuthority?: string;
  retentionDeadline: string;
  accessReviewStatus: "REVIEWED" | "PENDING_AUDIT";
}

export interface FirstLastContactResult {
  numberA: string;
  numberB: string;
  subscriberA?: string;
  subscriberB?: string;
  firstCallTimestamp?: string;
  lastCallTimestamp?: string;
  totalCalls: number;
  incomingToA: number;
  outgoingFromA: number;
  totalDurationSeconds: number;
  avgDurationSeconds: number;
  timeline: NormalizedCallRecord[];
}

export interface CommunicationGap {
  numberA: string;
  numberB: string;
  gapStartTimestamp: string;
  gapEndTimestamp: string;
  gapHours: number;
  lastCallBefore: NormalizedCallRecord;
  firstCallAfter: NormalizedCallRecord;
  callsBeforeGap24h: number;
  callsAfterGap24h: number;
}

export interface ActivitySpike {
  date: string;
  hour?: number;
  callCount: number;
  baselineAvg: number;
  deviationMultiplier: number;
  anomalyType: "HIGH_SPIKE" | "UNUSUAL_SILENCE";
  associatedNumbers: string[];
}

export interface ReciprocalAnalysis {
  numberA: string;
  numberB: string;
  callsAtoB: number;
  callsBtoA: number;
  durationAtoB: number;
  durationBtoA: number;
  ratioAtoB: number;
  firstCall: string;
  lastCall: string;
}

export interface SimChangeTimelineItem {
  imei: string;
  imsi: string;
  msisdn: string;
  firstObserved: string;
  lastObserved: string;
  totalCallsRecorded: number;
  sourceFile: string;
  operator?: string;
}

export interface DataQualityReport {
  totalRowsInspected: number;
  validRows: number;
  duplicateRows: number;
  missingFieldRows: number;
  invalidDateRows: number;
  missingTowerCount: number;
  overallScorePercent: number;
  qualityIssues: {
    rule: string;
    affectedCount: number;
    severity: "HIGH" | "MEDIUM" | "LOW";
    description: string;
  }[];
}

export interface StatementConsistencyResult {
  id: string;
  statementText: string;
  witnessOrAccusedName: string;
  claimedDate?: string;
  claimedTime?: string;
  claimedTargetNumber?: string;
  verdict: "CONSISTENT" | "INCONSISTENT" | "INSUFFICIENT_DATA";
  confidenceExplanation: string;
  supportingRecordIds: string[];
  supportingRecords: NormalizedCallRecord[];
}

export interface InvestigationEvent {
  id: string;
  firId: string;
  firNumber: string;
  title: string;
  eventTime: string;
  description: string;
  windowMinutesBefore: number;
  windowMinutesAfter: number;
  createdBy: string;
  createdAt: string;
}

export interface SavedAnalysisFinding {
  reproduction?: { version: 1; method: "CONTACT" | "NIGHT_ACTIVITY"; targetNumber?: string; baselineHash: string };
  id: string;
  firId?: string;
  firNumber?: string;
  title: string;
  findingType: "KEY_CONTACT" | "COMMON_TOWER" | "IMEI_HOPPING" | "NIGHT_ACTIVITY" | "IPDR_BURST" | "STATEMENT_CHECK" | "OTHER";
  summary: string;
  supportingFileIds: string[];
  supportingRecordIds: string[];
  sourceCitations: string[];
  limitationsWarning: string;
  savedToFirDocuments: boolean;
  savedBy: string;
  savedAt: string;
}

export interface AnalysisSnapshot {
  id: string;
  firId: string;
  firNumber: string;
  snapshotTitle: string;
  createdAt: string;
  createdBy: string;
  fileCount: number;
  totalCalls: number;
  appliedFilters: Record<string, any>;
  notes?: string;
}

export interface TelecomAuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: string;
  action:
    | "UPLOAD_FILE"
    | "RUN_ANALYSIS"
    | "EXPORT_REPORT"
    | "SAVE_FINDING"
    | "AI_QUERY"
    | "VIEW_RECORDS"
    | "CROSS_FIR_SEARCH"
    | "RECONCILIATION_RUN"
    | "REQUEST_CREATED"
    | "BOARD_SAVED"
    | "HANDOVER_PERFORMED"
    | "OFFLINE_PACKAGE_EXPORT"
    | "HYPOTHESIS_SAVED"
    | "CERTIFICATE_GENERATED"
    | "EVIDENCE_DISCLOSED"
    | "DUAL_APPROVAL_LOGGED";
  details: string;
  firId?: string;
  firNumber?: string;
  fileId?: string;
}

export interface CdrStatistics {
  totalCalls: number;
  incomingCalls: number;
  outgoingCalls: number;
  smsIncoming: number;
  smsOutgoing: number;
  totalDurationSeconds: number;
  avgDurationSeconds: number;
  longestCallSeconds: number;
  shortestCallSeconds: number;
  uniqueContactedNumbers: number;
  daytimeCalls: number;
  nighttimeCalls: number;
  firstCallTimestamp?: string;
  lastCallTimestamp?: string;
  hourlyDistribution: { hour: number; count: number; incoming: number; outgoing: number }[];
  dailyDistribution: { date: string; count: number; duration: number }[];
  mostFrequentNumbers: {
    number: string;
    subscriberName?: string;
    aliasName?: string;
    total: number;
    incoming: number;
    outgoing: number;
    durationSeconds: number;
    firstSeen: string;
    lastSeen: string;
    firstCell?: string;
  }[];
}

export interface CrossFirMatch {
  matchedItem: string;
  matchType: "PHONE_NUMBER" | "IMEI" | "IMSI" | "TOWER";
  thisFirNumber: string;
  otherFirNumber: string;
  otherPoliceStation: string;
  otherDistrict: string;
  callCountInOtherFir: number;
  firstSeenOther: string;
  lastSeenOther: string;
  details: string;
}

// Master Persistent Store with Phase 4 Forensic Intelligence
export interface TelecomIntelligenceStore {
  files: TelecomEvidenceFile[];
  callRecords: NormalizedCallRecord[];
  ipdrRecords: NormalizedIpdrRecord[];
  towers: NormalizedTowerRecord[];
  towerDumpRecords: NormalizedTowerDumpRecord[];
  subscribers: NormalizedSubscriberRecord[];
  reconciliations: ReconciliationMatchItem[];
  mnpRecords: MnpHistoryItem[];
  contactAliases: ContactAlias[];
  parsingProfiles: OperatorParsingProfile[];
  evidenceRequests: TelecomEvidenceRequest[];
  investigationEvents: InvestigationEvent[];
  reviewChecklists: EvidenceReviewChecklistItem[];
  customTableLayouts: CustomTableLayout[];
  investigationNotes: InvestigationNote[];
  investigationBoards: InvestigationBoard[];
  savedViews: SavedAnalysisView[];
  supervisorWorkflows: SupervisorReviewWorkflow[];
  handoverRecords: InvestigationHandoverRecord[];
  reportVersions: ReportVersion[];
  offlinePackages: OfflineEvidencePackage[];
  retentionPolicies: DataRetentionPolicy[];
  savedFindings: SavedAnalysisFinding[];
  snapshots: AnalysisSnapshot[];
  statementChecks: StatementConsistencyResult[];
  auditLogs: TelecomAuditLog[];

  // Phase 4 Store Collections
  hypotheses: InvestigationHypothesis[];
  alternativeExpls: AlternativeExplanation[];
  sourceReliability: SourceReliabilityScore[];
  reproductionRuns: AnalysisReproductionRun[];
  redactionLogs: EvidenceRedactionLog[];
  courtExhibits: CourtExhibitPackage[];
  aiContradictions: AiContradictionItem[];
  aiVerifications: AiAnalysisVerificationClaim[];
  reviewQuestions: EvidenceReviewQuestion[];
  evidenceCertificates: ElectronicEvidenceCertificate[];
  disclosureLogs: EvidenceDisclosureRecord[];
  courtQueries: CourtQueryResponse[];
  dualApprovals: TwoPersonApproval[];
  accessJustifications: EvidenceAccessJustification[];
  caseArchives: CaseArchiveRecord[];
  knowledgeBase: KnowledgeBaseArticle[];
  methodRegistry: AnalysisMethodDefinition[];
  qcChecklists: QualityControlChecklistState[];
}

export interface MultiCdrComparisonResult {
  commonNumbers: { number: string; subscriberName?: string; sharedByFiles: string[]; sharedByFirs: string[]; callBreakdownByFile: Record<string, { incoming: number; outgoing: number; total: number; duration: number }> }[];
  numberToNumberMatches: { numberA: string; numberB: string; callCount: number; firstCall: string; lastCall: string; files: string[] }[];
}
