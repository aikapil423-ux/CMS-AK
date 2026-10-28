import {
  MissingPersonRecord,
  SAMPLE_MISSING_PERSON_PHOTO,
} from "@/types/missingPerson";
import { GDSearchResultItem } from "@/types/lostProperty";

const STORAGE_KEY = "haryana_police_cms_missing_person_records_v1";

const SEED_RECORDS: MissingPersonRecord[] = [
  {
    id: "mp_rec_2019_0002",
    registrationNumber: "0002/2019",
    registrationYear: "2019",
    createdAt: "2019-04-19T15:19:00.000Z",
    updatedAt: "2019-04-19T15:19:00.000Z",
    status: "OPEN",

    // General Details
    registrationDateTime: "19/04/2019 15:19",
    gdNumber: "002",
    gdDateTime: "19/04/2019, 10:45",
    briefOfIncident: "Missing Person",
    dateTimeSinceMissing: "19/04/2019 11:00",
    dateSinceMissing: "2019-04-19",
    timeSinceMissing: "11:00",
    firNumber: "0042",
    firYear: "2019",
    placeOfMissing: "Panchkula bus stand",
    actsSections: [
      {
        id: "act_1",
        act: "Police Act 1861",
        section: "Section 34",
      },
    ],

    // Complainant Information
    complainantUid: "4829-1092-3849",
    complainantFirstName: "RAVI",
    complainantMiddleName: "",
    complainantLastName: "Kumar",
    complainantRelationType: "Father",
    complainantRelativeName: "Shyam",
    complainantMobile: "+91 9812033441",
    complainantLandline: "",
    complainantEmail: "ravi.kumar@example.com",
    complainantGender: "Male",
    complainantPresentAddress: {
      houseNo: "Plot 12, Gali No 4",
      streetName: "Near Bus Stand Road",
      colony: "Sector 5",
      villageTownCity: "pkl",
      tehsil: "Panchkula",
      country: "INDIA",
      state: "HARYANA",
      district: "PANCHKULA",
      policeStation: "PANCHKULA SECTOR-5",
      pincode: "134109",
    },
    complainantSameAsPresent: true,
    complainantPermanentAddress: {
      houseNo: "Plot 12, Gali No 4",
      streetName: "Near Bus Stand Road",
      colony: "Sector 5",
      villageTownCity: "pkl",
      tehsil: "Panchkula",
      country: "INDIA",
      state: "HARYANA",
      district: "PANCHKULA",
      policeStation: "PANCHKULA SECTOR-5",
      pincode: "134109",
    },
    complainantNationality: "INDIA",
    complainantIdList: [
      {
        id: "id_1",
        idType: "Ration Card",
        idNumber: "RC-HR-PKL-99201",
      },
    ],

    // Missing Person Details
    uid: "7719-2810-4412",
    firstName: "Monu",
    middleName: "",
    lastName: "Kumar",
    alias: "Chhotu",
    relationType: "Father",
    relativeName: "Shyam",
    photoUrl: SAMPLE_MISSING_PERSON_PHOTO,
    gender: "Male",
    majorMinor: "Major",
    mobileNo: "+91 9416088219",
    landlineNo: "",
    emailId: "",
    dob: "1990-12-02",
    yearOfBirth: "1990",
    ageYears: "28",
    ageMonths: "4",
    ageRangeFrom: "",
    ageRangeTo: "",

    sameAsComplainantAddress: true,
    presentAddress: {
      houseNo: "Plot 12, Gali No 4",
      streetName: "Near Bus Stand Road",
      colony: "Sector 5",
      villageTownCity: "pkl",
      tehsil: "Panchkula",
      country: "INDIA",
      state: "HARYANA",
      district: "PANCHKULA",
      policeStation: "PANCHKULA SECTOR-5",
      pincode: "134109",
    },
    sameAsPresentAddress: true,
    permanentAddress: {
      houseNo: "Plot 12, Gali No 4",
      streetName: "Near Bus Stand Road",
      colony: "Sector 5",
      villageTownCity: "pkl",
      tehsil: "Panchkula",
      country: "INDIA",
      state: "HARYANA",
      district: "PANCHKULA",
      policeStation: "PANCHKULA SECTOR-5",
      pincode: "134109",
    },
    nationality: "INDIA",
    occupation: "Student / Shop Helper",
    idList: [
      {
        id: "id_mp_1",
        idType: "Aadhar Card",
        idNumber: "7719 2810 4412",
      },
    ],

    // Physical Description
    heightFeet: "5",
    heightInches: "7",
    complexion: "Wheatish",
    build: "Medium",
    faceType: "Round",
    hairColor: "Black",
    eyeColor: "Dark Brown",
    languagesKnown: "Hindi, Punjabi",
    identifyingMarks: "Mole on right cheek, small burn scar on left forearm",
    clothingDetails: "Blue checked shirt, dark jeans, white sneakers",
    habitsEccentricities: "Polite demeanor, no mental disability reported",

    // IO/EO Details
    nameOfEo: "ASI Sandeep Singh - 49102",
    eoRank: "Assistant Sub Inspector",
    eoNumber: "49102",
    policeStation: "PANCHKULA SECTOR-5",
    district: "PANCHKULA",
    expectedDateToComplete: "2019-04-26",
    remarks: "WT message flashed to all police stations in Haryana and Chandigarh. Missing person poster dispatched to public bus stands.",
  },
];

