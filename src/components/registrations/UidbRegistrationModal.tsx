"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Search,
  Upload,
  Trash2,
  Calendar,
  Clock,
  User,
  MapPin,
  ClipboardList,
  CheckCircle2,
  AlertCircle,
  FileText,
  Eye,
  Camera,
  Plus,
  RefreshCw,
} from "lucide-react";
import { UidbFormData, DEFAULT_UIDB_FORM, UidbUploadedPhoto, InformantIdEntry } from "@/types/uidb";
import { RegistrationService } from "@/services/registrationService";
import { compressImage } from "@/utils/imageCompressor";

interface UidbRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Partial<UidbFormData> | null;
  onSave: (data: UidbFormData) => void;
}

const FIRST_NAME_SUGGESTIONS = [
  "RAJNISH",
  "ram",
  "RAHUL",
  "ranvijay",
  "rajender",
  "RAVI",
  "Rajbir",
  "rakesh",
  "Ravinder",
  "Ranjor",
  "Suresh",
  "Amit",
  "Manoj",
  "Vikas",
];

const CASE_TYPE_OPTIONS = [
  "Death due to Accident",
  "Death due to Acid Throwing",
  "Death due to Aeroplane Crash/ Accident",
  "Death due to Animal Bite",
  "Death due to Avalanche",
  "Death due to Bomb Blast",
  "Death due to Building Collapse",
  "Death due to Burning",
  "Death due to Consumption of illicit liquor",
  "Death due to Drowning",
  "Death due to Electric Shock",
  "Death due to Gas Cylinder Blast",
  "Death due to Hanging",
  "Dacoity Operations or other raids",
  "Other Unnatural Death",
];

const SOURCE_OF_INFO_OPTIONS = [
  "Citizen/General Public",
  "Citizen Service Center",
  "Cognizance by Police",
  "Court",
  "DGP Office",
  "Direct Email",
  "Higher Offices",
  "Home Ministry Office",
  "IG Office",
  "Informer",
  "National Human Rights Commission",
  "National Minority Commission",
  "National SC/ST Commission",
  "National Women Commission",
];

const DIRECTION_OPTIONS = [
  "NORTH",
  "EAST",
  "WEST",
  "SOUTH",
  "NORTH-EAST",
  "NORTH-WEST",
  "SOUTH-EAST",
  "SOUTH-WEST",
];

const OFFICER_OPTIONS = [
  "Lalit Kumar (I (Inspector))-53175",
  "Ravinder Singh (SI)",
  "Balwant Singh (SI)",
  "Balwinder Kaur (W/SI)",
  "Jaswinder Singh (ASI)",
  "Dharampal (ASI)",
  "Ishwar Singh (ASI)",
  "Joginder Singh (SI)",
  "Jagdish Chander (HC)",
  "Gurmeet Singh (HC)",
  "Sandeep Singh (ASI)",
  "Rajesh Kumar (SI)",
];

const SAMPLE_GD_RECORDS = [
  {
    gdNo: "007",
    gdType: "UIDB/Identified Dead Body",
    dateTime: "22/04/2019 15:16",
    officer: "Lalit Kumar (Inspector)",
    subject: "Information regarding dead body lying near NH-22 bridge",
    brief: "Received telephonic information from citizen Rajnish about unknown male body lying in ditch.",
  },
  {
    gdNo: "012",
    gdType: "UIDB/Identified Dead Body",
    dateTime: "20/04/2019 09:40",
    officer: "Ravinder Singh (SI)",
    subject: "Dead body found near canal syphon",
    brief: "Patrol party reported unknown body in water canal.",
  },
  {
    gdNo: "018",
    gdType: "General Information",
    dateTime: "18/04/2019 18:30",
    officer: "Balwant Singh (SI)",
    subject: "Accidental casualty at Railway track",
    brief: "Information from Station Master regarding rail run-over.",
  },
];

