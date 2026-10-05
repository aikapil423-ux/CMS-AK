"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BookOpen,
  Search,
  Lock,
  Calendar,
  Clock,
  Car,
  Package,
  Shield,
  RefreshCw,
  Eye,
  FileText,
  X,
  Printer,
  PlusCircle,
  Sparkles,
  Filter,
  CheckCircle2,
  AlertTriangle,
  History,
  ChevronLeft,
  ChevronRight,
  Layers,
  User,
  SlidersHorizontal,
  Download,
  Trash2,
  Edit,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { GeneralDiaryService } from "@/services/generalDiaryService";
import {
  GeneralDiaryRecord,
  GDSearchFilter,
  GDPaginatedResponse,
  GDEntryTypeConfig,
  GDStatus,
} from "@/types/generalDiary";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState, LoadingSkeleton } from "@/components/ui/state-views";
import { GDRecordModal } from "@/components/general-diary/GDRecordModal";
import { GDVerificationModal } from "@/components/general-diary/GDVerificationModal";

type ActiveTab = "REGISTER" | "SUGGESTIONS_DRAFTS" | "AUDIT_TRAIL";

function GeneralDiaryContent() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const searchParams = useSearchParams();
  const initialType = searchParams.get("type") || "ALL";
  const initialTab = (searchParams.get("tab") as ActiveTab) || "REGISTER";

  const [activeTab, setActiveTab] = useState<ActiveTab>(initialTab);
  const [types, setTypes] = useState<GDEntryTypeConfig[]>([]);

  // Search & Filter State
  const [keyword, setKeyword] = useState("");
  const [typeFilter, setTypeFilter] = useState(initialType);
  const [statusFilter, setStatusFilter] = useState<GDStatus | "ALL">("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [officerQuery, setOfficerQuery] = useState("");
  const [personName, setPersonName] = useState("");
  const [firNumber, setFirNumber] = useState("");
  const [complaintNumber, setComplaintNumber] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Pagination State
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [paginatedData, setPaginatedData] = useState<GDPaginatedResponse>({
    records: [],
    total: 0,
    page: 1,
    pageSize: 15,
    totalPages: 1,
    todayCount: 0,
    lockedCount: 0,
    verifiedCount: 0,
    draftCount: 0,
    suggestedCount: 0,
  });

  const [loading, setLoading] = useState(true);

  // Modals State
  const [selectedRecord, setSelectedRecord] = useState<GeneralDiaryRecord | null>(null);
  const [inspectModalOpen, setInspectModalOpen] = useState(false);
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [verifyingRecord, setVerifyingRecord] = useState<GeneralDiaryRecord | null>(null);
  const [printDailyRegisterOpen, setPrintDailyRegisterOpen] = useState(false);
  const [selectedPrintDate, setSelectedPrintDate] = useState(() => new Date().toISOString().split("T")[0]);

  // Load types config
  useEffect(() => {
    GeneralDiaryService.getAllTypes().then(setTypes);
  }, []);

  // Fetch paginated entries from service
  const fetchEntries = async () => {
    setLoading(true);

    const filter: GDSearchFilter = {
      keyword: keyword.trim() || undefined,
      typeCode: typeFilter !== "ALL" ? typeFilter : undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      officerQuery: officerQuery.trim() || undefined,
      personName: personName.trim() || undefined,
      firNumber: firNumber.trim() || undefined,
      complaintNumber: complaintNumber.trim() || undefined,
      vehicleNumber: vehicleNumber.trim() || undefined,
      page,
      pageSize,
    };

    // Filter by Tab
    if (activeTab === "REGISTER") {
      filter.status = statusFilter !== "ALL" ? statusFilter : "LOCKED";
    } else if (activeTab === "SUGGESTIONS_DRAFTS") {
      // Show suggestions or drafts
      filter.status = statusFilter !== "ALL" ? statusFilter : undefined;
    }

    try {
      const res = await GeneralDiaryService.getPaginatedEntries(filter);
      setPaginatedData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, [
    activeTab,
    keyword,
    typeFilter,
    statusFilter,
    startDate,
    endDate,
    officerQuery,
    personName,
    firNumber,
    complaintNumber,
    vehicleNumber,
    page,
    pageSize,
  ]);

  // Handle URL type filter param changes
  useEffect(() => {
    const qType = searchParams.get("type");
    if (qType) {
      setTypeFilter(qType);
    }
  }, [searchParams]);

  // Reset Filters
  const handleResetFilters = () => {
    setKeyword("");
    setTypeFilter("ALL");
    setStatusFilter("ALL");
    setStartDate("");
    setEndDate("");
    setOfficerQuery("");
    setPersonName("");
    setFirNumber("");
    setComplaintNumber("");
    setVehicleNumber("");
    setPage(1);
  };

  // Human Verification & Locking Flow
  const handleOpenVerifyModal = (rec: GeneralDiaryRecord) => {
    setVerifyingRecord(rec);
    setVerifyModalOpen(true);
  };

  const handleConfirmLock = async (remarks: string) => {
    if (!verifyingRecord) return;
    await GeneralDiaryService.verifyAndLockEntry(
      verifyingRecord.id,
      {
        name: currentUser.name,
        rank: currentUser.rankDisplay || "Inspector / SHO",
        beltNumber: currentUser.pno ? `${currentUser.pno.slice(-3)}/KKR` : "889/KKR",
        pno: currentUser.pno,
      },
      remarks
    );
    setVerifyModalOpen(false);
    setVerifyingRecord(null);
    fetchEntries();
  };

  // Delete Draft
  const handleDeleteDraft = async (id: string) => {
    if (window.confirm("क्या आप इस अनधिकृत ड्राफ्ट को डिलीट करना चाहते हैं?")) {
      await GeneralDiaryService.deleteDraft(id);
      fetchEntries();
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 pb-12">
      {/* Module Title Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#b8001f]">
              Punjab Police Rules 1934 • Rule 22.48
            </span>
            <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono font-bold border border-slate-200">
              Register No. II
            </span>
          </div>
          <h1 className="text-2xl font-black text-[#0b192c] tracking-tight mt-0.5">
            दैनिक रोजनामचा आम (General Diary)
          </h1>
          <p className="text-xs text-slate-500">
            {currentUser.stationName} • Statutory 24-hour chronological station log &amp; event register
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPrintDailyRegisterOpen(true)}
            className="text-xs font-bold gap-1.5 border-slate-300 bg-white hover:bg-slate-50 cursor-pointer shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5 text-slate-700" />
            <span>Print Daily Register</span>
          </Button>

          <Link href="/general-diary/new">
            <Button
              type="button"
              size="sm"
              className="bg-[#0b192c] hover:bg-slate-800 text-white text-xs font-bold gap-1.5 cursor-pointer shadow-xs"
            >
              <PlusCircle className="w-3.5 h-3.5 text-amber-300" />
              <span>+ New Roznamcha Entry</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Today's Locked Entries */}
        <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>आज की वैध रपटें</span>
            <BookOpen className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 font-mono">
            {paginatedData.todayCount}
          </p>
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
            Active 24-hr Diary
          </span>
        </div>

        {/* Total Locked & Immutable Entries */}
        <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>कुल लॉक रपटें (Locked)</span>
            <Lock className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 font-mono">
            {paginatedData.lockedCount}
          </p>
          <span className="text-[10px] text-slate-500">
            PPR 22.48 Immutable
          </span>
        </div>

        {/* Pending AI/System Suggestions */}
        <div
          onClick={() => setActiveTab("SUGGESTIONS_DRAFTS")}
          className="p-3.5 bg-purple-50/80 border border-purple-200 rounded-xl shadow-2xs space-y-1 cursor-pointer hover:border-purple-400 transition-colors"
        >
          <div className="flex items-center justify-between text-xs text-purple-800 font-bold">
            <span>सुझाव समीक्षा हेतु</span>
            <Sparkles className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-black text-purple-950 font-mono">
            {paginatedData.suggestedCount}
          </p>
          <span className="text-[10px] text-purple-700 font-semibold underline">
            Review &amp; Verify Now &rarr;
          </span>
        </div>

        {/* Unofficial Drafts */}
        <div
          onClick={() => setActiveTab("SUGGESTIONS_DRAFTS")}
          className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl shadow-2xs space-y-1 cursor-pointer hover:border-amber-400 transition-colors"
        >
          <div className="flex items-center justify-between text-xs text-amber-800 font-bold">
            <span>कच्चा ड्राफ्ट (Drafts)</span>
            <FileText className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-black text-amber-950 font-mono">
            {paginatedData.draftCount}
          </p>
          <span className="text-[10px] text-amber-700">
            Unofficial / Incomplete
          </span>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 text-xs sm:text-sm font-semibold gap-1">
        <button
          type="button"
          onClick={() => {
            setActiveTab("REGISTER");
            setPage(1);
          }}
          className={`px-4 py-2.5 border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "REGISTER"
              ? "border-blue-700 text-blue-950 font-black bg-blue-50/40"
              : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <BookOpen className="w-4 h-4 text-blue-600" />
          <span>रोजनामचा रजिस्टर (Official Locked Register)</span>
          <span className="text-[11px] font-mono bg-blue-100 text-blue-900 px-2 py-0.2 rounded-full font-bold">
            {paginatedData.lockedCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("SUGGESTIONS_DRAFTS");
            setPage(1);
          }}
          className={`px-4 py-2.5 border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "SUGGESTIONS_DRAFTS"
              ? "border-purple-700 text-purple-950 font-black bg-purple-50/40"
              : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <Sparkles className="w-4 h-4 text-purple-600" />
          <span>लंबित सुझाव व ड्राफ्ट (Pending Queue)</span>
          {(paginatedData.suggestedCount > 0 || paginatedData.draftCount > 0) && (
            <span className="text-[11px] font-mono bg-purple-200 text-purple-900 px-2 py-0.2 rounded-full font-bold">
              {paginatedData.suggestedCount + paginatedData.draftCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("AUDIT_TRAIL");
            setPage(1);
          }}
          className={`px-4 py-2.5 border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "AUDIT_TRAIL"
              ? "border-emerald-700 text-emerald-950 font-black bg-emerald-50/40"
              : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <History className="w-4 h-4 text-emerald-600" />
          <span>ऑडिट व इंस्पेक्शन लॉग (Audit Trail)</span>
        </button>
      </div>

      {/* Search & Filter Controls Card */}
      <Card className="border-slate-200 shadow-2xs">
        <CardContent className="p-4 space-y-3">
          {/* Main Search Row */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
            {/* Keyword Search */}
            <div className="sm:col-span-5 relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={keyword}
                onChange={(e) => {
                  setKeyword(e.target.value);
                  setPage(1);
                }}
                placeholder="Search GD No, subject, officer, FIR, narrative..."
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0b192c]"
              />
            </div>

            {/* Entry Type Selector */}
            <div className="sm:col-span-4">
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0b192c]"
              >
                <option value="ALL">All GD Types (सभी 21 प्रकार)</option>
                {types.map((t) => (
                  <option key={t.code} value={t.code}>
                    {t.nameHi} ({t.nameEn})
                  </option>
                ))}
              </select>
            </div>

            {/* Toggle Advanced Filters Button */}
            <div className="sm:col-span-3 flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className={`w-full text-xs font-semibold gap-1.5 ${
                  showAdvancedFilters ? "bg-slate-100 border-slate-400" : ""
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-600" />
                <span>{showAdvancedFilters ? "Hide Filters" : "Advanced Filters"}</span>
              </Button>

              {(keyword || typeFilter !== "ALL" || startDate || endDate || officerQuery || firNumber || complaintNumber || vehicleNumber) && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleResetFilters}
                  className="text-xs text-red-600 hover:bg-red-50"
                  title="Reset filters"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          </div>

          {/* Collapsible Advanced Filters Grid */}
          {showAdvancedFilters && (
            <div className="pt-3 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5 text-xs animate-in fade-in-50">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">From Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">To Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Officer Name / Belt</label>
                <input
                  type="text"
                  value={officerQuery}
                  onChange={(e) => {
                    setOfficerQuery(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Vikram / 742"
                  className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">FIR Number</label>
                <input
                  type="text"
                  value={firNumber}
                  onChange={(e) => {
                    setFirNumber(e.target.value);
                    setPage(1);
                  }}
                  placeholder="142/2026"
                  className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Complaint No</label>
                <input
                  type="text"
                  value={complaintNumber}
                  onChange={(e) => {
                    setComplaintNumber(e.target.value);
                    setPage(1);
                  }}
                  placeholder="CMP-..."
                  className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Vehicle Number</label>
                <input
                  type="text"
                  value={vehicleNumber}
                  onChange={(e) => {
                    setVehicleNumber(e.target.value);
                    setPage(1);
                  }}
                  placeholder="HR-07-..."
                  className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Register Table View */}
      {loading ? (
        <LoadingSkeleton count={5} />
      ) : paginatedData.records.length === 0 ? (
        <EmptyState
          title="No Roznamcha entries match the criteria"
          description="Try broadening your filters or create a new entry for this police station."
          actionLabel="+ New Roznamcha Entry"
          onAction={() => router.push("/general-diary/new")}
        />
      ) : (
        <div className="space-y-4">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#0b192c] text-white uppercase text-[11px] tracking-wider font-sans">
                <tr>
                  <th className="py-3 px-3.5 w-36">रपट नंबर (GD No)</th>
                  <th className="py-3 px-3 w-32">कार्यवाही समय</th>
                  <th className="py-3 px-3 w-48">प्रकार (Type)</th>
                  <th className="py-3 px-3">विषय व विवरण (Subject &amp; Narrative)</th>
                  <th className="py-3 px-3 w-40">मुलाज़िम मुताल्लिक</th>
                  <th className="py-3 px-3 w-28 text-center">स्थिति (Status)</th>
                  <th className="py-3 px-3 w-28 text-right">कार्यवाही</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {paginatedData.records.map((rec) => {
                  const isLocked = rec.isLocked;
                  const isSuggested = rec.status === "SUGGESTED";
                  const isDraft = rec.status === "DRAFT";

                  return (
                    <tr
                      key={rec.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSuggested
                          ? "bg-purple-50/30"
                          : isDraft
                          ? "bg-amber-50/30"
                          : ""
                      }`}
                    >
                      {/* GD Number & Daily Sequence */}
                      <td className="py-3 px-3.5 align-top">
                        <div className="space-y-0.5">
                          <span
                            className={`font-mono font-black text-xs px-2 py-0.5 rounded border inline-block ${
                              isLocked
                                ? "bg-blue-50 text-blue-900 border-blue-300"
                                : isSuggested
                                ? "bg-purple-100 text-purple-900 border-purple-300"
                                : "bg-amber-100 text-amber-900 border-amber-300"
                            }`}
                          >
                            {rec.gdNumber}
                          </span>
                          {rec.sequencePerDay > 0 && (
                            <span className="block text-[10px] text-slate-500 font-mono">
                              Daily Seq: #{rec.sequencePerDay}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Event Date & Time */}
                      <td className="py-3 px-3 align-top font-mono">
                        <div className="space-y-0.5 text-[11px]">
                          <span className="font-bold text-slate-900 block">
                            {rec.activityDateTime.split(" ")[1] || rec.activityDateTime}
                          </span>
                          <span className="text-slate-500 text-[10px] block">
                            {rec.activityDateTime.split(" ")[0]}
                          </span>
                        </div>
                      </td>

                      {/* Type */}
                      <td className="py-3 px-3 align-top">
                        <div className="space-y-0.5">
                          <p className="font-bold text-slate-900 leading-tight">
                            {rec.typeDisplayHi}
                          </p>
                          <p className="text-[10px] text-slate-500 font-medium">
                            {rec.typeDisplay}
                          </p>
                        </div>
                      </td>

                      {/* Subject & Snippet */}
                      <td className="py-3 px-3 align-top">
                        <div className="space-y-1">
                          <p className="font-bold text-slate-950 text-xs leading-snug">
                            {rec.subject}
                          </p>
                          <p className="text-slate-600 line-clamp-2 text-[11px] leading-relaxed">
                            {rec.narrative}
                          </p>
                          {/* Cross-reference Badges */}
                          {rec.relatedRecords && Object.values(rec.relatedRecords).some(Boolean) && (
                            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                              {rec.relatedRecords.complaintNumber && (
                                <span className="text-[10px] font-mono bg-blue-50 text-blue-800 border border-blue-200 px-1.5 py-0.2 rounded">
                                  CMP: {rec.relatedRecords.complaintNumber}
                                </span>
                              )}
                              {rec.relatedRecords.firNumber && (
                                <span className="text-[10px] font-mono bg-red-50 text-red-800 border border-red-200 px-1.5 py-0.2 rounded">
                                  FIR: {rec.relatedRecords.firNumber}
                                </span>
                              )}
                              {rec.relatedRecords.vehicleNumber && (
                                <span className="text-[10px] font-mono bg-slate-100 text-slate-800 border border-slate-200 px-1.5 py-0.2 rounded">
                                  Veh: {rec.relatedRecords.vehicleNumber}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Officer */}
                      <td className="py-3 px-3 align-top">
                        <div className="space-y-0.5">
                          <p className="font-bold text-slate-900 leading-tight">
                            {rec.entryForOfficer.name}
                          </p>
                          <p className="text-[10px] text-slate-500 font-mono">
                            {rec.entryForOfficer.rank} • {rec.entryForOfficer.beltNumber}
                          </p>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 align-top text-center">
                        {isLocked ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full">
                            <Lock className="w-2.5 h-2.5 text-emerald-700" />
                            <span>LOCKED</span>
                          </span>
                        ) : isSuggested ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-purple-100 text-purple-900 border border-purple-300 px-2 py-0.5 rounded-full">
                            <Sparkles className="w-2.5 h-2.5 text-purple-700" />
                            <span>SUGGESTED</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full">
                            <FileText className="w-2.5 h-2.5 text-amber-700" />
                            <span>DRAFT</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 align-top text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedRecord(rec);
                              setInspectModalOpen(true);
                            }}
                            className="p-1.5 h-7 text-xs font-semibold"
                            title="View official record"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-600" />
                          </Button>

                          {!isLocked && (
                            <>
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => handleOpenVerifyModal(rec)}
                                className="p-1.5 h-7 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold"
                                title="Human Verify & Lock entry"
                              >
                                <Lock className="w-3.5 h-3.5 text-amber-300" />
                              </Button>

                              {isDraft && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteDraft(rec.id)}
                                  className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                                  title="Delete draft"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </>
                          )}

                          {isLocked && (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedRecord(rec);
                                setInspectModalOpen(true);
                              }}
                              className="p-1.5 h-7 text-xs text-emerald-800 bg-emerald-50 border-emerald-300 hover:bg-emerald-100"
                              title="Print GD"
                            >
                              <Printer className="w-3.5 h-3.5 text-emerald-700" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card-based View */}
          <div className="md:hidden space-y-3">
            {paginatedData.records.map((rec) => (
              <Card key={rec.id} className="border-slate-200 shadow-2xs">
                <CardContent className="p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs bg-blue-50 text-blue-900 border border-blue-200 px-2 py-0.5 rounded">
                      {rec.gdNumber}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {rec.activityDateTime}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">
                      {rec.typeDisplayHi}
                    </span>
                    <h4 className="font-bold text-xs text-slate-900 leading-snug">
                      {rec.subject}
                    </h4>
                    <p className="text-slate-600 line-clamp-2 text-[11px] mt-1">
                      {rec.narrative}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">
                      {rec.entryForOfficer.name} ({rec.entryForOfficer.rank})
                    </span>

                    <div className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedRecord(rec);
                          setInspectModalOpen(true);
                        }}
                        className="text-xs"
                      >
                        View
                      </Button>
                      {!rec.isLocked && (
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handleOpenVerifyModal(rec)}
                          className="bg-emerald-700 text-white text-xs font-bold gap-1"
                        >
                          <Lock className="w-3 h-3 text-amber-300" /> Lock
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Server-Side Pagination Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white border border-slate-200 rounded-xl text-xs">
            <div className="text-slate-600">
              Showing entries <strong>{(page - 1) * pageSize + 1}</strong> to{" "}
              <strong>{Math.min(page * pageSize, paginatedData.total)}</strong> of{" "}
              <strong>{paginatedData.total}</strong> total
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-500">Per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="px-2 py-1 bg-slate-50 border border-slate-300 rounded font-bold"
              >
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>

              <div className="flex items-center gap-1 ml-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="p-1.5 h-7 text-xs"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </Button>
                <span className="font-bold px-2">
                  Page {page} of {paginatedData.totalPages}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(paginatedData.totalPages, p + 1))}
                  disabled={page >= paginatedData.totalPages}
                  className="p-1.5 h-7 text-xs"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Official GD Record Inspection Modal */}
      <GDRecordModal
        record={selectedRecord}
        isOpen={inspectModalOpen}
        onClose={() => setInspectModalOpen(false)}
        onVerifyAndLock={(rec) => {
          setInspectModalOpen(false);
          handleOpenVerifyModal(rec);
        }}
        canVerify={true}
      />

      {/* Human Verification & Lock Modal */}
      <GDVerificationModal
        record={verifyingRecord}
        isOpen={verifyModalOpen}
        onClose={() => setVerifyModalOpen(false)}
        onConfirmLock={handleConfirmLock}
        verifier={{
          name: currentUser.name,
          rank: currentUser.rankDisplay || "Inspector / SHO",
          beltNumber: currentUser.pno ? `${currentUser.pno.slice(-3)}/KKR` : "889/KKR",
          pno: currentUser.pno,
        }}
      />

      {/* Printable Daily Register Modal (PPR 22.48 Register No. II) */}
      {printDailyRegisterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-xs overflow-y-auto animate-in fade-in-50">
          <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[92vh]">
            <div className="no-print p-4 bg-[#0b192c] text-white flex items-center justify-between border-b border-slate-700">
              <div className="flex items-center gap-2">
                <Printer className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-sm text-white">
                  Daily Roznamcha Aam Ledger Print (PPR Rule 22.48)
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={selectedPrintDate}
                  onChange={(e) => setSelectedPrintDate(e.target.value)}
                  className="px-2 py-1 bg-slate-800 text-white rounded text-xs border border-slate-600"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={() => window.print()}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Ledger
                </Button>
                <button
                  type="button"
                  onClick={() => setPrintDailyRegisterOpen(false)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto p-6 sm:p-8 space-y-6 font-serif">
              {/* Daily Ledger Sheet */}
              <div className="text-center pb-4 border-b-2 border-slate-900 font-sans">
                <h1 className="text-xl font-black uppercase tracking-wide">
                  HARYANA POLICE • थाना दैनिकी रोजनामचा आम
                </h1>
                <p className="text-xs font-bold uppercase text-slate-700">
                  {currentUser.stationName}, District {currentUser.district}
                </p>
                <p className="text-[11px] text-slate-500 italic mt-0.5">
                  Register No. II under Punjab Police Rules 1934, Rule 22.48 • Date: {selectedPrintDate}
                </p>
              </div>

              <div className="border border-slate-900 rounded overflow-hidden">
                <table className="w-full text-xs text-left border-collapse font-sans">
                  <thead className="bg-slate-100 border-b border-slate-900 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="p-2 border-r border-slate-900 w-16 text-center">रपट नं</th>
                      <th className="p-2 border-r border-slate-900 w-24">वक्त</th>
                      <th className="p-2 border-r border-slate-900 w-44">मुलाज़िम मुताल्लिक व प्रकार</th>
                      <th className="p-2 border-r border-slate-900">विषय व इंद्राज का विस्तृत विवरण</th>
                      <th className="p-2 w-28 text-center">हस्ताक्षर MHC/SHO</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300">
                    {paginatedData.records
                      .filter((r) => r.isLocked && r.activityDateTime.startsWith(selectedPrintDate))
                      .map((r) => (
                        <tr key={r.id} className="align-top">
                          <td className="p-2 border-r border-slate-900 font-mono font-bold text-center">
                            #{r.sequencePerDay || r.gdNumber}
                          </td>
                          <td className="p-2 border-r border-slate-900 font-mono">
                            {r.activityDateTime.split(" ")[1] || r.activityDateTime}
                          </td>
                          <td className="p-2 border-r border-slate-900">
                            <strong>{r.entryForOfficer.name}</strong>
                            <p className="text-[10px] text-slate-600">{r.typeDisplayHi}</p>
                          </td>
                          <td className="p-2 border-r border-slate-900 leading-relaxed">
                            <strong className="block text-[11px] pb-0.5">{r.subject}</strong>
                            <p className="text-[11px] text-slate-800 whitespace-pre-wrap">{r.narrative}</p>
                          </td>
                          <td className="p-2 text-center text-[10px] text-slate-500 font-mono">
                            {r.verificationAuditId || "VERIFIED"}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              <div className="pt-8 flex items-end justify-between text-xs font-sans">
                <div className="text-center w-36">
                  <div className="h-12 border border-dashed border-slate-400 rounded flex items-center justify-center text-[10px] text-slate-400">
                    Station Seal
                  </div>
                  <p className="mt-1 font-bold text-slate-700">POLICE STATION SEAL</p>
                </div>
                <div className="text-right space-y-1">
                  <p className="text-slate-400">______________________________________</p>
                  <p className="font-bold text-slate-900">Station House Officer (SHO)</p>
                  <p className="text-slate-600 text-[11px]">{currentUser.stationName}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function GeneralDiaryPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-6xl mx-auto p-8 text-center text-xs text-slate-500">
          Loading Roznamcha General Diary...
        </div>
      }
    >
      <GeneralDiaryContent />
    </Suspense>
  );
}
