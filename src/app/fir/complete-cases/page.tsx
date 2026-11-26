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
import { firPersistence, persistentFirService as firService } from "@/services/persistentFirService";
import { FIRItem, FIRCompletionEvent } from "@/types";
import { formatDate, getTodayIsoIST } from "@/lib/utils";
import { DatePickerDDMMYYYY } from "@/components/ui/date-picker-ddmmyyyy";
import { useEscapeKey } from "@/hooks/useEscapeKey";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { isFirVisibleToUser, getAuthoritativeTrackingState } from "@/lib/firIntegrity";
import { useFirIoRoster } from "@/hooks/useFirIoRoster";

function CompleteCasesContent() {
  const router = useRouter();
  const { t } = useLanguage();
  const { currentUser } = useAuth();

  const [firs, setFirs] = useState<FIRItem[]>([]);
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedStation, setSelectedStation] = useState<string>("ALL");
  const [selectedYear, setSelectedYear] = useState<string>("ALL");

  // Re-open Action Modal State
  const [reopenModalOpen, setReopenModalOpen] = useState<boolean>(false);
  useEscapeKey(reopenModalOpen, () => setReopenModalOpen(false));
  const [selectedFirForReopen, setSelectedFirForReopen] = useState<FIRItem | null>(null);
  const [reopenReason, setReopenReason] = useState<string>("");
  const { officers: ioRoster, loading: ioRosterLoading, error: ioRosterError } = useFirIoRoster(selectedFirForReopen?.policeStation, selectedFirForReopen?.district);
  const [reopenCourtName, setReopenCourtName] = useState<string>("");
  const [reopenOrderNumber, setReopenOrderNumber] = useState<string>("");
  const [reopenOrderDate, setReopenOrderDate] = useState<string>("");
  const [reopenAssignedIoId, setReopenAssignedIoId] = useState<string>("");
  const [reopenConfirmed, setReopenConfirmed] = useState<boolean>(false);
  const [isSubmittingReopen, setIsSubmittingReopen] = useState<boolean>(false);

  // Load all FIRs
  const loadFirs = () => {
    try {
      if (firPersistence.getError()) throw new Error(firPersistence.getError());
      const all = firService.getAllFirs();
      setLoadError("");
      setFirs(all);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Could not load cases.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFirs();
    return firPersistence.subscribe(loadFirs);
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
    setReopenCourtName(fir.courtName || "");
    setReopenOrderNumber("");
    setReopenOrderDate(getTodayIsoIST());
    setReopenAssignedIoId("");
    setReopenConfirmed(false);
    setReopenModalOpen(true);
  };

  // Submit Reopen Action
  const handleConfirmReopen = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFirForReopen) return;

    if (!reopenReason.trim()) {
      alert("Statutory Requirement: Reason for reopening the case is mandatory.");
      return;
    }

    if (!reopenConfirmed) {
      alert("Please confirm the statutory reopening declaration before proceeding.");
      return;
    }

    setIsSubmittingReopen(true);
    try {
      const selectedIo = ioRoster.find((io) => io.id === reopenAssignedIoId);
      if (reopenAssignedIoId && !selectedIo) throw new Error("Select an eligible IO from this station.");

      const updated = await firService.reopenCompletedCase({
        firId: selectedFirForReopen.id,
        reopenedBy: currentUser?.name || "Competent Authority",
        reopenedByRank: currentUser?.role || "Authorized Officer",
        reason: reopenReason.trim(),
        orderNumber: reopenOrderNumber.trim() || undefined,
        orderDate: reopenOrderDate || undefined,
        courtName: reopenCourtName.trim() || undefined,
        assignedIoId: selectedIo?.id,
        assignedIoRank: selectedIo?.rank,
        assignedIoPno: selectedIo?.pno,
        assignedIoBeltNumber: selectedIo?.beltNumber || selectedIo?.pno,
        assignedIoPhone: selectedIo?.phone,
        assignedIoName: selectedIo?.name || selectedFirForReopen.assignedIoName,
      });

      if (updated) {
        setReopenModalOpen(false);
        loadFirs();
        alert(`Case ${updated.firNumber} moved to 'FIR Part B → Re-open' workspace.`);
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
      {/* Page Header with Integrated Search & Filters in One Clean Row */}
      <div className="bg-[#203c88] text-white p-3 sm:p-3.5 rounded-2xl border border-blue-900 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Title */}
          <h1 className="cms-complete-cases-title text-lg sm:text-xl font-bold tracking-tight text-white whitespace-nowrap shrink-0">
            {t("Complete cases", "Complete cases")}
          </h1>

          {/* Search Box & Filters in Same Row next to Title */}
          <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-0 justify-end">
            {/* Search Box */}
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t(
                  "FIR नं, CCTNS, वादी, धाराएं, IO खोजें...",
                  "Search FIR No, CCTNS, Complainant, Acts, IO..."
                )}
                className="w-full pl-9 pr-8 py-1.5 text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-400 shadow-2xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Station Filter */}
            <div className="shrink-0">
              <select
                value={selectedStation}
                onChange={(e) => setSelectedStation(e.target.value)}
                aria-label="Filter by Police Station"
                className="py-1.5 px-2.5 text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-400 shadow-2xs cursor-pointer max-w-[180px]"
              >
                <option value="ALL">{t("सभी थाने", "All Police Stations")}</option>
                {policeStations.map((ps) => (
                  <option key={ps} value={ps}>
                    {ps}
                  </option>
                ))}
              </select>
            </div>

            {/* Year Filter */}
            <div className="shrink-0">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                aria-label="Filter by Year"
                className="py-1.5 px-2.5 text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-400 shadow-2xs cursor-pointer font-mono"
              >
                <option value="ALL">{t("सभी वर्ष", "All Years")}</option>
                {availableYears.map((yr) => (
                  <option key={yr} value={yr}>
                    {t(`वर्ष ${yr}`, `Year ${yr}`)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Case List Table / Cards */}
      {loadError && <div role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">Could not load current cases. {loadError} <button type="button" className="underline" onClick={() => { setLoading(true); void firPersistence.refresh().catch(() => {}).finally(loadFirs); }}>Retry</button></div>}
      {loading ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-400">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
          <p className="text-xs">Loading completed cases...</p>
        </div>
      ) : completedFirs.length === 0 && loadError ? null : completedFirs.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 space-y-2">
          <CheckCircle2 className="w-10 h-10 text-emerald-500/50 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No Completed Cases Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No completed FIR records match the selected station, year, or search filters.
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
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 p-4 shadow-xs transition-all hover:shadow-md"
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
                      <span className="font-semibold text-slate-800">Complainant: {fir.complainantName}</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-slate-600">{fir.policeStation}, {fir.district}</span>
                      <span className="text-slate-300">•</span>
                      <span className="font-medium text-slate-700">Investigating Officer: {fir.assignedIoName || "—"}</span>
                    </div>

                    <div className="text-[11px] text-slate-500 font-mono">
                      Acts &amp; Sections: <span className="font-sans font-bold text-slate-700">{fir.actsAndSections || "—"}</span>
                    </div>

                    {/* Completion Details Banner */}
                    <div className="mt-2 p-2.5 bg-emerald-50/60 rounded-lg border border-emerald-200/80 text-xs text-emerald-950 flex flex-wrap items-center gap-x-4 gap-y-1">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-emerald-800 block">Disposal Basis:</span>
                        <span className="font-black text-emerald-900">
                          {latestCompletion?.reason || fir.completionReason || fir.finalFormType || "Complete Court Submission"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-emerald-800 block">Completion Date:</span>
                        <span className="font-semibold font-mono text-emerald-900">
                          {formatDate(latestCompletion?.completedAt || fir.finalFormDate || fir.updatedAt)}
                        </span>
                      </div>
                      {(latestCompletion?.courtName || fir.courtName) && (
                        <div>
                          <span className="text-[10px] uppercase font-bold text-emerald-800 block">Concerned Court:</span>
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
          <div role="dialog" aria-modal="true" className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-900 via-purple-800 to-purple-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-purple-200">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black tracking-tight">
                    Re-open Completed FIR (Statutory Further Investigation)
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
              <div className="p-3 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-xl space-y-1">
                <p className="text-[11px] font-bold text-purple-950 dark:text-purple-200 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                  <span>Statutory Rule (BNSS Section 193(9)):</span>
                </p>
                <p className="text-[11px] text-purple-900 dark:text-purple-300 leading-relaxed">
                  Reopening a completed case will not create a duplicate FIR. This record becomes active in the <strong>FIR Part B → Re-open</strong> workspace and moves directly to <strong>Under checking</strong> once a supplementary challan is prepared.
                </p>
              </div>

              {/* Reopen Reason (Required) */}
              <div className="space-y-1">
                <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                  <span>Reason for Reopening *</span>
                  <span className="text-[10px] text-red-600 dark:text-red-400 font-semibold">Required</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={reopenReason}
                  onChange={(e) => setReopenReason(e.target.value)}
                  placeholder="e.g., Further investigation ordered on discovery of fresh evidence / arrest of co-accused per Court direction..."
                  className="w-full p-2.5 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              {/* Order Number & Court Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Court / Competent Authority</label>
                  <input
                    type="text"
                    value={reopenCourtName}
                    onChange={(e) => setReopenCourtName(e.target.value)}
                    placeholder={`e.g., CJM Court ${selectedFirForReopen.district || "Panipat"}`}
                    className="w-full p-2 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Order / Reference No.</label>
                  <input
                    type="text"
                    value={reopenOrderNumber}
                    onChange={(e) => setReopenOrderNumber(e.target.value)}
                    placeholder="e.g., CRT-ORD/2026/881"
                    className="w-full p-2 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Order Date</label>
                  <DatePickerDDMMYYYY
                    size="sm"
                    max={getTodayIsoIST()}
                    value={reopenOrderDate}
                    onValueChange={setReopenOrderDate}
                    placeholder="DD/MM/YYYY"
                    className="w-full"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Assigned IO for Further Investigation</label>
                  <select
                    value={reopenAssignedIoId}
                    onChange={(e) => setReopenAssignedIoId(e.target.value)}
                    className="w-full p-2 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">-- Retain Previous IO ({selectedFirForReopen.assignedIoName || "None"}) --</option>
                    {ioRosterLoading && <option disabled>Loading officers…</option>}
                    {ioRosterError && <option disabled>{ioRosterError}</option>}
                    {!ioRosterLoading && !ioRosterError && ioRoster.length === 0 && <option disabled>No eligible officers</option>}
                    {ioRoster.map((io) => (
                      <option key={io.id} value={io.id}>
                        {io.name} ({io.rank})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Explicit Confirmation Checkbox */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={reopenConfirmed}
                    onChange={(e) => setReopenConfirmed(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer"
                  />
                  <span className="text-[11px] text-slate-700 dark:text-slate-300 leading-normal">
                    I certify that permission has been granted by the competent Court or Superintendent of Police / Senior Officer for statutory further investigation (BNSS 193(9)) in this case.
                  </span>
                </label>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setReopenModalOpen(false)}
                  disabled={isSubmittingReopen}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReopen || !reopenConfirmed}
                  className={`px-4 py-2 text-xs font-bold text-white rounded-lg transition-all shadow-sm flex items-center gap-1.5 cursor-pointer ${
                    reopenConfirmed && !isSubmittingReopen
                      ? "bg-purple-700 hover:bg-purple-800 shadow-purple-200"
                      : "bg-slate-300 dark:bg-slate-700 cursor-not-allowed"
                  }`}
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${isSubmittingReopen ? "animate-spin" : ""}`} />
                  <span>{isSubmittingReopen ? "Re-opening..." : "Approve & Re-open Case"}</span>
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
