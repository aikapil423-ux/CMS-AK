"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Shield,
  UserCheck,
  Calendar,
  Clock,
  Phone,
  MapPin,
  User,
  Paperclip,
  FileText,
  Plus,
  Send,
  CheckCircle,
  CheckCircle2,
  Check,
  AlertTriangle,
  Printer,
  Sparkles,
  Link2,
  History as HistoryIcon,
  Scale,
  X,
  UploadCloud,
  Eye,
  RefreshCw,
  Lock,
  Trash2,
  Download,
  Edit3,
  ShieldAlert,
  ArrowRight,
  ScrollText,
  ChevronDown,
  FileCheck2,
  Copy,
  TrendingUp,
  BookOpen,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { firService } from "@/services/firService";
import {
  FIRItem,
  FIRCaseDiaryItem,
  FIRDocumentItem,
  ComplaintReportItem,
  FIRTimelineEvent,
  ConfidentialDossierItem,
} from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge, PriorityBadge } from "@/components/ui/badge";
import { LoadingSkeleton } from "@/components/ui/state-views";
import { MOCK_ENQUIRY_OFFICERS } from "@/lib/mockData";
import { formatDate } from "@/lib/utils";
import { FIRReceiptModal } from "@/components/fir/FIRReceiptModal";
import { FIRSummaryTab } from "@/components/fir/FIRSummaryTab";

type ActiveTab =
  | "overview"
  | "case_diaries"
  | "documents"
  | "summary"
  | "reports"
  | "history"
  | "confidential_dossier";

const FIR_DOC_TEMPLATES = [
  {
    key: "notice_35_3",
    label: "1. Notice of Appearance (Sec 35(3) BNSS)",
    desc: "Mandatory statutory appearance notice to accused with non-arrest assurance",
    icon: FileText,
  },
  {
    key: "summons_179",
    label: "2. Witness Summons (Sec 179 BNSS)",
    desc: "Order requiring attendance of witnesses acquainted with circumstances of case",
    icon: ScrollText,
  },
  {
    key: "site_plan",
    label: "3. Site Plan / Naksha Mauka (मौका नक्शा)",
    desc: "Detailed inspection sketch with physical boundaries, north pointer and points of interest",
    icon: MapPin,
  },
  {
    key: "seizure_memo",
    label: "4. Seizure Memo / Fard Zabti (फ़र्द जब्ती)",
    desc: "Recovery & seizure memo of weapons, contraband, or stolen property with punch witnesses",
    icon: Shield,
  },
  {
    key: "zimni_extract",
    label: "5. Case Diary Zimni Extract (Sec 175 BNSS)",
    desc: "Official daily docket extract of investigation actions certified by IO",
    icon: BookOpen,
  },
];

const FIR_REPORT_OPTIONS = [
  {
    key: "CHARGESHEET",
    label: "1. Final Report / Chargesheet (दोषारोप पत्र)",
    desc: "Police Report u/s 193 BNSS with prima facie evidence for trial",
    icon: Scale,
    badgeBg: "bg-red-50 text-red-800 border-red-300",
  },
  {
    key: "CLOSURE",
    label: "2. Closure Report / Cancellation (खारिजी रिपोर्ट)",
    desc: "Grounds for closure due to lack of evidence, mistake of fact, or compromise",
    icon: FileText,
    badgeBg: "bg-amber-50 text-amber-800 border-amber-300",
  },
  {
    key: "UNTRACED",
    label: "3. Untraced Report (अदम सुराग)",
    desc: "Investigation report when culprits/stolen property remain untraced",
    icon: ShieldAlert,
    badgeBg: "bg-blue-50 text-blue-800 border-blue-300",
  },
  {
    key: "PROGRESS",
    label: "4. Supervisory Progress Report (केस प्रगति रिपोर्ट)",
    desc: "Periodic progress submission for SHO / DSP / SP review",
    icon: Sparkles,
    badgeBg: "bg-purple-50 text-purple-800 border-purple-300",
  },
  {
    key: "ABATED",
    label: "5. Abated Final Report (अभियुक्त की मृत्यु)",
    desc: "Proceedings abated due to demise of sole accused person",
    icon: CheckCircle2,
    badgeBg: "bg-slate-50 text-slate-800 border-slate-300",
  },
];

