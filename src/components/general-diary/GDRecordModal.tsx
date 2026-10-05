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
} from "lucide-react";
import { GeneralDiaryRecord } from "@/types/generalDiary";
import { Button } from "@/components/ui/button";

interface GDRecordModalProps {
  record: GeneralDiaryRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onVerifyAndLock?: (record: GeneralDiaryRecord) => void;
  canVerify?: boolean;
}

export function GDRecordModal({
  record,
  isOpen,
  onClose,
  onVerifyAndLock,
  canVerify = false,
}: GDRecordModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !record) return null;

  const handlePrint = () => {
    window.print();
  };

  const isLocked = record.isLocked;
  const isSuggested = record.status === "SUGGESTED";
  const isDraft = record.status === "DRAFT";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-xs overflow-y-auto animate-in fade-in-50">
      {/* Isolated Print Styles for PPR 22.48 Register Format */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-gd-record,
          #printable-gd-record * {
            visibility: visible;
          }
          #printable-gd-record {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 24px;
            box-shadow: none !important;
            border: 2px solid #000 !important;
            background: #fff !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[94vh]">
        {/* Modal Control Bar */}
        <div className="no-print flex items-center justify-between px-5 py-3.5 bg-[#0b192c] text-white border-b border-slate-700">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-400/40 flex items-center justify-center">
              {isLocked ? (
                <Lock className="w-4 h-4 text-amber-400" />
              ) : isSuggested ? (
                <Sparkles className="w-4 h-4 text-purple-400" />
              ) : (
                <FileText className="w-4 h-4 text-blue-400" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm leading-tight text-white">
                  {record.gdNumber || "Roznamcha Record"}
                </h3>
                {isLocked && (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded font-mono font-bold">
                    LOCKED &amp; IMMUTABLE
                  </span>
                )}
                {isSuggested && (
                  <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/40 px-2 py-0.5 rounded font-mono font-bold">
                    SYSTEM SUGGESTION
                  </span>
                )}
                {isDraft && (
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded font-mono font-bold">
                    UNOFFICIAL DRAFT
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-300">
                PPR 1934 Rule 22.48 • Register No. II • {record.policeStation}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isLocked && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-amber-300" />
                <span>Print GD</span>
              </Button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Document Area */}
        <div className="overflow-y-auto p-4 sm:p-6 bg-slate-100/70 flex justify-center">
          <div
            id="printable-gd-record"
            ref={printRef}
            className="w-full bg-white border-2 border-slate-900 rounded-2xl p-6 sm:p-8 shadow-md text-slate-900 space-y-6 font-sans relative"
            style={{ minHeight: "750px", lineHeight: "1.7" }}
          >
            {/* Haryana Police Official Header */}
            <div className="text-center pb-4 border-b-2 border-slate-900">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Shield className="w-8 h-8 text-[#0b192c]" />
                <span className="text-sm font-black tracking-widest uppercase text-[#0b192c]">
                  HARYANA POLICE • हरियाणा पुलिस
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wide text-slate-950 font-serif">
                रोजनामचा आम (REGISTER NO. II)
              </h1>
              <p className="text-xs font-bold uppercase text-slate-700 tracking-wider mt-0.5">
                {record.policeStation}, District {record.district}
              </p>
              <p className="text-[11px] text-slate-500 italic mt-0.5">
                (Statutory Station Diary Record under Punjab Police Rules 1934, Rule 22.48)
              </p>
            </div>

            {/* GD Number & Timestamp Bar */}
            <div className="p-3.5 bg-slate-50 border border-slate-300 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs sm:text-sm">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900">रपट नंबर (GD No):</span>
                <span className="font-mono font-black text-blue-900 bg-blue-100 px-2.5 py-0.5 rounded text-sm sm:text-base border border-blue-300">
                  {record.gdNumber}
                </span>
                {record.sequencePerDay > 0 && (
                  <span className="text-xs font-bold text-slate-600 bg-slate-200 px-2 py-0.5 rounded">
                    Daily Seq: #{record.sequencePerDay}
                  </span>
                )}
              </div>
              <div className="flex flex-col sm:items-end text-[11px] sm:text-xs">
                <div>
                  <span className="font-bold text-slate-700">घटना/कार्यवाही समय: </span>
                  <span className="font-semibold text-slate-900 font-mono">
                    {record.activityDateTime}
                  </span>
                </div>
                <div className="text-slate-500 text-[10px]">
                  <span>Server Recorded: </span>
                  <span className="font-mono">
                    {new Date(record.officialCreationTimestamp).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </div>

            {/* Classification & Subject */}
            <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2 text-xs sm:text-sm">
              <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2">
                <span className="font-bold text-slate-800 min-w-[150px] shrink-0">
                  इंद्राज का प्रकार (Type):
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-slate-950">
                    {record.typeDisplayHi}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    ({record.typeDisplay})
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2 pt-2 border-t border-slate-150">
                <span className="font-bold text-slate-800 min-w-[150px] shrink-0 uppercase tracking-wide">
                  विषय (SUBJECT):
                </span>
                <span className="font-bold text-slate-950 flex-1 leading-snug">
                  {record.subject}
                </span>
              </div>
            </div>

            {/* Officer Details Grid (Entry-For Officer vs Actual Author) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Entry-For Officer */}
              <div className="p-4 bg-emerald-50/70 border border-emerald-300 rounded-xl space-y-2 text-xs">
                <div className="flex items-center gap-2 pb-1.5 border-b border-emerald-200">
                  <User className="w-4 h-4 text-emerald-800" />
                  <h4 className="font-black text-emerald-950 uppercase tracking-wider text-[11px]">
                    मुलाज़िम मुताल्लिक (Entry-For Officer)
                  </h4>
                </div>
                <div className="space-y-1 text-slate-800">
                  <p>
                    <span className="font-bold text-slate-700">Rank:</span>{" "}
                    <span className="font-semibold text-slate-950">{record.entryForOfficer.rank}</span>
                  </p>
                  <p>
                    <span className="font-bold text-slate-700">Name:</span>{" "}
                    <span className="font-semibold text-slate-950">{record.entryForOfficer.name}</span>
                  </p>
                  <p>
                    <span className="font-bold text-slate-700">Belt Number:</span>{" "}
                    <span className="font-mono font-bold text-slate-900">{record.entryForOfficer.beltNumber}</span>
                  </p>
                  <p>
                    <span className="font-bold text-slate-700">PNO Number:</span>{" "}
                    <span className="font-mono font-bold text-slate-900">{record.entryForOfficer.pno}</span>
                  </p>
                </div>
              </div>

              {/* Actual Author (MHC / Duty Officer) */}
              <div className="p-4 bg-blue-50/70 border border-blue-300 rounded-xl space-y-2 text-xs">
                <div className="flex items-center justify-between pb-1.5 border-b border-blue-200">
                  <div className="flex items-center gap-2">
                    <FileCheck2 className="w-4 h-4 text-blue-800" />
                    <h4 className="font-black text-blue-950 uppercase tracking-wider text-[11px]">
                      मुहर्रिर / लेखक (Actual Author)
                    </h4>
                  </div>
                  <span className="text-[9px] font-bold bg-blue-200 text-blue-900 px-1.5 py-0.5 rounded font-mono">
                    MHC Desk
                  </span>
                </div>
                <div className="space-y-1 text-slate-800">
                  <p>
                    <span className="font-bold text-slate-700">Rank:</span>{" "}
                    <span className="font-semibold text-slate-950">{record.actualAuthor.rank}</span>
                  </p>
                  <p>
                    <span className="font-bold text-slate-700">Name:</span>{" "}
                    <span className="font-semibold text-slate-950">{record.actualAuthor.name}</span>
                  </p>
                  <p>
                    <span className="font-bold text-slate-700">Belt Number:</span>{" "}
                    <span className="font-mono font-bold text-slate-900">{record.actualAuthor.beltNumber}</span>
                  </p>
                  <p>
                    <span className="font-bold text-slate-700">PNO Number:</span>{" "}
                    <span className="font-mono font-bold text-slate-900">{record.actualAuthor.pno}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Related Records Cross-Reference Strip */}
            {record.relatedRecords && Object.values(record.relatedRecords).some(Boolean) && (
              <div className="p-3 bg-slate-50 border border-slate-300 rounded-xl space-y-1.5 text-xs">
                <h5 className="font-bold text-slate-800 uppercase text-[11px] flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-slate-600" />
                  <span>संबंधित रिकॉर्ड्स व क्रॉस रेफरेंस (Linked Records):</span>
                </h5>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-[11px]">
                  {record.relatedRecords.complaintNumber && (
                    <div className="p-1.5 bg-white rounded border border-slate-200">
                      <span className="text-slate-500 block text-[9px] font-sans">Complaint No:</span>
                      <strong className="text-blue-900">{record.relatedRecords.complaintNumber}</strong>
                    </div>
                  )}
                  {record.relatedRecords.firNumber && (
                    <div className="p-1.5 bg-white rounded border border-slate-200">
                      <span className="text-slate-500 block text-[9px] font-sans">FIR No:</span>
                      <strong className="text-red-900">{record.relatedRecords.firNumber}</strong>
                    </div>
                  )}
                  {record.relatedRecords.vehicleNumber && (
                    <div className="p-1.5 bg-white rounded border border-slate-200">
                      <span className="text-slate-500 block text-[9px] font-sans">Vehicle:</span>
                      <strong className="text-slate-900">{record.relatedRecords.vehicleNumber}</strong>
                    </div>
                  )}
                  {record.relatedRecords.personName && (
                    <div className="p-1.5 bg-white rounded border border-slate-200">
                      <span className="text-slate-500 block text-[9px] font-sans">Person / Accused:</span>
                      <strong className="text-slate-900">{record.relatedRecords.personName}</strong>
                    </div>
                  )}
                  {record.relatedRecords.destinationLocation && (
                    <div className="p-1.5 bg-white rounded border border-slate-200 col-span-2">
                      <span className="text-slate-500 block text-[9px] font-sans">Destination / Location:</span>
                      <strong className="text-slate-900">{record.relatedRecords.destinationLocation}</strong>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Official Narrative / विवरण */}
            <div className="space-y-2">
              <h4 className="font-bold text-slate-900 text-xs sm:text-sm uppercase tracking-wide border-b border-slate-300 pb-1">
                इंद्राज का विस्तृत विवरण (Roznamcha Narrative):
              </h4>
              <div className="p-4 bg-slate-50/80 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 leading-relaxed font-sans whitespace-pre-wrap">
                {record.narrative}
              </div>
            </div>

            {/* Verification & Legal Audit Badge Strip */}
            <div className="p-3 bg-slate-50 border border-slate-300 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-600 font-mono">
              <div className="flex items-center gap-2">
                <BadgeCheck className="w-4 h-4 text-emerald-700" />
                <span className="font-sans font-bold text-slate-800">
                  {record.isLocked ? "Statutory Status: LOCKED & IMMUTABLE" : `Status: ${record.status}`}
                </span>
              </div>
              {record.verificationAuditId && (
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500">Audit ID:</span>
                  <span className="bg-slate-200 text-slate-900 font-bold px-2 py-0.5 rounded border border-slate-300">
                    {record.verificationAuditId}
                  </span>
                </div>
              )}
            </div>

            {/* Statutory Legal Warning under PPR 22.48 */}
            <div className="p-2.5 bg-slate-100 rounded-lg text-[10px] text-slate-500 leading-relaxed font-sans">
              <strong>वैधानिक चेतावनी (Legal Notice):</strong> यह रोजनामचा प्रविष्टि पंजाब पुलिस नियम 1934 (नियम 22.48 व 22.49) के तहत थाना दैनिकी रजिस्टर नंबर 2 में दर्ज की गई है। एक बार लॉक होने के उपरांत यह प्रविष्टि न्यायालयीन साक्ष्य (Admissible in Evidence under Sec 35 Indian Evidence Act / BSA) हेतु पूर्णतः अपरिवर्तनीय व स्थाई है।
            </div>

            {/* Signatures & Seal Footer */}
            <div className="pt-6 border-t-2 border-slate-900 flex items-end justify-between text-xs font-sans">
              <div className="text-center w-36">
                <div className="h-14 border border-dashed border-slate-400 rounded flex items-center justify-center text-[10px] text-slate-400">
                  Station Seal
                </div>
                <p className="mt-1 font-bold text-slate-700">POLICE STATION SEAL</p>
              </div>

              <div className="text-right space-y-1">
                <p className="text-slate-400">______________________________________</p>
                <p className="font-bold text-slate-900">
                  {record.verifiedBy?.name || record.actualAuthor.name} ({record.verifiedBy?.rank || record.actualAuthor.rank})
                </p>
                <p className="text-slate-600 text-[11px]">
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
        <div className="no-print p-4 bg-slate-100 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <History className="w-3.5 h-3.5 text-slate-500" />
            <span>Audit Trail Entries: {record.auditTrail.length} step(s) recorded</span>
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
            {isLocked && (
              <Button
                type="button"
                size="sm"
                onClick={handlePrint}
                className="bg-[#0b192c] hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Printer className="w-3.5 h-3.5 text-amber-300" />
                <span>Print Official GD Record</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
