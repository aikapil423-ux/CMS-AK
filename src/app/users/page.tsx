"use client";

import React, { useState } from "react";
import { CheckCircle, Eye, X } from "lucide-react";
import { DEMO_USERS } from "@/lib/mockData";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { OfficerIdPreview } from "@/components/layout/OfficerIdPreview";

export default function UsersDirectoryPage() {
  const { currentUser, sessionUser, isViewAs, enterViewAs, exitViewAs } = useAuth();
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const isDeveloper = sessionUser.id === "cms_developer_admin";

  const enter = async (userId: string) => {
    if (pendingId) return;
    setPendingId(userId);
    const target = DEMO_USERS.find((u) => u.id === userId);
    if (target) await enterViewAs(target);
    setPendingId(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in-50">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-[#b8001f]">
          Personnel & Access Control
        </span>
        <h1 className="text-2xl font-black text-[#0b192c] tracking-tight">
          Police Personnel & Role Directory
        </h1>
        <p className="mt-1 text-xs text-slate-500">
          {isDeveloper
            ? isViewAs
              ? `You are viewing ${currentUser.name}'s ID with your Developer Admin session. Return to your own ID anytime; sign out stays under your control.`
              : "Developer Admin can enter any officer ID with their own session — no separate login, no sign-out. See and work in that role's view; changes follow that role's context. Sign out only when you choose."
            : "Officer IDs are shown for reference. Sign out and sign in with the assigned PNO to use another account."}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {DEMO_USERS.map((user) => {
          const isCurrent = !isViewAs && currentUser.id === user.id;
          const isViewed = isViewAs && currentUser.id === user.id;
          const isPreviewing = previewId === user.id;
          return (
            <Card key={user.id} className={`border ${isCurrent || isViewed ? "border-[#0b192c] ring-1 ring-[#0b192c]" : "border-slate-200"}`}>
              <CardContent className="p-4 sm:p-5 flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${isViewed ? "bg-amber-500" : "bg-[#0b192c]"} text-white`}>
                    {user.name.split(" ")[1]?.slice(0, 2) || user.name.slice(0, 2)}
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-slate-900">{user.name}</h3>
                    <p className="text-xs font-semibold text-[#b8001f]">{user.roleDisplay}</p>
                    <p className="text-xs text-slate-500 font-mono">PNO: {user.pno}</p>
                    <p className="text-[11px] text-slate-400">{user.stationName}</p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  {isCurrent ? (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Active Session
                    </span>
                  ) : isViewed ? (
                    <>
                      <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-300 flex items-center gap-1">
                        <Eye className="w-3 h-3" /> Viewing now
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => void exitViewAs()}
                        className="text-xs"
                      >
                        Return to my ID
                      </Button>
                    </>
                  ) : isDeveloper ? (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        aria-expanded={isPreviewing}
                        aria-controls={`officer-id-${user.id}`}
                        onClick={() => setPreviewId(isPreviewing ? null : user.id)}
                        className="text-xs"
                        title="Show the officer ID card"
                      >
                        {isPreviewing ? <X className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        {isPreviewing ? "Close ID" : "ID card"}
                      </Button>
                      <Button
                        size="sm"
                        disabled={pendingId === user.id}
                        onClick={() => void enter(user.id)}
                        className="text-xs bg-[#203c88] hover:bg-[#18305f] text-white"
                      >
                        {pendingId === user.id ? "Opening…" : "Enter ID"}
                      </Button>
                    </div>
                  ) : null}
                </div>
              </CardContent>

              {isPreviewing && (
                <div id={`officer-id-${user.id}`} className="border-t border-dashed border-slate-200 px-4 sm:px-5 pb-4 pt-3">
                  <OfficerIdPreview
                    user={user}
                    note={`Your session is still ${sessionUser.roleDisplay}. Sign out only when you choose.`}
                  />
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
