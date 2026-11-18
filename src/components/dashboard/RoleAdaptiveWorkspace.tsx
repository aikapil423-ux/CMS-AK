"use client";

import React, { useState, useEffect } from "react";
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

type PerspectiveRole = "SHO" | "IO" | "MUNSHI" | "SP";

interface RoleAdaptiveWorkspaceProps {
  complaintCount: number | null;
  gdCount: number | null;
  firCount: number | null;
  erssCount?: number | null;
  overdueInquiryCount?: number | null;
  pendingReportCount?: number | null;
  affidavitCount?: number | null;
  remandCustodyCount?: number | null;
  pendingZimniCount?: number | null;
  defaultBailRiskCount?: number | null;
  auditAlertsCount?: number | null;
}

export function RoleAdaptiveWorkspace({
  complaintCount,
  gdCount,
  firCount,
  erssCount = 0,
  overdueInquiryCount = 0,
  pendingReportCount = 0,
  affidavitCount = 0,
  remandCustodyCount = 0,
  pendingZimniCount = 0,
  defaultBailRiskCount = 0,
  auditAlertsCount = 0,
}: RoleAdaptiveWorkspaceProps) {
  const { currentUser } = useAuth();

  // Helper to map user's actual official role to corresponding workspace perspective
  const getRolePerspective = (role: string): PerspectiveRole => {
    if (
      role === "SP_DISTRICT" ||
      role === "DSP_SUBDIV" ||
      role === "CP" ||
      role === "JOINT_CP" ||
      role === "DCP" ||
      role === "ADDL_DCP" ||
      role === "ACP" ||
      role === "VIEWER_AUDITOR" ||
      role === "COMMISSIONERATE_AUDITOR" ||
      role === "SPECIAL_UNIT_SP" ||
      role === "SPECIAL_UNIT_DSP" ||
      role === "SPECIAL_UNIT_AUDITOR"
    ) {
      return "SP";
    }
    if (
      role === "SHO" ||
      role === "COMMISSIONERATE_SHO" ||
      role === "SPECIAL_UNIT_INSPECTOR"
    ) {
      return "SHO";
    }
    if (
      role === "ENQUIRY_OFFICER" ||
      role === "SI" ||
      role === "ASI" ||
      role === "COMMISSIONERATE_SI" ||
      role === "COMMISSIONERATE_ASI" ||
      role === "SPECIAL_UNIT_SI" ||
      role === "SPECIAL_UNIT_ASI" ||
      role === "SPECIAL_UNIT_IO"
    ) {
      return "IO";
    }
    if (
      role === "MHC_GD_INCHARGE" ||
      role === "DUTY_OFFICER" ||
      role === "COMMISSIONERATE_MHC" ||
      role === "STATION_STAFF" ||
      role === "COMMISSIONERATE_STAFF" ||
      role === "HEAD_CONSTABLE" ||
      role === "CONSTABLE" ||
      role === "COMMISSIONERATE_HC" ||
      role === "COMMISSIONERATE_CONSTABLE" ||
      role === "SPECIAL_UNIT_MHC" ||
      role === "SPECIAL_UNIT_DUTY_OFFICER" ||
      role === "SPECIAL_UNIT_HC" ||
      role === "SPECIAL_UNIT_CONSTABLE" ||
      role === "SPECIAL_UNIT_STAFF" ||
      role === "TRAINING_MHC"
    ) {
      return "MUNSHI";
    }
    return "SHO";
  };

  const [activeRole, setActiveRole] = useState<PerspectiveRole>(() =>
    getRolePerspective(currentUser.role)
  );

  // Automatically sync activeRole whenever the logged-in user changes
  useEffect(() => {
    setActiveRole(getRolePerspective(currentUser.role));
  }, [currentUser.id, currentUser.role]);

  // Determine if user is Developer Admin (only dev admin gets multi-role testing switchers)
  const isDeveloperOrAdmin =
    currentUser.pno === "DEV-ADMIN" || currentUser.role === "SUPER_ADMIN";

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden transition-all">
      {/* Top Header with Role Switcher or Role Badge */}
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
              : activeRole === "SP"
              ? "Supervisory Oversight (पुलिस अधीक्षक / डीएसपी)"
              : "Duty Officer / Station Clerk (मुंशी / संतरी)"}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {currentUser.name} • {currentUser.roleDisplay} ({currentUser.stationName})
          </p>
        </div>

        {/* Right side: Developer Test Switcher vs Strict Dedicated Role Badge */}
        {isDeveloperOrAdmin ? (
          <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-2xs text-xs font-semibold">
            <span className="text-[10px] font-bold text-slate-400 px-2 uppercase tracking-wider hidden sm:inline">
              Dev Mode
            </span>
            <button
              type="button"
              data-role-tab="SP"
              onClick={() => setActiveRole("SP")}
              className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeRole === "SP"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-purple-400" />
              <span>SP View</span>
            </button>

            <button
              type="button"
              data-role-tab="SHO"
              onClick={() => setActiveRole("SHO")}
              className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeRole === "SHO"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              <span>SHO View</span>
            </button>

            <button
              type="button"
              data-role-tab="IO"
              onClick={() => setActiveRole("IO")}
              className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeRole === "IO"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>IO View</span>
            </button>

            <button
              type="button"
              data-role-tab="MUNSHI"
              onClick={() => setActiveRole("MUNSHI")}
              className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeRole === "MUNSHI"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-blue-400" />
              <span>मुंशी / संतरी View</span>
            </button>
          </div>
        ) : (
          /* Dedicated Role Verified Badge for Police Personnel (No Switcher Buttons) */
          <div className="flex items-center gap-2">
            {activeRole === "SHO" ? (
              <div
                data-role-tab="SHO"
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold shadow-2xs"
              >
                <Shield className="w-4 h-4 text-amber-600" />
                <span>थाना प्रभारी कमांड डेस्क (SHO Control)</span>
              </div>
            ) : activeRole === "IO" ? (
              <div
                data-role-tab="IO"
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs font-semibold shadow-2xs"
              >
                <UserCheck className="w-4 h-4 text-blue-600" />
                <span>जाँच अधिकारी डेस्क (IO Duty Console)</span>
              </div>
            ) : activeRole === "SP" ? (
              <div
                data-role-tab="SP"
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-xs font-semibold shadow-2xs"
              >
                <Shield className="w-4 h-4 text-purple-600" />
                <span>जिला / अनुभाग कमांड (Supervisory HQ)</span>
              </div>
            ) : (
              <div
                data-role-tab="MUNSHI"
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold shadow-2xs"
              >
                <BookOpen className="w-4 h-4 text-emerald-600" />
                <span>थाना मुंशी / संतरी डेस्क (General Duty)</span>
              </div>
            )}
          </div>
        )}
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
                  {overdueInquiryCount ?? 0} <span className="text-xs font-semibold text-rose-700">Inquiries / Cases</span>
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
                  {pendingReportCount ?? 0} <span className="text-xs font-semibold text-amber-800">Final Reports</span>
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
                  {affidavitCount ?? 0} <span className="text-xs font-semibold text-indigo-800">Affidavits Due</span>
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
                  {firCount ?? 0} <span className="text-xs font-semibold text-blue-800">Active Cases</span>
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
                  {remandCustodyCount ?? 0} <span className="text-xs font-semibold text-rose-700">Custody Accused</span>
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
                  {pendingZimniCount ?? 0} <span className="text-xs font-semibold text-amber-800">Pending Entries</span>
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
                  {gdCount ?? 0} <span className="text-xs font-semibold text-slate-600">Entries Today</span>
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
                  {erssCount ?? 0} <span className="text-xs font-semibold text-emerald-800">Events Active</span>
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

        {/* 4. SP / DSP SUPERVISORY VIEW */}
        {activeRole === "SP" && (
          <div className="space-y-4 animate-in fade-in-50 duration-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {/* Card 1: जिला/अनुभाग अपराध व पेंडेंसी सुपरविजन */}
              <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/40 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-800 flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-indigo-600" />
                    जिला व अनुभाग अपराध सुपरविजन
                  </span>
                  <span className="text-xs font-mono font-bold bg-indigo-200 text-indigo-900 px-2 py-0.5 rounded-full">
                    HQ Oversight
                  </span>
                </div>
                <div className="text-2xl font-black text-indigo-950">
                  {firCount ?? 0} <span className="text-xs font-semibold text-indigo-800">Monitored Cases</span>
                </div>
                <p className="text-xs text-indigo-900 leading-snug">
                  जिले/उप-मंडल के सभी थानों में 15 दिन से अधिक लंबित जांचें व गंभीर अपराध। थाना प्रभारियों से साप्ताहिक जवाब तलब।
                </p>
                <div className="pt-1">
                  <Link
                    href="/audits"
                    className="text-xs font-bold text-indigo-900 hover:text-indigo-950 underline flex items-center gap-1"
                  >
                    <span>Inspect District Pendency</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Card 2: धारा 187 BNSS डिफ़ॉल्ट बेल रिस्क */}
              <div className="p-4 rounded-xl border border-rose-300 bg-rose-50/50 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-rose-800 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600 animate-pulse" />
                    60/90 दिन डिफ़ॉल्ट बेल रिस्क
                  </span>
                  <span className="text-xs font-mono font-bold bg-rose-600 text-white px-2 py-0.5 rounded-full animate-pulse">
                    Statutory Bail Alert
                  </span>
                </div>
                <div className="text-2xl font-black text-rose-950">
                  {defaultBailRiskCount ?? 0} <span className="text-xs font-semibold text-rose-700">Immediate Risk</span>
                </div>
                <p className="text-xs text-rose-800 leading-snug">
                  धारा 187 BNSS: 60/90 दिन पूरे होने से पूर्व चार्जशीट दाखिल करना अनिवार्य। विफलता पर वैधानिक जमानत का जोखिम।
                </p>
                <div className="pt-1">
                  <Link
                    href="/fir"
                    className="text-xs font-bold text-rose-900 hover:text-rose-950 underline flex items-center gap-1"
                  >
                    <span>Review Statutory Deadlines →</span>
                  </Link>
                </div>
              </div>

              {/* Card 3: आईजीपी साप्ताहिक डायरी व निरीक्षण */}
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                    <Scale className="w-4 h-4 text-emerald-600" />
                    आईजीपी साप्ताहिक डायरी व ऑडिट
                  </span>
                  <span className="text-xs font-mono font-bold bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full">
                    Inspection Console
                  </span>
                </div>
                <div className="text-2xl font-black text-emerald-950">
                  {auditAlertsCount ?? 0} <span className="text-xs font-semibold text-emerald-800">Inspection Alerts</span>
                </div>
                <p className="text-xs text-emerald-900 leading-snug">
                  22 रजिस्टरों की साप्ताहिक वर्कबुक, क्राइम कम्पैरेटिव ऑडिट व केस स्क्रूटनी रिपोर्ट उच्चाधिकारियों के अवलोकन हेतु तैयार।
                </p>
                <div className="pt-1">
                  <Link
                    href="/reports"
                    className="text-xs font-bold text-emerald-900 hover:text-emerald-950 underline flex items-center gap-1"
                  >
                    <span>Open IGP Briefing Console</span>
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
