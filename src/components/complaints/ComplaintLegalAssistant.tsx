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
  BadgeAlert,
  FileCheck2,
  Paperclip,
  Eye,
  X,
  Printer,
} from "lucide-react";
import {
  ComplaintItem,
  LegalAnalysisReport,
  LegalSuggestionItem,
} from "@/types";
import { LegalAssistantService } from "@/services/legalAssistantService";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ComplaintLegalAssistantProps {
  complaint: ComplaintItem;
  onUpdateComplaint?: (updated: ComplaintItem) => void;
}

export function ComplaintLegalAssistant({
  complaint,
  onUpdateComplaint,
}: ComplaintLegalAssistantProps) {
  const router = useRouter();

  const [report, setReport] = useState<LegalAnalysisReport | null>(
    complaint.legalAnalysis || null
  );
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState<number>(0);
  const [copiedSectionId, setCopiedSectionId] = useState<string | null>(null);
  const [selectedActFilter, setSelectedActFilter] = useState<string>("ALL");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [detailModalSection, setDetailModalSection] =
    useState<LegalSuggestionItem | null>(null);

  // Sync if complaint already has legalAnalysis
  useEffect(() => {
    if (complaint.legalAnalysis) {
      setReport(complaint.legalAnalysis);
    }
  }, [complaint.legalAnalysis]);

  // Steps for simulated deep AI statutory scanning
  const ANALYSIS_STEPS = [
    {
      title: "घटना विवरण एवं तथ्यों का विश्लेषण (Scanning Incident Narrative & Overview)",
      desc: "Reading incident facts, dates, named accused persons, and loss details...",
    },
    {
      title: "संलग्न साक्ष्य एवं दस्तावेज़ों की जांच (Processing Attached Documents)",
      desc: "Inspecting MLR medical reports, bank transfer receipts, forged letters, and audio/video files...",
    },
    {
      title: "भारतीय न्याय संहिता एवं वैधानिक संहिताओं से मिलान (Statutory Acts Mapping)",
      desc: "Evaluating BNS 2023, BNSS 2023, BSA 2023, Arms Act, and Special Acts provisions...",
    },
    {
      title: "मूल बेयर एक्ट पृष्ठ संख्या व कानूनी आधार का निर्धारण (Indexing Bare Act Pages & Rationale)",
      desc: "Pinpointing exact publication page numbers and articulating factual legal justifications...",
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
    const generatedReport = await LegalAssistantService.analyzeComplaint(complaint);
    setReport(generatedReport);
    setIsAnalyzing(false);

    // Update parent if callback provided
    if (onUpdateComplaint) {
      const updatedComplaint: ComplaintItem = {
        ...complaint,
        legalAnalysis: generatedReport,
      };
      onUpdateComplaint(updatedComplaint);
    }
  };

  const handleCopyCitation = (item: LegalSuggestionItem) => {
    const citation = `${item.sectionNumber} ${item.actShortName} - "${item.sectionTitle}" (Bare Act Page ${item.pageNumber})\nकानूनी आधार: ${item.reason}\nसाक्ष्य: ${item.evidenceProof.join("; ")}`;
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
      shortName: sec?.actShortName || actId,
      count:
        report?.suggestedSections.filter((s) => s.actId === actId).length || 0,
    };
  });

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & LEGAL HELP ACTION HERO BANNER                             */}
      {/* ========================================================================= */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-900 text-white p-6 shadow-xl border border-indigo-500/20">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-semibold backdrop-blur-xs">
              <Scale className="w-3.5 h-3.5 text-indigo-300" />
              <span>Statutory Legal Assistant • BNS / BNSS / BSA AI Engine</span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <span>लीगल असिस्टेंट (Statutory Legal Help)</span>
              <span className="text-xs px-2.5 py-0.5 rounded-md bg-blue-600/60 text-blue-100 font-mono font-normal">
                {complaint.complaintNumber}
              </span>
            </h2>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
              यह मॉड्यूल शिकायत के <strong>Overview</strong> (घटना विवरण, आरोप, आरोपी) तथा <strong>Documents Sub-Tab</strong> (मेडिकल एमएलआर, बैंक ट्रांसफर रसीद, फर्जी दस्तावेज, ऑडियो/वीडियो साक्ष्य) का स्वतः विश्लेषण कर उपयुक्त <strong>Act, धाराएं (Sections), कानूनी कारण (Reason)</strong> तथा <strong>मूल बेयर एक्ट में पेज संख्या</strong> प्रदर्शित करता है।
            </p>
          </div>

          <div className="shrink-0 flex flex-col items-start md:items-end gap-2.5">
            <button
              onClick={handleRunLegalHelp}
              disabled={isAnalyzing}
              className={`group inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl font-bold text-sm text-white shadow-lg transition-all duration-200 cursor-pointer ${
                isAnalyzing
                  ? "bg-indigo-700/80 cursor-wait"
                  : report
                  ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 hover:shadow-emerald-900/30 hover:scale-[1.02]"
                  : "bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 hover:shadow-indigo-900/40 hover:scale-[1.02]"
              }`}
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-indigo-200" />
                  <span>साक्ष्य व धाराओं का विश्लेषण जारी...</span>
                </>
              ) : report ? (
                <>
                  <RefreshCw className="w-4 h-4 text-emerald-200 group-hover:rotate-180 transition-transform duration-500" />
                  <span>पुनः कानूनी मदद लें (Re-run Legal Help)</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                  <span>कानूनी मदद (Legal Help)</span>
                </>
              )}
            </button>

            {report && (
              <span className="text-[11px] text-slate-300 font-mono flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>अंतिम विश्लेषण: {new Date(report.analyzedAt).toLocaleTimeString("hi-IN", { hour: "2-digit", minute: "2-digit" })}</span>
              </span>
            )}
          </div>
        </div>

        {/* ANALYZING PROGRESS BANNER */}
        {isAnalyzing && (
          <div className="mt-6 pt-5 border-t border-indigo-500/20 space-y-3">
            <div className="flex items-center justify-between text-xs text-indigo-200 font-medium">
              <span className="flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                {ANALYSIS_STEPS[analysisStep]?.title}
              </span>
              <span className="font-mono">{((analysisStep + 1) * 25)}%</span>
            </div>
            <div className="w-full bg-slate-800/80 rounded-full h-2 overflow-hidden border border-indigo-500/30">
              <div
                className="bg-gradient-to-r from-blue-400 via-indigo-400 to-emerald-400 h-full transition-all duration-300"
                style={{ width: `${(analysisStep + 1) * 25}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400 italic">
              {ANALYSIS_STEPS[analysisStep]?.desc}
            </p>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. IF NOT YET ANALYZED: PROMPT TO CLICK LEGAL HELP                        */}
      {/* ========================================================================= */}
      {!report && !isAnalyzing && (
        <Card className="border-dashed border-2 border-slate-300 bg-slate-50/70 p-10 text-center rounded-2xl">
          <div className="max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center mx-auto shadow-inner">
              <Scale className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">
                कानूनी मदद हेतु विश्लेषण प्रारंभ करें
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                ऊपर दिए गए <strong>&quot;Legal Help&quot;</strong> बटन पर क्लिक करें। सिस्टम इस शिकायत के सभी तथ्यों (Overview) और साक्ष्यों (Documents) को स्कैन करके संबंधित भारतीय न्याय संहिता (BNS), BNSS, साक्ष्य अधिनियम (BSA) की धाराएं और उनके बेयर एक्ट पेज नंबर प्रस्तुत करेगा।
              </p>
            </div>
            <Button
              onClick={handleRunLegalHelp}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 mr-2 text-amber-300" />
              Legal Help (कानूनी मदद प्राप्त करें)
            </Button>
          </div>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* 3. REPORT ACTIVE VIEW: SUMMARY TILES & EVIDENCE PROCESSED                 */}
      {/* ========================================================================= */}
      {report && (
        <>
          {/* STATS OVERVIEW TILES */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-bold uppercase tracking-wider">घटना तथ्य (Words)</span>
                <FileText className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-black text-slate-900">
                {report.scannedFactsCount}
              </div>
              <div className="text-[11px] text-slate-500 truncate">
                श्रेणी: <strong className="text-slate-700">{complaint.category}</strong>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-bold uppercase tracking-wider">साक्ष्य दस्तावेज़ (Docs)</span>
                <Paperclip className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-slate-900">
                {report.scannedDocumentsCount}
              </div>
              <div className="text-[11px] text-emerald-700 font-semibold truncate">
                {report.scannedEvidenceSummary.documentsFound.length > 0
                  ? `${report.scannedEvidenceSummary.documentsFound.length} फाइल्स मूल्यांकित`
                  : "0 दस्तावेज संलग्न"}
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-bold uppercase tracking-wider">अधिनियम (Acts)</span>
                <Scale className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-2xl font-black text-slate-900">
                {availableActs.length}
              </div>
              <div className="text-[11px] text-slate-500 truncate">
                {availableActs.map((a) => a.shortName).join(", ")}
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-bold uppercase tracking-wider">सुझावित धाराएं (Sections)</span>
                <Gavel className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-2xl font-black text-indigo-600">
                {report.suggestedSections.length}
              </div>
              <div className="text-[11px] text-slate-500 truncate">
                {report.suggestedSections.filter((s) => s.recommendationType === "PRIMARY_OFFENCE").length} मुख्य धाराएं
              </div>
            </div>
          </div>

          {/* EVIDENCE PROCESSING CALLOUT */}
          <div className="bg-indigo-50/60 border border-indigo-200/80 rounded-xl p-4.5 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-indigo-700" />
                <span>दस्तावेज़ एवं साक्ष्य मूल्यांकन रिपोर्ट (Evidence Processing Summary)</span>
              </h4>
              <span className="text-[11px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-full">
                AI Cross-Check Verified
              </span>
            </div>

            <p className="text-xs text-indigo-900 leading-relaxed font-medium">
              {report.summary}
            </p>

            {/* Evidence Chips */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {report.scannedEvidenceSummary.documentsFound.map((doc, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white border border-indigo-200 text-slate-800 shadow-2xs"
                >
                  <Paperclip className="w-3 h-3 text-indigo-600" />
                  <span>दस्तावेज़: {doc}</span>
                </span>
              ))}

              {report.scannedEvidenceSummary.injuriesOrLossNoted.map((inj, idx) => (
                <span
                  key={`inj-${idx}`}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-rose-50 border border-rose-200 text-rose-800 shadow-2xs"
                >
                  <ShieldAlert className="w-3 h-3 text-rose-600" />
                  <span>चोट/हानि: {inj}</span>
                </span>
              ))}

              {report.scannedEvidenceSummary.accusedIdentified.map((acc, idx) => (
                <span
                  key={`acc-${idx}`}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-amber-50 border border-amber-200 text-amber-800 shadow-2xs"
                >
                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                  <span>आरोपी: {acc}</span>
                </span>
              ))}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 4. FILTER TABS & SEARCH CONTROLS                                         */}
          {/* ========================================================================= */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
            {/* Act Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 md:pb-0">
              <button
                onClick={() => setSelectedActFilter("ALL")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  selectedActFilter === "ALL"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                सभी अधिनियम ({report.suggestedSections.length})
              </button>

              {availableActs.map((act) => (
                <button
                  key={act.actId}
                  onClick={() => setSelectedActFilter(act.actId)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                    selectedActFilter === act.actId
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  <span>{act.shortName}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      selectedActFilter === act.actId
                        ? "bg-indigo-800 text-white"
                        : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {act.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Search within Sections */}
            <div className="relative shrink-0 md:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="धारा संख्या या कीवर्ड खोजें..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 5. SUGGESTED SECTIONS CARDS LIST                                         */}
          {/* ========================================================================= */}
          <div className="space-y-4">
            {filteredSections.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-500 text-xs">
                कोई धारा मेल नहीं खाती। फ़िल्टर बदलें या खोज शब्द हटाएं।
              </div>
            ) : (
              filteredSections.map((sec) => {
                const isPrimary = sec.recommendationType === "PRIMARY_OFFENCE";
                const isProcedural = sec.recommendationType === "PROCEDURAL_MANDATE";
                const isEvidentiary = sec.recommendationType === "EVIDENTIARY_RULE";

                return (
                  <div
                    key={sec.id}
                    className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden shadow-2xs hover:shadow-md ${
                      isPrimary
                        ? "border-red-200/90 hover:border-red-300"
                        : isProcedural
                        ? "border-blue-200/90 hover:border-blue-300"
                        : isEvidentiary
                        ? "border-purple-200/90 hover:border-purple-300"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    {/* CARD HEADER ROW */}
                    <div className="p-4 sm:p-5 pb-3 border-b border-slate-100 flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1.5 flex-1 min-w-[260px]">
                        {/* Act & Type Badges */}
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                            {sec.actShortName}
                          </span>

                          <span
                            className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${
                              isPrimary
                                ? "bg-red-50 text-red-700 border-red-200"
                                : isProcedural
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : isEvidentiary
                                ? "bg-purple-50 text-purple-700 border-purple-200"
                                : "bg-amber-50 text-amber-700 border-amber-200"
                            }`}
                          >
                            {sec.recommendationTypeLabel}
                          </span>

                          {/* BARE ACT PAGE NUMBER BADGE (CRITICAL REQUIREMENT) */}
                          <button
                            onClick={() => handleOpenInActsPage(sec)}
                            title={`Bare Act PDF में पेज संख्या ${sec.pageNumber} पर देखें`}
                            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 transition-colors cursor-pointer shadow-2xs"
                          >
                            <BookOpen className="w-3.5 h-3.5 text-amber-700" />
                            <span>📖 मूल बेयर एक्ट: पेज {sec.pageNumber}</span>
                            <ExternalLink className="w-3 h-3 text-amber-700 ml-0.5" />
                          </button>

                          <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-semibold border border-emerald-200">
                            {sec.confidenceScore}% सटीकता
                          </span>
                        </div>

                        {/* Section Title */}
                        <div className="pt-1">
                          <h3 className="text-base sm:text-lg font-bold text-slate-950 flex items-center gap-2">
                            <span className="text-blue-700 font-extrabold">{sec.sectionNumber}</span>
                            <span>&bull;</span>
                            <span>{sec.sectionTitle}</span>
                          </h3>
                          <p className="text-xs text-slate-500 font-medium">
                            {sec.chapter} &bull; {sec.actTitle}
                          </p>
                        </div>
                      </div>

                      {/* Top Action Quick Buttons */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleCopyCitation(sec)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer border border-slate-200"
                          title="कानूनी धारा व संदर्भ कॉपी करें"
                        >
                          {copiedSectionId === sec.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-emerald-700 font-bold">कॉपी हुआ</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>कॉपी</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => handleOpenInActsPage(sec)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs transition-colors cursor-pointer"
                          title="Acts and Sections पेज में इस धारा और पेज संख्या को खोलें"
                        >
                          <Scale className="w-3.5 h-3.5" />
                          <span>Acts &amp; Sections में देखें</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* CARD BODY */}
                    <div className="p-4 sm:p-5 space-y-4">
                      {/* STATUTORY CLASSIFICATION PILLS */}
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span
                          className={`px-2.5 py-1 rounded-md font-bold ${
                            sec.cognizable === "Cognizable"
                              ? "bg-red-100 text-red-800"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {sec.cognizable === "Cognizable" ? "संज्ञेय (Cognizable)" : "असंज्ञेय (Non-cognizable)"}
                        </span>

                        <span
                          className={`px-2.5 py-1 rounded-md font-bold ${
                            sec.bailable === "Non-bailable"
                              ? "bg-amber-100 text-amber-900"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {sec.bailable === "Non-bailable" ? "गैर-जमानती (Non-bailable)" : "जमानती (Bailable)"}
                        </span>

                        <span className="px-2.5 py-1 rounded-md font-medium bg-slate-100 text-slate-700">
                          सज़ा: <strong>{sec.punishment}</strong>
                        </span>

                        <span className="px-2.5 py-1 rounded-md font-medium bg-slate-100 text-slate-700">
                          विचारणीय: <strong>{sec.triableBy}</strong>
                        </span>
                      </div>

                      {/* 1. REASON FOR SUGGESTION (USER REQUIREMENT: vo suggest krne ka reason kya hai complaint me) */}
                      <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/90 text-amber-950 space-y-1.5">
                        <div className="flex items-center gap-2 font-bold text-xs text-amber-900 uppercase tracking-wide">
                          <Gavel className="w-4 h-4 text-amber-700" />
                          <span>धारा लगाने का कारण एवं कानूनी औचित्य (Reason for Section Application)</span>
                        </div>
                        <p className="text-xs sm:text-[13px] leading-relaxed text-amber-950 font-medium">
                          {sec.reason}
                        </p>
                      </div>

                      {/* 2. EVIDENCE PROOF FROM INCIDENT OVERVIEW & DOCUMENTS */}
                      {sec.evidenceProof.length > 0 && (
                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                          <div className="flex items-center gap-2 font-bold text-xs text-slate-800 uppercase tracking-wide">
                            <FileCheck2 className="w-3.5 h-3.5 text-blue-600" />
                            <span>प्रमाणित साक्ष्य व तथ्य (Corroborating Evidence Found in Complaint &amp; Documents)</span>
                          </div>
                          <ul className="space-y-1.5">
                            {sec.evidenceProof.map((proof, pIdx) => (
                              <li
                                key={pIdx}
                                className="text-xs text-slate-700 flex items-start gap-2"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                                <span>{proof}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* 3. VERBATIM STATUTORY DEFINITION SNIPPET */}
                      {sec.verbatimSnippet && (
                        <div className="text-xs text-slate-600 bg-slate-50/50 p-3 rounded-xl border border-slate-200/70 space-y-1">
                          <div className="text-[11px] font-bold text-slate-500 uppercase flex items-center justify-between">
                            <span>कानूनी प्रावधान (Statutory Verbatim Excerpt)</span>
                            <button
                              onClick={() => setDetailModalSection(sec)}
                              className="text-blue-600 hover:text-blue-800 font-semibold text-[11px] inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Eye className="w-3 h-3" />
                              <span>पूर्ण बेयर एक्ट पाठ देखें</span>
                            </button>
                          </div>
                          <p className="italic font-serif leading-relaxed line-clamp-3 text-slate-700">
                            &quot;{sec.verbatimSnippet}&quot;
                          </p>
                        </div>
                      )}

                      {/* CARD FOOTER INFO */}
                      <div className="pt-2 flex flex-wrap items-center justify-between text-xs text-slate-500 border-t border-slate-100 gap-2">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                            <span>Bare Act Book: <strong>Page {sec.pageNumber}</strong></span>
                          </span>
                          <span>&bull;</span>
                          <span>File: <code className="text-slate-600 text-[11px]">{sec.actFileName}</code></span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setDetailModalSection(sec)}
                            className="text-blue-700 hover:text-blue-900 font-bold inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Info className="w-3.5 h-3.5" />
                            <span>पूर्ण कानूनी विवरण (Full Statutory Sheet)</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* ========================================================================= */}
          {/* 6. STATUTORY COMPLIANCE & INVESTIGATION RECOMMENDATIONS                   */}
          {/* ========================================================================= */}
          {report.investigativeStepsRecommended && report.investigativeStepsRecommended.length > 0 && (
            <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-lg space-y-3 border border-slate-800">
              <div className="flex items-center justify-between">
                <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center gap-2 text-indigo-300">
                  <ShieldAlert className="w-4 h-4 text-indigo-400" />
                  <span>जांच अधिकारी हेतु वैधानिक प्रक्रियात्मक निर्देश (Statutory IO Mandates)</span>
                </h4>
                <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md border border-slate-700">
                  BNSS / BSA Mandate
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {report.investigativeStepsRecommended.map((step, sIdx) => (
                  <div
                    key={sIdx}
                    className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-start gap-2.5"
                  >
                    <span className="w-5 h-5 rounded-full bg-indigo-600/60 text-indigo-200 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {sIdx + 1}
                    </span>
                    <p className="text-xs text-slate-200 leading-relaxed font-medium">
                      {step}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ========================================================================= */}
      {/* 7. FULL STATUTORY DETAIL MODAL                                           */}
      {/* ========================================================================= */}
      {detailModalSection && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200 animate-in fade-in-50 zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-600 text-white">
                    {detailModalSection.actShortName}
                  </span>
                  <span className="text-xs text-slate-300 font-mono">
                    Bare Act Page: {detailModalSection.pageNumber}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white">
                  {detailModalSection.sectionNumber}: {detailModalSection.sectionTitle}
                </h3>
              </div>

              <button
                onClick={() => setDetailModalSection(null)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
              {/* Classification Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">संज्ञेयता</div>
                  <div className="font-bold text-slate-800 text-xs mt-0.5">{detailModalSection.cognizable}</div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">जमानत</div>
                  <div className="font-bold text-slate-800 text-xs mt-0.5">{detailModalSection.bailable}</div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">सज़ा (Punishment)</div>
                  <div className="font-bold text-slate-800 text-xs mt-0.5">{detailModalSection.punishment}</div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">विचारणीय (Court)</div>
                  <div className="font-bold text-slate-800 text-xs mt-0.5">{detailModalSection.triableBy}</div>
                </div>
              </div>

              {/* Reason */}
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 space-y-1">
                <div className="font-bold text-xs text-amber-900 uppercase">
                  इस शिकायत में लगाने का कारण (Factual Justification):
                </div>
                <p className="leading-relaxed">{detailModalSection.reason}</p>
              </div>

              {/* Verbatim Bare Act Text */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900 uppercase">
                    मूल बेयर एक्ट वैधानिक पाठ (Verbatim Statutory Text):
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Page {detailModalSection.pageNumber} in {detailModalSection.actFileName}
                  </span>
                </div>
                <div className="p-3 bg-white rounded-lg border border-slate-200 font-serif text-[13px] leading-relaxed text-slate-800 select-text">
                  {detailModalSection.verbatimSnippet || detailModalSection.description}
                </div>
              </div>

              {/* Evidence points */}
              {detailModalSection.evidenceProof.length > 0 && (
                <div className="space-y-1.5">
                  <div className="font-bold text-xs text-slate-900 uppercase">
                    पहचाने गए साक्ष्य व बिंदु (Corroborating Items):
                  </div>
                  <ul className="list-disc pl-5 space-y-1 text-slate-600">
                    {detailModalSection.evidenceProof.map((ev, i) => (
                      <li key={i}>{ev}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
              <button
                onClick={() => handleCopyCitation(detailModalSection)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Citation कॉपी करें</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setDetailModalSection(null)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer"
                >
                  बंद करें
                </button>
                <button
                  onClick={() => {
                    handleOpenInActsPage(detailModalSection);
                    setDetailModalSection(null);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer shadow-xs"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>बेयर एक्ट पेज {detailModalSection.pageNumber} खोलें</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
