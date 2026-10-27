"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Scale, FileCheck2, ScrollText, ArrowLeft, Shield, FileText, ShieldAlert, Gavel, PackageCheck } from "lucide-react";

interface FIRWorkspaceNavProps {
  firId?: string | null;
  rightAction?: React.ReactNode;
}

export function FIRWorkspaceNav({ firId, rightAction }: FIRWorkspaceNavProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeFirId = firId || searchParams.get("firId");
  const querySuffix = activeFirId ? `?firId=${encodeURIComponent(activeFirId)}` : "";

  const isDrafts = pathname.includes("/fir-workspace/drafts");
  const isTemplates = pathname.includes("/fir-workspace/templates");
  const isBuilder = pathname.includes("/fir-workspace/builder");
  const isZimni = pathname.includes("/fir-workspace/zimni");
  const isArrestDocs = pathname.includes("/fir-workspace/arrest-docs");
  const isKalandra = pathname.includes("/fir-workspace/kalandra");
  const isPropertySeizure = pathname.includes("/fir-workspace/property-seizure");

  return (
    <div className="no-print bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3 mb-4">
      {/* FIR Investigation Workspace Tabs */}
      <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
        {/* 1. Notice Generator */}
        <Link
          href={`/fir-workspace/templates${querySuffix}`}
          className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
            isTemplates
              ? "text-purple-950 bg-purple-50 border border-purple-300 shadow-2xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <FileCheck2 className={`w-3 h-3 ${isTemplates ? "text-purple-700" : "text-purple-600"}`} />
          <span>Notice Generator</span>
        </Link>

        {/* 2. Case Diaries / Zimni */}
        <Link
          href={`/fir-workspace/zimni${querySuffix}`}
          className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
            isZimni
              ? "text-amber-950 bg-amber-50 border border-amber-300 shadow-2xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <ScrollText className={`w-3 h-3 ${isZimni ? "text-amber-700" : "text-amber-600"}`} />
          <span>Case Diaries (Zimni)</span>
        </Link>

        {/* 3. Arrest Docs and IIF-III */}
        <Link
          href={`/fir-workspace/arrest-docs${querySuffix}`}
          className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
            isArrestDocs
              ? "text-rose-950 bg-rose-50 border border-rose-300 shadow-2xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <ShieldAlert className={`w-3 h-3 ${isArrestDocs ? "text-rose-700" : "text-rose-600"}`} />
          <span>Arrest Docs and IIF-III</span>
        </Link>

        {/* 4. Property Seizure Form IIF-IV */}
        <Link
          href={`/fir-workspace/property-seizure${querySuffix}`}
          className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
            isPropertySeizure
              ? "text-teal-950 bg-teal-50 border border-teal-300 shadow-2xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <PackageCheck className={`w-3 h-3 ${isPropertySeizure ? "text-teal-700" : "text-teal-600"}`} />
          <span>Property Seizure Form IIF-IV</span>
        </Link>

        {/* 5. ChargeSheet/Final report and IIF-V */}
        <Link
          href={`/fir-workspace/drafts${querySuffix}`}
          className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
            isDrafts
              ? "text-red-950 bg-red-50 border border-red-300 shadow-2xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Scale className={`w-3 h-3 ${isDrafts ? "text-red-700" : "text-red-600"}`} />
          <span>ChargeSheet/Final report and IIF-V</span>
        </Link>

        {/* 6. Kalandra */}
        <Link
          href={`/fir-workspace/kalandra${querySuffix}`}
          className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
            isKalandra
              ? "text-emerald-950 bg-emerald-50 border border-emerald-300 shadow-2xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Gavel className={`w-3 h-3 ${isKalandra ? "text-emerald-700" : "text-emerald-600"}`} />
          <span>Kalandra</span>
        </Link>

        {/* 7. Template Builder */}
        <Link
          href={`/fir-workspace/builder${querySuffix}`}
          className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
            isBuilder
              ? "text-blue-950 bg-blue-50 border border-blue-300 shadow-2xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <FileText className={`w-3 h-3 ${isBuilder ? "text-blue-700" : "text-blue-600"}`} />
          <span>Template Builder</span>
        </Link>
      </div>

      {/* Right Action / Back to FIR Workspace */}
      <div className="flex items-center gap-2">
        {rightAction}
        <Link
          href="/fir-workspace"
          className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>IO Workspace</span>
        </Link>
      </div>
    </div>
  );
}
