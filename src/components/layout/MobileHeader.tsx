"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield, Bell, Menu, X, UserCog, BookOpen, FileText, ChevronDown, ArrowLeft, LayoutGrid, PlusCircle, Scale, ClipboardList, FileBarChart, FileCheck2, BookmarkCheck, ReceiptText } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { TopBarDictation } from "./TopBarDictation";
import { TopBarModuleSwitcher } from "./TopBarModuleSwitcher";
import { TopBarNotifications } from "./TopBarNotifications";
import { TopBarLanguageSwitcher } from "./TopBarLanguageSwitcher";
import { TopBarPersonaSwitcher } from "./TopBarPersonaSwitcher";
import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";

export function MobileHeader() {
  const pathname = usePathname();
  const { currentUser, logout } = useAuth();
  const { t } = useLanguage();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isRoznamcha = pathname.startsWith("/general-diary");
  const isFir = pathname.startsWith("/fir") || pathname.startsWith("/fir-workspace");
  const isComplaints = !isFir && (pathname.startsWith("/complaints") || pathname.startsWith("/enquiry-workspace"));
  const isRegistrations = pathname.startsWith("/registrations");
  const isReports = pathname.startsWith("/reports");
  const isProsecution = pathname.startsWith("/prosecution");

  const isMhc = currentUser?.role === "MHC_GD_INCHARGE" || currentUser?.role === "DUTY_OFFICER";
  const isSho = currentUser?.role === "SHO" || currentUser?.id === "usr_sho_1";
  const isSuperior = currentUser?.role === "DSP_SUBDIV" || currentUser?.role === "SP_DISTRICT" || currentUser?.role === "SUPER_ADMIN";
  const canRegisterComplaint = isMhc || isSho || isSuperior;
  const canRegisterFir = isMhc || isSho || isSuperior;

  return (
    <>
      <header className="lg:hidden sticky top-0 z-45 bg-white/95 backdrop-blur-sm border-b border-slate-200/80 text-slate-900 shadow-2xs">
        {/* Main Bar */}
        <div className="px-3.5 py-2 flex items-center justify-between">
          {/* Police Crest & Station Title */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-md bg-slate-900 flex items-center justify-center text-white shrink-0">
              <Shield className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-medium text-slate-500 tracking-wider uppercase">
                  {isRoznamcha ? t("Roznamcha GD") : isFir ? t("FIR Module") : isComplaints ? t("Complaints") : isRegistrations ? t("Registrations") : isReports ? t("Reports") : isProsecution ? t("Prosecution") : "HP CMS"}
                </span>
                <span className="text-[10px] bg-slate-100 text-slate-500 px-1 rounded border border-slate-200/60 font-mono">
                  {currentUser.rank.slice(0, 3)}
                </span>
              </div>
              <h2 className="text-xs font-semibold text-slate-900 truncate max-w-[150px] xs:max-w-[190px]">
                {currentUser.stationName}
              </h2>
            </div>
          </div>

          {/* Action Controls */}
          <div className="flex items-center gap-1.5">
            {/* Officer Notifications Bell */}
            <TopBarNotifications isMobile={true} />

            {/* Switch Module Icon for Mobile */}
            <TopBarModuleSwitcher isMobile={true} />

            {/* Universal Dictation for Mobile */}
            <TopBarDictation isMobile={true} />

            {/* Bilingual Instant Language Switcher (Hindi / English) */}
            <TopBarLanguageSwitcher isMobile={true} />

            {/* Role Switcher Dropdown */}
            <TopBarPersonaSwitcher isMobile={true} />

            {/* Drawer menu trigger */}
            <button
              onClick={() => setDrawerOpen(!drawerOpen)}
              aria-label="Toggle menu"
              className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600 active:scale-95"
            >
              {drawerOpen ? <X className="w-5 h-5 text-slate-900" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="relative w-4/5 max-w-xs bg-white h-full text-slate-800 flex flex-col shadow-xl z-10 border-r border-slate-200">
            <div className="p-3.5 border-b border-slate-200/80 bg-slate-50/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-slate-900 flex items-center justify-center text-white">
                  <Shield className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-slate-900">{t("Haryana Police CMS")}</h3>
                  <p className="text-[10px] text-slate-400">{currentUser.stationName}</p>
                </div>
              </div>
              <button onClick={() => setDrawerOpen(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 border-b border-slate-200/80 bg-white">
              <p className="text-xs font-semibold text-slate-900">{currentUser.name}</p>
              <p className="text-[11px] text-slate-600">{t(currentUser.roleDisplay)}</p>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">PNO: {currentUser.pno}</p>
            </div>

            {/* Back to Module Selector Button in Drawer */}
            <div className="p-2.5 bg-slate-50/60 border-b border-slate-200/80">
              <Link
                href="/"
                onClick={() => setDrawerOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-1.5 px-3 rounded-md bg-white hover:bg-slate-100 text-slate-800 text-xs font-medium border border-slate-200/80 transition-colors"
              >
                <LayoutGrid className="w-3.5 h-3.5 text-slate-600" />
                <span>&larr; {t("Modules Portal")}</span>
              </Link>
            </div>

            <nav className="flex-1 overflow-y-auto p-3 space-y-1">
              {isRoznamcha ? (
                <>
                  <div className="pt-1 pb-1 text-[10px] uppercase font-semibold text-slate-400">
                    {t("Roznamcha GD")}
                  </div>
                  <Link
                    href="/general-diary"
                    onClick={() => setDrawerOpen(false)}
                    className="block px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-100"
                  >
                    {t("Smart General Diary")}
                  </Link>
                  <Link
                    href="/general-diary/new"
                    onClick={() => setDrawerOpen(false)}
                    className="block px-2.5 py-1.5 rounded-md text-xs font-semibold text-red-600 hover:bg-red-50"
                  >
                    + {t("New GD Entry")}
                  </Link>
                  <Link
                    href="/general-diary?tab=SUGGESTIONS_DRAFTS"
                    onClick={() => setDrawerOpen(false)}
                    className="block px-2.5 py-1.5 rounded-md text-xs font-medium text-purple-700 hover:bg-purple-50"
                  >
                    ✨ {t("Auto-Suggestions & Drafts")}
                  </Link>
                  <Link
                    href="/general-diary?type=SHIFT_RELIEF_TURNOVER"
                    onClick={() => setDrawerOpen(false)}
                    className="block px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-100"
                  >
                    {t("Shift Turnover")}
                  </Link>
                  <Link
                    href="/general-diary?type=PATROL_DEPARTURE_RETURN"
                    onClick={() => setDrawerOpen(false)}
                    className="block px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-100"
                  >
                    {t("Patrol & Night Domination")}
                  </Link>
                  <Link
                    href="/acts-sections"
                    onClick={() => setDrawerOpen(false)}
                    className="block px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-100"
                  >
                    {t("ACT and SECTIONs")}
                  </Link>
                </>
              ) : isComplaints ? (
                <>
                  <div className="pt-1 pb-1 text-[10px] uppercase font-semibold text-slate-400">
                    {t("Complaints")}
                  </div>
                  <Link
                    href="/complaints"
                    onClick={() => setDrawerOpen(false)}
                    className="block px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-100"
                  >
                    {t("Complaints Register")}
                  </Link>
                  {canRegisterComplaint && (
                    <Link
                      href="/complaints/register"
                      onClick={() => setDrawerOpen(false)}
                      className="block px-2.5 py-1.5 rounded-md text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-1.5"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      {t("Register Complaint")}
                    </Link>
                  )}
                  <Link
                    href="/enquiry-workspace"
                    onClick={() => setDrawerOpen(false)}
                    className="block px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-100"
                  >
                    {t("Field Enquiry Workspace")}
                  </Link>
                  <Link
                    href="/acts-sections"
                    onClick={() => setDrawerOpen(false)}
                    className="block px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-100"
                  >
                    {t("ACT and SECTIONs")}
                  </Link>
                </>
              ) : isFir ? (
                <>
                  <div className="pt-1 pb-1 text-[10px] uppercase font-semibold text-slate-400">
                    {t("FIR")}
                  </div>
                  <Link
                    href="/fir"
                    onClick={() => setDrawerOpen(false)}
                    className="block px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-100"
                  >
                    {t("FIR Register")}
                  </Link>
                  {canRegisterFir && (
                    <Link
                      href="/fir/register"
                      onClick={() => setDrawerOpen(false)}
                      className="block px-2.5 py-1.5 rounded-md text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-1.5"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      {t("Register FIR")}
                    </Link>
                  )}
                  <Link
                    href="/fir-workspace"
                    onClick={() => setDrawerOpen(false)}
                    className="block px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-100"
                  >
                    {t("Investigation Workspace")}
                  </Link>
                  <Link
                    href="/acts-sections"
                    onClick={() => setDrawerOpen(false)}
                    className="block px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-100"
                  >
                    {t("ACT and SECTIONs")}
                  </Link>
                </>
              ) : isRegistrations ? (
                <>
                  <div className="pt-1 pb-1 text-[10px] uppercase font-semibold text-slate-400">
                    {t("Registrations")}
                  </div>
                  <Link
                    href="/registrations"
                    onClick={() => setDrawerOpen(false)}
                    className="block px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-100"
                  >
                    {t("Registrations Register")}
                  </Link>
                  <Link
                    href="/acts-sections"
                    onClick={() => setDrawerOpen(false)}
                    className="block px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-100"
                  >
                    {t("ACT and SECTIONs")}
                  </Link>
                </>
              ) : isReports ? (
                <>
                  <div className="pt-1 pb-1 text-[10px] uppercase font-semibold text-slate-400">
                    {t("Reports")}
                  </div>
                  <Link
                    href="/reports?tab=crime_sitrep"
                    onClick={() => setDrawerOpen(false)}
                    className="block px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-100"
                  >
                    {t("CrimeSITREP_District")}
                  </Link>
                  <Link
                    href="/reports?tab=weekly_crime_diary"
                    onClick={() => setDrawerOpen(false)}
                    className="block px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-100"
                  >
                    {t("WEEKLY CRIME DIARY")}
                  </Link>
                  <Link
                    href="/reports?tab=igp_presentation"
                    onClick={() => setDrawerOpen(false)}
                    className="block px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-100"
                  >
                    {t("IGP Meeting Presentation")}
                  </Link>
                  <Link
                    href="/reports?tab=saved_reports"
                    onClick={() => setDrawerOpen(false)}
                    className="block px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-100"
                  >
                    {t("Saved Reports")}
                  </Link>
                </>
              ) : isProsecution ? (
                <>
                  <div className="pt-1 pb-1 text-[10px] uppercase font-semibold text-slate-400">
                    {t("Prosecution")}
                  </div>
                  <Link
                    href="/prosecution?tab=challan_scrutiny&subtab=scrutiny_perform"
                    onClick={() => setDrawerOpen(false)}
                    className="block px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-100"
                  >
                    {t("Challan Scrutiny")}
                  </Link>
                  <Link
                    href="/prosecution?tab=challan_scrutiny&subtab=common_malpractices"
                    onClick={() => setDrawerOpen(false)}
                    className="block px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-100"
                  >
                    {t("Common Malpractices")}
                  </Link>
                  <Link
                    href="/prosecution?tab=courts&subtab=bail_reply"
                    onClick={() => setDrawerOpen(false)}
                    className="block px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-100"
                  >
                    {t("Bail Reply")}
                  </Link>
                  <Link
                    href="/prosecution?tab=courts&subtab=status_report"
                    onClick={() => setDrawerOpen(false)}
                    className="block px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-100"
                  >
                    {t("Status Report")}
                  </Link>
                </>
              ) : (
                <>
                  <div className="pt-1 pb-1 text-[10px] uppercase font-semibold text-slate-400">
                    {t("Modules")}
                  </div>
                  <Link
                    href="/general-diary"
                    onClick={() => setDrawerOpen(false)}
                    className="block px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-100"
                  >
                    {t("Smart General Diary")}
                  </Link>
                  <Link
                    href="/complaints"
                    onClick={() => setDrawerOpen(false)}
                    className="block px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-100"
                  >
                    {t("Complaints Register")}
                  </Link>
                  <Link
                    href="/fir"
                    onClick={() => setDrawerOpen(false)}
                    className="block px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-100"
                  >
                    {t("FIR Register")}
                  </Link>
                  <Link
                    href="/registrations"
                    onClick={() => setDrawerOpen(false)}
                    className="block px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-100"
                  >
                    {t("Registrations")}
                  </Link>
                  <Link
                    href="/acts-sections"
                    onClick={() => setDrawerOpen(false)}
                    className="block px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-100"
                  >
                    {t("ACT and SECTIONs")}
                  </Link>
                  <Link
                    href="/tada"
                    onClick={() => setDrawerOpen(false)}
                    className="block px-2.5 py-1.5 rounded-md text-xs font-medium text-amber-800 bg-amber-50/60 hover:bg-amber-100"
                  >
                    {t("TA DA Form (यात्रा भत्ता प्रपत्र)")}
                  </Link>
                </>
              )}

              <div className="pt-2 border-t border-slate-200/80 my-2"></div>
              <button
                onClick={() => {
                  setDrawerOpen(false);
                  window.dispatchEvent(new CustomEvent("cms-open-role-switcher"));
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-100 flex items-center gap-2"
              >
                <UserCog className="w-3.5 h-3.5 text-slate-500" /> {t("Switch Police Role")}
              </button>
            </nav>

            <div className="p-3 border-t border-slate-200/80 bg-slate-50/60">
              <button
                onClick={() => {
                  setDrawerOpen(false);
                  logout();
                }}
                className="w-full flex items-center justify-center gap-2 py-1.5 rounded-md bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200/80 text-xs font-medium transition-colors"
              >
                {t("Sign Out")}
              </button>
            </div>
          </div>
        </div>
      )}

    </>
  );
}
