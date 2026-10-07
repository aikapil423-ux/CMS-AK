"use client";

import React, { useState, useEffect, useRef, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ScrollText,
  Printer,
  Copy,
  Check,
  RotateCcw,
  Shield,
  FileText,
  Download,
  FileCheck2,
  Building,
  User,
  Phone,
  ArrowLeft,
  Save,
  CheckCircle2,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Layers,
  UploadCloud,
  Loader2,
  Scale,
  Video,
  Info,
  Eye,
  X,
  Search,
  Sliders,
  Table,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { VoiceInputButton } from "@/components/ui/voice-input-button";
import { ComplaintService } from "@/services/complaintService";
import { ComplaintItem, NoticeFormData, DynamicDocumentSection } from "@/types";
import { generateNoticeDocumentHtml } from "@/utils/documentHtmlGenerators";
import { parseUploadedDocument } from "@/utils/universalDocumentParser";
import { EnquiryWorkspaceNav } from "@/components/enquiry-workspace/EnquiryWorkspaceNav";
import { ComplaintAnalysisHeader } from "@/components/enquiry-workspace/ComplaintAnalysisHeader";
import { IdentifiedPerson, ComplaintAnalysisReport } from "@/services/complaintDocumentAnalysisService";
import { BuilderService, BuilderTemplateItem } from "@/services/builderService";

export type PresetTemplateType =
  | "haryana_notice"
  | "cdr_requisition"
  | "arrest_memo"
  | "natgrid_proforma";

export type TemplateType = PresetTemplateType | string;

interface CustomTemplate {
  id: string;
  name: string;
  badge: string;
  icon: any;
  formData: NoticeFormData;
  clauses: DynamicDocumentSection[];
}

const DEFAULT_SAMPLE_DATA: Record<PresetTemplateType, NoticeFormData> = {
  haryana_notice: {
    headerDept: "हरियाणा पुलिस",
    headerGovt: "जिला अम्बाला।",
    docTitle: "सूचना-पत्र",
    docSubTitle: "",
    recipientDesignation: "",
    dispatchNo: "",
    policeStation: "थाना शहर अम्बाला",
    district: "जिला अम्बाला।",
    issueDate: new Date().toLocaleDateString("hi-IN"),

    noticeeName: "",
    noticeeFather: "",
    noticeeAge: "",
    noticeeAddress: "",
    noticeePhone: "",
    noticeeRole: "",

    complaintNo: "",
    complainantName: "",
    complainantAddress: "",
    incidentDate: new Date().toLocaleDateString("hi-IN"),
    sectionsOfLaw: "",
    allegationsBrief: "",

    groundsBrief: "",
    appearanceDate: "",
    appearanceTime: "11:00 AM",
    appearancePlace: "",
    documentsRequired: "",
    statutoryClarification: "",

    stationEmail: "sho.cityambala-hry@nic.in",
    officerEmail: "io.ambala-hry@nic.in",
    videoConferenceDeadline: "",

    officerName: "सुरेन्द्र पाल",
    officerRank: "सब-इंस्पेक्टर",
    officerPno: "PNO-23841",
    officerPhone: "9812034567",
  },

  cdr_requisition: {
    headerDept: "थाना शहर पानीपत",
    headerGovt: "जिला पानीपत",
    docTitle: "प्रारुप बाबत काल डिटेल",
    docSubTitle: "",
    dispatchNo: "",
    policeStation: "थाना शहर पानीपत",
    district: "जिला पानीपत",
    issueDate: new Date().toLocaleDateString("hi-IN"),

    toAuthority: "पुलिस अधीक्षक पानीपत।",

    noticeeName: "",
    noticeeFather: "",
    noticeeAge: "",
    noticeeAddress: "",
    noticeePhone: "",
    noticeeRole: "",

    complaintNo: "128/2026",
    complainantName: "",
    incidentDate: "18-09-2026",
    sectionsOfLaw: "धारा 318(4), 316(2) BNS",
    allegationsBrief:
      "निवेदन है कि उपरोक्त अभियोग में निम्नलिखित मोबाईल फोन की काल डिटेल व कैफ आई0डी0/आई.एम.ई.आई. की सर्चिंग की आवश्यकता है। उपलब्ध करवायी जावे।",

    appearanceDate: "",
    appearanceTime: "",
    appearancePlace: "",
    documentsRequired: "",

    officerName: "सुरेन्द्र पाल",
    officerRank: "सब-इंस्पेक्टर",
    officerPno: "PNO-23841",
    officerPhone: "9812034567",

    shoName: "प्रबंधक अफसर",
    supervisoryOfficerName: "पर्यवेक्षण अधिकारी",
    certificateText:
      "1. The Subscriber identity has been ascertained and it is ensured that person in question is not someone whose call details are of sensitive nature.\n2. The number is not subscribed in the name of a sitting MP/MLA/MLC & Governor.",
  },

  arrest_memo: {
    headerDept: "हरियाणा पुलिस",
    headerGovt: "फार्म संख्या 26.8(1)",
    docTitle: "गिरफ्तारी/ न्यायालय में समर्पण फार्म",
    docSubTitle: "भाग-1 फार्म संख्या 26.8(1) (प्रत्येक अभियुक्त के लिए अलग अलग फार्म)",
    headerVersion: "v3.0 dt 07.04.2025",
    district: "पानीपत",
    policeStation: "थाना शहर पानीपत",
    arrestYear: "2026",
    complaintNo: "128/2026",
    issueDate: "18.09.2026",
    incidentDate: "18.09.2026",
    sectionsOfLaw: "धारा 318(4), 316(2), 351(2) BNS, 2023",

    arrestDate: "18.09.2026",
    arrestTime: "11:30 प्रात:",
    arrestGdNo: "रपट न0 24",
    arrestPlace: "रेलवे रोड चौक, पानीपत",
    arrestPlaceContinuation: "बस स्टैंड के पास",
    arrestPoliceStation: "थाना शहर पानीपत",
    arrestDistrict: "पानीपत",
    courtNameSurrender: "",

    noticeeName: "विकास शर्मा",
    noticeeFather: "रमेश चंद शर्मा",
    noticeeAlias1: "विक्की",
    noticeeAlias2: "",
    noticeeNationality: "भारतीय",
    voterOrIdCardNo: "HR/04/028/194821",
    passportNo: "",
    passportIssueDate: "",
    passportIssuePlace: "",
    religion: "हिन्दू",
    categoryCaste: "सामान्य",
    occupation: "प्राइवेट नौकरी / व्यवसाय",
    permanentAddress: "मकान न0 412, सेक्टर 7, अर्बन एस्टेट, पानीपत",
    currentAddress: "मकान न0 412, सेक्टर 7, अर्बन एस्टेट, पानीपत",
    mobileNo: "9812044551",
    phoneNo: "",
    userIdentificationNo: "8492-3810-4921",
    panNo: "ABCPS1234F",
    noticeeAge: "34 वर्ष",
    noticeePhone: "9812044551",
    noticeeAddress: "मकान न0 412, सेक्टर 7, अर्बन एस्टेट, पानीपत",
    noticeeRole: "गिरफ्तार अभियुक्त",
    accusedGender: "पुरुष",
    accusedAadhaar: "8492-3810-4921",
    accusedPan: "ABCPS1234F",

    physicalConditionOrInjuries: "शारीरिक दशा सामान्य है। कोई ताजा जाहिरा चोट नहीं है। (सामान्य डाक्टरी मुलाहिजा करवाया गया)",
    custodyDate: "18.09.2026",
    custodyTime: "11:30 प्रात:",
    custodyPlace: "रेलवे रोड चौक, पानीपत",

    arrestWitnesses: [
      { id: "wit_1", srNo: "1", name: "बलजीत सिंह सुपुत्र हरनाम सिंह", address: "वार्ड न0 5, पानीपत", signature: "बलजीत सिंह" },
      { id: "wit_2", srNo: "2", name: "रमेश लाल सुपुत्र वेद प्रकाश", address: "न्यू बस स्टैंड, पानीपत", signature: "रमेश लाल" },
      { id: "wit_3", srNo: "3", name: "", address: "", signature: "" },
    ],

    // Page 2
    relativeName: "अमित शर्मा",
    relativeRelation: "भाई",
    intimationDate: "18.09.2026",
    intimationTime: "11:45 प्रात:",
    relativeMobile: "9812099881",
    familyMember1: "रमेश चंद (पिता)",
    familyMember2: "अमित शर्मा (भाई)",
    familyMember3: "सुनीता शर्मा (पत्नी)",

    grounds47Sections: "धारा 318(4), 316(2), 351(2) BNS, 2023",
    grounds47Role: "परिवादी के साथ 4,50,000/- रुपये की धोखाधड़ी करने एवं जान से मारने की धमकी देने में मुख्य भूमिका।",
    grounds47Evidence: "परिवादी का ब्यान, बैंक खाता ट्रांजेक्शन रिकॉर्ड एवं कॉल रिकॉर्डिंग साक्ष्य।",
    grounds47Other: "आरोपी द्वारा गवाहों को धमकाने एवं फरार होने की संभावना को रोकने हेतु।",

    jamaTalashiItems: [
      { id: "jt_1", srNo: "1.", description: "नकदी रुपये 1,450/- (एक हजार चार सौ पचास रुपये)", quantity: "1,450/-" },
      { id: "jt_2", srNo: "2.", description: "एक मोबाइल फोन सैमसंग (नीला रंग, चालू हालत)", quantity: "1" },
      { id: "jt_3", srNo: "3.", description: "पर्स चमड़ा भूरा रंग मय आधार कार्ड व ड्राइविंग लाइसेंस", quantity: "1" },
    ],
    witnessSign1: "बलजीत सिंह सुपुत्र हरनाम सिंह",
    witnessSign2: "रमेश लाल सुपुत्र वेद प्रकाश",
    ioSignPlace: "पानीपत",
    ioSignDate: "18.09.2026",
    officerName: "सुरेंद्र पाल",
    officerRank: "उप-निरीक्षक (SI)",
    officerPno: "04291885",
    officerPhone: "9812034567",

    // Page 3 Identification Form
    stateCaseTitle: "हरियाणा राज्य",
    caseNo: "128/2026",
    caseDate: "18.09.2026",
    caseSections: "318(4), 316(2), 351(2) BNS",
    casePs: "थाना शहर पानीपत",
    vsName: "विकास शर्मा सुपुत्र रमेश चंद",
    gender: "पुरुष",
    dobYear: "14.08.1992 / 34 वर्ष",
    bodyBuild: "मध्यम",
    heightCm: "173 सेमी",
    colorBloodGroup: "गेहुंआ / B+ve",
    identMarks: "दाहिनी भौंह पर पुराना 1 इंच कट का निशान",
    deformities: "कोई नहीं",
    teeth: "सामान्य",
    hair: "काले छोटे",
    eyes: "काली",
    habits: "सामान्य",
    dress: "नीली जींस व सफेद शर्ट",
    languageDialect: "हिन्दी / हरियाणवी",
    burnMarks: "कोई नहीं",
    leukodermaSpots: "कोई नहीं",
    moleMarks: "बाएं गाल पर काला तिल",
    scarWoundMarks: "दाहिनी कोहनी पर पुराना निशान",
    tattooMarks: "दाहिने हाथ पर ॐ का निशान",
    otherIdentTraits: "कोई अन्य विशेष लक्षण नहीं",
    fingerprintsTaken: "हाँ",
    livingStandard: "मध्यम",
    educationalQualification: "स्नातक (B.Com)",
    profession: "दुकानदार / प्राइवेट कार्य",
    incomeGroup: "2 से 5 लाख वार्षिक",

    // Page 4 Risk evaluation & MHC
    isDangerous: "नही",
    isBailJumped: "नही",
    usuallyCarriesArms: "नही",
    activeWithGang: "नही",
    isKnownListedCriminal: "नही",
    isHabitualOffender: "नही",
    isLikelyToEscapeBail: "नही",
    isLikelyToThreatenOrRepeat: "नही",
    wantedInOtherCrime: "कोई नहीं",
    riskNotesRemarks: "उपरोक्त सभी बिंदुओं पर रिकॉर्ड अनुसार कोई प्रतिकूल तथ्य नहीं पाया गया।",
    ioSignPlaceP4: "पानीपत",
    ioSignDateP4: "18.09.2026",
    ioNameP4: "सुरेंद्र पाल",
    ioRankP4: "उप-निरीक्षक",
    ioBeltNoP4: "04291885",
    priorRecord1: "कोई पूर्व आपराधिक रिकॉर्ड नहीं पाया गया।",
    priorRecord2: "",
    priorRecord3: "",
    eagleCriminalId: "EAGLE-HR-PNP-2026-9812",
    mhcName: "देविंदर कुमार",
    mhcRank: "मुख्य सिपाही (MHC)",
    mhcBeltNumber: "889/PNP",
  },

  natgrid_proforma: {
    headerDept: "HARYANA POLICE",
    headerGovt: "NATIONAL INTELLIGENCE GRID",
    docTitle: "NATGRID PERFORMA",
    docSubTitle: "",
    dispatchNo: "HP/SRS/2026/NATGRID-012",
    policeStation: "City Sirsa",
    district: "Sirsa",
    issueDate: new Date().toISOString().split("T")[0],

    shoName: "Inspector, SHO",
    shoPhone: "9812033441",
    shoEmail: "sho.citysirsa-hry@nic.in",

    complaintNo: "184/2026",
    incidentDate: "24-09-2026",
    sectionsOfLaw: "Section 318(4), 316(2), 336(3), 61(2) BNS, 2023 & Sec 66D IT Act",
    allegationsBrief: "Organized financial fraud and inter-state cyber syndicate cheating victims through fake banking channels and shell entities.",

    officerName: "Surender Pal",
    officerRank: "Sub-Inspector",
    officerPhone: "9812034567",
    officerPno: "PNO-23841",

    natgridNationalSecurity: false,
    natgridCounterTerror: false,
    natgridHeinousCrime: true,
    natgridReason: "To apprehend the accused",
    natgridDepartment: "FIU-IND, Bureau of Immigration (BOI), Telecom Service Providers, Income Tax PAN Database",
    natgridInfoRequired: "All bank accounts linked to PAN/Aadhaar, domestic/international travel history, active registered mobile connections, and vehicle ownership details.",

    noticeeAge: "38 Years",
    noticeeRole: "Suspect / Target Subject",
    complainantName: "Superintendent of Police Sirsa",
    appearanceDate: "14-08-1988",
    appearanceTime: "All Databases",
    appearancePlace: "CCTNS & National Intelligence Grid Central Portal",
    documentsRequired: "Passport No. Z4920194, Vehicle No. HR-24-AK-5521",

    noticeeName: "Vikas Sharma",
    noticeeFather: "Ramesh Chand Sharma",
    noticeeAddress: "House No. 412, Sector 7, Urban Estate, Sirsa, Haryana",
    noticeeDob: "14-08-1988",
    noticeePhone: "9812044551, 9416022331",
    accusedAadhaar: "8492-3810-4921",
    accusedPan: "ABCPS1234F",
    natgridOtherInfo: "Passport No. Z4920194, Vehicle No. HR-24-AK-5521",
  },
};

const TEMPLATE_CONFIG: Record<
  PresetTemplateType,
  { label: string; icon: any; color: string; badge: string; desc: string }
> = {
  haryana_notice: {
    label: "1. Haryana Police Appearance Notice (सूचना-पत्र)",
    icon: FileText,
    color: "text-blue-600",
    badge: "सूचना-पत्र",
    desc: "हरियाणा पुलिस प्रारूप सूचना-पत्र (थाना/यूनिट, परिवादी, उपस्थिति एवं वीडियो कॉन्फ्रेंस)",
  },
  cdr_requisition: {
    label: "2. CDR & Digital Evidence Requisition (Panipat Format)",
    icon: Phone,
    color: "text-purple-600",
    badge: "CDR & IMEI Proforma",
    desc: "Call Detail Records, CAF, IMEI & WhatsApp requisition with non-VIP certificate",
  },
  arrest_memo: {
    label: "3. गिरफ्तारी/ न्यायालय में समर्पण फार्म 26.8(1) (4 पृष्ठ)",
    icon: Shield,
    color: "text-red-600",
    badge: "फार्म 26.8(1) (4 पृष्ठ)",
    desc: "गिरफ्तारी/न्यायालय समर्पण फार्म भाग-1 व 2, धारा 47 BNSS, जामा तलाशी, पहचान पत्र व 18-शारीरिक लक्षण",
  },
  natgrid_proforma: {
    label: "4. NATGRID Intelligence Requisition Proforma",
    icon: Layers,
    color: "text-emerald-600",
    badge: "NATGRID Table",
    desc: "Multi-agency intelligence requisition table (Banks, Telecom, Immigration, VAHAN)",
  },
};

function NoticeTemplatesContent() {
  const { currentUser } = useAuth();
  const searchParams = useSearchParams();
  const complaintIdParam = searchParams.get("complaintId");
  const templateParam = searchParams.get("template") as string | null;

  const CUSTOM_TEMPLATES_STORAGE_KEY = "cms_enquiry_custom_templates";
  const [complaint, setComplaint] = useState<ComplaintItem | null>(null);
  const [customTemplates, setCustomTemplates] = useState<Record<string, CustomTemplate>>({});
  const [templateDropdownOpen, setTemplateDropdownOpen] = useState(false);
  const templateDropdownRef = useRef<HTMLDivElement>(null);

  // Load custom templates from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(CUSTOM_TEMPLATES_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && typeof parsed === "object") {
            setCustomTemplates(parsed);
          }
        }
      } catch (err) {
        console.warn("Could not load custom templates from localStorage", err);
      }
    }
  }, []);

  // Built templates from SQLite / Prisma Builder
  const [builtTemplates, setBuiltTemplates] = useState<BuilderTemplateItem[]>([]);

  const fetchBuiltTemplates = useCallback(async () => {
    try {
      const list = await BuilderService.getTemplates();
      setBuiltTemplates(list);
    } catch (e) {
      console.error("Failed to load built templates:", e);
    }
  }, []);

  useEffect(() => {
    fetchBuiltTemplates();
  }, [fetchBuiltTemplates]);

  const handleDeleteBuiltTemplate = async (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!confirm(`Are you sure you want to delete built template "${name}" from database?`)) return;
    try {
      await BuilderService.deleteTemplate(id);
      await fetchBuiltTemplates();
    } catch (err) {
      console.error("Failed to delete built template:", err);
      alert("Could not delete template.");
    }
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (templateDropdownRef.current && !templateDropdownRef.current.contains(e.target as Node)) {
        setTemplateDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const initialTemplateKey: TemplateType =
    templateParam && (DEFAULT_SAMPLE_DATA[templateParam as PresetTemplateType] || customTemplates[templateParam])
      ? templateParam
      : "haryana_notice";

  const [activeTemplate, setActiveTemplate] = useState<string>(initialTemplateKey);
  const [voiceLang, setVoiceLang] = useState<"en-IN" | "hi-IN">("en-IN");
  const [formData, setFormData] = useState<NoticeFormData>(
    DEFAULT_SAMPLE_DATA[initialTemplateKey as PresetTemplateType] || DEFAULT_SAMPLE_DATA["haryana_notice"]
  );

  const [copied, setCopied] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [customClauses, setCustomClauses] = useState<DynamicDocumentSection[]>([]);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadSuccessMessage, setUploadSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Layout & Formatting Controls (matching Drafts)
  const [borderStyle, setBorderStyle] = useState<"solid" | "double" | "light" | "none">("solid");
  const [fontSize, setFontSize] = useState<"normal" | "compact" | "large">("normal");
  const [showHeader, setShowHeader] = useState(true);
  const [showSignatures, setShowSignatures] = useState(true);

  // Section Deletion & Toggle States for Haryana Notice
  const [showAppearanceDirectives, setShowAppearanceDirectives] = useState(true);
  const [showDocumentsRequired, setShowDocumentsRequired] = useState(true);
  const [showStatutoryProtection, setShowStatutoryProtection] = useState(true);

  // Dynamic Multi-row Target Device Table for CDR Requisition (हरियाणा पुलिस प्रारूप बाबत काल डिटेल)
  const [cdrTargetRows, setCdrTargetRows] = useState<Array<{ id: string; phone: string; periodFrom: string; periodTo: string; reason: string; operator?: string; period?: string; details?: string }>>([
    { id: "cdr_1", phone: "", periodFrom: "", periodTo: "", reason: "" },
    { id: "cdr_2", phone: "", periodFrom: "", periodTo: "", reason: "" },
    { id: "cdr_3", phone: "", periodFrom: "", periodTo: "", reason: "" },
    { id: "cdr_4", phone: "", periodFrom: "", periodTo: "", reason: "" },
    { id: "cdr_5", phone: "", periodFrom: "", periodTo: "", reason: "" },
    { id: "cdr_6", phone: "", periodFrom: "", periodTo: "", reason: "" },
    { id: "cdr_7", phone: "", periodFrom: "", periodTo: "", reason: "" },
  ]);
  const [showCdrCertificate, setShowCdrCertificate] = useState(true);

  // Section Deletion & Toggle States for Arrest Memo
  const [showGroundsOfArrest, setShowGroundsOfArrest] = useState(true);
  const [showJamaTalashi, setShowJamaTalashi] = useState(true);
  const [showPhysicalDesc, setShowPhysicalDesc] = useState(true);
  const [showFamilyIntimation, setShowFamilyIntimation] = useState(true);

  // Dynamic NATGRID Table Rows (Add / Delete / Edit)
  const [natgridRows, setNatgridRows] = useState<Array<{ id: string; label: string; value: string }>>([
    { id: "ng_1", label: "Incharge Unit / SHO Details", value: "Inspector Ramesh Kumar (Mob: 9812033441)" },
    { id: "ng_2", label: "Case Particulars & Sections", value: "FIR No. 184/2026, PS City, u/s 318(4), 316(2) BNS, 2023 & Sec 66D IT Act" },
    { id: "ng_3", label: "Brief Summary of Case", value: "Organized financial fraud cheating victims of ₹38,50,000/- through fake banking and shell entities." },
    { id: "ng_4", label: "Investigating Officer (IO)", value: "SI Surender Pal (Mob: 9812034567, PNO-23841)" },
    { id: "ng_5", label: "Reason for Querying NATGRID", value: "Financial Fraud / Organized Crime Syndicate / Heinous Crime / Inter-State Suspect Tracing" },
    { id: "ng_6", label: "Department / Database Queried", value: "FIU-IND (Banks), Bureau of Immigration, Telecom, PAN Database, VAHAN/SARATHI" },
    { id: "ng_7", label: "Information Required from NATGRID", value: "All linked bank accounts, travel history, active SIMs, vehicle registrations" },
    { id: "ng_8", label: "Available Suspect Details", value: "Full Name: Vikas Sharma, Father: Ramesh Chand, Address: Sector 7, Panipat, Aadhaar: 8492-3810-4921, PAN: ABCPS1234F" },
  ]);

  const [availableComplaints, setAvailableComplaints] = useState<ComplaintItem[]>([]);
  const [selectComplaintModalOpen, setSelectComplaintModalOpen] = useState(false);
  const [complaintSearchQuery, setComplaintSearchQuery] = useState("");
  const [previewModalOpen, setPreviewModalOpen] = useState(false);

  const [selectedPerson, setSelectedPerson] = useState<IdentifiedPerson | null>(null);

  const documentRef = useRef<HTMLDivElement>(null);

  // Handle Complaint selection from ComplaintAnalysisHeader
  const handleComplaintSelected = (comp: ComplaintItem | null, report: ComplaintAnalysisReport | null) => {
    if (!comp) {
      setComplaint(null);
      setSelectedPerson(null);
      return;
    }
    setComplaint(comp);

    const currentType = activeTemplate as PresetTemplateType;
    const sample = DEFAULT_SAMPLE_DATA[currentType] || DEFAULT_SAMPLE_DATA["haryana_notice"];

    setFormData((prev) => ({
      ...prev,
      dispatchNo: currentType === "haryana_notice" ? "" : `HP/${(comp.district || "AMB").substring(0, 3).toUpperCase()}/CT/${new Date().getFullYear()}/DOC-${comp.complaintNumber.split("-").pop() || "01"}`,
      policeStation: comp.policeStation || currentUser.stationName || sample.policeStation,
      district: comp.district ? (comp.district.startsWith("जिला") ? comp.district : `जिला ${comp.district}।`) : sample.district,
      complaintNo: comp.complaintNumber,
      complainantName: comp.complainantName,
      complainantAddress: comp.complainantAddress || "",
      incidentDate: comp.incidentDate || (comp as any).dateReported || sample.incidentDate,
      allegationsBrief: comp.complaintDescription || (comp as any).description || sample.allegationsBrief,
      officerName: comp.assignedEoName || currentUser.name || sample.officerName,
      officerRank: comp.assignedEoRank || currentUser.rankDisplay || sample.officerRank,
      officerPno: comp.assignedEoPno || currentUser.pno || sample.officerPno,
      officerPhone: (currentUser as any).phone || sample.officerPhone,
    }));
  };

  // Handle Person selection from ComplaintAnalysisHeader
  const handlePersonSelected = (person: IdentifiedPerson | null) => {
    setSelectedPerson(person);
    if (!person) {
      setFormData((prev) => ({
        ...prev,
        noticeeName: "",
        noticeeFather: "",
        noticeeAge: "",
        noticeeAddress: "",
        noticeePhone: "",
        noticeeRole: "",
      }));
      return;
    }

    let roleDisplay = "नोटिस प्राप्तकर्ता";
    if (person.role === "Complainant") roleDisplay = "शिकायतकर्ता / Complainant";
    else if (person.role === "Respondent / Accused") roleDisplay = "प्रतिवादी / आरोपी / Accused";
    else if (person.role === "Witness") roleDisplay = "गवाह / साक्षी / Witness";
    else if (person.role) roleDisplay = person.role;

    setFormData((prev) => ({
      ...prev,
      noticeeName: person.name,
      noticeeFather: person.fatherOrSpouse || "",
      noticeeAge: person.age !== undefined && person.age !== null ? String(person.age) : (prev.noticeeAge || ""),
      noticeeAddress: person.address || "",
      noticeePhone: person.phone || "",
      noticeeRole: roleDisplay,
    }));
  };

  // Load all complaints for picker
  useEffect(() => {
    async function fetchComplaints() {
      try {
        const all = await ComplaintService.getComplaints();
        setAvailableComplaints(all || []);
      } catch (err) {
        console.error("Error loading complaints for template picker:", err);
      }
    }
    fetchComplaints();
  }, []);

  // Load complaint if complaintId is present
  useEffect(() => {
    if (!complaintIdParam) return;
    async function loadComplaint() {
      try {
        const found = await ComplaintService.getComplaintById(complaintIdParam!);
        if (found) {
          setComplaint(found);
          const currentType = (templateParam && DEFAULT_SAMPLE_DATA[templateParam as PresetTemplateType] ? templateParam : activeTemplate) as PresetTemplateType;
          const sample = DEFAULT_SAMPLE_DATA[currentType] || DEFAULT_SAMPLE_DATA["haryana_notice"];
          const primaryAccused = found.accusedList?.[0] || {};

          let noticeeName = sample.noticeeName;
          let noticeeFather = sample.noticeeFather;
          let noticeeAddress = sample.noticeeAddress;
          let noticeePhone = sample.noticeePhone;
          let noticeeRole = sample.noticeeRole;

          if (currentType === "haryana_notice") {
            noticeeName = primaryAccused.name || (found as any).accusedName || sample.noticeeName;
            noticeeFather = primaryAccused.fatherName || (found as any).accusedFather || sample.noticeeFather;
            noticeeAddress = primaryAccused.address || (found as any).accusedAddress || sample.noticeeAddress;
            noticeePhone = primaryAccused.phone || (found as any).accusedPhone || sample.noticeePhone;
            noticeeRole = "नोटिस प्राप्तकर्ता";
          } else if (currentType === "arrest_memo" || currentType === "cdr_requisition" || currentType === "natgrid_proforma") {
            noticeeName = primaryAccused.name || (found as any).accusedName || sample.noticeeName;
            noticeeFather = primaryAccused.fatherName || (found as any).accusedFather || sample.noticeeFather;
            noticeeAddress = primaryAccused.address || (found as any).accusedAddress || sample.noticeeAddress;
            noticeePhone = primaryAccused.phone || (found as any).accusedPhone || sample.noticeePhone;
            noticeeRole = "Accused / Suspect";
          }

          setFormData({
            dispatchNo: currentType === "haryana_notice" ? "" : `HP/${(found.district || "AMB").substring(0, 3).toUpperCase()}/CT/${new Date().getFullYear()}/DOC-${found.complaintNumber.split("-").pop() || "01"}`,
            policeStation: found.policeStation || currentUser.stationName || sample.policeStation,
            district: found.district ? (found.district.startsWith("जिला") ? found.district : `जिला ${found.district}।`) : sample.district,
            issueDate: new Date().toLocaleDateString("hi-IN"),

            noticeeName,
            noticeeFather,
            noticeeAge: sample.noticeeAge,
            noticeeAddress,
            noticeePhone,
            noticeeRole,

            complaintNo: found.complaintNumber,
            complainantName: found.complainantName,
            complainantAddress: found.complainantAddress || "",
            incidentDate: found.incidentDate || (found as any).dateReported || sample.incidentDate,
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

            mhcName: sample.mhcName || "HC Devinder Kumar",
            mhcRank: sample.mhcRank || "Head Constable (MHC)",
            mhcBeltNumber: sample.mhcBeltNumber || "889/AMB",
            mhcPhone: sample.mhcPhone || "9813098765",

            shoName: sample.shoName,
            supervisoryOfficerName: sample.supervisoryOfficerName,
            certificateText: sample.certificateText,
            accusedGender: sample.accusedGender,
            accusedAadhaar: sample.accusedAadhaar,
            accusedPan: sample.accusedPan,
            jamaTalashiArticles: sample.jamaTalashiArticles,
            familyInformedDetails: sample.familyInformedDetails,
            natgridReason: sample.natgridReason,
            natgridDepartment: sample.natgridDepartment,
            natgridInfoRequired: sample.natgridInfoRequired,

            headerDept: sample.headerDept,
            headerGovt: sample.headerGovt,
            docTitle: sample.docTitle,
            docSubTitle: sample.docSubTitle,
            statutoryClarification: sample.statutoryClarification,
            toAuthority: sample.toAuthority,
            recipientDesignation: sample.recipientDesignation,
            groundsBrief: sample.groundsBrief,
          });
        }
      } catch (err) {
        console.error("Error loading complaint for templates:", err);
      }
    }
    loadComplaint();
  }, [complaintIdParam, templateParam]);

  const handleTemplateSwitch = (tmplKey: string) => {
    setActiveTemplate(tmplKey);
    if (customTemplates[tmplKey]) {
      setFormData(customTemplates[tmplKey].formData);
      setCustomClauses(customTemplates[tmplKey].clauses);
      return;
    }
    const sample = DEFAULT_SAMPLE_DATA[tmplKey as PresetTemplateType];
    if (!sample) return;

    if (complaint) {
      const primaryAccused = complaint.accusedList?.[0] || {};
      let noticeeName = sample.noticeeName;
      let noticeeFather = sample.noticeeFather;
      let noticeeAddress = sample.noticeeAddress;
      let noticeePhone = sample.noticeePhone;
      let noticeeRole = sample.noticeeRole;

      if (tmplKey === "haryana_notice") {
        noticeeName = primaryAccused.name || (complaint as any).accusedName || sample.noticeeName;
        noticeeFather = primaryAccused.fatherName || (complaint as any).accusedFather || sample.noticeeFather;
        noticeeAddress = primaryAccused.address || (complaint as any).accusedAddress || sample.noticeeAddress;
        noticeePhone = primaryAccused.phone || (complaint as any).accusedPhone || sample.noticeePhone;
        noticeeRole = "नोटिस प्राप्तकर्ता";
      } else {
        noticeeName = primaryAccused.name || (complaint as any).accusedName || sample.noticeeName;
        noticeeFather = primaryAccused.fatherName || (complaint as any).accusedFather || sample.noticeeFather;
        noticeeAddress = primaryAccused.address || (complaint as any).accusedAddress || sample.noticeeAddress;
        noticeePhone = primaryAccused.phone || (complaint as any).accusedPhone || sample.noticeePhone;
        noticeeRole = "Accused / Suspect";
      }

      setFormData((prev) => ({
        ...prev,
        ...sample,
        noticeeName,
        noticeeFather,
        noticeeAddress,
        noticeePhone,
        noticeeRole,
        complaintNo: complaint.complaintNumber,
        complainantName: complaint.complainantName,
        complainantAddress: complaint.complainantAddress || sample.complainantAddress,
        incidentDate: complaint.incidentDate || (complaint as any).dateReported || sample.incidentDate,
        policeStation: complaint.policeStation || currentUser.stationName || sample.policeStation,
        district: complaint.district ? (complaint.district.startsWith("जिला") ? complaint.district : `जिला ${complaint.district}।`) : sample.district,
        allegationsBrief: complaint.complaintDescription || sample.allegationsBrief,
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

  const handleFieldChange = (field: keyof NoticeFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleResetSample = () => {
    if (!confirm("Are you sure you want to discard your edits and reset this template? All changes will revert to original defaults.")) return;
    setShowAppearanceDirectives(true);
    setShowDocumentsRequired(true);
    setShowStatutoryProtection(true);
    setShowCdrCertificate(true);
    setShowGroundsOfArrest(true);
    setShowJamaTalashi(true);
    setShowPhysicalDesc(true);
    setShowFamilyIntimation(true);
    setShowHeader(true);
    setShowSignatures(true);
    setBorderStyle("solid");
    setFontSize("normal");

    if (customTemplates[activeTemplate]) {
      setFormData(customTemplates[activeTemplate].formData);
      setCustomClauses(customTemplates[activeTemplate].clauses);
      return;
    }
    const sample = DEFAULT_SAMPLE_DATA[activeTemplate as PresetTemplateType];
    if (sample) setFormData(sample);
    setCustomClauses([]);
    setCdrTargetRows([
      { id: "cdr_1", phone: "", periodFrom: "", periodTo: "", reason: "" },
      { id: "cdr_2", phone: "", periodFrom: "", periodTo: "", reason: "" },
      { id: "cdr_3", phone: "", periodFrom: "", periodTo: "", reason: "" },
      { id: "cdr_4", phone: "", periodFrom: "", periodTo: "", reason: "" },
      { id: "cdr_5", phone: "", periodFrom: "", periodTo: "", reason: "" },
      { id: "cdr_6", phone: "", periodFrom: "", periodTo: "", reason: "" },
      { id: "cdr_7", phone: "", periodFrom: "", periodTo: "", reason: "" },
    ]);
    setNatgridRows([
      { id: "ng_1", label: "Incharge Unit / SHO Details", value: "Inspector Ramesh Kumar (Mob: 9812033441)" },
      { id: "ng_2", label: "Case Particulars & Sections", value: "FIR No. 184/2026, PS City, u/s 318(4), 316(2) BNS, 2023 & Sec 66D IT Act" },
      { id: "ng_3", label: "Brief Summary of Case", value: "Organized financial fraud cheating victims of ₹38,50,000/- through fake banking and shell entities." },
      { id: "ng_4", label: "Investigating Officer (IO)", value: "SI Surender Pal (Mob: 9812034567, PNO-23841)" },
      { id: "ng_5", label: "Reason for Querying NATGRID", value: "Financial Fraud / Organized Crime Syndicate / Heinous Crime / Inter-State Suspect Tracing" },
      { id: "ng_6", label: "Department / Database Queried", value: "FIU-IND (Banks), Bureau of Immigration, Telecom, PAN Database, VAHAN/SARATHI" },
      { id: "ng_7", label: "Information Required from NATGRID", value: "All linked bank accounts, travel history, active SIMs, vehicle registrations" },
      { id: "ng_8", label: "Available Suspect Details", value: "Full Name: Vikas Sharma, Father: Ramesh Chand, Address: Sector 7, Panipat, Aadhaar: 8492-3810-4921, PAN: ABCPS1234F" },
    ]);
  };

  const handleAddCdrRow = () => {
    const newRow = {
      id: `cdr_${Date.now()}`,
      phone: "",
      periodFrom: "",
      periodTo: "",
      reason: "",
    };
    setCdrTargetRows((prev) => [...prev, newRow]);
  };

  const handleDeleteCdrRow = (id: string) => {
    setCdrTargetRows((prev) => prev.filter((r) => r.id !== id));
  };

  const handleUpdateCdrRow = (id: string, field: "phone" | "periodFrom" | "periodTo" | "reason" | "operator" | "period" | "details", val: string) => {
    setCdrTargetRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: val } : r))
    );
  };

  const handleAddNatgridRow = () => {
    const newRow = {
      id: `ng_${Date.now()}`,
      label: `Field ${natgridRows.length + 1}`,
      value: "Enter details required from database",
    };
    setNatgridRows((prev) => [...prev, newRow]);
  };

  const handleDeleteNatgridRow = (id: string) => {
    setNatgridRows((prev) => prev.filter((r) => r.id !== id));
  };

  const handleUpdateNatgridRow = (id: string, field: "label" | "value", val: string) => {
    setNatgridRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: val } : r))
    );
  };

  const handleMoveNatgridRow = (index: number, direction: "up" | "down") => {
    setNatgridRows((prev) => {
      const next = [...prev];
      const targetIdx = direction === "up" ? index - 1 : index + 1;
      if (targetIdx < 0 || targetIdx >= next.length) return prev;
      const temp = next[index];
      next[index] = next[targetIdx];
      next[targetIdx] = temp;
      return next;
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

  const handleAddClause = (preset?: { title: string; content?: string }) => {
    const newClause: DynamicDocumentSection = {
      id: `clause_${Date.now()}`,
      title: preset?.title || `Additional Clause ${customClauses.length + 1}`,
      content: preset?.content || "",
      variant: "standard",
    };
    setCustomClauses((prev) => [...prev, newClause]);
  };

  const handleUpdateClauseTitle = (id: string, newTitle: string) => {
    setCustomClauses((prev) => prev.map((c) => (c.id === id ? { ...c, title: newTitle } : c)));
  };

  const handleUpdateClauseContent = (id: string, newContent: string) => {
    setCustomClauses((prev) => prev.map((c) => (c.id === id ? { ...c, content: newContent } : c)));
  };

  const handleDeleteClause = (id: string) => {
    setCustomClauses((prev) => prev.filter((c) => c.id !== id));
  };

  const handleMoveClause = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === customClauses.length - 1) return;
    const target = direction === "up" ? index - 1 : index + 1;
    const updated = [...customClauses];
    const temp = updated[index];
    updated[index] = updated[target];
    updated[target] = temp;
    setCustomClauses(updated);
  };

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
        fd.append("targetType", "notice");

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

      // 2. Client-side universal parser fallback (DOCX, PDF streams, TXT, Kruti-Dev conversion)
      if (!pData || (!pData.rows && !pData.clauses)) {
        const parsedDoc = await parseUploadedDocument(file);
        pData = {
          title: parsedDoc.title,
          headerLeft: parsedDoc.headerLeft,
          headerRight: parsedDoc.headerRight,
          subHeaderLeft: parsedDoc.subHeaderLeft,
          subTitle: parsedDoc.subTitle,
          dispatchNo: parsedDoc.dispatchNo,
          reportDate: parsedDoc.date,
          rows: parsedDoc.rows,
          clauses: parsedDoc.clauses,
          officerName: parsedDoc.officerName,
          officerRank: parsedDoc.officerRank,
          officerLocation: parsedDoc.officerLocation,
        };
      }

      if (pData) {
        const customId = `custom_${Date.now()}`;
        const docTitle = pData.title || file.name.replace(/\.[^/.]+$/, "").toUpperCase();

        // Extract clauses word-to-word
        const rawClauses = Array.isArray(pData.clauses) && pData.clauses.length > 0
          ? pData.clauses
          : Array.isArray(pData.rows) && pData.rows.length > 0
          ? pData.rows.map((r: any, idx: number) => ({
              id: r.id || `clause_${idx + 1}`,
              title: r.label || `Clause ${idx + 1}`,
              content: Array.isArray(r.cells) ? r.cells.join("\n") : String(r.cells || ""),
            }))
          : [
              {
                id: "clause_1",
                title: "Document Particulars & Directives",
                content: pData.subTitle || "Document clauses ready for editing and review.",
              },
            ];

        const newClauses: DynamicDocumentSection[] = rawClauses.map((c: any, idx: number) => ({
          id: c.id || `clause_${idx + 1}`,
          title: c.title || `Clause ${idx + 1}`,
          content: c.content || "",
          variant: "standard",
        }));

        const newCustomFormData: NoticeFormData = {
          headerDept: pData.headerLeft || "HARYANA POLICE",
          headerGovt: pData.headerRight || "GOVERNMENT OF HARYANA",
          docTitle: docTitle,
          docSubTitle: pData.subTitle || "Official Statutory Notice / Requisition Proforma",
          dispatchNo: pData.dispatchNo || pData.title || `HP/DOC/${new Date().getFullYear()}/PROFORMA`,
          policeStation: pData.headerLeft || currentUser.stationName || "Police Station City Thanesar",
          district: pData.headerRight || (currentUser.district ? `${currentUser.district}, Haryana` : "Haryana Police"),
          issueDate: pData.reportDate || new Date().toISOString().split("T")[0],

          noticeeName: complaint?.complainantName || "Person Concerned / Entity",
          noticeeFather: complaint?.complainantFatherSpouse || "",
          noticeeAge: "Adult",
          noticeeAddress: complaint?.complainantAddress || "Haryana",
          noticeePhone: complaint?.complainantMobile || "",
          noticeeRole: "Noticee / Recipient",

          complaintNo: complaint?.complaintNumber || "COMPLAINT-REF-01",
          complainantName: complaint?.complainantName || "State / Citizen",
          incidentDate: new Date().toISOString().split("T")[0],
          sectionsOfLaw: "Statutory Police Proforma / BNSS",
          allegationsBrief: pData.subTitle || "Document proforma processed from uploaded file.",

          appearanceDate: new Date().toISOString().split("T")[0],
          appearanceTime: "11:00 AM",
          appearancePlace: pData.headerLeft || "Office of Enquiry Officer",
          documentsRequired: "Relevant documents and records",

          officerName: pData.officerName || currentUser.name || "Enquiry Officer",
          officerRank: pData.officerRank || currentUser.rankDisplay || "Sub-Inspector",
          officerPno: currentUser.pno || "PNO-23841",
          officerPhone: (currentUser as any).phone || "9812000000",

          mhcName: "HC Devinder Kumar",
          mhcRank: "Head Constable (MHC)",
          mhcBeltNumber: "889/HP",
          mhcPhone: "9813098765",
        };

        const newCustomTmpl: CustomTemplate = {
          id: customId,
          name: docTitle.length > 32 ? docTitle.substring(0, 30) + "..." : docTitle,
          badge: `Uploaded (${file.name.split(".").pop()?.toUpperCase() || "DOC"})`,
          icon: FileCheck2,
          formData: newCustomFormData,
          clauses: newClauses,
        };

        setCustomTemplates((prev) => {
          const updated = {
            ...prev,
            [customId]: newCustomTmpl,
          };
          if (typeof window !== "undefined") {
            try {
              localStorage.setItem(CUSTOM_TEMPLATES_STORAGE_KEY, JSON.stringify(updated));
            } catch (storageErr) {
              console.warn("Could not save custom template to localStorage", storageErr);
            }
          }
          return updated;
        });

        setActiveTemplate(customId);
        setFormData(newCustomFormData);
        setCustomClauses(newClauses);

        setUploadSuccessMessage(
          `Document "${file.name}" successfully parsed! Added as brand new editable template "${newCustomTmpl.name}". Words, language & formatting mirrored word-to-word.`
        );
        setTimeout(() => setUploadSuccessMessage(null), 8000);
      }
    } catch (err: any) {
      console.error("Template upload error:", err);
      alert(`Error processing document: ${err.message || "Please try again"}`);
    } finally {
      setUploadLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteCustomTemplate = (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    const tmplName = customTemplates[id]?.name || "this template";
    if (!confirm(`Are you sure you want to delete "${tmplName}" from dropdown?`)) return;
    setCustomTemplates((prev) => {
      const copy = { ...prev };
      delete copy[id];
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(CUSTOM_TEMPLATES_STORAGE_KEY, JSON.stringify(copy));
        } catch (storageErr) {
          console.warn("Could not update localStorage", storageErr);
        }
      }
      return copy;
    });
    if (activeTemplate === id) {
      setActiveTemplate("haryana_notice");
      setFormData(DEFAULT_SAMPLE_DATA["haryana_notice"]);
      setCustomClauses([]);
    }
  };

  const getEffectiveFormData = () => ({
    ...formData,
    borderStyle,
    fontSize,
    showHeader,
    showSignatures,
    showAppearanceDirectives,
    showDocumentsRequired,
    showStatutoryProtection,
    showCdrCertificate,
    showGroundsOfArrest,
    showJamaTalashi,
    showPhysicalDesc,
    showFamilyIntimation,
    cdrRows: cdrTargetRows,
    arrestWitnesses: formData.arrestWitnesses || DEFAULT_SAMPLE_DATA.arrest_memo.arrestWitnesses,
    jamaTalashiItems: formData.jamaTalashiItems || DEFAULT_SAMPLE_DATA.arrest_memo.jamaTalashiItems,
  });

  // Arrest Memo Point 8 Witnesses Row Handlers
  const handleAddWitnessRow = () => {
    const current = formData.arrestWitnesses && formData.arrestWitnesses.length > 0
      ? formData.arrestWitnesses
      : (DEFAULT_SAMPLE_DATA.arrest_memo.arrestWitnesses || []);
    const updated = [
      ...current,
      { id: `wit_${Date.now()}`, srNo: String(current.length + 1), name: "", address: "", signature: "" },
    ];
    handleFieldChange("arrestWitnesses", updated);
  };

  const handleDeleteWitnessRow = (index: number) => {
    const current = formData.arrestWitnesses && formData.arrestWitnesses.length > 0
      ? formData.arrestWitnesses
      : (DEFAULT_SAMPLE_DATA.arrest_memo.arrestWitnesses || []);
    if (current.length <= 1) {
      alert("कम से कम एक गवाह आवश्यक है।");
      return;
    }
    const updated = current.filter((_, i) => i !== index).map((w, idx) => ({ ...w, srNo: String(idx + 1) }));
    handleFieldChange("arrestWitnesses", updated);
  };

  const handleUpdateWitnessRow = (index: number, key: string, value: string) => {
    const current = [...(formData.arrestWitnesses && formData.arrestWitnesses.length > 0
      ? formData.arrestWitnesses
      : (DEFAULT_SAMPLE_DATA.arrest_memo.arrestWitnesses || []))];
    if (current[index]) {
      current[index] = { ...current[index], [key]: value };
      handleFieldChange("arrestWitnesses", current);
    }
  };

  // Arrest Memo Point 12 Jama Talashi Items Row Handlers
  const handleAddJtRow = () => {
    const current = formData.jamaTalashiItems && formData.jamaTalashiItems.length > 0
      ? formData.jamaTalashiItems
      : (DEFAULT_SAMPLE_DATA.arrest_memo.jamaTalashiItems || []);
    const updated = [
      ...current,
      { id: `jt_${Date.now()}`, srNo: `${current.length + 1}.`, description: "", quantity: "" },
    ];
    handleFieldChange("jamaTalashiItems", updated);
  };

  const handleDeleteJtRow = (index: number) => {
    const current = formData.jamaTalashiItems && formData.jamaTalashiItems.length > 0
      ? formData.jamaTalashiItems
      : (DEFAULT_SAMPLE_DATA.arrest_memo.jamaTalashiItems || []);
    if (current.length <= 1) {
      alert("कम से कम एक पंक्ति आवश्यक है।");
      return;
    }
    const updated = current.filter((_, i) => i !== index).map((item, idx) => ({ ...item, srNo: `${idx + 1}.` }));
    handleFieldChange("jamaTalashiItems", updated);
  };

  const handleUpdateJtRow = (index: number, key: string, value: string) => {
    const current = [...(formData.jamaTalashiItems && formData.jamaTalashiItems.length > 0
      ? formData.jamaTalashiItems
      : (DEFAULT_SAMPLE_DATA.arrest_memo.jamaTalashiItems || []))];
    if (current[index]) {
      current[index] = { ...current[index], [key]: value };
      handleFieldChange("jamaTalashiItems", current);
    }
  };

  const handleDownloadNotice = () => {
    const effectiveData = getEffectiveFormData();
    const html = generateNoticeDocumentHtml(effectiveData as any, activeTemplate, customClauses);
    const filename = `${(formData.dispatchNo || "POLICE_NOTICE").replace(/[\/\\?%*:|"<> ]/g, "_")}.html`;
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

  const handleSaveToComplaint = async (targetComplaint?: ComplaintItem) => {
    const chosenComplaint = targetComplaint || complaint;
    if (!chosenComplaint?.id) {
      setSelectComplaintModalOpen(true);
      return;
    }
    setSaveLoading(true);
    try {
      const label =
        customTemplates[activeTemplate]?.name ||
        TEMPLATE_CONFIG[activeTemplate as PresetTemplateType]?.label ||
        "Police Notice";
      const docTitle = `${label} - ${formData.noticeeName || formData.complaintNo}`;
      const effectiveData = getEffectiveFormData();
      const docHtml = generateNoticeDocumentHtml(effectiveData as any, activeTemplate, customClauses);

      await ComplaintService.addDocument(chosenComplaint.id, {
        fileName: `${docTitle}.html`,
        fileCategory: "NOTICE",
        fileSize: `${Math.round(docHtml.length / 1024) || 3} KB`,
        dataUrl: `data:text/html;charset=utf-8,${encodeURIComponent(docHtml)}`,
        contentHtml: docHtml,
        uploadedBy: currentUser.name || "Enquiry Officer",
      });

      if (!complaint) {
        setComplaint(chosenComplaint);
      }
      setSelectComplaintModalOpen(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      console.error("Failed to save notice to complaint:", err);
      alert("Error saving notice. Please try again.");
    } finally {
      setSaveLoading(false);
    }
  };

  const isCustomUploaded = Boolean(customTemplates[activeTemplate]);

  return (
    <div className="space-y-5 animate-in fade-in-50 pb-20">
      {/* Top Workspace Navigation Tabs */}
      <EnquiryWorkspaceNav complaintId={complaint?.id} />

      {/* 1. REQUIRED COMPLAINT & PERSON SELECTION ANALYSIS HEADER */}
      <ComplaintAnalysisHeader
        initialComplaintId={complaintIdParam}
        showPersonDropdown={true}
        onComplaintSelect={handleComplaintSelected}
        onPersonSelect={handlePersonSelected}
        selectedComplaintId={complaint?.id}
        selectedPersonId={selectedPerson?.id}
      />

      {!complaint && (
        <div className="bg-white border-2 border-dashed border-slate-300 rounded-2xl p-10 text-center space-y-3">
          <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto text-purple-700">
            <ScrollText className="w-7 h-7" />
          </div>
          <h2 className="text-base font-bold text-slate-800">
            Select a Complaint to Generate Legal Notice
          </h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Choose any complaint from your Complaint Register in the required dropdown above. The system will analyze all facts from the Overview and Documents subtabs, identify all involved persons (complainant, accused, witnesses), and populate the notice parameters without inventing facts.
          </p>
        </div>
      )}

      {complaint && (
        <div className="space-y-4">
          {/* ================= 1. WORKSPACE TOP BAR (NO-PRINT) ================= */}
          <div className="no-print space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex flex-wrap items-center gap-2.5">
            {complaint && (
              <span className="text-[11px] font-bold font-mono text-purple-700 bg-purple-50 px-2.5 py-1 rounded border border-purple-200">
                Complaint: {complaint.complaintNumber}
              </span>
            )}

            {/* Template Selector Custom Dropdown */}
            <div className="relative flex items-center gap-1.5" ref={templateDropdownRef}>
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1 whitespace-nowrap">
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                <span>Template:</span>
              </label>

              <button
                type="button"
                onClick={() => setTemplateDropdownOpen((v) => !v)}
                className="flex items-center justify-between gap-2 text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[220px] max-w-[340px] shadow-2xs text-left cursor-pointer"
                title="Select Police Template"
              >
                <span className="truncate">
                  {customTemplates[activeTemplate]
                    ? `📁 ${customTemplates[activeTemplate].name}`
                    : TEMPLATE_CONFIG[activeTemplate as PresetTemplateType]?.label || "Select Template"}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${templateDropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {/* Quick delete cross if current active item is uploaded */}
              {customTemplates[activeTemplate] && (
                <button
                  type="button"
                  onClick={(e) => handleDeleteCustomTemplate(activeTemplate, e)}
                  className="p-1 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded-md border border-slate-200 transition-colors shadow-2xs cursor-pointer"
                  title="Delete currently selected uploaded template"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

              {templateDropdownOpen && (
                <div className="absolute left-0 top-full mt-1.5 w-84 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1.5 overflow-hidden animate-in fade-in-50 zoom-in-95">
                  {/* Preset Standard Templates */}
                  <div className="px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-50">
                    Standard Notice &amp; Report Templates
                  </div>
                  <div className="max-h-52 overflow-y-auto divide-y divide-slate-100">
                    {(Object.keys(TEMPLATE_CONFIG) as PresetTemplateType[]).map((tmplKey) => {
                      const isSelected = activeTemplate === tmplKey;
                      const IconComp = TEMPLATE_CONFIG[tmplKey].icon;
                      return (
                        <button
                          key={tmplKey}
                          type="button"
                          onClick={() => {
                            handleTemplateSwitch(tmplKey);
                            setTemplateDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left transition-colors ${
                            isSelected
                              ? "bg-blue-50 text-blue-900 font-bold"
                              : "text-slate-700 hover:bg-slate-50 font-medium"
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate pr-2">
                            <IconComp className={`w-3.5 h-3.5 shrink-0 ${isSelected ? "text-blue-600" : "text-slate-400"}`} />
                            <span className="truncate">{TEMPLATE_CONFIG[tmplKey].label}</span>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>

                  {/* Uploaded Documents Section */}
                  <div className="border-t border-slate-200 mt-1 pt-1.5">
                    <div className="px-3 py-1 flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-amber-700 bg-amber-50">
                      <span>📁 Uploaded Templates ({Object.keys(customTemplates).length})</span>
                    </div>

                    {Object.keys(customTemplates).length === 0 ? (
                      <div className="px-3 py-2 text-[11px] text-slate-400 italic">
                        No uploaded templates yet. Use &ldquo;Upload Document&rdquo; button.
                      </div>
                    ) : (
                      <div className="max-h-56 overflow-y-auto divide-y divide-slate-100">
                        {Object.keys(customTemplates).map((cKey) => {
                          const isSelected = activeTemplate === cKey;
                          const tmpl = customTemplates[cKey];
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
                                  handleTemplateSwitch(cKey);
                                  setTemplateDropdownOpen(false);
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
                                onClick={(e) => handleDeleteCustomTemplate(cKey, e)}
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

                  {/* Section 3: Built Templates (from Template & Draft Builder) */}
                  <div className="border-t border-slate-200 mt-1 pt-1.5">
                    <div className="px-3 py-1 flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-blue-700 bg-blue-50">
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-blue-600" />
                        <span>Built Templates ({builtTemplates.length})</span>
                      </span>
                      <Link
                        href={`/enquiry-workspace/builder${complaint ? `?complaintId=${complaint.id}` : ""}`}
                        className="text-[9px] font-bold text-blue-600 hover:text-blue-800 underline lowercase"
                        onClick={() => setTemplateDropdownOpen(false)}
                      >
                        + new
                      </Link>
                    </div>

                    {builtTemplates.length === 0 ? (
                      <div className="px-3 py-2 text-[11px] text-slate-400 italic flex items-center justify-between">
                        <span>No built templates yet.</span>
                        <Link
                          href={`/enquiry-workspace/builder${complaint ? `?complaintId=${complaint.id}` : ""}`}
                          className="text-[10px] text-blue-600 font-bold hover:underline"
                          onClick={() => setTemplateDropdownOpen(false)}
                        >
                          Build One
                        </Link>
                      </div>
                    ) : (
                      <div className="max-h-56 overflow-y-auto divide-y divide-slate-100">
                        {builtTemplates.map((bt) => (
                          <div
                            key={bt.id}
                            className="flex items-center justify-between px-2.5 py-1.5 transition-colors group hover:bg-blue-50/60 text-slate-700"
                          >
                            <Link
                              href={`/enquiry-workspace/builder?templateId=${bt.id}${complaint ? `&complaintId=${complaint.id}` : ""}`}
                              onClick={() => setTemplateDropdownOpen(false)}
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

            {/* Reset Template Button */}
            <button
              type="button"
              onClick={handleResetSample}
              className="px-2 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded text-xs font-semibold flex items-center gap-1 border border-transparent hover:border-slate-200 cursor-pointer"
              title="Reset this template"
            >
              <RotateCcw className="w-3 h-3 text-slate-500" />
              <span>Reset Template</span>
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

            {/* Always-visible Save to Complaint Button */}
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
                  <span>Saved to Docket!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{saveLoading ? "Saving..." : complaint ? "Save to Complaint" : "Save to Complaint..."}</span>
                </>
              )}
            </Button>

          </div>
        </div>

        {/* Upload Processing Alert */}
        {uploadLoading && (
          <div className="p-3 bg-purple-50 border border-purple-300 rounded-xl flex items-center gap-2.5 text-xs text-purple-900 animate-in fade-in-50">
            <Loader2 className="w-4 h-4 text-purple-600 animate-spin shrink-0" />
            <div>
              <span className="font-bold">Analyzing document &amp; extracting format... </span>
              <span className="text-purple-700">Converting sections and adding as a brand new custom proforma tab.</span>
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

        {/* Saved Alert */}
        {saveSuccess && complaint && (
          <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between text-xs text-emerald-900 animate-in fade-in-50">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              <span className="font-bold">
                Document saved to Complaint {complaint.complaintNumber} under &ldquo;Documents&rdquo; tab!
              </span>
            </div>
            <Link
              href={`/complaints/${complaint.id}`}
              className="text-xs font-bold text-emerald-800 underline hover:text-emerald-950"
            >
              View in Documents &rarr;
            </Link>
          </div>
        )}
      </div>

      {/* Template Customization Toolbar (matching Drafts) */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-bold text-slate-700 flex items-center gap-1">
            <Sliders className="w-3.5 h-3.5 text-blue-600" />
            Document Customization Toolbar:
          </span>

          {/* Border Style */}
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded px-2 py-1">
            <span className="text-[11px] text-slate-500 font-medium">Border Style:</span>
            <select
              value={borderStyle}
              onChange={(e) => setBorderStyle(e.target.value as any)}
              className="text-[11px] font-bold bg-transparent border-0 outline-none cursor-pointer text-slate-900"
            >
              <option value="solid">Solid Black (Official)</option>
              <option value="double">Double Border</option>
              <option value="light">Light Gray</option>
              <option value="none">No Border</option>
            </select>
          </div>

          {/* Font Size */}
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded px-2 py-1">
            <span className="text-[11px] text-slate-500 font-medium">Font:</span>
            <select
              value={fontSize}
              onChange={(e) => setFontSize(e.target.value as any)}
              className="text-[11px] font-bold bg-transparent border-0 outline-none cursor-pointer text-slate-900"
            >
              <option value="compact">Compact (Dense)</option>
              <option value="normal">Standard A4</option>
              <option value="large">Large / High-Legibility</option>
            </select>
          </div>

          {/* Toggle Header Seal */}
          <button
            type="button"
            onClick={() => setShowHeader(!showHeader)}
            className={`px-2.5 py-1 rounded border text-[11px] font-bold transition-all cursor-pointer ${
              showHeader
                ? "bg-blue-50 text-blue-800 border-blue-200"
                : "bg-white text-slate-500 border-slate-200"
            }`}
          >
            {showHeader ? "✓ Header Seal: Active" : "✕ Header Seal: Hidden"}
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
            {showSignatures ? "✓ Signatures & Seal: Active" : "✕ Signatures: Hidden"}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleAddClause()}
            className="text-xs bg-white hover:bg-slate-100 text-purple-700 font-bold border-purple-300 gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-purple-600" />
            <span>+ Add Custom Section</span>
          </Button>
        </div>
      </div>

      {/* ================= 2. IN-PLACE DOCUMENT EDITOR & PREVIEW ================= */}
      <div className="w-full max-w-5xl mx-auto space-y-4">
        <div
          ref={documentRef}
          className={`bg-white rounded-2xl p-6 sm:p-12 text-slate-900 font-sans transition-all space-y-6 ${
            borderStyle === "solid"
              ? "border-2 border-slate-900 shadow-md"
              : borderStyle === "double"
              ? "border-4 border-double border-slate-900 shadow-md"
              : borderStyle === "light"
              ? "border border-slate-300 shadow-xs"
              : "border-0 shadow-none"
          } ${
            fontSize === "compact"
              ? "text-[11.5px]"
              : fontSize === "large"
              ? "text-sm"
              : "text-xs"
          }`}
          style={{ minHeight: "1050px", lineHeight: "1.7" }}
        >
          {/* HEADER SEAL - FULLY EDITABLE */}
          {showHeader && activeTemplate !== "cdr_requisition" && activeTemplate !== "haryana_notice" && activeTemplate !== "natgrid_proforma" && (
            <div className="text-center pb-4 border-b-2 border-slate-900 space-y-1">
              <div className="flex items-center justify-center gap-2 mb-0.5">
                <Shield className="w-6 h-6 text-[#0b192c] shrink-0" />
                <input
                  type="text"
                  value={formData.headerDept || "HARYANA POLICE"}
                  onChange={(e) => handleFieldChange("headerDept", e.target.value)}
                  className="text-sm sm:text-base font-black tracking-widest uppercase text-[#0b192c] text-center bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent hover:border-slate-300 focus:border-blue-500 rounded px-2 py-0.5 outline-none"
                  placeholder="DEPARTMENT NAME"
                />
              </div>
              <div>
                <input
                  type="text"
                  value={formData.headerGovt || "GOVERNMENT OF HARYANA"}
                  onChange={(e) => handleFieldChange("headerGovt", e.target.value)}
                  className="text-xs font-bold tracking-wider uppercase text-slate-700 text-center bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent hover:border-slate-300 focus:border-blue-500 rounded px-2 py-0.5 outline-none w-full max-w-md"
                  placeholder="GOVERNMENT / RULE SPECIFICATION"
                />
              </div>
              <div className="flex items-center justify-center flex-wrap gap-1.5 pt-1">
                <input
                  type="text"
                  value={formData.policeStation}
                  onChange={(e) => handleFieldChange("policeStation", e.target.value)}
                  className="text-xs font-bold uppercase text-slate-800 tracking-wider text-center bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 hover:border-slate-300 focus:border-blue-500 rounded px-2 py-0.5 outline-none"
                  placeholder="POLICE STATION"
                />
                <span className="text-xs font-bold text-slate-700">, DISTRICT</span>
                <input
                  type="text"
                  value={formData.district}
                  onChange={(e) => handleFieldChange("district", e.target.value)}
                  className="text-xs font-bold uppercase text-slate-800 tracking-wider text-center bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 hover:border-slate-300 focus:border-blue-500 rounded px-2 py-0.5 outline-none"
                  placeholder="DISTRICT, STATE"
                />
              </div>
            </div>
          )}

          {/* ================= TEMPLATE 1: HARYANA POLICE APPEARANCE NOTICE (हरियाणा पुलिस सूचना-पत्र) ================= */}
          {activeTemplate === "haryana_notice" && (
            <div className="space-y-6 text-slate-950 font-sans text-sm">
              {/* 1. शीर्ष हेडिंग: हरियाणा पुलिस (केंद्रित, रेखांकित) */}
              <div className="text-center pt-2">
                <input
                  type="text"
                  value={formData.headerDept || "हरियाणा पुलिस"}
                  onChange={(e) => handleFieldChange("headerDept", e.target.value)}
                  className="font-black text-slate-950 underline underline-offset-8 text-xl sm:text-2xl text-center bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent hover:border-slate-300 focus:border-blue-500 rounded px-2 py-0.5 outline-none tracking-wider"
                  placeholder="हरियाणा पुलिस"
                />
              </div>

              {/* 2. थाना/यूनिट एवं जिला अम्बाला। पंक्ति */}
              <div className="flex items-baseline justify-between gap-4 font-bold text-base text-slate-950 pt-2">
                <div className="flex items-center gap-1.5 flex-1 max-w-md">
                  <span className="whitespace-nowrap">थाना/यूनिट</span>
                  <input
                    type="text"
                    value={formData.policeStation || ""}
                    onChange={(e) => handleFieldChange("policeStation", e.target.value)}
                    placeholder="............................................"
                    className="w-full font-bold text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border-b border-dotted border-slate-700 focus:border-blue-500 px-1 py-0.5 outline-none"
                  />
                </div>
                <div className="flex items-center justify-end gap-1 text-right">
                  <input
                    type="text"
                    value={formData.district ? (formData.district.startsWith("जिला") ? formData.district : `जिला ${formData.district}`) : "जिला अम्बाला।"}
                    onChange={(e) => handleFieldChange("district", e.target.value)}
                    placeholder="जिला अम्बाला।"
                    className="font-bold text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border-b border-dotted border-slate-700 focus:border-blue-500 px-1 py-0.5 outline-none text-right w-44"
                  />
                </div>
              </div>

              {/* 3. मुख्य शीर्षक: सूचना-पत्र (केंद्रित) */}
              <div className="text-center py-2">
                <input
                  type="text"
                  value={formData.docTitle || "सूचना-पत्र"}
                  onChange={(e) => handleFieldChange("docTitle", e.target.value)}
                  className="font-black text-slate-950 text-lg sm:text-xl text-center bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent hover:border-slate-300 focus:border-blue-500 rounded px-2 py-0.5 outline-none tracking-wide"
                  placeholder="सूचना-पत्र"
                />
              </div>

              {/* 4. क्रमांक एवं दिनांक पंक्ति */}
              <div className="flex items-center gap-8 font-medium text-slate-900 pb-2">
                <div className="flex items-center gap-1.5">
                  <span className="whitespace-nowrap">क्रमांक</span>
                  <input
                    type="text"
                    value={formData.dispatchNo || ""}
                    onChange={(e) => handleFieldChange("dispatchNo", e.target.value)}
                    placeholder=".................."
                    className="w-44 text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border-b border-dotted border-slate-700 focus:border-blue-500 px-1 py-0.5 outline-none font-semibold"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="whitespace-nowrap">दिनांक</span>
                  <input
                    type="text"
                    value={formData.issueDate || ""}
                    onChange={(e) => handleFieldChange("issueDate", e.target.value)}
                    placeholder="................."
                    className="w-36 text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border-b border-dotted border-slate-700 focus:border-blue-500 px-1 py-0.5 outline-none font-semibold"
                  />
                </div>
              </div>

              {/* 5. पैरा 1: परिवादी एवं शिकायत विवरण */}
              <div className="text-justify leading-loose text-[13.5px] sm:text-[14.5px] text-slate-900" style={{ textIndent: "40px" }}>
                <span>आपको इस नोटिस के माध्यम से सूचित किया जाता है कि परिवादी </span>
                <input
                  type="text"
                  value={formData.complainantName || ""}
                  onChange={(e) => handleFieldChange("complainantName", e.target.value)}
                  placeholder="..................."
                  className="font-bold text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border-b border-dotted border-slate-700 focus:border-blue-500 px-1 outline-none min-w-[140px] text-center inline-block"
                  style={{ textIndent: 0 }}
                />
                <span> वासी </span>
                <input
                  type="text"
                  value={formData.complainantAddress || ""}
                  onChange={(e) => handleFieldChange("complainantAddress", e.target.value)}
                  placeholder="...................................................."
                  className="font-bold text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border-b border-dotted border-slate-700 focus:border-blue-500 px-1 outline-none min-w-[260px] text-center inline-block"
                  style={{ textIndent: 0 }}
                />
                <span> से शिकायत संख्या </span>
                <input
                  type="text"
                  value={formData.complaintNo || ""}
                  onChange={(e) => handleFieldChange("complaintNo", e.target.value)}
                  placeholder="..................................."
                  className="font-bold text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border-b border-dotted border-slate-700 focus:border-blue-500 px-1 outline-none min-w-[160px] text-center inline-block"
                  style={{ textIndent: 0 }}
                />
                <span> दिनांक </span>
                <input
                  type="text"
                  value={formData.incidentDate || ""}
                  onChange={(e) => handleFieldChange("incidentDate", e.target.value)}
                  placeholder="............................."
                  className="font-bold text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border-b border-dotted border-slate-700 focus:border-blue-500 px-1 outline-none min-w-[130px] text-center inline-block"
                  style={{ textIndent: 0 }}
                />
                <span> को थाना/यूनिट </span>
                <input
                  type="text"
                  value={formData.policeStation || ""}
                  onChange={(e) => handleFieldChange("policeStation", e.target.value)}
                  placeholder="...................................................."
                  className="font-bold text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border-b border-dotted border-slate-700 focus:border-blue-500 px-1 outline-none min-w-[200px] text-center inline-block"
                  style={{ textIndent: 0 }}
                />
                <span> में प्राप्त हुई है। (छायाप्रति साथ संलग्न है)</span>
              </div>

              {/* 6. पैरा 2: उपस्थिति निर्देश */}
              <div className="text-justify leading-loose text-[13.5px] sm:text-[14.5px] text-slate-900 pt-2" style={{ textIndent: "40px" }}>
                <span>इसलिये आप </span>
                <input
                  type="text"
                  value={formData.noticeeName || ""}
                  onChange={(e) => handleFieldChange("noticeeName", e.target.value)}
                  placeholder="....................................................................................."
                  className="font-bold text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border-b border-dotted border-slate-700 focus:border-blue-500 px-1 outline-none min-w-[320px] text-center inline-block"
                  style={{ textIndent: 0 }}
                />
                <span> को निर्देश दिये जाते है कि आप दिनांक </span>
                <input
                  type="text"
                  value={formData.appearanceDate || ""}
                  onChange={(e) => handleFieldChange("appearanceDate", e.target.value)}
                  placeholder="............................."
                  className="font-bold text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border-b border-dotted border-slate-700 focus:border-blue-500 px-1 outline-none min-w-[130px] text-center inline-block"
                  style={{ textIndent: 0 }}
                />
                <span> को थाना/यूनिट </span>
                <input
                  type="text"
                  value={formData.appearancePlace || formData.policeStation || ""}
                  onChange={(e) => handleFieldChange("appearancePlace", e.target.value)}
                  placeholder="................................."
                  className="font-bold text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border-b border-dotted border-slate-700 focus:border-blue-500 px-1 outline-none min-w-[200px] text-center inline-block"
                  style={{ textIndent: 0 }}
                />
                <span> में समय </span>
                <input
                  type="text"
                  value={formData.appearanceTime || ""}
                  onChange={(e) => handleFieldChange("appearanceTime", e.target.value)}
                  placeholder="........................"
                  className="font-bold text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border-b border-dotted border-slate-700 focus:border-blue-500 px-1 outline-none min-w-[120px] text-center inline-block"
                  style={{ textIndent: 0 }}
                />
                <span> पर प्रारम्भिक जांच में सभी प्रासंगिक दस्तावेजो, साक्ष्यों और रिकार्ड सहित व्यक्तिगत तौर पर या अपने प्रतिनिधि के माध्यम से शामिल होवें।</span>
              </div>

              {/* 7. पैरा 3: वीडियो कॉन्फ्रेंसिंग का विकल्प */}
              <div className="text-justify leading-loose text-[13.5px] sm:text-[14.5px] text-slate-900 pt-2" style={{ textIndent: "40px" }}>
                <span>शिकायत की जांच के सम्बन्ध में यदि आप अपनी उपस्थिति को वीडियो कान्फ्रेंस के माध्यम से चाहते है तो इस थाना/यूनिट की ई.मेल आई.डी. </span>
                <input
                  type="text"
                  value={formData.stationEmail || formData.officerEmail || ""}
                  onChange={(e) => handleFieldChange("stationEmail", e.target.value)}
                  placeholder="..................................................................................................."
                  className="font-bold text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border-b border-dotted border-slate-700 focus:border-blue-500 px-1 outline-none min-w-[320px] text-center inline-block"
                  style={{ textIndent: 0 }}
                />
                <span> पर लिखित निवेदन दिनांक </span>
                <input
                  type="text"
                  value={formData.videoConferenceDeadline || formData.appearanceDate || ""}
                  onChange={(e) => handleFieldChange("videoConferenceDeadline", e.target.value)}
                  placeholder="............................."
                  className="font-bold text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border-b border-dotted border-slate-700 focus:border-blue-500 px-1 outline-none min-w-[130px] text-center inline-block"
                  style={{ textIndent: 0 }}
                />
                <span> से पहले भेजना सुनिश्चित करें।</span>
              </div>

              {/* 8. पैरा 4: वैधानिक स्पष्टीकरण (एफआईआर अंकित नहीं / गिरफ्तारी नहीं) */}
              <div className="text-justify leading-loose text-[13.5px] sm:text-[14.5px] text-slate-900 pt-2" style={{ textIndent: "40px" }}>
                <span>इस नोटिस के सम्बन्ध में आपको यह भी स्पष्ट किया जाता है कि यह नोटिस केवल शिकायत की जांच के सम्बन्ध में जारी किया गया है। अभी तक आपके विरुद्ध कोई भी प्रथम सूचना रिपोर्ट अंकित नहीं की गई है और शिकायत की जांच के दौरान आपको गिरफ्तार नहीं किया जायेगा।</span>
              </div>

              {/* 9. संलग्नक */}
              <div className="pt-4 font-bold text-base text-slate-950">
                <span>संलग्न :- &nbsp;&nbsp;शिकायत की छायाप्रति।</span>
              </div>

              {/* 10. हस्ताक्षर एवं मोहर भाग */}
              <div className="pt-8 flex justify-between items-start text-sm">
                <div className="w-5/12 pt-4">
                  <p className="font-bold text-base text-slate-950">थाना/यूनिट की मोहर</p>
                  <div className="mt-14 text-xs text-slate-400 italic">
                    [थाना/यूनिट की आधिकारिक मोहर का स्थान]
                  </div>
                </div>

                <div className="w-7/12 space-y-2 text-sm text-slate-950 font-medium pl-4">
                  <div className="flex items-center gap-1.5">
                    <span className="whitespace-nowrap font-bold">जांच अधिकारी के हस्ताक्षर</span>
                    <span className="text-slate-500">.................................</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="whitespace-nowrap font-bold">नाम व पद</span>
                    <input
                      type="text"
                      value={formData.officerName ? `${formData.officerName}${formData.officerRank ? `, ${formData.officerRank}` : ""}` : ""}
                      onChange={(e) => handleFieldChange("officerName", e.target.value)}
                      placeholder=".................................................."
                      className="w-full font-bold text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border-b border-dotted border-slate-700 focus:border-blue-500 px-1 outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="whitespace-nowrap font-bold">थाना/यूनिट</span>
                    <input
                      type="text"
                      value={formData.policeStation || ""}
                      onChange={(e) => handleFieldChange("policeStation", e.target.value)}
                      placeholder="................................................."
                      className="w-full font-bold text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border-b border-dotted border-slate-700 focus:border-blue-500 px-1 outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="whitespace-nowrap font-bold">मोबाईल नम्बर</span>
                    <input
                      type="text"
                      value={formData.officerPhone || ""}
                      onChange={(e) => handleFieldChange("officerPhone", e.target.value)}
                      placeholder="............................................."
                      className="w-full font-mono font-bold text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border-b border-dotted border-slate-700 focus:border-blue-500 px-1 outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="whitespace-nowrap font-bold">ई.मेल आई.डी.</span>
                    <input
                      type="text"
                      value={formData.officerEmail || formData.stationEmail || ""}
                      onChange={(e) => handleFieldChange("officerEmail", e.target.value)}
                      placeholder="................................................"
                      className="w-full font-mono font-bold text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border-b border-dotted border-slate-700 focus:border-blue-500 px-1 outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= TEMPLATE 2: CDR & DIGITAL EVIDENCE REQUISITION (हरियाणा पुलिस प्रारूप बाबत काल डिटेल) ================= */}
          {activeTemplate === "cdr_requisition" && (
            <div className="space-y-6 text-slate-950 font-sans text-sm">
              {/* 1. Top Header: Left (थाना शहर पानीपत), Center (प्रारुप बाबत काल डिटेल), Right (जिला पानीपत, नम्बर, दिनांक) */}
              <div className="flex items-start justify-between gap-4 pt-2">
                <div className="w-1/3">
                  <input
                    type="text"
                    value={formData.policeStation || "थाना शहर पानीपत"}
                    onChange={(e) => handleFieldChange("policeStation", e.target.value)}
                    className="font-bold text-slate-900 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent hover:border-slate-300 focus:border-blue-500 rounded px-1.5 py-0.5 outline-none text-base"
                    placeholder="थाना शहर पानीपत"
                  />
                </div>
                <div className="w-1/3 text-center">
                  <input
                    type="text"
                    value={formData.docTitle || "प्रारुप बाबत काल डिटेल"}
                    onChange={(e) => handleFieldChange("docTitle", e.target.value)}
                    className="font-black text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent hover:border-slate-300 focus:border-blue-500 rounded px-2 py-0.5 outline-none text-base sm:text-lg text-center"
                    placeholder="प्रारुप बाबत काल डिटेल"
                  />
                </div>
                <div className="w-1/3 text-right space-y-1">
                  <input
                    type="text"
                    value={formData.district ? (formData.district.startsWith("जिला") ? formData.district : `जिला ${formData.district}`) : "जिला पानीपत"}
                    onChange={(e) => handleFieldChange("district", e.target.value)}
                    className="font-bold text-slate-900 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent hover:border-slate-300 focus:border-blue-500 rounded px-1.5 py-0.5 outline-none text-base text-right w-full"
                    placeholder="जिला पानीपत"
                  />
                  <div className="flex items-center justify-end gap-1 text-sm font-semibold text-slate-800">
                    <span>नम्बर-</span>
                    <input
                      type="text"
                      value={formData.dispatchNo || ""}
                      onChange={(e) => handleFieldChange("dispatchNo", e.target.value)}
                      placeholder="............"
                      className="w-28 text-slate-900 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent hover:border-slate-300 focus:border-blue-500 rounded px-1 outline-none text-right"
                    />
                  </div>
                  <div className="flex items-center justify-end gap-1 text-sm font-semibold text-slate-800">
                    <span>दिनांक-</span>
                    <input
                      type="text"
                      value={formData.issueDate || ""}
                      onChange={(e) => handleFieldChange("issueDate", e.target.value)}
                      placeholder=".........."
                      className="w-28 text-slate-900 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent hover:border-slate-300 focus:border-blue-500 rounded px-1 outline-none text-right"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Case Details Row: अभियोग संख्या, दिनांक, धारा, थाना शहर पानीपत */}
              <div className="grid grid-cols-4 items-center gap-3 py-2 border-y border-slate-300 text-sm font-bold text-slate-900">
                <div className="flex items-center gap-1.5">
                  <span className="whitespace-nowrap">अभियोग संख्या</span>
                  <input
                    type="text"
                    value={formData.complaintNo || ""}
                    onChange={(e) => handleFieldChange("complaintNo", e.target.value)}
                    placeholder="128/2026"
                    className="w-full font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="whitespace-nowrap">दिनांक</span>
                  <input
                    type="text"
                    value={formData.incidentDate || ""}
                    onChange={(e) => handleFieldChange("incidentDate", e.target.value)}
                    placeholder="18-09-2026"
                    className="w-full font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="whitespace-nowrap">धारा</span>
                  <input
                    type="text"
                    value={formData.sectionsOfLaw || ""}
                    onChange={(e) => handleFieldChange("sectionsOfLaw", e.target.value)}
                    placeholder="318(4), 316(2) BNS"
                    className="w-full font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={formData.policeStation || "थाना शहर पानीपत"}
                    onChange={(e) => handleFieldChange("policeStation", e.target.value)}
                    placeholder="थाना शहर पानीपत"
                    className="w-full font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-right"
                  />
                </div>
              </div>

              {/* 3. सेवा में, पुलिस अधीक्षक पानीपत। */}
              <div className="space-y-1 text-sm">
                <p className="font-bold text-slate-900">सेवा में,</p>
                <div className="pl-8">
                  <input
                    type="text"
                    value={formData.toAuthority || "पुलिस अधीक्षक पानीपत।"}
                    onChange={(e) => handleFieldChange("toAuthority", e.target.value)}
                    className="font-bold text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent hover:border-slate-300 focus:border-blue-500 rounded px-1.5 py-0.5 outline-none w-full max-w-md text-sm"
                    placeholder="पुलिस अधीक्षक पानीपत।"
                  />
                </div>
              </div>

              {/* 4. श्रीमान जी, निवेदन है कि... */}
              <div className="space-y-1 text-sm">
                <p className="font-bold text-slate-900">श्रीमान जी,</p>
                <div className="pl-8">
                  <textarea
                    rows={2}
                    value={formData.allegationsBrief || "निवेदन है कि उपरोक्त अभियोग में निम्नलिखित मोबाईल फोन की काल डिटेल व कैफ आई0डी0/आई.एम.ई.आई. की सर्चिंग की आवश्यकता है। उपलब्ध करवायी जावे।"}
                    onChange={(e) => handleFieldChange("allegationsBrief", e.target.value)}
                    className="w-full font-medium text-slate-900 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent hover:border-slate-300 focus:border-blue-500 rounded p-1.5 outline-none leading-relaxed text-sm resize-y"
                    placeholder="निवेदन है कि उपरोक्त अभियोग में निम्नलिखित मोबाईल फोन की काल डिटेल व कैफ आई0डी0/आई.एम.ई.आई. की सर्चिंग की आवश्यकता है। उपलब्ध करवायी जावे।"
                  />
                </div>
              </div>

              {/* 5. The Table matching media_1791306760225.png */}
              <div className="space-y-2">
                <div className="flex items-center justify-between no-print">
                  <span className="text-xs font-bold text-slate-700">
                    मोबाईल फोन विवरण तालिका ({cdrTargetRows.length} पंक्तियाँ):
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddCdrRow}
                      className="text-xs bg-slate-50 hover:bg-slate-100 text-slate-900 border-slate-300 font-bold gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ नई पंक्ति जोड़ें (Add Row)</span>
                    </Button>
                  </div>
                </div>

                <div className="overflow-x-auto border-2 border-slate-900">
                  <table className="w-full border-collapse text-xs text-slate-900 font-sans">
                    <thead>
                      <tr className="bg-slate-50 border-b-2 border-slate-900">
                        <th rowSpan={2} className="w-12 p-2 font-black border-r-2 border-slate-900 text-center align-middle">
                          क्र.स.
                        </th>
                        <th rowSpan={2} className="p-2 font-black border-r-2 border-slate-900 text-center align-middle min-w-[200px]">
                          मोबाईल फोन/ आई.एम.ई.आई. / आई पी/ व्हाटसअप नम्बर जिनकी डिटेल की आवश्यकता है
                        </th>
                        <th colSpan={2} className="p-1.5 font-black border-r-2 border-slate-900 text-center border-b-2 border-slate-900">
                          समय अवधि
                        </th>
                        <th rowSpan={2} className="p-2 font-black border-r-2 border-slate-900 text-center align-middle min-w-[240px]">
                          अभियोग का विवरण एवं डाटा किस कारण से जरूरी है संक्षिप्त विवरण
                        </th>
                        <th rowSpan={2} className="w-10 p-1 font-black text-center align-middle no-print">
                          हटाएं
                        </th>
                      </tr>
                      <tr className="bg-slate-50 border-b-2 border-slate-900">
                        <th className="w-28 p-1.5 font-black border-r-2 border-slate-900 text-center">
                          कब से
                        </th>
                        <th className="w-28 p-1.5 font-black border-r-2 border-slate-900 text-center">
                          कब तक
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {cdrTargetRows.map((row, index) => (
                        <tr key={row.id} className="border-b border-slate-900 hover:bg-slate-50/50">
                          <td className="p-2 border-r-2 border-slate-900 text-center font-bold align-middle">
                            {index + 1}
                          </td>
                          <td className="p-1 border-r-2 border-slate-900 align-middle">
                            <input
                              type="text"
                              value={row.phone}
                              onChange={(e) => handleUpdateCdrRow(row.id, "phone", e.target.value)}
                              placeholder="मोबाईल / IMEI / IP / WhatsApp"
                              className="w-full text-xs font-semibold text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-blue-400 p-1 rounded outline-none"
                            />
                          </td>
                          <td className="p-1 border-r-2 border-slate-900 align-middle">
                            <input
                              type="text"
                              value={row.periodFrom || ""}
                              onChange={(e) => handleUpdateCdrRow(row.id, "periodFrom", e.target.value)}
                              placeholder="कब से"
                              className="w-full text-xs text-center text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-blue-400 p-1 rounded outline-none"
                            />
                          </td>
                          <td className="p-1 border-r-2 border-slate-900 align-middle">
                            <input
                              type="text"
                              value={row.periodTo || ""}
                              onChange={(e) => handleUpdateCdrRow(row.id, "periodTo", e.target.value)}
                              placeholder="कब तक"
                              className="w-full text-xs text-center text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-blue-400 p-1 rounded outline-none"
                            />
                          </td>
                          <td className="p-1 border-r-2 border-slate-900 align-middle">
                            <input
                              type="text"
                              value={row.reason || ""}
                              onChange={(e) => handleUpdateCdrRow(row.id, "reason", e.target.value)}
                              placeholder="अभियोग का संक्षिप्त विवरण व डाटा का कारण"
                              className="w-full text-xs text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-blue-400 p-1 rounded outline-none"
                            />
                          </td>
                          <td className="p-1 text-center align-middle no-print">
                            <button
                              type="button"
                              onClick={() => handleDeleteCdrRow(row.id)}
                              disabled={cdrTargetRows.length <= 1}
                              className="p-1 text-slate-400 hover:text-red-700 disabled:opacity-20 cursor-pointer"
                              title="Delete row"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 6. Legal Undertakings in English (Matching Image Exactly) */}
              <div className="space-y-1.5 text-xs text-slate-900 font-medium pt-2">
                <p className="flex items-start gap-1.5">
                  <span className="font-bold">1.</span>
                  <span>The Subscriber identity has been ascertained and it is ensured that person in question is not someone whose call details are of sensitive nature.</span>
                </p>
                <p className="flex items-start gap-1.5">
                  <span className="font-bold">2.</span>
                  <span>The number is not subscribed in the name of a sitting MP/MLA/MLC &amp; Governor.</span>
                </p>
              </div>

              {/* 7. Signatures and Forwarding blocks (Matching Image Exactly) */}
              <div className="pt-6 space-y-10">
                {/* Right: हस्ताक्षर अनुसंधान अधिकारी block */}
                <div className="flex justify-end">
                  <div className="w-64 space-y-1.5 text-xs">
                    <p className="font-bold text-slate-950">हस्ताक्षर अनुसंधान अधिकारी</p>
                    <div className="flex items-center gap-1">
                      <span className="font-semibold text-slate-800">नाम-</span>
                      <input
                        type="text"
                        value={formData.officerName || ""}
                        onChange={(e) => handleFieldChange("officerName", e.target.value)}
                        placeholder="................................"
                        className="w-full text-xs text-slate-900 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-blue-400 px-1 py-0.5 outline-none"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-semibold text-slate-800">रैन्क-</span>
                      <input
                        type="text"
                        value={formData.officerRank || ""}
                        onChange={(e) => handleFieldChange("officerRank", e.target.value)}
                        placeholder="..............................."
                        className="w-full text-xs text-slate-900 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-blue-400 px-1 py-0.5 outline-none"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-semibold text-slate-800">फोन न0-</span>
                      <input
                        type="text"
                        value={formData.officerPhone || ""}
                        onChange={(e) => handleFieldChange("officerPhone", e.target.value)}
                        placeholder="..........................."
                        className="w-full text-xs text-slate-900 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-blue-400 px-1 py-0.5 outline-none"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-semibold text-slate-800">थाना/यूनिट-</span>
                      <input
                        type="text"
                        value={formData.policeStation || ""}
                        onChange={(e) => handleFieldChange("policeStation", e.target.value)}
                        placeholder="...................."
                        className="w-full text-xs text-slate-900 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-blue-400 px-1 py-0.5 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Bottom Endorsements: Left (अग्रेषित प्रबंधक अफसर) & Center (अग्रेषित पर्यवेक्षण अधिकारी) */}
                <div className="space-y-6 pt-4">
                  <div className="text-left w-48 space-y-1 text-xs">
                    <p className="font-bold text-slate-900">अग्रेषित</p>
                    <input
                      type="text"
                      value={formData.shoName || "प्रबंधक अफसर"}
                      onChange={(e) => handleFieldChange("shoName", e.target.value)}
                      className="font-bold text-slate-900 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-blue-400 px-1 py-0.5 outline-none w-full"
                    />
                  </div>

                  <div className="text-center w-64 mx-auto space-y-1 text-xs">
                    <p className="font-bold text-slate-900">अग्रेषित</p>
                    <input
                      type="text"
                      value={formData.supervisoryOfficerName || "पर्यवेक्षण अधिकारी"}
                      onChange={(e) => handleFieldChange("supervisoryOfficerName", e.target.value)}
                      className="font-bold text-slate-900 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-blue-400 px-1 py-0.5 outline-none w-full text-center"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= TEMPLATE 3: ARREST MEMO FORM 26.8(1) (4 PAGES OFFICIAL SEQUENCE) ================= */}
          {activeTemplate === "arrest_memo" && (
            <div className="space-y-10 text-slate-950 font-sans text-sm">
              {/* PAGE 1 CONTAINER */}
              <div className="bg-white border-2 border-slate-300 rounded-xl p-6 sm:p-10 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-xs font-black uppercase tracking-wider text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 rounded-md">
                    पृष्ठ 1 / 4: गिरफ्तारी/ न्यायालय में समर्पण फार्म - भाग-1 (फार्म 26.8(1))
                  </span>
                  <span className="font-mono text-xs font-bold text-slate-700">v3.0 dt 07.04.2025</span>
                </div>

                <div className="text-center space-y-0.5 py-1">
                  <h3 className="font-bold text-base sm:text-lg text-slate-950">गिरफ्तारी/ न्यायालय में समर्पण फार्म</h3>
                  <h4 className="font-bold text-sm text-slate-900">भाग-1</h4>
                  <h4 className="font-bold text-sm text-slate-900">फार्म संख्या 26.8(1)</h4>
                  <p className="text-xs text-slate-700 font-medium">(प्रत्येक अभियुक्त के लिए अलग अलग फार्म)</p>
                </div>

                {/* Point 1 */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold">1.</span>
                    <span>जिला</span>
                    <input
                      type="text"
                      value={formData.district || ""}
                      onChange={(e) => handleFieldChange("district", e.target.value)}
                      placeholder="...................................."
                      className="font-bold text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border-b border-dotted border-slate-700 px-1 outline-none min-w-[140px]"
                    />
                    <span>थाना</span>
                    <input
                      type="text"
                      value={formData.policeStation || ""}
                      onChange={(e) => handleFieldChange("policeStation", e.target.value)}
                      placeholder="...................................."
                      className="font-bold text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border-b border-dotted border-slate-700 px-1 outline-none min-w-[140px]"
                    />
                    <span>वर्ष</span>
                    <input
                      type="text"
                      value={formData.arrestYear || "2026"}
                      onChange={(e) => handleFieldChange("arrestYear", e.target.value)}
                      placeholder=".........."
                      className="font-bold text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border-b border-dotted border-slate-700 px-1 outline-none w-20"
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-2 pl-5">
                    <span>FIR/ रोजनामचा रपट संख्या</span>
                    <input
                      type="text"
                      value={formData.complaintNo || ""}
                      onChange={(e) => handleFieldChange("complaintNo", e.target.value)}
                      placeholder="...................................."
                      className="font-bold text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border-b border-dotted border-slate-700 px-1 outline-none min-w-[180px]"
                    />
                    <span>दिनांक</span>
                    <input
                      type="text"
                      value={formData.issueDate || formData.incidentDate || ""}
                      onChange={(e) => handleFieldChange("issueDate", e.target.value)}
                      placeholder="...................."
                      className="font-bold text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border-b border-dotted border-slate-700 px-1 outline-none w-32"
                    />
                  </div>
                </div>

                {/* Point 2 */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold">2.</span>
                    <span>गिरफ्तारी/ आत्म समर्पण की तिथि व समय :</span>
                    <span>दिनांक</span>
                    <input
                      type="text"
                      value={formData.arrestDate || ""}
                      onChange={(e) => handleFieldChange("arrestDate", e.target.value)}
                      placeholder="...................."
                      className="font-bold text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border-b border-dotted border-slate-700 px-1 outline-none w-32"
                    />
                    <span>समय</span>
                    <input
                      type="text"
                      value={formData.arrestTime || ""}
                      onChange={(e) => handleFieldChange("arrestTime", e.target.value)}
                      placeholder="...................."
                      className="font-bold text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border-b border-dotted border-slate-700 px-1 outline-none w-28"
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-2 pl-5">
                    <span>रोजनामचा रपट संख्या</span>
                    <input
                      type="text"
                      value={formData.arrestGdNo || ""}
                      onChange={(e) => handleFieldChange("arrestGdNo", e.target.value)}
                      placeholder="...................."
                      className="font-bold text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border-b border-dotted border-slate-700 px-1 outline-none w-36"
                    />
                    <span>गिरफ्तारी का स्थान</span>
                    <input
                      type="text"
                      value={formData.arrestPlace || ""}
                      onChange={(e) => handleFieldChange("arrestPlace", e.target.value)}
                      placeholder="................................................................"
                      className="font-bold text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border-b border-dotted border-slate-700 px-1 outline-none flex-1 min-w-[200px]"
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-2 pl-5">
                    <input
                      type="text"
                      value={formData.arrestPlaceContinuation || ""}
                      onChange={(e) => handleFieldChange("arrestPlaceContinuation", e.target.value)}
                      placeholder="...................................................."
                      className="font-bold text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border-b border-dotted border-slate-700 px-1 outline-none min-w-[220px]"
                    />
                    <span>थाना</span>
                    <input
                      type="text"
                      value={formData.arrestPoliceStation || formData.policeStation || ""}
                      onChange={(e) => handleFieldChange("arrestPoliceStation", e.target.value)}
                      placeholder="...................."
                      className="font-bold text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border-b border-dotted border-slate-700 px-1 outline-none min-w-[140px]"
                    />
                    <span>जिला</span>
                    <input
                      type="text"
                      value={formData.arrestDistrict || formData.district || ""}
                      onChange={(e) => handleFieldChange("arrestDistrict", e.target.value)}
                      placeholder="...................."
                      className="font-bold text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border-b border-dotted border-slate-700 px-1 outline-none min-w-[140px]"
                    />
                  </div>
                </div>

                {/* Point 3 */}
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <span className="font-bold">3.</span>
                  <span>न्यायालय का नाम ( यदि आत्मसमर्पण किया हो)</span>
                  <input
                    type="text"
                    value={formData.courtNameSurrender || ""}
                    onChange={(e) => handleFieldChange("courtNameSurrender", e.target.value)}
                    placeholder="................................................................................................"
                    className="font-bold text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border-b border-dotted border-slate-700 px-1 outline-none flex-1 min-w-[260px]"
                  />
                </div>

                {/* Point 4 */}
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <span className="font-bold">4.</span>
                  <span>अधिनियम एंव धाराएं</span>
                  <input
                    type="text"
                    value={formData.sectionsOfLaw || ""}
                    onChange={(e) => handleFieldChange("sectionsOfLaw", e.target.value)}
                    placeholder="................................................................................................"
                    className="font-bold text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border-b border-dotted border-slate-700 px-1 outline-none flex-1 min-w-[260px]"
                  />
                </div>

                {/* Point 5: गिरफ्तार व्यक्ति का विवरण */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold">5.</span>
                    <span className="font-bold">गिरफ्तार व्यक्ति का विवरण :-</span>
                  </div>

                  <div className="pl-5 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span>(i) नाम</span>
                      <input
                        type="text"
                        value={formData.noticeeName || ""}
                        onChange={(e) => handleFieldChange("noticeeName", e.target.value)}
                        placeholder="...................................."
                        className="font-bold text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border-b border-dotted border-slate-700 px-1 outline-none min-w-[220px]"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span>(ii) पिता/पति/संरक्षक का नाम</span>
                      <input
                        type="text"
                        value={formData.noticeeFather || ""}
                        onChange={(e) => handleFieldChange("noticeeFather", e.target.value)}
                        placeholder="...................................................."
                        className="font-bold text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border-b border-dotted border-slate-700 px-1 outline-none min-w-[260px]"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span>(iii) प्रथम उपनाम</span>
                        <input
                          type="text"
                          value={formData.noticeeAlias1 || ""}
                          onChange={(e) => handleFieldChange("noticeeAlias1", e.target.value)}
                          placeholder="...................."
                          className="font-bold text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border-b border-dotted border-slate-700 px-1 outline-none w-36"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span>(iv) द्वितीय उपनाम</span>
                        <input
                          type="text"
                          value={formData.noticeeAlias2 || ""}
                          onChange={(e) => handleFieldChange("noticeeAlias2", e.target.value)}
                          placeholder="...................."
                          className="font-bold text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border-b border-dotted border-slate-700 px-1 outline-none w-36"
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span>(v) राष्ट्रीयता</span>
                        <input
                          type="text"
                          value={formData.noticeeNationality || "भारतीय"}
                          onChange={(e) => handleFieldChange("noticeeNationality", e.target.value)}
                          placeholder="...................."
                          className="font-bold text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border-b border-dotted border-slate-700 px-1 outline-none w-32"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span>(vi) (क) मतदाता या अन्य पहचान पत्र संख्या</span>
                        <input
                          type="text"
                          value={formData.voterOrIdCardNo || ""}
                          onChange={(e) => handleFieldChange("voterOrIdCardNo", e.target.value)}
                          placeholder="...................................."
                          className="font-bold text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border-b border-dotted border-slate-700 px-1 outline-none w-52"
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 pl-8">
                      <div className="flex items-center gap-2">
                        <span>(ख) पासपोर्ट संख्या</span>
                        <input
                          type="text"
                          value={formData.passportNo || ""}
                          onChange={(e) => handleFieldChange("passportNo", e.target.value)}
                          placeholder="...................."
                          className="font-bold text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border-b border-dotted border-slate-700 px-1 outline-none w-32"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span>(ग) जारी करने की तिथि</span>
                        <input
                          type="text"
                          value={formData.passportIssueDate || ""}
                          onChange={(e) => handleFieldChange("passportIssueDate", e.target.value)}
                          placeholder="...................."
                          className="font-bold text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border-b border-dotted border-slate-700 px-1 outline-none w-32"
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pl-8">
                      <span>(घ) जारी करने का स्थान</span>
                      <input
                        type="text"
                        value={formData.passportIssuePlace || ""}
                        onChange={(e) => handleFieldChange("passportIssuePlace", e.target.value)}
                        placeholder="...................................................."
                        className="font-bold text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border-b border-dotted border-slate-700 px-1 outline-none flex-1 min-w-[200px]"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span>(vii) धर्म</span>
                      <input
                        type="text"
                        value={formData.religion || ""}
                        onChange={(e) => handleFieldChange("religion", e.target.value)}
                        placeholder="...................."
                        className="font-bold text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border-b border-dotted border-slate-700 px-1 outline-none w-36"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span>(viii) अनुसूचित जाति/अनुसूचित जनजाति/ अन्य पिछड़ा वर्ग/ सामान्य</span>
                      <input
                        type="text"
                        value={formData.categoryCaste || ""}
                        onChange={(e) => handleFieldChange("categoryCaste", e.target.value)}
                        placeholder="...................."
                        className="font-bold text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border-b border-dotted border-slate-700 px-1 outline-none min-w-[160px]"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span>(ix) व्यवसाय</span>
                      <input
                        type="text"
                        value={formData.occupation || ""}
                        onChange={(e) => handleFieldChange("occupation", e.target.value)}
                        placeholder="...................................."
                        className="font-bold text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border-b border-dotted border-slate-700 px-1 outline-none min-w-[200px]"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span>(x) स्थाई पता</span>
                      <input
                        type="text"
                        value={formData.permanentAddress || formData.noticeeAddress || ""}
                        onChange={(e) => handleFieldChange("permanentAddress", e.target.value)}
                        placeholder="................................................................................................"
                        className="font-bold text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border-b border-dotted border-slate-700 px-1 outline-none flex-1 min-w-[260px]"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span>(xi) वर्तमान पता</span>
                      <input
                        type="text"
                        value={formData.currentAddress || formData.noticeeAddress || ""}
                        onChange={(e) => handleFieldChange("currentAddress", e.target.value)}
                        placeholder="................................................................................................"
                        className="font-bold text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border-b border-dotted border-slate-700 px-1 outline-none flex-1 min-w-[260px]"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span>(xii) मोबाईल नम्बर</span>
                        <input
                          type="text"
                          value={formData.mobileNo || formData.noticeePhone || ""}
                          onChange={(e) => handleFieldChange("mobileNo", e.target.value)}
                          placeholder="...................."
                          className="font-bold font-mono text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border-b border-dotted border-slate-700 px-1 outline-none w-36"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span>(xiii) फोन नम्बर</span>
                        <input
                          type="text"
                          value={formData.phoneNo || ""}
                          onChange={(e) => handleFieldChange("phoneNo", e.target.value)}
                          placeholder="...................."
                          className="font-bold font-mono text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border-b border-dotted border-slate-700 px-1 outline-none w-36"
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span>(xiv) उपयोगकर्ता पहचान संख्या</span>
                        <input
                          type="text"
                          value={formData.userIdentificationNo || formData.accusedAadhaar || ""}
                          onChange={(e) => handleFieldChange("userIdentificationNo", e.target.value)}
                          placeholder="...................."
                          className="font-bold font-mono text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border-b border-dotted border-slate-700 px-1 outline-none w-44"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span>(xv) स्थाई खाता संख्या</span>
                        <input
                          type="text"
                          value={formData.panNo || formData.accusedPan || ""}
                          onChange={(e) => handleFieldChange("panNo", e.target.value)}
                          placeholder="...................."
                          className="font-bold font-mono text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border-b border-dotted border-slate-700 px-1 outline-none w-36"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Point 6 */}
                <div className="space-y-1 pt-2">
                  <div className="flex items-start gap-2 leading-relaxed">
                    <span className="font-bold">6.</span>
                    <span>गिरफ्तार व्यक्ति की शारीरिक दशा/ यदि कोई चोट लगी हो तो चोट तथा उसके कारण /कारणों का विवरण (यदि डाक्टरी जांच करवाई गई हो तो उल्लेख करे)</span>
                  </div>
                  <div className="pl-5">
                    <textarea
                      rows={2}
                      value={formData.physicalConditionOrInjuries || ""}
                      onChange={(e) => handleFieldChange("physicalConditionOrInjuries", e.target.value)}
                      placeholder="................................................................................................"
                      className="w-full font-bold text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border-b border-dotted border-slate-700 px-1 outline-none leading-relaxed"
                    />
                  </div>
                </div>

                {/* Point 7 */}
                <div className="space-y-1 pt-2">
                  <div className="flex flex-wrap items-baseline gap-2 leading-relaxed">
                    <span className="font-bold">7.</span>
                    <span>गिरफ्तार व्यक्ति को उसकी गिरफ्तार का कारण और उसके कानूनी अधिकार को बताते हुए दिनांक</span>
                    <input
                      type="text"
                      value={formData.custodyDate || formData.arrestDate || ""}
                      onChange={(e) => handleFieldChange("custodyDate", e.target.value)}
                      placeholder="...................."
                      className="font-bold text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border-b border-dotted border-slate-700 px-1 outline-none w-32"
                    />
                    <span>समय</span>
                    <input
                      type="text"
                      value={formData.custodyTime || formData.arrestTime || ""}
                      onChange={(e) => handleFieldChange("custodyTime", e.target.value)}
                      placeholder=".........."
                      className="font-bold text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border-b border-dotted border-slate-700 px-1 outline-none w-28"
                    />
                    <span>स्थान</span>
                    <input
                      type="text"
                      value={formData.custodyPlace || formData.arrestPlace || ""}
                      onChange={(e) => handleFieldChange("custodyPlace", e.target.value)}
                      placeholder="...................................."
                      className="font-bold text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border-b border-dotted border-slate-700 px-1 outline-none min-w-[200px]"
                    />
                    <span>से हिरासत में लिया गया।</span>
                  </div>
                </div>

                {/* Point 8: गवाहो के नाम और पता */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold">
                      <span>8.</span>
                      <span>गवाहो के नाम और पता (कम से कम दो गवाह आवश्यक हैं) -</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddWitnessRow}
                      className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-xs font-bold hover:bg-blue-100 cursor-pointer"
                    >
                      + गवाह जोड़ें
                    </button>
                  </div>

                  <table className="w-full border-collapse border border-slate-900 text-xs">
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="border border-slate-900 p-1.5 w-12 text-center">क्र.स.</th>
                        <th className="border border-slate-900 p-1.5 text-center">नाम</th>
                        <th className="border border-slate-900 p-1.5 text-center">पता</th>
                        <th className="border border-slate-900 p-1.5 w-32 text-center">हस्ताक्षर</th>
                        <th className="border border-slate-900 p-1 w-8 text-center no-print"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {(formData.arrestWitnesses || DEFAULT_SAMPLE_DATA.arrest_memo.arrestWitnesses || []).map((w, idx) => (
                        <tr key={w.id || idx}>
                          <td className="border border-slate-900 p-1 text-center font-bold">{w.srNo || idx + 1}</td>
                          <td className="border border-slate-900 p-1">
                            <input
                              type="text"
                              value={w.name || ""}
                              onChange={(e) => handleUpdateWitnessRow(idx, "name", e.target.value)}
                              placeholder="गवाह का नाम व पिता का नाम..."
                              className="w-full font-bold text-slate-900 bg-transparent px-1 outline-none"
                            />
                          </td>
                          <td className="border border-slate-900 p-1">
                            <input
                              type="text"
                              value={w.address || ""}
                              onChange={(e) => handleUpdateWitnessRow(idx, "address", e.target.value)}
                              placeholder="गवाह का पूरा पता व मोबाइल..."
                              className="w-full text-slate-900 bg-transparent px-1 outline-none"
                            />
                          </td>
                          <td className="border border-slate-900 p-1">
                            <input
                              type="text"
                              value={w.signature || ""}
                              onChange={(e) => handleUpdateWitnessRow(idx, "signature", e.target.value)}
                              placeholder="हस्ताक्षर..."
                              className="w-full font-serif text-slate-900 bg-transparent px-1 outline-none text-center"
                            />
                          </td>
                          <td className="border border-slate-900 p-1 text-center no-print">
                            <button
                              type="button"
                              onClick={() => handleDeleteWitnessRow(idx)}
                              className="text-red-500 hover:text-red-700 p-0.5"
                              title="Delete row"
                            >
                              <X className="w-3.5 h-3.5 mx-auto" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* PAGE 2 CONTAINER */}
              <div className="bg-white border-2 border-slate-300 rounded-xl p-6 sm:p-10 shadow-sm space-y-5">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-xs font-black uppercase tracking-wider text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md">
                    पृष्ठ 2 / 4: वारसान सूचना, धारा 47 BNSS आधार, जामा तलाशी एवं गवाह
                  </span>
                  <span className="font-mono text-xs font-bold text-slate-700">फार्म संख्या 26.8(1)</span>
                </div>

                {/* Point 9 */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold">9.</span>
                    <span>वारसान</span>
                    <input
                      type="text"
                      value={formData.relativeName || ""}
                      onChange={(e) => handleFieldChange("relativeName", e.target.value)}
                      placeholder="...................................................."
                      className="font-bold text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border-b border-dotted border-slate-700 px-1 outline-none min-w-[200px]"
                    />
                    <span>सम्बन्ध</span>
                    <input
                      type="text"
                      value={formData.relativeRelation || ""}
                      onChange={(e) => handleFieldChange("relativeRelation", e.target.value)}
                      placeholder="...................."
                      className="font-bold text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border-b border-dotted border-slate-700 px-1 outline-none w-32"
                    />
                    <span>दिनांक</span>
                    <input
                      type="text"
                      value={formData.intimationDate || ""}
                      onChange={(e) => handleFieldChange("intimationDate", e.target.value)}
                      placeholder="...................."
                      className="font-bold text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border-b border-dotted border-slate-700 px-1 outline-none w-32"
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-2 pl-5">
                    <span>समय पर</span>
                    <input
                      type="text"
                      value={formData.intimationTime || ""}
                      onChange={(e) => handleFieldChange("intimationTime", e.target.value)}
                      placeholder="...................."
                      className="font-bold text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border-b border-dotted border-slate-700 px-1 outline-none w-28"
                    />
                    <span>मोबाईल नम्बर</span>
                    <input
                      type="text"
                      value={formData.relativeMobile || ""}
                      onChange={(e) => handleFieldChange("relativeMobile", e.target.value)}
                      placeholder="...................................."
                      className="font-bold font-mono text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border-b border-dotted border-slate-700 px-1 outline-none w-44"
                    />
                    <span>पर सूचना दी गई।</span>
                  </div>
                </div>

                {/* Point 10 */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex items-center gap-1.5 font-bold">
                    <span>10.</span>
                    <span>आरोपी के पारिवारिक सदस्यो का विवरण</span>
                  </div>
                  <div className="pl-5 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-6">(i)</span>
                      <input
                        type="text"
                        value={formData.familyMember1 || ""}
                        onChange={(e) => handleFieldChange("familyMember1", e.target.value)}
                        placeholder="................................................................................................"
                        className="w-full font-bold text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border-b border-dotted border-slate-700 px-1 outline-none"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-6">(ii)</span>
                      <input
                        type="text"
                        value={formData.familyMember2 || ""}
                        onChange={(e) => handleFieldChange("familyMember2", e.target.value)}
                        placeholder="................................................................................................"
                        className="w-full font-bold text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border-b border-dotted border-slate-700 px-1 outline-none"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-6">(iii)</span>
                      <input
                        type="text"
                        value={formData.familyMember3 || ""}
                        onChange={(e) => handleFieldChange("familyMember3", e.target.value)}
                        placeholder="................................................................................................"
                        className="w-full font-bold text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border-b border-dotted border-slate-700 px-1 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Point 11 */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center gap-1.5 font-bold">
                    <span>11.</span>
                    <span>आरोपी के गिरफ्तारी करने के आधार (47 BNSS) –</span>
                  </div>
                  <div className="pl-5 space-y-2">
                    <div className="space-y-1">
                      <span className="block font-medium">(क) धाराएं जिनके तहत आरोपी द्वारा अपराध किया गया है</span>
                      <input
                        type="text"
                        value={formData.grounds47Sections || formData.sectionsOfLaw || ""}
                        onChange={(e) => handleFieldChange("grounds47Sections", e.target.value)}
                        placeholder="................................................................................................"
                        className="w-full font-bold text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border-b border-dotted border-slate-700 px-1 outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <span className="block font-medium">(ख) इन अपराधों में आरोपी की विशिष्ट भूमिका</span>
                      <input
                        type="text"
                        value={formData.grounds47Role || ""}
                        onChange={(e) => handleFieldChange("grounds47Role", e.target.value)}
                        placeholder="................................................................................................"
                        className="w-full font-bold text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border-b border-dotted border-slate-700 px-1 outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <span className="block font-medium">
                        (ग) इन अपराधों में अपराधी की संलिप्ता बारे आधार (जैसे कि प्रत्यक्षदर्शी का ब्यान, BNSS 180/183 का ब्यान, CCTV/ Audio Recording, बरामदगी, फर्द इंक्साफ इत्यादि)
                      </span>
                      <textarea
                        rows={2}
                        value={formData.grounds47Evidence || ""}
                        onChange={(e) => handleFieldChange("grounds47Evidence", e.target.value)}
                        placeholder="................................................................................................"
                        className="w-full font-bold text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border-b border-dotted border-slate-700 px-1 outline-none leading-relaxed"
                      />
                    </div>

                    <div className="space-y-1">
                      <span className="block font-medium">(घ) अन्य आधार</span>
                      <input
                        type="text"
                        value={formData.grounds47Other || ""}
                        onChange={(e) => handleFieldChange("grounds47Other", e.target.value)}
                        placeholder="................................................................................................"
                        className="w-full font-bold text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border-b border-dotted border-slate-700 px-1 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Point 12: जामा तलाशी */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-baseline gap-1.5 font-bold">
                      <span>12.</span>
                      <span><u>जामा तलाशी</u> - गिरफ्तार व्यक्ति की जामा तलाशी लेने पर निम्नलिखित सामान पाया, जिसे कब्जे में लेकर रसीद दी गई। यदि कुछ भी सामान नहीं पाया तो कुछ भी नहीं लिखा जाए।</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddJtRow}
                      className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-xs font-bold hover:bg-blue-100 cursor-pointer shrink-0 ml-2"
                    >
                      + सामान जोड़ें
                    </button>
                  </div>

                  <table className="w-full border-collapse border border-slate-900 text-xs mt-2">
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="border border-slate-900 p-1.5 w-16 text-center">क्र.स.</th>
                        <th className="border border-slate-900 p-1.5 text-center">पाए गए सामान का विवरण</th>
                        <th className="border border-slate-900 p-1.5 w-36 text-center">मात्रा/संख्या</th>
                        <th className="border border-slate-900 p-1 w-8 text-center no-print"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {(formData.jamaTalashiItems || DEFAULT_SAMPLE_DATA.arrest_memo.jamaTalashiItems || []).map((item, idx) => (
                        <tr key={item.id || idx}>
                          <td className="border border-slate-900 p-1 text-center font-bold">{item.srNo || `${idx + 1}.`}</td>
                          <td className="border border-slate-900 p-1">
                            <input
                              type="text"
                              value={item.description || ""}
                              onChange={(e) => handleUpdateJtRow(idx, "description", e.target.value)}
                              placeholder="पाए गए सामान का विवरण..."
                              className="w-full font-bold text-slate-900 bg-transparent px-1 outline-none"
                            />
                          </td>
                          <td className="border border-slate-900 p-1">
                            <input
                              type="text"
                              value={item.quantity || ""}
                              onChange={(e) => handleUpdateJtRow(idx, "quantity", e.target.value)}
                              placeholder="मात्रा/संख्या..."
                              className="w-full text-slate-900 bg-transparent px-1 outline-none text-center"
                            />
                          </td>
                          <td className="border border-slate-900 p-1 text-center no-print">
                            <button
                              type="button"
                              onClick={() => handleDeleteJtRow(idx)}
                              className="text-red-500 hover:text-red-700 p-0.5"
                              title="Delete row"
                            >
                              <X className="w-3.5 h-3.5 mx-auto" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <ul className="list-disc pl-8 space-y-1 text-xs text-slate-800 pt-1">
                    <li>मानवीय गरिमा तथा शारीरिक बचाव हेतू आवश्यक कपडे गिरफ्तार व्यक्ति के शरीर पर रहने दिए गए।</li>
                    <li>शिनाख्त हेतू अपने आप को मुंह ढककर रखने के लिए गिरफ्तार व्यक्ति को सचेत किया गया।</li>
                  </ul>

                  <div className="pt-3 space-y-1">
                    <p className="font-bold text-xs">गिरफ्तार व्यक्ति के हस्ताक्षर या बायें अगूंठे का निशान:</p>
                    <div className="border-b border-slate-800 w-80 pt-4"></div>
                  </div>

                  <div className="pt-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold">गवाह के हस्ताक्षर 1.</span>
                      <input
                        type="text"
                        value={formData.witnessSign1 || ""}
                        onChange={(e) => handleFieldChange("witnessSign1", e.target.value)}
                        placeholder="...................................................."
                        className="font-bold text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border-b border-dotted border-slate-700 px-1 outline-none flex-1 max-w-sm"
                      />
                    </div>
                    <div className="flex items-center gap-2 pl-36">
                      <span className="font-bold">2.</span>
                      <input
                        type="text"
                        value={formData.witnessSign2 || ""}
                        onChange={(e) => handleFieldChange("witnessSign2", e.target.value)}
                        placeholder="...................................................."
                        className="font-bold text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border-b border-dotted border-slate-700 px-1 outline-none flex-1 max-w-sm"
                      />
                    </div>
                  </div>

                  <div className="pt-3 space-y-1">
                    <p className="font-bold text-xs">गिरफ्तार व्यक्ति के हस्ताक्षर या बायें अगूंठे का निशान:</p>
                    <div className="border-b border-slate-800 w-80 pt-4"></div>
                  </div>

                  {/* Signatures at Bottom of Page 2 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 text-xs">
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold">स्थान</span>
                        <input
                          type="text"
                          value={formData.ioSignPlace || formData.district || ""}
                          onChange={(e) => handleFieldChange("ioSignPlace", e.target.value)}
                          placeholder="...................."
                          className="font-bold text-slate-950 bg-transparent border-b border-dotted border-slate-700 px-1 outline-none w-36"
                        />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold">दिनांक</span>
                        <input
                          type="text"
                          value={formData.ioSignDate || formData.issueDate || ""}
                          onChange={(e) => handleFieldChange("ioSignDate", e.target.value)}
                          placeholder="...................."
                          className="font-bold text-slate-950 bg-transparent border-b border-dotted border-slate-700 px-1 outline-none w-36"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5 pl-0 sm:pl-8">
                      <p className="font-bold">जांच अधिकारी के हस्ताक्षर</p>
                      <div className="flex items-center gap-1.5">
                        <span>नाम</span>
                        <input
                          type="text"
                          value={formData.officerName || ""}
                          onChange={(e) => handleFieldChange("officerName", e.target.value)}
                          placeholder="...................................."
                          className="font-bold text-slate-950 bg-transparent border-b border-dotted border-slate-700 px-1 outline-none flex-1"
                        />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span>पद</span>
                        <input
                          type="text"
                          value={formData.officerRank || ""}
                          onChange={(e) => handleFieldChange("officerRank", e.target.value)}
                          placeholder="...................."
                          className="font-bold text-slate-950 bg-transparent border-b border-dotted border-slate-700 px-1 outline-none flex-1"
                        />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span>नम्बर</span>
                        <input
                          type="text"
                          value={formData.officerPno || formData.officerBeltNo || ""}
                          onChange={(e) => handleFieldChange("officerPno", e.target.value)}
                          placeholder="...................."
                          className="font-bold text-slate-950 bg-transparent border-b border-dotted border-slate-700 px-1 outline-none flex-1"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* PAGE 3 CONTAINER */}
              <div className="bg-white border-2 border-slate-300 rounded-xl p-6 sm:p-10 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-xs font-black uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-md">
                    पृष्ठ 3 / 4: भाग-2 पहचान पत्र एवं 18-शारीरिक लक्षण तालिका
                  </span>
                  <span className="font-mono text-xs font-bold text-slate-700">v3.0 dt 07.04.2025</span>
                </div>

                <div className="text-center space-y-0.5 py-1">
                  <h3 className="font-bold text-base sm:text-lg text-slate-950">गिरफ्तारी/ न्यायालय में समर्पण फार्म</h3>
                  <h4 className="font-bold text-sm text-slate-900">भाग-2</h4>
                  <h4 className="font-bold text-sm text-slate-900">पहचान पत्र</h4>
                  <p className="text-xs text-slate-700 font-medium">(प्रत्येक अभियुक्त के लिए अलग अलग फार्म)</p>
                </div>

                {/* Header row with Photo box */}
                <div className="flex flex-col sm:flex-row items-start justify-between gap-4 pt-1">
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold">थाना</span>
                        <input
                          type="text"
                          value={formData.policeStation || ""}
                          onChange={(e) => handleFieldChange("policeStation", e.target.value)}
                          placeholder="...................................."
                          className="font-bold text-slate-950 bg-transparent border-b border-dotted border-slate-700 px-1 outline-none min-w-[140px]"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">जिला</span>
                        <input
                          type="text"
                          value={formData.district || ""}
                          onChange={(e) => handleFieldChange("district", e.target.value)}
                          placeholder="...................."
                          className="font-bold text-slate-950 bg-transparent border-b border-dotted border-slate-700 px-1 outline-none min-w-[140px]"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <span className="font-bold">राज्य द्वारा</span>
                      <input
                        type="text"
                        value={formData.stateCaseTitle || "हरियाणा राज्य"}
                        onChange={(e) => handleFieldChange("stateCaseTitle", e.target.value)}
                        placeholder="................................................................................................"
                        className="font-bold text-slate-950 bg-transparent border-b border-dotted border-slate-700 px-1 outline-none flex-1"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span>अभियोग संख्या</span>
                      <input
                        type="text"
                        value={formData.caseNo || formData.complaintNo || ""}
                        onChange={(e) => handleFieldChange("caseNo", e.target.value)}
                        placeholder=".........."
                        className="font-bold text-slate-950 bg-transparent border-b border-dotted border-slate-700 px-1 outline-none w-28"
                      />
                      <span>दिनांक</span>
                      <input
                        type="text"
                        value={formData.caseDate || formData.issueDate || ""}
                        onChange={(e) => handleFieldChange("caseDate", e.target.value)}
                        placeholder=".........."
                        className="font-bold text-slate-950 bg-transparent border-b border-dotted border-slate-700 px-1 outline-none w-28"
                      />
                      <span>धारा</span>
                      <input
                        type="text"
                        value={formData.caseSections || formData.sectionsOfLaw || ""}
                        onChange={(e) => handleFieldChange("caseSections", e.target.value)}
                        placeholder=".........."
                        className="font-bold text-slate-950 bg-transparent border-b border-dotted border-slate-700 px-1 outline-none w-32"
                      />
                      <span>थाना</span>
                      <input
                        type="text"
                        value={formData.casePs || formData.policeStation || ""}
                        onChange={(e) => handleFieldChange("casePs", e.target.value)}
                        placeholder=".........."
                        className="font-bold text-slate-950 bg-transparent border-b border-dotted border-slate-700 px-1 outline-none w-36"
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <span className="font-bold">बनाम:</span>
                      <input
                        type="text"
                        value={formData.vsName || formData.noticeeName || ""}
                        onChange={(e) => handleFieldChange("vsName", e.target.value)}
                        placeholder="................................................................................................"
                        className="font-bold text-slate-950 bg-transparent border-b border-dotted border-slate-700 px-1 outline-none flex-1"
                      />
                    </div>
                  </div>

                  {/* Accused Photo Box */}
                  <div className="w-28 h-32 border-2 border-slate-800 rounded flex flex-col items-center justify-center text-center p-2 text-xs font-bold shrink-0 bg-slate-50">
                    <span>फोटोग्राफ आरोपी</span>
                  </div>
                </div>

                {/* Point 1: 18 Physical Features Table */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center gap-1.5 font-bold">
                    <span>1.</span>
                    <span>गिरफ्तार व्यक्ति की शारीरिक बनावट, विकृतियाँ एंव अन्य विवरण-</span>
                  </div>

                  <table className="w-full border-collapse border border-slate-900 text-xs">
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="border border-slate-900 p-1.5 w-1/6">लिंग<br/>(1)</th>
                        <th className="border border-slate-900 p-1.5 w-1/6">जन्म तिथि / वर्ष<br/>(2)</th>
                        <th className="border border-slate-900 p-1.5 w-1/6">शारीरिक बनावट<br/>(3)</th>
                        <th className="border border-slate-900 p-1.5 w-1/6">कद (सें.मी)<br/>(4)</th>
                        <th className="border border-slate-900 p-1.5 w-1/6">रंग/ब्लड ग्रुप<br/>(5)</th>
                        <th className="border border-slate-900 p-1.5 w-1/6">पहचान के चिन्ह<br/>(6)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-slate-900 p-1">
                          <input type="text" value={formData.gender || formData.accusedGender || ""} onChange={(e) => handleFieldChange("gender", e.target.value)} placeholder="लिंग..." className="w-full font-bold text-center bg-transparent outline-none" />
                        </td>
                        <td className="border border-slate-900 p-1">
                          <input type="text" value={formData.dobYear || formData.noticeeAge || ""} onChange={(e) => handleFieldChange("dobYear", e.target.value)} placeholder="जन्म तिथि..." className="w-full text-center bg-transparent outline-none" />
                        </td>
                        <td className="border border-slate-900 p-1">
                          <input type="text" value={formData.bodyBuild || ""} onChange={(e) => handleFieldChange("bodyBuild", e.target.value)} placeholder="बनावट..." className="w-full text-center bg-transparent outline-none" />
                        </td>
                        <td className="border border-slate-900 p-1">
                          <input type="text" value={formData.heightCm || ""} onChange={(e) => handleFieldChange("heightCm", e.target.value)} placeholder="कद..." className="w-full text-center bg-transparent outline-none" />
                        </td>
                        <td className="border border-slate-900 p-1">
                          <input type="text" value={formData.colorBloodGroup || ""} onChange={(e) => handleFieldChange("colorBloodGroup", e.target.value)} placeholder="रंग/ब्लड..." className="w-full text-center bg-transparent outline-none" />
                        </td>
                        <td className="border border-slate-900 p-1">
                          <input type="text" value={formData.identMarks || ""} onChange={(e) => handleFieldChange("identMarks", e.target.value)} placeholder="पहचान चिन्ह..." className="w-full font-bold text-center bg-transparent outline-none" />
                        </td>
                      </tr>
                      <tr className="bg-slate-100">
                        <th className="border border-slate-900 p-1.5">विकृतिया/ विशिष्टयां<br/>(7)</th>
                        <th className="border border-slate-900 p-1.5">दाँत<br/>(8)</th>
                        <th className="border border-slate-900 p-1.5">बाल<br/>(9)</th>
                        <th className="border border-slate-900 p-1.5">आंखें<br/>(10)</th>
                        <th className="border border-slate-900 p-1.5">आदतें<br/>(11)</th>
                        <th className="border border-slate-900 p-1.5">पहनावा<br/>(12)</th>
                      </tr>
                      <tr>
                        <td className="border border-slate-900 p-1">
                          <input type="text" value={formData.deformities || ""} onChange={(e) => handleFieldChange("deformities", e.target.value)} placeholder="विकृतिया..." className="w-full text-center bg-transparent outline-none" />
                        </td>
                        <td className="border border-slate-900 p-1">
                          <input type="text" value={formData.teeth || ""} onChange={(e) => handleFieldChange("teeth", e.target.value)} placeholder="दाँत..." className="w-full text-center bg-transparent outline-none" />
                        </td>
                        <td className="border border-slate-900 p-1">
                          <input type="text" value={formData.hair || ""} onChange={(e) => handleFieldChange("hair", e.target.value)} placeholder="बाल..." className="w-full text-center bg-transparent outline-none" />
                        </td>
                        <td className="border border-slate-900 p-1">
                          <input type="text" value={formData.eyes || ""} onChange={(e) => handleFieldChange("eyes", e.target.value)} placeholder="आंखें..." className="w-full text-center bg-transparent outline-none" />
                        </td>
                        <td className="border border-slate-900 p-1">
                          <input type="text" value={formData.habits || ""} onChange={(e) => handleFieldChange("habits", e.target.value)} placeholder="आदतें..." className="w-full text-center bg-transparent outline-none" />
                        </td>
                        <td className="border border-slate-900 p-1">
                          <input type="text" value={formData.dress || ""} onChange={(e) => handleFieldChange("dress", e.target.value)} placeholder="पहनावा..." className="w-full text-center bg-transparent outline-none" />
                        </td>
                      </tr>
                      <tr className="bg-slate-100">
                        <th className="border border-slate-900 p-1.5">भाषा/बोली<br/>(13)</th>
                        <th className="border border-slate-900 p-1.5">जले हुये का निशान<br/>(14)</th>
                        <th className="border border-slate-900 p-1.5">लुकोदर्मा/सफेद धब्बे<br/>(15)</th>
                        <th className="border border-slate-900 p-1.5">मस्सा<br/>(16)</th>
                        <th className="border border-slate-900 p-1.5">घाव<br/>(17)</th>
                        <th className="border border-slate-900 p-1.5">गुदे हुये का निशान<br/>(18)</th>
                      </tr>
                      <tr>
                        <td className="border border-slate-900 p-1">
                          <input type="text" value={formData.languageDialect || ""} onChange={(e) => handleFieldChange("languageDialect", e.target.value)} placeholder="भाषा/बोली..." className="w-full text-center bg-transparent outline-none" />
                        </td>
                        <td className="border border-slate-900 p-1">
                          <input type="text" value={formData.burnMarks || ""} onChange={(e) => handleFieldChange("burnMarks", e.target.value)} placeholder="जले का निशान..." className="w-full text-center bg-transparent outline-none" />
                        </td>
                        <td className="border border-slate-900 p-1">
                          <input type="text" value={formData.leukodermaSpots || ""} onChange={(e) => handleFieldChange("leukodermaSpots", e.target.value)} placeholder="सफेद धब्बे..." className="w-full text-center bg-transparent outline-none" />
                        </td>
                        <td className="border border-slate-900 p-1">
                          <input type="text" value={formData.moleMarks || ""} onChange={(e) => handleFieldChange("moleMarks", e.target.value)} placeholder="मस्सा/तिल..." className="w-full text-center bg-transparent outline-none" />
                        </td>
                        <td className="border border-slate-900 p-1">
                          <input type="text" value={formData.scarWoundMarks || ""} onChange={(e) => handleFieldChange("scarWoundMarks", e.target.value)} placeholder="घाव का निशान..." className="w-full text-center bg-transparent outline-none" />
                        </td>
                        <td className="border border-slate-900 p-1">
                          <input type="text" value={formData.tattooMarks || ""} onChange={(e) => handleFieldChange("tattooMarks", e.target.value)} placeholder="गुदा निशान..." className="w-full text-center bg-transparent outline-none" />
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <div className="flex items-center gap-2 pt-2">
                    <span>अन्य लक्षण यदि कोई हो तो-</span>
                    <input
                      type="text"
                      value={formData.otherIdentTraits || ""}
                      onChange={(e) => handleFieldChange("otherIdentTraits", e.target.value)}
                      placeholder="................................................................................................"
                      className="font-bold text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border-b border-dotted border-slate-700 px-1 outline-none flex-1"
                    />
                  </div>
                </div>

                {/* Point 2: उंगलियों के निशान */}
                <div className="flex items-center gap-3 pt-2">
                  <span className="font-bold">2.</span>
                  <span>उंगलियो के निशान लिये गए :</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleFieldChange("fingerprintsTaken", "हाँ")}
                      className={`px-3 py-0.5 rounded text-xs font-bold border transition-colors ${
                        (formData.fingerprintsTaken || "हाँ") === "हाँ"
                          ? "bg-emerald-600 text-white border-emerald-600"
                          : "bg-white text-slate-700 border-slate-300"
                      }`}
                    >
                      हाँ
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFieldChange("fingerprintsTaken", "नही")}
                      className={`px-3 py-0.5 rounded text-xs font-bold border transition-colors ${
                        formData.fingerprintsTaken === "नही"
                          ? "bg-rose-600 text-white border-rose-600"
                          : "bg-white text-slate-700 border-slate-300"
                      }`}
                    >
                      नही
                    </button>
                  </div>
                </div>

                {/* Point 3: सामाजिक व आर्थिक स्थिति */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center gap-1.5 font-bold">
                    <span>3.</span>
                    <span>गिरफ्तार व्यक्ति की सामाजिक व आर्थिक स्थिति :</span>
                  </div>

                  <div className="pl-5 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span>(क) जीवन स्तर</span>
                      <input
                        type="text"
                        value={formData.livingStandard || ""}
                        onChange={(e) => handleFieldChange("livingStandard", e.target.value)}
                        placeholder="...................................................."
                        className="font-bold text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border-b border-dotted border-slate-700 px-1 outline-none min-w-[200px]"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span>(ख) शैक्षणिक योग्यता</span>
                      <input
                        type="text"
                        value={formData.educationalQualification || ""}
                        onChange={(e) => handleFieldChange("educationalQualification", e.target.value)}
                        placeholder="...................................................."
                        className="font-bold text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border-b border-dotted border-slate-700 px-1 outline-none min-w-[200px]"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span>(ग) व्यवसाय</span>
                      <input
                        type="text"
                        value={formData.profession || formData.occupation || ""}
                        onChange={(e) => handleFieldChange("profession", e.target.value)}
                        placeholder="...................................................."
                        className="font-bold text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border-b border-dotted border-slate-700 px-1 outline-none min-w-[200px]"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span>(घ) आय वर्ग</span>
                      <input
                        type="text"
                        value={formData.incomeGroup || ""}
                        onChange={(e) => handleFieldChange("incomeGroup", e.target.value)}
                        placeholder="...................................................."
                        className="font-bold text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border-b border-dotted border-slate-700 px-1 outline-none min-w-[200px]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* PAGE 4 CONTAINER */}
              <div className="bg-white border-2 border-slate-300 rounded-xl p-6 sm:p-10 shadow-sm space-y-5">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-xs font-black uppercase tracking-wider text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-1 rounded-md">
                    पृष्ठ 4 / 4: जोखिम मूल्यांकन एवं केवल मोहर्र थाना के प्रयोग हेतू
                  </span>
                  <span className="font-mono text-xs font-bold text-slate-700">फार्म संख्या 26.8(1)</span>
                </div>

                {/* Point 4 */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <span>4.</span>
                    <span>जांच पडताल एंव ज्ञात पुलिस रिकार्ड के आधार पर ,क्या गिरफ्तार व्यक्ति:</span>
                  </div>

                  <div className="pl-5 space-y-1.5 text-xs">
                    {[
                      { key: "isDangerous", label: "(क) खतरनाक है :" },
                      { key: "isBailJumped", label: "(ख) पूर्व में किसी जमानत से बच निकला है :" },
                      { key: "usuallyCarriesArms", label: "(ग) आमतौर पर शस्त्र रखता है :" },
                      { key: "activeWithGang", label: "(घ) सहयोगियो सहित क्रियाशील है :" },
                      { key: "isKnownListedCriminal", label: "(ङ) ज्ञात/ सूचिबद्ध अपराधी है या नही:" },
                      { key: "isHabitualOffender", label: "(च) आदतन अपराधी है या नही:" },
                      { key: "isLikelyToEscapeBail", label: "(छ) जमानत के दौरान बच निकलने की सम्भावना है:" },
                      { key: "isLikelyToThreatenOrRepeat", label: "(ज) जमानत पर रिहा होने के बाद अपराध करने या पीडितो / गवाहो को धमकाने की सम्भावना है :" },
                    ].map((item) => {
                      const val = (formData as any)[item.key] || "नही";
                      return (
                        <div key={item.key} className="flex items-center justify-between max-w-xl py-0.5 border-b border-slate-100">
                          <span>{item.label}</span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleFieldChange(item.key as any, "हाँ")}
                              className={`px-2.5 py-0.5 rounded text-[11px] font-bold border transition-colors ${
                                val === "हाँ" ? "bg-red-600 text-white border-red-600" : "bg-white text-slate-700 border-slate-300"
                              }`}
                            >
                              हाँ
                            </button>
                            <button
                              type="button"
                              onClick={() => handleFieldChange(item.key as any, "नही")}
                              className={`px-2.5 py-0.5 rounded text-[11px] font-bold border transition-colors ${
                                val === "नही" ? "bg-slate-700 text-white border-slate-700" : "bg-white text-slate-700 border-slate-300"
                              }`}
                            >
                              नही
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    <div className="flex items-center gap-2 pt-1">
                      <span>(झ) किसी अन्य अपराध में वांछित है :</span>
                      <input
                        type="text"
                        value={formData.wantedInOtherCrime || ""}
                        onChange={(e) => handleFieldChange("wantedInOtherCrime", e.target.value)}
                        placeholder="................................................................"
                        className="font-bold text-slate-950 bg-transparent border-b border-dotted border-slate-700 px-1 outline-none flex-1 max-w-md"
                      />
                    </div>

                    <div className="pt-2 text-slate-800 leading-relaxed">
                      <p>यदि ख,ङ, अथवा झ का उत्तर हाँ है तो मामला संदर्भ / धाराओ का उल्लेख करे , यदि आवश्यक हो तो अलग से पृष्ठ नत्थी करें</p>
                      <input
                        type="text"
                        value={formData.riskNotesRemarks || ""}
                        onChange={(e) => handleFieldChange("riskNotesRemarks", e.target.value)}
                        placeholder="................................................................................................"
                        className="w-full font-bold text-slate-950 bg-transparent border-b border-dotted border-slate-700 px-1 outline-none mt-1"
                      />
                    </div>
                  </div>
                </div>

                {/* Signatures on Page 4 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 text-xs">
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold">स्थान</span>
                      <input
                        type="text"
                        value={formData.ioSignPlaceP4 || formData.ioSignPlace || formData.district || ""}
                        onChange={(e) => handleFieldChange("ioSignPlaceP4", e.target.value)}
                        placeholder="...................."
                        className="font-bold text-slate-950 bg-transparent border-b border-dotted border-slate-700 px-1 outline-none w-36"
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold">दिनांक</span>
                      <input
                        type="text"
                        value={formData.ioSignDateP4 || formData.ioSignDate || formData.issueDate || ""}
                        onChange={(e) => handleFieldChange("ioSignDateP4", e.target.value)}
                        placeholder="...................."
                        className="font-bold text-slate-950 bg-transparent border-b border-dotted border-slate-700 px-1 outline-none w-36"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 pl-0 sm:pl-8">
                    <p className="font-bold">जांच अधिकारी के हस्ताक्षर</p>
                    <div className="flex items-center gap-1.5">
                      <span>नाम</span>
                      <input
                        type="text"
                        value={formData.ioNameP4 || formData.officerName || ""}
                        onChange={(e) => handleFieldChange("ioNameP4", e.target.value)}
                        placeholder="...................................."
                        className="font-bold text-slate-950 bg-transparent border-b border-dotted border-slate-700 px-1 outline-none flex-1"
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span>पद</span>
                      <input
                        type="text"
                        value={formData.ioRankP4 || formData.officerRank || ""}
                        onChange={(e) => handleFieldChange("ioRankP4", e.target.value)}
                        placeholder="...................."
                        className="font-bold text-slate-950 bg-transparent border-b border-dotted border-slate-700 px-1 outline-none flex-1"
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span>नम्बर</span>
                      <input
                        type="text"
                        value={formData.ioBeltNoP4 || formData.officerPno || formData.officerBeltNo || ""}
                        onChange={(e) => handleFieldChange("ioBeltNoP4", e.target.value)}
                        placeholder="...................."
                        className="font-bold text-slate-950 bg-transparent border-b border-dotted border-slate-700 px-1 outline-none flex-1"
                      />
                    </div>
                  </div>
                </div>

                {/* केवल मोहर्र थाना के प्रयोग हेतू */}
                <div className="pt-6 border-t-2 border-slate-900 space-y-3">
                  <h4 className="font-bold text-sm underline text-slate-950">केवल मोहर्र थाना के प्रयोग हेतू :</h4>

                  {/* Point 5 */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold">
                      <span>5.</span>
                      <span>आरोपी का पूर्व आपराधिक रिकार्ड : (ICJS /Eagle /गृह थाना के रिकॉर्ड अनुसार )</span>
                    </div>
                    <div className="pl-5 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="w-6 font-bold">(i)</span>
                        <input
                          type="text"
                          value={formData.priorRecord1 || ""}
                          onChange={(e) => handleFieldChange("priorRecord1", e.target.value)}
                          placeholder="................................................................................................"
                          className="w-full font-bold text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border-b border-dotted border-slate-700 px-1 outline-none"
                        />
                      </div>
                      <div className="pl-6 text-slate-500 font-bold">-</div>
                      <div className="flex items-center gap-2">
                        <span className="w-6 font-bold">(ii)</span>
                        <input
                          type="text"
                          value={formData.priorRecord2 || ""}
                          onChange={(e) => handleFieldChange("priorRecord2", e.target.value)}
                          placeholder="................................................................................................"
                          className="w-full font-bold text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border-b border-dotted border-slate-700 px-1 outline-none"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-6 font-bold">(iii)</span>
                        <input
                          type="text"
                          value={formData.priorRecord3 || ""}
                          onChange={(e) => handleFieldChange("priorRecord3", e.target.value)}
                          placeholder="................................................................................................"
                          className="w-full font-bold text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border-b border-dotted border-slate-700 px-1 outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Point 6 */}
                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    <span className="font-bold">6.</span>
                    <span className="font-bold">Eagle Software अनुसार अपराधी का Criminal ID No.-------------------------</span>
                    <input
                      type="text"
                      value={formData.eagleCriminalId || ""}
                      onChange={(e) => handleFieldChange("eagleCriminalId", e.target.value)}
                      placeholder="EAGLE-ID..."
                      className="font-mono font-bold text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border-b border-dotted border-slate-700 px-1 outline-none w-60"
                    />
                  </div>

                  {/* मोहर्र थाना के हस्ताक्षर */}
                  <div className="pt-4 text-right space-y-1 text-xs">
                    <p className="font-bold">मोहर्र थाना के हस्ताक्षर</p>
                    <div className="flex items-center justify-end gap-1.5">
                      <span>नाम</span>
                      <input
                        type="text"
                        value={formData.mhcName || ""}
                        onChange={(e) => handleFieldChange("mhcName", e.target.value)}
                        placeholder="...................................."
                        className="font-bold text-slate-950 bg-transparent border-b border-dotted border-slate-700 px-1 outline-none w-48 text-right"
                      />
                    </div>
                    <div className="flex items-center justify-end gap-1.5">
                      <span>पद</span>
                      <input
                        type="text"
                        value={formData.mhcRank || ""}
                        onChange={(e) => handleFieldChange("mhcRank", e.target.value)}
                        placeholder="...................."
                        className="font-bold text-slate-950 bg-transparent border-b border-dotted border-slate-700 px-1 outline-none w-48 text-right"
                      />
                    </div>
                    <div className="flex items-center justify-end gap-1.5">
                      <span>नम्बर</span>
                      <input
                        type="text"
                        value={formData.mhcBeltNumber || ""}
                        onChange={(e) => handleFieldChange("mhcBeltNumber", e.target.value)}
                        placeholder="...................."
                        className="font-bold text-slate-950 bg-transparent border-b border-dotted border-slate-700 px-1 outline-none w-48 text-right"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= TEMPLATE 4: NATGRID PERFORMA (EXACT OFFICIAL LAYOUT) ================= */}
          {activeTemplate === "natgrid_proforma" && (
            <div className="space-y-4 text-slate-950 font-serif">
              {/* Centered Heading: NATGRID PERFORMA (Bold, Underlined) */}
              <div className="text-center pt-2 pb-2">
                <input
                  type="text"
                  value={formData.docTitle || "NATGRID PERFORMA"}
                  onChange={(e) => handleFieldChange("docTitle", e.target.value)}
                  className="font-bold text-slate-950 underline underline-offset-4 text-base sm:text-lg text-center bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent hover:border-slate-300 focus:border-blue-500 rounded px-2 py-0.5 outline-none tracking-wide"
                  placeholder="NATGRID PERFORMA"
                />
              </div>

              {/* Official 12-Row Bordered Table matching media_1791335774032.png */}
              <div className="border-[1.5px] border-slate-950 rounded-none overflow-hidden">
                <table className="w-full border-collapse text-xs sm:text-[13px] text-slate-950">
                  <tbody>
                    {/* Row 1: Name of Incharge Unit/SHO (with Rank) */}
                    <tr className="border-b border-slate-950">
                      <td className="w-[28%] p-2 font-medium border-r border-slate-950 align-top leading-tight">
                        Name of Incharge<br />Unit/SHO (with<br />Rank)
                      </td>
                      <td colSpan={3} className="p-2 align-top">
                        <input
                          type="text"
                          value={formData.shoName || ""}
                          onChange={(e) => handleFieldChange("shoName", e.target.value)}
                          placeholder="Inspector, SHO"
                          className="w-full font-medium text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-blue-500 rounded px-1.5 py-0.5 outline-none"
                        />
                      </td>
                    </tr>

                    {/* Row 2: Mobile No. */}
                    <tr className="border-b border-slate-950">
                      <td className="p-2 font-medium border-r border-slate-950 align-top">
                        Mobile No.
                      </td>
                      <td colSpan={3} className="p-2 align-top">
                        <input
                          type="text"
                          value={formData.shoPhone || ""}
                          onChange={(e) => handleFieldChange("shoPhone", e.target.value)}
                          placeholder="SHO Mobile Number"
                          className="w-full font-medium text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-blue-500 rounded px-1.5 py-0.5 outline-none"
                        />
                      </td>
                    </tr>

                    {/* Row 3: Govt. Email ID */}
                    <tr className="border-b border-slate-950">
                      <td className="p-2 font-medium border-r border-slate-950 align-top">
                        Govt. Email ID
                      </td>
                      <td colSpan={3} className="p-2 align-top">
                        <input
                          type="text"
                          value={formData.shoEmail || ""}
                          onChange={(e) => handleFieldChange("shoEmail", e.target.value)}
                          placeholder="Official Govt Email ID"
                          className="w-full font-medium text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-blue-500 rounded px-1.5 py-0.5 outline-none"
                        />
                      </td>
                    </tr>

                    {/* Row 4: FIR No. | Date :- | P.S. | District Sirsa */}
                    <tr className="border-b border-slate-950">
                      <td className="w-[28%] p-2 border-r border-slate-950 align-top">
                        <div className="flex items-center gap-1 font-bold">
                          <span className="whitespace-nowrap">FIR No.</span>
                          <input
                            type="text"
                            value={formData.complaintNo || ""}
                            onChange={(e) => handleFieldChange("complaintNo", e.target.value)}
                            placeholder="184/2026"
                            className="w-full font-normal text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-blue-500 rounded px-1 py-0.5 outline-none"
                          />
                        </div>
                      </td>
                      <td className="w-[24%] p-2 border-r border-slate-950 align-top">
                        <div className="flex items-center gap-1 font-bold">
                          <span className="whitespace-nowrap">Date :-</span>
                          <input
                            type="text"
                            value={formData.incidentDate || formData.issueDate || ""}
                            onChange={(e) => handleFieldChange("incidentDate", e.target.value)}
                            placeholder="24-09-2026"
                            className="w-full font-normal text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-blue-500 rounded px-1 py-0.5 outline-none"
                          />
                        </div>
                      </td>
                      <td className="w-[24%] p-2 border-r border-slate-950 align-top">
                        <div className="flex items-center gap-1 font-bold">
                          <span className="whitespace-nowrap">P.S.</span>
                          <input
                            type="text"
                            value={formData.policeStation || ""}
                            onChange={(e) => handleFieldChange("policeStation", e.target.value)}
                            placeholder="City Sirsa"
                            className="w-full font-normal text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-blue-500 rounded px-1 py-0.5 outline-none"
                          />
                        </div>
                      </td>
                      <td className="w-[24%] p-2 align-top">
                        <div className="flex items-center gap-1 font-bold">
                          <span className="whitespace-nowrap">District</span>
                          <input
                            type="text"
                            value={formData.district || "Sirsa"}
                            onChange={(e) => handleFieldChange("district", e.target.value)}
                            placeholder="Sirsa"
                            className="w-full font-normal text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-blue-500 rounded px-1 py-0.5 outline-none"
                          />
                        </div>
                      </td>
                    </tr>

                    {/* Row 5: Offence U/s */}
                    <tr className="border-b border-slate-950">
                      <td colSpan={4} className="p-2 align-top">
                        <div className="flex items-center gap-1 font-bold">
                          <span className="whitespace-nowrap">Offence U/s</span>
                          <input
                            type="text"
                            value={formData.sectionsOfLaw || ""}
                            onChange={(e) => handleFieldChange("sectionsOfLaw", e.target.value)}
                            placeholder="Section 318(4), 316(2), 336(3), 61(2) BNS, 2023 & Sec 66D IT Act"
                            className="w-full font-normal text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-blue-500 rounded px-1.5 py-0.5 outline-none"
                          />
                        </div>
                      </td>
                    </tr>

                    {/* Row 6: Brief summary of case :- "" */}
                    <tr className="border-b border-slate-950">
                      <td colSpan={4} className="p-2 align-top space-y-1">
                        <div className="font-bold text-slate-950">
                          Brief summary of case :- &ldquo;&rdquo;
                        </div>
                        <textarea
                          rows={3}
                          value={formData.allegationsBrief || ""}
                          onChange={(e) => handleFieldChange("allegationsBrief", e.target.value)}
                          placeholder="Organized financial fraud and inter-state syndicate cheating victims..."
                          className="w-full font-sans text-xs text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-blue-500 rounded p-1.5 outline-none leading-relaxed"
                        />
                      </td>
                    </tr>

                    {/* Row 7: Name/Rank of I.O. with Mobile No :- */}
                    <tr className="border-b border-slate-950">
                      <td colSpan={4} className="p-2 align-top">
                        <div className="flex flex-wrap items-center gap-1 font-bold text-slate-950">
                          <span className="whitespace-nowrap">Name/Rank of I.O. with Mobile No :-</span>
                          <input
                            type="text"
                            value={formData.officerName || ""}
                            onChange={(e) => handleFieldChange("officerName", e.target.value)}
                            placeholder="Surender Pal"
                            className="font-normal text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-blue-500 rounded px-1.5 py-0.5 outline-none w-36"
                          />
                          <span className="font-normal">/</span>
                          <input
                            type="text"
                            value={formData.officerRank || ""}
                            onChange={(e) => handleFieldChange("officerRank", e.target.value)}
                            placeholder="Sub-Inspector"
                            className="font-normal text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-blue-500 rounded px-1.5 py-0.5 outline-none w-32"
                          />
                          <span className="font-normal">, Mob:</span>
                          <input
                            type="text"
                            value={formData.officerPhone || ""}
                            onChange={(e) => handleFieldChange("officerPhone", e.target.value)}
                            placeholder="9812034567"
                            className="font-normal text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-blue-500 rounded px-1.5 py-0.5 outline-none w-32"
                          />
                        </div>
                      </td>
                    </tr>

                    {/* Row 8: For what reason/purpose this case is related to */}
                    <tr className="border-b border-slate-950">
                      <td colSpan={3} className="p-2.5 border-r border-slate-950 align-middle">
                        <div className="font-medium text-slate-950 mb-1">
                          For what reason/purpose this case is related to
                        </div>
                        <div className="space-y-1 pl-1 text-slate-950 leading-relaxed font-normal">
                          <div>1.&nbsp;&nbsp;National security</div>
                          <div>2.&nbsp;&nbsp;Counter terror</div>
                          <div>3.&nbsp;&nbsp;Heinous Crime (Punishment should be 7 years or more)</div>
                        </div>
                      </td>
                      <td className="p-2.5 align-middle text-center">
                        <div className="flex flex-col items-center justify-around h-full py-1 gap-2.5">
                          <label className="flex items-center justify-center cursor-pointer" title="National security">
                            <input
                              type="checkbox"
                              checked={!!formData.natgridNationalSecurity}
                              onChange={(e) => handleFieldChange("natgridNationalSecurity", e.target.checked)}
                              className="w-5 h-4 rounded-none border-[1.5px] border-slate-950 cursor-pointer accent-blue-900"
                            />
                          </label>
                          <label className="flex items-center justify-center cursor-pointer" title="Counter terror">
                            <input
                              type="checkbox"
                              checked={!!formData.natgridCounterTerror}
                              onChange={(e) => handleFieldChange("natgridCounterTerror", e.target.checked)}
                              className="w-5 h-4 rounded-none border-[1.5px] border-slate-950 cursor-pointer accent-blue-900"
                            />
                          </label>
                          <label className="flex items-center justify-center cursor-pointer" title="Heinous Crime">
                            <input
                              type="checkbox"
                              checked={formData.natgridHeinousCrime !== false}
                              onChange={(e) => handleFieldChange("natgridHeinousCrime", e.target.checked)}
                              className="w-5 h-4 rounded-none border-[1.5px] border-slate-950 cursor-pointer accent-blue-900"
                            />
                          </label>
                        </div>
                      </td>
                    </tr>

                    {/* Row 9: Explain along with a Valid Reason :- To apprehend the accused */}
                    <tr className="border-b border-slate-950">
                      <td colSpan={4} className="p-2 align-top">
                        <div className="flex items-center gap-1 font-bold text-slate-950">
                          <span className="whitespace-nowrap">Explain along with a Valid Reason :-</span>
                          <input
                            type="text"
                            value={formData.natgridReason || "To apprehend the accused"}
                            onChange={(e) => handleFieldChange("natgridReason", e.target.value)}
                            placeholder="To apprehend the accused"
                            className="w-full font-normal text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-blue-500 rounded px-1.5 py-0.5 outline-none"
                          />
                        </div>
                      </td>
                    </tr>

                    {/* Row 10: Name of Department from which Information is required:- */}
                    <tr className="border-b border-slate-950">
                      <td colSpan={4} className="p-2 align-top">
                        <div className="flex items-center gap-1 font-bold text-slate-950">
                          <span className="whitespace-nowrap">Name of Department from which Information is required:-</span>
                          <input
                            type="text"
                            value={formData.natgridDepartment || ""}
                            onChange={(e) => handleFieldChange("natgridDepartment", e.target.value)}
                            placeholder="FIU-IND, Bureau of Immigration (BOI), Telecom Providers, Income Tax PAN Database"
                            className="w-full font-normal text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-blue-500 rounded px-1.5 py-0.5 outline-none"
                          />
                        </div>
                      </td>
                    </tr>

                    {/* Row 11: What type of information is required? */}
                    <tr className="border-b border-slate-950">
                      <td colSpan={4} className="p-2 align-top space-y-1">
                        <div className="font-bold text-slate-950">
                          What type of information is required?
                        </div>
                        <textarea
                          rows={2}
                          value={formData.natgridInfoRequired || ""}
                          onChange={(e) => handleFieldChange("natgridInfoRequired", e.target.value)}
                          placeholder="All bank accounts linked to PAN/Aadhaar, domestic/international travel history, active registered mobile connections..."
                          className="w-full font-sans text-xs text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-blue-500 rounded p-1.5 outline-none leading-relaxed"
                        />
                      </td>
                    </tr>

                    {/* Row 12: Information available at your end:- */}
                    <tr>
                      <td colSpan={4} className="p-2.5 align-top space-y-1.5 text-slate-950">
                        <div className="font-bold text-slate-950">
                          Information available at your end:-
                        </div>

                        <div className="flex items-center gap-1 font-medium">
                          <span className="whitespace-nowrap w-44">Name –</span>
                          <input
                            type="text"
                            value={formData.noticeeName || ""}
                            onChange={(e) => handleFieldChange("noticeeName", e.target.value)}
                            placeholder="Vikas Sharma"
                            className="w-full font-normal text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-blue-500 rounded px-1.5 py-0.5 outline-none"
                          />
                        </div>

                        <div className="flex items-center gap-1 font-medium">
                          <span className="whitespace-nowrap w-44">Father Name –</span>
                          <input
                            type="text"
                            value={formData.noticeeFather || ""}
                            onChange={(e) => handleFieldChange("noticeeFather", e.target.value)}
                            placeholder="Ramesh Chand Sharma"
                            className="w-full font-normal text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-blue-500 rounded px-1.5 py-0.5 outline-none"
                          />
                        </div>

                        <div className="flex items-center gap-1 font-medium">
                          <span className="whitespace-nowrap w-44">Address –</span>
                          <input
                            type="text"
                            value={formData.noticeeAddress || ""}
                            onChange={(e) => handleFieldChange("noticeeAddress", e.target.value)}
                            placeholder="House No. 412, Sector 7, Urban Estate, Sirsa, Haryana"
                            className="w-full font-normal text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-blue-500 rounded px-1.5 py-0.5 outline-none"
                          />
                        </div>

                        <div className="flex items-center gap-1 font-medium">
                          <span className="whitespace-nowrap w-44">Date of Birth –</span>
                          <input
                            type="text"
                            value={formData.noticeeDob || formData.appearanceDate || ""}
                            onChange={(e) => {
                              handleFieldChange("noticeeDob", e.target.value);
                              handleFieldChange("appearanceDate", e.target.value);
                            }}
                            placeholder="14-08-1988"
                            className="w-full font-normal text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-blue-500 rounded px-1.5 py-0.5 outline-none"
                          />
                        </div>

                        <div className="flex items-center gap-1 font-medium">
                          <span className="whitespace-nowrap w-44">Mobile No. –</span>
                          <input
                            type="text"
                            value={formData.noticeePhone || ""}
                            onChange={(e) => handleFieldChange("noticeePhone", e.target.value)}
                            placeholder="9812044551, 9416022331"
                            className="w-full font-normal text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-blue-500 rounded px-1.5 py-0.5 outline-none"
                          />
                        </div>

                        <div className="flex items-center gap-1 font-medium">
                          <span className="whitespace-nowrap w-44">Aadhar No. –</span>
                          <input
                            type="text"
                            value={formData.accusedAadhaar || ""}
                            onChange={(e) => handleFieldChange("accusedAadhaar", e.target.value)}
                            placeholder="8492-3810-4921"
                            className="w-full font-normal text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-blue-500 rounded px-1.5 py-0.5 outline-none"
                          />
                        </div>

                        <div className="flex items-center gap-1 font-medium">
                          <span className="whitespace-nowrap w-44">PAN -</span>
                          <input
                            type="text"
                            value={formData.accusedPan || ""}
                            onChange={(e) => handleFieldChange("accusedPan", e.target.value)}
                            placeholder="ABCPS1234F"
                            className="w-full font-normal text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-blue-500 rounded px-1.5 py-0.5 outline-none"
                          />
                        </div>

                        <div className="flex items-center gap-1 font-medium">
                          <span className="whitespace-nowrap w-44">Any other information-</span>
                          <input
                            type="text"
                            value={formData.natgridOtherInfo || formData.documentsRequired || ""}
                            onChange={(e) => {
                              handleFieldChange("natgridOtherInfo", e.target.value);
                              handleFieldChange("documentsRequired", e.target.value);
                            }}
                            placeholder="Passport No. Z4920194, Vehicle No. HR-24-AK-5521"
                            className="w-full font-normal text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-blue-500 rounded px-1.5 py-0.5 outline-none"
                          />
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Bottom Right Signature matching media_1791335774032.png */}
              {showSignatures && (
                <div className="pt-12 sm:pt-16 flex justify-end pr-4 text-slate-950 font-serif">
                  <div className="text-left space-y-1 text-xs sm:text-sm font-bold">
                    <p>Signature of Incharge/SHO</p>
                    <p>With Seal/Stamp</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= UPLOADED CUSTOM PROFORMA VIEW ================= */}
          {isCustomUploaded && (
            <div className="space-y-6">
              <div className="text-center my-3">
                <h1 className="text-base sm:text-lg font-black uppercase tracking-wide underline underline-offset-4 text-slate-950">
                  {formData.dispatchNo || customTemplates[activeTemplate]?.name || "CUSTOM POLICE PROFORMA"}
                </h1>
                <p className="text-xs text-slate-600 mt-1">
                  {formData.sectionsOfLaw || "Dynamic Official Police Proforma (Fully Editable Format)"}
                </p>
              </div>

              {/* Header Box */}
              <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-purple-950">Document Title / Ref:</span>
                  <input
                    type="text"
                    value={formData.dispatchNo}
                    onChange={(e) => handleFieldChange("dispatchNo", e.target.value)}
                    className="font-mono font-bold text-purple-900 bg-white border border-purple-300 px-2 py-0.5 rounded"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-purple-950">Date:</span>
                  <input
                    type="text"
                    value={formData.issueDate}
                    onChange={(e) => handleFieldChange("issueDate", e.target.value)}
                    className="font-semibold text-slate-800 bg-white border border-purple-300 rounded px-2 py-0.5 w-32 text-center"
                  />
                </div>
              </div>

              {/* Recipient / Noticee Section */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                <p className="font-bold text-slate-900 uppercase">Concerned Person / Entity Particulars:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={formData.noticeeName}
                    onChange={(e) => handleFieldChange("noticeeName", e.target.value)}
                    placeholder="Name"
                    className="bg-white border border-slate-300 rounded px-2 py-1 font-bold"
                  />
                  <input
                    type="text"
                    value={formData.noticeeAddress}
                    onChange={(e) => handleFieldChange("noticeeAddress", e.target.value)}
                    placeholder="Address"
                    className="bg-white border border-slate-300 rounded px-2 py-1"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ================= DYNAMIC CLAUSES & CUSTOM SECTIONS (FOR EDITABLE TEMPLATES) ================= */}
          {activeTemplate !== "cdr_requisition" && activeTemplate !== "haryana_notice" && activeTemplate !== "natgrid_proforma" && (
            <div className="pt-4 border-t border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-purple-600" />
                  Additional Editable Clauses &amp; Sections ({customClauses.length}):
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddClause()}
                  className="text-xs bg-purple-50 hover:bg-purple-100 text-purple-900 border-purple-300 font-bold gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Clause / Section</span>
                </Button>
              </div>

              {customClauses.map((clause, index) => (
                <div
                  key={clause.id}
                  className="p-3.5 bg-slate-50 border border-slate-300 rounded-xl space-y-2 text-xs animate-in fade-in-50"
                >
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="text"
                      value={clause.title}
                      onChange={(e) => handleUpdateClauseTitle(clause.id, e.target.value)}
                      className="font-bold text-slate-900 bg-white border border-slate-300 rounded px-2 py-1 flex-1 uppercase tracking-wide"
                    />
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleMoveClause(index, "up")}
                        disabled={index === 0}
                        className="p-1 text-slate-500 hover:text-slate-900 disabled:opacity-30"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveClause(index, "down")}
                        disabled={index === customClauses.length - 1}
                        className="p-1 text-slate-500 hover:text-slate-900 disabled:opacity-30"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteClause(clause.id)}
                        className="p-1 text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <textarea
                    rows={2}
                    value={clause.content}
                    onChange={(e) => handleUpdateClauseContent(clause.id, e.target.value)}
                    className="w-full text-slate-900 bg-white border border-slate-300 rounded p-2 text-xs leading-relaxed"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom Save Bar (Always Available) */}
        <div className="no-print p-4 bg-white border border-slate-200 rounded-xl shadow-md flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ScrollText className="w-5 h-5 text-purple-600" />
            <div>
              <p className="text-xs font-bold text-slate-900">
                {complaint
                  ? `Save document to Complaint ${complaint.complaintNumber}?`
                  : "Save this notice directly to a Complaint Docket"}
              </p>
              <p className="text-[11px] text-slate-500">
                {complaint
                  ? "Persists the formatted legal document into the complaint's Documents docket."
                  : "Select a complaint from the system to attach this generated legal notice."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPreviewModalOpen(true)}
              className="text-xs border-slate-300 gap-1.5"
            >
              <Eye className="w-3.5 h-3.5 text-blue-600" />
              <span>Preview</span>
            </Button>

            {complaint ? (
              <Link href={`/complaints/${complaint.id}`}>
                <Button variant="outline" size="sm" className="text-xs">
                  Back
                </Button>
              </Link>
            ) : null}

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
              className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5"
            >
              {saveSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{saveLoading ? "Saving..." : complaint ? "Save to Complaint" : "Save to Complaint..."}</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )}

        {/* ================= PREVIEW NOTICE MODAL ================= */}
        {previewModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in-50">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
              <div className="p-4 bg-[#0b192c] text-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-blue-400" />
                  <div>
                    <h3 className="font-bold text-sm">Official Legal Notice Preview</h3>
                    <p className="text-[11px] text-slate-300">
                      Print-ready A4 document view ({activeTemplate.replace(/_/g, " ").toUpperCase()})
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleDownloadNotice}
                    className="text-xs font-semibold bg-white/10 text-white hover:bg-white/20 border-white/20"
                  >
                    <Download className="w-3.5 h-3.5 mr-1" />
                    Download
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => window.print()}
                    className="text-xs font-semibold bg-white/10 text-white hover:bg-white/20 border-white/20"
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
                  srcDoc={generateNoticeDocumentHtml(getEffectiveFormData() as any, activeTemplate, customClauses)}
                  title="Notice Preview"
                  className="w-full h-[70vh] rounded-xl border border-slate-300 bg-white shadow-xs"
                />
              </div>

              <div className="p-3 bg-white border-t border-slate-200 flex items-center justify-between text-xs shrink-0">
                <span className="text-slate-500">
                  {complaint ? `Linked to ${complaint.complaintNumber}` : "Standalone preview - not yet saved to complaint"}
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
                    Save to Complaint
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= SELECT COMPLAINT MODAL ================= */}
        {selectComplaintModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in-50">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden">
              <div className="p-4 bg-[#0b192c] text-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <Save className="w-5 h-5 text-emerald-400" />
                  <div>
                    <h3 className="font-bold text-sm">Save Notice to Complaint</h3>
                    <p className="text-[11px] text-slate-300">Choose which complaint docket to save this document to:</p>
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
