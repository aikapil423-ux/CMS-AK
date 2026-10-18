"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Shield,
  FileText,
  BookOpen,
  UserCheck,
  Building2,
  Users,
  LogOut,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  Flame,
  LayoutGrid,
  Pin,
  PinOff,
  ScrollText,
  FileCheck2,
  Sparkles,
  Settings,
  ListFilter,
  SlidersHorizontal,
  Scale,
  HardDrive,
  ReceiptText,
  ClipboardList,
  FileBarChart,
  BookmarkCheck,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  badgeColor?: string;
}

export function Sidebar() {
  const pathname = usePathname();
  const { currentUser, logout } = useAuth();
  const { t } = useLanguage();

  // State for hover-to-expand and optional lock pin
  const [isHovered, setIsHovered] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const isExpanded = isHovered || isPinned;

  // Toggle slide bar states for Roznamcha, Complaints, FIR, Registrations, Reports, Prosecution, Management, and Station Info - default CLOSED (false)
  const [roznamchaOpen, setRoznamchaOpen] = useState(false);
  const [complaintsOpen, setComplaintsOpen] = useState(false);
  const [firOpen, setFirOpen] = useState(false);
  const [registrationsOpen, setRegistrationsOpen] = useState(false);
  const [reportsOpen, setReportsOpen] = useState(false);
  const [prosecutionOpen, setProsecutionOpen] = useState(false);
  const [managementOpen, setManagementOpen] = useState(false);
  const [stationInfoOpen, setStationInfoOpen] = useState(false);

  // Detect active module
  const isRoznamchaPath = pathname.startsWith("/general-diary");
  const isFirPath = pathname.startsWith("/fir") || pathname.startsWith("/fir-workspace");
  const isComplaintsPath = !isFirPath && (pathname.startsWith("/complaints") || pathname.startsWith("/enquiry-workspace"));
  const isRegistrationsPath = pathname.startsWith("/registrations");
  const isReportsPath = pathname.startsWith("/reports");
  const isProsecutionPath = pathname.startsWith("/prosecution");
  const isManagementPath = pathname.startsWith("/settings");

  // Keep track of the last active module so when user is on /station-profile or /users,
  // ONLY the module that was currently open remains visible.
  const [activeModule, setActiveModule] = useState<"ROZNAMCHA" | "COMPLAINTS" | "FIR" | "REGISTRATIONS" | "REPORTS" | "PROSECUTION">("COMPLAINTS");

  useEffect(() => {
    if (isRoznamchaPath) {
      setActiveModule("ROZNAMCHA");
      try {
        window.localStorage.setItem("cms_active_module", "ROZNAMCHA");
      } catch {}
    } else if (isFirPath) {
      setActiveModule("FIR");
      try {
        window.localStorage.setItem("cms_active_module", "FIR");
      } catch {}
    } else if (isComplaintsPath) {
      setActiveModule("COMPLAINTS");
      try {
        window.localStorage.setItem("cms_active_module", "COMPLAINTS");
      } catch {}
    } else if (isRegistrationsPath) {
      setActiveModule("REGISTRATIONS");
      try {
        window.localStorage.setItem("cms_active_module", "REGISTRATIONS");
      } catch {}
    } else if (isReportsPath) {
      setActiveModule("REPORTS");
      try {
        window.localStorage.setItem("cms_active_module", "REPORTS");
      } catch {}
    } else if (isProsecutionPath) {
      setActiveModule("PROSECUTION");
      try {
        window.localStorage.setItem("cms_active_module", "PROSECUTION");
      } catch {}
    } else {
      try {
        const saved = window.localStorage.getItem("cms_active_module");
        if (saved === "ROZNAMCHA" || saved === "COMPLAINTS" || saved === "FIR" || saved === "REGISTRATIONS" || saved === "REPORTS" || saved === "PROSECUTION") {
          setActiveModule(saved);
        }
      } catch {}
    }
  }, [pathname, isRoznamchaPath, isComplaintsPath, isFirPath, isRegistrationsPath, isReportsPath, isProsecutionPath]);

  // Check if user is on portal home page (Select Operational Module)
  const isPortalHome = pathname === "/";

  // Determine which module to display in the toggle slide bar (on portal home, only Management & Settings is shown)
  const showRoznamcha = !isPortalHome && (isRoznamchaPath || (!isComplaintsPath && !isFirPath && !isRegistrationsPath && !isReportsPath && !isProsecutionPath && activeModule === "ROZNAMCHA"));
  const showComplaints = !isPortalHome && (isComplaintsPath || (!isRoznamchaPath && !isFirPath && !isRegistrationsPath && !isReportsPath && !isProsecutionPath && activeModule === "COMPLAINTS"));
  const showFir = !isPortalHome && (isFirPath || (!isRoznamchaPath && !isComplaintsPath && !isRegistrationsPath && !isReportsPath && !isProsecutionPath && activeModule === "FIR"));
  const showRegistrations = !isPortalHome && (isRegistrationsPath || (!isRoznamchaPath && !isComplaintsPath && !isFirPath && !isReportsPath && !isProsecutionPath && activeModule === "REGISTRATIONS"));
  const showReports = !isPortalHome && (isReportsPath || (!isRoznamchaPath && !isComplaintsPath && !isFirPath && !isRegistrationsPath && !isProsecutionPath && activeModule === "REPORTS"));
  const showProsecution = !isPortalHome && (isProsecutionPath || (!isRoznamchaPath && !isComplaintsPath && !isFirPath && !isRegistrationsPath && !isReportsPath && activeModule === "PROSECUTION"));

  // ROZNAMCHA GD NAVIGATION ITEMS (Smart General Diary - English Only)
  const roznamchaNavItems: NavItem[] = [
    { name: "Smart General Diary", href: "/general-diary", icon: BookOpen, badge: "PPR 22.48", badgeColor: "bg-slate-100 text-slate-600 border-slate-200/60" },
    { name: "Auto-Suggestions & Drafts", href: "/general-diary?tab=SUGGESTIONS_DRAFTS", icon: Sparkles, badge: "AI Review", badgeColor: "bg-purple-50 text-purple-700 border-purple-200" },
    { name: "ACT and SECTIONs", href: "/acts-sections", icon: Scale, badge: "Bare Acts", badgeColor: "bg-slate-100 text-slate-600 border-slate-200/60" },
  ];

  // COMPLAINTS NAVIGATION ITEMS
  const complaintNavItems: NavItem[] = [
    { name: "Complaints Register", href: "/complaints", icon: FileText, badge: "Active", badgeColor: "bg-slate-100 text-slate-600 border-slate-200/60" },
    { name: "Field Enquiry Workspace", href: "/enquiry-workspace", icon: UserCheck },
    { name: "ACT and SECTIONs", href: "/acts-sections", icon: Scale, badge: "Bare Acts", badgeColor: "bg-slate-100 text-slate-600 border-slate-200/60" },
  ];

  // FIR NAVIGATION ITEMS (Complete Parity with Complaints module)
  const firNavItems: NavItem[] = [
    { name: "FIR Register", href: "/fir", icon: Scale, badge: "CCTNS", badgeColor: "bg-slate-100 text-slate-600 border-slate-200/60" },
    { name: "Investigation Workspace", href: "/fir-workspace", icon: UserCheck },
    { name: "ACT and SECTIONs", href: "/acts-sections", icon: Scale, badge: "Bare Acts", badgeColor: "bg-slate-100 text-slate-600 border-slate-200/60" },
  ];

  // REGISTRATIONS NAVIGATION ITEMS (Clean slide bar: category tabs managed inside the module)
  const registrationsNavItems: NavItem[] = [
    { name: "Registrations Register", href: "/registrations", icon: ClipboardList, badge: "CCTNS", badgeColor: "bg-slate-100 text-slate-600 border-slate-200/60" },
    { name: "ACT and SECTIONs", href: "/acts-sections", icon: Scale, badge: "Bare Acts", badgeColor: "bg-slate-100 text-slate-600 border-slate-200/60" },
  ];

  // REPORTS NAVIGATION ITEMS (Exact sub-tabs as requested)
  const reportsNavItems: NavItem[] = [
    { name: "CrimeSITREP_District", href: "/reports?tab=crime_sitrep", icon: FileBarChart, badge: "SP SITREP", badgeColor: "bg-blue-50 text-blue-700 border-blue-200" },
    { name: "WEEKLY CRIME DIARY", href: "/reports?tab=weekly_crime_diary", icon: BookOpen, badge: "PPR", badgeColor: "bg-amber-50 text-amber-800 border-amber-200" },
    { name: "IGP Meeting Presentation", href: "/reports?tab=igp_presentation", icon: FileText, badge: "Review", badgeColor: "bg-purple-50 text-purple-700 border-purple-200" },
    { name: "Saved Reports", href: "/reports?tab=saved_reports", icon: BookmarkCheck, badge: "Saved", badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  ];

  // PROSECUTION NAVIGATION ITEMS
  const prosecutionNavItems: NavItem[] = [
    { name: "Challan Scrutiny", href: "/prosecution?tab=challan_scrutiny&subtab=scrutiny_perform", icon: FileCheck2, badge: "Scrutiny", badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200" },
    { name: "Common Malpractices", href: "/prosecution?tab=challan_scrutiny&subtab=common_malpractices", icon: Scale, badge: "Rules", badgeColor: "bg-rose-50 text-rose-700 border-rose-200" },
    { name: "Bail Reply", href: "/prosecution?tab=courts&subtab=bail_reply", icon: ReceiptText, badge: "Bail", badgeColor: "bg-amber-50 text-amber-700 border-amber-200" },
    { name: "Status Report", href: "/prosecution?tab=courts&subtab=status_report", icon: FileText, badge: "Court", badgeColor: "bg-blue-50 text-blue-700 border-blue-200" },
    { name: "Other Court Docs", href: "/prosecution?tab=courts&subtab=other", icon: BookmarkCheck, badge: "Misc", badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  ];

  // MANAGEMENT NAVIGATION ITEMS (Settings & Dropdown Manager in Slide Bar)
  const managementNavItems: NavItem[] = [
    { name: "TA DA Form", href: "/tada", icon: ReceiptText, badge: "Bill", badgeColor: "bg-amber-100 text-amber-800 border-amber-200" },
    { name: "Storage Optimization", href: "/settings?tab=storage-optimization", icon: HardDrive, badge: "Lossless", badgeColor: "bg-emerald-100 text-emerald-700 border-emerald-200" },
    { name: "Dropdown Manager", href: "/settings?tab=dropdowns", icon: ListFilter, badge: "Master", badgeColor: "bg-blue-100 text-blue-700 border-blue-200" },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <aside
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "hidden lg:flex lg:flex-col bg-white border-r border-slate-200/80 text-slate-700 select-none shrink-0 h-screen sticky top-0 transition-all duration-200 ease-in-out z-40",
        isExpanded ? "w-64 shadow-lg" : "w-18"
      )}
    >
      {/* Insignia / Brand Header - Clean Minimalist */}
      <div className="p-3 border-b border-slate-200/80 bg-white flex items-center justify-between overflow-hidden">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white shrink-0"
            title="Haryana Police CMS"
          >
            <Shield className="w-4 h-4" />
          </div>
          {isExpanded && (
            <div className="flex-1 min-w-0 animate-in fade-in duration-150">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                  {t("Haryana Police")}
                </span>
              </div>
              <h1 className="text-xs font-semibold text-slate-900 tracking-tight truncate">{t("Case Management")}</h1>
              <p className="text-[10px] text-slate-400 truncate">{currentUser.stationName}</p>
            </div>
          )}
        </div>

        {/* Pin / Unpin button when expanded */}
        {isExpanded && (
          <button
            onClick={() => setIsPinned(!isPinned)}
            className="p-1 rounded text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            title={isPinned ? "Unpin sidebar (auto-collapse)" : "Pin sidebar open"}
          >
            {isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>

      {/* PORTAL SWITCHER - ALWAYS VISIBLE */}
      <div className="p-2 bg-slate-50/60 border-b border-slate-200/80 overflow-hidden">
        <Link
          href="/"
          title={t("Modules Portal")}
          className={cn(
            "flex items-center rounded-md bg-white hover:bg-slate-100/80 text-slate-700 hover:text-slate-900 border border-slate-200/70 transition-colors",
            isExpanded ? "justify-between px-2.5 py-1.5 text-xs font-medium" : "justify-center p-2"
          )}
        >
          <div className="flex items-center gap-2">
            <LayoutGrid className="w-3.5 h-3.5 text-slate-600 shrink-0" />
            {isExpanded && <span className="truncate">{t("Modules Portal")}</span>}
          </div>
          {isExpanded && <span className="text-[10px] text-slate-400 shrink-0">&larr; {t("Switch")}</span>}
        </Link>
      </div>



      {/* Navigation Links: Module specific isolation */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-3">
        {/* 1. ROZNAMCHA GD TOGGLE SLIDE BAR (Only visible if Roznamcha is open/active) */}
        {showRoznamcha && (
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => {
                if (!isExpanded) setIsPinned(true);
                setRoznamchaOpen(!roznamchaOpen);
              }}
              className={cn(
                "w-full flex items-center rounded-lg px-2 py-1.5 transition-colors text-left cursor-pointer",
                isExpanded ? "justify-between hover:bg-slate-100/70" : "justify-center hover:bg-slate-100/70",
                isRoznamchaPath ? "bg-slate-100/50" : ""
              )}
              title="Toggle Roznamcha GD Menu"
            >
              <div className="flex items-center gap-2 min-w-0">
                <BookOpen className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                {isExpanded && (
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 truncate">
                    {t("Roznamcha GD")}
                  </span>
                )}
              </div>
              {isExpanded && (
                <span className="text-slate-400">
                  {roznamchaOpen ? (
                    <ChevronDown className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5" />
                  )}
                </span>
              )}
            </button>

            {roznamchaOpen && (
              <nav className="space-y-0.5 pt-0.5 animate-in fade-in-50 duration-150">
                {roznamchaNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      title={!isExpanded ? t(item.name) : undefined}
                      className={cn(
                        "flex items-center rounded-md text-xs font-medium transition-all group",
                        isExpanded
                          ? "justify-between px-2.5 py-1.5"
                          : "justify-center p-2",
                        isActive
                          ? "bg-slate-100 text-slate-900 font-semibold"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon
                          className={cn(
                            "w-3.5 h-3.5 shrink-0",
                            isActive ? "text-slate-900" : "text-slate-400 group-hover:text-slate-700"
                          )}
                        />
                        {isExpanded && <span className="truncate">{t(item.name)}</span>}
                      </div>
                      {isExpanded && item.badge && (
                        <span
                          className={cn(
                            "text-[10px] px-1.5 py-0.5 rounded font-mono shrink-0 border",
                            item.badgeColor || "bg-slate-100 text-slate-600 border-slate-200/60"
                          )}
                        >
                          {t(item.badge)}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            )}
          </div>
        )}

        {/* 2. COMPLAINTS TOGGLE SLIDE BAR (Only visible if Complaints is open/active) */}
        {showComplaints && (
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => {
                if (!isExpanded) setIsPinned(true);
                setComplaintsOpen(!complaintsOpen);
              }}
              className={cn(
                "w-full flex items-center rounded-lg px-2 py-1.5 transition-colors text-left cursor-pointer",
                isExpanded ? "justify-between hover:bg-slate-100/70" : "justify-center hover:bg-slate-100/70",
                isComplaintsPath ? "bg-slate-100/50" : ""
              )}
              title="Toggle Complaints Menu"
            >
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                {isExpanded && (
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 truncate">
                    {t("Complaints")}
                  </span>
                )}
              </div>
              {isExpanded && (
                <span className="text-slate-400">
                  {complaintsOpen ? (
                    <ChevronDown className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5" />
                  )}
                </span>
              )}
            </button>

            {complaintsOpen && (
              <nav className="space-y-0.5 pt-0.5 animate-in fade-in-50 duration-150">
                {complaintNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      title={!isExpanded ? t(item.name) : undefined}
                      className={cn(
                        "flex items-center rounded-md text-xs font-medium transition-all group",
                        isExpanded
                          ? "justify-between px-2.5 py-1.5"
                          : "justify-center p-2",
                        isActive
                          ? "bg-slate-100 text-slate-900 font-semibold"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon
                          className={cn(
                            "w-3.5 h-3.5 shrink-0",
                            isActive ? "text-slate-900" : "text-slate-400 group-hover:text-slate-700"
                          )}
                        />
                        {isExpanded && <span className="truncate">{t(item.name)}</span>}
                      </div>
                      {isExpanded && item.badge && (
                        <span
                          className={cn(
                            "text-[10px] px-1.5 py-0.5 rounded font-mono shrink-0 border",
                            item.badgeColor || "bg-slate-100 text-slate-600 border-slate-200/60"
                          )}
                        >
                          {t(item.badge)}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            )}
          </div>
        )}

        {/* 2.5. FIR TOGGLE SLIDE BAR (Only visible if FIR is open/active) */}
        {showFir && (
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => {
                if (!isExpanded) setIsPinned(true);
                setFirOpen(!firOpen);
              }}
              className={cn(
                "w-full flex items-center rounded-lg px-2 py-1.5 transition-colors text-left cursor-pointer",
                isExpanded ? "justify-between hover:bg-slate-100/70" : "justify-center hover:bg-slate-100/70",
                isFirPath ? "bg-slate-100/50" : ""
              )}
              title="Toggle FIR Menu"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Scale className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                {isExpanded && (
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 truncate">
                    {t("FIR")}
                  </span>
                )}
              </div>
              {isExpanded && (
                <span className="text-slate-400">
                  {firOpen ? (
                    <ChevronDown className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5" />
                  )}
                </span>
              )}
            </button>

            {firOpen && (
              <nav className="space-y-0.5 pt-0.5 animate-in fade-in-50 duration-150">
                {firNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      title={!isExpanded ? t(item.name) : undefined}
                      className={cn(
                        "flex items-center rounded-md text-xs font-medium transition-all group",
                        isExpanded
                          ? "justify-between px-2.5 py-1.5"
                          : "justify-center p-2",
                        isActive
                          ? "bg-slate-100 text-slate-900 font-semibold"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon
                          className={cn(
                            "w-3.5 h-3.5 shrink-0",
                            isActive ? "text-slate-900" : "text-slate-400 group-hover:text-slate-700"
                          )}
                        />
                        {isExpanded && <span className="truncate">{t(item.name)}</span>}
                      </div>
                      {isExpanded && item.badge && (
                        <span
                          className={cn(
                            "text-[10px] px-1.5 py-0.5 rounded font-mono shrink-0 border",
                            item.badgeColor || "bg-slate-100 text-slate-600 border-slate-200/60"
                          )}
                        >
                          {t(item.badge)}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            )}
          </div>
        )}

        {/* 2.8. REGISTRATIONS TOGGLE SLIDE BAR (Only visible if Registrations is open/active) */}
        {showRegistrations && (
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => {
                if (!isExpanded) setIsPinned(true);
                setRegistrationsOpen(!registrationsOpen);
              }}
              className={cn(
                "w-full flex items-center rounded-lg px-2 py-1.5 transition-colors text-left cursor-pointer",
                isExpanded ? "justify-between hover:bg-slate-100/70" : "justify-center hover:bg-slate-100/70",
                isRegistrationsPath ? "bg-slate-100/50" : ""
              )}
              title="Toggle Registrations Menu"
            >
              <div className="flex items-center gap-2 min-w-0">
                <ClipboardList className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                {isExpanded && (
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 truncate">
                    {t("Registrations")}
                  </span>
                )}
              </div>
              {isExpanded && (
                <span className="text-slate-400">
                  {registrationsOpen ? (
                    <ChevronDown className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5" />
                  )}
                </span>
              )}
            </button>

            {registrationsOpen && (
              <nav className="space-y-0.5 pt-0.5 animate-in fade-in-50 duration-150">
                {registrationsNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      title={!isExpanded ? t(item.name) : undefined}
                      className={cn(
                        "flex items-center rounded-md text-xs font-medium transition-all group",
                        isExpanded
                          ? "justify-between px-2.5 py-1.5"
                          : "justify-center p-2",
                        isActive
                          ? "bg-slate-100 text-slate-900 font-semibold"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon
                          className={cn(
                            "w-3.5 h-3.5 shrink-0",
                            isActive ? "text-slate-900" : "text-slate-400 group-hover:text-slate-700"
                          )}
                        />
                        {isExpanded && <span className="truncate">{t(item.name)}</span>}
                      </div>
                      {isExpanded && item.badge && (
                        <span
                          className={cn(
                            "text-[10px] px-1.5 py-0.5 rounded font-mono shrink-0 border",
                            item.badgeColor || "bg-slate-100 text-slate-600 border-slate-200/60"
                          )}
                        >
                          {t(item.badge)}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            )}
          </div>
        )}

        {/* 2.9. REPORTS TOGGLE SLIDE BAR (Only visible if Reports is open/active) */}
        {showReports && (
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => {
                if (!isExpanded) setIsPinned(true);
                setReportsOpen(!reportsOpen);
              }}
              className={cn(
                "w-full flex items-center rounded-lg px-2 py-1.5 transition-colors text-left cursor-pointer",
                isExpanded ? "justify-between hover:bg-slate-100/70" : "justify-center hover:bg-slate-100/70",
                isReportsPath ? "bg-slate-100/50" : ""
              )}
              title="Toggle Reports Menu"
            >
              <div className="flex items-center gap-2 min-w-0">
                <FileBarChart className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                {isExpanded && (
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 truncate">
                    {t("Reports")}
                  </span>
                )}
              </div>
              {isExpanded && (
                <span className="text-slate-400">
                  {reportsOpen ? (
                    <ChevronDown className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5" />
                  )}
                </span>
              )}
            </button>

            {reportsOpen && (
              <nav className="space-y-0.5 pt-0.5 animate-in fade-in-50 duration-150">
                {reportsNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      title={!isExpanded ? item.name : undefined}
                      className={cn(
                        "flex items-center rounded-md text-xs font-medium transition-all group",
                        isExpanded
                          ? "justify-between px-2.5 py-1.5"
                          : "justify-center p-2",
                        isActive
                          ? "bg-slate-100 text-slate-900 font-semibold"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon
                          className={cn(
                            "w-3.5 h-3.5 shrink-0",
                            isActive ? "text-slate-900" : "text-slate-400 group-hover:text-slate-700"
                          )}
                        />
                        {isExpanded && <span className="truncate">{item.name}</span>}
                      </div>
                      {isExpanded && item.badge && (
                        <span
                          className={cn(
                            "text-[10px] px-1.5 py-0.5 rounded font-mono shrink-0 border",
                            item.badgeColor || "bg-slate-100 text-slate-600 border-slate-200/60"
                          )}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            )}
          </div>
        )}

        {/* 2.95. PROSECUTION TOGGLE SLIDE BAR (Only visible if Prosecution is open/active) */}
        {showProsecution && (
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => {
                if (!isExpanded) setIsPinned(true);
                setProsecutionOpen(!prosecutionOpen);
              }}
              className={cn(
                "w-full flex items-center rounded-lg px-2 py-1.5 transition-colors text-left cursor-pointer",
                isExpanded ? "justify-between hover:bg-slate-100/70" : "justify-center hover:bg-slate-100/70",
                isProsecutionPath ? "bg-slate-100/50" : ""
              )}
              title="Toggle Prosecution Menu"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Scale className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                {isExpanded && (
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 truncate">
                    {t("Prosecution")}
                  </span>
                )}
              </div>
              {isExpanded && (
                <span className="text-slate-400">
                  {prosecutionOpen ? (
                    <ChevronDown className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5" />
                  )}
                </span>
              )}
            </button>

            {prosecutionOpen && (
              <nav className="space-y-0.5 pt-0.5 animate-in fade-in-50 duration-150">
                {prosecutionNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href || (pathname.startsWith("/prosecution") && item.href.includes(pathname));
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      title={!isExpanded ? item.name : undefined}
                      className={cn(
                        "flex items-center rounded-md text-xs font-medium transition-all group",
                        isExpanded
                          ? "justify-between px-2.5 py-1.5"
                          : "justify-center p-2",
                        isActive
                          ? "bg-slate-100 text-slate-900 font-semibold"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon
                          className={cn(
                            "w-3.5 h-3.5 shrink-0",
                            isActive ? "text-slate-900" : "text-slate-400 group-hover:text-slate-700"
                          )}
                        />
                        {isExpanded && <span className="truncate">{item.name}</span>}
                      </div>
                      {isExpanded && item.badge && (
                        <span
                          className={cn(
                            "text-[10px] px-1.5 py-0.5 rounded font-mono shrink-0 border",
                            item.badgeColor || "bg-slate-100 text-slate-600 border-slate-200/60"
                          )}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            )}
          </div>
        )}

        {/* 3. MANAGEMENT TOGGLE SLIDE BAR */}
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => {
              if (!isExpanded) setIsPinned(true);
              setManagementOpen(!managementOpen);
            }}
            className={cn(
              "w-full flex items-center rounded-lg px-2 py-1.5 transition-colors text-left cursor-pointer",
              isExpanded ? "justify-between hover:bg-slate-100/70" : "justify-center hover:bg-slate-100/70",
              isManagementPath ? "bg-slate-100/50" : ""
            )}
            title="Toggle Management Menu"
          >
            <div className="flex items-center gap-2 min-w-0">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-600 shrink-0" />
              {isExpanded && (
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 truncate">
                  {t("Management")}
                </span>
              )}
            </div>
            {isExpanded && (
              <span className="text-slate-400">
                {managementOpen ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
              </span>
            )}
          </button>

          {managementOpen && (
            <nav className="space-y-0.5 pt-0.5 animate-in fade-in-50 duration-150">
              {managementNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.href === "/settings" && pathname === "/settings");
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    title={!isExpanded ? t(item.name) : undefined}
                    className={cn(
                      "flex items-center rounded-md text-xs font-medium transition-all group",
                      isExpanded
                        ? "justify-between px-2.5 py-1.5"
                        : "justify-center p-2",
                      isActive
                        ? "bg-slate-100 text-slate-900 font-semibold"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        className={cn(
                          "w-3.5 h-3.5 shrink-0",
                          isActive ? "text-slate-900" : "text-slate-400 group-hover:text-slate-700"
                        )}
                      />
                      {isExpanded && <span className="truncate">{t(item.name)}</span>}
                    </div>
                    {isExpanded && item.badge && (
                      <span
                        className={cn(
                          "text-[10px] px-1.5 py-0.5 rounded font-mono shrink-0 border",
                          item.badgeColor || "bg-slate-100 text-slate-600 border-slate-200/60"
                        )}
                      >
                        {t(item.badge)}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          )}
        </div>

        {/* 4. Station Info Links (Station Profile & Officer Roster) */}
        <div className="pt-2 border-t border-slate-200/70 space-y-1">
          <button
            type="button"
            onClick={() => {
              if (!isExpanded) setIsPinned(true);
              setStationInfoOpen(!stationInfoOpen);
            }}
            className={cn(
              "w-full flex items-center rounded-lg px-2 py-1.5 transition-colors text-left cursor-pointer",
              isExpanded ? "justify-between hover:bg-slate-100/70" : "justify-center hover:bg-slate-100/70",
              (pathname === "/station-profile" || pathname === "/users") ? "bg-slate-100/50" : ""
            )}
            title="Toggle Station Info Menu"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Building2 className="w-3.5 h-3.5 text-slate-600 shrink-0" />
              {isExpanded && (
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 truncate">
                  {t("Station Info")}
                </span>
              )}
            </div>
            {isExpanded && (
              <span className="text-slate-400">
                {stationInfoOpen ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
              </span>
            )}
          </button>

          {stationInfoOpen && (
            <nav className="space-y-0.5 pt-0.5 animate-in fade-in-50 duration-150">
              <Link
                href="/station-profile"
                title={!isExpanded ? t("Station Profile") : undefined}
                className={cn(
                  "flex items-center rounded-md text-xs font-medium transition-all group",
                  isExpanded ? "justify-between px-2.5 py-1.5" : "justify-center p-2",
                  pathname === "/station-profile"
                    ? "bg-slate-100 text-slate-900 font-semibold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Building2 className={cn("w-3.5 h-3.5 shrink-0", pathname === "/station-profile" ? "text-slate-900" : "text-slate-400 group-hover:text-slate-700")} />
                  {isExpanded && <span className="truncate">{t("Station Profile")}</span>}
                </div>
              </Link>
              <Link
                href="/users"
                title={!isExpanded ? t("Officer Roster") : undefined}
                className={cn(
                  "flex items-center rounded-md text-xs font-medium transition-all group",
                  isExpanded ? "justify-between px-2.5 py-1.5" : "justify-center p-2",
                  pathname === "/users"
                    ? "bg-slate-100 text-slate-900 font-semibold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Users className={cn("w-3.5 h-3.5 shrink-0", pathname === "/users" ? "text-slate-900" : "text-slate-400 group-hover:text-slate-700")} />
                  {isExpanded && <span className="truncate">{t("Officer Roster")}</span>}
                </div>
              </Link>
            </nav>
          )}
        </div>
      </div>
      {/* Footer / Logout */}
      <div className="p-2.5 border-t border-slate-200/70 bg-slate-50/50 overflow-hidden">
        <div
          className={cn(
            "flex items-center text-xs text-slate-500",
            isExpanded ? "justify-between px-1.5 py-1" : "justify-center"
          )}
        >
          {isExpanded && (
            <div className="flex items-center gap-1.5 text-[11px] animate-in fade-in duration-150">
              <span className="font-medium text-slate-600">{t("Haryana Police IT")}</span>
            </div>
          )}
          <button
            onClick={logout}
            title={t("Sign Out")}
            className="text-slate-400 hover:text-slate-800 transition-colors p-1"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
