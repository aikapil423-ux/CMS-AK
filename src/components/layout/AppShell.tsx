"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { useGuardedRouter as useRouter } from "@/hooks/useGuardedRouter";
import { Sidebar } from "./Sidebar";
import { MobileHeader } from "./MobileHeader";
import { MobileBottomNav } from "./MobileBottomNav";
import { TopBarDictation } from "./TopBarDictation";
import { TopBarModuleSwitcher } from "./TopBarModuleSwitcher";
import { TopBarNotifications } from "./TopBarNotifications";
import { TopBarLanguageSwitcher } from "./TopBarLanguageSwitcher";
import { TopBarPersonaSwitcher } from "./TopBarPersonaSwitcher";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import {
  PlusCircle,
  BookOpen,
  ChevronDown,
  Building,
  FileText,
  LayoutGrid,
  Scale,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DraggableAgentButton } from "@/components/agent/DraggableAgentButton";
import { GlobalUploadCameraModal } from "@/components/ui/camera-capture-button";
import { FirPersistenceStatus } from "@/components/fir/FirPersistenceStatus";


export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { currentUser, isAuthenticated } = useAuth();
  const { t } = useLanguage();

  const router = useRouter();
  const [complaintSaveError,setComplaintSaveError]=useState('');
  React.useEffect(()=>{const failure=(e:Event)=>setComplaintSaveError(String((e as CustomEvent).detail));window.addEventListener('complaints_save_error',failure);window.addEventListener('complaints_cache_warning',failure);return()=>{window.removeEventListener('complaints_save_error',failure);window.removeEventListener('complaints_cache_warning',failure);};},[]);


  // If unauthenticated and not on /login, redirect to /login
  React.useEffect(() => {
    if (!isAuthenticated && pathname !== "/login") {
      router.replace("/login");
    }
  }, [isAuthenticated, pathname, router]);

  // If on login page or unauthenticated, render without shell
  if (!isAuthenticated && pathname !== "/login") return null;
  if (pathname === "/login") {
    return <>{children}</>;
  }

  const isFir = pathname.startsWith("/fir") || pathname.startsWith("/fir-workspace");
  const isComplaints = !isFir && (pathname.startsWith("/complaints") || pathname.startsWith("/enquiry-workspace"));

  // Only MHC, SHO, and Superior officers can register complaints/FIR (EOs cannot register complaints or FIR)
  const isMhc = currentUser?.role === "MHC_GD_INCHARGE" || currentUser?.role === "DUTY_OFFICER";
  const isSho = currentUser?.role === "SHO" || currentUser?.id === "usr_sho_1";
  const isSuperior = currentUser?.role === "DSP_SUBDIV" || currentUser?.role === "SP_DISTRICT" || currentUser?.role === "SUPER_ADMIN";
  const canRegisterComplaint = isMhc || isSho || isSuperior;
  const canRegisterFir = isMhc || isSho || isSuperior;

  return (
    <div className="cms-shell min-h-screen bg-white flex flex-col lg:flex-row antialiased text-slate-800">
      {complaintSaveError&&<div role="alert" className="fixed top-3 left-3 right-3 z-[150] bg-amber-50 text-amber-950 border border-amber-400 rounded-lg p-3 text-sm shadow-lg">{complaintSaveError}<button className="ml-4 underline" onClick={()=>setComplaintSaveError('')}>Dismiss</button></div>}
      {/* Desktop Collapsible Hover Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen pb-20 lg:pb-8">
        <FirPersistenceStatus />
        {/* Mobile Header */}
        <MobileHeader />

        {/* Desktop Top Header Bar - Minimalist, clean backdrop-blur */}
        <header className="cms-topbar hidden lg:flex items-center justify-between min-h-16 px-6 bg-[#203c88] text-white border-b border-[#203c88] sticky top-0 z-45">
          {/* Left: Station & Active Module Indicator */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-slate-700">
              <Building className="w-3.5 h-3.5 text-slate-500" />
              <span className="font-semibold text-xs text-slate-900 tracking-tight">
                {currentUser.stationName}
              </span>
              <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200/60 font-medium">
                {currentUser.district}
              </span>
            </div>
            <div className="h-3 w-px bg-slate-200/80"></div>

            {/* Switch Module Dropdown with LayoutGrid Icon */}
            <TopBarModuleSwitcher />
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-2.5">
            {/* Officer Notifications Bell Icon */}
            <TopBarNotifications />

            {/* In FIR Module (e.g. /fir Register Page), Red Register FIR Button right after Bell icon */}
            {isFir && pathname !== "/fir/register" && canRegisterFir && (
              <Link href="/fir/register">
                <Button size="sm" className="gap-1.5 text-xs bg-red-600 hover:bg-red-700 text-white font-bold shadow-xs">
                  <PlusCircle className="w-3.5 h-3.5" />
                  {t("Register FIR")}
                </Button>
              </Link>
            )}

            {/* Universal Police Dictation (Hindi & English Voice Input) */}
            <TopBarDictation />

            {/* Bilingual Instant Language Switcher (Hindi / English) */}
            <TopBarLanguageSwitcher />

            {isComplaints && canRegisterComplaint && (
              <Link href="/complaints/register">
                <Button size="sm" className="gap-1.5 text-xs bg-red-600 hover:bg-red-700 text-white shadow-xs">
                  <PlusCircle className="w-3.5 h-3.5" />
                  {t("Register Complaint")}
                </Button>
              </Link>
            )}


            {/* Police Persona Switcher Icon with Dropdown */}
            <TopBarPersonaSwitcher />
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="cms-main flex-1 p-3 sm:p-6 w-full mx-auto min-w-0">{children}</main>

        {/* Mobile Bottom Navigation */}
        <MobileBottomNav />
      </div>

      {/* Floating Draggable CMS AI Agent */}
      <DraggableAgentButton />

      {/* Universal Camera & File Upload Option Selector */}
      <GlobalUploadCameraModal />



    </div>
  );
}
