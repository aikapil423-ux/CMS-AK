import {
  TADABillRecord,
  TourProgrammeForm,
  TourProgrammeJourneyRow,
  TAClaimJourneyDetailsForm,
  TAClaimJourneyRow,
  TABillMainPageForm,
} from "@/types/tada";

const TADA_STORAGE_KEY = "haryana_police_cms_tada_bills_v1";

export function createBlankTourJourneyRow(srNo = 1): TourProgrammeJourneyRow {
  return {
    id: `tour_row_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    srNo,
    departureDdNo: "",
    postingAndDepStation: "",
    departureDate: "",
    departureTime: "",
    arrivalStation: "",
    arrivalDdNo: "",
    arrivalDate: "",
    arrivalTime: "",
    purposeOfJourney: "",
    modeOfVehicle: "",
    distanceKm: "",
    noOfDays: "",
  };
}

export function createBlankClaimJourneyRow(srNo = 1): TAClaimJourneyRow {
  return {
    id: `claim_row_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    srNo,
    departureStation: "",
    departureDate: "",
    departureTime: "",
    arrivalStation: "",
    arrivalDate: "",
    arrivalTime: "",
    purposeOfJourney: "",
    modeOfTravel: "",
    accommodationClass: "",
    railSteamerFareClass: "",
    railSteamerFareAmount: 0,
    roadMileageKm: "",
    roadMileageAmount: 0,
    actualExpenses: 0,
    dailyAllowanceDays: 0,
    dailyAllowanceRate: 0,
    dailyAllowanceAmount: 0,
    totalAmount: 0,
    remarks: "",
  };
}

