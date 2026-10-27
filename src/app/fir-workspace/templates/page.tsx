"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Printer,
  Copy,
  Check,
  Shield,
  FileText,
  Download,
  FileCheck2,
  User,
  Phone,
  ArrowLeft,
  Plus,
  Trash2,
  Scale,
  X,
  RotateCcw,
  Layers,
  Save,
  Loader2,
  CheckCircle2,
  Clock,
  Globe,
  Languages,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { Button } from "@/components/ui/button";
import { firService } from "@/services/firService";
import { FIRItem, NoticeFormData, FIRDocumentItem, FIRTimelineEvent, FIRAuditRecord } from "@/types";
import { universalEvidenceService } from "@/services/universalEvidenceService";
import { evidenceBlobStore } from "@/services/evidenceBlobStore";
import { GeneralDiaryService } from "@/services/generalDiaryService";
import { FIRWorkspaceNav } from "@/components/fir-workspace/FIRWorkspaceNav";
import { VoiceInputButton } from "@/components/ui/voice-input-button";
import { formatDate } from "@/lib/utils";
import { printA4Element, downloadA4DocumentAsHtml } from "@/utils/printElement";
import {
  useTableResize,
  TableColResizer,
  TableRowResizer,
  TableResizeToolbar,
} from "@/components/fir-workspace/TableResizeHelper";

export type FIRNoticeTemplateType =
  | "section_35_notice"
  | "cdr_requisition"
  | "natgrid_proforma"
  | "section_179_witness";

export type TemplateLanguage = "hi" | "en";

export const DEFAULT_SAMPLE_DATA_HI: Record<FIRNoticeTemplateType, NoticeFormData> = {
  section_35_notice: {
    headerDept: "हरियाणा पुलिस",
    headerGovt: "जिला अम्बाला।",
    docTitle: "सूचना-पत्र (धारा 35(3) BNSS)",
    docSubTitle: "Notice of Appearance under Section 35(3) Bharatiya Nagarik Suraksha Sanhita, 2023",
    recipientDesignation: "",
    dispatchNo: "",
    policeStation: "शहर अम्बाला",
    district: "अम्बाला",
    issueDate: formatDate(new Date()),

    noticeeName: "",
    noticeeFather: "",
    noticeeAge: "",
    noticeeAddress: "",
    noticeePhone: "",
    noticeeRole: "अभियुक्त / आरोपी (Accused)",

    complaintNo: "128/2026",
    complainantName: "",
    complainantAddress: "",
    incidentDate: formatDate(new Date()),
    sectionsOfLaw: "धारा 318(4), 316(2) BNS",
    allegationsBrief:
      "उपरोक्त अभियोग में आपके विरुद्ध संज्ञेय अपराध के संबंध में उचित साक्ष्य एवं संदेह पाया गया है। तदनुसार अनुसंधान में शामिल होकर अपना पक्ष प्रस्तुत करने हेतु यह नोटिस जारी किया जाता है।",

    groundsBrief: "अनुसंधान में सहयोग एवं साक्ष्यों का परीक्षण करने हेतु।",
    appearanceDate: formatDate(new Date(Date.now() + 2 * 86400000)),
    appearanceTime: "11:00 AM",
    appearancePlace: "कार्यालय अनुसंधान अधिकारी, थाना शहर अम्बाला",
    documentsRequired: "पहचान पत्र (आधार कार्ड/पैन कार्ड), पते का प्रमाण एवं अभियोग से संबंधित आवश्यक दस्तावेज।",
    statutoryClarification:
      "यदि आप उक्त तिथि व समय पर उपस्थित नहीं होते हैं अथवा नोटिस की शर्तों का पालन करने में विफल रहते हैं, तो धारा 35(6) BNSS के तहत सक्षम न्यायालय के आदेश पर आपकी गिरफ्तारी की जा सकती है।",

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
    issueDate: formatDate(new Date()),

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
      "1. उपभोक्ता की पहचान सुनिश्चित कर ली गई है और यह आश्वस्त किया जाता है कि संबंधित व्यक्ति की काल डिटेल संवेदनशील प्रकृति की नहीं है।\n2. यह नंबर किसी आसीन सांसद / विधायक / विधान पार्षद अथवा राज्यपाल के नाम पर पंजीकृत नहीं है।",
  },

  natgrid_proforma: {
    headerDept: "हरियाणा पुलिस",
    headerGovt: "राष्ट्रीय आसूचना ग्रिड",
    docTitle: "राष्ट्रीय आसूचना ग्रिड (NATGRID) प्रपत्र",
    docSubTitle: "",
    dispatchNo: "HP/SRS/2026/NATGRID-012",
    policeStation: "City Sirsa",
    district: "Sirsa",
    issueDate: new Date().toISOString().split("T")[0],

    shoName: "निरीक्षक, प्रबंधक अफसर (SHO)",
    shoPhone: "9812033441",
    shoEmail: "sho.citysirsa-hry@nic.in",

    complaintNo: "184/2026",
    incidentDate: "24-09-2026",
    sectionsOfLaw: "धारा 318(4), 316(2), 336(3), 61(2) BNS, 2023 व धारा 66D IT Act",
    allegationsBrief: "संगठित वित्तीय धोखाधड़ी और अंतर-राज्यीय साइबर गिरोह द्वारा फर्जी बैंकिंग चैनलों व शेल कंपनियों के जरिए पीड़ितों से ठगी करने बाबत।",

    officerName: "सुरेन्द्र पाल",
    officerRank: "सब-इंस्पेक्टर",
    officerPhone: "9812034567",
    officerPno: "PNO-23841",

    natgridNationalSecurity: false,
    natgridCounterTerror: false,
    natgridHeinousCrime: true,
    natgridReason: "आरोपी को गिरफ्तार करने व साक्ष्य एकत्र करने हेतु",
    natgridDepartment: "FIU-IND, आप्रवासन ब्यूरो (BOI), टेलीकॉम सेवा प्रदाता, आयकर पैन डेटाबेस",
    natgridInfoRequired: "पैन/आधार से जुड़े सभी बैंक खाते, घरेलू/अंतरराष्ट्रीय यात्रा इतिहास, सक्रिय पंजीकृत मोबाइल नंबर व वाहन स्वामित्व विवरण।",

    noticeeAge: "38 वर्ष",
    noticeeRole: "संदेही / अभियुक्त",
    complainantName: "पुलिस अधीक्षक सिरसा",
    appearanceDate: "14-08-1988",
    appearanceTime: "All Databases",
    appearancePlace: "CCTNS & National Intelligence Grid Central Portal",
    documentsRequired: "Passport No. Z4920194, Vehicle No. HR-24-AK-5521",

    noticeeName: "विकास शर्मा",
    noticeeFather: "रमेश चंद शर्मा",
    noticeeAddress: "मकान नं. 412, सेक्टर 7, अर्बन एस्टेट, सिरसा, हरियाणा",
    noticeeDob: "14-08-1988",
    noticeePhone: "9812044551, 9416022331",
    accusedAadhaar: "8492-3810-4921",
    accusedPan: "ABCPS1234F",
    natgridOtherInfo: "पासपोर्ट सं. Z4920194, वाहन सं. HR-24-AK-5521",
  },

  section_179_witness: {
    headerDept: "हरियाणा पुलिस",
    headerGovt: "जिला अम्बाला।",
    docTitle: "साक्षी उपस्थिति आदेश (धारा 179 BNSS)",
    docSubTitle: "Witness Attendance Order under Section 179 Bharatiya Nagarik Suraksha Sanhita, 2023",
    recipientDesignation: "साक्षी / गवाह (Witness)",
    dispatchNo: "",
    policeStation: "थाना शहर अम्बाला",
    district: "जिला अम्बाला।",
    issueDate: formatDate(new Date()),

    noticeeName: "",
    noticeeFather: "",
    noticeeAge: "",
    noticeeAddress: "",
    noticeePhone: "",
    noticeeRole: "साक्षी / गवाह (Witness)",

    complaintNo: "128/2026",
    complainantName: "",
    complainantAddress: "",
    incidentDate: formatDate(new Date()),
    sectionsOfLaw: "धारा 318(4), 316(2) BNS",
    allegationsBrief:
      "उपरोक्त अभियोग के अनुसंधान से यह प्रतीत होता है कि आप कथित अपराध के तथ्यों व परिस्थितियों से भली-भांति परिचित हैं। अतः आपके बयान दर्ज करने आवश्यक हैं।",

    groundsBrief: "अभियोग में साक्ष्य एवं बयान धारा 180 BNSS के तहत अभिलिखित करने हेतु।",
    appearanceDate: formatDate(new Date(Date.now() + 2 * 86400000)),
    appearanceTime: "11:00 AM",
    appearancePlace: "कार्यालय अनुसंधान अधिकारी, थाना शहर अम्बाला",
    documentsRequired: "पहचान पत्र तथा मामले से संबंधित कोई भी सुसंगत अभिलेख या सूचना।",
    statutoryClarification:
      "धारा 179 BNSS के अंतर्गत पुलिस अधिकारी द्वारा पूछे गए सभी प्रश्नों का सत्य उत्तर देना आपका विधिक दायित्व है।",

    officerName: "सुरेन्द्र पाल",
    officerRank: "सब-इंस्पेक्टर",
    officerPno: "PNO-23841",
    officerPhone: "9812034567",
  },
};

export const DEFAULT_SAMPLE_DATA_EN: Record<FIRNoticeTemplateType, NoticeFormData> = {
  section_35_notice: {
    headerDept: "HARYANA POLICE",
    headerGovt: "DISTRICT AMBALA",
    docTitle: "NOTICE OF APPEARANCE (SECTION 35(3) BNSS, 2023)",
    docSubTitle: "Notice of Appearance under Section 35(3) Bharatiya Nagarik Suraksha Sanhita, 2023",
    recipientDesignation: "",
    dispatchNo: "",
    policeStation: "City Ambala",
    district: "Ambala",
    issueDate: formatDate(new Date()),

    noticeeName: "",
    noticeeFather: "",
    noticeeAge: "",
    noticeeAddress: "",
    noticeePhone: "",
    noticeeRole: "Accused / Suspect",

    complaintNo: "128/2026",
    complainantName: "",
    complainantAddress: "",
    incidentDate: formatDate(new Date()),
    sectionsOfLaw: "Section 318(4), 316(2) BNS",
    allegationsBrief:
      "In connection with the investigation of the above case, reasonable grounds and suspicion of commission of a cognizable offence have been found against you. You are hereby required to join the investigation and present your statement.",

    groundsBrief: "To cooperate in investigation and verify material evidence.",
    appearanceDate: formatDate(new Date(Date.now() + 2 * 86400000)),
    appearanceTime: "11:00 AM",
    appearancePlace: "Office of Investigating Officer, Police Station City Ambala",
    documentsRequired: "Identity proof (Aadhaar / PAN card), proof of residence, and any relevant documents concerning the case.",
    statutoryClarification:
      "If you fail to attend on the specified date and time or fail to comply with the terms of this notice, you may be arrested on the order of the competent Court under Section 35(6) BNSS, 2023.",

    officerName: "Surender Pal",
    officerRank: "Sub-Inspector",
    officerPno: "PNO-23841",
    officerPhone: "9812034567",
  },

  cdr_requisition: {
    headerDept: "POLICE STATION CITY PANIPAT",
    headerGovt: "DISTRICT PANIPAT",
    docTitle: "PROFORMA FOR CALL DETAIL RECORDS (CDR & IMEI)",
    docSubTitle: "",
    dispatchNo: "",
    policeStation: "Police Station City Panipat",
    district: "District Panipat",
    issueDate: formatDate(new Date()),

    toAuthority: "The Superintendent of Police, Panipat.",

    noticeeName: "",
    noticeeFather: "",
    noticeeAge: "",
    noticeeAddress: "",
    noticeePhone: "",
    noticeeRole: "",

    complaintNo: "128/2026",
    complainantName: "",
    incidentDate: "18-09-2026",
    sectionsOfLaw: "Section 318(4), 316(2) BNS",
    allegationsBrief:
      "It is submitted that for the investigation of the above case, Call Detail Records (CDR), CAF ID and IMEI search are required for the following mobile phone numbers. It is requested to provide the same.",

    appearanceDate: "",
    appearanceTime: "",
    appearancePlace: "",
    documentsRequired: "",

    officerName: "Surender Pal",
    officerRank: "Sub-Inspector",
    officerPno: "PNO-23841",
    officerPhone: "9812034567",

    shoName: "Station House Officer (SHO)",
    supervisoryOfficerName: "Supervisory Officer (DSP)",
    certificateText:
      "1. The Subscriber identity has been ascertained and it is ensured that person in question is not someone whose call details are of sensitive nature.\n2. The number is not subscribed in the name of a sitting MP/MLA/MLC & Governor.",
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
    natgridReason: "To apprehend the accused and trace digital trails",
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

  section_179_witness: {
    headerDept: "HARYANA POLICE",
    headerGovt: "DISTRICT AMBALA",
    docTitle: "WITNESS ATTENDANCE ORDER (SECTION 179 BNSS, 2023)",
    docSubTitle: "Witness Attendance Order under Section 179 Bharatiya Nagarik Suraksha Sanhita, 2023",
    recipientDesignation: "Witness",
    dispatchNo: "",
    policeStation: "Police Station City Ambala",
    district: "District Ambala",
    issueDate: formatDate(new Date()),

    noticeeName: "",
    noticeeFather: "",
    noticeeAge: "",
    noticeeAddress: "",
    noticeePhone: "",
    noticeeRole: "Witness / Acquainted Person",

    complaintNo: "128/2026",
    complainantName: "",
    complainantAddress: "",
    incidentDate: formatDate(new Date()),
    sectionsOfLaw: "Section 318(4), 316(2) BNS",
    allegationsBrief:
      "From the investigation of the above case, it appears that you are acquainted with the facts and circumstances of the case. Your examination is necessary for the investigation.",

    groundsBrief: "To record statement and evidence under Section 180 BNSS, 2023.",
    appearanceDate: formatDate(new Date(Date.now() + 2 * 86400000)),
    appearanceTime: "11:00 AM",
    appearancePlace: "Office of Investigating Officer, Police Station City Ambala",
    documentsRequired: "Identity proof and any relevant documents or records relating to the case.",
    statutoryClarification:
      "Under Section 179 BNSS, 2023, you are legally bound to answer truly all questions relating to the case put to you by the investigating officer.",

    officerName: "Surender Pal",
    officerRank: "Sub-Inspector",
    officerPno: "PNO-23841",
    officerPhone: "9812034567",
  },
};

// Default export alias for backward compatibility
const DEFAULT_SAMPLE_DATA = DEFAULT_SAMPLE_DATA_HI;

const TEMPLATE_CONFIG: Record<
  FIRNoticeTemplateType,
  {
    labelHi: string;
    labelEn: string;
    label: string;
    badge: string;
    subTitle: string;
    description: string;
    icon: any;
    color: string;
  }
> = {
  section_35_notice: {
    labelHi: "1. सूचना-पत्र अभियुक्त (धारा 35(3) BNSS)",
    labelEn: "1. Notice to Accused u/s 35(3) BNSS (Statutory Notice)",
    label: "1. Notice to Accused u/s 35(3) BNSS (सूचना-पत्र)",
    badge: "Accused Notice",
    subTitle: "Notice of Appearance under Section 35(3) Bharatiya Nagarik Suraksha Sanhita, 2023",
    description: "Statutory notice directed to accused person where arrest is not immediately requisite.",
    icon: FileText,
    color: "text-blue-600",
  },
  cdr_requisition: {
    labelHi: "2. काल डिटेल मांग प्रपत्र (CDR & IMEI - पानीपत प्रारूप)",
    labelEn: "2. CDR & Digital Evidence Requisition (Panipat Format)",
    label: "2. CDR & Digital Evidence Requisition (Panipat Format बाबत काल डिटेल)",
    badge: "CDR & IMEI Proforma",
    subTitle: "Call Detail Records, CAF, IMEI & WhatsApp requisition with non-VIP certificate",
    description: "Official Requisition under Section 94 BNSS to Telecom Service Provider Nodal Officer",
    icon: Phone,
    color: "text-purple-600",
  },
  natgrid_proforma: {
    labelHi: "3. नैटग्रिड आसूचना प्रपत्र (NATGRID Multi-Agency Proforma)",
    labelEn: "3. NATGRID Intelligence Requisition Proforma (Multi-Agency)",
    label: "3. NATGRID Intelligence Requisition Proforma",
    badge: "NATGRID Table",
    subTitle: "NATGRID Intelligence Requisition Proforma (Multi-Agency Intelligence Requisition)",
    description: "Multi-agency intelligence requisition table (Banks, Telecom, Immigration, VAHAN)",
    icon: Layers,
    color: "text-emerald-600",
  },
  section_179_witness: {
    labelHi: "4. साक्षी उपस्थिति आदेश (धारा 179 BNSS)",
    labelEn: "4. Witness Attendance Order (Section 179 BNSS, 2023)",
    label: "4. Witness Attendance Order (Sec 179 BNSS)",
    badge: "Witness Order",
    subTitle: "Order requiring attendance of witness under Section 179 BNSS, 2023",
    description: "Police officer order requiring attendance of persons acquainted with circumstances of case.",
    icon: Scale,
    color: "text-amber-600",
  },
};

function emptyNoticeTemplate(sample: NoticeFormData): NoticeFormData {
  const blank = Object.fromEntries(Object.entries(sample).map(([key, value]) =>
    [key, typeof value === "boolean" ? false : Array.isArray(value) ? [] : ""]
  )) as unknown as NoticeFormData;
  for (const key of ["headerDept", "docTitle", "docSubTitle", "noticeeRole", "recipientDesignation", "statutoryClarification", "documentsRequired"] as const) {
    (blank as any)[key] = sample[key] || "";
  }
  // Identity and case facts are never supplied by the sample.
  if (sample.natgridOtherInfo !== undefined) blank.documentsRequired = "";
  blank.issueDate = formatDate(new Date());
  return blank;
}

// Helper: In-place editable heading / label with visual hint and auto-wrapping
function EditableHeading({
  value,
  onChange,
  className = "",
  placeholder = "",
  title = "क्लिक करके हेडिंग बदलें या मिटाएं / Click to edit or delete heading",
}: {
  value: string;
  onChange: (val: string) => void;
  className?: string;
  placeholder?: string;
  title?: string;
}) {
  const spanRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (spanRef.current && spanRef.current.textContent !== value) {
      spanRef.current.textContent = value;
    }
  }, [value]);

  return (
    <span
      ref={spanRef}
      contentEditable
      suppressContentEditableWarning
      onBlur={(e) => {
        const text = e.currentTarget.textContent ?? "";
        onChange(text.trim());
      }}
      title={title}
      className={`cursor-text outline-none hover:bg-purple-100/60 focus:bg-white focus:ring-1 focus:ring-purple-500 rounded px-1 transition-colors border-b border-dashed border-slate-300/60 hover:border-purple-400 inline-block min-w-[8px] empty:min-w-[14px] empty:border-slate-300 ${className}`}
    >
      {value}
    </span>
  );
}