export function UidbRegistrationModal({
  isOpen,
  onClose,
  initialData,
  onSave,
}: UidbRegistrationModalProps) {
  const [formData, setFormData] = useState<UidbFormData>(() => {
    return {
      ...DEFAULT_UIDB_FORM,
      ...initialData,
      id: initialData?.id || `uidb_${Date.now()}`,
    };
  });

  // Active main tab
  const [activeTab, setActiveTab] = useState<
    | "general"
    | "informant"
    | "deceased"
    | "deadBody"
    | "identifier"
    | "unnatural"
  >("general");

  // Informant Subtab
  const [informantSubTab, setInformantSubTab] = useState<"personal" | "address" | "other">("personal");

  // Deceased Person Subtab
  const [deceasedSubTab, setDeceasedSubTab] = useState<"physical" | "general" | "clothes" | "marks">("physical");

  // Dead Body Subtab
  const [deadBodySubTab, setDeadBodySubTab] = useState<"condition" | "age" | "photos">("condition");

  // Autocomplete state for informant first name
  const [showNameSuggestions, setShowNameSuggestions] = useState(false);

  // New ID entry inputs for informant
  const [newIdType, setNewIdType] = useState("Aadhaar Card");
  const [newIdNo, setNewIdNo] = useState("");

  // GD Search Popup state
  const [gdSearchModalOpen, setGdSearchModalOpen] = useState(false);
  const [selectedGdRow, setSelectedGdRow] = useState<string>("007");

  // Photo Upload Popup state
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [newPhotoSubType, setNewPhotoSubType] = useState<"Front View" | "Lateral View" | "Top View" | "Close-up of Marks">("Front View");
  const [newPhotoDesc, setNewPhotoDesc] = useState("");
  const [newPhotoUrl, setNewPhotoUrl] = useState("");
  const [newPhotoName, setNewPhotoName] = useState("");


  // Validation state
  interface ValidationError {
    field: string;
    tab: "general" | "informant" | "deceased" | "deadBody" | "identifier" | "unnatural";
    subTab?: string;
    message: string;
    label: string;
  }

  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          ...DEFAULT_UIDB_FORM,
          ...initialData,
        });
      } else {
        const today = new Date().toISOString().split("T")[0];
        const nowTime = new Date().toTimeString().slice(0, 5);
        const nextReg = RegistrationService.generateNextRegNumber("UIDB");
        setFormData({
          ...DEFAULT_UIDB_FORM,
          id: `uidb_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          regNumber: nextReg,
          date: today,
          time: nowTime,
          year: today.split("-")[0],
          gdDateTime: `${today} ${nowTime}`,
          createdAt: new Date().toISOString(),
        });
      }
      setActiveTab("general");
      setErrors([]);
      setHasSubmitted(false);
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  // Handlers
  const updateField = <K extends keyof UidbFormData>(key: K, value: UidbFormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (hasSubmitted) {
      setErrors((prevErrs) => prevErrs.filter((err) => err.field !== key));
    }
  };

  const getFieldError = (field: string) => {
    return errors.find((e) => e.field === field)?.message;
  };

  const inputErrorClass = (field: string) => {
    const isErr = errors.some((e) => e.field === field);
    return isErr
      ? "border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/20"
      : "border-slate-300";
  };

  // Informant address copy
  const handleSameAddressToggle = (checked: boolean) => {
    updateField("sameAsPresentAddress", checked);
    if (checked) {
      setFormData((prev) => ({
        ...prev,
        sameAsPresentAddress: true,
        permanentHouseNo: prev.presentHouseNo,
        permanentStreet: prev.presentStreet,
        permanentColony: prev.presentColony,
        permanentCity: prev.presentCity,
        permanentCountry: prev.presentCountry,
        permanentState: prev.presentState,
        permanentDistrict: prev.presentDistrict,
        permanentPoliceStation: prev.presentPoliceStation,
      }));
    }
  };

  // Add Informant ID
  const handleAddId = () => {
    if (!newIdNo.trim()) return;
    const entry: InformantIdEntry = {
      id: Date.now().toString(),
      idType: newIdType,
      idNo: newIdNo.trim(),
    };
    updateField("informantIds", [...(formData.informantIds || []), entry]);
    setNewIdNo("");
  };

  const handleRemoveId = (id: string) => {
    updateField(
      "informantIds",
      formData.informantIds.filter((item) => item.id !== id)
    );
  };

  // Age calculation helper
  const handleDobChange = (dob: string) => {
    updateField("dateOfBirth", dob);
    if (!dob) return;
    const birthYear = new Date(dob).getFullYear();
    const currentYear = new Date().getFullYear();
    const age = currentYear - birthYear;
    updateField("yearOfBirth", birthYear.toString());
    updateField("ageYears", Math.max(0, age).toString());
    updateField("ageMonths", "0");
    updateField("ageRangeFrom", Math.max(0, age - 2).toString());
    updateField("ageRangeTo", (age + 3).toString());
  };

  const handleResetAge = () => {
    updateField("dateOfBirth", "");
    updateField("yearOfBirth", "");
    updateField("ageYears", "");
    updateField("ageMonths", "");
    updateField("ageRangeFrom", "");
    updateField("ageRangeTo", "");
  };

  // Photo Upload Handler
  const handleAddPhoto = () => {
    if (!newPhotoUrl && !newPhotoName) return;
    const newPhoto: UidbUploadedPhoto = {
      id: `photo_${Date.now()}`,
      fileName: newPhotoName || `Photo_${formData.photos.length + 1}.jpg`,
      fileType: "Photograph",
      fileSubType: newPhotoSubType,
      fileDescription: newPhotoDesc.slice(0, 100),
      dataUrl: newPhotoUrl,
      uploadedAt: new Date().toLocaleString(),
    };
    const updatedPhotos = [...(formData.photos || []), newPhoto];
    updateField("photos", updatedPhotos);
    if (hasSubmitted) {
      setErrors((prevErrs) => prevErrs.filter((err) => err.field !== "photos"));
    }
    setNewPhotoDesc("");
    setNewPhotoUrl("");
    setNewPhotoName("");
    setPhotoModalOpen(false);
  };

  const handleDeletePhoto = (id: string) => {
    const updatedPhotos = formData.photos.filter((p) => p.id !== id);
    updateField("photos", updatedPhotos);
  };

  // GD Select submit
  const handleSelectGdSubmit = () => {
    const gd = SAMPLE_GD_RECORDS.find((g) => g.gdNo === selectedGdRow);
    if (gd) {
      setFormData((prev) => ({
        ...prev,
        gdNumber: gd.gdNo,
        gdDateTime: gd.dateTime,
        briefOfIncident: gd.brief,
      }));
      if (hasSubmitted) {
        setErrors((prev) => prev.filter((err) => err.field !== "gdNumber"));
      }
    }
    setGdSearchModalOpen(false);
  };

  // Comprehensive Mandatory Fields Validation
  const validateForm = (): ValidationError[] => {
    const errs: ValidationError[] = [];

    // 1. General Information
    if (!formData.gdNumber?.trim()) {
      errs.push({
        field: "gdNumber",
        tab: "general",
        label: "GD/SD/DD Number",
        message: "GD/SD/DD Number अनिवार्य है (GD Number is required)",
      });
    }
    if (!formData.bodyType) {
      errs.push({
        field: "bodyType",
        tab: "general",
        label: "Body Type",
        message: "Body Type अनिवार्य है (Identified/Unidentified is required)",
      });
    }
    if (!formData.deathType) {
      errs.push({
        field: "deathType",
        tab: "general",
        label: "Death Type",
        message: "Death Type अनिवार्य है (Natural/Unnatural is required)",
      });
    }
    if (!formData.inquestReportPreparedBy?.trim()) {
      errs.push({
        field: "inquestReportPreparedBy",
        tab: "general",
        label: "Inquest report prepared by",
        message: "Inquest report prepared by अनिवार्य है (Officer name is required)",
      });
    }
    if (!formData.caseType?.trim()) {
      errs.push({
        field: "caseType",
        tab: "general",
        label: "Case Type",
        message: "Case Type अनिवार्य है (Select Case Type)",
      });
    }
    if (!formData.officerName?.trim()) {
      errs.push({
        field: "officerName",
        tab: "general",
        label: "Investigation Officer",
        message: "Investigation / Enquiry Officer अनिवार्य है",
      });
    }
    if (!formData.sourceOfInformation?.trim()) {
      errs.push({
        field: "sourceOfInformation",
        tab: "general",
        label: "Source of Information",
        message: "Source of Information अनिवार्य है",
      });
    }
    if (!formData.modeOfInformation?.trim()) {
      errs.push({
        field: "modeOfInformation",
        tab: "general",
        label: "Mode of Information",
        message: "Mode of Information अनिवार्य है",
      });
    }
    if (!formData.placeWhereFound?.trim()) {
      errs.push({
        field: "placeWhereFound",
        tab: "general",
        label: "Place where Death Occurred / Body was Found",
        message: "Place where Body was Found अनिवार्य है (शव मिलने का स्थान)",
      });
    }
    if (!formData.distanceFromPsKm?.toString().trim()) {
      errs.push({
        field: "distanceFromPsKm",
        tab: "general",
        label: "Distance from P.S (Km)",
        message: "Distance from P.S अनिवार्य है",
      });
    }
    if (!formData.directionFromPs?.trim()) {
      errs.push({
        field: "directionFromPs",
        tab: "general",
        label: "Direction from P.S",
        message: "Direction from P.S अनिवार्य है",
      });
    }

    // 2. Informant Information
    if (!formData.informantFirstName?.trim()) {
      errs.push({
        field: "informantFirstName",
        tab: "informant",
        subTab: "personal",
        label: "Informant First Name",
        message: "Informant First Name अनिवार्य है (सूचनाकर्ता का नाम)",
      });
    }

    // 3. Deceased Person Information
    if (!formData.gender?.trim()) {
      errs.push({
        field: "gender",
        tab: "deceased",
        subTab: "physical",
        label: "Gender",
        message: "Gender of Deceased अनिवार्य है (मृतक का लिंग)",
      });
    }

    // 4. Dead Body Details
    if (!formData.conditionOfDeadBody?.trim()) {
      errs.push({
        field: "conditionOfDeadBody",
        tab: "deadBody",
        subTab: "condition",
        label: "Condition of the Dead Body",
        message: "Condition of the Dead Body अनिवार्य है (शव की स्थिति)",
      });
    }
    if (!formData.detailOfInjuries?.trim()) {
      errs.push({
        field: "detailOfInjuries",
        tab: "deadBody",
        subTab: "condition",
        label: "Detail of Injuries",
        message: "Detail of Injuries on body अनिवार्य है (चोटों का विवरण)",
      });
    }
    if (!formData.photos || formData.photos.length === 0) {
      errs.push({
        field: "photos",
        tab: "deadBody",
        subTab: "photos",
        label: "Upload Photo(s)",
        message: "कम से कम 1 फोटोग्राफ अपलोड करना अनिवार्य है (Upload at least 1 Photo)",
      });
    }

    // 5. Identifier Details (if Identified)
    if (formData.bodyType === "Identified" && !formData.identifierName?.trim()) {
      errs.push({
        field: "identifierName",
        tab: "identifier",
        label: "Identifier Name",
        message: "Identifier Name अनिवार्य है (पहचानकर्ता का नाम)",
      });
    }

    // 6. Unnatural Death Details
    if (!formData.samplesCollectedDnaFsl) {
      errs.push({
        field: "samplesCollectedDnaFsl",
        tab: "unnatural",
        label: "DNA / FSL Samples Collected",
        message: "Whether samples collected for DNA/FSL अनिवार्य है",
      });
    }
    if (!formData.isCustodialDowryDeath) {
      errs.push({
        field: "isCustodialDowryDeath",
        tab: "unnatural",
        label: "Custodial / Dowry Death",
        message: "Is It Custodial / Dowry Death अनिवार्य है",
      });
    }

    return errs;
  };

  // Final Form Submit trigger
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setHasSubmitted(true);
    const validationErrors = validateForm();
    setErrors(validationErrors);

    if (validationErrors.length > 0) {
      const firstError = validationErrors[0];
      setActiveTab(firstError.tab);
      if (firstError.subTab) {
        if (firstError.tab === "informant") setInformantSubTab(firstError.subTab as any);
        if (firstError.tab === "deceased") setDeceasedSubTab(firstError.subTab as any);
        if (firstError.tab === "deadBody") setDeadBodySubTab(firstError.subTab as any);
      }
      return;
    }

    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-2xs">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-300 w-full max-w-4xl max-h-[95vh] flex flex-col overflow-hidden animate-in fade-in-50 text-xs">
        {/* Top Header */}
        <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <ClipboardList className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm tracking-tight text-white flex items-center gap-2">
                <span>Registration of Unidentified Dead Body (UIDB / UD)</span>
                <span className="text-[10px] bg-slate-800 text-amber-400 px-2 py-0.5 rounded border border-amber-500/30 font-mono">
                  I.I.F.-X • Sec 194 BNSS
                </span>
              </h2>
              <p className="text-[10px] text-slate-400">
                P.S. {formData.stationName} • Distt. {formData.district} • Form No: {formData.regNumber}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Main 6 Tabs Bar */}
        <div className="flex items-center gap-1 bg-slate-100 p-1.5 border-b border-slate-200 overflow-x-auto shrink-0 select-none">
          {[
            { id: "general", label: "1. General Information" },
            { id: "informant", label: "2. Informant Information" },
            { id: "deceased", label: "3. Deceased Person Information" },
            { id: "deadBody", label: "4. Dead Body Details" },
            ...(formData.bodyType === "Identified"
              ? [{ id: "identifier", label: "5. Identifier Details" }]
              : []),
            { id: "unnatural", label: "6. Unnatural Death Details" },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            const tabErrorCount = errors.filter((e) => e.tab === tab.id).length;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? "bg-slate-900 text-white shadow-xs"
                    : tabErrorCount > 0
                    ? "bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200"
                    : "text-slate-700 hover:bg-white hover:text-slate-900"
                }`}
              >
                <span>{tab.label}</span>
                {tabErrorCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] flex items-center justify-center font-bold shrink-0">
                    {tabErrorCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content Area */}
        <form noValidate onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Error Summary Banner if mandatory fields are missing */}
          {errors.length > 0 && (
            <div className="bg-rose-50 border-2 border-rose-300 rounded-xl p-3.5 space-y-2 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-2 text-rose-900 font-bold text-xs sm:text-sm">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>
                  कृपया अनिवार्य फ़ील्ड्स भरें — {errors.length} अनिवार्य फ़ील्ड्स खाली हैं (Mandatory Fields Blank)
                </span>
              </div>
              <p className="text-[11px] text-rose-700">
                नीचे दी गई सूची में से किसी भी फ़ील्ड पर क्लिक करें, आप सीधे उसी फ़ॉर्म और टैब पर पहुँच जाएँगे:
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {errors.map((err, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setActiveTab(err.tab);
                      if (err.subTab) {
                        if (err.tab === "informant") setInformantSubTab(err.subTab as any);
                        if (err.tab === "deceased") setDeceasedSubTab(err.subTab as any);
                        if (err.tab === "deadBody") setDeadBodySubTab(err.subTab as any);
                      }
                    }}
                    className="px-2 py-0.5 rounded-md bg-white border border-rose-300 hover:bg-rose-100 text-rose-900 text-[10px] font-semibold flex items-center gap-1 shadow-2xs cursor-pointer"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                    <span>{err.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 1: GENERAL INFORMATION                                               */}
          {/* ========================================================================= */}
          {activeTab === "general" && (
            <div className="space-y-4">
              <div className="bg-amber-50/70 border border-amber-200/80 rounded-lg p-2.5 text-[11px] text-amber-900">
                <strong>नोट:</strong> * चिह्नित सभी फ़ील्ड्स अनिवार्य हैं। GD सं. खोजने हेतु मैग्निफाइंग ग्लास आइकन पर क्लिक करें।
              </div>

              {/* GD Details & Body Type */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* GD Number with search icon */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    GD/SD/DD Number *
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={formData.gdNumber}
                      onChange={(e) => updateField("gdNumber", e.target.value)}
                      placeholder="e.g. 007"
                      className={`flex-1 px-2.5 py-1.5 border rounded-md font-mono text-xs focus:ring-1 focus:ring-slate-900 ${inputErrorClass(
                        "gdNumber"
                      )}`}
                    />
                    <button
                      type="button"
                      onClick={() => setGdSearchModalOpen(true)}
                      className="px-2 py-1.5 bg-slate-800 text-white hover:bg-slate-700 rounded-md shadow-2xs flex items-center justify-center cursor-pointer shrink-0"
                      title="Search & View General Diary"
                    >
                      <Search className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {getFieldError("gdNumber") && (
                    <p className="text-[11px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{getFieldError("gdNumber")}</span>
                    </p>
                  )}
                </div>

                {/* GD Date & Time */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    GD/SD/DD Date &amp; Time
                  </label>
                  <input
                    type="text"
                    value={formData.gdDateTime}
                    onChange={(e) => updateField("gdDateTime", e.target.value)}
                    placeholder="YYYY-MM-DD HH:mm"
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs font-mono"
                  />
                </div>

                {/* Body Type Radio */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Body Type *
                  </label>
                  <div className={`flex items-center gap-3 pt-1 px-2 py-1 rounded-md border ${formData.bodyType ? "border-transparent" : inputErrorClass("bodyType")}`}>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="bodyType"
                        value="Identified"
                        checked={formData.bodyType === "Identified"}
                        onChange={() => updateField("bodyType", "Identified")}
                        className="text-slate-900"
                      />
                      <span>Identified</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="bodyType"
                        value="Unidentified"
                        checked={formData.bodyType === "Unidentified"}
                        onChange={() => updateField("bodyType", "Unidentified")}
                        className="text-slate-900"
                      />
                      <span>Unidentified</span>
                    </label>
                  </div>
                  {getFieldError("bodyType") && (
                    <p className="text-[11px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{getFieldError("bodyType")}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Death Type, Inquest Prepared By, Case Type */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Death Type Radio */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Death Type *
                  </label>
                  <div className={`flex items-center gap-3 pt-1 px-2 py-1 rounded-md border ${formData.deathType ? "border-transparent" : inputErrorClass("deathType")}`}>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="deathType"
                        value="Natural"
                        checked={formData.deathType === "Natural"}
                        onChange={() => updateField("deathType", "Natural")}
                      />
                      <span>Natural</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="deathType"
                        value="Unnatural"
                        checked={formData.deathType === "Unnatural"}
                        onChange={() => updateField("deathType", "Unnatural")}
                      />
                      <span>Unnatural</span>
                    </label>
                  </div>
                  {getFieldError("deathType") && (
                    <p className="text-[11px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{getFieldError("deathType")}</span>
                    </p>
                  )}
                </div>

                {/* Inquest report prepared by */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Inquest report prepared by *
                  </label>
                  <input
                    type="text"
                    value={formData.inquestReportPreparedBy}
                    onChange={(e) => updateField("inquestReportPreparedBy", e.target.value)}
                    placeholder="e.g. Lalit Kumar"
                    className={`w-full px-2.5 py-1.5 border rounded-md text-xs ${inputErrorClass(
                      "inquestReportPreparedBy"
                    )}`}
                  />
                  {getFieldError("inquestReportPreparedBy") && (
                    <p className="text-[11px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{getFieldError("inquestReportPreparedBy")}</span>
                    </p>
                  )}
                </div>

                {/* Case Type Dropdown */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Case Type *
                  </label>
                  <select
                    value={formData.caseType}
                    onChange={(e) => updateField("caseType", e.target.value)}
                    className={`w-full px-2.5 py-1.5 border rounded-md text-xs bg-white ${inputErrorClass(
                      "caseType"
                    )}`}
                  >
                    <option value="">-- Select Case Type --</option>
                    {CASE_TYPE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                  {getFieldError("caseType") && (
                    <p className="text-[11px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{getFieldError("caseType")}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* FIR No / Year & Import UIDB */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Import Unidentified dead body
                  </label>
                  <button
                    type="button"
                    onClick={() => alert("Connecting to CCTNS State UIDB Repository...")}
                    className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 rounded-md text-xs font-semibold text-slate-700 shadow-2xs cursor-pointer"
                  >
                    Import UIDB
                  </button>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    FIR No. / Year (Optional Link)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="FIR No."
                      value={formData.firNumber || ""}
                      onChange={(e) => updateField("firNumber", e.target.value)}
                      className="w-24 px-2 py-1.5 border border-slate-300 rounded-md font-mono"
                    />
                    <input
                      type="text"
                      placeholder="Year"
                      value={formData.firYear || "2026"}
                      onChange={(e) => updateField("firYear", e.target.value)}
                      className="w-20 px-2 py-1.5 border border-slate-300 rounded-md font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => alert("FIR Search & Link Triggered")}
                      className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 rounded-md text-xs font-medium"
                    >
                      Search
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        updateField("firNumber", "");
                        updateField("firYear", "");
                      }}
                      className="px-2 py-1.5 text-slate-500 hover:text-rose-600 text-xs"
                    >
                      Delink
                    </button>
                  </div>
                </div>
              </div>

              {/* Officer, Date/Times, Source & Mode */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Name of Investigation / Enquiry Officer *
                  </label>
                  <select
                    value={formData.officerName}
                    onChange={(e) => updateField("officerName", e.target.value)}
                    className={`w-full px-2 py-1.5 border rounded-md text-xs bg-white ${inputErrorClass(
                      "officerName"
                    )}`}
                  >
                    <option value="">-- Select Investigation Officer --</option>
                    {OFFICER_OPTIONS.map((off) => (
                      <option key={off} value={off}>
                        {off}
                      </option>
                    ))}
                  </select>
                  {getFieldError("officerName") && (
                    <p className="text-[11px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{getFieldError("officerName")}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Date &amp; Time of Death
                  </label>
                  <input
                    type="text"
                    value={formData.dateTimeOfDeath || ""}
                    onChange={(e) => updateField("dateTimeOfDeath", e.target.value)}
                    placeholder="YYYY-MM-DD HH:mm"
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Date &amp; Time of Information
                  </label>
                  <input
                    type="text"
                    value={formData.dateTimeOfInformation || ""}
                    onChange={(e) => updateField("dateTimeOfInformation", e.target.value)}
                    placeholder="YYYY-MM-DD HH:mm"
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Source of Information *
                  </label>
                  <select
                    value={formData.sourceOfInformation}
                    onChange={(e) => updateField("sourceOfInformation", e.target.value)}
                    className={`w-full px-2.5 py-1.5 border rounded-md text-xs bg-white ${inputErrorClass(
                      "sourceOfInformation"
                    )}`}
                  >
                    <option value="">-- Select Source --</option>
                    {SOURCE_OF_INFO_OPTIONS.map((src) => (
                      <option key={src} value={src}>
                        {src}
                      </option>
                    ))}
                  </select>
                  {getFieldError("sourceOfInformation") && (
                    <p className="text-[11px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{getFieldError("sourceOfInformation")}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Mode of Information *
                  </label>
                  <select
                    value={formData.modeOfInformation}
                    onChange={(e) => updateField("modeOfInformation", e.target.value)}
                    className={`w-full px-2.5 py-1.5 border rounded-md text-xs bg-white ${inputErrorClass(
                      "modeOfInformation"
                    )}`}
                  >
                    <option value="">-- Select Mode --</option>
                    <option value="By Phone">By Phone (दूरभाष द्वारा)</option>
                    <option value="Written">Written (लिखित रूप में)</option>
                    <option value="In Person">In Person (मौखिक / समक्ष आकर)</option>
                    <option value="Wireless">Wireless / PCR Call</option>
                    <option value="Email">Direct Email</option>
                  </select>
                  {getFieldError("modeOfInformation") && (
                    <p className="text-[11px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{getFieldError("modeOfInformation")}</span>
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Brief of incident
                </label>
                <textarea
                  rows={2}
                  value={formData.briefOfIncident || ""}
                  onChange={(e) => updateField("briefOfIncident", e.target.value)}
                  placeholder="Enter summary of how information was received and circumstances..."
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs"
                />
              </div>

              {/* Sub-Panel: Place Where Body was Found Details */}
              <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50 space-y-3">
                <h4 className="font-bold text-xs text-slate-900 border-b border-slate-200 pb-1">
                  Place Where Body was Found Details (शव मिलने का स्थान विवरण)
                </h4>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Place where Death Occurred / Body was Found *
                  </label>
                  <textarea
                    rows={2}
                    value={formData.placeWhereFound}
                    onChange={(e) => updateField("placeWhereFound", e.target.value)}
                    placeholder="e.g. Near Bridge Culvert, NH-22, Panchkula"
                    className={`w-full px-2.5 py-1.5 border rounded-md text-xs bg-white ${inputErrorClass(
                      "placeWhereFound"
                    )}`}
                  />
                  {getFieldError("placeWhereFound") && (
                    <p className="text-[11px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{getFieldError("placeWhereFound")}</span>
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Date &amp; Time when Found
                    </label>
                    <input
                      type="text"
                      value={formData.dateTimeWhenFound || ""}
                      onChange={(e) => updateField("dateTimeWhenFound", e.target.value)}
                      placeholder="YYYY-MM-DD HH:mm"
                      className="w-full px-2 py-1.5 border border-slate-300 rounded-md text-xs bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Distance from P.S. (Km) *
                    </label>
                    <input
                      type="number"
                      value={formData.distanceFromPsKm}
                      onChange={(e) => updateField("distanceFromPsKm", e.target.value)}
                      placeholder="e.g. 4"
                      className={`w-full px-2 py-1.5 border rounded-md text-xs bg-white font-mono ${inputErrorClass(
                        "distanceFromPsKm"
                      )}`}
                    />
                    {getFieldError("distanceFromPsKm") && (
                      <p className="text-[10px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        <span>{getFieldError("distanceFromPsKm")}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Direction from P.S. *
                    </label>
                    <select
                      value={formData.directionFromPs}
                      onChange={(e) => updateField("directionFromPs", e.target.value)}
                      className={`w-full px-2 py-1.5 border rounded-md text-xs bg-white ${inputErrorClass(
                        "directionFromPs"
                      )}`}
                    >
                      <option value="">-- Select Direction --</option>
                      {DIRECTION_OPTIONS.map((dir) => (
                        <option key={dir} value={dir}>
                          {dir}
                        </option>
                      ))}
                    </select>
                    {getFieldError("directionFromPs") && (
                      <p className="text-[10px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        <span>{getFieldError("directionFromPs")}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      District (पहले से भरा)
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={formData.district}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-md text-xs bg-slate-100 text-slate-600 font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      State (पहले से भरा)
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={formData.state}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-md text-xs bg-slate-100 text-slate-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Police Station (पहले से भरा)
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={formData.stationName}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-md text-xs bg-slate-100 text-slate-600 font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* Sub-Panel: Post Mortem Waiver Details */}
              <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50 space-y-2.5">
                <h4 className="font-bold text-xs text-slate-900 border-b border-slate-200 pb-1">
                  Post Mortem Waiver Details (पोस्टमॉर्टम छूट सम्बन्धी विवरण)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-1">
                      Request to Waive Post-Mortem from Relatives/Doctor
                    </label>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="waivePm"
                          value="Yes"
                          checked={formData.requestToWaivePostMortem === "Yes"}
                          onChange={() => updateField("requestToWaivePostMortem", "Yes")}
                        />
                        <span>Yes</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="waivePm"
                          value="No"
                          checked={formData.requestToWaivePostMortem === "No"}
                          onChange={() => updateField("requestToWaivePostMortem", "No")}
                        />
                        <span>No</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-1">
                      Approving Officer
                    </label>
                    <select
                      value={formData.approvingOfficer || ""}
                      onChange={(e) => updateField("approvingOfficer", e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-300 rounded-md text-xs bg-white"
                    >
                      <option value="">-- Select Officer --</option>
                      {OFFICER_OPTIONS.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: INFORMANT INFORMATION                                             */}
          {/* ========================================================================= */}
          {activeTab === "informant" && (
            <div className="space-y-3.5">
              {/* Informant 3 Subtabs */}
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                {[
                  { id: "personal", label: "Personal" },
                  { id: "address", label: "Address" },
                  { id: "other", label: "Other Information" },
                ].map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setInformantSubTab(st.id as any)}
                    className={`px-3 py-1 rounded-md text-xs font-semibold cursor-pointer ${
                      informantSubTab === st.id
                        ? "bg-slate-800 text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>

              {/* Subtab: Personal */}
              {informantSubTab === "personal" && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 mb-1">UID</label>
                      <input
                        type="text"
                        placeholder="Citizen UID"
                        value={formData.informantUid || ""}
                        onChange={(e) => updateField("informantUid", e.target.value)}
                        className="w-full px-2 py-1.5 border border-slate-300 rounded-md font-mono"
                      />
                    </div>

                    {/* First Name with Autocomplete */}
                    <div className="relative">
                      <label className="block text-[11px] font-medium text-slate-700 mb-1">
                        First Name (सुझाव उपलब्ध) *
                      </label>
                      <input
                        type="text"
                        value={formData.informantFirstName || ""}
                        onFocus={() => setShowNameSuggestions(true)}
                        onChange={(e) => updateField("informantFirstName", e.target.value)}
                        placeholder="Type or select below"
                        className={`w-full px-2 py-1.5 border rounded-md font-semibold text-slate-900 ${inputErrorClass(
                          "informantFirstName"
                        )}`}
                      />
                      {getFieldError("informantFirstName") && (
                        <p className="text-[10px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          <span>{getFieldError("informantFirstName")}</span>
                        </p>
                      )}
                      {showNameSuggestions && (
                        <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-40 overflow-y-auto">
                          <div className="p-1 text-[10px] text-slate-400 bg-slate-50 border-b border-slate-100 flex justify-between">
                            <span>Suggestions</span>
                            <button
                              type="button"
                              onClick={() => setShowNameSuggestions(false)}
                              className="text-slate-500 hover:text-slate-800"
                            >
                              &times;
                            </button>
                          </div>
                          {FIRST_NAME_SUGGESTIONS.map((name) => (
                            <button
                              key={name}
                              type="button"
                              onClick={() => {
                                updateField("informantFirstName", name);
                                setShowNameSuggestions(false);
                              }}
                              className="w-full text-left px-2 py-1 text-xs hover:bg-slate-100 text-slate-800"
                            >
                              {name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 mb-1">Middle Name</label>
                      <input
                        type="text"
                        value={formData.informantMiddleName || ""}
                        onChange={(e) => updateField("informantMiddleName", e.target.value)}
                        className="w-full px-2 py-1.5 border border-slate-300 rounded-md"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 mb-1">Last Name</label>
                      <input
                        type="text"
                        value={formData.informantLastName || ""}
                        onChange={(e) => updateField("informantLastName", e.target.value)}
                        className="w-full px-2 py-1.5 border border-slate-300 rounded-md"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 mb-1">Email ID</label>
                      <input
                        type="email"
                        placeholder="email@example.com"
                        value={formData.informantEmail || ""}
                        onChange={(e) => updateField("informantEmail", e.target.value)}
                        className="w-full px-2 py-1.5 border border-slate-300 rounded-md"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 mb-1">Relation Type</label>
                      <select
                        value={formData.informantRelationType || "Citizen"}
                        onChange={(e) => updateField("informantRelationType", e.target.value)}
                        className="w-full px-2 py-1.5 border border-slate-300 rounded-md bg-white"
                      >
                        <option value="Citizen">Citizen / Informant</option>
                        <option value="Passersby">Passersby (राहगीर)</option>
                        <option value="Relative">Relative (रिश्तेदार)</option>
                        <option value="Doctor">Doctor / Hospital Staff</option>
                        <option value="Village Head">Sarpanch / Village Head</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 mb-1">Relative Name</label>
                      <input
                        type="text"
                        placeholder="Father / Guardian name"
                        value={formData.informantRelativeName || ""}
                        onChange={(e) => updateField("informantRelativeName", e.target.value)}
                        className="w-full px-2 py-1.5 border border-slate-300 rounded-md"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 mb-1">Mobile No.</label>
                      <div className="flex items-center gap-1">
                        <span className="px-2 py-1.5 bg-slate-100 border border-slate-300 rounded-md font-mono text-slate-600">
                          +91
                        </span>
                        <input
                          type="text"
                          maxLength={10}
                          placeholder="10 digit mobile"
                          value={formData.informantMobile || ""}
                          onChange={(e) => updateField("informantMobile", e.target.value)}
                          className="flex-1 px-2 py-1.5 border border-slate-300 rounded-md font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 mb-1">Landline No.</label>
                      <div className="flex items-center gap-1">
                        <span className="px-2 py-1.5 bg-slate-100 border border-slate-300 rounded-md font-mono text-slate-600">
                          +91
                        </span>
                        <input
                          type="text"
                          placeholder="STD Code & No."
                          value={formData.informantLandline || ""}
                          onChange={(e) => updateField("informantLandline", e.target.value)}
                          className="flex-1 px-2 py-1.5 border border-slate-300 rounded-md font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Subtab: Address */}
              {informantSubTab === "address" && (
                <div className="space-y-4">
                  {/* Present Address */}
                  <div className="border border-slate-200 rounded-lg p-3 bg-slate-50 space-y-2.5">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                      <span className="font-bold text-xs text-slate-900">Present Address</span>
                      <span className="text-[10px] text-slate-500">Present address Yes / No</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      <div>
                        <label className="block text-[10px] text-slate-600 mb-0.5">House No.</label>
                        <input
                          type="text"
                          value={formData.presentHouseNo || ""}
                          onChange={(e) => updateField("presentHouseNo", e.target.value)}
                          className="w-full px-2 py-1 border border-slate-300 rounded bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-600 mb-0.5">Street Name</label>
                        <input
                          type="text"
                          value={formData.presentStreet || ""}
                          onChange={(e) => updateField("presentStreet", e.target.value)}
                          className="w-full px-2 py-1 border border-slate-300 rounded bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-600 mb-0.5">Colony/Locality/Area</label>
                        <input
                          type="text"
                          value={formData.presentColony || ""}
                          onChange={(e) => updateField("presentColony", e.target.value)}
                          className="w-full px-2 py-1 border border-slate-300 rounded bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-600 mb-0.5">Village/Town/City</label>
                        <input
                          type="text"
                          value={formData.presentCity || ""}
                          onChange={(e) => updateField("presentCity", e.target.value)}
                          className="w-full px-2 py-1 border border-slate-300 rounded bg-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      <div>
                        <label className="block text-[10px] text-slate-600 mb-0.5">Tehsil / Block</label>
                        <input
                          type="text"
                          value={formData.presentTehsil || ""}
                          onChange={(e) => updateField("presentTehsil", e.target.value)}
                          className="w-full px-2 py-1 border border-slate-300 rounded bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-600 mb-0.5">Country</label>
                        <select
                          value={formData.presentCountry || "INDIA"}
                          onChange={(e) => updateField("presentCountry", e.target.value)}
                          className="w-full px-2 py-1 border border-slate-300 rounded bg-white"
                        >
                          <option value="INDIA">INDIA</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-600 mb-0.5">State</label>
                        <select
                          value={formData.presentState || "HARYANA"}
                          onChange={(e) => updateField("presentState", e.target.value)}
                          className="w-full px-2 py-1 border border-slate-300 rounded bg-white"
                        >
                          <option value="HARYANA">HARYANA</option>
                          <option value="PUNJAB">PUNJAB</option>
                          <option value="DELHI">DELHI</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-600 mb-0.5">Pincode</label>
                        <input
                          type="text"
                          value={formData.presentPincode || ""}
                          onChange={(e) => updateField("presentPincode", e.target.value)}
                          className="w-full px-2 py-1 border border-slate-300 rounded bg-white font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Permanent Address with Same-as Checkbox */}
                  <div className="border border-slate-200 rounded-lg p-3 bg-white space-y-2.5">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                      <span className="font-bold text-xs text-slate-900">Permanent Address</span>
                      <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.sameAsPresentAddress || false}
                          onChange={(e) => handleSameAddressToggle(e.target.checked)}
                        />
                        <span>Same as Present Address</span>
                      </label>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      <div>
                        <label className="block text-[10px] text-slate-600 mb-0.5">House No.</label>
                        <input
                          type="text"
                          value={formData.permanentHouseNo || ""}
                          onChange={(e) => updateField("permanentHouseNo", e.target.value)}
                          className="w-full px-2 py-1 border border-slate-300 rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-600 mb-0.5">Street Name</label>
                        <input
                          type="text"
                          value={formData.permanentStreet || ""}
                          onChange={(e) => updateField("permanentStreet", e.target.value)}
                          className="w-full px-2 py-1 border border-slate-300 rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-600 mb-0.5">Colony/Locality</label>
                        <input
                          type="text"
                          value={formData.permanentColony || ""}
                          onChange={(e) => updateField("permanentColony", e.target.value)}
                          className="w-full px-2 py-1 border border-slate-300 rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-600 mb-0.5">Village/Town/City</label>
                        <input
                          type="text"
                          value={formData.permanentCity || ""}
                          onChange={(e) => updateField("permanentCity", e.target.value)}
                          className="w-full px-2 py-1 border border-slate-300 rounded"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Subtab: Other Information */}
              {informantSubTab === "other" && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 mb-1">
                        Country of Nationality
                      </label>
                      <select
                        value={formData.informantNationality || "INDIA"}
                        onChange={(e) => updateField("informantNationality", e.target.value)}
                        className="w-full px-2 py-1.5 border border-slate-300 rounded-md bg-white"
                      >
                        <option value="INDIA">INDIA</option>
                        <option value="NEPAL">NEPAL</option>
                        <option value="OTHER">OTHER</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 mb-1">ID Type</label>
                      <select
                        value={newIdType}
                        onChange={(e) => setNewIdType(e.target.value)}
                        className="w-full px-2 py-1.5 border border-slate-300 rounded-md bg-white"
                      >
                        <option value="Aadhaar Card">Aadhaar Card</option>
                        <option value="Voter ID">Voter ID (EPIC)</option>
                        <option value="PAN Card">PAN Card</option>
                        <option value="Driving License">Driving License</option>
                        <option value="Passport">Passport</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 mb-1">ID No.</label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          placeholder="e.g. XXXXXXXX4819"
                          value={newIdNo}
                          onChange={(e) => setNewIdNo(e.target.value)}
                          className="flex-1 px-2 py-1.5 border border-slate-300 rounded-md font-mono"
                        />
                        <button
                          type="button"
                          onClick={handleAddId}
                          className="px-2.5 py-1.5 bg-slate-900 text-white rounded-md text-xs font-semibold cursor-pointer"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* ID Table */}
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead className="bg-slate-100 text-slate-600 font-semibold text-[11px]">
                        <tr>
                          <th className="py-1.5 px-3 w-12 text-center">S.No.</th>
                          <th className="py-1.5 px-3">ID Type</th>
                          <th className="py-1.5 px-3">ID No.</th>
                          <th className="py-1.5 px-3 text-right w-16">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {formData.informantIds && formData.informantIds.length > 0 ? (
                          formData.informantIds.map((item, idx) => (
                            <tr key={item.id} className="hover:bg-slate-50">
                              <td className="py-1.5 px-3 text-center text-slate-400 font-mono">
                                {idx + 1}
                              </td>
                              <td className="py-1.5 px-3 font-medium text-slate-800">{item.idType}</td>
                              <td className="py-1.5 px-3 font-mono text-slate-700">{item.idNo}</td>
                              <td className="py-1.5 px-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveId(item.id)}
                                  className="text-rose-500 hover:text-rose-700 p-0.5"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="py-3 text-center text-slate-400">
                              No ID proofs added.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: DECEASED PERSON INFORMATION                                       */}
          {/* ========================================================================= */}
          {activeTab === "deceased" && (
            <div className="space-y-3.5">
              {/* Deceased Subtabs */}
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                {[
                  { id: "physical", label: "Physical Description" },
                  { id: "general", label: "General (Face, Eyes, Deformities, Hair)" },
                  { id: "clothes", label: "Clothes Worn" },
                  { id: "marks", label: "Identification Marks" },
                ].map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setDeceasedSubTab(st.id as any)}
                    className={`px-3 py-1 rounded-md text-xs font-semibold cursor-pointer ${
                      deceasedSubTab === st.id
                        ? "bg-slate-800 text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>

              {/* Physical Description Base */}
              {deceasedSubTab === "physical" && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 mb-1">
                        Body Build Type
                      </label>
                      <select
                        value={formData.bodyBuildType || "Medium"}
                        onChange={(e) => updateField("bodyBuildType", e.target.value)}
                        className="w-full px-2 py-1.5 border border-slate-300 rounded-md bg-white"
                      >
                        <option value="Thin">Thin (पतला)</option>
                        <option value="Medium">Medium (मध्यम)</option>
                        <option value="Muscular">Muscular (गठीला)</option>
                        <option value="Heavy">Heavy / Fat (भारी)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 mb-1">
                        Body Complexion Type
                      </label>
                      <select
                        value={formData.bodyComplexionType || "Wheatish"}
                        onChange={(e) => updateField("bodyComplexionType", e.target.value)}
                        className="w-full px-2 py-1.5 border border-slate-300 rounded-md bg-white"
                      >
                        <option value="Fair">Fair (गोरा)</option>
                        <option value="Wheatish">Wheatish (गेहुंआ)</option>
                        <option value="Shallow">Shallow (सांवला)</option>
                        <option value="Dark">Dark (काला)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 mb-1">Gender *</label>
                      <select
                        value={formData.gender}
                        onChange={(e) => updateField("gender", e.target.value)}
                        className={`w-full px-2 py-1.5 border rounded-md bg-white font-bold ${inputErrorClass(
                          "gender"
                        )}`}
                      >
                        <option value="">-- Select Gender --</option>
                        <option value="Male">Male (पुरुष)</option>
                        <option value="Female">Female (महिला)</option>
                        <option value="Other">Other</option>
                        <option value="Unknown">Unknown (अज्ञात)</option>
                      </select>
                      {getFieldError("gender") && (
                        <p className="text-[10px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          <span>{getFieldError("gender")}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Height Range From - To */}
                  <div className="border border-slate-200 rounded-lg p-3 bg-slate-50 space-y-2">
                    <span className="font-bold text-xs text-slate-900 block">Height Range (कद सीमा)</span>
                    <div className="grid grid-cols-2 gap-4">
                      {/* From */}
                      <div>
                        <span className="text-[10px] text-slate-500 font-medium block mb-1">Height Range From</span>
                        <div className="grid grid-cols-3 gap-1.5">
                          <input
                            type="text"
                            placeholder="Feet"
                            value={formData.heightFeetFrom || ""}
                            onChange={(e) => updateField("heightFeetFrom", e.target.value)}
                            className="px-2 py-1 border border-slate-300 rounded bg-white font-mono text-center"
                          />
                          <input
                            type="text"
                            placeholder="Inches"
                            value={formData.heightInchesFrom || ""}
                            onChange={(e) => updateField("heightInchesFrom", e.target.value)}
                            className="px-2 py-1 border border-slate-300 rounded bg-white font-mono text-center"
                          />
                          <input
                            type="text"
                            placeholder="Cms"
                            value={formData.heightCmsFrom || ""}
                            onChange={(e) => updateField("heightCmsFrom", e.target.value)}
                            className="px-2 py-1 border border-slate-300 rounded bg-white font-mono text-center"
                          />
                        </div>
                      </div>

                      {/* To */}
                      <div>
                        <span className="text-[10px] text-slate-500 font-medium block mb-1">Height Range To</span>
                        <div className="grid grid-cols-3 gap-1.5">
                          <input
                            type="text"
                            placeholder="Feet"
                            value={formData.heightFeetTo || ""}
                            onChange={(e) => updateField("heightFeetTo", e.target.value)}
                            className="px-2 py-1 border border-slate-300 rounded bg-white font-mono text-center"
                          />
                          <input
                            type="text"
                            placeholder="Inches"
                            value={formData.heightInchesTo || ""}
                            onChange={(e) => updateField("heightInchesTo", e.target.value)}
                            className="px-2 py-1 border border-slate-300 rounded bg-white font-mono text-center"
                          />
                          <input
                            type="text"
                            placeholder="Cms"
                            value={formData.heightCmsTo || ""}
                            onChange={(e) => updateField("heightCmsTo", e.target.value)}
                            className="px-2 py-1 border border-slate-300 rounded bg-white font-mono text-center"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* General (Face, Eyes, Deformities, Hair) */}
              {deceasedSubTab === "general" && (
                <div className="space-y-4">
                  {/* Face group */}
                  <div className="border border-slate-200 rounded-lg p-2.5 bg-slate-50/60">
                    <span className="font-bold text-xs text-slate-800 block mb-2">Face (चेहरा)</span>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px]">
                      <div>
                        <label className="text-[10px] text-slate-500 block">Face Type</label>
                        <input
                          type="text"
                          value={formData.faceType || "Oval"}
                          onChange={(e) => updateField("faceType", e.target.value)}
                          className="w-full px-2 py-1 border border-slate-300 rounded bg-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block">Forehead</label>
                        <input
                          type="text"
                          value={formData.forehead || "Broad"}
                          onChange={(e) => updateField("forehead", e.target.value)}
                          className="w-full px-2 py-1 border border-slate-300 rounded bg-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block">Cheek</label>
                        <input
                          type="text"
                          value={formData.cheek || "Normal"}
                          onChange={(e) => updateField("cheek", e.target.value)}
                          className="w-full px-2 py-1 border border-slate-300 rounded bg-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block">Beard</label>
                        <input
                          type="text"
                          value={formData.beard || "Clean Shaven"}
                          onChange={(e) => updateField("beard", e.target.value)}
                          className="w-full px-2 py-1 border border-slate-300 rounded bg-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block">Moustaches</label>
                        <input
                          type="text"
                          value={formData.moustaches || "Small Trimmed"}
                          onChange={(e) => updateField("moustaches", e.target.value)}
                          className="w-full px-2 py-1 border border-slate-300 rounded bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Eyes group */}
                  <div className="border border-slate-200 rounded-lg p-2.5 bg-slate-50/60">
                    <span className="font-bold text-xs text-slate-800 block mb-2">Eyes (आँखें)</span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                      <div>
                        <label className="text-[10px] text-slate-500 block">Eyes Color</label>
                        <input
                          type="text"
                          value={formData.eyesColor || "Black"}
                          onChange={(e) => updateField("eyesColor", e.target.value)}
                          className="w-full px-2 py-1 border border-slate-300 rounded bg-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block">Using Specs</label>
                        <select
                          value={formData.usingSpecs || "No"}
                          onChange={(e) => updateField("usingSpecs", e.target.value)}
                          className="w-full px-2 py-1 border border-slate-300 rounded bg-white"
                        >
                          <option value="No">No</option>
                          <option value="Yes">Yes</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block">Eye Brow</label>
                        <input
                          type="text"
                          value={formData.eyeBrowShape || "Arched"}
                          onChange={(e) => updateField("eyeBrowShape", e.target.value)}
                          className="w-full px-2 py-1 border border-slate-300 rounded bg-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block">Squint / Blinking</label>
                        <input
                          type="text"
                          value={formData.squint || "No"}
                          onChange={(e) => updateField("squint", e.target.value)}
                          className="w-full px-2 py-1 border border-slate-300 rounded bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Hair group */}
                  <div className="border border-slate-200 rounded-lg p-2.5 bg-slate-50/60">
                    <span className="font-bold text-xs text-slate-800 block mb-2">Hair (बाल)</span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                      <div>
                        <label className="text-[10px] text-slate-500 block">Hair Color</label>
                        <input
                          type="text"
                          value={formData.hairColor || "Black"}
                          onChange={(e) => updateField("hairColor", e.target.value)}
                          className="w-full px-2 py-1 border border-slate-300 rounded bg-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block">Hair Type &amp; Length</label>
                        <input
                          type="text"
                          value={formData.hairType || "Straight, Short"}
                          onChange={(e) => updateField("hairType", e.target.value)}
                          className="w-full px-2 py-1 border border-slate-300 rounded bg-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block">Hair Cut &amp; Style</label>
                        <input
                          type="text"
                          value={formData.hairCut || "Normal cut"}
                          onChange={(e) => updateField("hairCut", e.target.value)}
                          className="w-full px-2 py-1 border border-slate-300 rounded bg-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block">Using Wig / Dye</label>
                        <input
                          type="text"
                          value={formData.usingWig || "No"}
                          onChange={(e) => updateField("usingWig", e.target.value)}
                          className="w-full px-2 py-1 border border-slate-300 rounded bg-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Clothes Worn */}
              {deceasedSubTab === "clothes" && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 pb-2 border-b border-slate-200">
                    <span className="text-[11px] font-semibold text-slate-700">In Person Gender:</span>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        name="clothesGender"
                        value="Male"
                        checked={formData.clothesInPersonGender === "Male"}
                        onChange={() => updateField("clothesInPersonGender", "Male")}
                      />
                      <span>Male</span>
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        name="clothesGender"
                        value="Female"
                        checked={formData.clothesInPersonGender === "Female"}
                        onChange={() => updateField("clothesInPersonGender", "Female")}
                      />
                      <span>Female</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 mb-1">Outer Top</label>
                      <input
                        type="text"
                        placeholder="e.g. Dark Blue Full Sleeve Shirt"
                        value={formData.clothesOuterTop || ""}
                        onChange={(e) => updateField("clothesOuterTop", e.target.value)}
                        className="w-full px-2 py-1.5 border border-slate-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 mb-1">Outer Bottom</label>
                      <input
                        type="text"
                        placeholder="e.g. Black Denim Jeans"
                        value={formData.clothesOuterBottom || ""}
                        onChange={(e) => updateField("clothesOuterBottom", e.target.value)}
                        className="w-full px-2 py-1.5 border border-slate-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 mb-1">Inner Top</label>
                      <input
                        type="text"
                        placeholder="e.g. White Cotton Vest"
                        value={formData.clothesInnerTop || ""}
                        onChange={(e) => updateField("clothesInnerTop", e.target.value)}
                        className="w-full px-2 py-1.5 border border-slate-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 mb-1">Footwear</label>
                      <input
                        type="text"
                        placeholder="e.g. Brown Leather Shoes"
                        value={formData.clothesFootwear || ""}
                        onChange={(e) => updateField("clothesFootwear", e.target.value)}
                        className="w-full px-2 py-1.5 border border-slate-300 rounded-md"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Identification Marks */}
              {deceasedSubTab === "marks" && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 mb-1">Tattoo Marks</label>
                      <input
                        type="text"
                        placeholder="e.g. OM tattoo on right forearm"
                        value={formData.marksTattooMarks || ""}
                        onChange={(e) => updateField("marksTattooMarks", e.target.value)}
                        className="w-full px-2 py-1.5 border border-slate-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 mb-1">Scar Marks</label>
                      <input
                        type="text"
                        placeholder="e.g. Old surgical scar on left knee"
                        value={formData.marksScarMarks || ""}
                        onChange={(e) => updateField("marksScarMarks", e.target.value)}
                        className="w-full px-2 py-1.5 border border-slate-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 mb-1">Moles (Small)</label>
                      <input
                        type="text"
                        placeholder="e.g. Small mole on right neck"
                        value={formData.marksMoles || ""}
                        onChange={(e) => updateField("marksMoles", e.target.value)}
                        className="w-full px-2 py-1.5 border border-slate-300 rounded-md"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 mb-1">Blood Group</label>
                      <input
                        type="text"
                        placeholder="e.g. B+ or Unknown"
                        value={formData.marksBloodGroup || ""}
                        onChange={(e) => updateField("marksBloodGroup", e.target.value)}
                        className="w-full px-2 py-1.5 border border-slate-300 rounded-md font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 mb-1">Burn Marks</label>
                      <input
                        type="text"
                        value={formData.marksBurnMarks || ""}
                        onChange={(e) => updateField("marksBurnMarks", e.target.value)}
                        className="w-full px-2 py-1.5 border border-slate-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 mb-1">Leucoderma (White)</label>
                      <input
                        type="text"
                        value={formData.marksLeucoderma || ""}
                        onChange={(e) => updateField("marksLeucoderma", e.target.value)}
                        className="w-full px-2 py-1.5 border border-slate-300 rounded-md"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-1">
                      Others (if any) — गहने, छल्ला या अन्य पहचान
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Silver ring worn on middle finger of right hand..."
                      value={formData.marksOthers || ""}
                      onChange={(e) => updateField("marksOthers", e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-300 rounded-md"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: DEAD BODY DETAILS                                                 */}
          {/* ========================================================================= */}
          {activeTab === "deadBody" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                {[
                  { id: "condition", label: "Physical Condition & Injuries" },
                  { id: "age", label: "Age Panel" },
                  { id: "photos", label: `Upload Photo(s) (${formData.photos.length}) *` },
                ].map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setDeadBodySubTab(st.id as any)}
                    className={`px-3 py-1 rounded-md text-xs font-semibold cursor-pointer ${
                      deadBodySubTab === st.id
                        ? "bg-slate-800 text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>

              {/* Subtab: Physical Condition */}
              {deadBodySubTab === "condition" && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Condition of the Dead Body *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Normal Condition / Decomposed / Bloated"
                      value={formData.conditionOfDeadBody}
                      onChange={(e) => updateField("conditionOfDeadBody", e.target.value)}
                      className={`w-full px-2.5 py-1.5 border rounded-md font-semibold text-xs ${inputErrorClass(
                        "conditionOfDeadBody"
                      )}`}
                    />
                    {getFieldError("conditionOfDeadBody") && (
                      <p className="text-[11px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        <span>{getFieldError("conditionOfDeadBody")}</span>
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 mb-1">
                        Detail of Blood on the Body
                      </label>
                      <textarea
                        rows={2}
                        value={formData.detailOfBloodOnBody || ""}
                        onChange={(e) => updateField("detailOfBloodOnBody", e.target.value)}
                        placeholder="e.g. Dried blood near nasal cavity and head..."
                        className="w-full px-2 py-1.5 border border-slate-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 mb-1">
                        Detail of Injuries / marks of violence on body *
                      </label>
                      <textarea
                        rows={2}
                        value={formData.detailOfInjuries}
                        onChange={(e) => updateField("detailOfInjuries", e.target.value)}
                        placeholder="e.g. Crush injury on frontal skull, abrasions on shoulder..."
                        className={`w-full px-2 py-1.5 border rounded-md font-medium ${inputErrorClass(
                          "detailOfInjuries"
                        )}`}
                      />
                      {getFieldError("detailOfInjuries") && (
                        <p className="text-[11px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          <span>{getFieldError("detailOfInjuries")}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Yes/No Check Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <div>
                      <label className="block text-[10px] text-slate-600 mb-1">Apparel / article found? *</label>
                      <select
                        value={formData.whetherApparelFound}
                        onChange={(e) => updateField("whetherApparelFound", e.target.value as any)}
                        className="w-full px-2 py-1 border border-slate-300 rounded bg-white"
                      >
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-600 mb-1">Religious Attire found *</label>
                      <select
                        value={formData.religiousAttireFound}
                        onChange={(e) => updateField("religiousAttireFound", e.target.value as any)}
                        className="w-full px-2 py-1 border border-slate-300 rounded bg-white"
                      >
                        <option value="No">No</option>
                        <option value="Yes">Yes</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-600 mb-1">Evidence of Suicide *</label>
                      <select
                        value={formData.conditionsEvidencingSuicide}
                        onChange={(e) => updateField("conditionsEvidencingSuicide", e.target.value as any)}
                        className="w-full px-2 py-1 border border-slate-300 rounded bg-white"
                      >
                        <option value="No">No</option>
                        <option value="Yes">Yes</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-600 mb-1">Finger Tips Preserved? *</label>
                      <select
                        value={formData.fingerTipsPreserved}
                        onChange={(e) => updateField("fingerTipsPreserved", e.target.value as any)}
                        className="w-full px-2 py-1 border border-slate-300 rounded bg-white font-bold"
                      >
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 mb-1">
                        Probable weapon of offence used
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Blunt force vehicular impact"
                        value={formData.probableWeapon || ""}
                        onChange={(e) => updateField("probableWeapon", e.target.value)}
                        className="w-full px-2 py-1.5 border border-slate-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 mb-1">
                        Probable Cause of the Death
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Accidental trauma / asphyxia / drowning"
                        value={formData.probableCauseOfDeath || ""}
                        onChange={(e) => updateField("probableCauseOfDeath", e.target.value)}
                        className="w-full px-2 py-1.5 border border-slate-300 rounded-md"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Subtab: Age Panel */}
              {deadBodySubTab === "age" && (
                <div className="border border-slate-200 rounded-lg p-3 bg-slate-50 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                    <span className="font-bold text-xs text-slate-900">Age Panel</span>
                    <button
                      type="button"
                      onClick={handleResetAge}
                      className="px-2 py-1 bg-white hover:bg-slate-200 border border-slate-300 rounded text-[11px] font-medium flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Reset</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[10px] text-slate-600 mb-1">Date of Birth</label>
                      <input
                        type="date"
                        max={new Date().toISOString().split("T")[0]}
                        value={formData.dateOfBirth || ""}
                        onChange={(e) => handleDobChange(e.target.value)}
                        className="w-full px-2 py-1.5 border border-slate-300 rounded bg-white text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-600 mb-1">Year of birth</label>
                      <input
                        type="text"
                        value={formData.yearOfBirth || ""}
                        onChange={(e) => updateField("yearOfBirth", e.target.value)}
                        className="w-full px-2 py-1.5 border border-slate-300 rounded bg-white text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-600 mb-1">Age (Year/Month)</label>
                      <div className="grid grid-cols-2 gap-1">
                        <input
                          type="text"
                          placeholder="Yrs"
                          value={formData.ageYears || ""}
                          onChange={(e) => updateField("ageYears", e.target.value)}
                          className="px-1.5 py-1.5 border border-slate-300 rounded bg-white text-xs font-mono text-center"
                        />
                        <input
                          type="text"
                          placeholder="Mos"
                          value={formData.ageMonths || ""}
                          onChange={(e) => updateField("ageMonths", e.target.value)}
                          className="px-1.5 py-1.5 border border-slate-300 rounded bg-white text-xs font-mono text-center"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-600 mb-1">Age Range (From - To)</label>
                      <div className="grid grid-cols-2 gap-1">
                        <input
                          type="text"
                          placeholder="From"
                          value={formData.ageRangeFrom || ""}
                          onChange={(e) => updateField("ageRangeFrom", e.target.value)}
                          className="px-1.5 py-1.5 border border-slate-300 rounded bg-white text-xs font-mono text-center"
                        />
                        <input
                          type="text"
                          placeholder="To"
                          value={formData.ageRangeTo || ""}
                          onChange={(e) => updateField("ageRangeTo", e.target.value)}
                          className="px-1.5 py-1.5 border border-slate-300 rounded bg-white text-xs font-mono text-center"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Subtab: Photos Upload */}
              {deadBodySubTab === "photos" && (
                <div className="space-y-3">
                  <div className={`flex items-center justify-between p-2.5 bg-slate-50 border rounded-lg ${formData.photos && formData.photos.length > 0 ? "border-slate-200" : inputErrorClass("photos")}`}>
                    <div>
                      <span className="font-bold text-xs text-slate-800 block">
                        Upload Photo(s) * (Front View, Lateral View, Top View)
                      </span>
                      <span className="text-[10px] text-slate-500">
                        Allowed: jpg, jpeg, gif • Individual Max: 1024 KB • Total: 5012 KB
                      </span>
                      {getFieldError("photos") && (
                        <p className="text-[11px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          <span>{getFieldError("photos")}</span>
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setPhotoModalOpen(true)}
                      className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer hover:bg-slate-800 shrink-0"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>+ Upload Photo</span>
                    </button>
                  </div>

                  {/* Photo List Table */}
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead className="bg-slate-100 text-slate-600 text-[11px] font-semibold">
                        <tr>
                          <th className="py-2 px-3">File Name</th>
                          <th className="py-2 px-3">File Type</th>
                          <th className="py-2 px-3">File Sub Type</th>
                          <th className="py-2 px-3">Description</th>
                          <th className="py-2 px-3 text-right">Delete</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {formData.photos && formData.photos.length > 0 ? (
                          formData.photos.map((p) => (
                            <tr key={p.id} className="hover:bg-slate-50">
                              <td className="py-2 px-3 font-mono font-medium text-slate-800">{p.fileName}</td>
                              <td className="py-2 px-3 text-slate-600">{p.fileType}</td>
                              <td className="py-2 px-3 font-semibold text-slate-900">{p.fileSubType}</td>
                              <td className="py-2 px-3 text-slate-500">{p.fileDescription || "—"}</td>
                              <td className="py-2 px-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleDeletePhoto(p.id)}
                                  className="text-rose-500 hover:text-rose-700 p-1"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="py-4 text-center text-slate-400">
                              No photographs uploaded. Click &ldquo;+ Upload Photo&rdquo; to add.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 5: IDENTIFIER DETAILS (Only if Identified)                           */}
          {/* ========================================================================= */}
          {activeTab === "identifier" && formData.bodyType === "Identified" && (
            <div className="space-y-3">
              <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-lg text-emerald-900 text-[11px]">
                <strong>शव की पहचान विवरण:</strong> शव की पहचान करने वाले व्यक्ति का विवरण एवं पहचान सम्बन्धी बयान।
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Identifier Name (पहचानकर्ता का नाम) *
                  </label>
                  <input
                    type="text"
                    value={formData.identifierName || ""}
                    onChange={(e) => updateField("identifierName", e.target.value)}
                    placeholder="e.g. Rameshwar Dayal"
                    className={`w-full px-2 py-1.5 border rounded-md ${inputErrorClass(
                      "identifierName"
                    )}`}
                  />
                  {getFieldError("identifierName") && (
                    <p className="text-[11px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{getFieldError("identifierName")}</span>
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Father&apos;s / Husband Name
                  </label>
                  <input
                    type="text"
                    value={formData.identifierFatherName || ""}
                    onChange={(e) => updateField("identifierFatherName", e.target.value)}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Relation to Deceased
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Brother / Father / Relative"
                    value={formData.identifierRelation || ""}
                    onChange={(e) => updateField("identifierRelation", e.target.value)}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded-md"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Identifier Address (पता)
                  </label>
                  <input
                    type="text"
                    value={formData.identifierAddress || ""}
                    onChange={(e) => updateField("identifierAddress", e.target.value)}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Contact Phone (फ़ोन नंबर)
                  </label>
                  <input
                    type="text"
                    value={formData.identifierPhone || ""}
                    onChange={(e) => updateField("identifierPhone", e.target.value)}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded-md font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Basis of Identification / Statement (पहचान का आधार व बयान)
                </label>
                <textarea
                  rows={2}
                  value={formData.identifierStatement || ""}
                  onChange={(e) => updateField("identifierStatement", e.target.value)}
                  placeholder="e.g. Identified through clothes, facial structure and Om tattoo on right arm..."
                  className="w-full px-2 py-1.5 border border-slate-300 rounded-md"
                />
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 6: UNNATURAL DEATH DETAILS                                           */}
          {/* ========================================================================= */}
          {activeTab === "unnatural" && (
            <div className="space-y-3.5">
              <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/60 space-y-3">
                <h4 className="font-bold text-xs text-slate-900 border-b border-slate-200 pb-1">
                  Inquest Observations (मौका मुलाहिजा एवं शरीर की स्थिति)
                </h4>

                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">
                    Details of Mark of either having being forcibly removed or of being stained with blood or other matter
                  </label>
                  <textarea
                    rows={2}
                    value={formData.unnaturalMarkDetails || ""}
                    onChange={(e) => updateField("unnaturalMarkDetails", e.target.value)}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded-md bg-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-1">
                      Position of limb (हाथ-पैरों की स्थिति)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Straight / flexed"
                      value={formData.positionOfLimb || ""}
                      onChange={(e) => updateField("positionOfLimb", e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-300 rounded-md bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-1">
                      Position of eyes (आँखों की स्थिति)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Open / semi-open"
                      value={formData.positionOfEyes || ""}
                      onChange={(e) => updateField("positionOfEyes", e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-300 rounded-md bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-1">
                      Position of mouth (मुँह की स्थिति)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Partially open"
                      value={formData.positionOfMouth || ""}
                      onChange={(e) => updateField("positionOfMouth", e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-300 rounded-md bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-1">
                      Expression of Countenance (Face expression)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Calm / distorted"
                      value={formData.expressionOfCountenance || ""}
                      onChange={(e) => updateField("expressionOfCountenance", e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-300 rounded-md bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-1">
                      Article found in hand or body (hair, cloth etc)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. None / hair strand in fingers"
                      value={formData.articleFoundInHandOrBody || ""}
                      onChange={(e) => updateField("articleFoundInHandOrBody", e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-300 rounded-md bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">
                    Are there any circumstances or rumours to show that deceased killed himself
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. No rumours, hit and run accident suspected"
                    value={formData.circumstancesSuicideRumours || ""}
                    onChange={(e) => updateField("circumstancesSuicideRumours", e.target.value)}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded-md bg-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Whether body samples have been collected for DNA fingerprinting or FSL examination *
                    </label>
                    <select
                      value={formData.samplesCollectedDnaFsl}
                      onChange={(e) => updateField("samplesCollectedDnaFsl", e.target.value as any)}
                      className={`w-full px-2 py-1.5 border rounded-md bg-white font-bold ${inputErrorClass(
                        "samplesCollectedDnaFsl"
                      )}`}
                    >
                      <option value="">-- Select Yes / No --</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                    {getFieldError("samplesCollectedDnaFsl") && (
                      <p className="text-[11px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        <span>{getFieldError("samplesCollectedDnaFsl")}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Is It Custodial Death / dowry Death? *
                    </label>
                    <select
                      value={formData.isCustodialDowryDeath}
                      onChange={(e) => updateField("isCustodialDowryDeath", e.target.value as any)}
                      className={`w-full px-2 py-1.5 border rounded-md bg-white ${inputErrorClass(
                        "isCustodialDowryDeath"
                      )}`}
                    >
                      <option value="">-- Select Yes / No --</option>
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                    </select>
                    {getFieldError("isCustodialDowryDeath") && (
                      <p className="text-[11px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        <span>{getFieldError("isCustodialDowryDeath")}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Form Actions Footer */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between shrink-0 bg-white">
            <span className="text-[11px] text-slate-400">
              * Click Submit to review confirmation and generate official I.I.F.-X Slip.
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium cursor-pointer"
              >
                Close
              </button>
              <button
                type="submit"
                className="px-5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-xs cursor-pointer"
              >
                Submit
              </button>
            </div>
          </div>
        </form>

        {/* ========================================================================= */}
        {/* GD SEARCH POPUP MODAL                                                     */}
        {/* ========================================================================= */}
        {gdSearchModalOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-2xs">
            <div className="bg-white rounded-xl shadow-2xl border border-slate-300 w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in-50 text-xs">
              <div className="p-3 bg-slate-900 text-white flex items-center justify-between">
                <span className="font-bold text-xs">Search &amp; View General Diary</span>
                <button
                  type="button"
                  onClick={() => setGdSearchModalOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3 space-y-3 flex-1 overflow-y-auto">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <div>
                    <label className="block text-[10px] text-slate-600 mb-0.5">GD/SD/DD Number</label>
                    <input type="text" placeholder="e.g. 007" className="w-full px-2 py-1 border rounded bg-white" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-600 mb-0.5">General Diary Type</label>
                    <select className="w-full px-2 py-1 border rounded bg-white">
                      <option>UIDB/Identified Dead Body</option>
                      <option>General Information</option>
                      <option>Patrol Departure</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-600 mb-0.5">Date Range From</label>
                    <input type="date" max={new Date().toISOString().split("T")[0]} defaultValue="2019-04-20" className="w-full px-2 py-1 border rounded bg-white" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-600 mb-0.5">Date Range To</label>
                    <input type="date" max={new Date().toISOString().split("T")[0]} defaultValue="2019-04-25" className="w-full px-2 py-1 border rounded bg-white" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-600 mb-0.5">Entry for (Officer)</label>
                    <select className="w-full px-2 py-1 border rounded bg-white">
                      <option>All Officers</option>
                      <option>Lalit Kumar (Inspector)</option>
                    </select>
                  </div>
                  <div className="flex items-end gap-1">
                    <button
                      type="button"
                      className="px-3 py-1 bg-slate-900 text-white rounded font-medium text-xs cursor-pointer"
                    >
                      Search
                    </button>
                    <button
                      type="button"
                      className="px-2 py-1 bg-slate-200 text-slate-700 rounded text-xs cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* Table */}
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-slate-100 text-slate-600 text-[10px] font-semibold">
                      <tr>
                        <th className="py-1.5 px-2 text-center w-10">Select</th>
                        <th className="py-1.5 px-2">GD No</th>
                        <th className="py-1.5 px-2">Type</th>
                        <th className="py-1.5 px-2">Date Time</th>
                        <th className="py-1.5 px-2">Subject / Brief</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {SAMPLE_GD_RECORDS.map((row) => (
                        <tr
                          key={row.gdNo}
                          onClick={() => setSelectedGdRow(row.gdNo)}
                          className={`hover:bg-slate-50 cursor-pointer ${
                            selectedGdRow === row.gdNo ? "bg-amber-50" : ""
                          }`}
                        >
                          <td className="py-1.5 px-2 text-center">
                            <input
                              type="radio"
                              name="gdSelect"
                              checked={selectedGdRow === row.gdNo}
                              onChange={() => setSelectedGdRow(row.gdNo)}
                            />
                          </td>
                          <td className="py-1.5 px-2 font-mono font-bold text-slate-900">{row.gdNo}</td>
                          <td className="py-1.5 px-2 text-slate-600">{row.gdType}</td>
                          <td className="py-1.5 px-2 font-mono text-slate-500 text-[11px]">{row.dateTime}</td>
                          <td className="py-1.5 px-2 text-slate-800 line-clamp-1">{row.subject}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="p-2.5 border-t border-slate-200 flex justify-end gap-2 bg-slate-50">
                <button
                  type="button"
                  onClick={() => setGdSearchModalOpen(false)}
                  className="px-3 py-1 border rounded text-slate-700"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleSelectGdSubmit}
                  className="px-4 py-1 bg-slate-900 text-white rounded font-medium"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PHOTO UPLOAD POPUP MODAL                                                  */}
        {/* ========================================================================= */}
        {photoModalOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-2xs">
            <div className="bg-white rounded-xl shadow-2xl border border-slate-300 w-full max-w-md flex flex-col overflow-hidden animate-in fade-in-50 text-xs">
              <div className="p-3 bg-slate-900 text-white flex items-center justify-between">
                <span className="font-bold text-xs">Upload Photo (Photograph)</span>
                <button
                  type="button"
                  onClick={() => setPhotoModalOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 space-y-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">
                    File Type *
                  </label>
                  <input
                    type="text"
                    readOnly
                    value="Photograph"
                    className="w-full px-2 py-1.5 border border-slate-200 rounded bg-slate-100 text-slate-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">
                    File Sub Type *
                  </label>
                  <select
                    value={newPhotoSubType}
                    onChange={(e) => setNewPhotoSubType(e.target.value as any)}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded bg-white font-semibold"
                  >
                    <option value="Front View">Front View</option>
                    <option value="Lateral View">Lateral View</option>
                    <option value="Top View">Top View</option>
                    <option value="Close-up of Marks">Close-up of Marks</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">
                    File Upload (Browse / Choose file) *
                  </label>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/gif"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setNewPhotoName(file.name);
                        const reader = new FileReader();
                        reader.onload = async (re) => {
                          const raw = (re.target?.result as string) || "";
                          try {
                            const compressed = await compressImage(raw, 400, 500, 0.75);
                            setNewPhotoUrl(compressed);
                          } catch {
                            setNewPhotoUrl(raw);
                          }
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-slate-900 file:text-white hover:file:bg-slate-800"
                  />
                  <span className="text-[10px] text-slate-400 block mt-1">
                    Allowed: jpg, jpeg, gif • Max 1024 KB
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">
                    File Description (Max 100 characters)
                  </label>
                  <textarea
                    rows={2}
                    maxLength={100}
                    value={newPhotoDesc}
                    onChange={(e) => setNewPhotoDesc(e.target.value)}
                    placeholder="Enter description (e.g. Frontal face view showing eyebrow scar)..."
                    className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs"
                  />
                  <span className="text-[10px] text-slate-400 block text-right">
                    {newPhotoDesc.length}/100 chars
                  </span>
                </div>
              </div>

              <div className="p-3 border-t border-slate-200 flex justify-end gap-2 bg-slate-50">
                <button
                  type="button"
                  onClick={() => setPhotoModalOpen(false)}
                  className="px-3 py-1.5 border rounded text-slate-700"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleAddPhoto}
                  className="px-4 py-1.5 bg-slate-900 text-white rounded font-medium cursor-pointer hover:bg-slate-800"
                >
                  Upload
                </button>
              </div>
            </div>
          </div>
        )}


      </div>
    </div>
  );
}
