import {
  FIRItem,
  FIRStatus,
  MainFIRStatus,
  getMainFIRStatus,
  ComplaintCategory,
  ComplaintPriority,
  FIRCaseDiaryItem,
  FIRDocumentItem,
  ComplaintReportItem,
  FIRTimelineEvent,
  FIRAuditRecord,
  AccusedPerson,
  ComplainantPerson,
  LegalAnalysisReport,
  FIRTransferRecord,
  LinkedFIREntry,
  FIRTrackingState,
  ChallanMode,
  ChallanType,
  FIRChallanRecord,
  FIRReopenEvent,
  FIRCompletionEvent,
} from "@/types";
import { ComplaintService } from "./complaintService";
import { evidenceBlobStore } from "./evidenceBlobStore";
import { nextFirNumber, firPendingDays, getAuthoritativeTrackingState } from '@/lib/firIntegrity';

const FIRS_STORAGE_KEY = "haryana_police_cms_firs_v2";

const INITIAL_MOCK_FIRS: FIRItem[] = [
  {
    id: "fir-pnp-001",
    firNumber: "FIR/0004/2026",
    firYear: 2026,
    firDate: "2026-10-14",
    firTime: "08:15",
    policeStation: "PS City Panipat",
    district: "Panipat",
    state: "Haryana",
    sourceComplaintId: "comp-pnp-001",
    sourceComplaintNumber: "COMP/2026/01490",
    cctnsFirNumber: "HR060260004",
    cctnsSyncStatus: "SYNCED",
    category: "PROPERTY_THEFT_BURGLARY",
    categoryDisplay: "Snatching",
    priority: "URGENT",
    status: "UNDER_INVESTIGATION",
    mainStatus: "Under Investigation",
    actsAndSections: "Sec 304, 3(5) BNS (Snatching)",
    majorAct: "Bharatiya Nyaya Sanhita, 2023",
    bnsSections: ["304", "3(5)"],
    incidentDateFrom: "2026-10-14",
    incidentDateTo: "2026-10-14",
    incidentTimeFrom: "07:30",
    incidentTimeTo: "07:45",
    incidentPlace: "Near Red Light Chowk, GT Road, Panipat",
    incidentLandmark: "Opposite Bus Stand Panipat",
    distanceFromPs: "1.0 KM North",
    beatNumber: "Beat No. 1",
    incidentDetails: "Complainant was walking towards bus stand when two motorcycle riders intercepted him and snatched his OnePlus Nord CE4 Mobile phone at high speed.",
    gdEntryNumber: "GD-0012/14-10-2026",
    gdEntryDateTime: "2026-10-14 07:50",
    typeOfInformation: "WRITTEN",
    complainantName: "Vikas Kumar",
    complainantFatherSpouse: "Sh. Rajinder Kumar",
    complainantGender: "MALE",
    complainantAge: 28,
    complainantMobile: "9812104521",
    complainantAddress: "H.No. 124, Model Town, Panipat",
    complainantCity: "Panipat",
    complainantDistrict: "Panipat",
    complainantState: "Haryana",
    isAccusedKnown: true,
    accusedList: [
      {
        id: "acc-pnp-01",
        name: "Monu @ Kalia",
        alias: "Kalia",
        fatherName: "Rameshwar Dayal",
        age: 24,
        address: "H.No. 45, Sanjay Colony, Panipat",
        isIdentified: true,
        isArrested: true,
        custodyStatus: "ARRESTED",
      },
    ],
    propertiesList: [
      {
        id: "prop-pnp-01",
        propertyCategory: "STOLEN_MOVABLE",
        propertyType: "Mobile Phone",
        brandOrMake: "OnePlus Nord CE4",
        quantity: "1",
        description: "OnePlus Nord CE4 Mobile Phone, Blue color",
        estimatedValue: 21999,
        status: "RECOVERED",
      },
    ],
    stolenPropertyDetails: "OnePlus Nord CE4 Mobile Phone, Blue color, IMEI: 864201928371625",
    totalPropertyEstimatedValue: 21999,
    registeredBy: "Inspector Rajesh Kumar (SHO)",
    assignedIoId: "eo-pnp-01",
    assignedIoName: "SI Rajesh Kumar",
    assignedIoRank: "Sub Inspector",
    assignedIoBeltNumber: "SI/4412",
    assignedIoPhone: "9812033441",
    assignedAt: "2026-10-14 08:30",
    assignedDirections: "Conduct spot inspection, record recovery memo, and produce arrested accused before court.",
    daysPending: 1,
    actionTakenData: {
      investigationOfficerName: "SI Rajesh Kumar",
      investigationOfficerRank: "Sub Inspector",
      investigationOfficerMobile: "9812033441",
    },
    createdAt: "2026-10-14T08:15:00Z",
    updatedAt: "2026-10-14T11:00:00Z",
  },
  {
    id: "fir-pnp-002",
    firNumber: "FIR/0001/2026",
    firYear: 2026,
    firDate: "2026-10-14",
    firTime: "11:45",
    policeStation: "PS Chandni Bagh Panipat",
    district: "Panipat",
    state: "Haryana",
    sourceComplaintId: "comp-pnp-002",
    sourceComplaintNumber: "COMP/2026/01491",
    cctnsFirNumber: "HR060260001",
    cctnsSyncStatus: "SYNCED",
    category: "VEHICLE_THEFT",
    categoryDisplay: "MV Theft",
    priority: "ROUTINE",
    status: "UNDER_INVESTIGATION",
    mainStatus: "Under Investigation",
    actsAndSections: "Sec 303(2) BNS",
    majorAct: "Bharatiya Nyaya Sanhita, 2023",
    bnsSections: ["303(2)"],
    incidentDateFrom: "2026-10-14",
    incidentDateTo: "2026-10-14",
    incidentTimeFrom: "09:00",
    incidentTimeTo: "11:00",
    incidentPlace: "Outside Bank of Baroda, Sector 12 Market, Panipat",
    incidentLandmark: "Near Sector 12 Community Centre",
    distanceFromPs: "2.0 KM West",
    beatNumber: "Beat No. 3",
    incidentDetails: "Motorcycle Hero Splendor Plus bearing registration HR-06-AM-4491 stolen from parking outside bank while complainant was inside.",
    gdEntryNumber: "GD-0018/14-10-2026",
    gdEntryDateTime: "2026-10-14 11:15",
    typeOfInformation: "WRITTEN",
    complainantName: "Suresh Goel",
    complainantFatherSpouse: "Sh. Gian Chand",
    complainantGender: "MALE",
    complainantAge: 45,
    complainantMobile: "9876543120",
    complainantAddress: "H.No. 312, Tehsil Camp, Panipat",
    complainantCity: "Panipat",
    complainantDistrict: "Panipat",
    complainantState: "Haryana",
    isAccusedKnown: false,
    accusedList: [],
    stolenPropertyDetails: "Hero Splendor Plus Motorcycle HR-06-AM-4491, Engine: 998271, Chasis: 110294",
    totalPropertyEstimatedValue: 55000,
    registeredBy: "Inspector Kuldeep Singh (SHO)",
    assignedIoId: "eo-pnp-02",
    assignedIoName: "ASI Virender Singh",
    assignedIoRank: "Assistant Sub Inspector",
    assignedIoBeltNumber: "ASI/5521",
    assignedIoPhone: "9812456781",
    assignedAt: "2026-10-14 12:00",
    assignedDirections: "Check CCTV of surrounding shops and circulate vehicle details on VAHAN portal.",
    daysPending: 1,
    actionTakenData: {
      investigationOfficerName: "ASI Virender Singh",
      investigationOfficerRank: "Assistant Sub Inspector",
      investigationOfficerMobile: "9812456781",
    },
    createdAt: "2026-10-14T11:45:00Z",
    updatedAt: "2026-10-14T12:00:00Z",
  },
  {
    id: "fir-pnp-003",
    firNumber: "FIR/0001/2026",
    firYear: 2026,
    firDate: "2026-10-14",
    firTime: "16:20",
    policeStation: "PS Samalkha",
    district: "Panipat",
    state: "Haryana",
    sourceComplaintId: "comp-pnp-003",
    sourceComplaintNumber: "COMP/2026/01492",
    cctnsFirNumber: "HR060260001",
    cctnsSyncStatus: "SYNCED",
    category: "SPECIAL_ACTS",
    categoryDisplay: "NDPS Act, 1985",
    priority: "URGENT",
    status: "UNDER_INVESTIGATION",
    mainStatus: "Under Investigation",
    actsAndSections: "Sec 20(b)(ii)(A), 29 NDPS Act, 1985",
    majorAct: "NDPS Act, 1985",
    incidentDateFrom: "2026-10-14",
    incidentDateTo: "2026-10-14",
    incidentTimeFrom: "15:00",
    incidentTimeTo: "15:45",
    incidentPlace: "Patti Kalyana T-Point, NH-44, Samalkha",
    incidentLandmark: "Near Flyover Pillar 88",
    distanceFromPs: "3.5 KM South",
    beatNumber: "Beat No. 5",
    incidentDetails: "During special nakabandi, police party intercepted accused carrying polythene bag containing 250 grams Charas/Sulpha.",
    gdEntryNumber: "GD-0034/14-10-2026",
    gdEntryDateTime: "2026-10-14 15:55",
    typeOfInformation: "WRITTEN",
    complainantName: "SI Joginder Singh",
    complainantFatherSpouse: "Police Station Samalkha",
    complainantGender: "MALE",
    complainantAge: 38,
    complainantMobile: "9812044552",
    complainantAddress: "PS Samalkha, Panipat",
    complainantCity: "Panipat",
    complainantDistrict: "Panipat",
    complainantState: "Haryana",
    isAccusedKnown: true,
    accusedList: [
      {
        id: "acc-pnp-02",
        name: "Satish Kumar @ Titu",
        alias: "Titu",
        fatherName: "Dharampal",
        age: 31,
        address: "Ward 4, Patti Kalyana, Samalkha, Panipat",
        isIdentified: true,
        isArrested: true,
        custodyStatus: "ARRESTED",
      },
    ],
    propertiesList: [
      {
        id: "prop-pnp-02",
        propertyCategory: "STOLEN_MOVABLE",
        propertyType: "Charas / Sulpha (Narcotics)",
        brandOrMake: "Illicit Contraband",
        quantity: "250 Grams",
        description: "Seized 250 grams Charas contraband",
        estimatedValue: 45000,
        status: "RECOVERED",
      },
    ],
    stolenPropertyDetails: "Seized 250 grams Charas contraband",
    totalPropertyEstimatedValue: 45000,
    registeredBy: "Inspector Dharamvir Singh (SHO)",
    assignedIoId: "eo-pnp-03",
    assignedIoName: "Inspector Dharamvir Singh",
    assignedIoRank: "Inspector (SHO)",
    assignedIoBeltNumber: "INS/1102",
    assignedIoPhone: "9812011223",
    assignedAt: "2026-10-14 16:30",
    assignedDirections: "Comply with Section 52A NDPS Act inventory verification before Judicial Magistrate.",
    daysPending: 1,
    actionTakenData: {
      investigationOfficerName: "Inspector Dharamvir Singh",
      investigationOfficerRank: "Inspector (SHO)",
      investigationOfficerMobile: "9812011223",
    },
    createdAt: "2026-10-14T16:20:00Z",
    updatedAt: "2026-10-14T17:00:00Z",
  },
  {
    id: "fir-pnp-004",
    firNumber: "FIR/0002/2026",
    firYear: 2026,
    firDate: "2026-10-14",
    firTime: "20:30",
    policeStation: "PS Model Town Panipat",
    district: "Panipat",
    state: "Haryana",
    sourceComplaintId: "comp-pnp-004",
    sourceComplaintNumber: "COMP/2026/01493",
    cctnsFirNumber: "HR060260002",
    cctnsSyncStatus: "SYNCED",
    category: "CRIMES_AGAINST_PERSON",
    categoryDisplay: "Kidnapping",
    priority: "URGENT",
    status: "UNDER_INVESTIGATION",
    mainStatus: "Under Investigation",
    actsAndSections: "Sec 137(2) BNS (Kidnapping)",
    majorAct: "Bharatiya Nyaya Sanhita, 2023",
    bnsSections: ["137(2)"],
    incidentDateFrom: "2026-10-14",
    incidentDateTo: "2026-10-14",
    incidentTimeFrom: "18:00",
    incidentTimeTo: "18:45",
    incidentPlace: "Sector 11 Park, Panipat",
    incidentLandmark: "Near Community Centre Sector 11",
    distanceFromPs: "1.2 KM South",
    beatNumber: "Beat No. 2",
    incidentDetails: "Complainant reported abduction of her minor nephew aged 14 years from neighborhood park by known suspect Deepak.",
    gdEntryNumber: "GD-0045/14-10-2026",
    gdEntryDateTime: "2026-10-14 19:30",
    typeOfInformation: "WRITTEN",
    complainantName: "Sunita Rani",
    complainantFatherSpouse: "W/o Krishan Lal",
    complainantGender: "FEMALE",
    complainantAge: 38,
    complainantMobile: "9813088991",
    complainantAddress: "H.No. 88, Sector 11, Panipat",
    complainantCity: "Panipat",
    complainantDistrict: "Panipat",
    complainantState: "Haryana",
    isAccusedKnown: true,
    accusedList: [
      {
        id: "acc-pnp-03",
        name: "Deepak",
        fatherName: "Ram Kumar",
        age: 26,
        address: "Village Babarpur, Panipat",
        isIdentified: true,
        isArrested: false,
        isSuspect: true,
      },
    ],
    totalPropertyEstimatedValue: 0,
    registeredBy: "Inspector Sandeep Kumar (SHO)",
    assignedIoId: "eo-pnp-04",
    assignedIoName: "W/SI Meena Devi",
    assignedIoRank: "Sub Inspector",
    assignedIoBeltNumber: "WSI/2091",
    assignedIoPhone: "9812399884",
    assignedAt: "2026-10-14 21:00",
    assignedDirections: "Deploy technical surveillance teams and raid suspected locations in Babarpur.",
    daysPending: 1,
    actionTakenData: {
      investigationOfficerName: "W/SI Meena Devi",
      investigationOfficerRank: "Sub Inspector",
      investigationOfficerMobile: "9812399884",
    },
    createdAt: "2026-10-14T20:30:00Z",
    updatedAt: "2026-10-14T21:00:00Z",
  },
  {
    id: "fir-pnp-005",
    firNumber: "FIR/0003/2026",
    firYear: 2026,
    firDate: "2026-10-15",
    firTime: "09:30",
    policeStation: "PS Model Town Panipat",
    district: "Panipat",
    state: "Haryana",
    sourceComplaintId: "comp-pnp-005",
    sourceComplaintNumber: "COMP/2026/01540",
    cctnsFirNumber: "HR060260003",
    cctnsSyncStatus: "SYNCED",
    category: "VIOLENT_CRIME",
    categoryDisplay: "Murder",
    priority: "CRITICAL",
    status: "UNDER_INVESTIGATION",
    mainStatus: "Under Investigation",
    actsAndSections: "Sec 103(1), 3(5) BNS (Murder)",
    majorAct: "Bharatiya Nyaya Sanhita, 2023",
    bnsSections: ["103(1)", "3(5)"],
    incidentDateFrom: "2026-10-15",
    incidentDateTo: "2026-10-15",
    incidentTimeFrom: "08:15",
    incidentTimeTo: "08:45",
    incidentPlace: "Sector 11-12 Dividing Road, Panipat",
    incidentLandmark: "Near Park Gate",
    distanceFromPs: "2.5 KM South",
    beatNumber: "Beat No. 3",
    incidentDetails: "Physical altercation resulting in fatal head injuries to victim during road dispute.",
    gdEntryNumber: "GD-0008/15-10-2026",
    gdEntryDateTime: "2026-10-15 09:00",
    typeOfInformation: "WRITTEN",
    complainantName: "Mohit Verma",
    complainantFatherSpouse: "Sh. Suresh Verma",
    complainantGender: "MALE",
    complainantAge: 32,
    complainantMobile: "9812901122",
    complainantAddress: "H.No. 450, Sector 12, Panipat",
    complainantCity: "Panipat",
    complainantDistrict: "Panipat",
    complainantState: "Haryana",
    isAccusedKnown: true,
    accusedList: [
      {
        id: "acc-pnp-05",
        name: "Rohit",
        alias: "Kalu",
        age: 26,
        fatherName: "Mahesh",
        address: "Vill. Sewah, Panipat",
        isArrested: true,
        custodyStatus: "ARRESTED",
      },
    ],
    victimsList: [
      {
        id: "vic-pnp-05",
        name: "Sunil Kumar",
        age: 34,
        fatherOrHusbandName: "Ramphal",
        address: "Sector 11, Panipat",
        gender: "MALE",
      },
    ],
    propertiesList: [
      {
        id: "prop-pnp-05",
        propertyCategory: "WEAPONS_AMMUNITION",
        propertyType: "Iron Rod (Weapon of Offence)",
        brandOrMake: "Desi Iron Rod 3ft",
        description: "3 feet iron rod stained with blood",
        quantity: 1,
        estimatedValue: 200,
        status: "SEIZED",
      },
    ],
    briefFacts: "Fatal quarrel over vehicle overtaking leading to head trauma with iron rod. Accused arrested on spot.",
    assignedIoName: "Inspector Rakesh Sharma",
    assignedIoRank: "Inspector (SHO)",
    assignedIoBeltNumber: "SHO/890",
    assignedIoPhone: "9812000100",
    assignedAt: "2026-10-15 10:00",
    daysPending: 1,
    registeredBy: "HC Ramesh Kumar (HC/405)",
    actionTakenData: {
      investigationOfficerName: "Insp. Rakesh Sharma",
      investigationOfficerRank: "Inspector",
      investigationOfficerMobile: "9812000100",
    },
    createdAt: "2026-10-15T09:30:00Z",
    updatedAt: "2026-10-15T11:00:00Z",
  },
  {
    id: "fir-pnp-006",
    firNumber: "FIR/0002/2026",
    firYear: 2026,
    firDate: "2026-10-15",
    firTime: "16:40",
    policeStation: "PS Chandni Bagh Panipat",
    district: "Panipat",
    state: "Haryana",
    sourceComplaintId: "comp-pnp-006",
    sourceComplaintNumber: "COMP/2026/01552",
    cctnsFirNumber: "HR060260002",
    cctnsSyncStatus: "SYNCED",
    category: "NARCOTICS_NDPS",
    categoryDisplay: "NDPS Act",
    priority: "HIGH",
    status: "UNDER_INVESTIGATION",
    mainStatus: "Under Investigation",
    actsAndSections: "Sec 21(b), 61, 85 NDPS Act, 1985",
    majorAct: "Narcotic Drugs and Psychotropic Substances Act, 1985",
    incidentDateFrom: "2026-10-15",
    incidentDateTo: "2026-10-15",
    incidentTimeFrom: "15:30",
    incidentTimeTo: "16:15",
    incidentPlace: "Near Railway Crossing, Chandni Bagh, Panipat",
    distanceFromPs: "1.2 KM East",
    incidentDetails: "Patrolling team intercepted pedestrian carrying 110 grams smack/heroin in polythene pouch.",
    gdEntryNumber: "GD-0019/15-10-2026",
    gdEntryDateTime: "2026-10-15 16:00",
    typeOfInformation: "WRITTEN",
    complainantName: "ASI Dharamveer Singh",
    complainantMobile: "9812300445",
    complainantAddress: "PS Chandni Bagh Panipat",
    complainantGender: "MALE",
    complainantCity: "Panipat",
    complainantDistrict: "Panipat",
    isAccusedKnown: true,
    accusedList: [
      {
        id: "acc-pnp-06",
        name: "Mukesh",
        alias: "Billa",
        age: 29,
        fatherName: "Satish Chand",
        address: "Tehsil Camp, Panipat",
        isArrested: true,
        custodyStatus: "ARRESTED",
      },
    ],
    propertiesList: [
      {
        id: "prop-pnp-06",
        propertyCategory: "DRUGS_NARCOTICS",
        propertyType: "Narcotics - Smack (Heroin)",
        brandOrMake: "High Purity Brown Sugar",
        description: "110 grams smack recovered in polythene packet",
        quantity: "110 Grams",
        estimatedValue: 1100000,
        status: "SEIZED",
      },
    ],
    totalPropertyEstimatedValue: 1100000,
    briefFacts: "Recovery of 110 grams commercial smack during naka checking. Accused in police custody.",
    assignedIoName: "SI Sandeep Kumar",
    assignedIoRank: "Sub Inspector",
    daysPending: 1,
    registeredBy: "ASI Dharamveer Singh (889/PNP)",
    actionTakenData: {
      investigationOfficerName: "SI Sandeep Kumar",
      investigationOfficerRank: "Sub Inspector",
      investigationOfficerMobile: "9812300445",
    },
    assignedIoPhone: "9812300445",
    createdAt: "2026-10-15T16:40:00Z",
    updatedAt: "2026-10-15T18:00:00Z",
  },
  {
    id: "fir-001",
    firNumber: "FIR/0002/2026",
    firYear: 2026,
    firDate: "2026-03-28",
    firTime: "11:30",
    policeStation: "PS City Panipat",
    district: "Panipat",
    state: "Haryana",
    sourceComplaintId: "comp-001",
    sourceComplaintNumber: "COMP/2026/00142",
    cctnsFirNumber: "HR060260002",
    cctnsSyncStatus: "SYNCED",
    category: "PROPERTY_THEFT_BURGLARY",
    categoryDisplay: "Theft / Burglary",
    priority: "URGENT",
    status: "UNDER_INVESTIGATION",
    mainStatus: "Under Investigation",
    actsAndSections: "Sec 303(2), 305 Bharatiya Nyaya Sanhita, 2023 (BNS)",
    majorAct: "Bharatiya Nyaya Sanhita, 2023",
    bnsSections: ["303(2)", "305"],
    incidentDateFrom: "2026-03-27",
    incidentDateTo: "2026-03-27",
    incidentTimeFrom: "21:00",
    incidentTimeTo: "23:30",
    incidentPlace: "Sector 11-12 Commercial Complex, Panipat",
    incidentLandmark: "Opposite Skylark Tourist Complex, Panipat",
    distanceFromPs: "1.5 KM East",
    beatNumber: "Beat No. 4",
    incidentDetails: "Complainant reported breaking of car window pane and theft of laptop bag containing HP Pavilion laptop, office identity card, and cash worth Rs. 24,000/- while parked outside market complex.",
    gdEntryNumber: "GD-0042/28-03-2026",
    gdEntryDateTime: "2026-03-28 10:45",
    typeOfInformation: "WRITTEN",
    complainantName: "Vikas Sharma",
    complainantFatherSpouse: "Sh. Ramesh Sharma",
    complainantGender: "MALE",
    complainantAge: 34,
    complainantMobile: "9812345670",
    complainantAddress: "H.No. 402, Sector 11, Panipat",
    complainantCity: "Panipat",
    complainantDistrict: "Panipat",
    complainantState: "Haryana",
    isAccusedKnown: false,
    accusedList: [
      {
        id: "acc-001",
        name: "Unknown suspect (Motorcycle helmet worn)",
        isIdentified: false,
        physicalDescription: "Medium build, black jacket, rider on Pulsar bike without number plate",
      },
    ],
    stolenPropertyDetails: "HP Laptop Serial HP-8849201, Black leather bag, Rs 24,000 currency notes",
    totalPropertyEstimatedValue: 94000,
    registeredBy: "Inspector Rajesh Kumar (SHO)",
    assignedIoId: "eo-002",
    assignedIoName: "SI Neeraj Kumar",
    assignedIoRank: "Sub Inspector",
    assignedIoBeltNumber: "SI/6641",
    assignedIoPhone: "9812300002",
    assignedAt: "2026-03-28 12:00",
    assignedDirections: "Examine CCTV footage from Sector 29 market gate, trace motorcycle route, and record statement of valet security guard.",
    daysPending: 10,
    caseDiaries: [
      {
        id: "cd-001",
        date: "2026-03-28",
        time: "14:00",
        officer: "SI Neeraj Kumar",
        officerRole: "INVESTIGATING_OFFICER",
        summary: "Zimni No. 1: Crime scene inspection and Site Plan preparation",
        details: "Visited Sector 29 parking lot. Prepared site plan (Naksha Mauka). CCTV footage requested from Commercial Complex Management.",
        isAutoGenerated: false,
      },
      {
        id: "cd-002",
        date: "2026-03-30",
        time: "16:30",
        officer: "SI Neeraj Kumar",
        officerRole: "INVESTIGATING_OFFICER",
        summary: "Zimni No. 2: CCTV footage retrieved and analyzed",
        details: "Footage from Camera 3 shows two youths on black Pulsar motorcycle stopping near complainant car at 22:18 hrs. Route leads towards Galleria road.",
        isAutoGenerated: false,
      },
    ],
    documents: [
      {
        id: "doc-001",
        title: "Original Written Complaint / Tehreer",
        fileName: "tehreer_fir_0002_2026.pdf",
        category: "COMPLAINT_COPY",
        uploadedBy: "Inspector Rajesh Kumar",
        uploadedAt: "2026-03-28 11:35",
      },
      {
        id: "doc-002",
        title: "Crime Scene Inspection & Site Plan (Naksha Mauka)",
        fileName: "site_plan_sector29.pdf",
        category: "FIELD_REPORT",
        uploadedBy: "SI Neeraj Kumar",
        uploadedAt: "2026-03-28 17:00",
      },
    ],
    timeline: [
      {
        id: "tl-001",
        date: "2026-03-28 11:30",
        title: "FIR Registered",
        description: "FIR No. FIR/0002/2026 registered under Section 303(2), 305 BNS.",
        actor: "Inspector Rajesh Kumar (SHO)",
        stage: "REGISTERED",
      },
      {
        id: "tl-002",
        date: "2026-03-28 12:00",
        title: "IO Assigned",
        description: "Investigation assigned to SI Neeraj Kumar.",
        actor: "Inspector Rajesh Kumar (SHO)",
        stage: "ASSIGNED",
      },
      {
        id: "tl-003",
        date: "2026-03-28 14:00",
        title: "Zimni No. 1 Recorded",
        description: "Crime scene inspection conducted and site plan prepared.",
        actor: "SI Neeraj Kumar (IO)",
        stage: "FIELD_ENQUIRY",
      },
    ],
    auditTrail: [
      {
        id: "aud-001",
        timestamp: "2026-03-28 11:30",
        action: "FIR_REGISTERED",
        officerName: "Inspector Rajesh Kumar",
        role: "SHO",
        details: "Registered FIR from Complaint COMP/2026/00142",
      },
    ],
    createdAt: "2026-03-28T11:30:00Z",
    updatedAt: "2026-03-30T16:30:00Z",
  },
  {
    id: "fir-002",
    firNumber: "FIR/0003/2026",
    firYear: 2026,
    firDate: "2026-03-31",
    firTime: "15:45",
    policeStation: "PS City Panipat",
    district: "Panipat",
    state: "Haryana",
    cctnsFirNumber: "HR060260003",
    cctnsSyncStatus: "SYNCED",
    category: "CYBER_CRIME",
    categoryDisplay: "Cyber / Financial Fraud",
    priority: "URGENT",
    status: "UNDER_INVESTIGATION",
    mainStatus: "Under Investigation",
    actsAndSections: "Sec 318(4), 316(2) BNS r/w Sec 66D IT Act",
    majorAct: "Bharatiya Nyaya Sanhita, 2023 & IT Act",
    bnsSections: ["318(4)", "316(2)"],
    specialActs: "Section 66D Information Technology Act, 2000",
    incidentDateFrom: "2026-03-30",
    incidentPlace: "Online - Cyber Space / ICICI Netbanking",
    incidentDetails: "Fraudulent OTP withdrawal amounting to Rs. 1,45,000/- through fake electricity bill payment link sent via WhatsApp.",
    gdEntryNumber: "GD-0078/31-03-2026",
    gdEntryDateTime: "2026-03-31 14:15",
    typeOfInformation: "E_COMPLAINT",
    complainantName: "Anita Verma",
    complainantFatherSpouse: "W/o Sunita Verma",
    complainantGender: "FEMALE",
    complainantAge: 42,
    complainantMobile: "9876543210",
    complainantAddress: "H.No. 12B, Model Town, Panipat",
    complainantCity: "Panipat",
    complainantDistrict: "Panipat",
    complainantState: "Haryana",
    isAccusedKnown: false,
    accusedList: [
      {
        id: "acc-002",
        name: "Beneficiary Account Holder - Unknown Cyber Gang",
        isIdentified: false,
        phone: "7011982341",
      },
    ],
    stolenPropertyDetails: "Defrauded amount: Rs. 1,45,000/- transferred to A/C 99882211003",
    totalPropertyEstimatedValue: 145000,
    registeredBy: "Inspector Rajesh Kumar (SHO)",
    assignedIoId: "eo_1",
    assignedIoName: "SI Vikram Singh",
    assignedIoRank: "Sub Inspector",
    assignedIoBeltNumber: "742/PNP",
    assignedIoPhone: "9812034567",
    assignedAt: "2026-03-31 16:30",
    assignedDirections: "Liaise with Cyber Cell Panipat, send freezing notices under Sec 106 BNSS to Canara Bank and payment gateway.",
    daysPending: 7,
    caseDiaries: [
      {
        id: "cd-003",
        date: "2026-03-31",
        time: "17:00",
        officer: "ASI Vikram Singh",
        officerRole: "INVESTIGATING_OFFICER",
        summary: "Zimni No. 1: Bank Account Freezing Notice Dispatched",
        details: "Notice dispatched to Nodal Officer, Canara Bank to debit freeze account 99882211003. Transaction hash sent to 1930 portal.",
        isAutoGenerated: false,
      },
    ],
    documents: [],
    timeline: [
      {
        id: "tl-004",
        date: "2026-03-31 15:45",
        title: "FIR Registered",
        description: "Registered under 318(4) BNS & 66D IT Act.",
        actor: "Inspector Rajesh Kumar (SHO)",
        stage: "REGISTERED",
      },
    ],
    createdAt: "2026-03-31T15:45:00Z",
    updatedAt: "2026-03-31T17:00:00Z",
  },
  {
    id: "fir-125",
    firNumber: "FIR/0001/2026",
    firYear: 2026,
    firDate: "2026-04-02",
    firTime: "14:15",
    policeStation: "PS Model Town Panipat",
    district: "Panipat",
    state: "Haryana",
    sourceComplaintId: "comp-125",
    sourceComplaintNumber: "COMP/2026/00389",
    cctnsFirNumber: "HR060260001",
    cctnsSyncStatus: "SYNCED",
    category: "PROPERTY_THEFT_BURGLARY",
    categoryDisplay: "Theft / House Trespass",
    priority: "URGENT",
    status: "UNDER_INVESTIGATION",
    mainStatus: "Under Investigation",
    actsAndSections: "Sec 303(2), 305, 331(4) BNS",
    majorAct: "Bharatiya Nyaya Sanhita, 2023",
    bnsSections: ["303(2)", "305", "331(4)"],
    incidentDateFrom: "2026-04-01",
    incidentDateTo: "2026-04-01",
    incidentTimeFrom: "22:00",
    incidentTimeTo: "23:45",
    incidentPlace: "Insar Market Complex, Panipat",
    incidentLandmark: "Near Old Bus Stand Panipat",
    distanceFromPs: "2.0 KM West",
    beatNumber: "Beat No. 2",
    incidentDetails: "Theft of commercial property and cash from electronic shop in Insar Bazar Panipat. Accused Anil Kumar intercepted with stolen items.",
    gdEntryNumber: "GD-0038/02-04-2026",
    gdEntryDateTime: "2026-04-02 14:00",
    typeOfInformation: "WRITTEN",
    complainantName: "Rajesh Verma",
    complainantFatherSpouse: "Sh. Om Prakash Verma",
    complainantGender: "MALE",
    complainantAge: 42,
    complainantMobile: "9812988123",
    complainantAddress: "Shop No. 18, Insar Bazar, Panipat",
    complainantCity: "Panipat",
    complainantDistrict: "Panipat",
    complainantState: "Haryana",
    isAccusedKnown: true,
    accusedList: [
      {
        id: "acc-125-01",
        name: "Anil Kumar",
        fatherName: "Sh. Ramesh Kumar",
        address: "H.No. 142, Tehsil Camp, Panipat",
        isIdentified: true,
        physicalDescription: "Male, Age approx 32, Height 5ft 8in, scar on left eyebrow, dark complexion",
      },
    ],
    stolenPropertyDetails: "Cash Rs. 35,000/- and Samsung Galaxy Tab",
    totalPropertyEstimatedValue: 65000,
    registeredBy: "Inspector Surender Singh (SHO)",
    assignedIoId: "eo-001",
    assignedIoName: "SI Neeraj Kumar",
    assignedIoRank: "Sub Inspector",
    assignedIoBeltNumber: "SI/8821",
    assignedIoPhone: "9812300001",
    assignedAt: "2026-04-02 14:30",
    assignedDirections: "Conduct spot inspection, record recovery memo, and effect formal arrest as per Section 47 & 48 BNSS.",
    daysPending: 4,
    caseDiaries: [
      {
        id: "cd-125-01",
        date: "2026-04-02",
        time: "15:00",
        officer: "SI Neeraj Kumar",
        officerRole: "INVESTIGATING_OFFICER",
        summary: "Zimni No. 1: Crime spot inspection and recovery of stolen items",
        details: "Inspected shop premises at Insar Bazar Panipat. Prepared Naksha Mauka. Accused Anil Kumar intercepted at Insar Bazar market Panipat.",
        isAutoGenerated: false,
      },
    ],
    documents: [
      {
        id: "doc-125-01",
        title: "Tehreer / Original Complaint Copy",
        fileName: "tehreer_fir_125_2026.pdf",
        category: "COMPLAINT_COPY",
        uploadedBy: "Inspector Surender Singh",
        uploadedAt: "2026-04-02 14:20",
      },
    ],
    timeline: [
      {
        id: "tl-125-01",
        date: "2026-04-02 14:15",
        title: "FIR Registered",
        description: "FIR No. FIR/0001/2026 registered under Section 303(2), 305, 331(4) BNS.",
        actor: "Inspector Surender Singh (SHO)",
        stage: "REGISTERED",
      },
      {
        id: "tl-125-02",
        date: "2026-04-02 14:30",
        title: "IO Assigned",
        description: "Investigation assigned to SI Neeraj Kumar.",
        actor: "Inspector Surender Singh (SHO)",
        stage: "ASSIGNED",
      },
    ],
    auditTrail: [
      {
        id: "aud-125-01",
        timestamp: "2026-04-02 14:15",
        action: "FIR Registered",
        officerName: "Inspector Surender Singh",
        role: "SHO",
        details: "FIR/0001/2026 created successfully.",
      },
    ],
    createdAt: "2026-04-02T14:15:00Z",
    updatedAt: "2026-04-02T14:30:00Z",
  },
  {
    id: "fir-003",
    firNumber: "FIR/0001/2026",
    firYear: 2026,
    firDate: "2026-02-15",
    firTime: "10:00",
    policeStation: "PS City Panipat",
    district: "Panipat",
    state: "Haryana",
    category: "PHYSICAL_ASSAULT_AFFRAY",
    categoryDisplay: "Physical Assault / Hurt",
    priority: "ROUTINE",
    status: "CHARGESHEET_FILED",
    mainStatus: "Chargesheet Filed",
    actsAndSections: "Sec 115(2), 351(2), 352 BNS",
    majorAct: "Bharatiya Nyaya Sanhita, 2023",
    bnsSections: ["115(2)", "351(2)", "352"],
    incidentDateFrom: "2026-02-14",
    incidentPlace: "Main Market, Panipat",
    incidentDetails: "Altercation between shopkeepers over shop signage leading to simple hurt.",
    gdEntryNumber: "GD-0012/15-02-2026",
    gdEntryDateTime: "2026-02-15 09:30",
    typeOfInformation: "WRITTEN",
    complainantName: "Deepak Yadav",
    complainantFatherSpouse: "Sh. Dharamvir Yadav",
    complainantGender: "MALE",
    complainantAge: 29,
    complainantMobile: "9812998877",
    complainantAddress: "Shop 14, Main Bazar, Panipat",
    complainantCity: "Panipat",
    complainantDistrict: "Panipat",
    complainantState: "Haryana",
    isAccusedKnown: true,
    accusedList: [
      {
        id: "acc-003",
        name: "Satish Kumar",
        isIdentified: true,
        address: "Shop 15, Main Bazar, Panipat",
        phone: "9812991122",
      },
    ],
    registeredBy: "Inspector Rajesh Kumar (SHO)",
    assignedIoId: "eo-001",
    assignedIoName: "SI Amit Hooda",
    assignedIoRank: "Sub Inspector",
    daysPending: 0,
    trackingState: "COMPLETED",
    finalFormType: "CHARGESHEET",
    finalFormNumber: "CS/2026/0012",
    finalFormDate: "2026-03-25",
    courtName: "Court of CJM, Panipat",
    shoDecision: "APPROVE",
    shoDecisionAt: "2026-03-24",
    shoDecisionBy: "Inspector Rajesh Kumar",
    createdAt: "2026-02-15T10:00:00Z",
    updatedAt: "2026-03-25T11:00:00Z",
  },
];

