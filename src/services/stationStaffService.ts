import { StationStaffMember, StaffRoleCategory } from "@/types/stationStaff";

const STORAGE_KEY = "haryana_police_cms_station_staff_v2";

export const DEFAULT_STATION_STAFF: StationStaffMember[] = [
  // 1. SHO
  {
    id: "staff-sho-1",
    name: "Inspector Rajesh Kumar",
    rank: "Inspector",
    category: "SHO",
    pno: "12040051",
    beltNumber: "101/KKR",
    mobile: "9812000001",
    email: "sho.thanesar@haryanapolice.gov.in",
    assignedDuty: "Station Incharge (SHO) - Overall Supervision & Law/Order",
    shift: "Round the Clock (24x7)",
    postingDate: "2024-01-15",
    status: "ON_DUTY",
    stationName: "Police Station Thanesar City",
  },

  // 2. EO / IO Staff
  {
    id: "staff-eo-1",
    name: "SI Vikram Singh",
    rank: "Sub-Inspector",
    category: "EO_IO",
    pno: "14060012",
    beltNumber: "245/KKR",
    mobile: "9812000002",
    assignedDuty: "Senior IO - Serious Crimes & Investigation Cell",
    shift: "Day Shift (08:00 - 20:00)",
    postingDate: "2024-03-10",
    status: "ON_DUTY",
    stationName: "Police Station Thanesar City",
  },
  {
    id: "staff-eo-2",
    name: "ASI Ramesh Chander",
    rank: "Assistant Sub-Inspector",
    category: "EO_IO",
    pno: "15070088",
    beltNumber: "382/KKR",
    mobile: "9812000003",
    assignedDuty: "EO / IO - Financial Complaints & Cyber Fraud Desk",
    shift: "Day Shift (08:00 - 20:00)",
    postingDate: "2024-02-01",
    status: "ON_DUTY",
    stationName: "Police Station Thanesar City",
  },
  {
    id: "staff-eo-3",
    name: "ASI Meenakshi Devi",
    rank: "Assistant Sub-Inspector",
    category: "EO_IO",
    pno: "16090123",
    beltNumber: "412/KKR",
    mobile: "9812000004",
    assignedDuty: "EO / IO - Women & Child Safety / POCSO Inquiries",
    shift: "Day Shift (09:00 - 18:00)",
    postingDate: "2024-04-18",
    status: "ON_DUTY",
    stationName: "Police Station Thanesar City",
  },
  {
    id: "staff-eo-4",
    name: "HC Surender Pal",
    rank: "Head Constable",
    category: "EO_IO",
    pno: "17080234",
    beltNumber: "512/KKR",
    mobile: "9812000005",
    assignedDuty: "IO - Property Crimes, Theft & General Grievances",
    shift: "Night Shift (20:00 - 08:00)",
    postingDate: "2024-05-02",
    status: "ACTIVE",
    stationName: "Police Station Thanesar City",
  },

  // 3. General Staff
  {
    id: "staff-gen-1",
    name: "HC Balwan Singh",
    rank: "Head Constable",
    category: "GENERAL",
    pno: "18020345",
    beltNumber: "601/KKR",
    mobile: "9812000006",
    assignedDuty: "Station Sentry Guard & Hawalat / Lockup Security",
    shift: "Day Shift (08:00 - 16:00)",
    postingDate: "2023-11-20",
    status: "ON_DUTY",
    stationName: "Police Station Thanesar City",
  },
  {
    id: "staff-gen-2",
    name: "Constable Ankit",
    rank: "Constable",
    category: "GENERAL",
    pno: "19040567",
    beltNumber: "789/KKR",
    mobile: "9812000007",
    assignedDuty: "Summons / Warrants Service & Court Dak Carrier",
    shift: "Day Shift (09:00 - 17:00)",
    postingDate: "2024-06-11",
    status: "ON_DUTY",
    stationName: "Police Station Thanesar City",
  },
  {
    id: "staff-gen-3",
    name: "Lady Constable Kavita",
    rank: "Lady Constable",
    category: "GENERAL",
    pno: "20050678",
    beltNumber: "820/KKR",
    mobile: "9812000008",
    assignedDuty: "Front Desk & Public Grievance Reception Desk",
    shift: "Day Shift (09:00 - 18:00)",
    postingDate: "2024-01-08",
    status: "ACTIVE",
    stationName: "Police Station Thanesar City",
  },

  // 4. ERV Staff (Dial 112)
  {
    id: "staff-erv-1",
    name: "ASI Dharamvir",
    rank: "Assistant Sub-Inspector",
    category: "ERV",
    pno: "15080033",
    beltNumber: "456/KKR",
    mobile: "9812000009",
    vehicleOrBeatNo: "ERV-01 (HR-07-G-1121)",
    assignedDuty: "Incharge ERV-112 Quick Response Unit #01",
    shift: "Shift-A (08:00 - 16:00)",
    postingDate: "2024-02-15",
    status: "ON_DUTY",
    stationName: "Police Station Thanesar City",
  },
  {
    id: "staff-erv-2",
    name: "Constable Sanjay (Pilot)",
    rank: "Constable (Pilot)",
    category: "ERV",
    pno: "21010789",
    beltNumber: "912/KKR",
    mobile: "9812000010",
    vehicleOrBeatNo: "ERV-01 (HR-07-G-1121)",
    assignedDuty: "Pilot / Driver for ERV-112 Emergency Vehicle #01",
    shift: "Shift-A (08:00 - 16:00)",
    postingDate: "2024-02-15",
    status: "ON_DUTY",
    stationName: "Police Station Thanesar City",
  },
  {
    id: "staff-erv-3",
    name: "HC Manoj Kumar",
    rank: "Head Constable",
    category: "ERV",
    pno: "17040456",
    beltNumber: "567/KKR",
    mobile: "9812000011",
    vehicleOrBeatNo: "ERV-02 (HR-07-G-1122)",
    assignedDuty: "First Responder / Commando ERV Unit #02",
    shift: "Shift-B (16:00 - 00:00)",
    postingDate: "2024-03-01",
    status: "ACTIVE",
    stationName: "Police Station Thanesar City",
  },

  // 5. Rider Staff
  {
    id: "staff-rider-1",
    name: "Constable Amit",
    rank: "Constable",
    category: "RIDER",
    pno: "20030112",
    beltNumber: "845/KKR",
    mobile: "9812000012",
    vehicleOrBeatNo: "Rider Bike-01 (HR-07-AA-4401)",
    assignedDuty: "Patrol Beat #1: Main Bazaar, Railway Station & Bus Stand",
    shift: "Morning Beat (06:00 - 14:00)",
    postingDate: "2024-04-05",
    status: "ON_DUTY",
    stationName: "Police Station Thanesar City",
  },
  {
    id: "staff-rider-2",
    name: "Constable Sandeep",
    rank: "Constable",
    category: "RIDER",
    pno: "21040223",
    beltNumber: "923/KKR",
    mobile: "9812000013",
    vehicleOrBeatNo: "Rider Bike-02 (HR-07-AA-4402)",
    assignedDuty: "Patrol Beat #2: Sector 7, Sector 13 & University Perimeter",
    shift: "Evening Beat (14:00 - 22:00)",
    postingDate: "2024-04-05",
    status: "ON_DUTY",
    stationName: "Police Station Thanesar City",
  },

  // 6. MHC Staff
  {
    id: "staff-mhc-1",
    name: "HC Devinder Kumar",
    rank: "Head Constable",
    category: "MHC",
    pno: "16010045",
    beltNumber: "334/KKR",
    mobile: "9812000014",
    assignedDuty: "Moharrir Head Constable (MHC) - Station Head Writer & General Diary",
    shift: "General Duty (08:00 - 20:00)",
    postingDate: "2023-08-10",
    status: "ON_DUTY",
    stationName: "Police Station Thanesar City",
  },
  {
    id: "staff-mhc-2",
    name: "HC Joginder Singh",
    rank: "Head Constable",
    category: "MHC",
    pno: "16050078",
    beltNumber: "356/KKR",
    mobile: "9812000015",
    assignedDuty: "Malkhana Moharrir - Incharge Armory, Seized Property & Mudda Mal",
    shift: "General Duty (09:00 - 18:00)",
    postingDate: "2023-09-12",
    status: "ACTIVE",
    stationName: "Police Station Thanesar City",
  },
];

