export type RegistrationType = "UIDB" | "MISSING_PERSON" | "MISSING_CATTLE" | "LOST_PROPERTY";

export type RegistrationStatus = "OPEN" | "TRACED" | "CLOSED" | "RESTORED";

export interface RegistrationEntry {
  id: string;
  type: RegistrationType;
  regNumber: string;
  date: string;
  time: string;
  stationName: string;
  district: string;
  status: RegistrationStatus;
  officerName: string;
  officerRank: string;
  remarks?: string;
  createdAt: string;

  // UIDB / UD specific
  photoUrl?: string;
  photos?: any[];
  fullUidbData?: any;
  gender?: string;
  approxAge?: string;
  foundLocation?: string;
  identifyingMarks?: string;
  clothingDetails?: string;
  inquestNumber?: string;
  mortuaryName?: string;

  // Missing Person specific
  personName?: string;
  fatherOrHusbandName?: string;
  missingFrom?: string;
  contactPerson?: string;
  contactNumber?: string;
  address?: string;
  heightBuilt?: string;

  // Missing Cattle specific
  cattleType?: string;
  breed?: string;
  color?: string;
  earTagNumber?: string;
  ownerName?: string;
  ownerPhone?: string;
  ownerVillage?: string;
  approxValue?: string;

  // Lost Property specific
  propertyType?: string;
  brandOrMake?: string;
  identifyingNumber?: string;
  lostLocation?: string;
}
