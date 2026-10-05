import { GeneralDiaryItem } from "@/types";
import { MOCK_GD_ENTRIES } from "@/lib/mockData";

const GD_STORAGE_KEY = "haryana_police_cms_gd_entries_v1";

function loadGdFromStorage(): GeneralDiaryItem[] {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      const stored = window.localStorage.getItem(GD_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Could not load GD entries from localStorage", e);
    }
  }
  return [...MOCK_GD_ENTRIES];
}

function saveGdToStorage(items: GeneralDiaryItem[]) {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      window.localStorage.setItem(GD_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn("Could not save GD entries to localStorage", e);
    }
  }
}

let gdEntriesStore: GeneralDiaryItem[] = loadGdFromStorage();

export const GeneralDiaryService = {
  async getEntries(filter?: { date?: string; search?: string; entryType?: string }): Promise<GeneralDiaryItem[]> {
    gdEntriesStore = loadGdFromStorage();
    let list = [...gdEntriesStore];

    if (filter?.date) {
      list = list.filter((e) => e.entryDate === filter.date);
    }

    if (filter?.entryType && filter.entryType !== "ALL") {
      list = list.filter((e) => e.entryType === filter.entryType);
    }

    if (filter?.search) {
      const q = filter.search.toLowerCase();
      list = list.filter(
        (e) =>
          e.gdNumber.toLowerCase().includes(q) ||
          e.subject.toLowerCase().includes(q) ||
          e.narrative.toLowerCase().includes(q) ||
          (e.relatedComplaintNumber && e.relatedComplaintNumber.toLowerCase().includes(q))
      );
    }

    return list.sort((a, b) => b.sequencePerDay - a.sequencePerDay);
  },

  async addEntry(
    subject: string,
    narrative: string,
    entryType: any,
    officerName: string,
    officerPno: string,
    station: string,
    relatedComplaintNumber?: string
  ): Promise<GeneralDiaryItem> {
    const today = new Date().toISOString().split("T")[0];
    const nowTime = new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    const seq = gdEntriesStore.filter((e) => e.entryDate === today).length + 1;
    const gdNumber = `GD-${today}-${String(seq).padStart(3, "0")}`;

    const typeDisplayMap: Record<string, string> = {
      COMPLAINT_RECEIPT: "Complaint Intake",
      OPENING_OF_DIARY: "Opening of Daily Roznamcha",
      SHIFT_RELIEF_TURNOVER: "Shift Turnover / Sentry Relief",
      PATROL_DEPARTURE_RETURN: "Patrol Departure & Return",
      SEIZURE_MUDDMAL: "Malkhana & Property Seizure",
      OFFICER_DEPARTURE: "Officer Departure",
      OFFICER_ARRIVAL: "Officer Arrival",
      FIR_REGISTERED_ENTRY: "FIR Registered Entry",
      ARREST_INTIMATION: "Arrest Intimation Log",
      CLOSING_OF_DIARY: "Closing of Daily Roznamcha",
      MISCELLANEOUS_EVENT: "Miscellaneous Event",
    };

    const newEntry: GeneralDiaryItem = {
      id: `gd_${Date.now()}`,
      gdNumber,
      sequencePerDay: seq,
      entryTime: nowTime,
      entryDate: today,
      entryType,
      entryTypeDisplay: typeDisplayMap[entryType] || entryType.replace(/_/g, " "),
      subject,
      narrative,
      policeStation: station,
      loggedByOfficer: officerName,
      loggedByPno: officerPno,
      relatedComplaintNumber,
      isLocked: true,
    };

    gdEntriesStore.unshift(newEntry);
    saveGdToStorage(gdEntriesStore);
    return newEntry;
  },

  async getTodayCount(): Promise<number> {
    gdEntriesStore = loadGdFromStorage();
    const today = new Date().toISOString().split("T")[0];
    return gdEntriesStore.filter((e) => e.entryDate === today).length;
  },
};
