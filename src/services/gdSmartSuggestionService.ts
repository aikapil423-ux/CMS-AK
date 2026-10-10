import fs from "fs";
import path from "path";
import {
  GeneralDiaryRecord,
  GDOfficerParticulars,
  GDRelatedRecords,
} from "@/types/generalDiary";
import { MOCK_COMPLAINTS, MOCK_HISTORICAL_FIRS } from "@/lib/mockData";

export interface VerifiedVehicle {
  id: string;
  label: string;
  type: string;
  regNo: string;
  defaultDriver: string;
}

export interface VerifiedWeapon {
  id: string;
  label: string;
  type: string;
  buttNo: string;
  ammo: string;
}

export interface VerifiedStaff {
  id: string;
  name: string;
  beltNumber: string;
  rank: string;
}

export interface VerifiedDeparture {
  id: string;
  gdNumber: string;
  officerName: string;
  officerRank: string;
  officerBelt: string;
  officerPno: string;
  departureTime: string;
  departureDate: string;
  teamMembers: string[];
  vehicleNumber: string;
  driverName?: string;
  weaponsIssued: string;
  destination: string;
  purpose: string;
  relatedType: "COMPLAINT" | "FIR" | "PATROL" | "COURT" | "NAKA" | "RAID";
  caseNumber?: string;
  personName?: string;
  isReturned?: boolean;
}

// -------------------------------------------------------------
// Verified Live Station Fleet (Vehicles)
// -------------------------------------------------------------
export const STATION_VEHICLES: VerifiedVehicle[] = [
  {
    id: "veh_gypsy_1",
    label: "Govt Gypsy HR-07-G-1234 (Patrol & Investigation 1)",
    type: "Four Wheeler (Gypsy)",
    regNo: "HR-07-G-1234",
    defaultDriver: "EHC Kuldeep Singh (329/KKR)",
  },
  {
    id: "veh_bolero_1",
    label: "Govt Bolero HR-07-G-5678 (IO Official Vehicle)",
    type: "Four Wheeler (Bolero)",
    regNo: "HR-07-G-5678",
    defaultDriver: "Ct. Sandeep Kumar (411/KKR)",
  },
  {
    id: "veh_erv_112",
    label: "ERSS ERV-112 HR-07-G-2244 (Dial 112 Emergency Van)",
    type: "Emergency Response Vehicle",
    regNo: "HR-07-G-2244",
    defaultDriver: "Ct. Naveen Kumar (702/KKR)",
  },
  {
    id: "veh_pcr_04",
    label: "PCR Van 04 HR-07-G-3311 (Night Domination Patrol)",
    type: "Four Wheeler (PCR Van)",
    regNo: "HR-07-G-3311",
    defaultDriver: "Ct. Sunil Dutt (801/KKR)",
  },
  {
    id: "veh_moto_1",
    label: "Govt Motorcycle HR-07-AB-9012 (Beat Rider)",
    type: "Two Wheeler",
    regNo: "HR-07-AB-9012",
    defaultDriver: "Self / Rider",
  },
  {
    id: "veh_none",
    label: "On Foot / Station Perimeter / Public Conveyance",
    type: "None",
    regNo: "N/A",
    defaultDriver: "N/A",
  },
];

