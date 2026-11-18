"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Building2,
  MapPin,
  Shield,
  Layers,
  Network,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Eye,
  Edit2,
  Power,
  ChevronRight,
  ChevronDown,
  Building,
  Radio,
  FileText,
  Users,
  Compass,
  ArrowRight,
  RefreshCw,
  Sliders,
  FolderTree,
  ArrowRightLeft,
  X,
  Landmark,
  ShieldAlert,
  Train,
  FlaskConical,
  Briefcase,
  GraduationCap,
  Trash2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import type {
  MasterState,
  MasterRange,
  MasterDistrict,
  MasterOffice,
  MasterPoliceStation,
  MasterSpecializedUnit,
  HierarchyTreeNode,
  LocationStatistics,
  MasterEntityStatus,
  StationType,
  OfficeType,
  UnitType,
} from "@/types/adminMaster";

type AdminTab =
  | "dashboard"
  | "states"
  | "ranges"
  | "commissionerates"
  | "districts"
  | "armed-police"
  | "grp"
  | "forensic-labs"
  | "deputation-units"
  | "offices"
  | "stations"
  | "units"
  | "hierarchy";

type EntityType = "state" | "range" | "district" | "office" | "station" | "unit" | "zone" | "battalion";

// Master seed data for authentic Haryana Police wings
const COMMISSIONERATES_MASTER_DATA = [
  {
    id: "comm_fbd",
    name: "Faridabad Commissionerate",
    code: "FBD-COMM",
    address: "Sector 12, Faridabad, Haryana 121007",
    cpOffice: "Office of Commissioner of Police, Faridabad",
    contactPhone: "0129-2227200",
    email: "cp.fbd@hry.gov.in",
    zones: [
      { id: "z_fbd_nit", name: "NIT Zone", dcp: "DCP NIT Faridabad", phone: "0129-2415100", stations: ["PS NIT Faridabad", "PS SGM Nagar", "PS Saran", "PS Kotwali"] },
      { id: "z_fbd_cent", name: "Central Zone", dcp: "DCP Central Faridabad", phone: "0129-2227100", stations: ["PS Central", "PS Sector 7", "PS Sector 8", "PS Old Faridabad"] },
      { id: "z_fbd_blb", name: "Ballabgarh Zone", dcp: "DCP Ballabgarh", phone: "0129-2241200", stations: ["PS Ballabgarh City", "PS Ballabgarh Sadar", "PS Tigaon", "PS Chhainsa"] },
    ],
  },
  {
    id: "comm_ggn",
    name: "Gurugram Commissionerate",
    code: "GGN-COMM",
    address: "Sohna Road, Sector 47, Gurugram, Haryana 122018",
    cpOffice: "Office of Commissioner of Police, Gurugram",
    contactPhone: "0124-2316100",
    email: "cp.ggn@hry.gov.in",
    zones: [
      { id: "z_ggn_east", name: "East Zone", dcp: "DCP East Gurugram", phone: "0124-2385100", stations: ["PS DLF Phase-1", "PS DLF Phase-2", "PS Sector 29", "PS Sector 56"] },
      { id: "z_ggn_west", name: "West Zone", dcp: "DCP West Gurugram", phone: "0124-2321100", stations: ["PS Civil Lines", "PS City Gurugram", "PS Sector 5", "PS Rajendra Park"] },
      { id: "z_ggn_south", name: "South Zone", dcp: "DCP South Gurugram", phone: "0124-2391200", stations: ["PS Sohna", "PS Badshahpur", "PS Bhondsi"] },
      { id: "z_ggn_mnsr", name: "Manesar Zone", dcp: "DCP Manesar", phone: "0124-2290100", stations: ["PS Manesar", "PS Kherki Daula", "PS Bilaspur", "PS Pataudi"] },
    ],
  },
  {
    id: "comm_jhj",
    name: "Jhajjar Commissionerate",
    code: "JHJ-COMM",
    address: "Mini Secretariat, Jhajjar, Haryana 124103",
    cpOffice: "Office of Commissioner of Police, Jhajjar",
    contactPhone: "01251-252100",
    email: "cp.jhj@hry.gov.in",
    zones: [
      { id: "z_jhj_jhj", name: "Jhajjar Zone", dcp: "DCP Jhajjar", phone: "01251-252105", stations: ["PS Jhajjar City", "PS Jhajjar Sadar", "PS Beri", "PS Machhroli"] },
      { id: "z_jhj_bdg", name: "Bahadurgarh Zone", dcp: "DCP Bahadurgarh", phone: "01276-230100", stations: ["PS Bahadurgarh City", "PS Sector 6 Bahadurgarh", "PS Line Par", "PS Asaudha"] },
    ],
  },
  {
    id: "comm_pkl",
    name: "Panchkula Commissionerate",
    code: "PKL-COMM",
    address: "Sector 1, Panchkula, Haryana 134112",
    cpOffice: "Office of Commissioner of Police, Panchkula",
    contactPhone: "0172-2582100",
    email: "cp.pkl@hry.gov.in",
    zones: [
      { id: "z_pkl_pkl", name: "Panchkula Zone", dcp: "DCP Panchkula", phone: "0172-2582105", stations: ["PS Sector 5", "PS Sector 14", "PS Sector 20", "PS Chandimandir", "PS Mansa Devi Complex"] },
      { id: "z_pkl_klk", name: "Kalka Zone", dcp: "ACP Kalka Division", phone: "01733-220100", stations: ["PS Kalka", "PS Pinjore", "PS Raipur Rani"] },
    ],
  },
  {
    id: "comm_snp",
    name: "Sonipat Commissionerate",
    code: "SNP-COMM",
    address: "Mini Secretariat, Sonipat, Haryana 131001",
    cpOffice: "Office of Commissioner of Police, Sonipat",
    contactPhone: "0130-2222100",
    email: "cp.snp@hry.gov.in",
    zones: [
      { id: "z_snp_city", name: "Sonipat City Zone", dcp: "DCP Sonipat City", phone: "0130-2222105", stations: ["PS City Sonipat", "PS Civil Lines", "PS Sector 27", "PS Rai", "PS Kundli"] },
      { id: "z_snp_ghn", name: "Gohana Zone", dcp: "ACP Gohana Division", phone: "01263-252100", stations: ["PS Gohana City", "PS Gohana Sadar", "PS Baroda"] },
      { id: "z_snp_gnr", name: "Ganaur Zone", dcp: "ACP Ganaur Division", phone: "0130-2460100", stations: ["PS Ganaur", "PS Murthal", "PS Kharkhoda"] },
    ],
  },
];

const ARMED_BATTALIONS_MASTER_DATA = [
  { id: "hap_1", name: "1st Bn HAP", wing: "HAP", code: "HAP-1BN", hq: "Ambala City", commandant: "Commandant (SP Rank)", phone: "0171-2530100", companies: 7, status: "ACTIVE" },
  { id: "hap_2", name: "2nd Bn HAP", wing: "HAP", code: "HAP-2BN", hq: "Madhuban, Karnal", commandant: "Commandant (SP Rank)", phone: "0184-2380100", companies: 7, status: "ACTIVE" },
  { id: "hap_3", name: "3rd Bn HAP", wing: "HAP", code: "HAP-3BN", hq: "Hisar", commandant: "Commandant (SP Rank)", phone: "01662-225100", companies: 7, status: "ACTIVE" },
  { id: "hap_4", name: "4th Bn HAP", wing: "HAP", code: "HAP-4BN", hq: "Madhuban, Karnal", commandant: "Commandant (SP Rank)", phone: "0184-2380104", companies: 7, status: "ACTIVE" },
  { id: "hap_5", name: "5th Bn HAP", wing: "HAP", code: "HAP-5BN", hq: "Madhuban, Karnal", commandant: "Commandant (SP Rank)", phone: "0184-2380105", companies: 7, status: "ACTIVE" },
  { id: "hap_durga", name: "Durga Bn HAP", wing: "HAP", code: "HAP-DURGA", hq: "Madhuban, Karnal", commandant: "Commandant (Women Armed Force)", phone: "0184-2380109", companies: 6, status: "ACTIVE" },
  { id: "irb_1", name: "1st Bn IRB", wing: "IRB", code: "IRB-1BN", hq: "Bhondsi, Gurugram", commandant: "Commandant (SP Rank)", phone: "0124-2260100", companies: 7, status: "ACTIVE" },
  { id: "irb_2", name: "2nd Bn IRB", wing: "IRB", code: "IRB-2BN", hq: "Bhondsi, Gurugram", commandant: "Commandant (SP Rank)", phone: "0124-2260102", companies: 7, status: "ACTIVE" },
  { id: "irb_3", name: "3rd Bn IRB", wing: "IRB", code: "IRB-3BN", hq: "Sunaria, Rohtak", commandant: "Commandant (SP Rank)", phone: "01262-248100", companies: 7, status: "ACTIVE" },
  { id: "irb_4", name: "4th Bn IRB", wing: "IRB", code: "IRB-4BN", hq: "Manebhadar", commandant: "Commandant (SP Rank)", phone: "0124-2260104", companies: 7, status: "ACTIVE" },
];

const GRP_SUBDIVISIONS_DATA = [
  { id: "sd_amb", name: "Ambala Cantt", dsp: "DSP Railway Sub-Division Ambala Cantt", phone: "0171-2640101", stationsCount: 6, jurisdiction: "Ambala, Chandigarh, Kalka, Jagadhari, Kurukshetra, Karnal" },
  { id: "sd_fbd", name: "Faridabad", dsp: "DSP Railway Sub-Division Faridabad", phone: "0129-2280101", stationsCount: 7, jurisdiction: "Faridabad, Gurugram, Bahadurgarh, Rewari, Rohtak, Sonipat, Panipat" },
  { id: "sd_hsr", name: "Hisar", dsp: "DSP Railway Sub-Division Hisar", phone: "01662-231101", stationsCount: 3, jurisdiction: "Hisar, Jind, Sirsa" },
];

const GRP_STATIONS_MASTER_DATA = [
  { id: "grps_1", name: "GRP AMBALA CANTT", subDivision: "Ambala Cantt", code: "GRPS-AMB", section: "Ambala Division - Main Railway Junction", contact: "0171-2640100", sho: "Inspector SHO GRPS Ambala Cantt", status: "ACTIVE" },
  { id: "grps_2", name: "GRP BAHADURGARH", subDivision: "Faridabad", code: "GRPS-BDG", section: "Delhi - Rohtak Main Line", contact: "01276-230100", sho: "Inspector SHO GRPS Bahadurgarh", status: "ACTIVE" },
  { id: "grps_3", name: "GRP CHANDIGARH", subDivision: "Ambala Cantt", code: "GRPS-CDG", section: "Chandigarh Railway Station", contact: "0172-2650100", sho: "Inspector SHO GRPS Chandigarh", status: "ACTIVE" },
  { id: "grps_4", name: "GRP FARIDABAD", subDivision: "Faridabad", code: "GRPS-FBD", section: "Old Faridabad / Delhi - Agra Trunk Line", contact: "0129-2280100", sho: "Inspector SHO GRPS Faridabad", status: "ACTIVE" },
  { id: "grps_5", name: "GRP GURUGRAM", subDivision: "Faridabad", code: "GRPS-GGN", section: "Delhi - Jaipur Rail Corridor", contact: "0124-2320100", sho: "Inspector SHO GRPS Gurugram", status: "ACTIVE" },
  { id: "grps_6", name: "GRP HISAR", subDivision: "Hisar", code: "GRPS-HSR", section: "Hisar Junction - Bathinda / Rewari", contact: "01662-231100", sho: "Inspector SHO GRPS Hisar", status: "ACTIVE" },
  { id: "grps_7", name: "GRP JAGADHARI", subDivision: "Ambala Cantt", code: "GRPS-JGD", section: "Northern Railway Carriage Workshop", contact: "01732-250100", sho: "Sub-Inspector SHO GRPS Jagadhari", status: "ACTIVE" },
  { id: "grps_8", name: "GRP JIND", subDivision: "Hisar", code: "GRPS-JND", section: "Jind Junction - Delhi / Bathinda", contact: "01681-220100", sho: "Inspector SHO GRPS Jind", status: "ACTIVE" },
  { id: "grps_9", name: "GRP KALKA", subDivision: "Ambala Cantt", code: "GRPS-KLK", section: "Kalka - Shimla World Heritage Railway", contact: "01733-220150", sho: "Sub-Inspector SHO GRPS Kalka", status: "ACTIVE" },
  { id: "grps_10", name: "GRP KARNAL", subDivision: "Ambala Cantt", code: "GRPS-KNL", section: "Delhi - Ambala Grand Trunk Route", contact: "0184-2250100", sho: "Inspector SHO GRPS Karnal", status: "ACTIVE" },
  { id: "grps_11", name: "GRP KURUKSHETRA", subDivision: "Ambala Cantt", code: "GRPS-KKR", section: "Kurukshetra Junction - Jind / Delhi", contact: "01744-220100", sho: "Inspector SHO GRPS Kurukshetra", status: "ACTIVE" },
  { id: "grps_12", name: "GRP PANIPAT", subDivision: "Faridabad", code: "GRPS-PNP", section: "Delhi - Ambala Rail Corridor", contact: "0180-2651100", sho: "Inspector SHO GRPS Panipat", status: "ACTIVE" },
  { id: "grps_13", name: "GRP REWARI", subDivision: "Faridabad", code: "GRPS-REW", section: "Rewari Heritage Junction - Jaipur / Delhi", contact: "01274-250100", sho: "Inspector SHO GRPS Rewari", status: "ACTIVE" },
  { id: "grps_14", name: "GRP ROHTAK", subDivision: "Faridabad", code: "GRPS-ROH", section: "Rohtak Junction - Delhi / Panipat / Rewari", contact: "01262-251100", sho: "Inspector SHO GRPS Rohtak", status: "ACTIVE" },
  { id: "grps_15", name: "GRP SIRSA", subDivision: "Hisar", code: "GRPS-SRS", section: "Sirsa - Bathinda Rail Link", contact: "01666-220100", sho: "Sub-Inspector SHO GRPS Sirsa", status: "ACTIVE" },
  { id: "grps_16", name: "GRP SONIPAT", subDivision: "Faridabad", code: "GRPS-SNP", section: "NCR Rail Corridor - Delhi / Sonipat / Panipat", contact: "0130-2220100", sho: "Inspector SHO GRPS Sonipat", status: "ACTIVE" },
];

