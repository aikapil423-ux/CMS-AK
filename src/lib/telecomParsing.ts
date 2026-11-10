import type { CallDirection } from "@/types/telecom";

export const targetPartyHeader = "Target / A Party Number";

export const callingHeaders = [
  "Calling Party", "Calling Party Number", "Calling Party No", "Calling Number", "Calling No",
  "A Party", "A Party Number", "A Party No", "A Number", "A No", "ANUM", "A MSISDN",
  "Source", "Source Number", "From", "From Number", "Caller", "Caller Number", "Originating Number", targetPartyHeader,
];

export const calledHeaders = [
  "Called Party", "Called Party Number", "Called Party No", "Called Number", "Called No",
  "B Party", "B Party Number", "B Party No", "B Number", "B No", "BNUM", "B MSISDN",
  "Destination", "Destination Number", "To", "To Number", "Callee", "Callee Number", "Dialled Number", "Dialed Number",
];

export function evidenceHeader(value:unknown):string {
  return String(value ?? "").trim().toLowerCase().replace(/[^a-z0-9]/g,"");
}

/** Unzoned operator records are interpreted as IST, never the host timezone. */
export function evidenceTimestamp(date: string, time = "") {
  const raw = `${date.trim()}${time.trim() && !/[T ]\d{1,2}:/.test(date) ? "T" + time.trim() : ""}`;
  const m = raw.match(/^(?:(\d{4})-(\d{1,2})-(\d{1,2})|(\d{1,2})[/-](\d{1,2})[/-](\d{4}))[T ](\d{1,2}):(\d{2})(?::(\d{2})(\.\d+)?)?(Z|[+-]\d{2}:\d{2})?$/);
  if (!m) throw new Error("Missing or invalid date/time; use DD/MM/YYYY or YYYY-MM-DD and HH:mm:ss");
  const y = Number(m[1] || m[6]), month = Number(m[2] || m[5]), d = Number(m[3] || m[4]);
  const hour = Number(m[7]), minute = Number(m[8]), second = Number(m[9] || 0);
  const check = new Date(Date.UTC(y, month - 1, d));
  if (check.getUTCFullYear() !== y || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== d || hour > 23 || minute > 59 || second > 59) throw new Error("Invalid calendar date/time");
  const day = `${y}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const clock = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:${String(second).padStart(2, "0")}`;
  const parsed = new Date(`${day}T${clock}${m[10] || ""}${m[11] || "+05:30"}`);
  if (Number.isNaN(parsed.getTime())) throw new Error("Invalid timezone offset");
  return { timestamp: parsed.toISOString(), date: day, time: clock };
}

export function evidenceDirection(value: string): CallDirection {
  const type = value.trim().toUpperCase().replace(/[ -]/g, "_");
  if (["SMS_IN", "SMS_INCOMING", "SMT", "MT_SMS"].includes(type)) return "SMS_IN";
  if (["SMS_OUT", "SMS_OUTGOING", "SMO", "MO_SMS"].includes(type)) return "SMS_OUT";
  if (["INCOMING", "IN", "INC", "MTC", "MT"].includes(type)) return "INCOMING";
  if (["OUTGOING", "OUT", "OG", "MOC", "MO"].includes(type)) return "OUTGOING";
  return type === "MISSED" ? "MISSED" : "OTHER";
}
