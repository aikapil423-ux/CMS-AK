"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Users,
  UserPlus,
  Shield,
  Key,
  Lock,
  Building2,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Eye,
  Edit2,
  Power,
  RotateCcw,
  Search,
  Filter,
  ArrowRight,
  RefreshCw,
  FileText,
  BadgeCheck,
  Calendar,
  Clock,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  ArrowRightLeft,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import type {
  MasterAccount,
  AccountRole,
  JurisdictionType,
  SpecialStationAllocation,
  AccountAuditLog,
  MasterDistrict,
  MasterPoliceStation,
  MasterRange,
  MasterOffice,
  MasterSpecializedUnit,
  AssignedUnitType,
} from "@/types/adminMaster";

type AccountTab = "directory" | "new" | "special-allocations" | "policies" | "audits";

export const POLICE_RANKS_OPTIONS = [
  // Apex State & Range Leadership
  { rank: "DGP", display: "Director General of Police (DGP)" },
  { rank: "ADGP", display: "Additional DGP (ADGP)" },
  { rank: "INSPECTOR_GENERAL", display: "Inspector General of Police (IGP)" },
  { rank: "DIG", display: "Deputy Inspector General (DIG)" },

  // Commissionerate Specific Senior Ranks
  { rank: "CP", display: "Commissioner of Police (CP)" },
  { rank: "JOINT_CP", display: "Joint / Additional CP (JCP / Addl. CP)" },
  { rank: "DCP", display: "Deputy Commissioner of Police (DCP)" },
  { rank: "ADDL_DCP", display: "Additional DCP (Addl. DCP)" },
  { rank: "ACP", display: "Assistant Commissioner of Police (ACP)" },

  // District Executive & Armed Police Senior Ranks
  { rank: "SUPERINTENDENT_OF_POLICE", display: "Superintendent of Police (SP)" },
  { rank: "COMMANDANT", display: "Commandant (HAP / IRB / Armed Battalion)" },
  { rank: "ADDITIONAL_SP", display: "Additional SP (ASP)" },
  { rank: "ADDL_COMMANDANT", display: "Additional Commandant (Armed Police)" },
  { rank: "DEPUTY_SP", display: "Deputy SP (DSP)" },
  { rank: "ASST_COMMANDANT", display: "Assistant Commandant (DSP Armed)" },

  // Field, Station, Armed & Training Cadre Ranks
  { rank: "INSPECTOR", display: "Inspector of Police (Inspector / SHO / CDI)" },
  { rank: "SUB_INSPECTOR", display: "Sub-Inspector (SI / Platoon Commander)" },
  { rank: "ASSISTANT_SUB_INSPECTOR", display: "Assistant Sub-Inspector (ASI / Section Commander)" },
  { rank: "HEAD_CONSTABLE", display: "Head Constable (HC / CHM / DI)" },
  { rank: "CONSTABLE", display: "Constable (CT / Armed Guard / Trainee)" },
];

export const ASSIGNED_UNIT_TYPE_OPTIONS: { value: AssignedUnitType; label: string }[] = [
  { value: "POLICE_STATION", label: "Police Station (Territorial / Urban / Rural)" },
  { value: "COMMISSIONERATE_HQ", label: "Police Commissionerate HQ / Zonal DCP Office" },
  { value: "ARMED_BATTALION", label: "Armed Police Battalion (HAP / IRB Battalions)" },
  { value: "TRAINING_CENTRE", label: "Training Academy / College (HPA / PTC / RTC)" },
  { value: "SPECIALIZED_UNIT", label: "Specialized Unit (CID / STF / State Cyber / State Crime)" },
  { value: "DISTRICT_OFFICE", label: "District Police Office / SP / DSP Office" },
  { value: "RANGE_OFFICE", label: "Range Office / IGP Command" },
  { value: "PHQ", label: "Police Headquarters (PHQ Haryana, Panchkula)" },
  { value: "INVESTIGATION_UNIT", label: "Investigation Unit / CIA / Crime Branch" },
  { value: "MHC_STORE", label: "Station Malkhana & General Diary (MHC Store)" },
  { value: "GRP_STATION", label: "Government Railway Police (GRP) Station" },
  { value: "FORENSIC_LAB", label: "Forensic Science Laboratory (FSL)" },
  { value: "DEPUTATION_UNIT", label: "Deputation Unit / Vigilance / Human Rights" },
  { value: "OTHER", label: "Other Administrative / Police Establishment" },
];

export const JURISDICTION_OPTIONS: { value: JurisdictionType; label: string }[] = [
  { value: "SINGLE_STATION", label: "Single Station / Unit Command" },
  { value: "SUBDIVISION_MULTI_STATION", label: "Sub-Division / ACP Division (Multiple Stations)" },
  { value: "COMMISSIONERATE_WIDE", label: "Commissionerate-Wide Jurisdiction (CP / Joint CP)" },
  { value: "ZONE_WIDE", label: "Commissionerate Zone (DCP Zone East/West/Crime/Traffic)" },
  { value: "DISTRICT_WIDE", label: "Full District Jurisdiction (SP / District HQ)" },
  { value: "BATTALION_WIDE", label: "Battalion-Wide Jurisdiction (HAP / IRB Commandant)" },
  { value: "TRAINING_CAMPUS_WIDE", label: "Training Campus / Academy Wide (HPA / PTC / RTC)" },
  { value: "RANGE_WIDE", label: "Full Range Jurisdiction (IGP / DIG)" },
  { value: "STATE_WIDE", label: "State-Wide Jurisdiction (DGP / State Command)" },
  { value: "OFFICE_BOUND", label: "Administrative Office Bound" },
  { value: "UNIT_BOUND", label: "Specialized Unit / Armed Company Bound" },
  { value: "SPECIAL_MULTI_STATION", label: "Special Allocation (Multi-Station Law & Order)" },
];

export const COMMISSIONERATES_LIST = [
  { id: "comm_fbd", name: "Faridabad Police Commissionerate", code: "COM-FBD", district: "Faridabad" },
  { id: "comm_ggn", name: "Gurugram Police Commissionerate", code: "COM-GGN", district: "Gurugram" },
  { id: "comm_jhj", name: "Jhajjar Police Commissionerate", code: "COM-JHJ", district: "Jhajjar" },
  { id: "comm_pkl", name: "Panchkula Police Commissionerate", code: "COM-PKL", district: "Panchkula" },
  { id: "comm_snp", name: "Sonipat Police Commissionerate", code: "COM-SNP", district: "Sonipat" },
];

export interface CommissionerateZoneItem {
  id: string;
  commissionerateName: string;
  district: string;
  name: string;
  dcpTitle: string;
  code: string;
  stationKeywords: string[];
}

export const COMMISSIONERATE_ZONES: CommissionerateZoneItem[] = [
  // 1. Faridabad Police Commissionerate
  {
    id: "zone_fbd_nit",
    commissionerateName: "Faridabad Police Commissionerate",
    district: "Faridabad",
    name: "NIT Zone",
    dcpTitle: "DCP NIT (Faridabad)",
    code: "FBD-NIT",
    stationKeywords: ["nit", "saran", "mujesar", "sgm nagar", "dabua", "kotwali"],
  },
  {
    id: "zone_fbd_central",
    commissionerateName: "Faridabad Police Commissionerate",
    district: "Faridabad",
    name: "Central Zone",
    dcpTitle: "DCP Central (Faridabad)",
    code: "FBD-CENT",
    stationKeywords: ["central", "sector 14", "old faridabad", "bhupani", "kheri pul", "palla", "surajkund"],
  },
  {
    id: "zone_fbd_ballabgarh",
    commissionerateName: "Faridabad Police Commissionerate",
    district: "Faridabad",
    name: "Ballabgarh Zone",
    dcpTitle: "DCP Ballabgarh",
    code: "FBD-BLB",
    stationKeywords: ["ballabgarh", "chhainsa", "tigaon", "sector 8", "adarsh nagar", "dhouj"],
  },
  {
    id: "zone_fbd_crime",
    commissionerateName: "Faridabad Police Commissionerate",
    district: "Faridabad",
    name: "Crime Branch Zone",
    dcpTitle: "DCP Crime (Faridabad)",
    code: "FBD-CRIME",
    stationKeywords: ["crime", "cyber"],
  },
  {
    id: "zone_fbd_traffic",
    commissionerateName: "Faridabad Police Commissionerate",
    district: "Faridabad",
    name: "Traffic Zone",
    dcpTitle: "DCP Traffic (Faridabad)",
    code: "FBD-TRAFFIC",
    stationKeywords: ["traffic"],
  },
  {
    id: "zone_fbd_hq",
    commissionerateName: "Faridabad Police Commissionerate",
    district: "Faridabad",
    name: "Headquarters (HQ) Zone",
    dcpTitle: "DCP Headquarters",
    code: "FBD-HQ",
    stationKeywords: ["headquarters", "police line", "women"],
  },

  // 2. Gurugram Police Commissionerate
  {
    id: "zone_ggn_east",
    commissionerateName: "Gurugram Police Commissionerate",
    district: "Gurugram",
    name: "East Zone",
    dcpTitle: "DCP East (Gurugram)",
    code: "GGN-EAST",
    stationKeywords: ["east", "dlf", "sector 29", "sushant lok", "sector 53", "sector 56", "cyber crime"],
  },
  {
    id: "zone_ggn_west",
    commissionerateName: "Gurugram Police Commissionerate",
    district: "Gurugram",
    name: "West Zone",
    dcpTitle: "DCP West (Gurugram)",
    code: "GGN-WEST",
    stationKeywords: ["west", "civil lines", "sector 5", "rajendra park", "sector 9a", "city gurugram", "sector 10"],
  },
  {
    id: "zone_ggn_south",
    commissionerateName: "Gurugram Police Commissionerate",
    district: "Gurugram",
    name: "South Zone",
    dcpTitle: "DCP South (Gurugram)",
    code: "GGN-SOUTH",
    stationKeywords: ["south", "sohna", "badshahpur", "kherki daula", "sector 65"],
  },
  {
    id: "zone_ggn_manesar",
    commissionerateName: "Gurugram Police Commissionerate",
    district: "Gurugram",
    name: "Manesar Zone",
    dcpTitle: "DCP Manesar",
    code: "GGN-MNSR",
    stationKeywords: ["manesar", "imt", "pataudi", "bilaspur", "industrial"],
  },
  {
    id: "zone_ggn_crime",
    commissionerateName: "Gurugram Police Commissionerate",
    district: "Gurugram",
    name: "Crime Branch Zone",
    dcpTitle: "DCP Crime (Gurugram)",
    code: "GGN-CRIME",
    stationKeywords: ["crime", "cyber"],
  },
  {
    id: "zone_ggn_traffic",
    commissionerateName: "Gurugram Police Commissionerate",
    district: "Gurugram",
    name: "Traffic Zone",
    dcpTitle: "DCP Traffic (Gurugram)",
    code: "GGN-TRAFFIC",
    stationKeywords: ["traffic"],
  },
  {
    id: "zone_ggn_hq",
    commissionerateName: "Gurugram Police Commissionerate",
    district: "Gurugram",
    name: "Headquarters (HQ) Zone",
    dcpTitle: "DCP Headquarters",
    code: "GGN-HQ",
    stationKeywords: ["headquarters", "police line"],
  },

  // 3. Panchkula Police Commissionerate
  {
    id: "zone_pkl_urban",
    commissionerateName: "Panchkula Police Commissionerate",
    district: "Panchkula",
    name: "Panchkula Urban Zone",
    dcpTitle: "DCP Panchkula",
    code: "PKL-URBAN",
    stationKeywords: ["sector 5", "sector 14", "sector 20", "mdc", "mansa devi", "chandimandir"],
  },
  {
    id: "zone_pkl_kalka",
    commissionerateName: "Panchkula Police Commissionerate",
    district: "Panchkula",
    name: "Kalka / Rural Zone",
    dcpTitle: "DCP / ACP Kalka",
    code: "PKL-KLK",
    stationKeywords: ["kalka", "pinjore", "raipur rani"],
  },
  {
    id: "zone_pkl_crime",
    commissionerateName: "Panchkula Police Commissionerate",
    district: "Panchkula",
    name: "Crime & Cyber Zone",
    dcpTitle: "DCP Crime & Cyber",
    code: "PKL-CRIME",
    stationKeywords: ["crime", "cyber"],
  },
  {
    id: "zone_pkl_traffic",
    commissionerateName: "Panchkula Police Commissionerate",
    district: "Panchkula",
    name: "Traffic & Security Zone",
    dcpTitle: "DCP Traffic",
    code: "PKL-TRAFFIC",
    stationKeywords: ["traffic"],
  },
  {
    id: "zone_pkl_hq",
    commissionerateName: "Panchkula Police Commissionerate",
    district: "Panchkula",
    name: "Headquarters (HQ) Zone",
    dcpTitle: "DCP Headquarters",
    code: "PKL-HQ",
    stationKeywords: ["headquarters", "police line"],
  },

  // 4. Sonipat Police Commissionerate
  {
    id: "zone_snp_city",
    commissionerateName: "Sonipat Police Commissionerate",
    district: "Sonipat",
    name: "Sonipat City Zone",
    dcpTitle: "DCP Sonipat City",
    code: "SNP-CTY",
    stationKeywords: ["city sonipat", "civil lines", "sector 27", "murthal"],
  },
  {
    id: "zone_snp_east",
    commissionerateName: "Sonipat Police Commissionerate",
    district: "Sonipat",
    name: "East Sonipat (Kundli / Rai) Zone",
    dcpTitle: "DCP East Sonipat",
    code: "SNP-EAST",
    stationKeywords: ["kundli", "rai", "badi"],
  },
  {
    id: "zone_snp_west",
    commissionerateName: "Sonipat Police Commissionerate",
    district: "Sonipat",
    name: "West Sonipat (Gohana) Zone",
    dcpTitle: "DCP West / Gohana",
    code: "SNP-WEST",
    stationKeywords: ["gohana", "baroda"],
  },
  {
    id: "zone_snp_ganaur",
    commissionerateName: "Sonipat Police Commissionerate",
    district: "Sonipat",
    name: "Ganaur Zone",
    dcpTitle: "ACP Ganaur Division",
    code: "SNP-GNR",
    stationKeywords: ["ganaur"],
  },
  {
    id: "zone_snp_crime",
    commissionerateName: "Sonipat Police Commissionerate",
    district: "Sonipat",
    name: "Crime & Cyber Zone",
    dcpTitle: "DCP Crime & Cyber",
    code: "SNP-CRIME",
    stationKeywords: ["crime", "cyber"],
  },
  {
    id: "zone_snp_traffic",
    commissionerateName: "Sonipat Police Commissionerate",
    district: "Sonipat",
    name: "Traffic & Highway Zone",
    dcpTitle: "DCP Traffic",
    code: "SNP-TRAFFIC",
    stationKeywords: ["traffic"],
  },
  {
    id: "zone_snp_hq",
    commissionerateName: "Sonipat Police Commissionerate",
    district: "Sonipat",
    name: "Headquarters (HQ) Zone",
    dcpTitle: "DCP Headquarters",
    code: "SNP-HQ",
    stationKeywords: ["headquarters", "police line"],
  },

  // 5. Jhajjar Police Commissionerate
  {
    id: "zone_jhj_jhj",
    commissionerateName: "Jhajjar Police Commissionerate",
    district: "Jhajjar",
    name: "Jhajjar Zone",
    dcpTitle: "DCP Jhajjar",
    code: "JHJ-ZN",
    stationKeywords: ["city jhajjar", "sadar jhajjar", "beri", "salhawas"],
  },
  {
    id: "zone_jhj_bdg",
    commissionerateName: "Jhajjar Police Commissionerate",
    district: "Jhajjar",
    name: "Bahadurgarh Zone",
    dcpTitle: "DCP Bahadurgarh",
    code: "JHJ-BDG",
    stationKeywords: ["bahadurgarh", "line par", "sector 6", "asaudha", "mandothi"],
  },
  {
    id: "zone_jhj_crime",
    commissionerateName: "Jhajjar Police Commissionerate",
    district: "Jhajjar",
    name: "Crime & Cyber Zone",
    dcpTitle: "DCP Crime & Cyber",
    code: "JHJ-CRIME",
    stationKeywords: ["crime", "cyber"],
  },
  {
    id: "zone_jhj_traffic",
    commissionerateName: "Jhajjar Police Commissionerate",
    district: "Jhajjar",
    name: "Traffic Zone",
    dcpTitle: "DCP Traffic",
    code: "JHJ-TRAFFIC",
    stationKeywords: ["traffic"],
  },
  {
    id: "zone_jhj_hq",
    commissionerateName: "Jhajjar Police Commissionerate",
    district: "Jhajjar",
    name: "Headquarters (HQ) Zone",
    dcpTitle: "DCP Headquarters",
    code: "JHJ-HQ",
    stationKeywords: ["headquarters", "police line"],
  },
];

