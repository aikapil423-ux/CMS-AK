// src/services/complaintAutoFillService.ts
// Service for managing persistent storage of processed complaint documents,
// caching raw uploaded files and extracted structured analysis in the database,
// bound to specific Complaint Numbers and IDs.
// Ensures documents do not need to be re-processed when generating notices, reports, or legal drafts.

export interface ProcessedComplaintDocumentRecord {
  id: string;
  documentId?: string; // Matches ComplaintDocumentItem.id or ComplaintEvidenceAttachment.id
  relatedComplaintId?: string; // e.g. "cmp_1728..."
  relatedComplaintNumber?: string; // e.g. "CMP/2026/0012"
  createdAt: string;
  updatedAt: string;

  // Raw Document Metadata & Content for immediate preview / download
  rawDocument: {
    fileName: string;
    fileSize: number;
    fileType: string;
    dataUrl: string; // base64 string for immediate preview / download
    rawExtractedText: string;
    detectedLanguage: "hindi" | "english" | "bilingual";
  };

  // Structured Processed Data extracted from document
  processedData: {
    classifiedDocumentName?: string;
    verifiedDocumentTitle?: string;
    typeLabel?: string;
    category?: string;

    // Complainant Details (from document)
    complainant?: {
      name?: string;
      relationType?: string;
      relativeName?: string;
      gender?: string;
      age?: string;
      mobile?: string;
      presentAddress?: string;
      city?: string;
      district?: string;
      state?: string;
      nationality?: string;
    };

    // Accused Persons (from document)
    isAccusedKnown?: boolean;
    accusedList?: Array<{
      id?: string;
      name: string;
      address?: string;
      phone?: string;
      alias?: string;
      relationWithComplainant?: string;
    }>;

    // Incident Details (from document)
    incident?: {
      place?: string;
      landmark?: string;
      date?: string;
      time?: string;
      isDateTimeKnown?: boolean;
      category?: string;
      details?: string; // Verbatim entire complaint
    };

    // Complaint Details (from document)
    complaint?: {
      mode?: string;
      subject?: string;
      description?: string; // Concise summary
      type?: string;
      isFirRegistered?: boolean;
      firNumber?: string;
      classification?: string;
      purpose?: string;
    };

    // Pre-computed Analysis for instant document / notice generation
    analysis?: {
      overviewSummary?: string;
      allegationsBrief?: string;
      sectionsOfLaw?: string;
      identifiedPersons?: Array<{
        name: string;
        role: string;
        fatherOrSpouse?: string;
        phone?: string;
        address?: string;
      }>;
    };
  };
}

const STORAGE_KEY = "cms_complaint_autofill_processed_documents_v1";

// In-memory cache for fast access
let memoryCache: ProcessedComplaintDocumentRecord[] | null = null;

function loadFromStorage(): ProcessedComplaintDocumentRecord[] {
  if (typeof window === "undefined") return [];
  if (memoryCache !== null) return memoryCache;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      memoryCache = JSON.parse(raw);
      return memoryCache || [];
    }
  } catch (err) {
    console.error("Error reading Complaint processed documents from storage:", err);
  }
  memoryCache = [];
  return memoryCache;
}

function persistToStorage(records: ProcessedComplaintDocumentRecord[]): void {
  memoryCache = records;
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    window.dispatchEvent(new CustomEvent("cms-complaint-autofill-updated"));
  } catch (err) {
    console.error("Error saving Complaint processed documents to storage:", err);
  }
}

