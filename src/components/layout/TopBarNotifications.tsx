"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  FileText,
  CheckCheck,
  Clock,
  ArrowRight,
  ShieldAlert,
  Check,
  X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { ComplaintService } from "@/services/complaintService";
import { OfficerNotification } from "@/types";

interface TopBarNotificationsProps {
  isMobile?: boolean;
}

export function TopBarNotifications({ isMobile = false }: TopBarNotificationsProps) {
  const router = useRouter();
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<OfficerNotification[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isSho = currentUser?.role === "SHO" || currentUser?.id === "usr_sho_1";

  const loadNotifications = async () => {
    try {
      const all = await ComplaintService.getOfficerNotifications();
      // Filter for this officer, or if SHO, show SHO notifications + general
      const filtered = all.filter((n) => {
        if (isSho) {
          return n.recipientPno === "HR-04291882" || n.recipientName.includes("SHO") || !n.recipientPno;
        }
        return n.recipientPno === currentUser.pno || n.recipientName === currentUser.name;
      });
      setNotifications(filtered);
    } catch (e) {
      console.warn("Failed to load notifications:", e);
    }
  };

  useEffect(() => {
    loadNotifications();

    const handleUpdate = () => {
      loadNotifications();
    };

    window.addEventListener("officer_notifications_updated", handleUpdate);
    window.addEventListener("complaints_updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);

    return () => {
      window.removeEventListener("officer_notifications_updated", handleUpdate);
      window.removeEventListener("complaints_updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, [currentUser, isSho]);

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
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleNotificationClick = (notif: OfficerNotification) => {
    ComplaintService.markNotificationAsRead(notif.id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
    );
    setIsOpen(false);

    if (notif.complaintId || notif.complaintNumber) {
      const targetId = notif.complaintId || notif.complaintNumber;
      router.push(`/complaints/${targetId}?tab=reports`);
    }
  };

  const handleMarkAllRead = () => {
    ComplaintService.markAllNotificationsAsRead(isSho ? "HR-04291882" : currentUser.pno);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-lg transition-colors cursor-pointer text-slate-600 hover:text-slate-900 hover:bg-slate-100 ${
          isMobile ? "p-1.5" : "p-2"
        }`}
        title={unreadCount > 0 ? `${unreadCount} ${t("Officer Notifications")}` : t("Officer Notifications")}
        aria-label={t("Officer Notifications")}
      >
        <Bell className={isMobile ? "w-4 h-4" : "w-4 h-4"} />

        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-[17px] h-[17px] px-1 text-[10px] font-black text-white bg-rose-600 rounded-full ring-2 ring-white animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu Popover */}
      {isOpen && (
        <div
          className={`absolute z-50 mt-2 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in-0 zoom-in-95 ${
            isMobile
              ? "right-0 w-[88vw] max-w-[340px]"
              : "right-0 w-88 sm:w-96"
          }`}
        >
          {/* Header */}
          <div className="px-3.5 py-2.5 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-400" />
              <span className="font-bold text-xs tracking-wide">
                {t("Officer Notifications")} {unreadCount > 0 && `(${unreadCount})`}
              </span>
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-[11px] text-slate-300 hover:text-white flex items-center gap-1 font-semibold cursor-pointer transition-colors"
                title={t("Mark all read")}
              >
                <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>{t("Mark all read")}</span>
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <Bell className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-semibold text-slate-600">{t("No Notifications Yet")}</p>
                <p className="text-[11px] text-slate-400">
                  {t("New reports submitted by Enquiry Officers will appear here.", "जांच अधिकारियों द्वारा प्रस्तुत की गई नई रिपोर्ट यहाँ दिखाई देंगी।")}
                </p>
              </div>
            ) : (
              notifications.map((notif) => {
                const isViewReport = notif.title.toLowerCase().includes("report");
                return (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`p-3 text-left transition-colors cursor-pointer hover:bg-slate-50 flex items-start gap-2.5 ${
                      !notif.read ? "bg-blue-50/60" : "bg-white"
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                        !notif.read
                          ? "bg-blue-600 text-white shadow-2xs"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {isViewReport ? (
                        <FileText className="w-3.5 h-3.5" />
                      ) : (
                        <ShieldAlert className="w-3.5 h-3.5" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h4
                          className={`text-xs truncate ${
                            !notif.read
                              ? "font-black text-slate-950"
                              : "font-semibold text-slate-700"
                          }`}
                        >
                          {notif.title}
                        </h4>
                        {!notif.read && (
                          <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                        )}
                      </div>

                      <p className="text-[11px] text-slate-600 leading-snug line-clamp-2 mt-0.5">
                        {notif.message}
                      </p>

                      <div className="flex items-center justify-between pt-1.5 text-[10px] text-slate-400">
                        <span className="font-mono flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {notif.createdAt ? new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Recently"}
                        </span>
                        <span className="font-bold text-blue-700 flex items-center gap-0.5">
                          View Report <ArrowRight className="w-2.5 h-2.5" />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer note for SHO */}
          {isSho && (
            <div className="p-2 bg-slate-50 border-t border-slate-100 text-center text-[10px] text-slate-500">
              Station House Officer Desk • Click notification to inspect enquiry report
            </div>
          )}
        </div>
      )}
    </div>
  );
}
