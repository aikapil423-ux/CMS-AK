"use client";

import React from "react";
import { Users, Shield, UserCheck, Phone, CheckCircle } from "lucide-react";
import { DEMO_USERS } from "@/lib/mockData";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

export default function UsersDirectoryPage() {
  const { currentUser, switchUser } = useAuth();

  return (
    <div className="space-y-6 animate-in fade-in-50">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-[#b8001f]">
          Personnel & Access Control
        </span>
        <h1 className="text-2xl font-black text-[#0b192c] tracking-tight">
          Police Personnel & Role Directory
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Staff postings, roles, permissions, and active roster for PS City Thanesar
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {DEMO_USERS.map((user) => {
          const isCurrent = currentUser.id === user.id;
          return (
            <Card key={user.id} className={`border ${isCurrent ? "border-[#0b192c] ring-1 ring-[#0b192c]" : "border-slate-200"}`}>
              <CardContent className="p-4 sm:p-5 flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#0b192c] text-white flex items-center justify-center font-bold text-sm shrink-0">
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
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => switchUser(user.id)}
                      className="text-xs"
                    >
                      Switch Persona
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
