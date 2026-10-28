"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Search,
  Plus,
  Trash2,
  Calendar,
  Clock,
  Printer,
  CheckCircle2,
  AlertTriangle,
  Building2,
  User,
  Shield,
  FileText,
  MapPin,
  Sparkles,
  Phone,
  RotateCcw,
} from "lucide-react";
import {
  LostPropertyRecord,
  LostPropertyItem,
  AddressInfo,
  HARYANA_DISTRICTS,
  MOCK_ENQUIRY_OFFICERS_LIST,
  GDSearchResultItem,
} from "@/types/lostProperty";
import { GDSearchModal } from "./GDSearchModal";
import { AddPropertyItemModal } from "./AddPropertyItemModal";
import { LostPropertyPreviewModal } from "./LostPropertyPreviewModal";

interface RegisterLostPropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (newRecord: LostPropertyRecord) => void;
  initialRecord?: LostPropertyRecord | null;
}

export const RegisterLostPropertyModal: React.FC<RegisterLostPropertyModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialRecord,
}) => {
  // Main Tab State
  const [activeTab, setActiveTab] = useState<
    "PROPERTY_DETAILS" | "COMPLAINANT_DETAILS" | "EO_DETAILS"
  >("PROPERTY_DETAILS");

  // Sub Modals State
  const [isGdSearchOpen, setIsGdSearchOpen] = useState(false);
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);

  // Form Fields - Tab 1: Property Details
  const [gdNumber, setGdNumber] = useState(initialRecord?.gdNumber || "");
  const [gdDateTime, setGdDateTime] = useState(
    initialRecord?.gdDateTime || ""
  );
  const [dateOfPropertyMissing, setDateOfPropertyMissing] = useState(
    initialRecord?.dateOfPropertyMissing || ""
  );
  const [timeOfPropertyMissing, setTimeOfPropertyMissing] = useState(
    initialRecord?.timeOfPropertyMissing || ""
  );
  const [district, setDistrict] = useState(
    initialRecord?.district || ""
  );
  const [year, setYear] = useState(initialRecord?.year || String(new Date().getFullYear()));
  const [placeFromWhereMissing, setPlaceFromWhereMissing] = useState(
    initialRecord?.placeFromWhereMissing || ""
  );
  const [policeStation, setPoliceStation] = useState(
    initialRecord?.policeStation || ""
  );

  // Property Items Table
  const [properties, setProperties] = useState<LostPropertyItem[]>(
    initialRecord?.properties || []
  );

  // Form Fields - Tab 2: Complainant Details (Personal Information)
  const [uid, setUid] = useState(initialRecord?.uid || "");
  const [firstName, setFirstName] = useState(initialRecord?.firstName || "");
  const [middleName, setMiddleName] = useState(initialRecord?.middleName || "");
  const [lastName, setLastName] = useState(initialRecord?.lastName || "");
  const [gender, setGender] = useState<any>(initialRecord?.gender || "");
  const [occupation, setOccupation] = useState(
    initialRecord?.occupation || ""
  );
  const [relationType, setRelationType] = useState<any>(
    initialRecord?.relationType || ""
  );
  const [relativeName, setRelativeName] = useState(
    initialRecord?.relativeName || ""
  );

  // Mobile list
  const [mobileInput, setMobileInput] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [mobileNumbers, setMobileNumbers] = useState<string[]>(
    initialRecord?.mobileNumbers || ["+91 9812033441"]
  );

  // Age Panel
  const [dob, setDob] = useState(initialRecord?.dob || "");
  const [yearOfBirth, setYearOfBirth] = useState(
    initialRecord?.yearOfBirth || ""
  );
  const [ageYears, setAgeYears] = useState(initialRecord?.ageYears || "");
  const [ageMonths, setAgeMonths] = useState(initialRecord?.ageMonths || "");
  const [ageRangeFrom, setAgeRangeFrom] = useState(
    initialRecord?.ageRangeFrom || ""
  );
  const [ageRangeTo, setAgeRangeTo] = useState(initialRecord?.ageRangeTo || "");

  // Address: Present & Permanent
  const defaultPresentAddress: AddressInfo = {houseNo:"",streetName:"",colony:"",villageTownCity:"",tehsil:"",country:"",state:"",district:"",policeStation:"",pincode:""};

  const [presentAddress, setPresentAddress] = useState<AddressInfo>(
    initialRecord?.presentAddress || defaultPresentAddress
  );
  const [sameAsPresent, setSameAsPresent] = useState<boolean>(
    initialRecord?.sameAsPresent ?? true
  );
  const [permanentAddress, setPermanentAddress] = useState<AddressInfo>(
    initialRecord?.permanentAddress || defaultPresentAddress
  );

  // Tab 3: Details of Enquiry Officer
  const [nameOfEo, setNameOfEo] = useState(
    initialRecord?.nameOfEo || ""
  );
  const [eoRank, setEoRank] = useState(
    initialRecord?.eoRank || ""
  );
  const [eoNumber, setEoNumber] = useState(initialRecord?.eoNumber || "");
  const [remarks, setRemarks] = useState(
    initialRecord?.remarks || ""
  );
  const [expectedDateToComplete, setExpectedDateToComplete] = useState(
    initialRecord?.expectedDateToComplete || ""
  );

  // Autocomplete state for Name
  const [nameSuggestions, setNameSuggestions] = useState<string[]>([]);
  const commonNames = [
    "Raju Singh",
    "Rajesh Kumar",
    "Rakesh Sharma",
    "Ramesh Verma",
    "Rahul Yadav",
    "Ram Avtar",
    "Ravi Kant",
    "Rajinder Singh",
  ];

  // Sync permanent address when sameAsPresent is true
  useEffect(() => {
    if (sameAsPresent) {
      setPermanentAddress({ ...presentAddress });
    }
  }, [sameAsPresent, presentAddress]);

  if (!isOpen) return null;

  // Handle Enquiry Officer change
  const handleEoChange = (selectedEoString: string) => {
    setNameOfEo(selectedEoString);
    const found = MOCK_ENQUIRY_OFFICERS_LIST.find(
      (eo) => eo.display === selectedEoString
    );
    if (found) {
      setEoRank(found.rank);
      setEoNumber(found.number);
    }
  };

  // Handle GD select
  const handleSelectGd = (gd: GDSearchResultItem) => {
    setGdNumber(gd.gdNumber);
    setGdDateTime(gd.dateTime);
  };

  // Add Mobile Number
  const handleAddMobile = () => {
    if (mobileInput.trim()) {
      const fullMobile = `${countryCode} ${mobileInput.trim()}`;
      if (!mobileNumbers.includes(fullMobile)) {
        setMobileNumbers([...mobileNumbers, fullMobile]);
      }
      setMobileInput("");
    }
  };

  const handleRemoveMobile = (index: number) => {
    setMobileNumbers(mobileNumbers.filter((_, i) => i !== index));
  };

  // Reset / Clear Age Panel
  const handleResetAge = () => {
    setDob("");
    setYearOfBirth("");
    setAgeYears("");
    setAgeMonths("");
    setAgeRangeFrom("");
    setAgeRangeTo("");
  };

  // Handle Name Autocomplete
  const handleFirstNameChange = (val: string) => {
    setFirstName(val);
    if (val.trim().length >= 2) {
      const matches = commonNames.filter((n) =>
        n.toLowerCase().includes(val.toLowerCase())
      );
      setNameSuggestions(matches);
    } else {
      setNameSuggestions([]);
    }
  };

  // Prepare full record
  const currentRecord: Partial<LostPropertyRecord> = {
    id: initialRecord?.id || `lp_${Date.now()}`,
    registrationNumber: initialRecord?.registrationNumber || "",
    registrationYear: year,
    createdAt: initialRecord?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: initialRecord?.status || "OPEN",
    gdNumber,
    gdDateTime,
    dateOfPropertyMissing,
    timeOfPropertyMissing,
    district,
    year,
    placeFromWhereMissing,
    policeStation,
    properties,
    uid,
    firstName,
    middleName,
    lastName,
    gender,
    occupation,
    relationType,
    relativeName,
    mobileNumbers,
    dob,
    yearOfBirth,
    ageYears,
    ageMonths,
    ageRangeFrom,
    ageRangeTo,
    presentAddress,
    sameAsPresent,
    permanentAddress,
    nameOfEo,
    eoRank,
    eoNumber,
    remarks,
    expectedDateToComplete,
  };

  // Form Submit Handler
  const handleSubmitClick = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // Validations
    if (!gdNumber.trim()) {
      alert("Please select or enter GD/SD/DD Number *");
      setActiveTab("PROPERTY_DETAILS");
      return;
    }
    if (!dateOfPropertyMissing || !timeOfPropertyMissing) {
      alert("Please enter Date and Time of Property Missing *");
      setActiveTab("PROPERTY_DETAILS");
      return;
    }
    if (!placeFromWhereMissing.trim()) {
      alert("Please enter Place from where Property is Reported missing *");
      setActiveTab("PROPERTY_DETAILS");
      return;
    }
    if (!properties || properties.length === 0) {
      alert("Please add at least one Lost Property item in the Property table *");
      setActiveTab("PROPERTY_DETAILS");
      return;
    }
    if (!firstName.trim() || !lastName.trim()) {
      alert("Please enter Complainant First Name and Last Name *");
      setActiveTab("COMPLAINANT_DETAILS");
      return;
    }
    if (!relativeName.trim()) {
      alert("Please enter Relative Name *");
      setActiveTab("COMPLAINANT_DETAILS");
      return;
    }
    if (!presentAddress.villageTownCity.trim()) {
      alert("Please enter Village/Town/City in Present Address *");
      setActiveTab("COMPLAINANT_DETAILS");
      return;
    }
    if (!nameOfEo) {
      alert("Please select Name of Enquiry Officer (EO) *");
      setActiveTab("EO_DETAILS");
      return;
    }

    // Official prompt as specified by user:
    const confirmed = window.confirm("Do you want to submit the record?");
    if (confirmed) {
      // Open Preview Modal
      setIsPreviewOpen(true);
    }
  };

  const handlePrintClick = () => {
    setIsPreviewOpen(true);
  };

  const handleClearAll = () => {
    if (
      window.confirm("Are you sure you want to clear all fields in the form?")
    ) {
      setGdNumber("");
      setGdDateTime("");
      setPlaceFromWhereMissing("");
      setProperties([]);
      setFirstName("");
      setMiddleName("");
      setLastName("");
      setRelativeName("");
      setMobileNumbers([]);
      handleResetAge();
      setRemarks("");
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-2xs animate-in fade-in duration-150">
        <div className="bg-white rounded-xl shadow-2xl border border-slate-300 w-full max-w-5xl max-h-[96vh] flex flex-col overflow-hidden text-xs">
          {/* Header */}
          <div className="bg-blue-950 text-white px-5 py-3.5 flex items-center justify-between border-b border-blue-900 shadow">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-blue-900 rounded-lg border border-blue-700">
                <Shield className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h2 className="font-bold text-sm sm:text-base tracking-wide flex items-center gap-2">
                  <span>Register Lost Property (खोई संपत्ति पंजीकरण)</span>
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded font-mono font-medium">
                    CCTNS FORM IIF-Lost
                  </span>
                </h2>
                <p className="text-[11px] text-blue-200">
                  Haryana Police Portal &bull; State Crime Records Bureau (SCRB)
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="text-blue-300 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs (3 Main Statutory Tabs) */}
          <div className="bg-slate-100 border-b border-slate-300 px-4 pt-2 flex items-center gap-1 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab("PROPERTY_DETAILS")}
              className={`px-4 py-2 font-bold text-xs rounded-t-lg transition-all cursor-pointer flex items-center gap-2 border-t border-x ${
                activeTab === "PROPERTY_DETAILS"
                  ? "bg-white text-blue-950 border-slate-300 border-b-white -mb-px shadow-2xs font-black"
                  : "bg-slate-200/80 text-slate-600 border-transparent hover:bg-slate-200"
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-blue-700" />
              <span>1. Property Details (संपत्ति विवरण)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("COMPLAINANT_DETAILS")}
              className={`px-4 py-2 font-bold text-xs rounded-t-lg transition-all cursor-pointer flex items-center gap-2 border-t border-x ${
                activeTab === "COMPLAINANT_DETAILS"
                  ? "bg-white text-blue-950 border-slate-300 border-b-white -mb-px shadow-2xs font-black"
                  : "bg-slate-200/80 text-slate-600 border-transparent hover:bg-slate-200"
              }`}
            >
              <User className="w-3.5 h-3.5 text-blue-700" />
              <span>2. Complainant Details (शिकायतकर्ता विवरण)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("EO_DETAILS")}
              className={`px-4 py-2 font-bold text-xs rounded-t-lg transition-all cursor-pointer flex items-center gap-2 border-t border-x ${
                activeTab === "EO_DETAILS"
                  ? "bg-white text-blue-950 border-slate-300 border-b-white -mb-px shadow-2xs font-black"
                  : "bg-slate-200/80 text-slate-600 border-transparent hover:bg-slate-200"
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-blue-700" />
              <span>3. Details of Enquiry Officer (जांच अधिकारी विवरण)</span>
            </button>
          </div>

          {/* Form Content Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50 space-y-6">
            {/* ============================================================== */}
            {/* TAB 1: PROPERTY DETAILS                                        */}
            {/* ============================================================== */}
            {activeTab === "PROPERTY_DETAILS" && (
              <div className="space-y-5 animate-in fade-in duration-100">
                <div className="bg-white p-4 sm:p-5 rounded-lg border border-slate-300 shadow-2xs space-y-4">
                  <h3 className="text-xs font-bold text-blue-950 uppercase tracking-wider pb-2 border-b border-slate-200 flex items-center gap-2">
                    <span>Incident &amp; GD Registration Particulars</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* GD Number with Search Icon */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        GD/SD/DD Number <span className="text-red-500">*</span>
                      </label>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          required
                          value={gdNumber}
                          onChange={(e) => setGdNumber(e.target.value)}
                          placeholder="e.g. 003"
                          className="flex-1 px-3 py-1.5 border border-slate-300 rounded-md font-mono text-xs font-bold bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                        />
                        <button
                          type="button"
                          onClick={() => setIsGdSearchOpen(true)}
                          title="Search General Diary (GD)"
                          className="px-2.5 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-md flex items-center justify-center cursor-pointer transition-colors shadow-2xs"
                        >
                          <Search className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <span className="text-[10px] text-slate-500 mt-0.5 block">
                        Search or enter GD Entry
                      </span>
                    </div>

                    {/* GD Date & Time */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        GD की तारीख और समय (GD Date &amp; Time)
                      </label>
                      <input
                        type="text"
                        readOnly
                        value={gdDateTime}
                        placeholder="22/04/2019, 11:33"
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-md font-mono text-xs bg-slate-100 text-slate-700"
                      />
                      <span className="text-[10px] text-slate-500 mt-0.5 block">
                        GD चुनने पर दिखाई देते हैं
                      </span>
                    </div>

                    {/* Date and Time of Property Missing */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Date &amp; Time of Property Missing <span className="text-red-500">*</span>
                      </label>
                      <div className="grid grid-cols-2 gap-1.5">
                        <input
                          type="date"
                          required
                          max={new Date().toISOString().split("T")[0]}
                          value={dateOfPropertyMissing}
                          onChange={(e) => setDateOfPropertyMissing(e.target.value)}
                          className="px-2 py-1.5 border border-slate-300 rounded-md text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                        />
                        <input
                          type="time"
                          required
                          value={timeOfPropertyMissing}
                          onChange={(e) => setTimeOfPropertyMissing(e.target.value)}
                          className="px-2 py-1.5 border border-slate-300 rounded-md text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                        />
                      </div>
                    </div>
                  </div>

                  {/* District, Year, Place, Police Station */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-1">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        District (जिला)
                      </label>
                      <select
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs bg-white font-medium focus:outline-none focus:ring-1 focus:ring-blue-600"
                      >
                        {HARYANA_DISTRICTS.map((dist) => (
                          <option key={dist} value={dist}>
                            {dist}
                          </option>
                        ))}
                      </select>
                      <span className="text-[10px] text-slate-500 mt-0.5 block">
                        पहले से भरा PANCHKULA
                      </span>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Year (वर्ष)
                      </label>
                      <input
                        type="text"
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs bg-white font-mono"
                      />
                      <span className="text-[10px] text-slate-500 mt-0.5 block">
                        पहले से भरा 2019
                      </span>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Police Station (थाना)
                      </label>
                      <input
                        type="text"
                        value={policeStation}
                        onChange={(e) => setPoliceStation(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs bg-white font-medium"
                      />
                      <span className="text-[10px] text-slate-500 mt-0.5 block">
                        पहले से भरा PANCHKULA SECTOR-5
                      </span>
                    </div>
                  </div>

                  {/* Place from where Property is Reported missing */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Place from where Property is Reported missing <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Bus stand PKL, Platform 1 Railway Station, etc."
                      value={placeFromWhereMissing}
                      onChange={(e) => setPlaceFromWhereMissing(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 font-medium"
                    />
                  </div>
                </div>

                {/* Property Table with Add New & Clear */}
                <div className="bg-white p-4 sm:p-5 rounded-lg border border-slate-300 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <div>
                      <h3 className="text-xs font-bold text-blue-950 uppercase tracking-wider">
                        Lost Property Item(s) Table
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Add items reported missing (Electronics, Currency, Documents, Jewellery, etc.)
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setProperties([])}
                        className="px-3 py-1.5 border border-slate-300 hover:bg-slate-100 rounded-md text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
                      >
                        Clear Table
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingItemIndex(null);
                          setIsAddItemOpen(true);
                        }}
                        className="px-3.5 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-md text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add New (नया सामान जोड़ें)</span>
                      </button>
                    </div>
                  </div>

                  {/* Table with columns: S.No., Property Category, Property sub Type, Estimated (Lost Value) (in Rs) */}
                  <div className="overflow-x-auto border border-slate-200 rounded-lg">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-[11px] font-bold text-slate-700 uppercase border-b border-slate-200">
                          <th className="py-2.5 px-3 w-14 text-center">S.No.</th>
                          <th className="py-2.5 px-4">Property Category</th>
                          <th className="py-2.5 px-4">Property sub Type</th>
                          <th className="py-2.5 px-4 text-right">Estimated (Lost Value) (in Rs)</th>
                          <th className="py-2.5 px-3 w-20 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {properties.length > 0 ? (
                          properties.map((item, index) => (
                            <tr key={item.id || index} className="hover:bg-blue-50/40">
                              <td className="py-2.5 px-3 text-center font-mono text-slate-600 font-semibold">
                                {index + 1}
                              </td>
                              <td className="py-2.5 px-4 font-semibold text-slate-800">
                                {item.category}
                              </td>
                              <td className="py-2.5 px-4">
                                <span className="font-bold text-blue-900 block">{item.subType}</span>
                                {item.makeManufacturer && (
                                  <span className="text-[11px] text-slate-600 block">
                                    Make: {item.makeManufacturer} (Qty: {item.quantity})
                                  </span>
                                )}
                                {item.identificationNumbers && item.identificationNumbers.length > 0 && (
                                  <span className="text-[10px] font-mono text-slate-500 block">
                                    {item.idType || "ID"}: {item.identificationNumbers.join(", ")}
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">
                                ₹{Number(item.estimatedValue || 0).toLocaleString("en-IN")}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setProperties(properties.filter((_, i) => i !== index));
                                  }}
                                  className="text-slate-400 hover:text-red-600 p-1 cursor-pointer"
                                  title="Remove item"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="py-6 text-center text-slate-400 italic">
                              No property items added yet. Click &quot;Add New&quot; button above.
                            </td>
                          </tr>
                        )}
                      </tbody>
                      {properties.length > 0 && (
                        <tfoot>
                          <tr className="bg-slate-50 border-t border-slate-300 font-bold">
                            <td colSpan={3} className="py-2.5 px-4 text-right text-xs uppercase tracking-wider text-slate-700">
                              Total Estimated Value:
                            </td>
                            <td className="py-2.5 px-4 text-right font-mono text-blue-950 text-sm">
                              ₹
                              {properties
                                .reduce(
                                  (sum, p) => sum + (Number(p.estimatedValue) || 0),
                                  0
                                )
                                .toLocaleString("en-IN")}
                            </td>
                            <td></td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* TAB 2: COMPLAINANT DETAILS                                     */}
            {/* ============================================================== */}
            {activeTab === "COMPLAINANT_DETAILS" && (
              <div className="space-y-5 animate-in fade-in duration-100">
                {/* 1. Personal Information */}
                <div className="bg-white p-4 sm:p-5 rounded-lg border border-slate-300 shadow-2xs space-y-4">
                  <h3 className="text-xs font-bold text-blue-950 uppercase tracking-wider pb-2 border-b border-slate-200">
                    Complainant Details &rarr; Personal Information (व्यक्तिगत विवरण)
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        UID (Aadhaar / ID)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 8910-2391-4491"
                        value={uid}
                        onChange={(e) => setUid(e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs font-mono bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                      />
                    </div>

                    <div className="relative">
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        First Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. raju"
                        value={firstName}
                        onChange={(e) => handleFirstNameChange(e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs bg-white font-medium focus:outline-none focus:ring-1 focus:ring-blue-600"
                      />
                      {/* Autocomplete suggestions */}
                      {nameSuggestions.length > 0 && (
                        <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-white border border-slate-300 rounded-md shadow-lg overflow-hidden">
                          {nameSuggestions.map((sug, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => {
                                const parts = sug.split(" ");
                                setFirstName(parts[0] || "");
                                if (parts.length > 1) {
                                  setLastName(parts.slice(1).join(" "));
                                }
                                setNameSuggestions([]);
                              }}
                              className="w-full text-left px-3 py-1.5 text-xs hover:bg-blue-50 text-slate-800 border-b border-slate-100 last:border-b-0 cursor-pointer"
                            >
                              {sug}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Middle Name
                      </label>
                      <input
                        type="text"
                        placeholder="Middle Name"
                        value={middleName}
                        onChange={(e) => setMiddleName(e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Last Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Singh"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs bg-white font-medium focus:outline-none focus:ring-1 focus:ring-blue-600"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Gender <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value as any)}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                      >
                        <option value="Select">Select</option>
                        <option value="Unknown">Unknown</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Transgender">Transgender</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Occupation (व्यवसाय)
                      </label>
                      <select
                        value={occupation}
                        onChange={(e) => setOccupation(e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                      >
                        <option value="Select">Select</option>
                        <option value="Private Service">Private Service</option>
                        <option value="Govt. Service">Govt. Service</option>
                        <option value="Business / Trader">Business / Trader</option>
                        <option value="Student">Student</option>
                        <option value="Agriculture / Farmer">Agriculture / Farmer</option>
                        <option value="Housewife">Housewife</option>
                        <option value="Self Employed">Self Employed</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Relation Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={relationType}
                        onChange={(e) => setRelationType(e.target.value as any)}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                      >
                        <option value="Select">Select</option>
                        <option value="Father">Father</option>
                        <option value="Guardian">Guardian</option>
                        <option value="Husband">Husband</option>
                        <option value="Mother">Mother</option>
                        <option value="Wife">Wife</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Relative Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Shyam Singh"
                        value={relativeName}
                        onChange={(e) => setRelativeName(e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs bg-white font-medium focus:outline-none focus:ring-1 focus:ring-blue-600"
                      />
                    </div>
                  </div>

                  {/* Mobile No. with Country code +91, number and Add button */}
                  <div className="pt-2 border-t border-slate-200">
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Mobile No.
                    </label>
                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 max-w-lg mb-2">
                      <select
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value)}
                        className="w-24 px-2 py-1.5 border border-slate-300 rounded-md text-xs bg-white font-mono"
                      >
                        <option value="+91">+91 (IN)</option>
                        <option value="+1">+1 (US)</option>
                        <option value="+44">+44 (UK)</option>
                      </select>
                      <input
                        type="tel"
                        maxLength={10}
                        placeholder="e.g. 9812033441"
                        value={mobileInput}
                        onChange={(e) => setMobileInput(e.target.value.replace(/\D/g, ""))}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddMobile();
                          }
                        }}
                        className="flex-1 px-3 py-1.5 border border-slate-300 rounded-md text-xs font-mono bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                      />
                      <button
                        type="button"
                        onClick={handleAddMobile}
                        className="px-3.5 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-md text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </button>
                    </div>

                    {/* Mobile numbers table: S.No., Mobile No., Delete */}
                    {mobileNumbers.length > 0 && (
                      <div className="max-w-md border border-slate-200 rounded-md overflow-hidden mt-2">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-slate-100 text-[10px] font-bold text-slate-600 uppercase border-b border-slate-200">
                              <th className="py-1.5 px-3 w-12 text-center">S.No.</th>
                              <th className="py-1.5 px-3">Mobile No.</th>
                              <th className="py-1.5 px-3 w-16 text-center">Delete</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {mobileNumbers.map((num, idx) => (
                              <tr key={idx} className="hover:bg-slate-50">
                                <td className="py-1.5 px-3 text-center font-mono text-slate-500">
                                  {idx + 1}
                                </td>
                                <td className="py-1.5 px-3 font-mono font-medium text-slate-800">
                                  {num}
                                </td>
                                <td className="py-1.5 px-3 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveMobile(idx)}
                                    className="text-slate-400 hover:text-red-600 p-0.5 cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Age Panel */}
                <div className="bg-white p-4 sm:p-5 rounded-lg border border-slate-300 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <h3 className="text-xs font-bold text-blue-950 uppercase tracking-wider">
                      Age Panel (आयु विवरण)
                    </h3>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleResetAge}
                        className="px-2.5 py-1 text-slate-600 border border-slate-300 rounded hover:bg-slate-100 text-[11px] font-medium cursor-pointer"
                      >
                        Reset
                      </button>
                      <button
                        type="button"
                        onClick={handleResetAge}
                        className="px-2.5 py-1 text-slate-600 border border-slate-300 rounded hover:bg-slate-100 text-[11px] font-medium cursor-pointer"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Date of Birth (जन्म तिथि)
                      </label>
                      <input
                        type="date"
                        max={new Date().toISOString().split("T")[0]}
                        value={dob}
                        onChange={(e) => {
                          setDob(e.target.value);
                          if (e.target.value) {
                            const birthYear = e.target.value.split("-")[0];
                            setYearOfBirth(birthYear);
                            const approxAge =
                              new Date().getFullYear() - parseInt(birthYear);
                            if (approxAge > 0) setAgeYears(approxAge.toString());
                          }
                        }}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Year of birth (जन्म वर्ष)
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 1994"
                        value={yearOfBirth}
                        onChange={(e) => setYearOfBirth(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs bg-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Age (Year / Month)
                      </label>
                      <div className="grid grid-cols-2 gap-1.5">
                        <input
                          type="number"
                          placeholder="Years"
                          value={ageYears}
                          onChange={(e) => setAgeYears(e.target.value)}
                          className="px-2 py-1.5 border border-slate-300 rounded-md text-xs bg-white font-mono"
                        />
                        <input
                          type="number"
                          placeholder="Months"
                          value={ageMonths}
                          onChange={(e) => setAgeMonths(e.target.value)}
                          className="px-2 py-1.5 border border-slate-300 rounded-md text-xs bg-white font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Age Range (From - To)
                      </label>
                      <div className="grid grid-cols-2 gap-1.5">
                        <input
                          type="number"
                          placeholder="From"
                          value={ageRangeFrom}
                          onChange={(e) => setAgeRangeFrom(e.target.value)}
                          className="px-2 py-1.5 border border-slate-300 rounded-md text-xs bg-white font-mono"
                        />
                        <input
                          type="number"
                          placeholder="To"
                          value={ageRangeTo}
                          onChange={(e) => setAgeRangeTo(e.target.value)}
                          className="px-2 py-1.5 border border-slate-300 rounded-md text-xs bg-white font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Address Panel (Present & Permanent Address) */}
                <div className="bg-white p-4 sm:p-5 rounded-lg border border-slate-300 shadow-2xs space-y-4">
                  <h3 className="text-xs font-bold text-blue-950 uppercase tracking-wider pb-2 border-b border-slate-200">
                    Complainant Details &rarr; Address (पता विवरण)
                  </h3>

                  {/* Present Address */}
                  <div>
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-800 bg-slate-100 p-2 rounded mb-3">
                      Present Address (वर्तमान पता)
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                          House No.
                        </label>
                        <input
                          type="text"
                          value={presentAddress.houseNo}
                          onChange={(e) =>
                            setPresentAddress({
                              ...presentAddress,
                              houseNo: e.target.value,
                            })
                          }
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                          Street Name
                        </label>
                        <input
                          type="text"
                          value={presentAddress.streetName}
                          onChange={(e) =>
                            setPresentAddress({
                              ...presentAddress,
                              streetName: e.target.value,
                            })
                          }
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                          Colony / Locality / Area
                        </label>
                        <input
                          type="text"
                          value={presentAddress.colony}
                          onChange={(e) =>
                            setPresentAddress({
                              ...presentAddress,
                              colony: e.target.value,
                            })
                          }
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                          Village / Town / City <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={presentAddress.villageTownCity}
                          onChange={(e) =>
                            setPresentAddress({
                              ...presentAddress,
                              villageTownCity: e.target.value,
                            })
                          }
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs bg-white font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                          Tehsil / Block / Mandal
                        </label>
                        <input
                          type="text"
                          value={presentAddress.tehsil}
                          onChange={(e) =>
                            setPresentAddress({
                              ...presentAddress,
                              tehsil: e.target.value,
                            })
                          }
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                          Country <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={presentAddress.country}
                          onChange={(e) =>
                            setPresentAddress({
                              ...presentAddress,
                              country: e.target.value,
                            })
                          }
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs bg-white"
                        >
                          <option value="INDIA">INDIA</option>
                          <option value="OTHER">OTHER</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                          State <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={presentAddress.state}
                          onChange={(e) =>
                            setPresentAddress({
                              ...presentAddress,
                              state: e.target.value,
                            })
                          }
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs bg-white"
                        >
                          <option value="HARYANA">HARYANA</option>
                          <option value="PUNJAB">PUNJAB</option>
                          <option value="CHANDIGARH">CHANDIGARH</option>
                          <option value="DELHI">DELHI</option>
                          <option value="UTTAR PRADESH">UTTAR PRADESH</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                          District <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={presentAddress.district}
                          onChange={(e) =>
                            setPresentAddress({
                              ...presentAddress,
                              district: e.target.value,
                            })
                          }
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs bg-white font-medium"
                        >
                          {HARYANA_DISTRICTS.map((d) => (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                          Police Station
                        </label>
                        <input
                          type="text"
                          value={presentAddress.policeStation}
                          onChange={(e) =>
                            setPresentAddress({
                              ...presentAddress,
                              policeStation: e.target.value,
                            })
                          }
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                          Pincode
                        </label>
                        <input
                          type="text"
                          value={presentAddress.pincode}
                          onChange={(e) =>
                            setPresentAddress({
                              ...presentAddress,
                              pincode: e.target.value,
                            })
                          }
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs bg-white font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Present Address: Yes / No Radio Toggle for copying */}
                  <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-lg flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-950">
                      Permanent address same as Present address? (क्या स्थायी पता वर्तमान पते के समान है?)
                    </span>
                    <div className="flex items-center gap-4 text-xs font-semibold">
                      <label className="inline-flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="sameAsPresentRadio"
                          checked={sameAsPresent === true}
                          onChange={() => setSameAsPresent(true)}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span>Yes</span>
                      </label>
                      <label className="inline-flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="sameAsPresentRadio"
                          checked={sameAsPresent === false}
                          onChange={() => setSameAsPresent(false)}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span>No</span>
                      </label>
                    </div>
                  </div>

                  {/* Permanent Address */}
                  <div>
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-800 bg-slate-100 p-2 rounded mb-3 flex items-center justify-between">
                      <span>Permanent Address (स्थायी पता)</span>
                      {sameAsPresent && (
                        <span className="text-[10px] text-blue-700 font-semibold normal-case">
                          (वर्तमान पते से स्वचालित रूप से कॉपी किया गया)
                        </span>
                      )}
                    </h4>
                    <div
                      className={`grid grid-cols-1 sm:grid-cols-3 gap-3 ${
                        sameAsPresent ? "opacity-60 pointer-events-none" : ""
                      }`}
                    >
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                          House No.
                        </label>
                        <input
                          type="text"
                          disabled={sameAsPresent}
                          value={permanentAddress.houseNo}
                          onChange={(e) =>
                            setPermanentAddress({
                              ...permanentAddress,
                              houseNo: e.target.value,
                            })
                          }
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                          Street Name
                        </label>
                        <input
                          type="text"
                          disabled={sameAsPresent}
                          value={permanentAddress.streetName}
                          onChange={(e) =>
                            setPermanentAddress({
                              ...permanentAddress,
                              streetName: e.target.value,
                            })
                          }
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                          Colony / Locality / Area
                        </label>
                        <input
                          type="text"
                          disabled={sameAsPresent}
                          value={permanentAddress.colony}
                          onChange={(e) =>
                            setPermanentAddress({
                              ...permanentAddress,
                              colony: e.target.value,
                            })
                          }
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                          Village / Town / City
                        </label>
                        <input
                          type="text"
                          disabled={sameAsPresent}
                          value={permanentAddress.villageTownCity}
                          onChange={(e) =>
                            setPermanentAddress({
                              ...permanentAddress,
                              villageTownCity: e.target.value,
                            })
                          }
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                          Tehsil / Block / Mandal
                        </label>
                        <input
                          type="text"
                          disabled={sameAsPresent}
                          value={permanentAddress.tehsil}
                          onChange={(e) =>
                            setPermanentAddress({
                              ...permanentAddress,
                              tehsil: e.target.value,
                            })
                          }
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                          Country
                        </label>
                        <select
                          disabled={sameAsPresent}
                          value={permanentAddress.country}
                          onChange={(e) =>
                            setPermanentAddress({
                              ...permanentAddress,
                              country: e.target.value,
                            })
                          }
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs bg-white"
                        >
                          <option value="INDIA">INDIA</option>
                          <option value="OTHER">OTHER</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                          State
                        </label>
                        <select
                          disabled={sameAsPresent}
                          value={permanentAddress.state}
                          onChange={(e) =>
                            setPermanentAddress({
                              ...permanentAddress,
                              state: e.target.value,
                            })
                          }
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs bg-white"
                        >
                          <option value="HARYANA">HARYANA</option>
                          <option value="PUNJAB">PUNJAB</option>
                          <option value="CHANDIGARH">CHANDIGARH</option>
                          <option value="DELHI">DELHI</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                          District
                        </label>
                        <select
                          disabled={sameAsPresent}
                          value={permanentAddress.district}
                          onChange={(e) =>
                            setPermanentAddress({
                              ...permanentAddress,
                              district: e.target.value,
                            })
                          }
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs bg-white"
                        >
                          {HARYANA_DISTRICTS.map((d) => (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                          Police Station
                        </label>
                        <input
                          type="text"
                          disabled={sameAsPresent}
                          value={permanentAddress.policeStation}
                          onChange={(e) =>
                            setPermanentAddress({
                              ...permanentAddress,
                              policeStation: e.target.value,
                            })
                          }
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                          Pincode
                        </label>
                        <input
                          type="text"
                          disabled={sameAsPresent}
                          value={permanentAddress.pincode}
                          onChange={(e) =>
                            setPermanentAddress({
                              ...permanentAddress,
                              pincode: e.target.value,
                            })
                          }
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs bg-white font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* TAB 3: DETAILS OF ENQUIRY OFFICER                              */}
            {/* ============================================================== */}
            {activeTab === "EO_DETAILS" && (
              <div className="bg-white p-4 sm:p-5 rounded-lg border border-slate-300 shadow-2xs space-y-4 animate-in fade-in duration-100">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <h3 className="text-xs font-bold text-blue-950 uppercase tracking-wider">
                    Details of Enquiry Officer (जांच अधिकारी का विवरण)
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setNameOfEo("");
                      setEoRank("");
                      setEoNumber("");
                      setRemarks("");
                      setExpectedDateToComplete("");
                    }}
                    className="px-3 py-1 text-slate-600 border border-slate-300 rounded hover:bg-slate-100 text-xs font-semibold cursor-pointer"
                  >
                    Clear
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Name of EO Dropdown */}
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Name of EO <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={nameOfEo}
                      onChange={(e) => handleEoChange(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs bg-white font-medium focus:outline-none focus:ring-1 focus:ring-blue-600"
                    >
                      <option value="">Select Enquiry Officer</option>
                      {MOCK_ENQUIRY_OFFICERS_LIST.map((eo, idx) => (
                        <option key={idx} value={eo.display}>
                          {eo.display}
                        </option>
                      ))}
                    </select>
                    <span className="text-[10px] text-slate-500 mt-0.5 block">
                      चयन: Lalit Kumar (I (Inspector))-53175
                    </span>
                  </div>

                  {/* Rank */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Rank (पद)
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={eoRank}
                      placeholder="I (Inspector)"
                      className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs bg-slate-100 font-semibold text-slate-800"
                    />
                    <span className="text-[10px] text-slate-500 mt-0.5 block">
                      चयन के बाद I (Inspector) दिखाई देता है
                    </span>
                  </div>
                </div>

                {/* Expected Date to Complete the Enquiry */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Expected Date to Complete the Enquiry (जांच पूर्ण करने की संभावित तिथि)
                  </label>
                  <input
                    type="date"
                    value={expectedDateToComplete}
                    onChange={(e) => setExpectedDateToComplete(e.target.value)}
                    className="w-full sm:w-64 px-3 py-1.5 border border-slate-300 rounded-md text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 font-mono"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    e.g. 24/04/2019
                  </span>
                </div>

                {/* Remarks textarea */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Remarks (टिप्पणी / विवरण)
                  </label>
                  <textarea
                    rows={4}
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Enter enquiry assignment instructions, CEIR portal actions, IMEI tracking details..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer Bar: Submit, Close, Print buttons */}
          <div className="bg-slate-100 px-5 py-3 border-t border-slate-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleClearAll}
                className="px-3.5 py-1.5 border border-slate-300 rounded-md text-slate-700 hover:bg-white text-xs font-semibold cursor-pointer"
              >
                Clear All
              </button>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 rounded-md text-slate-700 hover:bg-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Close
              </button>

              <button
                type="button"
                onClick={handlePrintClick}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-md text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-blue-300" />
                <span>Print</span>
              </button>

              <button
                type="button"
                onClick={() => handleSubmitClick()}
                className="px-6 py-2 bg-blue-800 hover:bg-blue-900 text-white rounded-md text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Submit (जमा करें)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* GD Search Popup Modal */}
      <GDSearchModal
        isOpen={isGdSearchOpen}
        onClose={() => setIsGdSearchOpen(false)}
        onSelectGD={handleSelectGd}
      />

      {/* Add New Property Item Popup Modal */}
      <AddPropertyItemModal
        isOpen={isAddItemOpen}
        onClose={() => {
          setIsAddItemOpen(false);
          setEditingItemIndex(null);
        }}
        initialData={
          editingItemIndex !== null ? properties[editingItemIndex] : null
        }
        onSave={(newItem) => {
          if (editingItemIndex !== null) {
            const updated = [...properties];
            updated[editingItemIndex] = newItem;
            setProperties(updated);
          } else {
            setProperties([...properties, newItem]);
          }
        }}
      />

      {/* Official A4 Preview Modal with Final Submit, Download, and Print */}
      <LostPropertyPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        record={currentRecord}
        isNewRecord={!initialRecord?.registrationNumber}
        isPendingFinalSubmit={true}
        onBackToEdit={() => setIsPreviewOpen(false)}
        onFinalSubmit={(saved) => {
          if (onSuccess) {
            onSuccess(saved);
          }
          onClose();
        }}
      />
    </>
  );
};
