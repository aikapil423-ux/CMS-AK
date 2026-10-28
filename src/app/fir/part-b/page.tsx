"use client";
import { FinalReportCheckingBoard } from "@/components/fir/FinalReportCheckingBoard";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
  Send,
  Building2,
  User,
  ShieldAlert,
  ChevronRight,
  Sparkles,
  RefreshCw,
  SlidersHorizontal,
  Upload,
  UserCheck,
  X,
  Check,
  Gavel,
  Paperclip,
  RotateCcw,
  Plus,
} from "lucide-react";
import { persistentFirService as firService } from "@/services/persistentFirService";
import { FIRItem, ChallanMode, ChallanType } from "@/types";
import { formatDate } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { isFirVisibleToUser } from "@/lib/firIntegrity";

// 3 Authoritative Tabs as per Specification
export type PartBTab = "PARTIAL" | "UNDER_CHECKING" | "REOPEN";

interface TabConfig {
  key: PartBTab;
  title: string;
  hindiTitle: string;
  badge: string;
  badgeColor: string;
  desc: string;
  actionName: string;
}

const TAB_CONFIGS: Record<PartBTab, TabConfig> = {
  PARTIAL: {
    key: "PARTIAL",
    title: "Partial",
    hindiTitle: "आंशिक चालान (Partial Challan)",
    badge: "Pending Final Challan",
    badgeColor: "bg-blue-50 text-blue-800 border-blue-200",
    desc: "वे FIR जिनका आंशिक चालान (Partial Challan) न्यायालय में प्रस्तुत हो चुका है और अग्रिम विवेचना (Further Investigation u/s 193(9) BNSS) जारी है।",
    actionName: "Prepare Supplementary Challan",
  },
  UNDER_CHECKING: {
    key: "UNDER_CHECKING",
    title: "Under checking",
    hindiTitle: "जांच / समीक्षाधीन (Challan Issued)",
    badge: "Awaiting Court Submission",
    badgeColor: "bg-amber-50 text-amber-800 border-amber-200",
    desc: "वे FIR जिनका चालान (Initial अथवा Supplementary) तैयार / निर्गत हो चुका है और न्यायालय में प्रस्तुति हेतु प्रक्रियाधीन है।",
    actionName: "Record Court Submission",
  },
  REOPEN: {
    key: "REOPEN",
    title: "Re-open",
    hindiTitle: "पुनः खुली फाइलें (Reopened Cases)",
    badge: "Further Investigation Active",
    badgeColor: "bg-purple-50 text-purple-800 border-purple-200",
    desc: "न्यायालय के आदेश / सक्षम प्राधिकारी के निर्देशानुसार पुनः खुली फाइलें। चालान निर्गत होते ही यह केस 'Under checking' में चला जाएगा।",
    actionName: "Prepare Challan",
  },
};

function FIRPartBContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t } = useLanguage();
  const { currentUser } = useAuth();

  const tabParam = searchParams.get("tab")?.toUpperCase();
  const initialTab: PartBTab =
    tabParam === "UNDER_CHECKING" || tabParam === "UNDER-CHECKING" || tabParam === "CHECKING"
      ? "UNDER_CHECKING"
      : tabParam === "REOPEN" || tabParam === "RE-OPEN"
      ? "REOPEN"
      : "PARTIAL";

  const [activeTab, setActiveTab] = useState<PartBTab>(initialTab);
  const [firs, setFirs] = useState<FIRItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStation, setSelectedStation] = useState<string>("ALL");

  // Court Submission Modal State (For Under checking tab)
  const [submittingFir, setSubmittingFir] = useState<FIRItem | null>(null);
  const [courtReceiptNo, setCourtReceiptNo] = useState("");
  const [submissionRemarks, setSubmissionRemarks] = useState("");
  const [isSubmittingCourt, setIsSubmittingCourt] = useState(false);

  // Prepare Challan Modal State (Quick issuance from Partial / Re-open tab)
  const [challanModalFir, setChallanModalFir] = useState<FIRItem | null>(null);
  const [challanMode, setChallanMode] = useState<ChallanMode>("COMPLETE");
  const [challanCourtName, setChallanCourtName] = useState("Court of CJM, Panipat");
  const [challanBriefFacts, setChallanBriefFacts] = useState("");
  const [isIssuingChallan, setIsIssuingChallan] = useState(false);

  const fetchFirs = () => {
    setLoading(true);
    try {
      const data = firService.getAllFirs();
      setFirs(data);
    } catch (e) {
      console.error("Failed to load FIRs for Part B:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFirs();
    const unsub = firService.subscribe(() => {
      fetchFirs();
    });
    return unsub;
  }, []);

  // Update URL param without full reload
  const handleTabChange = (newTab: PartBTab) => {
    setActiveTab(newTab);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", newTab.toLowerCase());
    window.history.pushState({}, "", url.toString());
  };

  // Role & Jurisdiction Visibility
  const visibleFirs = useMemo(() => {
    return firs.filter((fir) => isFirVisibleToUser(currentUser, fir));
  }, [firs, currentUser]);

  // Tab Scoped Counts (Exclusive Partitioning across Part B)
  const counts = useMemo(() => {
    const partial = visibleFirs.filter((f) => f.trackingState === "PART_B_PARTIAL").length;
    const underChecking = visibleFirs.filter((f) => f.trackingState === "PART_B_UNDER_CHECKING").length;
    const reopen = visibleFirs.filter((f) => f.trackingState === "PART_B_REOPEN").length;
    return { partial, underChecking, reopen };
  }, [visibleFirs]);

  // Tab Specific Filtered Items
  const currentTabFirs = useMemo(() => {
    const targetTrackingState =
      activeTab === "PARTIAL"
        ? "PART_B_PARTIAL"
        : activeTab === "UNDER_CHECKING"
        ? "PART_B_UNDER_CHECKING"
        : "PART_B_REOPEN";

    return visibleFirs.filter((fir) => {
      // 1. Authoritative Tracking State match
      if (fir.trackingState !== targetTrackingState) {
        return false;
      }

      // 2. Station Filter
      if (selectedStation !== "ALL" && fir.policeStation !== selectedStation) {
        return false;
      }

      // 3. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesNo = fir.firNumber.toLowerCase().includes(q);
        const matchesComplainant = fir.complainantName.toLowerCase().includes(q);
        const matchesIo = (fir.assignedIoName || "").toLowerCase().includes(q);
        const matchesActs = fir.actsAndSections.toLowerCase().includes(q);
        const matchesAccused = fir.accusedList?.some((a) => a.name.toLowerCase().includes(q)) ?? false;
        const matchesChallanNo = fir.challanRecords?.some((c) => c.challanNumber.toLowerCase().includes(q)) ?? false;
        return matchesNo || matchesComplainant || matchesIo || matchesActs || matchesAccused || matchesChallanNo;
      }

      return true;
    });
  }, [visibleFirs, activeTab, selectedStation, searchQuery]);

  // Police Station list for filter
  const policeStations = useMemo(() => {
    const set = new Set<string>();
    visibleFirs.forEach((f) => {
      if (f.policeStation) set.add(f.policeStation);
    });
    return Array.from(set);
  }, [visibleFirs]);

  // Handle Recording Court Submission (From Under Checking)
  const handleConfirmCourtSubmission = async () => {
    if (!submittingFir) return;
    setIsSubmittingCourt(true);
    try {
      await firService.recordCourtSubmission({
        firId: submittingFir.id,
        submittedBy: `${currentUser.name} (${currentUser.role})`,
        courtReceiptNo: courtReceiptNo.trim() || undefined,
        remarks: submissionRemarks.trim() || undefined,
      });

      setSubmittingFir(null);
      setCourtReceiptNo("");
      setSubmissionRemarks("");
      fetchFirs();
    } catch (e: any) {
      alert("Error recording court submission: " + (e?.message || e));
    } finally {
      setIsSubmittingCourt(false);
    }
  };

  // Handle Issuing Challan (From Re-open or Partial)
  const handleConfirmIssueChallan = async () => {
    if (!challanModalFir) return;
    setIsIssuingChallan(true);
    try {
      await firService.issueChallan({
        firId: challanModalFir.id,
        challanMode,
        courtName: challanCourtName.trim() || (challanModalFir.courtName || "Court of CJM, Panipat"),
        issuedBy: `${currentUser.name} (${currentUser.role})`,
        issuedByRank: currentUser.rankDisplay || "IO",
        briefFacts: challanBriefFacts.trim() || undefined,
      });

      setChallanModalFir(null);
      setChallanBriefFacts("");
      fetchFirs();
      // Move to Under Checking tab where the issued challan now resides
      handleTabChange("UNDER_CHECKING");
    } catch (e: any) {
      alert("Error issuing challan: " + (e?.message || e));
    } finally {
      setIsIssuingChallan(false);
    }
  };

  const currentConfig = TAB_CONFIGS[activeTab];

  return (
    <div className="space-y-6 pb-16 max-w-[1600px] mx-auto px-3 sm:px-6">
      <FinalReportCheckingBoard station={currentUser.stationName} district={["SP", "SP_DISTRICT", "DSP_SUBDIV"].includes(currentUser.role) ? currentUser.district : undefined} userId={currentUser.id} />
      {/* Page Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#0b192c] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                <FileCheck2 className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900">FIR Part B</h1>
                <p className="text-xs text-slate-500 font-medium">
                  {t("Authoritative Tracking: Partial • Under checking • Re-open")}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/fir/complete-cases"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>View Complete cases &rarr;</span>
            </Link>
          </div>
        </div>

        {/* 3 Tabs: Partial | Under checking | Re-open */}
        <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => handleTabChange("PARTIAL")}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 cursor-pointer border-b-2 ${
              activeTab === "PARTIAL"
                ? "border-blue-600 text-blue-800 bg-blue-50/70"
                : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <span>{TAB_CONFIGS.PARTIAL.title}</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                activeTab === "PARTIAL"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-200 text-slate-700"
              }`}
            >
              {counts.partial}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("UNDER_CHECKING")}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 cursor-pointer border-b-2 ${
              activeTab === "UNDER_CHECKING"
                ? "border-amber-600 text-amber-900 bg-amber-50/70"
                : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <span>{TAB_CONFIGS.UNDER_CHECKING.title}</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                activeTab === "UNDER_CHECKING"
                  ? "bg-amber-600 text-white"
                  : "bg-slate-200 text-slate-700"
              }`}
            >
              {counts.underChecking}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("REOPEN")}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 cursor-pointer border-b-2 ${
              activeTab === "REOPEN"
                ? "border-purple-600 text-purple-900 bg-purple-50/70"
                : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <span>{TAB_CONFIGS.REOPEN.title}</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                activeTab === "REOPEN"
                  ? "bg-purple-600 text-white"
                  : "bg-slate-200 text-slate-700"
              }`}
            >
              {counts.reopen}
            </span>
          </button>
        </div>

        {/* Tab Guidance Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <span>{currentConfig.hindiTitle}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold border ${currentConfig.badgeColor}`}>
                {currentConfig.badge}
              </span>
            </div>
            <p className="text-slate-600 text-[11px]">{currentConfig.desc}</p>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 justify-between pt-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="FIR No, Accused, Complainant, Challan No..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-800"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedStation}
              onChange={(e) => setSelectedStation(e.target.value)}
              aria-label="Filter by Police Station"
              className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none"
            >
              <option value="ALL">All Police Stations</option>
              {policeStations.map((ps) => (
                <option key={ps} value={ps}>
                  {ps}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={fetchFirs}
              className="p-1.5 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
              title="Refresh list"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Case List Content */}
      {loading ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
          <RefreshCw className="w-6 h-6 animate-spin text-slate-400 mx-auto mb-2" />
          <p className="text-xs text-slate-500 font-medium">Loading Part B records...</p>
        </div>
      ) : currentTabFirs.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 space-y-2">
          <FileCheck2 className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">No cases in {currentConfig.title}</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {activeTab === "PARTIAL" && "There are currently no cases with a pending partial supplementary investigation."}
            {activeTab === "UNDER_CHECKING" && "No issued challans are currently waiting for court submission."}
            {activeTab === "REOPEN" && "No completed cases have been reopened. Re-open action is available on the Complete cases page."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Desktop Table View */}
          <div className="hidden lg:block bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">FIR Number</th>
                  <th className="py-3 px-4">Station</th>
                  <th className="py-3 px-4">Complainant / Accused</th>
                  <th className="py-3 px-4">Acts &amp; Sections</th>
                  <th className="py-3 px-4">Challan / Order Details</th>
                  <th className="py-3 px-4">Assigned IO</th>
                  <th className="py-3 px-4 text-right">Contextual Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentTabFirs.map((fir) => {
                  const latestChallan = fir.challanRecords?.[0];
                  const latestReopen = fir.reopenHistory?.[0];

                  return (
                    <tr key={fir.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        <Link href={`/fir/${fir.id}`} className="hover:text-blue-600 hover:underline">
                          {fir.firNumber}
                        </Link>
                        <span className="block text-[10px] text-slate-400 font-sans font-normal">
                          {formatDate(fir.firDate)}
                        </span>
                        {fir.previouslyReopened && (
                          <span className="inline-block mt-0.5 text-[9px] font-mono px-1 rounded bg-purple-50 text-purple-700 border border-purple-200">
                            Previously Reopened
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-slate-600 font-medium">
                        {fir.policeStation}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 truncate max-w-[180px]">
                          {fir.complainantName}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[180px]">
                          Accused: {fir.accusedList?.map((a) => a.name).join(", ") || "Unknown"}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-slate-600 max-w-[200px]">
                        <span className="line-clamp-2">{fir.actsAndSections}</span>
                      </td>

                      <td className="py-3 px-4">
                        {activeTab === "UNDER_CHECKING" && latestChallan && (
                          <div>
                            <span className="font-mono font-bold text-slate-900">
                              {latestChallan.challanNumber}
                            </span>
                            <span className={`ml-1.5 text-[10px] px-1.5 py-0.2 rounded font-bold border ${
                              latestChallan.challanMode === "COMPLETE"
                                ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                                : "bg-blue-50 text-blue-800 border-blue-300"
                            }`}>
                              {latestChallan.challanMode} Mode
                            </span>
                            <span className="block text-[10px] text-slate-500">
                              Issued: {latestChallan.issuedAt} ({latestChallan.challanType})
                            </span>
                          </div>
                        )}

                        {activeTab === "PARTIAL" && latestChallan && (
                          <div>
                            <span className="font-mono text-xs font-semibold text-slate-800">
                              {latestChallan.challanNumber}
                            </span>
                            <span className="ml-1 text-[10px] px-1 rounded bg-blue-100 text-blue-900 font-bold border border-blue-200">
                              Partial Submitted
                            </span>
                            <span className="block text-[10px] text-slate-500">
                              Court: {latestChallan.courtName} ({latestChallan.courtSubmittedAt || "Submitted"})
                            </span>
                          </div>
                        )}

                        {activeTab === "REOPEN" && (
                          <div>
                            <span className="text-[11px] font-semibold text-purple-900 block truncate max-w-[180px]">
                              {latestReopen?.reason || "Court Order for Further Investigation"}
                            </span>
                            <span className="text-[10px] text-slate-500 block">
                              Order: {latestReopen?.orderNumber || "Direct Order"} ({latestReopen?.orderDate || latestReopen?.reopenedAt || "Recent"})
                            </span>
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-medium text-slate-900 block truncate max-w-[140px]">
                          {fir.assignedIoName || "Not Assigned"}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-mono">
                          {fir.assignedIoRank || "IO"}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        {activeTab === "UNDER_CHECKING" && (
                          <button
                            type="button"
                            onClick={() => {
                              setSubmittingFir(fir);
                              setCourtReceiptNo("");
                              setSubmissionRemarks("");
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-xs cursor-pointer transition-colors"
                          >
                            <Gavel className="w-3.5 h-3.5" />
                            <span>Record Court Submission</span>
                          </button>
                        )}

                        {activeTab === "PARTIAL" && (
                          <button
                            type="button"
                            onClick={() => {
                              setChallanModalFir(fir);
                              setChallanMode("COMPLETE");
                              setChallanCourtName(fir.courtName || "Court of CJM, Panipat");
                              setChallanBriefFacts("");
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs cursor-pointer transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Prepare Supplementary Challan</span>
                          </button>
                        )}

                        {activeTab === "REOPEN" && (
                          <button
                            type="button"
                            onClick={() => {
                              setChallanModalFir(fir);
                              setChallanMode("COMPLETE");
                              setChallanCourtName(fir.courtName || "Court of CJM, Panipat");
                              setChallanBriefFacts("");
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-700 hover:bg-purple-800 text-white shadow-xs cursor-pointer transition-colors"
                          >
                            <Scale className="w-3.5 h-3.5" />
                            <span>Prepare Challan</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card-Based View */}
          <div className="lg:hidden space-y-3">
            {currentTabFirs.map((fir) => {
              const latestChallan = fir.challanRecords?.[0];
              const latestReopen = fir.reopenHistory?.[0];

              return (
                <div key={fir.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Link href={`/fir/${fir.id}`} className="font-mono font-bold text-sm text-slate-900 hover:underline">
                        {fir.firNumber}
                      </Link>
                      <span className="text-[10px] text-slate-400 block">{formatDate(fir.firDate)}</span>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      {fir.policeStation}
                    </span>
                  </div>

                  <div className="text-xs space-y-1 text-slate-700">
                    <div><strong>Complainant:</strong> {fir.complainantName}</div>
                    <div className="truncate"><strong>Offence:</strong> {fir.actsAndSections}</div>
                    <div><strong>IO:</strong> {fir.assignedIoName || "—"}</div>

                    {activeTab === "UNDER_CHECKING" && latestChallan && (
                      <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-950 mt-2">
                        <strong>Issued Challan:</strong> {latestChallan.challanNumber} ({latestChallan.challanMode} Mode)
                        <span className="block text-slate-600 text-[10px]">Issued at: {latestChallan.issuedAt}</span>
                      </div>
                    )}

                    {activeTab === "PARTIAL" && latestChallan && (
                      <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg text-[11px] text-blue-950 mt-2">
                        <strong>Partial Submitted:</strong> {latestChallan.challanNumber}
                        <span className="block text-slate-600 text-[10px]">Court: {latestChallan.courtName}</span>
                      </div>
                    )}

                    {activeTab === "REOPEN" && latestReopen && (
                      <div className="p-2 bg-purple-50 border border-purple-200 rounded-lg text-[11px] text-purple-950 mt-2">
                        <strong>Reopened Reason:</strong> {latestReopen.reason}
                        <span className="block text-slate-600 text-[10px]">Order: {latestReopen.orderNumber || "Direct"}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex justify-end">
                    {activeTab === "UNDER_CHECKING" && (
                      <button
                        type="button"
                        onClick={() => {
                          setSubmittingFir(fir);
                          setCourtReceiptNo("");
                          setSubmissionRemarks("");
                        }}
                        className="w-full py-2 rounded-lg text-xs font-bold bg-amber-600 text-white flex items-center justify-center gap-1.5"
                      >
                        <Gavel className="w-3.5 h-3.5" />
                        <span>Record Court Submission</span>
                      </button>
                    )}

                    {activeTab === "PARTIAL" && (
                      <button
                        type="button"
                        onClick={() => {
                          setChallanModalFir(fir);
                          setChallanMode("COMPLETE");
                          setChallanCourtName(fir.courtName || "Court of CJM, Panipat");
                          setChallanBriefFacts("");
                        }}
                        className="w-full py-2 rounded-lg text-xs font-bold bg-blue-600 text-white flex items-center justify-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Prepare Supplementary Challan</span>
                      </button>
                    )}

                    {activeTab === "REOPEN" && (
                      <button
                        type="button"
                        onClick={() => {
                          setChallanModalFir(fir);
                          setChallanMode("COMPLETE");
                          setChallanCourtName(fir.courtName || "Court of CJM, Panipat");
                          setChallanBriefFacts("");
                        }}
                        className="w-full py-2 rounded-lg text-xs font-bold bg-purple-700 text-white flex items-center justify-center gap-1.5"
                      >
                        <Scale className="w-3.5 h-3.5" />
                        <span>Prepare Challan</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL 1: RECORD COURT SUBMISSION (Under Checking) */}
      {submittingFir && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Gavel className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-sm text-slate-900">Record Court Submission</h3>
              </div>
              <button
                type="button"
                onClick={() => setSubmittingFir(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <div><strong>FIR Number:</strong> <span className="font-mono font-bold text-slate-900">{submittingFir.firNumber}</span></div>
                <div><strong>Court:</strong> {submittingFir.courtName || "Court of CJM, Panipat"}</div>
                {submittingFir.challanRecords?.[0] && (
                  <div>
                    <strong>Challan Number:</strong> {submittingFir.challanRecords[0].challanNumber} (
                    <span className="font-bold text-blue-700">{submittingFir.challanRecords[0].challanMode} Mode</span>)
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Court Diary / Receipt Number (वकालत / कोर्ट पावती नंबर)
                </label>
                <input
                  type="text"
                  value={courtReceiptNo}
                  onChange={(e) => setCourtReceiptNo(e.target.value)}
                  placeholder="e.g. CRT/PNP/2026/894"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Submission Notes / Remarks
                </label>
                <textarea
                  value={submissionRemarks}
                  onChange={(e) => setSubmissionRemarks(e.target.value)}
                  rows={2}
                  placeholder="e.g. Challan presented before Chief Judicial Magistrate. Formal receipt obtained."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-slate-800"
                />
              </div>

              {submittingFir.challanRecords?.[0]?.challanMode === "COMPLETE" ? (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-[11px] text-emerald-900">
                  ℹ️ <strong>Rule 4:</strong> This challan was issued in <strong>Complete Mode</strong>. Recording court submission will move this case to <strong>Complete cases</strong>.
                </div>
              ) : (
                <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-[11px] text-blue-900">
                  ℹ️ <strong>Rule 4:</strong> This challan was issued in <strong>Partial Mode</strong>. Recording court submission will move this case to <strong>Part B &rarr; Partial</strong> for further investigation.
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSubmittingFir(null)}
                className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmittingCourt}
                onClick={handleConfirmCourtSubmission}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                {isSubmittingCourt ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>Confirm Court Submission</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: PREPARE / ISSUE CHALLAN (Partial -> Under Checking, Re-open -> Under Checking) */}
      {challanModalFir && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-sm text-slate-900">
                  {activeTab === "PARTIAL" ? "Issue Supplementary Challan" : "Issue Challan for Reopened Case"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setChallanModalFir(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <div><strong>FIR Number:</strong> <span className="font-mono font-bold text-slate-900">{challanModalFir.firNumber}</span></div>
                <div><strong>Offence:</strong> {challanModalFir.actsAndSections}</div>
                <div><strong>Current IO:</strong> {challanModalFir.assignedIoName || currentUser.name}</div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Challan Mode (चालान का प्रकार) <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label
                    className={`p-2.5 rounded-lg border flex flex-col items-center gap-1 cursor-pointer transition-colors ${
                      challanMode === "COMPLETE"
                        ? "border-emerald-500 bg-emerald-50/70 text-emerald-950 font-bold"
                        : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="challanMode"
                      value="COMPLETE"
                      checked={challanMode === "COMPLETE"}
                      onChange={() => setChallanMode("COMPLETE")}
                      className="sr-only"
                    />
                    <span>Complete Mode</span>
                    <span className="text-[10px] font-normal text-slate-500 text-center">पूर्ण चालान (Final Disposal)</span>
                  </label>

                  <label
                    className={`p-2.5 rounded-lg border flex flex-col items-center gap-1 cursor-pointer transition-colors ${
                      challanMode === "PARTIAL"
                        ? "border-blue-500 bg-blue-50/70 text-blue-950 font-bold"
                        : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="challanMode"
                      value="PARTIAL"
                      checked={challanMode === "PARTIAL"}
                      onChange={() => setChallanMode("PARTIAL")}
                      className="sr-only"
                    />
                    <span>Partial Mode</span>
                    <span className="text-[10px] font-normal text-slate-500 text-center">आंशिक चालान (Investigation Continues)</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Court of Submission
                </label>
                <input
                  type="text"
                  value={challanCourtName}
                  onChange={(e) => setChallanCourtName(e.target.value)}
                  placeholder="Court of CJM, Panipat"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Brief Facts / Investigation Summary
                </label>
                <textarea
                  value={challanBriefFacts}
                  onChange={(e) => setChallanBriefFacts(e.target.value)}
                  rows={2}
                  placeholder="Investigation completed against named accused persons. Forwarded for court scrutiny."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-slate-800"
                />
              </div>

              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-950">
                ℹ️ <strong>Rule 3 &amp; 6:</strong> Issuing this challan will move this case to <strong>Part B &rarr; Under checking</strong>. Selecting Complete mode does not complete the case immediately; completion happens upon court submission.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setChallanModalFir(null)}
                className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isIssuingChallan}
                onClick={handleConfirmIssueChallan}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-[#0b192c] hover:bg-slate-800 text-white shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                {isIssuingChallan ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>Issue Challan &rarr; Under checking</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function FIRPartBPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs text-slate-500">
          Loading FIR Part B...
        </div>
      }
    >
      <FIRPartBContent />
    </Suspense>
  );
}
