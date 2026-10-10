"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Scale, FileCheck2, ScrollText, ArrowLeft, Shield, FileText, ShieldAlert } from "lucide-react";

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

  return (
    <div className="no-print bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3 mb-4">
      {/* FIR Investigation Workspace Tabs */}
      <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
        <Link
          href={`/fir-workspace/builder${querySuffix}`}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            isBuilder
              ? "text-blue-950 bg-blue-50 border border-blue-300 shadow-2xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <FileText className={`w-3.5 h-3.5 ${isBuilder ? "text-blue-700" : "text-blue-600"}`} />
          <span>Template Builder (टेम्पलेट बिल्डर)</span>
        </Link>

        <Link
          href={`/fir-workspace/drafts${querySuffix}`}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            isDrafts
              ? "text-red-950 bg-red-50 border border-red-300 shadow-2xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Scale className={`w-3.5 h-3.5 ${isDrafts ? "text-red-700" : "text-red-600"}`} />
          <span>Final Form (Sec 193 BNSS)</span>
        </Link>

        <Link
          href={`/fir-workspace/templates${querySuffix}`}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            isTemplates
              ? "text-purple-950 bg-purple-50 border border-purple-300 shadow-2xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <FileCheck2 className={`w-3.5 h-3.5 ${isTemplates ? "text-purple-700" : "text-purple-600"}`} />
          <span>Statutory Notice Generator</span>
        </Link>

        <Link
          href={`/fir-workspace/arrest-docs${querySuffix}`}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            isArrestDocs
              ? "text-rose-950 bg-rose-50 border border-rose-300 shadow-2xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <ShieldAlert className={`w-3.5 h-3.5 ${isArrestDocs ? "text-rose-700" : "text-rose-600"}`} />
          <span>Arrest Docs (गिरफ्तारी प्रपत्र)</span>
        </Link>

        <Link
          href={`/fir-workspace/zimni${querySuffix}`}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            isZimni
              ? "text-amber-950 bg-amber-50 border border-amber-300 shadow-2xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <ScrollText className={`w-3.5 h-3.5 ${isZimni ? "text-amber-700" : "text-amber-600"}`} />
          <span>Case Diaries / Zimni</span>
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
