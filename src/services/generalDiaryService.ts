import {
  GeneralDiaryRecord,
  GDSearchFilter,
  GDPaginatedResponse,
  GDEntryTypeConfig,
  GDEntryCategory,
  GDTemplate,
  GDOfficerParticulars,
  GDRelatedRecords,
  GDAuditLog,
  GDStatus,
  GDUploadedDocument,
} from "@/types/generalDiary";
import { FIRActSectionEntry } from "@/types";
import { INITIAL_GD_TYPES } from "@/lib/generalDiaryConfig";
import { formatGDActivityDateTime, isGdRecordExpired } from "@/lib/gdDateTime";
import { suggestionStore } from "@/lib/suggestionStore";

const GD_STORAGE_KEY = "haryana_police_cms_gd_master_v3";
const GD_TYPES_STORAGE_KEY = "haryana_police_cms_gd_types_v4_cctns";
const GD_TEMPLATES_STORAGE_KEY = "haryana_police_cms_gd_templates_v3";

// Generate cryptographic-style verification audit hash
function generateAuditId(prefix: string = "AUD"): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let hash = "";
  for (let i = 0; i < 8; i++) {
    hash += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}-${new Date().getFullYear()}-${hash}`;
}

// Default Seed Entries for initial demo and inspection
function generateSeedEntries(): GeneralDiaryRecord[] {
  const today = new Date().toISOString().split("T")[0];
  const now = new Date();

  return [
    {
      id: "gd_seed_001",
      gdNumber: `GD-${today}-001`,
      sequencePerDay: 1,
      policeStation: "PS City Panipat",
      district: "Panipat",
      entryForOfficer: {
        name: "SI Malkeet",
        rank: "Sub-Inspector",
        beltNumber: "512/KKR",
        pno: "08192841",
      },
      actualAuthor: {
        name: "HC Devinder Kumar",
        rank: "Head Constable (MHC)",
        beltNumber: "889/KKR",
        pno: "05192834",
      },
      typeCode: "OPENING_OF_GD",
      category: "ROUTINE_ADMINISTRATION",
      typeDisplay: "Opening",
      typeDisplayHi: "Opening",
      subject: "Aagaz",
      narrative:
        "At 12:00 AM, it is entered that the General Diary was formally opened in accordance with Punjab Police Rule 22.48. Sentry guard inspection and lockup status verified. Current lockup strength: 0 detainees. Station armory, weapon registers, and cash chest verified. Sentry guard and MHC charge assumed. All station affairs reported in order.",
      activityDateTime: `${today} 12:00 AM`,
      officialCreationTimestamp: new Date(now.getTime() - 12 * 3600000).toISOString(),
      verificationTimestamp: new Date(now.getTime() - 12 * 3600000).toISOString(),
      status: "LOCKED",
      source: "MANUAL_ENTRY",
      isLocked: true,
      verificationAuditId: "V-AUD-2026-X8F9A2",
      verifiedBy: {
        name: "Inspector Rajesh Kumar",
        rank: "Inspector / SHO",
        beltNumber: "04291882",
        pno: "04291882",
      },
      relatedRecords: {},
      auditTrail: [
        {
          action: "CREATED",
          performedBy: "HC Devinder Kumar",
          performedByPno: "05192834",
          performedByRank: "Head Constable (MHC)",
          timestamp: new Date(now.getTime() - 12 * 3600000).toISOString(),
          auditId: "AUD-2026-001A",
          remarks: "Official station diary opening initiated",
        },
        {
          action: "LOCKED",
          performedBy: "Inspector Rajesh Kumar",
          performedByPno: "04291882",
          performedByRank: "Inspector / SHO",
          timestamp: new Date(now.getTime() - 12 * 3600000).toISOString(),
          auditId: "V-AUD-2026-X8F9A2",
          remarks: "Immutable atomic GD lock applied under PPR 22.48",
        },
      ],
    },
    {
      id: "gd_seed_002",
      gdNumber: `GD-${today}-002`,
      sequencePerDay: 2,
      policeStation: "PS City Panipat",
      district: "Panipat",
      entryForOfficer: {
        name: "SI Malkeet",
        rank: "Sub-Inspector",
        beltNumber: "512/KKR",
        pno: "08192841",
      },
      actualAuthor: {
        name: "HC Devinder Kumar",
        rank: "Head Constable (MHC)",
        beltNumber: "889/KKR",
        pno: "05192834",
      },
      typeCode: "OTHERS",
      category: "ROUTINE_ADMINISTRATION",
      typeDisplay: "Cleanliness",
      typeDisplayHi: "Cleanliness",
      subject: "Safai Thana",
      narrative:
        "At 06:30 AM, comprehensive cleaning and sanitary inspection of police station premises, lockup, mal-khana, barracks, and public reception was conducted. Sanitation and drinking water verified in order.",
      activityDateTime: `${today} 06:30 AM`,
      officialCreationTimestamp: new Date(now.getTime() - 8 * 3600000).toISOString(),
      verificationTimestamp: new Date(now.getTime() - 8 * 3600000).toISOString(),
      status: "LOCKED",
      source: "MANUAL_ENTRY",
      isLocked: true,
      verificationAuditId: "V-AUD-2026-K9M2P1",
      verifiedBy: {
        name: "Inspector Rajesh Kumar",
        rank: "Inspector / SHO",
        beltNumber: "04291882",
        pno: "04291882",
      },
      relatedRecords: {},
      auditTrail: [
        {
          action: "CREATED",
          performedBy: "HC Devinder Kumar",
          performedByPno: "05192834",
          performedByRank: "Head Constable (MHC)",
          timestamp: new Date(now.getTime() - 8 * 3600000).toISOString(),
          auditId: "AUD-2026-002A",
        },
        {
          action: "LOCKED",
          performedBy: "Inspector Rajesh Kumar",
          performedByPno: "04291882",
          performedByRank: "Inspector / SHO",
          timestamp: new Date(now.getTime() - 8 * 3600000).toISOString(),
          auditId: "V-AUD-2026-K9M2P1",
        },
      ],
    },
    {
      id: "gd_seed_003",
      gdNumber: `GD-${today}-003`,
      sequencePerDay: 3,
      policeStation: "PS City Panipat",
      district: "Panipat",
      entryForOfficer: {
        name: "ASI Ramesh Chander",
        rank: "Assistant Sub-Inspector",
        beltNumber: "614/KKR",
        pno: "06281923",
      },
      actualAuthor: {
        name: "HC Devinder Kumar",
        rank: "Head Constable (MHC)",
        beltNumber: "889/KKR",
        pno: "05192834",
      },
      typeCode: "ROLL_CALL",
      category: "ROUTINE_ADMINISTRATION",
      typeDisplay: "Roll Call",
      typeDisplayHi: "Roll Call",
      subject: "Ginti Staff",
      narrative:
        "At 08:00 AM, morning roll call and staff count conducted. 18 personnel present on parade, 2 on sanctioned leave, 1 on court duty. Personnel briefed on supervisory directives, law & order vigilance, and duty assignments.",
      activityDateTime: `${today} 08:00 AM`,
      officialCreationTimestamp: new Date(now.getTime() - 6.5 * 3600000).toISOString(),
      verificationTimestamp: new Date(now.getTime() - 6.5 * 3600000).toISOString(),
      status: "LOCKED",
      source: "MANUAL_ENTRY",
      isLocked: true,
      verificationAuditId: "V-AUD-2026-R4W7C8",
      verifiedBy: {
        name: "Inspector Rajesh Kumar",
        rank: "Inspector / SHO",
        beltNumber: "04291882",
        pno: "04291882",
      },
      relatedRecords: {},
      auditTrail: [
        {
          action: "CREATED",
          performedBy: "HC Devinder Kumar",
          performedByPno: "05192834",
          performedByRank: "Head Constable (MHC)",
          timestamp: new Date(now.getTime() - 6.5 * 3600000).toISOString(),
          auditId: "AUD-2026-003A",
        },
        {
          action: "LOCKED",
          performedBy: "Inspector Rajesh Kumar",
          performedByPno: "04291882",
          performedByRank: "Inspector / SHO",
          timestamp: new Date(now.getTime() - 6.5 * 3600000).toISOString(),
          auditId: "V-AUD-2026-R4W7C8",
        },
      ],
    },
    {
      id: "gd_seed_004",
      gdNumber: `GD-${today}-004`,
      sequencePerDay: 4,
      policeStation: "PS City Panipat",
      district: "Panipat",
      entryForOfficer: {
        name: "SI Malkeet",
        rank: "Sub-Inspector",
        beltNumber: "512/KKR",
        pno: "08192841",
      },
      actualAuthor: {
        name: "ASI Surender Pal",
        rank: "ASI (Duty Officer)",
        beltNumber: "419/KKR",
        pno: "09384712",
      },
      typeCode: "DEPARTURE",
      category: "DUTY_MOVEMENT",
      typeDisplay: "Departure",
      typeDisplayHi: "Departure",
      subject: "Ravangi for Investigation",
      narrative:
        "At 09:30 AM, SI Malkeet departed from the Police Station along with staff in government vehicle for official duty and field investigation in case enquiry. Arms and logbook verified. Entered in General Diary.",
      activityDateTime: `${today} 09:30 AM`,
      officialCreationTimestamp: new Date(now.getTime() - 5 * 3600000).toISOString(),
      verificationTimestamp: new Date(now.getTime() - 5 * 3600000).toISOString(),
      status: "LOCKED",
      source: "MANUAL_ENTRY",
      isLocked: true,
      verificationAuditId: "V-AUD-2026-F1R992",
      verifiedBy: {
        name: "Inspector Rajesh Kumar",
        rank: "Inspector / SHO",
        beltNumber: "04291882",
        pno: "04291882",
      },
      relatedRecords: {
        vehicleNumber: "HR-07-G-1102",
        destinationLocation: "Sector 7, Panipat",
      },
      auditTrail: [
        {
          action: "CREATED",
          performedBy: "ASI Surender Pal",
          performedByPno: "09384712",
          performedByRank: "ASI (Duty Officer)",
          timestamp: new Date(now.getTime() - 5 * 3600000).toISOString(),
          auditId: "AUD-2026-004A",
        },
        {
          action: "LOCKED",
          performedBy: "Inspector Rajesh Kumar",
          performedByPno: "04291882",
          performedByRank: "Inspector / SHO",
          timestamp: new Date(now.getTime() - 5 * 3600000).toISOString(),
          auditId: "V-AUD-2026-F1R992",
        },
      ],
    },
    {
      id: "gd_seed_005",
      gdNumber: `GD-${today}-005`,
      sequencePerDay: 5,
      policeStation: "PS City Panipat",
      district: "Panipat",
      entryForOfficer: {
        name: "SI Malkeet",
        rank: "Sub-Inspector",
        beltNumber: "512/KKR",
        pno: "08192841",
      },
      actualAuthor: {
        name: "ASI Surender Pal",
        rank: "ASI (Duty Officer)",
        beltNumber: "419/KKR",
        pno: "09384712",
      },
      typeCode: "ARRIVAL_RETURN",
      category: "DUTY_MOVEMENT",
      typeDisplay: "Arrival",
      typeDisplayHi: "Arrival",
      subject: "Wapsi from Duty",
      narrative:
        "At 01:15 PM, SI Malkeet returned to the Police Station along with staff after successfully concluding field investigation and spot verification. Arms deposited in order. Entered in General Diary.",
      activityDateTime: `${today} 01:15 PM`,
      officialCreationTimestamp: new Date(now.getTime() - 3.5 * 3600000).toISOString(),
      verificationTimestamp: new Date(now.getTime() - 3.5 * 3600000).toISOString(),
      status: "LOCKED",
      source: "MANUAL_ENTRY",
      isLocked: true,
      verificationAuditId: "V-AUD-2026-W3T9A1",
      verifiedBy: {
        name: "Inspector Rajesh Kumar",
        rank: "Inspector / SHO",
        beltNumber: "04291882",
        pno: "04291882",
      },
      relatedRecords: {
        destinationLocation: "Sector 7, Panipat",
      },
      auditTrail: [
        {
          action: "CREATED",
          performedBy: "ASI Surender Pal",
          performedByPno: "09384712",
          performedByRank: "ASI (Duty Officer)",
          timestamp: new Date(now.getTime() - 3.5 * 3600000).toISOString(),
          auditId: "AUD-2026-005A",
        },
        {
          action: "LOCKED",
          performedBy: "Inspector Rajesh Kumar",
          performedByPno: "04291882",
          performedByRank: "Inspector / SHO",
          timestamp: new Date(now.getTime() - 3.5 * 3600000).toISOString(),
          auditId: "V-AUD-2026-W3T9A1",
        },
      ],
    },
    {
      id: "gd_seed_006",
      gdNumber: `GD-${today}-006`,
      sequencePerDay: 6,
      policeStation: "PS City Panipat",
      district: "Panipat",
      entryForOfficer: {
        name: "HC Devinder Kumar",
        rank: "Head Constable (MHC)",
        beltNumber: "889/KKR",
        pno: "05192834",
      },
      actualAuthor: {
        name: "HC Devinder Kumar",
        rank: "Head Constable (MHC)",
        beltNumber: "889/KKR",
        pno: "05192834",
      },
      typeCode: "COMPLAINT_RECEIVED",
      category: "INVESTIGATION_PROCESS",
      typeDisplay: "Complaint Intake",
      typeDisplayHi: "Complaint Intake",
      subject: "Complaint Received - Online Banking Fraud",
      narrative:
        "At 02:40 PM, citizen written complaint received regarding online banking fraud. Docket CMP-2026-00486 generated in CMS and marked to SHO for enquiry officer assignment.",
      activityDateTime: `${today} 02:40 PM`,
      officialCreationTimestamp: new Date(now.getTime() - 2 * 3600000).toISOString(),
      verificationTimestamp: new Date(now.getTime() - 2 * 3600000).toISOString(),
      status: "LOCKED",
      source: "COMPLAINT_INTEGRATION",
      isLocked: true,
      verificationAuditId: "V-AUD-2026-C8M4P7",
      verifiedBy: {
        name: "Inspector Rajesh Kumar",
        rank: "Inspector / SHO",
        beltNumber: "04291882",
        pno: "04291882",
      },
      relatedRecords: {
        complaintNumber: "HAR-PNP-2026-CMP-CYB-0001",
      },
      auditTrail: [
        {
          action: "CREATED",
          performedBy: "HC Devinder Kumar",
          performedByPno: "05192834",
          performedByRank: "Head Constable (MHC)",
          timestamp: new Date(now.getTime() - 2 * 3600000).toISOString(),
          auditId: "AUD-2026-006A",
        },
        {
          action: "LOCKED",
          performedBy: "Inspector Rajesh Kumar",
          performedByPno: "04291882",
          performedByRank: "Inspector / SHO",
          timestamp: new Date(now.getTime() - 2 * 3600000).toISOString(),
          auditId: "V-AUD-2026-C8M4P7",
        },
      ],
    },
    // Suggested Entry waiting for human review (Workflow requirement #1)
    {
      id: "gd_sugg_001",
      gdNumber: "GD-PENDING-SUGGESTION",
      sequencePerDay: 0,
      policeStation: "PS City Panipat",
      district: "Panipat",
      entryForOfficer: {
        name: "SI Vikram Singh",
        rank: "Sub-Inspector",
        beltNumber: "742/KKR",
        pno: "07182930",
      },
      actualAuthor: {
        name: "System Automation (Complaint Module)",
        rank: "System Event Service",
        beltNumber: "SYS/AUTO",
        pno: "00000000",
      },
      typeCode: "CITIZEN_INFORMATION_TIP_RECEIVED",
      category: "INVESTIGATION_PROCESS",
      typeDisplay: "Complaint Received / Disposal",
      typeDisplayHi: "प्राप्ति / निपटान शिकायत दरख्वास्त (PPR 22.48)",
      subject: "प्राप्ति दरख्वास्त शिकायत क्रमांक HAR-PNP-2026-CMP-CTY-0002 मनजानिब Ramphal Sharma",
      narrative:
        "बवक्त 02:15 PM, मुसम्मी Ramphal Sharma (मो: 9812048192) द्वारा थाना में उपस्थित होकर लिखित दरख्वास्त पेश की गई, जिसका विषय 'बाबत धोखाधड़ी व फर्जी इकरारनामा' है। दरख्वास्त को केंद्रीय शिकायत रजिस्टर में दर्ज करके जांच अधिकारी Sub-Inspector Vikram Singh को धारा 173(3) BNSS के तहत 14 दिन में प्रारंभिक जांच हेतु सौंपा गया।",
      activityDateTime: `${today} 14:15`,
      officialCreationTimestamp: new Date(now.getTime() - 1.5 * 3600000).toISOString(),
      status: "SUGGESTED",
      source: "COMPLAINT_INTEGRATION",
      isLocked: false,
      relatedRecords: {
        complaintNumber: "HAR-PNP-2026-CMP-CTY-0002",
        personName: "Ramphal Sharma",
      },
      auditTrail: [
        {
          action: "SUGGESTED",
          performedBy: "System Event Dispatcher",
          performedByPno: "SYS/AUTO",
          performedByRank: "Automated Integration",
          timestamp: new Date(now.getTime() - 1.5 * 3600000).toISOString(),
          auditId: "SYS-SUGG-8421",
          remarks: "Triggered upon Confirm & Register Complaint event",
        },
      ],
    },
    // Draft Entry waiting for completion (Workflow requirement #4)
    {
      id: "gd_draft_001",
      gdNumber: "GD-DRAFT",
      sequencePerDay: 0,
      policeStation: "PS City Panipat",
      district: "Panipat",
      entryForOfficer: {
        name: "EHC Kuldeep Singh",
        rank: "EHC (Driver)",
        beltNumber: "329/KKR",
        pno: "08472910",
      },
      actualAuthor: {
        name: "HC Devinder Kumar",
        rank: "Head Constable (MHC)",
        beltNumber: "889/KKR",
        pno: "05192834",
      },
      typeCode: "VEHICLE_MOVEMENT",
      category: "DUTY_MOVEMENT",
      typeDisplay: "Vehicle Movement (Government Logistic)",
      typeDisplayHi: "रवानगी / आमद सरकारी गाड़ी (Government Vehicle)",
      subject: "रवानगी सरकारी वाहन HR-07-G-1102 चालक EHC Kuldeep Singh बा-मकसद रात्रि गश्त",
      narrative:
        "सरकारी वाहन संख्या HR-07-G-1102 चालक EHC Kuldeep Singh (बेल्ट: 329/KKR) बा-मकसद रात्रि नाकाबंदी व पेट्रोलिंग रवाना किया गया। मीटर रीडिंग 49,120 किमी नोट की गई।",
      activityDateTime: `${today} 16:00`,
      officialCreationTimestamp: new Date(now.getTime() - 45 * 60000).toISOString(),
      status: "DRAFT",
      source: "MANUAL_ENTRY",
      isLocked: false,
      relatedRecords: {
        vehicleNumber: "HR-07-G-1102",
      },
      auditTrail: [
        {
          action: "CREATED",
          performedBy: "HC Devinder Kumar",
          performedByPno: "05192834",
          performedByRank: "Head Constable (MHC)",
          timestamp: new Date(now.getTime() - 45 * 60000).toISOString(),
          auditId: "DRAFT-001",
          remarks: "Saved as unofficial draft",
        },
      ],
    },
    // Panipat Hospital Rukka entry for 2026-10-14 SITREP Section X Audit
    {
      id: "gd_seed_pnp_001",
      gdNumber: "GD-2026-10-14-042",
      sequencePerDay: 42,
      policeStation: "PS City Panipat",
      district: "Panipat",
      entryForOfficer: {
        name: "SI Rajesh Kumar",
        rank: "Sub-Inspector",
        beltNumber: "4412/PNP",
        pno: "08192849",
      },
      actualAuthor: {
        name: "HC Satish Kumar",
        rank: "Head Constable (MHC)",
        beltNumber: "912/PNP",
        pno: "05192899",
      },
      typeCode: "HOSPITAL_RUKKA",
      category: "INVESTIGATION_PROCESS",
      typeDisplay: "Hospital Rukka Received",
      typeDisplayHi: "रुक्का अस्पताल प्राप्ति",
      subject: "Ravinder Kumar, M, Age 34 S/o Jai Bhagwan R/o Insar Bazar Panipat, Mob: 9812400192",
      narrative:
        "Assault incident near Subhash Bazar Panipat on 14/10/2026 at 17:30 hours. Patient admitted in Emergency Ward, General Hospital Panipat by brother Sandeep with blunt head injuries. Rukka ID: RUKKA-PNP-2026-442 received at Police Station.",
      activityDateTime: "2026-10-14 18:30",
      officialCreationTimestamp: "2026-10-14T18:30:00.000Z",
      verificationTimestamp: "2026-10-14T18:35:00.000Z",
      status: "LOCKED",
      source: "MANUAL_ENTRY",
      isLocked: true,
      verificationAuditId: "V-AUD-2026-PNP882",
      verifiedBy: {
        name: "Inspector Rajesh Kumar",
        rank: "Inspector / SHO",
        beltNumber: "04291882",
        pno: "04291882",
      },
      relatedRecords: {
        personName: "Ravinder Kumar",
        destinationLocation: "General Hospital Panipat",
      },
      auditTrail: [
        {
          action: "CREATED",
          performedBy: "HC Satish Kumar",
          performedByPno: "05192899",
          performedByRank: "Head Constable (MHC)",
          timestamp: "2026-10-14T18:30:00.000Z",
          auditId: "AUD-PNP-042",
        },
      ],
    },
  ];
}

export function cleanGdNarrative(text: string | null | undefined): string {
  if (!text) return "";
  return text
    .replace(/\s*\[नोट:\s*मुंशी[^\]]*\]/gi, "")
    .replace(/\s*\[(AI \/ System Suggestion|Draft saved by MHC)[^\]]*\]/gi, "")
    .trim();
}

function loadRecordsFromStorage(): GeneralDiaryRecord[] {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      const stored = window.localStorage.getItem(GD_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const cleaned = parsed
            .filter((r: GeneralDiaryRecord) => !isGdRecordExpired(r))
            .map((r: GeneralDiaryRecord) => ({
              ...r,
              activityDateTime:
                r.activityDateTime && r.activityDateTime.includes("T")
                  ? formatGDActivityDateTime(new Date(r.activityDateTime))
                  : r.activityDateTime,
              narrative: cleanGdNarrative(r.narrative),
            }));
          if (cleaned.length !== parsed.length) {
            try {
              window.localStorage.setItem(GD_STORAGE_KEY, JSON.stringify(cleaned));
            } catch {}
          }
          // Ensure seed GD entries for Panipat audit exist
          const seeds = generateSeedEntries();
          seeds.forEach((s) => {
            if (s.id.startsWith("gd_seed_pnp") && !cleaned.some((c: GeneralDiaryRecord) => c.id === s.id)) {
              cleaned.push(s);
            }
          });
          return cleaned;
        }
      }
    } catch (e) {
      console.warn("Could not load GD records from storage", e);
    }
  }
  return generateSeedEntries().filter((r) => !isGdRecordExpired(r));
}

function saveRecordsToStorage(records: GeneralDiaryRecord[]) {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      window.localStorage.setItem(GD_STORAGE_KEY, JSON.stringify(records));
    } catch (e) {
      console.warn("Could not save GD records to storage", e);
    }
  }
}

function loadTypesFromStorage(): GDEntryTypeConfig[] {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      const stored = window.localStorage.getItem(GD_TYPES_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {}
  }
  return [...INITIAL_GD_TYPES];
}

function saveTypesToStorage(types: GDEntryTypeConfig[]) {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      window.localStorage.setItem(GD_TYPES_STORAGE_KEY, JSON.stringify(types));
    } catch (e) {}
  }
}

let memoryRecordsStore: GeneralDiaryRecord[] = loadRecordsFromStorage();
let memoryTypesStore: GDEntryTypeConfig[] = loadTypesFromStorage();

// -------------------------------------------------------------
// Chronological helpers for LOCAL back-dated resequencing (mirror of the
// server-side resequenceDay). Parses "yyyy-mm-dd hh:mm AM/PM", ISO, or
// "dd/mm/yyyy hh:mm AM/PM" activity strings into epoch ms.
// -------------------------------------------------------------
function gdRecordTimeMs(r: GeneralDiaryRecord): number {
  const raw = (r.activityDateTime || "").trim();
  if (!raw) return 0;
  if (/^\d{4}-\d{2}-\d{2}T/.test(raw)) return new Date(raw).getTime();
  const parts = raw.split(" ");
  let dateKey = "";
  let timePart = "";
  if (raw.includes("/")) {
    const dmy = (parts[0] || "").split("/");
    if (dmy.length === 3) dateKey = `${dmy[2]}-${dmy[1]}-${dmy[0]}`;
    timePart = parts.slice(1).join(" ");
  } else {
    dateKey = parts[0] || "";
    timePart = parts.slice(1).join(" ");
  }
  const m = timePart.match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);
  if (!m) return 0;
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const ap = (m[3] || "").toUpperCase();
  if (ap === "AM" && h === 12) h = 0;
  if (ap === "PM" && h !== 12) h += 12;
  return new Date(
    `${dateKey}T${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}:00`
  ).getTime();
}

function gdRecordDateKey(r: GeneralDiaryRecord): string {
  const raw = (r.activityDateTime || "").trim();
  if (/^\d{4}-\d{2}-\d{2}T/.test(raw)) return raw.slice(0, 10);
  const first = raw.split(" ")[0] || "";
  if (first.includes("/")) {
    const dmy = first.split("/");
    return dmy.length === 3 ? `${dmy[2]}-${dmy[1]}-${dmy[0]}` : first;
  }
  return first;
}

// Renumber every locked entry of one local day chronologically — so a
// back-dated entry inserted between others shifts the later GD numbers.
function resequenceLocalDay(dateKey: string): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return 0;
  const day = memoryRecordsStore
    .filter((r) => r.isLocked && gdRecordDateKey(r) === dateKey)
    .sort((a, b) => gdRecordTimeMs(a) - gdRecordTimeMs(b));
  let changed = 0;
  day.forEach((r, i) => {
    const seq = i + 1;
    const gdNumber = `GD-${dateKey}-${String(seq).padStart(3, "0")}`;
    if (r.sequencePerDay !== seq || r.gdNumber !== gdNumber) changed++;
    r.sequencePerDay = seq;
    r.gdNumber = gdNumber;
  });
  if (changed > 0) saveRecordsToStorage(memoryRecordsStore);
  return changed;
}

// -------------------------------------------------------------
// Backend API helpers — the authoritative GD register lives on the
// server (SQLite). GD numbers & date/time are assigned server-side.
// Every call falls back to the local store if the backend is down.
// -------------------------------------------------------------
async function gdApiPost<T = any>(body: Record<string, unknown>): Promise<T> {
  const res = await fetch("/api/general-diary", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok || json?.success === false) {
    throw new Error(json?.error || `GD API error (${res.status})`);
  }
  return json as T;
}

async function gdApiGet<T = any>(queryString: string): Promise<T> {
  const res = await fetch(`/api/general-diary${queryString}`, { cache: "no-store" });
  const json = await res.json();
  if (!res.ok || json?.success === false) {
    throw new Error(json?.error || `GD API error (${res.status})`);
  }
  return json as T;
}

export const GeneralDiaryService = {
  // Synchronous helpers for UI components
  getTypes(): GDEntryTypeConfig[] {
    memoryTypesStore = loadTypesFromStorage();
    return memoryTypesStore;
  },

  getDraftById(id: string): GeneralDiaryRecord | undefined {
    memoryRecordsStore = loadRecordsFromStorage();
    return memoryRecordsStore.find((r) => r.id === id);
  },

  // Draft lookup against the server register (falls back to local store)
  async getDraftByIdAsync(id: string): Promise<GeneralDiaryRecord | undefined> {
    try {
      const json = await gdApiGet<{ record: GeneralDiaryRecord | null }>(
        `?action=BY_ID&id=${encodeURIComponent(id)}`
      );
      return json.record || undefined;
    } catch {
      return this.getDraftById(id);
    }
  },

  // Server clock (dd/mm/yyyy + HH:mm 24h key) for the entry form defaults
  async getServerNow(): Promise<{
    serverDateDisplay: string;
    serverTimeDisplay: string;
    serverTime24: string;
    serverTime12: string;
    serverDateISO: string;
    nextSequence: number;
    nextGdNumber: string;
  }> {
    const json = await gdApiGet<{ data: any }>("?action=SERVER_NOW");
    return json.data;
  },

  // -------------------------------------------------------------
  // 1. Core Server-side Paginated Search & Multi-criteria Filter
  // -------------------------------------------------------------
  async getPaginatedEntries(
    filter: GDSearchFilter = {},
    overridePage?: number,
    overridePageSize?: number
  ): Promise<GDPaginatedResponse> {
    // Backend-first: authoritative search over the persisted server register
    try {
      const params = new URLSearchParams();
      const mapped: Record<string, string | undefined> = {
        gdNumber: filter.gdNumber,
        startDate: filter.startDate,
        endDate: filter.endDate,
        officer: filter.officerQuery || filter.officerName,
        person: filter.personName,
        fir: filter.firNumber,
        complaint: filter.complaintNumber,
        vehicle: filter.vehicleNumber,
        type: filter.typeCode,
        status: filter.status && filter.status !== "ALL" ? filter.status : undefined,
        isLocked: filter.isLocked !== undefined ? String(filter.isLocked) : undefined,
        q: filter.keyword,
        page: String(Math.max(1, overridePage || filter.page || 1)),
        pageSize: String(Math.max(1, overridePageSize || filter.pageSize || 15)),
      };
      Object.entries(mapped).forEach(([key, value]) => {
        if (value !== undefined && value !== "") params.set(key, value);
      });
      const json = await gdApiGet<{ data: GDPaginatedResponse }>(`?${params.toString()}`);
      return json.data;
    } catch {
      // Backend unreachable — fall back to the local in-memory register
    }
    memoryRecordsStore = loadRecordsFromStorage();
    let list = [...memoryRecordsStore];

    const today = new Date().toISOString().split("T")[0];

    // Compute status counts before filtering
    const todayCount = list.filter((r) => r.isLocked && (r.activityDateTime.startsWith(today) || localDateKey(r) === today)).length;
    const lockedCount = list.filter((r) => r.status === "LOCKED").length;
    const verifiedCount = list.filter((r) => r.status === "VERIFIED").length;
    const draftCount = list.filter((r) => r.status === "DRAFT").length;
    const suggestedCount = list.filter((r) => r.status === "SUGGESTED").length;

    // Filter by GD Number
    if (filter.gdNumber) {
      const q = filter.gdNumber.toLowerCase().trim();
      list = list.filter((r) => r.gdNumber.toLowerCase().includes(q));
    }

    // Filter by Date or Date Range
    function localDateKey(r: GeneralDiaryRecord): string {
      if (r._sortGdDate && /^\d{4}-\d{2}-\d{2}$/.test(r._sortGdDate)) {
        return r._sortGdDate;
      }
      let raw = (r.activityDateTime || "").split(" ")[0].split("T")[0];
      if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
      if (/^\d{4}-/.test(raw)) {
        const parts = raw.split("-");
        if (parts.length >= 3) {
          return `${parts[0]}-${parts[1].padStart(2, "0")}-${parts[2].slice(0, 2).padStart(2, "0")}`;
        }
        return raw.slice(0, 10);
      }
      const parts = raw.split("/");
      if (parts.length === 3) {
        return `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
      }
      return raw.slice(0, 10);
    }

    if (filter.startDate) {
      list = list.filter((r) => localDateKey(r) >= filter.startDate!);
    }
    if (filter.endDate) {
      list = list.filter((r) => localDateKey(r) <= filter.endDate!);
    }

    // Filter by Officer (Entry-For or Author)
    const officerQuery = filter.officerQuery || filter.officerName;
    if (officerQuery) {
      const q = officerQuery.toLowerCase().trim();
      list = list.filter(
        (r) =>
          r.entryForOfficer.name.toLowerCase().includes(q) ||
          r.entryForOfficer.beltNumber.toLowerCase().includes(q) ||
          r.entryForOfficer.pno.toLowerCase().includes(q) ||
          r.actualAuthor.name.toLowerCase().includes(q) ||
          r.actualAuthor.pno.toLowerCase().includes(q)
      );
    }

    // Filter by locked status
    if (filter.isLocked !== undefined) {
      list = list.filter((r) => r.isLocked === filter.isLocked);
    }

    // Filter by Person / Accused
    if (filter.personName) {
      const q = filter.personName.toLowerCase().trim();
      list = list.filter((r) => r.relatedRecords?.personName?.toLowerCase().includes(q));
    }

    // Filter by FIR Number
    if (filter.firNumber) {
      const q = filter.firNumber.toLowerCase().trim();
      list = list.filter((r) => r.relatedRecords?.firNumber?.toLowerCase().includes(q));
    }

    // Filter by Complaint Number
    if (filter.complaintNumber) {
      const q = filter.complaintNumber.toLowerCase().trim();
      list = list.filter((r) => r.relatedRecords?.complaintNumber?.toLowerCase().includes(q));
    }

    // Filter by Vehicle Number
    if (filter.vehicleNumber) {
      const q = filter.vehicleNumber.toLowerCase().trim();
      list = list.filter((r) => r.relatedRecords?.vehicleNumber?.toLowerCase().includes(q));
    }

    // Filter by Type Code
    if (filter.typeCode && filter.typeCode !== "ALL") {
      list = list.filter((r) => r.typeCode === filter.typeCode);
    }

    // Filter by Status
    if (filter.status && filter.status !== "ALL") {
      list = list.filter((r) => r.status === filter.status);
    }

    // Full-Text Keyword Search across narrative, subject, station, related
    if (filter.keyword) {
      const q = filter.keyword.toLowerCase().trim();
      list = list.filter(
        (r) =>
          r.subject.toLowerCase().includes(q) ||
          r.narrative.toLowerCase().includes(q) ||
          r.gdNumber.toLowerCase().includes(q) ||
          r.typeDisplay.toLowerCase().includes(q) ||
          r.typeDisplayHi.includes(q) ||
          r.entryForOfficer.name.toLowerCase().includes(q) ||
          r.actualAuthor.name.toLowerCase().includes(q) ||
          r.relatedRecords?.firNumber?.toLowerCase().includes(q) ||
          r.relatedRecords?.complaintNumber?.toLowerCase().includes(q)
      );
    }

    // Sort order:
    // 1. Pending Suggestions & Drafts first if in draft view
    // 2. Otherwise locked entries in GD-number order (per-day sequence)
    list.sort((a, b) => {
      if (a.status === "SUGGESTED" && b.status !== "SUGGESTED") return -1;
      if (b.status === "SUGGESTED" && a.status !== "SUGGESTED") return 1;
      if (a.status === "DRAFT" && b.status !== "DRAFT") return -1;
      if (b.status === "DRAFT" && a.status !== "DRAFT") return 1;
      const dayComp = localDateKey(b).localeCompare(localDateKey(a));
      if (dayComp !== 0) return dayComp;
      return b.sequencePerDay - a.sequencePerDay;
    });

    const total = list.length;
    const page = Math.max(1, overridePage || filter.page || 1);
    const pageSize = Math.max(1, overridePageSize || filter.pageSize || 15);
    const totalPages = Math.ceil(total / pageSize) || 1;
    const startIndex = (page - 1) * pageSize;
    const records = list.slice(startIndex, startIndex + pageSize);

    return {
      records,
      total,
      page,
      pageSize,
      totalPages,
      todayCount,
      lockedCount,
      verifiedCount,
      draftCount,
      suggestedCount,
    };
  },

  // -------------------------------------------------------------
  // 2. Fetch Single GD Record by ID or Number
  // -------------------------------------------------------------
  async getRecordById(idOrNumber: string): Promise<GeneralDiaryRecord | undefined> {
    try {
      const json = await gdApiGet<{ record: GeneralDiaryRecord | null }>(
        `?action=BY_ID&id=${encodeURIComponent(idOrNumber)}`
      );
      return json.record || undefined;
    } catch {
      // fall back to local register
    }
    memoryRecordsStore = loadRecordsFromStorage();
    return memoryRecordsStore.find(
      (r) => r.id === idOrNumber || r.gdNumber.toLowerCase() === idOrNumber.toLowerCase()
    );
  },

  // -------------------------------------------------------------
  // 3. Atomic GD Number Generator (Sequential per station per day)
  // -------------------------------------------------------------
  getNextAtomicGDNumber(dateStr: string, stationCode: string = "PS-THN"): { gdNumber: string; sequence: number } {
    memoryRecordsStore = loadRecordsFromStorage();
    const lockedToday = memoryRecordsStore.filter(
      (r) => r.isLocked && r.activityDateTime.startsWith(dateStr)
    );
    const sequence = lockedToday.length + 1;
    const padded = String(sequence).padStart(3, "0");
    const gdNumber = `GD-${dateStr}-${padded}`;
    return { gdNumber, sequence };
  },

  // -------------------------------------------------------------
  // 4. Create Draft Entry (Unofficial, editable, deletable)
  // -------------------------------------------------------------
  async saveDraft(entry: {
    id?: string;
    typeCode: string;
    category?: GDEntryCategory;
    typeDisplay?: string;
    typeDisplayHi?: string;
    subject: string;
    narrative?: string;
    activityDate?: string;
    activityTime?: string;
    activityDateTime?: string;
    entryForOfficer?: GDOfficerParticulars;
    actualAuthor?: GDOfficerParticulars;
    policeStation?: string;
    district?: string;
    caseType?: "ADULT" | "JUVENILE & ADULT" | "ONLY JUVENILE" | string;
    actsAndSections?: string;
    actsAndSectionsList?: FIRActSectionEntry[];
    majorAct?: string;
    relatedRecords?: GDRelatedRecords;
    attachments?: GDUploadedDocument[];
  }): Promise<GeneralDiaryRecord> {
    // Backend-first: persist the draft on the server (searchable later)
    try {
      const json = await gdApiPost<{ draft: GeneralDiaryRecord }>({
        action: "SAVE_DRAFT",
        id: entry.id,
        typeCode: entry.typeCode,
        category: entry.category,
        typeDisplay: entry.typeDisplay,
        typeDisplayHi: entry.typeDisplayHi,
        subject: entry.subject,
        narrative: entry.narrative,
        activityDate: entry.activityDate,
        activityTime: entry.activityTime,
        entryForOfficer: entry.entryForOfficer,
        actualAuthor: entry.actualAuthor,
        policeStation: entry.policeStation,
        district: entry.district,
        caseType: entry.caseType,
        actsAndSections: entry.actsAndSections,
        actsAndSectionsList: entry.actsAndSectionsList,
        majorAct: entry.majorAct,
        relatedRecords: entry.relatedRecords,
        attachments: entry.attachments,
      });
      return json.draft;
    } catch {
      // Backend unreachable — fall back to local draft store
    }
    memoryRecordsStore = loadRecordsFromStorage();
    const typeDef = memoryTypesStore.find((t) => t.code === entry.typeCode) || memoryTypesStore[0];

    const nowIso = new Date().toISOString();
    const defaultAuthor: GDOfficerParticulars = {
      name: "HC Devinder Kumar",
      rank: "Head Constable (MHC)",
      beltNumber: "889/KKR",
      pno: "05192834",
    };
    const defaultOfficer: GDOfficerParticulars = {
      name: "SI Malkeet",
      rank: "Sub-Inspector",
      beltNumber: "512/KKR",
      pno: "08192841",
    };

    const actualAuthor = entry.actualAuthor || defaultAuthor;
    const entryForOfficer = entry.entryForOfficer || defaultOfficer;
    const activityDateTime = entry.activityDateTime || nowIso;
    const policeStation = entry.policeStation || "PS City Panipat";
    const district = entry.district || "Panipat";
    const narrative = entry.narrative || "";

    if (entry.id) {
      const idx = memoryRecordsStore.findIndex((r) => r.id === entry.id);
      if (idx !== -1) {
        if (memoryRecordsStore[idx].isLocked) {
          throw new Error("Security Error: Locked GD entry cannot be edited under PPR 22.48.");
        }
        memoryRecordsStore[idx] = {
          ...memoryRecordsStore[idx],
          typeCode: entry.typeCode,
          typeDisplay: entry.typeDisplay || typeDef.nameEn,
          typeDisplayHi: entry.typeDisplayHi || typeDef.nameHi,
          subject: entry.subject,
          narrative,
          activityDateTime,
          entryForOfficer,
          actualAuthor,
          relatedRecords: entry.relatedRecords,
          auditTrail: [
            ...memoryRecordsStore[idx].auditTrail,
            {
              action: "EDITED",
              performedBy: actualAuthor.name,
              performedByPno: actualAuthor.pno,
              performedByRank: actualAuthor.rank,
              timestamp: nowIso,
              auditId: generateAuditId("EDIT"),
              remarks: "Draft updated by officer",
            },
          ],
        };
        saveRecordsToStorage(memoryRecordsStore);
        return memoryRecordsStore[idx];
      }
    }

    const newDraft: GeneralDiaryRecord = {
      id: `gd_draft_${Date.now()}`,
      gdNumber: "GD-DRAFT",
      sequencePerDay: 0,
      policeStation,
      district,
      entryForOfficer,
      actualAuthor,
      typeCode: entry.typeCode,
      category: entry.category || typeDef.category,
      typeDisplay: entry.typeDisplay || typeDef.nameEn,
      typeDisplayHi: entry.typeDisplayHi || typeDef.nameHi,
      subject: entry.subject,
      narrative,
      caseType: entry.caseType || entry.relatedRecords?.caseType,
      actsAndSections: entry.actsAndSections || entry.relatedRecords?.actsAndSections,
      majorAct: entry.majorAct || entry.relatedRecords?.majorAct,
      activityDateTime,
      officialCreationTimestamp: nowIso,
      status: "DRAFT",
      source: "MANUAL_ENTRY",
      isLocked: false,
      relatedRecords: entry.relatedRecords,
      auditTrail: [
        {
          action: "CREATED",
          performedBy: actualAuthor.name,
          performedByPno: actualAuthor.pno,
          performedByRank: actualAuthor.rank,
          timestamp: nowIso,
          auditId: generateAuditId("DRAFT"),
          remarks: "Saved as unofficial draft",
        },
      ],
    };

    memoryRecordsStore.unshift(newDraft);
    saveRecordsToStorage(memoryRecordsStore);
    return newDraft;
  },

  // -------------------------------------------------------------
  // 5. Delete Draft Entry (Only DRAFT or SUGGESTED; Locked blocked)
  // -------------------------------------------------------------
  async deleteDraft(id: string): Promise<boolean> {
    // Backend-first: delete on the server register
    try {
      const json = await gdApiPost<{ success: boolean }>({ action: "DELETE_DRAFT", id });
      memoryRecordsStore = loadRecordsFromStorage().filter((r) => r.id !== id);
      saveRecordsToStorage(memoryRecordsStore);
      return json.success;
    } catch {
      // fall back to local deletion
    }
    memoryRecordsStore = loadRecordsFromStorage();
    const target = memoryRecordsStore.find((r) => r.id === id);
    if (!target) return false;
    if (target.isLocked) {
      throw new Error("Violation Error: Locked GD entry cannot be deleted. All entries are permanent under law.");
    }
    memoryRecordsStore = memoryRecordsStore.filter((r) => r.id !== id);
    saveRecordsToStorage(memoryRecordsStore);
    return true;
  },

  // -------------------------------------------------------------
  // 6. Verify and Lock GD Entry (Immutable & Atomic Assignment)
  // -------------------------------------------------------------
  async verifyAndLockEntry(
    idOrData: string | Partial<GeneralDiaryRecord>,
    verifier: GDOfficerParticulars,
    verificationRemarks?: string
  ): Promise<GeneralDiaryRecord> {
    // Backend-first: server assigns the atomic per-day GD number
    if (typeof idOrData === "string") {
      try {
        const json = await gdApiPost<{ record: GeneralDiaryRecord }>({
          action: "VERIFY_AND_LOCK",
          id: idOrData,
          verifier,
          remarks: verificationRemarks,
        });
        memoryRecordsStore = loadRecordsFromStorage().filter((r) => r.id !== idOrData);
        saveRecordsToStorage(memoryRecordsStore);
        return json.record;
      } catch {
        // fall back to local lock flow
      }
    }
    memoryRecordsStore = loadRecordsFromStorage();
    const now = new Date();
    const nowIso = now.toISOString();

    let targetRecord: GeneralDiaryRecord | undefined;

    if (typeof idOrData === "string") {
      targetRecord = memoryRecordsStore.find((r) => r.id === idOrData);
    } else if (idOrData.id) {
      targetRecord = memoryRecordsStore.find((r) => r.id === idOrData.id);
    }

    if (targetRecord && targetRecord.isLocked) {
      throw new Error("Security Violation: This General Diary record is already LOCKED and immutable.");
    }

    const activityDate = (targetRecord?.activityDateTime || (idOrData as any)?.activityDateTime || nowIso)
      .split(" ")[0]
      .split("T")[0];

    // Atomically assign unique sequential GD Number
    const { gdNumber, sequence } = this.getNextAtomicGDNumber(activityDate);
    const auditId = generateAuditId("V-LOCK");

    if (targetRecord) {
      // Transition from DRAFT / SUGGESTED to LOCKED
      targetRecord.gdNumber = gdNumber;
      targetRecord.sequencePerDay = sequence;
      targetRecord.status = "LOCKED";
      targetRecord.isLocked = true;
      targetRecord.verificationTimestamp = nowIso;
      targetRecord.verificationAuditId = auditId;
      targetRecord.verifiedBy = verifier;

      // Allow any final reviewed updates from idOrData if passed as object
      if (typeof idOrData === "object") {
        if (idOrData.subject) targetRecord.subject = idOrData.subject;
        if (idOrData.narrative) targetRecord.narrative = idOrData.narrative;
        if (idOrData.entryForOfficer) targetRecord.entryForOfficer = idOrData.entryForOfficer;
        if (idOrData.activityDateTime) targetRecord.activityDateTime = idOrData.activityDateTime;
        if (idOrData.relatedRecords) targetRecord.relatedRecords = idOrData.relatedRecords;
      }

      targetRecord.auditTrail.push({
        action: "VERIFIED",
        performedBy: verifier.name,
        performedByPno: verifier.pno,
        performedByRank: verifier.rank,
        timestamp: nowIso,
        auditId: generateAuditId("VER"),
        remarks: verificationRemarks || "Human verification completed",
      });

      targetRecord.auditTrail.push({
        action: "LOCKED",
        performedBy: verifier.name,
        performedByPno: verifier.pno,
        performedByRank: verifier.rank,
        timestamp: nowIso,
        auditId,
        remarks: `Permanently locked as ${gdNumber} under PPR 22.48`,
      });

      // Back-dated local entry — renumber the whole day chronologically
      resequenceLocalDay(gdRecordDateKey(targetRecord));

      saveRecordsToStorage(memoryRecordsStore);
      return targetRecord;
    }

    // Direct new entry straight to Verify & Lock
    const payload = idOrData as any;
    const typeDef = memoryTypesStore.find((t) => t.code === payload.typeCode) || memoryTypesStore[0];

    const newLockedRecord: GeneralDiaryRecord = {
      id: `gd_${Date.now()}`,
      gdNumber,
      sequencePerDay: sequence,
      policeStation: payload.policeStation || "PS City Panipat",
      district: payload.district || "Panipat",
      entryForOfficer: payload.entryForOfficer || verifier,
      actualAuthor: payload.actualAuthor || verifier,
      typeCode: payload.typeCode,
      category: typeDef.category,
      typeDisplay: typeDef.nameEn,
      typeDisplayHi: typeDef.nameHi,
      subject: payload.subject,
      narrative: payload.narrative,
      caseType: payload.caseType || payload.relatedRecords?.caseType,
      actsAndSections: payload.actsAndSections || payload.relatedRecords?.actsAndSections,
      majorAct: payload.majorAct || payload.relatedRecords?.majorAct,
      activityDateTime: payload.activityDateTime || `${activityDate} ${now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`,
      officialCreationTimestamp: nowIso,
      verificationTimestamp: nowIso,
      status: "LOCKED",
      source: payload.source || "MANUAL_ENTRY",
      isLocked: true,
      verificationAuditId: auditId,
      verifiedBy: verifier,
      relatedRecords: payload.relatedRecords || {},
      attachments: payload.attachments || [],
      auditTrail: [
        {
          action: "CREATED",
          performedBy: (payload.actualAuthor || verifier).name,
          performedByPno: (payload.actualAuthor || verifier).pno,
          performedByRank: (payload.actualAuthor || verifier).rank,
          timestamp: nowIso,
          auditId: generateAuditId("NEW"),
        },
        {
          action: "VERIFIED",
          performedBy: verifier.name,
          performedByPno: verifier.pno,
          performedByRank: verifier.rank,
          timestamp: nowIso,
          auditId: generateAuditId("VER"),
          remarks: verificationRemarks || "Officer confirmed factual authenticity",
        },
        {
          action: "LOCKED",
          performedBy: verifier.name,
          performedByPno: verifier.pno,
          performedByRank: verifier.rank,
          timestamp: nowIso,
          auditId,
          remarks: `Permanently assigned ${gdNumber}`,
        },
      ],
    };

    memoryRecordsStore.unshift(newLockedRecord);
    resequenceLocalDay(gdRecordDateKey(newLockedRecord));
    saveRecordsToStorage(memoryRecordsStore);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("cms-gd-updated"));
    }
    return newLockedRecord;
  },

  // -------------------------------------------------------------
  // 7. System Event & AI Suggestion Generator (Workflow #1)
  // -------------------------------------------------------------
  async generateSuggestionFromSystemEvent(event: {
    eventType:
      | "COMPLAINT_REGISTERED"
      | "COMPLAINT_CLOSURE"
      | "COMPLAINT_NCR"
      | "COMPLAINT_FIR_RECOMMENDED"
      | "FIR_LODGED"
      | "OFFICER_DISPATCHED"
      | "MALKHANA_SEIZURE"
      | "FIR_ARREST_MEMO"
      | "FIR_CRIME_DETAILS"
      | "FIR_PROPERTY_SEIZURE"
      | (string & {});
    subject: string;
    narrative: string;
    officer: GDOfficerParticulars;
    policeStation: string;
    district: string;
    category?: string;
    typeCode?: string;
    typeDisplay?: string;
    typeDisplayHi?: string;
    relatedRecords: GDRelatedRecords;
    attachments?: GDUploadedDocument[];
  }): Promise<GeneralDiaryRecord> {
    // 1. Try server persistence first
    try {
      const json = await gdApiPost<{ success: boolean; suggestion: GeneralDiaryRecord }>({
        action: "SYSTEM_EVENT_SUGGESTION",
        event,
      });
      if (json?.suggestion) {
        memoryRecordsStore = loadRecordsFromStorage().filter((r) => r.id !== json.suggestion.id);
        memoryRecordsStore.unshift(json.suggestion);
        saveRecordsToStorage(memoryRecordsStore);
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("cms-gd-updated"));
        }
        return json.suggestion;
      }
    } catch (apiErr) {
      console.warn("Backend suggestion API error, falling back to local:", apiErr);
    }

    // 2. Local fallback
    memoryRecordsStore = loadRecordsFromStorage();
    const today = new Date().toISOString().split("T")[0];
    const nowTime = new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    const nowIso = new Date().toISOString();

    const typeCodeMap: Record<string, string> = {
      COMPLAINT_REGISTERED: "CITIZEN_INFORMATION_TIP_RECEIVED",
      COMPLAINT_CLOSURE: "INVESTIGATION_REPORTS",
      COMPLAINT_NCR: "NON_COGNIZABLE_REPORT",
      COMPLAINT_FIR_RECOMMENDED: "CRIMINAL_CASE",
      FIR_LODGED: "CRIMINAL_CASE",
      OFFICER_DISPATCHED: "DEPARTURE",
      MALKHANA_SEIZURE: "PROPERTY_SEIZURE",
      FIR_ARREST_MEMO: "ARREST_RE_ARREST_SURRENDER",
      FIR_CRIME_DETAILS: "INVESTIGATION_REPORTS",
      FIR_PROPERTY_SEIZURE: "PROPERTY_SEIZURE",
      FIR_ACT_SECTION_MODIFIED: "INVESTIGATION_REPORTS",
    };

    const typeCode = event.typeCode || typeCodeMap[event.eventType] || "OTHERS";
    const typeDef = memoryTypesStore.find((t) => t.code === typeCode) || memoryTypesStore[0];

    const relRecords: GDRelatedRecords = { ...event.relatedRecords };
    if (event.attachments && Array.isArray(event.attachments)) {
      relRecords.attachments = event.attachments;
    }

    const defaultDisplayEn =
      event.eventType === "COMPLAINT_REGISTERED"
        ? "Citizen Information/Tip Received"
        : event.eventType === "COMPLAINT_CLOSURE"
        ? "Investigation Reports"
        : event.eventType === "COMPLAINT_NCR"
        ? "Non-Cognizable Report"
        : event.eventType === "COMPLAINT_FIR_RECOMMENDED"
        ? "Cognizable Crime / FIR Recommendation"
        : event.eventType === "FIR_LODGED"
        ? "Criminal case"
        : event.eventType === "FIR_ARREST_MEMO"
        ? "Arrest/Re-Arrest/Surrender"
        : event.eventType === "FIR_CRIME_DETAILS"
        ? "Crime Details Inspection"
        : event.eventType === "FIR_PROPERTY_SEIZURE"
        ? "Property Seizure"
        : event.eventType === "FIR_ACT_SECTION_MODIFIED"
        ? "Modification of Acts & Sections"
        : (typeDef?.nameEn || typeCode);

    const defaultDisplayHi =
      event.eventType === "COMPLAINT_REGISTERED"
        ? "प्राप्ति दरख्वास्त शिकायत (PPR 22.48)"
        : event.eventType === "COMPLAINT_CLOSURE"
        ? "जांच आख्या / निस्तारण शिकायत (PPR 22.48)"
        : event.eventType === "COMPLAINT_NCR"
        ? "असंज्ञेय अपराध रपट (BNSS धारा 174)"
        : event.eventType === "COMPLAINT_FIR_RECOMMENDED"
        ? "संज्ञेय अपराध / FIR पंजीकरण अनुशंसा (BNSS धारा 173)"
        : event.eventType === "FIR_LODGED"
        ? "पंजीकरण मुकद्दमा / FIR (PPR 22.48)"
        : event.eventType === "FIR_ARREST_MEMO"
        ? "गिरफ्तारी / पुनः गिरफ्तारी / समर्पण (PPR 22.48)"
        : event.eventType === "FIR_CRIME_DETAILS"
        ? "अपराध विवरण प्रपत्र / मौका मुआयना (IIF-II)"
        : event.eventType === "FIR_PROPERTY_SEIZURE"
        ? "बरामदगी / जब्ती माल प्रपत्र (IIF-IV)"
        : event.eventType === "FIR_ACT_SECTION_MODIFIED"
        ? "हवाला तरमीम धाराएं / वैधानिक संशोधन (PPR 22.48)"
        : (typeDef?.nameHi || typeCode);

    const suggestionRecord: GeneralDiaryRecord = {
      id: `gd_sugg_${Date.now()}`,
      gdNumber: "GD-PENDING-SUGGESTION",
      sequencePerDay: 0,
      policeStation: event.policeStation,
      district: event.district,
      entryForOfficer: event.officer,
      actualAuthor: {
        name: "System Automation",
        rank: "Event Service",
        beltNumber: "SYS/AUTO",
        pno: "00000000",
      },
      typeCode,
      category:
        (event.category as GDEntryCategory) ||
        typeDef?.category ||
        (event.eventType === "COMPLAINT_NCR"
          ? "COURT_DOCUMENTATION"
          : event.eventType === "COMPLAINT_CLOSURE" ||
            event.eventType === "COMPLAINT_FIR_RECOMMENDED" ||
            event.eventType.startsWith("FIR_")
          ? "INVESTIGATION_PROCESS"
          : "ROUTINE_ADMINISTRATION"),
      typeDisplay: event.typeDisplay || defaultDisplayEn,
      typeDisplayHi: event.typeDisplayHi || defaultDisplayHi,
      subject: event.subject,
      narrative: cleanGdNarrative(event.narrative),
      activityDateTime: `${today} ${nowTime}`,
      officialCreationTimestamp: nowIso,
      status: "SUGGESTED",
      source:
        event.eventType.startsWith("COMPLAINT_")
          ? "COMPLAINT_INTEGRATION"
          : event.eventType.startsWith("FIR_") ||
            event.eventType === "ARREST_RE_ARREST_SURRENDER" ||
            event.eventType === "PROPERTY_SEIZURE"
          ? "FIR_INTEGRATION"
          : "SYSTEM_EVENT",
      isLocked: false,
      relatedRecords: relRecords,
      attachments: event.attachments,
      auditTrail: [
        {
          action: "SUGGESTED",
          performedBy: "CMS Event Engine",
          performedByPno: "SYS/AUTO",
          performedByRank: "Automated Integration",
          timestamp: nowIso,
          auditId: generateAuditId("SYS"),
          remarks: `Auto-suggested from ${event.eventType}`,
        },
      ],
    };

    memoryRecordsStore.unshift(suggestionRecord);
    saveRecordsToStorage(memoryRecordsStore);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("cms-gd-updated"));
    }
    return suggestionRecord;
  },

  /**
   * Generates a Roznamcha GD Auto-Suggestion whenever key FIR forms
   * (Arrest/Surrender Memo Form 26.8, Crime Details IIF-II, Property Seizure IIF-IV)
   * are saved into an FIR Profile.
   */
  async createFirActionSuggestion(options: {
    actionType: "ARREST_MEMO" | "CRIME_DETAILS" | "PROPERTY_SEIZURE" | "ACT_SECTION_MODIFIED" | "FINAL_REPORT" | "NOTICE_ISSUED";
    firId: string;
    firNumber: string;
    policeStation?: string;
    district?: string;
    officer?: {
      name: string;
      rank?: string;
      beltNumber?: string;
      pno?: string;
    };
    personName?: string;
    actsAndSections?: string;
    previousActs?: string;
    newActs?: string;
    addedActs?: string[];
    deletedActs?: string[];
    reason?: string;
    place?: string;
    dateTime?: string;
    articlesSummary?: string;
    details?: string;
    docTitle?: string;
    attachments?: GDUploadedDocument[];
  }): Promise<GeneralDiaryRecord> {
    const ps = options.policeStation || "PS City Panipat";
    const dist = options.district || "Panipat";
    const officer: GDOfficerParticulars = {
      name: options.officer?.name || "Investigating Officer",
      rank: options.officer?.rank || "Sub-Inspector",
      beltNumber: options.officer?.beltNumber || "IO/FIR",
      pno: options.officer?.pno || "00000000",
    };

    let eventType: "FIR_ARREST_MEMO" | "FIR_CRIME_DETAILS" | "FIR_PROPERTY_SEIZURE" | "FIR_ACT_SECTION_MODIFIED" = "FIR_ARREST_MEMO";
    let typeCode = "ARREST_RE_ARREST_SURRENDER";
    let category = "INVESTIGATION_PROCESS";
    let typeDisplay = "Arrest/Re-Arrest/Surrender";
    let typeDisplayHi = "गिरफ्तारी / पुनः गिरफ्तारी / समर्पण (PPR 22.48)";
    let subject = "";
    let narrative = "";
    const harvestWords: string[] = [];
    const harvestPhrases: string[] = [];

    if (options.actionType === "ARREST_MEMO") {
      eventType = "FIR_ARREST_MEMO";
      typeCode = "ARREST_RE_ARREST_SURRENDER";
      typeDisplay = "Arrest/Re-Arrest/Surrender";
      typeDisplayHi = "गिरफ्तारी / पुनः गिरफ्तारी / समर्पण (PPR 22.48)";
      const accusedLabel = options.personName || "नामजद अभियुक्त";
      subject = `हवाला गिरफ्तारी / समर्पण न्यायालय - FIR No. ${options.firNumber} अभियुक्त ${accusedLabel}`;
      narrative = `बवक्त हाजा, मुकद्दमा नंबर ${options.firNumber} ${
        options.actsAndSections ? `जेर धारा ${options.actsAndSections}` : ""
      } थाना ${ps} में नामजद अभियुक्त ${accusedLabel} बाबत गिरफ्तारी / समर्पण न्यायालय वैधानिक प्रपत्र (Form 26.8(1) / IIF-III) तैयार किया गया। धारा 47 BNSS के तहत गिरफ्तारी के कारण व कानूनी अधिकारों की लिखित सूचना दी गई तथा परिजनों को संसूचित किया गया। हसब कायदा अभियुक्त की जामा तलाशी अमल में लाई गई तथा बरामद सामान जामातलाशी मालखाना में जमा कराया गया। रपट रोजनामचा आम दर्ज की गई।`;

      harvestWords.push(
        "गिरफ्तारी",
        "समर्पण",
        "जामातलाशी",
        "न्यायालय",
        "वारंट",
        "हवालात",
        "PPR 22.48",
        "BNSS",
        "धारा 47",
        "धारा 50",
        "फर्द",
        "सुपुर्दगी"
      );
      if (options.personName) harvestWords.push(options.personName);
      harvestPhrases.push(
        `बवक्त हाजा मुकद्दमा नंबर ${options.firNumber} में अभियुक्त ${options.personName || ""} की गिरफ्तारी / समर्पण प्रपत्र तैयार किया गया`,
        "धारा 47 BNSS के तहत गिरफ्तारी के कारण एवं अधिकारों से अवगत कराया गया",
        "जामा तलाशी मुकम्मल कर माल जामातलाशी मालखाना में जमा कराया गया"
      );
    } else if (options.actionType === "CRIME_DETAILS") {
      eventType = "FIR_CRIME_DETAILS";
      typeCode = "INVESTIGATION_REPORTS";
      typeDisplay = "Crime Details Inspection (IIF-II)";
      typeDisplayHi = "अपराध विवरण प्रपत्र / मौका मुआयना (IIF-II)";
      subject = `इंद्राज अपराध विवरण प्रपत्र (IIF-II) मौका मुआयना - FIR No. ${options.firNumber}`;
      narrative = `बवक्त हाजा, मुकद्दमा नंबर ${options.firNumber} ${
        options.actsAndSections ? `जेर धारा ${options.actsAndSections}` : ""
      } में तफ्तीश के दौरान घटनास्थल ${
        options.place ? `(${options.place})` : ""
      } का मौका मुआयना व निरीक्षण किया गया। घटनास्थल की भौगोलिक स्थिति, नजरी नक्शा मौका, भौतिक साक्ष्य तथा मोडस ऑपरेंडी (Modus Operandi) का विवरण दर्ज कर अपराध विवरण प्रपत्र (Crime Detail Form IIF-II) तैयार किया गया और FIR प्रोफाइल में संलग्न किया गया। हसब कायदा रपट रोजनामचा आम दर्ज की गई।`;

      harvestWords.push(
        "अपराध विवरण",
        "IIF-II",
        "मौका मुआयना",
        "नजरी नक्शा",
        "भौतिक साक्ष्य",
        "घटनास्थल",
        "साइंटिफIC एड्स",
        "मोडस ऑपरेंडी"
      );
      if (options.place) harvestWords.push(options.place);
      harvestPhrases.push(
        `बवक्त हाजा मुकद्दमा नंबर ${options.firNumber} में घटनास्थल मौका मुआयना कर IIF-II प्रपत्र भरा गया`,
        "घटनास्थल से भौतिक साक्ष्य संकलित कर नजरी नक्शा मौका तैयार किया गया"
      );
    } else if (options.actionType === "FINAL_REPORT") {
      eventType = "FIR_FINAL_REPORT" as any;
      typeCode = "INVESTIGATION_REPORTS";
      category = "INVESTIGATION_PROCESS";
      typeDisplay = "Police Final Report / Chargesheet (IIF-V u/s 193 BNSS)";
      typeDisplayHi = "अंतिम पुलिस प्रपत्र / चालान (IIF-V जेर धारा 193 BNSS)";
      subject = `हवाला चालान / अंतिम पुलिस रिपोर्ट (IIF-V u/s 193 BNSS) - FIR No. ${options.firNumber}`;
      narrative = `बवक्त हाजा, मुकद्दमा नंबर ${options.firNumber} ${
        options.actsAndSections ? `जेर धारा ${options.actsAndSections}` : ""
      } थाना ${ps} में तफ्तीश मुकम्मल होने उपरांत वैधानिक अंतिम रिपोर्ट (I.I.F.-V Final Form / Chargesheet under Section 193 BNSS) तैयार की गई। अभियोग में सभी साक्ष्य, फर्द मक़बूला, बयान गवाहान, एफएसएल रिपोर्ट व दस्तावेज संलग्न कर चालान तैयार किया गया तथा माननीय न्यायालय में प्रस्तुत करने हेतु रिपोर्ट रोजनामचा आम दर्ज की गई।`;

      harvestWords.push(
        "चालान",
        "अंतिम रिपोर्ट",
        "IIF-V",
        "193 BNSS",
        "दोषारोप पत्र",
        "न्यायालय",
        "गवाहान",
        "साक्ष्य",
        "तफ्तीश मुकम्मल"
      );
      if (options.personName) harvestWords.push(options.personName);
      harvestPhrases.push(
        `बवक्त हाजा मुकद्दमा नंबर ${options.firNumber} में चालान IIF-V u/s 193 BNSS तैयार किया गया`,
        "अभियोग में तफ्तीश मुकम्मल होने उपरांत अंतिम रिपोर्ट न्यायालय प्रेषित की गई"
      );
    } else if (options.actionType === "ACT_SECTION_MODIFIED") {
      eventType = "FIR_ACT_SECTION_MODIFIED";
      typeCode = "INVESTIGATION_REPORTS";
      typeDisplay = "Modification of Acts & Sections (धाराओं में तरमीम)";
      typeDisplayHi = "हवाला तरमीम धाराएं / वैधानिक संशोधन (PPR 22.48)";
      subject = `हवाला तरमीम / संशोधन धाराएं - FIR No. ${options.firNumber}`;

      const addedText = options.addedActs && options.addedActs.length > 0
        ? `इजाफा धाराएं: ${options.addedActs.join(", ")}। `
        : "";
      const deletedText = options.deletedActs && options.deletedActs.length > 0
        ? `हजफ / खारिज धाराएं: ${options.deletedActs.join(", ")}। `
        : "";
      const reasonText = options.reason ? `वजह तरमीम (Statutory Grounds): ${options.reason}` : "";

      narrative = `बवक्त हाजा, मुकद्दमा नंबर ${options.firNumber} थाना ${ps} में दौरान-ए-तफ्तीश संकलित साक्ष्य, बयानात गवाहान व वैधानिक तथ्यों के आधार पर धाराएं तरमीम (संशोधित) की गई हैं। पूर्व धाराएं: [${options.previousActs || "N/A"}] | संशोधित धाराएं: [${options.newActs || "N/A"}]। ${addedText}${deletedText}${reasonText}। हसब कायदा मिसल मुकदमा व रपट रोजनामचा आम में इंद्राज किया गया और उच्चाधिकारियों को ब-जरिए स्पेशल रिपोर्ट सूचित किया जा रहा है।`;

      harvestWords.push(
        "तरमीम धाराएं",
        "इजाफा धारा",
        "हजफ धारा",
        "PPR 22.48",
        "BNS",
        "BNSS",
        "तफ्तीश",
        "मिसल मुकदमा",
        "स्पेशल रिपोर्ट"
      );
      if (options.reason) harvestWords.push(options.reason);
      if (options.newActs) harvestWords.push(options.newActs);
      harvestPhrases.push(
        `बवक्त हाजा मुकद्दमा नंबर ${options.firNumber} में दौरान-ए-तफ्तीश धाराएं तरमीम की गईं`,
        "वैधानिक साक्ष्यों के आधार पर धाराएं जोड़कर/हटाकर रपट रोजनामचा दर्ज की गई"
      );
    } else {
      // PROPERTY_SEIZURE
      eventType = "FIR_PROPERTY_SEIZURE";
      typeCode = "PROPERTY_SEIZURE";
      typeDisplay = "Property Seizure / Recovery (IIF-IV)";
      typeDisplayHi = "बरामदगी / जब्ती माल प्रपत्र (IIF-IV)";
      subject = `इंद्राज फर्द जब्ती / तलाशी माल मुकदमा (IIF-IV) - FIR No. ${options.firNumber}`;
      narrative = `बवक्त हाजा, मुकद्दमा नंबर ${options.firNumber} में तलाशी व जब्ती की वैधानिक कार्यवाही अमल में लाई गई। मौका ${
        options.place ? `(${options.place})` : "घटनास्थल"
      } से ${
        options.personName ? `मुसम्मी ${options.personName} के कब्जे से` : ""
      } माल मुकदमा/दस्तावेज/सामग्री बरामद कर फर्द जब्ती प्रपत्र (Property Search & Seizure Form IIF-IV) तैयार किया गया। बरामदशुदा सामग्री को गवाहान के समक्ष सीलबंद किया गया तथा बा-हिफाजत मालखाना में जमा कराने हेतु रपट रोजनामचा आम दर्ज की गई।`;

      harvestWords.push(
        "जब्ती",
        "फर्द जब्ती",
        "IIF-IV",
        "बरामदगी",
        "सीलबंद",
        "माल मुकदमा",
        "गवाहान",
        "मालखाना",
        "तलाशी"
      );
      if (options.personName) harvestWords.push(options.personName);
      if (options.place) harvestWords.push(options.place);
      harvestPhrases.push(
        `बवक्त हाजा मुकद्दमा नंबर ${options.firNumber} में फर्द जब्ती माल (IIF-IV) तैयार कर माल मुकदमा सीलबंद किया गया`,
        "बरामदा माल मुकदमा को बा-हिफाजत मालखाना में जमा कराने हेतु रपट रोजनामचा आम दर्ज की गई"
      );
    }

    // Ingest into Roznamcha suggestion vocabulary engine
    try {
      suggestionStore.importHarvestedVocabulary(harvestWords, harvestPhrases);
    } catch (e) {
      console.warn("Failed to import harvested vocabulary:", e);
    }

    return this.generateSuggestionFromSystemEvent({
      eventType,
      category,
      typeCode,
      typeDisplay,
      typeDisplayHi,
      subject,
      narrative,
      policeStation: ps,
      district: dist,
      officer,
      relatedRecords: {
        firNumber: options.firNumber,
        personName: options.personName,
        destinationLocation: options.place,
        purpose: subject,
      },
      attachments: options.attachments,
    });
  },

  // -------------------------------------------------------------
  // 8. Types & Template Management (Requirement #3)
  // -------------------------------------------------------------
  async getAllTypes(): Promise<GDEntryTypeConfig[]> {
    memoryTypesStore = loadTypesFromStorage();
    return memoryTypesStore;
  },

  async getTemplatesForType(typeCode: string): Promise<GDTemplate[]> {
    memoryTypesStore = loadTypesFromStorage();
    const typeDef = memoryTypesStore.find((t) => t.code === typeCode);
    return typeDef?.defaultTemplates || [];
  },

  async saveCustomTemplate(template: GDTemplate): Promise<boolean> {
    memoryTypesStore = loadTypesFromStorage();
    const typeIdx = memoryTypesStore.findIndex((t) => t.code === template.typeCode);
    if (typeIdx === -1) return false;

    template.isUserSaved = true;
    memoryTypesStore[typeIdx].defaultTemplates.push(template);
    saveTypesToStorage(memoryTypesStore);
    return true;
  },

  // -------------------------------------------------------------
  // 9. Intelligent Duplicate Warning Checker (Requirement #4)
  // -------------------------------------------------------------
  async checkDuplicateWarning(
    officerPno: string,
    typeCode: string,
    activityDateTime: string,
    subject: string
  ): Promise<{ hasWarning: boolean; warningMessage?: string }> {
    memoryRecordsStore = loadRecordsFromStorage();
    const targetDate = activityDateTime.split(" ")[0];

    // Check 1: Officer already has a departure on this day without return
    if (typeCode === "DEPARTURE") {
      const departures = memoryRecordsStore.filter(
        (r) =>
          r.entryForOfficer.pno === officerPno &&
          r.typeCode === "DEPARTURE" &&
          r.activityDateTime.startsWith(targetDate)
      );
      const returns = memoryRecordsStore.filter(
        (r) =>
          r.entryForOfficer.pno === officerPno &&
          r.typeCode === "ARRIVAL_RETURN" &&
          r.activityDateTime.startsWith(targetDate)
      );
      if (departures.length > returns.length) {
        return {
          hasWarning: true,
          warningMessage: `चेतावनी (Duplicate Warning): अधिकारी (PNO: ${officerPno}) की आज पहले से रवानगी दर्ज है जिसका वापसी (Wapsi) इंद्राज अभी लंबित है।`,
        };
      }
    }

    // Check 2: Similar subject logged within last 3 hours
    const similar = memoryRecordsStore.find((r) => {
      if (!r.activityDateTime.startsWith(targetDate)) return false;
      const subA = r.subject.toLowerCase();
      const subB = subject.toLowerCase();
      return subA === subB || (subA.length > 15 && subB.includes(subA.substring(0, 15)));
    });

    if (similar) {
      return {
        hasWarning: true,
        warningMessage: `चेतावनी: इस विषय से मिलती-जुलती प्रविष्टि (${similar.gdNumber}) आज दर्ज की जा चुकी है। कृपया रपट संख्या जांच लें।`,
      };
    }

    return { hasWarning: false };
  },

  // -------------------------------------------------------------
  // 10. Backward-Compatibility Methods for existing components
  // -------------------------------------------------------------
  async getEntries(filter?: { date?: string; search?: string; entryType?: string }): Promise<GeneralDiaryRecord[]> {
    const res = await this.getPaginatedEntries({
      startDate: filter?.date,
      endDate: filter?.date,
      keyword: filter?.search,
      typeCode: filter?.entryType,
      pageSize: 500,
    });
    return res.records;
  },

  async addEntry(
    entryOrSubject:
      | {
          typeCode: string;
          category?: GDEntryCategory;
          typeDisplay?: string;
          typeDisplayHi?: string;
          subject: string;
          narrative: string;
          activityDate?: string;
          activityTime?: string;
          activityDateTime?: string;
          entryForOfficer?: GDOfficerParticulars;
          actualAuthor?: GDOfficerParticulars;
          policeStation?: string;
          district?: string;
          source?: any;
          caseType?: "ADULT" | "JUVENILE & ADULT" | "ONLY JUVENILE" | string;
          actsAndSections?: string;
          actsAndSectionsList?: FIRActSectionEntry[];
          majorAct?: string;
          relatedRecords?: GDRelatedRecords;
          attachments?: GDUploadedDocument[];
        }
      | string,
    narrative?: string,
    entryType?: any,
    officerName?: string,
    officerPno?: string,
    station?: string,
    relatedComplaintNumber?: string
  ): Promise<GeneralDiaryRecord> {
    if (typeof entryOrSubject === "object") {
      const payload = entryOrSubject;
      // Backend-first: server stamps the GD number by chronological position
      try {
        const json = await gdApiPost<{ record: GeneralDiaryRecord }>({
          action: "CREATE_LOCKED",
          typeCode: payload.typeCode,
          category: payload.category,
          typeDisplay: payload.typeDisplay,
          typeDisplayHi: payload.typeDisplayHi,
          subject: payload.subject,
          narrative: payload.narrative,
          entryForOfficer: payload.entryForOfficer,
          actualAuthor: payload.actualAuthor,
          policeStation: payload.policeStation,
          district: payload.district,
          source: payload.source,
          caseType: payload.caseType,
          actsAndSections: payload.actsAndSections,
          actsAndSectionsList: payload.actsAndSectionsList,
          majorAct: payload.majorAct,
          relatedRecords: payload.relatedRecords,
          attachments: payload.attachments,
          activityDate: payload.activityDate,
          activityTime: payload.activityTime,
        });
        return json.record;
      } catch {
        // Backend unreachable — fall back to the local register flow
      }
      const typeDef = memoryTypesStore.find((t) => t.code === payload.typeCode) || memoryTypesStore[0];
      const author: GDOfficerParticulars = payload.actualAuthor || {
        name: "HC Devinder Kumar",
        rank: "Head Constable (MHC)",
        pno: "HR-05192834",
        beltNumber: "889/KKR",
      };
      return this.verifyAndLockEntry(
        {
          subject: payload.subject,
          narrative: payload.narrative,
          typeCode: payload.typeCode,
          category: payload.category || typeDef.category,
          typeDisplay: payload.typeDisplay || typeDef.nameEn,
          typeDisplayHi: payload.typeDisplayHi || typeDef.nameHi,
          caseType: payload.caseType,
          actsAndSections: payload.actsAndSections,
          majorAct: payload.majorAct,
          activityDateTime:
            payload.activityDate && payload.activityTime
              ? formatGDActivityDateTime(
                  new Date(`${payload.activityDate}T${payload.activityTime}:00`)
                )
              : payload.activityDateTime
              ? (payload.activityDateTime.includes("T") ? formatGDActivityDateTime(new Date(payload.activityDateTime)) : payload.activityDateTime)
              : formatGDActivityDateTime(new Date()),
          entryForOfficer: payload.entryForOfficer || author,
          actualAuthor: author,
          policeStation: payload.policeStation || "PS City Panipat",
          district: payload.district || "Panipat",
          source: payload.source || "MANUAL_ENTRY",
          relatedRecords: payload.relatedRecords || {},
          attachments: payload.attachments || [],
        },
        author,
        "Direct verified entry"
      );
    } else {
      const author: GDOfficerParticulars = {
        name: officerName || "Police Officer",
        rank: "Police Officer",
        pno: officerPno || "05192834",
        beltNumber: officerPno ? `${officerPno.slice(-3)}/KKR` : "889/KKR",
      };
      return this.verifyAndLockEntry(
        {
          subject: entryOrSubject,
          narrative: narrative || "",
          typeCode: typeof entryType === "string" ? entryType : "OTHERS",
          policeStation: station || "PS City Panipat",
          relatedRecords: {
            complaintNumber: relatedComplaintNumber,
          },
        },
        author,
        "Verified entry created"
      );
    }
  },

  async getTodayCount(): Promise<number> {
    const res = await this.getPaginatedEntries({ pageSize: 1 });
    return res.todayCount;
  },

  async deleteAttachment(recordId: string, attachmentId: string): Promise<GeneralDiaryRecord> {
    const json = await gdApiPost<{ record: GeneralDiaryRecord }>({
      action: "DELETE_ATTACHMENT",
      id: recordId,
      attachmentId,
    });
    return json.record;
  },
};
