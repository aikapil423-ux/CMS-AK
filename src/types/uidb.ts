export interface UidbUploadedPhoto {
  id: string;
  fileName: string;
  fileType: string;
  fileSubType: "Front View" | "Lateral View" | "Top View" | "Close-up of Marks";
  fileDescription?: string;
  dataUrl: string;
  uploadedAt: string;
}

export interface InformantIdEntry {
  id: string;
  idType: string;
  idNo: string;
}

export interface UidbFormData {
  id: string;
  regNumber: string; // e.g. "0003/2019" or "UIDB-2026/01"
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  year: string;
  state: string;
  district: string;
  stationName: string;

  // General Information
  gdNumber: string;
  gdDateTime: string;
  bodyType: "Identified" | "Unidentified";
  deathType: "Natural" | "Unnatural";
  inquestReportPreparedBy: string;
  inquestNumber?: string;
  caseType: string;
  firNumber?: string;
  firYear?: string;
  officerName: string;
  dateTimeOfDeath?: string;
  dateTimeOfInformation?: string;
  sourceOfInformation: string;
  modeOfInformation: string;
  briefOfIncident?: string;

  // Place where body was found
  placeWhereFound: string;
  dateTimeWhenFound?: string;
  distanceFromPsKm: string;
  directionFromPs: string;

  // Post Mortem Waiver
  requestToWaivePostMortem: "Yes" | "No";
  approvingOfficer?: string;

  // Informant Information
  informantUid?: string;
  informantFirstName?: string;
  informantMiddleName?: string;
  informantLastName?: string;
  informantEmail?: string;
  informantRelationType?: string;
  informantRelativeName?: string;
  informantMobile?: string;
  informantLandline?: string;

  // Informant Address
  presentHouseNo?: string;
  presentStreet?: string;
  presentColony?: string;
  presentCity?: string;
  presentTehsil?: string;
  presentCountry?: string;
  presentState?: string;
  presentDistrict?: string;
  presentPoliceStation?: string;
  presentPincode?: string;
  sameAsPresentAddress?: boolean;

  permanentHouseNo?: string;
  permanentStreet?: string;
  permanentColony?: string;
  permanentCity?: string;
  permanentCountry?: string;
  permanentState?: string;
  permanentDistrict?: string;
  permanentPoliceStation?: string;

  // Informant other info
  informantNationality?: string;
  informantIds: InformantIdEntry[];

  // Deceased Person Information -> Physical Description
  bodyBuildType?: string;
  bodyComplexionType?: string;
  gender: string;
  heightFeetFrom?: string;
  heightInchesFrom?: string;
  heightCmsFrom?: string;
  heightFeetTo?: string;
  heightInchesTo?: string;
  heightCmsTo?: string;

  // Physical description -> General
  faceType?: string;
  forehead?: string;
  cheek?: string;
  chin?: string;
  poxpitted?: "Yes" | "No";
  lips?: string;
  nose?: string;
  teeth?: string;
  beard?: string;
  moustaches?: string;

  eyesType?: string;
  blind?: string;
  eyesColor?: string;
  usingSpecs?: string;
  specsType?: string;
  eyeBrowThickness?: string;
  eyeBrowShape?: string;
  blinking?: string;
  squint?: string;

  earsMissing?: string;
  earsDeformed?: string;
  deafDumb?: string;
  armsDeformity?: string;
  fingerExtra?: string;
  fingerMissing?: string;
  hunchBack?: string;
  goitre?: string;
  legsDeformity?: string;
  toeExtra?: string;
  toeMissing?: string;
  limping?: string;
  bowLeg?: string;
  knockKnee?: string;
  earLobes?: string;

  hairType?: string;
  usingWig?: string;
  hairLength?: string;
  hairStraightness?: string;
  hairColor?: string;
  hairDye?: string;
  hairCut?: string;
  hairStyle?: string;

  habits?: string;
  speech?: string;

  // Clothes worn
  clothesInPersonGender?: "Male" | "Female";
  clothesOuterTop?: string;
  clothesOuterBottom?: string;
  clothesInnerTop?: string;
  clothesInnerBottom?: string;
  clothesSeasonalTop?: string;
  clothesSeasonalBottom?: string;
  clothesFootwear?: string;

  // Identification Marks
  marksMoles?: string;
  marksBlackMarks?: string;
  marksScarMarks?: string;
  marksBurnMarks?: string;
  marksLeucoderma?: string;
  marksTattooMarks?: string;
  marksBloodGroup?: string;
  marksOthers?: string;

