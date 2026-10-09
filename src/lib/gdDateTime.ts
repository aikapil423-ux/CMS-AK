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