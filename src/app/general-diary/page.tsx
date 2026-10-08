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
  History,
  ChevronLeft,
  ChevronRight,
  Trash2,
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
import { GDPrintModal } from "@/components/general-diary/GDPrintModal";

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
  const [selectedPrintDate, setSelectedPrintDate] = useState(() => new Date().toISOString().split("T")[0]);

  // Draft/Suggestion row actions state
  const [addingRecordId, setAddingRecordId] = useState<string | null>(null);
  const [deletingRecordId, setDeletingRecordId] = useState<string | null>(null);
  const [successFlash, setSuccessFlash] = useState<string | null>(null);

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
  }, [page, pageSize, typeFilter, startDate, endDate, keyword, officerQuery, activeTab]);

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
      await fetchEntries();
    } catch (err: any) {
      alert(err?.message || "Failed to delete draft.");
    } finally {
      setDeletingRecordId(null);
    }
  };

  // Reset Filters
  const handleResetFilters = () => {
    setKeyword("");
    setTypeFilter("ALL");
    setStartDate("");
    setEndDate("");
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
                  <th className="py-3 px-3.5 w-24">GD No</th>
                  <th className="py-3 px-3.5 w-44">Entry for officer</th>
                  <th className="py-3 px-3 w-32">GD Type</th>
                  <th className="py-3 px-3 w-40">Subject</th>
                  <th className="py-3 px-3 w-44">Date &amp; time</th>
                  <th className="py-3 px-3.5">Brief description</th>
                  <th className="py-3 px-3 w-24 text-right">Actions</th>
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
                })}
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

      {/* Print Daily Register Modal (print preview + window.print) */}
      <GDPrintModal
        isOpen={printDailyRegisterOpen}
        onClose={() => setPrintDailyRegisterOpen(false)}
        initialDate={selectedPrintDate}
      />
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
