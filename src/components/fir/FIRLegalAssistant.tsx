"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Scale,
  Sparkles,
  BookOpen,
  FileText,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Copy,
  Check,
  Search,
  Filter,
  Layers,
  ShieldAlert,
  Info,
  Clock,
  ChevronRight,
  Gavel,
  RefreshCw,
  FolderOpen,
  FileCheck2,
  Paperclip,
  Eye,
  X,
  ShieldCheck,
  ScrollText,
  Table,
  LayoutList,
} from "lucide-react";
import {
  FIRItem,
  LegalAnalysisReport,
  LegalSuggestionItem,
} from "@/types";
import { LegalAssistantService } from "@/services/legalAssistantService";
import { firService } from "@/services/firService";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";

interface FIRLegalAssistantProps {
  fir: FIRItem;
  onUpdateFir?: (updated: FIRItem) => void;
}

export function FIRLegalAssistant({ fir, onUpdateFir }: FIRLegalAssistantProps) {
  const router = useRouter();
  const { isHindi } = useLanguage();

  const [report, setReport] = useState<LegalAnalysisReport | null>(
    fir.legalAnalysis || null
  );
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState<number>(0);
  const [copiedSectionId, setCopiedSectionId] = useState<string | null>(null);
  const [selectedActFilter, setSelectedActFilter] = useState<string>("ALL");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [detailModalSection, setDetailModalSection] =
    useState<LegalSuggestionItem | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");

  // Sync if FIR already has legalAnalysis
  useEffect(() => {
    if (fir.legalAnalysis) {
      setReport(fir.legalAnalysis);
    }
  }, [fir.legalAnalysis]);

  // Steps for simulated deep AI statutory scanning
  const ANALYSIS_STEPS = [
    {
      title: isHindi
        ? "एफआईआर विवरण, तहरीर व केस डायरी का विश्लेषण"
        : "Analyzing FIR Incident & Case Diaries",
      desc: isHindi
        ? "एफआईआर सामग्री, घटना विवरण, संपत्ति, आरोपी प्रोफाइल व ज़िमनी प्रविष्टियों का विश्लेषण..."
        : "Reading FIR contents, occurrence details, stolen properties, accused profiles, and Zimni entries...",
    },
    {
      title: isHindi
        ? "एफआईआर में दर्ज धाराओं का विधिक सत्यापन"
        : "Evaluating Charged BNS & Special Act Sections",
      desc: isHindi
        ? "दर्ज धाराओं (BNS, Arms Act इत्यादि) का वैधानिक तत्वों के अनुसार सत्यापन..."
        : "Cross-checking charged sections against statutory ingredients...",
    },
    {
      title: isHindi
        ? "बेयर एक्ट पृष्ठ संख्या व विधिक औचित्य का निर्धारण"
        : "Indexing Bare Act Pages & Rationale",
      desc: isHindi
        ? "आधिकारिक बेयर एक्ट पृष्ठ संख्या एवं तथ्यात्मक विधिक औचित्य का निर्धारण..."
        : "Mapping official Bare Act publication page numbers and articulating factual legal justifications...",
    },
    {
      title: isHindi
        ? "बीएनएसएस अनुसंधान अधिदेश व साक्ष्य नियम तैयार करना"
        : "Statutory BNSS & BSA Procedural Rules",
      desc: isHindi
        ? "धारा 105 वीडियोग्राफी, धारा 35(3) नोटिस व धारा 63(4) बीएसए अनुपालन रूपरेखा..."
        : "Formulating mandatory Section 105 videography, Section 35(3) Notice, and Section 63(4) BSA compliance...",
    },
  ];

  const handleRunLegalHelp = async () => {
    setIsAnalyzing(true);
    setAnalysisStep(0);

    // Progressive step simulation for a realistic, polished experience
    for (let i = 0; i < 4; i++) {
      setAnalysisStep(i);
      await new Promise((resolve) => setTimeout(resolve, 450));
    }

    // Execute actual rule & deep NLP engine
    const generatedReport = await LegalAssistantService.analyzeFIR(fir);
    setReport(generatedReport);
    setIsAnalyzing(false);

    // Persist to FIR storage
    firService.saveLegalAnalysis(fir.id, generatedReport);

    // Update parent if callback provided
    if (onUpdateFir) {
      const updatedFir: FIRItem = {
        ...fir,
        legalAnalysis: generatedReport,
      };
      onUpdateFir(updatedFir);
    }
  };

  const handleCopyCitation = (item: LegalSuggestionItem) => {
    const citation = `${item.sectionNumber} ${item.actShortName} - "${item.sectionTitle}" (${isHindi ? "पेज" : "Page"} ${item.pageNumber})\n${isHindi ? "कानूनी आधार:" : "Legal Ground:"} ${item.reason}\n${isHindi ? "साक्ष्य:" : "Evidence:"} ${item.evidenceProof.join("; ")}`;
    navigator.clipboard.writeText(citation);
    setCopiedSectionId(item.id);
    setTimeout(() => setCopiedSectionId(null), 2500);
  };

  const handleOpenInActsPage = (item: LegalSuggestionItem) => {
    const url = `/acts-sections?act=${encodeURIComponent(
      item.actId
    )}&section=${encodeURIComponent(item.sectionNumber)}&page=${
      item.pageNumber
    }&tab=DOCUMENT`;
    router.push(url);
  };

  // Filter sections
  const filteredSections = (report?.suggestedSections || []).filter((item) => {
    if (selectedActFilter !== "ALL" && item.actId !== selectedActFilter) {
      return false;
    }
    if (
      selectedTypeFilter !== "ALL" &&
      item.recommendationType !== selectedTypeFilter
    ) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNumber = item.sectionNumber.toLowerCase().includes(q);
      const matchTitle = item.sectionTitle.toLowerCase().includes(q);
      const matchReason = item.reason.toLowerCase().includes(q);
      const matchAct = item.actShortName.toLowerCase().includes(q);
      return matchNumber || matchTitle || matchReason || matchAct;
    }
    return true;
  });

  // Extract distinct acts present in report
  const availableActs = Array.from(
    new Set((report?.suggestedSections || []).map((s) => s.actId))
  ).map((actId) => {
    const sec = report?.suggestedSections.find((s) => s.actId === actId);
    return {
      actId,
      name: sec?.actShortName || sec?.actTitle || actId,
    };
  });

  const primaryOffencesCount = (report?.suggestedSections || []).filter(
    (s) => s.recommendationType === "PRIMARY_OFFENCE"
  ).length;

  const corroboratingCount = (report?.suggestedSections || []).filter(
    (s) => s.recommendationType === "CORROBORATING_OFFENCE"
  ).length;

  const proceduralCount = (report?.suggestedSections || []).filter(
    (s) =>
      s.recommendationType === "PROCEDURAL_MANDATE" ||
      s.recommendationType === "EVIDENTIARY_RULE"
  ).length;

  return (
    <div className="space-y-6 animate-in fade-in-50">
      {/* 1. TOP HEADER & LEGAL HELP ACTION HERO BANNER */}
      <div className="rounded-xl bg-white p-5 sm:p-6 border border-slate-200/90 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-semibold border border-slate-200">
                <Scale className="w-3.5 h-3.5 text-slate-700" />
                <span>Statutory Legal Assistant • BNS / BNSS / BSA</span>
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono font-medium border border-slate-200/60">
                {fir.firNumber}
              </span>
            </div>
            <h2 className="text-lg md:text-xl font-bold tracking-tight text-slate-900">
              {isHindi ? "कानूनी सहायता एवं धारा विश्लेषण" : "FIR Statutory Legal Help"}
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed font-normal">
              {isHindi ? (
                <>
                  दर्ज धाराओं (<strong className="user-data" data-no-translate="true">{fir.actsAndSections}</strong>), तहरीर, ज़िमनी व संलग्न साक्ष्यों का विधिक विश्लेषण। यह प्रणाली प्रत्येक धारा का अधिनियम व विधिक औचित्य स्पष्ट कर मूल बेयर एक्ट के सटीक पृष्ठ पर ले जाती है।
                </>
              ) : (
                <>
                  Statutory legal analysis of charged sections (<strong className="user-data" data-no-translate="true">{fir.actsAndSections}</strong>), complaint narrative, case diary entries, and corroborating documents with exact Bare Act page indexing.
                </>
              )}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col items-stretch sm:items-center md:items-end gap-2 shrink-0">
            <button
              onClick={handleRunLegalHelp}
              disabled={isAnalyzing}
              className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs text-white shadow-2xs transition-all cursor-pointer ${
                isAnalyzing
                  ? "bg-slate-700 cursor-wait"
                  : report
                  ? "bg-slate-900 hover:bg-slate-800"
                  : "bg-red-700 hover:bg-red-800"
              }`}
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>{isHindi ? "विधिक विश्लेषण जारी..." : "Analyzing..."}</span>
                </>
              ) : report ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{isHindi ? "पुनः कानूनी विश्लेषण करें" : "Re-run Legal Help"}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>{isHindi ? "कानूनी मदद लें" : "Run Legal Help"}</span>
                </>
              )}
            </button>

            {report && (
              <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono justify-end">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>{isHindi ? "अंतिम विश्लेषण:" : "Last analyzed:"} {new Date(report.analyzedAt).toLocaleTimeString(isHindi ? "hi-IN" : "en-US", { hour: "2-digit", minute: "2-digit" })}</span>
              </span>
            )}
          </div>
        </div>

        {/* Scan Progress Bar Animation */}
        {isAnalyzing && (
          <div className="mt-5 pt-4 border-t border-slate-100 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
              <span>{ANALYSIS_STEPS[analysisStep].title}</span>
              <span className="font-mono text-slate-500">{isHindi ? `चरण ${analysisStep + 1} / 4` : `Step ${analysisStep + 1} / 4`}</span>
            </div>
            <p className="text-[11px] text-slate-400">
              {ANALYSIS_STEPS[analysisStep].desc}
            </p>
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-red-600 h-full transition-all duration-300 rounded-full"
                style={{ width: `${((analysisStep + 1) / 4) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* 2. IF NOT YET ANALYZED: PROMPT TO RUN LEGAL HELP */}
      {!report && !isAnalyzing && (
        <Card className="border-2 border-dashed border-slate-300 bg-white text-center p-10 rounded-2xl shadow-xs">
          <CardContent className="space-y-4 max-w-lg mx-auto">
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto border border-red-200 shadow-2xs">
              <Scale className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-black text-slate-900">
              {isHindi ? "एफआईआर कानूनी सहायता प्रणाली" : "Statutory Legal Analysis"}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {isHindi ? (
                <>
                  ऊपर दिए गए <strong>&quot;कानूनी मदद लें&quot;</strong> बटन पर क्लिक करें। सिस्टम इस एफआईआर के दर्ज आरोपों (<strong className="user-data" data-no-translate="true">{fir.actsAndSections}</strong>), तहरीर, ज़िमनी (केस डायरी) और साक्ष्यों को स्कैन करके संबंधित भारतीय न्याय संहिता (BNS), BNSS, साक्ष्य अधिनियम (BSA) की धाराओं का विधिक औचित्य और उनके बेयर एक्ट पेज नंबर प्रस्तुत करेगा।
                </>
              ) : (
                <>
                  Click the <strong>&quot;Run Legal Help&quot;</strong> button above. The system will scan charged sections (<strong className="user-data" data-no-translate="true">{fir.actsAndSections}</strong>), incident narrative, case diaries, and evidence documents to extract applicable legal sections and verbatim Bare Act pages.
                </>
              )}
            </p>
            <div className="pt-2">
              <Button
                onClick={handleRunLegalHelp}
                className="bg-[#0b192c] hover:bg-[#1e3e62] text-white px-6 py-2.5 rounded-xl font-bold text-xs gap-2 shadow-md cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>{isHindi ? "कानूनी मदद प्राप्त करें" : "Run Legal Help"}</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 3. REPORT ACTIVE VIEW */}
      {report && (
        <div className="space-y-6">
          {/* Executive Metrics Overview Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-medium text-slate-500">{isHindi ? "मुख्य अपराध" : "Primary Offences"}</span>
                <span className="w-2 h-2 rounded-full bg-rose-500" />
              </div>
              <div className="text-xl font-bold text-slate-900">
                {primaryOffencesCount}
              </div>
              <div className="text-[11px] text-slate-500 truncate">
                {isHindi ? "दर्ज मुख्य अपराध" : "Primary Charges"}
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-medium text-slate-500">{isHindi ? "सहोगामी धाराएं" : "Corroborating"}</span>
                <span className="w-2 h-2 rounded-full bg-amber-500" />
              </div>
              <div className="text-xl font-bold text-slate-900">
                {corroboratingCount}
              </div>
              <div className="text-[11px] text-slate-500 truncate">
                {isHindi ? "सह-आरोपित धाराएं" : "Associated Charges"}
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-medium text-slate-500">{isHindi ? "प्रक्रिया व साक्ष्य" : "Procedure & Evidence"}</span>
                <span className="w-2 h-2 rounded-full bg-blue-500" />
              </div>
              <div className="text-xl font-bold text-slate-900">
                {proceduralCount}
              </div>
              <div className="text-[11px] text-slate-500 truncate">
                {isHindi ? "बीएनएसएस व बीएसए नियम" : "BNSS / BSA Mandates"}
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-medium text-slate-500">{isHindi ? "डायरी व साक्ष्य स्कैन" : "Scanned Records"}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>
              <div className="text-xl font-bold text-slate-900">
                {report.scannedDocumentsCount}
              </div>
              <div className="text-[11px] text-slate-500 truncate">
                {isHindi ? "केस डायरी व साक्ष्य" : "Diaries & Evidence"}
              </div>
            </div>
          </div>

          {/* Scanned Case Facts & Allegations Brief Card */}
          <Card className="border border-slate-200 shadow-2xs bg-white">
            <CardContent className="p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <FileCheck2 className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    {isHindi ? "केस सामग्री व साक्ष्य विश्लेषण सारांश" : "Synthesized Case Evidence"}
                  </span>
                </div>
                <span className="text-[11px] text-slate-500">
                  {isHindi
                    ? `${report.scannedFactsCount} शब्द विश्लेषित • ${report.scannedDocumentsCount} केस रिकॉर्ड`
                    : `${report.scannedFactsCount} words analyzed • ${report.scannedDocumentsCount} case records`}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                {/* Allegations */}
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/60 space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    {isHindi ? "प्रमुख विधिक आरोप:" : "Key Allegations:"}
                  </span>
                  <ul className="space-y-1 text-slate-800 list-disc list-inside user-data" data-no-translate="true">
                    {report.scannedEvidenceSummary.keyAllegationsIdentified.map((item, idx) => (
                      <li key={idx} className="font-medium truncate" title={item}>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Accused & Loss */}
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/60 space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    {isHindi ? "आरोपी व संपत्ति नुकसान:" : "Accused & Property Loss:"}
                  </span>
                  <div className="space-y-1 text-slate-800">
                    <p className="font-semibold text-slate-900 truncate user-data" data-no-translate="true">
                      {isHindi ? "आरोपी: " : "Accused: "}{report.scannedEvidenceSummary.accusedIdentified.join(", ") || (isHindi ? "अज्ञात" : "Unknown")}
                    </p>
                    {report.scannedEvidenceSummary.injuriesOrLossNoted.length > 0 ? (
                      report.scannedEvidenceSummary.injuriesOrLossNoted.map((loss, idx) => (
                        <p key={idx} className="text-red-700 font-medium truncate user-data" data-no-translate="true" title={loss}>
                          • {loss}
                        </p>
                      ))
                    ) : (
                      <p className="text-slate-500 italic">{isHindi ? "वारदात में संपत्ति/चोट विवरण उपलब्ध" : "Incident injury/loss details recorded"}</p>
                    )}
                  </div>
                </div>

                {/* Document docket */}
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/60 space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    {isHindi ? "स्कैन किए गए दस्तावेज व डायरी:" : "Scanned Documents & Diaries:"}
                  </span>
                  <ul className="space-y-1 text-slate-800 user-data" data-no-translate="true">
                    {report.scannedEvidenceSummary.documentsFound.slice(0, 3).map((doc, idx) => (
                      <li key={idx} className="truncate text-slate-700" title={doc}>
                        📎 {doc}
                      </li>
                    ))}
                    {report.scannedEvidenceSummary.documentsFound.length > 3 && (
                      <li className="text-[11px] text-blue-700 font-bold">
                        + {report.scannedEvidenceSummary.documentsFound.length - 3} {isHindi ? "अन्य दस्तावेज़ संलग्न" : "more documents"}
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Search & Filter Bar */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isHindi ? "धारा नंबर, शीर्षक, या कानूनी कारण खोजें (उदा: 303, 305)..." : "Search section number, title, or legal ground..."}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Act Filter */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-semibold text-[11px]">{isHindi ? "अधिनियम:" : "Act:"}</span>
                <select
                  value={selectedActFilter}
                  onChange={(e) => setSelectedActFilter(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 focus:outline-none font-medium text-slate-800"
                >
                  <option value="ALL">{isHindi ? "सभी अधिनियम" : "All Acts"}</option>
                  {availableActs.map((act) => (
                    <option key={act.actId} value={act.actId}>
                      {act.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Type Filter */}
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-semibold text-[11px]">{isHindi ? "प्रकार:" : "Type:"}</span>
                <select
                  value={selectedTypeFilter}
                  onChange={(e) => setSelectedTypeFilter(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 focus:outline-none font-medium text-slate-800"
                >
                  <option value="ALL">{isHindi ? "सभी धाराएं" : "All Provisions"}</option>
                  <option value="PRIMARY_OFFENCE">{isHindi ? "मुख्य दर्ज अपराध" : "Primary Offence"}</option>
                  <option value="CORROBORATING_OFFENCE">{isHindi ? "सहोगामी अपराध" : "Corroborating Offence"}</option>
                  <option value="PROCEDURAL_MANDATE">{isHindi ? "अनुसंधान प्रक्रिया (बीएनएसएस)" : "Investigation Procedure (BNSS)"}</option>
                  <option value="EVIDENTIARY_RULE">{isHindi ? "साक्ष्य नियम (बीएसए)" : "Evidentiary Rule (BSA)"}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Suggested & Applied Sections List */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Gavel className="w-4 h-4 text-red-600" />
                <h3 className="text-sm font-black text-slate-900 tracking-tight">
                  {isHindi
                    ? `लागू धाराओं का विधिक विवरण एवं औचित्य (${filteredSections.length} धाराएं)`
                    : `Applicable Legal Sections & Rationale (${filteredSections.length} Sections)`}
                </h3>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="text-xs text-slate-500 hidden md:inline">
                  {isHindi ? "BNS, BNSS व BSA बेयर एक्ट के अनुसार सत्यापित" : "Verified as per BNS, BNSS & BSA Bare Acts"}
                </span>
                <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
                  <button
                    type="button"
                    onClick={() => setViewMode("table")}
                    className={`px-2.5 py-1 rounded-md font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      viewMode === "table"
                        ? "bg-[#0b192c] text-white shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Table className="w-3.5 h-3.5 text-blue-400" />
                    <span>{isHindi ? "तालिका स्वरूप" : "Table View"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("cards")}
                    className={`px-2.5 py-1 rounded-md font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      viewMode === "cards"
                        ? "bg-[#0b192c] text-white shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <LayoutList className="w-3.5 h-3.5 text-slate-400" />
                    <span>{isHindi ? "कार्ड्स" : "Cards"}</span>
                  </button>
                </div>
              </div>
            </div>

            {filteredSections.length === 0 ? (
              <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-500 text-xs">
                {isHindi ? "दिए गए फिल्टर अथवा खोज के अनुरूप कोई धारा नहीं मिली।" : "No sections found matching the selected filter or query."}
              </div>
            ) : viewMode === "table" ? (
              <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600">
                      <tr>
                        <th className="py-2.5 px-3 text-center w-10 text-[11px] font-semibold text-slate-500">#</th>
                        <th className="py-2.5 px-3.5 w-56 text-[11px] font-semibold text-slate-600">{isHindi ? "धारा व अधिनियम" : "Section & Act"}</th>
                        <th className="py-2.5 px-3.5 min-w-[320px] text-[11px] font-semibold text-slate-600">{isHindi ? "कानूनी औचित्य एवं साक्ष्य" : "Legal Rationale & Evidence"}</th>
                        <th className="py-2.5 px-3.5 w-44 text-[11px] font-semibold text-slate-600">{isHindi ? "वर्गीकरण व दण्ड" : "Classification & Punishment"}</th>
                        <th className="py-2.5 px-3 text-center w-28 text-[11px] font-semibold text-slate-600">{isHindi ? "बेयर एक्ट" : "Bare Act"}</th>
                        <th className="py-2.5 px-3 text-right w-36 text-[11px] font-semibold text-slate-600">{isHindi ? "कार्यवाही" : "Actions"}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredSections.map((item, idx) => {
                        const isPrimary = item.recommendationType === "PRIMARY_OFFENCE";
                        const isProcedural = item.recommendationType === "PROCEDURAL_MANDATE";
                        const isEvidentiary = item.recommendationType === "EVIDENTIARY_RULE";

                        return (
                          <tr
                            key={item.id}
                            className="hover:bg-slate-50/60 transition-colors"
                          >
                            {/* Sr No */}
                            <td className="py-3 px-3 text-center text-slate-400 font-mono text-xs align-top">
                              {idx + 1}
                            </td>

                            {/* Section & Act */}
                            <td className="py-3 px-3.5 align-top">
                              <div className="space-y-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-mono font-bold text-slate-900 text-sm">
                                    {isHindi ? "धारा" : "Section"} {item.sectionNumber}
                                  </span>
                                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200/60">
                                    {item.actShortName}
                                  </span>
                                </div>
                                <p className="text-xs font-medium text-slate-800 leading-snug">
                                  {item.sectionTitle}
                                </p>
                                <div className="flex items-center gap-2 flex-wrap pt-0.5">
                                  <span
                                    className={`inline-block text-[10px] px-2 py-0.5 rounded font-medium border ${
                                      isPrimary
                                        ? "bg-rose-50 text-rose-700 border-rose-200/60"
                                        : isProcedural
                                        ? "bg-blue-50 text-blue-700 border-blue-200/60"
                                        : isEvidentiary
                                        ? "bg-purple-50 text-purple-700 border-purple-200/60"
                                        : "bg-slate-50 text-slate-600 border-slate-200/60"
                                    }`}
                                  >
                                    {item.recommendationTypeLabel}
                                  </span>
                                  {item.chapter && (
                                    <span className="text-[10px] text-slate-400 truncate max-w-[140px]" title={item.chapter}>
                                      {item.chapter}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Legal Rationale & Evidence */}
                            <td className="py-3 px-3.5 align-top">
                              <div className="space-y-2">
                                <p className="text-xs text-slate-700 leading-relaxed user-data" data-no-translate="true">
                                  {item.reason}
                                </p>

                                {item.evidenceProof && item.evidenceProof.length > 0 && (
                                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                                    <span className="text-[10px] text-slate-400 font-medium">{isHindi ? "साक्ष्य:" : "Evidence:"}</span>
                                    {item.evidenceProof.map((proof, pIdx) => (
                                      <span
                                        key={pIdx}
                                        className="inline-flex items-center text-[10px] bg-slate-50 text-slate-600 px-2 py-0.5 rounded border border-slate-200/70 user-data"
                                        data-no-translate="true"
                                        title={proof}
                                      >
                                        {proof}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </td>

                            {/* Classification & Punishment */}
                            <td className="py-3 px-3.5 align-top">
                              <div className="space-y-1.5 text-xs">
                                <div className="flex flex-wrap gap-1">
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${
                                      item.cognizable === "Cognizable"
                                        ? "bg-rose-50 text-rose-700 border-rose-200/60"
                                        : "bg-slate-50 text-slate-600 border-slate-200/60"
                                    }`}
                                  >
                                    {item.cognizable === "Cognizable" ? (isHindi ? "संज्ञेय" : "Cognizable") : (isHindi ? "असंज्ञेय" : "Non-Cognizable")}
                                  </span>
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${
                                      item.bailable === "Non-bailable"
                                        ? "bg-amber-50 text-amber-800 border-amber-200/60"
                                        : "bg-emerald-50 text-emerald-800 border-emerald-200/60"
                                    }`}
                                  >
                                    {item.bailable === "Non-bailable" ? (isHindi ? "गैर-जमानती" : "Non-Bailable") : (isHindi ? "जमानती" : "Bailable")}
                                  </span>
                                </div>
                                <div className="text-[11px] text-slate-600">
                                  <span className="text-slate-400">{isHindi ? "सज़ा: " : "Punishment: "}</span>
                                  <span className="font-medium text-slate-800">{item.punishment || "—"}</span>
                                </div>
                                <div className="text-[11px] text-slate-600">
                                  <span className="text-slate-400">{isHindi ? "कोर्ट: " : "Court: "}</span>
                                  <span className="text-slate-700">{item.triableBy || "—"}</span>
                                </div>
                              </div>
                            </td>

                            {/* Bare Act Page No. */}
                            <td className="py-3 px-3 text-center align-top">
                              <button
                                type="button"
                                onClick={() => handleOpenInActsPage(item)}
                                title={isHindi ? `मूल बेयर एक्ट पेज ${item.pageNumber} पर देखें` : `View Bare Act on page ${item.pageNumber}`}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-amber-900 bg-amber-50/80 hover:bg-amber-100 border border-amber-200/70 transition-colors cursor-pointer group shadow-2xs"
                              >
                                <BookOpen className="w-3.5 h-3.5 text-amber-600 group-hover:text-amber-700" />
                                <span className="font-mono font-semibold">{isHindi ? "पेज" : "Page"} {item.pageNumber}</span>
                                <ExternalLink className="w-3 h-3 text-amber-600/70 group-hover:text-amber-800" />
                              </button>
                            </td>

                            {/* Actions */}
                            <td className="py-3 px-3 text-right align-top">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleOpenInActsPage(item)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-2xs cursor-pointer"
                                  title={isHindi ? "Acts and Sections पेज में खोलें" : "Open in Acts & Sections Page"}
                                >
                                  <Scale className="w-3 h-3 text-amber-300" />
                                  <span>{isHindi ? "अधिनियम" : "Act"}</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setDetailModalSection(item)}
                                  className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                                  title={isHindi ? "विस्तृत विधिक विवरण देखें" : "View Detailed Legal Info"}
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleCopyCitation(item)}
                                  className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                                  title={copiedSectionId === item.id ? (isHindi ? "कॉपी हुआ" : "Copied") : (isHindi ? "Citation कॉपी करें" : "Copy Citation")}
                                >
                                  {copiedSectionId === item.id ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredSections.map((item) => {
                  const isPrimary = item.recommendationType === "PRIMARY_OFFENCE";
                  const isProcedural = item.recommendationType === "PROCEDURAL_MANDATE";
                  const isEvidentiary = item.recommendationType === "EVIDENTIARY_RULE";

                  return (
                    <Card
                      key={item.id}
                      className={`border transition-all shadow-xs hover:shadow-md bg-white overflow-hidden ${
                        isPrimary
                          ? "border-red-300 ring-1 ring-red-100"
                          : isProcedural
                          ? "border-blue-200"
                          : isEvidentiary
                          ? "border-emerald-200"
                          : "border-slate-200"
                      }`}
                    >
                      {/* Card Header Strip */}
                      <div
                        className={`px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 border-b ${
                          isPrimary
                            ? "bg-red-50/70 border-red-200/70 text-red-950"
                            : isProcedural
                            ? "bg-blue-50/60 border-blue-200/70 text-blue-950"
                            : isEvidentiary
                            ? "bg-emerald-50/60 border-emerald-200/70 text-emerald-950"
                            : "bg-slate-50/70 border-slate-200 text-slate-900"
                        }`}
                      >
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`px-2.5 py-0.5 rounded-md font-black text-xs uppercase tracking-wider font-mono shadow-2xs border ${
                              isPrimary
                                ? "bg-red-700 text-white border-red-800"
                                : isProcedural
                                ? "bg-blue-700 text-white border-blue-800"
                                : isEvidentiary
                                ? "bg-emerald-700 text-white border-emerald-800"
                                : "bg-slate-800 text-white border-slate-900"
                            }`}
                          >
                            {item.sectionNumber}
                          </span>

                          <span className="text-xs font-bold text-slate-800">
                            {item.actShortName}
                          </span>

                          <span className="text-slate-400">•</span>

                          <span className="text-xs font-medium text-slate-600 truncate max-w-xs md:max-w-md">
                            {item.chapter}
                          </span>
                        </div>

                        {/* Recommendation Type Badge */}
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              isPrimary
                                ? "bg-red-100 text-red-800 border-red-200"
                                : isProcedural
                                ? "bg-blue-100 text-blue-800 border-blue-200"
                                : isEvidentiary
                                ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                                : "bg-amber-100 text-amber-800 border-amber-200"
                            }`}
                          >
                            {item.recommendationTypeLabel}
                          </span>

                          <span className="text-[10px] font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                            Bare Act Pg {item.pageNumber}
                          </span>
                        </div>
                      </div>

                      {/* Card Content */}
                      <CardContent className="p-4 sm:p-5 space-y-4">
                        {/* Section Title & Classification Badges */}
                        <div className="space-y-2">
                          <h4 className="text-sm sm:text-base font-black text-slate-900">
                            {item.sectionTitle}
                          </h4>

                          {/* Classification Pill Tags */}
                          <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
                            {/* Punishment Badge */}
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold bg-rose-50 text-rose-800 border border-rose-200">
                              <ShieldAlert className="w-3 h-3 text-rose-600" />
                              <span>{isHindi ? "सजा: " : "Punishment: "}<span className="user-data" data-no-translate="true">{item.punishment}</span></span>
                            </span>

                            {/* Cognizable */}
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold border ${
                                item.cognizable === "Cognizable"
                                  ? "bg-red-50 text-red-800 border-red-200"
                                  : "bg-slate-50 text-slate-700 border-slate-200"
                              }`}
                            >
                              <span>{item.cognizable === "Cognizable" ? (isHindi ? "संज्ञेय" : "Cognizable") : (isHindi ? "असंज्ञेय" : "Non-Cognizable")}</span>
                            </span>

                            {/* Bailable */}
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold border ${
                                item.bailable === "Non-bailable"
                                  ? "bg-red-50 text-red-800 border-red-200"
                                  : "bg-emerald-50 text-emerald-800 border-emerald-200"
                              }`}
                            >
                              <span>{item.bailable === "Non-bailable" ? (isHindi ? "गैर-जमानती" : "Non-Bailable") : (isHindi ? "जमानती" : "Bailable")}</span>
                            </span>

                            {/* Triable By */}
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                              <Gavel className="w-3 h-3 text-slate-600" />
                              <span>{isHindi ? "विचारणीय: " : "Court: "}<span className="user-data" data-no-translate="true">{item.triableBy}</span></span>
                            </span>
                          </div>
                        </div>

                        {/* Why this Section Applies (विधिक व तथ्यात्मक आधार) */}
                        <div className="bg-amber-50/60 p-3.5 rounded-xl border border-amber-200/80 space-y-1.5">
                          <div className="flex items-center gap-1.5 text-xs font-black text-amber-950">
                            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                            <span>{isHindi ? "यह धारा क्यों लागू हो रही है? (विधिक व तथ्यात्मक आधार):" : "Why this section applies (Factual & Legal Ground):"}</span>
                          </div>
                          <p className="text-xs text-slate-800 leading-relaxed font-normal user-data" data-no-translate="true">
                            {item.reason}
                          </p>
                        </div>

                        {/* Evidence & Supporting Facts */}
                        {item.evidenceProof && item.evidenceProof.length > 0 && (
                          <div className="space-y-1.5">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                              <Paperclip className="w-3 h-3 text-slate-400" />
                              <span>{isHindi ? "एफआईआर में साक्ष्य एवं संबंधित तथ्य:" : "FIR Evidence & Corroborating Records:"}</span>
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
                              {item.evidenceProof.map((proof, pIdx) => (
                                <div
                                  key={pIdx}
                                  className="bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200/60 text-slate-700 flex items-center gap-1.5 truncate user-data"
                                  data-no-translate="true"
                                  title={proof}
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                  <span className="truncate">{proof}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Action Buttons Footer */}
                        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            {/* Open in Acts & Sections Page */}
                            <Button
                              type="button"
                              onClick={() => handleOpenInActsPage(item)}
                              className="bg-[#0b192c] hover:bg-[#1e3e62] text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                              title={isHindi ? `अधिनियम पृष्ठ संख्या ${item.pageNumber} पर सीधे खोलें` : `Open Bare Act page ${item.pageNumber}`}
                            >
                              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                              <span>{isHindi ? `बेयर एक्ट में खोलें (पेज ${item.pageNumber})` : `Open Bare Act (Pg ${item.pageNumber})`}</span>
                              <ExternalLink className="w-3 h-3 text-slate-400 ml-0.5" />
                            </Button>

                            {/* View Detail Modal */}
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setDetailModalSection(item)}
                              className="border-slate-300 text-slate-700 hover:bg-slate-50 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5 text-slate-500" />
                              <span>{isHindi ? "विस्तृत विवरण" : "Breakdown"}</span>
                            </Button>
                          </div>

                          {/* Copy Citation Button */}
                          <button
                            type="button"
                            onClick={() => handleCopyCitation(item)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
                              copiedSectionId === item.id
                                ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                                : "bg-white text-slate-600 hover:text-slate-900 border-slate-200 hover:bg-slate-50"
                            }`}
                            title={isHindi ? "विधिक उद्धरण कॉपी करें" : "Copy Citation"}
                          >
                            {copiedSectionId === item.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span>{isHindi ? "कॉपी हुआ!" : "Copied!"}</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 text-slate-500" />
                                <span>{isHindi ? "Citation कॉपी करें" : "Copy Citation"}</span>
                              </>
                            )}
                          </button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Statutory Investigation Mandates & Checklist for IO */}
          <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs sm:text-sm font-semibold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-slate-600" />
                <span>{isHindi ? "अनुसंधान अधिकारी (IO) हेतु वैधानिक निर्देश" : "Statutory Directives for Investigating Officer (IO)"}</span>
              </h3>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md border border-slate-200 font-medium">
                BNSS / BSA
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              {isHindi
                ? "नए आपराधिक कानून BNSS, 2023 एवं भारतीय साक्ष्य अधिनियम, 2023 के तहत तफ्तीश में अनुपालन हेतु आवश्यक बिंदु:"
                : "Mandatory procedural compliance points for investigation under BNSS, 2023 and BSA, 2023:"}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-0.5 text-xs">
              {report.investigativeStepsRecommended.map((step, sIdx) => (
                <div
                  key={sIdx}
                  className="p-3 rounded-lg bg-slate-50/80 border border-slate-200/70 flex items-start gap-2.5"
                >
                  <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-semibold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                    {sIdx + 1}
                  </span>
                  <span className="text-slate-700 leading-relaxed font-normal user-data" data-no-translate="true">
                    {step}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. MODAL: FULL BARE ACT VERBATIM BREAKDOWN */}
      {detailModalSection && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-slate-200 flex flex-col">
            {/* Modal Header */}
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2 min-w-0">
                <Scale className="w-4 h-4 text-amber-400 shrink-0" />
                <div className="min-w-0">
                  <h4 className="text-sm font-black truncate">
                    {detailModalSection.sectionNumber} {detailModalSection.actShortName}
                  </h4>
                  <p className="text-[11px] text-slate-400 truncate">
                    {detailModalSection.sectionTitle}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDetailModalSection(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* Classification Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-700">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">{isHindi ? "अधिनियम" : "Act"}</span>
                  <span className="font-bold text-slate-900">{detailModalSection.actShortName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">{isHindi ? "पृष्ठ संख्या" : "Page No."}</span>
                  <span className="font-bold text-blue-700 font-mono">{isHindi ? "पेज" : "Page"} {detailModalSection.pageNumber}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">{isHindi ? "संज्ञेयता" : "Cognizability"}</span>
                  <span className="font-bold text-slate-900">{detailModalSection.cognizable === "Cognizable" ? (isHindi ? "संज्ञेय" : "Cognizable") : (isHindi ? "असंज्ञेय" : "Non-Cognizable")}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">{isHindi ? "जमानत" : "Bailability"}</span>
                  <span className="font-bold text-slate-900">{detailModalSection.bailable === "Non-bailable" ? (isHindi ? "गैर-जमानती" : "Non-Bailable") : (isHindi ? "जमानती" : "Bailable")}</span>
                </div>
              </div>

              {/* Verbatim Bare Act Text */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  {isHindi ? "मूल बेयर एक्ट वैधानिक पाठ (Verbatim Statutory Text):" : "Verbatim Statutory Text:"}
                </span>
                <div className="p-3.5 bg-slate-900 text-slate-100 rounded-xl font-mono text-[11px] leading-relaxed border border-slate-800 whitespace-pre-wrap select-text user-data" data-no-translate="true">
                  {detailModalSection.verbatimSnippet || detailModalSection.description}
                </div>
              </div>

              {/* Legal Rationale */}
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  {isHindi ? "इस एफआईआर में लागू होने का विधिक आधार:" : "Factual & Legal Ground in this FIR:"}
                </span>
                <p className="text-slate-800 bg-amber-50/70 p-3 rounded-xl border border-amber-200 leading-relaxed font-medium user-data" data-no-translate="true">
                  {detailModalSection.reason}
                </p>
              </div>

              {/* Punishment & Court */}
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  {isHindi ? "सजा एवं विचारणीय न्यायालय:" : "Punishment & Trial Jurisdiction:"}
                </span>
                <p className="text-slate-800 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <strong>{isHindi ? "सजा: " : "Punishment: "}</strong> <span className="user-data" data-no-translate="true">{detailModalSection.punishment}</span> • <strong>{isHindi ? "अदालत: " : "Court: "}</strong> <span className="user-data" data-no-translate="true">{detailModalSection.triableBy}</span>
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDetailModalSection(null)}
                className="text-xs"
              >
                {isHindi ? "बंद करें" : "Close"}
              </Button>

              <Button
                type="button"
                onClick={() => {
                  const item = detailModalSection;
                  setDetailModalSection(null);
                  handleOpenInActsPage(item);
                }}
                className="bg-[#0b192c] hover:bg-[#1e3e62] text-white text-xs font-bold gap-1.5"
              >
                <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                <span>{isHindi ? `अधिनियम पृष्ठ संख्या ${detailModalSection.pageNumber} पर देखें` : `View Bare Act on page ${detailModalSection.pageNumber}`}</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
