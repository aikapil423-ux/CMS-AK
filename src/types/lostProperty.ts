export interface LostPropertyItem {
  id: string;
  category: string; // e.g. "ELECTRICAL AND ELECTRONIC GOODS", "COIN AND CURRENCY", "DOCUMENTS AND VALUABLE SECURITIES", etc.
  subType: string; // e.g. "MOBILE PHONE"
  estimatedValue: number; // in INR
  idType: "IMEI NO." | "ISDN/SIM NO." | "MAC NO." | "OTHERS" | "";
  identificationNumbers: string[];
  quantity: number;
  makeManufacturer: string; // e.g. "Samsung"
  documents?: string[];
  remarks?: string;
}

export interface AddressInfo {
  houseNo: string;
  streetName: string;
  colony: string;
  villageTownCity: string;
  tehsil: string;
  country: string;
  state: string;
  district: string;
  policeStation: string;
  pincode: string;
}

export interface LostPropertyRecord {
  id: string;
  registrationNumber: string; // e.g. "0002/2019"
  registrationYear: string; // e.g. "2019" or "2026"
  createdAt: string;
  updatedAt: string;
  status: "REGISTERED" | "UNDER_ENQUIRY" | "TRACED" | "CLOSED";

  // 1. Property Details
  gdNumber: string; // e.g. "003"
  gdDateTime: string; // e.g. "22/04/2019, 11:33"
  dateOfPropertyMissing: string; // e.g. "2019-04-22"
  timeOfPropertyMissing: string; // e.g. "11:30"
  district: string; // e.g. "PANCHKULA"
  year: string; // e.g. "2019"
  placeFromWhereMissing: string; // e.g. "Bus stand PKL"
  policeStation: string; // e.g. "PANCHKULA SECTOR-5"
  properties: LostPropertyItem[];

  // 2. Complainant Details - Personal Information
  uid: string; // Aadhaar / UID
  firstName: string; // e.g. "raju"
  middleName: string;
  lastName: string; // e.g. "Singh"
  gender: "Select" | "Unknown" | "Male" | "Female" | "Transgender";
  occupation: string;
  relationType: "Select" | "Father" | "Guardian" | "Husband" | "Mother" | "Wife";
  relativeName: string; // e.g. "Shyam Singh"
  mobileNumbers: string[];

  // Age Panel
  dob: string;
  yearOfBirth: string;
  ageYears: string;
  ageMonths: string;
  ageRangeFrom: string;
  ageRangeTo: string;

  // Address
  presentAddress: AddressInfo;
  sameAsPresent: boolean;
  permanentAddress: AddressInfo;

  // 3. Details of Enquiry Officer
  nameOfEo: string; // e.g. "Lalit Kumar (I (Inspector))-53175"
  eoRank: string; // e.g. "I (Inspector)"
  eoNumber: string; // e.g. "53175"
  remarks: string;
  expectedDateToComplete: string; // e.g. "2019-04-24"
  registeredBy?: string;
}

export const HARYANA_DISTRICTS = [
  "AMBALA",
  "BHIWANI",
  "C I D",
  "CHARKHI DADRI",
  "FARIDABAD",
  "FATEHABAD",
  "GRP AMBALA CANTT",
  "GURUGRAM",
  "HANSI",
  "HISSAR",
  "JHAJJAR",
  "JIND",
  "KAITHAL",
  "KARNAL",
  "KURUKSHETRA",
  "MAHENDERGARH",
  "NUH",
  "PALWAL",
  "PANCHKULA",
  "PANIPAT",
  "REWARI",
  "ROHTAK",
  "SIRSA",
  "SONIPAT",
];

export const PROPERTY_CATEGORIES = [
  "COIN AND CURRENCY",
  "CULTURAL PROPERTY",
  "DOCUMENTS AND VALUABLE SECURITIES",
  "ELECTRICAL AND ELECTRONIC GOODS",
  "JEWELLERY",
  "OTHERS",
];

