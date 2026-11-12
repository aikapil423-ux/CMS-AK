"use client";

import React from "react";
import { UserCheck, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { DEMO_USERS } from "@/lib/mockData";
import { UserSession } from "@/types";
import { cn } from "@/lib/utils";

interface RoleSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RoleSwitcherModal({ isOpen, onClose }: RoleSwitcherModalProps) {
  const { currentUser, sessionUser, isViewAs, enterViewAs, exitViewAs } = useAuth();
  const { isHindi } = useLanguage();
  const [pendingId, setPendingId] = React.useState<string | null>(null);

  if (!isOpen || sessionUser.id !== 'cms_developer_admin') return null;

  // Click an officer to enter their ID view with the developer's own session.
  // Clicking the officer currently being viewed returns to the developer's own ID.
  const handleView = async (user: UserSession) => {
    if (pendingId) return;
    const isViewedNow = isViewAs && currentUser.id === user.id;
    setPendingId(user.id);
    const ok = isViewedNow ? await exitViewAs() : await enterViewAs(user);
    setPendingId(null);
    if (ok) {
      onClose();
      return;
    }
    if (typeof window !== "undefined") {
      const message = (window as unknown as { __lastViewAsError?: string }).__lastViewAsError;
      window.dispatchEvent(new CustomEvent("complaints_save_error", { detail: message || "Officer ID could not be opened." }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden z-10 animate-in fade-in-0 zoom-in-95">
        <div className="p-4 bg-[#081225] text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-bold">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">{isHindi ? "अधिकारी ID में जाएँ" : "Enter Officer ID"}</h3>
              <p className="text-[11px] text-slate-300">
                {isHindi
                  ? "कोई अलग लॉगिन नहीं — आपका Developer Admin सत्र बना रहेगा"
                  : "No separate login — your Developer Admin session stays active"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-white hover:text-white hover:bg-white/10 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-2 max-h-[75vh] overflow-y-auto">
          {DEMO_USERS.map((user) => {
            const isViewed = isViewAs && currentUser.id === user.id;
            const isPending = pendingId === user.id;
            return (
              <button
                key={user.id}
                type="button"
                disabled={isPending}
                onClick={() => handleView(user)}
                className={cn(
                  "w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between group",
                  isViewed
                    ? "border-amber-400 bg-amber-50 ring-2 ring-amber-300"
                    : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/60",
                  isPending && "opacity-60"
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shrink-0",
                      isViewed ? "bg-amber-500 text-white" : "bg-slate-200 text-slate-700"
                    )}
                  >
                    {user.name.split(" ")[1]?.slice(0, 2) || user.name.slice(0, 2)}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-slate-900 group-hover:text-[#0b192c]">
                        {user.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-semibold text-[#b8001f] bg-red-50 px-1.5 py-0.5 rounded">
                        {user.roleDisplay}
                      </span>
                      <span className="text-xs text-slate-500 font-mono">PNO: {user.pno}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">{user.stationName}</p>
                  </div>
                </div>
                {isPending ? (
                  <span className="text-xs text-slate-400 shrink-0">…</span>
                ) : isViewed ? (
                  <span className="text-xs font-semibold text-amber-700 shrink-0">
                    {isHindi ? "इस ID में हैं — बाहर निकलें" : "Viewing — exit"}
                  </span>
                ) : (
                  <span className="text-xs text-slate-400 group-hover:text-slate-600 font-medium shrink-0">
                    {isHindi ? "इसमें जाएँ" : "Enter"}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          {isViewAs ? (
            <button
              type="button"
              disabled={Boolean(pendingId)}
              onClick={() => {
                void exitViewAs();
                onClose();
              }}
              className="text-xs font-semibold text-[#203c88] hover:underline disabled:opacity-60"
            >
              {isHindi ? "← अपनी Developer Admin ID पर लौटें" : "← Return to Developer Admin"}
            </button>
          ) : (
            <p className="text-[10px] text-slate-400">
              {isHindi
                ? "साइन-आउट केवल आपके नियंत्रण में है।"
                : "Sign out stays under your control."}
            </p>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900"
          >
            {isHindi ? "बंद करें" : "Close"}
          </button>
        </div>
      </div>
    </div>
  );
}
