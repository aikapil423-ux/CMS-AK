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
  Eye,
  Shield,
  Calendar,
  Layers,
} from "lucide-react";
import { AccusedPerson, FIRAliasEntry, FIRIdentificationEntry } from "@/types";
import { Button } from "@/components/ui/button";
import {
  GENDER_OPTIONS,
  MARITAL_STATUS_OPTIONS,
  RELATION_TYPE_OPTIONS,
  CASTE_CATEGORY_OPTIONS,
  IDENTIFICATION_TYPE_OPTIONS,
} from "@/components/fir/firDropdownConstants";

export interface ExtendedAccusedPerson extends AccusedPerson {
  accusedType: "Known" | "Unknown-Seen";
  isKnown?: boolean;
  isCaseAgainstPolice?: boolean;
  hasCaseAgainstPolice?: boolean;
  policePersonnelName?: string;
  uid?: string;
  nprNumber?: string;
  gender?: string;
  maritalStatus?: string;
  relationType?: string;
  relativeName?: string;
  mobile?: string;
  landline?: string;
  email?: string;
  category?: string;
  age?: number | string;
  isJuvenile?: boolean;
  medicalExamRequiredForAge?: boolean;
  // Age panel
  dob?: string;
  yearOfBirth?: string;
  ageYears?: string;
  ageMonths?: string;
  ageRangeFrom?: string;
  ageRangeTo?: string;
  // Aliases
  aliases?: FIRAliasEntry[];
  // Address
  addressesList?: Array<{
    id: string;
    houseNo?: string;
    streetName?: string;
    colony?: string;
    city?: string;
    district?: string;
    state?: string;
    country?: string;
  }>;
  // Other Information
  occupation?: string;
  nationality?: string;
  passportNumber?: string;
  passportIssuePlace?: string;
  passportIssueDate?: string;
  identifications?: FIRIdentificationEntry[];
  // Physical Description
  specialTraits?: string;
  bodyBuild?: string;
  bodyComplexion?: string;
  heightUnit?: "cm" | "feet_inch";
  heightFrom?: string;
  heightTo?: string;
  faceType?: string;
  forehead?: string;
  cheek?: string;
  chin?: string;
  isPockmarked?: boolean;
  lips?: string;
  nose?: string;
  teeth?: string;
  beard?: string;
  moustaches?: string;
  clothingDescription?: string;
  distinguishingMarks?: string;
}

export interface AccusedDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (accused: ExtendedAccusedPerson) => void;
  initialAccused?: ExtendedAccusedPerson | null;
  initialData?: ExtendedAccusedPerson | null;
  defaultType?: "Known" | "Unknown-Seen";
}

