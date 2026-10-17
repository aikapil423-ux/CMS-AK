// Types and interfaces for Haryana Police Crime & Administrative Reports

export type ReportTab = "CrimeSITREP_District" | "WEEKLY CRIME DIARY" | "IGP Meeting Presentation" | "Saved Reports";

export interface SitrepHeadCount {
  srNo: number;
  head: string;
  totalNumber: number | string;
}

export interface SitrepFirEntry {
  srNo: number;
  ps: string;
  head: string;
  ipcSections?: string;
  firNo: string;
  dated: string;
  us: string;
  complainant: string;
  complainantMobile: string;
  victim: string;
  accused: string;
  suspectedPersons?: boolean | string;
  occurrenceFrom: string;
  occurrenceTo: string;
  totalPropertyAmount: string;
  placeOfOccurrence: string;
  briefFacts: string;
  reasonOfDelay: string;
  ioNameRank: string;
  ioMobile: string;
}

export interface SitrepArrestEntry {
  srNo: number;
  gdNoArrestTime: string;
  ps: string;
  firNoAndUs: string;
  head: string;
  firDate: string;
  accusedDetails: string; // नाम, Alias जहाँ उपलब्ध हो, उम्र, पिता का नाम और पता
  ioDetails: string;      // नाम, नंबर/पहचान, Rank और मोबाइल नंबर संयुक्त रूप में
}

export interface SitrepRecoveryEntry {
  srNo: number;
  gdNoRecoveryTime: string;
  ps: string;
  firNoAndUs: string;
  head: string;
  firDate: string;
  recoveredItems: string; // वस्तु का प्रकार/नाम, Make/Brand, Quantity, Value/राशि
  ioDetails: string;
}

export interface SitrepSectionModification {
  srNo: number;
  ps: string;
  firNo: string;
  firDate: string;
  originalSection: string;
  sectionAdded: string;
  sectionRemoved: string;
  head: string;
  dateOfModification: string; // Date of modification in Case Diary
  ioDetails: string;
}

export interface SitrepDisposalEntry {
  srNo: number;
  ps: string;
  firNo: string;
  firDate: string;
  head: string;
  accusedArrested?: number;
  type?: "Fresh" | "Supplementary";
  reason?: string;
  reasonOfPartialChallan?: string;
  byName?: "Yes" | "No";
  propertyStolenOrInvolved?: string;
  ioDetails: string;
}

export interface SitrepReopenedCase {
  srNo: number;
  ps: string;
  firNo: string;
  firDate: string;
  head: string;
  dateOfLastIif5: string;
  typeOfLastIif5: string; // Chargesheet (Complete)-UC, ReOpened
  dateOfReopening: string;
  reasonOfReopening: string; // By Senior Officers, Because of arrest in the same FIR
  ioDetails: string;
}

export interface SitrepRukkaEntry {
  srNo: number;
  ps: string;
  patientDetails: string; // नाम, Gender, उम्र, संबंध, पिता/संबंधित व्यक्ति का नाम, पता, मोबाइल
  rukkaIdHospital: string; // Rukka ID और अस्पताल का नाम
  briefDetails: string;    // घटना का प्रकार, तारीख, समय, स्थान, अस्पताल लाने वाले का विवरण
}

export interface SitrepUploadSummary {
  ps: string;
  registeredPreviousDay: number;
  uploadedCitizenPortal: number;
  notUploadedCitizenPortal: number;
}

export interface CrimeSitrepData {
  id?: string;
  reportTitle?: string;
  officeTitle?: string;
  district: string;
  reportDate: string;
  cutoffTime: string;
  generatedDateTime?: string;
  controlRoomIncharge?: string;
  officeLocation?: string;
  pageNumber?: number;
  totalPages?: number;
  section1HeadCounts: SitrepHeadCount[];
  firEntries: SitrepFirEntry[];
  arrests: SitrepArrestEntry[];
  recoveries: SitrepRecoveryEntry[];
  modifications: SitrepSectionModification[];
  completeChallans: SitrepDisposalEntry[];
  partialChallans: SitrepDisposalEntry[];
  cancellations: SitrepDisposalEntry[];
  untraced: SitrepDisposalEntry[];
  reopenedCases: SitrepReopenedCase[];
  rukkas: SitrepRukkaEntry[];
  uploadSummaries: SitrepUploadSummary[];
  metadata?: {
    sectionOrder?: string[];
    hiddenSections?: string[];
    density?: "compact" | "normal" | "spacious";
    sectionTitles?: Record<string, string>;
  };
  customTitles?: Record<string, string>;
}

export interface SavedReportEntry {
  id: string;
  reportType: "CRIME_SITREP" | "WEEKLY_CRIME_DIARY" | "IGP_PRESENTATION";
  reportTitle: string;
  district: string;
  reportDate: string;
  cutoffTime?: string;
  generatedByRole: string;
  generatedByName: string;
  generatedAt: string;
  caseCount: number;
  data: CrimeSitrepData | WeeklyCrimeDiaryData | IgpPresentationData;
}

// WEEKLY CRIME DIARY TYPES
export interface StaffStrength {
  insp: number;
  siPsi: number;
  asiLasi: number;
  hcLhc: number;
  ehcCt: number;
  spo: number;
  hgh: number;
  hkrn: number;
  total: number;
}

export interface VehicleDetail {
  srNo: number;
  vehicleNo: string;
  makeModel: string;
  year: number;
  odometerReading: number;
  driverNameMobile: string;
}

