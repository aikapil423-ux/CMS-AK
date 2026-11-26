import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function getTime24IST(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(now);
}

export function getTodayIsoIST(now: Date = new Date()): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now);
  } catch {
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }
}

export function getDateDaysAgoIsoIST(daysAgo: number, now: Date = new Date()): string {
  return getTodayIsoIST(new Date(now.getTime() - daysAgo * 86400000));
}

export function getMonthStartIsoIST(now: Date = new Date()): string {
  const today = getTodayIsoIST(now);
  return `${today.slice(0, 7)}-01`;
}

export function toIsoDateString(input: string | Date | null | undefined): string {
  if (!input) return "";
  if (input instanceof Date) {
    return isNaN(input.getTime()) ? "" : getTodayIsoIST(input);
  }
  const s = String(input).trim();
  if (!s) return "";
  const isoMatch = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  const dmyMatch = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
  if (dmyMatch) {
    const dd = dmyMatch[1].padStart(2, "0");
    const mm = dmyMatch[2].padStart(2, "0");
    const yyyy = dmyMatch[3];
    const dt = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
    if (dt.getFullYear() === Number(yyyy) && dt.getMonth() === Number(mm) - 1 && dt.getDate() === Number(dd)) {
      return `${yyyy}-${mm}-${dd}`;
    }
  }
  const parsed = new Date(s);
  return isNaN(parsed.getTime()) ? "" : getTodayIsoIST(parsed);
}

/**
 * Parse DD/MM/YYYY [hh:mm AM/PM], YYYY-MM-DD[THH:mm...], or Date safely in IST/local time
 * without flipping day and month.
 */
export function parseFlexibleDate(date: string | Date | null | undefined): Date | null {
  if (!date) return null;
  if (date instanceof Date) return isNaN(date.getTime()) ? null : date;
  const s = String(date).trim();
  if (!s) return null;

  // Match DD/MM/YYYY or DD-MM-YYYY with optional time ("05/11/2026 02:30 PM" or "05/11/2026 14:30")
  const dmyTime = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})(?:[\sT]+(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\s*(AM|PM))?)?$/i);
  if (dmyTime) {
    const dd = Number(dmyTime[1]);
    const mm = Number(dmyTime[2]);
    const yyyy = Number(dmyTime[3]);
    let hh = dmyTime[4] !== undefined ? Number(dmyTime[4]) : 0;
    const min = dmyTime[5] !== undefined ? Number(dmyTime[5]) : 0;
    const sec = dmyTime[6] !== undefined ? Number(dmyTime[6]) : 0;
    const ap = (dmyTime[7] || "").toUpperCase();
    if (ap === "AM" && hh === 12) hh = 0;
    else if (ap === "PM" && hh !== 12) hh += 12;
    const dt = new Date(yyyy, mm - 1, dd, hh, min, sec);
    if (dt.getFullYear() === yyyy && dt.getMonth() === mm - 1 && dt.getDate() === dd) {
      return dt;
    }
    return null;
  }

  // Match plain YYYY-MM-DD (avoid UTC midnight shifting back 1 day in negative offsets)
  const ymdOnly = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (ymdOnly) {
    return new Date(Number(ymdOnly[1]), Number(ymdOnly[2]) - 1, Number(ymdOnly[3]));
  }

  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "-";
  if (typeof date === "string") {
    const s = date.trim();
    if (!s) return "-";
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) return s;
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) {
      return `${m[3]}/${m[2]}/${m[1]}`;
    }
    const dmy = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
    if (dmy) {
      return `${dmy[1].padStart(2, "0")}/${dmy[2].padStart(2, "0")}/${dmy[3]}`;
    }
  }
  const d = parseFlexibleDate(date);
  if (!d) return String(date);
  try {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).formatToParts(d);
    const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
    if (map.day && map.month && map.year) return `${map.day}/${map.month}/${map.year}`;
  } catch {
    // Fallback below
  }
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = String(d.getFullYear()).padStart(4, "0");
  return `${dd}/${mm}/${yyyy}`;
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return "-";
  const d = parseFlexibleDate(date);
  if (!d) return String(date);
  try {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).formatToParts(d);
    const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
    if (map.day && map.month && map.year && map.hour && map.minute) {
      const ampm = (map.dayPeriod || (d.getHours() >= 12 ? "PM" : "AM")).toUpperCase();
      return `${map.day}/${map.month}/${map.year} ${map.hour.padStart(2, "0")}:${map.minute.padStart(2, "0")} ${ampm}`;
    }
  } catch {
    // Fallback below
  }
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = String(d.getFullYear()).padStart(4, "0");
  let hh = d.getHours();
  const ampm = hh >= 12 ? "PM" : "AM";
  hh = hh % 12;
  if (hh === 0) hh = 12;
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yyyy} ${String(hh).padStart(2, "0")}:${min} ${ampm}`;
}

export const toDDMMYYYY = formatDate;

export function parseTimeTo24Hour(timeStr?: string | null): string {
  if (!timeStr) return "";
  const s = String(timeStr).trim();
  if (!s) return "";
  const m = s.match(/^(\d{1,2}):(\d{2})(?::\d{2})?(?:\s*(AM|PM))?$/i);
  if (!m) return "";
  let hh = Number(m[1]);
  const mm = Number(m[2]);
  if (mm < 0 || mm > 59) return "";
  const ap = (m[3] || "").toUpperCase();
  if (ap === "AM") {
    if (hh < 1 || hh > 12) return "";
    if (hh === 12) hh = 0;
  } else if (ap === "PM") {
    if (hh < 1 || hh > 12) return "";
    if (hh !== 12) hh += 12;
  } else if (hh < 0 || hh > 23) {
    return "";
  }
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

export function parseGdActivityDateTime(raw?: string | null): { dateIso: string; time24: string } {
  const s = String(raw || "").trim();
  if (!s) return { dateIso: "", time24: "" };
  const hasExplicitTz = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(s);
  if (!hasExplicitTz) {
    const m = s.match(/^(\d{1,2}[-/.]\d{1,2}[-/.]\d{4}|\d{4}-\d{2}-\d{2})(?:[\sT]+(\d{1,2}:\d{2}(?::\d{2})?(?:\s*(?:AM|PM))?))?/i);
    if (m) {
      return {
        dateIso: toIsoDateString(m[1]),
        time24: m[2] ? parseTimeTo24Hour(m[2]) : "",
      };
    }
  }
  const dt = parseFlexibleDate(s);
  if (!dt) return { dateIso: "", time24: "" };
  const dateIso = getTodayIsoIST(dt);
  try {
    const time24 = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(dt);
    return { dateIso, time24 };
  } catch {
    return {
      dateIso,
      time24: `${String(dt.getHours()).padStart(2, "0")}:${String(dt.getMinutes()).padStart(2, "0")}`,
    };
  }
}
