"use client";

import React from "react";
import { UserSession } from "@/types";
import { cn } from "@/lib/utils";

/**
 * Read-only officer ID card. Rendering this never signs anyone in and never
 * changes the current session; the viewer keeps their own identity.
 */
export function OfficerIdPreview({
  user,
  note,
  compact = false,
}: {
  user: UserSession;
  note?: string;
  compact?: boolean;
}) {
  const fields: Array<[string, string | undefined]> = [
    ["Login ID (PNO)", user.pno],
    ["Rank", user.rankDisplay],
    ["Role", user.role],
    ["Police Station", user.stationName],
    ["Station Code", user.stationCode],
    ["District", user.district],
  ];

  return (
    <div className={cn("rounded-lg border border-slate-200 bg-slate-50/70 p-2.5 space-y-1.5", compact && "p-2")}>
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
        Read-only ID — no login, no permission change
      </p>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
        {fields.map(([label, value]) => (
          <div key={label} className="min-w-0">
            <dt className="text-slate-400">{label}</dt>
            <dd className="font-mono text-slate-800 break-words">{value || "—"}</dd>
          </div>
        ))}
      </dl>
      {user.jurisdictionUnits?.length ? (
        <p className="text-[11px] text-slate-500">
          <span className="text-slate-400">Jurisdiction: </span>
          {user.jurisdictionUnits.join(", ")}
        </p>
      ) : null}
      {note ? <p className="text-[10px] text-emerald-700">{note}</p> : null}
    </div>
  );
}