export const complaintAutoFillService = {
  /**
   * Retrieves all processed complaint document records
   */
  getAll(): ProcessedComplaintDocumentRecord[] {
    return loadFromStorage();
  },

  /**
   * Finds processed records for a specific complaint ID
   */
  getByComplaintId(complaintId: string): ProcessedComplaintDocumentRecord[] {
    if (!complaintId) return [];
    const clean = complaintId.trim().toLowerCase();
    return loadFromStorage().filter(
      (r) =>
        (r.relatedComplaintId && r.relatedComplaintId.trim().toLowerCase() === clean) ||
        (r.relatedComplaintNumber && r.relatedComplaintNumber.trim().toLowerCase() === clean)
    );
  },

  /**
   * Finds processed records for a specific complaint number
   */
  getByComplaintNumber(complaintNumber: string): ProcessedComplaintDocumentRecord[] {
    if (!complaintNumber) return [];
    const clean = complaintNumber.trim().toLowerCase();
    return loadFromStorage().filter(
      (r) =>
        (r.relatedComplaintNumber && r.relatedComplaintNumber.trim().toLowerCase() === clean) ||
        (r.relatedComplaintId && r.relatedComplaintId.trim().toLowerCase() === clean)
    );
  },

  /**
   * Finds a processed record by document ID
   */
  getByDocumentId(docId: string): ProcessedComplaintDocumentRecord | null {
    if (!docId) return null;
    const clean = docId.trim().toLowerCase();
    return (
      loadFromStorage().find(
        (r) =>
          (r.documentId && r.documentId.trim().toLowerCase() === clean) ||
          r.id.trim().toLowerCase() === clean
      ) || null
    );
  },

  /**
   * Finds a processed record by file name and optional complaint ID
   */
  getByFileName(fileName: string, complaintId?: string): ProcessedComplaintDocumentRecord | null {
    if (!fileName) return null;
    const cleanFile = fileName.trim().toLowerCase();
    const cleanComp = complaintId ? complaintId.trim().toLowerCase() : null;
    const records = loadFromStorage();

    return (
      records.find((r) => {
        const fileMatch =
          r.rawDocument?.fileName?.trim().toLowerCase() === cleanFile ||
          r.processedData?.classifiedDocumentName?.trim().toLowerCase() === cleanFile;
        if (!fileMatch) return false;
        if (cleanComp) {
          return (
            (r.relatedComplaintId && r.relatedComplaintId.trim().toLowerCase() === cleanComp) ||
            (r.relatedComplaintNumber && r.relatedComplaintNumber.trim().toLowerCase() === cleanComp)
          );
        }
        return true;
      }) || null
    );
  },

  /**
   * Saves or updates a processed document record in the database
   */
  save(record: ProcessedComplaintDocumentRecord): ProcessedComplaintDocumentRecord {
    const records = loadFromStorage();
    const existingIndex = records.findIndex(
      (r) =>
        r.id === record.id ||
        (record.documentId && r.documentId && r.documentId === record.documentId) ||
        (record.relatedComplaintId &&
          r.relatedComplaintId === record.relatedComplaintId &&
          record.rawDocument?.fileName &&
          r.rawDocument?.fileName === record.rawDocument.fileName)
    );

    const now = new Date().toISOString();
    const recordToSave: ProcessedComplaintDocumentRecord = {
      ...record,
      updatedAt: now,
    };

    if (existingIndex >= 0) {
      records[existingIndex] = recordToSave;
    } else {
      records.unshift(recordToSave);
    }

    persistToStorage(records);
    return recordToSave;
  },

  /**
   * Binds pending processed records to a registered complaint ID and Number
   */
  bindToComplaint(
    tempOrDocId: string,
    complaintId: string,
    complaintNumber: string
  ): void {
    const records = loadFromStorage();
    let updated = false;

    for (const r of records) {
      if (
        r.id === tempOrDocId ||
        r.documentId === tempOrDocId ||
        (!r.relatedComplaintId && !r.relatedComplaintNumber)
      ) {
        r.relatedComplaintId = complaintId;
        r.relatedComplaintNumber = complaintNumber;
        r.updatedAt = new Date().toISOString();
        updated = true;
      }
    }

    if (updated) {
      persistToStorage(records);
    }
  },

  /**
   * Deletes a processed document record by document ID
   */
  deleteByDocumentId(docId: string): void {
    if (!docId) return;
    const clean = docId.trim().toLowerCase();
    const cleanWithoutPrefix = clean.replace(/^doc_att_/, "").replace(/^doc_/, "");
    const records = loadFromStorage();
    const filtered = records.filter(
      (r) =>
        r.id.trim().toLowerCase() !== clean &&
        r.id.trim().toLowerCase() !== cleanWithoutPrefix &&
        (!r.documentId ||
          (r.documentId.trim().toLowerCase() !== clean &&
            r.documentId.trim().toLowerCase() !== cleanWithoutPrefix))
    );
    if (filtered.length !== records.length) {
      persistToStorage(filtered);
    }
  },

  /**
   * Deletes a processed document record by file name and optional complaint ID
   */
  deleteByFileName(fileName: string, complaintId?: string): void {
    if (!fileName) return;
    const cleanFile = fileName.trim().toLowerCase();
    const cleanComp = complaintId ? complaintId.trim().toLowerCase() : null;
    const records = loadFromStorage();
    const filtered = records.filter((r) => {
      const matchFile =
        r.rawDocument?.fileName?.trim().toLowerCase() === cleanFile ||
        r.processedData?.classifiedDocumentName?.trim().toLowerCase() === cleanFile;
      if (!matchFile) return true;
      if (cleanComp) {
        const matchComp =
          (r.relatedComplaintId && r.relatedComplaintId.trim().toLowerCase() === cleanComp) ||
          (r.relatedComplaintNumber && r.relatedComplaintNumber.trim().toLowerCase() === cleanComp);
        return !matchComp; // drop if complaint matches
      }
      return false; // drop if no complaint specified
    });
    if (filtered.length !== records.length) {
      persistToStorage(filtered);
    }
  },

  /**
   * Deletes all processed documents bound to a complaint
   */
  deleteByComplaintId(complaintId: string): void {
    if (!complaintId) return;
    const clean = complaintId.trim().toLowerCase();
    const records = loadFromStorage();
    const filtered = records.filter(
      (r) =>
        (!r.relatedComplaintId || r.relatedComplaintId.trim().toLowerCase() !== clean) &&
        (!r.relatedComplaintNumber || r.relatedComplaintNumber.trim().toLowerCase() !== clean)
    );
    if (filtered.length !== records.length) {
      persistToStorage(filtered);
    }
  },
};
