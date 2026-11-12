"use client";

import React, { useState } from "react";
import { Eye, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";

/**
 * Persistent banner while the Developer Admin is inside another officer's ID.
 * The ID is opened under the developer's own account — no officer login happens.
 * Data, screens and changes follow the opened role; the developer keeps full
 * authority to return to their own ID at any time, and sign-out stays theirs.
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
              ? <>आपकी <span className="font-bold">{sessionUser.name}</span> ID से खुला है — <span className="font-bold">{currentUser.name}</span> ({currentUser.roleDisplay}, {currentUser.stationName}) का पूरा व्यू। डेटा और बदलाव उसी रोल के हिसाब से।</>
              : <>Opened under your own <span className="font-bold">{sessionUser.name}</span> ID — full view of <span className="font-bold">{currentUser.name}</span> ({currentUser.roleDisplay}, {currentUser.stationName}). Data and changes follow that role.</>}
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
          {isHindi ? "अपनी ID पर वापस" : "Return to my ID"}
        </button>
      </div>
    </div>
  );
}
