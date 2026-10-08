"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Shield,
  UserCheck,
  ChevronDown,
  Calendar,
  Clock,
  Phone,
  MapPin,
  User,
  Paperclip,
  FileText,
  Video,
  Music,
  Image as ImageIcon,
  Plus,
  Send,
  Bell,
  CheckCircle,
  CheckCircle2,
  Check,
  AlertTriangle,
  Printer,
  Sparkles,
  Link2,
  Layers,
  ArrowRightLeft,
  ArrowUpDown,
  History as HistoryIcon,
  FileCheck,
  FileCheck2,
  ScrollText,
  Landmark,
  Home,
  HeartHandshake,
  Laptop,
  HelpCircle,
  BadgeAlert,
  Scale,
  X,
  UploadCloud,
  Eye,
  RefreshCw,
  Mic,
  MicOff,
  Volume2,
  Lock,
  Trash2,
  Download,
  Edit3,
  Table,
  Banknote,
  Handshake,
  ShieldAlert,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { ComplaintService } from "@/services/complaintService";
import {
  ComplaintItem,
  ComplaintEvidenceAttachment,
  EnquiryNoteItem,
  ComplaintDocumentItem,
  ComplaintTimelineEvent,
  OfficerNotification,
  ConfidentialDossierItem,
  ComplaintReportItem,
  EOOutcome,
  getMainComplaintStatus,
} from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge, PriorityBadge } from "@/components/ui/badge";
import { LoadingSkeleton } from "@/components/ui/state-views";
import { MOCK_ENQUIRY_OFFICERS } from "@/lib/mockData";
import { formatDate, formatDateTime } from "@/lib/utils";
import { ComplaintReceiptModal } from "@/components/complaints/ComplaintReceiptModal";
import { ComplaintLegalAssistant } from "@/components/complaints/ComplaintLegalAssistant";
import { ComplaintSummaryTab } from "@/components/complaints/ComplaintSummaryTab";
import { EoSendingToShoModal, EOCategoryOption } from "@/components/complaints/EoSendingToShoModal";
import { ShoApproveCategoryModal, SHOCategoryOption } from "@/components/complaints/ShoApproveCategoryModal";
import {
  RecommendationReportType,
  RECOMMENDATION_OPTIONS_CONFIG,
} from "@/services/recommendationReportService";

type ActiveTab = "overview" | "documents" | "legal_assistant" | "summary" | "links" | "reports" | "history" | "confidential_dossier";

const DIRECTION_TEMPLATES = [
  {
    key: "SPOT_VERIFY",
    label: "Preliminary Spot Verification (BNSS 173(3))",
    text: "Conduct preliminary spot verification & inspect the scene within 48 hours. Record statements of immediate witnesses and local residents.",
    recommendedDays: 7,
  },
  {
    key: "SECTION_35_NOTICE",
    label: "Notice to Accused (Section 35(3) BNSS)",
    text: "Issue formal appearance notice under Section 35(3) BNSS to named suspect(s). Verify defense version and record formal explanation.",
    recommendedDays: 7,
  },
  {
    key: "DIGITAL_CCTV",
    label: "Collect CCTV & Digital Evidence",
    text: "Secure and preserve CCTV camera recordings from the spot, obtain bank transaction statements / UPI references, and preserve mobile communication records.",
    recommendedDays: 5,
  },
  {
    key: "MEDIATION",
    label: "Mediation & Mutual Settlement",
    text: "Convene joint meeting with both parties at Station Helpdesk. Facilitate peaceful mutual settlement or lawful compromise without coercion.",
    recommendedDays: 10,
  },
  {
    key: "MEDICAL_MLR",
    label: "Hospital MLR & Medical Verification",
    text: "Liaise with Government Civil Hospital to obtain formal Medico-Legal Report (MLR). Verify injury severity (simple vs grievous) with medical officer.",
    recommendedDays: 3,
  },
  {
    key: "REVENUE_LAND",
    label: "Revenue Patwari Land Demarcation",
    text: "Coordinate with Halqa Patwari / Tehsildar to inspect Khasra/Khatoni revenue demarcation and determine lawful possession of disputed land.",
    recommendedDays: 14,
  },
  {
    key: "CUSTOM",
    label: "Custom Supervisory Direction...",
    text: "",
    recommendedDays: 14,
  },
];

const DOSSIER_CATEGORY_CONFIG: Record<
  ConfidentialDossierItem["category"],
  { label: string; badgeClass: string; iconText: string }
> = {
  INFORMANT_LEAD: {
    label: "Secret Informant / Mukhbir Lead",
    badgeClass: "bg-red-100 text-red-800 border-red-200",
    iconText: "🕵️",
  },
  FIELD_OBSERVATION: {
    label: "Field Observation / Ground Reality",
    badgeClass: "bg-amber-100 text-amber-800 border-amber-200",
    iconText: "📍",
  },
  OFF_RECORD_STATEMENT: {
    label: "Off-The-Record Statement",
    badgeClass: "bg-purple-100 text-purple-800 border-purple-200",
    iconText: "🤫",
  },
  SUSPECT_INTEL: {
    label: "Suspect Intel / Discrepancy",
    badgeClass: "bg-rose-100 text-rose-800 border-rose-200",
    iconText: "⚠️",
  },
  PERSONAL_REMINDER: {
    label: "EO Strategy & Personal Reminder",
    badgeClass: "bg-blue-100 text-blue-800 border-blue-200",
    iconText: "🧠",
  },
  GENERAL_CONFIDENTIAL: {
    label: "General Confidential Note",
    badgeClass: "bg-slate-100 text-slate-800 border-slate-200",
    iconText: "📝",
  },
};

const TEMPLATE_DROPDOWN_OPTIONS = [
  {
    key: "haryana_notice",
    label: "1. Haryana Police Appearance Notice (Sec 173(3) BNSS)",
    desc: "Appearance notice with video-conferencing option & non-arrest guarantee",
    icon: FileText,
  },
  {
    key: "cdr_requisition",
    label: "2. CDR & Digital Evidence Requisition (Panipat Format)",
    desc: "Call Detail Records, CAF, IMEI & WhatsApp requisition with non-VIP certificate",
    icon: Phone,
  },
  {
    key: "arrest_memo",
    label: "3. Arrest & Surrender Memo Form 26.8(1) & Jama Talashi",
    desc: "Form 26.8(1), Section 47 BNSS grounds, Jama Talashi & identification features",
    icon: Shield,
  },
  {
    key: "natgrid_proforma",
    label: "4. NATGRID Intelligence Requisition Proforma",
    desc: "Inter-agency intelligence query table (Banks, Telecom, Immigration, VAHAN)",
    icon: Layers,
  },
];

const REPORT_DROPDOWN_OPTIONS = [
  {
    key: "GAMINI" as RecommendationReportType,
    label: "1. Gamini",
    desc: "Land & Boundary Demarcation Dispute / राजस्व ज़मीनी विवाद",
    icon: Landmark,
    badgeBg: "bg-amber-50 text-amber-800 border-amber-300",
  },
  {
    key: "DIWANI" as RecommendationReportType,
    label: "2. Diwani",
    desc: "Civil & Monetary Dealing Dispute / दीवानी लेन-देन",
    icon: Banknote,
    badgeBg: "bg-blue-50 text-blue-800 border-blue-300",
  },
  {
    key: "NCR" as RecommendationReportType,
    label: "3. NCR",
    desc: "Non-Cognizable Report u/s 174 BNSS / असंज्ञेय रिपोर्ट",
    icon: FileText,
    badgeBg: "bg-purple-50 text-purple-800 border-purple-300",
  },
  {
    key: "FIR" as RecommendationReportType,
    label: "4. FIR",
    desc: "Cognizable Offence - Regular FIR Recommendation / संज्ञेय अपराध",
    icon: ShieldAlert,
    badgeBg: "bg-red-50 text-red-800 border-red-300",
  },
  {
    key: "NIVARAN" as RecommendationReportType,
    label: "5. Nivaran",
    desc: "Preventive Action u/s 126/170 BNSS & Disposal / निवारक व निस्तारण",
    icon: Shield,
    badgeBg: "bg-indigo-50 text-indigo-800 border-indigo-300",
  },
  {
    key: "RAZINAMA" as RecommendationReportType,
    label: "6. Razinama",
    desc: "Mutual Compromise & Settlement Accord / राजीनामा / आपसी समझौता",
    icon: Handshake,
    badgeBg: "bg-emerald-50 text-emerald-800 border-emerald-300",
  },
];

