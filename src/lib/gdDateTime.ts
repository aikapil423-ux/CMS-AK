// CCTNS Haryana General Diary date/time conventions:
//   Date -> dd/mm/yyyy        Time -> hh:mm AM/PM (12-hour)
// The register clock is SERVER-side, but officers may file BACK-DATED
// entries by picking an earlier date/time on the Add New GD form.

export function formatGDDateDisplay(d: Date): string {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = String(d.getFullYear()).padStart(4, "0");
  return `${dd}/${mm}/${yyyy}`;
}

// 12-hour display: "02:45 PM"
export function formatGDTimeDisplay12(d: Date): string {
  let hh = d.getHours();
  const ampm = hh >= 12 ? "PM" : "AM";
  hh = hh % 12;
  if (hh === 0) hh = 12;
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${String(hh).padStart(2, "0")}:${min} ${ampm}`;
}

// 24-hour key: "14:45" (used for internal parsing / comparisons)
export function formatGDTimeDisplay24(d: Date): string {
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${min}`;
}

// Local (non-UTC) yyyy-mm-dd key used for per-day GD numbering
export function formatGDDateKey(d: Date): string {
  const yyyy = String(d.getFullYear()).padStart(4, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// Display-standard activityDateTime string: "dd/mm/yyyy hh:mm AM/PM" (12-hour)
export function formatGDActivityDateTime(d: Date): string {
  return `${formatGDDateDisplay(d)} ${formatGDTimeDisplay12(d)}`;
}

// Start of the given day (00:00:00.000 local)
export function startOfDay(d: Date = new Date()): Date {
  const s = new Date(d);
  s.setHours(0, 0, 0, 0);
  return s;
}

// Parse a 24-hour "HH:mm" key into 12-hour picker parts
export function to12HourParts(
  hhmm24: string
): { hour: number; minute: number; ampm: "AM" | "PM" } {
  const [hs, ms] = (hhmm24 || "").split(":");
  let h = parseInt(hs || "0", 10) || 0;
  const m = parseInt(ms || "0", 10) || 0;
  const ampm: "AM" | "PM" = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return { hour: h, minute: m, ampm };
}

// Build a 24-hour "HH:mm" key from 12-hour picker parts
export function from12HourParts(
  hour: number,
  minute: number,
  ampm: "AM" | "PM"
): string {
  let h = ((hour % 12) + (ampm === "PM" ? 12 : 0)) % 24;
  if (hour === 12 && ampm === "AM") h = 0;
  if (hour === 12 && ampm === "PM") h = 12;
  return `${String(h).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

// Parse a stored activityDateTime string back into picker values.
// Handles "dd/mm/yyyy hh:mm AM/PM", "yyyy-mm-dd HH:mm", and ISO strings.
export function parseGDActivityDateTime(activity: string): {
  dateISO: string;
  time24: string;
} {
  const raw = (activity || "").trim();
  if (!raw) {
    const now = new Date();
    return { dateISO: formatGDDateKey(now), time24: formatGDTimeDisplay24(now) };
  }
  if (/^\d{4}-\d{2}-\d{2}T/.test(raw)) {
    const d = new Date(raw);
    return { dateISO: formatGDDateKey(d), time24: formatGDTimeDisplay24(d) };
  }
  const parts = raw.split(" ");
  let dateKey = "";
  let timePart = "";
  if (raw.includes("/")) {
    const dmy = (parts[0] || "").split("/");
    dateKey = dmy.length === 3 ? `${dmy[2]}-${dmy[1]}-${dmy[0]}` : "";
    timePart = parts.slice(1).join(" ");
  } else {
    dateKey = parts[0] || "";
    timePart = parts.slice(1).join(" ");
  }
  const m = timePart.match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);
  let h = m ? parseInt(m[1], 10) : 0;
  const min = m ? parseInt(m[2], 10) : 0;
  const ap = m ? (m[3] || "").toUpperCase() : "";
  if (ap === "AM" && h === 12) h = 0;
  if (ap === "PM" && h !== 12) h += 12;
  return {
    dateISO: dateKey || formatGDDateKey(new Date()),
    time24: `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`,
  };
}

// Converts any date string (ISO / YYYY-MM-DD) or Date object strictly to DD/MM/YYYY
export function toDDMMYYYY(dateOrStr: string | Date | undefined | null): string {
  if (!dateOrStr) return "";
  if (dateOrStr instanceof Date) {
    return formatGDDateDisplay(dateOrStr);
  }
  const str = String(dateOrStr).trim();
  const match = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const [, yyyy, mm, dd] = match;
    return `${dd}/${mm}/${yyyy}`;
  }
  const matchDMY = str.match(/^(\d{2})[-/](\d{2})[-/](\d{4})/);
  if (matchDMY) {
    const [, dd, mm, yyyy] = matchDMY;
    return `${dd}/${mm}/${yyyy}`;
  }
  return str;
}

// Converts any activityDateTime string ("dd/mm/yyyy hh:mm AM/PM", ISO, etc.) to epoch milliseconds for accurate sorting
export function parseGDActivityDateTimeToMs(raw: string): number {
  if (!raw) return 0;
  const { dateISO, time24 } = parseGDActivityDateTime(raw);
  const ms = new Date(`${dateISO}T${time24}:00`).getTime();
  return isNaN(ms) ? 0 : ms;
}

// -------------------------------------------------------------
// 24-Hour Auto-Expiration Rules for Unlocked Suggestions & Drafts
// - Unlocked GD entries (SUGGESTED / DRAFT) on which no action has
//   been taken for 24 hours are automatically purged.
// - LOCKED entries are protected under PPR 22.48 and can NEVER expire.
// -------------------------------------------------------------
export const GD_EXPIRATION_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 Hours

export function getRecordLastActionTimeMs(record: {
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
  auditTrailJson?: string | null;
  auditTrail?: Array<{ timestamp?: string | null }> | null;
  officialCreationTimestamp?: string | null;
  activityDateTime?: string | null;
}): number {
  let latestAuditMs = 0;

  if (record.auditTrail && Array.isArray(record.auditTrail)) {
    for (const log of record.auditTrail) {
      if (log && log.timestamp) {
        const ms = new Date(log.timestamp).getTime();
        if (!isNaN(ms) && ms > latestAuditMs) latestAuditMs = ms;
      }
    }
  } else if (record.auditTrailJson) {
    try {
      const trail = JSON.parse(record.auditTrailJson);
      if (Array.isArray(trail)) {
        for (const log of trail) {
          if (log && log.timestamp) {
            const ms = new Date(log.timestamp).getTime();
            if (!isNaN(ms) && ms > latestAuditMs) latestAuditMs = ms;
          }
        }
      }
    } catch {}
  }

  // Authoritative action logs: audit trail records every CREATED, EDITED, SUGGESTED action
  if (latestAuditMs > 0) {
    return latestAuditMs;
  }

  // Fallback when audit trail is absent
  let fallbackMs = 0;
  if (record.createdAt) {
    const crMs = new Date(record.createdAt).getTime();
    if (!isNaN(crMs) && crMs > fallbackMs) fallbackMs = crMs;
  }
  if (record.officialCreationTimestamp) {
    const crMs = new Date(record.officialCreationTimestamp).getTime();
    if (!isNaN(crMs) && crMs > fallbackMs) fallbackMs = crMs;
  }
  if (record.updatedAt) {
    const upMs = new Date(record.updatedAt).getTime();
    if (!isNaN(upMs) && upMs > fallbackMs) fallbackMs = upMs;
  }

  return fallbackMs;
}

export function isGdRecordExpired(record: {
  isLocked?: boolean | null;
  status?: string | null;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
  auditTrailJson?: string | null;
  auditTrail?: Array<{ timestamp?: string | null }> | null;
  officialCreationTimestamp?: string | null;
  activityDateTime?: string | null;
}): boolean {
  // Statutory protection: LOCKED entries cannot be deleted under PPR 22.48
  if (record.isLocked) return false;
  // Only SUGGESTED and DRAFT entries are subject to the 24-hour expiration rule
  if (record.status !== "SUGGESTED" && record.status !== "DRAFT") return false;

  const lastAction = getRecordLastActionTimeMs(record);
  if (!lastAction) return false;

  return Date.now() - lastAction >= GD_EXPIRATION_WINDOW_MS;
}

export function getGdRecordRemainingTime(record: {
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
  auditTrailJson?: string | null;
  auditTrail?: Array<{ timestamp?: string | null }> | null;
  officialCreationTimestamp?: string | null;
  activityDateTime?: string | null;
}): {
  isExpired: boolean;
  hoursRemaining: number;
  minutesRemaining: number;
  displayTextEn: string;
  displayTextHi: string;
} {
  const lastAction = getRecordLastActionTimeMs(record);
  if (!lastAction) {
    return {
      isExpired: false,
      hoursRemaining: 24,
      minutesRemaining: 0,
      displayTextEn: "24h left",
      displayTextHi: "24 घंटे शेष",
    };
  }

  const elapsed = Date.now() - lastAction;
  const remaining = GD_EXPIRATION_WINDOW_MS - elapsed;
  if (remaining <= 0) {
    return {
      isExpired: true,
      hoursRemaining: 0,
      minutesRemaining: 0,
      displayTextEn: "Expired",
      displayTextHi: "समय सीमा समाप्त",
    };
  }

  const hours = Math.floor(remaining / (60 * 60 * 1000));
  const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));

  if (hours > 0) {
    return {
      isExpired: false,
      hoursRemaining: hours,
      minutesRemaining: minutes,
      displayTextEn: `${hours}h ${minutes}m left`,
      displayTextHi: `${hours} घंटे ${minutes} मिनट शेष`,
    };
  }

  return {
    isExpired: false,
    hoursRemaining: 0,
    minutesRemaining: minutes,
    displayTextEn: `${minutes}m left`,
    displayTextHi: `${minutes} मिनट शेष`,
  };
}