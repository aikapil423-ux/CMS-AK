"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useGuardedRouter as useRouter } from "@/hooks/useGuardedRouter";
import { ReportTab, CrimeSitrepData, WeeklyCrimeDiaryData, IgpPresentationData } from "@/types/reports";
import { ReportsService } from "@/services/reportsService";
import { CrimeSitrepView } from "@/components/reports/CrimeSitrepView";
import { WeeklyCrimeDiaryView } from "@/components/reports/WeeklyCrimeDiaryView";
import { IgpPresentationView } from "@/components/reports/IgpPresentationView";
import { SavedReportsView } from "@/components/reports/SavedReportsView";
import { FileBarChart, RefreshCw, BookmarkCheck, ShieldAlert, CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from '@/context/AuthContext';

function ReportsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isHindi } = useLanguage();
  const { currentUser } = useAuth();

  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<ReportTab>(() => {
    if (tabParam === "weekly_crime_diary" || tabParam === "WEEKLY CRIME DIARY") {
      return "WEEKLY CRIME DIARY";
    }
    if (tabParam === "igp_presentation" || tabParam === "IGP Meeting Presentation") {
      return "IGP Meeting Presentation";
    }
    if (tabParam === "saved_reports" || tabParam === "Saved Reports") {
      return "Saved Reports";
    }
    return "CrimeSITREP_District";
  });

  const [sitrepData, setSitrepData] = useState<CrimeSitrepData | null>(null);
  const [weeklyData, setWeeklyData] = useState<WeeklyCrimeDiaryData | null>(null);
  const [igpData, setIgpData] = useState<IgpPresentationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditSuccess, setAuditSuccess] = useState(false);
  const [loadErrors, setLoadErrors] = useState<Partial<Record<ReportTab, string>>>({});
  const loadGeneration = useRef(0);

  const loadData = async () => {
    const generation = ++loadGeneration.current;
    setIsLoading(true);
    setLoadErrors({});
    try {
      const [sitrep, weekly, igp] = await Promise.allSettled([
        ReportsService.getCrimeSitrep(undefined, undefined, currentUser.district),
        ReportsService.getWeeklyCrimeDiary(currentUser.stationName, currentUser.district),
        ReportsService.getIgpPresentationData(currentUser.district),
      ]);
      if (generation !== loadGeneration.current) return;
      setSitrepData(sitrep.status === 'fulfilled' ? sitrep.value : null);
      setWeeklyData(weekly.status === 'fulfilled' ? weekly.value : null);
      setIgpData(igp.status === 'fulfilled' ? igp.value : null);
      const errors: Partial<Record<ReportTab, string>> = {};
      for (const [tab, result] of [['CrimeSITREP_District', sitrep], ['WEEKLY CRIME DIARY', weekly], ['IGP Meeting Presentation', igp]] as const) {
        if (result.status === 'rejected') {
          console.error(`Failed to load ${tab}`, result.reason);
          errors[tab] = 'Report load nahi ho saki. Connection / data service check karke Retry karein.';
        }
      }
      setLoadErrors(errors);
    } catch (e) {
      console.error("Failed to load reports data", e);
      if (generation === loadGeneration.current) {
        setLoadErrors({
          'CrimeSITREP_District': 'Reports could not be loaded. Please retry.',
          'WEEKLY CRIME DIARY': 'Reports could not be loaded. Please retry.',
          'IGP Meeting Presentation': 'Reports could not be loaded. Please retry.'
        });
      }
    } finally {
      if (generation === loadGeneration.current) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    return () => { loadGeneration.current++; };
  }, [currentUser.district, currentUser.stationName]);

  const handleAuditLive = async () => {
    setIsAuditing(true);
    setAuditSuccess(false);
    await loadData();
    setTimeout(() => {
      setIsAuditing(false);
      setAuditSuccess(true);
      setTimeout(() => setAuditSuccess(false), 3000);
    }, 400);
  };

  const handleGenerateAndSaveSITREP = async () => {
    const generated = await ReportsService.generateAndSaveCrimeSitrep(currentUser.district);
    setSitrepData(generated.data as CrimeSitrepData);
  };

  const handleLoadSavedSitrep = (savedData: CrimeSitrepData) => {
    setSitrepData(savedData);
    setActiveTab("CrimeSITREP_District");
    router.replace(`/reports?tab=crime_sitrep`);
  };

  const handleTabChange = (tab: ReportTab) => {
    setActiveTab(tab);
    const paramVal =
      tab === "WEEKLY CRIME DIARY"
        ? "weekly_crime_diary"
        : tab === "IGP Meeting Presentation"
        ? "igp_presentation"
        : tab === "Saved Reports"
        ? "saved_reports"
        : "crime_sitrep";
    router.replace(`/reports?tab=${paramVal}`);
  };

  return (
    <div className="space-y-4 pb-14 text-slate-800">
      {/* Hallmark Swiss-Grid Banner Header */}
      <div className="bg-white border border-[#b7c1d4] p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 bg-[#203c88] text-white flex items-center justify-center shrink-0">
            <FileBarChart className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#203c88] bg-[#eef1ff] px-2 py-0.5 border border-[#a8b5d1]">
                OFFICIAL RECORD · {sitrepData?.district || "PANIPAT"} DISTRICT
              </span>
              <span className="text-xs text-slate-500 font-mono">
                HARYANA POLICE
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#203c88] tracking-tight mt-1">
              {isHindi ? "अपराध एवं प्रशासनिक रिपोर्ट" : "Crime SITREP & Judicial Audit Console"}
            </h1>

          </div>
        </div>

        {/* Live Database Audit Control */}
        <div className="flex items-center gap-3">
          {auditSuccess && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-800 bg-emerald-50 border border-emerald-300 px-3 py-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="font-medium">Audit complete. Live records synchronized.</span>
            </div>
          )}
          <button
            onClick={handleAuditLive}
            disabled={isAuditing}
            className="flex items-center gap-2 px-4 py-2 border border-[#203c88] bg-[#203c88] text-white text-xs font-semibold hover:bg-[#172e70] active:bg-[#0f1f4d] disabled:opacity-50 transition-colors cursor-pointer"
            title="Execute live audit against registered FIRs and GD records"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isAuditing ? "animate-spin" : ""}`} />
            <span>{isAuditing ? "Auditing Database..." : "Audit Portal Data"}</span>
          </button>
        </div>
      </div>

      {/* Hallmark Clean Monolithic Tab Strip (No rounded pills, crisp institutional tabs) */}
      <nav className="flex border-b border-[#203c88] bg-[#f7f9fc] p-1 gap-1 flex-wrap sm:flex-nowrap" aria-label="Report modules">
        <button
          type="button"
          onClick={() => handleTabChange("CrimeSITREP_District")}
          className={`flex-1 py-2.5 px-4 text-xs font-bold transition-colors text-center border ${
            activeTab === "CrimeSITREP_District"
              ? "bg-[#203c88] text-white border-[#203c88]"
              : "bg-white text-slate-700 border-[#cbd3e3] hover:bg-[#eef1ff]"
          }`}
        >
          CrimeSITREP_District
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("WEEKLY CRIME DIARY")}
          className={`flex-1 py-2.5 px-4 text-xs font-bold transition-colors text-center border ${
            activeTab === "WEEKLY CRIME DIARY"
              ? "bg-[#203c88] text-white border-[#203c88]"
              : "bg-white text-slate-700 border-[#cbd3e3] hover:bg-[#eef1ff]"
          }`}
        >
          WEEKLY CRIME DIARY
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("IGP Meeting Presentation")}
          className={`flex-1 py-2.5 px-4 text-xs font-bold transition-colors text-center border ${
            activeTab === "IGP Meeting Presentation"
              ? "bg-[#203c88] text-white border-[#203c88]"
              : "bg-white text-slate-700 border-[#cbd3e3] hover:bg-[#eef1ff]"
          }`}
        >
          IGP Meeting Presentation
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("Saved Reports")}
          className={`flex-1 py-2.5 px-4 text-xs font-bold transition-colors text-center border flex items-center justify-center gap-1.5 ${
            activeTab === "Saved Reports"
              ? "bg-[#203c88] text-white border-[#203c88]"
              : "bg-white text-slate-700 border-[#cbd3e3] hover:bg-[#eef1ff]"
          }`}
        >
          <BookmarkCheck className="w-3.5 h-3.5" />
          <span>Saved Reports</span>
        </button>
      </nav>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="bg-white p-14 text-center border border-[#b7c1d4] text-slate-600 text-xs">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-3 text-[#203c88]" />
          <p className="font-semibold text-sm text-[#203c88]">Auditing Police Registers & Compiling Crime SITREP...</p>
          <p className="text-slate-500 mt-1">Cross-referencing verified arrest logs, recoveries, and disposal dates.</p>
        </div>
      ) : (
        <>
          {loadErrors[activeTab] && (
            <div role="alert" className="bg-rose-50 border border-rose-300 p-4 text-sm text-rose-900 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">{loadErrors[activeTab]}</p>
                <button
                  type="button"
                  className="mt-2 text-xs font-bold text-rose-800 underline hover:text-rose-950"
                  onClick={() => void loadData()}
                >
                  Retry live database audit
                </button>
              </div>
            </div>
          )}

          {activeTab === "CrimeSITREP_District" && sitrepData && (
            <CrimeSitrepView
              data={sitrepData}
              onGenerateAndSave={handleGenerateAndSaveSITREP}
              onSaveReport={(updated) => setSitrepData(updated)}
              onNavigateToSaved={() => handleTabChange("Saved Reports")}
            />
          )}

          {activeTab === "WEEKLY CRIME DIARY" && weeklyData && (
            <WeeklyCrimeDiaryView data={weeklyData} />
          )}

          {activeTab === "IGP Meeting Presentation" && igpData && (
            <IgpPresentationView data={igpData} />
          )}

          {activeTab === "Saved Reports" && (
            <SavedReportsView onLoadSitrepReport={handleLoadSavedSitrep} />
          )}
        </>
      )}
    </div>
  );
}

export default function ReportsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-xs text-slate-500 text-center font-mono">INITIALIZING POLICE REPORT CONSOLE...</div>}>
      <ReportsContent />
    </Suspense>
  );
}
