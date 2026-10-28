import { createBlankTADABill } from "./tadaService";
import { indiaDate } from "@/lib/dataIntegrity";
import { UserSession } from "@/types";
import { GeneralDiaryRecord } from "@/types/generalDiary";
import {
  TADABillRecord,
  TourProgrammeJourneyRow,
  TAClaimJourneyRow,
  TourProgrammeForm,
  TAClaimJourneyDetailsForm,
  TABillMainPageForm,
} from "@/types/tada";
import { tadaService, createBlankTourJourneyRow, createBlankClaimJourneyRow } from "@/services/tadaService";
import { GeneralDiaryService } from "@/services/generalDiaryService";
import { amountToWordsEnglish, amountToWordsHindi } from "@/utils/numberToWords";

export interface MonthInfo {
  month: string; // e.g. "September"
  monthHindi: string; // e.g. "सितम्बर"
  monthNumber: string; // e.g. "09"
  monthIndex: number; // 0-11
  year: string; // e.g. "2026"
  startDate: string; // "2026-09-01"
  endDate: string; // "2026-09-30"
  label: string; // "September 2026"
  nextMonthNum: string; // "10"
  nextMonthYear: string; // "2026"
}

const MONTH_NAMES_EN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const MONTH_NAMES_HI = [
  "जनवरी", "फ़रवरी", "मार्च", "अप्रैल", "मई", "जून",
  "जुलाई", "अगस्त", "सितम्बर", "अक्टूबर", "नवम्बर", "दिसम्बर"
];

/**
 * Returns month details for the PREVIOUS calendar month relative to given date
 */
export function getLastMonthInfo(referenceDate: Date = new Date()): MonthInfo {
  const currentYear = referenceDate.getFullYear();
  const currentMonthIdx = referenceDate.getMonth(); // 0 for Jan, 9 for Oct

  let targetYear = currentYear;
  let targetMonthIdx = currentMonthIdx - 1;

  if (targetMonthIdx < 0) {
    targetMonthIdx = 11; // December
    targetYear = currentYear - 1;
  }

  const daysInMonth = new Date(targetYear, targetMonthIdx + 1, 0).getDate();
  const monthNumStr = String(targetMonthIdx + 1).padStart(2, "0");

  const nextMonthNum = String(currentMonthIdx + 1).padStart(2, "0");
  const nextMonthYear = String(currentYear);

  return {
    month: MONTH_NAMES_EN[targetMonthIdx],
    monthHindi: MONTH_NAMES_HI[targetMonthIdx],
    monthNumber: monthNumStr,
    monthIndex: targetMonthIdx,
    year: String(targetYear),
    startDate: `${targetYear}-${monthNumStr}-01`,
    endDate: `${targetYear}-${monthNumStr}-${String(daysInMonth).padStart(2, "0")}`,
    label: `${MONTH_NAMES_EN[targetMonthIdx]} ${targetYear}`,
    nextMonthNum,
    nextMonthYear,
  };
}

/**
 * Returns month info for a specific year and month index (0-11)
 */
export function getSpecificMonthInfo(year: number, monthIdx: number): MonthInfo {
  const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();
  const monthNumStr = String(monthIdx + 1).padStart(2, "0");

  let nextM = monthIdx + 1;
  let nextY = year;
  if (nextM > 11) {
    nextM = 0;
    nextY = year + 1;
  }

  return {
    month: MONTH_NAMES_EN[monthIdx],
    monthHindi: MONTH_NAMES_HI[monthIdx],
    monthNumber: monthNumStr,
    monthIndex: monthIdx,
    year: String(year),
    startDate: `${year}-${monthNumStr}-01`,
    endDate: `${year}-${monthNumStr}-${String(daysInMonth).padStart(2, "0")}`,
    label: `${MONTH_NAMES_EN[monthIdx]} ${year}`,
    nextMonthNum: String(nextM + 1).padStart(2, "0"),
    nextMonthYear: String(nextY),
  };
}

