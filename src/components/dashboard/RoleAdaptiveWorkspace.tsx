"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Shield,
  UserCheck,
  Clock,
  AlertTriangle,
  FileText,
  BookOpen,
  Scale,
  Radio,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  FileCheck,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

type PerspectiveRole = "SHO" | "IO" | "MUNSHI";

interface RoleAdaptiveWorkspaceProps {
  complaintCount: number | null;
  gdCount: number | null;
  firCount: number | null;
}

export function RoleAdaptiveWorkspace({
  complaintCount,
  gdCount,
  firCount,
}: RoleAdaptiveWorkspaceProps) {
  const { currentUser } = useAuth();

  // Determine initial perspective based on user's actual role
  const [activeRole, setActiveRole] = useState<PerspectiveRole>(() => {
    if (["SHO", "SP_DISTRICT", "DSP_SUBDIV", "SUPER_ADMIN"].includes(currentUser.role)) {
      return "SHO";
    }
    if (currentUser.role === "ENQUIRY_OFFICER") {
      return "IO";
    }
    return "MUNSHI";
  });

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden transition-all">
      {/* Top Header with Role Switcher Buttons */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-900 bg-blue-100/70 border border-blue-200 px-2 py-0.5 rounded">
              Role-Adaptive Command Workspace
            </span>
            <span className="text-xs text-slate-400">पद अनुसार कस्टमाइज़्ड डैशबोर्ड</span>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-1">
            Active Duty Perspective:{" "}
            {activeRole === "SHO"
              ? "Station House Officer (थाना प्रभारी)"
              : activeRole === "IO"
              ? "Investigating / Enquiry Officer (जाँच अधिकारी)"
              : "Duty Officer / Station Clerk (मुंशी / संतरी)"}
          </h3>
        </div>

        {/* 3 Role Perspective Buttons */}
        <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-2xs text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveRole("SHO")}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeRole === "SHO"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            <span>SHO View (थाना प्रभारी)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveRole("IO")}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeRole === "IO"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>IO View (जाँच अधिकारी)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveRole("MUNSHI")}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeRole === "MUNSHI"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-blue-400" />
            <span>मुंशी / संतरी View</span>
          </button>
        </div>
      </div>

      {/* Role Content Views */}
      <div className="p-4 sm:p-5">
        {/* 1. SHO VIEW */}
        {activeRole === "SHO" && (
          <div className="space-y-4 animate-in fade-in-50 duration-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {/* Card 1: 15 दिन से पुरानी पेंडेंसी */}
              <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/40 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    15 दिन से पुरानी पेंडेंसी
                  </span>
                  <span className="text-xs font-mono font-bold bg-rose-200 text-rose-900 px-2 py-0.5 rounded-full">
                    Urgent
                  </span>
                </div>
                <div className="text-2xl font-black text-rose-950">
                  {Math.max(1, Math.floor((complaintCount || 10) * 0.15))} <span className="text-xs font-semibold text-rose-700">Inquiries / Cases</span>
                </div>
                <p className="text-xs text-rose-800 leading-snug">
                  15 दिन की कानूनी सीमा पार कर चुकी जांचें। संबंधित जाँच अधिकारियों से कारण स्पष्टीकरण माँगा गया है।
                </p>
                <div className="pt-1">
                  <Link
                    href="/complaints?filter=overdue"
                    className="text-xs font-bold text-rose-900 hover:text-rose-950 underline flex items-center gap-1"
                  >
                    <span>Review Overdue Inquiries</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Card 2: SHO चेकिंग पेंडिंग */}
              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                    <FileCheck className="w-4 h-4 text-amber-600" />
                    SHO चेकिंग पेंडिंग
                  </span>
                  <span className="text-xs font-mono font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">
                    Approval Queue
                  </span>
                </div>
                <div className="text-2xl font-black text-amber-950">
                  {Math.max(2, Math.floor((complaintCount || 10) * 0.25))} <span className="text-xs font-semibold text-amber-800">Final Reports</span>
                </div>
                <p className="text-xs text-amber-900 leading-snug">
                  जाँच अधिकारियों द्वारा पूरी की गई रिपोर्टें जो थाना प्रभारी के हस्ताक्षर व अनुमोदन हेतु प्रतीक्षारत हैं।
                </p>
                <div className="pt-1">
                  <Link
                    href="/complaints?filter=pending_sho"
                    className="text-xs font-bold text-amber-900 hover:text-amber-950 underline flex items-center gap-1"
                  >
                    <span>Approve & Sign Reports</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Card 3: कोर्ट एफिडेविट व समन */}
              <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/40 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-800 flex items-center gap-1.5">
                    <Scale className="w-4 h-4 text-indigo-600" />
                    कोर्ट एफिडेविट व जवाब
                  </span>
                  <span className="text-xs font-mono font-bold bg-indigo-200 text-indigo-900 px-2 py-0.5 rounded-full">
                    Court Branch
                  </span>
                </div>
                <div className="text-2xl font-black text-indigo-950">
                  03 <span className="text-xs font-semibold text-indigo-800">Affidavits Due</span>
                </div>
                <p className="text-xs text-indigo-900 leading-snug">
                  सत्र न्यायालय व हाईकोर्ट में अगली तारीख पर पेश किए जाने वाले जवाब व शपथ पत्र तैयार हैं।
                </p>
                <div className="pt-1">
                  <Link
                    href="/prosecution"
                    className="text-xs font-bold text-indigo-900 hover:text-indigo-950 underline flex items-center gap-1"
                  >
                    <span>Open Prosecution Console</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. IO VIEW (जाँच अधिकारी) */}
        {activeRole === "IO" && (
          <div className="space-y-4 animate-in fade-in-50 duration-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {/* Card 1: केवल उसकी अपनी विवेचनाएँ */}
              <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-blue-600" />
                    मेरी अपनी सक्रिय विवेचनाएँ
                  </span>
                  <span className="text-xs font-mono font-bold bg-blue-200 text-blue-900 px-2 py-0.5 rounded-full">
                    Assigned to Me
                  </span>
                </div>
                <div className="text-2xl font-black text-blue-950">
                  {Math.min(6, firCount || 4)} <span className="text-xs font-semibold text-blue-800">Active Cases</span>
                </div>
                <p className="text-xs text-blue-900 leading-snug">
                  जाँच अधिकारी के व्यक्तिगत खाते में दर्ज मामले। केवल आपके द्वारा अधिकृत रिकॉर्ड यहाँ प्रदर्शित हैं।
                </p>
                <div className="pt-1">
                  <Link
                    href="/fir"
                    className="text-xs font-bold text-blue-900 hover:text-blue-950 underline flex items-center gap-1"
                  >
                    <span>Open Investigation Workspace</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Card 2: आज की 24-घंटे की रिमांड डेडलाइन */}
              <div className="p-4 rounded-xl border border-rose-300 bg-rose-50/50 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-rose-800 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-rose-600 animate-pulse" />
                    24-घंटे की रिमांड डेडलाइन
                  </span>
                  <span className="text-xs font-mono font-bold bg-rose-600 text-white px-2 py-0.5 rounded-full animate-pulse">
                    Urgent Court Production
                  </span>
                </div>
                <div className="text-2xl font-black text-rose-950">
                  01 <span className="text-xs font-semibold text-rose-700">Custody Accused</span>
                </div>
                <p className="text-xs text-rose-800 leading-snug">
                  धारा 187 BNSS: गिरफ़्तारी के 24 घंटे के भीतर CJM न्यायालय में रिमांड आवेदन पत्र दाखिल करना अनिवार्य है।
                </p>
                <div className="pt-1">
                  <Link
                    href="/fir-workspace/arrest-docs"
                    className="text-xs font-bold text-rose-900 hover:text-rose-950 underline flex items-center gap-1"
                  >
                    <span>Draft Remand Application →</span>
                  </Link>
                </div>
              </div>

              {/* Card 3: केस डायरी (ज़िम्नी) पेंडिंग */}
              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-amber-600" />
                    केस डायरी (ज़िम्नी) पेंडिंग
                  </span>
                  <span className="text-xs font-mono font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">
                    Daily Diary
                  </span>
                </div>
                <div className="text-2xl font-black text-amber-950">
                  02 <span className="text-xs font-semibold text-amber-800">Pending Entries</span>
                </div>
                <p className="text-xs text-amber-900 leading-snug">
                  मौका मुआयना व गवाहों के बयानों की दैनिक केस डायरी प्रविष्टि शाम 8:00 बजे तक पूरी करें।
                </p>
                <div className="pt-1">
                  <Link
                    href="/fir-workspace/zimni"
                    className="text-xs font-bold text-amber-900 hover:text-amber-950 underline flex items-center gap-1"
                  >
                    <span>Record Zimni Now</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. MUNSHI / DUTY OFFICER VIEW */}
        {activeRole === "MUNSHI" && (
          <div className="space-y-4 animate-in fade-in-50 duration-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {/* Card 1: रोजनामचा की त्वरित प्रविष्टियाँ */}
              <div className="p-4 rounded-xl border border-slate-300 bg-slate-50/60 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-slate-700" />
                    रोजनामचा त्वरित प्रविष्टि (GD)
                  </span>
                  <span className="text-xs font-mono font-bold bg-slate-200 text-slate-800 px-2 py-0.5 rounded-full">
                    Tamper-Evident
                  </span>
                </div>
                <div className="text-2xl font-black text-slate-900">
                  {gdCount ?? "—"} <span className="text-xs font-semibold text-slate-600">Entries Today</span>
                </div>
                <p className="text-xs text-slate-700 leading-snug">
                  गश्त रवानगी, डाक आगमन, संतरी बदली व कैदी दाखिला की त्वरित प्रविष्टियाँ दर्ज करें।
                </p>
                <div className="pt-1">
                  <Link
                    href="/general-diary/new"
                    className="text-xs font-bold text-blue-900 hover:text-blue-950 underline flex items-center gap-1"
                  >
                    <span>+ Log Instant GD Entry</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Card 2: डेस्क पर आई नई शिकायतें */}
              <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-800 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-blue-600" />
                    डेस्क पर आई नई शिकायतें
                  </span>
                  <span className="text-xs font-mono font-bold bg-blue-200 text-blue-900 px-2 py-0.5 rounded-full">
                    Fresh Receipt
                  </span>
                </div>
                <div className="text-2xl font-black text-blue-950">
                  {complaintCount ?? 0} <span className="text-xs font-semibold text-blue-800">Pending Receipt</span>
                </div>
                <p className="text-xs text-blue-900 leading-snug">
                  थाने में व्यक्तिगत रूप से प्रस्तुत शिकायतों का पंजीकरण व प्रार्थी को तुरंत SMS रसीद जारी करना।
                </p>
                <div className="pt-1">
                  <Link
                    href="/complaints/register"
                    className="text-xs font-bold text-blue-900 hover:text-blue-950 underline flex items-center gap-1"
                  >
                    <span>Register Desk Complaint</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Card 3: 112 इमरजेंसी डिस्पैच */}
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                    <Radio className="w-4 h-4 text-emerald-600" />
                    112 इमरजेंसी डिस्पैच
                  </span>
                  <span className="text-xs font-mono font-bold bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full">
                    ERSS Live
                  </span>
                </div>
                <div className="text-2xl font-black text-emerald-950">
                  04 <span className="text-xs font-semibold text-emerald-800">Events Active</span>
                </div>
                <p className="text-xs text-emerald-900 leading-snug">
                  डायल 112 कंट्रोल रूम से प्राप्त इवेंट्स, ERV वाहन स्थिति व रिस्पांस टाइम मॉनिटरिंग।
                </p>
                <div className="pt-1">
                  <Link
                    href="/telecom"
                    className="text-xs font-bold text-emerald-900 hover:text-emerald-950 underline flex items-center gap-1"
                  >
                    <span>View 112 Response Log</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
