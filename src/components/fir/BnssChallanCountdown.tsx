"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Clock, AlertTriangle, ShieldCheck, FileCheck, ChevronRight, Scale } from "lucide-react";
import { FIRItem } from "@/types";

interface BnssChallanCountdownProps {
  firs: FIRItem[];
}

export function BnssChallanCountdown({ firs }: BnssChallanCountdownProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Compute cases that have accused arrested or pending chargesheet
  const activeCasesWithCountdown = firs
    .filter((f) => {
      const status = String(f.status || "").toUpperCase();
      return status === "UNDER_INVESTIGATION" || status === "INVESTIGATION" || status === "PENDING_SUPERVISORY_REVIEW";
    })
    .map((f) => {
      // Date of FIR or arrest
      const regDate = f.firDate ? new Date(f.firDate) : new Date(f.createdAt || Date.now());
      const now = new Date();
      const diffMs = now.getTime() - regDate.getTime();
      const daysElapsed = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
      
      // Heinous crime (>10 years punishment) gets 90 days, others 60 days
      const isHeinous = /302|304|307|376|103|109|311/.test(f.actsAndSections || "");
      const totalStatutoryDays = isHeinous ? 90 : 60;
      const daysLeft = Math.max(0, totalStatutoryDays - daysElapsed);
      const percentage = Math.min(100, Math.round((daysElapsed / totalStatutoryDays) * 100));

      return {
        fir: f,
        daysElapsed,
        daysLeft,
        totalStatutoryDays,
        percentage,
        isHeinous,
        isCritical: daysLeft <= 10,
        isWarning: daysLeft > 10 && daysLeft <= 20,
      };
    })
    // Sort critical (<10 days) first
    .sort((a, b) => a.daysLeft - b.daysLeft);

  const criticalCount = activeCasesWithCountdown.filter((c) => c.isCritical).length;

  if (activeCasesWithCountdown.length === 0) return null;

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden transition-all">
      {/* Banner Header */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="px-4 py-3 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex flex-wrap items-center justify-between gap-3 cursor-pointer select-none"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-bold text-sm shrink-0">
            <Scale className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs sm:text-sm tracking-tight text-white">
                BNSS Section 193 — Statutory Challan Filing Countdown
              </span>
              {criticalCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white animate-pulse">
                  {criticalCount} Critical Default Bail Alert
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-300">
              गिरफ़्तारी से 60/90 दिन में चालान दाखिल करने की कानूनी समय-सीमा • डिफॉल्ट ज़मानत रोकथाम ट्रैकर
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-300 font-medium">
            {activeCasesWithCountdown.length} Active {activeCasesWithCountdown.length === 1 ? "Case" : "Cases"}
          </span>
          <span className="text-slate-400 text-xs">{isExpanded ? "▲ Hide" : "▼ Show"}</span>
        </div>
      </div>

      {/* Expanded Cases List */}
      {isExpanded && (
        <div className="p-3.5 space-y-3 bg-slate-50/60 divide-y divide-slate-100">
          {activeCasesWithCountdown.slice(0, 3).map((item) => {
            const f = item.fir;
            return (
              <div key={f.id} className="pt-2.5 first:pt-0 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/fir/${f.id}`}
                        className="font-mono font-bold text-xs text-blue-900 hover:underline"
                      >
                        {f.firNumber}
                      </Link>
                      <span className="text-[11px] text-slate-600 truncate">
                        {f.actsAndSections}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        • IO: {f.assignedIoName || "Not assigned"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 border ${
                        item.isCritical
                          ? "bg-rose-50 text-rose-700 border-rose-300 animate-pulse"
                          : item.isWarning
                          ? "bg-amber-50 text-amber-700 border-amber-300"
                          : "bg-blue-50 text-blue-800 border-blue-200"
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      {item.daysLeft === 0
                        ? "DEADLINE EXPIRED"
                        : `${item.daysLeft} Days Left for ${item.totalStatutoryDays}-Day Limit`}
                    </span>
                    <Link
                      href={`/fir/${f.id}`}
                      className="text-xs font-semibold text-blue-900 hover:text-blue-950 flex items-center gap-0.5"
                    >
                      <span>Draft Challan</span>
                      <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden flex">
                    <div
                      className={`h-full transition-all duration-300 rounded-l-full ${
                        item.isCritical
                          ? "bg-rose-600"
                          : item.isWarning
                          ? "bg-amber-500"
                          : "bg-blue-600"
                      }`}
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                    {item.isCritical && (
                      <div className="h-full bg-rose-400/80 animate-pulse flex-1"></div>
                    )}
                  </div>

                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>
                      Day {item.daysElapsed} elapsed since registration
                    </span>
                    <span className={item.isCritical ? "font-bold text-rose-700" : ""}>
                      {item.isCritical
                        ? "⚠️ Default Bail Alert: Less than 10 days to file Final Report!"
                        : `${item.percentage}% of statutory window elapsed`}
                    </span>
                    <span>Statutory Deadline: Day {item.totalStatutoryDays}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
