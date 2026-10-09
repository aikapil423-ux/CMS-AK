// CCTNS & Standard FIR Form Master Dropdown Constants

export const SOURCE_OF_COMPLAINT_OPTIONS = [
  "Citizen Service Center",
  "Citizen/General Public",
  "Cognizance by Police",
  "Court",
  "DGP Office",
  "Direct Email",
  "Higher Offices",
  "Home Ministry Office",
  "IG Office",
  "Informer",
  "National Human Rights Commission",
  "National Minority Commission",
  "National SC / ST Commission",
  "National Women Commission",
  "Newspapers Clippings",
  "Other Govt. Offices",
  "Other Police Stations",
  "Others",
];

export const DIRECTION_FROM_PS_OPTIONS = [
  "NORTH",
  "EAST",
  "WEST",
  "SOUTH",
  "NORTH-EAST",
  "NORTH-WEST",
  "SOUTH-EAST",
  "SOUTH-WEST",
];

export const GENDER_OPTIONS = [
  "Unknown",
  "Male",
  "Female",
  "Transgender",
];

export const MARITAL_STATUS_OPTIONS = [
  "Married",
  "Un Married",
  "Widow",
  "Separated",
  "Widower",
  "Divorcee",
  "Live In relation",
];

export const RELATION_TYPE_OPTIONS = [
  "Father",
  "Mother",
  "Guardian",
  "Husband",
  "Wife",
];

export const CASTE_CATEGORY_OPTIONS = [
  "GENERAL",
  "OTHER BACKWARD CLASSES (OBC)",
  "SCHEDULED CASTE",
  "SCHEDULED TRIBE",
];

export const IDENTIFICATION_TYPE_OPTIONS = [
  "Aadhar Card",
  "Any Other",
  "Arms License",
  "Driving License",
  "Income Tax (PAN) Card",
  "Passport",
  "Ration Card",
  "Visa",
  "Voter Card",
];

export const ACTION_TAKEN_OPTIONS = [
  "Investigation/Assign IO",
  "Refused",
  "Self Investigation",
  "Transferred",
] as const;

export const PROPERTY_CATEGORIES = [
  "AGRICULTURE EQUIPMENT",
  "ARMS AND AMMUNITION",
  "AUTOMOBILES AND OTHERS",
  "COIN AND CURRENCY",
  "CULTURAL PROPERTY",
  "CYBER CRIME",
  "DOCUMENTS AND VALUABLE SECURITIES",
  "DRUGS/NARCOTIC DRUGS",
  "ELECTRICAL AND ELECTRONIC GOODS",
  "EXPLOSIVES",
  "JEWELLERY",
  "OTHERS",
  "WILD LIFE",
];

