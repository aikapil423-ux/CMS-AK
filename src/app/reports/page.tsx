"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ReportTab, CrimeSitrepData, WeeklyCrimeDiaryData, IgpPresentationData } from "@/types/reports";
import { ReportsService } from "@/services/reportsService";
import { CrimeSitrepView } from "@/components/reports/CrimeSitrepView";
import { WeeklyCrimeDiaryView } from "@/components/reports/WeeklyCrimeDiaryView";
import { IgpPresentationView } from "@/components/reports/IgpPresentationView";
import { SavedReportsView } from "@/components/reports/SavedReportsView";
import { FileBarChart, RefreshCw, BookmarkCheck } from "lucide-react";
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
  const [loadErrors,setLoadErrors]=useState<Partial<Record<ReportTab,string>>>({});
  const loadGeneration=useRef(0);

  const loadData = async () => {
    const generation=++loadGeneration.current;
    setIsLoading(true);
    setLoadErrors({});
    try {
      const [sitrep, weekly, igp] = await Promise.allSettled([
        ReportsService.getCrimeSitrep(undefined,undefined,currentUser.district),
        ReportsService.getWeeklyCrimeDiary(currentUser.stationName,currentUser.district),
        ReportsService.getIgpPresentationData(currentUser.district),
      ]);
      if(generation!==loadGeneration.current)return;
      setSitrepData(sitrep.status==='fulfilled'?sitrep.value:null);
      setWeeklyData(weekly.status==='fulfilled'?weekly.value:null);
      setIgpData(igp.status==='fulfilled'?igp.value:null);
      const errors:Partial<Record<ReportTab,string>>={};
      for(const [tab,result] of [['CrimeSITREP_District',sitrep],['WEEKLY CRIME DIARY',weekly],['IGP Meeting Presentation',igp]] as const){
        if(result.status==='rejected'){
          console.error(`Failed to load ${tab}`,result.reason);
          errors[tab]='Report load नहीं हो सकी। Connection/data service check करके Retry करें।';
        }
      }
      setLoadErrors(errors);
    } catch (e) {
      console.error("Failed to load reports data", e);
      if(generation===loadGeneration.current)setLoadErrors({'CrimeSITREP_District':'Reports could not be loaded. Please retry.','WEEKLY CRIME DIARY':'Reports could not be loaded. Please retry.','IGP Meeting Presentation':'Reports could not be loaded. Please retry.'});
    } finally {
      if(generation===loadGeneration.current)setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    return ()=>{loadGeneration.current++;};
  }, [currentUser.district,currentUser.stationName]);

  const handleAuditLive = async () => {
    setIsAuditing(true);
    await loadData();
    setTimeout(() => setIsAuditing(false), 500);
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
    <div className="space-y-4 pb-12 animate-in fade-in-50">
      {/* Minimalist Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold shadow-xs">
            <FileBarChart className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
              {isHindi ? "अपराध एवं प्रशासनिक रिपोर्ट" : "Police Reports & Crime Audits"}
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              {sitrepData?.district || "Panipat"} • Haryana Police
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleAuditLive}
            disabled={isAuditing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 active:scale-95 transition-all"
            title="Audit and sync with live database"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isAuditing ? "animate-spin" : ""}`} />
            <span>{isAuditing ? "Auditing..." : "Audit Portal Data"}</span>
          </button>
        </div>
      </div>

      {/* 4 Sub-tabs exact naming including Saved Reports */}
      <div className="flex border-b border-slate-200 bg-white rounded-xl p-1 shadow-2xs gap-1 flex-wrap sm:flex-nowrap">
        <button
          onClick={() => handleTabChange("CrimeSITREP_District")}
          className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg transition-all text-center min-w-[150px] ${
            activeTab === "CrimeSITREP_District"
              ? "bg-[#0b192c] text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          CrimeSITREP_District
        </button>

        <button
          onClick={() => handleTabChange("WEEKLY CRIME DIARY")}
          className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg transition-all text-center min-w-[150px] ${
            activeTab === "WEEKLY CRIME DIARY"
              ? "bg-[#0b192c] text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          WEEKLY CRIME DIARY
        </button>

        <button
          onClick={() => handleTabChange("IGP Meeting Presentation")}
          className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg transition-all text-center min-w-[150px] ${
            activeTab === "IGP Meeting Presentation"
              ? "bg-[#0b192c] text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          IGP Meeting Presentation
        </button>

        <button
          onClick={() => handleTabChange("Saved Reports")}
          className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg transition-all text-center min-w-[150px] flex items-center justify-center gap-1.5 ${
            activeTab === "Saved Reports"
              ? "bg-[#0b192c] text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <BookmarkCheck className="w-3.5 h-3.5" />
          <span>Saved Reports</span>
        </button>
      </div>

      {/* Active Tab Content */}
      {isLoading ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-500 text-xs">
          <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-slate-400" />
          Loading reports and auditing database...
        </div>
      ) : (
        <>
          {loadErrors[activeTab] && <div role="alert" className="bg-red-50 border border-red-200 rounded-xl p-5 text-sm text-red-800">
            <p>{loadErrors[activeTab]}</p>
            <button type="button" className="mt-3 underline font-semibold" onClick={()=>void loadData()}>Retry report</button>
          </div>}
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
    <Suspense fallback={<div className="p-8 text-xs text-slate-400 text-center">Loading Reports...</div>}>
      <ReportsContent />
    </Suspense>
  );
}