// -------------------------------------------------------------
// Verified Station Kot / Malkhana Weapons
// -------------------------------------------------------------
export const STATION_WEAPONS: VerifiedWeapon[] = [
  {
    id: "wpn_glock",
    label: "Glock 9mm Pistol (Butt No. 14) + 30 live rounds",
    type: "9mm Pistol",
    buttNo: "14",
    ammo: "30 live 9mm rounds",
  },
  {
    id: "wpn_beretta",
    label: "Beretta 9mm Pistol (Butt No. 08) + 30 live rounds",
    type: "9mm Pistol",
    buttNo: "08",
    ammo: "30 live 9mm rounds",
  },
  {
    id: "wpn_insas",
    label: "INSAS 5.56mm Rifle (Butt No. 22) + 60 live rounds",
    type: "5.56mm Rifle",
    buttNo: "22",
    ammo: "60 live 5.56mm rounds",
  },
  {
    id: "wpn_carbine",
    label: "9mm SAF Carbine (Butt No. 05) + 40 live rounds",
    type: "Carbine",
    buttNo: "05",
    ammo: "40 live 9mm rounds",
  },
  {
    id: "wpn_riot",
    label: "Polycarbonate Riot Shield & Cane (Lathi)",
    type: "Anti-Riot",
    buttNo: "N/A",
    ammo: "Nil",
  },
  {
    id: "wpn_none",
    label: "No Weapon Issued (Unarmed Duty / Administrative)",
    type: "None",
    buttNo: "N/A",
    ammo: "Nil",
  },
];

// -------------------------------------------------------------
// Verified Station Staff (Accompanying Constables & Drivers)
// -------------------------------------------------------------
export const STATION_STAFF: VerifiedStaff[] = [
  { id: "staff_1", name: "Constable Praveen Kumar", beltNumber: "902/KKR", rank: "Constable" },
  { id: "staff_2", name: "Constable Vikas", beltNumber: "892/KKR", rank: "Constable" },
  { id: "staff_3", name: "EHC Kuldeep Singh", beltNumber: "329/KKR", rank: "EHC (Driver)" },
  { id: "staff_4", name: "ASI Ramesh Chander", beltNumber: "614/KKR", rank: "ASI" },
  { id: "staff_5", name: "Lady Ct. Pooja Devi", beltNumber: "718/KKR", rank: "Lady Constable" },
  { id: "staff_6", name: "HC Satish Kumar", beltNumber: "512/KKR", rank: "Head Constable" },
  { id: "staff_7", name: "Constable Naresh Kumar", beltNumber: "412/KKR", rank: "Constable" },
];

// -------------------------------------------------------------
// Active Live Departures (Field Movements Awaiting Return)
// -------------------------------------------------------------
export const DEFAULT_OPEN_DEPARTURES: VerifiedDeparture[] = [
  {
    id: "dep_001",
    gdNumber: "GD-2026-10-09-002",
    officerName: "SI Vikram Singh",
    officerRank: "Sub-Inspector",
    officerBelt: "742/KKR",
    officerPno: "07182930",
    departureTime: "09:30 AM",
    departureDate: "2026-10-09",
    teamMembers: ["Constable Praveen Kumar (902/KKR)", "EHC Kuldeep Singh (Driver)"],
    vehicleNumber: "Govt Gypsy HR-07-G-1234",
    driverName: "EHC Kuldeep Singh",
    weaponsIssued: "Glock 9mm Pistol (Butt No. 14) + 30 live rounds",
    destination: "Sector 7 Market, Kurukshetra",
    purpose: "Field Investigation & Spot Enquiry",
    relatedType: "COMPLAINT",
    caseNumber: "HAR-KKR-2026-CMP-00482",
    personName: "Kuldeep Sharma",
    isReturned: false,
  },
  {
    id: "dep_002",
    gdNumber: "GD-2026-10-09-003",
    officerName: "ASI Ramesh Chander",
    officerRank: "Assistant Sub-Inspector",
    officerBelt: "614/KKR",
    officerPno: "06281923",
    departureTime: "10:15 AM",
    departureDate: "2026-10-09",
    teamMembers: ["Constable Vikas (892/KKR)"],
    vehicleNumber: "Govt Bolero HR-07-G-5678",
    driverName: "Ct. Sandeep Kumar",
    weaponsIssued: "Beretta 9mm Pistol (Butt No. 08) + 30 live rounds",
    destination: "Agricultural Land, Khasra 14//8, Village Mirzapur",
    purpose: "Land Boundary Dispute Field Verification",
    relatedType: "COMPLAINT",
    caseNumber: "HAR-KKR-2026-CMP-00483",
    personName: "Baldev Singh",
    isReturned: false,
  },
  {
    id: "dep_003",
    gdNumber: "GD-2026-10-09-001",
    officerName: "SI Malkeet",
    officerRank: "Sub-Inspector",
    officerBelt: "512/KKR",
    officerPno: "08192841",
    departureTime: "08:00 AM",
    departureDate: "2026-10-09",
    teamMembers: ["Constable Naresh Kumar (412/KKR)"],
    vehicleNumber: "Govt Motorcycle HR-07-AB-9012",
    driverName: "Self",
    weaponsIssued: "Glock 9mm Pistol (Butt No. 14) + 30 live rounds",
    destination: "Railway Road Chowk & Main Bazaar Area",
    purpose: "Intensive Beat Patrolling, Bank Checking & Law Enforcement",
    relatedType: "PATROL",
    caseNumber: "Beat No. 2 Patrol",
    isReturned: false,
  },
  {
    id: "dep_004",
    gdNumber: "GD-2026-10-08-018",
    officerName: "Inspector Rajesh Kumar",
    officerRank: "Inspector / SHO",
    officerBelt: "04291882",
    officerPno: "04291882",
    departureTime: "04:30 PM",
    departureDate: "2026-10-08",
    teamMembers: ["SI Pooja Rani (819/KKR)", "Ct. Vikas (892/KKR)"],
    vehicleNumber: "Govt Gypsy HR-07-G-1234",
    weaponsIssued: "Glock 9mm Pistol (Butt No. 14) + 30 live rounds",
    destination: "District Courts Complex, Kurukshetra",
    purpose: "Supervisory Meeting & Production of Remand Papers",
    relatedType: "COURT",
    caseNumber: "FIR No. 44/2026",
    isReturned: false,
  },
];

