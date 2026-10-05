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
  AlertTriangle,
  Printer,
  Sparkles,
  Link2,
  Layers,
  ArrowRightLeft,
  History as HistoryIcon,
  FileCheck,
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
} from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge, PriorityBadge } from "@/components/ui/badge";
import { LoadingSkeleton } from "@/components/ui/state-views";
import { MOCK_ENQUIRY_OFFICERS } from "@/lib/mockData";
import { formatDate, formatDateTime } from "@/lib/utils";

type ActiveTab = "overview" | "evidence" | "enquiry_notes" | "documents" | "links" | "history";

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

  // More Actions dropdown state
  const [moreActionsOpen, setMoreActionsOpen] = useState(false);
  const moreActionsRef = useRef<HTMLDivElement>(null);

  // Assign EO Modal state
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedEoId, setSelectedEoId] = useState<string>("eo_1");
  const [directionTemplate, setDirectionTemplate] = useState<string>("SPOT_VERIFY");
  const [assignedDirections, setAssignedDirections] = useState<string>("");
  const [targetDays, setTargetDays] = useState<number>(14);
  const [isAssigning, setIsAssigning] = useState<boolean>(false);
  const [assignSuccess, setAssignSuccess] = useState<boolean>(false);
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
  const isSho = currentUser.role === "SHO" || currentUser.id === "usr_sho_1";
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
  const isUnassigned = !complaint?.assignedEoName || complaint?.status === "REGISTERED";
  const canAssign = isSho || currentUser.role === "DSP_SUBDIV" || currentUser.role === "SUPER_ADMIN";
  const canAskProgress = isSho && !isUnassigned;
  const canModifyCase = isAssignedEo; // Strictly EO only whom complaint is assigned!

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

      setTimeout(() => {
        setAssignSuccess(false);
        setAssignModalOpen(false);
        setLastAssignedNotification(null);
      }, 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAssigning(false);
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
    setActiveTab("enquiry_notes");
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
    setActiveTab("evidence");
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

    if (!canModifyCase) {
      alert(`Access Denied: Only the assigned Enquiry Officer (${complaint.assignedEoName || "Assigned Officer"}) has permission to upload documents.`);
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

  // Link FIR Submit
  const handleFirSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaint) return;

    if (!canModifyCase) {
      alert(`Access Denied: Only the assigned Enquiry Officer (${complaint.assignedEoName || "Assigned Officer"}) can link FIR.`);
      return;
    }

    const num = firNumber || `FIR-${Math.floor(100 + Math.random() * 900)}/2026`;

    await ComplaintService.linkFir(complaint.id, num, firSections, currentUser.name);

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
    if (!canModifyCase) {
      alert(`Access Denied: Only the assigned Enquiry Officer (${complaint.assignedEoName || "Assigned Officer"}) can delete documents.`);
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

  // Build combined history timeline (oldest action at top, latest at bottom)
  const combinedTimeline: ComplaintTimelineEvent[] = [
    ...(complaint.timeline || []),
    {
      id: "tl_init",
      complaintId: complaint.id,
      title: "Complaint Formally Registered",
      description: `Intake recorded via ${complaint.source.replace(/_/g, " ")}. Central General Diary updated (PPR 22.48).`,
      category: "REGISTRATION" as const,
      officerName: complaint.registeredBy,
      timestamp: complaint.createdAt,
    },
  ].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  return (
    <div className="p-3 sm:p-6 max-w-7xl mx-auto space-y-5">
      {/* Top Back Navigation Bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/complaints"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#0b192c] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Complaints Register</span>
        </Link>
        <span className="text-xs font-mono text-slate-400">
          Police Station: <strong className="text-slate-700">{complaint.policeStation}</strong>
        </span>
      </div>

      {/* Main Profile Header Banner */}
      <Card className="border-slate-200 shadow-xs bg-white overflow-visible">
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Left: Complaint Identification */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-base sm:text-lg font-bold text-[#0b192c]">
                  {complaint.complaintNumber}
                </span>
                <PriorityBadge priority={complaint.priority} />
                <StatusBadge status={complaint.status} />
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                    complaint.daysPending > 10
                      ? "bg-red-50 text-red-700 border border-red-200"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {complaint.daysPending} Days Pending
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                <span className="flex items-center gap-1 font-semibold text-slate-900">
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  {complaint.complainantName}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 font-mono">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {complaint.complainantMobile}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {complaint.incidentPlace}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {formatDate(complaint.createdAt)}
                </span>
              </div>
            </div>

            {/* Right: Primary Top Actions based on Role */}
            <div className="flex flex-wrap items-center gap-2">
              {/* SHO View: Assign EO if unassigned, or Ask for Progress Report & Reassign if assigned */}
              {isSho && (
                <>
                  {isUnassigned ? (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleOpenAssign}
                      className="gap-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 shadow-xs"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>Assign EO</span>
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setProgressModalOpen(true)}
                        className="gap-1.5 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-xs"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Ask for Progress Report</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleOpenAssign}
                        className="gap-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        title="Reassign to another Enquiry Officer"
                      >
                        <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                        <span>Reassign EO</span>
                      </Button>
                    </>
                  )}
                </>
              )}

              {/* Assigned EO View: Primary Action Buttons & Full More Actions Dropdown */}
              {isAssignedEo && (
                <>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setEnquiryNoteModalOpen(true)}
                    className="gap-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Record Enquiry Note</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEvidenceModalOpen(true)}
                    className="gap-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <Paperclip className="w-3.5 h-3.5 text-blue-600" />
                    <span>Add Evidence</span>
                  </Button>

                  {/* More Actions Dropdown for Assigned EO */}
                  <div className="relative" ref={moreActionsRef}>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setMoreActionsOpen(!moreActionsOpen)}
                      className="gap-1.5 text-xs font-semibold bg-[#0b192c] hover:bg-slate-800 text-white"
                    >
                      <span>More Actions</span>
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${moreActionsOpen ? "rotate-180" : ""}`} />
                    </Button>

                    {moreActionsOpen && (
                      <div className="absolute right-0 mt-1.5 w-64 rounded-xl bg-white border border-slate-200 shadow-xl z-50 py-1.5 animate-in fade-in-0 zoom-in-95 text-xs">
                        <div className="px-3 py-1.5 border-b border-slate-100 font-bold uppercase text-[10px] text-slate-400 tracking-wider">
                          Investigation & Case Actions
                        </div>

                        <button
                          onClick={() => {
                            setMoreActionsOpen(false);
                            setEnquiryNoteModalOpen(true);
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700 font-medium"
                        >
                          <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span>Record Enquiry Note</span>
                        </button>

                        <button
                          onClick={() => {
                            setMoreActionsOpen(false);
                            setAiReportModalOpen(true);
                            handleGenerateAiReport();
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700 font-medium"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                          <span>Prepare Report (AI Optional)</span>
                        </button>

                        <button
                          onClick={() => {
                            setMoreActionsOpen(false);
                            setTransferModalOpen(true);
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700 font-medium"
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>Transfer</span>
                        </button>

                        <button
                          onClick={() => {
                            setMoreActionsOpen(false);
                            setLinkModalOpen(true);
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700 font-medium"
                        >
                          <Link2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span>Link Complaint</span>
                        </button>

                        <button
                          onClick={() => {
                            setMoreActionsOpen(false);
                            setLinkModalOpen(true);
                            setLinkRelationType("CLUBBED_INQUIRY");
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700 font-medium"
                        >
                          <Layers className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          <span>Club into Enquiry Group</span>
                        </button>

                        <button
                          onClick={() => {
                            setMoreActionsOpen(false);
                            setActiveTab("history");
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700 font-medium"
                        >
                          <HistoryIcon className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                          <span>Complaint History</span>
                        </button>

                        <div className="my-1 border-t border-slate-100" />

                        <div className="px-3 py-1 font-bold uppercase text-[10px] text-slate-400 tracking-wider">
                          Legal Disposals & Evidence
                        </div>

                        <button
                          onClick={() => {
                            setMoreActionsOpen(false);
                            setNcrModalOpen(true);
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700 font-medium"
                        >
                          <FileCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>Issue NCR Reference</span>
                        </button>

                        <button
                          onClick={() => {
                            setMoreActionsOpen(false);
                            setFirModalOpen(true);
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700 font-medium"
                        >
                          <Scale className="w-3.5 h-3.5 text-red-600 shrink-0" />
                          <span>FIR Linkage</span>
                        </button>

                        <button
                          onClick={() => {
                            setMoreActionsOpen(false);
                            setEvidenceModalOpen(true);
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700 font-medium"
                        >
                          <Paperclip className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span>Add Evidence</span>
                        </button>

                        <button
                          onClick={() => {
                            setMoreActionsOpen(false);
                            setEnquiryNoteModalOpen(true);
                            setNewNoteType("WITNESS_EXAMINATION");
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700 font-medium"
                        >
                          <FileText className="w-3.5 h-3.5 text-slate-700 shrink-0" />
                          <span>Add Statement (BNSS 180)</span>
                        </button>

                        <button
                          onClick={() => {
                            setMoreActionsOpen(false);
                            window.print();
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700 font-medium"
                        >
                          <Printer className="w-3.5 h-3.5 text-slate-700 shrink-0" />
                          <span>Print / Acknowledgement</span>
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Other Officers View: Read-Only Badge */}
              {!isAssignedEo && !isSho && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 text-xs font-medium">
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                  <span>Read-Only Progress Overview</span>
                </div>
              )}

              {/* Quick Print Button for Everyone */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                className="gap-1.5 text-xs font-semibold"
                title="Print Citizen Acknowledgement Receipt"
              >
                <Printer className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Print Receipt</span>
              </Button>
            </div>
          </div>

          {/* Officer Assignment Bar (Shows active EO + Roster Duty or Unassigned status) */}
          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-600" />
              <span className="text-slate-500 font-medium">Assigned Enquiry Officer:</span>
              {complaint.assignedEoName ? (
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">{complaint.assignedEoName}</span>
                  <span className="text-[11px] text-slate-500">
                    ({complaint.assignedEoRank}, PNO: {complaint.assignedEoPno})
                  </span>
                  <span className="text-[11px] font-medium text-blue-900 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                    Roster: {complaint.assignedRosterDuty || "Active Duty"}
                  </span>
                </div>
              ) : (
                <span className="text-amber-800 bg-amber-50 border border-amber-200 font-bold px-2 py-0.5 rounded-full">
                  Unassigned • Awaiting SHO Allocation
                </span>
              )}
            </div>

            {complaint.targetResolutionDate && (
              <div className="text-slate-500">
                Target Deadline: <strong className="text-slate-800">{formatDate(complaint.targetResolutionDate)}</strong>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Role & Access Control Notice Banner */}
      <div
        className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs transition-colors ${
          isAssignedEo
            ? "bg-emerald-50/80 border-emerald-300 text-emerald-950"
            : isSho
            ? "bg-blue-50/80 border-blue-300 text-blue-950"
            : "bg-slate-50 border-slate-200 text-slate-800"
        }`}
      >
        <div className="flex items-center gap-2.5">
          {isAssignedEo ? (
            <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4" />
            </div>
          ) : isSho ? (
            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
              <UserCheck className="w-4 h-4" />
            </div>
          ) : (
            <div className="w-7 h-7 rounded-lg bg-slate-400 text-white flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4" />
            </div>
          )}
          <div>
            <div className="font-bold flex items-center gap-1.5">
              <span>
                {isAssignedEo
                  ? `Active Persona: Assigned Enquiry Officer (${currentUser.name})`
                  : isSho
                  ? `Active Persona: Station House Officer (${currentUser.name})`
                  : `Active Persona: ${currentUser.name} (${currentUser.roleDisplay || "Officer"})`}
              </span>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  isAssignedEo
                    ? "bg-emerald-200/80 text-emerald-900 border border-emerald-300"
                    : isSho
                    ? "bg-blue-200/80 text-blue-900 border border-blue-300"
                    : "bg-slate-200 text-slate-700 border border-slate-300"
                }`}
              >
                {isAssignedEo ? "Full Authoring Access" : isSho ? "Supervisory & Review Access" : "Read-Only Overview Access"}
              </span>
            </div>
            <p className="text-[11px] opacity-90 mt-0.5">
              {isAssignedEo
                ? "You are the designated Enquiry Officer for this complaint. Only you can upload evidence, record enquiry notes, upload documents, and modify this case file."
                : isSho
                ? `You have supervisory jurisdiction over this complaint. You can assign/reassign officers and demand progress reports. Investigation entries are recorded by designated EO (${complaint.assignedEoName || "Unassigned"}).`
                : `Official viewing mode. You can inspect all case progress, evidence, notes, documents, and reports in read-only mode. Adding or deleting items is restricted to assigned EO (${complaint.assignedEoName || "Unassigned"}).`}
            </p>
          </div>
        </div>

        {/* Shortcut Action Buttons based on role */}
        <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
          {isSho && !isUnassigned && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setProgressModalOpen(true)}
              className="h-7 text-xs bg-white text-blue-700 border-blue-300 hover:bg-blue-50 font-semibold gap-1"
            >
              <Send className="w-3 h-3 text-blue-600" />
              <span>Ask for Progress Report</span>
            </Button>
          )}
          {isAssignedEo && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setEnquiryNoteModalOpen(true)}
              className="h-7 text-xs bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-50 font-semibold gap-1"
            >
              <FileText className="w-3 h-3 text-emerald-600" />
              <span>Record Note</span>
            </Button>
          )}
        </div>
      </div>

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

      {/* Sub-Tabs Row (Clean, single-row navigation) */}
      <div className="border-b border-slate-200 bg-white rounded-t-xl px-2">
        <nav className="flex space-x-2 sm:space-x-4 overflow-x-auto no-scrollbar" aria-label="Tabs">
          {[
            { key: "overview", label: "Overview", icon: Eye, count: null },
            { key: "evidence", label: "Evidence", icon: Paperclip, count: complaint.attachments?.length || 0 },
            { key: "enquiry_notes", label: "Enquiry Notes", icon: FileText, count: complaint.enquiryNotes?.length || 0 },
            { key: "documents", label: "Documents", icon: UploadCloud, count: complaint.documents?.length || 0 },
            { key: "links", label: "Links", icon: Link2, count: complaint.isCrossComplaint || complaint.linkedComplaintNumber ? 1 : 0 },
            { key: "history", label: "History", icon: HistoryIcon, count: combinedTimeline.length },
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
      </div>

      {/* Tab Content Panes */}
      <div className="space-y-5">
        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
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

                      <div className="pt-1 flex items-center justify-between text-[11px] text-slate-500">
                        <span>Target: {complaint.targetResolutionDate ? formatDate(complaint.targetResolutionDate) : "14 Days"}</span>
                        {canAssign ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleOpenAssign}
                            className="text-[11px] h-7"
                          >
                            Reassign EO
                          </Button>
                        ) : isAssignedEo ? (
                          <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            Assigned to You
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                            Allocated
                          </span>
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
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={handleOpenAssign}
                          className="w-full text-xs font-semibold gap-1"
                        >
                          <UserCheck className="w-3.5 h-3.5" /> Assign Enquiry Officer
                        </Button>
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
                      <span>Evidence Count:</span>
                      <strong className="text-slate-900">{complaint.attachments?.length || 0} Files</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Enquiry Notes:</span>
                      <strong className="text-slate-900">{complaint.enquiryNotes?.length || 0} Recorded</strong>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* TAB 2: EVIDENCE */}
        {activeTab === "evidence" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  Evidence Attachments & Chain-of-Custody
                </h3>
                <p className="text-xs text-slate-500">
                  Secure evidence locker supporting any format (document, audio, video, photos).
                </p>
              </div>
              {isAssignedEo ? (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setEvidenceModalOpen(true)}
                  className="gap-1.5 text-xs font-semibold self-start sm:self-auto"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Evidence</span>
                </Button>
              ) : (
                <span className="text-xs text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-1.5 rounded-lg flex items-center gap-1 font-medium">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Upload restricted to assigned EO ({complaint.assignedEoName || "Unassigned"})</span>
                </span>
              )}
            </div>

            {complaint.attachments && complaint.attachments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {complaint.attachments.map((file) => (
                  <Card key={file.id} className="border-slate-200 shadow-xs">
                    <CardContent className="p-4 space-y-2 text-xs">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          {file.category === "video" && <Video className="w-4 h-4 text-purple-600 shrink-0" />}
                          {file.category === "audio" && <Music className="w-4 h-4 text-amber-600 shrink-0" />}
                          {file.category === "image" && <ImageIcon className="w-4 h-4 text-emerald-600 shrink-0" />}
                          {file.category === "document" && <FileText className="w-4 h-4 text-blue-600 shrink-0" />}
                          {file.category === "other" && <Paperclip className="w-4 h-4 text-slate-600 shrink-0" />}
                          <strong className="text-slate-900 truncate">{file.name}</strong>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                            {file.category}
                          </span>
                          {file.dataUrl && (
                            <button
                              type="button"
                              onClick={() =>
                                setPreviewModalFile({
                                  name: file.name,
                                  category: file.category,
                                  dataUrl: file.dataUrl,
                                  size: file.size,
                                })
                              }
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold transition-colors shadow-2xs"
                              title="Instant Preview without downloading"
                            >
                              <Eye className="w-3.5 h-3.5 text-blue-600" />
                              <span>Preview</span>
                            </button>
                          )}
                          {file.dataUrl && (
                            <a
                              href={file.dataUrl}
                              download={file.name}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 rounded-lg text-xs font-semibold transition-colors shadow-2xs"
                              title="Download evidence attachment"
                            >
                              <Download className="w-3.5 h-3.5 text-blue-600" />
                              <span>Download</span>
                            </a>
                          )}
                          {isAssignedEo && (
                            <button
                              onClick={() => handleDeleteEvidence(file.id)}
                              className="text-slate-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors"
                              title="Delete evidence attachment (Assigned EO only)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {file.description && (
                        <p className="text-slate-600 italic">&ldquo;{file.description}&rdquo;</p>
                      )}

                      {/* Multimedia Players & Document Preview */}
                      {file.category === "audio" && file.dataUrl && (
                        <audio controls src={file.dataUrl} className="w-full h-8 pt-1" />
                      )}

                      {file.category === "video" && file.dataUrl && (
                        <video controls src={file.dataUrl} className="w-full rounded-lg max-h-48 bg-black" />
                      )}

                      {file.category === "image" && file.dataUrl && (
                        <div className="pt-1">
                          <img
                            src={file.dataUrl}
                            alt={file.name}
                            className="max-h-40 rounded-lg object-contain border border-slate-200 bg-slate-50"
                          />
                        </div>
                      )}

                      {file.category === "document" && file.dataUrl && (
                        <div className="pt-1 flex items-center gap-2">
                          <a
                            href={file.dataUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-md text-xs font-semibold transition-colors"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Preview / Open Document</span>
                          </a>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2 text-[11px] text-slate-500 border-t border-slate-100">
                        <span>Uploaded: {formatDateTime(file.uploadedAt)}</span>
                        <span className="font-mono text-[10px]">
                          {(file.size / 1024).toFixed(1)} KB • Digitally Sealed
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-dashed border-2 border-slate-200">
                <CardContent className="p-8 text-center space-y-3">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
                    <Paperclip className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">No Evidence Files Attached Yet</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Upload audio records, CCTV footage, photographs, or supporting documents.
                    </p>
                  </div>
                  {isAssignedEo ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEvidenceModalOpen(true)}
                      className="gap-1.5 text-xs font-semibold"
                    >
                      <Plus className="w-3.5 h-3.5" /> Upload Evidence
                    </Button>
                  ) : (
                    <p className="text-xs text-slate-400 font-medium italic">
                      Awaiting assigned Enquiry Officer ({complaint.assignedEoName || "Unassigned"}) to inspect & upload evidence.
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* TAB 3: ENQUIRY NOTES */}
        {activeTab === "enquiry_notes" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  Official Enquiry Notes & Witness Statements
                </h3>
                <p className="text-xs text-slate-500">
                  Chronological enquiry logs maintained by the designated officer.
                </p>
              </div>
              {isAssignedEo ? (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setEnquiryNoteModalOpen(true)}
                  className="gap-1.5 text-xs font-semibold self-start sm:self-auto"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Record Enquiry Note</span>
                </Button>
              ) : (
                <span className="text-xs text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-1.5 rounded-lg flex items-center gap-1 font-medium">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Recording restricted to assigned EO ({complaint.assignedEoName || "Unassigned"})</span>
                </span>
              )}
            </div>

            {complaint.enquiryNotes && complaint.enquiryNotes.length > 0 ? (
              <div className="space-y-3">
                {complaint.enquiryNotes.map((note) => (
                  <Card key={note.id} className="border-slate-200 shadow-xs">
                    <CardContent className="p-4 space-y-2 text-xs">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">
                            {note.officerName}
                          </span>
                          <span className="text-[11px] text-slate-500 font-mono">
                            ({note.officerRank}, PNO: {note.officerPno})
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                            {note.noteType.replace(/_/g, " ")}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {formatDateTime(note.createdAt)}
                          </span>
                          {isAssignedEo && (
                            <button
                              onClick={() => handleDeleteEnquiryNote(note.id)}
                              className="text-slate-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors"
                              title="Expunge enquiry note (Assigned EO only)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {note.location && (
                        <p className="text-[11px] text-slate-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>Location: {note.location}</span>
                        </p>
                      )}

                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-slate-800 font-sans leading-relaxed text-xs sm:text-sm whitespace-pre-line">
                        {note.content}
                      </div>

                      {/* Attached Media for this Enquiry Note (Any format: video, audio, document, photo) */}
                      {note.attachment && (
                        <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                              <Paperclip className="w-3.5 h-3.5 text-blue-600" />
                              <span>Attached Media: {note.attachment.name}</span>
                            </span>
                            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                              {note.attachment.category} • {(note.attachment.size / 1024).toFixed(1)} KB
                            </span>
                          </div>

                          {note.attachment.category === "audio" && note.attachment.dataUrl && (
                            <audio controls src={note.attachment.dataUrl} className="w-full h-8 pt-1" />
                          )}
                          {note.attachment.category === "video" && note.attachment.dataUrl && (
                            <video controls src={note.attachment.dataUrl} className="w-full rounded max-h-48 bg-black" />
                          )}
                          {note.attachment.category === "image" && note.attachment.dataUrl && (
                            <img
                              src={note.attachment.dataUrl}
                              alt={note.attachment.name}
                              className="max-h-36 rounded object-contain border border-slate-200 bg-slate-50"
                            />
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-dashed border-2 border-slate-200">
                <CardContent className="p-8 text-center space-y-3">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">No Enquiry Notes Recorded</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Chronological field findings, witness examination logs, and spot visit records.
                    </p>
                  </div>
                  {isAssignedEo ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEnquiryNoteModalOpen(true)}
                      className="gap-1.5 text-xs font-semibold"
                    >
                      <Plus className="w-3.5 h-3.5" /> Record First Note
                    </Button>
                  ) : (
                    <p className="text-xs text-slate-400 font-medium italic">
                      Awaiting assigned Enquiry Officer ({complaint.assignedEoName || "Unassigned"}) to record inquiry notes.
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* TAB 4: DOCUMENTS */}
        {activeTab === "documents" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  Official Documents Repository
                </h3>
                <p className="text-xs text-slate-500">
                  Upload MLR copies, revenue patwari demarcation records, notices, or formal affidavits.
                </p>
              </div>
              {isAssignedEo ? (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setDocumentModalOpen(true)}
                  className="gap-1.5 text-xs font-semibold self-start sm:self-auto"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Upload Document</span>
                </Button>
              ) : (
                <span className="text-xs text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-1.5 rounded-lg flex items-center gap-1 font-medium">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Upload restricted to assigned EO ({complaint.assignedEoName || "Unassigned"})</span>
                </span>
              )}
            </div>

            {complaint.documents && complaint.documents.length > 0 ? (
              <Card className="border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Document Name</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4">Uploaded By</th>
                        <th className="py-3 px-4">Date & Time</th>
                        <th className="py-3 px-4 text-right">Size</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {complaint.documents.map((doc) => (
                        <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 font-semibold text-slate-900 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                            <span>{doc.fileName}</span>
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
                              {doc.fileUrl && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setPreviewModalFile({
                                      name: doc.fileName,
                                      category: doc.fileCategory.toLowerCase(),
                                      dataUrl: doc.fileUrl,
                                      size: doc.fileSize,
                                    })
                                  }
                                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold transition-colors shadow-2xs"
                                  title="Instant Preview without downloading"
                                >
                                  <Eye className="w-3.5 h-3.5 text-blue-600" />
                                  <span>Preview</span>
                                </button>
                              )}
                              {doc.fileUrl && (
                                <a
                                  href={doc.fileUrl}
                                  download={doc.fileName}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold transition-colors shadow-2xs"
                                  title="Download official document"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  <span>Download</span>
                                </a>
                              )}
                              {isAssignedEo && (
                                <button
                                  onClick={() => handleDeleteDocument(doc.id)}
                                  className="text-slate-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors inline-flex items-center"
                                  title="Delete document (Assigned EO only)"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
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
                      Upload MLR reports, bank statements, affidavits, or patwari demarcation files.
                    </p>
                  </div>
                  {isAssignedEo ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDocumentModalOpen(true)}
                      className="gap-1.5 text-xs font-semibold"
                    >
                      <UploadCloud className="w-3.5 h-3.5" /> Upload Document
                    </Button>
                  ) : (
                    <p className="text-xs text-slate-400 font-medium italic">
                      Awaiting assigned Enquiry Officer ({complaint.assignedEoName || "Unassigned"}) to upload case documents.
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
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

        {/* TAB 6: HISTORY (Chronological Timeline: First Action at Top ➔ Latest at Bottom) */}
        {activeTab === "history" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
              <div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  Case Activity & Audit Timeline
                </h3>
                <p className="text-xs text-slate-500">
                  Chronological progression from initial complaint registration to current inquiry actions.
                </p>
              </div>
              <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full self-start sm:self-auto">
                First Action at Top ➔ Latest Action at Bottom
              </span>
            </div>

            <div className="relative pl-7 space-y-5 before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
              {combinedTimeline.map((item, index) => {
                const isFirst = index === 0;
                const isLatest = index === combinedTimeline.length - 1;
                return (
                  <div key={item.id} className="relative group">
                    {/* Timeline Node Dot */}
                    <div
                      className={`absolute -left-[31px] top-2 w-5 h-5 rounded-full border-2 border-white shadow-xs flex items-center justify-center text-[9px] font-bold text-white ${
                        isLatest
                          ? "bg-emerald-600 ring-2 ring-emerald-400/40"
                          : isFirst
                          ? "bg-blue-600"
                          : "bg-slate-500"
                      }`}
                    >
                      {index + 1}
                    </div>

                    <Card className={`border shadow-xs ${isLatest ? "border-emerald-200 bg-emerald-50/20" : "border-slate-200"}`}>
                      <CardContent className="p-3.5 sm:p-4 space-y-1.5 text-xs">
                        <div className="flex flex-wrap items-center justify-between gap-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                              Step {index + 1}
                            </span>
                            <strong className="text-slate-900 text-sm">{item.title}</strong>
                            {isFirst && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                                Initial Record
                              </span>
                            )}
                            {isLatest && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Latest Action
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {formatDateTime(item.timestamp)}
                          </span>
                        </div>

                        <p className="text-slate-700 leading-relaxed font-sans">{item.description}</p>

                        <div className="pt-2 flex flex-wrap items-center justify-between text-[11px] text-slate-500 border-t border-slate-100">
                          <span>
                            Action By: <strong>{item.officerName}</strong> {item.officerRank ? `(${item.officerRank})` : ""}
                          </span>
                          {item.documentName && (
                            <span className="font-mono text-blue-600 flex items-center gap-1">
                              <Paperclip className="w-3 h-3" />
                              {item.documentName}
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: ASSIGN ENQUIRY OFFICER & DUTY ROSTER                             */}
      {/* ========================================================================= */}
      {assignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => {
              if (!isAssigning) setAssignModalOpen(false);
            }}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[92vh] flex flex-col z-10 animate-in fade-in-0 zoom-in-95 overflow-hidden">
            {/* Header */}
            <div className="p-4 sm:p-5 bg-[#081225] text-white flex items-center justify-between border-b border-slate-800">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-amber-400">
                    {complaint.complaintNumber}
                  </span>
                  <PriorityBadge priority={complaint.priority} />
                </div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-blue-400" />
                  <span>Assign Enquiry Officer (EO) & Roster Duty</span>
                </h3>
              </div>
              <button
                onClick={() => {
                  if (!isAssigning) setAssignModalOpen(false);
                }}
                className="p-1 rounded-md text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
              {assignSuccess ? (
                <div className="p-4 sm:p-6 text-center space-y-4 animate-in fade-in-0 zoom-in-95">
                  <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-200">
                    <CheckCircle className="w-10 h-10" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-900">
                      Enquiry Officer Assigned & Marked in Database!
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Status moved to <strong className="text-blue-700">Under Enquiry</strong>. Registered in General Diary.
                    </p>
                  </div>

                  {/* Dispatched Notification Card */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left space-y-2 text-xs">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-blue-600" />
                        <span className="font-bold text-slate-900">
                          Notice Dispatched to {selectedEo.name} ({selectedEo.rank}, PNO: {selectedEo.pno})
                        </span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        Dispatched
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Roster Duty:</span>{" "}
                      <strong className="text-slate-800">{selectedEo.rosterDuty}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Directions:</span>
                      <p className="mt-1 p-2 bg-white rounded border border-slate-200 text-slate-800">
                        {assignedDirections}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Step 1: Officer Selection & Duty Roster */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold uppercase tracking-wider text-[#0b192c] flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-blue-600" />
                        <span>1. Active Officer Duty Roster</span>
                      </label>
                      <span className="text-[11px] text-slate-500">Click to select officer</span>
                    </div>

                    <div className="grid grid-cols-1 gap-2.5">
                      {MOCK_ENQUIRY_OFFICERS.map((eo) => {
                        const isSelected = selectedEoId === eo.id;
                        return (
                          <div
                            key={eo.id}
                            onClick={() => setSelectedEoId(eo.id)}
                            className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                              isSelected
                                ? "border-blue-600 bg-blue-50/50 shadow-xs ring-2 ring-blue-500/20"
                                : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/70"
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div>
                                <h4 className="font-bold text-slate-900 text-sm">
                                  {eo.name}{" "}
                                  <span className="text-[10px] text-slate-500 font-normal">
                                    ({eo.rank}, PNO: {eo.pno})
                                  </span>
                                </h4>
                                <p className="text-[11px] text-slate-500 mt-0.5">Beat: {eo.beatZone}</p>
                              </div>
                              <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                                <span className="px-2 py-0.5 rounded-full font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  {eo.availability}
                                </span>
                                <span className="px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-700">
                                  {eo.shift}
                                </span>
                                <span className="px-2 py-0.5 rounded-full font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                  {eo.activeCases} Cases
                                </span>
                              </div>
                            </div>
                            <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                              <span className="text-blue-900 font-medium bg-blue-100/70 px-2 py-0.5 rounded">
                                Roster: {eo.rosterDuty}
                              </span>
                              <span className={`font-semibold ${isSelected ? "text-blue-700" : "text-slate-400"}`}>
                                {isSelected ? "✓ Selected" : "Click to Assign"}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Step 2: Directions Dropdown & Instructions */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <strong className="text-[#0b192c] uppercase font-bold flex items-center gap-1.5">
                        <Send className="w-3.5 h-3.5 text-blue-600" />
                        <span>2. Directions for {selectedEo.name}</span>
                      </strong>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Select Direction Template
                      </label>
                      <select
                        value={directionTemplate}
                        onChange={(e) => handleTemplateChange(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 font-medium"
                      >
                        {DIRECTION_TEMPLATES.map((tmpl) => (
                          <option key={tmpl.key} value={tmpl.key}>
                            {tmpl.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-semibold text-slate-700">
                          Supervisory Directions & Specific Instructions
                        </label>
                        <VoiceInputButton
                          onTranscript={(txt) => setAssignedDirections((p) => (p ? p + " " + txt : txt))}
                          fieldLabel="supervisory directions"
                        />
                      </div>
                      <textarea
                        rows={3}
                        value={assignedDirections}
                        onChange={(e) => setAssignedDirections(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-slate-900"
                        placeholder="Inquiry directions to be dispatched to officer..."
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Target Completion Timeline
                      </label>
                      <select
                        value={targetDays}
                        onChange={(e) => setTargetDays(Number(e.target.value))}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 font-medium"
                      >
                        <option value={3}>3 Days - Urgent Priority / Sensitive Case</option>
                        <option value={7}>7 Days - Standard Spot Inquiry (BNSS 173(3))</option>
                        <option value={10}>10 Days - Complex / Witness Verification</option>
                        <option value={14}>14 Days - Regular Statutory Inquiry Period</option>
                        <option value={30}>30 Days - Extended Inquiries</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            {!assignSuccess && (
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                <span className="text-xs text-slate-600">
                  Assigning to: <strong>{selectedEo.name}</strong>
                </span>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setAssignModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleConfirmAssign}
                    disabled={isAssigning}
                    className="gap-1.5"
                  >
                    {isAssigning ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    <span>Confirm Assign</span>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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
                {previewModalFile.dataUrl && (
                  <a
                    href={previewModalFile.dataUrl}
                    download={previewModalFile.name}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold transition-colors shadow-2xs"
                    title="Download file"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setPreviewModalFile(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
                  title="Close preview"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-auto p-4 sm:p-6 bg-slate-100/50 flex items-center justify-center min-h-[300px]">
              {previewModalFile.category === "image" && previewModalFile.dataUrl && (
                <div className="max-h-[70vh] flex items-center justify-center">
                  <img
                    src={previewModalFile.dataUrl}
                    alt={previewModalFile.name}
                    className="max-h-[70vh] max-w-full rounded-xl object-contain shadow-md border border-slate-200 bg-white"
                  />
                </div>
              )}

              {previewModalFile.category === "video" && previewModalFile.dataUrl && (
                <div className="w-full max-w-2xl bg-black rounded-xl overflow-hidden shadow-lg">
                  <video controls autoPlay src={previewModalFile.dataUrl} className="w-full max-h-[65vh]" />
                </div>
              )}

              {previewModalFile.category === "audio" && previewModalFile.dataUrl && (
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
                previewModalFile.category !== "video" &&
                previewModalFile.category !== "audio" && (
                <div className="w-full h-full min-h-[450px] flex flex-col items-center justify-center">
                  {previewModalFile.dataUrl && previewModalFile.dataUrl.startsWith("data:application/pdf") ? (
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
                        {previewModalFile.dataUrl && (
                          <a
                            href={previewModalFile.dataUrl}
                            download={previewModalFile.name}
                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
                          >
                            <Download className="w-4 h-4" />
                            <span>Download File</span>
                          </a>
                        )}
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
    </div>
  );
}
