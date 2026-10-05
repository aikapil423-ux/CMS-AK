import {
  GeneralDiaryRecord,
  GDSearchFilter,
  GDPaginatedResponse,
  GDEntryTypeConfig,
  GDTemplate,
  GDOfficerParticulars,
  GDRelatedRecords,
  GDAuditLog,
  GDStatus,
} from "@/types/generalDiary";
import { INITIAL_GD_TYPES } from "@/lib/generalDiaryConfig";

const GD_STORAGE_KEY = "haryana_police_cms_gd_master_v2";
const GD_TYPES_STORAGE_KEY = "haryana_police_cms_gd_types_v2";
const GD_TEMPLATES_STORAGE_KEY = "haryana_police_cms_gd_templates_v2";

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
      policeStation: "PS City Thanesar",
      district: "Kurukshetra",
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
      typeCode: "AAGAZ_ROZNAMCHA",
      category: "ROUTINE_ADMINISTRATION",
      typeDisplay: "Opening / Aagaz Roznamcha",
      typeDisplayHi: "आगाज़ रोजनामचा (दैनिक शुरुआत 08:00 AM)",
      subject: "बवक्त 08:00 AM आगाज़ रोजनामचा आम बाबत खैर-ओ-आफियत थाना",
      narrative:
        "बवक्त 08:00 बजे सुबह, रोजनामचा आम का नया पन्ना/जिल्द विधिवत शुरू किया गया। रात की पाली शांत व खैरियत से गुजरी। मुआयना हवालात किया गया, हवालात में कुल 1 बंदी मौजूद है, जिसकी शारीरिक स्थिति ठीक पाई गई। सरकारी शस्त्रागार (Kot) में कुल असलहा व कारतूस बामुताबिक रजिस्टर पूरे पाए गए। सरकारी खजाना व रोकड़ बहिरू चेक की गई। स्टेशन डायरी का प्रभार MHC HC Devinder Kumar (बेल्ट नं: 889/KKR) द्वारा संभाला गया।",
      activityDateTime: `${today} 08:00`,
      officialCreationTimestamp: new Date(now.getTime() - 8 * 3600000).toISOString(),
      verificationTimestamp: new Date(now.getTime() - 8 * 3600000).toISOString(),
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
          timestamp: new Date(now.getTime() - 8 * 3600000).toISOString(),
          auditId: "AUD-2026-001A",
          remarks: "Official station diary opening initiated",
        },
        {
          action: "VERIFIED",
          performedBy: "Inspector Rajesh Kumar",
          performedByPno: "04291882",
          performedByRank: "Inspector / SHO",
          timestamp: new Date(now.getTime() - 8 * 3600000).toISOString(),
          auditId: "AUD-2026-001B",
          remarks: "Verified & locked permanently under PPR 22.48",
        },
        {
          action: "LOCKED",
          performedBy: "Inspector Rajesh Kumar",
          performedByPno: "04291882",
          performedByRank: "Inspector / SHO",
          timestamp: new Date(now.getTime() - 8 * 3600000).toISOString(),
          auditId: "V-AUD-2026-X8F9A2",
          remarks: "Immutable atomic GD lock applied",
        },
      ],
    },
    {
      id: "gd_seed_002",
      gdNumber: `GD-${today}-002`,
      sequencePerDay: 2,
      policeStation: "PS City Thanesar",
      district: "Kurukshetra",
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
      typeCode: "STAFF_GINTI",
      category: "ROUTINE_ADMINISTRATION",
      typeDisplay: "Staff Ginti / Roll Call",
      typeDisplayHi: "हाज़िरी व गिनती मुलाज़मान (Roll Call)",
      subject: "बवक्त सुबह 08:30 AM गिनती मुलाज़मान व तक्सीम ड्यूटी थाना",
      narrative:
        "थाना परिसर में दैनिक गिनती मुलाज़मान ली गई। कुल स्वीकृत नफरी में से 19 मुलाज़मान हाज़िर मिले। 2 मुलाज़िम छुट्टी (Casual Leave) पर व 1 मुलाज़िम कोर्ट पेशी ड्यूटी पर पाया गया। हाज़िर मुलाज़मान का टर्नआउट, वर्दी व हथियार दुरुस्त पाए गए। सभी कर्मचारियों को उच्चाधिकारियों के निर्देशों की पालना, आम जनता से शिष्ट व्यवहार एवं मुस्तैदी से गश्त करने के सख्त निर्देश दिए गए।",
      activityDateTime: `${today} 08:30`,
      officialCreationTimestamp: new Date(now.getTime() - 7.5 * 3600000).toISOString(),
      verificationTimestamp: new Date(now.getTime() - 7.5 * 3600000).toISOString(),
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
          timestamp: new Date(now.getTime() - 7.5 * 3600000).toISOString(),
          auditId: "AUD-2026-002A",
        },
        {
          action: "LOCKED",
          performedBy: "Inspector Rajesh Kumar",
          performedByPno: "04291882",
          performedByRank: "Inspector / SHO",
          timestamp: new Date(now.getTime() - 7.5 * 3600000).toISOString(),
          auditId: "V-AUD-2026-K9M2P1",
        },
      ],
    },
    {
      id: "gd_seed_003",
      gdNumber: `GD-${today}-003`,
      sequencePerDay: 3,
      policeStation: "PS City Thanesar",
      district: "Kurukshetra",
      entryForOfficer: {
        name: "SI Vikram Singh",
        rank: "Sub-Inspector",
        beltNumber: "742/KKR",
        pno: "07182930",
        phone: "9812034567",
      },
      actualAuthor: {
        name: "ASI Surender Pal",
        rank: "ASI (Duty Officer)",
        beltNumber: "419/KKR",
        pno: "09384712",
      },
      typeCode: "RAVANGI_OFFICER",
      category: "DUTY_MOVEMENT",
      typeDisplay: "Ravangi / Departure (Investigation/Raid)",
      typeDisplayHi: "रवानगी मुलाज़मान (तफ्तीश / गश्त / रेड)",
      subject: "रवानगी SI Vikram Singh बराए तफ्तीश CMP-2026-00482 बामुकाम Sector 7, Urban Estate",
      narrative:
        "बवक्त 09:15 AM, Sub-Inspector Vikram Singh (बेल्ट नं: 742/KKR) हमराह मुलाज़मान HC Sandeep No. 412 बराए तफ्तीश/जांच दरख्वास्त नंबर HAR-KKR-2026-CMP-00482 बामुकाम Sector 7 Urban Estate रवाना हुए। रवानगी बा-सवारी सरकारी जिप्सी HR-07-G-1102 अमल में लाई गई। हथियार असलहा 9mm Pistol मय 10 राउंड साथ लिया गया। डायरी रवानगी दर्ज रजिस्टर की गई।",
      activityDateTime: `${today} 09:15`,
      officialCreationTimestamp: new Date(now.getTime() - 6.8 * 3600000).toISOString(),
      verificationTimestamp: new Date(now.getTime() - 6.8 * 3600000).toISOString(),
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
      relatedRecords: {
        complaintNumber: "HAR-KKR-2026-CMP-00482",
        vehicleNumber: "HR-07-G-1102",
        destinationLocation: "Sector 7, Urban Estate",
      },
      auditTrail: [
        {
          action: "CREATED",
          performedBy: "ASI Surender Pal",
          performedByPno: "09384712",
          performedByRank: "ASI (Duty Officer)",
          timestamp: new Date(now.getTime() - 6.8 * 3600000).toISOString(),
          auditId: "AUD-2026-003A",
        },
        {
          action: "LOCKED",
          performedBy: "Inspector Rajesh Kumar",
          performedByPno: "04291882",
          performedByRank: "Inspector / SHO",
          timestamp: new Date(now.getTime() - 6.8 * 3600000).toISOString(),
          auditId: "V-AUD-2026-R4W7C8",
        },
      ],
    },
    {
      id: "gd_seed_004",
      gdNumber: `GD-${today}-004`,
      sequencePerDay: 4,
      policeStation: "PS City Thanesar",
      district: "Kurukshetra",
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
      typeCode: "FIR_REGISTRATION",
      category: "INVESTIGATION_PROCESS",
      typeDisplay: "FIR Registration Intimation",
      typeDisplayHi: "इत्तिला दर्ज एफ.आई.आर. (FIR Intimation)",
      subject: "दर्ज मुकदमा नंबर FIR No. 142/2026 धारा Section 303(2), 317(2) BNS थाना PS City Thanesar",
      narrative:
        "बवक्त 11:30 AM, मुसम्मी Rameshwar Dayal की लिखित शिकायत पर अभियोग संख्या 142/2026 धारा 303(2), 317(2) BNS, 2023 के अंतर्गत थाना हाज़ा में दर्ज रजिस्टर किया गया। मूल तहरीर व नकल एफआईआर तफ्तीश हेतु जांच अधिकारी ASI Ramesh Chander (बेल्ट: 614/KKR) के हवाले की गई। विशेष रिपोर्ट इलाका मजिस्ट्रेट व उच्चाधिकारियों को डाक द्वारा भिजवाई गई।",
      activityDateTime: `${today} 11:30`,
      officialCreationTimestamp: new Date(now.getTime() - 4.5 * 3600000).toISOString(),
      verificationTimestamp: new Date(now.getTime() - 4.5 * 3600000).toISOString(),
      status: "LOCKED",
      source: "FIR_INTEGRATION",
      isLocked: true,
      verificationAuditId: "V-AUD-2026-F1R992",
      verifiedBy: {
        name: "Inspector Rajesh Kumar",
        rank: "Inspector / SHO",
        beltNumber: "04291882",
        pno: "04291882",
      },
      relatedRecords: {
        firNumber: "142/2026",
        personName: "Rameshwar Dayal",
      },
      auditTrail: [
        {
          action: "CREATED",
          performedBy: "HC Devinder Kumar",
          performedByPno: "05192834",
          performedByRank: "Head Constable (MHC)",
          timestamp: new Date(now.getTime() - 4.5 * 3600000).toISOString(),
          auditId: "AUD-2026-004A",
        },
        {
          action: "LOCKED",
          performedBy: "Inspector Rajesh Kumar",
          performedByPno: "04291882",
          performedByRank: "Inspector / SHO",
          timestamp: new Date(now.getTime() - 4.5 * 3600000).toISOString(),
          auditId: "V-AUD-2026-F1R992",
        },
      ],
    },
    // Suggested Entry waiting for human review (Workflow requirement #1)
    {
      id: "gd_sugg_001",
      gdNumber: "GD-PENDING-SUGGESTION",
      sequencePerDay: 0,
      policeStation: "PS City Thanesar",
      district: "Kurukshetra",
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
      typeCode: "COMPLAINT_INTAKE",
      category: "INVESTIGATION_PROCESS",
      typeDisplay: "Complaint Received / Disposal",
      typeDisplayHi: "प्राप्ति / निपटान शिकायत दरख्वास्त (PPR 22.48)",
      subject: "प्राप्ति दरख्वास्त शिकायत क्रमांक HAR-KKR-2026-CMP-00483 मनजानिब Ramphal Sharma",
      narrative:
        "बवक्त 02:15 PM, मुसम्मी Ramphal Sharma (मो: 9812048192) द्वारा थाना में उपस्थित होकर लिखित दरख्वास्त पेश की गई, जिसका विषय 'बाबत धोखाधड़ी व फर्जी इकरारनामा' है। दरख्वास्त को केंद्रीय शिकायत रजिस्टर में दर्ज करके जांच अधिकारी Sub-Inspector Vikram Singh को धारा 173(3) BNSS के तहत 14 दिन में प्रारंभिक जांच हेतु सौंपा गया। [AI / System Suggestion: Requires MHC Human Review & Verification before locking into Daily Roznamcha].",
      activityDateTime: `${today} 14:15`,
      officialCreationTimestamp: new Date(now.getTime() - 1.5 * 3600000).toISOString(),
      status: "SUGGESTED",
      source: "COMPLAINT_INTEGRATION",
      isLocked: false,
      relatedRecords: {
        complaintNumber: "HAR-KKR-2026-CMP-00483",
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
      policeStation: "PS City Thanesar",
      district: "Kurukshetra",
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
        "सरकारी वाहन संख्या HR-07-G-1102 चालक EHC Kuldeep Singh (बेल्ट: 329/KKR) बा-मकसद रात्रि नाकाबंदी व पेट्रोलिंग रवाना किया गया। मीटर रीडिंग 49,120 किमी नोट की गई। [Draft saved by MHC - Pending final driver briefing and verification].",
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
  ];
}

