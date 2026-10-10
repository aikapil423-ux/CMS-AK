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

export const OccurrenceDialog: React.FC<OccurrenceDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  initialItem,
  initialData,
}) => {
  const effectiveItem = initialItem || initialData;
  // Occurrence Information
  const [isDateKnown, setIsDateKnown] = useState(true);
  const [dateFrom, setDateFrom] = useState(() => new Date().toISOString().split("T")[0]);
  const [timeFrom, setTimeFrom] = useState("10:00");
  const [dateTo, setDateTo] = useState("");
  const [timeTo, setTimeTo] = useState("12:00");
  const [day, setDay] = useState("Monday");
  const [infoReceivedDate, setInfoReceivedDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [infoReceivedTime, setInfoReceivedTime] = useState(() => new Date().toTimeString().slice(0, 5));
  const [isForestPlace, setIsForestPlace] = useState(false);

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
  const [directionFromPs, setDirectionFromPs] = useState("EAST");
  const [distanceKm, setDistanceKm] = useState("1.5");
  const [beatNo, setBeatNo] = useState("Beat No. 2");
  const [landmark, setLandmark] = useState("");

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleClear = () => {
    setIsDateKnown(true);
    setDateFrom(new Date().toISOString().split("T")[0]);
    setTimeFrom("10:00");
    setDateTo("");
    setTimeTo("");
    setDay("Monday");
    setInfoReceivedDate(new Date().toISOString().split("T")[0]);
    setInfoReceivedTime(new Date().toTimeString().slice(0, 5));
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
    setDirectionFromPs("EAST");
    setDistanceKm("1.5");
    setBeatNo("Beat No. 2");
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
      setDirectionFromPs(effectiveItem.directionFromPs || "EAST");
      setDistanceKm(String(effectiveItem.distanceKm || "1.5"));
      setBeatNo(effectiveItem.beatNo || "Beat No. 2");
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
                        onChange={(e) => setDateFrom(e.target.value)}
                        placeholder="DD/MM/YYYY"
                        size="sm"
                      />
                    </div>
                    <input
                      type="time"
                      value={timeFrom}
                      onChange={(e) => setTimeFrom(e.target.value)}
                      className="w-2/5 p-2 rounded-lg border border-slate-300 bg-white font-mono text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">To Date &amp; Time</label>
                  <div className="flex gap-1.5">
                    <div className="w-3/5">
                      <DatePickerDDMMYYYY
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        placeholder="DD/MM/YYYY"
                        size="sm"
                      />
                    </div>
                    <input
                      type="time"
                      value={timeTo}
                      onChange={(e) => setTimeTo(e.target.value)}
                      className="w-2/5 p-2 rounded-lg border border-slate-300 bg-white font-mono text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Day of Week</label>
                  <select
                    value={day}
                    onChange={(e) => setDay(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 bg-white text-xs"
                  >
                    <option value="Monday">Monday</option>
                    <option value="Tuesday">Tuesday</option>
                    <option value="Wednesday">Wednesday</option>
                    <option value="Thursday">Thursday</option>
                    <option value="Friday">Friday</option>
                    <option value="Saturday">Saturday</option>
                    <option value="Sunday">Sunday</option>
                  </select>
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
                      onChange={(e) => setInfoReceivedDate(e.target.value)}
                      placeholder="DD/MM/YYYY"
                      size="sm"
                    />
                  </div>
                  <input
                    type="time"
                    value={infoReceivedTime}
                    onChange={(e) => setInfoReceivedTime(e.target.value)}
                    className="w-2/5 p-2 rounded-lg border border-slate-300 bg-white font-mono text-xs"
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
                  placeholder="e.g. 122001"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
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
                  className="w-full p-2 rounded-lg border border-slate-300 bg-white text-xs"
                >
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
                  value={distanceKm}
                  onChange={(e) => setDistanceKm(e.target.value)}
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
