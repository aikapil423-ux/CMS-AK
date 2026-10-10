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
  ChevronDown,
  Check,
  ArrowRight,
  Shield,
  X,
} from "lucide-react";
import { useModule, PoliceModule } from "@/context/ModuleContext";

interface TopBarModuleSwitcherProps {
  isMobile?: boolean;
}

export function TopBarModuleSwitcher({ isMobile = false }: TopBarModuleSwitcherProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { activeModule, switchToModule } = useModule();
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

  const currentModuleName = isRoznamcha
    ? "Roznamcha GD"
    : isFir
    ? "FIR Module"
    : isComplaints
    ? "Complaints"
    : "Operations Portal";

  const CurrentModuleIcon = isRoznamcha
    ? BookOpen
    : isFir
    ? Scale
    : isComplaints
    ? FileText
    : LayoutGrid;

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
      titleHi: "दैनिक रोजनामचा (General Diary)",
      desc: "Daily Events, Staff Movement, ERV, Rider & Duty Roster (PPR Ch. XXII)",
      href: "/general-diary",
      icon: BookOpen,
      badge: "PPR 22.48",
      color: "amber",
      isActive: isRoznamcha,
    },
    {
      id: "COMPLAINTS",
      title: "Complaints & Enquiry",
      titleHi: "शिकायत एवं जाँच वर्कस्पेस",
      desc: "Citizen Complaints, Walk-in, CM Window, EO Investigation & Statements",
      href: "/complaints",
      icon: FileText,
      badge: "Intake",
      color: "red",
      isActive: isComplaints,
    },
    {
      id: "FIR",
      title: "FIR Module",
      titleHi: "प्रथम सूचना रिपोर्ट (FIR Register)",
      desc: "Criminal Case Registration, Sections of Law, Accused & IO Zimni Workflows",
      href: "/fir",
      icon: Scale,
      badge: "CCTNS",
      color: "blue",
      isActive: isFir,
    },
  ];

  const quickLinks = [
    {
      title: "Station Profile & Staff",
      titleHi: "थाना प्रोफ़ाइल & स्टाफ प्रबंधन",
      href: "/station-profile",
      icon: Building,
    },
    {
      title: "Statutory Acts & Sections",
      titleHi: "कानूनी धाराएं व अधिनियम डायरेक्टरी",
      href: "/acts-sections",
      icon: ScrollText,
    },
  ];

  return (
    <div className="relative inline-flex items-center" ref={dropdownRef}>
      {/* Trigger Button with Switch Module Icon */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer border select-none ${
          isOpen
            ? "bg-slate-900 text-white border-slate-900 shadow-sm ring-2 ring-slate-900/20"
            : "bg-white hover:bg-slate-50 text-slate-800 border-slate-200/90 hover:border-slate-300 shadow-2xs"
        }`}
        title="मॉड्यूल बदलें (Click to Switch Police Module)"
        aria-expanded={isOpen}
      >
        {/* Switch Module Icon */}
        <div
          className={`w-4.5 h-4.5 rounded flex items-center justify-center transition-colors ${
            isOpen ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"
          }`}
        >
          <LayoutGrid className="w-3 h-3" />
        </div>

        {!isMobile && (
          <>
            <span className="font-bold tracking-tight text-xs flex items-center gap-1.5">
              <span>{currentModuleName}</span>
            </span>
            <span
              className={`text-[10px] px-1 py-0.2 rounded font-medium ${
                isOpen ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
              }`}
            >
              बदलें
            </span>
          </>
        )}

        <ChevronDown
          className={`w-3 h-3 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-white" : "text-slate-400"
          }`}
        />
      </button>

      {/* Switch Module Dropdown Popover */}
      {isOpen && (
        <div
          className={`absolute top-full mt-2 z-50 bg-white rounded-xl shadow-2xl border border-slate-200/90 overflow-hidden transition-all duration-150 animate-in fade-in slide-in-from-top-2 ${
            isMobile
              ? "left-0 w-[calc(100vw-2rem)] max-w-sm"
              : "left-0 w-84 sm:w-92"
          }`}
        >
          {/* Header */}
          <div className="px-3.5 py-2.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center text-amber-400">
                <LayoutGrid className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="text-xs font-bold tracking-tight">पुलिस मॉड्यूल बदलें</h4>
                <p className="text-[10px] text-slate-400">Switch Police Operational Module</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Module List */}
          <div className="p-2 space-y-1.5">
            {modules.map((mod) => {
              const Icon = mod.icon;
              return (
                <button
                  key={mod.id}
                  type="button"
                  onClick={() => handleNavigate(mod.href, mod.id as PoliceModule)}
                  className={`w-full text-left p-2.5 rounded-lg border transition-all cursor-pointer flex items-start justify-between gap-3 group ${
                    mod.isActive
                      ? "bg-slate-50/90 border-slate-900/30 ring-1 ring-slate-900/10 shadow-2xs"
                      : "bg-white hover:bg-slate-50 border-slate-200/70 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                        mod.color === "amber"
                          ? "bg-amber-100 text-amber-900"
                          : mod.color === "red"
                          ? "bg-red-100 text-red-900"
                          : "bg-blue-100 text-blue-900"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900 leading-tight">
                          {mod.title}
                        </span>
                        <span
                          className={`text-[9px] px-1 py-0.2 rounded font-bold uppercase ${
                            mod.color === "amber"
                              ? "bg-amber-100 text-amber-800"
                              : mod.color === "red"
                              ? "bg-red-100 text-red-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {mod.badge}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-600 font-medium mt-0.5 truncate">
                        {mod.titleHi}
                      </p>
                      <p className="text-[10px] text-slate-400 leading-tight line-clamp-1 mt-0.5">
                        {mod.desc}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center pt-1">
                    {mod.isActive ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span>सक्रिय</span>
                      </span>
                    ) : (
                      <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Quick Links Footer */}
          <div className="px-2.5 py-2 bg-slate-50 border-t border-slate-200/80">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5 px-1">
              त्वरित लिंक (Quick Links)
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
                    <Icon className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="text-[10px] truncate">{link.title}</span>
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
