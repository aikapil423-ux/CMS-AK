"use client";

import React, { useRef } from "react";
import {
  Printer,
  X,
  Shield,
  Lock,
  FileCheck2,
  Clock,
  User,
  Car,
  FileText,
  BadgeCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Layers,
  History,
  Paperclip,
  Image as ImageIcon,
  FileDown,
} from "lucide-react";
import { GeneralDiaryRecord } from "@/types/generalDiary";
import { Button } from "@/components/ui/button";
import { formatDate, formatDateTime } from "@/lib/utils";
import { printA4Element, downloadA4DocumentAsHtml } from "@/utils/printElement";

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

  React.useEffect(() => {
    if (isOpen && autoPrint && record) {
      const timer = setTimeout(() => {
        handlePrint();
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoPrint, record]);

  if (!isOpen || !record) return null;

  const handlePrint = () => {
    printA4Element("printable-gd-record", `GD_${record.gdNumber || "Record"}`);
  };

  const handleDownload = () => {
    downloadA4DocumentAsHtml(
      "printable-gd-record",
      `GD_${record.gdNumber || "Record"}`,
      `General Diary Record - ${record.gdNumber}`
    );
  };

  const isLocked = record.isLocked;
  const isSuggested = record.status === "SUGGESTED";
  const isDraft = record.status === "DRAFT";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-xs overflow-y-auto animate-in fade-in-50">
      <div className="relative w-full max-w-4xl bg-white rounded-lg shadow-xl border border-slate-300 overflow-hidden flex flex-col my-auto max-h-[94vh]">
        {/* Modal Control Bar */}
        <div className="no-print flex items-center justify-between px-5 py-3 bg-[#0b192c] text-white border-b border-slate-700">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-amber-500/20 border border-amber-400/40 flex items-center justify-center">
              {isLocked ? (
                <Lock className="w-3.5 h-3.5 text-amber-400" />
              ) : isSuggested ? (
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              ) : (
                <FileText className="w-3.5 h-3.5 text-blue-400" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm leading-tight text-white">
                  {record.gdNumber || "Roznamcha Record"}
                </h3>
                {isLocked && (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.2 rounded font-mono font-bold">
                    LOCKED &amp; IMMUTABLE
                  </span>
                )}
                {isSuggested && (
                  <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/40 px-2 py-0.2 rounded font-mono font-bold">
                    SUGGESTION
                  </span>
                )}
                {isDraft && (
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.2 rounded font-mono font-bold">
                    DRAFT
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-300">
                PPR 1934 Rule 22.48 • Register No. II • {record.policeStation}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              title="Download clean A4 HTML document"
            >
              <FileDown className="w-3.5 h-3.5 text-emerald-300" />
              <span>Download A4</span>
            </Button>
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
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Document Area */}
        <div className="overflow-y-auto p-4 sm:p-6 bg-slate-100 flex justify-center">
          <div
            id="printable-gd-record"
            ref={printRef}
            className="w-full max-w-[800px] bg-white border border-slate-400 p-8 sm:p-12 text-slate-950 space-y-5 font-serif shadow-sm print:shadow-none print:border-none print:p-0 relative"
            style={{ minHeight: "750px", lineHeight: "1.6" }}
          >
            {/* Haryana Police Official Header */}
            <div className="text-center pb-3 border-b-2 border-slate-900">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Shield className="w-7 h-7 text-[#0b192c]" />
                <span className="text-xs font-bold tracking-widest uppercase text-[#0b192c]">
                  HARYANA POLICE • हरियाणा पुलिस
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-bold uppercase tracking-wide text-slate-950">
                रोजनामचा आम (REGISTER NO. II)
              </h1>
              <p className="text-xs font-semibold uppercase text-slate-800 tracking-wider mt-0.5">
                {record.policeStation}, District {record.district}
              </p>
              <p className="text-[11px] text-slate-600 italic mt-0.5">
                (Statutory Station Diary Record under Punjab Police Rules 1934, Rule 22.48)
              </p>
            </div>

            {/* GD Number & Timestamp Bar */}
            <div className="border border-slate-400 p-3 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs sm:text-sm font-sans">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900">रपट नंबर (GD No):</span>
                <span className="font-mono font-bold text-slate-950 border border-slate-400 px-2 py-0.5 bg-slate-50">
                  {record.gdNumber}
                </span>
                {record.sequencePerDay > 0 && (
                  <span className="text-xs text-slate-700 border border-slate-300 px-1.5 py-0.5">
                    Seq: #{record.sequencePerDay}
                  </span>
                )}
              </div>
              <div className="flex flex-col sm:items-end text-[11px] sm:text-xs">
                <div>
                  <span className="font-bold text-slate-800">कार्यवाही समय: </span>
                  <span className="font-mono text-slate-950 font-semibold">
                    {formatDateTime(record.activityDateTime)}
                  </span>
                </div>
                <div className="text-slate-600 text-[10px]">
                  <span>Server Recorded: </span>
                  <span className="font-mono">
                    {formatDateTime(record.officialCreationTimestamp)}
                  </span>
                </div>
              </div>
            </div>

            {/* Classification & Subject */}
            <div className="border border-slate-400 p-3 bg-white space-y-2 text-xs sm:text-sm font-sans">
              <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2">
                <span className="font-bold text-slate-800 min-w-[150px] shrink-0">
                  इंद्राज का प्रकार (Type):
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-slate-950">
                    {record.typeDisplayHi}
                  </span>
                  <span className="text-xs text-slate-600">
                    ({record.typeDisplay})
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2 pt-2 border-t border-slate-300">
                <span className="font-bold text-slate-800 min-w-[150px] shrink-0 uppercase tracking-wide">
                  विषय (SUBJECT):
                </span>
                <span className="font-bold text-slate-950 flex-1 leading-snug">
                  {record.subject}
                </span>
              </div>
            </div>

            {/* Officer Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-sans">
              {/* Entry-For Officer */}
              <div className="border border-slate-400 p-3 bg-white space-y-1.5 text-xs">
                <div className="flex items-center gap-1.5 pb-1 border-b border-slate-300">
                  <User className="w-3.5 h-3.5 text-slate-700" />
                  <h4 className="font-bold text-slate-950 uppercase tracking-wider text-[11px]">
                    मुलाज़िम मुताल्लिक (Entry-For Officer)
                  </h4>
                </div>
                <div className="space-y-0.5 text-slate-900">
                  <p>
                    <span className="font-semibold text-slate-700">Rank:</span>{" "}
                    <span className="text-slate-950">{record.entryForOfficer.rank}</span>
                  </p>
                  <p>
                    <span className="font-semibold text-slate-700">Name:</span>{" "}
                    <span className="font-bold text-slate-950">{record.entryForOfficer.name}</span>
                  </p>
                  <p>
                    <span className="font-semibold text-slate-700">Belt Number:</span>{" "}
                    <span className="font-mono text-slate-950">{record.entryForOfficer.beltNumber}</span>
                  </p>
                  <p>
                    <span className="font-semibold text-slate-700">PNO Number:</span>{" "}
                    <span className="font-mono text-slate-950">{record.entryForOfficer.pno}</span>
                  </p>
                </div>
              </div>

              {/* Actual Author (MHC / Duty Officer) */}
              <div className="border border-slate-400 p-3 bg-white space-y-1.5 text-xs">
                <div className="flex items-center justify-between pb-1 border-b border-slate-300">
                  <div className="flex items-center gap-1.5">
                    <FileCheck2 className="w-3.5 h-3.5 text-slate-700" />
                    <h4 className="font-bold text-slate-950 uppercase tracking-wider text-[11px]">
                      मुहर्रिर / लेखक (Actual Author)
                    </h4>
                  </div>
                  <span className="text-[10px] text-slate-700 border border-slate-300 px-1 py-0.2">
                    MHC Desk
                  </span>
                </div>
                <div className="space-y-0.5 text-slate-900">
                  <p>
                    <span className="font-semibold text-slate-700">Rank:</span>{" "}
                    <span className="text-slate-950">{record.actualAuthor.rank}</span>
                  </p>
                  <p>
                    <span className="font-semibold text-slate-700">Name:</span>{" "}
                    <span className="font-bold text-slate-950">{record.actualAuthor.name}</span>
                  </p>
                  <p>
                    <span className="font-semibold text-slate-700">Belt Number:</span>{" "}
                    <span className="font-mono text-slate-950">{record.actualAuthor.beltNumber}</span>
                  </p>
                  <p>
                    <span className="font-semibold text-slate-700">PNO Number:</span>{" "}
                    <span className="font-mono text-slate-950">{record.actualAuthor.pno}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Related Records Cross-Reference Strip */}
            {record.relatedRecords && Object.values(record.relatedRecords).some(Boolean) && (
              <div className="border border-slate-400 p-3 bg-white space-y-1.5 text-xs font-sans">
                <h5 className="font-bold text-slate-800 uppercase text-[11px] flex items-center gap-1.5 border-b border-slate-300 pb-1">
                  <Layers className="w-3.5 h-3.5 text-slate-700" />
                  <span>संबंधित रिकॉर्ड्स व क्रॉस रेफरेंस (Linked Records):</span>
                </h5>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-[11px]">
                  {record.relatedRecords.complaintNumber && (
                    <div className="p-1.5 border border-slate-300">
                      <span className="text-slate-600 block text-[9px] font-sans">Complaint No:</span>
                      <strong className="text-slate-950">{record.relatedRecords.complaintNumber}</strong>
                    </div>
                  )}
                  {record.relatedRecords.firNumber && (
                    <div className="p-1.5 border border-slate-300">
                      <span className="text-slate-600 block text-[9px] font-sans">FIR No:</span>
                      <strong className="text-slate-950">{record.relatedRecords.firNumber}</strong>
                    </div>
                  )}
                  {record.relatedRecords.vehicleNumber && (
                    <div className="p-1.5 border border-slate-300">
                      <span className="text-slate-600 block text-[9px] font-sans">Vehicle:</span>
                      <strong className="text-slate-950">{record.relatedRecords.vehicleNumber}</strong>
                    </div>
                  )}
                  {record.relatedRecords.personName && (
                    <div className="p-1.5 border border-slate-300">
                      <span className="text-slate-600 block text-[9px] font-sans">Person / Accused:</span>
                      <strong className="text-slate-950">{record.relatedRecords.personName}</strong>
                    </div>
                  )}
                  {record.relatedRecords.destinationLocation && (
                    <div className="p-1.5 border border-slate-300 col-span-2">
                      <span className="text-slate-600 block text-[9px] font-sans">Destination / Location:</span>
                      <strong className="text-slate-950">{record.relatedRecords.destinationLocation}</strong>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Official Narrative / विवरण */}
            <div className="space-y-1.5 font-sans">
              <h4 className="font-bold text-slate-900 text-xs sm:text-sm uppercase tracking-wide border-b border-slate-400 pb-1">
                इंद्राज का विस्तृत विवरण (Roznamcha Narrative):
              </h4>
              <div className="border border-slate-400 p-4 bg-white text-xs sm:text-sm text-slate-950 leading-relaxed font-sans whitespace-pre-wrap">
                {record.narrative}
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
                    <span>संलग्न दस्तावेज / Uploaded Documents ({docs.length}):</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {docs.map((doc, idx) => {
                      const isImg = doc.type?.startsWith("image/");
                      return (
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
                              className="text-[11px] font-bold text-blue-700 hover:underline shrink-0"
                            >
                              Download
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Verification Status */}
            <div className="border border-slate-400 p-2.5 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-800 font-sans">
              <div className="flex items-center gap-2">
                <BadgeCheck className="w-4 h-4 text-slate-800" />
                <span className="font-bold">
                  {record.isLocked ? "Statutory Status: LOCKED & IMMUTABLE" : `Status: ${record.status}`}
                </span>
              </div>
              {record.verificationAuditId && (
                <div className="flex items-center gap-1 text-[11px] font-mono">
                  <span>Audit ID:</span>
                  <span className="font-bold border border-slate-400 px-1.5 py-0.2">
                    {record.verificationAuditId}
                  </span>
                </div>
              )}
            </div>

            {/* Statutory Legal Warning under PPR 22.48 */}
            <div className="border border-slate-300 p-2.5 bg-slate-50 text-[10px] text-slate-600 leading-relaxed font-sans">
              <strong>वैधानिक चेतावनी (Legal Notice):</strong> यह रोजनामचा प्रविष्टि पंजाब पुलिस नियम 1934 (नियम 22.48 व 22.49) के तहत थाना दैनिकी रजिस्टर नंबर 2 में दर्ज की गई है। एक बार लॉक होने के उपरांत यह प्रविष्टि न्यायालयीन साक्ष्य (Admissible in Evidence under Sec 35 Indian Evidence Act / BSA) हेतु पूर्णतः अपरिवर्तनीय व स्थाई है।
            </div>

            {/* Signatures & Seal Footer */}
            <div className="pt-4 border-t-2 border-slate-900 flex items-end justify-between text-xs font-sans">
              <div className="text-center w-36">
                <div className="h-12 border border-dashed border-slate-400 flex items-center justify-center text-[10px] text-slate-500">
                  Station Seal
                </div>
                <p className="mt-1 font-bold text-slate-800">POLICE STATION SEAL</p>
              </div>

              <div className="text-right space-y-0.5">
                <p className="text-slate-400">______________________________________</p>
                <p className="font-bold text-slate-950">
                  {record.verifiedBy?.name || record.actualAuthor.name} ({record.verifiedBy?.rank || record.actualAuthor.rank})
                </p>
                <p className="text-slate-700 text-[11px]">
                  Moharrir Head Constable / Station House Officer
                </p>
                <p className="text-slate-600 font-mono text-[11px]">
                  Belt: {record.verifiedBy?.beltNumber || record.actualAuthor.beltNumber} • {record.policeStation}
                </p>
              </div>
            </div>
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
              onClick={handleDownload}
              className="text-xs cursor-pointer flex items-center gap-1.5"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Download A4</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs cursor-pointer"
            >
              Close
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handlePrint}
              className="bg-[#0b192c] hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5 text-amber-300" />
              <span>Print Official GD Record</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