// Helper: Auto-expanding text input that grows width with characters typed (never clips or hides text)

// Helper: Auto date mask input where user only types digits and it formats to DD-MM-YYYY
function toDDMMYYYY(val: any): string {
  if (!val) return "";
  const s = String(val).trim();
  if (/^\d{2}-\d{2}-\d{4}$/.test(s)) return s;
  const slashMatch = s.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (slashMatch) return `${slashMatch[1]}-${slashMatch[2]}-${slashMatch[3]}`;
  const ymdMatch = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (ymdMatch) return `${ymdMatch[3]}-${ymdMatch[2]}-${ymdMatch[1]}`;
  const d = new Date(s);
  if (!isNaN(d.getTime())) {
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = String(d.getFullYear()).padStart(4, "0");
    return `${dd}-${mm}-${yyyy}`;
  }
  return s;
}

function AutoDateField({
  value,
  onChange,
  className = "",
  placeholder = "DD-MM-YYYY",
  style = {},
  ...props
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> & {
  value: string;
  onChange: (val: string) => void;
}) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Keep only numbers
    const rawDigits = e.target.value.replace(/\D/g, "").slice(0, 8);
    let formatted = "";
    if (rawDigits.length > 0) {
      formatted = rawDigits.slice(0, 2);
    }
    if (rawDigits.length > 2) {
      formatted += "-" + rawDigits.slice(2, 4);
    }
    if (rawDigits.length > 4) {
      formatted += "-" + rawDigits.slice(4, 8);
    }
    onChange(formatted);
  };

  const charLen = Math.max((value || "").length + 2, 12);

  return (
    <input
      type="text"
      inputMode="numeric"
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      maxLength={10}
      className={className}
      style={{ ...(className.includes("w-full") ? {} : { width: `${charLen}ch` }), ...style }}
      {...props}
    />
  );
}

// Helper: Intuitive time mask input with backspace support, space toggle (AM <-> PM), and A/P hotkeys
function AutoTimeField({
  value,
  onChange,
  className = "",
  placeholder = "11:00 AM",
  style = {},
  ...props
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> & {
  value: string;
  onChange: (val: string) => void;
}) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const key = e.key;

    // 1. Backspace handling: if ends with AM/PM or space, cleanly delete it
    if (key === "Backspace") {
      const trimmed = value.trim();
      if (trimmed.endsWith("AM") || trimmed.endsWith("PM")) {
        e.preventDefault();
        // Remove AM or PM and the space before it
        const withoutPeriod = trimmed.slice(0, -2).trim();
        onChange(withoutPeriod);
        return;
      }
    }

    // 2. Space key: Toggle between AM and PM (or append AM if no period exists yet)
    if (key === " " || key === "Spacebar") {
      e.preventDefault();
      const upper = value.toUpperCase();
      if (upper.includes("AM")) {
        onChange(upper.replace("AM", "PM"));
      } else if (upper.includes("PM")) {
        onChange(upper.replace("PM", "AM"));
      } else {
        onChange((value.trim() + " AM").trim());
      }
      return;
    }

    // 3. 'p' or 'P' key: directly switch to PM
    if (key === "p" || key === "P") {
      e.preventDefault();
      const upper = value.toUpperCase();
      if (upper.includes("AM")) {
        onChange(upper.replace("AM", "PM"));
      } else if (!upper.includes("PM")) {
        onChange((value.trim() + " PM").trim());
      }
      return;
    }

    // 4. 'a' or 'A' key: directly switch to AM
    if (key === "a" || key === "A") {
      e.preventDefault();
      const upper = value.toUpperCase();
      if (upper.includes("PM")) {
        onChange(upper.replace("PM", "AM"));
      } else if (!upper.includes("AM")) {
        onChange((value.trim() + " AM").trim());
      }
      return;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value.toUpperCase();

    // Preserve existing AM/PM if present
    let period = "";
    if (input.includes("PM")) {
      period = " PM";
    } else if (input.includes("AM")) {
      period = " AM";
    }

    // Extract digits
    const digits = input.replace(/\D/g, "").slice(0, 4);

    let formatted = "";
    if (digits.length > 0) {
      let hours = digits.slice(0, 2);
      if (hours.length === 2) {
        const numH = parseInt(hours, 10);
        if (numH > 23) hours = "23";
      }
      formatted = hours;
    }
    if (digits.length > 2) {
      let mins = digits.slice(2, 4);
      if (mins.length === 2) {
        const numM = parseInt(mins, 10);
        if (numM > 59) mins = "59";
      }
      formatted += ":" + mins;
    }

    if (period) {
      formatted += period;
    }

    onChange(formatted);
  };

  return (
    <input
      type="text"
      value={value}
      onKeyDown={handleKeyDown}
      onChange={handleChange}
      placeholder={placeholder}
      maxLength={10}
      className={className}
      style={style}
      {...props}
    />
  );
}

function AutoGrowingInput({
  value,
  onChange,
  className = "",
  placeholder = "...",
  minChars = 10,
  style = {},
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  minChars?: number;
}) {
  const contentLen = value ? value.length + 2 : (placeholder ? placeholder.length + 2 : minChars);
  const charLength = Math.max(contentLen, minChars);
  return (
    <input
      type="text"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      style={{ width: `${charLength}ch`, maxWidth: "100%", ...style }}
      className={`transition-all outline-none ${className}`}
      {...props}
    />
  );
}