export const stationStaffService = {
  getStaffMembers: (): StationStaffMember[] => {
    if (typeof window === "undefined") {
      return DEFAULT_STATION_STAFF;
    }
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_STATION_STAFF));
        return DEFAULT_STATION_STAFF;
      }
      return JSON.parse(stored);
    } catch {
      return DEFAULT_STATION_STAFF;
    }
  },

  getStaffByCategory: (category: StaffRoleCategory | "ALL"): StationStaffMember[] => {
    const list = stationStaffService.getStaffMembers();
    if (category === "ALL") return list;
    return list.filter((item) => item.category === category);
  },

  saveStaffMember: (member: Omit<StationStaffMember, "id"> & { id?: string }): StationStaffMember => {
    const all = stationStaffService.getStaffMembers();
    if (member.id) {
      // Edit existing
      const updated = all.map((item) => (item.id === member.id ? ({ ...member, id: member.id } as StationStaffMember) : item));
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      }
      return member as StationStaffMember;
    } else {
      // Create new
      const newStaff: StationStaffMember = {
        ...member,
        id: `staff-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      };
      const updated = [newStaff, ...all];
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      }
      return newStaff;
    }
  },

  deleteStaffMember: (id: string): boolean => {
    const all = stationStaffService.getStaffMembers();
    const updated = all.filter((item) => item.id !== id);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
    return true;
  },

  resetToDefault: (): StationStaffMember[] => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_STATION_STAFF));
    }
    return DEFAULT_STATION_STAFF;
  },
};
