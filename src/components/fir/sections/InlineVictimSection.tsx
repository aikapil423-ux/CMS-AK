"use client";

import React, { useState } from "react";
import {
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
  Edit2,
  UserCheck,
} from "lucide-react";
import { FIRAliasEntry, FIRIdentificationEntry } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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
  name?: string;
  uid?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  fullName?: string;
  aliases?: FIRAliasEntry[];
  gender?: string;
  maritalStatus?: string;
  relationType?: string;
  relativeName?: string;
  relativeAliasName?: string;
  mobile?: string;
  landline?: string;
  email?: string;
  category?: string;
  victimClassification?: "Adult" | "Child";
  victimType?: string;
  medicalExamRequiredForAge?: boolean;
  age?: number | string;
  // Age panel
  dob?: string;
  yearOfBirth?: string;
  ageYears?: string;
  ageMonths?: string;
  ageRangeFrom?: string;
  ageRangeTo?: string;
  // Address
  address?: string;
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
  fullAddressString?: string;
  // Other Information
  occupation?: string;
  nationality?: string;
  identifications?: FIRIdentificationEntry[];
  // Statements
  statementText?: string;
  statements?: any[];
}

export interface InlineVictimSectionProps {
  victimsList: VictimItemData[];
  onAddVictim: (victim: VictimItemData) => void;
  onUpdateVictim: (victim: VictimItemData) => void;
  onDeleteVictim: (id: string) => void;
  onLinkComplainantAsVictim?: () => void;
}