// In-memory / localStorage departure tracking
const STORAGE_KEY_DEPARTURES = "cms_ak_verified_departures_v1";

export function getActiveDepartures(): VerifiedDeparture[] {
  if (typeof window === "undefined") return DEFAULT_OPEN_DEPARTURES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DEPARTURES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_DEPARTURES, JSON.stringify(DEFAULT_OPEN_DEPARTURES));
      return DEFAULT_OPEN_DEPARTURES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_OPEN_DEPARTURES;
  } catch {
    return DEFAULT_OPEN_DEPARTURES;
  }
}

export function saveDeparture(dep: VerifiedDeparture): void {
  if (typeof window === "undefined") return;
  try {
    const list = getActiveDepartures();
    const updated = [dep, ...list.filter((d) => d.id !== dep.id && d.gdNumber !== dep.gdNumber)];
    localStorage.setItem(STORAGE_KEY_DEPARTURES, JSON.stringify(updated));
  } catch (e) {
    console.error("Failed to save departure:", e);
  }
}

export function markDepartureReturned(gdNumber: string): void {
  if (typeof window === "undefined") return;
  try {
    const list = getActiveDepartures();
    const updated = list.map((d) => (d.gdNumber === gdNumber ? { ...d, isReturned: true } : d));
    localStorage.setItem(STORAGE_KEY_DEPARTURES, JSON.stringify(updated));
  } catch (e) {
    console.error("Failed to mark departure returned:", e);
  }
}

// -------------------------------------------------------------
// Live Verified Complaints & FIRs
// -------------------------------------------------------------
export function getLiveComplaints() {
  return MOCK_COMPLAINTS.map((c) => ({
    complaintNumber: c.complaintNumber,
    complainantName: c.complainantName,
    fatherName: c.complainantFatherSpouse || "N/A",
    mobile: c.complainantMobile,
    category: c.categoryDisplay,
    place: c.incidentPlace,
    assignedEo: c.assignedEoName || "SI Vikram Singh",
    assignedEoRank: c.assignedEoRank || "SI",
    status: c.status,
    incidentDetails: c.incidentDetails,
    accusedNames: (c.accusedList || []).map((a) => a.name).join(", ") || "Unknown",
  }));
}

