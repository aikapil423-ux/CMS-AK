"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
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
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { GeneralDiaryService } from "@/services/generalDiaryService";
import { GeneralDiaryItem } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState, LoadingSkeleton } from "@/components/ui/state-views";

type GDSortField =
  | "sequencePerDay"
  | "entryTime"
  | "entryTypeDisplay"
  | "subject"
  | "loggedByOfficer";

function GeneralDiaryContent() {
  const { currentUser } = useAuth();
  const searchParams = useSearchParams();
  const initialType = searchParams.get("type") || "ALL";

  const [entries, setEntries] = useState<GeneralDiaryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState(initialType);
  const [selectedEntry, setSelectedEntry] = useState<GeneralDiaryItem | null>(null);

  const [sortField, setSortField] = useState<GDSortField>("sequencePerDay");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const handleSort = (field: GDSortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const sortedEntries = useMemo(() => {
    return [...entries].sort((a, b) => {
      if (sortField === "sequencePerDay") {
        return sortOrder === "asc"
          ? a.sequencePerDay - b.sequencePerDay
          : b.sequencePerDay - a.sequencePerDay;
      }
      if (sortField === "entryTime") {
        const aTime = `${a.entryDate}T${a.entryTime}`;
        const bTime = `${b.entryDate}T${b.entryTime}`;
        if (aTime < bTime) return sortOrder === "asc" ? -1 : 1;
        if (aTime > bTime) return sortOrder === "asc" ? 1 : -1;
        return 0;
      }
      const aVal = (a[sortField] || "").toString().toLowerCase();
      const bVal = (b[sortField] || "").toString().toLowerCase();
      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [entries, sortField, sortOrder]);

  const renderSortIcon = (field: GDSortField) => {
    if (sortField !== field) {
      return (
        <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-60 group-hover:opacity-100 group-hover:text-slate-600 transition-opacity" />
      );
    }
    return sortOrder === "asc" ? (
      <ArrowUp className="w-3.5 h-3.5 text-blue-600 font-bold shrink-0" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-blue-600 font-bold shrink-0" />
    );
  };

  const fetchEntries = async () => {
    setLoading(true);
    const data = await GeneralDiaryService.getEntries({
      search: searchQuery,
      entryType: typeFilter,
    });
    setEntries(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchEntries();
  }, [searchQuery, typeFilter]);

  useEffect(() => {
    const qType = searchParams.get("type");
    if (qType) {
      setTypeFilter(qType);
    }
  }, [searchParams]);

  return (
    <div className="space-y-6 animate-in fade-in-50">
      {/* Module Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
              PPR Chapter XXII • Rule 22.48
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Daily General Diary (Roznamcha Aam)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            24-Hour continuous legal ledger of all police station occurrences at {currentUser.stationName}
          </p>
        </div>
      </div>

      {/* Roznamcha Operational Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
              Today&apos;s Entries
            </span>
            <div className="text-2xl font-extrabold text-[#0b192c] mt-1">{entries.length}</div>
            <div className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1 mt-0.5">
              <Lock className="w-3 h-3" /> Consecutive Serial No.
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-4">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
              Patrol & Night Domination
            </span>
            <div className="text-2xl font-extrabold text-sky-900 mt-1">
              {entries.filter((e) => e.entryType === "PATROL_DEPARTURE_RETURN").length + 2}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">PCR & ERV Movements</div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-4">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
              Complaints Auto-Logged
            </span>
            <div className="text-2xl font-extrabold text-blue-900 mt-1">
              {entries.filter((e) => e.entryType === "COMPLAINT_RECEIPT").length}
            </div>
            <div className="text-[10px] text-blue-700 font-semibold flex items-center gap-1 mt-0.5">
              BNSS 173(3) Intake
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-4">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
              Diary Status
            </span>
            <div className="text-xl font-extrabold text-emerald-700 mt-1">OPEN (24-HR)</div>
            <div className="text-[10px] text-slate-500 mt-0.5">MHC: HC Devinder Kumar</div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="border-slate-200">
        <CardContent className="p-4 space-y-3">
          {/* Roznamcha Sub-type Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-100">
            {[
              { key: "ALL", label: "All GD Entries" },
              { key: "COMPLAINT_RECEIPT", label: "Complaint Receipts (BNSS 173)" },
              { key: "OPENING_OF_DIARY", label: "Diary Opening / Closing" },
              { key: "SHIFT_RELIEF_TURNOVER", label: "Shift Turnover" },
              { key: "PATROL_DEPARTURE_RETURN", label: "Patrol Movements" },
              { key: "SEIZURE_MUDDMAL", label: "Malkhana Seizures" },
              { key: "OFFICER_DEPARTURE", label: "Officer Movements" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setTypeFilter(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  typeFilter === tab.key
                    ? "bg-blue-600 text-white shadow-2xs"
                    : "text-slate-600 hover:bg-slate-100 hover:text-blue-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Roznamcha entries by subject, narrative, officer name, or PNO..."
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0b192c]"
            />
          </div>
        </CardContent>
      </Card>

      {/* GD Entries Table Format */}
      {loading ? (
        <LoadingSkeleton count={4} />
      ) : entries.length === 0 ? (
        <EmptyState
          title="No Roznamcha entries found"
          description="Try adjusting your search query or filter."
          actionLabel="View All Today's Entries"
          onAction={() => {
            setSearchQuery("");
            setTypeFilter("ALL");
          }}
        />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th
                    onClick={() => handleSort("sequencePerDay")}
                    className="py-3.5 px-4 whitespace-nowrap cursor-pointer hover:bg-slate-100 transition-colors select-none group"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>GD No. & Seq</span>
                      {renderSortIcon("sequencePerDay")}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("entryTime")}
                    className="py-3.5 px-4 whitespace-nowrap cursor-pointer hover:bg-slate-100 transition-colors select-none group"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Date & Time</span>
                      {renderSortIcon("entryTime")}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("entryTypeDisplay")}
                    className="py-3.5 px-4 whitespace-nowrap cursor-pointer hover:bg-slate-100 transition-colors select-none group"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Entry Type</span>
                      {renderSortIcon("entryTypeDisplay")}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("subject")}
                    className="py-3.5 px-4 min-w-[320px] cursor-pointer hover:bg-slate-100 transition-colors select-none group"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Subject & Narrative</span>
                      {renderSortIcon("subject")}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("loggedByOfficer")}
                    className="py-3.5 px-4 whitespace-nowrap cursor-pointer hover:bg-slate-100 transition-colors select-none group"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Logged By Officer</span>
                      {renderSortIcon("loggedByOfficer")}
                    </div>
                  </th>
                  <th className="py-3.5 px-4 whitespace-nowrap text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {sortedEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* GD No. & Seq */}
                    <td className="py-3.5 px-4 align-top font-mono">
                      <span className="font-bold text-blue-900 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded text-xs inline-block">
                        {entry.gdNumber}
                      </span>
                      <div className="text-[11px] text-slate-500 font-semibold mt-1">
                        Seq #{entry.sequencePerDay}
                      </div>
                    </td>

                    {/* Date & Time */}
                    <td className="py-3.5 px-4 align-top whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                        <Clock className="w-3.5 h-3.5 text-blue-600" />
                        <span>{entry.entryTime} Hrs</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{entry.entryDate}</span>
                      </div>
                    </td>

                    {/* Entry Type */}
                    <td className="py-3.5 px-4 align-top whitespace-nowrap">
                      <span className="inline-block text-[11px] font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-1 rounded-md">
                        {entry.entryTypeDisplay}
                      </span>
                      {entry.relatedComplaintNumber && (
                        <div className="text-[10px] text-blue-700 font-mono mt-1 font-semibold">
                          Ref: {entry.relatedComplaintNumber}
                        </div>
                      )}
                    </td>

                    {/* Subject & Narrative */}
                    <td className="py-3.5 px-4 align-top">
                      <div className="font-bold text-slate-900 text-sm">{entry.subject}</div>
                      <p className="text-xs text-slate-600 leading-relaxed mt-1 bg-slate-50/70 p-2.5 rounded-lg border border-slate-100 font-sans">
                        {entry.narrative}
                      </p>
                    </td>

                    {/* Logged By Officer */}
                    <td className="py-3.5 px-4 align-top whitespace-nowrap">
                      <div className="font-bold text-slate-900">{entry.loggedByOfficer}</div>
                      <div className="text-[11px] text-slate-500 font-mono">PNO: {entry.loggedByPno}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{entry.policeStation}</div>
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 align-top text-right whitespace-nowrap">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1 text-xs"
                        onClick={() => setSelectedEntry(entry)}
                      >
                        <Eye className="w-3.5 h-3.5 text-blue-600" />
                        View Extract
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* GD Entry Full Legal Extract Modal */}
      {selectedEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setSelectedEntry(null)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 z-10 animate-in fade-in-0 zoom-in-95 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-blue-800 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded">
                    PPR Rule 22.48 • Daily General Diary Extract
                  </span>
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Sealed Ledger Record
                  </span>
                </div>
                <h3 className="text-lg font-black text-slate-900 mt-1">
                  {selectedEntry.gdNumber} (Sequence #{selectedEntry.sequencePerDay})
                </h3>
              </div>
              <button
                onClick={() => setSelectedEntry(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-500 font-medium">Police Station</span>
                <p className="font-bold text-slate-800">{selectedEntry.policeStation}</p>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Date & Time</span>
                <p className="font-bold text-slate-800">{selectedEntry.entryDate} | {selectedEntry.entryTime} Hrs</p>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Entry Type</span>
                <p className="font-bold text-slate-800">{selectedEntry.entryTypeDisplay}</p>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Logged By Officer</span>
                <p className="font-bold text-slate-800">{selectedEntry.loggedByOfficer}</p>
                <p className="text-[10px] text-slate-500 font-mono">PNO: {selectedEntry.loggedByPno}</p>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-1">
                Subject of Entry
              </h4>
              <p className="text-sm font-bold text-slate-900 bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                {selectedEntry.subject}
              </p>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-1">
                Complete Legal Narrative
              </h4>
              <div className="text-xs sm:text-sm text-slate-800 leading-relaxed font-sans bg-white p-4 rounded-xl border border-slate-200 whitespace-pre-wrap">
                {selectedEntry.narrative}
              </div>
            </div>

            {selectedEntry.relatedComplaintNumber && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs flex items-center justify-between">
                <span className="font-medium text-blue-900">
                  Cross-referenced Complaint: <strong>{selectedEntry.relatedComplaintNumber}</strong>
                </span>
                <span className="text-blue-700 font-semibold">Registered in BNSS Ledger</span>
              </div>
            )}

            <div className="p-4 bg-slate-50 border-t border-slate-200 -mx-6 -mb-6 rounded-b-2xl flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                Digitally recorded under Section 167 BNSS / PPR 22.48
              </span>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => window.print()}>
                  <Printer className="w-3.5 h-3.5 mr-1" />
                  Print Extract
                </Button>
                <Button size="sm" variant="primary" onClick={() => setSelectedEntry(null)}>
                  Close
                </Button>
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
    <React.Suspense fallback={<LoadingSkeleton count={3} />}>
      <GeneralDiaryContent />
    </React.Suspense>
  );
}
