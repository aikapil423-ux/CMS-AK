"use client";

import React, { useState } from "react";
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

  // Toggle slide bar states for Roznamcha and Complaints (always keep accessible, never hide)
  const [roznamchaOpen, setRoznamchaOpen] = useState(true);
  const [complaintsOpen, setComplaintsOpen] = useState(true);

  // Detect active module
  const isRoznamcha = pathname.startsWith("/general-diary");
  const isComplaints = pathname.startsWith("/complaints") || pathname.startsWith("/enquiry-workspace");

  // ROZNAMCHA GD NAVIGATION ITEMS
  const roznamchaNavItems: NavItem[] = [
    { name: "Daily Roznamcha Aam", href: "/general-diary", icon: BookOpen, badge: "4 Today", badgeColor: "bg-blue-50 text-blue-700 border-blue-200" },
    { name: "New Roznamcha Entry", href: "/general-diary/new", icon: PlusCircle },
    { name: "Shift Turnover / Relief", href: "/general-diary?type=SHIFT_RELIEF_TURNOVER", icon: Clock },
    { name: "Patrol & Night Domination", href: "/general-diary?type=PATROL_DEPARTURE_RETURN", icon: Car },
    { name: "Malkhana & Property", href: "/general-diary?type=SEIZURE_MUDDMAL", icon: Package },
    { name: "Station Diary Opening", href: "/general-diary?type=OPENING_OF_DIARY", icon: Clock },
  ];

  // COMPLAINTS NAVIGATION ITEMS (Cleaned: Hidden Draft reports/NCR, Notice templates, CM Window, Under approval queue)
  const complaintNavItems: NavItem[] = [
    { name: "Complaints Register", href: "/complaints", icon: FileText, badge: "6 Active", badgeColor: "bg-blue-50 text-blue-700 border-blue-200" },
    { name: "Register New Complaint", href: "/complaints/register", icon: PlusCircle },
    { name: "Field Enquiry Workspace", href: "/enquiry-workspace", icon: UserCheck },
    { name: "Disposed Complaints", href: "/complaints?status=DISPOSED_CIVIL_NATURE", icon: Clock },
  ];

  return (
    <aside
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "hidden lg:flex lg:flex-col bg-white border-r border-slate-200 text-slate-700 select-none shrink-0 h-screen sticky top-0 transition-all duration-300 ease-in-out z-40 shadow-xs",
        isExpanded ? "w-72 shadow-xl" : "w-20"
      )}
    >
      {/* Insignia / Brand Header - Clean White & Blue */}
      <div className="p-3.5 border-b border-slate-200 bg-white flex items-center justify-between overflow-hidden">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs shrink-0"
            title="Haryana Police CMS"
          >
            <Shield className="w-5 h-5" />
          </div>
          {isExpanded && (
            <div className="flex-1 min-w-0 animate-in fade-in duration-200">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold tracking-wider text-blue-700 uppercase">
                  Haryana Police
                </span>
              </div>
              <h1 className="text-xs font-bold text-slate-900 tracking-tight truncate">Case Management</h1>
              <p className="text-[11px] text-slate-500 truncate">{currentUser.stationName}</p>
            </div>
          )}
        </div>

        {/* Pin / Unpin button when expanded */}
        {isExpanded && (
          <button
            onClick={() => setIsPinned(!isPinned)}
            className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            title={isPinned ? "Unpin sidebar (auto-collapse)" : "Pin sidebar open"}
          >
            {isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>

      {/* PORTAL SWITCHER - ALWAYS VISIBLE */}
      <div className="p-2.5 bg-slate-50 border-b border-slate-200 overflow-hidden">
        <Link
          href="/"
          title="Main Module Selector"
          className={cn(
            "flex items-center rounded-lg bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 transition-colors shadow-2xs",
            isExpanded ? "justify-between px-3 py-2 text-xs font-semibold" : "justify-center p-2.5"
          )}
        >
          <div className="flex items-center gap-2">
            <LayoutGrid className="w-4 h-4 text-blue-600 shrink-0" />
            {isExpanded && <span className="truncate">Main Module Selector</span>}
          </div>
          {isExpanded && <span className="text-[10px] text-slate-400 shrink-0">&larr; Switch</span>}
        </Link>
      </div>

      {/* Officer Profile Strip */}
      <div
        className={cn(
          "bg-white border-b border-slate-100 flex items-center overflow-hidden transition-all",
          isExpanded ? "px-3.5 py-2.5 justify-between" : "p-2.5 justify-center"
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-bold text-xs flex items-center justify-center shrink-0 border border-blue-200"
            title={`${currentUser.name} (${currentUser.roleDisplay})`}
          >
            {currentUser.name.split(" ")[1]?.slice(0, 2) || currentUser.name.slice(0, 2)}
          </div>
          {isExpanded && (
            <div className="min-w-0 animate-in fade-in duration-200">
              <p className="font-bold text-slate-800 truncate text-[11px]">{currentUser.name}</p>
              <span className="text-[10px] text-slate-500 font-medium block truncate">
                {currentUser.roleDisplay}
              </span>
            </div>
          )}
        </div>
        {isExpanded && (
          <span className="text-[10px] text-slate-400 font-mono shrink-0">PNO: {currentUser.pno}</span>
        )}
      </div>

      {/* Navigation Links: Module specific isolation */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-3">
        {/* 1. ROZNAMCHA GD TOGGLE SLIDE BAR (Visible in Roznamcha module OR in general/station-profile pages) */}
        {(isRoznamcha || (!isComplaints && !isRoznamcha)) && (
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => setRoznamchaOpen(!roznamchaOpen)}
              className={cn(
                "w-full flex items-center rounded-lg px-2 py-1.5 transition-colors text-left",
                isExpanded ? "justify-between hover:bg-slate-100" : "justify-center hover:bg-slate-100",
                isRoznamcha ? "bg-blue-50/70" : ""
              )}
              title="Toggle Roznamcha GD Menu"
            >
              <div className="flex items-center gap-2 min-w-0">
                <BookOpen className="w-4 h-4 text-blue-600 shrink-0" />
                {isExpanded && (
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-800 truncate">
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
                        "flex items-center rounded-lg text-xs font-medium transition-all group",
                        isExpanded
                          ? "justify-between px-3 py-2"
                          : "justify-center p-2.5",
                        isActive
                          ? "bg-blue-50 text-blue-700 font-bold border-l-3 border-blue-600 shadow-2xs"
                          : "text-slate-600 hover:bg-slate-50 hover:text-blue-600"
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon
                          className={cn(
                            "w-4 h-4 shrink-0",
                            isActive ? "text-blue-600" : "text-slate-400 group-hover:text-blue-600"
                          )}
                        />
                        {isExpanded && <span className="truncate">{item.name}</span>}
                      </div>
                      {isExpanded && item.badge && (
                        <span
                          className={cn(
                            "text-[10px] px-1.5 py-0.5 rounded font-mono shrink-0 border",
                            item.badgeColor || "bg-blue-50 text-blue-700 border-blue-200"
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

        {/* 2. COMPLAINTS TOGGLE SLIDE BAR (Visible in Complaints module OR in general/station-profile pages) */}
        {(isComplaints || (!isComplaints && !isRoznamcha)) && (
          <div className={cn("space-y-1", !isComplaints && "pt-1 border-t border-slate-100")}>
            <button
              type="button"
              onClick={() => setComplaintsOpen(!complaintsOpen)}
              className={cn(
                "w-full flex items-center rounded-lg px-2 py-1.5 transition-colors text-left",
                isExpanded ? "justify-between hover:bg-slate-100" : "justify-center hover:bg-slate-100",
                isComplaints ? "bg-blue-50/70" : ""
              )}
              title="Toggle Complaints Menu"
            >
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                {isExpanded && (
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-800 truncate">
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
                        "flex items-center rounded-lg text-xs font-medium transition-all group",
                        isExpanded
                          ? "justify-between px-3 py-2"
                          : "justify-center p-2.5",
                        isActive
                          ? "bg-blue-50 text-blue-700 font-bold border-l-3 border-blue-600 shadow-2xs"
                          : "text-slate-600 hover:bg-slate-50 hover:text-blue-600"
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon
                          className={cn(
                            "w-4 h-4 shrink-0",
                            isActive ? "text-blue-600" : "text-slate-400 group-hover:text-blue-600"
                          )}
                        />
                        {isExpanded && <span className="truncate">{item.name}</span>}
                      </div>
                      {isExpanded && item.badge && (
                        <span
                          className={cn(
                            "text-[10px] px-1.5 py-0.5 rounded font-mono shrink-0 border",
                            item.badgeColor || "bg-blue-50 text-blue-700 border-blue-200"
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

        {/* 3. Station Info Links (Station Profile & Officer Roster) */}
        <div className="pt-2 border-t border-slate-200">
          {isExpanded && (
            <div className="px-2 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 animate-in fade-in duration-200">
              Station Info
            </div>
          )}
          <nav className="space-y-1">
            <Link
              href="/station-profile"
              title={!isExpanded ? "Station Profile" : undefined}
              className={cn(
                "flex items-center rounded-lg text-xs font-medium transition-all group",
                isExpanded ? "justify-between px-3 py-2" : "justify-center p-2.5",
                pathname === "/station-profile"
                  ? "bg-blue-50 text-blue-800 font-bold border-l-3 border-blue-600"
                  : "text-slate-600 hover:bg-slate-50 hover:text-blue-700"
              )}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Building2 className={cn("w-4 h-4 shrink-0", pathname === "/station-profile" ? "text-blue-600" : "text-slate-400 group-hover:text-blue-600")} />
                {isExpanded && <span className="truncate">Station Profile</span>}
              </div>
            </Link>
            <Link
              href="/users"
              title={!isExpanded ? "Officer Roster" : undefined}
              className={cn(
                "flex items-center rounded-lg text-xs font-medium transition-all group",
                isExpanded ? "justify-between px-3 py-2" : "justify-center p-2.5",
                pathname === "/users"
                  ? "bg-blue-50 text-blue-800 font-bold border-l-3 border-blue-600"
                  : "text-slate-600 hover:bg-slate-50 hover:text-blue-700"
              )}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Users className={cn("w-4 h-4 shrink-0", pathname === "/users" ? "text-blue-600" : "text-slate-400 group-hover:text-blue-600")} />
                {isExpanded && <span className="truncate">Officer Roster</span>}
              </div>
            </Link>
          </nav>
        </div>
      </div>
      {/* Footer / Logout */}
      <div className="p-3 border-t border-slate-200 bg-slate-50/70 overflow-hidden">
        <div
          className={cn(
            "flex items-center text-xs text-slate-500",
            isExpanded ? "justify-between px-2 py-1" : "justify-center"
          )}
        >
          {isExpanded && (
            <div className="flex items-center gap-1.5 text-[11px] animate-in fade-in duration-200">
              <span className="font-semibold text-blue-700">Haryana Police IT</span>
            </div>
          )}
          <button
            onClick={logout}
            title="Sign Out"
            className="text-slate-400 hover:text-red-600 transition-colors p-1"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
