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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#b8001f]">
            Field Investigation & Verification
          </span>
          <h1 className="text-2xl font-black text-[#0b192c] tracking-tight">
            Enquiry Officer (EO) Workspace
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Field enquiry logs, witness statements, spot inspection records, and draft enquiry reports
          </p>
        </div>
        <Link href="/enquiry-workspace/templates">
          <Button variant="primary" size="sm" className="bg-[#0b192c] text-white flex items-center gap-1.5 shadow-xs">
            <ScrollText className="w-4 h-4" />
            <span>Notice Templates & Generator</span>
          </Button>
        </Link>
      </div>

      {/* Top Workspace Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <Link
          href="/enquiry-workspace"
          className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-[#0b192c] text-white shadow-xs transition-all"
        >
          Enquiry Dashboard
        </Link>
        <Link
          href="/enquiry-workspace/drafts"
          className="px-3.5 py-1.5 text-xs font-bold rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 flex items-center gap-1.5 transition-all"
        >
          <FileCheck2 className="w-3.5 h-3.5 text-amber-600" />
          <span>Draft Reports &amp; NCR</span>
          <span className="px-1.5 py-0.2 text-[10px] bg-amber-100 text-amber-800 rounded font-mono font-bold">1 Draft</span>
        </Link>
        <Link
          href="/enquiry-workspace/templates"
          className="px-3.5 py-1.5 text-xs font-bold rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 flex items-center gap-1.5 transition-all"
        >
          <ScrollText className="w-3.5 h-3.5 text-purple-600" />
          <span>Notice &amp; Legal Templates</span>
        </Link>
      </div>

      <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3">
        <UserCheck className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
        <div className="text-xs text-blue-900">
          <p className="font-bold">Active Officer: {currentUser.name} ({currentUser.roleDisplay})</p>
          <p className="mt-0.5 text-blue-800">
            Field inquiry workspace for complaint verification, notice generation, and final enquiry reports.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-slate-200">
          <CardContent className="p-5 space-y-2">
            <h3 className="font-bold text-slate-900 text-sm">Assigned Field Inquiries</h3>
            <p className="text-2xl font-black text-[#0b192c]">4 Cases</p>
            <p className="text-xs text-slate-500">Pending statement recording and spot verification.</p>
            <div className="pt-2">
              <Link href="/complaints">
                <Button variant="outline" size="sm" className="w-full text-xs">
                  View Cases in Register
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-5 space-y-2">
            <h3 className="font-bold text-slate-900 text-sm">Draft Enquiry Reports &amp; NCR</h3>
            <p className="text-2xl font-black text-amber-700">1 Draft</p>
            <p className="text-xs text-slate-500">NCR templates, preliminary inquiry reports &amp; FIR recommendations.</p>
            <div className="pt-2">
              <Link href="/enquiry-workspace/drafts">
                <Button variant="outline" size="sm" className="w-full text-xs text-amber-800 border-amber-300 hover:bg-amber-50">
                  Open Drafts &amp; NCR &rarr;
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-5 space-y-2">
            <h3 className="font-bold text-slate-900 text-sm">Notice & Report Generator</h3>
            <p className="text-2xl font-black text-purple-700">4 Templates</p>
            <p className="text-xs text-slate-500">Notice to Accused u/s 35(3) BNSS, Witness Notice, & Panchnama.</p>
            <div className="pt-2">
              <Link href="/enquiry-workspace/templates">
                <Button variant="outline" size="sm" className="w-full text-xs text-purple-700 border-purple-200 hover:bg-purple-50">
                  Open Notice Templates &rarr;
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
