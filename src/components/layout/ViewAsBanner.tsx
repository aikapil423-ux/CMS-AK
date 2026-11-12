"use client";

import React, { useState } from "react";
import { Eye, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";

/**
 * Persistent banner while the Developer Admin is viewing another officer's ID.
 * It makes clear that no separate login happened, the developer's own session is
 * still active, and returning is one click away. Sign out remains the
 * developer's explicit choice.
 */
export function ViewAsBanner() {
  const { currentUser, sessionUser, isViewAs, exitViewAs } = useAuth();
  const { isHindi } = useLanguage();
  const [busy, setBusy] = useState(false);

  if (!isViewAs) return null;

  return (
    <div className="px-3 sm:px-6 pt-2" role="status" data-cms-view-as="active">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-950 shadow-xs">
        <span className="flex items-center gap-2 font-semibold min-w-0">
          <Eye className="w-3.5 h-3.5 shrink-0" />
          <span className="min-w-0">
            {isHindi
              ? <>इस ID का दृश्य देख रहे हैं: <span className="font-bold">{currentUser.name}</span> ({currentUser.roleDisplay}, {currentUser.stationName}) — आपका सत्र <span className="font-bold">{sessionUser.name}</span> ही है</>
              : <>Viewing the ID of <span className="font-bold">{currentUser.name}</span> ({currentUser.roleDisplay}, {currentUser.stationName}) — your session is still <span className="font-bold">{sessionUser.name}</span></>}
          </span>
        </span>
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            await exitViewAs();
            setBusy(false);
          }}
          className="flex items-center gap-1.5 rounded-md bg-[#203c88] px-2.5 py-1 text-[11px] font-bold text-white hover:bg-[#18305f] disabled:opacity-60 shrink-0"
        >
          <LogOut className="w-3 h-3" />
          {isHindi ? "अपनी ID पर लौटें" : "Return to my ID"}
        </button>
      </div>
    </div>
  );
}
