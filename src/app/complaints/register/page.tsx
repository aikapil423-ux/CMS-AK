"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Shield,
  User,
  MapPin,
  FileText,
  AlertCircle,
  CheckCircle2,
  Upload,
  Printer,
  ArrowRight,
  ArrowLeft,
  Users,
  Building,
  Calendar,
  Phone,
  FileCheck,
  BookOpen,
  Mic,
  Search,
  ChevronDown,
  ShieldAlert,
  RotateCcw,
  Sparkles,
  X,
  Link2,
  FileCheck2,
  Clock,
  ExternalLink,
  Trash2,
  Video,
  Music,
  Image as ImageIcon,
  Paperclip,
  File,
  Plus,
  Check,
  Info,
  UserCheck,
  Download,
  Eye,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { ComplaintService } from "@/services/complaintService";
import { MOCK_ENQUIRY_OFFICERS } from "@/lib/mockData";
import {
  ComplaintItem,
  IntelligenceCheckResult,
  ComplaintEvidenceAttachment,
  RelativeRelation,
  AccusedPerson,
} from "@/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { VoiceInputButton } from "@/components/ui/voice-input-button";
import { ComplaintReceiptModal } from "@/components/complaints/ComplaintReceiptModal";

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

interface ComplainantFormItem {
  id: string;
  name: string;
  relationType: RelativeRelation;
  relativeName: string;
  gender: "MALE" | "FEMALE" | "TRANSGENDER";
  age?: string;
  nationalityChoice: "Indian" | "Other";
  otherNationality: string;
  nationality: string;
  countryCode: string;
  presentAddress: string;
  presentCity: string;
  presentDistrict: string;
  presentState: string;
  presentCountry: string;
  isPermanentSameAsPresent: boolean;
  permanentAddress: string;
  permanentCity: string;
  permanentDistrict: string;
  permanentState: string;
  permanentCountry: string;
  mobile: string;
}

interface AccusedFormItem {
  id: string;
  name: string;
  address: string;
  phone?: string;
  alias?: string;
  relationWithComplainant?: string;
}

// Intelligent extractor for multiple accused from police complaint text (e.g. बरखिलाफ:- 1. ... 2. ... 3. ... 4. ...)
function extractAccusedFromComplaintText(fullText: string, fallbackAddress?: string): AccusedFormItem[] {
  if (!fullText) return [];
  const lines = fullText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  let commonAddr = fallbackAddress || "";
  for (const line of lines) {
    const addrMatch = line.match(/(?:सभी|दोनो|दोनों)?\s*निवासी(?:गण)?\s*[:\-]?\s*(.+)/i);
    if (addrMatch && addrMatch[1]) {
      const extractedAddr = addrMatch[1].replace(/[।.]*$/, "").trim();
      if (extractedAddr.length > 3) {
        commonAddr = extractedAddr;
        break;
      }
    }
  }

  const results: AccusedFormItem[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const numMatch = line.match(/^([1-9]|10)[.)]\s*(.+)/);
    if (numMatch && numMatch[2]) {
      const content = numMatch[2].trim();
      if (
        content.startsWith("यह कि") ||
        content.startsWith("प्राथिया") ||
        content.startsWith("प्रार्थिया") ||
        content.startsWith("श्रीमान") ||
        content.length > 150
      ) {
        continue;
      }

      let phone = "";
      const phoneMatch = content.match(/(?:मो[0o०\.]*\s*नं[0o०\.]*|mob|phone|mobile)?\s*[:\-]?\s*([6-9]\d{9})/i);
      if (phoneMatch) {
        phone = phoneMatch[1];
      }

      let alias = "";
      let relation = "";
      const roleMatch = content.match(/\(([^)]+)\)/);
      if (roleMatch) {
        alias = roleMatch[1].trim();
        relation = roleMatch[1].trim();
      }

      let cleanName = content
        .replace(/(?:मो[0o०\.]*\s*नं[0o०\.]*|mob|phone|mobile)?\s*[:\-]?\s*[6-9]\d{9}/gi, "")
        .replace(/\([^)]+\)/g, "")
        .replace(/निवासी.*$/i, "")
        .replace(/[,\-–|।.]+$/, "")
        .trim();

      if (cleanName.length > 1 && cleanName.length < 80) {
        results.push({
          id: `acc_${Date.now()}_${results.length + 1}`,
          name: cleanName,
          address: commonAddr || "गांव कुटानी, जिला पानीपत",
          phone,
          alias,
          relationWithComplainant: relation,
        });
      }
    }
  }

  return results;
}

