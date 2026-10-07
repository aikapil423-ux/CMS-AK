import {
  ComplaintItem,
  ComplaintStatus,
  ComplaintPriority,
  SystemRole,
  IntelligenceCheckResult,
  CrossComplaintMatch,
  RepeatComplainantHistory,
  LinkedComplaintMatch,
  PriorFirMatch,
  HistoricalFirItem,
  OfficerNotification,
  EnquiryNoteItem,
  ComplaintDocumentItem,
  ComplaintTimelineEvent,
  ComplaintEvidenceAttachment,
  ConfidentialDossierItem,
  ComplaintReportItem,
  ComplaintAuditRecord,
  WorkflowState,
  EOOutcome,
  MainComplaintStatus,
  getMainComplaintStatus,
  LegalAnalysisReport,
  InvestigationSummaryReport,
} from "@/types";
import { MOCK_COMPLAINTS, MOCK_HISTORICAL_FIRS, MOCK_ENQUIRY_OFFICERS } from "@/lib/mockData";
import { ComplaintRegistrationInput } from "@/lib/validations/complaint";
import { GeneralDiaryService } from "./generalDiaryService";

// In-memory store initialized with localStorage if available, or fallback to MOCK_COMPLAINTS
const COMPLAINTS_STORAGE_KEY = "haryana_police_cms_complaints_v1";
const NOTIFICATIONS_STORAGE_KEY = "haryana_police_cms_notifications_v1";

// In-memory cache for large base64 data URLs so localStorage never hits quota
const globalDataUrlCache = new Map<string, string>();

function sanitizeComplaintForStorage(item: ComplaintItem): ComplaintItem {
  return {
    ...item,
    attachments: item.attachments?.map((att) => {
      if (att.dataUrl && att.dataUrl.length > 30000) {
        globalDataUrlCache.set(`att_${att.id}`, att.dataUrl);
        globalDataUrlCache.set(`${item.id}_${att.name}`, att.dataUrl);
        return { ...att, dataUrl: "" };
      }
      return att;
    }),
    documents: item.documents?.map((doc) => {
      const url = doc.dataUrl || doc.fileUrl;
      if (url && url.length > 30000) {
        globalDataUrlCache.set(doc.id, url);
        globalDataUrlCache.set(`${item.id}_${doc.fileName}`, url);
        return {
          ...doc,
          dataUrl: "",
          fileUrl: "",
          contentHtml: doc.contentHtml && doc.contentHtml.length > 30000 ? doc.contentHtml.slice(0, 30000) : doc.contentHtml,
        };
      }
      return doc;
    }),
    reports: item.reports?.map((rep) => {
      const url = rep.dataUrl || rep.fileUrl;
      if (url && url.length > 30000) {
        globalDataUrlCache.set(rep.id, url);
        return { ...rep, dataUrl: "", fileUrl: "" };
      }
      return rep;
    }),
  };
}

function restoreDataUrlsForComplaint(item: ComplaintItem): ComplaintItem {
  return {
    ...item,
    attachments: item.attachments?.map((att) => {
      if (!att.dataUrl) {
        const cached = globalDataUrlCache.get(`att_${att.id}`) || globalDataUrlCache.get(`${item.id}_${att.name}`);
        if (cached) return { ...att, dataUrl: cached };
      }
      return att;
    }),
    documents: item.documents?.map((doc) => {
      if (!doc.dataUrl && !doc.fileUrl) {
        const cached = globalDataUrlCache.get(doc.id) || globalDataUrlCache.get(`${item.id}_${doc.fileName}`);
        if (cached) return { ...doc, dataUrl: cached, fileUrl: cached };
      }
      return doc;
    }),
  };
}

let complaintsStore: ComplaintItem[] = [];
let officerNotificationsStore: OfficerNotification[] = [];

function loadComplaintsFromStorage(): ComplaintItem[] {
  let loaded: ComplaintItem[] = [];
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      const stored = window.localStorage.getItem(COMPLAINTS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          loaded = parsed.map(restoreDataUrlsForComplaint);
        }
      }
    } catch (e) {
      console.warn("Could not load complaints from localStorage", e);
    }
  }

  if (loaded.length === 0) {
    return [...MOCK_COMPLAINTS];
  }

  // Preserve any in-memory complaints created during this session that might not be in storage
  if (Array.isArray(complaintsStore) && complaintsStore.length > 0) {
    const loadedIds = new Set(loaded.map((c) => c.id));
    const memoryOnly = complaintsStore.filter((c) => !loadedIds.has(c.id));
    return [...memoryOnly, ...loaded];
  }

  return loaded;
}

function saveComplaintsToStorage(items: ComplaintItem[]) {
  complaintsStore = items;
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      const sanitized = items.map(sanitizeComplaintForStorage);
      window.localStorage.setItem(COMPLAINTS_STORAGE_KEY, JSON.stringify(sanitized));
    } catch (e) {
      console.warn("Storage quota exceeded, attempting fallback strip", e);
      try {
        // Fallback 1: completely strip all dataUrls, fileUrls, and contentHtml
        const stripped = items.map((c) => ({
          ...c,
          attachments: c.attachments?.map((a) => ({ ...a, dataUrl: undefined })),
          documents: c.documents?.map((d) => ({ ...d, dataUrl: undefined, fileUrl: undefined, contentHtml: undefined })),
          reports: c.reports?.map((r) => ({ ...r, dataUrl: undefined, fileUrl: undefined, contentHtml: undefined })),
        }));
        window.localStorage.setItem(COMPLAINTS_STORAGE_KEY, JSON.stringify(stripped));
      } catch (err2) {
        console.warn("Storage quota still exceeded, trimming to recent 30 complaints", err2);
        try {
          const trimmed = items.slice(0, 30).map((c) => ({
            ...c,
            attachments: c.attachments?.map((a) => ({ ...a, dataUrl: undefined })),
            documents: c.documents?.map((d) => ({ ...d, dataUrl: undefined, fileUrl: undefined })),
          }));
          window.localStorage.setItem(COMPLAINTS_STORAGE_KEY, JSON.stringify(trimmed));
        } catch (err3) {
          console.error("Critical: LocalStorage full", err3);
        }
      }
    }
  }
}

function loadNotificationsFromStorage(): OfficerNotification[] {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      const stored = window.localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn("Could not load notifications from localStorage", e);
    }
  }
  return [];
}

function saveNotificationsToStorage(items: OfficerNotification[]) {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      window.localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn("Could not save notifications to localStorage", e);
    }
  }
}

function syncComplaintsToServer(items: ComplaintItem[]) {
  if (typeof window !== "undefined") {
    try {
      const sanitized = items.map(sanitizeComplaintForStorage);
      fetch("/api/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ complaints: sanitized }),
      }).catch(() => {});
    } catch (e) {
      // ignore background sync errors
    }
  }
}

// Initialize stores
complaintsStore = loadComplaintsFromStorage();
officerNotificationsStore = loadNotificationsFromStorage();

