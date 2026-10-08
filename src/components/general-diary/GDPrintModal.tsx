"use client";

import React, { useEffect, useState } from "react";
import { Printer, X, Lock, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GeneralDiaryService } from "@/services/generalDiaryService";
import { GeneralDiaryRecord } from "@/types/generalDiary";
import { formatGDDateDisplay } from "@/lib/gdDateTime";

interface GDPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Initial date (yyyy-mm-dd) to print; defaults to today */
  initialDate?: string;
}

// Print-friendly daily GD register (CCTNS Haryana style, dd/mm/yyyy + 24h time)
export function GDPrintModal({ isOpen, onClose, initialDate }: GDPrintModalProps) {
  const [printDate, setPrintDate] = useState(
    initialDate || new Date().toISOString().split("T")[0]
  );
  const [records, setRecords] = useState<GeneralDiaryRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    let alive = true;
    setLoading(true);
    GeneralDiaryService.getPaginatedEntries(
      { startDate: printDate, endDate: printDate, isLocked: true },
      1,
      1000
    )
      .then((res) => {
        if (!alive) return;
        setRecords(res.records);
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
  }, [isOpen, printDate]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs print:bg-white print:p-0">
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
          }
          .gd-print-noprint { display: none !important; }
          @page { size: A4 portrait; margin: 12mm; }
        }
      `}</style>

      <div className="gd-print-area bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-5xl w-full max-h-[90vh] overflow-y-auto print:max-h-none print:overflow-visible print:border-0">
        {/* Header */}
        <div className="bg-[#0b192c] text-white p-4 sm:p-5 flex items-start justify-between gap-3 rounded-t-2xl print:bg-white print:text-black print:rounded-none print:border-b-2 print:border-black">
          <div>
            <h3 className="font-bold text-base sm:text-lg">
              General Diary Register — Daily Print (Roznamcha)
            </h3>
            <p className="text-[11px] text-blue-200/80 print:text-slate-700 mt-0.5">
              PS City Thanesar, Kurukshetra • Register No. II • PPR 1934 Rule 22.48
            </p>
            <p className="text-[11px] text-blue-200/80 print:text-slate-700 font-mono mt-0.5">
              Date: {formatGDDateDisplay(new Date(printDate))}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="gd-print-noprint text-blue-200 hover:text-white transition-colors cursor-pointer"
            aria-label="Close print preview"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Register Table */}
        <div className="p-4 sm:p-5">
          {loading ? (
            <p className="text-xs text-slate-500 py-8 text-center">Loading register for {printDate}…</p>
          ) : records.length === 0 ? (
            <p className="text-xs text-slate-500 py-8 text-center">
              No locked General Diary entries found for {formatGDDateDisplay(new Date(printDate))}.
            </p>
          ) : (
            <table className="w-full border border-slate-400 text-[11px] print:text-[10px]">
              <thead>
                <tr className="bg-slate-100 print:bg-slate-200">
                  <th className="border border-slate-400 px-2 py-1.5 text-left w-16">GD No.</th>
                  <th className="border border-slate-400 px-2 py-1.5 text-left w-16">Time</th>
                  <th className="border border-slate-400 px-2 py-1.5 text-left w-28">Type</th>
                  <th className="border border-slate-400 px-2 py-1.5 text-left w-32">Entry for Officer</th>
                  <th className="border border-slate-400 px-2 py-1.5 text-left w-40">Subject</th>
                  <th className="border border-slate-400 px-2 py-1.5 text-left">Brief Description</th>
                </tr>
              </thead>
              <tbody>
                {records.map((rec) => (
                  <tr key={rec.id} className="align-top">
                    <td className="border border-slate-400 px-2 py-1.5 font-mono font-bold">
                      {rec.sequencePerDay || 1}
                    </td>
                    <td className="border border-slate-400 px-2 py-1.5 font-mono">
                      {rec.activityDateTime.includes(" ")
                        ? rec.activityDateTime.split(" ").slice(1).join(" ")
                        : "—"}
                    </td>
                    <td className="border border-slate-400 px-2 py-1.5">{rec.typeDisplay}</td>
                    <td className="border border-slate-400 px-2 py-1.5">
                      {rec.entryForOfficer.name}
                      <span className="block text-[10px] text-slate-500">
                        {rec.entryForOfficer.rank} • {rec.entryForOfficer.beltNumber}
                      </span>
                    </td>
                    <td className="border border-slate-400 px-2 py-1.5 font-semibold">{rec.subject}</td>
                    <td className="border border-slate-400 px-2 py-1.5 leading-relaxed">
                      {rec.narrative}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Footer signature strip (prints; buttons do not) */}
          <div className="mt-6 pt-4 border-t border-slate-300 grid grid-cols-3 gap-4 text-[11px] text-slate-700 font-semibold">
            <div>Prepared by (MHC / DO): ____________________</div>
            <div className="text-center">Checked by (SI): ____________________</div>
            <div className="text-right">SHO: ____________________</div>
          </div>
        </div>

        {/* Actions (never printed) */}
        <div className="gd-print-noprint px-4 sm:px-5 pb-4 sm:pb-5 pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-500" />
            <input
              type="date"
              value={printDate}
              onChange={(e) => setPrintDate(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-[#0b192c]"
            />
            <span className="text-[11px] text-slate-500 flex items-center gap-1">
              <Lock className="w-3 h-3" /> Only locked entries are printed
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <Button type="button" variant="outline" size="sm" onClick={onClose} className="gap-1.5 text-xs">
              Close
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handlePrint}
              disabled={loading || records.length === 0}
              className="bg-[#0b192c] hover:bg-slate-900 text-white font-bold gap-1.5 text-xs cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Daily Register</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
