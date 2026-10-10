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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {/* 0. Investigation Template Builder */}
        <Link href="/fir-workspace/builder" className="block group">
          <Card className="border-slate-200 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer bg-white group-hover:bg-blue-50/20 h-full">
            <CardContent className="p-5 flex flex-col justify-between h-full">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-blue-700 group-hover:scale-110 transition-transform" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm group-hover:text-blue-800 transition-colors">
                    Template Builder (टेम्पलेट बिल्डर)
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Word-like editor for custom FIR templates, 180 BNSS statements, recovery memos & My Templates tab.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end text-xs font-bold text-blue-700 mt-4 group-hover:translate-x-1 transition-all gap-1">
                <span>Open Builder</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* 1. Final Form (Chargesheet / Closure) */}
        <Link href="/fir-workspace/drafts" className="block group">
          <Card className="border-slate-200 hover:border-red-400 hover:shadow-md transition-all cursor-pointer bg-white group-hover:bg-red-50/20 h-full">
            <CardContent className="p-5 flex flex-col justify-between h-full">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                  <Scale className="w-5 h-5 text-red-700 group-hover:scale-110 transition-transform" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm group-hover:text-red-800 transition-colors">
                    Final Form (Sec 193 BNSS)
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Statutory Police Report (Chargesheet / Challan / Closure) for submission before Court.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end text-xs font-bold text-red-700 mt-4 group-hover:translate-x-1 transition-all gap-1">
                <span>View Form</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* 2. Statutory Legal Notices */}
        <Link href="/fir-workspace/templates" className="block group">
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
                    Accused notice (Sec 35(3) BNSS), CDR requisition, NATGRID intelligence & Witness summons (Sec 179 BNSS).
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

        {/* 3. Arrest Docs (गिरफ्तारी प्रपत्र) */}
        <Link href="/fir-workspace/arrest-docs" className="block group">
          <Card className="border-slate-200 hover:border-rose-400 hover:shadow-md transition-all cursor-pointer bg-white group-hover:bg-rose-50/20 h-full">
            <CardContent className="p-5 flex flex-col justify-between h-full">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-5 h-5 text-rose-700 group-hover:scale-110 transition-transform" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm group-hover:text-rose-800 transition-colors">
                    Arrest Docs (गिरफ्तारी प्रपत्र)
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Arrest memo, Fard Jamatalashi, Grounds of arrest, Pehchan Patr, Fard Baramadgi, Remand & Medical letters.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end text-xs font-bold text-rose-700 mt-4 group-hover:translate-x-1 transition-all gap-1">
                <span>Open Arrest Docs</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* 4. Case Diaries / Zimni */}
        <Link href="/fir-workspace/zimni" className="block group">
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
      </div>
    </div>
  );
}