export const ELECTRICAL_ITEM_NAMES = [
  "ACSR WIRE (ALUMINIUM CORE STEEL REINFORCED)",
  "AIR CONDITIONER",
  "AIR COOLER",
  "ALUMINIUM WIRES",
  "AMPLIFIER",
  "AUDIO CASSETTE",
  "AUDIO EQUIPMENT",
  "BATTERY",
  "BULB",
  "C.D. PLAYER",
  "CABLE",
  "CALCULATOR",
  "CAMERA",
  "CINEMA PROJECTOR",
  "CLOCK-ELECTRIC",
  "COMPACT DISC PLAYER",
  "COMPUTER",
  "GRINDER",
  "HAIR DRIER",
  "HEATER-AIR",
  "HEATER-WATER",
  "IMMERSION ROD",
  "INTEGRATED CIRCUITS",
  "INTERCOM",
  "IRON ELECTRIC",
  "KETTLE ELECTRIC",
  "LAPTOP",
  "LIGHT FITTINGS",
  "LOUDSPEAKER",
  "MERCURY VAPOUR LAMP",
  "METER ELECTRIC",
  "MICROPHONES",
  "MICROWAVE OVEN",
  "MIXI",
  "MOBILE PHONE",
  "SMART WATCH",
  "TABLET / IPAD",
];

export const MOCK_ENQUIRY_OFFICERS_LIST = [
  { name: "Lalit Kumar", rank: "I (Inspector)", number: "53175", display: "Lalit Kumar (I (Inspector))-53175" },
  { name: "Ravinder Singh", rank: "HC", number: "56254", display: "Ravinder Singh (HC)-56254" },
  { name: "arjun", rank: "HC", number: "39096", display: "arjun (HC)-39096" },
  { name: "baldev singh", rank: "SI", number: "24522", display: "baldev singh (SI)-24522" },
  { name: "Balwant Singh", rank: "SI", number: "hrpol31170", display: "Balwant Singh (SI)-hrpol31170" },
  { name: "Balwinder Kaur", rank: "Inspector", number: "24720", display: "Balwinder Kaur (Inspector)-24720" },
  { name: "barkha ram", rank: "Assistant SI", number: "42391", display: "barkha ram (Assistant SI)-42391" },
  { name: "Bhagwan Dass", rank: "SI", number: "hrpol23908", display: "Bhagwan Dass (SI)-hrpol23908" },
  { name: "bholi singh", rank: "HC", number: "47362", display: "bholi singh (HC)-47362" },
  { name: "bjender singh", rank: "Assistant SI", number: "37775", display: "bjender singh (Assistant SI)-37775" },
  { name: "brij pal", rank: "Assistant SI", number: "34173", display: "brij pal (Assistant SI)-34173" },
  { name: "desj raj", rank: "Assistant SI", number: "hrpol44298", display: "desj raj (Assistant SI)-hrpol44298" },
  { name: "devi chand", rank: "Assistant SI", number: "hrpol25968", display: "devi chand (Assistant SI)-hrpol25968" },
  { name: "Dharampal", rank: "Assistant SI", number: "hrpol36489", display: "Dharampal (Assistant SI)-hrpol36489" },
  { name: "didar", rank: "HC", number: "56041", display: "didar (HC)-56041" },
  { name: "Geeta", rank: "SI", number: "110071224398", display: "Geeta (SI)-110071224398" },
  { name: "Gurmeet Singh", rank: "HC", number: "52691", display: "Gurmeet Singh (HC)-52691" },
  { name: "Ishwar Singh", rank: "SI", number: "29389", display: "Ishwar Singh (SI)-29389" },
  { name: "jagdish chander", rank: "Assistant SI", number: "34514", display: "jagdish chander (Assistant SI)-34514" },
  { name: "jagdish chander", rank: "Assistant SI", number: "hrpol43768", display: "jagdish chander (Assistant SI)-hrpol43768" },
  { name: "Jagpal singh", rank: "HC", number: "52019", display: "Jagpal singh (HC)-52019" },
  { name: "JASVINDER KAUR", rank: "Assistant SI", number: "hrpol56342", display: "JASVINDER KAUR (Assistant SI)-hrpol56342" },
  { name: "Jaswinder Singh", rank: "Assistant SI", number: "36627", display: "Jaswinder Singh (Assistant SI)-36627" },
  { name: "Joginder Singh", rank: "SI", number: "23954", display: "Joginder Singh (SI)-23954" },
  { name: "Kashmira Singh", rank: "SI", number: "24085", display: "Kashmira Singh (SI)-24085" },
];

export interface GDSearchResultItem {
  id: string;
  gdNumber: string; // e.g. "003"
  gdType: string; // e.g. "Lost Property"
  dateTime: string; // e.g. "22/04/2019 11:33"
  entryForOfficer: string; // e.g. "Lalit Kumar, Inspector"
  subject: string; // e.g. "GD for Lost property"
  brief: string; // e.g. "Complainant Raju Singh reported loss of Samsung Mobile at Bus stand PKL"
}