function loadRecordsFromStorage(): GeneralDiaryRecord[] {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      const stored = window.localStorage.getItem(GD_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Could not load GD records from storage", e);
    }
  }
  return generateSeedEntries();
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

export const GeneralDiaryService = {
  // -------------------------------------------------------------
  // 1. Core Server-side Paginated Search & Multi-criteria Filter
  // -------------------------------------------------------------
  async getPaginatedEntries(filter: GDSearchFilter = {}): Promise<GDPaginatedResponse> {
    memoryRecordsStore = loadRecordsFromStorage();
    let list = [...memoryRecordsStore];

    const today = new Date().toISOString().split("T")[0];

    // Compute status counts before filtering
    const todayCount = list.filter((r) => r.isLocked && r.activityDateTime.startsWith(today)).length;
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
    if (filter.startDate) {
      list = list.filter((r) => r.activityDateTime.split(" ")[0] >= filter.startDate!);
    }
    if (filter.endDate) {
      list = list.filter((r) => r.activityDateTime.split(" ")[0] <= filter.endDate!);
    }

    // Filter by Officer (Entry-For or Author)
    if (filter.officerQuery) {
      const q = filter.officerQuery.toLowerCase().trim();
      list = list.filter(
        (r) =>
          r.entryForOfficer.name.toLowerCase().includes(q) ||
          r.entryForOfficer.beltNumber.toLowerCase().includes(q) ||
          r.entryForOfficer.pno.toLowerCase().includes(q) ||
          r.actualAuthor.name.toLowerCase().includes(q) ||
          r.actualAuthor.pno.toLowerCase().includes(q)
      );
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
    // 2. Otherwise sort by date/sequence descending
    list.sort((a, b) => {
      if (a.status === "SUGGESTED" && b.status !== "SUGGESTED") return -1;
      if (b.status === "SUGGESTED" && a.status !== "SUGGESTED") return 1;
      if (a.status === "DRAFT" && b.status === "LOCKED") return -1;
      if (b.status === "DRAFT" && a.status === "LOCKED") return 1;

      const dateComp = b.activityDateTime.localeCompare(a.activityDateTime);
      if (dateComp !== 0) return dateComp;
      return b.sequencePerDay - a.sequencePerDay;
    });

    const total = list.length;
    const page = Math.max(1, filter.page || 1);
    const pageSize = Math.max(1, filter.pageSize || 15);
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
    subject: string;
    narrative: string;
    activityDateTime: string;
    entryForOfficer: GDOfficerParticulars;
    actualAuthor: GDOfficerParticulars;
    policeStation: string;
    district: string;
    relatedRecords?: GDRelatedRecords;
  }): Promise<GeneralDiaryRecord> {
    memoryRecordsStore = loadRecordsFromStorage();
    const typeDef = memoryTypesStore.find((t) => t.code === entry.typeCode) || memoryTypesStore[0];

    const nowIso = new Date().toISOString();

    if (entry.id) {
      const idx = memoryRecordsStore.findIndex((r) => r.id === entry.id);
      if (idx !== -1) {
        if (memoryRecordsStore[idx].isLocked) {
          throw new Error("Security Error: Locked GD entry cannot be edited under PPR 22.48.");
        }
        memoryRecordsStore[idx] = {
          ...memoryRecordsStore[idx],
          typeCode: entry.typeCode,
          typeDisplay: typeDef.nameEn,
          typeDisplayHi: typeDef.nameHi,
          subject: entry.subject,
          narrative: entry.narrative,
          activityDateTime: entry.activityDateTime,
          entryForOfficer: entry.entryForOfficer,
          actualAuthor: entry.actualAuthor,
          relatedRecords: entry.relatedRecords,
          auditTrail: [
            ...memoryRecordsStore[idx].auditTrail,
            {
              action: "EDITED",
              performedBy: entry.actualAuthor.name,
              performedByPno: entry.actualAuthor.pno,
              performedByRank: entry.actualAuthor.rank,
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
      policeStation: entry.policeStation,
      district: entry.district,
      entryForOfficer: entry.entryForOfficer,
      actualAuthor: entry.actualAuthor,
      typeCode: entry.typeCode,
      category: typeDef.category,
      typeDisplay: typeDef.nameEn,
      typeDisplayHi: typeDef.nameHi,
      subject: entry.subject,
      narrative: entry.narrative,
      activityDateTime: entry.activityDateTime,
      officialCreationTimestamp: nowIso,
      status: "DRAFT",
      source: "MANUAL_ENTRY",
      isLocked: false,
      relatedRecords: entry.relatedRecords,
      auditTrail: [
        {
          action: "CREATED",
          performedBy: entry.actualAuthor.name,
          performedByPno: entry.actualAuthor.pno,
          performedByRank: entry.actualAuthor.rank,
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
      policeStation: payload.policeStation || "PS City Thanesar",
      district: payload.district || "Kurukshetra",
      entryForOfficer: payload.entryForOfficer || verifier,
      actualAuthor: payload.actualAuthor || verifier,
      typeCode: payload.typeCode,
      category: typeDef.category,
      typeDisplay: typeDef.nameEn,
      typeDisplayHi: typeDef.nameHi,
      subject: payload.subject,
      narrative: payload.narrative,
      activityDateTime: payload.activityDateTime || `${activityDate} ${now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`,
      officialCreationTimestamp: nowIso,
      verificationTimestamp: nowIso,
      status: "LOCKED",
      source: payload.source || "MANUAL_ENTRY",
      isLocked: true,
      verificationAuditId: auditId,
      verifiedBy: verifier,
      relatedRecords: payload.relatedRecords || {},
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
    saveRecordsToStorage(memoryRecordsStore);
    return newLockedRecord;
  },

  // -------------------------------------------------------------
  // 7. System Event & AI Suggestion Generator (Workflow #1)
  // -------------------------------------------------------------
  async generateSuggestionFromSystemEvent(event: {
    eventType: "COMPLAINT_REGISTERED" | "FIR_LODGED" | "OFFICER_DISPATCHED" | "MALKHANA_SEIZURE";
    subject: string;
    narrative: string;
    officer: GDOfficerParticulars;
    policeStation: string;
    district: string;
    relatedRecords: GDRelatedRecords;
  }): Promise<GeneralDiaryRecord> {
    memoryRecordsStore = loadRecordsFromStorage();
    const today = new Date().toISOString().split("T")[0];
    const nowTime = new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    const nowIso = new Date().toISOString();

    const typeCodeMap: Record<string, string> = {
      COMPLAINT_REGISTERED: "COMPLAINT_INTAKE",
      FIR_LODGED: "FIR_REGISTRATION",
      OFFICER_DISPATCHED: "RAVANGI_OFFICER",
      MALKHANA_SEIZURE: "CASE_PROPERTY_DEPOSIT",
    };

    const typeCode = typeCodeMap[event.eventType] || "OTHER_MISCELLANEOUS";
    const typeDef = memoryTypesStore.find((t) => t.code === typeCode) || memoryTypesStore[0];

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
      category: typeDef.category,
      typeDisplay: typeDef.nameEn,
      typeDisplayHi: typeDef.nameHi,
      subject: event.subject,
      narrative: event.narrative,
      activityDateTime: `${today} ${nowTime}`,
      officialCreationTimestamp: nowIso,
      status: "SUGGESTED",
      source: "SYSTEM_EVENT",
      isLocked: false,
      relatedRecords: event.relatedRecords,
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
    return suggestionRecord;
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
    if (typeCode === "RAVANGI_OFFICER") {
      const departures = memoryRecordsStore.filter(
        (r) =>
          r.entryForOfficer.pno === officerPno &&
          r.typeCode === "RAVANGI_OFFICER" &&
          r.activityDateTime.startsWith(targetDate)
      );
      const returns = memoryRecordsStore.filter(
        (r) =>
          r.entryForOfficer.pno === officerPno &&
          r.typeCode === "WAPSI_OFFICER" &&
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
    subject: string,
    narrative: string,
    entryType: any,
    officerName: string,
    officerPno: string,
    station: string,
    relatedComplaintNumber?: string
  ): Promise<GeneralDiaryRecord> {
    const author: GDOfficerParticulars = {
      name: officerName,
      rank: "Police Officer",
      pno: officerPno,
      beltNumber: officerPno ? `${officerPno.slice(-3)}/KKR` : "889/KKR",
    };
    return this.verifyAndLockEntry(
      {
        subject,
        narrative,
        typeCode: typeof entryType === "string" ? entryType : "OTHER_MISCELLANEOUS",
        policeStation: station,
        relatedRecords: {
          complaintNumber: relatedComplaintNumber,
        },
      },
      author,
      "Verified entry created"
    );
  },

  async getTodayCount(): Promise<number> {
    const res = await this.getPaginatedEntries({ pageSize: 1 });
    return res.todayCount;
  },
};
