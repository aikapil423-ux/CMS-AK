"use client";

import React, { useRef } from "react";
import {
  FileText,
  Printer,
  Edit3,
  CheckCircle2,
  X,
  Shield,
  User,
  MapPin,
  Calendar,
  Phone,
  AlertCircle,
  FileCheck2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

export interface ComplaintPreviewData {
  sourceChannel: string;
  priorityLevel: string;
  complainants: Array<{
    name: string;
    relationType?: string;
    relativeName?: string;
    gender?: string;
    age?: string;
    nationalityChoice?: string;
    otherNationality?: string;
    mobile: string;
    presentAddress: string;
    presentCity: string;
    presentDistrict: string;
    presentState: string;
    presentCountry?: string;
  }>;
  isAccusedKnown: boolean;
  accusedList: Array<{
    name: string;
    address: string;
    phone?: string;
    alias?: string;
    relationWithComplainant?: string;
  }>;
  incidentPlace: string;
  incidentLandmark?: string;
  isDateTimeKnown: boolean;
  incidentDate?: string;
  incidentTime?: string;
  incidentApproxPeriod?: string;
  incidentCategory: string;
  incidentDetails: string;
  complaintSubject: string;
  complaintDescription: string;
  isFirRegistered: boolean;
  firNumber?: string;
  firDate?: string;
  complaintClassification?: string;
  complaintPurpose?: string;
  directSendToFir?: boolean;
  directSendToFirChoice?: "YES" | "NO";
  attachmentsCount: number;
  isSho: boolean;
  shouldAssignEoNow: boolean;
  selectedEoName?: string;
  selectedEoRank?: string;
  selectedEoPno?: string;
  assignedDirections?: string;
  targetDays?: number;
  policeStation: string;
  district: string;
  registeredBy: string;
}

interface ComplaintVerificationModalProps {
  isOpen: boolean;
  previewData: ComplaintPreviewData | null;
  isSubmitting: boolean;
  onEdit: () => void;
  onSubmit: () => void;
}

export function ComplaintVerificationModal({
  isOpen,
  previewData,
  isSubmitting,
  onEdit,
  onSubmit,
}: ComplaintVerificationModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !previewData) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-xs overflow-y-auto animate-in fade-in-50">
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-complaint-preview,
          #printable-complaint-preview * {
            visibility: visible;
          }
          #printable-complaint-preview {
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

      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[94vh]">
        {/* Header Bar */}
        <div className="no-print flex items-center justify-between px-5 py-3.5 bg-[#0b192c] text-white border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-400/20 border border-amber-400/30 flex items-center justify-center">
              <Shield className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h3 className="font-bold text-sm leading-tight text-white flex items-center gap-2">
                <span>Complaint Verification &amp; Final Review</span>
                <span className="text-[10px] bg-amber-400 text-slate-950 font-black px-2 py-0.5 rounded uppercase">
                  Pre-Registration Check
                </span>
              </h3>
              <p className="text-[11px] text-slate-300">
                Please verify all details carefully before final registration into the central police register.
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
              <span>Print Preview</span>
            </Button>
            <button
              type="button"
              onClick={onEdit}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Close and edit form"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Preview Sheet */}
        <div className="overflow-y-auto p-4 sm:p-6 bg-slate-100/70 flex justify-center">
          <div
            id="printable-complaint-preview"
            ref={printRef}
            className="w-full bg-white border-2 border-slate-900 rounded-2xl p-6 sm:p-8 shadow-sm text-slate-900 space-y-6 font-sans relative"
            style={{ minHeight: "800px", lineHeight: "1.65" }}
          >
            {/* Seal & Department Title */}
            <div className="text-center pb-4 border-b-2 border-slate-900">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Shield className="w-8 h-8 text-[#0b192c]" />
                <span className="text-sm font-black tracking-widest uppercase text-[#0b192c]">
                  HARYANA POLICE
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wide text-slate-950 font-serif">
                Citizen Complaint Intake Verification Proforma
              </h1>
              <p className="text-xs font-bold uppercase text-slate-700 tracking-wider mt-0.5">
                {previewData.policeStation}, District {previewData.district}
              </p>
              <p className="text-[11px] text-slate-500 italic mt-0.5">
                (Under PPR Rule 22.48 &amp; Section 173(3) of Bharatiya Nagarik Suraksha Sanhita, 2023)
              </p>
            </div>

            {/* Quick Badges: Channel, Priority, Category */}
            <div className="p-3 bg-slate-50 border border-slate-300 rounded-xl grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div>
                <span className="text-slate-500 font-semibold block text-[10px] uppercase">Channel:</span>
                <span className="font-bold text-slate-900">{previewData.sourceChannel}</span>
              </div>
              <div>
                <span className="text-slate-500 font-semibold block text-[10px] uppercase">Priority:</span>
                <span className="font-bold text-slate-900">{previewData.priorityLevel}</span>
              </div>
              <div>
                <span className="text-slate-500 font-semibold block text-[10px] uppercase">Crime / Category:</span>
                <span className="font-bold text-slate-900">{previewData.incidentCategory}</span>
              </div>
              <div>
                <span className="text-slate-500 font-semibold block text-[10px] uppercase">Date of Intake:</span>
                <span className="font-mono font-bold text-slate-900">{formatDate(new Date())}</span>
              </div>
            </div>

            {/* 1. Complainant Details */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 border-b border-slate-300 pb-1">
                <User className="w-4 h-4 text-blue-700" />
                <h3 className="font-black text-xs sm:text-sm uppercase tracking-wider text-slate-900">
                  1. Complainant Particulars ({previewData.complainants.length} Person{previewData.complainants.length > 1 ? "s" : ""})
                </h3>
              </div>
              {previewData.complainants.map((comp, idx) => (
                <div key={idx} className="p-3.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs space-y-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <span className="font-bold text-sm text-slate-950">
                      #{idx + 1} {comp.name} {comp.relativeName ? `(${comp.relationType || "S/o"} ${comp.relativeName})` : ""}
                    </span>
                    <span className="font-mono font-bold text-blue-900 bg-blue-100 px-2 py-0.5 rounded border border-blue-200">
                      Mobile: +91 {comp.mobile}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-700 pt-1 border-t border-slate-200/60">
                    <div>
                      <strong>Gender / Age:</strong> {comp.gender || "—"} / {comp.age ? `${comp.age} Yrs` : "—"}
                    </div>
                    <div>
                      <strong>Nationality:</strong> {comp.nationalityChoice || "Indian"}
                    </div>
                    <div className="sm:col-span-3">
                      <strong>Address:</strong> {comp.presentAddress}, {comp.presentCity}, {comp.presentDistrict}, {comp.presentState}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 2. Accused Details */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 border-b border-slate-300 pb-1">
                <Shield className="w-4 h-4 text-red-700" />
                <h3 className="font-black text-xs sm:text-sm uppercase tracking-wider text-slate-900">
                  2. Accused / Suspect Particulars
                </h3>
              </div>
              {previewData.isAccusedKnown && previewData.accusedList.length > 0 ? (
                <div className="space-y-2">
                  {previewData.accusedList.map((acc, idx) => (
                    <div key={idx} className="p-3 bg-red-50/50 border border-red-200 rounded-xl text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">
                          #{idx + 1} {acc.name} {acc.alias ? `(Alias: ${acc.alias})` : ""}
                        </span>
                        {acc.phone && <span className="font-mono text-slate-700 font-semibold">Mob: {acc.phone}</span>}
                      </div>
                      <p className="text-[11px] text-slate-700">
                        <strong>Address:</strong> {acc.address || "Not specified"}
                      </p>
                      {acc.relationWithComplainant && (
                        <p className="text-[11px] text-slate-600">
                          <strong>Relation with Complainant:</strong> {acc.relationWithComplainant}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 italic">
                  Accused is unknown at this preliminary intake stage (अज्ञात / To be identified during enquiry).
                </div>
              )}
            </div>

            {/* 3. Incident Place, Date & Details */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 border-b border-slate-300 pb-1">
                <MapPin className="w-4 h-4 text-emerald-700" />
                <h3 className="font-black text-xs sm:text-sm uppercase tracking-wider text-slate-900">
                  3. Occurrence &amp; Allegation Particulars
                </h3>
              </div>
              <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-xl text-xs space-y-2.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-800">
                  <div>
                    <strong>Place of Incident:</strong> {previewData.incidentPlace}
                    {previewData.incidentLandmark ? ` (Near: ${previewData.incidentLandmark})` : ""}
                  </div>
                  <div>
                    <strong>Date &amp; Time:</strong>{" "}
                    {previewData.isDateTimeKnown
                      ? `${previewData.incidentDate || "—"} at ${previewData.incidentTime || "—"}`
                      : previewData.incidentApproxPeriod || "Approximate / Undated"}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200">
                  <strong className="block text-slate-900 mb-0.5 uppercase tracking-wide text-[11px]">
                    Subject / विषय:
                  </strong>
                  <p className="text-slate-950 font-bold text-xs sm:text-sm">
                    {previewData.complaintSubject}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-200">
                  <strong className="block text-slate-900 mb-0.5 uppercase tracking-wide text-[11px]">
                    Brief Synopsis / विवरण:
                  </strong>
                  <p className="text-slate-800 text-xs leading-relaxed whitespace-pre-wrap">
                    {previewData.complaintDescription}
                  </p>
                </div>

                {previewData.incidentDetails && previewData.incidentDetails !== previewData.complaintDescription && (
                  <div className="pt-2 border-t border-slate-200">
                    <strong className="block text-slate-900 mb-0.5 uppercase tracking-wide text-[11px]">
                      Additional Incident Notes:
                    </strong>
                    <p className="text-slate-700 text-xs leading-relaxed whitespace-pre-wrap">
                      {previewData.incidentDetails}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* 4. Direct Send to FIR Status */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 border-b border-slate-300 pb-1">
                <Shield className="w-4 h-4 text-[#0b192c]" />
                <h3 className="font-black text-xs sm:text-sm uppercase tracking-wider text-slate-900">
                  4. Direct Send to FIR Decision
                </h3>
              </div>
              <div
                className={`p-3.5 rounded-xl border text-xs ${
                  previewData.directSendToFir
                    ? "bg-rose-50 border-rose-300 text-rose-950"
                    : "bg-blue-50 border-blue-200 text-blue-950"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold">
                    Direct send to FIR?:{" "}
                    <span className={previewData.directSendToFir ? "text-rose-700" : "text-blue-700"}>
                      {previewData.directSendToFir ? "YES" : "NO"}
                    </span>
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      previewData.directSendToFir
                        ? "bg-rose-600 text-white"
                        : "bg-blue-600 text-white"
                    }`}
                  >
                    {previewData.directSendToFir ? "Direct FIR Route" : "Standard Enquiry Route"}
                  </span>
                </div>
                <p className="text-[11px] mt-1 text-slate-700">
                  {previewData.directSendToFir
                    ? "Preliminary enquiry bypassed. Complaint will appear with status “FIR Register” in the register and sent to SHO for direct FIR registration."
                    : "Standard enquiry workflow with Enquiry Officer preliminary spot verification and findings report."}
                </p>
              </div>
            </div>

            {/* 5. EO Allocation Preview */}
            {!previewData.directSendToFir && previewData.isSho && previewData.shouldAssignEoNow && previewData.selectedEoName && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 border-b border-slate-300 pb-1">
                  <FileCheck2 className="w-4 h-4 text-purple-700" />
                  <h3 className="font-black text-xs sm:text-sm uppercase tracking-wider text-slate-900">
                    5. Immediate Enquiry Officer (EO) Allocation
                  </h3>
                </div>
                <div className="p-3.5 bg-purple-50/70 border border-purple-200 rounded-xl text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-purple-950">
                      Assigned Officer: {previewData.selectedEoName} ({previewData.selectedEoRank})
                    </span>
                    <span className="font-mono text-purple-800 text-[11px]">
                      PNO: {previewData.selectedEoPno || "—"} • Target: {previewData.targetDays || 14} Days
                    </span>
                  </div>
                  {previewData.assignedDirections && (
                    <p className="text-[11px] text-purple-900 italic pt-1 border-t border-purple-200">
                      &ldquo;{previewData.assignedDirections}&rdquo;
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Footer Signatures */}
            <div className="pt-8 border-t-2 border-slate-900 flex items-end justify-between text-xs font-sans">
              <div className="text-center w-40">
                <div className="h-14 border border-dashed border-slate-400 rounded flex items-center justify-center text-[10px] text-slate-400">
                  Complainant Sign / Thumb
                </div>
                <p className="mt-1 font-bold text-slate-700">COMPLAINANT SIGNATURE</p>
              </div>

              <div className="text-right space-y-1">
                <p className="text-slate-400">______________________________________</p>
                <p className="font-bold text-slate-900">
                  {previewData.registeredBy}
                </p>
                <p className="text-slate-600 text-[11px]">
                  Intake Officer / Duty Clerk
                </p>
                <p className="text-slate-600 font-mono text-[11px]">
                  {previewData.policeStation}, District {previewData.district}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions: Edit Form OR Confirm & Register */}
        <div className="no-print p-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Submitting will register this complaint into the central register and auto-save this proforma under Documents.
            </span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={onEdit}
              disabled={isSubmitting}
              className="text-xs font-bold gap-1.5 border-slate-300 text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-blue-600" />
              <span>Edit Form (बदलाव करें)</span>
            </Button>

            <Button
              type="button"
              variant="danger"
              size="md"
              onClick={onSubmit}
              isLoading={isSubmitting}
              className="text-xs sm:text-sm font-bold gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 shadow-md transition-all active:scale-98 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Submit &amp; Register Complaint (फाइनल दर्ज करें)</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
