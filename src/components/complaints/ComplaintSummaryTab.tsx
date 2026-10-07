"use client";

import React, { useState } from "react";
import {
  Sparkles,
  RefreshCw,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Printer,
  Copy,
  Check,
  ShieldAlert,
  ArrowRight,
  UploadCloud,
  History as HistoryIcon,
  Eye,
  Layers,
  Scale,
  ListTodo,
  AlertCircle,
  TrendingUp,
} from "lucide-react";
import {
  ComplaintItem,
  InvestigationSummaryReport,
  InvestigationSummaryActionItem,
} from "@/types";
import { ComplaintSummaryService } from "@/services/complaintSummaryService";
import { ComplaintService } from "@/services/complaintService";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils";

interface ComplaintSummaryTabProps {
  complaint: ComplaintItem;
  onUpdateComplaint: (updated: ComplaintItem) => void;
  currentUser?: any;
}

export function ComplaintSummaryTab({
  complaint,
  onUpdateComplaint,
  currentUser,
}: ComplaintSummaryTabProps) {
  const [summary, setSummary] = useState<InvestigationSummaryReport | null>(
    complaint.investigationSummary || null
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStep, setProcessStep] = useState(0);
  const [copied, setCopied] = useState(false);
  const [activeSection, setActiveSection] = useState<"all" | "completed" | "pending">("all");

  const PROCESS_STEPS = [
    {
      title: "प्रारंभिक विवरण व पक्षों का विश्लेषण (Analyzing Overview, Parties & Allegations)",
      desc: "Reading complainant details, accused records, incident category, and jurisdiction...",
    },
    {
      title: "संलग्न साक्ष्य व दस्तावेज़ों की जांच (Processing Attached Documents & Evidence)",
      desc: "Inspecting medical MLR, bank statements, call recordings, CCTV, and procedural notices...",
    },
    {
      title: "केस डायरी, इतिहास व पर्यवेक्षी निर्देशों की समीक्षा (Reviewing Timeline & History)",
      desc: "Analyzing audit trail, timeline events, EO notes, and SHO progress demands...",
    },
    {
      title: "कार्य प्रगति व शेष बिंदुओं का संकलन (Synthesizing Work Done & Pending Actions)",
      desc: "Evaluating completed milestones against statutory BNSS deadlines and compiling pending tasks...",
    },
  ];

  const handleGenerateOrUpdate = async () => {
    setIsProcessing(true);
    setProcessStep(0);

    // Multi-step progressive animation for visual polish
    for (let i = 0; i < 4; i++) {
      setProcessStep(i);
      await new Promise((resolve) => setTimeout(resolve, 400));
    }

    try {
      const generated = await ComplaintSummaryService.generateSummary(
        complaint,
        summary,
        currentUser?.name ? `${currentUser.role || "Officer"} ${currentUser.name}` : "CMS Investigative Intelligence"
      );

      // Save to local state
      setSummary(generated);

      // Persist to complaint store
      const updatedComplaint: ComplaintItem = {
        ...complaint,
        investigationSummary: generated,
        updatedAt: new Date().toISOString(),
      };

      onUpdateComplaint(updatedComplaint);
      await ComplaintService.saveInvestigationSummary(complaint.id, generated);
    } catch (err) {
      console.error("Failed to generate or persist summary:", err);
      // Fallback
      const fallback = ComplaintSummaryService.buildLocalSummary(
        complaint,
        summary,
        currentUser?.name || "CMS Intelligence Engine"
      );
      setSummary(fallback);
      const updatedComplaint = {
        ...complaint,
        investigationSummary: fallback,
      };
      onUpdateComplaint(updatedComplaint);
      await ComplaintService.saveInvestigationSummary(complaint.id, fallback);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopySummary = () => {
    if (!summary) return;
    const textToCopy = `=====================================================
HARYANA POLICE - CMS INVESTIGATION CASE SUMMARY
COMPLAINT NO: ${summary.complaintNumber}
VERSION: v${summary.version} (Updated: ${formatDateTime(summary.updatedAt)})
STAGE: ${summary.currentStage} | PROGRESS: ${summary.progressPercentage}%
=====================================================

1. CASE SYNOPSIS:
${summary.caseSynopsis}

2. कितना काम हुआ है अब तक (WORK DONE SO FAR):
${summary.workDoneSummary}

COMPLETED ACTIONS:
${summary.completedActions.map((a, i) => `${i + 1}. [${a.status}] ${a.title} - ${a.detail}`).join("\n")}

3. क्या बाकी है (PENDING ACTIONS & NEXT STEPS):
${summary.pendingWorkSummary}

PENDING ACTIONS:
${summary.pendingActions.map((a, i) => `${i + 1}. [${a.status}] ${a.title} - ${a.detail}`).join("\n")}

4. STATUTORY DEADLINES & ALERTS:
${summary.urgentDeadlines.join("\n")}

5. PRIMA FACIE OBSERVATION:
${summary.primaFacieObservation}
SUGGESTED OUTCOME: ${summary.suggestedOutcome} (${summary.suggestedOutcomeReason})
=====================================================`;

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrintSummary = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Action Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 rounded-2xl p-6 text-white shadow-lg border border-indigo-900/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/20 text-indigo-200 border border-indigo-400/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-300" />
                Case Investigation Intelligence
              </span>
              {summary && (
                <>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/20">
                    Version {summary.version}.0
                  </span>
                  <span className="text-[11px] text-slate-300 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    Last Updated: {formatDateTime(summary.updatedAt)}
                  </span>
                </>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <span>जांच सारांश व प्रगति आख्या (Investigation Summary)</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl">
              शिकायत के <strong>Overview</strong>, संलग्न <strong>Documents</strong> तथा केस डायरी <strong>History</strong> का संपूर्ण विश्लेषण — अब तक हुए कार्य और शेष आवश्यक कदमों का पारदर्शी विवरण।
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center shrink-0 flex-wrap">
            {summary ? (
              <>
                <Button
                  onClick={handleCopySummary}
                  variant="outline"
                  size="sm"
                  className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs gap-1.5 cursor-pointer backdrop-blur-sm"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Copied!" : "Copy Summary"}</span>
                </Button>
                <Button
                  onClick={handlePrintSummary}
                  variant="outline"
                  size="sm"
                  className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs gap-1.5 cursor-pointer backdrop-blur-sm"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </Button>
                <Button
                  onClick={handleGenerateOrUpdate}
                  disabled={isProcessing}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs gap-2 shadow-md cursor-pointer border border-blue-400/30"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? "animate-spin" : ""}`} />
                  <span>{isProcessing ? "Updating Summary..." : "Update Summary (सारांश अपडेट करें)"}</span>
                </Button>
              </>
            ) : (
              <Button
                onClick={handleGenerateOrUpdate}
                disabled={isProcessing}
                size="lg"
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm gap-2 shadow-lg cursor-pointer px-5 py-2.5 border border-emerald-400/30"
              >
                <Sparkles className={`w-4 h-4 ${isProcessing ? "animate-spin" : ""}`} />
                <span>{isProcessing ? "Processing Analysis..." : "Generate Summary (सारांश तैयार करें)"}</span>
              </Button>
            )}
          </div>
        </div>

        {/* Progress Bar when summary is loaded */}
        {summary && (
          <div className="mt-5 pt-4 border-t border-white/10">
            <div className="flex items-center justify-between text-xs font-semibold mb-1.5 text-slate-200">
              <span className="flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                जांच पूर्णता स्तर (Inquiry Completion Status):
              </span>
              <span className="text-emerald-300 font-bold">{summary.progressPercentage}% Complete</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-400 via-indigo-400 to-emerald-400 h-2.5 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${summary.progressPercentage}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Processing Animation Modal / Box */}
      {isProcessing && (
        <Card className="border-indigo-200 bg-indigo-50/60 shadow-md animate-in fade-in-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-indigo-600 text-white animate-pulse">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-indigo-950">
                  {summary ? "Updating Investigation Summary..." : "Deep Case Processing in Progress..."}
                </h4>
                <p className="text-xs text-indigo-700">
                  Analyzing Complaint Overview, Attached Documents & Evidence, and Timeline History...
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {PROCESS_STEPS.map((step, idx) => {
                const isDone = processStep > idx;
                const isCurrent = processStep === idx;
                return (
                  <div
                    key={idx}
                    className={`flex items-start gap-3 p-3 rounded-xl border text-xs transition-all ${
                      isDone
                        ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                        : isCurrent
                        ? "bg-white border-indigo-300 shadow-xs text-indigo-950 font-semibold"
                        : "bg-slate-50/50 border-slate-200 text-slate-400"
                    }`}
                  >
                    <div className="shrink-0 mt-0.5">
                      {isDone ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : isCurrent ? (
                        <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-slate-300" />
                      )}
                    </div>
                    <div>
                      <div className="font-bold">{step.title}</div>
                      <div className="text-[11px] opacity-80">{step.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State: Prompt to generate */}
      {!summary && !isProcessing && (
        <Card className="border-slate-200 shadow-sm text-center py-12 px-4 bg-white">
          <CardContent className="max-w-xl mx-auto space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto shadow-inner">
              <Sparkles className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-900">
                कोई सारांश अभी तैयार नहीं है (No Summary Generated Yet)
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                शिकायत का पूर्ण सारांश निकालने के लिए <strong>Generate Summary</strong> पर क्लिक करें। सिस्टम स्वतः शिकायत के
                <strong> Overview</strong>, संलग्न <strong>दस्तावेजों/साक्ष्यों</strong>, और केस की <strong>हिस्ट्री/टाइमलाइन</strong>
                को प्रोसेस करके बताएगा कि <strong>अब तक कितना काम हुआ है</strong> और <strong>आगे क्या बाकी है</strong>।
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left pt-2">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <Eye className="w-3.5 h-3.5 text-blue-600" />
                  <span>Overview Analysis</span>
                </div>
                <p className="text-[11px] text-slate-500">Complainant, accused, incident details & assignment status.</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <UploadCloud className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Document Evidence</span>
                </div>
                <p className="text-[11px] text-slate-500">MLR, bank proofs, notices, audio/video & registry files.</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <HistoryIcon className="w-3.5 h-3.5 text-emerald-600" />
                  <span>History & Milestones</span>
                </div>
                <p className="text-[11px] text-slate-500">Timeline events, EO notes & supervisory directions.</p>
              </div>
            </div>

            <div className="pt-3">
              <Button
                onClick={handleGenerateOrUpdate}
                size="lg"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm gap-2 shadow-md cursor-pointer px-6"
              >
                <Sparkles className="w-4 h-4" />
                <span>Generate Summary Now</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generated Summary View */}
      {summary && !isProcessing && (
        <div className="space-y-6">
          {/* Update notice if new changes were detected */}
          {summary.lastUpdateNotes && (
            <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Summary Updated (v{summary.version}.0): </span>
                <span>{summary.lastUpdateNotes}</span>
              </div>
            </div>
          )}

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-slate-200 bg-white shadow-2xs">
              <CardContent className="p-4 space-y-1">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                  <span>Current Stage</span>
                  <Layers className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <div className="text-base font-black text-slate-900">{summary.currentStage}</div>
                <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{summary.completedActions.length} Actions Completed</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 bg-white shadow-2xs">
              <CardContent className="p-4 space-y-1">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                  <span>Evidence Strength</span>
                  <Scale className="w-3.5 h-3.5 text-indigo-600" />
                </div>
                <div className="text-base font-black text-slate-900">{summary.evidenceStrength}</div>
                <div className="text-[11px] text-slate-600">
                  {summary.scannedDocumentsHighlights.length} Document(s) Scanned
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 bg-white shadow-2xs">
              <CardContent className="p-4 space-y-1">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                  <span>Pending Actions</span>
                  <ListTodo className="w-3.5 h-3.5 text-amber-600" />
                </div>
                <div className="text-base font-black text-amber-700">{summary.pendingActions.length} Pending Tasks</div>
                <div className="text-[11px] text-slate-500">
                  {summary.pendingActions.filter(p => p.status === "CRITICAL").length} Critical Deadlines
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 bg-white shadow-2xs">
              <CardContent className="p-4 space-y-1">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                  <span>Suggested Outcome</span>
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                </div>
                <div className="text-base font-black text-slate-900 truncate">
                  {summary.suggestedOutcome.replace(/_/g, " ")}
                </div>
                <div className="text-[11px] text-slate-500 truncate" title={summary.suggestedOutcomeReason}>
                  {summary.suggestedOutcomeReason}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Urgent Deadlines / BNSS Statutory Alerts */}
          {summary.urgentDeadlines.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Statutory Time Limits & Supervisory Alerts (वैधानिक समय-सीमा व निर्देश)</span>
              </div>
              <ul className="space-y-1.5 text-xs text-amber-800">
                {summary.urgentDeadlines.map((deadline, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-amber-500">•</span>
                    <span>{deadline}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Executive Case Brief */}
          <Card className="border-slate-200 bg-white shadow-xs">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  <span>केस सारांश व प्राइमा फेसी अवलोकन (Executive Case Synopsis)</span>
                </h4>
                <span className="text-[11px] text-slate-500 font-medium">
                  Source: Overview + Documents + History
                </span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed font-medium bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                {summary.caseSynopsis}
              </p>
              <div className="p-3 bg-indigo-50/70 rounded-xl border border-indigo-100 text-xs text-indigo-900 flex items-start gap-2.5">
                <Scale className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">प्राइमा फेसी विधिक निष्कर्ष (Prima Facie Observation): </span>
                  <span>{summary.primaFacieObservation}</span>
                </div>
              </div>

              {/* Scanned Overview Highlights Grid - Explicitly showing verified vs Not Found */}
              {summary.scannedOverviewHighlights && summary.scannedOverviewHighlights.length > 0 && (
                <div className="pt-2">
                  <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-blue-600" />
                    <span>दस्तावेज़ व प्रारंभिक रिकॉर्ड सत्यापन स्थिति (Verified Overview Data)</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                    {summary.scannedOverviewHighlights.map((highlight, idx) => {
                      const isNotFound = highlight.includes("Not Found") || highlight.includes("Not Specified") || highlight.includes("Not Mentioned") || highlight.includes("उल्लेख नहीं");
                      return (
                        <div
                          key={idx}
                          className={`p-2.5 rounded-lg border flex items-start gap-2 ${
                            isNotFound ? "bg-amber-50/60 border-amber-200 text-amber-900" : "bg-slate-50 border-slate-200 text-slate-800"
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${isNotFound ? "bg-amber-500" : "bg-emerald-500"}`} />
                          <span className="leading-relaxed font-medium">{highlight}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Filter Bar for Completed vs Pending */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Button
                variant={activeSection === "all" ? "primary" : "outline"}
                size="sm"
                onClick={() => setActiveSection("all")}
                className="text-xs h-8 cursor-pointer"
              >
                सभी विवरण (All Details)
              </Button>
              <Button
                variant={activeSection === "completed" ? "primary" : "outline"}
                size="sm"
                onClick={() => setActiveSection("completed")}
                className="text-xs h-8 cursor-pointer gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>कितना काम हुआ है ({summary.completedActions.length})</span>
              </Button>
              <Button
                variant={activeSection === "pending" ? "primary" : "outline"}
                size="sm"
                onClick={() => setActiveSection("pending")}
                className="text-xs h-8 cursor-pointer gap-1.5"
              >
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                <span>क्या बाकी है ({summary.pendingActions.length})</span>
              </Button>
            </div>
            <div className="text-xs text-slate-500 font-medium">
              Generated by: <span className="font-bold text-slate-700">{summary.generatedBy}</span>
            </div>
          </div>

          {/* TWO MAIN COLUMNS: WORK DONE SO FAR vs PENDING WORK */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* COLUMN 1: कितना काम हुआ है अब तक (WORK DONE SO FAR) */}
            {(activeSection === "all" || activeSection === "completed") && (
              <div className="space-y-4">
                <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <h3 className="text-base font-bold text-emerald-950">
                      कितना काम हुआ है अब तक (Work Done So Far)
                    </h3>
                  </div>
                  <p className="text-xs text-emerald-900 leading-relaxed">
                    {summary.workDoneSummary}
                  </p>
                </div>

                {/* List of Completed Action Cards */}
                <div className="space-y-2.5">
                  <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                    <span>पूर्ण की गई कार्यवाहियां (Completed Actions)</span>
                    <span className="text-emerald-700 font-semibold">{summary.completedActions.length} Items</span>
                  </div>

                  {summary.completedActions.map((action, idx) => (
                    <div
                      key={action.id || idx}
                      className="bg-white p-3.5 rounded-xl border border-emerald-100 shadow-2xs hover:border-emerald-300 transition-all space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                          <Check className="w-2.5 h-2.5" />
                          {action.categoryLabel}
                        </span>
                        {action.completedAt && (
                          <span className="text-[10px] text-slate-400 font-medium">
                            {action.completedAt.includes("T") ? action.completedAt.split("T")[0] : action.completedAt}
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-bold text-slate-900">{action.title}</div>
                      <p className="text-[11px] text-slate-600 leading-normal">{action.detail}</p>
                      {action.officerResponsible && (
                        <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                          Officer: <span className="font-semibold text-slate-600">{action.officerResponsible}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Scanned Documents Breakdown */}
                <Card className="border-slate-200 bg-white shadow-2xs">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <UploadCloud className="w-4 h-4 text-indigo-600" />
                        <span>केस में संलग्न साक्ष्य दस्तावेज़ (Documents on Docket)</span>
                      </div>
                      <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
                        {summary.scannedDocumentsHighlights.length} Files
                      </span>
                    </div>

                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {summary.scannedDocumentsHighlights.map((doc, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-slate-900 truncate" title={doc.name}>
                              {doc.name}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded font-semibold shrink-0">
                              {doc.type}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500">{doc.summary}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* COLUMN 2: क्या बाकी है (PENDING ACTIONS & NEXT STEPS) */}
            {(activeSection === "all" || activeSection === "pending") && (
              <div className="space-y-4">
                <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                    <h3 className="text-base font-bold text-amber-950">
                      क्या बाकी है (Pending Work & Next Steps)
                    </h3>
                  </div>
                  <p className="text-xs text-amber-900 leading-relaxed">
                    {summary.pendingWorkSummary}
                  </p>
                </div>

                {/* List of Pending Action Cards */}
                <div className="space-y-2.5">
                  <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                    <span>लंबित कार्यवाहियां (Outstanding Tasks)</span>
                    <span className="text-amber-700 font-semibold">{summary.pendingActions.length} Pending</span>
                  </div>

                  {summary.pendingActions.map((action, idx) => {
                    const isCritical = action.status === "CRITICAL";
                    return (
                      <div
                        key={action.id || idx}
                        className={`bg-white p-3.5 rounded-xl border shadow-2xs hover:shadow-xs transition-all space-y-1.5 ${
                          isCritical ? "border-rose-200 bg-rose-50/20" : "border-amber-200"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                              isCritical ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            <AlertTriangle className="w-2.5 h-2.5" />
                            {action.categoryLabel}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                              isCritical ? "bg-rose-600 text-white" : "bg-slate-200 text-slate-700"
                            }`}
                          >
                            {action.status}
                          </span>
                        </div>
                        <div className="text-xs font-bold text-slate-900">{action.title}</div>
                        <p className="text-[11px] text-slate-600 leading-normal">{action.detail}</p>
                        {action.officerResponsible && (
                          <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-100 flex items-center justify-between">
                            <span>
                              Action Required By:{" "}
                              <strong className="text-slate-700">{action.officerResponsible}</strong>
                            </span>
                            {action.remarks && <span className="text-rose-600 font-semibold">{action.remarks}</span>}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Actionable Recommendations for EO & SHO */}
                <Card className="border-indigo-100 bg-gradient-to-br from-indigo-50/60 to-white shadow-2xs">
                  <CardContent className="p-4 space-y-3">
                    <div className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                      <ListTodo className="w-4 h-4 text-indigo-600" />
                      <span>जांच अधिकारी हेतु अनुशंसित कार्य (Recommended EO Action Items)</span>
                    </div>
                    <ul className="space-y-1.5 text-xs text-indigo-900">
                      {summary.recommendedEoActions.map((rec, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <ArrowRight className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="pt-2 border-t border-indigo-100">
                      <div className="text-xs font-bold text-indigo-950 flex items-center gap-1.5 mb-1.5">
                        <Scale className="w-3.5 h-3.5 text-indigo-600" />
                        <span>थाना प्रभारी (SHO) दिशा-निर्देश (Supervisory Directions)</span>
                      </div>
                      <ul className="space-y-1.5 text-xs text-indigo-900">
                        {summary.recommendedShoDirections.map((dir, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <ArrowRight className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                            <span>{dir}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
