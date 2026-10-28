"use client";

import React, { useState, useRef, useEffect } from "react";
import { UserCog, Check } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { DEMO_USERS } from "@/lib/mockData";
import { UserSession } from "@/types";
import { cn } from "@/lib/utils";

interface TopBarPersonaSwitcherProps {
  isMobile?: boolean;
}

function getRoleBadge(user: UserSession): { badge: string; colorClass: string } {
  if (user.role === "SP_DISTRICT" || user.rank === "SUPERINTENDENT_OF_POLICE") {
    return { badge: "SP", colorClass: "bg-indigo-50 text-indigo-700 border-indigo-200" };
  }
  if (user.rank === "ADDITIONAL_SP") {
    return { badge: "ASP", colorClass: "bg-violet-50 text-violet-700 border-violet-200" };
  }
  if (user.role === "DSP_SUBDIV" || user.rank === "DEPUTY_SP") {
    return { badge: "DSP", colorClass: "bg-purple-50 text-purple-700 border-purple-200" };
  }
  if (user.role === "SHO") {
    return { badge: "SHO", colorClass: "bg-red-50 text-red-700 border-red-200" };
  }
  if (user.role === "MHC_GD_INCHARGE") {
    return { badge: "MHC", colorClass: "bg-emerald-50 text-emerald-700 border-emerald-200" };
  }
  if (user.role === "DUTY_OFFICER") {
    return { badge: "Duty", colorClass: "bg-amber-50 text-amber-700 border-amber-200" };
  }
  if (user.role === "ENQUIRY_OFFICER") {
    if (user.rank === "INSPECTOR") {
      return { badge: "IO-Insp", colorClass: "bg-blue-50 text-blue-700 border-blue-200" };
    }
    if (user.rank === "SUB_INSPECTOR") {
      return { badge: "IO-SI", colorClass: "bg-blue-50 text-blue-700 border-blue-200" };
    }
    if (user.rank === "ASSISTANT_SUB_INSPECTOR") {
      return { badge: "IO-ASI", colorClass: "bg-sky-50 text-sky-700 border-sky-200" };
    }
    if (user.rank === "HEAD_CONSTABLE") {
      return { badge: "IO-HC", colorClass: "bg-cyan-50 text-cyan-700 border-cyan-200" };
    }
    return { badge: "IO/EO", colorClass: "bg-blue-50 text-blue-700 border-blue-200" };
  }
  return { badge: user.rank.slice(0, 3), colorClass: "bg-slate-100 text-slate-700 border-slate-200" };
}

export function TopBarPersonaSwitcher({ isMobile = false }: TopBarPersonaSwitcherProps) {
  const { currentUser, switchUser } = useAuth();
  const { isHindi } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    const handleOpenRole = () => setIsOpen(true);

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    window.addEventListener("cms-open-role-switcher", handleOpenRole);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("cms-open-role-switcher", handleOpenRole);
    };
  }, [isOpen]);

  const handleSelect = (userId: string) => {
    switchUser(userId);
    setIsOpen(false);
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  const activeRoleInfo = getRoleBadge(currentUser);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Persona Icon Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "relative rounded-lg border transition-all cursor-pointer flex items-center justify-center group active:scale-95",
          isMobile
            ? "p-1.5 bg-slate-100 hover:bg-slate-200/80 border-slate-200 text-slate-700"
            : "p-2 bg-white hover:bg-slate-50 border-slate-200/80 text-slate-700 hover:text-slate-950 shadow-2xs",
          isOpen && "ring-2 ring-[#0b192c]/20 bg-slate-100"
        )}
        title={
          isHindi
            ? `पद बदलें (वर्तमान: ${currentUser.name})`
            : `Switch Police Persona (Current: ${currentUser.name})`
        }
        aria-label="Switch Police Persona"
        aria-expanded={isOpen}
      >
        <UserCog className={isMobile ? "w-3.5 h-3.5 text-slate-700" : "w-4 h-4 text-slate-700 group-hover:text-slate-900"} />
        <span className="cms-persona-badge absolute -bottom-1 -right-1 text-[8px] font-bold px-1 leading-none rounded bg-[#0b192c] text-white border border-white font-mono shadow-2xs">
          {activeRoleInfo.badge}
        </span>
      </button>

      {/* Minimalist Dropdown - Opens directly beneath the icon with zero clutter */}
      {isOpen && (
        <div
          className={cn(
            "absolute right-0 top-full mt-1.5 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden py-1.5 animate-in fade-in-0 zoom-in-95",
            isMobile ? "w-56" : "w-64"
          )}
        >
          {/* Minimal Clean Header */}
          <div className="px-3 py-1.5 border-b border-slate-100 flex items-center justify-between text-[11px] font-semibold text-slate-500">
            <span>{isHindi ? "पद बदलें" : "Switch Police Persona"}</span>
            <span className="text-[10px] text-slate-400 font-mono">
              {DEMO_USERS.length} {isHindi ? "पद" : "Roles"}
            </span>
          </div>

          {/* Minimalist List: Role badge + Name only (No extra details, no clutter) */}
          <div className="p-1 space-y-0.5 max-h-72 overflow-y-auto">
            {DEMO_USERS.map((user) => {
              const isSelected = currentUser.id === user.id;
              const roleInfo = getRoleBadge(user);

              return (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => handleSelect(user.id)}
                  className={cn(
                    "w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left transition-colors text-xs group",
                    isSelected
                      ? "bg-slate-100 text-slate-900 font-semibold"
                      : "text-slate-700 hover:bg-slate-50 hover:text-slate-950"
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={cn(
                        "text-[9px] font-bold px-1.5 py-0.5 rounded border font-mono shrink-0",
                        roleInfo.colorClass
                      )}
                    >
                      {roleInfo.badge}
                    </span>
                    <span className="truncate">{user.name}</span>
                  </div>
                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 ml-1.5" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
