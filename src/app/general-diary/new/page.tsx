"use client";

import React, { useState, useEffect, useMemo, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BookOpen,
  ArrowLeft,
  CalendarDays,
  Clock,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  User,
  Save,
  RotateCcw,
  Sparkles,
  FileText,
  Search,
  XCircle,
  Check,
  ChevronDown,
  Plus,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { GeneralDiaryService } from "@/services/generalDiaryService";
import {
  GeneralDiaryRecord,
  GDEntryTypeConfig,
  GDOfficerParticulars,
  GDUploadedDocument,
} from "@/types/generalDiary";
import {
  Upload,
  Paperclip,
  Trash2,
  Eye,
  Loader2,
  FileDown,
  Image as ImageIcon,
  X,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { VoiceInputButton } from "@/components/ui/voice-input-button";
import { MOCK_ENQUIRY_OFFICERS } from "@/lib/mockData";
import { DropdownManagerService } from "@/services/dropdownManagerService";
import { LEGACY_GD_TYPE_CODES } from "@/lib/generalDiaryConfig";
import {
  formatGDDateKey,
  formatGDTimeDisplay24,
  to12HourParts,
  from12HourParts,
  parseGDActivityDateTime,
  toDDMMYYYY,
} from "@/lib/gdDateTime";

// Default station officers ordered strictly by rank hierarchy:
// Inspector (50) > SI (40) > ASI (30) > HC (20) > Constable (10)
const DEFAULT_STATION_OFFICERS = [
  {
    id: "usr_sho_1",
    name: "Inspector Rajesh Kumar",
    rank: "Inspector / SHO",
    beltNumber: "04291882",
    pno: "04291882",
  },
  {
    id: "usr_si_malkeet",
    name: "SI Malkeet",
    rank: "Sub-Inspector",
    beltNumber: "512/KKR",
    pno: "08192841",
  },
  {
    id: "eo_3",
    name: "SI Pooja Rani",
    rank: "Sub-Inspector",
    beltNumber: "819/KKR",
    pno: "07291845",
  },
  {
    id: "eo_1",
    name: "SI Vikram Singh",
    rank: "Sub-Inspector",
    beltNumber: "742/KKR",
    pno: "07182930",
  },
  {
    id: "eo_2",
    name: "ASI Ramesh Chander",
    rank: "Assistant Sub-Inspector",
    beltNumber: "614/KKR",
    pno: "06281923",
  },
  {
    id: "usr_duty_1",
    name: "ASI Surender Pal",
    rank: "ASI (Duty Officer)",
    beltNumber: "419/KKR",
    pno: "09384712",
  },
  {
    id: "usr_mhc_1",
    name: "HC Devinder Kumar",
    rank: "Head Constable (MHC)",
    beltNumber: "889/KKR",
    pno: "05192834",
  },
  {
    id: "usr_constable_1",
    name: "Constable Praveen Kumar",
    rank: "Constable",
    beltNumber: "902/KKR",
    pno: "09812931",
  },
];

// Strict officer ranking priority hierarchy:
// 1. Inspector / SHO (Priority 50)
// 2. Sub-Inspector / SI (Priority 40)
// 3. Assistant Sub-Inspector / ASI (Priority 30) - STRICTLY BELOW SI
// 4. Head Constable / HC (Priority 20)
// 5. Constable / Ct (Priority 10)
// 6. Other (Priority 0)
export const getRankPriority = (rankStr: string = "", nameStr: string = ""): number => {
  const upperRank = (rankStr || "").toUpperCase().trim();
  const upperName = (nameStr || "").toUpperCase().trim();
  const text = `${upperRank} ${upperName}`;

  // 1. ASI check FIRST: Must be evaluated before SI and Inspector because
  // "Assistant Sub-Inspector" contains "Sub-Inspector" and "Inspector"
  if (
    upperRank.includes("ASSISTANT SUB-INSPECTOR") ||
    upperRank.includes("ASSISTANT SUB INSPECTOR") ||
    /\bASI\b/.test(upperRank) ||
    upperName.startsWith("ASI ") ||
    upperName.startsWith("ASI.") ||
    /\bASI\b/.test(upperName) ||
    text.includes("ASSISTANT SUB-INSPECTOR") ||
    text.includes("ASSISTANT SUB INSPECTOR")
  ) {
    return 30; // ASI (below SI, above HC)
  }

  // 2. Sub-Inspector / SI check SECOND: Must be evaluated before Inspector because
  // "Sub-Inspector" contains "Inspector"
  if (
    upperRank.includes("SUB-INSPECTOR") ||
    upperRank.includes("SUB INSPECTOR") ||
    /\bSI\b/.test(upperRank) ||
    upperName.startsWith("SI ") ||
    upperName.startsWith("SI.") ||
    /\bSI\b/.test(upperName) ||
    text.includes("SUB-INSPECTOR") ||
    text.includes("SUB INSPECTOR")
  ) {
    return 40; // SI (above ASI, below Inspector)
  }

  // 3. Inspector / SHO check
  if (
    upperRank.includes("INSPECTOR") ||
    upperRank.includes("INSP") ||
    upperRank.includes("SHO") ||
    upperName.startsWith("INSPECTOR ") ||
    upperName.startsWith("INSP ") ||
    upperName.startsWith("SHO ") ||
    text.includes("INSPECTOR") ||
    text.includes("INSP") ||
    text.includes("SHO")
  ) {
    return 50; // Inspector (top rank)
  }

  // 4. Head Constable / HC check
  if (
    upperRank.includes("HEAD CONSTABLE") ||
    upperRank.includes("HEAD-CONSTABLE") ||
    /\bHC\b/.test(upperRank) ||
    /\bEHC\b/.test(upperRank) ||
    upperName.startsWith("HC ") ||
    upperName.startsWith("HC.") ||
    upperName.startsWith("EHC ") ||
    /\bHC\b/.test(upperName)
  ) {
    return 20; // HC (below ASI, above Constable)
  }

  // 5. Constable / Ct check
  if (
    upperRank.includes("CONSTABLE") ||
    /\bCT\b/.test(upperRank) ||
    upperName.startsWith("CT ") ||
    upperName.startsWith("CONSTABLE ") ||
    /\bCT\b/.test(upperName)
  ) {
    return 10; // Constable (lowest rank)
  }

  return 0; // Other / Custom
};

export const sortOfficersList = <T extends { rank?: string; name: string }>(list: T[]): T[] => {
  return [...list].sort((a, b) => {
    const pA = getRankPriority(a.rank || "", a.name || "");
    const pB = getRankPriority(b.rank || "", b.name || "");
    if (pB !== pA) return pB - pA;
    return (a.name || "").localeCompare(b.name || "");
  });
};

const inferRankAndName = (input: string): { rank: string; name: string } => {
  const trimmed = input.trim();
  const upper = trimmed.toUpperCase();

  // Check ASI before SI and Inspector
  if (
    upper.startsWith("ASI ") ||
    upper.startsWith("ASI.") ||
    upper.startsWith("ASSISTANT SUB-INSPECTOR ") ||
    upper.startsWith("ASSISTANT SUB INSPECTOR ") ||
    /\bASI\b/.test(upper)
  ) {
    return { rank: "Assistant Sub-Inspector", name: trimmed };
  }
  // Check SI before Inspector
  if (
    upper.startsWith("SI ") ||
    upper.startsWith("SI.") ||
    upper.startsWith("SUB-INSPECTOR ") ||
    upper.startsWith("SUB INSPECTOR ") ||
    /\bSI\b/.test(upper)
  ) {
    return { rank: "Sub-Inspector", name: trimmed };
  }
  // Check Inspector
  if (
    upper.startsWith("INSPECTOR ") ||
    upper.startsWith("INSP ") ||
    upper.startsWith("SHO ") ||
    /\bINSPECTOR\b/.test(upper) ||
    /\bSHO\b/.test(upper)
  ) {
    return { rank: "Inspector", name: trimmed };
  }
  // Check Head Constable
  if (
    upper.startsWith("HC ") ||
    upper.startsWith("HC.") ||
    upper.startsWith("HEAD CONSTABLE ") ||
    upper.startsWith("EHC ") ||
    /\bHC\b/.test(upper)
  ) {
    return { rank: "Head Constable", name: trimmed };
  }
  // Check Constable
  if (
    upper.startsWith("CT ") ||
    upper.startsWith("CT.") ||
    upper.startsWith("CONSTABLE ") ||
    /\bCT\b/.test(upper)
  ) {
    return { rank: "Constable", name: trimmed };
  }

  return { rank: "Officer", name: trimmed };
};

function NewGDEntryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentUser } = useAuth();

  const editDraftId = searchParams.get("editDraft");
  const preselectedType = searchParams.get("type");

  // Officers list with localStorage persistence (strictly sorted on load)
  const [stationOfficers, setStationOfficers] = useState(() => {
    return sortOfficersList(DEFAULT_STATION_OFFICERS);
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem("cms_gd_station_officers");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const sorted = sortOfficersList(parsed);
          setStationOfficers(sorted);
          localStorage.setItem("cms_gd_station_officers", JSON.stringify(sorted));
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Sorted Ranking-wise: Top rank on top
  const sortedOfficers = useMemo(() => {
    return sortOfficersList(stationOfficers);
  }, [stationOfficers]);

  // Form State
  const [types, setTypes] = useState<GDEntryTypeConfig[]>([]);
  const [selectedOfficerId, setSelectedOfficerId] = useState<string>("usr_sho_1");
  const [selectedType, setSelectedType] = useState<string>(preselectedType || "");

  // Officer dropdown and Add Officer state
  const [officerDropdownOpen, setOfficerDropdownOpen] = useState(false);
  const [isAddingOfficer, setIsAddingOfficer] = useState(false);
  const [newOfficerInput, setNewOfficerInput] = useState("");
  const officerDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (officerDropdownRef.current && !officerDropdownRef.current.contains(e.target as Node)) {
        setOfficerDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSaveNewOfficer = () => {
    const rawName = newOfficerInput.trim();
    if (!rawName) return;

    // Auto detect rank from typed name (e.g. "asi kuldeep" -> Assistant Sub-Inspector)
    const detected = inferRankAndName(rawName);

    const newOfficer = {
      id: `off_${Date.now()}`,
      name: rawName,
      rank: detected.rank !== "Officer" ? detected.rank : "Sub-Inspector",
      beltNumber: "",
      pno: `0${Math.floor(1000000 + Math.random() * 9000000)}`,
    };

    const updated = sortOfficersList([...stationOfficers, newOfficer]);
    setStationOfficers(updated);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("cms_gd_station_officers", JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
    }
    setSelectedOfficerId(newOfficer.id);
    setIsAddingOfficer(false);
    setNewOfficerInput("");
    setOfficerDropdownOpen(false);
  };

  const handleCancelAddOfficer = () => {
    setIsAddingOfficer(false);
    setNewOfficerInput("");
  };

  const handleRemoveOfficer = (idToRemove: string) => {
    const updated = sortOfficersList(stationOfficers.filter((o) => o.id !== idToRemove));
    setStationOfficers(updated);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("cms_gd_station_officers", JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
    }
    if (selectedOfficerId === idToRemove) {
      if (updated.length > 0) {
        setSelectedOfficerId(updated[0].id);
      }
    }
  };

  // Date & Time of Activity — user-selectable (back-dating allowed).
  // Defaults always show current date and time by default (never blank).
  const [activityDate, setActivityDate] = useState(() => formatGDDateKey(new Date())); // yyyy-mm-dd
  const [activityDateDisplay, setActivityDateDisplay] = useState(() => toDDMMYYYY(formatGDDateKey(new Date()))); // DD/MM/YYYY format
  const hiddenDateInputRef = useRef<HTMLInputElement>(null);
  const initialTimeParts = useMemo(() => to12HourParts(formatGDTimeDisplay24(new Date())), []);
  const [hourSel, setHourSel] = useState(initialTimeParts.hour);
  const [minuteSel, setMinuteSel] = useState(initialTimeParts.minute);
  const [ampmSel, setAmpmSel] = useState<"AM" | "PM">(initialTimeParts.ampm);
  const serverNowRef = useRef<{ dateISO: string; time24: string } | null>(null);
  const suppressAutoTemplateRef = useRef(false);

  // Keep visible input always strictly in DD/MM/YYYY format and never blank
  useEffect(() => {
    if (activityDate) {
      setActivityDateDisplay(toDDMMYYYY(activityDate));
    } else {
      const todayISO = formatGDDateKey(new Date());
      setActivityDate(todayISO);
      setActivityDateDisplay(toDDMMYYYY(todayISO));
    }
  }, [activityDate]);

  // Subject & Brief Narrative
  const [subject, setSubject] = useState("");
  const [narrative, setNarrative] = useState("");
  const subjectInputRef = useRef<HTMLInputElement>(null);
  const narrativeTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize narrative textarea as content changes so all typed lines are visible
  const adjustTextareaHeight = () => {
    const el = narrativeTextareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const newHeight = Math.max(130, el.scrollHeight + 4);
    el.style.height = `${newHeight}px`;
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [narrative]);

  useEffect(() => {
    window.addEventListener("resize", adjustTextareaHeight);
    return () => window.removeEventListener("resize", adjustTextareaHeight);
  }, []);

  // Attachments & Autofill State
  const [attachments, setAttachments] = useState<GDUploadedDocument[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<GDUploadedDocument | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleFileUploadAndAutofill = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsExtracting(true);
    setError(null);

    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append("files", files[i]);
      }

      const res = await fetch("/api/general-diary/extract", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to extract text from documents");
      }

      // 1. Add uploaded documents to attachments state
      if (data.files && Array.isArray(data.files)) {
        setAttachments((prev) => [...prev, ...data.files]);
      }

      // 2. Autofill extracted text ONLY into GD Brief (narrative)
      if (data.extractedText) {
        setNarrative((prev) => {
          const cleanPrev = (prev || "").trim();
          const cleanExtracted = data.extractedText.trim();
          if (!cleanPrev) return cleanExtracted;
          return `${cleanPrev}\n\n${cleanExtracted}`;
        });
      }
    } catch (err: any) {
      console.error("Extraction error:", err);
      setError(err?.message || "Failed to process and extract text from uploaded files.");
    } finally {
      setIsExtracting(false);
      // Reset input so same file can be re-uploaded if desired
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveAttachment = (docId: string) => {
    setAttachments((prev) => prev.filter((doc) => doc.id !== docId));
  };

  // Official Haryana CCTNS GD types are ALWAYS shown; extra custom types
  // added via the Dropdown Manager (Settings) are appended on top.
  useEffect(() => {
    const appendCustom = (base: GDEntryTypeConfig[]) => {
      const dynamicGdTypes = DropdownManagerService.getItems("gd_types", true);
      if (!dynamicGdTypes || dynamicGdTypes.length === 0) return base;
      const customs: GDEntryTypeConfig[] = dynamicGdTypes
        .filter(
          (d) =>
            d.isActive &&
            !base.some((t) => t.code === d.code) &&
            !LEGACY_GD_TYPE_CODES.has(d.code)
        )
        .map((d) => ({
          code: d.code,
          category: "MISCELLANEOUS" as const,
          nameEn: d.label,
          nameHi: d.label,
          description: d.description || d.label,
          isEnabled: true,
          usedCount: 0,
          requiresOfficer: true,
          defaultTemplates: [],
        }));
      return [...base, ...customs];
    };

    setTypes(appendCustom(GeneralDiaryService.getTypes()));

    const handleUpdate = () => {
      setTypes(appendCustom(GeneralDiaryService.getTypes()));
    };
    window.addEventListener("cms-dropdowns-updated", handleUpdate);
    return () => window.removeEventListener("cms-dropdowns-updated", handleUpdate);
  }, []);

  // Fetch SERVER date/time as the DEFAULT for the selectable date & time
  useEffect(() => {
    if (editDraftId) return;
    let alive = true;
    GeneralDiaryService.getServerNow()
      .then((n) => {
        if (!alive) return;
        const dateISO = n.serverDateISO || formatGDDateKey(new Date());
        const time24 = n.serverTime24 || n.serverTimeDisplay || formatGDTimeDisplay24(new Date());
        setActivityDate(dateISO);
        const p = to12HourParts(time24);
        setHourSel(p.hour);
        setMinuteSel(p.minute);
        setAmpmSel(p.ampm);
        serverNowRef.current = { dateISO, time24 };
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [editDraftId]);

  // Get active officer
  const currentOfficer = useMemo(() => {
    if (isAddingOfficer) {
      const typed = newOfficerInput.trim();
      if (typed) {
        const detected = inferRankAndName(typed);
        return {
          name: typed,
          rank: detected.rank !== "Officer" ? detected.rank : "Officer",
          beltNumber: "",
          pno: "Pending",
        };
      }
      return {
        name: "Enter officer rank & name below...",
        rank: "New Officer",
        beltNumber: "",
        pno: "Pending",
      };
    }
    const found = stationOfficers.find((o) => o.id === selectedOfficerId);
    return (
      found ||
      sortedOfficers[0] || {
        name: "Inspector Rajesh Kumar",
        rank: "Inspector / SHO",
        beltNumber: "04291882",
        pno: "04291882",
      }
    );
  }, [isAddingOfficer, newOfficerInput, selectedOfficerId, stationOfficers, sortedOfficers]);

  // Quick Preset Templates generator based on selectedType and currentOfficer
  const applyTemplateForType = (typeCode: string, officerName: string) => {
    const offName = officerName || "SI Malkeet";

    switch (typeCode) {
      case "OPENING_OF_GD":
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

      case "ROLL_CALL":
      case "STAFF_GINTI":
        setSubject("Ginti Staff");
        setNarrative(
          `At 08:00 AM, morning roll call and staff count conducted. 18 personnel present on parade, 2 on sanctioned leave, 1 on court duty. Personnel briefed on supervisory directives, law & order vigilance, and duty assignments.`
        );
        break;

      case "DEPARTURE":
      case "RAVANGI_OFFICER":
        setSubject(`Ravangi - ${offName} for Investigation`);
        setNarrative(
          `At this time, ${offName} departed from the Police Station along with staff in government vehicle for official duty and field investigation in case enquiry. Arms and vehicle logbook verified. Entered in General Diary.`
        );
        break;

      case "ARRIVAL_RETURN":
      case "WAPSI_OFFICER":
        setSubject(`Wapsi - ${offName} from Duty`);
        setNarrative(
          `At this time, ${offName} returned safely to the Police Station along with staff after successfully concluding field investigation and spot verification. Arms deposited in order. Entered in General Diary.`
        );
        break;

      case "CLOSE_OF_GD":
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

      case "CRIMINAL_CASE":
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

      case "NAKABANDI":
        setSubject("Nakabandi - Check Point Establishment");
        setNarrative(
          `At this time, nakabandi was established at a strategic point under the supervision of the duty officer. Vehicles and suspects were checked, identities verified against records, and the operation concluded without untoward incident.`
        );
        break;

      case "MISSING_PERSON":
        setSubject("Missing Person - Information Recorded");
        setNarrative(
          `At this time, information regarding a missing person was received and recorded. Description, last seen particulars, and photograph particulars were noted. Necessary action for tracing the missing person initiated.`
        );
        break;

      default:
        // No confirmed CCTNS template for this type — leave Subject and
        // GD Brief EMPTY for the officer to fill in themselves.
        break;
    }
  };

  // By default, Subject and GD Brief remain blank for the officer to enter.
  // The optional applyTemplateForType helper is retained for on-demand use if requested.

  // Load draft if requested (from the server register, local fallback)
  useEffect(() => {
    if (!editDraftId) return;
    let alive = true;
    GeneralDiaryService.getDraftByIdAsync(editDraftId).then((draft) => {
      if (!alive || !draft) return;
      setSelectedType(draft.typeCode);
      setSubject(draft.subject);
      setNarrative(draft.narrative);
      // Restore the draft's stored activity date/time into the pickers
      const dt = parseGDActivityDateTime(draft.activityDateTime || "");
      setActivityDate(dt.dateISO);
      const tp = to12HourParts(dt.time24);
      setHourSel(tp.hour);
      setMinuteSel(tp.minute);
      setAmpmSel(tp.ampm);
      if (draft.entryForOfficer?.name) {
        const match = stationOfficers.find((o) => o.name === draft.entryForOfficer.name);
        if (match) {
          setSelectedOfficerId(match.id);
        } else {
          const off = {
            id: `off_draft_${Date.now()}`,
            name: draft.entryForOfficer.name,
            rank: draft.entryForOfficer.rank || "Officer",
            beltNumber: draft.entryForOfficer.beltNumber || "Station Staff",
            pno: draft.entryForOfficer.pno || "00000000",
          };
          setStationOfficers((prev) => sortOfficersList([...prev, off]));
          setSelectedOfficerId(off.id);
        }
      }
      if (draft.attachments && Array.isArray(draft.attachments)) {
        setAttachments(draft.attachments);
      } else if (draft.relatedRecords?.attachments && Array.isArray(draft.relatedRecords.attachments)) {
        setAttachments(draft.relatedRecords.attachments);
      }
    });
    return () => {
      alive = false;
    };
  }, [editDraftId, stationOfficers]);

  // Submit and Lock GD Entry
  const handleSaveAndLock = async () => {
    setError(null);
    if (!selectedType) {
      setError("Please select the GD Type first.");
      return;
    }
    if (!activityDate) {
      setError("Please select the Date of the activity.");
      return;
    }
    if (!subject.trim()) {
      setError("Please enter the Subject for this General Diary entry.");
      return;
    }
    if (!narrative.trim()) {
      setError("Please enter the GD Brief (description) for this entry.");
      return;
    }
    // Guard: an entry can never be filed for a future moment
    const selMs = new Date(`${activityDate}T${activityTime24}:00`).getTime();
    if (selMs > Date.now() + 5 * 60 * 1000) {
      setError("GD entry date/time cannot be in the future. Pick the actual date & time of the activity.");
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

      // Save directly as locked entry — back-dated date/time allowed; the server
// inserts it chronologically and renumbers later GD numbers of that day
      const newRecord = await GeneralDiaryService.addEntry({
        typeCode: selectedType,
        category: typeConfig?.category || "ROUTINE_ADMINISTRATION",
        typeDisplay: typeConfig?.nameEn || selectedType,
        typeDisplayHi: typeConfig?.nameEn || selectedType,
        subject: subject.trim(),
        narrative: narrative.trim(),
        activityDate,
        activityTime: activityTime24,
        entryForOfficer: officerData,
        actualAuthor: authorData,
        policeStation: "PS City Thanesar",
        district: "Kurukshetra",
        source: "MANUAL_ENTRY",
        relatedRecords: {
          attachments: attachments.length > 0 ? attachments : undefined,
        },
        attachments: attachments.length > 0 ? attachments : undefined,
      });

      if (editDraftId) {
        await GeneralDiaryService.deleteDraft(editDraftId);
      }

      setSuccessMessage(
        `General Diary entry #${newRecord.sequencePerDay} (${newRecord.gdNumber}) successfully recorded and locked!`
      );
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
    if (!activityDate) {
      setError("Please select the Date of the activity.");
      return;
    }
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
        activityDate,
        activityTime: activityTime24,
        entryForOfficer: currentOfficer,
        policeStation: "PS City Thanesar",
        relatedRecords: {
          attachments: attachments.length > 0 ? attachments : undefined,
        },
        attachments: attachments.length > 0 ? attachments : undefined,
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
    setAttachments([]);
    setPreviewDoc(null);
    suppressAutoTemplateRef.current = true;
    if (!selectedType) {
      // Type already empty: the template effect will not refire,
      // so consume the suppression immediately
      suppressAutoTemplateRef.current = false;
    }
    setSelectedOfficerId(sortedOfficers[0]?.id || "usr_sho_1");
    setIsAddingOfficer(false);
    setNewOfficerInput("");
    setSelectedType("");
    setTypeSearchQuery("");
    setTypeDropdownOpen(false);
    setSubject("");
    setNarrative("");
    // Date & time fall back to the server defaults (never blank)
    const sn = serverNowRef.current;
    if (sn) {
      setActivityDate(sn.dateISO);
      const p = to12HourParts(sn.time24);
      setHourSel(p.hour);
      setMinuteSel(p.minute);
      setAmpmSel(p.ampm);
    } else {
      const todayISO = formatGDDateKey(new Date());
      setActivityDate(todayISO);
      const p = to12HourParts(formatGDTimeDisplay24(new Date()));
      setHourSel(p.hour);
      setMinuteSel(p.minute);
      setAmpmSel(p.ampm);
    }
    setError(null);
    setSuccessMessage(null);
  };

  // Searchable GD Type dropdown (official CCTNS list — user must select first)
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);
  const [typeSearchQuery, setTypeSearchQuery] = useState("");

  const filteredTypes = useMemo(() => {
    const q = typeSearchQuery.trim().toLowerCase();
    if (!q) return types;
    return types.filter(
      (t) => t.nameEn.toLowerCase().includes(q) || t.code.toLowerCase().includes(q)
    );
  }, [types, typeSearchQuery]);

  const selectedTypeLabel = useMemo(
    () => types.find((t) => t.code === selectedType)?.nameEn || "",
    [types, selectedType]
  );

  const handleSelectType = (code: string) => {
    setSelectedType(code);
    setTypeDropdownOpen(false);
    setTypeSearchQuery("");
    setTimeout(() => {
      subjectInputRef.current?.focus();
    }, 50);
  };

  // 24-hour key from the 12-hour picker parts
  const activityTime24 = useMemo(
    () => from12HourParts(hourSel, minuteSel, ampmSel),
    [hourSel, minuteSel, ampmSel]
  );

  const todayISO = useMemo(() => formatGDDateKey(new Date()), []);

  return (
    <div className="p-3 sm:p-6 space-y-5">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/general-diary"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#0b192c] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Smart General Diary</span>
        </Link>
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
              <h2 className="text-lg sm:text-xl font-bold text-white">Add New GD Entry</h2>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2 border-t border-slate-100 items-start">
            {/* 1. Entry for Officer */}
            <div className="space-y-1.5 relative" ref={officerDropdownRef}>
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-600" />
                <span>Entry for – Officer *</span>
              </label>

              <button
                type="button"
                onClick={() => setOfficerDropdownOpen((prev) => !prev)}
                className="w-full flex items-center justify-between px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs sm:text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-[#0b192c] cursor-pointer text-left shadow-2xs"
              >
                <div className="truncate">
                  {currentOfficer.name} ({currentOfficer.rank}{currentOfficer.beltNumber && currentOfficer.beltNumber !== "Station Staff" ? ` - ${currentOfficer.beltNumber}` : ""})
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${officerDropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {/* Custom Dropdown Menu with Ranking Hierarchy & Remove Option */}
              {officerDropdownOpen && (
                <div className="absolute z-40 mt-1 w-full bg-white border border-slate-300 rounded-lg shadow-xl overflow-hidden max-h-72 overflow-y-auto animate-in fade-in-50 zoom-in-95 duration-100">
                  <div className="divide-y divide-slate-100">
                    {sortedOfficers.map((o) => (
                      <div
                        key={o.id}
                        onClick={() => {
                          setSelectedOfficerId(o.id);
                          setIsAddingOfficer(false);
                          setOfficerDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors cursor-pointer group ${
                          o.id === selectedOfficerId
                            ? "bg-blue-50/80 font-bold text-blue-950"
                            : "text-slate-800 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex-1 min-w-0 pr-2">
                          <p className="font-semibold text-slate-900 truncate">{o.name}</p>
                          <p className="text-[11px] text-slate-500 truncate">
                            {o.rank} {o.beltNumber && o.beltNumber !== "Station Staff" ? `• ${o.beltNumber}` : ""}
                          </p>
                        </div>
                        {/* Red cross in circle in small to remove officer */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveOfficer(o.id);
                          }}
                          className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors cursor-pointer shrink-0"
                          title={`Remove ${o.name} from dropdown`}
                        >
                          <XCircle className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Add Officer Option */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingOfficer(true);
                      setOfficerDropdownOpen(false);
                      setNewOfficerInput("");
                    }}
                    className="w-full text-left px-3 py-2.5 bg-slate-50 hover:bg-blue-50 border-t border-slate-200 text-xs font-bold text-blue-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-blue-600" />
                    <span>Add officer</span>
                  </button>
                </div>
              )}

              {/* Add Officer Input with green Save in small font beside it */}
              {isAddingOfficer && (
                <div className="mt-2 p-2.5 bg-slate-50 border border-slate-300 rounded-lg space-y-2 animate-in fade-in-50">
                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                    <input
                      type="text"
                      value={newOfficerInput}
                      onChange={(e) => setNewOfficerInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleSaveNewOfficer();
                        } else if (e.key === "Escape") {
                          handleCancelAddOfficer();
                        }
                      }}
                      placeholder="Enter rank & officer name (e.g. ASI Kuldeep, SI Malkeet)"
                      className="flex-1 min-w-[200px] px-3 py-1.5 bg-white border border-slate-300 rounded-md text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-[#0b192c]"
                      autoFocus
                    />
                    {/* Green Save button in small font */}
                    <button
                      type="button"
                      onClick={handleSaveNewOfficer}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-md flex items-center gap-1 cursor-pointer transition-colors shadow-2xs shrink-0"
                      title="Save and add to dropdown"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Save</span>
                    </button>
                    <VoiceInputButton
                      onTranscript={(text) => setNewOfficerInput((prev) => (prev ? `${prev} ${text}` : text))}
                      fieldLabel="Officer Name"
                      preferredLang="hi-IN"
                      iconOnly={true}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Date & Time of Activity — user-selectable (back-dating allowed) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span>Date &amp; Time of Activity *</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  {/* Hidden native date input for the calendar popup picker */}
                  <input
                    ref={hiddenDateInputRef}
                    type="date"
                    tabIndex={-1}
                    aria-hidden="true"
                    value={activityDate}
                    max={todayISO}
                    onChange={(e) => {
                      setActivityDate(e.target.value);
                    }}
                    className="sr-only"
                  />
                  <div className="relative flex items-center">
                    <button
                      type="button"
                      onClick={() => {
                        try {
                          hiddenDateInputRef.current?.showPicker();
                        } catch {
                          hiddenDateInputRef.current?.focus();
                        }
                      }}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-500 hover:text-blue-600 transition-colors cursor-pointer"
                      title="Open Calendar Picker (DD/MM/YYYY)"
                    >
                      <CalendarDays className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="text"
                      value={activityDateDisplay}
                      onChange={(e) => {
                        const val = e.target.value;
                        setActivityDateDisplay(val);
                        const parts = val.trim().split(/[-/]/);
                        if (parts.length === 3) {
                          const dd = parts[0].padStart(2, "0");
                          const mm = parts[1].padStart(2, "0");
                          const yyyy = parts[2];
                          if (
                            yyyy.length === 4 &&
                            Number(mm) >= 1 &&
                            Number(mm) <= 12 &&
                            Number(dd) >= 1 &&
                            Number(dd) <= 31
                          ) {
                            setActivityDate(`${yyyy}-${mm}-${dd}`);
                          }
                        }
                      }}
                      onBlur={() => {
                        if (activityDate) {
                          setActivityDateDisplay(toDDMMYYYY(activityDate));
                        } else {
                          const today = formatGDDateKey(new Date());
                          setActivityDate(today);
                          setActivityDateDisplay(toDDMMYYYY(today));
                        }
                      }}
                      placeholder="DD/MM/YYYY"
                      className="w-full pl-8 pr-11 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs sm:text-sm font-mono font-bold text-slate-900 focus:ring-2 focus:ring-[#0b192c]"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        try {
                          hiddenDateInputRef.current?.showPicker();
                        } catch {
                          hiddenDateInputRef.current?.focus();
                        }
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                      title="Pick date from calendar"
                    >
                      <Clock className="w-4 h-4 text-blue-600" />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  <select
                    value={hourSel}
                    onChange={(e) => setHourSel(Number(e.target.value))}
                    className="w-full px-1 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-semibold text-slate-900 focus:ring-2 focus:ring-[#0b192c] cursor-pointer"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                      <option key={h} value={h}>
                        {String(h).padStart(2, "0")}
                      </option>
                    ))}
                  </select>
                  <select
                    value={minuteSel}
                    onChange={(e) => setMinuteSel(Number(e.target.value))}
                    className="w-full px-1 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-semibold text-slate-900 focus:ring-2 focus:ring-[#0b192c] cursor-pointer"
                  >
                    {Array.from({ length: 60 }, (_, i) => i).map((m) => (
                      <option key={m} value={m}>
                        {String(m).padStart(2, "0")}
                      </option>
                    ))}
                  </select>
                  <select
                    value={ampmSel}
                    onChange={(e) => setAmpmSel(e.target.value as "AM" | "PM")}
                    className="w-full px-1 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#0b192c] cursor-pointer"
                  >
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* 2. GD Type + 3. Subject — side-by-side in one row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
            {/* GD Type — searchable select (user must choose first) */}
            <div className="space-y-1.5 relative">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                <span>GD Type – Select *</span>
                {!selectedType && (
                  <span className="text-[11px] font-semibold text-amber-700">
                    (select type first)
                  </span>
                )}
              </label>
              <input
                type="text"
                value={typeDropdownOpen ? typeSearchQuery : selectedTypeLabel}
                onChange={(e) => {
                  setTypeSearchQuery(e.target.value);
                  setTypeDropdownOpen(true);
                }}
                onFocus={() => {
                  setTypeDropdownOpen(true);
                  setTypeSearchQuery("");
                }}
                onClick={() => {
                  // Field is already focused after a selection — clicking it
                  // must still reopen the dropdown so a wrong pick can be
                  // corrected easily
                  setTypeDropdownOpen(true);
                  setTypeSearchQuery("");
                }}
                onBlur={() => {
                  window.setTimeout(() => setTypeDropdownOpen(false), 150);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setTypeDropdownOpen(false);
                  } else if (e.key === "Enter") {
                    if (typeDropdownOpen && filteredTypes.length > 0) {
                      e.preventDefault();
                      handleSelectType(filteredTypes[0].code);
                    }
                  } else if (e.key === "Tab" && !e.shiftKey) {
                    if (typeDropdownOpen && filteredTypes.length > 0 && !selectedType) {
                      e.preventDefault();
                      handleSelectType(filteredTypes[0].code);
                    } else {
                      e.preventDefault();
                      subjectInputRef.current?.focus();
                    }
                  }
                }}
                placeholder="Type to search from official CCTNS list…"
                className={`w-full px-3 py-2.5 border rounded-lg text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-[#0b192c] ${
                  selectedType
                    ? "bg-slate-50 border-slate-300 text-slate-900"
                    : "bg-amber-50 border-amber-300 text-slate-600"
                }`}
              />
              {typeDropdownOpen && (
                <div
                  className="absolute z-30 mt-1 w-full max-h-64 overflow-y-auto bg-white border border-slate-300 rounded-lg shadow-lg"
                  onMouseDown={(e) => e.preventDefault()}
                >
                  {filteredTypes.length === 0 ? (
                    <p className="px-3 py-2.5 text-xs text-slate-500">
                      No GD type matches &quot;{typeSearchQuery}&quot;
                    </p>
                  ) : (
                    filteredTypes.map((t) => (
                      <button
                        key={t.code}
                        type="button"
                        onClick={() => handleSelectType(t.code)}
                        className={`w-full text-left px-3 py-2 text-xs transition-colors cursor-pointer ${
                          t.code === selectedType
                            ? "bg-blue-50 font-bold text-blue-900"
                            : "text-slate-800 hover:bg-slate-100"
                        }`}
                      >
                        {t.nameEn}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Subject */}
            <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                <span>Subject *</span>
              </label>
              <VoiceInputButton
                onTranscript={(text) => setSubject((prev) => (prev ? `${prev} ${text}` : text))}
                fieldLabel="GD Subject"
                preferredLang="en-IN"
                iconOnly={true}
              />
            </div>
            <input
              ref={subjectInputRef}
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || (e.key === "Tab" && !e.shiftKey)) {
                  e.preventDefault();
                  if (narrativeTextareaRef.current) {
                    narrativeTextareaRef.current.focus();
                    const len = narrativeTextareaRef.current.value.length;
                    narrativeTextareaRef.current.setSelectionRange(len, len);
                  }
                }
              }}
              placeholder="e.g. Aagaz or Ravangi for Investigation"
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs sm:text-sm font-bold text-slate-950 focus:ring-2 focus:ring-[#0b192c]"
            />
            </div>
          </div>

          {/* 4. GD Brief (Narrative) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
                <span>GD Brief (Description) *</span>
              </label>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400 hidden md:inline">
                  You can freely edit, speak or upload documents
                </span>

                {/* Hidden Multi-file input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUploadAndAutofill}
                  multiple
                  accept="image/*,application/pdf,.doc,.docx,.txt"
                  className="hidden"
                />

                {/* Upload and autofill Button (Left side of VoiceInputButton) */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isExtracting}
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-900 text-xs font-bold gap-1.5 h-8 px-2.5 transition-all shadow-2xs"
                  title="Upload multiple documents/images to auto-extract text into GD Brief description"
                >
                  {isExtracting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                      <span>Extracting…</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Upload and autofill</span>
                    </>
                  )}
                </Button>

                {/* Voice Input Button */}
                <VoiceInputButton
                  onTranscript={(text) => setNarrative((prev) => (prev ? `${prev} ${text}` : text))}
                  fieldLabel="GD Brief"
                  preferredLang="en-IN"
                />
              </div>
            </div>

            {/* Uploaded Documents List */}
            {attachments.length > 0 && (
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-600 font-semibold">
                  <span className="flex items-center gap-1">
                    <Paperclip className="w-3 h-3 text-indigo-600" />
                    <span>Uploaded Documents ({attachments.length}):</span>
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Will be saved with this GD entry
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {attachments.map((doc) => {
                    const isImg = doc.type.startsWith("image/");
                    return (
                      <div
                        key={doc.id}
                        className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-md px-2 py-1 text-xs shadow-2xs group"
                      >
                        {isImg ? (
                          <ImageIcon className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        ) : (
                          <FileText className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        )}
                        <span
                          className="max-w-[130px] sm:max-w-[180px] truncate font-medium text-slate-800 text-[11px]"
                          title={doc.name}
                        >
                          {doc.name}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          ({(doc.size / 1024).toFixed(0)} KB)
                        </span>
                        {doc.dataUrl && (
                          <button
                            type="button"
                            onClick={() => setPreviewDoc(doc)}
                            className="text-blue-600 hover:text-blue-800 p-0.5 rounded cursor-pointer"
                            title="Preview Document"
                          >
                            <Eye className="w-3 h-3" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveAttachment(doc.id)}
                          className="text-red-500 hover:text-red-700 p-0.5 rounded cursor-pointer"
                          title="Delete Document"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <textarea
              ref={narrativeTextareaRef}
              rows={5}
              value={narrative}
              onChange={(e) => {
                setNarrative(e.target.value);
                const el = e.currentTarget;
                el.style.height = "auto";
                el.style.height = `${Math.max(130, el.scrollHeight + 4)}px`;
              }}
              placeholder="Enter brief description of the police station activity..."
              className="w-full px-3.5 py-3 bg-slate-50 border border-slate-300 rounded-lg text-xs sm:text-sm leading-relaxed text-slate-900 focus:ring-2 focus:ring-[#0b192c] font-sans resize-none overflow-hidden transition-[height] duration-75 min-h-[130px]"
              style={{ minHeight: "130px" }}
            />
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

      {/* Document Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-[#0b192c] text-white">
              <div className="flex items-center gap-2 truncate">
                <Paperclip className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="font-bold text-sm truncate">{previewDoc.name}</span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="text-slate-300 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-auto flex-1 flex items-center justify-center bg-slate-100">
              {previewDoc.type.startsWith("image/") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewDoc.dataUrl}
                  alt={previewDoc.name}
                  className="max-h-[65vh] max-w-full object-contain rounded shadow"
                />
              ) : previewDoc.type === "application/pdf" ? (
                <iframe
                  src={previewDoc.dataUrl}
                  title={previewDoc.name}
                  className="w-full h-[65vh] rounded border border-slate-300"
                />
              ) : (
                <div className="text-center p-6 space-y-3">
                  <FileText className="w-12 h-12 text-slate-400 mx-auto" />
                  <p className="text-xs text-slate-600 font-medium">
                    Preview not available directly for this file format.
                  </p>
                  {previewDoc.dataUrl && (
                    <a
                      href={previewDoc.dataUrl}
                      download={previewDoc.name}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-md text-xs font-semibold hover:bg-blue-700"
                    >
                      <FileDown className="w-4 h-4" />
                      <span>Download File</span>
                    </a>
                  )}
                </div>
              )}
            </div>
            <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500">
              <span>Size: {(previewDoc.size / 1024).toFixed(1)} KB</span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setPreviewDoc(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
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