const FORENSIC_LABS_MASTER_DATA = [
  { id: "fsl_mdb", name: "FSL Madhuban", type: "State FSL", code: "FSL-MDB", location: "Madhuban, Karnal", director: "Director FSL Haryana", divisions: "Ballistics, Toxicology, Biology, Serology, DNA, Chemistry", contact: "0184-2380200", status: "ACTIVE" },
  { id: "fsl_cyb", name: "Cyber Lab Panchkula", type: "State Cyber FSL", code: "FSL-CYB", location: "Sector 6, Panchkula", director: "Deputy Director (Digital Forensics)", divisions: "Mobile Extractions, Hard Drives, Audio-Video Authentication", contact: "0172-2584100", status: "ACTIVE" },
  { id: "rfsl_ggn", name: "RFSL Gurugram", type: "Regional FSL", code: "RFSL-GGN", location: "Bhondsi, Gurugram", director: "Assistant Director RFSL", divisions: "Toxicology, Chemistry, Fingerprint, Physics", contact: "0124-2260200", status: "ACTIVE" },
  { id: "rfsl_hsr", name: "RFSL Hisar", type: "Regional FSL", code: "RFSL-HSR", location: "Hisar", director: "Assistant Director RFSL", divisions: "Biology, Toxicology, Serology", contact: "01662-225200", status: "ACTIVE" },
  { id: "rfsl_pkl", name: "RFSL Panchkula", type: "Regional FSL", code: "RFSL-PKL", location: "Panchkula", director: "Assistant Director RFSL", divisions: "Document Examination, Cyber Forensics", contact: "0172-2584200", status: "ACTIVE" },
  { id: "rfsl_roh", name: "RFSL Rohtak", type: "Regional FSL", code: "RFSL-ROH", location: "Sunaria, Rohtak", director: "Assistant Director RFSL", divisions: "Toxicology, Chemistry, Ballistics", contact: "01262-248200", status: "ACTIVE" },
];

const TRAINING_CENTRES_MASTER_DATA = [
  { id: "trg_hpa", name: "HPA, Madhuban", code: "TRG-HPA", location: "Madhuban, Karnal", head: "Director HPA (ADGP/DGP Rank)", capacity: "2500 Trainees", courses: "IPS / HPS Probationers, Sub-Inspectors Basic Training", contact: "0184-2380300", status: "ACTIVE" },
  { id: "trg_ptc", name: "PTC, Sunaria", code: "TRG-PTC", location: "Sunaria, Rohtak", head: "Principal PTC (IG/DIG Rank)", capacity: "1800 Trainees", courses: "Head Constable & ASI Promotional, In-service Courses", contact: "01262-248300", status: "ACTIVE" },
  { id: "trg_rtc", name: "RTC, Bhondsi", code: "TRG-RTC", location: "Bhondsi, Gurugram", head: "Commandant RTC (SP Rank)", capacity: "1500 Trainees", courses: "Constable Recruit Basic Training, Drill & Weaponry", contact: "0124-2260300", status: "ACTIVE" },
  { id: "trg_cptr", name: "CPT&R, Bhondsi", code: "TRG-CPTR", location: "Bhondsi, Gurugram", head: "Director CPT&R", capacity: "500 Trainees", courses: "Police Research, Modern Investigation & Tactics", contact: "0124-2260350", status: "ACTIVE" },
  { id: "trg_wptc", name: "WOMEN PTC Hisar", code: "TRG-WPTC", location: "Hisar", head: "Principal Women PTC (SP Rank)", capacity: "1200 Trainees", courses: "Women Police Recruits & Commando Training", contact: "01662-225300", status: "ACTIVE" },
];

const DEPUTATION_UNITS_MASTER_DATA = [
  { id: "dep_svacb", name: "SV & ACB (H)", type: "State Deputation", code: "ACB-DEP", dept: "State Vigilance & Anti-Corruption Bureau Haryana", head: "Director General ACB", location: "Panchkula", status: "ACTIVE" },
  { id: "dep_hg", name: "HOME GUARD", type: "State Deputation", code: "HG-DEP", dept: "Haryana Home Guards & Civil Defence", head: "Director General Home Guards", location: "Chandigarh / Panchkula", status: "ACTIVE" },
  { id: "dep_lok", name: "LOKAYUKTA", type: "State Deputation", code: "LOK-DEP", dept: "Lokayukta Haryana Police Wing", head: "Superintendent of Police (Lokayukta)", location: "Chandigarh", status: "ACTIVE" },
  { id: "dep_min", name: "MINING", type: "State Deputation", code: "MIN-DEP", dept: "Mines & Geology Police Enforcement Wing", head: "SP Mining Enforcement", location: "Panchkula", status: "ACTIVE" },
  { id: "dep_prs", name: "PRISON", type: "State Deputation", code: "PRS-DEP", dept: "Jail & Correctional Services Department", head: "DG Prisons Haryana", location: "Panchkula", status: "ACTIVE" },
  { id: "dep_spca", name: "SPCA", type: "State Deputation", code: "SPCA-DEP", dept: "State Police Complaint Authority", head: "Secretary / SP SPCA", location: "Chandigarh", status: "ACTIVE" },
  { id: "dep_hhrc", name: "HHRC", type: "State Deputation", code: "HHRC-DEP", dept: "Haryana Human Rights Commission", head: "ADGP / IG Human Rights", location: "Chandigarh", status: "ACTIVE" },
  { id: "dep_trn", name: "TRANSPORT", type: "State Deputation", code: "TRN-DEP", dept: "State Transport Enforcement", head: "SP Transport Vigilance", location: "Chandigarh", status: "ACTIVE" },
  { id: "dep_cbi", name: "CBI", type: "Central Deputation", code: "CBI-DEP", dept: "Central Bureau of Investigation", head: "Joint Director / DIG CBI", location: "New Delhi / Chandigarh", status: "ACTIVE" },
  { id: "dep_frro", name: "FRRO", type: "Central Deputation", code: "FRRO-DEP", dept: "Foreigners Regional Registration Office", head: "FRRO Incharge", location: "IGI Airport / New Delhi", status: "ACTIVE" },
];

const SPECIALISED_WINGS_MASTER_DATA = [
  { id: "spc_ats", name: "ATS", code: "ATS-HQ", title: "Anti-Terrorist Squad", location: "Panchkula", head: "IGP ATS", status: "ACTIVE" },
  { id: "spc_cid", name: "CID", code: "CID-HQ", title: "Criminal Investigation Department", location: "Panchkula", head: "ADGP CID", status: "ACTIVE" },
  { id: "spc_cmd", name: "Commando", code: "CMD-HQ", title: "Haryana Police Commando Force", location: "New Police Lines", head: "IGP Commando", status: "ACTIVE" },
  { id: "spc_cyb", name: "Cyber", code: "CYB-HQ", title: "State Cyber Crime Police Directorate", location: "Panchkula", head: "SP Cyber Crime", status: "ACTIVE" },
  { id: "spc_erss", name: "ERSS", code: "ERSS-112", title: "Emergency Response Support System (Dial 112)", location: "Panchkula", head: "SP ERSS 112", status: "ACTIVE" },
  { id: "spc_hsdrf", name: "HSDRF", code: "HSDRF-HQ", title: "Haryana State Disaster Response Force", location: "Bhondsi", head: "Commandant HSDRF", status: "ACTIVE" },
  { id: "spc_hsenb", name: "HSEnB", code: "HSENB-HQ", title: "Haryana State Enforcement Bureau", location: "Panchkula", head: "ADGP Enforcement", status: "ACTIVE" },
  { id: "spc_hsncb", name: "HSNCB", code: "HSNCB-HQ", title: "Haryana State Narcotics Control Bureau", location: "Madhuban", head: "ADGP HSNCB", status: "ACTIVE" },
  { id: "spc_scb", name: "SCB", code: "SCB-HQ", title: "State Crime Branch", location: "Panchkula", head: "ADGP Crime", status: "ACTIVE" },
  { id: "spc_scrb", name: "SCRB", code: "SCRB-HQ", title: "State Crime Records Bureau", location: "Madhuban", head: "Director SCRB", status: "ACTIVE" },
  { id: "spc_stf", name: "STF", code: "STF-HQ", title: "Special Task Force", location: "Gurugram", head: "IGP STF", status: "ACTIVE" },
  { id: "spc_tel", name: "Telecom", code: "TEL-HQ", title: "Police Telecommunications Wing", location: "Panchkula", head: "IGP Telecom", status: "ACTIVE" },
  { id: "spc_trf", name: "TRAFFIC & HIGHWAYS", code: "TRF-HWY", title: "Traffic & Highways Police Wing", location: "Karnal", head: "IGP Traffic", status: "ACTIVE" },
];

