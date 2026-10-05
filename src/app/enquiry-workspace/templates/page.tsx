"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import {
  ScrollText,
  Printer,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  Mic,
  Shield,
  FileText,
  UserCheck,
  AlertTriangle,
  Download,
  Edit3,
  Eye,
  FileCheck2,
  Calendar,
  Building,
  User,
  Phone,
  MapPin,
  Clock,
  BookOpen,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { VoiceInputButton } from "@/components/ui/voice-input-button";

export type TemplateType =
  | "accused_notice_bnss"
  | "witness_notice_bnss"
  | "document_notice_bnss"
  | "spot_panchnama";

interface NoticeFormData {
  // Police Station & Header
  dispatchNo: string;
  policeStation: string;
  district: string;
  issueDate: string;

  // Noticee Details
  noticeeName: string;
  noticeeFather: string;
  noticeeAge: string;
  noticeeAddress: string;
  noticeePhone: string;
  noticeeRole: string;

  // Case / Incident details
  complaintNo: string;
  complainantName: string;
  incidentDate: string;
  sectionsOfLaw: string;
  allegationsBrief: string;

  // Appearance / Direction
  appearanceDate: string;
  appearanceTime: string;
  appearancePlace: string;
  documentsRequired: string;

  // Enquiry Officer details
  officerName: string;
  officerRank: string;
  officerPno: string;
  officerPhone: string;
}

const DEFAULT_SAMPLE_DATA: Record<TemplateType, NoticeFormData> = {
  accused_notice_bnss: {
    dispatchNo: "HP/KKR/CT/2026/NTC-0482/35(3)",
    policeStation: "Police Station City Thanesar",
    district: "Kurukshetra, Haryana",
    issueDate: new Date().toISOString().split("T")[0],

    noticeeName: "Vikas Sharma",
    noticeeFather: "Sh. Ramesh Chand Sharma",
    noticeeAge: "34 Years",
    noticeeAddress: "House No. 412, Sector 7, Urban Estate, Thanesar, Kurukshetra",
    noticeePhone: "9812044551",
    noticeeRole: "Accused / Suspect",

    complaintNo: "HAR-KKR-2026-CMP-00482",
    complainantName: "Rajesh Kumar s/o Sh. Ram Bilas",
    incidentDate: "18-09-2026",
    sectionsOfLaw: "Section 318(4), 351(2), 352 of Bharatiya Nyaya Sanhita (BNS), 2023",
    allegationsBrief:
      "Allegation of receiving ₹4,50,000/- advance for supply of structural TMT steel, followed by fraudulent evasion, refusal to supply materials, and issuing criminal threats over phone when asked for refund.",

    appearanceDate: "2026-10-07",
    appearanceTime: "11:00 AM",
    appearancePlace: "Room of Enquiry Officer (First Floor), Police Station City Thanesar",
    documentsRequired:
      "1. Original Bank Account Statement for May 2026 to Sept 2026\n2. Copy of business invoice/quotation dated 15-09-2026\n3. Proof of Identity (Aadhaar Card / PAN Card)\n4. Written explanation to the complaint allegations",

    officerName: "Surender Pal",
    officerRank: "Assistant Sub-Inspector (ASI)",
    officerPno: "PNO-23841",
    officerPhone: "9812000000",
  },

  witness_notice_bnss: {
    dispatchNo: "HP/KKR/CT/2026/WIT-0119/179",
    policeStation: "Police Station City Thanesar",
    district: "Kurukshetra, Haryana",
    issueDate: new Date().toISOString().split("T")[0],

    noticeeName: "Mohan Lal Gupta",
    noticeeFather: "Late Sh. Chaman Lal Gupta",
    noticeeAge: "52 Years",
    noticeeAddress: "Shop No. 18, Grain Market Road, Thanesar, Kurukshetra",
    noticeePhone: "9896011223",
    noticeeRole: "Independent Witness / Eyewitness",

    complaintNo: "HAR-KKR-2026-CMP-00482",
    complainantName: "Rajesh Kumar s/o Sh. Ram Bilas",
    incidentDate: "18-09-2026",
    sectionsOfLaw: "Section 173(3) & 179 Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023",
    allegationsBrief:
      "You are believed to be acquainted with the facts and circumstances of the financial transaction and verbal altercation that transpired at the building material shop on 18-09-2026.",

    appearanceDate: "2026-10-06",
    appearanceTime: "02:30 PM",
    appearancePlace: "Enquiry Officer Room, Police Station City Thanesar",
    documentsRequired:
      "1. Photo Identity Proof (Aadhaar Card)\n2. Any CCTV footage or transaction receipt in your custody relating to the incident",

    officerName: "Surender Pal",
    officerRank: "Assistant Sub-Inspector (ASI)",
    officerPno: "PNO-23841",
    officerPhone: "9812000000",
  },

  document_notice_bnss: {
    dispatchNo: "HP/KKR/CT/2026/DOC-0056/94",
    policeStation: "Police Station City Thanesar",
    district: "Kurukshetra, Haryana",
    issueDate: new Date().toISOString().split("T")[0],

    noticeeName: "The Branch Manager",
    noticeeFather: "State Bank of India (Commercial Branch)",
    noticeeAge: "Corporate Institution",
    noticeeAddress: "Railway Road, Thanesar, District Kurukshetra, Haryana",
    noticeePhone: "01744-220199",
    noticeeRole: "Custodian of Bank Records",

    complaintNo: "HAR-KKR-2026-CMP-00482",
    complainantName: "Rajesh Kumar s/o Sh. Ram Bilas",
    incidentDate: "18-09-2026",
    sectionsOfLaw: "Section 94 Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023",
    allegationsBrief:
      "For inquiry into financial transaction of ₹4,50,000/- transferred via RTGS/NEFT on 18-09-2026 into A/c No. 38491029381 maintained at your branch.",

    appearanceDate: "2026-10-08",
    appearanceTime: "04:00 PM",
    appearancePlace: "Office of SHO / EO, Police Station City Thanesar (Or via Official Email)",
    documentsRequired:
      "1. Certified Bank Statement of A/c No. 38491029381 from 01-09-2026 to date\n2. KYC & Account Opening Form of the account holder\n3. Certificate under Section 63 BNSS (erstwhile 65B Indian Evidence Act) for electronic records",

    officerName: "Surender Pal",
    officerRank: "Assistant Sub-Inspector (ASI)",
    officerPno: "PNO-23841",
    officerPhone: "9812000000",
  },

  spot_panchnama: {
    dispatchNo: "HP/KKR/CT/2026/SPT-0089/MEMO",
    policeStation: "Police Station City Thanesar",
    district: "Kurukshetra, Haryana",
    issueDate: new Date().toISOString().split("T")[0],

    noticeeName: "Panch Witness 1: Sh. Baljeet Singh",
    noticeeFather: "s/o Sh. Harnam Singh, r/o Ward 5, Thanesar",
    noticeeAge: "45 Years",
    noticeeAddress: "Place of Inspection: New Bus Stand Chowk, Thanesar",
    noticeePhone: "9416077881",
    noticeeRole: "Local Panch / Respected Citizen",

    complaintNo: "HAR-KKR-2026-CMP-00482",
    complainantName: "Rajesh Kumar s/o Sh. Ram Bilas",
    incidentDate: "18-09-2026",
    sectionsOfLaw: "Section 173(3) Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023",
    allegationsBrief:
      "Spot inspection conducted in presence of complainant and respectable local witnesses to ascertain exact topography, verify presence of CCTV cameras, and record physical state of site.",

    appearanceDate: "2026-10-05",
    appearanceTime: "03:00 PM",
    appearancePlace: "Spot of Occurrence (New Bus Stand Chowk)",
    documentsRequired:
      "1. Site Plan Rough Sketch\n2. Panchnama signatures of two independent local witnesses\n3. Digital photographs of the spot",

    officerName: "Surender Pal",
    officerRank: "Assistant Sub-Inspector (ASI)",
    officerPno: "PNO-23841",
    officerPhone: "9812000000",
  },
};

