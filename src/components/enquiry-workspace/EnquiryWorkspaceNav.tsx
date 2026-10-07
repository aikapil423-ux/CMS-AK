"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { FileCheck2, ScrollText, Sparkles, ArrowLeft, FileText } from "lucide-react";

interface EnquiryWorkspaceNavProps {
  complaintId?: string | null;
  rightAction?: React.ReactNode;
}

export function EnquiryWorkspaceNav({ complaintId, rightAction }: EnquiryWorkspaceNavProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeComplaintId = complaintId || searchParams.get("complaintId");
  const querySuffix = activeComplaintId ? `?complaintId=${encodeURIComponent(activeComplaintId)}` : "";

  const isDrafts = pathname.includes("/enquiry-workspace/drafts");
  const isNcr = pathname.includes("/enquiry-workspace/ncr");
  const isTemplates = pathname.includes("/enquiry-workspace/templates");
  const isBuilder = pathname.includes("/enquiry-workspace/builder");

  return (
    <div className="no-print bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3 mb-4">
      {/* 4 Main Workspace Tabs */}
      <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
        <Link
          href={`/enquiry-workspace/drafts${querySuffix}`}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            isDrafts
              ? "text-amber-950 bg-amber-50 border border-amber-300 shadow-2xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <FileCheck2 className={`w-3.5 h-3.5 ${isDrafts ? "text-amber-700" : "text-amber-600"}`} />
          <span>Draft Enquiry Reports</span>
        </Link>

        <Link
          href={`/enquiry-workspace/ncr${querySuffix}`}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            isNcr
              ? "text-emerald-950 bg-emerald-50 border border-emerald-300 shadow-2xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <FileText className={`w-3.5 h-3.5 ${isNcr ? "text-emerald-700" : "text-emerald-600"}`} />
          <span>NCR u/s 174 BNSS</span>
        </Link>

        <Link
          href={`/enquiry-workspace/templates${querySuffix}`}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            isTemplates
              ? "text-purple-950 bg-purple-50 border border-purple-300 shadow-2xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <ScrollText className={`w-3.5 h-3.5 ${isTemplates ? "text-purple-700" : "text-purple-600"}`} />
          <span>Notice Generator</span>
        </Link>

        <Link
          href={`/enquiry-workspace/builder${querySuffix}`}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            isBuilder
              ? "text-blue-950 bg-blue-50 border border-blue-300 shadow-2xs font-black"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Sparkles className={`w-3.5 h-3.5 ${isBuilder ? "text-blue-700" : "text-blue-600"}`} />
          <span>Generate Report Template</span>
        </Link>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2">
        {rightAction}
        <Link href="/enquiry-workspace">
          <button
            type="button"
            className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-300 hover:bg-slate-50 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
            title="Back to Field Enquiry Workspace Hub"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Workspace Home</span>
          </button>
        </Link>
      </div>
    </div>
  );
}
