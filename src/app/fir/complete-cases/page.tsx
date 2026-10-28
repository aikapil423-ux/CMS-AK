"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useGuardedRouter as useRouter } from "@/hooks/useGuardedRouter";
import {
  FileCheck2,
  FileText,
  Search,
  Filter,
  Calendar,
  Clock,
  ArrowRight,
  Eye,
  CheckCircle2,
  AlertCircle,
  Scale,
  Building2,
  User,
  ShieldAlert,
  RotateCcw,
  Sparkles,
  RefreshCw,
  X,
  Check,
  Gavel,
  History,
} from "lucide-react";
import { persistentFirService as firService } from "@/services/persistentFirService";
import { FIRItem, FIRCompletionEvent } from "@/types";
import { formatDate } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { isFirVisibleToUser, getAuthoritativeTrackingState } from "@/lib/firIntegrity";
import { MOCK_ENQUIRY_OFFICERS } from "@/lib/mockData";

function CompleteCasesContent() {
  const router = useRouter();
  const { t } = useLanguage();
  const { currentUser } = useAuth();

  const [firs, setFirs] = useState<FIRItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedStation, setSelectedStation] = useState<string>("ALL");
  const [selectedYear, setSelectedYear] = useState<string>("ALL");

  // Re-open Action Modal State
  const [reopenModalOpen, setReopenModalOpen] = useState<boolean>(false);
  const [selectedFirForReopen, setSelectedFirForReopen] = useState<FIRItem | null>(null);
  const [reopenReason, setReopenReason] = useState<string>("");
  const [reopenCourtName, setReopenCourtName] = useState<string>("");
  const [reopenOrderNumber, setReopenOrderNumber] = useState<string>("");
  const [reopenOrderDate, setReopenOrderDate] = useState<string>("");
  const [reopenAssignedIoId, setReopenAssignedIoId] = useState<string>("");
  const [reopenConfirmed, setReopenConfirmed] = useState<boolean>(false);
  const [isSubmittingReopen, setIsSubmittingReopen] = useState<boolean>(false);

  // Load all FIRs
  const loadFirs = () => {
    try {
      const all = firService.getAllFirs();
      setFirs(all);
    } catch (e) {
      console.error("Failed to load FIRs", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFirs();
  }, []);

  // Filter completed cases scoped to user permissions
  const completedFirs = useMemo(() => {
    return firs.filter((fir) => {
      // 1. Authoritative tracking state must be COMPLETED
      const tracking = fir.trackingState || getAuthoritativeTrackingState(fir);
      if (tracking !== "COMPLETED") return false;

      // 2. Permission / visibility check
      if (currentUser && !isFirVisibleToUser(currentUser, fir)) {
        return false;
      }

      // 3. Station filter
      if (selectedStation !== "ALL" && fir.policeStation !== selectedStation) {
        return false;
      }

      // 4. Year filter
      if (selectedYear !== "ALL" && String(fir.firYear) !== selectedYear) {
        return false;
      }

      // 5. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const num = (fir.firNumber || "").toLowerCase();
        const cctns = (fir.cctnsFirNumber || "").toLowerCase();
        const comp = (fir.complainantName || "").toLowerCase();
        const acts = (fir.actsAndSections || "").toLowerCase();
        const io = (fir.assignedIoName || "").toLowerCase();
        const reason = (fir.completionReason || "").toLowerCase();
        if (
          !num.includes(q) &&
          !cctns.includes(q) &&
          !comp.includes(q) &&
          !acts.includes(q) &&
          !io.includes(q) &&
          !reason.includes(q)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [firs, currentUser, selectedStation, selectedYear, searchQuery]);

  // Unique police stations & years for filter dropdowns
  const policeStations = useMemo(() => {
    const set = new Set<string>();
    firs.forEach((f) => {
      if (f.policeStation) set.add(f.policeStation);
    });
    return Array.from(set).sort();
  }, [firs]);

  const availableYears = useMemo(() => {
    const set = new Set<string>();
    firs.forEach((f) => {
      if (f.firYear) set.add(String(f.firYear));
    });
    return Array.from(set).sort().reverse();
  }, [firs]);

  // Authorized roles check for Re-open action (DSP, SP, ASP, Super Admin, SHO)
  const isAuthorizedToReopen = useMemo(() => {
    if (!currentUser) return false;
    const r = (currentUser.role || "").toUpperCase();
    return (
      r === "SUPER_ADMIN" ||
      r === "SP_DISTRICT" ||
      r === "ASP_HQ" ||
      r === "DSP_SUBDIV" ||
      r === "SHO"
    );
  }, [currentUser]);

  // Open Reopen Modal
  const handleOpenReopenModal = (fir: FIRItem) => {
    setSelectedFirForReopen(fir);
    setReopenReason("");
    setReopenCourtName("Chief Judicial Magistrate (CJM), Panipat");
    setReopenOrderNumber("");
    setReopenOrderDate(new Date().toISOString().split("T")[0]);
    setReopenAssignedIoId(fir.assignedIoId || "");
    setReopenConfirmed(false);
    setReopenModalOpen(true);
  };

  // Submit Reopen Action
  const handleConfirmReopen = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFirForReopen) return;

    if (!reopenReason.trim()) {
      alert("⚠️ वैधानिक आवश्यकता: केस पुनः खोलने का स्पष्ट कारण (Reason for Reopening) दर्ज करना अनिवार्य है।");
      return;
    }

    if (!reopenConfirmed) {
      alert("⚠️ कृपया घोषणा की पुष्टि करें (Please confirm the reopening declaration).");
      return;
    }

    setIsSubmittingReopen(true);
    try {
      const selectedIo = MOCK_ENQUIRY_OFFICERS.find((io) => io.id === reopenAssignedIoId);

      const updated = await firService.reopenCompletedCase({
        firId: selectedFirForReopen.id,
        reopenedBy: currentUser?.name || "Competent Authority",
        reopenedByRank: currentUser?.role || "Authorized Officer",
        reason: reopenReason.trim(),
        orderNumber: reopenOrderNumber.trim() || undefined,
        orderDate: reopenOrderDate || undefined,
        courtName: reopenCourtName.trim() || undefined,
        assignedIoId: reopenAssignedIoId || undefined,
        assignedIoName: selectedIo?.name || selectedFirForReopen.assignedIoName,
      });

      if (updated) {
        setReopenModalOpen(false);
        loadFirs();
        alert(`✅ केस ${updated.firNumber} सफलतापूर्वक 'FIR Part B → Re-open' कार्यक्षेत्र में स्थानांतरित कर दिया गया है।`);
        // Navigate to Part B Re-open tab
        router.push("/fir/part-b?tab=REOPEN");
      }
    } catch (err: any) {
      alert(`⚠️ त्रुटि: ${err.message || "केस पुनः खोलने में समस्या आई"}`);
    } finally {
      setIsSubmittingReopen(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-6 rounded-2xl shadow-lg border border-slate-700">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              Complete cases (अंतिम रूप से निस्तारित वाद)
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
            अंतिम रूप से निस्तारित अथवा न्यायालय में पूर्ण चालान प्रस्तुत होने के पश्चात बंद की गई प्राथमिकी (COMPLETED)।
            आवश्यकता पड़ने पर सक्षम प्राधिकारी द्वारा नियमानुसार केस को पुनः (Re-open) किया जा सकता है।
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="bg-white/10 backdrop-blur-xs border border-white/15 px-4 py-2 rounded-xl text-center">
            <span className="text-[10px] uppercase font-bold text-slate-300 block">कुल निस्तारित वाद</span>
            <span className="text-2xl font-black text-emerald-400 font-mono">{completedFirs.length}</span>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Search Box */}
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="FIR नं, CCTNS, वादी का नाम, धाराएं, IO या निस्तारण कारण खोजें..."
              className="w-full pl-9 pr-8 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Station Filter */}
          <div className="sm:col-span-3">
            <select
              value={selectedStation}
              onChange={(e) => setSelectedStation(e.target.value)}
              className="w-full py-2 px-3 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              <option value="ALL">सभी थाने (All Police Stations)</option>
              {policeStations.map((ps) => (
                <option key={ps} value={ps}>
                  {ps}
                </option>
              ))}
            </select>
          </div>

          {/* Year Filter */}
          <div className="sm:col-span-3">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full py-2 px-3 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white font-mono"
            >
              <option value="ALL">सभी वर्ष (All Years)</option>
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  वर्ष {yr}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Case List Table / Cards */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200 text-slate-400">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
          <p className="text-xs">निस्तारित केस लोड हो रहे हैं...</p>
        </div>
      ) : completedFirs.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-dashed border-slate-300 text-slate-500 space-y-2">
          <CheckCircle2 className="w-10 h-10 text-emerald-500/50 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">कोई निस्तारित केस नहीं मिला</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            वर्तमान चयन एवं खोज मानदंडों के अनुसार 'Complete cases' में कोई रिकॉर्ड उपलब्ध नहीं है।
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {completedFirs.map((fir) => {
            const latestCompletion = fir.completionHistory && fir.completionHistory.length > 0
              ? fir.completionHistory[fir.completionHistory.length - 1]
              : null;

            return (
              <div
                key={fir.id}
                className="bg-white rounded-xl border border-slate-200 hover:border-slate-300 p-4 shadow-xs transition-all hover:shadow-md"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left Column: FIR Numbers, Complainant, Station, Acts */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/fir/${fir.id}`}
                        className="font-mono text-base font-black text-slate-900 hover:text-emerald-700 transition-colors"
                      >
                        {fir.firNumber}
                      </Link>

                      {fir.cctnsFirNumber && (
                        <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                          {fir.cctnsFirNumber}
                        </span>
                      )}

                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        COMPLETED
                      </span>

                      {fir.previouslyReopened && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                          <History className="w-2.5 h-2.5" />
                          Previously Reopened ({fir.reopenHistory?.length || 1}x)
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-600 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="font-semibold text-slate-800">वादी: {fir.complainantName}</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-slate-600">{fir.policeStation}, {fir.district}</span>
                      <span className="text-slate-300">•</span>
                      <span className="font-medium text-slate-700">विवेचक (IO): {fir.assignedIoName || "—"}</span>
                    </div>

                    <div className="text-[11px] text-slate-500 font-mono">
                      धाराएं: <span className="font-sans font-bold text-slate-700">{fir.actsAndSections || "—"}</span>
                    </div>

                    {/* Completion Details Banner */}
                    <div className="mt-2 p-2.5 bg-emerald-50/60 rounded-lg border border-emerald-200/80 text-xs text-emerald-950 flex flex-wrap items-center gap-x-4 gap-y-1">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-emerald-800 block">निस्तारण आधार:</span>
                        <span className="font-black text-emerald-900">
                          {latestCompletion?.reason || fir.completionReason || fir.finalFormType || "Complete Court Submission"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-emerald-800 block">निस्तारण दिनांक:</span>
                        <span className="font-semibold font-mono text-emerald-900">
                          {formatDate(latestCompletion?.completedAt || fir.finalFormDate || fir.updatedAt)}
                        </span>
                      </div>
                      {(latestCompletion?.courtName || fir.courtName) && (
                        <div>
                          <span className="text-[10px] uppercase font-bold text-emerald-800 block">संबद्ध न्यायालय:</span>
                          <span className="font-semibold text-emerald-900">
                            {latestCompletion?.courtName || fir.courtName}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Contextual Action Buttons */}
                  <div className="flex flex-row lg:flex-col items-center lg:items-end gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                    <Link
                      href={`/fir/${fir.id}`}
                      className="px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Details</span>
                    </Link>

                    {/* Re-open Action: Permitted exclusively for authorized officers on COMPLETED cases */}
                    {isAuthorizedToReopen ? (
                      <button
                        type="button"
                        onClick={() => handleOpenReopenModal(fir)}
                        className="px-3.5 py-1.5 text-xs font-bold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-200 hover:border-purple-300 rounded-lg transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                        title="Reopen this completed case for further investigation / supplementary challan"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-purple-600" />
                        <span>Re-open FIR</span>
                      </button>
                    ) : (
                      <span
                        className="text-[10px] text-slate-400 italic px-2 py-1"
                        title="Only authorized supervisory officers (SHO/DSP/SP) can reopen completed cases"
                      >
                        Re-open (Restricted)
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* RE-OPEN ACTION MODAL */}
      {reopenModalOpen && selectedFirForReopen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-900 via-purple-800 to-purple-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-purple-200">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black tracking-tight">
                    Re-open Completed FIR (केस पुनः खोलने की वैधानिक प्रक्रिया)
                  </h3>
                  <p className="text-[11px] text-purple-200 font-mono">
                    {selectedFirForReopen.firNumber} • {selectedFirForReopen.policeStation}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReopenModalOpen(false)}
                className="text-purple-300 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleConfirmReopen} className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl space-y-1">
                <p className="text-[11px] font-bold text-purple-950 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                  <span>वैधानिक नियम (BNSS Section 193(9)):</span>
                </p>
                <p className="text-[11px] text-purple-900 leading-relaxed">
                  केस पुनः खोलने पर कोई नई प्राथमिकी या डुप्लीकेट केस नहीं बनेगा। यही केस <strong>FIR Part B → Re-open</strong> कार्यक्षेत्र में सक्रिय हो जाएगा और नया चालान तैयार होने पर सीधे <strong>Under checking</strong> में चला जाएगा।
                </p>
              </div>

              {/* Reopen Reason (Required) */}
              <div className="space-y-1">
                <label className="font-bold text-slate-800 flex items-center justify-between">
                  <span>केस पुनः खोलने का ठोस आधार व कारण (Reason for Reopening) *</span>
                  <span className="text-[10px] text-red-600 font-semibold">अनिवार्य</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={reopenReason}
                  onChange={(e) => setReopenReason(e.target.value)}
                  placeholder="उदा. नए साक्ष्य/सह-अभियुक्त का पता चलने पर अग्रिम विवेचना हेतु अथवा सक्षम न्यायालय के आदेशानुसार..."
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              {/* Order Number & Court Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">संबद्ध न्यायालय / सक्षम प्राधिकारी</label>
                  <input
                    type="text"
                    value={reopenCourtName}
                    onChange={(e) => setReopenCourtName(e.target.value)}
                    placeholder="उदा. CJM Court Panipat"
                    className="w-full p-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">आदेश / संदर्भ संख्या (Order/Ref No.)</label>
                  <input
                    type="text"
                    value={reopenOrderNumber}
                    onChange={(e) => setReopenOrderNumber(e.target.value)}
                    placeholder="उदा. CRT-ORD/2026/881"
                    className="w-full p-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">आदेश दिनांक (Order Date)</label>
                  <input
                    type="date"
                    max={new Date().toISOString().split("T")[0]}
                    value={reopenOrderDate}
                    onChange={(e) => setReopenOrderDate(e.target.value)}
                    className="w-full p-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">अग्रिम जांच हेतु विवेचक (Assigned IO)</label>
                  <select
                    value={reopenAssignedIoId}
                    onChange={(e) => setReopenAssignedIoId(e.target.value)}
                    className="w-full p-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-purple-500 bg-white"
                  >
                    <option value="">-- पूर्व विवेचक यथावत रखें ({selectedFirForReopen.assignedIoName || "None"}) --</option>
                    {MOCK_ENQUIRY_OFFICERS.map((io) => (
                      <option key={io.id} value={io.id}>
                        {io.name} ({io.rank})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Explicit Confirmation Checkbox */}
              <div className="pt-2 border-t border-slate-200">
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={reopenConfirmed}
                    onChange={(e) => setReopenConfirmed(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer"
                  />
                  <span className="text-[11px] text-slate-700 leading-normal">
                    मैं प्रमाणित करता हूँ कि सक्षम न्यायालय अथवा पुलिस अधीक्षक/वरिष्ठ अधिकारी के निर्देशानुसार इस केस में वैधानिक अग्रिम विवेचना (Further Investigation) हेतु पुनः खोलने की अनुमति प्रदान की गई है।
                  </span>
                </label>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setReopenModalOpen(false)}
                  disabled={isSubmittingReopen}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  रद्द करें (Cancel)
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReopen || !reopenConfirmed}
                  className={`px-4 py-2 text-xs font-bold text-white rounded-lg transition-all shadow-sm flex items-center gap-1.5 cursor-pointer ${
                    reopenConfirmed && !isSubmittingReopen
                      ? "bg-purple-700 hover:bg-purple-800 shadow-purple-200"
                      : "bg-slate-300 cursor-not-allowed"
                  }`}
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${isSubmittingReopen ? "animate-spin" : ""}`} />
                  <span>{isSubmittingReopen ? "पुनः खुल रहा है..." : "Re-open Case (स्वीकृत करें)"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CompleteCasesPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-slate-400">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
          <p className="text-xs">Loading Complete Cases...</p>
        </div>
      }
    >
      <CompleteCasesContent />
    </Suspense>
  );
}