let serverManaged=false;
let firsStore: FIRItem[] = [];
let storageSnapshot: string | null = null;
const firListeners: (() => void)[] = [];

function notifyListeners() {
  firListeners.forEach((fn) => {
    try {
      fn();
    } catch (e) {
      console.error("Error in FIR listener:", e);
    }
  });
}

function sanitizeFirForStorage(fir: FIRItem): FIRItem {
  return {
    ...fir,
    documents: fir.documents?.map((d) => {
      // If dataUrl is large (e.g. over 15KB), do not choke localStorage quota
      if (d.dataUrl && d.dataUrl.length > 15000) {
        return {
          ...d,
          dataUrl: undefined, // Preserved in evidenceBlobStore
        };
      }
      return d;
    }),
    caseDiaries: fir.caseDiaries?.map((c) => {
      if (c.dataUrl && c.dataUrl.length > 15000) {
        return {
          ...c,
          dataUrl: undefined,
        };
      }
      return c;
    }),
  };
}

function loadFirsFromStorage(): FIRItem[] {
  let list: FIRItem[] = [];
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      const raw = window.localStorage.getItem(FIRS_STORAGE_KEY);
      storageSnapshot = raw;
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          list = parsed;
        }
      }
    } catch (e) {
      console.warn("Failed to read FIRs from localStorage:", e);
    }
  }

  if (serverManaged) return list;
  if (list.length === 0) {
    list = [...INITIAL_MOCK_FIRS];
  } else {
    // Ensure all seed FIRs (including Panipat audit records) exist in list
    INITIAL_MOCK_FIRS.forEach((seedFir) => {
      if (!list.some((existing) => existing.id === seedFir.id)) {
        list.push(seedFir);
      }
    });
  }

  // Rehydrate crimeDetailsData and document for any FIR that has a dedicated backup
  if (typeof window !== "undefined" && window.localStorage) {
    list = list.map((fir) => {
      try {
        const backupKey = `haryana_police_cms_fir_crimedetails_${fir.id}`;
        const backupRaw = window.localStorage.getItem(backupKey);
        if (backupRaw) {
          const parsedCrime = JSON.parse(backupRaw);
          if (parsedCrime) {
            const hasDoc = fir.documents?.some(
              (d) => d.category === "CCTNS_IIF2" || d.title.includes("IIF-II") || d.title.includes("Crime Detail")
            );
            const crimeDoc: FIRDocumentItem = hasDoc
              ? (fir.documents?.find((d) => d.category === "CCTNS_IIF2" || d.title.includes("IIF-II")) as FIRDocumentItem)
              : {
                  id: `doc-crime-detail-${fir.id}`,
                  title: `Crime Detail Form (IIF-II) / अपराध विवरण प्रपत्र - ${fir.cctnsFirNumber || fir.firNumber}`,
                  fileName: `Crime_Detail_IIF_II_${fir.firNumber.replace(/[\/\s]/g, "_")}.html`,
                  category: "CCTNS_IIF2",
                  uploadedBy: parsedCrime.submittedBy || "Investigating Officer",
                  uploadedAt: parsedCrime.submittedAt?.replace("T", " ").slice(0, 16) || new Date().toISOString().replace("T", " ").slice(0, 16),
                  fileSize: "68.5 KB",
                };

            const existingDocs = (fir.documents || []).filter(
              (d) => !d.title.toLowerCase().includes("crime detail") && d.category !== "CCTNS_IIF2"
            );

            return {
              ...fir,
              trackingState: fir.trackingState || getAuthoritativeTrackingState(fir),
              crimeDetailsFilled: true,
              crimeDetailsData: fir.crimeDetailsData || parsedCrime,
              crimeDetailsFilledAt: fir.crimeDetailsFilledAt || parsedCrime.submittedAt || new Date().toISOString(),
              crimeDetailsFilledBy: fir.crimeDetailsFilledBy || parsedCrime.submittedBy || "Investigating Officer",
              documents: hasDoc ? fir.documents : [crimeDoc, ...existingDocs],
            };
          }
        }
      } catch (_) {}
      return fir;
    });
  }

  return list;
}