/**
 * Returns list of recent 6 calendar months for on-demand sync
 */
export function getRecentMonthsList(count = 6): MonthInfo[] {
  const now = new Date();
  const list: MonthInfo[] = [];

  for (let i = 1; i <= count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    list.push(getSpecificMonthInfo(d.getFullYear(), d.getMonth()));
  }

  return list;
}

/**
 * Extract destination distance estimation (in KM) for official travel around Panipat/Haryana
 */
function estimateDistanceKm(destination: string): string {
  const lower = (destination || "").toLowerCase();
  if (lower.includes("chandigarh") || lower.includes("चंडीगढ़")) return "94";
  if (lower.includes("panchkula") || lower.includes("पंचकूला") || lower.includes("phq")) return "88";
  if (lower.includes("delhi") || lower.includes("दिल्ली")) return "160";
  if (lower.includes("madhuban") || lower.includes("fsl") || lower.includes("मधुबन")) return "45";
  if (lower.includes("karnal") || lower.includes("करनाल")) return "40";
  if (lower.includes("ambala") || lower.includes("अंबाला")) return "48";
  if (lower.includes("kaithal") || lower.includes("कैथल")) return "55";
  if (lower.includes("shahbad") || lower.includes("शाहबाद")) return "24";
  if (lower.includes("pehowa") || lower.includes("पेहोवा")) return "28";
  if (lower.includes("ladwa") || lower.includes("लाडवा")) return "18";
  if (lower.includes("court") || lower.includes("अदालत") || lower.includes("न्यायालय")) return "12";
  if (lower.includes("village") || lower.includes("गाँव") || lower.includes("field")) return "18";
  return "22";
}

/**
 * Daily Allowance (DA) rate based on police rank under Haryana Civil Services (TA) Rules
 */
function getDaRateForRank(rank: string = ""): number {
  const r = rank.toLowerCase();
  if (r.includes("inspector") || r.includes("sho") || r.includes("dsp")) return 500;
  if (r.includes("sub-inspector") || r.includes("si")) return 500;
  if (r.includes("assistant") || r.includes("asi")) return 400;
  if (r.includes("head") || r.includes("hc")) return 350;
  return 300; // Constable / Driver
}

