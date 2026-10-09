"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BookOpen,
  Search,
  Eye,
  FileText,
  Printer,
  PlusCircle,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Trash2,
  CalendarDays,
  X,
  Copy,
  Check,
  Paperclip,
  FileDown,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { GeneralDiaryService } from "@/services/generalDiaryService";
import {
  GeneralDiaryRecord,
  GDSearchFilter,
  GDPaginatedResponse,
  GDEntryTypeConfig,
  GDStatus,
  GDUploadedDocument,
} from "@/types/generalDiary";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState, LoadingSkeleton } from "@/components/ui/state-views";
import { GDRecordModal } from "@/components/general-diary/GDRecordModal";
import { GDPrintModal } from "@/components/general-diary/GDPrintModal";
import { toDDMMYYYY } from "@/lib/gdDateTime";

type ActiveTab = "REGISTER" | "SUGGESTIONS_DRAFTS";

function GeneralDiaryContent() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const searchParams = useSearchParams();
  const initialType = searchParams.get("type") || "ALL";
  const tabParam = searchParams.get("tab") as ActiveTab | null;
  const initialTab = tabParam === "SUGGESTIONS_DRAFTS" ? "SUGGESTIONS_DRAFTS" : "REGISTER";

  const [activeTab, setActiveTab] = useState<ActiveTab>(initialTab);
  const [types, setTypes] = useState<GDEntryTypeConfig[]>([]);

  // Dates helpers (Today & Yesterday)
  const todayISO = useMemo(() => {
    const d = new Date();
    const yyyy = String(d.getFullYear()).padStart(4, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  const yesterdayISO = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const yyyy = String(d.getFullYear()).padStart(4, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  // Search & Filter State — defaults strictly to TODAY so only current date entries show by default
  const [keyword, setKeyword] = useState("");
  const [typeFilter, setTypeFilter] = useState(initialType);
  const [selectedDate, setSelectedDate] = useState<string>(todayISO);
  const [officerQuery, setOfficerQuery] = useState("");

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
  const [printDailyRegisterOpen, setPrintDailyRegisterOpen] = useState(false);
  const [selectedPrintDate, setSelectedPrintDate] = useState<string>(todayISO);

  // Document Modal State
  const [docModalRecord, setDocModalRecord] = useState<GeneralDiaryRecord | null>(null);
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);

  // Sync print date with selected date
  useEffect(() => {
    if (selectedDate) {
      setSelectedPrintDate(selectedDate);
    }
  }, [selectedDate]);

  // Draft/Suggestion row actions state
  const [addingRecordId, setAddingRecordId] = useState<string | null>(null);
  const [deletingRecordId, setDeletingRecordId] = useState<string | null>(null);
  const [successFlash, setSuccessFlash] = useState<string | null>(null);

  // Load types config
  useEffect(() => {
    const loadedTypes = GeneralDiaryService.getTypes();
    setTypes(loadedTypes);
  }, []);

  // Fetch entries (strictly filters by selectedDate for the Register)
  const fetchEntries = async () => {
    setLoading(true);

    const filter: GDSearchFilter = {
      keyword: keyword.trim() || undefined,
      typeCode: typeFilter !== "ALL" ? typeFilter : undefined,
      startDate: activeTab === "REGISTER" ? (selectedDate || undefined) : undefined,
      endDate: activeTab === "REGISTER" ? (selectedDate || undefined) : undefined,
      officerQuery: officerQuery.trim() || undefined,
    };

    if (activeTab === "REGISTER") {
      filter.isLocked = true;
    } else if (activeTab === "SUGGESTIONS_DRAFTS") {
      // Tab shows both auto-suggestions and saved drafts
      filter.status = "SUGGESTED,DRAFT";
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
  }, [page, pageSize, typeFilter, selectedDate, keyword, officerQuery, activeTab]);

  // Brief description dialog modal state (opens popup dialog on click)
  const [briefModalRecord, setBriefModalRecord] = useState<GeneralDiaryRecord | null>(null);
  const [briefModalOpen, setBriefModalOpen] = useState(false);
  const [briefCopied, setBriefCopied] = useState(false);

  const openBriefModal = (rec: GeneralDiaryRecord) => {
    setBriefModalRecord(rec);
    setBriefModalOpen(true);
    setBriefCopied(false);
  };

  const closeBriefModal = () => {
    setBriefModalOpen(false);
    setBriefModalRecord(null);
    setBriefCopied(false);
  };

  const copyBriefNarrative = async () => {
    if (!briefModalRecord?.narrative) return;
    try {
      await navigator.clipboard.writeText(briefModalRecord.narrative);
      setBriefCopied(true);
      setTimeout(() => setBriefCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && briefModalOpen) {
        closeBriefModal();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [briefModalOpen]);

  // Add a draft/suggestion to the official GD register —
  // the server assigns the next unique GD number and locks it permanently
  const handleAddToGd = async (rec: GeneralDiaryRecord) => {
    setAddingRecordId(rec.id);
    try {
      const locked = await GeneralDiaryService.verifyAndLockEntry(
        rec.id,
        {
          name: currentUser.name || "HC Devinder Kumar",
          rank: currentUser.rankDisplay || "Head Constable (MHC)",
          beltNumber: "889/KKR",
          pno: currentUser.pno || "05192834",
        },
        "Added to General Diary from draft/suggestion"
      );
      setSuccessFlash(`Added to General Diary as ${locked.gdNumber}.`);
      setPaginatedData((prev) => ({
        ...prev,
        records: prev.records.filter((r) => r.id !== rec.id),
        total: Math.max(0, prev.total - 1),
        suggestedCount: rec.status === "SUGGESTED" ? Math.max(0, prev.suggestedCount - 1) : prev.suggestedCount,
        draftCount: rec.status === "DRAFT" ? Math.max(0, prev.draftCount - 1) : prev.draftCount,
        lockedCount: prev.lockedCount + 1,
        todayCount: prev.todayCount + 1,
      }));
      await fetchEntries();
      setTimeout(() => setSuccessFlash(null), 4000);
    } catch (err: any) {
      alert(err?.message || "Failed to add entry to General Diary.");
    } finally {
      setAddingRecordId(null);
    }
  };

  // Delete a draft/suggestion permanently (locked entries are never deletable)
  const handleDeleteDraftRow = async (rec: GeneralDiaryRecord) => {
    if (!window.confirm(`Delete "${rec.subject}"? This action cannot be undone.`)) return;
    setDeletingRecordId(rec.id);
    try {
      await GeneralDiaryService.deleteDraft(rec.id);
      setPaginatedData((prev) => ({
        ...prev,
        records: prev.records.filter((r) => r.id !== rec.id),
        total: Math.max(0, prev.total - 1),
        suggestedCount: rec.status === "SUGGESTED" ? Math.max(0, prev.suggestedCount - 1) : prev.suggestedCount,
        draftCount: rec.status === "DRAFT" ? Math.max(0, prev.draftCount - 1) : prev.draftCount,
      }));
      await fetchEntries();
    } catch (err: any) {
      alert(err?.message || "Failed to delete draft.");
    } finally {
      setDeletingRecordId(null);
    }
  };

  // Delete an uploaded attachment from a GD record
  const handleDeleteAttachment = async (recordId: string, attachmentId: string) => {
    if (!window.confirm("Are you sure you want to delete this uploaded document?")) return;
    setDeletingDocId(attachmentId);
    try {
      const updated = await GeneralDiaryService.deleteAttachment(recordId, attachmentId);
      // Update local modal record
      setDocModalRecord(updated);
      // Update in paginated data list
      setPaginatedData((prev) => ({
        ...prev,
        records: prev.records.map((r) => (r.id === updated.id ? updated : r)),
      }));
    } catch (err: any) {
      alert(err?.message || "Failed to delete attachment.");
    } finally {
      setDeletingDocId(null);
    }
  };

  // Reset Filters
  const handleResetFilters = () => {
    setKeyword("");
    setTypeFilter("ALL");
    setSelectedDate(todayISO);
    setOfficerQuery("");
    setPage(1);
  };

  return (
    <div className="p-3 sm:p-6 max-w-7xl mx-auto space-y-5">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-[#0b192c] tracking-tight">
              General Diary
            </h1>
          </div>
        </div>

        {/* Top Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Link href="/general-diary/new">
            <Button
              type="button"
              size="sm"
              className="bg-[#0b192c] hover:bg-slate-900 text-white text-xs font-bold gap-1.5 cursor-pointer shadow-xs"
            >
              <span>Add New GD Entry</span>
            </Button>
          </Link>

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
        </div>
      </div>

      {/* Success flash for row actions (Add to GD etc.) */}
      {successFlash && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl flex items-center gap-2.5 text-xs sm:text-sm font-semibold animate-in fade-in-50">
          <span>{successFlash}</span>
        </div>
      )}

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
            {paginatedData.todayCount}
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
      </div>

      {/* Friendly Search & Filter Bar */}
      <Card className="border-slate-200 shadow-2xs bg-white">
        <CardContent className="p-3.5 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
            {/* 1. Keyword Search */}
            <div className="sm:col-span-6 space-y-1">
              <label className="text-[11px] font-bold text-slate-700">Search</label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => {
                    setKeyword(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Subject, keyword, GD no..."
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#0b192c]"
                />
              </div>
            </div>

            {/* 2. Type Filter */}
            <div className="sm:col-span-3 space-y-1">
              <label className="text-[11px] font-bold text-slate-700">GD Type</label>
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold"
              >
                <option value="ALL">All Types</option>
                {types.map((t) => (
                  <option key={t.code} value={t.code}>
                    {t.nameEn}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Entry Date — Small Compact Box */}
            <div className="sm:col-span-3 space-y-1 sm:justify-self-end w-full sm:w-auto">
              <div className="flex items-center justify-between sm:justify-start gap-2">
                <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                  <CalendarDays className="w-3 h-3 text-blue-600" />
                  <span>Date</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDate("");
                    setPage(1);
                  }}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                    !selectedDate
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                  title="Show entries from all dates"
                >
                  All
                </button>
              </div>
              <input
                type="date"
                value={selectedDate}
                max={todayISO}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setPage(1);
                }}
                className="w-full sm:w-[145px] h-8 px-2 py-1 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-[#0b192c] cursor-pointer"
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
            <table className="w-full table-fixed text-xs text-left">
              <thead className="bg-[#0b192c] text-white uppercase text-[11px] tracking-wider font-sans">
                <tr>
                  <th className="py-3 px-3.5 w-24">GD No</th>
                  <th className="py-3 px-3.5 w-44">Entry for officer</th>
                  <th className="py-3 px-3 w-32">GD Type</th>
                  <th className="py-3 px-3 w-32">Subject</th>
                  <th className="py-3 px-3 w-44">Date &amp; time</th>
                  <th className="py-3 px-3.5">Brief description</th>
                  <th className="py-3 px-3 w-36 text-right">Actions</th>
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
                        isSuggested ? "bg-purple-50/30" : isDraft ? "bg-amber-50/30" : ""
                      }`}
                    >
                      {/* 1. GD No — drafts/suggestions have NO number yet */}
                      <td className="py-3.5 px-3.5 align-top">
                        <div className="space-y-0.5">
                          <span className="font-mono font-black text-sm text-blue-950 block">
                            {rec.isLocked ? rec.sequencePerDay : "—"}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono block">
                            {rec.isLocked ? rec.gdNumber : "No GD No. (not added)"}
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

                      {/* 4. Subject — complete subject lines visible without widening column */}
                      <td className="py-3.5 px-3 align-top w-32">
                        <p className="font-bold text-slate-950 text-xs break-words whitespace-normal leading-snug">
                          {rec.subject}
                        </p>
                      </td>

                      {/* 5. Date & time — strictly DD/MM/YYYY */}
                      <td className="py-3.5 px-3 align-top font-mono">
                        <div className="space-y-0.5 text-xs text-slate-800">
                          <p className="font-bold">
                            {toDDMMYYYY(
                              rec.activityDateTime.includes(" ")
                                ? rec.activityDateTime.split(" ")[0]
                                : rec.activityDateTime
                            )}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            Time: {rec.activityDateTime.includes(" ")
                              ? rec.activityDateTime.split(" ").slice(1).join(" ")
                              : ""}
                          </p>
                        </div>
                      </td>

                      {/* 6. Brief description — click to open full description dialog */}
                      <td className="py-3.5 px-3.5 align-top">
                        <div
                          onClick={() => openBriefModal(rec)}
                          className="cursor-pointer group p-1 -m-1 rounded-md hover:bg-blue-50/70 transition-colors"
                          title="Click to view full description dialog (पूरा विवरण देखें)"
                        >
                          <p className="text-slate-700 text-xs leading-relaxed break-words line-clamp-3">
                            {rec.narrative}
                          </p>
                          {rec.narrative && (
                            <span className="text-[10px] font-bold text-blue-600 group-hover:text-blue-800 mt-1 inline-block">
                              Click to view full description
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 7. Actions */}
                      <td className="py-3.5 px-3 align-top text-right">
                        {isSuggested || isDraft ? (
                          <div className="inline-flex flex-col items-stretch gap-1.5 min-w-[140px]">
                            <Button
                              type="button"
                              size="sm"
                              disabled={addingRecordId === rec.id}
                              onClick={() => handleAddToGd(rec)}
                              className="bg-[#0b192c] hover:bg-slate-900 text-white text-[11px] font-bold px-2.5 py-1 gap-1 justify-center cursor-pointer"
                            >
                              <PlusCircle className="w-3 h-3" />
                              <span>{addingRecordId === rec.id ? "Adding…" : "Add to GD"}</span>
                            </Button>
                            <div className="flex items-center justify-end gap-1.5">
                              <Link href={`/general-diary/new?editDraft=${rec.id}`}>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  className="text-[11px] font-bold px-2 py-1 cursor-pointer"
                                >
                                  Edit
                                </Button>
                              </Link>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                disabled={deletingRecordId === rec.id}
                                onClick={() => handleDeleteDraftRow(rec)}
                                className="text-[11px] font-bold px-2 py-1 text-red-700 border-red-300 hover:bg-red-50 gap-1 cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>{deletingRecordId === rec.id ? "…" : "Delete"}</span>
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-end gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedRecord(rec);
                                setInspectModalOpen(true);
                              }}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 hover:text-blue-900 hover:underline p-0.5 cursor-pointer shrink-0"
                              title="Print / View entry"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>Print</span>
                            </button>

                            {/* Uploaded Document button ONLY if record actually has uploaded attachments — placed below Print */}
                            {Boolean(
                              (rec.attachments && rec.attachments.length > 0) ||
                                (rec.relatedRecords?.attachments && rec.relatedRecords.attachments.length > 0)
                            ) && (
                              <button
                                type="button"
                                onClick={() => setDocModalRecord(rec)}
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 hover:text-indigo-900 hover:underline p-0.5 cursor-pointer shrink-0 whitespace-nowrap"
                                title="View uploaded documents"
                              >
                                <Paperclip className="w-3.5 h-3.5 text-indigo-600" />
                                <span>Doc</span>
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 pt-2">
            <span>
              Showing Page <strong>{paginatedData.page}</strong> of <strong>{paginatedData.totalPages}</strong> (Total <strong>{paginatedData.total}</strong> records)
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="gap-1 text-xs px-2.5 py-1 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Prev</span>
              </Button>

              {/* Numbered Page Buttons like 1, 2, 3... */}
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.max(1, paginatedData.totalPages) }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setPage(pageNum)}
                    className={`min-w-[28px] h-7 px-1.5 rounded text-xs font-bold transition-colors cursor-pointer flex items-center justify-center ${
                      page === pageNum
                        ? "bg-[#0b192c] text-white shadow-xs"
                        : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page >= paginatedData.totalPages}
                onClick={() => setPage((p) => Math.min(paginatedData.totalPages, p + 1))}
                className="gap-1 text-xs px-2.5 py-1 cursor-pointer"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Record Inspection & Print Modal */}
      {selectedRecord && (
        <GDRecordModal
          record={selectedRecord}
          isOpen={inspectModalOpen}
          autoPrint={true}
          onClose={() => {
            setInspectModalOpen(false);
            setSelectedRecord(null);
          }}
        />
      )}

      {/* Print Daily Register Modal (print preview + window.print) */}
      <GDPrintModal
        isOpen={printDailyRegisterOpen}
        onClose={() => setPrintDailyRegisterOpen(false)}
        initialDate={selectedPrintDate}
      />

      {/* Brief Description Popup Dialog Modal */}
      {briefModalOpen && briefModalRecord && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in-50"
          onClick={closeBriefModal}
        >
          <div
            className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[90vh] animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3.5 bg-[#0b192c] text-white">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-400/40 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-blue-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm leading-tight text-white">
                      {briefModalRecord.isLocked
                        ? `GD #${briefModalRecord.sequencePerDay || briefModalRecord.gdNumber}`
                        : briefModalRecord.status === "SUGGESTED"
                        ? "Auto-Suggestion"
                        : "Draft Record"}
                    </h3>
                    {(briefModalRecord.typeDisplayHi || briefModalRecord.typeDisplay) && (
                      <span className="text-[10px] bg-white/10 text-slate-200 border border-white/20 px-2 py-0.5 rounded font-mono">
                        {briefModalRecord.typeDisplayHi || briefModalRecord.typeDisplay}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Brief Description • सम्पूर्ण विवरण
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeBriefModal}
                className="text-slate-400 hover:text-white hover:bg-slate-800 p-1.5 rounded-lg transition-colors cursor-pointer"
                title="Close (ESC)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sub-header / Metadata */}
            <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 text-xs text-slate-700 space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-slate-500 font-medium">Subject: </span>
                  <span className="font-bold text-slate-900">{briefModalRecord.subject}</span>
                </div>
                <div className="font-mono text-[11px] text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                  📅 {toDDMMYYYY(briefModalRecord.activityDateTime)}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-600">
                <div>
                  <span className="text-slate-500">Officer: </span>
                  <span className="font-semibold text-slate-800">{briefModalRecord.entryForOfficer?.name || "N/A"}</span>
                  {briefModalRecord.entryForOfficer?.rank && (
                    <span className="text-slate-500">
                      {" "}
                      ({briefModalRecord.entryForOfficer.rank}
                      {briefModalRecord.entryForOfficer.beltNumber ? ` • ${briefModalRecord.entryForOfficer.beltNumber}` : ""})
                    </span>
                  )}
                </div>
                {briefModalRecord.policeStation && (
                  <div>
                    <span className="text-slate-500">Police Station: </span>
                    <span className="font-medium text-slate-700">{briefModalRecord.policeStation}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Narrative Body */}
            <div className="p-5 overflow-y-auto max-h-[50vh] flex-1">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Complete Narrative (दर्ज विवरण):
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm leading-relaxed whitespace-pre-wrap font-sans select-text">
                {briefModalRecord.narrative || "(No description recorded)"}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 border-t border-slate-200 px-5 py-3 flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={copyBriefNarrative}
                className="gap-1.5 text-xs text-slate-700 hover:text-slate-900 cursor-pointer"
              >
                {briefCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700 font-medium">Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Text</span>
                  </>
                )}
              </Button>

              <Button
                type="button"
                size="sm"
                onClick={closeBriefModal}
                className="bg-[#0b192c] hover:bg-slate-900 text-white text-xs px-4 cursor-pointer"
              >
                Close (बंद करें)
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Uploaded Documents Modal */}
      {docModalRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3.5 bg-[#0b192c] text-white">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center">
                  <Paperclip className="w-4 h-4 text-indigo-300" />
                </div>
                <div>
                  <h3 className="font-bold text-sm leading-tight text-white flex items-center gap-2">
                    <span>Uploaded Documents</span>
                    <span className="text-[10px] bg-indigo-500/30 text-indigo-200 px-2 py-0.5 rounded font-mono">
                      {docModalRecord.gdNumber}
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    Subject: {docModalRecord.subject}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDocModalRecord(null)}
                className="text-slate-300 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: List of documents */}
            <div className="p-5 overflow-y-auto max-h-[65vh] space-y-4 bg-slate-50/50">
              {(() => {
                const docs =
                  (docModalRecord.attachments && docModalRecord.attachments.length > 0)
                    ? docModalRecord.attachments
                    : docModalRecord.relatedRecords?.attachments || [];

                if (docs.length === 0) {
                  return (
                    <div className="text-center py-10 text-slate-500 text-sm">
                      No documents attached to this GD entry.
                    </div>
                  );
                }

                return docs.map((doc, idx) => {
                  const isImg = doc.type?.startsWith("image/");
                  const isPdf = doc.type === "application/pdf";

                  return (
                    <div
                      key={doc.id || idx}
                      className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3"
                    >
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          {isImg ? (
                            <ImageIcon className="w-4 h-4 text-blue-600 shrink-0" />
                          ) : (
                            <FileText className="w-4 h-4 text-amber-600 shrink-0" />
                          )}
                          <span className="font-bold text-xs sm:text-sm text-slate-900">
                            {doc.name}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            ({(doc.size / 1024).toFixed(1)} KB)
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {doc.dataUrl && (
                            <a
                              href={doc.dataUrl}
                              download={doc.name}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 px-2.5 py-1 rounded cursor-pointer transition-colors"
                            >
                              <FileDown className="w-3.5 h-3.5" />
                              <span>Download</span>
                            </a>
                          )}
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={deletingDocId === doc.id}
                            onClick={() => handleDeleteAttachment(docModalRecord.id, doc.id)}
                            className="text-[11px] font-bold text-red-700 border-red-300 hover:bg-red-50 px-2.5 py-1 h-auto cursor-pointer gap-1"
                          >
                            {deletingDocId === doc.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                            <span>{deletingDocId === doc.id ? "Deleting…" : "Delete"}</span>
                          </Button>
                        </div>
                      </div>

                      {/* Document Preview (Image / PDF embed) */}
                      {doc.dataUrl && (
                        <div className="mt-2 bg-slate-100 rounded-lg p-2 flex items-center justify-center max-h-[400px] overflow-hidden border border-slate-200">
                          {isImg ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={doc.dataUrl}
                              alt={doc.name}
                              className="max-h-[380px] max-w-full object-contain rounded"
                            />
                          ) : isPdf ? (
                            <iframe
                              src={doc.dataUrl}
                              title={doc.name}
                              className="w-full h-[380px] rounded border border-slate-300"
                            />
                          ) : (
                            <div className="text-xs text-slate-500 py-6">
                              Preview not supported. Please click Download above to view.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                });
              })()}
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 border-t border-slate-200 px-5 py-3 flex justify-end">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setDocModalRecord(null)}
                className="text-xs px-4 cursor-pointer"
              >
                Close (बंद करें)
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
