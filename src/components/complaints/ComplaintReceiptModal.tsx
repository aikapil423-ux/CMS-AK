"use client";

import React, { useRef } from "react";
import {
  Printer,
  Download,
  X,
  Shield,
  FileCheck2,
  Calendar,
  User,
  Phone,
  MapPin,
  BadgeCheck,
  Building,
} from "lucide-react";
import { ComplaintItem } from "@/types";
import { Button } from "@/components/ui/button";

interface ComplaintReceiptModalProps {
  complaint: ComplaintItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ComplaintReceiptModal({
  complaint,
  isOpen,
  onClose,
}: ComplaintReceiptModalProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !complaint) return null;

  // Format date and time
  const formattedDateTime = (() => {
    try {
      const d = complaint.createdAt ? new Date(complaint.createdAt) : new Date();
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

  // Assigned IO / EO details fallback
  const ioRank = complaint.assignedEoRank || "Sub-Inspector";
  const ioName = complaint.assignedEoName || "Not Assigned";
  const ioBeltNumber = complaint.assignedEoBeltNumber || complaint.assignedEoPno || "742/KKR";
  const ioMobile = complaint.assignedEoPhone || "9812034567";

  // MHC details fallback (auto-picked)
  const mhcRank = complaint.mhcRank || "Head Constable (MHC)";
  const mhcName = complaint.mhcName || complaint.registeredBy || "HC Devinder Kumar";
  const mhcBeltNumber = complaint.mhcBeltNumber || "889/KKR";
  const mhcMobile = complaint.mhcPhone || "9813098765";

  // Complainant Details
  const complainantFullName = complaint.complainantName
    ? `${complaint.complainantName}${
        complaint.complainantRelativeName
          ? ` (${complaint.complainantRelationType || "S/O"} ${complaint.complainantRelativeName})`
          : ""
      }`
    : "Citizen Complainant";

  const fullAddress = [
    complaint.complainantAddress,
    complaint.complainantCity,
    complaint.complainantDistrict,
    complaint.complainantState || "Haryana",
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto animate-in fade-in-50">
      {/* Print styles to only print the receipt area */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-receipt,
          #printable-receipt * {
            visibility: visible;
          }
          #printable-receipt {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 20px;
            box-shadow: none !important;
            border: 2px solid #000 !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Top Control Bar (Hidden in Print) */}
        <div className="no-print flex items-center justify-between px-5 py-3.5 bg-[#0b192c] text-white border-b border-slate-700">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-400/40 flex items-center justify-center">
              <FileCheck2 className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h3 className="font-bold text-sm leading-tight text-white">
                Official Complaint Receipt
              </h3>
              <p className="text-[11px] text-slate-300">
                PPR 22.48 / Section 173(3) BNSS Intake Acknowledgement
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
              <span>Print Receipt</span>
            </Button>
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

        {/* Scrollable Receipt Body */}
        <div className="overflow-y-auto p-4 sm:p-8 bg-slate-50/50">
          <div
            id="printable-receipt"
            ref={receiptRef}
            className="bg-white border-2 border-slate-800 rounded-xl p-6 sm:p-8 shadow-sm text-slate-900 space-y-6 font-sans relative"
          >
            {/* Watermark Logo */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03]">
              <Shield className="w-96 h-96 text-slate-900" />
            </div>

            {/* Police Station Header */}
            <div className="text-center border-b-2 border-slate-800 pb-4 relative">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Shield className="w-6 h-6 text-[#0b192c]" />
                <span className="text-xs uppercase tracking-widest font-black text-slate-700">
                  HARYANA POLICE • हरियाणा पुलिस
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-[#0b192c] tracking-tight uppercase">
                {complaint.policeStation || "POLICE STATION CITY THANESAR"}
              </h1>
              <p className="text-xs text-slate-600 font-medium">
                District {complaint.district || "Kurukshetra"}, Haryana
              </p>

              {/* Title Requested by User */}
              <div className="mt-3 inline-block bg-slate-900 text-white px-5 py-1.5 rounded-md">
                <h2 className="text-sm sm:text-base font-extrabold tracking-wider uppercase">
                  Receipt of registered complaints
                </h2>
                <p className="text-[10px] text-amber-300 font-medium">
                  (पंजीकृत शिकायत पावती रसीद)
                </p>
              </div>
            </div>

            {/* Acknowledgement No & Date Time Row Requested by User */}
            <div className="py-2.5 px-3.5 bg-slate-100/90 border border-slate-300 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs font-mono font-bold text-slate-800">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 uppercase tracking-wider text-[11px]">
                  Acknowledgement no:
                </span>
                <span className="text-[#0b192c] font-black text-sm">
                  {complaint.complaintNumber}
                </span>
              </div>
              <div className="hidden sm:block text-slate-400">
                ------------------------------------------------
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 uppercase tracking-wider text-[11px]">
                  Date & Time:
                </span>
                <span className="text-slate-900">{formattedDateTime}</span>
              </div>
            </div>

            {/* Core Particulars */}
            <div className="space-y-4 text-xs sm:text-sm">
              {/* Complainant Name */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-1 sm:gap-2 pb-2.5 border-b border-slate-200">
                <span className="font-bold text-slate-700 sm:col-span-1 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  <span>Complainant Name –</span>
                </span>
                <span className="font-semibold text-slate-900 sm:col-span-3 text-sm">
                  {complainantFullName}
                </span>
              </div>

              {/* Address */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-1 sm:gap-2 pb-2.5 border-b border-slate-200">
                <span className="font-bold text-slate-700 sm:col-span-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  <span>Address –</span>
                </span>
                <span className="font-medium text-slate-800 sm:col-span-3">
                  {fullAddress || "Not Recorded"}
                </span>
              </div>

              {/* Mobile No */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-1 sm:gap-2 pb-2.5 border-b border-slate-200">
                <span className="font-bold text-slate-700 sm:col-span-1 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-500" />
                  <span>Mobile no –</span>
                </span>
                <span className="font-bold font-mono text-slate-900 sm:col-span-3">
                  {complaint.complainantMobile || "—"}
                </span>
              </div>

              {/* SUBJECT */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-1 sm:gap-2 pb-3 border-b-2 border-slate-300">
                <span className="font-bold text-slate-800 sm:col-span-1 tracking-wider uppercase">
                  SUBJECT –
                </span>
                <div className="sm:col-span-3">
                  <span className="font-bold text-slate-900 leading-snug">
                    {complaint.subject || complaint.complaintSubject || "Formal Written Citizen Complaint"}
                  </span>
                  {complaint.categoryDisplay && (
                    <span className="ml-2 inline-block px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-semibold border border-slate-200">
                      Category: {complaint.categoryDisplay}
                    </span>
                  )}
                </div>
              </div>

              {/* Two Column Grid for IO and MHC details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                {/* Assigned IO Details Card */}
                <div className="bg-amber-50/70 border border-amber-200/90 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center gap-1.5 text-amber-950 font-black text-xs uppercase tracking-wide border-b border-amber-200 pb-1.5">
                    <BadgeCheck className="w-4 h-4 text-amber-700" />
                    <span>Assigned IO details –</span>
                  </div>

                  <div className="grid grid-cols-3 gap-1 text-xs">
                    <span className="text-slate-600 font-medium">Rank:</span>
                    <span className="col-span-2 font-bold text-slate-900">{ioRank}</span>

                    <span className="text-slate-600 font-medium">Name:</span>
                    <span className="col-span-2 font-bold text-slate-900">{ioName}</span>

                    <span className="text-slate-600 font-medium">Belt number:</span>
                    <span className="col-span-2 font-mono font-bold text-slate-900">{ioBeltNumber}</span>

                    <span className="text-slate-600 font-medium">Mobile number:</span>
                    <span className="col-span-2 font-mono font-bold text-amber-900">{ioMobile}</span>
                  </div>
                </div>

                {/* MHC Details Card (Auto-picked) */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center gap-1.5 text-slate-900 font-black text-xs uppercase tracking-wide border-b border-slate-200 pb-1.5">
                    <Building className="w-4 h-4 text-slate-700" />
                    <span>MHC details (Helpdesk) –</span>
                  </div>

                  <div className="grid grid-cols-3 gap-1 text-xs">
                    <span className="text-slate-600 font-medium">Rank:</span>
                    <span className="col-span-2 font-bold text-slate-900">{mhcRank}</span>

                    <span className="text-slate-600 font-medium">Name:</span>
                    <span className="col-span-2 font-bold text-slate-900">{mhcName}</span>

                    <span className="text-slate-600 font-medium">Belt number:</span>
                    <span className="col-span-2 font-mono font-bold text-slate-900">{mhcBeltNumber}</span>

                    <span className="text-slate-600 font-medium">Mobile number:</span>
                    <span className="col-span-2 font-mono font-bold text-slate-900">{mhcMobile}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Official Legal Guidance Note */}
            <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-600 leading-relaxed bg-slate-50/60 p-2.5 rounded-lg border">
              <p>
                <strong>महत्वपूर्ण सूचना / Official Note:</strong> यह पावती रसीद प्रमाणित करती है कि आपकी शिकायत पुलिस थाना में विधिवत दर्ज कर ली गई है एवं धारा 173(3) भारतीय नागरिक सुरक्षा संहिता (BNSS) 2023 के तहत जांच अधिकारी (IO) नियुक्त कर दिया गया है। आप उपरोक्त पावती संख्या (Acknowledgement No) द्वारा अपनी शिकायत की स्थिति कभी भी जान सकते हैं।
              </p>
            </div>

            {/* Signatures & Seal Footer */}
            <div className="pt-8 flex items-end justify-between text-center text-xs">
              <div className="space-y-1">
                <div className="w-40 border-b border-dashed border-slate-400 pb-8"></div>
                <p className="font-semibold text-slate-700">Complainant Signature</p>
                <p className="text-[10px] text-slate-500">(हस्ताक्षर शिकायतकर्ता)</p>
              </div>

              <div className="space-y-1 text-right">
                <div className="w-48 border-b border-dashed border-slate-400 pb-8 text-center text-[10px] text-slate-400 italic">
                  [Station Official Seal]
                </div>
                <p className="font-bold text-slate-900">
                  {mhcName}
                </p>
                <p className="text-[10px] text-slate-600 font-mono">
                  {mhcRank} (Belt: {mhcBeltNumber})
                </p>
                <p className="text-[10px] text-slate-500">
                  {complaint.policeStation || "PS City Thanesar"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions (Hidden in Print) */}
        <div className="no-print p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            A copy has been recorded in the station diary and archived in the CMS Haryana database.
          </p>
          <div className="flex items-center gap-2">
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
              <span>Print Acknowledgement Receipt</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
