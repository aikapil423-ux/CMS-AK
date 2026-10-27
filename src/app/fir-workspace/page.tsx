"use client";

import React from "react";
import Link from "next/link";
import {
  UserCheck,
  FileText,
  ArrowRight,
  Shield,
  CheckCircle,
  Clock,
  ScrollText,
  Sparkles,
  FileCheck2,
  Scale,
  PhoneCall,
  MapPin,
  ShieldAlert,
  Gavel,
  PackageCheck,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function FIRWorkspacePage() {
  const { currentUser } = useAuth();

  return (
    <div className="space-y-6 animate-in fade-in-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-100 border border-red-200 flex items-center justify-center text-red-700">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-[#0b192c] tracking-tight">
              Investigation Officer (IO) Workspace
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Statutory investigation toolset under Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023
            </p>
          </div>
        </div>

        <Link href="/fir">
          <Button variant="outline" size="sm" className="text-xs font-bold">
            Open FIR Register
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
        {/* 1. Notice Generator */}
        <Link href="/fir-workspace/templates" className="block group">
          <Card className="border-slate-200 hover:border-purple-400 hover:shadow-md transition-all cursor-pointer bg-white group-hover:bg-purple-50/20 h-full">
            <CardContent className="p-3.5 flex flex-col justify-between h-full">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                  <FileCheck2 className="w-4 h-4 text-purple-700 group-hover:scale-110 transition-transform" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-slate-900 text-xs sm:text-[13px] leading-tight group-hover:text-purple-800 transition-colors">
                    Notice Generator
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-1 leading-snug line-clamp-3">
                    Accused notice (Sec 35(3) BNSS), CDR requisition, NATGRID intelligence & Witness summons (Sec 179 BNSS).
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end text-[11px] font-bold text-purple-700 mt-3 group-hover:translate-x-0.5 transition-all gap-1">
                <span>Generate Notices</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* 2. Case Diaries (Zimni) */}
        <Link href="/fir-workspace/zimni" className="block group">
          <Card className="border-slate-200 hover:border-amber-400 hover:shadow-md transition-all cursor-pointer bg-white group-hover:bg-amber-50/20 h-full">
            <CardContent className="p-3.5 flex flex-col justify-between h-full">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                  <ScrollText className="w-4 h-4 text-amber-700 group-hover:scale-110 transition-transform" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-slate-900 text-xs sm:text-[13px] leading-tight group-hover:text-amber-800 transition-colors">
                    Case Diaries (Zimni)
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-1 leading-snug line-clamp-3">
                    Record chronological investigation diaries under Section 175 BNSS with spot inspections.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end text-[11px] font-bold text-amber-700 mt-3 group-hover:translate-x-0.5 transition-all gap-1">
                <span>Open Diaries</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* 3. Arrest Docs and IIF-III */}
        <Link href="/fir-workspace/arrest-docs" className="block group">
          <Card className="border-slate-200 hover:border-rose-400 hover:shadow-md transition-all cursor-pointer bg-white group-hover:bg-rose-50/20 h-full">
            <CardContent className="p-3.5 flex flex-col justify-between h-full">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-4 h-4 text-rose-700 group-hover:scale-110 transition-transform" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-slate-900 text-xs sm:text-[13px] leading-tight group-hover:text-rose-800 transition-colors">
                    Arrest Docs and IIF-III
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-1 leading-snug line-clamp-3">
                    Arrest memo, Fard Jamatalashi, Grounds of arrest, Pehchan Patr, Fard Baramadgi, Remand & Medical letters.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end text-[11px] font-bold text-rose-700 mt-3 group-hover:translate-x-0.5 transition-all gap-1">
                <span>Open Arrest Docs</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* 4. Property Seizure Form IIF-IV */}
        <Link href="/fir-workspace/property-seizure" className="block group">
          <Card className="border-slate-200 hover:border-teal-500 hover:shadow-md transition-all cursor-pointer bg-white group-hover:bg-teal-50/20 h-full">
            <CardContent className="p-3.5 flex flex-col justify-between h-full">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center shrink-0">
                  <PackageCheck className="w-4 h-4 text-teal-700 group-hover:scale-110 transition-transform" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1 flex-wrap">
                    <h3 className="font-bold text-slate-900 text-xs sm:text-[13px] leading-tight group-hover:text-teal-800 transition-colors">
                      Property Seizure Form IIF-IV
                    </h3>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 leading-snug line-clamp-3">
                    तलाशी / जब्ती फार्म ज़ेर धारा 51/102/165 CrPC (धारा 50/106/185 BNSS), गवाह सूची, सीलबंद माल व प्राप्ति पावती।
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end text-[11px] font-bold text-teal-700 mt-3 group-hover:translate-x-0.5 transition-all gap-1">
                <span>Open Seizure Form</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* 5. ChargeSheet/Final report and IIF-V */}
        <Link href="/fir-workspace/drafts" className="block group">
          <Card className="border-slate-200 hover:border-red-400 hover:shadow-md transition-all cursor-pointer bg-white group-hover:bg-red-50/20 h-full">
            <CardContent className="p-3.5 flex flex-col justify-between h-full">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
                  <Scale className="w-4 h-4 text-red-700 group-hover:scale-110 transition-transform" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-slate-900 text-xs sm:text-[13px] leading-tight group-hover:text-red-800 transition-colors">
                    ChargeSheet/Final report and IIF-V
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-1 leading-snug line-clamp-3">
                    Statutory Police Report (Chargesheet / Challan / Closure - Sec 193 BNSS / IIF-V) for Court submission.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end text-[11px] font-bold text-red-700 mt-3 group-hover:translate-x-0.5 transition-all gap-1">
                <span>View Form</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* 6. Kalandra (कलंदरा) */}
        <Link href="/fir-workspace/kalandra" className="block group">
          <Card className="border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer bg-white group-hover:bg-emerald-50/20 h-full">
            <CardContent className="p-3.5 flex flex-col justify-between h-full">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                  <Gavel className="w-4 h-4 text-emerald-700 group-hover:scale-110 transition-transform" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1 flex-wrap">
                    <h3 className="font-bold text-slate-900 text-xs sm:text-[13px] leading-tight group-hover:text-emerald-800 transition-colors">
                      Kalandra (कलंदरा)
                    </h3>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 leading-snug line-clamp-3">
                    Bilingual preparation of Kalandras (107/151, 107/150, 217/248 BNS, 145, 72 IPC, 7/16) & dossiers.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end text-[11px] font-bold text-emerald-700 mt-3 group-hover:translate-x-0.5 transition-all gap-1">
                <span>Open Kalandra</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* 7. Template Builder */}
        <Link href="/fir-workspace/builder" className="block group">
          <Card className="border-slate-200 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer bg-white group-hover:bg-blue-50/20 h-full">
            <CardContent className="p-3.5 flex flex-col justify-between h-full">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 text-blue-700 group-hover:scale-110 transition-transform" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-slate-900 text-xs sm:text-[13px] leading-tight group-hover:text-blue-800 transition-colors">
                    Template Builder
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-1 leading-snug line-clamp-3">
                    Word-like editor for custom FIR templates, 180 BNSS statements, recovery memos & My Templates tab.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end text-[11px] font-bold text-blue-700 mt-3 group-hover:translate-x-0.5 transition-all gap-1">
                <span>Open Builder</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
