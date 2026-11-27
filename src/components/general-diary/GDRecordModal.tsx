"use client";

import React, { useRef } from "react";
import {
  Printer,
  X,
  Shield,
  FileCheck2,
  User,
  Layers,
  Paperclip,
  FileDown,
  Scale,
  Lock,
  History,
  Loader2,
} from "lucide-react";
import { GeneralDiaryRecord } from "@/types/generalDiary";
import { Button } from "@/components/ui/button";
import { useEscapeKey } from "@/hooks/useEscapeKey";
import { useLanguage } from "@/context/LanguageContext";
import { formatDate, formatDateTime } from "@/lib/utils";
import { cleanGdNarrative } from "@/services/generalDiaryService";
import { printA4Element, downloadA4ElementAsPdf } from "@/utils/printElement";

interface GDRecordModalProps {
  record: GeneralDiaryRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onVerifyAndLock?: (record: GeneralDiaryRecord) => void;
  canVerify?: boolean;
  autoPrint?: boolean;
}

export function GDRecordModal({
  record,
  isOpen,
  onClose,
  onVerifyAndLock,
  canVerify = false,
  autoPrint = false,
}: GDRecordModalProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = React.useState(false);
  const { isHindi } = useLanguage();

  useEscapeKey(isOpen, onClose);

  const handlePrint = React.useCallback(() => {
    if (!record) return;
    printA4Element("printable-gd-record", `GD_${record.gdNumber || "Record"}`);
  }, [record]);

  const handleDownload = React.useCallback(async () => {
    if (!record || isDownloading) return;
    setIsDownloading(true);
    try {
      await downloadA4ElementAsPdf(
        "printable-gd-record",
        `GD_${record.gdNumber || "Record"}`
      );
    } catch (e) {
      console.error("PDF download failed:", e);
    } finally {
      setIsDownloading(false);
    }
  }, [record, isDownloading]);

  React.useEffect(() => {
    if (isOpen && autoPrint && record) {
      const timer = setTimeout(() => {
        handlePrint();
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoPrint, record, handlePrint]);

  if (!isOpen || !record) return null;

  const isLocked = record.isLocked;
  const isSuggested = record.status === "SUGGESTED";
  const isDraft = record.status === "DRAFT";

  // Format short GD Rapat number (e.g. "01", "02", "03") from sequencePerDay or gdNumber suffix
  const displayGdNumber = React.useMemo(() => {
    if (record.sequencePerDay) {
      return String(record.sequencePerDay).padStart(2, "0");
    }
    const match = (record.gdNumber || "").match(/-(\d+)$/);
    if (match && match[1]) {
      const num = parseInt(match[1], 10);
      return !isNaN(num) ? String(num).padStart(2, "0") : match[1];
    }
    return record.gdNumber || "";
  }, [record.sequencePerDay, record.gdNumber]);

  // Extract separate date and time for activity
  const activityDateDisplay = React.useMemo(() => {
    return formatDate(record.activityDateTime);
  }, [record.activityDateTime]);

  const activityTimeDisplay = React.useMemo(() => {
    const full = formatDateTime(record.activityDateTime);
    // formatDateTime returns "DD/MM/YYYY HH:mm AM/PM"
    const parts = full.split(" ");
    if (parts.length >= 2) {
      return parts.slice(1).join(" ");
    }
    return full;
  }, [record.activityDateTime]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-xs overflow-y-auto animate-in fade-in-50"
      role="dialog"
      aria-modal="true"
      aria-label={record.gdNumber || "Roznamcha Record"}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl bg-white rounded-lg shadow-xl border border-slate-300 overflow-hidden flex flex-col my-auto max-h-[94vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Control Bar */}
        <div className="no-print flex items-center justify-between px-5 py-3 bg-[#0b192c] text-white border-b border-slate-700">
          <div className="flex items-center gap-2.5">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm leading-tight text-white">
                  {isLocked ? `GD No. ${displayGdNumber || "Record"}` : (record.gdNumber || "Record")}
                </h3>
                {isLocked && displayGdNumber !== record.gdNumber && (
                  <span className="text-[11px] text-slate-300 font-mono">
                    ({record.gdNumber})
                  </span>
                )}
                {isSuggested && (
                  <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/40 px-2 py-0.5 rounded font-mono font-bold">
                    SUGGESTION
                  </span>
                )}
                {isDraft && (
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded font-mono font-bold">
                    DRAFT
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-300">
                {record.policeStation}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-amber-300" />
              <span>Print</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownload}
              disabled={isDownloading}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
              title="Download PDF document"
            >
              {isDownloading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-300" />
              ) : (
                <FileDown className="w-3.5 h-3.5 text-emerald-300" />
              )}
              <span>{isDownloading ? "Downloading..." : "Download"}</span>
            </Button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-white hover:text-white hover:bg-white/10 rounded-md transition-colors cursor-pointer"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Document Area */}
        <div className="overflow-y-auto p-4 sm:p-6 bg-slate-100">
          <div
            id="printable-gd-record"
            ref={printRef}
            className="cms-paper-sheet w-full max-w-[800px] mx-auto bg-white border border-slate-400 p-8 sm:p-10 text-slate-950 space-y-5 font-serif shadow-sm relative my-3 min-h-[750px] h-auto"
            style={{ lineHeight: "1.6" }}
          >
            {/* Haryana Police Official Header */}
            <div className="text-center pb-2 border-b-2 border-slate-900">
              <h1 className="text-sm sm:text-base font-bold uppercase tracking-wide text-slate-950">
                {isHindi ? "रोजनामचा रजिस्टर नंबर II" : "General Diary Register No. II"}
              </h1>
              <p className="text-xs sm:text-sm font-semibold uppercase text-slate-800 tracking-wider mt-0.5">
                {record.policeStation}, {isHindi ? `जिला ${record.district}` : `District ${record.district}`}
              </p>
            </div>

            {/* GD Number & Timestamp Bar - 3 Columns */}
            <div className="border border-slate-400 p-3 bg-white grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs sm:text-sm font-sans">
              {/* Column 1: GD Number */}
              <div className="flex flex-col sm:items-start justify-start">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 shrink-0">
                    {isHindi ? "रपट नंबर:" : "GD Number:"}
                  </span>
                  <span className="font-mono font-bold text-slate-950 border border-slate-400 px-2.5 py-0.5 bg-slate-50 text-sm">
                    {displayGdNumber}
                  </span>
                </div>
                {isLocked && displayGdNumber !== record.gdNumber && (
                  <div className="text-slate-500 text-[10px] font-mono mt-0.5">
                    ({record.gdNumber})
                  </div>
                )}
              </div>

              {/* Column 2: Date */}
              <div className="flex flex-col sm:items-center justify-start">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800 shrink-0">
                    {isHindi ? "दिनांक:" : "Date:"}
                  </span>
                  <span className="font-mono text-slate-950 font-semibold bg-slate-50 border border-slate-300 px-2.5 py-0.5 text-sm">
                    {activityDateDisplay}
                  </span>
                </div>
              </div>

              {/* Column 3: Time */}
              <div className="flex flex-col sm:items-end justify-start">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-800">
                    {isHindi ? "समय:" : "Time:"}
                  </span>
                  <span className="font-mono text-slate-950 font-semibold bg-slate-50 border border-slate-300 px-2.5 py-0.5 text-sm">
                    {activityTimeDisplay}
                  </span>
                </div>
                <div className="text-slate-500 text-[10px] mt-0.5">
                  <span>{isHindi ? "सर्वर: " : "Server: "}</span>
                  <span className="font-mono">
                    {formatDateTime(record.officialCreationTimestamp)}
                  </span>
                </div>
              </div>
            </div>

            {/* Officer Details - Single Row Bar */}
            <div className="border border-slate-400 p-3 bg-white text-xs sm:text-sm font-sans">
              <div className="flex flex-row items-center gap-6">
                <div className="flex items-center gap-1.5 shrink-0 min-w-[150px]">
                  <User className="w-3.5 h-3.5 text-slate-700" />
                  <span className="font-bold text-slate-800 uppercase tracking-wide text-xs">
                    {isHindi ? "इंद्राज अधिकारी:" : "Entry For Officer:"}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-slate-900">
                  <div>
                    <span className="font-semibold text-slate-700">{isHindi ? "पद: " : "Rank: "}</span>
                    <span className="text-slate-950 font-medium">{record.entryForOfficer.rank}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700">{isHindi ? "नाम: " : "Name: "}</span>
                    <span className="font-bold text-slate-950">{record.entryForOfficer.name}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700">{isHindi ? "बेल्ट/PNO: " : "Belt/PNO: "}</span>
                    <span className="font-mono text-slate-950 font-semibold">
                      {record.entryForOfficer.beltNumber || record.entryForOfficer.pno}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Classification & Subject */}
            <div className="border border-slate-400 p-3 bg-white space-y-2 text-xs sm:text-sm font-sans">
              <div className="flex flex-row items-center gap-2">
                <span className="font-bold text-slate-800 min-w-[150px] shrink-0">
                  {isHindi ? "इंद्राज का प्रकार:" : "Entry Type:"}
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-slate-950">
                    {isHindi ? record.typeDisplayHi : record.typeDisplay}
                  </span>
                </div>
              </div>

              <div className="flex flex-row items-start gap-2 pt-2 border-t border-slate-300">
                <span className="font-bold text-slate-800 min-w-[150px] shrink-0 uppercase tracking-wide">
                  {isHindi ? "विषय:" : "Subject:"}
                </span>
                <span className="font-bold text-slate-950 flex-1 min-w-0 leading-snug break-words [overflow-wrap:anywhere]">
                  {record.subject}
                </span>
              </div>
            </div>

            {/* Criminal Case Details Strip (Case Type & Acts & Sections) */}
            {(record.caseType || record.actsAndSections || record.relatedRecords?.caseType || record.relatedRecords?.actsAndSections) && (
              <div className="border-2 border-red-300 p-3 bg-red-50/50 space-y-2 text-xs font-sans rounded-md">
                <div className="flex items-center justify-between border-b border-red-200 pb-1.5">
                  <h5 className="font-bold text-red-950 uppercase text-[11px] flex items-center gap-1.5">
                    <Scale className="w-3.5 h-3.5 text-red-600" />
                    <span>
                      {isHindi ? "आपराधिक मामला विवरण:" : "Criminal Case & FIR Specification:"}
                    </span>
                  </h5>
                  <span className="text-[10px] bg-red-100 text-red-800 font-bold px-2 py-0.5 rounded border border-red-200">
                    BNSS Sec 173 / BNS
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-0.5">
                  <div className="p-2 bg-white rounded border border-red-200">
                    <span className="text-slate-600 block text-[10px] font-semibold uppercase">
                      {isHindi ? "1. केस प्रकार:" : "1. Case Type:"}
                    </span>
                    <strong className="text-red-950 text-xs tracking-wide">
                      {record.caseType || record.relatedRecords?.caseType || "ADULT"}
                    </strong>
                  </div>
                  <div className="p-2 bg-white rounded border border-red-200">
                    <span className="text-slate-600 block text-[10px] font-semibold uppercase">
                      {isHindi ? "2. अधिनियम व धाराएं:" : "2. Acts & Sections:"}
                    </span>
                    <strong className="text-slate-900 font-mono text-xs">
                      {record.actsAndSections || record.relatedRecords?.actsAndSections || "Not Specified"}
                    </strong>
                    {record.majorAct && (
                      <span className="text-[10px] text-slate-500 block mt-0.5">
                        {isHindi ? `मुख्य अधिनियम: ${record.majorAct}` : `Major Act: ${record.majorAct}`}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Related Records Cross-Reference Strip */}
            {record.relatedRecords && Object.values(record.relatedRecords).some(Boolean) && (
              <div className="border border-slate-400 p-3 bg-white space-y-1.5 text-xs font-sans">
                <h5 className="font-bold text-slate-800 uppercase text-[11px] flex items-center gap-1.5 border-b border-slate-300 pb-1">
                  <Layers className="w-3.5 h-3.5 text-slate-700" />
                  <span>
                    {isHindi ? "संबंधित रिकॉर्ड्स व क्रॉस संदर्भ:" : "Linked Records & Cross References:"}
                  </span>
                </h5>
                <div className="grid grid-cols-4 gap-2 pt-1 font-mono text-[11px]">
                  {record.relatedRecords.complaintNumber && (
                    <div className="p-1.5 border border-slate-300">
                      <span className="text-slate-600 block text-[9px] font-sans">
                        {isHindi ? "शिकायत सं:" : "Complaint No:"}
                      </span>
                      <strong className="text-slate-950">{record.relatedRecords.complaintNumber}</strong>
                    </div>
                  )}
                  {record.relatedRecords.firNumber && (
                    <div className="p-1.5 border border-slate-300">
                      <span className="text-slate-600 block text-[9px] font-sans">
                        {isHindi ? "FIR सं:" : "FIR No:"}
                      </span>
                      <strong className="text-slate-950">{record.relatedRecords.firNumber}</strong>
                    </div>
                  )}
                  {record.relatedRecords.vehicleNumber && (
                    <div className="p-1.5 border border-slate-300">
                      <span className="text-slate-600 block text-[9px] font-sans">
                        {isHindi ? "वाहन सं:" : "Vehicle No:"}
                      </span>
                      <strong className="text-slate-950">{record.relatedRecords.vehicleNumber}</strong>
                    </div>
                  )}
                  {record.relatedRecords.personName && (
                    <div className="p-1.5 border border-slate-300">
                      <span className="text-slate-600 block text-[9px] font-sans">
                        {isHindi ? "व्यक्ति / अभियुक्त:" : "Person / Accused:"}
                      </span>
                      <strong className="text-slate-950">{record.relatedRecords.personName}</strong>
                    </div>
                  )}
                  {record.relatedRecords.destinationLocation && (
                    <div className="p-1.5 border border-slate-300 col-span-2">
                      <span className="text-slate-600 block text-[9px] font-sans">
                        {isHindi ? "गंतव्य / स्थान:" : "Destination / Location:"}
                      </span>
                      <strong className="text-slate-950">{record.relatedRecords.destinationLocation}</strong>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Official Narrative / विवरण */}
            <div className="space-y-1.5 font-sans">
              <h4 className="font-bold text-slate-900 text-xs sm:text-sm uppercase tracking-wide border-b border-slate-400 pb-1">
                {isHindi ? "विवरण:" : "Brief:"}
              </h4>
              <div className="border border-slate-400 p-4 bg-white text-xs sm:text-sm text-slate-950 leading-relaxed font-sans whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
                {cleanGdNarrative(record.narrative)}
              </div>
            </div>

            {/* Attached Documents */}
            {(() => {
              const docs =
                (record.attachments && record.attachments.length > 0)
                  ? record.attachments
                  : record.relatedRecords?.attachments || [];
              if (docs.length === 0) return null;

              return (
                <div className="space-y-1.5 font-sans">
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide border-b border-slate-400 pb-1 flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-slate-700" />
                    <span>
                      {isHindi ? `संलग्न दस्तावेज (${docs.length}):` : `Uploaded Documents (${docs.length}):`}
                    </span>
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {docs.map((doc, idx) => (
                      <div
                        key={doc.id || idx}
                        className="border border-slate-300 p-2.5 flex items-center justify-between text-xs"
                      >
                        <div className="truncate mr-2">
                          <p className="font-semibold text-slate-900 truncate" title={doc.name}>
                            {doc.name}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            {(doc.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                        {doc.dataUrl && (
                          <a
                            href={doc.dataUrl}
                            download={doc.name}
                            className="no-print text-[11px] font-bold text-blue-700 hover:underline shrink-0"
                          >
                            {isHindi ? "डाउनलोड" : "Download"}
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Signatures & Seal Footer */}
            {(() => {
              const signatory = record.verifiedBy || record.actualAuthor;
              const beltVal = signatory?.beltNumber || signatory?.pno || "—";
              return (
                <div className="pt-4 border-t-2 border-slate-900 flex flex-row items-end justify-between text-xs font-sans">
                  <div className="text-center w-36">
                    <div className="h-12 border border-dashed border-slate-400 flex items-center justify-center text-[10px] text-slate-500">
                      {isHindi ? "थाना मोहर" : "Station Seal"}
                    </div>
                  </div>

                  <div className="text-right space-y-0.5">
                    <p className="text-slate-400">______________________________________</p>
                    <p className="font-bold text-slate-950">
                      {signatory?.name || "—"}
                    </p>
                    <p className="text-slate-700 text-[11px] font-medium">
                      {signatory?.rank || (isHindi ? "अधिकारी / रोजनामचा लेखक" : "Officer / Duty Writer")}
                    </p>
                    <p className="text-slate-600 font-mono text-[11px]">
                      {isHindi ? "बेल्ट/PNO:" : "Belt/PNO:"} {beltVal} • {record.policeStation}
                    </p>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="no-print p-3 bg-slate-100 border-t border-slate-300 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <History className="w-3.5 h-3.5 text-slate-500" />
            <span>Audit Trail: {record.auditTrail.length} step(s)</span>
          </div>
          <div className="flex items-center gap-2">
            {!isLocked && onVerifyAndLock && canVerify && (
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => onVerifyAndLock(record)}
                className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold gap-1.5 cursor-pointer shadow-xs"
              >
                <Lock className="w-3.5 h-3.5 text-amber-300" />
                <span>Verify &amp; Lock GD Now</span>
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs cursor-pointer"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
