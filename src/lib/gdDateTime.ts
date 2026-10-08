// CCTNS Haryana General Diary date/time conventions:
//   Date -> dd/mm/yyyy        Time -> hh:mm (24-hour)
// All values are derived from the SERVER clock only (never editable by user).

export function formatGDDateDisplay(d: Date): string {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = String(d.getFullYear()).padStart(4, "0");
  return `${dd}/${mm}/${yyyy}`;
}

export function formatGDTimeDisplay(d: Date): string {
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

// Server-standard activityDateTime string: "dd/mm/yyyy HH:mm" (24h)
export function formatGDActivityDateTime(d: Date): string {
  return `${formatGDDateDisplay(d)} ${formatGDTimeDisplay(d)}`;
}

// Start of the given day (00:00:00.000 local)
export function startOfDay(d: Date = new Date()): Date {
  const s = new Date(d);
  s.setHours(0, 0, 0, 0);
  return s;
}
