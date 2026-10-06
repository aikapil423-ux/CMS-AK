"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { VoiceInputButton } from "@/components/ui/voice-input-button";
import { ComplaintService } from "@/services/complaintService";
import { ComplaintItem } from "@/types";
import {
  generateHaryanaPoliceProformaHtml,
  HaryanaPoliceProformaData,
} from "@/utils/documentHtmlGenerators";

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

  const [activeFormat, setActiveFormat] = useState<EnquiryProformaType>(initialFormat);
  const [complaint, setComplaint] = useState<ComplaintItem | null>(null);

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

  // Upload Document and Convert to Editable Proforma
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadLoading(true);
    setUploadSuccessMessage(null);

    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("targetType", "enquiry_report");

      const res = await fetch("/api/documents/parse-proforma", {
        method: "POST",
        body: fd,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to parse document");
      }

      const pData = data.proformaData;
      if (pData) {
        if (pData.headerLeft !== undefined) setHeaderLeft(pData.headerLeft);
        if (pData.headerRight !== undefined) setHeaderRight(pData.headerRight);
        if (pData.subHeaderLeft !== undefined) {
          setSubHeaderLeft(pData.subHeaderLeft);
          setShowSubHeader(Boolean(pData.subHeaderLeft));
        }
        if (pData.title) setTitle(pData.title);
        if (pData.subTitle !== undefined) setSubTitle(pData.subTitle);
        if (Array.isArray(pData.columns)) setColumns(pData.columns);
        if (Array.isArray(pData.rows) && pData.rows.length > 0) {
          setRows(
            pData.rows.map((r: any, idx: number) => ({
              id: r.id || `row_${idx + 1}`,
              label: r.label || `Row ${idx + 1}`,
              cells: Array.isArray(r.cells) ? r.cells : [r.cells || ""],
            }))
          );
        }
        if (pData.closingLine !== undefined) {
          setClosingLine(pData.closingLine);
          setShowClosingLine(Boolean(pData.closingLine));
        }
        if (pData.officerName) setOfficerName(pData.officerName);
        if (pData.officerRank) setOfficerRank(pData.officerRank);
        if (pData.officerLocation !== undefined) setOfficerLocation(pData.officerLocation);
        if (pData.reportDate) setReportDate(pData.reportDate);
        if (pData.borderStyle) setBorderStyle(pData.borderStyle);

        setUploadSuccessMessage(
          `Document (${file.name}) processed successfully! All table columns and fields are ready to edit.`
        );
        setTimeout(() => setUploadSuccessMessage(null), 6000);
      }
    } catch (err: any) {
      console.error("Upload parse error:", err);
      alert(`Error processing document: ${err.message || "Please try again"}`);
    } finally {
      setUploadLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Load complaint if complaintIdParam exists
  useEffect(() => {
    if (!complaintIdParam) return;
    async function loadComplaint() {
      try {
        const found = await ComplaintService.getComplaintById(complaintIdParam!);
        if (found) {
          setComplaint(found);
          const districtName = (found.district || currentUser.district || "PANIPAT").toUpperCase();
          setHeaderRight(`DISTRICT ${districtName}`);
          setTitle(`ENQUIRY REPORT ON COMPLAINT NO. ${found.complaintNumber} DATED ${new Date().toLocaleDateString("en-GB").replace(/\//g, ".")}`);

          const primaryAccused = found.accusedList?.[0] || {};
          const complainantInfo = `${found.complainantName}${found.complainantFatherSpouse ? ` s/o / w/o ${found.complainantFatherSpouse}` : ""}${found.complainantAddress ? `, r/o ${found.complainantAddress}` : ""}${found.complainantMobile ? ` (Mob: ${found.complainantMobile})` : ""}`;
          const accusedInfo = `${primaryAccused.name || "Unknown"}${primaryAccused.fatherName ? ` s/o ${primaryAccused.fatherName}` : ""}${primaryAccused.address ? `, r/o ${primaryAccused.address}` : ""}${primaryAccused.phone ? ` (Mob: ${primaryAccused.phone})` : ""}`;

          setRows((prev) =>
            prev.map((r) => {
              if (r.id === "row_complainant") return { ...r, cells: [complainantInfo] };
              if (r.id === "row_gist") return { ...r, cells: [found.subject || found.complaintDescription || r.cells[0]] };
              if (r.id === "row_accused") return { ...r, cells: [accusedInfo] };
              if (r.id === "row_findings") {
                return {
                  ...r,
                  cells: [
                    `FINAL REPORT & PROCEEDINGS CONDUCTED: Respected Sir, the preliminary enquiry into Complaint No. ${found.complaintNumber} lodged by ${found.complainantName} was conducted by me. Both parties were joined in enquiry, statements recorded, and spot inspection conducted...\n\nReport is submitted for perusal and orders.`,
                  ],
                };
              }
              return r;
            })
          );

          if (found.assignedEoName || currentUser.name) {
            setOfficerName(`(${found.assignedEoName || currentUser.name})`);
            setOfficerRank(found.assignedEoRank || currentUser.rankDisplay || "Assistant Superintendent of Police");
            setOfficerLocation(found.policeStation || `Headquarters ${districtName}`);
          }
        }
      } catch (err) {
        console.error("Error loading complaint:", err);
      }
    }
    loadComplaint();
  }, [complaintIdParam]);

  // Switch Format Template
  const handleSelectFormat = (formatKey: EnquiryProformaType) => {
    setActiveFormat(formatKey);
    const tmpl = TEMPLATE_PRESETS[formatKey];
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

  const handleSaveToComplaint = async () => {
    if (!complaint?.id) return;
    setSaveLoading(true);
    try {
      const data = getProformaData();
      const reportHtml = generateHaryanaPoliceProformaHtml(data);
      const docText = documentRef.current?.innerText || "";
      const reportTitle = `${title} - ${complaint.complaintNumber}`;

      await ComplaintService.addComplaintReport(complaint.id, {
        title: reportTitle,
        reportType: activeFormat,
        reportTypeLabel: TEMPLATE_PRESETS[activeFormat]?.name || "Enquiry Report",
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
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      console.error("Failed to save report to complaint:", err);
      alert("Error saving report. Please try again.");
    } finally {
      setSaveLoading(false);
    }
  };

  const isMultiCol = columns.length > 0;

  return (
    <div className="space-y-5 animate-in fade-in-50 pb-20">
      {/* ================= 1. TOP HEADER & WORKSPACE TOOLBAR (NO-PRINT) ================= */}
      <div className="no-print space-y-3">
        {/* Navigation & Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                Official Police Enquiry Report &amp; NCR Proforma (Exact Format)
              </span>
              {complaint && (
                <span className="text-[11px] font-bold font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {complaint.complaintNumber}
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-[#0b192c] tracking-tight mt-1 flex items-center gap-2">
              <Shield className="w-6 h-6 text-red-600" />
              <span>Police Enquiry Report &amp; NCR Drafts</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Direct in-place legal proforma editor: Customize all columns, rows, headers, and borders freely.
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
                  <span>Enquiry Workspace</span>
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
                    <span>Report Saved!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{saveLoading ? "Saving..." : "Save to Complaint"}</span>
                  </>
                )}
              </Button>
            )}

            {/* Upload Document to Draft Button */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".pdf,.png,.jpg,.jpeg,.webp,.txt"
              className="hidden"
            />
            <Button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadLoading}
              variant="outline"
              size="sm"
              className="text-xs font-bold text-indigo-700 bg-indigo-50/80 hover:bg-indigo-100 hover:text-indigo-900 border-indigo-300 flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              {uploadLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                  <span>Reading Document (OCR)...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Upload Document (AI OCR)</span>
                </>
              )}
            </Button>

            <Button
              onClick={handleDownloadReport}
              variant="outline"
              size="sm"
              className="text-xs font-semibold text-slate-700 hover:text-slate-950 flex items-center gap-1.5 border-slate-300 shadow-2xs"
            >
              <Download className="w-4 h-4 text-blue-700" />
              <span>Download (.html)</span>
            </Button>

            <Button
              onClick={handleCopyReport}
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

        {/* Format Selector Bar */}
        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-red-600" />
              Select Police Proforma Format:
            </span>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 font-medium">Dictation:</span>
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded border border-slate-200">
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
              <button
                type="button"
                onClick={() => handleSelectFormat(activeFormat)}
                className="px-2 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded text-xs font-semibold flex items-center gap-1"
                title="Reset this format to standard template"
              >
                <RotateCcw className="w-3 h-3 text-slate-500" />
                <span>Reset Proforma</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {(Object.keys(TEMPLATE_PRESETS) as EnquiryProformaType[]).map((fmtKey) => {
              const tmpl = TEMPLATE_PRESETS[fmtKey];
              const Icon = tmpl.icon;
              const isActive = activeFormat === fmtKey;
              return (
                <button
                  key={fmtKey}
                  type="button"
                  onClick={() => handleSelectFormat(fmtKey)}
                  className={`px-3 py-2.5 rounded-lg text-xs font-bold transition-all flex items-start gap-2.5 border text-left cursor-pointer ${
                    isActive
                      ? "bg-[#0b192c] text-white border-[#0b192c] shadow-xs"
                      : "bg-slate-50/80 text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-950"
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${isActive ? "text-amber-400" : "text-slate-600"}`} />
                  <div>
                    <div className="font-bold leading-tight">{tmpl.name}</div>
                    <div className={`text-[10px] mt-0.5 ${isActive ? "text-slate-300" : "text-slate-500"}`}>
                      {tmpl.badge}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

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

        {/* Bottom Floating Save Action if complaint linked */}
        {complaint && (
          <div className="no-print p-4 bg-white border border-slate-200 rounded-xl shadow-md flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-600" />
              <div>
                <p className="text-xs font-bold text-slate-900">
                  Ready to link this report to Complaint {complaint.complaintNumber}?
                </p>
                <p className="text-[11px] text-slate-500">
                  Click save to persist this drafted report directly into the complaint profile &ldquo;Reports&rdquo; docket.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link href={`/complaints/${complaint.id}`}>
                <Button variant="outline" size="sm" className="text-xs cursor-pointer">
                  Cancel &amp; Return
                </Button>
              </Link>
              <Button
                onClick={handleSaveToComplaint}
                disabled={saveLoading}
                variant="primary"
                size="sm"
                className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 cursor-pointer"
              >
                {saveSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <span>Saved to Docket!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{saveLoading ? "Saving..." : "Save Report to Complaint"}</span>
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