export const ARMED_BATTALIONS = [
  { id: "hap_bn_1", name: "1st Bn HAP (Ambala)", code: "HAP-1BN" },
  { id: "hap_bn_2", name: "2nd Bn HAP (Madhuban)", code: "HAP-2BN" },
  { id: "hap_bn_3", name: "3rd Bn HAP (Hisar)", code: "HAP-3BN" },
  { id: "hap_bn_4", name: "4th Bn HAP (Madhuban)", code: "HAP-4BN" },
  { id: "hap_bn_5", name: "5th Bn HAP (Madhuban)", code: "HAP-5BN" },
  { id: "hap_bn_durga", name: "Durga Bn HAP (Madhuban)", code: "HAP-DURGA" },
  { id: "irb_bn_1", name: "1st Bn IRB (Bhondsi)", code: "IRB-1BN" },
  { id: "irb_bn_2", name: "2nd Bn IRB (Bhondsi)", code: "IRB-2BN" },
  { id: "irb_bn_3", name: "3rd Bn IRB (Sunaria)", code: "IRB-3BN" },
  { id: "irb_bn_4", name: "4th Bn IRB (Manebhadar)", code: "IRB-4BN" },
];

export const GRP_STATIONS_LIST = [
  { id: "grps_amb_cantt", name: "GRP AMBALA CANTT", code: "GRPS-AMB", district: "Ambala" },
  { id: "grps_bahadurgarh", name: "GRP BAHADURGARH", code: "GRPS-BDG", district: "Jhajjar" },
  { id: "grps_chandigarh", name: "GRP CHANDIGARH", code: "GRPS-CDG", district: "Chandigarh" },
  { id: "grps_faridabad", name: "GRP FARIDABAD", code: "GRPS-FBD", district: "Faridabad" },
  { id: "grps_gurugram", name: "GRP GURUGRAM", code: "GRPS-GGN", district: "Gurugram" },
  { id: "grps_hisar", name: "GRP HISAR", code: "GRPS-HSR", district: "Hisar" },
  { id: "grps_jagadhari", name: "GRP JAGADHARI", code: "GRPS-JGD", district: "Yamunanagar" },
  { id: "grps_jind", name: "GRP JIND", code: "GRPS-JND", district: "Jind" },
  { id: "grps_kalka", name: "GRP KALKA", code: "GRPS-KLK", district: "Panchkula" },
  { id: "grps_karnal", name: "GRP KARNAL", code: "GRPS-KNL", district: "Karnal" },
  { id: "grps_kurukshetra", name: "GRP KURUKSHETRA", code: "GRPS-KKR", district: "Kurukshetra" },
  { id: "grps_panipat", name: "GRP PANIPAT", code: "GRPS-PNP", district: "Panipat" },
  { id: "grps_rewari", name: "GRP REWARI", code: "GRPS-REW", district: "Rewari" },
  { id: "grps_rohtak", name: "GRP ROHTAK", code: "GRPS-ROH", district: "Rohtak" },
  { id: "grps_sirsa", name: "GRP SIRSA", code: "GRPS-SRS", district: "Sirsa" },
  { id: "grps_sonipat", name: "GRP SONIPAT", code: "GRPS-SNP", district: "Sonipat" },
  { id: "grp_subdiv_amb", name: "GRP Sub-Division Ambala Cantt", code: "SD-AMB", district: "Ambala" },
  { id: "grp_subdiv_fbd", name: "GRP Sub-Division Faridabad", code: "SD-FBD", district: "Faridabad" },
  { id: "grp_subdiv_hsr", name: "GRP Sub-Division Hisar", code: "SD-HSR", district: "Hisar" },
];

export const TRAINING_CENTRES = [
  { id: "trg_cptr", name: "CPT&R, Bhondsi", code: "TRG-CPTR", district: "Gurugram" },
  { id: "trg_hpa", name: "HPA, Madhuban", code: "TRG-HPA", district: "Karnal" },
  { id: "trg_ptc_sun", name: "PTC, Sunaria", code: "TRG-PTC", district: "Rohtak" },
  { id: "trg_rtc_bhn", name: "RTC, Bhondsi", code: "TRG-RTC", district: "Gurugram" },
  { id: "trg_wptc_hsr", name: "WOMEN PTC Hisar", code: "TRG-WPTC", district: "Hisar" },
];

export const FORENSIC_LABS = [
  { id: "fsl_madhuban", name: "FSL Madhuban", code: "FSL-MDB", district: "Karnal" },
  { id: "fsl_cyber_pkl", name: "Cyber Lab Panchkula", code: "FSL-CYB", district: "Panchkula" },
  { id: "rfsl_ggn", name: "RFSL Gurugram", code: "RFSL-GGN", district: "Gurugram" },
  { id: "rfsl_hsr", name: "RFSL Hisar", code: "RFSL-HSR", district: "Hisar" },
  { id: "rfsl_pkl", name: "RFSL Panchkula", code: "RFSL-PKL", district: "Panchkula" },
  { id: "rfsl_roh", name: "RFSL Rohtak", code: "RFSL-ROH", district: "Rohtak" },
];

export const DEPUTATION_UNITS = [
  { id: "dep_cbi", name: "CBI (Central Bureau of Investigation)", code: "DEP-CBI" },
  { id: "dep_frro", name: "FRRO (Foreigners Regional Registration)", code: "DEP-FRRO" },
  { id: "dep_hhrc", name: "HHRC (Haryana Human Rights Commission)", code: "DEP-HHRC" },
  { id: "dep_homeguard", name: "Home Guard Haryana", code: "DEP-HG" },
  { id: "dep_lokayukta", name: "Lokayukta Haryana", code: "DEP-LOK" },
  { id: "dep_mining", name: "Mining Enforcement Wing", code: "DEP-MINE" },
  { id: "dep_prison", name: "Prisons Department Haryana", code: "DEP-JAIL" },
  { id: "dep_spca", name: "SPCA (State Police Complaints Authority)", code: "DEP-SPCA" },
  { id: "dep_svacb", name: "SV & ACB (State Vigilance / Anti Corruption)", code: "DEP-ACB" },
  { id: "dep_transport", name: "State Transport Department", code: "DEP-TPT" },
];

export const PHQ_DIRECTORATES = [
  { id: "phq_dgp_sec", name: "DGP Secretariat & Administration", code: "PHQ-DGP-SEC" },
  { id: "phq_lo_wing", name: "Law & Order Directorate", code: "PHQ-LO" },
  { id: "phq_crime_dir", name: "Crime & Investigation Directorate", code: "PHQ-CRIME" },
  { id: "phq_it_telecom", name: "Modernization, IT & Telecom Directorate", code: "PHQ-IT-TEL" },
  { id: "phq_scrb_hq", name: "State Crime Records Bureau (SCRB HQ)", code: "PHQ-SCRB" },
  { id: "phq_erss_112", name: "Haryana Dial 112 (ERSS HQ)", code: "PHQ-ERSS-112" },
];

