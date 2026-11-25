"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
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
  Pin,
  PinOff,
  FileCheck2,
  FilePenLine,
  Sparkles,
  Settings,
  ListFilter,
  SlidersHorizontal,
  Scale,
  HardDrive,
  ReceiptText,
  ClipboardList,
  FileBarChart,
  Radio,
  Pencil,
  MapPin,
  UserPlus,
  FolderTree,
  BadgeCheck,
  Building,
  Clock,
  Layers,
  Landmark,
  ShieldAlert,
  Train,
  FlaskConical,
  Briefcase,
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

const prosecutionNavItems: NavItem[] = [
  { name: "Challan Scrutiny", href: "/prosecution?tab=challan_scrutiny&subtab=scrutiny_perform", icon: FileCheck2 },
  { name: "Courts & Bail", href: "/prosecution?tab=courts&subtab=bail_reply", icon: Landmark },
  { name: "IIF-VI", href: "/prosecution/iif-vi", icon: ClipboardList },
  { name: "IIF-VII", href: "/prosecution/iif-vii", icon: ClipboardList },
  { name: "ACT and SECTIONs", href: "/acts-sections", icon: Scale },
];

const auditsNavItems: NavItem[] = [
  { name: "Audits Overview", href: "/audits", icon: Pencil },
  { name: "Complaint Audit", href: "/audits?tab=Complaint%20Audit", icon: FileText },
  { name: "FIR Audit", href: "/audits?tab=FIR%20Audit", icon: Scale },
  { name: "Court Audit", href: "/audits?tab=Court%20Audit", icon: Landmark },
  { name: "Pendency Analysis", href: "/audits?tab=Pendency%20Analysis", icon: Clock },
];

