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
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { firService } from "@/services/firService";
import { FIRItem, NoticeFormData } from "@/types";
import { FIRWorkspaceNav } from "@/components/fir-workspace/FIRWorkspaceNav";
import { VoiceInputButton } from "@/components/ui/voice-input-button";

export type FIRNoticeTemplateType =
  | "section_35_notice"
  | "cdr_requisition"
  | "arrest_memo"
  | "natgrid_proforma"
  | "section_179_witness";

const DEFAULT_SAMPLE_DATA: Record<FIRNoticeTemplateType, NoticeFormData> = {
  section_35_notice: {
    headerDept: "हरियाणा पुलिस",
    headerGovt: "जिला अम्बाला।",
    docTitle: "सूचना-पत्र (धारा 35(3) BNSS)",
    docSubTitle: "Notice of Appearance under Section 35(3) Bharatiya Nagarik Suraksha Sanhita, 2023",
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
    noticeeRole: "अभियुक्त / आरोपी (Accused)",

    complaintNo: "128/2026",
    complainantName: "",
    complainantAddress: "",
    incidentDate: new Date().toLocaleDateString("hi-IN"),
    sectionsOfLaw: "धारा 318(4), 316(2) BNS",
    allegationsBrief:
      "उपरोक्त अभियोग में आपके विरुद्ध संज्ञेय अपराध के संबंध में उचित साक्ष्य एवं संदेह पाया गया है। तदनुसार अनुसंधान में शामिल होकर अपना पक्ष प्रस्तुत करने हेतु यह नोटिस जारी किया जाता है।",

    groundsBrief: "अनुसंधान में सहयोग एवं साक्ष्यों का परीक्षण करने हेतु।",
    appearanceDate: new Date(Date.now() + 2 * 86400000).toLocaleDateString("hi-IN"),
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

  section_179_witness: {
    headerDept: "हरियाणा पुलिस",
    headerGovt: "जिला अम्बाला।",
    docTitle: "साक्षी उपस्थिति आदेश (धारा 179 BNSS)",
    docSubTitle: "Witness Attendance Order under Section 179 Bharatiya Nagarik Suraksha Sanhita, 2023",
    recipientDesignation: "साक्षी / गवाह (Witness)",
    dispatchNo: "",
    policeStation: "थाना शहर अम्बाला",
    district: "जिला अम्बाला।",
    issueDate: new Date().toLocaleDateString("hi-IN"),

    noticeeName: "",
    noticeeFather: "",
    noticeeAge: "",
    noticeeAddress: "",
    noticeePhone: "",
    noticeeRole: "साक्षी / गवाह (Witness)",

    complaintNo: "128/2026",
    complainantName: "",
    complainantAddress: "",
    incidentDate: new Date().toLocaleDateString("hi-IN"),
    sectionsOfLaw: "धारा 318(4), 316(2) BNS",
    allegationsBrief:
      "उपरोक्त अभियोग के अनुसंधान से यह प्रतीत होता है कि आप कथित अपराध के तथ्यों व परिस्थितियों से भली-भांति परिचित हैं। अतः आपके बयान दर्ज करने आवश्यक हैं।",

    groundsBrief: "अभियोग में साक्ष्य एवं बयान धारा 180 BNSS के तहत अभिलिखित करने हेतु।",
    appearanceDate: new Date(Date.now() + 2 * 86400000).toLocaleDateString("hi-IN"),
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

const TEMPLATE_CONFIG: Record<
  FIRNoticeTemplateType,
  { label: string; badge: string; subTitle: string; description: string; icon: any; color: string }
> = {
  section_35_notice: {
    label: "1. Notice to Accused u/s 35(3) BNSS (सूचना-पत्र)",
    badge: "Accused Notice",
    subTitle: "Notice of Appearance under Section 35(3) Bharatiya Nagarik Suraksha Sanhita, 2023",
    description: "Statutory notice directed to accused person where arrest is not immediately requisite.",
    icon: FileText,
    color: "text-blue-600",
  },
  cdr_requisition: {
    label: "2. CDR & Digital Evidence Requisition (Panipat Format बाबत काल डिटेल)",
    badge: "CDR & IMEI Proforma",
    subTitle: "Call Detail Records, CAF, IMEI & WhatsApp requisition with non-VIP certificate",
    description: "Official Requisition under Section 94 BNSS to Telecom Service Provider Nodal Officer",
    icon: Phone,
    color: "text-purple-600",
  },
  arrest_memo: {
    label: "3. गिरफ्तारी/ न्यायालय में समर्पण फार्म 26.8(1) (4 पृष्ठ)",
    badge: "फार्म 26.8(1) (4 पृष्ठ)",
    subTitle: "गिरफ्तारी/न्यायालय समर्पण फार्म भाग-1 व 2, धारा 47 BNSS, जामा तलाशी, पहचान पत्र व 18-शारीरिक लक्षण",
    description: "Statutory 4-page memo recording arrest, intimation to family, Section 47 BNSS grounds, Jama Talashi & MHC records",
    icon: Shield,
    color: "text-red-600",
  },
  natgrid_proforma: {
    label: "4. NATGRID Intelligence Requisition Proforma",
    badge: "NATGRID Table",
    subTitle: "NATGRID Intelligence Requisition Proforma (Multi-Agency Intelligence Requisition)",
    description: "Multi-agency intelligence requisition table (Banks, Telecom, Immigration, VAHAN)",
    icon: Layers,
    color: "text-emerald-600",
  },
  section_179_witness: {
    label: "5. Witness Attendance Order (Sec 179 BNSS)",
    badge: "Witness Order",
    subTitle: "Order requiring attendance of witness under Section 179 BNSS, 2023",
    description: "Police officer order requiring attendance of persons acquainted with circumstances of case.",
    icon: Scale,
    color: "text-amber-600",
  },
};

function FIRTemplatesContent() {
  const { currentUser } = useAuth();
  const searchParams = useSearchParams();
  const firIdParam = searchParams.get("firId");

  const [firs, setFirs] = useState<FIRItem[]>([]);
  const [selectedFirId, setSelectedFirId] = useState<string>(firIdParam || "");
  const [selectedTemplate, setSelectedTemplate] = useState<FIRNoticeTemplateType>("section_35_notice");

  const [formData, setFormData] = useState<NoticeFormData>(DEFAULT_SAMPLE_DATA["section_35_notice"]);

  // Dynamic CDR Target Rows
  const [cdrTargetRows, setCdrTargetRows] = useState<
    Array<{ id: string; phone: string; periodFrom: string; periodTo: string; reason: string }>
  >([
    {
      id: "cdr_1",
      phone: "9812044551",
      periodFrom: "01-08-2026",
      periodTo: "18-09-2026",
      reason: "आरोपी द्वारा परिवादी को फर्जी कॉल कर धोखाधड़ी करने बाबत",
    },
    {
      id: "cdr_2",
      phone: "9416022331",
      periodFrom: "15-08-2026",
      periodTo: "18-09-2026",
      reason: "सह-आरोपी के साथ संपर्क व लोकेशन मिलान हेतु",
    },
  ]);

  const [fontSize, setFontSize] = useState<"compact" | "standard" | "large">("standard");
  const [voiceLang, setVoiceLang] = useState<"hi-IN" | "en-IN">("hi-IN");
  const [copied, setCopied] = useState(false);

  // Load all FIRs
  useEffect(() => {
    const list = firService.getAllFirs();
    setFirs(list);
    if (!selectedFirId && list.length > 0) {
      setSelectedFirId(list[0].id);
    }
  }, []);

  const activeFir = firs.find((f) => f.id === selectedFirId || f.firNumber === selectedFirId);

  // When active FIR or template changes, sync formData
  useEffect(() => {
    const baseSample = DEFAULT_SAMPLE_DATA[selectedTemplate] || DEFAULT_SAMPLE_DATA.section_35_notice;
    if (!activeFir) {
      setFormData(baseSample);
      return;
    }

    const primaryAccused = activeFir.accusedList?.[0] || null;
    const isWitness = selectedTemplate === "section_179_witness";

    const targetNoticeeName = isWitness
      ? activeFir.complainantName
      : primaryAccused?.name || baseSample.noticeeName;

    const targetNoticeeFather = isWitness
      ? activeFir.complainantFatherSpouse || ""
      : primaryAccused?.fatherName || baseSample.noticeeFather;

    const targetNoticeeAddress = isWitness
      ? activeFir.complainantAddress || ""
      : primaryAccused?.address || baseSample.noticeeAddress;

    const targetNoticeePhone = isWitness
      ? activeFir.complainantMobile || ""
      : primaryAccused?.phone || baseSample.noticeePhone;

    const targetNoticeeAge = (primaryAccused as any)?.age ? String((primaryAccused as any).age) : baseSample.noticeeAge || "";

    setFormData({
      ...baseSample,
      policeStation: activeFir.policeStation || baseSample.policeStation,
      district: activeFir.district ? (activeFir.district.startsWith("जिला") ? activeFir.district : `जिला ${activeFir.district}`) : baseSample.district,
      complaintNo: activeFir.firNumber || baseSample.complaintNo,
      complainantName: activeFir.complainantName || baseSample.complainantName,
      incidentDate: (activeFir as any)?.incidentDate || activeFir.incidentDateFrom || activeFir.firDate || baseSample.incidentDate,
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
      officerPno: activeFir.assignedIoBeltNumber || currentUser.pno || baseSample.officerPno,
      officerPhone: activeFir.assignedIoPhone || (currentUser as any)?.phone || baseSample.officerPhone,
      arrestPoliceStation: activeFir.policeStation || baseSample.policeStation,
      arrestDistrict: activeFir.district || baseSample.district,
      casePs: activeFir.policeStation || baseSample.policeStation,
    });

    if (primaryAccused?.phone) {
      setCdrTargetRows((prev) => [
        {
          id: "cdr_1",
          phone: primaryAccused.phone || "9812044551",
          periodFrom: (activeFir as any)?.incidentDate || activeFir.incidentDateFrom || "01-08-2026",
          periodTo: new Date().toLocaleDateString("hi-IN"),
          reason: `Verification of accused in FIR No. ${activeFir.firNumber}`,
        },
      ]);
    }
  }, [activeFir, selectedTemplate, currentUser]);

  const handleFieldChange = (field: keyof NoticeFormData, val: any) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  const handleResetSample = () => {
    const base = DEFAULT_SAMPLE_DATA[selectedTemplate];
    if (base) {
      setFormData(base);
    }
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

  // Dynamic Arrest Witness actions
  const handleAddWitnessRow = () => {
    const cur = formData.arrestWitnesses || DEFAULT_SAMPLE_DATA.arrest_memo.arrestWitnesses || [];
    const nextSr = String(cur.length + 1);
    const updated = [...cur, { id: `wit_${Date.now()}`, srNo: nextSr, name: "", address: "", signature: "" }];
    handleFieldChange("arrestWitnesses", updated);
  };

  const handleUpdateWitnessRow = (index: number, key: string, val: string) => {
    const cur = formData.arrestWitnesses || DEFAULT_SAMPLE_DATA.arrest_memo.arrestWitnesses || [];
    const updated = cur.map((w, idx) => (idx === index ? { ...w, [key]: val } : w));
    handleFieldChange("arrestWitnesses", updated);
  };

  const handleDeleteWitnessRow = (index: number) => {
    const cur = formData.arrestWitnesses || DEFAULT_SAMPLE_DATA.arrest_memo.arrestWitnesses || [];
    if (cur.length <= 1) return;
    const updated = cur.filter((_, idx) => idx !== index).map((w, idx) => ({ ...w, srNo: String(idx + 1) }));
    handleFieldChange("arrestWitnesses", updated);
  };

  // Dynamic Jama Talashi items actions
  const handleAddJamaTalashiRow = () => {
    const cur = formData.jamaTalashiItems || DEFAULT_SAMPLE_DATA.arrest_memo.jamaTalashiItems || [];
    const nextSr = `${cur.length + 1}.`;
    const updated = [...cur, { id: `jt_${Date.now()}`, srNo: nextSr, description: "", quantity: "1" }];
    handleFieldChange("jamaTalashiItems", updated);
  };

  const handleUpdateJamaTalashiRow = (index: number, key: string, val: string) => {
    const cur = formData.jamaTalashiItems || DEFAULT_SAMPLE_DATA.arrest_memo.jamaTalashiItems || [];
    const updated = cur.map((item, idx) => (idx === index ? { ...item, [key]: val } : item));
    handleFieldChange("jamaTalashiItems", updated);
  };

  const handleDeleteJamaTalashiRow = (index: number) => {
    const cur = formData.jamaTalashiItems || DEFAULT_SAMPLE_DATA.arrest_memo.jamaTalashiItems || [];
    if (cur.length <= 1) return;
    const updated = cur.filter((_, idx) => idx !== index).map((item, idx) => ({ ...item, srNo: `${idx + 1}.` }));
    handleFieldChange("jamaTalashiItems", updated);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopy = () => {
    const element = document.getElementById("fir-printable-notice");
    if (element) {
      navigator.clipboard.writeText(element.innerText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-5 pb-16 animate-in fade-in-50">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-700">
            <FileCheck2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-black text-[#0b192c] tracking-tight">
              Statutory Notice Generator (FIR Investigation)
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Statutory legal notices and memos under Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023 • Fully In-Place Editable
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handlePrint}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs gap-1.5 shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Statutory Notice
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCopy}
            className="border-slate-300 text-slate-700 font-bold text-xs gap-1.5"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied" : "Copy Text"}
          </Button>
        </div>
      </div>

      {/* FIR Module Workspace Navigation */}
      <FIRWorkspaceNav firId={selectedFirId} />

      {/* Case & Template Selector Header Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
              Select Active FIR Case *
            </label>
            <select
              value={selectedFirId}
              onChange={(e) => setSelectedFirId(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white font-bold text-slate-900"
            >
              {firs.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.firNumber} — {f.actsAndSections.slice(0, 45)} ({f.complainantName})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
              Select Notice / Memo Proforma *
            </label>
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value as FIRNoticeTemplateType)}
              className="w-full text-xs p-2.5 rounded-lg border border-purple-300 bg-purple-50/40 font-bold text-purple-950"
            >
              {Object.entries(TEMPLATE_CONFIG).map(([key, cfg]) => (
                <option key={key} value={key}>
                  {cfg.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Toolbar: Font Size, Dictation, Reset */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-semibold text-[11px]">Font Size:</span>
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded border border-slate-200">
              {(["compact", "standard", "large"] as const).map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => setFontSize(sz)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold capitalize transition-colors ${
                    fontSize === sz ? "bg-white text-purple-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {sz}
                </button>
              ))}
            </div>

            <span className="text-slate-300 mx-1">|</span>

            <span className="text-slate-500 font-semibold text-[11px]">Dictation:</span>
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded border border-slate-200">
              <button
                type="button"
                onClick={() => setVoiceLang("hi-IN")}
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  voiceLang === "hi-IN" ? "bg-purple-900 text-white" : "text-slate-600"
                }`}
              >
                हिन्दी
              </button>
              <button
                type="button"
                onClick={() => setVoiceLang("en-IN")}
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  voiceLang === "en-IN" ? "bg-purple-900 text-white" : "text-slate-600"
                }`}
              >
                English
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetSample}
              className="px-2.5 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded text-xs font-semibold flex items-center gap-1 border border-slate-200"
              title="Reset template to standard default format"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Reset Template</span>
            </button>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #fir-printable-notice,
          #fir-printable-notice * {
            visibility: visible;
          }
          #fir-printable-notice {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 20px;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

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
                <input
                  type="text"
                  value={formData.headerDept || "हरियाणा पुलिस"}
                  onChange={(e) => handleFieldChange("headerDept", e.target.value)}
                  className="font-black text-slate-950 underline underline-offset-8 text-xl sm:text-2xl text-center bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent hover:border-slate-300 focus:border-purple-500 rounded px-2 py-0.5 outline-none tracking-wider"
                  placeholder="हरियाणा पुलिस"
                />
              </div>

              {/* Station and District Row */}
              <div className="flex items-baseline justify-between gap-4 font-bold text-base text-slate-950 pt-2">
                <div className="flex items-center gap-1.5 flex-1 max-w-md">
                  <span className="whitespace-nowrap">थाना/यूनिट</span>
                  <input
                    type="text"
                    value={formData.policeStation || ""}
                    onChange={(e) => handleFieldChange("policeStation", e.target.value)}
                    placeholder="............................................"
                    className="w-full font-bold text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border-b border-dotted border-slate-700 focus:border-purple-500 px-1 py-0.5 outline-none"
                  />
                </div>
                <div className="flex items-center justify-end gap-1 text-right">
                  <input
                    type="text"
                    value={
                      formData.district
                        ? formData.district.startsWith("जिला")
                          ? formData.district
                          : `जिला ${formData.district}`
                        : "जिला अम्बाला।"
                    }
                    onChange={(e) => handleFieldChange("district", e.target.value)}
                    placeholder="जिला अम्बाला।"
                    className="font-bold text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border-b border-dotted border-slate-700 focus:border-purple-500 px-1 py-0.5 outline-none text-right w-44"
                  />
                </div>
              </div>

              {/* Document Title */}
              <div className="text-center py-2">
                <input
                  type="text"
                  value={
                    formData.docTitle ||
                    (selectedTemplate === "section_35_notice"
                      ? "सूचना-पत्र (धारा 35(3) BNSS)"
                      : "साक्षी उपस्थिति आदेश (धारा 179 BNSS)")
                  }
                  onChange={(e) => handleFieldChange("docTitle", e.target.value)}
                  className="font-black text-slate-950 text-lg sm:text-xl text-center bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent hover:border-slate-300 focus:border-purple-500 rounded px-2 py-0.5 outline-none tracking-wide"
                  placeholder="शीर्षक दर्ज करें"
                />
              </div>

              {/* Dispatch & Date */}
              <div className="flex items-center gap-8 font-medium text-slate-900 pb-2">
                <div className="flex items-center gap-1.5">
                  <span className="whitespace-nowrap">क्रमांक</span>
                  <input
                    type="text"
                    value={formData.dispatchNo || ""}
                    onChange={(e) => handleFieldChange("dispatchNo", e.target.value)}
                    placeholder=".................."
                    className="w-44 text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border-b border-dotted border-slate-700 focus:border-purple-500 px-1 py-0.5 outline-none font-semibold"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="whitespace-nowrap">दिनांक</span>
                  <input
                    type="text"
                    value={formData.issueDate || ""}
                    onChange={(e) => handleFieldChange("issueDate", e.target.value)}
                    placeholder="................."
                    className="w-36 text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border-b border-dotted border-slate-700 focus:border-purple-500 px-1 py-0.5 outline-none font-semibold"
                  />
                </div>
              </div>

              {/* Recipient Details Box */}
              <div className="bg-slate-50/90 border border-slate-300 rounded-lg p-3 my-2 text-xs sm:text-[13px] space-y-2 font-sans">
                <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-purple-600" />
                    <span>सेवा में / प्रति (Notice Recipient):</span>
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                    {formData.noticeeRole || (selectedTemplate === "section_35_notice" ? "अभियुक्त / आरोपी" : "साक्षी / गवाह")}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-700 whitespace-nowrap">श्री/श्रीमती:</span>
                    <input
                      type="text"
                      value={formData.noticeeName || ""}
                      onChange={(e) => handleFieldChange("noticeeName", e.target.value)}
                      placeholder="नाम दर्ज करें"
                      className="font-bold text-slate-950 bg-transparent border-b border-dotted border-slate-700 focus:border-purple-500 px-1 py-0.5 outline-none w-full"
                    />
                    <VoiceInputButton
                      onTranscript={(t) => handleFieldChange("noticeeName", t)}
                      currentValue={formData.noticeeName || ""}
                      fieldLabel="नाम"
                      iconOnly
                    />
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-700 whitespace-nowrap">सुपुत्र/पत्नी/आत्मज:</span>
                    <input
                      type="text"
                      value={formData.noticeeFather || ""}
                      onChange={(e) => handleFieldChange("noticeeFather", e.target.value)}
                      placeholder="पिता/पति का नाम"
                      className="font-bold text-slate-950 bg-transparent border-b border-dotted border-slate-700 focus:border-purple-500 px-1 py-0.5 outline-none w-full"
                    />
                    <VoiceInputButton
                      onTranscript={(t) => handleFieldChange("noticeeFather", t)}
                      currentValue={formData.noticeeFather || ""}
                      fieldLabel="पिता/पति का नाम"
                      iconOnly
                    />
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-700 whitespace-nowrap">आयु:</span>
                    <input
                      type="text"
                      value={formData.noticeeAge || ""}
                      onChange={(e) => handleFieldChange("noticeeAge", e.target.value)}
                      placeholder="वर्ष"
                      className="font-bold text-slate-950 bg-transparent border-b border-dotted border-slate-700 focus:border-purple-500 px-1 py-0.5 outline-none w-16 text-center"
                    />
                    <span className="text-slate-500 text-[11px]">वर्ष</span>
                  </div>

                  <div className="flex items-center gap-1.5 sm:col-span-2">
                    <span className="font-bold text-slate-700 whitespace-nowrap">निवास स्थान (पता):</span>
                    <input
                      type="text"
                      value={formData.noticeeAddress || ""}
                      onChange={(e) => handleFieldChange("noticeeAddress", e.target.value)}
                      placeholder="पूरा पता"
                      className="font-bold text-slate-950 bg-transparent border-b border-dotted border-slate-700 focus:border-purple-500 px-1 py-0.5 outline-none w-full"
                    />
                    <VoiceInputButton
                      onTranscript={(t) => handleFieldChange("noticeeAddress", (formData.noticeeAddress ? formData.noticeeAddress + " " : "") + t)}
                      currentValue={formData.noticeeAddress || ""}
                      fieldLabel="पूरा पता"
                      iconOnly
                    />
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-700 whitespace-nowrap">मोबाईल:</span>
                    <input
                      type="text"
                      value={formData.noticeePhone || ""}
                      onChange={(e) => handleFieldChange("noticeePhone", e.target.value)}
                      placeholder="मोबाईल नं."
                      className="font-bold text-slate-950 bg-transparent border-b border-dotted border-slate-700 focus:border-purple-500 px-1 py-0.5 outline-none w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Case Allegation & Reference */}
              <div className="text-justify leading-loose text-slate-900" style={{ textIndent: "40px" }}>
                <span>आपको इस नोटिस के माध्यम से सूचित किया जाता है कि अभियोग संख्या </span>
                <input
                  type="text"
                  value={formData.complaintNo || ""}
                  onChange={(e) => handleFieldChange("complaintNo", e.target.value)}
                  placeholder=".........."
                  className="font-bold text-slate-950 bg-transparent border-b border-dotted border-slate-700 px-1 outline-none text-center min-w-[120px]"
                />
                <span> दिनांक </span>
                <input
                  type="text"
                  value={formData.incidentDate || ""}
                  onChange={(e) => handleFieldChange("incidentDate", e.target.value)}
                  placeholder=".........."
                  className="font-bold text-slate-950 bg-transparent border-b border-dotted border-slate-700 px-1 outline-none text-center min-w-[100px]"
                />
                <span> अंतर्गत धारा </span>
                <input
                  type="text"
                  value={formData.sectionsOfLaw || ""}
                  onChange={(e) => handleFieldChange("sectionsOfLaw", e.target.value)}
                  placeholder="धारा दर्ज करें"
                  className="font-bold text-slate-950 bg-transparent border-b border-dotted border-slate-700 px-1 outline-none text-center min-w-[180px]"
                />
                <span> थाना </span>
                <input
                  type="text"
                  value={formData.policeStation || ""}
                  onChange={(e) => handleFieldChange("policeStation", e.target.value)}
                  placeholder="थाना नाम"
                  className="font-bold text-slate-950 bg-transparent border-b border-dotted border-slate-700 px-1 outline-none text-center min-w-[140px]"
                />
                <span> में दर्ज परिवादी </span>
                <input
                  type="text"
                  value={formData.complainantName || ""}
                  onChange={(e) => handleFieldChange("complainantName", e.target.value)}
                  placeholder="परिवादी का नाम"
                  className="font-bold text-slate-950 bg-transparent border-b border-dotted border-slate-700 px-1 outline-none min-w-[140px]"
                />
                <span> के संदर्भ में अनुसंधान विचाराधीन है।</span>
              </div>

              {/* Allegation Paragraph */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-900">संक्षिप्त विषय/आरोप:</div>
                  <VoiceInputButton
                    onTranscript={(t) => handleFieldChange("allegationsBrief", (formData.allegationsBrief ? formData.allegationsBrief + " " : "") + t)}
                    currentValue={formData.allegationsBrief || ""}
                    fieldLabel="संक्षिप्त विषय/आरोप"
                    iconOnly
                  />
                </div>
                <textarea
                  rows={3}
                  value={formData.allegationsBrief || ""}
                  onChange={(e) => handleFieldChange("allegationsBrief", e.target.value)}
                  className="w-full text-slate-900 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent hover:border-slate-300 focus:border-purple-500 rounded p-2 outline-none leading-relaxed"
                  placeholder="आरोप व विषय का संक्षिप्त विवरण..."
                />
              </div>

              {/* Appearance Directives */}
              <div className="p-4 bg-slate-50 border border-slate-300 rounded-lg space-y-3">
                <div className="font-bold text-slate-950">उपस्थिति निर्देश (Appearance Directives):</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="block font-semibold text-slate-700 text-xs mb-1">उपस्थिति दिनांक:</span>
                    <input
                      type="text"
                      value={formData.appearanceDate || ""}
                      onChange={(e) => handleFieldChange("appearanceDate", e.target.value)}
                      placeholder="दिनांक"
                      className="w-full font-bold text-slate-950 bg-white border border-slate-300 rounded px-2 py-1"
                    />
                  </div>
                  <div>
                    <span className="block font-semibold text-slate-700 text-xs mb-1">उपस्थिति समय:</span>
                    <input
                      type="text"
                      value={formData.appearanceTime || "11:00 AM"}
                      onChange={(e) => handleFieldChange("appearanceTime", e.target.value)}
                      placeholder="समय"
                      className="w-full font-bold text-slate-950 bg-white border border-slate-300 rounded px-2 py-1"
                    />
                  </div>
                  <div>
                    <span className="block font-semibold text-slate-700 text-xs mb-1">उपस्थिति स्थान:</span>
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={formData.appearancePlace || `कार्यालय अनुसंधान अधिकारी, ${formData.policeStation}`}
                        onChange={(e) => handleFieldChange("appearancePlace", e.target.value)}
                        placeholder="स्थान"
                        className="w-full font-bold text-slate-950 bg-white border border-slate-300 rounded px-2 py-1"
                      />
                      <VoiceInputButton
                        onTranscript={(t) => handleFieldChange("appearancePlace", t)}
                        currentValue={formData.appearancePlace || ""}
                        fieldLabel="उपस्थिति स्थान"
                        iconOnly
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <span className="block font-semibold text-slate-700 text-xs mb-1">आवश्यक दस्तावेज:</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={formData.documentsRequired || ""}
                      onChange={(e) => handleFieldChange("documentsRequired", e.target.value)}
                      placeholder="पहचान पत्र, साक्ष्य दस्तावेज..."
                      className="w-full text-slate-950 bg-white border border-slate-300 rounded px-2 py-1"
                    />
                    <VoiceInputButton
                      onTranscript={(t) => handleFieldChange("documentsRequired", (formData.documentsRequired ? formData.documentsRequired + ", " : "") + t)}
                      currentValue={formData.documentsRequired || ""}
                      fieldLabel="आवश्यक दस्तावेज"
                      iconOnly
                    />
                  </div>
                </div>
              </div>

              {/* Statutory Warning */}
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg text-xs leading-relaxed text-amber-950 font-medium">
                <div className="flex items-center justify-between">
                  <strong>वैधानिक चेतावनी (Statutory Clarification): </strong>
                  <VoiceInputButton
                    onTranscript={(t) => handleFieldChange("statutoryClarification", (formData.statutoryClarification ? formData.statutoryClarification + " " : "") + t)}
                    currentValue={formData.statutoryClarification || ""}
                    fieldLabel="वैधानिक चेतावनी"
                    iconOnly
                  />
                </div>
                <textarea
                  rows={2}
                  value={
                    formData.statutoryClarification ||
                    (selectedTemplate === "section_35_notice"
                      ? "यदि आप उक्त तिथि व समय पर उपस्थित नहीं होते हैं अथवा नोटिस की शर्तों का पालन करने में विफल रहते हैं, तो धारा 35(6) BNSS के तहत सक्षम न्यायालय के आदेश पर आपकी गिरफ्तारी की जा सकती है।"
                      : "धारा 179 BNSS के अंतर्गत पुलिस अधिकारी द्वारा पूछे गए सभी प्रश्नों का सत्य उत्तर देना आपका विधिक दायित्व है।")
                  }
                  onChange={(e) => handleFieldChange("statutoryClarification", e.target.value)}
                  className="w-full bg-transparent border-0 outline-none p-1 mt-1 font-medium"
                />
              </div>

              {/* Signature Block */}
              <div className="pt-8 flex justify-between items-end font-sans text-xs">
                <div>
                  <p>स्थान: {formData.policeStation}</p>
                  <p>दिनांक: {formData.issueDate}</p>
                </div>
                <div className="text-right space-y-1">
                  <div className="w-48 border-b border-slate-800 ml-auto mb-1.5"></div>
                  <input
                    type="text"
                    value={formData.officerName || ""}
                    onChange={(e) => handleFieldChange("officerName", e.target.value)}
                    className="font-bold text-slate-950 bg-transparent text-right outline-none block ml-auto"
                    placeholder="अनुसंधान अधिकारी का नाम"
                  />
                  <input
                    type="text"
                    value={`${formData.officerRank || "उप-निरीक्षक"} • ${formData.officerPno || "PNO"}`}
                    onChange={(e) => handleFieldChange("officerRank", e.target.value)}
                    className="text-slate-700 bg-transparent text-right outline-none block ml-auto"
                    placeholder="रैंक व बेल्ट नं."
                  />
                  <p className="text-slate-600 font-semibold">अनुसंधान अधिकारी (I.O.)</p>
                  <p className="text-slate-600">{formData.policeStation}</p>
                </div>
              </div>
            </div>
          )}

          {/* ================= TEMPLATE 2: CDR & DIGITAL EVIDENCE REQUISITION (हरियाणा पुलिस प्रारूप बाबत काल डिटेल) ================= */}
          {selectedTemplate === "cdr_requisition" && (
            <div className="space-y-6 text-slate-950 font-sans text-sm">
              {/* 1. Top Header: Left (थाना शहर पानीपत), Center (प्रारुप बाबत काल डिटेल), Right (जिला पानीपत, नम्बर, दिनांक) */}
              <div className="flex items-start justify-between gap-4 pt-2">
                <div className="w-1/3">
                  <input
                    type="text"
                    value={formData.policeStation || "थाना शहर पानीपत"}
                    onChange={(e) => handleFieldChange("policeStation", e.target.value)}
                    className="font-bold text-slate-900 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent hover:border-slate-300 focus:border-purple-500 rounded px-1.5 py-0.5 outline-none text-base"
                    placeholder="थाना शहर पानीपत"
                  />
                </div>
                <div className="w-1/3 text-center">
                  <input
                    type="text"
                    value={formData.docTitle || "प्रारुप बाबत काल डिटेल"}
                    onChange={(e) => handleFieldChange("docTitle", e.target.value)}
                    className="font-black text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent hover:border-slate-300 focus:border-purple-500 rounded px-2 py-0.5 outline-none text-base sm:text-lg text-center"
                    placeholder="प्रारुप बाबत काल डिटेल"
                  />
                </div>
                <div className="w-1/3 text-right space-y-1">
                  <input
                    type="text"
                    value={
                      formData.district
                        ? formData.district.startsWith("जिला")
                          ? formData.district
                          : `जिला ${formData.district}`
                        : "जिला पानीपत"
                    }
                    onChange={(e) => handleFieldChange("district", e.target.value)}
                    className="font-bold text-slate-900 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent hover:border-slate-300 focus:border-purple-500 rounded px-1.5 py-0.5 outline-none text-base text-right w-full"
                    placeholder="जिला पानीपत"
                  />
                  <div className="flex items-center justify-end gap-1 text-sm font-semibold text-slate-800">
                    <span>नम्बर-</span>
                    <input
                      type="text"
                      value={formData.dispatchNo || ""}
                      onChange={(e) => handleFieldChange("dispatchNo", e.target.value)}
                      placeholder="............"
                      className="w-28 text-slate-900 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent hover:border-slate-300 focus:border-purple-500 rounded px-1 outline-none text-right"
                    />
                  </div>
                  <div className="flex items-center justify-end gap-1 text-sm font-semibold text-slate-800">
                    <span>दिनांक-</span>
                    <input
                      type="text"
                      value={formData.issueDate || ""}
                      onChange={(e) => handleFieldChange("issueDate", e.target.value)}
                      placeholder=".........."
                      className="w-28 text-slate-900 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent hover:border-slate-300 focus:border-purple-500 rounded px-1 outline-none text-right"
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
                    className="font-bold text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent hover:border-slate-300 focus:border-purple-500 rounded px-1.5 py-0.5 outline-none w-full max-w-md text-sm"
                    placeholder="पुलिस अधीक्षक पानीपत।"
                  />
                </div>
              </div>

              {/* 4. श्रीमान जी, निवेदन है कि... */}
              <div className="space-y-1 text-sm">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-slate-900">श्रीमान जी,</p>
                  <VoiceInputButton
                    onTranscript={(t) => handleFieldChange("allegationsBrief", (formData.allegationsBrief ? formData.allegationsBrief + " " : "") + t)}
                    currentValue={formData.allegationsBrief || ""}
                    fieldLabel="निवेदन विवरण"
                    iconOnly
                  />
                </div>
                <div className="pl-8">
                  <textarea
                    rows={2}
                    value={
                      formData.allegationsBrief ||
                      "निवेदन है कि उपरोक्त अभियोग में निम्नलिखित मोबाईल फोन की काल डिटेल व कैफ आई0डी0/आई.एम.ई.आई. की सर्चिंग की आवश्यकता है। उपलब्ध करवायी जावे।"
                    }
                    onChange={(e) => handleFieldChange("allegationsBrief", e.target.value)}
                    className="w-full font-medium text-slate-900 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent hover:border-slate-300 focus:border-purple-500 rounded p-1.5 outline-none leading-relaxed text-sm resize-y"
                    placeholder="निवेदन है कि उपरोक्त अभियोग में निम्नलिखित मोबाईल फोन की काल डिटेल व कैफ आई0डी0/आई.एम.ई.आई. की सर्चिंग की आवश्यकता है। उपलब्ध करवायी जावे।"
                  />
                </div>
              </div>

              {/* 5. The Table */}
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
                        <th
                          rowSpan={2}
                          className="w-12 p-2 font-black border-r-2 border-slate-900 text-center align-middle"
                        >
                          क्र.स.
                        </th>
                        <th
                          rowSpan={2}
                          className="p-2 font-black border-r-2 border-slate-900 text-center align-middle min-w-[200px]"
                        >
                          मोबाईल फोन/ आई.एम.ई.आई. / आई पी/ व्हाटसअप नम्बर जिनकी डिटेल की आवश्यकता है
                        </th>
                        <th
                          colSpan={2}
                          className="p-1.5 font-black border-r-2 border-slate-900 text-center border-b-2 border-slate-900"
                        >
                          समय अवधि
                        </th>
                        <th
                          rowSpan={2}
                          className="p-2 font-black border-r-2 border-slate-900 text-center align-middle min-w-[240px]"
                        >
                          अभियोग का विवरण एवं डाटा किस कारण से जरूरी है संक्षिप्त विवरण
                        </th>
                        <th rowSpan={2} className="w-10 p-1 font-black text-center align-middle no-print">
                          हटाएं
                        </th>
                      </tr>
                      <tr className="bg-slate-50 border-b-2 border-slate-900">
                        <th className="w-28 p-1.5 font-black border-r-2 border-slate-900 text-center">कब से</th>
                        <th className="w-28 p-1.5 font-black border-r-2 border-slate-900 text-center">कब तक</th>
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
                              className="w-full text-xs font-semibold text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-purple-400 p-1 rounded outline-none"
                            />
                          </td>
                          <td className="p-1 border-r-2 border-slate-900 align-middle">
                            <input
                              type="text"
                              value={row.periodFrom || ""}
                              onChange={(e) => handleUpdateCdrRow(row.id, "periodFrom", e.target.value)}
                              placeholder="कब से"
                              className="w-full text-xs text-center text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-purple-400 p-1 rounded outline-none"
                            />
                          </td>
                          <td className="p-1 border-r-2 border-slate-900 align-middle">
                            <input
                              type="text"
                              value={row.periodTo || ""}
                              onChange={(e) => handleUpdateCdrRow(row.id, "periodTo", e.target.value)}
                              placeholder="कब तक"
                              className="w-full text-xs text-center text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-purple-400 p-1 rounded outline-none"
                            />
                          </td>
                          <td className="p-1 border-r-2 border-slate-900 align-middle">
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                value={row.reason || ""}
                                onChange={(e) => handleUpdateCdrRow(row.id, "reason", e.target.value)}
                                placeholder="अभियोग का संक्षिप्त विवरण व डाटा का कारण"
                                className="w-full text-xs text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-purple-400 p-1 rounded outline-none"
                              />
                              <VoiceInputButton
                                onTranscript={(t) => handleUpdateCdrRow(row.id, "reason", (row.reason ? row.reason + " " : "") + t)}
                                currentValue={row.reason || ""}
                                fieldLabel="डाटा का कारण"
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

              {/* 6. Legal Undertakings in English */}
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

              {/* 7. Signatures and Forwarding blocks */}
              <div className="pt-6 space-y-10">
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
                        className="w-full text-xs text-slate-900 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-purple-400 px-1 py-0.5 outline-none"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-semibold text-slate-800">रैन्क-</span>
                      <input
                        type="text"
                        value={formData.officerRank || ""}
                        onChange={(e) => handleFieldChange("officerRank", e.target.value)}
                        placeholder="..............................."
                        className="w-full text-xs text-slate-900 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-purple-400 px-1 py-0.5 outline-none"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-semibold text-slate-800">फोन न0-</span>
                      <input
                        type="text"
                        value={formData.officerPhone || ""}
                        onChange={(e) => handleFieldChange("officerPhone", e.target.value)}
                        placeholder="..........................."
                        className="w-full text-xs text-slate-900 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-purple-400 px-1 py-0.5 outline-none"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-semibold text-slate-800">थाना/यूनिट-</span>
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
                  <div className="text-left w-48 space-y-1 text-xs">
                    <p className="font-bold text-slate-900">अग्रेषित</p>
                    <input
                      type="text"
                      value={formData.shoName || "प्रबंधक अफसर"}
                      onChange={(e) => handleFieldChange("shoName", e.target.value)}
                      className="font-bold text-slate-900 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-purple-400 px-1 py-0.5 outline-none w-full"
                    />
                  </div>

                  <div className="text-center w-64 mx-auto space-y-1 text-xs">
                    <p className="font-bold text-slate-900">अग्रेषित</p>
                    <input
                      type="text"
                      value={formData.supervisoryOfficerName || "पर्यवेक्षण अधिकारी"}
                      onChange={(e) => handleFieldChange("supervisoryOfficerName", e.target.value)}
                      className="font-bold text-slate-900 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-purple-400 px-1 py-0.5 outline-none w-full text-center"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= TEMPLATE 3: ARREST MEMO FORM 26.8(1) (4 PAGES OFFICIAL SEQUENCE) ================= */}
          {selectedTemplate === "arrest_memo" && (
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
                </div>

                {/* Point 3: धाराएं */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold">3.</span>
                    <span>धारा/धाराएं जिनके तहत अपराध किया गया है:</span>
                    <input
                      type="text"
                      value={formData.sectionsOfLaw || ""}
                      onChange={(e) => handleFieldChange("sectionsOfLaw", e.target.value)}
                      placeholder="धारा 318(4), 316(2) BNS"
                      className="w-full font-bold text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border-b border-dotted border-slate-700 px-1 outline-none"
                    />
                  </div>
                </div>

                {/* Point 4: अभियुक्त का नाम व विवरण */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center gap-1.5 font-bold">
                    <span>4.</span>
                    <span>अभियुक्त का नाम व अन्य विवरण :</span>
                  </div>

                  <div className="pl-5 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span>(क) नाम</span>
                      <input
                        type="text"
                        value={formData.noticeeName || ""}
                        onChange={(e) => handleFieldChange("noticeeName", e.target.value)}
                        placeholder="पूरा नाम..."
                        className="font-bold text-slate-950 bg-transparent border-b border-dotted border-slate-700 px-1 outline-none min-w-[180px]"
                      />
                      <span>उपनाम 1.</span>
                      <input
                        type="text"
                        value={formData.noticeeAlias1 || ""}
                        onChange={(e) => handleFieldChange("noticeeAlias1", e.target.value)}
                        placeholder="उपनाम 1"
                        className="text-slate-950 bg-transparent border-b border-dotted border-slate-700 px-1 outline-none w-28"
                      />
                      <span>2.</span>
                      <input
                        type="text"
                        value={formData.noticeeAlias2 || ""}
                        onChange={(e) => handleFieldChange("noticeeAlias2", e.target.value)}
                        placeholder="उपनाम 2"
                        className="text-slate-950 bg-transparent border-b border-dotted border-slate-700 px-1 outline-none w-28"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span>(ख) पिता का नाम</span>
                      <input
                        type="text"
                        value={formData.noticeeFather || ""}
                        onChange={(e) => handleFieldChange("noticeeFather", e.target.value)}
                        placeholder="पिता का नाम..."
                        className="font-bold text-slate-950 bg-transparent border-b border-dotted border-slate-700 px-1 outline-none min-w-[200px]"
                      />
                      <span>राष्ट्रीयता</span>
                      <input
                        type="text"
                        value={formData.noticeeNationality || "भारतीय"}
                        onChange={(e) => handleFieldChange("noticeeNationality", e.target.value)}
                        className="font-bold text-slate-950 bg-transparent border-b border-dotted border-slate-700 px-1 outline-none w-28"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span>(ग) स्थायी पता</span>
                      <input
                        type="text"
                        value={formData.permanentAddress || formData.noticeeAddress || ""}
                        onChange={(e) => handleFieldChange("permanentAddress", e.target.value)}
                        placeholder="स्थायी पता..."
                        className="font-bold text-slate-950 bg-transparent border-b border-dotted border-slate-700 px-1 outline-none flex-1 min-w-[250px]"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span>(घ) वर्तमान पता</span>
                      <input
                        type="text"
                        value={formData.currentAddress || formData.noticeeAddress || ""}
                        onChange={(e) => handleFieldChange("currentAddress", e.target.value)}
                        placeholder="वर्तमान पता..."
                        className="font-bold text-slate-950 bg-transparent border-b border-dotted border-slate-700 px-1 outline-none flex-1 min-w-[250px]"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span>(ङ) मोबाईल नम्बर</span>
                      <input
                        type="text"
                        value={formData.mobileNo || formData.noticeePhone || ""}
                        onChange={(e) => handleFieldChange("mobileNo", e.target.value)}
                        placeholder="मोबाईल..."
                        className="font-mono font-bold text-slate-950 bg-transparent border-b border-dotted border-slate-700 px-1 outline-none w-36"
                      />
                      <span>आधार नं.</span>
                      <input
                        type="text"
                        value={formData.accusedAadhaar || ""}
                        onChange={(e) => handleFieldChange("accusedAadhaar", e.target.value)}
                        placeholder="आधार..."
                        className="font-mono font-bold text-slate-950 bg-transparent border-b border-dotted border-slate-700 px-1 outline-none w-40"
                      />
                      <span>पैन नं.</span>
                      <input
                        type="text"
                        value={formData.accusedPan || ""}
                        onChange={(e) => handleFieldChange("accusedPan", e.target.value)}
                        placeholder="पैन..."
                        className="font-mono font-bold text-slate-950 bg-transparent border-b border-dotted border-slate-700 px-1 outline-none w-32"
                      />
                    </div>
                  </div>
                </div>

                {/* Point 5: शारीरिक दशा */}
                <div className="space-y-1 pt-2">
                  <div className="flex items-center gap-1.5 font-bold">
                    <span>5.</span>
                    <span>शारीरिक दशा व जाहिरा चोट का विवरण :</span>
                  </div>
                  <input
                    type="text"
                    value={formData.physicalConditionOrInjuries || "शारीरिक दशा सामान्य है। कोई ताजा जाहिरा चोट नहीं है।"}
                    onChange={(e) => handleFieldChange("physicalConditionOrInjuries", e.target.value)}
                    className="w-full font-bold text-slate-950 bg-transparent border-b border-dotted border-slate-700 px-1 outline-none pl-5"
                  />
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
                      className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded text-xs font-bold hover:bg-purple-100 cursor-pointer"
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
                      {(formData.arrestWitnesses || DEFAULT_SAMPLE_DATA.arrest_memo.arrestWitnesses || []).map(
                        (w, idx) => (
                          <tr key={w.id || idx}>
                            <td className="border border-slate-900 p-1 text-center font-bold">
                              {w.srNo || idx + 1}
                            </td>
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
                        )
                      )}
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
                        placeholder="नाम व सम्बन्ध..."
                        className="w-full font-bold text-slate-950 bg-transparent border-b border-dotted border-slate-700 px-1 outline-none"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-6">(ii)</span>
                      <input
                        type="text"
                        value={formData.familyMember2 || ""}
                        onChange={(e) => handleFieldChange("familyMember2", e.target.value)}
                        placeholder="नाम व सम्बन्ध..."
                        className="w-full font-bold text-slate-950 bg-transparent border-b border-dotted border-slate-700 px-1 outline-none"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-6">(iii)</span>
                      <input
                        type="text"
                        value={formData.familyMember3 || ""}
                        onChange={(e) => handleFieldChange("familyMember3", e.target.value)}
                        placeholder="नाम व सम्बन्ध..."
                        className="w-full font-bold text-slate-950 bg-transparent border-b border-dotted border-slate-700 px-1 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Point 11: धारा 47 BNSS आधार */}
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
                        className="w-full font-bold text-slate-950 bg-transparent border-b border-dotted border-slate-700 px-1 outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <span className="block font-medium">(ख) इन अपराधों में आरोपी की विशिष्ट भूमिका</span>
                      <input
                        type="text"
                        value={formData.grounds47Role || ""}
                        onChange={(e) => handleFieldChange("grounds47Role", e.target.value)}
                        placeholder="विशिष्ट भूमिका..."
                        className="w-full font-bold text-slate-950 bg-transparent border-b border-dotted border-slate-700 px-1 outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <span className="block font-medium">(ग) आरोपी के विरुद्ध उपलब्ध साक्ष्य</span>
                      <input
                        type="text"
                        value={formData.grounds47Evidence || ""}
                        onChange={(e) => handleFieldChange("grounds47Evidence", e.target.value)}
                        placeholder="मौखिक, दस्तावेजी व डिजिटल साक्ष्य..."
                        className="w-full font-bold text-slate-950 bg-transparent border-b border-dotted border-slate-700 px-1 outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <span className="block font-medium">(घ) अन्य कोई कारण यदि हो तो</span>
                      <input
                        type="text"
                        value={formData.grounds47Other || ""}
                        onChange={(e) => handleFieldChange("grounds47Other", e.target.value)}
                        placeholder="अन्य कारण..."
                        className="w-full font-bold text-slate-950 bg-transparent border-b border-dotted border-slate-700 px-1 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Point 12: जामा तलाशी */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold">
                      <span>12.</span>
                      <span>जामा तलाशी मे बरामद सामान का विवरण (वसूली फर्द) -</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddJamaTalashiRow}
                      className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded text-xs font-bold hover:bg-purple-100 cursor-pointer"
                    >
                      + सामान जोड़ें
                    </button>
                  </div>

                  <table className="w-full border-collapse border border-slate-900 text-xs">
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="border border-slate-900 p-1.5 w-12 text-center">क्र.स.</th>
                        <th className="border border-slate-900 p-1.5 text-center">सामान का विवरण</th>
                        <th className="border border-slate-900 p-1.5 w-24 text-center">संख्या/मात्रा</th>
                        <th className="border border-slate-900 p-1 w-8 text-center no-print"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {(formData.jamaTalashiItems || DEFAULT_SAMPLE_DATA.arrest_memo.jamaTalashiItems || []).map(
                        (item, idx) => (
                          <tr key={item.id || idx}>
                            <td className="border border-slate-900 p-1 text-center font-bold">
                              {item.srNo || `${idx + 1}.`}
                            </td>
                            <td className="border border-slate-900 p-1">
                              <input
                                type="text"
                                value={item.description || ""}
                                onChange={(e) => handleUpdateJamaTalashiRow(idx, "description", e.target.value)}
                                placeholder="सामान का विवरण..."
                                className="w-full font-bold text-slate-900 bg-transparent px-1 outline-none"
                              />
                            </td>
                            <td className="border border-slate-900 p-1">
                              <input
                                type="text"
                                value={item.quantity || "1"}
                                onChange={(e) => handleUpdateJamaTalashiRow(idx, "quantity", e.target.value)}
                                placeholder="मात्रा..."
                                className="w-full text-center font-bold text-slate-900 bg-transparent px-1 outline-none"
                              />
                            </td>
                            <td className="border border-slate-900 p-1 text-center no-print">
                              <button
                                type="button"
                                onClick={() => handleDeleteJamaTalashiRow(idx)}
                                className="text-red-500 hover:text-red-700 p-0.5"
                                title="Delete row"
                              >
                                <X className="w-3.5 h-3.5 mx-auto" />
                              </button>
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Signatures Page 2 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 text-xs">
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold">स्थान</span>
                      <input
                        type="text"
                        value={formData.ioSignPlace || formData.district || ""}
                        onChange={(e) => handleFieldChange("ioSignPlace", e.target.value)}
                        className="font-bold text-slate-950 bg-transparent border-b border-dotted border-slate-700 px-1 outline-none w-36"
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold">दिनांक</span>
                      <input
                        type="text"
                        value={formData.ioSignDate || formData.issueDate || ""}
                        onChange={(e) => handleFieldChange("ioSignDate", e.target.value)}
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
                        className="font-bold text-slate-950 bg-transparent border-b border-dotted border-slate-700 px-1 outline-none flex-1"
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span>पद</span>
                      <input
                        type="text"
                        value={formData.officerRank || ""}
                        onChange={(e) => handleFieldChange("officerRank", e.target.value)}
                        className="font-bold text-slate-950 bg-transparent border-b border-dotted border-slate-700 px-1 outline-none flex-1"
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span>नम्बर</span>
                      <input
                        type="text"
                        value={formData.officerPno || ""}
                        onChange={(e) => handleFieldChange("officerPno", e.target.value)}
                        className="font-bold text-slate-950 bg-transparent border-b border-dotted border-slate-700 px-1 outline-none flex-1"
                      />
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

                {/* Case Heading */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold">राज्य द्वारा</span>
                    <input
                      type="text"
                      value={formData.stateCaseTitle || "हरियाणा राज्य"}
                      onChange={(e) => handleFieldChange("stateCaseTitle", e.target.value)}
                      className="font-bold text-slate-950 bg-transparent border-b border-dotted border-slate-700 px-1 outline-none flex-1"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">बनाम:</span>
                    <input
                      type="text"
                      value={formData.vsName || formData.noticeeName || ""}
                      onChange={(e) => handleFieldChange("vsName", e.target.value)}
                      className="font-bold text-slate-950 bg-transparent border-b border-dotted border-slate-700 px-1 outline-none flex-1"
                    />
                  </div>
                </div>

                {/* 18 Physical Features Table */}
                <div className="space-y-2 pt-2">
                  <div className="font-bold">1. गिरफ्तार व्यक्ति की शारीरिक बनावट, विकृतियाँ एंव अन्य विवरण-</div>
                  <table className="w-full border-collapse border border-slate-900 text-xs">
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="border border-slate-900 p-1.5 w-1/6">लिंग<br />(1)</th>
                        <th className="border border-slate-900 p-1.5 w-1/6">जन्म तिथि / वर्ष<br />(2)</th>
                        <th className="border border-slate-900 p-1.5 w-1/6">शारीरिक बनावट<br />(3)</th>
                        <th className="border border-slate-900 p-1.5 w-1/6">कद (सें.मी)<br />(4)</th>
                        <th className="border border-slate-900 p-1.5 w-1/6">रंग/ब्लड ग्रुप<br />(5)</th>
                        <th className="border border-slate-900 p-1.5 w-1/6">पहचान के चिन्ह<br />(6)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-slate-900 p-1">
                          <input
                            type="text"
                            value={formData.gender || formData.accusedGender || ""}
                            onChange={(e) => handleFieldChange("gender", e.target.value)}
                            className="w-full font-bold text-center bg-transparent outline-none"
                            placeholder="पुरुष/महिला"
                          />
                        </td>
                        <td className="border border-slate-900 p-1">
                          <input
                            type="text"
                            value={formData.dobYear || formData.noticeeAge || ""}
                            onChange={(e) => handleFieldChange("dobYear", e.target.value)}
                            className="w-full text-center bg-transparent outline-none"
                            placeholder="आयु/वर्ष"
                          />
                        </td>
                        <td className="border border-slate-900 p-1">
                          <input
                            type="text"
                            value={formData.bodyBuild || ""}
                            onChange={(e) => handleFieldChange("bodyBuild", e.target.value)}
                            className="w-full text-center bg-transparent outline-none"
                            placeholder="मध्यम"
                          />
                        </td>
                        <td className="border border-slate-900 p-1">
                          <input
                            type="text"
                            value={formData.heightCm || ""}
                            onChange={(e) => handleFieldChange("heightCm", e.target.value)}
                            className="w-full text-center bg-transparent outline-none"
                            placeholder="173 सेमी"
                          />
                        </td>
                        <td className="border border-slate-900 p-1">
                          <input
                            type="text"
                            value={formData.colorBloodGroup || ""}
                            onChange={(e) => handleFieldChange("colorBloodGroup", e.target.value)}
                            className="w-full text-center bg-transparent outline-none"
                            placeholder="गेहुंआ/B+"
                          />
                        </td>
                        <td className="border border-slate-900 p-1">
                          <input
                            type="text"
                            value={formData.identMarks || ""}
                            onChange={(e) => handleFieldChange("identMarks", e.target.value)}
                            className="w-full font-bold text-center bg-transparent outline-none"
                            placeholder="पहचान चिन्ह"
                          />
                        </td>
                      </tr>
                      <tr className="bg-slate-100">
                        <th className="border border-slate-900 p-1.5">विकृतिया<br />(7)</th>
                        <th className="border border-slate-900 p-1.5">दाँत<br />(8)</th>
                        <th className="border border-slate-900 p-1.5">बाल<br />(9)</th>
                        <th className="border border-slate-900 p-1.5">आंखें<br />(10)</th>
                        <th className="border border-slate-900 p-1.5">आदतें<br />(11)</th>
                        <th className="border border-slate-900 p-1.5">पहनावा<br />(12)</th>
                      </tr>
                      <tr>
                        <td className="border border-slate-900 p-1">
                          <input
                            type="text"
                            value={formData.deformities || ""}
                            onChange={(e) => handleFieldChange("deformities", e.target.value)}
                            className="w-full text-center bg-transparent outline-none"
                          />
                        </td>
                        <td className="border border-slate-900 p-1">
                          <input
                            type="text"
                            value={formData.teeth || ""}
                            onChange={(e) => handleFieldChange("teeth", e.target.value)}
                            className="w-full text-center bg-transparent outline-none"
                          />
                        </td>
                        <td className="border border-slate-900 p-1">
                          <input
                            type="text"
                            value={formData.hair || ""}
                            onChange={(e) => handleFieldChange("hair", e.target.value)}
                            className="w-full text-center bg-transparent outline-none"
                          />
                        </td>
                        <td className="border border-slate-900 p-1">
                          <input
                            type="text"
                            value={formData.eyes || ""}
                            onChange={(e) => handleFieldChange("eyes", e.target.value)}
                            className="w-full text-center bg-transparent outline-none"
                          />
                        </td>
                        <td className="border border-slate-900 p-1">
                          <input
                            type="text"
                            value={formData.habits || ""}
                            onChange={(e) => handleFieldChange("habits", e.target.value)}
                            className="w-full text-center bg-transparent outline-none"
                          />
                        </td>
                        <td className="border border-slate-900 p-1">
                          <input
                            type="text"
                            value={formData.dress || ""}
                            onChange={(e) => handleFieldChange("dress", e.target.value)}
                            className="w-full text-center bg-transparent outline-none"
                          />
                        </td>
                      </tr>
                      <tr className="bg-slate-100">
                        <th className="border border-slate-900 p-1.5">भाषा/बोली<br />(13)</th>
                        <th className="border border-slate-900 p-1.5">जले का निशान<br />(14)</th>
                        <th className="border border-slate-900 p-1.5">सफेद धब्बे<br />(15)</th>
                        <th className="border border-slate-900 p-1.5">मस्सा/तिल<br />(16)</th>
                        <th className="border border-slate-900 p-1.5">घाव/निशान<br />(17)</th>
                        <th className="border border-slate-900 p-1.5">गुदा निशान/टैटू<br />(18)</th>
                      </tr>
                      <tr>
                        <td className="border border-slate-900 p-1">
                          <input
                            type="text"
                            value={formData.languageDialect || ""}
                            onChange={(e) => handleFieldChange("languageDialect", e.target.value)}
                            className="w-full text-center bg-transparent outline-none"
                          />
                        </td>
                        <td className="border border-slate-900 p-1">
                          <input
                            type="text"
                            value={formData.burnMarks || ""}
                            onChange={(e) => handleFieldChange("burnMarks", e.target.value)}
                            className="w-full text-center bg-transparent outline-none"
                          />
                        </td>
                        <td className="border border-slate-900 p-1">
                          <input
                            type="text"
                            value={formData.leukodermaSpots || ""}
                            onChange={(e) => handleFieldChange("leukodermaSpots", e.target.value)}
                            className="w-full text-center bg-transparent outline-none"
                          />
                        </td>
                        <td className="border border-slate-900 p-1">
                          <input
                            type="text"
                            value={formData.moleMarks || ""}
                            onChange={(e) => handleFieldChange("moleMarks", e.target.value)}
                            className="w-full text-center bg-transparent outline-none"
                          />
                        </td>
                        <td className="border border-slate-900 p-1">
                          <input
                            type="text"
                            value={formData.scarWoundMarks || ""}
                            onChange={(e) => handleFieldChange("scarWoundMarks", e.target.value)}
                            className="w-full text-center bg-transparent outline-none"
                          />
                        </td>
                        <td className="border border-slate-900 p-1">
                          <input
                            type="text"
                            value={formData.tattooMarks || ""}
                            onChange={(e) => handleFieldChange("tattooMarks", e.target.value)}
                            className="w-full text-center bg-transparent outline-none"
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Fingerprints and Socio-Economic Status */}
                <div className="flex items-center gap-3 pt-2">
                  <span className="font-bold">2. उंगलियो के निशान लिये गए :</span>
                  <input
                    type="text"
                    value={formData.fingerprintsTaken || "हाँ"}
                    onChange={(e) => handleFieldChange("fingerprintsTaken", e.target.value)}
                    className="font-bold text-center border border-slate-300 rounded px-2 py-0.5 w-20"
                  />
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

                {/* Risk Checklist */}
                <div className="space-y-2 pt-1">
                  <div className="font-bold">4. जांच पडताल एंव ज्ञात पुलिस रिकार्ड के आधार पर जोखिम मूल्यांकन:</div>
                  <div className="pl-5 space-y-1.5 text-xs">
                    {[
                      { key: "isDangerous", label: "(क) खतरनाक है :" },
                      { key: "isBailJumped", label: "(ख) पूर्व में किसी जमानत से बच निकला है :" },
                      { key: "usuallyCarriesArms", label: "(ग) आमतौर पर शस्त्र रखता है :" },
                      { key: "activeWithGang", label: "(घ) सहयोगियो सहित क्रियाशील है :" },
                      { key: "isKnownListedCriminal", label: "(ङ) ज्ञात/ सूचिबद्ध अपराधी है या नही:" },
                      { key: "isHabitualOffender", label: "(च) आदतन अपराधी है या नही:" },
                      { key: "isLikelyToEscapeBail", label: "(छ) जमानत के दौरान बच निकलने की सम्भावना है:" },
                      {
                        key: "isLikelyToThreatenOrRepeat",
                        label: "(ज) जमानत पर रिहा होने के बाद अपराध करने या पीडितो / गवाहो को धमकाने की सम्भावना है :",
                      },
                    ].map((item) => {
                      const val = (formData as any)[item.key] || "नही";
                      return (
                        <div
                          key={item.key}
                          className="flex items-center justify-between max-w-xl py-0.5 border-b border-slate-100"
                        >
                          <span>{item.label}</span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleFieldChange(item.key as any, "हाँ")}
                              className={`px-2.5 py-0.5 rounded text-[11px] font-bold border ${
                                val === "हाँ" ? "bg-red-600 text-white border-red-600" : "bg-white text-slate-700"
                              }`}
                            >
                              हाँ
                            </button>
                            <button
                              type="button"
                              onClick={() => handleFieldChange(item.key as any, "नही")}
                              className={`px-2.5 py-0.5 rounded text-[11px] font-bold border ${
                                val === "नही" ? "bg-slate-700 text-white border-slate-700" : "bg-white text-slate-700"
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
                        value={formData.wantedInOtherCrime || "कोई नहीं"}
                        onChange={(e) => handleFieldChange("wantedInOtherCrime", e.target.value)}
                        className="font-bold text-slate-950 bg-transparent border-b border-dotted border-slate-700 px-1 outline-none flex-1 max-w-md"
                      />
                    </div>
                  </div>
                </div>

                {/* केवल मोहर्र थाना के प्रयोग हेतू */}
                <div className="pt-6 border-t-2 border-slate-900 space-y-3">
                  <h4 className="font-bold text-sm underline text-slate-950">केवल मोहर्र थाना के प्रयोग हेतू :</h4>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold">Eagle Software Criminal ID No.:</span>
                      <input
                        type="text"
                        value={formData.eagleCriminalId || ""}
                        onChange={(e) => handleFieldChange("eagleCriminalId", e.target.value)}
                        placeholder="EAGLE-ID..."
                        className="font-mono font-bold text-slate-950 bg-transparent border-b border-dotted border-slate-700 px-1 outline-none w-60"
                      />
                    </div>
                  </div>

                  <div className="pt-4 text-right space-y-1 text-xs">
                    <p className="font-bold">मोहर्र थाना (MHC) के हस्ताक्षर</p>
                    <div className="flex items-center justify-end gap-1.5">
                      <span>नाम:</span>
                      <input
                        type="text"
                        value={formData.mhcName || ""}
                        onChange={(e) => handleFieldChange("mhcName", e.target.value)}
                        placeholder="MHC Name"
                        className="font-bold text-slate-950 bg-transparent border-b border-dotted border-slate-700 px-1 outline-none w-48 text-right"
                      />
                    </div>
                    <div className="flex items-center justify-end gap-1.5">
                      <span>बेल्ट नं:</span>
                      <input
                        type="text"
                        value={formData.mhcBeltNumber || ""}
                        onChange={(e) => handleFieldChange("mhcBeltNumber", e.target.value)}
                        placeholder="Belt No."
                        className="font-bold text-slate-950 bg-transparent border-b border-dotted border-slate-700 px-1 outline-none w-48 text-right"
                      />
                    </div>
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
                <input
                  type="text"
                  value={formData.docTitle || "NATGRID PERFORMA"}
                  onChange={(e) => handleFieldChange("docTitle", e.target.value)}
                  className="font-bold text-slate-950 underline underline-offset-4 text-base sm:text-lg text-center bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent hover:border-slate-300 focus:border-purple-500 rounded px-2 py-0.5 outline-none tracking-wide"
                  placeholder="NATGRID PERFORMA"
                />
              </div>

              {/* Official 12-Row Bordered Table */}
              <div className="border-[1.5px] border-slate-950 rounded-none overflow-hidden">
                <table className="w-full border-collapse text-xs sm:text-[13px] text-slate-950">
                  <tbody>
                    {/* Row 1: Name of Incharge Unit/SHO */}
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
                          className="w-full font-medium text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-purple-500 rounded px-1.5 py-0.5 outline-none"
                        />
                      </td>
                    </tr>

                    {/* Row 2: Mobile No. */}
                    <tr className="border-b border-slate-950">
                      <td className="p-2 font-medium border-r border-slate-950 align-top">Mobile No.</td>
                      <td colSpan={3} className="p-2 align-top">
                        <input
                          type="text"
                          value={formData.shoPhone || ""}
                          onChange={(e) => handleFieldChange("shoPhone", e.target.value)}
                          placeholder="SHO Mobile Number"
                          className="w-full font-medium text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-purple-500 rounded px-1.5 py-0.5 outline-none"
                        />
                      </td>
                    </tr>

                    {/* Row 3: Govt. Email ID */}
                    <tr className="border-b border-slate-950">
                      <td className="p-2 font-medium border-r border-slate-950 align-top">Govt. Email ID</td>
                      <td colSpan={3} className="p-2 align-top">
                        <input
                          type="text"
                          value={formData.shoEmail || ""}
                          onChange={(e) => handleFieldChange("shoEmail", e.target.value)}
                          placeholder="Official Govt Email ID"
                          className="w-full font-medium text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-purple-500 rounded px-1.5 py-0.5 outline-none"
                        />
                      </td>
                    </tr>

                    {/* Row 4: FIR No. | Date :- | P.S. | District */}
                    <tr className="border-b border-slate-950">
                      <td className="w-[28%] p-2 border-r border-slate-950 align-top">
                        <div className="flex items-center gap-1 font-bold">
                          <span className="whitespace-nowrap">FIR No.</span>
                          <input
                            type="text"
                            value={formData.complaintNo || ""}
                            onChange={(e) => handleFieldChange("complaintNo", e.target.value)}
                            placeholder="184/2026"
                            className="w-full font-normal text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-purple-500 rounded px-1 py-0.5 outline-none"
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
                            className="w-full font-normal text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-purple-500 rounded px-1 py-0.5 outline-none"
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
                            className="w-full font-normal text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-purple-500 rounded px-1 py-0.5 outline-none"
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
                            className="w-full font-normal text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-purple-500 rounded px-1 py-0.5 outline-none"
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
                            className="w-full font-normal text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-purple-500 rounded px-1.5 py-0.5 outline-none"
                          />
                        </div>
                      </td>
                    </tr>

                    {/* Row 6: Brief summary of case */}
                    <tr className="border-b border-slate-950">
                      <td colSpan={4} className="p-2 align-top space-y-1">
                        <div className="font-bold text-slate-950">Brief summary of case :- &ldquo;&rdquo;</div>
                        <textarea
                          rows={3}
                          value={formData.allegationsBrief || ""}
                          onChange={(e) => handleFieldChange("allegationsBrief", e.target.value)}
                          placeholder="Organized financial fraud and inter-state syndicate cheating victims..."
                          className="w-full font-sans text-xs text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-purple-500 rounded p-1.5 outline-none leading-relaxed"
                        />
                      </td>
                    </tr>

                    {/* Row 7: Name/Rank of I.O. with Mobile No */}
                    <tr className="border-b border-slate-950">
                      <td colSpan={4} className="p-2 align-top">
                        <div className="flex flex-wrap items-center gap-1 font-bold text-slate-950">
                          <span className="whitespace-nowrap">Name/Rank of I.O. with Mobile No :-</span>
                          <input
                            type="text"
                            value={formData.officerName || ""}
                            onChange={(e) => handleFieldChange("officerName", e.target.value)}
                            placeholder="Surender Pal"
                            className="font-normal text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-purple-500 rounded px-1.5 py-0.5 outline-none w-36"
                          />
                          <span className="font-normal">/</span>
                          <input
                            type="text"
                            value={formData.officerRank || ""}
                            onChange={(e) => handleFieldChange("officerRank", e.target.value)}
                            placeholder="Sub-Inspector"
                            className="font-normal text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-purple-500 rounded px-1.5 py-0.5 outline-none w-32"
                          />
                          <span className="font-normal">, Mob:</span>
                          <input
                            type="text"
                            value={formData.officerPhone || ""}
                            onChange={(e) => handleFieldChange("officerPhone", e.target.value)}
                            placeholder="9812034567"
                            className="font-normal text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-purple-500 rounded px-1.5 py-0.5 outline-none w-32"
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

                    {/* Row 9: Explain along with a Valid Reason */}
                    <tr className="border-b border-slate-950">
                      <td colSpan={4} className="p-2 align-top">
                        <div className="flex items-center gap-1 font-bold text-slate-950">
                          <span className="whitespace-nowrap">Explain along with a Valid Reason :-</span>
                          <input
                            type="text"
                            value={formData.natgridReason || "To apprehend the accused"}
                            onChange={(e) => handleFieldChange("natgridReason", e.target.value)}
                            placeholder="To apprehend the accused"
                            className="w-full font-normal text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-purple-500 rounded px-1.5 py-0.5 outline-none"
                          />
                        </div>
                      </td>
                    </tr>

                    {/* Row 10: Name of Department from which Information is required */}
                    <tr className="border-b border-slate-950">
                      <td colSpan={4} className="p-2 align-top">
                        <div className="flex items-center gap-1 font-bold text-slate-950">
                          <span className="whitespace-nowrap">
                            Name of Department from which Information is required:-
                          </span>
                          <input
                            type="text"
                            value={formData.natgridDepartment || ""}
                            onChange={(e) => handleFieldChange("natgridDepartment", e.target.value)}
                            placeholder="FIU-IND, Bureau of Immigration (BOI), Telecom Providers, Income Tax PAN Database"
                            className="w-full font-normal text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-purple-500 rounded px-1.5 py-0.5 outline-none"
                          />
                        </div>
                      </td>
                    </tr>

                    {/* Row 11: What type of information is required? */}
                    <tr className="border-b border-slate-950">
                      <td colSpan={4} className="p-2 align-top space-y-1">
                        <div className="font-bold text-slate-950">What type of information is required?</div>
                        <textarea
                          rows={2}
                          value={formData.natgridInfoRequired || ""}
                          onChange={(e) => handleFieldChange("natgridInfoRequired", e.target.value)}
                          placeholder="All bank accounts linked to PAN/Aadhaar, domestic/international travel history, active registered mobile connections..."
                          className="w-full font-sans text-xs text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-purple-500 rounded p-1.5 outline-none leading-relaxed"
                        />
                      </td>
                    </tr>

                    {/* Row 12: Information available at your end */}
                    <tr>
                      <td colSpan={4} className="p-2.5 align-top space-y-1.5 text-slate-950">
                        <div className="font-bold text-slate-950">Information available at your end:-</div>

                        <div className="flex items-center gap-1 font-medium">
                          <span className="whitespace-nowrap w-44">Name –</span>
                          <input
                            type="text"
                            value={formData.noticeeName || ""}
                            onChange={(e) => handleFieldChange("noticeeName", e.target.value)}
                            placeholder="Vikas Sharma"
                            className="w-full font-normal text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-purple-500 rounded px-1.5 py-0.5 outline-none"
                          />
                        </div>

                        <div className="flex items-center gap-1 font-medium">
                          <span className="whitespace-nowrap w-44">Father Name –</span>
                          <input
                            type="text"
                            value={formData.noticeeFather || ""}
                            onChange={(e) => handleFieldChange("noticeeFather", e.target.value)}
                            placeholder="Ramesh Chand Sharma"
                            className="w-full font-normal text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-purple-500 rounded px-1.5 py-0.5 outline-none"
                          />
                        </div>

                        <div className="flex items-center gap-1 font-medium">
                          <span className="whitespace-nowrap w-44">Address –</span>
                          <input
                            type="text"
                            value={formData.noticeeAddress || ""}
                            onChange={(e) => handleFieldChange("noticeeAddress", e.target.value)}
                            placeholder="House No. 412, Sector 7, Urban Estate, Sirsa, Haryana"
                            className="w-full font-normal text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-purple-500 rounded px-1.5 py-0.5 outline-none"
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
                            className="w-full font-normal text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-purple-500 rounded px-1.5 py-0.5 outline-none"
                          />
                        </div>

                        <div className="flex items-center gap-1 font-medium">
                          <span className="whitespace-nowrap w-44">Mobile No. –</span>
                          <input
                            type="text"
                            value={formData.noticeePhone || ""}
                            onChange={(e) => handleFieldChange("noticeePhone", e.target.value)}
                            placeholder="9812044551, 9416022331"
                            className="w-full font-normal text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-purple-500 rounded px-1.5 py-0.5 outline-none"
                          />
                        </div>

                        <div className="flex items-center gap-1 font-medium">
                          <span className="whitespace-nowrap w-44">Aadhar No. –</span>
                          <input
                            type="text"
                            value={formData.accusedAadhaar || ""}
                            onChange={(e) => handleFieldChange("accusedAadhaar", e.target.value)}
                            placeholder="8492-3810-4921"
                            className="w-full font-normal text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-purple-500 rounded px-1.5 py-0.5 outline-none"
                          />
                        </div>

                        <div className="flex items-center gap-1 font-medium">
                          <span className="whitespace-nowrap w-44">PAN -</span>
                          <input
                            type="text"
                            value={formData.accusedPan || ""}
                            onChange={(e) => handleFieldChange("accusedPan", e.target.value)}
                            placeholder="ABCPS1234F"
                            className="w-full font-normal text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-purple-500 rounded px-1.5 py-0.5 outline-none"
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
                            className="w-full font-normal text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-purple-500 rounded px-1.5 py-0.5 outline-none"
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
                  <p>Signature of Incharge/SHO</p>
                  <p>With Seal/Stamp</p>
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
