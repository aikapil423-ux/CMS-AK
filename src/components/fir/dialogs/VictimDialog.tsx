"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  User,
  MapPin,
  FileText,
  RotateCcw,
  Check,
  Plus,
  Trash2,
  AlertCircle,
  Calendar,
  Layers,
} from "lucide-react";
import { FIRAliasEntry, FIRIdentificationEntry } from "@/types";
import { Button } from "@/components/ui/button";
import { DatePickerDDMMYYYY } from "@/components/ui/date-picker-ddmmyyyy";
import {
  GENDER_OPTIONS,
  MARITAL_STATUS_OPTIONS,
  RELATION_TYPE_OPTIONS,
  CASTE_CATEGORY_OPTIONS,
  IDENTIFICATION_TYPE_OPTIONS,
} from "@/components/fir/firDropdownConstants";

export interface VictimItemData {
  id: string;
  srNo?: number;
  uid?: string;
  firstName: string;
  middleName?: string;
  lastName?: string;
  fullName: string;
  aliases?: FIRAliasEntry[];
  gender: string;
  maritalStatus?: string;
  relationType?: string;
  relativeName?: string;
  relativeAliasName?: string;
  mobile?: string;
  landline?: string;
  email?: string;
  category?: string;
  victimClassification: "Adult" | "Child";
  medicalExamRequiredForAge?: boolean;
  // Age panel
  dob?: string;
  yearOfBirth?: string;
  ageYears?: string;
  ageMonths?: string;
  ageRangeFrom?: string;
  ageRangeTo?: string;
  // Address
  permHouseNo?: string;
  permStreet?: string;
  permColony?: string;
  permCity?: string;
  permTehsil?: string;
  permCountry?: string;
  permState?: string;
  permDistrict?: string;
  permPs?: string;
  permPincode?: string;
  presentSameAsPerm?: boolean;
  presHouseNo?: string;
  presStreet?: string;
  presColony?: string;
  presCity?: string;
  presTehsil?: string;
  presCountry?: string;
  presState?: string;
  presDistrict?: string;
  presPs?: string;
  presPincode?: string;
  fullAddressString: string;
  // Other Information
  occupation?: string;
  nationality?: string;
  identifications?: FIRIdentificationEntry[];
  // Statements
  statementText?: string;
}

export interface VictimDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (victim: VictimItemData | any) => void;
  initialVictim?: VictimItemData | any | null;
  initialData?: VictimItemData | any | null;
  complainantDefaults?: Partial<VictimItemData> | null;
}