export function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { currentUser, sessionUser, logout, isViewAs } = useAuth();
  const { t } = useLanguage();

  const isDeveloperAdmin =
    (sessionUser?.id === "cms_developer_admin" || currentUser?.role === "SUPER_ADMIN") && !isViewAs;

  // State for hover-to-expand and optional lock pin
  const [isHovered, setIsHovered] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const isExpanded = isHovered || isPinned;
  const [showSignOutModal, setShowSignOutModal] = useState(false);

  // Detect active module
  const isRoznamchaPath = pathname.startsWith("/general-diary");
  const isFirPath = pathname.startsWith("/fir") || pathname.startsWith("/fir-workspace");
  const isComplaintsPath = !isFirPath && (pathname.startsWith("/complaints") || pathname.startsWith("/enquiry-workspace"));
  const isRegistrationsPath = pathname.startsWith("/registrations");
  const isReportsPath = pathname.startsWith("/reports");
  const isProsecutionPath = pathname.startsWith("/prosecution") || pathname.startsWith("/acts-sections");
  const isTelecomPath = pathname.startsWith("/telecom");
  const isAuditsPath = pathname.startsWith("/audits");
  const isManagementPath = pathname.startsWith("/settings") || pathname.startsWith("/tada");
  const isLocationsPath = pathname.startsWith("/admin/locations");
  const isAccountsPath = pathname.startsWith("/admin/accounts");

  // User manual toggle overrides for module accordions
  const [toggledModules, setToggledModules] = useState<Record<string, boolean>>({});

  const isModuleOpen = (id: string, isPathActive: boolean) => {
    if (toggledModules[id] !== undefined) {
      return toggledModules[id];
    }
    return isPathActive;
  };

  const toggleModule = (id: string, isPathActive: boolean) => {
    setToggledModules((prev) => ({
      ...prev,
      [id]: !(prev[id] !== undefined ? prev[id] : isPathActive),
    }));
  };

  const openModule = (id: string) => {
    setToggledModules((prev) => ({
      ...prev,
      [id]: true,
    }));
  };

  const [managementOpen, setManagementOpen] = useState(isManagementPath);
  const [stationInfoOpen, setStationInfoOpen] = useState(pathname === "/station-profile" || pathname === "/users");
  const [locationsOpen, setLocationsOpen] = useState(isLocationsPath);
  const [accountsOpen, setAccountsOpen] = useState(isAccountsPath);

  // Helper to render nested sub-items
  const renderSubItem = (item: NavItem) => {
    const Icon = item.icon;
    let isActive = false;
    if (item.href.includes("?")) {
      const [itemPath, itemQuery] = item.href.split("?");
      const params = new URLSearchParams(itemQuery);
      const itemTab = params.get("tab");
      const itemSubtab = params.get("subtab");
      const currentTab = searchParams.get("tab");
      const currentSubtab = searchParams.get("subtab");

      if (pathname === itemPath) {
        if (itemSubtab) {
          isActive = currentTab === itemTab && currentSubtab === itemSubtab;
        } else if (itemTab) {
          isActive = currentTab === itemTab;
        }
      }
    } else {
      if (pathname === item.href) {
        if (
          item.href === "/prosecution" ||
          item.href === "/reports" ||
          item.href === "/general-diary" ||
          item.href === "/audits"
        ) {
          isActive = !searchParams.get("tab");
        } else {
          isActive = true;
        }
      }
    }

    return (
      <Link
        key={item.name + item.href}
        href={item.href}
        aria-current={isActive ? "page" : undefined}
        title={!isExpanded ? t(item.name) : undefined}
        className={cn(
          "flex items-center rounded-md text-xs font-medium transition-all group",
          isExpanded ? "justify-between px-2.5 py-1.5" : "justify-center p-2",
          isActive
            ? "bg-[#203c88] text-white font-semibold shadow-2xs"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        )}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Icon
            className={cn(
              "w-3.5 h-3.5 shrink-0 transition-colors",
              isActive ? "text-white" : "text-slate-400 group-hover:text-slate-700"
            )}
          />
          {isExpanded && <span className="truncate">{t(item.name)}</span>}
        </div>
        {isExpanded && item.badge && (
          <span
            className={cn(
              "text-[9.5px] px-1.5 py-0.2 rounded font-mono shrink-0 border ml-1",
              isActive
                ? "bg-white/20 text-white border-white/30"
                : item.badgeColor || "bg-slate-100 text-slate-600 border-slate-200/60"
            )}
          >
            {t(item.badge)}
          </span>
        )}
      </Link>
    );
  };

  // Helper to render module section accordion
  const renderModuleSection = ({
    id,
    name,
    href,
    icon: Icon,
    isPathActive,
    items,
  }: {
    id: string;
    name: string;
    href: string;
    icon: React.ElementType;
    isPathActive: boolean;
    items?: NavItem[];
  }) => {
    const hasItems = !!(items && items.length > 0);
    const isOpen = hasItems && isModuleOpen(id, isPathActive);
    return (
      <div key={id} className="space-y-0.5">
        <div
          className={cn(
            "w-full flex items-center rounded-lg transition-colors text-left group",
            isExpanded ? "justify-between px-2 py-1.5" : "justify-center p-2",
            isPathActive
              ? "bg-slate-100/90 font-semibold text-slate-900"
              : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
          )}
        >
          <Link
            href={href}
            onClick={() => {
              if (hasItems) openModule(id);
              if (!isExpanded) setIsPinned(true);
            }}
            title={!isExpanded ? t(name) : undefined}
            className={cn(
              "flex items-center gap-2.5 min-w-0",
              isExpanded ? "flex-1 py-0.5" : "justify-center"
            )}
          >
            <Icon
              className={cn(
                "w-4 h-4 shrink-0 transition-colors",
                isPathActive ? "text-[#203c88]" : "text-slate-500 group-hover:text-slate-800"
              )}
            />
            {isExpanded && (
              <span className="text-xs font-semibold truncate tracking-tight">
                {t(name)}
              </span>
            )}
          </Link>
          {isExpanded && hasItems && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleModule(id, isPathActive);
              }}
              className="p-1 rounded text-slate-400 hover:text-slate-800 hover:bg-slate-200/60 transition-colors cursor-pointer"
              title={isOpen ? "Collapse" : "Expand"}
            >
              {isOpen ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>
          )}
        </div>

        {isOpen && isExpanded && hasItems && (
          <div className="ml-3 pl-2.5 border-l-2 border-slate-200/90 space-y-0.5 pt-0.5 animate-in fade-in-50 duration-150">
            {items.map(renderSubItem)}
          </div>
        )}
      </div>
    );
  };

  // ROZNAMCHA GD NAVIGATION ITEMS (Smart General Diary - English Only)
  const roznamchaNavItems: NavItem[] = [
    { name: "Smart General Diary", href: "/general-diary", icon: BookOpen },
    { name: "Auto-Suggestions & Drafts", href: "/general-diary?tab=SUGGESTIONS_DRAFTS", icon: Sparkles },
  ];

  // COMPLAINTS NAVIGATION ITEMS
  const complaintNavItems: NavItem[] = [
    { name: "Complaints Register", href: "/complaints", icon: FileText },
    { name: "Register Complaint", href: "/complaints/register", icon: FileText, badge: "New", badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    { name: "Field Enquiry Workspace", href: "/enquiry-workspace", icon: UserCheck },
  ];

  // FIR NAVIGATION ITEMS (Complete Parity with Complaints module)
  const firNavItems: NavItem[] = [
    { name: "FIR Register", href: "/fir", icon: Scale, badge: "Part A", badgeColor: "bg-slate-100 text-slate-600 border-slate-200/60" },
    { name: "Register FIR", href: "/fir/register", icon: FilePenLine, badge: "New", badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    { name: "FIR Part B", href: "/fir/part-b", icon: FileCheck2 },
    { name: "Complete cases", href: "/fir/complete-cases", icon: CheckCircle2 },
    { name: "Investigation Workspace", href: "/fir-workspace", icon: UserCheck },
  ];

  // REGISTRATIONS NAVIGATION ITEMS (Clean slide bar: category tabs managed inside the module)
  const registrationsNavItems: NavItem[] = [
    { name: "Registrations Register", href: "/registrations", icon: ClipboardList },
  ];

  // MANAGEMENT NAVIGATION ITEMS (Settings & Dropdown Manager in Slide Bar)
  const managementNavItems: NavItem[] = [
    { name: "TA DA Form", href: "/tada", icon: ReceiptText },
    { name: "Storage Optimization", href: "/settings?tab=storage-optimization", icon: HardDrive },
    { name: "Dropdown Manager", href: "/settings?tab=dropdowns", icon: ListFilter },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  // DEVELOPER ONLY: LOCATION & ORGANIZATION MANAGEMENT
  const locationNavItems: NavItem[] = [
    { name: "Location Dashboard", href: "/admin/locations", icon: Layers },
    { name: "State Management", href: "/admin/locations?tab=states", icon: MapPin },
    { name: "Range Management", href: "/admin/locations?tab=ranges", icon: Radio },
    { name: "Commissionerate & Zones", href: "/admin/locations?tab=commissionerates", icon: Landmark, badge: "Zones", badgeColor: "bg-blue-100 text-blue-800 border-blue-200" },
    { name: "District Management", href: "/admin/locations?tab=districts", icon: Building2 },
    { name: "Armed Police (HAP/IRB)", href: "/admin/locations?tab=armed-police", icon: ShieldAlert, badge: "Bn", badgeColor: "bg-purple-100 text-purple-800 border-purple-200" },
    { name: "GRP Haryana (Railways)", href: "/admin/locations?tab=grp", icon: Train },
    { name: "Forensic Labs & Training", href: "/admin/locations?tab=forensic-labs", icon: FlaskConical },
    { name: "Deputation & Special Wings", href: "/admin/locations?tab=deputation-units", icon: Briefcase },
    { name: "Office Management", href: "/admin/locations?tab=offices", icon: Building },
    { name: "Police Station Management", href: "/admin/locations?tab=stations", icon: Shield },
    { name: "Unit Management", href: "/admin/locations?tab=units", icon: Radio },
    { name: "Organizational Hierarchy", href: "/admin/locations?tab=hierarchy", icon: FolderTree },
  ];

  // DEVELOPER ONLY: ACCOUNT MANAGEMENT & USER GENERATION
  const accountNavItems: NavItem[] = [
    { name: "Account Directory", href: "/admin/accounts", icon: Users },
    { name: "Generate Account", href: "/admin/accounts?tab=new", icon: UserPlus, badge: "New", badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200" },
    { name: "Special Allocations", href: "/admin/accounts?tab=special-allocations", icon: BadgeCheck },
    { name: "Jurisdiction Policies", href: "/admin/accounts?tab=policies", icon: Shield },
    { name: "Audit Logs", href: "/admin/accounts?tab=audits", icon: Clock },
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
      <div className="cms-sidebar-brand p-3 border-b border-slate-200/80 flex items-center justify-between overflow-hidden">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="relative w-10 h-12 overflow-hidden shrink-0"
            title="Haryana Police CMS"
          >
            <img
              src="/haryana-police-sidebar-reference.png"
              alt="Haryana Police"
              width={104}
              height={66}
              className="absolute max-w-none"
              style={{ width: 104, height: 66, left: -47, top: -10 }}
            />
          </div>
          {isExpanded && (
            <div className="cms-sidebar-brand-text flex-1 min-w-0 animate-in fade-in duration-150">
              <h1>CMS</h1>
              <p>Haryana Police</p>
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

      {/* Navigation Links: Module specific isolation */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-3">
        {/* OPERATIONAL MODULES (All 8 Modules permanently listed with expandable nested sub-tabs) */}
        <div className="space-y-1">
          {isExpanded && (
            <div className="px-2 pt-1 pb-1 text-[10.5px] font-bold tracking-wider text-slate-400 uppercase flex items-center justify-between">
              <span>{t("Operational Modules") || "OPERATIONAL MODULES"}</span>
              <span className="text-[9px] bg-slate-100 text-slate-500 font-mono px-1.5 py-0.2 rounded border border-slate-200/70">8</span>
            </div>
          )}

          {/* 1. Roznamcha GD */}
          {renderModuleSection({
            id: "roznamcha",
            name: "Roznamcha GD",
            href: "/general-diary",
            icon: BookOpen,
            isPathActive: isRoznamchaPath,
            items: roznamchaNavItems,
          })}

          {/* 2. Complaints */}
          {renderModuleSection({
            id: "complaints",
            name: "Complaints",
            href: "/complaints",
            icon: FileText,
            isPathActive: isComplaintsPath,
            items: complaintNavItems,
          })}

          {/* 3. FIR Register */}
          {renderModuleSection({
            id: "fir",
            name: "FIR Register",
            href: "/fir",
            icon: Scale,
            isPathActive: isFirPath,
            items: firNavItems,
          })}

          {/* 4. Registrations */}
          {renderModuleSection({
            id: "registrations",
            name: "Registrations",
            href: "/registrations",
            icon: ClipboardList,
            isPathActive: isRegistrationsPath,
            items: registrationsNavItems,
          })}

          {/* 5. Reports & Audit */}
          {renderModuleSection({
            id: "reports",
            name: "Reports & Audit",
            href: "/reports",
            icon: FileBarChart,
            isPathActive: isReportsPath,
            items: [],
          })}

          {/* 6. Telecom Evidence Analysis */}
          {renderModuleSection({
            id: "telecom",
            name: "Telecom Evidence Analysis",
            href: "/telecom",
            icon: Radio,
            isPathActive: isTelecomPath,
            items: [],
          })}

          {/* 7. Prosecution & Courts */}
          {renderModuleSection({
            id: "prosecution",
            name: "Prosecution & Courts",
            href: "/prosecution",
            icon: Landmark,
            isPathActive: isProsecutionPath,
            items: prosecutionNavItems,
          })}

          {/* 8. Audits & Inspection */}
          {renderModuleSection({
            id: "audits",
            name: "Audits & Inspection",
            href: "/audits",
            icon: Pencil,
            isPathActive: isAuditsPath,
            items: auditsNavItems,
          })}
        </div>

        {/* DEVELOPER ONLY: LOCATION & ORGANIZATION MANAGEMENT */}
        {isDeveloperAdmin && (
          <div className="space-y-1 pt-1 border-t border-blue-200/60">
            <button
              type="button"
              onClick={() => {
                if (!isExpanded) setIsPinned(true);
                setLocationsOpen(!locationsOpen);
              }}
              className={cn(
                "w-full flex items-center rounded-lg px-2 py-1.5 transition-colors text-left cursor-pointer",
                isExpanded ? "justify-between hover:bg-blue-50/70" : "justify-center hover:bg-blue-50/70",
                isLocationsPath ? "bg-blue-50/70 text-[#1e3a8a]" : ""
              )}
              title="Location & Organization Management"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Building2 className="w-3.5 h-3.5 text-[#1e3a8a] shrink-0" />
                {isExpanded && (
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#1e3a8a] truncate">
                    {t("Location Management")}
                  </span>
                )}
              </div>
              {isExpanded && (
                <span className="text-slate-400">
                  {locationsOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </span>
              )}
            </button>

            {locationsOpen && (
              <nav className="space-y-0.5 pt-0.5 animate-in fade-in-50 duration-150">
                {locationNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href || (item.href === "/admin/locations" && pathname === "/admin/locations" && !searchParams.get("tab"));
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      title={!isExpanded ? t(item.name) : undefined}
                      className={cn(
                        "flex items-center rounded-md text-xs font-medium transition-all group",
                        isExpanded ? "justify-between px-2.5 py-1.5" : "justify-center p-2",
                        isActive
                          ? "bg-blue-900 text-white font-semibold"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon className={cn("w-3.5 h-3.5 shrink-0", isActive ? "text-white" : "text-slate-400 group-hover:text-slate-700")} />
                        {isExpanded && <span className="truncate">{t(item.name)}</span>}
                      </div>
                    </Link>
                  );
                })}
              </nav>
            )}
          </div>
        )}

        {/* DEVELOPER ONLY: ACCOUNT MANAGEMENT & USER GENERATION */}
        {isDeveloperAdmin && (
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => {
                if (!isExpanded) setIsPinned(true);
                setAccountsOpen(!accountsOpen);
              }}
              className={cn(
                "w-full flex items-center rounded-lg px-2 py-1.5 transition-colors text-left cursor-pointer",
                isExpanded ? "justify-between hover:bg-emerald-50/70" : "justify-center hover:bg-emerald-50/70",
                isAccountsPath ? "bg-emerald-50/70 text-emerald-900" : ""
              )}
              title="Account Management"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Users className="w-3.5 h-3.5 text-emerald-800 shrink-0" />
                {isExpanded && (
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 truncate">
                    {t("Account Management")}
                  </span>
                )}
              </div>
              {isExpanded && (
                <span className="text-slate-400">
                  {accountsOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </span>
              )}
            </button>

            {accountsOpen && (
              <nav className="space-y-0.5 pt-0.5 animate-in fade-in-50 duration-150">
                {accountNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href || (item.href === "/admin/accounts" && pathname === "/admin/accounts" && !searchParams.get("tab"));
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      title={!isExpanded ? t(item.name) : undefined}
                      className={cn(
                        "flex items-center rounded-md text-xs font-medium transition-all group",
                        isExpanded ? "justify-between px-2.5 py-1.5" : "justify-center p-2",
                        isActive
                          ? "bg-emerald-800 text-white font-semibold"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon className={cn("w-3.5 h-3.5 shrink-0", isActive ? "text-white" : "text-slate-400 group-hover:text-slate-700")} />
                        {isExpanded && <span className="truncate">{t(item.name)}</span>}
                      </div>
                      {isExpanded && item.badge && (
                        <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-mono shrink-0 border", item.badgeColor)}>
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
      <div className="p-2 border-t border-slate-200/70 bg-slate-50/50 overflow-hidden">
        <button
          type="button"
          onClick={() => setShowSignOutModal(true)}
          title={t("Sign Out")}
          className={cn(
            "w-full flex items-center text-xs text-slate-500 rounded-lg transition-all cursor-pointer group hover:bg-slate-200/70 hover:text-rose-700 active:scale-[0.99]",
            isExpanded ? "justify-between px-2.5 py-1.5" : "justify-center p-1.5"
          )}
        >
          {isExpanded && (
            <div className="flex items-center gap-1.5 text-[11px] animate-in fade-in duration-150 min-w-0">
              <span className="font-medium text-slate-600 group-hover:text-rose-700 transition-colors truncate">
                {t("Haryana Police IT")}
              </span>
            </div>
          )}
          <span className="text-slate-400 group-hover:text-rose-600 transition-colors p-0.5">
            <LogOut className="w-3.5 h-3.5" />
          </span>
        </button>
      </div>

      {/* Sign Out Confirmation Modal */}
      {showSignOutModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-0 duration-150">
          <div
            className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 max-w-sm w-full p-6 text-slate-800 animate-in zoom-in-95 duration-150"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="signout-modal-title"
          >
            <div className="flex items-center gap-3.5 mb-3.5">
              <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200/60 shadow-2xs">
                <LogOut className="w-5 h-5 text-rose-600" />
              </div>
              <div className="min-w-0">
                <h3 id="signout-modal-title" className="text-sm font-bold text-slate-900 leading-tight">
                  {t("Sign Out Confirmation")}
                </h3>
                <p className="text-xs text-slate-500 truncate mt-0.5">
                  {sessionUser.name}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-6 leading-relaxed">
              {t("Are you sure you want to sign out of Haryana Police CMS?")}
            </p>

            {/* Clear separate buttons with proper gap, rounded pill/box design */}
            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowSignOutModal(false)}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 active:scale-98 transition-all cursor-pointer border border-slate-300 text-center shadow-2xs"
              >
                {t("Cancel")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowSignOutModal(false);
                  logout();
                }}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:scale-98 transition-all cursor-pointer border border-rose-700 text-center shadow-xs"
              >
                {t("Confirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