export const tadaAutoFillService = {
  /**
   * Harvests all Roznamcha GD entries for the specified month
   * where the user was actively involved.
   */
  async extractUserGDEntries(user: UserSession, monthInfo: MonthInfo): Promise<TourProgrammeJourneyRow[]> {
    const userName = (user?.name || "").toLowerCase().trim();
    const userPno = (user?.pno || "").toLowerCase().trim();
    const userBelt = ((user as any)?.beltNo || "").toLowerCase().trim();

    // 1. Fetch all GD records from General Diary service / localStorage
    let allRecords: GeneralDiaryRecord[] = [];
    try {
      allRecords = await GeneralDiaryService.getEntries();
    } catch {
      if (typeof window !== "undefined" && window.localStorage) {
        try {
          const raw = window.localStorage.getItem("haryana_police_cms_gd_master_v3");
          if (raw) allRecords = JSON.parse(raw);
        } catch {}
      }
    }

    // 2. Filter records within target month
    const monthPrefix = `${monthInfo.year}-${monthInfo.monthNumber}`;
    const userEntries = (allRecords || []).filter((r) => {
      const display = r.activityDateTime || "";
      const match = /^(\d{2})\/(\d{2})\/(\d{4})/.exec(display);
      const actDate = match ? `${match[3]}-${match[2]}-${match[1]}` : indiaDate(r.officialCreationTimestamp || display);
      if (!r.isLocked || r.policeStation !== user.stationName || r.district !== user.district) return false;
      if (!r.relatedRecords?.destinationLocation) return false;
      const matchesMonth = actDate.includes(monthPrefix) ||
        (actDate >= monthInfo.startDate && actDate <= monthInfo.endDate + " 23:59");
      if (!matchesMonth) return false;

      // Check if user is referenced in entry
      const officerName = (r.entryForOfficer?.name || "").toLowerCase();
      const officerPno = (r.entryForOfficer?.pno || "").toLowerCase();
      const officerBelt = (r.entryForOfficer?.beltNumber || "").toLowerCase();
      const authorName = (r.actualAuthor?.name || "").toLowerCase();
      const authorPno = (r.actualAuthor?.pno || "").toLowerCase();
      const subject = (r.subject || "").toLowerCase();
      const narrative = (r.narrative || "").toLowerCase();
      const team = (r.relatedRecords?.teamMembers || []).map((t) => t.toLowerCase());

      const isOfficer = !!userName && officerName === userName || (userPno && officerPno.includes(userPno)) || (userBelt && officerBelt.includes(userBelt));
      const isAuthor = !!userName && authorName === userName || (userPno && authorPno.includes(userPno));
      const isInTeam = team.some((t) => !!userName && t === userName || !!userPno && t === userPno);
      const isInText = subject.includes(userName) || narrative.includes(userName);

      return isOfficer || isInTeam;
    });

    const journeys: TourProgrammeJourneyRow[] = [];

    // 3. Convert matching live GD records to Tour journeys
    userEntries.forEach((gd, idx) => {
      const display = gd.activityDateTime || "";
      const match = /^(\d{2})\/(\d{2})\/(\d{4})/.exec(display);
      const actDate = match ? `${match[3]}-${match[2]}-${match[1]}` : indiaDate(gd.officialCreationTimestamp || display);
      const actTime = gd.activityDateTime?.slice(11, 16) || "09:30 AM";
      const dest = gd.relatedRecords?.destinationLocation || gd.subject || "District Area Jurisdiction";
      const dist = "";
      const vehicle = gd.relatedRecords?.vehicleNumber || "";

      journeys.push({
        id: `auto_tour_gd_${gd.id || idx}`,
        srNo: idx + 1,
        departureDdNo: gd.gdNumber || `GD-${actDate}-${String(idx + 1).padStart(3, "0")}`,
        postingAndDepStation: gd.policeStation || user.stationName || "PS City Panipat",
        departureDate: actDate,
        departureTime: actTime,
        arrivalStation: dest,
        arrivalDdNo: "",
        arrivalDate: "",
        arrivalTime: "",
        purposeOfJourney: gd.relatedRecords?.purpose || gd.subject || "Official Police Investigation & Court Duty",
        modeOfVehicle: vehicle,
        distanceKm: dist,
        noOfDays: "",
      });
    });

    return journeys;
  },

  /**
   * Builds a complete, statutory 3-form TA/DA Bill for the user and month
   */
  buildTADABill(
    user: UserSession,
    monthInfo: MonthInfo,
    tourJourneys: TourProgrammeJourneyRow[]
  ): TADABillRecord {
    const bill = createBlankTADABill(user.id, user.name);
    bill.id = `TADA-${monthInfo.year}-${monthInfo.monthNumber}-${user.id}`;
    bill.autoGenerated = true;
    bill.source = "ROZNAMCHA_GD_AUTO";
    bill.claimPeriod = monthInfo.label;
    bill.totalJourneysCount = tourJourneys.length;
    bill.gdReferences = tourJourneys.map(j => j.departureDdNo).filter(Boolean);
    bill.form1TourProgramme = {...bill.form1TourProgramme, district:user.district || "", employeeName:user.name, designation:user.rankDisplay || user.rank || "", beltEmployeeNumber:user.pno || "", month:monthInfo.month, year:monthInfo.year, journeys:tourJourneys};
    bill.form2JourneyDetails = {...bill.form2JourneyDetails, employeeName:user.name, designation:user.rankDisplay || user.rank || "", headquarters:user.stationName || "", claimMonth:monthInfo.month, claimYear:monthInfo.year, journeys:tadaService.convertTourJourneysToClaim(tourJourneys)};
    bill.form3MainPage.financialYearFrom = String(Number(monthInfo.year) - (Number(monthInfo.monthNumber) < 4 ? 1 : 0));
    bill.form3MainPage.financialYearTo = String(Number(bill.form3MainPage.financialYearFrom) + 1);
    return bill;
  },

  /**
   * Automatic 01-date synchronization of Last Month's TA/DA Bill for the logged in user.
   * If a bill for last month already exists for this user, returns existing.
   * If not, extracts user's GD entries, builds the bill, and auto-saves to My TA History.
   */
  async autoSyncLastMonthBill(
    user: UserSession,
    force = false
  ): Promise<{
    generated: boolean;
    bill: TADABillRecord;
    count: number;
    monthLabel: string;
    message: string;
  }> {
    if (!user || !user.id) {
      throw new Error("No authenticated officer session found");
    }

    const monthInfo = getLastMonthInfo();
    const existingBills = tadaService.getByUser(user.id);

    // Check if user already has a bill for this month
    const existing = existingBills.find(
      (b) =>
        (b.claimPeriod === monthInfo.label ||
          (b.form1TourProgramme.month === monthInfo.month && b.form1TourProgramme.year === monthInfo.year))
    );

    if (existing && !force) {
      return {
        generated: false,
        bill: existing,
        count: existing.form1TourProgramme.journeys.length,
        monthLabel: monthInfo.label,
        message: `माह ${monthInfo.label} का TA/DA बिल पहले से सुरक्षित है।`,
      };
    }

    // Extract GD movements and build bill
    const journeys = await this.extractUserGDEntries(user, monthInfo);
    if (!journeys.length) return {generated:false,bill:this.buildTADABill(user,monthInfo,[]),count:0,monthLabel:monthInfo.label,message:"No verified GD movements found. No bill was saved."};
    const newBill = this.buildTADABill(user, monthInfo, journeys);

    // Auto-save strictly to user's TA history
    const saved = tadaService.save(newBill, user.id);

    return {
      generated: true,
      bill: saved,
      count: journeys.length,
      monthLabel: monthInfo.label,
      message: `रोजनामचा GD से ${journeys.length} सरकारी यात्राओं की प्रविष्टियाँ निकाल कर माह ${monthInfo.label} का TA/DA फॉर्म स्वतः भर कर My TA History में सहेज दिया गया है।`,
    };
  },

  /**
   * Sync a specific past month's bill on demand
   */
  async syncSpecificMonthBill(
    user: UserSession,
    monthInfo: MonthInfo,
    force = false
  ): Promise<{
    generated: boolean;
    bill: TADABillRecord;
    count: number;
    monthLabel: string;
    message: string;
  }> {
    const existingBills = tadaService.getByUser(user.id);
    const existing = existingBills.find(
      (b) =>
        b.claimPeriod === monthInfo.label ||
        (b.form1TourProgramme.month === monthInfo.month && b.form1TourProgramme.year === monthInfo.year)
    );

    if (existing && !force) {
      return {
        generated: false,
        bill: existing,
        count: existing.form1TourProgramme.journeys.length,
        monthLabel: monthInfo.label,
        message: `माह ${monthInfo.label} का TA/DA बिल पहले से उपलब्ध है।`,
      };
    }

    const journeys = await this.extractUserGDEntries(user, monthInfo);
    if (!journeys.length) return {generated:false,bill:this.buildTADABill(user,monthInfo,[]),count:0,monthLabel:monthInfo.label,message:"No verified GD movements found. No bill was saved."};
    const newBill = this.buildTADABill(user, monthInfo, journeys);
    const saved = tadaService.save(newBill, user.id);

    return {
      generated: true,
      bill: saved,
      count: journeys.length,
      monthLabel: monthInfo.label,
      message: `रोजनामचा GD से ${journeys.length} यात्राएं निकाल कर ${monthInfo.label} का TA/DA बिल तैयार कर दिया गया है।`,
    };
  },
};
