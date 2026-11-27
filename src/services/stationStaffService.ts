import type { UserSession } from "@/types";
import { StationStaffMember, StaffRoleCategory } from "@/types/stationStaff";

const STORAGE_KEY = "haryana_police_cms_station_staff_v3";

export const DEFAULT_STATION_STAFF: StationStaffMember[] = [
  // 1. SHO
  {
    id: "staff-sho-1",
    name: "Inspector Rajesh Kumar",
    rank: "Inspector",
    category: "SHO",
    pno: "HR-12040051",
    beltNumber: "101/PNP",
    mobile: "9812000001",
    email: "sho.panipat@haryanapolice.gov.in",
    assignedDuty: "Station Incharge (SHO) - Overall Supervision & Law/Order",
    shift: "Round the Clock (24x7)",
    postingDate: "2024-01-15",
    status: "ON_DUTY",
    stationName: "Police Station City Panipat",
  },

  // 2. EO / IO Staff
  {
    id: "staff-eo-1",
    name: "SI Vikram Singh",
    rank: "Sub-Inspector",
    category: "EO_IO",
    pno: "HR-14060012",
    beltNumber: "245/PNP",
    mobile: "9812000002",
    assignedDuty: "Senior IO - Serious Crimes & Investigation Cell",
    shift: "Day Shift (08:00 - 20:00)",
    postingDate: "2024-03-10",
    status: "ON_DUTY",
    stationName: "Police Station City Panipat",
  },
  {
    id: "staff-eo-2",
    name: "ASI Ramesh Chander",
    rank: "Assistant Sub-Inspector",
    category: "EO_IO",
    pno: "HR-15070088",
    beltNumber: "382/PNP",
    mobile: "9812000003",
    assignedDuty: "EO / IO - Financial Complaints & Cyber Fraud Desk",
    shift: "Day Shift (08:00 - 20:00)",
    postingDate: "2024-02-01",
    status: "ON_DUTY",
    stationName: "Police Station City Panipat",
  },
  {
    id: "staff-eo-3",
    name: "ASI Meenakshi Devi",
    rank: "Assistant Sub-Inspector",
    category: "EO_IO",
    pno: "HR-16090123",
    beltNumber: "412/PNP",
    mobile: "9812000004",
    assignedDuty: "EO / IO - Women & Child Safety / POCSO Inquiries",
    shift: "Day Shift (09:00 - 18:00)",
    postingDate: "2024-04-18",
    status: "ON_DUTY",
    stationName: "Police Station City Panipat",
  },
  {
    id: "staff-eo-4",
    name: "HC Surender Pal",
    rank: "Head Constable",
    category: "EO_IO",
    pno: "HR-17080234",
    beltNumber: "512/PNP",
    mobile: "9812000005",
    assignedDuty: "IO - Property Crimes, Theft & General Grievances",
    shift: "Night Shift (20:00 - 08:00)",
    postingDate: "2024-05-02",
    status: "ACTIVE",
    stationName: "Police Station City Panipat",
  },

  // 3. General Staff
  {
    id: "staff-gen-1",
    name: "HC Balwan Singh",
    rank: "Head Constable",
    category: "GENERAL",
    pno: "HR-18020345",
    beltNumber: "601/PNP",
    mobile: "9812000006",
    assignedDuty: "Station Sentry Guard & Hawalat / Lockup Security",
    shift: "Day Shift (08:00 - 16:00)",
    postingDate: "2023-11-20",
    status: "ON_DUTY",
    stationName: "Police Station City Panipat",
  },
  {
    id: "staff-gen-2",
    name: "Constable Ankit",
    rank: "Constable",
    category: "GENERAL",
    pno: "HR-19040567",
    beltNumber: "789/PNP",
    mobile: "9812000007",
    assignedDuty: "Summons / Warrants Service & Court Dak Carrier",
    shift: "Day Shift (09:00 - 17:00)",
    postingDate: "2024-06-11",
    status: "ON_DUTY",
    stationName: "Police Station City Panipat",
  },
  {
    id: "staff-gen-3",
    name: "Lady Constable Kavita",
    rank: "Lady Constable",
    category: "GENERAL",
    pno: "HR-20050678",
    beltNumber: "820/PNP",
    mobile: "9812000008",
    assignedDuty: "Front Desk & Public Grievance Reception Desk",
    shift: "Day Shift (09:00 - 18:00)",
    postingDate: "2024-01-08",
    status: "ACTIVE",
    stationName: "Police Station City Panipat",
  },

  // 4. ERV Staff (Dial 112)
  {
    id: "staff-erv-1",
    name: "ASI Dharamvir",
    rank: "Assistant Sub-Inspector",
    category: "ERV",
    pno: "HR-15080033",
    beltNumber: "456/PNP",
    mobile: "9812000009",
    vehicleOrBeatNo: "ERV-01 (HR-07-G-1121)",
    assignedDuty: "Incharge ERV-112 Quick Response Unit #01",
    shift: "Shift-A (08:00 - 16:00)",
    postingDate: "2024-02-15",
    status: "ON_DUTY",
    stationName: "Police Station City Panipat",
  },
  {
    id: "staff-erv-2",
    name: "Constable Sanjay (Pilot)",
    rank: "Constable (Pilot)",
    category: "ERV",
    pno: "HR-21010789",
    beltNumber: "912/PNP",
    mobile: "9812000010",
    vehicleOrBeatNo: "ERV-01 (HR-07-G-1121)",
    assignedDuty: "Pilot / Driver for ERV-112 Emergency Vehicle #01",
    shift: "Shift-A (08:00 - 16:00)",
    postingDate: "2024-02-15",
    status: "ON_DUTY",
    stationName: "Police Station City Panipat",
  },
  {
    id: "staff-erv-3",
    name: "HC Manoj Kumar",
    rank: "Head Constable",
    category: "ERV",
    pno: "HR-17040456",
    beltNumber: "567/PNP",
    mobile: "9812000011",
    vehicleOrBeatNo: "ERV-02 (HR-07-G-1122)",
    assignedDuty: "First Responder / Commando ERV Unit #02",
    shift: "Shift-B (16:00 - 00:00)",
    postingDate: "2024-03-01",
    status: "ACTIVE",
    stationName: "Police Station City Panipat",
  },

  // 5. Rider Staff
  {
    id: "staff-rider-1",
    name: "Constable Amit",
    rank: "Constable",
    category: "RIDER",
    pno: "HR-20030112",
    beltNumber: "845/PNP",
    mobile: "9812000012",
    vehicleOrBeatNo: "Rider Bike-01 (HR-07-AA-4401)",
    assignedDuty: "Patrol Beat #1: Main Bazaar, Railway Station & Bus Stand",
    shift: "Morning Beat (06:00 - 14:00)",
    postingDate: "2024-04-05",
    status: "ON_DUTY",
    stationName: "Police Station City Panipat",
  },
  {
    id: "staff-rider-2",
    name: "Constable Sandeep",
    rank: "Constable",
    category: "RIDER",
    pno: "HR-21040223",
    beltNumber: "923/PNP",
    mobile: "9812000013",
    vehicleOrBeatNo: "Rider Bike-02 (HR-07-AA-4402)",
    assignedDuty: "Patrol Beat #2: Sector 7, Sector 13 & University Perimeter",
    shift: "Evening Beat (14:00 - 22:00)",
    postingDate: "2024-04-05",
    status: "ON_DUTY",
    stationName: "Police Station City Panipat",
  },

  // 6. MHC Staff
  {
    id: "staff-mhc-1",
    name: "HC Devinder Kumar",
    rank: "Head Constable",
    category: "MHC",
    pno: "HR-16010045",
    beltNumber: "334/PNP",
    mobile: "9812000014",
    assignedDuty: "Moharrir Head Constable (MHC) - Station Head Writer & General Diary",
    shift: "General Duty (08:00 - 20:00)",
    postingDate: "2023-08-10",
    status: "ON_DUTY",
    stationName: "Police Station City Panipat",
  },
  {
    id: "staff-mhc-2",
    name: "HC Joginder Singh",
    rank: "Head Constable",
    category: "MHC",
    pno: "HR-16050078",
    beltNumber: "356/PNP",
    mobile: "9812000015",
    assignedDuty: "Malkhana Moharrir - Incharge Armory, Seized Property & Mudda Mal",
    shift: "General Duty (09:00 - 18:00)",
    postingDate: "2023-09-12",
    status: "ACTIVE",
    stationName: "Police Station City Panipat",
  },
  // PS Chandni Bagh Panipat (85 Personnel)
  {"id":"staff-cb-udbh0j","name":"AAKASH","rank":"Sub-Inspector","category":"EO_IO","pno":"UDBH0J","beltNumber":"25-12-1999","mobile":"-","assignedDuty":"IO","shift":"Day Shift (08:00 - 20:00)","postingDate":"2026-11-26","status":"ON_DUTY","stationName":"PS Chandni Bagh Panipat"},
  {"id":"staff-cb-hi3gs8","name":"AJAY KUMAR","rank":"Head Constable","category":"EO_IO","pno":"HI3GS8","beltNumber":"100","mobile":"-","assignedDuty":"IO","shift":"Day Shift (08:00 - 20:00)","postingDate":"2026-11-26","status":"ON_DUTY","stationName":"PS Chandni Bagh Panipat"},
  {"id":"staff-cb-7g161w","name":"AJAY KUMAR","rank":"Head Constable","category":"MHC","pno":"7G161W","beltNumber":"447","mobile":"-","assignedDuty":"MHC Staff","shift":"Day Shift (08:00 - 20:00)","postingDate":"2026-11-26","status":"ON_DUTY","stationName":"PS Chandni Bagh Panipat"},
  {"id":"staff-cb-spo236","name":"ANIL","rank":"SPO","category":"GENERAL","pno":"SPO236","beltNumber":"236/SPO","mobile":"-","assignedDuty":"General Duty","shift":"Day Shift (08:00 - 20:00)","postingDate":"2026-11-26","status":"ON_DUTY","stationName":"PS Chandni Bagh Panipat"},
  {"id":"staff-cb-qnb705","name":"ANIL KUMAR","rank":"SPO","category":"GENERAL","pno":"QNB705","beltNumber":"236/SPO","mobile":"-","assignedDuty":"General Duty","shift":"Day Shift (08:00 - 20:00)","postingDate":"2026-11-26","status":"ON_DUTY","stationName":"PS Chandni Bagh Panipat"},
  {"id":"staff-cb-9e5jg0","name":"ARUN KUMAR","rank":"Constable","category":"GENERAL","pno":"9E5JG0","beltNumber":"1837","mobile":"-","assignedDuty":"General Duty","shift":"Day Shift (08:00 - 20:00)","postingDate":"2026-11-26","status":"ON_DUTY","stationName":"PS Chandni Bagh Panipat"},
  {"id":"staff-cb-hg0728","name":"AZAD","rank":"HGH","category":"GENERAL","pno":"HG0728","beltNumber":"728/HGH","mobile":"-","assignedDuty":"General Duty","shift":"Day Shift (08:00 - 20:00)","postingDate":"2026-11-26","status":"ON_DUTY","stationName":"PS Chandni Bagh Panipat"},
  {"id":"staff-cb-hg2197","name":"BALRAJ","rank":"HGH","category":"GENERAL","pno":"HG2197","beltNumber":"2197/HGH","mobile":"-","assignedDuty":"General Duty","shift":"Day Shift (08:00 - 20:00)","postingDate":"2026-11-26","status":"ON_DUTY","stationName":"PS Chandni Bagh Panipat"},
  {"id":"staff-cb-spo155","name":"BALWAN","rank":"SPO","category":"ERV","pno":"SPO155","beltNumber":"155/SPO","mobile":"-","assignedDuty":"ERV 538","shift":"Day Shift (08:00 - 20:00)","postingDate":"2026-11-26","status":"ON_DUTY","stationName":"PS Chandni Bagh Panipat"},
  {"id":"staff-cb-wnaxg3","name":"BALWAN SINGH","rank":"SPO","category":"GENERAL","pno":"WNAXG3","beltNumber":"155/SPO","mobile":"-","assignedDuty":"General Duty","shift":"Day Shift (08:00 - 20:00)","postingDate":"2026-11-26","status":"ON_DUTY","stationName":"PS Chandni Bagh Panipat"},
  {"id":"staff-cb-3g3gaf","name":"BALWAN SINGH","rank":"Sub-Inspector","category":"EO_IO","pno":"3G3GAF","beltNumber":"1141","mobile":"-","assignedDuty":"IO","shift":"Day Shift (08:00 - 20:00)","postingDate":"2026-11-26","status":"ON_DUTY","stationName":"PS Chandni Bagh Panipat"},
  {"id":"staff-cb-2e4lqn","name":"BIJENDER","rank":"E/ASI","category":"ERV","pno":"2E4LQN","beltNumber":"1066","mobile":"-","assignedDuty":"ERV 537 Night","shift":"Day Shift (08:00 - 20:00)","postingDate":"2026-11-26","status":"ON_DUTY","stationName":"PS Chandni Bagh Panipat"},
  {"id":"staff-cb-spo004","name":"BIJENDER","rank":"SPO","category":"ERV","pno":"SPO004","beltNumber":"4/SPO","mobile":"-","assignedDuty":"ERV 537","shift":"Day Shift (08:00 - 20:00)","postingDate":"2026-11-26","status":"ON_DUTY","stationName":"PS Chandni Bagh Panipat"},
  {"id":"staff-cb-viabjs","name":"BIJENDER KUMAR","rank":"SPO","category":"GENERAL","pno":"VIABJS","beltNumber":"4/SPO","mobile":"-","assignedDuty":"General Duty","shift":"Day Shift (08:00 - 20:00)","postingDate":"2026-11-26","status":"ON_DUTY","stationName":"PS Chandni Bagh Panipat"},
  {"id":"staff-cb-3f4l11","name":"BIJENDER SINGH","rank":"E/ASI","category":"MM","pno":"3F4L11","beltNumber":"958","mobile":"-","assignedDuty":"MM Staff","shift":"Day Shift (08:00 - 20:00)","postingDate":"2026-11-26","status":"ON_DUTY","stationName":"PS Chandni Bagh Panipat"},
  {"id":"staff-cb-3e4lak","name":"CHANDERPAL","rank":"Sub-Inspector","category":"EO_IO","pno":"3E4LAK","beltNumber":"26/PPT","mobile":"-","assignedDuty":"IO","shift":"Day Shift (08:00 - 20:00)","postingDate":"2026-11-26","status":"ON_DUTY","stationName":"PS Chandni Bagh Panipat"},
  {"id":"staff-cb-1fbkyr","name":"DEEPAK","rank":"Constable","category":"GENERAL","pno":"1FBKYR","beltNumber":"1566","mobile":"-","assignedDuty":"General Duty","shift":"Day Shift (08:00 - 20:00)","postingDate":"2026-11-26","status":"ON_DUTY","stationName":"PS Chandni Bagh Panipat"},
  {"id":"staff-cb-ct1566","name":"DEEPAK","rank":"Constable","category":"RIDER","pno":"CT1566","beltNumber":"1566/PPT","mobile":"-","assignedDuty":"Rider 135 Day","shift":"Day Shift (08:00 - 20:00)","postingDate":"2026-11-26","status":"ON_DUTY","stationName":"PS Chandni Bagh Panipat"},
  {"id":"staff-cb-spo071","name":"DEEPAK KUMAR","rank":"SPO","category":"ERV","pno":"SPO071","beltNumber":"71/SPO","mobile":"-","assignedDuty":"ERV 537","shift":"Day Shift (08:00 - 20:00)","postingDate":"2026-11-26","status":"ON_DUTY","stationName":"PS Chandni Bagh Panipat"},
  {"id":"staff-cb-3ral0t","name":"DEEPAK KUMAR","rank":"SPO","category":"GENERAL","pno":"3RAL0T","beltNumber":"71/SPO","mobile":"-","assignedDuty":"General Duty","shift":"Day Shift (08:00 - 20:00)","postingDate":"2026-11-26","status":"ON_DUTY","stationName":"PS Chandni Bagh Panipat"},
  {"id":"staff-cb-spo112","name":"DEVENDER","rank":"SPO","category":"GENERAL","pno":"SPO112","beltNumber":"112/SPO","mobile":"-","assignedDuty":"General Duty","shift":"Day Shift (08:00 - 20:00)","postingDate":"2026-11-26","status":"ON_DUTY","stationName":"PS Chandni Bagh Panipat"},
  {"id":"staff-cb-1balbr","name":"DEVINDER SINGH","rank":"SPO","category":"GENERAL","pno":"1BALBR","beltNumber":"112/SPO","mobile":"-","assignedDuty":"General Duty","shift":"Day Shift (08:00 - 20:00)","postingDate":"2026-11-26","status":"ON_DUTY","stationName":"PS Chandni Bagh Panipat"},
  {"id":"staff-cb-2e4lop","name":"DHARAMPAL","rank":"E/ASI","category":"ERV","pno":"2E4LOP","beltNumber":"855","mobile":"-","assignedDuty":"ERV 537 Day","shift":"Day Shift (08:00 - 20:00)","postingDate":"2026-11-26","status":"ON_DUTY","stationName":"PS Chandni Bagh Panipat"},
  {"id":"staff-cb-3f4li2","name":"DILBAG SINGH","rank":"Sub-Inspector","category":"EO_IO","pno":"3F4LI2","beltNumber":"80/PPT","mobile":"-","assignedDuty":"IO","shift":"Day Shift (08:00 - 20:00)","postingDate":"2026-11-26","status":"ON_DUTY","stationName":"PS Chandni Bagh Panipat"},
  {"id":"staff-cb-ad9q2l","name":"HARI OM","rank":"Head Constable","category":"EO_IO","pno":"AD9Q2L","beltNumber":"929","mobile":"-","assignedDuty":"IO","shift":"Day Shift (08:00 - 20:00)","postingDate":"2026-11-26","status":"ON_DUTY","stationName":"PS Chandni Bagh Panipat"},
  {"id":"staff-cb-1b4l1y","name":"HAWA SINGH","rank":"Sub-Inspector","category":"EO_IO","pno":"1B4L1Y","beltNumber":"14/PPT","mobile":"-","assignedDuty":"IO","shift":"Day Shift (08:00 - 20:00)","postingDate":"2026-11-26","status":"ON_DUTY","stationName":"PS Chandni Bagh Panipat"},
  {"id":"staff-cb-oh9g0f","name":"IMRAN KHAN","rank":"E/HC","category":"ERV","pno":"OH9G0F","beltNumber":"1886","mobile":"-","assignedDuty":"ERV 538 Day","shift":"Day Shift (08:00 - 20:00)","postingDate":"2026-11-26","status":"ON_DUTY","stationName":"PS Chandni Bagh Panipat"},
  {"id":"staff-cb-kfakx1","name":"JAGMANDER","rank":"Constable","category":"MHC","pno":"KFAKX1","beltNumber":"1388","mobile":"-","assignedDuty":"MHC Staff","shift":"Day Shift (08:00 - 20:00)","postingDate":"2026-11-26","status":"ON_DUTY","stationName":"PS Chandni Bagh Panipat"},
  {"id":"staff-cb-1e4lcb","name":"KAMAL SINGH","rank":"E/SI","category":"ERV","pno":"1E4LCB","beltNumber":"186","mobile":"-","assignedDuty":"ERV 538 Day","shift":"Day Shift (08:00 - 20:00)","postingDate":"2026-11-26","status":"ON_DUTY","stationName":"PS Chandni Bagh Panipat"},
  {"id":"staff-cb-8d5g0l","name":"KAMLESH","rank":"Inspector","category":"EO_IO","pno":"8D5G0L","beltNumber":"135/SPT","mobile":"-","assignedDuty":"IO","shift":"Day Shift (08:00 - 20:00)","postingDate":"2026-11-26","status":"ON_DUTY","stationName":"PS Chandni Bagh Panipat"},
  {"id":"staff-cb-3c4l05","name":"KIRAN DEEP","rank":"Head Constable","category":"GENERAL","pno":"3C4L05","beltNumber":"143","mobile":"-","assignedDuty":"General Duty","shift":"Day Shift (08:00 - 20:00)","postingDate":"2026-11-26","status":"ON_DUTY","stationName":"PS Chandni Bagh Panipat"},
  {"id":"staff-cb-si137kirpal","name":"KIRPAL","rank":"Sub-Inspector","category":"EO_IO","pno":"SI137KIRPAL","beltNumber":"137","mobile":"-","assignedDuty":"IO","shift":"Day Shift (08:00 - 20:00)","postingDate":"2026-11-26","status":"ON_DUTY","stationName":"PS Chandni Bagh Panipat"},
  {"id":"staff-cb-qmb73c","name":"KRISHAN KUMAR","rank":"SPO","category":"GENERAL","pno":"QMB73C","beltNumber":"245/SPO","mobile":"-","assignedDuty":"General Duty","shift":"Day Shift (08:00 - 20:00)","postingDate":"2026-11-26","status":"ON_DUTY","stationName":"PS Chandni Bagh Panipat"},
  {"id":"staff-cb-spo245","name":"KRISHAN KUMAR","rank":"SPO","category":"ERV","pno":"SPO245","beltNumber":"245/SPO","mobile":"-","assignedDuty":"ERV 538","shift":"Day Shift (08:00 - 20:00)","postingDate":"2026-11-26","status":"ON_DUTY","stationName":"PS Chandni Bagh Panipat"},
  {"id":"staff-cb-hiay5x","name":"KUSUM DEVI","rank":"Constable","category":"GENERAL","pno":"HIAY5X","beltNumber":"1709","mobile":"-","assignedDuty":"General Duty","shift":"Day Shift (08:00 - 20:00)","postingDate":"2026-11-26","status":"ON_DUTY","stationName":"PS Chandni Bagh Panipat"},
  {"id":"staff-cb-3d4l0v","name":"LAKHWINDER","rank":"Assistant Sub-Inspector","category":"EO_IO","pno":"3D4L0V","beltNumber":"1606/PPT","mobile":"-","assignedDuty":"IO","shift":"Day Shift (08:00 - 20:00)","postingDate":"2026-11-26","status":"ON_DUTY","stationName":"PS Chandni Bagh Panipat"},
  {"id":"staff-cb-eaaym0","name":"MAHIPAL","rank":"Sub-Inspector","category":"EO_IO","pno":"EAAYM0","beltNumber":"23-07-1997","mobile":"-","assignedDuty":"IO","shift":"Day Shift (08:00 - 20:00)","postingDate":"2026-11-26","status":"ON_DUTY","stationName":"PS Chandni Bagh Panipat"},
  {"id":"staff-cb-6eak5q","name":"MANDEEP","rank":"Constable","category":"MHC","pno":"6EAK5Q","beltNumber":"1395","mobile":"-","assignedDuty":"Computer Operator","shift":"Day Shift (08:00 - 20:00)","postingDate":"2026-11-26","status":"ON_DUTY","stationName":"PS Chandni Bagh Panipat"},
  {"id":"staff-cb-paae9m","name":"MANISHA","rank":"Constable","category":"GENERAL","pno":"PAAE9M","beltNumber":"1554","mobile":"-","assignedDuty":"General Duty","shift":"Day Shift (08:00 - 20:00)","postingDate":"2026-11-26","status":"ON_DUTY","stationName":"PS Chandni Bagh Panipat"},
  {"id":"staff-cb-sbprgj","name":"MOHIT","rank":"Constable","category":"GENERAL","pno":"SBPRGJ","beltNumber":"604","mobile":"-","assignedDuty":"General Duty","shift":"Day Shift (08:00 - 20:00)","postingDate":"2026-11-26","status":"ON_DUTY","stationName":"PS Chandni Bagh Panipat"},
  {"id":"staff-cb-5h1qgp","name":"MOHKAM SINGH","rank":"Sub-Inspector","category":"EO_IO","pno":"5H1QGP","beltNumber":"1851/SPT","mobile":"-","assignedDuty":"IO","shift":"Day Shift (08:00 - 20:00)","postingDate":"2026-11-26","status":"ON_DUTY","stationName":"PS Chandni Bagh Panipat"},
  {"id":"staff-cb-hg2144","name":"MUKESH","rank":"HGH","category":"RIDER","pno":"HG2144","beltNumber":"2144/HGH","mobile":"-","assignedDuty":"Rider 135 Day","shift":"Day Shift (08:00 - 20:00)","postingDate":"2026-11-26","status":"ON_DUTY","stationName":"PS Chandni Bagh Panipat"},
  {"id":"staff-cb-spo308","name":"NARESH","rank":"SPO","category":"GENERAL","pno":"SPO308","beltNumber":"308/SPO","mobile":"-","assignedDuty":"General Duty","shift":"Day Shift (08:00 - 20:00)","postingDate":"2026-11-26","status":"ON_DUTY","stationName":"PS Chandni Bagh Panipat"},
  {"id":"staff-cb-ccbkag","name":"NITIN","rank":"Constable","category":"RIDER","pno":"CCBKAG","beltNumber":"1743","mobile":"-","assignedDuty":"Rider 170 Night","shift":"Day Shift (08:00 - 20:00)","postingDate":"2026-11-26","status":"ON_DUTY","stationName":"PS Chandni Bagh Panipat"},
  {"id":"staff-cb-hg2105","name":"OMPAL","rank":"HGH","category":"GENERAL","pno":"HG2105","beltNumber":"2105/HGH","mobile":"-","assignedDuty":"General Duty","shift":"Day Shift (08:00 - 20:00)","postingDate":"2026-11-26","status":"ON_DUTY","stationName":"PS Chandni Bagh Panipat"},
  {"id":"staff-cb-132005","name":"PARVEEN","rank":"Driver","category":"ERV","pno":"132005","beltNumber":"-","mobile":"-","assignedDuty":"ERV 537","shift":"Day Shift (08:00 - 20:00)","postingDate":"2026-11-26","status":"ON_DUTY","stationName":"PS Chandni Bagh Panipat"},
  {"id":"staff-cb-spo166","name":"PAWAN","rank":"SPO","category":"GENERAL","pno":"SPO166","beltNumber":"166/SPO","mobile":"-","assignedDuty":"General Duty","shift":"Day Shift (08:00 - 20:00)","postingDate":"2026-11-26","status":"ON_DUTY","stationName":"PS Chandni Bagh Panipat"},
  {"id":"staff-cb-cb9q5r","name":"PAWAN KUMAR","rank":"Head Constable","category":"EO_IO","pno":"CB9Q5R","beltNumber":"928","mobile":"-","assignedDuty":"IO","shift":"Day Shift (08:00 - 20:00)","postingDate":"2026-11-26","status":"ON_DUTY","stationName":"PS Chandni Bagh Panipat"},
  {"id":"staff-cb-tlaxan","name":"PAWAN KUMAR","rank":"SPO","category":"GENERAL","pno":"TLAXAN","beltNumber":"166/SPO","mobile":"-","assignedDuty":"General Duty","shift":"Day Shift (08:00 - 20:00)","postingDate":"2026-11-26","status":"ON_DUTY","stationName":"PS Chandni Bagh Panipat"},
  {"id":"staff-cb-hhbhgl","name":"RAHUL","rank":"Sub-Inspector","category":"EO_IO","pno":"HHBHGL","beltNumber":"15-08-1992","mobile":"-","assignedDuty":"IO","shift":"Day Shift (08:00 - 20:00)","postingDate":"2026-11-26","status":"ON_DUTY","stationName":"PS Chandni Bagh Panipat"},
  {"id":"staff-cb-hg2031","name":"RAJBEER","rank":"HGH","category":"RIDER","pno":"HG2031","beltNumber":"2031/HGH","mobile":"-","assignedDuty":"Rider 135 Day","shift":"Day Shift (08:00 - 20:00)","postingDate":"2026-11-26","status":"ON_DUTY","stationName":"PS Chandni Bagh Panipat"},
  {"id":"staff-cb-hg0633","name":"RAJU","rank":"HGH","category":"RIDER","pno":"HG0633","beltNumber":"633/HGH","mobile":"-","assignedDuty":"Rider 170 Day","shift":"Day Shift (08:00 - 20:00)","postingDate":"2026-11-26","status":"ON_DUTY","stationName":"PS Chandni Bagh Panipat"},
  {"id":"staff-cb-4g2b21","name":"RAKESH KUMAR","rank":"Assistant Sub-Inspector","category":"EO_IO","pno":"4G2B21","beltNumber":"250/PPT","mobile":"-","assignedDuty":"IO","shift":"Day Shift (08:00 - 20:00)","postingDate":"2026-11-26","status":"ON_DUTY","stationName":"PS Chandni Bagh Panipat"},
  {"id":"staff-cb-1c4l43","name":"RAM KISHAN","rank":"E/SI","category":"GENERAL","pno":"1C4L43","beltNumber":"329","mobile":"-","assignedDuty":"General Duty","shift":"Day Shift (08:00 - 20:00)","postingDate":"2026-11-26","status":"ON_DUTY","stationName":"PS Chandni Bagh Panipat"},
  {"id":"staff-cb-hg2033","name":"RANJIT","rank":"HGH","category":"GENERAL","pno":"HG2033","beltNumber":"2033/HGH","mobile":"-","assignedDuty":"General Duty","shift":"Day Shift (08:00 - 20:00)","postingDate":"2026-11-26","status":"ON_DUTY","stationName":"PS Chandni Bagh Panipat"},
  {"id":"staff-cb-2c4lx0","name":"RAVINDER SINGH","rank":"Sub-Inspector","category":"EO_IO","pno":"2C4LX0","beltNumber":"195/PPT","mobile":"-","assignedDuty":"IO","shift":"Day Shift (08:00 - 20:00)","postingDate":"2026-11-26","status":"ON_DUTY","stationName":"PS Chandni Bagh Panipat"},
  {"id":"staff-cb-5i4lhg","name":"REKHA","rank":"Inspector","category":"SHO","pno":"5I4LHG","beltNumber":"-","mobile":"-","assignedDuty":"SHO","shift":"Round the Clock (24x7)","postingDate":"2026-11-26","status":"ON_DUTY","stationName":"PS Chandni Bagh Panipat"},
  {"id":"staff-cb-ca9x71","name":"ROHIT","rank":"Head Constable","category":"EO_IO","pno":"CA9X71","beltNumber":"773","mobile":"-","assignedDuty":"IO","shift":"Day Shift (08:00 - 20:00)","postingDate":"2026-11-26","status":"ON_DUTY","stationName":"PS Chandni Bagh Panipat"},
  {"id":"staff-cb-3f4l6e","name":"SATENDER SINGH","rank":"E/ASI","category":"EO_IO","pno":"3F4L6E","beltNumber":"59","mobile":"-","assignedDuty":"IO","shift":"Day Shift (08:00 - 20:00)","postingDate":"2026-11-26","status":"ON_DUTY","stationName":"PS Chandni Bagh Panipat"},
  {"id":"staff-cb-hg2040","name":"SATISH","rank":"HGH","category":"GENERAL","pno":"HG2040","beltNumber":"2040/HGH","mobile":"-","assignedDuty":"General Duty","shift":"Day Shift (08:00 - 20:00)","postingDate":"2026-11-26","status":"ON_DUTY","stationName":"PS Chandni Bagh Panipat"},
  {"id":"staff-cb-133376","name":"SATISH GIRI","rank":"Driver","category":"ERV","pno":"133376","beltNumber":"-","mobile":"-","assignedDuty":"ERV 537","shift":"Day Shift (08:00 - 20:00)","postingDate":"2026-11-26","status":"ON_DUTY","stationName":"PS Chandni Bagh Panipat"},
  {"id":"staff-cb-si564h","name":"SATPAL SINGH","rank":"Sub-Inspector","category":"EO_IO","pno":"SI564H","beltNumber":"564/H","mobile":"-","assignedDuty":"IO","shift":"Day Shift (08:00 - 20:00)","postingDate":"2026-11-26","status":"ON_DUTY","stationName":"PS Chandni Bagh Panipat"},
  {"id":"staff-cb-5i4lc3","name":"SATPAL SINGH","rank":"Sub-Inspector","category":"EO_IO","pno":"5I4LC3","beltNumber":"471/PPT","mobile":"-","assignedDuty":"IO","shift":"Day Shift (08:00 - 20:00)","postingDate":"2026-11-26","status":"ON_DUTY","stationName":"PS Chandni Bagh Panipat"},
  {"id":"staff-cb-spo229","name":"SATYAWAN","rank":"SPO","category":"GENERAL","pno":"SPO229","beltNumber":"229/SPO","mobile":"-","assignedDuty":"General Duty","shift":"Day Shift (08:00 - 20:00)","postingDate":"2026-11-26","status":"ON_DUTY","stationName":"PS Chandni Bagh Panipat"},
  {"id":"staff-cb-hg2133","name":"SATYAWAN","rank":"HGH","category":"GENERAL","pno":"HG2133","beltNumber":"2133/HGH","mobile":"-","assignedDuty":"General Duty","shift":"Day Shift (08:00 - 20:00)","postingDate":"2026-11-26","status":"ON_DUTY","stationName":"PS Chandni Bagh Panipat"},
  {"id":"staff-cb-df3glm","name":"SENU RANI","rank":"Assistant Sub-Inspector","category":"EO_IO","pno":"DF3GLM","beltNumber":"395/PPT","mobile":"-","assignedDuty":"IO","shift":"Day Shift (08:00 - 20:00)","postingDate":"2026-11-26","status":"ON_DUTY","stationName":"PS Chandni Bagh Panipat"},
  {"id":"staff-cb-3a4l4c","name":"SILAK RAM","rank":"E/ASI","category":"GENERAL","pno":"3A4L4C","beltNumber":"1157","mobile":"-","assignedDuty":"General Duty","shift":"Day Shift (08:00 - 20:00)","postingDate":"2026-11-26","status":"ON_DUTY","stationName":"PS Chandni Bagh Panipat"},
  {"id":"staff-cb-deayj9","name":"SUMIT","rank":"Constable","category":"MHC","pno":"DEAYJ9","beltNumber":"1233","mobile":"-","assignedDuty":"Computer Operator","shift":"Day Shift (08:00 - 20:00)","postingDate":"2026-11-26","status":"ON_DUTY","stationName":"PS Chandni Bagh Panipat"},
  {"id":"staff-cb-0fa7al","name":"SUMIT","rank":"Constable","category":"MHC","pno":"0FA7AL","beltNumber":"1014","mobile":"-","assignedDuty":"MHC Staff","shift":"Day Shift (08:00 - 20:00)","postingDate":"2026-11-26","status":"ON_DUTY","stationName":"PS Chandni Bagh Panipat"},
  {"id":"staff-cb-132003","name":"SUMIT KUMAR","rank":"Driver","category":"ERV","pno":"132003","beltNumber":"-","mobile":"-","assignedDuty":"ERV 538","shift":"Day Shift (08:00 - 20:00)","postingDate":"2026-11-26","status":"ON_DUTY","stationName":"PS Chandni Bagh Panipat"},
  {"id":"staff-cb-hg2019","name":"SUNIL","rank":"HGH","category":"GENERAL","pno":"HG2019","beltNumber":"2019/HGH","mobile":"-","assignedDuty":"General Duty","shift":"Day Shift (08:00 - 20:00)","postingDate":"2026-11-26","status":"ON_DUTY","stationName":"PS Chandni Bagh Panipat"},
  {"id":"staff-cb-spo122","name":"SUNIL","rank":"SPO","category":"GENERAL","pno":"SPO122","beltNumber":"122/SPO","mobile":"-","assignedDuty":"General Duty","shift":"Day Shift (08:00 - 20:00)","postingDate":"2026-11-26","status":"ON_DUTY","stationName":"PS Chandni Bagh Panipat"},
  {"id":"staff-cb-spo007","name":"SUNIL KUMAR","rank":"SPO","category":"GENERAL","pno":"SPO007","beltNumber":"7/SPO","mobile":"-","assignedDuty":"General Duty","shift":"Day Shift (08:00 - 20:00)","postingDate":"2026-11-26","status":"ON_DUTY","stationName":"PS Chandni Bagh Panipat"},
  {"id":"staff-cb-4g2biu","name":"SUNIL KUMAR","rank":"Head Constable","category":"EO_IO","pno":"4G2BIU","beltNumber":"1529","mobile":"-","assignedDuty":"IO","shift":"Day Shift (08:00 - 20:00)","postingDate":"2026-11-26","status":"ON_DUTY","stationName":"PS Chandni Bagh Panipat"},
  {"id":"staff-cb-qrbxch","name":"SUNIL KUMAR","rank":"SPO","category":"GENERAL","pno":"QRBXCH","beltNumber":"7/SPO","mobile":"-","assignedDuty":"General Duty","shift":"Day Shift (08:00 - 20:00)","postingDate":"2026-11-26","status":"ON_DUTY","stationName":"PS Chandni Bagh Panipat"},
  {"id":"staff-cb-hg0720","name":"SURAJ BHAN","rank":"HGH","category":"RIDER","pno":"HG0720","beltNumber":"720/HGH","mobile":"-","assignedDuty":"Rider 170 Day","shift":"Day Shift (08:00 - 20:00)","postingDate":"2026-11-26","status":"ON_DUTY","stationName":"PS Chandni Bagh Panipat"},
  {"id":"staff-cb-hg2151","name":"SURENDER","rank":"HGH","category":"RIDER","pno":"HG2151","beltNumber":"2151/HGH","mobile":"-","assignedDuty":"Rider 135 Day","shift":"Day Shift (08:00 - 20:00)","postingDate":"2026-11-26","status":"ON_DUTY","stationName":"PS Chandni Bagh Panipat"},
  {"id":"staff-cb-6d9wc9","name":"SURENDER","rank":"E/HC","category":"ERV","pno":"6D9WC9","beltNumber":"769","mobile":"-","assignedDuty":"ERV 538 Day","shift":"Day Shift (08:00 - 20:00)","postingDate":"2026-11-26","status":"ON_DUTY","stationName":"PS Chandni Bagh Panipat"},
  {"id":"staff-cb-0hbkbv","name":"SUSHIL MOR","rank":"Constable","category":"GENERAL","pno":"0HBKBV","beltNumber":"1453","mobile":"-","assignedDuty":"General Duty","shift":"Day Shift (08:00 - 20:00)","postingDate":"2026-11-26","status":"ON_DUTY","stationName":"PS Chandni Bagh Panipat"},
  {"id":"staff-cb-1h4l56","name":"TRILOCK","rank":"E/SI","category":"GENERAL","pno":"1H4L56","beltNumber":"459","mobile":"-","assignedDuty":"General Duty","shift":"Day Shift (08:00 - 20:00)","postingDate":"2026-11-26","status":"ON_DUTY","stationName":"PS Chandni Bagh Panipat"},
  {"id":"staff-cb-maaxqp","name":"USHA KUMARI","rank":"Constable","category":"GENERAL","pno":"MAAXQP","beltNumber":"1722","mobile":"-","assignedDuty":"General Duty","shift":"Day Shift (08:00 - 20:00)","postingDate":"2026-11-26","status":"ON_DUTY","stationName":"PS Chandni Bagh Panipat"},
  {"id":"staff-cb-wbpk1s","name":"VIKASH","rank":"Constable","category":"GENERAL","pno":"WBPK1S","beltNumber":"1479","mobile":"-","assignedDuty":"General Duty","shift":"Day Shift (08:00 - 20:00)","postingDate":"2026-11-26","status":"ON_DUTY","stationName":"PS Chandni Bagh Panipat"},
  {"id":"staff-cb-hg2042","name":"VINOD","rank":"HGH","category":"GENERAL","pno":"HG2042","beltNumber":"2042/HGH","mobile":"-","assignedDuty":"General Duty","shift":"Day Shift (08:00 - 20:00)","postingDate":"2026-11-26","status":"ON_DUTY","stationName":"PS Chandni Bagh Panipat"},
  {"id":"staff-cb-5c16f6","name":"WAZIR KUMAR","rank":"Head Constable","category":"EO_IO","pno":"5C16F6","beltNumber":"197","mobile":"-","assignedDuty":"IO","shift":"Day Shift (08:00 - 20:00)","postingDate":"2026-11-26","status":"ON_DUTY","stationName":"PS Chandni Bagh Panipat"},
  {"id":"staff-cb-hg0559","name":"YOGESH","rank":"HGH","category":"GENERAL","pno":"HG0559","beltNumber":"559/HGH","mobile":"-","assignedDuty":"General Duty","shift":"Day Shift (08:00 - 20:00)","postingDate":"2026-11-26","status":"ON_DUTY","stationName":"PS Chandni Bagh Panipat"},
];

