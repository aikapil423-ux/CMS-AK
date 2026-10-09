"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Shield,
  FileText,
  PlusCircle,
  BookOpen,
  UserCheck,
  Building2,
  Users,
  LogOut,
  ChevronRight,
  ChevronDown,
  Clock,
  Car,
  Package,
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
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
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

  // State for hover-to-expand and optional lock pin
  const [isHovered, setIsHovered] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const isExpanded = isHovered || isPinned;

  // Toggle slide bar states for Roznamcha, Complaints, FIR, and Management
  const [roznamchaOpen, setRoznamchaOpen] = useState(true);
  const [complaintsOpen, setComplaintsOpen] = useState(true);
  const [firOpen, setFirOpen] = useState(true);
  const [managementOpen, setManagementOpen] = useState(true);

  // Detect active module
  const isRoznamchaPath = pathname.startsWith("/general-diary");
  const isFirPath = pathname.startsWith("/fir") || pathname.startsWith("/fir-workspace");
  const isComplaintsPath = !isFirPath && (pathname.startsWith("/complaints") || pathname.startsWith("/enquiry-workspace"));
  const isManagementPath = pathname.startsWith("/settings");

  // Keep track of the last active module so when user is on /station-profile or /users,
  // ONLY the module that was currently open remains visible.
  const [activeModule, setActiveModule] = useState<"ROZNAMCHA" | "COMPLAINTS" | "FIR">("COMPLAINTS");

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
    } else {
      try {
        const saved = window.localStorage.getItem("cms_active_module");
        if (saved === "ROZNAMCHA" || saved === "COMPLAINTS" || saved === "FIR") {
          setActiveModule(saved);
        }
      } catch {}
    }
  }, [pathname, isRoznamchaPath, isComplaintsPath, isFirPath]);

  // Check if user is on portal home page (Select Operational Module)
  const isPortalHome = pathname === "/";

  // Determine which module to display in the toggle slide bar (on portal home, only Management & Settings is shown)
  const showRoznamcha = !isPortalHome && (isRoznamchaPath || (!isComplaintsPath && !isFirPath && activeModule === "ROZNAMCHA"));
  const showComplaints = !isPortalHome && (isComplaintsPath || (!isRoznamchaPath && !isFirPath && activeModule === "COMPLAINTS"));
  const showFir = !isPortalHome && (isFirPath || (!isRoznamchaPath && !isComplaintsPath && activeModule === "FIR"));

  // ROZNAMCHA GD NAVIGATION ITEMS (Smart General Diary - English Only)
  const roznamchaNavItems: NavItem[] = [
    { name: "Smart General Diary", href: "/general-diary", icon: BookOpen, badge: "PPR 22.48", badgeColor: "bg-slate-100 text-slate-600 border-slate-200/60" },
    { name: "Add New GD Entry", href: "/general-diary/new", icon: PlusCircle },
    { name: "ACT and SECTIONs", href: "/acts-sections", icon: Scale, badge: "Bare Acts", badgeColor: "bg-slate-100 text-slate-600 border-slate-200/60" },
    { name: "Auto-Suggestions & Drafts", href: "/general-diary?tab=SUGGESTIONS_DRAFTS", icon: Sparkles, badge: "AI Review", badgeColor: "bg-slate-100 text-slate-600 border-slate-200/60" },
    { name: "Departure & Return", href: "/general-diary?type=RAVANGI_OFFICER", icon: Clock },
    { name: "Patrol & Night Vigilance", href: "/general-diary?type=BEAT_PATROLLING", icon: Car },
    { name: "Malkhana & Property", href: "/general-diary?type=PROPERTY_DEPOSIT", icon: Package },
    { name: "Station Diary Opening", href: "/general-diary?type=AAGAZ_ROZNAMCHA", icon: Clock },
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
    { name: "Register FIR", href: "/fir/register", icon: PlusCircle, badge: "u/s 173 BNSS", badgeColor: "bg-slate-100 text-slate-600 border-slate-200/60" },
    { name: "Investigation Workspace", href: "/fir-workspace", icon: UserCheck },
    { name: "ACT and SECTIONs", href: "/acts-sections", icon: Scale, badge: "Bare Acts", badgeColor: "bg-slate-100 text-slate-600 border-slate-200/60" },
  ];

  // MANAGEMENT NAVIGATION ITEMS (Settings Only in Slide Bar)
  const managementNavItems: NavItem[] = [
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
                  Haryana Police
                </span>
              </div>
              <h1 className="text-xs font-semibold text-slate-900 tracking-tight truncate">Case Management</h1>
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
          title="Main Module Selector"
          className={cn(
            "flex items-center rounded-md bg-white hover:bg-slate-100/80 text-slate-700 hover:text-slate-900 border border-slate-200/70 transition-colors",
            isExpanded ? "justify-between px-2.5 py-1.5 text-xs font-medium" : "justify-center p-2"
          )}
        >
          <div className="flex items-center gap-2">
            <LayoutGrid className="w-3.5 h-3.5 text-slate-600 shrink-0" />
            {isExpanded && <span className="truncate">Modules Portal</span>}
          </div>
          {isExpanded && <span className="text-[10px] text-slate-400 shrink-0">&larr; Switch</span>}
        </Link>
      </div>



      {/* Navigation Links: Module specific isolation */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-3">
        {/* 1. ROZNAMCHA GD TOGGLE SLIDE BAR (Only visible if Roznamcha is open/active) */}
        {showRoznamcha && (
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => setRoznamchaOpen(!roznamchaOpen)}
              className={cn(
                "w-full flex items-center rounded-lg px-2 py-1.5 transition-colors text-left",
                isExpanded ? "justify-between hover:bg-slate-100/70" : "justify-center hover:bg-slate-100/70",
                isRoznamchaPath ? "bg-slate-100/50" : ""
              )}
              title="Toggle Roznamcha GD Menu"
            >
              <div className="flex items-center gap-2 min-w-0">
                <BookOpen className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                {isExpanded && (
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 truncate">
                    Roznamcha GD
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

        {/* 2. COMPLAINTS TOGGLE SLIDE BAR (Only visible if Complaints is open/active) */}
        {showComplaints && (
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => setComplaintsOpen(!complaintsOpen)}
              className={cn(
                "w-full flex items-center rounded-lg px-2 py-1.5 transition-colors text-left",
                isExpanded ? "justify-between hover:bg-slate-100/70" : "justify-center hover:bg-slate-100/70",
                isComplaintsPath ? "bg-slate-100/50" : ""
              )}
              title="Toggle Complaints Menu"
            >
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                {isExpanded && (
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 truncate">
                    Complaints
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

        {/* 2.5. FIR TOGGLE SLIDE BAR (Only visible if FIR is open/active) */}
        {showFir && (
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => setFirOpen(!firOpen)}
              className={cn(
                "w-full flex items-center rounded-lg px-2 py-1.5 transition-colors text-left",
                isExpanded ? "justify-between hover:bg-slate-100/70" : "justify-center hover:bg-slate-100/70",
                isFirPath ? "bg-slate-100/50" : ""
              )}
              title="Toggle FIR Menu"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Scale className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                {isExpanded && (
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 truncate">
                    FIR
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
            onClick={() => setManagementOpen(!managementOpen)}
            className={cn(
              "w-full flex items-center rounded-lg px-2 py-1.5 transition-colors text-left",
              isExpanded ? "justify-between hover:bg-slate-100/70" : "justify-center hover:bg-slate-100/70",
              isManagementPath ? "bg-slate-100/50" : ""
            )}
            title="Toggle Management Menu"
          >
            <div className="flex items-center gap-2 min-w-0">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-600 shrink-0" />
              {isExpanded && (
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 truncate">
                  Management
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

        {/* 4. Station Info Links (Station Profile & Officer Roster) */}
        <div className="pt-2 border-t border-slate-200/70">
          {isExpanded && (
            <div className="px-2 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 animate-in fade-in duration-150">
              Station Info
            </div>
          )}
          <nav className="space-y-0.5">
            <Link
              href="/station-profile"
              title={!isExpanded ? "Station Profile" : undefined}
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
                {isExpanded && <span className="truncate">Station Profile</span>}
              </div>
            </Link>
            <Link
              href="/users"
              title={!isExpanded ? "Officer Roster" : undefined}
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
                {isExpanded && <span className="truncate">Officer Roster</span>}
              </div>
            </Link>
          </nav>
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
              <span className="font-medium text-slate-600">Haryana Police IT</span>
            </div>
          )}
          <button
            onClick={logout}
            title="Sign Out"
            className="text-slate-400 hover:text-slate-800 transition-colors p-1"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
