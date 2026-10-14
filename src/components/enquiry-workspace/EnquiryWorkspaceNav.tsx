"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { FileCheck2, ScrollText, Sparkles, ArrowLeft, FileText, Languages } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface EnquiryWorkspaceNavProps {
  complaintId?: string | null;
  rightAction?: React.ReactNode;
}

export function EnquiryWorkspaceNav({ complaintId, rightAction }: EnquiryWorkspaceNavProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { language, setLanguage, isHindi } = useLanguage();

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
          <span>{isHindi ? "जांच रिपोर्ट (Drafts)" : "Draft Enquiry Reports"}</span>
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
          <span>{isHindi ? "असंज्ञेय रपट (NCR)" : "NCR u/s 174 BNSS"}</span>
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
          <span>{isHindi ? "सूचना-पत्र जनरेटर" : "Notice Generator"}</span>
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
          <span>{isHindi ? "टेम्पलेट बिल्डर" : "Generate Report Template"}</span>
        </Link>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2">
        {rightAction}

        {/* Language Switcher */}
        <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200">
          <Languages className="w-3.5 h-3.5 text-blue-700 ml-1" />
          <button
            type="button"
            onClick={() => setLanguage("hi")}
            className={`px-2 py-0.5 rounded text-xs font-bold transition-all cursor-pointer ${
              isHindi
                ? "bg-amber-600 text-white shadow-2xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
            }`}
          >
            हिन्दी
          </button>
          <button
            type="button"
            onClick={() => setLanguage("en")}
            className={`px-2 py-0.5 rounded text-xs font-bold transition-all cursor-pointer ${
              !isHindi
                ? "bg-blue-700 text-white shadow-2xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
            }`}
          >
            English
          </button>
        </div>

        <Link href="/enquiry-workspace">
          <button
            type="button"
            className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-300 hover:bg-slate-50 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
            title={isHindi ? "जांच अधिकारी कार्यक्षेत्र मुख्य पृष्ठ" : "Back to Field Enquiry Workspace Hub"}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isHindi ? "कार्यक्षेत्र मुख्य" : "Workspace Home"}</span>
          </button>
        </Link>
      </div>
    </div>
  );
}
