"use client";

import React, { useRef } from "react";
import {
  Printer,
  X,
  Shield,
  FileCheck2,
  Building,
  UserCheck,
  AlertCircle,
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

  // Determine if Enquiry Officer (EO / IO) is currently assigned
  const isEoAssigned = Boolean(
    complaint.assignedEoName &&
    complaint.assignedEoName.trim() !== "" &&
    complaint.assignedEoName !== "Not Assigned" &&
    complaint.assignedEoName !== "None" &&
    complaint.assignedEoName !== "Pending"
  );

  // IO Details (if assigned)
  const ioRank = complaint.assignedEoRank || "Sub-Inspector";
  const ioName = complaint.assignedEoName || "";
  const ioBeltNumber = complaint.assignedEoBeltNumber || complaint.assignedEoPno || "—";
  const ioMobile = complaint.assignedEoPhone || "9812034567";

  // Station SHO Details (displayed when IO is not assigned)
  const shoRank = "Inspector (SHO)";
  const shoName = complaint.policeStation ? `SHO In-charge (${complaint.policeStation})` : "Inspector Surender Pal (SHO)";
  const shoBeltNumber = "SHO/892";
  const shoMobile = "9812033001";

  // MHC details fallback (auto-picked)
  const mhcRank = complaint.mhcRank || "Head Constable (MHC)";
  const mhcName = complaint.mhcName || complaint.registeredBy || "HC Devinder Kumar";
  const mhcBeltNumber = complaint.mhcBeltNumber || "889/KKR";
  const mhcMobile = complaint.mhcPhone || "9813098765";

  // Complainant Details
  const complainantFullName = complaint.complainantName
    ? `${complaint.complainantName}${
        complaint.complainantRelativeName || complaint.complainantFatherSpouse
          ? ` (S/O ${complaint.complainantRelativeName || complaint.complainantFatherSpouse})`
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/75 backdrop-blur-xs overflow-y-auto animate-in fade-in-50">
      {/* Print styles to only print the receipt area formatted as Page 2 */}
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
        {/* Top Control Bar (Hidden in Print) */}
        <div className="no-print flex items-center justify-between px-5 py-3.5 bg-[#0b192c] text-white border-b border-slate-700">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-400/40 flex items-center justify-center">
              <FileCheck2 className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h3 className="font-bold text-sm leading-tight text-white">
                Receipt of registered complaints
              </h3>
              <p className="text-[11px] text-slate-300">
                Page 2 Official Notice Document • PPR 22.48 &amp; BNSS 173(3)
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

        {/* Scrollable Receipt Body - Exact Page 2 Format from Templates */}
        <div className="overflow-y-auto p-4 sm:p-6 bg-slate-100/70 flex justify-center">
          <div
            id="printable-receipt"
            ref={receiptRef}
            className="w-full bg-white border-2 border-slate-900 rounded-2xl p-6 sm:p-8 shadow-md text-slate-900 space-y-6 font-sans relative"
            style={{ minHeight: "750px", lineHeight: "1.7" }}
          >
            {/* Header Title */}
            <div className="text-center pb-4 border-b-2 border-slate-900">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Shield className="w-8 h-8 text-[#0b192c]" />
                <span className="text-sm font-black tracking-widest uppercase text-[#0b192c]">
                  HARYANA POLICE
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wide text-slate-950 font-serif">
                Receipt of registered complaints
              </h1>
              <p className="text-xs font-bold uppercase text-slate-700 tracking-wider mt-0.5">
                {complaint.policeStation || "PS City Thanesar"}, District {complaint.district || "Kurukshetra"}
              </p>
              <p className="text-[11px] text-slate-500 italic mt-0.5">
                (Statutory Intake Slip under PPR Rule 22.48 &amp; Section 173(3) BNSS, 2023)
              </p>
            </div>

            {/* Acknowledgement No & Date Time */}
            <div className="p-3.5 bg-slate-50 border border-slate-300 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900">Acknowledgement no:</span>
                <span className="font-mono font-black text-blue-900 bg-blue-100 px-2 py-0.5 rounded text-sm sm:text-base border border-blue-300">
                  {complaint.complaintNumber}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs sm:text-sm">
                <span className="font-bold text-slate-900">date time:</span>
                <span className="font-semibold text-slate-800">
                  {formattedDateTime}
                </span>
              </div>
            </div>

            {/* Citizen Particulars */}
            <div className="p-4 sm:p-5 bg-white border border-slate-200 rounded-xl space-y-3 text-xs sm:text-sm">
              <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2">
                <span className="font-bold text-slate-900 min-w-[170px] shrink-0">
                  Complainant Name –
                </span>
                <span className="font-semibold text-slate-950 break-words">
                  {complainantFullName}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2">
                <span className="font-bold text-slate-900 min-w-[170px] shrink-0">
                  Address –
                </span>
                <span className="text-slate-800">
                  {fullAddress || "Not specified"}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2">
                <span className="font-bold text-slate-900 min-w-[170px] shrink-0">
                  Mobile no –
                </span>
                <span className="font-mono font-bold text-slate-900">
                  +91 {complaint.complainantMobile || "—"}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2 pt-2 border-t border-slate-150">
                <span className="font-bold text-slate-900 min-w-[170px] shrink-0 uppercase tracking-wide">
                  SUBJECT -
                </span>
                <span className="font-bold text-slate-950 flex-1">
                  {complaint.subject || complaint.complaintSubject || complaint.categoryDisplay || "Formal Written Citizen Complaint"}
                </span>
              </div>
            </div>

            {/* Officer Particulars: Assigned IO / Station SHO & MHC */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Assigned IO Details (or Station SHO In-charge if IO not assigned) */}
              <div
                className={`p-4 rounded-xl space-y-2 text-xs border ${
                  isEoAssigned
                    ? "bg-emerald-50/70 border-emerald-300"
                    : "bg-amber-50/70 border-amber-300"
                }`}
              >
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <UserCheck
                      className={`w-4 h-4 ${
                        isEoAssigned ? "text-emerald-800" : "text-amber-800"
                      }`}
                    />
                    <h4
                      className={`font-black uppercase tracking-wider text-[11px] ${
                        isEoAssigned ? "text-emerald-950" : "text-amber-950"
                      }`}
                    >
                      {isEoAssigned ? "Assigned IO Details" : "Station SHO In-Charge"}
                    </h4>
                  </div>
                  {!isEoAssigned ? (
                    <span className="text-[9px] font-bold bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded border border-amber-300">
                      IO Not Assigned
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold bg-emerald-200 text-emerald-900 px-1.5 py-0.5 rounded border border-emerald-300">
                      EO Assigned
                    </span>
                  )}
                </div>
                <div className="space-y-1 text-slate-800">
                  <p>
                    <span className="font-bold text-slate-700">Rank:</span>{" "}
                    <span className="font-semibold text-slate-950">
                      {isEoAssigned ? ioRank : shoRank}
                    </span>
                  </p>
                  <p>
                    <span className="font-bold text-slate-700">Name:</span>{" "}
                    <span className="font-semibold text-slate-950">
                      {isEoAssigned ? ioName : shoName}
                    </span>
                  </p>
                  <p>
                    <span className="font-bold text-slate-700">Belt number:</span>{" "}
                    <span className="font-mono font-bold text-slate-900">
                      {isEoAssigned ? ioBeltNumber : shoBeltNumber}
                    </span>
                  </p>
                  <p>
                    <span className="font-bold text-slate-700">Mobile number:</span>{" "}
                    <span className="font-mono font-bold text-slate-900">
                      +91 {isEoAssigned ? ioMobile : shoMobile}
                    </span>
                  </p>
                </div>
              </div>

              {/* MHC Details (Auto-picked) */}
              <div className="p-4 bg-blue-50/70 border border-blue-300 rounded-xl space-y-2 text-xs">
                <div className="flex items-center justify-between pb-1.5 border-b border-blue-200">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-blue-800" />
                    <h4 className="font-black text-blue-950 uppercase tracking-wider text-[11px]">
                      Mhc details
                    </h4>
                  </div>
                  <span className="text-[9px] font-bold bg-blue-200 text-blue-900 px-1.5 py-0.5 rounded font-mono">
                    Auto uthaye
                  </span>
                </div>
                <div className="space-y-1 text-slate-800">
                  <p>
                    <span className="font-bold text-slate-700">Rank:</span>{" "}
                    <span className="font-semibold text-slate-950">{mhcRank}</span>
                  </p>
                  <p>
                    <span className="font-bold text-slate-700">Name:</span>{" "}
                    <span className="font-semibold text-slate-950">{mhcName}</span>
                  </p>
                  <p>
                    <span className="font-bold text-slate-700">Belt number:</span>{" "}
                    <span className="font-mono font-bold text-slate-900">{mhcBeltNumber}</span>
                  </p>
                  <p>
                    <span className="font-bold text-slate-700">Mobile number:</span>{" "}
                    <span className="font-mono font-bold text-slate-900">+91 {mhcMobile}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Dynamic IO Not Assigned Alert - Disappears automatically as soon as EO is assigned */}
            {!isEoAssigned && (
              <div className="p-3.5 bg-amber-50/90 border-2 border-amber-300 rounded-xl text-xs text-amber-950 flex items-start gap-2.5 animate-in fade-in-50">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-bold text-amber-950 flex items-center gap-2">
                    <span>Note: IO not assigned</span>
                    <span className="text-[10px] bg-amber-200 text-amber-950 px-2 py-0.2 rounded font-semibold border border-amber-300">
                      जांच अधिकारी (IO) अभी नियुक्त नहीं है
                    </span>
                  </p>
                  <p className="text-[11px] text-amber-900 leading-relaxed">
                    यह शिकायत थाना पंजिका में विधिवत दर्ज हो चुकी है और वर्तमान में थाना प्रभारी (SHO) के सीधे पर्यवेक्षण में है। जैसे ही SHO द्वारा जांच अधिकारी (EO/IO) नियुक्त किया जाएगा, इस रसीद पर SHO के स्थान पर जांच अधिकारी का विवरण प्रदर्शित हो जाएगा तथा &lsquo;IO not assigned&rsquo; नोट हट जाएगा।
                  </p>
                </div>
              </div>
            )}

            {/* Statutory Note */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600 leading-relaxed font-sans">
              <p className="font-bold text-slate-800">Legal Note / वैधानिक सूचना:</p>
              <p>
                यह रसीद थाना दैनिकी (Roznamcha GD) और केंद्रीय शिकायत पंजिका में विधिवत प्रविष्टि के उपरांत जारी की गई है।
                धारा 173(3) BNSS के अंतर्गत 14 दिनों के भीतर प्रारंभिक जांच पूर्ण कर निष्पक्ष अग्रिम कार्यवाही अमल में लाई जाएगी।
              </p>
            </div>

            {/* Stamp & Signature Footer */}
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
                  {mhcName} ({mhcRank})
                </p>
                <p className="text-slate-600 text-[11px]">
                  Moharrir Head Constable / Duty Officer
                </p>
                <p className="text-slate-600 font-mono text-[11px]">
                  Belt No: {mhcBeltNumber} • {complaint.policeStation || "PS City Thanesar"}
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
