"use client";

import React, { useState, useEffect, useMemo, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BookOpen,
  Lock,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  User,
  Clock,
  Calendar,
  Save,
  RotateCcw,
  Sparkles,
  FileText,
  Search,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { GeneralDiaryService } from "@/services/generalDiaryService";
import {
  GeneralDiaryRecord,
  GDEntryTypeConfig,
  GDOfficerParticulars,
} from "@/types/generalDiary";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { VoiceInputButton } from "@/components/ui/voice-input-button";
import { MOCK_ENQUIRY_OFFICERS } from "@/lib/mockData";
import { DropdownManagerService } from "@/services/dropdownManagerService";

function NewGDEntryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentUser } = useAuth();

  const editDraftId = searchParams.get("editDraft");
  const preselectedType = searchParams.get("type");

  // Officer list with SI Malkeet at the top
  const stationOfficers = useMemo(() => {
    return [
      {
        id: "usr_si_malkeet",
        name: "SI Malkeet",
        rank: "Sub-Inspector",
        beltNumber: "512/KKR",
        pno: "08192841",
      },
      {
        id: "usr_sho_1",
        name: "Inspector Rajesh Kumar",
        rank: "Inspector / SHO",
        beltNumber: "04291882",
        pno: "04291882",
      },
      {
        id: "eo_2",
        name: "ASI Ramesh Chander",
        rank: "Assistant Sub-Inspector",
        beltNumber: "614/KKR",
        pno: "06281923",
      },
      {
        id: "eo_1",
        name: "SI Vikram Singh",
        rank: "Sub-Inspector",
        beltNumber: "742/KKR",
        pno: "07182930",
      },
      {
        id: "eo_3",
        name: "SI Pooja Rani",
        rank: "Sub-Inspector",
        beltNumber: "819/KKR",
        pno: "07291845",
      },
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
    ];
  }, []);

  // Form State
  const [types, setTypes] = useState<GDEntryTypeConfig[]>([]);
  const [selectedOfficerId, setSelectedOfficerId] = useState<string>("usr_si_malkeet");
  const [customOfficerName, setCustomOfficerName] = useState("");
  const [selectedType, setSelectedType] = useState<string>(preselectedType || "AAGAZ_ROZNAMCHA");

  // Date & Time — SERVER-OWNED (read-only; CCTNS dd/mm/yyyy + HH:mm 24-hour)
  const [serverDateDisplay, setServerDateDisplay] = useState("--/--/----");
  const [serverTimeDisplay, setServerTimeDisplay] = useState("--:--");
  const [nextGdNumber, setNextGdNumber] = useState<string>("GD-…");
  const suppressAutoTemplateRef = useRef(false);

  // Subject & Brief Narrative
  const [subject, setSubject] = useState("");
  const [narrative, setNarrative] = useState("");

  // Status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load configured types (merged with Dropdown Manager)
  useEffect(() => {
    const loadedTypes = GeneralDiaryService.getTypes();
    const dynamicGdTypes = DropdownManagerService.getItems("gd_types", true);

    if (dynamicGdTypes && dynamicGdTypes.length > 0) {
      const merged: GDEntryTypeConfig[] = dynamicGdTypes.map((d) => {
        const found = loadedTypes.find((t) => t.code === d.code);
        if (found) return { ...found, nameEn: d.label, nameHi: d.label };
        return {
          code: d.code,
          category: "ROUTINE_ADMINISTRATION",
          nameEn: d.label,
          nameHi: d.label,
          description: d.description || d.label,
          isEnabled: d.isActive,
          usedCount: 0,
          requiresOfficer: true,
          defaultTemplates: [],
        };
      });
      setTypes(merged);
    } else {
      setTypes(loadedTypes);
    }

    const handleUpdate = () => {
      const updated = DropdownManagerService.getItems("gd_types", true);
      if (updated && updated.length > 0) {
        const merged: GDEntryTypeConfig[] = updated.map((d) => {
          const found = loadedTypes.find((t) => t.code === d.code);
          if (found) return { ...found, nameEn: d.label, nameHi: d.label };
          return {
            code: d.code,
            category: "ROUTINE_ADMINISTRATION",
            nameEn: d.label,
            nameHi: d.label,
            description: d.description || d.label,
            isEnabled: d.isActive,
            usedCount: 0,
            requiresOfficer: true,
            defaultTemplates: [],
          };
        });
        setTypes(merged);
      }
    };
    window.addEventListener("cms-dropdowns-updated", handleUpdate);
    return () => window.removeEventListener("cms-dropdowns-updated", handleUpdate);
  }, []);

  // Fetch SERVER date/time + next GD number (server-owned, never editable)
  useEffect(() => {
    let alive = true;
    GeneralDiaryService.getServerNow()
      .then((n) => {
        if (!alive) return;
        setServerDateDisplay(n.serverDateDisplay);
        setServerTimeDisplay(n.serverTimeDisplay);
        setNextGdNumber(n.nextGdNumber);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  // Get active officer
  const currentOfficer = useMemo(() => {
    if (selectedOfficerId === "custom") {
      return {
        name: customOfficerName || "Police Officer",
        rank: "Officer",
        beltNumber: "Station Staff",
        pno: "00000000",
      };
    }
    const found = stationOfficers.find((o) => o.id === selectedOfficerId);
    return (
      found || {
        name: "SI Malkeet",
        rank: "Sub-Inspector",
        beltNumber: "512/KKR",
        pno: "08192841",
      }
    );
  }, [selectedOfficerId, customOfficerName, stationOfficers]);

  // Quick Preset Templates generator based on selectedType and currentOfficer
  const applyTemplateForType = (typeCode: string, officerName: string) => {
    const offName = officerName || "SI Malkeet";

    switch (typeCode) {
      case "AAGAZ_ROZNAMCHA":
        setSubject("Aagaz");
        setNarrative(
          `At 12:00 AM, it is entered that the General Diary was formally opened in accordance with Punjab Police Rule 22.48. Sentry guard inspection and lockup status verified. Current lockup strength: 0 detainees. Station armory, weapon registers, and cash chest verified. Sentry guard and MHC charge assumed. All station affairs reported in order.`
        );
        break;

      case "SAFAI_THANA":
        setSubject("Safai Thana");
        setNarrative(
          `At 06:30 AM, comprehensive cleaning and sanitary inspection of police station premises, lockup, mal-khana, barracks, and public reception was conducted. Sanitation and drinking water verified in order.`
        );
        break;

      case "STAFF_GINTI":
        setSubject("Ginti Staff");
        setNarrative(
          `At 08:00 AM, morning roll call and staff count conducted. 18 personnel present on parade, 2 on sanctioned leave, 1 on court duty. Personnel briefed on supervisory directives, law & order vigilance, and duty assignments.`
        );
        break;

      case "RAVANGI_OFFICER":
        setSubject(`Ravangi - ${offName} for Investigation`);
        setNarrative(
          `At this time, ${offName} departed from the Police Station along with staff in government vehicle for official duty and field investigation in case enquiry. Arms and vehicle logbook verified. Entered in General Diary.`
        );
        break;

      case "WAPSI_OFFICER":
        setSubject(`Wapsi - ${offName} from Duty`);
        setNarrative(
          `At this time, ${offName} returned safely to the Police Station along with staff after successfully concluding field investigation and spot verification. Arms deposited in order. Entered in General Diary.`
        );
        break;

      case "BANDI_ROZNAMCHA":
        setSubject("Bandi - 24-Hour Closure");
        setNarrative(
          `At 11:59 PM, the General Diary for the 24-hour cycle was formally closed and locked. All daily entries verified and recorded. Lockup secure and weapons accounted for. Register closed under PPR 22.49.`
        );
        break;

      case "DUTY_ASSIGNMENT":
        setSubject("Duty Change - Sentry Relief");
        setNarrative(
          `At this time, sentry guard and shift turnover took place. Government arms, ammunition, and lockup charge handed over in proper condition. New sentry alert on duty.`
        );
        break;

      case "COMPLAINT_RECEIVED":
        setSubject("Complaint Received - Citizen Application");
        setNarrative(
          `At this time, citizen submitted a written complaint. Intake acknowledged, computerized docket generated in CMS, and placed before SHO for enquiry officer assignment.`
        );
        break;

      case "FIR_REGISTRATION":
        setSubject("FIR Registered - Criminal Case Lodged");
        setNarrative(
          `At this time, formal FIR was registered under relevant legal sections upon substantiation of cognizable offence. Investigation assigned to investigating officer.`
        );
        break;

      case "ARREST_ACCUSED":
        setSubject("Arrest of Accused - Custodial Intake");
        setNarrative(
          `At this time, accused person was produced under arrest following legal procedure. Medical examination conducted and intimation given to family members.`
        );
        break;

      case "RELEASE_ACCUSED":
        setSubject("Release of Accused - Court Bail Granted");
        setNarrative(
          `At this time, accused person was released from police custody following valid bail order from the competent court.`
        );
        break;

      case "PROPERTY_DEPOSIT":
        setSubject("Malkhana - Case Property Deposited");
        setNarrative(
          `At this time, case property/seized items were formally deposited into the Malkhana under Register No. XIX.`
        );
        break;

      case "COURT_PRODUCTION":
        setSubject("Court Production - Accused Produced Before Magistrate");
        setNarrative(
          `At this time, accused was escorted under secure guard to the competent court for remand/judicial hearing.`
        );
        break;

      case "VEHICLE_MOVEMENT":
        setSubject("Government Vehicle - Movement Recorded");
        setNarrative(
          `At this time, government patrol vehicle departed / returned for official police duties. Logbook kilometer reading and fuel verified.`
        );
        break;

      case "BEAT_PATROLLING":
        setSubject("Beat Duty - Area Patrolling & Chequing");
        setNarrative(
          `At this time, beat patrolling staff dispatched for intensive night patrolling, vehicle chequing, and crime prevention in market and residential areas.`
        );
        break;

      case "SUPERVISORY_CHECKING":
        setSubject("Supervisory Inspection - Senior Officer Visit");
        setNarrative(
          `At this time, senior supervisory officer arrived for surprise checking of the Police Station, records, lockup, and staff alertness.`
        );
        break;

      case "INFORMATION_RECEIVED":
        setSubject("Information Received - General Station Entry");
        setNarrative(
          `At this time, information received regarding local law and order development. Relevant entries noted for station record.`
        );
        break;

      default:
        setSubject("General Police Station Entry");
        setNarrative(
          `At this time, general entry recorded in General Diary regarding station routine administration and police procedures.`
        );
        break;
    }
  };

  // Whenever type changes, load default template (skipped right after
  // Clear Form, and while editing an existing draft so its text is kept)
  useEffect(() => {
    if (editDraftId) return;
    if (suppressAutoTemplateRef.current) {
      suppressAutoTemplateRef.current = false;
      return;
    }
    applyTemplateForType(selectedType, currentOfficer.name);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedType, currentOfficer.name, editDraftId]);

  // Load draft if requested (from the server register, local fallback)
  useEffect(() => {
    if (!editDraftId) return;
    let alive = true;
    GeneralDiaryService.getDraftByIdAsync(editDraftId).then((draft) => {
      if (!alive || !draft) return;
      setSelectedType(draft.typeCode);
      setSubject(draft.subject);
      setNarrative(draft.narrative);
      if (draft.entryForOfficer?.name) {
        const match = stationOfficers.find((o) => o.name === draft.entryForOfficer.name);
        if (match) setSelectedOfficerId(match.id);
        else {
          setSelectedOfficerId("custom");
          setCustomOfficerName(draft.entryForOfficer.name);
        }
      }
    });
    return () => {
      alive = false;
    };
  }, [editDraftId, stationOfficers]);

  // Submit and Lock GD Entry
  const handleSaveAndLock = async () => {
    setError(null);
    if (!subject.trim()) {
      setError("Please enter the Subject for this General Diary entry.");
      return;
    }
    if (!narrative.trim()) {
      setError("Please enter the GD Brief (description) for this entry.");
      return;
    }

    setIsSubmitting(true);
    try {
      const typeConfig = types.find((t) => t.code === selectedType);
      const officerData: GDOfficerParticulars = {
        name: currentOfficer.name,
        rank: currentOfficer.rank,
        beltNumber: currentOfficer.beltNumber,
        pno: currentOfficer.pno,
      };

      const authorData: GDOfficerParticulars = {
        name: currentUser.name || "HC Devinder Kumar",
        rank: currentUser.rankDisplay || "Head Constable (MHC)",
        beltNumber: "889/KKR",
        pno: currentUser.pno || "05192834",
      };

      // Save directly as locked entry — GD number, date & time are SERVER-assigned
      const newRecord = await GeneralDiaryService.addEntry({
        typeCode: selectedType,
        category: typeConfig?.category || "ROUTINE_ADMINISTRATION",
        typeDisplay: typeConfig?.nameEn || selectedType,
        typeDisplayHi: typeConfig?.nameEn || selectedType,
        subject: subject.trim(),
        narrative: narrative.trim(),
        entryForOfficer: officerData,
        actualAuthor: authorData,
        policeStation: "PS City Thanesar",
        district: "Kurukshetra",
        source: "MANUAL_ENTRY",
        relatedRecords: {},
      });

      if (editDraftId) {
        await GeneralDiaryService.deleteDraft(editDraftId);
      }

      setSuccessMessage(`General Diary entry #${newRecord.sequencePerDay} (${newRecord.gdNumber}) successfully recorded and locked!`);
      setTimeout(() => {
        router.push("/general-diary");
      }, 1200);
    } catch (err: any) {
      setError(err?.message || "Failed to record entry in General Diary.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Save Draft
  const handleSaveDraft = async () => {
    setError(null);
    if (!subject.trim()) {
      setError("Please enter at least a Subject to save a draft.");
      return;
    }

    try {
      const typeConfig = types.find((t) => t.code === selectedType);
      await GeneralDiaryService.saveDraft({
        id: editDraftId || undefined,
        typeCode: selectedType,
        category: typeConfig?.category || "ROUTINE_ADMINISTRATION",
        typeDisplay: typeConfig?.nameEn || selectedType,
        subject: subject.trim(),
        narrative: narrative.trim(),
        entryForOfficer: currentOfficer,
        policeStation: "PS City Thanesar",
      });

      setSuccessMessage("Draft saved successfully!");
      setTimeout(() => {
        router.push("/general-diary?tab=SUGGESTIONS_DRAFTS");
      }, 1000);
    } catch (err: any) {
      setError("Failed to save draft.");
    }
  };

  // Clear Form — truly clears all fields (no template re-fill afterwards)
  const handleReset = () => {
    suppressAutoTemplateRef.current = true;
    if (selectedType === "AAGAZ_ROZNAMCHA") {
      // Type already at default: the template effect will not refire,
      // so consume the suppression immediately
      suppressAutoTemplateRef.current = false;
    }
    setSelectedOfficerId("usr_si_malkeet");
    setCustomOfficerName("");
    setSelectedType("AAGAZ_ROZNAMCHA");
    setSubject("");
    setNarrative("");
    setError(null);
    setSuccessMessage(null);
  };

  // Common Quick Types
  const commonTypes = [
    { code: "AAGAZ_ROZNAMCHA", label: "Opening (Aagaz)", emoji: "🌅" },
    { code: "SAFAI_THANA", label: "Cleanliness (Safai)", emoji: "🧹" },
    { code: "STAFF_GINTI", label: "Roll Call (Ginti)", emoji: "📋" },
    { code: "RAVANGI_OFFICER", label: "Departure (Ravangi)", emoji: "🚶‍♂️" },
    { code: "WAPSI_OFFICER", label: "Arrival (Wapsi)", emoji: "🏠" },
    { code: "BANDI_ROZNAMCHA", label: "Closing (Bandi)", emoji: "🌙" },
    { code: "COMPLAINT_RECEIVED", label: "Complaint Intake", emoji: "📝" },
    { code: "FIR_REGISTRATION", label: "FIR Lodged", emoji: "⚖️" },
  ];

  return (
    <div className="p-3 sm:p-6 max-w-4xl mx-auto space-y-5">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/general-diary"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#0b192c] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Smart General Diary</span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-blue-50 text-blue-700 font-semibold px-2.5 py-1 rounded-full border border-blue-200">
            PS City Thanesar
          </span>
          <span className="text-xs bg-indigo-50 text-indigo-700 font-mono font-bold px-2.5 py-1 rounded-full border border-indigo-200">
            Next GD No: {nextGdNumber}
          </span>
          <span className="text-xs bg-emerald-50 text-emerald-700 font-semibold px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
            <Lock className="w-3 h-3" />
            <span>Immutable Register</span>
          </span>
        </div>
      </div>

      {/* Main Friendly Form Card */}
      <Card className="border-slate-200 shadow-sm bg-white overflow-hidden">
        {/* Banner */}
        <div className="bg-[#0b192c] text-white p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center font-bold">
              <BookOpen className="w-5 h-5 text-blue-300" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white">
                Add New GD Entry (Smart General Diary)
              </h2>
              <p className="text-xs text-blue-200/80 mt-0.5">
                Every police action is recorded here. Select an officer and activity type to auto-fill the editable template.
              </p>
            </div>
          </div>
        </div>

        <CardContent className="p-5 sm:p-7 space-y-6">
          {/* Success Banner */}
          {successMessage && (
            <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl flex items-center gap-2.5 text-sm font-semibold animate-in fade-in-50">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-300 text-red-800 rounded-xl flex items-center gap-2.5 text-sm font-medium animate-in fade-in-50">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Select Buttons (Child-Friendly Activity Chips) */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 block uppercase tracking-wider">
              Quick Select Common Activity:
            </label>
            <div className="flex flex-wrap gap-2">
              {commonTypes.map((item) => {
                const isSelected = selectedType === item.code;
                return (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => setSelectedType(item.code)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#0b192c] text-white shadow-sm ring-2 ring-blue-500"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                    }`}
                  >
                    <span>{item.emoji}</span>
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2 border-t border-slate-100">
            {/* 1. Entry for Officer */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-600" />
                <span>Entry for – Officer *</span>
              </label>
              <select
                value={selectedOfficerId}
                onChange={(e) => setSelectedOfficerId(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs sm:text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-[#0b192c]"
              >
                {stationOfficers.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name} ({o.rank} - {o.beltNumber})
                  </option>
                ))}
                <option value="custom">+ Type other officer...</option>
              </select>

              {selectedOfficerId === "custom" && (
                <input
                  type="text"
                  value={customOfficerName}
                  onChange={(e) => setCustomOfficerName(e.target.value)}
                  placeholder="Enter officer name (e.g. SI Malkeet Singh)"
                  className="w-full mt-2 px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900"
                />
              )}
            </div>

            {/* 2. GD Type */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                <span>GD Type – Select *</span>
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs sm:text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-[#0b192c]"
              >
                {types.map((t) => (
                  <option key={t.code} value={t.code}>
                    {t.nameEn}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date & Time Row — SERVER-OWNED (read-only, CCTNS format) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-600" />
                <span>Date *</span>
              </label>
              <input
                type="text"
                value={serverDateDisplay}
                readOnly
                disabled
                className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-lg text-xs sm:text-sm font-mono text-slate-700 cursor-not-allowed"
              />
              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                <Lock className="w-3 h-3" /> Server date — not editable (dd/mm/yyyy)
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-600" />
                <span>Time *</span>
              </label>
              <input
                type="text"
                value={serverTimeDisplay}
                readOnly
                disabled
                className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-lg text-xs sm:text-sm font-mono text-slate-700 cursor-not-allowed"
              />
              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                <Lock className="w-3 h-3" /> Server time — not editable (24-hour); stamped on save
              </span>
            </div>
          </div>

          {/* 3. Subject */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800">
                Subject (Auto-filled &amp; Editable) *
              </label>
              <VoiceInputButton
                onTranscript={(text) => setSubject((prev) => (prev ? `${prev} ${text}` : text))}
                fieldLabel="GD Subject"
                preferredLang="en-IN"
              />
            </div>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Aagaz or Ravangi for Investigation"
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs sm:text-sm font-bold text-slate-950 focus:ring-2 focus:ring-[#0b192c]"
            />
          </div>

          {/* 4. GD Brief (Narrative) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
                <span>GD Brief (Description - Auto-filled &amp; Editable) *</span>
              </label>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400 hidden sm:inline">
                  You can freely edit or speak into this box
                </span>
                <VoiceInputButton
                  onTranscript={(text) => setNarrative((prev) => (prev ? `${prev} ${text}` : text))}
                  fieldLabel="GD Brief"
                  preferredLang="en-IN"
                />
              </div>
            </div>
            <textarea
              rows={6}
              value={narrative}
              onChange={(e) => setNarrative(e.target.value)}
              placeholder="Enter brief description of the police station activity..."
              className="w-full px-3.5 py-3 bg-slate-50 border border-slate-300 rounded-lg text-xs sm:text-sm leading-relaxed text-slate-900 focus:ring-2 focus:ring-[#0b192c] font-sans"
            />
            <span className="text-[11px] text-slate-500 block">
              💡 Tip: The template auto-fills when you pick GD Type. You can freely change names, times, vehicle, or any detail before saving.
            </span>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="text-slate-600 gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear Form</span>
            </Button>

            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSaveDraft}
                className="text-slate-700 gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save as Draft</span>
              </Button>

              <Button
                type="button"
                variant="primary"
                size="lg"
                onClick={handleSaveAndLock}
                disabled={isSubmitting}
                className="bg-[#0b192c] hover:bg-slate-900 text-white font-bold px-6 shadow-md gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{isSubmitting ? "Locking..." : "✓ Save & Lock GD Entry"}</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function NewGDEntryPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs text-slate-500">
          Loading Smart General Diary Form...
        </div>
      }
    >
      <NewGDEntryContent />
    </Suspense>
  );
}