export function getLiveFirs() {
  return MOCK_HISTORICAL_FIRS.map((f) => ({
    firNumber: f.firNumber,
    policeStation: f.policeStation,
    sectionsOfLaw: f.sectionsOfLaw,
    complainantName: f.complainantName,
    accusedNames: f.accusedNames.join(", "),
    status: f.status,
    incidentBrief: f.incidentBrief,
  }));
}

// -------------------------------------------------------------
// Standard Police Narrative Generators
// -------------------------------------------------------------

/**
 * Generates an Arrival (Wapsi) entry linked to a verified Departure.
 */
export function generateArrivalFromDeparture(
  dep: VerifiedDeparture,
  lang: "en" | "hi" | "bilingual" = "en"
): { subject: string; narrative: string; relatedRecords: GDRelatedRecords } {
  const staffText = dep.teamMembers.length > 0 ? dep.teamMembers.join(", ") : "alone";
  const caseRef = dep.caseNumber ? `in ${dep.caseNumber}` : "";
  const personRef = dep.personName ? `(Complainant/Party: ${dep.personName})` : "";

  let subject = `Wapsi - ${dep.officerName} from Duty (Ref: ${dep.gdNumber})`;
  let narrative = "";

  if (lang === "hi") {
    subject = `वापसी - ${dep.officerName} बाद तकमील ड्यूटी (हवाला रवानगी ${dep.gdNumber})`;
    narrative = `बवक्त वापसी: ${dep.officerName} (${dep.officerRank}) हमराह कर्मचारी ${staffText} ब-सवारी ${dep.vehicleNumber} बाद तकमील ड्यूटी ${dep.purpose} ${caseRef} ${personRef} ब-स्थान ${dep.destination}, बा-सलामत वापस थाना पहुंचे। रवानगी रोजनामचा क्रमांक ${dep.gdNumber} (बवक्त ${dep.departureTime}) का हवाला दिया गया। जारीशुदा असलाह सरकारी ${dep.weaponsIssued} सही-सलामत मालखाना / कोत में मोहर्रिर के पास जमा कराया गया। सरकारी वाहन का लॉगबुक इंद्राज दर्ज किया गया। रोजनामचा रपट मुकम्मल की गई।`;
  } else if (lang === "bilingual") {
    narrative = `At this time, ${dep.officerName} (${dep.officerRank}) along with staff ${staffText} returned safely to Police Station in ${dep.vehicleNumber}, following Departure GD No. ${dep.gdNumber} recorded at ${dep.departureTime}.\n\nबवक्त वापसी: ${dep.officerName} हमराह ${staffText} ब-सवारी ${dep.vehicleNumber} बाद तकमील ड्यूटी ${dep.purpose} ब-स्थान ${dep.destination} बा-सलामत वापस थाना पहुंचे। Official duty regarding ${dep.purpose} ${caseRef} successfully concluded. Issued weapons (${dep.weaponsIssued}) safely deposited in Kot with MHC. Vehicle logbook signed. Entered in General Diary under PPR 22.48.`;
  } else {
    narrative = `At this time, ${dep.officerName} (${dep.officerRank}) along with accompanying staff ${staffText} returned safely to the Police Station in ${dep.vehicleNumber}, in continuation of Departure GD No. ${dep.gdNumber} recorded at ${dep.departureTime}. Official duty of ${dep.purpose} ${caseRef} ${personRef} at ${dep.destination} was successfully concluded. All issued government weapons (${dep.weaponsIssued}) have been inspected and deposited back intact in the Kot with MHC. Vehicle logbook entries verified with ending odometer. Entered in General Diary under PPR 22.48.`;
  }

  const relatedRecords: GDRelatedRecords = {
    linkedDepartureGdNumber: dep.gdNumber,
    departureTime: dep.departureTime,
    vehicleNumber: dep.vehicleNumber,
    weaponsIssued: dep.weaponsIssued,
    destinationLocation: dep.destination,
    purpose: dep.purpose,
    complaintNumber: dep.relatedType === "COMPLAINT" ? dep.caseNumber : undefined,
    firNumber: dep.relatedType === "FIR" ? dep.caseNumber : undefined,
    personName: dep.personName,
    teamMembers: dep.teamMembers,
  };

  return { subject, narrative, relatedRecords };
}