function stationKey(value:string){return value.toLowerCase().replace(/^(police station|ps)\s*/,'').trim();}
const EXEMPTEE_RANKS_APPLIED_KEY = `${STORAGE_KEY}:chandni-bagh-exemptee-ranks-2026-11-26`;
const IMPORTED_ROSTERS_KEY = `${STORAGE_KEY}:imported-rosters`;
const chandniBaghStationKey = stationKey("PS Chandni Bagh Panipat");
const chandniBaghExempteeRanks = new Map(
  DEFAULT_STATION_STAFF
    .filter(member => stationKey(member.stationName) === chandniBaghStationKey && member.rank.startsWith("E/"))
    .map(member => [member.pno.toUpperCase(), member.rank])
);

function canManage(actor?:UserSession,station?:string){return !!actor && (actor.role === 'SUPER_ADMIN' || ['SHO','SP_DISTRICT','DSP_SUBDIV'].includes(actor.role) && !!station && stationKey(actor.stationName)===stationKey(station));}
export const stationStaffService = {
  getStaffForStation(station:string):StationStaffMember[]{return this.getStaffMembers().filter(s=>stationKey(s.stationName)===stationKey(station));},
  loadImportedRoster(station: string, members: StationStaffMember[]): StationStaffMember[] {
    const roster = this.getStaffMembers();
    const key = stationKey(station);
    const imported: string[] = JSON.parse(localStorage.getItem(IMPORTED_ROSTERS_KEY) || "[]");
    if (members.length && !imported.includes(key)) {
      const existing = new Set(roster.filter(member => stationKey(member.stationName) === key)
        .map(member => member.pno.trim().toUpperCase()));
      roster.push(...members.filter(member => stationKey(member.stationName) === key && !existing.has(member.pno.trim().toUpperCase())));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(roster));
      localStorage.setItem(IMPORTED_ROSTERS_KEY, JSON.stringify([...imported, key]));
    }
    return roster.filter(member => stationKey(member.stationName) === key);
  },
  getStaffMembers: (): StationStaffMember[] => {
    if (typeof window === "undefined") {
      return DEFAULT_STATION_STAFF;
    }
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_STATION_STAFF));
        localStorage.setItem(EXEMPTEE_RANKS_APPLIED_KEY, "1");
        return DEFAULT_STATION_STAFF;
      }
      const roster: StationStaffMember[] = JSON.parse(stored);
      const applyExempteeRanks = !localStorage.getItem(EXEMPTEE_RANKS_APPLIED_KEY);
      const updatedRoster = roster.map(member => {
        const rank = applyExempteeRanks && stationKey(member.stationName) === chandniBaghStationKey
          ? chandniBaghExempteeRanks.get(member.pno.trim().toUpperCase())
          : undefined;
        return rank && rank !== member.rank ? { ...member, rank } : member;
      });
      if (applyExempteeRanks) {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedRoster));
          localStorage.setItem(EXEMPTEE_RANKS_APPLIED_KEY, "1");
        } catch {
          // The updated ranks are still available for this view if storage is full.
        }
      }
      return updatedRoster.map(member => member.category === "MHC" && member.assignedDuty?.trim().toLowerCase() === "mm staff"
        ? { ...member, category: "MM" }
        : member);
    } catch {
      return DEFAULT_STATION_STAFF;
    }
  },

  getStaffByCategory: (category: StaffRoleCategory | "ALL"): StationStaffMember[] => {
    const list = stationStaffService.getStaffMembers();
    if (category === "ALL") return list;
    return list.filter((item) => item.category === category);
  },

  saveStaffMember: (member: Omit<StationStaffMember, "id"> & { id?: string }, actor?:UserSession): StationStaffMember => {
    if(!canManage(actor,member.stationName))throw new Error("Only an authorized station supervisor may edit the roster.");
    const all = stationStaffService.getStaffMembers();
    if(member.id && !canManage(actor,all.find(s=>s.id===member.id)?.stationName))throw new Error("Staff member belongs to another station.");
    if(all.some(s=>s.id!==member.id && s.pno.trim().toLowerCase()===member.pno.trim().toLowerCase()))throw new Error("This PNO already exists in the roster.");
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

  deleteStaffMember: (id: string,actor?:UserSession): boolean => {
    const all = stationStaffService.getStaffMembers();
    if(!canManage(actor,all.find(s=>s.id===id)?.stationName))throw new Error("Only an authorized station supervisor may remove this staff member.");
    const updated = all.filter((item) => item.id !== id);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
    return true;
  },

  resetToDefault: (actor?:UserSession): StationStaffMember[] => {
    if(!actor || actor.role !== "SUPER_ADMIN")throw new Error("Only Super Admin may reset the station roster.");
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_STATION_STAFF));
      localStorage.removeItem(IMPORTED_ROSTERS_KEY);
    }
    return DEFAULT_STATION_STAFF;
  },
};