  // Dead Body Details
  conditionOfDeadBody: string;
  detailOfBloodOnBody?: string;
  typeOfStain?: string;
  detailOfStain?: string;
  whetherApparelFound: "Yes" | "No";
  religiousAttireFound: "Yes" | "No";
  conditionsEvidencingSuicide: "Yes" | "No";
  probableWeapon?: string;
  detailOfInjuries: string;
  markOnNeckStrangulation: "Yes" | "No";
  fingerTipsPreserved: "Yes" | "No";
  otherEvidenceFound?: string;
  probableCauseOfDeath?: string;

  // Age Panel
  dateOfBirth?: string;
  yearOfBirth?: string;
  ageYears?: string;
  ageMonths?: string;
  ageRangeFrom?: string;
  ageRangeTo?: string;

  // Photos
  photos: UidbUploadedPhoto[];

  // Identifier Details (if Identified)
  identifierName?: string;
  identifierFatherName?: string;
  identifierRelation?: string;
  identifierAddress?: string;
  identifierPhone?: string;
  identifierStatement?: string;

  // Unnatural Death Details
  unnaturalMarkDetails?: string;
  positionOfLimb?: string;
  positionOfEyes?: string;
  positionOfMouth?: string;
  expressionOfCountenance?: string;
  articleFoundInHandOrBody?: string;
  circumstancesSuicideRumours?: string;
  samplesCollectedDnaFsl: "Yes" | "No";
  isCustodialDowryDeath: "Yes" | "No";

  // Meta
  photoUrl?: string;
  status: "OPEN" | "TRACED" | "CLOSED" | "RESTORED";
  createdAt: string;
}

export const EMPTY_UIDB_FORM: UidbFormData = {
  id: "",
  regNumber: "",
  date: "",
  time: "",
  year: "",
  state: "HARYANA",
  district: "PANCHKULA",
  stationName: "PANCHKULA SECTOR-5",

  // General Information
  gdNumber: "",
  gdDateTime: "",
  bodyType: "Unidentified",
  deathType: "Unnatural",
  inquestReportPreparedBy: "",
  caseType: "",
  firNumber: "",
  firYear: "",
  officerName: "",
  dateTimeOfDeath: "",
  dateTimeOfInformation: "",
  sourceOfInformation: "",
  modeOfInformation: "",
  briefOfIncident: "",

  // Place where body was found
  placeWhereFound: "",
  dateTimeWhenFound: "",
  distanceFromPsKm: "",
  directionFromPs: "",

  // Post Mortem Waiver
  requestToWaivePostMortem: "No",
  approvingOfficer: "",

  // Informant Information
  informantUid: "",
  informantFirstName: "",
  informantMiddleName: "",
  informantLastName: "",
  informantEmail: "",
  informantRelationType: "",
  informantRelativeName: "",
  informantMobile: "",
  informantLandline: "",

  // Informant Address
  presentHouseNo: "",
  presentStreet: "",
  presentColony: "",
  presentCity: "",
  presentTehsil: "",
  presentCountry: "INDIA",
  presentState: "HARYANA",
  presentDistrict: "PANCHKULA",
  presentPoliceStation: "PANCHKULA SECTOR-5",
  presentPincode: "",
  sameAsPresentAddress: false,

  permanentHouseNo: "",
  permanentStreet: "",
  permanentColony: "",
  permanentCity: "",
  permanentCountry: "INDIA",
  permanentState: "HARYANA",
  permanentDistrict: "PANCHKULA",
  permanentPoliceStation: "PANCHKULA SECTOR-5",

  informantNationality: "INDIA",
  informantIds: [],

  // Deceased Person Information
  bodyBuildType: "",
  bodyComplexionType: "",
  gender: "",
  heightFeetFrom: "",
  heightInchesFrom: "",
  heightCmsFrom: "",
  heightFeetTo: "",
  heightInchesTo: "",
  heightCmsTo: "",

  // General face & body
  faceType: "",
  forehead: "",
  cheek: "",
  chin: "",
  poxpitted: "No",
  lips: "",
  nose: "",
  teeth: "",
  beard: "",
  moustaches: "",

  eyesType: "",
  blind: "None",
  eyesColor: "",
  usingSpecs: "No",
  specsType: "",
  eyeBrowThickness: "",
  eyeBrowShape: "",
  blinking: "",
  squint: "No",

  earsMissing: "No",
  earsDeformed: "No",
  deafDumb: "No",
  armsDeformity: "None",
  fingerExtra: "No",
  fingerMissing: "No",
  hunchBack: "No",
  goitre: "No",
  legsDeformity: "None",
  toeExtra: "No",
  toeMissing: "No",
  limping: "No",
  bowLeg: "No",
  knockKnee: "No",
  earLobes: "",

  hairType: "",
  usingWig: "No",
  hairLength: "",
  hairStraightness: "",
  hairColor: "",
  hairDye: "No",
  hairCut: "",
  hairStyle: "",

  habits: "",
  speech: "",

  // Clothes worn
  clothesInPersonGender: "Male",
  clothesOuterTop: "",
  clothesOuterBottom: "",
  clothesInnerTop: "",
  clothesInnerBottom: "",
  clothesSeasonalTop: "",
  clothesSeasonalBottom: "",
  clothesFootwear: "",

  // Identification Marks
  marksMoles: "",
  marksBlackMarks: "",
  marksScarMarks: "",
  marksBurnMarks: "",
  marksLeucoderma: "",
  marksTattooMarks: "",
  marksBloodGroup: "",
  marksOthers: "",

  // Dead Body Details
  conditionOfDeadBody: "",
  detailOfBloodOnBody: "",
  typeOfStain: "",
  detailOfStain: "",
  whetherApparelFound: "Yes",
  religiousAttireFound: "No",
  conditionsEvidencingSuicide: "No",
  probableWeapon: "",
  detailOfInjuries: "",
  markOnNeckStrangulation: "No",
  fingerTipsPreserved: "Yes",
  otherEvidenceFound: "",
  probableCauseOfDeath: "",

  // Age Panel
  dateOfBirth: "",
  yearOfBirth: "",
  ageYears: "",
  ageMonths: "",
  ageRangeFrom: "",
  ageRangeTo: "",

  // Photos
  photos: [],

  // Identifier Details
  identifierName: "",
  identifierFatherName: "",
  identifierRelation: "",
  identifierAddress: "",
  identifierPhone: "",
  identifierStatement: "",

  // Unnatural Death Details
  unnaturalMarkDetails: "",
  positionOfLimb: "",
  positionOfEyes: "",
  positionOfMouth: "",
  expressionOfCountenance: "",
  articleFoundInHandOrBody: "",
  circumstancesSuicideRumours: "",
  samplesCollectedDnaFsl: "Yes",
  isCustodialDowryDeath: "No",

  status: "OPEN",
  createdAt: new Date().toISOString(),
};