/**
 * Generates a Departure (Ravangi) entry filled with verified particulars.
 */
export function generateDepartureDraft(options: {
  officerName: string;
  officerRank: string;
  teamMembers: string[];
  vehicle: string;
  driverName?: string;
  weapons: string;
  destination: string;
  purpose: string;
  caseType?: "COMPLAINT" | "FIR" | "PATROL" | "COURT" | "NAKA" | "OTHER";
  caseNumber?: string;
  personName?: string;
  lang?: "en" | "hi" | "bilingual";
}): { subject: string; narrative: string; relatedRecords: GDRelatedRecords } {
  const staffText = options.teamMembers.length > 0 ? options.teamMembers.join(", ") : "alone";
  const caseRef = options.caseNumber ? `in ${options.caseNumber}` : "";
  const personRef = options.personName ? `(Complainant: ${options.personName})` : "";
  const driverText = options.driverName ? `(Driver: ${options.driverName})` : "";

  let subject = `Ravangi - ${options.officerName} for ${options.purpose} ${options.caseNumber ? `(${options.caseNumber})` : ""}`.trim();
  let narrative = "";

  if (options.lang === "hi") {
    subject = `रवानागी - ${options.officerName} बराए ${options.purpose} ${options.caseNumber ? `(${options.caseNumber})` : ""}`.trim();
    narrative = `बवक्त रवानागी: ${options.officerName} (${options.officerRank}) हमराह कर्मचारी ${staffText} ब-सवारी ${options.vehicle} ${driverText} बराए ${options.purpose} ${caseRef} ${personRef} ब-स्थान ${options.destination} रवाना हुए। असलाह सरकारी ${options.weapons} मालखाना / कोत से हासिल किए गए। सरकारी वाहन का लॉगबुक इंद्राज दर्ज किया गया। रोजनामचा में इंद्राज किया गया।`;
  } else {
    narrative = `At this time, ${options.officerName} (${options.officerRank}) along with staff ${staffText} departed from the Police Station in government vehicle ${options.vehicle} ${driverText} for official duty regarding ${options.purpose} ${caseRef} ${personRef} to ${options.destination}. Government arms & ammunition (${options.weapons}) verified and issued from Kot under proper register entry. Vehicle fuel and starting logbook odometer verified. General Diary entry recorded in accordance with PPR 22.48.`;
  }

  const relatedRecords: GDRelatedRecords = {
    vehicleNumber: options.vehicle,
    weaponsIssued: options.weapons,
    destinationLocation: options.destination,
    purpose: options.purpose,
    complaintNumber: options.caseType === "COMPLAINT" ? options.caseNumber : undefined,
    firNumber: options.caseType === "FIR" ? options.caseNumber : undefined,
    personName: options.personName,
    teamMembers: options.teamMembers,
  };

  return { subject, narrative, relatedRecords };
}

/**
 * Generates an FIR Registration entry from a verified Complaint.
 */