function saveFirsToStorage(items: FIRItem[]) {
  if(serverManaged){try{window.localStorage.setItem(FIRS_STORAGE_KEY,JSON.stringify(items));storageSnapshot=window.localStorage.getItem(FIRS_STORAGE_KEY);}catch{/* Server is authoritative; keep full data in memory if browser quota is exhausted. */}return;}
  if (typeof window !== "undefined" && window.localStorage) {
    if (window.localStorage.getItem(FIRS_STORAGE_KEY) !== storageSnapshot) {
      firsStore = loadFirsFromStorage();
      notifyListeners();
      throw new Error('FIR data changed in another tab. Review the refreshed record and retry.');
    }
    try {
      const sanitized = items.map(sanitizeFirForStorage);
      window.localStorage.setItem(FIRS_STORAGE_KEY, JSON.stringify(sanitized));
      storageSnapshot = window.localStorage.getItem(FIRS_STORAGE_KEY);
    } catch (e) {
      console.warn("Storage quota exceeded in firService, attempting fallback strip:", e);
      try {
        const stripped = items.map((f) => ({
          ...f,
          documents: f.documents?.map((d) => ({ ...d, dataUrl: undefined })),
          caseDiaries: f.caseDiaries?.map((c) => ({ ...c, dataUrl: undefined })),
        }));
        window.localStorage.setItem(FIRS_STORAGE_KEY, JSON.stringify(stripped));
        storageSnapshot = window.localStorage.getItem(FIRS_STORAGE_KEY);
      } catch (err2) {
        throw new Error('FIR save failed: browser storage is full or unavailable. Free storage and retry; changes have not been saved.');
      }
    }
  }
}

