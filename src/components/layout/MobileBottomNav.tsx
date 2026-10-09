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
import { useAuth } from "@/context/AuthContext";

interface MobileNavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  isPrimaryAction?: boolean;
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const { currentUser } = useAuth();

  const isRoznamcha = pathname.startsWith("/general-diary");
  const isComplaints = pathname.startsWith("/complaints") || pathname.startsWith("/enquiry-workspace");

  // Only MHC, SHO, and Superior officers can register complaints
  const isMhc = currentUser?.role === "MHC_GD_INCHARGE" || currentUser?.role === "DUTY_OFFICER";
  const isSho = currentUser?.role === "SHO" || currentUser?.id === "usr_sho_1";
  const isSuperior = currentUser?.role === "DSP_SUBDIV" || currentUser?.role === "SP_DISTRICT" || currentUser?.role === "SUPER_ADMIN";
  const canRegisterComplaint = isMhc || isSho || isSuperior;

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
    ...(canRegisterComplaint
      ? [{ name: "Register", href: "/complaints/register", icon: PlusCircle, isPrimaryAction: true }]
      : []),
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
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-t border-slate-200/80 shadow-2xs pb-safe">
      <div
        className={cn(
          "grid h-15 max-w-lg mx-auto items-center px-1",
          currentNav.length === 5 ? "grid-cols-5" : "grid-cols-3"
        )}
      >
        {currentNav.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          if (item.isPrimaryAction) {
            return (
              <div key={item.name} className="flex justify-center -mt-4">
                <Link
                  href={item.href}
                  className="flex flex-col items-center justify-center w-11 h-11 rounded-full bg-slate-900 text-white shadow-sm border-2 border-white active:scale-95 transition-transform"
                  aria-label={item.name}
                >
                  <PlusCircle className="w-5 h-5" />
                </Link>
              </div>
            );
          }

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center h-full min-h-[44px] py-1 text-center transition-colors active:scale-95",
                isActive ? "text-slate-900 font-medium" : "text-slate-400 hover:text-slate-700"
              )}
            >
              <Icon className={cn("w-4.5 h-4.5", isActive ? "text-slate-900" : "text-slate-400")} />
              <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-[64px]">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
