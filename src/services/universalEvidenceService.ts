// src/services/universalEvidenceService.ts
// Universal Service for Persistent Processed Evidence & Reusable Case Data
// Works across Complaints, FIR, Roznamcha GD, and Enquiry Workspace.
// Stores both raw evidence and structured processed data in persistent backend database.
// Guarantees "Process Once and Reuse Everywhere" across all document generation modules.

import {
  UniversalEvidenceRecord,
  EvidenceModuleType,
  ProcessedEvidenceStructuredData,
} from "@/types/evidence";

const LOCAL_STORAGE_KEY = "cms_universal_processed_evidence_records_v1";

let memoryCache: UniversalEvidenceRecord[] | null = null;
let isInitialSyncDone = false;

function loadLocalCache(): UniversalEvidenceRecord[] {
  if (typeof window === "undefined") return [];
  if (memoryCache !== null) return memoryCache;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      memoryCache = JSON.parse(raw);
      return memoryCache || [];
    }
  } catch (e) {
    console.warn("Could not load evidence from localStorage:", e);
  }
  memoryCache = [];
  return memoryCache;
}

function persistLocalCache(records: UniversalEvidenceRecord[]): void {
  memoryCache = records;
  if (typeof window === "undefined") return;
  try {
    // Strip very large data URLs if needed for localStorage quota safety
    const safeForLocal = records.map((r) => {
      if (r.rawDocument?.dataUrl && r.rawDocument.dataUrl.length > 500000) {
        return {
          ...r,
          rawDocument: {
            ...r.rawDocument,
            dataUrl: r.rawDocument.dataUrl.slice(0, 10000) + "...", // truncate in localStorage, full remains on server
          },
        };
      }
      return r;
    });
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(safeForLocal));
    window.dispatchEvent(new CustomEvent("cms-evidence-updated"));
  } catch (err) {
    console.warn("LocalStorage quota alert in universalEvidenceService:", err);
  }
}

