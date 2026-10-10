// Type definitions for Station Staff Management
export type StaffRoleCategory =
  | "SHO"
  | "EO_IO"
  | "GENERAL"
  | "ERV"
  | "RIDER"
  | "MHC";

export interface StaffCategoryDef {
  code: StaffRoleCategory;
  label: string;
  labelHi: string;
  description: string;
  badgeColor: string;
  borderColor: string;
  iconBg: string;
}

export const STAFF_CATEGORY_CONFIG: Record<StaffRoleCategory, StaffCategoryDef> = {
  SHO: {
    code: "SHO",
    label: "SHO / Station House Officer",
    labelHi: "थाना प्रभारी (एस.एच.ओ.)",
    description: "Overall Supervisory & Executive In-Charge of the Police Station",
    badgeColor: "bg-red-100 text-red-800 border-red-300",
    borderColor: "border-red-400",
    iconBg: "bg-red-50 text-red-700",
  },
  EO_IO: {
    code: "EO_IO",
    label: "EO / IO Staff",
    labelHi: "जांच / अनुसंधान अधिकारी (EO / IO)",
    description: "Enquiry Officers & Investigating Officers (SI / ASI / HC)",
    badgeColor: "bg-blue-100 text-blue-800 border-blue-300",
    borderColor: "border-blue-400",
    iconBg: "bg-blue-50 text-blue-700",
  },
  GENERAL: {
    code: "GENERAL",
    label: "General Staff",
    labelHi: "सामान्य स्टाफ (सेंट्री, संमन, पहरा)",
    description: "Sentry Guard, Lockup In-Charge, Court & General Station Staff",
    badgeColor: "bg-slate-100 text-slate-800 border-slate-300",
    borderColor: "border-slate-400",
    iconBg: "bg-slate-50 text-slate-700",
  },
  ERV: {
    code: "ERV",
    label: "ERV Staff (Dial 112)",
    labelHi: "ई.आर.वी. स्टाफ (डायल 112)",
    description: "Emergency Response Vehicles Pilots & First Responder Staff",
    badgeColor: "bg-amber-100 text-amber-800 border-amber-300",
    borderColor: "border-amber-400",
    iconBg: "bg-amber-50 text-amber-700",
  },
  RIDER: {
    code: "RIDER",
    label: "Rider Staff",
    labelHi: "राइडर पेट्रोलिंग स्टाफ (मोटरसाइकिल)",
    description: "Beat Motorcycle Patrolling Riders for Market & Residential Beats",
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
    borderColor: "border-emerald-400",
    iconBg: "bg-emerald-50 text-emerald-700",
  },
  MHC: {
    code: "MHC",
    label: "MHC Staff",
    labelHi: "मुहर्रिर हेड कांस्टेबल (MHC / मालखाना)",
    description: "Moharrir Head Constable, Station Writer, Malkhana & Record Keepers",
    badgeColor: "bg-purple-100 text-purple-800 border-purple-300",
    borderColor: "border-purple-400",
    iconBg: "bg-purple-50 text-purple-700",
  },
};

export interface StationStaffMember {
  id: string;
  name: string;
  rank: string;
  category: StaffRoleCategory;
  pno: string;
  beltNumber: string;
  mobile: string;
  assignedDuty: string;
  vehicleOrBeatNo?: string;
  shift: string;
  postingDate?: string; // YYYY-MM-DD
  status: "ACTIVE" | "ON_DUTY" | "ON_LEAVE" | "TRAINING";
  email?: string;
  stationName: string;
}