export default function AccountManagementPage() {
  const { sessionUser, currentUser, isViewAs, enterViewAs } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  const activeTab: AccountTab = (searchParams.get("tab") as AccountTab) || "directory";

  // Data State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [accounts, setAccounts] = useState<MasterAccount[]>([]);
  const [auditLogs, setAuditLogs] = useState<AccountAuditLog[]>([]);
  const [locationDistricts, setLocationDistricts] = useState<MasterDistrict[]>([]);
  const [locationRanges, setLocationRanges] = useState<MasterRange[]>([]);
  const [locationStations, setLocationStations] = useState<MasterPoliceStation[]>([]);
  const [locationOffices, setLocationOffices] = useState<MasterOffice[]>([]);
  const [locationUnits, setLocationUnits] = useState<MasterSpecializedUnit[]>([]);

  // Filters for Directory
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [districtFilter, setDistrictFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [policyWingFilter, setPolicyWingFilter] = useState("ALL");

  // Selected Account for Reset PIN
  const [selectedAccount, setSelectedAccount] = useState<MasterAccount | null>(null);
  const [showResetPinModal, setShowResetPinModal] = useState(false);
  const [newPinValue, setNewPinValue] = useState("");
  const [resettingPin, setResettingPin] = useState(false);

  // Edit / Shift Officer Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<MasterAccount>>({});
  const [savingEdit, setSavingEdit] = useState(false);

  // Delete Officer Modal State (Developer Admin only)
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<MasterAccount | null>(null);
  const [deletingAccount, setDeletingAccount] = useState(false);

  // Special Allocation Modal State
  const [showSpecialAllocModal, setShowSpecialAllocModal] = useState(false);
  const [allocAccountId, setAllocAccountId] = useState("");
  const [allocDistrictId, setAllocDistrictId] = useState("");
  const [allocDistrictName, setAllocDistrictName] = useState("");
  const [allocStationNames, setAllocStationNames] = useState<string[]>([]);
  const [allocReason, setAllocReason] = useState("Special Law & Order / Election Duty");
  const [allocStartDate, setAllocStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [allocEndDate, setAllocEndDate] = useState("");
  const [savingAlloc, setSavingAlloc] = useState(false);

  // Form State for "Account Generation Form" - Defaults all to blank/select
  const initialFormData = {
    fullName: "",
    mobileNumber: "",
    email: "",
    pno: "",
    beltNumber: "",
    designation: "",
    rank: "",
    rankDisplay: "",
    role: "" as unknown as AccountRole,
    roleDisplay: "",
    assignedUnitType: "" as AssignedUnitType,
    assignedUnitId: "",
    assignedUnitName: "",
    state: "Haryana",
    range: "",
    district: "",
    zone: "",
    authorizedDistricts: [] as string[],
    policeStation: "",
    authorizedPoliceStations: [] as string[],
    jurisdictionType: "" as JurisdictionType,
    pin: "",
    confirmPin: "",
  };

  const [formData, setFormData] = useState(initialFormData);
  const [submittingAccount, setSubmittingAccount] = useState(false);

  // Developer Admin Access Check
  const isDeveloper =
    (sessionUser?.id === "cms_developer_admin" || sessionUser?.role === "SUPER_ADMIN") &&
    !isViewAs;

  // Load Accounts & Locations
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [accRes, locRes] = await Promise.all([
        fetch("/api/admin/accounts"),
        fetch("/api/admin/locations"),
      ]);

      if (!accRes.ok) throw new Error("Failed to load accounts.");
      const accData = await accRes.json();
      setAccounts(accData.accounts || []);
      setAuditLogs(accData.auditLogs || []);

      if (locRes.ok) {
        const locData = await locRes.json();
        setLocationDistricts(locData.districts || []);
        setLocationRanges(locData.ranges || []);
        setLocationStations(locData.policeStations || []);
        setLocationOffices(locData.offices || []);
        setLocationUnits(locData.specializedUnits || []);

        if (locData.districts?.length > 0 && !allocDistrictId) {
          setAllocDistrictId(locData.districts[0].id);
          setAllocDistrictName(locData.districts[0].name);
        }
      }
    } catch (e: any) {
      setError(e.message || "Failed to load master accounts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isDeveloper) {
      loadData();
    }
  }, [isDeveloper]);

  const setTab = (tab: AccountTab) => {
    router.push(`/admin/accounts?tab=${tab}`);
  };

  // Generate Temporary 6-Digit PIN
  const handleGeneratePin = () => {
    const randomPin = Math.floor(100000 + Math.random() * 900000).toString();
    setFormData((prev) => ({ ...prev, pin: randomPin, confirmPin: randomPin }));
  };

  // Dynamic Role Selection Rules (Police Rank is kept independent as requested)
  const handleRoleChange = (newRole: AccountRole | "") => {
    if (!newRole) {
      setFormData((prev) => ({
        ...prev,
        role: "" as unknown as AccountRole,
        roleDisplay: "",
        designation: "",
        assignedUnitType: "" as AssignedUnitType,
        jurisdictionType: "" as JurisdictionType,
      }));
      return;
    }

    let designation = "Inspector";
    let roleDisplay = "Inspector";
    let unitType: AssignedUnitType = "POLICE_STATION";
    let jurisdiction: JurisdictionType = "SINGLE_STATION";

    // 1. STATE POLICE HEADQUARTERS & RANGES
    if (newRole === "DGP") {
      designation = "Director General of Police";
      roleDisplay = "State Police Chief (DGP)";
      unitType = "PHQ";
      jurisdiction = "STATE_WIDE";
    } else if (newRole === "ADGP") {
      designation = "Additional Director General of Police";
      roleDisplay = "ADGP Headquarters / Law & Order";
      unitType = "PHQ";
      jurisdiction = "STATE_WIDE";
    } else if (newRole === "IG") {
      designation = "Inspector General of Police";
      roleDisplay = "IGP Range Command";
      unitType = "RANGE_OFFICE";
      jurisdiction = "RANGE_WIDE";
    } else if (newRole === "DIG") {
      designation = "Deputy Inspector General";
      roleDisplay = "DIG Range Command";
      unitType = "RANGE_OFFICE";
      jurisdiction = "RANGE_WIDE";
    }

    // 2. POLICE COMMISSIONERATE SYSTEM (Gurugram, Faridabad, Panchkula, Sonipat, Jhajjar)
    else if (newRole === "CP") {
      designation = "Commissioner of Police (CP)";
      roleDisplay = "Commissioner of Police (Commissionerate Command)";
      unitType = "COMMISSIONERATE_HQ";
      jurisdiction = "COMMISSIONERATE_WIDE";
    } else if (newRole === "JOINT_CP") {
      designation = "Joint / Additional CP";
      roleDisplay = "Joint Commissioner of Police";
      unitType = "COMMISSIONERATE_HQ";
      jurisdiction = "COMMISSIONERATE_WIDE";
    } else if (newRole === "DCP") {
      designation = "Deputy Commissioner of Police (DCP)";
      roleDisplay = "DCP (Zone / Traffic / Crime / HQ)";
      unitType = "COMMISSIONERATE_HQ";
      jurisdiction = "ZONE_WIDE";
    } else if (newRole === "ADDL_DCP") {
      designation = "Additional DCP";
      roleDisplay = "Additional DCP (Zonal Wing)";
      unitType = "COMMISSIONERATE_HQ";
      jurisdiction = "ZONE_WIDE";
    } else if (newRole === "ACP") {
      designation = "Assistant Commissioner of Police (ACP)";
      roleDisplay = "ACP (Sub-Division / Traffic / Crime)";
      unitType = "COMMISSIONERATE_HQ";
      jurisdiction = "SUBDIVISION_MULTI_STATION";
    } else if (newRole === "COMMISSIONERATE_SHO") {
      designation = "Station House Officer (SHO)";
      roleDisplay = "SHO (Commissionerate Police Station)";
      unitType = "POLICE_STATION";
      jurisdiction = "SINGLE_STATION";
    } else if (newRole === "COMMISSIONERATE_SI") {
      designation = "Sub-Inspector (SI)";
      roleDisplay = "Sub-Inspector (Commissionerate / Chowki Incharge)";
      unitType = "POLICE_STATION";
      jurisdiction = "SINGLE_STATION";
    } else if (newRole === "COMMISSIONERATE_ASI") {
      designation = "Assistant Sub-Inspector (ASI)";
      roleDisplay = "ASI (Commissionerate / Counter Intake)";
      unitType = "POLICE_STATION";
      jurisdiction = "SINGLE_STATION";
    } else if (newRole === "COMMISSIONERATE_HC") {
      designation = "Head Constable (HC)";
      roleDisplay = "Head Constable (Commissionerate)";
      unitType = "POLICE_STATION";
      jurisdiction = "SINGLE_STATION";
    } else if (newRole === "COMMISSIONERATE_CONSTABLE") {
      designation = "Constable";
      roleDisplay = "Constable (Commissionerate Beat / Patrol)";
      unitType = "POLICE_STATION";
      jurisdiction = "SINGLE_STATION";
    } else if (newRole === "COMMISSIONERATE_MHC") {
      designation = "Moharrir Head Constable (MHC)";
      roleDisplay = "MHC (Commissionerate Police Station)";
      unitType = "MHC_STORE";
      jurisdiction = "SINGLE_STATION";
    } else if (newRole === "COMMISSIONERATE_STAFF") {
      designation = "Station Staff";
      roleDisplay = "Station Staff (Commissionerate)";
      unitType = "POLICE_STATION";
      jurisdiction = "SINGLE_STATION";
    } else if (newRole === "COMMISSIONERATE_AUDITOR") {
      designation = "Viewer / Auditor";
      roleDisplay = "Viewer / Auditor (Commissionerate)";
      unitType = "COMMISSIONERATE_HQ";
      jurisdiction = "COMMISSIONERATE_WIDE";
    }

    // 3. ARMED POLICE (HAP & IRB BATTALIONS)
    else if (newRole === "COMMANDANT_ARMED") {
      designation = "Commandant (Battalion)";
      roleDisplay = "Commandant (HAP / IRB Battalion)";
      unitType = "ARMED_BATTALION";
      jurisdiction = "BATTALION_WIDE";
    } else if (newRole === "ADDL_COMMANDANT") {
      designation = "Additional Commandant";
      roleDisplay = "Additional Commandant (Armed Police)";
      unitType = "ARMED_BATTALION";
      jurisdiction = "BATTALION_WIDE";
    } else if (newRole === "ASST_COMMANDANT") {
      designation = "Assistant Commandant (DSP)";
      roleDisplay = "Assistant Commandant (Company Commander)";
      unitType = "ARMED_BATTALION";
      jurisdiction = "UNIT_BOUND";
    } else if (newRole === "ARMED_INSPECTOR") {
      designation = "Inspector (Company Commander)";
      roleDisplay = "Company Commander (HAP / IRB / CDI)";
      unitType = "ARMED_BATTALION";
      jurisdiction = "UNIT_BOUND";
    } else if (newRole === "ARMED_SI") {
      designation = "Sub-Inspector (Platoon Commander)";
      roleDisplay = "Platoon Commander / SI (HAP / IRB)";
      unitType = "ARMED_BATTALION";
      jurisdiction = "UNIT_BOUND";
    } else if (newRole === "ARMED_ASI") {
      designation = "Assistant Sub-Inspector (Section Commander)";
      roleDisplay = "Section Commander / ASI (Armed)";
      unitType = "ARMED_BATTALION";
      jurisdiction = "UNIT_BOUND";
    } else if (newRole === "ARMED_HC") {
      designation = "Head Constable (CHM / Section 2IC)";
      roleDisplay = "CHM / Head Constable (HAP / IRB)";
      unitType = "ARMED_BATTALION";
      jurisdiction = "UNIT_BOUND";
    } else if (newRole === "ARMED_CONSTABLE") {
      designation = "Armed Constable";
      roleDisplay = "Armed Constable (HAP / IRB Guard & Escort)";
      unitType = "ARMED_BATTALION";
      jurisdiction = "UNIT_BOUND";
    }

    // 4. TRAINING ACADEMIES & CENTERS (HPA MADHUBAN, PTC SUNARIA, RTC BHONDSI)
    else if (newRole === "TRAINING_DIRECTOR") {
      designation = "Director / DIG (Training)";
      roleDisplay = "Director / DIG (Police Academy / HPA)";
      unitType = "TRAINING_CENTRE";
      jurisdiction = "TRAINING_CAMPUS_WIDE";
    } else if (newRole === "TRAINING_PRINCIPAL") {
      designation = "Principal / SP (Training)";
      roleDisplay = "Principal / SP (PTC / RTC College)";
      unitType = "TRAINING_CENTRE";
      jurisdiction = "TRAINING_CAMPUS_WIDE";
    } else if (newRole === "TRAINING_INSTRUCTOR") {
      designation = "Training Instructor (Inspector / SI)";
      roleDisplay = "Training Instructor (Law / Tactics / Firing)";
      unitType = "TRAINING_CENTRE";
      jurisdiction = "TRAINING_CAMPUS_WIDE";
    } else if (newRole === "TRAINING_MHC") {
      designation = "Moharrir Head Constable (MHC)";
      roleDisplay = "MHC (Academy Malkhana & Training Records)";
      unitType = "TRAINING_CENTRE";
      jurisdiction = "TRAINING_CAMPUS_WIDE";
    } else if (newRole === "TRAINING_HC") {
      designation = "Drill Instructor (DI) / HC";
      roleDisplay = "Drill Instructor / Head Constable (Training)";
      unitType = "TRAINING_CENTRE";
      jurisdiction = "TRAINING_CAMPUS_WIDE";
    } else if (newRole === "TRAINING_CONSTABLE") {
      designation = "Recruit Constable (Trainee)";
      roleDisplay = "Recruit Constable (Basic Training Cadre)";
      unitType = "TRAINING_CENTRE";
      jurisdiction = "TRAINING_CAMPUS_WIDE";
    }

    // 5. SPECIALIZED UNITS (CID, STF, STATE CYBER, STATE CRIME BRANCH)
    else if (newRole === "SPECIAL_UNIT_SP") {
      designation = "Superintendent of Police (Special Wing)";
      roleDisplay = "SP (CID / STF / State Cyber / State Crime)";
      unitType = "SPECIALIZED_UNIT";
      jurisdiction = "STATE_WIDE";
    } else if (newRole === "SPECIAL_UNIT_DSP") {
      designation = "Deputy SP (Special Operations)";
      roleDisplay = "DSP (CID / STF / Cyber Unit)";
      unitType = "SPECIALIZED_UNIT";
      jurisdiction = "RANGE_WIDE";
    } else if (newRole === "SPECIAL_UNIT_INSPECTOR") {
      designation = "Inspector (Specialized Cell)";
      roleDisplay = "Inspector (Cyber Cell / STF / CID)";
      unitType = "SPECIALIZED_UNIT";
      jurisdiction = "DISTRICT_WIDE";
    } else if (newRole === "SPECIAL_UNIT_SI") {
      designation = "Sub-Inspector (Specialized Investigation)";
      roleDisplay = "SI (Specialized Intelligence / Cyber IO)";
      unitType = "SPECIALIZED_UNIT";
      jurisdiction = "UNIT_BOUND";
    } else if (newRole === "SPECIAL_UNIT_ASI") {
      designation = "Assistant Sub-Inspector (ASI)";
      roleDisplay = "ASI (Specialized Unit / Cyber Cell)";
      unitType = "SPECIALIZED_UNIT";
      jurisdiction = "UNIT_BOUND";
    } else if (newRole === "SPECIAL_UNIT_IO") {
      designation = "Investigating Officer (IO)";
      roleDisplay = "Investigating Officer (Specialized Unit)";
      unitType = "SPECIALIZED_UNIT";
      jurisdiction = "UNIT_BOUND";
    } else if (newRole === "SPECIAL_UNIT_MHC") {
      designation = "Moharrir Head Constable (MHC)";
      roleDisplay = "MHC (Specialized Unit Records & Store)";
      unitType = "SPECIALIZED_UNIT";
      jurisdiction = "UNIT_BOUND";
    } else if (newRole === "SPECIAL_UNIT_DUTY_OFFICER") {
      designation = "Duty Officer (Counter Intake)";
      roleDisplay = "Duty Officer (Specialized Unit Reception)";
      unitType = "SPECIALIZED_UNIT";
      jurisdiction = "UNIT_BOUND";
    } else if (newRole === "SPECIAL_UNIT_HC") {
      designation = "Head Constable";
      roleDisplay = "Head Constable (Specialized Unit)";
      unitType = "SPECIALIZED_UNIT";
      jurisdiction = "UNIT_BOUND";
    } else if (newRole === "SPECIAL_UNIT_CONSTABLE") {
      designation = "Constable";
      roleDisplay = "Constable (Specialized Unit)";
      unitType = "SPECIALIZED_UNIT";
      jurisdiction = "UNIT_BOUND";
    } else if (newRole === "SPECIAL_UNIT_STAFF") {
      designation = "Station Staff";
      roleDisplay = "Staff (Specialized Unit)";
      unitType = "SPECIALIZED_UNIT";
      jurisdiction = "UNIT_BOUND";
    } else if (newRole === "SPECIAL_UNIT_AUDITOR") {
      designation = "Viewer / Auditor";
      roleDisplay = "Viewer / Auditor (Specialized Unit)";
      unitType = "SPECIALIZED_UNIT";
      jurisdiction = "STATE_WIDE";
    }

    // 6. DISTRICT EXECUTIVE POLICE (STANDARD DISTRICT SYSTEM)
    else if (newRole === "SP_DISTRICT") {
      designation = "Superintendent of Police (SP)";
      roleDisplay = "District Police Chief (SP)";
      unitType = "DISTRICT_OFFICE";
      jurisdiction = "DISTRICT_WIDE";
    } else if (newRole === "ASP") {
      designation = "Additional SP (ASP)";
      roleDisplay = "Additional SP (District HQ)";
      unitType = "DISTRICT_OFFICE";
      jurisdiction = "DISTRICT_WIDE";
    } else if (newRole === "DSP_SUBDIV") {
      designation = "Deputy SP (Sub-Division)";
      roleDisplay = "DSP Sub-Divisional Officer";
      unitType = "DISTRICT_OFFICE";
      jurisdiction = "SUBDIVISION_MULTI_STATION";
    } else if (newRole === "SHO") {
      designation = "Station House Officer (SHO)";
      roleDisplay = "Station House Officer (SHO)";
      unitType = "POLICE_STATION";
      jurisdiction = "SINGLE_STATION";
    } else if (newRole === "INSPECTOR") {
      designation = "Inspector of Police";
      roleDisplay = "Inspector";
      unitType = "POLICE_STATION";
      jurisdiction = "SINGLE_STATION";
    } else if (newRole === "SI") {
      designation = "Sub-Inspector";
      roleDisplay = "Sub-Inspector";
      unitType = "POLICE_STATION";
      jurisdiction = "SINGLE_STATION";
    } else if (newRole === "ASI") {
      designation = "Assistant Sub-Inspector";
      roleDisplay = "Assistant Sub-Inspector";
      unitType = "POLICE_STATION";
      jurisdiction = "SINGLE_STATION";
    } else if (newRole === "ENQUIRY_OFFICER") {
      designation = "Investigating Officer (IO)";
      roleDisplay = "Investigating Officer (IO)";
      unitType = "INVESTIGATION_UNIT";
      jurisdiction = "SINGLE_STATION";
    } else if (newRole === "MHC_GD_INCHARGE") {
      designation = "Moharrir Head Constable (MHC)";
      roleDisplay = "Moharrir Head Constable (MHC Store & GD)";
      unitType = "MHC_STORE";
      jurisdiction = "SINGLE_STATION";
    } else if (newRole === "DUTY_OFFICER") {
      designation = "Duty Officer (Counter)";
      roleDisplay = "Duty Officer (Intake Counter)";
      unitType = "POLICE_STATION";
      jurisdiction = "SINGLE_STATION";
    } else if (newRole === "HEAD_CONSTABLE") {
      designation = "Head Constable";
      roleDisplay = "Head Constable (Station Staff)";
      unitType = "POLICE_STATION";
      jurisdiction = "SINGLE_STATION";
    } else if (newRole === "CONSTABLE") {
      designation = "Constable";
      roleDisplay = "Constable (General Duty)";
      unitType = "POLICE_STATION";
      jurisdiction = "SINGLE_STATION";
    } else if (newRole === "STATION_STAFF") {
      designation = "Station Staff";
      roleDisplay = "Station Staff";
      unitType = "POLICE_STATION";
      jurisdiction = "SINGLE_STATION";
    } else if (newRole === "VIEWER_AUDITOR") {
      designation = "Auditor / Supervisory Inspector";
      roleDisplay = "Supervisory Auditor";
      unitType = "DISTRICT_OFFICE";
      jurisdiction = "DISTRICT_WIDE";
    }

    setFormData((prev) => ({
      ...prev,
      role: newRole as AccountRole,
      roleDisplay,
      designation,
      assignedUnitType: unitType,
      jurisdictionType: jurisdiction,
    }));
  };

  // Range / Wing Change logic
  const handleRangeChange = (newRange: string) => {
    setFormData((prev) => {
      if (!newRange) {
        return {
          ...prev,
          range: "",
          district: "",
          authorizedDistricts: [],
          policeStation: "",
          assignedUnitName: "",
          assignedUnitId: "",
          authorizedPoliceStations: [],
        };
      }

      // Check if this is a Commissionerate
      const comm = COMMISSIONERATES_LIST.find((c) => c.name === newRange);
      if (comm) {
        return {
          ...prev,
          range: newRange,
          district: comm.district,
          authorizedDistricts: [comm.district],
          zone: "",
          assignedUnitType: prev.assignedUnitType || "COMMISSIONERATE_HQ",
          policeStation: "",
          assignedUnitName: "",
          assignedUnitId: "",
          authorizedPoliceStations: [],
        };
      }

      // Check specialized wings
      if (newRange.includes("GRP")) {
        return {
          ...prev,
          range: newRange,
          assignedUnitType: "GRP_STATION",
          policeStation: "",
          assignedUnitName: "",
          assignedUnitId: "",
          authorizedPoliceStations: [],
        };
      }
      if (newRange.includes("Armed Police")) {
        return {
          ...prev,
          range: newRange,
          assignedUnitType: "ARMED_BATTALION",
          policeStation: "",
          assignedUnitName: "",
          assignedUnitId: "",
          authorizedPoliceStations: [],
        };
      }
      if (newRange.includes("PHQ")) {
        return {
          ...prev,
          range: newRange,
          district: "State Level / All Districts",
          assignedUnitType: "PHQ",
          policeStation: "",
          assignedUnitName: "",
          assignedUnitId: "",
          authorizedPoliceStations: [],
        };
      }
      if (newRange.includes("Forensic")) {
        return {
          ...prev,
          range: newRange,
          assignedUnitType: "FORENSIC_LAB",
          policeStation: "",
          assignedUnitName: "",
          assignedUnitId: "",
          authorizedPoliceStations: [],
        };
      }
      if (newRange.includes("Training")) {
        return {
          ...prev,
          range: newRange,
          assignedUnitType: "TRAINING_CENTRE",
          policeStation: "",
          assignedUnitName: "",
          assignedUnitId: "",
          authorizedPoliceStations: [],
        };
      }
      if (newRange.includes("Deputation")) {
        return {
          ...prev,
          range: newRange,
          assignedUnitType: "DEPUTATION_UNIT",
          policeStation: "",
          assignedUnitName: "",
          assignedUnitId: "",
          authorizedPoliceStations: [],
        };
      }

      // Territorial Range - check if current district matches
      const isMatching = locationDistricts.some(
        (d) => d.name === prev.district && d.rangeName === newRange
      );

      return {
        ...prev,
        range: newRange,
        district: isMatching ? prev.district : "",
        authorizedDistricts: isMatching ? prev.authorizedDistricts : [],
        policeStation: isMatching ? prev.policeStation : "",
        assignedUnitName: isMatching ? prev.assignedUnitName : "",
        assignedUnitId: isMatching ? prev.assignedUnitId : "",
        authorizedPoliceStations: isMatching ? prev.authorizedPoliceStations : [],
      };
    });
  };

  // District Change cascading logic - sets posting location to empty by default
  const handleDistrictChange = (newDistrict: string) => {
    if (!newDistrict) {
      setFormData((prev) => ({
        ...prev,
        district: "",
        policeStation: "",
        assignedUnitName: "",
        assignedUnitId: "",
        authorizedDistricts: [],
        authorizedPoliceStations: [],
      }));
      return;
    }

    const matchedDst = locationDistricts.find((d) => d.name === newDistrict);
    const rangeName = matchedDst?.rangeName || formData.range || "";

    setFormData((prev) => ({
      ...prev,
      district: newDistrict,
      range: rangeName,
      policeStation: "",
      assignedUnitId: "",
      assignedUnitName: "",
      authorizedDistricts: [newDistrict],
      authorizedPoliceStations: [],
    }));
  };

  // Posting Location selection logic from master records
  const handlePostingLocationChange = (locationName: string) => {
    if (!locationName) {
      setFormData((prev) => ({
        ...prev,
        policeStation: "",
        assignedUnitName: "",
        assignedUnitId: "",
        authorizedPoliceStations: [],
      }));
      return;
    }

    const stn = locationStations.find((s) => s.name === locationName);
    const off = locationOffices.find((o) => o.name === locationName);
    const unt = locationUnits.find((u) => u.name === locationName);
    const grp = GRP_STATIONS_LIST.find((g) => g.name === locationName);
    const arm = ARMED_BATTALIONS.find((b) => b.name === locationName);
    const trg = TRAINING_CENTRES.find((t) => t.name === locationName);
    const fsl = FORENSIC_LABS.find((f) => f.name === locationName);
    const dep = DEPUTATION_UNITS.find((d) => d.name === locationName);
    const phq = PHQ_DIRECTORATES.find((p) => p.name === locationName);

    const entityCode =
      stn?.code ||
      off?.code ||
      unt?.code ||
      grp?.code ||
      arm?.code ||
      trg?.code ||
      fsl?.code ||
      dep?.code ||
      phq?.code ||
      `HAR-${locationName.slice(0, 4).toUpperCase()}-01`;

    const entityDistrict =
      stn?.districtName ||
      off?.districtName ||
      unt?.districtName ||
      grp?.district ||
      trg?.district ||
      fsl?.district;

    const entityRange =
      stn?.rangeName ||
      off?.rangeName ||
      unt?.rangeName;

    setFormData((prev) => ({
      ...prev,
      policeStation: locationName,
      assignedUnitName: locationName,
      assignedUnitId: entityCode,
      authorizedPoliceStations: [locationName],
      district: prev.district || entityDistrict || prev.district,
      range: prev.range || entityRange || prev.range,
    }));
  };

  // Zone change logic for Commissionerates
  const handleZoneChange = (newZone: string) => {
    setFormData((prev) => {
      let updatedDesignation = prev.designation;
      let updatedRoleDisplay = prev.roleDisplay;

      if (prev.role === "DCP") {
        updatedDesignation = newZone ? `Deputy Commissioner of Police (${newZone})` : "Deputy Commissioner of Police (DCP)";
        updatedRoleDisplay = newZone ? `DCP ${newZone}` : "DCP (Zone)";
      } else if (prev.role === "ADDL_DCP") {
        updatedDesignation = newZone ? `Additional DCP (${newZone})` : "Additional DCP";
        updatedRoleDisplay = newZone ? `Addl. DCP ${newZone}` : "Additional DCP (Zone)";
      } else if (prev.role === "ACP") {
        updatedDesignation = newZone ? `Assistant Commissioner of Police (${newZone})` : "Assistant Commissioner of Police (ACP)";
        updatedRoleDisplay = newZone ? `ACP ${newZone} Division` : "ACP (Division)";
      }

      return {
        ...prev,
        zone: newZone,
        designation: updatedDesignation,
        roleDisplay: updatedRoleDisplay,
      };
    });
  };

  // Whether current selection or role is part of a Police Commissionerate
  const isCommissionerate = useMemo(() => {
    return (
      COMMISSIONERATES_LIST.some((c) => c.name.toLowerCase() === (formData.range || "").toLowerCase()) ||
      COMMISSIONERATES_LIST.some((c) => c.district.toLowerCase() === (formData.district || "").toLowerCase()) ||
      formData.assignedUnitType === "COMMISSIONERATE_HQ" ||
      [
        "CP",
        "JOINT_CP",
        "DCP",
        "ADDL_DCP",
        "ACP",
        "COMMISSIONERATE_SHO",
        "COMMISSIONERATE_SI",
        "COMMISSIONERATE_ASI",
        "COMMISSIONERATE_MHC",
        "COMMISSIONERATE_HC",
        "COMMISSIONERATE_CONSTABLE",
        "COMMISSIONERATE_STAFF",
        "COMMISSIONERATE_AUDITOR",
      ].includes(formData.role)
    );
  }, [formData.range, formData.district, formData.assignedUnitType, formData.role]);

  // Active zones for the selected commissionerate
  const activeCommissionerateZones = useMemo(() => {
    const comm = COMMISSIONERATES_LIST.find((c) => {
      return (
        c.name.toLowerCase() === (formData.range || "").toLowerCase() ||
        c.district.toLowerCase() === (formData.district || "").toLowerCase()
      );
    });
    if (comm) {
      return COMMISSIONERATE_ZONES.filter((z) => z.commissionerateName === comm.name);
    }
    return COMMISSIONERATE_ZONES.filter((z) =>
      formData.district ? z.commissionerateName.toLowerCase().includes(formData.district.toLowerCase()) : true
    );
  }, [formData.range, formData.district]);

  // Dynamic filtered lists strictly based on user selections
  const filteredDistricts = useMemo(() => {
    if (!formData.range) return [];

    // 1. Commissionerates (Faridabad, Gurugram, Jhajjar, Panchkula, Sonipat)
    const comm = COMMISSIONERATES_LIST.find(
      (c) => c.name.toLowerCase() === formData.range.toLowerCase()
    );
    if (comm) {
      const match = locationDistricts.find(
        (d) => d.name.toLowerCase() === comm.district.toLowerCase()
      );
      if (match) return [match];
      return [
        {
          id: `dst_${comm.district.toLowerCase()}`,
          name: comm.district,
          code: `DST-${comm.district.slice(0, 3).toUpperCase()}`,
          rangeName: comm.name,
        } as MasterDistrict,
      ];
    }

    // 2. State-level Wings
    if (formData.range.includes("PHQ") || formData.range.includes("State Headquarters")) {
      return [
        {
          id: "dst_phq",
          name: "State Headquarters (Panchkula)",
          code: "DST-PHQ",
          rangeName: "State Headquarters (PHQ)",
        } as MasterDistrict,
      ];
    }
    if (formData.range.includes("GRP")) {
      return [
        {
          id: "dst_grp_all",
          name: "All Railways (GRP Haryana)",
          code: "DST-GRP",
          rangeName: "GRP Haryana",
        } as MasterDistrict,
      ];
    }
    if (formData.range.includes("Armed Police")) {
      return [
        { id: "dst_arm_mdb", name: "Madhuban (Karnal HQ)", code: "DST-HAP-MDB", rangeName: "Armed Police" } as MasterDistrict,
        { id: "dst_arm_amb", name: "Ambala City (1st Bn)", code: "DST-HAP-AMB", rangeName: "Armed Police" } as MasterDistrict,
        { id: "dst_arm_hsr", name: "Hisar (3rd Bn)", code: "DST-HAP-HSR", rangeName: "Armed Police" } as MasterDistrict,
        { id: "dst_arm_bhn", name: "Bhondsi (IRB HQ)", code: "DST-IRB-BHN", rangeName: "Armed Police" } as MasterDistrict,
        { id: "dst_arm_sun", name: "Sunaria (3rd Bn IRB)", code: "DST-IRB-SUN", rangeName: "Armed Police" } as MasterDistrict,
      ];
    }
    if (formData.range.includes("Training")) {
      return [
        { id: "dst_trg_mdb", name: "Madhuban (HPA Academy)", code: "DST-TRG-MDB", rangeName: "Training" } as MasterDistrict,
        { id: "dst_trg_sun", name: "Sunaria (PTC College)", code: "DST-TRG-SUN", rangeName: "Training" } as MasterDistrict,
        { id: "dst_trg_bhn", name: "Bhondsi (RTC College)", code: "DST-TRG-BHN", rangeName: "Training" } as MasterDistrict,
        { id: "dst_trg_hsr", name: "Hisar (Women PTC)", code: "DST-TRG-HSR", rangeName: "Training" } as MasterDistrict,
      ];
    }
    if (formData.range.includes("Forensic")) {
      return [
        { id: "dst_fsl_mdb", name: "Madhuban (Main FSL)", code: "DST-FSL-MDB", rangeName: "Forensic" } as MasterDistrict,
        { id: "dst_fsl_pkl", name: "Panchkula (Cyber FSL)", code: "DST-FSL-PKL", rangeName: "Forensic" } as MasterDistrict,
        { id: "dst_fsl_ggn", name: "Gurugram (RFSL)", code: "DST-FSL-GGN", rangeName: "Forensic" } as MasterDistrict,
        { id: "dst_fsl_hsr", name: "Hisar (RFSL)", code: "DST-FSL-HSR", rangeName: "Forensic" } as MasterDistrict,
        { id: "dst_fsl_roh", name: "Rohtak (RFSL)", code: "DST-FSL-ROH", rangeName: "Forensic" } as MasterDistrict,
      ];
    }
    if (formData.range.includes("Specialized")) {
      return [
        {
          id: "dst_spec_pkl",
          name: "State Specialized Units (Panchkula)",
          code: "DST-SPEC",
          rangeName: "Specialized State Units",
        } as MasterDistrict,
      ];
    }
    if (formData.range.includes("Deputation")) {
      return [
        {
          id: "dst_dep_all",
          name: "State Deputation (Haryana)",
          code: "DST-DEP",
          rangeName: "Deputation Units",
        } as MasterDistrict,
      ];
    }

    // 3. Territorial Police Ranges - strictly match districts belonging to this range
    const normRange = formData.range.toLowerCase().replace("police range", "range").trim();
    const matched = locationDistricts.filter((d) => {
      const dRangeNorm = (d.rangeName || "").toLowerCase().replace("police range", "range").trim();
      if (dRangeNorm === normRange) return true;
      const rangeObj = locationRanges.find((r) => r.name.toLowerCase() === formData.range.toLowerCase());
      if (rangeObj && d.rangeId === rangeObj.id) return true;
      const keywords = ["karnal", "ambala", "hisar", "rohtak", "south", "rewari"];
      for (const kw of keywords) {
        if (normRange.includes(kw) && dRangeNorm.includes(kw)) return true;
      }
      return false;
    });

    return matched;
  }, [formData.range, locationDistricts, locationRanges]);

  const filteredStations = useMemo(() => {
    if (!formData.district) return [];
    const allInDistrict = locationStations.filter((ps) => {
      if (formData.district === "All Railways (GRP Haryana)") return true;
      return ps.districtName?.toLowerCase() === formData.district.toLowerCase();
    });

    if (isCommissionerate && formData.zone) {
      const zoneItem = COMMISSIONERATE_ZONES.find(
        (z) =>
          (z.commissionerateName.toLowerCase() === (formData.range || "").toLowerCase() ||
            z.district.toLowerCase() === (formData.district || "").toLowerCase()) &&
          z.name === formData.zone
      );
      if (zoneItem && zoneItem.stationKeywords?.length) {
        const matching = allInDistrict.filter((ps) => {
          const nameLower = ps.name.toLowerCase();
          const subLower = (ps.subDivision || "").toLowerCase();
          return zoneItem.stationKeywords.some((kw) => nameLower.includes(kw) || subLower.includes(kw));
        });
        const others = allInDistrict.filter((ps) => !matching.some((m) => m.id === ps.id));
        return [...matching, ...others];
      }
    }

    return allInDistrict;
  }, [formData.district, formData.range, formData.zone, isCommissionerate, locationStations]);

  const filteredOffices = useMemo(() => {
    if (!formData.district) return [];
    const baseOffices = locationOffices.filter((off) => {
      if (formData.district.includes("State Headquarters")) {
        return off.officeType === "PHQ" || (!off.districtId && !off.rangeId);
      }
      return (
        off.districtName?.toLowerCase() === formData.district.toLowerCase() ||
        (off.rangeName?.toLowerCase() === formData.range?.toLowerCase() && off.officeType === "IG_OFFICE")
      );
    });

    // If Commissionerate, add Zonal DCP / ACP offices dynamically
    if (isCommissionerate) {
      const zonalOffices: MasterOffice[] = [];
      if (formData.zone) {
        zonalOffices.push({
          id: `off_dcp_${formData.zone.toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
          name: `Office of DCP (${formData.zone})`,
          code: `DCP-${formData.zone.slice(0, 4).toUpperCase()}`,
          officeType: "SP_OFFICE",
          stateId: "st_har",
          stateName: "Haryana",
          districtId: `dst_${formData.district.toLowerCase()}`,
          districtName: formData.district,
          physicalAddress: `DCP Office, ${formData.zone}, ${formData.district}`,
          officeHead: `DCP ${formData.zone}`,
          status: "ACTIVE",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        zonalOffices.push({
          id: `off_acp_${formData.zone.toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
          name: `Office of ACP (${formData.zone} Division)`,
          code: `ACP-${formData.zone.slice(0, 4).toUpperCase()}`,
          officeType: "DSP_OFFICE",
          stateId: "st_har",
          stateName: "Haryana",
          districtId: `dst_${formData.district.toLowerCase()}`,
          districtName: formData.district,
          physicalAddress: `ACP Division Office, ${formData.zone}`,
          officeHead: `ACP ${formData.zone}`,
          status: "ACTIVE",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
      return [...zonalOffices, ...baseOffices];
    }

    return baseOffices;
  }, [formData.district, formData.range, formData.zone, isCommissionerate, locationOffices]);

  const filteredUnits = useMemo(() => {
    if (!formData.district) return [];
    return locationUnits.filter((u) => {
      return u.districtName?.toLowerCase() === formData.district.toLowerCase();
    });
  }, [formData.district, locationUnits]);

  // Open Edit & Shift Officer Modal
  const openEditAccountModal = (acc: MasterAccount) => {
    setSelectedAccount(acc);
    setEditFormData({
      fullName: acc.fullName,
      mobileNumber: acc.mobileNumber,
      email: acc.email,
      beltNumber: acc.beltNumber,
      rank: acc.rank,
      rankDisplay: acc.rankDisplay,
      designation: acc.designation,
      role: acc.role,
      district: acc.district,
      range: acc.range,
      zone: acc.zone || "",
      policeStation: acc.policeStation,
      assignedUnitName: acc.assignedUnitName,
      assignedUnitId: acc.assignedUnitId,
    });
    setShowEditModal(true);
  };

  // Save Edit & Shift Account
  const handleSaveAccountEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccount) return;
    setSavingEdit(true);
    try {
      const res = await fetch("/api/admin/accounts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          accountId: selectedAccount.id,
          updates: editFormData,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update account.");

      setSuccessMsg(`Account for ${selectedAccount.fullName} (${selectedAccount.pno}) updated / shifted successfully!`);
      setShowEditModal(false);
      await loadData();
    } catch (err: any) {
      alert(err.message || "Failed to update officer posting.");
    } finally {
      setSavingEdit(false);
    }
  };

  // Save Special Station Allocation
  const handleSaveSpecialAllocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allocAccountId || !allocDistrictId || allocStationNames.length === 0) {
      alert("Please select an officer, district and at least one police station.");
      return;
    }

    setSavingAlloc(true);
    try {
      const res = await fetch("/api/admin/accounts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "special-allocation",
          accountId: allocAccountId,
          allocation: {
            districtId: allocDistrictId,
            districtName: allocDistrictName,
            policeStationIds: allocStationNames,
            policeStationNames: allocStationNames,
            assignmentReason: allocReason,
            startDate: allocStartDate,
            endDate: allocEndDate || undefined,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add allocation.");

      setSuccessMsg("Special station allocation granted successfully!");
      setShowSpecialAllocModal(false);
      await loadData();
    } catch (err: any) {
      alert(err.message || "Failed to add allocation.");
    } finally {
      setSavingAlloc(false);
    }
  };

  // Submit New Account
  const handleCreateAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.pno || !formData.mobileNumber) {
      alert("Please fill all required personal fields (Name, PNO, Mobile).");
      return;
    }
    if (!formData.role) {
      alert("Please select a System Role.");
      return;
    }
    if (!formData.rank) {
      alert("Please select a Police Rank.");
      return;
    }
    if (!formData.assignedUnitType) {
      alert("Please select an Assigned Unit Type.");
      return;
    }
    if (!formData.district && !formData.range) {
      alert("Please select a District or Range / Commissionerate.");
      return;
    }
    if (!formData.policeStation && !formData.assignedUnitName) {
      alert("Please select a Police Station or Posting Location.");
      return;
    }
    if (!formData.pin || formData.pin.length < 4) {
      alert("Please enter a valid Login PIN (at least 4 digits).");
      return;
    }
    if (formData.pin !== formData.confirmPin) {
      alert("PIN and Confirm PIN do not match.");
      return;
    }

    setSubmittingAccount(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          district: formData.district || "State Level / All Districts",
          range: formData.range || "Haryana State Command",
          policeStation: formData.policeStation || formData.assignedUnitName,
          assignedUnitName: formData.assignedUnitName || formData.policeStation,
          jurisdictionType: formData.jurisdictionType || "SINGLE_STATION",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create account.");

      setSuccessMsg(`Account for ${formData.fullName} (${formData.pno}) generated successfully!`);
      await loadData();
      setFormData(initialFormData);
      setTab("directory");
    } catch (err: any) {
      setError(err.message || "Failed to generate account.");
    } finally {
      setSubmittingAccount(false);
    }
  };

  // Toggle Account Active / Inactive Status
  const handleToggleAccountStatus = async (account: MasterAccount) => {
    const nextStatus = account.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      const res = await fetch("/api/admin/accounts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle-status",
          accountId: account.id,
          status: nextStatus,
        }),
      });
      if (!res.ok) throw new Error("Status update failed.");
      await loadData();
    } catch (err: any) {
      alert(err.message || "Failed to toggle status.");
    }
  };

  // Reset PIN submit
  const handleResetPinSubmit = async () => {
    if (!selectedAccount || !newPinValue || newPinValue.length < 4) {
      alert("Please enter a valid PIN (at least 4 digits).");
      return;
    }
    setResettingPin(true);
    try {
      const res = await fetch("/api/admin/accounts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reset-pin",
          accountId: selectedAccount.id,
          pin: newPinValue,
        }),
      });
      if (!res.ok) throw new Error("PIN reset failed.");
      alert(`PIN for ${selectedAccount.fullName} (${selectedAccount.pno}) reset successfully.`);
      setShowResetPinModal(false);
      setNewPinValue("");
      await loadData();
    } catch (err: any) {
      alert(err.message || "Failed to reset PIN.");
    } finally {
      setResettingPin(false);
    }
  };

  // Delete Account Confirmation & Execution (Developer Administrator only)
  const confirmDeleteAccount = async () => {
    if (!accountToDelete) return;
    setDeletingAccount(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/accounts?id=${encodeURIComponent(accountToDelete.id)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to delete account.");
      }
      setSuccessMsg(`Account for ${accountToDelete.fullName} (${accountToDelete.pno}) was deleted successfully.`);
      setShowDeleteModal(false);
      setAccountToDelete(null);
      await loadData();
    } catch (err: any) {
      setError(err.message || "Failed to delete account.");
    } finally {
      setDeletingAccount(false);
    }
  };

  // View-As (1-Click Login As Officer)
  const handleLoginAsOfficer = async (acc: MasterAccount) => {
    const sessionObj = {
      id: acc.id,
      pno: acc.pno,
      name: acc.fullName,
      beltNumber: acc.beltNumber,
      rank: acc.rank as any,
      rankDisplay: acc.rankDisplay,
      role: acc.role as any,
      roleDisplay: acc.roleDisplay,
      stationName: acc.policeStation,
      stationCode: acc.assignedUnitId,
      district: acc.district,
      zone: acc.zone,
      unitId: acc.assignedUnitId,
    };
    const ok = await enterViewAs(sessionObj as any);
    if (ok) {
      router.push("/");
    } else {
      alert("Could not switch view to this officer.");
    }
  };

  // Filtered accounts for directory
  const filteredAccounts = useMemo(() => {
    return accounts.filter((a) => {
      const matchesSearch =
        !searchQuery ||
        a.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.pno.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.policeStation.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.district.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRole = roleFilter === "ALL" || a.role === roleFilter;
      const matchesDistrict = districtFilter === "ALL" || a.district === districtFilter;
      const matchesStatus = statusFilter === "ALL" || a.status === statusFilter;

      return matchesSearch && matchesRole && matchesDistrict && matchesStatus;
    });
  }, [accounts, searchQuery, roleFilter, districtFilter, statusFilter]);

  // If unauthorized
  if (!isDeveloper) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <div className="bg-white max-w-md w-full p-6 rounded-2xl border border-red-200 shadow-md text-center space-y-4">
          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Developer Administrator Required</h2>
          <p className="text-xs text-slate-600">
            Account Management & User Generation is a developer-only administrative module.
            Your current logged-in role does not hold authorization to manage officer credentials.
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

  return (
    <div className="space-y-6 animate-in fade-in-50 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
              Developer Authority
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-medium">Police CMS User Provisioning & RBAC</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2">
            <Users className="w-6 h-6 text-[#1e3a8a]" />
            Account Management & User Generation
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Create, edit, shift postings, configure jurisdictions and audit officer accounts across all police ranks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
            title="Refresh Directory"
          >
            <RefreshCw className={cn("w-3.5 h-3.5 text-slate-500", loading && "animate-spin")} />
            <span>Sync</span>
          </button>
          <button
            type="button"
            onClick={() => setTab("new")}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#1e3a8a] text-white text-xs font-bold hover:bg-[#152865] transition-colors shadow-xs cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>+ Generate Officer Account</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-slate-200 text-xs pb-px scrollbar-none">
        {[
          { key: "directory", label: "Officer Directory", count: accounts.length, icon: Users },
          { key: "new", label: "Account Generation Form", icon: UserPlus },
          { key: "special-allocations", label: "Special Station Allocations", icon: BadgeCheck },
          { key: "policies", label: "Role Jurisdiction Regulations", icon: Shield },
          { key: "audits", label: "Audit Logs", count: auditLogs.length, icon: Clock },
        ].map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key as AccountTab)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 font-semibold transition-all border-b-2 whitespace-nowrap cursor-pointer",
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

      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* TAB 1: OFFICER DIRECTORY TABLE */}
      {activeTab === "directory" && (
        <div className="space-y-4">
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-[240px]">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by Name, PNO, Police Station, District..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs flex-wrap">
              <select
                aria-label="Filter by Role"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium"
              >
                <option value="ALL">All Roles</option>
                <option value="SP_DISTRICT">SP / ASP</option>
                <option value="DSP_SUBDIV">DSP</option>
                <option value="SHO">SHO (Inspector)</option>
                <option value="ENQUIRY_OFFICER">Investigating Officer (IO)</option>
                <option value="MHC_GD_INCHARGE">MHC (Store & GD)</option>
                <option value="DUTY_OFFICER">Duty Officer</option>
              </select>

              <select
                aria-label="Filter by District"
                value={districtFilter}
                onChange={(e) => setDistrictFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium"
              >
                <option value="ALL">All Districts</option>
                {locationDistricts.map((d) => (
                  <option key={d.id} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>

              <select
                aria-label="Filter by Status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium"
              >
                <option value="ALL">All Status</option>
                <option value="ACTIVE">Active Only</option>
                <option value="INACTIVE">Inactive Only</option>
              </select>
            </div>
          </div>

          {/* Directory Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-600 uppercase">
                  <tr>
                    <th className="p-3">Officer Details</th>
                    <th className="p-3">PNO / Belt</th>
                    <th className="p-3">Role & Rank</th>
                    <th className="p-3">Assigned Unit</th>
                    <th className="p-3">Posting / Jurisdiction</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Administrative Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAccounts.map((acc) => (
                    <tr key={acc.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{acc.fullName}</div>
                        <div className="text-[10px] text-slate-400">
                          📞 {acc.mobileNumber} • {acc.email || "No email"}
                        </div>
                      </td>
                      <td className="p-3 font-mono">
                        <div className="font-bold text-[#1e3a8a]">{acc.pno}</div>
                        <div className="text-[10px] text-slate-400">Belt: {acc.beltNumber || acc.pno}</div>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-blue-50 text-[#1e3a8a] border border-blue-200 font-bold text-[10px]">
                          {acc.role}
                        </span>
                        <div className="text-[10px] text-slate-500 mt-0.5">{acc.designation}</div>
                      </td>
                      <td className="p-3 text-slate-700">
                        <div className="font-medium">{acc.assignedUnitName}</div>
                        <span className="text-[9px] uppercase px-1 rounded bg-slate-100 text-slate-500 font-mono">
                          {acc.assignedUnitType}
                        </span>
                      </td>
                      <td className="p-3 text-slate-700">
                        <div className="font-semibold text-slate-800 flex items-center gap-1.5 flex-wrap">
                          <span>{acc.policeStation}</span>
                          {acc.zone && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] bg-blue-50 text-blue-700 border border-blue-200 font-semibold font-mono">
                              {acc.zone}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {acc.district} {acc.zone ? `• Zone: ${acc.zone}` : ""} • {acc.jurisdictionType}
                        </div>
                      </td>
                      <td className="p-3">
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-semibold border",
                            acc.status === "ACTIVE"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-slate-100 text-slate-600 border-slate-200"
                          )}
                        >
                          {acc.status}
                        </span>
                      </td>
                      <td className="p-3 text-right space-x-1 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleLoginAsOfficer(acc)}
                          className="px-2 py-1 bg-slate-900 text-white rounded text-[10px] font-bold hover:bg-slate-800 transition-colors shadow-2xs"
                          title="View system as this officer"
                        >
                          View As
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditAccountModal(acc)}
                          className="px-2 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded text-[10px] font-bold hover:bg-blue-100 transition-colors"
                          title="Edit details or shift posting/district"
                        >
                          Edit / Shift
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedAccount(acc);
                            setShowResetPinModal(true);
                          }}
                          className="px-2 py-1 border border-slate-200 text-slate-700 rounded text-[10px] font-semibold hover:bg-slate-100 transition-colors"
                          title="Reset Login PIN"
                        >
                          Reset PIN
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleAccountStatus(acc)}
                          className="px-2 py-1 border border-slate-200 text-slate-600 rounded text-[10px] font-semibold hover:bg-slate-100 transition-colors"
                        >
                          {acc.status === "ACTIVE" ? "Deactivate" : "Activate"}
                        </button>
                        {isDeveloper && acc.pno !== "DEV-ADMIN" && acc.id !== "cms_developer_admin" && (
                          <button
                            type="button"
                            onClick={() => {
                              setAccountToDelete(acc);
                              setShowDeleteModal(true);
                            }}
                            className="px-2 py-1 bg-red-50 text-red-700 border border-red-200 rounded text-[10px] font-bold hover:bg-red-100 transition-colors inline-flex items-center gap-0.5 cursor-pointer"
                            title="Delete officer account"
                          >
                            <Trash2 className="w-3 h-3" />
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredAccounts.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-xs text-slate-400">
                        No officer accounts found matching your filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MULTI-SECTION ACCOUNT GENERATION FORM */}
      {activeTab === "new" && (
        <form onSubmit={handleCreateAccountSubmit} className="space-y-6 max-w-4xl">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-6">
            {/* Section 1: Personal Information */}
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-2">
                <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">Section 1</span>
                <h3 className="text-sm font-bold text-slate-900">Personal & Identification Details</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Full Officer Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Inspector Surender Singh"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">PNO / Employee ID *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. HR-08192033"
                    value={formData.pno}
                    onChange={(e) => setFormData({ ...formData, pno: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono uppercase focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Belt Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 412/PNP"
                    value={formData.beltNumber}
                    onChange={(e) => setFormData({ ...formData, beltNumber: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9812044321"
                    value={formData.mobileNumber}
                    onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Govt Official Email</label>
                  <input
                    type="email"
                    placeholder="e.g. officer@hry.police.gov.in"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Official Designation</label>
                  <input
                    type="text"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Login Credentials & Temporary PIN Generation */}
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">Section 2</span>
                  <h3 className="text-sm font-bold text-slate-900">Login Authentication Credentials</h3>
                </div>
                <button
                  type="button"
                  onClick={handleGeneratePin}
                  className="px-2.5 py-1 rounded bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold hover:bg-amber-100 cursor-pointer"
                >
                  ⚡ Generate Random 6-Digit PIN
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Login PIN / Password *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 123456"
                    value={formData.pin}
                    onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-center tracking-widest font-bold focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Confirm PIN *</label>
                  <input
                    type="text"
                    required
                    placeholder="Re-enter PIN"
                    value={formData.confirmPin}
                    onChange={(e) => setFormData({ ...formData, confirmPin: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-center tracking-widest font-bold focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Role & Dynamic Role Regulations */}
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">Section 3</span>
                  <h3 className="text-sm font-bold text-slate-900">Role Selection & Assigned Unit</h3>
                </div>
                <span className="text-[11px] text-slate-500 font-medium italic">
                  All role, rank and unit dropdowns default to unselected.
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">System Role *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => handleRoleChange(e.target.value as AccountRole)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold text-blue-900 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">-- Select System Role --</option>

                    <optgroup label="Police Commissionerate System (Gurugram, Faridabad, Panchkula, Sonipat, Jhajjar)">
                      <option value="CP">CP (Commissioner of Police)</option>
                      <option value="JOINT_CP">Joint / Additional CP</option>
                      <option value="DCP">DCP (Deputy Commissioner of Police)</option>
                      <option value="ADDL_DCP">Additional DCP</option>
                      <option value="ACP">ACP (Assistant Commissioner of Police)</option>
                      <option value="COMMISSIONERATE_SHO">SHO (Commissionerate Police Station)</option>
                      <option value="COMMISSIONERATE_SI">Sub-Inspector (SI - Commissionerate)</option>
                      <option value="COMMISSIONERATE_ASI">Assistant Sub-Inspector (ASI - Commissionerate)</option>
                      <option value="COMMISSIONERATE_MHC">MHC (Moharrir Head Constable - Commissionerate)</option>
                      <option value="COMMISSIONERATE_HC">Head Constable (HC - Commissionerate)</option>
                      <option value="COMMISSIONERATE_CONSTABLE">Constable (Commissionerate Beat / Patrol)</option>
                      <option value="COMMISSIONERATE_STAFF">Station Staff (Commissionerate)</option>
                      <option value="COMMISSIONERATE_AUDITOR">Viewer / Auditor (Commissionerate)</option>
                    </optgroup>

                    <optgroup label="Armed Police (Haryana Armed Police - HAP & IRB Battalions)">
                      <option value="COMMANDANT_ARMED">Commandant (HAP / IRB Battalion)</option>
                      <option value="ADDL_COMMANDANT">Additional Commandant (Armed Police)</option>
                      <option value="ASST_COMMANDANT">Assistant Commandant (DSP Armed)</option>
                      <option value="ARMED_INSPECTOR">Company Commander (Inspector Armed / CDI)</option>
                      <option value="ARMED_SI">Platoon Commander (Sub-Inspector Armed)</option>
                      <option value="ARMED_ASI">Section Commander (ASI Armed)</option>
                      <option value="ARMED_HC">Head Constable (CHM / Section 2IC)</option>
                      <option value="ARMED_CONSTABLE">Armed Constable (HAP / IRB Guard & Escort)</option>
                    </optgroup>

                    <optgroup label="Training Academies & Colleges (HPA Madhuban, PTC Sunaria, RTC Bhondsi)">
                      <option value="TRAINING_DIRECTOR">Director / DIG (Police Academy / HPA)</option>
                      <option value="TRAINING_PRINCIPAL">Principal / SP (PTC / RTC College)</option>
                      <option value="TRAINING_INSTRUCTOR">Training Instructor (Inspector / SI)</option>
                      <option value="TRAINING_MHC">MHC (Moharrir Head Constable - Academy / Training)</option>
                      <option value="TRAINING_HC">Drill Instructor (DI) / Head Constable</option>
                      <option value="TRAINING_CONSTABLE">Recruit / Trainee Constable</option>
                    </optgroup>

                    <optgroup label="Specialized Units (CID, STF, Cyber Cell, State Crime)">
                      <option value="SPECIAL_UNIT_SP">SP (CID / STF / State Cyber / State Crime)</option>
                      <option value="SPECIAL_UNIT_DSP">DSP (Special Operations / Cyber Crime)</option>
                      <option value="SPECIAL_UNIT_INSPECTOR">Inspector (Specialized Investigation / Cyber Cell)</option>
                      <option value="SPECIAL_UNIT_SI">Sub-Inspector (Special Intelligence / Technical IO)</option>
                      <option value="SPECIAL_UNIT_ASI">Assistant Sub-Inspector (ASI)</option>
                      <option value="SPECIAL_UNIT_IO">Investigating Officer (IO)</option>
                      <option value="SPECIAL_UNIT_MHC">MHC (Moharrir Head Constable)</option>
                      <option value="SPECIAL_UNIT_DUTY_OFFICER">Duty Officer (Counter Intake)</option>
                      <option value="SPECIAL_UNIT_HC">Head Constable</option>
                      <option value="SPECIAL_UNIT_CONSTABLE">Constable</option>
                      <option value="SPECIAL_UNIT_STAFF">Station Staff</option>
                      <option value="SPECIAL_UNIT_AUDITOR">Viewer / Auditor</option>
                    </optgroup>

                    <optgroup label="District Executive Police">
                      <option value="SP_DISTRICT">SP (Superintendent of Police)</option>
                      <option value="ASP">ASP (Additional SP)</option>
                      <option value="DSP_SUBDIV">DSP (Deputy SP - Sub-Division)</option>
                      <option value="SHO">SHO (Station House Officer)</option>
                      <option value="INSPECTOR">Inspector of Police</option>
                      <option value="SI">Sub-Inspector (SI)</option>
                      <option value="ASI">Assistant Sub-Inspector (ASI)</option>
                      <option value="ENQUIRY_OFFICER">Investigating Officer (IO)</option>
                      <option value="MHC_GD_INCHARGE">MHC (Moharrir Head Constable)</option>
                      <option value="DUTY_OFFICER">Duty Officer (Counter Intake)</option>
                      <option value="HEAD_CONSTABLE">Head Constable</option>
                      <option value="CONSTABLE">Constable</option>
                      <option value="STATION_STAFF">Station Staff</option>
                      <option value="VIEWER_AUDITOR">Viewer / Auditor</option>
                    </optgroup>

                    <optgroup label="State Command & Police Ranges">
                      <option value="DGP">DGP (Director General of Police)</option>
                      <option value="ADGP">ADGP (Additional DGP)</option>
                      <option value="IG">IG (Inspector General of Police)</option>
                      <option value="DIG">DIG (Deputy Inspector General)</option>
                    </optgroup>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Police Rank *</label>
                  <select
                    value={formData.rank}
                    onChange={(e) => {
                      const selected = POLICE_RANKS_OPTIONS.find((r) => r.rank === e.target.value);
                      setFormData((prev) => ({
                        ...prev,
                        rank: e.target.value,
                        rankDisplay: selected ? selected.display : e.target.value,
                        designation: prev.designation || (selected ? selected.display : e.target.value),
                      }));
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold text-blue-900 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">-- Select Police Rank --</option>
                    {POLICE_RANKS_OPTIONS.map((opt) => (
                      <option key={opt.rank} value={opt.rank}>
                        {opt.display}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Assigned Unit Type *</label>
                  <select
                    value={formData.assignedUnitType}
                    onChange={(e) => {
                      const uType = e.target.value as AssignedUnitType;
                      setFormData((prev) => ({
                        ...prev,
                        assignedUnitType: uType,
                        policeStation: "",
                        assignedUnitName: "",
                        assignedUnitId: "",
                        authorizedPoliceStations: [],
                      }));
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold text-blue-900 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">-- Select Assigned Unit Type --</option>
                    {ASSIGNED_UNIT_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Section 4: Jurisdiction & Location Cascading */}
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">Section 4</span>
                  <h3 className="text-sm font-bold text-slate-900">Jurisdiction & Posting Location</h3>
                </div>
                <span className="text-[11px] text-slate-500 font-medium italic">
                  Fully dynamic from Location Master
                </span>
              </div>
              <div className={cn(
                "grid gap-3 text-xs",
                isCommissionerate ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-4" : "grid-cols-1 sm:grid-cols-3"
              )}>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Range / Commissionerate / Wing</label>
                  <select
                    value={formData.range}
                    onChange={(e) => handleRangeChange(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">-- Select Range / Commissionerate / Wing --</option>
                    <optgroup label="Police Ranges">
                      {locationRanges
                        .filter((r) => !r.name.toLowerCase().includes("commissionerate"))
                        .map((r) => (
                          <option key={r.id} value={r.name}>
                            {r.name}
                          </option>
                        ))}
                    </optgroup>
                    <optgroup label="Police Commissionerates">
                      {COMMISSIONERATES_LIST.map((c) => (
                        <option key={c.name} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="State Level / Specialized Wings">
                      <option value="State Headquarters (PHQ)">State Headquarters (PHQ Panchkula)</option>
                      <option value="GRP Haryana">GRP Haryana (Railway Police)</option>
                      <option value="Armed Police (HAP & IRB)">Armed Police (HAP & IRB)</option>
                      <option value="Forensic Science Laboratories">Forensic Science Laboratories (FSL/RFSL)</option>
                      <option value="Training Academies & Colleges">Training Academies & Colleges</option>
                      <option value="Specialized State Units">Specialized State Directorates (CID/STF/ERSS)</option>
                      <option value="Deputation Units">Deputation Units (Central & State)</option>
                    </optgroup>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">District *</label>
                  <select
                    disabled={!formData.range}
                    value={formData.district}
                    onChange={(e) => handleDistrictChange(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold focus:ring-1 focus:ring-blue-500 disabled:opacity-60 disabled:bg-slate-100 disabled:cursor-not-allowed"
                  >
                    {!formData.range ? (
                      <option value="">-- Select Range / Wing First --</option>
                    ) : (
                      <>
                        <option value="">-- Select District ({filteredDistricts.length}) --</option>
                        {filteredDistricts.map((d) => (
                          <option key={d.id} value={d.name}>
                            {d.name}
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                </div>

                {/* Commissionerate Zone Selection - Active when Commissionerate is selected */}
                {isCommissionerate && (
                  <div className="p-2 bg-blue-50/80 border border-blue-200 rounded-xl space-y-1">
                    <label className="font-bold text-blue-900 block flex items-center justify-between">
                      <span>Commissionerate Zone *</span>
                      <span className="text-[10px] text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded font-mono">DCP Zone</span>
                    </label>
                    <select
                      value={formData.zone || ""}
                      onChange={(e) => handleZoneChange(e.target.value)}
                      className="w-full bg-white border border-blue-300 rounded-lg p-2 font-bold text-blue-950 focus:ring-1 focus:ring-blue-500 shadow-2xs"
                    >
                      <option value="">-- Select Zone ({activeCommissionerateZones.length}) --</option>
                      {activeCommissionerateZones.map((z) => (
                        <option key={z.id} value={z.name}>
                          {z.name} ({z.dcpTitle})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Police Station / Posting Unit *
                    {formData.assignedUnitType && (
                      <span className="ml-1 text-[10px] font-normal text-blue-700">
                        ({ASSIGNED_UNIT_TYPE_OPTIONS.find((o) => o.value === formData.assignedUnitType)?.label})
                      </span>
                    )}
                  </label>
                  <select
                    disabled={!formData.district || !formData.assignedUnitType}
                    value={formData.policeStation}
                    onChange={(e) => handlePostingLocationChange(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold focus:ring-1 focus:ring-blue-500 disabled:opacity-60 disabled:bg-slate-100 disabled:cursor-not-allowed"
                  >
                    {!formData.district ? (
                      <option value="">-- Select District First --</option>
                    ) : !formData.assignedUnitType ? (
                      <option value="">-- Select Assigned Unit Type in Section 3 First --</option>
                    ) : formData.assignedUnitType === "POLICE_STATION" ? (
                      <>
                        <option value="">-- Select Police Station ({filteredStations.length}) --</option>
                        {filteredStations.map((ps) => (
                          <option key={ps.id} value={ps.name}>
                            {ps.name} ({ps.stationType})
                          </option>
                        ))}
                        {filteredStations.length === 0 && (
                          <option value={`${formData.district} Police Station`}>
                            {formData.district} Police Station
                          </option>
                        )}
                      </>
                    ) : formData.assignedUnitType === "DISTRICT_OFFICE" ? (
                      <>
                        <option value="">-- Select Administrative Office ({filteredOffices.length}) --</option>
                        {filteredOffices.map((off) => (
                          <option key={off.id} value={off.name}>
                            {off.name} ({off.officeType})
                          </option>
                        ))}
                        {filteredOffices.length === 0 && (
                          <option value={`District Police Office (SP Office) ${formData.district}`}>
                            District Police Office (SP Office) {formData.district}
                          </option>
                        )}
                      </>
                    ) : formData.assignedUnitType === "SPECIALIZED_UNIT" || formData.assignedUnitType === "INVESTIGATION_UNIT" ? (
                      <>
                        <option value="">-- Select Specialized Unit ({filteredUnits.length}) --</option>
                        {filteredUnits.map((unt) => (
                          <option key={unt.id} value={unt.name}>
                            {unt.name} ({unt.unitType})
                          </option>
                        ))}
                        {filteredUnits.length === 0 && (
                          <option value={`Special Investigation Unit (CIA) ${formData.district}`}>
                            Special Investigation Unit (CIA) {formData.district}
                          </option>
                        )}
                      </>
                    ) : formData.assignedUnitType === "MHC_STORE" ? (
                      <>
                        <option value="">-- Select Malkhana Store --</option>
                        {filteredUnits
                          .filter((u) => u.unitType === "MHC_STORE" || u.name.toLowerCase().includes("malkhana") || u.name.toLowerCase().includes("mhc"))
                          .map((unt) => (
                            <option key={unt.id} value={unt.name}>
                              {unt.name}
                            </option>
                          ))}
                        <option value={`Central District Malkhana (MHC Store) ${formData.district}`}>
                          Central District Malkhana (MHC Store) {formData.district}
                        </option>
                        {filteredStations.map((ps) => (
                          <option key={ps.id} value={`MHC Store - ${ps.name}`}>
                            MHC Store - {ps.name}
                          </option>
                        ))}
                      </>
                    ) : formData.assignedUnitType === "RANGE_OFFICE" ? (
                      <>
                        <option value="">-- Select Range Office --</option>
                        {locationOffices
                          .filter((off) => off.officeType === "IG_OFFICE" || off.officeType === "DIG_OFFICE" || off.rangeName === formData.range)
                          .map((off) => (
                            <option key={off.id} value={off.name}>
                              {off.name}
                            </option>
                          ))}
                        <option value={`Office of Inspector General of Police, ${formData.range || "Range"}`}>
                          Office of Inspector General of Police, {formData.range || "Range"}
                        </option>
                      </>
                    ) : formData.assignedUnitType === "COMMISSIONERATE_HQ" ? (
                      <>
                        <option value="">-- Select Commissionerate Headquarters / Zone --</option>
                        {locationOffices
                          .filter((off) => off.districtName === formData.district || off.officeType === "COMMISSIONERATE_HQ")
                          .map((off) => (
                            <option key={off.id} value={off.name}>
                              {off.name}
                            </option>
                          ))}
                        <option value={`Office of Commissioner of Police, ${formData.district}`}>
                          Office of Commissioner of Police, {formData.district}
                        </option>
                        <option value={`DCP Headquarters, ${formData.district}`}>
                          DCP Headquarters, {formData.district}
                        </option>
                        <option value={`DCP Crime Branch, ${formData.district}`}>
                          DCP Crime Branch, {formData.district}
                        </option>
                        <option value={`DCP Traffic, ${formData.district}`}>
                          DCP Traffic, {formData.district}
                        </option>
                      </>
                    ) : formData.assignedUnitType === "ARMED_BATTALION" ? (
                      <>
                        <option value="">-- Select Armed Police Battalion --</option>
                        {ARMED_BATTALIONS.map((bn) => (
                          <option key={bn.id} value={bn.name}>
                            {bn.name}
                          </option>
                        ))}
                      </>
                    ) : formData.assignedUnitType === "GRP_STATION" ? (
                      <>
                        <option value="">-- Select GRP Railway Police Station --</option>
                        {GRP_STATIONS_LIST.map((grp) => (
                          <option key={grp.id} value={grp.name}>
                            {grp.name}
                          </option>
                        ))}
                      </>
                    ) : formData.assignedUnitType === "TRAINING_CENTRE" ? (
                      <>
                        <option value="">-- Select Training Academy / College --</option>
                        {TRAINING_CENTRES.map((trg) => (
                          <option key={trg.id} value={trg.name}>
                            {trg.name}
                          </option>
                        ))}
                      </>
                    ) : formData.assignedUnitType === "FORENSIC_LAB" ? (
                      <>
                        <option value="">-- Select Forensic Science Laboratory --</option>
                        {FORENSIC_LABS.map((fsl) => (
                          <option key={fsl.id} value={fsl.name}>
                            {fsl.name}
                          </option>
                        ))}
                      </>
                    ) : formData.assignedUnitType === "DEPUTATION_UNIT" ? (
                      <>
                        <option value="">-- Select Deputation Unit --</option>
                        {DEPUTATION_UNITS.map((dep) => (
                          <option key={dep.id} value={dep.name}>
                            {dep.name}
                          </option>
                        ))}
                      </>
                    ) : formData.assignedUnitType === "PHQ" ? (
                      <>
                        <option value="">-- Select PHQ Directorate --</option>
                        {PHQ_DIRECTORATES.map((phq) => (
                          <option key={phq.id} value={phq.name}>
                            {phq.name}
                          </option>
                        ))}
                      </>
                    ) : (
                      <>
                        <option value="">-- Select Unit / Office --</option>
                        {filteredOffices.map((off) => (
                          <option key={off.id} value={off.name}>
                            {off.name}
                          </option>
                        ))}
                        {filteredUnits.map((unt) => (
                          <option key={unt.id} value={unt.name}>
                            {unt.name}
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                </div>
              </div>

              {/* Jurisdiction Scope Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Jurisdiction Scope Policy *</label>
                  <select
                    value={formData.jurisdictionType}
                    onChange={(e) => setFormData({ ...formData, jurisdictionType: e.target.value as JurisdictionType })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">-- Select Jurisdiction Scope --</option>
                    {JURISDICTION_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Official Designation Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Station House Officer, Panipat"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Multi-Station Allocation Checkboxes (if DSP / Sub-Division / Special selected) */}
              {(formData.jurisdictionType === "SUBDIVISION_MULTI_STATION" ||
                formData.jurisdictionType === "SPECIAL_MULTI_STATION") && (
                <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-lg space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-purple-950 uppercase text-[10px] tracking-wider">
                      Multi-Station Jurisdiction Allocation ({formData.authorizedPoliceStations.length} selected)
                    </span>
                    <span className="text-[10px] text-purple-700 font-medium">Select all police stations under this officer's command</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-44 overflow-y-auto p-1 bg-white rounded border border-purple-100">
                    {locationStations
                      .filter((s) => !formData.district || formData.district === "State Level / All Districts" || s.districtName === formData.district)
                      .map((s) => {
                        const isChecked = formData.authorizedPoliceStations.includes(s.name);
                        return (
                          <label
                            key={s.id}
                            className={`flex items-center gap-1.5 p-1.5 rounded border text-[11px] cursor-pointer transition-colors ${
                              isChecked
                                ? "bg-purple-100 border-purple-300 font-bold text-purple-950"
                                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                setFormData((prev) => {
                                  const current = prev.authorizedPoliceStations || [];
                                  const next = current.includes(s.name)
                                    ? current.filter((x) => x !== s.name)
                                    : [...current, s.name];
                                  return { ...prev, authorizedPoliceStations: next };
                                });
                              }}
                              className="rounded text-purple-600 focus:ring-purple-500"
                            />
                            <span className="truncate">{s.name}</span>
                          </label>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Jurisdiction Regulation Info Box */}
              <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-lg text-xs space-y-1">
                <span className="font-bold text-[#1e3a8a] uppercase text-[10px]">Active Jurisdiction Policy:</span>
                <p className="text-slate-700 font-medium">
                  {!formData.role && "Please select a System Role to view active jurisdiction policy and regulatory scope."}
                  {formData.role === "DGP" && "State-wide jurisdiction across all Haryana police districts and units."}
                  {formData.role === "SP_DISTRICT" && `Full administrative and operational jurisdiction over entire ${formData.district || "assigned"} District.`}
                  {formData.role === "DSP_SUBDIV" && `Sub-Divisional jurisdiction across multiple selected police stations in ${formData.district || "District"}.`}
                  {formData.role === "SHO" && `Single station command: Authorized for registration, FIR approval and investigation review at ${formData.policeStation || "selected police station"}.`}
                  {formData.role === "MHC_GD_INCHARGE" && `Dedicated MHC Malkhana & General Diary control for ${formData.policeStation || "selected station"}.`}
                  {formData.role === "ENQUIRY_OFFICER" && `Investigating officer assigned to cases in ${formData.policeStation || "selected unit/station"}${formData.district ? `, ${formData.district}` : ""}.`}
                  {formData.role === "DUTY_OFFICER" && `Intake counter & citizen complaint registration authority at ${formData.policeStation || "selected station"}.`}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setTab("directory")}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingAccount}
                className="px-5 py-2 bg-[#1e3a8a] text-white rounded-xl text-xs font-bold hover:bg-[#152865] shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {submittingAccount ? "Provisioning..." : "Generate & Authorize Account"}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* TAB 3: SPECIAL STATION ALLOCATIONS */}
      {activeTab === "special-allocations" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-4">
          <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BadgeCheck className="w-4 h-4 text-purple-700" />
                Special Station Allocation & Temporary Jurisdiction
              </h2>
              <p className="text-[11px] text-slate-500">
                Grant additional station visibility to selected officers for election bandobast, emergency law & order, or joint SIT.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowSpecialAllocModal(true)}
              className="px-3.5 py-1.5 bg-purple-700 text-white rounded-xl text-xs font-bold hover:bg-purple-800 flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Special Allocation</span>
            </button>
          </div>
          <div className="divide-y divide-slate-100 text-xs">
            {accounts
              .filter((a) => a.specialAllocations && a.specialAllocations.length > 0)
              .map((a) => (
                <div key={a.id} className="py-3 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900">{a.fullName}</span>
                    <span className="text-[10px] text-slate-400 ml-2 font-mono">({a.pno})</span>
                    <div className="text-[11px] text-slate-600 mt-0.5">
                      Base Posting: {a.policeStation}, {a.district}
                    </div>
                  </div>
                  <div className="text-right">
                    {a.specialAllocations?.map((alloc) => (
                      <div key={alloc.id} className="text-[10px]">
                        <span className="font-bold text-purple-800 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                          + {alloc.policeStationNames.join(", ")}
                        </span>
                        <div className="text-slate-400 mt-0.5">{alloc.assignmentReason}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            {accounts.filter((a) => a.specialAllocations && a.specialAllocations.length > 0).length === 0 && (
              <div className="py-8 text-center text-slate-400">
                No active special station allocations currently configured.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: ROLE JURISDICTION POLICIES */}
      {activeTab === "policies" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-4">
          <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#1e3a8a]" />
                Police Role Regulations & Statutory Jurisdiction Policies
              </h2>
              <p className="text-[11px] text-slate-500">
                Statutory role matrix covering Police Commissionerates, Armed Police (HAP & IRB), Training Academies, Specialized Wings, District Executive and State Headquarters.
              </p>
            </div>
            <div className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg shrink-0">
              Coverage: Commissionerates • HAP/IRB • Training • Districts
            </div>
          </div>

          {/* Wing Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {[
              { id: "ALL", label: "All Formations (38 Roles)" },
              { id: "COMMISSIONERATE", label: "Commissionerate System (CP, DCP, ACP...)" },
              { id: "ARMED_POLICE", label: "Armed Police (HAP & IRB Battalions)" },
              { id: "TRAINING", label: "Training Academies & Colleges (HPA/PTC/RTC)" },
              { id: "SPECIALIZED", label: "Specialized Units (CID / STF / Cyber)" },
              { id: "DISTRICT", label: "District Executive Police (SP, DSP, SHO...)" },
              { id: "STATE_HQ", label: "State Police HQ & Ranges (DGP, IG/DIG)" },
            ].map((wf) => (
              <button
                key={wf.id}
                type="button"
                onClick={() => setPolicyWingFilter(wf.id)}
                className={cn(
                  "px-3 py-1.5 rounded-lg font-bold text-xs whitespace-nowrap transition-all cursor-pointer",
                  policyWingFilter === wf.id
                    ? "bg-[#1e3a8a] text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                {wf.label}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase">
                <tr>
                  <th className="p-3">Formation / Wing</th>
                  <th className="p-3">Rank / Role</th>
                  <th className="p-3">Police Rank</th>
                  <th className="p-3">Jurisdiction Policy</th>
                  <th className="p-3">Authorized Scope</th>
                  <th className="p-3">Permitted Actions & Statutory Powers</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  // 1. COMMISSIONERATE SYSTEM
                  {
                    category: "COMMISSIONERATE",
                    wing: "Commissionerate",
                    wingBadge: "bg-blue-100 text-blue-900 border-blue-200",
                    role: "CP (Commissioner of Police)",
                    rank: "ADGP / IG",
                    policy: "Commissionerate-Wide",
                    scope: "Entire Metropolitan Commissionerate Area (Gurugram, Faridabad, Panchkula, Sonipat, Jhajjar)",
                    actions: "Apex Metropolitan Command, Magisterial & Licensing Powers, Zonal Reassignments, Final Challan Approvals",
                  },
                  {
                    category: "COMMISSIONERATE",
                    wing: "Commissionerate",
                    wingBadge: "bg-blue-100 text-blue-900 border-blue-200",
                    role: "Joint CP / Additional CP",
                    rank: "IG / DIG",
                    policy: "Commissionerate-Wide",
                    scope: "Designated Commissionerate Wing (HQ / Crime / Traffic / Law & Order)",
                    actions: "Operational Coordination, Inter-Zonal Force Mobilization, Heinous Crime Review, High-Level Inquiries",
                  },
                  {
                    category: "COMMISSIONERATE",
                    wing: "Commissionerate",
                    wingBadge: "bg-blue-100 text-blue-900 border-blue-200",
                    role: "DCP (Deputy Commissioner of Police)",
                    rank: "Superintendent of Police (SP)",
                    policy: "Zone-Wide",
                    scope: "Assigned Urban Zone (East / West / South / Crime / Traffic / HQ)",
                    actions: "Zonal Command, Final Challan Scrutiny, Serious Crime Supervision, Police Force Management",
                  },
                  {
                    category: "COMMISSIONERATE",
                    wing: "Commissionerate",
                    wingBadge: "bg-blue-100 text-blue-900 border-blue-200",
                    role: "Additional DCP / ASP",
                    rank: "Additional SP (ASP)",
                    policy: "Zone-Wide",
                    scope: "Assigned Commissionerate Zone & Specialized Units",
                    actions: "Assistance to DCP, Zonal Administrative Supervision, Enquiry Monitoring, Crime Prevention Audits",
                  },
                  {
                    category: "COMMISSIONERATE",
                    wing: "Commissionerate",
                    wingBadge: "bg-blue-100 text-blue-900 border-blue-200",
                    role: "ACP (Assistant Commissioner of Police)",
                    rank: "Deputy SP (DSP)",
                    policy: "Division Multi-Station",
                    scope: "Assigned Commissionerate Division (Sub-Divisions / Traffic / Cyber)",
                    actions: "Sub-Divisional Scrutiny, Field Supervision, Investigation Case Diaries Review & Guidance",
                  },
                  {
                    category: "COMMISSIONERATE",
                    wing: "Commissionerate",
                    wingBadge: "bg-blue-100 text-blue-900 border-blue-200",
                    role: "Inspector (Commissionerate SHO)",
                    rank: "Inspector",
                    policy: "Single Station",
                    scope: "Assigned Metropolitan Police Station / Cyber / Traffic",
                    actions: "FIR Registration Approval, General Diary Management, Station Command, Law & Order Maintenance",
                  },
                  {
                    category: "COMMISSIONERATE",
                    wing: "Commissionerate",
                    wingBadge: "bg-blue-100 text-blue-900 border-blue-200",
                    role: "Sub-Inspector (SI - Commissionerate)",
                    rank: "Sub-Inspector (SI)",
                    policy: "Investigation Scope",
                    scope: "Metropolitan Police Station / Police Post (Chowki)",
                    actions: "Investigating Officer (IO), Chowki Incharge, Section 192 Case Diary, Search & Arrest",
                  },
                  {
                    category: "COMMISSIONERATE",
                    wing: "Commissionerate",
                    wingBadge: "bg-blue-100 text-blue-900 border-blue-200",
                    role: "Assistant Sub-Inspector (ASI)",
                    rank: "Assistant Sub-Inspector (ASI)",
                    policy: "Station / Beat Scope",
                    scope: "Police Station Counter / PCR / Traffic Point",
                    actions: "Citizen Complaint Intake, Daily Diary (GD) Entry, NC Reports, Minor Offence Investigation",
                  },
                  {
                    category: "COMMISSIONERATE",
                    wing: "Commissionerate",
                    wingBadge: "bg-blue-100 text-blue-900 border-blue-200",
                    role: "Head Constable (HC - Commissionerate)",
                    rank: "Head Constable (HC)",
                    policy: "Station / Beat Scope",
                    scope: "Malkhana, Station Record, Investigation Team",
                    actions: "Malkhana Custody, Case File Maintenance, Field Enquiry Assistance, Beat Supervision",
                  },
                  {
                    category: "COMMISSIONERATE",
                    wing: "Commissionerate",
                    wingBadge: "bg-blue-100 text-blue-900 border-blue-200",
                    role: "Constable (Commissionerate)",
                    rank: "Constable",
                    policy: "Beat / Patrol Scope",
                    scope: "Metropolitan Beat, Mobile PCR, Picket, Surveillance",
                    actions: "Law & Order Patrol, Sentry Duty, Beat Vigilance, Emergency PCR Response",
                  },

                  // 2. ARMED POLICE (HAP & IRB BATTALIONS)
                  {
                    category: "ARMED_POLICE",
                    wing: "Armed Police",
                    wingBadge: "bg-emerald-100 text-emerald-900 border-emerald-200",
                    role: "ADGP / IG Armed Police",
                    rank: "ADGP / IG",
                    policy: "Formation-Wide",
                    scope: "All Battalions (1st-5th HAP, Durga Battalion, 1st-4th IRB)",
                    actions: "Armed Police Apex Command, Strategic Riot Control Mobilization, Weaponry & Ordnance Governance",
                  },
                  {
                    category: "ARMED_POLICE",
                    wing: "Armed Police",
                    wingBadge: "bg-emerald-100 text-emerald-900 border-emerald-200",
                    role: "DIG Armed Police / DIG IRB",
                    rank: "DIG",
                    policy: "Wing-Wide",
                    scope: "HAP Headquarters Madhuban / IRB Headquarters Bhondsi",
                    actions: "Inspection of Battalions, Armed Training Standards, Operational Deployment Protocols",
                  },
                  {
                    category: "ARMED_POLICE",
                    wing: "Armed Police",
                    wingBadge: "bg-emerald-100 text-emerald-900 border-emerald-200",
                    role: "Commandant (HAP / IRB Battalion)",
                    rank: "Superintendent of Police (SP)",
                    policy: "Battalion-Wide",
                    scope: "Assigned Battalion (1st-5th Bn HAP, 1st-4th Bn IRB)",
                    actions: "Full Battalion Command, Armed Reserves Deployment, Arms & Ammunition Custody, Personnel Administration",
                  },
                  {
                    category: "ARMED_POLICE",
                    wing: "Armed Police",
                    wingBadge: "bg-emerald-100 text-emerald-900 border-emerald-200",
                    role: "Additional Commandant",
                    rank: "Additional SP (ASP)",
                    policy: "Battalion-Wide",
                    scope: "Battalion Headquarters & Training Ground",
                    actions: "2IC of Battalion, Quartermaster & Armory Supervision, Welfare & Logistics Oversight",
                  },
                  {
                    category: "ARMED_POLICE",
                    wing: "Armed Police",
                    wingBadge: "bg-emerald-100 text-emerald-900 border-emerald-200",
                    role: "Assistant Commandant (DSP)",
                    rank: "Deputy SP (DSP)",
                    policy: "Company-Wide",
                    scope: "Armed Police Companies (Co. A to F) / Task Forces",
                    actions: "Company Command in Field, Tactical Riot Control, Border / Election / Strike Duties",
                  },
                  {
                    category: "ARMED_POLICE",
                    wing: "Armed Police",
                    wingBadge: "bg-emerald-100 text-emerald-900 border-emerald-200",
                    role: "Company Commander (Inspector Armed / CDI)",
                    rank: "Inspector",
                    policy: "Company / Line Scope",
                    scope: "Armed Company / Battalion Quartermaster / Line DDO",
                    actions: "Armed Company Supervision, Roll Call, Quarter Guard, Arms Distribution, Parade Discipline",
                  },
                  {
                    category: "ARMED_POLICE",
                    wing: "Armed Police",
                    wingBadge: "bg-emerald-100 text-emerald-900 border-emerald-200",
                    role: "Platoon Commander (Sub-Inspector Armed)",
                    rank: "Sub-Inspector (SI)",
                    policy: "Platoon Scope",
                    scope: "Armed Police Platoon (3 Sections)",
                    actions: "Platoon Commander, Guard of Honour, Special Security & Static Guard Incharge",
                  },
                  {
                    category: "ARMED_POLICE",
                    wing: "Armed Police",
                    wingBadge: "bg-emerald-100 text-emerald-900 border-emerald-200",
                    role: "Section Commander (ASI Armed)",
                    rank: "Assistant Sub-Inspector (ASI)",
                    policy: "Section Scope",
                    scope: "Armed Section (10-12 Armed Personnel)",
                    actions: "Section Commander, Armory Maintenance, Field Escort Supervision",
                  },
                  {
                    category: "ARMED_POLICE",
                    wing: "Armed Police",
                    wingBadge: "bg-emerald-100 text-emerald-900 border-emerald-200",
                    role: "Head Constable (CHM / Section 2IC)",
                    rank: "Head Constable (HC)",
                    policy: "Section / Squad Scope",
                    scope: "Company Havildar Major (CHM) / Squad",
                    actions: "CHM Daily Roll, Section 2IC, Weapon Drill Supervision, Armed Sentry Duties",
                  },
                  {
                    category: "ARMED_POLICE",
                    wing: "Armed Police",
                    wingBadge: "bg-emerald-100 text-emerald-900 border-emerald-200",
                    role: "Armed Constable (HAP / IRB)",
                    rank: "Constable",
                    policy: "Squad / Post Scope",
                    scope: "Battalion Squad, VVIP Escort, Riot Control Reserve",
                    actions: "Armed Guard Duty, Anti-Riot Operations, Tactical Perimeter Security, Convoy Escort",
                  },

                  // 3. TRAINING ACADEMIES & COLLEGES
                  {
                    category: "TRAINING",
                    wing: "Training Academies",
                    wingBadge: "bg-amber-100 text-amber-900 border-amber-200",
                    role: "Director HPA (ADGP / IG Rank)",
                    rank: "ADGP / IG",
                    policy: "Academy-Wide",
                    scope: "Haryana Police Academy (HPA) Madhuban",
                    actions: "Apex State Training Governance, Gazetted Officers Induction, Curriculum & Research Oversight",
                  },
                  {
                    category: "TRAINING",
                    wing: "Training Academies",
                    wingBadge: "bg-amber-100 text-amber-900 border-amber-200",
                    role: "DIG / Principal PTC",
                    rank: "DIG / SP",
                    policy: "College-Wide",
                    scope: "Police Training College Sunaria / RTC Bhondsi / Women PTC Hisar",
                    actions: "Institutional Command, Recruit Training Schedules, Faculty & Examination Governance",
                  },
                  {
                    category: "TRAINING",
                    wing: "Training Academies",
                    wingBadge: "bg-amber-100 text-amber-900 border-amber-200",
                    role: "Vice Principal / DSP Training",
                    rank: "Additional SP / DSP",
                    policy: "Campus-Wide",
                    scope: "Academic & Outdoor Training Wings",
                    actions: "Class Schedules, Parade Ground Supervision, Firing Range Safety, Trainee Welfare",
                  },
                  {
                    category: "TRAINING",
                    wing: "Training Academies",
                    wingBadge: "bg-amber-100 text-amber-900 border-amber-200",
                    role: "Inspector Training Instructor (CDI / Law)",
                    rank: "Inspector",
                    policy: "Wing / Course Scope",
                    scope: "Police Law / Forensic / Weapons Training Classes",
                    actions: "Chief Drill Instructor (CDI), Criminal Law Class Instruction, Practical Investigation Simulations",
                  },
                  {
                    category: "TRAINING",
                    wing: "Training Academies",
                    wingBadge: "bg-amber-100 text-amber-900 border-amber-200",
                    role: "Sub-Inspector (Training Instructor)",
                    rank: "Sub-Inspector (SI)",
                    policy: "Platoon / Subject Scope",
                    scope: "Outdoor Tactics, Drill, Weapon Assembly, Cyber Labs",
                    actions: "Indoor / Outdoor Instructor, Platoon Commander for Trainees, Examination Scrutiny",
                  },
                  {
                    category: "TRAINING",
                    wing: "Training Academies",
                    wingBadge: "bg-amber-100 text-amber-900 border-amber-200",
                    role: "Assistant Sub-Inspector (Training Assistant)",
                    rank: "Assistant Sub-Inspector (ASI)",
                    policy: "Training Wing",
                    scope: "Firing Range, Obstacle Course, Physical Training",
                    actions: "Range Assistant, PT / Drill Supervision, Practical Demonstration",
                  },
                  {
                    category: "TRAINING",
                    wing: "Training Academies",
                    wingBadge: "bg-amber-100 text-amber-900 border-amber-200",
                    role: "Head Constable (Drill Instructor - DI)",
                    rank: "Head Constable (HC)",
                    policy: "Squad Scope",
                    scope: "Squad Drill Ground, Physical Endurance, Weapon Handling",
                    actions: "Drill Instructor (DI), Marching Discipline, Uniform & Kit Inspections",
                  },
                  {
                    category: "TRAINING",
                    wing: "Training Academies",
                    wingBadge: "bg-amber-100 text-amber-900 border-amber-200",
                    role: "Recruit / Trainee Constable",
                    rank: "Constable",
                    policy: "Course-Bound",
                    scope: "Basic Recruit Training Course (BRTC) Squad",
                    actions: "Mandatory Training Course Completion, Outdoor Drill, Law & Ethics Assessment",
                  },

                  // 4. SPECIALIZED UNITS
                  {
                    category: "SPECIALIZED",
                    wing: "Specialized Wings",
                    wingBadge: "bg-purple-100 text-purple-900 border-purple-200",
                    role: "ADGP / IG (CID / State Crime / STF / Cyber)",
                    rank: "ADGP / IG",
                    policy: "State-Wide",
                    scope: "State Intelligence / Organized Crime / Cyber Command",
                    actions: "Apex Intelligence Oversight, Inter-State Coordination, High-Tech Crime Detection Policy",
                  },
                  {
                    category: "SPECIALIZED",
                    wing: "Specialized Wings",
                    wingBadge: "bg-purple-100 text-purple-900 border-purple-200",
                    role: "SP (CID / STF / Cyber / SCB)",
                    rank: "Superintendent of Police (SP)",
                    policy: "Wing-Wide",
                    scope: "State-Wide Specialized Cell / Task Force",
                    actions: "Unit Supervision, Sensitive Intelligence Gathering, Specialized Investigation Direction",
                  },
                  {
                    category: "SPECIALIZED",
                    wing: "Specialized Wings",
                    wingBadge: "bg-purple-100 text-purple-900 border-purple-200",
                    role: "DSP (Special Operations)",
                    rank: "Deputy SP (DSP)",
                    policy: "Range / Zone Scope",
                    scope: "Specialized Investigation Team / STF Field Unit",
                    actions: "Tactical Raids, Organized Crime Interception, Cyber Forensics Supervision",
                  },
                  {
                    category: "SPECIALIZED",
                    wing: "Specialized Wings",
                    wingBadge: "bg-purple-100 text-purple-900 border-purple-200",
                    role: "Inspector (Special Unit Incharge)",
                    rank: "Inspector",
                    policy: "Team Scope",
                    scope: "Specialized Investigation Team / Cyber Crime Cell",
                    actions: "Case Investigation, Digital Evidence Extraction, Surveillance & Interrogation",
                  },
                  {
                    category: "SPECIALIZED",
                    wing: "Specialized Wings",
                    wingBadge: "bg-purple-100 text-purple-900 border-purple-200",
                    role: "Sub-Inspector (Technical / Field IO)",
                    rank: "Sub-Inspector (SI)",
                    policy: "Case Scope",
                    scope: "Assigned Specialized Case Investigation",
                    actions: "Technical Analysis, CDR/IPDR Analysis, Undercover Intelligence, Case Documentation",
                  },

                  // 5. DISTRICT EXECUTIVE POLICE
                  {
                    category: "DISTRICT",
                    wing: "District Police",
                    wingBadge: "bg-slate-100 text-slate-800 border-slate-200",
                    role: "SP (Superintendent of Police)",
                    rank: "Superintendent of Police (SP)",
                    policy: "District-Wide",
                    scope: "Entire Assigned Revenue District",
                    actions: "District Police Command, Challan Scrutiny, EO Reassignments, Law & Order Management",
                  },
                  {
                    category: "DISTRICT",
                    wing: "District Police",
                    wingBadge: "bg-slate-100 text-slate-800 border-slate-200",
                    role: "Additional SP / ASP",
                    rank: "Additional SP (ASP)",
                    policy: "District-Wide",
                    scope: "District HQ & Assigned Circles",
                    actions: "Circle Oversight, Inquiries, Super-Admin Reviews, Night Patrol Monitoring",
                  },
                  {
                    category: "DISTRICT",
                    wing: "District Police",
                    wingBadge: "bg-slate-100 text-slate-800 border-slate-200",
                    role: "DSP (Sub-Division)",
                    rank: "Deputy SP (DSP)",
                    policy: "Subdivision Multi-Station",
                    scope: "Assigned Police Stations within Sub-Division",
                    actions: "Supervisory Scrutiny, Enquiry Approval Recommendation, Heinous Crime Spot Visit",
                  },
                  {
                    category: "DISTRICT",
                    wing: "District Police",
                    wingBadge: "bg-slate-100 text-slate-800 border-slate-200",
                    role: "SHO (Inspector / Sub-Inspector)",
                    rank: "Inspector / SI",
                    policy: "Single Station",
                    scope: "Assigned Police Station Jurisdiction",
                    actions: "FIR Registration Approval, Zimni Review, Daily Diary Lock, Police Station Administration",
                  },
                  {
                    category: "DISTRICT",
                    wing: "District Police",
                    wingBadge: "bg-slate-100 text-slate-800 border-slate-200",
                    role: "Investigating Officer (IO - SI/ASI)",
                    rank: "Sub-Inspector / ASI",
                    policy: "Investigation Scope",
                    scope: "Assigned Cases across Station Jurisdiction",
                    actions: "Section 192 Zimni Writing, Case Diary, Field Enquiry Report, Court Evidence",
                  },
                  {
                    category: "DISTRICT",
                    wing: "District Police",
                    wingBadge: "bg-slate-100 text-slate-800 border-slate-200",
                    role: "MHC (Moharrir Head Constable)",
                    rank: "Head Constable (HC)",
                    policy: "Station Malkhana & GD",
                    scope: "Assigned Station Malkhana Vault & General Diary",
                    actions: "General Diary Logging, Evidence Tagging, Malkhana Deposit, Case Property Safe Custody",
                  },
                  {
                    category: "DISTRICT",
                    wing: "District Police",
                    wingBadge: "bg-slate-100 text-slate-800 border-slate-200",
                    role: "Duty Officer (ASI / HC)",
                    rank: "ASI / Head Constable",
                    policy: "Counter Scope",
                    scope: "Station Citizen Intake Desk",
                    actions: "Complaint Receiving, Daily Diary (GD) Entry, NC Report Registration, Visitor Guidance",
                  },
                  {
                    category: "DISTRICT",
                    wing: "District Police",
                    wingBadge: "bg-slate-100 text-slate-800 border-slate-200",
                    role: "Beat Constable",
                    rank: "Constable",
                    policy: "Beat Scope",
                    scope: "Assigned Station Beat Area",
                    actions: "Beat Patrolling, Verification, Summons / Warrant Execution, Community Policing",
                  },

                  // 6. STATE POLICE HEADQUARTERS & RANGES
                  {
                    category: "STATE_HQ",
                    wing: "State Command",
                    wingBadge: "bg-rose-100 text-rose-900 border-rose-200",
                    role: "DGP (Director General of Police)",
                    rank: "DGP",
                    policy: "State-Wide",
                    scope: "All 22 Districts, 5 Commissionerates, Battalions & Wings",
                    actions: "Head of Police Force (HoPF), State Policy, IPS/HPS Postings, Ultimate Statutory Authority",
                  },
                  {
                    category: "STATE_HQ",
                    wing: "State Command",
                    wingBadge: "bg-rose-100 text-rose-900 border-rose-200",
                    role: "ADGP (Headquarters / Law & Order)",
                    rank: "ADGP",
                    policy: "State-Wide",
                    scope: "Police Headquarters, Panchkula",
                    actions: "State-Level Resource Allocation, General Law & Order Supervision, Legislative Assembly Liaison",
                  },
                  {
                    category: "STATE_HQ",
                    wing: "State Command",
                    wingBadge: "bg-rose-100 text-rose-900 border-rose-200",
                    role: "IG / DIG (Police Range)",
                    rank: "IG / DIG",
                    policy: "Range-Wide",
                    scope: "Revenue Districts under Range (Karnal, Hisar, Rohtak, Ambala, South Range)",
                    actions: "Range Supervision, Inter-District Crime Review, Transfer Approvals, Annual Inspections",
                  },
                ]
                  .filter((pol) => policyWingFilter === "ALL" || pol.category === policyWingFilter)
                  .map((pol) => (
                    <tr key={pol.role} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3">
                        <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold border", pol.wingBadge)}>
                          {pol.wing}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-slate-900">{pol.role}</td>
                      <td className="p-3 text-slate-700 font-medium">
                        <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] font-mono text-slate-800">
                          {pol.rank}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-blue-50 text-[#1e3a8a] font-semibold text-[10px] whitespace-nowrap">
                          {pol.policy}
                        </span>
                      </td>
                      <td className="p-3 text-slate-700">{pol.scope}</td>
                      <td className="p-3 text-slate-600">{pol.actions}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: AUDIT LOGS */}
      {activeTab === "audits" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-600" />
              Account Administration Audit Logs
            </h2>
            <p className="text-[11px] text-slate-500">
              Immutable security audit trail of all account creation, status toggles, and password resets.
            </p>
          </div>
          <div className="divide-y divide-slate-100 text-xs">
            {auditLogs.map((log) => (
              <div key={log.id} className="py-2.5 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 uppercase text-[10px] px-1.5 py-0.2 rounded bg-slate-100 font-mono">
                      {log.action}
                    </span>
                    <span className="font-semibold text-slate-900">{log.targetUsername}</span>
                    <span className="text-[10px] text-slate-400">by {log.performedByPno}</span>
                  </div>
                  <p className="text-slate-600 mt-1">{log.details}</p>
                </div>
                <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                  {new Date(log.timestamp).toLocaleString("en-IN")}
                </span>
              </div>
            ))}
            {auditLogs.length === 0 && (
              <div className="py-8 text-center text-slate-400">No audit logs recorded yet.</div>
            )}
          </div>
        </div>
      )}

      {/* EDIT / SHIFT OFFICER MODAL */}
      {showEditModal && selectedAccount && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <ArrowRightLeft className="w-4 h-4 text-blue-700" />
                  Edit Details & Shift Posting
                </h3>
                <p className="text-[11px] text-slate-500">{selectedAccount.fullName} ({selectedAccount.pno})</p>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAccountEdit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={editFormData.fullName || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, fullName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Mobile *</label>
                  <input
                    type="tel"
                    required
                    value={editFormData.mobileNumber || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, mobileNumber: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Belt Number</label>
                  <input
                    type="text"
                    value={editFormData.beltNumber || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, beltNumber: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Police Rank</label>
                  <select
                    value={editFormData.rank || ""}
                    onChange={(e) => {
                      const selected = POLICE_RANKS_OPTIONS.find((r) => r.rank === e.target.value);
                      setEditFormData({
                        ...editFormData,
                        rank: e.target.value,
                        rankDisplay: selected ? selected.display : e.target.value,
                      });
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium"
                  >
                    {POLICE_RANKS_OPTIONS.map((opt) => (
                      <option key={opt.rank} value={opt.rank}>
                        {opt.display}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Email</label>
                <input
                  type="email"
                  value={editFormData.email || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                />
              </div>

              <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl space-y-3">
                <span className="text-[10px] font-bold text-blue-900 uppercase tracking-wider block">
                  Transfer & Shift Police Jurisdiction
                </span>
                <div className={cn(
                  "grid gap-3",
                  COMMISSIONERATES_LIST.some(
                    (c) =>
                      c.district.toLowerCase() === (editFormData.district || "").toLowerCase() ||
                      c.name.toLowerCase() === (editFormData.range || "").toLowerCase()
                  )
                    ? "grid-cols-1 sm:grid-cols-3"
                    : "grid-cols-2"
                )}>
                  <div>
                    <label className="font-semibold text-blue-900 block mb-1">Shift District *</label>
                    <select
                      value={editFormData.district || ""}
                      onChange={(e) => {
                        const newDst = e.target.value;
                        const dstObj = locationDistricts.find((d) => d.name === newDst);
                        const stationsInDst = locationStations.filter((ps) => ps.districtName === newDst);
                        const firstPs = stationsInDst[0]?.name || `${newDst} Central PS`;
                        setEditFormData({
                          ...editFormData,
                          district: newDst,
                          range: dstObj?.rangeName || editFormData.range || "",
                          zone: "",
                          policeStation: firstPs,
                          assignedUnitName: firstPs,
                        });
                      }}
                      className="w-full bg-white border border-blue-300 font-bold text-blue-950 rounded-lg p-2"
                    >
                      {locationDistricts.map((d) => (
                        <option key={d.id} value={d.name}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {COMMISSIONERATES_LIST.some(
                    (c) =>
                      c.district.toLowerCase() === (editFormData.district || "").toLowerCase() ||
                      c.name.toLowerCase() === (editFormData.range || "").toLowerCase()
                  ) && (
                    <div>
                      <label className="font-semibold text-blue-900 block mb-1">Shift Zone (DCP)</label>
                      <select
                        value={editFormData.zone || ""}
                        onChange={(e) => setEditFormData({ ...editFormData, zone: e.target.value })}
                        className="w-full bg-white border border-blue-300 font-bold text-blue-950 rounded-lg p-2"
                      >
                        <option value="">-- Select Zone --</option>
                        {COMMISSIONERATE_ZONES.filter((z) =>
                          z.district.toLowerCase() === (editFormData.district || "").toLowerCase()
                        ).map((z) => (
                          <option key={z.id} value={z.name}>
                            {z.name} ({z.dcpTitle})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="font-semibold text-blue-900 block mb-1">Shift Police Station *</label>
                    <select
                      value={editFormData.policeStation || ""}
                      onChange={(e) => {
                        const stName = e.target.value;
                        const matched = locationStations.find((s) => s.name === stName);
                        setEditFormData({
                          ...editFormData,
                          policeStation: stName,
                          assignedUnitName: stName,
                          assignedUnitId: matched?.code || "HAR-PS-GEN",
                        });
                      }}
                      className="w-full bg-white border border-blue-300 font-bold text-blue-950 rounded-lg p-2"
                    >
                      {locationStations
                        .filter((ps) => ps.districtName === editFormData.district)
                        .map((ps) => (
                          <option key={ps.id} value={ps.name}>
                            {ps.name} ({ps.stationType})
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-3.5 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-4 py-1.5 bg-[#1e3a8a] text-white rounded-xl text-xs font-bold hover:bg-[#152865] disabled:opacity-50"
                >
                  {savingEdit ? "Updating Posting..." : "Save Changes / Shift"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SPECIAL STATION ALLOCATION MODAL */}
      {showSpecialAllocModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <BadgeCheck className="w-4 h-4 text-purple-700" />
                  Grant Special Station Allocation
                </h3>
                <p className="text-[11px] text-slate-500">Provide temporary additional police station jurisdiction.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowSpecialAllocModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSpecialAllocation} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Select Officer *</label>
                <select
                  required
                  value={allocAccountId}
                  onChange={(e) => setAllocAccountId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 font-bold text-slate-800 rounded-lg p-2"
                >
                  <option value="">-- Choose Officer --</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.fullName} ({a.pno}) - {a.policeStation}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Target District *</label>
                <select
                  value={allocDistrictId}
                  onChange={(e) => {
                    const dst = locationDistricts.find((d) => d.id === e.target.value);
                    setAllocDistrictId(e.target.value);
                    setAllocDistrictName(dst?.name || "");
                    setAllocStationNames([]);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 font-bold text-slate-800 rounded-lg p-2"
                >
                  {locationDistricts.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.rangeName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Select Additional Station(s) *</label>
                <div className="max-h-32 overflow-y-auto border border-slate-200 rounded-lg p-2 bg-slate-50 space-y-1">
                  {locationStations
                    .filter((ps) => ps.districtName === allocDistrictName)
                    .map((ps) => (
                      <label key={ps.id} className="flex items-center gap-2 cursor-pointer text-[11px]">
                        <input
                          type="checkbox"
                          checked={allocStationNames.includes(ps.name)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setAllocStationNames([...allocStationNames, ps.name]);
                            } else {
                              setAllocStationNames(allocStationNames.filter((name) => name !== ps.name));
                            }
                          }}
                        />
                        <span>{ps.name} ({ps.stationType})</span>
                      </label>
                    ))}
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Assignment Reason *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Election Domination / VVIP Bandobast / Joint SIT"
                  value={allocReason}
                  onChange={(e) => setAllocReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Start Date</label>
                  <input
                    type="date"
                    value={allocStartDate}
                    onChange={(e) => setAllocStartDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">End Date (Optional)</label>
                  <input
                    type="date"
                    value={allocEndDate}
                    onChange={(e) => setAllocEndDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSpecialAllocModal(false)}
                  className="px-3.5 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingAlloc}
                  className="px-4 py-1.5 bg-purple-700 text-white rounded-xl text-xs font-bold hover:bg-purple-800 disabled:opacity-50"
                >
                  {savingAlloc ? "Granting..." : "Grant Allocation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESET PIN MODAL */}
      {showResetPinModal && selectedAccount && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-blue-50 text-[#1e3a8a] flex items-center justify-center">
                <Key className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Reset Account PIN</h3>
                <p className="text-[11px] text-slate-500">{selectedAccount.fullName} ({selectedAccount.pno})</p>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 block">Enter New PIN (min 4 digits) *</label>
              <input
                type="text"
                placeholder="e.g. 123456"
                value={newPinValue}
                onChange={(e) => setNewPinValue(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-center font-mono font-bold tracking-widest text-sm focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowResetPinModal(false);
                  setNewPinValue("");
                }}
                className="px-3.5 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetPinSubmit}
                disabled={resettingPin}
                className="px-4 py-1.5 bg-[#1e3a8a] text-white rounded-xl text-xs font-bold hover:bg-[#152865] disabled:opacity-50 cursor-pointer"
              >
                {resettingPin ? "Resetting..." : "Save New PIN"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE ACCOUNT CONFIRMATION MODAL */}
      {showDeleteModal && accountToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-red-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Confirm Account Deletion</h3>
                <p className="text-xs text-slate-500">Developer Administrator Authorization</p>
              </div>
            </div>

            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl space-y-2.5 text-xs">
              <p className="font-bold text-red-900">
                Are you sure you want to permanently delete this officer account?
              </p>
              <div className="bg-white p-3 rounded-lg border border-red-100 space-y-1 text-slate-700">
                <div className="font-bold text-slate-900 text-sm">{accountToDelete.fullName}</div>
                <div className="text-[11px] text-slate-600">
                  <span className="font-semibold text-slate-500">PNO / Belt:</span>{" "}
                  <span className="font-mono font-bold text-[#1e3a8a]">{accountToDelete.pno}</span>
                  {accountToDelete.beltNumber ? ` (Belt: ${accountToDelete.beltNumber})` : ""}
                </div>
                <div className="text-[11px] text-slate-600">
                  <span className="font-semibold text-slate-500">Role & Designation:</span> {accountToDelete.role} — {accountToDelete.designation}
                </div>
                <div className="text-[11px] text-slate-600">
                  <span className="font-semibold text-slate-500">Assigned Unit / Posting:</span>{" "}
                  <span className="font-medium text-slate-900">
                    {accountToDelete.policeStation || accountToDelete.assignedUnitName}
                  </span>
                  , {accountToDelete.district}
                </div>
              </div>
              <p className="text-[11px] text-red-700 font-medium leading-relaxed">
                ⚠️ <span className="font-bold">Permanent Action:</span> This action cannot be undone. All portal login credentials, active sessions, and station-level authorizations for this officer will be revoked immediately.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setAccountToDelete(null);
                }}
                disabled={deletingAccount}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteAccount}
                disabled={deletingAccount}
                className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 transition-colors shadow-xs disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                {deletingAccount ? (
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
