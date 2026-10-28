import { AddressInfo, HARYANA_DISTRICTS } from "./lostProperty";

export interface ActSectionEntry {
  id: string;
  act: string;
  section: string;
}

export interface IdentificationDoc {
  id: string;
  idType: string;
  idNumber: string;
}

export interface MissingPersonRecord {
  id: string;
  registrationNumber: string; // e.g. "MP-2019/0002" or "0002/2019"
  registrationYear: string; // e.g. "2019"
  createdAt: string;
  updatedAt: string;
  status: "OPEN" | "TRACED" | "CLOSED";

  // Tab 1: General Details
  registrationDateTime: string; // e.g. "19/04/2019 15:19"
  gdNumber: string; // e.g. "002"
  gdDateTime: string; // e.g. "19/04/2019, 10:45"
  briefOfIncident: string; // e.g. "Missing Person"
  dateTimeSinceMissing: string; // e.g. "2019-04-19" and "11:00"
  dateSinceMissing: string;
  timeSinceMissing: string;
  firNumber: string; // e.g. "0042"
  firYear: string; // e.g. "2019"
  placeOfMissing: string; // e.g. "Panchkula bus stand"
  actsSections: ActSectionEntry[];

  // Tab 2: Complainant Information
  complainantUid: string;
  complainantFirstName: string; // e.g. "RAVI"
  complainantMiddleName: string;
  complainantLastName: string;
  complainantRelationType: "Select" | "Father" | "Mother" | "Guardian" | "Husband" | "Wife";
  complainantRelativeName: string;
  complainantMobile: string; // e.g. "+91 9812033441"
  complainantLandline: string;
  complainantEmail: string;
  complainantGender: "Select" | "Unknown" | "Male" | "Female" | "Transgender";

  // Complainant Address
  complainantPresentAddress: AddressInfo;
  complainantSameAsPresent: boolean;
  complainantPermanentAddress: AddressInfo;

  // Complainant Other Information
  complainantNationality: string; // e.g. "INDIA"
  complainantIdList: IdentificationDoc[];

  // Tab 3: Missing Person Details
  uid: string;
  firstName: string; // e.g. "Monu"
  middleName: string;
  lastName: string;
  alias: string;
  relationType: "Select" | "Father" | "Mother" | "Guardian" | "Husband" | "Wife";
  relativeName: string; // e.g. "Shyam"
  photoUrl?: string;
  gender: "Select" | "Unknown" | "Male" | "Female" | "Transgender";
  majorMinor: "" | "Major" | "Minor";
  mobileNo: string;
  landlineNo: string;
  emailId: string;

  // Age Panel
  dob: string; // e.g. "1990-12-02"
  yearOfBirth: string; // e.g. "1990"
  ageYears: string; // e.g. "28"
  ageMonths: string; // e.g. "4"
  ageRangeFrom: string;
  ageRangeTo: string;

  // Missing Person Address
  sameAsComplainantAddress: boolean;
  presentAddress: AddressInfo;
  sameAsPresentAddress: boolean;
  permanentAddress: AddressInfo;

  // Missing Person Other Info
  nationality: string;
  occupation: string;
  idList: IdentificationDoc[];

  // Tab 4: Physical Description of Missing Person
  heightFeet: string; // e.g. "5"
  heightInches: string; // e.g. "7"
  complexion: string; // e.g. "Wheatish"
  build: string; // e.g. "Medium"
  faceType: string; // e.g. "Round"
  hairColor: string; // e.g. "Black"
  eyeColor: string; // e.g. "Dark Brown"
  languagesKnown: string; // e.g. "Hindi, Punjabi, English"
  identifyingMarks: string; // e.g. "Mole on right cheek, small burn mark on left arm"
  clothingDetails: string; // e.g. "Blue checked cotton shirt, black denim jeans, white sports shoes"
  habitsEccentricities: string; // e.g. "Mentally calm, speaks politely, carries no wallet"

  // Tab 5: IO/EO Details
  nameOfEo: string; // e.g. "ASI Sandeep Singh - 49102"
  eoRank: string; // e.g. "Assistant Sub Inspector"
  eoNumber: string; // e.g. "49102"
  policeStation: string; // e.g. "PANCHKULA SECTOR-5"
  district: string; // e.g. "PANCHKULA"
  expectedDateToComplete: string; // e.g. "2019-04-26"
  remarks: string;
}

export const MISSING_PERSON_ID_TYPES = [
  "Select",
  "Aadhar Card",
  "Any Other",
  "Arms License",
  "Driving License",
  "Income Tax (PAN) Card",
  "Passport",
  "Ration Card",
  "Visa",
  "Voter Card",
] as const;

export const STANDARD_ACTS = [
  "Select Act",
  "BNS 2023 (Bharatiya Nyaya Sanhita)",
  "BNSS 2023 (Bharatiya Nagarik Suraksha Sanhita)",
  "IPC 1860 (Indian Penal Code)",
  "Police Act 1861",
  "Haryana Police Act 2007",
  "Juvenile Justice (JJ) Act 2015",
] as const;

export const SAMPLE_MISSING_PERSON_PHOTO =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='140' viewBox='0 0 120 140'><rect width='100%' height='100%' fill='%23e0f2fe'/><circle cx='60' cy='50' r='28' fill='%230284c7'/><path d='M20 125 C20 90, 40 85, 60 85 C80 85, 100 90, 100 125 Z' fill='%230284c7'/><text x='60' y='135' font-size='9' text-anchor='middle' fill='%230369a1' font-family='sans-serif'>PHOTO: MONU</text></svg>";