export const AccusedDialog: React.FC<AccusedDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  initialAccused: propInitialAccused,
  initialData,
  defaultType = "Known",
}) => {
  const initialAccused = propInitialAccused || initialData;
  const [accusedType, setAccusedType] = useState<"Known" | "Unknown-Seen">(defaultType);
  const [activeSubtab, setActiveSubtab] = useState<"personal" | "address" | "other" | "physical">("personal");

  // Personal Info
  const [isCaseAgainstPolice, setIsCaseAgainstPolice] = useState(false);
  const [policePersonnelName, setPolicePersonnelName] = useState("");
  const [uid, setUid] = useState("");
  const [nprNumber, setNprNumber] = useState("");
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [aliases, setAliases] = useState<FIRAliasEntry[]>([]);
  const [tempAlias, setTempAlias] = useState("");
  const [gender, setGender] = useState<string>("Male");
  const [maritalStatus, setMaritalStatus] = useState("Married");
  const [relationType, setRelationType] = useState("Father");
  const [relativeName, setRelativeName] = useState("");
  const [mobile, setMobile] = useState("");
  const [landline, setLandline] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState("GENERAL");
  const [isJuvenile, setIsJuvenile] = useState(false);
  const [medicalExamRequiredForAge, setMedicalExamRequiredForAge] = useState(false);

  // Age Panel
  const [dob, setDob] = useState("");
  const [yearOfBirth, setYearOfBirth] = useState("");
  const [ageYears, setAgeYears] = useState("");
  const [ageMonths, setAgeMonths] = useState("");
  const [ageRangeFrom, setAgeRangeFrom] = useState("");
  const [ageRangeTo, setAgeRangeTo] = useState("");

  // Address
  const [hasPresentAddress, setHasPresentAddress] = useState(true);
  const [houseNo, setHouseNo] = useState("");
  const [streetName, setStreetName] = useState("");
  const [colony, setColony] = useState("");
  const [city, setCity] = useState("Gurugram");
  const [tehsil, setTehsil] = useState("Gurugram");
  const [country, setCountry] = useState("India");
  const [state, setState] = useState("Haryana");
  const [district, setDistrict] = useState("Gurugram");
  const [policeStation, setPoliceStation] = useState("PS Sector 29 Gurugram");
  const [pincode, setPincode] = useState("");
  const [addressesList, setAddressesList] = useState<
    Array<{
      id: string;
      houseNo?: string;
      streetName?: string;
      colony?: string;
      city?: string;
      district?: string;
      state?: string;
      country?: string;
    }>
  >([]);

  // Other Information
  const [occupation, setOccupation] = useState("Self Employed / Business");
  const [nationality, setNationality] = useState("Indian");
  const [passportNumber, setPassportNumber] = useState("");
  const [passportIssuePlace, setPassportIssuePlace] = useState("");
  const [passportIssueDate, setPassportIssueDate] = useState("");
  const [identifications, setIdentifications] = useState<FIRIdentificationEntry[]>([]);
  const [tempIdType, setTempIdType] = useState("Aadhar Card");
  const [tempIdNumber, setTempIdNumber] = useState("");

  // Physical Description
  const [bodyBuild, setBodyBuild] = useState("Medium");
  const [bodyComplexion, setBodyComplexion] = useState("Wheatish");
  const [heightUnit, setHeightUnit] = useState<"cm" | "feet_inch">("feet_inch");
  const [heightFrom, setHeightFrom] = useState("5.6");
  const [heightTo, setHeightTo] = useState("5.8");
  const [faceType, setFaceType] = useState("Round");
  const [forehead, setForehead] = useState("Broad");
  const [cheek, setCheek] = useState("Normal");
  const [chin, setChin] = useState("Normal");
  const [isPockmarked, setIsPockmarked] = useState(false);
  const [lips, setLips] = useState("Normal");
  const [nose, setNose] = useState("Sharp / Straight");
  const [teeth, setTeeth] = useState("Normal");
  const [beard, setBeard] = useState("Clean Shaven");
  const [moustaches, setMoustaches] = useState("Clean Shaven");
  const [clothingDescription, setClothingDescription] = useState("");
  const [distinguishingMarks, setDistinguishingMarks] = useState("");

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (initialAccused) {
      setAccusedType(initialAccused.accusedType || (initialAccused.isIdentified ? "Known" : "Unknown-Seen"));
      setIsCaseAgainstPolice(initialAccused.isCaseAgainstPolice || false);
      setPolicePersonnelName(initialAccused.policePersonnelName || "");
      setUid(initialAccused.uid || "");
      setNprNumber(initialAccused.nprNumber || "");
      setFirstName(initialAccused.name === "Unknown Accused" ? "" : initialAccused.name.split(" ")[0] || "");
      setLastName(initialAccused.name === "Unknown Accused" ? "" : initialAccused.name.split(" ").slice(1).join(" ") || "");
      setAliases(initialAccused.aliases || []);
      setGender(initialAccused.gender || "Male");
      setMaritalStatus(initialAccused.maritalStatus || "Married");
      setRelationType(initialAccused.relationType || "Father");
      setRelativeName(initialAccused.fatherName || initialAccused.relativeName || "");
      setMobile(initialAccused.mobile || "");
      setLandline(initialAccused.landline || "");
      setEmail(initialAccused.email || "");
      setCategory(initialAccused.category || "GENERAL");
      setIsJuvenile(initialAccused.isJuvenile || false);
      setMedicalExamRequiredForAge(initialAccused.medicalExamRequiredForAge || false);
      setDob(initialAccused.dob || "");
      setYearOfBirth(initialAccused.yearOfBirth || "");
      setAgeYears(initialAccused.ageYears || (initialAccused.age ? String(initialAccused.age) : ""));
      setAgeRangeFrom(initialAccused.ageRangeFrom || "");
      setAgeRangeTo(initialAccused.ageRangeTo || "");
      setAddressesList(initialAccused.addressesList || []);
      setOccupation(initialAccused.occupation || "Self Employed / Business");
      setNationality(initialAccused.nationality || "Indian");
      setPassportNumber(initialAccused.passportNumber || "");
      setPassportIssuePlace(initialAccused.passportIssuePlace || "");
      setPassportIssueDate(initialAccused.passportIssueDate || "");
      setIdentifications(initialAccused.identifications || []);
      setBodyBuild(initialAccused.bodyBuild || "Medium");
      setBodyComplexion(initialAccused.bodyComplexion || "Wheatish");
      setHeightFrom(initialAccused.heightFrom || "5.6");
      setHeightTo(initialAccused.heightTo || "5.8");
      setFaceType(initialAccused.faceType || "Round");
      setForehead(initialAccused.forehead || "Broad");
      setCheek(initialAccused.cheek || "Normal");
      setChin(initialAccused.chin || "Normal");
      setIsPockmarked(initialAccused.isPockmarked || false);
      setLips(initialAccused.lips || "Normal");
      setNose(initialAccused.nose || "Sharp / Straight");
      setTeeth(initialAccused.teeth || "Normal");
      setBeard(initialAccused.beard || "Clean Shaven");
      setMoustaches(initialAccused.moustaches || "Clean Shaven");
      setClothingDescription(initialAccused.clothingDescription || "");
      setDistinguishingMarks(initialAccused.distinguishingMarks || initialAccused.physicalDescription || "");
    }
  }, [initialAccused, isOpen]);

  if (!isOpen) return null;

  const handleDobChange = (val: string) => {
    setDob(val);
    if (val) {
      const birth = new Date(val);
      const now = new Date();
      if (!isNaN(birth.getTime())) {
        let age = now.getFullYear() - birth.getFullYear();
        const m = now.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
        if (age >= 0) {
          setAgeYears(String(age));
          setYearOfBirth(String(birth.getFullYear()));
          setIsJuvenile(age < 18);
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

  const handleAddAddress = () => {
    if (!city.trim() && !colony.trim()) return;
    const newAddr = {
      id: `addr-${Date.now()}`,
      houseNo: houseNo.trim() || undefined,
      streetName: streetName.trim() || undefined,
      colony: colony.trim() || undefined,
      city: city.trim() || "Gurugram",
      district: district.trim() || "Gurugram",
      state: state.trim() || "Haryana",
      country: country.trim() || "India",
    };
    setAddressesList([...addressesList, newAddr]);
    setHouseNo("");
    setStreetName("");
    setColony("");
  };

  const handleDeleteAddress = (idx: number) => {
    setAddressesList(addressesList.filter((_, i) => i !== idx));
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

    const isKnown = accusedType === "Known";
    if (isKnown && !firstName.trim()) {
      setErrorMsg("First Name is mandatory for Known Accused. If identity is not established, select 'Unknown-Seen'.");
      setActiveSubtab("personal");
      return;
    }

    const calculatedName = isKnown
      ? [firstName.trim(), middleName.trim(), lastName.trim()].filter(Boolean).join(" ")
      : "Unknown Accused";

    const physicalSummary = [
      bodyBuild ? `Build: ${bodyBuild}` : null,
      bodyComplexion ? `Complexion: ${bodyComplexion}` : null,
      heightFrom ? `Ht: ${heightFrom}-${heightTo || heightFrom} ${heightUnit}` : null,
      distinguishingMarks ? `Marks: ${distinguishingMarks}` : null,
    ]
      .filter(Boolean)
      .join(", ");

    const savedAccused: ExtendedAccusedPerson = {
      id: initialAccused?.id || `acc-${Date.now()}`,
      accusedType,
      isIdentified: isKnown,
      name: calculatedName,
      alias: aliases[0]?.aliasName,
      fatherName: relativeName.trim() || undefined,
      relativeName: relativeName.trim() || undefined,
      relationType,
      address:
        addressesList[0]
          ? [addressesList[0].houseNo, addressesList[0].colony, addressesList[0].city]
              .filter(Boolean)
              .join(", ")
          : undefined,
      physicalDescription: physicalSummary || undefined,
      gender,
      isCaseAgainstPolice,
      policePersonnelName: isCaseAgainstPolice ? policePersonnelName.trim() : undefined,
      uid: uid.trim() || undefined,
      nprNumber: nprNumber.trim() || undefined,
      aliases,
      mobile: mobile.trim() || undefined,
      landline: landline.trim() || undefined,
      email: email.trim() || undefined,
      category,
      isJuvenile,
      medicalExamRequiredForAge,
      dob: dob || undefined,
      yearOfBirth: yearOfBirth || undefined,
      ageYears: ageYears || undefined,
      ageMonths: ageMonths || undefined,
      ageRangeFrom: ageRangeFrom || undefined,
      ageRangeTo: ageRangeTo || undefined,
      addressesList,
      occupation: occupation.trim() || undefined,
      nationality: nationality.trim() || undefined,
      passportNumber: passportNumber.trim() || undefined,
      passportIssuePlace: passportIssuePlace.trim() || undefined,
      passportIssueDate: passportIssueDate || undefined,
      identifications,
      bodyBuild,
      bodyComplexion,
      heightUnit,
      heightFrom,
      heightTo,
      faceType,
      forehead,
      cheek,
      chin,
      isPockmarked,
      lips,
      nose,
      teeth,
      beard,
      moustaches,
      clothingDescription: clothingDescription.trim() || undefined,
      distinguishingMarks: distinguishingMarks.trim() || undefined,
    };

    onSave(savedAccused);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in-50">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden text-slate-800">
        {/* Header */}
        <div className="px-5 py-3.5 bg-[#0b192c] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-600/30 border border-red-400/40 flex items-center justify-center text-red-200">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight">
                {initialAccused ? "Edit Accused Details" : "Add Accused / Suspect (अभियुक्त का विवरण)"}
              </h2>
              <p className="text-[11px] text-slate-300">
                Register known or unknown suspects, physical attributes, police involvement, and IDs
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

        {/* Accused Type Selector Banner */}
        <div className="px-4 py-2.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <span className="font-bold text-slate-700">Accused / Suspect Type:</span>
            <label className="flex items-center gap-1.5 cursor-pointer font-bold text-slate-900">
              <input
                type="radio"
                name="accusedTypeRadio"
                checked={accusedType === "Known"}
                onChange={() => setAccusedType("Known")}
                className="text-blue-600"
              />
              <span>Known (नामित / ज्ञात)</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer font-bold text-purple-900">
              <input
                type="radio"
                name="accusedTypeRadio"
                checked={accusedType === "Unknown-Seen"}
                onChange={() => {
                  setAccusedType("Unknown-Seen");
                  setActiveSubtab("physical");
                }}
                className="text-purple-600"
              />
              <span>Unknown-Seen (अज्ञात / हुलिया आधारित)</span>
            </label>
          </div>
        </div>

        {/* Subtabs Navigation (Shown only for Known accused or to view full physical details) */}
        {accusedType === "Known" ? (
          <div className="flex items-center gap-1 border-b border-slate-200 bg-slate-50 p-2 text-xs">
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
              onClick={() => setActiveSubtab("physical")}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors ${
                activeSubtab === "physical"
                  ? "bg-white text-[#0b192c] shadow-2xs border border-slate-200"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Eye className="w-3.5 h-3.5 text-red-600" />
              Physical Description
            </button>
          </div>
        ) : (
          <div className="px-4 py-2 bg-purple-50 border-b border-purple-200 text-purple-900 text-xs font-semibold">
            Unknown Accused: Capturing physical attributes, build, complexion, height range, and distinguishing traits. Name and birth date are not fabricated.
          </div>
        )}

        {/* Content Body */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* ============================================================ */}
          {/* SUBTAB 1: PERSONAL INFORMATION (Known Accused Only) */}
          {/* ============================================================ */}
          {accusedType === "Known" && activeSubtab === "personal" && (
            <div className="space-y-4 animate-in fade-in-30">
              {/* Case Against Police Personnel Panel */}
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-amber-600" />
                  <span className="font-bold text-amber-950 text-xs">
                    Is the Case Against Police Personnel? (पुलिसकर्मी के विरुद्ध मामला?)
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1 cursor-pointer font-bold text-red-700">
                    <input
                      type="radio"
                      name="caseAgainstPolice"
                      checked={isCaseAgainstPolice}
                      onChange={() => setIsCaseAgainstPolice(true)}
                    />
                    <span>Yes</span>
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer font-bold">
                    <input
                      type="radio"
                      name="caseAgainstPolice"
                      checked={!isCaseAgainstPolice}
                      onChange={() => setIsCaseAgainstPolice(false)}
                    />
                    <span>No</span>
                  </label>
                </div>
              </div>

              {isCaseAgainstPolice && (
                <div className="p-3 bg-white border border-amber-300 rounded-lg">
                  <label className="font-bold text-slate-700 block mb-1">
                    Officer / Personnel Name, Belt No. &amp; Designation
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. HC Ramesh Kumar No. 412/KKR, PS Sadar"
                    value={policePersonnelName}
                    onChange={(e) => setPolicePersonnelName(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
              )}

              {/* UID, NPR & Names */}
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">UID (Aadhaar)</label>
                  <input
                    type="text"
                    maxLength={12}
                    value={uid}
                    onChange={(e) => setUid(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">NPR Number</label>
                  <input
                    type="text"
                    value={nprNumber}
                    onChange={(e) => setNprNumber(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">First Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 text-xs font-semibold"
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
                    placeholder="e.g. Kallu, Pandit..."
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

              {/* Gender, Marital Status, Relative, Contacts */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
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

              {/* Juvenile & Medical Exam */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-100 rounded-xl">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">
                    Is Accused Juvenile in Conflict with Law? (नाबालिग?)
                  </label>
                  <div className="flex items-center gap-4 mt-1">
                    <label className="flex items-center gap-1.5 cursor-pointer font-bold text-amber-800">
                      <input
                        type="radio"
                        name="accusedJuvenile"
                        checked={isJuvenile}
                        onChange={() => setIsJuvenile(true)}
                      />
                      <span>Yes (Juvenile)</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="accusedJuvenile"
                        checked={!isJuvenile}
                        onChange={() => setIsJuvenile(false)}
                      />
                      <span>No</span>
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
                        name="accusedMedExam"
                        checked={medicalExamRequiredForAge}
                        onChange={() => setMedicalExamRequiredForAge(true)}
                      />
                      <span>Yes</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="accusedMedExam"
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
                      placeholder="e.g. 1992"
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

          {/* ============================================================ */}
          {/* SUBTAB 2: ADDRESS (Known Accused Only) */}
          {/* ============================================================ */}
          {accusedType === "Known" && activeSubtab === "address" && (
            <div className="space-y-4 animate-in fade-in-30">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <span className="font-bold text-slate-800 text-xs block">Add Accused Address</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">House / Building No.</label>
                    <input
                      type="text"
                      value={houseNo}
                      onChange={(e) => setHouseNo(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-300 bg-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Street Name</label>
                    <input
                      type="text"
                      value={streetName}
                      onChange={(e) => setStreetName(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-300 bg-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Colony / Locality</label>
                    <input
                      type="text"
                      value={colony}
                      onChange={(e) => setColony(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-300 bg-white text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Village / Town / City</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-300 bg-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Tehsil</label>
                    <input
                      type="text"
                      value={tehsil}
                      onChange={(e) => setTehsil(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-300 bg-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">District</label>
                    <input
                      type="text"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-300 bg-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">State</label>
                    <input
                      type="text"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-300 bg-white text-xs"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    type="button"
                    onClick={handleAddAddress}
                    className="bg-[#0b192c] hover:bg-slate-800 text-white text-xs flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Address to Table
                  </Button>
                </div>
              </div>

              {/* Saved Address Table */}
              <div className="space-y-2">
                <span className="font-bold text-slate-800 text-xs block">
                  Saved Address Records ({addressesList.length})
                </span>
                {addressesList.length > 0 ? (
                  <div className="border border-slate-200 rounded-lg overflow-x-auto shadow-2xs">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                        <tr>
                          <th className="p-2 w-12">S.No.</th>
                          <th className="p-2">House No</th>
                          <th className="p-2">Street Name</th>
                          <th className="p-2">Colony / Area</th>
                          <th className="p-2">City</th>
                          <th className="p-2">District</th>
                          <th className="p-2 w-16 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {addressesList.map((ad, idx) => (
                          <tr key={ad.id}>
                            <td className="p-2 font-bold text-slate-500">{idx + 1}</td>
                            <td className="p-2">{ad.houseNo || "—"}</td>
                            <td className="p-2">{ad.streetName || "—"}</td>
                            <td className="p-2">{ad.colony || "—"}</td>
                            <td className="p-2 font-semibold">{ad.city}</td>
                            <td className="p-2">{ad.district}</td>
                            <td className="p-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleDeleteAddress(idx)}
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
                ) : (
                  <div className="p-4 border border-dashed border-slate-200 rounded-lg text-slate-400 text-center">
                    No addresses added yet. Enter details above and click &ldquo;Add Address to Table&rdquo;.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* SUBTAB 3: OTHER INFORMATION (Known Accused Only) */}
          {/* ============================================================ */}
          {accusedType === "Known" && activeSubtab === "other" && (
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

              {/* Passport Details */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <span className="font-bold text-slate-800 text-xs block">Passport Information (यदि उपलब्ध हो)</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Passport Number</label>
                    <input
                      type="text"
                      placeholder="e.g. Z1234567"
                      value={passportNumber}
                      onChange={(e) => setPassportNumber(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-300 bg-white font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Passport Issue Place</label>
                    <input
                      type="text"
                      placeholder="e.g. RPO Delhi"
                      value={passportIssuePlace}
                      onChange={(e) => setPassportIssuePlace(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-300 bg-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Passport Issue Date</label>
                    <input
                      type="date"
                      value={passportIssueDate}
                      onChange={(e) => setPassportIssueDate(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-300 bg-white text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Identification Table */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                <label className="font-bold text-slate-800 block">Identification Documents</label>
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

          {/* ============================================================ */}
          {/* SUBTAB 4: PHYSICAL DESCRIPTION (Known & Unknown Accused) */}
          {/* ============================================================ */}
          {(accusedType === "Unknown-Seen" || activeSubtab === "physical") && (
            <div className="space-y-4 animate-in fade-in-30">
              {/* Build, Complexion, Height */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <span className="font-bold text-slate-800 text-xs block">
                  Body Structure &amp; Height Measurements
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Body Build Type</label>
                    <select
                      value={bodyBuild}
                      onChange={(e) => setBodyBuild(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-300 bg-white text-xs"
                    >
                      <option value="Thin">Thin / Lean (दुबला)</option>
                      <option value="Medium">Medium / Normal (मध्यम)</option>
                      <option value="Heavy">Heavy / Fat (भारी / मोटा)</option>
                      <option value="Athletic">Athletic / Muscular (गठीला)</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Body Complexion Type</label>
                    <select
                      value={bodyComplexion}
                      onChange={(e) => setBodyComplexion(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-300 bg-white text-xs"
                    >
                      <option value="Fair">Fair (गोरा)</option>
                      <option value="Wheatish">Wheatish (गेहुंआ)</option>
                      <option value="Dark">Dark / Sallow (सांवला)</option>
                      <option value="Very Fair">Very Fair (अति गोरा)</option>
                      <option value="Black">Black (काला)</option>
                    </select>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-slate-700 block">Height Range (From - To)</label>
                      <div className="flex items-center gap-1 text-[10px]">
                        <button
                          type="button"
                          onClick={() => setHeightUnit("feet_inch")}
                          className={`px-1.5 py-0.5 rounded ${
                            heightUnit === "feet_inch"
                              ? "bg-[#0b192c] text-white font-bold"
                              : "bg-slate-200 text-slate-600"
                          }`}
                        >
                          Ft-In
                        </button>
                        <button
                          type="button"
                          onClick={() => setHeightUnit("cm")}
                          className={`px-1.5 py-0.5 rounded ${
                            heightUnit === "cm"
                              ? "bg-[#0b192c] text-white font-bold"
                              : "bg-slate-200 text-slate-600"
                          }`}
                        >
                          cm
                        </button>
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder="From"
                        value={heightFrom}
                        onChange={(e) => setHeightFrom(e.target.value)}
                        className="w-1/2 p-2 rounded-lg border border-slate-300 bg-white font-mono text-xs"
                      />
                      <input
                        type="text"
                        placeholder="To"
                        value={heightTo}
                        onChange={(e) => setHeightTo(e.target.value)}
                        className="w-1/2 p-2 rounded-lg border border-slate-300 bg-white font-mono text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Facial & General Physical Traits */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-1.5">
                  <span className="font-bold text-slate-800 text-xs">
                    Facial Features &amp; Appearance (मुख एवं सामान्य लक्षण)
                  </span>
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-purple-900">
                    <input
                      type="checkbox"
                      checked={isPockmarked}
                      onChange={(e) => setIsPockmarked(e.target.checked)}
                      className="rounded text-purple-600"
                    />
                    <span>Pockmarked (चेचक के दाग)?</span>
                  </label>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Face Type</label>
                    <select
                      value={faceType}
                      onChange={(e) => setFaceType(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-300 bg-white text-xs"
                    >
                      <option value="Round">Round (गोल)</option>
                      <option value="Oval">Oval (अंडाकार)</option>
                      <option value="Long">Long (लंबा)</option>
                      <option value="Square">Square (चौकोर)</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Forehead</label>
                    <select
                      value={forehead}
                      onChange={(e) => setForehead(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-300 bg-white text-xs"
                    >
                      <option value="Broad">Broad (चौड़ा)</option>
                      <option value="Narrow">Narrow (संकीर्ण)</option>
                      <option value="Receding">Receding (पीछे हटा)</option>
                      <option value="Normal">Normal</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Cheek</label>
                    <select
                      value={cheek}
                      onChange={(e) => setCheek(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-300 bg-white text-xs"
                    >
                      <option value="Normal">Normal</option>
                      <option value="High Cheekbones">High Cheekbones</option>
                      <option value="Sunken">Sunken (धंसा हुआ)</option>
                      <option value="Plump">Plump (फूला हुआ)</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Chin</label>
                    <select
                      value={chin}
                      onChange={(e) => setChin(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-300 bg-white text-xs"
                    >
                      <option value="Normal">Normal</option>
                      <option value="Pointed">Pointed (नुकीली)</option>
                      <option value="Double Chin">Double Chin</option>
                      <option value="Cleft">Cleft Chin (गड्ढा)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Lips</label>
                    <select
                      value={lips}
                      onChange={(e) => setLips(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-300 bg-white text-xs"
                    >
                      <option value="Normal">Normal</option>
                      <option value="Thick">Thick (मोटे)</option>
                      <option value="Thin">Thin (पतले)</option>
                      <option value="Protruding">Protruding</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Nose</label>
                    <select
                      value={nose}
                      onChange={(e) => setNose(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-300 bg-white text-xs"
                    >
                      <option value="Sharp / Straight">Sharp / Straight (सीधी/तीखी)</option>
                      <option value="Broad / Flat">Broad / Flat (चौड़ी)</option>
                      <option value="Crooked / Hooked">Hooked (तोते जैसी)</option>
                      <option value="Small">Small</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Teeth</label>
                    <select
                      value={teeth}
                      onChange={(e) => setTeeth(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-300 bg-white text-xs"
                    >
                      <option value="Normal">Normal</option>
                      <option value="Protruding">Protruding (बाहर निकले)</option>
                      <option value="Discolored / Pan Stained">Pan / Tobacco Stained</option>
                      <option value="Broken / Missing">Broken / Missing</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Beard &amp; Moustache</label>
                    <div className="flex gap-1.5">
                      <select
                        value={beard}
                        onChange={(e) => setBeard(e.target.value)}
                        className="w-1/2 p-2 rounded-lg border border-slate-300 bg-white text-[11px]"
                      >
                        <option value="Clean Shaven">Clean Shaven</option>
                        <option value="Full Beard">Full Beard</option>
                        <option value="French / Goatee">French</option>
                        <option value="Stubble">Stubble</option>
                      </select>
                      <select
                        value={moustaches}
                        onChange={(e) => setMoustaches(e.target.value)}
                        className="w-1/2 p-2 rounded-lg border border-slate-300 bg-white text-[11px]"
                      >
                        <option value="Clean Shaven">No Moustache</option>
                        <option value="Normal">Normal</option>
                        <option value="Thick / Rajputi">Thick / Rajputi</option>
                        <option value="Pencil">Pencil</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Distinguishing Marks / Tattoos / Scars
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Cut mark on left cheek, tattoo on right forearm..."
                      value={distinguishingMarks}
                      onChange={(e) => setDistinguishingMarks(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-300 bg-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Clothing / Dress Worn at Time of Incident
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Black hoodie jacket, blue jeans, white sports shoes..."
                      value={clothingDescription}
                      onChange={(e) => setClothingDescription(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-300 bg-white text-xs"
                    />
                  </div>
                </div>
              </div>
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
              Save Accused Record
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
