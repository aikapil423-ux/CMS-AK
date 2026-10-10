// src/types/evidence.ts
// Universal data models for Persistent Processed Evidence & Reusable Case Data
// Preserves original raw evidence files and stores extracted structured data persistently.

export type EvidenceProcessingStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'REPROCESSING';

export type EvidenceVerificationStatus =
  | 'AI_EXTRACTED'
  | 'HUMAN_VERIFIED'
  | 'FLAGGED_FOR_REVIEW';

export type EvidenceModuleType =
  | 'COMPLAINTS'
  | 'FIR'
  | 'GENERAL_DIARY'
  | 'ENQUIRY_WORKSPACE'
  | 'ACTS'
  | 'GENERAL';

export interface ExtractedPersonEntity {
  id: string;
  name: string;
  role: 'Complainant' | 'Accused' | 'Witness' | 'Victim' | 'Informant' | 'Police Officer' | 'Other';
  relativeName?: string;
  relationType?: string;
  gender?: string;
  age?: string;
  mobile?: string;
  address?: string;
  city?: string;
  district?: string;
  state?: string;
  sourceEvidenceId?: string;
  sourcePage?: number | string;
  isVerified?: boolean;
}

export interface ExtractedVehicleEntity {
  id: string;
  regNumber: string;
  makeModel?: string;
  color?: string;
  ownerName?: string;
  involvement?: 'STOLEN' | 'SUSPECT' | 'RECOVERED' | 'WITNESS';
}

export interface ExtractedPropertyEntity {
  id: string;
  description: string;
  estimatedValue?: string;
  category?: string;
  status?: 'STOLEN' | 'SEIZED' | 'RECOVERED' | 'DISPUTED';
}

export interface ExtractedLegalSectionEntity {
  act: string;
  section: string;
  description?: string;
  bnsEquivalent?: string;
}

export interface ProcessedEvidenceStructuredData {
  classifiedDocumentName?: string;
  verifiedDocumentTitle?: string;
  documentCategory?: string;
  documentSubCategory?: string;

  // Extracted entities with source tracking
  persons: ExtractedPersonEntity[];
  complainant?: {
    name?: string;
    relationType?: string;
    relativeName?: string;
    gender?: string;
    age?: string;
    mobile?: string;
    address?: string;
    city?: string;
    district?: string;
    state?: string;
    nationality?: string;
  };
  accusedList: Array<{
    id?: string;
    name: string;
    address?: string;
    phone?: string;
    alias?: string;
    relationWithComplainant?: string;
    sourcePage?: number | string;
  }>;
  witnessList?: Array<{
    id?: string;
    name: string;
    statementBrief?: string;
    contact?: string;
    address?: string;
  }>;

  // Incident facts
  incident?: {
    place?: string;
    landmark?: string;
    date?: string;
    time?: string;
    isDateTimeKnown?: boolean;
    category?: string;
    details?: string; // Full verbatim text
    summary?: string; // Concise summary
  };

  // Case identifiers
  caseIdentifiers?: {
    complaintNumber?: string;
    firNumber?: string;
    gdNumber?: string;
    policeStation?: string;
    district?: string;
  };

  // Physical & Legal entities
  vehicles?: ExtractedVehicleEntity[];
  properties?: ExtractedPropertyEntity[];
  legalSections?: ExtractedLegalSectionEntity[];

  // Accuracy flags
  missingInformationFlags?: string[];
  conflictingInformationFlags?: string[];
}

export interface EvidenceAuditEntry {
  id: string;
  action: 'UPLOADED' | 'PROCESS_STARTED' | 'PROCESS_COMPLETED' | 'PROCESS_FAILED' | 'REPROCESSED' | 'HUMAN_VERIFIED' | 'FIELD_EDITED' | 'DOCUMENT_GENERATION_REUSED';
  performedBy: string;
  performedByRole?: string;
  timestamp: string;
  details: string;
}

export interface UniversalEvidenceRecord {
  id: string; // Unique evidence record ID (e.g. "ev_rec_...")
  fileId: string; // ID of the underlying file or attachment (e.g. "ev_...", "doc_...")
  caseId?: string; // ID of complaint, FIR, or GD
  caseNumber?: string; // Number of complaint, FIR, or GD (e.g. "HAR-KKR-2026-CMP-00487")
  module: EvidenceModuleType;
  
  // 1. Raw Document Data (Permanently preserved, never overwritten)
  rawDocument: {
    fileName: string;
    fileSize: number;
    fileType: string;
    mimeType?: string;
    dataUrl: string; // Base64 data URI for instant offline viewing/downloading
    fileUrl?: string; // Server/Static URL
    sha256Hash?: string; // Checksum for duplicate prevention & process-once guarantee
    uploadedAt: string;
    uploadedBy: string;
    sourceDepartment?: string;
  };

  // 2. Extracted text from OCR or parser
  extractedText: string;
  detectedLanguage: 'hindi' | 'english' | 'bilingual';

  // 3. Processed structured data
  structuredData: ProcessedEvidenceStructuredData;

  // 4. Processing status & version control
  processingStatus: EvidenceProcessingStatus;
  verificationStatus: EvidenceVerificationStatus;
  processingVersion: number;
  processingEngine: string; // e.g. "Gemini-3.5-Flash" | "OCR-Local"
  processedAt?: string;
  errorMessage?: string;
  retryCount: number;

  // 5. Audit history
  auditTrail: EvidenceAuditEntry[];

  createdAt: string;
  updatedAt: string;
}