export const MOCK_MP_GD_SEARCH_RESULTS: GDSearchResultItem[] = [
  {
    id: "gd_mp_002",
    gdNumber: "002",
    gdType: "Missing person",
    dateTime: "19/04/2019 10:45",
    entryForOfficer: "ASI Sandeep Singh, 49102",
    subject: "Missing Person Report - Monu",
    brief: "Complainant Ravi reported missing of his brother/relative Monu from Panchkula bus stand at 11:00 AM.",
  },
  {
    id: "gd_mp_007",
    gdNumber: "007",
    gdType: "Missing person",
    dateTime: "14/10/2026 09:15",
    entryForOfficer: "SI Rajesh Kumar",
    subject: "Missing Person - Amit Sharma",
    brief: "Father reported son did not return from college near Thanesar Railway Station.",
  },
  {
    id: "gd_mp_011",
    gdNumber: "011",
    gdType: "Missing person",
    dateTime: "08/10/2026 18:30",
    entryForOfficer: "Inspector Lalit Kumar",
    subject: "Missing Girl Child Inquiry",
    brief: "Missing report of 14-year-old girl from Sector 7 Market.",
  },
];

export function createMissingPersonDraft(recordData:Partial<MissingPersonRecord>={}):MissingPersonRecord {
 const nowIso=new Date().toISOString(),currentYear=recordData.registrationYear || String(new Date().getFullYear()),regNumber=recordData.registrationNumber || "";
 return {
        id: recordData.id || `mp_rec_${Date.now()}`,
        registrationNumber: regNumber,
        registrationYear: currentYear,
        createdAt: recordData.createdAt || nowIso,
        updatedAt: nowIso,
        status: recordData.status || "OPEN",
        registrationDateTime: recordData.registrationDateTime || "",
        gdNumber: recordData.gdNumber || "",
        gdDateTime: recordData.gdDateTime || "",
        briefOfIncident: recordData.briefOfIncident || "",
        dateTimeSinceMissing: recordData.dateTimeSinceMissing || "",
        dateSinceMissing: recordData.dateSinceMissing || "",
        timeSinceMissing: recordData.timeSinceMissing || "",
        firNumber: recordData.firNumber || "",
        firYear: recordData.firYear || "",
        placeOfMissing: recordData.placeOfMissing || "",
        actsSections: recordData.actsSections || [],
        complainantUid: recordData.complainantUid || "",
        complainantFirstName: recordData.complainantFirstName || "",
        complainantMiddleName: recordData.complainantMiddleName || "",
        complainantLastName: recordData.complainantLastName || "",
        complainantRelationType: recordData.complainantRelationType || "",
        complainantRelativeName: recordData.complainantRelativeName || "",
        complainantMobile: recordData.complainantMobile || "",
        complainantLandline: recordData.complainantLandline || "",
        complainantEmail: recordData.complainantEmail || "",
        complainantGender: recordData.complainantGender || "",
        complainantPresentAddress: recordData.complainantPresentAddress || {houseNo:"",streetName:"",colony:"",villageTownCity:"",tehsil:"",country:"",state:"",district:"",policeStation:"",pincode:""},
        complainantSameAsPresent: recordData.complainantSameAsPresent ?? true,
        complainantPermanentAddress: recordData.complainantPermanentAddress || {houseNo:"",streetName:"",colony:"",villageTownCity:"",tehsil:"",country:"",state:"",district:"",policeStation:"",pincode:""},
        complainantNationality: recordData.complainantNationality || "",
        complainantIdList: recordData.complainantIdList || [
          { id: "id_1", idType: "Ration Card", idNumber: "RC-HR-PKL-99201" },
        ],
        uid: recordData.uid || "",
        firstName: recordData.firstName || "",
        middleName: recordData.middleName || "",
        lastName: recordData.lastName || "",
        alias: recordData.alias || "",
        relationType: recordData.relationType || "",
        relativeName: recordData.relativeName || "",
        photoUrl: recordData.photoUrl || SAMPLE_MISSING_PERSON_PHOTO,
        gender: recordData.gender || "",
        majorMinor: recordData.majorMinor || "",
        mobileNo: recordData.mobileNo || "",
        landlineNo: recordData.landlineNo || "",
        emailId: recordData.emailId || "",
        dob: recordData.dob || "",
        yearOfBirth: recordData.yearOfBirth || "",
        ageYears: recordData.ageYears || "",
        ageMonths: recordData.ageMonths || "",
        ageRangeFrom: recordData.ageRangeFrom || "",
        ageRangeTo: recordData.ageRangeTo || "",
        sameAsComplainantAddress: recordData.sameAsComplainantAddress ?? true,
        presentAddress: recordData.presentAddress || {houseNo:"",streetName:"",colony:"",villageTownCity:"",tehsil:"",country:"",state:"",district:"",policeStation:"",pincode:""},
        sameAsPresentAddress: recordData.sameAsPresentAddress ?? true,
        permanentAddress: recordData.permanentAddress || {houseNo:"",streetName:"",colony:"",villageTownCity:"",tehsil:"",country:"",state:"",district:"",policeStation:"",pincode:""},
        nationality: recordData.nationality || "",
        occupation: recordData.occupation || "",
        idList: recordData.idList || [],
        heightFeet: recordData.heightFeet || "",
        heightInches: recordData.heightInches || "",
        complexion: recordData.complexion || "",
        build: recordData.build || "",
        faceType: recordData.faceType || "",
        hairColor: recordData.hairColor || "",
        eyeColor: recordData.eyeColor || "",
        languagesKnown: recordData.languagesKnown || "",
        identifyingMarks: recordData.identifyingMarks || "",
        clothingDetails: recordData.clothingDetails || "",
        habitsEccentricities: recordData.habitsEccentricities || "",
        nameOfEo: recordData.nameOfEo || "",
        eoRank: recordData.eoRank || "",
        eoNumber: recordData.eoNumber || "",
        policeStation: recordData.policeStation || "",
        district: recordData.district || "",
        expectedDateToComplete: recordData.expectedDateToComplete || "",
        remarks: recordData.remarks || "",
      } as MissingPersonRecord;
}

