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
  Eye,
  FileText,
  Printer,
  PlusCircle,
  Sparkles,
  Filter,
  CheckCircle2,
  AlertTriangle,
  History,
  ChevronLeft,
  ChevronRight,
  User,
  RotateCcw,
  ShieldAlert,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
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
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [officerQuery, setOfficerQuery] = useState("");

  // Column Sort & Column Search State
  type GDSortField = "gdNumber" | "officer" | "gdType" | "subject" | "activityDateTime" | "narrative";
  type SortOrder = "asc" | "desc";
  const [sortField, setSortField] = useState<GDSortField>("activityDateTime");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [columnSearch, setColumnSearch] = useState<Record<string, string>>({});
  const [activeSearchCol, setActiveSearchCol] = useState<string | null>(null);

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
  const [dayCloseConfirmOpen, setDayCloseConfirmOpen] = useState(false);
  const [dayCloseSuccess, setDayCloseSuccess] = useState<string | null>(null);

  // Load types config
  useEffect(() => {
    const loadedTypes = GeneralDiaryService.getTypes();
    setTypes(loadedTypes);
  }, []);

  // Fetch entries
  const fetchEntries = async () => {
    setLoading(true);

    const filter: GDSearchFilter = {
      keyword: keyword.trim() || undefined,
      typeCode: typeFilter !== "ALL" ? typeFilter : undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      officerQuery: officerQuery.trim() || undefined,
    };

    if (activeTab === "REGISTER") {
      filter.isLocked = true;
    } else if (activeTab === "SUGGESTIONS_DRAFTS") {
      filter.status = "SUGGESTED";
    }

    try {
      const res = await GeneralDiaryService.getPaginatedEntries(filter, page, pageSize);
      setPaginatedData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, [page, pageSize, typeFilter, startDate, endDate, keyword, officerQuery, activeTab]);

  // Handle Day Close (Bandi)
  const handlePerformDayClose = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const nowTime = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });

      const newRecord = await GeneralDiaryService.addEntry({
        typeCode: "BANDI_ROZNAMCHA",
        category: "ROUTINE_ADMINISTRATION",
        typeDisplay: "Closing",
        typeDisplayHi: "Closing",
        subject: "Bandi - 24-Hour Closure of General Diary",
        narrative: `At ${nowTime}, the General Diary for ${today} was formally closed and locked. All daily entries verified, weapon registers tallied, and hawalat lockup checked. Daily Register locked under Punjab Police Rule 22.49.`,
        activityDateTime: `${today} ${nowTime}`,
        entryForOfficer: {
          name: currentUser.name || "HC Devinder Kumar",
          rank: currentUser.rankDisplay || "Head Constable (MHC)",
          beltNumber: "889/KKR",
          pno: currentUser.pno || "05192834",
        },
        actualAuthor: {
          name: currentUser.name || "HC Devinder Kumar",
          rank: currentUser.rankDisplay || "Head Constable (MHC)",
          beltNumber: "889/KKR",
          pno: currentUser.pno || "05192834",
        },
        policeStation: "PS City Thanesar",
        district: "Kurukshetra",
        source: "MANUAL_ENTRY",
        relatedRecords: {},
      });

      setDayCloseConfirmOpen(false);
      setDayCloseSuccess(`Day Close entry #${newRecord.sequencePerDay} recorded. General Diary for today is locked!`);
      await fetchEntries();
      setTimeout(() => setDayCloseSuccess(null), 4000);
    } catch (err: any) {
      alert(err?.message || "Failed to close day diary.");
    }
  };

  // Reset Filters
  const handleResetFilters = () => {
    setKeyword("");
    setTypeFilter("ALL");
    setStartDate("");
    setEndDate("");
    setOfficerQuery("");
    setColumnSearch({});
    setActiveSearchCol(null);
    setPage(1);
  };

  const handleSort = (field: GDSortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const displayedRecords = useMemo(() => {
    let list = [...paginatedData.records];

    // Column-specific search filter
    for (const [col, term] of Object.entries(columnSearch)) {
      if (!term || !term.trim()) continue;
      const q = term.toLowerCase().trim();
      list = list.filter((rec) => {
        if (col === "gdNumber") {
          return (
            rec.gdNumber.toLowerCase().includes(q) ||
            String(rec.sequencePerDay || "").includes(q)
          );
        } else if (col === "officer") {
          return (
            rec.entryForOfficer.name.toLowerCase().includes(q) ||
            rec.entryForOfficer.rank.toLowerCase().includes(q) ||
            rec.entryForOfficer.beltNumber.toLowerCase().includes(q)
          );
        } else if (col === "gdType") {
          return rec.typeDisplay.toLowerCase().includes(q);
        } else if (col === "subject") {
          return rec.subject.toLowerCase().includes(q);
        } else if (col === "activityDateTime") {
          return rec.activityDateTime.toLowerCase().includes(q);
        } else if (col === "narrative") {
          return rec.narrative.toLowerCase().includes(q);
        }
        return true;
      });
    }

    // Sorting
    return list.sort((a, b) => {
      let aVal = "";
      let bVal = "";
      if (sortField === "gdNumber") {
        const aSeq = a.sequencePerDay || 0;
        const bSeq = b.sequencePerDay || 0;
        return sortOrder === "asc" ? aSeq - bSeq : bSeq - aSeq;
      } else if (sortField === "officer") {
        aVal = a.entryForOfficer.name.toLowerCase();
        bVal = b.entryForOfficer.name.toLowerCase();
      } else if (sortField === "gdType") {
        aVal = a.typeDisplay.toLowerCase();
        bVal = b.typeDisplay.toLowerCase();
      } else if (sortField === "subject") {
        aVal = a.subject.toLowerCase();
        bVal = b.subject.toLowerCase();
      } else if (sortField === "activityDateTime") {
        aVal = a.activityDateTime.toLowerCase();
        bVal = b.activityDateTime.toLowerCase();
      } else if (sortField === "narrative") {
        aVal = a.narrative.toLowerCase();
        bVal = b.narrative.toLowerCase();
      }

      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [paginatedData.records, columnSearch, sortField, sortOrder]);

  const renderGDColumnHeader = (field: GDSortField, label: string) => {
    const isSearching = activeSearchCol === field;
    const filterValue = columnSearch[field] || "";
    const isSorted = sortField === field;

    return (
      <div className="space-y-1 relative">
        <div className="flex items-center justify-between gap-1">
          {/* Column Name Click -> Toggles Search */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setActiveSearchCol(isSearching ? null : field);
            }}
            title="कॉलम में खोजने हेतु क्लिक करें (Click to Search Column)"
            className="flex items-center gap-1 font-bold text-white hover:text-cyan-200 transition-colors text-left uppercase text-[11px] tracking-wider cursor-pointer group"
          >
            <span>{label}</span>
            {filterValue ? (
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            ) : (
              <Search className="w-2.5 h-2.5 text-slate-400 opacity-40 group-hover:opacity-100 group-hover:text-cyan-300 transition-opacity" />
            )}
          </button>

          {/* Arrow Click -> Sorts */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleSort(field);
            }}
            title={`सॉर्ट करें (Sort by ${label})`}
            className={`p-1 rounded hover:bg-white/10 transition-colors cursor-pointer shrink-0 ${
              isSorted ? "text-cyan-300 bg-white/15" : "text-slate-400 hover:text-white"
            }`}
          >
            {isSorted ? (
              sortOrder === "asc" ? (
                <ArrowUp className="w-3.5 h-3.5 font-bold text-cyan-300" />
              ) : (
                <ArrowDown className="w-3.5 h-3.5 font-bold text-cyan-300" />
              )
            ) : (
              <ArrowUpDown className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* Inline Search Input or Active Filter Badge */}
        {isSearching ? (
          <div
            onClick={(e) => e.stopPropagation()}
            className="pt-1 animate-in fade-in-50"
          >
            <div className="relative">
              <input
                type="text"
                autoFocus
                value={filterValue}
                onChange={(e) =>
                  setColumnSearch((prev) => ({ ...prev, [field]: e.target.value }))
                }
                placeholder={`${label} खोजें...`}
                className="w-full text-[11px] px-2 py-1 bg-white border border-cyan-400 rounded focus:outline-none focus:ring-1 focus:ring-cyan-500 font-normal pr-5 text-slate-900 shadow-2xs normal-case"
              />
              {filterValue && (
                <button
                  type="button"
                  onClick={() =>
                    setColumnSearch((prev) => {
                      const next = { ...prev };
                      delete next[field];
                      return next;
                    })
                  }
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs font-bold"
                >
                  &times;
                </button>
              )}
            </div>
          </div>
        ) : filterValue ? (
          <div className="flex items-center gap-1 text-[10px] text-cyan-200 bg-cyan-950/80 px-1.5 py-0.5 rounded font-mono border border-cyan-700">
            <span className="truncate max-w-[90px] normal-case">&ldquo;{filterValue}&rdquo;</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setColumnSearch((prev) => {
                  const next = { ...prev };
                  delete next[field];
                  return next;
                });
              }}
              className="text-slate-400 hover:text-red-400 ml-auto"
            >
              &times;
            </button>
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <div className="p-3 sm:p-6 max-w-7xl mx-auto space-y-5">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-[#0b192c] tracking-tight">
              Smart General Diary (Register No. II)
            </h1>
            <span className="text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
              PPR 1934 Rule 22.48
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Complete electronic register for Haryana Police Stations &amp; Chowkies. Immutable, sequential, and court-admissible.
          </p>
        </div>

        {/* Top Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setDayCloseConfirmOpen(true)}
            className="text-xs font-bold gap-1.5 border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 cursor-pointer shadow-2xs"
          >
            <Lock className="w-3.5 h-3.5 text-amber-700" />
            <span>🔒 Day Close (Bandi)</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPrintDailyRegisterOpen(true)}
            className="text-xs font-bold gap-1.5 border-slate-300 bg-white hover:bg-slate-50 cursor-pointer shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5 text-slate-700" />
            <span>Print Register</span>
          </Button>

          <Link href="/general-diary/new">
            <Button
              type="button"
              size="sm"
              className="bg-[#0b192c] hover:bg-slate-900 text-white text-xs font-bold gap-1.5 cursor-pointer shadow-xs"
            >
              <PlusCircle className="w-3.5 h-3.5 text-amber-300" />
              <span>+ Add New GD</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Day Close Success Alert */}
      {dayCloseSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl flex items-center gap-2.5 text-xs sm:text-sm font-semibold animate-in fade-in-50">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{dayCloseSuccess}</span>
        </div>
      )}

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Today&apos;s Valid Entries</span>
            <BookOpen className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 font-mono">
            {paginatedData.todayCount}
          </p>
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
            Active 24-hr Diary
          </span>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Total Locked Entries</span>
            <Lock className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 font-mono">
            {paginatedData.lockedCount}
          </p>
          <span className="text-[10px] text-slate-500">
            Immutable (No delete / edit)
          </span>
        </div>

        <div
          onClick={() => setActiveTab("SUGGESTIONS_DRAFTS")}
          className="p-3.5 bg-purple-50/80 border border-purple-200 rounded-xl shadow-2xs space-y-1 cursor-pointer hover:border-purple-400 transition-colors"
        >
          <div className="flex items-center justify-between text-xs text-purple-800 font-bold">
            <span>Auto-Suggestions</span>
            <Sparkles className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-black text-purple-950 font-mono">
            {paginatedData.suggestedCount}
          </p>
          <span className="text-[10px] text-purple-700 font-semibold underline">
            Review &amp; Confirm &rarr;
          </span>
        </div>

        <div
          onClick={() => setActiveTab("SUGGESTIONS_DRAFTS")}
          className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl shadow-2xs space-y-1 cursor-pointer hover:border-amber-400 transition-colors"
        >
          <div className="flex items-center justify-between text-xs text-amber-800 font-bold">
            <span>Saved Drafts</span>
            <FileText className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-black text-amber-950 font-mono">
            {paginatedData.draftCount}
          </p>
          <span className="text-[10px] text-amber-700">
            Pending Finalization
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
          <span>General Diary Register</span>
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
          <span>Auto-Suggestions &amp; Drafts</span>
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
          <span>Verification &amp; Audit Trail</span>
        </button>
      </div>

      {/* Friendly Search & Filter Bar */}
      <Card className="border-slate-200 shadow-2xs bg-white">
        <CardContent className="p-3.5 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            {/* Keyword Search */}
            <div className="sm:col-span-2 relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={keyword}
                onChange={(e) => {
                  setKeyword(e.target.value);
                  setPage(1);
                }}
                placeholder="Search GD by officer, subject, keyword..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#0b192c]"
              />
            </div>

            {/* Type Filter */}
            <div>
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold"
              >
                <option value="ALL">All Activity Types</option>
                {types.map((t) => (
                  <option key={t.code} value={t.code}>
                    {t.nameEn}
                  </option>
                ))}
              </select>
            </div>

            {/* Officer Search */}
            <div>
              <input
                type="text"
                value={officerQuery}
                onChange={(e) => {
                  setOfficerQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="Filter by Officer (e.g. SI Malkeet)"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Smart GD Register Table View */}
      {loading ? (
        <LoadingSkeleton count={5} />
      ) : paginatedData.records.length === 0 ? (
        <EmptyState
          title="No General Diary entries match the criteria"
          description="Try broadening your search or record a new entry."
          actionLabel="+ Add New GD Entry"
          onAction={() => router.push("/general-diary/new")}
        />
      ) : (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#0b192c] text-white uppercase text-[11px] tracking-wider font-sans">
                <tr>
                  <th className="py-3 px-3.5 w-28 align-top">
                    {renderGDColumnHeader("gdNumber", "GD No")}
                  </th>
                  <th className="py-3 px-3.5 w-44 align-top">
                    {renderGDColumnHeader("officer", "Entry for officer")}
                  </th>
                  <th className="py-3 px-3 w-32 align-top">
                    {renderGDColumnHeader("gdType", "GD Type")}
                  </th>
                  <th className="py-3 px-3 w-44 align-top">
                    {renderGDColumnHeader("subject", "Subject")}
                  </th>
                  <th className="py-3 px-3 w-44 align-top">
                    {renderGDColumnHeader("activityDateTime", "Date & time")}
                  </th>
                  <th className="py-3 px-3.5 align-top">
                    {renderGDColumnHeader("narrative", "Brief description")}
                  </th>
                  <th className="py-3 px-3 w-24 text-right align-top pt-3.5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {displayedRecords.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Filter className="w-7 h-7 text-slate-300" />
                        <p className="font-semibold text-slate-700">कोई रिकॉर्ड नहीं मिला (No records match the column filter)</p>
                        <button
                          type="button"
                          onClick={() => {
                            setColumnSearch({});
                            setActiveSearchCol(null);
                          }}
                          className="text-xs text-blue-600 hover:underline font-semibold cursor-pointer"
                        >
                          Clear Column Filters
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  displayedRecords.map((rec) => {
                  const isLocked = rec.isLocked;
                  const isSuggested = rec.status === "SUGGESTED";
                  const isDraft = rec.status === "DRAFT";

                  return (
                    <tr
                      key={rec.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSuggested ? "bg-purple-50/30" : isDraft ? "bg-amber-50/30" : ""
                      }`}
                    >
                      {/* 1. GD No */}
                      <td className="py-3.5 px-3.5 align-top">
                        <div className="space-y-0.5">
                          <span className="font-mono font-black text-sm text-blue-950 block">
                            {rec.sequencePerDay || 1}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono block">
                            {rec.gdNumber}
                          </span>
                        </div>
                      </td>

                      {/* 2. Entry for officer */}
                      <td className="py-3.5 px-3.5 align-top">
                        <div className="space-y-0.5">
                          <p className="font-bold text-slate-900 text-xs">
                            {rec.entryForOfficer.name}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {rec.entryForOfficer.rank} • {rec.entryForOfficer.beltNumber}
                          </p>
                        </div>
                      </td>

                      {/* 3. GD Type */}
                      <td className="py-3.5 px-3 align-top">
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                          {rec.typeDisplay}
                        </span>
                      </td>

                      {/* 4. Subject */}
                      <td className="py-3.5 px-3 align-top">
                        <p className="font-bold text-slate-950 text-xs">
                          {rec.subject}
                        </p>
                      </td>

                      {/* 5. Date & time */}
                      <td className="py-3.5 px-3 align-top font-mono">
                        <div className="space-y-0.5 text-xs text-slate-800">
                          <p className="font-bold">
                            {rec.activityDateTime.includes(" ")
                              ? rec.activityDateTime.split(" ")[0]
                              : rec.activityDateTime}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            Time: {rec.activityDateTime.includes(" ")
                              ? rec.activityDateTime.split(" ").slice(1).join(" ")
                              : ""}
                          </p>
                        </div>
                      </td>

                      {/* 6. Brief description */}
                      <td className="py-3.5 px-3.5 align-top">
                        <p className="text-slate-700 text-xs leading-relaxed line-clamp-3">
                          {rec.narrative}
                        </p>
                      </td>

                      {/* 7. Actions */}
                      <td className="py-3.5 px-3 align-top text-right">
                        {isSuggested ? (
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => {
                              setVerifyingRecord(rec);
                              setVerifyModalOpen(true);
                            }}
                            className="bg-purple-700 hover:bg-purple-800 text-white text-[11px] font-bold px-2.5 py-1"
                          >
                            Confirm
                          </Button>
                        ) : isDraft ? (
                          <Link href={`/general-diary/new?editDraft=${rec.id}`}>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="text-[11px] font-bold px-2 py-1"
                            >
                              Edit
                            </Button>
                          </Link>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedRecord(rec);
                              setInspectModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 hover:text-blue-900 hover:underline p-1 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                }))}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 pt-2">
            <span>
              Showing Page <strong>{paginatedData.page}</strong> of <strong>{paginatedData.totalPages}</strong> (Total <strong>{paginatedData.total}</strong> records)
            </span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="gap-1 text-xs"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Prev</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page >= paginatedData.totalPages}
                onClick={() => setPage((p) => Math.min(paginatedData.totalPages, p + 1))}
                className="gap-1 text-xs"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Record Inspection Modal */}
      {selectedRecord && (
        <GDRecordModal
          record={selectedRecord}
          isOpen={inspectModalOpen}
          onClose={() => {
            setInspectModalOpen(false);
            setSelectedRecord(null);
          }}
        />
      )}

      {/* Verification Modal for Pending Suggestions */}
      {verifyingRecord && (
        <GDVerificationModal
          record={verifyingRecord}
          isOpen={verifyModalOpen}
          onClose={() => {
            setVerifyModalOpen(false);
            setVerifyingRecord(null);
          }}
          verifier={{
            name: currentUser.name || "HC Devinder Kumar",
            rank: currentUser.rankDisplay || "Head Constable (MHC)",
            beltNumber: "889/KKR",
            pno: currentUser.pno || "05192834",
          }}
          onConfirmLock={async (remarks: string) => {
            await GeneralDiaryService.verifyAndLockEntry(
              verifyingRecord.id,
              {
                name: currentUser.name || "HC Devinder Kumar",
                rank: currentUser.rankDisplay || "Head Constable (MHC)",
                beltNumber: "889/KKR",
                pno: currentUser.pno || "05192834",
              },
              remarks
            );
            setVerifyModalOpen(false);
            setVerifyingRecord(null);
            await fetchEntries();
          }}
        />
      )}

      {/* Day Close (Bandi) Confirmation Modal */}
      {dayCloseConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 animate-in fade-in-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <Lock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Day Close General Diary (Bandi)?
                </h3>
                <p className="text-xs text-slate-500">
                  Punjab Police Rule 22.49 24-hour cycle closure
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed">
              This action will record the formal <strong>Bandi Roznamcha (Day Close)</strong> entry and lock the diary page for the 24-hour cycle. Once locked, records are legally permanent and immutable.
            </p>

            <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDayCloseConfirmOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handlePerformDayClose}
                className="bg-[#0b192c] text-white font-bold gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Confirm &amp; Lock Day Close</span>
              </Button>
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
        <div className="p-8 text-center text-xs text-slate-500">
          Loading Smart General Diary Register...
        </div>
      }
    >
      <GeneralDiaryContent />
    </Suspense>
  );
}
