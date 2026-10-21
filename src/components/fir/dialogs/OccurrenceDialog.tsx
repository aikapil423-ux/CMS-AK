"use client";

import React, { useState, useEffect } from "react";
import { X, MapPin, Check, RotateCcw, AlertCircle, Compass } from "lucide-react";
import { FIROccurrenceItem } from "@/types";
import { Button } from "@/components/ui/button";
import { DatePickerDDMMYYYY } from "@/components/ui/date-picker-ddmmyyyy";
import { DIRECTION_FROM_PS_OPTIONS } from "@/components/fir/firDropdownConstants";

export interface ExtendedFIROccurrenceItem extends FIROccurrenceItem {
  isDateKnown?: boolean;
  isKnownDate?: boolean;
  infoReceivedDate?: string;
  infoReceivedTime?: string;
  isForestPlace?: boolean;
  delayInRegistrationByPolice?: string;
  delayInReportingByComplainant?: string;
  reasonsForDelay?: string;
  houseNo?: string;
  streetName?: string;
  tehsil?: string;
  pincode?: string;
  isOrganisedCrime?: boolean;
}

export interface OccurrenceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: ExtendedFIROccurrenceItem) => void;
  initialItem?: ExtendedFIROccurrenceItem | null;
  initialData?: ExtendedFIROccurrenceItem | null;
}

function getNowLocal() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return {
    date: `${year}-${month}-${day}`,
    time: `${hours}:${minutes}`,
  };
}