export const PROPERTY_TYPES_BY_CATEGORY: Record<string, string[]> = {
  "AGRICULTURE EQUIPMENT": [
    "Tractor",
    "Harvester",
    "Water Pump",
    "Generator",
    "Agricultural Tools",
    "Pesticides / Seeds",
    "Others",
  ],
  "ARMS AND AMMUNITION": [
    "AMMUNITIONS",
    "BODY SHIELD",
    "EXPLOSIVES",
    "FIRE ARMS",
    "FIRE ARMS PARTS",
    "WEAPONS OTHER THAN FIRE ARMS",
  ],
  "AUTOMOBILES AND OTHERS": [
    "Two Wheeler / Motorcycle / Scooter",
    "Four Wheeler / Car / SUV",
    "Commercial Truck / Bus",
    "Auto Rickshaw / Three Wheeler",
    "Bicycle / Non-motorized",
    "Spare Parts / Accessories",
    "Others",
  ],
  "COIN AND CURRENCY": [
    "Indian Currency Notes (INR)",
    "Foreign Currency",
    "Counterfeit Currency (FICN)",
    "Coins / Antique Currency",
    "Others",
  ],
  "CULTURAL PROPERTY": [
    "Idols / Statues",
    "Antiquities / Archaeological Artifacts",
    "Paintings / Art Pieces",
    "Manuscripts / Historical Books",
    "Others",
  ],
  "CYBER CRIME": [
    "Mobile Phone / Smartphone",
    "Laptop / Computer",
    "Tablet / iPad",
    "Storage Device / Hard Disk / Pen Drive",
    "SIM Card",
    "Router / Server Equipment",
    "Camera / CCTV DVR",
    "Others",
  ],
  "DOCUMENTS AND VALUABLE SECURITIES": [
    "Property Deeds / Stamp Papers",
    "Cheque Books / Demand Drafts",
    "Promissory Notes / Bonds",
    "Identity Documents (Passport, Aadhaar)",
    "Educational / Official Certificates",
    "Others",
  ],
  "DRUGS/NARCOTIC DRUGS": [
    "Heroin / Smack / Brown Sugar",
    "Ganja / Cannabis",
    "Charas / Hashish",
    "Opium / Poppy Husk",
    "Cocaine",
    "Commercial Pharmaceuticals / Tramadol",
    "Others",
  ],
  "ELECTRICAL AND ELECTRONIC GOODS": [
    "Television / LED Display",
    "Air Conditioner / Refrigerator",
    "Copper Wires / Cables",
    "Transformers / Motors",
    "Home Appliances",
    "Others",
  ],
  "EXPLOSIVES": [
    "Detonators / Explosive Gel",
    "Crude Bomb / Country Bombs",
    "Chemicals / Acid",
    "Fireworks / Illegal Crackers",
    "RDX / Dynamite",
    "Others",
  ],
  "JEWELLERY": [
    "ANKLETS",
    "Artificial/Imitating Jewellery",
    "Copper Articles",
    "DIAMOND BANGLES",
    "DIAMOND NECKLACE",
    "DIAMOND RING",
    "DIAMOND STUDS",
    "GOLD ANKLETS",
    "GOLD ARMLET",
    "GOLD BANGLES",
    "GOLD BISCUITS",
    "GOLD BRACELET",
    "GOLD COIN",
    "GOLD EAR RINGS",
    "GOLD EAR STUD",
  ],
  "OTHERS": [
    "Household Goods",
    "Construction Materials",
    "Agricultural Produce / Grain",
    "Clothing / Personal Effects",
    "Scrap / Metal",
    "Other Miscellaneous",
  ],
  "WILD LIFE": [
    "Ivory / Elephant Tusk",
    "Animal Skin / Hide",
    "Rare Birds / Animals",
    "Tiger / Leopard Claws / Teeth",
    "Timber / Red Sanders / Sandalwood",
    "Others",
  ],
};

import { DropdownManagerService } from "@/services/dropdownManagerService";

export const getDynamicSourceOfComplaint = (): string[] =>
  DropdownManagerService.getOptionsList("fir_source_of_complaint", SOURCE_OF_COMPLAINT_OPTIONS);

export const getDynamicDirectionFromPs = (): string[] =>
  DropdownManagerService.getOptionsList("fir_direction_from_ps", DIRECTION_FROM_PS_OPTIONS);

export const getDynamicGenderOptions = (): string[] =>
  DropdownManagerService.getOptionsList("gender_options", GENDER_OPTIONS);

export const getDynamicMaritalStatusOptions = (): string[] =>
  DropdownManagerService.getOptionsList("marital_status", MARITAL_STATUS_OPTIONS);

export const getDynamicRelationTypes = (): string[] =>
  DropdownManagerService.getOptionsList("relation_types", RELATION_TYPE_OPTIONS);

export const getDynamicCasteCategories = (): string[] =>
  DropdownManagerService.getOptionsList("caste_category", CASTE_CATEGORY_OPTIONS);

export const getDynamicIdentificationTypes = (): string[] =>
  DropdownManagerService.getOptionsList("identification_type", IDENTIFICATION_TYPE_OPTIONS);

export const getDynamicActionTakenOptions = (): string[] =>
  DropdownManagerService.getOptionsList("fir_action_taken", [...ACTION_TAKEN_OPTIONS]);

export const getDynamicPropertyCategories = (): string[] =>
  DropdownManagerService.getOptionsList("fir_property_categories", PROPERTY_CATEGORIES);

export const getDynamicMajorHeads = (fallback: string[]): string[] =>
  DropdownManagerService.getOptionsList("fir_major_heads", fallback);

export const getDynamicWeaponsUsed = (fallback: string[]): string[] =>
  DropdownManagerService.getOptionsList("fir_weapon_used", fallback);