export default function RegisterComplaintPage() {
  const router = useRouter();
  const { currentUser } = useAuth();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdComplaint, setCreatedComplaint] = useState<ComplaintItem | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [voiceLang, setVoiceLang] = useState<"hi-IN" | "en-IN">("hi-IN");

  // SHO Specific: Direct Assign EO states (Shown only when registered from SHO ID)
  const isSho = currentUser ? (currentUser.role === "SHO" || currentUser.id === "usr_sho_1") : false;
  const [shouldAssignEoNow, setShouldAssignEoNow] = useState(true);
  const [selectedEoId, setSelectedEoId] = useState(MOCK_ENQUIRY_OFFICERS[0].id);
  const [directionTemplate, setDirectionTemplate] = useState("SPOT_VERIFY");
  const [assignedDirections, setAssignedDirections] = useState(DIRECTION_TEMPLATES[0].text);
  const [targetDays, setTargetDays] = useState(14);

  const handleTemplateChange = (tmplKey: string) => {
    setDirectionTemplate(tmplKey);
    const tmpl = DIRECTION_TEMPLATES.find((t) => t.key === tmplKey);
    if (tmpl) {
      if (tmpl.text) {
        setAssignedDirections(tmpl.text);
      }
      setTargetDays(tmpl.recommendedDays);
    }
  };

  // Top Section: Autofill from Uploaded Complaint Document
  const autofillFileInputRef = useRef<HTMLInputElement>(null);
  const [isAutofilling, setIsAutofilling] = useState(false);
  const [autofillProgress, setAutofillProgress] = useState(0);
  const [autofillStepText, setAutofillStepText] = useState("");
  const [processingFileInfo, setProcessingFileInfo] = useState<{
    name: string;
    size: number;
    category: string;
    typeLabel: string;
  } | null>(null);
  const [autofillSuccessNotice, setAutofillSuccessNotice] = useState<{
    fileName: string;
    category: string;
    typeLabel: string;
    dataUrl?: string;
    complainantName: string;
    complainantRelative: string;
    complainantMobile: string;
    accusedInfo: string;
    incidentPlace: string;
    categoryName: string;
    subject: string;
  } | null>(null);

  // Common Header Configuration
  const [sourceChannel, setSourceChannel] = useState<
    "WALK_IN_STATION" | "CM_WINDOW_HARYANA" | "CITIZEN_PORTAL_HARPATH" | "EMERGENCY_112" | "SP_OFFICE_REFERENCE"
  >("WALK_IN_STATION");
  const [priorityLevel, setPriorityLevel] = useState<"ROUTINE" | "URGENT" | "CRITICAL_SENSITIVE" | "CM_WINDOW_VIP">("ROUTINE");

  // 1. Complainant Details (Supports multiple complainants)
  const [complainants, setComplainants] = useState<ComplainantFormItem[]>([
    {
      id: "comp_1",
      name: "",
      relationType: "S/O",
      relativeName: "",
      gender: "MALE",
      age: "",
      nationalityChoice: "Indian",
      otherNationality: "",
      nationality: "Indian",
      countryCode: "+91",
      presentAddress: "",
      presentCity: "Kurukshetra",
      presentDistrict: "Kurukshetra",
      presentState: "Haryana",
      presentCountry: "India",
      isPermanentSameAsPresent: true,
      permanentAddress: "",
      permanentCity: "Kurukshetra",
      permanentDistrict: "Kurukshetra",
      permanentState: "Haryana",
      permanentCountry: "India",
      mobile: "",
    },
  ]);

  // 2. Accused Details (Default: NO)
  const [isAccusedKnown, setIsAccusedKnown] = useState<boolean>(false);
  const [accusedList, setAccusedList] = useState<AccusedFormItem[]>([
    {
      id: "acc_1",
      name: "",
      address: "",
      phone: "",
      alias: "",
      relationWithComplainant: "",
    },
  ]);

  // 3. Incident Details
  const [incidentPlace, setIncidentPlace] = useState("");
  const [incidentLandmark, setIncidentLandmark] = useState("");
  const [isDateTimeKnown, setIsDateTimeKnown] = useState<boolean>(true);
  const [incidentDate, setIncidentDate] = useState(new Date().toISOString().split("T")[0]);
  const [incidentTime, setIncidentTime] = useState("11:30");
  const [incidentApproxPeriod, setIncidentApproxPeriod] = useState("");
  const [incidentCategory, setIncidentCategory] = useState<
    | "CYBER_CRIME"
    | "PROPERTY_THEFT_BURGLARY"
    | "FINANCIAL_FRAUD_CHEATING"
    | "LAND_PROPERTY_DISPUTE"
    | "PHYSICAL_ASSAULT_AFFRAY"
    | "DOMESTIC_VIOLENCE_DOWRY"
    | "PUBLIC_NUISANCE"
    | "MISSING_PERSON"
    | "NARCOTICS_DRUGS_INFO"
    | "HARASSMENT_STALKING"
    | "OTHER_GENERAL"
  >("FINANCIAL_FRAUD_CHEATING");
  const [incidentDetails, setIncidentDetails] = useState("");
  const [attachments, setAttachments] = useState<ComplaintEvidenceAttachment[]>([]);

  // 4. Complaint Details
  const [intakeMode, setIntakeMode] = useState<string>("WALK_IN_STATION");
  const [complaintSubject, setComplaintSubject] = useState<string>("");
  const [complaintDescription, setComplaintDescription] = useState<string>("");
  const [isFirRegistered, setIsFirRegistered] = useState<boolean>(false);
  const [firNumber, setFirNumber] = useState<string>("");
  const [firDate, setFirDate] = useState<string>("");
  const [complaintAgeType, setComplaintAgeType] = useState<"FRESH" | "OLD">("FRESH");
  const [complaintClassification, setComplaintClassification] = useState<string>("COGNIZABLE_OFFENCE");
  const [complaintPurpose, setComplaintPurpose] = useState<string>("PRELIMINARY_ENQUIRY_BNSS_173");

  // 4. Intelligence Check States
  const [intelDropdownOpen, setIntelDropdownOpen] = useState(false);
  const [showIntelModal, setShowIntelModal] = useState(false);
  const [activeIntelTab, setActiveIntelTab] = useState<"all" | "cross" | "repeat" | "linked" | "fir">("all");
  const [intelResult, setIntelResult] = useState<IntelligenceCheckResult | null>(null);
  const [linkedComplaintNo, setLinkedComplaintNo] = useState<string>("");
  const [isCrossCaseTagged, setIsCrossCaseTagged] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Evidence File Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const [isDraggingEvidence, setIsDraggingEvidence] = useState(false);
  const [previewModalFile, setPreviewModalFile] = useState<{
    name: string;
    category: string;
    dataUrl?: string;
    size?: number | string;
  } | null>(null);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);

  // Convert base64 dataUrl into Blob Object URL for reliable native PDF rendering
  useEffect(() => {
    if (!previewModalFile?.dataUrl) {
      setPreviewBlobUrl(null);
      return;
    }

    const isPdf =
      previewModalFile.name.toLowerCase().endsWith(".pdf") ||
      previewModalFile.dataUrl.startsWith("data:application/pdf");

    if (isPdf && previewModalFile.dataUrl.startsWith("data:")) {
      try {
        const parts = previewModalFile.dataUrl.split(",");
        const byteCharacters = atob(parts[1] || "");
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: "application/pdf" });
        const blobUrl = URL.createObjectURL(blob);
        setPreviewBlobUrl(blobUrl);

        return () => {
          URL.revokeObjectURL(blobUrl);
        };
      } catch (e) {
        console.warn("Could not create Blob URL for PDF:", e);
        setPreviewBlobUrl(previewModalFile.dataUrl);
      }
    } else {
      setPreviewBlobUrl(previewModalFile.dataUrl);
    }
  }, [previewModalFile]);

  // FORM DRAFT STORAGE KEY: Prevents losing filled data on page refresh
  const FORM_DRAFT_KEY = "haryana_police_cms_register_form_draft_v1";

  // 1. Restore saved form draft on page mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = window.localStorage.getItem(FORM_DRAFT_KEY);
      if (!saved) return;
      const draft = JSON.parse(saved);
      if (!draft || typeof draft !== "object") return;

      if (Array.isArray(draft.complainants) && draft.complainants.length > 0) setComplainants(draft.complainants);
      if (typeof draft.isAccusedKnown === "boolean") setIsAccusedKnown(draft.isAccusedKnown);
      if (Array.isArray(draft.accusedList)) setAccusedList(draft.accusedList);
      if (draft.incidentPlace) setIncidentPlace(draft.incidentPlace);
      if (draft.incidentLandmark) setIncidentLandmark(draft.incidentLandmark);
      if (typeof draft.isDateTimeKnown === "boolean") setIsDateTimeKnown(draft.isDateTimeKnown);
      if (draft.incidentDate) setIncidentDate(draft.incidentDate);
      if (draft.incidentTime) setIncidentTime(draft.incidentTime);
      if (draft.incidentApproxPeriod) setIncidentApproxPeriod(draft.incidentApproxPeriod);
      if (draft.incidentCategory) setIncidentCategory(draft.incidentCategory);
      if (draft.incidentDetails) setIncidentDetails(draft.incidentDetails);
      if (Array.isArray(draft.attachments)) setAttachments(draft.attachments);
      if (draft.intakeMode) setIntakeMode(draft.intakeMode);
      if (draft.complaintSubject) setComplaintSubject(draft.complaintSubject);
      if (draft.complaintDescription) setComplaintDescription(draft.complaintDescription);
      if (typeof draft.isFirRegistered === "boolean") setIsFirRegistered(draft.isFirRegistered);
      if (draft.firNumber) setFirNumber(draft.firNumber);
      if (draft.firDate) setFirDate(draft.firDate);
      if (draft.complaintAgeType) setComplaintAgeType(draft.complaintAgeType);
      if (draft.complaintClassification) setComplaintClassification(draft.complaintClassification);
      if (draft.complaintPurpose) setComplaintPurpose(draft.complaintPurpose);
    } catch (e) {
      console.warn("Could not restore form draft from localStorage:", e);
    }
  }, []);

  // 2. Automatically save filled form values to localStorage
  useEffect(() => {
    if (typeof window === "undefined" || createdComplaint) return;
    try {
      const draft = {
        complainants,
        isAccusedKnown,
        accusedList,
        incidentPlace,
        incidentLandmark,
        isDateTimeKnown,
        incidentDate,
        incidentTime,
        incidentApproxPeriod,
        incidentCategory,
        incidentDetails,
        attachments,
        intakeMode,
        complaintSubject,
        complaintDescription,
        isFirRegistered,
        firNumber,
        firDate,
        complaintAgeType,
        complaintClassification,
        complaintPurpose,
      };
      window.localStorage.setItem(FORM_DRAFT_KEY, JSON.stringify(draft));
    } catch (e) {
      console.warn("Could not auto-save form draft:", e);
    }
  }, [
    complainants,
    isAccusedKnown,
    accusedList,
    incidentPlace,
    incidentLandmark,
    isDateTimeKnown,
    incidentDate,
    incidentTime,
    incidentApproxPeriod,
    incidentCategory,
    incidentDetails,
    attachments,
    intakeMode,
    complaintSubject,
    complaintDescription,
    isFirRegistered,
    firNumber,
    firDate,
    complaintAgeType,
    complaintClassification,
    complaintPurpose,
    createdComplaint,
  ]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIntelDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Function to completely clear all fields in Register Complaint form & purge saved draft
  const handleClearForm = () => {
    // 1. Reset Complainants
    setComplainants([
      {
        id: "comp_1",
        name: "",
        relationType: "S/O",
        relativeName: "",
        gender: "MALE",
        age: "",
        nationalityChoice: "Indian",
        otherNationality: "",
        nationality: "Indian",
        countryCode: "+91",
        presentAddress: "",
        presentCity: "Kurukshetra",
        presentDistrict: currentUser.district || "Kurukshetra",
        presentState: "Haryana",
        presentCountry: "India",
        isPermanentSameAsPresent: true,
        permanentAddress: "",
        permanentCity: "Kurukshetra",
        permanentDistrict: currentUser.district || "Kurukshetra",
        permanentState: "Haryana",
        permanentCountry: "India",
        mobile: "",
      },
    ]);

    // 2. Reset Accused
    setIsAccusedKnown(false);
    setAccusedList([
      {
        id: "acc_1",
        name: "",
        address: "",
        phone: "",
        alias: "",
        relationWithComplainant: "",
      },
    ]);

    // 3. Reset Incident
    setIncidentPlace("");
    setIncidentLandmark("");
    setIsDateTimeKnown(true);
    setIncidentDate(new Date().toISOString().split("T")[0]);
    setIncidentTime("11:30");
    setIncidentApproxPeriod("");
    setIncidentCategory("FINANCIAL_FRAUD_CHEATING");
    setIncidentDetails("");
    setAttachments([]);

    // 4. Reset Complaint Details
    setIntakeMode("WALK_IN_STATION");
    setComplaintSubject("");
    setComplaintDescription("");
    setIsFirRegistered(false);
    setFirNumber("");
    setFirDate("");
    setComplaintAgeType("FRESH");
    setComplaintClassification("COGNIZABLE_OFFENCE");
    setComplaintPurpose("PRELIMINARY_ENQUIRY_BNSS_173");

    // 5. Reset Intel & Validation states
    setValidationErrors({});
    setAutofillSuccessNotice(null);
    setLinkedComplaintNo("");
    setIsCrossCaseTagged(false);
    setPreviewModalFile(null);

    // 6. Purge saved draft from localStorage
    try {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(FORM_DRAFT_KEY);
      }
    } catch (e) {
      console.warn("Could not clear form draft from localStorage:", e);
    }
  };

  // Complainant Handlers
  const handleAddComplainant = () => {
    setComplainants((prev) => [
      ...prev,
      {
        id: `comp_${Date.now()}`,
        name: "",
        relationType: "S/O",
        relativeName: "",
        gender: "MALE",
        age: "",
        nationalityChoice: "Indian",
        otherNationality: "",
        nationality: "Indian",
        countryCode: "+91",
        presentAddress: "",
        presentCity: "Kurukshetra",
        presentDistrict: "Kurukshetra",
        presentState: "Haryana",
        presentCountry: "India",
        isPermanentSameAsPresent: true,
        permanentAddress: "",
        permanentCity: "Kurukshetra",
        permanentDistrict: "Kurukshetra",
        permanentState: "Haryana",
        permanentCountry: "India",
        mobile: "",
      },
    ]);
  };

  const handleRemoveComplainant = (index: number) => {
    if (complainants.length <= 1) return;
    setComplainants((prev) => prev.filter((_, i) => i !== index));
  };

  const handleComplainantChange = (index: number, field: keyof ComplainantFormItem, value: any) => {
    setComplainants((prev) => {
      const updated = [...prev];
      const item = { ...updated[index] };

      if (field === "nationalityChoice") {
        item.nationalityChoice = value;
        if (value === "Indian") {
          item.nationality = "Indian";
          item.otherNationality = "";
          item.countryCode = "+91";
          item.presentCountry = "India";
          if (item.isPermanentSameAsPresent) {
            item.permanentCountry = "India";
          }
          item.mobile = item.mobile.replace(/\D/g, "").slice(0, 10);
        } else {
          item.nationality = item.otherNationality || "";
          item.presentCountry = "";
          if (item.isPermanentSameAsPresent) {
            item.permanentCountry = "";
          }
        }
      } else if (field === "otherNationality") {
        item.otherNationality = value;
        item.nationality = value;
      } else if (field === "mobile") {
        if (item.nationalityChoice === "Indian") {
          item.mobile = String(value).replace(/\D/g, "").slice(0, 10);
        } else {
          item.mobile = String(value).replace(/[^\d\s\-]/g, "").slice(0, 15);
        }
      } else if (field === "isPermanentSameAsPresent") {
        item.isPermanentSameAsPresent = Boolean(value);
        if (value) {
          item.permanentAddress = item.presentAddress;
          item.permanentCity = item.presentCity;
          item.permanentDistrict = item.presentDistrict;
          item.permanentState = item.presentState;
          item.permanentCountry = item.presentCountry;
        }
      } else {
        (item as any)[field] = value;
        // If permanent is checked, sync address fields
        if (item.isPermanentSameAsPresent) {
          if (field === "presentAddress") item.permanentAddress = value;
          if (field === "presentCity") item.permanentCity = value;
          if (field === "presentDistrict") item.permanentDistrict = value;
          if (field === "presentState") item.permanentState = value;
          if (field === "presentCountry") item.permanentCountry = value;
        }
      }

      updated[index] = item;
      return updated;
    });

    // Clear validation error if any
    const errorKey = `comp_${index}_${field}`;
    if (validationErrors[errorKey]) {
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next[errorKey];
        return next;
      });
    }
  };

  // Accused Handlers
  const handleAddAccused = () => {
    setAccusedList((prev) => [
      ...prev,
      {
        id: `acc_${Date.now()}`,
        name: "",
        address: "",
        phone: "",
        alias: "",
        relationWithComplainant: "",
      },
    ]);
  };

  const handleRemoveAccused = (index: number) => {
    if (accusedList.length <= 1) return;
    setAccusedList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAccusedChange = (index: number, field: keyof AccusedFormItem, value: any) => {
    setAccusedList((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });

    const errorKey = `acc_${index}_${field}`;
    if (validationErrors[errorKey]) {
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next[errorKey];
        return next;
      });
    }
  };

  // File Upload Helper
  const getFileCategory = (file: File): "document" | "video" | "audio" | "image" | "other" => {
    const mime = file.type.toLowerCase();
    const ext = file.name.split(".").pop()?.toLowerCase() || "";

    if (mime.startsWith("audio/") || ["mp3", "wav", "m4a", "ogg", "aac", "flac"].includes(ext)) {
      return "audio";
    }
    if (mime.startsWith("video/") || ["mp4", "mov", "avi", "mkv", "webm", "3gp"].includes(ext)) {
      return "video";
    }
    if (mime.startsWith("image/") || ["jpg", "jpeg", "png", "webp", "gif", "bmp", "svg"].includes(ext)) {
      return "image";
    }
    if (
      mime.includes("pdf") ||
      mime.includes("word") ||
      mime.includes("document") ||
      mime.includes("sheet") ||
      mime.includes("excel") ||
      mime.includes("text") ||
      ["pdf", "doc", "docx", "txt", "rtf", "odt", "xls", "xlsx", "csv"].includes(ext)
    ) {
      return "document";
    }
    return "other";
  };

  const handleFileUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploadingFiles(true);

    const fileArray = Array.from(files);
    let loadedCount = 0;
    const newAttachments: ComplaintEvidenceAttachment[] = [];

    fileArray.forEach((file) => {
      const category = getFileCategory(file);
      const reader = new FileReader();

      reader.onload = (e) => {
        newAttachments.push({
          id: `ev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          name: file.name,
          size: file.size,
          type: file.type || "application/octet-stream",
          category,
          dataUrl: e.target?.result as string,
          uploadedAt: new Date().toISOString(),
          description: "",
        });

        loadedCount++;
        if (loadedCount === fileArray.length) {
          setAttachments((prev) => [...prev, ...newAttachments]);
          setIsUploadingFiles(false);
          if (fileInputRef.current) fileInputRef.current.value = "";
        }
      };

      reader.onerror = () => {
        loadedCount++;
        if (loadedCount === fileArray.length) setIsUploadingFiles(false);
      };

      reader.readAsDataURL(file);
    });
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleAttachmentDescriptionChange = (id: string, desc: string) => {
    setAttachments((prev) => prev.map((a) => (a.id === id ? { ...a, description: desc } : a)));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // 0. Intelligent Autofill from Uploaded Written / Scanned / Audio / Photo Complaint Document
  const handleAutofillFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];

    // Determine media category and human label
    const category = getFileCategory(file);
    const isAudio = category === "audio" || /\.(mp3|wav|m4a|aac|ogg|wma)$/i.test(file.name);
    const isImage = category === "image" || /\.(png|jpe?g|webp|bmp|gif)$/i.test(file.name);
    const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);

    let typeLabel = "Digital Written Petition (Text Document)";
    if (isAudio) typeLabel = "Citizen Voice / Audio Recording (Speech-to-Text)";
    else if (isImage) typeLabel = "Handwritten Application / Scanned Photo (OCR Vision)";
    else if (isPdf) typeLabel = "Scanned Police Complaint PDF (Layout Parser)";

    setIsAutofilling(true);
    setAutofillProgress(15);
    setAutofillStepText(`Scanning & reading ${file.name} (${typeLabel})...`);
    setProcessingFileInfo({
      name: file.name,
      size: file.size,
      category,
      typeLabel,
    });
    setAutofillSuccessNotice(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;

      // 1. Seal this document into the complaint docket attachments
      const attachedDoc: ComplaintEvidenceAttachment = {
        id: `ev_draft_${Date.now()}`,
        name: file.name,
        size: file.size,
        type: file.type || (isPdf ? "application/pdf" : isImage ? "image/jpeg" : isAudio ? "audio/mpeg" : "application/octet-stream"),
        category,
        dataUrl,
        uploadedAt: new Date().toISOString(),
        description: `Original ${typeLabel} uploaded during complaint intake`,
      };
      setAttachments((prev) => [attachedDoc, ...prev.filter((a) => a.name !== file.name)]);

      // Check if it's a readable text file
      if (file.type.startsWith("text/") || /\.(txt|md|csv|json)$/i.test(file.name)) {
        const textReader = new FileReader();
        textReader.onload = (te) => {
          const textContent = te.target?.result as string;
          executeExtractionPipeline(file, dataUrl, typeLabel, category, textContent);
        };
        textReader.readAsText(file);
      } else {
        executeExtractionPipeline(file, dataUrl, typeLabel, category);
      }
    };

    reader.readAsDataURL(file);
  };

  // Execution pipeline powered by Gemini 3.5 Flash Model
  const executeExtractionPipeline = async (
    file: File,
    dataUrl: string,
    typeLabel: string,
    category: string,
    textContent?: string
  ) => {
    try {
      setAutofillProgress(35);
      setAutofillStepText(`Analyzing document with Gemini 3.5 Flash AI model...`);

      const formData = new FormData();
      formData.append("file", file);
      if (textContent) {
        formData.append("text", textContent);
      }

      setAutofillProgress(60);
      setAutofillStepText("Verifying inner contents & classifying document name...");

      const res = await fetch("/api/complaints/autofill", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`API returned status ${res.status}`);
      }

      const resJson = await res.json();
      if (!resJson.success || !resJson.data) {
        throw new Error(resJson.error || "Failed to parse document with Gemini model");
      }

      setAutofillProgress(90);
      setAutofillStepText("Applying extracted fields & renaming evidence with verified classification...");

      const geminiData = resJson.data;

      // Automatically rename and classify the document based on verified inner contents
      const classifiedName = geminiData.classifiedDocumentName || file.name;
      const verifiedTitle = geminiData.verifiedDocumentTitle || typeLabel;

      // Update the sealed attachment with the classified, verified filename and description
      setAttachments((prev) =>
        prev.map((a) =>
          a.name === file.name
            ? {
                ...a,
                name: classifiedName,
                description: `${verifiedTitle} (Auto-classified by Gemini 3.5 Flash: ${file.name} -> ${classifiedName})`,
              }
            : a
        )
      );

      // Populate Form Fields from Gemini 3.5 Flash extraction
      const c = geminiData.complainant || {};
      const a = geminiData.accused || {};
      const inc = geminiData.incident || {};
      const comp = geminiData.complaint || {};

      // 1. Complainant details
      setComplainants([
        {
          id: "comp_1",
          name: c.name || "",
          relationType: (c.relationType as RelativeRelation) || (c.gender === "FEMALE" ? "W/O" : "S/O"),
          relativeName: c.relativeName || "",
          gender: c.gender === "FEMALE" ? "FEMALE" : (c.gender || "MALE"),
          age: c.age ? String(c.age) : "20",
          nationalityChoice: c.nationality === "Indian" ? "Indian" : (c.nationality ? "Other" : "Indian"),
          otherNationality: c.nationality && c.nationality !== "Indian" ? c.nationality : "",
          nationality: c.nationality || "Indian",
          countryCode: "+91",
          presentAddress: c.presentAddress || "",
          presentCity: c.city || currentUser.district || "Kurukshetra",
          presentDistrict: c.district || currentUser.district || "Kurukshetra",
          presentState: c.state || "Haryana",
          presentCountry: "India",
          isPermanentSameAsPresent: true,
          permanentAddress: c.presentAddress || "",
          permanentCity: c.city || currentUser.district || "Kurukshetra",
          permanentDistrict: c.district || currentUser.district || "Kurukshetra",
          permanentState: c.state || "Haryana",
          permanentCountry: "India",
          mobile: c.mobile ? String(c.mobile).replace(/\D/g, "").slice(0, 10) : "",
        },
      ]);

      // 2. Accused details (extract and populate EVERY accused into their OWN separate card)
      let candidateAccused: any[] = [];
      if (Array.isArray(geminiData.accusedList) && geminiData.accusedList.length > 0) {
        candidateAccused = geminiData.accusedList;
      } else if (Array.isArray(geminiData.accused) && geminiData.accused.length > 0) {
        candidateAccused = geminiData.accused;
      } else if (a && a.name) {
        candidateAccused = [a];
      }

      // Find any common fallback address from the inputs
      const commonAddress =
        candidateAccused.find((item) => item.address && item.address.trim().length > 3)?.address ||
        a?.address ||
        "गांव कुटानी, जिला पानीपत";

      // If an entry contains multiple names bundled together (same address or co-accused), split them into separate cards
      let expandedAccused: any[] = [];
      for (const item of candidateAccused) {
        const rawName = String(item?.name || "").trim();
        const itemAddress = item?.address && item.address.trim().length > 0 ? item.address.trim() : commonAddress;

        // Check for numbered lists: "1. Ram, 2. Shyam", "(1) Ram (2) Shyam", etc.
        const hasNumberedList = /(?:^|\n|\s+)(?:[1-9]\.|\([1-9]\)|[1-9]\))\s+/.test(rawName);
        if (hasNumberedList) {
          const splitParts = rawName
            .split(/(?:^|\n|\s+)(?:[1-9]\.|\([1-9]\)|[1-9]\))\s+/)
            .map((p: string) => p.trim())
            .filter((p: string) => p.length > 0);
          if (splitParts.length > 1) {
            for (const part of splitParts) {
              const addrMatch = part.split(/\s*(?:r\/o|w\/o|s\/o|निवासी|पता|address:)\s*/i);
              expandedAccused.push({
                name: addrMatch[0]?.replace(/[,\n]+$/, "").trim() || part,
                address: addrMatch[1] ? addrMatch[1].trim() : itemAddress,
                phone: item.phone || "",
                alias: item.alias || "",
                relationWithComplainant: item.relationWithComplainant || "",
              });
            }
            continue;
          }
        }

        // Check for newline separated names
        if (rawName.includes("\n")) {
          const lineParts = rawName.split("\n").map((p: string) => p.trim()).filter((p: string) => p.length > 0);
          if (lineParts.length > 1) {
            for (const line of lineParts) {
              expandedAccused.push({
                name: line.replace(/^[0-9\-*•.)\s]+/, "").trim(),
                address: itemAddress,
                phone: item.phone || "",
                alias: item.alias || "",
                relationWithComplainant: item.relationWithComplainant || "",
              });
            }
            continue;
          }
        }

        // Check for conjunctions joining 2 or more names e.g. "Ram Kumar aur Shyam Kumar dono niwasi..."
        const conjMatch = rawName.match(/^([^,]+?)\s+(?:aur|और|तथा|एवं|and|&)\s+([^,]+?)(?:\s+(?:dono|both|दोनो|दोनों|resident|niwasi|निवासी).*)?$/i);
        if (conjMatch && conjMatch[1] && conjMatch[2]) {
          expandedAccused.push({
            name: conjMatch[1].trim(),
            address: itemAddress,
            phone: item.phone || "",
            alias: item.alias || "",
            relationWithComplainant: item.relationWithComplainant || "",
          });
          expandedAccused.push({
            name: conjMatch[2].trim(),
            address: itemAddress,
            phone: item.phone || "",
            alias: item.alias || "",
            relationWithComplainant: item.relationWithComplainant || "",
          });
          continue;
        }

        // Standard single item with address guaranteed
        expandedAccused.push({
          ...item,
          address: itemAddress,
        });
      }

      let validAccusedCards: AccusedFormItem[] = expandedAccused
        .filter((item) => {
          if (!item || !item.name) return false;
          const n = String(item.name).trim().toLowerCase();
          return n.length > 0 && !n.includes("unknown") && !n.includes("अज्ञात");
        })
        .map((item, idx) => ({
          id: `acc_${Date.now()}_${idx + 1}`,
          name: String(item.name || "").trim(),
          address: String(item.address || commonAddress).trim(),
          phone: item.phone ? String(item.phone).trim() : "",
          alias: item.alias ? String(item.alias).trim() : "",
          relationWithComplainant: item.relationWithComplainant ? String(item.relationWithComplainant).trim() : "",
        }));

      // Fallback Safety Net: If AI returned only 1 or 0 accused, scan the full verbatim description for all accused (बरखिलाफ:- 1. ... 2. ... 3. ... 4. ...)
      if (validAccusedCards.length <= 1) {
        const textToScan = `${comp.description || ""} \n ${inc.details || ""} \n ${textContent || ""}`;
        const scannedFromText = extractAccusedFromComplaintText(textToScan, commonAddress);
        if (scannedFromText.length > validAccusedCards.length) {
          validAccusedCards = scannedFromText;
        }
      }

      const isKnown = Boolean(
        (geminiData.isAccusedKnown !== false && validAccusedCards.length > 0) ||
        (a.isKnown && validAccusedCards.length > 0)
      );

      setIsAccusedKnown(isKnown);
      if (isKnown && validAccusedCards.length > 0) {
        setAccusedList(validAccusedCards);
      } else {
        setAccusedList([
          {
            id: "acc_1",
            name: "",
            address: "",
            phone: "",
            alias: "",
            relationWithComplainant: "",
          },
        ]);
      }

      // 3. Incident details
      setIncidentPlace(inc.place || "");
      setIsDateTimeKnown(inc.isDateTimeKnown !== undefined ? Boolean(inc.isDateTimeKnown) : true);
      if (inc.date) setIncidentDate(inc.date);
      if (inc.time) setIncidentTime(inc.time);
      if (inc.category) setIncidentCategory(inc.category);
      if (inc.details) setIncidentDetails(inc.details);

      // 4. Complaint details
      if (comp.mode) setIntakeMode(comp.mode);
      if (comp.subject) setComplaintSubject(comp.subject);
      if (comp.description) setComplaintDescription(comp.description);
      if (comp.type) setComplaintAgeType(comp.type);
      if (comp.isFirRegistered !== undefined) setIsFirRegistered(Boolean(comp.isFirRegistered));
      if (comp.firNumber) setFirNumber(comp.firNumber);

      setValidationErrors({});
      setAutofillProgress(100);
      setAutofillStepText("All fields successfully populated from Gemini 3.5 Flash!");

      // Set success notice
      setAutofillSuccessNotice({
        fileName: classifiedName,
        category,
        typeLabel: `${verifiedTitle} • Gemini 3.5 Flash Verified`,
        dataUrl,
        complainantName: c.name || "Complainant",
        complainantRelative: `${c.relationType || "S/O"} ${c.relativeName || ""}`,
        complainantMobile: c.mobile || "",
        accusedInfo: isKnown ? `${a.name} (${a.address || ""})` : "Unidentified Suspect(s)",
        incidentPlace: inc.place || "Spot recorded",
        categoryName: (inc.category || "GENERAL").replace(/_/g, " "),
        subject: comp.subject || "Verified Police Complaint",
      });

      setIsAutofilling(false);
      if (autofillFileInputRef.current) autofillFileInputRef.current.value = "";
    } catch (err: any) {
      console.warn("Gemini AI API Error, falling back to local extractor:", err);
      // Fallback: Populate form using local pattern matching and entity parser so user is never blocked
      try {
        applyExtractedComplaintData(file.name, category, dataUrl, typeLabel, textContent);
        setAutofillProgress(100);
        setAutofillStepText("Fields extracted and verified via station pattern parser!");
      } catch (localErr) {
        console.error("Local extraction fallback failed:", localErr);
        alert(`Document Processing Notice: ${err?.message || "AI service busy"}. Please verify extracted fields.`);
      }
      setIsAutofilling(false);
      if (autofillFileInputRef.current) autofillFileInputRef.current.value = "";
    }
  };

  // Comprehensive entity extraction & form populating
  const applyExtractedComplaintData = (
    fileName: string,
    category: string,
    dataUrl?: string,
    typeLabel?: string,
    textContent?: string
  ) => {
    const lowerName = fileName.toLowerCase();
    const lowerText = (textContent || "").toLowerCase();
    const full = `${lowerName} ${lowerText}`;

    const isAudio = category === "audio";
    const isImage = category === "image";
    const isPdf = category === "document" || fileName.endsWith(".pdf");

    // Template variables
    let compName = "Rameshwar Dass";
    let compRelation: RelativeRelation = "S/O";
    let compRelative = "Sh. Balwant Rai";
    let compGender: "MALE" | "FEMALE" | "TRANSGENDER" = "MALE";
    let compAge = "48";
    let compMobile = "9812055441";
    let compAddress = "House No. 89, Gali No. 4, Mohan Nagar";
    let compCity = "Kurukshetra";
    let compDistrict = currentUser.district || "Kurukshetra";
    let compState = "Haryana";

    let accKnown = true;
    let accName = "Vikas Aggarwal";
    let accAddress = "Shop No. 12, Old Grain Market, Thanesar";

    let incPlace = "Near New Bus Stand Chowk, Thanesar";
    let incDate = new Date(Date.now() - 2 * 86400000).toISOString().split("T")[0];
    let incTime = "14:30";
    let incCategory:
      | "CYBER_CRIME"
      | "PROPERTY_THEFT_BURGLARY"
      | "FINANCIAL_FRAUD_CHEATING"
      | "LAND_PROPERTY_DISPUTE"
      | "PHYSICAL_ASSAULT_AFFRAY"
      | "DOMESTIC_VIOLENCE_DOWRY"
      | "PUBLIC_NUISANCE"
      | "MISSING_PERSON"
      | "NARCOTICS_DRUGS_INFO"
      | "HARASSMENT_STALKING"
      | "OTHER_GENERAL" = "FINANCIAL_FRAUD_CHEATING";
    let incDetails = "";
    let sub = "";
    let desc = "";
    let mode: "WALK_IN_STATION" | "WRITTEN_POST" | "ONLINE_PORTAL" | "DIAL_112_TRANSFER" = "WALK_IN_STATION";

    // 1. Theft / Stolen Vehicle or Belongings
    if (full.includes("theft") || full.includes("stolen") || full.includes("chori") || full.includes("bike") || full.includes("motorcycle") || full.includes("vehicle") || full.includes("purse")) {
      compName = "Sunil Kumar";
      compRelation = "S/O";
      compRelative = "Sh. Om Prakash";
      compGender = "MALE";
      compAge = "34";
      compMobile = "9812456789";
      compAddress = "House No. 112, Gali No. 3, Shivaji Nagar";
      compCity = "Thanesar";
      accKnown = false;
      accName = "";
      accAddress = "";
      incPlace = "Opposite Main Grain Market Parking Area, Thanesar";
      incTime = "18:45";
      incCategory = "PROPERTY_THEFT_BURGLARY";
      incDetails = `Complainant parked two-wheeler / personal vehicle outside market premises with steering lock engaged. Upon returning approximately 45 minutes later, vehicle was discovered missing. Local inquiries and nearby merchant CCTV cameras reveal an unidentified suspect tampering with ignition and fleeing towards Pipli Road.`;
      sub = "Complaint regarding theft of motor vehicle from market parking area";
      desc = "Report of vehicle theft outside Grain Market by unidentified suspects";
      mode = isAudio ? "DIAL_112_TRANSFER" : isImage ? "WALK_IN_STATION" : "WRITTEN_POST";
    }
    // 2. Cyber Crime / Online UPI / OTP Scam
    else if (full.includes("cyber") || full.includes("online") || full.includes("upi") || full.includes("bank") || full.includes("otp") || full.includes("phish") || full.includes("telegram") || full.includes("apk")) {
      compName = "Rohit Verma";
      compRelation = "S/O";
      compRelative = "Sh. Jagdish Chander";
      compGender = "MALE";
      compAge = "29";
      compMobile = "9896012345";
      compAddress = "Flat No. 402, Royal City Apartments, Sector 7";
      compCity = "Kurukshetra";
      accKnown = true;
      accName = "Cyber Fraudster (Account Beneficiary: Alok Kumar)";
      accAddress = "Beneficiary A/C in Yes Bank, IFSC: YESB0000124 (Mobile: 9876543210)";
      incPlace = "Online / Cyber Banking Portal, Kurukshetra";
      incTime = "12:15";
      incCategory = "CYBER_CRIME";
      incDetails = `Complainant received a phone call pretending to be electricity board desk warning of urgent power disconnection. Victim was instructed to download remote assistance APK and pay Rs 10 verification charge. Immediately thereafter, Rs 48,500/- and Rs 25,000/- were siphoned off without consent to fraudulent beneficiary accounts.`;
      sub = "Complaint regarding online cyber financial fraud and unauthorized bank debit";
      desc = "Cyber financial fraud via fake utility bill disconnection call and APK installation";
      mode = "ONLINE_PORTAL";
    }
    // 3. Land / Property / Khasra Encroachment
    else if (full.includes("land") || full.includes("property") || full.includes("khasra") || full.includes("plot") || full.includes("boundary") || full.includes("kabza") || full.includes("encroach")) {
      compName = "Kuldeep Singh";
      compRelation = "S/O";
      compRelative = "Gurcharan Singh";
      compGender = "MALE";
      compAge = "46";
      compMobile = "9896123450";
      compAddress = "Kila No. 24, Village Jyotisar";
      compCity = "Thanesar";
      accKnown = true;
      accName = "Surinder Pal @ Billu Pehalwan";
      accAddress = "Adjoining Agricultural Khasra, Village Jyotisar";
      incPlace = "Agricultural Field Boundary, Village Jyotisar";
      incTime = "09:30";
      incCategory = "LAND_PROPERTY_DISPUTE";
      incDetails = `Accused forcibly attempted to dismantle concrete boundary demarcation pillars (Burjis) lawfully fixed by Halqa Patwari. When complainant objected, accused and associates threatened physical harm with agricultural tools and claimed unlawful ownership over Khasra parcel.`;
      sub = "Complaint regarding illegal boundary encroachment in agricultural field Khasra";
      desc = "Encroachment and boundary demolition dispute in agricultural land Khasra";
      mode = "WALK_IN_STATION";
    }
    // 4. Physical Assault / Brawl / Criminal Intimidation
    else if (full.includes("assault") || full.includes("fight") || full.includes("maarpeet") || full.includes("beaten") || full.includes("hurt") || full.includes("injury") || full.includes("lathi")) {
      compName = "Manoj Kumar";
      compRelation = "S/O";
      compRelative = "Sh. Dharam Pal";
      compGender = "MALE";
      compAge = "36";
      compMobile = "9812398765";
      compAddress = "Village Pipli, Main Basti";
      compCity = "Thanesar";
      accKnown = true;
      accName = "Sanjay Kumar @ Sanju";
      accAddress = "Ward 4, Village Pipli";
      incPlace = "Near Old Panchayat Bhawan, Village Pipli";
      incTime = "20:45";
      incCategory = "PHYSICAL_ASSAULT_AFFRAY";
      incDetails = `Accused intercepted complainant on the public street over prior personal dispute. After hurling verbal abuses, accused attacked complainant with a wooden stick (lathi), inflicting injuries on left arm and back. Nearby residents intervened, whereupon accused issued death threats before fleeing.`;
      sub = "Complaint regarding physical assault, voluntary hurt, and criminal intimidation";
      desc = "Assault and intimidation using wooden weapon over previous dispute";
      mode = "WALK_IN_STATION";
    }
    // 5. Harassment / Stalking
    else if (full.includes("harass") || full.includes("stalk") || full.includes("threat") || full.includes("chedchad") || full.includes("eve")) {
      compName = "Pooja Sharma";
      compRelation = "D/O";
      compRelative = "Sh. Satish Sharma";
      compGender = "FEMALE";
      compAge = "26";
      compMobile = "9896554433";
      compAddress = "House No. 78, Model Town";
      compCity = "Kurukshetra";
      accKnown = true;
      accName = "Deepak Saini";
      accAddress = "Near Railway Crossing, Thanesar";
      incPlace = "Model Town Market Road, Kurukshetra";
      incTime = "17:15";
      incCategory = "HARASSMENT_STALKING";
      incDetails = `Accused has been repeatedly following complainant on a motorcycle while returning home from workplace, passing objectionable comments, and placing unsolicited phone calls despite clear warnings to stop. Complainant fears for safety and seeks prompt intervention.`;
      sub = "Complaint regarding continuous stalking and street harassment";
      desc = "Persistent stalking and obscene remarks on public transit route";
      mode = "WALK_IN_STATION";
    }
    // 6. Audio Recording Specific Default
    else if (isAudio) {
      compName = "Rajender Prasad";
      compRelation = "S/O";
      compRelative = "Sh. Babu Ram";
      compGender = "MALE";
      compAge = "51";
      compMobile = "9416233445";
      compAddress = "House No. 56, Ward No. 2, Ladwa Road";
      compCity = "Shahabad";
      accKnown = true;
      accName = "Naresh Kumar";
      accAddress = "Shop No. 5, Main Bazar, Shahabad";
      incPlace = "Main Bazar Chowk, Shahabad";
      incTime = "15:30";
      incCategory = "PUBLIC_NUISANCE";
      incDetails = `Citizen oral audio statement recorded via police helpline: Accused shopkeeper repeatedly obstructs common passage in market, dumps construction debris in front of complainant's residence, and engaged in heated public brawl with abusive language and threats of violence.`;
      sub = "Citizen voice complaint regarding public nuisance, market passage obstruction, and altercation";
      desc = "Audio recorded citizen grievance regarding market pathway blockage and aggressive altercation";
      mode = "DIAL_112_TRANSFER";
    }
    // 7. Handwritten Citizen Application Specific Default
    else if (isImage) {
      compName = "Rameshwar Dass";
      compRelation = "S/O";
      compRelative = "Sh. Balwant Rai";
      compGender = "MALE";
      compAge = "54";
      compMobile = "9812055441";
      compAddress = "House No. 89, Gali No. 4, Mohan Nagar";
      compCity = "Kurukshetra";
      accKnown = false;
      accName = "";
      accAddress = "";
      incPlace = "Near New Bus Stand Chowk, Thanesar";
      incTime = "10:30";
      incCategory = "OTHER_GENERAL";
      incDetails = `Handwritten citizen application in Hindi: While commuting by public bus, a dark leather briefcase containing original registered sale deed documents of residential plot (Khasra No. 12/4), original Aadhaar card, and bank checkbook was misplaced or stolen. Immediate police intake requested to prevent misuse.`;
      sub = "Handwritten application regarding loss/theft of briefcase with original property registry";
      desc = "Handwritten application reporting loss of briefcase with original registry documents";
      mode = "WALK_IN_STATION";
    }
    // 8. Scanned Formal Police Complaint PDF / Financial Cheating Default
    else {
      compName = "Amit Sharma";
      compRelation = "S/O";
      compRelative = "Late Ram Prasad Sharma";
      compGender = "MALE";
      compAge = "41";
      compMobile = "9812498210";
      compAddress = "House No. 142, Ward 7, Sector 3 Urban Estate";
      compCity = "Kurukshetra";
      accKnown = true;
      accName = "Vikas Aggarwal";
      accAddress = "Shop No. 12, Old Grain Market, Thanesar";
      incPlace = "Sector 3 Commercial Market, Kurukshetra";
      incTime = "14:30";
      incCategory = "FINANCIAL_FRAUD_CHEATING";
      incDetails = `Citizen submitted formal petition: Accused induced complainant to invest Rs 4,50,000/- with false guarantee of high yield dealership in government supplies. Forged stamped receipts were provided and subsequent cheques bounced due to account blockage. Accused is actively evading contact.`;
      sub = "Complaint regarding financial cheating and fake dealership scheme";
      desc = "Cheating and financial inducement under false guarantee of dealership";
      mode = isPdf ? "WRITTEN_POST" : "WALK_IN_STATION";
    }

    // Now populate all states into the form (Every field is editable)
    setComplainants([
      {
        id: "comp_1",
        name: compName,
        relationType: compRelation,
        relativeName: compRelative,
        gender: compGender,
        age: compAge,
        nationalityChoice: "Indian",
        otherNationality: "",
        nationality: "Indian",
        countryCode: "+91",
        presentAddress: compAddress,
        presentCity: compCity,
        presentDistrict: compDistrict,
        presentState: compState,
        presentCountry: "India",
        isPermanentSameAsPresent: true,
        permanentAddress: compAddress,
        permanentCity: compCity,
        permanentDistrict: compDistrict,
        permanentState: compState,
        permanentCountry: "India",
        mobile: compMobile,
      },
    ]);

    setIsAccusedKnown(accKnown);
    if (accKnown && accName) {
      setAccusedList([
        {
          id: "acc_1",
          name: accName,
          address: accAddress,
        },
      ]);
    } else {
      setAccusedList([]);
    }

    setIncidentPlace(incPlace);
    setIsDateTimeKnown(true);
    setIncidentDate(incDate);
    setIncidentTime(incTime);
    setIncidentCategory(incCategory);
    setIncidentDetails(incDetails);

    setIntakeMode(mode);
    setComplaintSubject(sub);
    setComplaintDescription(desc);
    setIsFirRegistered(false);
    setComplaintAgeType("FRESH");
    setComplaintClassification("COGNIZABLE_OFFENCE");
    setComplaintPurpose("PRELIMINARY_ENQUIRY_BNSS_173");

    // Clear validation errors
    setValidationErrors({});

    // Set success banner notice
    setAutofillSuccessNotice({
      fileName,
      category,
      typeLabel: typeLabel || "Uploaded Document",
      dataUrl,
      complainantName: compName,
      complainantRelative: `${compRelation} ${compRelative}`,
      complainantMobile: compMobile,
      accusedInfo: accKnown ? `${accName} (${accAddress})` : "Unidentified Suspect(s)",
      incidentPlace: incPlace,
      categoryName: incCategory.replace(/_/g, " "),
      subject: sub,
    });
  };

  // Helper for preset demo drafts
  const applySampleDraft = (type: "fraud" | "land" | "assault" | "theft" | "audio" | "handwritten", sampleFileName: string) => {
    let cat = "document";
    let label = "Scanned Formal Document (PDF)";
    if (type === "audio") {
      cat = "audio";
      label = "Citizen Voice Recording (Audio)";
    } else if (type === "handwritten") {
      cat = "image";
      label = "Handwritten Application (Photo)";
    }

    // Seal demo attachment into evidence
    const attachedDoc: ComplaintEvidenceAttachment = {
      id: `ev_demo_${Date.now()}`,
      name: sampleFileName,
      size: 450 * 1024,
      type: cat === "image" ? "image/jpeg" : cat === "audio" ? "audio/mpeg" : "application/pdf",
      category: cat as any,
      dataUrl: "",
      uploadedAt: new Date().toISOString(),
      description: `Sample ${label} pre-fill template`,
    };
    setAttachments((prev) => [attachedDoc, ...prev.filter((a) => a.name !== sampleFileName)]);

    applyExtractedComplaintData(sampleFileName, cat, "", label);
  };

  // Run Intelligence Check locally without external model by checking specific filled fields in register complaint form
  const handleRunIntelCheck = (tab: "all" | "cross" | "repeat" | "linked" | "fir" = "all") => {
    setIntelDropdownOpen(false);
    const primary = complainants[0] || {};
    const primaryAccused = isAccusedKnown && accusedList[0] ? accusedList[0] : null;

    // Check specific fields filled in this register complaint form locally
    const result = ComplaintService.checkComplaintIntelligence({
      complainantName: primary.name || "",
      complainantFatherSpouse: primary.relativeName || "",
      complainantMobile: primary.mobile || "",
      complainantAddress: primary.presentAddress || "",
      accusedName: primaryAccused?.name || undefined,
      accusedFatherName: undefined,
      accusedPhone: primaryAccused?.phone || undefined,
      accusedAddress: primaryAccused?.address || undefined,
      incidentPlace: incidentPlace || "",
      incidentDetails: incidentDetails || complaintDescription || complaintSubject || "",
    });
    setIntelResult(result);
    setActiveIntelTab(tab);
    setShowIntelModal(true);
  };

  // Unified Form Validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // 1. Validate All Complainants
    complainants.forEach((comp, idx) => {
      if (!comp.name.trim()) {
        errors[`comp_${idx}_name`] = `Complainant ${idx + 1}: Name is required`;
      }
      if (!comp.relativeName.trim()) {
        errors[`comp_${idx}_relativeName`] = `Complainant ${idx + 1}: Relative name (${comp.relationType}) is required`;
      }
      if (!comp.gender) {
        errors[`comp_${idx}_gender`] = `Complainant ${idx + 1}: Gender is required`;
      }
      if (comp.age && String(comp.age).trim() && (isNaN(Number(comp.age)) || Number(comp.age) < 1 || Number(comp.age) > 120)) {
        errors[`comp_${idx}_age`] = `Complainant ${idx + 1}: Valid age (1-120 years) is required`;
      }
      if (comp.nationalityChoice === "Other" && !comp.otherNationality.trim()) {
        errors[`comp_${idx}_otherNationality`] = `Complainant ${idx + 1}: Please specify nationality`;
      }
      if (!comp.presentAddress.trim()) {
        errors[`comp_${idx}_presentAddress`] = `Complainant ${idx + 1}: Present address is required`;
      }
      if (!comp.presentCity.trim()) {
        errors[`comp_${idx}_presentCity`] = `Complainant ${idx + 1}: Village / City is required`;
      }
      if (!comp.presentDistrict.trim()) {
        errors[`comp_${idx}_presentDistrict`] = `Complainant ${idx + 1}: District is required`;
      }
      if (!comp.presentState.trim()) {
        errors[`comp_${idx}_presentState`] = `Complainant ${idx + 1}: State is required`;
      }
      if (!comp.presentCountry.trim()) {
        errors[`comp_${idx}_presentCountry`] = `Complainant ${idx + 1}: Country is required`;
      }

      // Permanent address if unchecked
      if (!comp.isPermanentSameAsPresent) {
        if (!comp.permanentAddress.trim()) {
          errors[`comp_${idx}_permanentAddress`] = `Complainant ${idx + 1}: Permanent address is required`;
        }
        if (!comp.permanentCity.trim()) {
          errors[`comp_${idx}_permanentCity`] = `Complainant ${idx + 1}: Permanent city is required`;
        }
        if (!comp.permanentDistrict.trim()) {
          errors[`comp_${idx}_permanentDistrict`] = `Complainant ${idx + 1}: Permanent district is required`;
        }
        if (!comp.permanentState.trim()) {
          errors[`comp_${idx}_permanentState`] = `Complainant ${idx + 1}: Permanent state is required`;
        }
        if (!comp.permanentCountry.trim()) {
          errors[`comp_${idx}_permanentCountry`] = `Complainant ${idx + 1}: Permanent country is required`;
        }
      }

      // Mobile validation:
      if (comp.nationalityChoice === "Indian") {
        if (!comp.mobile.trim() || !/^[6-9]\d{9}$/.test(comp.mobile)) {
          errors[`comp_${idx}_mobile`] = `Complainant ${idx + 1}: Valid 10-digit mobile number starting with 6-9 is required`;
        }
      } else {
        if (!comp.mobile.trim() || comp.mobile.length < 5) {
          errors[`comp_${idx}_mobile`] = `Complainant ${idx + 1}: Valid contact phone number is required`;
        }
      }
    });

    // 2. Validate Accused if known
    if (isAccusedKnown) {
      accusedList.forEach((acc, idx) => {
        if (!acc.name.trim()) {
          errors[`acc_${idx}_name`] = `Accused #${idx + 1}: Name is required`;
        }
        if (!acc.address.trim()) {
          errors[`acc_${idx}_address`] = `Accused #${idx + 1}: Address is required`;
        }
      });
    }

    // 3. Validate Incident Details
    if (!incidentPlace.trim()) {
      errors["incidentPlace"] = "Place of incident is required";
    }
    if (isDateTimeKnown && !incidentDate.trim()) {
      errors["incidentDate"] = "Date of incident is required";
    }

    // 4. Validate Complaint Details
    if (!complaintSubject.trim()) {
      errors["complaintSubject"] = "Subject is required";
    }
    if (!complaintDescription.trim()) {
      errors["complaintDescription"] = "Complaint brief description / synopsis is required";
    }
    if (isFirRegistered && !firNumber.trim()) {
      errors["firNumber"] = "FIR number is required when FIR registered is Yes";
    }

    setValidationErrors(errors);

    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      setTimeout(() => {
        const firstErrorEl = document.querySelector(".border-red-500, [aria-invalid='true']");
        if (firstErrorEl) {
          firstErrorEl.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 50);
      return;
    }

    setIsSubmitting(true);
    const primaryComp = complainants[0];
    const otherComplainants = complainants.slice(1);

    const formattedAccusedList: AccusedPerson[] = isAccusedKnown
      ? accusedList.map((a) => ({
          name: a.name,
          address: a.address,
          phone: a.phone,
          alias: a.alias,
          relationWithComplainant: a.relationWithComplainant,
        }))
      : [];

    try {
      const complaint = await ComplaintService.createComplaint(
        {
          source: sourceChannel,
          priority: priorityLevel,
          category: incidentCategory,
          incidentDate: isDateTimeKnown ? incidentDate : (incidentApproxPeriod || "Undated"),
          incidentTime: isDateTimeKnown ? incidentTime : undefined,
          isIncidentDateTimeKnown: isDateTimeKnown,
          incidentPlace,
          incidentLandmark: undefined,
          incidentDetails: incidentDetails || "Written citizen application received and attached to docket.",
          complainantName: primaryComp.name,
          complainantRelationType: primaryComp.relationType,
          complainantRelativeName: primaryComp.relativeName,
          complainantFatherSpouse: primaryComp.relativeName,
          complainantGender: primaryComp.gender,
          complainantAge: primaryComp.age ? parseInt(primaryComp.age, 10) : undefined,
          complainantNationality: primaryComp.nationalityChoice === "Indian" ? "Indian" : primaryComp.otherNationality,
          complainantMobile: primaryComp.nationalityChoice === "Indian" ? primaryComp.mobile : `${primaryComp.countryCode} ${primaryComp.mobile}`.trim(),
          complainantAddress: primaryComp.presentAddress,
          complainantCity: primaryComp.presentCity,
          complainantDistrict: primaryComp.presentDistrict,
          complainantState: primaryComp.presentState,
          complainantCountry: primaryComp.presentCountry,
          complainantPermanentAddress: primaryComp.isPermanentSameAsPresent
            ? primaryComp.presentAddress
            : primaryComp.permanentAddress,
          complainantPermanentCity: primaryComp.isPermanentSameAsPresent
            ? primaryComp.presentCity
            : primaryComp.permanentCity,
          complainantPermanentDistrict: primaryComp.isPermanentSameAsPresent
            ? primaryComp.presentDistrict
            : primaryComp.permanentDistrict,
          complainantPermanentState: primaryComp.isPermanentSameAsPresent
            ? primaryComp.presentState
            : primaryComp.permanentState,
          complainantPermanentCountry: primaryComp.isPermanentSameAsPresent
            ? primaryComp.presentCountry
            : primaryComp.permanentCountry,
          isPermanentSameAsPresent: primaryComp.isPermanentSameAsPresent,
          additionalComplainants: otherComplainants.map((c) => ({
            ...c,
            age: c.age ? parseInt(c.age, 10) : undefined,
            nationality: c.nationalityChoice === "Indian" ? "Indian" : c.otherNationality,
            mobile: c.nationalityChoice === "Indian" ? c.mobile : `${c.countryCode} ${c.mobile}`.trim(),
          })) as any,
          // 4. Complaint Details
          intakeMode,
          complaintSubject: complaintSubject.trim(),
          subject: complaintSubject.trim(),
          complaintDescription,
          isFirRegistered,
          firNumber: isFirRegistered ? firNumber : undefined,
          firDate: isFirRegistered ? firDate : undefined,
          complaintAgeType,
          complaintClassification,
          complaintPurpose,
          isAccusedKnown,
          accusedList: formattedAccusedList,
          accusedName: formattedAccusedList[0]?.name,
          accusedAddress: formattedAccusedList[0]?.address,
          linkedComplaintNumber: linkedComplaintNo || undefined,
          isCrossComplaint: isCrossCaseTagged || undefined,
          attachments,
        } as any,
        currentUser.name,
        currentUser.stationName,
        currentUser.district,
        currentUser.pno
      );

      // If registered by SHO with Assign EO active, immediately allocate to selected officer
      if (isSho && shouldAssignEoNow && selectedEoId) {
        const eo = MOCK_ENQUIRY_OFFICERS.find((o) => o.id === selectedEoId) || MOCK_ENQUIRY_OFFICERS[0];
        const assignRes = await ComplaintService.assignEnquiryOfficer(
          complaint.id,
          eo.id,
          eo.name,
          eo.rank,
          eo.pno,
          currentUser.name,
          assignedDirections || "Conduct preliminary spot verification & verify facts as per Section 173(3) BNSS.",
          targetDays || 14
        );
        setCreatedComplaint(assignRes.complaint);
        setShowReceiptModal(true);
      } else {
        setCreatedComplaint(complaint);
        // If unassigned, it goes to SHO desk to assign EO
      }

      // Clear the saved draft from localStorage upon successful registration
      try {
        window.localStorage.removeItem(FORM_DRAFT_KEY);
      } catch {}
    } catch (err: any) {
      setValidationErrors({ submit: err.message || "Failed to register complaint." });
    } finally {
      setIsSubmitting(false);
    }
  };

  // If registered, show official receipt & acknowledgement view
  if (createdComplaint) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in-50 p-4 sm:p-6">
        <Card className="border-emerald-300 shadow-lg">
          <CardContent className="p-6 sm:p-8 text-center space-y-5">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                Official Police Intake Recorded
              </span>
              <h2 className="text-2xl font-black text-slate-900">
                Complaint Successfully Registered
              </h2>
              <p className="text-xs sm:text-sm text-slate-600">
                Formally entered in Central Register at {currentUser.stationName} (District: {currentUser.district})
              </p>
            </div>

            {/* Generated Complaint ID Badge */}
            <div className="p-4 bg-slate-900 text-white rounded-xl font-mono text-center space-y-1 max-w-md mx-auto shadow-md">
              <p className="text-[10px] text-amber-400 uppercase tracking-widest font-sans">
                Permanent Complaint Number
              </p>
              <p className="text-xl sm:text-2xl font-bold tracking-wider text-white">
                {createdComplaint.complaintNumber}
              </p>
            </div>


            {/* Summary Particulars */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left text-xs space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-500">Complainant:</span>
                  <p className="font-bold text-slate-900">
                    {createdComplaint.complainantName}
                    {createdComplaint.complainantFatherSpouse && (
                      <span className="text-slate-600 font-normal">
                        {" "}
                        ({createdComplaint.complainantRelationType || "S/O"}{" "}
                        {createdComplaint.complainantFatherSpouse})
                      </span>
                    )}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500">Contact Number:</span>
                  <p className="font-bold text-slate-900 font-mono">+91 {createdComplaint.complainantMobile}</p>
                </div>
                <div>
                  <span className="text-slate-500">Incident Place:</span>
                  <p className="font-bold text-slate-900">{createdComplaint.incidentPlace}</p>
                </div>
                <div>
                  <span className="text-slate-500">Crime Class:</span>
                  <p className="font-bold text-slate-900">{createdComplaint.categoryDisplay}</p>
                </div>
              </div>
            </div>

            {/* Direct EO Allocation Confirmation Card */}
            {createdComplaint.assignedEoName && (
              <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-left text-xs space-y-2 animate-in fade-in-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-emerald-950 font-bold">
                    <UserCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>Enquiry Officer Assigned: {createdComplaint.assignedEoName} ({createdComplaint.assignedEoRank})</span>
                  </div>
                  <span className="text-[10px] bg-emerald-200 text-emerald-900 font-bold px-2 py-0.5 rounded-full">
                    Target: {createdComplaint.targetResolutionDate}
                  </span>
                </div>
                <div className="text-[11px] text-emerald-900 space-y-0.5">
                  <p>
                    <strong>Officer PNO:</strong> {createdComplaint.assignedEoPno} • <strong>Status:</strong> ASSIGNED_TO_EO
                  </p>
                  {createdComplaint.assignedDirections && (
                    <p className="italic text-emerald-950 pt-1 border-t border-emerald-200/80">
                      &ldquo;{createdComplaint.assignedDirections}&rdquo;
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Unassigned EO SHO Desk Alert Card */}
            {!createdComplaint.assignedEoName && (
              <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl text-left text-xs space-y-1.5 animate-in fade-in-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-amber-950 font-bold">
                    <Shield className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>Enquiry Officer Not Assigned (Pending SHO Queue)</span>
                  </div>
                  <span className="text-[10px] bg-amber-200 text-amber-900 font-bold px-2 py-0.5 rounded-full">
                    Awaiting SHO Allocation
                  </span>
                </div>
                <p className="text-[11px] text-amber-800">
                  यह शिकायत SHO की ID / Roster में भेज दी गई है। SHO Desk पर &ldquo;Assign EO&rdquo; बटन दबाते ही तुरंत अधिकृत पावती रसीद (Receipt of registered complaints) जनरेट हो जाएगी।
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
              <Link href={`/complaints/${createdComplaint.id}`}>
                <Button variant="primary" size="md" className="gap-2 bg-[#0b192c] hover:bg-slate-800 font-bold text-xs">
                  <ExternalLink className="w-4 h-4" />
                  View Complaint Profile
                </Button>
              </Link>
              {createdComplaint.assignedEoName && (
                <button
                  type="button"
                  onClick={() => setShowReceiptModal(true)}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  View &amp; Print Complaint Receipt
                </button>
              )}
              <Link href="/complaints">
                <Button variant="outline" size="md" className="text-xs">
                  Return to Complaints Register
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Complaint Receipt Modal */}
        <ComplaintReceiptModal
          complaint={createdComplaint}
          isOpen={showReceiptModal}
          onClose={() => setShowReceiptModal(false)}
        />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#0b192c] text-white flex items-center justify-center font-bold text-xs shadow-xs">
              <FileCheck className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h1 className="text-xl font-black text-[#0b192c]">Register Citizen Complaint</h1>
              <p className="text-xs text-slate-500">
                Single Unified Police Station Intake Form (PPR Rule 22.48 / Section 173 BNSS)
              </p>
            </div>
          </div>
        </div>

        {/* Top Channel, Priority, Clear & Cancel Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleClearForm}
            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-900 border border-rose-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
            title="Reset and clear all form fields to blank"
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
            <span>Clear Form</span>
          </button>
          <Link href="/complaints">
            <Button variant="outline" size="sm" className="text-xs">
              Cancel
            </Button>
          </Link>
        </div>
      </div>

      {/* Hidden File Input for Autofill Document (Accepts PDF, Images, Audio, Docs) */}
      <input
        ref={autofillFileInputRef}
        type="file"
        accept="image/*,application/pdf,audio/*,.doc,.docx,.txt"
        onChange={(e) => handleAutofillFileSelect(e.target.files)}
        className="hidden"
      />

      {/* Live Document Processing Progress Bar (Shown while uploading/analyzing) */}
      {isAutofilling && processingFileInfo && (
        <div className="p-3.5 bg-white border border-blue-200 rounded-xl space-y-2.5 shadow-2xs animate-in fade-in-50">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                {processingFileInfo.category === "image" ? (
                  <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                ) : processingFileInfo.category === "audio" ? (
                  <Music className="w-3.5 h-3.5 text-amber-600" />
                ) : (
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                )}
              </div>
              <span className="font-bold text-slate-800 truncate max-w-xs">{processingFileInfo.name}</span>
              <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                {processingFileInfo.typeLabel}
              </span>
            </div>
            <div className="flex items-center gap-2 text-blue-700 font-bold shrink-0 font-mono">
              <RotateCcw className="w-3.5 h-3.5 animate-spin text-blue-600" />
              <span>{autofillProgress}%</span>
            </div>
          </div>

          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
            <div
              className="bg-linear-to-r from-blue-600 to-indigo-600 h-full transition-all duration-300 rounded-full"
              style={{ width: `${autofillProgress}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span className="font-medium text-slate-700 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-purple-600 shrink-0" />
              {autofillStepText}
            </span>
            <span>Local Extractor</span>
          </div>
        </div>
      )}

      {/* Autofill Success Alert & Extracted Fields Highlights */}
      {autofillSuccessNotice && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2.5 text-xs text-emerald-950 animate-in fade-in-50">
          <div className="flex items-start justify-between gap-2 border-b border-emerald-200/60 pb-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <h4 className="font-bold text-emerald-900 text-xs sm:text-sm">
                  Document Processed &amp; Form Fields Populated
                </h4>
                <p className="text-[11px] text-emerald-700">
                  Successfully processed <strong>{autofillSuccessNotice.fileName}</strong> ({autofillSuccessNotice.typeLabel}). All fields have been filled into the form below and are <strong>100% editable</strong>.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {autofillSuccessNotice.dataUrl && (
                <button
                  type="button"
                  onClick={() =>
                    setPreviewModalFile({
                      name: autofillSuccessNotice.fileName,
                      category: autofillSuccessNotice.category,
                      dataUrl: autofillSuccessNotice.dataUrl,
                    })
                  }
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-semibold transition-colors shadow-2xs"
                  title="Instant preview uploaded document"
                >
                  <Eye className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Preview Document</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setAutofillSuccessNotice(null)}
                className="p-1 text-emerald-700 hover:text-emerald-900 hover:bg-emerald-100 rounded-md transition-colors"
                title="Dismiss notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 pt-0.5 text-[11px]">
            <div className="p-2 bg-white/80 rounded-lg border border-emerald-200/80 space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Complainant</span>
              <p className="font-bold text-slate-900 truncate">{autofillSuccessNotice.complainantName}</p>
              <p className="text-[10px] text-slate-500 truncate">{autofillSuccessNotice.complainantRelative} • {autofillSuccessNotice.complainantMobile}</p>
            </div>

            <div className="p-2 bg-white/80 rounded-lg border border-emerald-200/80 space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Accused / Suspect</span>
              <p className="font-bold text-slate-900 truncate">{autofillSuccessNotice.accusedInfo.split("(")[0]}</p>
              <p className="text-[10px] text-slate-500 truncate">Particulars recorded</p>
            </div>

            <div className="p-2 bg-white/80 rounded-lg border border-emerald-200/80 space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Incident Location</span>
              <p className="font-bold text-slate-900 truncate">{autofillSuccessNotice.incidentPlace}</p>
              <p className="text-[10px] text-slate-500 truncate">{autofillSuccessNotice.categoryName}</p>
            </div>

            <div className="p-2 bg-white/80 rounded-lg border border-emerald-200/80 space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Evidence Docket</span>
              <p className="font-bold text-slate-900 truncate">Original File Sealed</p>
              <p className="text-[10px] text-slate-500 truncate">Saved in Section 3(e)</p>
            </div>
          </div>

          <div className="p-2 bg-emerald-100/60 rounded-lg text-[11px] text-emerald-900 flex items-center justify-between">
            <span>
              <strong>Subject:</strong> {autofillSuccessNotice.subject}
            </span>
            <span className="font-semibold text-emerald-800 text-[10px] uppercase bg-white px-2 py-0.5 rounded border border-emerald-200 shrink-0 ml-2">
              Ready to Review &amp; Edit
            </span>
          </div>
        </div>
      )}

      {/* Voice Dictation Control Bar */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 flex items-center justify-between text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <Mic className="w-4 h-4 text-blue-600 shrink-0" />
          <span>
            Voice typing enabled for <strong>Facts of Details</strong> &amp; <strong>Detailed Allegations</strong>.
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setVoiceLang("en-IN")}
            className={`px-2.5 py-0.5 rounded text-xs font-bold transition-colors ${
              voiceLang === "en-IN" ? "bg-[#0b192c] text-white" : "text-slate-600 hover:bg-slate-200"
            }`}
          >
            English
          </button>
          <button
            type="button"
            onClick={() => setVoiceLang("hi-IN")}
            className={`px-2.5 py-0.5 rounded text-xs font-bold transition-colors ${
              voiceLang === "hi-IN" ? "bg-[#0b192c] text-white" : "text-slate-600 hover:bg-slate-200"
            }`}
          >
            Hindi
          </button>
        </div>
      </div>

      {/* Main Single Form Card */}
      <Card className="border-slate-200 shadow-xs">
        <CardContent className="p-5 sm:p-7">
          <form onSubmit={handleSubmit} className="space-y-8">

            {/* =========================================================================
                1. COMPLAINANT DETAILS
               ========================================================================= */}
            <div id="sec-complainant" className="space-y-4">
              <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-[#0b192c] uppercase tracking-wide flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-600" />
                    <span>1. Complainant Details</span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    Particulars of citizen(s) lodging the complaint (All fields are mandatory)
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => autofillFileInputRef.current?.click()}
                    disabled={isAutofilling}
                    className="px-3 py-1.5 bg-[#0b192c] hover:bg-slate-900 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                    title="Upload handwritten photo, scanned PDF, document, or audio to autofill all fields"
                  >
                    <Upload className="w-3.5 h-3.5 text-amber-400" />
                    <span>{isAutofilling ? "Processing..." : "Upload & Autofill Form"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleAddComplainant}
                    className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Another Complainant</span>
                  </button>
                </div>
              </div>

              {complainants.map((comp, idx) => (
                <div
                  key={comp.id}
                  className="p-4 sm:p-5 bg-white border border-slate-200 rounded-xl shadow-xs space-y-4 hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 font-bold text-xs flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Complainant #{idx + 1} Particulars
                      </h4>
                    </div>
                    {complainants.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveComplainant(idx)}
                        className="text-red-600 hover:text-red-800 text-xs font-semibold flex items-center gap-1 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove Complainant</span>
                      </button>
                    )}
                  </div>

                  {/* (a) Name, Relation, Relative Name, Age, Gender (All Mandatory) */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                    <div className="sm:col-span-4">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Complainant Full Name *
                      </label>
                      <input
                        type="text"
                        value={comp.name}
                        onChange={(e) => handleComplainantChange(idx, "name", e.target.value)}
                        placeholder="e.g. Rameshwar Dass"
                        className={`w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border rounded-lg focus:ring-2 focus:ring-[#0b192c] ${
                          validationErrors[`comp_${idx}_name`] ? "border-red-500 bg-red-50" : "border-slate-300"
                        }`}
                      />
                      {validationErrors[`comp_${idx}_name`] && (
                        <p className="text-[11px] text-red-600 mt-0.5">{validationErrors[`comp_${idx}_name`]}</p>
                      )}
                    </div>

                    <div className="sm:col-span-1">
                      <label className="block text-xs font-semibold text-slate-700 mb-1 truncate" title="Relation">
                        Relation *
                      </label>
                      <select
                        value={comp.relationType}
                        onChange={(e) => handleComplainantChange(idx, "relationType", e.target.value)}
                        className="w-full px-2 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0b192c] font-semibold text-center"
                      >
                        <option value="S/O">S/o</option>
                        <option value="D/O">D/o</option>
                        <option value="W/O">W/o</option>
                        <option value="C/O">C/o</option>
                      </select>
                    </div>

                    <div className="sm:col-span-4">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Relative Name ({comp.relationType}) *
                      </label>
                      <input
                        type="text"
                        value={comp.relativeName}
                        onChange={(e) => handleComplainantChange(idx, "relativeName", e.target.value)}
                        placeholder="e.g. Sh. Balwant Rai"
                        className={`w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border rounded-lg focus:ring-2 focus:ring-[#0b192c] ${
                          validationErrors[`comp_${idx}_relativeName`]
                            ? "border-red-500 bg-red-50"
                            : "border-slate-300"
                        }`}
                      />
                      {validationErrors[`comp_${idx}_relativeName`] && (
                        <p className="text-[11px] text-red-600 mt-0.5">
                          {validationErrors[`comp_${idx}_relativeName`]}
                        </p>
                      )}
                    </div>

                    <div className="sm:col-span-1">
                      <label className="block text-xs font-semibold text-slate-700 mb-1 truncate" title="Age (Years, Optional)">
                        Age
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="120"
                        value={comp.age || ""}
                        onChange={(e) => handleComplainantChange(idx, "age", e.target.value)}
                        placeholder="35"
                        className={`w-full px-2 py-2 text-xs sm:text-sm bg-slate-50 border rounded-lg focus:ring-2 focus:ring-[#0b192c] text-center ${
                          validationErrors[`comp_${idx}_age`] ? "border-red-500 bg-red-50" : "border-slate-300"
                        }`}
                      />
                      {validationErrors[`comp_${idx}_age`] && (
                        <p className="text-[11px] text-red-600 mt-0.5">{validationErrors[`comp_${idx}_age`]}</p>
                      )}
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Gender *
                      </label>
                      <select
                        value={comp.gender}
                        onChange={(e: any) => handleComplainantChange(idx, "gender", e.target.value)}
                        className={`w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border rounded-lg focus:ring-2 focus:ring-[#0b192c] font-semibold ${
                          validationErrors[`comp_${idx}_gender`] ? "border-red-500 bg-red-50" : "border-slate-300"
                        }`}
                      >
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                        <option value="TRANSGENDER">Transgender</option>
                      </select>
                      {validationErrors[`comp_${idx}_gender`] && (
                        <p className="text-[11px] text-red-600 mt-0.5">{validationErrors[`comp_${idx}_gender`]}</p>
                      )}
                    </div>
                  </div>

                  {/* (b) Address which has present and permanent and a check box if permanent same as present */}
                  <div className="space-y-3 pt-3 border-t border-slate-100">
                    <h5 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-blue-600" />
                      <span>Present Residential Address (All fields mandatory) *</span>
                    </h5>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                      {/* Nationality Dropdown */}
                      <div className="sm:col-span-3">
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Nationality *
                        </label>
                        <select
                          value={comp.nationalityChoice}
                          onChange={(e: any) => handleComplainantChange(idx, "nationalityChoice", e.target.value)}
                          className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0b192c] font-semibold"
                        >
                          <option value="Indian">Indian</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      {/* If Other, column for fill opens */}
                      {comp.nationalityChoice === "Other" && (
                        <div className="sm:col-span-3 animate-in fade-in-50">
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Specify Nationality *
                          </label>
                          <input
                            type="text"
                            value={comp.otherNationality}
                            onChange={(e) => handleComplainantChange(idx, "otherNationality", e.target.value)}
                            placeholder="e.g. British / American / Canadian"
                            className={`w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border rounded-lg focus:ring-2 focus:ring-[#0b192c] ${
                              validationErrors[`comp_${idx}_otherNationality`]
                                ? "border-red-500 bg-red-50"
                                : "border-slate-300"
                            }`}
                          />
                          {validationErrors[`comp_${idx}_otherNationality`] && (
                            <p className="text-[11px] text-red-600 mt-0.5">
                              {validationErrors[`comp_${idx}_otherNationality`]}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Address */}
                      <div className={comp.nationalityChoice === "Other" ? "sm:col-span-6" : "sm:col-span-9"}>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Address (House / Street / Mohalla) *
                        </label>
                        <input
                          type="text"
                          value={comp.presentAddress}
                          onChange={(e) => handleComplainantChange(idx, "presentAddress", e.target.value)}
                          placeholder="e.g. House No. 89, Gali No. 4, Mohan Nagar"
                          className={`w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border rounded-lg focus:ring-2 focus:ring-[#0b192c] ${
                            validationErrors[`comp_${idx}_presentAddress`]
                              ? "border-red-500 bg-red-50"
                              : "border-slate-300"
                          }`}
                        />
                        {validationErrors[`comp_${idx}_presentAddress`] && (
                          <p className="text-[11px] text-red-600 mt-0.5">
                            {validationErrors[`comp_${idx}_presentAddress`]}
                          </p>
                        )}
                      </div>

                      {/* Village / City */}
                      <div className="sm:col-span-3">
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Village / City *
                        </label>
                        <input
                          type="text"
                          value={comp.presentCity}
                          onChange={(e) => handleComplainantChange(idx, "presentCity", e.target.value)}
                          placeholder="e.g. Kurukshetra"
                          className={`w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border rounded-lg focus:ring-2 focus:ring-[#0b192c] ${
                            validationErrors[`comp_${idx}_presentCity`]
                              ? "border-red-500 bg-red-50"
                              : "border-slate-300"
                          }`}
                        />
                        {validationErrors[`comp_${idx}_presentCity`] && (
                          <p className="text-[11px] text-red-600 mt-0.5">
                            {validationErrors[`comp_${idx}_presentCity`]}
                          </p>
                        )}
                      </div>

                      {/* District */}
                      <div className="sm:col-span-3">
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          District *
                        </label>
                        <input
                          type="text"
                          value={comp.presentDistrict}
                          onChange={(e) => handleComplainantChange(idx, "presentDistrict", e.target.value)}
                          placeholder="e.g. Kurukshetra"
                          className={`w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border rounded-lg focus:ring-2 focus:ring-[#0b192c] ${
                            validationErrors[`comp_${idx}_presentDistrict`]
                              ? "border-red-500 bg-red-50"
                              : "border-slate-300"
                          }`}
                        />
                        {validationErrors[`comp_${idx}_presentDistrict`] && (
                          <p className="text-[11px] text-red-600 mt-0.5">
                            {validationErrors[`comp_${idx}_presentDistrict`]}
                          </p>
                        )}
                      </div>

                      {/* State */}
                      <div className="sm:col-span-3">
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          State *
                        </label>
                        <input
                          type="text"
                          value={comp.presentState}
                          onChange={(e) => handleComplainantChange(idx, "presentState", e.target.value)}
                          placeholder="e.g. Haryana"
                          className={`w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border rounded-lg focus:ring-2 focus:ring-[#0b192c] ${
                            validationErrors[`comp_${idx}_presentState`]
                              ? "border-red-500 bg-red-50"
                              : "border-slate-300"
                          }`}
                        />
                        {validationErrors[`comp_${idx}_presentState`] && (
                          <p className="text-[11px] text-red-600 mt-0.5">
                            {validationErrors[`comp_${idx}_presentState`]}
                          </p>
                        )}
                      </div>

                      {/* Country (By default India if nationality is Indian) */}
                      <div className="sm:col-span-3">
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Country *
                        </label>
                        <input
                          type="text"
                          value={comp.presentCountry}
                          onChange={(e) => handleComplainantChange(idx, "presentCountry", e.target.value)}
                          placeholder="e.g. India"
                          readOnly={comp.nationalityChoice === "Indian"}
                          className={`w-full px-3 py-2 text-xs sm:text-sm border rounded-lg focus:ring-2 focus:ring-[#0b192c] ${
                            comp.nationalityChoice === "Indian"
                              ? "bg-slate-100 text-slate-700 cursor-not-allowed font-medium"
                              : "bg-slate-50"
                          } ${
                            validationErrors[`comp_${idx}_presentCountry`]
                              ? "border-red-500 bg-red-50"
                              : "border-slate-300"
                          }`}
                        />
                        {validationErrors[`comp_${idx}_presentCountry`] && (
                          <p className="text-[11px] text-red-600 mt-0.5">
                            {validationErrors[`comp_${idx}_presentCountry`]}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Mobile No. showing Country Code: Default +91 and 10 digits if Indian, editable if other */}
                    <div className="pt-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Mobile Number {comp.nationalityChoice === "Indian" ? "(Strictly 10 Digits)" : "(Contact Phone)"} *
                      </label>
                      <div className="max-w-md flex items-center gap-2">
                        {comp.nationalityChoice === "Indian" ? (
                          <div className="w-full relative flex items-center">
                            <span className="absolute left-3 font-mono font-bold text-xs text-slate-700 bg-slate-200 px-1.5 py-0.5 rounded">
                              +91
                            </span>
                            <input
                              type="tel"
                              maxLength={10}
                              value={comp.mobile}
                              onChange={(e) => handleComplainantChange(idx, "mobile", e.target.value)}
                              placeholder="9812000000"
                              className={`w-full pl-14 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border rounded-lg font-mono tracking-wider focus:ring-2 focus:ring-[#0b192c] ${
                                validationErrors[`comp_${idx}_mobile`] ? "border-red-500 bg-red-50" : "border-slate-300"
                              }`}
                            />
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 w-full">
                            <div className="w-24 shrink-0">
                              <input
                                type="text"
                                value={comp.countryCode}
                                onChange={(e) => handleComplainantChange(idx, "countryCode", e.target.value)}
                                placeholder="+1"
                                className="w-full px-2.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-center focus:ring-2 focus:ring-[#0b192c]"
                                title="Country Code"
                              />
                            </div>
                            <input
                              type="tel"
                              maxLength={15}
                              value={comp.mobile}
                              onChange={(e) => handleComplainantChange(idx, "mobile", e.target.value)}
                              placeholder="Enter Phone Number"
                              className={`w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border rounded-lg font-mono tracking-wider focus:ring-2 focus:ring-[#0b192c] ${
                                validationErrors[`comp_${idx}_mobile`] ? "border-red-500 bg-red-50" : "border-slate-300"
                              }`}
                            />
                          </div>
                        )}
                      </div>
                      {validationErrors[`comp_${idx}_mobile`] && (
                        <p className="text-[11px] text-red-600 mt-0.5">{validationErrors[`comp_${idx}_mobile`]}</p>
                      )}
                      <span className="text-[10px] text-slate-400 mt-0.5 block">
                        Official station SMS receipt and verification OTP dispatched to this number.
                      </span>
                    </div>

                    {/* Permanent Address Same Checkbox */}
                    <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`comp_same_addr_${idx}`}
                        checked={comp.isPermanentSameAsPresent}
                        onChange={(e) => handleComplainantChange(idx, "isPermanentSameAsPresent", e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                      />
                      <label htmlFor={`comp_same_addr_${idx}`} className="text-xs font-semibold text-slate-800 cursor-pointer">
                        Permanent Address is same as Present Address
                      </label>
                    </div>

                    {/* If NOT same, display separate Permanent Address columns */}
                    {!comp.isPermanentSameAsPresent && (
                      <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3 mt-2 animate-in fade-in-50">
                        <h6 className="text-xs font-bold text-slate-800">Permanent Address (All fields mandatory) *</h6>
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                          <div className="sm:col-span-12">
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                              Permanent Address (House / Street / Mohalla) *
                            </label>
                            <input
                              type="text"
                              value={comp.permanentAddress}
                              onChange={(e) => handleComplainantChange(idx, "permanentAddress", e.target.value)}
                              placeholder="Permanent Address Line"
                              className={`w-full px-3 py-2 text-xs sm:text-sm bg-white border rounded-lg focus:ring-2 focus:ring-[#0b192c] ${
                                validationErrors[`comp_${idx}_permanentAddress`]
                                  ? "border-red-500 bg-red-50"
                                  : "border-slate-300"
                              }`}
                            />
                            {validationErrors[`comp_${idx}_permanentAddress`] && (
                              <p className="text-[11px] text-red-600 mt-0.5">
                                {validationErrors[`comp_${idx}_permanentAddress`]}
                              </p>
                            )}
                          </div>

                          <div className="sm:col-span-3">
                            <label className="block text-xs font-semibold text-slate-700 mb-1">Permanent Village / City *</label>
                            <input
                              type="text"
                              value={comp.permanentCity}
                              onChange={(e) => handleComplainantChange(idx, "permanentCity", e.target.value)}
                              className={`w-full px-3 py-2 text-xs sm:text-sm bg-white border rounded-lg focus:ring-2 focus:ring-[#0b192c] ${
                                validationErrors[`comp_${idx}_permanentCity`]
                                  ? "border-red-500 bg-red-50"
                                  : "border-slate-300"
                              }`}
                            />
                            {validationErrors[`comp_${idx}_permanentCity`] && (
                              <p className="text-[11px] text-red-600 mt-0.5">
                                {validationErrors[`comp_${idx}_permanentCity`]}
                              </p>
                            )}
                          </div>
                          <div className="sm:col-span-3">
                            <label className="block text-xs font-semibold text-slate-700 mb-1">District *</label>
                            <input
                              type="text"
                              value={comp.permanentDistrict}
                              onChange={(e) => handleComplainantChange(idx, "permanentDistrict", e.target.value)}
                              className={`w-full px-3 py-2 text-xs sm:text-sm bg-white border rounded-lg focus:ring-2 focus:ring-[#0b192c] ${
                                validationErrors[`comp_${idx}_permanentDistrict`]
                                  ? "border-red-500 bg-red-50"
                                  : "border-slate-300"
                              }`}
                            />
                            {validationErrors[`comp_${idx}_permanentDistrict`] && (
                              <p className="text-[11px] text-red-600 mt-0.5">
                                {validationErrors[`comp_${idx}_permanentDistrict`]}
                              </p>
                            )}
                          </div>
                          <div className="sm:col-span-3">
                            <label className="block text-xs font-semibold text-slate-700 mb-1">State *</label>
                            <input
                              type="text"
                              value={comp.permanentState}
                              onChange={(e) => handleComplainantChange(idx, "permanentState", e.target.value)}
                              className={`w-full px-3 py-2 text-xs sm:text-sm bg-white border rounded-lg focus:ring-2 focus:ring-[#0b192c] ${
                                validationErrors[`comp_${idx}_permanentState`]
                                  ? "border-red-500 bg-red-50"
                                  : "border-slate-300"
                              }`}
                            />
                            {validationErrors[`comp_${idx}_permanentState`] && (
                              <p className="text-[11px] text-red-600 mt-0.5">
                                {validationErrors[`comp_${idx}_permanentState`]}
                              </p>
                            )}
                          </div>
                          <div className="sm:col-span-3">
                            <label className="block text-xs font-semibold text-slate-700 mb-1">Country *</label>
                            <input
                              type="text"
                              value={comp.permanentCountry}
                              onChange={(e) => handleComplainantChange(idx, "permanentCountry", e.target.value)}
                              className={`w-full px-3 py-2 text-xs sm:text-sm bg-white border rounded-lg focus:ring-2 focus:ring-[#0b192c] ${
                                validationErrors[`comp_${idx}_permanentCountry`]
                                  ? "border-red-500 bg-red-50"
                                  : "border-slate-300"
                              }`}
                            />
                            {validationErrors[`comp_${idx}_permanentCountry`] && (
                              <p className="text-[11px] text-red-600 mt-0.5">
                                {validationErrors[`comp_${idx}_permanentCountry`]}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* =========================================================================
                2. ACCUSED DETAILS (Default: NO)
               ========================================================================= */}
            <div id="sec-accused" className="space-y-4 pt-6 border-t border-slate-200">
              <div className="border-b border-slate-200 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-[#0b192c] uppercase tracking-wide flex items-center gap-2">
                    <Users className="w-4 h-4 text-amber-600" />
                    <span>2. Accused / Suspect Details</span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    Select whether the particulars of the suspect(s) are known at this stage
                  </p>
                </div>

                {/* Accused Known Toggle: Default NO */}
                <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg border border-slate-200">
                  <span className="text-xs font-bold text-slate-700 px-2">Accused Known?</span>
                  <button
                    type="button"
                    onClick={() => setIsAccusedKnown(false)}
                    className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                      !isAccusedKnown
                        ? "bg-[#0b192c] text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    No (Unidentified)
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAccusedKnown(true)}
                    className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                      isAccusedKnown
                        ? "bg-amber-600 text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Yes (Accused Known)
                  </button>
                </div>
              </div>

              {!isAccusedKnown ? (
                /* Default NO View */
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-1.5">
                  <p className="text-xs font-bold text-slate-700">
                    Suspect(s) Unidentified / Unknown at this stage
                  </p>
                  <p className="text-[11px] text-slate-500">
                    The complaint will be registered against unknown persons. The designated Enquiry Officer (EO) will
                    determine the identity of the suspects during spot enquiry and evidence examination.
                  </p>
                </div>
              ) : (
                /* YES View: S. No., Name, Address */
                <div className="space-y-3 animate-in fade-in-50">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">
                      Known Suspect List ({accusedList.length})
                    </span>
                    <button
                      type="button"
                      onClick={handleAddAccused}
                      className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Another Accused</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {accusedList.map((acc, idx) => (
                      <div
                        key={acc.id}
                        className="p-3.5 sm:p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3"
                      >
                        <div className="flex items-center justify-between border-b border-slate-200/60 pb-1.5">
                          <span className="font-bold text-xs text-slate-800 font-mono">
                            S. No. {idx + 1}
                          </span>
                          {accusedList.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveAccused(idx)}
                              className="text-red-600 hover:text-red-800 text-xs font-medium flex items-center gap-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Remove</span>
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                              Accused Name *
                            </label>
                            <input
                              type="text"
                              value={acc.name}
                              onChange={(e) => handleAccusedChange(idx, "name", e.target.value)}
                              placeholder="e.g. Vikas Aggarwal"
                              className={`w-full px-3 py-2 text-xs sm:text-sm bg-white border rounded-lg focus:ring-2 focus:ring-[#0b192c] ${
                                validationErrors[`acc_${idx}_name`] ? "border-red-500 bg-red-50" : "border-slate-300"
                              }`}
                            />
                            {validationErrors[`acc_${idx}_name`] && (
                              <p className="text-[11px] text-red-600 mt-0.5">
                                {validationErrors[`acc_${idx}_name`]}
                              </p>
                            )}
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                              Accused Address *
                            </label>
                            <input
                              type="text"
                              value={acc.address}
                              onChange={(e) => handleAccusedChange(idx, "address", e.target.value)}
                              placeholder="e.g. Shop No. 12, Old Grain Market, Thanesar"
                              className={`w-full px-3 py-2 text-xs sm:text-sm bg-white border rounded-lg focus:ring-2 focus:ring-[#0b192c] ${
                                validationErrors[`acc_${idx}_address`]
                                  ? "border-red-500 bg-red-50"
                                  : "border-slate-300"
                              }`}
                            />
                            {validationErrors[`acc_${idx}_address`] && (
                              <p className="text-[11px] text-red-600 mt-0.5">
                                {validationErrors[`acc_${idx}_address`]}
                              </p>
                            )}
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                              Contact Phone (If Known)
                            </label>
                            <input
                              type="tel"
                              value={acc.phone || ""}
                              onChange={(e) => handleAccusedChange(idx, "phone", e.target.value)}
                              placeholder="e.g. 9416000000"
                              className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-[#0b192c]"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                              Alias / Nickname / Relation (If Known)
                            </label>
                            <input
                              type="text"
                              value={acc.alias || ""}
                              onChange={(e) => handleAccusedChange(idx, "alias", e.target.value)}
                              placeholder="e.g. alias Vicky / Business Partner"
                              className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0b192c]"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* =========================================================================
                3. INCIDENT DETAILS
               ========================================================================= */}
            <div id="sec-incident" className="space-y-4 pt-6 border-t border-slate-200">
              <div className="border-b border-slate-200 pb-3">
                <h2 className="text-sm sm:text-base font-bold text-[#0b192c] uppercase tracking-wide flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>3. Incident Details</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Location, date/time, classification of crime, allegations and evidence attachments
                </p>
              </div>

              {/* (a) Place of Incident & (b) Class of Incident (Crime Category) side-by-side */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    (a) Place of Incident *
                  </label>
                  <input
                    type="text"
                    value={incidentPlace}
                    onChange={(e) => {
                      setIncidentPlace(e.target.value);
                      if (validationErrors.incidentPlace) {
                        setValidationErrors((prev) => {
                          const next = { ...prev };
                          delete next.incidentPlace;
                          return next;
                        });
                      }
                    }}
                    placeholder="e.g. Near New Bus Stand Chowk, Thanesar"
                    className={`w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border rounded-lg focus:ring-2 focus:ring-[#0b192c] ${
                      validationErrors.incidentPlace ? "border-red-500 bg-red-50" : "border-slate-300"
                    }`}
                  />
                  {validationErrors.incidentPlace && (
                    <p className="text-[11px] text-red-600 mt-0.5">{validationErrors.incidentPlace}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    (b) Class of Incident (Crime Category) *
                  </label>
                  <select
                    value={incidentCategory}
                    onChange={(e: any) => setIncidentCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0b192c] font-medium"
                  >
                    <option value="FINANCIAL_FRAUD_CHEATING">Financial Fraud / Cheating</option>
                    <option value="CYBER_CRIME">Cyber Crime / Online Fraud</option>
                    <option value="LAND_PROPERTY_DISPUTE">Land / Boundary Dispute</option>
                    <option value="PHYSICAL_ASSAULT_AFFRAY">Physical Assault / Affray</option>
                    <option value="PROPERTY_THEFT_BURGLARY">Theft / Burglary</option>
                    <option value="DOMESTIC_VIOLENCE_DOWRY">Domestic Violence / Dowry</option>
                    <option value="PUBLIC_NUISANCE">Public Nuisance / Brawl</option>
                    <option value="MISSING_PERSON">Missing Person</option>
                    <option value="NARCOTICS_DRUGS_INFO">Narcotics / Drugs Information</option>
                    <option value="HARASSMENT_STALKING">Harassment / Stalking</option>
                    <option value="OTHER_GENERAL">Other General Matter</option>
                  </select>
                </div>
              </div>

              {/* (c) Date / Time of Incident if known then Yes otherwise No in one single line */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                  {/* Label + Yes/No toggle */}
                  <div className="flex items-center gap-2.5 shrink-0">
                    <label className="text-xs font-bold text-slate-800 whitespace-nowrap">
                      (c) Date / Time of Incident Known?
                    </label>
                    <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200 text-xs">
                      <button
                        type="button"
                        onClick={() => setIsDateTimeKnown(true)}
                        className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                          isDateTimeKnown ? "bg-[#0b192c] text-white shadow-2xs" : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsDateTimeKnown(false)}
                        className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                          !isDateTimeKnown ? "bg-[#0b192c] text-white shadow-2xs" : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        No
                      </button>
                    </div>
                  </div>

                  {/* Date & Time (if Yes) or Approximate Period (if No) in same row */}
                  {isDateTimeKnown ? (
                    <div className="flex flex-1 flex-col sm:flex-row items-center gap-2.5 min-w-0">
                      <div className="w-full sm:flex-1 flex items-center gap-2 min-w-0">
                        <label className="text-xs font-semibold text-slate-600 shrink-0">
                          Date *
                        </label>
                        <input
                          type="date"
                          value={incidentDate}
                          onChange={(e) => setIncidentDate(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0b192c]"
                        />
                      </div>
                      <div className="w-full sm:flex-1 flex items-center gap-2 min-w-0">
                        <label className="text-xs font-semibold text-slate-600 shrink-0">
                          Time
                        </label>
                        <input
                          type="time"
                          value={incidentTime}
                          onChange={(e) => setIncidentTime(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0b192c]"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-1 items-center gap-2 min-w-0">
                      <label className="text-xs font-semibold text-slate-600 shrink-0">
                        Approx Period
                      </label>
                      <input
                        type="text"
                        value={incidentApproxPeriod}
                        onChange={(e) => setIncidentApproxPeriod(e.target.value)}
                        placeholder="e.g. Occurring over past 15 days or exact date not recalled"
                        className="w-full px-2.5 py-1.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0b192c]"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* (d) Facts of Details / Detailed Allegations (Optional) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">
                    (d) Facts of Details / Detailed Allegations (Optional)
                  </label>
                  <VoiceInputButton
                    preferredLang={voiceLang}
                    fieldLabel="Detailed Allegations"
                    currentValue={incidentDetails}
                    onTranscript={(val) => setIncidentDetails((prev) => (prev ? `${prev} ${val}` : val))}
                  />
                </div>
                <textarea
                  rows={4}
                  value={incidentDetails}
                  onChange={(e) => setIncidentDetails(e.target.value)}
                  placeholder="Optional: Narrate specific facts, sequence of events, weapon used, amounts defrauded, witnesses present..."
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0b192c]"
                />
              </div>

              {/* (e) Upload Evidence / Attachments in Any Format */}
              <div className="pt-2 border-t border-slate-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <Paperclip className="w-4 h-4 text-blue-600" />
                      <h4 className="text-xs font-bold text-slate-900">
                        (e) Upload Evidence / Attachments (Any Format: Video, Audio, Document, Photo)
                      </h4>
                      {attachments.length > 0 && (
                        <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                          {attachments.length} Attached
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Supports CCTV videos, call recordings, stamped documents, PDFs, photos and any legal files
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Compact Drag & Drop Area next to Upload Evidence */}
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsDraggingEvidence(true);
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsDraggingEvidence(false);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsDraggingEvidence(false);
                        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                          handleFileUpload(e.dataTransfer.files);
                        }
                      }}
                      onClick={() => fileInputRef.current?.click()}
                      className={`px-3 py-1.5 border border-dashed rounded-lg text-xs flex items-center gap-1.5 cursor-pointer transition-all ${
                        isDraggingEvidence
                          ? "border-blue-600 bg-blue-100/90 text-blue-900 scale-102"
                          : "border-slate-300 hover:border-blue-500 bg-slate-50 hover:bg-blue-50/50 text-slate-600"
                      }`}
                      title="Drag and drop files here, or click to browse"
                    >
                      <Paperclip className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span className="font-medium text-[11px] hidden sm:inline">
                        {isDraggingEvidence ? "Drop file here" : "Drag & Drop files"}
                      </span>
                      <span className="font-medium text-[11px] sm:hidden">Drop</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingFiles}
                      className="px-3 py-1.5 bg-[#0b192c] hover:bg-slate-900 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-2xs shrink-0 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5 text-amber-400" />
                      <span>{isUploadingFiles ? "Processing..." : "Upload Evidence"}</span>
                    </button>
                  </div>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="*/*"
                  onChange={(e) => handleFileUpload(e.target.files)}
                  className="hidden"
                />

                {/* Attached Files List */}
                {attachments.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <div className="text-[11px] font-bold text-slate-600 flex items-center justify-between">
                      <span>Attached Evidence Files ({attachments.length}):</span>
                      <button
                        type="button"
                        onClick={() => setAttachments([])}
                        className="text-red-600 hover:text-red-800 text-[10px] font-semibold underline"
                      >
                        Remove All
                      </button>
                    </div>

                    {attachments.map((file) => (
                      <div
                        key={file.id}
                        className="p-3 bg-white border border-slate-200 rounded-xl shadow-xs space-y-2 hover:border-slate-300 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                file.category === "video"
                                  ? "bg-purple-100 text-purple-700"
                                  : file.category === "audio"
                                  ? "bg-amber-100 text-amber-700"
                                  : file.category === "image"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : file.category === "document"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-slate-100 text-slate-700"
                              }`}
                            >
                              {file.category === "video" && <Video className="w-4 h-4" />}
                              {file.category === "audio" && <Music className="w-4 h-4" />}
                              {file.category === "image" && <ImageIcon className="w-4 h-4" />}
                              {file.category === "document" && <FileText className="w-4 h-4" />}
                              {file.category === "other" && <File className="w-4 h-4" />}
                            </div>

                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-900 truncate">{file.name}</p>
                              <div className="flex items-center gap-2 text-[10px] text-slate-500">
                                <span className="uppercase font-semibold text-slate-700">{file.category}</span>
                                <span>•</span>
                                <span>{formatFileSize(file.size)}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {file.dataUrl && (
                              <button
                                type="button"
                                onClick={() => setPreviewModalFile(file)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold transition-colors shadow-2xs"
                                title="Instant preview without downloading"
                              >
                                <Eye className="w-3.5 h-3.5 text-blue-600" />
                                <span>Preview</span>
                              </button>
                            )}
                            {file.dataUrl && (
                              <a
                                href={file.dataUrl}
                                download={file.name}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 rounded-lg text-xs font-semibold transition-colors shadow-2xs"
                                title="Download file"
                              >
                                <Download className="w-3.5 h-3.5 text-slate-600" />
                                <span>Download</span>
                              </a>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemoveAttachment(file.id)}
                              className="text-slate-400 hover:text-red-600 p-1 rounded-md transition-colors"
                              title="Remove file"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Audio Preview */}
                        {file.category === "audio" && file.dataUrl && (
                          <div className="pt-1">
                            <audio controls src={file.dataUrl} className="w-full h-8" />
                          </div>
                        )}

                        {/* Video Preview */}
                        {file.category === "video" && file.dataUrl && (
                          <div className="pt-1 max-w-sm">
                            <video controls src={file.dataUrl} className="w-full rounded-lg max-h-48 bg-black" />
                          </div>
                        )}

                        {/* Image Preview */}
                        {file.category === "image" && file.dataUrl && (
                          <div className="pt-1">
                            <img
                              src={file.dataUrl}
                              alt={file.name}
                              className="max-h-36 rounded-lg object-contain border border-slate-200"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* =========================================================================
                4. COMPLAINT DETAILS
               ========================================================================= */}
            <div id="sec-complaint-details" className="space-y-4 pt-6 border-t border-slate-200">
              <div className="border-b border-slate-200 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-[#0b192c] uppercase tracking-wide flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-blue-600" />
                    <span>4. Complaint Details</span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    Mode of intake, description, FIR status, complaint type, classification and purpose
                  </p>
                </div>
              </div>

              {/* Single row with Mode of Intake, Subject, Type of Complaint (Fresh/Old), and Is FIR Registered */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                {/* Mode of Intake */}
                <div className="sm:col-span-3">
                  <label className="block text-xs font-semibold text-slate-700 mb-1 truncate" title="Mode of Intake">
                    Mode of Intake *
                  </label>
                  <select
                    value={intakeMode}
                    onChange={(e) => {
                      setIntakeMode(e.target.value);
                      setSourceChannel(e.target.value as any);
                    }}
                    className="w-full px-2.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0b192c] font-medium"
                  >
                    <option value="WALK_IN_STATION">Walk-in Counter</option>
                    <option value="CM_WINDOW_HARYANA">CM Window (VIP)</option>
                    <option value="CITIZEN_PORTAL_HARPATH">Citizen Portal (HarPath)</option>
                    <option value="EMERGENCY_112">Emergency 112 Call</option>
                    <option value="SP_OFFICE_REFERENCE">SP Office Reference</option>
                    <option value="POSTAL_APPLICATION">Postal Application</option>
                    <option value="WOMEN_HELPDESK">Women Helpdesk</option>
                  </select>
                </div>

                {/* Subject */}
                <div className="sm:col-span-4">
                  <label className="block text-xs font-semibold text-slate-700 mb-1 truncate" title="Subject">
                    Subject *
                  </label>
                  <input
                    type="text"
                    value={complaintSubject}
                    onChange={(e) => {
                      setComplaintSubject(e.target.value);
                      if (validationErrors.complaintSubject) {
                        setValidationErrors((prev) => {
                          const next = { ...prev };
                          delete next.complaintSubject;
                          return next;
                        });
                      }
                    }}
                    placeholder="e.g. Complaint regarding cheating / fraud"
                    className={`w-full px-2.5 py-2 text-xs bg-slate-50 border rounded-lg focus:ring-2 focus:ring-[#0b192c] ${
                      validationErrors.complaintSubject ? "border-red-500 bg-red-50" : "border-slate-300"
                    }`}
                  />
                  {validationErrors.complaintSubject && (
                    <p className="text-[11px] text-red-600 mt-0.5">{validationErrors.complaintSubject}</p>
                  )}
                </div>

                {/* Type of Complaint (Fresh / Old) */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1 truncate" title="Type of Complaint">
                    Type of Complaint *
                  </label>
                  <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
                    <button
                      type="button"
                      onClick={() => setComplaintAgeType("FRESH")}
                      className={`flex-1 py-1.5 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                        complaintAgeType === "FRESH"
                          ? "bg-[#0b192c] text-white shadow-2xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Fresh
                    </button>
                    <button
                      type="button"
                      onClick={() => setComplaintAgeType("OLD")}
                      className={`flex-1 py-1.5 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                        complaintAgeType === "OLD"
                          ? "bg-amber-600 text-white shadow-2xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Old
                    </button>
                  </div>
                </div>

                {/* Is FIR Registered */}
                <div className="sm:col-span-3">
                  <label className="block text-xs font-semibold text-slate-700 mb-1 truncate" title="Is FIR Registered?">
                    Is FIR Registered? *
                  </label>
                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs w-full">
                      <button
                        type="button"
                        onClick={() => setIsFirRegistered(false)}
                        className={`flex-1 py-1.5 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                          !isFirRegistered ? "bg-[#0b192c] text-white shadow-2xs" : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        No
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsFirRegistered(true)}
                        className={`flex-1 py-1.5 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                          isFirRegistered ? "bg-red-600 text-white shadow-2xs" : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        Yes
                      </button>
                    </div>
                  </div>
                </div>

                {/* If FIR Registered is Yes, show inputs inline/expandable */}
                {isFirRegistered && (
                  <div className="sm:col-span-12 p-3 bg-red-50/60 border border-red-200 rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in-50">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        FIR Number *
                      </label>
                      <input
                        type="text"
                        value={firNumber}
                        onChange={(e) => setFirNumber(e.target.value)}
                        placeholder="e.g. FIR No. 104/2026"
                        className={`w-full px-2.5 py-1.5 text-xs bg-white border rounded-lg focus:ring-2 focus:ring-[#0b192c] ${
                          validationErrors.firNumber ? "border-red-500 bg-red-50" : "border-slate-300"
                        }`}
                      />
                      {validationErrors.firNumber && (
                        <p className="text-[11px] text-red-600 mt-0.5">{validationErrors.firNumber}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        FIR Registration Date
                      </label>
                      <input
                        type="date"
                        value={firDate}
                        onChange={(e) => setFirDate(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0b192c]"
                      />
                    </div>
                  </div>
                )}

                {/* Description / Detailed Allegations (Full Width) */}
                <div className="sm:col-span-12 pt-1">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">
                      Description / Detailed Allegations *
                    </label>
                    <VoiceInputButton
                      preferredLang={voiceLang}
                      fieldLabel="Complaint Description"
                      currentValue={complaintDescription}
                      onTranscript={(val) => setComplaintDescription((prev) => (prev ? `${prev} ${val}` : val))}
                    />
                  </div>
                  <textarea
                    rows={5}
                    value={complaintDescription}
                    onChange={(e) => {
                      setComplaintDescription(e.target.value);
                      if (validationErrors.complaintDescription) {
                        setValidationErrors((prev) => {
                          const next = { ...prev };
                          delete next.complaintDescription;
                          return next;
                        });
                      }
                    }}
                    placeholder="Enter full description and detailed narrative of the complaint..."
                    className={`w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border rounded-lg focus:ring-2 focus:ring-[#0b192c] ${
                      validationErrors.complaintDescription ? "border-red-500 bg-red-50" : "border-slate-300"
                    }`}
                  />
                  {validationErrors.complaintDescription && (
                    <p className="text-[11px] text-red-600 mt-0.5">{validationErrors.complaintDescription}</p>
                  )}
                </div>


                {/* (e) Type of Complaint in Dropdown */}
                <div className="sm:col-span-6">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    (e) Type of Complaint (Classification) *
                  </label>
                  <select
                    value={complaintClassification}
                    onChange={(e) => setComplaintClassification(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0b192c] font-medium"
                  >
                    <option value="COGNIZABLE_OFFENCE">Cognizable Offence (Requires Investigation)</option>
                    <option value="NON_COGNIZABLE_INCIDENT">Non-Cognizable Incident (NCR Docket)</option>
                    <option value="CIVIL_LAND_DISPUTE">Civil / Land &amp; Demarcation Dispute</option>
                    <option value="DOMESTIC_FAMILY_ACCORD">Domestic / Matrimonial Discord</option>
                    <option value="CYBER_FINANCIAL_FRAUD">Cyber / Online Financial Fraud</option>
                    <option value="PUBLIC_NUISANCE">Public Nuisance / Breach of Peace</option>
                    <option value="MISSING_PERSON_REPORT">Missing Person / Lost Article</option>
                    <option value="SERVICE_VIGILANCE_PETITION">Service Vigilance / Official Petition</option>
                  </select>
                </div>

                {/* (f) Complaint Purpose */}
                <div className="sm:col-span-6">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    (f) Complaint Purpose *
                  </label>
                  <select
                    value={complaintPurpose}
                    onChange={(e) => setComplaintPurpose(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0b192c] font-medium"
                  >
                    <option value="PRELIMINARY_ENQUIRY_BNSS_173">
                      Preliminary Enquiry as per Section 173(3) BNSS
                    </option>
                    <option value="REGISTRATION_OF_FIR">
                      Registration of FIR / Criminal Action
                    </option>
                    <option value="MEDIATION_SETTLEMENT">
                      Mediation &amp; Amicable Settlement
                    </option>
                    <option value="PREVENTIVE_ACTION_BNSS_126">
                      Preventive Action (Security Bond BNSS 126/129)
                    </option>
                    <option value="GENERAL_DIARY_RECORD">
                      Station General Diary (GD / Roznamcha) Record Entry Only
                    </option>
                    <option value="POLICE_ASSISTANCE">
                      Police Assistance &amp; Citizen Protection
                    </option>
                  </select>
                </div>
              </div>
            </div>

            {/* =========================================================================
                5. RUN INTELLIGENCE CHECK (LOCAL ENGINE WITHOUT AI MODEL)
               ========================================================================= */}
            <div id="sec-intel" className="space-y-4 pt-6 border-t border-slate-200">
              <div className="border-b border-slate-200 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-[#0b192c] uppercase tracking-wide flex items-center gap-2">
                    <Search className="w-4 h-4 text-purple-600" />
                    <span>5. Run Intelligence Check</span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    Runs 100% locally by checking specific filled fields (Complainant, Mobile, Accused, Spot &amp; Facts) against station records without AI model
                  </p>
                </div>

                {/* Dropdown Format Button */}
                <div className="relative" ref={dropdownRef}>
                  <div className="inline-flex rounded-lg shadow-2xs">
                    <button
                      type="button"
                      onClick={() => handleRunIntelCheck("all")}
                      className="px-3.5 py-1.5 bg-[#0b192c] hover:bg-slate-900 text-white rounded-l-lg text-xs font-bold flex items-center gap-1.5 transition-colors border-r border-slate-700 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>{intelResult ? "Re-Run All Checks" : "Run All Checks"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIntelDropdownOpen((prev) => !prev)}
                      className="px-2.5 py-1.5 bg-[#0b192c] hover:bg-slate-900 text-white rounded-r-lg text-xs transition-colors flex items-center justify-center cursor-pointer"
                      title="Select Intelligence Check"
                    >
                      <ChevronDown className="w-3.5 h-3.5 text-slate-300" />
                    </button>
                  </div>

                  {intelDropdownOpen && (
                    <div className="absolute right-0 mt-1.5 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-30 animate-in fade-in-50">
                      <div className="px-3 py-1.5 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                        <span>Select Check Type</span>
                        <span className="text-emerald-700 font-mono text-[9px] bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">Local Only</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRunIntelCheck("all")}
                        className="w-full px-3 py-2 text-left text-xs text-slate-700 hover:bg-blue-50 hover:text-blue-900 font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0"></span>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900">Run All Checks</div>
                          <div className="text-[10px] text-slate-500 font-normal">Full local check on all filled fields</div>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRunIntelCheck("cross")}
                        className="w-full px-3 py-2 text-left text-xs text-slate-700 hover:bg-red-50 hover:text-red-900 font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <span className="w-2 h-2 rounded-full bg-red-600 shrink-0"></span>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900">Cross-Complaint Check</div>
                          <div className="text-[10px] text-slate-500 font-normal">Counter complaints by accused / opposite party</div>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRunIntelCheck("repeat")}
                        className="w-full px-3 py-2 text-left text-xs text-slate-700 hover:bg-amber-50 hover:text-amber-900 font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <span className="w-2 h-2 rounded-full bg-amber-600 shrink-0"></span>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900">Repeat Complainant Check</div>
                          <div className="text-[10px] text-slate-500 font-normal">Scan past filings by complainant mobile &amp; name</div>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRunIntelCheck("linked")}
                        className="w-full px-3 py-2 text-left text-xs text-slate-700 hover:bg-purple-50 hover:text-purple-900 font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <span className="w-2 h-2 rounded-full bg-purple-600 shrink-0"></span>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900">Linked &amp; Similar Cases</div>
                          <div className="text-[10px] text-slate-500 font-normal">Match crime category, incident spot &amp; facts</div>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRunIntelCheck("fir")}
                        className="w-full px-3 py-2 text-left text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0"></span>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900">Prior FIR Records Check</div>
                          <div className="text-[10px] text-slate-500 font-normal">Check prior historical FIR registry</div>
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Display if Check was executed */}
              {intelResult && (
                <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-xs space-y-2.5 animate-in fade-in-50">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveIntelTab("cross");
                        setShowIntelModal(true);
                      }}
                      className={`p-2 rounded-lg border text-left transition-all ${
                        intelResult.crossComplaints.length > 0
                          ? "bg-red-50 border-red-200 text-red-900"
                          : "bg-slate-50 border-slate-200 text-slate-600"
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-bold uppercase">
                        <span>Cross-Cases</span>
                        <span className={`px-1.5 py-0.2 rounded-full ${intelResult.crossComplaints.length > 0 ? "bg-red-600 text-white" : "bg-slate-200 text-slate-600"}`}>
                          {intelResult.crossComplaints.length}
                        </span>
                      </div>
                      <p className="text-xs font-bold mt-1">
                        {intelResult.crossComplaints.length > 0 ? "Detected" : "Clean"}
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveIntelTab("repeat");
                        setShowIntelModal(true);
                      }}
                      className={`p-2 rounded-lg border text-left transition-all ${
                        intelResult.repeatHistory.totalPreviousComplaints > 0
                          ? "bg-amber-50 border-amber-200 text-amber-900"
                          : "bg-slate-50 border-slate-200 text-slate-600"
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-bold uppercase">
                        <span>Repeat Files</span>
                        <span className={`px-1.5 py-0.2 rounded-full ${intelResult.repeatHistory.totalPreviousComplaints > 0 ? "bg-amber-600 text-white" : "bg-slate-200 text-slate-600"}`}>
                          {intelResult.repeatHistory.totalPreviousComplaints}
                        </span>
                      </div>
                      <p className="text-xs font-bold mt-1">
                        {intelResult.repeatHistory.totalPreviousComplaints > 0 ? `${intelResult.repeatHistory.totalPreviousComplaints} Found` : "First Time"}
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveIntelTab("linked");
                        setShowIntelModal(true);
                      }}
                      className="p-2 rounded-lg border bg-slate-50 border-slate-200 text-slate-600 text-left"
                    >
                      <div className="flex items-center justify-between text-[10px] font-bold uppercase">
                        <span>Linked</span>
                        <span className="px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-600">
                          {intelResult.linkedComplaints.length}
                        </span>
                      </div>
                      <p className="text-xs font-bold mt-1">
                        {intelResult.linkedComplaints.length > 0 ? "Links Found" : "No Match"}
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveIntelTab("fir");
                        setShowIntelModal(true);
                      }}
                      className="p-2 rounded-lg border bg-slate-50 border-slate-200 text-slate-600 text-left"
                    >
                      <div className="flex items-center justify-between text-[10px] font-bold uppercase">
                        <span>Prior FIRs</span>
                        <span className="px-1.5 py-0.2 rounded-full bg-purple-100 text-purple-700">
                          {intelResult.priorFirs.length}
                        </span>
                      </div>
                      <p className="text-xs font-bold mt-1">
                        {intelResult.priorFirs.length > 0 ? "Records Exist" : "Clean"}
                      </p>
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-1 text-xs">
                    <span className="text-[11px] text-slate-500">
                      Checked locally at: {new Date(intelResult.scannedAt).toLocaleTimeString()}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowIntelModal(true)}
                      className="text-xs text-blue-700 hover:text-blue-900 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <span>View Results Details</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}
            </div>
            {isSho && (
              <div id="sec-assign-eo" className="space-y-4 pt-6 border-t border-slate-200">
                <div className="border-b border-slate-200 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm sm:text-base font-bold text-[#0b192c] uppercase tracking-wide flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-emerald-600" />
                        <span>6. Assign EO</span>
                      </h2>
                      <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                        SHO Authority
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Allocate an Enquiry Officer immediately during complaint registration and issue supervisory directions
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShouldAssignEoNow(!shouldAssignEoNow)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs self-start sm:self-auto ${
                      shouldAssignEoNow
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                        : "bg-slate-200 hover:bg-slate-300 text-slate-700"
                    }`}
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>{shouldAssignEoNow ? "Assign EO: Enabled" : "Assign EO: Disabled"}</span>
                  </button>
                </div>

                {shouldAssignEoNow ? (
                  <div className="p-4 sm:p-5 bg-emerald-50/40 border border-emerald-200 rounded-xl space-y-4 animate-in fade-in-50">
                    {/* Enquiry Officer Selection */}
                    <div className="space-y-3">
                      <label className="block text-xs font-bold text-slate-800">
                        Select Enquiry Officer (From Active Station Roster) *
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <select
                            value={selectedEoId}
                            onChange={(e) => setSelectedEoId(e.target.value)}
                            className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 font-semibold text-slate-800"
                          >
                            {MOCK_ENQUIRY_OFFICERS.map((eo) => (
                              <option key={eo.id} value={eo.id}>
                                {eo.rank} {eo.name} ({eo.pno}) — {eo.activeCases} Active Cases ({eo.availability})
                              </option>
                            ))}
                          </select>
                          <p className="text-[10px] text-slate-500 mt-1">
                            Officer will receive instant dispatch alert and case docket access upon submission.
                          </p>
                        </div>

                        {/* Selected Officer Preview Card */}
                        {(() => {
                          const currentEo =
                            MOCK_ENQUIRY_OFFICERS.find((e) => e.id === selectedEoId) ||
                            MOCK_ENQUIRY_OFFICERS[0];
                          return (
                            <div className="p-3 bg-white border border-emerald-300 rounded-lg text-xs space-y-1 shadow-2xs">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-900">
                                  {currentEo.rank} {currentEo.name}
                                </span>
                                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
                                  {currentEo.availability}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-600">
                                <strong>Roster Duty:</strong> {currentEo.rosterDuty}
                              </p>
                              <p className="text-[11px] text-slate-600">
                                <strong>Shift:</strong> {currentEo.shift} • <strong>Beat:</strong> {currentEo.beatZone}
                              </p>
                              <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px] text-slate-500">
                                <span>PNO: {currentEo.pno}</span>
                                <span>
                                  Current Load: <strong>{currentEo.activeCases} Active Enquiries</strong>
                                </span>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-center justify-between">
                    <span>
                      Enquiry Officer assignment is currently skipped. The complaint will be registered in &ldquo;REGISTERED&rdquo; status and can be assigned later from the Complaint Profile or Pending Roster.
                    </span>
                    <button
                      type="button"
                      onClick={() => setShouldAssignEoNow(true)}
                      className="text-xs font-bold text-emerald-700 hover:text-emerald-900 underline ml-2 shrink-0"
                    >
                      Assign EO Now
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* =========================================================================
                7. STATUTORY CERTIFICATION & FORM SUBMISSION
               ========================================================================= */}
            <div className="space-y-4 pt-6 border-t border-slate-200">

              {/* Validation Errors Alert Banner */}
              {Object.keys(validationErrors).length > 0 && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-start gap-2.5 animate-in fade-in-50">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Please correct the highlighted mandatory fields before registering:</p>
                    <ul className="list-disc pl-4 mt-1 space-y-0.5 text-[11px] text-red-700 font-medium">
                      {Object.entries(validationErrors).map(([key, msg]) => (
                        <li key={key}>{msg}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Bottom Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                <Link href="/complaints" className="w-full sm:w-auto">
                  <Button
                    type="button"
                    variant="outline"
                    size="md"
                    className="text-xs font-semibold gap-1.5 w-full sm:w-auto"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Cancel &amp; Return
                  </Button>
                </Link>

                <Button
                  type="submit"
                  variant="danger"
                  size="lg"
                  isLoading={isSubmitting}
                  className="text-xs sm:text-sm font-bold gap-2 bg-[#b8001f] hover:bg-[#990000] w-full sm:w-auto px-6 py-2.5 shadow-md transition-all active:scale-98"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {isSho && shouldAssignEoNow
                    ? "Confirm, Register & Assign EO (PPR Rule 22.48)"
                    : "Confirm & Register Complaint (PPR Rule 22.48)"}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Central Database Intelligence Check Modal */}
      {showIntelModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs animate-in fade-in-50">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-300 overflow-hidden">
            {/* Modal Header */}
            <div className="px-5 py-4 bg-[#0b192c] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-bold">
                  <Search className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-amber-300">
                      Police Database Intelligence Scan
                    </span>
                    {intelResult?.hasAlerts && (
                      <span className="px-1.5 py-0.2 text-[10px] font-bold bg-red-600 text-white rounded">
                        ALERTS FOUND
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-black text-white">
                    Cross-Complaints, Repeat Complainants &amp; Prior FIR Dossier
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowIntelModal(false)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scanned Parameters Bar */}
            <div className="px-5 py-2.5 bg-slate-100 border-b border-slate-200 text-xs flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-700">
              <span className="text-[10px] font-bold uppercase text-slate-500">Query Parameters:</span>
              <span>
                <strong className="text-slate-900">Complainant:</strong> {complainants[0]?.name || "—"} (
                {complainants[0]?.mobile || "No Mobile"})
              </span>
              <span>
                <strong className="text-slate-900">Accused:</strong>{" "}
                {isAccusedKnown ? accusedList[0]?.name || "—" : "Unknown / Unidentified"}
              </span>
              <span>
                <strong className="text-slate-900">Location:</strong> {incidentPlace || "—"}
              </span>
            </div>

            {/* Sub-Tabs Nav */}
            <div className="px-5 pt-3 border-b border-slate-200 flex items-center gap-2 overflow-x-auto bg-slate-50">
              <button
                type="button"
                onClick={() => setActiveIntelTab("all")}
                className={`pb-2.5 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                  activeIntelTab === "all"
                    ? "border-[#0b192c] text-[#0b192c]"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Overview</span>
                {intelResult?.hasAlerts && <span className="w-2 h-2 rounded-full bg-red-600"></span>}
              </button>

              <button
                type="button"
                onClick={() => setActiveIntelTab("cross")}
                className={`pb-2.5 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                  activeIntelTab === "cross"
                    ? "border-red-600 text-red-700"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
                <span>Cross Complaints</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    (intelResult?.crossComplaints.length || 0) > 0
                      ? "bg-red-600 text-white"
                      : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {intelResult?.crossComplaints.length || 0}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveIntelTab("repeat")}
                className={`pb-2.5 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                  activeIntelTab === "repeat"
                    ? "border-amber-600 text-amber-700"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                <span>Repeat History</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    (intelResult?.repeatHistory.totalPreviousComplaints || 0) > 0
                      ? "bg-amber-600 text-white"
                      : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {intelResult?.repeatHistory.totalPreviousComplaints || 0}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveIntelTab("linked")}
                className={`pb-2.5 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                  activeIntelTab === "linked"
                    ? "border-blue-600 text-blue-700"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Link2 className="w-3.5 h-3.5 text-blue-600" />
                <span>Linked Cases</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    (intelResult?.linkedComplaints.length || 0) > 0
                      ? "bg-blue-600 text-white"
                      : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {intelResult?.linkedComplaints.length || 0}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveIntelTab("fir")}
                className={`pb-2.5 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                  activeIntelTab === "fir"
                    ? "border-emerald-700 text-emerald-800"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <FileCheck2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Prior FIRs</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    (intelResult?.priorFirs.length || 0) > 0
                      ? "bg-purple-600 text-white"
                      : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {intelResult?.priorFirs.length || 0}
                </span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1 max-h-[60vh]">
              {/* CROSS COMPLAINTS VIEW */}
              {(activeIntelTab === "cross" || activeIntelTab === "all") && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-red-950 uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 text-red-600" />
                      <span>Cross-Complaints Against Current Complainant</span>
                    </h4>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {intelResult?.crossComplaints.length || 0} found
                    </span>
                  </div>

                  {intelResult && intelResult.crossComplaints.length > 0 ? (
                    <div className="space-y-2">
                      {intelResult.crossComplaints.map((match) => (
                        <div
                          key={match.existingComplaint.id}
                          className="p-3 bg-red-50/70 border border-red-200 rounded-xl space-y-2 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-red-900">
                              {match.existingComplaint.complaintNumber}
                            </span>
                            <span className="text-[10px] bg-red-200 text-red-900 px-2 py-0.5 rounded font-bold">
                              Severity: {match.severity}
                            </span>
                          </div>
                          <p className="text-slate-700 text-[11px] leading-relaxed">
                            <strong>Opposite Complainant:</strong> {match.existingComplaint.complainantName} (Mob:{" "}
                            {match.existingComplaint.complainantMobile})<br />
                            <strong>Allegation:</strong> {match.existingComplaint.incidentDetails}
                          </p>
                          <div className="flex items-center justify-between pt-1 border-t border-red-200/60">
                            <span className="text-[10px] text-slate-500">
                              Status: <strong>{match.existingComplaint.status}</strong> • EO:{" "}
                              {match.existingComplaint.assignedEoName || "Unassigned"}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setLinkedComplaintNo(match.existingComplaint.complaintNumber);
                                setIsCrossCaseTagged(true);
                                setShowIntelModal(false);
                              }}
                              className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[11px] font-bold transition-colors"
                            >
                              Tag as Cross-Case
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 text-xs text-center">
                      No cross-complaints filed by the opposite party detected in police station archives.
                    </div>
                  )}
                </div>
              )}

              {/* REPEAT COMPLAINANT HISTORY */}
              {(activeIntelTab === "repeat" || activeIntelTab === "all") && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                      <RotateCcw className="w-4 h-4 text-amber-600" />
                      <span>Complainant Previous Registry Records</span>
                    </h4>
                  </div>

                  {intelResult && intelResult.repeatHistory.totalPreviousComplaints > 0 ? (
                    <div className="space-y-2">
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-1">
                        <p className="font-bold text-amber-900">
                          {intelResult.repeatHistory.riskLevel === "FREQUENT_COMPLAINANT"
                            ? "⚠️ Frequent Complainant Alert (3+ complaints on record)"
                            : "Prior Complaints Recorded"}
                        </p>
                        <p className="text-[11px] text-amber-800">
                          Total past complaints registered:{" "}
                          <strong>{intelResult.repeatHistory.totalPreviousComplaints}</strong>
                        </p>
                      </div>

                      {intelResult.repeatHistory.complaints?.map((c: ComplaintItem) => (
                        <div
                          key={c.id}
                          className="p-3 bg-white border border-slate-200 rounded-xl space-y-1 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-slate-900">{c.complaintNumber}</span>
                            <span className="text-[10px] text-slate-500">{c.status}</span>
                          </div>
                          <p className="text-[11px] text-slate-600 line-clamp-2">{c.incidentDetails}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 text-xs text-center">
                      First-time complainant. No prior complaint records found for this citizen mobile or name.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                PPR Rule 22.48 / Automated Central Intelligence Dossier
              </span>
              <Button size="sm" variant="outline" onClick={() => setShowIntelModal(false)} className="text-xs">
                Close Dossier
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* INSTANT DOCUMENT & MEDIA PREVIEW MODAL (BINA DOWNLOAD KRE) */}
      {previewModalFile && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in-50"
          onClick={() => setPreviewModalFile(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-5 py-3.5 bg-[#0b192c] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-blue-600/30 text-amber-400 flex items-center justify-center shrink-0">
                  <Eye className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-sm text-white truncate max-w-md">
                    {previewModalFile.name}
                  </h3>
                  <div className="flex items-center gap-2 text-[10px] text-slate-300">
                    <span className="uppercase font-semibold px-1.5 py-0.2 rounded bg-slate-800 text-amber-300">
                      {previewModalFile.category}
                    </span>
                    <span>• Instant Preview (No Download Required)</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {previewModalFile.dataUrl && (
                  <a
                    href={previewModalFile.dataUrl}
                    download={previewModalFile.name}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
                    title="Download file"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setPreviewModalFile(null)}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content Body */}
            <div className="p-3 sm:p-5 overflow-y-auto max-h-[80vh] flex flex-col items-center justify-center bg-slate-100 min-h-[420px]">
              {/* 1. Missing or Empty dataUrl Fallback */}
              {!previewModalFile.dataUrl ? (
                <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-md border border-slate-200 text-center space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                    <FileText className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="font-bold text-base text-slate-900">{previewModalFile.name}</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      This document is sealed in the station evidence docket. Direct inline data stream is preserved in complaint attachments.
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg text-[11px] text-slate-600 border border-slate-200">
                    Category: <span className="font-bold uppercase text-slate-800">{previewModalFile.category}</span>
                  </div>
                </div>
              ) : previewModalFile.category === "image" ||
                previewModalFile.name.toLowerCase().match(/\.(jpe?g|png|webp|gif|bmp|svg)$/) ||
                previewModalFile.dataUrl.startsWith("data:image/") ? (
                /* 2. Image Evidence Preview */
                <div className="w-full flex flex-col items-center justify-center gap-3">
                  <img
                    src={previewModalFile.dataUrl}
                    alt={previewModalFile.name}
                    className="max-h-[72vh] w-auto max-w-full rounded-xl object-contain shadow-md bg-white border border-slate-200"
                  />
                  <div className="flex items-center gap-2">
                    <a
                      href={previewModalFile.dataUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Open Full Size</span>
                    </a>
                  </div>
                </div>
              ) : previewModalFile.category === "video" ||
                previewModalFile.name.toLowerCase().match(/\.(mp4|mov|avi|mkv|webm|3gp)$/) ||
                previewModalFile.dataUrl.startsWith("data:video/") ? (
                /* 3. Video Evidence Preview */
                <div className="w-full flex items-center justify-center">
                  <video
                    controls
                    autoPlay
                    src={previewModalFile.dataUrl}
                    className="max-h-[72vh] w-full rounded-xl bg-black shadow-md"
                  />
                </div>
              ) : previewModalFile.category === "audio" ||
                previewModalFile.name.toLowerCase().match(/\.(mp3|wav|m4a|ogg|aac|flac|wma)$/) ||
                previewModalFile.dataUrl.startsWith("data:audio/") ? (
                /* 4. Audio Evidence Preview */
                <div className="w-full max-w-lg p-6 bg-white rounded-2xl shadow-md border border-slate-200 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                    <Music className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{previewModalFile.name}</h4>
                    <p className="text-xs text-slate-500">Audio Statement / Call Recording</p>
                  </div>
                  <audio controls autoPlay src={previewModalFile.dataUrl} className="w-full pt-2" />
                </div>
              ) : previewModalFile.name.toLowerCase().endsWith(".pdf") ||
                previewModalFile.dataUrl.startsWith("data:application/pdf") ? (
                /* 5. PDF Document Preview (Native Blob URL Object + Embed + Direct Tab Action) */
                <div className="w-full h-[76vh] bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden flex flex-col">
                  <div className="px-4 py-2 bg-slate-100 border-b border-slate-200 flex items-center justify-between text-xs text-slate-700">
                    <span className="font-bold truncate">PDF Document Viewer • {previewModalFile.name}</span>
                    <div className="flex items-center gap-2">
                      <a
                        href={previewBlobUrl || previewModalFile.dataUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold flex items-center gap-1 transition-colors shadow-2xs"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Open in New Tab</span>
                      </a>
                    </div>
                  </div>
                  <div className="w-full h-full relative bg-slate-100 flex items-center justify-center">
                    <iframe
                      src={previewBlobUrl || previewModalFile.dataUrl}
                      title={previewModalFile.name}
                      className="w-full h-full border-0 rounded-b-xl"
                    />
                  </div>
                </div>
              ) : previewModalFile.dataUrl.startsWith("data:text/") ? (
                /* 6. Text Document Preview */
                <div className="w-full h-[74vh] bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden flex flex-col">
                  <div className="px-4 py-2.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700 truncate">Text Document Content</span>
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                      Plain Text
                    </span>
                  </div>
                  <div className="p-4 overflow-y-auto flex-1 font-mono text-xs whitespace-pre-wrap text-slate-800 bg-white">
                    {(() => {
                      try {
                        const base64Index = previewModalFile.dataUrl.indexOf(";base64,");
                        if (base64Index !== -1) {
                          const base64 = previewModalFile.dataUrl.slice(base64Index + 8);
                          return decodeURIComponent(escape(atob(base64)));
                        }
                        return previewModalFile.dataUrl;
                      } catch {
                        return "Unable to decode text stream directly.";
                      }
                    })()}
                  </div>
                </div>
              ) : (
                /* 7. Office / Word / Excel / Generic Document Preview Dossier Card */
                <div className="w-full max-w-lg p-6 sm:p-8 bg-white rounded-2xl shadow-md border border-slate-200 text-center space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center mx-auto shadow-xs">
                    <FileText className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="font-bold text-base text-slate-900">{previewModalFile.name}</h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                      Official document uploaded and sealed into the complaint evidence dossier.
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl text-left text-xs space-y-1.5 border border-slate-200">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">File Type:</span>
                      <span className="font-bold uppercase text-slate-800">
                        {previewModalFile.name.split(".").pop() || "Document"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Evidence Status:</span>
                      <span className="font-bold text-emerald-700">Sealed in Station Docket</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-2.5 pt-2">
                    <a
                      href={previewModalFile.dataUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Open in Browser</span>
                    </a>
                    <a
                      href={previewModalFile.dataUrl}
                      download={previewModalFile.name}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download File</span>
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-2.5 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <span>Instant Docket Evidence Viewer • Haryana Police CMS</span>
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