export interface UiCasePartA {
  srNo: number;
  firNo: string;
  date: string;
  us: string;
  head: string;
  amount: string;
  placeOfOccurrence: string;
  briefFacts: string;
  noOfAccusedInFir: number;
  noOfAccusedArrested: number;
  noOfAccusedPendingArrest: number;
  ioNameMobile: string;
  actionTaken: string;
  pendingReason: string;
  ageCategory: "OVER TWO YEARS" | "OVER ONE YEAR" | "OVER SIX MONTHS" | "OVER THREE MONTHS" | "UNDER THREE MONTHS";
}

export interface PartialChallanCase {
  srNo: number;
  firNo: string;
  date: string;
  us: string;
  head: string;
  amount: string;
  recovery: string;
  dateOfLastIif5: string;
  noOfAccusedArrested: number;
  briefFacts: string;
  actionTaken: string;
  pendingAccusedDetails: string;
  ioNameMobile: string;
  ageCategory: "OVER THREE YEARS" | "OVER TWO YEARS" | "OVER ONE YEAR" | "OVER SIX MONTHS" | "UNDER SIX MONTHS";
}

export interface UnderCheckingChallan {
  srNo: number;
  firNo: string;
  date: string;
  underSection: string;
  byName: number;
  byNameArrest: number;
  otherArrest: number;
  totalArrest: number;
  arrestPending: number;
  challanType: "COMPLETE CHALLAN" | "PARTIAL CHALLAN";
  ucDate: string;
  ioNameMobile: string;
}

export interface PendingComplaint05P {
  srNo: number;
  psDiaryNo: string;
  dateOfReceipt: string;
  complainantNameMobile: string;
  ioNameMobile: string;
  officeDiaryNo: string;
  date: string;
  cctnsNo: string;
  overDays?: string;
}

export interface AdampataFile {
  srNo: number;
  firNo: string;
  dt: string;
  us: string;
  dtUt: string;
  dtCan: string;
  rcNo: string;
  rcDt: string;
  io: string;
  status: "जमा" | "PENDING";
}

export interface Parcha12StatePending {
  state: string;
  count: number;
}

export interface WeeklyCrimeDiaryData {
  policeStation: string;
  district: string;
  dateRange: string;
  shoName: string;
  shoPostedSince: string;
  mhcName: string;
  mhcPostedSince: string;
  soName: string;
  soChargeSince: string;
  staffStrength: StaffStrength;
  vehicles: VehicleDetail[];
  firCurrentYear: number;
  firPrevYearSameTime: number;
  firPrevYearTotal: number;
  firLastOneYearTotal: number;
  uiCasesPartACount: number;
  uiCasesPartBCount: number;
  preparedByName: string;
  preparedByDate: string;
  part1to12Overview: { part: string; table: string; remarks: string }[];
  untracedList: {
    srNo: number;
    firNo: string;
    date: string;
    originalSection: string;
    dateOfIif5: string;
    briefFacts: string;
    ioNameMobile: string;
    reasonOfUntrace: string;
  }[];
  dispatchedFinalReports: {
    srNo: number;
    firNo: string;
    date: string;
    us: string;
    type: string;
    rcNo: string;
    rcDate: string;
  }[];
  uiCasesPartA: UiCasePartA[];
  partialChallans: PartialChallanCase[];
  underCheckingChallans: UnderCheckingChallan[];
  pendingComplaints: PendingComplaint05P[];
  adampataFiles: AdampataFile[];
  parcha12Pending: Parcha12StatePending[];
}

// IGP MEETING PRESENTATION TYPES
export interface ComparativeCrimeRow {
  category: "Crime Against Person" | "Crime Against Women" | "Crime Against Property" | "Miscellaneous IPC Crimes" | "Local and Special Laws";
  head: string;
  reg2025: number;
  reg2026: number;
  change: number;
  changePct: number;
  workoutPct2025: number;
  workoutPct2026: number;
  workoutChange: number;
  arrestRate2025: number;
  arrestRate2026: number;
  arrestRateChange: number;
}

export interface ExtortionGangStat {
  gangName: string;
  callsCount: number;
}

export interface StationUiPendency {
  srNo: number;
  stationName: string;
  totalRegd: number;
  over2Year: number;
  over1Year: number;
  over6Month: number;
  totalOver6Month: number;
  pctOver6Month: number;
  over3Month: number;
  under3Month: number;
  totalUi: number;
  uiPct: number;
}

export interface UnsolvedHeinousCase {
  srNo: number;
  head: string;
  firNoDateSection: string;
  station: string;
  briefFactsHindi: string;
}

export interface ActiveCriminalCheckingStation {
  srNo: number;
  stationName: string;
  totalCriminals: number;
  present: number;
  inJail: number;
  death: number;
  fugitive: number;
  absent: number;
  totalChecked: number;
  pending: number;
  frsUpload: number;
  frsPct: number;
  criminalCheckingPct: number;
}

export interface NdpsRecoveryStat {
  substance: string;
  yr2023: string;
  yr2024: string;
  yr2025: string;
  yr2026: string;
}

export interface IgpPresentationData {
  meetingDate: string;
  meetingTime: string;
  meetingLocation: string;
  district: string;
  comparativeRows: ComparativeCrimeRow[];
  extortionOverview: {
    totalCalls: number;
    casesRegistered: number;
    accusedNamed: number;
    accusedArrested: number;
    accusedPending: number;
    gangs: ExtortionGangStat[];
  };
  uiPartAByStation: StationUiPendency[];
  unsolvedHeinousCases: UnsolvedHeinousCase[];
  activeCriminals: ActiveCriminalCheckingStation[];
  ndpsStats: NdpsRecoveryStat[];
  cyberOverview: {
    complaints2025: number;
    complaints2026: number;
    defrauded2025: string;
    defrauded2026: string;
    holdPct2025: string;
    holdPct2026: string;
    firs2025: number;
    firs2026: number;
    recovered2025: string;
    recovered2026: string;
  };
}
