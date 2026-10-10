"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield, Bell, Menu, X, UserCog, BookOpen, FileText, ChevronDown, ArrowLeft, LayoutGrid } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { RoleSwitcherModal } from "./RoleSwitcherModal";
import { TopBarDictation } from "./TopBarDictation";
import { cn } from "@/lib/utils";

export function MobileHeader() {
  const pathname = usePathname();
  const { currentUser, logout } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [roleModalOpen, setRoleModalOpen] = useState(false);

  const isRoznamcha = pathname.startsWith("/general-diary");
  const isFir = pathname.startsWith("/fir") || pathname.startsWith("/fir-workspace");
  const isComplaints = !isFir && (pathname.startsWith("/complaints") || pathname.startsWith("/enquiry-workspace"));

  return (
    <>
      <header className="lg:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200/80 text-slate-900 shadow-2xs">
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
                  {isRoznamcha ? "Roznamcha GD" : isFir ? "FIR Module" : isComplaints ? "Complaints" : "HP CMS"}
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
            {/* Universal Dictation for Mobile */}
            <TopBarDictation isMobile={true} />

            {/* Role Switcher Pill */}
            <button
              onClick={() => setRoleModalOpen(true)}
              className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200/80 px-2 py-1 rounded-md text-[11px] font-medium text-slate-700 border border-slate-200/70"
              title="Switch Police Role"
            >
              <UserCog className="w-3.5 h-3.5 text-slate-600" />
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

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
                  <h3 className="text-xs font-semibold text-slate-900">Haryana Police CMS</h3>
                  <p className="text-[10px] text-slate-400">{currentUser.stationName}</p>
                </div>
              </div>
              <button onClick={() => setDrawerOpen(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 border-b border-slate-200/80 bg-white">
              <p className="text-xs font-semibold text-slate-900">{currentUser.name}</p>
              <p className="text-[11px] text-slate-600">{currentUser.roleDisplay}</p>
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
                <span>&larr; Modules Portal</span>
              </Link>
            </div>

            <nav className="flex-1 overflow-y-auto p-3 space-y-1">
              {isRoznamcha ? (
                <>
                  <div className="pt-1 pb-1 text-[10px] uppercase font-semibold text-slate-400">
                    Roznamcha GD
                  </div>
                  <Link
                    href="/general-diary"
                    onClick={() => setDrawerOpen(false)}
                    className="block px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-100"
                  >
                    Smart General Diary
                  </Link>
                  <Link
                    href="/general-diary/new"
                    onClick={() => setDrawerOpen(false)}
                    className="block px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-100"
                  >
                    New GD Entry
                  </Link>
                  <Link
                    href="/general-diary?type=SHIFT_RELIEF_TURNOVER"
                    onClick={() => setDrawerOpen(false)}
                    className="block px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-100"
                  >
                    Shift & Sentry Turnover
                  </Link>
                  <Link
                    href="/general-diary?type=PATROL_DEPARTURE_RETURN"
                    onClick={() => setDrawerOpen(false)}
                    className="block px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-100"
                  >
                    Patrol & Night Domination
                  </Link>
                  <Link
                    href="/general-diary?type=SEIZURE_MUDDMAL"
                    onClick={() => setDrawerOpen(false)}
                    className="block px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-100"
                  >
                    Malkhana & Property Seizures
                  </Link>
                </>
              ) : isComplaints ? (
                <>
                  <div className="pt-1 pb-1 text-[10px] uppercase font-semibold text-slate-400">
                    Complaints
                  </div>
                  <Link
                    href="/complaints"
                    onClick={() => setDrawerOpen(false)}
                    className="block px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-100"
                  >
                    Complaints Register
                  </Link>
                  <Link
                    href="/enquiry-workspace"
                    onClick={() => setDrawerOpen(false)}
                    className="block px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-100"
                  >
                    Field Enquiry Workspace
                  </Link>
                </>
              ) : isFir ? (
                <>
                  <div className="pt-1 pb-1 text-[10px] uppercase font-semibold text-slate-400">
                    FIR
                  </div>
                  <Link
                    href="/fir"
                    onClick={() => setDrawerOpen(false)}
                    className="block px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-100"
                  >
                    FIR Register
                  </Link>
                  <Link
                    href="/fir-workspace"
                    onClick={() => setDrawerOpen(false)}
                    className="block px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-100"
                  >
                    Investigation Workspace
                  </Link>
                </>
              ) : (
                <>
                  <div className="pt-1 pb-1 text-[10px] uppercase font-semibold text-slate-400">
                    Operations
                  </div>
                  <Link
                    href="/general-diary"
                    onClick={() => setDrawerOpen(false)}
                    className="block px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-100"
                  >
                    Smart General Diary
                  </Link>
                  <Link
                    href="/complaints"
                    onClick={() => setDrawerOpen(false)}
                    className="block px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-100"
                  >
                    Complaints Register
                  </Link>
                  <Link
                    href="/fir"
                    onClick={() => setDrawerOpen(false)}
                    className="block px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-100"
                  >
                    FIR Register
                  </Link>
                  <Link
                    href="/acts-sections"
                    onClick={() => setDrawerOpen(false)}
                    className="block px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-100"
                  >
                    ACT and SECTIONs
                  </Link>
                </>
              )}

              <div className="pt-2 border-t border-slate-200/80 my-2"></div>
              <button
                onClick={() => {
                  setDrawerOpen(false);
                  setRoleModalOpen(true);
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-100 flex items-center gap-2"
              >
                <UserCog className="w-3.5 h-3.5 text-slate-500" /> Switch Police Role
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
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Role Switcher Modal */}
      <RoleSwitcherModal isOpen={roleModalOpen} onClose={() => setRoleModalOpen(false)} />
    </>
  );
}