export const ComplaintService = {
  async getComplaints(filter?: {
    search?: string;
    status?: string;
    statuses?: string[];
    priority?: string;
    category?: string;
    assignedEo?: string;
    viewerRole?: SystemRole | string;
    viewerStation?: string;
    activeQueueOnly?: boolean;
    showSentToSho?: boolean;
  }): Promise<ComplaintItem[]> {
    complaintsStore = loadComplaintsFromStorage();
    let list = [...complaintsStore];

    // 1. Role-based visibility
    const isEo =
      filter?.viewerRole === "ENQUIRY_OFFICER" ||
      (Boolean(filter?.assignedEo) &&
        filter?.viewerRole !== "SHO" &&
        filter?.viewerRole !== "MHC_GD_INCHARGE" &&
        filter?.viewerRole !== "DSP_SUBDIV" &&
        filter?.viewerRole !== "SP_DISTRICT" &&
        filter?.viewerRole !== "SUPER_ADMIN");

    if (isEo && filter?.assignedEo) {
      const eo = (filter.assignedEo || "").toLowerCase().trim();
      const eoTokens = eo
        .split(" ")
        .filter((p) => p.length > 2 && !["sub-inspector", "inspector", "asi", "si", "officer"].includes(p));

      list = list.filter((c) => {
        // EO cannot see complaints when NO EO is assigned
        const hasEo = Boolean(c.assignedEoId || c.assignedEoName || c.assignedEoPno);
        if (!hasEo) return false;

        const eoId = (c.assignedEoId || "").toLowerCase();
        const eoPno = (c.assignedEoPno || "").toLowerCase();
        const eoName = (c.assignedEoName || "").toLowerCase();

        let matches = eoId === eo || eoPno === eo;
        if (
          !matches &&
          eoId.replace("usr_", "").replace("eo_", "") &&
          eo.replace("usr_", "").replace("eo_", "")
        ) {
          matches = eoId.replace("usr_", "").replace("eo_", "") === eo.replace("usr_", "").replace("eo_", "");
        }
        if (!matches && eoName && (eoName.includes(eo) || eo.includes(eoName))) {
          matches = true;
        }
        if (!matches && eoTokens.length > 0 && eoTokens.some((t) => eoName.includes(t))) {
          matches = true;
        }
        if (!matches) return false;

        // Active queue rule:
        // When EO sends a complaint to SHO, it leaves EO's active work queue.
        // It reappears if SHO orders Re-Enquiry (workflowState === "RE_ENQUIRY" && !c.isSentToSho).
        if (filter?.activeQueueOnly !== false && !filter?.showSentToSho) {
          if (c.isSentToSho && !c.isFirApprovedBySho && c.workflowState !== "RE_ENQUIRY") {
            return false;
          }
        }

        return true;
      });
    }

    // 2. Status filtering based on the 3+1 statuses: Not Assigned, Pending, Complete, FIR Registered
    if (filter?.statuses && filter.statuses.length > 0 && !filter.statuses.includes("ALL")) {
      list = list.filter((c) => {
        const main = getMainComplaintStatus(c);
        return filter.statuses!.some((st) => {
          const sUpper = st.toUpperCase();
          if (sUpper === "NOT_ASSIGNED" || sUpper === "UNASSIGNED" || sUpper === "REGISTERED") {
            return main === "Not Assigned";
          }
          if (
            sUpper === "PENDING" ||
            sUpper === "UNDER_ENQUIRY" ||
            sUpper === "ENQUIRY_IN_PROGRESS" ||
            sUpper === "RE_ENQUIRY"
          ) {
            return main === "Pending";
          }
          if (
            sUpper === "COMPLETE" ||
            sUpper === "COMPLETED" ||
            sUpper === "DISPOSED" ||
            sUpper === "DISPOSED_CIVIL_NATURE"
          ) {
            return main === "Complete";
          }
          if (sUpper === "FIR_REGISTER" || sUpper === "FIR REGISTER") {
            return main === "FIR Register";
          }
          if (sUpper === "FIR_REGISTERED" || sUpper === "FIR REGISTERED") {
            return main === "FIR Registered";
          }
          if (sUpper === "CORRECTION_REQUIRED" || sUpper === "CORRECTION REQUIRED") {
            return main === "Correction Required";
          }
          if (sUpper === "WAITING_SHO" || sUpper === "UNDER_REVIEW") {
            return Boolean(c.isSentToSho && !c.isFirRegistered);
          }
          return c.status === st || main === st;
        });
      });
    } else if (filter?.status && filter.status !== "ALL") {
      const sUpper = filter.status.toUpperCase();
      if (sUpper === "NOT_ASSIGNED" || sUpper === "UNASSIGNED" || sUpper === "REGISTERED") {
        list = list.filter((c) => getMainComplaintStatus(c) === "Not Assigned");
      } else if (
        sUpper === "PENDING" ||
        sUpper === "UNDER_ENQUIRY" ||
        sUpper === "ENQUIRY_IN_PROGRESS" ||
        sUpper === "RE_ENQUIRY"
      ) {
        list = list.filter((c) => getMainComplaintStatus(c) === "Pending");
      } else if (
        sUpper === "COMPLETE" ||
        sUpper === "COMPLETED" ||
        sUpper === "DISPOSED" ||
        sUpper === "DISPOSED_CIVIL_NATURE"
      ) {
        list = list.filter((c) => getMainComplaintStatus(c) === "Complete");
      } else if (sUpper === "FIR_REGISTER" || sUpper === "FIR REGISTER") {
        list = list.filter((c) => getMainComplaintStatus(c) === "FIR Register");
      } else if (sUpper === "FIR_REGISTERED" || sUpper === "FIR REGISTERED") {
        list = list.filter((c) => getMainComplaintStatus(c) === "FIR Registered");
      } else if (sUpper === "CORRECTION_REQUIRED" || sUpper === "CORRECTION REQUIRED") {
        list = list.filter((c) => getMainComplaintStatus(c) === "Correction Required");
      } else if (sUpper === "WAITING_SHO" || sUpper === "UNDER_REVIEW") {
        list = list.filter((c) => c.isSentToSho && !c.isFirRegistered);
      } else {
        list = list.filter((c) => c.status === filter.status);
      }
    }

    if (filter?.priority && filter.priority !== "ALL") {
      list = list.filter((c) => c.priority === filter.priority);
    }

    if (filter?.category && filter.category !== "ALL") {
      list = list.filter((c) => c.category === filter.category);
    }

    if (filter?.search) {
      const q = filter.search.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.complaintNumber.toLowerCase().includes(q) ||
          c.complainantName.toLowerCase().includes(q) ||
          c.complainantMobile.includes(q) ||
          c.incidentPlace.toLowerCase().includes(q) ||
          (c.complaintSubject && c.complaintSubject.toLowerCase().includes(q)) ||
          (c.complaintDescription && c.complaintDescription.toLowerCase().includes(q)) ||
          (c.policeStation && c.policeStation.toLowerCase().includes(q)) ||
          (c.assignedEoName && c.assignedEoName.toLowerCase().includes(q)) ||
          (c.firNumber && c.firNumber.toLowerCase().includes(q)) ||
          c.accusedList.some((a) => a.name.toLowerCase().includes(q) || (a.address && a.address.toLowerCase().includes(q)))
      );
    }

    return list;
  },

  async getComplaintById(id: string): Promise<ComplaintItem | undefined> {
    if (!id) return undefined;
    const cleanId = decodeURIComponent(id).trim().toLowerCase();

    // 1. Search in-memory complaintsStore directly first
    let found = complaintsStore.find(
      (c) =>
        c.id.toLowerCase() === cleanId ||
        c.complaintNumber.toLowerCase() === cleanId
    );
    if (found) return found;

    // 2. If not found in memory, reload from storage and search
    complaintsStore = loadComplaintsFromStorage();
    return complaintsStore.find(
      (c) =>
        c.id.toLowerCase() === cleanId ||
        c.complaintNumber.toLowerCase() === cleanId
    );
  },

  async getStatusCounts(assignedEoFilter?: string): Promise<{
    all: number;
    unassigned: number;
    underEnquiry: number;
    underReview: number;
    disposed: number;
    notAssigned: number;
    pending: number;
    complete: number;
    firRegister: number;
    firRegistered: number;
    correctionRequired: number;
  }> {
    complaintsStore = loadComplaintsFromStorage();
    let baseList = [...complaintsStore];
    if (assignedEoFilter) {
      const eo = assignedEoFilter.toLowerCase().trim();
      const eoTokens = eo
        .split(" ")
        .filter((p) => p.length > 2 && !["sub-inspector", "inspector", "asi", "si", "officer"].includes(p));
      baseList = baseList.filter((c) => {
        // EO cannot see complaints without an assigned EO
        const hasEo = Boolean(c.assignedEoId || c.assignedEoName || c.assignedEoPno);
        if (!hasEo) return false;

        const eoId = (c.assignedEoId || "").toLowerCase();
        const eoPno = (c.assignedEoPno || "").toLowerCase();
        const eoName = (c.assignedEoName || "").toLowerCase();

        let matches = eoId === eo || eoPno === eo;
        if (
          !matches &&
          eoId.replace("usr_", "").replace("eo_", "") &&
          eo.replace("usr_", "").replace("eo_", "")
        ) {
          matches = eoId.replace("usr_", "").replace("eo_", "") === eo.replace("usr_", "").replace("eo_", "");
        }
        if (!matches && eoName && (eoName.includes(eo) || eo.includes(eoName))) return true;
        if (!matches && eoTokens.length > 0 && eoTokens.some((token) => eoName.includes(token))) return true;
        if (!matches) return false;

        // Active queue rule: when sent to SHO, it leaves EO active queue unless re-enquiry or correction required
        if (
          c.isSentToSho &&
          !c.isFirApprovedBySho &&
          c.workflowState !== "RE_ENQUIRY" &&
          c.workflowState !== "CORRECTION_REQUIRED" &&
          c.shoDecision !== "REJECT"
        ) {
          return false;
        }

        return true;
      });
    }

    const all = baseList.length;
    let unassigned = 0;
    let underEnquiry = 0;
    let underReview = 0;
    let disposed = 0;

    let notAssigned = 0;
    let pending = 0;
    let complete = 0;
    let firRegister = 0;
    let firRegistered = 0;
    let correctionRequired = 0;

    for (const c of baseList) {
      const main = getMainComplaintStatus(c);
      if (main === "Not Assigned") notAssigned++;
      else if (main === "Pending") pending++;
      else if (main === "Complete") complete++;
      else if (main === "FIR Register") firRegister++;
      else if (main === "FIR Registered") firRegistered++;
      else if (main === "Correction Required") correctionRequired++;

      if (c.status === "REGISTERED") {
        unassigned++;
      } else if (c.status === "ENQUIRY_IN_PROGRESS" || c.status === "ASSIGNED_TO_EO") {
        underEnquiry++;
      } else if (
        c.status === "REPORT_SUBMITTED" ||
        c.status === "PENDING_SHO_REVIEW" ||
        c.status === "INTERIM_REPORT_SUBMITTED"
      ) {
        underReview++;
      } else if (
        c.status.startsWith("DISPOSED_") ||
        c.status === "RECOMMENDED_FOR_FIR" ||
        c.status === "TRANSFERRED_OTHER_PS"
      ) {
        disposed++;
      }
    }

    return { all, unassigned, underEnquiry, underReview, disposed, notAssigned, pending, complete, firRegister, firRegistered, correctionRequired };
  },

  async createComplaint(
    input: ComplaintRegistrationInput,
    officerName: string,
    station: string,
    district: string,
    officerPno: string = "04291882"
  ): Promise<ComplaintItem> {
    const isDirectFir = Boolean(input.directSendToFir || input.directSendToFirChoice === "YES");
    const initialStatus: ComplaintStatus = isDirectFir ? "FIR_REGISTER" : "REGISTERED";
    const initialWorkflow: WorkflowState = isDirectFir ? "FIR_REGISTER" : "NOT_ASSIGNED";
    const generatedComplaintNumber = `HAR-KKR-2026-CMP-${String(Math.floor(1000 + Math.random() * 9000))}`;

    const newComplaint: ComplaintItem = {
      id: `cmp_${Date.now()}`,
      complaintNumber: generatedComplaintNumber,
      source: input.source,
      category: input.category,
      categoryDisplay: input.category.replace(/_/g, " "),
      priority: input.priority,
      status: initialStatus,
      directSendToFir: isDirectFir,
      directSendToFirChoice: isDirectFir ? "YES" : "NO",
      incidentDate: input.incidentDate,
      incidentTime: input.incidentTime,
      isIncidentDateTimeKnown: input.isIncidentDateTimeKnown,
      incidentPlace: input.incidentPlace,
      incidentLandmark: input.incidentLandmark,
      incidentDetails: input.incidentDetails || "Written complaint filed",
      complainantName: input.complainantName,
      complainantRelationType: input.complainantRelationType || "S/O",
      complainantRelativeName: input.complainantRelativeName || input.complainantFatherSpouse || "",
      complainantFatherSpouse: input.complainantRelativeName || input.complainantFatherSpouse || "",
      complainantGender: input.complainantGender || "MALE",
      complainantAge: input.complainantAge,
      complainantMobile: input.complainantMobile,
      complainantAltPhone: input.complainantAltPhone,
      complainantAddress: input.complainantAddress,
      complainantCity: input.complainantCity,
      complainantDistrict: input.complainantDistrict,
      complainantState: input.complainantState || "Haryana",
      complainantCountry: input.complainantCountry || "India",
      complainantNationality: input.complainantNationality || "Indian",
      complainantPermanentAddress: input.complainantPermanentAddress || input.complainantAddress,
      complainantPermanentCity: input.complainantPermanentCity || input.complainantCity,
      complainantPermanentDistrict: input.complainantPermanentDistrict || input.complainantDistrict,
      complainantPermanentState: input.complainantPermanentState || input.complainantState || "Haryana",
      complainantPermanentCountry: input.complainantPermanentCountry || input.complainantCountry || "India",
      additionalComplainants: input.additionalComplainants || [],
      // 4. Complaint Details
      intakeMode: input.intakeMode || input.source,
      complaintSubject: input.complaintSubject || (input as any).subject || input.complaintDescription || "",
      subject: input.complaintSubject || (input as any).subject || input.complaintDescription || "",
      complaintDescription: input.complaintDescription,
      isFirRegistered: input.isFirRegistered || false,
      firNumber: input.firNumber,
      firDate: input.firDate,
      complaintAgeType: input.complaintAgeType || "FRESH",
      complaintClassification: input.complaintClassification,
      complaintPurpose: input.complaintPurpose,
      isAccusedKnown: input.isAccusedKnown,
      accusedList: (input.accusedList && input.accusedList.length > 0)
        ? input.accusedList
        : input.accusedName
        ? [
            {
              name: input.accusedName,
              fatherName: input.accusedFatherName,
              address: input.accusedAddress,
              phone: input.accusedPhone,
              relationWithComplainant: input.relationWithComplainant,
            },
          ]
        : [],
      policeStation: station,
      district: district,
      registeredBy: officerName,
      linkedComplaintNumber: input.linkedComplaintNumber,
      crossComplaintNumber: input.isCrossComplaint ? input.linkedComplaintNumber : undefined,
      isCrossComplaint: input.isCrossComplaint,
      attachments: input.attachments || [],
      documents: [
        ...((input as any).documents || []),
        ...(input.attachments || []).map((att) => ({
          id: `doc_${att.id}`,
          complaintId: generatedComplaintNumber,
          fileName: att.name,
          fileCategory: att.category.toUpperCase(),
          uploadedBy: officerName,
          uploadedAt: att.uploadedAt || new Date().toISOString(),
          fileSize: typeof att.size === 'number' ? `${(att.size / 1024).toFixed(1)} KB` : String(att.size || '10 KB'),
          fileUrl: att.dataUrl,
          dataUrl: att.dataUrl,
          description: att.description || "Uploaded during complaint registration",
        })),
      ].filter((doc, idx, arr) => arr.findIndex((d) => d.fileName.toLowerCase() === doc.fileName.toLowerCase()) === idx),
      daysPending: 0,
      workflowState: initialWorkflow,
      mhcName: officerName || "HC Devinder Kumar",
      mhcRank: "Head Constable (MHC)",
      mhcBeltNumber: officerPno === "05192834" ? "889/KKR" : (officerPno ? `${officerPno.slice(-3)}/KKR` : "889/KKR"),
      mhcPhone: "9813098765",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const initialAudit: ComplaintAuditRecord = {
      id: `audit_${Date.now()}_reg`,
      complaintId: newComplaint.id,
      action: "COMPLAINT_REGISTERED",
      actionLabel: isDirectFir ? "Complaint Registered (Direct FIR)" : "Complaint Registered",
      performedBy: officerName,
      userPno: officerPno,
      userRole: "MHC_GD_INCHARGE",
      timestamp: new Date().toISOString(),
      details: isDirectFir
        ? `Citizen complaint ${generatedComplaintNumber} registered with Direct send to FIR: YES. Status: FIR Register. Dispatched directly to SHO for formal FIR registration.`
        : `Citizen complaint ${generatedComplaintNumber} registered in CMS register. Status: Not Assigned.`,
    };
    newComplaint.auditTrail = [initialAudit];

    complaintsStore.unshift(newComplaint);
    saveComplaintsToStorage(complaintsStore);
    syncComplaintsToServer(complaintsStore);

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("complaints_updated", { detail: newComplaint }));
    }

    // Complaint registered directly without auto-entry in Roznamcha
    return newComplaint;
  },

  async assignEnquiryOfficer(
    complaintId: string,
    eoId: string,
    eoName: string,
    eoRank: string,
    eoPno: string,
    assignedByName: string,
    directions: string = "Conduct preliminary spot verification & verify facts as per Section 173(3) BNSS.",
    targetDays: number = 14
  ): Promise<{ complaint: ComplaintItem; notification: OfficerNotification }> {
    const index = complaintsStore.findIndex((c) => c.id === complaintId);
    if (index === -1) throw new Error("Complaint not found");

    const eoRoster = MOCK_ENQUIRY_OFFICERS.find((e) => e.id === eoId);
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + targetDays);
    const nowIso = new Date().toISOString();

    const updated: ComplaintItem = {
      ...complaintsStore[index],
      assignedEoId: eoId,
      assignedEoName: eoName,
      assignedEoRank: eoRank,
      assignedEoPno: eoPno,
      assignedEoBeltNumber: (eoRoster as any)?.beltNumber || eoPno,
      assignedEoPhone: (eoRoster as any)?.phone || "9812034567",
      mhcName: complaintsStore[index].mhcName || assignedByName || "HC Devinder Kumar",
      mhcRank: complaintsStore[index].mhcRank || "Head Constable (MHC)",
      mhcBeltNumber: complaintsStore[index].mhcBeltNumber || "889/KKR",
      mhcPhone: complaintsStore[index].mhcPhone || "9813098765",
      assignedAt: nowIso,
      assignedDirections: directions,
      assignedRosterDuty: eoRoster?.rosterDuty || "Investigation Duty",
      targetResolutionDate: targetDate.toISOString().split("T")[0],
      status: "ASSIGNED_TO_EO" as ComplaintStatus,
      workflowState: "PENDING",
      isSentToSho: false,
      shoActionRequired: false,
      updatedAt: nowIso,
    };

    const assignAudit: ComplaintAuditRecord = {
      id: `audit_${Date.now()}_assign`,
      complaintId: updated.id,
      action: "EO_ASSIGNED",
      actionLabel: `EO Assigned: ${eoName} (${eoRank})`,
      performedBy: assignedByName,
      userRole: "SHO",
      timestamp: nowIso,
      details: `Enquiry Officer assigned: ${eoName}, PNO: ${eoPno}. Target: ${targetDays} days. Directions: "${directions}". Status changed to Pending.`,
    };

    if (!updated.auditTrail) updated.auditTrail = [];
    updated.auditTrail.unshift(assignAudit);

    complaintsStore[index] = updated;
    saveComplaintsToStorage(complaintsStore);
    syncComplaintsToServer(complaintsStore);

    // Create & dispatch notification to the respected Enquiry Officer
    const notification: OfficerNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      recipientPno: eoPno,
      recipientName: eoName,
      complaintId: updated.id,
      complaintNumber: updated.complaintNumber,
      title: `New Case Assigned: ${updated.complaintNumber}`,
      message: `You have been designated Enquiry Officer by ${assignedByName}. Target: ${targetDays} days. Directions: "${directions}"`,
      directions: directions,
      priority: updated.priority,
      createdAt: new Date().toISOString(),
      read: false,
    };

    officerNotificationsStore.unshift(notification);
    saveNotificationsToStorage(officerNotificationsStore);

    // AUTO-RECORD IN GENERAL DIARY (ROZNAMCHA AAM) - PPR 22.48
    const nowTime = new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    await GeneralDiaryService.addEntry(
      `Enquiry Officer Marked: ${updated.complaintNumber} -> ${eoName} (${eoRank})`,
      `At ${nowTime} hours, Citizen Complaint ${updated.complaintNumber} (${updated.categoryDisplay}) was officially assigned to Enquiry Officer ${eoName}, ${eoRank}, PNO ${eoPno} (Roster: ${eoRoster?.rosterDuty || "Investigation"}). Supervisory Directions: "${directions}". Resolution timeline targeted for ${targetDays} days (${targetDate.toISOString().split("T")[0]}). Assigned by ${assignedByName}. Notification dispatched to EO desk.`,
      "COMPLAINT_RECEIPT",
      assignedByName,
      "04291882",
      updated.policeStation,
      updated.complaintNumber
    );

    return { complaint: updated, notification };
  },

  async getOfficerNotifications(pno?: string): Promise<OfficerNotification[]> {
    if (pno) {
      return officerNotificationsStore.filter((n) => n.recipientPno === pno);
    }
    return [...officerNotificationsStore];
  },

  async getDashboardMetrics() {
    const total = complaintsStore.length;
    let notAssigned = 0;
    let pending = 0;
    let complete = 0;
    let firRegistered = 0;

    for (const c of complaintsStore) {
      const main = getMainComplaintStatus(c);
      if (main === "Not Assigned") notAssigned++;
      else if (main === "Pending") pending++;
      else if (main === "Complete") complete++;
      else if (main === "FIR Registered") firRegistered++;
    }

    const pendingEnquiry = complaintsStore.filter(
      (c) => c.status === "ASSIGNED_TO_EO" || c.status === "ENQUIRY_IN_PROGRESS"
    ).length;
    const pendingAssignment = complaintsStore.filter((c) => c.status === "REGISTERED" || !c.assignedEoName).length;
    const pendingApproval = complaintsStore.filter(
      (c) => c.status === "REPORT_SUBMITTED" || c.status === "RECOMMENDED_FOR_FIR" || Boolean(c.isSentToSho)
    ).length;
    const disposed = complete;
    const criticalUrgent = complaintsStore.filter(
      (c) => c.priority === "URGENT" || c.priority === "CM_WINDOW_VIP" || c.priority === "CRITICAL_SENSITIVE"
    ).length;

    return {
      total,
      notAssigned,
      pending,
      complete,
      firRegistered,
      pendingEnquiry,
      pendingAssignment,
      pendingApproval,
      disposed,
      criticalUrgent,
      overdueEnquiries: complaintsStore.filter((c) => c.daysPending > 15).length,
    };
  },

  checkComplaintIntelligence(input: {
    complainantName: string;
    complainantFatherSpouse?: string;
    complainantMobile: string;
    complainantAddress?: string;
    accusedName?: string;
    accusedFatherName?: string;
    accusedPhone?: string;
    accusedAddress?: string;
    incidentPlace?: string;
    incidentDetails?: string;
  }): IntelligenceCheckResult {
    const norm = (s?: string) => (s || "").trim().toLowerCase();
    const cName = norm(input.complainantName);
    const cMobile = (input.complainantMobile || "").replace(/\D/g, "");
    const aName = norm(input.accusedName);
    const aMobile = (input.accusedPhone || "").replace(/\D/g, "");
    const place = norm(input.incidentPlace);
    const details = norm(input.incidentDetails);

    const crossComplaints: CrossComplaintMatch[] = [];
    const linkedComplaints: LinkedComplaintMatch[] = [];
    const repeatComplaints: ComplaintItem[] = [];

    // 1. Scan across existing complaints in store
    complaintsStore.forEach((c) => {
      const existingCName = norm(c.complainantName);
      const existingCMobile = (c.complainantMobile || "").replace(/\D/g, "");
      const existingAccusedNames = c.accusedList.map((a) => norm(a.name));
      const existingAccusedPhones = c.accusedList.map((a) => (a.phone || "").replace(/\D/g, "")).filter(Boolean);
      const existingPlace = norm(c.incidentPlace);
      const existingDetails = norm(c.incidentDetails);

      // Check Repeat Complainant (Same Mobile or matching Name)
      const isSameComplainant =
        (cMobile && cMobile.length === 10 && existingCMobile === cMobile) ||
        (cName && existingCName && (existingCName === cName || existingCName.includes(cName) || cName.includes(existingCName)) && cName.length > 3);

      if (isSameComplainant) {
        repeatComplaints.push(c);
      }

      // Check Cross Complaint:
      // Case A: The current accused has previously filed a complaint against current complainant!
      const accusedIsOldComplainant =
        (aName && aName.length > 2 && (existingCName.includes(aName) || aName.includes(existingCName))) ||
        (aMobile && aMobile.length === 10 && existingCMobile === aMobile);

      const complainantIsOldAccused =
        (cName && cName.length > 2 && existingAccusedNames.some((an) => an.includes(cName) || cName.includes(an))) ||
        (cMobile && cMobile.length === 10 && existingAccusedPhones.includes(cMobile));

      if (accusedIsOldComplainant || (accusedIsOldComplainant && complainantIsOldAccused)) {
        crossComplaints.push({
          existingComplaint: c,
          matchType: "CROSS_COMPLAINT",
          reason: `Opposite Party "${input.accusedName || "Accused"}" previously filed Complaint #${c.complaintNumber} on ${c.incidentDate} alleging offences against ${c.accusedList.map((a) => a.name).join(", ") || "current party"}!`,
          severity: "HIGH",
        });
      }

      // Check Linked / Duplicate Complaints
      let score = 0;
      const matchedOn: string[] = [];

      if (cMobile && existingCMobile === cMobile) {
        score += 45;
        matchedOn.push("Same Complainant Mobile");
      }
      if (place && existingPlace && (existingPlace.includes(place) || place.includes(existingPlace)) && place.length > 3) {
        score += 30;
        matchedOn.push("Matching Incident Location");
      }
      if (aName && existingAccusedNames.some((an) => an.includes(aName) || aName.includes(an))) {
        score += 25;
        matchedOn.push("Same Accused Person");
      }
      if (details && existingDetails) {
        const words = details.split(/\s+/).filter((w) => w.length > 4);
        const matchWords = words.filter((w) => existingDetails.includes(w));
        if (matchWords.length >= 2) {
          score += 20;
          matchedOn.push(`Narrative keywords (${matchWords.slice(0, 2).join(", ")})`);
        }
      }

      if (score >= 40 && !crossComplaints.some((x) => x.existingComplaint.id === c.id)) {
        linkedComplaints.push({
          existingComplaint: c,
          similarityScore: Math.min(score, 98),
          matchedOn,
          summary: `Complaint matches on ${matchedOn.join(", ")}`,
        });
      }
    });

    // 2. Scan Prior FIR Database
    const priorFirs: PriorFirMatch[] = [];
    MOCK_HISTORICAL_FIRS.forEach((fir) => {
      const firComp = norm(fir.complainantName);
      const firCompPhone = (fir.complainantPhone || "").replace(/\D/g, "");
      const firAccused = fir.accusedNames.map((n) => norm(n));
      const firAccusedPhones = (fir.accusedPhones || []).map((p) => p.replace(/\D/g, ""));

      let matchedParty: "COMPLAINANT" | "ACCUSED" | "BOTH" | "LOCATION" | null = null;
      let partyRole: "ACCUSED_IN_FIR" | "COMPLAINANT_IN_FIR" | "NAMED_PERSON" = "NAMED_PERSON";
      let reason = "";

      const accusedInFir =
        (aName && aName.length > 2 && firAccused.some((an) => an.includes(aName) || aName.includes(an))) ||
        (aMobile && aMobile.length === 10 && firAccusedPhones.includes(aMobile));

      const compInFirAsAccused =
        (cName && cName.length > 2 && firAccused.some((an) => an.includes(cName) || cName.includes(an))) ||
        (cMobile && cMobile.length === 10 && firAccusedPhones.includes(cMobile));

      const compInFirAsComplainant =
        (cName && cName.length > 2 && (firComp.includes(cName) || cName.includes(firComp))) ||
        (cMobile && cMobile.length === 10 && firCompPhone === cMobile);

      if (accusedInFir && compInFirAsAccused) {
        matchedParty = "BOTH";
        partyRole = "ACCUSED_IN_FIR";
        reason = `Both Current Accused (${input.accusedName}) and Complainant (${input.complainantName}) are listed in ${fir.firNumber}!`;
      } else if (accusedInFir) {
        matchedParty = "ACCUSED";
        partyRole = "ACCUSED_IN_FIR";
        reason = `Accused ${input.accusedName} is named as an accused in ${fir.firNumber} (${fir.sectionsOfLaw})`;
      } else if (compInFirAsAccused) {
        matchedParty = "COMPLAINANT";
        partyRole = "ACCUSED_IN_FIR";
        reason = `Complainant ${input.complainantName} was previously chargesheeted/accused in ${fir.firNumber}!`;
      } else if (compInFirAsComplainant) {
        matchedParty = "COMPLAINANT";
        partyRole = "COMPLAINANT_IN_FIR";
        reason = `Complainant ${input.complainantName} previously registered ${fir.firNumber} at ${fir.policeStation}`;
      }

      if (matchedParty) {
        priorFirs.push({
          fir,
          matchedParty,
          partyRole,
          reason,
        });
      }
    });

    const repeatCount = repeatComplaints.length;
    const repeatRisk =
      repeatCount >= 3
        ? "FREQUENT_COMPLAINANT"
        : repeatCount >= 1
        ? "MULTIPLE_PRIOR"
        : "FIRST_TIME";

    const hasAlerts = crossComplaints.length > 0 || repeatCount > 0 || linkedComplaints.length > 0 || priorFirs.length > 0;

    return {
      hasAlerts,
      crossComplaints,
      repeatHistory: {
        totalPreviousComplaints: repeatCount,
        complaints: repeatComplaints,
        riskLevel: repeatRisk,
      },
      linkedComplaints: linkedComplaints.sort((a, b) => b.similarityScore - a.similarityScore),
      priorFirs,
      scannedAt: new Date().toISOString(),
    };
  },

  async addEnquiryNote(
    complaintId: string,
    note: {
      officerName: string;
      officerRank: string;
      officerPno: string;
      noteType: 'SPOT_VISIT' | 'WITNESS_EXAMINATION' | 'ACCUSED_EXAMINATION' | 'DOCUMENT_VERIFICATION' | 'INTERIM_PROGRESS' | 'GENERAL';
      content: string;
      location?: string;
      attachment?: ComplaintEvidenceAttachment;
    }
  ): Promise<EnquiryNoteItem> {
    const index = complaintsStore.findIndex((c) => c.id === complaintId || c.complaintNumber === complaintId);
    if (index === -1) throw new Error("Complaint not found");

    const newNote: EnquiryNoteItem = {
      id: `note_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      complaintId: complaintsStore[index].id,
      officerName: note.officerName,
      officerRank: note.officerRank,
      officerPno: note.officerPno,
      noteType: note.noteType,
      content: note.content,
      location: note.location,
      attachment: note.attachment,
      createdAt: new Date().toISOString(),
    };

    if (!complaintsStore[index].enquiryNotes) {
      complaintsStore[index].enquiryNotes = [];
    }
    complaintsStore[index].enquiryNotes!.unshift(newNote);

    // If attachment provided with enquiry note, also add to complaint attachments
    if (note.attachment) {
      if (!complaintsStore[index].attachments) {
        complaintsStore[index].attachments = [];
      }
      complaintsStore[index].attachments!.unshift(note.attachment);
    }

    // Add to timeline
    this.addTimelineEvent(complaintsStore[index].id, {
      title: `Enquiry Note Recorded: ${note.noteType.replace(/_/g, " ")}${note.attachment ? ` (${note.attachment.category.toUpperCase()} Attached)` : ""}`,
      description: note.content.slice(0, 160) + (note.content.length > 160 ? "..." : ""),
      category: "ENQUIRY_NOTE",
      officerName: note.officerName,
      officerRank: note.officerRank,
      timestamp: new Date().toISOString(),
      documentName: note.attachment?.name,
    });

    return newNote;
  },

  async addEvidence(
    complaintId: string,
    evidence: {
      name: string;
      size: number;
      type: string;
      category: 'document' | 'video' | 'audio' | 'image' | 'other';
      dataUrl?: string;
      description?: string;
      officerName?: string;
    }
  ): Promise<ComplaintEvidenceAttachment> {
    const index = complaintsStore.findIndex((c) => c.id === complaintId || c.complaintNumber === complaintId);
    if (index === -1) throw new Error("Complaint not found");

    const newEvidence: ComplaintEvidenceAttachment = {
      id: `ev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: evidence.name,
      size: evidence.size,
      type: evidence.type,
      category: evidence.category,
      dataUrl: evidence.dataUrl,
      description: evidence.description,
      uploadedAt: new Date().toISOString(),
    };

    if (!complaintsStore[index].attachments) {
      complaintsStore[index].attachments = [];
    }
    complaintsStore[index].attachments!.unshift(newEvidence);

    // Also mirror to documents repository so it appears in Documents tab
    if (!complaintsStore[index].documents) {
      complaintsStore[index].documents = [];
    }
    const mirroredDoc: ComplaintDocumentItem = {
      id: `doc_${newEvidence.id}`,
      complaintId: complaintsStore[index].id,
      fileName: newEvidence.name,
      fileCategory: newEvidence.category.toUpperCase(),
      uploadedBy: evidence.officerName || "Enquiry Officer",
      uploadedAt: newEvidence.uploadedAt,
      fileSize: typeof newEvidence.size === 'number' ? `${(newEvidence.size / 1024).toFixed(1)} KB` : String(newEvidence.size || '10 KB'),
      fileUrl: newEvidence.dataUrl,
      dataUrl: newEvidence.dataUrl,
      description: newEvidence.description || "Evidence attachment",
    };
    complaintsStore[index].documents!.unshift(mirroredDoc);

    // Add to timeline
    this.addTimelineEvent(complaintsStore[index].id, {
      title: `Evidence Attached: ${evidence.name}`,
      description: `Format: ${evidence.category.toUpperCase()} • Description: ${evidence.description || "Digital evidence attached to complaint file"}`,
      category: "EVIDENCE",
      officerName: evidence.officerName || "Enquiry Officer",
      timestamp: new Date().toISOString(),
      documentName: evidence.name,
    });

    return newEvidence;
  },

  async addDocument(
    complaintId: string,
    doc: {
      fileName: string;
      fileCategory: string;
      fileSize: string;
      fileUrl?: string;
      dataUrl?: string;
      contentHtml?: string;
      description?: string;
      uploadedBy: string;
    }
  ): Promise<ComplaintDocumentItem> {
    const index = complaintsStore.findIndex((c) => c.id === complaintId || c.complaintNumber === complaintId);
    if (index === -1) throw new Error("Complaint not found");

    const newDoc: ComplaintDocumentItem = {
      id: `doc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      complaintId: complaintsStore[index].id,
      fileName: doc.fileName,
      fileCategory: doc.fileCategory,
      uploadedBy: doc.uploadedBy,
      uploadedAt: new Date().toISOString(),
      fileSize: doc.fileSize,
      fileUrl: doc.fileUrl || doc.dataUrl,
      dataUrl: doc.dataUrl || doc.fileUrl,
      contentHtml: doc.contentHtml,
      description: doc.description,
    };

    if (!complaintsStore[index].documents) {
      complaintsStore[index].documents = [];
    }
    complaintsStore[index].documents!.unshift(newDoc);

    // Add to timeline
    this.addTimelineEvent(complaintsStore[index].id, {
      title: `Official Document Uploaded: ${doc.fileName}`,
      description: `Category: ${doc.fileCategory} • Size: ${doc.fileSize}`,
      category: "DOCUMENT",
      officerName: doc.uploadedBy,
      timestamp: new Date().toISOString(),
      documentName: doc.fileName,
    });

    return newDoc;
  },

  addTimelineEvent(
    complaintId: string,
    event: {
      title: string;
      description: string;
      category: ComplaintTimelineEvent['category'];
      officerName: string;
      officerRank?: string;
      timestamp: string;
      documentName?: string;
    }
  ): ComplaintTimelineEvent {
    const index = complaintsStore.findIndex((c) => c.id === complaintId || c.complaintNumber === complaintId);
    if (index === -1) throw new Error("Complaint not found");

    const newEvent: ComplaintTimelineEvent = {
      id: `tl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      complaintId: complaintsStore[index].id,
      title: event.title,
      description: event.description,
      category: event.category,
      officerName: event.officerName,
      officerRank: event.officerRank,
      timestamp: event.timestamp || new Date().toISOString(),
      documentName: event.documentName,
    };

    if (!complaintsStore[index].timeline) {
      complaintsStore[index].timeline = [];
    }
    complaintsStore[index].timeline!.unshift(newEvent);
    saveComplaintsToStorage(complaintsStore);

    return newEvent;
  },

  async transferComplaint(
    complaintId: string,
    destinationStation: string,
    reason: string,
    officerName: string
  ): Promise<ComplaintItem> {
    const index = complaintsStore.findIndex((c) => c.id === complaintId || c.complaintNumber === complaintId);
    if (index === -1) throw new Error("Complaint not found");

    complaintsStore[index] = {
      ...complaintsStore[index],
      status: "TRANSFERRED_OTHER_PS",
      policeStation: `${complaintsStore[index].policeStation} ➔ Transferred to ${destinationStation}`,
      updatedAt: new Date().toISOString(),
    };

    this.addTimelineEvent(complaintsStore[index].id, {
      title: `Complaint Transferred to ${destinationStation}`,
      description: `Jurisdictional transfer ordered by ${officerName}. Reason: "${reason}"`,
      category: "TRANSFER",
      officerName,
      timestamp: new Date().toISOString(),
    });

    return complaintsStore[index];
  },

  async linkComplaint(
    complaintId: string,
    targetComplaintNumber: string,
    relationType: string = "LINKED"
  ): Promise<ComplaintItem> {
    const index = complaintsStore.findIndex((c) => c.id === complaintId || c.complaintNumber === complaintId);
    if (index === -1) throw new Error("Complaint not found");

    complaintsStore[index] = {
      ...complaintsStore[index],
      linkedComplaintNumber: targetComplaintNumber,
      isCrossComplaint: relationType === "CROSS",
      crossComplaintNumber: relationType === "CROSS" ? targetComplaintNumber : undefined,
      updatedAt: new Date().toISOString(),
    };

    this.addTimelineEvent(complaintsStore[index].id, {
      title: `Complaint Linked with ${targetComplaintNumber}`,
      description: `Relation marked as: ${relationType}. Cross-referencing files for unified enquiry.`,
      category: "STATUS_CHANGE",
      officerName: "Investigating Officer",
      timestamp: new Date().toISOString(),
    });

    return complaintsStore[index];
  },

  async issueNcrReference(
    complaintId: string,
    ncrNumber: string,
    sections: string,
    officerName: string
  ): Promise<ComplaintItem> {
    const index = complaintsStore.findIndex((c) => c.id === complaintId || c.complaintNumber === complaintId);
    if (index === -1) throw new Error("Complaint not found");

    complaintsStore[index] = {
      ...complaintsStore[index],
      status: "DISPOSED_CIVIL_NATURE",
      updatedAt: new Date().toISOString(),
    };

    this.addTimelineEvent(complaintsStore[index].id, {
      title: `NCR Issued: ${ncrNumber}`,
      description: `Non-Cognizable Report generated under Section 174 BNSS (${sections}). Complainant instructed on magistrate remedy.`,
      category: "STATUS_CHANGE",
      officerName,
      timestamp: new Date().toISOString(),
      documentName: `NCR-${ncrNumber}.pdf`,
    });

    return complaintsStore[index];
  },

  async linkFir(
    complaintId: string,
    firNumber: string,
    sections: string,
    officerName: string
  ): Promise<ComplaintItem> {
    const index = complaintsStore.findIndex((c) => c.id === complaintId || c.complaintNumber === complaintId);
    if (index === -1) throw new Error("Complaint not found");

    complaintsStore[index] = {
      ...complaintsStore[index],
      status: "RECOMMENDED_FOR_FIR",
      isFirRegistered: true,
      firNumber: firNumber,
      firSections: sections,
      firDate: new Date().toISOString(),
      firRegisteredBy: officerName,
      dispositionType: "FIR_REGISTERED",
      updatedAt: new Date().toISOString(),
    };

    this.addTimelineEvent(complaintsStore[index].id, {
      title: `Converted to FIR: ${firNumber}`,
      description: `Cognizable offense substantiated under BNS sections ${sections}. Formal regular FIR ${firNumber} registered at Police Station by ${officerName}.`,
      category: "STATUS_CHANGE",
      officerName,
      timestamp: new Date().toISOString(),
      documentName: `FIR-${firNumber}.pdf`,
    });

    saveComplaintsToStorage(complaintsStore);

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("complaints_updated"));
    }

    return complaintsStore[index];
  },

  async requestProgressReport(
    complaintId: string,
    shoName: string,
    shoPno: string,
    remarks: string,
    deadlineHours: number = 24
  ): Promise<ComplaintItem> {
    const index = complaintsStore.findIndex((c) => c.id === complaintId || c.complaintNumber === complaintId);
    if (index === -1) throw new Error("Complaint not found");

    const complaint = complaintsStore[index];
    const now = new Date();
    const updated: ComplaintItem = {
      ...complaint,
      progressReportRequested: true,
      progressReportRequestedAt: now.toISOString(),
      progressReportRemarks: remarks,
      progressReportRequestedBy: shoName,
      updatedAt: now.toISOString(),
    };

    complaintsStore[index] = updated;

    // Dispatch formal notification to the assigned EO
    if (complaint.assignedEoPno) {
      const notification: OfficerNotification = {
        id: `notif_${Date.now()}_prog`,
        recipientPno: complaint.assignedEoPno,
        recipientName: complaint.assignedEoName || "Assigned Enquiry Officer",
        complaintId: complaint.id,
        complaintNumber: complaint.complaintNumber,
        title: `URGENT: SHO Demanded Progress Report (${complaint.complaintNumber})`,
        message: `SHO ${shoName} has requested an urgent progress report within ${deadlineHours}h. Directive: "${remarks}"`,
        directions: remarks,
        priority: "URGENT",
        createdAt: now.toISOString(),
        read: false,
      };
      officerNotificationsStore.unshift(notification);
    }

    // Add supervisory directive event into case timeline
    this.addTimelineEvent(complaint.id, {
      title: `Supervisory Directive: SHO Demanded Progress Report`,
      description: `SHO ${shoName} (PNO: ${shoPno}) ordered interim progress submission from EO ${complaint.assignedEoName || "Officer"} within ${deadlineHours} hours. Instructions: "${remarks}"`,
      category: "PROGRESS_REQUEST",
      officerName: shoName,
      officerRank: "Inspector / SHO",
      timestamp: now.toISOString(),
    });

    // Auto-record in Station General Diary
    const nowTime = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    await GeneralDiaryService.addEntry(
      `SHO Directive: Progress Report Demanded - ${complaint.complaintNumber}`,
      `At ${nowTime} hours, SHO ${shoName} issued formal supervisory directions to Enquiry Officer ${complaint.assignedEoName || "Officer"} for expedited enquiry report in ${complaint.complaintNumber}. Instructions: "${remarks}". Compliance window: ${deadlineHours} hours.`,
      "PATROL_DEPARTURE_RETURN",
      shoName,
      shoPno,
      complaint.policeStation,
      complaint.complaintNumber
    );

    return updated;
  },

  async deleteEnquiryNote(
    complaintId: string,
    noteId: string,
    officerName: string
  ): Promise<ComplaintItem> {
    const index = complaintsStore.findIndex((c) => c.id === complaintId || c.complaintNumber === complaintId);
    if (index === -1) throw new Error("Complaint not found");

    const note = (complaintsStore[index].enquiryNotes || []).find((n) => n.id === noteId);
    complaintsStore[index] = {
      ...complaintsStore[index],
      enquiryNotes: (complaintsStore[index].enquiryNotes || []).filter((n) => n.id !== noteId),
      updatedAt: new Date().toISOString(),
    };

    this.addTimelineEvent(complaintsStore[index].id, {
      title: `Enquiry Note Expunged by EO`,
      description: `Note titled "${note?.noteType.replace(/_/g, " ") || "Enquiry Note"}" removed by assigned Enquiry Officer ${officerName}.`,
      category: "ENQUIRY_NOTE",
      officerName,
      timestamp: new Date().toISOString(),
    });

    return complaintsStore[index];
  },

  async deleteEvidence(
    complaintId: string,
    evidenceId: string,
    officerName: string
  ): Promise<ComplaintItem> {
    const index = complaintsStore.findIndex((c) => c.id === complaintId || c.complaintNumber === complaintId);
    if (index === -1) throw new Error("Complaint not found");

    const ev = (complaintsStore[index].attachments || []).find((e) => e.id === evidenceId);
    complaintsStore[index] = {
      ...complaintsStore[index],
      attachments: (complaintsStore[index].attachments || []).filter((e) => e.id !== evidenceId),
      updatedAt: new Date().toISOString(),
    };

    this.addTimelineEvent(complaintsStore[index].id, {
      title: `Evidence Attachment Removed by EO`,
      description: `Attachment "${ev?.name || "Evidence file"}" purged from case docket by assigned Enquiry Officer ${officerName}.`,
      category: "EVIDENCE",
      officerName,
      timestamp: new Date().toISOString(),
    });

    return complaintsStore[index];
  },

  async deleteDocument(
    complaintId: string,
    docId: string,
    officerName: string
  ): Promise<ComplaintItem> {
    const index = complaintsStore.findIndex((c) => c.id === complaintId || c.complaintNumber === complaintId);
    if (index === -1) throw new Error("Complaint not found");

    const cleanDocId = docId.replace(/^doc_att_/, "").replace(/^doc_/, "");
    const doc = (complaintsStore[index].documents || []).find((d) => d.id === docId || d.id === cleanDocId);
    complaintsStore[index] = {
      ...complaintsStore[index],
      documents: (complaintsStore[index].documents || []).filter(
        (d) => d.id !== docId && d.id !== cleanDocId && `doc_${d.id}` !== docId
      ),
      attachments: (complaintsStore[index].attachments || []).filter(
        (a) => a.id !== docId && a.id !== cleanDocId && `doc_${a.id}` !== docId
      ),
      updatedAt: new Date().toISOString(),
    };

    this.addTimelineEvent(complaintsStore[index].id, {
      title: `Document Record Deleted`,
      description: `Document record "${doc?.fileName || "Document"}" removed by ${officerName}.`,
      category: "DOCUMENT",
      officerName,
      timestamp: new Date().toISOString(),
    });

    saveComplaintsToStorage(complaintsStore);
    return complaintsStore[index];
  },

  async addConfidentialDossier(
    complaintId: string,
    dossier: {
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
    }
  ): Promise<ComplaintItem> {
    const index = complaintsStore.findIndex((c) => c.id === complaintId || c.complaintNumber === complaintId);
    if (index === -1) throw new Error("Complaint not found");

    const newDossier: ConfidentialDossierItem = {
      id: `dos_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      complaintId: complaintsStore[index].id,
      officerName: dossier.officerName,
      officerRank: dossier.officerRank,
      officerPno: dossier.officerPno,
      category: dossier.category,
      title: dossier.title,
      content: dossier.content,
      referenceTag: dossier.referenceTag,
      attachmentName: dossier.attachmentName,
      attachmentDataUrl: dossier.attachmentDataUrl,
      attachmentType: dossier.attachmentType,
      attachmentSize: dossier.attachmentSize,
      createdAt: new Date().toISOString(),
    };

    if (!complaintsStore[index].confidentialDossier) {
      complaintsStore[index].confidentialDossier = [];
    }
    complaintsStore[index].confidentialDossier!.unshift(newDossier);
    saveComplaintsToStorage(complaintsStore);

    // Note: No public timeline or history generated - strictly private EO dossier
    return complaintsStore[index];
  },

  async deleteConfidentialDossier(
    complaintId: string,
    dossierId: string
  ): Promise<ComplaintItem> {
    const index = complaintsStore.findIndex((c) => c.id === complaintId || c.complaintNumber === complaintId);
    if (index === -1) throw new Error("Complaint not found");

    complaintsStore[index] = {
      ...complaintsStore[index],
      confidentialDossier: (complaintsStore[index].confidentialDossier || []).filter((d) => d.id !== dossierId),
      updatedAt: new Date().toISOString(),
    };
    saveComplaintsToStorage(complaintsStore);

    return complaintsStore[index];
  },

  addAuditRecord(
    complaintId: string,
    record: Omit<ComplaintAuditRecord, "id" | "timestamp" | "complaintId"> & { timestamp?: string; id?: string }
  ): ComplaintItem | undefined {
    const index = complaintsStore.findIndex((c) => c.id === complaintId || c.complaintNumber === complaintId);
    if (index === -1) return undefined;
    const newAudit: ComplaintAuditRecord = {
      id: record.id || `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      complaintId: complaintsStore[index].id,
      action: record.action,
      actionLabel: record.actionLabel,
      performedBy: record.performedBy,
      userPno: record.userPno,
      userRole: record.userRole,
      timestamp: record.timestamp || new Date().toISOString(),
      details: record.details,
      outcome: record.outcome,
      reason: record.reason,
      metadata: record.metadata,
    };
    if (!complaintsStore[index].auditTrail) {
      complaintsStore[index].auditTrail = [];
    }
    complaintsStore[index].auditTrail!.unshift(newAudit);
    complaintsStore[index].updatedAt = new Date().toISOString();
    saveComplaintsToStorage(complaintsStore);
    syncComplaintsToServer(complaintsStore);
    return complaintsStore[index];
  },

  async addComplaintReport(
    complaintId: string,
    report: Omit<ComplaintReportItem, "id" | "createdAt" | "complaintId"> & { id?: string; createdAt?: string; complaintId?: string },
    options?: { isNewVersion?: boolean }
  ): Promise<ComplaintItem> {
    const index = complaintsStore.findIndex((c) => c.id === complaintId || c.complaintNumber === complaintId);
    if (index === -1) throw new Error("Complaint not found");

    const existingReports = complaintsStore[index].reports || [];
    const nowIso = new Date().toISOString();
    const existingIndex = report.id ? existingReports.findIndex((r) => r.id === report.id) : -1;

    let targetReport: ComplaintReportItem;

    if (existingIndex !== -1 && !options?.isNewVersion) {
      // Update existing report in-place
      const prev = existingReports[existingIndex];
      targetReport = {
        ...prev,
        ...report,
        id: prev.id,
        complaintId: complaintsStore[index].id,
        versionNumber: prev.versionNumber || 1,
        title: report.title || prev.title,
        content: report.content !== undefined ? report.content : prev.content,
        contentHtml: report.contentHtml !== undefined ? report.contentHtml : prev.contentHtml,
        status: report.status || prev.status || "Saved in Complaint",
        lastModifiedBy: report.lastModifiedBy || report.officerName || prev.lastModifiedBy,
        updatedAt: nowIso,
        recommendationType: report.recommendationType || prev.recommendationType,
      };
      existingReports[existingIndex] = targetReport;
      complaintsStore[index].reports = [...existingReports];
    } else {
      // Create new report or new version
      const maxVer = existingReports.reduce((max, r) => Math.max(max, r.versionNumber || 1), 0);
      const versionNumber = options?.isNewVersion ? maxVer + 1 : (report.versionNumber || maxVer + 1);

      targetReport = {
        id: (options?.isNewVersion ? null : report.id) || `rep_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        complaintId: complaintsStore[index].id,
        versionNumber,
        title: report.title,
        reportType: report.reportType || "RECOMMENDATION_REPORT",
        reportTypeLabel: report.reportTypeLabel || "Enquiry Report",
        dispatchNo: report.dispatchNo,
        generatedDate: report.generatedDate || nowIso,
        officerName: report.officerName || "Enquiry Officer",
        officerRank: report.officerRank,
        officerPno: report.officerPno,
        conclusionSummary: report.conclusionSummary,
        content: report.content,
        contentHtml: report.contentHtml,
        fileName: report.fileName,
        fileSize: report.fileSize,
        fileUrl: report.fileUrl,
        dataUrl: report.dataUrl,
        fileFormat: report.fileFormat || "TXT",
        isUploaded: report.isUploaded || false,
        createdAt: report.createdAt || nowIso,
        updatedAt: nowIso,
        createdBy: report.createdBy || report.officerName,
        lastModifiedBy: report.lastModifiedBy || report.officerName,
        status: report.status || "Saved in Complaint",
        recommendationType: report.recommendationType,
        isFirRecommended: report.isFirRecommended,
        selectedOutcome: report.selectedOutcome,
        analysisClassification: report.analysisClassification,
        analysisRationale: report.analysisRationale,
      };

      complaintsStore[index].reports = [targetReport, ...existingReports];
    }

    if (report.isFirRecommended) {
      complaintsStore[index].isRecommendedForFir = true;
      complaintsStore[index].recommendedAction = "RECOMMEND_FIR";
    }

    if (report.selectedOutcome) {
      complaintsStore[index].eoOutcome = report.selectedOutcome;
      if (report.selectedOutcome === "Complete") {
        complaintsStore[index].status = "COMPLETE";
        complaintsStore[index].workflowState = "COMPLETE";
      } else if (report.selectedOutcome === "Pending") {
        complaintsStore[index].status = "ENQUIRY_IN_PROGRESS";
        complaintsStore[index].workflowState = "PENDING";
      } else if (report.selectedOutcome === "FIR Recommend") {
        complaintsStore[index].status = "RECOMMENDED_FOR_FIR";
        complaintsStore[index].workflowState = "FIR_RECOMMENDED";
      }
    }

    complaintsStore[index].updatedAt = nowIso;
    saveComplaintsToStorage(complaintsStore);
    syncComplaintsToServer(complaintsStore);

    return complaintsStore[index];
  },

  async submitEoReportWithOutcome(
    complaintId: string,
    report: Omit<ComplaintReportItem, "id" | "createdAt" | "complaintId"> & { id?: string; createdAt?: string; complaintId?: string },
    outcome: EOOutcome,
    officerName: string,
    officerRank?: string,
    officerPno?: string,
    userRole?: string
  ): Promise<ComplaintItem> {
    const index = complaintsStore.findIndex((c) => c.id === complaintId || c.complaintNumber === complaintId);
    if (index === -1) throw new Error("Complaint not found");

    const complaint = complaintsStore[index];
    const nowIso = new Date().toISOString();
    const existingReports = complaint.reports || [];
    const versionNumber = existingReports.length + 1;

    const newReport: ComplaintReportItem = {
      id: report.id || `rep_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      complaintId: complaint.id,
      versionNumber,
      title: report.title,
      reportType: report.reportType,
      reportTypeLabel: report.reportTypeLabel,
      dispatchNo: report.dispatchNo,
      generatedDate: report.generatedDate || nowIso.split("T")[0],
      officerName: report.officerName || officerName,
      officerRank: report.officerRank || officerRank,
      officerPno: report.officerPno || officerPno,
      conclusionSummary: report.conclusionSummary,
      content: report.content,
      contentHtml: report.contentHtml,
      fileName: report.fileName,
      fileSize: report.fileSize,
      fileUrl: report.fileUrl,
      dataUrl: report.dataUrl,
      fileFormat: report.fileFormat,
      isUploaded: report.isUploaded,
      createdAt: report.createdAt || nowIso,
      recommendationType: report.recommendationType,
      isFirRecommended: outcome === "FIR Recommend" || report.isFirRecommended,
      selectedOutcome: outcome,
      analysisClassification: report.analysisClassification,
      analysisRationale: report.analysisRationale,
    };

    let nextStatus: ComplaintStatus = complaint.status;
    let nextWorkflowState: WorkflowState = complaint.workflowState || "PENDING";
    let isRecommendedForFir = complaint.isRecommendedForFir;
    let recommendedAction = complaint.recommendedAction;
    const wasRejected = complaint.shoDecision === "REJECT" || complaint.workflowState === "CORRECTION_REQUIRED";

    if (outcome === "Complete") {
      nextStatus = "COMPLETE";
      nextWorkflowState = "COMPLETE";
    } else if (outcome === "Pending") {
      nextStatus = "ENQUIRY_IN_PROGRESS";
      nextWorkflowState = "PENDING";
    } else if (outcome === "FIR Recommend") {
      nextStatus = "RECOMMENDED_FOR_FIR";
      isRecommendedForFir = true;
      recommendedAction = "RECOMMEND_FIR";
      nextWorkflowState = "FIR_RECOMMENDED";
    }

    complaintsStore[index] = {
      ...complaint,
      reports: [newReport, ...existingReports],
      status: nextStatus,
      workflowState: nextWorkflowState,
      eoOutcome: outcome,
      isRecommendedForFir,
      recommendedAction,
      shoDecision: outcome === "Complete" ? undefined : complaint.shoDecision,
      isSentToSho: outcome === "Complete" ? true : complaint.isSentToSho,
      shoActionRequired: outcome === "Complete" ? true : complaint.shoActionRequired,
      updatedAt: nowIso,
    };

    if (wasRejected && outcome === "Complete") {
      const shoNotif: OfficerNotification = {
        id: `notif_${Date.now()}_sho_resubmitted`,
        recipientPno: "04291882",
        recipientName: "Station House Officer (SHO)",
        complaintId: complaint.id,
        complaintNumber: complaint.complaintNumber,
        title: `REPORT RESUBMITTED: ${complaint.complaintNumber}`,
        message: `EO ${officerName} has corrected and resubmitted the enquiry report on ${complaint.complaintNumber}. Action required: Review and Approve or Reject.`,
        createdAt: nowIso,
        priority: "URGENT",
      };
      officerNotificationsStore.unshift(shoNotif);
      saveNotificationsToStorage(officerNotificationsStore);
    }

    // Add audit records
    this.addAuditRecord(complaint.id, {
      action: report.isUploaded ? "REPORT_UPLOADED" : "REPORT_SAVED",
      actionLabel: report.isUploaded ? `Report Uploaded (v${versionNumber})` : `Report Saved (v${versionNumber})`,
      performedBy: officerName,
      userPno: officerPno,
      userRole: userRole || "ENQUIRY_OFFICER",
      timestamp: nowIso,
      details: `${report.title} (${report.reportTypeLabel || report.reportType}) - File: ${report.fileName || "Draft proforma"}`,
      outcome,
    });

    this.addAuditRecord(complaint.id, {
      action: "EO_OUTCOME_SELECTED",
      actionLabel: `Outcome Selected: ${outcome}`,
      performedBy: officerName,
      userPno: officerPno,
      userRole: userRole || "ENQUIRY_OFFICER",
      timestamp: nowIso,
      outcome,
      details: `Enquiry Officer designated outcome as: "${outcome}". Current main status: ${getMainComplaintStatus(complaintsStore[index])}.`,
    });

    this.addTimelineEvent(complaint.id, {
      title: `Enquiry Report Recorded (v${versionNumber}) - Outcome: ${outcome}`,
      description: `EO ${officerName} recorded report "${report.title}". Outcome set to ${outcome}.`,
      category: "STATUS_CHANGE",
      officerName,
      timestamp: nowIso,
      documentName: report.fileName,
    });

    saveComplaintsToStorage(complaintsStore);
    syncComplaintsToServer(complaintsStore);

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("complaints_updated", { detail: complaintsStore[index] }));
    }

    return complaintsStore[index];
  },

  async sendReportToSho(
    complaintId: string,
    officerName: string,
    officerPno: string = "04291882",
    remarks?: string
  ): Promise<ComplaintItem> {
    const index = complaintsStore.findIndex((c) => c.id === complaintId || c.complaintNumber === complaintId);
    if (index === -1) throw new Error("Complaint not found");

    const complaint = complaintsStore[index];
    const nowIso = new Date().toISOString();

    const updatedReports = (complaint.reports || []).map((r, i) =>
      i === 0 ? { ...r, sentToSho: true, sentToShoAt: nowIso, sentToShoBy: officerName } : r
    );

    complaintsStore[index] = {
      ...complaint,
      reports: updatedReports,
      isSentToSho: true,
      sentToShoAt: nowIso,
      sentToShoBy: officerName,
      shoActionRequired: true,
      workflowState: "SENT_TO_SHO",
      updatedAt: nowIso,
    };

    // Audit record
    this.addAuditRecord(complaint.id, {
      action: "SENT_TO_SHO",
      actionLabel: "Report Sent to SHO for Decision",
      performedBy: officerName,
      userPno: officerPno,
      userRole: "ENQUIRY_OFFICER",
      timestamp: nowIso,
      details: remarks || `EO submitted completed enquiry report and outcome (${complaint.eoOutcome || "Pending"}) to Station House Officer (SHO).`,
    });

    // Timeline
    this.addTimelineEvent(complaint.id, {
      title: "Enquiry Report Dispatched to SHO",
      description: `Enquiry Officer ${officerName} submitted report to SHO for review and action. Remarks: ${remarks || "Awaiting SHO approval."}`,
      category: "STATUS_CHANGE",
      officerName,
      timestamp: nowIso,
    });

    // Officer Notification for SHO
    const shoNotif: OfficerNotification = {
      id: `notif_${Date.now()}_sho_action`,
      recipientPno: "04291882",
      recipientName: "Station House Officer (SHO)",
      complaintId: complaint.id,
      complaintNumber: complaint.complaintNumber,
      title: `ACTION REQUIRED: Report Submitted (${complaint.complaintNumber})`,
      message: `EO ${officerName} has submitted report with outcome "${complaint.eoOutcome || "Pending"}". Action required: Approve or Order Re-Enquiry.`,
      createdAt: nowIso,
      priority: complaint.priority === "ROUTINE" ? "URGENT" : "CRITICAL",
    };
    officerNotificationsStore.unshift(shoNotif);
    saveNotificationsToStorage(officerNotificationsStore);

    saveComplaintsToStorage(complaintsStore);
    syncComplaintsToServer(complaintsStore);

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("complaints_updated", { detail: complaintsStore[index] }));
    }

    return complaintsStore[index];
  },

  async shoApprove(
    complaintId: string,
    shoName: string,
    shoPno: string = "04291882",
    remarks?: string
  ): Promise<ComplaintItem> {
    const index = complaintsStore.findIndex((c) => c.id === complaintId || c.complaintNumber === complaintId);
    if (index === -1) throw new Error("Complaint not found");

    const complaint = complaintsStore[index];
    const nowIso = new Date().toISOString();
    const isFirOutcome = complaint.eoOutcome === "FIR Recommend" || complaint.isRecommendedForFir;

    let nextWorkflowState: WorkflowState = "COMPLETE";
    let nextStatus: ComplaintStatus = complaint.status;
    let isFirApprovedBySho = false;

    if (isFirOutcome) {
      nextWorkflowState = "FIR_REGISTRATION_PENDING";
      nextStatus = "RECOMMENDED_FOR_FIR";
      isFirApprovedBySho = true;
    } else {
      nextWorkflowState = "COMPLETE";
      nextStatus = "COMPLETE";
    }

    complaintsStore[index] = {
      ...complaint,
      status: nextStatus,
      workflowState: nextWorkflowState,
      shoDecision: "APPROVE",
      shoDecisionAt: nowIso,
      shoDecisionBy: shoName,
      shoRemarks: remarks,
      isFirApprovedBySho,
      firApprovedAt: isFirApprovedBySho ? nowIso : undefined,
      firApprovedBy: isFirApprovedBySho ? shoName : undefined,
      shoActionRequired: isFirOutcome,
      updatedAt: nowIso,
    };

    // Audit record
    this.addAuditRecord(complaint.id, {
      action: "SHO_APPROVED",
      actionLabel: isFirOutcome ? "SHO Approved FIR Recommendation" : "SHO Approved & Closed Enquiry",
      performedBy: shoName,
      userPno: shoPno,
      userRole: "SHO",
      timestamp: nowIso,
      details: remarks || (isFirOutcome ? "SHO concurred with EO findings and sanctioned regular FIR registration." : "SHO verified and approved complete enquiry report. Matter disposed/closed."),
    });

    // Timeline
    this.addTimelineEvent(complaint.id, {
      title: isFirOutcome ? "SHO Sanctioned FIR Registration" : "Enquiry Report Approved by SHO",
      description: `Station House Officer ${shoName} approved the enquiry findings. ${remarks ? `Remarks: ${remarks}` : ""}`,
      category: "STATUS_CHANGE",
      officerName: shoName,
      timestamp: nowIso,
    });

    // Notify EO that SHO approved
    if (complaint.assignedEoPno) {
      const eoNotif: OfficerNotification = {
        id: `notif_${Date.now()}_eo_approved`,
        recipientPno: complaint.assignedEoPno,
        recipientName: complaint.assignedEoName || "Enquiry Officer",
        complaintId: complaint.id,
        complaintNumber: complaint.complaintNumber,
        title: `Report Approved: ${complaint.complaintNumber}`,
        message: `SHO ${shoName} has approved your enquiry report (${complaint.eoOutcome}). ${remarks ? `Remarks: "${remarks}"` : ""}`,
        createdAt: nowIso,
        priority: "ROUTINE",
      };
      officerNotificationsStore.unshift(eoNotif);
      saveNotificationsToStorage(officerNotificationsStore);
    }

    saveComplaintsToStorage(complaintsStore);
    syncComplaintsToServer(complaintsStore);

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("complaints_updated", { detail: complaintsStore[index] }));
    }

    return complaintsStore[index];
  },

  async shoReEnquiry(
    complaintId: string,
    shoName: string,
    shoPno: string = "04291882",
    reason: string
  ): Promise<ComplaintItem> {
    const index = complaintsStore.findIndex((c) => c.id === complaintId || c.complaintNumber === complaintId);
    if (index === -1) throw new Error("Complaint not found");

    const complaint = complaintsStore[index];
    const nowIso = new Date().toISOString();
    const reEnquiryCount = (complaint.reEnquiryCount || 0) + 1;

    // Re-assign to SAME EO, reappears in EO active list, status Pending
    complaintsStore[index] = {
      ...complaint,
      status: "ENQUIRY_IN_PROGRESS",
      workflowState: "RE_ENQUIRY",
      eoOutcome: "Pending",
      isSentToSho: false,
      shoActionRequired: false,
      isFirApprovedBySho: false,
      shoDecision: "RE_ENQUIRY",
      shoDecisionAt: nowIso,
      shoDecisionBy: shoName,
      reEnquiryCount,
      reEnquiryRemarks: reason,
      reEnquiryAt: nowIso,
      reEnquiryBy: shoName,
      updatedAt: nowIso,
    };

    // Audit record
    this.addAuditRecord(complaint.id, {
      action: "SHO_RE_ENQUIRY",
      actionLabel: `Re-Enquiry Ordered by SHO (Cycle #${reEnquiryCount})`,
      performedBy: shoName,
      userPno: shoPno,
      userRole: "SHO",
      timestamp: nowIso,
      reason,
      details: `SHO ordered re-enquiry. Re-assigned to EO ${complaint.assignedEoName} (PNO: ${complaint.assignedEoPno}). Reason/Directions: "${reason}".`,
    });

    // Timeline
    this.addTimelineEvent(complaint.id, {
      title: `Re-Enquiry Ordered by SHO (Cycle #${reEnquiryCount})`,
      description: `SHO ${shoName} returned the complaint to EO ${complaint.assignedEoName} for further enquiry. Directions: "${reason}". Status remains Pending.`,
      category: "STATUS_CHANGE",
      officerName: shoName,
      timestamp: nowIso,
    });

    // Notify EO about re-enquiry!
    if (complaint.assignedEoPno) {
      const eoNotif: OfficerNotification = {
        id: `notif_${Date.now()}_eo_reenquiry`,
        recipientPno: complaint.assignedEoPno,
        recipientName: complaint.assignedEoName || "Enquiry Officer",
        complaintId: complaint.id,
        complaintNumber: complaint.complaintNumber,
        title: `RE-ENQUIRY ORDERED: ${complaint.complaintNumber}`,
        message: `SHO ${shoName} ordered re-enquiry on ${complaint.complaintNumber}. Reason / Instructions: "${reason}". The case has been returned to your active docket.`,
        directions: reason,
        createdAt: nowIso,
        priority: "URGENT",
      };
      officerNotificationsStore.unshift(eoNotif);
      saveNotificationsToStorage(officerNotificationsStore);
    }

    saveComplaintsToStorage(complaintsStore);
    syncComplaintsToServer(complaintsStore);

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("complaints_updated", { detail: complaintsStore[index] }));
    }

    return complaintsStore[index];
  },

  async shoReject(
    complaintId: string,
    shoName: string,
    shoPno: string = "04291882",
    reason: string
  ): Promise<ComplaintItem> {
    const index = complaintsStore.findIndex((c) => c.id === complaintId || c.complaintNumber === complaintId);
    if (index === -1) throw new Error("Complaint not found");

    const complaint = complaintsStore[index];
    const nowIso = new Date().toISOString();
    const rejectionCount = (complaint.rejectionCount || 0) + 1;

    // Return to the SAME assigned EO for correction and resubmission
    complaintsStore[index] = {
      ...complaint,
      status: "CORRECTION_REQUIRED",
      workflowState: "CORRECTION_REQUIRED",
      eoOutcome: "Pending",
      isSentToSho: false,
      shoActionRequired: false,
      isFirApprovedBySho: false,
      shoDecision: "REJECT",
      shoDecisionAt: nowIso,
      shoDecisionBy: shoName,
      rejectionCount,
      rejectionReason: reason,
      rejectionAt: nowIso,
      rejectionBy: shoName,
      updatedAt: nowIso,
    };

    // Audit record
    this.addAuditRecord(complaint.id, {
      action: "SHO_REJECTED",
      actionLabel: `Report Rejected by SHO (Cycle #${rejectionCount})`,
      performedBy: shoName,
      userPno: shoPno,
      userRole: "SHO",
      timestamp: nowIso,
      reason,
      details: `SHO rejected enquiry report. Returned to assigned EO ${complaint.assignedEoName} (PNO: ${complaint.assignedEoPno}) for correction and report resubmission. Reason: "${reason}".`,
    });

    // Timeline
    this.addTimelineEvent(complaint.id, {
      title: `Enquiry Report Rejected by SHO (Cycle #${rejectionCount})`,
      description: `SHO ${shoName} rejected the report and returned the case to EO ${complaint.assignedEoName} for correction and resubmission. Reason: "${reason}". Status: Correction Required.`,
      category: "STATUS_CHANGE",
      officerName: shoName,
      timestamp: nowIso,
    });

    // Notify EO about rejection and required corrections
    if (complaint.assignedEoPno) {
      const eoNotif: OfficerNotification = {
        id: `notif_${Date.now()}_eo_rejected`,
        recipientPno: complaint.assignedEoPno,
        recipientName: complaint.assignedEoName || "Enquiry Officer",
        complaintId: complaint.id,
        complaintNumber: complaint.complaintNumber,
        title: `CORRECTION REQUIRED: Report Rejected (${complaint.complaintNumber})`,
        message: `SHO ${shoName} rejected your enquiry report. Reason: "${reason}". Please correct and resubmit the report.`,
        directions: reason,
        createdAt: nowIso,
        priority: "URGENT",
      };
      officerNotificationsStore.unshift(eoNotif);
      saveNotificationsToStorage(officerNotificationsStore);
    }

    saveComplaintsToStorage(complaintsStore);
    syncComplaintsToServer(complaintsStore);

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("complaints_updated", { detail: complaintsStore[index] }));
    }

    return complaintsStore[index];
  },

  async registerFir(
    complaintId: string,
    firNumber: string,
    sections: string,
    officerName: string,
    userRole?: string,
    firDate?: string
  ): Promise<ComplaintItem> {
    const index = complaintsStore.findIndex((c) => c.id === complaintId || c.complaintNumber === complaintId);
    if (index === -1) throw new Error("Complaint not found");

    const complaint = complaintsStore[index];
    const nowIso = new Date().toISOString();
    const dateStr = firDate || nowIso.split("T")[0];

    complaintsStore[index] = {
      ...complaint,
      isFirRegistered: true,
      firNumber,
      firDate: dateStr,
      firRegisteredBy: officerName,
      firRegisteredAt: nowIso,
      firSections: sections,
      status: "FIR_REGISTERED",
      workflowState: "FIR_REGISTERED",
      shoActionRequired: false,
      updatedAt: nowIso,
    };

    // Audit record
    this.addAuditRecord(complaint.id, {
      action: "FIR_REGISTERED",
      actionLabel: `Regular FIR Registered: ${firNumber}`,
      performedBy: officerName,
      userRole: userRole || "SHO",
      timestamp: nowIso,
      details: `Official FIR No. ${firNumber} registered under ${sections} at Police Station ${complaint.policeStation}. Complaint docket closed and converted to criminal FIR investigation.`,
    });

    // Timeline
    this.addTimelineEvent(complaint.id, {
      title: `FIR Registered: ${firNumber}`,
      description: `Regular First Information Report No. ${firNumber} registered under ${sections} by ${officerName}. Complaint status converted to FIR Registered.`,
      category: "STATUS_CHANGE",
      officerName,
      timestamp: nowIso,
    });

    // Log to Roznamcha General Diary
    try {
      await GeneralDiaryService.addEntry(
        `Regular FIR Registered: ${firNumber} (ex-Complaint ${complaint.complaintNumber})`,
        `Pursuant to preliminary enquiry under Section 173(3) BNSS, FIR No. ${firNumber} was officially registered under ${sections} at ${complaint.policeStation}. Complainant: ${complaint.complainantName}. Registered by ${officerName}.`,
        "FIR_REGISTERED_ENTRY",
        officerName,
        "04291882",
        complaint.policeStation,
        complaint.complaintNumber
      );
    } catch (gdErr) {
      console.warn("Could not log FIR to GD:", gdErr);
    }

    saveComplaintsToStorage(complaintsStore);
    syncComplaintsToServer(complaintsStore);

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("complaints_updated", { detail: complaintsStore[index] }));
    }

    return complaintsStore[index];
  },

  async sendReportToShoForFir(
    complaintId: string,
    officerName: string,
    officerPno: string,
    reportTitle?: string,
    sections?: string
  ): Promise<ComplaintItem> {
    return this.sendReportToSho(complaintId, officerName, officerPno, `FIR recommended under ${sections || "BNS provisions"}. Title: ${reportTitle || "Enquiry Report"}`);
  },

  async deleteComplaintReport(
    complaintId: string,
    reportId: string
  ): Promise<ComplaintItem> {
    const index = complaintsStore.findIndex((c) => c.id === complaintId || c.complaintNumber === complaintId);
    if (index === -1) throw new Error("Complaint not found");

    complaintsStore[index] = {
      ...complaintsStore[index],
      reports: (complaintsStore[index].reports || []).filter((r) => r.id !== reportId),
      updatedAt: new Date().toISOString(),
    };
    saveComplaintsToStorage(complaintsStore);
    syncComplaintsToServer(complaintsStore);

    return complaintsStore[index];
  },

  async saveLegalAnalysis(
    complaintId: string,
    analysis: LegalAnalysisReport
  ): Promise<ComplaintItem> {
    const index = complaintsStore.findIndex((c) => c.id === complaintId || c.complaintNumber === complaintId);
    if (index === -1) throw new Error("Complaint not found");

    complaintsStore[index] = {
      ...complaintsStore[index],
      legalAnalysis: analysis,
      updatedAt: new Date().toISOString(),
    };
    saveComplaintsToStorage(complaintsStore);
    syncComplaintsToServer(complaintsStore);

    return complaintsStore[index];
  },

  async saveInvestigationSummary(
    complaintId: string,
    summary: InvestigationSummaryReport
  ): Promise<ComplaintItem> {
    const index = complaintsStore.findIndex((c) => c.id === complaintId || c.complaintNumber === complaintId);
    if (index === -1) throw new Error("Complaint not found");

    complaintsStore[index] = {
      ...complaintsStore[index],
      investigationSummary: summary,
      updatedAt: new Date().toISOString(),
    };
    saveComplaintsToStorage(complaintsStore);
    syncComplaintsToServer(complaintsStore);

    return complaintsStore[index];
  },
};