// Voice Dictation / Audio Input Component for any entry column
function VoiceInputButton({
  onTranscript,
  fieldLabel = "this field",
  className = "",
}: {
  onTranscript: (text: string) => void;
  fieldLabel?: string;
  className?: string;
}) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // ignore
        }
      }
      setIsListening(false);
      return;
    }

    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      const fallbackPrompt = window.prompt(
        `Microphone dictation: Type or dictate text for ${fieldLabel}:`
      );
      if (fallbackPrompt) {
        onTranscript(fallbackPrompt);
      }
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-IN"; // English (India) / Standard Legal

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        if (event.results && event.results[0] && event.results[0][0]) {
          const transcript = event.results[0][0].transcript;
          if (transcript) {
            onTranscript(transcript.trim());
          }
        }
        setIsListening(false);
      };

      recognition.onerror = (err: any) => {
        console.warn("Speech recognition error:", err);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn("Could not start speech recognition:", err);
      setIsListening(false);
    }
  };

  return (
    <button
      type="button"
      onClick={toggleListening}
      title={isListening ? "Listening... Click to stop" : `Voice dictation for ${fieldLabel}`}
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold transition-all select-none cursor-pointer ${
        isListening
          ? "bg-red-500 text-white animate-pulse shadow-xs ring-2 ring-red-300"
          : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
      } ${className}`}
    >
      {isListening ? (
        <>
          <MicOff className="w-3 h-3 text-white" />
          <span>Listening...</span>
        </>
      ) : (
        <>
          <Mic className="w-3 h-3 text-blue-600" />
          <span>Voice</span>
        </>
      )}
    </button>
  );
}

export default function ComplaintProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { currentUser } = useAuth();
  const complaintId = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);

  const [complaint, setComplaint] = useState<ComplaintItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");
  const [historySortOrder, setHistorySortOrder] = useState<"asc" | "desc">("asc");

  // More Actions dropdown state
  const [moreActionsOpen, setMoreActionsOpen] = useState(false);
  const moreActionsRef = useRef<HTMLDivElement>(null);

  // Assign EO Modal state & Quick Assign Dropdown states (No dialogue box, rank & name only)
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignEoDropdownOpen, setAssignEoDropdownOpen] = useState(false);
  const [profileAssignToast, setProfileAssignToast] = useState<{ title: string; message: string } | null>(null);
  const [isQuickAssigning, setIsQuickAssigning] = useState<boolean>(false);
  const [selectedEoId, setSelectedEoId] = useState<string>("eo_1");
  const [directionTemplate, setDirectionTemplate] = useState<string>("SPOT_VERIFY");
  const [assignedDirections, setAssignedDirections] = useState<string>("");
  const [targetDays, setTargetDays] = useState<number>(14);
  const [isAssigning, setIsAssigning] = useState<boolean>(false);
  const [assignSuccess, setAssignSuccess] = useState<boolean>(false);
  const [showReceiptModal, setShowReceiptModal] = useState<boolean>(false);
  const [lastAssignedNotification, setLastAssignedNotification] = useState<OfficerNotification | null>(null);

  // Modals for More Actions
  const [enquiryNoteModalOpen, setEnquiryNoteModalOpen] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState("");
  const [newNoteType, setNewNoteType] = useState<EnquiryNoteItem["noteType"]>("SPOT_VISIT");
  const [newNoteLocation, setNewNoteLocation] = useState("");
  const [noteAttachmentFile, setNoteAttachmentFile] = useState<File | null>(null);
  const [noteAttachmentName, setNoteAttachmentName] = useState("");
  const [noteAttachmentSize, setNoteAttachmentSize] = useState(0);
  const [noteAttachmentCategory, setNoteAttachmentCategory] = useState<ComplaintEvidenceAttachment["category"]>("document");
  const [noteAttachmentDataUrl, setNoteAttachmentDataUrl] = useState<string | undefined>();
  const [previewModalFile, setPreviewModalFile] = useState<{
    name: string;
    category?: string;
    dataUrl?: string;
    size?: number | string;
  } | null>(null);

  // Confidential Dossier State (Strictly EO ID only)
  const [dossierModalOpen, setDossierModalOpen] = useState(false);
  const [dossierModalTab, setDossierModalTab] = useState<"upload" | "note">("upload");
  const [dossierTitle, setDossierTitle] = useState("");
  const [dossierCategory, setDossierCategory] = useState<ConfidentialDossierItem["category"]>("FIELD_OBSERVATION");
  const [dossierContent, setDossierContent] = useState("");
  const [dossierReferenceTag, setDossierReferenceTag] = useState("");
  const [dossierAttachmentName, setDossierAttachmentName] = useState("");
  const [dossierAttachmentDataUrl, setDossierAttachmentDataUrl] = useState<string | undefined>(undefined);
  const [dossierAttachmentType, setDossierAttachmentType] = useState<"audio" | "video" | "document" | "image" | "other">("document");
  const [dossierAttachmentSize, setDossierAttachmentSize] = useState<string>("");
  const [dossierSearch, setDossierSearch] = useState("");
  const [dossierFilterCategory, setDossierFilterCategory] = useState<string>("ALL");
  const [isSavingDossier, setIsSavingDossier] = useState(false);

  // Handler for Enquiry Note file attachment (Any format: video, audio, document, photo)
  const handleNoteFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setNoteAttachmentFile(file);
    setNoteAttachmentName(file.name);
    setNoteAttachmentSize(file.size);

    if (file.type.startsWith("image/")) {
      setNoteAttachmentCategory("image");
    } else if (file.type.startsWith("video/")) {
      setNoteAttachmentCategory("video");
    } else if (file.type.startsWith("audio/")) {
      setNoteAttachmentCategory("audio");
    } else if (file.type.includes("pdf") || file.type.includes("document") || file.type.includes("text")) {
      setNoteAttachmentCategory("document");
    } else {
      setNoteAttachmentCategory("other");
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setNoteAttachmentDataUrl(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const [evidenceModalOpen, setEvidenceModalOpen] = useState(false);
  const [evidenceTitle, setEvidenceTitle] = useState("");
  const [evidenceCategory, setEvidenceCategory] = useState<ComplaintEvidenceAttachment["category"]>("document");
  const [evidenceDesc, setEvidenceDesc] = useState("");
  const [evidenceDataUrl, setEvidenceDataUrl] = useState<string | undefined>();
  const [evidenceFileName, setEvidenceFileName] = useState("");
  const [evidenceFileSize, setEvidenceFileSize] = useState<number>(0);

  const [documentModalOpen, setDocumentModalOpen] = useState(false);
  const [docName, setDocName] = useState("");
  const [docCategory, setDocCategory] = useState("Official Letter / Notice");
  const [docDesc, setDocDesc] = useState("");
  const [docFileName, setDocFileName] = useState("");
  const [docFileSize, setDocFileSize] = useState("");
  const [docFileDataUrl, setDocFileDataUrl] = useState<string | undefined>();

  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [transferStation, setTransferStation] = useState("Civil Lines Police Station");
  const [transferReason, setTransferReason] = useState("");

  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkTargetNumber, setLinkTargetNumber] = useState("");
  const [linkRelationType, setLinkRelationType] = useState("CROSS");

  const [ncrModalOpen, setNcrModalOpen] = useState(false);
  const [ncrNumber, setNcrNumber] = useState("");
  const [ncrSections, setNcrSections] = useState("Section 174 BNSS / 352 BNS");

  const [firModalOpen, setFirModalOpen] = useState(false);
  const [firNumber, setFirNumber] = useState("");
  const [firSections, setFirSections] = useState("Section 115(2), 351(2) BNS");

  const [aiReportModalOpen, setAiReportModalOpen] = useState(false);
  const [aiReportText, setAiReportText] = useState("");
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  // SHO Progress Report Demand Modal State
  const [progressModalOpen, setProgressModalOpen] = useState(false);
  const [progressRemarks, setProgressRemarks] = useState(
    "Conduct spot verification, examine key witnesses, and submit interim enquiry findings with digital evidence within 24 hours."
  );
  const [progressDeadlineHours, setProgressDeadlineHours] = useState(24);
  const [isSubmittingProgress, setIsSubmittingProgress] = useState(false);

  // Report & Template Generator Dropdown States
  const [generateDocDropdownOpen, setGenerateDocDropdownOpen] = useState(false);
  const generateDocDropdownRef = useRef<HTMLDivElement>(null);
  const [generateReportDropdownOpen, setGenerateReportDropdownOpen] = useState(false);
  const generateReportDropdownRef = useRef<HTMLDivElement>(null);
  const handleNavigateToReportDraft = (
    recType: string = "GAMINI",
    reportItem?: ComplaintReportItem | null,
    isNewVersion?: boolean
  ) => {
    if (!complaint) return;
    setGenerateReportDropdownOpen(false);
    let url = `/enquiry-workspace/drafts?complaintId=${encodeURIComponent(complaint.id)}&recommendation=${encodeURIComponent(recType)}`;
    if (reportItem) {
      url += `&reportId=${encodeURIComponent(reportItem.id)}`;
      if (isNewVersion) {
        url += `&newVersion=true`;
      }
    }
    router.push(url);
  };

  const reportIframeRef = useRef<HTMLIFrameElement>(null);
  const [uploadReportModalOpen, setUploadReportModalOpen] = useState(false);
  const [uploadReportOutcome, setUploadReportOutcome] = useState<EOOutcome>("Complete");
  const [uploadReportTitle, setUploadReportTitle] = useState("");
  const [uploadReportCategory, setUploadReportCategory] = useState("Civil / Land Dispute");
  const [uploadReportDispatchNo, setUploadReportDispatchNo] = useState("");
  const [uploadReportOfficer, setUploadReportOfficer] = useState("");
  const [uploadReportRank, setUploadReportRank] = useState("Sub-Inspector");
  const [uploadReportConclusion, setUploadReportConclusion] = useState("");
  const [uploadReportFileName, setUploadReportFileName] = useState("");
  const [uploadReportFileSize, setUploadReportFileSize] = useState("");
  const [uploadReportDataUrl, setUploadReportDataUrl] = useState<string | undefined>();
  const [uploadReportFormat, setUploadReportFormat] = useState("PDF");
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [reportPreviewItem, setReportPreviewItem] = useState<ComplaintReportItem | null>(null);

  // SHO Action States
  const [shoReEnquiryModalOpen, setShoReEnquiryModalOpen] = useState(false);
  const [shoReEnquiryReason, setShoReEnquiryReason] = useState("");
  const [isSubmittingShoReEnquiry, setIsSubmittingShoReEnquiry] = useState(false);
  const [shoRejectModalOpen, setShoRejectModalOpen] = useState(false);
  const [shoRejectReason, setShoRejectReason] = useState("");
  const [isShoRejecting, setIsShoRejecting] = useState(false);
  const [shoApproveRemarks, setShoApproveRemarks] = useState("");
  const [isShoApproving, setIsShoApproving] = useState(false);
  const [shoApproveModalOpen, setShoApproveModalOpen] = useState(false);

  // EO Send to SHO Modal State
  const [eoSendToShoModalOpen, setEoSendToShoModalOpen] = useState(false);
  const [selectedReportForSho, setSelectedReportForSho] = useState<ComplaintReportItem | undefined>(undefined);

  const handleUploadReportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadReportFileName(file.name);
    setUploadReportFileSize(
      file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`
    );
    const ext = file.name.split(".").pop()?.toUpperCase() || "PDF";
    setUploadReportFormat(ext);
    if (!uploadReportTitle) {
      setUploadReportTitle(file.name.replace(/\.[^/.]+$/, ""));
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      setUploadReportDataUrl(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaint) return;
    setIsSubmittingReport(true);
    try {
      await ComplaintService.submitEoReportWithOutcome(
        complaint.id,
        {
          title: uploadReportTitle || uploadReportFileName || "Official Enquiry Report",
          reportType: uploadReportCategory.toLowerCase().replace(/[^a-z0-9]/g, "_"),
          reportTypeLabel: uploadReportCategory,
          dispatchNo: uploadReportDispatchNo || `HP/KKR/CT/${new Date().getFullYear()}/REP-${Date.now().toString().slice(-4)}`,
          generatedDate: new Date().toISOString().split("T")[0],
          officerName: uploadReportOfficer || currentUser.name || "Enquiry Officer",
          officerRank: uploadReportRank || currentUser.rankDisplay || "Sub-Inspector",
          officerPno: currentUser.pno || "PNO-23841",
          conclusionSummary: uploadReportConclusion || "Signed report uploaded to complaint file.",
          fileName: uploadReportFileName,
          fileSize: uploadReportFileSize,
          dataUrl: uploadReportDataUrl,
          fileFormat: uploadReportFormat,
          isUploaded: true,
        },
        uploadReportOutcome,
        currentUser.name || "Enquiry Officer",
        currentUser.rankDisplay,
        currentUser.pno,
        currentUser.role
      );
      await loadComplaint();
      setUploadReportModalOpen(false);
      setUploadReportTitle("");
      setUploadReportFileName("");
      setUploadReportFileSize("");
      setUploadReportDataUrl(undefined);
      setUploadReportConclusion("");
      setUploadReportDispatchNo("");
      setActiveTab("reports");
    } catch (err) {
      console.error("Error uploading report:", err);
      alert("Failed to upload report. Please try again.");
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!complaint) return;
    if (!confirm("Are you sure you want to remove this report from the complaint docket?")) return;
    try {
      await ComplaintService.deleteComplaintReport(complaint.id, reportId);
      await loadComplaint();
    } catch (err) {
      console.error("Error deleting report:", err);
    }
  };

  // Fetch complaint
  const loadComplaint = async () => {
    if (!complaintId) return;
    setLoading(true);
    try {
      const data = await ComplaintService.getComplaintById(complaintId);
      if (data) {
        setComplaint(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComplaint();
  }, [complaintId]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (moreActionsRef.current && !moreActionsRef.current.contains(event.target as Node)) {
        setMoreActionsOpen(false);
      }
      if (generateDocDropdownRef.current && !generateDocDropdownRef.current.contains(event.target as Node)) {
        setGenerateDocDropdownOpen(false);
      }
      if (generateReportDropdownRef.current && !generateReportDropdownRef.current.contains(event.target as Node)) {
        setGenerateReportDropdownOpen(false);
      }
      if (!(event.target as HTMLElement)?.closest?.("[data-assign-eo-dropdown]")) {
        setAssignEoDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const selectedEo = useMemo(() => {
    return MOCK_ENQUIRY_OFFICERS.find((e) => e.id === selectedEoId) || MOCK_ENQUIRY_OFFICERS[0];
  }, [selectedEoId]);

  // Role & Permission Computations
  const isMhc = currentUser.role === "MHC_GD_INCHARGE";
  const isSho = (currentUser.role === "SHO" || currentUser.id === "usr_sho_1" || currentUser.role === "DSP_SUBDIV") && !isMhc;
  const isAssignedEo = Boolean(
    complaint?.assignedEoName && (
      (complaint.assignedEoPno && currentUser.pno === complaint.assignedEoPno) ||
      (complaint.assignedEoId && currentUser.id === complaint.assignedEoId) ||
      (currentUser.role === "ENQUIRY_OFFICER" && (
        currentUser.name.toLowerCase().includes(complaint.assignedEoName.toLowerCase()) ||
        complaint.assignedEoName.toLowerCase().includes(currentUser.name.toLowerCase())
      ))
    )
  );
  const isEoPersona = currentUser.role === "ENQUIRY_OFFICER" || isAssignedEo;
  const isDirectFirCase = Boolean(complaint?.directSendToFir || complaint?.status === "FIR_REGISTER" || complaint?.workflowState === "FIR_REGISTER");
  const isUnassigned = (!complaint?.assignedEoName || complaint?.status === "REGISTERED") && !isDirectFirCase;
  const canAssign = isSho && !isMhc && !isDirectFirCase;
  const canAskProgress = isSho && !isUnassigned && !isDirectFirCase;
  const canModifyCase = isAssignedEo; // Strictly EO only whom complaint is assigned!
  const canUploadDocument = canModifyCase || isSho || currentUser.role === "SUPER_ADMIN" || currentUser.role === "DUTY_OFFICER";

  const filteredDossierEntries = useMemo(() => {
    const list = complaint?.confidentialDossier || [];
    return list.filter((item) => {
      const matchesCategory =
        dossierFilterCategory === "ALL" || item.category === dossierFilterCategory;
      const q = dossierSearch.trim().toLowerCase();
      const matchesSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.content.toLowerCase().includes(q) ||
        (item.referenceTag && item.referenceTag.toLowerCase().includes(q));
      return matchesCategory && matchesSearch;
    });
  }, [complaint?.confidentialDossier, dossierFilterCategory, dossierSearch]);

  // Open Assign EO modal
  const handleOpenAssign = () => {
    if (!complaint) return;
    if (!canAssign) {
      alert("Access Denied: Only SHO or Supervisory Officers can assign or reassign Enquiry Officers.");
      return;
    }
    setAssignSuccess(false);
    setLastAssignedNotification(null);

    let defaultTemplate = "SPOT_VERIFY";
    let defaultEoId = "eo_1";

    if (complaint.category === "LAND_PROPERTY_DISPUTE") {
      defaultTemplate = "REVENUE_LAND";
      defaultEoId = "eo_2";
    } else if (complaint.category === "DOMESTIC_VIOLENCE_DOWRY") {
      defaultTemplate = "MEDIATION";
      defaultEoId = "eo_4";
    } else if (complaint.category === "PHYSICAL_ASSAULT_AFFRAY") {
      defaultTemplate = "MEDICAL_MLR";
      defaultEoId = "eo_1";
    } else if (complaint.category === "CYBER_CRIME" || complaint.category === "FINANCIAL_FRAUD_CHEATING") {
      defaultTemplate = "DIGITAL_CCTV";
      defaultEoId = "eo_1";
    } else {
      defaultEoId = "eo_3";
    }

    const tmpl = DIRECTION_TEMPLATES.find((t) => t.key === defaultTemplate);
    setSelectedEoId(defaultEoId);
    setDirectionTemplate(defaultTemplate);
    setAssignedDirections(tmpl?.text || "");
    setTargetDays(tmpl?.recommendedDays || 14);
    setAssignModalOpen(true);
  };

  const handleTemplateChange = (key: string) => {
    setDirectionTemplate(key);
    const tmpl = DIRECTION_TEMPLATES.find((t) => t.key === key);
    if (tmpl) {
      if (key !== "CUSTOM") {
        setAssignedDirections(tmpl.text);
      }
      setTargetDays(tmpl.recommendedDays);
    }
  };

  const handleConfirmAssign = async () => {
    if (!complaint) return;
    if (!canAssign) {
      alert("Access Denied: Only SHO or Supervisory Officers can assign or reassign Enquiry Officers.");
      return;
    }
    setIsAssigning(true);
    const eo = selectedEo;

    try {
      const result = await ComplaintService.assignEnquiryOfficer(
        complaint.id,
        eo.id,
        eo.name,
        eo.rank,
        eo.pno,
        currentUser.name,
        assignedDirections,
        targetDays
      );

      setLastAssignedNotification(result.notification);
      setAssignSuccess(true);
      await loadComplaint();
      setShowReceiptModal(true);

      setTimeout(() => {
        setAssignSuccess(false);
        setAssignModalOpen(false);
        setLastAssignedNotification(null);
      }, 500);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAssigning(false);
    }
  };

  // Instant SHO Quick Assign EO (No dialogue box, rank & name only)
  const handleQuickAssignEO = async (eo: (typeof MOCK_ENQUIRY_OFFICERS)[0]) => {
    if (!complaint) return;
    if (!canAssign) {
      alert("Access Denied: Only SHO or Supervisory Officers can assign or reassign Enquiry Officers.");
      return;
    }
    setIsQuickAssigning(true);
    try {
      await ComplaintService.assignEnquiryOfficer(
        complaint.id,
        eo.id,
        eo.name,
        eo.rank,
        eo.pno,
        currentUser.name || "SHO Civil Lines"
      );
      setAssignEoDropdownOpen(false);
      setMoreActionsOpen(false);
      const officerLabel = eo.name.startsWith(eo.rank) ? eo.name : `${eo.rank} ${eo.name}`;
      setProfileAssignToast({
        title: "Officer Assigned Successfully",
        message: `${officerLabel} has been assigned to enquiry docket for complaint ${complaint.complaintNumber}.`,
      });
      setTimeout(() => {
        setProfileAssignToast(null);
      }, 5000);
      await loadComplaint();
    } catch (err) {
      console.error("Assignment error:", err);
    } finally {
      setIsQuickAssigning(false);
    }
  };

  // Add Enquiry Note
  const handleAddEnquiryNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaint || !newNoteContent.trim()) return;

    if (!canModifyCase) {
      alert(`Access Denied: Only the assigned Enquiry Officer (${complaint.assignedEoName || "Assigned Officer"}) has permission to record enquiry notes.`);
      return;
    }

    let attachedMedia: ComplaintEvidenceAttachment | undefined = undefined;
    if (noteAttachmentName && noteAttachmentDataUrl) {
      attachedMedia = {
        id: `ev_note_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: noteAttachmentName,
        size: noteAttachmentSize || 1024 * 50,
        type: noteAttachmentCategory,
        category: noteAttachmentCategory,
        dataUrl: noteAttachmentDataUrl,
        description: `Attached with Enquiry Note: ${newNoteType.replace(/_/g, " ")}`,
        uploadedAt: new Date().toISOString(),
      };
    }

    await ComplaintService.addEnquiryNote(complaint.id, {
      officerName: currentUser.name,
      officerRank: currentUser.rankDisplay || "Inspector",
      officerPno: currentUser.pno || "04291882",
      noteType: newNoteType,
      content: newNoteContent,
      location: newNoteLocation || complaint.incidentPlace,
      attachment: attachedMedia,
    });

    setNewNoteContent("");
    setNewNoteLocation("");
    setNoteAttachmentFile(null);
    setNoteAttachmentName("");
    setNoteAttachmentSize(0);
    setNoteAttachmentDataUrl(undefined);
    setEnquiryNoteModalOpen(false);
    await loadComplaint();
    setActiveTab("documents");
  };

  // Evidence file upload handler
  const handleEvidenceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setEvidenceFileName(file.name);
    setEvidenceFileSize(file.size);
    if (!evidenceTitle) {
      setEvidenceTitle(file.name.replace(/\.[^/.]+$/, ""));
    }

    if (file.type.startsWith("image/")) {
      setEvidenceCategory("image");
    } else if (file.type.startsWith("video/")) {
      setEvidenceCategory("video");
    } else if (file.type.startsWith("audio/")) {
      setEvidenceCategory("audio");
    } else if (file.type.includes("pdf") || file.type.includes("document") || file.type.includes("text")) {
      setEvidenceCategory("document");
    } else {
      setEvidenceCategory("other");
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setEvidenceDataUrl(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAddEvidenceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaint) return;

    if (!canModifyCase) {
      alert(`Access Denied: Only the assigned Enquiry Officer (${complaint.assignedEoName || "Assigned Officer"}) has permission to upload evidence.`);
      return;
    }

    await ComplaintService.addEvidence(complaint.id, {
      name: evidenceTitle || evidenceFileName || "Attached Evidence",
      size: evidenceFileSize || 1024 * 45,
      type: evidenceCategory,
      category: evidenceCategory,
      dataUrl: evidenceDataUrl,
      description: evidenceDesc,
      officerName: currentUser.name,
    });

    setEvidenceTitle("");
    setEvidenceDesc("");
    setEvidenceFileName("");
    setEvidenceDataUrl(undefined);
    setEvidenceModalOpen(false);
    await loadComplaint();
    setActiveTab("documents");
  };

  // Document file upload handler (Any format)
  const handleDocFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setDocFileName(file.name);
    const sizeKb = file.size / 1024;
    const sizeFormatted = sizeKb > 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb.toFixed(1)} KB`;
    setDocFileSize(sizeFormatted);
    if (!docName) {
      setDocName(file.name.replace(/\.[^/.]+$/, ""));
    }

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (file.type.includes("pdf")) {
      setDocCategory("Official PDF Document");
    } else if (file.type.includes("image") || ["jpg", "jpeg", "png", "webp"].includes(ext || "")) {
      setDocCategory("Scan / Certified Copy");
    } else if (file.type.includes("sheet") || file.type.includes("excel") || ["xls", "xlsx", "csv"].includes(ext || "")) {
      setDocCategory("Bank / Transaction Ledger");
    } else if (file.type.includes("word") || ["doc", "docx", "odt", "txt"].includes(ext || "")) {
      setDocCategory("Written Statement / Affidavit");
    } else {
      setDocCategory("Other Official Record");
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setDocFileDataUrl(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Add Document Submit
  const handleAddDocumentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaint) return;

    if (!canUploadDocument) {
      alert(`Access Denied: You do not have permission to upload documents.`);
      return;
    }

    const finalName = docFileName || (docName ? (docName.includes(".") ? docName : `${docName}.pdf`) : "Official_Document.pdf");

    await ComplaintService.addDocument(complaint.id, {
      fileName: finalName,
      fileCategory: docCategory,
      fileSize: docFileSize || "98 KB",
      fileUrl: docFileDataUrl,
      description: docDesc,
      uploadedBy: `${currentUser.name} (${currentUser.rankDisplay || "Inspector"})`,
    });

    setDocName("");
    setDocDesc("");
    setDocFileName("");
    setDocFileSize("");
    setDocFileDataUrl(undefined);
    setDocumentModalOpen(false);
    await loadComplaint();
    setActiveTab("documents");
  };

  // Transfer Submit
  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaint) return;

    if (!canModifyCase) {
      alert(`Access Denied: Only the assigned Enquiry Officer (${complaint.assignedEoName || "Assigned Officer"}) can transfer jurisdiction.`);
      return;
    }

    await ComplaintService.transferComplaint(
      complaint.id,
      transferStation,
      transferReason || "Jurisdictional transfer as occurrence falls in adjacent police station beat.",
      currentUser.name
    );

    setTransferModalOpen(false);
    await loadComplaint();
    setActiveTab("history");
  };

  // Link Complaint Submit
  const handleLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaint || !linkTargetNumber.trim()) return;

    if (!canModifyCase) {
      alert(`Access Denied: Only the assigned Enquiry Officer (${complaint.assignedEoName || "Assigned Officer"}) can link complaints.`);
      return;
    }

    await ComplaintService.linkComplaint(complaint.id, linkTargetNumber.trim(), linkRelationType);

    setLinkModalOpen(false);
    setLinkTargetNumber("");
    await loadComplaint();
    setActiveTab("links");
  };

  // Issue NCR Submit
  const handleNcrSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaint) return;

    if (!canModifyCase) {
      alert(`Access Denied: Only the assigned Enquiry Officer (${complaint.assignedEoName || "Assigned Officer"}) can issue NCR.`);
      return;
    }

    const num = ncrNumber || `NCR-KKR-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    await ComplaintService.issueNcrReference(complaint.id, num, ncrSections, currentUser.name);

    setNcrModalOpen(false);
    await loadComplaint();
    setActiveTab("history");
  };

  const [sendingReportToSho, setSendingReportToSho] = useState(false);

  // Trigger EO Send to SHO Modal
  const handleOpenEoSendToShoModal = (report?: ComplaintReportItem) => {
    setSelectedReportForSho(report);
    setEoSendToShoModalOpen(true);
  };

  // Submit EO Recommendation & Send to SHO
  const handleEoSendToShoSubmit = async (data: {
    recommendedCategory: EOCategoryOption;
    remarks: string;
  }) => {
    if (!complaint) return;
    setSendingReportToSho(true);
    try {
      const displayCat =
        data.recommendedCategory === "FIR_RECOMMEND"
          ? "FIR Recommend"
          : data.recommendedCategory === "CLOSURE"
          ? "Closure"
          : "NCR";

      const updated = await ComplaintService.sendReportToSho(
        complaint.id,
        currentUser.name || complaint.assignedEoName || "Enquiry Officer",
        currentUser.pno || "PNO-23841",
        data.remarks || `Enquiry report "${selectedReportForSho?.title || "Enquiry Report"}" submitted with EO recommendation: ${displayCat}. Forwarded for SHO decision.`,
        {
          recommendedCategory: data.recommendedCategory,
          eoId: currentUser.id || complaint.assignedEoId,
          reportTitle: selectedReportForSho?.title || (complaint.reports && complaint.reports[0]?.title) || "Enquiry Report",
        }
      );
      setComplaint(updated);
      setEoSendToShoModalOpen(false);
      alert(`शिकायत ${complaint.complaintNumber} की जांच रिपोर्ट (${displayCat} सिफारिश सहित) SHO ID को भेज दी गई है। यह शिकायत अब SHO रिव्यू डेस्क पर उपलब्ध है।`);
      await loadComplaint();
      if (isAssignedEo) {
        router.push("/complaints");
      }
    } catch (err) {
      console.error("Error sending report to SHO:", err);
      alert("Error sending report to SHO");
    } finally {
      setSendingReportToSho(false);
    }
  };

  // Trigger SHO Approve Category Modal
  const handleOpenShoApproveModal = () => {
    setShoApproveModalOpen(true);
  };

  // Submit SHO Authoritative Final Category Decision
  const handleShoApproveSubmit = async (data: {
    finalCategory: SHOCategoryOption;
    remarks: string;
  }) => {
    if (!complaint) return;
    setIsShoApproving(true);
    try {
      const displayCat =
        data.finalCategory === "FIR_RECOMMEND"
          ? "FIR Recommend"
          : data.finalCategory === "CLOSURE"
          ? "Closure"
          : "NCR";

      const updated = await ComplaintService.shoApprove(
        complaint.id,
        currentUser.name,
        currentUser.pno || "04291882",
        data.remarks || shoApproveRemarks,
        data.finalCategory
      );
      setComplaint(updated);
      setShoApproveRemarks("");
      setShoApproveModalOpen(false);
      alert(`Enquiry report approved with authoritative final category: ${displayCat}. Final status updated.`);
      await loadComplaint();
    } catch (err) {
      console.error(err);
      alert("Failed to approve report.");
    } finally {
      setIsShoApproving(false);
    }
  };

  const handleShoReEnquiryAction = async () => {
    if (!complaint || !shoReEnquiryReason.trim()) {
      alert("Please enter directions/reason for re-enquiry.");
      return;
    }
    setIsSubmittingShoReEnquiry(true);
    try {
      const updated = await ComplaintService.shoReEnquiry(
        complaint.id,
        currentUser.name,
        currentUser.pno || "04291882",
        shoReEnquiryReason
      );
      setComplaint(updated);
      setShoReEnquiryModalOpen(false);
      setShoReEnquiryReason("");
      alert("Re-enquiry ordered. Complaint returned to Enquiry Officer.");
      await loadComplaint();
    } catch (err) {
      console.error(err);
      alert("Failed to order re-enquiry.");
    } finally {
      setIsSubmittingShoReEnquiry(false);
    }
  };

  const handleShoRejectAction = async () => {
    if (!complaint || !shoRejectReason.trim()) {
      alert("Please enter the mandatory rejection reason / instructions for correction.");
      return;
    }
    setIsShoRejecting(true);
    try {
      const updated = await ComplaintService.shoReject(
        complaint.id,
        currentUser.name,
        currentUser.pno || "04291882",
        shoRejectReason.trim()
      );
      setComplaint(updated);
      setShoRejectModalOpen(false);
      setShoRejectReason("");
      alert("Report rejected. Complaint returned to assigned Enquiry Officer for correction.");
      await loadComplaint();
    } catch (err) {
      console.error(err);
      alert("Failed to reject report.");
    } finally {
      setIsShoRejecting(false);
    }
  };

  // Register FIR Submit (SHO or authorized officer, strictly blocked for MHC)
  const handleFirSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaint) return;

    if (isMhc) {
      alert("Access Denied: MHC cannot register FIR.");
      return;
    }

    if (!isSho && currentUser.role !== "SUPER_ADMIN" && currentUser.role !== "DUTY_OFFICER") {
      alert("Access Denied: Only SHO or authorized officers can register FIR.");
      return;
    }

    const num = firNumber || `HAR-KKR-2026-FIR-${Math.floor(100 + Math.random() * 900)}`;
    const sections = firSections || complaint.firSections || "Section 115(2), 351(2), 3(5) BNS, 2023";

    await ComplaintService.registerFir(complaint.id, num, sections, currentUser.name, currentUser.role);

    setFirModalOpen(false);
    await loadComplaint();
    setActiveTab("history");
  };

  // SHO Request Progress Report Handler
  const handleSendProgressRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaint) return;
    if (currentUser.role !== "SHO" && currentUser.id !== "usr_sho_1") {
      alert("Access Denied: Only Station House Officer (SHO) can demand case progress reports.");
      return;
    }
    setIsSubmittingProgress(true);
    try {
      const updated = await ComplaintService.requestProgressReport(
        complaint.id,
        currentUser.name,
        currentUser.pno || "04291882",
        progressRemarks,
        progressDeadlineHours
      );
      setComplaint(updated);
      setProgressModalOpen(false);
      alert(`Supervisory directive successfully dispatched to Enquiry Officer ${complaint.assignedEoName}! High-priority notification logged in Station General Diary.`);
    } catch (err: any) {
      alert(err.message || "Failed to dispatch progress request");
    } finally {
      setIsSubmittingProgress(false);
    }
  };

  // Delete Handlers (strictly authorized for assigned EO only!)
  const handleDeleteEnquiryNote = async (noteId: string) => {
    if (!complaint) return;
    if (!canModifyCase) {
      alert(`Access Denied: Only the assigned Enquiry Officer (${complaint.assignedEoName || "Assigned Officer"}) can delete enquiry notes.`);
      return;
    }
    if (!confirm("Are you sure you want to expunge this enquiry note from the case file? This action will be recorded in the case timeline.")) {
      return;
    }
    try {
      const updated = await ComplaintService.deleteEnquiryNote(complaint.id, noteId, currentUser.name);
      setComplaint(updated);
    } catch (err: any) {
      alert(err.message || "Failed to delete enquiry note");
    }
  };

  const handleDeleteEvidence = async (evidenceId: string) => {
    if (!complaint) return;
    if (!canModifyCase) {
      alert(`Access Denied: Only the assigned Enquiry Officer (${complaint.assignedEoName || "Assigned Officer"}) can delete evidence.`);
      return;
    }
    if (!confirm("Are you sure you want to remove this evidence file from the case docket?")) {
      return;
    }
    try {
      const updated = await ComplaintService.deleteEvidence(complaint.id, evidenceId, currentUser.name);
      setComplaint(updated);
    } catch (err: any) {
      alert(err.message || "Failed to delete evidence");
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!complaint) return;
    if (!canModifyCase && !isSho && currentUser.role !== "SUPER_ADMIN") {
      alert(`Access Denied: Only the assigned Enquiry Officer (${complaint.assignedEoName || "Assigned Officer"}) or SHO can delete documents.`);
      return;
    }
    if (!confirm("Are you sure you want to remove this document from the official repository?")) {
      return;
    }
    try {
      const updated = await ComplaintService.deleteDocument(complaint.id, docId, currentUser.name);
      setComplaint(updated);
    } catch (err: any) {
      alert(err.message || "Failed to delete document");
    }
  };

  // Confidential Dossier Handlers (strictly restricted to Enquiry Officer IDs)
  const handleDossierAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setDossierAttachmentName(file.name);
    const sizeStr =
      file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${(file.size / 1024).toFixed(1)} KB`;
    setDossierAttachmentSize(sizeStr);

    let type: "audio" | "video" | "document" | "image" | "other" = "other";
    const lowerName = file.name.toLowerCase();
    if (
      file.type.startsWith("audio/") ||
      lowerName.endsWith(".mp3") ||
      lowerName.endsWith(".wav") ||
      lowerName.endsWith(".m4a") ||
      lowerName.endsWith(".aac") ||
      lowerName.endsWith(".ogg")
    ) {
      type = "audio";
    } else if (
      file.type.startsWith("video/") ||
      lowerName.endsWith(".mp4") ||
      lowerName.endsWith(".mkv") ||
      lowerName.endsWith(".avi") ||
      lowerName.endsWith(".mov") ||
      lowerName.endsWith(".webm")
    ) {
      type = "video";
    } else if (
      file.type.startsWith("image/") ||
      lowerName.endsWith(".jpg") ||
      lowerName.endsWith(".jpeg") ||
      lowerName.endsWith(".png") ||
      lowerName.endsWith(".webp")
    ) {
      type = "image";
    } else if (
      file.type.includes("pdf") ||
      file.type.includes("word") ||
      file.type.includes("document") ||
      lowerName.endsWith(".pdf") ||
      lowerName.endsWith(".doc") ||
      lowerName.endsWith(".docx") ||
      lowerName.endsWith(".txt") ||
      lowerName.endsWith(".xlsx") ||
      lowerName.endsWith(".csv")
    ) {
      type = "document";
    }
    setDossierAttachmentType(type);

    if (!dossierTitle.trim()) {
      setDossierTitle(file.name.replace(/\.[^/.]+$/, ""));
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setDossierAttachmentDataUrl(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleOpenUploadDossier = () => {
    setDossierModalTab("upload");
    setDossierModalOpen(true);
  };

  const handleOpenNoteDossier = () => {
    setDossierModalTab("note");
    setDossierModalOpen(true);
  };

  const handleAddDossierSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaint) return;
    if (!isEoPersona) {
      alert("Access Denied: Confidential Dossier is strictly restricted to Enquiry Officer IDs.");
      return;
    }
    const finalTitle = dossierTitle.trim() || dossierAttachmentName || "Confidential Entry";
    const finalContent =
      dossierContent.trim() ||
      (dossierAttachmentName
        ? `Uploaded file: ${dossierAttachmentName} (${dossierAttachmentType.toUpperCase()} · ${dossierAttachmentSize || "Saved"})`
        : "Confidential officer memory note recorded.");

    setIsSavingDossier(true);
    try {
      const updated = await ComplaintService.addConfidentialDossier(complaint.id, {
        officerName: currentUser.name,
        officerRank: currentUser.rankDisplay || "Enquiry Officer",
        officerPno: currentUser.pno || "EO-OFFICER",
        category: dossierCategory,
        title: finalTitle,
        content: finalContent,
        referenceTag: dossierReferenceTag.trim() || undefined,
        attachmentName: dossierAttachmentName || undefined,
        attachmentDataUrl: dossierAttachmentDataUrl || undefined,
        attachmentType: dossierAttachmentName ? dossierAttachmentType : undefined,
        attachmentSize: dossierAttachmentName ? dossierAttachmentSize : undefined,
      });
      setComplaint(updated);
      setDossierModalOpen(false);
      setDossierTitle("");
      setDossierContent("");
      setDossierReferenceTag("");
      setDossierAttachmentName("");
      setDossierAttachmentDataUrl(undefined);
      setDossierAttachmentSize("");
      setDossierAttachmentType("document");
      setDossierCategory("FIELD_OBSERVATION");
      alert("Confidential Dossier entry saved! Isolated from public records and kept strictly for your internal recollection.");
    } catch (err: any) {
      alert(err.message || "Failed to record confidential dossier note");
    } finally {
      setIsSavingDossier(false);
    }
  };

  const handleDeleteDossier = async (dossierId: string) => {
    if (!complaint) return;
    if (!isEoPersona) {
      alert("Access Denied: Confidential Dossier is strictly restricted to Enquiry Officer IDs.");
      return;
    }
    if (!confirm("Are you sure you want to permanently delete this confidential dossier note?")) {
      return;
    }
    try {
      const updated = await ComplaintService.deleteConfidentialDossier(complaint.id, dossierId);
      setComplaint(updated);
    } catch (err: any) {
      alert(err.message || "Failed to delete confidential note");
    }
  };

  // Generate AI Report draft
  const handleGenerateAiReport = () => {
    if (!complaint) return;
    setIsAiGenerating(true);
    setTimeout(() => {
      const generated = `PRELIMINARY ENQUIRY REPORT (UNDER SECTION 173(3) BNSS)
Police Station: ${complaint.policeStation}
Complaint Reference: ${complaint.complaintNumber}
Date of Inquiry: ${new Date().toLocaleDateString("en-IN")}
Designated Officer: ${complaint.assignedEoName || currentUser.name} (${complaint.assignedEoRank || currentUser.rankDisplay})

1. BRIEF FACTS:
The complainant, ${complaint.complainantName}, lodged an application reporting an incident at ${complaint.incidentPlace} regarding ${complaint.categoryDisplay}.
Allegation: "${complaint.incidentDetails}"

2. ENQUIRY CONDUCTED & EVIDENCE INSPECTED:
- Spot visit conducted at the place of occurrence.
- Statements of complainant and neighboring witnesses recorded.
- Attached digital evidence / documents inspected (${complaint.attachments?.length || 0} files examined).
- Accused party named: ${complaint.accusedList?.[0]?.name || "Unidentified offenders"}.

3. LEGAL EVALUATION:
The facts disclosed indicate elements pertaining to ${complaint.categoryDisplay}.
Compliance with Section 35(3) BNSS notice requirements was initiated.

4. RECOMMENDATION:
${
  complaint.priority === "CRITICAL_SENSITIVE" || complaint.category === "PHYSICAL_ASSAULT_AFFRAY"
    ? "Substantiated cognizable elements. Formal registration of FIR recommended under appropriate BNS sections."
    : "No immediate cognizable violence detected. Parties directed towards lawful civil remedy / mediation accord."
}

Submitted by:
${complaint.assignedEoName || currentUser.name}, ${complaint.assignedEoRank || currentUser.rankDisplay}
PNO: ${complaint.assignedEoPno || currentUser.pno}`;
      setAiReportText(generated);
      setIsAiGenerating(false);
    }, 900);
  };

  // Build combined history timeline matching official format (Latest on Top ➔ Initial on Bottom)
  const combinedHistory = useMemo(() => {
    if (!complaint) return [];
    const entries: {
      id: string;
      title: string;
      timestamp: string;
      officerName: string;
      details: string;
      stageWeight: number;
    }[] = [];
    const seen = new Set<string>();

    const addUnique = (item: {
      id: string;
      title: string;
      timestamp: string;
      officerName: string;
      details: string;
      stageWeight: number;
    }) => {
      const key = `${item.title}__${item.details}`;
      if (!seen.has(key)) {
        seen.add(key);
        entries.push(item);
      }
    };

    // 1. Initial REGISTERED event (Base)
    addUnique({
      id: "hist_registered",
      title: "REGISTERED",
      timestamp: complaint.createdAt || new Date().toISOString(),
      officerName: complaint.registeredBy || "Insp. Ravinder Kumar",
      details: complaint.complaintNumber || "CMP-REF",
      stageWeight: 1,
    });

    // 2. EO ASSIGNED
    if (complaint.assignedEoName || complaint.status !== "REGISTERED") {
      const eoOfficer = MOCK_ENQUIRY_OFFICERS.find(
        (o) => o.name === complaint.assignedEoName || o.pno === complaint.assignedEoPno
      );
      const eoRoster = eoOfficer?.rosterDuty || complaint.assignedRosterDuty || "Roster duty (E2E)";
      const eoId = eoOfficer?.id?.replace("eo_", "") || complaint.assignedEoId?.replace("eo_", "") || "4";
      addUnique({
        id: "hist_eo_assigned",
        title: "EO ASSIGNED",
        timestamp: complaint.assignedAt || complaint.createdAt || new Date().toISOString(),
        officerName: complaint.registeredBy || "Insp. Ravinder Kumar",
        details: `${eoId} · ${eoRoster?.startsWith?.("Roster") ? eoRoster : `Roster duty (${eoRoster})`}`,
        stageWeight: 2,
      });
    }

    // 3. ENQUIRY NOTE(s)
    if (complaint.enquiryNotes && complaint.enquiryNotes.length > 0) {
      complaint.enquiryNotes.forEach((n, idx) => {
        const noteType = n.noteType ? n.noteType.replace(/_/g, " ").toUpperCase() : "VISIT";
        addUnique({
          id: n.id || `hist_note_${idx}`,
          title: "ENQUIRY NOTE",
          timestamp: n.createdAt || complaint.createdAt || new Date().toISOString(),
          officerName: n.officerName || complaint.assignedEoName || "SI Pooja Rani",
          details: n.content ? `${noteType} · ${n.content}` : noteType,
          stageWeight: 3 + idx * 0.05,
        });
      });
    } else if (
      complaint.status === "REPORT_SUBMITTED" ||
      complaint.status?.startsWith?.("DISPOSED") ||
      complaint.status === "RECOMMENDED_FOR_FIR"
    ) {
      addUnique({
        id: "hist_note_default",
        title: "ENQUIRY NOTE",
        timestamp: complaint.assignedAt || complaint.createdAt || new Date().toISOString(),
        officerName: complaint.assignedEoName || "SI Pooja Rani",
        details: "VISIT",
        stageWeight: 3,
      });
    }

    // 4. REPORT SUBMITTED
    if (
      complaint.status === "REPORT_SUBMITTED" ||
      complaint.status?.startsWith?.("DISPOSED") ||
      complaint.status === "RECOMMENDED_FOR_FIR"
    ) {
      addUnique({
        id: "hist_report_submitted",
        title: "REPORT SUBMITTED",
        timestamp: complaint.updatedAt || complaint.createdAt || new Date().toISOString(),
        officerName: complaint.assignedEoName || "SI Pooja Rani",
        details: "NON_COGNIZABLE",
        stageWeight: 4,
      });
    }

    // 5. NCR ISSUED
    if (
      complaint.ncrNumber ||
      complaint.dispositionType === "NCR_FILED" ||
      (complaint.status?.startsWith?.("DISPOSED") && !complaint.firNumber)
    ) {
      addUnique({
        id: "hist_ncr_issued",
        title: "NCR ISSUED",
        timestamp: complaint.disposedAt || complaint.updatedAt || complaint.createdAt || new Date().toISOString(),
        officerName: complaint.registeredBy || "Insp. Ravinder Kumar",
        details: complaint.ncrNumber || "NCR-2025-9001",
        stageWeight: 5,
      });
    }

    // 5b. FIR REGISTERED
    if (complaint.isFirRegistered || complaint.firNumber || complaint.dispositionType === "FIR_REGISTERED") {
      addUnique({
        id: "hist_fir_registered",
        title: "FIR REGISTERED",
        timestamp: complaint.firDate || complaint.disposedAt || complaint.updatedAt || complaint.createdAt || new Date().toISOString(),
        officerName: complaint.registeredBy || "Insp. Ravinder Kumar",
        details: complaint.firNumber || "FIR-2026-0042",
        stageWeight: 5,
      });
    }

    // 6. DISPOSED
    if (
      complaint.status?.startsWith?.("DISPOSED") ||
      complaint.dispositionCategory ||
      complaint.dispositionRemarks
    ) {
      addUnique({
        id: "hist_disposed",
        title: "DISPOSED",
        timestamp: complaint.disposedAt || complaint.updatedAt || complaint.createdAt || new Date().toISOString(),
        officerName: complaint.registeredBy || "Insp. Ravinder Kumar",
        details: `${complaint.dispositionCategory || "NON_COGNIZABLE"} · ${
          complaint.dispositionRemarks || "Verified; civil matter referred with NCR."
        }`,
        stageWeight: 6,
      });
    }

    // 7. LINK ADDED
    if (complaint.linkedComplaintNumber || complaint.isCrossComplaint) {
      addUnique({
        id: "hist_link_added",
        title: "LINK ADDED",
        timestamp: complaint.updatedAt || complaint.createdAt || new Date().toISOString(),
        officerName: complaint.registeredBy || "Insp. Ravinder Kumar",
        details: `REPEAT · ${complaint.linkedComplaintReason || "Same land dispute, renewed threats"}`,
        stageWeight: 7,
      });
      if (complaint.linkedComplaintNumber) {
        addUnique({
          id: "hist_linked_ref",
          title: "LINKED COMPLAINT REFERENCE",
          timestamp: complaint.updatedAt || complaint.createdAt || new Date().toISOString(),
          officerName: complaint.registeredBy || "Insp. Ravinder Kumar",
          details: complaint.linkedComplaintNumber,
          stageWeight: 7.5,
        });
      }
    }

    // 8. Custom timeline events from complaint.timeline
    if (complaint.timeline && complaint.timeline.length > 0) {
      complaint.timeline.forEach((tl) => {
        let weight = 3.5;
        const upper = (tl.title || "").toUpperCase();
        if (upper.includes("REGISTER")) weight = 1;
        else if (upper.includes("ASSIGN")) weight = 2;
        else if (upper.includes("NOTE")) weight = 3;
        else if (upper.includes("REPORT")) weight = 4;
        else if (upper.includes("NCR") || upper.includes("FIR")) weight = 5;
        else if (upper.includes("DISPOSE")) weight = 6;
        else if (upper.includes("LINK")) weight = 7;

        addUnique({
          id: tl.id,
          title: upper,
          timestamp: tl.timestamp || new Date().toISOString(),
          officerName: tl.officerName || complaint.registeredBy || "Insp. Ravinder Kumar",
          details: tl.description || "",
          stageWeight: weight,
        });
      });
    }

    // 9. Audit Trail events from CMS workflow
    if (complaint.auditTrail && complaint.auditTrail.length > 0) {
      complaint.auditTrail.forEach((aud) => {
        addUnique({
          id: aud.id,
          title: (aud.actionLabel || aud.action).toUpperCase(),
          timestamp: aud.timestamp || new Date().toISOString(),
          officerName: aud.performedBy || "Authorized Officer",
          details: aud.details || aud.reason || (aud.outcome ? `Outcome: ${aud.outcome}` : ""),
          stageWeight: 4,
        });
      });
    }

    // Sort chronologically: Default 'asc' (jo kaam pehle hua hai vo pehle dikhe)
    return entries.sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      if (historySortOrder === "asc") {
        if (timeA !== timeB) return timeA - timeB;
        return (a.stageWeight || 0) - (b.stageWeight || 0);
      } else {
        if (timeB !== timeA) return timeB - timeA;
        return (b.stageWeight || 0) - (a.stageWeight || 0);
      }
    });
  }, [complaint, historySortOrder]);

  const combinedTimeline = combinedHistory;

  // File Category Detector for preview icons and modal rendering
  const detectCategory = (fileName: string, cat?: string): "document" | "video" | "audio" | "image" | "other" => {
    const ext = (fileName || "").split(".").pop()?.toLowerCase() || "";
    if (["jpg", "jpeg", "png", "webp", "gif", "bmp", "svg"].includes(ext)) return "image";
    if (["mp4", "mov", "avi", "mkv", "webm", "3gp"].includes(ext)) return "video";
    if (["mp3", "wav", "m4a", "ogg", "aac", "flac"].includes(ext)) return "audio";
    if (["pdf", "doc", "docx", "txt", "rtf", "xls", "xlsx", "csv"].includes(ext)) return "document";
    const c = (cat || "").toLowerCase();
    if (c.includes("image") || c.includes("photo")) return "image";
    if (c.includes("video")) return "video";
    if (c.includes("audio") || c.includes("voice")) return "audio";
    return "document";
  };

  // Combine all documents: complaint.documents + complaint.attachments + any enquiry note media
  const combinedDocuments: ComplaintDocumentItem[] = useMemo(() => {
    if (!complaint) return [];
    const list: ComplaintDocumentItem[] = [...(complaint.documents || [])];
    const existingNames = new Set(list.map((d) => (d.fileName || "").toLowerCase().trim()));

    // 1. Evidence Attachments uploaded during registration or enquiry
    (complaint.attachments || []).forEach((att) => {
      const key = (att.name || "").toLowerCase().trim();
      if (!existingNames.has(key)) {
        list.push({
          id: `doc_${att.id}`,
          complaintId: complaint.id,
          fileName: att.name,
          fileCategory: att.category.toUpperCase(),
          uploadedBy: complaint.registeredBy || "Intake Officer",
          uploadedAt: att.uploadedAt || complaint.createdAt,
          fileSize: typeof att.size === "number" ? `${(att.size / 1024).toFixed(1)} KB` : String(att.size || "10 KB"),
          fileUrl: att.dataUrl,
          dataUrl: att.dataUrl,
          description: att.description || "Uploaded evidence docket",
        });
        existingNames.add(key);
      }
    });

    // 2. Media attached to any Enquiry Notes
    (complaint.enquiryNotes || []).forEach((n) => {
      if (n.attachment) {
        const key = (n.attachment.name || "").toLowerCase().trim();
        if (!existingNames.has(key)) {
          list.push({
            id: `doc_enq_${n.attachment.id}`,
            complaintId: complaint.id,
            fileName: n.attachment.name,
            fileCategory: `${n.attachment.category.toUpperCase()} (ENQUIRY)`,
            uploadedBy: n.officerName || "Enquiry Officer",
            uploadedAt: n.createdAt,
            fileSize: typeof n.attachment.size === "number" ? `${(n.attachment.size / 1024).toFixed(1)} KB` : String(n.attachment.size || "10 KB"),
            fileUrl: n.attachment.dataUrl,
            dataUrl: n.attachment.dataUrl,
            description: `Attached to enquiry note by ${n.officerName}`,
          });
          existingNames.add(key);
        }
      }
    });

    return list;
  }, [complaint]);

  // Handle instant preview for any document
  const handlePreviewDocument = (doc: ComplaintDocumentItem) => {
    const cat = detectCategory(doc.fileName, doc.fileCategory);
    let dataUrl = doc.dataUrl || doc.fileUrl;
    if (!dataUrl) {
      const sampleText = `HARYANA POLICE OFFICIAL DOCKET RECORD\nComplaint: ${complaint?.complaintNumber || "N/A"}\nDocument: ${doc.fileName}\nCategory: ${doc.fileCategory}\nUploaded By: ${doc.uploadedBy}\nTimestamp: ${formatDateTime(doc.uploadedAt)}\n\nThis record is officially sealed under BNSS Section 173(3).`;
      dataUrl = `data:text/plain;charset=utf-8,${encodeURIComponent(sampleText)}`;
    }
    setPreviewModalFile({
      name: doc.fileName,
      category: cat,
      dataUrl,
      size: doc.fileSize,
    });
  };

  // Handle instant download for any document
  const handleDownloadDocument = (doc: ComplaintDocumentItem) => {
    const url = doc.dataUrl || doc.fileUrl;
    if (url && (url.startsWith("data:") || url.startsWith("blob:") || url.startsWith("http"))) {
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      const content = `HARYANA POLICE - CMS CASE RECORD
Complaint Number: ${complaint?.complaintNumber || "N/A"}
Document Name: ${doc.fileName}
Category: ${doc.fileCategory}
Uploaded By: ${doc.uploadedBy}
Date: ${formatDateTime(doc.uploadedAt)}
Description: ${doc.description || "Official police docket attachment"}
--------------------------------------------------
Certified official record copy.`;
      const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = doc.fileName.includes(".") ? doc.fileName : `${doc.fileName}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    }
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-4">
        <LoadingSkeleton count={3} />
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="p-6 max-w-2xl mx-auto text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Complaint Record Not Found</h2>
        <p className="text-sm text-slate-500">The requested complaint identifier does not exist in the police registry.</p>
        <Link href="/complaints">
          <Button variant="primary">Return to Complaints Register</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 max-w-7xl mx-auto space-y-5">
      {/* Top Header & Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <Link
            href="/complaints"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#0b192c] transition-colors bg-slate-50 hover:bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200 shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-tight">
                Complaint Profile
              </h1>
              <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                {complaint.complaintNumber}
              </span>
              <StatusBadge status={getMainComplaintStatus(complaint)} />
              <PriorityBadge priority={complaint.priority} />
            </div>
          </div>
        </div>

        <span className="text-xs font-mono text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 self-start sm:self-auto shrink-0">
          Police Station: <strong className="text-slate-800">{complaint.policeStation}</strong>
        </span>
      </div>

      {/* Quick Assign Success Toast Notification Banner */}
      {profileAssignToast && (
        <div className="bg-emerald-50 border-2 border-emerald-400 rounded-xl p-3.5 flex items-center justify-between gap-3 shadow-xs animate-in fade-in-50">
          <div className="flex items-center gap-2.5">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="text-xs font-bold text-emerald-950">{profileAssignToast.title}</p>
              <p className="text-xs text-emerald-800">{profileAssignToast.message}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setProfileAssignToast(null)}
            className="p-1 text-emerald-600 hover:text-emerald-900 rounded cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 1. DIRECT FIR BANNER */}
      {(complaint.directSendToFir || complaint.status === "FIR_REGISTER" || complaint.workflowState === "FIR_REGISTER") && !complaint.isFirRegistered && (
        <div className="bg-purple-50 border-2 border-purple-400 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-xs animate-in fade-in-50">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-black uppercase tracking-wider bg-purple-700 text-white px-2.5 py-0.5 rounded-full shadow-2xs">
                Direct FIR Mode
              </span>
              <h3 className="font-bold text-sm text-purple-950">
                Direct Send to FIR: Complaint Registered for Immediate FIR Registration
              </h3>
            </div>
            <p className="text-xs text-purple-900 leading-relaxed font-sans">
              This complaint was registered with <strong>Direct send to FIR: YES</strong>. No EO enquiry is required.
              Current status: <strong>FIR Register</strong>.
              {isSho ? " Click 'Register FIR' below to assign an FIR number and formally register the criminal case." : " Awaiting SHO to formally assign FIR number and register case."}
            </p>
          </div>

          {isSho && !isMhc && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => {
                setFirSections(complaint.firSections || "Section 115(2), 351(2), 3(5) BNS, 2023");
                setFirNumber(`HAR-KKR-2026-FIR-${Math.floor(100 + Math.random() * 900)}`);
                setFirModalOpen(true);
              }}
              className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs gap-1.5 shrink-0 shadow-sm cursor-pointer animate-pulse"
            >
              <FileText className="w-4 h-4" />
              <span>Register FIR</span>
            </Button>
          )}
        </div>
      )}

      {/* 2. SHO REJECTION / CORRECTION REQUIRED BANNER */}
      {(complaint.workflowState === "CORRECTION_REQUIRED" || complaint.shoDecision === "REJECT" || complaint.status === "CORRECTION_REQUIRED") && (
        <div className="bg-amber-50 border-2 border-amber-400 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-xs animate-in fade-in-50">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-black uppercase tracking-wider bg-amber-600 text-white px-2.5 py-0.5 rounded-full shadow-2xs">
                Correction Required • Report Rejected
              </span>
              <h3 className="font-bold text-sm text-amber-950">
                SHO has rejected the enquiry report and returned this case for correction
              </h3>
            </div>
            <div className="p-2.5 bg-white/90 border border-amber-300 rounded-lg text-xs text-amber-950 font-medium">
              <strong>Mandatory Rejection Reason:</strong> &ldquo;{complaint.rejectionReason || "Report rejected by SHO. Correction and resubmission required."}&rdquo;
            </div>
            <p className="text-[11px] text-amber-800">
              Rejected by {complaint.rejectionBy || "Station House Officer (SHO)"} on {formatDate(complaint.rejectionAt || complaint.updatedAt)}. Case status is <strong>Correction Required</strong>.
            </p>
          </div>

          {canModifyCase && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => {
                setActiveTab("reports");
                setUploadReportOutcome("Complete");
                setUploadReportModalOpen(true);
              }}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs gap-1.5 shrink-0 shadow-sm cursor-pointer"
            >
              <Edit3 className="w-4 h-4" />
              <span>Correct &amp; Resubmit Report</span>
            </Button>
          )}
        </div>
      )}

      {/* 3. RE-ENQUIRY NOTIFICATION BANNER */}
      {complaint.workflowState === "RE_ENQUIRY" && complaint.reEnquiryRemarks && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-xs animate-in fade-in-50">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-amber-600 text-white px-2.5 py-0.5 rounded-full shadow-2xs">
                Re-Enquiry Ordered (Cycle #{complaint.reEnquiryCount || 1})
              </span>
              <h3 className="font-bold text-sm text-amber-950">
                SHO has returned this case to Enquiry Officer for re-enquiry
              </h3>
            </div>
            <p className="text-xs text-amber-900 leading-relaxed font-sans">
              <strong>Directions / Reason:</strong> &ldquo;{complaint.reEnquiryRemarks}&rdquo;
            </p>
            <p className="text-[11px] text-amber-700">
              Ordered by {complaint.reEnquiryBy || "SHO"} on {formatDate(complaint.reEnquiryAt || complaint.updatedAt)}. Case status remains <strong>Pending</strong> in EO docket.
            </p>
          </div>
        </div>
      )}

      {/* 4. SHO REPORT REVIEW BANNER (APPROVE & REJECT BUTTONS) */}
      {isSho && !isMhc && !complaint.isFirRegistered && !complaint.directSendToFir && complaint.status !== "FIR_REGISTER" && (
        complaint.status === "COMPLETE" ||
        complaint.workflowState === "COMPLETE" ||
        complaint.eoOutcome === "Complete" ||
        (complaint.isSentToSho && !complaint.isFirApprovedBySho)
      ) && complaint.workflowState !== "CORRECTION_REQUIRED" && complaint.status !== "CORRECTION_REQUIRED" && complaint.shoDecision !== "REJECT" && complaint.shoDecision !== "APPROVE" && (
        <div className="bg-blue-50 border-2 border-blue-400 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-xs animate-in fade-in-50">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-blue-700 text-white px-2.5 py-0.5 rounded-full shadow-2xs animate-pulse">
                SHO Approval Required
              </span>
              <h3 className="font-bold text-sm text-blue-950">
                Enquiry Report Ready for SHO Decision ({complaint.assignedEoName || complaint.eoRecommendedBy || "Enquiry Officer"})
              </h3>
            </div>
            <p className="text-xs text-blue-900 leading-relaxed">
              EO Recommendation: <strong className="font-bold uppercase text-blue-900 bg-white px-2 py-0.5 rounded border border-blue-300">
                {complaint.eoRecommendedCategory
                  ? (complaint.eoRecommendedCategory === "FIR_RECOMMEND" ? "FIR Recommend" : complaint.eoRecommendedCategory === "CLOSURE" ? "Closure" : "NCR")
                  : (complaint.eoOutcome || "Pending")}
              </strong>.
              Review the enquiry report below and decide: <strong>Approve (Choose Final Category)</strong> or <strong>Reject</strong>.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleOpenShoApproveModal}
              disabled={isShoApproving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 shadow-sm cursor-pointer"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{isShoApproving ? "Approving..." : "Approve Report"}</span>
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => {
                setShoRejectReason("");
                setShoRejectModalOpen(true);
              }}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs gap-1.5 shadow-sm cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span>Reject Report</span>
            </Button>
          </div>
        </div>
      )}

      {/* 3. SHO ACTION BANNER: FIR REGISTRATION APPROVED */}
      {isSho && !isMhc && (
        complaint.isFirApprovedBySho ||
        complaint.workflowState === "FIR_REGISTRATION_PENDING" ||
        complaint.finalCategory === "FIR Recommend" ||
        complaint.status === "FIR Recommend"
      ) && !complaint.isFirRegistered && (
        <div className="bg-red-50 border-2 border-red-400 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-xs animate-in fade-in-50">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-black uppercase tracking-wider bg-red-600 text-white px-2.5 py-0.5 rounded-full shadow-2xs">
                FIR Sanctioned
              </span>
              <h3 className="font-bold text-sm text-red-950">
                SHO Sanction Granted: Regular FIR Registration Pending
              </h3>
            </div>
            <p className="text-xs text-red-800 leading-relaxed">
              Enquiry findings and FIR recommendation have been approved by SHO. Click below to formally register FIR. Status: <strong>FIR Recommend</strong>.
            </p>
          </div>

          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => {
              setFirSections(complaint.firSections || "Section 115(2), 351(2), 3(5) BNS, 2023");
              setFirNumber(`HAR-KKR-2026-FIR-${Math.floor(100 + Math.random() * 900)}`);
              setFirModalOpen(true);
            }}
            className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs gap-1.5 shrink-0 shadow-sm cursor-pointer animate-pulse"
          >
            <Scale className="w-4 h-4" />
            <span>Register FIR (प्राथमिकी दर्ज करें)</span>
          </Button>
        </div>
      )}

      {/* 2. SUCCESS BANNER: FORMAL FIR REGISTERED */}
      {(complaint.isFirRegistered || complaint.firNumber) && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-3 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <h4 className="font-bold text-xs text-emerald-950">
                Regular FIR Formally Registered: <span className="font-mono">{complaint.firNumber}</span>
              </h4>
              <p className="text-[11px] text-emerald-800">
                Registered under {complaint.firSections || "BNS Sections"} by {complaint.firRegisteredBy || "SHO"}.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Tabs Row (DIRECTLY AFTER COMPLAINT PROFILE HEADER) */}
      <div className="border-b border-slate-200 bg-white rounded-xl px-2 shadow-2xs flex flex-wrap items-center justify-between gap-2">
        <nav className="flex space-x-2 sm:space-x-4 overflow-x-auto no-scrollbar flex-1" aria-label="Tabs">
          {[
            { key: "overview", label: "Overview", icon: Eye, count: null },
            { key: "documents", label: "Documents", icon: UploadCloud, count: combinedDocuments.length },
            {
              key: "legal_assistant",
              label: "Legal Assistant",
              icon: Scale,
              count: complaint.legalAnalysis?.suggestedSections?.length || null,
            },
            {
              key: "summary",
              label: "Summary",
              icon: Sparkles,
              count: complaint.investigationSummary ? 1 : null,
            },
            { key: "links", label: "Links", icon: Link2, count: complaint.isCrossComplaint || complaint.linkedComplaintNumber ? 1 : 0 },
            { key: "reports", label: "Reports", icon: FileCheck2, count: complaint.reports?.length || 0 },
            { key: "history", label: "History", icon: HistoryIcon, count: combinedHistory.length },
            ...(isEoPersona
              ? [
                  {
                    key: "confidential_dossier",
                    label: "Confidential Dossier",
                    icon: Lock,
                    count: complaint.confidentialDossier?.length || 0,
                  },
                ]
              : []),
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as ActiveTab)}
                className={`flex items-center gap-1.5 py-3 px-3 border-b-2 text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.count !== null && tab.count > 0 && (
                  <span
                    className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] ${
                      isActive ? "bg-blue-100 text-blue-800" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* More Actions Dropdown to the right of the sub-tabs */}
        <div className="relative shrink-0 py-1.5 pr-1.5" ref={moreActionsRef}>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setMoreActionsOpen(!moreActionsOpen)}
            className="text-xs font-bold gap-1.5 bg-slate-50 hover:bg-slate-100 border-slate-300 text-slate-800 shadow-2xs cursor-pointer"
          >
            <span>More Actions</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${moreActionsOpen ? "rotate-180" : ""}`} />
          </Button>

          {moreActionsOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-60 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-40 animate-in fade-in-0 zoom-in-95 text-xs space-y-0.5">
              <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                Complaint Actions
              </div>

              <button
                type="button"
                onClick={() => {
                  setMoreActionsOpen(false);
                  setActiveTab("legal_assistant");
                }}
                className="w-full text-left px-3 py-2 text-indigo-700 hover:bg-indigo-50 hover:text-indigo-900 flex items-center gap-2 cursor-pointer transition-colors font-semibold"
              >
                <Scale className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span>Legal Assistant (कानूनी सहायक)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMoreActionsOpen(false);
                  setActiveTab("summary");
                }}
                className="w-full text-left px-3 py-2 text-blue-700 hover:bg-blue-50 hover:text-blue-900 flex items-center gap-2 cursor-pointer transition-colors font-semibold"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>Investigation Summary (जांच सारांश)</span>
              </button>

              {canAskProgress && (
                <button
                  type="button"
                  onClick={() => {
                    setMoreActionsOpen(false);
                    setProgressModalOpen(true);
                  }}
                  className="w-full text-left px-3 py-2 text-slate-700 hover:bg-amber-50 hover:text-amber-900 flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <Send className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span className="font-semibold">Ask Progress Report</span>
                </button>
              )}

              {canAssign && !complaint.assignedEoName && (
                <div className="border-t border-b border-slate-100 py-1 bg-slate-50/50">
                  <div className="px-3 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                    <span>Assign EO</span>
                    <span className="text-[9px] font-mono text-slate-400">Rank &amp; Name</span>
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {MOCK_ENQUIRY_OFFICERS.map((eo) => {
                      const label = eo.name.startsWith(eo.rank) ? eo.name : `${eo.rank} ${eo.name}`;
                      const isSelected = complaint.assignedEoId === eo.id || complaint.assignedEoName?.toLowerCase().includes(eo.name.toLowerCase());
                      return (
                        <button
                          key={eo.id}
                          type="button"
                          disabled={isQuickAssigning}
                          onClick={() => handleQuickAssignEO(eo)}
                          className={`w-full text-left px-3 py-1.5 text-xs font-semibold flex items-center justify-between cursor-pointer transition-colors ${
                            isSelected ? "bg-blue-50 text-blue-900 font-bold" : "text-slate-700 hover:bg-blue-50 hover:text-blue-900"
                          }`}
                        >
                          <span className="truncate">{label}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  setMoreActionsOpen(false);
                  setShowReceiptModal(true);
                }}
                className="w-full text-left px-3 py-2 text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 flex items-center gap-2 cursor-pointer transition-colors"
              >
                <Printer className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="font-semibold">Print Official Receipt</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMoreActionsOpen(false);
                  setActiveTab("documents");
                  setGenerateDocDropdownOpen(true);
                }}
                className="w-full text-left px-3 py-2 text-slate-700 hover:bg-purple-50 hover:text-purple-900 flex items-center gap-2 cursor-pointer transition-colors"
              >
                <ScrollText className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                <span className="font-semibold">Generate Notice / Doc</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMoreActionsOpen(false);
                  setActiveTab("reports");
                  setGenerateReportDropdownOpen(true);
                }}
                className="w-full text-left px-3 py-2 text-slate-700 hover:bg-amber-50 hover:text-amber-900 flex items-center gap-2 cursor-pointer transition-colors"
              >
                <FileCheck2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span className="font-semibold">Generate Enquiry Report</span>
              </button>

              {canUploadDocument && (
                <button
                  type="button"
                  onClick={() => {
                    setMoreActionsOpen(false);
                    setDocumentModalOpen(true);
                  }}
                  className="w-full text-left px-3 py-2 text-slate-700 hover:bg-blue-50 hover:text-blue-900 flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <UploadCloud className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span className="font-semibold">Upload Document</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setMoreActionsOpen(false);
                  setUploadReportModalOpen(true);
                }}
                className="w-full text-left px-3 py-2 text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 flex items-center gap-2 cursor-pointer transition-colors"
              >
                <FileText className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="font-semibold">Upload Signed Report</span>
              </button>

              <div className="border-t border-slate-100 my-1" />

              <button
                type="button"
                onClick={() => {
                  setMoreActionsOpen(false);
                  setTransferModalOpen(true);
                }}
                className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-100 flex items-center gap-2 cursor-pointer transition-colors"
              >
                <ArrowRightLeft className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span className="font-semibold">Transfer Jurisdiction</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMoreActionsOpen(false);
                  setLinkModalOpen(true);
                }}
                className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-100 flex items-center gap-2 cursor-pointer transition-colors"
              >
                <Link2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="font-semibold">Link / Club Complaints</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMoreActionsOpen(false);
                  setNcrModalOpen(true);
                }}
                className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-100 flex items-center gap-2 cursor-pointer transition-colors"
              >
                <FileCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="font-semibold">Issue NCR Reference</span>
              </button>

              {isEoPersona && (
                <button
                  type="button"
                  onClick={() => {
                    setMoreActionsOpen(false);
                    setDossierModalOpen(true);
                  }}
                  className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-900 hover:text-white flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="font-semibold">Confidential Dossier</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tab Content Panes */}
      <div className="space-y-5">
        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-5">
      {/* SHO Progress Report Directive Notice Banner */}
      {complaint.progressReportRequested && (
        <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-950 animate-in fade-in-0">
          <div className="flex items-start gap-2.5">
            <Bell className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 animate-bounce" />
            <div>
              <div className="font-bold flex items-center gap-2">
                <span>SHO Supervisory Notice: Interim Progress Report Demanded</span>
                <span className="text-[10px] font-normal bg-amber-200/80 text-amber-900 px-1.5 py-0.2 rounded font-mono">
                  Issued by {complaint.progressReportRequestedBy || "SHO"}
                </span>
                {complaint.progressReportRequestedAt && (
                  <span className="text-[10px] text-amber-800 font-mono">
                    • {formatDateTime(complaint.progressReportRequestedAt)}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-amber-900 mt-0.5">
                <strong>Directive:</strong> &ldquo;{complaint.progressReportRemarks || "Expedite enquiry and submit interim progress findings."}&rdquo;
              </p>
            </div>
          </div>
          {isAssignedEo && (
            <Button
              size="sm"
              variant="primary"
              onClick={() => {
                setNewNoteType("INTERIM_PROGRESS");
                setEnquiryNoteModalOpen(true);
              }}
              className="bg-amber-600 hover:bg-amber-700 text-white shrink-0 text-xs font-semibold gap-1.5 shadow-xs"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Submit Progress Report Now</span>
            </Button>
          )}
        </div>
      )}

      {/* Overview Particulars Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Left: 2 Columns of Details */}
            <div className="lg:col-span-2 space-y-5">
              {/* Complainant Details */}
              <Card className="border-slate-200 shadow-xs">
                <CardContent className="p-4 sm:p-5 space-y-3">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-[#0b192c] border-b border-slate-100 pb-2 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-blue-600" />
                    <span>1. Complainant Particulars</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500 block">Full Name:</span>
                      <strong className="text-slate-900 text-sm">{complaint.complainantName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Father / Spouse Name:</span>
                      <strong className="text-slate-800">{complaint.complainantFatherSpouse || "Not specified"}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Contact Phone:</span>
                      <strong className="text-slate-900 font-mono">{complaint.complainantMobile}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Gender & Age:</span>
                      <strong className="text-slate-800">
                        {complaint.complainantGender} • {complaint.complainantAge || "Adult"} Years
                      </strong>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-slate-500 block">Address:</span>
                      <strong className="text-slate-800">
                        {complaint.complainantAddress}, {complaint.complainantCity}, {complaint.complainantDistrict}
                      </strong>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Incident Facts */}
              <Card className="border-slate-200 shadow-xs">
                <CardContent className="p-4 sm:p-5 space-y-3">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-[#0b192c] border-b border-slate-100 pb-2 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    <span>2. Incident Facts & Statement</span>
                  </h3>
                  <div className="space-y-2 text-xs">
                    {(complaint.complaintSubject || (complaint as any).subject) && (
                      <div className="p-2.5 bg-blue-50/70 rounded-lg border border-blue-200/60 text-xs">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 block mb-0.5">
                          Subject:
                        </span>
                        <strong className="text-slate-900 font-semibold text-sm">
                          {complaint.complaintSubject || (complaint as any).subject}
                        </strong>
                      </div>
                    )}
                    <div className="flex flex-wrap items-center gap-4 text-slate-600">
                      <span>
                        <strong>Date:</strong> {complaint.incidentDate || "Not recorded"}
                      </span>
                      <span>
                        <strong>Occurrence Place:</strong> {complaint.incidentPlace}
                      </span>
                      {complaint.incidentLandmark && (
                        <span>
                          <strong>Landmark:</strong> {complaint.incidentLandmark}
                        </span>
                      )}
                    </div>
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 leading-relaxed font-sans text-xs sm:text-sm">
                      {complaint.incidentDetails}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Accused / Suspect Information */}
              <Card className="border-slate-200 shadow-xs">
                <CardContent className="p-4 sm:p-5 space-y-3">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-[#0b192c] border-b border-slate-100 pb-2 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-amber-600" />
                    <span>3. Accused / Suspect Information</span>
                  </h3>
                  {complaint.accusedList && complaint.accusedList.length > 0 ? (
                    <div className="space-y-2">
                      {complaint.accusedList.map((acc, i) => (
                        <div key={i} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <strong className="text-slate-900 text-sm">{acc.name}</strong>
                            {acc.relationWithComplainant && (
                              <span className="text-[11px] font-medium text-slate-500 bg-slate-200/60 px-2 py-0.5 rounded">
                                {acc.relationWithComplainant}
                              </span>
                            )}
                          </div>
                          {acc.fatherName && <p className="text-slate-600">Father/Guardian: {acc.fatherName}</p>}
                          {acc.address && <p className="text-slate-600">Address: {acc.address}</p>}
                          {acc.phone && <p className="text-slate-600 font-mono">Contact: {acc.phone}</p>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">No specific accused named in initial statement.</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right: Quick Action & Officer Roster Status */}
            <div className="space-y-5">
              {/* Enquiry Officer & Directions Card */}
              <Card className="border-slate-200 shadow-xs">
                <CardContent className="p-4 sm:p-5 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-[#0b192c] flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                      <span>Supervisory Roster & Directions</span>
                    </h3>
                  </div>

                  {complaint.assignedEoName ? (
                    <div className="space-y-3 text-xs">
                      <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl space-y-1.5">
                        <div className="flex items-center justify-between">
                          <strong className="text-slate-900">{complaint.assignedEoName}</strong>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            Active EO
                          </span>
                        </div>
                        <p className="text-slate-600 text-[11px]">
                          {complaint.assignedEoRank} • PNO: {complaint.assignedEoPno}
                        </p>
                        <p className="text-blue-900 font-semibold text-[11px]">
                          Roster Duty: {complaint.assignedRosterDuty || "Field Enquiry"}
                        </p>
                      </div>

                      {complaint.assignedDirections && (
                        <div>
                          <span className="text-slate-500 font-medium block mb-1">Supervisory Directions:</span>
                          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-sans leading-relaxed">
                            {complaint.assignedDirections}
                          </div>
                        </div>
                      )}

                      {/* EO Recommendation & SHO Final Decision Status Box */}
                      {(complaint.eoRecommendedCategory || complaint.finalCategory || complaint.isSentToSho) && (
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                          <h4 className="font-bold text-[11px] uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1 flex items-center justify-between">
                            <span>Case Recommendation &amp; Decision</span>
                            <span className="font-mono text-[10px] text-slate-500">
                              {complaint.finalStatus || getMainComplaintStatus(complaint)}
                            </span>
                          </h4>

                          {/* EO Recommendation */}
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-600 font-medium">EO Recommendation:</span>
                            <span className="font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                              {complaint.eoRecommendedCategory
                                ? (complaint.eoRecommendedCategory === "FIR_RECOMMEND" ? "FIR Recommend" : complaint.eoRecommendedCategory === "CLOSURE" ? "Closure" : "NCR")
                                : (complaint.eoOutcome || "Pending")}
                            </span>
                          </div>

                          {/* SHO Final Decision */}
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-600 font-medium">SHO Final Decision:</span>
                            {complaint.shoDecision === "APPROVE" ? (
                              <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                                <CheckCircle className="w-3 h-3 text-emerald-600" />
                                <span>Approved</span>
                              </span>
                            ) : complaint.shoDecision === "REJECT" ? (
                              <span className="font-bold text-rose-800 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                                Rejected
                              </span>
                            ) : complaint.isSentToSho ? (
                              <span className="font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[11px]">
                                Awaiting Decision
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[11px]">Enquiry Stage</span>
                            )}
                          </div>

                          {/* Final Category */}
                          {complaint.finalCategory && (
                            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200">
                              <span className="text-slate-700 font-bold">Final Category:</span>
                              <span className={`font-black px-2.5 py-0.5 rounded-full text-[11px] ${
                                complaint.finalCategory === "FIR Recommend"
                                  ? "bg-red-100 text-red-900 border border-red-300"
                                  : complaint.finalCategory === "NCR"
                                  ? "bg-blue-100 text-blue-900 border border-blue-300"
                                  : "bg-emerald-100 text-emerald-900 border border-emerald-300"
                              }`}>
                                {complaint.finalCategory}
                              </span>
                            </div>
                          )}

                          {/* Register FIR button in card if FIR Recommend */}
                          {complaint.finalCategory === "FIR Recommend" && !complaint.isFirRegistered && isSho && (
                            <div className="pt-1.5">
                              <Button
                                type="button"
                                size="sm"
                                variant="primary"
                                onClick={() => {
                                  setFirSections(complaint.firSections || "Section 115(2), 351(2), 3(5) BNS, 2023");
                                  setFirNumber(`HAR-KKR-2026-FIR-${Math.floor(100 + Math.random() * 900)}`);
                                  setFirModalOpen(true);
                                }}
                                className="w-full text-xs font-bold gap-1 bg-red-600 hover:bg-red-700 text-white shadow-xs justify-center"
                              >
                                <Scale className="w-3.5 h-3.5" />
                                <span>Register FIR</span>
                              </Button>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="pt-2 border-t border-slate-100 space-y-2">
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span>Target: <strong className="text-slate-800">{complaint.targetResolutionDate ? formatDate(complaint.targetResolutionDate) : "14 Days"}</strong></span>
                          {isAssignedEo ? (
                            <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[10px]">
                              Assigned to You
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                              Allocated
                            </span>
                          )}
                        </div>

                        {/* Supervisory Actions: Ask Progress Report & Reassign EO */}
                        {canAssign && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                            <Button
                              type="button"
                              size="sm"
                              variant="primary"
                              onClick={() => setProgressModalOpen(true)}
                              className="w-full text-xs font-semibold gap-1.5 bg-amber-600 hover:bg-amber-700 text-white shadow-2xs cursor-pointer justify-center"
                              title="Ask Enquiry Officer for Interim Progress Report"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>Ask Progress Report</span>
                            </Button>
                            <div className="relative w-full" data-assign-eo-dropdown>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => setAssignEoDropdownOpen((prev) => !prev)}
                                className="w-full text-xs font-semibold gap-1 text-slate-700 hover:bg-slate-50 border-slate-200 cursor-pointer justify-center"
                                title="Reassign to another Enquiry Officer"
                              >
                                <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                                <span>Reassign EO ▾</span>
                              </Button>
                              {assignEoDropdownOpen && (
                                <div className="absolute right-0 bottom-full sm:bottom-auto sm:top-full mt-1 mb-1 z-50 w-56 bg-white border border-slate-200 rounded-xl shadow-xl py-1 text-left animate-in fade-in-50">
                                  <div className="px-3 py-1.5 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                                    <span>Select EO / IO</span>
                                    <span className="text-slate-400 font-mono text-[9px]">Rank &amp; Name</span>
                                  </div>
                                  <div className="max-h-56 overflow-y-auto py-0.5">
                                    {MOCK_ENQUIRY_OFFICERS.map((eo) => {
                                      const label = eo.name.startsWith(eo.rank) ? eo.name : `${eo.rank} ${eo.name}`;
                                      const isSelected = complaint.assignedEoId === eo.id || complaint.assignedEoName?.toLowerCase().includes(eo.name.toLowerCase());
                                      return (
                                        <button
                                          key={eo.id}
                                          type="button"
                                          disabled={isQuickAssigning}
                                          onClick={() => handleQuickAssignEO(eo)}
                                          className={`w-full text-left px-3 py-1.5 text-xs font-semibold transition-colors flex items-center justify-between cursor-pointer ${
                                            isSelected
                                              ? "bg-blue-50 text-blue-900 font-bold"
                                              : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                                          }`}
                                        >
                                          <span className="truncate">{label}</span>
                                          {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-center space-y-2 text-xs">
                      <p className="font-bold text-amber-900">Enquiry Officer Not Yet Assigned</p>
                      <p className="text-amber-700 text-[11px]">
                        Allocate an officer from active duty roster with specific directions.
                      </p>
                      {canAssign && (
                        <div className="relative w-full" data-assign-eo-dropdown>
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => setAssignEoDropdownOpen((prev) => !prev)}
                            className="w-full text-xs font-semibold gap-1 justify-center bg-[#0b192c] text-white hover:bg-slate-800 cursor-pointer shadow-2xs"
                          >
                            <UserCheck className="w-3.5 h-3.5 text-amber-300" /> Assign Enquiry Officer ▾
                          </Button>
                          {assignEoDropdownOpen && (
                            <div className="absolute left-0 bottom-full sm:bottom-auto sm:top-full mt-1 mb-1 z-50 w-full bg-white border border-slate-200 rounded-xl shadow-xl py-1 text-left animate-in fade-in-50">
                              <div className="px-3 py-1.5 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                                <span>Select EO / IO</span>
                                <span className="text-slate-400 font-mono text-[9px]">Rank &amp; Name</span>
                              </div>
                              <div className="max-h-56 overflow-y-auto py-0.5">
                                {MOCK_ENQUIRY_OFFICERS.map((eo) => {
                                  const label = eo.name.startsWith(eo.rank) ? eo.name : `${eo.rank} ${eo.name}`;
                                  const isSelected = complaint.assignedEoId === eo.id || complaint.assignedEoName?.toLowerCase().includes(eo.name.toLowerCase());
                                  return (
                                    <button
                                      key={eo.id}
                                      type="button"
                                      disabled={isQuickAssigning}
                                      onClick={() => handleQuickAssignEO(eo)}
                                      className={`w-full text-left px-3 py-1.5 text-xs font-semibold transition-colors flex items-center justify-between cursor-pointer ${
                                        isSelected
                                          ? "bg-blue-50 text-blue-900 font-bold"
                                          : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                                      }`}
                                    >
                                      <span className="truncate">{label}</span>
                                      {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Summary Card */}
              <Card className="border-slate-200 shadow-xs">
                <CardContent className="p-4 sm:p-5 space-y-2.5 text-xs">
                  <h3 className="font-bold uppercase tracking-wider text-[#0b192c] border-b border-slate-100 pb-2">
                    Case Meta & Registry
                  </h3>
                  <div className="space-y-2 text-slate-600">
                    <div className="flex justify-between">
                      <span>Source Channel:</span>
                      <strong className="text-slate-900">{complaint.source.replace(/_/g, " ")}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Intake Officer:</span>
                      <strong className="text-slate-900">{complaint.registeredBy}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>General Diary:</span>
                      <strong className="text-emerald-700">PPR 22.48 Certified</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Documents Docket:</span>
                      <strong className="text-slate-900">{combinedDocuments.length} Files</strong>
                    </div>

                    {complaint.assignedEoName && (
                      <div className="pt-2.5 border-t border-slate-100">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setShowReceiptModal(true)}
                          className="w-full text-xs font-semibold gap-1.5 text-emerald-800 border-emerald-300 bg-emerald-50 hover:bg-emerald-100 cursor-pointer shadow-2xs"
                        >
                          <Printer className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Print Official Receipt</span>
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

        {/* TAB 2: DOCUMENTS (Official repository for all evidence, intake documents, autofill forms, and case files) */}
        {activeTab === "documents" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                  <UploadCloud className="w-5 h-5 text-blue-600" />
                  <span>Official Documents &amp; Evidence Repository</span>
                </h3>
                <p className="text-xs text-slate-500">
                  All citizen complaints, uploaded evidence, autofill documents, MLR copies, and official files sealed in case docket.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative" ref={generateDocDropdownRef}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setGenerateDocDropdownOpen(!generateDocDropdownOpen)}
                    className="gap-1.5 text-xs font-semibold border-purple-300 text-purple-800 bg-purple-50 hover:bg-purple-100 cursor-pointer shadow-2xs"
                  >
                    <ScrollText className="w-3.5 h-3.5 text-purple-700" />
                    <span>Generate Document</span>
                    <ChevronDown className={`w-3 h-3 text-purple-600 transition-transform duration-200 ${generateDocDropdownOpen ? "rotate-180" : ""}`} />
                  </Button>

                  {generateDocDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-84 bg-white rounded-xl shadow-xl border border-slate-200 p-1.5 z-40 animate-in fade-in-50 zoom-in-95">
                      <div className="px-3 py-2 border-b border-slate-100">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-purple-800">
                          Select Notice / Document Template
                        </p>
                        <p className="text-[10px] text-slate-500">
                          Preloaded with Complaint {complaint.complaintNumber}
                        </p>
                      </div>
                      <div className="py-1">
                        {TEMPLATE_DROPDOWN_OPTIONS.map((tmpl) => {
                          const IconComponent = tmpl.icon;
                          return (
                            <button
                              key={tmpl.key}
                              type="button"
                              onClick={() => {
                                setGenerateDocDropdownOpen(false);
                                router.push(`/enquiry-workspace/templates?complaintId=${complaint.id}&template=${tmpl.key}`);
                              }}
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
                {canUploadDocument && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setDocumentModalOpen(true)}
                    className="gap-1.5 text-xs font-semibold self-start sm:self-auto cursor-pointer"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Upload Document</span>
                  </Button>
                )}
              </div>
            </div>

            {combinedDocuments && combinedDocuments.length > 0 ? (
              <Card className="border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Document / File Name</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4">Uploaded By</th>
                        <th className="py-3 px-4">Date &amp; Time</th>
                        <th className="py-3 px-4 text-right">Size</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {combinedDocuments.map((doc) => {
                        const cat = detectCategory(doc.fileName, doc.fileCategory);
                        return (
                          <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3 px-4 font-semibold text-slate-900">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div
                                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                    cat === "image"
                                      ? "bg-emerald-100 text-emerald-700"
                                      : cat === "video"
                                      ? "bg-purple-100 text-purple-700"
                                      : cat === "audio"
                                      ? "bg-amber-100 text-amber-700"
                                      : "bg-blue-100 text-blue-700"
                                  }`}
                                >
                                  {cat === "image" && <ImageIcon className="w-4 h-4" />}
                                  {cat === "video" && <Video className="w-4 h-4" />}
                                  {cat === "audio" && <Music className="w-4 h-4" />}
                                  {cat === "document" && <FileText className="w-4 h-4" />}
                                  {cat === "other" && <Paperclip className="w-4 h-4" />}
                                </div>
                                <div className="min-w-0">
                                  <p className="truncate font-semibold text-slate-900" title={doc.fileName}>
                                    {doc.fileName}
                                  </p>
                                  {doc.description && (
                                    <p className="text-[10px] text-slate-500 truncate" title={doc.description}>
                                      {doc.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                                {doc.fileCategory}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-700">{doc.uploadedBy}</td>
                            <td className="py-3 px-4 text-slate-500 font-mono">
                              {formatDateTime(doc.uploadedAt)}
                            </td>
                            <td className="py-3 px-4 text-right font-mono text-slate-500">{doc.fileSize}</td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handlePreviewDocument(doc)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
                                  title="Instant Preview without downloading"
                                >
                                  <Eye className="w-3.5 h-3.5 text-blue-600" />
                                  <span>Preview</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDownloadDocument(doc)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 rounded-lg text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
                                  title="Download file"
                                >
                                  <Download className="w-3.5 h-3.5 text-slate-600" />
                                  <span>Download</span>
                                </button>
                                {(isAssignedEo || isSho || currentUser.role === "SUPER_ADMIN") && (
                                  <button
                                    onClick={() => handleDeleteDocument(doc.id)}
                                    className="text-slate-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors inline-flex items-center cursor-pointer"
                                    title="Delete document"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            ) : (
              <Card className="border-dashed border-2 border-slate-200">
                <CardContent className="p-8 text-center space-y-3">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">No Documents Uploaded</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Upload MLR reports, citizen petitions, evidence attachments, or bank statements.
                    </p>
                  </div>
                  {canUploadDocument ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDocumentModalOpen(true)}
                      className="gap-1.5 text-xs font-semibold cursor-pointer"
                    >
                      <UploadCloud className="w-3.5 h-3.5" /> Upload Document
                    </Button>
                  ) : (
                    <p className="text-xs text-slate-400 font-medium italic">
                      No case documents currently uploaded to docket.
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* TAB: LEGAL ASSISTANT (BNS, BNSS, BSA Statutory Analysis & Bare Act Indexing) */}
        {activeTab === "legal_assistant" && (
          <ComplaintLegalAssistant
            complaint={complaint}
            onUpdateComplaint={async (updated) => {
              setComplaint(updated);
              if (updated.legalAnalysis) {
                try {
                  await ComplaintService.saveLegalAnalysis(updated.id, updated.legalAnalysis);
                } catch (e) {
                  console.error("Failed to persist legal analysis", e);
                }
              }
            }}
          />
        )}

        {/* TAB: SUMMARY (Deep Investigation Case Summary: Overview, Documents & History) */}
        {activeTab === "summary" && (
          <ComplaintSummaryTab
            complaint={complaint}
            currentUser={currentUser}
            onUpdateComplaint={async (updated) => {
              setComplaint(updated);
              if (updated.investigationSummary) {
                try {
                  await ComplaintService.saveInvestigationSummary(updated.id, updated.investigationSummary);
                } catch (e) {
                  console.error("Failed to persist investigation summary", e);
                }
              }
            }}
          />
        )}

        {/* TAB 5: LINKS (Cross, Linked, Repeated) */}
        {activeTab === "links" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  Linked, Cross & Repeated Complaints Intelligence
                </h3>
                <p className="text-xs text-slate-500">
                  Cross-verify mutual disputes, repeated complainant history, and clubbed inquiries.
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setLinkModalOpen(true)}
                className="gap-1.5 text-xs font-semibold self-start sm:self-auto"
              >
                <Link2 className="w-3.5 h-3.5" />
                <span>Link Another Complaint</span>
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Cross Complaint Card */}
              <Card className="border-slate-200 shadow-xs">
                <CardContent className="p-4 sm:p-5 space-y-3 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <strong className="text-slate-900 flex items-center gap-1.5">
                      <ArrowRightLeft className="w-3.5 h-3.5 text-purple-600" />
                      <span>Cross-Complaint Relationship</span>
                    </strong>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                      Mutual Dispute
                    </span>
                  </div>

                  {complaint.isCrossComplaint || complaint.crossComplaintNumber ? (
                    <div className="p-3 bg-purple-50/60 border border-purple-200 rounded-lg space-y-1.5">
                      <p className="font-bold text-purple-950 font-mono">
                        Cross Reference: {complaint.crossComplaintNumber || complaint.linkedComplaintNumber}
                      </p>
                      <p className="text-purple-900 leading-relaxed">
                        Parties have filed counter allegations arising out of the same occurrence at {complaint.incidentPlace}.
                      </p>
                    </div>
                  ) : (
                    <p className="text-slate-500 italic">No counter/cross complaint currently registered.</p>
                  )}
                </CardContent>
              </Card>

              {/* Linked Complaint Card */}
              <Card className="border-slate-200 shadow-xs">
                <CardContent className="p-4 sm:p-5 space-y-3 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <strong className="text-slate-900 flex items-center gap-1.5">
                      <Link2 className="w-3.5 h-3.5 text-blue-600" />
                      <span>Linked & Clubbed Inquiries</span>
                    </strong>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                      Joint Enquiry
                    </span>
                  </div>

                  {complaint.linkedComplaintNumber ? (
                    <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-lg space-y-1.5">
                      <p className="font-bold text-blue-950 font-mono">
                        Linked Reference: {complaint.linkedComplaintNumber}
                      </p>
                      <p className="text-blue-900 leading-relaxed">
                        Inquiries clubbed together under Section 173(3) BNSS for unified verification.
                      </p>
                    </div>
                  ) : (
                    <p className="text-slate-500 italic">No external complaints linked to this file.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* TAB 4: REPORTS (Official Enquiry Reports & NCR Docket) */}
        {activeTab === "reports" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                  <FileCheck2 className="w-5 h-5 text-amber-600" />
                  <span>Official Enquiry Reports &amp; NCRs Docket</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Legal enquiry drafts, field verification reports, compromise deeds, and Non-Cognizable Reports (NCR) recorded for this complaint.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setUploadReportModalOpen(true)}
                  className="gap-1.5 text-xs font-semibold border-slate-300 text-slate-800 bg-slate-50 hover:bg-slate-100 cursor-pointer shadow-2xs"
                >
                  <UploadCloud className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Upload Report</span>
                </Button>

                <div className="relative" ref={generateReportDropdownRef}>
                  <div className="inline-flex rounded-lg shadow-xs">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleNavigateToReportDraft("GAMINI")}
                      className="gap-1.5 text-xs font-bold bg-[#0b192c] hover:bg-slate-900 text-white rounded-r-none cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Generate Report</span>
                    </Button>
                    <button
                      type="button"
                      onClick={() => setGenerateReportDropdownOpen(!generateReportDropdownOpen)}
                      className="px-2 py-1.5 bg-[#0b192c] hover:bg-slate-900 text-white border-l border-slate-700 rounded-r-lg transition-colors cursor-pointer"
                      title="Select Recommendation Report Type"
                    >
                      <ChevronDown className={`w-3.5 h-3.5 text-amber-300 transition-transform duration-200 ${generateReportDropdownOpen ? "rotate-180" : ""}`} />
                    </button>
                  </div>

                  {generateReportDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-slate-200 p-2 z-40 animate-in fade-in-50 zoom-in-95">
                      <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
                        <div>
                          <p className="text-[11px] font-black uppercase tracking-wider text-amber-800 flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                            <span>Select Recommendation Report (6 Types)</span>
                          </p>
                          <p className="text-[10px] text-slate-500">
                            Preloaded with Complaint #{complaint.complaintNumber}
                          </p>
                        </div>
                        <span className="text-[10px] font-mono bg-amber-50 text-amber-900 px-1.5 py-0.5 rounded border border-amber-200">
                          Automatic Draft
                        </span>
                      </div>
                      <div className="py-1.5 space-y-1">
                        {REPORT_DROPDOWN_OPTIONS.map((cat) => {
                          const IconComponent = cat.icon;
                          return (
                            <button
                              key={cat.key}
                              type="button"
                              onClick={() => {
                                handleNavigateToReportDraft(cat.key);
                              }}
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
                                    Auto Draft
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
                      <div className="pt-2 border-t border-slate-100 px-2 flex items-center justify-between">
                        <Link
                          href={`/enquiry-workspace/drafts?complaintId=${complaint.id}`}
                          className="text-[11px] text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 font-medium"
                          onClick={() => setGenerateReportDropdownOpen(false)}
                        >
                          <span>Open Full Enquiry Workspace</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Reports List */}
            {complaint.reports && complaint.reports.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {complaint.reports.map((report) => {
                  const isSavedInComplaint = report.status === "Saved in Complaint" || report.status === "Saved" || !report.status;
                  const isDraftStatus = report.status === "Draft";

                  return (
                    <Card key={report.id} className="border-slate-200 shadow-xs hover:shadow-md transition-shadow">
                      <CardContent className="p-4 space-y-3 text-xs">
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5">
                              {/* Recommendation Type Badges (Gamini, Diwani, NCR, FIR, Nivaran, Razinama) */}
                              {report.recommendationType === "GAMINI" || report.recommendationType === "JAMINI_LAND_DISPUTE" ? (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-300 font-semibold flex items-center gap-1">
                                  🌾 Gamini (Land Dispute)
                                </span>
                              ) : report.recommendationType === "DIWANI" || report.recommendationType === "DIWANI_CIVIL_MONEY" ? (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-300 font-semibold flex items-center gap-1">
                                  💼 Diwani (Civil Dealing)
                                </span>
                              ) : report.recommendationType === "NCR" ? (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-800 border border-purple-300 font-semibold flex items-center gap-1">
                                  📄 NCR (u/s 174 BNSS)
                                </span>
                              ) : report.recommendationType === "FIR" || report.recommendationType === "FIR_RECOMMENDED" || report.isFirRecommended ? (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-50 text-red-800 border border-red-300 font-semibold flex items-center gap-1">
                                  🚨 FIR Recommended
                                </span>
                              ) : report.recommendationType === "NIVARAN" || report.recommendationType === "NIVARAK_PREVENTIVE" ? (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-800 border border-indigo-300 font-semibold flex items-center gap-1">
                                  🛡️ Nivaran (BNSS 126/170)
                                </span>
                              ) : report.recommendationType === "RAZINAMA" || report.recommendationType === "RAJINAMA_COMPROMISE" ? (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-300 font-semibold flex items-center gap-1">
                                  🤝 Razinama (Compromise)
                                </span>
                              ) : (
                                <span className="font-bold text-xs uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-300 font-mono">
                                  {report.reportTypeLabel || report.reportType}
                                </span>
                              )}

                              {/* Version Number */}
                              {report.versionNumber && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-300 font-mono">
                                  v{report.versionNumber}
                                </span>
                              )}

                              {/* Status Badge: "Saved in Complaint" vs "Draft" */}
                              {isDraftStatus ? (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 font-mono">
                                  Status: Draft
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300 font-mono flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3 text-emerald-600" />
                                  <span>Saved in Complaint</span>
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
                            Created By: <strong className="text-slate-800">{report.createdBy || report.officerName}</strong> ({report.officerRank || "EO"})
                          </span>
                          <span className="font-mono uppercase font-semibold">
                            {report.fileFormat || "TXT"} {report.fileSize ? `• ${report.fileSize}` : ""}
                          </span>
                        </div>

                        {/* Action buttons: View, Edit, Download, Print, Create New Version */}
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

                          {/* 2. Edit (Re-opens in Draft Editor) */}
                          {!report.isUploaded && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const rec = (report.recommendationType as RecommendationReportType) || "GAMINI";
                                handleNavigateToReportDraft(rec, report, false);
                              }}
                              className="text-[11px] h-7 px-2.5 gap-1 border-slate-200 text-amber-800 bg-amber-50/50 hover:bg-amber-100 cursor-pointer font-semibold"
                              title="Edit this draft report"
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
                            onClick={() => {
                              if (report.dataUrl) {
                                const link = document.createElement("a");
                                link.href = report.dataUrl;
                                link.download = report.fileName || `${report.title}.pdf`;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                              } else if (report.content) {
                                const blob = new Blob([report.content], { type: "text/plain;charset=utf-8" });
                                const url = URL.createObjectURL(blob);
                                const link = document.createElement("a");
                                link.href = url;
                                link.download = `${report.title.replace(/[^a-zA-Z0-9_-]/g, "_")}.txt`;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                                URL.revokeObjectURL(url);
                              }
                            }}
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
                            onClick={() => {
                              const printWindow = window.open("", "_blank", "width=900,height=800");
                              if (!printWindow) {
                                alert("Please allow popups to print report.");
                                return;
                              }
                              const html = report.contentHtml || `<pre style="font-family: Arial; padding: 20px; white-space: pre-wrap;">${report.content || ""}</pre>`;
                              printWindow.document.write(`
                                <!DOCTYPE html>
                                <html>
                                  <head><title>${report.title}</title><style>@media print { body { margin: 15mm; } @page { size: A4; margin: 15mm; } }</style></head>
                                  <body>${html}<script>window.onload = function() { window.print(); window.onafterprint = function() { window.close(); }; };</script></body>
                                </html>
                              `);
                              printWindow.document.close();
                            }}
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
                              onClick={() => {
                                const rec = (report.recommendationType as RecommendationReportType) || "GAMINI";
                                handleNavigateToReportDraft(rec, report, true);
                              }}
                              className="text-[11px] h-7 px-2.5 gap-1 border-purple-200 bg-purple-50 text-purple-800 hover:bg-purple-100 cursor-pointer font-semibold"
                              title="Create new version based on this report"
                            >
                              <Plus className="w-3 h-3 text-purple-600" />
                              <span>New Version</span>
                            </Button>
                          )}

                          {/* Send to SHO button (if applicable) */}
                          {!isMhc && !complaint.isSentToSho && (
                            <Button
                              type="button"
                              variant="primary"
                              size="sm"
                              onClick={() => handleOpenEoSendToShoModal(report)}
                              disabled={sendingReportToSho}
                              className="text-[11px] h-7 px-2.5 gap-1 bg-red-600 hover:bg-red-700 text-white font-bold cursor-pointer shadow-xs"
                              title="Send Enquiry Report to SHO for Review & Approval"
                            >
                              <Send className="w-3 h-3" />
                              <span>{sendingReportToSho ? "Sending..." : "Send to SHO"}</span>
                            </Button>
                          )}
                          {complaint.isSentToSho && (
                            <span className="text-[10px] font-bold px-2 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1 font-mono">
                              <Check className="w-3 h-3 text-blue-600" />
                              <span>Sent to SHO</span>
                            </span>
                          )}

                          {/* Delete Report */}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteReport(report.id)}
                            className="text-[11px] h-7 px-2 text-red-600 hover:bg-red-50 border-red-200 cursor-pointer"
                            title="Delete report"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="border-slate-200 border-dashed bg-slate-50/50">
                <CardContent className="p-8 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                    <FileCheck2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-800">No Reports Generated Yet</h4>
                    <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                      Generate a category-specific police report (Civil dispute, Financial fraud, NCR, Matrimonial, Cyber crime) or upload a signed report copy.
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => {
                        window.scrollTo({ top: 0, behavior: "smooth" });
                        setGenerateReportDropdownOpen(true);
                      }}
                      className="gap-1 text-xs font-bold bg-[#0b192c]"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Generate Report Now</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setUploadReportModalOpen(true)}
                      className="gap-1 text-xs font-semibold"
                    >
                      <UploadCloud className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Upload Signed File</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* TAB 6: HISTORY (Official Case History Timeline matching PPR / CMS) */}
        {activeTab === "history" && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-2xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <HistoryIcon className="w-4 h-4 text-blue-600" />
                  <span>Case History &amp; Proceedings Timeline</span>
                  <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    {combinedHistory.length} Steps
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Chronological progression of actions taken (Jo kaam pehle hua hai vo pehle)
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setHistorySortOrder(historySortOrder === "asc" ? "desc" : "asc")}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
                  title="Toggle Chronological Order"
                >
                  <ArrowUpDown className="w-3.5 h-3.5 text-blue-600" />
                  <span>
                    {historySortOrder === "asc"
                      ? "Earliest First (Pehle hua kaam pehle)"
                      : "Latest First (Naya kaam pehle)"}
                  </span>
                </button>
              </div>
            </div>

            <div className="relative pl-7 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-blue-300">
              {combinedHistory.map((item, index) => (
                <div key={item.id} className="relative group">
                  {/* Timeline Blue Dot */}
                  <div className="absolute -left-[22px] top-1 w-2.5 h-2.5 rounded-full bg-blue-600 ring-2 ring-white shadow-2xs" />

                  <div className="space-y-0.5">
                    {/* Event Title (Uppercase Blue) */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm font-bold text-blue-600 tracking-wider uppercase">
                        {item.title}
                      </span>
                      <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
                        Step #{index + 1}
                      </span>
                    </div>

                    {/* Date Time & Officer Subline */}
                    <div className="text-xs text-slate-500 font-sans">
                      {formatDateTime(item.timestamp)} · {item.officerName}
                    </div>

                    {/* Description / Details Line */}
                    <div className="text-xs sm:text-sm text-slate-800 font-medium font-sans leading-relaxed">
                      {item.details}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 7: CONFIDENTIAL DOSSIER (Strictly Restricted to Enquiry Officer ID - Isolated from Complaint File) */}
        {activeTab === "confidential_dossier" && isEoPersona && (
          <div className="space-y-5 animate-in fade-in-0 duration-200">
            {/* Top Secrecy & Memory Protocol Banner */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-[#0d1f38] to-slate-900 border-2 border-amber-500/40 rounded-2xl shadow-md text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase tracking-wider">
                    <Lock className="w-3 h-3 text-amber-400" />
                    <span>EO Case Memory &amp; Classified Diary</span>
                  </span>
                  <span className="text-xs font-mono text-slate-300 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
                    Officer: {currentUser.name} ({currentUser.rankDisplay || "Enquiry Officer"})
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-rose-400 bg-rose-950/60 border border-rose-800/50 px-2 py-0.5 rounded">
                    Strictly Isolated
                  </span>
                </div>
                <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  <span>Confidential Dossier • Enquiry Memory Notes</span>
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
                  Ye record complaint se attach nahi hoga khi bhi. Ye sirf aapke personal record, secret informant leads, off-the-record observations aur strategy yaad rakhne ke liye hai. Yeh kisi supervisory officer, citizen receipt ya public case history me show nahi hota.
                </p>
              </div>

              <div className="shrink-0 flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  variant="primary"
                  onClick={handleOpenUploadDossier}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs gap-1.5 shadow-sm px-3.5 py-2 cursor-pointer"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>Upload Dossier File</span>
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={handleOpenNoteDossier}
                  className="bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs gap-1.5 shadow-sm px-3.5 py-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Memory Note</span>
                </Button>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                {/* Search */}
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={dossierSearch}
                    onChange={(e) => setDossierSearch(e.target.value)}
                    placeholder="Search confidential notes, informant tags, suspect keywords..."
                    className="w-full text-xs rounded-lg border border-slate-300 pl-3 pr-8 py-2 text-slate-900 placeholder:text-slate-400 bg-slate-50/50 focus:bg-white focus:border-blue-500 focus:outline-none"
                  />
                  {dossierSearch && (
                    <button
                      onClick={() => setDossierSearch("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                    >
                      &times;
                    </button>
                  )}
                </div>

                {/* Category Filter */}
                <select
                  value={dossierFilterCategory}
                  onChange={(e) => setDossierFilterCategory(e.target.value)}
                  className="text-xs rounded-lg border border-slate-300 px-3 py-2 text-slate-800 bg-slate-50/50 focus:bg-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="ALL">All Categories ({complaint.confidentialDossier?.length || 0})</option>
                  {Object.entries(DOSSIER_CATEGORY_CONFIG).map(([key, config]) => (
                    <option key={key} value={key}>
                      {config.iconText} {config.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="text-[11px] font-semibold text-slate-500 shrink-0">
                Showing <strong>{filteredDossierEntries.length}</strong> of {complaint.confidentialDossier?.length || 0} Entries
              </div>
            </div>

            {/* Dossier Notes List */}
            {filteredDossierEntries.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 sm:p-12 text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto shadow-2xs">
                  <Lock className="w-7 h-7" />
                </div>
                <div className="max-w-md mx-auto space-y-1">
                  <h4 className="text-sm sm:text-base font-bold text-slate-900">
                    {dossierSearch || dossierFilterCategory !== "ALL"
                      ? "No matching confidential notes found"
                      : "No Confidential Dossier Entries Recorded Yet"}
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {dossierSearch || dossierFilterCategory !== "ALL"
                      ? "Try adjusting your search keywords or category filter."
                      : "Keep personal notes, confidential audio/call recordings, videos, PDFs, Word documents, or photos strictly for your own investigation diary. Nothing added here is attached to the complaint or shared outside."}
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={handleOpenUploadDossier}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold gap-1.5 shadow-xs cursor-pointer"
                  >
                    <UploadCloud className="w-4 h-4" />
                    <span>Upload Audio, Video, PDF, Word or Doc</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleOpenNoteDossier}
                    className="border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Write Note</span>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredDossierEntries.map((entry) => {
                  const catConfig = DOSSIER_CATEGORY_CONFIG[entry.category] || {
                    label: entry.category,
                    badgeClass: "bg-slate-100 text-slate-800 border-slate-200",
                    iconText: "📝",
                  };
                  return (
                    <Card
                      key={entry.id}
                      className="border-slate-200 shadow-2xs hover:shadow-sm transition-shadow overflow-hidden bg-white"
                    >
                      <CardContent className="p-4 sm:p-5 space-y-3">
                        {/* Header Row */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md border flex items-center gap-1.5 ${catConfig.badgeClass}`}
                            >
                              <span>{catConfig.iconText}</span>
                              <span>{catConfig.label}</span>
                            </span>

                            {entry.referenceTag && (
                              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                                #{entry.referenceTag}
                              </span>
                            )}

                            {entry.attachmentType && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase tracking-wider">
                                {entry.attachmentType === "audio" && "🎧 Audio File"}
                                {entry.attachmentType === "video" && "🎬 Video File"}
                                {entry.attachmentType === "document" && "📄 Document / PDF"}
                                {entry.attachmentType === "image" && "📸 Image"}
                                {entry.attachmentType === "other" && "📁 File"}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>{formatDateTime(entry.createdAt)}</span>
                            </span>

                            <button
                              type="button"
                              onClick={() => handleDeleteDossier(entry.id)}
                              className="text-slate-400 hover:text-red-600 p-1 rounded-md hover:bg-red-50 transition-colors cursor-pointer"
                              title="Delete Confidential Entry"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Title & Officer */}
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">{entry.title}</h4>
                          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                            Recorded by: <strong className="text-slate-700">{entry.officerName}</strong> ({entry.officerRank || "EO"}, PNO: {entry.officerPno})
                          </div>
                        </div>

                        {/* Content */}
                        <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100 text-xs text-slate-800 leading-relaxed font-sans whitespace-pre-wrap">
                          {entry.content}
                        </div>

                        {/* Rich Attachment Section with Audio/Video/Doc/Image Players */}
                        {entry.attachmentName && (
                          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                            <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                              <div className="flex items-center gap-2 truncate pr-2">
                                {entry.attachmentType === "audio" && <Music className="w-4 h-4 text-amber-600 shrink-0" />}
                                {entry.attachmentType === "video" && <Video className="w-4 h-4 text-purple-600 shrink-0" />}
                                {entry.attachmentType === "image" && <ImageIcon className="w-4 h-4 text-emerald-600 shrink-0" />}
                                {entry.attachmentType === "document" && <FileText className="w-4 h-4 text-blue-600 shrink-0" />}
                                {!["audio", "video", "image", "document"].includes(entry.attachmentType || "") && (
                                  <Paperclip className="w-4 h-4 text-slate-600 shrink-0" />
                                )}
                                <span className="font-semibold text-slate-900 truncate text-xs">
                                  {entry.attachmentName}
                                </span>
                                {entry.attachmentSize && (
                                  <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-mono font-medium">
                                    {entry.attachmentSize}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                {entry.attachmentDataUrl && entry.attachmentType !== "audio" && entry.attachmentType !== "video" && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setPreviewModalFile({
                                        name: entry.attachmentName || "Dossier File",
                                        dataUrl: entry.attachmentDataUrl,
                                        category: entry.attachmentType || "document",
                                      })
                                    }
                                    className="text-blue-700 hover:text-blue-900 font-bold text-[11px] hover:underline flex items-center gap-1 cursor-pointer"
                                  >
                                    <Eye className="w-3 h-3" />
                                    <span>Preview</span>
                                  </button>
                                )}
                                {entry.attachmentDataUrl && (
                                  <a
                                    href={entry.attachmentDataUrl}
                                    download={entry.attachmentName}
                                    className="text-blue-700 hover:text-blue-900 font-bold text-[11px] hover:underline flex items-center gap-1 cursor-pointer"
                                  >
                                    <Download className="w-3 h-3" />
                                    <span>Download</span>
                                  </a>
                                )}
                              </div>
                            </div>

                            {/* Direct Inline Audio Player */}
                            {entry.attachmentType === "audio" && entry.attachmentDataUrl && (
                              <div className="pt-1 space-y-1">
                                <div className="text-[10px] text-amber-800 font-semibold flex items-center gap-1">
                                  <Volume2 className="w-3 h-3" />
                                  <span>Confidential Audio Playback (Call Recording / Voice Intel):</span>
                                </div>
                                <audio controls src={entry.attachmentDataUrl} className="w-full h-8 pt-0.5" />
                              </div>
                            )}

                            {/* Direct Inline Video Player */}
                            {entry.attachmentType === "video" && entry.attachmentDataUrl && (
                              <div className="pt-1 space-y-1">
                                <div className="text-[10px] text-purple-800 font-semibold flex items-center gap-1">
                                  <Video className="w-3 h-3" />
                                  <span>Confidential Video Playback:</span>
                                </div>
                                <video controls src={entry.attachmentDataUrl} className="w-full max-h-56 rounded-lg bg-black" />
                              </div>
                            )}

                            {/* Image Thumbnail */}
                            {entry.attachmentType === "image" && entry.attachmentDataUrl && (
                              <div className="pt-1">
                                <img
                                  src={entry.attachmentDataUrl}
                                  alt={entry.attachmentName}
                                  onClick={() =>
                                    setPreviewModalFile({
                                      name: entry.attachmentName || "Photo",
                                      dataUrl: entry.attachmentDataUrl,
                                      category: "image",
                                    })
                                  }
                                  className="max-h-36 rounded-lg border border-slate-200 cursor-pointer object-cover hover:opacity-90 transition-opacity"
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL 1: ASSIGN ENQUIRY OFFICER (Removed: Instant inline dropdown used, rank & name only) */}

      {/* ========================================================================= */}
      {/* MODAL 2: RECORD ENQUIRY NOTE                                              */}
      {/* ========================================================================= */}
      {enquiryNoteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setEnquiryNoteModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-5 z-10 animate-in fade-in-0 zoom-in-95 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>Record Official Enquiry Note</span>
              </h3>
              <button onClick={() => setEnquiryNoteModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddEnquiryNote} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Note Type / Activity</label>
                <select
                  value={newNoteType}
                  onChange={(e) => setNewNoteType(e.target.value as EnquiryNoteItem["noteType"])}
                  className="w-full rounded-lg border border-slate-300 p-2 text-slate-900 bg-white"
                >
                  <option value="SPOT_VISIT">Spot Inspection / Scene Visit</option>
                  <option value="WITNESS_EXAMINATION">Witness Statement (Section 180 BNSS)</option>
                  <option value="ACCUSED_EXAMINATION">Accused Interrogation / Defense Version</option>
                  <option value="DOCUMENT_VERIFICATION">Revenue / Bank Record Verification</option>
                  <option value="INTERIM_PROGRESS">Interim Progress Report</option>
                  <option value="GENERAL">General Officer Note</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700">Place / Location of Verification</label>
                  <VoiceInputButton
                    onTranscript={(txt) => setNewNoteLocation((p) => (p ? p + " " + txt : txt))}
                    fieldLabel="location"
                  />
                </div>
                <input
                  type="text"
                  value={newNoteLocation}
                  onChange={(e) => setNewNoteLocation(e.target.value)}
                  placeholder={complaint.incidentPlace}
                  className="w-full rounded-lg border border-slate-300 p-2 text-slate-900 bg-white"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700">
                    Enquiry Note Content / Officer Observations *
                  </label>
                  <VoiceInputButton
                    onTranscript={(txt) => setNewNoteContent((p) => (p ? p + " " + txt : txt))}
                    fieldLabel="enquiry note"
                  />
                </div>
                <textarea
                  rows={4}
                  required
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  placeholder="Record detailed observations, witness statements, or inquiry progress..."
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-slate-900 font-sans"
                />
              </div>

              {/* Bottom Option to upload any video, audio, document, photo in any format */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-blue-600" />
                    <span>Attach Video, Audio, Document, or Photo (Any Format)</span>
                  </label>
                  <span className="text-[10px] text-slate-500 font-medium">Optional attachment</span>
                </div>

                <div className="border border-dashed border-slate-300 hover:border-blue-500 rounded-lg p-3 bg-white text-center transition-colors">
                  <input
                    type="file"
                    id="noteAttachmentInput"
                    onChange={handleNoteFileChange}
                    className="hidden"
                  />
                  <label htmlFor="noteAttachmentInput" className="cursor-pointer block space-y-1.5">
                    {noteAttachmentName ? (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-center gap-2 font-bold text-slate-900 text-xs">
                          {noteAttachmentCategory === "video" && <Video className="w-4 h-4 text-purple-600 shrink-0" />}
                          {noteAttachmentCategory === "audio" && <Music className="w-4 h-4 text-amber-600 shrink-0" />}
                          {noteAttachmentCategory === "image" && <ImageIcon className="w-4 h-4 text-emerald-600 shrink-0" />}
                          {noteAttachmentCategory === "document" && <FileText className="w-4 h-4 text-blue-600 shrink-0" />}
                          {noteAttachmentCategory === "other" && <Paperclip className="w-4 h-4 text-slate-600 shrink-0" />}
                          <span className="truncate max-w-[240px]">{noteAttachmentName}</span>
                          <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-semibold">
                            {(noteAttachmentSize / 1024).toFixed(1)} KB
                          </span>
                        </div>

                        {noteAttachmentCategory === "audio" && noteAttachmentDataUrl && (
                          <audio controls src={noteAttachmentDataUrl} className="w-full h-8 pt-1" />
                        )}
                        {noteAttachmentCategory === "video" && noteAttachmentDataUrl && (
                          <video controls src={noteAttachmentDataUrl} className="w-full max-h-36 rounded bg-black" />
                        )}
                        {noteAttachmentCategory === "image" && noteAttachmentDataUrl && (
                          <img
                            src={noteAttachmentDataUrl}
                            alt="preview"
                            className="max-h-28 mx-auto rounded object-contain border border-slate-200"
                          />
                        )}

                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            setNoteAttachmentName("");
                            setNoteAttachmentFile(null);
                            setNoteAttachmentDataUrl(undefined);
                            setNoteAttachmentSize(0);
                          }}
                          className="text-[11px] text-red-600 hover:underline block mx-auto font-medium"
                        >
                          Remove attached file
                        </button>
                      </div>
                    ) : (
                      <div className="py-1">
                        <UploadCloud className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                        <p className="font-semibold text-blue-600 hover:underline text-xs">
                          Click to upload video, audio, document, or photo
                        </p>
                        <p className="text-[10px] text-slate-400">
                          Supports MP4, AVI, MP3, WAV, JPG, PNG, PDF, DOCX, or any other format
                        </p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <Button variant="outline" size="sm" type="button" onClick={() => setEnquiryNoteModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit">
                  Save Note to File
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: ADD EVIDENCE (ANY FORMAT)                                        */}
      {/* ========================================================================= */}
      {evidenceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setEvidenceModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-5 z-10 animate-in fade-in-0 zoom-in-95 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-blue-600" />
                <span>Add Evidence Attachment (Any Format)</span>
              </h3>
              <button onClick={() => setEvidenceModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddEvidenceSubmit} className="space-y-3 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700">Evidence Title *</label>
                  <VoiceInputButton
                    onTranscript={(txt) => setEvidenceTitle((p) => (p ? p + " " + txt : txt))}
                    fieldLabel="evidence title"
                  />
                </div>
                <input
                  type="text"
                  required
                  value={evidenceTitle}
                  onChange={(e) => setEvidenceTitle(e.target.value)}
                  placeholder="e.g. CCTV Footage of Main Market / Injury MLR Report"
                  className="w-full rounded-lg border border-slate-300 p-2 text-slate-900 bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Evidence Category</label>
                <select
                  value={evidenceCategory}
                  onChange={(e) => setEvidenceCategory(e.target.value as ComplaintEvidenceAttachment["category"])}
                  className="w-full rounded-lg border border-slate-300 p-2 text-slate-900 bg-white"
                >
                  <option value="document">Document / PDF / Affidavit</option>
                  <option value="video">Video Recording / CCTV Footage</option>
                  <option value="audio">Audio Recording / Call Recording</option>
                  <option value="image">Photograph / Image / Screenshot</option>
                  <option value="other">Other Digital File</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Upload File (Any Format)</label>
                <input
                  type="file"
                  onChange={handleEvidenceFileChange}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700">Relevance / Description</label>
                  <VoiceInputButton
                    onTranscript={(txt) => setEvidenceDesc((p) => (p ? p + " " + txt : txt))}
                    fieldLabel="evidence description"
                  />
                </div>
                <textarea
                  rows={2}
                  value={evidenceDesc}
                  onChange={(e) => setEvidenceDesc(e.target.value)}
                  placeholder="Describe source, location recovered, or evidentiary value..."
                  className="w-full rounded-lg border border-slate-300 p-2 text-slate-900 bg-white"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <Button variant="outline" size="sm" type="button" onClick={() => setEvidenceModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit">
                  Attach Evidence
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: UPLOAD DOCUMENT (ANY FORMAT)                                     */}
      {/* ========================================================================= */}
      {documentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setDocumentModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-5 z-10 animate-in fade-in-0 zoom-in-95 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                  <UploadCloud className="w-4 h-4 text-blue-600" />
                  <span>Upload Official Document (Any Format)</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Attach documents in any format — saved with automatic date & time stamp.
                </p>
              </div>
              <button onClick={() => setDocumentModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddDocumentSubmit} className="space-y-3.5 text-xs">
              {/* File Upload in Any Format */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Upload File in Any Format *</span>
                  <span className="text-[10px] text-blue-600 font-normal">PDF, DOC, DOCX, XLS, JPG, PNG, TXT, etc.</span>
                </label>
                <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-3.5 text-center transition-colors bg-slate-50/70">
                  <input
                    type="file"
                    id="docFileInput"
                    onChange={handleDocFileChange}
                    className="hidden"
                  />
                  <label htmlFor="docFileInput" className="cursor-pointer block space-y-1.5">
                    <UploadCloud className="w-6 h-6 text-slate-400 mx-auto" />
                    {docFileName ? (
                      <div className="space-y-0.5">
                        <p className="font-bold text-slate-900 flex items-center justify-center gap-1.5">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{docFileName}</span>
                        </p>
                        <p className="text-[11px] text-slate-500 font-mono">
                          Size: {docFileSize} • Ready to upload & stamp
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="font-semibold text-blue-600 hover:underline">
                          Click to browse or drag file here
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Accepts any format (documents, spreadsheets, scans, certified copies)
                        </p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700">Document Display Title</label>
                  <VoiceInputButton
                    onTranscript={(txt) => setDocName((p) => (p ? p + " " + txt : txt))}
                    fieldLabel="document title"
                  />
                </div>
                <input
                  type="text"
                  required
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                  placeholder="e.g. Civil Hospital MLR Report #4412"
                  className="w-full rounded-lg border border-slate-300 p-2 text-slate-900 bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Document Classification</label>
                <select
                  value={docCategory}
                  onChange={(e) => setDocCategory(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2 text-slate-900 bg-white"
                >
                  <option value="Medico-Legal (MLR)">Medico-Legal (MLR)</option>
                  <option value="Revenue & Land Patwari Record">Revenue & Land Patwari Record</option>
                  <option value="Bank / UPI Statement">Bank / UPI Statement</option>
                  <option value="Official Notice (BNSS 35)">Official Notice (BNSS 35)</option>
                  <option value="Identification / Aadhaar Proof">Identification / Aadhaar Proof</option>
                  <option value="Compromise / Settlement Accord">Compromise / Settlement Accord</option>
                  <option value="Written Statement / Affidavit">Written Statement / Affidavit</option>
                  <option value="Official PDF Document">Official PDF Document</option>
                  <option value="Scan / Certified Copy">Scan / Certified Copy</option>
                  <option value="Other Official Record">Other Official Record</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700">Description / Remarks (Optional)</label>
                  <VoiceInputButton
                    onTranscript={(txt) => setDocDesc((p) => (p ? p + " " + txt : txt))}
                    fieldLabel="document remarks"
                  />
                </div>
                <textarea
                  rows={2}
                  value={docDesc}
                  onChange={(e) => setDocDesc(e.target.value)}
                  placeholder="Brief note about the document contents or evidentiary relevance..."
                  className="w-full rounded-lg border border-slate-300 p-2 text-slate-900 bg-white"
                />
              </div>

              {/* Timestamp & Chain of Custody notice */}
              <div className="p-2.5 bg-blue-50/70 border border-blue-200 rounded-lg flex items-center justify-between text-[11px] text-blue-900">
                <span className="flex items-center gap-1.5 font-medium">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  <span>Will be saved with exact date & time stamp</span>
                </span>
                <span className="font-mono text-[10px] bg-white px-2 py-0.5 rounded border border-blue-200 text-blue-800">
                  {new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <Button variant="outline" size="sm" type="button" onClick={() => setDocumentModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" className="gap-1.5">
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Upload & Seal Document</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: TRANSFER COMPLAINT                                               */}
      {/* ========================================================================= */}
      {transferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setTransferModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-5 z-10 animate-in fade-in-0 zoom-in-95 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-amber-600" />
                <span>Transfer Complaint Jurisdiction</span>
              </h3>
              <button onClick={() => setTransferModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleTransferSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Destination Police Station *</label>
                <select
                  value={transferStation}
                  onChange={(e) => setTransferStation(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2 text-slate-900 bg-white"
                >
                  <option value="Civil Lines Police Station">Civil Lines Police Station</option>
                  <option value="City Police Station Thanesar">City Police Station Thanesar</option>
                  <option value="Krishna Gate Police Station">Krishna Gate Police Station</option>
                  <option value="Cyber Crime Police Station Kurukshetra">Cyber Crime Police Station Kurukshetra</option>
                  <option value="Women Police Station Kurukshetra">Women Police Station Kurukshetra</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700">Transfer Grounds / Order *</label>
                  <VoiceInputButton
                    onTranscript={(txt) => setTransferReason((p) => (p ? p + " " + txt : txt))}
                    fieldLabel="transfer grounds"
                  />
                </div>
                <textarea
                  rows={3}
                  required
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  placeholder="Enter reason for jurisdictional transfer..."
                  className="w-full rounded-lg border border-slate-300 p-2 text-slate-900"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <Button variant="outline" size="sm" type="button" onClick={() => setTransferModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" className="bg-amber-600 hover:bg-amber-700">
                  Execute Transfer
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: LINK COMPLAINT / CLUB INTO ENQUIRY GROUP                         */}
      {/* ========================================================================= */}
      {linkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setLinkModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-5 z-10 animate-in fade-in-0 zoom-in-95 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                <Link2 className="w-4 h-4 text-blue-600" />
                <span>Link or Club Complaints</span>
              </h3>
              <button onClick={() => setLinkModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleLinkSubmit} className="space-y-3 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700">Target Complaint Number *</label>
                  <VoiceInputButton
                    onTranscript={(txt) => setLinkTargetNumber((p) => (p ? p + " " + txt : txt))}
                    fieldLabel="target complaint number"
                  />
                </div>
                <input
                  type="text"
                  required
                  value={linkTargetNumber}
                  onChange={(e) => setLinkTargetNumber(e.target.value)}
                  placeholder="e.g. HAR-KKR-2026-CMP-00481"
                  className="w-full rounded-lg border border-slate-300 p-2 text-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Relationship Type</label>
                <select
                  value={linkRelationType}
                  onChange={(e) => setLinkRelationType(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2 text-slate-900 bg-white"
                >
                  <option value="CROSS">Cross-Complaint (Reverse Parties / Mutual Affray)</option>
                  <option value="CLUBBED_INQUIRY">Clubbed Enquiry (Same Occurrence / Accused)</option>
                  <option value="REPEATED">Repeated Complaint (Multiple Filings)</option>
                  <option value="ASSOCIATED">Associated Background Evidence</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <Button variant="outline" size="sm" type="button" onClick={() => setLinkModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit">
                  Establish Link
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 7: ISSUE NCR REFERENCE                                              */}
      {/* ========================================================================= */}
      {ncrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setNcrModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-5 z-10 animate-in fade-in-0 zoom-in-95 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-600" />
                <span>Issue Non-Cognizable Report (NCR)</span>
              </h3>
              <button onClick={() => setNcrModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleNcrSubmit} className="space-y-3 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700">NCR Reference Number</label>
                  <VoiceInputButton
                    onTranscript={(txt) => setNcrNumber((p) => (p ? p + " " + txt : txt))}
                    fieldLabel="NCR reference number"
                  />
                </div>
                <input
                  type="text"
                  value={ncrNumber}
                  onChange={(e) => setNcrNumber(e.target.value)}
                  placeholder="Auto-generated if left blank"
                  className="w-full rounded-lg border border-slate-300 p-2 text-slate-900 font-mono"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700">Applicable Sections of Law</label>
                  <VoiceInputButton
                    onTranscript={(txt) => setNcrSections((p) => (p ? p + " " + txt : txt))}
                    fieldLabel="NCR sections"
                  />
                </div>
                <input
                  type="text"
                  value={ncrSections}
                  onChange={(e) => setNcrSections(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2 text-slate-900 font-mono"
                />
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 leading-relaxed text-[11px]">
                Upon issuing NCR under Section 174 BNSS, complainant will be provided a certified copy and advised of their right to approach the Jurisdictional Magistrate.
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <Button variant="outline" size="sm" type="button" onClick={() => setNcrModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                  Generate & Issue NCR
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 8: FIR LINKAGE                                                      */}
      {/* ========================================================================= */}
      {firModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setFirModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-5 z-10 animate-in fade-in-0 zoom-in-95 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                <Scale className="w-4 h-4 text-red-600" />
                <span>Link to FIR / Recommend Registration</span>
              </h3>
              <button onClick={() => setFirModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFirSubmit} className="space-y-3 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700">FIR Number</label>
                  <VoiceInputButton
                    onTranscript={(txt) => setFirNumber((p) => (p ? p + " " + txt : txt))}
                    fieldLabel="FIR number"
                  />
                </div>
                <input
                  type="text"
                  value={firNumber}
                  onChange={(e) => setFirNumber(e.target.value)}
                  placeholder="e.g. FIR-118/2026"
                  className="w-full rounded-lg border border-slate-300 p-2 text-slate-900 font-mono"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700">Substantiated Penal Sections (BNS)</label>
                  <VoiceInputButton
                    onTranscript={(txt) => setFirSections((p) => (p ? p + " " + txt : txt))}
                    fieldLabel="FIR penal sections"
                  />
                </div>
                <input
                  type="text"
                  value={firSections}
                  onChange={(e) => setFirSections(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2 text-slate-900 font-mono"
                />
              </div>

              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-900 leading-relaxed text-[11px]">
                Cognizable offence verified through inquiry. Status will be updated to <strong>RECOMMENDED FOR FIR</strong> and logged in the Station General Diary.
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <Button variant="outline" size="sm" type="button" onClick={() => setFirModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" className="bg-red-600 hover:bg-red-700">
                  Confirm FIR Linkage
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 9: PREPARE REPORT (AI OPTIONAL)                                     */}
      {/* ========================================================================= */}
      {aiReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setAiReportModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full p-5 z-10 animate-in fade-in-0 zoom-in-95 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    Prepare Enquiry Report (AI Assisted)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Draft statutory inquiry report under Section 173(3) BNSS with AI synthesis.
                  </p>
                </div>
              </div>
              <button onClick={() => setAiReportModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-700">Synthesized Enquiry Report Draft:</span>
                  <VoiceInputButton
                    onTranscript={(txt) => setAiReportText((p) => (p ? p + "\n" + txt : txt))}
                    fieldLabel="report draft"
                  />
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleGenerateAiReport}
                  disabled={isAiGenerating}
                  className="h-7 text-xs gap-1"
                >
                  <RefreshCw className={`w-3 h-3 ${isAiGenerating ? "animate-spin" : ""}`} />
                  <span>Regenerate with AI</span>
                </Button>
              </div>

              <textarea
                rows={14}
                value={aiReportText}
                onChange={(e) => setAiReportText(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-3 font-mono text-xs text-slate-900 bg-slate-50 leading-relaxed"
              />
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-slate-100">
              <span className="text-[11px] text-slate-500">You can edit this draft before final submission.</span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setAiReportModalOpen(false)}>
                  Close
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    alert("Report draft saved to case file!");
                    setAiReportModalOpen(false);
                  }}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Save Report Draft
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 10: SHO ASK FOR PROGRESS REPORT                                     */}
      {/* ========================================================================= */}
      {progressModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setProgressModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-5 z-10 animate-in fade-in-0 zoom-in-95 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    Demand Interim Progress Report
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Station House Officer supervisory directive under PPR 22.48 & BNSS
                  </p>
                </div>
              </div>
              <button onClick={() => setProgressModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendProgressRequest} className="space-y-3.5 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                  Target Enquiry Officer
                </div>
                <div className="font-bold text-slate-900 text-sm">{complaint.assignedEoName}</div>
                <div className="text-xs text-slate-600 font-mono">
                  Rank: {complaint.assignedEoRank} • PNO: {complaint.assignedEoPno} • Roster: {complaint.assignedRosterDuty || "Investigation Duty"}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700">Supervisory Directions / Remarks *</label>
                  <VoiceInputButton
                    onTranscript={(txt) => setProgressRemarks((p) => (p ? p + " " + txt : txt))}
                    fieldLabel="progress directive"
                  />
                </div>
                <textarea
                  rows={4}
                  required
                  value={progressRemarks}
                  onChange={(e) => setProgressRemarks(e.target.value)}
                  placeholder="Specify what inquiry points need to be expedited (e.g. CCTV verification, witness examination, forensic analysis)..."
                  className="w-full rounded-lg border border-slate-300 p-2 text-slate-900 leading-relaxed bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Compliance Window (Deadline)</label>
                <div className="grid grid-cols-4 gap-2">
                  {[6, 12, 24, 48].map((hours) => (
                    <button
                      type="button"
                      key={hours}
                      onClick={() => setProgressDeadlineHours(hours)}
                      className={`p-2 rounded-lg border text-center transition-all ${
                        progressDeadlineHours === hours
                          ? "border-blue-600 bg-blue-50 text-blue-800 font-bold shadow-xs"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {hours} Hours
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg text-blue-900 text-[11px] leading-relaxed">
                An urgent high-priority notification will be sent to EO {complaint.assignedEoName}&apos;s desk, and an official supervisory entry will be logged into the Station General Diary.
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <Button variant="outline" size="sm" type="button" onClick={() => setProgressModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                  disabled={isSubmittingProgress}
                  className="bg-blue-600 hover:bg-blue-700 gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmittingProgress ? "Dispatching Directive..." : "Issue Supervisory Directive"}</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          INSTANT DOCUMENT & EVIDENCE PREVIEW MODAL (Without Downloading)
         ========================================================================= */}
      {previewModalFile && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                  {previewModalFile.category === "video" ? (
                    <Video className="w-4 h-4 text-purple-600" />
                  ) : previewModalFile.category === "audio" ? (
                    <Music className="w-4 h-4 text-amber-600" />
                  ) : previewModalFile.category === "image" ? (
                    <ImageIcon className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <FileText className="w-4 h-4 text-blue-600" />
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 truncate">
                    {previewModalFile.name}
                  </h3>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                    <span className="uppercase font-semibold tracking-wider px-1.5 py-0.2 bg-slate-200 text-slate-700 rounded text-[10px]">
                      {previewModalFile.category || "ATTACHMENT"}
                    </span>
                    {previewModalFile.size && (
                      <span>• {typeof previewModalFile.size === "number" ? `${Math.round(previewModalFile.size / 1024)} KB` : previewModalFile.size}</span>
                    )}
                    <span className="text-emerald-700 font-semibold">• Instant On-Screen Preview</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
                  title="Print document"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleDownloadDocument({
                      id: "preview_doc",
                      complaintId: complaint?.id || "",
                      fileName: previewModalFile.name,
                      fileCategory: previewModalFile.category || "DOCUMENT",
                      uploadedBy: complaint?.registeredBy || "Intake Officer",
                      uploadedAt: new Date().toISOString(),
                      fileSize: typeof previewModalFile.size === "number" ? `${(previewModalFile.size / 1024).toFixed(1)} KB` : String(previewModalFile.size || "10 KB"),
                      fileUrl: previewModalFile.dataUrl,
                      dataUrl: previewModalFile.dataUrl,
                    })
                  }
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
                  title="Download file"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewModalFile(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                  title="Close preview"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-auto p-4 sm:p-6 bg-slate-100/50 flex items-center justify-center min-h-[300px]">
              {(previewModalFile.category === "image" ||
                previewModalFile.dataUrl?.startsWith("data:image/") ||
                /\.(png|jpe?g|webp|gif|svg|bmp)$/i.test(previewModalFile.name)) &&
                previewModalFile.dataUrl && (
                <div className="max-h-[70vh] flex items-center justify-center">
                  <img
                    src={previewModalFile.dataUrl}
                    alt={previewModalFile.name}
                    className="max-h-[70vh] max-w-full rounded-xl object-contain shadow-md border border-slate-200 bg-white"
                  />
                </div>
              )}

              {(previewModalFile.category === "video" ||
                previewModalFile.dataUrl?.startsWith("data:video/") ||
                /\.(mp4|webm|mov|avi|mkv)$/i.test(previewModalFile.name)) &&
                previewModalFile.dataUrl && (
                <div className="w-full max-w-2xl bg-black rounded-xl overflow-hidden shadow-lg">
                  <video controls autoPlay src={previewModalFile.dataUrl} className="w-full max-h-[65vh]" />
                </div>
              )}

              {(previewModalFile.category === "audio" ||
                previewModalFile.dataUrl?.startsWith("data:audio/") ||
                /\.(mp3|wav|m4a|ogg|aac)$/i.test(previewModalFile.name)) &&
                previewModalFile.dataUrl && (
                <div className="w-full max-w-md p-6 bg-white rounded-2xl shadow-lg border border-slate-200 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-inner">
                    <Music className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{previewModalFile.name}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Official Audio Recording</p>
                  </div>
                  <audio controls autoPlay src={previewModalFile.dataUrl} className="w-full pt-2" />
                </div>
              )}

              {previewModalFile.category !== "image" &&
                !previewModalFile.dataUrl?.startsWith("data:image/") &&
                !/\.(png|jpe?g|webp|gif|svg|bmp)$/i.test(previewModalFile.name) &&
                previewModalFile.category !== "video" &&
                !previewModalFile.dataUrl?.startsWith("data:video/") &&
                !/\.(mp4|webm|mov|avi|mkv)$/i.test(previewModalFile.name) &&
                previewModalFile.category !== "audio" &&
                !previewModalFile.dataUrl?.startsWith("data:audio/") &&
                !/\.(mp3|wav|m4a|ogg|aac)$/i.test(previewModalFile.name) && (
                <div className="w-full h-full min-h-[450px] flex flex-col items-center justify-center">
                  {previewModalFile.dataUrl &&
                  (previewModalFile.dataUrl.startsWith("data:application/pdf") ||
                    previewModalFile.dataUrl.startsWith("data:text/html") ||
                    previewModalFile.name.toLowerCase().endsWith(".pdf") ||
                    previewModalFile.name.toLowerCase().endsWith(".html")) ? (
                    <iframe
                      src={previewModalFile.dataUrl}
                      title={previewModalFile.name}
                      className="w-full h-[68vh] rounded-xl border border-slate-200 shadow-sm bg-white"
                    />
                  ) : (
                    <div className="text-center p-8 bg-white rounded-2xl border border-slate-200 shadow-sm max-w-md space-y-4">
                      <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center mx-auto">
                        <FileText className="w-8 h-8" />
                      </div>
                      <div>
                        <h4 className="font-bold text-base text-slate-900">{previewModalFile.name}</h4>
                        <p className="text-xs text-slate-500 mt-1">
                          Official document attached to police complaint docket.
                        </p>
                      </div>
                      <div className="flex items-center justify-center gap-2 pt-2">
                        {previewModalFile.dataUrl && (
                          <a
                            href={previewModalFile.dataUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                          >
                            <Eye className="w-4 h-4" />
                            <span>Open in Browser Tab</span>
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            handleDownloadDocument({
                              id: "preview_doc",
                              complaintId: complaint?.id || "",
                              fileName: previewModalFile.name,
                              fileCategory: previewModalFile.category || "DOCUMENT",
                              uploadedBy: complaint?.registeredBy || "Intake Officer",
                              uploadedAt: new Date().toISOString(),
                              fileSize: typeof previewModalFile.size === "number" ? `${(previewModalFile.size / 1024).toFixed(1)} KB` : String(previewModalFile.size || "10 KB"),
                              fileUrl: previewModalFile.dataUrl,
                              dataUrl: previewModalFile.dataUrl,
                            })
                          }
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Download className="w-4 h-4" />
                          <span>Download File</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-2.5 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <span>Instant Evidence &amp; Document Viewer • CMS Haryana Police</span>
              <button
                type="button"
                onClick={() => setPreviewModalFile(null)}
                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-semibold transition-colors"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD CONFIDENTIAL DOSSIER / EO MEMORY NOTE                          */}
      {/* ========================================================================= */}
      {dossierModalOpen && isEoPersona && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => {
              if (!isSavingDossier) setDossierModalOpen(false);
            }}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full max-h-[92vh] flex flex-col z-10 animate-in fade-in-0 zoom-in-95 overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 to-[#0e223d] text-white flex items-center justify-between border-b border-slate-800">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono uppercase tracking-wider flex items-center gap-1">
                    <Lock className="w-3 h-3 text-amber-400" />
                    <span>EO Memory Isolated Docket</span>
                  </span>
                  <span className="text-xs font-mono text-slate-300 font-bold">
                    {complaint.complaintNumber}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Record Confidential Dossier Entry</span>
                </h3>
                <p className="text-[11px] text-slate-300">
                  This note will NOT be attached to the complaint or visible in public receipts.
                </p>
              </div>
              <button
                onClick={() => {
                  if (!isSavingDossier) setDossierModalOpen(false);
                }}
                className="p-1 rounded-md text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs: Upload Dossier File vs Write Memory Note */}
            <div className="flex border-b border-slate-200 bg-slate-100/80 px-3 pt-2 gap-1">
              <button
                type="button"
                onClick={() => setDossierModalTab("upload")}
                className={`flex items-center gap-1.5 py-2.5 px-3 sm:px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                  dossierModalTab === "upload"
                    ? "border-emerald-600 text-emerald-800 bg-white rounded-t-lg shadow-2xs"
                    : "border-transparent text-slate-600 hover:text-slate-900"
                }`}
              >
                <UploadCloud className="w-3.5 h-3.5 text-emerald-600" />
                <span>Upload Audio, Video, PDF, Doc or Any File</span>
              </button>
              <button
                type="button"
                onClick={() => setDossierModalTab("note")}
                className={`flex items-center gap-1.5 py-2.5 px-3 sm:px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                  dossierModalTab === "note"
                    ? "border-amber-600 text-amber-800 bg-white rounded-t-lg shadow-2xs"
                    : "border-transparent text-slate-600 hover:text-slate-900"
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-amber-600" />
                <span>Write Memory Note</span>
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleAddDossierSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
              {/* UPLOAD FILE MODE: Prominent File Upload Section First */}
              {dossierModalTab === "upload" && (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                      <UploadCloud className="w-4 h-4 text-emerald-600" />
                      <span>Select Dossier File (Audio, Video, PDF, Word, Image, Any Format) *</span>
                    </label>
                    <span className="text-[10px] text-slate-500 font-medium">Any format supported</span>
                  </div>

                  <div className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 rounded-xl p-3.5 bg-white text-center transition-colors">
                    <input
                      type="file"
                      id="dossierAttachmentUploadInput"
                      onChange={handleDossierAttachmentChange}
                      className="hidden"
                    />
                    <label htmlFor="dossierAttachmentUploadInput" className="cursor-pointer block space-y-2">
                      {dossierAttachmentName ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between p-2 bg-emerald-50/70 border border-emerald-200 rounded-lg">
                            <div className="flex items-center gap-2 truncate pr-2 font-bold text-slate-900 text-xs">
                              {dossierAttachmentType === "audio" && <Music className="w-4 h-4 text-amber-600 shrink-0" />}
                              {dossierAttachmentType === "video" && <Video className="w-4 h-4 text-purple-600 shrink-0" />}
                              {dossierAttachmentType === "image" && <ImageIcon className="w-4 h-4 text-emerald-600 shrink-0" />}
                              {dossierAttachmentType === "document" && <FileText className="w-4 h-4 text-blue-600 shrink-0" />}
                              {!["audio", "video", "image", "document"].includes(dossierAttachmentType) && (
                                <Paperclip className="w-4 h-4 text-slate-600 shrink-0" />
                              )}
                              <span className="truncate max-w-[220px]">{dossierAttachmentName}</span>
                              <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full font-mono uppercase">
                                {dossierAttachmentType} · {dossierAttachmentSize || "Saved"}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                setDossierAttachmentName("");
                                setDossierAttachmentDataUrl(undefined);
                                setDossierAttachmentSize("");
                              }}
                              className="text-[11px] text-red-600 hover:underline font-bold shrink-0"
                            >
                              Remove
                            </button>
                          </div>

                          {/* Direct Test Playback inside Modal */}
                          {dossierAttachmentType === "audio" && dossierAttachmentDataUrl && (
                            <div className="p-2 bg-amber-50 rounded-lg border border-amber-200 space-y-1">
                              <span className="text-[10px] text-amber-900 font-bold flex items-center gap-1">
                                <Volume2 className="w-3 h-3" />
                                <span>Preview Audio:</span>
                              </span>
                              <audio controls src={dossierAttachmentDataUrl} className="w-full h-8 pt-0.5" />
                            </div>
                          )}

                          {dossierAttachmentType === "video" && dossierAttachmentDataUrl && (
                            <div className="p-2 bg-purple-50 rounded-lg border border-purple-200 space-y-1">
                              <span className="text-[10px] text-purple-900 font-bold flex items-center gap-1">
                                <Video className="w-3 h-3" />
                                <span>Preview Video:</span>
                              </span>
                              <video controls src={dossierAttachmentDataUrl} className="w-full max-h-40 rounded-lg bg-black" />
                            </div>
                          )}

                          {dossierAttachmentType === "image" && dossierAttachmentDataUrl && (
                            <img
                              src={dossierAttachmentDataUrl}
                              alt="preview"
                              className="max-h-28 mx-auto rounded object-contain border border-slate-200"
                            />
                          )}
                        </div>
                      ) : (
                        <div className="py-2 space-y-1.5">
                          <UploadCloud className="w-7 h-7 text-emerald-600 mx-auto" />
                          <p className="font-bold text-emerald-700 hover:underline text-xs">
                            Click here to select Audio, Video, PDF, Word doc, or any file
                          </p>
                          <div className="flex flex-wrap items-center justify-center gap-1.5 text-[10px] text-slate-500 pt-1">
                            <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                              🎧 MP3, WAV, M4A
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-purple-50 text-purple-800 border border-purple-200">
                              🎬 MP4, MKV, AVI
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                              📄 PDF, Word DOCX/DOC
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                              📸 JPG, PNG
                            </span>
                          </div>
                        </div>
                      )}
                    </label>
                  </div>
                </div>
              )}

              {/* Title Input */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-800">
                    {dossierModalTab === "upload" ? "Dossier File Title / Brief Description *" : "Entry Title / Brief Lead *"}
                  </label>
                  <VoiceInputButton
                    onTranscript={(txt) => setDossierTitle((p) => (p ? p + " " + txt : txt))}
                    fieldLabel="dossier title"
                  />
                </div>
                <input
                  type="text"
                  required
                  value={dossierTitle}
                  onChange={(e) => setDossierTitle(e.target.value)}
                  placeholder={
                    dossierModalTab === "upload"
                      ? "e.g. Call Recording of Witness Sunil / Spot Video / Patwari Demarcation Map"
                      : "e.g. Secret Informant Tip regarding hidden vehicle / Off-record confession"
                  }
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-slate-900 bg-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              {/* Category & Tag Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Dossier Category *
                  </label>
                  <select
                    value={dossierCategory}
                    onChange={(e) => setDossierCategory(e.target.value as ConfidentialDossierItem["category"])}
                    className="w-full rounded-lg border border-slate-300 p-2.5 text-slate-900 bg-white font-medium focus:border-emerald-500 focus:outline-none"
                  >
                    {Object.entries(DOSSIER_CATEGORY_CONFIG).map(([key, config]) => (
                      <option key={key} value={key}>
                        {config.iconText} {config.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-800">
                      Reference / Intel Tag
                    </label>
                    <span className="text-[10px] text-slate-400 font-medium">Optional</span>
                  </div>
                  <input
                    type="text"
                    value={dossierReferenceTag}
                    onChange={(e) => setDossierReferenceTag(e.target.value)}
                    placeholder="e.g. Mukhbir-Sunil / CDR-9812 / SuspectBrother"
                    className="w-full rounded-lg border border-slate-300 p-2.5 text-slate-900 bg-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Content / Observations */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-800">
                    {dossierModalTab === "upload"
                      ? "Investigation Context / Remarks (Optional)"
                      : "Confidential Observations & Memory Notes *"}
                  </label>
                  <VoiceInputButton
                    onTranscript={(txt) => setDossierContent((p) => (p ? p + " " + txt : txt))}
                    fieldLabel="confidential observations"
                  />
                </div>
                <textarea
                  rows={dossierModalTab === "upload" ? 2 : 4}
                  required={dossierModalTab === "note"}
                  value={dossierContent}
                  onChange={(e) => setDossierContent(e.target.value)}
                  placeholder={
                    dossierModalTab === "upload"
                      ? "Add optional remarks regarding who gave this recording/file, spot location, or investigation context..."
                      : "Record confidential intel, personal recollection, witness body language, unverified allegations, or investigation strategy..."
                  }
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-slate-900 bg-white focus:border-emerald-500 focus:outline-none font-sans"
                />
              </div>

              {/* Optional File Attachment inside "Note" mode */}
              {dossierModalTab === "note" && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-slate-800 flex items-center gap-1.5">
                      <Paperclip className="w-3.5 h-3.5 text-amber-600" />
                      <span>Optional Attachment (Audio, Video, PDF, Word, Photo)</span>
                    </label>
                    <span className="text-[10px] text-slate-400">Optional</span>
                  </div>

                  <div className="border border-dashed border-slate-300 hover:border-amber-500 rounded-lg p-2.5 bg-white text-center transition-colors">
                    <input
                      type="file"
                      id="dossierAttachmentNoteInput"
                      onChange={handleDossierAttachmentChange}
                      className="hidden"
                    />
                    <label htmlFor="dossierAttachmentNoteInput" className="cursor-pointer block space-y-1">
                      {dossierAttachmentName ? (
                        <div className="flex items-center justify-between px-2 py-1">
                          <div className="flex items-center gap-2 truncate font-bold text-slate-900 text-xs">
                            <Paperclip className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span className="truncate max-w-[220px]">{dossierAttachmentName}</span>
                            <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-mono">
                              {dossierAttachmentSize}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              setDossierAttachmentName("");
                              setDossierAttachmentDataUrl(undefined);
                              setDossierAttachmentSize("");
                            }}
                            className="text-[11px] text-red-600 hover:underline font-semibold"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <div className="py-1">
                          <UploadCloud className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                          <p className="font-semibold text-amber-600 hover:underline text-xs">
                            Click to attach Audio, Video, PDF, Word, or Photo
                          </p>
                          <p className="text-[10px] text-slate-400">
                            Supports any audio, video, document, or image format
                          </p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>
              )}

              {/* Modal Footer */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => setDossierModalOpen(false)}
                  disabled={isSavingDossier}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                  disabled={isSavingDossier}
                  className={
                    dossierModalTab === "upload"
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5 shadow-xs"
                      : "bg-amber-600 hover:bg-amber-700 text-white font-bold gap-1.5 shadow-xs"
                  }
                >
                  {isSavingDossier ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : dossierModalTab === "upload" ? (
                    <>
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>Upload to Confidential Dossier</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      <span>Save Confidential Note</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Receipt of Registered Complaints Modal */}
      <ComplaintReceiptModal
        complaint={complaint}
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
      />



      {/* ========================================================================= */}
      {/* MODAL: UPLOAD SIGNED REPORT FILE                                           */}
      {/* ========================================================================= */}
      {uploadReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setUploadReportModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-5 z-10 animate-in fade-in-0 zoom-in-95 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-emerald-600" />
                <span>Upload Signed Enquiry Report</span>
              </h3>
              <button onClick={() => setUploadReportModalOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
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
                  placeholder="e.g. Signed Field Verification Report / SDM Revenue Demarcation"
                  className="w-full rounded-lg border border-slate-300 p-2 text-slate-900 bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Report Category</label>
                  <select
                    value={uploadReportCategory}
                    onChange={(e) => setUploadReportCategory(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2 text-slate-900 bg-white"
                  >
                    <option value="Civil / Land Dispute">Civil / Land Dispute</option>
                    <option value="Financial Fraud">Financial Fraud</option>
                    <option value="Assault & NCR">Assault &amp; NCR</option>
                    <option value="Matrimonial Compromise">Matrimonial Compromise</option>
                    <option value="Cyber Crime">Cyber Crime</option>
                    <option value="Final Enquiry Report">Final Enquiry Report</option>
                    <option value="Interim Progress Report">Interim Progress Report</option>
                    <option value="Other Report">Other Report</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Dispatch / Report Ref No.</label>
                  <input
                    type="text"
                    value={uploadReportDispatchNo}
                    onChange={(e) => setUploadReportDispatchNo(e.target.value)}
                    placeholder="e.g. HP/KKR/CT/2026/REP-098"
                    className="w-full rounded-lg border border-slate-300 p-2 text-slate-900 bg-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Upload Report File (PDF, Word, Scan, Image) *</label>
                <input
                  type="file"
                  required
                  onChange={handleUploadReportFileChange}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                />
                {uploadReportFileName && (
                  <p className="text-[11px] text-emerald-700 font-semibold mt-1">
                    Selected: {uploadReportFileName} ({uploadReportFileSize})
                  </p>
                )}
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Enquiry Findings / Conclusion Summary</label>
                <textarea
                  rows={2}
                  value={uploadReportConclusion}
                  onChange={(e) => setUploadReportConclusion(e.target.value)}
                  placeholder="Brief summary of findings, recommendation to SHO, or final disposal conclusion..."
                  className="w-full rounded-lg border border-slate-300 p-2 text-slate-900 bg-white"
                />
              </div>

              {/* Mandatory Enquiry Outcome Selector */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1.5">
                  Mandatory Enquiry Outcome (जांच निष्कर्ष) <span className="text-red-500">*</span>
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
                      {uploadReportOutcome === "Complete" && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                    </div>
                    <p className="text-[10px] text-slate-600 leading-tight">
                      Enquiry completed. Status becomes Complete. Can send to SHO for approval.
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
                      <span className="font-bold text-xs text-amber-950">2. Pending</span>
                      {uploadReportOutcome === "Pending" && <CheckCircle2 className="w-4 h-4 text-amber-600" />}
                    </div>
                    <p className="text-[10px] text-slate-600 leading-tight">
                      Interim report. Status remains Pending. Complaint stays in EO active queue.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setUploadReportOutcome("FIR Recommend")}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                      uploadReportOutcome === "FIR Recommend"
                        ? "border-red-500 bg-red-50/80 ring-2 ring-red-500/20"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-red-950">3. FIR Recommend</span>
                      {uploadReportOutcome === "FIR Recommend" && <CheckCircle2 className="w-4 h-4 text-red-600" />}
                    </div>
                    <p className="text-[10px] text-slate-600 leading-tight">
                      Recommends FIR. Status stays Pending until SHO registers FIR. Can send to SHO.
                    </p>
                  </button>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <Button variant="outline" size="sm" type="button" onClick={() => setUploadReportModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" disabled={isSubmittingReport} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer">
                  {isSubmittingReport ? "Saving..." : "Save Report to File"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: PREVIEW SAVED / UPLOADED REPORT                                     */}
      {/* ========================================================================= */}
      {reportPreviewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setReportPreviewItem(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[90vh] flex flex-col z-10 animate-in fade-in-0 zoom-in-95 overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
              <div className="min-w-0 pr-4">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                    {reportPreviewItem.reportTypeLabel}
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    {reportPreviewItem.dispatchNo}
                  </span>
                </div>
                <h3 className="font-bold text-sm sm:text-base text-white truncate mt-0.5">
                  {reportPreviewItem.title}
                </h3>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    if (reportIframeRef.current?.contentWindow) {
                      reportIframeRef.current.contentWindow.focus();
                      reportIframeRef.current.contentWindow.print();
                    } else {
                      window.print();
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 rounded-lg text-xs font-semibold cursor-pointer shadow-2xs transition-colors"
                  title="Print authentic A4 legal document"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print A4</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (reportPreviewItem.dataUrl && !reportPreviewItem.dataUrl.startsWith("data:text/html")) {
                      const link = document.createElement("a");
                      link.href = reportPreviewItem.dataUrl;
                      link.download = reportPreviewItem.fileName || `${reportPreviewItem.title}.pdf`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    } else {
                      const html = reportPreviewItem.contentHtml || reportPreviewItem.content || "";
                      const blob = new Blob([html], { type: "text/html;charset=utf-8" });
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement("a");
                      link.href = url;
                      link.download = reportPreviewItem.fileName || `${(reportPreviewItem.dispatchNo || "ENQUIRY_REPORT").replace(/[\/\\?%*:|"<>]/g, "_")}.html`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      URL.revokeObjectURL(url);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-2xs transition-colors"
                  title="Download formatted document"
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
              {reportPreviewItem.contentHtml || (reportPreviewItem.dataUrl && reportPreviewItem.dataUrl.startsWith("data:text/html")) ? (
                <iframe
                  ref={reportIframeRef}
                  srcDoc={reportPreviewItem.contentHtml || undefined}
                  src={!reportPreviewItem.contentHtml && reportPreviewItem.dataUrl ? reportPreviewItem.dataUrl : undefined}
                  title="Official Enquiry Report"
                  className="w-full h-[72vh] rounded-xl border border-slate-300 bg-white shadow-xs"
                />
              ) : reportPreviewItem.dataUrl ? (
                reportPreviewItem.dataUrl.startsWith("data:application/pdf") || reportPreviewItem.fileName?.toLowerCase().endsWith(".pdf") ? (
                  <iframe src={reportPreviewItem.dataUrl} title="Report Document" className="w-full h-[72vh] rounded-xl border border-slate-200 bg-white" />
                ) : reportPreviewItem.dataUrl.startsWith("data:image/") || /\.(png|jpe?g|webp)$/i.test(reportPreviewItem.fileName || "") ? (
                  <img src={reportPreviewItem.dataUrl} alt="Report Scan" className="max-h-[72vh] mx-auto rounded-xl object-contain border border-slate-200" />
                ) : (
                  <div className="p-6 bg-white rounded-xl border border-slate-200 space-y-3">
                    <p className="font-bold text-slate-900 text-sm">Attached File: {reportPreviewItem.fileName}</p>
                    <a href={reportPreviewItem.dataUrl} download={reportPreviewItem.fileName} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold cursor-pointer">
                      <Download className="w-3.5 h-3.5" /> Download Attached File
                    </a>
                  </div>
                )
              ) : reportPreviewItem.content ? (
                <div className="w-full max-w-3xl bg-white p-8 rounded-xl border border-slate-300 shadow-sm font-sans text-xs sm:text-sm text-slate-900 leading-relaxed space-y-4">
                  <div className="text-center pb-3 border-b border-slate-300">
                    <h3 className="font-black text-sm tracking-wider uppercase text-slate-900">HARYANA POLICE</h3>
                    <p className="text-xs font-bold text-slate-600 uppercase">{reportPreviewItem.title}</p>
                    <p className="text-[11px] font-mono text-slate-500">Dispatch: {reportPreviewItem.dispatchNo || "N/A"}</p>
                  </div>
                  <div className="whitespace-pre-wrap text-slate-800 leading-relaxed font-sans">
                    {reportPreviewItem.content}
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500 text-xs">
                  {reportPreviewItem.conclusionSummary || "No textual preview available."}
                </div>
              )}
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

      {/* SHO Re-Enquiry Modal */}
      {shoReEnquiryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="p-4 bg-amber-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="font-bold text-sm">Order Re-Enquiry (SHO Action)</h3>
              </div>
              <button onClick={() => setShoReEnquiryModalOpen(false)} className="text-white hover:opacity-80 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                <p><strong>Complaint No:</strong> {complaint.complaintNumber}</p>
                <p><strong>Complainant:</strong> {complaint.complainantName}</p>
                <p><strong>Enquiry Officer:</strong> {complaint.assignedEoName}</p>
                <p className="text-amber-800 font-semibold pt-1">
                  This complaint will be re-assigned to the SAME Enquiry Officer ({complaint.assignedEoName}), status will remain &quot;Pending&quot;, and the EO will be notified immediately.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Re-Enquiry Reason &amp; Specific Directions <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={shoReEnquiryReason}
                  onChange={(e) => setShoReEnquiryReason(e.target.value)}
                  placeholder="Explain why re-enquiry is required (e.g. key witnesses not examined, site plan missing, clarification required)..."
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShoReEnquiryModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleShoReEnquiryAction}
                disabled={isSubmittingShoReEnquiry || !shoReEnquiryReason.trim()}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold cursor-pointer"
              >
                {isSubmittingShoReEnquiry ? "Submitting..." : "Confirm & Order Re-Enquiry"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* SHO Reject Report Modal */}
      {shoRejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="p-4 bg-rose-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="font-bold text-sm">Reject Enquiry Report &amp; Return to EO</h3>
              </div>
              <button onClick={() => setShoRejectModalOpen(false)} className="text-white hover:opacity-80 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                <p><strong>Complaint No:</strong> {complaint.complaintNumber}</p>
                <p><strong>Complainant:</strong> {complaint.complainantName}</p>
                <p><strong>Assigned EO:</strong> {complaint.assignedEoName} (PNO: {complaint.assignedEoPno})</p>
                <p className="text-rose-800 font-semibold pt-1">
                  On rejection submission, this complaint will be returned to the same assigned EO ({complaint.assignedEoName}) for correction and resubmission.
                  The complaint status will change to <strong>&ldquo;Correction Required&rdquo;</strong>, and your rejection reason will be prominently displayed in the EO account.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Rejection Reason &amp; Required Corrections <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={shoRejectReason}
                  onChange={(e) => setShoRejectReason(e.target.value)}
                  placeholder="Enter mandatory rejection reason and required corrections (e.g. key witnesses not examined, site plan missing, clarification required on suspect version)..."
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-sans text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShoRejectModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleShoRejectAction}
                disabled={isShoRejecting || !shoRejectReason.trim()}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer"
              >
                {isShoRejecting ? "Submitting..." : "Submit Rejection & Return to EO"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* EO Send to SHO Modal */}
      <EoSendingToShoModal
        complaint={complaint}
        isOpen={eoSendToShoModalOpen}
        onClose={() => setEoSendToShoModalOpen(false)}
        onSubmit={handleEoSendToShoSubmit}
        isLoading={sendingReportToSho}
      />

      {/* SHO Approve Final Category Modal */}
      <ShoApproveCategoryModal
        complaint={complaint}
        isOpen={shoApproveModalOpen}
        onClose={() => setShoApproveModalOpen(false)}
        onSubmit={handleShoApproveSubmit}
        isLoading={isShoApproving}
      />
    </div>
  );
}
