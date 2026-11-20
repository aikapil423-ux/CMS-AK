"use client";

import React, { useState, useEffect, useEffectEvent, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useGuardedRouter as useRouter } from "@/hooks/useGuardedRouter";
import {
  Printer,
  Copy,
  Check,
  Download,
  ScrollText,
  Plus,
  Trash2,
  RotateCcw,
  Save,
  ArrowUpDown,
  Eye,
  EyeOff,
  Layers,
  Sparkles,
  FileText,
  CheckCircle2,
  Calendar,
  Clock,
  User,
  Shield,
  ShieldCheck,
  Loader2,
  ArrowRight,
  ExternalLink,
  CheckCircle,
  Globe,
  Languages,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { persistentFirService as firService } from "@/services/persistentFirService";
import { FIRItem, FIRCaseDiaryItem } from "@/types";
import { FIRWorkspaceNav } from "@/components/fir-workspace/FIRWorkspaceNav";
import { VoiceInputButton } from "@/components/ui/voice-input-button";
import { AutoSuggestField } from "@/components/ui/auto-suggest-field";
import { formatDate } from "@/lib/utils";
import { printA4Element, downloadA4DocumentAsHtml, getA4DocumentHtml, getZimniPagedHtml } from "@/utils/printElement";
import { universalEvidenceService } from "@/services/universalEvidenceService";
import { evidenceBlobStore } from "@/services/evidenceBlobStore";
import { useLanguage } from "@/context/LanguageContext";

export type TemplateLanguage = "hi" | "en";

interface HeaderLine {
  id: string;
  text: string;
}

interface ZimniEntryRow {
  id: string;
  dateTime: string;
  narration: string;
  hasBottomBorder?: boolean;
}

interface AdditionalSignature {
  id: string;
  title: string;
  officerNameRank: string;
  post: string;
  date: string;
}

interface VerticalBordersConfig {
  outerLeft: boolean;
  col1ToCol2: boolean;
  col2ToCol3: boolean;
  outerRight: boolean;
}

interface HorizontalBordersConfig {
  outerTop: boolean;
  headerBottom: boolean;
  caseHeadingBottom: boolean;
  closingTop: boolean;
  outerBottom: boolean;
}

interface ZimniProformaData {
  formNumberText: string;
  reportTitleText: string;
  showHeader: boolean;
  borderStyle: "box" | "thin" | "none";
  borderWidth: "1px" | "2px" | "3px";
  verticalBorders: VerticalBordersConfig;
  horizontalBorders: HorizontalBordersConfig;
  leftHeaderLines: HeaderLine[];
  rightHeaderLines: HeaderLine[];
  col1Title: string;
  col2Title: string;
  col3Title: string;
  showCaseHeading: boolean;
  stateLine: string;
  accusedLine: string;
  ioLine: string;
  salutation: string;
  entries: ZimniEntryRow[];
  closingText: string;
  officerNameRank: string;
  officerPost: string;
  signDate: string;
  hasSignatureGraphic: boolean;
  additionalSignatures: AdditionalSignature[];
}

const ZIMNI_LABELS = {
  hi: {
    formNumberText: "पुलिस फार्म संख्या 25.54 (1) भाग (1)",
    reportTitleText: "रिपोर्ट जिमनी",
    col1Title: "तिथि व समय",
    col2Title: "क्रं. स.",
    col3Title: "अनुसंधान का विवरण",
    salutation: "श्रीमान जी,",
  },
  en: {
    formNumberText: "Police Form No. 25.54 (1) Part (1)",
    reportTitleText: "Case Diary (Zimni)",
    col1Title: "Date & Time",
    col2Title: "Sr. No.",
    col3Title: "Record of Investigation / Proceedings",
    salutation: "Respected Sir,",
  },
};

function blankZimni(language: TemplateLanguage): ZimniProformaData {
  return {
    ...ZIMNI_LABELS[language],
    showHeader: true,
    borderStyle: "box",
    borderWidth: "2px",
    verticalBorders: { outerLeft: true, col1ToCol2: true, col2ToCol3: true, outerRight: true },
    horizontalBorders: { outerTop: true, headerBottom: true, caseHeadingBottom: false, closingTop: true, outerBottom: true },
    leftHeaderLines: [],
    rightHeaderLines: [],
    showCaseHeading: true,
    stateLine: "",
    accusedLine: "",
    ioLine: "",
    entries: [],
    closingText: "",
    officerNameRank: "",
    officerPost: "",
    signDate: "",
    hasSignatureGraphic: false,
    additionalSignatures: [],
  };
}

const ZIMNI_HINDI_TERMS: Record<string, string> = {
  "bharatiya nagarik suraksha sanhita": "भारतीय नागरिक सुरक्षा संहिता",
  "bharatiya nyaya sanhita": "भारतीय न्याय संहिता",
  "bharatiya sakshya adhiniyam": "भारतीय साक्ष्य अधिनियम",
  "indian penal code": "भारतीय दंड संहिता",
  "assistant sub-inspector": "सहायक उप-निरीक्षक",
  "sub-inspector": "उप-निरीक्षक",
  "asi": "सहायक उप-निरीक्षक",
  "si": "उप-निरीक्षक",
  "inspector": "निरीक्षक",
  "bnss": "बीएनएसएस",
  "bns": "बीएनएस",
  "ipc": "आईपीसी",
  "bsa": "बीएसए",
  "section": "धारा",
  "sections": "धाराएँ",
  "panipat": "पानीपत",
  "haryana": "हरियाणा",
  "india": "भारत",
  "city": "शहर",
  "sadar": "सदर",
  "sector": "सेक्टर",
  "samalkha": "समालखा",
  "vikram singh": "विक्रम सिंह",
};
const ZIMNI_HINDI_PATTERN = new RegExp(`\\b(?:${Object.keys(ZIMNI_HINDI_TERMS).join("|")})\\b`, "gi");

function localizeZimniHindi(text: string) {
  return text.replace(ZIMNI_HINDI_PATTERN, (term) => ZIMNI_HINDI_TERMS[term.toLowerCase()]);
}

function buildZimniFirFields(fir: FIRItem, language: TemplateLanguage) {
  const isEn = language === "en";
  const localize = (value: string) => isEn ? value : localizeZimniHindi(value);
  const heading = (english: string, hindi: string, value?: string) =>
    value?.trim() ? `${isEn ? english : hindi}: ${value.trim()}` : "";
  const station = fir.policeStation?.replace(/^(?:थाना\s*|(?:Police Station|P\.?S\.?)\s+)/i, "").trim();
  const firReference = [fir.firNumber, fir.firDate ? formatDate(fir.firDate) : ""].filter(Boolean).join(isEn ? " dated " : " दिनांक ");
  const occurrenceDates = [fir.incidentDateFrom, fir.incidentDateTo].flatMap((date) => date ? [formatDate(date)] : []);
  const complainant = [fir.complainantName, fir.complainantFatherSpouse, fir.complainantAddress].filter(Boolean).join(", ");
  const accused = fir.accusedList?.filter((person) => person.name?.trim()).map((person) =>
    [person.name, person.fatherName, person.address].filter(Boolean).join(", ")).join("; ");
  const rank = localize(fir.assignedIoRank || "");
  let officerName = localize(fir.assignedIoName || "");
  if (rank && officerName.toLowerCase().startsWith(rank.toLowerCase() + " ")) {
    officerName = officerName.slice(rank.length).trimStart();
  }
  const officer = [rank, officerName, fir.assignedIoBeltNumber].filter(Boolean).join(" ");
  const headers = (lines: string[]) => lines.filter(Boolean).map((text, index) => ({ id: `fir_header_${index}`, text }));
  return {
    leftHeaderLines: headers([
      heading("Police Station", "थाना", localize((station) || "")),
      heading("FIR No.", "मु०नं०", firReference),
      heading("Place of Occurrence", "घटना स्थल", localize((fir.incidentPlace || fir.incidentLandmark) || "")),
      heading("Date of Occurrence", "घटना तिथि", occurrenceDates.join(isEn ? " to " : " से ")),
      heading("Offence", "अपराध", localize((fir.actsAndSections) || "")),
    ]),
    rightHeaderLines: headers([
      heading("District", "जिला", localize((fir.district) || "")),
      heading("Zimni No.", "जिमनी न०", String((fir.caseDiaries?.length ?? 0) + 1)),
    ]),
    stateLine: heading("State through", "राज्य द्वारा", localize((complainant) || "")),
    accusedLine: heading("Versus", "बनाम", localize((accused) || "")),
    ioLine: heading("Investigating Officer", "अनुसन्धानकर्ता", officer),
    officerNameRank: officer,
    officerPost: localize(station || ""),
  };
}

function ZimniWorkspaceContent() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const { language: globalLang } = useLanguage();
  const searchParams = useSearchParams();
  const urlFirId = searchParams.get("firId");

  const [firs, setFirs] = useState<FIRItem[]>([]);
  const [selectedFirId, setSelectedFirId] = useState<string>("");
  const [templateLang, setTemplateLang] = useState<TemplateLanguage>(globalLang || "hi");
  const templateLanguageRef = useRef(templateLang);
  const generatedFirFields = useRef<ReturnType<typeof buildZimniFirFields> | null>(null);
  const [data, setData] = useState<ZimniProformaData>(() => blankZimni(globalLang || "hi"));
  const [copied, setCopied] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState<"compact" | "normal" | "large">("normal");
  const [a4Preview, setA4Preview] = useState<string | null>(null);
  const fillRequest = useRef(0);
  const manualEntrySequence = useRef(0);
  const [isFilling, setIsFilling] = useState(false);
  const [isSavingToFir, setIsSavingToFir] = useState(false);
  const [savedSuccessModal, setSavedSuccessModal] = useState<{
    open: boolean;
    firNumber: string;
    firId: string;
    zimniNumber: number;
    fileName: string;
  } | null>(null);
  const [showAdvancedBorders, setShowAdvancedBorders] = useState(false);

  // Sync with global top bar language switcher
  useEffect(() => {
    if (globalLang && globalLang !== templateLang) {
      handleToggleLanguage(globalLang);
    }
  }, [globalLang]);

  useEffect(() => {
    const refreshFirs = () => setFirs(firService.getAllFirs());
    refreshFirs();
    return firService.subscribe(refreshFirs);
  }, []);

  useEffect(() => {
    setSelectedFirId(urlFirId || "");
  }, [urlFirId]);

  const activeFir = firs.find((fir) => fir.id === selectedFirId);
  const activeFirId = activeFir?.id;

  const handleToggleLanguage = (lang: TemplateLanguage) => {
    if (lang === templateLang) return;
    templateLanguageRef.current = lang;
    setTemplateLang(lang);
    const generated = generatedFirFields.current;
    const translated = activeFir && generated ? buildZimniFirFields(activeFir, lang) : null;
    generatedFirFields.current = translated;
    setData((previous) => {
      const next = { ...previous, ...ZIMNI_LABELS[lang] };
      if (!generated || !translated) return next;
      for (const key of ["stateLine", "accusedLine", "ioLine", "officerNameRank", "officerPost"] as const) {
        if (previous[key] === generated[key]) next[key] = translated[key];
      }
      for (const key of ["leftHeaderLines", "rightHeaderLines"] as const) {
        next[key] = previous[key].map((line) => {
          const original = generated[key].find((header) => header.id === line.id);
          const replacement = translated[key].find((header) => header.id === line.id);
          return original?.text === line.text && replacement ? replacement : line;
        });
      }
      return next;
    });
  };

  const handleAutoFillFromFir = async () => {
    if (!activeFir) return;
    const fir = activeFir;
    const request = ++fillRequest.current;
    setIsFilling(true);
    setSaveStatus(null);
    const records = await universalEvidenceService.syncFromServer(fir.id);
    if (request !== fillRequest.current) return;
    const savedZimniIds = new Set(fir.caseDiaries?.filter((diary) => diary.isUploaded === false).map((diary) => diary.id));
    const entries: ZimniEntryRow[] = [];
    const seen = new Set<string>();
    for (const record of records) {
      if (record.module !== "FIR" || record.caseId !== fir.id || record.processingStatus !== "COMPLETED" || savedZimniIds.has(record.fileId)) continue;
      const structured = record.structuredData;
      const rows = (structured?.investigation?.events ?? []).map((event) => ({
        dateTime: [event.date, event.time].filter(Boolean).join("\n"),
        narration: event.source?.verbatimQuote?.trim() || event.title?.trim() || "",
      })).filter((row) => row.narration);
      if (!rows.length) {
        const incident = structured?.incident;
        const narration = incident?.details?.trim() || record.extractedText?.trim() || incident?.summary?.trim();
        if (narration) rows.push({ dateTime: [incident?.date, incident?.time].filter(Boolean).join("\n"), narration });
      }
      for (const row of rows) {
        const key = `${row.dateTime}|${row.narration.replace(/\s+/g, " ")}`;
        if (seen.has(key)) continue;
        seen.add(key);
        entries.push({ ...row, id: `processed_${entries.length}` });
      }
    }

    const language = templateLanguageRef.current;
    const isEn = language === "en";
    const fields = buildZimniFirFields(fir, language);
    generatedFirFields.current = fields;
    setData((previous) => ({ ...previous, ...fields, entries }));
    setIsFilling(false);
    setSaveStatus(entries.length
      ? (isEn ? "Processed FIR entries loaded" : "प्रोसेस किए गए FIR विवरण भर दिए गए")
      : (isEn ? "No processed proceedings found for this FIR" : "इस FIR के लिए प्रोसेस की गई कार्यवाही उपलब्ध नहीं है"));
  };

  const fillSelectedFir = useEffectEvent(() => {
    ++fillRequest.current;
    setIsFilling(false);
    setSaveStatus(null);
    generatedFirFields.current = null;
    setData(blankZimni(templateLang));
    if (activeFir) void handleAutoFillFromFir();
  });

  useEffect(() => {
    fillSelectedFir();
    return () => { ++fillRequest.current; };
  }, [activeFirId, selectedFirId]);

  // Reset to a blank proforma
  const handleResetTemplate = () => {
    ++fillRequest.current;
    setIsFilling(false);
    generatedFirFields.current = null;
    setData(blankZimni(templateLang));
    setSaveStatus(templateLang === "en" ? "Template cleared" : "प्रारूप खाली कर दिया गया");
    setTimeout(() => setSaveStatus(null), 3000);
  };

  // Save directly to selected FIR Case Diaries (Zimni) Tab & Index in Database
  const handleSaveToFir = async () => {
    if (!activeFir) {
      alert("कृपया पहले सक्रिय एफ.आई.आर. (Active FIR) का चयन करें!");
      return;
    }

    setIsSavingToFir(true);
    try {
      // 1. Generate standalone self-contained A4 HTML matching exact visual proforma
      const docTitle = `Zimni Case Diary - ${activeFir.firNumber}`;
      const htmlContent = getA4DocumentHtml("zimni-printable-canvas", docTitle);
      const dataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`;

      // 2. Extract Zimni number from right header line (e.g. 'जिमनी न० 17') or fallback
      let zimniNum = (activeFir.caseDiaries?.length || 0) + 1;
      const rhZimni = data.rightHeaderLines.find(
        (l) => l.text.includes("जिमनी न") || l.text.toLowerCase().includes("zimni")
      );
      if (rhZimni) {
        const match = rhZimni.text.match(/\d+/);
        if (match) zimniNum = parseInt(match[0], 10);
      }

      const caseDiaryId = `cd_${Date.now()}`;
      const safeFirNum = activeFir.firNumber.replace(/[\/\s]/g, "_");
      const fileName = `Zimni_No_${zimniNum}_${safeFirNum}.html`;

      // 3. Persist HTML in browser IndexedDB binary store for multi-MB stability & instant offline preview
      if (typeof window !== "undefined") {
        await evidenceBlobStore.put(caseDiaryId, dataUrl, { fileName });
        await evidenceBlobStore.put(`${activeFir.id}_${fileName}`, dataUrl, { fileName });
        await evidenceBlobStore.put(fileName, dataUrl, { fileName });
      }

      // 4. Create FIRCaseDiaryItem
      const summaryText =
        data.entries[0]?.narration
          ? `Zimni No. ${zimniNum}: ${data.entries[0].narration.slice(0, 80)}...`
          : `Zimni No. ${zimniNum}: Case Diary Entry Recorded`;

      const fullDetails = data.entries
        .map((e, index) => `[${index + 1}.] ${e.dateTime ? `${e.dateTime}: ` : ""}${e.narration}`)
        .join("\n\n");

      const caseDiaryItem: FIRCaseDiaryItem = {
        id: caseDiaryId,
        firId: activeFir.id,
        zimniNumber: zimniNum,
        date: data.signDate.replace(/^[^\d]*/, "") || new Date().toISOString().split("T")[0],
        time: new Date().toTimeString().slice(0, 5),
        officer: data.officerNameRank || activeFir.assignedIoName || currentUser?.name || "Investigating Officer",
        officerRole: "INVESTIGATING_OFFICER",
        summary: summaryText,
        details: fullDetails,
        contentHtml: htmlContent,
        dataUrl: dataUrl,
        fileName: fileName,
        fileUrl: dataUrl,
        fileSize: `${(new Blob([htmlContent]).size / 1024).toFixed(1)} KB`,
        proformaData: { ...data, entries: data.entries.map((entry, index) => ({ ...entry, srNo: `${index + 1}.` })) },
        isUploaded: false,
        uploadedAt: new Date().toISOString(),
        createdBy: currentUser?.name || "Investigating Officer",
      };

      // 5. Save directly into FIR record
      const updatedFir = await firService.addCaseDiary(activeFir.id, caseDiaryItem);
      if (updatedFir) {
        setFirs((prev) => prev.map((f) => (f.id === updatedFir.id ? updatedFir : f)));
      }

      // 6. Process & store into Universal Evidence persistent database (Process Once, Remember Everything)
      try {
        await universalEvidenceService.registerAndProcess({
          fileId: caseDiaryId,
          fileName: fileName,
          dataUrl: dataUrl,
          text: `${data.stateLine}\n${data.accusedLine}\n${data.ioLine}\n\n${fullDetails}`,
          caseId: activeFir.id,
          caseNumber: activeFir.firNumber,
          module: "FIR",
          uploadedBy: currentUser?.name || "IO",
        });
      } catch (evErr) {
        console.warn("Evidence persistent registration warning:", evErr);
      }

      setSaveStatus(`Zimni No. ${zimniNum} saved to FIR ${activeFir.firNumber}!`);
      setTimeout(() => setSaveStatus(null), 4000);

      setSavedSuccessModal({
        open: true,
        firNumber: activeFir.firNumber,
        firId: activeFir.id,
        zimniNumber: zimniNum,
        fileName: fileName,
      });
    } catch (err: any) {
      console.error("Save to FIR failed:", err);
      alert("Error saving Zimni to FIR: " + (err.message || "Unknown error"));
    } finally {
      setIsSavingToFir(false);
    }
  };

  // Save to LocalStorage
  const handleSaveDraft = () => {
    try {
      const key = `zimni_draft_${selectedFirId || "general"}`;
      localStorage.setItem(key, JSON.stringify(data));
      setSaveStatus("Draft Saved Successfully!");
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (e) {
      console.error(e);
      setSaveStatus("Error saving draft.");
    }
  };

  // Print
  const handlePrint = () => {
    printA4Element("zimni-printable-canvas", `Zimni_${selectedFirId || "Draft"}`);
  };

  // Download
  const handleDownload = () => {
    downloadA4DocumentAsHtml(
      "zimni-printable-canvas",
      `Zimni_${selectedFirId || "Draft"}`,
      `Zimni Case Diary - ${selectedFirId || "Draft"}`
    );
  };

  // Copy Plain Text
  const handleCopy = () => {
    const el = document.getElementById("zimni-printable-canvas");
    if (el) {
      navigator.clipboard.writeText(el.innerText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Header Lines Manipulation
  const handleUpdateLeftHeader = (id: string, text: string) => {
    setData((prev) => ({
      ...prev,
      leftHeaderLines: prev.leftHeaderLines.map((l) => (l.id === id ? { ...l, text } : l)),
    }));
  };

  const handleAddLeftHeader = () => {
    setData((prev) => ({
      ...prev,
      leftHeaderLines: [...prev.leftHeaderLines, { id: `lh_${Date.now()}`, text: "नया विवरण..." }],
    }));
  };

  const handleDeleteLeftHeader = (id: string) => {
    setData((prev) => ({
      ...prev,
      leftHeaderLines: prev.leftHeaderLines.filter((l) => l.id !== id),
    }));
  };

  const handleUpdateRightHeader = (id: string, text: string) => {
    setData((prev) => ({
      ...prev,
      rightHeaderLines: prev.rightHeaderLines.map((l) => (l.id === id ? { ...l, text } : l)),
    }));
  };

  const handleAddRightHeader = () => {
    setData((prev) => ({
      ...prev,
      rightHeaderLines: [...prev.rightHeaderLines, { id: `rh_${Date.now()}`, text: "नया विवरण..." }],
    }));
  };

  const handleDeleteRightHeader = (id: string) => {
    setData((prev) => ({
      ...prev,
      rightHeaderLines: prev.rightHeaderLines.filter((l) => l.id !== id),
    }));
  };

  // Entries / Rows Manipulation
  const handleUpdateEntry = (id: string, field: keyof ZimniEntryRow, val: string) => {
    setData((prev) => ({
      ...prev,
      entries: prev.entries.map((entry) => (entry.id === id ? { ...entry, [field]: val } : entry)),
    }));
  };

  const handleAddEntryRow = (afterIndex?: number) => {
    const newEntry: ZimniEntryRow = { id: `manual_${++manualEntrySequence.current}`, dateTime: "", narration: "" };
    setData((previous) => ({
      ...previous,
      entries: afterIndex === undefined
        ? [...previous.entries, newEntry]
        : [...previous.entries.slice(0, afterIndex + 1), newEntry, ...previous.entries.slice(afterIndex + 1)],
    }));
  };

  const handleDeleteEntryRow = (id: string) => {
    setData((previous) => ({
      ...previous,
      entries: previous.entries.filter((entry) => entry.id !== id),
    }));
  };

  // Additional Signatures
  const handleAddSignatureBlock = () => {
    setData((prev) => ({
      ...prev,
      additionalSignatures: [
        ...prev.additionalSignatures,
        {
          id: `sign_${Date.now()}`,
          title: "पर्यवेक्षण अधिकारी / थाना प्रबंधक",
          officerNameRank: "निरीक्षक प्रबंधक अफसर",
          post: data.officerPost,
          date: data.signDate,
        },
      ],
    }));
  };

  const handleDeleteSignatureBlock = (id: string) => {
    setData((prev) => ({
      ...prev,
      additionalSignatures: prev.additionalSignatures.filter((s) => s.id !== id),
    }));
  };

  // Border Manipulation Handlers
  const handleToggleRowBottomBorder = (rowId: string) => {
    setData((prev) => ({
      ...prev,
      entries: prev.entries.map((e) =>
        e.id === rowId ? { ...e, hasBottomBorder: !e.hasBottomBorder } : e
      ),
    }));
  };

  const handleAddAllHorizontalBorders = () => {
    setData((prev) => ({
      ...prev,
      entries: prev.entries.map((e) => ({ ...e, hasBottomBorder: true })),
    }));
  };

  const handleRemoveAllHorizontalBorders = () => {
    setData((prev) => ({
      ...prev,
      entries: prev.entries.map((e) => ({ ...e, hasBottomBorder: false })),
    }));
  };

  const handleToggleVerticalBorder = (key: keyof VerticalBordersConfig) => {
    setData((prev) => ({
      ...prev,
      verticalBorders: {
        ...prev.verticalBorders,
        [key]: !prev.verticalBorders[key],
      },
    }));
  };

  const handleToggleHorizontalBorder = (key: keyof HorizontalBordersConfig) => {
    setData((prev) => ({
      ...prev,
      horizontalBorders: {
        ...prev.horizontalBorders,
        [key]: !prev.horizontalBorders[key],
      },
    }));
  };

  const handleSetBorderWidth = (w: "1px" | "2px" | "3px") => {
    setData((prev) => ({
      ...prev,
      borderWidth: w,
    }));
  };

  const applyPreset = (preset: "original" | "full_grid" | "none") => {
    if (preset === "original") {
      setData((prev) => ({
        ...prev,
        borderStyle: "box",
        borderWidth: "2px",
        verticalBorders: {
          outerLeft: true,
          col1ToCol2: true,
          col2ToCol3: true,
          outerRight: true,
        },
        horizontalBorders: {
          outerTop: true,
          headerBottom: true,
          caseHeadingBottom: false,
          closingTop: true,
          outerBottom: true,
        },
        entries: prev.entries.map((e) => ({ ...e, hasBottomBorder: false })),
      }));
    } else if (preset === "full_grid") {
      setData((prev) => ({
        ...prev,
        borderStyle: "box",
        borderWidth: "2px",
        verticalBorders: {
          outerLeft: true,
          col1ToCol2: true,
          col2ToCol3: true,
          outerRight: true,
        },
        horizontalBorders: {
          outerTop: true,
          headerBottom: true,
          caseHeadingBottom: true,
          closingTop: true,
          outerBottom: true,
        },
        entries: prev.entries.map((e) => ({ ...e, hasBottomBorder: true })),
      }));
    } else if (preset === "none") {
      setData((prev) => ({
        ...prev,
        borderStyle: "none",
        verticalBorders: {
          outerLeft: false,
          col1ToCol2: false,
          col2ToCol3: false,
          outerRight: false,
        },
        horizontalBorders: {
          outerTop: false,
          headerBottom: false,
          caseHeadingBottom: false,
          closingTop: false,
          outerBottom: false,
        },
        entries: prev.entries.map((e) => ({ ...e, hasBottomBorder: false })),
      }));
    }
  };

  const bw = data.borderWidth || "2px";
  const borderCol = "#0f172a";

  const tableContainerStyle: React.CSSProperties = {
    borderTop: data.horizontalBorders?.outerTop ? `${bw} solid ${borderCol}` : "none",
    borderBottom: data.horizontalBorders?.outerBottom ? `${bw} solid ${borderCol}` : "none",
    borderLeft: data.verticalBorders?.outerLeft ? `${bw} solid ${borderCol}` : "none",
    borderRight: data.verticalBorders?.outerRight ? `${bw} solid ${borderCol}` : "none",
  };

  const col1DividerStyle: React.CSSProperties = {
    borderRight: data.verticalBorders?.col1ToCol2 ? `${bw} solid ${borderCol}` : "none",
  };

  const col2DividerStyle: React.CSSProperties = {
    borderRight: data.verticalBorders?.col2ToCol3 ? `${bw} solid ${borderCol}` : "none",
  };

  const headerBottomStyle: React.CSSProperties = {
    borderBottom: data.horizontalBorders?.headerBottom ? `${bw} solid ${borderCol}` : "none",
  };

  const caseHeadingBottomStyle: React.CSSProperties = {
    borderBottom: data.horizontalBorders?.caseHeadingBottom ? `${bw} solid ${borderCol}` : "none",
  };

  return (
    <div className="space-y-4 pb-20 animate-in fade-in-50">
      {/* Navigation across IO Workspace */}
      <FIRWorkspaceNav firId={selectedFirId} />

      {/* Minimalist Top Bar & Document Controls */}
      <div className="no-print bg-white border border-slate-200/90 rounded-xl p-3 shadow-2xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Left: Case Diary Title + FIR Selector */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-700 flex items-center justify-center font-bold shrink-0">
                <ScrollText className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-sm font-bold text-slate-900 leading-tight">
                    {templateLang === "en" ? "Case Diary (Zimni)" : "केस डायरी (रिपोर्ट जिमनी)"}
                  </h1>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                    Form 25.54(1)
                  </span>
                </div>

              </div>
            </div>

            <div className="h-4 w-px bg-slate-200 hidden sm:block" />

            {/* Active FIR Selector Pill */}
            <label className="flex h-7 w-40 items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 sm:w-56">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">FIR:</span>
              <select
                value={selectedFirId}
                onChange={(e) => setSelectedFirId(e.target.value)}
                className="h-full min-h-0! min-w-0 flex-1 cursor-pointer truncate border-0! bg-transparent! text-xs! font-bold text-slate-900"
              >
                <option value="">{firs.length ? (templateLang === "hi" ? "-- सक्रिय अभियोग (FIR) चुनें --" : "-- Select Active FIR Case --") : (templateLang === "hi" ? "कोई FIR उपलब्ध नहीं" : "No FIR available")}</option>
                {firs.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.firNumber} — {f.complainantName || "Complaint"}
                  </option>
                ))}
              </select>
            </label>

            {/* Auto-Fill Button */}
            <button
              type="button"
              onClick={() => void handleAutoFillFromFir()}
              disabled={!activeFir || isFilling}
              className="flex h-7 items-center gap-1 px-2.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer"
              title="Auto-fill details from selected FIR"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isFilling ? "Loading…" : "Auto-Fill"}</span>
            </button>
          </div>

          {/* Right: Actions, Language & Controls */}
          <div className="flex items-center gap-2 flex-wrap justify-start lg:justify-end">
            {saveStatus && (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg animate-in fade-in">
                {saveStatus}
              </span>
            )}

            {/* Language Pill */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-bold">
              <button
                type="button"
                onClick={() => handleToggleLanguage("hi")}
                className={`px-2 py-0.5 rounded transition-all ${
                  templateLang === "hi"
                    ? "bg-white text-slate-900 shadow-2xs font-black"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                हिन्दी
              </button>
              <button
                type="button"
                onClick={() => handleToggleLanguage("en")}
                className={`px-2 py-0.5 rounded transition-all ${
                  templateLang === "en"
                    ? "bg-white text-slate-900 shadow-2xs font-black"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                EN
              </button>
            </div>

            {/* Customize Borders & Layout Toggle */}
            <button
              type="button"
              onClick={() => setShowAdvancedBorders((p) => !p)}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                showAdvancedBorders
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
              }`}
              title="Toggle border rules, thickness and proforma options"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Format & Borders</span>
              {showAdvancedBorders ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {/* Secondary Tools */}
            <div className="flex items-center gap-1 border-l border-slate-200 pl-2">
              <button
                type="button"
                onClick={handleCopy}
                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                title={copied ? "Copied" : "Copy Plain Text"}
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-600" />}
              </button>
            </div>

            {/* Print / PDF Button */}
            <Button size="sm" variant="outline" onClick={() => {
              const canvas = document.getElementById("zimni-printable-canvas");
              if (canvas) setA4Preview(getZimniPagedHtml(canvas));
            }}>
              <Eye className="w-3.5 h-3.5 mr-1" /> A4 Pages
            </Button>
            <Button
              size="sm"
              onClick={handlePrint}
              variant="outline"
              className="border-slate-300 text-slate-800 font-bold text-xs gap-1.5 h-7.5 px-3"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </Button>

            {/* Save to FIR Button */}
            <Button
              size="sm"
              onClick={handleSaveToFir}
              disabled={isSavingToFir || isFilling}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 h-7.5 px-3 shadow-2xs"
            >
              {isSavingToFir ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Save to FIR</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Collapsible Format & Borders Drawer */}
        {showAdvancedBorders && (
          <div className="pt-3 border-t border-slate-200/80 space-y-3 bg-slate-50/70 p-3 rounded-lg animate-in fade-in duration-200 text-xs">
            {/* Row 1: Presets, Thickness, Font Size, Reset */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Presets:</span>
                <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => applyPreset("original")}
                    className={`px-2 py-1 rounded text-xs font-bold transition-all ${
                      data.borderStyle === "box" && !data.entries.some((e) => e.hasBottomBorder)
                        ? "bg-amber-100 text-amber-900 font-black shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    ★ Photo Sample
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset("full_grid")}
                    className="px-2 py-1 rounded text-xs font-bold text-slate-600 hover:text-slate-900"
                  >
                    ▦ Full Grid
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset("none")}
                    className="px-2 py-1 rounded text-xs font-bold text-slate-600 hover:text-slate-900"
                  >
                    None
                  </button>
                </div>

                <div className="h-4 w-px bg-slate-300 mx-1" />

                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Thickness:</span>
                <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200">
                  {(["1px", "2px", "3px"] as const).map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => handleSetBorderWidth(w)}
                      className={`px-2 py-0.5 rounded text-xs font-bold transition-all ${
                        (data.borderWidth || "2px") === w
                          ? "bg-slate-900 text-white"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      {w}
                    </button>
                  ))}
                </div>

                <div className="h-4 w-px bg-slate-300 mx-1" />

                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Text Size:</span>
                <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200">
                  {(["compact", "normal", "large"] as const).map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setFontSize(sz)}
                      className={`px-2 py-0.5 rounded text-xs font-bold transition-all ${
                        fontSize === sz ? "bg-amber-600 text-white" : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      {sz === "compact" ? "Small" : sz === "normal" ? "Medium" : "Large"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reset Template Button */}
              <button
                type="button"
                onClick={handleResetTemplate}
                className="flex items-center gap-1 text-[11px] font-bold text-slate-600 hover:text-amber-800 transition-colors"
                title="Clear the template"
              >
                <RotateCcw className="w-3 h-3 text-amber-700" />
                <span>Clear Template</span>
              </button>
            </div>

            {/* Row 2: Visibility & Granular Border Toggles */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
              {/* Vertical Lines */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Vertical Lines (खड़ी रेखाएं)
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleToggleVerticalBorder("outerLeft")}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold border transition-colors ${
                      data.verticalBorders?.outerLeft
                        ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                        : "bg-white text-slate-400 border-slate-200 line-through"
                    }`}
                  >
                    Outer Left
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleVerticalBorder("col1ToCol2")}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold border transition-colors ${
                      data.verticalBorders?.col1ToCol2
                        ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                        : "bg-white text-slate-400 border-slate-200 line-through"
                    }`}
                  >
                    Col 1-2 (Date/Sr)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleVerticalBorder("col2ToCol3")}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold border transition-colors ${
                      data.verticalBorders?.col2ToCol3
                        ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                        : "bg-white text-slate-400 border-slate-200 line-through"
                    }`}
                  >
                    Col 2-3 (Sr/Narration)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleVerticalBorder("outerRight")}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold border transition-colors ${
                      data.verticalBorders?.outerRight
                        ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                        : "bg-white text-slate-400 border-slate-200 line-through"
                    }`}
                  >
                    Outer Right
                  </button>
                </div>
              </div>

              {/* Horizontal Lines & Sections */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Section Blocks & Horizontal Lines
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setData((p) => ({ ...p, showHeader: !p.showHeader }))}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold border transition-colors ${
                      data.showHeader
                        ? "bg-amber-50 text-amber-800 border-amber-300"
                        : "bg-white text-slate-400 border-slate-200 line-through"
                    }`}
                  >
                    Header Block
                  </button>
                  <button
                    type="button"
                    onClick={() => setData((p) => ({ ...p, showCaseHeading: !p.showCaseHeading }))}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold border transition-colors ${
                      data.showCaseHeading
                        ? "bg-amber-50 text-amber-800 border-amber-300"
                        : "bg-white text-slate-400 border-slate-200 line-through"
                    }`}
                  >
                    State / Versus Block
                  </button>
                  <button
                    type="button"
                    onClick={handleAddAllHorizontalBorders}
                    className="text-[11px] font-bold text-blue-700 hover:underline px-1"
                  >
                    + Row Lines
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveAllHorizontalBorders}
                    className="text-[11px] font-bold text-slate-500 hover:underline px-1"
                  >
                    - Row Lines
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ================= EDITABLE OFFICIAL ZIMNI LEGAL DOCUMENT CANVAS ================= */}
      {a4Preview && (
        <div className="no-print fixed inset-0 z-50 bg-slate-900/70 p-3 sm:p-6 flex flex-col" role="dialog" aria-modal="true" aria-label="A4 template pages">
          <div className="flex items-center justify-between bg-white p-3 rounded-t-lg">
            <strong>A4 Pages · 210 × 297 mm</strong>
            <Button size="sm" variant="outline" onClick={() => setA4Preview(null)}>Back to Edit</Button>
          </div>
          <iframe title="Case Zimni A4 page preview" srcDoc={a4Preview} sandbox="" className="w-full flex-1 bg-slate-200 border-0" />
        </div>
      )}
      <div className="overflow-x-auto bg-slate-100/60 p-2 sm:p-6 rounded-2xl border border-slate-200/70">
        <div
          id="zimni-printable-canvas"
          className={`mx-auto bg-white shadow-sm font-serif text-slate-900 ${
            fontSize === "compact" ? "text-xs" : fontSize === "large" ? "text-base" : "text-sm"
          }`}
          style={{ width: "210mm", minHeight: "297mm", padding: "8mm 10mm", boxSizing: "border-box", lineHeight: "1.6", fontFamily: 'Georgia, "Times New Roman", serif' }}
        >
          {/* HEADER SECTION (पुलिस फार्म संख्या 25.54 (1) भाग (1) / रिपोर्ट जिमनी) */}
          {data.showHeader && (
            <div className="mb-4 space-y-3">
              {/* Center Main Titles */}
              <div className="text-center space-y-1">
                <input
                  type="text"
                  value={data.formNumberText}
                  onChange={(e) => setData((p) => ({ ...p, formNumberText: e.target.value }))}
                  placeholder="पुलिस फार्म संख्या 25.54 (1) भाग (1)"
                  className="w-full text-center font-bold text-base sm:text-lg text-slate-900 bg-transparent hover:bg-amber-50/50 focus:bg-white border border-transparent hover:border-slate-300 focus:border-amber-500 rounded px-2 py-0.5 outline-none tracking-wide"
                />
                <input
                  type="text"
                  value={data.reportTitleText}
                  onChange={(e) => setData((p) => ({ ...p, reportTitleText: e.target.value }))}
                  placeholder="रिपोर्ट जिमनी"
                  className="w-full text-center font-black text-lg sm:text-xl text-slate-950 bg-transparent hover:bg-amber-50/50 focus:bg-white border border-transparent hover:border-slate-300 focus:border-amber-500 rounded px-2 py-0.5 outline-none tracking-wider"
                />
              </div>

              {/* Two Column Header (Left Info vs Right Info) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start pt-1">
                {/* Left Side Header Block (थाना, मु०नं०, घटना स्थल, घटना तिथि, अपराध) */}
                <div className="space-y-1">
                  {data.leftHeaderLines.map((line) => (
                    <div key={line.id} className="group flex items-center gap-1">
                      <input
                        type="text"
                        value={line.text}
                        onChange={(e) => handleUpdateLeftHeader(line.id, e.target.value)}
                        className="w-full font-bold text-slate-900 bg-transparent hover:bg-amber-50/50 focus:bg-white border-b border-transparent hover:border-slate-300 focus:border-amber-500 px-1 py-0.5 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleDeleteLeftHeader(line.id)}
                        title="यह पंक्ति हटाएं"
                        className="no-print opacity-0 group-hover:opacity-100 p-0.5 text-red-500 hover:text-red-700 transition-opacity"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  <div className="no-print pt-1">
                    <button
                      type="button"
                      onClick={handleAddLeftHeader}
                      className="text-[11px] font-bold text-amber-700 hover:text-amber-900 hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>+ नई बायीं पंक्ति जोड़ें</span>
                    </button>
                  </div>
                </div>

                {/* Right Side Header Block (पुलिस आयुक्तालय, जिमनी नं०, प्राप्ति तिथि, रवानगी तिथि) */}
                <div className="space-y-1 sm:text-right">
                  {data.rightHeaderLines.map((line) => (
                    <div key={line.id} className="group flex items-center sm:justify-end gap-1">
                      <input
                        type="text"
                        value={line.text}
                        onChange={(e) => handleUpdateRightHeader(line.id, e.target.value)}
                        className="w-full sm:text-right font-bold text-slate-900 bg-transparent hover:bg-amber-50/50 focus:bg-white border-b border-transparent hover:border-slate-300 focus:border-amber-500 px-1 py-0.5 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleDeleteRightHeader(line.id)}
                        title="यह पंक्ति हटाएं"
                        className="no-print opacity-0 group-hover:opacity-100 p-0.5 text-red-500 hover:text-red-700 transition-opacity"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  <div className="no-print pt-1 flex justify-start sm:justify-end">
                    <button
                      type="button"
                      onClick={handleAddRightHeader}
                      className="text-[11px] font-bold text-amber-700 hover:text-amber-900 hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>+ नई दायीं पंक्ति जोड़ें</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= THE MAIN 3-COLUMN STATUTORY BOX TABLE ================= */}
          <div
            data-zimni-table
            className="w-full rounded-none"
            style={tableContainerStyle}
          >
            {/* Table Header Row (Column Titles) */}
            <div
              className="grid grid-cols-12 font-bold text-slate-950 bg-slate-50/40 text-center"
              style={headerBottomStyle}
            >
              {/* Column 1 Title */}
              <div
                className="col-span-2 p-2 flex items-center justify-center"
                style={col1DividerStyle}
              >
                <input
                  type="text"
                  value={data.col1Title}
                  onChange={(e) => setData((p) => ({ ...p, col1Title: e.target.value }))}
                  className="w-full text-center font-bold bg-transparent outline-none"
                  placeholder="तिथि व समय"
                />
              </div>

              {/* Column 2 Title */}
              <div
                className="col-span-1 p-2 flex items-center justify-center"
                style={col2DividerStyle}
              >
                <input
                  type="text"
                  value={data.col2Title}
                  onChange={(e) => setData((p) => ({ ...p, col2Title: e.target.value }))}
                  className="w-full text-center font-bold bg-transparent outline-none"
                  placeholder="क्रं. स."
                />
              </div>

              {/* Column 3 Title */}
              <div className="col-span-9 p-2 flex items-center justify-center">
                <input
                  type="text"
                  value={data.col3Title}
                  onChange={(e) => setData((p) => ({ ...p, col3Title: e.target.value }))}
                  className="w-full text-center font-bold bg-transparent outline-none"
                  placeholder="अनुसंधान का विवरण"
                />
              </div>
            </div>

            {/* Case Headings Inside Top of Column 3 (राज्य द्वारा, बनाम, अनुसन्धानकर्ता, श्रीमान जी) */}
            {data.showCaseHeading && (
              <div
                className="grid grid-cols-12"
                style={caseHeadingBottomStyle}
              >
                <div
                  className="col-span-2 bg-slate-50/20"
                  style={col1DividerStyle}
                ></div>
                <div
                  className="col-span-1 bg-slate-50/20"
                  style={col2DividerStyle}
                ></div>
                <div className="col-span-9 p-3 space-y-2">
                  {/* State / Complainant Line */}
                  <div className="flex items-start gap-1">
                    <textarea
                      rows={2}
                      value={data.stateLine}
                      onChange={(e) => setData((p) => ({ ...p, stateLine: e.target.value }))}
                      placeholder="राज्य द्वारा:- ..."
                      className="w-full font-bold text-slate-900 bg-transparent hover:bg-amber-50/40 focus:bg-white border border-transparent hover:border-slate-300 focus:border-amber-500 rounded p-1 outline-none resize-y leading-relaxed"
                    />
                    <VoiceInputButton
                      onTranscript={(t) => setData((p) => ({ ...p, stateLine: (p.stateLine ? p.stateLine + " " : "") + t }))}
                      currentValue={data.stateLine}
                      fieldLabel="राज्य द्वारा विवरण"
                      iconOnly
                    />
                  </div>

                  {/* Accused Line */}
                  <div className="flex items-start gap-1">
                    <textarea
                      rows={1}
                      value={data.accusedLine}
                      onChange={(e) => setData((p) => ({ ...p, accusedLine: e.target.value }))}
                      placeholder="बनाम:- ..."
                      className="w-full font-bold text-slate-900 bg-transparent hover:bg-amber-50/40 focus:bg-white border border-transparent hover:border-slate-300 focus:border-amber-500 rounded p-1 outline-none resize-y"
                    />
                    <VoiceInputButton
                      onTranscript={(t) => setData((p) => ({ ...p, accusedLine: (p.accusedLine ? p.accusedLine + " " : "") + t }))}
                      currentValue={data.accusedLine}
                      fieldLabel="बनाम विवरण"
                      iconOnly
                    />
                  </div>

                  {/* IO Line */}
                  <div className="flex items-start gap-1">
                    <textarea
                      rows={1}
                      value={data.ioLine}
                      onChange={(e) => setData((p) => ({ ...p, ioLine: e.target.value }))}
                      placeholder="अनुसन्धानकर्ता:- ..."
                      className="w-full font-bold text-slate-900 bg-transparent hover:bg-amber-50/40 focus:bg-white border border-transparent hover:border-slate-300 focus:border-amber-500 rounded p-1 outline-none resize-y"
                    />
                    <VoiceInputButton
                      onTranscript={(t) => setData((p) => ({ ...p, ioLine: (p.ioLine ? p.ioLine + " " : "") + t }))}
                      currentValue={data.ioLine}
                      fieldLabel="अनुसन्धानकर्ता विवरण"
                      iconOnly
                    />
                  </div>

                  {/* Salutation */}
                  <div className="pt-1 flex items-center justify-between">
                    <input
                      type="text"
                      value={data.salutation}
                      onChange={(e) => setData((p) => ({ ...p, salutation: e.target.value }))}
                      placeholder="श्रीमान जी,"
                      className="font-bold text-slate-950 bg-transparent hover:bg-amber-50/40 focus:bg-white border border-transparent hover:border-slate-300 focus:border-amber-500 rounded px-1 py-0.5 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleToggleHorizontalBorder("caseHeadingBottom")}
                      className="no-print text-[10px] font-bold px-2 py-0.5 rounded border border-slate-300 hover:bg-amber-50 text-slate-600"
                      title="इस विवरण के नीचे क्षैतिज रेखा चालू या बंद करें"
                    >
                      नीचे रेखा: {data.horizontalBorders?.caseHeadingBottom ? "ऑन" : "ऑफ"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ================= ENTRY ROWS (INVESTIGATION NARRATION) ================= */}
            {data.entries.map((entry, index) => (
              <div
                key={entry.id}
                className="grid grid-cols-12 group relative"
                style={{
                  borderBottom: entry.hasBottomBorder
                    ? `${bw} solid ${borderCol}`
                    : "none",
                }}
              >
                {/* Column 1: Date & Time / पुछताछ */}
                <div
                  className="col-span-2 p-2 sm:p-3 align-top flex flex-col justify-start relative group/col1"
                  style={col1DividerStyle}
                >
                  <textarea
                    rows={Math.max(2, (entry.dateTime || "").split("\n").length)}
                    value={entry.dateTime}
                    onChange={(e) => handleUpdateEntry(entry.id, "dateTime", e.target.value)}
                    placeholder={"दिनांक\n..\nसमय\n.."}
                    className="w-full text-xs sm:text-sm font-bold text-slate-900 bg-transparent hover:bg-amber-50/40 focus:bg-white border border-transparent hover:border-slate-300 focus:border-amber-500 rounded p-1 outline-none resize-y leading-tight whitespace-pre-line"
                  />
                  <div className="no-print absolute top-1 right-1 opacity-0 group-hover/col1:opacity-100 transition-opacity">
                    <VoiceInputButton
                      currentValue={entry.dateTime}
                      fieldLabel="तिथि / समय"
                      preferredLang="hi-IN"
                      iconOnly
                      onTranscript={(text) => {
                        const updated = entry.dateTime ? `${entry.dateTime} ${text}` : text;
                        handleUpdateEntry(entry.id, "dateTime", updated);
                      }}
                    />
                  </div>
                </div>

                {/* Column 2: Serial Number */}
                <div
                  className="col-span-1 p-2 sm:p-3 text-center align-top"
                  style={col2DividerStyle}
                >
                  <input
                    type="text"
                    value={`${index + 1}.`}
                    readOnly
                    aria-label="Serial number"
                    className="w-full text-center font-bold text-slate-900 bg-transparent hover:bg-amber-50/40 focus:bg-white border border-transparent hover:border-slate-300 focus:border-amber-500 rounded py-0.5 outline-none"
                  />
                </div>

                {/* Column 3: Narration Details */}
                <div className="col-span-9 p-3 relative space-y-2">
                  <div className="relative">
                    <AutoSuggestField
                      as="textarea"
                      entryType="ZIMNI"
                      rows={Math.max(4, Math.ceil((entry.narration || "").length / 85))}
                      value={entry.narration}
                      onChange={(val) => handleUpdateEntry(entry.id, "narration", val)}
                      placeholder="अनुसंधान का विस्तृत विवरण दर्ज करें..."
                      inputClassName="text-justify text-slate-950 bg-transparent hover:bg-amber-50/40 focus:bg-white border-transparent hover:border-slate-300 focus:border-amber-500 rounded p-1 outline-none resize-y leading-relaxed font-serif"
                    />

                    {/* Hindi / English Voice Typing Support */}
                    <div className="no-print absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <VoiceInputButton
                        currentValue={entry.narration}
                        fieldLabel={`Zimni Entry ${index + 1}`}
                        preferredLang="hi-IN"
                        onTranscript={(text) => {
                          const updated = entry.narration ? `${entry.narration} ${text}` : text;
                          handleUpdateEntry(entry.id, "narration", updated);
                        }}
                      />
                    </div>
                  </div>

                  {/* Row Controls Bar (Shown on hover in interactive mode) */}
                  <div className="no-print opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between gap-2 pt-1 border-t border-dashed border-slate-200">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleToggleRowBottomBorder(entry.id)}
                        className={`text-[11px] font-bold px-2 py-0.5 rounded border flex items-center gap-1 transition-colors ${
                          entry.hasBottomBorder
                            ? "bg-slate-900 text-white border-slate-900 shadow-2xs"
                            : "bg-slate-50 text-slate-700 border-slate-300 hover:bg-amber-50"
                        }`}
                        title="इस पंक्ति के नीचे क्षैतिज रेखा जोड़ें या हटाएं"
                      >
                        <span>नीचे रेखा:</span>
                        <span>{entry.hasBottomBorder ? "✓ ऑन" : "✕ ऑफ"}</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleAddEntryRow(index)}
                        className="text-[11px] font-bold text-blue-700 hover:text-blue-900 hover:underline flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>नीचे नई पंक्ति जोड़ें</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteEntryRow(entry.id)}
                        className="text-[11px] font-bold text-red-600 hover:text-red-800 hover:underline flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>पंक्ति हटाएं</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* ================= CLOSING STATEMENT & SIGNATURE BLOCK ================= */}
            <div
              className="grid grid-cols-12"
            >
              <div
                className="col-span-2 bg-slate-50/20"
                style={col1DividerStyle}
              ></div>
              <div
                className="col-span-1 bg-slate-50/20"
                style={col2DividerStyle}
              ></div>
              <div className="col-span-9 p-4 space-y-4">
                {/* Closing Presentation Line */}
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={data.closingText}
                    onChange={(e) => setData((p) => ({ ...p, closingText: e.target.value }))}
                    placeholder="रिपोर्ट जिमनी लिखी सेवा में प्रस्तुत है।"
                    className="w-full font-bold text-slate-900 bg-transparent hover:bg-amber-50/40 focus:bg-white border border-transparent hover:border-slate-300 focus:border-amber-500 rounded px-1 py-0.5 outline-none"
                  />
                  <VoiceInputButton
                    onTranscript={(t) => setData((p) => ({ ...p, closingText: t }))}
                    currentValue={data.closingText}
                    fieldLabel="समापन विवरण"
                    iconOnly
                  />
                </div>

                {/* Primary Officer Signature Block (Aligned Right, matching image) */}
                <div className="flex flex-col items-end text-right space-y-1 pt-2">
                  {/* Handwritten Style Signature Graphic */}
                  {data.hasSignatureGraphic && (
                    <div className="w-36 h-10 border-b border-slate-800 flex items-center justify-center text-blue-900 font-serif italic text-lg select-none">
                      <span>Jasbir Singh</span>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-1 w-full">
                    <input
                      type="text"
                      value={data.officerNameRank}
                      onChange={(e) => setData((p) => ({ ...p, officerNameRank: e.target.value }))}
                      placeholder="स.उप.नि. जसबीर सिंह न. 128/पंचकूला"
                      className="text-right font-bold text-slate-900 bg-transparent hover:bg-amber-50/40 focus:bg-white border border-transparent hover:border-slate-300 focus:border-amber-500 rounded px-1 py-0.5 outline-none w-72"
                    />
                    <VoiceInputButton
                      onTranscript={(t) => setData((p) => ({ ...p, officerNameRank: t }))}
                      currentValue={data.officerNameRank}
                      fieldLabel="अधिकारी का नाम"
                      iconOnly
                    />
                  </div>

                  <div className="flex items-center justify-end gap-1 w-full">
                    <input
                      type="text"
                      value={data.officerPost}
                      onChange={(e) => setData((p) => ({ ...p, officerPost: e.target.value }))}
                      placeholder="पुलिस चौकी सैक्टर 19 पंचकूला"
                      className="text-right font-medium text-slate-800 bg-transparent hover:bg-amber-50/40 focus:bg-white border border-transparent hover:border-slate-300 focus:border-amber-500 rounded px-1 py-0.5 outline-none w-72"
                    />
                    <VoiceInputButton
                      onTranscript={(t) => setData((p) => ({ ...p, officerPost: t }))}
                      currentValue={data.officerPost}
                      fieldLabel="पदस्थापना"
                      iconOnly
                    />
                  </div>

                  <input
                    type="text"
                    value={data.signDate}
                    onChange={(e) => setData((p) => ({ ...p, signDate: e.target.value }))}
                    placeholder="दिनांक - 11.11.2024"
                    className="text-right font-medium text-slate-800 bg-transparent hover:bg-amber-50/40 focus:bg-white border border-transparent hover:border-slate-300 focus:border-amber-500 rounded px-1 py-0.5 outline-none w-72"
                  />
                </div>

                {/* Additional Signatures (if added by user) */}
                {data.additionalSignatures.map((sig) => (
                  <div key={sig.id} className="pt-3 border-t border-dashed border-slate-300 flex flex-col items-end text-right space-y-1">
                    <input
                      type="text"
                      value={sig.title}
                      onChange={(e) =>
                        setData((p) => ({
                          ...p,
                          additionalSignatures: p.additionalSignatures.map((s) =>
                            s.id === sig.id ? { ...s, title: e.target.value } : s
                          ),
                        }))
                      }
                      className="text-right font-bold text-slate-900 bg-transparent outline-none w-72"
                    />
                    <input
                      type="text"
                      value={sig.officerNameRank}
                      onChange={(e) =>
                        setData((p) => ({
                          ...p,
                          additionalSignatures: p.additionalSignatures.map((s) =>
                            s.id === sig.id ? { ...s, officerNameRank: e.target.value } : s
                          ),
                        }))
                      }
                      className="text-right font-medium text-slate-800 bg-transparent outline-none w-72"
                    />
                    <div className="no-print">
                      <button
                        type="button"
                        onClick={() => handleDeleteSignatureBlock(sig.id)}
                        className="text-[11px] text-red-600 hover:underline"
                      >
                        हस्ताक्षर ब्लॉक हटाएं
                      </button>
                    </div>
                  </div>
                ))}

                {/* Button to add extra signature block */}
                <div className="no-print flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={handleAddSignatureBlock}
                    className="text-xs font-bold text-amber-700 hover:text-amber-900 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ अतिरिक्त अधिकारी हस्ताक्षर ब्लॉक जोड़ें</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Minimalist Bottom Button to Add Next Entry */}
          <div className="no-print mt-6 flex items-center justify-center">
            <button
              type="button"
              onClick={() => handleAddEntryRow()}
              className="px-4 py-2 rounded-lg border border-dashed border-slate-300 hover:border-amber-400 bg-white hover:bg-amber-50/40 text-slate-700 hover:text-amber-900 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5 text-amber-700" />
              <span>+ अगली जिमनी प्रविष्टि जोड़ें (Add Next Entry)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Minimalist Saved Success Modal */}
      {savedSuccessModal?.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-xl max-w-md w-full p-5 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200">
                <Check className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Case Diary Saved Successfully
                </h3>
                <p className="text-xs text-slate-500">
                  FIR <span className="font-mono font-bold text-slate-800">{savedSuccessModal.firNumber}</span> • Zimni #{savedSuccessModal.zimniNumber}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              यह जिमनी संबंधित FIR के <strong>Case Diaries (Zimni)</strong> रजिस्टर में सुरक्षित हो गई है। आप इसे FIR प्रोफ़ाइल से कभी भी देख या डाउनलोड कर सकते हैं।
            </p>

            <div className="flex items-center justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSavedSuccessModal(null)}
                className="text-xs font-semibold h-8"
              >
                Continue Editing
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => router.push(`/fir/${savedSuccessModal.firId}?tab=case_diaries`)}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold gap-1.5 h-8"
              >
                <span>Open in FIR Profile</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ZimniPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-slate-500 font-bold text-sm">
          Loading Case Diary (Zimni) Generator...
        </div>
      }
    >
      <ZimniWorkspaceContent />
    </Suspense>
  );
}
