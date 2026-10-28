import type {ComplaintItem} from '@/types';
import {JURISDICTION_DATA} from '@/lib/jurisdictionData';
export function getStationComplaintCode(stationName?: string): string {
  const norm = (stationName || "").toLowerCase().trim();
  if (norm.includes("chandni bagh")) return "CBG";
  if (norm.includes("model town")) return "MTN";
  if (norm.includes("cyber")) return "CYB";
  if (norm.includes("women")) return "WMN";
  if (norm.includes("thanesar")) return "THN";
  if (norm.includes("rewari")) return "REW";
  if (norm.includes("sector 29")) return "S29";
  if (norm.includes("sector 14")) return "S14";
  if (norm.includes("city")) return "CTY";
  const clean = (stationName || "PS").replace(/^ps\s+/i, "").replace(/[^a-zA-Z]/g, "").slice(0, 3).toUpperCase();
  return clean || "STN";
}

export function nextComplaintNumber(
  complaints: (Pick<ComplaintItem, "complaintNumber" | "policeStation"> & Partial<Pick<ComplaintItem,"district">>)[],
  year: number,
  stationName?: string,
  district?: string
): string {
  const targetStation = (stationName || "").toLowerCase().trim();
  const stationCode = getStationComplaintCode(stationName);

  // Filter complaints belonging to this station
  const stationComplaints = complaints.filter((c) => {
    if(district&&c.district&&c.district.trim().toLowerCase()!==district.trim().toLowerCase())return false;
    if (!targetStation) return true;
    return (c.policeStation || "").toLowerCase().trim() === targetStation;
  });

  // Find max sequential number for this station and year
  let maxSeq = 0;
  for (const c of stationComplaints) {
    if (!c.complaintNumber || !new RegExp(`(?:^|[-/])${year}(?:[-/]|$)`).test(c.complaintNumber)) continue;
    const match = c.complaintNumber.match(/(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxSeq) {
        maxSeq = num;
      }
    }
  }

  // If no previous record found for this station, default start from 0001
  const nextSeq = maxSeq > 0 ? maxSeq + 1 : 1;
  const seqPadded = String(nextSeq).padStart(4, "0");
  const inferred = district || JURISDICTION_DATA.find(s=>s.districts.some(d=>d.policeStations.some(p=>p.toLowerCase()===targetStation)))?.districts.find(d=>d.policeStations.some(p=>p.toLowerCase()===targetStation))?.district;
  if(!inferred)throw new Error('Police district is required for complaint numbering.');
  const districtCode:Record<string,string>={panipat:'PNP',gurugram:'GGM',kurukshetra:'KKR',rewari:'RWR'};
  const code=districtCode[inferred.toLowerCase()]||inferred.replace(/[^a-z]/gi,'').slice(0,3).toUpperCase();
  return "HAR-"+code+"-" + year + "-CMP-" + stationCode + "-" + seqPadded;
}

