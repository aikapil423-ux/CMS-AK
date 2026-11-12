"use client";

import React, { useState } from "react";
import { useGuardedRouter as useRouter } from "@/hooks/useGuardedRouter";
import { Shield, Lock, User, AlertCircle, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { DEMO_USERS } from "@/lib/mockData";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [demo, setDemo] = useState(false);
  React.useEffect(() => {
    fetch("/api/auth/session", {cache:"no-store"}).then(r=>r.json()).then(b=>setDemo(b.demoEnabled === true)).catch(()=>setDemo(false));
  }, []);
  const [pno, setPno] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [selectedDistrict, setSelectedDistrict] = useState<string>("Panipat");
  const districts = React.useMemo(() => {
    return Array.from(new Set(DEMO_USERS.map((u) => u.district)));
  }, []);

  const personaList = React.useMemo(() => {
    return DEMO_USERS.filter((u) => u.district === selectedDistrict);
  }, [selectedDistrict]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(null); setIsLoading(true);
    const ok = await login(pno, pin);
    setIsLoading(false);
    if(ok)router.push('/');else setError((window as any).__lastLoginError || (pin === '123456' && !demo
      ? 'Demo login is disabled on this server. Sign in with your assigned PNO and password.'
      : 'Invalid PNO or PIN. Please verify your credentials.'));
  };
  const handleQuickDemoLogin = async (userId:string) => {
    if (!demo || isLoading) return;
    const user = DEMO_USERS.find(u=>u.id===userId); if(!user)return;
    setPno(user.pno); setPin('123456'); setError(null); setIsLoading(true);
    try {
      const ok = await login(user.pno, '123456');
      if (ok) router.push('/');
      else setError((window as any).__lastLoginError || 'Demo login failed. Please retry.');
    } finally {
      setIsLoading(false);
    }
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
              {demo ? "Local demo PIN: 123456." : "Sign in with your assigned PNO and PIN."}
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

          {demo && <div className="mt-5 pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Demo Personas by District</span>
              <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 font-semibold px-1.5 py-0.5 rounded">1-Click Login</span>
            </div>
            
            {/* District Selector Chips */}
            <div className="flex items-center gap-1 overflow-x-auto pb-2 mb-2 text-[11px]">
              {districts.map((dist) => (
                <button
                  key={dist}
                  type="button"
                  onClick={() => setSelectedDistrict(dist)}
                  className={`px-2.5 py-1 rounded-md font-medium whitespace-nowrap transition-all cursor-pointer ${
                    selectedDistrict === dist
                      ? "bg-[#203c88] text-white hover:bg-[#1a3170] hover:text-white font-semibold shadow-2xs"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 border border-slate-200"
                  }`}
                >
                  {dist}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-1.5 max-h-56 overflow-y-auto pr-0.5">
              {personaList.map((u) => (
                <button
                  key={u.id}
                  onClick={() => handleQuickDemoLogin(u.id)}
                  type="button"
                  className="w-full text-left p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-between transition-colors group cursor-pointer"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-semibold text-slate-800 truncate">
                        {u.name}
                      </p>
                      <span className="text-[9px] bg-slate-200 text-slate-700 px-1 py-0.2 rounded font-mono font-bold">
                        {u.rank.slice(0, 3)}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 truncate">
                      {u.roleDisplay} • PNO: <span className="font-mono">{u.pno}</span>
                    </p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 shrink-0 ml-2" />
                </button>
              ))}
            </div>

            <div className="mt-3 pt-3 border-t border-slate-200">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Developer Access</span>
              <button
                type="button"
                onClick={() => { setPno('DEV-ADMIN'); setPin(''); setError(null); }}
                className="mt-1.5 w-full text-left p-2 rounded-lg bg-slate-800 hover:bg-slate-900 border border-slate-800 flex items-center justify-between transition-colors group cursor-pointer"
              >
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white">Developer Admin</p>
                  <p className="text-[10px] text-slate-300">
                    PNO: <span className="font-mono">DEV-ADMIN</span> • Password required • Persona switching
                  </p>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-white shrink-0 ml-2" />
              </button>
            </div>
          </div>}
        </div>

        {/* Security Notice */}
        <p className="text-center text-[11px] text-slate-500 mt-5 max-w-xs mx-auto">
          Authorized Haryana Police Personnel Only.
        </p>
      </div>
    </div>
  );
}
