import { RegistrationEntry, RegistrationType, RegistrationStatus } from "@/types/registrations";

const STORAGE_KEY = "cms_registrations_data";

const SAMPLE_MALE_PHOTO = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='140' viewBox='0 0 120 140'><rect width='100%' height='100%' fill='%23e2e8f0'/><circle cx='60' cy='50' r='28' fill='%2394a3b8'/><path d='M20 125 C20 90, 40 85, 60 85 C80 85, 100 90, 100 125 Z' fill='%2394a3b8'/><text x='60' y='135' font-size='9' text-anchor='middle' fill='%2364748b' font-family='sans-serif'>UIDB FRONT</text></svg>";

const SAMPLE_FEMALE_PHOTO = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='140' viewBox='0 0 120 140'><rect width='100%' height='100%' fill='%23f1f5f9'/><circle cx='60' cy='50' r='26' fill='%23cbd5e1'/><path d='M25 125 C25 92, 42 86, 60 86 C78 86, 95 92, 95 125 Z' fill='%23cbd5e1'/><text x='60' y='135' font-size='9' text-anchor='middle' fill='%2364748b' font-family='sans-serif'>UIDB PHOTO</text></svg>";

const INITIAL_RECORDS: RegistrationEntry[] = [
  // UIDB / UD Initial Record
  {
    id: "reg_uidb_001",
    type: "UIDB",
    regNumber: "UIDB-2026/01",
    date: "2026-10-14",
    time: "08:30",
    stationName: "Thanesar City",
    district: "Kurukshetra",
    status: "OPEN",
    gender: "Male",
    approxAge: "35-40 Years",
    foundLocation: "Near Narwana Branch Canal, Sector 7",
    identifyingMarks: "Om tattoo on right forearm, scar on left eyebrow",
    clothingDetails: "Dark blue shirt, black denim jeans, brown sports shoes",
    inquestNumber: "UD/174-BNSS/09",
    officerName: "SI Rajesh Kumar",
    officerRank: "Sub Inspector",
    remarks: "Post-mortem conducted at LNJP Civil Hospital. Photos published in local circulars.",
    photoUrl: SAMPLE_MALE_PHOTO,
    createdAt: new Date().toISOString(),
  },
  {
    id: "reg_uidb_002",
    type: "UIDB",
    regNumber: "UIDB-2026/02",
    date: "2026-10-10",
    time: "14:15",
    stationName: "Thanesar City",
    district: "Kurukshetra",
    status: "TRACED",
    gender: "Female",
    approxAge: "60-65 Years",
    foundLocation: "Old Bus Stand Waiting Hall",
    identifyingMarks: "Silver bangle in right hand",
    clothingDetails: "Red printed suit and white dupatta",
    inquestNumber: "UD/174-BNSS/07",
    officerName: "ASI Sandeep Singh",
    officerRank: "Assistant Sub Inspector",
    remarks: "Identified by family members from Shahabad. Handed over after formal inquest.",
    photoUrl: SAMPLE_FEMALE_PHOTO,
    createdAt: new Date().toISOString(),
  },

  // Missing Person Initial Records
  {
    id: "mp_rec_2019_0002",
    type: "MISSING_PERSON",
    regNumber: "0002/2019",
    date: "2019-04-19",
    time: "11:00",
    stationName: "PANCHKULA SECTOR-5",
    district: "PANCHKULA",
    status: "OPEN",
    personName: "Monu Kumar",
    fatherOrHusbandName: "Shyam",
    gender: "Male",
    approxAge: "28 Years",
    missingFrom: "Panchkula bus stand",
    contactPerson: "RAVI Kumar (Father)",
    contactNumber: "+91 9812033441",
    address: "pkl, PANCHKULA",
    identifyingMarks: "Mole on right cheek, small burn scar on left forearm",
    clothingDetails: "Blue checked shirt, dark jeans, white sneakers",
    officerName: "ASI Sandeep Singh - 49102",
    officerRank: "Assistant Sub Inspector",
    remarks: "WT message flashed to all police stations in Haryana and Chandigarh. Missing person poster dispatched to public bus stands.",
    photoUrl: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='140' viewBox='0 0 120 140'><rect width='100%' height='100%' fill='%23e0f2fe'/><circle cx='60' cy='50' r='28' fill='%230284c7'/><path d='M20 125 C20 90, 40 85, 60 85 C80 85, 100 90, 100 125 Z' fill='%230284c7'/><text x='60' y='135' font-size='9' text-anchor='middle' fill='%230369a1' font-family='sans-serif'>PHOTO: MONU</text></svg>",
    createdAt: "2019-04-19T15:19:00.000Z",
  },
  {
    id: "reg_mp_001",
    type: "MISSING_PERSON",
    regNumber: "MP-2026/04",
    date: "2026-10-15",
    time: "11:20",
    stationName: "Thanesar City",
    district: "Kurukshetra",
    status: "OPEN",
    personName: "Amit Sharma",
    fatherOrHusbandName: "Sh. Ramesh Sharma",
    gender: "Male",
    approxAge: "22 Years",
    missingFrom: "Near Railway Station Market, Kurukshetra",
    contactPerson: "Ramesh Sharma (Father)",
    contactNumber: "9812034567",
    address: "H.No. 412, Mohan Nagar, Kurukshetra",
    identifyingMarks: "Mole on right cheek",
    clothingDetails: "White round neck t-shirt, blue jeans",
    officerName: "SI Rajesh Kumar",
    officerRank: "Sub Inspector",
    remarks: "Left home for college and did not return. WT message flashed across district.",
    createdAt: new Date().toISOString(),
  },
  {
    id: "reg_mp_002",
    type: "MISSING_PERSON",
    regNumber: "MP-2026/03",
    date: "2026-10-08",
    time: "19:00",
    stationName: "Thanesar City",
    district: "Kurukshetra",
    status: "TRACED",
    personName: "Pooja Rani",
    fatherOrHusbandName: "Sh. Satpal Singh",
    gender: "Female",
    approxAge: "19 Years",
    missingFrom: "Sector 3 Main Market",
    contactPerson: "Satpal Singh (Father)",
    contactNumber: "9876541230",
    address: "Vill. Umri, Kurukshetra",
    identifyingMarks: "Birthmark on left wrist",
    clothingDetails: "Yellow kurti with white salwar",
    officerName: "W/HC Suman Devi",
    officerRank: "Head Constable",
    remarks: "Safely traced from relative's residence in Karnal. Reunited with family.",
    createdAt: new Date().toISOString(),
  },

  // Missing Cattle Initial Records
  {
    id: "reg_mc_001",
    type: "MISSING_CATTLE",
    regNumber: "MC-2026/02",
    date: "2026-10-13",
    time: "07:45",
    stationName: "Thanesar City",
    district: "Kurukshetra",
    status: "OPEN",
    cattleType: "Buffalo",
    breed: "Murrah Breed",
    color: "Jet Black with small white star on forehead",
    earTagNumber: "HR-KKR-49102",
    ownerName: "Baljeet Singh",
    ownerPhone: "9416078901",
    ownerVillage: "Village Umri, Distt. Kurukshetra",
    approxValue: "₹ 85,000",
    officerName: "HC Surender Pal",
    officerRank: "Head Constable",
    remarks: "Went missing from community pasture ground. Inquiries made in neighbouring gaushalas.",
    createdAt: new Date().toISOString(),
  },
  {
    id: "reg_mc_002",
    type: "MISSING_CATTLE",
    regNumber: "MC-2026/01",
    date: "2026-10-06",
    time: "10:00",
    stationName: "Thanesar City",
    district: "Kurukshetra",
    status: "RESTORED",
    cattleType: "Cow",
    breed: "Haryana Sahiwal Mix",
    color: "Light White / Cream",
    earTagNumber: "HR-KKR-11208",
    ownerName: "Dharamvir",
    ownerPhone: "9896012345",
    ownerVillage: "Village Mirzapur, Kurukshetra",
    approxValue: "₹ 45,000",
    officerName: "ASI Sandeep Singh",
    officerRank: "Assistant Sub Inspector",
    remarks: "Recovered from Pipli Gaushala and restored to rightful owner with receipt.",
    createdAt: new Date().toISOString(),
  },

  // Lost Property Initial Records
  {
    id: "lp_rec_2019_0002",
    type: "LOST_PROPERTY",
    regNumber: "0002/2019",
    date: "2019-04-22",
    time: "11:30",
    stationName: "PANCHKULA SECTOR-5",
    district: "PANCHKULA",
    status: "OPEN",
    propertyType: "MOBILE PHONE",
    brandOrMake: "Samsung",
    identifyingNumber: "IMEI NO.: 864920048192031",
    lostLocation: "Bus stand PKL",
    ownerName: "raju Singh",
    ownerPhone: "+91 9812033441",
    address: "PKL, PANCHKULA",
    approxValue: "₹ 12,000",
    officerName: "Lalit Kumar (I (Inspector))-53175",
    officerRank: "I (Inspector)",
    remarks: "Enquiry entrusted to Inspector Lalit Kumar. CDR/Tower dump verification & CEIR portal blocking initiated.",
    createdAt: "2019-04-22T11:45:00.000Z",
  },
  {
    id: "reg_lp_001",
    type: "LOST_PROPERTY",
    regNumber: "LP-2026/05",
    date: "2026-10-15",
    time: "16:30",
    stationName: "Thanesar City",
    district: "Kurukshetra",
    status: "OPEN",
    propertyType: "Mobile Phone",
    brandOrMake: "Samsung Galaxy S23 (128GB Black)",
    identifyingNumber: "IMEI: 356891104820194",
    lostLocation: "Brahma Sarovar Ghat 4, during evening prayer",
    ownerName: "Vikas Verma",
    ownerPhone: "9812345678",
    address: "Model Town, Panipat",
    approxValue: "₹ 55,000",
    officerName: "C. Amit Kumar",
    officerRank: "Constable",
    remarks: "IMEI placed on CEIR portal tracking. Acknowledgment receipt provided to applicant.",
    createdAt: new Date().toISOString(),
  },
  {
    id: "reg_lp_002",
    type: "LOST_PROPERTY",
    regNumber: "LP-2026/04",
    date: "2026-10-11",
    time: "12:00",
    stationName: "Thanesar City",
    district: "Kurukshetra",
    status: "TRACED",
    propertyType: "Wallet & Documents",
    brandOrMake: "Black Leather Wallet (Wildhorn)",
    identifyingNumber: "Aadhaar Card, Driving License #HR-072018...",
    lostLocation: "Mini Secretariat Parking Area",
    ownerName: "Praveen Sharma",
    ownerPhone: "9991122334",
    address: "Sector 13, Urban Estate, Kurukshetra",
    approxValue: "₹ 3,500 + Critical Cards",
    officerName: "HC Surender Pal",
    officerRank: "Head Constable",
    remarks: "Deposited by honest citizen at station reception. Handed over to verified owner.",
    createdAt: new Date().toISOString(),
  },
];

