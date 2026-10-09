"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { MobileHeader } from "./MobileHeader";
import { MobileBottomNav } from "./MobileBottomNav";
import { RoleSwitcherModal } from "./RoleSwitcherModal";
import { useAuth } from "@/context/AuthContext";
import {
  PlusCircle,
  BookOpen,
  ChevronDown,
  Building,
  FileText,
  LayoutGrid,
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

  const isRoznamcha = pathname.startsWith("/general-diary");
  const isComplaints = pathname.startsWith("/complaints") || pathname.startsWith("/enquiry-workspace");

  // Only MHC, SHO, and Superior officers can register complaints (EOs cannot register complaints)
  const isMhc = currentUser?.role === "MHC_GD_INCHARGE" || currentUser?.role === "DUTY_OFFICER";
  const isSho = currentUser?.role === "SHO" || currentUser?.id === "usr_sho_1";
  const isSuperior = currentUser?.role === "DSP_SUBDIV" || currentUser?.role === "SP_DISTRICT" || currentUser?.role === "SUPER_ADMIN";
  const canRegisterComplaint = isMhc || isSho || isSuperior;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row antialiased text-slate-800">
      {/* Desktop Collapsible Hover Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen pb-20 lg:pb-8">
        {/* Mobile Header */}
        <MobileHeader />

        {/* Desktop Top Header Bar - Clean White with Blue accents */}
        <header className="hidden lg:flex items-center justify-between h-14 px-6 bg-white border-b border-slate-200 shadow-2xs sticky top-0 z-30">
          {/* Left: Station & Active Module Indicator */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-slate-700">
              <Building className="w-4 h-4 text-blue-600" />
              <span className="font-bold text-xs tracking-tight text-slate-900">
                {currentUser.stationName}
              </span>
              <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200 font-medium">
                {currentUser.district}
              </span>
            </div>
            <div className="h-3.5 w-px bg-slate-200"></div>

            {/* Active Module State Chip */}
            {isRoznamcha ? (
              <span className="inline-flex items-center gap-1.5 text-xs text-blue-800 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200 font-semibold">
                <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                Roznamcha GD Active
              </span>
            ) : isComplaints ? (
              <span className="inline-flex items-center gap-1.5 text-xs text-blue-800 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200 font-semibold">
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                Complaints Active
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                <LayoutGrid className="w-3.5 h-3.5 text-blue-600" />
                Police Module Gateway
              </span>
            )}
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-2.5">
            {/* Quick Action Button strictly scoped */}

            {isComplaints && canRegisterComplaint && (
              <Link href="/complaints/register">
                <Button size="sm" variant="danger" className="gap-1.5 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white cursor-pointer shadow-xs">
                  <PlusCircle className="w-3.5 h-3.5" />
                  Register Complaint
                </Button>
              </Link>
            )}

            {/* Role Switcher Pill for reviewer testing */}
            <button
              onClick={() => setRoleModalOpen(true)}
              className="flex items-center gap-2 px-2.5 py-1 rounded-md border border-slate-200 bg-slate-50 hover:bg-blue-50 transition-colors text-left"
              title="Click to switch persona"
            >
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[11px]">
                {currentUser.name.slice(0, 1)}
              </div>
              <div className="hidden xl:block">
                <p className="text-xs font-bold text-slate-800 leading-tight">{currentUser.name}</p>
                <p className="text-[10px] text-blue-700 font-medium">{currentUser.roleDisplay}</p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
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
