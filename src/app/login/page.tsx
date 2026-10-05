"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Lock, User, Building2, AlertCircle, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { DEMO_USERS, MOCK_POLICE_STATIONS } from "@/lib/mockData";

export default function LoginPage() {
  const router = useRouter();
  const { login, switchUser } = useAuth();
  const [pno, setPno] = useState("04291882");
  const [pin, setPin] = useState("123456");
  const [station, setStation] = useState(MOCK_POLICE_STATIONS[0]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    setTimeout(() => {
      if (pno.trim().length < 4) {
        setError("Please enter a valid Permanent Police Number (PNO).");
        setIsLoading(false);
        return;
      }

      login(pno, pin);
      router.push("/");
    }, 400);
  };

  const handleQuickDemoLogin = (userId: string) => {
    switchUser(userId);
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 text-slate-100">
      <div className="w-full max-w-md">
        {/* Header Insignia */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-slate-800 text-slate-200 border border-slate-700 mb-3 shadow-xs">
            <Shield className="w-7 h-7 text-slate-300" />
          </div>
          <div className="space-y-1">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
              Government of Haryana
            </span>
            <h1 className="text-xl font-bold text-white tracking-tight">Haryana Police</h1>
            <p className="text-xs text-slate-400">Case Management & Roznamcha System</p>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6 sm:p-7 text-slate-900">
          <div className="border-b border-slate-100 pb-3 mb-4">
            <h2 className="text-base font-bold text-slate-900">Police Personnel Login</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter your official credentials to access station records
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
                Permanent Police Number (PNO) / Belt No
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={pno}
                  onChange={(e) => setPno(e.target.value)}
                  placeholder="e.g. 04291882"
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