export const VictimDialog: React.FC<VictimDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  initialVictim: propInitialVictim,
  initialData,
  complainantDefaults,
}) => {
  const initialVictim = propInitialVictim || initialData;
  const [activeSubtab, setActiveSubtab] = useState<"personal" | "address" | "other" | "statements">("personal");

  // Personal Info
  const [uid, setUid] = useState("");
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [aliases, setAliases] = useState<FIRAliasEntry[]>([]);
  const [tempAlias, setTempAlias] = useState("");
  const [gender, setGender] = useState<string>("Female");
  const [maritalStatus, setMaritalStatus] = useState("Married");
  const [relationType, setRelationType] = useState("Father");
  const [relativeName, setRelativeName] = useState("");
  const [relativeAliasName, setRelativeAliasName] = useState("");
  const [mobile, setMobile] = useState("");
  const [landline, setLandline] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState("GENERAL");
  const [victimClassification, setVictimClassification] = useState<"Adult" | "Child">("Adult");
  const [medicalExamRequiredForAge, setMedicalExamRequiredForAge] = useState(false);

  // Age Panel
  const [dob, setDob] = useState("");
  const [yearOfBirth, setYearOfBirth] = useState("");
  const [ageYears, setAgeYears] = useState("");
  const [ageMonths, setAgeMonths] = useState("");
  const [ageRangeFrom, setAgeRangeFrom] = useState("");
  const [ageRangeTo, setAgeRangeTo] = useState("");

  // Address
  const [permHouseNo, setPermHouseNo] = useState("");
  const [permStreet, setPermStreet] = useState("");
  const [permColony, setPermColony] = useState("");
  const [permCity, setPermCity] = useState("Gurugram");
  const [permTehsil, setPermTehsil] = useState("Gurugram");
  const [permCountry, setPermCountry] = useState("India");
  const [permState, setPermState] = useState("Haryana");
  const [permDistrict, setPermDistrict] = useState("Gurugram");
  const [permPs, setPermPs] = useState("PS Sector 29 Gurugram");
  const [permPincode, setPermPincode] = useState("");
  const [presentSameAsPerm, setPresentSameAsPerm] = useState(true);

  const [presHouseNo, setPresHouseNo] = useState("");
  const [presStreet, setPresStreet] = useState("");
  const [presColony, setPresColony] = useState("");
  const [presCity, setPresCity] = useState("Gurugram");
  const [presTehsil, setPresTehsil] = useState("Gurugram");
  const [presCountry, setPresCountry] = useState("India");
  const [presState, setPresState] = useState("Haryana");
  const [presDistrict, setPresDistrict] = useState("Gurugram");
  const [presPs, setPresPs] = useState("PS Sector 29 Gurugram");
  const [presPincode, setPresPincode] = useState("");

  // Other Information
  const [occupation, setOccupation] = useState("Private Job");
  const [nationality, setNationality] = useState("Indian");
  const [identifications, setIdentifications] = useState<FIRIdentificationEntry[]>([]);
  const [tempIdType, setTempIdType] = useState("Aadhar Card");
  const [tempIdNumber, setTempIdNumber] = useState("");

  // Statements
  const [statementText, setStatementText] = useState("");

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (initialVictim) {
      setUid(initialVictim.uid || "");
      setFirstName(initialVictim.firstName || "");
      setMiddleName(initialVictim.middleName || "");
      setLastName(initialVictim.lastName || "");
      setAliases(initialVictim.aliases || []);
      setGender(initialVictim.gender || "Female");
      setMaritalStatus(initialVictim.maritalStatus || "Married");
      setRelationType(initialVictim.relationType || "Father");
      setRelativeName(initialVictim.relativeName || "");
      setRelativeAliasName(initialVictim.relativeAliasName || "");
      setMobile(initialVictim.mobile || "");
      setLandline(initialVictim.landline || "");
      setEmail(initialVictim.email || "");
      setCategory(initialVictim.category || "GENERAL");
      setVictimClassification(initialVictim.victimClassification || "Adult");
      setMedicalExamRequiredForAge(initialVictim.medicalExamRequiredForAge || false);
      setDob(initialVictim.dob || "");
      setYearOfBirth(initialVictim.yearOfBirth || "");
      setAgeYears(initialVictim.ageYears || "");
      setAgeMonths(initialVictim.ageMonths || "");
      setAgeRangeFrom(initialVictim.ageRangeFrom || "");
      setAgeRangeTo(initialVictim.ageRangeTo || "");
      setPermHouseNo(initialVictim.permHouseNo || "");
      setPermStreet(initialVictim.permStreet || "");
      setPermColony(initialVictim.permColony || "");
      setPermCity(initialVictim.permCity || "Gurugram");
      setPermTehsil(initialVictim.permTehsil || "Gurugram");
      setPermCountry(initialVictim.permCountry || "India");
      setPermState(initialVictim.permState || "Haryana");
      setPermDistrict(initialVictim.permDistrict || "Gurugram");
      setPermPs(initialVictim.permPs || "PS Sector 29 Gurugram");
      setPermPincode(initialVictim.permPincode || "");
      setPresentSameAsPerm(initialVictim.presentSameAsPerm ?? true);
      setPresHouseNo(initialVictim.presHouseNo || "");
      setPresStreet(initialVictim.presStreet || "");
      setPresColony(initialVictim.presColony || "");
      setPresCity(initialVictim.presCity || "Gurugram");
      setPresTehsil(initialVictim.presTehsil || "Gurugram");
      setPresCountry(initialVictim.presCountry || "India");
      setPresState(initialVictim.presState || "Haryana");
      setPresDistrict(initialVictim.presDistrict || "Gurugram");
      setPresPs(initialVictim.presPs || "PS Sector 29 Gurugram");
      setPresPincode(initialVictim.presPincode || "");
      setOccupation(initialVictim.occupation || "Private Job");
      setNationality(initialVictim.nationality || "Indian");
      setIdentifications(initialVictim.identifications || []);
      setStatementText(initialVictim.statementText || "");
    } else if (complainantDefaults) {
      // Prefill from complainant if requested
      setFirstName(complainantDefaults.firstName || "");
      setMiddleName(complainantDefaults.middleName || "");
      setLastName(complainantDefaults.lastName || "");
      setGender(complainantDefaults.gender || "MALE");
      setMobile(complainantDefaults.mobile || "");
      setRelationType(complainantDefaults.relationType || "Father");
      setRelativeName(complainantDefaults.relativeName || "");
      setPermHouseNo(complainantDefaults.permHouseNo || "");
      setPermCity(complainantDefaults.permCity || "Gurugram");
      setPermDistrict(complainantDefaults.permDistrict || "Gurugram");
    }
  }, [initialVictim, complainantDefaults, isOpen]);

  if (!isOpen) return null;

  // Handle DOB change and compute age
  const handleDobChange = (val: string) => {
    setDob(val);
    if (val) {
      const birth = new Date(val);
      const now = new Date();
      if (!isNaN(birth.getTime())) {
        let age = now.getFullYear() - birth.getFullYear();
        const m = now.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
          age--;
        }
        if (age >= 0) {
          setAgeYears(String(age));
          setYearOfBirth(String(birth.getFullYear()));
          setVictimClassification(age < 18 ? "Child" : "Adult");
        }
      }
    }
  };

  const handleResetAge = () => {
    setDob("");
    setYearOfBirth("");
    setAgeYears("");
    setAgeMonths("");
    setAgeRangeFrom("");
    setAgeRangeTo("");
  };

  const handleAddAlias = () => {
    if (!tempAlias.trim()) return;
    setAliases([...aliases, { id: `alias-${Date.now()}`, aliasName: tempAlias.trim() }]);
    setTempAlias("");
  };

  const handleDeleteAlias = (idx: number) => {
    setAliases(aliases.filter((_, i) => i !== idx));
  };

  const handleAddIdentification = () => {
    if (!tempIdNumber.trim()) return;
    setIdentifications([
      ...identifications,
      { id: `id-${Date.now()}`, idType: tempIdType, idNumber: tempIdNumber.trim() },
    ]);
    setTempIdNumber("");
  };

  const handleDeleteIdentification = (idx: number) => {
    setIdentifications(identifications.filter((_, i) => i !== idx));
  };

  const handleSave = () => {
    setErrorMsg(null);
    if (!firstName.trim()) {
      setErrorMsg("Victim First Name is mandatory.");
      setActiveSubtab("personal");
      return;
    }

    const fullName = [firstName.trim(), middleName.trim(), lastName.trim()].filter(Boolean).join(" ");
    const fullAddress = [
      permHouseNo,
      permStreet,
      permColony,
      permCity,
      permDistrict,
      permState,
      permPincode,
    ]
      .filter(Boolean)
      .join(", ");

    const victimData: VictimItemData = {
      id: initialVictim?.id || `victim-${Date.now()}`,
      srNo: initialVictim?.srNo || 1,
      uid: uid.trim() || undefined,
      firstName: firstName.trim(),
      middleName: middleName.trim() || undefined,
      lastName: lastName.trim() || undefined,
      fullName,
      aliases,
      gender,
      maritalStatus,
      relationType,
      relativeName: relativeName.trim() || undefined,
      relativeAliasName: relativeAliasName.trim() || undefined,
      mobile: mobile.trim() || undefined,
      landline: landline.trim() || undefined,
      email: email.trim() || undefined,
      category,
      victimClassification,
      medicalExamRequiredForAge,
      dob: dob || undefined,
      yearOfBirth: yearOfBirth || undefined,
      ageYears: ageYears || undefined,
      ageMonths: ageMonths || undefined,
      ageRangeFrom: ageRangeFrom || undefined,
      ageRangeTo: ageRangeTo || undefined,
      permHouseNo: permHouseNo.trim() || undefined,
      permStreet: permStreet.trim() || undefined,
      permColony: permColony.trim() || undefined,
      permCity: permCity.trim() || undefined,
      permTehsil: permTehsil.trim() || undefined,
      permCountry: permCountry.trim() || undefined,
      permState: permState.trim() || undefined,
      permDistrict: permDistrict.trim() || undefined,
      permPs: permPs.trim() || undefined,
      permPincode: permPincode.trim() || undefined,
      presentSameAsPerm,
      presHouseNo: presentSameAsPerm ? permHouseNo : presHouseNo,
      presStreet: presentSameAsPerm ? permStreet : presStreet,
      presColony: presentSameAsPerm ? permColony : presColony,
      presCity: presentSameAsPerm ? permCity : presCity,
      presDistrict: presentSameAsPerm ? permDistrict : presDistrict,
      presState: presentSameAsPerm ? permState : presState,
      presPincode: presentSameAsPerm ? permPincode : presPincode,
      fullAddressString: fullAddress || "Address on Record",
      occupation: occupation.trim() || undefined,
      nationality: nationality.trim() || undefined,
      identifications,
      statementText: statementText.trim() || undefined,
    };

    onSave(victimData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in-50">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden text-slate-800">
        {/* Header */}
        <div className="px-5 py-3.5 bg-[#0b192c] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-pink-600/30 border border-pink-400/40 flex items-center justify-center text-pink-200">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight">
                {initialVictim ? "Edit Victim Information" : "Add Victim Information (पीड़ित का विवरण)"}
              </h2>
              <p className="text-[11px] text-slate-300">
                Capture personal traits, structured address, age verification, and official statements
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

        {/* 4 Subtabs Navigation */}
        <div className="flex items-center gap-1 border-b border-slate-200 bg-slate-100/70 p-2 text-xs">
          <button
            type="button"
            onClick={() => setActiveSubtab("personal")}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors ${
              activeSubtab === "personal"
                ? "bg-white text-[#0b192c] shadow-2xs border border-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <User className="w-3.5 h-3.5 text-blue-600" />
            Personal Information
          </button>
          <button
            type="button"
            onClick={() => setActiveSubtab("address")}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors ${
              activeSubtab === "address"
                ? "bg-white text-[#0b192c] shadow-2xs border border-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
            Address
          </button>
          <button
            type="button"
            onClick={() => setActiveSubtab("other")}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors ${
              activeSubtab === "other"
                ? "bg-white text-[#0b192c] shadow-2xs border border-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-purple-600" />
            Other Information
          </button>
          <button
            type="button"
            onClick={() => setActiveSubtab("statements")}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors ${
              activeSubtab === "statements"
                ? "bg-white text-[#0b192c] shadow-2xs border border-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-amber-600" />
            Statements
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* SUBTAB 1: PERSONAL INFORMATION */}
          {activeSubtab === "personal" && (
            <div className="space-y-4 animate-in fade-in-30">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">UID (Aadhaar Number)</label>
                  <input
                    type="text"
                    placeholder="12 digit UID"
                    maxLength={12}
                    value={uid}
                    onChange={(e) => setUid(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">First Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Middle Name</label>
                  <input
                    type="text"
                    value={middleName}
                    onChange={(e) => setMiddleName(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
              </div>

              {/* Aliases */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                <label className="font-bold text-slate-700 block">Aliases (उर्फ़ / उपनाम)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter alias name..."
                    value={tempAlias}
                    onChange={(e) => setTempAlias(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 bg-white text-xs"
                  />
                  <Button
                    type="button"
                    onClick={handleAddAlias}
                    className="bg-[#0b192c] hover:bg-slate-800 text-white text-xs px-3"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Add Alias
                  </Button>
                </div>

                {aliases.length > 0 && (
                  <div className="border border-slate-200 rounded-lg overflow-hidden bg-white mt-2">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                        <tr>
                          <th className="p-2 w-14">S. No.</th>
                          <th className="p-2">Alias Name</th>
                          <th className="p-2 w-16 text-center">Delete</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {aliases.map((a, i) => (
                          <tr key={a.id}>
                            <td className="p-2 font-bold text-slate-500">{i + 1}</td>
                            <td className="p-2 font-medium">{a.aliasName}</td>
                            <td className="p-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleDeleteAlias(i)}
                                className="text-red-500 hover:text-red-700"
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

              {/* Gender, Marital Status, Relative, Contacts, Classification */}
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 bg-white text-xs"
                  >
                    {GENDER_OPTIONS.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Marital Status</label>
                  <select
                    value={maritalStatus}
                    onChange={(e) => setMaritalStatus(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 bg-white text-xs"
                  >
                    {MARITAL_STATUS_OPTIONS.map((ms) => (
                      <option key={ms} value={ms}>
                        {ms}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Relation Type</label>
                  <select
                    value={relationType}
                    onChange={(e) => setRelationType(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 bg-white text-xs"
                  >
                    {RELATION_TYPE_OPTIONS.map((rt) => (
                      <option key={rt} value={rt}>
                        {rt}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Relative Name</label>
                  <input
                    type="text"
                    value={relativeName}
                    onChange={(e) => setRelativeName(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Relative Alias Name</label>
                  <input
                    type="text"
                    value={relativeAliasName}
                    onChange={(e) => setRelativeAliasName(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Mobile Number</label>
                  <div className="flex">
                    <span className="p-2 bg-slate-100 border border-r-0 border-slate-300 rounded-l-lg text-slate-500 font-mono text-xs">
                      +91
                    </span>
                    <input
                      type="tel"
                      maxLength={10}
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      className="w-full p-2 rounded-r-lg border border-slate-300 font-mono text-xs"
                    />
                  </div>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Landline Number</label>
                  <input
                    type="tel"
                    value={landline}
                    onChange={(e) => setLandline(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Email ID</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 bg-white text-xs"
                  >
                    {CASTE_CATEGORY_OPTIONS.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Victim Classification & Medical Examination */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-pink-50/60 rounded-xl border border-pink-200">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Victim Classification</label>
                  <div className="flex items-center gap-4 mt-1">
                    <label className="flex items-center gap-1.5 cursor-pointer font-semibold">
                      <input
                        type="radio"
                        name="victimClass"
                        checked={victimClassification === "Adult"}
                        onChange={() => setVictimClassification("Adult")}
                      />
                      <span>Adult (वयस्क)</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-pink-900">
                      <input
                        type="radio"
                        name="victimClass"
                        checked={victimClassification === "Child"}
                        onChange={() => setVictimClassification("Child")}
                      />
                      <span>Child (नाबालिग / POCSO)</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">
                    Medical Examination Required to Determine Age?
                  </label>
                  <div className="flex items-center gap-4 mt-1">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="medExam"
                        checked={medicalExamRequiredForAge}
                        onChange={() => setMedicalExamRequiredForAge(true)}
                      />
                      <span>Yes</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="medExam"
                        checked={!medicalExamRequiredForAge}
                        onChange={() => setMedicalExamRequiredForAge(false)}
                      />
                      <span>No</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Age Panel */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-1.5">
                  <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    Age Determination Panel (आयु निर्धारण)
                  </span>
                  <button
                    type="button"
                    onClick={handleResetAge}
                    className="text-[11px] text-red-600 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset Age
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Date of Birth (DOB)</label>
                    <DatePickerDDMMYYYY
                      value={dob}
                      onChange={(e) => handleDobChange(e.target.value)}
                      placeholder="DD/MM/YYYY"
                      size="sm"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Year of Birth</label>
                    <input
                      type="number"
                      placeholder="e.g. 1996"
                      value={yearOfBirth}
                      onChange={(e) => setYearOfBirth(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-300 bg-white font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Age in Years / Months</label>
                    <div className="flex gap-1.5">
                      <input
                        type="number"
                        placeholder="Yrs"
                        value={ageYears}
                        onChange={(e) => setAgeYears(e.target.value)}
                        className="w-1/2 p-2 rounded-lg border border-slate-300 bg-white font-mono text-xs"
                      />
                      <input
                        type="number"
                        placeholder="Mos"
                        value={ageMonths}
                        onChange={(e) => setAgeMonths(e.target.value)}
                        className="w-1/2 p-2 rounded-lg border border-slate-300 bg-white font-mono text-xs"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Age Range (From - To)</label>
                    <div className="flex gap-1.5">
                      <input
                        type="number"
                        placeholder="From"
                        value={ageRangeFrom}
                        onChange={(e) => setAgeRangeFrom(e.target.value)}
                        className="w-1/2 p-2 rounded-lg border border-slate-300 bg-white font-mono text-xs"
                      />
                      <input
                        type="number"
                        placeholder="To"
                        value={ageRangeTo}
                        onChange={(e) => setAgeRangeTo(e.target.value)}
                        className="w-1/2 p-2 rounded-lg border border-slate-300 bg-white font-mono text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SUBTAB 2: ADDRESS */}
          {activeSubtab === "address" && (
            <div className="space-y-4 animate-in fade-in-30">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <span className="font-bold text-slate-800 text-xs block">Permanent Address (स्थायी पता)</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">House / Flat No.</label>
                    <input
                      type="text"
                      value={permHouseNo}
                      onChange={(e) => setPermHouseNo(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-300 bg-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Street Name</label>
                    <input
                      type="text"
                      value={permStreet}
                      onChange={(e) => setPermStreet(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-300 bg-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Colony / Locality / Area</label>
                    <input
                      type="text"
                      value={permColony}
                      onChange={(e) => setPermColony(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-300 bg-white text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Village / Town / City</label>
                    <input
                      type="text"
                      value={permCity}
                      onChange={(e) => setPermCity(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-300 bg-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Tehsil / Mandal</label>
                    <input
                      type="text"
                      value={permTehsil}
                      onChange={(e) => setPermTehsil(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-300 bg-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Country</label>
                    <input
                      type="text"
                      value={permCountry}
                      onChange={(e) => setPermCountry(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-300 bg-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">State</label>
                    <input
                      type="text"
                      value={permState}
                      onChange={(e) => setPermState(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-300 bg-white text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">District</label>
                    <input
                      type="text"
                      value={permDistrict}
                      onChange={(e) => setPermDistrict(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-300 bg-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Police Station</label>
                    <input
                      type="text"
                      value={permPs}
                      onChange={(e) => setPermPs(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-300 bg-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Pincode</label>
                    <input
                      type="text"
                      value={permPincode}
                      onChange={(e) => setPermPincode(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-300 bg-white font-mono text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Present Address Same As Permanent */}
              <div className="flex items-center justify-between p-3 bg-slate-100 rounded-xl">
                <span className="font-bold text-slate-800 text-xs">
                  Is Present Address Same as Permanent Address?
                </span>
                <label className="flex items-center gap-2 cursor-pointer font-bold text-blue-900">
                  <input
                    type="checkbox"
                    checked={presentSameAsPerm}
                    onChange={(e) => setPresentSameAsPerm(e.target.checked)}
                    className="rounded text-blue-600"
                  />
                  <span>Same as Permanent</span>
                </label>
              </div>

              {!presentSameAsPerm && (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <span className="font-bold text-slate-800 text-xs block">Present Address (वर्तमान पता)</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">House / Flat No.</label>
                      <input
                        type="text"
                        value={presHouseNo}
                        onChange={(e) => setPresHouseNo(e.target.value)}
                        className="w-full p-2 rounded-lg border border-slate-300 bg-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Street Name</label>
                      <input
                        type="text"
                        value={presStreet}
                        onChange={(e) => setPresStreet(e.target.value)}
                        className="w-full p-2 rounded-lg border border-slate-300 bg-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Colony / Locality</label>
                      <input
                        type="text"
                        value={presColony}
                        onChange={(e) => setPresColony(e.target.value)}
                        className="w-full p-2 rounded-lg border border-slate-300 bg-white text-xs"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">City</label>
                      <input
                        type="text"
                        value={presCity}
                        onChange={(e) => setPresCity(e.target.value)}
                        className="w-full p-2 rounded-lg border border-slate-300 bg-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">District</label>
                      <input
                        type="text"
                        value={presDistrict}
                        onChange={(e) => setPresDistrict(e.target.value)}
                        className="w-full p-2 rounded-lg border border-slate-300 bg-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Pincode</label>
                      <input
                        type="text"
                        value={presPincode}
                        onChange={(e) => setPresPincode(e.target.value)}
                        className="w-full p-2 rounded-lg border border-slate-300 bg-white font-mono text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SUBTAB 3: OTHER INFORMATION */}
          {activeSubtab === "other" && (
            <div className="space-y-4 animate-in fade-in-30">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Occupation</label>
                  <input
                    type="text"
                    value={occupation}
                    onChange={(e) => setOccupation(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Country of Nationality</label>
                  <input
                    type="text"
                    value={nationality}
                    onChange={(e) => setNationality(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
              </div>

              {/* Identification Table */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                <label className="font-bold text-slate-800 block">Official Identity Documents</label>
                <div className="flex gap-2">
                  <select
                    value={tempIdType}
                    onChange={(e) => setTempIdType(e.target.value)}
                    className="w-1/3 p-2 rounded-lg border border-slate-300 bg-white text-xs"
                  >
                    {IDENTIFICATION_TYPE_OPTIONS.map((idType) => (
                      <option key={idType} value={idType}>
                        {idType}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Enter ID number..."
                    value={tempIdNumber}
                    onChange={(e) => setTempIdNumber(e.target.value)}
                    className="w-2/3 p-2 rounded-lg border border-slate-300 bg-white text-xs font-mono"
                  />
                  <Button
                    type="button"
                    onClick={handleAddIdentification}
                    className="bg-[#0b192c] hover:bg-slate-800 text-white text-xs shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Add ID
                  </Button>
                </div>

                {identifications.length > 0 && (
                  <div className="border border-slate-200 rounded-lg overflow-hidden bg-white mt-2">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                        <tr>
                          <th className="p-2 w-14">S. No.</th>
                          <th className="p-2 w-44">ID Type</th>
                          <th className="p-2">ID Number</th>
                          <th className="p-2 w-16 text-center">Delete</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {identifications.map((item, idx) => (
                          <tr key={item.id}>
                            <td className="p-2 font-bold text-slate-500">{idx + 1}</td>
                            <td className="p-2 font-semibold">{item.idType}</td>
                            <td className="p-2 font-mono text-blue-900 font-bold">{item.idNumber}</td>
                            <td className="p-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleDeleteIdentification(idx)}
                                className="text-red-500 hover:text-red-700"
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
          )}

          {/* SUBTAB 4: STATEMENTS */}
          {activeSubtab === "statements" && (
            <div className="space-y-3 animate-in fade-in-30">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-800 text-xs">
                  Victim Statement (पीड़िता / पीड़ित का बयान)
                </label>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-mono text-slate-500">
                    {statementText.length} characters
                  </span>
                  {statementText.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setStatementText("")}
                      className="text-[11px] text-red-600 hover:underline font-semibold"
                    >
                      Clear Statement
                    </button>
                  )}
                </div>
              </div>
              <textarea
                rows={8}
                placeholder="Record statement verbatim as narrated by victim in presence of enquiry officer/woman officer..."
                value={statementText}
                onChange={(e) => setStatementText(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-300 bg-white text-xs leading-relaxed focus:ring-2 focus:ring-[#0b192c]"
              />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <Button type="button" variant="outline" size="sm" onClick={onClose} className="text-xs">
            Close
          </Button>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              onClick={handleSave}
              className="bg-[#0b192c] hover:bg-slate-800 text-white text-xs flex items-center gap-1.5 px-5 font-bold"
            >
              <Check className="w-3.5 h-3.5" />
              Save Victim Record
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
