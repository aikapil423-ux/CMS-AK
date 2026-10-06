"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield, Bell, Menu, X, UserCog, BookOpen, FileText, ChevronDown, ArrowLeft, LayoutGrid } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { RoleSwitcherModal } from "./RoleSwitcherModal";
import { cn } from "@/lib/utils";

export function MobileHeader() {
  const pathname = usePathname();
  const { currentUser, logout } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [roleModalOpen, setRoleModalOpen] = useState(false);

  const isRoznamcha = pathname.startsWith("/general-diary");
  const isComplaints = pathname.startsWith("/complaints") || pathname.startsWith("/enquiry-workspace");

  return (
    <>
      <header className="lg:hidden sticky top-0 z-40 bg-[#081225] border-b border-slate-800 text-white shadow-md">
        {/* Main Bar */}
        <div className="px-3 py-2 flex items-center justify-between">
          {/* Police Crest & Station Title */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-md bg-[#b8001f] flex items-center justify-center text-white shrink-0 shadow-xs">
              <Shield className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-amber-400 tracking-wider uppercase">
                  {isRoznamcha ? "Roznamcha GD" : isComplaints ? "Complaints" : "HP CMS"}
                </span>
                <span className="text-[10px] bg-slate-800 text-slate-300 px-1 rounded font-mono">
                  {currentUser.rank.slice(0, 3)}
                </span>
              </div>
              <h2 className="text-xs font-bold text-white truncate max-w-[150px] xs:max-w-[190px]">
                {currentUser.stationName}
              </h2>
            </div>
          </div>

          {/* Action Controls */}
          <div className="flex items-center gap-1.5">
            {/* Role Switcher Pill */}
            <button
              onClick={() => setRoleModalOpen(true)}
              className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded-md text-[11px] font-medium text-slate-200 border border-slate-700 active:scale-95"
              title="Switch Police Role"
            >
              <UserCog className="w-3.5 h-3.5" />
              <ChevronDown className="w-3 h-3 opacity-70" />
            </button>

            {/* Drawer menu trigger */}
            <button
              onClick={() => setDrawerOpen(!drawerOpen)}
              aria-label="Toggle menu"
              className="p-1.5 rounded-md hover:bg-slate-800 text-slate-300 active:scale-95"
            >
              {drawerOpen ? <X className="w-5 h-5 text-amber-400" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="relative w-4/5 max-w-xs bg-[#081225] h-full text-white flex flex-col shadow-2xl z-10 border-r border-slate-800">
            <div className="p-4 border-b border-slate-800 bg-[#060e1d] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-md bg-[#b8001f] flex items-center justify-center text-white">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white">Haryana Police CMS</h3>
                  <p className="text-[10px] text-slate-400">{currentUser.stationName}</p>
                </div>
              </div>
              <button onClick={() => setDrawerOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 border-b border-slate-800/60 bg-[#0d1a30]">
              <p className="text-xs font-bold text-white">{currentUser.name}</p>
              <p className="text-[11px] text-amber-400 font-medium">{currentUser.roleDisplay}</p>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">PNO: {currentUser.pno}</p>
            </div>

            {/* Back to Module Selector Button in Drawer */}
            <div className="p-3 bg-[#0a1529] border-b border-slate-800">
              <Link
                href="/"
                onClick={() => setDrawerOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-[#1e3e62] text-amber-300 text-xs font-bold shadow-xs border border-amber-400/20"
              >
                <LayoutGrid className="w-4 h-4 text-amber-400" />
                <span>&larr; Switch Module Portal</span>
              </Link>
            </div>

            <nav className="flex-1 overflow-y-auto p-3 space-y-1">
              {isRoznamcha ? (
                /* ONLY ROZNAMCHA LINKS IN DRAWER */
                <>
                  <div className="pt-1 pb-1 text-[10px] uppercase font-bold text-amber-400">
                    Roznamcha GD Pages
                  </div>
                  <Link
                    href="/general-diary"
                    onClick={() => setDrawerOpen(false)}
                    className="block px-3 py-2 rounded-lg text-xs font-medium text-slate-200 hover:bg-[#1e3e62]"
                  >
                    Daily Roznamcha Aam
                  </Link>
                  <Link
                    href="/general-diary/new"
                    onClick={() => setDrawerOpen(false)}
                    className="block px-3 py-2 rounded-lg text-xs font-medium text-slate-200 hover:bg-[#1e3e62]"
                  >
                    New Roznamcha Entry
                  </Link>
                  <Link
                    href="/general-diary?type=SHIFT_RELIEF_TURNOVER"
                    onClick={() => setDrawerOpen(false)}
                    className="block px-3 py-2 rounded-lg text-xs font-medium text-slate-200 hover:bg-[#1e3e62]"
                  >
                    Shift & Sentry Turnover
                  </Link>
                  <Link
                    href="/general-diary?type=PATROL_DEPARTURE_RETURN"
                    onClick={() => setDrawerOpen(false)}
                    className="block px-3 py-2 rounded-lg text-xs font-medium text-slate-200 hover:bg-[#1e3e62]"
                  >
                    Patrol & Night Domination
                  </Link>
                  <Link
                    href="/general-diary?type=SEIZURE_MUDDMAL"
                    onClick={() => setDrawerOpen(false)}
                    className="block px-3 py-2 rounded-lg text-xs font-medium text-slate-200 hover:bg-[#1e3e62]"
                  >
                    Malkhana & Property Seizures
                  </Link>
                </>
              ) : isComplaints ? (
                /* ONLY COMPLAINT LINKS IN DRAWER */
                <>
                  <div className="pt-1 pb-1 text-[10px] uppercase font-bold text-red-400">
                    Complaint Management Pages
                  </div>
                  <Link
                    href="/complaints"
                    onClick={() => setDrawerOpen(false)}
                    className="block px-3 py-2 rounded-lg text-xs font-medium text-slate-200 hover:bg-[#1e3e62]"
                  >
                    Complaints Register
                  </Link>
                  <Link
                    href="/enquiry-workspace"
                    onClick={() => setDrawerOpen(false)}
                    className="block px-3 py-2 rounded-lg text-xs font-medium text-slate-200 hover:bg-[#1e3e62]"
                  >
                    Field Enquiry Workspace
                  </Link>
                </>
              ) : (
                /* STATION INFO / GENERAL PAGES IN DRAWER - Show only the active module */
                <>
                  {typeof window !== "undefined" && window.localStorage.getItem("cms_active_module") === "ROZNAMCHA" ? (
                    <>
                      <div className="pt-1 pb-1 text-[10px] uppercase font-bold text-amber-400">
                        Roznamcha GD
                      </div>
                      <Link
                        href="/general-diary"
                        onClick={() => setDrawerOpen(false)}
                        className="block px-3 py-2 rounded-lg text-xs font-medium text-slate-200 hover:bg-[#1e3e62]"
                      >
                        Daily Roznamcha Aam
                      </Link>
                      <Link
                        href="/general-diary/new"
                        onClick={() => setDrawerOpen(false)}
                        className="block px-3 py-2 rounded-lg text-xs font-medium text-slate-200 hover:bg-[#1e3e62]"
                      >
                        New Roznamcha Entry
                      </Link>
                    </>
                  ) : (
                    <>
                      <div className="pt-1 pb-1 text-[10px] uppercase font-bold text-red-400">
                        Complaints
                      </div>
                      <Link
                        href="/complaints"
                        onClick={() => setDrawerOpen(false)}
                        className="block px-3 py-2 rounded-lg text-xs font-medium text-slate-200 hover:bg-[#1e3e62]"
                      >
                        Complaints Register
                      </Link>
                      <Link
                        href="/enquiry-workspace"
                        onClick={() => setDrawerOpen(false)}
                        className="block px-3 py-2 rounded-lg text-xs font-medium text-slate-200 hover:bg-[#1e3e62]"
                      >
                        Field Enquiry Workspace
                      </Link>
                    </>
                  )}

                  <div className="pt-2 pb-1 text-[10px] uppercase font-bold text-emerald-400">
                    Legal Reference
                  </div>
                  <Link
                    href="/acts-sections"
                    onClick={() => setDrawerOpen(false)}
                    className="block px-3 py-2 rounded-lg text-xs font-semibold text-emerald-300 hover:bg-[#1e3e62] flex items-center justify-between"
                  >
                    <span>ACT and SECTIONs</span>
                    <span className="text-[10px] bg-emerald-900/60 text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-500/30">Bare Acts</span>
                  </Link>
                </>
              )}

              <div className="pt-2 border-t border-slate-800 my-2"></div>
              <button
                onClick={() => {
                  setDrawerOpen(false);
                  setRoleModalOpen(true);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800 flex items-center gap-2"
              >
                <UserCog className="w-4 h-4 text-amber-400" /> Switch Police Role
              </button>
            </nav>

            <div className="p-3 border-t border-slate-800 bg-[#060e1d]">
              <button
                onClick={() => {
                  setDrawerOpen(false);
                  logout();
                }}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-red-950/60 text-red-300 border border-red-800/40 text-xs font-semibold"
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