export const universalEvidenceService = {
  /**
   * Initializes / syncs in-memory and local cache with the persistent server database
   */
  async syncFromServer(caseId?: string, caseNumber?: string): Promise<UniversalEvidenceRecord[]> {
    if (typeof window === "undefined") return [];
    try {
      const url = new URL("/api/evidence/store", window.location.origin);
      if (caseId) url.searchParams.set("caseId", caseId);
      if (caseNumber) url.searchParams.set("caseNumber", caseNumber);

      const res = await fetch(url.toString(), { method: "GET" });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.records)) {
          const current = loadLocalCache();
          const serverRecords: UniversalEvidenceRecord[] = data.records;

          // Merge server records with local cache
          const merged = [...current];
          for (const sRec of serverRecords) {
            const idx = merged.findIndex((m) => m.id === sRec.id || m.fileId === sRec.fileId);
            if (idx !== -1) {
              merged[idx] = sRec;
            } else {
              merged.push(sRec);
            }
          }
          persistLocalCache(merged);
          isInitialSyncDone = true;
          return merged;
        }
      }
    } catch (err) {
      console.warn("Could not sync evidence from server:", err);
    }
    return loadLocalCache();
  },

  /**
   * Retrieves all evidence records currently cached
   */
  getAll(): UniversalEvidenceRecord[] {
    const list = loadLocalCache();
    if (!isInitialSyncDone && typeof window !== "undefined") {
      this.syncFromServer();
    }
    return list;
  },

  /**
   * Retrieves all processed evidence records bound to a specific case (Complaint ID / FIR No / GD No)
   */
  getByCase(caseIdOrNumber: string): UniversalEvidenceRecord[] {
    if (!caseIdOrNumber) return [];
    const target = caseIdOrNumber.toLowerCase().trim();
    const records = this.getAll();
    return records.filter(
      (r) =>
        (r.caseId && r.caseId.toLowerCase().trim() === target) ||
        (r.caseNumber && r.caseNumber.toLowerCase().trim() === target)
    );
  },

  /**
   * Retrieves a single record by file ID (matches attachment.id, doc.id)
   */
  getByFileId(fileId: string): UniversalEvidenceRecord | null {
    if (!fileId) return null;
    const cleanId = fileId.replace(/^(?:att_|doc_|doc_att_)/, "").toLowerCase().trim();
    const records = this.getAll();
    return (
      records.find(
        (r) =>
          r.fileId.toLowerCase().trim() === fileId.toLowerCase().trim() ||
          r.id.toLowerCase().trim() === fileId.toLowerCase().trim() ||
          r.fileId.toLowerCase().trim().includes(cleanId)
      ) || null
    );
  },

  /**
   * Retrieves record by file name and case ID
   */
  getByFileName(fileName: string, caseIdOrNumber?: string): UniversalEvidenceRecord | null {
    if (!fileName) return null;
    const cleanName = fileName.toLowerCase().trim();
    const records = this.getAll();
    return (
      records.find((r) => {
        const matchesName =
          (r.rawDocument?.fileName || "").toLowerCase().trim() === cleanName ||
          (r.structuredData?.classifiedDocumentName || "").toLowerCase().trim() === cleanName;
        if (!matchesName) return false;
        if (!caseIdOrNumber) return true;
        const target = caseIdOrNumber.toLowerCase().trim();
        return (
          (r.caseId && r.caseId.toLowerCase().trim() === target) ||
          (r.caseNumber && r.caseNumber.toLowerCase().trim() === target)
        );
      }) || null
    );
  },

  /**
   * Universal registration & processing entry point.
   * Guarantees "Process Once and Reuse Everywhere":
   * 1. Checks if file has already been processed with status COMPLETED.
   * 2. If yes: immediately reuses stored data without reprocessing (0ms, 0 cost).
   * 3. If no: executes server processing pipeline and permanently saves to database.
   */
  async registerAndProcess(params: {
    file?: File;
    dataUrl?: string;
    text?: string;
    fileName?: string;
    fileId?: string;
    caseId?: string;
    caseNumber?: string;
    module?: EvidenceModuleType;
    uploadedBy?: string;
    forceReprocess?: boolean;
  }): Promise<UniversalEvidenceRecord> {
    const fileId = params.fileId || `ev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const fileName = params.file ? params.file.name : params.fileName || "case_document.pdf";

    // Fast local cache check first
    if (!params.forceReprocess) {
      const cached =
        this.getByFileId(fileId) ||
        this.getByFileName(fileName, params.caseId || params.caseNumber);

      if (cached && cached.processingStatus === "COMPLETED") {
        // If cached and now associated with a case, bind case details
        if (params.caseId && !cached.caseId) {
          await this.bindToCase(cached.id, params.caseId, params.caseNumber);
        }
        return cached;
      }
    }

    // Call server processing pipeline
    try {
      const formData = new FormData();
      if (params.file) formData.append("file", params.file);
      if (params.dataUrl) formData.append("dataUrl", params.dataUrl);
      if (params.text) formData.append("text", params.text);
      formData.append("fileName", fileName);
      formData.append("fileId", fileId);
      if (params.caseId) formData.append("caseId", params.caseId);
      if (params.caseNumber) formData.append("caseNumber", params.caseNumber);
      if (params.module) formData.append("module", params.module);
      if (params.uploadedBy) formData.append("uploadedBy", params.uploadedBy);
      if (params.forceReprocess) formData.append("forceReprocess", "true");

      const res = await fetch("/api/evidence/process", {
        method: "POST",
        body: formData,
      });

      const resJson = await res.json();
      if (resJson.success && resJson.record) {
        const record: UniversalEvidenceRecord = resJson.record;

        // Update local cache
        const current = loadLocalCache();
        const idx = current.findIndex((r) => r.id === record.id || r.fileId === record.fileId);
        if (idx !== -1) {
          current[idx] = record;
        } else {
          current.unshift(record);
        }
        persistLocalCache(current);

        return record;
      } else if (resJson.record) {
        // Returned failed record
        const record: UniversalEvidenceRecord = resJson.record;
        const current = loadLocalCache();
        const idx = current.findIndex((r) => r.id === record.id || r.fileId === record.fileId);
        if (idx !== -1) current[idx] = record;
        else current.unshift(record);
        persistLocalCache(current);
        throw new Error(resJson.error || "Evidence processing failed on server");
      } else {
        throw new Error(resJson.error || "Failed to process evidence");
      }
    } catch (err: any) {
      console.error("Error in universalEvidenceService.registerAndProcess:", err);
      throw err;
    }
  },

  /**
   * Binds an existing evidence record to a complaint or FIR number persistently
   */
  async bindToCase(recordIdOrFileId: string, caseId: string, caseNumber?: string): Promise<boolean> {
    try {
      const records = loadLocalCache();
      const target = records.find((r) => r.id === recordIdOrFileId || r.fileId === recordIdOrFileId);
      if (!target) return false;

      target.caseId = caseId;
      if (caseNumber) target.caseNumber = caseNumber;
      target.updatedAt = new Date().toISOString();

      persistLocalCache(records);

      // Persist to server backend
      await fetch("/api/evidence/store", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: target.id,
          updates: { caseId, caseNumber, updatedAt: target.updatedAt },
          auditEntry: {
            id: `aud_${Date.now()}`,
            action: "FIELD_EDITED",
            performedBy: "System Binder",
            timestamp: target.updatedAt,
            details: `Bound evidence to Case ID: ${caseId}, Case No: ${caseNumber || "N/A"}.`,
          },
        }),
      });

      return true;
    } catch (err) {
      console.warn("Could not bind evidence to case on server:", err);
      return false;
    }
  },

  /**
   * Allows authorized officers to review, correct, and verify extracted structured data with audit history
   */
  async verifyAndCorrect(params: {
    recordId: string;
    updatedData: Partial<ProcessedEvidenceStructuredData>;
    officerName: string;
    officerRole: string;
    verificationNotes?: string;
  }): Promise<UniversalEvidenceRecord> {
    const records = loadLocalCache();
    const idx = records.findIndex((r) => r.id === params.recordId || r.fileId === params.recordId);
    if (idx === -1) throw new Error("Evidence record not found");

    const current = records[idx];
    const nowIso = new Date().toISOString();

    const updatedStructuredData: ProcessedEvidenceStructuredData = {
      ...current.structuredData,
      ...params.updatedData,
    };

    const updatedRecord: UniversalEvidenceRecord = {
      ...current,
      structuredData: updatedStructuredData,
      verificationStatus: "HUMAN_VERIFIED",
      updatedAt: nowIso,
      auditTrail: [
        ...(current.auditTrail || []),
        {
          id: `aud_${Date.now()}`,
          action: "HUMAN_VERIFIED",
          performedBy: params.officerName,
          performedByRole: params.officerRole,
          timestamp: nowIso,
          details: `Structured fields reviewed and human-verified. ${params.verificationNotes || ""}`.trim(),
        },
      ],
    };

    records[idx] = updatedRecord;
    persistLocalCache(records);

    // Save to server database
    await fetch("/api/evidence/store", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: updatedRecord.id,
        updates: {
          structuredData: updatedRecord.structuredData,
          verificationStatus: "HUMAN_VERIFIED",
          updatedAt: nowIso,
        },
        auditEntry: updatedRecord.auditTrail[updatedRecord.auditTrail.length - 1],
      }),
    });

    return updatedRecord;
  },

  /**
   * Safe retry option for failed processing jobs without duplicating or losing raw files
   */
  async retryProcessing(recordId: string, officerName: string): Promise<UniversalEvidenceRecord> {
    const record = this.getByFileId(recordId) || loadLocalCache().find((r) => r.id === recordId);
    if (!record) throw new Error("Evidence record not found");

    return this.registerAndProcess({
      fileId: record.fileId,
      fileName: record.rawDocument.fileName,
      dataUrl: record.rawDocument.dataUrl,
      caseId: record.caseId,
      caseNumber: record.caseNumber,
      module: record.module,
      uploadedBy: officerName,
      forceReprocess: true,
    });
  },

  /**
   * Permanently deletes an evidence record when deleted by authorized officer
   */
  async deleteByDocumentId(fileIdOrRecordId: string): Promise<boolean> {
    try {
      const records = loadLocalCache();
      const updated = records.filter(
        (r) => r.id !== fileIdOrRecordId && r.fileId !== fileIdOrRecordId
      );
      persistLocalCache(updated);

      await fetch(`/api/evidence/store?fileId=${encodeURIComponent(fileIdOrRecordId)}`, {
        method: "DELETE",
      });
      return true;
    } catch (err) {
      console.warn("Could not delete evidence from server:", err);
      return false;
    }
  },
};
