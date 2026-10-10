"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { MobileHeader } from "./MobileHeader";
import { MobileBottomNav } from "./MobileBottomNav";
import { RoleSwitcherModal } from "./RoleSwitcherModal";
import { TopBarDictation } from "./TopBarDictation";
import { TopBarModuleSwitcher } from "./TopBarModuleSwitcher";
import { useAuth } from "@/context/AuthContext";
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

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { currentUser, isAuthenticated } = useAuth();
  const [roleModalOpen, setRoleModalOpen] = useState(false);

  // If on login page or unauthenticated, render without shell
  if (!isAuthenticated) {
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
    <div className="min-h-screen bg-[#fafafb] flex flex-col lg:flex-row antialiased text-slate-800">
      {/* Desktop Collapsible Hover Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen pb-20 lg:pb-8">
        {/* Mobile Header */}
        <MobileHeader />

        {/* Desktop Top Header Bar - Minimalist, clean backdrop-blur */}
        <header className="hidden lg:flex items-center justify-between h-13 px-6 bg-white/95 backdrop-blur-sm border-b border-slate-200/80 sticky top-0 z-45">
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
            {/* Universal Police Dictation (Hindi & English Voice Input) */}
            <TopBarDictation />

            {isComplaints && canRegisterComplaint && (
              <Link href="/complaints/register">
                <Button size="sm" variant="primary" className="gap-1.5 text-xs">
                  <PlusCircle className="w-3.5 h-3.5" />
                  Register Complaint
                </Button>
              </Link>
            )}

            {isFir && canRegisterFir && (
              <Link href="/fir/register">
                <Button size="sm" variant="primary" className="gap-1.5 text-xs">
                  <PlusCircle className="w-3.5 h-3.5" />
                  Register FIR
                </Button>
              </Link>
            )}

            {/* Role Switcher Pill */}
            <button
              onClick={() => setRoleModalOpen(true)}
              className="flex items-center gap-2 px-2.5 py-1 rounded-lg border border-slate-200/80 bg-white hover:bg-slate-50 transition-colors text-left"
              title="Click to switch persona"
            >
              <div className="w-5.5 h-5.5 rounded-md bg-slate-900 text-white flex items-center justify-center font-medium text-[10px]">
                {currentUser.name.slice(0, 1)}
              </div>
              <div className="hidden xl:block">
                <p className="text-xs font-medium text-slate-900 leading-tight">{currentUser.name}</p>
                <p className="text-[10px] text-slate-500">{currentUser.roleDisplay}</p>
              </div>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 sm:p-6 max-w-6xl w-full mx-auto">{children}</main>

        {/* Mobile Bottom Navigation */}
        <MobileBottomNav />
      </div>

      {/* Role Switcher Modal */}
      <RoleSwitcherModal isOpen={roleModalOpen} onClose={() => setRoleModalOpen(false)} />
    </div>
  );
}