export function generateFirFromComplaint(
  complaintNumber: string,
  firNo: string = "FIR No. 45/2026",
  sections: string = "115(2), 126(2), 351(2), 3(5) BNS",
  ioName: string = "SI Vikram Singh",
  lang: "en" | "hi" = "en"
): { subject: string; narrative: string; relatedRecords: GDRelatedRecords } {
  const comp = MOCK_COMPLAINTS.find((c) => c.complaintNumber === complaintNumber) || MOCK_COMPLAINTS[2];
  const accusedText = (comp.accusedList || []).map((a) => a.name).join(", ") || "Unknown persons";

  let subject = `FIR Registered - ${firNo} under ${sections} (${comp.complainantName})`;
  let narrative = "";

  if (lang === "hi") {
    subject = `पंजीकरण प्रथम सूचना रिपोर्ट (FIR) - ${firNo} (${comp.complainantName})`;
    narrative = `बवक्त हाजा, दरख्वास्त शिकायत क्रमांक ${comp.complaintNumber} मनजानिब ${comp.complainantName} पुत्र/पति ${comp.complainantFatherSpouse || "N/A"} निवासी ${comp.complainantAddress} पर अपराध संज्ञेय पाए जाने पर बा-हुक्म SHO महोदय, मुकद्दमा नंबर ${firNo} अंतर्गत धारा ${sections} दर्ज थाना किया गया। तफ्तीश मुकद्दमा ${ioName} को सौंपी गई। नामजद आरोपी: ${accusedText}। नकल FIR इलाका मजिस्ट्रेट व उच्चाधिकारियों को भेजी गई। रोजनामचा में इंद्राज मुकम्मल।`;
  } else {
    narrative = `At this time, upon preliminary enquiry of Complaint Docket ${comp.complaintNumber} submitted by ${comp.complainantName} s/o / w/o ${comp.complainantFatherSpouse || "N/A"} r/o ${comp.complainantAddress}, a cognizable offence is disclosed. Under orders of SHO, formal ${firNo} has been registered under Section ${sections}. Investigation of the case entrusted to Investigating Officer ${ioName}. Accused named: ${accusedText}. Copies of FIR dispatched to learned Area Judicial Magistrate and senior supervisory officers. Entered in General Diary under PPR 22.48.`;
  }

  const relatedRecords: GDRelatedRecords = {
    complaintNumber: comp.complaintNumber,
    firNumber: firNo,
    personName: comp.complainantName,
    destinationLocation: comp.incidentPlace,
  };

  return { subject, narrative, relatedRecords };
}

/**
 * Generates a Complaint Intake entry from verified citizen complaint docket.
 */
export function generateComplaintIntakeDraft(
  complaintNumber: string,
  lang: "en" | "hi" = "en"
): { subject: string; narrative: string; relatedRecords: GDRelatedRecords } {
  const comp = MOCK_COMPLAINTS.find((c) => c.complaintNumber === complaintNumber) || MOCK_COMPLAINTS[0];

  let subject = `Complaint Intake - ${comp.complaintNumber} from ${comp.complainantName}`;
  let narrative = "";

  if (lang === "hi") {
    subject = `प्राप्ति दरख्वास्त शिकायत - ${comp.complaintNumber} (${comp.complainantName})`;
    narrative = `बवक्त हाजा, मुसम्मी ${comp.complainantName} पुत्र/पति ${comp.complainantFatherSpouse || "N/A"} (मो: ${comp.complainantMobile}) निवासी ${comp.complainantAddress} द्वारा थाना में उपस्थित होकर लिखित दरख्वास्त पेश की गई, जिसका विषय '${comp.categoryDisplay}' है। दरख्वास्त को केंद्रीय शिकायत रजिस्टर में दर्ज करके जांच अधिकारी ${comp.assignedEoName || "SI Vikram Singh"} को धारा 173(3) BNSS के तहत 14 दिवस में प्रारंभिक जांच हेतु सौंपा गया। रोजनामचा में इंद्राज किया गया।`;
  } else {
    narrative = `At this time, citizen ${comp.complainantName} s/o / w/o ${comp.complainantFatherSpouse || "N/A"} (Mobile: ${comp.complainantMobile}) resident of ${comp.complainantAddress} appeared in person at the Police Station and submitted a written complaint regarding '${comp.categoryDisplay}'. Intake acknowledged and registered in CMS under Docket No. ${comp.complaintNumber}. Placed before SHO and assigned to Enquiry Officer ${comp.assignedEoName || "SI Vikram Singh"} for preliminary enquiry within statutory 14-day timeline under Section 173(3) BNSS. General Diary entry recorded.`;
  }

  const relatedRecords: GDRelatedRecords = {
    complaintNumber: comp.complaintNumber,
    personName: comp.complainantName,
    destinationLocation: comp.incidentPlace,
  };

  return { subject, narrative, relatedRecords };
}

