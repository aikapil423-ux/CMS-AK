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
  Languages,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function EnquiryWorkspacePage() {
  const { currentUser } = useAuth();
  const { language, setLanguage, isHindi } = useLanguage();

  return (
    <div className="space-y-6 animate-in fade-in-50">
      {/* Header with Title and Language Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-[#0b192c] tracking-tight">
            {isHindi ? "जांच अधिकारी (EO) कार्यक्षेत्र" : "Enquiry Officer (EO) Workspace"}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {isHindi
              ? "प्रारंभिक जांच रिपोर्ट, असंज्ञेय रपट (NCR), वैधानिक सूचना-पत्र व प्रारूप संपादक का प्रबंधन।"
              : "Haryana Police structured enquiry proformas, statutory notices, non-cognizable reports and document templates."}
          </p>
        </div>

        {/* Language Switcher Toggle */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs shrink-0 self-start sm:self-auto">
          <span className="text-[11px] font-bold text-slate-600 px-2 flex items-center gap-1.5">
            <Languages className="w-3.5 h-3.5 text-blue-700" />
            <span>{isHindi ? "भाषा / Lang:" : "Lang / भाषा:"}</span>
          </span>
          <button
            type="button"
            onClick={() => setLanguage("hi")}
            className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
              isHindi
                ? "bg-amber-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            हिन्दी
          </button>
          <button
            type="button"
            onClick={() => setLanguage("en")}
            className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
              !isHindi
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            English
          </button>
        </div>
      </div>

      {/* 4 Workspace Modules / Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tab 1: Draft Enquiry Reports */}
        <Link href="/enquiry-workspace/drafts" className="block group">
          <Card className="border-slate-200 hover:border-amber-400 hover:shadow-md transition-all cursor-pointer bg-white group-hover:bg-amber-50/20 h-full">
            <CardContent className="p-5 flex flex-col justify-between h-full">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                  <FileCheck2 className="w-5 h-5 text-amber-700 group-hover:scale-110 transition-transform" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm group-hover:text-amber-800 transition-colors">
                    {isHindi ? "जांच रिपोर्ट प्रारूप" : "Draft Enquiry Reports"}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {isHindi
                      ? "हरियाणा पुलिस मानकीकृत प्रपत्र (4-पंक्ति, 3-कॉलम, सीएम विंडो) शिकायत डॉकेट के आधार पर।"
                      : "Haryana Police structured proformas (4-Row, 3-Column, CM Window) based on complaint docket."}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end text-xs font-bold text-amber-700 mt-4 group-hover:translate-x-1 transition-all gap-1">
                <span>{isHindi ? "रिपोर्ट खोलें" : "Open Reports"}</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Tab 2: NCR u/s 174 BNSS */}
        <Link href="/enquiry-workspace/ncr" className="block group">
          <Card className="border-slate-200 hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer bg-white group-hover:bg-emerald-50/20 h-full">
            <CardContent className="p-5 flex flex-col justify-between h-full">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-emerald-700 group-hover:scale-110 transition-transform" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm group-hover:text-emerald-800 transition-colors">
                    {isHindi ? "असंज्ञेय रपट (NCR u/s 174 BNSS)" : "NCR u/s 174 BNSS"}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {isHindi
                      ? "असंज्ञेय अपराध सूचना प्रपत्र, थाना रोजनामचा (GD) प्रविष्टि एवं न्यायिक मजिस्ट्रेट परामर्श।"
                      : "First Information of Non-Cognizable Offence proforma, Station GD entry & magistrate advice."}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end text-xs font-bold text-emerald-700 mt-4 group-hover:translate-x-1 transition-all gap-1">
                <span>{isHindi ? "NCR खोलें" : "Open NCR"}</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Tab 3: Notice Generator */}
        <Link href="/enquiry-workspace/templates" className="block group">
          <Card className="border-slate-200 hover:border-purple-400 hover:shadow-md transition-all cursor-pointer bg-white group-hover:bg-purple-50/20 h-full">
            <CardContent className="p-5 flex flex-col justify-between h-full">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center shrink-0">
                  <ScrollText className="w-5 h-5 text-purple-700 group-hover:scale-110 transition-transform" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm group-hover:text-purple-800 transition-colors">
                    {isHindi ? "सूचना-पत्र जनरेटर (Notice Generator)" : "Notice Generator"}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {isHindi
                      ? "हरियाणा पुलिस उपस्थिति सूचना-पत्र (धारा 173(3) BNSS के अंतर्गत गवाह/पक्ष को सम्मन)।"
                      : "Haryana Police Appearance Notice (सूचना-पत्र u/s 173(3) BNSS)."}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end text-xs font-bold text-purple-700 mt-4 group-hover:translate-x-1 transition-all gap-1">
                <span>{isHindi ? "जनरेटर खोलें" : "Open Generator"}</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Tab 4: Generate Report Template */}
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
                      {isHindi ? "टेम्पलेट बिल्डर (Template Builder)" : "Generate Report Template"}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {isHindi
                      ? "वर्ड-स्टाइल कानूनी दस्तावेज़ संपादक, डायनामिक CMS फील्ड्स, टोकन्स व आधिकारिक प्रारूप।"
                      : "Word-style Document Builder, dynamic CMS placeholders, case tokens & templates."}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end text-xs font-bold text-blue-700 mt-4 group-hover:translate-x-1 transition-all gap-1">
                <span>{isHindi ? "बिल्डर खोलें" : "Open Builder"}</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
