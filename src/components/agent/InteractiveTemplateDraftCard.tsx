"use client";

import React, { useState } from "react";
import {
  FileText,
  Printer,
  Eye,
  CheckCircle2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Download,
} from "lucide-react";
import { AgentDocumentEngine } from "@/services/agent/agentDocumentEngine";
import { printA4Element } from "@/utils/printElement";

export interface InteractiveTemplateDraftCardProps {
  initialComplainantName?: string;
  initialCaseNumber?: string;
  templateType?: string;
  templateTitle?: string;
  policeStation?: string;
  address?: string;
  onApproveAndSave?: (data: {
    complainantName: string;
    caseNumber: string;
    language: "en" | "hi";
    htmlContent: string;
  }) => void;
}

export function InteractiveTemplateDraftCard({
  initialComplainantName = "Anil Kumar",
  initialCaseNumber = "125/2026",
  templateType = "notice_35_bnss",
  templateTitle = "Notice Template",
  policeStation = "Sector 14 Hisar",
  address = "Sector 14, Hisar, Haryana",
  onApproveAndSave,
}: InteractiveTemplateDraftCardProps) {
  const [language, setLanguage] = useState<"en" | "hi">("en");
  const [complainantName, setComplainantName] = useState(initialComplainantName);
  const [caseNumber, setCaseNumber] = useState(initialCaseNumber);
  const [showLivePreview, setShowLivePreview] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Generate real-time statutory notice in active language without mutating data
  const currentNoticeHtml = AgentDocumentEngine.generateNoticeHtml({
    lang: language,
    templateType,
    caseNumber: caseNumber || "125/2026",
    personName: complainantName || "Anil Kumar",
    address,
    ps: policeStation,
  });

  const handlePrint = () => {
    printA4Element(currentNoticeHtml, `${templateTitle}_${caseNumber.replace(/[\/\s]/g, "_")}`);
  };

  const handleSave = () => {
    if (onApproveAndSave) {
      onApproveAndSave({
        complainantName,
        caseNumber,
        language,
        htmlContent: currentNoticeHtml,
      });
    }
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 transition-all duration-200">
      {/* 1. Header Bar: Title & Bilingual Pill Switcher */}
      <div className="flex items-center justify-between gap-3 pb-3">
        <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <span>Templates &amp; Drafts</span>
        </h3>

        {/* Pill Language Switcher — Exact style from UI mock */}
        <div className="inline-flex items-center bg-slate-100/90 rounded-full p-0.5 border border-slate-200/80">
          <button
            type="button"
            onClick={() => setLanguage("hi")}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              language === "hi"
                ? "bg-white text-slate-900 shadow-2xs border border-slate-200"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            हिंदी
          </button>
          <button
            type="button"
            onClick={() => setLanguage("en")}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              language === "en"
                ? "bg-white text-slate-900 shadow-2xs border border-slate-200"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            English
          </button>
        </div>
      </div>

      {/* 2. Subheader Row: Template Name & Language Pill */}
      <div className="flex items-center justify-between pt-1">
        <span className="text-xs sm:text-sm font-semibold text-slate-800">
          {language === "en" ? templateTitle : "नोटिस टेम्पलेट (Notice Template)"}
        </span>
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
          {language === "en" ? "English" : "हिंदी"}
        </span>
      </div>

      {/* 3. Subtle Horizontal Divider */}
      <hr className="border-t border-slate-200/80 my-3.5" />

      {/* 4. Form Fields */}
      <div className="space-y-3.5">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            {language === "en" ? "Name of Complainant" : "शिकायतकर्ता / प्राप्तकर्ता का नाम"}
          </label>
          <input
            type="text"
            value={complainantName}
            onChange={(e) => setComplainantName(e.target.value)}
            className="w-full px-3.5 py-2.5 text-xs font-medium text-slate-800 bg-slate-100/70 border border-slate-200/80 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
            placeholder={language === "en" ? "Enter Complainant Name" : "शिकायतकर्ता का नाम दर्ज करें"}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            {language === "en" ? "Case / Complaint Number" : "केस / शिकायत संख्या"}
          </label>
          <input
            type="text"
            value={caseNumber}
            onChange={(e) => setCaseNumber(e.target.value)}
            className="w-full px-3.5 py-2.5 text-xs font-medium text-slate-800 bg-slate-100/70 border border-slate-200/80 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
            placeholder={language === "en" ? "Enter Case Number (e.g. 125/2026)" : "केस संख्या दर्ज करें (उदा. 125/2026)"}
          />
        </div>
      </div>

      {/* 5. Instruction text */}
      <p className="text-xs text-slate-600 mt-3.5 leading-relaxed">
        {language === "en"
          ? "Please provide the required details regarding the above case."
          : "उपरोक्त केस के संबंध में कृपया आवश्यक विवरण दर्ज करें।"}
      </p>

      {/* 6. Footer Note */}
      <p className="text-[11px] text-slate-400 mt-2 leading-tight">
        {language === "en"
          ? "Interactive UI illustration — switch languages to see how the template changes while data stays the same."
          : "इंटरैक्टिव UI चित्रण — भाषा बदलकर देखें कि डेटा वही रहते हुए टेम्पलेट किस प्रकार बदलता है।"}
      </p>

      {/* 7. Action Bar & Live Statutory Preview */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setShowLivePreview(!showLivePreview)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 transition cursor-pointer border border-blue-200/80"
        >
          <Eye className="w-3.5 h-3.5 text-blue-600" />
          <span>{showLivePreview ? (language === "en" ? "Hide Preview" : "प्रिव्यू छुपाएं") : (language === "en" ? "View Full Draft Preview" : "पूर्ण प्रिव्यू देखें")}</span>
          {showLivePreview ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer border border-slate-200"
            title="Print A4 official statutory notice"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>{language === "en" ? "Print A4" : "प्रिंट लें"}</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaved}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition cursor-pointer shadow-2xs"
            title="Save into case documents docket"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{isSaved ? (language === "en" ? "Saved!" : "सुरक्षित!") : (language === "en" ? "Attach to Case" : "केस में सुरक्षित करें")}</span>
          </button>
        </div>
      </div>

      {/* Expandable Statutory Document Preview in official court format */}
      {showLivePreview && (
        <div className="mt-3.5 pt-3 border-t border-slate-200">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-left max-h-80 overflow-y-auto shadow-inner text-xs">
            <div
              className="prose prose-sm max-w-none bg-white p-4 rounded-lg border border-slate-200 shadow-2xs"
              dangerouslySetInnerHTML={{ __html: currentNoticeHtml }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