// Sort helper: Always place newest records (by createdAt or date/time) at the very top
export function sortEntriesNewestFirst(list: RegistrationEntry[]): RegistrationEntry[] {
  return [...list].sort((a, b) => {
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    if (timeA !== timeB) return timeB - timeA;
    const dateTimeA = `${a.date || ""} ${a.time || ""}`;
    const dateTimeB = `${b.date || ""} ${b.time || ""}`;
    return dateTimeB.localeCompare(dateTimeA);
  });
}

// In-memory cache to guarantee instantaneous UI updates and prevent silent loss
let memoryStore: RegistrationEntry[] | null = null;
const IDB_DB_NAME = "haryana_police_cms_registrations_idb";
const IDB_STORE = "records";

function getIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject("IndexedDB unavailable");
      return;
    }
    const req = window.indexedDB.open(IDB_DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function persistToIndexedDB(data: RegistrationEntry[]): Promise<void> {
  try {
    const db = await getIDB();
    const tx = db.transaction(IDB_STORE, "readwrite");
    const store = tx.objectStore(IDB_STORE);
    store.clear();
    for (const item of data) {
      store.put(item);
    }
  } catch (err) {
    // Non-fatal, indexedDB fallback
    console.warn("IndexedDB persist failed:", err);
  }
}

export async function hydrateFromIndexedDB(): Promise<RegistrationEntry[] | null> {
  try {
    const db = await getIDB();
    return new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE, "readonly");
      const store = tx.objectStore(IDB_STORE);
      const req = store.getAll();
      req.onsuccess = () => {
        const list = req.result;
        if (Array.isArray(list) && list.length > 0) {
          resolve(sortEntriesNewestFirst(list));
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

// Prepares entries for localStorage by removing huge duplicated base64 structures
function prepareForLocalStorage(items: RegistrationEntry[]): any[] {
  return items.map((item) => {
    // 1. Remove duplicated photos inside fullUidbData
    let cleanedUidb = item.fullUidbData ? { ...item.fullUidbData } : undefined;
    if (cleanedUidb) {
      if (cleanedUidb.photos && cleanedUidb.photos.length > 0) {
        cleanedUidb.photos = cleanedUidb.photos.map((p: any) => ({
          ...p,
          dataUrl: "", // strip duplicate inside nested form data
        }));
      }
      cleanedUidb.photoUrl = undefined;
    }

    // 2. In item.photos, retain only metadata to avoid duplicate storage if photoUrl exists
    let cleanedPhotos = item.photos;
    if (cleanedPhotos && cleanedPhotos.length > 0) {
      cleanedPhotos = cleanedPhotos.map((p, idx) => ({
        ...p,
        dataUrl: idx === 0 && !item.photoUrl ? p.dataUrl : "",
      }));
    }

    // 3. Compact large base64 photos (>40KB) for localStorage, while IndexedDB keeps full resolution
    let compactPhotoUrl = item.photoUrl;
    if (compactPhotoUrl && compactPhotoUrl.length > 40000) {
      compactPhotoUrl =
        item.gender === "Female" ? SAMPLE_FEMALE_PHOTO : SAMPLE_MALE_PHOTO;
    }

    return {
      ...item,
      photoUrl: compactPhotoUrl,
      photos: cleanedPhotos,
      fullUidbData: cleanedUidb,
    };
  });
}

function safeSaveToLocalStorage(data: RegistrationEntry[]): void {
  if (typeof window === "undefined") return;

  // 1. Persist entire full-resolution dataset to IndexedDB (virtually unlimited quota)
  persistToIndexedDB(data);

  // 2. Tier 1: Try saving optimized compact version
  try {
    const compact = prepareForLocalStorage(data);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(compact));
    return;
  } catch (err) {
    console.warn("Storage quota exceeded (compact), attempting Tier 2 text fallback...", err);
  }

  // 3. Tier 2: Text-only guaranteed fallback — never lose any statutory record on refresh!
  try {
    const textOnly = data.map((item) => ({
      ...item,
      photoUrl:
        item.gender === "Female" ? SAMPLE_FEMALE_PHOTO : SAMPLE_MALE_PHOTO,
      photos: [],
      fullUidbData: item.fullUidbData
        ? {
            ...item.fullUidbData,
            photos: [],
            photoUrl: undefined,
          }
        : undefined,
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(textOnly));
  } catch (finalErr) {
    console.error("Critical: Cannot write to localStorage. Keeping in-memory cache active.", finalErr);
  }
}

export const RegistrationService = {
  getEntries: (): RegistrationEntry[] => {
    if (memoryStore && memoryStore.length > 0) {
      return sortEntriesNewestFirst(memoryStore);
    }
    if (typeof window === "undefined") return sortEntriesNewestFirst(INITIAL_RECORDS);
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        memoryStore = sortEntriesNewestFirst(INITIAL_RECORDS);
        safeSaveToLocalStorage(memoryStore);
        return [...memoryStore];
      }
      const parsed = JSON.parse(data);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        memoryStore = sortEntriesNewestFirst(INITIAL_RECORDS);
        safeSaveToLocalStorage(memoryStore);
        return [...memoryStore];
      }
      memoryStore = sortEntriesNewestFirst(parsed);
      return [...memoryStore];
    } catch {
      memoryStore = sortEntriesNewestFirst(INITIAL_RECORDS);
      return [...memoryStore];
    }
  },

  getEntriesByType: (type: RegistrationType): RegistrationEntry[] => {
    const all = RegistrationService.getEntries();
    return all.filter((item) => item.type === type);
  },

  setAllEntries: (entries: RegistrationEntry[]): void => {
    const sorted = sortEntriesNewestFirst(entries);
    memoryStore = sorted;
    safeSaveToLocalStorage(sorted);
  },

  addEntry: (
    entry: Omit<RegistrationEntry, "id" | "createdAt"> & { id?: string; createdAt?: string }
  ): RegistrationEntry => {
    const all = RegistrationService.getEntries();
    const newEntry: RegistrationEntry = {
      ...entry,
      id: entry.id || `reg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: entry.createdAt || new Date().toISOString(),
    };
    const updated = sortEntriesNewestFirst([
      newEntry,
      ...all.filter(
        (item) =>
          item.id !== newEntry.id &&
          (!newEntry.regNumber || item.regNumber !== newEntry.regNumber)
      ),
    ]);
    memoryStore = updated;
    safeSaveToLocalStorage(updated);
    return newEntry;
  },

  updateEntry: (id: string, updates: Partial<RegistrationEntry>): RegistrationEntry | null => {
    const all = RegistrationService.getEntries();
    const idx = all.findIndex((item) => item.id === id || (item.regNumber && item.regNumber === id));
    if (idx === -1) return null;
    const updatedEntry = { ...all[idx], ...updates };
    all[idx] = updatedEntry;
    const sorted = sortEntriesNewestFirst(all);
    memoryStore = sorted;
    safeSaveToLocalStorage(sorted);
    return updatedEntry;
  },

  deleteEntry: (id: string): boolean => {
    const all = RegistrationService.getEntries();
    const filtered = all.filter((item) => item.id !== id);
    memoryStore = [...filtered];
    safeSaveToLocalStorage(filtered);
    return true;
  },

  generateNextRegNumber: (type: RegistrationType): string => {
    const prefixMap: Record<RegistrationType, string> = {
      UIDB: "UIDB",
      MISSING_PERSON: "MP",
      MISSING_CATTLE: "MC",
      LOST_PROPERTY: "LP",
    };
    const prefix = prefixMap[type];
    const year = new Date().getFullYear();
    const all = RegistrationService.getEntriesByType(type);
    let maxNum = all.length;
    for (const item of all) {
      if (!item.regNumber) continue;
      const match = item.regNumber.match(new RegExp(`^${prefix}-${year}/(\\d+)`));
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    }
    const nextSeq = maxNum + 1;
    return `${prefix}-${year}/${String(nextSeq).padStart(2, "0")}`;
  },
};

