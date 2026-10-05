"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileText,
  PlusCircle,
  BookOpen,
  UserCheck,
  Car,
  Clock,
  LayoutGrid,
  Building,
  Flame,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileNavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  isPrimaryAction?: boolean;
}

export function MobileBottomNav() {
  const pathname = usePathname();

  const isRoznamcha = pathname.startsWith("/general-diary");
  const isComplaints = pathname.startsWith("/complaints") || pathname.startsWith("/enquiry-workspace");

  // Navigation items strictly for Roznamcha GD Module
  const roznamchaItems: MobileNavItem[] = [
    { name: "GD Diary", href: "/general-diary", icon: BookOpen },
    { name: "Patrols", href: "/general-diary?type=PATROL_DEPARTURE_RETURN", icon: Car },
    { name: "New GD", href: "/general-diary/new", icon: PlusCircle, isPrimaryAction: true },
    { name: "Sentry Shift", href: "/general-diary?type=SHIFT_RELIEF_TURNOVER", icon: Clock },
    { name: "Modules", href: "/", icon: LayoutGrid },
  ];

  // Navigation items strictly for Complaint Module
  const complaintItems: MobileNavItem[] = [
    { name: "Complaints", href: "/complaints", icon: FileText },
    { name: "Enquiry", href: "/enquiry-workspace", icon: UserCheck },
    { name: "Register", href: "/complaints/register", icon: PlusCircle, isPrimaryAction: true },
    { name: "CM Window", href: "/complaints?priority=CM_WINDOW_VIP", icon: Flame },
    { name: "Modules", href: "/", icon: LayoutGrid },
  ];

  // Navigation items for Portal Home
  const portalItems: MobileNavItem[] = [
    { name: "Roznamcha", href: "/general-diary", icon: BookOpen },
    { name: "Complaints", href: "/complaints", icon: FileText },
    { name: "Station", href: "/station-profile", icon: Building },
  ];

  const currentNav = isRoznamcha ? roznamchaItems : isComplaints ? complaintItems : portalItems;

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#081225] border-t border-slate-800/90 shadow-[0_-4px_12px_rgba(0,0,0,0.15)] pb-safe">
      <div
        className={cn(
          "grid h-16 max-w-lg mx-auto items-center px-1",
          currentNav.length === 5 ? "grid-cols-5" : "grid-cols-3"
        )}
      >
        {currentNav.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          if (item.isPrimaryAction) {
            return (
              <div key={item.name} className="flex justify-center -mt-5">
                <Link
                  href={item.href}
                  className="flex flex-col items-center justify-center w-12 h-12 rounded-full bg-gradient-to-tr from-[#b8001f] to-[#e63946] text-white shadow-lg border-2 border-[#081225] active:scale-95 transition-transform"
                  aria-label={item.name}
                >
                  <PlusCircle className="w-6 h-6" />
                </Link>
              </div>
            );
          }

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center h-full min-h-[48px] py-1 text-center transition-colors active:scale-95",
                isActive ? "text-amber-400 font-semibold" : "text-slate-400 hover:text-slate-200"
              )}
            >
              <Icon className={cn("w-5 h-5", isActive ? "text-amber-400" : "text-slate-400")} />
              <span className="text-[10px] mt-1 tracking-tight truncate max-w-[64px]">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
