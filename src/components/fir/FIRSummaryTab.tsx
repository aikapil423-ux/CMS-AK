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
  TrendingUp,
  Scale,
  ListTodo,
  AlertCircle,
  Eye,
  Layers,
  Calendar,
  Lock,
} from "lucide-react";
import {
  FIRItem,
  InvestigationSummaryReport,
  InvestigationSummaryActionItem,
} from "@/types";
import { FirSummaryService } from "@/services/firSummaryService";
import { firService } from "@/services/firService";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils";

interface FIRSummaryTabProps {
  fir: FIRItem;
  onUpdateFir: (updated: FIRItem) => void;
  currentUser?: any;
}

export function FIRSummaryTab({
  fir,
  onUpdateFir,
  currentUser,
}: FIRSummaryTabProps) {
  const [summary, setSummary] = useState<InvestigationSummaryReport | null>(
    fir.investigationSummary || null
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStep, setProcessStep] = useState(0);
  const [copied, setCopied] = useState(false);
  const [activeSection, setActiveSection] = useState<"all" | "completed" | "pending">("all");

  const PROCESS_STEPS = [
    {
      title: "प्राथमिकी व विधिक धाराओं का विश्लेषण (Analyzing FIR Overview & Statutory Sections)",
      desc: "Reading FIR allegations, invoked BNS/special acts, complainant credentials, and jurisdiction...",
    },
    {
      title: "केस डायरी (Zimni) व विवेचनात्मक कदमों की समीक्षा (Inspecting Case Diaries & Zimnis)",
      desc: "Scanning crime scene inspections, IO notes, witness statements u/s 180 BNSS, and site plans...",
    },
    {
      title: "संलग्न साक्ष्य व बरामदगी मेमो की जांच (Evaluating Evidentiary Records & Seizure Memos)",
      desc: "Inspecting medical MLR, FSL forensic reports, CDR surveillance, and seized property memos...",
    },
    {
      title: "कार्य प्रगति व 60/90 दिन वैधानिक अवधि का संकलन (Synthesizing Progress & Statutory Timelines)",
      desc: "Evaluating completed milestones against statutory Section 193 BNSS charge sheet deadlines...",
    },
  ];

  const handleGenerateOrUpdate = async () => {
    setIsProcessing(true);
    setProcessStep(0);

    // Multi-step progressive animation matching complaint profile
    for (let i = 0; i < 4; i++) {
      setProcessStep(i);
      await new Promise((resolve) => setTimeout(resolve, 380));
    }

    try {
      const generated = FirSummaryService.buildLocalSummary(
        fir,
        summary,
        currentUser?.name
          ? `${currentUser.role || "Officer"} ${currentUser.name}`
          : "CMS Investigative Intelligence"
      );

      setSummary(generated);

      const updatedFir: FIRItem = {
        ...fir,
        investigationSummary: generated,
        updatedAt: new Date().toISOString(),
      };

      onUpdateFir(updatedFir);
      firService.updateFir(fir.id, { investigationSummary: generated });
    } catch (err) {
      console.error("Failed to generate or persist FIR summary:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopySummary = () => {
    if (!summary) return;
    const textToCopy = `=====================================================
HARYANA POLICE - CMS FIR INVESTIGATION CASE SUMMARY
FIR NO: ${summary.complaintNumber}
VERSION: v${summary.version} (Updated: ${formatDateTime(summary.updatedAt)})
STAGE: ${summary.currentStage} | PROGRESS: ${summary.progressPercentage}%
=====================================================

1. CASE SYNOPSIS:
${summary.caseSynopsis}

2. कितना काम हुआ है अब तक (WORK DONE SO FAR):
${summary.workDoneSummary}

COMPLETED ACTIONS:
${summary.completedActions.map((a, i) => `${i + 1}. [${a.status}] ${a.title} - ${a.detail}`).join("\n")}

3. शेष आवश्यक कदम (PENDING MANDATORY ACTIONS):
${(summary.pendingActionItems || summary.pendingActions || []).map((a, i) => `${i + 1}. [${a.priority || "NORMAL"}] ${a.title} (Deadline: ${a.deadline || "Standard"}) - ${a.detail}`).join("\n")}

4. STATUTORY DEADLINES (वैधानिक समय-सीमाएं):
${(summary.statutoryDeadlines || []).map((d) => `• ${d.ruleName}: ${d.description} [Status: ${d.status}]`).join("\n")}

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

  const pendingList = summary ? summary.pendingActionItems || summary.pendingActions || [] : [];
  const deadlinesList = summary ? summary.statutoryDeadlines || [] : [];

  return (
    <div className="space-y-6">
      {/* Top Banner & Action Header (Mirrored from Complaint Profile) */}
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
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              एफ.आई.आर. <strong>Overview</strong>, संलग्न <strong>Documents</strong>, तथा केस डायरी <strong>(Zimni History)</strong> का संपूर्ण विश्लेषण — अब तक हुए कार्य और शेष आवश्यक विधिक कदमों का पारदर्शी विवरण।
            </p>
          </div>

          {/* Action Buttons (Exact Mirror from Complaint Profile) */}
          <div className="flex items-center gap-2 self-start md:self-center shrink-0 flex-wrap">
            {summary ? (
              <>
                <Button
                  onClick={handleCopySummary}
                  variant="outline"
                  size="sm"
                  className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs gap-1.5 cursor-pointer backdrop-blur-sm"
                  title="Copy full case summary to clipboard"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Copied!" : "Copy Summary"}</span>
                </Button>
                <Button
                  onClick={handlePrintSummary}
                  variant="outline"
                  size="sm"
                  className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs gap-1.5 cursor-pointer backdrop-blur-sm"
                  title="Print official investigation summary"
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
                विवेचना पूर्णता स्तर (Investigation Completion Status):
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
                  {summary ? "Updating FIR Investigation Summary..." : "Deep FIR Case Processing in Progress..."}
                </h4>
                <p className="text-xs text-indigo-700">
                  Analyzing FIR Overview, Case Diaries (Zimnis), Evidentiary Documents, and History...
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
                    className={`p-3 rounded-xl border transition-all text-xs flex items-start gap-3 ${
                      isDone
                        ? "bg-emerald-50/70 border-emerald-200 text-emerald-900"
                        : isCurrent
                        ? "bg-white border-indigo-300 ring-2 ring-indigo-500/20 shadow-xs text-indigo-950 font-medium"
                        : "bg-slate-50 border-slate-200 text-slate-400"
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
                      <p className="font-bold">{step.title}</p>
                      <p className="text-[11px] opacity-80 mt-0.5">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Content Body */}
      {summary && !isProcessing && (
        <div className="space-y-6 animate-in fade-in-50">
          {/* Executive Standing & Synopsis */}
          <Card className="border-slate-200 shadow-xs bg-white">
            <CardContent className="p-5 space-y-4 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>कार्यकारी संक्षेप व वर्तमान विधिक स्थिति (Executive Standing)</span>
                </span>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200 font-mono">
                  {summary.currentStage}
                </span>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <p className="text-slate-800 leading-relaxed font-sans text-xs sm:text-sm">
                  {summary.caseSynopsis}
                </p>
                <div className="pt-2 border-t border-slate-200 flex flex-wrap gap-4 text-[11px] text-slate-600">
                  <span>
                    अन्वेषण अवधि: <strong>{fir.daysPending || 0} दिन</strong>
                  </span>
                  <span>
                    केस डायरी प्रविष्टियाँ: <strong>{fir.caseDiaries?.length || 0} Zimnis</strong>
                  </span>
                  <span>
                    साक्ष्य दस्तावेज़: <strong>{fir.documents?.length || 0} Files</strong>
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section Filter Pills */}
          <div className="flex items-center gap-2 pb-1 border-b border-slate-200">
            <button
              type="button"
              onClick={() => setActiveSection("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                activeSection === "all"
                  ? "bg-[#0b192c] text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              All Items ({summary.completedActions.length + pendingList.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveSection("completed")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeSection === "completed"
                  ? "bg-emerald-700 text-white"
                  : "bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100"
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>कितना काम हुआ है (Completed: {summary.completedActions.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSection("pending")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeSection === "pending"
                  ? "bg-amber-700 text-white"
                  : "bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100"
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>क्या काम बाकी है (Pending: {pendingList.length})</span>
            </button>
          </div>

          {/* Section 1: Work Done So Far */}
          {(activeSection === "all" || activeSection === "completed") && (
            <Card className="border-emerald-200 bg-white shadow-xs">
              <CardContent className="p-5 space-y-4 text-xs">
                <div className="flex items-center justify-between pb-3 border-b border-emerald-100">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-emerald-950 text-sm">
                        कितना काम हुआ है अब तक (Work Done So Far)
                      </h3>
                      <p className="text-[11px] text-emerald-700">
                        विवेचना, साक्ष्य संकलन, गवाह बयान तथा दर्ज की गई केस डायरी प्रविष्टियां
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                    {summary.completedActions.length} Milestones Achieved
                  </span>
                </div>

                <div className="space-y-2.5">
                  {summary.completedActions.map((act, idx) => (
                    <div
                      key={act.id || idx}
                      className="p-3 rounded-xl bg-emerald-50/40 border border-emerald-200/80 space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-emerald-950 text-xs flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{act.title}</span>
                        </span>
                        <span className="text-[10px] font-mono text-emerald-700 font-semibold">
                          {act.completedAt}
                        </span>
                      </div>
                      <p className="text-slate-700 text-xs leading-relaxed pl-5">{act.detail}</p>
                      {(act.actor || act.officerResponsible) && (
                        <p className="text-[10px] text-slate-500 pl-5 font-mono">
                          अधिकारी: <strong>{act.actor || act.officerResponsible}</strong>
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Section 2: Pending Mandatory Tasks */}
          {(activeSection === "all" || activeSection === "pending") && (
            <Card className="border-amber-200 bg-white shadow-xs">
              <CardContent className="p-5 space-y-4 text-xs">
                <div className="flex items-center justify-between pb-3 border-b border-amber-100">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-amber-100 text-amber-800">
                      <ListTodo className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-amber-950 text-sm">
                        क्या काम बाकी है (Pending Mandatory Action Items)
                      </h3>
                      <p className="text-[11px] text-amber-700">
                        विधिक प्रक्रिया, साक्ष्य सत्यापन, तथा अंतिम रिपोर्ट हेतु शेष अनिवार्यताएं
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                    {pendingList.length} Actions Required
                  </span>
                </div>

                <div className="space-y-2.5">
                  {pendingList.map((act, idx) => (
                    <div
                      key={act.id || idx}
                      className="p-3 rounded-xl bg-amber-50/40 border border-amber-200/80 space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-950 text-xs flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          <span>{act.title}</span>
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                              act.priority === "HIGH"
                                ? "bg-red-100 text-red-800 border border-red-200"
                                : "bg-amber-100 text-amber-800 border border-amber-200"
                            }`}
                          >
                            {act.priority || "NORMAL"}
                          </span>
                          {act.deadline && (
                            <span className="text-[10px] font-mono text-slate-500 font-semibold">
                              {act.deadline}
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-slate-700 text-xs leading-relaxed pl-5">{act.detail}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Section 3: Statutory Deadlines & Prima Facie Observation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-slate-200 shadow-xs bg-white">
              <CardContent className="p-4 space-y-3 text-xs">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <Scale className="w-4 h-4 text-indigo-600" />
                  <h4 className="font-bold text-slate-900">
                    वैधानिक समय-सीमाएं (Statutory BNSS Deadlines)
                  </h4>
                </div>
                <div className="space-y-2">
                  {deadlinesList.map((dl, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <strong className="text-slate-800">{dl.ruleName}</strong>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            dl.status === "MET"
                              ? "bg-emerald-100 text-emerald-800"
                              : dl.status === "ON_TRACK"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {dl.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600">{dl.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-xs bg-white">
              <CardContent className="p-4 space-y-3 text-xs">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <ShieldAlert className="w-4 h-4 text-purple-600" />
                  <h4 className="font-bold text-slate-900">
                    प्रथम दृष्टया निष्कर्ष व अग्रिम कार्यवाही (Prima Facie Observation)
                  </h4>
                </div>
                <div className="p-3 bg-purple-50/50 border border-purple-200 rounded-lg space-y-2">
                  <p className="text-purple-950 font-medium leading-relaxed">
                    {summary.primaFacieObservation}
                  </p>
                  <div className="pt-2 border-t border-purple-200 flex items-center justify-between text-[11px]">
                    <span className="text-purple-800">संस्तुत परिणाम:</span>
                    <strong className="text-purple-950 font-bold">
                      {summary.suggestedOutcome}
                    </strong>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
