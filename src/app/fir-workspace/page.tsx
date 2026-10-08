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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Case Diaries / Zimni */}
        <Link href="/fir" className="block group">
          <Card className="border-slate-200 hover:border-amber-400 hover:shadow-md transition-all cursor-pointer bg-white group-hover:bg-amber-50/20 h-full">
            <CardContent className="p-5 flex flex-col justify-between h-full">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                  <ScrollText className="w-5 h-5 text-amber-700 group-hover:scale-110 transition-transform" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm group-hover:text-amber-800 transition-colors">
                    Case Diaries (Zimni)
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Record chronological investigation diaries under Section 175 BNSS with spot inspections.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end text-xs font-bold text-amber-700 mt-4 group-hover:translate-x-1 transition-all gap-1">
                <span>Open Diaries</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* 2. Statutory Legal Notices */}
        <Link href="/enquiry-workspace/templates" className="block group">
          <Card className="border-slate-200 hover:border-purple-400 hover:shadow-md transition-all cursor-pointer bg-white group-hover:bg-purple-50/20 h-full">
            <CardContent className="p-5 flex flex-col justify-between h-full">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center shrink-0">
                  <FileCheck2 className="w-5 h-5 text-purple-700 group-hover:scale-110 transition-transform" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm group-hover:text-purple-800 transition-colors">
                    Statutory Notice Generator
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Accused notice (Sec 35(3) BNSS), Witness summons (Sec 179 BNSS), and 4-page arrest memos.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end text-xs font-bold text-purple-700 mt-4 group-hover:translate-x-1 transition-all gap-1">
                <span>Generate Notices</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* 3. Final Form (Chargesheet / Closure) */}
        <Link href="/enquiry-workspace/drafts" className="block group">
          <Card className="border-slate-200 hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer bg-white group-hover:bg-emerald-50/20 h-full">
            <CardContent className="p-5 flex flex-col justify-between h-full">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                  <Scale className="w-5 h-5 text-emerald-700 group-hover:scale-110 transition-transform" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm group-hover:text-emerald-800 transition-colors">
                    Final Form (Sec 193 BNSS)
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Statutory Police Report (Chargesheet / Challan / Closure) for submission before Court.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end text-xs font-bold text-emerald-700 mt-4 group-hover:translate-x-1 transition-all gap-1">
                <span>View Templates</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* 4. Bare Acts & Penal Law Reference */}
        <Link href="/acts-sections" className="block group">
          <Card className="border-slate-200 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer bg-white group-hover:bg-blue-50/20 h-full">
            <CardContent className="p-5 flex flex-col justify-between h-full">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 text-blue-700 group-hover:scale-110 transition-transform" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm group-hover:text-blue-800 transition-colors">
                    ACT and SECTIONs
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Search Bare Acts (BNS, BNSS, BSA, IT Act) with punishment, cognizable and bailable classification.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end text-xs font-bold text-blue-700 mt-4 group-hover:translate-x-1 transition-all gap-1">
                <span>Explore Acts</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