/**
 * Generates dynamic verified suggestions for the Auto-Suggestions & Drafts tab.
 */
export function getSmartVerifiedSuggestions(): GeneralDiaryRecord[] {
  const now = new Date();
  const yyyy = String(now.getFullYear()).padStart(4, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const todayKey = `${yyyy}-${mm}-${dd}`;
  const nowTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  const departures = getActiveDepartures();
  const suggestions: GeneralDiaryRecord[] = [];

  // 1. Arrival suggestions for active departures
  departures.slice(0, 2).forEach((dep, idx) => {
    const arrival = generateArrivalFromDeparture(dep, "en");
    suggestions.push({
      id: `sugg_arrival_${dep.id}`,
      gdNumber: "GD-PENDING-SUGGESTION",
      sequencePerDay: 0,
      policeStation: "PS City Thanesar",
      district: "Kurukshetra",
      entryForOfficer: {
        name: dep.officerName,
        rank: dep.officerRank,
        beltNumber: dep.officerBelt,
        pno: dep.officerPno,
      },
      actualAuthor: {
        name: "Auto-Suggestion Engine (Smart GD)",
        rank: "Head Constable (MHC)",
        beltNumber: "889/KKR",
        pno: "05192834",
      },
      typeCode: "ARRIVAL_RETURN",
      category: "DUTY_MOVEMENT",
      typeDisplay: "Arrival/Return",
      typeDisplayHi: "वापसी / आगमन (PPR 22.48)",
      subject: arrival.subject,
      narrative: arrival.narrative,
      activityDateTime: `${todayKey} ${nowTime}`,
      officialCreationTimestamp: now.toISOString(),
      status: "SUGGESTED",
      source: "SYSTEM_EVENT",
      isLocked: false,
      relatedRecords: arrival.relatedRecords,
      auditTrail: [
        {
          action: "SUGGESTED",
          performedBy: "Smart General Diary Linker",
          performedByPno: "SYS/AUTO",
          performedByRank: "Automated Linker",
          timestamp: now.toISOString(),
          auditId: `SYS-ARRIV-LINK-${idx + 1}`,
          remarks: `Auto-suggested Arrival linked to verified Departure ${dep.gdNumber}`,
        },
      ],
      _sortGdDate: todayKey,
      _sortEntryMs: now.getTime() - (idx + 1) * 60000,
    });
  });

  // 2. FIR Registration suggestion for Complaint recommended for FIR (CMP-00484)
  const firDraft = generateFirFromComplaint("HAR-KKR-2026-CMP-00484", "FIR No. 45/2026", "115(2), 126(2), 351(2), 3(5) BNS", "SI Vikram Singh", "en");
  suggestions.push({
    id: "sugg_fir_cmp_00484",
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
      name: "Auto-Suggestion Engine (FIR Module)",
      rank: "Head Constable (MHC)",
      beltNumber: "889/KKR",
      pno: "05192834",
    },
    typeCode: "CRIMINAL_CASE",
    category: "INVESTIGATION_PROCESS",
    typeDisplay: "Criminal case",
    typeDisplayHi: "पंजीकरण मुकद्दमा / FIR (PPR 22.48)",
    subject: firDraft.subject,
    narrative: firDraft.narrative,
    activityDateTime: `${todayKey} 11:30`,
    officialCreationTimestamp: now.toISOString(),
    status: "SUGGESTED",
    source: "FIR_INTEGRATION",
    isLocked: false,
    relatedRecords: firDraft.relatedRecords,
    auditTrail: [
      {
        action: "SUGGESTED",
        performedBy: "Complaint & FIR Integration Engine",
        performedByPno: "SYS/AUTO",
        performedByRank: "Automated Integration",
        timestamp: now.toISOString(),
        auditId: "SYS-FIR-SUGG-484",
        remarks: "Triggered: Complaint HAR-KKR-2026-CMP-00484 recommended for FIR by SHO",
      },
    ],
    _sortGdDate: todayKey,
    _sortEntryMs: now.getTime() - 120000,
  });

  // 3. Complaint Intake suggestion for newly received complaint (CMP-00486)
  const compDraft = generateComplaintIntakeDraft("HAR-KKR-2026-CMP-00486", "en");
  suggestions.push({
    id: "sugg_cmp_intake_00486",
    gdNumber: "GD-PENDING-SUGGESTION",
    sequencePerDay: 0,
    policeStation: "PS City Thanesar",
    district: "Kurukshetra",
    entryForOfficer: {
      name: "ASI Surender Pal",
      rank: "ASI (Duty Officer)",
      beltNumber: "419/KKR",
      pno: "09384712",
    },
    actualAuthor: {
      name: "Auto-Suggestion Engine (Citizen Portal)",
      rank: "Head Constable (MHC)",
      beltNumber: "889/KKR",
      pno: "05192834",
    },
    typeCode: "CITIZEN_INFORMATION_TIP_RECEIVED",
    category: "INVESTIGATION_PROCESS",
    typeDisplay: "Citizen Information/Tip Received",
    typeDisplayHi: "प्राप्ति दरख्वास्त शिकायत (PPR 22.48)",
    subject: compDraft.subject,
    narrative: compDraft.narrative,
    activityDateTime: `${todayKey} 08:35`,
    officialCreationTimestamp: now.toISOString(),
    status: "SUGGESTED",
    source: "COMPLAINT_INTEGRATION",
    isLocked: false,
    relatedRecords: compDraft.relatedRecords,
    auditTrail: [
      {
        action: "SUGGESTED",
        performedBy: "HarPath Citizen Portal Integration",
        performedByPno: "SYS/AUTO",
        performedByRank: "Automated Integration",
        timestamp: now.toISOString(),
        auditId: "SYS-CMP-INTAKE-486",
        remarks: "Auto-suggested upon intake of online complaint HAR-KKR-2026-CMP-00486",
      },
    ],
    _sortGdDate: todayKey,
    _sortEntryMs: now.getTime() - 180000,
  });

  const dismissed = getDismissedSuggestionIds();
  return suggestions.filter((s) => !dismissed.has(s.id));
}

