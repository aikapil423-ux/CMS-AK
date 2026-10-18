"use client";

import React, { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutGrid,
  BookOpen,
  FileText,
  Scale,
  Building,
  ScrollText,
  Check,
  X,
  ClipboardList,
  FileBarChart,
} from "lucide-react";
import { useModule, PoliceModule } from "@/context/ModuleContext";
import { useLanguage } from "@/context/LanguageContext";

interface TopBarModuleSwitcherProps {
  isMobile?: boolean;
}

export function TopBarModuleSwitcher({ isMobile = false }: TopBarModuleSwitcherProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { activeModule, switchToModule } = useModule();
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
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const isRoznamcha = pathname.startsWith("/general-diary");
  const isFir = pathname.startsWith("/fir") || pathname.startsWith("/fir-workspace");
  const isComplaints =
    !isFir && (pathname.startsWith("/complaints") || pathname.startsWith("/enquiry-workspace"));
  const isRegistrations = pathname.startsWith("/registrations");
  const isReports = pathname.startsWith("/reports");
  const isProsecution = pathname.startsWith("/prosecution");

  const handleNavigate = (path: string, moduleKey?: PoliceModule) => {
    if (moduleKey) {
      switchToModule(moduleKey);
    } else {
      router.push(path);
    }
    setIsOpen(false);
  };

  const modules = [
    {
      id: "ROZNAMCHA",
      title: "Roznamcha GD",
      titleHi: "दैनिक रोजनामचा (GD)",
      href: "/general-diary",
      icon: BookOpen,
      color: "amber",
      isActive: isRoznamcha,
    },
    {
      id: "COMPLAINTS",
      title: "Complaints & Enquiry",
      titleHi: "शिकायत एवं जाँच",
      href: "/complaints",
      icon: FileText,
      color: "red",
      isActive: isComplaints,
    },
    {
      id: "FIR",
      title: "FIR Module",
      titleHi: "FIR मॉड्यूल",
      href: "/fir",
      icon: Scale,
      color: "blue",
      isActive: isFir,
    },
    {
      id: "PROSECUTION",
      title: "Prosecution & Courts",
      titleHi: "अभियोजन एवं न्यायालय",
      href: "/prosecution",
      icon: Scale,
      color: "indigo",
      isActive: isProsecution,
    },
    {
      id: "REGISTRATIONS",
      title: "Registrations",
      titleHi: "पंजीकरण रजिस्टर",
      href: "/registrations",
      icon: ClipboardList,
      color: "emerald",
      isActive: isRegistrations,
    },
    {
      id: "REPORTS",
      title: "Reports & Audit",
      titleHi: "रिपोर्ट्स एवं ऑडिट",
      href: "/reports",
      icon: FileBarChart,
      color: "purple",
      isActive: isReports,
    },
  ];

  const quickLinks = [
    {
      title: "Station Profile",
      titleHi: "थाना प्रोफ़ाइल",
      href: "/station-profile",
      icon: Building,
    },
    {
      title: "Acts & Sections",
      titleHi: "अधिनियम व धाराएं",
      href: "/acts-sections",
      icon: ScrollText,
    },
  ];

  return (
    <div className={`relative inline-flex items-center ${isOpen ? "z-50" : ""}`} ref={dropdownRef}>
      {/* Icon-Only Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer border select-none ${
          isOpen
            ? "bg-slate-900 text-white border-slate-900 shadow-sm ring-2 ring-slate-900/20"
            : "bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 border-slate-200/90 hover:border-slate-300 shadow-2xs"
        }`}
        title={isHindi ? "मॉड्यूल बदलें (Switch Module)" : "Switch Police Module"}
        aria-label={isHindi ? "मॉड्यूल बदलें" : "Switch Module"}
        aria-expanded={isOpen}
      >
        <LayoutGrid className="w-4 h-4" />
      </button>

      {/* Switch Module Dropdown Popover (Minimalist Design) */}
      {isOpen && (
        <div
          className={`absolute top-full mt-2 z-50 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden transition-all duration-150 animate-in fade-in slide-in-from-top-2 max-h-[calc(100vh-4.5rem)] overflow-y-auto flex flex-col ${
            isMobile
              ? "left-0 w-[calc(100vw-2rem)] max-w-xs"
              : "left-0 w-64 sm:w-72"
          }`}
        >
          {/* Header */}
          <div className="px-3.5 py-2.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2">
              <LayoutGrid className="w-3.5 h-3.5 text-amber-400" />
              <h4 className="text-xs font-bold tracking-tight">
                {isHindi ? "पुलिस मॉड्यूल बदलें" : "Switch Police Module"}
              </h4>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Module List (Minimalist: Name and Icon only) */}
          <div className="p-1.5 space-y-1">
            {modules.map((mod) => {
              const Icon = mod.icon;
              return (
                <button
                  key={mod.id}
                  type="button"
                  onClick={() => handleNavigate(mod.href, mod.id as PoliceModule)}
                  className={`w-full text-left px-2.5 py-2 rounded-lg transition-all cursor-pointer flex items-center justify-between gap-2.5 group ${
                    mod.isActive
                      ? "bg-slate-900 text-white shadow-xs font-semibold"
                      : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                        mod.isActive
                          ? "bg-white/20 text-white"
                          : mod.color === "amber"
                          ? "bg-amber-100 text-amber-800 group-hover:bg-amber-200"
                          : mod.color === "red"
                          ? "bg-red-100 text-red-800 group-hover:bg-red-200"
                          : mod.color === "emerald"
                          ? "bg-emerald-100 text-emerald-800 group-hover:bg-emerald-200"
                          : mod.color === "indigo"
                          ? "bg-indigo-100 text-indigo-800 group-hover:bg-indigo-200"
                          : mod.color === "purple"
                          ? "bg-purple-100 text-purple-800 group-hover:bg-purple-200"
                          : "bg-blue-100 text-blue-800 group-hover:bg-blue-200"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-medium truncate">
                      {isHindi ? mod.titleHi : mod.title}
                    </span>
                  </div>

                  {mod.isActive && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/30 shrink-0">
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span>{isHindi ? "सक्रिय" : "Active"}</span>
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Links Footer */}
          <div className="px-2.5 py-2 bg-slate-50 border-t border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5 px-1">
              {isHindi ? "त्वरित लिंक" : "Quick Links"}
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {quickLinks.map((link) => {
                const Icon = link.icon;
                const isCurrent = pathname.startsWith(link.href);
                return (
                  <button
                    key={link.href}
                    type="button"
                    onClick={() => handleNavigate(link.href)}
                    className={`p-1.5 rounded-md border text-left flex items-center gap-1.5 transition-all cursor-pointer ${
                      isCurrent
                        ? "bg-white border-slate-900/40 text-slate-950 font-bold shadow-2xs"
                        : "bg-white hover:bg-slate-100 text-slate-700 border-slate-200/70"
                    }`}
                  >
                    <Icon className="w-3 h-3 text-slate-500 shrink-0" />
                    <span className="text-[10px] truncate">{isHindi ? link.titleHi : link.title}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
