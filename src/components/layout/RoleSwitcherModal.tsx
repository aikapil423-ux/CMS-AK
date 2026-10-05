"use client";

import React from "react";
import { UserCheck, X, Shield, Award, Check } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { DEMO_USERS } from "@/lib/mockData";
import { cn } from "@/lib/utils";

interface RoleSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RoleSwitcherModal({ isOpen, onClose }: RoleSwitcherModalProps) {
  const { currentUser, switchUser } = useAuth();

  if (!isOpen) return null;

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
              <h3 className="text-sm font-bold text-white">Switch Police Role Persona</h3>
              <p className="text-[11px] text-slate-300">Test different views and permission boundaries</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-2 max-h-[75vh] overflow-y-auto">
          {DEMO_USERS.map((user) => {
            const isSelected = currentUser.id === user.id;
            return (
              <button
                key={user.id}
                onClick={() => {
                  switchUser(user.id);
                  onClose();
                }}
                className={cn(
                  "w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between group",
                  isSelected
                    ? "border-[#0b192c] bg-slate-50 ring-2 ring-[#0b192c]/20"
                    : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/60"
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shrink-0",
                      isSelected ? "bg-[#0b192c] text-white" : "bg-slate-200 text-slate-700"
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
                {isSelected ? (
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                ) : (
                  <span className="text-xs text-slate-400 group-hover:text-slate-600 font-medium">Select</span>
                )}
              </button>
            );
          })}
        </div>

        <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