export default function LocationMasterPage() {
  const { sessionUser, currentUser, isViewAs } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  const activeTab: AdminTab = (searchParams.get("tab") as AdminTab) || "dashboard";

  // Data State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [states, setStates] = useState<MasterState[]>([]);
  const [ranges, setRanges] = useState<MasterRange[]>([]);
  const [districts, setDistricts] = useState<MasterDistrict[]>([]);
  const [offices, setOffices] = useState<MasterOffice[]>([]);
  const [policeStations, setPoliceStations] = useState<MasterPoliceStation[]>([]);
  const [specializedUnits, setSpecializedUnits] = useState<MasterSpecializedUnit[]>([]);
  const [hierarchy, setHierarchy] = useState<HierarchyTreeNode[]>([]);
  const [stats, setStats] = useState<LocationStatistics | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");

  // Selected District Detail View (Tabs 4. District Management)
  const [activeDistrictDetailId, setActiveDistrictDetailId] = useState<string | null>(null);
  const [districtSubTab, setDistrictSubTab] = useState<"overview" | "stations" | "offices" | "units">("overview");

  // Selected Range Detail View (Tabs 3. Range Management Hub)
  const [activeRangeDetailId, setActiveRangeDetailId] = useState<string | null>(null);
  const [rangeSubTab, setRangeSubTab] = useState<"overview" | "districts" | "stations" | "offices" | "units">("overview");

  // Commissionerates & Zones State
  const [activeCommId, setActiveCommId] = useState<string>("comm_fbd");
  const [commSubTab, setCommSubTab] = useState<"zones" | "stations" | "overview">("zones");

  // Armed Police State
  const [armedSubTab, setArmedSubTab] = useState<"all" | "hap" | "irb">("all");

  // GRP State
  const [grpSubTab, setGrpSubTab] = useState<"all" | "ambala" | "faridabad" | "hisar" | "subdivisions">("all");

  // Forensic Labs & Training State
  const [forensicSubTab, setForensicSubTab] = useState<"labs" | "training">("labs");

  // Deputation & Specialized Wings State
  const [deputationSubTab, setDeputationSubTab] = useState<"state" | "central" | "specialised">("state");

  // Hierarchy Tree Expanded State
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

  // Unified Modal State for Add & Edit
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<EntityType | null>(null);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [savingModal, setSavingModal] = useState(false);

  // Delete Confirmation Modal State (with explicit OK & Cancel)
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [pendingDeleteEntity, setPendingDeleteEntity] = useState<{
    type: EntityType;
    id: string;
    name: string;
  } | null>(null);
  const [deletingEntity, setDeletingEntity] = useState(false);

  // Developer Admin Access Check
  const isDeveloper =
    (sessionUser?.id === "cms_developer_admin" || sessionUser?.role === "SUPER_ADMIN") &&
    !isViewAs;

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/locations");
      if (!res.ok) {
        if (res.status === 403) throw new Error("403 - Developer Administrator Access Required.");
        throw new Error("Failed to load organization data.");
      }
      const data = await res.json();
      setStates(data.states || []);
      setRanges(data.ranges || []);
      setDistricts(data.districts || []);
      setOffices(data.offices || []);
      setPoliceStations(data.policeStations || []);
      setSpecializedUnits(data.specializedUnits || []);
      setHierarchy(data.hierarchy || []);
      setStats(data.stats || null);

      if (data.ranges?.length && !activeRangeDetailId) {
        setActiveRangeDetailId(data.ranges[0].id);
      }

      if (data.districts?.length && !activeDistrictDetailId) {
        setActiveDistrictDetailId(data.districts[0].id);
      }

      // Auto-expand top level of hierarchy tree
      const initialExpanded: Record<string, boolean> = {};
      (data.hierarchy || []).forEach((st: HierarchyTreeNode) => {
        initialExpanded[st.id] = true;
        (st.children || []).forEach((c: HierarchyTreeNode) => {
          initialExpanded[c.id] = true;
        });
      });
      setExpandedNodes(initialExpanded);
    } catch (e: any) {
      setError(e.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isDeveloper) {
      loadData();
    }
  }, [isDeveloper]);

  const setTab = (tab: AdminTab) => {
    router.push(`/admin/locations?tab=${tab}`);
  };

  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev) => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };

  const expandAll = () => {
    const all: Record<string, boolean> = {};
    const traverse = (nodes: HierarchyTreeNode[]) => {
      nodes.forEach((n) => {
        all[n.id] = true;
        if (n.children?.length) traverse(n.children);
      });
    };
    traverse(hierarchy);
    setExpandedNodes(all);
  };

  const collapseAll = () => {
    setExpandedNodes({});
  };

  // Toggle Entity Status
  const handleToggleStatus = async (
    entityType: EntityType,
    id: string,
    currentStatus: MasterEntityStatus
  ) => {
    const nextStatus: MasterEntityStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      const res = await fetch("/api/admin/locations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityType,
          id,
          action: "toggle-status",
          status: nextStatus,
        }),
      });
      if (!res.ok) throw new Error("Status update failed.");
      await loadData();
    } catch (err: any) {
      alert(err.message || "Failed to toggle status.");
    }
  };

  // Open Add Modal
  const openAddModal = (type: EntityType) => {
    setModalType(type);
    setModalMode("add");
    setEditingId(null);

    const defaultState = states[0] || { id: "st_hr_01", name: "Haryana" };
    const defaultRange = ranges[0] || { id: "rng_knl_01", name: "Karnal Range" };
    const defaultDistrict = districts[0] || { id: "dst_pnp_01", name: "Panipat" };

    if (type === "state") {
      setFormData({
        name: "",
        code: "",
        stateHeadquarters: "Panchkula",
        phqName: "Police Headquarters (PHQ)",
        phqAddress: "Sector 6, Panchkula",
        dgpOffice: "Office of Director General of Police",
        status: "ACTIVE",
      });
    } else if (type === "range") {
      setFormData({
        name: "",
        code: "",
        stateId: defaultState.id,
        stateName: defaultState.name,
        rangeHeadquarters: "",
        igOffice: "Office of Inspector General of Police",
        address: "",
        status: "ACTIVE",
      });
    } else if (type === "district") {
      setFormData({
        name: "",
        code: "",
        stateId: defaultState.id,
        stateName: defaultState.name,
        rangeId: defaultRange.id,
        rangeName: defaultRange.name,
        districtHeadquarters: "",
        spOffice: "Office of Superintendent of Police",
        spOfficeAddress: "Mini Secretariat",
        contactPhone: "",
        email: "",
        status: "ACTIVE",
      });
    } else if (type === "office") {
      setFormData({
        name: "",
        code: "",
        officeType: "SP_OFFICE" as OfficeType,
        stateId: defaultState.id,
        stateName: defaultState.name,
        rangeId: defaultRange.id,
        rangeName: defaultRange.name,
        districtId: defaultDistrict.id,
        districtName: defaultDistrict.name,
        physicalAddress: "",
        officeHead: "",
        contactPhone: "",
        status: "ACTIVE",
      });
    } else if (type === "station") {
      setFormData({
        name: "",
        code: "",
        stateId: defaultState.id,
        stateName: defaultState.name,
        rangeId: defaultDistrict.rangeId || defaultRange.id,
        rangeName: defaultDistrict.rangeName || defaultRange.name,
        districtId: defaultDistrict.id,
        districtName: defaultDistrict.name,
        subDivision: `${defaultDistrict.name} City`,
        stationType: "URBAN" as StationType,
        address: "",
        shoOfficeDetails: "Room 1, Ground Floor",
        contactPhone: "",
        email: "",
        status: "ACTIVE",
      });
    } else if (type === "unit") {
      setFormData({
        name: "",
        code: "",
        unitType: "CIA" as UnitType,
        stateId: defaultState.id,
        stateName: defaultState.name,
        rangeId: defaultDistrict.rangeId || defaultRange.id,
        rangeName: defaultDistrict.rangeName || defaultRange.name,
        districtId: defaultDistrict.id,
        districtName: defaultDistrict.name,
        physicalLocation: "Police Lines",
        unitHead: "Inspector Incharge",
        contactPhone: "",
        status: "ACTIVE",
      });
    }

    setModalOpen(true);
  };

  // Open Edit Modal (Supports shifting between Range, District, Sub-Division, or Parent)
  const openEditModal = (type: EntityType, entity: any) => {
    setModalType(type);
    setModalMode("edit");
    setEditingId(entity.id);
    setFormData({ ...entity });
    setModalOpen(true);
  };

  // Save Modal (Create or Update)
  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.code) {
      alert("Please fill all required fields (Name, Code).");
      return;
    }

    setSavingModal(true);
    try {
      if (modalMode === "add") {
        const res = await fetch("/api/admin/locations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ entityType: modalType, data: formData }),
        });
        const d = await res.json();
        if (!res.ok) throw new Error(d.error || "Creation failed.");
        setSuccessMsg(`New ${modalType} '${formData.name}' created successfully!`);
      } else {
        const res = await fetch("/api/admin/locations", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ entityType: modalType, id: editingId, updates: formData }),
        });
        const d = await res.json();
        if (!res.ok) throw new Error(d.error || "Update failed.");
        setSuccessMsg(`${formData.name} updated / shifted successfully!`);
      }

      setModalOpen(false);
      await loadData();
    } catch (err: any) {
      alert(err.message || "Failed to save.");
    } finally {
      setSavingModal(false);
    }
  };

  // Delete Entity with Strict Hierarchy Integrity Check
  const handleDeleteEntity = async (type: EntityType, id: string, name: string) => {
    // 1. Hierarchy integrity client pre-check for immediate helpful feedback
    if (type === "range") {
      const childDistricts = districts.filter(
        (d) => d.rangeId === id || d.rangeName?.toLowerCase() === name.toLowerCase()
      );
      const childOffices = offices.filter((o) => o.rangeId === id && !o.districtId);
      const childUnits = specializedUnits.filter((u) => u.rangeId === id && !u.districtId);

      if (childDistricts.length > 0 || childOffices.length > 0 || childUnits.length > 0) {
        const reasons: string[] = [];
        if (childDistricts.length > 0) {
          reasons.push(`${childDistricts.length} District(s) (${childDistricts.map((d) => d.name).join(", ")})`);
        }
        if (childOffices.length > 0) reasons.push(`${childOffices.length} Direct Office(s)`);
        if (childUnits.length > 0) reasons.push(`${childUnits.length} Direct Unit(s)`);
        alert(
          `⚠️ Deletion Blocked: Cannot delete Range "${name}"\n\nThis Range is NOT empty in the organizational hierarchy. It contains:\n• ${reasons.join("\n• ")}\n\nYou must shift or delete all subordinate entities first before this Range can be deleted.`
        );
        return;
      }
    }

    if (type === "district") {
      const childStations = policeStations.filter(
        (ps) => ps.districtId === id || ps.districtName?.toLowerCase() === name.toLowerCase()
      );
      const childOffices = offices.filter((o) => o.districtId === id);
      const childUnits = specializedUnits.filter((u) => u.districtId === id);

      if (childStations.length > 0 || childOffices.length > 0 || childUnits.length > 0) {
        const reasons: string[] = [];
        if (childStations.length > 0) {
          reasons.push(`${childStations.length} Police Station(s) (${childStations.slice(0, 3).map((s) => s.name).join(", ")}${childStations.length > 3 ? "..." : ""})`);
        }
        if (childOffices.length > 0) reasons.push(`${childOffices.length} Administrative Office(s)`);
        if (childUnits.length > 0) reasons.push(`${childUnits.length} Specialized Unit(s)`);
        alert(
          `⚠️ Deletion Blocked: Cannot delete District "${name}"\n\nThis District is NOT empty in the organizational hierarchy. It contains:\n• ${reasons.join("\n• ")}\n\nYou must shift or delete all subordinate entities first before this District can be deleted.`
        );
        return;
      }
    }

    if (type === "office") {
      const childOffices = offices.filter((o) => o.parentOfficeId === id);
      const childUnits = specializedUnits.filter((u) => u.parentOfficeId === id);
      if (childOffices.length > 0 || childUnits.length > 0) {
        alert(
          `⚠️ Deletion Blocked: Cannot delete Office "${name}"\n\nThis Office has subordinate entities linked to it (${childOffices.length} child office(s), ${childUnits.length} specialized unit(s)). Please reassign or delete subordinate entities first.`
        );
        return;
      }
    }

    if (type === "station") {
      const linkedUnits = specializedUnits.filter((u) => u.associatedPoliceStationId === id);
      if (linkedUnits.length > 0) {
        alert(
          `⚠️ Deletion Blocked: Cannot delete Police Station "${name}"\n\nThis Station has ${linkedUnits.length} specialized unit(s) linked to it (${linkedUnits.map((u) => u.name).join(", ")}). Reassign or delete them first.`
        );
        return;
      }
    }

    if (type === "state") {
      const childRanges = ranges.filter((r) => r.stateId === id);
      const childOffices = offices.filter((o) => o.stateId === id);
      if (childRanges.length > 0 || childOffices.length > 0) {
        alert(
          `⚠️ Deletion Blocked: Cannot delete State "${name}"\n\nThis State is NOT empty. It contains ${childRanges.length} Range(s) and ${childOffices.length} State Office(s).`
        );
        return;
      }
    }

    // Hierarchy check passed (entity is confirmed empty).
    // Open explicit Confirmation Modal with OK and Cancel.
    setPendingDeleteEntity({ type, id, name });
    setShowDeleteConfirmModal(true);
  };

  const confirmExecuteDelete = async () => {
    if (!pendingDeleteEntity) return;
    const { type, id, name } = pendingDeleteEntity;
    setDeletingEntity(true);
    try {
      const res = await fetch(`/api/admin/locations?entityType=${type}&id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        alert(`❌ Deletion Failed: ${result.error || "Could not delete entity."}`);
        return;
      }
      setSuccessMsg(`Successfully deleted ${name}`);
      setShowDeleteConfirmModal(false);
      setPendingDeleteEntity(null);
      await loadData();
    } catch (err: any) {
      alert(`❌ Error deleting entity: ${err.message}`);
    } finally {
      setDeletingEntity(false);
    }
  };

  // If unauthorized
  if (!isDeveloper) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <div className="bg-white max-w-md w-full p-6 rounded-2xl border border-red-200 shadow-md text-center space-y-4">
          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto">
            <Shield className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Developer Administrator Required</h2>
          <p className="text-xs text-slate-600">
            Location & Organization Management is a centralized administrative master module
            restricted exclusively to the Developer Administrator.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <Link
              href="/"
              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const selectedDistrict = districts.find((d) => d.id === activeDistrictDetailId);

  // Range Hub Derived State
  const selectedRange = ranges.find((r) => r.id === activeRangeDetailId) || ranges[0];
  const rangeDistricts = selectedRange ? districts.filter((d) => d.rangeId === selectedRange.id) : [];
  const rangeDistrictIds = new Set(rangeDistricts.map((d) => d.id));
  const rangeStations = selectedRange
    ? policeStations.filter((ps) => ps.rangeId === selectedRange.id || Boolean(ps.districtId && rangeDistrictIds.has(ps.districtId)))
    : [];
  const rangeOffices = selectedRange
    ? offices.filter((o) => o.rangeId === selectedRange.id || Boolean(o.districtId && rangeDistrictIds.has(o.districtId)))
    : [];
  const rangeUnits = selectedRange
    ? specializedUnits.filter((u) => u.rangeId === selectedRange.id || Boolean(u.districtId && rangeDistrictIds.has(u.districtId)))
    : [];

  return (
    <div className="space-y-6 animate-in fade-in-50 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-blue-100 text-[#1e3a8a] text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
              Developer Master
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-medium">Haryana Police Administrative Master</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-[#1e3a8a]" />
            Location & Organization Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Add, edit, shift and maintain States, Ranges, Districts, Headquarters, Administrative Offices, Police Stations and Units.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className={cn("w-3.5 h-3.5 text-slate-500", loading && "animate-spin")} />
            <span>Sync</span>
          </button>
          <Link
            href="/admin/accounts"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors shadow-2xs"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Account Management →</span>
          </Link>
        </div>
      </div>

      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMsg(null)}
            className="text-emerald-600 hover:text-emerald-900 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-slate-200 text-xs pb-px scrollbar-none">
        {[
          { key: "dashboard", label: "Dashboard Overview", icon: Layers },
          { key: "states", label: "State Master", count: states.length, icon: MapPin },
          { key: "ranges", label: "Ranges", count: ranges.length, icon: Network },
          { key: "commissionerates", label: "Commissionerates & Zones", count: 5, icon: Landmark },
          { key: "districts", label: "Districts", count: districts.length, icon: Building2 },
          { key: "armed-police", label: "Armed Police (HAP/IRB)", count: 10, icon: ShieldAlert },
          { key: "grp", label: "GRP Haryana", count: 9, icon: Train },
          { key: "forensic-labs", label: "Forensic Labs & Training", count: 11, icon: FlaskConical },
          { key: "deputation-units", label: "Deputation & Special Wings", count: 23, icon: Briefcase },
          { key: "offices", label: "Administrative Offices", count: offices.length, icon: Building },
          { key: "stations", label: "Police Stations", count: policeStations.length, icon: Shield },
          { key: "units", label: "Specialized Units", count: specializedUnits.length, icon: Radio },
          { key: "hierarchy", label: "Organizational Hierarchy", icon: FolderTree },
        ].map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key as AdminTab)}
              className={cn(
                "flex items-center gap-2 px-3.5 py-2.5 font-semibold transition-all border-b-2 whitespace-nowrap cursor-pointer",
                isActive
                  ? "border-[#1e3a8a] text-[#1e3a8a] bg-blue-50/50"
                  : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300"
              )}
            >
              <Icon className={cn("w-3.5 h-3.5", isActive ? "text-[#1e3a8a]" : "text-slate-400")} />
              <span>{t.label}</span>
              {t.count !== undefined && (
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.2 rounded-full font-mono",
                    isActive ? "bg-blue-200/70 text-[#1e3a8a]" : "bg-slate-100 text-slate-600"
                  )}
                >
                  {t.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {loading && (
        <div className="p-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
          <span>Synchronizing organization records...</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* TAB 1: DASHBOARD OVERVIEW */}
      {!loading && activeTab === "dashboard" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: "States", val: states.length, sub: "State Command", color: "blue" },
              { label: "Ranges", val: ranges.length, sub: "Police Ranges", color: "indigo" },
              { label: "Districts", val: districts.length, sub: "Revenue Districts", color: "purple" },
              { label: "Admin Offices", val: offices.length, sub: "PHQ / IG / SP Offices", color: "emerald" },
              { label: "Police Stations", val: policeStations.length, sub: "Territorial PS", color: "amber" },
              { label: "Special Units", val: specializedUnits.length, sub: "CIA / Cyber / Traffic", color: "rose" },
            ].map((k) => (
              <div
                key={k.label}
                className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-1 hover:border-slate-300 transition-colors"
              >
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  {k.label}
                </span>
                <div className="text-2xl font-black text-slate-900">{k.val}</div>
                <div className="text-[10px] text-slate-400 truncate">{k.sub}</div>
              </div>
            ))}
          </div>

          {/* Quick Insights Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <Network className="w-4 h-4 text-[#1e3a8a]" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Districts Distribution by Range
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => openAddModal("district")}
                  className="text-xs font-bold text-blue-700 hover:text-blue-900"
                >
                  + Add District
                </button>
              </div>
              <div className="divide-y divide-slate-100">
                {ranges.map((r) => {
                  const count = districts.filter((d) => d.rangeId === r.id).length;
                  return (
                    <div
                      key={r.id}
                      onClick={() => {
                        setActiveRangeDetailId(r.id);
                        setTab("ranges");
                      }}
                      className="py-2 flex items-center justify-between text-xs cursor-pointer hover:bg-slate-50 px-2 rounded-lg transition-colors"
                      title="Open in Range Hub"
                    >
                      <div>
                        <span className="font-semibold text-slate-800 hover:text-blue-700">{r.name}</span>
                        <span className="text-[10px] text-slate-400 ml-2 font-mono">({r.code})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{count} Districts</span>
                        <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                          HQ: {r.rangeHeadquarters}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-700" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Infrastructure by District
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => openAddModal("station")}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-900"
                >
                  + Add Station
                </button>
              </div>
              <div className="divide-y divide-slate-100">
                {districts.map((d) => {
                  const psCount = policeStations.filter((ps) => ps.districtId === d.id).length;
                  const unitCount = specializedUnits.filter((u) => u.districtId === d.id).length;
                  const officeCount = offices.filter((o) => o.districtId === d.id).length;
                  return (
                    <div key={d.id} className="py-2 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-slate-800">{d.name}</span>
                        <span className="text-[10px] text-slate-400 ml-2">Range: {d.rangeName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] px-2 py-0.5 bg-blue-50 text-[#1e3a8a] border border-blue-200 font-medium rounded">
                          {psCount} Stations
                        </span>
                        <span className="text-[10px] px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 font-medium rounded">
                          {unitCount} Units
                        </span>
                        <span className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium rounded">
                          {officeCount} Offices
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: STATE MANAGEMENT */}
      {!loading && activeTab === "states" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">State Headquarters Master</h2>
              <p className="text-[11px] text-slate-500">Configure State Police Headquarter (PHQ) and DGP Office jurisdiction.</p>
            </div>
            <button
              type="button"
              onClick={() => openAddModal("state")}
              className="px-3 py-1.5 bg-[#1e3a8a] text-white text-xs font-bold rounded-xl hover:bg-[#152865] flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add State</span>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-600 uppercase">
                <tr>
                  <th className="p-3">State</th>
                  <th className="p-3">State Code</th>
                  <th className="p-3">State Headquarters</th>
                  <th className="p-3">PHQ Details</th>
                  <th className="p-3">DGP Office</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {states.map((st) => (
                  <tr key={st.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-3 font-bold text-slate-900">{st.name}</td>
                    <td className="p-3 font-mono font-semibold text-slate-700">{st.code}</td>
                    <td className="p-3 text-slate-700">{st.stateHeadquarters}</td>
                    <td className="p-3">
                      <div className="font-medium text-slate-800">{st.phqName}</div>
                      <div className="text-[10px] text-slate-400">{st.phqAddress}</div>
                    </td>
                    <td className="p-3 text-slate-700">{st.dgpOffice}</td>
                    <td className="p-3">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-semibold border",
                          st.status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-slate-100 text-slate-600 border-slate-200"
                        )}
                      >
                        {st.status}
                      </span>
                    </td>
                    <td className="p-3 text-right space-x-1 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => openEditModal("state", st)}
                        className="text-blue-700 hover:text-blue-900 text-xs px-2 py-1 rounded border border-blue-200 hover:bg-blue-50 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleStatus("state", st.id, st.status)}
                        className="text-slate-600 hover:text-slate-900 text-xs px-2 py-1 rounded border border-slate-200 hover:bg-slate-100 transition-colors"
                      >
                        {st.status === "ACTIVE" ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteEntity("state", st.id, st.name)}
                        className="text-red-600 hover:text-red-800 text-xs px-2 py-1 rounded border border-red-200 hover:bg-red-50 transition-colors inline-flex items-center gap-1"
                        title="Delete State"
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: RANGE MANAGEMENT (Range Master & Infrastructure Hub) */}
      {!loading && activeTab === "ranges" && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Range Master & Infrastructure Hub</h2>
              <p className="text-[11px] text-slate-500">
                Select or Add Ranges / Commissionerates, inspect supervisory jurisdiction, linked districts, and stations.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <select
                aria-label="Select Range"
                value={activeRangeDetailId || ""}
                onChange={(e) => setActiveRangeDetailId(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {ranges.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.code})
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => openAddModal("range")}
                className="px-3 py-1.5 bg-[#1e3a8a] text-white text-xs font-bold rounded-xl hover:bg-[#152865] flex items-center gap-1.5 shadow-2xs cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Range</span>
              </button>
            </div>
          </div>

          {selectedRange && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="p-5 border-b border-slate-100 bg-slate-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-bold">
                      {selectedRange.code}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      Supervisory Jurisdiction: <strong className="text-blue-900">{selectedRange.stateName || "Haryana Police (PHQ)"}</strong>
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900 mt-1">{selectedRange.name}</h3>
                  <p className="text-xs text-slate-600">{selectedRange.address}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    🏛️ Range Headquarters: <strong className="text-slate-700">{selectedRange.rangeHeadquarters}</strong> • IG: {selectedRange.igOffice}
                  </p>
                  <div className="pt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openEditModal("range", selectedRange)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100"
                    >
                      <ArrowRightLeft className="w-3 h-3" />
                      <span>Edit Range Details</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteEntity("range", selectedRange.id, selectedRange.name)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Delete Range</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 shrink-0">
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-center min-w-[70px]">
                    <div className="text-base font-black text-blue-700">
                      {rangeDistricts.length}
                    </div>
                    <div className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">Districts</div>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-center min-w-[70px]">
                    <div className="text-base font-black text-indigo-700">
                      {rangeStations.length}
                    </div>
                    <div className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">Stations</div>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-center min-w-[70px]">
                    <div className="text-base font-black text-purple-700">
                      {rangeOffices.length}
                    </div>
                    <div className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">Offices</div>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-center min-w-[70px]">
                    <div className="text-base font-black text-emerald-700">
                      {rangeUnits.length}
                    </div>
                    <div className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">Units</div>
                  </div>
                </div>
              </div>

              {/* Sub-tabs */}
              <div className="flex border-b border-slate-200 bg-slate-50/70 text-xs px-4 overflow-x-auto">
                {[
                  { key: "overview", label: "Overview" },
                  { key: "districts", label: `Districts (${rangeDistricts.length})` },
                  { key: "stations", label: `Police Stations (${rangeStations.length})` },
                  { key: "offices", label: `Offices (${rangeOffices.length})` },
                  { key: "units", label: `Specialized Units (${rangeUnits.length})` },
                ].map((st) => (
                  <button
                    key={st.key}
                    type="button"
                    onClick={() => setRangeSubTab(st.key as any)}
                    className={cn(
                      "px-4 py-2.5 font-bold transition-colors border-b-2 cursor-pointer whitespace-nowrap",
                      rangeSubTab === st.key
                        ? "border-[#1e3a8a] text-[#1e3a8a] bg-white"
                        : "border-transparent text-slate-600 hover:text-slate-900"
                    )}
                  >
                    {st.label}
                  </button>
                ))}
              </div>

              {/* SUBTAB: OVERVIEW */}
              {rangeSubTab === "overview" && (
                <div className="p-5 space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-3 bg-slate-50 rounded-lg space-y-1 border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Inspector General of Police (IG) Office</span>
                      <div className="font-bold text-slate-800 text-sm">{selectedRange.igOffice}</div>
                      <div className="text-slate-500">{selectedRange.address}</div>
                      {selectedRange.digOffice && (
                        <div className="text-[11px] text-slate-600 pt-1">
                          <strong className="text-slate-700">DIG Office:</strong> {selectedRange.digOffice}
                        </div>
                      )}
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg space-y-1 border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Headquarters & Jurisdiction</span>
                      <div className="font-bold text-slate-800 text-sm">{selectedRange.rangeHeadquarters}</div>
                      <div className="text-slate-500">Supervisory Jurisdiction: {selectedRange.stateName || "Haryana Police (PHQ)"}</div>
                      <div className="text-[11px] text-slate-600 pt-1">
                        <strong className="text-slate-700">Active Status:</strong>{" "}
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {selectedRange.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50/60 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                        Linked Police Districts ({rangeDistricts.length})
                      </span>
                      <button
                        type="button"
                        onClick={() => openAddModal("district")}
                        className="text-xs text-blue-700 hover:text-blue-900 font-bold"
                      >
                        + Add District
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {rangeDistricts.length > 0 ? (
                        rangeDistricts.map((d) => (
                          <div
                            key={d.id}
                            className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 flex items-center gap-2 shadow-2xs hover:border-blue-300 transition-colors"
                          >
                            <div>
                              <div className="font-bold text-slate-900 text-xs">{d.name}</div>
                              <div className="text-[10px] text-slate-400">
                                {d.code} • {policeStations.filter((ps) => ps.districtId === d.id).length} Stations
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveDistrictDetailId(d.id);
                                setTab("districts");
                              }}
                              className="text-[10px] font-bold text-blue-700 hover:text-blue-900 ml-1 underline"
                              title="Inspect District in District Hub"
                            >
                              View Hub →
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="text-xs text-slate-400 italic">No districts linked yet. Click + Add District to link one.</div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* SUBTAB: DISTRICTS */}
              {rangeSubTab === "districts" && (
                <div className="divide-y divide-slate-100">
                  <div className="p-3 bg-slate-50 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">Districts under {selectedRange.name}</span>
                    <button
                      type="button"
                      onClick={() => openAddModal("district")}
                      className="px-2.5 py-1 text-xs bg-[#1e3a8a] text-white rounded-lg font-bold"
                    >
                      + Add District to {selectedRange.name}
                    </button>
                  </div>
                  {rangeDistricts.length > 0 ? (
                    rangeDistricts.map((d) => {
                      const stCount = policeStations.filter((ps) => ps.districtId === d.id).length;
                      const ofCount = offices.filter((o) => o.districtId === d.id).length;
                      const unCount = specializedUnits.filter((u) => u.districtId === d.id).length;
                      return (
                        <div key={d.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 text-sm">{d.name} District</span>
                              <span className="font-mono text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-bold">{d.code}</span>
                            </div>
                            <div className="text-[11px] text-slate-600 mt-0.5">
                              {d.spOffice} • {d.spOfficeAddress}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              📞 {d.contactPhone} • ✉️ {d.email} • {stCount} Stations • {ofCount} Offices • {unCount} Units
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setActiveDistrictDetailId(d.id);
                                setTab("districts");
                              }}
                              className="px-2.5 py-1 text-xs text-blue-800 bg-blue-50 border border-blue-200 rounded font-bold hover:bg-blue-100"
                            >
                              District Hub →
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditModal("district", d)}
                              className="px-2 py-1 text-xs text-slate-700 bg-slate-100 border border-slate-200 rounded font-semibold hover:bg-slate-200"
                            >
                              Edit / Shift
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteEntity("district", d.id, d.name)}
                              className="px-2 py-1 text-xs text-red-700 bg-red-50 border border-red-200 rounded font-semibold hover:bg-red-100 flex items-center gap-1"
                              title="Delete District"
                            >
                              <Trash2 className="w-3 h-3" />
                              Delete
                            </button>
                            <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {d.status}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-6 text-center text-xs text-slate-400">
                      No districts currently linked to this range.
                    </div>
                  )}
                </div>
              )}

              {/* SUBTAB: POLICE STATIONS */}
              {rangeSubTab === "stations" && (
                <div className="divide-y divide-slate-100">
                  <div className="p-3 bg-slate-50 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">Police Stations under {selectedRange.name} Jurisdiction</span>
                    <button
                      type="button"
                      onClick={() => openAddModal("station")}
                      className="px-2.5 py-1 text-xs bg-[#1e3a8a] text-white rounded-lg font-bold"
                    >
                      + Add Station
                    </button>
                  </div>
                  {rangeStations.length > 0 ? (
                    rangeStations.map((ps) => (
                      <div key={ps.id} className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-50">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{ps.name}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                              {ps.districtName}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            Code: <span className="font-mono">{ps.code}</span> • Sub-Div: {ps.subDivision || "N/A"} • Type: {ps.stationType}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">📞 {ps.contactPhone} • {ps.address}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal("station", ps)}
                            className="px-2 py-0.5 text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded font-semibold hover:bg-blue-100"
                          >
                            Edit / Shift
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteEntity("station", ps.id, ps.name)}
                            className="px-2 py-0.5 text-xs text-red-700 bg-red-50 border border-red-200 rounded font-semibold hover:bg-red-100 flex items-center gap-1"
                            title="Delete Police Station"
                          >
                            <Trash2 className="w-3 h-3" />
                            Delete
                          </button>
                          <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {ps.status}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-xs text-slate-400">
                      No police stations recorded in this range.
                    </div>
                  )}
                </div>
              )}

              {/* SUBTAB: OFFICES */}
              {rangeSubTab === "offices" && (
                <div className="divide-y divide-slate-100">
                  <div className="p-3 bg-slate-50 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">Administrative Offices under {selectedRange.name}</span>
                    <button
                      type="button"
                      onClick={() => openAddModal("office")}
                      className="px-2.5 py-1 text-xs bg-purple-800 text-white rounded-lg font-bold"
                    >
                      + Add Office
                    </button>
                  </div>
                  {rangeOffices.length > 0 ? (
                    rangeOffices.map((o) => (
                      <div key={o.id} className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-50">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{o.name}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 font-semibold border border-purple-200">
                              {o.districtName || selectedRange.name}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            Code: <span className="font-mono">{o.code}</span> • Type: {o.officeType} • Head: {o.officeHead}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{o.physicalAddress}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal("office", o)}
                            className="px-2 py-0.5 text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded font-semibold hover:bg-blue-100"
                          >
                            Edit / Shift
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteEntity("office", o.id, o.name)}
                            className="px-2 py-0.5 text-xs text-red-700 bg-red-50 border border-red-200 rounded font-semibold hover:bg-red-100 flex items-center gap-1"
                            title="Delete Office"
                          >
                            <Trash2 className="w-3 h-3" />
                            Delete
                          </button>
                          <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {o.status}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-xs text-slate-400">
                      No administrative offices recorded in this range.
                    </div>
                  )}
                </div>
              )}

              {/* SUBTAB: UNITS */}
              {rangeSubTab === "units" && (
                <div className="divide-y divide-slate-100">
                  <div className="p-3 bg-slate-50 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">Specialized Units under {selectedRange.name}</span>
                    <button
                      type="button"
                      onClick={() => openAddModal("unit")}
                      className="px-2.5 py-1 text-xs bg-emerald-800 text-white rounded-lg font-bold"
                    >
                      + Add Unit
                    </button>
                  </div>
                  {rangeUnits.length > 0 ? (
                    rangeUnits.map((u) => (
                      <div key={u.id} className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-50">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{u.name}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                              {u.districtName || selectedRange.name}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            Code: <span className="font-mono">{u.code}</span> • Type: {u.unitType} • Head: {u.unitHead}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">Location: {u.physicalLocation}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal("unit", u)}
                            className="px-2 py-0.5 text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded font-semibold hover:bg-blue-100"
                          >
                            Edit / Shift
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteEntity("unit", u.id, u.name)}
                            className="px-2 py-0.5 text-xs text-red-700 bg-red-50 border border-red-200 rounded font-semibold hover:bg-red-100 flex items-center gap-1"
                            title="Delete Specialized Unit"
                          >
                            <Trash2 className="w-3 h-3" />
                            Delete
                          </button>
                          <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {u.status}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-xs text-slate-400">
                      No specialized units recorded in this range.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB: COMMISSIONERATES & ZONES MANAGEMENT */}
      {!loading && activeTab === "commissionerates" && (() => {
        const selectedComm = COMMISSIONERATES_MASTER_DATA.find((c) => c.id === activeCommId) || COMMISSIONERATES_MASTER_DATA[0];
        const totalZones = selectedComm.zones.length;
        const totalStationsInComm = selectedComm.zones.reduce((acc, z) => acc + z.stations.length, 0);

        return (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Landmark className="w-4 h-4 text-[#1e3a8a]" />
                  <span>Police Commissionerates & Zones Management</span>
                </h2>
                <p className="text-[11px] text-slate-500">
                  Manage urban Police Commissionerates (Gurugram, Faridabad, Panchkula, Sonipat, Jhajjar) with DCP Zones & Station Allocations.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  aria-label="Select Commissionerate"
                  value={activeCommId}
                  onChange={(e) => setActiveCommId(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {COMMISSIONERATES_MASTER_DATA.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => openAddModal("office")}
                  className="px-3 py-1.5 bg-[#1e3a8a] text-white text-xs font-bold rounded-xl hover:bg-[#152865] flex items-center gap-1.5 shadow-2xs cursor-pointer whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add Commissionerate</span>
                </button>
              </div>
            </div>

            {selectedComm && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
                <div className="p-5 border-b border-slate-100 bg-slate-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] bg-blue-100 text-[#1e3a8a] px-1.5 py-0.5 rounded font-bold border border-blue-200">
                        {selectedComm.code}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">
                        Command: <strong className="text-slate-800">{selectedComm.cpOffice}</strong>
                      </span>
                    </div>
                    <h3 className="text-lg font-black text-slate-900 mt-1">{selectedComm.name}</h3>
                    <p className="text-xs text-slate-600">{selectedComm.address}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      📞 {selectedComm.contactPhone} • ✉️ {selectedComm.email}
                    </p>
                    <div className="pt-2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openAddModal("office")}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100"
                      >
                        <Plus className="w-3 h-3" />
                        <span>+ Add Zone</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => openAddModal("station")}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200 rounded-lg hover:bg-slate-200"
                      >
                        <Plus className="w-3 h-3" />
                        <span>+ Add Station to Commissionerate</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteEntity("range", selectedComm.id, selectedComm.name)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Delete Commissionerate</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 shrink-0">
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-center min-w-[75px]">
                      <div className="text-base font-black text-blue-700">{totalZones}</div>
                      <div className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">DCP Zones</div>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-center min-w-[75px]">
                      <div className="text-base font-black text-indigo-700">{totalStationsInComm}</div>
                      <div className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">Stations</div>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-center min-w-[75px]">
                      <div className="text-base font-black text-emerald-700">ACTIVE</div>
                      <div className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">Status</div>
                    </div>
                  </div>
                </div>

                {/* Sub-tabs */}
                <div className="flex border-b border-slate-200 bg-slate-50/70 text-xs px-4">
                  {[
                    { key: "zones", label: `DCP Zones & Divisions (${totalZones})` },
                    { key: "stations", label: `Police Stations (${totalStationsInComm})` },
                    { key: "overview", label: "Commissionerate Overview" },
                  ].map((st) => (
                    <button
                      key={st.key}
                      type="button"
                      onClick={() => setCommSubTab(st.key as any)}
                      className={cn(
                        "px-4 py-2.5 font-bold transition-colors border-b-2 cursor-pointer",
                        commSubTab === st.key
                          ? "border-[#1e3a8a] text-[#1e3a8a] bg-white"
                          : "border-transparent text-slate-600 hover:text-slate-900"
                      )}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>

                {commSubTab === "zones" && (
                  <div className="divide-y divide-slate-100">
                    <div className="p-3 bg-slate-50 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">DCP Zones under {selectedComm.name}</span>
                      <button
                        type="button"
                        onClick={() => openAddModal("office")}
                        className="px-2.5 py-1 text-xs bg-[#1e3a8a] text-white rounded-lg font-bold"
                      >
                        + Add Zone
                      </button>
                    </div>
                    {selectedComm.zones.map((zone) => (
                      <div key={zone.id} className="p-4 hover:bg-slate-50/70 space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 text-sm">{zone.name}</span>
                              <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.2 rounded font-bold uppercase">
                                CORE
                              </span>
                              <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.2 rounded font-medium">
                                Zone Command
                              </span>
                            </div>
                            <div className="text-xs text-slate-600 mt-0.5">
                              👮 {zone.dcp} • 📞 {zone.phone}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => openAddModal("station")}
                              className="px-2 py-1 text-xs bg-blue-50 text-blue-800 border border-blue-200 rounded font-semibold hover:bg-blue-100"
                            >
                              + Assign Station
                            </button>
                            <button
                              type="button"
                              onClick={() => openAddModal("office")}
                              className="px-2 py-1 text-xs bg-slate-100 text-slate-700 border border-slate-200 rounded font-semibold hover:bg-slate-200"
                            >
                              Edit / Shift
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteEntity("office", zone.id, zone.name)}
                              className="px-2 py-1 text-xs text-red-700 bg-red-50 border border-red-200 rounded font-semibold hover:bg-red-100 flex items-center gap-1"
                              title="Delete Zone"
                            >
                              <Trash2 className="w-3 h-3" />
                              Delete
                            </button>
                          </div>
                        </div>

                        {/* Stations in this zone */}
                        <div className="pt-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                            Assigned Police Stations ({zone.stations.length}):
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {zone.stations.map((stn, idx) => (
                              <span
                                key={idx}
                                className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 font-medium shadow-2xs flex items-center gap-1.5"
                              >
                                <Shield className="w-3 h-3 text-blue-600" />
                                <span>{stn}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {commSubTab === "stations" && (
                  <div className="divide-y divide-slate-100">
                    <div className="p-3 bg-slate-50 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">Police Stations under {selectedComm.name}</span>
                      <button
                        type="button"
                        onClick={() => openAddModal("station")}
                        className="px-2.5 py-1 text-xs bg-[#1e3a8a] text-white rounded-lg font-bold"
                      >
                        + Add Police Station
                      </button>
                    </div>
                    {selectedComm.zones.flatMap((z) => z.stations.map((stName) => ({ zoneName: z.name, stName }))).map((item, idx) => (
                      <div key={idx} className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-50">
                        <div>
                          <div className="font-bold text-slate-900">{item.stName}</div>
                          <div className="text-[10px] text-slate-500">
                            Zone: <strong className="text-blue-900">{item.zoneName}</strong> • Urban Police Station
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openAddModal("station")}
                            className="px-2 py-0.5 text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded font-semibold hover:bg-blue-100"
                          >
                            Edit / Shift Zone
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteEntity("station", item.stName, item.stName)}
                            className="px-2 py-0.5 text-xs text-red-700 bg-red-50 border border-red-200 rounded font-semibold hover:bg-red-100 flex items-center gap-1"
                            title="Delete Station"
                          >
                            <Trash2 className="w-3 h-3" />
                            Delete
                          </button>
                          <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                            ACTIVE
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {commSubTab === "overview" && (
                  <div className="p-5 space-y-4 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-3 bg-slate-50 rounded-lg space-y-1 border border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Commissioner of Police Office</span>
                        <div className="font-bold text-slate-800 text-sm">{selectedComm.cpOffice}</div>
                        <div className="text-slate-500">{selectedComm.address}</div>
                        <div className="text-[11px] text-slate-600 pt-1">
                          📞 {selectedComm.contactPhone} • ✉️ {selectedComm.email}
                        </div>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg space-y-1 border border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Zone & Division System</span>
                        <div className="font-bold text-slate-800 text-sm">{selectedComm.zones.length} Supervisory DCP Zones</div>
                        <div className="text-slate-500">Total Urban Stations: {totalStationsInComm}</div>
                        <div className="text-[11px] text-slate-600 pt-1">
                          <strong className="text-slate-700">Specialized Desks:</strong> Cyber Cell, Traffic Wings, Women Police Stations
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })()}

      {/* TAB 4: DISTRICT MANAGEMENT (With Shift & Edit Support) */}
      {!loading && activeTab === "districts" && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">District Master & Infrastructure Hub</h2>
              <p className="text-[11px] text-slate-500">
                Select or Add Districts, and shift their supervisory Range or inspect linked entities.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <select
                aria-label="Select District"
                value={activeDistrictDetailId || ""}
                onChange={(e) => setActiveDistrictDetailId(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {districts.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.rangeName})
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => openAddModal("district")}
                className="px-3 py-1.5 bg-[#1e3a8a] text-white text-xs font-bold rounded-xl hover:bg-[#152865] flex items-center gap-1.5 shadow-2xs cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add District</span>
              </button>
            </div>
          </div>

          {selectedDistrict && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="p-5 border-b border-slate-100 bg-slate-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-bold">
                      {selectedDistrict.code}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      Supervisory Range: <strong className="text-blue-900">{selectedDistrict.rangeName}</strong>
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900 mt-1">{selectedDistrict.name} District</h3>
                  <p className="text-xs text-slate-600">{selectedDistrict.spOfficeAddress}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    📞 {selectedDistrict.contactPhone} • ✉️ {selectedDistrict.email}
                  </p>
                  <div className="pt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openEditModal("district", selectedDistrict)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100"
                    >
                      <ArrowRightLeft className="w-3 h-3" />
                      <span>Edit / Shift Range</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteEntity("district", selectedDistrict.id, selectedDistrict.name)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Delete District</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 shrink-0">
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-center">
                    <div className="text-base font-black text-blue-700">
                      {policeStations.filter((ps) => ps.districtId === selectedDistrict.id).length}
                    </div>
                    <div className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">Stations</div>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-center">
                    <div className="text-base font-black text-purple-700">
                      {offices.filter((o) => o.districtId === selectedDistrict.id).length}
                    </div>
                    <div className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">Offices</div>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-center">
                    <div className="text-base font-black text-emerald-700">
                      {specializedUnits.filter((u) => u.districtId === selectedDistrict.id).length}
                    </div>
                    <div className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">Units</div>
                  </div>
                </div>
              </div>

              {/* Sub-tabs */}
              <div className="flex border-b border-slate-200 bg-slate-50/70 text-xs px-4">
                {[
                  { key: "overview", label: "Overview" },
                  { key: "stations", label: `Police Stations (${policeStations.filter((ps) => ps.districtId === selectedDistrict.id).length})` },
                  { key: "offices", label: `Offices (${offices.filter((o) => o.districtId === selectedDistrict.id).length})` },
                  { key: "units", label: `Specialized Units (${specializedUnits.filter((u) => u.districtId === selectedDistrict.id).length})` },
                ].map((st) => (
                  <button
                    key={st.key}
                    type="button"
                    onClick={() => setDistrictSubTab(st.key as any)}
                    className={cn(
                      "px-4 py-2.5 font-bold transition-colors border-b-2 cursor-pointer",
                      districtSubTab === st.key
                        ? "border-[#1e3a8a] text-[#1e3a8a] bg-white"
                        : "border-transparent text-slate-600 hover:text-slate-900"
                    )}
                  >
                    {st.label}
                  </button>
                ))}
              </div>

              {districtSubTab === "overview" && (
                <div className="p-5 space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-3 bg-slate-50 rounded-lg space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Superintendent of Police Office</span>
                      <div className="font-bold text-slate-800">{selectedDistrict.spOffice}</div>
                      <div className="text-slate-500">{selectedDistrict.spOfficeAddress}</div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Headquarters & Range</span>
                      <div className="font-bold text-slate-800">{selectedDistrict.districtHeadquarters}</div>
                      <div className="text-slate-500">Supervisory Range: {selectedDistrict.rangeName}</div>
                    </div>
                  </div>
                </div>
              )}

              {districtSubTab === "stations" && (
                <div className="divide-y divide-slate-100">
                  <div className="p-3 bg-slate-50 flex justify-end">
                    <button
                      type="button"
                      onClick={() => openAddModal("station")}
                      className="px-2.5 py-1 text-xs bg-[#1e3a8a] text-white rounded-lg font-bold"
                    >
                      + Add Station to {selectedDistrict.name}
                    </button>
                  </div>
                  {policeStations
                    .filter((ps) => ps.districtId === selectedDistrict.id)
                    .map((ps) => (
                      <div key={ps.id} className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-50">
                        <div>
                          <div className="font-bold text-slate-900">{ps.name}</div>
                          <div className="text-[10px] text-slate-500">
                            Code: <span className="font-mono">{ps.code}</span> • Sub-Div: {ps.subDivision || "N/A"} • Type: {ps.stationType}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">📞 {ps.contactPhone} • {ps.address}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal("station", ps)}
                            className="px-2 py-0.5 text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded font-semibold hover:bg-blue-100"
                          >
                            Edit / Shift
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteEntity("station", ps.id, ps.name)}
                            className="px-2 py-0.5 text-xs text-red-700 bg-red-50 border border-red-200 rounded font-semibold hover:bg-red-100 flex items-center gap-1"
                            title="Delete Police Station"
                          >
                            <Trash2 className="w-3 h-3" />
                            Delete
                          </button>
                          <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {ps.status}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {districtSubTab === "offices" && (
                <div className="divide-y divide-slate-100">
                  <div className="p-3 bg-slate-50 flex justify-end">
                    <button
                      type="button"
                      onClick={() => openAddModal("office")}
                      className="px-2.5 py-1 text-xs bg-purple-800 text-white rounded-lg font-bold"
                    >
                      + Add Office to {selectedDistrict.name}
                    </button>
                  </div>
                  {offices
                    .filter((o) => o.districtId === selectedDistrict.id)
                    .map((o) => (
                      <div key={o.id} className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-50">
                        <div>
                          <div className="font-bold text-slate-900">{o.name}</div>
                          <div className="text-[10px] text-slate-500">
                            Code: <span className="font-mono">{o.code}</span> • Type: {o.officeType} • Head: {o.officeHead}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{o.physicalAddress}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal("office", o)}
                            className="px-2 py-0.5 text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded font-semibold hover:bg-blue-100"
                          >
                            Edit / Shift
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteEntity("office", o.id, o.name)}
                            className="px-2 py-0.5 text-xs text-red-700 bg-red-50 border border-red-200 rounded font-semibold hover:bg-red-100 flex items-center gap-1"
                            title="Delete Office"
                          >
                            <Trash2 className="w-3 h-3" />
                            Delete
                          </button>
                          <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {o.status}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {districtSubTab === "units" && (
                <div className="divide-y divide-slate-100">
                  <div className="p-3 bg-slate-50 flex justify-end">
                    <button
                      type="button"
                      onClick={() => openAddModal("unit")}
                      className="px-2.5 py-1 text-xs bg-emerald-800 text-white rounded-lg font-bold"
                    >
                      + Add Unit to {selectedDistrict.name}
                    </button>
                  </div>
                  {specializedUnits
                    .filter((u) => u.districtId === selectedDistrict.id)
                    .map((u) => (
                      <div key={u.id} className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-50">
                        <div>
                          <div className="font-bold text-slate-900">{u.name}</div>
                          <div className="text-[10px] text-slate-500">
                            Code: <span className="font-mono">{u.code}</span> • Type: {u.unitType} • Head: {u.unitHead}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">Location: {u.physicalLocation}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal("unit", u)}
                            className="px-2 py-0.5 text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded font-semibold hover:bg-blue-100"
                          >
                            Edit / Shift
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteEntity("unit", u.id, u.name)}
                            className="px-2 py-0.5 text-xs text-red-700 bg-red-50 border border-red-200 rounded font-semibold hover:bg-red-100 flex items-center gap-1"
                            title="Delete Specialized Unit"
                          >
                            <Trash2 className="w-3 h-3" />
                            Delete
                          </button>
                          <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {u.status}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB: ARMED POLICE (HAP & IRB BATTALIONS) */}
      {!loading && activeTab === "armed-police" && (() => {
        const filteredBattalions = armedSubTab === "all"
          ? ARMED_BATTALIONS_MASTER_DATA
          : ARMED_BATTALIONS_MASTER_DATA.filter((b) => b.wing.toLowerCase() === armedSubTab);

        return (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-purple-700" />
                  <span>Armed Police Master & Battalions Management</span>
                </h2>
                <p className="text-[11px] text-slate-500">
                  Haryana Armed Police (HAP 1st–5th Bn + Durga Bn) and India Reserve Battalions (IRB 1st–4th Bn).
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="bg-slate-100 p-0.5 rounded-lg flex items-center text-xs">
                  {(["all", "hap", "irb"] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setArmedSubTab(tab)}
                      className={cn(
                        "px-2.5 py-1 rounded-md font-bold uppercase transition-colors cursor-pointer",
                        armedSubTab === tab
                          ? "bg-white text-purple-900 shadow-2xs"
                          : "text-slate-600 hover:text-slate-900"
                      )}
                    >
                      {tab === "all" ? "All Battalions" : tab.toUpperCase()}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => openAddModal("office")}
                  className="px-3 py-1.5 bg-[#1e3a8a] text-white text-xs font-bold rounded-xl hover:bg-[#152865] flex items-center gap-1.5 shadow-2xs cursor-pointer whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add Battalion</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredBattalions.map((bn) => (
                <div key={bn.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3 hover:border-purple-300 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 text-sm">{bn.name}</span>
                        <span className="bg-[#fffbeb] text-[#92400e] border border-[#fef3c7] text-[10px] font-bold px-1.5 py-0.2 rounded uppercase">
                          CORE
                        </span>
                        <span className="bg-purple-50 text-purple-800 border border-purple-200 text-[10px] font-bold px-1.5 py-0.2 rounded uppercase">
                          {bn.wing}
                        </span>
                      </div>
                      <span className="font-mono text-[10px] text-slate-400">{bn.code}</span>
                    </div>
                    <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                      {bn.status}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs">
                    <div className="text-slate-600 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>HQ: <strong>{bn.hq}</strong></span>
                    </div>
                    <div className="text-slate-600 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{bn.commandant} • {bn.companies} Companies</span>
                    </div>
                    <div className="text-[11px] text-slate-400 pt-0.5">
                      📞 {bn.phone}
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-2 flex items-center justify-between text-xs">
                    <button
                      type="button"
                      onClick={() => openAddModal("office")}
                      className="text-blue-700 hover:text-blue-900 font-bold"
                    >
                      Edit Battalion / HQ
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteEntity("office", bn.id, bn.name)}
                      className="text-red-600 hover:text-red-800 font-semibold flex items-center gap-1"
                      title="Delete Battalion"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* TAB: GRP HARYANA (RAILWAYS & COMMANDO) */}
      {!loading && activeTab === "grp" && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Train className="w-4 h-4 text-amber-700" />
                <span>Government Railway Police (GRP) & Commando Wing</span>
              </h2>
              <p className="text-[11px] text-slate-500">
                Supervisory Railway Police Headquarters, Railway Police Stations (GRPS), and Commando Protection Wings.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="bg-slate-100 p-0.5 rounded-lg flex items-center text-xs flex-wrap">
                {[
                  { key: "all", label: "All Stations (16)" },
                  { key: "ambala", label: "Ambala Sub-Div (6)" },
                  { key: "faridabad", label: "Faridabad Sub-Div (7)" },
                  { key: "hisar", label: "Hisar Sub-Div (3)" },
                  { key: "subdivisions", label: "Sub-Divisions (3)" },
                ].map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setGrpSubTab(t.key as any)}
                    className={cn(
                      "px-2.5 py-1 rounded-md font-bold transition-colors cursor-pointer",
                      grpSubTab === t.key ? "bg-white text-blue-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => openAddModal("station")}
                className="px-3 py-1.5 bg-[#1e3a8a] text-white text-xs font-bold rounded-xl hover:bg-[#152865] flex items-center gap-1.5 shadow-2xs cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Railway Station</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">IGP Railways and Commando Office</span>
                  <span className="bg-[#fffbeb] text-[#92400e] border border-[#fef3c7] text-[10px] font-bold px-1.5 py-0.2 rounded uppercase">
                    CORE
                  </span>
                  <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-semibold px-1.5 py-0.2 rounded">
                    Office
                  </span>
                </div>
                <div className="text-xs text-slate-600 mt-1 flex items-center gap-2">
                  <span>↳ <strong>GRP</strong> (SP Railway Police Haryana, Ambala Cantt)</span>
                  <span className="bg-[#fffbeb] text-[#92400e] border border-[#fef3c7] text-[9px] font-bold px-1.5 py-0.2 rounded uppercase">CORE</span>
                  <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[9px] font-semibold px-1.5 py-0.2 rounded">Office</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Statewide Railway Jurisdiction • 3 Sub-Divisions (Ambala Cantt, Faridabad, Hisar) • 16 GRP Police Stations
                </p>
              </div>
              <span className="text-xs font-bold text-blue-900 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg">
                16 Railway Stations • 3 Sub-Divisions
              </span>
            </div>

            {grpSubTab === "subdivisions" ? (
              <div className="divide-y divide-slate-100">
                {GRP_SUBDIVISIONS_DATA.map((sd) => (
                  <div key={sd.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-slate-50">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{sd.name} Sub-Division</span>
                        <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-semibold px-1.5 py-0.2 rounded">
                          Railway DSP Sub-Division
                        </span>
                      </div>
                      <div className="text-slate-600 mt-1">👤 {sd.dsp} • 📞 {sd.phone}</div>
                      <div className="text-slate-400 text-[11px] mt-0.5">Jurisdiction Stations: {sd.jurisdiction}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 text-xs font-bold text-blue-800 bg-blue-50 border border-blue-200 rounded">
                        {sd.stationsCount} Stations
                      </span>
                      <button
                        type="button"
                        onClick={() => openAddModal("office")}
                        className="px-2 py-1 text-xs text-slate-700 bg-slate-100 border border-slate-200 rounded font-semibold hover:bg-slate-200"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteEntity("office", sd.id, sd.name)}
                        className="px-2 py-1 text-xs text-red-700 bg-red-50 border border-red-200 rounded font-semibold hover:bg-red-100 flex items-center gap-1"
                        title="Delete Sub-Division"
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {GRP_STATIONS_MASTER_DATA.filter((stn) => {
                  if (grpSubTab === "ambala") return stn.subDivision === "Ambala Cantt";
                  if (grpSubTab === "faridabad") return stn.subDivision === "Faridabad";
                  if (grpSubTab === "hisar") return stn.subDivision === "Hisar";
                  return true;
                }).map((stn) => (
                  <div key={stn.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs hover:bg-slate-50">
                    <div>
                      <div className="flex items-center gap-2">
                        <Train className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                        <span className="font-bold text-slate-900">{stn.name}</span>
                        <span className="font-mono text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded font-bold">
                          {stn.code}
                        </span>
                        <span className="bg-amber-50 text-amber-800 border border-amber-200 text-[9px] font-bold px-1.5 py-0.2 rounded">
                          {stn.subDivision} Sub-Div
                        </span>
                        <span className="bg-[#fffbeb] text-[#92400e] border border-[#fef3c7] text-[9px] font-bold px-1.5 py-0.2 rounded uppercase">
                          CORE
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600 mt-0.5">
                        {stn.section} • Incharge: {stn.sho}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">📞 {stn.contact}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openAddModal("station")}
                        className="px-2 py-1 text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded font-semibold hover:bg-blue-100"
                      >
                        Edit / Shift
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteEntity("station", stn.id, stn.name)}
                        className="px-2 py-1 text-xs text-red-700 bg-red-50 border border-red-200 rounded font-semibold hover:bg-red-100 flex items-center gap-1"
                        title="Delete Railway Station"
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </button>
                      <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {stn.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: FORENSIC LABS & TRAINING CENTRES */}
      {!loading && activeTab === "forensic-labs" && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-emerald-700" />
                <span>Forensic Science Laboratories (FSL/RFSL) & Training Academies</span>
              </h2>
              <p className="text-[11px] text-slate-500">
                Scientific evidence laboratories, cyber forensics labs, and state police training academies.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="bg-slate-100 p-0.5 rounded-lg flex items-center text-xs">
                <button
                  type="button"
                  onClick={() => setForensicSubTab("labs")}
                  className={cn(
                    "px-3 py-1 rounded-md font-bold transition-colors cursor-pointer",
                    forensicSubTab === "labs"
                      ? "bg-white text-emerald-900 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  Forensic Labs (6)
                </button>
                <button
                  type="button"
                  onClick={() => setForensicSubTab("training")}
                  className={cn(
                    "px-3 py-1 rounded-md font-bold transition-colors cursor-pointer",
                    forensicSubTab === "training"
                      ? "bg-white text-emerald-900 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  Training Centres (5)
                </button>
              </div>
              <button
                type="button"
                onClick={() => openAddModal("office")}
                className="px-3 py-1.5 bg-[#1e3a8a] text-white text-xs font-bold rounded-xl hover:bg-[#152865] flex items-center gap-1.5 shadow-2xs cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Facility</span>
              </button>
            </div>
          </div>

          {forensicSubTab === "labs" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {FORENSIC_LABS_MASTER_DATA.map((lab) => (
                <div key={lab.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2.5 hover:border-emerald-300 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 text-sm">{lab.name}</span>
                        <span className="bg-[#fffbeb] text-[#92400e] border border-[#fef3c7] text-[10px] font-bold px-1.5 py-0.2 rounded uppercase">
                          CORE
                        </span>
                      </div>
                      <span className="text-[10px] text-emerald-800 font-medium bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded">
                        {lab.type}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {lab.status}
                    </span>
                  </div>

                  <div className="text-xs space-y-1">
                    <div className="text-slate-600">📍 Location: <strong>{lab.location}</strong></div>
                    <div className="text-slate-600">👤 {lab.director}</div>
                    <div className="text-[11px] text-slate-500 pt-0.5">
                      🔬 <strong>Divisions:</strong> {lab.divisions}
                    </div>
                    <div className="text-[11px] text-slate-400">📞 {lab.contact}</div>
                  </div>

                  <div className="border-t border-slate-100 pt-2 flex items-center justify-between text-xs">
                    <button
                      type="button"
                      onClick={() => openAddModal("office")}
                      className="text-blue-700 hover:text-blue-900 font-bold"
                    >
                      Edit Lab Details
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteEntity("unit", lab.id, lab.name)}
                      className="text-red-600 hover:text-red-800 font-semibold flex items-center gap-1"
                      title="Delete Lab"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {forensicSubTab === "training" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {TRAINING_CENTRES_MASTER_DATA.map((trg) => (
                <div key={trg.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2.5 hover:border-emerald-300 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 text-sm">{trg.name}</span>
                        <span className="bg-[#fffbeb] text-[#92400e] border border-[#fef3c7] text-[10px] font-bold px-1.5 py-0.2 rounded uppercase">
                          CORE
                        </span>
                      </div>
                      <span className="font-mono text-[10px] text-slate-400">{trg.code}</span>
                    </div>
                    <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {trg.status}
                    </span>
                  </div>

                  <div className="text-xs space-y-1">
                    <div className="text-slate-600">📍 Location: <strong>{trg.location}</strong></div>
                    <div className="text-slate-600">👤 {trg.head}</div>
                    <div className="text-slate-600">👥 Capacity: <strong>{trg.capacity}</strong></div>
                    <div className="text-[11px] text-slate-500 pt-0.5">
                      🎓 <strong>Programs:</strong> {trg.courses}
                    </div>
                    <div className="text-[11px] text-slate-400">📞 {trg.contact}</div>
                  </div>

                  <div className="border-t border-slate-100 pt-2 flex items-center justify-between text-xs">
                    <button
                      type="button"
                      onClick={() => openAddModal("office")}
                      className="text-blue-700 hover:text-blue-900 font-bold"
                    >
                      Edit Centre Details
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteEntity("office", trg.id, trg.name)}
                      className="text-red-600 hover:text-red-800 font-semibold flex items-center gap-1"
                      title="Delete Training Centre"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: DEPUTATION & SPECIALIZED UNITS */}
      {!loading && activeTab === "deputation-units" && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-blue-700" />
                <span>Police Deputation Wings & State Specialized Bodies</span>
              </h2>
              <p className="text-[11px] text-slate-500">
                Central Deputation (CBI, FRRO), State Boards (SV & ACB, Lokayukta, Mining, Home Guard, Prison), and State Intelligence Wings.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="bg-slate-100 p-0.5 rounded-lg flex items-center text-xs">
                <button
                  type="button"
                  onClick={() => setDeputationSubTab("state")}
                  className={cn(
                    "px-3 py-1 rounded-md font-bold transition-colors cursor-pointer",
                    deputationSubTab === "state"
                      ? "bg-white text-blue-900 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  State Deputation (8)
                </button>
                <button
                  type="button"
                  onClick={() => setDeputationSubTab("central")}
                  className={cn(
                    "px-3 py-1 rounded-md font-bold transition-colors cursor-pointer",
                    deputationSubTab === "central"
                      ? "bg-white text-blue-900 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  Central Deputation (2)
                </button>
                <button
                  type="button"
                  onClick={() => setDeputationSubTab("specialised")}
                  className={cn(
                    "px-3 py-1 rounded-md font-bold transition-colors cursor-pointer",
                    deputationSubTab === "specialised"
                      ? "bg-white text-blue-900 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  Specialized Wings (13)
                </button>
              </div>
              <button
                type="button"
                onClick={() => openAddModal("unit")}
                className="px-3 py-1.5 bg-[#1e3a8a] text-white text-xs font-bold rounded-xl hover:bg-[#152865] flex items-center gap-1.5 shadow-2xs cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Unit</span>
              </button>
            </div>
          </div>

          {(deputationSubTab === "state" || deputationSubTab === "central") && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {DEPUTATION_UNITS_MASTER_DATA.filter((d) =>
                deputationSubTab === "state" ? d.type.startsWith("State") : d.type.startsWith("Central")
              ).map((unt) => (
                <div key={unt.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2.5 hover:border-blue-300 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 text-sm">{unt.name}</span>
                        <span className="bg-[#fffbeb] text-[#92400e] border border-[#fef3c7] text-[10px] font-bold px-1.5 py-0.2 rounded uppercase">
                          CORE
                        </span>
                      </div>
                      <span className="text-[10px] text-blue-800 font-medium bg-blue-50 border border-blue-200 px-1.5 py-0.2 rounded">
                        {unt.type}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {unt.status}
                    </span>
                  </div>

                  <div className="text-xs space-y-1">
                    <div className="text-slate-700 font-medium">{unt.dept}</div>
                    <div className="text-slate-600">👤 Nodal Head: <strong>{unt.head}</strong></div>
                    <div className="text-slate-500">📍 Headquarters: {unt.location}</div>
                  </div>

                  <div className="border-t border-slate-100 pt-2 flex items-center justify-between text-xs">
                    <button
                      type="button"
                      onClick={() => openAddModal("unit")}
                      className="text-blue-700 hover:text-blue-900 font-bold"
                    >
                      Edit Entity
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteEntity("unit", unt.id, unt.name)}
                      className="text-red-600 hover:text-red-800 font-semibold flex items-center gap-1"
                      title="Delete Deputation Unit"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {deputationSubTab === "specialised" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {SPECIALISED_WINGS_MASTER_DATA.map((spc) => (
                <div key={spc.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2.5 hover:border-blue-300 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 text-sm">{spc.name}</span>
                        <span className="bg-[#fffbeb] text-[#92400e] border border-[#fef3c7] text-[10px] font-bold px-1.5 py-0.2 rounded uppercase">
                          CORE
                        </span>
                      </div>
                      <span className="text-[11px] font-semibold text-slate-700">{spc.title}</span>
                    </div>
                    <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {spc.status}
                    </span>
                  </div>

                  <div className="text-xs space-y-1">
                    <div className="text-slate-600">👤 Head: <strong>{spc.head}</strong></div>
                    <div className="text-slate-500">📍 Directorate: {spc.location}</div>
                  </div>

                  <div className="border-t border-slate-100 pt-2 flex items-center justify-between text-xs">
                    <button
                      type="button"
                      onClick={() => openAddModal("unit")}
                      className="text-blue-700 hover:text-blue-900 font-bold"
                    >
                      Edit Wing Details
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteEntity("unit", spc.id, spc.name)}
                      className="text-red-600 hover:text-red-800 font-semibold flex items-center gap-1"
                      title="Delete Wing"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: ADMINISTRATIVE OFFICES */}
      {!loading && activeTab === "offices" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Administrative Offices Master</h2>
              <p className="text-[11px] text-slate-500">
                Independent administrative headquarters: PHQ, IG Office, DIG Office, SP Office, DSP Office, ASP Office, DCB.
              </p>
            </div>
            <button
              type="button"
              onClick={() => openAddModal("office")}
              className="px-3 py-1.5 bg-[#1e3a8a] text-white text-xs font-bold rounded-xl hover:bg-[#152865] flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Office</span>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-600 uppercase">
                <tr>
                  <th className="p-3">Office Name</th>
                  <th className="p-3">Office Code</th>
                  <th className="p-3">Office Type</th>
                  <th className="p-3">Jurisdiction / District</th>
                  <th className="p-3">Office Head</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {offices.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{o.name}</div>
                      <div className="text-[10px] text-slate-400">{o.physicalAddress}</div>
                    </td>
                    <td className="p-3 font-mono font-semibold text-slate-700">{o.code}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-slate-100 font-semibold text-slate-700 text-[10px]">
                        {o.officeType}
                      </span>
                    </td>
                    <td className="p-3 text-slate-700">
                      {o.districtName ? `${o.districtName} District` : o.rangeName || o.stateName}
                    </td>
                    <td className="p-3 text-slate-800 font-medium">{o.officeHead}</td>
                    <td className="p-3">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-semibold border",
                          o.status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-slate-100 text-slate-600 border-slate-200"
                        )}
                      >
                        {o.status}
                      </span>
                    </td>
                    <td className="p-3 text-right space-x-1 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => openEditModal("office", o)}
                        className="text-blue-700 hover:text-blue-900 text-xs px-2 py-1 rounded border border-blue-200 hover:bg-blue-50 transition-colors"
                      >
                        Edit / Shift
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleStatus("office", o.id, o.status)}
                        className="text-slate-600 hover:text-slate-900 text-xs px-2 py-1 rounded border border-slate-200 hover:bg-slate-100 transition-colors"
                      >
                        {o.status === "ACTIVE" ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteEntity("office", o.id, o.name)}
                        className="text-red-600 hover:text-red-800 text-xs px-2 py-1 rounded border border-red-200 hover:bg-red-50 transition-colors inline-flex items-center gap-1"
                        title="Delete Office"
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: POLICE STATION MANAGEMENT */}
      {!loading && activeTab === "stations" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Territorial Police Station Master</h2>
              <p className="text-[11px] text-slate-500">
                Official police station ledger with station codes, type, SHO details, and jurisdiction.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search station or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 w-48"
              />
              <button
                type="button"
                onClick={() => openAddModal("station")}
                className="px-3 py-1.5 bg-[#1e3a8a] text-white text-xs font-bold rounded-xl hover:bg-[#152865] flex items-center gap-1.5 shadow-2xs cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Police Station</span>
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-600 uppercase">
                <tr>
                  <th className="p-3">Police Station</th>
                  <th className="p-3">Station Code</th>
                  <th className="p-3">District</th>
                  <th className="p-3">Sub-Division</th>
                  <th className="p-3">Station Type</th>
                  <th className="p-3">Contact</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {policeStations
                  .filter(
                    (ps) =>
                      !searchQuery ||
                      ps.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      ps.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      ps.districtName.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((ps) => (
                    <tr key={ps.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{ps.name}</div>
                        <div className="text-[10px] text-slate-400">{ps.address}</div>
                      </td>
                      <td className="p-3 font-mono font-semibold text-slate-700">{ps.code}</td>
                      <td className="p-3 font-medium text-slate-800">{ps.districtName}</td>
                      <td className="p-3 text-slate-600">{ps.subDivision || "N/A"}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-blue-50 text-[#1e3a8a] border border-blue-200 font-semibold text-[10px]">
                          {ps.stationType}
                        </span>
                      </td>
                      <td className="p-3 text-slate-600">
                        <div>{ps.contactPhone}</div>
                        {ps.email && <div className="text-[10px] text-slate-400">{ps.email}</div>}
                      </td>
                      <td className="p-3">
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-semibold border",
                            ps.status === "ACTIVE"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-slate-100 text-slate-600 border-slate-200"
                          )}
                        >
                          {ps.status}
                        </span>
                      </td>
                      <td className="p-3 text-right space-x-1 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => openEditModal("station", ps)}
                          className="text-blue-700 hover:text-blue-900 text-xs px-2 py-1 rounded border border-blue-200 hover:bg-blue-50 transition-colors"
                        >
                          Edit / Shift
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleStatus("station", ps.id, ps.status)}
                          className="text-slate-600 hover:text-slate-900 text-xs px-2 py-1 rounded border border-slate-200 hover:bg-slate-100 transition-colors"
                        >
                          {ps.status === "ACTIVE" ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteEntity("station", ps.id, ps.name)}
                          className="text-red-600 hover:text-red-800 text-xs px-2 py-1 rounded border border-red-200 hover:bg-red-50 transition-colors inline-flex items-center gap-1"
                          title="Delete Police Station"
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 7: SPECIALIZED UNITS */}
      {!loading && activeTab === "units" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Specialized Units Master</h2>
              <p className="text-[11px] text-slate-500">
                Independent units: CIA, CID, Cyber Cell, Traffic, Women Cell, Special Branch, Malkhana Store.
              </p>
            </div>
            <button
              type="button"
              onClick={() => openAddModal("unit")}
              className="px-3 py-1.5 bg-[#1e3a8a] text-white text-xs font-bold rounded-xl hover:bg-[#152865] flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Specialized Unit</span>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-600 uppercase">
                <tr>
                  <th className="p-3">Unit Name</th>
                  <th className="p-3">Unit Code</th>
                  <th className="p-3">Unit Type</th>
                  <th className="p-3">District</th>
                  <th className="p-3">Physical Location</th>
                  <th className="p-3">Unit Head</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {specializedUnits.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-3 font-bold text-slate-900">{u.name}</td>
                    <td className="p-3 font-mono font-semibold text-slate-700">{u.code}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 font-semibold text-[10px]">
                        {u.unitType}
                      </span>
                    </td>
                    <td className="p-3 text-slate-800">{u.districtName || u.rangeName}</td>
                    <td className="p-3 text-slate-600">{u.physicalLocation}</td>
                    <td className="p-3 font-medium text-slate-800">{u.unitHead}</td>
                    <td className="p-3">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-semibold border",
                          u.status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-slate-100 text-slate-600 border-slate-200"
                        )}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className="p-3 text-right space-x-1 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => openEditModal("unit", u)}
                        className="text-blue-700 hover:text-blue-900 text-xs px-2 py-1 rounded border border-blue-200 hover:bg-blue-50 transition-colors"
                      >
                        Edit / Shift
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleStatus("unit", u.id, u.status)}
                        className="text-slate-600 hover:text-slate-900 text-xs px-2 py-1 rounded border border-slate-200 hover:bg-slate-100 transition-colors"
                      >
                        {u.status === "ACTIVE" ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteEntity("unit", u.id, u.name)}
                        className="text-red-600 hover:text-red-800 text-xs px-2 py-1 rounded border border-red-200 hover:bg-red-50 transition-colors inline-flex items-center gap-1"
                        title="Delete Specialized Unit"
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 8: ORGANIZATIONAL HIERARCHY TREE EXPLORER */}
      {!loading && activeTab === "hierarchy" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FolderTree className="w-4 h-4 text-[#1e3a8a]" />
                Organizational Hierarchy Explorer
              </h2>
              <p className="text-[11px] text-slate-500">
                Visual tree view: State → PHQ → Range → District → Administrative Offices → Police Stations → Specialized Units.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={expandAll}
                className="px-2.5 py-1 text-xs font-semibold rounded border border-slate-200 hover:bg-slate-50 text-slate-700"
              >
                Expand All
              </button>
              <button
                type="button"
                onClick={collapseAll}
                className="px-2.5 py-1 text-xs font-semibold rounded border border-slate-200 hover:bg-slate-50 text-slate-700"
              >
                Collapse All
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {hierarchy.map((stateNode) => (
              <TreeNodeItem
                key={stateNode.id}
                node={stateNode}
                expandedNodes={expandedNodes}
                onToggle={toggleNode}
                level={0}
              />
            ))}
          </div>
        </div>
      )}

      {/* UNIFIED ADD / EDIT / SHIFT MODAL */}
      {modalOpen && modalType && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {modalMode === "add" ? `+ Add New ${modalType.toUpperCase()}` : `Edit & Shift ${modalType.toUpperCase()}`}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {modalMode === "add"
                    ? "Fill required master fields and jurisdiction links."
                    : "Modify details or re-assign/shift parent Range, District, or Office."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Name *</label>
                <input
                  type="text"
                  required
                  placeholder={`e.g. ${modalType === 'station' ? 'PS Model Town' : modalType === 'district' ? 'Panipat' : 'Name'}`}
                  value={formData.name || ""}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Code *</label>
                <input
                  type="text"
                  required
                  disabled={modalMode === "edit"}
                  placeholder={`e.g. HAR-${modalType.toUpperCase()}-01`}
                  value={formData.code || ""}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono uppercase focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                />
              </div>

              {/* Range Specific Fields */}
              {modalType === "range" && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Range Headquarters *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Karnal"
                        value={formData.rangeHeadquarters || ""}
                        onChange={(e) => setFormData({ ...formData, rangeHeadquarters: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">State Jurisdiction</label>
                      <input
                        type="text"
                        disabled
                        value={formData.stateName || "Haryana Police (PHQ)"}
                        className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2 text-slate-600 disabled:opacity-75"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">IG Office Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Office of Inspector General of Police, Karnal Range"
                      value={formData.igOffice || ""}
                      onChange={(e) => setFormData({ ...formData, igOffice: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">DIG Office (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Range DIG Office"
                      value={formData.digOffice || ""}
                      onChange={(e) => setFormData({ ...formData, digOffice: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                    />
                  </div>
                </>
              )}

              {/* Shifting Range for District */}
              {modalType === "district" && (
                <div>
                  <label className="font-semibold text-blue-900 block mb-1">Supervisory Range (Shift Range) *</label>
                  <select
                    value={formData.rangeId || ""}
                    onChange={(e) => {
                      const selRange = ranges.find((r) => r.id === e.target.value);
                      setFormData({
                        ...formData,
                        rangeId: e.target.value,
                        rangeName: selRange?.name || "",
                      });
                    }}
                    className="w-full bg-blue-50 border border-blue-200 font-bold text-blue-900 rounded-lg p-2 focus:ring-1 focus:ring-blue-500"
                  >
                    {ranges.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.rangeHeadquarters})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Shifting District for Police Station */}
              {modalType === "station" && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-blue-900 block mb-1">Assigned District (Shift District) *</label>
                      <select
                        value={formData.districtId || ""}
                        onChange={(e) => {
                          const dst = districts.find((d) => d.id === e.target.value);
                          setFormData({
                            ...formData,
                            districtId: e.target.value,
                            districtName: dst?.name || "",
                            rangeId: dst?.rangeId,
                            rangeName: dst?.rangeName,
                          });
                        }}
                        className="w-full bg-blue-50 border border-blue-200 font-bold text-blue-900 rounded-lg p-2"
                      >
                        {districts.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name} ({d.rangeName})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Station Type</label>
                      <select
                        value={formData.stationType || "URBAN"}
                        onChange={(e) => setFormData({ ...formData, stationType: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                      >
                        <option value="URBAN">URBAN</option>
                        <option value="RURAL">RURAL</option>
                        <option value="SEMI_URBAN">SEMI URBAN</option>
                        <option value="HIGHWAY">HIGHWAY</option>
                        <option value="INDUSTRIAL">INDUSTRIAL</option>
                        <option value="WOMEN">WOMEN</option>
                        <option value="CYBER">CYBER</option>
                        <option value="TRAFFIC">TRAFFIC</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Sub-Division</label>
                    <input
                      type="text"
                      placeholder="e.g. Panipat City"
                      value={formData.subDivision || ""}
                      onChange={(e) => setFormData({ ...formData, subDivision: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                    />
                  </div>
                </>
              )}

              {/* Shifting District / Parent Office for Office */}
              {modalType === "office" && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-blue-900 block mb-1">District (Shift District)</label>
                      <select
                        value={formData.districtId || ""}
                        onChange={(e) => {
                          const dst = districts.find((d) => d.id === e.target.value);
                          setFormData({
                            ...formData,
                            districtId: e.target.value,
                            districtName: dst?.name || "",
                            rangeId: dst?.rangeId,
                            rangeName: dst?.rangeName,
                          });
                        }}
                        className="w-full bg-blue-50 border border-blue-200 font-bold text-blue-900 rounded-lg p-2"
                      >
                        <option value="">State / Range Level</option>
                        {districts.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Office Type</label>
                      <select
                        value={formData.officeType || "SP_OFFICE"}
                        onChange={(e) => setFormData({ ...formData, officeType: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                      >
                        <option value="PHQ">PHQ</option>
                        <option value="IG_OFFICE">IG OFFICE</option>
                        <option value="DIG_OFFICE">DIG OFFICE</option>
                        <option value="SP_OFFICE">SP OFFICE</option>
                        <option value="ASP_OFFICE">ASP OFFICE</option>
                        <option value="DSP_OFFICE">DSP OFFICE</option>
                        <option value="CRIME_BRANCH">CRIME BRANCH</option>
                        <option value="ADMINISTRATIVE_OFFICE">ADMINISTRATIVE OFFICE</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Office Head</label>
                    <input
                      type="text"
                      placeholder="e.g. SP Panipat"
                      value={formData.officeHead || ""}
                      onChange={(e) => setFormData({ ...formData, officeHead: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                    />
                  </div>
                </>
              )}

              {/* Shifting District / Unit Type for Specialized Unit */}
              {modalType === "unit" && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-blue-900 block mb-1">District (Shift District)</label>
                      <select
                        value={formData.districtId || ""}
                        onChange={(e) => {
                          const dst = districts.find((d) => d.id === e.target.value);
                          setFormData({
                            ...formData,
                            districtId: e.target.value,
                            districtName: dst?.name || "",
                            rangeId: dst?.rangeId,
                            rangeName: dst?.rangeName,
                          });
                        }}
                        className="w-full bg-blue-50 border border-blue-200 font-bold text-blue-900 rounded-lg p-2"
                      >
                        {districts.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Unit Type</label>
                      <select
                        value={formData.unitType || "CIA"}
                        onChange={(e) => setFormData({ ...formData, unitType: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                      >
                        <option value="CIA">CIA</option>
                        <option value="CID">CID</option>
                        <option value="CRIME_BRANCH">CRIME BRANCH</option>
                        <option value="CYBER_CELL">CYBER CELL</option>
                        <option value="TRAFFIC">TRAFFIC</option>
                        <option value="SPECIAL_INVESTIGATION_UNIT">SPECIAL INVESTIGATION UNIT</option>
                        <option value="ECONOMIC_OFFENCES_WING">ECONOMIC OFFENCES WING</option>
                        <option value="WOMEN_CELL">WOMEN CELL</option>
                        <option value="SPECIAL_BRANCH">SPECIAL BRANCH</option>
                        <option value="MHC_STORE">MHC STORE</option>
                        <option value="ABVT">ABVT</option>
                        <option value="ANC">ANC</option>
                        <option value="AVT">AVT</option>
                        <option value="Missing Person Cell">Missing Person Cell</option>
                        <option value="PO Staff">PO Staff</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Unit Head</label>
                    <input
                      type="text"
                      placeholder="e.g. Inspector CIA-1"
                      value={formData.unitHead || ""}
                      onChange={(e) => setFormData({ ...formData, unitHead: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Physical Location</label>
                    <input
                      type="text"
                      placeholder="e.g. Police Lines, Panipat"
                      value={formData.physicalLocation || ""}
                      onChange={(e) => setFormData({ ...formData, physicalLocation: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                    />
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Contact Phone</label>
                  <input
                    type="text"
                    placeholder="e.g. 0180-2640100"
                    value={formData.contactPhone || ""}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Status</label>
                  <select
                    value={formData.status || "ACTIVE"}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3.5 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingModal}
                  className="px-4 py-1.5 bg-[#1e3a8a] text-white rounded-xl text-xs font-bold hover:bg-[#152865] disabled:opacity-50"
                >
                  {savingModal ? "Saving..." : modalMode === "add" ? "Create Entity" : "Save Changes / Shift"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GLOBAL DELETE CONFIRMATION MODAL WITH OK & CANCEL */}
      {showDeleteConfirmModal && pendingDeleteEntity && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-red-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Confirm Deletion</h3>
                <p className="text-xs text-slate-500">Developer Administrator Action</p>
              </div>
            </div>

            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl space-y-2 text-xs">
              <p className="font-bold text-red-900">
                Are you sure you want to permanently delete this {pendingDeleteEntity.type}?
              </p>
              <div className="bg-white p-2.5 rounded-lg border border-red-100 text-slate-800 font-semibold text-sm">
                {pendingDeleteEntity.name}
              </div>
              <p className="text-[11px] text-red-700 font-medium">
                ⚠️ Empty hierarchy status verified. This action cannot be undone and will permanently remove this record from the system.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirmModal(false);
                  setPendingDeleteEntity(null);
                }}
                disabled={deletingEntity}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmExecuteDelete}
                disabled={deletingEntity}
                className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 transition-colors shadow-xs disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                {deletingEntity ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>OK / Confirm Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Tree Node Item Component (Clean structured view with prominent type badges)
function TreeNodeItem({
  node,
  expandedNodes,
  onToggle,
  level,
}: {
  node: HierarchyTreeNode;
  expandedNodes: Record<string, boolean>;
  onToggle: (id: string) => void;
  level: number;
}) {
  const isExpanded = !!expandedNodes[node.id];
  const hasChildren = node.children && node.children.length > 0;

  const typeBadgeColors: Record<string, string> = {
    STATE: "bg-blue-100 text-[#1e3a8a] border-blue-200",
    RANGE: "bg-indigo-100 text-indigo-800 border-indigo-200",
    DISTRICT: "bg-purple-100 text-purple-800 border-purple-200",
    OFFICE: "bg-emerald-100 text-emerald-800 border-emerald-200",
    POLICE_STATION: "bg-amber-100 text-amber-900 border-amber-200",
    UNIT: "bg-rose-100 text-rose-800 border-rose-200",
    COMMISSIONERATE: "bg-sky-100 text-sky-800 border-sky-200",
    ZONE: "bg-teal-100 text-teal-800 border-teal-200",
    BATTALION: "bg-violet-100 text-violet-800 border-violet-200",
    WING: "bg-slate-100 text-slate-800 border-slate-200",
  };

  return (
    <div className={cn("text-xs font-sans", level > 0 && "ml-4 border-l-2 border-slate-200 pl-3 my-1.5")}>
      <div
        onClick={() => hasChildren && onToggle(node.id)}
        title={node.details ? `${node.code ? `[${node.code}] ` : ""}${node.details}` : node.code ? `[${node.code}]` : undefined}
        className={cn(
          "flex items-center gap-2 py-1.5 px-2.5 rounded-lg transition-colors group cursor-pointer select-none",
          hasChildren ? "hover:bg-slate-100" : "hover:bg-slate-50"
        )}
      >
        {/* Toggle chevron or leaf bullet */}
        {hasChildren ? (
          <span className="text-slate-400 group-hover:text-slate-700 w-3.5 h-3.5 flex items-center justify-center shrink-0">
            {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </span>
        ) : (
          <span className="w-3.5 h-3.5 inline-block text-slate-300 shrink-0 text-center">•</span>
        )}

        {/* Node Type Badge */}
        <span
          className={cn(
            "text-[9px] font-bold uppercase px-1.5 py-0.2 rounded border font-mono shrink-0",
            typeBadgeColors[node.type] || "bg-slate-100 text-slate-700 border-slate-200"
          )}
        >
          {node.type.replace("_", " ")}
        </span>

        {/* Node Name */}
        <span className="font-bold text-slate-900 group-hover:text-blue-900">{node.name}</span>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="space-y-0.5 mt-0.5">
          {node.children!.map((child) => (
            <TreeNodeItem
              key={child.id}
              node={child}
              expandedNodes={expandedNodes}
              onToggle={onToggle}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
