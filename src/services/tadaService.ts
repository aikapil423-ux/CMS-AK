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

let inMemoryTADABills: TADABillRecord[] = [];

export const tadaService = {
  getAll(): TADABillRecord[] {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(TADA_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            inMemoryTADABills = parsed;
            return parsed;
          }
        }
      } catch (err) {
        console.error("Failed to read TA/DA bills from localStorage:", err);
      }
    }
    return [...inMemoryTADABills];
  },

  // Strictly user-isolated: user sees only their own bills (matches by user id, pno, or officer name)
  getByUser(userId: string, pno?: string, name?: string): TADABillRecord[] {
    if (!userId && !pno && !name) return [];
    const all = this.getAll();
    const cleanId = (userId || "").trim().toLowerCase();
    const cleanPno = (pno || "").replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
    const cleanName = (name || "").trim().toLowerCase();

    return all.filter(b => b.userId === userId || (!b.userId && !!cleanPno && (b.form1TourProgramme?.beltEmployeeNumber || "").replace(/[^a-zA-Z0-9]/g, "").toLowerCase() === cleanPno));
  },

  getById(id: string): TADABillRecord | null {
    const all = this.getAll();
    return all.find((b) => b.id === id) || null;
  },

  save(bill: TADABillRecord, userId: string): TADABillRecord {
    const all = structuredClone(this.getAll());
    const existing = all.find(b => b.id === bill.id);
    if (!userId || existing && existing.userId !== userId) throw new Error("This bill belongs to another officer.");
    const updated: TADABillRecord = {
      ...bill,
      userId,
      updatedAt: new Date().toISOString(),
    };
    const index = all.findIndex((b) => b.id === bill.id);
    if (index >= 0) {
      all[index] = updated;
    } else {
      all.unshift(updated);
    }


    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(TADA_STORAGE_KEY, JSON.stringify(all));
        window.dispatchEvent(new CustomEvent("cms_tada_bills_changed", { detail: updated }));
      } catch (err) {
        throw new Error("TA/DA bill could not be saved. Check browser storage and retry.");
      }
    }
    inMemoryTADABills = [...all];
    return updated;
  },

  delete(id: string, userId: string): boolean {
    const all = this.getAll();
    if (!userId || all.find(b => b.id === id)?.userId !== userId) return false;
    const filtered = all.filter((b) => b.id !== id);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(TADA_STORAGE_KEY, JSON.stringify(filtered));
        inMemoryTADABills = [...filtered];
        window.dispatchEvent(new CustomEvent("cms_tada_bills_changed"));
        return true;
      } catch {
        return false;
      }
    }
    return true;
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
