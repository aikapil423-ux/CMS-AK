"use client";

import React, { useRef } from "react";
import {
  Printer,
  X,
  Shield,
  Scale,
  Building,
  UserCheck,
  AlertCircle,
  FileText,
} from "lucide-react";
import { FIRItem } from "@/types";
import { Button } from "@/components/ui/button";

interface FIRReceiptModalProps {
  fir: FIRItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export function FIRReceiptModal({ fir, isOpen, onClose }: FIRReceiptModalProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !fir) return null;

  const formattedDateTime = (() => {
    try {
      const d = fir.createdAt ? new Date(fir.createdAt) : new Date();
      return d.toLocaleString("en-IN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return new Date().toLocaleDateString("en-IN");
    }
  })();

  const handlePrint = () => {
    window.print();
  };

  const ioName = fir.assignedIoName || "Pending Assignment";
  const ioRank = fir.assignedIoRank || "Sub-Inspector";
  const ioBelt = fir.assignedIoBeltNumber || "IO/—";
  const ioPhone = fir.assignedIoPhone || "—";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/75 backdrop-blur-xs overflow-y-auto animate-in fade-in-50">
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-fir,
          #printable-fir * {
            visibility: visible;
          }
          #printable-fir {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 24px;
            box-shadow: none !important;
            border: 2px solid #000 !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[94vh]">
        {/* Top Control Bar */}
        <div className="no-print flex items-center justify-between px-5 py-3.5 bg-[#0b192c] text-white border-b border-slate-700">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-500/20 border border-red-400/40 flex items-center justify-center">
              <Scale className="w-4 h-4 text-red-400" />
            </div>
            <div>
              <h3 className="font-bold text-sm leading-tight text-white">
                Official FIR Copy / Statutory Information Report
              </h3>
              <p className="text-[11px] text-slate-300">
                Form No. 24.5(1) • Section 173 Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handlePrint}
              size="sm"
              className="bg-red-600 hover:bg-red-700 text-white font-medium text-xs flex items-center gap-1.5 shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              Print FIR Copy
            </Button>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable FIR Document */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50">
          <div
            id="printable-fir"
            ref={receiptRef}
            className="bg-white border-2 border-slate-900 p-8 shadow-xs max-w-2xl mx-auto font-serif text-slate-900 leading-relaxed text-xs"
          >
            {/* Header */}
            <div className="text-center pb-4 border-b-2 border-slate-900 space-y-1">
              <div className="font-sans font-black text-sm uppercase tracking-widest text-slate-800">
                HARYANA POLICE
              </div>
              <h1 className="font-sans font-black text-base uppercase tracking-tight text-red-900">
                FIRST INFORMATION REPORT (FIR)
              </h1>
              <p className="text-[11px] font-sans font-semibold text-slate-700">
                (Under Section 173 Bharatiya Nagarik Suraksha Sanhita, 2023)
              </p>
              <div className="text-[11px] font-sans text-slate-600 flex justify-center items-center gap-3 pt-1">
                <span><strong>District:</strong> {fir.district}</span>
                <span>•</span>
                <span><strong>P.S.:</strong> {fir.policeStation}</span>
                <span>•</span>
                <span><strong>Year:</strong> {fir.firYear}</span>
              </div>
            </div>

            {/* FIR Primary Particulars */}
            <div className="grid grid-cols-2 gap-3 py-3 border-b border-slate-400 font-sans text-[11px]">
              <div>
                <span className="text-slate-500 font-bold">1. FIR NUMBER:</span>{" "}
                <strong className="text-red-900 font-mono text-sm">{fir.firNumber}</strong>
              </div>
              <div>
                <span className="text-slate-500 font-bold">DATE &amp; TIME:</span>{" "}
                <strong>{fir.firDate} at {fir.firTime || "10:00"} hrs</strong>
              </div>
              <div>
                <span className="text-slate-500 font-bold">CCTNS REG REF:</span>{" "}
                <span className="font-mono font-semibold">{fir.cctnsFirNumber || "HR-SYNC-PENDING"}</span>
              </div>
              <div>
                <span className="text-slate-500 font-bold">GD ENTRY REF:</span>{" "}
                <span className="font-mono">{fir.gdEntryNumber || "—"}</span>
              </div>
              {fir.sourceComplaintNumber && (
                <div className="col-span-2 bg-blue-50/80 p-1.5 rounded border border-blue-200">
                  <span className="text-blue-800 font-bold">LINKED COMPLAINT DOCKET:</span>{" "}
                  <strong className="text-blue-900 font-mono">{fir.sourceComplaintNumber}</strong>
                </div>
              )}
            </div>

            {/* Acts & Sections */}
            <div className="py-3 border-b border-slate-400 space-y-1">
              <div className="font-sans font-bold text-slate-800 text-[11px] uppercase">
                2. ACTS &amp; SECTIONS APPLICABLE
              </div>
              <div className="p-2 bg-slate-50 border border-slate-300 rounded font-sans font-semibold text-slate-900">
                {fir.actsAndSections}
              </div>
            </div>

            {/* Occurrence of Offence */}
            <div className="py-3 border-b border-slate-400 space-y-1">
              <div className="font-sans font-bold text-slate-800 text-[11px] uppercase">
                3. OCCURRENCE OF OFFENCE &amp; PLACE
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-sans">
                <div>
                  <span className="text-slate-500">Date/Time From:</span>{" "}
                  <strong>{fir.incidentDateFrom} {fir.incidentTimeFrom || ""}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Date/Time To:</span>{" "}
                  <strong>{fir.incidentDateTo || fir.incidentDateFrom} {fir.incidentTimeTo || ""}</strong>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-500">Place of Occurrence:</span>{" "}
                  <strong>{fir.incidentPlace}</strong> {fir.incidentLandmark ? `(${fir.incidentLandmark})` : ""}
                </div>
                <div>
                  <span className="text-slate-500">Distance from P.S.:</span>{" "}
                  <span>{fir.distanceFromPs || "Approx. 2 KM"}</span>
                </div>
                <div>
                  <span className="text-slate-500">Beat / Area:</span>{" "}
                  <span>{fir.beatNumber || "Beat No. 1"}</span>
                </div>
              </div>
            </div>

            {/* Complainant / Informant */}
            <div className="py-3 border-b border-slate-400 space-y-1">
              <div className="font-sans font-bold text-slate-800 text-[11px] uppercase">
                4. COMPLAINANT / INFORMANT DETAILS
              </div>
              <div className="text-[11px] font-sans space-y-0.5">
                <div>
                  <span className="text-slate-500">Name:</span> <strong>{fir.complainantName}</strong>
                  {fir.complainantFatherSpouse ? ` (S/o, W/o ${fir.complainantFatherSpouse})` : ""}
                </div>
                <div>
                  <span className="text-slate-500">Gender / Age:</span> {fir.complainantGender} / {fir.complainantAge || "Adult"} yrs
                  <span className="ml-4 text-slate-500">Mobile:</span> {fir.complainantMobile || "—"}
                </div>
                <div>
                  <span className="text-slate-500">Address:</span> {fir.complainantAddress}, {fir.complainantCity}, {fir.complainantDistrict}
                </div>
              </div>
            </div>

            {/* Accused Persons */}
            <div className="py-3 border-b border-slate-400 space-y-1">
              <div className="font-sans font-bold text-slate-800 text-[11px] uppercase">
                5. DETAILS OF KNOWN / SUSPECTED / UNKNOWN ACCUSED
              </div>
              <div className="text-[11px] font-sans space-y-1">
                {fir.accusedList && fir.accusedList.length > 0 ? (
                  fir.accusedList.map((acc, idx) => (
                    <div key={idx} className="p-1.5 bg-slate-50 border border-slate-200 rounded">
                      <strong>{idx + 1}. {acc.name}</strong>
                      {acc.fatherName ? ` (S/o ${acc.fatherName})` : ""}
                      {acc.address ? ` - ${acc.address}` : ""}
                      {acc.physicalDescription ? ` - [${acc.physicalDescription}]` : ""}
                    </div>
                  ))
                ) : (
                  <div className="text-slate-500 italic">Unknown suspect(s) as per initial investigation.</div>
                )}
              </div>
            </div>

            {/* Description of Offence / Substance */}
            <div className="py-3 border-b border-slate-400 space-y-1">
              <div className="font-sans font-bold text-slate-800 text-[11px] uppercase">
                6. FIRST INFORMATION CONTENTS / BRIEF FACTS
              </div>
              <p className="text-[11px] leading-relaxed text-justify whitespace-pre-wrap font-serif">
                {fir.incidentDetails || "First Information recorded verbatim as per statement of informant."}
              </p>
            </div>

            {/* Investigating Officer (IO) Assignment */}
            <div className="py-3 border-b border-slate-400 font-sans text-[11px] space-y-1">
              <div className="font-bold text-slate-800 uppercase">
                7. INVESTIGATING OFFICER (IO) PARTICULARS
              </div>
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2 border border-slate-200 rounded">
                <div>
                  <span className="text-slate-500">Officer Name:</span> <strong>{ioName}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Rank:</span> <span>{ioRank}</span>
                </div>
                <div>
                  <span className="text-slate-500">Belt / PNO:</span> <span>{ioBelt}</span>
                </div>
                <div>
                  <span className="text-slate-500">Mobile No.:</span> <span>{ioPhone}</span>
                </div>
              </div>
            </div>

            {/* Signature & Authentication */}
            <div className="pt-8 flex justify-between items-end font-sans text-[10px]">
              <div className="text-center space-y-1">
                <div className="w-36 border-b border-slate-800 mx-auto"></div>
                <div className="font-bold">Signature / Thumb Impression</div>
                <div className="text-slate-500">of Informant / Complainant</div>
              </div>
              <div className="text-center space-y-1">
                <div className="font-bold text-slate-900">{fir.registeredBy || "Station House Officer"}</div>
                <div className="w-44 border-b border-slate-800 mx-auto"></div>
                <div className="font-bold">Signature of Officer In-Charge</div>
                <div className="text-slate-500">{fir.policeStation}</div>
              </div>
            </div>

            <div className="mt-6 pt-2 border-t border-slate-300 text-center text-[9px] text-slate-500 font-sans">
              Copy given free of cost to the complainant / informant under Section 173(2) BNSS.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
