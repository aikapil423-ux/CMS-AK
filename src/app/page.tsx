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
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useModule } from "@/context/ModuleContext";
import { ComplaintService } from "@/services/complaintService";
import { GeneralDiaryService } from "@/services/generalDiaryService";
import { Button } from "@/components/ui/button";

export default function PostLoginPortalPage() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const { switchToModule } = useModule();

  const [complaintCount, setComplaintCount] = useState(6);
  const [gdCount, setGdCount] = useState(4);

  useEffect(() => {
    async function loadStats() {
      try {
        const [complaints, gdEntries] = await Promise.all([
          ComplaintService.getComplaints(),
          GeneralDiaryService.getEntries(),
        ]);
        setComplaintCount(complaints.length);
        setGdCount(gdEntries.length);
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

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-4 sm:py-8 animate-in fade-in-50 text-slate-800">
      {/* Title & Instructions */}
      <div className="px-1 text-center sm:text-left">
        <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
            Haryana Police Terminal
          </span>
          <span className="text-xs text-slate-500 font-medium">
            {currentUser.stationName}
          </span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Select Operational Module
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Choose a primary department to open its dedicated station workspace
        </p>
      </div>

      {/* EXACTLY TWO CLEAN WHITE & BLUE PRIMARY MODULE CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 pt-1">
        {/* TAB 1: ROZNAMCHA GD (GENERAL DIARY) */}
        <div
          onClick={handleSelectRoznamcha}
          className="cursor-pointer bg-white rounded-2xl border-2 border-slate-200 hover:border-blue-500 p-6 sm:p-7 shadow-xs hover:shadow-lg transition-all duration-200 group flex flex-col justify-between relative overflow-hidden"
        >
          {/* Top subtle blue accent line */}
          <div className="absolute top-0 right-0 left-0 h-1 bg-blue-600"></div>

          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xl group-hover:bg-blue-600 group-hover:text-white transition-colors border border-blue-100">
                <BookOpen className="w-6 h-6" />
              </div>
              <span className="font-mono text-[11px] font-semibold text-blue-800 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full">
                PPR Chapter XXII
              </span>
            </div>

            <div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight group-hover:text-blue-700 transition-colors">
                Roznamcha GD (General Diary)
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                Daily 24-hour official station diary. Maintain chronological occurrence entries, shift turnovers, sentry reliefs, patrol movements, and malkhana property records.
              </p>
            </div>

            {/* Status Pills */}
            <div className="pt-1 flex flex-wrap gap-2 text-xs">
              <span className="bg-slate-50 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-medium flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                {gdCount} Entries Recorded Today
              </span>
              <span className="bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-lg border border-emerald-200 text-xs font-semibold flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-600" />
                Tamper-Evident Active
              </span>
            </div>
          </div>

          {/* Action Button: Police Blue */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Daily Station Ledger</span>
            <Button
              variant="primary"
              size="md"
              onClick={handleSelectRoznamcha}
              className="text-xs font-bold gap-1.5 bg-blue-600 hover:bg-blue-700 text-white group-hover:translate-x-0.5 transition-transform"
            >
              <span>Open Roznamcha GD</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* TAB 2: COMPLAINT MANAGEMENT */}
        <div
          onClick={handleSelectComplaints}
          className="cursor-pointer bg-white rounded-2xl border-2 border-slate-200 hover:border-blue-500 p-6 sm:p-7 shadow-xs hover:shadow-lg transition-all duration-200 group flex flex-col justify-between relative overflow-hidden"
        >
          {/* Top subtle blue accent line */}
          <div className="absolute top-0 right-0 left-0 h-1 bg-blue-800"></div>

          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xl group-hover:bg-blue-800 group-hover:text-white transition-colors border border-blue-100">
                <FileText className="w-6 h-6" />
              </div>
              <span className="font-mono text-[11px] font-semibold text-blue-800 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full">
                BNSS Section 173(3)
              </span>
            </div>

            <div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight group-hover:text-blue-700 transition-colors">
                Complaint Management
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                Citizen intake desk, walk-in applications, CM Window petitions, enquiry officer (EO) assignment, preliminary verification, and final disposal records.
              </p>
            </div>

            {/* Status Pills */}
            <div className="pt-1 flex flex-wrap gap-2 text-xs">
              <span className="bg-slate-50 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-medium flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                {complaintCount} Active Complaints
              </span>
              <span className="bg-amber-50 text-amber-900 px-2.5 py-1 rounded-lg border border-amber-200 text-xs font-semibold flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                Under Station Enquiry
              </span>
            </div>
          </div>

          {/* Action Button: Red Accent Button for Complaint actions */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Petitions & Verification</span>
            <Button
              variant="danger"
              size="md"
              onClick={handleSelectComplaints}
              className="text-xs font-bold gap-1.5 bg-red-600 hover:bg-red-700 text-white group-hover:translate-x-0.5 transition-transform"
            >
              <span>Open Complaints</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Police Station Profile Info Strip */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 shadow-2xs">
        <div className="flex items-center gap-2">
          <Building className="w-4 h-4 text-blue-600" />
          <span>
            <strong>{currentUser.stationName}</strong> • Kurukshetra District • Haryana Police
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/station-profile" className="text-blue-700 hover:text-blue-900 font-semibold underline">
            Station Profile
          </Link>
          <span>•</span>
          <Link href="/users" className="text-blue-700 hover:text-blue-900 font-semibold underline">
            Staff Directory
          </Link>
        </div>
      </div>
    </div>
  );
}
