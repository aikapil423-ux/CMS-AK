import type { FIRItem } from "@/types";
import { parseTimeTo24Hour } from "@/lib/utils";

export function getFirTimePeriod(time?: string): string {
  const normalized = parseTimeTo24Hour(time);
  if (!normalized) return "";

  const hour = Number(normalized.slice(0, 2));
  if (hour < 6 || hour >= 20) return "Night / रात्रि";
  if (hour < 12) return "Morning / सुबह";
  if (hour < 17) return "Afternoon / दोपहर";
  return "Evening / सायं";
}

export function getFirPrintTimePeriod(fir: Pick<FIRItem, "incidentTimePeriod" | "incidentTimeFrom">): string {
  const storedPeriod = fir.incidentTimePeriod?.trim();
  if (storedPeriod && storedPeriod !== "Morning / General" && storedPeriod !== "Morning / Pahar 1") {
    return storedPeriod;
  }

  return getFirTimePeriod(fir.incidentTimeFrom);
}

export function getFirPrintAddress(fir: Pick<FIRItem, "occurrencesList" | "incidentPlace" | "incidentLandmark">): string {
  const occurrence = fir.occurrencesList?.[0];
  const addressParts = [
    occurrence?.houseNo,
    occurrence?.streetName,
    occurrence?.area,
    occurrence?.city,
    occurrence?.tehsil,
    occurrence?.pincode,
  ].map((part) => part?.trim()).filter(Boolean);
  const address = occurrence?.address?.trim() || addressParts.join(", ") || fir.incidentPlace?.trim();
  const landmark = occurrence?.landmark?.trim() || fir.incidentLandmark?.trim();

  return [...new Set([address, landmark].filter(Boolean))].join(", ");
}
