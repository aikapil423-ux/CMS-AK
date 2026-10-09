"use client";

import React, { useState } from "react";
import {
  Crosshair,
  User,
  MapPin,
  FileText,
  RotateCcw,
  Check,
  Plus,
  Trash2,
  AlertCircle,
  Eye,
  Calendar,
  Layers,
  Edit2,
  Shield,
} from "lucide-react";
import { AccusedPerson, FIRAliasEntry, FIRIdentificationEntry } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  GENDER_OPTIONS,
  MARITAL_STATUS_OPTIONS,
  RELATION_TYPE_OPTIONS,
  CASTE_CATEGORY_OPTIONS,
  IDENTIFICATION_TYPE_OPTIONS,
  getDynamicGenderOptions,
  getDynamicMaritalStatusOptions,
  getDynamicRelationTypes,
  getDynamicCasteCategories,
  getDynamicIdentificationTypes,
} from "@/components/fir/firDropdownConstants";

export interface ExtendedAccusedPerson extends AccusedPerson {
  accusedType?: "Known" | "Unknown-Seen";
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

export interface InlineAccusedSectionProps {
  accusedList: ExtendedAccusedPerson[];
  isAccusedKnown: boolean;
  setIsAccusedKnown: (val: boolean) => void;
  accusedMoreThan: string;
  setAccusedMoreThan: (val: string) => void;
  onAddAccused: (accused: ExtendedAccusedPerson) => void;
  onUpdateAccused: (accused: ExtendedAccusedPerson) => void;
  onDeleteAccused: (id: string) => void;
}

export const InlineAccusedSection: React.FC<InlineAccusedSectionProps> = ({
  accusedList,
  isAccusedKnown,
  setIsAccusedKnown,
  accusedMoreThan,
  setAccusedMoreThan,
  onAddAccused,
  onUpdateAccused,
  onDeleteAccused,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [accusedType, setAccusedType] = useState<"Known" | "Unknown-Seen">(
    isAccusedKnown ? "Known" : "Unknown-Seen"
  );
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
  const [houseNo, setHouseNo] = useState("");
  const [streetName, setStreetName] = useState("");
  const [colony, setColony] = useState("");
  const [city, setCity] = useState("Gurugram");
  const [district, setDistrict] = useState("Gurugram");
  const [state, setState] = useState("Haryana");
  const [country, setCountry] = useState("India");
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
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const handleClear = () => {
    setEditingId(null);
    setAccusedType(isAccusedKnown ? "Known" : "Unknown-Seen");
    setIsCaseAgainstPolice(false);
    setPolicePersonnelName("");
    setUid("");
    setNprNumber("");
    setFirstName("");
    setMiddleName("");
    setLastName("");
    setAliases([]);
    setTempAlias("");
    setGender("Male");
    setMaritalStatus("Married");
    setRelationType("Father");
    setRelativeName("");
    setMobile("");
    setLandline("");
    setEmail("");
    setCategory("GENERAL");
    setIsJuvenile(false);
    setMedicalExamRequiredForAge(false);
    setDob("");
    setYearOfBirth("");
    setAgeYears("");
    setAgeMonths("");
    setAgeRangeFrom("");
    setAgeRangeTo("");
    setHouseNo("");
    setStreetName("");
    setColony("");
    setCity("Gurugram");
    setDistrict("Gurugram");
    setState("Haryana");
    setCountry("India");
    setAddressesList([]);
    setOccupation("Self Employed / Business");
    setNationality("Indian");
    setPassportNumber("");
    setPassportIssuePlace("");
    setPassportIssueDate("");
    setIdentifications([]);
    setTempIdType("Aadhar Card");
    setTempIdNumber("");
    setBodyBuild("Medium");
    setBodyComplexion("Wheatish");
    setHeightUnit("feet_inch");
    setHeightFrom("5.6");
    setHeightTo("5.8");
    setFaceType("Round");
    setForehead("Broad");
    setCheek("Normal");
    setChin("Normal");
    setIsPockmarked(false);
    setLips("Normal");
    setNose("Sharp / Straight");
    setTeeth("Normal");
    setBeard("Clean Shaven");
    setMoustaches("Clean Shaven");
    setClothingDescription("");
    setDistinguishingMarks("");
    setErrorMsg(null);
  };

  const handleEdit = (acc: ExtendedAccusedPerson) => {
    setEditingId(acc.id || null);
    const type = acc.accusedType || (acc.isIdentified !== false ? "Known" : "Unknown-Seen");
    setAccusedType(type);
    setIsCaseAgainstPolice(acc.isCaseAgainstPolice || acc.hasCaseAgainstPolice || false);
    setPolicePersonnelName(acc.policePersonnelName || "");
    setUid(acc.uid || "");
    setNprNumber(acc.nprNumber || "");
    const parts = (acc.name === "Unknown Accused" ? "" : acc.name || "").split(" ");
    setFirstName(parts[0] || "");
    setMiddleName(parts.length > 2 ? parts.slice(1, -1).join(" ") : "");
    setLastName(parts.length > 1 ? parts[parts.length - 1] : "");
    setAliases(acc.aliases || []);
    setGender(acc.gender || "Male");
    setMaritalStatus(acc.maritalStatus || "Married");
    setRelationType(acc.relationType || "Father");
    setRelativeName(acc.fatherName || acc.relativeName || "");
    setMobile(acc.mobile || "");
    setLandline(acc.landline || "");
    setEmail(acc.email || "");
    setCategory(acc.category || "GENERAL");
    setIsJuvenile(acc.isJuvenile || false);
    setMedicalExamRequiredForAge(acc.medicalExamRequiredForAge || false);
    setDob(acc.dob || "");
    setYearOfBirth(acc.yearOfBirth || "");
    setAgeYears(acc.ageYears || (acc.age ? String(acc.age) : ""));
    setAgeMonths(acc.ageMonths || "");
    setAgeRangeFrom(acc.ageRangeFrom || "");
    setAgeRangeTo(acc.ageRangeTo || "");
    setAddressesList(acc.addressesList || []);
    setOccupation(acc.occupation || "Self Employed / Business");
    setNationality(acc.nationality || "Indian");
    setPassportNumber(acc.passportNumber || "");
    setPassportIssuePlace(acc.passportIssuePlace || "");
    setPassportIssueDate(acc.passportIssueDate || "");
    setIdentifications(acc.identifications || []);
    setBodyBuild(acc.bodyBuild || "Medium");
    setBodyComplexion(acc.bodyComplexion || "Wheatish");
    setHeightUnit(acc.heightUnit || "feet_inch");
    setHeightFrom(acc.heightFrom || "5.6");
    setHeightTo(acc.heightTo || "5.8");
    setFaceType(acc.faceType || "Round");
    setForehead(acc.forehead || "Broad");
    setCheek(acc.cheek || "Normal");
    setChin(acc.chin || "Normal");
    setIsPockmarked(acc.isPockmarked || false);
    setLips(acc.lips || "Normal");
    setNose(acc.nose || "Sharp / Straight");
    setTeeth(acc.teeth || "Normal");
    setBeard(acc.beard || "Clean Shaven");
    setMoustaches(acc.moustaches || "Clean Shaven");
    setClothingDescription(acc.clothingDescription || "");
    setDistinguishingMarks(acc.distinguishingMarks || acc.physicalDescription || "");
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

  const handleSubmit = () => {
    setErrorMsg(null);
    setSuccessNotice(null);

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

    const formattedAddress = addressesList[0]
      ? [addressesList[0].houseNo, addressesList[0].colony, addressesList[0].city]
          .filter(Boolean)
          .join(", ")
      : undefined;

    const savedAccused: ExtendedAccusedPerson = {
      id: editingId || `acc-${Date.now()}`,
      accusedType,
      isIdentified: isKnown,
      isKnown,
      name: calculatedName,
      alias: aliases[0]?.aliasName,
      fatherName: relativeName.trim() || undefined,
      relativeName: relativeName.trim() || undefined,
      relationType,
      address: formattedAddress,
      physicalDescription: physicalSummary || undefined,
      gender,
      isCaseAgainstPolice,
      hasCaseAgainstPolice: isCaseAgainstPolice,
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

    if (editingId) {
      onUpdateAccused(savedAccused);
      setSuccessNotice(`Accused "${calculatedName}" updated successfully.`);
    } else {
      onAddAccused(savedAccused);
      setSuccessNotice(`Accused "${calculatedName}" added to the FIR.`);
    }

    handleClear();
  };

  return (
    <div className="space-y-6">
      {/* GLOBAL ACCUSED SCOPE / MORE THAN BANNER */}
      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-4">
          <span className="font-bold text-slate-800">Case Accused Scope:</span>
          <label className="flex items-center gap-1.5 cursor-pointer font-bold text-slate-900">
            <input
              type="radio"
              name="accScopeRadio"
              checked={isAccusedKnown}
              onChange={() => {
                setIsAccusedKnown(true);
                setAccusedType("Known");
              }}
              className="text-red-600"
            />
            <span>Known / Suspected Identified</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer font-bold text-slate-900">
            <input
              type="radio"
              name="accScopeRadio"
              checked={!isAccusedKnown}
              onChange={() => {
                setIsAccusedKnown(false);
                setAccusedType("Unknown-Seen");
              }}
              className="text-red-600"
            />
            <span>Unknown Suspect(s) to be traced</span>
          </label>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="font-bold text-slate-700 whitespace-nowrap">Accused More Than:</span>
          <input
            type="text"
            placeholder="e.g. More than 4-5 unknown persons"
            value={accusedMoreThan}
            onChange={(e) => setAccusedMoreThan(e.target.value)}
            className="w-full sm:w-64 p-1.5 rounded-lg border border-slate-300 bg-white text-xs"
          />
        </div>
      </div>

      {/* INLINE ENTRY CARD */}
      <Card className="border-red-200 shadow-xs">
        <CardHeader className="py-3 px-4 bg-gradient-to-r from-red-50 via-slate-50 to-slate-50 border-b border-red-200 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-100 border border-red-300 flex items-center justify-center text-red-700">
              <Crosshair className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold text-slate-800 tracking-tight">
                {editingId
                  ? "Edit Accused / Suspect Details"
                  : "Accused Entry Form (अभियुक्त का विवरण)"}
              </CardTitle>
              <p className="text-[11px] text-slate-500">
                Direct entry form — fill details and add to the Accused list below without popup dialogs.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white px-2.5 py-1 rounded-lg border border-slate-200 text-xs">
              <span className="font-bold text-slate-600">Type:</span>
              <label className="flex items-center gap-1 cursor-pointer font-semibold text-slate-800">
                <input
                  type="radio"
                  name="accTypeSection"
                  checked={accusedType === "Known"}
                  onChange={() => setAccusedType("Known")}
                />
                <span>Known</span>
              </label>
              <label className="flex items-center gap-1 cursor-pointer font-semibold text-slate-800">
                <input
                  type="radio"
                  name="accTypeSection"
                  checked={accusedType === "Unknown-Seen"}
                  onChange={() => setAccusedType("Unknown-Seen")}
                />
                <span>Unknown-Seen</span>
              </label>
            </div>
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
            onClick={() => setActiveSubtab("physical")}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeSubtab === "physical"
                ? "bg-white text-[#0b192c] shadow-2xs border border-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Eye className="w-3.5 h-3.5 text-red-600" />
            Physical Traits &amp; Description
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
              {/* Case Against Police Toggle */}
              <div className="p-3 bg-red-50/60 border border-red-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Shield className="w-4 h-4 text-red-600 shrink-0" />
                  <div>
                    <span className="font-bold text-red-950 block">Case Against Police Personnel?</span>
                    <span className="text-[11px] text-red-800">
                      Check if the accused/suspect is an officer or personnel of the Police Department
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 cursor-pointer font-bold">
                    <input
                      type="checkbox"
                      checked={isCaseAgainstPolice}
                      onChange={(e) => setIsCaseAgainstPolice(e.target.checked)}
                      className="rounded text-red-600"
                    />
                    <span>Yes, Police Personnel</span>
                  </label>
                  {isCaseAgainstPolice && (
                    <input
                      type="text"
                      placeholder="Name / Rank / Belt No..."
                      value={policePersonnelName}
                      onChange={(e) => setPolicePersonnelName(e.target.value)}
                      className="p-1.5 rounded-lg border border-red-300 bg-white text-xs w-52"
                    />
                  )}
                </div>
              </div>

              {/* UID, NPR, First/Middle/Last Name */}
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">UID (Aadhaar Number)</label>
                  <input
                    type="text"
                    maxLength={12}
                    placeholder="12 digit UID"
                    value={uid}
                    onChange={(e) => setUid(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 font-mono text-xs focus:ring-1 focus:ring-red-600"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">NPR Number</label>
                  <input
                    type="text"
                    placeholder="National Pop. Reg."
                    value={nprNumber}
                    onChange={(e) => setNprNumber(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 font-mono text-xs focus:ring-1 focus:ring-red-600"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    First Name {accusedType === "Known" && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="text"
                    placeholder={accusedType === "Known" ? "e.g. Ramesh" : "Unknown"}
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 text-xs focus:ring-1 focus:ring-red-600"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Middle Name</label>
                  <input
                    type="text"
                    value={middleName}
                    onChange={(e) => setMiddleName(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 text-xs focus:ring-1 focus:ring-red-600"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Last Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Yadav"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 text-xs focus:ring-1 focus:ring-red-600"
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

              {/* Gender, Marital Status, Relative, Contacts, Category */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 bg-white text-xs"
                  >
                    {getDynamicGenderOptions().map((g) => (
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
                    {getDynamicMaritalStatusOptions().map((ms) => (
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
                    {getDynamicRelationTypes().map((rt) => (
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

              {/* Juvenile & Medical Exam Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800 block">Is Juvenile? (किशोर / अपचारी)</span>
                    <span className="text-[11px] text-slate-500">Age below 18 years at date of occurrence</span>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer font-bold">
                    <input
                      type="checkbox"
                      checked={isJuvenile}
                      onChange={(e) => setIsJuvenile(e.target.checked)}
                      className="rounded text-red-600"
                    />
                    <span>Yes, Juvenile</span>
                  </label>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800 block">Medical Exam for Age?</span>
                    <span className="text-[11px] text-slate-500">Ossification / medical test required</span>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer font-bold">
                    <input
                      type="checkbox"
                      checked={medicalExamRequiredForAge}
                      onChange={(e) => setMedicalExamRequiredForAge(e.target.checked)}
                      className="rounded text-red-600"
                    />
                    <span>Yes, Required</span>
                  </label>
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
                      placeholder="e.g. 1994"
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
                <span className="font-bold text-slate-800 text-xs block">Add Known Address for Suspect</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">House / Flat No.</label>
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
                    <label className="font-semibold text-slate-700 block mb-1">City / Town</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
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
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Country</label>
                    <input
                      type="text"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-300 bg-white text-xs"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    type="button"
                    onClick={handleAddAddress}
                    className="bg-slate-800 hover:bg-slate-900 text-white text-xs px-3"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Add Address to Suspect Record
                  </Button>
                </div>
              </div>

              {addressesList.length > 0 && (
                <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                      <tr>
                        <th className="p-2 w-14">S. No.</th>
                        <th className="p-2">Address</th>
                        <th className="p-2">City / District / State</th>
                        <th className="p-2 w-16 text-center">Delete</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {addressesList.map((addr, idx) => (
                        <tr key={addr.id}>
                          <td className="p-2 font-bold text-slate-500">{idx + 1}</td>
                          <td className="p-2 font-medium">
                            {[addr.houseNo, addr.streetName, addr.colony].filter(Boolean).join(", ") || "—"}
                          </td>
                          <td className="p-2 text-slate-600">
                            {[addr.city, addr.district, addr.state].filter(Boolean).join(", ")}
                          </td>
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
                  <label className="font-bold text-slate-700 block mb-1">Nationality</label>
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
                <span className="font-bold text-slate-800 text-xs block">Passport Information (if known)</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Passport Number</label>
                    <input
                      type="text"
                      value={passportNumber}
                      onChange={(e) => setPassportNumber(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-300 bg-white font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Place of Issue</label>
                    <input
                      type="text"
                      value={passportIssuePlace}
                      onChange={(e) => setPassportIssuePlace(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-300 bg-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Date of Issue</label>
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
                <label className="font-bold text-slate-800 block">Official Identity Documents</label>
                <div className="flex gap-2">
                  <select
                    value={tempIdType}
                    onChange={(e) => setTempIdType(e.target.value)}
                    className="w-1/3 p-2 rounded-lg border border-slate-300 bg-white text-xs"
                  >
                    {getDynamicIdentificationTypes().map((idType) => (
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

          {/* SUBTAB 4: PHYSICAL TRAITS */}
          {activeSubtab === "physical" && (
            <div className="space-y-4 animate-in fade-in-30">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Body Build</label>
                  <select
                    value={bodyBuild}
                    onChange={(e) => setBodyBuild(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 bg-white text-xs"
                  >
                    {["Slim", "Medium", "Athletic", "Heavy", "Muscular", "Short & Stout"].map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Complexion</label>
                  <select
                    value={bodyComplexion}
                    onChange={(e) => setBodyComplexion(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 bg-white text-xs"
                  >
                    {["Fair", "Wheatish", "Dark", "Sallow", "Very Fair"].map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Height Unit</label>
                  <select
                    value={heightUnit}
                    onChange={(e) => setHeightUnit(e.target.value as any)}
                    className="w-full p-2 rounded-lg border border-slate-300 bg-white text-xs"
                  >
                    <option value="feet_inch">Feet / Inches</option>
                    <option value="cm">Centimeters (CM)</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Height (From - To)</label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="5.6"
                      value={heightFrom}
                      onChange={(e) => setHeightFrom(e.target.value)}
                      className="w-1/2 p-2 rounded-lg border border-slate-300 text-xs"
                    />
                    <input
                      type="text"
                      placeholder="5.8"
                      value={heightTo}
                      onChange={(e) => setHeightTo(e.target.value)}
                      className="w-1/2 p-2 rounded-lg border border-slate-300 text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Face Type</label>
                  <input
                    type="text"
                    value={faceType}
                    onChange={(e) => setFaceType(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Forehead</label>
                  <input
                    type="text"
                    value={forehead}
                    onChange={(e) => setForehead(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nose</label>
                  <input
                    type="text"
                    value={nose}
                    onChange={(e) => setNose(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Teeth</label>
                  <input
                    type="text"
                    value={teeth}
                    onChange={(e) => setTeeth(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Beard</label>
                  <input
                    type="text"
                    value={beard}
                    onChange={(e) => setBeard(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Moustaches</label>
                  <input
                    type="text"
                    value={moustaches}
                    onChange={(e) => setMoustaches(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                    <input
                      type="checkbox"
                      checked={isPockmarked}
                      onChange={(e) => setIsPockmarked(e.target.checked)}
                      className="rounded text-red-600"
                    />
                    <span>Is Pockmarked / Chechak Marks</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Distinguishing Marks / Scars / Tattoos
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Scar on left cheek, tattoo on right forearm..."
                    value={distinguishingMarks}
                    onChange={(e) => setDistinguishingMarks(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Clothing Description (वस्त्र विवरण)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Blue jeans, black jacket, white sneakers..."
                    value={clothingDescription}
                    onChange={(e) => setClothingDescription(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
              </div>
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
              className="text-xs bg-red-700 hover:bg-red-800 text-white font-bold flex items-center gap-1.5 px-4"
            >
              {editingId ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Update Accused Record
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  Add to Accused List
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* RECORDED ACCUSED LIST TABLE */}
      <Card className="border-slate-200">
        <CardHeader className="py-2.5 px-4 bg-slate-50 border-b border-slate-200 flex flex-row items-center justify-between">
          <CardTitle className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Crosshair className="w-4 h-4 text-red-600" />
            Particulars of Accused / Suspect Persons ({accusedList.length})
          </CardTitle>
          <span className="text-[11px] text-slate-500 font-medium">
            Edit directly populates the form above
          </span>
        </CardHeader>
        <CardContent className="p-4 text-xs">
          {accusedList.length > 0 ? (
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 font-bold border-b border-slate-200 text-slate-700">
                  <tr>
                    <th className="p-2.5 w-12">S.No.</th>
                    <th className="p-2.5">Name &amp; Alias</th>
                    <th className="p-2.5">Relative / Father Name</th>
                    <th className="p-2.5">Address</th>
                    <th className="p-2.5">Physical Traits</th>
                    <th className="p-2.5 w-24 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {accusedList.map((acc, idx) => (
                    <tr
                      key={acc.id}
                      className={`hover:bg-slate-50 transition-colors ${
                        editingId === acc.id ? "bg-red-50/50 font-medium" : ""
                      }`}
                    >
                      <td className="p-2.5 font-bold text-slate-500">{idx + 1}</td>
                      <td className="p-2.5 font-semibold text-red-900">
                        {acc.name} {acc.alias ? `(${acc.alias})` : ""}
                        {acc.isKnown === false && (
                          <span className="ml-1 text-[10px] font-bold bg-amber-100 text-amber-800 px-1 py-0.2 rounded">
                            Unknown-Seen
                          </span>
                        )}
                        {acc.hasCaseAgainstPolice && (
                          <span className="ml-1 text-[10px] font-bold bg-red-100 text-red-800 px-1 py-0.2 rounded">
                            Police Case
                          </span>
                        )}
                      </td>
                      <td className="p-2.5">{acc.fatherName || acc.relativeName || "—"}</td>
                      <td className="p-2.5 text-slate-600 max-w-xs truncate" title={acc.address}>
                        {acc.address || "—"}
                      </td>
                      <td className="p-2.5 text-slate-600 max-w-xs truncate" title={acc.physicalDescription || acc.specialTraits}>
                        {acc.physicalDescription || acc.specialTraits || "—"}
                      </td>
                      <td className="p-2.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleEdit(acc)}
                            className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                            title="Edit Accused in Form Above"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => acc.id && onDeleteAccused(acc.id)}
                            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                            title="Delete Accused"
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
              <Crosshair className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="font-medium text-slate-600">
                {isAccusedKnown
                  ? "No accused entered yet. Fill the form above and click 'Add to Accused List'."
                  : "FIR will be registered against Unknown Suspect(s) to be traced during investigation."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
