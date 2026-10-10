"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Printer,
  Download,
  X,
  Lock,
  Calendar,
  BookOpen,
  Filter,
  RotateCcw,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GeneralDiaryService } from "@/services/generalDiaryService";
import { GeneralDiaryRecord } from "@/types/generalDiary";
import { toDDMMYYYY, parseGDActivityDateTime } from "@/lib/gdDateTime";

interface GDPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Optional initial date filter (yyyy-mm-dd); defaults to empty so all days show */
  initialDate?: string;
}

function formatHeaderDate(iso: string): string {
  try {
    const parts = iso.split("-");
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      const dt = new Date(y, m, d);
      const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const hindiDays = ["रविवार", "सोमवार", "मंगलवार", "बुधवार", "गुरुवार", "शुक्रवार", "शनिवार"];
      const dayIdx = dt.getDay();
      return `${toDDMMYYYY(iso)} (${dayNames[dayIdx]} / ${hindiDays[dayIdx]})`;
    }
    return toDDMMYYYY(iso);
  } catch {
    return toDDMMYYYY(iso);
  }
}

// Print & Download friendly General Diary Register (All Days, Latest to Oldest, Date Wise Filter)
export function GDPrintModal({ isOpen, onClose, initialDate }: GDPrintModalProps) {
  // Date range filter: empty by default so ALL days are displayed
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [searchFilter, setSearchFilter] = useState<string>("");
  const [records, setRecords] = useState<GeneralDiaryRecord[]>([]);
  const [loading, setLoading] = useState(false);

  // Sync initial date only when modal opens and if initialDate is explicitly provided
  useEffect(() => {
    if (isOpen) {
      if (initialDate && initialDate.trim() !== "") {
        setStartDate(initialDate);
        setEndDate(initialDate);
      } else {
        setStartDate("");
        setEndDate("");
      }
      setSearchFilter("");
    }
  }, [isOpen, initialDate]);

  // Fetch entries whenever date range changes
  useEffect(() => {
    if (!isOpen) return;
    let alive = true;
    setLoading(true);

    GeneralDiaryService.getPaginatedEntries(
      {
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        isLocked: true,
      },
      1,
      2000
    )
      .then((res) => {
        if (!alive) return;
        setRecords(res.records || []);
      })
      .catch(() => {
        if (alive) setRecords([]);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [isOpen, startDate, endDate]);

  // Filter records by keyword search if user typed anything
  const filteredRecords = useMemo(() => {
    if (!searchFilter.trim()) return records;
    const q = searchFilter.toLowerCase().trim();
    return records.filter(
      (r) =>
        r.subject.toLowerCase().includes(q) ||
        r.narrative.toLowerCase().includes(q) ||
        r.gdNumber.toLowerCase().includes(q) ||
        r.typeDisplay.toLowerCase().includes(q) ||
        r.entryForOfficer.name.toLowerCase().includes(q)
    );
  }, [records, searchFilter]);

  // Group records by date (YYYY-MM-DD), sorted DESCENDING (latest date at top down to oldest)
  const groupedData = useMemo(() => {
    const groups: Record<string, GeneralDiaryRecord[]> = {};

    filteredRecords.forEach((rec) => {
      const dateISO =
        (rec as any)._sortGdDate ||
        parseGDActivityDateTime(rec.activityDateTime || "").dateISO ||
        "Unknown";

      if (!groups[dateISO]) {
        groups[dateISO] = [];
      }
      groups[dateISO].push(rec);
    });

    // Sort date keys in descending order (latest day at the top)
    const sortedDateKeys = Object.keys(groups).sort((a, b) => b.localeCompare(a));

    // Inside each day, sort entries chronologically by sequencePerDay ascending (1, 2, 3...)
    sortedDateKeys.forEach((key) => {
      groups[key].sort((a, b) => (a.sequencePerDay || 0) - (b.sequencePerDay || 0));
    });

    return { sortedDateKeys, groups };
  }, [filteredRecords]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  // Standalone HTML Download (Offline printable official document)
  const handleDownload = () => {
    const policeStation = records[0]?.policeStation || "PS City Thanesar";
    const district = records[0]?.district || "Kurukshetra";
    const dateRangeLabel =
      startDate && endDate
        ? `${toDDMMYYYY(startDate)} to ${toDDMMYYYY(endDate)}`
        : startDate
        ? `From ${toDDMMYYYY(startDate)}`
        : endDate
        ? `Until ${toDDMMYYYY(endDate)}`
        : "Complete Register (All Days)";

    let sectionsHtml = "";

    groupedData.sortedDateKeys.forEach((dateKey) => {
      const dayRecords = groupedData.groups[dateKey];
      const headerDateStr = formatHeaderDate(dateKey);

      let rowsHtml = "";
      dayRecords.forEach((rec) => {
        const timePart = rec.activityDateTime.includes(" ")
          ? rec.activityDateTime.split(" ").slice(1).join(" ")
          : "—";

        rowsHtml += `
          <tr>
            <td style="border: 1px solid #475569; padding: 6px 8px; font-weight: bold; font-family: monospace; text-align: center;">
              ${rec.sequencePerDay || 1}
              <div style="font-size: 9px; color: #64748b; font-weight: normal;">${rec.gdNumber}</div>
            </td>
            <td style="border: 1px solid #475569; padding: 6px 8px; font-family: monospace; white-space: nowrap;">
              ${timePart}
            </td>
            <td style="border: 1px solid #475569; padding: 6px 8px; font-weight: 600;">
              ${rec.typeDisplay}
            </td>
            <td style="border: 1px solid #475569; padding: 6px 8px;">
              <strong>${rec.entryForOfficer.name}</strong>
              <div style="font-size: 10px; color: #475569;">${rec.entryForOfficer.rank} • ${rec.entryForOfficer.beltNumber || "Station Staff"}</div>
            </td>
            <td style="border: 1px solid #475569; padding: 6px 8px; font-weight: bold;">
              ${rec.subject}
            </td>
            <td style="border: 1px solid #475569; padding: 6px 8px; line-height: 1.45;">
              ${rec.narrative}
            </td>
          </tr>
        `;
      });

      sectionsHtml += `
        <div style="margin-top: 24px; page-break-inside: avoid;">
          <div style="background-color: #0b192c; color: white; padding: 6px 12px; font-weight: bold; font-size: 13px; display: flex; justify-content: space-between;">
            <span>📅 तारीख / Date: ${headerDateStr}</span>
            <span>कुल प्रविष्टियां: ${dayRecords.length}</span>
          </div>
          <table style="width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 4px;">
            <thead>
              <tr style="background-color: #f1f5f9; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px;">
                <th style="border: 1px solid #475569; padding: 6px 8px; text-align: left; width: 65px;">GD No.</th>
                <th style="border: 1px solid #475569; padding: 6px 8px; text-align: left; width: 75px;">Time</th>
                <th style="border: 1px solid #475569; padding: 6px 8px; text-align: left; width: 120px;">Type</th>
                <th style="border: 1px solid #475569; padding: 6px 8px; text-align: left; width: 140px;">Officer</th>
                <th style="border: 1px solid #475569; padding: 6px 8px; text-align: left; width: 150px;">Subject</th>
                <th style="border: 1px solid #475569; padding: 6px 8px; text-align: left;">Brief Description</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </div>
      `;
    });

    const fullHtml = `<!DOCTYPE html>
<html lang="hi">
<head>
  <meta charset="UTF-8">
  <title>General Diary Register - ${policeStation}</title>
  <style>
    @page { size: A4 portrait; margin: 12mm; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; color: #0f172a; margin: 0; padding: 15px; background: #fff; }
    .header { text-align: center; border-bottom: 2px solid #0b192c; padding-bottom: 10px; margin-bottom: 15px; }
    .header h1 { margin: 0; font-size: 18px; text-transform: uppercase; letter-spacing: 0.5px; }
    .header h2 { margin: 4px 0; font-size: 14px; font-weight: normal; color: #334155; }
    .header p { margin: 2px 0; font-size: 11px; color: #64748b; font-family: monospace; }
    .footer-signatures { margin-top: 35px; padding-top: 15px; border-top: 1px solid #94a3b8; display: flex; justify-content: space-between; font-size: 11px; font-weight: bold; }
    @media print {
      body { padding: 0; }
      .noprint { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>HARYANA POLICE • GENERAL DIARY REGISTER NO. II</h1>
    <h2>${policeStation}, District ${district} • Punjab Police Rules (PPR) 1934 Rule 22.48</h2>
    <p>Range: ${dateRangeLabel} • Total Entries: ${filteredRecords.length} • Generated on: ${new Date().toLocaleString("en-IN")}</p>
  </div>
  ${sectionsHtml}
  <div class="footer-signatures">
    <div>Prepared by (MHC / DO): ____________________</div>
    <div style="text-align: center;">Checked by (SI / Reader): ____________________</div>
    <div style="text-align: right;">SHO / In-Charge: ____________________</div>
  </div>
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const safeStart = startDate ? startDate.replace(/[^0-9-]/g, "") : "all";
    const safeEnd = endDate ? endDate.replace(/[^0-9-]/g, "") : "latest";
    a.download = `GD_Register_${safeStart}_to_${safeEnd}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/65 backdrop-blur-xs print:bg-white print:p-0">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .gd-print-area, .gd-print-area * { visibility: visible; }
          .gd-print-area {
            position: absolute;
            left: 0; top: 0;
            width: 100%;
            max-height: none;
            overflow: visible;
            box-shadow: none;
            border-radius: 0;
            padding: 0;
          }
          .gd-print-noprint { display: none !important; }
          @page { size: A4 portrait; margin: 12mm; }
        }
      `}</style>

      <div className="gd-print-area bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-6xl w-full max-h-[92vh] flex flex-col overflow-hidden print:max-h-none print:overflow-visible print:border-0 print:rounded-none">
        {/* Modal Top Header (Shows in Print as Official Header) */}
        <div className="bg-[#0b192c] text-white p-4 sm:p-5 flex items-start justify-between gap-3 rounded-t-2xl shrink-0 print:bg-white print:text-black print:rounded-none print:border-b-2 print:border-black print:p-0 print:pb-3">
          <div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-300 print:hidden" />
              <h3 className="font-bold text-base sm:text-lg tracking-tight">
                General Diary Register (रोज़नामचा आम रजिस्टर)
              </h3>
            </div>
            <p className="text-[11px] text-blue-200/90 print:text-slate-800 mt-0.5">
              PS City Thanesar, Kurukshetra • Register No. II • Punjab Police Rules (PPR) 1934 Rule 22.48
            </p>
            <p className="text-[11px] text-blue-200/80 print:text-slate-600 font-mono mt-0.5">
              {startDate && endDate
                ? `Range: ${toDDMMYYYY(startDate)} to ${toDDMMYYYY(endDate)}`
                : startDate
                ? `From: ${toDDMMYYYY(startDate)}`
                : endDate
                ? `Until: ${toDDMMYYYY(endDate)}`
                : "All Registered Days (सभी दर्ज दिवस — नवीनतम से पूर्व)"}
              {" • "}
              Total Entries: {filteredRecords.length}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="gd-print-noprint p-1 text-blue-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            aria-label="Close register modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Date-Wise Search & Action Bar (Never Printed) */}
        <div className="gd-print-noprint bg-slate-50 border-b border-slate-200 p-3 sm:p-4 space-y-3 shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* From - To Date Pickers */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-lg px-2.5 py-1 shadow-2xs">
                <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  <span>From:</span>
                </span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="text-xs font-mono font-semibold text-slate-900 bg-transparent focus:outline-none cursor-pointer"
                  title="Filter entries from this date"
                />
              </div>

              <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-lg px-2.5 py-1 shadow-2xs">
                <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  <span>To:</span>
                </span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="text-xs font-mono font-semibold text-slate-900 bg-transparent focus:outline-none cursor-pointer"
                  title="Filter entries up to this date"
                />
              </div>

              {/* Quick Date Presets */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setStartDate("");
                    setEndDate("");
                  }}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors cursor-pointer shadow-2xs ${
                    !startDate && !endDate
                      ? "bg-blue-600 text-white"
                      : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-100"
                  }`}
                  title="Show entries from all days (सभी दिन)"
                >
                  All Days
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const todayStr = new Date().toISOString().split("T")[0];
                    setStartDate(todayStr);
                    setEndDate(todayStr);
                  }}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors cursor-pointer shadow-2xs ${
                    startDate && startDate === endDate && startDate === new Date().toISOString().split("T")[0]
                      ? "bg-blue-600 text-white"
                      : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-100"
                  }`}
                  title="Show entries of today only (आज)"
                >
                  Today
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const now = new Date();
                    const endStr = now.toISOString().split("T")[0];
                    const past = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    const startStr = past.toISOString().split("T")[0];
                    setStartDate(startStr);
                    setEndDate(endStr);
                  }}
                  className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shadow-2xs"
                  title="Show entries from past 7 days (पिछले 7 दिन)"
                >
                  Last 7 Days
                </button>

                {(startDate || endDate) && (
                  <button
                    type="button"
                    onClick={() => {
                      setStartDate("");
                      setEndDate("");
                    }}
                    className="p-1 text-slate-500 hover:text-red-600 transition-colors cursor-pointer"
                    title="Clear date filter"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Keyword Search & Actions */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Filter officer, subject..."
                  className="pl-8 pr-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 w-44 sm:w-52 focus:ring-2 focus:ring-[#0b192c]"
                />
              </div>

              {/* Download Register Button */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDownload}
                disabled={loading || filteredRecords.length === 0}
                className="bg-white hover:bg-slate-50 border-slate-300 text-slate-800 font-bold gap-1.5 text-xs cursor-pointer shadow-2xs"
                title="Download full register as offline HTML / Printable document"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span>Download</span>
              </Button>

              {/* Print Register Button */}
              <Button
                type="button"
                size="sm"
                onClick={handlePrint}
                disabled={loading || filteredRecords.length === 0}
                className="bg-[#0b192c] hover:bg-slate-900 text-white font-bold gap-1.5 text-xs cursor-pointer shadow-xs"
                title="Print General Diary Register or Save as PDF"
              >
                <Printer className="w-3.5 h-3.5 text-blue-200" />
                <span>Print</span>
              </Button>
            </div>
          </div>

          {/* Quick Info bar */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
            <span className="flex items-center gap-1.5">
              <Lock className="w-3 h-3 text-emerald-600" />
              <span>
                Showing <strong>{filteredRecords.length}</strong> locked entries across{" "}
                <strong>{groupedData.sortedDateKeys.length}</strong> date(s) (ordered latest day on top)
              </span>
            </span>
            <span>PPR 22.48 • Official Haryana Police Daily Diary</span>
          </div>
        </div>

        {/* Register Entries Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6 print:overflow-visible print:p-0 print:space-y-4">
          {loading ? (
            <div className="py-16 text-center space-y-2">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-semibold text-slate-600">Loading General Diary register entries…</p>
            </div>
          ) : groupedData.sortedDateKeys.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <Filter className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">
                कोई रिकॉर्ड नहीं मिला (No General Diary entries found)
              </p>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {startDate || endDate
                  ? "चयनित तारीख सीमा में कोई लॉक की गई GD प्रविष्टि मौजूद नहीं है। कृपया तारीख बदलें या 'All Days' पर क्लिक करें।"
                  : "No locked entries recorded yet in the register."}
              </p>
              {(startDate || endDate || searchFilter) && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setStartDate("");
                    setEndDate("");
                    setSearchFilter("");
                  }}
                  className="text-xs font-bold gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Clear Filters / Show All Days</span>
                </Button>
              )}
            </div>
          ) : (
            // Render Day Sections: Latest day at top down to oldest day
            groupedData.sortedDateKeys.map((dateKey) => {
              const dayRecords = groupedData.groups[dateKey];
              const headerDateStr = formatHeaderDate(dateKey);

              return (
                <div
                  key={dateKey}
                  className="rounded-xl border border-slate-300 overflow-hidden shadow-2xs print:border-black print:rounded-none print:shadow-none print:break-inside-avoid"
                >
                  {/* Day Header Banner */}
                  <div className="bg-[#0b192c] text-white px-4 py-2.5 flex items-center justify-between text-xs font-bold print:bg-slate-200 print:text-black print:border-b print:border-black">
                    <div className="flex items-center gap-2">
                      <span>📅 तारीख / Date:</span>
                      <span className="font-mono text-sm tracking-wide text-cyan-200 print:text-black">
                        {headerDateStr}
                      </span>
                    </div>
                    <div className="text-[11px] font-semibold text-blue-200 print:text-slate-800">
                      कुल प्रविष्टियां (Entries): {dayRecords.length}
                    </div>
                  </div>

                  {/* Day Register Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse print:text-[10px]">
                      <thead>
                        <tr className="bg-slate-100 text-slate-800 uppercase text-[10px] tracking-wider font-semibold border-b border-slate-300 print:bg-slate-100 print:border-black">
                          <th className="py-2.5 px-3 border-r border-slate-300 w-16 text-center print:border-black">
                            GD No.
                          </th>
                          <th className="py-2.5 px-3 border-r border-slate-300 w-24 print:border-black">
                            Time
                          </th>
                          <th className="py-2.5 px-3 border-r border-slate-300 w-32 print:border-black">
                            GD Type
                          </th>
                          <th className="py-2.5 px-3 border-r border-slate-300 w-40 print:border-black">
                            Entry for Officer
                          </th>
                          <th className="py-2.5 px-3 border-r border-slate-300 w-44 print:border-black">
                            Subject
                          </th>
                          <th className="py-2.5 px-3 print:border-black">
                            Brief Description (विवरण)
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 print:divide-black">
                        {dayRecords.map((rec) => {
                          const timePart = rec.activityDateTime.includes(" ")
                            ? rec.activityDateTime.split(" ").slice(1).join(" ")
                            : "—";

                          return (
                            <tr
                              key={rec.id}
                              className="hover:bg-slate-50/70 transition-colors align-top print:border-b print:border-slate-400"
                            >
                              {/* 1. GD No */}
                              <td className="py-2.5 px-3 border-r border-slate-200 text-center font-mono font-black text-sm text-blue-950 print:border-black print:text-black">
                                {rec.sequencePerDay || 1}
                                <span className="block text-[9px] text-slate-500 font-normal">
                                  {rec.gdNumber}
                                </span>
                              </td>

                              {/* 2. Time */}
                              <td className="py-2.5 px-3 border-r border-slate-200 font-mono text-xs font-bold text-slate-800 whitespace-nowrap print:border-black">
                                {timePart}
                              </td>

                              {/* 3. GD Type */}
                              <td className="py-2.5 px-3 border-r border-slate-200 print:border-black">
                                <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200 print:border-0 print:p-0">
                                  {rec.typeDisplay}
                                </span>
                              </td>

                              {/* 4. Entry for Officer */}
                              <td className="py-2.5 px-3 border-r border-slate-200 print:border-black">
                                <p className="font-bold text-slate-900 text-xs">
                                  {rec.entryForOfficer.name}
                                </p>
                                <p className="text-[10px] text-slate-500">
                                  {rec.entryForOfficer.rank}
                                  {rec.entryForOfficer.beltNumber &&
                                  rec.entryForOfficer.beltNumber !== "Station Staff"
                                    ? ` • ${rec.entryForOfficer.beltNumber}`
                                    : ""}
                                </p>
                              </td>

                              {/* 5. Subject */}
                              <td className="py-2.5 px-3 border-r border-slate-200 font-bold text-slate-950 text-xs leading-snug break-words print:border-black">
                                {rec.subject}
                              </td>

                              {/* 6. Brief Description */}
                              <td className="py-2.5 px-3 text-slate-700 text-xs leading-relaxed break-words print:border-black">
                                {rec.narrative}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })
          )}

          {/* Official Footer signature strip (prints at bottom) */}
          <div className="mt-8 pt-5 border-t border-slate-300 grid grid-cols-3 gap-4 text-xs text-slate-700 font-bold print:border-black print:text-[10px] print:pt-4">
            <div>
              <p>Prepared by (MHC / DO):</p>
              <div className="mt-6 border-b border-dotted border-slate-400 w-40" />
            </div>
            <div className="text-center">
              <p>Checked by (SI / Reader):</p>
              <div className="mt-6 border-b border-dotted border-slate-400 w-40 mx-auto" />
            </div>
            <div className="text-right">
              <p>SHO / In-Charge PS:</p>
              <div className="mt-6 border-b border-dotted border-slate-400 w-40 ml-auto" />
            </div>
          </div>
        </div>

        {/* Bottom Actions Bar (Never Printed) */}
        <div className="gd-print-noprint px-4 sm:px-6 py-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-600 font-semibold">
            Showing <strong>{filteredRecords.length}</strong> records across{" "}
            <strong>{groupedData.sortedDateKeys.length}</strong> day(s)
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="gap-1 text-xs cursor-pointer"
            >
              Close
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownload}
              disabled={loading || filteredRecords.length === 0}
              className="gap-1.5 text-xs font-bold border-slate-300 text-slate-800 hover:bg-slate-100 cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>Download Register</span>
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={handlePrint}
              disabled={loading || filteredRecords.length === 0}
              className="bg-[#0b192c] hover:bg-slate-900 text-white font-bold gap-1.5 text-xs cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Register</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