const DISMISSED_FILE = path.join(process.cwd(), "prisma", "gd-dismissed-suggestions.json");
const inMemoryDismissed = new Set<string>();

export function getDismissedSuggestionIds(): Set<string> {
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem("cms_ak_dismissed_suggestions");
      if (raw) {
        const list = JSON.parse(raw);
        if (Array.isArray(list)) return new Set(list);
      }
    } catch {}
    return inMemoryDismissed;
  }
  try {
    if (fs.existsSync(DISMISSED_FILE)) {
      const raw = fs.readFileSync(DISMISSED_FILE, "utf-8");
      const list = JSON.parse(raw);
      if (Array.isArray(list)) return new Set(list);
    }
  } catch (e) {
    console.error("Error reading dismissed suggestions:", e);
  }
  return inMemoryDismissed;
}

export function dismissSuggestionId(id: string): void {
  inMemoryDismissed.add(id);
  if (typeof window !== "undefined") {
    try {
      const set = getDismissedSuggestionIds();
      set.add(id);
      localStorage.setItem("cms_ak_dismissed_suggestions", JSON.stringify(Array.from(set)));
    } catch {}
    return;
  }
  try {
    const set = getDismissedSuggestionIds();
    set.add(id);
    fs.writeFileSync(DISMISSED_FILE, JSON.stringify(Array.from(set), null, 2), "utf-8");
  } catch (e) {
    console.error("Error saving dismissed suggestions:", e);
  }
}
