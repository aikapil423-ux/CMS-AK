"use client";

import React, { useState, useEffect, useRef, useCallback, Suspense } from "react";
import Link from "next/link";
import { EnquiryWorkspaceNav } from "@/components/enquiry-workspace/EnquiryWorkspaceNav";
import { ComplaintAnalysisHeader } from "@/components/enquiry-workspace/ComplaintAnalysisHeader";
import { ComplaintAnalysisReport } from "@/services/complaintDocumentAnalysisService";
import { BuilderService, BuilderDraftItem, BuilderTemplateItem } from "@/services/builderService";

import {
  Printer,
  Copy,
  Check,
  RotateCcw,
  Shield,
  Download,
  ArrowLeft,
  Save,
  CheckCircle2,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Sliders,
  Table,
  FileText,
  BadgeAlert,
  UserCheck,
  UploadCloud,
  Loader2,
  Eye,
  X,
  Search,
  Sparkles,
  Send,
  Scale,
  AlertTriangle,
  AlertCircle,
  FileCheck2,
  Landmark,
  Banknote,
  Handshake,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { VoiceInputButton } from "@/components/ui/voice-input-button";
import { ComplaintService } from "@/services/complaintService";
import { ComplaintItem, EOOutcome } from "@/types";
import {
  generateHaryanaPoliceProformaHtml,
  HaryanaPoliceProformaData,
} from "@/utils/documentHtmlGenerators";
import {
  analyzeComplaintForEnquiry,
  ComplaintAnalysisResult,
  EnquiryClassificationType,
} from "@/utils/complaintAnalysisEngine";
import { parseUploadedDocument } from "@/utils/universalDocumentParser";

export type EnquiryProformaType =
  | "standard_4row" // PDF 1, 2, 5: Complainant / Substance / Opposite Party / Findings
  | "three_column" // PDF 3: Allegations / Enquiry Findings / Police Action
  | "citizen_detail" // PDF 4: DEPARTMENT / CITIZEN DETAIL / CITIZEN SATISFACTION
  | "ncr_174"; // NCR u/s 174 BNSS

export interface ProformaRowState {
  id: string;
  label: string;
  cells: string[];
}

interface FormatTemplate {
  name: string;
  badge: string;
  icon: any;
  headerLeft: string;
  headerRight: string;
  subHeaderLeft: string;
  title: string;
  subTitle: string;
  columns: string[]; // empty if 2-column key-value
  rows: ProformaRowState[];
  closingLine: string;
  officerName: string;
  officerRank: string;
  officerLocation: string;
}

const TEMPLATE_PRESETS: Record<EnquiryProformaType, FormatTemplate> = {
  // 1. PDF 1, 2, 5: Standard 4-Row Official Haryana Police Proforma
  standard_4row: {
    name: "1. Standard 4-Row Enquiry Report",
    badge: "Official Police Proforma (PDF 1, 2, 5)",
    icon: Shield,
    headerLeft: "POLICE DEPARTMENT",
    headerRight: "DISTRICT PANIPAT",
    subHeaderLeft: "",
    title: "ENQUIRY REPORT ON COMPLAINT NO. 128-SPL-III DATED 10.02.2026",
    subTitle: "",
    columns: [],
    rows: [
      {
        id: "row_complainant",
        label: "Complainant / Informant",
        cells: [
          "Babli Devi w/o Gurdyal Singh, r/o Jaurasi Road, Samalkha, Panipat (Mob: 9812033441)",
        ],
      },
      {
        id: "row_gist",
        label: "Gist / Substance of Complaint",
        cells: ["Regarding physical assault and extending death threats."],
      },
      {
        id: "row_accused",
        label: "Opposite Party / Accused Details",
        cells: [
          "Chanderpal, r/o Jaurasi Road, Samalkha, District Panipat (Mob: 9812044551)",
        ],
      },
      {
        id: "row_findings",
        label: "Enquiry Findings & Action Taken",
        cells: [
          "FINAL REPORT & PROCEEDINGS CONDUCTED: Respected Sir, the preliminary enquiry into Complaint No. 128-SPL-III Dated 10.02.2026 lodged by Babli Devi was conducted by me. During the enquiry, the complaint contents and previous records were thoroughly examined.\n\nBoth the complainant and the opposite party were joined in the enquiry and interrogated. The complainant failed to produce any corroborating witness or documentary evidence to substantiate her allegations. Spot inspection was conducted and statements of independent local neighbors were recorded.\n\nInterrogation and witness statements revealed that the allegations leveled by Babli Devi are unsubstantiated and false, and she repeatedly submits groundless applications over mutual trivial disputes. Preventive proceedings under Sections 126(2)/170 BNSS, 2023 have been initiated against the opposite party vide Daily Diary GD No. 27. No further cognizable police action is warranted. Recommended for file closure / consigned to record room.",
        ],
      },
    ],
    closingLine: "Report is submitted for perusal and orders.",
    officerName: "(Satish Kumar, HPS)",
    officerRank: "Deputy Superintendent of Police",
    officerLocation: "Headquarters Panipat",
  },

  // 2. PDF 3: 3-Column Comparative Proforma
  three_column: {
    name: "2. Point-wise Comparative Report (3-Column)",
    badge: "Comparative Proforma (PDF 3)",
    icon: Table,
    headerLeft: "POLICE DEPARTMENT",
    headerRight: "DISTRICT PANIPAT",
    subHeaderLeft: "Respected Sir,",
    title:
      "ENQUIRY REPORT ON COMPLAINT NO. 1736 DATED 19.12.2025",
    subTitle: "Point-wise enquiry findings on allegations are submitted as follows -",
    columns: [
      "Allegations Leveled by Complainant (Point-wise)",
      "Enquiry Findings (Substantiated / Unsubstantiated with Reasons)",
      "Action Taken by Local Police / S.H.O.",
    ],
    rows: [
      {
        id: "row_col_1",
        label: "Point 1",
        cells: [
          "Unauthorized issuance of allotment letters and fraudulent entries in dispatch register for Plot No. 118, Sector 25 Part-I, Plot No. 11, Sector 29 Part-II, and Plot No. 51, Sector 29 Part-II Panipat without authorization from Estate Officer HSVP.",
          "Field verification and departmental scrutiny revealed that plot holders in connivance with departmental staff fabricated allotment letters without lawful authorization and forged signatures.",
          "Preliminary verification conducted. Original records and dispatch registers requisitioned. Prima facie commission of offences under Sections 318(4), 338, 336(3), 340(2), 61(2) BNS, 2023 is revealed. Regular FIR recommended.",
        ],
      },
      {
        id: "row_col_2",
        label: "Point 2",
        cells: [
          "Forging dispatch register numbers and manipulating official office correspondence.",
          "Statements of dispatch clerk recorded. Original register seized and referred for forensic document examination (FSL).",
          "Directions issued to concerned Police Station for registering case and initiating custodial investigation.",
        ],
      },
    ],
    closingLine: "Report is submitted for perusal and further orders.",
    officerName: "Harshit Goyal, IPS",
    officerRank: "Assistant Superintendent of Police",
    officerLocation: "Panipat",
  },

  // 3. PDF 4: Citizen Grievance / CM Window Proforma
  citizen_detail: {
    name: "3. Citizen Grievance / CM Window Report",
    badge: "Citizen Satisfaction Docket (PDF 4)",
    icon: UserCheck,
    headerLeft: "DEPARTMENT- POLICE",
    headerRight: "DISTRICT PANIPAT",
    subHeaderLeft: "",
    title: "CITIZEN GRIEVANCE ENQUIRY & SATISFACTION REPORT",
    subTitle: "",
    columns: [],
    rows: [
      {
        id: "row_citizen_detail",
        label: "CITIZEN DETAIL-",
        cells: [
          "NAME- Deepak s/o Omprakash\nMOBILE NO.- 9992998522\nADDRESS- Village Jasor, District Panipat",
        ],
      },
      {
        id: "row_allegation",
        label: "ALLEGATIONS LEVELED IN COMPLAINT-",
        cells: [
          "Regarding financial dispute in contract construction work, altercation and threats.",
        ],
      },
      {
        id: "row_report_date",
        label: "DATE OF REPORT-",
        cells: [new Date().toLocaleDateString("en-GB").replace(/\//g, ".")],
      },
      {
        id: "row_satisfaction",
        label: "CITIZEN SATISFACTION- YES/NO -",
        cells: [
          "SATISFIED (YES) - Both parties were brought face-to-face. Dispute was mutually resolved and written settlement deed was furnished.",
        ],
      },
      {
        id: "row_final_report",
        label: "FINAL REPORT ON THE ENQUIRY CONDUCTED BY THE INVESTIGATING OFFICER -",
        cells: [
          "Inquiry was conducted into Complaint No. 71-DCR. Complainant and opposite party appeared. The issue pertained to pending payment for masonry and drain work under a sub-contract. No caste-based slurs or cognizable hurt was caused. Financial accounts were settled amicably before respectables. Complainant gave statement expressing full satisfaction. Matter is disposed of.",
        ],
      },
    ],
    closingLine: "Report is submitted for perusal and orders.",
    officerName: "Assistant Superintendent of Police,",
    officerRank: "Samalkha, Panipat",
    officerLocation: "",
  },

  // 4. NCR u/s 174 BNSS
  ncr_174: {
    name: "4. Non-Cognizable Offence Report (NCR u/s 174 BNSS)",
    badge: "Station GD Roznamcha Proforma",
    icon: BadgeAlert,
    headerLeft: "POLICE DEPARTMENT (STATION GENERAL DIARY)",
    headerRight: "DISTRICT PANIPAT",
    subHeaderLeft: "Respected Sir,",
    title: "FIRST INFORMATION OF A NON-COGNIZABLE OFFENCE (NCR) U/S 174 BNSS, 2023",
    subTitle: "Police Station General Diary Roznamcha Entry No. 018",
    columns: [],
    rows: [
      {
        id: "row_ncr_complainant",
        label: "Complainant / Informant Details",
        cells: [
          "Sanjeev Kumar, r/o 116/5 Hans Enclave, Gurugram (Mob: 9991155540)",
        ],
      },
      {
        id: "row_ncr_gist",
        label: "Gist of Non-Cognizable Occurrence",
        cells: [
          "Regarding verbal dispute, mental harassment and exchange of heated words.",
        ],
      },
      {
        id: "row_ncr_accused",
        label: "Opposite Party / Suspect Details",
        cells: [
          "Vinod s/o Omprakash, Sunita w/o Vinod, Ramniwas s/o Rajbir, Anil s/o Laxmi Dutt, r/o Village Dahola, Panipat",
        ],
      },
      {
        id: "row_ncr_findings",
        label: "General Diary Entry & Enquiry Report Details",
        cells: [
          "Enquiry conducted into complaint 789-SPR. Complainant was contacted on his registered mobile number. He informed that the dispute has been transferred for jurisdictional enquiry. Statements and phone recordings placed on record. Entered in Station General Diary Roznamcha under Section 174 BNSS, 2023. Submitted for transmission to supervisory authority.",
        ],
      },
    ],
    closingLine: "Report is submitted for perusal and orders.",
    officerName: "Assistant Superintendent of Police,",
    officerRank: "Samalkha, Panipat",
    officerLocation: "",
  },
};

function EnquiryDraftsContent() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const complaintIdParam = searchParams.get("complaintId");
  const categoryParam = searchParams.get("category");

  const initialFormat: EnquiryProformaType =
    categoryParam && TEMPLATE_PRESETS[categoryParam as EnquiryProformaType]
      ? (categoryParam as EnquiryProformaType)
      : categoryParam?.includes("ncr") || categoryParam?.includes("assault")
      ? "ncr_174"
      : categoryParam?.includes("citizen") || categoryParam?.includes("cyber")
      ? "citizen_detail"
      : categoryParam?.includes("col") || categoryParam?.includes("three")
      ? "three_column"
      : "standard_4row";

  const [activeFormat, setActiveFormat] = useState<string>(initialFormat);
  const [complaint, setComplaint] = useState<ComplaintItem | null>(null);
  const [analysisResult, setAnalysisResult] = useState<ComplaintAnalysisResult | null>(null);
  const [selectedClassification, setSelectedClassification] = useState<EnquiryClassificationType | "">("");
  const [isSavedAndFirRecommended, setIsSavedAndFirRecommended] = useState(false);
  const [sendingToSho, setSendingToSho] = useState(false);

  const CUSTOM_DRAFTS_STORAGE_KEY = "cms_enquiry_custom_drafts";
  const [customDrafts, setCustomDrafts] = useState<Record<string, FormatTemplate>>({});
  const [proformaDropdownOpen, setProformaDropdownOpen] = useState(false);
  const proformaDropdownRef = useRef<HTMLDivElement>(null);
  const [availableComplaints, setAvailableComplaints] = useState<ComplaintItem[]>([]);
  const [selectComplaintModalOpen, setSelectComplaintModalOpen] = useState(false);
  const [complaintSearchQuery, setComplaintSearchQuery] = useState("");
  const [previewModalOpen, setPreviewModalOpen] = useState(false);

  // Load custom drafts from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(CUSTOM_DRAFTS_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && typeof parsed === "object") {
            setCustomDrafts(parsed);
          }
        }
      } catch (err) {
        console.warn("Could not load custom drafts from localStorage", err);
      }
    }
  }, []);

  // Built Drafts & Templates from SQLite / Prisma Builder
  const [builtDrafts, setBuiltDrafts] = useState<BuilderDraftItem[]>([]);
  const [builtTemplates, setBuiltTemplates] = useState<BuilderTemplateItem[]>([]);

  const fetchBuiltItems = useCallback(async () => {
    try {
      const [dList, tList] = await Promise.all([
        BuilderService.getDrafts(),
        BuilderService.getTemplates(),
      ]);
      setBuiltDrafts(dList);
      setBuiltTemplates(tList);
    } catch (e) {
      console.error("Failed to load built drafts/templates:", e);
    }
  }, []);

  useEffect(() => {
    fetchBuiltItems();
  }, [fetchBuiltItems]);

  const handleDeleteBuiltDraft = async (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!confirm(`Are you sure you want to delete built draft "${name}" from database?`)) return;
    try {
      await BuilderService.deleteDraft(id);
      await fetchBuiltItems();
    } catch (err) {
      console.error("Failed to delete built draft:", err);
      alert("Could not delete draft.");
    }
  };

  const handleDeleteBuiltTemplate = async (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!confirm(`Are you sure you want to delete built template "${name}" from database?`)) return;
    try {
      await BuilderService.deleteTemplate(id);
      await fetchBuiltItems();
    } catch (err) {
      console.error("Failed to delete built template:", err);
      alert("Could not delete template.");
    }
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (proformaDropdownRef.current && !proformaDropdownRef.current.contains(e.target as Node)) {
        setProformaDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Editable Proforma Document State
  const [headerLeft, setHeaderLeft] = useState(TEMPLATE_PRESETS[initialFormat].headerLeft);
  const [headerRight, setHeaderRight] = useState(TEMPLATE_PRESETS[initialFormat].headerRight);
  const [subHeaderLeft, setSubHeaderLeft] = useState(TEMPLATE_PRESETS[initialFormat].subHeaderLeft);
  const [title, setTitle] = useState(TEMPLATE_PRESETS[initialFormat].title);
  const [subTitle, setSubTitle] = useState(TEMPLATE_PRESETS[initialFormat].subTitle);
  const [columns, setColumns] = useState<string[]>(TEMPLATE_PRESETS[initialFormat].columns);
  const [rows, setRows] = useState<ProformaRowState[]>(TEMPLATE_PRESETS[initialFormat].rows);
  const [closingLine, setClosingLine] = useState(TEMPLATE_PRESETS[initialFormat].closingLine);
  const [officerName, setOfficerName] = useState(TEMPLATE_PRESETS[initialFormat].officerName);
  const [officerRank, setOfficerRank] = useState(TEMPLATE_PRESETS[initialFormat].officerRank);
  const [officerLocation, setOfficerLocation] = useState(TEMPLATE_PRESETS[initialFormat].officerLocation);
  const [reportDate, setReportDate] = useState(`Dated: ${new Date().toLocaleDateString("en-GB").replace(/\//g, ".")}`);

  // Appearance & Border Controls
  const [borderStyle, setBorderStyle] = useState<"solid" | "double" | "light" | "none">("solid");
  const [showHeader, setShowHeader] = useState(true);
  const [showSubHeader, setShowSubHeader] = useState(true);
  const [showClosingLine, setShowClosingLine] = useState(true);
  const [showSignatures, setShowSignatures] = useState(true);

  const [voiceLang, setVoiceLang] = useState<"hi-IN" | "en-IN">("en-IN");
  const [copied, setCopied] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadSuccessMessage, setUploadSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const documentRef = useRef<HTMLDivElement>(null);

  // Helper function to intelligently apply complaint and its legal analysis findings
  const applyComplaintWithAnalysis = (
    found: ComplaintItem,
    fmtKey: string = activeFormat,
    customClass?: EnquiryClassificationType
  ) => {
    setComplaint(found);
    const analysis = analyzeComplaintForEnquiry(found);
    if (customClass) {
      analysis.classification = customClass;
      analysis.isFirRecommended = customClass === "FIR_RECOMMENDED";
    }
    setAnalysisResult(analysis);
    setSelectedClassification(customClass || analysis.classification);

    const districtName = (found.district || currentUser.district || "PANIPAT").toUpperCase();
    setHeaderRight(`DISTRICT ${districtName}`);
    setTitle(`ENQUIRY REPORT ON COMPLAINT NO. ${found.complaintNumber} DATED ${new Date().toLocaleDateString("en-GB").replace(/\//g, ".")}`);

    const primaryAccused = found.accusedList?.[0] || {};
    const complainantInfo = `${found.complainantName}${found.complainantFatherSpouse ? ` s/o / w/o ${found.complainantFatherSpouse}` : ""}${found.complainantAddress ? `, r/o ${found.complainantAddress}` : ""}${found.complainantMobile ? ` (Mob: ${found.complainantMobile})` : ""}`;
    const accusedInfo = `${primaryAccused.name || "Unknown"}${primaryAccused.fatherName ? ` s/o ${primaryAccused.fatherName}` : ""}${primaryAccused.address ? `, r/o ${primaryAccused.address}` : ""}${primaryAccused.phone ? ` (Mob: ${primaryAccused.phone})` : ""}`;

    if (fmtKey === "standard_4row") {
      setColumns([]);
      setRows([
        { id: "row_complainant", label: "Complainant / Informant", cells: [complainantInfo] },
        { id: "row_gist", label: "Gist / Substance of Complaint", cells: [found.subject || found.complaintDescription || "Regarding dispute between parties."] },
        { id: "row_accused", label: "Opposite Party / Accused Details", cells: [accusedInfo] },
        { id: "row_findings", label: "Enquiry Findings & Action Taken", cells: [analysis.proformaFindingsText.standard_4row] },
      ]);
    } else if (fmtKey === "three_column") {
      setColumns([
        "Allegations Leveled by Complainant (Point-wise)",
        "Enquiry Findings (Substantiated / Unsubstantiated with Reasons)",
        "Action Taken by Local Police / S.H.O.",
      ]);
      setRows(analysis.proformaFindingsText.three_column.map((tc, idx) => ({
        id: `row_col_${idx + 1}`,
        label: `Point ${idx + 1}`,
        cells: [tc.allegation, tc.findings, tc.actionTaken],
      })));
    } else if (fmtKey === "citizen_detail") {
      setColumns([]);
      setRows([
        { id: "row_citizen_detail", label: "CITIZEN DETAIL-", cells: [`NAME- ${found.complainantName}\nMOBILE NO.- ${found.complainantMobile || "N/A"}\nADDRESS- ${found.complainantAddress || "Panipat"}`] },
        { id: "row_allegation", label: "ALLEGATIONS LEVELED IN COMPLAINT-", cells: [found.subject || found.complaintDescription || ""] },
        { id: "row_report_date", label: "DATE OF REPORT-", cells: [new Date().toLocaleDateString("en-GB").replace(/\//g, ".")] },
        { id: "row_satisfaction", label: "CITIZEN SATISFACTION- YES/NO -", cells: [analysis.proformaFindingsText.citizen_detail.satisfaction] },
        { id: "row_final_report", label: "FINAL REPORT ON THE ENQUIRY CONDUCTED BY THE INVESTIGATING OFFICER -", cells: [analysis.proformaFindingsText.citizen_detail.finalReport] },
      ]);
    } else if (fmtKey === "ncr_174") {
      setColumns([]);
      setRows([
        { id: "row_ncr_date", label: "Date & GD Entry Reference", cells: [`Roznamcha GD Reference Dated ${new Date().toLocaleDateString("en-GB").replace(/\//g, ".")}`] },
        { id: "row_ncr_parties", label: "Complainant & Opposite Party Details", cells: [`Complainant: ${complainantInfo}\nOpposite Party: ${accusedInfo}`] },
        { id: "row_ncr_findings", label: "General Diary Entry & Enquiry Report Details", cells: [analysis.proformaFindingsText.ncr_174] },
      ]);
    }

    if (found.assignedEoName || currentUser.name) {
      setOfficerName(`(${found.assignedEoName || currentUser.name})`);
      setOfficerRank(found.assignedEoRank || currentUser.rankDisplay || "Assistant Superintendent of Police");
      setOfficerLocation(found.policeStation || `Headquarters ${districtName}`);
    }
  };

  // Switch classification override
  const handleChangeClassification = (newClass: EnquiryClassificationType) => {
    if (!complaint) return;
    applyComplaintWithAnalysis(complaint, activeFormat, newClass);
  };

  // Forward Report to SHO ID for Review / Approval
  const handleSendToSho = async () => {
    if (!complaint) return;
    setSendingToSho(true);
    try {
      const outcome = (selectedClassification || analysisResult?.classification) === "FIR_RECOMMENDED" || isSavedAndFirRecommended
        ? "FIR Recommend"
        : "Complete";
      await ComplaintService.sendReportToSho(
        complaint.id,
        officerName || currentUser.name || "Enquiry Officer",
        currentUser.pno || "PNO-23841",
        `Enquiry report "${title}" submitted. Outcome: ${outcome}. Forwarded for SHO approval.`
      );
      alert(`शिकायत ${complaint.complaintNumber} सफलतापूर्वक SHO ID को भेज दी गई है। यह शिकायत अब आपकी EO पेंडिंग लिस्ट से हट गई है।`);
      router.push("/complaints");
    } catch (err) {
      console.error("Failed to forward report to SHO:", err);
      alert("Error sending report to SHO. Please try again.");
    } finally {
      setSendingToSho(false);
    }
  };

  // Handle Complaint selection from ComplaintAnalysisHeader
  const handleComplaintSelected = (comp: ComplaintItem | null, report: ComplaintAnalysisReport | null) => {
    if (!comp) {
      setComplaint(null);
      setAnalysisResult(null);
      return;
    }
    applyComplaintWithAnalysis(comp, activeFormat);
  };

  // Load complaint if complaintIdParam exists, and initialize all complaints
  useEffect(() => {
    async function initComplaints() {
      try {
        const all = await ComplaintService.getComplaints();
        setAvailableComplaints(all || []);

        if (complaintIdParam) {
          const found = await ComplaintService.getComplaintById(complaintIdParam);
          if (found) {
            applyComplaintWithAnalysis(found, initialFormat);
          }
        }
      } catch (err) {
        console.error("Error initializing complaints in drafts:", err);
      }
    }
    initComplaints();
  }, [complaintIdParam]);

  // Upload Document and Convert to a Brand New Editable Proforma Tab
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadLoading(true);
    setUploadSuccessMessage(null);

    try {
      let pData: any = null;

      // 1. Try server-side OCR & AI extraction
      try {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("targetType", "enquiry_report");

        const res = await fetch("/api/documents/parse-proforma", {
          method: "POST",
          body: fd,
        });

        const data = await res.json();
        if (res.ok && data.success && data.proformaData) {
          pData = data.proformaData;
        }
      } catch (apiErr) {
        console.warn("API parsing error, using universal parser:", apiErr);
      }

      // 2. Client-side universal parser (handles DOCX, PDF streams, TXT, Kruti-Dev conversion)
      if (!pData || !Array.isArray(pData.rows) || pData.rows.length === 0) {
        const parsedDoc = await parseUploadedDocument(file);
        pData = {
          title: parsedDoc.title,
          headerLeft: parsedDoc.headerLeft,
          headerRight: parsedDoc.headerRight,
          subHeaderLeft: parsedDoc.subHeaderLeft,
          subTitle: parsedDoc.subTitle,
          columns: parsedDoc.columns,
          rows: parsedDoc.rows,
          closingLine: parsedDoc.closingLine,
          officerName: parsedDoc.officerName,
          officerRank: parsedDoc.officerRank,
          officerLocation: parsedDoc.officerLocation,
        };
      }

      if (pData) {
        const customKey = `custom_${Date.now()}`;
        const cleanName = pData.title || file.name.replace(/\.[^/.]+$/, "").toUpperCase();

        const newTemplate: FormatTemplate = {
          name: cleanName.length > 32 ? cleanName.substring(0, 30) + "..." : cleanName,
          badge: `Uploaded (${file.name.split(".").pop()?.toUpperCase() || "DOC"})`,
          icon: FileText,
          headerLeft: pData.headerLeft || "POLICE DEPARTMENT",
          headerRight: pData.headerRight || "DISTRICT PANIPAT",
          subHeaderLeft: pData.subHeaderLeft || "",
          title: pData.title || `ENQUIRY REPORT - ${cleanName}`,
          subTitle: pData.subTitle || "",
          columns: Array.isArray(pData.columns) ? pData.columns : [],
          rows: (Array.isArray(pData.rows) && pData.rows.length > 0)
            ? pData.rows.map((r: any, idx: number) => ({
                id: r.id || `row_${idx + 1}`,
                label: r.label || `Row ${idx + 1}`,
                cells: Array.isArray(r.cells) ? r.cells : [r.cells || ""],
              }))
            : [{ id: "row_1", label: "Details", cells: [""] }],
          closingLine: pData.closingLine || "Report is submitted for perusal and orders.",
          officerName: pData.officerName || (currentUser.name ? `(${currentUser.name})` : "Enquiry Officer"),
          officerRank: pData.officerRank || currentUser.rankDisplay || "Assistant Superintendent of Police",
          officerLocation: pData.officerLocation || "",
        };

        setCustomDrafts((prev) => {
          const updated = {
            ...prev,
            [customKey]: newTemplate,
          };
          if (typeof window !== "undefined") {
            try {
              localStorage.setItem(CUSTOM_DRAFTS_STORAGE_KEY, JSON.stringify(updated));
            } catch (storageErr) {
              console.warn("Storage quota / error saving draft to localStorage", storageErr);
            }
          }
          return updated;
        });

        setActiveFormat(customKey);
        setHeaderLeft(newTemplate.headerLeft);
        setHeaderRight(newTemplate.headerRight);
        setSubHeaderLeft(newTemplate.subHeaderLeft);
        setTitle(newTemplate.title);
        setSubTitle(newTemplate.subTitle);
        setColumns(newTemplate.columns);
        setRows(newTemplate.rows);
        setClosingLine(newTemplate.closingLine);
        setOfficerName(newTemplate.officerName);
        setOfficerRank(newTemplate.officerRank);
        setOfficerLocation(newTemplate.officerLocation);
        setShowSubHeader(Boolean(newTemplate.subHeaderLeft));

        setUploadSuccessMessage(
          `Document "${file.name}" successfully parsed! Added as brand new editable template "${newTemplate.name}". Words, language & formatting mirrored word-to-word.`
        );
        setTimeout(() => setUploadSuccessMessage(null), 8000);
      }
    } catch (err: any) {
      console.error("Upload parse error:", err);
      alert(`Error processing document: ${err.message || "Please try again"}`);
    } finally {
      setUploadLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteCustomDraft = (key: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    const tmplName = customDrafts[key]?.name || "this template";
    if (!confirm(`Are you sure you want to remove "${tmplName}" from dropdown?`)) return;
    setCustomDrafts((prev) => {
      const copy = { ...prev };
      delete copy[key];
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(CUSTOM_DRAFTS_STORAGE_KEY, JSON.stringify(copy));
        } catch (storageErr) {
          console.warn("Could not update localStorage", storageErr);
        }
      }
      return copy;
    });
    if (activeFormat === key) {
      handleSelectFormat("standard_4row");
    }
  };

  // Switch Format Template
  const handleSelectFormat = (formatKey: string) => {
    setActiveFormat(formatKey);
    if (complaint) {
      applyComplaintWithAnalysis(complaint, formatKey, (selectedClassification as EnquiryClassificationType) || undefined);
      return;
    }
    const tmpl = customDrafts[formatKey] || TEMPLATE_PRESETS[formatKey as EnquiryProformaType];
    if (!tmpl) return;
    setHeaderLeft(tmpl.headerLeft);
    setHeaderRight(tmpl.headerRight);
    setSubHeaderLeft(tmpl.subHeaderLeft);
    setTitle(tmpl.title);
    setSubTitle(tmpl.subTitle);
    setColumns(tmpl.columns);
    setRows(tmpl.rows);
    setClosingLine(tmpl.closingLine);
    setOfficerName(tmpl.officerName);
    setOfficerRank(tmpl.officerRank);
    setOfficerLocation(tmpl.officerLocation);
    setShowSubHeader(Boolean(tmpl.subHeaderLeft));
  };

  // Row operations
  const handleUpdateRowLabel = (id: string, newLabel: string) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, label: newLabel } : r)));
  };

  const handleUpdateCell = (rowId: string, cellIndex: number, value: string) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== rowId) return r;
        const newCells = [...r.cells];
        newCells[cellIndex] = value;
        return { ...r, cells: newCells };
      })
    );
  };

  const handleDeleteRow = (id: string) => {
    if (rows.length <= 1) {
      alert("At least one row must remain in the proforma.");
      return;
    }
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const handleMoveRow = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === rows.length - 1) return;
    const target = direction === "up" ? index - 1 : index + 1;
    const updated = [...rows];
    const temp = updated[index];
    updated[index] = updated[target];
    updated[target] = temp;
    setRows(updated);
  };

  const handleAddRow = (presetLabel?: string, presetValue?: string) => {
    const newId = `row_${Date.now()}`;
    const cellCount = columns.length > 0 ? columns.length : 1;
    const defaultCells = Array(cellCount).fill(presetValue || "");
    const newRow: ProformaRowState = {
      id: newId,
      label: presetLabel || `Row ${rows.length + 1}`,
      cells: defaultCells,
    };
    setRows((prev) => [...prev, newRow]);
  };

  // Column operations (for multi-column table)
  const handleAddColumn = () => {
    const newColName = prompt("Enter new Column Title:", `Column ${columns.length + 1}`);
    if (!newColName) return;
    setColumns((prev) => [...prev, newColName]);
    setRows((prev) => prev.map((r) => ({ ...r, cells: [...r.cells, ""] })));
  };

  const handleDeleteColumn = (colIndex: number) => {
    if (columns.length <= 1) {
      alert("At least one column must remain in the table.");
      return;
    }
    if (!confirm(`Are you sure you want to delete column '${columns[colIndex]}'?`)) return;
    setColumns((prev) => prev.filter((_, i) => i !== colIndex));
    setRows((prev) =>
      prev.map((r) => ({
        ...r,
        cells: r.cells.filter((_, i) => i !== colIndex),
      }))
    );
  };

  const handleUpdateColumnTitle = (colIndex: number, newTitle: string) => {
    setColumns((prev) => {
      const copy = [...prev];
      copy[colIndex] = newTitle;
      return copy;
    });
  };

  // Construct Data for HTML Generator
  const getProformaData = (): HaryanaPoliceProformaData => ({
    headerLeft: showHeader ? headerLeft : undefined,
    headerRight: showHeader ? headerRight : undefined,
    subHeaderLeft: showSubHeader ? subHeaderLeft : undefined,
    title,
    subTitle: subTitle || undefined,
    columns: columns.length > 0 ? columns : undefined,
    rows: rows.map((r) => ({
      id: r.id,
      label: r.label,
      cells: r.cells,
    })),
    closingLine: showClosingLine ? closingLine : undefined,
    officerName: showSignatures ? officerName : undefined,
    officerRank: showSignatures ? officerRank : undefined,
    officerLocation: showSignatures ? officerLocation : undefined,
    reportDate: showSignatures ? reportDate : undefined,
    borderStyle,
  });

  const handlePrint = () => {
    window.print();
  };

  const handleCopyReport = () => {
    if (!documentRef.current) return;
    const text = documentRef.current.innerText;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadReport = () => {
    const data = getProformaData();
    const html = generateHaryanaPoliceProformaHtml(data);
    const filename = `${(title || "POLICE_ENQUIRY_REPORT").replace(/[\/\\?%*:|"<> ]/g, "_")}.html`;
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

  const handleSaveToComplaint = async (targetComplaintParam?: ComplaintItem) => {
    const targetComp = targetComplaintParam || complaint;
    if (!targetComp?.id) {
      setSelectComplaintModalOpen(true);
      return;
    }
    setSaveLoading(true);
    try {
      const data = getProformaData();
      const reportHtml = generateHaryanaPoliceProformaHtml(data);
      const docText = documentRef.current?.innerText || "";
      const reportTitle = `${title} - ${targetComp.complaintNumber}`;

      const isFir = (selectedClassification || analysisResult?.classification) === "FIR_RECOMMENDED";
      const outcome: EOOutcome = isFir ? "FIR Recommend" : "Complete";

      const updatedComp = await ComplaintService.submitEoReportWithOutcome(
        targetComp.id,
        {
          title: reportTitle,
          reportType: activeFormat,
          reportTypeLabel: customDrafts[activeFormat]?.name || TEMPLATE_PRESETS[activeFormat as EnquiryProformaType]?.name || "Enquiry Report",
          dispatchNo: title,
          generatedDate: new Date().toISOString().split("T")[0],
          officerName: officerName || currentUser.name || "Enquiry Officer",
          officerRank: officerRank || currentUser.rankDisplay || "Assistant Superintendent of Police",
          officerPno: currentUser.pno || "PNO-23841",
          conclusionSummary: rows[rows.length - 1]?.cells[0]?.substring(0, 200) || "Enquiry completed",
          content: docText,
          contentHtml: reportHtml,
          fileName: `${title.replace(/[\/\\?%*:|"<> ]/g, "_")}.html`,
          fileSize: `${Math.round(reportHtml.length / 1024) || 4} KB`,
          fileFormat: "HTML",
          dataUrl: `data:text/html;charset=utf-8,${encodeURIComponent(reportHtml)}`,
          isUploaded: false,
          recommendationType: (selectedClassification as any) || analysisResult?.classification || "NO_COGNIZABLE_OFFENCE",
          isFirRecommended: isFir,
          analysisClassification: analysisResult?.titleHindi || (isFir ? "संज्ञेय अपराध - एफआईआर की सिफारिश" : "जांच रिपोर्ट"),
          analysisRationale: analysisResult?.rationaleHindi,
        },
        outcome,
        officerName || currentUser.name || "Enquiry Officer",
        officerRank || currentUser.rankDisplay || "Assistant Superintendent of Police",
        currentUser.pno || "PNO-23841",
        currentUser.role
      );

      setComplaint(updatedComp || targetComp);
      setSelectComplaintModalOpen(false);
      setSaveSuccess(true);
      if (isFir) {
        setIsSavedAndFirRecommended(true);
      }
      setTimeout(() => setSaveSuccess(false), 5000);
    } catch (err) {
      console.error("Failed to save report to complaint:", err);
      alert("Error saving report. Please try again.");
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDiscardDraft = () => {
    if (!confirm("Are you sure you want to discard this draft report? All changes will be reset to default.")) return;
    const initialTmpl = TEMPLATE_PRESETS[initialFormat] || TEMPLATE_PRESETS.standard_4row;
    setHeaderLeft(initialTmpl.headerLeft);
    setHeaderRight(initialTmpl.headerRight);
    setSubHeaderLeft(initialTmpl.subHeaderLeft);
    setTitle(initialTmpl.title);
    setSubTitle(initialTmpl.subTitle);
    setColumns(initialTmpl.columns);
    setRows(initialTmpl.rows);
    setClosingLine(initialTmpl.closingLine);
    setOfficerName(initialTmpl.officerName);
    setOfficerRank(initialTmpl.officerRank);
    setOfficerLocation(initialTmpl.officerLocation);
  };

  const isMultiCol = columns.length > 0;

  return (
    <div className="space-y-5 animate-in fade-in-50 pb-20">
      {/* Top Workspace Navigation Tabs */}
      <EnquiryWorkspaceNav complaintId={complaint?.id} />

      {/* 1. REQUIRED COMPLAINT DROPDOWN & ANALYSIS HEADER */}
      <ComplaintAnalysisHeader
        initialComplaintId={complaintIdParam}
        showPersonDropdown={false}
        onComplaintSelect={handleComplaintSelected}
        selectedComplaintId={complaint?.id}
      />

      {!complaint && (
        <div className="bg-white border-2 border-dashed border-slate-300 rounded-2xl p-10 text-center space-y-3">
          <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto text-blue-700">
            <FileText className="w-7 h-7" />
          </div>
          <h2 className="text-base font-bold text-slate-800">
            Select a Complaint to Generate Draft Enquiry Report
          </h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Choose a complaint from your Complaint Register in the required dropdown above. The system will analyze all facts from the Overview and Documents subtabs, extract particulars without inventing information, and generate an editable enquiry report proforma.
          </p>
        </div>
      )}

      {complaint && (
        <div className="space-y-4">
          {/* ================= 1. TOP HEADER & WORKSPACE TOOLBAR (NO-PRINT) ================= */}
          <div className="no-print space-y-3">
        {/* Navigation & Action Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex flex-wrap items-center gap-2.5">
            {complaint && (
              <span className="text-[11px] font-bold font-mono text-blue-700 bg-blue-50 px-2.5 py-1 rounded border border-blue-200">
                Complaint: {complaint.complaintNumber}
              </span>
            )}

            {/* Police Proforma Format Selector Custom Dropdown */}
            <div className="relative flex items-center gap-1.5" ref={proformaDropdownRef}>
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1 whitespace-nowrap">
                <FileText className="w-3.5 h-3.5 text-red-600" />
                <span>Proforma:</span>
              </label>
              
              <button
                type="button"
                onClick={() => setProformaDropdownOpen((v) => !v)}
                className="flex items-center justify-between gap-2 text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[210px] max-w-[320px] shadow-2xs text-left cursor-pointer"
                title="Select Proforma Format"
              >
                <span className="truncate">
                  {customDrafts[activeFormat]
                    ? `📁 ${customDrafts[activeFormat].name}`
                    : TEMPLATE_PRESETS[activeFormat as EnquiryProformaType]?.name || "Select Proforma"}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${proformaDropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {/* Quick delete cross if current active item is uploaded */}
              {customDrafts[activeFormat] && (
                <button
                  type="button"
                  onClick={(e) => handleDeleteCustomDraft(activeFormat, e)}
                  className="p-1 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded-md border border-slate-200 transition-colors shadow-2xs cursor-pointer"
                  title="Delete currently selected uploaded template"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

              {proformaDropdownOpen && (
                <div className="absolute left-0 top-full mt-1.5 w-80 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1.5 overflow-hidden animate-in fade-in-50 zoom-in-95">
                  {/* Preset Standard Templates */}
                  <div className="px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-50">
                    Standard Proforma Templates
                  </div>
                  <div className="max-h-52 overflow-y-auto divide-y divide-slate-100">
                    {(Object.keys(TEMPLATE_PRESETS) as EnquiryProformaType[]).map((fmtKey) => {
                      const isSelected = activeFormat === fmtKey;
                      return (
                        <button
                          key={fmtKey}
                          type="button"
                          onClick={() => {
                            handleSelectFormat(fmtKey);
                            setProformaDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left transition-colors ${
                            isSelected
                              ? "bg-blue-50 text-blue-900 font-bold"
                              : "text-slate-700 hover:bg-slate-50 font-medium"
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate pr-2">
                            <FileText className={`w-3.5 h-3.5 shrink-0 ${isSelected ? "text-blue-600" : "text-slate-400"}`} />
                            <span className="truncate">{TEMPLATE_PRESETS[fmtKey].name}</span>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>

                  {/* Uploaded Documents Section */}
                  <div className="border-t border-slate-200 mt-1 pt-1.5">
                    <div className="px-3 py-1 flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-amber-700 bg-amber-50">
                      <span>📁 Uploaded Documents ({Object.keys(customDrafts).length})</span>
                    </div>

                    {Object.keys(customDrafts).length === 0 ? (
                      <div className="px-3 py-2 text-[11px] text-slate-400 italic">
                        No uploaded documents yet. Use &ldquo;Upload Document&rdquo; button.
                      </div>
                    ) : (
                      <div className="max-h-56 overflow-y-auto divide-y divide-slate-100">
                        {Object.keys(customDrafts).map((cKey) => {
                          const isSelected = activeFormat === cKey;
                          const tmpl = customDrafts[cKey];
                          return (
                            <div
                              key={cKey}
                              className={`flex items-center justify-between px-2.5 py-1.5 transition-colors group ${
                                isSelected ? "bg-amber-50 text-amber-950 font-bold" : "hover:bg-slate-50 text-slate-700"
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  handleSelectFormat(cKey);
                                  setProformaDropdownOpen(false);
                                }}
                                className="flex-1 flex items-center gap-2 text-xs text-left truncate mr-2"
                                title={tmpl.name}
                              >
                                <span className="shrink-0 text-amber-600 font-mono text-[11px]">📁</span>
                                <span className="truncate">{tmpl.name}</span>
                                {tmpl.badge && (
                                  <span className="shrink-0 text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold">
                                    {tmpl.badge}
                                  </span>
                                )}
                              </button>

                              {/* Delete Cross (X) Sign in front of uploaded item */}
                              <button
                                type="button"
                                onClick={(e) => handleDeleteCustomDraft(cKey, e)}
                                className="p-1 text-slate-400 hover:text-red-700 hover:bg-red-100 rounded-md transition-colors shrink-0 cursor-pointer"
                                title={`Delete "${tmpl.name}" from dropdown`}
                                aria-label={`Delete ${tmpl.name}`}
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Section 3: Built Case Drafts (from Template & Draft Builder) */}
                  <div className="border-t border-slate-200 mt-1 pt-1.5">
                    <div className="px-3 py-1 flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-amber-800 bg-amber-50">
                      <span className="flex items-center gap-1">
                        <FileCheck2 className="w-3 h-3 text-amber-700" />
                        <span>Built Drafts ({builtDrafts.length})</span>
                      </span>
                      <Link
                        href={`/enquiry-workspace/builder${complaint ? `?complaintId=${complaint.id}` : ""}`}
                        className="text-[9px] font-bold text-amber-800 hover:text-amber-950 underline lowercase"
                        onClick={() => setProformaDropdownOpen(false)}
                      >
                        + new
                      </Link>
                    </div>

                    {builtDrafts.length === 0 ? (
                      <div className="px-3 py-2 text-[11px] text-slate-400 italic flex items-center justify-between">
                        <span>No built drafts yet.</span>
                        <Link
                          href={`/enquiry-workspace/builder${complaint ? `?complaintId=${complaint.id}` : ""}`}
                          className="text-[10px] text-amber-700 font-bold hover:underline"
                          onClick={() => setProformaDropdownOpen(false)}
                        >
                          Draft in Builder
                        </Link>
                      </div>
                    ) : (
                      <div className="max-h-52 overflow-y-auto divide-y divide-slate-100">
                        {builtDrafts.map((bd) => (
                          <div
                            key={bd.id}
                            className="flex items-center justify-between px-2.5 py-1.5 transition-colors group hover:bg-amber-50/60 text-slate-700"
                          >
                            <Link
                              href={`/enquiry-workspace/builder?draftId=${bd.id}${bd.caseId || complaint?.id ? `&complaintId=${bd.caseId || complaint?.id}` : ""}`}
                              onClick={() => setProformaDropdownOpen(false)}
                              className="flex-1 flex items-center gap-2 text-xs text-left truncate mr-2"
                              title={`${bd.name} (Click to open in Builder)`}
                            >
                              <span className="shrink-0 text-amber-600 font-mono text-[11px]">📄</span>
                              <span className="truncate font-medium">{bd.name}</span>
                              {bd.complaintNumber && (
                                <span className="shrink-0 text-[9px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-mono">
                                  {bd.complaintNumber}
                                </span>
                              )}
                            </Link>

                            {/* Delete Cross (X) */}
                            <button
                              type="button"
                              onClick={(e) => handleDeleteBuiltDraft(bd.id, bd.name, e)}
                              className="p-1 text-slate-400 hover:text-red-700 hover:bg-red-100 rounded-md transition-colors shrink-0 cursor-pointer"
                              title={`Delete "${bd.name}" from database`}
                              aria-label={`Delete ${bd.name}`}
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Section 4: Built Custom Templates (from Template & Draft Builder) */}
                  <div className="border-t border-slate-200 mt-1 pt-1.5">
                    <div className="px-3 py-1 flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-blue-700 bg-blue-50">
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-blue-600" />
                        <span>Built Templates ({builtTemplates.length})</span>
                      </span>
                      <Link
                        href={`/enquiry-workspace/builder${complaint ? `?complaintId=${complaint.id}` : ""}`}
                        className="text-[9px] font-bold text-blue-600 hover:text-blue-800 underline lowercase"
                        onClick={() => setProformaDropdownOpen(false)}
                      >
                        + new
                      </Link>
                    </div>

                    {builtTemplates.length === 0 ? (
                      <div className="px-3 py-2 text-[11px] text-slate-400 italic">
                        No built templates yet.
                      </div>
                    ) : (
                      <div className="max-h-52 overflow-y-auto divide-y divide-slate-100">
                        {builtTemplates.map((bt) => (
                          <div
                            key={bt.id}
                            className="flex items-center justify-between px-2.5 py-1.5 transition-colors group hover:bg-blue-50/60 text-slate-700"
                          >
                            <Link
                              href={`/enquiry-workspace/builder?templateId=${bt.id}${complaint ? `&complaintId=${complaint.id}` : ""}`}
                              onClick={() => setProformaDropdownOpen(false)}
                              className="flex-1 flex items-center gap-2 text-xs text-left truncate mr-2"
                              title={`${bt.name} (Click to open and auto-populate in Builder)`}
                            >
                              <span className="shrink-0 text-blue-600 font-mono text-[11px]">📝</span>
                              <span className="truncate font-medium">{bt.name}</span>
                              <span className="shrink-0 text-[9px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-bold">
                                v{bt.version || 1}
                              </span>
                            </Link>

                            {/* Delete Cross (X) */}
                            <button
                              type="button"
                              onClick={(e) => handleDeleteBuiltTemplate(bt.id, bt.name, e)}
                              className="p-1 text-slate-400 hover:text-red-700 hover:bg-red-100 rounded-md transition-colors shrink-0 cursor-pointer"
                              title={`Delete "${bt.name}" from database`}
                              aria-label={`Delete ${bt.name}`}
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Dictation Toggle */}
            <div className="flex items-center gap-1 text-xs pl-1">
              <span className="text-slate-500 font-medium text-[11px]">Dictation:</span>
              <div className="flex items-center gap-0.5 bg-slate-100 p-0.5 rounded border border-slate-200">
                <button
                  type="button"
                  onClick={() => setVoiceLang("en-IN")}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    voiceLang === "en-IN" ? "bg-[#0b192c] text-white" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => setVoiceLang("hi-IN")}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    voiceLang === "hi-IN" ? "bg-[#0b192c] text-white" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Hindi
                </button>
              </div>
            </div>

            {/* Reset Proforma Button */}
            <button
              type="button"
              onClick={() => handleSelectFormat(activeFormat)}
              className="px-2 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded text-xs font-semibold flex items-center gap-1 border border-transparent hover:border-slate-200 cursor-pointer"
              title="Reset this format to standard template"
            >
              <RotateCcw className="w-3 h-3 text-slate-500" />
              <span>Reset Proforma</span>
            </button>

            {/* Upload Document in Any Format Button */}
            <div className="relative">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.doc,.txt,.rtf,.odt,.csv,.png,.jpg,.jpeg,*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadLoading}
                className="text-xs font-bold gap-1.5 border-blue-300 text-blue-700 bg-blue-50/70 hover:bg-blue-100 hover:text-blue-900 cursor-pointer shadow-2xs"
                title="Upload document in any format (PDF, Word DOCX, Image, Text) to analyze, mirror word-to-word and create new editable template"
              >
                {uploadLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                    <span>Processing & Analyzing...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-3.5 h-3.5 text-blue-600" />
                    <span>Upload Document (Any Format)</span>
                  </>
                )}
              </Button>
            </div>
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
                  <span>Enquiry Workspace</span>
                </Button>
              </Link>
            )}

            {/* Always-visible Save to Complaint / Save in Reports Button */}
            <Button
              onClick={() => {
                if (complaint) {
                  handleSaveToComplaint();
                } else {
                  setSelectComplaintModalOpen(true);
                }
              }}
              disabled={saveLoading}
              variant="primary"
              size="sm"
              className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              {saveSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>Report Saved in Reports!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{saveLoading ? "Saving..." : complaint ? "Save in Reports" : "Save to Complaint..."}</span>
                </>
              )}
            </Button>

            {/* If FIR Recommended or saved with FIR recommendation, show Send to SHO ID Button */}
            {complaint && ((selectedClassification || analysisResult?.classification) === "FIR_RECOMMENDED" || isSavedAndFirRecommended) && (
              <Button
                type="button"
                onClick={handleSendToSho}
                disabled={sendingToSho}
                variant="primary"
                size="sm"
                className="text-xs font-bold bg-red-600 hover:bg-red-700 text-white flex items-center gap-1.5 shadow-xs cursor-pointer animate-pulse"
                title="Send Enquiry Report to Station House Officer (SHO) for FIR Registration"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{sendingToSho ? "Sending to SHO..." : "Send to SHO ID (FIR हेतु)"}</span>
              </Button>
            )}

          </div>
        </div>

        {/* ================= INTELLIGENCE ANALYSIS & LEGAL CLASSIFICATION BANNER ================= */}
        {complaint && analysisResult && (
          <div className={`p-4 rounded-xl border ${analysisResult.badgeColor.border} ${analysisResult.badgeColor.bg} space-y-2.5 transition-all shadow-2xs`}>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-extrabold uppercase tracking-wider bg-[#0b192c] text-white px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>AI Legal Analysis (मामला कानूनी विश्लेषण)</span>
                </span>
                <span className={`text-xs font-black px-2.5 py-0.5 rounded-full border ${analysisResult.badgeColor.border} bg-white ${analysisResult.badgeColor.text} shadow-2xs flex items-center gap-1`}>
                  {analysisResult.titleHindi} ({analysisResult.titleEnglish})
                </span>
              </div>

              {/* Recommendation Override Selector */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[11px] font-bold text-slate-700">जांच निष्कर्ष / Recommendation:</span>
                <select
                  value={selectedClassification || analysisResult.classification}
                  onChange={(e) => handleChangeClassification(e.target.value as EnquiryClassificationType)}
                  className="text-xs font-bold bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-slate-900 focus:ring-2 focus:ring-blue-500 shadow-2xs cursor-pointer"
                >
                  <option value="GAMINI">1. Gamini (Land &amp; Boundary Dispute / राजस्व ज़मीनी विवाद)</option>
                  <option value="DIWANI">2. Diwani (Civil &amp; Monetary Dispute / दीवानी लेन-देन)</option>
                  <option value="NCR">3. NCR (Non-Cognizable Report u/s 174 BNSS / असंज्ञेय रिपोर्ट)</option>
                  <option value="FIR">4. FIR (Cognizable Offence - Regular FIR / संज्ञेय अपराध)</option>
                  <option value="NIVARAN">5. Nivaran (Preventive Action u/s 126/170 BNSS / निवारक निस्तारण)</option>
                  <option value="RAZINAMA">6. Razinama (Mutual Compromise &amp; Accord / राजीनामा)</option>
                </select>
              </div>
            </div>

            {/* Analysis Rationale & Inspected Evidence */}
            <div className="text-xs space-y-1.5 text-slate-800">
              <p className="leading-relaxed">
                <strong>कानूनी विश्लेषण व आधार: </strong>
                {analysisResult.rationaleHindi}
              </p>
              {analysisResult.analyzedDocuments && analysisResult.analyzedDocuments.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap pt-0.5 text-[11px] text-slate-600">
                  <span className="font-semibold text-slate-700">प्रोफाइल व साक्ष्य दस्तावेज विश्लेषित:</span>
                  {analysisResult.analyzedDocuments.map((docName, idx) => (
                    <span key={idx} className="bg-white/90 border border-slate-200 px-2 py-0.2 rounded font-mono text-slate-800 shadow-2xs">
                      📄 {docName}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* If FIR is recommended: Prompt to Send to SHO */}
            {((selectedClassification || analysisResult.classification) === "FIR_RECOMMENDED" || isSavedAndFirRecommended) && (
              <div className="pt-2 border-t border-red-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs bg-red-100/50 p-2.5 rounded-lg">
                <div className="flex items-center gap-2 text-red-950 font-semibold">
                  <Scale className="w-4 h-4 text-red-600 shrink-0" />
                  <span>
                    इस मामले में संज्ञेय अपराध प्रमाणित हुआ है। रिपोर्ट सेव करें व <strong>"Send to SHO ID"</strong> दबाकर SHO को एफआईआर दर्ज करने हेतु अग्रेषित करें।
                  </span>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleSendToSho}
                  disabled={sendingToSho}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs h-7.5 px-3.5 gap-1.5 shrink-0 shadow-xs cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{sendingToSho ? "Sending to SHO..." : "Send to SHO ID (FIR दर्ज हेतु)"}</span>
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Upload Processing Indicator */}
        {uploadLoading && (
          <div className="p-3 bg-indigo-50 border border-indigo-300 rounded-xl flex items-center gap-2.5 text-xs text-indigo-900 animate-in fade-in-50">
            <Loader2 className="w-4 h-4 text-indigo-600 animate-spin shrink-0" />
            <div>
              <span className="font-bold">AI OCR is analyzing your document... </span>
              <span className="text-indigo-700">Extracting tables, columns, headers, and text verbatim.</span>
            </div>
          </div>
        )}

        {/* Upload Success Alert */}
        {uploadSuccessMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between text-xs text-emerald-900 animate-in fade-in-50">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span className="font-bold">{uploadSuccessMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setUploadSuccessMessage(null)}
              className="text-emerald-800 hover:text-emerald-950 text-xs font-bold underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Save Success Alert */}
        {saveSuccess && complaint && (
          <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between text-xs text-emerald-900 animate-in fade-in-50">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              <span className="font-bold">
                Report successfully saved into Complaint {complaint.complaintNumber} under the &ldquo;Reports&rdquo; docket!
              </span>
            </div>
            <Link
              href={`/complaints/${complaint.id}`}
              className="text-xs font-bold text-emerald-800 underline hover:text-emerald-950"
            >
              Open Reports Docket &rarr;
            </Link>
          </div>
        )}

        {/* Proforma Customization & Control Toolbar */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-slate-700 flex items-center gap-1">
              <Sliders className="w-3.5 h-3.5 text-blue-600" />
              Proforma Customization Toolbar:
            </span>

            {/* Border Style */}
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded px-2 py-1">
              <span className="text-[11px] text-slate-500 font-medium">Border Style:</span>
              <select
                value={borderStyle}
                onChange={(e) => setBorderStyle(e.target.value as any)}
                className="text-[11px] font-bold bg-transparent border-0 outline-none cursor-pointer text-slate-900"
              >
                <option value="solid">Solid Black (Official PDF)</option>
                <option value="double">Double Border</option>
                <option value="light">Light Gray</option>
                <option value="none">No Border</option>
              </select>
            </div>

            {/* Toggle Header */}
            <button
              type="button"
              onClick={() => setShowHeader(!showHeader)}
              className={`px-2.5 py-1 rounded border text-[11px] font-bold transition-all cursor-pointer ${
                showHeader
                  ? "bg-blue-50 text-blue-800 border-blue-200"
                  : "bg-white text-slate-500 border-slate-200"
              }`}
            >
              {showHeader ? "✓ Header: Active" : "✕ Header: Hidden"}
            </button>

            {/* Toggle Sub-Header */}
            <button
              type="button"
              onClick={() => setShowSubHeader(!showSubHeader)}
              className={`px-2.5 py-1 rounded border text-[11px] font-bold transition-all cursor-pointer ${
                showSubHeader
                  ? "bg-blue-50 text-blue-800 border-blue-200"
                  : "bg-white text-slate-500 border-slate-200"
              }`}
            >
              {showSubHeader ? "✓ Sub-Header: Active" : "✕ Sub-Header: Hidden"}
            </button>

            {/* Toggle Signatures */}
            <button
              type="button"
              onClick={() => setShowSignatures(!showSignatures)}
              className={`px-2.5 py-1 rounded border text-[11px] font-bold transition-all cursor-pointer ${
                showSignatures
                  ? "bg-blue-50 text-blue-800 border-blue-200"
                  : "bg-white text-slate-500 border-slate-200"
              }`}
            >
              {showSignatures ? "✓ Signatures: Active" : "✕ Signatures: Hidden"}
            </button>
          </div>

          {/* Table Row & Column Add Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {isMultiCol && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddColumn}
                className="text-xs bg-white hover:bg-slate-100 text-blue-700 font-bold border-blue-200 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Column</span>
              </Button>
            )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleAddRow()}
              className="text-xs bg-white hover:bg-slate-100 text-emerald-700 font-bold border-emerald-200 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Row</span>
            </Button>
          </div>
        </div>
      </div>

      {/* ================= 2. THE DOCUMENT SHEET (EXACT POLICE A4 PROFORMA) ================= */}
      <div className="w-full max-w-4xl mx-auto space-y-4">
        <div
          ref={documentRef}
          className="bg-white border-2 border-slate-300 rounded-2xl p-6 sm:p-14 shadow-lg text-black font-sans transition-all space-y-4"
          style={{
            minHeight: "1050px",
            lineHeight: "1.65",
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
          }}
        >
          {/* Header Row: Top Left (POLICE DEPARTMENT) & Top Right (DISTRICT PANIPAT) */}
          {showHeader && (
            <div className="flex items-center justify-between text-sm sm:text-base font-bold pb-2 border-b border-transparent">
              <div className="flex items-center gap-1 group relative">
                <input
                  type="text"
                  value={headerLeft}
                  onChange={(e) => setHeaderLeft(e.target.value)}
                  className="font-bold text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent hover:border-slate-300 focus:border-blue-500 rounded px-1.5 py-0.5 text-sm sm:text-base uppercase"
                  placeholder="POLICE DEPARTMENT"
                />
                <button
                  type="button"
                  onClick={() => setHeaderLeft("")}
                  className="no-print opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 text-xs cursor-pointer"
                  title="Remove Header"
                >
                  ✕
                </button>
              </div>

              <div className="flex items-center gap-1 group relative">
                <input
                  type="text"
                  value={headerRight}
                  onChange={(e) => setHeaderRight(e.target.value)}
                  className="font-bold text-slate-950 text-right bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent hover:border-slate-300 focus:border-blue-500 rounded px-1.5 py-0.5 text-sm sm:text-base uppercase"
                  placeholder="DISTRICT PANIPAT"
                />
                <button
                  type="button"
                  onClick={() => setHeaderRight("")}
                  className="no-print opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 text-xs cursor-pointer"
                  title="Remove District"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Sub Header: 'Respected Sir,' */}
          {showSubHeader && subHeaderLeft && (
            <div className="pt-1 flex items-center gap-1 group">
              <input
                type="text"
                value={subHeaderLeft}
                onChange={(e) => setSubHeaderLeft(e.target.value)}
                className="font-bold text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent hover:border-slate-300 focus:border-blue-500 rounded px-1.5 py-0.5 text-sm sm:text-base w-40"
              />
              <button
                type="button"
                onClick={() => setSubHeaderLeft("")}
                className="no-print opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 text-xs cursor-pointer"
                title="Remove Sub-header"
              >
                ✕
              </button>
            </div>
          )}

          {/* Report Title Center */}
          <div className="my-2 text-center space-y-1">
            <div className="relative group">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-center text-sm sm:text-base font-black tracking-wide text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent hover:border-slate-300 focus:border-blue-500 rounded px-2 py-1 uppercase"
                placeholder="ENQUIRY REPORT ON COMPLAINT NO..."
              />
            </div>

            {subTitle !== undefined && (
              <div className="relative group">
                <input
                  type="text"
                  value={subTitle}
                  onChange={(e) => setSubTitle(e.target.value)}
                  className="w-full text-center text-xs sm:text-sm font-bold text-slate-800 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent hover:border-slate-300 focus:border-blue-500 rounded px-2 py-0.5"
                  placeholder="Enquiry findings are as follows -"
                />
              </div>
            )}
          </div>

          {/* ================= THE OFFICIAL PROFORMA TABLE ================= */}
          <div className="pt-1">
            <table
              className="w-full border-collapse"
              style={{
                border:
                  borderStyle === "none"
                    ? "none"
                    : borderStyle === "light"
                    ? "1px solid #cbd5e1"
                    : borderStyle === "double"
                    ? "3px double #000000"
                    : "1.5px solid #000000",
              }}
            >
              {/* Optional Table Header (Multi-Column Format) */}
              {isMultiCol && (
                <thead>
                  <tr className="bg-slate-50/80">
                    {columns.map((colTitle, colIdx) => (
                      <th
                        key={colIdx}
                        className="p-2 sm:p-2.5 text-left text-xs sm:text-sm font-black text-black align-top relative group"
                        style={{
                          border:
                            borderStyle === "none"
                              ? "none"
                              : borderStyle === "light"
                              ? "1px solid #cbd5e1"
                              : "1.5px solid #000000",
                        }}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <textarea
                            rows={2}
                            value={colTitle}
                            onChange={(e) => handleUpdateColumnTitle(colIdx, e.target.value)}
                            className="w-full font-black text-xs sm:text-sm bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-slate-300 focus:border-blue-500 rounded p-1 leading-snug resize-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleDeleteColumn(colIdx)}
                            className="no-print opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-600 p-0.5 text-[10px] cursor-pointer"
                            title="Delete this column"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
              )}

              {/* Table Body Rows */}
              <tbody>
                {rows.map((row, rowIdx) => (
                  <tr key={row.id} className="group/row">
                    {/* If Multi-Column */}
                    {isMultiCol ? (
                      columns.map((_, colIdx) => (
                        <td
                          key={colIdx}
                          className="p-2 sm:p-2.5 text-xs sm:text-sm text-black align-top relative"
                          style={{
                            border:
                              borderStyle === "none"
                                ? "none"
                                : borderStyle === "light"
                                ? "1px solid #cbd5e1"
                                : "1.5px solid #000000",
                          }}
                        >
                          <div className="relative">
                            <textarea
                              rows={Math.max(4, Math.min(18, (row.cells[colIdx]?.match(/\n/g) || []).length + 3))}
                              value={row.cells[colIdx] || ""}
                              onChange={(e) => handleUpdateCell(row.id, colIdx, e.target.value)}
                              className="w-full text-xs sm:text-sm text-black bg-transparent hover:bg-slate-50/50 focus:bg-white border border-transparent hover:border-slate-300 focus:border-blue-500 rounded p-1.5 leading-relaxed font-sans focus:outline-none"
                              placeholder="Enter particulars..."
                            />

                            {/* Cell Voice Button */}
                            <div className="no-print absolute top-1 right-1 opacity-0 group-hover/row:opacity-100 transition-opacity">
                              <VoiceInputButton
                                preferredLang={voiceLang}
                                fieldLabel={`Column ${colIdx + 1}`}
                                currentValue={row.cells[colIdx] || ""}
                                onTranscript={(val) => handleUpdateCell(row.id, colIdx, val)}
                              />
                            </div>
                          </div>

                          {/* Row Controls on Last Column */}
                          {colIdx === columns.length - 1 && (
                            <div className="no-print absolute -right-9 top-2 flex flex-col gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity">
                              <button
                                type="button"
                                disabled={rowIdx === 0}
                                onClick={() => handleMoveRow(rowIdx, "up")}
                                className="p-1 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 disabled:opacity-20 shadow-xs cursor-pointer"
                                title="Move Up"
                              >
                                <ChevronUp className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                disabled={rowIdx === rows.length - 1}
                                onClick={() => handleMoveRow(rowIdx, "down")}
                                className="p-1 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 disabled:opacity-20 shadow-xs cursor-pointer"
                                title="Move Down"
                              >
                                <ChevronDown className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteRow(row.id)}
                                className="p-1 rounded bg-white hover:bg-red-50 border border-slate-200 text-slate-400 hover:text-red-600 shadow-xs cursor-pointer"
                                title="Delete Row"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </td>
                      ))
                    ) : (
                      /* Standard 2-Column Official Proforma */
                      <>
                        {/* Col 1: Label (Complainant, Substance, Opposite Party, Findings) */}
                        <td
                          className="w-36 sm:w-52 p-2 sm:p-2.5 text-xs sm:text-sm font-black text-black align-top relative group"
                          style={{
                            border:
                              borderStyle === "none"
                                ? "none"
                                : borderStyle === "light"
                                ? "1px solid #cbd5e1"
                                : "1.5px solid #000000",
                          }}
                        >
                          <div className="flex items-start justify-between gap-1">
                            <input
                              type="text"
                              value={row.label}
                              onChange={(e) => handleUpdateRowLabel(row.id, e.target.value)}
                              className="w-full font-black text-xs sm:text-sm text-black bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent hover:border-slate-300 focus:border-blue-500 rounded px-1.5 py-0.5"
                              placeholder="Label"
                            />
                          </div>

                          {/* Row Position and Reorder */}
                          <div className="no-print absolute -left-7 top-2 flex flex-col gap-0.5 opacity-0 group-hover/row:opacity-100 transition-opacity">
                            <button
                              type="button"
                              disabled={rowIdx === 0}
                              onClick={() => handleMoveRow(rowIdx, "up")}
                              className="p-0.5 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 disabled:opacity-20 cursor-pointer"
                              title="Move Up"
                            >
                              <ChevronUp className="w-2.5 h-2.5" />
                            </button>
                            <button
                              type="button"
                              disabled={rowIdx === rows.length - 1}
                              onClick={() => handleMoveRow(rowIdx, "down")}
                              className="p-0.5 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 disabled:opacity-20 cursor-pointer"
                              title="Move Down"
                            >
                              <ChevronDown className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        </td>

                        {/* Col 2: Content */}
                        <td
                          className="p-2 sm:p-2.5 text-xs sm:text-sm text-black align-top relative"
                          style={{
                            border:
                              borderStyle === "none"
                                ? "none"
                                : borderStyle === "light"
                                ? "1px solid #cbd5e1"
                                : "1.5px solid #000000",
                          }}
                        >
                          <div className="relative">
                            <textarea
                              rows={Math.max(2, Math.min(18, (row.cells[0]?.match(/\n/g) || []).length + 2))}
                              value={row.cells[0] || ""}
                              onChange={(e) => handleUpdateCell(row.id, 0, e.target.value)}
                              className="w-full text-xs sm:text-sm text-black bg-transparent hover:bg-slate-50/50 focus:bg-white border border-transparent hover:border-slate-300 focus:border-blue-500 rounded p-1.5 leading-relaxed font-sans focus:outline-none"
                              placeholder="Enter details..."
                            />

                            {/* Voice Button & Delete Row Button */}
                            <div className="no-print absolute top-1 right-1 flex items-center gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity">
                              <VoiceInputButton
                                preferredLang={voiceLang}
                                fieldLabel={row.label}
                                currentValue={row.cells[0] || ""}
                                onTranscript={(val) => handleUpdateCell(row.id, 0, val)}
                              />
                              <button
                                type="button"
                                onClick={() => handleDeleteRow(row.id)}
                                className="p-1 rounded bg-white hover:bg-red-50 border border-slate-200 text-slate-400 hover:text-red-600 shadow-2xs cursor-pointer"
                                title="Delete this row"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Preset Quick Row Adders (No-print) */}
          <div className="no-print pt-2 pb-1 border-t border-dashed border-slate-300 flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase mr-1">
              + Quick Rows:
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                handleAddRow(
                  "Statements of Witnesses Examined",
                  "1. Statement of Witness 1: Sh. ... r/o ... was recorded.\n2. Statement of Independent Eye-Witness: Sh. ... recorded stating that ..."
                )
              }
              className="text-[11px] h-7 bg-white hover:bg-slate-100 text-slate-700 cursor-pointer"
            >
              + Witness Statements
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                handleAddRow(
                  "Spot Panchnama & Site Verification",
                  "Spot inspection was conducted on ... in presence of independent panch witnesses. Topography and observations noted at scene: ..."
                )
              }
              className="text-[11px] h-7 bg-white hover:bg-slate-100 text-slate-700 cursor-pointer"
            >
              + Spot Panchnama
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                handleAddRow(
                  "Compromise & Mutual Settlement",
                  "Both parties appeared voluntarily with family respectables and settled the controversy amicably. Written compromise deed executed."
                )
              }
              className="text-[11px] h-7 bg-white hover:bg-slate-100 text-slate-700 cursor-pointer"
            >
              + Settlement Agreement
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                handleAddRow(
                  "Documentary & Technical Evidence",
                  "1. Certified Bank Statement & Transaction Receipts\n2. Call Detail Records (CDR) / CCTV Footage analysis"
                )
              }
              className="text-[11px] h-7 bg-white hover:bg-slate-100 text-slate-700 cursor-pointer"
            >
              + Documentary Evidence
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleAddRow()}
              className="text-[11px] h-7 bg-[#0b192c] text-white hover:bg-slate-800 font-bold cursor-pointer"
            >
              + Custom Row
            </Button>
          </div>

          {/* Closing Line: 'Report is submitted for perusal and orders.' */}
          {showClosingLine && (
            <div className="pt-2 flex items-center justify-between text-sm sm:text-base font-bold">
              <div className="flex items-center gap-1 group">
                <input
                  type="text"
                  value={closingLine}
                  onChange={(e) => setClosingLine(e.target.value)}
                  className="font-bold text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent hover:border-slate-300 focus:border-blue-500 rounded px-1.5 py-0.5 text-sm sm:text-base w-80"
                  placeholder="Report is submitted for perusal and orders."
                />
                <button
                  type="button"
                  onClick={() => setShowClosingLine(false)}
                  className="no-print opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 text-xs cursor-pointer"
                  title="Remove"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* ================= OFFICER SIGNATURE & SEAL BLOCK (RIGHT-ALIGNED) ================= */}
          {showSignatures && (
            <div className="pt-6 flex justify-end">
              <div className="w-64 text-right space-y-1">
                {/* Hand Signature Stamp Placeholder */}
                <div className="h-12 flex items-end justify-end pb-1 pr-4">
                  <svg width="120" height="38" viewBox="0 0 120 38" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M10 28C25 12 45 6 70 18C90 26 85 8 110 10"
                      stroke="#1e293b"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>

                <input
                  type="text"
                  value={officerName}
                  onChange={(e) => setOfficerName(e.target.value)}
                  className="w-full text-right font-black text-slate-950 text-sm sm:text-base bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent hover:border-slate-300 focus:border-blue-500 rounded px-1.5 py-0.5"
                  placeholder="(Satish Kumar, HPS)"
                />

                <input
                  type="text"
                  value={officerRank}
                  onChange={(e) => setOfficerRank(e.target.value)}
                  className="w-full text-right font-bold text-slate-900 text-xs sm:text-sm bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent hover:border-slate-300 focus:border-blue-500 rounded px-1.5 py-0.5"
                  placeholder="Deputy Superintendent of Police"
                />

                {officerLocation && (
                  <input
                    type="text"
                    value={officerLocation}
                    onChange={(e) => setOfficerLocation(e.target.value)}
                    className="w-full text-right font-medium text-slate-800 text-xs sm:text-sm bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent hover:border-slate-300 focus:border-blue-500 rounded px-1.5 py-0.5"
                    placeholder="Headquarters Panipat"
                  />
                )}

                <input
                  type="text"
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                  className="w-full text-right font-bold text-slate-900 text-xs sm:text-sm bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent hover:border-slate-300 focus:border-blue-500 rounded px-1.5 py-0.5"
                  placeholder="Dated: 17.03.2026"
                />
              </div>
            </div>
          )}
        </div>

        {/* Bottom Floating Save Action Bar (Always Visible) */}
        <div className="no-print p-4 bg-white border border-slate-200 rounded-xl shadow-md flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-600" />
            <div>
              <p className="text-xs font-bold text-slate-900">
                {complaint
                  ? `Ready to save this report into Complaint ${complaint.complaintNumber}?`
                  : "Drafted Report is ready to be saved into Complaint Reports docket."}
              </p>
              <p className="text-[11px] text-slate-500">
                {complaint
                  ? "Saves directly into the complaint's \"Reports\" docket with all columns and findings."
                  : "Click save to select a complaint from your station docket and attach this report."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDiscardDraft}
              className="text-xs font-semibold text-rose-600 hover:text-rose-800 border-rose-200 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-500 mr-1" />
              Discard Draft
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPreviewModalOpen(true)}
              className="text-xs font-semibold text-slate-700 hover:text-slate-950 border-slate-300 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-blue-600 mr-1" />
              Preview Report
            </Button>

            <Button
              onClick={() => {
                if (complaint) {
                  handleSaveToComplaint();
                } else {
                  setSelectComplaintModalOpen(true);
                }
              }}
              disabled={saveLoading}
              variant="primary"
              size="sm"
              className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              {saveSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>Report Saved in Reports!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{saveLoading ? "Saving..." : complaint ? "Save in Reports" : "Save to Complaint..."}</span>
                </>
              )}
            </Button>

            {complaint && ((selectedClassification || analysisResult?.classification) === "FIR_RECOMMENDED" || isSavedAndFirRecommended) && (
              <Button
                type="button"
                onClick={handleSendToSho}
                disabled={sendingToSho}
                variant="primary"
                size="sm"
                className="text-xs font-bold bg-red-600 hover:bg-red-700 text-white flex items-center gap-1.5 cursor-pointer shadow-xs animate-pulse"
                title="Send Enquiry Report to SHO ID"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{sendingToSho ? "Sending..." : "Send to SHO ID (FIR हेतु)"}</span>
              </Button>
            )}
          </div>
        </div>
        </div>
      </div>
      )}

        {/* ================= PREVIEW REPORT MODAL ================= */}
        {previewModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in-50">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
              <div className="p-4 bg-[#0b192c] text-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-amber-400" />
                  <div>
                    <h3 className="font-bold text-sm">Official Enquiry Report Preview</h3>
                    <p className="text-[10px] text-slate-300 font-mono">
                      {title} {complaint ? `• Complaint: ${complaint.complaintNumber}` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadReport}
                    className="text-xs h-7 text-slate-800 bg-white hover:bg-slate-100"
                  >
                    <Download className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                    Download (.html)
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handlePrint}
                    className="text-xs h-7 text-slate-800 bg-white hover:bg-slate-100"
                  >
                    <Printer className="w-3.5 h-3.5 mr-1" />
                    Print A4
                  </Button>
                  <button
                    type="button"
                    onClick={() => setPreviewModalOpen(false)}
                    className="p-1.5 text-slate-300 hover:text-white rounded-lg cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-auto p-4 sm:p-6 bg-slate-100 flex items-center justify-center">
                <iframe
                  srcDoc={generateHaryanaPoliceProformaHtml(getProformaData())}
                  title="Enquiry Report Preview"
                  className="w-full h-[70vh] rounded-xl border border-slate-300 bg-white shadow-xs"
                />
              </div>

              <div className="p-3 bg-white border-t border-slate-200 flex items-center justify-between text-xs shrink-0">
                <span className="text-slate-500">
                  {complaint ? `Linked to ${complaint.complaintNumber}` : "Standalone preview - not yet saved"}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPreviewModalOpen(false)}
                  >
                    Close Preview
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      setPreviewModalOpen(false);
                      if (complaint) {
                        handleSaveToComplaint();
                      } else {
                        setSelectComplaintModalOpen(true);
                      }
                    }}
                    variant="primary"
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                  >
                    <Save className="w-3.5 h-3.5 mr-1" />
                    Save in Reports
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= SELECT COMPLAINT MODAL (IF NO COMPLAINT LINKED YET) ================= */}
        {selectComplaintModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in-50">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden">
              <div className="p-4 bg-[#0b192c] text-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <Save className="w-5 h-5 text-emerald-400" />
                  <div>
                    <h3 className="font-bold text-sm">Save Report to Complaint</h3>
                    <p className="text-[11px] text-slate-300">Choose which complaint docket to save this enquiry report to:</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectComplaintModalOpen(false)}
                  className="p-1.5 text-slate-300 hover:text-white rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-3 border-b border-slate-200 bg-slate-50 shrink-0">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search by Complaint No., Complainant, or Phone..."
                    value={complaintSearchQuery}
                    onChange={(e) => setComplaintSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-auto p-3 space-y-2">
                {availableComplaints
                  .filter((c) => {
                    if (!complaintSearchQuery.trim()) return true;
                    const q = complaintSearchQuery.toLowerCase();
                    return (
                      c.complaintNumber?.toLowerCase().includes(q) ||
                      c.complainantName?.toLowerCase().includes(q) ||
                      c.complainantMobile?.toLowerCase().includes(q) ||
                      c.subject?.toLowerCase().includes(q)
                    );
                  })
                  .map((c) => (
                    <div
                      key={c.id}
                      onClick={() => handleSaveToComplaint(c)}
                      className="p-3 border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            {c.complaintNumber}
                          </span>
                          <span className="font-bold text-slate-900 truncate">{c.complainantName}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 truncate">
                          {c.subject || c.complaintDescription || "Complaint under enquiry"}
                        </p>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="primary"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shrink-0"
                      >
                        Save Here
                      </Button>
                    </div>
                  ))}

                {availableComplaints.length === 0 && (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    No registered complaints found in system.
                  </div>
                )}
              </div>

              <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectComplaintModalOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
  );
}

export default function EnquiryDraftsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs text-slate-500">
          Loading Police Enquiry Reports &amp; NCR Drafts...
        </div>
      }
    >
      <EnquiryDraftsContent />
    </Suspense>
  );
}
