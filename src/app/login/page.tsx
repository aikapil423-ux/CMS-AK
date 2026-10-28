"use client";

import React, { useState } from "react";
import { useGuardedRouter as useRouter } from "@/hooks/useGuardedRouter";
import { Shield, Lock, User, Building2, AlertCircle, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { DEMO_USERS, MOCK_POLICE_STATIONS } from "@/lib/mockData";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [pno, setPno] = useState("HR-04291882");
  const [pin, setPin] = useState("123456");
  const [station, setStation] = useState(MOCK_POLICE_STATIONS[0]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(null); setIsLoading(true);
    const ok = await login(pno, pin, station);
    setIsLoading(false);
    if(ok)router.push('/');else setError('Invalid PNO or PIN. Please verify your credentials.');
  };
  const handleQuickDemoLogin = async (userId:string) => {
    const user=DEMO_USERS.find(u=>u.id===userId);if(!user)return;
    if(await login(user.pno,'123456', station))router.push('/');else setError('Demo sign-in is unavailable. Use configured credentials.');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 text-slate-100">
      <div className="w-full max-w-md">
        {/* Header Insignia with Official CMS Haryana Police Logo */}
        <div className="text-center mb-5 flex flex-col items-center">
          <div className="bg-white/95 rounded-2xl p-3 shadow-lg border border-slate-200/40 inline-flex items-center justify-center max-w-[320px] w-full">
            <img
              src="/cms-haryana-logo.png"
              alt="CMS Case Management System - Haryana Police"
              className="h-20 sm:h-22 w-auto object-contain drop-shadow-xs"
            />
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6 sm:p-7 text-slate-900">
          <div className="border-b border-slate-100 pb-3 mb-4">
            <h2 className="text-base font-bold text-slate-900">Police Personnel Login</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Local demo PIN: 123456. Production access requires configured credentials.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-700" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Police Station / Jurisdiction
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <select
                  value={station}
                  onChange={(e) => setStation(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-800 focus:outline-none font-medium"
                >
                  {MOCK_POLICE_STATIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Permanent Police Number (PNO)
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={pno}
                  onChange={(e) => setPno(e.target.value)}
                  placeholder="e.g. HR-04291882"
                  required
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-800 focus:outline-none font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Security PIN / Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="••••••"
                  required
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-800 focus:outline-none font-mono"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              className="w-full font-semibold text-xs sm:text-sm bg-slate-800 hover:bg-slate-900 mt-2"
            >
              Sign In to CMS Portal
            </Button>
          </form>

          {/* Quick Demo Switcher */}
          <div className="mt-5 pt-4 border-t border-slate-200">
            <p className="text-[11px] font-bold text-slate-600 mb-2 uppercase tracking-wider flex items-center justify-between">
              <span>Prototype Demo Personas</span>
              <span className="text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">1-Click Login</span>
            </p>
            <div className="grid grid-cols-1 gap-1">
              {DEMO_USERS.slice(0, 4).map((u) => (
                <button
                  key={u.id}
                  onClick={() => handleQuickDemoLogin(u.id)}
                  type="button"
                  className="w-full text-left p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-between transition-colors group"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-800 truncate">
                      {u.name}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {u.roleDisplay} • PNO: {u.pno}
                    </p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <p className="text-center text-[11px] text-slate-500 mt-5 max-w-xs mx-auto">
          Authorized Haryana Police Personnel Only.
        </p>
      </div>
    </div>
  );
}