export default function FIRProfilePage() {
  const params = useParams();
  const router = useRouter();
  const firId = params?.id as string;
  const { currentUser } = useAuth();

  const [fir, setFir] = useState<FIRItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");

  // Statutory Receipt Modal
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  // IO Assignment Modal
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedIoId, setSelectedIoId] = useState("");
  const [assignedDirections, setAssignmentDirections] = useState("");
  const [assignmentSubmitting, setAssignmentSubmitting] = useState(false);

  // Add Case Diary (Zimni) Modal
  const [isZimniModalOpen, setIsZimniModalOpen] = useState(false);
  const [zimniSummary, setZimniSummary] = useState("");
  const [zimniDetails, setZimniDetails] = useState("");
  const [zimniSubmitting, setZimniSubmitting] = useState(false);

  // Add Document Modal
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [docTitle, setDocTitle] = useState("");
  const [docCategory, setDocCategory] = useState("FIELD_REPORT");
  const [docFileName, setDocFileName] = useState("");

  // Document actions states
  const [generateDocDropdownOpen, setGenerateDocDropdownOpen] = useState(false);
  const generateDocDropdownRef = useRef<HTMLDivElement | null>(null);
  const [docPreviewItem, setDocPreviewItem] = useState<FIRDocumentItem | null>(null);

  // Report actions states
  const [generateReportDropdownOpen, setGenerateReportDropdownOpen] = useState(false);
  const generateReportDropdownRef = useRef<HTMLDivElement | null>(null);
  const [uploadReportModalOpen, setUploadReportModalOpen] = useState(false);
  const [reportPreviewItem, setReportPreviewItem] = useState<ComplaintReportItem | null>(null);
  const [reportDraftModalOpen, setReportDraftModalOpen] = useState(false);
  const [activeDraftReport, setActiveDraftReport] = useState<ComplaintReportItem | null>(null);
  const [reportDraftTitle, setReportDraftTitle] = useState("");
  const [reportDraftType, setReportDraftType] = useState<string>("CHARGESHEET");
  const [reportDraftDispatchNo, setReportDraftDispatchNo] = useState("");
  const [reportDraftContent, setReportDraftContent] = useState("");
  const [uploadReportTitle, setUploadReportTitle] = useState("");
  const [uploadReportType, setUploadReportType] = useState("CHARGESHEET");
  const [uploadReportDispatch, setUploadReportDispatch] = useState("");
  const [uploadReportRemarks, setUploadReportRemarks] = useState("");
  const [uploadReportOutcome, setUploadReportOutcome] = useState("Complete");

  // Final Form (Chargesheet/Closure) Modal
  const [isFinalFormModalOpen, setIsFinalFormModalOpen] = useState(false);
  const [finalFormType, setFinalFormType] = useState<"CHARGESHEET" | "CLOSURE" | "UNTRACED">("CHARGESHEET");
  const [courtName, setCourtName] = useState("Court of CJM, Gurugram");
  const [finalFormSummary, setFinalFormSummary] = useState("");
  const [finalFormSubmitting, setFinalFormSubmitting] = useState(false);

  const isSho = currentUser.role === "SHO" || currentUser.id === "usr_sho_1";
  const isSuperior =
    currentUser.role === "DSP_SUBDIV" ||
    currentUser.role === "SP_DISTRICT" ||
    currentUser.role === "SUPER_ADMIN";
  const isMhc = currentUser.role === "MHC_GD_INCHARGE" || currentUser.role === "DUTY_OFFICER";
  const isIo = currentUser.role === "ENQUIRY_OFFICER" || (!isSho && !isMhc && !isSuperior);

  const fetchFir = () => {
    if (!firId) return;
    setLoading(true);
    try {
      const item = firService.getFirById(firId);
      if (item) {
        setFir(item);
        setSelectedIoId(item.assignedIoId || "");
        setAssignmentDirections(item.assignedDirections || "");
      }
    } catch (e) {
      console.error("Error loading FIR:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFir();
    const unsub = firService.subscribe(() => {
      fetchFir();
    });
    return unsub;
  }, [firId]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        generateDocDropdownRef.current &&
        !generateDocDropdownRef.current.contains(e.target as Node)
      ) {
        setGenerateDocDropdownOpen(false);
      }
      if (
        generateReportDropdownRef.current &&
        !generateReportDropdownRef.current.contains(e.target as Node)
      ) {
        setGenerateReportDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleConfirmAssign = () => {
    if (!fir || !selectedIoId) return;
    const selectedOfficer = MOCK_ENQUIRY_OFFICERS.find((eo) => eo.id === selectedIoId);
    if (!selectedOfficer) return;

    setAssignmentSubmitting(true);
    try {
      firService.assignIo(
        fir.id,
        selectedOfficer.id,
        selectedOfficer.name,
        selectedOfficer.rank,
        assignedDirections,
        currentUser.name
      );
      setIsAssignModalOpen(false);
      fetchFir();
    } catch (err) {
      console.error("Failed to assign IO:", err);
    } finally {
      setAssignmentSubmitting(false);
    }
  };

  const handleAddZimni = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fir || !zimniSummary.trim() || !zimniDetails.trim()) return;

    setZimniSubmitting(true);
    try {
      const now = new Date();
      const nextNum = (fir.caseDiaries?.length || 0) + 1;
      const note: FIRCaseDiaryItem = {
        id: `cd-${Date.now()}`,
        date: now.toISOString().split("T")[0],
        time: now.toTimeString().slice(0, 5),
        officer: currentUser.name || "Investigating Officer",
        officerRole: "INVESTIGATING_OFFICER",
        summary: `Zimni No. ${nextNum}: ${zimniSummary}`,
        details: zimniDetails,
        isAutoGenerated: false,
      };

      firService.addCaseDiary(fir.id, note);
      firService.addAuditRecord(
        fir.id,
        "CASE_DIARY_RECORDED",
        `Recorded Zimni No. ${nextNum}: ${zimniSummary}`,
        currentUser.name
      );

      setZimniSummary("");
      setZimniDetails("");
      setIsZimniModalOpen(false);
      fetchFir();
    } catch (err) {
      console.error("Error recording Zimni:", err);
    } finally {
      setZimniSubmitting(false);
    }
  };

  const handleAddDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fir || !docTitle.trim()) return;

    const newDoc: FIRDocumentItem = {
      id: `doc-${Date.now()}`,
      title: docTitle,
      fileName: docFileName || `${docTitle.toLowerCase().replace(/\s+/g, "_")}.pdf`,
      category: docCategory as any,
      uploadedBy: currentUser.name || "Officer",
      uploadedAt: new Date().toISOString().replace("T", " ").slice(0, 16),
    };

    firService.addDocument(fir.id, newDoc);
    setDocTitle("");
    setDocFileName("");
    setIsDocModalOpen(false);
    fetchFir();
  };

  const handleSubmitFinalForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fir || !finalFormSummary.trim()) return;

    setFinalFormSubmitting(true);
    try {
      firService.submitFinalForm(
        fir.id,
        finalFormType,
        courtName,
        currentUser.name || "IO",
        finalFormSummary
      );
      firService.addAuditRecord(
        fir.id,
        "FINAL_FORM_SUBMITTED",
        `Filed ${finalFormType} report for submission before ${courtName}`,
        currentUser.name
      );
      setIsFinalFormModalOpen(false);
      fetchFir();
    } catch (err) {
      console.error("Failed to submit final form:", err);
    } finally {
      setFinalFormSubmitting(false);
    }
  };

  const displayReports = useMemo<ComplaintReportItem[]>(() => {
    if (!fir) return [];
    const list = [...(fir.reports || [])];
    if (fir.finalFormType && !list.some((r) => r.reportType === fir.finalFormType)) {
      list.unshift({
        id: `final-form-${fir.id}`,
        complaintId: fir.id,
        title: `${
          fir.finalFormType === "CHARGESHEET"
            ? "Police Final Chargesheet (दोषारोप पत्र)"
            : fir.finalFormType === "CLOSURE"
            ? "Final Closure Report (खारिजी रिपोर्ट)"
            : "Final Untraced Report (अदम सुराग)"
        } u/s 193 BNSS`,
        reportType: fir.finalFormType,
        reportTypeLabel: `${fir.finalFormType} FILED`,
        dispatchNo: fir.finalFormNumber || `DISP/${fir.firYear || 2026}/${fir.firNumber}`,
        generatedDate: fir.finalFormDate || fir.updatedAt?.slice(0, 10) || fir.createdAt.slice(0, 10),
        officerName: fir.assignedIoName || "Investigating Officer",
        officerRank: fir.assignedIoRank || "IO",
        conclusionSummary:
          fir.finalFormSummary || `Statutory Police Report filed before ${fir.courtName || "Court of CJM"}.`,
        content: `POLICE FINAL REPORT UNDER SECTION 193 BNSS, 2023\nCourt: ${
          fir.courtName || "Court of CJM"
        }\nFIR No: ${fir.firNumber} | Police Station: ${fir.policeStation}\nSections: ${
          fir.actsAndSections
        }\n\nSummary of Findings:\n${
          fir.finalFormSummary || "Final form submitted on conclusion of investigation."
        }`,
        status: "Saved in Complaint",
        versionNumber: 1,
        createdAt: fir.finalFormDate || fir.createdAt,
      });
    }
    return list;
  }, [fir]);

  const handleGenerateDocumentTemplate = (templateKey: string) => {
    if (!fir) return;
    setGenerateDocDropdownOpen(false);

    let title = "Document";
    let category = "OTHER";
    let content = "";

    switch (templateKey) {
      case "notice_35_3":
        title = `Notice u/s 35(3) BNSS - ${fir.accusedList?.[0]?.name || "Accused"}`;
        category = "FIELD_REPORT";
        content = `HARYANA POLICE\nNOTICE OF APPEARANCE UNDER SECTION 35(3) BNSS, 2023\n\nTo,\n${
          fir.accusedList?.[0]?.name || "Accused Person"
        }\nAddress: ${fir.accusedList?.[0]?.address || fir.incidentPlace}\n\nRe: FIR No. ${
          fir.firNumber
        } u/s ${fir.actsAndSections} PS ${fir.policeStation}\n\nTake notice that your presence is required for examination in relation to the investigation of above-noted FIR. You are directed to join investigation at Police Station ${
          fir.policeStation
        } within 7 days from receipt of this notice.\n\nInvestigating Officer: ${
          fir.assignedIoName || currentUser.name
        }\nRank: ${fir.assignedIoRank || currentUser.rankDisplay || "IO"}`;
        break;
      case "summons_179":
        title = `Witness Summons u/s 179 BNSS - ${fir.complainantName}`;
        category = "WITNESS_STATEMENT";
        content = `HARYANA POLICE\nSUMMONS TO WITNESS UNDER SECTION 179 BNSS, 2023\n\nTo,\n${
          fir.complainantName
        }\nAddress: ${fir.complainantAddress || fir.incidentPlace}\n\nWhereas information has been laid that an offence under ${
          fir.actsAndSections
        } has been committed. You appear to be acquainted with circumstances of the case.\n\nYou are hereby summoned to appear before the undersigned at Police Station ${
          fir.policeStation
        } to state relevant facts.\n\nIO: ${fir.assignedIoName || currentUser.name}`;
        break;
      case "site_plan":
        title = `Site Plan / Naksha Mauka - ${fir.incidentPlace}`;
        category = "FIELD_REPORT";
        content = `HARYANA POLICE\nSITE INSPECTION PLAN / NAKSHA MAUKA\n\nFIR No: ${fir.firNumber} | PS: ${
          fir.policeStation
        }\nPlace of Occurrence: ${fir.incidentPlace}\nLandmark: ${fir.incidentLandmark || "Not specified"}\n\nBOUNDARIES:\nNorth: Public Road / Open street\nSouth: Residential / Commercial structure\nEast: Main thoroughfare\nWest: Vacant plot / passage\n\nInspection Officer: ${
          fir.assignedIoName || currentUser.name
        }\nWitnesses Present: Local residents examined on spot.`;
        break;
      case "seizure_memo":
        title = `Seizure Memo / Fard Zabti - ${fir.firNumber}`;
        category = "SEIZURE_MEMO";
        content = `HARYANA POLICE\nSEIZURE MEMO / FARD ZABTI (RECOVERY UNDER BNSS)\n\nFIR No: ${
          fir.firNumber
        }\nDate of Seizure: ${new Date().toLocaleDateString("en-IN")}\nPlace of Seizure: ${
          fir.incidentPlace
        }\n\nArticles Recovered & Seized:\n1. Material evidence related to ${
          fir.actsAndSections
        }.\n2. Sealed in tamper-evident police parcel bearing station stamp.\n\nWitnesses to Seizure:\n1. Independent Witness #1\n2. Independent Witness #2\n\nInvestigating Officer: ${
          fir.assignedIoName || currentUser.name
        }`;
        break;
      case "zimni_extract":
        title = `Case Diary Zimni Extract (Zimni #${(fir.caseDiaries?.length || 0) + 1})`;
        category = "FIELD_REPORT";
        content = `CASE DIARY EXTRACT (SECTION 175 BNSS)\nFIR No: ${fir.firNumber} | PS: ${
          fir.policeStation
        }\nDate: ${new Date().toLocaleDateString("en-IN")}\n\nRecord of Day-to-Day Investigation:\n1. Investigation taken up by IO.\n2. Evidentiary material inspected and placed on docket.\n3. Case diaries maintained chronologically as mandated by law.\n\nSigned by IO: ${
          fir.assignedIoName || currentUser.name
        }`;
        break;
    }

    const newDoc: FIRDocumentItem = {
      id: `doc-${Date.now()}`,
      title,
      fileName: `${title.toLowerCase().replace(/[^a-z0-9]/g, "_")}.pdf`,
      category,
      uploadedBy: currentUser.name || "IO",
      uploadedAt: new Date().toISOString().replace("T", " ").slice(0, 16),
      fileSize: "18.4 KB",
      dataUrl: `data:text/plain;charset=utf-8,${encodeURIComponent(content)}`,
    };

    firService.addDocument(fir.id, newDoc);
    fetchFir();
    setDocPreviewItem(newDoc);
  };

  const handleDownloadDocument = (doc: FIRDocumentItem) => {
    if (doc.dataUrl) {
      const link = document.createElement("a");
      link.href = doc.dataUrl;
      link.download = doc.fileName || `${doc.title}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const content = `HARYANA POLICE\nFIR No: ${fir?.firNumber || ""}\nDocument: ${
        doc.title
      }\nDate: ${new Date().toLocaleDateString(
        "en-IN"
      )}\n\nThis is an authentic certified evidentiary record attached to the case docket.`;
      const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = doc.fileName || `${doc.title.replace(/\s+/g, "_")}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const handleDeleteDocument = (docId: string) => {
    if (!fir) return;
    if (confirm("Are you sure you want to delete this document from the FIR docket?")) {
      firService.deleteDocument(fir.id, docId);
      fetchFir();
    }
  };

  const handleOpenGenerateReportDraft = (typeKey: string) => {
    if (!fir) return;
    setGenerateReportDropdownOpen(false);

    let title = "";
    const repType = typeKey;
    const dispatchNo = `DISP/${fir.firYear || 2026}/${fir.firNumber.replace(/[^0-9]/g, "").slice(-4) || "001"}/${typeKey}`;
    let content = "";

    switch (typeKey) {
      case "CHARGESHEET":
        title = `Final Police Report / Chargesheet (Sec 193 BNSS) - ${fir.firNumber}`;
        content = `POLICE REPORT / CHARGESHEET UNDER SECTION 193 BNSS, 2023\nIN THE COURT OF CHIEF JUDICIAL MAGISTRATE\n\n1. FIR No: ${
          fir.firNumber
        } Dated: ${fir.firDate}\n2. Police Station: ${fir.policeStation}, District: ${fir.district}\n3. Complainant: ${
          fir.complainantName
        }\n4. Accused: ${
          fir.accusedList?.map((a, i) => `${i + 1}. ${a.name} s/o ${a.fatherName || "N/A"}`).join(", ") ||
          "Named accused"
        }\n5. Acts & Sections: ${fir.actsAndSections}\n\nBRIEF FACTS & INVESTIGATION FINDINGS:\nInvestigation in this case was conducted under Section 173/175 BNSS. Spot inspection was carried out and site plan prepared. Statements of witnesses recorded under Section 180 BNSS. Sufficient prima facie oral and documentary evidence has been gathered substantiating the offence under ${
          fir.actsAndSections
        }.\n\nPRAYER:\nAccused person(s) may be summoned and put on trial in accordance with law.\n\nInvestigating Officer: ${
          fir.assignedIoName || currentUser.name
        }\nForwarded by SHO: PS ${fir.policeStation}`;
        break;
      case "CLOSURE":
        title = `Cancellation / Closure Report (Sec 193 BNSS) - ${fir.firNumber}`;
        content = `CLOSURE REPORT / CANCELLATION UNDER SECTION 193 BNSS, 2023\nIN THE COURT OF CHIEF JUDICIAL MAGISTRATE\n\n1. FIR No: ${
          fir.firNumber
        } Dated: ${fir.firDate}\n2. Police Station: ${fir.policeStation}\n3. Complainant: ${
          fir.complainantName
        }\n4. Offence: ${
          fir.actsAndSections
        }\n\nGROUNDS FOR CLOSURE:\nDuring comprehensive investigation, the allegations made in the FIR were thoroughly verified. Spot inspection and examination of independent witnesses reveal that the dispute is civil/private in nature and no cognizable criminal offence is substantiated against the named persons.\n\nPRAYER:\nThe Hon'ble Court is requested to accept this Closure/Cancellation report and discharge the proceedings.\n\nInvestigating Officer: ${
          fir.assignedIoName || currentUser.name
        }`;
        break;
      case "UNTRACED":
        title = `Untraced Report (अदम सुराग) - ${fir.firNumber}`;
        content = `FINAL UNTRACED REPORT UNDER SECTION 193 BNSS, 2023\nIN THE COURT OF CHIEF JUDICIAL MAGISTRATE\n\n1. FIR No: ${
          fir.firNumber
        }\n2. Police Station: ${fir.policeStation}\n3. Complainant: ${
          fir.complainantName
        }\n\nREASONS FOR UNTRACED STATUS:\nAll possible efforts, informant inquiries, surveillance checks and technical evidence analysis were exhausted to trace the perpetrators and stolen property. Despite best efforts, no clue could be traced. If any clue surfaces in the future, investigation will be reopened.\n\nSubmitted by IO: ${
          fir.assignedIoName || currentUser.name
        }`;
        break;
      case "PROGRESS":
        title = `Supervisory Progress Report - ${fir.firNumber}`;
        content = `SUPERVISORY INVESTIGATION PROGRESS REPORT\nSUBMITTED TO: Station House Officer / Sub-Divisional DSP\n\nFIR No: ${
          fir.firNumber
        }\nSections: ${fir.actsAndSections}\n\nINVESTIGATION MILESTONES COMPLETED:\n- Registration and spot inspection\n- Case Diary Zimnis: ${
          fir.caseDiaries?.length || 0
        } recorded\n- Evidentiary attachments: ${
          fir.documents?.length || 0
        } gathered\n\nPENDING STEPS & ACTION PLAN:\n- FSL / Scientific analysis report awaited\n- Arrest of absconding accused\n\nSubmitted by: ${
          fir.assignedIoName || currentUser.name
        }`;
        break;
      case "ABATED":
        title = `Abated Final Report (Death of Accused) - ${fir.firNumber}`;
        content = `FINAL REPORT - ABATED PROCEEDINGS (SECTION 193 BNSS)\nIN THE COURT OF CHIEF JUDICIAL MAGISTRATE\n\nFIR No: ${
          fir.firNumber
        }\nSections: ${fir.actsAndSections}\n\nGROUNDS:\nThe sole accused named in the FIR has expired during the pendency of investigation. Death certificate verified and placed on record. Criminal proceedings stand abated by operation of law.\n\nSubmitted by: ${
          fir.assignedIoName || currentUser.name
        }`;
        break;
    }

    setActiveDraftReport(null);
    setReportDraftTitle(title);
    setReportDraftType(repType);
    setReportDraftDispatchNo(dispatchNo);
    setReportDraftContent(content);
    setReportDraftModalOpen(true);
  };

  const handleEditReport = (report: ComplaintReportItem) => {
    setActiveDraftReport(report);
    setReportDraftTitle(report.title);
    setReportDraftType(report.reportType || "CHARGESHEET");
    setReportDraftDispatchNo(report.dispatchNo || "");
    setReportDraftContent(report.content || report.conclusionSummary || "");
    setReportDraftModalOpen(true);
  };

  const handleSaveReportDraft = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fir || !reportDraftTitle.trim()) return;

    if (activeDraftReport) {
      const updatedReports = (fir.reports || []).map((r) =>
        r.id === activeDraftReport.id
          ? {
              ...r,
              title: reportDraftTitle,
              reportType: reportDraftType,
              reportTypeLabel: reportDraftType,
              dispatchNo: reportDraftDispatchNo,
              content: reportDraftContent,
              conclusionSummary: reportDraftContent.slice(0, 180) + "...",
              updatedAt: new Date().toISOString(),
            }
          : r
      );
      firService.updateFir(fir.id, { reports: updatedReports });
    } else {
      const newReport: ComplaintReportItem = {
        id: `rep-${Date.now()}`,
        complaintId: fir.id,
        title: reportDraftTitle,
        reportType: reportDraftType,
        reportTypeLabel: reportDraftType,
        dispatchNo: reportDraftDispatchNo,
        generatedDate: new Date().toISOString().slice(0, 10),
        officerName: fir.assignedIoName || currentUser.name || "IO",
        officerRank: fir.assignedIoRank || currentUser.rankDisplay || "IO",
        conclusionSummary: reportDraftContent.slice(0, 180) + "...",
        content: reportDraftContent,
        fileFormat: "PDF",
        fileSize: "24.5 KB",
        status: "Saved in Complaint",
        versionNumber: 1,
        createdAt: new Date().toISOString(),
      };
      firService.addReport(fir.id, newReport);
    }

    setReportDraftModalOpen(false);
    setActiveDraftReport(null);
    fetchFir();
  };

  const handleDownloadReport = (report: ComplaintReportItem) => {
    if (report.dataUrl && !report.dataUrl.startsWith("data:text/html")) {
      const link = document.createElement("a");
      link.href = report.dataUrl;
      link.download = report.fileName || `${report.title}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const html = report.contentHtml || report.content || report.conclusionSummary || "";
      const blob = new Blob([html], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = report.fileName || `${(report.dispatchNo || "POLICE_REPORT").replace(/[\/\\?%*:|"<>]/g, "_")}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const handlePrintReport = (report: ComplaintReportItem) => {
    const printWindow = window.open("", "_blank", "width=900,height=800");
    if (!printWindow) {
      alert("Please allow popups to print report.");
      return;
    }
    const html =
      report.contentHtml ||
      `
      <div style="font-family: Arial, sans-serif; padding: 25px; line-height: 1.6;">
        <div style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 20px;">
          <h2 style="margin: 0; text-transform: uppercase;">Haryana Police</h2>
          <h3 style="margin: 5px 0; color: #333;">${report.title}</h3>
          <p style="margin: 0; font-size: 12px; font-family: monospace;">Dispatch: ${
            report.dispatchNo || "N/A"
          } • Date: ${formatDate(report.generatedDate)}</p>
          <p style="margin: 0; font-size: 12px;">FIR No: ${fir?.firNumber || ""} • PS: ${
            fir?.policeStation || ""
          }</p>
        </div>
        <div style="white-space: pre-wrap; font-size: 14px;">${
          report.content || report.conclusionSummary || ""
        }</div>
      </div>
    `;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${report.title}</title>
          <style>@media print { body { margin: 15mm; } @page { size: A4; margin: 15mm; } }</style>
        </head>
        <body>${html}<script>window.onload = function() { window.print(); window.onafterprint = function() { window.close(); }; };</script></body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleCreateNewVersion = (report: ComplaintReportItem) => {
    if (!fir) return;
    const currentVer = report.versionNumber || 1;
    const newVer = currentVer + 1;
    const newReport: ComplaintReportItem = {
      ...report,
      id: `rep-${Date.now()}`,
      title: `${report.title.replace(/\s*\(v\d+\)/, "")} (v${newVer})`,
      versionNumber: newVer,
      status: "Draft",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sentToSho: false,
    };
    firService.addReport(fir.id, newReport);
    fetchFir();
    handleEditReport(newReport);
  };

  const handleSendReportToSupervisory = (report: ComplaintReportItem) => {
    if (!fir) return;
    const updatedReports = (fir.reports || []).map((r) =>
      r.id === report.id ? { ...r, sentToSho: true, status: "Finalized" as const } : r
    );
    firService.updateFir(fir.id, { reports: updatedReports });
    firService.addAuditRecord(
      fir.id,
      "REPORT_FORWARDED",
      `Submitted report "${report.title}" to Supervisory Officer / SP for review`,
      currentUser.name
    );
    fetchFir();
  };

  const handleDeleteReport = (reportId: string) => {
    if (!fir) return;
    if (confirm("Are you sure you want to delete this report from the docket?")) {
      firService.deleteReport(fir.id, reportId);
      fetchFir();
    }
  };

  const handleUploadReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fir || !uploadReportTitle.trim()) return;

    const newReport: ComplaintReportItem = {
      id: `rep-${Date.now()}`,
      complaintId: fir.id,
      title: uploadReportTitle,
      reportType: uploadReportType,
      reportTypeLabel: uploadReportType,
      dispatchNo: uploadReportDispatch || `DISP/${fir.firYear || 2026}/${Date.now().toString().slice(-4)}`,
      generatedDate: new Date().toISOString().slice(0, 10),
      officerName: currentUser.name || "IO",
      officerRank: currentUser.rankDisplay || "IO",
      conclusionSummary: uploadReportRemarks || "Signed police report uploaded to case docket.",
      isUploaded: true,
      fileFormat: "PDF",
      fileSize: "1.2 MB",
      status: "Saved in Complaint",
      versionNumber: 1,
      createdAt: new Date().toISOString(),
    };

    firService.addReport(fir.id, newReport);
    firService.addAuditRecord(
      fir.id,
      "REPORT_UPLOADED",
      `Uploaded signed report: ${uploadReportTitle}`,
      currentUser.name
    );
    setUploadReportTitle("");
    setUploadReportDispatch("");
    setUploadReportRemarks("");
    setUploadReportModalOpen(false);
    fetchFir();
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-10 space-y-4">
        <LoadingSkeleton count={4} />
      </div>
    );
  }

  if (!fir) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <Scale className="w-12 h-12 text-slate-300 mx-auto" />
        <h2 className="text-xl font-bold text-slate-800">FIR Record Not Found</h2>
        <p className="text-xs text-slate-500">
          The requested First Information Report could not be located in the register.
        </p>
        <Link href="/fir">
          <Button variant="outline" size="sm" className="text-xs">
            Return to FIR Register
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16 animate-in fade-in-50">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <Link href="/fir">
            <Button
              variant="ghost"
              size="sm"
              className="h-9 w-9 p-0 text-slate-500 hover:text-slate-800"
              title="Back to FIR Register"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xl font-black text-red-900">
                {fir.firNumber}
              </span>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                  fir.status === "UNDER_INVESTIGATION"
                    ? "bg-amber-50 text-amber-800 border-amber-200"
                    : fir.status === "CHARGESHEET_FILED"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : fir.status === "CLOSURE_REPORT_FILED"
                    ? "bg-blue-50 text-blue-800 border-blue-200"
                    : "bg-slate-100 text-slate-800 border-slate-200"
                }`}
              >
                {fir.mainStatus || fir.status.replace(/_/g, " ")}
              </span>
              <span className="text-xs font-mono px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-slate-600">
                {fir.cctnsFirNumber || "CCTNS LOCAL"}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Registered on {fir.firDate} at {fir.firTime || "10:00"} hrs • {fir.policeStation}, {fir.district}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Statutory Print Modal Button */}
          <Button
            size="sm"
            onClick={() => setIsReceiptOpen(true)}
            className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs gap-1.5 shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Statutory FIR Copy
          </Button>

          {/* Assign / Reassign IO */}
          {(isSho || isSuperior) && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsAssignModalOpen(true)}
              className="border-slate-300 text-slate-700 font-bold text-xs gap-1.5"
            >
              <UserCheck className="w-3.5 h-3.5 text-blue-600" />
              {fir.assignedIoId ? "Reassign IO" : "Assign IO"}
            </Button>
          )}

          {/* Submit Final Form */}
          {fir.status === "UNDER_INVESTIGATION" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsFinalFormModalOpen(true)}
              className="border-emerald-300 text-emerald-800 font-bold text-xs gap-1.5 hover:bg-emerald-50"
            >
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              File Final Report (Sec 193 BNSS)
            </Button>
          )}
        </div>
      </div>

      {/* Linked Source Complaint Banner (Reciprocal Connection) */}
      {fir.sourceComplaintNumber && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700">
              <Link2 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-blue-900">
                Connected Origin Complaint: #{fir.sourceComplaintNumber}
              </p>
              <p className="text-[11px] text-blue-700">
                Registered pursuant to SHO recommendation on Complaint docket.
              </p>
            </div>
          </div>
          <Link href={`/complaints/${fir.sourceComplaintId || ""}`}>
            <Button size="sm" variant="outline" className="border-blue-300 text-blue-800 text-xs font-bold gap-1 bg-white hover:bg-blue-100">
              Open Complaint Profile
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto pb-1">
        {[
          { key: "overview", label: "Overview & Facts", icon: FileText },
          { key: "case_diaries", label: `Case Diaries / Zimni (${fir.caseDiaries?.length || 0})`, icon: ScrollText },
          { key: "documents", label: `Documents (${fir.documents?.length || 0})`, icon: Paperclip },
          { key: "summary", label: "Investigation Summary", icon: Sparkles },
          { key: "reports", label: "Final Form / Reports", icon: Scale },
          { key: "history", label: "Timeline & Audit", icon: HistoryIcon },
          { key: "confidential_dossier", label: "Confidential Dossier", icon: Lock },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as ActiveTab)}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg transition-all shrink-0 ${
                isActive
                  ? "bg-[#0b192c] text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT */}

      {/* 1. OVERVIEW TAB */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Acts & Sections Card */}
          <Card className="border-red-200 shadow-xs bg-red-50/30">
            <CardContent className="p-4 flex items-start gap-3">
              <Scale className="w-5 h-5 text-red-700 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-red-800">
                  Statutory Offence Charged
                </span>
                <h3 className="text-sm font-black text-red-950 font-mono">
                  {fir.actsAndSections}
                </h3>
                <p className="text-xs text-red-800">
                  Major Act: {fir.majorAct || "Bharatiya Nyaya Sanhita, 2023"} • Classification: {fir.categoryDisplay || fir.category}
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Complainant Particulars */}
            <Card className="border-slate-200 shadow-xs bg-white">
              <div className="p-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-purple-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Complainant / Informant
                  </h3>
                </div>
              </div>
              <CardContent className="p-4 space-y-2 text-xs">
                <div>
                  <span className="text-slate-500 font-semibold">Name:</span>{" "}
                  <strong className="text-slate-900">{fir.complainantName}</strong>
                  {fir.complainantFatherSpouse && (
                    <span className="text-slate-600"> (S/o, W/o {fir.complainantFatherSpouse})</span>
                  )}
                </div>
                <div>
                  <span className="text-slate-500 font-semibold">Gender / Age:</span>{" "}
                  <span>{fir.complainantGender} / {fir.complainantAge || "Adult"} yrs</span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold">Contact:</span>{" "}
                  <span className="font-mono">{fir.complainantMobile || "—"}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold">Address:</span>{" "}
                  <span>{fir.complainantAddress}, {fir.complainantCity}, {fir.complainantDistrict}</span>
                </div>
              </CardContent>
            </Card>

            {/* Investigating Officer */}
            <Card className="border-slate-200 shadow-xs bg-white">
              <div className="p-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-blue-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Investigating Officer (IO)
                  </h3>
                </div>
                {(isSho || isSuperior) && (
                  <button
                    onClick={() => setIsAssignModalOpen(true)}
                    className="text-[11px] text-blue-600 font-bold hover:underline"
                  >
                    Change IO
                  </button>
                )}
              </div>
              <CardContent className="p-4 space-y-2 text-xs">
                {fir.assignedIoName ? (
                  <>
                    <div>
                      <span className="text-slate-500 font-semibold">Assigned Officer:</span>{" "}
                      <strong className="text-slate-900">{fir.assignedIoName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 font-semibold">Rank &amp; Belt:</span>{" "}
                      <span>{fir.assignedIoRank || "IO"} ({fir.assignedIoBeltNumber || "—"})</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-semibold">Phone:</span>{" "}
                      <span className="font-mono">{fir.assignedIoPhone || "—"}</span>
                    </div>
                    {fir.assignedDirections && (
                      <div className="p-2 bg-blue-50 border border-blue-200 rounded text-blue-900 mt-2">
                        <span className="font-bold block">SHO Directions:</span>
                        {fir.assignedDirections}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-4 text-slate-500">
                    <p>No Investigating Officer assigned yet.</p>
                    {(isSho || isSuperior) && (
                      <Button
                        size="sm"
                        onClick={() => setIsAssignModalOpen(true)}
                        className="mt-2 text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold"
                      >
                        Assign IO Now
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Occurrence Place & Time */}
          <Card className="border-slate-200 shadow-xs bg-white">
            <div className="p-4 border-b border-slate-100 bg-slate-50/60 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Occurrence of Offence
              </h3>
            </div>
            <CardContent className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-500 font-semibold block">Date &amp; Time</span>
                <strong className="text-slate-900">
                  {fir.incidentDateFrom} {fir.incidentTimeFrom || ""}
                </strong>
                {fir.incidentDateTo && (
                  <span className="text-slate-500 block text-[11px]">to {fir.incidentDateTo} {fir.incidentTimeTo || ""}</span>
                )}
              </div>
              <div className="md:col-span-2">
                <span className="text-slate-500 font-semibold block">Place of Occurrence</span>
                <strong className="text-slate-900">{fir.incidentPlace}</strong>
                {fir.incidentLandmark && (
                  <span className="text-slate-500 block text-[11px]">Landmark: {fir.incidentLandmark}</span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Accused Persons */}
          <Card className="border-slate-200 shadow-xs bg-white">
            <div className="p-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Accused Details
                </h3>
              </div>
              <span className="text-xs font-bold text-slate-500">
                {fir.accusedList?.length || 0} Listed
              </span>
            </div>
            <CardContent className="p-4 space-y-2 text-xs">
              {fir.accusedList && fir.accusedList.length > 0 ? (
                fir.accusedList.map((acc, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="font-bold text-slate-900">
                      {idx + 1}. {acc.name} {acc.fatherName ? `(S/o ${acc.fatherName})` : ""}
                    </div>
                    {acc.address && <p className="text-slate-600 mt-0.5">Address: {acc.address}</p>}
                    {acc.physicalDescription && (
                      <p className="text-slate-500 mt-0.5 text-[11px]">Description: {acc.physicalDescription}</p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-slate-500 italic">No accused persons specified.</p>
              )}
            </CardContent>
          </Card>

          {/* FIR Substance / Tehreer Content */}
          <Card className="border-slate-200 shadow-xs bg-white">
            <div className="p-4 border-b border-slate-100 bg-slate-50/60 flex items-center gap-2">
              <FileText className="w-4 h-4 text-red-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Contents of FIR / Tehreer (First Information Substance)
              </h3>
            </div>
            <CardContent className="p-5 text-xs font-serif leading-relaxed text-slate-900 whitespace-pre-wrap">
              {fir.incidentDetails}
            </CardContent>
          </Card>
        </div>
      )}

      {/* 2. CASE DIARIES / ZIMNI TAB */}
      {activeTab === "case_diaries" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Statutory Case Diaries (Zimni under Section 175 BNSS)
              </h3>
              <p className="text-xs text-slate-500">
                Day-to-day chronological record of investigation, witness examinations, and spot visits.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => setIsZimniModalOpen(true)}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Zimni Entry
            </Button>
          </div>

          <div className="space-y-3">
            {fir.caseDiaries && fir.caseDiaries.length > 0 ? (
              fir.caseDiaries.map((cd, idx) => (
                <Card key={cd.id || idx} className="border-slate-200 shadow-xs bg-white">
                  <CardContent className="p-4 space-y-2 text-xs">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold px-2 py-0.5 bg-amber-100 text-amber-900 rounded text-[11px]">
                          Zimni #{fir.caseDiaries!.length - idx}
                        </span>
                        <strong className="text-slate-900">{cd.summary}</strong>
                      </div>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {cd.date} at {cd.time} • {cd.officer}
                      </span>
                    </div>
                    <p className="text-slate-700 whitespace-pre-wrap leading-relaxed font-serif pt-1">
                      {cd.details}
                    </p>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-300 rounded-xl">
                <ScrollText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700">No Case Diaries Recorded Yet</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Click &apos;Add Zimni Entry&apos; to record the first step of investigation.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. DOCUMENTS TAB */}
      {activeTab === "documents" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <span>Case Files, Memos &amp; Evidentiary Documents</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Seizure memos, site plans, Section 180 BNSS witness statements, and medico-legal reports.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Generate Document Dropdown */}
              <div className="relative" ref={generateDocDropdownRef}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setGenerateDocDropdownOpen(!generateDocDropdownOpen)}
                  className="gap-1.5 text-xs font-semibold border-purple-200 text-purple-900 bg-purple-50/70 hover:bg-purple-100 cursor-pointer shadow-2xs"
                  title="Generate statutory notice or crime memo"
                >
                  <ScrollText className="w-3.5 h-3.5 text-purple-700" />
                  <span>Generate Document</span>
                  <ChevronDown
                    className={`w-3 h-3 text-purple-600 transition-transform duration-200 ${
                      generateDocDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </Button>

                {generateDocDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-84 bg-white rounded-xl shadow-xl border border-slate-200 p-1.5 z-40 animate-in fade-in-50 zoom-in-95">
                    <div className="px-3 py-2 border-b border-slate-100">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-purple-800">
                        Select Statutory Document Template
                      </p>
                      <p className="text-[10px] text-slate-500">
                        Preloaded with FIR #{fir.firNumber}
                      </p>
                    </div>
                    <div className="py-1">
                      {FIR_DOC_TEMPLATES.map((tmpl) => {
                        const IconComponent = tmpl.icon;
                        return (
                          <button
                            key={tmpl.key}
                            type="button"
                            onClick={() => handleGenerateDocumentTemplate(tmpl.key)}
                            className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-purple-50 hover:text-purple-900 transition-colors flex items-center gap-2.5 group cursor-pointer"
                          >
                            <div className="p-1.5 rounded-md bg-purple-50 text-purple-700 group-hover:bg-purple-100 shrink-0">
                              <IconComponent className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-slate-800 group-hover:text-purple-950 truncate">
                                {tmpl.label}
                              </p>
                              <p className="text-[10px] text-slate-400 group-hover:text-purple-700 truncate">
                                {tmpl.desc}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Upload Document Button */}
              <Button
                size="sm"
                onClick={() => setIsDocModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs gap-1.5 shadow-sm cursor-pointer"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Upload Document</span>
              </Button>
            </div>
          </div>

          {fir.documents && fir.documents.length > 0 ? (
            <Card className="border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Document / File Name</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Uploaded By</th>
                      <th className="py-3 px-4">Date &amp; Time</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {fir.documents.map((doc) => (
                      <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                              <FileText className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="truncate font-bold text-slate-900" title={doc.title}>
                                {doc.title}
                              </p>
                              <p className="text-[11px] text-slate-500 font-mono truncate" title={doc.fileName}>
                                {doc.fileName}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            {doc.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-700">{doc.uploadedBy}</td>
                        <td className="py-3 px-4 text-slate-500 font-mono">
                          {doc.uploadedAt}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Preview */}
                            <button
                              type="button"
                              onClick={() => setDocPreviewItem(doc)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
                              title="Instant Preview without downloading"
                            >
                              <Eye className="w-3.5 h-3.5 text-blue-600" />
                              <span>Preview</span>
                            </button>

                            {/* Download */}
                            <button
                              type="button"
                              onClick={() => handleDownloadDocument(doc)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 rounded-lg text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
                              title="Download file"
                            >
                              <Download className="w-3.5 h-3.5 text-slate-600" />
                              <span>Download</span>
                            </button>

                            {/* Delete */}
                            <button
                              type="button"
                              onClick={() => handleDeleteDocument(doc.id)}
                              className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors inline-flex items-center cursor-pointer"
                              title="Delete document"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : (
            <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-300 rounded-xl space-y-3">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">No Evidentiary Documents Attached</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Upload Tehreer copy, site plans, seizure memos or witness statements.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDocModalOpen(true)}
                className="gap-1.5 text-xs font-semibold cursor-pointer"
              >
                <UploadCloud className="w-3.5 h-3.5 text-blue-600" />
                <span>Upload Document</span>
              </Button>
            </div>
          )}
        </div>
      )}

      {/* 4. SUMMARY TAB */}
      {activeTab === "summary" && (
        <FIRSummaryTab
          fir={fir}
          currentUser={currentUser}
          onUpdateFir={(updated) => {
            setFir(updated);
            firService.updateFir(updated.id, updated);
          }}
        />
      )}

      {/* 5. REPORTS TAB (Official Reports Docket) */}
      {activeTab === "reports" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-emerald-600" />
                <span>Police Reports &amp; Final Form Docket (Section 193 BNSS)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Statutory chargesheet drafts, closure petitions, untraced reports, and periodic supervisory evaluations.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Upload Report Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setUploadReportModalOpen(true)}
                className="gap-1.5 text-xs font-semibold border-slate-300 text-slate-800 bg-slate-50 hover:bg-slate-100 cursor-pointer shadow-2xs"
              >
                <UploadCloud className="w-3.5 h-3.5 text-emerald-600" />
                <span>Upload Report</span>
              </Button>

              {/* Generate Report Split-Dropdown */}
              <div className="relative" ref={generateReportDropdownRef}>
                <div className="inline-flex rounded-lg shadow-xs">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleOpenGenerateReportDraft("CHARGESHEET")}
                    className="gap-1.5 text-xs font-bold bg-[#0b192c] hover:bg-slate-900 text-white rounded-r-none cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Generate Report</span>
                  </Button>
                  <button
                    type="button"
                    onClick={() => setGenerateReportDropdownOpen(!generateReportDropdownOpen)}
                    className="px-2 py-1.5 bg-[#0b192c] hover:bg-slate-900 text-white border-l border-slate-700 rounded-r-lg transition-colors cursor-pointer"
                    title="Select Report Type"
                  >
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-amber-300 transition-transform duration-200 ${
                        generateReportDropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                </div>

                {generateReportDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-slate-200 p-2 z-40 animate-in fade-in-50 zoom-in-95">
                    <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
                      <div>
                        <p className="text-[11px] font-black uppercase tracking-wider text-amber-800 flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                          <span>Select Statutory Report (5 Types)</span>
                        </p>
                        <p className="text-[10px] text-slate-500">
                          Preloaded with FIR #{fir.firNumber}
                        </p>
                      </div>
                      <span className="text-[10px] font-mono bg-amber-50 text-amber-900 px-1.5 py-0.5 rounded border border-amber-200">
                        Auto Draft
                      </span>
                    </div>
                    <div className="py-1.5 space-y-1">
                      {FIR_REPORT_OPTIONS.map((cat) => {
                        const IconComponent = cat.icon;
                        return (
                          <button
                            key={cat.key}
                            type="button"
                            onClick={() => handleOpenGenerateReportDraft(cat.key)}
                            className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-amber-50/80 transition-colors flex items-center gap-2.5 group cursor-pointer border border-transparent hover:border-amber-200"
                          >
                            <div className="p-2 rounded-lg bg-slate-100 text-slate-700 group-hover:bg-amber-100 group-hover:text-amber-800 shrink-0">
                              <IconComponent className="w-4 h-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between">
                                <p className="font-bold text-slate-800 group-hover:text-amber-950 truncate">
                                  {cat.label}
                                </p>
                                <span className="text-[10px] font-mono text-slate-400 group-hover:text-amber-700 font-semibold">
                                  BNSS 193
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-500 group-hover:text-amber-800 truncate">
                                {cat.desc}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Prepare Final Report Button */}
              <Button
                size="sm"
                onClick={() => setIsFinalFormModalOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 shadow-sm cursor-pointer"
              >
                <Scale className="w-3.5 h-3.5" />
                <span>Prepare Final Report</span>
              </Button>
            </div>
          </div>

          {/* Reports List */}
          {displayReports && displayReports.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {displayReports.map((report) => {
                const isDraftStatus = report.status === "Draft";
                return (
                  <Card key={report.id} className="border-slate-200 shadow-xs hover:shadow-md transition-shadow bg-white">
                    <CardContent className="p-4 space-y-3 text-xs">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {/* Type Badge */}
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-300 font-mono flex items-center gap-1">
                              ⚖️ {report.reportTypeLabel || report.reportType}
                            </span>

                            {/* Version Number */}
                            {report.versionNumber && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-300 font-mono">
                                v{report.versionNumber}
                              </span>
                            )}

                            {/* Status Badge */}
                            {report.sentToSho ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-900 border border-blue-300 font-mono flex items-center gap-1">
                                <Send className="w-3 h-3 text-blue-600" />
                                <span>Sent to SP / Supervisory</span>
                              </span>
                            ) : isDraftStatus ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 font-mono">
                                Status: Draft
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300 font-mono flex items-center gap-1">
                                <CheckCircle className="w-3 h-3 text-emerald-600" />
                                <span>Saved in Case</span>
                              </span>
                            )}

                            {report.isUploaded && (
                              <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200">
                                Uploaded File
                              </span>
                            )}
                          </div>

                          <h4 className="font-bold text-sm text-slate-900 truncate">
                            {report.title}
                          </h4>
                          {report.dispatchNo && (
                            <p className="font-mono text-[11px] text-slate-500">
                              Dispatch: <strong className="text-slate-800">{report.dispatchNo}</strong>
                            </p>
                          )}
                        </div>

                        <span className="text-[11px] text-slate-400 font-mono shrink-0">
                          {formatDate(report.generatedDate || report.createdAt || new Date().toISOString())}
                        </span>
                      </div>

                      {report.conclusionSummary && (
                        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-sans line-clamp-2">
                          <span className="font-bold text-slate-900">Findings: </span>
                          {report.conclusionSummary}
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                        <span>
                          Created By: <strong className="text-slate-800">{report.officerName || report.createdBy || "IO"}</strong> ({report.officerRank || "IO"})
                        </span>
                        <span className="font-mono uppercase font-semibold">
                          {report.fileFormat || "PDF"} {report.fileSize ? `• ${report.fileSize}` : ""}
                        </span>
                      </div>

                      {/* Action buttons: View, Edit, Download, Print, New Version, Send to Supervisory */}
                      <div className="pt-1 flex flex-wrap items-center justify-end gap-1.5">
                        {/* 1. View / Preview */}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setReportPreviewItem(report)}
                          className="text-[11px] h-7 px-2.5 gap-1 border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
                          title="View report details"
                        >
                          <Eye className="w-3 h-3 text-blue-600" />
                          <span>View</span>
                        </Button>

                        {/* 2. Edit */}
                        {!report.isUploaded && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditReport(report)}
                            className="text-[11px] h-7 px-2.5 gap-1 border-slate-200 text-amber-800 bg-amber-50/50 hover:bg-amber-100 cursor-pointer font-semibold"
                            title="Edit this report"
                          >
                            <Edit3 className="w-3 h-3 text-amber-600" />
                            <span>Edit</span>
                          </Button>
                        )}

                        {/* 3. Download */}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadReport(report)}
                          className="text-[11px] h-7 px-2.5 gap-1 border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
                          title="Download report file"
                        >
                          <Download className="w-3 h-3 text-emerald-600" />
                          <span>Download</span>
                        </Button>

                        {/* 4. Print */}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handlePrintReport(report)}
                          className="text-[11px] h-7 px-2.5 gap-1 border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
                          title="Print official report"
                        >
                          <Printer className="w-3 h-3 text-blue-600" />
                          <span>Print</span>
                        </Button>

                        {/* 5. Create New Version */}
                        {!report.isUploaded && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleCreateNewVersion(report)}
                            className="text-[11px] h-7 px-2.5 gap-1 border-purple-200 bg-purple-50 text-purple-800 hover:bg-purple-100 cursor-pointer font-semibold"
                            title="Create new version based on this report"
                          >
                            <Plus className="w-3 h-3 text-purple-600" />
                            <span>New Version</span>
                          </Button>
                        )}

                        {/* 6. Send to Supervisory Officer / SP */}
                        {!report.sentToSho && (
                          <Button
                            type="button"
                            variant="primary"
                            size="sm"
                            onClick={() => handleSendReportToSupervisory(report)}
                            className="text-[11px] h-7 px-2.5 gap-1 bg-red-600 hover:bg-red-700 text-white font-bold cursor-pointer shadow-xs"
                            title="Send this Report to Supervisory Officer / SP for Review & Approval"
                          >
                            <Send className="w-3 h-3" />
                            <span>Send to SP</span>
                          </Button>
                        )}
                        {report.sentToSho && (
                          <span className="text-[10px] font-bold px-2 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1 font-mono">
                            <Check className="w-3 h-3 text-blue-600" />
                            <span>Sent to SP</span>
                          </span>
                        )}

                        {/* 7. Delete */}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteReport(report.id)}
                          className="text-slate-400 hover:text-red-600 h-7 w-7 p-0 cursor-pointer"
                          title="Delete report"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-300 rounded-xl space-y-3">
              <Scale className="w-8 h-8 text-slate-400 mx-auto" />
              <div>
                <p className="text-xs font-bold text-slate-700">Investigation In Progress</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  When investigation concludes, the IO will file the Final Report (Chargesheet or Closure) under Sec 193 BNSS.
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 pt-2">
                <Button
                  size="sm"
                  onClick={() => handleOpenGenerateReportDraft("CHARGESHEET")}
                  className="bg-[#0b192c] hover:bg-slate-900 text-white font-bold text-xs gap-1.5 shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Draft Chargesheet</span>
                </Button>
                <Button
                  size="sm"
                  onClick={() => setIsFinalFormModalOpen(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 shadow-sm"
                >
                  <Scale className="w-3.5 h-3.5" />
                  <span>Prepare Final Report</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 6. HISTORY & AUDIT TAB */}
      {activeTab === "history" && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900">
            Chronological Investigation Timeline &amp; Audit Trail
          </h3>
          <div className="space-y-3">
            {fir.timeline && fir.timeline.length > 0 ? (
              fir.timeline.map((evt) => (
                <div
                  key={evt.id}
                  className="p-3 bg-white border border-slate-200 rounded-lg flex items-start gap-3 text-xs"
                >
                  <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <strong className="text-slate-900">{evt.title}</strong>
                      <span className="text-[10px] text-slate-400 font-mono">{evt.date}</span>
                    </div>
                    <p className="text-slate-600 mt-0.5">{evt.description}</p>
                    <span className="text-[10px] text-slate-500 mt-1 inline-block">
                      Action By: {evt.actor}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 italic">No timeline entries recorded.</p>
            )}
          </div>
        </div>
      )}

      {/* 7. CONFIDENTIAL DOSSIER TAB */}
      {activeTab === "confidential_dossier" && (
        <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl space-y-2">
          <Lock className="w-8 h-8 text-slate-400 mx-auto" />
          <h4 className="text-sm font-bold text-slate-800">Restricted Supervisory Dossier</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Classified intelligence notes, CDR call detail analyses, suspect movement logs, and confidential source inputs.
          </p>
        </div>
      )}

      {/* Statutory Receipt Modal */}
      {isReceiptOpen && (
        <FIRReceiptModal
          fir={fir}
          isOpen={isReceiptOpen}
          onClose={() => setIsReceiptOpen(false)}
        />
      )}

      {/* Assign IO Modal */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in-50">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden">
            <div className="p-4 bg-[#0b192c] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm">Assign Investigating Officer (IO)</h3>
              </div>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="text-[11px] font-bold uppercase text-slate-600 block mb-1">
                  Select Investigating Officer (IO) *
                </label>
                <select
                  value={selectedIoId}
                  onChange={(e) => setSelectedIoId(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-red-500/20"
                >
                  <option value="">-- Choose Officer --</option>
                  {MOCK_ENQUIRY_OFFICERS.map((officer) => (
                    <option key={officer.id} value={officer.id}>
                      {officer.name} ({officer.rank} • PNO: {officer.pno})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase text-slate-600 block mb-1">
                  Supervisory Directions (SHO Order)
                </label>
                <textarea
                  rows={3}
                  value={assignedDirections}
                  onChange={(e) => setAssignmentDirections(e.target.value)}
                  placeholder="Directions for IO..."
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-red-500/20"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleConfirmAssign}
                  disabled={!selectedIoId || assignmentSubmitting}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs"
                >
                  {assignmentSubmitting ? "Assigning..." : "Confirm IO Assignment"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Zimni Modal */}
      {isZimniModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in-50">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden">
            <div className="p-4 bg-[#0b192c] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ScrollText className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm">Record Case Diary Entry (Zimni u/s 175 BNSS)</h3>
              </div>
              <button
                onClick={() => setIsZimniModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddZimni} className="p-5 space-y-4">
              <div>
                <label className="text-[11px] font-bold uppercase text-slate-600 block mb-1">
                  Zimni Title / Subject *
                </label>
                <input
                  type="text"
                  value={zimniSummary}
                  onChange={(e) => setZimniSummary(e.target.value)}
                  placeholder="e.g. Crime Scene Inspection and Site Plan"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase text-slate-600 block mb-1">
                  Detailed Zimni Content (हस्व जैल कार्यवाही) *
                </label>
                <textarea
                  rows={5}
                  value={zimniDetails}
                  onChange={(e) => setZimniDetails(e.target.value)}
                  placeholder="Record investigation steps, witness statements, memo preparation, and findings..."
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 font-serif leading-relaxed"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsZimniModalOpen(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={zimniSubmitting}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs"
                >
                  {zimniSubmitting ? "Recording..." : "Save Zimni"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Document Modal */}
      {isDocModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in-50">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden">
            <div className="p-4 bg-[#0b192c] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Paperclip className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-sm">Upload Case Document</h3>
              </div>
              <button
                onClick={() => setIsDocModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddDocument} className="p-5 space-y-4">
              <div>
                <label className="text-[11px] font-bold uppercase text-slate-600 block mb-1">
                  Document Title *
                </label>
                <input
                  type="text"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  placeholder="e.g. Site Plan / Naksha Mauka"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase text-slate-600 block mb-1">
                  Document Category
                </label>
                <select
                  value={docCategory}
                  onChange={(e) => setDocCategory(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white"
                >
                  <option value="FIELD_REPORT">Site Plan / Field Inspection</option>
                  <option value="COMPLAINT_COPY">Original Tehreer / Complaint Copy</option>
                  <option value="WITNESS_STATEMENT">Witness Statement (Sec 180 BNSS)</option>
                  <option value="MEDICAL_REPORT">Medico-Legal Report (MLR)</option>
                  <option value="FORENSIC_REPORT">Forensic / FSL Report</option>
                  <option value="SEIZURE_MEMO">Seizure Memo / Fard Baramadgi</option>
                  <option value="OTHER">Other Evidentiary Record</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase text-slate-600 block mb-1">
                  File Attachment
                </label>
                <input
                  type="file"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setDocFileName(f.name);
                  }}
                  className="w-full text-xs p-2 rounded-lg border border-slate-300"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsDocModalOpen(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
                >
                  Upload Document
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Final Form Modal */}
      {isFinalFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in-50">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden">
            <div className="p-4 bg-[#0b192c] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm">File Police Final Report (u/s 193 BNSS)</h3>
              </div>
              <button
                onClick={() => setIsFinalFormModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitFinalForm} className="p-5 space-y-4">
              <div>
                <label className="text-[11px] font-bold uppercase text-slate-600 block mb-1">
                  Type of Final Disposal *
                </label>
                <select
                  value={finalFormType}
                  onChange={(e) => setFinalFormType(e.target.value as any)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white font-bold"
                >
                  <option value="CHARGESHEET">Chargesheet / Challan (दोषारोप पत्र)</option>
                  <option value="CLOSURE">Closure Report / Cancellation (खारिजी रिपोर्ट)</option>
                  <option value="UNTRACED">Untraced Report (अदम सुराग)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase text-slate-600 block mb-1">
                  Court of Judicial Magistrate *
                </label>
                <input
                  type="text"
                  value={courtName}
                  onChange={(e) => setCourtName(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 font-semibold"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase text-slate-600 block mb-1">
                  Final Findings &amp; Grounds (निष्कर्ष) *
                </label>
                <textarea
                  rows={4}
                  value={finalFormSummary}
                  onChange={(e) => setFinalFormSummary(e.target.value)}
                  placeholder="Record summary of evidence established against accused or grounds for closure..."
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 font-serif leading-relaxed"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsFinalFormModalOpen(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={finalFormSubmitting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                >
                  {finalFormSubmitting ? "Submitting..." : "Submit to Court"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DOCUMENT PREVIEW */}
      {docPreviewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setDocPreviewItem(null)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[90vh] flex flex-col z-10 animate-in fade-in-0 zoom-in-95 overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
              <div className="min-w-0 pr-4">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 font-mono">
                    {docPreviewItem.category}
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    Uploaded by {docPreviewItem.uploadedBy}
                  </span>
                </div>
                <h3 className="font-bold text-sm sm:text-base text-white truncate mt-0.5">
                  {docPreviewItem.title}
                </h3>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 rounded-lg text-xs font-semibold cursor-pointer shadow-2xs transition-colors"
                  title="Print document"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDownloadDocument(docPreviewItem)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-2xs transition-colors"
                  title="Download file"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDocPreviewItem(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4 sm:p-6 bg-slate-100/50 flex items-center justify-center min-h-[350px]">
              {docPreviewItem.dataUrl &&
              (docPreviewItem.dataUrl.startsWith("data:text/plain") ||
                docPreviewItem.dataUrl.startsWith("data:text/html")) ? (
                <div className="w-full max-w-3xl bg-white p-8 rounded-xl border border-slate-300 shadow-sm font-sans text-xs sm:text-sm text-slate-900 leading-relaxed space-y-4">
                  <div className="text-center pb-3 border-b border-slate-300">
                    <h3 className="font-black text-sm tracking-wider uppercase text-slate-900">
                      HARYANA POLICE • INVESTIGATION DOCKET
                    </h3>
                    <p className="text-xs font-bold text-slate-600 uppercase">{docPreviewItem.title}</p>
                    <p className="text-[11px] font-mono text-slate-500">
                      FIR: {fir.firNumber} • PS: {fir.policeStation}
                    </p>
                  </div>
                  <pre className="whitespace-pre-wrap font-sans text-slate-800 leading-relaxed text-xs sm:text-sm">
                    {decodeURIComponent(docPreviewItem.dataUrl.split(",")[1] || "")}
                  </pre>
                </div>
              ) : (
                <div className="text-center p-8 bg-white rounded-2xl border border-slate-200 shadow-sm max-w-md space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center mx-auto">
                    <FileText className="w-7 h-7" />
                  </div>
                  <h4 className="font-bold text-sm text-slate-900">{docPreviewItem.title}</h4>
                  <p className="text-xs text-slate-500 font-mono">{docPreviewItem.fileName}</p>
                  <p className="text-[11px] text-slate-400">
                    Uploaded on {docPreviewItem.uploadedAt} by {docPreviewItem.uploadedBy}
                  </p>
                  <Button
                    size="sm"
                    onClick={() => handleDownloadDocument(docPreviewItem)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download File</span>
                  </Button>
                </div>
              )}
            </div>

            <div className="p-3 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
              <span>Date: {docPreviewItem.uploadedAt} • Category: {docPreviewItem.category}</span>
              <Button variant="outline" size="sm" onClick={() => setDocPreviewItem(null)}>
                Close Preview
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: REPORT PREVIEW */}
      {reportPreviewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setReportPreviewItem(null)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[90vh] flex flex-col z-10 animate-in fade-in-0 zoom-in-95 overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
              <div className="min-w-0 pr-4">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                    {reportPreviewItem.reportTypeLabel || reportPreviewItem.reportType}
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    {reportPreviewItem.dispatchNo || "DISP/2026/FIR"}
                  </span>
                </div>
                <h3 className="font-bold text-sm sm:text-base text-white truncate mt-0.5">
                  {reportPreviewItem.title}
                </h3>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handlePrintReport(reportPreviewItem)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 rounded-lg text-xs font-semibold cursor-pointer shadow-2xs transition-colors"
                  title="Print authentic legal report"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print A4</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDownloadReport(reportPreviewItem)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-2xs transition-colors"
                  title="Download report file"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>

                <button
                  type="button"
                  onClick={() => setReportPreviewItem(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4 sm:p-6 bg-slate-100/50 flex items-center justify-center min-h-[400px]">
              <div className="w-full max-w-3xl bg-white p-8 rounded-xl border border-slate-300 shadow-sm font-sans text-xs sm:text-sm text-slate-900 leading-relaxed space-y-4">
                <div className="text-center pb-3 border-b-2 border-slate-900">
                  <div className="inline-block px-3 py-1 bg-slate-900 text-white font-mono font-bold text-[10px] rounded uppercase mb-1">
                    State Police Department • State of Haryana
                  </div>
                  <h3 className="font-black text-base tracking-wider uppercase text-slate-900">
                    HARYANA POLICE
                  </h3>
                  <p className="text-xs font-bold text-slate-700 uppercase">{reportPreviewItem.title}</p>
                  <div className="flex items-center justify-center gap-4 text-[11px] font-mono text-slate-500 mt-1">
                    <span>Dispatch No: {reportPreviewItem.dispatchNo || "N/A"}</span>
                    <span>•</span>
                    <span>Date: {formatDate(reportPreviewItem.generatedDate)}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 font-semibold mt-1">
                    FIR No: {fir.firNumber} | Police Station: {fir.policeStation} | District: {fir.district}
                  </p>
                </div>

                <div className="whitespace-pre-wrap text-slate-800 leading-relaxed font-sans pt-2">
                  {reportPreviewItem.content || reportPreviewItem.conclusionSummary || "Statutory report drafted for judicial submission."}
                </div>

                <div className="pt-8 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
                  <div>
                    <p className="font-bold text-slate-800">Station House Officer</p>
                    <p className="text-[11px] text-slate-500">Police Station {fir.policeStation}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-800">
                      {reportPreviewItem.officerName || fir.assignedIoName || "Investigating Officer"}
                    </p>
                    <p className="text-[11px] text-slate-500 font-mono">
                      {reportPreviewItem.officerRank || "IO / SI"} • CMS Verified
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
              <span>Date: {formatDate(reportPreviewItem.generatedDate)} • Officer: {reportPreviewItem.officerName}</span>
              <Button variant="outline" size="sm" onClick={() => setReportPreviewItem(null)}>
                Close Preview
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: UPLOAD SIGNED REPORT */}
      {uploadReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setUploadReportModalOpen(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-5 z-10 animate-in fade-in-0 zoom-in-95 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-emerald-600" />
                <span>Upload Signed Police Report</span>
              </h3>
              <button
                onClick={() => setUploadReportModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadReportSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Report Title *</label>
                <input
                  type="text"
                  required
                  value={uploadReportTitle}
                  onChange={(e) => setUploadReportTitle(e.target.value)}
                  placeholder="e.g. Signed Final Chargesheet u/s 193 BNSS / Closure Report"
                  className="w-full rounded-lg border border-slate-300 p-2 text-slate-900 bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Report Type</label>
                  <select
                    value={uploadReportType}
                    onChange={(e) => setUploadReportType(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2 text-slate-900 bg-white"
                  >
                    <option value="CHARGESHEET">Final Form / Chargesheet</option>
                    <option value="CLOSURE">Closure Report / Cancellation</option>
                    <option value="UNTRACED">Untraced Report</option>
                    <option value="PROGRESS">Interim Progress Report</option>
                    <option value="ABATED">Abated Report</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Dispatch / Ref No.</label>
                  <input
                    type="text"
                    value={uploadReportDispatch}
                    onChange={(e) => setUploadReportDispatch(e.target.value)}
                    placeholder={`e.g. DISP/${fir.firYear || 2026}/REP-01`}
                    className="w-full rounded-lg border border-slate-300 p-2 text-slate-900 bg-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Upload Signed Document (PDF, Word, Scan) *
                </label>
                <input
                  type="file"
                  required
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Findings / Conclusion Summary
                </label>
                <textarea
                  rows={2}
                  value={uploadReportRemarks}
                  onChange={(e) => setUploadReportRemarks(e.target.value)}
                  placeholder="Summary of investigation findings, statutory prayer or grounds..."
                  className="w-full rounded-lg border border-slate-300 p-2 text-slate-900 bg-white"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1.5">
                  Investigation Status Outcome <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setUploadReportOutcome("Complete")}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                      uploadReportOutcome === "Complete"
                        ? "border-emerald-500 bg-emerald-50/80 ring-2 ring-emerald-500/20"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-emerald-950">1. Complete</span>
                      {uploadReportOutcome === "Complete" && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      )}
                    </div>
                    <p className="text-[10px] text-slate-600 leading-tight">
                      Investigation completed. Ready for court submission.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setUploadReportOutcome("Pending")}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                      uploadReportOutcome === "Pending"
                        ? "border-amber-500 bg-amber-50/80 ring-2 ring-amber-500/20"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-amber-950">2. Interim</span>
                      {uploadReportOutcome === "Pending" && (
                        <CheckCircle2 className="w-4 h-4 text-amber-600" />
                      )}
                    </div>
                    <p className="text-[10px] text-slate-600 leading-tight">
                      Interim progress report. Investigation ongoing.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setUploadReportOutcome("Chargesheet")}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                      uploadReportOutcome === "Chargesheet"
                        ? "border-red-500 bg-red-50/80 ring-2 ring-red-500/20"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-red-950">3. Chargesheet</span>
                      {uploadReportOutcome === "Chargesheet" && (
                        <CheckCircle2 className="w-4 h-4 text-red-600" />
                      )}
                    </div>
                    <p className="text-[10px] text-slate-600 leading-tight">
                      Prima facie case established against accused.
                    </p>
                  </button>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => setUploadReportModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
                >
                  Save Report to Docket
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DRAFT / EDIT REPORT */}
      {reportDraftModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setReportDraftModalOpen(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full p-5 z-10 animate-in fade-in-0 zoom-in-95 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    {activeDraftReport ? "Edit Statutory Report" : "Draft Statutory Police Report"}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Section 193 BNSS statutory disposal draft preloaded with case particulars.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setReportDraftModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveReportDraft} className="space-y-3.5 text-xs flex-1 flex flex-col overflow-hidden">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="font-semibold text-slate-700 block mb-1">Report Title *</label>
                  <input
                    type="text"
                    required
                    value={reportDraftTitle}
                    onChange={(e) => setReportDraftTitle(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2 font-medium text-slate-900 bg-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Dispatch No.</label>
                  <input
                    type="text"
                    value={reportDraftDispatchNo}
                    onChange={(e) => setReportDraftDispatchNo(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2 font-mono text-slate-900 bg-white"
                  />
                </div>
              </div>

              <div className="flex-1 flex flex-col min-h-[250px]">
                <label className="font-semibold text-slate-700 block mb-1">
                  Report Findings &amp; Statutory Text *
                </label>
                <textarea
                  required
                  rows={12}
                  value={reportDraftContent}
                  onChange={(e) => setReportDraftContent(e.target.value)}
                  className="w-full flex-1 rounded-xl border border-slate-300 p-3 font-mono text-xs text-slate-900 bg-slate-50 leading-relaxed resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                <span className="text-[11px] text-slate-500">
                  You can print or download this report anytime from the Reports docket.
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    onClick={() => setReportDraftModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    type="submit"
                    className="bg-[#0b192c] hover:bg-slate-900 text-white font-bold"
                  >
                    Save Report to Case
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