export const InlineVictimSection: React.FC<InlineVictimSectionProps> = ({
  victimsList,
  onAddVictim,
  onUpdateVictim,
  onDeleteVictim,
  onLinkComplainantAsVictim,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
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
  const [presDistrict, setPresDistrict] = useState("Gurugram");
  const [presState, setPresState] = useState("Haryana");
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
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const handleClear = () => {
    setEditingId(null);
    setUid("");
    setFirstName("");
    setMiddleName("");
    setLastName("");
    setAliases([]);
    setTempAlias("");
    setGender("Female");
    setMaritalStatus("Married");
    setRelationType("Father");
    setRelativeName("");
    setRelativeAliasName("");
    setMobile("");
    setLandline("");
    setEmail("");
    setCategory("GENERAL");
    setVictimClassification("Adult");
    setMedicalExamRequiredForAge(false);
    setDob("");
    setYearOfBirth("");
    setAgeYears("");
    setAgeMonths("");
    setAgeRangeFrom("");
    setAgeRangeTo("");
    setPermHouseNo("");
    setPermStreet("");
    setPermColony("");
    setPermCity("Gurugram");
    setPermTehsil("Gurugram");
    setPermCountry("India");
    setPermState("Haryana");
    setPermDistrict("Gurugram");
    setPermPs("PS Sector 29 Gurugram");
    setPermPincode("");
    setPresentSameAsPerm(true);
    setPresHouseNo("");
    setPresStreet("");
    setPresColony("");
    setPresCity("Gurugram");
    setPresDistrict("Gurugram");
    setPresState("Haryana");
    setPresPincode("");
    setOccupation("Private Job");
    setNationality("Indian");
    setIdentifications([]);
    setTempIdType("Aadhar Card");
    setTempIdNumber("");
    setStatementText("");
    setErrorMsg(null);
  };

  const handleEdit = (vic: VictimItemData) => {
    setEditingId(vic.id);
    setUid(vic.uid || "");
    const parts = (vic.name || vic.fullName || "").split(" ");
    setFirstName(vic.firstName || parts[0] || "");
    setMiddleName(vic.middleName || (parts.length > 2 ? parts.slice(1, -1).join(" ") : ""));
    setLastName(vic.lastName || (parts.length > 1 ? parts[parts.length - 1] : ""));
    setAliases(vic.aliases || []);
    setGender(vic.gender || "Female");
    setMaritalStatus(vic.maritalStatus || "Married");
    setRelationType(vic.relationType || "Father");
    setRelativeName(vic.relativeName || "");
    setRelativeAliasName(vic.relativeAliasName || "");
    setMobile(vic.mobile || "");
    setLandline(vic.landline || "");
    setEmail(vic.email || "");
    setCategory(vic.category || "GENERAL");
    setVictimClassification(vic.victimClassification || "Adult");
    setMedicalExamRequiredForAge(vic.medicalExamRequiredForAge || false);
    setDob(vic.dob || "");
    setYearOfBirth(vic.yearOfBirth || "");
    setAgeYears(vic.ageYears || (vic.age ? String(vic.age) : ""));
    setAgeMonths(vic.ageMonths || "");
    setAgeRangeFrom(vic.ageRangeFrom || "");
    setAgeRangeTo(vic.ageRangeTo || "");
    setPermHouseNo(vic.permHouseNo || "");
    setPermStreet(vic.permStreet || "");
    setPermColony(vic.permColony || "");
    setPermCity(vic.permCity || "Gurugram");
    setPermTehsil(vic.permTehsil || "Gurugram");
    setPermCountry(vic.permCountry || "India");
    setPermState(vic.permState || "Haryana");
    setPermDistrict(vic.permDistrict || "Gurugram");
    setPermPs(vic.permPs || "PS Sector 29 Gurugram");
    setPermPincode(vic.permPincode || "");
    setPresentSameAsPerm(vic.presentSameAsPerm ?? true);
    setPresHouseNo(vic.presHouseNo || "");
    setPresStreet(vic.presStreet || "");
    setPresColony(vic.presColony || "");
    setPresCity(vic.presCity || "Gurugram");
    setPresDistrict(vic.presDistrict || "Gurugram");
    setPresState(vic.presState || "Haryana");
    setPresPincode(vic.presPincode || "");
    setOccupation(vic.occupation || "Private Job");
    setNationality(vic.nationality || "Indian");
    setIdentifications(vic.identifications || []);
    setStatementText(vic.statementText || (vic.statements?.[0]?.text || ""));
    setErrorMsg(null);
    window.scrollTo({ top: 300, behavior: "smooth" });
  };

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

  const handleSubmit = () => {
    setErrorMsg(null);
    setSuccessNotice(null);

    if (!firstName.trim()) {
      setErrorMsg("Victim First Name is mandatory.");
      setActiveSubtab("personal");
      return;
    }

    const calculatedName = [firstName.trim(), middleName.trim(), lastName.trim()].filter(Boolean).join(" ");
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
      id: editingId || `vic-${Date.now()}`,
      srNo: editingId ? undefined : victimsList.length + 1,
      name: calculatedName,
      fullName: calculatedName,
      firstName: firstName.trim(),
      middleName: middleName.trim() || undefined,
      lastName: lastName.trim() || undefined,
      uid: uid.trim() || undefined,
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
      victimType: "Victim",
      medicalExamRequiredForAge,
      age: ageYears || undefined,
      dob: dob || undefined,
      yearOfBirth: yearOfBirth || undefined,
      ageYears: ageYears || undefined,
      ageMonths: ageMonths || undefined,
      ageRangeFrom: ageRangeFrom || undefined,
      ageRangeTo: ageRangeTo || undefined,
      address: fullAddress || "Address on Record",
      fullAddressString: fullAddress || "Address on Record",
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
      occupation: occupation.trim() || undefined,
      nationality: nationality.trim() || undefined,
      identifications,
      statementText: statementText.trim() || undefined,
      statements: statementText.trim()
        ? [{ id: `stmt-${Date.now()}`, text: statementText.trim(), date: new Date().toISOString() }]
        : [],
    };

    if (editingId) {
      onUpdateVictim(victimData);
      setSuccessNotice(`Victim "${calculatedName}" updated successfully.`);
    } else {
      onAddVictim(victimData);
      setSuccessNotice(`Victim "${calculatedName}" added to the FIR.`);
    }

    handleClear();
  };

  return (
    <div className="space-y-6">
      {/* INLINE ENTRY CARD */}
      <Card className="border-pink-200 shadow-xs">
        <CardHeader className="py-3 px-4 bg-gradient-to-r from-pink-50 via-slate-50 to-slate-50 border-b border-pink-200 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-pink-100 border border-pink-300 flex items-center justify-center text-pink-700">
              <User className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold text-slate-800 tracking-tight">
                {editingId ? "Edit Victim Record" : "Victim Information Form (पीड़ित का विवरण)"}
              </CardTitle>
              <p className="text-[11px] text-slate-500">
                Direct entry form — fill details and add to the Victims list below without popup dialogs.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onLinkComplainantAsVictim && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={onLinkComplainantAsVictim}
                className="text-xs text-pink-800 border-pink-300 hover:bg-pink-100 flex items-center gap-1 h-7"
              >
                <UserCheck className="w-3.5 h-3.5" />
                Link Complainant as Victim
              </Button>
            )}
            {editingId && (
              <span className="text-xs bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded border border-amber-300">
                Editing Record
              </span>
            )}
          </div>
        </CardHeader>

        {/* 4 Subtabs Navigation */}
        <div className="flex items-center gap-1 border-b border-slate-200 bg-slate-100/70 p-2 text-xs overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveSubtab("personal")}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
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
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeSubtab === "address"
                ? "bg-white text-[#0b192c] shadow-2xs border border-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
            Address Details
          </button>
          <button
            type="button"
            onClick={() => setActiveSubtab("other")}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
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
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeSubtab === "statements"
                ? "bg-white text-[#0b192c] shadow-2xs border border-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-amber-600" />
            Statements
          </button>
        </div>

        <CardContent className="p-4 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successNotice && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 flex items-center gap-2 font-medium">
              <Check className="w-4 h-4 shrink-0" />
              <span>{successNotice}</span>
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
                    className="w-full p-2 rounded-lg border border-slate-300 font-mono text-xs focus:ring-1 focus:ring-pink-600"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    placeholder="e.g. Meena"
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 text-xs focus:ring-1 focus:ring-pink-600"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Middle Name</label>
                  <input
                    type="text"
                    value={middleName}
                    onChange={(e) => setMiddleName(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 text-xs focus:ring-1 focus:ring-pink-600"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    placeholder="e.g. Sharma"
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 text-xs focus:ring-1 focus:ring-pink-600"
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
                    className="bg-slate-800 hover:bg-slate-900 text-white text-xs px-3"
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
                        name="victimClassInline"
                        checked={victimClassification === "Adult"}
                        onChange={() => setVictimClassification("Adult")}
                      />
                      <span>Adult (वयस्क)</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-pink-900">
                      <input
                        type="radio"
                        name="victimClassInline"
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
                        name="medExamInline"
                        checked={medicalExamRequiredForAge}
                        onChange={() => setMedicalExamRequiredForAge(true)}
                      />
                      <span>Yes</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="medExamInline"
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
                    <input
                      type="date"
                      value={dob}
                      onChange={(e) => handleDobChange(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-300 bg-white text-xs"
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
                    className="bg-slate-800 hover:bg-slate-900 text-white text-xs shrink-0"
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
                rows={6}
                placeholder="Record statement verbatim as narrated by victim in presence of enquiry officer/woman officer..."
                value={statementText}
                onChange={(e) => setStatementText(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-300 bg-white text-xs leading-relaxed focus:ring-2 focus:ring-pink-500"
              />
            </div>
          )}

          {/* ACTIONS: ADD / UPDATE / CLEAR */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClear}
              className="text-xs text-slate-600 hover:bg-slate-100 flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {editingId ? "Cancel Edit" : "Clear Form"}
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSubmit}
              className="text-xs bg-pink-700 hover:bg-pink-800 text-white font-bold flex items-center gap-1.5 px-4"
            >
              {editingId ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Update Victim
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  Add to Victims List
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* RECORDED VICTIMS LIST TABLE */}
      <Card className="border-slate-200">
        <CardHeader className="py-2.5 px-4 bg-slate-50 border-b border-slate-200 flex flex-row items-center justify-between">
          <CardTitle className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <User className="w-4 h-4 text-pink-600" />
            Recorded Victims in Case ({victimsList.length})
          </CardTitle>
          <span className="text-[11px] text-slate-500 font-medium">
            Edit directly populates the form above
          </span>
        </CardHeader>
        <CardContent className="p-4 text-xs">
          {victimsList.length > 0 ? (
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 font-bold border-b border-slate-200 text-slate-700">
                  <tr>
                    <th className="p-2.5 w-12">S.No.</th>
                    <th className="p-2.5">Victim Name</th>
                    <th className="p-2.5">Gender / Age</th>
                    <th className="p-2.5">Address</th>
                    <th className="p-2.5">Type / Class</th>
                    <th className="p-2.5">Statements</th>
                    <th className="p-2.5 w-24 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {victimsList.map((vic, idx) => (
                    <tr
                      key={vic.id}
                      className={`hover:bg-slate-50 transition-colors ${
                        editingId === vic.id ? "bg-pink-50/50 font-medium" : ""
                      }`}
                    >
                      <td className="p-2.5 font-bold text-slate-500">{vic.srNo || idx + 1}</td>
                      <td className="p-2.5">
                        <div className="font-semibold text-slate-900">{vic.name || vic.fullName}</div>
                        {vic.aliases && vic.aliases.length > 0 && (
                          <div className="text-[10px] text-slate-500">
                            Alias: {vic.aliases.map((a) => a.aliasName).join(", ")}
                          </div>
                        )}
                        {vic.uid && (
                          <div className="text-[10px] text-slate-400 font-mono">UID: {vic.uid}</div>
                        )}
                      </td>
                      <td className="p-2.5">
                        {vic.gender} / {vic.age || vic.ageYears || "Adult"}
                      </td>
                      <td className="p-2.5 text-slate-600 max-w-xs truncate" title={vic.address || vic.fullAddressString}>
                        {vic.address || vic.fullAddressString || "—"}
                      </td>
                      <td className="p-2.5">
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            vic.victimClassification === "Child"
                              ? "bg-pink-100 text-pink-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {vic.victimClassification || vic.victimType || "Victim"}
                        </span>
                      </td>
                      <td className="p-2.5 font-mono text-[11px]">
                        {vic.statementText || (vic.statements && vic.statements.length > 0)
                          ? "Recorded"
                          : "None"}
                      </td>
                      <td className="p-2.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleEdit(vic)}
                            className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                            title="Edit Victim in Form Above"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteVictim(vic.id)}
                            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                            title="Delete Victim"
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
            <div className="text-center py-6 text-slate-400 bg-slate-50/50 rounded border border-dashed border-slate-200">
              <User className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="font-medium text-slate-600">No victims added yet.</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Fill the form above and click &quot;Add to Victims List&quot;, or click &quot;Link Complainant as Victim&quot;.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