class MissingPersonService {
  private inMemoryRecords: MissingPersonRecord[] = [];

  constructor() {
    this.init();
  }

  private init() {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            this.inMemoryRecords = parsed;
            return;
          }
        }
      } catch (e) {
        console.warn("Failed to load Missing Person records from localStorage", e);
      }
    }
    this.inMemoryRecords = [...SEED_RECORDS];
    this.persist();
  }

  private persist() {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.inMemoryRecords));
      } catch (e) {
        throw new Error("Missing person record could not be saved. Check browser storage and retry.");
      }
    }
  }

  public getAllRecords(): MissingPersonRecord[] {
    return [...this.inMemoryRecords];
  }

  public getRecordById(id: string): MissingPersonRecord | undefined {
    return this.inMemoryRecords.find((r) => r.id === id);
  }

  public getRecordByRegNumber(regNum: string): MissingPersonRecord | undefined {
    return this.inMemoryRecords.find(
      (r) =>
        r.registrationNumber?.toLowerCase().trim() ===
        regNum?.toLowerCase().trim()
    );
  }

  public updateStatus(idOrRegNum: string, status: "OPEN" | "TRACED" | "CLOSED"): boolean {
    const target = idOrRegNum?.toLowerCase().trim();
    const idx = this.inMemoryRecords.findIndex(
      (r) =>
        r.id?.toLowerCase().trim() === target ||
        r.registrationNumber?.toLowerCase().trim() === target
    );
    if (idx >= 0) {
      const before=structuredClone(this.inMemoryRecords);
      this.inMemoryRecords[idx] = {
        ...this.inMemoryRecords[idx],
        status,
        updatedAt: new Date().toISOString(),
      };
      try {this.persist();} catch(error) {this.inMemoryRecords=before;throw error;}
      return true;
    }
    return false;
  }

  public generateNextRegistrationNumber(yearInput?: string): string {
    const year = yearInput || String(new Date().getFullYear());
    const matchingYearRecords = this.inMemoryRecords.filter(
      (r) =>
        r.registrationYear === year ||
        r.registrationNumber.endsWith(`/${year}`)
    );

    let maxSeq = 0;
    for (const rec of matchingYearRecords) {
      const parts = rec.registrationNumber.split("/");
      if (parts.length > 0) {
        const numPart = parseInt(parts[0].replace(/\D/g, ""), 10);
        if (!isNaN(numPart) && numPart > maxSeq) {
          maxSeq = numPart;
        }
      }
    }

    const nextSeq = maxSeq + 1;
    const formattedSeq = nextSeq.toString().padStart(4, "0");
    return `${formattedSeq}/${year}`;
  }

  public saveRecord(recordData: Partial<MissingPersonRecord>): MissingPersonRecord {
    const before = structuredClone(this.inMemoryRecords);
    const nowIso = new Date().toISOString();
    const currentYear = recordData.registrationYear || String(new Date().getFullYear());

    let regNumber = recordData.registrationNumber;
    if (!regNumber || regNumber.trim() === "") {
      regNumber = this.generateNextRegistrationNumber(currentYear);
    }

    const existingIndex = this.inMemoryRecords.findIndex(
      (r) => r.id === recordData.id || (regNumber && r.registrationNumber === regNumber)
    );

    let savedRecord: MissingPersonRecord;

    if (existingIndex >= 0) {
      savedRecord = {
        ...this.inMemoryRecords[existingIndex],
        ...recordData,
        registrationNumber: regNumber,
        updatedAt: nowIso,
      } as MissingPersonRecord;
      this.inMemoryRecords[existingIndex] = savedRecord;
    } else {
      savedRecord = createMissingPersonDraft({...recordData,registrationNumber:regNumber,registrationYear:currentYear});

      this.inMemoryRecords.unshift(savedRecord);
    }

    try {this.persist();} catch(error) {this.inMemoryRecords=before;throw error;}
    return savedRecord;
  }
}

export const missingPersonService = new MissingPersonService();
