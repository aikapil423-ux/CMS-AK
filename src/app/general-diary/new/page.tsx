"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BookOpen,
  Lock,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  User,
  Clock,
  Car,
  FileText,
  Sparkles,
  Layers,
  Save,
  Eye,
  Check,
  ChevronDown,
  Building,
  RefreshCw,
  Search,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { GeneralDiaryService } from "@/services/generalDiaryService";
import {
  GeneralDiaryRecord,
  GDEntryTypeConfig,
  GDTemplate,
  GDOfficerParticulars,
  GDRelatedRecords,
} from "@/types/generalDiary";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { VoiceInputButton } from "@/components/ui/voice-input-button";
import { GDRecordModal } from "@/components/general-diary/GDRecordModal";
import { GDVerificationModal } from "@/components/general-diary/GDVerificationModal";
import { GDTemplateModal } from "@/components/general-diary/GDTemplateModal";
import { MOCK_ENQUIRY_OFFICERS } from "@/lib/mockData";

function NewGDEntryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentUser } = useAuth();

  const editDraftId = searchParams.get("editDraft");
  const reviewSuggestionId = searchParams.get("reviewSuggestion");
  const preselectedType = searchParams.get("type");

  // Catalog State
  const [types, setTypes] = useState<GDEntryTypeConfig[]>([]);
  const [selectedType, setSelectedType] = useState<string>(preselectedType || "RAVANGI_OFFICER");
  const [activeTemplate, setActiveTemplate] = useState<GDTemplate | null>(null);

  // Form Fields
  const [subject, setSubject] = useState("");
  const [narrative, setNarrative] = useState("");
  const [activityDate, setActivityDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [activityTime, setActivityTime] = useState(() =>
    new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
  );

  // Officers
  const [selectedOfficerId, setSelectedOfficerId] = useState<string>("eo_1");
  const [authorName, setAuthorName] = useState(currentUser.name);
  const [authorRank, setAuthorRank] = useState(currentUser.rankDisplay || "MHC");
  const [authorBelt, setAuthorBelt] = useState("889/KKR");
  const [authorPno, setAuthorPno] = useState(currentUser.pno);

  // Related Records
  const [complaintNumber, setComplaintNumber] = useState("");
  const [firNumber, setFirNumber] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [personName, setPersonName] = useState("");
  const [destinationLocation, setDestinationLocation] = useState("");

  // Template Variables Store
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});

  // Voice Language Toggle
  const [voiceLang, setVoiceLang] = useState<"hi-IN" | "en-IN">("hi-IN");

  // Warnings, Status & UI Modals
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);

  // Station Staff List for Searchable Officer Picker
  const stationOfficers = useMemo(() => {
    return [
      {
        id: "usr_sho_1",
        name: "Inspector Rajesh Kumar",
        rank: "Inspector / SHO",
        beltNumber: "04291882",
        pno: "04291882",
      },
      ...MOCK_ENQUIRY_OFFICERS.map((eo) => ({
        id: eo.id,
        name: eo.name,
        rank: eo.rank === "SI" ? "Sub-Inspector" : eo.rank === "ASI" ? "Assistant Sub-Inspector" : eo.rank,
        beltNumber: eo.beltNumber || "742/KKR",
        pno: eo.pno,
      })),
      {
        id: "usr_mhc_1",
        name: "HC Devinder Kumar",
        rank: "Head Constable (MHC)",
        beltNumber: "889/KKR",
        pno: "05192834",
      },
      {
        id: "usr_duty_1",
        name: "ASI Surender Pal",
        rank: "ASI (Duty Officer)",
        beltNumber: "419/KKR",
        pno: "09384712",
      },
      {
        id: "usr_constable_1",
        name: "Constable Praveen Kumar",
        rank: "Constable",
        beltNumber: "902/KKR",
        pno: "09812931",
      },
      {
        id: "usr_driver_1",
        name: "EHC Kuldeep Singh",
        rank: "EHC (Driver)",
        beltNumber: "329/KKR",
        pno: "08472910",
      },
    ];
  }, []);

  const selectedOfficer = useMemo(() => {
    return (
      stationOfficers.find((o) => o.id === selectedOfficerId) || stationOfficers[1]
    );
  }, [stationOfficers, selectedOfficerId]);

  // Load Types catalog
  useEffect(() => {
    GeneralDiaryService.getAllTypes().then((allTypes) => {
      setTypes(allTypes);
      const chosen = allTypes.find((t) => t.code === (preselectedType || "RAVANGI_OFFICER")) || allTypes[0];
      if (chosen && chosen.defaultTemplates.length > 0) {
        applyTemplate(chosen.defaultTemplates[0], chosen);
      }
    });
  }, [preselectedType]);

  // Handle Editing Draft or Reviewing Suggestion
  useEffect(() => {
    const targetId = editDraftId || reviewSuggestionId;
    if (targetId) {
      GeneralDiaryService.getRecordById(targetId).then((found) => {
        if (found) {
          setSelectedType(found.typeCode);
          setSubject(found.subject);
          setNarrative(found.narrative);
          const parts = found.activityDateTime.split(" ");
          if (parts[0]) setActivityDate(parts[0]);
          if (parts[1]) setActivityTime(parts[1]);

          const matchOff = stationOfficers.find(
            (o) => o.pno === found.entryForOfficer.pno || o.name === found.entryForOfficer.name
          );
          if (matchOff) setSelectedOfficerId(matchOff.id);

          if (found.relatedRecords?.complaintNumber) setComplaintNumber(found.relatedRecords.complaintNumber);
          if (found.relatedRecords?.firNumber) setFirNumber(found.relatedRecords.firNumber);
          if (found.relatedRecords?.vehicleNumber) setVehicleNumber(found.relatedRecords.vehicleNumber);
          if (found.relatedRecords?.personName) setPersonName(found.relatedRecords.personName);
          if (found.relatedRecords?.destinationLocation) setDestinationLocation(found.relatedRecords.destinationLocation);
        }
      });
    }
  }, [editDraftId, reviewSuggestionId, stationOfficers]);

  // Check Duplicate Warnings on change
  useEffect(() => {
    if (!selectedOfficer || !selectedType || !subject.trim()) return;

    const activityDateTime = `${activityDate} ${activityTime}`;
    GeneralDiaryService.checkDuplicateWarning(
      selectedOfficer.pno,
      selectedType,
      activityDateTime,
      subject
    ).then((res) => {
      if (res.hasWarning && res.warningMessage) {
        setDuplicateWarning(res.warningMessage);
      } else {
        setDuplicateWarning(null);
      }
    });
  }, [selectedOfficer, selectedType, subject, activityDate, activityTime]);

  // Apply a template and populate initial variables
  const applyTemplate = (template: GDTemplate, typeConfig: GDEntryTypeConfig) => {
    setActiveTemplate(template);
    setSelectedType(typeConfig.code);

    const initialVars: Record<string, string> = {};
    template.variables.forEach((v) => {
      if (v.autoFillSource === "currentUser") {
        initialVars[v.key] = currentUser.name;
      } else if (v.autoFillSource === "selectedOfficer") {
        if (v.key.includes("Rank")) initialVars[v.key] = selectedOfficer.rank;
        else if (v.key.includes("Belt")) initialVars[v.key] = selectedOfficer.beltNumber;
        else initialVars[v.key] = selectedOfficer.name;
      } else if (v.autoFillSource === "nowTime") {
        initialVars[v.key] = activityTime;
      } else if (v.autoFillSource === "station") {
        initialVars[v.key] = currentUser.stationName;
      } else if (v.defaultValue) {
        initialVars[v.key] = v.defaultValue;
      }
    });
    setVariableValues(initialVars);

    // Compute preview
    let sub = template.subjectTemplate;
    let body = template.bodyTemplate;
    Object.entries(initialVars).forEach(([k, val]) => {
      sub = sub.replaceAll(`{{${k}}}`, val);
      body = body.replaceAll(`{{${k}}}`, val);
    });

    setSubject(sub);
    setNarrative(body);
  };

  // Live update narrative when variable values change
  const handleVariableChange = (key: string, val: string) => {
    const updated = { ...variableValues, [key]: val };
    setVariableValues(updated);

    if (activeTemplate) {
      let sub = activeTemplate.subjectTemplate;
      let body = activeTemplate.bodyTemplate;
      Object.entries(updated).forEach(([k, v]) => {
        sub = sub.replaceAll(`{{${k}}}`, v);
        body = body.replaceAll(`{{${k}}}`, v);
      });
      setSubject(sub);
      setNarrative(body);
    }
  };

  // Compile draft / record object
  const compiledRecord: GeneralDiaryRecord = useMemo(() => {
    const typeDef = types.find((t) => t.code === selectedType) || types[0];
    const related: GDRelatedRecords = {};
    if (complaintNumber.trim()) related.complaintNumber = complaintNumber.trim();
    if (firNumber.trim()) related.firNumber = firNumber.trim();
    if (vehicleNumber.trim()) related.vehicleNumber = vehicleNumber.trim();
    if (personName.trim()) related.personName = personName.trim();
    if (destinationLocation.trim()) related.destinationLocation = destinationLocation.trim();

    return {
      id: editDraftId || reviewSuggestionId || `gd_temp_${Date.now()}`,
      gdNumber: editDraftId ? "GD-DRAFT" : reviewSuggestionId ? "GD-SUGGESTION" : "GD-NEW-PREVIEW",
      sequencePerDay: 0,
      policeStation: currentUser.stationName || "PS City Thanesar",
      district: currentUser.district || "Kurukshetra",
      entryForOfficer: {
        name: selectedOfficer.name,
        rank: selectedOfficer.rank,
        beltNumber: selectedOfficer.beltNumber,
        pno: selectedOfficer.pno,
      },
      actualAuthor: {
        name: authorName,
        rank: authorRank,
        beltNumber: authorBelt,
        pno: authorPno,
      },
      typeCode: selectedType,
      category: typeDef?.category || "ROUTINE_ADMINISTRATION",
      typeDisplay: typeDef?.nameEn || selectedType,
      typeDisplayHi: typeDef?.nameHi || selectedType,
      subject: subject.trim() || "रोजनामचा प्रविष्टि",
      narrative: narrative.trim() || "विवरण दर्ज किया गया।",
      activityDateTime: `${activityDate} ${activityTime}`,
      officialCreationTimestamp: new Date().toISOString(),
      status: reviewSuggestionId ? "SUGGESTED" : "DRAFT",
      source: reviewSuggestionId ? "SYSTEM_EVENT" : "MANUAL_ENTRY",
      isLocked: false,
      relatedRecords: related,
      auditTrail: [],
    };
  }, [
    types,
    selectedType,
    selectedOfficer,
    authorName,
    authorRank,
    authorBelt,
    authorPno,
    subject,
    narrative,
    activityDate,
    activityTime,
    complaintNumber,
    firNumber,
    vehicleNumber,
    personName,
    destinationLocation,
    editDraftId,
    reviewSuggestionId,
    currentUser,
  ]);

  // Validation
  const validateForm = () => {
    if (!subject.trim()) {
      setError("विषय (Subject) दर्ज करना अनिवार्य है।");
      return false;
    }
    if (!narrative.trim()) {
      setError("इंद्राज का विवरण (Narrative) दर्ज करना अनिवार्य है।");
      return false;
    }
    if (!selectedOfficer) {
      setError("मुलाज़िम मुताल्लिक (Entry-For Officer) का चयन अनिवार्य है।");
      return false;
    }
    setError(null);
    return true;
  };

  // 1. Save Unofficial Draft
  const handleSaveDraft = async () => {
    if (!validateForm()) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await GeneralDiaryService.saveDraft({
        id: editDraftId || undefined,
        typeCode: selectedType,
        subject: subject.trim(),
        narrative: narrative.trim(),
        activityDateTime: `${activityDate} ${activityTime}`,
        entryForOfficer: compiledRecord.entryForOfficer,
        actualAuthor: compiledRecord.actualAuthor,
        policeStation: compiledRecord.policeStation,
        district: compiledRecord.district,
        relatedRecords: compiledRecord.relatedRecords,
      });
      router.push("/general-diary?tab=drafts");
    } catch (err: any) {
      setError(err.message || "Failed to save draft.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Open Verification Confirmation Modal
  const handleVerifyClick = () => {
    if (!validateForm()) return;
    setVerifyModalOpen(true);
  };

  // 3. Confirm & Permanently Lock Entry
  const handleConfirmLock = async (remarks: string) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const verifier: GDOfficerParticulars = {
        name: currentUser.name,
        rank: currentUser.rankDisplay || "Officer",
        beltNumber: currentUser.pno ? `${currentUser.pno.slice(-3)}/KKR` : "889/KKR",
        pno: currentUser.pno,
      };

      await GeneralDiaryService.verifyAndLockEntry(
        compiledRecord,
        verifier,
        remarks
      );

      // If this was an existing suggestion or draft, clean it up
      if (editDraftId || reviewSuggestionId) {
        try {
          await GeneralDiaryService.deleteDraft(editDraftId || reviewSuggestionId!);
        } catch {}
      }

      router.push("/general-diary");
    } catch (err: any) {
      setError(err.message || "Failed to verify and lock GD record.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in-50 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/general-diary"
              className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <span className="text-xs font-bold uppercase tracking-wider text-[#b8001f]">
              {reviewSuggestionId ? "Review AI Suggestion" : editDraftId ? "Editing Draft" : "Roznamcha Aam Intake"}
            </span>
          </div>
          <h1 className="text-2xl font-black text-[#0b192c] tracking-tight mt-0.5">
            {reviewSuggestionId
              ? "तस्दीक व रिव्यू रोजनामचा सुझाव"
              : editDraftId
              ? "संशोधन ड्राफ्ट रोजनामचा"
              : "नया रोजनामचा इंद्राज (New GD Entry)"}
          </h1>
          <p className="text-xs text-slate-500">
            PPR 1934 Rule 22.48 • Official Station Diary Record No. II
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setTemplateModalOpen(true)}
            className="text-xs font-bold gap-1.5 border-blue-200 bg-blue-50/60 text-blue-900 hover:bg-blue-100 cursor-pointer shadow-2xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-700" />
            <span>Templates Library</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPreviewModalOpen(true)}
            className="text-xs font-semibold gap-1.5 cursor-pointer shadow-2xs"
          >
            <Eye className="w-3.5 h-3.5 text-slate-600" />
            <span>Preview</span>
          </Button>
        </div>
      </div>

      {/* Review Suggestion Notice Banner */}
      {reviewSuggestionId && (
        <div className="p-4 bg-purple-50 border-2 border-purple-300 rounded-xl flex items-start justify-between gap-3 text-xs text-purple-950 animate-in fade-in-50 shadow-xs">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm text-purple-950">
                AI / System Suggested GD (Requires Human Review)
              </p>
              <p className="text-purple-800 leading-relaxed mt-0.5">
                यह इंद्राज सिस्टम द्वारा घटना (Complaint Intake) के आधार पर तैयार किया गया है। कृपया तथ्यों की निष्पक्ष जांच करें, आवश्यक संशोधन करें, और तस्दीक करने हेतु <strong>&ldquo;Verify &amp; Lock GD&rdquo;</strong> दबाएं।
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Duplicate Warning Banner */}
      {duplicateWarning && (
        <div className="p-3.5 bg-amber-50 border border-amber-300 text-amber-950 text-xs rounded-xl flex items-center gap-2.5 shadow-2xs animate-in fade-in-50">
          <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
          <span>{duplicateWarning}</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-3.5 bg-red-50 border border-red-300 text-red-700 text-xs rounded-xl flex items-center gap-2 shadow-2xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Single Form Card */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-5 sm:p-7 space-y-6">
          {/* Section 1: Classification & Activity Timing */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-blue-700" />
                <span>1. इंद्राज का प्रकार व कार्यवाही समय (Category &amp; Activity Time)</span>
              </h3>
              <span className="text-[11px] text-slate-500 font-mono">
                Station: {currentUser.stationName}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              {/* Type Select */}
              <div className="sm:col-span-6">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  GD Entry Type (प्रकार) *
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => {
                    const code = e.target.value;
                    setSelectedType(code);
                    const chosen = types.find((t) => t.code === code);
                    if (chosen && chosen.defaultTemplates.length > 0) {
                      applyTemplate(chosen.defaultTemplates[0], chosen);
                    }
                  }}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-900 focus:ring-2 focus:ring-[#0b192c]"
                >
                  {types.map((t) => (
                    <option key={t.code} value={t.code}>
                      {t.nameHi} — {t.nameEn}
                    </option>
                  ))}
                </select>
              </div>

              {/* Activity Date */}
              <div className="sm:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  कार्यवाही तिथि (Activity Date) *
                </label>
                <input
                  type="date"
                  value={activityDate}
                  onChange={(e) => setActivityDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-[#0b192c]"
                />
              </div>

              {/* Activity Time */}
              <div className="sm:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  कार्यवाही समय (Event Time) *
                </label>
                <input
                  type="time"
                  value={activityTime}
                  onChange={(e) => setActivityTime(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-[#0b192c]"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Officer Particulars (Entry-For Officer & MHC Writer) */}
          <div className="space-y-4 pt-2 border-t border-slate-100">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
              <User className="w-4 h-4 text-emerald-700" />
              <span>2. अधिकारी विवरण (Entry-For Officer &amp; Actual Writer)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Entry-For Officer Picker */}
              <div className="p-3.5 bg-emerald-50/60 border border-emerald-300 rounded-xl space-y-2">
                <div className="flex items-center justify-between pb-1 border-b border-emerald-200">
                  <span className="font-black text-emerald-950 uppercase text-[11px]">
                    मुलाज़िम मुताल्लिक (Entry-For Officer) *
                  </span>
                  <span className="text-[10px] text-emerald-800 font-bold">
                    PNO: {selectedOfficer.pno}
                  </span>
                </div>
                <select
                  value={selectedOfficerId}
                  onChange={(e) => setSelectedOfficerId(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-emerald-300 rounded-lg font-bold text-slate-900 focus:ring-2 focus:ring-emerald-700"
                >
                  {stationOfficers.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name} ({o.rank} • Belt: {o.beltNumber})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-emerald-900 font-mono">
                  Rank: {selectedOfficer.rank} • Belt: {selectedOfficer.beltNumber}
                </p>
              </div>

              {/* Actual Writer (MHC / DO) */}
              <div className="p-3.5 bg-blue-50/60 border border-blue-300 rounded-xl space-y-2">
                <div className="flex items-center justify-between pb-1 border-b border-blue-200">
                  <span className="font-black text-blue-950 uppercase text-[11px]">
                    रोजनामचा लेखक (Actual Author / MHC) *
                  </span>
                  <span className="text-[10px] text-blue-800 font-bold">
                    MHC Desk
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-600 font-medium block">लेखक नाम:</label>
                    <input
                      type="text"
                      value={authorName}
                      onChange={(e) => setAuthorName(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-blue-200 rounded text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-600 font-medium block">पद व बेल्ट:</label>
                    <input
                      type="text"
                      value={`${authorRank} (${authorBelt})`}
                      onChange={(e) => setAuthorRank(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-blue-200 rounded text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Template Dynamic Variables (If active template has variables) */}
          {activeTemplate && activeTemplate.variables.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-slate-100 animate-in fade-in-50">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs uppercase tracking-wider text-blue-950 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>टेम्पलेट चर राशियां (Template Variables - Live Fill)</span>
                </h4>
                <span className="text-[11px] text-slate-500">
                  Fill values below to update text automatically
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                {activeTemplate.variables.map((v) => (
                  <div key={v.key}>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                      {v.labelHi} ({v.labelEn}) {v.required ? "*" : ""}
                    </label>
                    <input
                      type={v.type === "number" ? "number" : v.type === "time" ? "time" : v.type === "date" ? "date" : "text"}
                      value={variableValues[v.key] || ""}
                      onChange={(e) => handleVariableChange(v.key, e.target.value)}
                      placeholder={v.defaultValue || `Enter ${v.labelEn}`}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-[#0b192c]"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 4: Cross Reference & Related Records */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-purple-700" />
              <span>3. संबंधित रिकॉर्ड्स व संदर्भ (Linked Records - Optional)</span>
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                  Complaint No
                </label>
                <input
                  type="text"
                  value={complaintNumber}
                  onChange={(e) => setComplaintNumber(e.target.value)}
                  placeholder="CMP-2026-..."
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                  FIR Number
                </label>
                <input
                  type="text"
                  value={firNumber}
                  onChange={(e) => setFirNumber(e.target.value)}
                  placeholder="142/2026"
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                  Vehicle Number
                </label>
                <input
                  type="text"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value)}
                  placeholder="HR-07-G-1102"
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                  Person / Accused
                </label>
                <input
                  type="text"
                  value={personName}
                  onChange={(e) => setPersonName(e.target.value)}
                  placeholder="Name of Person"
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                  Destination / Spot
                </label>
                <input
                  type="text"
                  value={destinationLocation}
                  onChange={(e) => setDestinationLocation(e.target.value)}
                  placeholder="Sector / Village"
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>
          </div>

          {/* Section 5: Subject & Narrative with Voice Dictation */}
          <div className="space-y-4 pt-2 border-t border-slate-100">
            {/* Voice Dictation Language Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-blue-50/70 border border-blue-200/60 rounded-xl text-xs text-blue-950">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
                </span>
                <span className="font-bold text-slate-900">Voice Dictation (बोलकर लिखें):</span>
                <span className="text-slate-500 text-[11px] hidden sm:inline">
                  Tap mic icon next to Subject or Narrative to dictate
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs bg-white px-2 py-0.5 rounded-md border border-blue-200 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-500">Dictation Lang:</span>
                <button
                  type="button"
                  onClick={() => setVoiceLang("hi-IN")}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                    voiceLang === "hi-IN"
                      ? "bg-[#0b192c] text-white shadow-xs"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  Hindi
                </button>
                <button
                  type="button"
                  onClick={() => setVoiceLang("en-IN")}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                    voiceLang === "en-IN"
                      ? "bg-[#0b192c] text-white shadow-xs"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  English
                </button>
              </div>
            </div>

            {/* Subject Field */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-800">
                  विषय (Subject) *
                </label>
                <VoiceInputButton
                  onTranscript={(text) => setSubject((prev) => (prev ? `${prev} ${text}` : text))}
                  fieldLabel="GD Subject"
                  preferredLang={voiceLang}
                />
              </div>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. रवानगी SI Vikram Singh बराए तफ्तीश मुकदमा..."
                className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-950 focus:ring-2 focus:ring-[#0b192c]"
              />
            </div>

            {/* Narrative / Description Field */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-800">
                  इंद्राज का विस्तृत विवरण (Roznamcha Narrative) *
                </label>
                <VoiceInputButton
                  onTranscript={(text) => setNarrative((prev) => (prev ? `${prev} ${text}` : text))}
                  fieldLabel="Roznamcha Narrative"
                  preferredLang={voiceLang}
                />
              </div>
              <textarea
                rows={6}
                value={narrative}
                onChange={(e) => setNarrative(e.target.value)}
                placeholder="Enter complete factual entry in Hindi, English or legal police phraseology..."
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-lg leading-relaxed font-sans text-slate-900 focus:ring-2 focus:ring-[#0b192c]"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                PPR 22.48 mandates factual clarity, exact departure/return times, weapons issued, and purpose.
              </span>
            </div>
          </div>

          {/* Action Bar */}
          <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <Link href="/general-diary">
              <Button variant="outline" size="sm" className="text-xs">
                Cancel
              </Button>
            </Link>

            <div className="flex items-center gap-2">
              {/* Save Draft Button */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSaveDraft}
                disabled={isSubmitting}
                className="text-xs font-bold gap-1.5 border-slate-300 bg-white hover:bg-slate-50 cursor-pointer shadow-2xs"
              >
                <Save className="w-3.5 h-3.5 text-slate-600" />
                <span>Save Draft</span>
              </Button>

              {/* Preview Button */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPreviewModalOpen(true)}
                className="text-xs font-bold gap-1.5 border-blue-300 bg-blue-50 text-blue-900 hover:bg-blue-100 cursor-pointer shadow-2xs"
              >
                <Eye className="w-3.5 h-3.5 text-blue-700" />
                <span>Preview Ledger</span>
              </Button>

              {/* Verify & Lock Button */}
              <Button
                type="button"
                size="sm"
                onClick={handleVerifyClick}
                disabled={isSubmitting}
                className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold gap-1.5 cursor-pointer shadow-xs"
              >
                <Lock className="w-3.5 h-3.5 text-amber-300" />
                <span>Verify &amp; Lock GD</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Official Record Preview Modal */}
      <GDRecordModal
        record={compiledRecord}
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        onVerifyAndLock={() => {
          setPreviewModalOpen(false);
          setVerifyModalOpen(true);
        }}
        canVerify={true}
      />

      {/* Human Verification & Lock Modal */}
      <GDVerificationModal
        record={compiledRecord}
        isOpen={verifyModalOpen}
        onClose={() => setVerifyModalOpen(false)}
        onConfirmLock={handleConfirmLock}
        verifier={{
          name: currentUser.name,
          rank: currentUser.rankDisplay || "Inspector / SHO",
          beltNumber: currentUser.pno ? `${currentUser.pno.slice(-3)}/KKR` : "889/KKR",
          pno: currentUser.pno,
        }}
      />

      {/* Templates Library Modal */}
      <GDTemplateModal
        types={types}
        isOpen={templateModalOpen}
        onClose={() => setTemplateModalOpen(false)}
        onSelectTemplate={applyTemplate}
        onSaveCustomTemplate={async (tmpl) => {
          await GeneralDiaryService.saveCustomTemplate(tmpl);
          const all = await GeneralDiaryService.getAllTypes();
          setTypes(all);
        }}
      />
    </div>
  );
}

export default function NewGDEntryPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-4xl mx-auto p-8 text-center text-xs text-slate-500">
          Loading Roznamcha intake...
        </div>
      }
    >
      <NewGDEntryContent />
    </Suspense>
  );
}