export function createBlankTADABill(userId: string, userName = ""): TADABillRecord {
  const now = new Date().toISOString();

  const form1: TourProgrammeForm = {
    department: "",
    district: "",
    employeeName: "",
    designation: "",
    beltEmployeeNumber: "",
    month: "",
    year: "",
    journeys: [createBlankTourJourneyRow(1)],
    claimantName: "",
    claimantDesignationBelt: "",
    claimantSignatureImg: "",
    forwardingRemarks: "",
    forwardingOfficerNameTitle: "",
    forwardingOfficerSignatureImg: "",
    approvalRemarks: "",
    approvingOfficerNameTitle: "",
    approvingOfficerSignatureImg: "",
  };

  const form2: TAClaimJourneyDetailsForm = {
    claimMonth: "",
    claimYear: "",
    employeeName: "",
    designation: "",
    basicPay: "",
    headquarters: "",
    gradeOfGovtServant: "",
    journeys: [createBlankClaimJourneyRow(1)],
    totalClaimAmount: 0,
    totalClaimAmountWordsEn: "",
    totalClaimAmountWordsHi: "",
    amountOfAdvanceTaken: 0,
    treasuryVoucherNumber: "",
    treasuryVoucherDate: "",
    passedForPaymentAmount: 0,
    passedAmountWordsEn: "",
    passedAmountWordsHi: "",
    minusAdvanceDrawn: 0,
    advanceRefNumber: "",
    advanceRefDate: "",
    netPayableAmount: 0,
    netPayableAmountWordsEn: "",
    netPayableAmountWordsHi: "",
    claimantSignatureImg: "",
    ddoSignatureImg: "",
    ddoNameTitle: "",
    printedInstructionsText:
      "1. Copy of original tour programme approved by the competent authority should invariably be attached with the claim.\n2. In case of transfer at a distance more than 500 kms, the details of members of the family with age be given.\n3. Ticket Nos. should be quoted when journeys are performed by air or by rail / bus, near steamer in any class other than the ordinary class.",
  };

  const form3: TABillMainPageForm = {
    billNumber: "",
    billDate: "",
    establishmentOf: "",
    voucherNumber: "",
    voucherDate: "",
    accounting: {
      treasuryCode: "",
      ddoCode: "",
      majorHead: "",
      subMajorHead: "",
      minorHead: "",
      subHeadScheme: "",
      detailedHead: "",
      objectCode: "",
      demandGrantNumber: "",
      planNonPlan: "",
      votedCharged: "",
      majorHeadStampImg: "",
    },
    certContentsVerified: false,
    certTaRulesCompliance: false,
    certRemarks: "",
    certifyingOfficerSignatureImg: "",
    certifyingOfficerNameTitle: "",
    financialYearFrom: "",
    financialYearTo: "",
    appropriationAmount: 0,
    expenditureIncludingBill: 0,
    balanceAvailable: 0,
    passedForAmount: 0,
    passedAmountWordsEn: "",
    passedAmountWordsHi: "",
    controllingOfficerSignatureImg: "",
    controllingOfficerNameTitle: "",
    ddoSignatureImg: "",
    ddoNameTitle: "",
    treasuryPayAmount: 0,
    treasuryPayAmountWordsEn: "",
    treasuryPayAmountWordsHi: "",
    treasuryClerkSignatureImg: "",
    treasuryAstSignatureImg: "",
    treasuryOfficerSignatureImg: "",
    agAdmittedAmount: 0,
    agObjectedAmount: 0,
    agReasonsOfObjections: "",
    agAccountsOfficerSignatureImg: "",
  };

  return {
    id: `tada_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    userId,
    userName,
    status: "DRAFT",
    createdAt: now,
    updatedAt: now,
    form1TourProgramme: form1,
    form2JourneyDetails: form2,
    form3MainPage: form3,
  };
}

async function requestTada<T>(change?: object): Promise<T> {
  const response = await fetch("/api/tada", change ? {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(change),
  } : { cache: "no-store" });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error || "TA/DA request failed. Please retry.");
  return data;
}

export const tadaService = {
  getLegacyBills(userId: string) {
    const raw = localStorage.getItem(TADA_STORAGE_KEY);
    const bills: TADABillRecord[] = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(bills)) throw new Error("The browser TA/DA history could not be read.");
    return bills.filter(bill => bill?.userId === userId);
  },

  async importLegacyBills(bills: TADABillRecord[]) {
    let failed = 0;
    for (const bill of bills) {
      try {
        await requestTada({ action: "import", bill });
      } catch {
        failed++;
      }
    }
    return failed;
  },

  getHistory() {
    return requestTada<{ bills: TADABillRecord[]; archivedIds: string[] }>();
  },

  async getByUser(): Promise<TADABillRecord[]> {
    const { bills } = await this.getHistory();
    return bills;
  },

  async save(bill: TADABillRecord, userId: string): Promise<TADABillRecord> {
    const result = await requestTada<{ bill: TADABillRecord }>({ action: "save", bill: { ...bill, userId } });
    return result.bill;
  },

  async delete(bill: TADABillRecord) {
    await requestTada({ action: "delete", id: bill.id, updatedAt: bill.updatedAt });
  },

  // Utility to convert Tour Programme rows into TA Claim rows
  convertTourJourneysToClaim(tourJourneys: TourProgrammeJourneyRow[]): TAClaimJourneyRow[] {
    return tourJourneys.map((tj, idx) => ({
      id: `claim_row_synced_${idx}_${Date.now()}`,
      srNo: idx + 1,
      departureStation: tj.postingAndDepStation || "",
      departureDate: tj.departureDate || "",
      departureTime: tj.departureTime || "",
      arrivalStation: tj.arrivalStation || "",
      arrivalDate: tj.arrivalDate || "",
      arrivalTime: tj.arrivalTime || "",
      purposeOfJourney: tj.purposeOfJourney || "",
      modeOfTravel: tj.modeOfVehicle || "",
      accommodationClass: "",
      railSteamerFareClass: "",
      railSteamerFareAmount: 0,
      roadMileageKm: tj.distanceKm || "",
      roadMileageAmount: 0,
      actualExpenses: 0,
      dailyAllowanceDays: Number(tj.noOfDays) || 0,
      dailyAllowanceRate: 0,
      dailyAllowanceAmount: 0,
      totalAmount: 0,
      remarks: "",
    }));
  },
};
