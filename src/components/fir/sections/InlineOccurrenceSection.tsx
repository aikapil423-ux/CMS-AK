"use client";

import React, { useState, useEffect } from "react";
import {
  MapPin,
  Plus,
  Trash2,
  Edit2,
  Check,
  RotateCcw,
  AlertCircle,
  Compass,
} from "lucide-react";
import { FIROccurrenceItem } from "@/types";
import { Button } from "@/components/ui/button";
import { DatePickerDDMMYYYY } from "@/components/ui/date-picker-ddmmyyyy";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DIRECTION_FROM_PS_OPTIONS, getDynamicDirectionFromPs } from "@/components/fir/firDropdownConstants";
import { VoiceInputButton } from "@/components/ui/voice-input-button";

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

export interface InlineOccurrenceSectionProps {
  occurrencesList: ExtendedFIROccurrenceItem[];
  onAddOccurrence: (item: ExtendedFIROccurrenceItem) => void;
  onUpdateOccurrence: (item: ExtendedFIROccurrenceItem) => void;
  onDeleteOccurrence: (id: string) => void;
}

export const InlineOccurrenceSection: React.FC<InlineOccurrenceSectionProps> = ({
  occurrencesList,
  onAddOccurrence,
  onUpdateOccurrence,
  onDeleteOccurrence,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);

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
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const handleClear = () => {
    setEditingId(null);
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

  const handleEditClick = (occ: ExtendedFIROccurrenceItem) => {
    setEditingId(occ.id);
    setIsDateKnown(occ.isDateKnown ?? occ.isKnownDate ?? true);
    setDateFrom(occ.dateFrom || "");
    setTimeFrom(occ.timeFrom || "");
    setDateTo(occ.dateTo || "");
    setTimeTo(occ.timeTo || "");
    setDay(occ.day || "Monday");
    setInfoReceivedDate(occ.infoReceivedDate || new Date().toISOString().split("T")[0]);
    setInfoReceivedTime(occ.infoReceivedTime || new Date().toTimeString().slice(0, 5));
    setIsForestPlace(occ.isForestPlace || false);
    setDelayInRegistrationByPolice(occ.delayInRegistrationByPolice || "");
    setDelayInReportingByComplainant(occ.delayInReportingByComplainant || occ.reasonsForDelay || "");
    setHouseNo(occ.houseNo || "");
    setStreetName(occ.streetName || "");
    setArea(occ.area || "");
    setCity(occ.city || "Gurugram");
    setTehsil(occ.tehsil || "Gurugram");
    setPincode(occ.pincode || "");
    setOutsidePs(occ.outsidePs || false);
    setOutsideState(occ.outsideState || "");
    setOutsideDistrict(occ.outsideDistrict || "");
    setOutsidePsName(occ.outsidePsName || "");
    setIsOrganisedCrime(occ.isOrganisedCrime || false);
    setDirectionFromPs(occ.directionFromPs || "EAST");
    setDistanceKm(String(occ.distanceKm || "1.5"));
    setBeatNo(occ.beatNo || "Beat No. 2");
    setLandmark(occ.landmark || "");
    setErrorMsg(null);

    // Scroll to the top of the form smoothly
    const formEl = document.getElementById("occurrence-form-card");
    if (formEl) formEl.scrollIntoView({ behavior: "smooth" });
  };

  const handleSaveOccurrence = () => {
    setErrorMsg(null);
    if (!area.trim() && !streetName.trim() && !city.trim()) {
      setErrorMsg("Please specify the Colony / Locality / Area or City for the occurrence place.");
      return;
    }

    const payload: ExtendedFIROccurrenceItem = {
      id: editingId || `occ-${Date.now()}`,
      srNo: editingId
        ? occurrencesList.find((it) => it.id === editingId)?.srNo || 1
        : occurrencesList.length + 1,
      isDateKnown,
      isKnownDate: isDateKnown,
      dateFrom,
      timeFrom,
      dateTo: isDateKnown ? dateTo : undefined,
      timeTo: isDateKnown ? timeTo : undefined,
      day,
      timePeriod: "Morning / General",
      infoReceivedDate,
      infoReceivedTime,
      isForestPlace,
      delayInRegistrationByPolice,
      delayInReportingByComplainant,
      reasonsForDelay: delayInReportingByComplainant || delayInRegistrationByPolice,
      houseNo,
      streetName,
      area,
      city,
      tehsil,
      pincode,
      outsidePs,
      outsideState: outsidePs ? outsideState : undefined,
      outsideDistrict: outsidePs ? outsideDistrict : undefined,
      outsidePsName: outsidePs ? outsidePsName : undefined,
      isOrganisedCrime,
      directionFromPs,
      distanceKm,
      beatNo,
      landmark,
    };

    if (editingId) {
      onUpdateOccurrence(payload);
      setSuccessNotice("Occurrence entry updated successfully!");
    } else {
      onAddOccurrence(payload);
      setSuccessNotice("Occurrence entry added to list!");
    }

    handleClear();
    setTimeout(() => setSuccessNotice(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* 1. OCCURRENCE ENTRY FORM (DIRECTLY ON TAB) */}
      <Card id="occurrence-form-card" className="border-slate-200 shadow-xs">
        <CardHeader className="py-3 px-4 bg-slate-50 border-b border-slate-200 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600" />
              {editingId ? "Edit Occurrence Particulars (घटना स्थल संपादित करें)" : "Place & Occurrence of Offence Form (घटना स्थल एवं समय विवरण)"}
            </CardTitle>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Fill occurrence particulars below and click &quot;{editingId ? "Update Occurrence" : "Add to Occurrence List"}&quot;.
            </p>
          </div>
          {editingId && (
            <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
              Editing Occurrence #{occurrencesList.findIndex((it) => it.id === editingId) + 1}
            </span>
          )}
        </CardHeader>
        <CardContent className="p-4 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
          {successNotice && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 flex items-center gap-2 font-bold animate-in fade-in-30">
              <Check className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successNotice}</span>
            </div>
          )}

          {/* Section 1: Occurrence Information */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-blue-600" />
                1. Occurrence Information (घटना का समय एवं विवरण)
              </span>
              <div className="flex items-center gap-4">
                <span className="text-slate-600 font-semibold">Is Date Known? (दिनांक ज्ञात?)</span>
                <label className="flex items-center gap-1.5 cursor-pointer font-bold">
                  <input
                    type="radio"
                    name="occKnownDate"
                    checked={isDateKnown}
                    onChange={() => setIsDateKnown(true)}
                  />
                  <span>Yes (हाँ)</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer font-bold">
                  <input
                    type="radio"
                    name="occKnownDate"
                    checked={!isDateKnown}
                    onChange={() => setIsDateKnown(false)}
                  />
                  <span>No (अज्ञात)</span>
                </label>
              </div>
            </div>

            {/* Date / Time From & To */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Date From (दिनांक से) <span className="text-red-500">*</span>
                </label>
                <DatePickerDDMMYYYY
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  placeholder="DD/MM/YYYY"
                  size="sm"
                  required
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Time From (समय से)</label>
                <input
                  type="time"
                  value={timeFrom}
                  onChange={(e) => setTimeFrom(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 bg-white font-mono text-xs"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Date To (दिनांक तक)</label>
                <DatePickerDDMMYYYY
                  disabled={!isDateKnown}
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  placeholder="DD/MM/YYYY"
                  size="sm"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Time To (समय तक)</label>
                <input
                  type="time"
                  disabled={!isDateKnown}
                  value={timeTo}
                  onChange={(e) => setTimeTo(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 bg-white font-mono text-xs disabled:opacity-50"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Day of Week (दिन)</label>
                <select
                  value={day}
                  onChange={(e) => setDay(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 bg-white text-xs"
                >
                  <option value="Monday">Monday (सोमवार)</option>
                  <option value="Tuesday">Tuesday (मंगलवार)</option>
                  <option value="Wednesday">Wednesday (बुधवार)</option>
                  <option value="Thursday">Thursday (गुरुवार)</option>
                  <option value="Friday">Friday (शुक्रवार)</option>
                  <option value="Saturday">Saturday (शनिवार)</option>
                  <option value="Sunday">Sunday (रविवार)</option>
                </select>
              </div>
            </div>

            {/* Information Received Date/Time & Forest Place */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200/60">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Info Received Date (सूचना प्राप्त दिनांक) <span className="text-red-500">*</span>
                </label>
                <DatePickerDDMMYYYY
                  value={infoReceivedDate}
                  onChange={(e) => setInfoReceivedDate(e.target.value)}
                  placeholder="DD/MM/YYYY"
                  size="sm"
                  required
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Info Received Time (समय) <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  value={infoReceivedTime}
                  onChange={(e) => setInfoReceivedTime(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 bg-white font-mono text-xs"
                  required
                />
              </div>
              <div className="flex items-center pt-5">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                  <input
                    type="checkbox"
                    checked={isForestPlace}
                    onChange={(e) => setIsForestPlace(e.target.checked)}
                    className="rounded text-emerald-600"
                  />
                  <span>Is Forest / Sanctuary Place? (वन / अभयारण्य क्षेत्र)</span>
                </label>
              </div>
            </div>

            {/* Organised Crime */}
            <div className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-lg">
              <span className="font-bold text-slate-800 text-xs">
                Is Organised Crime involved in Occurrence? (संगठित अपराध?)
              </span>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-1.5 cursor-pointer font-bold">
                  <input
                    type="radio"
                    name="orgCrime"
                    checked={isOrganisedCrime}
                    onChange={() => setIsOrganisedCrime(true)}
                  />
                  <span>Yes (हाँ)</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer font-bold">
                  <input
                    type="radio"
                    name="orgCrime"
                    checked={!isOrganisedCrime}
                    onChange={() => setIsOrganisedCrime(false)}
                  />
                  <span>No (नहीं)</span>
                </label>
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
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700 block">
                    Delay in Reporting by Complainant
                  </label>
                  <VoiceInputButton
                    onTranscript={(t) => setDelayInReportingByComplainant((prev) => (prev ? prev + " " + t : t))}
                    currentValue={delayInReportingByComplainant}
                    fieldLabel="Delay by Complainant"
                    iconOnly={true}
                  />
                </div>
                <input
                  type="text"
                  placeholder="e.g. Complainant was hospitalized / Fear of retaliation..."
                  value={delayInReportingByComplainant}
                  onChange={(e) => setDelayInReportingByComplainant(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 bg-white text-xs"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700 block">
                    Delay in Registration by Police
                  </label>
                  <VoiceInputButton
                    onTranscript={(t) => setDelayInRegistrationByPolice((prev) => (prev ? prev + " " + t : t))}
                    currentValue={delayInRegistrationByPolice}
                    fieldLabel="Delay by Police"
                    iconOnly={true}
                  />
                </div>
                <input
                  type="text"
                  placeholder="e.g. Preliminary enquiry under Sec 173(3) BNSS / Verification..."
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
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700 block">House / Building No.</label>
                  <VoiceInputButton
                    onTranscript={(t) => setHouseNo(t)}
                    currentValue={houseNo}
                    fieldLabel="House No"
                    iconOnly={true}
                  />
                </div>
                <input
                  type="text"
                  placeholder="e.g. H.No. 452, Tower B"
                  value={houseNo}
                  onChange={(e) => setHouseNo(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 bg-white text-xs"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700 block">Street Name</label>
                  <VoiceInputButton
                    onTranscript={(t) => setStreetName(t)}
                    currentValue={streetName}
                    fieldLabel="Street Name"
                    iconOnly={true}
                  />
                </div>
                <input
                  type="text"
                  placeholder="e.g. Main Market Road, NH-44"
                  value={streetName}
                  onChange={(e) => setStreetName(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 bg-white text-xs"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700 block">
                    Colony / Locality / Area <span className="text-red-500">*</span>
                  </label>
                  <VoiceInputButton
                    onTranscript={(t) => setArea(t)}
                    currentValue={area}
                    fieldLabel="Colony / Locality / Area"
                    iconOnly={true}
                  />
                </div>
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
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700 block">Village / Town / City</label>
                  <VoiceInputButton
                    onTranscript={(t) => setCity(t)}
                    currentValue={city}
                    fieldLabel="Village / Town / City"
                    iconOnly={true}
                  />
                </div>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 bg-white text-xs"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700 block">Tehsil / Block / Mandal</label>
                  <VoiceInputButton
                    onTranscript={(t) => setTehsil(t)}
                    currentValue={tehsil}
                    fieldLabel="Tehsil"
                    iconOnly={true}
                  />
                </div>
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
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700 block">Landmark / Reference Point</label>
                  <VoiceInputButton
                    onTranscript={(t) => setLandmark(t)}
                    currentValue={landmark}
                    fieldLabel="Landmark"
                    iconOnly={true}
                  />
                </div>
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
                  {getDynamicDirectionFromPs().map((dir) => (
                    <option key={dir} value={dir}>
                      {dir}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Distance from PS (in KM)</label>
                <input
                  type="number"
                  step="0.1"
                  value={distanceKm}
                  onChange={(e) => setDistanceKm(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 bg-white font-mono text-xs"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700 block">Beat / Sector Number</label>
                  <VoiceInputButton
                    onTranscript={(t) => setBeatNo(t)}
                    currentValue={beatNo}
                    fieldLabel="Beat Number"
                    iconOnly={true}
                  />
                </div>
                <input
                  type="text"
                  placeholder="e.g. Beat No. 2 / Sector 29"
                  value={beatNo}
                  onChange={(e) => setBeatNo(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 bg-white text-xs"
                />
              </div>
            </div>

            {/* Outside PS Jurisdiction */}
            <div className="pt-2 border-t border-slate-200/60">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-red-900 mb-2">
                <input
                  type="checkbox"
                  checked={outsidePs}
                  onChange={(e) => setOutsidePs(e.target.checked)}
                  className="rounded text-red-600"
                />
                <span>Was offence committed outside Police Station limits? (थाना सीमा से बाहर?)</span>
              </label>

              {outsidePs && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-red-50/60 rounded-lg border border-red-200 animate-in fade-in-20">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-slate-700 block">Outside State</label>
                      <VoiceInputButton
                        onTranscript={(t) => setOutsideState(t)}
                        currentValue={outsideState}
                        fieldLabel="Outside State"
                        iconOnly={true}
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="e.g. Uttar Pradesh"
                      value={outsideState}
                      onChange={(e) => setOutsideState(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-300 bg-white text-xs"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-slate-700 block">Outside District</label>
                      <VoiceInputButton
                        onTranscript={(t) => setOutsideDistrict(t)}
                        currentValue={outsideDistrict}
                        fieldLabel="Outside District"
                        iconOnly={true}
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="e.g. Panipat"
                      value={outsideDistrict}
                      onChange={(e) => setOutsideDistrict(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-300 bg-white text-xs"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-slate-700 block">Outside Police Station Name</label>
                      <VoiceInputButton
                        onTranscript={(t) => setOutsidePsName(t)}
                        currentValue={outsidePsName}
                        fieldLabel="Outside PS Name"
                        iconOnly={true}
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="e.g. PS Sanauli"
                      value={outsidePsName}
                      onChange={(e) => setOutsidePsName(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-300 bg-white text-xs"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Form Action Buttons */}
          <div className="flex items-center justify-between pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClear}
              className="text-xs text-slate-600 hover:text-slate-800 flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {editingId ? "Cancel Edit & Reset" : "Clear Form"}
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSaveOccurrence}
              className="text-xs bg-emerald-700 hover:bg-emerald-800 text-white font-bold flex items-center gap-1.5 px-4 h-9 shadow-xs"
            >
              <Check className="w-4 h-4" />
              {editingId ? "Update Occurrence Entry" : "Add to Occurrence List"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 2. RECORDED OCCURRENCES TABLE (DIRECTLY ON TAB) */}
      <Card className="border-slate-200 shadow-xs">
        <CardHeader className="py-2.5 px-4 bg-slate-50 border-b border-slate-200 flex flex-row items-center justify-between">
          <CardTitle className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-600" />
            Recorded Occurrences List (दर्ज घटना स्थल सूची - {occurrencesList.length})
          </CardTitle>
          <span className="text-[11px] font-semibold text-slate-500">
            Printed Section 5 of FIR IIF-I
          </span>
        </CardHeader>
        <CardContent className="p-4 space-y-4 text-xs">
          {occurrencesList.length > 0 ? (
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-2.5 w-12">S.No.</th>
                    <th className="p-2.5">Date / Time (From - To)</th>
                    <th className="p-2.5">Direction &amp; Distance</th>
                    <th className="p-2.5">Area / Landmark</th>
                    <th className="p-2.5">Limits / Beat</th>
                    <th className="p-2.5 w-24 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {occurrencesList.map((occ, idx) => (
                    <tr
                      key={occ.id}
                      className={`hover:bg-slate-50 transition-colors ${
                        editingId === occ.id ? "bg-amber-50/70 border-l-4 border-amber-500" : ""
                      }`}
                    >
                      <td className="p-2.5 font-bold text-slate-500">{occ.srNo || idx + 1}</td>
                      <td className="p-2.5">
                        <div>
                          <strong>{occ.dateFrom || "Unknown Date"}</strong> {occ.timeFrom || ""}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          to {occ.dateTo || "—"} {occ.timeTo || ""} ({occ.day || "Day"})
                        </div>
                        {occ.isForestPlace && (
                          <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold bg-green-100 text-green-800">
                            Forest Reserve
                          </span>
                        )}
                      </td>
                      <td className="p-2.5">
                        <span className="font-semibold text-slate-900">{occ.distanceKm} KM</span>{" "}
                        <span className="font-bold text-blue-700">({occ.directionFromPs})</span>
                      </td>
                      <td className="p-2.5">
                        <span className="font-semibold text-slate-900">{occ.area}</span>
                        {occ.landmark && <span className="text-slate-500"> (Nr: {occ.landmark})</span>}
                        {occ.reasonsForDelay && (
                          <div className="text-[11px] text-amber-700 font-medium">
                            Delay: {occ.reasonsForDelay}
                          </div>
                        )}
                      </td>
                      <td className="p-2.5">
                        <div className="font-mono text-[11px]">{occ.beatNo || "—"}</div>
                        {occ.outsidePs ? (
                          <span className="text-[10px] text-red-700 font-bold">
                            Outside PS: {occ.outsidePsName || "Yes"}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">Within Limits</span>
                        )}
                      </td>
                      <td className="p-2.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleEditClick(occ)}
                            className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                            title="Edit Occurrence (ऊपर फॉर्म में लोड करें)"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteOccurrence(occ.id)}
                            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                            title="Delete Occurrence"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-6 text-slate-400 bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
              <MapPin className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="font-medium text-slate-600">No occurrence entries in list yet.</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Fill the form above and click &quot;Add to Occurrence List&quot; to record occurrence points.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