// Helper: Auto-growing multiline textarea that expands height dynamically without scrollbars
function AutoGrowingTextarea({
  value,
  onChange,
  className = "",
  placeholder = "...",
  rows = 1,
  style = {},
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const resize = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.max(textareaRef.current.scrollHeight, rows * 22)}px`;
    }
  };

  useEffect(() => {
    resize();
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      rows={rows}
      value={value}
      onChange={(e) => {
        onChange(e);
        resize();
      }}
      placeholder={placeholder}
      style={{ overflow: "hidden", resize: "none", ...style }}
      className={`outline-none transition-all ${className}`}
      {...props}
    />
  );
}


// Helper to format police station/post with standard PS or PP prefix
function formatStationOrPost(raw: string, lang: "hi" | "en" = "en"): string {
  if (!raw || !raw.trim()) return "";
  const trimmed = raw.trim();
  // Check if it's a Police Post (PP / चौकी)
  const isPost = /(police\s*post|\bpp\b|चौकी)/i.test(trimmed);
  // Strip out existing prefixes
  const clean = trimmed
    .replace(/^(Police\s*Station|Police\s*Post|PS|PP|थाना|चौकी)\s*/i, "")
    .replace(/\s*(Police\s*Station|Police\s*Post|PS|PP|थाना|चौकी)$/i, "")
    .trim();

  if (!clean) return "";
  if (lang === "hi") {
    return isPost ? `चौकी ${clean}` : `थाना ${clean}`;
  }
  return isPost ? `PP ${clean}` : `PS ${clean}`;
}

function FIRTemplatesContent() {
  const { currentUser } = useAuth();
  const [validationError, setValidationError] = useState("");
  const { language: globalLang } = useLanguage();
  const searchParams = useSearchParams();
  const firIdParam = searchParams.get("firId");

  const [firs, setFirs] = useState<FIRItem[]>([]);
  const [selectedFirId, setSelectedFirId] = useState<string>(firIdParam || "");
  const [selectedRecipient, setSelectedRecipient] = useState("default");
  const [resetVersion, setResetVersion] = useState(0);
  const [noticeEdited, setNoticeEdited] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<FIRNoticeTemplateType>("section_35_notice");
  const [templateLang, setTemplateLang] = useState<TemplateLanguage>(globalLang || "hi");
  const [isSavingToFir, setIsSavingToFir] = useState(false);
  const [saveSuccessInfo, setSaveSuccessInfo] = useState<{
    firId: string;
    firNumber: string;
    docId: string;
    docTitle: string;
  } | null>(null);

  const [formData, setFormData] = useState<NoticeFormData>(
    emptyNoticeTemplate((globalLang === "en" ? DEFAULT_SAMPLE_DATA_EN : DEFAULT_SAMPLE_DATA_HI)["section_35_notice"])
  );

  // Dynamic CDR Target Rows
  const [cdrTargetRows, setCdrTargetRows] = useState<
    Array<{ id: string; phone: string; periodFrom: string; periodTo: string; reason: string }>
  >([{ id: "cdr_1", phone: "", periodFrom: "", periodTo: "", reason: "" }]);

  const cdrTableResize = useTableResize({
    initialColWidths: { 0: 48, 1: 220, 2: 110, 3: 110, 4: 260, 5: 44 },
  });
  const natgridTableResize = useTableResize({
    initialColWidths: { 0: 220 },
  });

  const [fontSize, setFontSize] = useState<"compact" | "standard" | "large">("standard");
  const [voiceLang, setVoiceLang] = useState<"hi-IN" | "en-IN">("hi-IN");
  const [copied, setCopied] = useState(false);

  // Load all FIRs (Do NOT auto-select the first FIR; keep empty so user explicitly chooses)
  useEffect(() => {
    const list = firService.getAllFirs();
    setFirs(list);
    if (firIdParam) {
      setSelectedFirId(firIdParam);
    }
  }, [firIdParam]);

  const activeFir = firs.find((f) => f.id === selectedFirId || f.firNumber === selectedFirId);

  // When active FIR or template changes, sync formData
  useEffect(() => {
    const baseSource = templateLang === "en" ? DEFAULT_SAMPLE_DATA_EN : DEFAULT_SAMPLE_DATA_HI;
    const baseSample = emptyNoticeTemplate(baseSource[selectedTemplate] || baseSource.section_35_notice);
    if (!activeFir) {
      setFormData(baseSample);
      return;
    }

    const primaryAccused = selectedRecipient === "manual" ? null : activeFir.accusedList?.[selectedRecipient === "default" ? 0 : Number(selectedRecipient)] || null;
    const isWitness = selectedTemplate === "section_179_witness";
    const manual = selectedRecipient === "manual";

    const rawNoticeeName = manual ? "" : isWitness
      ? activeFir.complainantName
      : primaryAccused?.name || baseSample.noticeeName;

    const targetNoticeeFather = manual ? "" : isWitness
      ? activeFir.complainantFatherSpouse || ""
      : primaryAccused?.fatherName || baseSample.noticeeFather;

    // Auto-compose father/spouse name into targetNoticeeName if present and not already included
    let targetNoticeeName = rawNoticeeName;
    const hasRelativePrefix = /\b(s\/o|w\/o|d\/o|c\/o|सुपुत्र|आत्मज|पत्नी)\b/i.test(rawNoticeeName);
    if (targetNoticeeFather && rawNoticeeName && !hasRelativePrefix) {
      const relLabel = templateLang === "hi" ? "सुपुत्र/पत्नी" : "s/o";
      targetNoticeeName = `${rawNoticeeName} ${relLabel} ${targetNoticeeFather}`;
    }

    const targetNoticeeAddress = manual ? "" : isWitness
      ? activeFir.complainantAddress || ""
      : primaryAccused?.address || baseSample.noticeeAddress;

    const targetNoticeePhone = manual ? "" : isWitness
      ? activeFir.complainantMobile || ""
      : primaryAccused?.phone || baseSample.noticeePhone;

    const age = manual ? undefined : isWitness ? activeFir.complainantAge : (primaryAccused as any)?.age;
    const targetNoticeeAge = age == null ? "" : String(age);

    // Clean district so it doesn't duplicate "District" or "जिला" when heading is already present
    const rawDistrict = activeFir.district || baseSample.district || "";
    const cleanDistrict = rawDistrict
      .replace(/^(District|जिला)\s*/i, "")
      .replace(/[।.]/g, "")
      .trim();

    // Format Police Station as 'PS <Name>' or Police Post as 'PP <Name>'
    const rawPs = activeFir.policeStation || baseSample.policeStation || "";
    const isPolicePost = /police\s*post|\bpp\b|चौकी/i.test(rawPs);
    const cleanedStationName = rawPs
      .replace(/^(Police\s*Station|Police\s*Post|PS|PP|थाना|चौकी)\s*/i, "")
      .replace(/\s*(Police\s*Station|Police\s*Post|PS|PP|थाना|चौकी)$/i, "")
      .trim();
    const formattedStation = templateLang === "hi"
      ? (isPolicePost ? `चौकी ${cleanedStationName}` : `थाना ${cleanedStationName}`)
      : (isPolicePost ? `PP ${cleanedStationName}` : `PS ${cleanedStationName}`);

    setFormData({
      ...baseSample,
      appearancePlace: activeFir.policeStation || "",
      policeStation: formattedStation || activeFir.policeStation || baseSample.policeStation,
      district: cleanDistrict || rawDistrict,
      complaintNo: activeFir.firNumber || baseSample.complaintNo,
      complainantName: activeFir.complainantName || baseSample.complainantName,
      incidentDate: toDDMMYYYY((activeFir as any)?.incidentDate || activeFir.incidentDateFrom || activeFir.firDate || baseSample.incidentDate),
      sectionsOfLaw: activeFir.actsAndSections || baseSample.sectionsOfLaw,
      allegationsBrief: activeFir.briefFacts || (activeFir as any).incidentDetails || baseSample.allegationsBrief,
      noticeeName: targetNoticeeName,
      noticeeFather: targetNoticeeFather,
      noticeeAddress: targetNoticeeAddress,
      noticeePhone: targetNoticeePhone,
      noticeeAge: targetNoticeeAge,
      permanentAddress: targetNoticeeAddress,
      currentAddress: targetNoticeeAddress,
      accusedAadhaar: (primaryAccused as any)?.aadhaar || baseSample.accusedAadhaar || "",
      accusedPan: (primaryAccused as any)?.pan || baseSample.accusedPan || "",
      vsName: targetNoticeeName || baseSample.vsName,
      officerName: activeFir.assignedIoName || currentUser.name || baseSample.officerName,
      officerRank: activeFir.assignedIoRank || currentUser.rankDisplay || baseSample.officerRank,
      officerPno: activeFir.assignedIoBeltNumber || "",
      officerPhone: activeFir.assignedIoPhone || "",
      arrestPoliceStation: activeFir.policeStation || baseSample.policeStation,
      arrestDistrict: activeFir.district || baseSample.district,
      casePs: activeFir.policeStation || baseSample.policeStation,
    });

    {
      setCdrTargetRows((prev) => [
        {
          id: "cdr_1",
          phone: primaryAccused?.phone || "",
          periodFrom: toDDMMYYYY((activeFir as any)?.incidentDate || activeFir.incidentDateFrom || ""),
          periodTo: formatDate(new Date()),
          reason: templateLang === "hi"
            ? `अभियोग सं. ${activeFir.firNumber} में अभियुक्त सत्यापन हेतु`
            : `Verification of accused in FIR No. ${activeFir.firNumber}`,
        },
      ]);
    }
      setNoticeEdited(false);
  }, [activeFir, selectedTemplate, selectedRecipient, currentUser, resetVersion]);

  const handleFieldChange = (field: keyof NoticeFormData, val: any) => {
    setNoticeEdited(true);
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  // Toggle template language between Hindi and English
  const handleToggleLanguage = (newLang: TemplateLanguage) => {
    if (newLang === templateLang) return;
    setTemplateLang(newLang);
    setVoiceLang(newLang === "hi" ? "hi-IN" : "en-IN");

    const currentBase = emptyNoticeTemplate((templateLang === "hi" ? DEFAULT_SAMPLE_DATA_HI : DEFAULT_SAMPLE_DATA_EN)[selectedTemplate]);
    const targetBase = emptyNoticeTemplate((newLang === "hi" ? DEFAULT_SAMPLE_DATA_HI : DEFAULT_SAMPLE_DATA_EN)[selectedTemplate]);

    setFormData((prev) => {
      const updated = { ...prev };
      // Switch boilerplate header & titles if empty or unchanged from defaults
      if (!prev.headerDept || prev.headerDept === currentBase.headerDept) {
        updated.headerDept = targetBase.headerDept;
      }
      if (!prev.headerGovt || prev.headerGovt === currentBase.headerGovt) {
        updated.headerGovt = targetBase.headerGovt;
      }
      if (!prev.docTitle || prev.docTitle === currentBase.docTitle) {
        updated.docTitle = targetBase.docTitle;
      }
      if (!prev.docSubTitle || prev.docSubTitle === currentBase.docSubTitle) {
        updated.docSubTitle = targetBase.docSubTitle;
      }
      if (!prev.noticeeRole || prev.noticeeRole === currentBase.noticeeRole) {
        updated.noticeeRole = targetBase.noticeeRole;
      }
      if (!prev.groundsBrief || prev.groundsBrief === currentBase.groundsBrief) {
        updated.groundsBrief = targetBase.groundsBrief;
      }
      if (!prev.allegationsBrief || prev.allegationsBrief === currentBase.allegationsBrief) {
        updated.allegationsBrief = targetBase.allegationsBrief;
      }
      if (!prev.documentsRequired || prev.documentsRequired === currentBase.documentsRequired) {
        updated.documentsRequired = targetBase.documentsRequired;
      }
      if (!prev.statutoryClarification || prev.statutoryClarification === currentBase.statutoryClarification) {
        updated.statutoryClarification = targetBase.statutoryClarification;
      }
      if (!prev.toAuthority || prev.toAuthority === currentBase.toAuthority) {
        updated.toAuthority = targetBase.toAuthority;
      }
      if (!prev.shoName || prev.shoName === currentBase.shoName) {
        updated.shoName = targetBase.shoName;
      }
      if (!prev.supervisoryOfficerName || prev.supervisoryOfficerName === currentBase.supervisoryOfficerName) {
        updated.supervisoryOfficerName = targetBase.supervisoryOfficerName;
      }
      if (!prev.natgridReason || prev.natgridReason === currentBase.natgridReason) {
        updated.natgridReason = targetBase.natgridReason;
      }
      if (!prev.natgridDepartment || prev.natgridDepartment === currentBase.natgridDepartment) {
        updated.natgridDepartment = targetBase.natgridDepartment;
      }
      if (!prev.natgridInfoRequired || prev.natgridInfoRequired === currentBase.natgridInfoRequired) {
        updated.natgridInfoRequired = targetBase.natgridInfoRequired;
      }
      if (prev.district) {
        if (newLang === "hi") {
          updated.district = prev.district.replace(/^District\s+/i, "जिला ");
        } else {
          updated.district = prev.district.replace(/^जिला\s+/, "District ");
        }
      }
      return updated;
    });

    // Translate CDR reasons if using default sample texts
    setCdrTargetRows((prevRows) =>
      prevRows.map((r) => {
        if (newLang === "en") {
          if (r.reason === "आरोपी द्वारा परिवादी को फर्जी कॉल कर धोखाधड़ी करने बाबत") {
            return { ...r, reason: "Fraudulent call made by accused to victim for financial cheating" };
          }
          if (r.reason === "सह-आरोपी के साथ संपर्क व लोकेशन मिलान हेतु") {
            return { ...r, reason: "Verification of contact and cell-tower location matching with co-accused" };
          }
        } else {
          if (r.reason === "Fraudulent call made by accused to victim for financial cheating") {
            return { ...r, reason: "आरोपी द्वारा परिवादी को फर्जी कॉल कर धोखाधड़ी करने बाबत" };
          }
          if (r.reason === "Verification of contact and cell-tower location matching with co-accused") {
            return { ...r, reason: "सह-आरोपी के साथ संपर्क व लोकेशन मिलान हेतु" };
          }
        }
        return r;
      })
    );
  };

  // Sync with global top bar language switcher
  useEffect(() => {
    if (globalLang && globalLang !== templateLang) {
      handleToggleLanguage(globalLang);
    }
  }, [globalLang]);

  const handleResetSample = () => {
    if (noticeEdited && !confirm("Reset this notice to verified case details? Unsaved edits will be removed.")) return;
    setResetVersion((version) => version + 1);
  };

  // Dynamic CDR Row actions
  const handleAddCdrRow = () => {
    const newId = `cdr_${Date.now()}`;
    setCdrTargetRows((prev) => [
      ...prev,
      {
        id: newId,
        phone: "",
        periodFrom: "",
        periodTo: "",
        reason: "",
      },
    ]);
  };

  const handleUpdateCdrRow = (id: string, key: string, val: string) => {
    setCdrTargetRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [key]: val } : r))
    );
  };

  const handleDeleteCdrRow = (id: string) => {
    if (cdrTargetRows.length <= 1) return;
    setCdrTargetRows((prev) => prev.filter((r) => r.id !== id));
  };

  const validateNotice = () => {
    const missing: string[] = [];
    if (!activeFir) missing.push("FIR");
    if (selectedTemplate !== "natgrid_proforma" && !formData.dispatchNo?.trim()) missing.push("Dispatch number");
    if (!formData.officerName?.trim()) missing.push("Officer");
    if (selectedTemplate === "section_35_notice" || selectedTemplate === "section_179_witness") {
      for (const field of ["noticeeName", "noticeeAddress", "appearanceDate", "appearanceTime", "appearancePlace"] as const) {
        if (!formData[field]?.trim()) missing.push(field);
      }
    } else if (selectedTemplate === "cdr_requisition") {
      if (cdrTargetRows.some((r) => !r.phone.trim() || !r.periodFrom.trim() || !r.periodTo.trim() || !r.reason.trim())) missing.push("Complete CDR targets, dates and justification");
    } else if (!formData.noticeeName?.trim() || !formData.natgridReason?.trim() || !formData.shoEmail?.trim()) {
      missing.push("NATGRID identity, reason and official email");
    }
    setValidationError(missing.length ? "Complete and verify before export: " + missing.join(", ") : "");
    return missing.length === 0;
  };

  const handleSaveToFir = async () => {
    if (!activeFir) {
      alert(templateLang === "hi" ? "कृपया पहले एक सक्रिय FIR केस चुनें।" : "Please select an active FIR case first.");
      return;
    }

    setIsSavingToFir(true);
    try {
      const el = document.getElementById("fir-printable-notice");
      if (!el) {
        throw new Error("Notice element not found on page.");
      }

      let docTitle = "";
      if (selectedTemplate === "section_35_notice") {
        docTitle = `Notice u/s 35(3) BNSS - ${formData.noticeeName || "Accused"}`;
      } else if (selectedTemplate === "section_179_witness") {
        docTitle = `Attendance Order u/s 179 BNSS - ${formData.noticeeName || "Witness"}`;
      } else if (selectedTemplate === "cdr_requisition") {
        docTitle = `CDR Requisition Memo - ${formData.policeStation || activeFir.policeStation}`;
      } else if (selectedTemplate === "natgrid_proforma") {
        docTitle = `NATGRID Intelligence Proforma - ${formData.noticeeName || "Suspect"}`;
      } else {
        docTitle = `Statutory Notice - ${activeFir.firNumber}`;
      }

      const now = new Date();
      const dateStr = now.toISOString().split("T")[0];
      const timeStr = now.toTimeString().slice(0, 5);

      const htmlContent = `<!DOCTYPE html>
<html lang="${templateLang}">
<head>
  <meta charset="utf-8" />
  <title>${docTitle}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans Devanagari", sans-serif; padding: 32px; background: #fff; color: #0f172a; line-height: 1.6; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    th, td { border: 1px solid #334155; padding: 6px 10px; font-size: 13px; }
    .no-print { display: none !important; }
    h1, h2, h3 { text-align: center; }
  </style>
</head>
<body>
  ${el.innerHTML}
</body>
</html>`;

      const docId = `doc-notice-${Date.now()}`;
      const fileName = `statutory_notice_${selectedTemplate}_${Date.now()}.html`;
      const dataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`;

      // 1. IndexedDB Blob Store persistence
      if (typeof window !== "undefined") {
        try {
          await evidenceBlobStore.put(docId, dataUrl, { mimeType: "text/html", fileName });
        } catch (storeErr) {
          console.warn("evidenceBlobStore save notice error:", storeErr);
        }
      }

      // 2. Universal Evidence analysis and indexing
      try {
        await universalEvidenceService.registerAndProcess({
          dataUrl,
          fileName,
          fileId: docId,
          caseId: activeFir.id,
          caseNumber: activeFir.firNumber,
          module: "FIR",
          uploadedBy: currentUser?.name || "IO",
        });
      } catch (eviErr) {
        console.warn("universalEvidenceService notice error:", eviErr);
      }

      // 3. Save into FIR documents (Related Documents)
      const newDoc: FIRDocumentItem = {
        id: docId,
        firId: activeFir.id,
        title: docTitle,
        fileName,
        category: "STATUTORY_NOTICE",
        uploadedBy: `${currentUser?.name || "IO"} (${currentUser?.rank || "SI"})`,
        uploadedAt: `${dateStr} ${timeStr}`,
        dataUrl,
        fileSize: `${(htmlContent.length / 1024).toFixed(1)} KB`,
      };

      firService.addDocument(activeFir.id, newDoc);

      // 4. Update FIR Investigation Timeline
      const timelineEvent: FIRTimelineEvent = {
        id: `tl-notice-${Date.now()}`,
        firId: activeFir.id,
        date: `${dateStr} ${timeStr}`,
        title: templateLang === "hi" ? `वैधानिक नोटिस जारी: ${docTitle}` : `Statutory Notice Issued: ${docTitle}`,
        description: templateLang === "hi"
          ? `${docTitle} तैयार कर केस के संबद्ध दस्तावेजों (Related Documents) में सहेजा गया। प्राप्तकर्ता: ${formData.noticeeName || "संबंधित व्यक्ति"}। जारीकर्ता: ${currentUser?.name || "IO"}`
          : `${docTitle} generated and saved to FIR Related Documents for ${formData.noticeeName || "Noticee"} by ${currentUser?.name || "IO"}.`,
        actor: `${currentUser?.name || "IO"} (${currentUser?.rank || "SI"})`,
        stage: "STATUTORY_NOTICE",
      };

      const refreshedFir = firService.getFirById(activeFir.id) || activeFir;
      firService.updateFir(activeFir.id, {
        timeline: [timelineEvent, ...(refreshedFir.timeline || [])],
      });

      // 5. Update FIR Audit Trail
      firService.addAuditRecord(
        activeFir.id,
        "STATUTORY_NOTICE_SAVED",
        `${docTitle} generated and saved to FIR Related Documents by ${currentUser?.name || "IO"} (${currentUser?.rank || "SI"})`,
        currentUser?.name || "IO",
        currentUser?.rank || "SI"
      );

      // 6. Trigger Roznamcha General Diary suggestion (PPR 22.48)
      try {
        await GeneralDiaryService.createFirActionSuggestion({
          actionType: "NOTICE_ISSUED",
          firId: activeFir.id,
          firNumber: activeFir.firNumber,
          policeStation: activeFir.policeStation,
          district: activeFir.district,
          officer: {
            name: currentUser?.name || "IO",
            rank: currentUser?.rank || "Sub-Inspector",
            pno: currentUser?.pno || "00000000",
            beltNumber: (currentUser as any)?.beltNo || `${currentUser?.pno || "IO"}/FIR`,
          },
          personName: formData.noticeeName || "Noticee",
          actsAndSections: activeFir.actsAndSections,
          place: activeFir.policeStation,
          docTitle,
          details: `Statutory notice issued: ${docTitle} for FIR No. ${activeFir.firNumber}`,
        });
      } catch (gdErr) {
        console.warn("Failed to dispatch Roznamcha GD suggestion for Statutory Notice:", gdErr);
      }

      // 7. Refresh FIR state in current view
      setFirs(firService.getAllFirs());

      setSaveSuccessInfo({
        firId: activeFir.id,
        firNumber: activeFir.firNumber,
        docId,
        docTitle,
      });
    } catch (err: any) {
      console.error("Save to FIR failed:", err);
      alert(templateLang === "hi" ? "दस्तावेज सहेजने में त्रुटि: " + (err.message || "अज्ञात") : "Failed to save notice to FIR: " + (err.message || "Unknown error"));
    } finally {
      setIsSavingToFir(false);
    }
  };

  const handlePrint = () => {
    setValidationError("");
    const title = `Notice_${selectedTemplate}_FIR_${formData.complaintNo || "Case"}`;
    printA4Element("fir-printable-notice", title);
  };

  const handleDownload = () => {
    setValidationError("");
    const title = `Notice_${selectedTemplate}_FIR_${formData.complaintNo || "Case"}`;
    const docTitle = TEMPLATE_CONFIG[selectedTemplate]?.label || "Statutory Notice";
    downloadA4DocumentAsHtml("fir-printable-notice", title, docTitle);
  };

  const handleCopy = async () => {
    const element = document.getElementById("fir-printable-notice");
    if (!element) return;

    // Clone element to construct both rich HTML and clean plain text
    const clone = element.cloneNode(true) as HTMLElement;

    // Remove voice buttons, actions and no-print elements
    clone.querySelectorAll("button, svg, .no-print, [role='button']").forEach((el) => el.remove());

    // Replace all inputs, textareas, selects with inline text
    const origInputs = element.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
      "input, textarea, select"
    );
    const cloneInputs = clone.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
      "input, textarea, select"
    );

    for (let i = 0; i < origInputs.length; i++) {
      const orig = origInputs[i];
      const dest = cloneInputs[i];
      if (!dest) continue;

      const span = document.createElement("span");
      let val = "";
      if (orig instanceof HTMLInputElement || orig instanceof HTMLTextAreaElement) {
        val = orig.value || "";
      } else if (orig instanceof HTMLSelectElement) {
        val = orig.options[orig.selectedIndex]?.text || orig.value || "";
      }
      span.textContent = val ? ` ${val} ` : " ";
      dest.parentNode?.replaceChild(span, dest);
    }

    // Prepare Rich HTML for MS Word / Google Docs / Rich Editors
    const richHtml = `
      <div style="font-family: Arial, 'Noto Sans Devanagari', sans-serif; font-size: 11pt; line-height: 1.6; color: #000;">
        ${clone.innerHTML}
      </div>
    `;

    // Prepare Clean Plain Text preserving line breaks for Notepad
    const plainTextLines: string[] = [];
    const walkNodes = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent?.replace(/[\t ]+/g, " ") || "";
        if (text) {
          if (plainTextLines.length === 0) plainTextLines.push("");
          plainTextLines[plainTextLines.length - 1] += text;
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        const display = window.getComputedStyle ? window.getComputedStyle(el).display : "";
        const isBlock =
          display === "block" ||
          display === "flex" ||
          display === "grid" ||
          /^(DIV|P|H1|H2|H3|H4|H5|H6|TR|LI|SECTION|ARTICLE|HEADER)$/i.test(el.tagName);

        if (isBlock && plainTextLines[plainTextLines.length - 1] !== "") {
          plainTextLines.push("");
        }

        for (const child of Array.from(el.childNodes)) {
          walkNodes(child);
        }

        if (isBlock && plainTextLines[plainTextLines.length - 1] !== "") {
          plainTextLines.push("");
        }
      }
    };

    walkNodes(clone);

    const plainText = plainTextLines
      .map((line) => line.trim())
      .filter((line, idx, arr) => line.length > 0 || (idx > 0 && arr[idx - 1].length > 0))
      .join("\n")
      .trim();

    try {
      if (navigator.clipboard && window.ClipboardItem) {
        const htmlBlob = new Blob([richHtml], { type: "text/html" });
        const textBlob = new Blob([plainText], { type: "text/plain" });
        await navigator.clipboard.write([
          new ClipboardItem({
            "text/html": htmlBlob,
            "text/plain": textBlob,
          }),
        ]);
      } else if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(plainText);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = plainText;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
    } catch (clipErr) {
      console.warn("Rich copy fallback to writeText:", clipErr);
      try {
        await navigator.clipboard.writeText(plainText);
      } catch (fallbackErr) {
        console.error("Copy failed:", fallbackErr);
      }
    }

    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-5 pb-16 animate-in fade-in-50">
      {validationError && <div role="alert" className="p-3 border border-red-300 bg-red-50 text-red-800 rounded">{validationError}</div>}
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-700">
            <FileCheck2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-black text-[#0b192c] tracking-tight">
              Notice Generator
            </h1>
          </div>
        </div>

      </div>

      {/* FIR Module Workspace Navigation */}
      <FIRWorkspaceNav firId={selectedFirId} />

      {/* Case & Template Selector Header Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
              {templateLang === "hi" ? "सक्रिय अभियोग (FIR) चुनें *" : "Select Active FIR Case *"}
            </label>
            <select
              aria-label="Select Active FIR Case"
              value={selectedFirId}
              onChange={(e) => { if (noticeEdited && !confirm("Discard unsaved notice edits and switch FIR?")) return; setSelectedRecipient("default"); setSelectedFirId(e.target.value); }}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white font-bold text-slate-900"
            >
              <option value="">
                {templateLang === "hi" ? "-- सक्रिय अभियोग (FIR) चुनें --" : "-- Select Active FIR Case --"}
              </option>
              {firs.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.firNumber} — {f.actsAndSections.slice(0, 45)} ({f.complainantName})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
              {templateLang === "hi" ? "नोटिस / मांग पत्र प्रपत्र चुनें *" : "Select Notice / Memo Proforma *"}
            </label>
            <select
              aria-label="Select Notice / Memo Proforma"
              value={selectedTemplate}
              onChange={(e) => { if (noticeEdited && !confirm("Discard unsaved notice edits and switch template?")) return; setSelectedRecipient("default"); setSelectedTemplate(e.target.value as FIRNoticeTemplateType); }}
              className="w-full text-xs p-2.5 rounded-lg border border-purple-300 bg-purple-50/40 font-bold text-purple-950"
            >
              {Object.entries(TEMPLATE_CONFIG).map(([key, cfg]) => (
                <option key={key} value={key}>
                  {templateLang === "hi" ? cfg.labelHi : cfg.labelEn}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="text-xs font-semibold flex items-center gap-1.5">
            <span className="text-slate-600 font-bold">{templateLang === "hi" ? "नोटिस प्राप्तकर्ता:" : "Notice Recipient:"}</span>
            <select
              aria-label="Notice recipient"
              value={selectedRecipient}
              onChange={(e) => {
                if (noticeEdited && !confirm("Discard unsaved notice edits and change recipient?")) return;
                setSelectedRecipient(e.target.value);
              }}
              className="border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 bg-white shadow-2xs"
            >
              {selectedTemplate === "section_179_witness" ? (
                <option value="default">{activeFir?.complainantName || "Complainant"} — Complainant</option>
              ) : (
                <>
                  <option value="default">{activeFir?.accusedList?.[0]?.name || "No recorded accused"}</option>
                  {activeFir?.accusedList?.slice(1).map((person, index) => (
                    <option key={index + 1} value={String(index + 1)}>{person.name}</option>
                  ))}
                </>
              )}
              <option value="manual">Other person — enter verified details</option>
            </select>
          </label>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handlePrint}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs gap-1.5 shadow-sm cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              {templateLang === "hi" ? "प्रिंट A4 नोटिस" : "Print A4 Notice"}
            </Button>

            <Button
              size="sm"
              onClick={handleSaveToFir}
              disabled={isSavingToFir}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 shadow-sm cursor-pointer"
              title="Save notice to FIR Related Documents, Timeline & Audit Trail"
            >
              {isSavingToFir ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>{isSavingToFir ? (templateLang === "hi" ? "सेव हो रहा है..." : "Saving...") : "Save to FIR"}</span>
            </Button>
          </div>
        </div>
        {/* Toolbar: Template Language Switcher, Font Size, Dictation, Reset */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Template Language Dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-600 font-semibold text-[11px] flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-purple-700" />
                <span>{templateLang === "hi" ? "टेम्पलेट भाषा:" : "Template Language:"}</span>
              </span>
              <select
                aria-label="Template Language"
                value={templateLang}
                onChange={(e) => handleToggleLanguage(e.target.value as TemplateLanguage)}
                className="border border-slate-300 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 bg-white shadow-2xs cursor-pointer"
              >
                <option value="hi">हिन्दी</option>
                <option value="en">English</option>
              </select>
            </div>

            <span className="text-slate-300 hidden sm:inline">|</span>

            {/* Font Size Dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-600 font-semibold text-[11px]">
                {templateLang === "hi" ? "फॉन्ट आकार:" : "Font Size:"}
              </span>
              <select
                aria-label="Font Size"
                value={fontSize}
                onChange={(e) => setFontSize(e.target.value as "compact" | "standard" | "large")}
                className="border border-slate-300 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 bg-white shadow-2xs cursor-pointer"
              >
                <option value="compact">{templateLang === "hi" ? "छोटा (Compact)" : "Compact"}</option>
                <option value="standard">{templateLang === "hi" ? "सामान्य (Standard)" : "Standard"}</option>
                <option value="large">{templateLang === "hi" ? "बड़ा (Large)" : "Large"}</option>
              </select>
            </div>
                    </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="px-2.5 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded text-xs font-semibold flex items-center gap-1 border border-slate-200 cursor-pointer"
              title="Copy text content of notice"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              <span>
                {copied
                  ? (templateLang === "hi" ? "कॉपी हो गया" : "Copied")
                  : (templateLang === "hi" ? "टेक्स्ट कॉपी करें" : "Copy Text")}
              </span>
            </button>
            <button
              type="button"
              onClick={handleResetSample}
              className="px-2.5 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded text-xs font-semibold flex items-center gap-1 border border-slate-200 cursor-pointer"
              title="Reset template to standard default format"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>{templateLang === "hi" ? "टेम्पलेट रीसेट करें" : "Reset Template"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Save Success to FIR Profile Modal */}
      {saveSuccessInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setSaveSuccessInfo(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl border border-emerald-200 max-w-md w-full p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {templateLang === "hi" ? "दस्तावेज सफलतापूर्वक सहेजा गया!" : "Document Saved to FIR!"}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {templateLang === "hi" ? "FIR केस फाइल्स, टाइमलाइन व ऑडिट ट्रेल अपडेट हो गए।" : "FIR Related Documents, Timeline & Audit updated."}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSaveSuccessInfo(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">{templateLang === "hi" ? "दस्तावेज शीर्षक:" : "Document Title:"}</span>
                <span className="font-bold text-slate-900 truncate max-w-[200px]">{saveSuccessInfo.docTitle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">{templateLang === "hi" ? "संबद्ध FIR संख्या:" : "Target FIR:"}</span>
                <span className="font-bold text-slate-900">{saveSuccessInfo.firNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">{templateLang === "hi" ? "अपलोडकर्ता:" : "Saved By:"}</span>
                <span className="font-bold text-slate-900">{currentUser?.name || "IO"}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSaveSuccessInfo(null)}
                className="text-xs font-semibold cursor-pointer"
              >
                {templateLang === "hi" ? "बंद करें" : "Close"}
              </Button>
              <Link
                href={`/fir/${saveSuccessInfo.firId}?tab=documents`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>{templateLang === "hi" ? "FIR दस्तावेज देखें" : "View in FIR Documents"}</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Fully Editable Official Legal Document Canvas */}
      <div className="flex justify-center">
        <div
          id="fir-printable-notice"
          className={`w-full max-w-4xl bg-white border border-slate-300 shadow-md rounded-xl p-6 sm:p-12 transition-all ${
            fontSize === "compact" ? "text-xs" : fontSize === "large" ? "text-base" : "text-sm"
          }`}
          style={{ minHeight: "1050px", lineHeight: "1.7" }}
        >
          {/* ================= TEMPLATE 1 & 5: NOTICE TO ACCUSED / WITNESS ATTENDANCE ORDER ================= */}
          {(selectedTemplate === "section_35_notice" || selectedTemplate === "section_179_witness") && (
            <div className="space-y-6 text-slate-950 font-sans">
              {/* Header Seal */}
              <div className="text-center pt-2">
                <AutoGrowingTextarea
                  rows={1}
                  value={formData.headerDept ?? (templateLang === "hi" ? "हरियाणा पुलिस" : "HARYANA POLICE")}
                  onChange={(e) => handleFieldChange("headerDept", e.target.value)}
                  className="font-black text-slate-950 underline underline-offset-8 text-xl sm:text-2xl text-center bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent hover:border-slate-300 focus:border-purple-500 rounded px-2 py-0.5 outline-none tracking-wider w-full"
                  placeholder={templateLang === "hi" ? "हरियाणा पुलिस" : "HARYANA POLICE"}
                />
              </div>

              {/* Station and District Row */}
              <div className="flex flex-wrap items-baseline justify-between gap-4 font-bold text-base text-slate-950 pt-2">
                <div className="flex items-center gap-1.5">
                  <EditableHeading
                    value={
                      formData.headingStation ??
                      (/police\s*post|\bpp\b|चौकी/i.test(formData.policeStation || "")
                        ? (templateLang === "hi" ? "चौकी" : "PP")
                        : (templateLang === "hi" ? "थाना" : "PS"))
                    }
                    onChange={(val) => handleFieldChange("headingStation", val)}
                    className="whitespace-nowrap font-bold"
                  />
                  <AutoGrowingInput
                    value={
                      formData.policeStation
                        ? formData.policeStation
                            .replace(/^(Police\s*Station|Police\s*Post|PS|PP|थाना|चौकी)\s*/i, "")
                            .replace(/\s*(Police\s*Station|Police\s*Post|PS|PP|थाना|चौकी)$/i, "")
                        : ""
                    }
                    onChange={(e) => handleFieldChange("policeStation", e.target.value)}
                    placeholder="...................."
                    minChars={(formData.policeStation || "").length > 0 ? (formData.policeStation || "").length + 1 : 12}
                    className="font-bold text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border-b border-dotted border-slate-700 focus:border-purple-500 px-1 py-0.5 outline-none"
                  />
                </div>
                <div className="flex items-center justify-end gap-1 text-right">
                  <EditableHeading
                    value={formData.headingDistrict ?? (templateLang === "hi" ? "जिला" : "District")}
                    onChange={(val) => handleFieldChange("headingDistrict", val)}
                    className="whitespace-nowrap font-bold"
                  />
                  <AutoGrowingInput
                    value={
                      formData.district
                        ? formData.district.replace(/^(District|जिला)\s*/i, "").replace(/[।.]/g, "").trim()
                        : ""
                    }
                    onChange={(e) => handleFieldChange("district", e.target.value)}
                    placeholder={templateLang === "hi" ? "जिला..." : "District..."}
                    minChars={(formData.district || "").length > 0 ? (formData.district || "").length + 1 : 10}
                    className="font-bold text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border-b border-dotted border-slate-700 focus:border-purple-500 px-1 py-0.5 outline-none text-left"
                  />
                </div>
              </div>

              {/* Document Title */}
              <div className="text-center py-2">
                <AutoGrowingTextarea
                  rows={1}
                  value={
                    formData.docTitle ??
                    (selectedTemplate === "section_35_notice"
                      ? templateLang === "hi"
                        ? "सूचना-पत्र (धारा 35(3) BNSS)"
                        : "NOTICE OF APPEARANCE (SECTION 35(3) BNSS, 2023)"
                      : templateLang === "hi"
                        ? "साक्षी उपस्थिति आदेश (धारा 179 BNSS)"
                        : "WITNESS ATTENDANCE ORDER (SECTION 179 BNSS, 2023)")
                  }
                  onChange={(e) => handleFieldChange("docTitle", e.target.value)}
                  className="w-full font-black text-slate-950 text-lg sm:text-xl text-center bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent hover:border-slate-300 focus:border-purple-500 rounded px-2 py-0.5 outline-none tracking-wide"
                  placeholder={templateLang === "hi" ? "शीर्षक दर्ज करें" : "Enter Document Title"}
                />
              </div>

              {/* Dispatch & Date */}
              <div className="flex flex-wrap items-center justify-between gap-4 font-medium text-slate-900 pb-2">
                <div className="flex items-center gap-1.5">
                  <EditableHeading
                    value={formData.headingDispatch ?? (templateLang === "hi" ? "क्रमांक" : "Memo No.")}
                    onChange={(val) => handleFieldChange("headingDispatch", val)}
                    className="whitespace-nowrap font-semibold"
                  />
                  <AutoGrowingInput
                    value={formData.dispatchNo || ""}
                    onChange={(e) => handleFieldChange("dispatchNo", e.target.value)}
                    placeholder=".................."
                    minChars={18}
                    className="text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border-b border-dotted border-slate-700 focus:border-purple-500 px-1 py-0.5 outline-none font-semibold"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <EditableHeading
                    value={formData.headingDate ?? (templateLang === "hi" ? "दिनांक" : "Date")}
                    onChange={(val) => handleFieldChange("headingDate", val)}
                    className="whitespace-nowrap font-semibold"
                  />
                  <AutoDateField
                    value={formData.issueDate || ""}
                    onChange={(val) => handleFieldChange("issueDate", val)}
                    placeholder="DD-MM-YYYY"
                    className="text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border-b border-dotted border-slate-700 focus:border-purple-500 px-1 py-0.5 outline-none font-semibold text-left"
                  />
                </div>
              </div>

              {/* Recipient Details Box (Clean user-friendly interactive input container) */}
              <div className="bg-slate-50/90 border border-slate-300 rounded-lg p-3 my-2 text-xs sm:text-[13px] space-y-2.5 font-sans">
                <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-purple-600" />
                    <EditableHeading
                      value={formData.headingTo ?? (templateLang === "hi" ? "सेवा में / प्रति (Notice Recipient):" : "To / Notice Recipient:")}
                      onChange={(val) => handleFieldChange("headingTo", val)}
                      className="font-bold text-slate-900"
                    />
                  </span>
                </div>

                <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2 text-slate-950 leading-relaxed">
                  {/* Name section: sized exactly to content */}
                  <div className="inline-flex items-baseline gap-1.5 shrink-0">
                    <EditableHeading
                      value={formData.headingName ?? (templateLang === "hi" ? "श्री/श्रीमती:" : "Shri/Smt:")}
                      onChange={(val) => handleFieldChange("headingName", val)}
                      className="font-bold text-slate-700 whitespace-nowrap"
                    />
                    <AutoGrowingInput
                      value={formData.noticeeName || ""}
                      onChange={(e) => handleFieldChange("noticeeName", e.target.value)}
                      placeholder={templateLang === "hi" ? "नाम दर्ज करें" : "Enter Name"}
                      minChars={(formData.noticeeName || "").length > 0 ? (formData.noticeeName || "").length + 2 : 14}
                      className="font-bold text-slate-950 bg-transparent border-b border-dotted border-slate-700 focus:border-purple-500 px-1 py-0.5 outline-none"
                    />
                    <VoiceInputButton
                      onTranscript={(t) => handleFieldChange("noticeeName", t)}
                      currentValue={formData.noticeeName || ""}
                      fieldLabel={templateLang === "hi" ? "नाम" : "Name"}
                      iconOnly
                    />
                  </div>

                  {/* Residential Address section: placed immediately next to name */}
                  <div className="inline-flex items-baseline gap-1.5 flex-1 min-w-[240px]">
                    <EditableHeading
                      value={formData.headingAddress ?? (templateLang === "hi" ? "निवास स्थान (पता):" : "Residential Address:")}
                      onChange={(val) => handleFieldChange("headingAddress", val)}
                      className="font-bold text-slate-700 whitespace-nowrap"
                    />
                    <AutoGrowingInput
                      value={formData.noticeeAddress || ""}
                      onChange={(e) => handleFieldChange("noticeeAddress", e.target.value)}
                      placeholder={templateLang === "hi" ? "पूरा पता..." : "Complete Address..."}
                      minChars={(formData.noticeeAddress || "").length > 0 ? (formData.noticeeAddress || "").length + 2 : 20}
                      className="font-bold text-slate-950 bg-transparent border-b border-dotted border-slate-700 focus:border-purple-500 px-1 py-0.5 outline-none flex-1"
                    />
                    <VoiceInputButton
                      onTranscript={(t) =>
                        handleFieldChange(
                          "noticeeAddress",
                          (formData.noticeeAddress ? formData.noticeeAddress + " " : "") + t
                        )
                      }
                      currentValue={formData.noticeeAddress || ""}
                      fieldLabel={templateLang === "hi" ? "पूरा पता" : "Address"}
                      iconOnly
                    />
                  </div>
                </div>
              </div>

              {/* Case Allegation & Reference Narrative (Complete Auto-Growing In-Place Editable Paragraph) */}
              <div className="space-y-1">
                <AutoGrowingTextarea
                  rows={3}
                  value={
                    formData.para1CustomText !== undefined
                      ? formData.para1CustomText
                      : templateLang === "hi"
                        ? `आपको इस नोटिस के माध्यम से सूचित किया जाता है कि अभियोग संख्या ${formData.complaintNo || "____"} दिनांक ${formData.incidentDate || "____"} अंतर्गत धारा ${formData.sectionsOfLaw || "____"} थाना ${formData.policeStation || "____"} में दर्ज परिवादी ${formData.complainantName || "____"} के संदर्भ में अनुसंधान विचाराधीन है तथा अनुसंधान में शामिल होकर अपना पक्ष प्रस्तुत करने हेतु आपकी उपस्थिति अपेक्षित है।`
                        : `You are hereby notified that in connection with the investigation of Case / FIR No. ${formData.complaintNo || "____"} dated ${formData.incidentDate || "____"} under Section(s) ${formData.sectionsOfLaw || "____"} of Police Station ${formData.policeStation || "____"} lodged on complaint of ${formData.complainantName || "____"}, investigation is in progress and your appearance is required.`
                  }
                  onChange={(e) => handleFieldChange("para1CustomText", e.target.value)}
                  className="w-full text-justify leading-loose text-slate-950 font-medium bg-transparent hover:bg-slate-50 focus:bg-white border border-transparent hover:border-slate-300 focus:border-purple-500 rounded p-1.5 outline-none resize-none"
                  placeholder={templateLang === "hi" ? "अनुसंधान संदर्भ व उपस्थिति निर्देश..." : "Investigation narrative & appearance notice..."}
                />
              </div>

              {/* Allegation Paragraph */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <EditableHeading
                    value={formData.headingAllegations ?? (templateLang === "hi" ? "संक्षिप्त विषय/आरोप:" : "Brief Subject / Allegations:")}
                    onChange={(val) => handleFieldChange("headingAllegations", val)}
                    className="font-bold text-slate-900"
                  />
                  <VoiceInputButton
                    onTranscript={(t) =>
                      handleFieldChange(
                        "allegationsBrief",
                        (formData.allegationsBrief ? formData.allegationsBrief + " " : "") + t
                      )
                    }
                    currentValue={formData.allegationsBrief || ""}
                    fieldLabel={templateLang === "hi" ? "संक्षिप्त विषय/आरोप" : "Allegations Brief"}
                    iconOnly
                  />
                </div>
                <AutoGrowingTextarea
                  rows={1}
                  value={formData.allegationsBrief || ""}
                  onChange={(e) => handleFieldChange("allegationsBrief", e.target.value)}
                  className="w-full text-slate-900 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent hover:border-slate-300 focus:border-purple-500 rounded px-2 py-1 outline-none leading-relaxed"
                  placeholder={
                    templateLang === "hi"
                      ? "आरोप व विषय का संक्षिप्त विवरण..."
                      : "Brief summary of allegations and subject..."
                  }
                />
              </div>

              {/* Appearance Directives Box */}
              <div className="p-3 bg-slate-50 border border-slate-300 rounded-lg text-xs sm:text-[13px] space-y-3 font-sans">
                <div className="font-bold text-slate-900 flex items-center gap-1.5 border-b border-slate-200 pb-1">
                  <Clock className="w-3.5 h-3.5 text-purple-600" />
                  <EditableHeading
                    value={formData.headingDirectives ?? (templateLang === "hi" ? "उपस्थिति निर्देश:" : "Appearance Directives:")}
                    onChange={(val) => handleFieldChange("headingDirectives", val)}
                    className="font-bold text-slate-900"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <EditableHeading
                      value={formData.headingAppDate ?? (templateLang === "hi" ? "उपस्थिति दिनांक:" : "Date of Appearance:")}
                      onChange={(val) => handleFieldChange("headingAppDate", val)}
                      className="block font-semibold text-slate-700 text-xs mb-1"
                    />
                    <AutoDateField
                      value={formData.appearanceDate || ""}
                      onChange={(val) => handleFieldChange("appearanceDate", val)}
                      placeholder="DD-MM-YYYY"
                      className="w-full font-bold text-slate-950 bg-white border border-slate-300 rounded px-2 py-1 outline-none focus:border-purple-500 text-left"
                    />
                  </div>

                  <div>
                    <EditableHeading
                      value={formData.headingAppTime ?? (templateLang === "hi" ? "उपस्थिति समय:" : "Time of Appearance:")}
                      onChange={(val) => handleFieldChange("headingAppTime", val)}
                      className="block font-semibold text-slate-700 text-xs mb-1"
                    />
                    <AutoTimeField
                      value={formData.appearanceTime || ""}
                      onChange={(val) => handleFieldChange("appearanceTime", val)}
                      placeholder="11:00 AM"
                      className="w-full font-bold text-slate-950 bg-white border border-slate-300 rounded px-2 py-1 outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <EditableHeading
                      value={formData.headingAppPlace ?? (templateLang === "hi" ? "उपस्थिति स्थान:" : "Place of Appearance:")}
                      onChange={(val) => handleFieldChange("headingAppPlace", val)}
                      className="block font-semibold text-slate-700 text-xs mb-1"
                    />
                    <div className="flex items-center gap-1">
                      <AutoGrowingTextarea
                        rows={1}
                        value={
                          formData.appearancePlace ||
                          (templateLang === "hi"
                            ? `कार्यालय अनुसंधान अधिकारी, ${formatStationOrPost(formData.policeStation, "hi")}`
                            : `Office of Investigating Officer, ${formatStationOrPost(formData.policeStation, "en")}`)
                        }
                        onChange={(e) => handleFieldChange("appearancePlace", e.target.value)}
                        placeholder={templateLang === "hi" ? "स्थान" : "Place"}
                        className="w-full font-bold text-slate-950 bg-white border border-slate-300 rounded px-2 py-1"
                      />
                      <VoiceInputButton
                        onTranscript={(t) => handleFieldChange("appearancePlace", t)}
                        currentValue={formData.appearancePlace || ""}
                        fieldLabel={templateLang === "hi" ? "उपस्थिति स्थान" : "Appearance Place"}
                        iconOnly
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Statutory Warning Box */}
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg text-xs leading-relaxed text-amber-950 font-medium">
                <div className="flex items-center justify-between pb-1">
                  <strong>
                    <EditableHeading
                      value={
                        formData.headingWarning ??
                        (templateLang === "hi"
                          ? "वैधानिक चेतावनी (Statutory Clarification): "
                          : "Statutory Clarification / Warning: ")
                      }
                      onChange={(val) => handleFieldChange("headingWarning", val)}
                      className="font-bold text-amber-950"
                    />
                  </strong>
                  <VoiceInputButton
                    onTranscript={(t) =>
                      handleFieldChange(
                        "statutoryClarification",
                        (formData.statutoryClarification ? formData.statutoryClarification + " " : "") + t
                      )
                    }
                    currentValue={formData.statutoryClarification || ""}
                    fieldLabel={templateLang === "hi" ? "वैधानिक चेतावनी" : "Statutory Clarification"}
                    iconOnly
                  />
                </div>
                <AutoGrowingTextarea
                  rows={2}
                  value={
                    formData.statutoryClarification ||
                    (selectedTemplate === "section_35_notice"
                      ? templateLang === "hi"
                        ? "यदि आप उक्त तिथि व समय पर उपस्थित नहीं होते हैं अथवा नोटिस की शर्तों का पालन करने में विफल रहते हैं, तो धारा 35(6) BNSS के तहत सक्षम न्यायालय के आदेश पर आपकी गिरफ्तारी की जा सकती है।"
                        : "If you fail to attend on the specified date and time or fail to comply with the terms of this notice, you may be arrested on the order of the competent Court under Section 35(6) BNSS, 2023."
                      : templateLang === "hi"
                        ? "धारा 179 BNSS के अंतर्गत पुलिस अधिकारी द्वारा पूछे गए सभी प्रश्नों का सत्य उत्तर देना आपका विधिक दायित्व है।"
                        : "Under Section 179 BNSS, 2023, you are legally bound to answer truly all questions relating to the case put to you by the investigating officer.")
                  }
                  onChange={(e) => handleFieldChange("statutoryClarification", e.target.value)}
                  className="w-full bg-transparent border-0 outline-none p-1 mt-1 font-medium leading-relaxed"
                />
              </div>

              {/* Signature Block (Right-aligned 4 lines matching sample layout) */}
              <div className="pt-8 flex justify-end font-sans text-xs">
                <div className="w-72 text-right space-y-1">
                  {/* Line 1: Officer Name */}
                  <div>
                    <input
                      type="text"
                      value={formData.officerName || ""}
                      onChange={(e) => handleFieldChange("officerName", e.target.value)}
                      className="w-full font-bold text-slate-950 bg-transparent text-right outline-none"
                      placeholder={templateLang === "hi" ? "अनुसंधान अधिकारी का नाम" : "Name of Investigating Officer"}
                    />
                  </div>

                  {/* Line 2: Belt No - [Number] */}
                  <div className="flex items-center justify-end gap-1 w-full text-slate-700 font-semibold">
                    <AutoGrowingInput
                      value={
                        formData.officerPno
                          ? (/^belt\s*no/i.test(formData.officerPno.trim())
                              ? formData.officerPno
                              : (templateLang === "hi" ? `बेल्ट नं. - ${formData.officerPno}` : `Belt No - ${formData.officerPno}`))
                          : (formData.officerRank || (templateLang === "hi" ? "बेल्ट नं. - INS/1102" : "Belt No - INS/1102"))
                      }
                      onChange={(e) => handleFieldChange("officerPno", e.target.value)}
                      minChars={16}
                      className="text-slate-700 bg-transparent text-right outline-none font-semibold"
                      placeholder={templateLang === "hi" ? "बेल्ट नं. - INS/1102" : "Belt No - INS/1102"}
                    />
                  </div>

                  {/* Line 3: Police Station / Post (with PS or PP prefix) */}
                  <div>
                    <input
                      type="text"
                      value={
                        formData.policeStation
                          ? formatStationOrPost(formData.policeStation, templateLang === "hi" ? "hi" : "en")
                          : ""
                      }
                      onChange={(e) => handleFieldChange("policeStation", e.target.value)}
                      className="w-full text-slate-800 bg-transparent text-right outline-none font-medium"
                      placeholder={templateLang === "hi" ? "थाना / चौकी" : "PS / PP Unit"}
                    />
                  </div>

                  {/* Line 4: Date */}
                  <div className="flex items-center justify-end gap-1 w-full">
                    <EditableHeading
                      value={formData.headingSignDate ?? (templateLang === "hi" ? "दिनांक:" : "Date:")}
                      onChange={(val) => handleFieldChange("headingSignDate", val)}
                      className="font-semibold text-slate-700 whitespace-nowrap"
                    />
                    <AutoDateField
                      value={formData.issueDate || ""}
                      onChange={(val) => handleFieldChange("issueDate", val)}
                      placeholder="DD-MM-YYYY"
                      className="font-bold border-b border-dotted border-slate-600 bg-transparent text-right outline-none pl-1"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= TEMPLATE 2: CDR & DIGITAL EVIDENCE REQUISITION (हरियाणा पुलिस प्रारूप बाबत काल डिटेल) ================= */}
          {selectedTemplate === "cdr_requisition" && (
            <div className="space-y-6 text-slate-950 font-sans text-sm">
              {/* 1. Top Header: Left (थाना), Center (प्रारुप), Right (जिला, नम्बर, दिनांक) */}
              <div className="flex items-start justify-between gap-4 pt-2">
                <div className="w-1/3">
                  <input
                    type="text"
                    value={formData.policeStation || (templateLang === "hi" ? "थाना शहर पानीपत" : "Police Station City Panipat")}
                    onChange={(e) => handleFieldChange("policeStation", e.target.value)}
                    className="font-bold text-slate-900 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent hover:border-slate-300 focus:border-purple-500 rounded px-1.5 py-0.5 outline-none text-base"
                    placeholder={templateLang === "hi" ? "थाना शहर पानीपत" : "Police Station City Panipat"}
                  />
                </div>
                <div className="flex-1 text-center min-w-[280px]">
                  <AutoGrowingTextarea
                    rows={1}
                    value={formData.docTitle ?? (templateLang === "hi" ? "प्रारुप बाबत काल डिटेल" : "PROFORMA FOR CALL DETAIL RECORDS (CDR & IMEI)")}
                    onChange={(e) => handleFieldChange("docTitle", e.target.value)}
                    className="w-full font-black text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent hover:border-slate-300 focus:border-purple-500 rounded px-2 py-0.5 outline-none text-base sm:text-lg text-center"
                    placeholder={templateLang === "hi" ? "प्रारुप बाबत काल डिटेल" : "PROFORMA FOR CALL DETAIL RECORDS"}
                  />
                </div>
                <div className="w-1/3 text-right space-y-1">
                  <input
                    type="text"
                    value={
                      formData.district
                        ? templateLang === "hi"
                          ? formData.district.startsWith("जिला")
                            ? formData.district
                            : `जिला ${formData.district}`
                          : formData.district.startsWith("District")
                            ? formData.district
                            : `District ${formData.district.replace(/^जिला\s*/, "")}`
                        : templateLang === "hi"
                          ? "जिला पानीपत"
                          : "District Panipat"
                    }
                    onChange={(e) => handleFieldChange("district", e.target.value)}
                    className="font-bold text-slate-900 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent hover:border-slate-300 focus:border-purple-500 rounded px-1.5 py-0.5 outline-none text-base text-right w-full"
                    placeholder={templateLang === "hi" ? "जिला पानीपत" : "District Panipat"}
                  />
                  <div className="flex items-center justify-end gap-1 text-sm font-semibold text-slate-800">
                    <span>{templateLang === "hi" ? "नम्बर-" : "Memo No.-"}</span>
                    <input
                      type="text"
                      value={formData.dispatchNo || ""}
                      onChange={(e) => handleFieldChange("dispatchNo", e.target.value)}
                      placeholder="............"
                      className="w-28 text-slate-900 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent hover:border-slate-300 focus:border-purple-500 rounded px-1 outline-none text-right"
                    />
                  </div>
                  <div className="flex items-center justify-end gap-1 text-sm font-semibold text-slate-800">
                    <span>{templateLang === "hi" ? "दिनांक-" : "Date-"}</span>
                    <AutoDateField
                      value={formData.issueDate || ""}
                      onChange={(val) => handleFieldChange("issueDate", val)}
                      placeholder="DD-MM-YYYY"
                      className="min-w-[12ch] text-slate-900 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent hover:border-slate-300 focus:border-purple-500 rounded px-1 outline-none text-right font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Case Details Row */}
              <div className="grid grid-cols-12 items-start gap-2.5 py-2.5 border-y border-slate-300 text-sm font-bold text-slate-900 w-full">
                {/* 1. FIR / Case No. (3 cols) */}
                <div className="col-span-12 sm:col-span-3 flex items-start gap-1.5 min-w-0">
                  <span className="whitespace-nowrap shrink-0 text-xs sm:text-sm pt-0.5">
                    {templateLang === "hi" ? "अभियोग संख्या" : "FIR / Case No."}
                  </span>
                  <AutoGrowingTextarea
                    rows={1}
                    value={formData.complaintNo || ""}
                    onChange={(e) => handleFieldChange("complaintNo", e.target.value)}
                    placeholder="128/2026"
                    className="w-full font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-xs sm:text-sm leading-tight resize-none"
                  />
                </div>

                {/* 2. Date (2 cols) */}
                <div className="col-span-12 sm:col-span-2 flex items-start gap-1.5 min-w-0">
                  <span className="whitespace-nowrap shrink-0 text-xs sm:text-sm pt-0.5">
                    {templateLang === "hi" ? "दिनांक" : "Date"}
                  </span>
                  <AutoDateField
                    value={formData.incidentDate || ""}
                    onChange={(val) => handleFieldChange("incidentDate", val)}
                    placeholder="DD-MM-YYYY"
                    className="w-full font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-xs sm:text-sm text-center"
                  />
                </div>

                {/* 3. Section(s) (4.5 cols) */}
                <div className="col-span-12 sm:col-span-4 flex items-start gap-1.5 min-w-0">
                  <span className="whitespace-nowrap shrink-0 text-xs sm:text-sm pt-0.5">
                    {templateLang === "hi" ? "धारा" : "Section(s)"}
                  </span>
                  <AutoGrowingTextarea
                    rows={1}
                    value={formData.sectionsOfLaw || ""}
                    onChange={(e) => handleFieldChange("sectionsOfLaw", e.target.value)}
                    placeholder="318(4), 316(2) BNS"
                    className="w-full font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-xs sm:text-sm leading-tight resize-none"
                  />
                </div>

                {/* 4. Police Station (2.5 cols -> 3 cols) */}
                <div className="col-span-12 sm:col-span-3 flex items-start gap-1.5 min-w-0">
                  <span className="whitespace-nowrap shrink-0 text-xs sm:text-sm pt-0.5">
                    {templateLang === "hi"
                      ? (/police\s*post|\bpp\b|चौकी/i.test(formData.policeStation || "") ? "चौकी" : "थाना")
                      : (/police\s*post|\bpp\b|चौकी/i.test(formData.policeStation || "") ? "PP" : "PS")}
                  </span>
                  <AutoGrowingTextarea
                    rows={1}
                    value={
                      (formData.policeStation || (templateLang === "hi" ? "शहर पानीपत" : "City Panipat"))
                        .replace(/^(Police\s*Station|Police\s*Post|PS|PP|थाना|चौकी)\s*/i, "")
                        .replace(/\s*(Police\s*Station|Police\s*Post|PS|PP|थाना|चौकी)$/i, "")
                        .trim()
                    }
                    onChange={(e) => {
                      const typed = e.target.value;
                      const isPp = /police\s*post|\bpp\b|चौकी/i.test(formData.policeStation || "");
                      const prefix = templateLang === "hi" ? (isPp ? "चौकी " : "थाना ") : (isPp ? "PS " : "PS ");
                      handleFieldChange("policeStation", prefix + typed.replace(/^(Police\s*Station|Police\s*Post|PS|PP|थाना|चौकी)\s*/i, "").trim());
                    }}
                    placeholder={templateLang === "hi" ? "शहर पानीपत" : "Model Town Panipat"}
                    className="w-full font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-xs sm:text-sm leading-tight resize-none"
                  />
                </div>
              </div>

              {/* 3. सेवा में, पुलिस अधीक्षक पानीपत। */}
              <div className="space-y-1 text-sm">
                <p className="font-bold text-slate-900">{templateLang === "hi" ? "सेवा में," : "To,"}</p>
                <div className="pl-8">
                  <input
                    type="text"
                    value={
                      formData.toAuthority ||
                      (templateLang === "hi" ? "पुलिस अधीक्षक पानीपत।" : "The Superintendent of Police, Panipat.")
                    }
                    onChange={(e) => handleFieldChange("toAuthority", e.target.value)}
                    className="font-bold text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent hover:border-slate-300 focus:border-purple-500 rounded px-1.5 py-0.5 outline-none w-full max-w-md text-sm"
                    placeholder={templateLang === "hi" ? "पुलिस अधीक्षक पानीपत।" : "The Superintendent of Police, Panipat."}
                  />
                </div>
              </div>

              {/* 4. श्रीमान जी, निवेदन है कि... */}
              <div className="space-y-1 text-sm">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-slate-900">
                    {templateLang === "hi" ? "श्रीमान जी," : "Respected Sir,"}
                  </p>
                  <VoiceInputButton
                    onTranscript={(t) =>
                      handleFieldChange(
                        "allegationsBrief",
                        (formData.allegationsBrief ? formData.allegationsBrief + " " : "") + t
                      )
                    }
                    currentValue={formData.allegationsBrief || ""}
                    fieldLabel={templateLang === "hi" ? "निवेदन विवरण" : "Requisition Details"}
                    iconOnly
                  />
                </div>
                <div className="pl-8">
                  <AutoGrowingTextarea
                    rows={2}
                    value={
                      formData.allegationsBrief ||
                      (templateLang === "hi"
                        ? "निवेदन है कि उपरोक्त अभियोग में निम्नलिखित मोबाईल फोन की काल डिटेल व कैफ आई0डी0/आई.एम.ई.आई. की सर्चिंग की आवश्यकता है। उपलब्ध करवायी जावे।"
                        : "It is submitted that for the investigation of the above case, Call Detail Records (CDR), CAF ID and IMEI search are required for the following mobile phone numbers. It is requested to provide the same.")
                    }
                    onChange={(e) => handleFieldChange("allegationsBrief", e.target.value)}
                    className="w-full font-medium text-slate-900 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent hover:border-slate-300 focus:border-purple-500 rounded p-1.5 outline-none leading-relaxed text-sm block"
                    placeholder={
                      templateLang === "hi"
                        ? "निवेदन है कि उपरोक्त अभियोग में निम्नलिखित मोबाईल फोन की काल डिटेल व कैफ आई0डी0/आई.एम.ई.आई. की सर्चिंग की आवश्यकता है। उपलब्ध करवायी जावे।"
                        : "It is submitted that for the investigation of the above case, Call Detail Records (CDR), CAF ID and IMEI search are required..."
                    }
                  />
                </div>
              </div>

              {/* 5. The Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between no-print">
                  <span className="text-xs font-bold text-slate-700">
                    {templateLang === "hi"
                      ? `मोबाईल फोन विवरण तालिका (${cdrTargetRows.length} पंक्तियाँ):`
                      : `Target Device / CDR Table (${cdrTargetRows.length} Rows):`}
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
                      <span>{templateLang === "hi" ? "नई पंक्ति जोड़ें (Add Row)" : "Add Target Row"}</span>
                    </Button>
                  </div>
                </div>

                <div className="overflow-x-auto border-2 border-slate-900">
                  <TableResizeToolbar
                    hasCustomSizes={cdrTableResize.hasCustomSizes}
                    onReset={cdrTableResize.resetSizes}
                  />
                  <table className="w-full table-fixed border-collapse text-xs text-slate-900 font-sans">
                    <thead>
                      <tr className="bg-slate-50 border-b-2 border-slate-900">
                        <th
                          rowSpan={2}
                          style={{
                            width: cdrTableResize.colWidths[0] ? `${cdrTableResize.colWidths[0]}px` : undefined,
                            minWidth: cdrTableResize.colWidths[0] ? `${cdrTableResize.colWidths[0]}px` : undefined,
                          }}
                          className="relative p-2 font-black border-r-2 border-slate-900 text-center align-middle" style={{ width: cdrTableResize.colWidths[0] ? `${cdrTableResize.colWidths[0]}px` : "7%" }}
                        >
                          {templateLang === "hi" ? "क्र.स." : "Sr. No."}
                          <TableColResizer onResize={(e) => cdrTableResize.startColResize(0, e)} />
                        </th>
                        <th
                          rowSpan={2}
                          style={{
                            width: cdrTableResize.colWidths[1] ? `${cdrTableResize.colWidths[1]}px` : undefined,
                            width: cdrTableResize.colWidths[1] ? `${cdrTableResize.colWidths[1]}px` : "33%",
                          }}
                          className="relative p-2 font-black border-r-2 border-slate-900 text-center align-middle"
                        >
                          {templateLang === "hi"
                            ? "मोबाईल फोन/ आई.एम.ई.आई. / आई पी/ व्हाटसअप नम्बर जिनकी डिटेल की आवश्यकता है"
                            : "Mobile Phone / IMEI / IP / WhatsApp Numbers for Requisition"}
                          <TableColResizer onResize={(e) => cdrTableResize.startColResize(1, e)} />
                        </th>
                        <th
                          colSpan={2}
                          className="p-1.5 font-black border-r-2 border-slate-900 text-center border-b-2 border-slate-900"
                        >
                          {templateLang === "hi" ? "समय अवधि" : "Period / Duration"}
                        </th>
                        <th
                          rowSpan={2}
                          style={{
                            width: cdrTableResize.colWidths[4] ? `${cdrTableResize.colWidths[4]}px` : undefined,
                            width: cdrTableResize.colWidths[4] ? `${cdrTableResize.colWidths[4]}px` : "36%",
                          }}
                          className="relative p-2 font-black border-r-2 border-slate-900 text-center align-middle"
                        >
                          {templateLang === "hi"
                            ? "अभियोग का विवरण एवं डाटा किस कारण से जरूरी है संक्षिप्त विवरण"
                            : "Brief Case Facts & Justification for Data Requirement"}
                          <TableColResizer onResize={(e) => cdrTableResize.startColResize(4, e)} />
                        </th>
                        <th rowSpan={2} className="w-10 p-1 font-black text-center align-middle no-print">
                          {templateLang === "hi" ? "हटाएं" : "Delete"}
                        </th>
                      </tr>
                      <tr className="bg-slate-50 border-b-2 border-slate-900">
                        <th
                          style={{
                            width: cdrTableResize.colWidths[2] ? `${cdrTableResize.colWidths[2]}px` : undefined,
                            minWidth: cdrTableResize.colWidths[2] ? `${cdrTableResize.colWidths[2]}px` : undefined,
                          }}
                          className="relative p-1.5 font-black border-r-2 border-slate-900 text-center" style={{ width: cdrTableResize.colWidths[2] ? `${cdrTableResize.colWidths[2]}px` : "12%" }}
                        >
                          {templateLang === "hi" ? "कब से" : "From"}
                          <TableColResizer onResize={(e) => cdrTableResize.startColResize(2, e)} />
                        </th>
                        <th
                          style={{
                            width: cdrTableResize.colWidths[3] ? `${cdrTableResize.colWidths[3]}px` : undefined,
                            minWidth: cdrTableResize.colWidths[3] ? `${cdrTableResize.colWidths[3]}px` : undefined,
                          }}
                          className="relative p-1.5 font-black border-r-2 border-slate-900 text-center" style={{ width: cdrTableResize.colWidths[3] ? `${cdrTableResize.colWidths[3]}px` : "12%" }}
                        >
                          {templateLang === "hi" ? "कब तक" : "To"}
                          <TableColResizer onResize={(e) => cdrTableResize.startColResize(3, e)} />
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {cdrTargetRows.map((row, index) => (
                        <tr
                          key={row.id}
                          style={{
                            height: cdrTableResize.rowHeights[index] ? `${cdrTableResize.rowHeights[index]}px` : undefined,
                          }}
                          className="border-b border-slate-900 hover:bg-slate-50/50"
                        >
                          <td className="relative p-2 border-r-2 border-slate-900 text-center font-bold align-middle">
                            {index + 1}
                            <TableRowResizer onResize={(e) => cdrTableResize.startRowResize(index, e)} />
                          </td>
                          <td className="p-1 border-r-2 border-slate-900 align-middle">
                            <AutoGrowingTextarea
                              rows={1}
                              value={row.phone}
                              onChange={(e) => handleUpdateCdrRow(row.id, "phone", e.target.value)}
                              placeholder="मोबाईल / IMEI / IP / WhatsApp"
                              className="w-full text-xs font-semibold text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-purple-400 p-1 rounded outline-none block break-all"
                            />
                          </td>
                          <td className="p-1 border-r-2 border-slate-900 align-middle">
                            <AutoDateField
                              value={row.periodFrom || ""}
                              onChange={(val) => handleUpdateCdrRow(row.id, "periodFrom", val)}
                              placeholder="DD-MM-YYYY"
                              className="w-full text-xs text-center text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-purple-400 p-1 rounded outline-none"
                            />
                          </td>
                          <td className="p-1 border-r-2 border-slate-900 align-middle">
                            <AutoDateField
                              value={row.periodTo || ""}
                              onChange={(val) => handleUpdateCdrRow(row.id, "periodTo", val)}
                              placeholder="DD-MM-YYYY"
                              className="w-full text-xs text-center text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-purple-400 p-1 rounded outline-none"
                            />
                          </td>
                          <td className="p-1 border-r-2 border-slate-900 align-middle">
                            <div className="flex items-center gap-1">
                              <AutoGrowingTextarea
                                rows={1}
                                value={row.reason || ""}
                                onChange={(e) => handleUpdateCdrRow(row.id, "reason", e.target.value)}
                                placeholder={
                                  templateLang === "hi"
                                    ? "अभियोग का संक्षिप्त विवरण व डाटा का कारण"
                                    : "Brief case facts & reason for CDR requisition"
                                }
                                className="w-full text-xs text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-purple-400 p-1 rounded outline-none block break-words"
                              />
                              <VoiceInputButton
                                onTranscript={(t) =>
                                  handleUpdateCdrRow(
                                    row.id,
                                    "reason",
                                    (row.reason ? row.reason + " " : "") + t
                                  )
                                }
                                currentValue={row.reason || ""}
                                fieldLabel={templateLang === "hi" ? "डाटा का कारण" : "Reason for Data"}
                                iconOnly
                              />
                            </div>
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

              {/* 6. Legal Undertakings */}
              {templateLang === "hi" ? (
                <div className="space-y-1.5 text-xs text-slate-900 font-medium pt-2">
                  <p className="flex items-start gap-1.5">
                    <span className="font-bold">1.</span>
                    <span>
                      उपभोक्ता की पहचान सुनिश्चित कर ली गई है और यह आश्वस्त किया जाता है कि संबंधित व्यक्ति की काल डिटेल संवेदनशील प्रकृति की नहीं है।
                    </span>
                  </p>
                  <p className="flex items-start gap-1.5">
                    <span className="font-bold">2.</span>
                    <span>यह नंबर किसी आसीन सांसद / विधायक / विधान पार्षद अथवा राज्यपाल के नाम पर पंजीकृत नहीं है।</span>
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5 text-xs text-slate-900 font-medium pt-2">
                  <p className="flex items-start gap-1.5">
                    <span className="font-bold">1.</span>
                    <span>
                      The Subscriber identity has been ascertained and it is ensured that person in question is not
                      someone whose call details are of sensitive nature.
                    </span>
                  </p>
                  <p className="flex items-start gap-1.5">
                    <span className="font-bold">2.</span>
                    <span>The number is not subscribed in the name of a sitting MP/MLA/MLC &amp; Governor.</span>
                  </p>
                </div>
              )}

              {/* 7. Signatures and Forwarding blocks */}
              <div className="pt-6 space-y-10">
                <div className="flex justify-end">
                  <div className="w-64 space-y-1.5 text-xs">
                    <p className="font-bold text-slate-950">
                      {templateLang === "hi" ? "हस्ताक्षर अनुसंधान अधिकारी" : "Signature of Investigating Officer"}
                    </p>
                    <div className="flex items-center gap-1">
                      <span className="font-semibold text-slate-800">
                        {templateLang === "hi" ? "नाम-" : "Name-"}
                      </span>
                      <input
                        type="text"
                        value={formData.officerName || ""}
                        onChange={(e) => handleFieldChange("officerName", e.target.value)}
                        placeholder="................................"
                        className="w-full text-xs text-slate-900 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-purple-400 px-1 py-0.5 outline-none"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-semibold text-slate-800">
                        {templateLang === "hi" ? "रैन्क-" : "Rank-"}
                      </span>
                      <input
                        type="text"
                        value={formData.officerRank || ""}
                        onChange={(e) => handleFieldChange("officerRank", e.target.value)}
                        placeholder="..............................."
                        className="w-full text-xs text-slate-900 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-purple-400 px-1 py-0.5 outline-none"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-semibold text-slate-800">
                        {templateLang === "hi" ? "फोन न0-" : "Phone No.-"}
                      </span>
                      <input
                        type="text"
                        value={formData.officerPhone || ""}
                        onChange={(e) => handleFieldChange("officerPhone", e.target.value)}
                        placeholder="..........................."
                        className="w-full text-xs text-slate-900 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-purple-400 px-1 py-0.5 outline-none"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-semibold text-slate-800">
                        {templateLang === "hi" ? "थाना/यूनिट-" : "Police Station/Unit-"}
                      </span>
                      <input
                        type="text"
                        value={formData.policeStation || ""}
                        onChange={(e) => handleFieldChange("policeStation", e.target.value)}
                        placeholder="...................."
                        className="w-full text-xs text-slate-900 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-purple-400 px-1 py-0.5 outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-6 pt-4">
                  <div className="text-left w-56 space-y-1 text-xs">
                    <p className="font-bold text-slate-900">
                      {templateLang === "hi" ? "अग्रेषित" : "Forwarded"}
                    </p>
                    <input
                      type="text"
                      value={
                        formData.shoName ||
                        (templateLang === "hi" ? "प्रबंधक अफसर" : "Station House Officer (SHO)")
                      }
                      onChange={(e) => handleFieldChange("shoName", e.target.value)}
                      className="font-bold text-slate-900 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-purple-400 px-1 py-0.5 outline-none w-full"
                    />
                  </div>

                  <div className="text-center w-72 mx-auto space-y-1 text-xs">
                    <p className="font-bold text-slate-900">
                      {templateLang === "hi" ? "अग्रेषित" : "Forwarded"}
                    </p>
                    <input
                      type="text"
                      value={
                        formData.supervisoryOfficerName ||
                        (templateLang === "hi" ? "पर्यवेक्षण अधिकारी" : "Supervisory Officer (DSP)")
                      }
                      onChange={(e) => handleFieldChange("supervisoryOfficerName", e.target.value)}
                      className="font-bold text-slate-900 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-purple-400 px-1 py-0.5 outline-none w-full text-center"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= TEMPLATE 4: NATGRID PERFORMA (EXACT OFFICIAL LAYOUT) ================= */}
          {selectedTemplate === "natgrid_proforma" && (
            <div className="space-y-4 text-slate-950 font-serif">
              {/* Centered Heading: NATGRID PERFORMA */}
              <div className="text-center pt-2 pb-2">
                <AutoGrowingTextarea
                  rows={1}
                  value={
                    formData.docTitle ??
                    (templateLang === "hi" ? "राष्ट्रीय आसूचना ग्रिड (NATGRID) प्रपत्र" : "NATGRID PERFORMA")
                  }
                  onChange={(e) => handleFieldChange("docTitle", e.target.value)}
                  className="w-full font-bold text-slate-950 underline underline-offset-4 text-base sm:text-lg text-center bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent hover:border-slate-300 focus:border-purple-500 rounded px-2 py-0.5 outline-none tracking-wide resize-none"
                  placeholder={templateLang === "hi" ? "राष्ट्रीय आसूचना ग्रिड (NATGRID) प्रपत्र" : "NATGRID PERFORMA"}
                />
              </div>

              {/* Official 12-Row Bordered Table */}
              <TableResizeToolbar
                hasCustomSizes={natgridTableResize.hasCustomSizes}
                onReset={natgridTableResize.resetSizes}
              />
              <div className="border-[1.5px] border-slate-950 rounded-none overflow-hidden">
                <table className="w-full border-collapse text-xs sm:text-[13px] text-slate-950">
                  <tbody>
                    {/* Row 1: Name of Incharge Unit/SHO */}
                    <tr
                      style={{
                        height: natgridTableResize.rowHeights[0] ? `${natgridTableResize.rowHeights[0]}px` : undefined,
                      }}
                      className="border-b border-slate-950"
                    >
                      <td
                        style={{
                          width: natgridTableResize.colWidths[0] ? `${natgridTableResize.colWidths[0]}px` : undefined,
                          minWidth: natgridTableResize.colWidths[0] ? `${natgridTableResize.colWidths[0]}px` : undefined,
                        }}
                        className="relative w-[28%] p-2 font-medium border-r border-slate-950 align-top leading-tight"
                      >
                        {templateLang === "hi" ? (
                          <>प्रभारी यूनिट / SHO<br />का नाम (मय पद)</>
                        ) : (
                          <>Name of Incharge<br />Unit/SHO (with<br />Rank)</>
                        )}
                        <TableColResizer onResize={(e) => natgridTableResize.startColResize(0, e)} />
                        <TableRowResizer onResize={(e) => natgridTableResize.startRowResize(0, e)} />
                      </td>
                      <td colSpan={3} className="p-2 align-top">
                        <AutoGrowingTextarea
                          rows={1}
                          value={formData.shoName || ""}
                          onChange={(e) => handleFieldChange("shoName", e.target.value)}
                          placeholder={templateLang === "hi" ? "निरीक्षक, प्रबंधक अफसर (SHO)" : "Inspector, SHO"}
                          className="w-full font-medium text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-purple-500 rounded px-1.5 py-0.5 outline-none resize-none leading-tight"
                        />
                      </td>
                    </tr>

                    {/* Row 2: Mobile No. */}
                    <tr
                      style={{
                        height: natgridTableResize.rowHeights[1] ? `${natgridTableResize.rowHeights[1]}px` : undefined,
                      }}
                      className="border-b border-slate-950"
                    >
                      <td className="relative p-2 font-medium border-r border-slate-950 align-top">
                        {templateLang === "hi" ? "मोबाईल नं." : "Mobile No."}
                        <TableRowResizer onResize={(e) => natgridTableResize.startRowResize(1, e)} />
                      </td>
                      <td colSpan={3} className="p-2 align-top">
                        <AutoGrowingTextarea
                          rows={1}
                          value={formData.shoPhone || ""}
                          onChange={(e) => handleFieldChange("shoPhone", e.target.value)}
                          placeholder={templateLang === "hi" ? "प्रबंधक अफसर मोबाईल नं." : "SHO Mobile Number"}
                          className="w-full font-medium text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-purple-500 rounded px-1.5 py-0.5 outline-none resize-none leading-tight"
                        />
                      </td>
                    </tr>

                    {/* Row 3: Govt. Email ID */}
                    <tr
                      style={{
                        height: natgridTableResize.rowHeights[2] ? `${natgridTableResize.rowHeights[2]}px` : undefined,
                      }}
                      className="border-b border-slate-950"
                    >
                      <td className="relative p-2 font-medium border-r border-slate-950 align-top">
                        {templateLang === "hi" ? "शासकीय ईमेल आईडी" : "Govt. Email ID"}
                        <TableRowResizer onResize={(e) => natgridTableResize.startRowResize(2, e)} />
                      </td>
                      <td colSpan={3} className="p-2 align-top">
                        <AutoGrowingTextarea
                          rows={1}
                          value={formData.shoEmail || ""}
                          onChange={(e) => handleFieldChange("shoEmail", e.target.value)}
                          placeholder={templateLang === "hi" ? "शासकीय ईमेल आईडी" : "Official Govt Email ID"}
                          className="w-full font-medium text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-purple-500 rounded px-1.5 py-0.5 outline-none resize-none leading-tight"
                        />
                      </td>
                    </tr>

                    {/* Row 4: FIR No. | Date :- | P.S. | District */}
                    <tr
                      style={{
                        height: natgridTableResize.rowHeights[3] ? `${natgridTableResize.rowHeights[3]}px` : undefined,
                      }}
                      className="border-b border-slate-950"
                    >
                      <td className="relative w-[28%] p-2 border-r border-slate-950 align-top">
                        <TableRowResizer onResize={(e) => natgridTableResize.startRowResize(3, e)} />
                        <div className="flex items-center gap-1 font-bold">
                          <span className="whitespace-nowrap">
                            {templateLang === "hi" ? "मुकद्दमा सं." : "FIR No."}
                          </span>
                          <AutoGrowingTextarea
                            rows={1}
                            value={formData.complaintNo || ""}
                            onChange={(e) => handleFieldChange("complaintNo", e.target.value)}
                            placeholder="184/2026"
                            className="w-full font-normal text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-purple-500 rounded px-1 py-0.5 outline-none resize-none leading-tight"
                          />
                        </div>
                      </td>
                      <td className="w-[24%] p-2 border-r border-slate-950 align-top">
                        <div className="flex items-center gap-1 font-bold">
                          <span className="whitespace-nowrap">
                            {templateLang === "hi" ? "दिनांक :-" : "Date :-"}
                          </span>
                          <AutoDateField
                            value={toDDMMYYYY(formData.incidentDate || formData.issueDate || "")}
                            onChange={(val) => handleFieldChange("incidentDate", val)}
                            placeholder="DD-MM-YYYY"
                            className="w-full font-normal text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-purple-500 rounded px-1 py-0.5 outline-none text-center"
                          />
                        </div>
                      </td>
                      <td className="w-[24%] p-2 border-r border-slate-950 align-top">
                        <div className="flex items-center gap-1 font-bold">
                          <span className="whitespace-nowrap">
                            {templateLang === "hi" ? "थाना" : "P.S."}
                          </span>
                          <AutoGrowingTextarea
                            rows={1}
                            value={formData.policeStation || ""}
                            onChange={(e) => handleFieldChange("policeStation", e.target.value)}
                            placeholder={templateLang === "hi" ? "थाना शहर सिरसा" : "City Sirsa"}
                            className="w-full font-normal text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-purple-500 rounded px-1 py-0.5 outline-none resize-none leading-tight"
                          />
                        </div>
                      </td>
                      <td className="w-[24%] p-2 align-top">
                        <div className="flex items-center gap-1 font-bold">
                          <span className="whitespace-nowrap">
                            {templateLang === "hi" ? "जिला" : "District"}
                          </span>
                          <AutoGrowingTextarea
                            rows={1}
                            value={formData.district || ""}
                            onChange={(e) => handleFieldChange("district", e.target.value)}
                            placeholder={templateLang === "hi" ? "सिरसा" : "Sirsa"}
                            className="w-full font-normal text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-purple-500 rounded px-1 py-0.5 outline-none resize-none leading-tight"
                          />
                        </div>
                      </td>
                    </tr>

                    {/* Row 5: Offence U/s */}
                    <tr
                      style={{
                        height: natgridTableResize.rowHeights[4] ? `${natgridTableResize.rowHeights[4]}px` : undefined,
                      }}
                      className="border-b border-slate-950"
                    >
                      <td colSpan={4} className="relative p-2 align-top">
                        <TableRowResizer onResize={(e) => natgridTableResize.startRowResize(4, e)} />
                        <div className="flex items-center gap-1 font-bold">
                          <span className="whitespace-nowrap">
                            {templateLang === "hi" ? "अपराध अंतर्गत धाराएं" : "Offence U/s"}
                          </span>
                          <AutoGrowingTextarea
                            rows={1}
                            value={formData.sectionsOfLaw || ""}
                            onChange={(e) => handleFieldChange("sectionsOfLaw", e.target.value)}
                            placeholder="Section 318(4), 316(2), 336(3), 61(2) BNS, 2023 & Sec 66D IT Act"
                            className="w-full font-normal text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-purple-500 rounded px-1.5 py-0.5 outline-none resize-none leading-tight"
                          />
                        </div>
                      </td>
                    </tr>

                    {/* Row 6: Brief summary of case */}
                    <tr
                      style={{
                        height: natgridTableResize.rowHeights[5] ? `${natgridTableResize.rowHeights[5]}px` : undefined,
                      }}
                      className="border-b border-slate-950"
                    >
                      <td colSpan={4} className="relative p-2 align-top space-y-1">
                        <TableRowResizer onResize={(e) => natgridTableResize.startRowResize(5, e)} />
                        <div className="font-bold text-slate-950">
                          {templateLang === "hi"
                            ? "अभियोग का संक्षिप्त विवरण :- “ ”"
                            : "Brief summary of case :- “”"}
                        </div>
                        <AutoGrowingTextarea
                          rows={2}
                          value={formData.allegationsBrief || ""}
                          onChange={(e) => handleFieldChange("allegationsBrief", e.target.value)}
                          placeholder={
                            templateLang === "hi"
                              ? "संगठित वित्तीय धोखाधड़ी और अंतर-राज्यीय साइबर गिरोह द्वारा पीड़ितों से ठगी करने बाबत..."
                              : "Organized financial fraud and inter-state syndicate cheating victims..."
                          }
                          className="w-full font-sans text-xs sm:text-[13px] text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-purple-500 rounded p-1.5 outline-none leading-relaxed resize-none"
                        />
                      </td>
                    </tr>

                    {/* Row 7: Name/Rank of I.O. with Mobile No */}
                    <tr
                      style={{
                        height: natgridTableResize.rowHeights[6] ? `${natgridTableResize.rowHeights[6]}px` : undefined,
                      }}
                      className="border-b border-slate-950"
                    >
                      <td colSpan={4} className="relative p-2 align-top">
                        <TableRowResizer onResize={(e) => natgridTableResize.startRowResize(6, e)} />
                        <div className="flex flex-wrap items-center gap-1 font-bold text-slate-950">
                          <span className="whitespace-nowrap">
                            {templateLang === "hi"
                              ? "अनुसंधान अधिकारी का नाम/रैंक व मोबाईल नं. :-"
                              : "Name/Rank of I.O. with Mobile No :-"}
                          </span>
                          <AutoGrowingTextarea
                            rows={1}
                            value={formData.officerName || ""}
                            onChange={(e) => handleFieldChange("officerName", e.target.value)}
                            placeholder={templateLang === "hi" ? "सुरेन्द्र पाल" : "Surender Pal"}
                            className="font-normal text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-purple-500 rounded px-1.5 py-0.5 outline-none resize-none min-w-[120px] max-w-full leading-tight"
                          />
                          <span className="font-normal">/</span>
                          <AutoGrowingTextarea
                            rows={1}
                            value={formData.officerRank || ""}
                            onChange={(e) => handleFieldChange("officerRank", e.target.value)}
                            placeholder={templateLang === "hi" ? "सब-इंस्पेक्टर" : "Sub-Inspector"}
                            className="font-normal text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-purple-500 rounded px-1.5 py-0.5 outline-none resize-none min-w-[110px] max-w-full leading-tight"
                          />
                          <span className="font-normal">, Mob:</span>
                          <AutoGrowingTextarea
                            rows={1}
                            value={formData.officerPhone || ""}
                            onChange={(e) => handleFieldChange("officerPhone", e.target.value)}
                            placeholder="9812034567"
                            className="font-normal text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-purple-500 rounded px-1.5 py-0.5 outline-none resize-none min-w-[110px] max-w-full leading-tight"
                          />
                        </div>
                      </td>
                    </tr>

                    {/* Row 8: For what reason/purpose this case is related to */}
                    <tr
                      style={{
                        height: natgridTableResize.rowHeights[7] ? `${natgridTableResize.rowHeights[7]}px` : undefined,
                      }}
                      className="border-b border-slate-950"
                    >
                      <td colSpan={3} className="relative p-2.5 border-r border-slate-950 align-middle">
                        <TableRowResizer onResize={(e) => natgridTableResize.startRowResize(7, e)} />
                        <div className="font-medium text-slate-950 mb-1">
                          {templateLang === "hi"
                            ? "यह अभियोग किस प्रयोजन/श्रेणी से संबंधित है:"
                            : "For what reason/purpose this case is related to"}
                        </div>
                        <div className="space-y-1 pl-1 text-slate-950 leading-relaxed font-normal">
                          <div>
                            {templateLang === "hi"
                              ? "1.  राष्ट्रीय सुरक्षा (National security)"
                              : "1.  National security"}
                          </div>
                          <div>
                            {templateLang === "hi"
                              ? "2.  आतंकवाद निरोध (Counter terror)"
                              : "2.  Counter terror"}
                          </div>
                          <div>
                            {templateLang === "hi"
                              ? "3.  जघन्य अपराध (सजा 7 वर्ष या अधिक - Heinous Crime)"
                              : "3.  Heinous Crime (Punishment should be 7 years or more)"}
                          </div>
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

                    {/* Row 9: Explain along with a Valid Reason */}
                    <tr
                      style={{
                        height: natgridTableResize.rowHeights[8] ? `${natgridTableResize.rowHeights[8]}px` : undefined,
                      }}
                      className="border-b border-slate-950"
                    >
                      <td colSpan={4} className="relative p-2 align-top">
                        <TableRowResizer onResize={(e) => natgridTableResize.startRowResize(8, e)} />
                        <div className="flex items-center gap-1 font-bold text-slate-950">
                          <span className="whitespace-nowrap">
                            {templateLang === "hi"
                              ? "वैध कारण सहित स्पष्ट करें :-"
                              : "Explain along with a Valid Reason :-"}
                          </span>
                          <input
                            type="text"
                            value={
                              formData.natgridReason ||
                              (templateLang === "hi" ? "आरोपी को गिरफ्तार करने व साक्ष्य एकत्र करने हेतु" : "To apprehend the accused")
                            }
                            onChange={(e) => handleFieldChange("natgridReason", e.target.value)}
                            placeholder={templateLang === "hi" ? "आरोपी को गिरफ्तार करने हेतु" : "To apprehend the accused"}
                            className="w-full font-normal text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-purple-500 rounded px-1.5 py-0.5 outline-none"
                          />
                        </div>
                      </td>
                    </tr>

                    {/* Row 10: Name of Department from which Information is required */}
                    <tr
                      style={{
                        height: natgridTableResize.rowHeights[9] ? `${natgridTableResize.rowHeights[9]}px` : undefined,
                      }}
                      className="border-b border-slate-950"
                    >
                      <td colSpan={4} className="relative p-2 align-top">
                        <TableRowResizer onResize={(e) => natgridTableResize.startRowResize(9, e)} />
                        <div className="flex items-center gap-1 font-bold text-slate-950">
                          <span className="whitespace-nowrap">
                            {templateLang === "hi"
                              ? "जिस विभाग से सूचना अपेक्षित है उसका नाम:-"
                              : "Name of Department from which Information is required:-"}
                          </span>
                          <AutoGrowingTextarea
                            rows={1}
                            value={formData.natgridDepartment || ""}
                            onChange={(e) => handleFieldChange("natgridDepartment", e.target.value)}
                            placeholder={
                              templateLang === "hi"
                                ? "एफआईयू-इंड, आप्रवासन ब्यूरो, टेलीकॉम सेवा प्रदाता, आयकर पैन डेटाबेस"
                                : "FIU-IND, Bureau of Immigration (BOI), Telecom Providers, Income Tax PAN Database"
                            }
                            className="w-full font-normal text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-purple-500 rounded px-1.5 py-0.5 outline-none resize-none leading-tight"
                          />
                        </div>
                      </td>
                    </tr>

                    {/* Row 11: What type of information is required? */}
                    <tr
                      style={{
                        height: natgridTableResize.rowHeights[10] ? `${natgridTableResize.rowHeights[10]}px` : undefined,
                      }}
                      className="border-b border-slate-950"
                    >
                      <td colSpan={4} className="relative p-2 align-top space-y-1">
                        <TableRowResizer onResize={(e) => natgridTableResize.startRowResize(10, e)} />
                        <div className="font-bold text-slate-950">
                          {templateLang === "hi"
                            ? "किस प्रकार की सूचना अपेक्षित है?"
                            : "What type of information is required?"}
                        </div>
                        <AutoGrowingTextarea
                          rows={2}
                          value={formData.natgridInfoRequired || ""}
                          onChange={(e) => handleFieldChange("natgridInfoRequired", e.target.value)}
                          placeholder={
                            templateLang === "hi"
                              ? "पैन/आधार से जुड़े सभी बैंक खाते, घरेलू/अंतरराष्ट्रीय यात्रा इतिहास, सक्रिय पंजीकृत मोबाइल नंबर..."
                              : "All bank accounts linked to PAN/Aadhaar, domestic/international travel history, active registered mobile connections..."
                          }
                          className="w-full font-sans text-xs sm:text-[13px] text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-purple-500 rounded p-1.5 outline-none leading-relaxed resize-none"
                        />
                      </td>
                    </tr>

                    {/* Row 12: Information available at your end */}
                    <tr
                      style={{
                        height: natgridTableResize.rowHeights[11] ? `${natgridTableResize.rowHeights[11]}px` : undefined,
                      }}
                    >
                      <td colSpan={4} className="relative p-2.5 align-top space-y-1.5 text-slate-950">
                        <TableRowResizer onResize={(e) => natgridTableResize.startRowResize(11, e)} />
                        <div className="font-bold text-slate-950">
                          {templateLang === "hi"
                            ? "आपके स्तर पर उपलब्ध सूचना/विवरण:-"
                            : "Information available at your end:-"}
                        </div>

                        <div className="flex items-center gap-1 font-medium">
                          <span className="whitespace-nowrap w-44">
                            {templateLang === "hi" ? "नाम –" : "Name –"}
                          </span>
                          <AutoGrowingTextarea
                            rows={1}
                            value={formData.noticeeName || ""}
                            onChange={(e) => handleFieldChange("noticeeName", e.target.value)}
                            placeholder={templateLang === "hi" ? "विकास शर्मा" : "Vikas Sharma"}
                            className="w-full font-normal text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-purple-500 rounded px-1.5 py-0.5 outline-none resize-none leading-tight"
                          />
                        </div>

                        <div className="flex items-center gap-1 font-medium">
                          <span className="whitespace-nowrap w-44">
                            {templateLang === "hi" ? "पिता का नाम –" : "Father Name –"}
                          </span>
                          <AutoGrowingTextarea
                            rows={1}
                            value={formData.noticeeFather || ""}
                            onChange={(e) => handleFieldChange("noticeeFather", e.target.value)}
                            placeholder={templateLang === "hi" ? "रमेश चंद शर्मा" : "Ramesh Chand Sharma"}
                            className="w-full font-normal text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-purple-500 rounded px-1.5 py-0.5 outline-none resize-none leading-tight"
                          />
                        </div>

                        <div className="flex items-center gap-1 font-medium">
                          <span className="whitespace-nowrap w-44">
                            {templateLang === "hi" ? "पता –" : "Address –"}
                          </span>
                          <AutoGrowingTextarea
                            rows={1}
                            value={formData.noticeeAddress || ""}
                            onChange={(e) => handleFieldChange("noticeeAddress", e.target.value)}
                            placeholder={
                              templateLang === "hi"
                                ? "मकान नं. 412, सेक्टर 7, अर्बन एस्टेट, सिरसा, हरियाणा"
                                : "House No. 412, Sector 7, Urban Estate, Sirsa, Haryana"
                            }
                            className="w-full font-normal text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-purple-500 rounded px-1.5 py-0.5 outline-none resize-none leading-tight"
                          />
                        </div>

                        <div className="flex items-center gap-1 font-medium">
                          <span className="whitespace-nowrap w-44">
                            {templateLang === "hi" ? "जन्म तिथि –" : "Date of Birth –"}
                          </span>
                          <AutoDateField
                            value={toDDMMYYYY(formData.noticeeDob || "")}
                            onChange={(val) => {
                              handleFieldChange("noticeeDob", val);
                              handleFieldChange("appearanceDate", val);
                            }}
                            placeholder="DD-MM-YYYY"
                            className="w-full font-normal text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-purple-500 rounded px-1.5 py-0.5 outline-none"
                          />
                        </div>

                        <div className="flex items-center gap-1 font-medium">
                          <span className="whitespace-nowrap w-44">
                            {templateLang === "hi" ? "मोबाईल नं. –" : "Mobile No. –"}
                          </span>
                          <AutoGrowingTextarea
                            rows={1}
                            value={formData.noticeePhone || ""}
                            onChange={(e) => handleFieldChange("noticeePhone", e.target.value)}
                            placeholder="Verified phone number"
                            className="w-full font-normal text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-purple-500 rounded px-1.5 py-0.5 outline-none resize-none leading-tight"
                          />
                        </div>

                        <div className="flex items-center gap-1 font-medium">
                          <span className="whitespace-nowrap w-44">
                            {templateLang === "hi" ? "आधार नं. –" : "Aadhar No. –"}
                          </span>
                          <AutoGrowingTextarea
                            rows={1}
                            value={formData.accusedAadhaar || ""}
                            onChange={(e) => handleFieldChange("accusedAadhaar", e.target.value)}
                            placeholder="Verified identity number"
                            className="w-full font-normal text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-purple-500 rounded px-1.5 py-0.5 outline-none resize-none leading-tight"
                          />
                        </div>

                        <div className="flex items-center gap-1 font-medium">
                          <span className="whitespace-nowrap w-44">
                            {templateLang === "hi" ? "पैन नं. -" : "PAN -"}
                          </span>
                          <AutoGrowingTextarea
                            rows={1}
                            value={formData.accusedPan || ""}
                            onChange={(e) => handleFieldChange("accusedPan", e.target.value)}
                            placeholder="Verified PAN"
                            className="w-full font-normal text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-purple-500 rounded px-1.5 py-0.5 outline-none resize-none leading-tight"
                          />
                        </div>

                        <div className="flex items-center gap-1 font-medium">
                          <span className="whitespace-nowrap w-44">
                            {templateLang === "hi" ? "अन्य कोई जानकारी-" : "Any other information-"}
                          </span>
                          <AutoGrowingTextarea
                            rows={1}
                            value={formData.natgridOtherInfo || ""}
                            onChange={(e) => {
                              handleFieldChange("natgridOtherInfo", e.target.value);
                              handleFieldChange("documentsRequired", e.target.value);
                            }}
                            placeholder={
                              templateLang === "hi"
                                ? "पासपोर्ट सं. Z4920194, वाहन सं. HR-24-AK-5521"
                                : "Passport No. Z4920194, Vehicle No. HR-24-AK-5521"
                            }
                            className="w-full font-normal text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-purple-500 rounded px-1.5 py-0.5 outline-none resize-none leading-tight"
                          />
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Bottom Right Signature */}
              <div className="pt-12 sm:pt-16 flex justify-end pr-4 text-slate-950 font-serif">
                <div className="text-left space-y-1 text-xs sm:text-sm font-bold">
                  <p>
                    {templateLang === "hi"
                      ? "हस्ताक्षर प्रभारी / प्रबंधक अफसर (SHO)"
                      : "Signature of Incharge/SHO"}
                  </p>
                  <p>{templateLang === "hi" ? "मय मोहर / स्टाम्प" : "With Seal/Stamp"}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function FIRTemplatesPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs text-slate-500">
          Loading statutory notice generator...
        </div>
      }
    >
      <FIRTemplatesContent />
    </Suspense>
  );
}