export default function NoticeTemplatesPage() {
  const { currentUser } = useAuth();
  const [activeTemplate, setActiveTemplate] = useState<TemplateType>("accused_notice_bnss");
  const [voiceLang, setVoiceLang] = useState<"hi-IN" | "en-IN">("hi-IN");
  const [formData, setFormData] = useState<NoticeFormData>(DEFAULT_SAMPLE_DATA["accused_notice_bnss"]);
  const [copied, setCopied] = useState(false);
  const [isInlineEdit, setIsInlineEdit] = useState(false);
  const [viewMode, setViewMode] = useState<"split" | "form-only" | "doc-only">("split");

  const documentRef = useRef<HTMLDivElement>(null);

  const handleTemplateSwitch = (t: TemplateType) => {
    setActiveTemplate(t);
    setFormData({
      ...DEFAULT_SAMPLE_DATA[t],
      officerName: currentUser.name || DEFAULT_SAMPLE_DATA[t].officerName,
      policeStation: currentUser.stationName || DEFAULT_SAMPLE_DATA[t].policeStation,
      district: currentUser.district ? `${currentUser.district}, Haryana` : DEFAULT_SAMPLE_DATA[t].district,
    });
  };

  const handleFieldChange = (field: keyof NoticeFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleResetSample = () => {
    setFormData(DEFAULT_SAMPLE_DATA[activeTemplate]);
  };

  const handleClearForm = () => {
    setFormData({
      dispatchNo: `HP/KKR/${new Date().getFullYear()}/NTC-____`,
      policeStation: currentUser.stationName || "Police Station City Thanesar",
      district: currentUser.district ? `${currentUser.district}, Haryana` : "Kurukshetra, Haryana",
      issueDate: new Date().toISOString().split("T")[0],
      noticeeName: "",
      noticeeFather: "",
      noticeeAge: "",
      noticeeAddress: "",
      noticeePhone: "",
      noticeeRole: "",
      complaintNo: "",
      complainantName: "",
      incidentDate: "",
      sectionsOfLaw: "",
      allegationsBrief: "",
      appearanceDate: "",
      appearanceTime: "",
      appearancePlace: "",
      documentsRequired: "",
      officerName: currentUser.name,
      officerRank: currentUser.rankDisplay || "Enquiry Officer",
      officerPno: currentUser.pno || "PNO-_____",
      officerPhone: "9812000000",
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyNotice = () => {
    if (!documentRef.current) return;
    const text = documentRef.current.innerText;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-5 animate-in fade-in-50 pb-12">
      {/* Top Header - No-print */}
      <div className="no-print space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#b8001f]">
                Field Enquiry & Legal Notices
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-200">
                BNSS 2023 Compliant
              </span>
            </div>
            <h1 className="text-2xl font-black text-[#0b192c] tracking-tight flex items-center gap-2">
              <ScrollText className="w-6 h-6 text-purple-700" />
              <span>Legal Notice & Enquiry Report Templates</span>
            </h1>
            <p className="text-xs text-slate-500">
              Live dual-page notice generator: fill or dictate fields on Page 1, instant official formatted notice preview on Page 2
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/enquiry-workspace">
              <Button variant="outline" size="sm" className="text-xs">
                &larr; Back to Workspace
              </Button>
            </Link>
            <Button
              onClick={handlePrint}
              variant="primary"
              size="sm"
              className="bg-[#0b192c] text-white flex items-center gap-1.5 shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>Print Notice (A4)</span>
            </Button>
          </div>
        </div>

        {/* Workspace Top Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <Link
            href="/enquiry-workspace"
            className="px-3.5 py-1.5 text-xs font-bold rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all"
          >
            Enquiry Dashboard
          </Link>
          <Link
            href="/enquiry-workspace/templates"
            className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-[#0b192c] text-white shadow-xs transition-all flex items-center gap-1.5"
          >
            <ScrollText className="w-3.5 h-3.5" />
            <span>Notice Templates & Generator</span>
          </Link>
        </div>

        {/* SUB-TABS: Standard Templates as requested */}
        <div className="bg-white border border-slate-200 rounded-xl p-2 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleTemplateSwitch("accused_notice_bnss")}
                className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTemplate === "accused_notice_bnss"
                    ? "bg-[#0b192c] text-white shadow-xs ring-1 ring-[#0b192c]"
                    : "text-slate-700 hover:bg-slate-100 hover:text-slate-950"
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-red-400" />
                <span>Notice to Accused (Sec 35(3) BNSS)</span>
              </button>

              <button
                type="button"
                onClick={() => handleTemplateSwitch("witness_notice_bnss")}
                className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTemplate === "witness_notice_bnss"
                    ? "bg-[#0b192c] text-white shadow-xs ring-1 ring-[#0b192c]"
                    : "text-slate-700 hover:bg-slate-100 hover:text-slate-950"
                }`}
              >
                <UserCheck className="w-3.5 h-3.5 text-blue-400" />
                <span>Notice to Witness (Sec 179 BNSS)</span>
              </button>

              <button
                type="button"
                onClick={() => handleTemplateSwitch("document_notice_bnss")}
                className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTemplate === "document_notice_bnss"
                    ? "bg-[#0b192c] text-white shadow-xs ring-1 ring-[#0b192c]"
                    : "text-slate-700 hover:bg-slate-100 hover:text-slate-950"
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                <span>Produce Documents (Sec 94 BNSS)</span>
              </button>

              <button
                type="button"
                onClick={() => handleTemplateSwitch("spot_panchnama")}
                className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTemplate === "spot_panchnama"
                    ? "bg-[#0b192c] text-white shadow-xs ring-1 ring-[#0b192c]"
                    : "text-slate-700 hover:bg-slate-100 hover:text-slate-950"
                }`}
              >
                <FileCheck2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Spot Panchnama</span>
              </button>
            </div>

            {/* View Mode controls (Split vs Form vs Document) */}
            <div className="hidden lg:flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs">
              <button
                type="button"
                onClick={() => setViewMode("split")}
                className={`px-2 py-1 rounded font-semibold text-[11px] ${
                  viewMode === "split" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Dual Split View
              </button>
              <button
                type="button"
                onClick={() => setViewMode("form-only")}
                className={`px-2 py-1 rounded font-semibold text-[11px] ${
                  viewMode === "form-only" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Page 1 (Form)
              </button>
              <button
                type="button"
                onClick={() => setViewMode("doc-only")}
                className={`px-2 py-1 rounded font-semibold text-[11px] ${
                  viewMode === "doc-only" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Page 2 (Notice)
              </button>
            </div>
          </div>
        </div>

        {/* Dictation & Quick Sample Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-blue-50/80 border border-blue-200/80 rounded-xl text-xs">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 font-bold text-blue-950">
              <Mic className="w-4 h-4 text-blue-600 animate-pulse" />
              <span>Voice Dictation for All Fields:</span>
            </div>
            <div className="flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-blue-200">
              <button
                type="button"
                onClick={() => setVoiceLang("en-IN")}
                className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${
                  voiceLang === "en-IN" ? "bg-[#0b192c] text-white" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setVoiceLang("hi-IN")}
                className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${
                  voiceLang === "hi-IN" ? "bg-[#0b192c] text-white" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Hindi
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetSample}
              className="px-2.5 py-1 text-xs font-semibold text-blue-700 bg-white border border-blue-200 hover:bg-blue-50 rounded-lg flex items-center gap-1 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Fill Sample Data</span>
            </button>
            <button
              type="button"
              onClick={handleClearForm}
              className="px-2.5 py-1 text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Clear Form</span>
            </button>
          </div>
        </div>
      </div>

      {/* DUAL-PAGE VIEW CONTAINER */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        {/* ================= PAGE 1: EDIT FIELDS FORM ================= */}
        {(viewMode === "split" || viewMode === "form-only") && (
          <div
            className={`no-print space-y-4 ${
              viewMode === "form-only" ? "xl:col-span-12" : "xl:col-span-5"
            }`}
          >
            <Card className="border-slate-200 shadow-xs">
              <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-[#0b192c] text-white flex items-center justify-center text-xs font-bold">
                    1
                  </div>
                  <div>
                    <h2 className="text-xs font-bold text-[#0b192c] uppercase tracking-wide">
                      Page 1: Edit Notice Fields
                    </h2>
                    <p className="text-[11px] text-slate-500">
                      Changes update the legal document on Page 2 in real-time
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded">
                  Live Synced
                </span>
              </div>

              <CardContent className="p-4 sm:p-5 space-y-4">
                {/* 1. Header & Dispatch */}
                <div className="space-y-3 pb-3 border-b border-slate-100">
                  <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-blue-700" />
                    <span>Station & Dispatch Reference</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-semibold text-slate-700">Dispatch Ref No. *</label>
                        <VoiceInputButton
                          preferredLang={voiceLang}
                          fieldLabel="Dispatch No"
                          currentValue={formData.dispatchNo}
                          onTranscript={(val) => handleFieldChange("dispatchNo", val)}
                        />
                      </div>
                      <input
                        type="text"
                        value={formData.dispatchNo}
                        onChange={(e) => handleFieldChange("dispatchNo", e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded font-mono focus:ring-1 focus:ring-[#0b192c]"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-semibold text-slate-700">Issue Date *</label>
                      </div>
                      <input
                        type="date"
                        value={formData.issueDate}
                        onChange={(e) => handleFieldChange("issueDate", e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded focus:ring-1 focus:ring-[#0b192c]"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-semibold text-slate-700">Police Station Name *</label>
                        <VoiceInputButton
                          preferredLang={voiceLang}
                          fieldLabel="Police Station"
                          currentValue={formData.policeStation}
                          onTranscript={(val) => handleFieldChange("policeStation", val)}
                        />
                      </div>
                      <input
                        type="text"
                        value={formData.policeStation}
                        onChange={(e) => handleFieldChange("policeStation", e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded focus:ring-1 focus:ring-[#0b192c]"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Noticee / Recipient details */}
                <div className="space-y-3 pb-3 border-b border-slate-100">
                  <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-purple-700" />
                    <span>
                      {activeTemplate === "accused_notice_bnss"
                        ? "Accused / Noticee Particulars"
                        : activeTemplate === "witness_notice_bnss"
                        ? "Witness Particulars"
                        : "Notice Recipient / Custodian"}
                    </span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-semibold text-slate-700">Full Name *</label>
                        <VoiceInputButton
                          preferredLang={voiceLang}
                          fieldLabel="Noticee Name"
                          currentValue={formData.noticeeName}
                          onTranscript={(val) => handleFieldChange("noticeeName", val)}
                        />
                      </div>
                      <input
                        type="text"
                        value={formData.noticeeName}
                        onChange={(e) => handleFieldChange("noticeeName", e.target.value)}
                        placeholder="e.g. Vikas Sharma"
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded focus:ring-1 focus:ring-[#0b192c]"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-semibold text-slate-700">Father&apos;s / Spouse Name</label>
                        <VoiceInputButton
                          preferredLang={voiceLang}
                          fieldLabel="Father's Name"
                          currentValue={formData.noticeeFather}
                          onTranscript={(val) => handleFieldChange("noticeeFather", val)}
                        />
                      </div>
                      <input
                        type="text"
                        value={formData.noticeeFather}
                        onChange={(e) => handleFieldChange("noticeeFather", e.target.value)}
                        placeholder="e.g. Sh. Ramesh Chand"
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded focus:ring-1 focus:ring-[#0b192c]"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-semibold text-slate-700">Age & Occupation</label>
                        <VoiceInputButton
                          preferredLang={voiceLang}
                          fieldLabel="Age and Occupation"
                          currentValue={formData.noticeeAge}
                          onTranscript={(val) => handleFieldChange("noticeeAge", val)}
                        />
                      </div>
                      <input
                        type="text"
                        value={formData.noticeeAge}
                        onChange={(e) => handleFieldChange("noticeeAge", e.target.value)}
                        placeholder="e.g. 34 Years, Trader"
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded focus:ring-1 focus:ring-[#0b192c]"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-semibold text-slate-700">Contact Mobile</label>
                        <VoiceInputButton
                          preferredLang={voiceLang}
                          fieldLabel="Contact Mobile"
                          currentValue={formData.noticeePhone}
                          onTranscript={(val) => {
                            const cleaned = val.replace(/\D/g, "").slice(0, 10);
                            handleFieldChange("noticeePhone", cleaned || val);
                          }}
                        />
                      </div>
                      <input
                        type="tel"
                        value={formData.noticeePhone}
                        onChange={(e) => handleFieldChange("noticeePhone", e.target.value)}
                        placeholder="98xxxxxxxx"
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded font-mono focus:ring-1 focus:ring-[#0b192c]"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-semibold text-slate-700">Full Residential / Official Address *</label>
                        <VoiceInputButton
                          preferredLang={voiceLang}
                          fieldLabel="Residential Address"
                          currentValue={formData.noticeeAddress}
                          onTranscript={(val) => handleFieldChange("noticeeAddress", val)}
                        />
                      </div>
                      <textarea
                        rows={2}
                        value={formData.noticeeAddress}
                        onChange={(e) => handleFieldChange("noticeeAddress", e.target.value)}
                        placeholder="House / Shop No., Sector/Village, District..."
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded focus:ring-1 focus:ring-[#0b192c]"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Case & Legal Sections */}
                <div className="space-y-3 pb-3 border-b border-slate-100">
                  <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-red-600" />
                    <span>Case Reference & Sections of Law</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-semibold text-slate-700">Complaint / Case No. *</label>
                        <VoiceInputButton
                          preferredLang={voiceLang}
                          fieldLabel="Complaint Number"
                          currentValue={formData.complaintNo}
                          onTranscript={(val) => handleFieldChange("complaintNo", val)}
                        />
                      </div>
                      <input
                        type="text"
                        value={formData.complaintNo}
                        onChange={(e) => handleFieldChange("complaintNo", e.target.value)}
                        placeholder="HAR-KKR-2026-CMP-00482"
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded font-mono focus:ring-1 focus:ring-[#0b192c]"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-semibold text-slate-700">Complainant Name</label>
                        <VoiceInputButton
                          preferredLang={voiceLang}
                          fieldLabel="Complainant Name"
                          currentValue={formData.complainantName}
                          onTranscript={(val) => handleFieldChange("complainantName", val)}
                        />
                      </div>
                      <input
                        type="text"
                        value={formData.complainantName}
                        onChange={(e) => handleFieldChange("complainantName", e.target.value)}
                        placeholder="e.g. Rajesh Kumar"
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded focus:ring-1 focus:ring-[#0b192c]"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-semibold text-slate-700">Relevant Sections of Law *</label>
                        <VoiceInputButton
                          preferredLang={voiceLang}
                          fieldLabel="Sections of Law"
                          currentValue={formData.sectionsOfLaw}
                          onTranscript={(val) => handleFieldChange("sectionsOfLaw", val)}
                        />
                      </div>
                      <input
                        type="text"
                        value={formData.sectionsOfLaw}
                        onChange={(e) => handleFieldChange("sectionsOfLaw", e.target.value)}
                        placeholder="e.g. Section 318(4), 351(2) BNS 2023"
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded focus:ring-1 focus:ring-[#0b192c]"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-semibold text-slate-700">
                          Facts / Substance of Allegations *
                        </label>
                        <VoiceInputButton
                          preferredLang={voiceLang}
                          fieldLabel="Allegations"
                          currentValue={formData.allegationsBrief}
                          onTranscript={(val) => handleFieldChange("allegationsBrief", val)}
                        />
                      </div>
                      <textarea
                        rows={3}
                        value={formData.allegationsBrief}
                        onChange={(e) => handleFieldChange("allegationsBrief", e.target.value)}
                        placeholder="Brief summary of allegation or purpose for calling..."
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded focus:ring-1 focus:ring-[#0b192c]"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Appearance Schedule & Location */}
                <div className="space-y-3 pb-3 border-b border-slate-100">
                  <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span>Appearance Schedule & Venue</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-semibold text-slate-700">Date to Appear *</label>
                      </div>
                      <input
                        type="date"
                        value={formData.appearanceDate}
                        onChange={(e) => handleFieldChange("appearanceDate", e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded focus:ring-1 focus:ring-[#0b192c]"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-semibold text-slate-700">Time to Appear *</label>
                        <VoiceInputButton
                          preferredLang={voiceLang}
                          fieldLabel="Time of Appearance"
                          currentValue={formData.appearanceTime}
                          onTranscript={(val) => handleFieldChange("appearanceTime", val)}
                        />
                      </div>
                      <input
                        type="text"
                        value={formData.appearanceTime}
                        onChange={(e) => handleFieldChange("appearanceTime", e.target.value)}
                        placeholder="e.g. 11:00 AM"
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded focus:ring-1 focus:ring-[#0b192c]"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-semibold text-slate-700">Place / Room to Appear *</label>
                        <VoiceInputButton
                          preferredLang={voiceLang}
                          fieldLabel="Place to Appear"
                          currentValue={formData.appearancePlace}
                          onTranscript={(val) => handleFieldChange("appearancePlace", val)}
                        />
                      </div>
                      <input
                        type="text"
                        value={formData.appearancePlace}
                        onChange={(e) => handleFieldChange("appearancePlace", e.target.value)}
                        placeholder="e.g. Office of EO, PS City Thanesar"
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded focus:ring-1 focus:ring-[#0b192c]"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-semibold text-slate-700">
                          Documents / Records Directed to Bring
                        </label>
                        <VoiceInputButton
                          preferredLang={voiceLang}
                          fieldLabel="Documents Required"
                          currentValue={formData.documentsRequired}
                          onTranscript={(val) => handleFieldChange("documentsRequired", val)}
                        />
                      </div>
                      <textarea
                        rows={3}
                        value={formData.documentsRequired}
                        onChange={(e) => handleFieldChange("documentsRequired", e.target.value)}
                        placeholder="List specific records, bank statements, CCTV, ID proofs..."
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded focus:ring-1 focus:ring-[#0b192c]"
                      />
                    </div>
                  </div>
                </div>

                {/* 5. Enquiry Officer Signatory */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Enquiry / Investigating Officer</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-semibold text-slate-700">Officer Name *</label>
                        <VoiceInputButton
                          preferredLang={voiceLang}
                          fieldLabel="Officer Name"
                          currentValue={formData.officerName}
                          onTranscript={(val) => handleFieldChange("officerName", val)}
                        />
                      </div>
                      <input
                        type="text"
                        value={formData.officerName}
                        onChange={(e) => handleFieldChange("officerName", e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded focus:ring-1 focus:ring-[#0b192c]"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-semibold text-slate-700">Rank & PNO *</label>
                      </div>
                      <input
                        type="text"
                        value={`${formData.officerRank} (${formData.officerPno})`}
                        onChange={(e) => handleFieldChange("officerRank", e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded focus:ring-1 focus:ring-[#0b192c]"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ================= PAGE 2: FULL OFFICIAL NOTICE WITH EDITABLE/FORMATTED FIELDS ================= */}
        {(viewMode === "split" || viewMode === "doc-only") && (
          <div className={`${viewMode === "doc-only" ? "xl:col-span-12" : "xl:col-span-7"}`}>
            {/* Top Toolbar of Document */}
            <div className="no-print mb-2.5 flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-100 border border-slate-200 rounded-xl">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-purple-700 text-white flex items-center justify-center text-xs font-bold">
                  2
                </div>
                <span className="text-xs font-bold text-slate-900">
                  Page 2: Official Notice Document
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsInlineEdit(!isInlineEdit)}
                  className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-all ${
                    isInlineEdit
                      ? "bg-amber-100 text-amber-900 border border-amber-300"
                      : "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50"
                  }`}
                  title="Enable direct in-place typing into the notice preview"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{isInlineEdit ? "Direct Edit: ON" : "Direct Edit: OFF"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyNotice}
                  className="px-2.5 py-1 bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 rounded text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Copied!" : "Copy Text"}</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-3 py-1 bg-[#0b192c] text-white rounded text-xs font-bold flex items-center gap-1.5 shadow-2xs hover:bg-slate-850 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print A4</span>
                </button>
              </div>
            </div>

            {/* THE FORMAL LEGAL NOTICE DOCUMENT (A4 styled) */}
            <div
              ref={documentRef}
              contentEditable={isInlineEdit}
              suppressContentEditableWarning={true}
              className={`bg-white border border-slate-300 rounded-xl p-8 sm:p-12 shadow-md font-serif text-slate-900 transition-all ${
                isInlineEdit ? "ring-2 ring-amber-400 bg-amber-50/10 cursor-text" : ""
              }`}
              style={{ minHeight: "850px", lineHeight: "1.7" }}
            >
              {/* Header Seal */}
              <div className="text-center pb-4 border-b-2 border-slate-900">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Shield className="w-7 h-7 text-[#0b192c]" />
                  <span className="text-sm font-black tracking-widest uppercase font-sans text-[#0b192c]">
                    HARYANA POLICE
                  </span>
                </div>
                <h3 className="text-xs font-bold tracking-wider uppercase font-sans text-slate-700">
                  GOVERNMENT OF HARYANA
                </h3>
                <h2 className="text-base font-black uppercase text-slate-950 mt-1 font-sans">
                  OFFICE OF THE ENQUIRY / INVESTIGATING OFFICER
                </h2>
                <p className="text-xs font-bold uppercase text-slate-800 font-sans">
                  {formData.policeStation}, DISTRICT {formData.district}
                </p>
              </div>

              {/* Statutory Heading */}
              <div className="my-5 text-center">
                {activeTemplate === "accused_notice_bnss" && (
                  <div>
                    <h1 className="text-sm sm:text-base font-black uppercase tracking-wide underline underline-offset-4 text-slate-950 font-sans">
                      NOTICE UNDER SECTION 35(3) OF BHARATIYA NAGARIK SURAKSHA SANHITA (BNSS), 2023
                    </h1>
                    <p className="text-[11px] font-sans text-slate-600 mt-0.5">
                      (Corresponding to Section 41A of Code of Criminal Procedure, 1973)
                    </p>
                  </div>
                )}

                {activeTemplate === "witness_notice_bnss" && (
                  <div>
                    <h1 className="text-sm sm:text-base font-black uppercase tracking-wide underline underline-offset-4 text-slate-950 font-sans">
                      NOTICE TO WITNESS UNDER SECTION 179 OF BNSS, 2023
                    </h1>
                    <p className="text-[11px] font-sans text-slate-600 mt-0.5">
                      (Corresponding to Section 160 CrPC - Order for attendance of witness)
                    </p>
                  </div>
                )}

                {activeTemplate === "document_notice_bnss" && (
                  <div>
                    <h1 className="text-sm sm:text-base font-black uppercase tracking-wide underline underline-offset-4 text-slate-950 font-sans">
                      ORDER FOR PRODUCTION OF DOCUMENTS / RECORDS U/S 94 BNSS, 2023
                    </h1>
                    <p className="text-[11px] font-sans text-slate-600 mt-0.5">
                      (Summons to produce document or other thing - Erstwhile Section 91 CrPC)
                    </p>
                  </div>
                )}

                {activeTemplate === "spot_panchnama" && (
                  <div>
                    <h1 className="text-sm sm:text-base font-black uppercase tracking-wide underline underline-offset-4 text-slate-950 font-sans">
                      MEMORANDUM OF SPOT INSPECTION / PANCHNAMA
                    </h1>
                    <p className="text-[11px] font-sans text-slate-600 mt-0.5">
                      (Inquiry under Section 173(3) Bharatiya Nagarik Suraksha Sanhita, 2023)
                    </p>
                  </div>
                )}
              </div>

              {/* Reference and Date Bar */}
              <div className="flex items-center justify-between text-xs font-sans font-semibold border-b border-slate-200 pb-2 mb-4">
                <div>
                  <span className="text-slate-500">Dispatch / Ref No.:</span>{" "}
                  <span className="font-mono font-bold text-slate-900 bg-blue-50 px-1 py-0.5 rounded">
                    {formData.dispatchNo || "[Dispatch No]"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Date of Notice:</span>{" "}
                  <span className="font-bold text-slate-900">
                    {formData.issueDate || "[Date]"}
                  </span>
                </div>
              </div>

              {/* Addressee Block */}
              <div className="mb-4 text-xs sm:text-sm space-y-1">
                <p className="font-bold text-slate-900">To,</p>
                <div className="pl-4 font-sans space-y-0.5">
                  <p className="font-bold text-slate-950 text-sm">
                    {formData.noticeeName || "[Name of Noticee / Accused]"}
                  </p>
                  {formData.noticeeFather && (
                    <p className="text-slate-700">
                      S/o, D/o, W/o: <span className="font-semibold">{formData.noticeeFather}</span>
                    </p>
                  )}
                  {formData.noticeeAge && (
                    <p className="text-slate-700">
                      Age / Status: <span className="font-semibold">{formData.noticeeAge}</span>
                    </p>
                  )}
                  <p className="text-slate-700">
                    Resident of:{" "}
                    <span className="font-semibold">
                      {formData.noticeeAddress || "[Full Residential Address]"}
                    </span>
                  </p>
                  {formData.noticeePhone && (
                    <p className="text-slate-700">
                      Contact Mobile: <span className="font-mono font-semibold">{formData.noticeePhone}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Preamble / Whereas Clause */}
              <div className="text-xs sm:text-sm text-justify space-y-3">
                <p>
                  <strong>WHEREAS</strong>, an inquiry / preliminary probe into Complaint / Case File bearing
                  Reference No. <span className="font-mono font-bold bg-slate-100 px-1">{formData.complaintNo}</span> is
                  being conducted at this Police Station regarding an incident that occurred on or about{" "}
                  <strong>{formData.incidentDate || "[Date of Incident]"}</strong> on the complaint lodged by{" "}
                  <strong>{formData.complainantName || "[Complainant Name]"}</strong> regarding offences punishable under{" "}
                  <strong>{formData.sectionsOfLaw || "[Sections of Law]"}</strong>.
                </p>

                <p>
                  <strong>AND WHEREAS</strong>, from the contents of the said complaint and preliminary inquiry,
                  it has been alleged that:
                </p>

                <div className="p-3 bg-slate-50 border-l-4 border-[#0b192c] rounded-r text-xs leading-relaxed italic text-slate-800 font-sans">
                  &ldquo;{formData.allegationsBrief || "[Substance of complaint allegations]"}&rdquo;
                </div>

                {activeTemplate === "accused_notice_bnss" && (
                  <>
                    <p>
                      <strong>AND WHEREAS</strong>, your presence and personal examination are considered
                      strictly necessary for ascertaining true facts and ensuring lawful investigation in accordance
                      with Section 35(3) of the Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023.
                    </p>

                    <p>
                      <strong>NOW THEREFORE</strong>, you are hereby directed and called upon to appear in person before
                      the undersigned Enquiry Officer on <strong>{formData.appearanceDate || "[Appearance Date]"}</strong>{" "}
                      at <strong>{formData.appearanceTime || "[Time]"}</strong> at{" "}
                      <strong>{formData.appearancePlace || "[Office of EO, Police Station]"}</strong>.
                    </p>

                    {formData.documentsRequired && (
                      <div>
                        <p className="font-bold text-slate-900 mb-1">
                          You are further directed to produce the following original records / explanations at the time of
                          appearance:
                        </p>
                        <div className="pl-4 whitespace-pre-line font-sans text-xs bg-slate-50 p-2.5 rounded border border-slate-200">
                          {formData.documentsRequired}
                        </div>
                      </div>
                    )}

                    {/* Statutory Undertakings */}
                    <div className="mt-3 pt-2 border-t border-slate-200 space-y-1.5 text-[11px] font-sans">
                      <p className="font-bold uppercase tracking-wider text-slate-900">
                        STATUTORY CONDITIONS & UNDERTAKINGS (Section 35(3) BNSS):
                      </p>
                      <ul className="list-disc pl-5 space-y-1 text-slate-700">
                        <li>You shall not commit any offence in future while the enquiry is pending.</li>
                        <li>
                          You shall not induce, threat, or promise any person acquainted with the facts of the case to
                          dissuade them from disclosing facts to the police or Court.
                        </li>
                        <li>
                          You shall render full cooperation to the enquiry officer and appear as and when summoned.
                        </li>
                        <li>
                          You shall not tamper with or destroy any documentary, electronic, or physical evidence.
                        </li>
                      </ul>
                      <p className="text-red-700 font-bold mt-1">
                        WARNING: Take note that failure to comply with the terms of this notice or non-appearance without
                        lawful cause may render you liable for immediate custodial arrest in terms of Section 35(3) &amp;
                        35(6) of Bharatiya Nagarik Suraksha Sanhita, 2023.
                      </p>
                    </div>
                  </>
                )}

                {activeTemplate === "witness_notice_bnss" && (
                  <>
                    <p>
                      <strong>NOW THEREFORE</strong>, by virtue of powers conferred under Section 179 BNSS, 2023, you
                      are hereby directed to attend before the undersigned on{" "}
                      <strong>{formData.appearanceDate}</strong> at <strong>{formData.appearanceTime}</strong> at{" "}
                      <strong>{formData.appearancePlace}</strong> to give evidence and answer questions relating to the
                      matter under inquiry.
                    </p>
                    {formData.documentsRequired && (
                      <div className="pl-4 whitespace-pre-line font-sans text-xs bg-slate-50 p-2.5 rounded border border-slate-200">
                        {formData.documentsRequired}
                      </div>
                    )}
                  </>
                )}

                {activeTemplate === "document_notice_bnss" && (
                  <>
                    <p>
                      <strong>NOW THEREFORE</strong>, you are hereby required by this order u/s 94 BNSS, 2023 to produce
                      or cause to be produced the records/documents specified below on or before{" "}
                      <strong>{formData.appearanceDate}</strong> at <strong>{formData.appearanceTime}</strong>:
                    </p>
                    <div className="pl-4 whitespace-pre-line font-sans text-xs bg-slate-50 p-2.5 rounded border border-slate-200">
                      {formData.documentsRequired}
                    </div>
                  </>
                )}

                {activeTemplate === "spot_panchnama" && (
                  <>
                    <p>
                      <strong>SPOT OBSERVATION:</strong> At the instance of complainant and in the presence of the
                      undersigned panchas, the spot was inspected. The boundaries and surroundings were verified as noted
                      below:
                    </p>
                    <div className="pl-4 whitespace-pre-line font-sans text-xs bg-slate-50 p-2.5 rounded border border-slate-200">
                      {formData.documentsRequired}
                    </div>
                  </>
                )}
              </div>

              {/* Signatures & Seal Block */}
              <div className="mt-8 pt-4 flex items-end justify-between text-xs font-sans">
                <div className="text-center w-36">
                  <div className="h-14 border border-dashed border-slate-300 rounded flex items-center justify-center text-[10px] text-slate-400">
                    Official Station Seal
                  </div>
                  <p className="mt-1 font-bold text-slate-700">POLICE SEAL</p>
                </div>

                <div className="text-right space-y-0.5">
                  <p className="font-bold text-slate-900 text-sm">{formData.officerName}</p>
                  <p className="text-slate-700">{formData.officerRank}</p>
                  <p className="font-mono text-slate-600">{formData.officerPno}</p>
                  <p className="text-slate-700">{formData.policeStation}</p>
                  <p className="text-slate-600 font-mono">Mob: {formData.officerPhone}</p>
                  <p className="text-[11px] font-bold text-[#0b192c]">Enquiry / Investigating Officer</p>
                </div>
              </div>

              {/* Service Acknowledgment Slip */}
              <div className="mt-8 pt-4 border-t-2 border-dashed border-slate-400 text-xs font-sans space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold uppercase tracking-wider text-slate-800">
                    RECEIPT / ACKNOWLEDGMENT OF NOTICE
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Ref: {formData.dispatchNo}
                  </span>
                </div>
                <p className="text-[11px] text-slate-700 leading-relaxed">
                  I, <strong>{formData.noticeeName || "________________________"}</strong>, hereby acknowledge that I have
                  personally received a true copy of this Notice under Section 35(3) BNSS, 2023 on this date
                  ______/______/2026 at ______:______ hrs, and I undertake to appear in compliance thereof.
                </p>
                <div className="pt-4 flex items-center justify-between text-[11px]">
                  <div>
                    <p className="text-slate-400">_________________________________</p>
                    <p className="font-bold text-slate-800 mt-0.5">Serving Police Officer (Name & Belt No)</p>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-400">_________________________________</p>
                    <p className="font-bold text-slate-800 mt-0.5">Signature / Thumb Impression of Noticee</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