export const DEFAULT_UIDB_FORM: UidbFormData = EMPTY_UIDB_FORM;

export const SAMPLE_UIDB_RECORD: UidbFormData = {
  id: "uidb_sample_001",
  regNumber: "0003/2019",
  date: "2019-04-22",
  time: "15:19",
  year: "2019",
  state: "HARYANA",
  district: "PANCHKULA",
  stationName: "PANCHKULA SECTOR-5",

  // General Information
  gdNumber: "007",
  gdDateTime: "2019-04-22 15:16",
  bodyType: "Unidentified",
  deathType: "Unnatural",
  inquestReportPreparedBy: "Lalit Kumar",
  caseType: "Death due to Accident",
  firNumber: "",
  firYear: "2019",
  officerName: "Lalit Kumar (I (Inspector))-53175",
  dateTimeOfDeath: "2019-04-22 14:30",
  dateTimeOfInformation: "2019-04-22 15:00",
  sourceOfInformation: "Citizen/General Public",
  modeOfInformation: "By Phone",
  briefOfIncident: "Unidentified dead body recovered near highway culvert with accidental injuries.",

  // Place where body was found
  placeWhereFound: "Near Bridge Culvert, NH-22, Panchkula",
  dateTimeWhenFound: "2019-04-22 15:00",
  distanceFromPsKm: "4",
  directionFromPs: "NORTH-EAST",

  // Post Mortem Waiver
  requestToWaivePostMortem: "No",
  approvingOfficer: "Lalit Kumar (Inspector)",

  // Informant Information
  informantUid: "",
  informantFirstName: "RAJNISH",
  informantMiddleName: "",
  informantLastName: "KUMAR",
  informantEmail: "",
  informantRelationType: "Citizen",
  informantRelativeName: "Sh. Rameshwar",
  informantMobile: "9812034567",
  informantLandline: "",

  // Informant Address
  presentHouseNo: "412",
  presentStreet: "Sector 5 Main Road",
  presentColony: "Sector 5",
  presentCity: "Panchkula",
  presentTehsil: "Panchkula",
  presentCountry: "INDIA",
  presentState: "HARYANA",
  presentDistrict: "PANCHKULA",
  presentPoliceStation: "PANCHKULA SECTOR-5",
  presentPincode: "134109",
  sameAsPresentAddress: true,

  permanentHouseNo: "412",
  permanentStreet: "Sector 5 Main Road",
  permanentColony: "Sector 5",
  permanentCity: "Panchkula",
  permanentCountry: "INDIA",
  permanentState: "HARYANA",
  permanentDistrict: "PANCHKULA",
  permanentPoliceStation: "PANCHKULA SECTOR-5",

  informantNationality: "INDIA",
  informantIds: [
    { id: "1", idType: "Aadhaar Card", idNo: "XXXXXXXX4819" }
  ],

  // Deceased Person Information
  bodyBuildType: "Medium",
  bodyComplexionType: "Wheatish",
  gender: "Male",
  heightFeetFrom: "5",
  heightInchesFrom: "7",
  heightCmsFrom: "170",
  heightFeetTo: "5",
  heightInchesTo: "9",
  heightCmsTo: "175",

  // General face & body
  faceType: "Oval",
  forehead: "Broad",
  cheek: "Normal",
  chin: "Round",
  poxpitted: "No",
  lips: "Thin",
  nose: "Straight",
  teeth: "Intact",
  beard: "Clean Shaven",
  moustaches: "Small Trimmed",

  eyesType: "Normal",
  blind: "None",
  eyesColor: "Black",
  usingSpecs: "No",
  specsType: "",
  eyeBrowThickness: "Medium",
  eyeBrowShape: "Arched",
  blinking: "Normal",
  squint: "No",

  earsMissing: "No",
  earsDeformed: "No",
  deafDumb: "No",
  armsDeformity: "None",
  fingerExtra: "No",
  fingerMissing: "No",
  hunchBack: "No",
  goitre: "No",
  legsDeformity: "None",
  toeExtra: "No",
  toeMissing: "No",
  limping: "No",
  bowLeg: "No",
  knockKnee: "No",
  earLobes: "Attached",

  hairType: "Straight",
  usingWig: "No",
  hairLength: "Short",
  hairStraightness: "Straight",
  hairColor: "Black",
  hairDye: "No",
  hairCut: "Normal Police Cut",
  hairStyle: "Side Parting",

  habits: "Unknown",
  speech: "N/A",

  // Clothes worn
  clothesInPersonGender: "Male",
  clothesOuterTop: "Dark Blue Full Sleeve Shirt",
  clothesOuterBottom: "Black Denim Jeans",
  clothesInnerTop: "White Cotton Vest",
  clothesInnerBottom: "Undergarments",
  clothesSeasonalTop: "None",
  clothesSeasonalBottom: "None",
  clothesFootwear: "Brown Leather Shoes",

  // Identification Marks
  marksMoles: "Small mole on right side of neck",
  marksBlackMarks: "None",
  marksScarMarks: "Old surgical scar 3 inches on left knee",
  marksBurnMarks: "None",
  marksLeucoderma: "None",
  marksTattooMarks: "OM tattoo engraved on right forearm",
  marksBloodGroup: "B+ (suspected)",
  marksOthers: "Silver ring worn on middle finger of right hand.",

  // Dead Body Details
  conditionOfDeadBody: "Normal Condition",
  detailOfBloodOnBody: "Traces of dried blood near head and nasal cavity due to impact trauma.",
  typeOfStain: "Blood Stain",
  detailOfStain: "Stains on upper collar of shirt",
  whetherApparelFound: "Yes",
  religiousAttireFound: "No",
  conditionsEvidencingSuicide: "No",
  probableWeapon: "Blunt force impact (Vehicular Collision)",
  detailOfInjuries: "Crush injury on frontal bone of skull, abrasions over right shoulder and elbow.",
  markOnNeckStrangulation: "No",
  fingerTipsPreserved: "Yes",
  otherEvidenceFound: "Black wallet with no identity cards found in rear pocket.",
  probableCauseOfDeath: "Head injury following road vehicular accident.",

  // Age Panel
  dateOfBirth: "1986-12-02",
  yearOfBirth: "1986",
  ageYears: "32",
  ageMonths: "4",
  ageRangeFrom: "30",
  ageRangeTo: "35",

  // Photos
  photos: [
    {
      id: "ph_1",
      fileName: "UIDB_0003_Front.jpg",
      fileType: "Photograph",
      fileSubType: "Front View",
      fileDescription: "Front face view for identification circular",
      dataUrl: "",
      uploadedAt: "2019-04-22 15:30",
    }
  ],

  // Identifier Details
  identifierName: "",
  identifierFatherName: "",
  identifierRelation: "",
  identifierAddress: "",
  identifierPhone: "",
  identifierStatement: "",

  // Unnatural Death Details
  unnaturalMarkDetails: "Multiple friction abrasions on right torso consistent with vehicular slide.",
  positionOfLimb: "Legs straight, right hand flexed near chest.",
  positionOfEyes: "Semi-open, dilated pupils.",
  positionOfMouth: "Partially open.",
  expressionOfCountenance: "Placid, unconscious appearance at time of discovery.",
  articleFoundInHandOrBody: "None",
  circumstancesSuicideRumours: "No evidence or rumors of suicide. Appears to be hit-and-run road accident.",
  samplesCollectedDnaFsl: "Yes",
  isCustodialDowryDeath: "No",

  status: "OPEN",
  createdAt: new Date().toISOString(),
};