export const OccurrenceDialog: React.FC<OccurrenceDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  initialItem,
  initialData,
}) => {
  const effectiveItem = initialItem || initialData;

  // Dynamic real-time clock state for maximum allowable limits
  const [currentNow, setCurrentNow] = useState(() => getNowLocal());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentNow(getNowLocal());
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  // Occurrence Information
  const [isDateKnown, setIsDateKnown] = useState(true);
  const [dateFrom, setDateFrom] = useState(() => getNowLocal().date);
  const [timeFrom, setTimeFrom] = useState(() => {
    const now = getNowLocal();
    return now.time < "10:00" ? now.time : "10:00";
  });
  const getDayFromDate = (dStr: string) => {
    if (!dStr) return "Monday";
    try {
      const d = new Date(dStr);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString("en-US", { weekday: "long" });
      }
    } catch {
      // fallback
    }
    return "Monday";
  };

  const [dateTo, setDateTo] = useState("");
  const [timeTo, setTimeTo] = useState(() => getNowLocal().time);
  const [day, setDay] = useState(() => getDayFromDate(getNowLocal().date));
  const [infoReceivedDate, setInfoReceivedDate] = useState(() => getNowLocal().date);
  const [infoReceivedTime, setInfoReceivedTime] = useState(() => getNowLocal().time);
  const [isForestPlace, setIsForestPlace] = useState(false);

  const maxAllowedDate = currentNow.date;
  const maxAllowedTimeFrom = dateFrom >= maxAllowedDate ? currentNow.time : undefined;
  const maxAllowedTimeTo = dateTo >= maxAllowedDate ? currentNow.time : undefined;
  const maxAllowedInfoReceivedTime = infoReceivedDate >= maxAllowedDate ? currentNow.time : undefined;

  const handleDateFromChange = (newDate: string) => {
    const now = getNowLocal();
    let clampedDate = newDate;
    if (clampedDate && clampedDate > now.date) {
      clampedDate = now.date;
    }
    setDateFrom(clampedDate);
    if (clampedDate) {
      setDay(getDayFromDate(clampedDate));
    }
    if (clampedDate >= now.date && timeFrom > now.time) {
      setTimeFrom(now.time);
    }
  };

  const handleTimeFromChange = (newTime: string, targetEl?: HTMLInputElement | null) => {
    const now = getNowLocal();
    let clampedTime = newTime;
    if (dateFrom >= now.date && clampedTime > now.time) {
      clampedTime = now.time;
      if (targetEl) targetEl.value = clampedTime;
    }
    setTimeFrom(clampedTime);
  };

  const handleDateToChange = (newDate: string) => {
    const now = getNowLocal();
    let clampedDate = newDate;
    if (clampedDate && clampedDate > now.date) {
      clampedDate = now.date;
    }
    setDateTo(clampedDate);
    if (clampedDate >= now.date && timeTo > now.time) {
      setTimeTo(now.time);
    }
  };

  const handleTimeToChange = (newTime: string, targetEl?: HTMLInputElement | null) => {
    const now = getNowLocal();
    let clampedTime = newTime;
    if (dateTo >= now.date && clampedTime > now.time) {
      clampedTime = now.time;
      if (targetEl) targetEl.value = clampedTime;
    }
    setTimeTo(clampedTime);
  };

  const handleInfoReceivedDateChange = (newDate: string) => {
    const now = getNowLocal();
    let clampedDate = newDate;
    if (clampedDate && clampedDate > now.date) {
      clampedDate = now.date;
    }
    setInfoReceivedDate(clampedDate);
    if (clampedDate >= now.date && infoReceivedTime > now.time) {
      setInfoReceivedTime(now.time);
    }
  };

  const handleInfoReceivedTimeChange = (newTime: string, targetEl?: HTMLInputElement | null) => {
    const now = getNowLocal();
    let clampedTime = newTime;
    if (infoReceivedDate >= now.date && clampedTime > now.time) {
      clampedTime = now.time;
      if (targetEl) targetEl.value = clampedTime;
    }
    setInfoReceivedTime(clampedTime);
  };

  // Reason for Delay
  const [delayInRegistrationByPolice, setDelayInRegistrationByPolice] = useState("");
  const [delayInReportingByComplainant, setDelayInReportingByComplainant] = useState("");

  // Place of Occurrence
  const [houseNo, setHouseNo] = useState("");
  const [streetName, setStreetName] = useState("");
  const [area, setArea] = useState("");
  const [city, setCity] = useState("Gurugram");
  const [tehsil, setTehsil] = useState("Gurugram");
  const [pincode, setPincode] = useState("");

  // Outside-Limit Details
  const [outsidePs, setOutsidePs] = useState(false);
  const [outsideState, setOutsideState] = useState("");
  const [outsideDistrict, setOutsideDistrict] = useState("");
  const [outsidePsName, setOutsidePsName] = useState("");

  // Other fields
  const [isOrganisedCrime, setIsOrganisedCrime] = useState(false);
  const [directionFromPs, setDirectionFromPs] = useState("");
  const [distanceKm, setDistanceKm] = useState("");
  const [beatNo, setBeatNo] = useState("");
  const [landmark, setLandmark] = useState("");

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleClear = () => {
    const now = getNowLocal();
    setIsDateKnown(true);
    setDateFrom(now.date);
    setTimeFrom(now.time < "10:00" ? now.time : "10:00");
    setDateTo("");
    setTimeTo(now.time);
    setDay("Monday");
    setInfoReceivedDate(now.date);
    setInfoReceivedTime(now.time);
    setIsForestPlace(false);
    setDelayInRegistrationByPolice("");
    setDelayInReportingByComplainant("");
    setHouseNo("");
    setStreetName("");
    setArea("");
    setCity("Gurugram");
    setTehsil("Gurugram");
    setPincode("");
    setOutsidePs(false);
    setOutsideState("");
    setOutsideDistrict("");
    setOutsidePsName("");
    setIsOrganisedCrime(false);
    setDirectionFromPs("");
    setDistanceKm("");
    setBeatNo("");
    setLandmark("");
    setErrorMsg(null);
  };

  useEffect(() => {
    if (!isOpen) return;
    if (effectiveItem) {
      setIsDateKnown(effectiveItem.isDateKnown ?? effectiveItem.isKnownDate ?? true);
      setDateFrom(effectiveItem.dateFrom || "");
      setTimeFrom(effectiveItem.timeFrom || "");
      setDateTo(effectiveItem.dateTo || "");
      setTimeTo(effectiveItem.timeTo || "");
      setDay(effectiveItem.day || "Monday");
      setInfoReceivedDate(effectiveItem.infoReceivedDate || new Date().toISOString().split("T")[0]);
      setInfoReceivedTime(effectiveItem.infoReceivedTime || new Date().toTimeString().slice(0, 5));
      setIsForestPlace(effectiveItem.isForestPlace || false);
      setDelayInRegistrationByPolice(effectiveItem.delayInRegistrationByPolice || "");
      setDelayInReportingByComplainant(effectiveItem.delayInReportingByComplainant || effectiveItem.reasonsForDelay || "");
      setHouseNo(effectiveItem.houseNo || "");
      setStreetName(effectiveItem.streetName || "");
      setArea(effectiveItem.area || "");
      setCity(effectiveItem.city || "Gurugram");
      setTehsil(effectiveItem.tehsil || "Gurugram");
      setPincode(effectiveItem.pincode || "");
      setOutsidePs(effectiveItem.outsidePs || false);
      setOutsideState(effectiveItem.outsideState || "");
      setOutsideDistrict(effectiveItem.outsideDistrict || "");
      setOutsidePsName(effectiveItem.outsidePsName || "");
      setIsOrganisedCrime(effectiveItem.isOrganisedCrime || false);
      setDirectionFromPs(effectiveItem.directionFromPs || "");
      setDistanceKm(effectiveItem.distanceKm !== undefined && effectiveItem.distanceKm !== null ? String(effectiveItem.distanceKm) : "");
      setBeatNo(effectiveItem.beatNo || "");
      setLandmark(effectiveItem.landmark || "");
    } else {
      handleClear();
    }
  }, [effectiveItem, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    setErrorMsg(null);
    if (!area.trim() && !streetName.trim() && !city.trim()) {
      setErrorMsg("Please specify the Colony / Locality / Area or City for the occurrence place.");
      return;
    }

    if (isDateKnown && !dateFrom) {
      setErrorMsg("Please enter the occurrence 'From Date' or toggle date as Unknown.");
      return;
    }

    const now = getNowLocal();
    if (isDateKnown && dateFrom && (dateFrom > now.date || (dateFrom === now.date && timeFrom > now.time))) {
      setErrorMsg("Occurrence 'From Date/Time' cannot be in the future.");
      return;
    }
    if (isDateKnown && dateTo && (dateTo > now.date || (dateTo === now.date && timeTo > now.time))) {
      setErrorMsg("Occurrence 'To Date/Time' cannot be in the future.");
      return;
    }
    if (infoReceivedDate && (infoReceivedDate > now.date || (infoReceivedDate === now.date && infoReceivedTime > now.time))) {
      setErrorMsg("Information Received Date/Time cannot be in the future.");
      return;
    }

    if (distanceKm && Number(distanceKm) < 0) {
      setErrorMsg("Distance from Police Station cannot be negative.");
      return;
    }

    if (pincode && pincode.trim().length > 0 && !/^\d{6}$/.test(pincode.trim())) {
      setErrorMsg("Pincode must contain exactly 6 digits.");
      return;
    }

    const item: ExtendedFIROccurrenceItem = {
      id: initialItem?.id || `occ-${Date.now()}`,
      srNo: initialItem?.srNo || 1,
      isDateKnown,
      dateFrom: isDateKnown ? dateFrom : "Date Unknown",
      dateTo: isDateKnown ? (dateTo || dateFrom) : undefined,
      timeFrom: isDateKnown ? timeFrom : undefined,
      timeTo: isDateKnown ? (timeTo || timeFrom) : undefined,
      day: isDateKnown ? day : undefined,
      infoReceivedDate,
      infoReceivedTime,
      isForestPlace,
      delayInRegistrationByPolice: delayInRegistrationByPolice.trim() || undefined,
      delayInReportingByComplainant: delayInReportingByComplainant.trim() || undefined,
      houseNo: houseNo.trim() || undefined,
      streetName: streetName.trim() || undefined,
      area: area.trim(),
      city: city.trim(),
      tehsil: tehsil.trim() || undefined,
      pincode: pincode.trim() || undefined,
      outsidePs,
      outsideState: outsidePs ? outsideState.trim() : undefined,
      outsideDistrict: outsidePs ? outsideDistrict.trim() : undefined,
      outsidePsName: outsidePs ? outsidePsName.trim() : undefined,
      isOrganisedCrime,
      directionFromPs,
      distanceKm,
      beatNo,
      landmark: landmark.trim() || undefined,
    };

    onSave(item);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in-50">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden text-slate-800">
        {/* Header */}
        <div className="px-5 py-3.5 bg-[#0b192c] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/30 border border-emerald-400/40 flex items-center justify-center text-emerald-200">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight">
                {initialItem ? "Edit Occurrence Details" : "Add New Occurrence (घटना का विवरण)"}
              </h2>
              <p className="text-[11px] text-slate-300">
                Specify incident date/time window, police station receipt time, location coordinates, and beat
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section 1: Occurrence Information */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
              <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-blue-600" />
                1. Occurrence Date, Time &amp; Forest Status
              </span>
              <div className="flex items-center gap-3">
                <span className="font-bold text-slate-600">Date of Occurrence:</span>
                <label className="flex items-center gap-1 cursor-pointer font-semibold">
                  <input
                    type="radio"
                    name="occDateKnown"
                    checked={isDateKnown}
                    onChange={() => setIsDateKnown(true)}
                    className="text-blue-600"
                  />
                  <span>Known</span>
                </label>
                <label className="flex items-center gap-1 cursor-pointer font-semibold text-amber-800">
                  <input
                    type="radio"
                    name="occDateKnown"
                    checked={!isDateKnown}
                    onChange={() => setIsDateKnown(false)}
                    className="text-amber-600"
                  />
                  <span>Unknown</span>
                </label>
              </div>
            </div>

            {isDateKnown ? (
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">From Date &amp; Time <span className="text-red-500">*</span></label>
                  <div className="flex gap-1.5">
                    <div className="w-3/5">
                      <DatePickerDDMMYYYY
                        value={dateFrom}
                        max={maxAllowedDate}
                        onChange={(e) => handleDateFromChange(e.target.value)}
                        placeholder="DD/MM/YYYY"
                        size="sm"
                      />
                    </div>
                    <input
                      type="time"
                      value={timeFrom}
                      max={maxAllowedTimeFrom}
                      onChange={(e) => handleTimeFromChange(e.target.value, e.target)}
                      onInput={(e) => {
                        const now = getNowLocal();
                        if (dateFrom >= now.date && e.currentTarget.value > now.time) {
                          e.currentTarget.value = now.time;
                          setTimeFrom(now.time);
                        }
                      }}
                      onBlur={(e) => {
                        const now = getNowLocal();
                        if (dateFrom >= now.date && (e.currentTarget.value > now.time || timeFrom > now.time)) {
                          e.currentTarget.value = now.time;
                          setTimeFrom(now.time);
                        }
                      }}
                      className="w-2/5 p-2 rounded-lg border border-slate-300 bg-white font-mono text-xs"
                      title={dateFrom >= maxAllowedDate ? `Latest allowed time: ${currentNow.time}` : undefined}
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">To Date &amp; Time</label>
                  <div className="flex gap-1.5">
                    <div className="w-3/5">
                      <DatePickerDDMMYYYY
                        value={dateTo}
                        max={maxAllowedDate}
                        onChange={(e) => handleDateToChange(e.target.value)}
                        placeholder="DD/MM/YYYY"
                        size="sm"
                      />
                    </div>
                    <input
                      type="time"
                      value={timeTo}
                      max={maxAllowedTimeTo}
                      onChange={(e) => handleTimeToChange(e.target.value, e.target)}
                      onInput={(e) => {
                        const now = getNowLocal();
                        if (dateTo >= now.date && e.currentTarget.value > now.time) {
                          e.currentTarget.value = now.time;
                          setTimeTo(now.time);
                        }
                      }}
                      onBlur={(e) => {
                        const now = getNowLocal();
                        if (dateTo >= now.date && (e.currentTarget.value > now.time || timeTo > now.time)) {
                          e.currentTarget.value = now.time;
                          setTimeTo(now.time);
                        }
                      }}
                      className="w-2/5 p-2 rounded-lg border border-slate-300 bg-white font-mono text-xs"
                      title={dateTo >= maxAllowedDate ? `Latest allowed time: ${currentNow.time}` : undefined}
                    />
                  </div>
                </div>



                <div>
                  <label className="font-bold text-slate-700 block mb-1">Area of Crime a Forest Place?</label>
                  <div className="flex items-center gap-3 mt-2">
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        name="forestPlace"
                        checked={isForestPlace}
                        onChange={() => setIsForestPlace(true)}
                      />
                      <span>Yes</span>
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        name="forestPlace"
                        checked={!isForestPlace}
                        onChange={() => setIsForestPlace(false)}
                      />
                      <span>No</span>
                    </label>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 text-xs">
                Incident date is recorded as <strong>Unknown / Undetermined</strong>. Exact date and time window will be investigated during field enquiry.
              </div>
            )}

            {/* Information Received at PS Date & Time */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200/60 items-center">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Information Received at Police Station <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-1.5">
                  <div className="w-3/5">
                    <DatePickerDDMMYYYY
                      value={infoReceivedDate}
                      max={maxAllowedDate}
                      onChange={(e) => handleInfoReceivedDateChange(e.target.value)}
                      placeholder="DD/MM/YYYY"
                      size="sm"
                    />
                  </div>
                  <input
                    type="time"
                    value={infoReceivedTime}
                    max={maxAllowedInfoReceivedTime}
                    onChange={(e) => handleInfoReceivedTimeChange(e.target.value, e.target)}
                    onInput={(e) => {
                      const now = getNowLocal();
                      if (infoReceivedDate >= now.date && e.currentTarget.value > now.time) {
                        e.currentTarget.value = now.time;
                        setInfoReceivedTime(now.time);
                      }
                    }}
                    onBlur={(e) => {
                      const now = getNowLocal();
                      if (infoReceivedDate >= now.date && (e.currentTarget.value > now.time || infoReceivedTime > now.time)) {
                        e.currentTarget.value = now.time;
                        setInfoReceivedTime(now.time);
                      }
                    }}
                    className="w-2/5 p-2 rounded-lg border border-slate-300 bg-white font-mono text-xs"
                    title={infoReceivedDate >= maxAllowedDate ? `Latest allowed time: ${currentNow.time}` : undefined}
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Organised Crime Incident?</label>
                <div className="flex items-center gap-3 mt-2">
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="orgCrime"
                      checked={isOrganisedCrime}
                      onChange={() => setIsOrganisedCrime(true)}
                    />
                    <span className="font-bold text-red-700">Yes</span>
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="orgCrime"
                      checked={!isOrganisedCrime}
                      onChange={() => setIsOrganisedCrime(false)}
                    />
                    <span>No</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Reason for Delay */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <span className="font-bold text-slate-900 text-xs block">
              2. Reason for Delay (यदि कोई विलंब हो)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Delay in Reporting by Complainant
                </label>
                <input
                  type="text"
                  placeholder="e.g. Complainant was hospitalized / Fear of retaliation..."
                  value={delayInReportingByComplainant}
                  onChange={(e) => setDelayInReportingByComplainant(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 bg-white text-xs"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Delay in Registration by Police
                </label>
                <input
                  type="text"
                  placeholder="e.g. Preliminary enquiry under Sec 173(3) BNSS / Jurisdiction verification..."
                  value={delayInRegistrationByPolice}
                  onChange={(e) => setDelayInRegistrationByPolice(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 bg-white text-xs"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Place of Occurrence */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <span className="font-bold text-slate-900 text-xs block">
              3. Place of Occurrence (घटना स्थल का विवरण)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">House / Building No.</label>
                <input
                  type="text"
                  placeholder="e.g. H.No. 452, Tower B"
                  value={houseNo}
                  onChange={(e) => setHouseNo(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 bg-white text-xs"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Street Name</label>
                <input
                  type="text"
                  placeholder="e.g. Main Market Road, NH-44"
                  value={streetName}
                  onChange={(e) => setStreetName(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 bg-white text-xs"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Colony / Locality / Area <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="e.g. Sector 29 Huda Ground"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 bg-white text-xs"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Village / Town / City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 bg-white text-xs"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Tehsil / Block / Mandal</label>
                <input
                  type="text"
                  value={tehsil}
                  onChange={(e) => setTehsil(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 bg-white text-xs"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Pincode</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder="e.g. 122001"
                  value={pincode}
                  onChange={(e) => {
                    const onlyDigits = e.target.value.replace(/\D/g, "").slice(0, 6);
                    setPincode(onlyDigits);
                  }}
                  onKeyDown={(e) => {
                    if (
                      ["Backspace", "Delete", "Tab", "Escape", "Enter", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key) ||
                      (e.ctrlKey || e.metaKey)
                    ) {
                      return;
                    }
                    if (!/^\d$/.test(e.key)) {
                      e.preventDefault();
                    }
                  }}
                  className="w-full p-2 rounded-lg border border-slate-300 bg-white font-mono text-xs"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Landmark / Reference Point</label>
                <input
                  type="text"
                  placeholder="e.g. Near Metro Station Pillar 42"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 bg-white text-xs"
                />
              </div>
            </div>

            {/* Distance, Direction, Beat Number */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200/60">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Direction from Police Station</label>
                <select
                  value={directionFromPs}
                  onChange={(e) => setDirectionFromPs(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 bg-white text-xs font-semibold"
                >
                  <option value="">-- Select Direction --</option>
                  {DIRECTION_FROM_PS_OPTIONS.map((dir) => (
                    <option key={dir} value={dir}>
                      {dir}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Distance from PS (in Kilometres)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="e.g. 1.5"
                  value={distanceKm}
                  onKeyDown={(e) => {
                    if (e.key === "-" || e.key === "e" || e.key === "E" || e.key === "+") {
                      e.preventDefault();
                    }
                  }}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "" || (!isNaN(Number(val)) && Number(val) >= 0)) {
                      setDistanceKm(val);
                    }
                  }}
                  className="w-full p-2 rounded-lg border border-slate-300 bg-white font-mono text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Beat Number</label>
                <input
                  type="text"
                  placeholder="e.g. Beat No. 2 / Sector 29"
                  value={beatNo}
                  onChange={(e) => setBeatNo(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 bg-white text-xs"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Outside Limit Details */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 text-xs">
                4. Outside Police Station Jurisdiction Limits (बाहरी थाना सीमा)
              </span>
              <label className="flex items-center gap-1.5 cursor-pointer font-bold text-purple-900">
                <input
                  type="checkbox"
                  checked={outsidePs}
                  onChange={(e) => setOutsidePs(e.target.checked)}
                  className="rounded text-purple-600"
                />
                <span>Incident Place Outside PS Limits?</span>
              </label>
            </div>

            {outsidePs && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Outside State</label>
                  <input
                    type="text"
                    placeholder="e.g. Delhi, Punjab"
                    value={outsideState}
                    onChange={(e) => setOutsideState(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 bg-white text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Outside District</label>
                  <input
                    type="text"
                    placeholder="e.g. South West Delhi"
                    value={outsideDistrict}
                    onChange={(e) => setOutsideDistrict(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 bg-white text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Outside Police Station Name</label>
                  <input
                    type="text"
                    placeholder="e.g. PS Vasant Kunj"
                    value={outsidePsName}
                    onChange={(e) => setOutsidePsName(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 bg-white text-xs"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions: Save, Clear, Close */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <Button type="button" variant="outline" size="sm" onClick={onClose} className="text-xs">
            Close
          </Button>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClear}
              className="text-xs text-slate-600 flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Clear
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              className="bg-[#0b192c] hover:bg-slate-800 text-white text-xs flex items-center gap-1.5 px-5 font-bold"
            >
              <Check className="w-3.5 h-3.5" />
              Save Occurrence
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
