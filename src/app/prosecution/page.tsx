"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useGuardedRouter as useRouter } from "@/hooks/useGuardedRouter";
import {
  Scale,
  FileCheck,
  ClipboardCheck,
  AlertTriangle,
  FileSpreadsheet,
  FileCheck2,
  FolderMinus,
} from "lucide-react";
import {
  ProsecutionMainTab,
  ChallanScrutinySubTab,
  CourtsSubTab,
} from "@/types/prosecution";
import { ScrutinyPerformView } from "@/components/prosecution/ScrutinyPerformView";
import { CommonMalpracticesView } from "@/components/prosecution/CommonMalpracticesView";
import { BailReplyView } from "@/components/prosecution/BailReplyView";
import { StatusReportView } from "@/components/prosecution/StatusReportView";
import { OtherCourtDocsView } from "@/components/prosecution/OtherCourtDocsView";

function ProsecutionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const urlMainTab = searchParams.get("tab") as ProsecutionMainTab | null;
  const urlSubTab = searchParams.get("subtab");

  const [mainTab, setMainTab] = useState<ProsecutionMainTab>(
    urlMainTab === "courts" ? "courts" : "challan_scrutiny"
  );

  const [scrutinySubTab, setScrutinySubTab] = useState<ChallanScrutinySubTab>(
    urlSubTab === "common_malpractices" ? "common_malpractices" : "scrutiny_perform"
  );

  const [courtsSubTab, setCourtsSubTab] = useState<CourtsSubTab>(
    urlSubTab === "status_report"
      ? "status_report"
      : urlSubTab === "other"
      ? "other"
      : "bail_reply"
  );

  // Synchronize state whenever URL search parameters change (e.g. from Sidebar links)
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    const subtabParam = searchParams.get("subtab");

    if (tabParam === "courts") {
      setMainTab("courts");
      if (subtabParam === "status_report" || subtabParam === "other" || subtabParam === "bail_reply") {
        setCourtsSubTab(subtabParam as CourtsSubTab);
      }
    } else if (tabParam === "challan_scrutiny") {
      setMainTab("challan_scrutiny");
      if (subtabParam === "common_malpractices" || subtabParam === "scrutiny_perform") {
        setScrutinySubTab(subtabParam as ChallanScrutinySubTab);
      }
    }
  }, [searchParams]);

  const handleSelectMainTab = (newTab: ProsecutionMainTab) => {
    setMainTab(newTab);
    if (newTab === "challan_scrutiny") {
      router.replace(`/prosecution?tab=challan_scrutiny&subtab=${scrutinySubTab}`);
    } else {
      router.replace(`/prosecution?tab=courts&subtab=${courtsSubTab}`);
    }
  };

  const handleSelectScrutinySubTab = (sub: ChallanScrutinySubTab) => {
    setScrutinySubTab(sub);
    router.replace(`/prosecution?tab=challan_scrutiny&subtab=${sub}`);
  };

  const handleSelectCourtsSubTab = (sub: CourtsSubTab) => {
    setCourtsSubTab(sub);
    router.replace(`/prosecution?tab=courts&subtab=${sub}`);
  };

  return (
    <div className="min-h-screen bg-slate-50/70 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-600 rounded-lg text-white shadow-sm">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Prosecution & Court Liaison
              </h1>

            </div>
          </div>
        </div>

        {/* Primary Tab Switcher */}
        <div
          data-no-translate="true"
          className="flex items-center bg-slate-200/80 p-1 rounded-xl self-start sm:self-auto"
        >
          <button
            key="btn-main-challan-scrutiny"
            type="button"
            onClick={() => handleSelectMainTab("challan_scrutiny")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
              mainTab === "challan_scrutiny"
                ? "bg-white text-indigo-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <FileCheck className="w-4 h-4" />
            <span>Challan Scrutiny</span>
          </button>
          <button
            key="btn-main-courts"
            type="button"
            onClick={() => handleSelectMainTab("courts")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
              mainTab === "courts"
                ? "bg-white text-indigo-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Scale className="w-4 h-4" />
            <span>Courts</span>
          </button>
        </div>
      </div>

      {/* Sub Tabs Bar - Keyed by mainTab so React unmounts & cleanly remounts subtabs */}
      <div
        data-no-translate="true"
        key={`subtabs-bar-${mainTab}`}
        className="flex items-center gap-2 border-b border-slate-200 pb-2"
      >
        {mainTab === "challan_scrutiny" ? (
          <div key="group-challan-scrutiny" className="flex items-center gap-2">
            <button
              key="subtab-btn-scrutiny-perform"
              type="button"
              onClick={() => handleSelectScrutinySubTab("scrutiny_perform")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                scrutinySubTab === "scrutiny_perform"
                  ? "bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200 shadow-xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <ClipboardCheck className="w-3.5 h-3.5" />
              <span>Scrutiny Perform</span>
            </button>
            <button
              key="subtab-btn-common-malpractices"
              type="button"
              onClick={() => handleSelectScrutinySubTab("common_malpractices")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                scrutinySubTab === "common_malpractices"
                  ? "bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200 shadow-xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Common Malpractices</span>
            </button>
          </div>
        ) : (
          <div key="group-courts" className="flex items-center gap-2">
            <button
              key="subtab-btn-bail-reply"
              type="button"
              onClick={() => handleSelectCourtsSubTab("bail_reply")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                courtsSubTab === "bail_reply"
                  ? "bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200 shadow-xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Bail Reply</span>
            </button>
            <button
              key="subtab-btn-status-report"
              type="button"
              onClick={() => handleSelectCourtsSubTab("status_report")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                courtsSubTab === "status_report"
                  ? "bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200 shadow-xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>Status Report</span>
            </button>
            <button
              key="subtab-btn-court-other"
              type="button"
              onClick={() => handleSelectCourtsSubTab("other")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                courtsSubTab === "other"
                  ? "bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200 shadow-xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <FolderMinus className="w-3.5 h-3.5" />
              <span>Other</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="pt-1">
        {mainTab === "challan_scrutiny" && scrutinySubTab === "scrutiny_perform" && (
          <ScrutinyPerformView />
        )}
        {mainTab === "challan_scrutiny" && scrutinySubTab === "common_malpractices" && (
          <CommonMalpracticesView />
        )}
        {mainTab === "courts" && courtsSubTab === "bail_reply" && (
          <BailReplyView />
        )}
        {mainTab === "courts" && courtsSubTab === "status_report" && (
          <StatusReportView />
        )}
        {mainTab === "courts" && courtsSubTab === "other" && (
          <OtherCourtDocsView />
        )}
      </div>
    </div>
  );
}

export default function ProsecutionPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-xs text-slate-500">
          Loading Prosecution module...
        </div>
      }
    >
      <ProsecutionContent />
    </Suspense>
  );
}
