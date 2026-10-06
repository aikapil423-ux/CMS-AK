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
} from "@/types";
import { MOCK_COMPLAINTS, MOCK_HISTORICAL_FIRS, MOCK_ENQUIRY_OFFICERS } from "@/lib/mockData";
import { ComplaintRegistrationInput } from "@/lib/validations/complaint";
import { GeneralDiaryService } from "./generalDiaryService";

// In-memory store initialized with localStorage if available, or fallback to MOCK_COMPLAINTS
const COMPLAINTS_STORAGE_KEY = "haryana_police_cms_complaints_v1";
const NOTIFICATIONS_STORAGE_KEY = "haryana_police_cms_notifications_v1";

function loadComplaintsFromStorage(): ComplaintItem[] {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      const stored = window.localStorage.getItem(COMPLAINTS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Could not load complaints from localStorage", e);
    }
  }
  return [...MOCK_COMPLAINTS];
}

function saveComplaintsToStorage(items: ComplaintItem[]) {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      window.localStorage.setItem(COMPLAINTS_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn("Could not save complaints to localStorage", e);
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

let complaintsStore: ComplaintItem[] = loadComplaintsFromStorage();
let officerNotificationsStore: OfficerNotification[] = loadNotificationsFromStorage();

export const ComplaintService = {
  async getComplaints(filter?: {
    search?: string;
    status?: string;
    statuses?: string[];
    priority?: string;
    category?: string;
    assignedEo?: string;
  }): Promise<ComplaintItem[]> {
    complaintsStore = loadComplaintsFromStorage();
    let list = [...complaintsStore];

    if (filter?.statuses && filter.statuses.length > 0 && !filter.statuses.includes("ALL")) {
      list = list.filter((c) => {
        return filter.statuses!.some((s) => {
          if (s === "UNASSIGNED" || s === "REGISTERED") {
            return c.status === "REGISTERED";
          }
          if (s === "UNDER_ENQUIRY" || s === "ENQUIRY_IN_PROGRESS") {
            return c.status === "ENQUIRY_IN_PROGRESS" || c.status === "ASSIGNED_TO_EO";
          }
          if (s === "UNDER_REVIEW" || s === "REPORT_SUBMITTED") {
            return (
              c.status === "REPORT_SUBMITTED" ||
              c.status === "PENDING_SHO_REVIEW" ||
              c.status === "INTERIM_REPORT_SUBMITTED"
            );
          }
          if (s === "DISPOSED" || s === "DISPOSED_CIVIL_NATURE") {
            return (
              c.status.startsWith("DISPOSED_") ||
              c.status === "RECOMMENDED_FOR_FIR" ||
              c.status === "TRANSFERRED_OTHER_PS"
            );
          }
          return c.status === s;
        });
      });
    } else if (filter?.status && filter.status !== "ALL") {
      const s = filter.status;
      if (s === "UNASSIGNED" || s === "REGISTERED") {
        list = list.filter((c) => c.status === "REGISTERED");
      } else if (s === "UNDER_ENQUIRY" || s === "ENQUIRY_IN_PROGRESS") {
        list = list.filter((c) => c.status === "ENQUIRY_IN_PROGRESS" || c.status === "ASSIGNED_TO_EO");
      } else if (s === "UNDER_REVIEW" || s === "REPORT_SUBMITTED") {
        list = list.filter(
          (c) =>
            c.status === "REPORT_SUBMITTED" ||
            c.status === "PENDING_SHO_REVIEW" ||
            c.status === "INTERIM_REPORT_SUBMITTED"
        );
      } else if (s === "DISPOSED" || s === "DISPOSED_CIVIL_NATURE") {
        list = list.filter(
          (c) =>
            c.status.startsWith("DISPOSED_") ||
            c.status === "RECOMMENDED_FOR_FIR" ||
            c.status === "TRANSFERRED_OTHER_PS"
        );
      } else {
        list = list.filter((c) => c.status === s);
      }
    }

    if (filter?.priority && filter.priority !== "ALL") {
      list = list.filter((c) => c.priority === filter.priority);
    }

    if (filter?.category && filter.category !== "ALL") {
      list = list.filter((c) => c.category === filter.category);
    }

    if (filter?.search) {
      const q = filter.search.toLowerCase();
      list = list.filter(
        (c) =>
          c.complaintNumber.toLowerCase().includes(q) ||
          c.complainantName.toLowerCase().includes(q) ||
          c.complainantMobile.includes(q) ||
          c.incidentPlace.toLowerCase().includes(q) ||
          c.accusedList.some((a) => a.name.toLowerCase().includes(q))
      );
    }

    if (filter?.assignedEo) {
      const eo = filter.assignedEo.toLowerCase().trim();
      const eoTokens = eo
        .split(" ")
        .filter((p) => p.length > 2 && !["sub-inspector", "inspector", "asi", "si", "officer"].includes(p));
      list = list.filter((c) => {
        const eoId = (c.assignedEoId || "").toLowerCase();
        const eoPno = (c.assignedEoPno || "").toLowerCase();
        const eoName = (c.assignedEoName || "").toLowerCase();

        if (eoId === eo || eoPno === eo) return true;
        if (
          eoId.replace("usr_", "").replace("eo_", "") &&
          eoId.replace("usr_", "").replace("eo_", "") === eo.replace("usr_", "").replace("eo_", "")
        ) {
          return true;
        }
        if (eoName && (eoName.includes(eo) || eo.includes(eoName))) return true;
        if (eoTokens.length > 0 && eoTokens.some((token) => eoName.includes(token))) return true;
        return false;
      });
    }

    return list;
  },

  async getComplaintById(id: string): Promise<ComplaintItem | undefined> {
    complaintsStore = loadComplaintsFromStorage();
    const cleanId = id ? decodeURIComponent(id).trim() : "";
    return complaintsStore.find(
      (c) =>
        c.id === id ||
        c.complaintNumber === id ||
        (cleanId && (c.id === cleanId || c.complaintNumber === cleanId))
    );
  },

  async getStatusCounts(assignedEoFilter?: string): Promise<{
    all: number;
    unassigned: number;
    underEnquiry: number;
    underReview: number;
    disposed: number;
  }> {
    complaintsStore = loadComplaintsFromStorage();
    let baseList = [...complaintsStore];
    if (assignedEoFilter) {
      const eo = assignedEoFilter.toLowerCase().trim();
      const eoTokens = eo
        .split(" ")
        .filter((p) => p.length > 2 && !["sub-inspector", "inspector", "asi", "si", "officer"].includes(p));
      baseList = baseList.filter((c) => {
        const eoId = (c.assignedEoId || "").toLowerCase();
        const eoPno = (c.assignedEoPno || "").toLowerCase();
        const eoName = (c.assignedEoName || "").toLowerCase();

        if (eoId === eo || eoPno === eo) return true;
        if (
          eoId.replace("usr_", "").replace("eo_", "") &&
          eoId.replace("usr_", "").replace("eo_", "") === eo.replace("usr_", "").replace("eo_", "")
        ) {
          return true;
        }
        if (eoName && (eoName.includes(eo) || eo.includes(eoName))) return true;
        if (eoTokens.length > 0 && eoTokens.some((token) => eoName.includes(token))) return true;
        return false;
      });
    }

    const all = baseList.length;
    let unassigned = 0;
    let underEnquiry = 0;
    let underReview = 0;
    let disposed = 0;

    for (const c of baseList) {
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

    return { all, unassigned, underEnquiry, underReview, disposed };
  },

  async createComplaint(
    input: ComplaintRegistrationInput,
    officerName: string,
    station: string,
    district: string,
    officerPno: string = "04291882"
  ): Promise<ComplaintItem> {
    const sequenceNumber = Math.floor(480 + complaintsStore.length + 1);
    const generatedComplaintNumber = `HAR-KKR-2026-CMP-${String(sequenceNumber).padStart(5, "0")}`;

    const newComplaint: ComplaintItem = {
      id: `cmp_${Date.now()}`,
      complaintNumber: generatedComplaintNumber,
      source: input.source,
      category: input.category,
      categoryDisplay: input.category.replace(/_/g, " "),
      priority: input.priority,
      status: "REGISTERED",
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
      mhcName: officerName || "HC Devinder Kumar",
      mhcRank: "Head Constable (MHC)",
      mhcBeltNumber: officerPno === "05192834" ? "889/KKR" : (officerPno ? `${officerPno.slice(-3)}/KKR` : "889/KKR"),
      mhcPhone: "9813098765",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    complaintsStore.unshift(newComplaint);
    saveComplaintsToStorage(complaintsStore);

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
      assignedAt: new Date().toISOString(),
      assignedDirections: directions,
      assignedRosterDuty: eoRoster?.rosterDuty || "Investigation Duty",
      targetResolutionDate: targetDate.toISOString().split("T")[0],
      status: "ASSIGNED_TO_EO" as ComplaintStatus,
      updatedAt: new Date().toISOString(),
    };

    complaintsStore[index] = updated;
    saveComplaintsToStorage(complaintsStore);

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
    const pendingEnquiry = complaintsStore.filter(
      (c) => c.status === "ASSIGNED_TO_EO" || c.status === "ENQUIRY_IN_PROGRESS"
    ).length;
    const pendingAssignment = complaintsStore.filter((c) => c.status === "REGISTERED").length;
    const pendingApproval = complaintsStore.filter(
      (c) => c.status === "REPORT_SUBMITTED" || c.status === "RECOMMENDED_FOR_FIR"
    ).length;
    const disposed = complaintsStore.filter(
      (c) =>
        c.status === "DISPOSED_CIVIL_NATURE" ||
        c.status === "DISPOSED_MUTUAL_ACCORD" ||
        c.status === "DISPOSED_UNSUBSTANTIATED"
    ).length;
    const criticalUrgent = complaintsStore.filter(
      (c) => c.priority === "URGENT" || c.priority === "CM_WINDOW_VIP" || c.priority === "CRITICAL_SENSITIVE"
    ).length;

    return {
      total,
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
      updatedAt: new Date().toISOString(),
    };

    this.addTimelineEvent(complaintsStore[index].id, {
      title: `Converted to FIR: ${firNumber}`,
      description: `Enquiry completed and cognizable offense substantiated under BNSS sections ${sections}. Formal FIR registered.`,
      category: "STATUS_CHANGE",
      officerName,
      timestamp: new Date().toISOString(),
      documentName: `FIR-${firNumber}.pdf`,
    });

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

    const doc = (complaintsStore[index].documents || []).find((d) => d.id === docId);
    complaintsStore[index] = {
      ...complaintsStore[index],
      documents: (complaintsStore[index].documents || []).filter((d) => d.id !== docId),
      updatedAt: new Date().toISOString(),
    };

    this.addTimelineEvent(complaintsStore[index].id, {
      title: `Document Record Deleted by EO`,
      description: `Document record "${doc?.fileName || "Document"}" removed by assigned Enquiry Officer ${officerName}.`,
      category: "DOCUMENT",
      officerName,
      timestamp: new Date().toISOString(),
    });

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

  async addComplaintReport(
    complaintId: string,
    report: Omit<ComplaintReportItem, "id" | "createdAt" | "complaintId"> & { id?: string; createdAt?: string; complaintId?: string }
  ): Promise<ComplaintItem> {
    const index = complaintsStore.findIndex((c) => c.id === complaintId || c.complaintNumber === complaintId);
    if (index === -1) throw new Error("Complaint not found");

    const newReport: ComplaintReportItem = {
      id: report.id || `rep_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      complaintId: complaintsStore[index].id,
      title: report.title,
      reportType: report.reportType,
      reportTypeLabel: report.reportTypeLabel,
      dispatchNo: report.dispatchNo,
      generatedDate: report.generatedDate || new Date().toISOString(),
      officerName: report.officerName,
      officerRank: report.officerRank,
      officerPno: report.officerPno,
      conclusionSummary: report.conclusionSummary,
      content: report.content,
      fileName: report.fileName,
      fileSize: report.fileSize,
      fileUrl: report.fileUrl,
      dataUrl: report.dataUrl,
      fileFormat: report.fileFormat,
      isUploaded: report.isUploaded,
      createdAt: report.createdAt || new Date().toISOString(),
    };

    if (!complaintsStore[index].reports) {
      complaintsStore[index].reports = [];
    }
    complaintsStore[index].reports!.unshift(newReport);
    complaintsStore[index].updatedAt = new Date().toISOString();
    saveComplaintsToStorage(complaintsStore);

    return complaintsStore[index];
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

    return complaintsStore[index];
  },
};
