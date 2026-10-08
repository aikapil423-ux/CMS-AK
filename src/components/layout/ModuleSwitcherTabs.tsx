"use client";

import React from "react";
import { BookOpen, FileText, ChevronRight, Scale } from "lucide-react";
import { useModule, PoliceModule } from "@/context/ModuleContext";
import { cn } from "@/lib/utils";

interface ModuleSwitcherTabsProps {
  className?: string;
  variant?: "header" | "dashboard" | "sidebar";
}

export function ModuleSwitcherTabs({ className, variant = "header" }: ModuleSwitcherTabsProps) {
  const { activeModule, switchToModule } = useModule();

  if (variant === "dashboard") {
    return (
      <div className={cn("grid grid-cols-1 md:grid-cols-3 gap-3.5", className)}>
        {/* Roznamcha GD Primary Tab Card */}
        <button
          onClick={() => switchToModule("ROZNAMCHA")}
          type="button"
          className={cn(
            "text-left p-4 sm:p-5 rounded-2xl border-2 transition-all relative overflow-hidden group shadow-xs",
            activeModule === "ROZNAMCHA"
              ? "bg-gradient-to-br from-[#081225] to-[#122844] text-white border-amber-400 shadow-md ring-2 ring-amber-400/20"
              : "bg-white text-slate-800 border-slate-200 hover:border-slate-300 hover:bg-slate-50/80"
          )}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg transition-transform group-hover:scale-105",
                  activeModule === "ROZNAMCHA"
                    ? "bg-amber-400 text-slate-950 shadow-md"
                    : "bg-blue-50 text-[#0b192c]"
                )}
              >
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full",
                      activeModule === "ROZNAMCHA"
                        ? "bg-amber-400/20 text-amber-300 border border-amber-400/30"
                        : "bg-slate-100 text-slate-600"
                    )}
                  >
                    Punjab Police Rules Ch. XXII
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-black tracking-tight mt-1">
                  Roznamcha GD (General Diary)
                </h3>
              </div>
            </div>
            <ChevronRight
              className={cn(
                "w-5 h-5 transition-transform group-hover:translate-x-1",
                activeModule === "ROZNAMCHA" ? "text-amber-400" : "text-slate-400"
              )}
            />
          </div>

          <p
            className={cn(
              "text-xs mt-3 leading-relaxed",
              activeModule === "ROZNAMCHA" ? "text-slate-300" : "text-slate-600"
            )}
          >
            24-Hour continuous legal record of police station occurrences, shift turnovers, officer departures/arrivals, and patrol movements.
          </p>

          <div className="mt-4 pt-3 border-t border-slate-200/20 flex items-center justify-between text-xs">
            <span
              className={cn(
                "font-semibold",
                activeModule === "ROZNAMCHA" ? "text-amber-300" : "text-[#0b192c]"
              )}
            >
              Open Roznamcha Register &rarr;
            </span>
            <span
              className={cn(
                "font-mono text-[11px] px-2 py-0.5 rounded",
                activeModule === "ROZNAMCHA"
                  ? "bg-slate-900/80 text-emerald-400"
                  : "bg-emerald-50 text-emerald-700 font-semibold"
              )}
            >
              Tamper-Evident Active
            </span>
          </div>
        </button>

        {/* Complaint Management Primary Tab Card */}
        <button
          onClick={() => switchToModule("COMPLAINTS")}
          type="button"
          className={cn(
            "text-left p-4 sm:p-5 rounded-2xl border-2 transition-all relative overflow-hidden group shadow-xs",
            activeModule === "COMPLAINTS"
              ? "bg-gradient-to-br from-[#081225] to-[#122844] text-white border-amber-400 shadow-md ring-2 ring-amber-400/20"
              : "bg-white text-slate-800 border-slate-200 hover:border-slate-300 hover:bg-slate-50/80"
          )}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg transition-transform group-hover:scale-105",
                  activeModule === "COMPLAINTS"
                    ? "bg-[#b8001f] text-white shadow-md"
                    : "bg-red-50 text-[#b8001f]"
                )}
              >
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full",
                      activeModule === "COMPLAINTS"
                        ? "bg-red-500/20 text-red-200 border border-red-400/30"
                        : "bg-slate-100 text-slate-600"
                    )}
                  >
                    Intake & Field Verification
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-black tracking-tight mt-1">
                  Complaint Management
                </h3>
              </div>
            </div>
            <ChevronRight
              className={cn(
                "w-5 h-5 transition-transform group-hover:translate-x-1",
                activeModule === "COMPLAINTS" ? "text-amber-400" : "text-slate-400"
              )}
            />
          </div>

          <p
            className={cn(
              "text-xs mt-3 leading-relaxed",
              activeModule === "COMPLAINTS" ? "text-slate-300" : "text-slate-600"
            )}
          >
            Walk-in & CM Window complaints intake, EO assignment, enquiry workspace, witness statements, approval pipeline, and disposal.
          </p>

          <div className="mt-4 pt-3 border-t border-slate-200/20 flex items-center justify-between text-xs">
            <span
              className={cn(
                "font-semibold",
                activeModule === "COMPLAINTS" ? "text-amber-300" : "text-[#b8001f]"
              )}
            >
              Open Complaints Workspace &rarr;
            </span>
            <span
              className={cn(
                "font-mono text-[11px] px-2 py-0.5 rounded",
                activeModule === "COMPLAINTS"
                  ? "bg-slate-900/80 text-amber-300"
                  : "bg-amber-50 text-amber-800 font-semibold"
              )}
            >
              Active Enquiries
            </span>
          </div>
        </button>

        {/* FIR Management Primary Tab Card */}
        <button
          onClick={() => switchToModule("FIR")}
          type="button"
          className={cn(
            "text-left p-4 sm:p-5 rounded-2xl border-2 transition-all relative overflow-hidden group shadow-xs sm:col-span-2",
            activeModule === "FIR"
              ? "bg-gradient-to-br from-[#081225] to-[#122844] text-white border-amber-400 shadow-md ring-2 ring-amber-400/20"
              : "bg-white text-slate-800 border-slate-200 hover:border-slate-300 hover:bg-slate-50/80"
          )}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg transition-transform group-hover:scale-105",
                  activeModule === "FIR"
                    ? "bg-red-600 text-white shadow-md"
                    : "bg-red-50 text-red-700"
                )}
              >
                <Scale className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full",
                      activeModule === "FIR"
                        ? "bg-red-500/20 text-red-200 border border-red-400/30"
                        : "bg-slate-100 text-slate-600"
                    )}
                  >
                    Section 173 BNSS / CCTNS Format
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-black tracking-tight mt-1">
                  FIR (First Information Report)
                </h3>
              </div>
            </div>
            <ChevronRight
              className={cn(
                "w-5 h-5 transition-transform group-hover:translate-x-1",
                activeModule === "FIR" ? "text-amber-400" : "text-slate-400"
              )}
            />
          </div>

          <p
            className={cn(
              "text-xs mt-3 leading-relaxed",
              activeModule === "FIR" ? "text-slate-300" : "text-slate-600"
            )}
          >
            Statutory Cognizable Offence FIR registration, IO assignment, case diaries (Zimni), evidence handling, chargesheet &amp; final form disposal.
          </p>

          <div className="mt-4 pt-3 border-t border-slate-200/20 flex items-center justify-between text-xs">
            <span
              className={cn(
                "font-semibold",
                activeModule === "FIR" ? "text-amber-300" : "text-red-700"
              )}
            >
              Open FIR Register &rarr;
            </span>
            <span
              className={cn(
                "font-mono text-[11px] px-2 py-0.5 rounded",
                activeModule === "FIR"
                  ? "bg-slate-900/80 text-amber-300"
                  : "bg-red-50 text-red-800 font-semibold"
              )}
            >
              Criminal Case Docket
            </span>
          </div>
        </button>
      </div>
    );
  }

  // Header / Topbar Navigation Tabs
  return (
    <div
      className={cn(
        "inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200/90 shadow-2xs",
        className
      )}
    >
      <button
        type="button"
        onClick={() => switchToModule("ROZNAMCHA")}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
          activeModule === "ROZNAMCHA"
            ? "bg-[#0b192c] text-white shadow-xs"
            : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
        )}
      >
        <BookOpen
          className={cn("w-3.5 h-3.5", activeModule === "ROZNAMCHA" ? "text-amber-400" : "text-slate-500")}
        />
        <span>Roznamcha GD</span>
      </button>

      <button
        type="button"
        onClick={() => switchToModule("COMPLAINTS")}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
          activeModule === "COMPLAINTS"
            ? "bg-[#0b192c] text-white shadow-xs"
            : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
        )}
      >
        <FileText
          className={cn("w-3.5 h-3.5", activeModule === "COMPLAINTS" ? "text-red-400" : "text-slate-500")}
        />
        <span>Complaints</span>
      </button>

      <button
        type="button"
        onClick={() => switchToModule("FIR")}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
          activeModule === "FIR"
            ? "bg-[#0b192c] text-white shadow-xs"
            : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
        )}
      >
        <Scale
          className={cn("w-3.5 h-3.5", activeModule === "FIR" ? "text-red-400" : "text-slate-500")}
        />
        <span>FIR</span>
      </button>
    </div>
  );
}
