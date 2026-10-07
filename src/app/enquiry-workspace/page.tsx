"use client";

import React from "react";
import Link from "next/link";
import { UserCheck, FileText, ArrowRight, Shield, CheckCircle, Clock, ScrollText, Sparkles, FileCheck2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function EnquiryWorkspacePage() {
  const { currentUser } = useAuth();

  return (
    <div className="space-y-6 animate-in fade-in-50">
      <div>
        <h1 className="text-2xl font-black text-[#0b192c] tracking-tight">
          Enquiry Officer (EO) Workspace
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/enquiry-workspace/drafts" className="block group">
          <Card className="border-slate-200 hover:border-amber-400 hover:shadow-md transition-all cursor-pointer bg-white group-hover:bg-amber-50/20 h-full">
            <CardContent className="p-5 flex flex-col justify-between h-full">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                  <FileCheck2 className="w-5 h-5 text-amber-700 group-hover:scale-110 transition-transform" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm group-hover:text-amber-800 transition-colors">
                    Draft Enquiry Reports
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Haryana Police structured proformas (4-Row, 3-Column, CM Window) based on complaint docket.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end text-xs font-bold text-amber-700 mt-4 group-hover:translate-x-1 transition-all gap-1">
                <span>Open Reports</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/enquiry-workspace/ncr" className="block group">
          <Card className="border-slate-200 hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer bg-white group-hover:bg-emerald-50/20 h-full">
            <CardContent className="p-5 flex flex-col justify-between h-full">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-emerald-700 group-hover:scale-110 transition-transform" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm group-hover:text-emerald-800 transition-colors">
                    NCR u/s 174 BNSS
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    First Information of Non-Cognizable Offence proforma, Station GD entry &amp; magistrate advice.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end text-xs font-bold text-emerald-700 mt-4 group-hover:translate-x-1 transition-all gap-1">
                <span>Open NCR</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/enquiry-workspace/templates" className="block group">
          <Card className="border-slate-200 hover:border-purple-400 hover:shadow-md transition-all cursor-pointer bg-white group-hover:bg-purple-50/20 h-full">
            <CardContent className="p-5 flex flex-col justify-between h-full">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center shrink-0">
                  <ScrollText className="w-5 h-5 text-purple-700 group-hover:scale-110 transition-transform" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm group-hover:text-purple-800 transition-colors">
                    Notice Generator
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Legal notices (u/s 173(3) BNSS), CDR requisition, 4-page arrest memo, &amp; NATGRID.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end text-xs font-bold text-purple-700 mt-4 group-hover:translate-x-1 transition-all gap-1">
                <span>Open Generator</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/enquiry-workspace/builder" className="block group">
          <Card className="border-slate-200 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer bg-white group-hover:bg-blue-50/20 h-full">
            <CardContent className="p-5 flex flex-col justify-between h-full">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 text-blue-700 group-hover:scale-110 transition-transform" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-slate-900 text-sm group-hover:text-blue-800 transition-colors">
                      Generate Report Template
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Word-style Document Builder, dynamic CMS placeholders, case tokens &amp; templates.
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
      </div>
    </div>
  );
}
