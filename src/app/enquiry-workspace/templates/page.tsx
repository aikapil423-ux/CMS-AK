"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
  Download,
  FileCheck2,
  Building,
  User,
  Phone,
  ArrowLeft,
  Save,
  CheckCircle2,
  Calendar,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { VoiceInputButton } from "@/components/ui/voice-input-button";
import { ComplaintService } from "@/services/complaintService";
import { ComplaintItem, NoticeFormData } from "@/types";
import { generateNoticeDocumentHtml } from "@/utils/documentHtmlGenerators";

export type TemplateType =
  | "complaint_receipt"
  | "accused_notice_bnss"
  | "witness_notice_bnss"
  | "document_notice_bnss"
  | "spot_panchnama";

const DEFAULT_SAMPLE_DATA: Record<TemplateType, NoticeFormData> = {
  complaint_receipt: {
    dispatchNo: "HAR-KKR-2026-CMP-00482",
    policeStation: "Police Station City Thanesar",
    district: "Kurukshetra, Haryana",
    issueDate: new Date().toISOString().split("T")[0],

    noticeeName: "Rajesh Kumar",
    noticeeFather: "Sh. Ram Bilas",
    noticeeAge: "38 Years",
    noticeeAddress: "House No. 124, Sector 7, Urban Estate, Thanesar, Kurukshetra",
    noticeePhone: "9812033441",
    noticeeRole: "Complainant",

    complaintNo: "HAR-KKR-2026-CMP-00482",
    complainantName: "Rajesh Kumar",
    incidentDate: new Date().toISOString().split("T")[0],
    sectionsOfLaw: "Cheating & Criminal Breach of Trust (Section 316/318 BNS)",
    allegationsBrief: "Complaint regarding financial fraud and cheating of ₹4,50,000/- for non-delivery of structural materials.",

    appearanceDate: new Date().toISOString().split("T")[0],
    appearanceTime: "11:00 AM",
    appearancePlace: "Police Station City Thanesar",
    documentsRequired: "Original Complaint Copy & Money Transaction Receipts",

    officerName: "Surender Pal",
    officerRank: "Sub-Inspector",
    officerPno: "742/KKR",
    officerPhone: "9812034567",

    mhcName: "HC Devinder Kumar",
    mhcRank: "Head Constable (MHC)",
    mhcBeltNumber: "889/KKR",
    mhcPhone: "9813098765",
  },

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

const TEMPLATE_CONFIG: Record<TemplateType, { label: string; icon: any; color: string }> = {
  complaint_receipt: {
    label: "Receipt of Registered Complaint (पावती रसीद)",
    icon: FileCheck2,
    color: "text-emerald-500",
  },
  accused_notice_bnss: {
    label: "Notice to Accused (Sec 35(3) BNSS)",
    icon: Shield,
    color: "text-red-500",
  },
  witness_notice_bnss: {
    label: "Notice to Witness (Sec 179 BNSS)",
    icon: UserCheck,
    color: "text-blue-500",
  },
  document_notice_bnss: {
    label: "Produce Documents (Sec 94 BNSS)",
    icon: FileText,
    color: "text-amber-500",
  },
  spot_panchnama: {
    label: "Spot Panchnama",
    icon: FileCheck2,
    color: "text-emerald-500",
  },
};

function NoticeTemplatesContent() {
  const { currentUser } = useAuth();
  const searchParams = useSearchParams();
  const complaintIdParam = searchParams.get("complaintId");
  const templateParam = searchParams.get("template") as TemplateType | null;

  const [complaint, setComplaint] = useState<ComplaintItem | null>(null);
  const [activeTemplate, setActiveTemplate] = useState<TemplateType>(
    templateParam && DEFAULT_SAMPLE_DATA[templateParam]
      ? templateParam
      : "accused_notice_bnss"
  );
  const [voiceLang, setVoiceLang] = useState<"hi-IN" | "en-IN">("hi-IN");
  const [formData, setFormData] = useState<NoticeFormData>(
    DEFAULT_SAMPLE_DATA[
      templateParam && DEFAULT_SAMPLE_DATA[templateParam]
        ? templateParam
        : "accused_notice_bnss"
    ]
  );
  const [copied, setCopied] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const documentRef = useRef<HTMLDivElement>(null);

  // Load complaint if complaintId is present
  useEffect(() => {
    if (!complaintIdParam) return;
    async function loadComplaint() {
      try {
        const found = await ComplaintService.getComplaintById(complaintIdParam!);
        if (found) {
          setComplaint(found);
          const currentType = templateParam && DEFAULT_SAMPLE_DATA[templateParam] ? templateParam : activeTemplate;
          const sample = DEFAULT_SAMPLE_DATA[currentType];
          const primaryAccused = found.accusedList?.[0] || {};

          let noticeeName = sample.noticeeName;
          let noticeeFather = sample.noticeeFather;
          let noticeeAddress = sample.noticeeAddress;
          let noticeePhone = sample.noticeePhone;
          let noticeeRole = sample.noticeeRole;

          if (currentType === "complaint_receipt") {
            noticeeName = found.complainantName;
            noticeeFather = found.complainantFatherSpouse || (found as any).complainantFather || "";
            noticeeAddress = found.complainantAddress;
            noticeePhone = found.complainantMobile || found.complainantAltPhone || sample.noticeePhone;
            noticeeRole = "Complainant";
          } else if (currentType === "accused_notice_bnss") {
            noticeeName = primaryAccused.name || (found as any).accusedName || sample.noticeeName;
            noticeeFather = primaryAccused.fatherName || (found as any).accusedFather || sample.noticeeFather;
            noticeeAddress = primaryAccused.address || (found as any).accusedAddress || sample.noticeeAddress;
            noticeePhone = primaryAccused.phone || (found as any).accusedPhone || sample.noticeePhone;
            noticeeRole = "Accused / Suspect";
          }

          setFormData({
            dispatchNo: `HP/KKR/CT/${new Date().getFullYear()}/NTC-${found.complaintNumber.split("-").pop() || "01"}`,
            policeStation: found.policeStation || currentUser.stationName || "Police Station City Thanesar",
            district: "Kurukshetra, Haryana",
            issueDate: new Date().toISOString().split("T")[0],

            noticeeName,
            noticeeFather,
            noticeeAge: sample.noticeeAge,
            noticeeAddress,
            noticeePhone,
            noticeeRole,

            complaintNo: found.complaintNumber,
            complainantName: found.complainantName,
            incidentDate: found.incidentDate || sample.incidentDate,
            sectionsOfLaw: sample.sectionsOfLaw,
            allegationsBrief: found.complaintDescription || (found as any).description || sample.allegationsBrief,

            appearanceDate: sample.appearanceDate,
            appearanceTime: sample.appearanceTime,
            appearancePlace: sample.appearancePlace,
            documentsRequired: sample.documentsRequired,

            officerName: found.assignedEoName || currentUser.name || sample.officerName,
            officerRank: found.assignedEoRank || currentUser.rankDisplay || sample.officerRank,
            officerPno: found.assignedEoPno || currentUser.pno || sample.officerPno,
            officerPhone: (currentUser as any).phone || sample.officerPhone,

            mhcName: (found as any).mhcName || sample.mhcName || "HC Devinder Kumar",
            mhcRank: (found as any).mhcRank || sample.mhcRank || "Head Constable (MHC)",
            mhcBeltNumber: (found as any).mhcBeltNumber || sample.mhcBeltNumber || "889/KKR",
            mhcPhone: (found as any).mhcPhone || sample.mhcPhone || "9813098765",
          });
        }
      } catch (err) {
        console.error("Error loading complaint for templates:", err);
      }
    }
    loadComplaint();
  }, [complaintIdParam, templateParam]);

  const handleTemplateSwitch = (tmpl: TemplateType) => {
    setActiveTemplate(tmpl);
    const sample = DEFAULT_SAMPLE_DATA[tmpl];
    if (complaint) {
      const primaryAccused = complaint.accusedList?.[0] || {};
      let noticeeName = sample.noticeeName;
      let noticeeFather = sample.noticeeFather;
      let noticeeAddress = sample.noticeeAddress;
      let noticeePhone = sample.noticeePhone;
      let noticeeRole = sample.noticeeRole;

      if (tmpl === "complaint_receipt") {
        noticeeName = complaint.complainantName;
        noticeeFather = complaint.complainantFatherSpouse || (complaint as any).complainantFather || "";
        noticeeAddress = complaint.complainantAddress;
        noticeePhone = complaint.complainantMobile || complaint.complainantAltPhone || sample.noticeePhone;
        noticeeRole = "Complainant";
      } else if (tmpl === "accused_notice_bnss") {
        noticeeName = primaryAccused.name || (complaint as any).accusedName || sample.noticeeName;
        noticeeFather = primaryAccused.fatherName || (complaint as any).accusedFather || sample.noticeeFather;
        noticeeAddress = primaryAccused.address || (complaint as any).accusedAddress || sample.noticeeAddress;
        noticeePhone = primaryAccused.phone || (complaint as any).accusedPhone || sample.noticeePhone;
        noticeeRole = "Accused / Suspect";
      }

      setFormData((prev) => ({
        ...prev,
        noticeeName,
        noticeeFather,
        noticeeAddress,
        noticeePhone,
        noticeeRole,
        sectionsOfLaw: sample.sectionsOfLaw,
        appearancePlace: sample.appearancePlace,
        documentsRequired: sample.documentsRequired,
      }));
    } else {
      setFormData({
        ...sample,
        officerName: currentUser.name || sample.officerName,
        policeStation: currentUser.stationName || sample.policeStation,
        district: currentUser.district ? `${currentUser.district}, Haryana` : sample.district,
      });
    }
  };

  const handleFieldChange = (field: keyof NoticeFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleResetSample = () => {
    setFormData(DEFAULT_SAMPLE_DATA[activeTemplate]);
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

  const handleDownloadNotice = () => {
    const html = generateNoticeDocumentHtml(formData, activeTemplate);
    const filename = `${(formData.dispatchNo || "NOTICE").replace(/[\/\\?%*:|"<>]/g, "_")}.html`;
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSaveToComplaint = async () => {
    if (!complaint?.id) return;
    setSaveLoading(true);
    try {
      const label = TEMPLATE_CONFIG[activeTemplate]?.label || "Notice";
      const docTitle = `${label} - ${formData.noticeeName || formData.complaintNo}`;
      const docHtml = generateNoticeDocumentHtml(formData, activeTemplate);

      await ComplaintService.addDocument(complaint.id, {
        fileName: `${docTitle}.html`,
        fileCategory: "NOTICE",
        fileSize: `${Math.round(docHtml.length / 1024) || 3} KB`,
        dataUrl: `data:text/html;charset=utf-8,${encodeURIComponent(docHtml)}`,
        contentHtml: docHtml,
        description: `Generated ${label} issued under official dispatch ${formData.dispatchNo}`,
        uploadedBy: formData.officerName || currentUser.name || "Enquiry Officer",
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      console.error("Failed to save notice to complaint documents:", err);
      alert("Failed to save document. Please try again.");
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in-50 pb-16">
      {/* Top Header - No-print */}
      <div className="no-print space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                Official Police Notice Templates &amp; Receipts (Page 2 Direct Editing)
              </span>
              {complaint && (
                <span className="text-[11px] font-bold font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {complaint.complaintNumber}
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-[#0b192c] tracking-tight mt-1 flex items-center gap-2">
              <ScrollText className="w-6 h-6 text-purple-600" />
              <span>Notice Templates &amp; Generator</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Direct in-place document editor: Page 1 form has been removed. Edit notice details, dates, allegations, and directions directly on the Page 2 document.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {complaint ? (
              <Link href={`/complaints/${complaint.id}`}>
                <Button variant="outline" size="sm" className="text-xs gap-1.5 border-slate-300">
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Complaint Profile</span>
                </Button>
              </Link>
            ) : (
              <Link href="/enquiry-workspace">
                <Button variant="outline" size="sm" className="text-xs gap-1.5 border-slate-300">
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Enquiry Dashboard</span>
                </Button>
              </Link>
            )}

            {complaint && (
              <Button
                onClick={handleSaveToComplaint}
                disabled={saveLoading}
                variant="primary"
                size="sm"
                className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                {saveSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <span>Document Saved!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{saveLoading ? "Saving..." : "Save Document to Complaint"}</span>
                  </>
                )}
              </Button>
            )}

            <Button
              onClick={handleDownloadNotice}
              variant="outline"
              size="sm"
              className="text-xs font-semibold text-slate-700 hover:text-slate-950 flex items-center gap-1.5 border-slate-300 shadow-2xs"
            >
              <Download className="w-4 h-4 text-blue-700" />
              <span>Download Notice (.html)</span>
            </Button>

            <Button
              onClick={handleCopyNotice}
              variant="outline"
              size="sm"
              className="text-xs font-semibold text-slate-700 hover:text-slate-950 flex items-center gap-1.5 border-slate-300 shadow-2xs"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? "Copied!" : "Copy Text"}</span>
            </Button>

            <Button
              onClick={handlePrint}
              variant="primary"
              size="sm"
              className="bg-[#0b192c] hover:bg-slate-900 text-white flex items-center gap-1.5 shadow-xs font-bold"
            >
              <Printer className="w-4 h-4" />
              <span>Print A4</span>
            </Button>
          </div>
        </div>

        {/* Success Banner if Saved */}
        {saveSuccess && complaint && (
          <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between text-xs text-emerald-900 animate-in fade-in-50">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              <span className="font-bold">
                Notice document successfully saved into Complaint {complaint.complaintNumber} under the &ldquo;Documents&rdquo; sub-tab!
              </span>
            </div>
            <Link
              href={`/complaints/${complaint.id}`}
              className="text-xs font-bold text-emerald-800 underline hover:text-emerald-950"
            >
              Open Documents Sub-Tab &rarr;
            </Link>
          </div>
        )}

        {/* Template Selector Tabs */}
        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              Select Notice / Document Template:
            </span>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 font-medium">Dictation:</span>
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded border border-slate-200">
                <button
                  type="button"
                  onClick={() => setVoiceLang("hi-IN")}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    voiceLang === "hi-IN" ? "bg-[#0b192c] text-white" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Hindi
                </button>
                <button
                  type="button"
                  onClick={() => setVoiceLang("en-IN")}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    voiceLang === "en-IN" ? "bg-[#0b192c] text-white" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  English
                </button>
              </div>
              <button
                type="button"
                onClick={handleResetSample}
                className="px-2 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded text-xs font-semibold flex items-center gap-1"
                title="Reset this template"
              >
                <RotateCcw className="w-3 h-3 text-slate-500" />
                <span>Reset Sample</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
            {(Object.keys(TEMPLATE_CONFIG) as TemplateType[]).map((tmplKey) => {
              const cfg = TEMPLATE_CONFIG[tmplKey];
              const Icon = cfg.icon;
              const isActive = activeTemplate === tmplKey;
              return (
                <button
                  key={tmplKey}
                  type="button"
                  onClick={() => handleTemplateSwitch(tmplKey)}
                  className={`px-3 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 border text-left ${
                    isActive
                      ? "bg-[#0b192c] text-white border-[#0b192c] shadow-xs"
                      : "bg-slate-50/70 text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-950"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-amber-400" : cfg.color}`} />
                  <span className="truncate">{cfg.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ================= PAGE 2: FULL-WIDTH OFFICIAL NOTICE / RECEIPT (IN-PLACE EDITING) ================= */}
      <div className="w-full max-w-5xl mx-auto space-y-4">
        <div
          ref={documentRef}
          className="bg-white border-2 border-slate-300 rounded-2xl p-6 sm:p-12 shadow-md text-slate-900 font-sans transition-all space-y-6"
          style={{ minHeight: "1050px", lineHeight: "1.7" }}
        >
          {activeTemplate === "complaint_receipt" ? (
            /* OFFICIAL RECEIPT OF REGISTERED COMPLAINTS (शिकायत पावती रसीद) */
            <div className="space-y-6 font-sans">
              {/* Header Title */}
              <div className="text-center pb-4 border-b-2 border-slate-900">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Shield className="w-8 h-8 text-[#0b192c]" />
                  <span className="text-sm font-black tracking-widest uppercase text-[#0b192c]">
                    HARYANA POLICE
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wide text-slate-950 font-serif">
                  Receipt of registered complaints
                </h1>
                <div className="flex items-center justify-center gap-2 pt-1">
                  <input
                    type="text"
                    value={formData.policeStation}
                    onChange={(e) => handleFieldChange("policeStation", e.target.value)}
                    className="text-xs font-bold uppercase text-slate-700 tracking-wider text-center bg-slate-50 border border-slate-200 rounded px-2 py-0.5"
                  />
                  <span className="text-xs font-bold text-slate-700">, District</span>
                  <input
                    type="text"
                    value={formData.district}
                    onChange={(e) => handleFieldChange("district", e.target.value)}
                    className="text-xs font-bold uppercase text-slate-700 tracking-wider text-center bg-slate-50 border border-slate-200 rounded px-2 py-0.5"
                  />
                </div>
                <p className="text-[11px] text-slate-500 italic mt-0.5">
                  (Statutory Intake Slip under PPR Rule 22.48 &amp; Section 173(3) BNSS, 2023)
                </p>
              </div>

              {/* Acknowledgement No & Date Time */}
              <div className="p-3.5 bg-slate-50 border border-slate-300 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">Acknowledgement no:</span>
                  <input
                    type="text"
                    value={formData.dispatchNo || formData.complaintNo}
                    onChange={(e) => handleFieldChange("dispatchNo", e.target.value)}
                    className="font-mono font-black text-blue-900 bg-blue-100 px-2 py-0.5 rounded text-sm sm:text-base border border-blue-300"
                  />
                </div>
                <div className="flex items-center gap-2 text-xs sm:text-sm">
                  <span className="font-bold text-slate-900">date time:</span>
                  <input
                    type="text"
                    value={`${formData.issueDate} ${formData.appearanceTime || "11:00 AM"}`}
                    onChange={(e) => handleFieldChange("issueDate", e.target.value)}
                    className="font-semibold text-slate-800 bg-white border border-slate-200 rounded px-2 py-0.5"
                  />
                </div>
              </div>

              {/* Citizen Particulars */}
              <div className="p-4 sm:p-5 bg-white border border-slate-200 rounded-xl space-y-3 text-xs sm:text-sm">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <span className="font-bold text-slate-900 min-w-[170px] shrink-0">
                    Complainant Name –
                  </span>
                  <input
                    type="text"
                    value={formData.complainantName || formData.noticeeName}
                    onChange={(e) => handleFieldChange("complainantName", e.target.value)}
                    className="font-semibold text-slate-950 bg-slate-50 border border-slate-200 rounded px-2.5 py-1 flex-1"
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <span className="font-bold text-slate-900 min-w-[170px] shrink-0">
                    Address –
                  </span>
                  <input
                    type="text"
                    value={formData.noticeeAddress}
                    onChange={(e) => handleFieldChange("noticeeAddress", e.target.value)}
                    className="text-slate-800 bg-slate-50 border border-slate-200 rounded px-2.5 py-1 flex-1"
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <span className="font-bold text-slate-900 min-w-[170px] shrink-0">
                    Mobile no –
                  </span>
                  <input
                    type="text"
                    value={formData.noticeePhone}
                    onChange={(e) => handleFieldChange("noticeePhone", e.target.value)}
                    className="font-mono font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded px-2.5 py-1 w-52"
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-2 border-t border-slate-150">
                  <span className="font-bold text-slate-900 min-w-[170px] shrink-0 uppercase tracking-wide">
                    SUBJECT -
                  </span>
                  <input
                    type="text"
                    value={formData.sectionsOfLaw || formData.allegationsBrief}
                    onChange={(e) => handleFieldChange("sectionsOfLaw", e.target.value)}
                    className="font-bold text-slate-950 bg-slate-50 border border-slate-200 rounded px-2.5 py-1 flex-1"
                  />
                </div>
              </div>

              {/* Officer Particulars: Assigned IO & MHC */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Assigned IO Details */}
                <div className="p-4 bg-emerald-50/70 border border-emerald-300 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center gap-2 pb-1.5 border-b border-emerald-200">
                    <UserCheck className="w-4 h-4 text-emerald-800" />
                    <h4 className="font-black text-emerald-950 uppercase tracking-wider text-[11px]">
                      Assigned io details
                    </h4>
                  </div>
                  <div className="space-y-1 text-slate-800">
                    <p className="flex items-center gap-2">
                      <span className="font-bold text-slate-700 min-w-[90px]">Rank:</span>
                      <input
                        type="text"
                        value={formData.officerRank}
                        onChange={(e) => handleFieldChange("officerRank", e.target.value)}
                        className="font-semibold text-slate-950 bg-white border border-slate-200 rounded px-1.5 py-0.5 flex-1"
                      />
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="font-bold text-slate-700 min-w-[90px]">Name:</span>
                      <input
                        type="text"
                        value={formData.officerName}
                        onChange={(e) => handleFieldChange("officerName", e.target.value)}
                        className="font-semibold text-slate-950 bg-white border border-slate-200 rounded px-1.5 py-0.5 flex-1"
                      />
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="font-bold text-slate-700 min-w-[90px]">Belt number:</span>
                      <input
                        type="text"
                        value={formData.officerPno}
                        onChange={(e) => handleFieldChange("officerPno", e.target.value)}
                        className="font-mono font-bold text-slate-900 bg-white border border-slate-200 rounded px-1.5 py-0.5 flex-1"
                      />
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="font-bold text-slate-700 min-w-[90px]">Mobile number:</span>
                      <input
                        type="text"
                        value={formData.officerPhone}
                        onChange={(e) => handleFieldChange("officerPhone", e.target.value)}
                        className="font-mono font-bold text-slate-900 bg-white border border-slate-200 rounded px-1.5 py-0.5 flex-1"
                      />
                    </p>
                  </div>
                </div>

                {/* MHC Details */}
                <div className="p-4 bg-blue-50/70 border border-blue-300 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center justify-between pb-1.5 border-b border-blue-200">
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-blue-800" />
                      <h4 className="font-black text-blue-950 uppercase tracking-wider text-[11px]">
                        Mhc details
                      </h4>
                    </div>
                  </div>
                  <div className="space-y-1 text-slate-800">
                    <p className="flex items-center gap-2">
                      <span className="font-bold text-slate-700 min-w-[90px]">Rank:</span>
                      <input
                        type="text"
                        value={formData.mhcRank || "Head Constable (MHC)"}
                        onChange={(e) => handleFieldChange("mhcRank", e.target.value)}
                        className="font-semibold text-slate-950 bg-white border border-slate-200 rounded px-1.5 py-0.5 flex-1"
                      />
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="font-bold text-slate-700 min-w-[90px]">Name:</span>
                      <input
                        type="text"
                        value={formData.mhcName || "HC Devinder Kumar"}
                        onChange={(e) => handleFieldChange("mhcName", e.target.value)}
                        className="font-semibold text-slate-950 bg-white border border-slate-200 rounded px-1.5 py-0.5 flex-1"
                      />
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="font-bold text-slate-700 min-w-[90px]">Belt number:</span>
                      <input
                        type="text"
                        value={formData.mhcBeltNumber || "889/KKR"}
                        onChange={(e) => handleFieldChange("mhcBeltNumber", e.target.value)}
                        className="font-mono font-bold text-slate-900 bg-white border border-slate-200 rounded px-1.5 py-0.5 flex-1"
                      />
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="font-bold text-slate-700 min-w-[90px]">Mobile number:</span>
                      <input
                        type="text"
                        value={formData.mhcPhone || "9813098765"}
                        onChange={(e) => handleFieldChange("mhcPhone", e.target.value)}
                        className="font-mono font-bold text-slate-900 bg-white border border-slate-200 rounded px-1.5 py-0.5 flex-1"
                      />
                    </p>
                  </div>
                </div>
              </div>

              {/* Statutory Note */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600 leading-relaxed font-sans">
                <p className="font-bold text-slate-800">Legal Note / वैधानिक सूचना:</p>
                <p>
                  यह रसीद थाना दैनिकी (Roznamcha GD) और केंद्रीय शिकायत पंजिका में विधिवत प्रविष्टि के उपरांत जारी की गई है।
                  धारा 173(3) BNSS के अंतर्गत 14 दिनों के भीतर प्रारंभिक जांच पूर्ण कर निष्पक्ष अग्रिम कार्यवाही अमल में लाई जाएगी।
                </p>
              </div>

              {/* Stamp & Signature Footer */}
              <div className="pt-6 border-t-2 border-slate-900 flex items-end justify-between text-xs font-sans">
                <div className="text-center w-36">
                  <div className="h-14 border border-dashed border-slate-400 rounded flex items-center justify-center text-[10px] text-slate-400">
                    Station Seal
                  </div>
                  <p className="mt-1 font-bold text-slate-700">POLICE STATION SEAL</p>
                </div>

                <div className="text-right space-y-1">
                  <p className="text-slate-400">______________________________________</p>
                  <p className="font-bold text-slate-900">
                    {formData.mhcName || "HC Devinder Kumar"} ({formData.mhcRank || "Head Constable (MHC)"})
                  </p>
                  <p className="text-slate-600 text-[11px]">
                    Moharrir Head Constable / Duty Officer
                  </p>
                  <p className="text-slate-600 font-mono text-[11px]">
                    Belt No: {formData.mhcBeltNumber || "889/KKR"} • {formData.policeStation}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* STANDARD BNSS NOTICE FORMAT */
            <div className="space-y-6">
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
              <div className="my-4 text-center">
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
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Dispatch / Ref No.:</span>
                  <input
                    type="text"
                    value={formData.dispatchNo}
                    onChange={(e) => handleFieldChange("dispatchNo", e.target.value)}
                    className="font-mono font-bold text-slate-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-xs"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Date of Notice:</span>
                  <input
                    type="text"
                    value={formData.issueDate}
                    onChange={(e) => handleFieldChange("issueDate", e.target.value)}
                    className="font-bold text-slate-900 bg-white border border-slate-200 px-2 py-0.5 rounded text-xs w-28 text-center"
                  />
                </div>
              </div>

              {/* Addressee Block (Directly Editable) */}
              <div className="mb-4 text-xs sm:text-sm space-y-2 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-slate-900">To (Noticee Particulars):</p>
                  <VoiceInputButton
                    preferredLang={voiceLang}
                    fieldLabel="Noticee Name"
                    currentValue={formData.noticeeName}
                    onTranscript={(val) => handleFieldChange("noticeeName", val)}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 uppercase">Noticee Full Name</label>
                    <input
                      type="text"
                      value={formData.noticeeName}
                      onChange={(e) => handleFieldChange("noticeeName", e.target.value)}
                      className="w-full font-bold text-slate-900 bg-white border border-slate-300 rounded px-2 py-1"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 uppercase">S/o, D/o, W/o (Parentage)</label>
                    <input
                      type="text"
                      value={formData.noticeeFather}
                      onChange={(e) => handleFieldChange("noticeeFather", e.target.value)}
                      className="w-full text-slate-800 bg-white border border-slate-300 rounded px-2 py-1"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 uppercase">Mobile Phone</label>
                    <input
                      type="text"
                      value={formData.noticeePhone}
                      onChange={(e) => handleFieldChange("noticeePhone", e.target.value)}
                      className="w-full font-mono text-slate-800 bg-white border border-slate-300 rounded px-2 py-1"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 uppercase">Residential Address</label>
                    <input
                      type="text"
                      value={formData.noticeeAddress}
                      onChange={(e) => handleFieldChange("noticeeAddress", e.target.value)}
                      className="w-full text-slate-800 bg-white border border-slate-300 rounded px-2 py-1"
                    />
                  </div>
                </div>
              </div>

              {/* Preamble / Allegations (Editable) */}
              <div className="text-xs sm:text-sm text-justify space-y-3">
                <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-200 space-y-2 text-xs">
                  <p>
                    <strong>WHEREAS</strong>, an inquiry into Complaint / Case File bearing Ref No.{" "}
                    <input
                      type="text"
                      value={formData.complaintNo}
                      onChange={(e) => handleFieldChange("complaintNo", e.target.value)}
                      className="font-mono font-bold bg-white border border-slate-300 rounded px-1.5 py-0.5 inline-block w-48 text-center"
                    />{" "}
                    is being conducted regarding an incident on{" "}
                    <input
                      type="text"
                      value={formData.incidentDate}
                      onChange={(e) => handleFieldChange("incidentDate", e.target.value)}
                      className="font-bold bg-white border border-slate-300 rounded px-1.5 py-0.5 inline-block w-32 text-center"
                    />{" "}
                    lodged by{" "}
                    <input
                      type="text"
                      value={formData.complainantName}
                      onChange={(e) => handleFieldChange("complainantName", e.target.value)}
                      className="font-bold bg-white border border-slate-300 rounded px-1.5 py-0.5 inline-block w-48 text-center"
                    />{" "}
                    under{" "}
                    <input
                      type="text"
                      value={formData.sectionsOfLaw}
                      onChange={(e) => handleFieldChange("sectionsOfLaw", e.target.value)}
                      className="font-bold bg-white border border-slate-300 rounded px-1.5 py-0.5 inline-block w-64"
                    />.
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-900 text-xs">Substance of Allegations / Need for Appearance:</label>
                    <VoiceInputButton
                      preferredLang={voiceLang}
                      fieldLabel="Allegations Substance"
                      currentValue={formData.allegationsBrief}
                      onTranscript={(val) => handleFieldChange("allegationsBrief", val)}
                    />
                  </div>
                  <textarea
                    rows={3}
                    value={formData.allegationsBrief}
                    onChange={(e) => handleFieldChange("allegationsBrief", e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border-l-4 border-[#0b192c] rounded-r text-xs leading-relaxed italic text-slate-800 border border-slate-300 focus:bg-white"
                  />
                </div>

                {/* Appearance Details */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                  <p className="font-bold text-slate-900">
                    DIRECTED TO APPEAR IN PERSON AS FOLLOWS:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 uppercase">Appearance Date</label>
                      <input
                        type="date"
                        value={formData.appearanceDate}
                        onChange={(e) => handleFieldChange("appearanceDate", e.target.value)}
                        className="w-full font-bold text-slate-900 bg-white border border-slate-300 rounded px-2 py-1"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 uppercase">Appearance Time</label>
                      <input
                        type="text"
                        value={formData.appearanceTime}
                        onChange={(e) => handleFieldChange("appearanceTime", e.target.value)}
                        className="w-full font-bold text-slate-900 bg-white border border-slate-300 rounded px-2 py-1 text-center"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 uppercase">Appearance Venue / Room</label>
                      <input
                        type="text"
                        value={formData.appearancePlace}
                        onChange={(e) => handleFieldChange("appearancePlace", e.target.value)}
                        className="w-full font-bold text-slate-900 bg-white border border-slate-300 rounded px-2 py-1"
                      />
                    </div>
                  </div>
                </div>

                {/* Documents / Items Required */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-900 text-xs">
                      Documents / Records to Produce at Appearance:
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
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs leading-relaxed text-slate-800 focus:bg-white"
                  />
                </div>
              </div>

              {/* Signatures & Seal Block */}
              <div className="mt-8 pt-4 flex items-end justify-between text-xs font-sans border-t border-slate-300">
                <div className="text-center w-36">
                  <div className="h-16 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center text-[10px] text-slate-400">
                    Official Station Seal
                  </div>
                  <p className="mt-1 font-bold text-slate-700">POLICE STATION SEAL</p>
                </div>

                <div className="text-right space-y-1 w-64">
                  <input
                    type="text"
                    value={formData.officerName}
                    onChange={(e) => handleFieldChange("officerName", e.target.value)}
                    className="w-full text-right font-bold text-slate-900 text-sm bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500"
                  />
                  <input
                    type="text"
                    value={formData.officerRank}
                    onChange={(e) => handleFieldChange("officerRank", e.target.value)}
                    className="w-full text-right text-slate-700 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500"
                  />
                  <input
                    type="text"
                    value={formData.officerPno}
                    onChange={(e) => handleFieldChange("officerPno", e.target.value)}
                    className="w-full text-right font-mono text-slate-600 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500"
                  />
                  <p className="text-[11px] font-bold text-[#0b192c]">Enquiry / Investigating Officer</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Sticky Save Bar if Linked to Complaint */}
        {complaint && (
          <div className="no-print p-4 bg-white border border-slate-200 rounded-xl shadow-md flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ScrollText className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-xs font-bold text-slate-900">
                  Save this notice to Complaint {complaint.complaintNumber}?
                </p>
                <p className="text-[11px] text-slate-500">
                  Persists the formatted notice directly into the &ldquo;Documents&rdquo; docket of the complaint file.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link href={`/complaints/${complaint.id}`}>
                <Button variant="outline" size="sm" className="text-xs">
                  Cancel &amp; Return
                </Button>
              </Link>
              <Button
                onClick={handleSaveToComplaint}
                disabled={saveLoading}
                variant="primary"
                size="sm"
                className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5"
              >
                {saveSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <span>Saved to Docket!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{saveLoading ? "Saving..." : "Save Document to Complaint"}</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function NoticeTemplatesPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs text-slate-500">
          Loading Notice Templates &amp; Generator...
        </div>
      }
    >
      <NoticeTemplatesContent />
    </Suspense>
  );
}
