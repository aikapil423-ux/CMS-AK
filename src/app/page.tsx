"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  FileText,
  Shield,
  ArrowRight,
  Clock,
  Building,
  Lock,
  ChevronRight,
  Users,
  Scale,
  ClipboardList,
  FileBarChart,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useModule } from "@/context/ModuleContext";
import { ComplaintService } from "@/services/complaintService";
import { GeneralDiaryService } from "@/services/generalDiaryService";
import { firService } from "@/services/firService";
import { RegistrationService } from "@/services/registrationService";
import { isUserAssignedIo } from "@/lib/firIntegrity";
import { Button } from "@/components/ui/button";

export default function PostLoginPortalPage() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const { switchToModule } = useModule();

  const [complaintCount, setComplaintCount] = useState<number | null>(null);
  const [gdCount, setGdCount] = useState<number | null>(null);
  const [firCount, setFirCount] = useState<number | null>(null);
  const [regCount, setRegCount] = useState<number | null>(null);

  useEffect(() => {
    async function loadStats() {
      try {
        const [complaints, gdEntries] = await Promise.all([
          ComplaintService.getComplaints(),
          GeneralDiaryService.getEntries({date:new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Kolkata"}).format(new Date())}),
        ]);
        setComplaintCount(complaints.filter(c=>! /^(COMPLETE|DISPOSED|FIR_REGISTER|TRANSFERRED)/.test(String(c.status).toUpperCase().replace(/ /g,"_"))).length);
        setGdCount(gdEntries.length);
        const firs = firService.getAllFirs();
        const isIo = currentUser.role === "ENQUIRY_OFFICER";
        const visibleFirs = isIo ? firs.filter((f) => isUserAssignedIo(currentUser, f)) : firs;
        setFirCount(visibleFirs.length);
        const regs = RegistrationService.getEntries();
        setRegCount(regs.length);
      } catch (e) {
        // Fallback
      }
    }
    loadStats();
  }, []);

  const handleSelectRoznamcha = () => {
    switchToModule("ROZNAMCHA");
    router.push("/general-diary");
  };

  const handleSelectComplaints = () => {
    switchToModule("COMPLAINTS");
    router.push("/complaints");
  };

  const handleSelectFir = () => {
    switchToModule("FIR");
    router.push("/fir");
  };

  const handleSelectRegistrations = () => {
    switchToModule("REGISTRATIONS");
    router.push("/registrations");
  };

  const handleSelectReports = () => {
    switchToModule("REPORTS");
    router.push("/reports");
  };

  const handleSelectProsecution = () => {
    switchToModule("PROSECUTION");
    router.push("/prosecution");
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 py-4 sm:py-8 animate-in fade-in-50 text-slate-800">
      {/* Title & Instructions - Minimalist */}
      <div className="px-1 text-center sm:text-left">
        <div className="flex items-center justify-center sm:justify-start gap-2 mb-1.5">
          <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200/60">
            Haryana Police Terminal
          </span>
          <span className="text-xs text-slate-400">
            {currentUser.stationName}
          </span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Select Operational Module
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Choose a department workspace to open its dedicated station console
        </p>
      </div>

      {/* PRIMARY OPERATIONAL MODULE CARDS - Minimalist & Balanced 3x2 Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 pt-1">
        {/* TAB 1: ROZNAMCHA GD (GENERAL DIARY) */}
        <div
          onClick={handleSelectRoznamcha}
          className="cursor-pointer bg-white rounded-xl border border-slate-200/80 hover:border-slate-400/80 p-6 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)] hover:shadow-md transition-all duration-200 group flex flex-col justify-between"
        >
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-800 group-hover:bg-slate-900 group-hover:text-white flex items-center justify-center transition-colors border border-slate-200/60">
                <BookOpen className="w-5 h-5" />
              </div>
              <span className="font-mono text-[10px] text-slate-500 bg-slate-50 border border-slate-200/70 px-2 py-0.5 rounded-md">
                PPR Ch. XXII
              </span>
            </div>

            <div>
              <h3 className="text-base font-semibold text-slate-900 tracking-tight group-hover:text-slate-900 transition-colors">
                Roznamcha GD
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Daily 24-hour official station diary. Maintain chronological occurrence entries, shift turnovers, sentry reliefs, patrol movements, and malkhana property records.
              </p>
            </div>

            {/* Status Pills */}
            <div className="pt-1 flex flex-wrap gap-2 text-xs">
              <span className="bg-slate-50 text-slate-600 px-2.5 py-1 rounded-md border border-slate-200/60 text-[11px] font-normal flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-slate-400" />
                {gdCount ?? "—"} Entries Today
              </span>
              <span className="bg-slate-50 text-slate-600 px-2.5 py-1 rounded-md border border-slate-200/60 text-[11px] font-normal flex items-center gap-1.5">
                <Lock className="w-3 h-3 text-emerald-600" />
                Tamper-Evident Active
              </span>
            </div>
          </div>

          {/* Action Button */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">Station Ledger</span>
            <div className="text-xs font-medium text-slate-800 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
              <span>Open Roznamcha</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-900" />
            </div>
          </div>
        </div>

        {/* TAB 2: COMPLAINT MANAGEMENT */}
        <div
          onClick={handleSelectComplaints}
          className="cursor-pointer bg-white rounded-xl border border-slate-200/80 hover:border-slate-400/80 p-6 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)] hover:shadow-md transition-all duration-200 group flex flex-col justify-between"
        >
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-800 group-hover:bg-slate-900 group-hover:text-white flex items-center justify-center transition-colors border border-slate-200/60">
                <FileText className="w-5 h-5" />
              </div>
              <span className="font-mono text-[10px] text-slate-500 bg-slate-50 border border-slate-200/70 px-2 py-0.5 rounded-md">
                Sec 173(3) BNSS
              </span>
            </div>

            <div>
              <h3 className="text-base font-semibold text-slate-900 tracking-tight group-hover:text-slate-900 transition-colors">
                Complaint Management
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Citizen intake desk, walk-in applications, CM Window petitions, enquiry officer (EO) assignment, preliminary spot verification, and resolution.
              </p>
            </div>

            {/* Status Pills */}
            <div className="pt-1 flex flex-wrap gap-2 text-xs">
              <span className="bg-slate-50 text-slate-600 px-2.5 py-1 rounded-md border border-slate-200/60 text-[11px] font-normal flex items-center gap-1.5">
                <FileText className="w-3 h-3 text-slate-400" />
                {complaintCount ?? "—"} Active Complaints
              </span>
              <span className="bg-slate-50 text-slate-600 px-2.5 py-1 rounded-md border border-slate-200/60 text-[11px] font-normal flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-amber-500" />
                Under Enquiry
              </span>
            </div>
          </div>

          {/* Action Button */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">Petitions &amp; Enquiry</span>
            <div className="text-xs font-medium text-slate-800 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
              <span>Open Complaints</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-900" />
            </div>
          </div>
        </div>

        {/* TAB 3: FIR (FIRST INFORMATION REPORT) */}
        <div
          onClick={handleSelectFir}
          className="cursor-pointer bg-white rounded-xl border border-slate-200/80 hover:border-slate-400/80 p-6 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)] hover:shadow-md transition-all duration-200 group flex flex-col justify-between"
        >
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-800 group-hover:bg-slate-900 group-hover:text-white flex items-center justify-center transition-colors border border-slate-200/60">
                <Scale className="w-5 h-5" />
              </div>
              <span className="font-mono text-[10px] text-slate-500 bg-slate-50 border border-slate-200/70 px-2 py-0.5 rounded-md">
                Sec 173 BNSS
              </span>
            </div>

            <div>
              <h3 className="text-base font-semibold text-slate-900 tracking-tight group-hover:text-slate-900 transition-colors">
                FIR Register
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Statutory cognizable crime register under BNS 2023. Register FIRs, assign Investigating Officers (IO), record Zimni case diaries, and submit final reports.
              </p>
            </div>

            {/* Status Pills */}
            <div className="pt-1 flex flex-wrap gap-2 text-xs">
              <span className="bg-slate-50 text-slate-600 px-2.5 py-1 rounded-md border border-slate-200/60 text-[11px] font-normal flex items-center gap-1.5">
                <Scale className="w-3 h-3 text-slate-400" />
                {firCount ?? "—"} Registered FIRs
              </span>
              <span className="bg-slate-50 text-slate-600 px-2.5 py-1 rounded-md border border-slate-200/60 text-[11px] font-normal flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-rose-500" />
                Investigation Active
              </span>
            </div>
          </div>

          {/* Action Button */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">Crime Records</span>
            <div className="text-xs font-medium text-slate-800 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
              <span>Open FIR Register</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-900" />
            </div>
          </div>
        </div>

        {/* TAB 4: REGISTRATIONS (UIDB/UD, Missing Person, Missing Cattle, Lost Property) */}
        <div
          onClick={handleSelectRegistrations}
          className="cursor-pointer bg-white rounded-xl border border-slate-200/80 hover:border-slate-400/80 p-6 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)] hover:shadow-md transition-all duration-200 group flex flex-col justify-between"
        >
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-800 group-hover:bg-slate-900 group-hover:text-white flex items-center justify-center transition-colors border border-slate-200/60">
                <ClipboardList className="w-5 h-5" />
              </div>
              <span className="font-mono text-[10px] text-slate-500 bg-slate-50 border border-slate-200/70 px-2 py-0.5 rounded-md">
                PPR / CCTNS
              </span>
            </div>

            <div>
              <h3 className="text-base font-semibold text-slate-900 tracking-tight group-hover:text-slate-900 transition-colors">
                Registrations
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Station statutory registers: UIDB/UD, Missing Persons, Missing Cattle, and Lost Property records.
              </p>
            </div>

            {/* Status Pills */}
            <div className="pt-1 flex flex-wrap gap-2 text-xs">
              <span className="bg-slate-50 text-slate-600 px-2.5 py-1 rounded-md border border-slate-200/60 text-[11px] font-normal flex items-center gap-1.5">
                <ClipboardList className="w-3 h-3 text-slate-400" />
                {regCount ?? "—"} Total Entries
              </span>
              <span className="bg-slate-50 text-slate-600 px-2.5 py-1 rounded-md border border-slate-200/60 text-[11px] font-normal flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-indigo-500" />
                4 Active Registers
              </span>
            </div>
          </div>

          {/* Action Button */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">Police Registers</span>
            <div className="text-xs font-medium text-slate-800 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
              <span>Open Registrations</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-900" />
            </div>
          </div>
        </div>

        {/* TAB 5: REPORTS & AUDIT */}
        <div
          onClick={handleSelectReports}
          className="cursor-pointer bg-white rounded-xl border border-slate-200/80 hover:border-slate-400/80 p-6 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)] hover:shadow-md transition-all duration-200 group flex flex-col justify-between"
        >
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-800 group-hover:bg-slate-900 group-hover:text-white flex items-center justify-center transition-colors border border-slate-200/60">
                <FileBarChart className="w-5 h-5" />
              </div>
              <span className="font-mono text-[10px] text-slate-500 bg-slate-50 border border-slate-200/70 px-2 py-0.5 rounded-md">
                SITREP / Audit
              </span>
            </div>

            <div>
              <h3 className="text-base font-semibold text-slate-900 tracking-tight group-hover:text-slate-900 transition-colors">
                Reports & Audit
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Crime SITREP for SP, Weekly Crime Diary (PPR Ch. XXII), and IGP meeting presentation analytics.
              </p>
            </div>

            {/* Status Pills */}
            <div className="pt-1 flex flex-wrap gap-2 text-xs">
              <span className="bg-slate-50 text-slate-600 px-2.5 py-1 rounded-md border border-slate-200/60 text-[11px] font-normal flex items-center gap-1.5">
                <FileBarChart className="w-3 h-3 text-slate-400" />
                3 Official Formats
              </span>
              <span className="bg-slate-50 text-slate-600 px-2.5 py-1 rounded-md border border-slate-200/60 text-[11px] font-normal flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-purple-600" />
                Live Portal Audit
              </span>
            </div>
          </div>

          {/* Action Button */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">Statutory Reports</span>
            <div className="text-xs font-medium text-slate-800 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
              <span>Open Reports</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-900" />
            </div>
          </div>
        </div>

        {/* TAB 6: PROSECUTION & COURTS */}
        <div
          onClick={handleSelectProsecution}
          className="cursor-pointer bg-white rounded-xl border border-slate-200/80 hover:border-slate-400/80 p-6 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)] hover:shadow-md transition-all duration-200 group flex flex-col justify-between"
        >
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-800 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center transition-colors border border-slate-200/60">
                <Scale className="w-5 h-5" />
              </div>
              <span className="font-mono text-[10px] text-indigo-700 bg-indigo-50 border border-indigo-200/70 px-2 py-0.5 rounded-md font-semibold">
                BNSS / Courts
              </span>
            </div>

            <div>
              <h3 className="text-base font-semibold text-slate-900 tracking-tight group-hover:text-indigo-900 transition-colors">
                Prosecution & Courts
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Challan Scrutiny (Performa & Common Malpractices) and Court Liaison (Bail Replies, Status Reports & Applications).
              </p>
            </div>

            {/* Status Pills */}
            <div className="pt-1 flex flex-wrap gap-2 text-xs">
              <span className="bg-slate-50 text-slate-600 px-2.5 py-1 rounded-md border border-slate-200/60 text-[11px] font-normal flex items-center gap-1.5">
                <Scale className="w-3 h-3 text-indigo-500" />
                Scrutiny & Bail Trackers
              </span>
              <span className="bg-slate-50 text-slate-600 px-2.5 py-1 rounded-md border border-slate-200/60 text-[11px] font-normal flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-emerald-600" />
                Court Liaison Active
              </span>
            </div>
          </div>

          {/* Action Button */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">Legal Branch</span>
            <div className="text-xs font-medium text-slate-800 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
              <span>Open Prosecution</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Police Station Profile Info Strip */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 shadow-[0_1px_2px_0_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-2">
          <Building className="w-3.5 h-3.5 text-slate-400" />
          <span>
            <strong className="font-semibold text-slate-800">{currentUser.stationName}</strong> • Panipat District • Haryana Police
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/station-profile" className="text-slate-600 hover:text-slate-900 font-medium">
            Station Profile
          </Link>
          <span>•</span>
          <Link href="/users" className="text-slate-600 hover:text-slate-900 font-medium">
            Staff Directory
          </Link>
        </div>
      </div>
    </div>
  );
}
