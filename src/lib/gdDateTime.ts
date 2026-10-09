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