if (typeof window !== "undefined") {
  firsStore = loadFirsFromStorage();
  window.addEventListener('storage', (event) => {
    if(serverManaged)return;
    if (event.key === FIRS_STORAGE_KEY || event.key === null) {
      firsStore = loadFirsFromStorage();
      notifyListeners();
    }
  });
} else {
  firsStore = [...INITIAL_MOCK_FIRS];
}

export const firService = {
  getLocalMigrationRecords():FIRItem[]{
    let local:FIRItem[]=[];try{const backup=window.localStorage.getItem(FIRS_STORAGE_KEY+':legacy-backup');const raw=backup || (!serverManaged?window.localStorage.getItem(FIRS_STORAGE_KEY):null);if(raw){local=JSON.parse(raw);if(!backup)window.localStorage.setItem(FIRS_STORAGE_KEY+':legacy-backup',raw);}}catch{/* Backup is best effort; migration never deletes the server's records. */}
    return local.filter(record=>!record.persistenceVersion && !INITIAL_MOCK_FIRS.some(seed=>seed.id===record.id));
  },
  replaceServerRecords(records:FIRItem[]){serverManaged=true;firsStore=structuredClone(records);saveFirsToStorage(firsStore);notifyListeners();},
  subscribe(listener: () => void): () => void {
    firListeners.push(listener);
    return () => {
      const idx = firListeners.indexOf(listener);
      if (idx > -1) firListeners.splice(idx, 1);
    };
  },

  getFirs(): FIRItem[] {
    return this.getAllFirs();
  },

  getAllFirs(): FIRItem[] {
    if (!serverManaged && firsStore.length === 0) {
      firsStore = loadFirsFromStorage();
    }
    return [...firsStore].map((fir) => ({
      ...fir,
      trackingState: fir.trackingState || getAuthoritativeTrackingState(fir),
      mainStatus: getMainFIRStatus(fir),
      daysPending: firPendingDays(fir),
    }));
  },

  getFirById(id: string): FIRItem | undefined {
    const list = this.getAllFirs();
    const exact = list.find((f) => f.id === id);
    if (exact) return exact;
    const matches = list.filter((f) => f.firNumber === id);
    if (matches.length > 1) throw new Error('Ambiguous FIR number. Select the FIR by its unique ID.');
    return matches[0];
  },

  getFirBySourceComplaintId(complaintId: string): FIRItem | undefined {
    const list = this.getAllFirs();
    return list.find((f) => f.sourceComplaintId === complaintId);
  },

  generateNextFirNumber(policeStation?: string, firDate?: string): { firNumber: string; firYear: number } {
    let year = new Date().getFullYear();
    if (firDate) {
      const parsedYear = new Date(firDate).getFullYear();
      if (!isNaN(parsedYear) && parsedYear > 1900) {
        year = parsedYear;
      }
    }
    const list = this.getAllFirs();
    return {
      firNumber: nextFirNumber(list, year, policeStation),
      firYear: year,
    };
  },

  registerFir(input: Partial<FIRItem>): FIRItem {
    const retry=this.getAllFirs().find(f=>input.id && f.id===input.id || input.sourceComplaintId && f.sourceComplaintId===input.sourceComplaintId);
    if (retry) return retry;
    let { firNumber, firYear } = input.firNumber
      ? { firNumber: input.firNumber, firYear: input.firYear || new Date().getFullYear() }
      : this.generateNextFirNumber(input.policeStation, input.firDate);

    // Prevent duplicate FIR Number: if number already exists in this police station & year, generate a fresh sequential one
    const existingList = this.getAllFirs();
    const norm = (s?: string) => (s || '').trim().toLowerCase();
    const targetPs = norm(input.policeStation);
    if (existingList.some((f) => f.firNumber === firNumber && f.firYear === firYear && (!targetPs || norm(f.policeStation) === targetPs))) {
      const fresh = this.generateNextFirNumber(input.policeStation, input.firDate);
      firNumber = fresh.firNumber;
      firYear = fresh.firYear;
    }

    const now = new Date();
    const dateStr = now.toISOString().split("T")[0];
    const timeStr = now.toTimeString().slice(0, 5);

    const newFir: FIRItem = {
      id: input.id || `fir-${Date.now()}-${Math.random().toString(36).slice(2,10)}`,
      firNumber,
      firYear,
      firDate: input.firDate || dateStr,
      firTime: input.firTime || timeStr,
      policeStation: input.policeStation || "PS City Panipat",
      district: input.district || "Panipat",
      state: input.state || "Haryana",
      sourceComplaintId: input.sourceComplaintId,
      sourceComplaintSyncStatus: input.sourceComplaintId ? "PENDING" : undefined,
      sourceComplaintNumber: input.sourceComplaintNumber,
      cctnsFirNumber: input.cctnsFirNumber || "",
      cctnsSyncStatus: input.cctnsSyncStatus || "PENDING_SYNC",
      trackingState: input.trackingState || "PART_A_FRESH",
      category: input.category || "OTHER_GENERAL",
      categoryDisplay: input.categoryDisplay || "General Cognizable Crime",
      priority: input.priority || "URGENT",
      status: input.assignedIoId ? "UNDER_INVESTIGATION" : "UNDER_INVESTIGATION",
      actsAndSections: input.actsAndSections || "",
      majorAct: input.majorAct || "",
      bnsSections: input.bnsSections || [],
      specialActs: input.specialActs,
      actsAndSectionsList: input.actsAndSectionsList || [],
      majorMinorHeadsList: input.majorMinorHeadsList || [],
      isHeinousCrime: input.isHeinousCrime ?? false,
      isSensitiveFIR: input.isSensitiveFIR ?? false,
      incidentDateFrom: input.incidentDateFrom || dateStr,
      incidentDateTo: input.incidentDateTo,
      incidentTimeFrom: input.incidentTimeFrom,
      incidentTimeTo: input.incidentTimeTo,
      incidentDay: input.incidentDay,
      incidentTimePeriod: input.incidentTimePeriod,
      incidentPlace: input.incidentPlace || "",
      incidentLandmark: input.incidentLandmark,
      distanceFromPs: input.distanceFromPs,
      beatNumber: input.beatNumber,
      isPlaceOutsidePs: input.isPlaceOutsidePs ?? false,
      outsidePsDetails: input.outsidePsDetails,
      outsideDistrict: input.outsideDistrict,
      outsideState: input.outsideState,
      occurrencesList: input.occurrencesList || [],
      incidentDetails: input.incidentDetails || input.firContentText || "",
      firContentText: input.firContentText || input.incidentDetails || "",
      reasonsForDelay: input.reasonsForDelay,
      gdEntryNumber: input.gdEntryNumber,
      gdEntryDateTime: input.gdEntryDateTime,
      typeOfInformation: input.typeOfInformation || "WRITTEN",
      complainantName: input.complainantName || "Unknown Informant",
      complainantFatherSpouse: input.complainantFatherSpouse,
      complainantGender: input.complainantGender || "MALE",
      complainantAge: input.complainantAge,
      complainantMobile: input.complainantMobile || "",
      complainantAddress: input.complainantAddress || "",
      complainantCity: input.complainantCity || "Panipat",
      complainantDistrict: input.complainantDistrict || "Panipat",
      complainantState: input.complainantState || "Haryana",
      complainantMiddleName: input.complainantMiddleName,
      complainantLastName: input.complainantLastName,
      complainantUid: input.complainantUid,
      complainantMaritalStatus: input.complainantMaritalStatus,
      complainantLandline: input.complainantLandline,
      complainantEmail: input.complainantEmail,
      complainantRelationType: input.complainantRelationType,
      complainantRelativeName: input.complainantRelativeName,
      complainantRelativeAlias: input.complainantRelativeAlias,
      complainantSameAsVictim: input.complainantSameAsVictim,
      complainantDob: input.complainantDob,
      complainantYearOfBirth: input.complainantYearOfBirth,
      complainantAgeGroup: input.complainantAgeGroup,
      complainantAliasList: input.complainantAliasList || [],
      complainantPresentAddressSame: input.complainantPresentAddressSame ?? true,
      complainantPresentAddress: input.complainantPresentAddress,
      complainantHouseNo: input.complainantHouseNo,
      complainantStreet: input.complainantStreet,
      complainantColony: input.complainantColony,
      complainantTehsil: input.complainantTehsil,
      complainantPincode: input.complainantPincode,
      complainantOccupation: input.complainantOccupation,
      complainantNationality: input.complainantNationality || "Indian",
      complainantIdentifications: input.complainantIdentifications || [],
      complainantPassportIssueDate: input.complainantPassportIssueDate,
      complainantPassportIssuePlace: input.complainantPassportIssuePlace,
      isAccusedKnown: input.isAccusedKnown ?? false,
      accusedList: input.accusedList || [],
      victimsList: input.victimsList || [],
      propertiesList: input.propertiesList || [],
      stolenPropertyDetails: input.stolenPropertyDetails,
      totalPropertyEstimatedValue: input.totalPropertyEstimatedValue,
      hurtDetails: input.hurtDetails,
      actionTakenData: input.actionTakenData,
      signatureData: input.signatureData,
      firTagType: input.firTagType,
      departmentNotifications: input.departmentNotifications || [],
      uidbEntries: input.uidbEntries || [],
      inquestReportNo: input.inquestReportNo,
      courtDispatchDateTime: input.courtDispatchDateTime,
      registeredBy: input.registeredBy || "",
      assignedIoId: input.assignedIoId,
      assignedIoName: input.assignedIoName,
      assignedIoRank: input.assignedIoRank,
      assignedIoBeltNumber: input.assignedIoBeltNumber,
      assignedIoPhone: input.assignedIoPhone,
      assignedAt: input.assignedIoId ? `${dateStr} ${timeStr}` : undefined,
      assignedDirections: input.assignedDirections,
      daysPending: 0,
      caseDiaries: input.caseDiaries || [],
      documents: input.documents || [],
      timeline: [
        {
          id: `tl-${Date.now()}`,
          date: `${dateStr} ${timeStr}`,
          title: "FIR Registered",
          description: `FIR No. ${firNumber} registered under ${input.actsAndSections || "applicable BNS sections"}.`,
          actor: input.registeredBy || "SHO Sector 29",
          stage: "REGISTERED",
        },
        ...(input.timeline || []),
      ],
      auditTrail: [
        {
          id: `aud-${Date.now()}`,
          timestamp: `${dateStr} ${timeStr}`,
          action: "FIR_REGISTERED",
          officerName: input.registeredBy || "SHO Sector 29",
          role: "SHO",
          details: input.sourceComplaintNumber
            ? `Registered from Complaint #${input.sourceComplaintNumber}`
            : `Direct FIR Registered under Section 173 BNSS`,
        },
      ],
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    newFir.mainStatus = getMainFIRStatus(newFir);

    const nextStore = [newFir, ...firsStore];
    saveFirsToStorage(nextStore);
    firsStore = nextStore;


    notifyListeners();
    return newFir;
  },

  async synchronizeSourceComplaint(firId: string): Promise<FIRItem> {
    const fir=this.getFirById(firId);
    if (!fir) throw new Error("FIR not found.");
    if (!fir.sourceComplaintId) return fir;
    try {
      await ComplaintService.registerFir(fir.sourceComplaintId,fir.firNumber,fir.actsAndSections,fir.registeredBy,"SHO",fir.firDate);
      return this.updateFir(fir.id,{sourceComplaintSyncStatus:"SYNCED"})!;
    } catch(error) {
      this.updateFir(fir.id,{sourceComplaintSyncStatus:"ERROR"});
      throw new Error("FIR has been saved, but the source complaint could not be updated. Retry the same registration to synchronize it; do not create another FIR.");
    }
  },

  updateFir(firId: string, updates: Partial<FIRItem>): FIRItem | undefined {
    const resolved = this.getFirById(firId);
    const idx = firsStore.findIndex((f) => f.id === resolved?.id);
    if (idx === -1) return undefined;

    const current = firsStore[idx];
    const updated: FIRItem = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    updated.mainStatus = getMainFIRStatus(updated);

    const nextStore = firsStore.map((fir,index)=>index===idx?updated:fir);
    saveFirsToStorage(nextStore);
    firsStore = nextStore;
    notifyListeners();
    return updated;
  },

  saveLegalAnalysis(firId: string, legalAnalysis: LegalAnalysisReport): FIRItem | undefined {
    return this.updateFir(firId, { legalAnalysis });
  },

  saveCrimeDetails(firId: string, crimeDetailsData: any, filledBy: string, htmlContent?: string): FIRItem | undefined {
    const fir = this.getFirById(firId);
    if (!fir) return undefined;

    const docId = `doc-crime-detail-${Date.now()}`;
    const dataUrl = htmlContent
      ? "data:text/html;charset=utf-8," + encodeURIComponent(htmlContent)
      : undefined;

    const crimeDoc: FIRDocumentItem = {
      id: docId,
      title: `Crime Detail Form (IIF-II) / अपराध विवरण प्रपत्र - ${fir.cctnsFirNumber || fir.firNumber}`,
      fileName: `Crime_Detail_IIF_II_${fir.firNumber.replace(/[\/\s]/g, "_")}.html`,
      category: "CCTNS_IIF2",
      uploadedBy: filledBy,
      uploadedAt: new Date().toISOString().replace("T", " ").slice(0, 16),
      fileSize: htmlContent ? `${(htmlContent.length / 1024).toFixed(1)} KB` : "68.5 KB",
      dataUrl,
    };

    // Store full-fidelity HTML in persistent IndexedDB evidenceBlobStore
    if (typeof window !== "undefined" && dataUrl) {
      try {
        evidenceBlobStore.put(docId, dataUrl, {
          fileName: crimeDoc.fileName,
          mimeType: "text/html",
        });
        evidenceBlobStore.put(crimeDoc.fileName, dataUrl, {
          fileName: crimeDoc.fileName,
          mimeType: "text/html",
        });
        evidenceBlobStore.put(`crime_details_${firId}`, dataUrl, {
          fileName: crimeDoc.fileName,
          mimeType: "text/html",
        });
      } catch (err) {
        console.warn("Failed to store crime details doc in evidenceBlobStore:", err);
      }
    }

    // Always persist to dedicated localStorage backup key to guarantee 100% persistence on page refresh
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        window.localStorage.setItem(
          `haryana_police_cms_fir_crimedetails_${firId}`,
          JSON.stringify(crimeDetailsData)
        );
      } catch (err) {
        console.warn("Failed to backup crime details to dedicated key:", err);
      }
    }

    const existingDocs = fir.documents || [];
    const filteredDocs = existingDocs.filter(
      (d) => !d.title.toLowerCase().includes("crime detail") && d.category !== "CCTNS_IIF2"
    );

    return this.updateFir(firId, {
      ...(Array.isArray(crimeDetailsData?.propertyOfInterest?.properties)?{propertiesList:crimeDetailsData.propertyOfInterest.properties.map((p:any)=>({...(fir.propertiesList?.find(old=>old.id===p.id) || {}),id:p.id,propertyCategory:p.category || '',propertyType:p.propertyType || p.category || '',description:p.description || '',estimatedValue:p.estimatedValue,status:p.status || undefined,recoveredAt:p.recoveredAt || undefined}))}:{}),
      crimeDetailsFilled: true,
      crimeDetailsData,
      crimeDetailsFilledAt: new Date().toISOString(),
      crimeDetailsFilledBy: filledBy,
      documents: [crimeDoc, ...filteredDocs],
    });
  },


  /**
   * Issues an initial or supplementary challan for an active case (PART_A_FRESH, PART_B_PARTIAL, or PART_B_REOPEN).
   * Moves state to PART_B_UNDER_CHECKING.
   */
  issueChallan(params: {
    firId: string;
    challanMode: ChallanMode;
    courtName: string;
    issuedBy: string;
    issuedByRank?: string;
    briefFacts?: string;
    reportId?: string;
  }): FIRItem | undefined {
    const fir = this.getFirById(params.firId);
    if (!fir) return undefined;

    // Concurrency / Idempotency check: if pending challan with same reportId or issued in last 2 seconds
    if (fir.pendingChallanId) {
      const existingPending = fir.challanRecords?.find((c) => c.id === fir.pendingChallanId && !c.submittedToCourt);
      if (existingPending && Date.now() - Number(existingPending.id.replace("ch-", "")) < 2000) {
        return fir;
      }
    }

    const now = new Date();
    const dateStr = now.toISOString().split("T")[0];
    const timeStr = now.toTimeString().slice(0, 5);

    // Initial vs Supplementary:
    // Reopening a case previously closed without a challan must NOT fabricate an earlier challan.
    // If it has at least one previous court-submitted challan, this is SUPPLEMENTARY; otherwise INITIAL.
    const hasPreviousSubmittedChallan = Boolean(
      fir.challanRecords && fir.challanRecords.some((c) => c.submittedToCourt)
    );
    const challanType: ChallanType = hasPreviousSubmittedChallan ? "SUPPLEMENTARY" : "INITIAL";

    const challanNum = `${challanType === "INITIAL" ? "CS" : "SUPP-CS"}/${fir.firYear}/${Date.now().toString().slice(-4)}`;

    const challanRec: FIRChallanRecord = {
      id: "ch-" + Date.now(),
      challanNumber: challanNum,
      challanType,
      challanMode: params.challanMode,
      issuedAt: dateStr + " " + timeStr,
      issuedBy: params.issuedBy,
      issuedByRank: params.issuedByRank,
      courtName: params.courtName,
      briefFacts: params.briefFacts,
      reportId: params.reportId,
      submittedToCourt: false,
    };

    const timelineItem: FIRTimelineEvent = {
      id: "tl-" + Date.now(),
      date: dateStr + " " + timeStr,
      title: `${challanType} Challan Issued (${params.challanMode} Mode)`,
      description: `Challan No. ${challanNum} issued for submission before ${params.courtName}. Status moved to Under checking.`,
      actor: params.issuedBy,
      stage: "FINAL_REPORT",
    };

    const auditItem: FIRAuditRecord = {
      id: "aud-" + Date.now(),
      timestamp: dateStr + " " + timeStr,
      action: "CHALLAN_ISSUED",
      officerName: params.issuedBy,
      role: params.issuedByRank || "IO",
      details: `Issued ${challanType} challan ${challanNum} in ${params.challanMode} mode. Moved to Part B -> Under checking.`,
    };

    return this.updateFir(params.firId, {
      trackingState: "PART_B_UNDER_CHECKING",
      pendingChallanId: challanRec.id,
      finalFormNumber: challanNum,
      finalFormDate: dateStr,
      courtName: params.courtName,
      challanRecords: [challanRec, ...(fir.challanRecords || [])],
      timeline: [timelineItem, ...(fir.timeline || [])],
      auditTrail: [auditItem, ...(fir.auditTrail || [])],
    });
  },

  /**
   * Records court submission for an issued challan (Under checking -> Complete cases OR Partial).
   * - Complete mode + court submission -> COMPLETED
   * - Partial mode + court submission -> PART_B_PARTIAL
   */
  recordCourtSubmission(params: {
    firId: string;
    challanId?: string;
    submittedBy: string;
    courtReceiptNo?: string;
    remarks?: string;
  }): FIRItem | undefined {
    const fir = this.getFirById(params.firId);
    if (!fir) return undefined;

    const currentTracking = getAuthoritativeTrackingState(fir);
    if (currentTracking !== "PART_B_UNDER_CHECKING") {
      console.warn("Cannot record court submission for FIR not in PART_B_UNDER_CHECKING:", fir.firNumber);
      return fir;
    }

    const targetChallanId = params.challanId || fir.pendingChallanId;
    const records = [...(fir.challanRecords || [])];
    const chIdx = targetChallanId ? records.findIndex((c) => c.id === targetChallanId) : 0;
    const challan = records[chIdx];

    if (!challan) {
      console.warn("No pending challan record found to submit for FIR:", fir.firNumber);
      return fir;
    }

    // Idempotency: if already marked submitted, return
    if (challan.submittedToCourt) {
      return fir;
    }

    const now = new Date();
    const dateStr = now.toISOString().split("T")[0];
    const timeStr = now.toTimeString().slice(0, 5);

    challan.submittedToCourt = true;
    challan.courtSubmittedAt = dateStr + " " + timeStr;
    challan.courtSubmittedBy = params.submittedBy;
    challan.courtReceiptNo = params.courtReceiptNo;

    // Rule 4:
    // - Complete mode + court submission -> Complete cases (COMPLETED)
    // - Partial mode + court submission -> Part B -> Partial (PART_B_PARTIAL)
    const nextState: FIRTrackingState = challan.challanMode === "COMPLETE" ? "COMPLETED" : "PART_B_PARTIAL";

    const completionHistory = [...(fir.completionHistory || [])];
    if (nextState === "COMPLETED") {
      completionHistory.unshift({
        id: "comp-" + Date.now(),
        completedAt: dateStr + " " + timeStr,
        completedBy: params.submittedBy,
        completionType: "CHARGESHEET",
        courtName: challan.courtName,
        referenceNumber: challan.challanNumber,
        summary: `Challan ${challan.challanNumber} submitted to ${challan.courtName} (Receipt: ${params.courtReceiptNo || "N/A"})`,
      });
    }

    const timelineItem: FIRTimelineEvent = {
      id: "tl-" + Date.now(),
      date: dateStr + " " + timeStr,
      title: `Court Submission Recorded (${challan.challanMode} Mode)`,
      description: `Challan ${challan.challanNumber} submitted to ${challan.courtName}. Case moved to ${nextState === "COMPLETED" ? "Complete cases" : "Part B -> Partial"}.`,
      actor: params.submittedBy,
      stage: "FINAL_REPORT",
    };

    const auditItem: FIRAuditRecord = {
      id: "aud-" + Date.now(),
      timestamp: dateStr + " " + timeStr,
      action: "COURT_SUBMISSION_RECORDED",
      officerName: params.submittedBy,
      role: "MHC",
      details: `Recorded court submission of ${challan.challanNumber} (${challan.challanMode}). Tracking state -> ${nextState}.`,
    };

    return this.updateFir(params.firId, {
      trackingState: nextState,
      pendingChallanId: undefined, // Clear pending
      status: nextState === "COMPLETED" ? "CHARGESHEET_FILED" : "UNDER_INVESTIGATION",
      challanRecords: records,
      completionHistory,
      timeline: [timelineItem, ...(fir.timeline || [])],
      auditTrail: [auditItem, ...(fir.auditTrail || [])],
    });
  },

  /**
   * Reopens a completed case (COMPLETED -> PART_B_REOPEN).
   * Strict Rule:
   * - Reopening is permitted only from COMPLETED.
   * - Must NOT duplicate FIR or create new case.
   * - Retains previous completion history immutably.
   * - Moves same case to PART_B_REOPEN.
   */
  reopenCompletedCase(params: {
    firId: string;
    reason: string;
    courtName?: string;
    orderNumber?: string;
    orderDate?: string;
    orderDocumentUrl?: string;
    assignedIoId?: string;
    assignedIoName?: string;
    assignedIoRank?: string;
    assignedDirections?: string;
    reopenedBy: string;
    reopenedByRank?: string;
  }): FIRItem | undefined {
    const fir = this.getFirById(params.firId);
    if (!fir) return undefined;

    const currentTracking = getAuthoritativeTrackingState(fir);
    if (currentTracking !== "COMPLETED") {
      throw new Error(`Cannot reopen FIR ${fir.firNumber}: current state is ${currentTracking}. Reopening is permitted only from COMPLETED.`);
    }

    if (!params.reason || !params.reason.trim()) {
      throw new Error("A valid reason is required to reopen a completed case.");
    }

    const now = new Date();
    const dateStr = now.toISOString().split("T")[0];
    const timeStr = now.toTimeString().slice(0, 5);

    const latestCompletion = fir.completionHistory?.[0];
    const priorReason = latestCompletion
      ? `${latestCompletion.completionType} on ${latestCompletion.completedAt} (${latestCompletion.summary || ""})`
      : `${fir.finalFormType || fir.status}`;

    const reopenEvt: FIRReopenEvent = {
      id: "reopen-" + Date.now(),
      reopenedAt: dateStr + " " + timeStr,
      reopenedBy: params.reopenedBy,
      reopenedByRank: params.reopenedByRank,
      reason: params.reason.trim(),
      orderNumber: params.orderNumber,
      orderDate: params.orderDate,
      courtName: params.courtName,
      orderDocumentUrl: params.orderDocumentUrl,
      assignedIoId: params.assignedIoId,
      assignedIoName: params.assignedIoName,
      assignedIoRank: params.assignedIoRank,
      assignedDirections: params.assignedDirections,
      priorCompletionReason: priorReason,
    };

    const timelineItem: FIRTimelineEvent = {
      id: "tl-" + Date.now(),
      date: dateStr + " " + timeStr,
      title: "Case Reopened (Court Order / Further Investigation)",
      description: `Case reopened by ${params.reopenedBy}. Reason: ${params.reason}. Order: ${params.orderNumber || "Direct"} dated ${params.orderDate || dateStr}. Assigned to ${params.assignedIoName || "IO"}.`,
      actor: params.reopenedBy,
      stage: "ASSIGNED",
    };

    const auditItem: FIRAuditRecord = {
      id: "aud-" + Date.now(),
      timestamp: dateStr + " " + timeStr,
      action: "CASE_REOPENED",
      officerName: params.reopenedBy,
      role: params.reopenedByRank || "SHO",
      details: `Reopened completed case. Reason: ${params.reason}. Tracking state moved from COMPLETED -> PART_B_REOPEN.`,
    };

    return this.updateFir(params.firId, {
      trackingState: "PART_B_REOPEN",
      previouslyReopened: true,
      pendingChallanId: undefined,
      status: "UNDER_INVESTIGATION",
      assignedIoId: params.assignedIoId || fir.assignedIoId,
      assignedIoName: params.assignedIoName || fir.assignedIoName,
      assignedIoRank: params.assignedIoRank || fir.assignedIoRank,
      assignedDirections: params.assignedDirections || fir.assignedDirections,
      courtName: params.courtName || fir.courtName,
      courtOrderNumber: params.orderNumber || fir.courtOrderNumber,
      courtOrderDate: params.orderDate || fir.courtOrderDate,
      courtOrderDocumentUrl: params.orderDocumentUrl || fir.courtOrderDocumentUrl,
      reopenHistory: [reopenEvt, ...(fir.reopenHistory || [])],
      timeline: [timelineItem, ...(fir.timeline || [])],
      auditTrail: [auditItem, ...(fir.auditTrail || [])],
    });
  },

  assignIoWithCourtOrder(params: {
    firId: string;
    ioId: string;
    ioName: string;
    rank?: string;
    courtName: string;
    courtOrderNumber: string;
    courtOrderDate: string;
    courtOrderDocumentUrl?: string;
    courtOrderDocumentName?: string;
    directions?: string;
    assignedBy?: string;
  }): FIRItem | undefined {
    const fir = this.getFirById(params.firId);
    if (!fir) return undefined;

    const now = new Date();
    const dateStr = now.toISOString().split("T")[0];
    const timeStr = now.toTimeString().slice(0, 5);

    const timelineItem: FIRTimelineEvent = {
      id: "tl-" + Date.now(),
      date: dateStr + " " + timeStr,
      title: "Court Order: Assigned for Investigation",
      description: "Court: " + params.courtName + ", Order No: " + params.courtOrderNumber + " dated " + params.courtOrderDate + ". Assigned to " + params.ioName + " (" + (params.rank || "IO") + ").",
      actor: params.assignedBy || "SHO",
      stage: "ASSIGNED",
    };

    const auditItem: FIRAuditRecord = {
      id: "aud-" + Date.now(),
      timestamp: dateStr + " " + timeStr,
      action: "COURT_ORDER_ASSIGNED_IO",
      officerName: params.assignedBy || "SHO",
      role: "SHO",
      details: "Court Order " + params.courtOrderNumber + " assigned to " + params.ioName + " (" + (params.rank || "IO") + ")",
    };

    return this.updateFir(params.firId, {
      assignedIoId: params.ioId,
      assignedIoName: params.ioName,
      assignedIoRank: params.rank || "Sub Inspector",
      assignedAt: dateStr + " " + timeStr,
      assignedDirections: params.directions || ("Investigation under Court Order No. " + params.courtOrderNumber + " (" + params.courtName + ")"),
      courtName: params.courtName,
      courtOrderNumber: params.courtOrderNumber,
      courtOrderDate: params.courtOrderDate,
      courtOrderDocumentUrl: params.courtOrderDocumentUrl,
      courtOrderDocumentName: params.courtOrderDocumentName,
      status: "UNDER_INVESTIGATION",
      timeline: [timelineItem, ...(fir.timeline || [])],
      auditTrail: [auditItem, ...(fir.auditTrail || [])],
    });
  },

  assignIo(
    firId: string,
    ioId: string,
    ioName: string,
    rank?: string,
    directions?: string,
    assignedBy?: string
  ): FIRItem | undefined {
    const fir = this.getFirById(firId);
    if (!fir) return undefined;

    const now = new Date();
    const dateStr = now.toISOString().split("T")[0];
    const timeStr = now.toTimeString().slice(0, 5);

    const timelineItem: FIRTimelineEvent = {
      id: `tl-${Date.now()}`,
      date: `${dateStr} ${timeStr}`,
      title: "IO Assigned",
      description: `Investigation assigned to ${ioName} (${rank || "IO"}). Directions: ${directions || "Conduct thorough investigation as per procedure."}`,
      actor: assignedBy || "SHO Sector 29",
      stage: "ASSIGNED",
    };

    const auditItem: FIRAuditRecord = {
      id: `aud-${Date.now()}`,
      timestamp: `${dateStr} ${timeStr}`,
      action: "IO_ASSIGNED",
      officerName: assignedBy || "SHO",
      role: "SHO",
      details: `Assigned IO: ${ioName} (${rank || "IO"})`,
    };

    return this.updateFir(firId, {
      assignedIoId: ioId,
      assignedIoName: ioName,
      assignedIoRank: rank || "Sub Inspector",
      assignedAt: `${dateStr} ${timeStr}`,
      assignedDirections: directions,
      status: "UNDER_INVESTIGATION",
      timeline: [timelineItem, ...(fir.timeline || [])],
      auditTrail: [auditItem, ...(fir.auditTrail || [])],
    });
  },

  addCaseDiary(firId: string, note: FIRCaseDiaryItem): FIRItem | undefined {
    const fir = this.getFirById(firId);
    if (!fir) return undefined;

    const caseDiaries = [note, ...(fir.caseDiaries || [])];
    const timelineItem: FIRTimelineEvent = {
      id: `tl-${Date.now()}`,
      date: `${note.date} ${note.time}`,
      title: note.summary || "Case Diary (Zimni) Recorded",
      description: note.details?.slice(0, 160) || "Case Diary entry submitted by IO.",
      actor: note.officer,
      stage: "FIELD_ENQUIRY",
    };

    return this.updateFir(firId, {
      caseDiaries,
      timeline: [timelineItem, ...(fir.timeline || [])],
    });
  },

  deleteCaseDiary(firId: string, caseDiaryId: string, officerName?: string): FIRItem | undefined {
    const fir = this.getFirById(firId);
    if (!fir) return undefined;

    const targetCd = (fir.caseDiaries || []).find((cd) => cd.id === caseDiaryId);
    const caseDiaries = (fir.caseDiaries || []).filter((cd) => cd.id !== caseDiaryId);
    const timelineItem: FIRTimelineEvent = {
      id: `tl-${Date.now()}`,
      date: new Date().toISOString().replace("T", " ").slice(0, 16),
      title: "Case Diary (Zimni) Removed",
      description: `Case Diary #${targetCd?.zimniNumber || ""} "${targetCd?.summary || ""}" deleted by ${officerName || "Investigating Officer"}.`,
      actor: officerName || "IO",
      stage: "FIELD_ENQUIRY",
    };

    return this.updateFir(firId, {
      caseDiaries,
      timeline: [timelineItem, ...(fir.timeline || [])],
    });
  },

  addDocument(firId: string, doc: FIRDocumentItem): FIRItem | undefined {
    const fir = this.getFirById(firId);
    if (!fir) return undefined;

    const documents = [doc, ...(fir.documents || [])];
    return this.updateFir(firId, { documents });
  },

  deleteDocument(firId: string, docId: string): FIRItem | undefined {
    const fir = this.getFirById(firId);
    if (!fir) return undefined;

    const documents = (fir.documents || []).filter((d) => d.id !== docId);
    return this.updateFir(firId, { documents });
  },

  addReport(firId: string, report: ComplaintReportItem): FIRItem | undefined {
    const fir = this.getFirById(firId);
    if (!fir) return undefined;

    const reports = [report, ...(fir.reports || []).filter(r=>r.id!==report.id)];
    return this.updateFir(firId, { reports });
  },

  deleteReport(firId: string, reportId: string): FIRItem | undefined {
    const fir = this.getFirById(firId);
    if (!fir) return undefined;

    const reports = (fir.reports || []).filter((r) => r.id !== reportId);
    return this.updateFir(firId, { reports });
  },

  submitFinalForm(
    firId: string,
    formType: "CHARGESHEET" | "CLOSURE" | "UNTRACED" | "CANCELLED",
    courtName: string,
    submittedBy: string,
    summary: string
  ): FIRItem | undefined {
    const fir = this.getFirById(firId);
    if (!fir) return undefined;

    const now = new Date();
    const dateStr = now.toISOString().split("T")[0];
    const timeStr = now.toTimeString().slice(0, 5);
    const formNum = `${formType === "CHARGESHEET" ? "CS" : "FR"}/${fir.firYear}/${Date.now().toString().slice(-4)}`;

    const status: FIRStatus =
      formType === "CHARGESHEET"
        ? "CHARGESHEET_FILED"
        : formType === "CLOSURE"
        ? "CLOSURE_REPORT_FILED"
        : formType === "UNTRACED"
        ? "UNTRACED"
        : "CANCELLED";

    const timelineItem: FIRTimelineEvent = {
      id: `tl-${Date.now()}`,
      date: `${dateStr} ${timeStr}`,
      title: `Final Report Filed: ${formType} u/s 193 BNSS`,
      description: `Report Number: ${formNum} forwarded for submission before ${courtName}. Summary: ${summary.slice(0, 150)}`,
      actor: submittedBy,
      stage: "FINAL_REPORT",
    };

    // Authorized direct closure/UT/CAN or final chargesheet transitions directly to COMPLETED
    const completionEvt: FIRCompletionEvent = {
      id: `comp-${Date.now()}`,
      completedAt: new Date().toISOString(),
      completedBy: submittedBy,
      completionType: formType,
      courtName,
      referenceNumber: formNum,
      summary,
      reason: summary,
    };

    return this.updateFir(firId, {
      finalFormType: formType,
      finalFormNumber: formNum,
      finalFormDate: dateStr,
      courtName,
      status,
      trackingState: "COMPLETED",
      completionReason: summary,
      completionHistory: [...(fir.completionHistory || []), completionEvt],
      timeline: [timelineItem, ...(fir.timeline || [])],
    });
  },

  addAuditRecord(firId: string, action: string, details: string, officerName?: string, role?: string) {
    const fir = this.getFirById(firId);
    if (!fir) return;

    const now = new Date();
    const item: FIRAuditRecord = {
      id: `aud-${Date.now()}`,
      timestamp: `${now.toISOString().split("T")[0]} ${now.toTimeString().slice(0, 5)}`,
      action,
      officerName: officerName || "Officer",
      role: role || "SHO",
      details,
    };

    this.updateFir(firId, {
      auditTrail: [item, ...(fir.auditTrail || [])],
    });
  },

  saveFirDraft(draft: any, key: string = "default"): void {
    if (typeof window === "undefined" || !window.localStorage) return;
    try {
      const storageKey = `haryana_police_cms_fir_draft_${key}`;
      window.localStorage.setItem(
        storageKey,
        JSON.stringify({ ...draft, savedAt: new Date().toISOString() })
      );
    } catch (e) {
      console.warn("Failed to save FIR draft:", e);
    }
  },

  getFirDraft(key: string = "default"): any | null {
    if (typeof window === "undefined" || !window.localStorage) return null;
    try {
      const raw = window.localStorage.getItem(`haryana_police_cms_fir_draft_${key}`);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.warn("Failed to get FIR draft:", e);
      return null;
    }
  },

  clearFirDraft(key: string = "default"): void {
    if (typeof window === "undefined" || !window.localStorage) return;
    try {
      window.localStorage.removeItem(`haryana_police_cms_fir_draft_${key}`);
    } catch (e) {
      console.warn("Failed to clear FIR draft:", e);
    }
  },

  transferMultipleFirsInterState(payload: {
    firIds?: string[];
    firDestinations?: Record<
      string,
      {
        targetState: string;
        targetDistrict: string;
        targetPoliceStation: string;
        statutoryGround?: string;
        transferReason?: string;
      }
    >;
    targetState?: string;
    targetDistrict?: string;
    targetPoliceStation?: string;
    statutoryGround?: string;
    transferReason?: string;
    orderNumber?: string;
    orderDate?: string;
    dispatchDate: string;
    dispatchTime?: string;
    transferredBy: string;
    transferredByRank?: string;
    remarks?: string;
  }): FIRItem[] {
    const updatedFirs: FIRItem[] = [];
    const now = new Date();
    const newRecords: FIRTransferRecord[] = [];

    // Collect all unique FIR IDs either from firIds or firDestinations keys
    const allFirIds = Array.from(
      new Set([
        ...(payload.firIds || []),
        ...Object.keys(payload.firDestinations || {}),
      ])
    );

    for (const firId of allFirIds) {
      const fir = this.getFirById(firId);
      if (!fir) continue;

      const perFirDest = payload.firDestinations?.[fir.id] || payload.firDestinations?.[fir.firNumber];
      const targetState = perFirDest?.targetState || payload.targetState || "Delhi (NCT)";
      const targetDistrict = perFirDest?.targetDistrict || payload.targetDistrict || "";
      const targetPoliceStation = perFirDest?.targetPoliceStation || payload.targetPoliceStation || "";
      const statutoryGround = perFirDest?.statutoryGround || payload.statutoryGround || "Zero FIR Transfer u/s 173(1) BNSS, 2023";
      const transferReason = perFirDest?.transferReason || payload.transferReason || statutoryGround;

      const recordId = `trf-fir-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const transferRecord: FIRTransferRecord = {
        id: recordId,
        firId: fir.id,
        firNumber: fir.firNumber,
        complainantName: fir.complainantName,
        actsAndSections: fir.actsAndSections,
        transferType: "INTER_STATE",
        sourceState: fir.state || "Haryana",
        sourceDistrict: fir.district || "Panipat",
        sourcePoliceStation: fir.policeStation || "PS City Panipat",
        targetState,
        targetDistrict,
        targetPoliceStation,
        transferReason,
        statutoryGround,
        orderNumber: payload.orderNumber,
        orderDate: payload.orderDate,
        dispatchDate: payload.dispatchDate,
        dispatchTime: payload.dispatchTime,
        transferredBy: payload.transferredBy,
        transferredByRank: payload.transferredByRank,
        remarks: payload.remarks,
        timestamp: now.toISOString(),
      };
      newRecords.push(transferRecord);

      const timelineItem: FIRTimelineEvent = {
        id: `tl-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        date: `${payload.dispatchDate} ${payload.dispatchTime || "10:00"}`,
        title: "FIR Transferred (Inter-State)",
        description: `Case docket transferred to ${targetPoliceStation}, Dist. ${targetDistrict}, State: ${targetState}. Statutory Ground: ${statutoryGround}. Sanction Order: ${payload.orderNumber || "N/A"}.`,
        actor: `${payload.transferredBy} (${payload.transferredByRank || "SHO"})`,
        stage: "SUPERVISORY_REVIEW",
      };

      const auditItem: FIRAuditRecord = {
        id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        timestamp: `${payload.dispatchDate} ${payload.dispatchTime || "10:00"}`,
        action: "INTER_STATE_TRANSFER",
        officerName: payload.transferredBy,
        role: payload.transferredByRank || "SHO",
        details: `Transferred to ${targetPoliceStation}, ${targetDistrict}, ${targetState}. Ground: ${statutoryGround}`,
      };

      const updated = this.updateFir(fir.id, {
        isTransferred: true,
        transferType: "INTER_STATE",
        transferredToState: targetState,
        transferredToDistrict: targetDistrict,
        transferredToPoliceStation: targetPoliceStation,
        transferredAt: now.toISOString(),
        transferredBy: `${payload.transferredBy} (${payload.transferredByRank || "SHO"})`,
        transferReason: transferReason,
        transferStatutoryGround: statutoryGround,
        transferOrderNumber: payload.orderNumber,
        transferOrderDate: payload.orderDate,
        transferRecord,
        transferHistory: [transferRecord, ...(fir.transferHistory || [])],
        timeline: [timelineItem, ...(fir.timeline || [])],
        auditTrail: [auditItem, ...(fir.auditTrail || [])],
      });

      if (updated) {
        updatedFirs.push(updated);
      }
    }

    if (typeof window !== "undefined" && window.localStorage && newRecords.length > 0) {
      try {
        const stored = window.localStorage.getItem("haryana_police_cms_fir_transfers_v1");
        const list: FIRTransferRecord[] = stored ? JSON.parse(stored) : [];
        list.unshift(...newRecords);
        window.localStorage.setItem("haryana_police_cms_fir_transfers_v1", JSON.stringify(list));
      } catch (e) {
        console.warn("Failed to save to FIR transfer history storage", e);
      }
    }

    return updatedFirs;
  },

  transferFirInterState(payload: {
    firId: string;
    targetState: string;
    targetDistrict: string;
    targetPoliceStation: string;
    statutoryGround: string;
    transferReason: string;
    orderNumber?: string;
    orderDate?: string;
    dispatchDate: string;
    dispatchTime?: string;
    transferredBy: string;
    transferredByRank?: string;
    remarks?: string;
  }): FIRItem {
    const results = this.transferMultipleFirsInterState({
      firIds: [payload.firId],
      ...payload,
    });
    if (!results || results.length === 0) throw new Error("Failed to transfer FIR");
    return results[0];
  },

  getTransferHistory(): FIRTransferRecord[] {
    const historyMap = new Map<string, FIRTransferRecord>();

    // 1. Load from dedicated storage key
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        const stored = window.localStorage.getItem("haryana_police_cms_fir_transfers_v1");
        if (stored) {
          const list: FIRTransferRecord[] = JSON.parse(stored);
          list.forEach((rec) => {
            if (rec && rec.id) {
              historyMap.set(rec.id, rec);
            }
          });
        }
      } catch {
        // fallback
      }
    }

    // 2. Merge from all firs in firsStore
    firsStore.forEach((fir) => {
      if (fir.transferHistory && fir.transferHistory.length > 0) {
        fir.transferHistory.forEach((rec) => {
          if (rec && rec.id) {
            historyMap.set(rec.id, {
              ...rec,
              complainantName: rec.complainantName || fir.complainantName,
              actsAndSections: rec.actsAndSections || fir.actsAndSections,
            });
          }
        });
      } else if (fir.transferRecord && fir.transferRecord.id) {
        historyMap.set(fir.transferRecord.id, {
          ...fir.transferRecord,
          complainantName: fir.transferRecord.complainantName || fir.complainantName,
          actsAndSections: fir.actsAndSections,
        });
      }
    });

    return Array.from(historyMap.values()).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  },

  linkMultipleFirs(payload: {
    primaryFirId: string;
    targetFirIds: string[];
    linkType: "DUPLICATE" | "CROSS" | "CONNECTED";
    reason: string;
    officerName: string;
  }): { primary: FIRItem; targets: FIRItem[] } {
    const primary = this.getFirById(payload.primaryFirId);
    if (!primary) throw new Error("Primary FIR not found");

    const validTargetIds = Array.from(new Set(payload.targetFirIds)).filter((id) => id !== primary.id);
    if (validTargetIds.length === 0) throw new Error("Please select at least one valid target FIR to link");

    const now = new Date();
    const dateStr = now.toISOString().split("T")[0];
    const timeStr = now.toTimeString().slice(0, 5);
    const isDuplicate = payload.linkType === "DUPLICATE";
    const isCross = payload.linkType === "CROSS";

    const updatedTargets: FIRItem[] = [];
    const newPrimaryLinks: LinkedFIREntry[] = [];

    for (const tId of validTargetIds) {
      const target = this.getFirById(tId);
      if (!target) continue;

      newPrimaryLinks.push({
        id: `lnk-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        firId: target.id,
        firNumber: target.firNumber,
        cctnsFirNumber: target.cctnsFirNumber,
        complainantName: target.complainantName,
        firDate: target.firDate,
        linkType: payload.linkType,
        reason: payload.reason,
        linkedAt: now.toISOString(),
        linkedBy: payload.officerName,
      });

      const targetEntry: LinkedFIREntry = {
        id: `lnk-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        firId: primary.id,
        firNumber: primary.firNumber,
        cctnsFirNumber: primary.cctnsFirNumber,
        complainantName: primary.complainantName,
        firDate: primary.firDate,
        linkType: payload.linkType,
        reason: payload.reason,
        linkedAt: now.toISOString(),
        linkedBy: payload.officerName,
      };

      const targetExisting = (target.linkedFirsList || []).filter((l) => l.firId !== primary.id);
      const tTimeline: FIRTimelineEvent = {
        id: `tl-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        date: `${dateStr} ${timeStr}`,
        title: `FIR Linked (${payload.linkType})`,
        description: `Linked with FIR #${primary.firNumber} (${payload.linkType}). Reason: ${payload.reason}`,
        actor: payload.officerName,
        stage: "FIELD_ENQUIRY",
      };

      const updatedT = this.updateFir(target.id, {
        linkedFirsList: [targetEntry, ...targetExisting],
        isDuplicate: isDuplicate ? true : target.isDuplicate,
        isCrossFir: isCross ? true : target.isCrossFir,
        timeline: [tTimeline, ...(target.timeline || [])],
      });

      if (updatedT) {
        updatedTargets.push(updatedT);
      }
    }

    const targetNumbers = updatedTargets.map((t) => t.firNumber);
    const targetIds = updatedTargets.map((t) => t.id);
    const primaryExisting = (primary.linkedFirsList || []).filter((l) => !targetIds.includes(l.firId));

    const pTimeline: FIRTimelineEvent = {
      id: `tl-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      date: `${dateStr} ${timeStr}`,
      title: `FIR Linked (${payload.linkType})`,
      description: `Linked with ${updatedTargets.length} FIR(s) (${targetNumbers.join(", ")}) (${payload.linkType}). Reason: ${payload.reason}`,
      actor: payload.officerName,
      stage: "FIELD_ENQUIRY",
    };

    const updatedPrimary = this.updateFir(primary.id, {
      linkedFirsList: [...newPrimaryLinks, ...primaryExisting],
      isCrossFir: isCross ? true : primary.isCrossFir,
      timeline: [pTimeline, ...(primary.timeline || [])],
    });

    if (!updatedPrimary) throw new Error("Failed to link primary FIR");
    return { primary: updatedPrimary, targets: updatedTargets };
  },

  linkFirs(payload: {
    primaryFirId: string;
    targetFirId: string;
    linkType: "DUPLICATE" | "CROSS" | "CONNECTED";
    reason: string;
    officerName: string;
  }): { primary: FIRItem; target: FIRItem } {
    const res = this.linkMultipleFirs({
      primaryFirId: payload.primaryFirId,
      targetFirIds: [payload.targetFirId],
      linkType: payload.linkType,
      reason: payload.reason,
      officerName: payload.officerName,
    });
    if (!res.targets[0]) throw new Error("Failed to link target FIR");
    return { primary: res.primary, target: res.targets[0] };
  },

  delinkFirs(payload: {
    primaryFirId: string;
    targetFirNumber: string;
    targetFirId?: string;
    reason: string;
    officerName: string;
  }): { primary: FIRItem; target?: FIRItem } {
    const primary = this.getFirById(payload.primaryFirId);
    if (!primary) throw new Error("Primary FIR not found");

    const targetFirNumber = payload.targetFirNumber;
    const links = (primary.linkedFirsList || []).filter(l => payload.targetFirId ? l.firId === payload.targetFirId : l.firNumber === targetFirNumber);
    if (links.length !== 1) throw new Error('Select one linked FIR by its unique ID.');
    const targetId = links[0].firId;
    const target = this.getFirById(targetId);

    const now = new Date();
    const dateStr = now.toISOString().split("T")[0];
    const timeStr = now.toTimeString().slice(0, 5);

    const pUpdatedList = (primary.linkedFirsList || []).filter((l) => l.firId !== targetId);
    const hasOtherDuplicatesP = pUpdatedList.some((l) => l.linkType === "DUPLICATE");
    const hasOtherCrossP = pUpdatedList.some((l) => l.linkType === "CROSS");

    const pTimeline: FIRTimelineEvent = {
      id: `tl-${Date.now()}-1`,
      date: `${dateStr} ${timeStr}`,
      title: "FIR Delinked",
      description: `Delinked from FIR #${targetFirNumber}. Reason: ${payload.reason}`,
      actor: payload.officerName,
      stage: "FIELD_ENQUIRY",
    };

    const updatedPrimary = this.updateFir(primary.id, {
      linkedFirsList: pUpdatedList,
      isDuplicate: hasOtherDuplicatesP,
      isCrossFir: hasOtherCrossP,
      timeline: [pTimeline, ...(primary.timeline || [])],
    });

    let updatedTarget: FIRItem | undefined = undefined;
    if (target) {
      const tUpdatedList = (target.linkedFirsList || []).filter((l) => l.firId !== primary.id);
      const hasOtherDuplicatesT = tUpdatedList.some((l) => l.linkType === "DUPLICATE");
      const hasOtherCrossT = tUpdatedList.some((l) => l.linkType === "CROSS");

      const tTimeline: FIRTimelineEvent = {
        id: `tl-${Date.now()}-2`,
        date: `${dateStr} ${timeStr}`,
        title: "FIR Delinked",
        description: `Delinked from FIR #${primary.firNumber}. Reason: ${payload.reason}`,
        actor: payload.officerName,
        stage: "FIELD_ENQUIRY",
      };

      updatedTarget = this.updateFir(target.id, {
        linkedFirsList: tUpdatedList,
        isDuplicate: hasOtherDuplicatesT,
        isCrossFir: hasOtherCrossT,
        timeline: [tTimeline, ...(target.timeline || [])],
      });
    }

    if (!updatedPrimary) throw new Error("Failed to delink FIR");
    return { primary: updatedPrimary, target: updatedTarget };
  },
};
