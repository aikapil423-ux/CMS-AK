import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "-";
  if (typeof date === "string") {
    const s = date.trim();
    if (!s) return "-";
    // Already in DD/MM/YYYY
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) return s;
    // YYYY-MM-DD or ISO
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) {
      return `${m[3]}/${m[2]}/${m[1]}`;
    }
    // DD-MM-YYYY
    const dmy = s.match(/^(\d{2})-(\d{2})-(\d{4})/);
    if (dmy) {
      return `${dmy[1]}/${dmy[2]}/${dmy[3]}`;
    }
  }
  const d = typeof date === "string" ? new Date(date) : date;
  if (!d || isNaN(d.getTime())) return String(date);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = String(d.getFullYear()).padStart(4, "0");
  return `${dd}/${mm}/${yyyy}`;
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  if (!d || isNaN(d.getTime())) return String(date);
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
