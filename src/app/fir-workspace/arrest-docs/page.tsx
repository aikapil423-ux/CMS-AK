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
  ShieldAlert,
  User,
  Scale,
  RotateCcw,
  Plus,
  Trash2,
  FileCheck2,
  Activity,
  Layers,
  MapPin,
  ClipboardList,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { firService } from "@/services/firService";
import { FIRItem, NoticeFormData } from "@/types";
import { FIRWorkspaceNav } from "@/components/fir-workspace/FIRWorkspaceNav";
import { formatDate } from "@/lib/utils";
import { printA4Element, downloadA4DocumentAsHtml } from "@/utils/printElement";

export type ArrestDocTemplateType =
  | "arrest_memo"
  | "fard_jamatalashi"
  | "grounds_of_arrest"
  | "pehchan_patr"
  | "fard_baramadgi"
  | "remand_application"
  | "fard_nishandehi"
  | "fard_inkeshaf"
  | "medical_letter"
  | "peshi_remand";

export interface ArrestWitnessItem {
  id: string;
  srNo: string;
  name: string;
  address: string;
  phone?: string;
  signature?: string;
}

export interface JamaTalashiItem {
  id: string;
  srNo: string;
  description: string;
  quantity: string;
  identification?: string;
}

export interface RecoveryItem {
  id: string;
  srNo: string;
  description: string;
  quantity: string;
  sealDetails: string;
}

export type ArrestDocsFormData = Partial<NoticeFormData> & {
  // Common Arrest Fields
  courtName?: string;
  courtDistrict?: string;
  remandDays?: string;
  remandFromDate?: string;
  remandToDate?: string;
  remandReasons?: string;
  recoveryPlace?: string;
  recoveryDisclosureDate?: string;
  pointingOutPlace?: string;
  pointingOutBoundaries?: {
    east: string;
    west: string;
    north: string;
    south: string;
  };
  disclosureStatement?: string;
  hospitalName?: string;
  medicalOfficerName?: string;
  escortConstable1?: string;
  escortConstable2?: string;
  medicalChecklistInjuries?: string;
  medicalChecklistFitness?: string;
  medicalChecklistSubstance?: string;
  judicialRemandGrounds?: string;
  bailObjectionGrounds?: string;
  groundsDeliveredToAccused?: boolean;
  groundsExplainedLanguage?: string;
  relativeInformedMode?: string;
  recoveryItems?: RecoveryItem[];
  arrestWitnesses?: ArrestWitnessItem[];
  jamaTalashiItems?: Array<{
    id: string;
    srNo: string;
    description: string;
    quantity: string;
    identification?: string;
  }>;
};

const TEMPLATE_CONFIG: Record<
  ArrestDocTemplateType,
  { label: string; badge: string; subTitle: string; description: string; icon: any; color: string }
> = {
  arrest_memo: {
    label: "1. गिरफ्तारी/ न्यायालय समर्पण फार्म संख्या 26.8(1) (4 पृष्ठ)",
    badge: "फार्म 26.8(1) (4 पृष्ठ)",
    subTitle: "गिरफ्तारी/न्यायालय समर्पण फार्म भाग-1 व 2, धारा 47 BNSS, जामा तलाशी, पहचान पत्र व 18-शारीरिक लक्षण",
    description: "Statutory 4-page memo recording arrest, intimation to family, Section 47 BNSS grounds, Jama Talashi & MHC records",
    icon: ShieldAlert,
    color: "text-rose-600",
  },
  fard_jamatalashi: {
    label: "2. फर्द जामातलाशी अभियुक्त (धारा 50 BNSS / 51 CrPC)",
    badge: "धारा 50 BNSS",
    subTitle: "फर्द जामातलाशी अभियुक्त (Search of Arrested Person & Inventory of Seized Personal Effects)",
    description: "Personal search memo recording all articles, cash, documents and personal effects seized from accused",
    icon: ClipboardList,
    color: "text-amber-600",
  },
  grounds_of_arrest: {
    label: "3. गिरफ्तारी के आधार की लिखित सूचना (धारा 47 BNSS / Art 22(1))",
    badge: "धारा 47 BNSS",
    subTitle: "गिरफ्तारी के आधार की लिखित सूचना एवं कानूनी अधिकारों की पावती (Notice of Grounds of Arrest)",
    description: "Statutory notice communicating specific grounds of arrest, bailable/non-bailable nature and legal aid rights",
    icon: FileText,
    color: "text-blue-600",
  },
  pehchan_patr: {
    label: "4. पहचान पत्र व शारीरिक हुलिया प्रपत्र (Accused Identification Memo)",
    badge: "धारा 54 BNSS",
    subTitle: "अभियुक्त पहचान पत्र व 18 शारीरिक हुलिया/पहचान चिन्ह प्रपत्र (Identification & Descriptive Roll)",
    description: "Formal identification roll recording 18 physical traits, scars, moles, build, photo box & identity witnesses",
    icon: User,
    color: "text-purple-600",
  },
  fard_baramadgi: {
    label: "5. फर्द बरामदगी / जब्ती सूची (धारा 23(2) BSA / 27 Evidence Act)",
    badge: "धारा 23(2) BSA",
    subTitle: "फर्द बरामदगी / जब्ती सूची मय सीलबंद नमूना मोहर (Seizure & Recovery Memo upon Disclosure)",
    description: "Official recovery memo of weapon/stolen property/incriminating items recovered upon accused's disclosure statement",
    icon: Layers,
    color: "text-emerald-600",
  },
  remand_application: {
    label: "6. पुलिस हिरासत रिमांड प्रार्थना पत्र (धारा 187 BNSS / 167 CrPC)",
    badge: "धारा 187 BNSS",
    subTitle: "प्रार्थना पत्र बाबत हासिल करने पुलिस हिरासत रिमांड (Application for Police Custody Remand)",
    description: "Application before Judicial Magistrate requesting police custody remand with specific justification points",
    icon: Scale,
    color: "text-red-600",
  },
  fard_nishandehi: {
    label: "7. फर्द निशानदेही मौका/स्थान (Pointing Out & Demarcation Memo)",
    badge: "निशानदेही प्रपत्र",
    subTitle: "फर्द निशानदेही मौका-ए-वारदात अथवा माल मसरूका छिपाने का स्थान (Pointing Out Memo)",
    description: "Demarcation memo where accused leads police party and points out scene of crime or hidden articles",
    icon: MapPin,
    color: "text-teal-600",
  },
  fard_inkeshaf: {
    label: "8. फर्द इंकिशाफ / इकबालिया बयान (धारा 23(2) BSA / 27 Evidence Act)",
    badge: "धारा 23(2) BSA",
    subTitle: "फर्द इंकिशाफ / इकबालिया बयान अभियुक्त (Voluntary Disclosure Statement Leading to Recovery)",
    description: "Voluntary statement made in police custody disclosing hidden weapon/articles known exclusively to accused",
    icon: FileCheck2,
    color: "text-indigo-600",
  },
  medical_letter: {
    label: "9. चिकित्सीय परीक्षण पत्र / MLR Request (धारा 51 BNSS / 53-54 CrPC)",
    badge: "धारा 51 BNSS",
    subTitle: "प्रार्थना पत्र बाबत डाक्टरी मुलाहिजा / चिकित्सीय परीक्षण (Request for Accused Medical Examination)",
    description: "Formal requisition addressed to Medical Officer/Civil Hospital for mandatory medical examination of arrested accused",
    icon: Activity,
    color: "text-sky-600",
  },
  peshi_remand: {
    label: "10. पेशी रिमांड / न्यायिक हिरासत प्रार्थना पत्र (Judicial Remand)",
    badge: "न्यायिक हिरासत",
    subTitle: "प्रार्थना पत्र बाबत पेशी अभियुक्त व भेजने न्यायिक हिरासत (जिला कारागार) (Judicial Custody Application)",
    description: "Application for production of accused after police remand requesting dispatch to Judicial Custody (Jail)",
    icon: Scale,
    color: "text-slate-700",
  },
};

const DEFAULT_SAMPLE_DATA: Record<ArrestDocTemplateType, ArrestDocsFormData> = {
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

    isDangerous: "नही",
    isBailJumped: "नही",
    usuallyCarriesArms: "नही",
    activeWithGang: "नही",
    isKnownListedCriminal: "नही",
    isHabitualOffender: "नही",
    isLikelyToEscapeBail: "नही",
    articlesHandedOverToMhc: "उपरोक्त जामातलाशी का सम्पूर्ण सामान बमुताबिक फर्द थाना मालखाना मोहर्रिर (MHC) को सुरक्षित रखवाया गया।",
    mhcSignRankPno: "MHC HC रमेश कुमार, PNO-23114, थाना शहर पानीपत",
    mhcDepositDate: "18.09.2026",
  },

  fard_jamatalashi: {
    headerDept: "हरियाणा पुलिस",
    policeStation: "थाना शहर पानीपत",
    district: "जिला पानीपत",
    complaintNo: "128/2026",
    issueDate: "18.09.2026",
    sectionsOfLaw: "धारा 318(4), 316(2) BNS, 2023",
    docTitle: "फर्द जामातलाशी अभियुक्त",
    docSubTitle: "अंतर्गत धारा 50 भारतीय नागरिक सुरक्षा संहिता (BNSS), 2023 / धारा 51 दंड प्रक्रिया संहिता",
    noticeeName: "विकास शर्मा",
    noticeeFather: "रमेश चंद शर्मा",
    noticeeAge: "34 वर्ष",
    noticeeAddress: "मकान न0 412, सेक्टर 7, अर्बन एस्टेट, पानीपत",
    noticeeRole: "गिरफ्तार अभियुक्त",
    arrestDate: "18.09.2026",
    arrestTime: "11:30 प्रात:",
    arrestPlace: "रेलवे रोड चौक, पानीपत",
    jamaTalashiItems: [
      { id: "jt_1", srNo: "1.", description: "नकदी भारतीय मुद्रा कुल 1,450/- रुपये (500 के दो नोट, 200 के दो नोट, 50 का एक नोट)", quantity: "1,450/-", identification: "नोट नंबर अंकित" },
      { id: "jt_2", srNo: "2.", description: "एक मोबाइल फोन मार्क सैमसंग गैलेक्सी A14, रंग नीला, मय वोडाफोन सिम कार्ड (चालू हालत)", quantity: "1", identification: "IMEI: 358491029481920" },
      { id: "jt_3", srNo: "3.", description: "पर्स चमड़ा भूरा रंग जिसमें आधार कार्ड (8492-3810-4921) व ड्राइविंग लाइसेंस व फोटो", quantity: "1", identification: "व्यक्तिगत दस्तावेज" },
      { id: "jt_4", srNo: "4.", description: "कलाई घड़ी फास्टट्रैक स्टील बेल्ट चालू हालत", quantity: "1", identification: "धातु डायल" },
    ],
    witnessSign1: "बलजीत सिंह सुपुत्र हरनाम सिंह, साकिन वार्ड न0 5, पानीपत",
    witnessSign2: "रमेश लाल सुपुत्र वेद प्रकाश, साकिन न्यू बस स्टैंड, पानीपत",
    officerName: "सुरेंद्र पाल",
    officerRank: "उप-निरीक्षक (SI)",
    officerPno: "04291885",
    officerPhone: "9812034567",
    mhcName: "HC रमेश कुमार",
    mhcRank: "MHC Thana",
    mhcBeltNumber: "PNO-23114",
    statutoryClarification: "तलाशी के दौरान अभियुक्त के पास से उपरोक्त सामान बरामद हुआ, जिसे नियमानुसार कब्जा पुलिस में लिया जाकर रसीद की एक प्रति अभियुक्त को प्रदान की गई।",
  },

  grounds_of_arrest: {
    headerDept: "हरियाणा पुलिस",
    policeStation: "थाना शहर पानीपत",
    district: "जिला पानीपत",
    complaintNo: "128/2026",
    issueDate: "18.09.2026",
    sectionsOfLaw: "धारा 318(4), 316(2), 351(2) BNS, 2023",
    docTitle: "गिरफ्तारी के आधार की लिखित सूचना (Grounds of Arrest)",
    docSubTitle: "अंतर्गत धारा 47 भारतीय नागरिक सुरक्षा संहिता (BNSS), 2023 एवं भारतीय संविधान का अनुच्छेद 22(1)",
    noticeeName: "विकास शर्मा",
    noticeeFather: "रमेश चंद शर्मा",
    noticeeAge: "34 वर्ष",
    noticeeAddress: "मकान न0 412, सेक्टर 7, अर्बन एस्टेट, पानीपत",
    noticeeRole: "अभियुक्त (Accused)",
    arrestDate: "18.09.2026",
    arrestTime: "11:30 प्रात:",
    arrestPlace: "रेलवे रोड चौक, पानीपत",
    grounds47Sections: "धारा 318(4), 316(2), 351(2) भारतीय न्याय संहिता (BNS), 2023 (संज्ञेय एवं गैर-जमानती अपराध)",
    grounds47Role: "आपके विरुद्ध परिवादी से धोखाधड़ी कर 4,50,000/- रुपये ऐंठने एवं अमानत में खयानत करने तथा जान से मारने की धमकी देने के ठोस व पुख्ता साक्ष्य प्राप्त हुए हैं।",
    grounds47Evidence: "बैंक खाता स्टेटमेंट, शिकायतकर्ता का बयान, मोबाइल कॉल व व्हाट्सएप चैट के तकनीकी साक्ष्य।",
    grounds47Other: "1. अग्रिम अपराध को रोकने हेतु।\n2. मामले की निष्पक्ष व गहन विवेचना तथा साक्ष्यों/राशि की बरामदगी हेतु।\n3. साक्षियों को डराने-धमकाने अथवा साक्ष्य मिटाने की प्रबल आशंका को समाप्त करने हेतु।\n4. माननीय सर्वोच्च न्यायालय (डी.के. बसु बनाम पश्चिम बंगाल राज्य व अर्नेश कुमार) की गाइडलाइंस की अनुपालना में।",
    relativeName: "अमित शर्मा",
    relativeRelation: "सगा भाई",
    relativeMobile: "9812099881",
    intimationDate: "18.09.2026",
    intimationTime: "11:45 प्रात:",
    relativeInformedMode: "टेलीफोनिक कॉल एवं व्हाट्सएप द्वारा सूचना प्रेषित",
    groundsDeliveredToAccused: true,
    groundsExplainedLanguage: "हिन्दी / सरल भाषा",
    officerName: "सुरेंद्र पाल",
    officerRank: "उप-निरीक्षक (SI)",
    officerPno: "04291885",
    officerPhone: "9812034567",
    statutoryClarification: "आपको धारा 38 BNSS के तहत अपनी पसंद के अधिवक्ता से परामर्श करने तथा जिला विधिक सेवा प्राधिकरण (DLSA) से निःशुल्क कानूनी सहायता प्राप्त करने का पूर्ण विधिक अधिकार है।",
  },

  pehchan_patr: {
    headerDept: "हरियाणा पुलिस",
    policeStation: "थाना शहर पानीपत",
    district: "जिला पानीपत",
    complaintNo: "128/2026",
    issueDate: "18.09.2026",
    sectionsOfLaw: "धारा 318(4), 316(2) BNS, 2023",
    docTitle: "अभियुक्त पहचान पत्र व शारीरिक हुलिया प्रपत्र",
    docSubTitle: "Accused Identification & Descriptive Roll (अंतर्गत धारा 54 BNSS / धारा 9 साक्ष्य अधिनियम)",
    noticeeName: "विकास शर्मा",
    noticeeAlias1: "विक्की",
    noticeeFather: "रमेश चंद शर्मा",
    noticeeAge: "34 वर्ष (जन्म 14.08.1992)",
    accusedGender: "पुरुष",
    noticeeAddress: "मकान न0 412, सेक्टर 7, अर्बन एस्टेट, पानीपत",
    noticeeNationality: "भारतीय",
    religion: "हिन्दू",
    categoryCaste: "सामान्य",
    educationalQualification: "स्नातक (B.Com)",
    profession: "दुकानदार / व्यवसाय",
    heightCm: "173 सेमी (लगभग 5 फीट 8 इंच)",
    bodyBuild: "मध्यम, गठीला बदन",
    colorBloodGroup: "गेहुंआ / B+ve",
    identMarks: "दाहिनी भौंह के ऊपर 1 इंच लंबा पुराना कट का निशान",
    moleMarks: "बाएं गाल पर 1 काला तिल व गर्दन के पीछे तिल",
    scarWoundMarks: "दाहिनी कोहनी पर जलने/चोट का पुराना सफेद निशान",
    tattooMarks: "दाहिने हाथ की कलाई पर 'ॐ' गुदा हुआ",
    hair: "काले छोटे, सामने से सामान्य",
    eyes: "काली, दृष्टि सामान्य",
    teeth: "सामान्य, कोई टूटा दांत नहीं",
    deformities: "कोई शारीरिक विकलांगता या लंगड़ापन नहीं",
    dress: "नीली जींस, सफेद शर्ट व काले जूते",
    languageDialect: "हिन्दी / हरियाणवी बोली",
    habits: "चाय व धूम्रपान का आदी",
    fingerprintsTaken: "हाँ (सभी 10 उंगलियों के फिंगरप्रिंट लिए गए)",
    userIdentificationNo: "8492-3810-4921 (आधार कार्ड)",
    panNo: "ABCPS1234F",
    witnessSign1: "बलजीत सिंह सुपुत्र हरनाम सिंह, पानीपत",
    witnessSign2: "रमेश लाल सुपुत्र वेद प्रकाश, पानीपत",
    officerName: "सुरेंद्र पाल",
    officerRank: "उप-निरीक्षक (SI)",
    officerPno: "04291885",
    officerPhone: "9812034567",
  },

  fard_baramadgi: {
    headerDept: "हरियाणा पुलिस",
    policeStation: "थाना शहर पानीपत",
    district: "जिला पानीपत",
    complaintNo: "128/2026",
    issueDate: "18.09.2026",
    sectionsOfLaw: "धारा 318(4), 316(2) BNS, 2023",
    docTitle: "फर्द बरामदगी / जब्ती सूची (Seizure Memo)",
    docSubTitle: "अंतर्गत धारा 23(2) भारतीय साक्ष्य अधिनियम, 2023 / धारा 27 भारतीय साक्ष्य अधिनियम, 1872",
    noticeeName: "विकास शर्मा",
    noticeeFather: "रमेश चंद शर्मा",
    noticeeAddress: "मकान न0 412, सेक्टर 7, अर्बन एस्टेट, पानीपत",
    noticeeRole: "अभियुक्त",
    recoveryPlace: "अभियुक्त के रिहायशी मकान न0 412, सेक्टर 7, अर्बन एस्टेट, पानीपत के शयनकक्ष की अलमारी से",
    recoveryDisclosureDate: "18.09.2026 (बमुताबिक फर्द इंकिशाफ)",
    recoveryItems: [
      { id: "rec_1", srNo: "1.", description: "ठगी की राशि में से नकदी कुल 1,20,000/- रुपये (500-500 के कुल 240 नोट)", quantity: "1,20,000/-", sealDetails: "सफेद कपड़े में सील मोहर 'SP'" },
      { id: "rec_2", srNo: "2.", description: "एक लैपटॉप मार्क डेल (काले रंग का) जिसमें फर्जी एग्रीमेंट व बिलिंग रिकॉर्ड संग्रहित है", quantity: "1", sealDetails: "कपड़े में सील मोहर 'SP'" },
      { id: "rec_3", srNo: "3.", description: "फर्जी लेटरपैड व 2 मोहरें (स्टैम्प) जो धोखाधड़ी में इस्तेमाल की गई", quantity: "2 स्टैम्प", sealDetails: "डिब्बे में सील मोहर 'SP'" },
    ],
    witnessSign1: "बलजीत सिंह सुपुत्र हरनाम सिंह, पानीपत (स्वतंत्र पंच गवाह)",
    witnessSign2: "रमेश लाल सुपुत्र वेद प्रकाश, पानीपत (स्वतंत्र पंच गवाह)",
    officerName: "सुरेंद्र पाल",
    officerRank: "उप-निरीक्षक (SI)",
    officerPno: "04291885",
    officerPhone: "9812034567",
    statutoryClarification: "उपरोक्त बरामदशुदा माल को स्वतंत्र पंच गवाहान की उपस्थिति में सफेद कपड़े व डिब्बे में रखकर सील मोहर 'SP' से सीलबंद किया गया। नमूना मोहर अलग से कपड़े के टुकड़े पर सुरक्षित रखा गया। गवाहान व अभियुक्त ने फर्द पर हस्ताक्षर किए।",
  },

  remand_application: {
    headerDept: "हरियाणा पुलिस",
    policeStation: "थाना शहर पानीपत",
    district: "जिला पानीपत",
    complaintNo: "128/2026",
    issueDate: "18.09.2026",
    sectionsOfLaw: "धारा 318(4), 316(2), 351(2) BNS, 2023",
    courtName: "माननीय इलाका मजिस्ट्रेट / मुख्य न्यायिक दंडाधिकारी महोदय",
    courtDistrict: "पानीपत",
    docTitle: "प्रार्थना पत्र बाबत हासिल करने पुलिस हिरासत रिमांड",
    docSubTitle: "अंतर्गत धारा 187 भारतीय नागरिक सुरक्षा संहिता (BNSS), 2023 / धारा 167 दंड प्रक्रिया संहिता",
    noticeeName: "विकास शर्मा",
    noticeeFather: "रमेश चंद शर्मा",
    noticeeAge: "34 वर्ष",
    noticeeAddress: "मकान न0 412, सेक्टर 7, अर्बन एस्टेट, पानीपत",
    noticeeRole: "अभियुक्त",
    arrestDate: "18.09.2026",
    arrestTime: "11:30 प्रात:",
    remandDays: "3 दिन",
    remandFromDate: "18.09.2026",
    remandToDate: "21.09.2026",
    remandReasons: `1. अभियोग में कुल ठगी की राशि 4,50,000/- रुपये में से शेष राशि 3,30,000/- रुपये की बरामदगी की जानी है।
2. अभियुक्त से वारदात में प्रयुक्त अन्य इलेक्ट्रॉनिक उपकरण, फर्जी दस्तावेज एवं बैंक पासबुक बरामद करवाने हैं।
3. अभियुक्त के अन्य सह-आरोपियों के नाम-पते व छिपने के गुप्त ठिकानों का पता लगाकर उन्हें गिरफ्तार करना है।
4. अभियुक्त को घटनास्थल, बैंक व संबंधित ठिकानों पर ले जाकर फर्द निशानदेही तस्दीक करवानी है।
5. अभियुक्त से विस्तृत पूछताछ कर धोखाधड़ी के पूरे नेटवर्क का पर्दाफाश करना न्यायहित में अत्यंत आवश्यक है।`,
    officerName: "सुरेंद्र पाल",
    officerRank: "उप-निरीक्षक (SI)",
    officerPno: "04291885",
    officerPhone: "9812034567",
    statutoryClarification: "अतः श्रीमान जी से सविनय प्रार्थना है कि अभियुक्त विकास शर्मा का 3 दिन का पुलिस हिरासत रिमांड (दिनांक 18.09.2026 से 21.09.2026 तक) मंजूर फरमाने की कृपा की जावे।",
  },

  fard_nishandehi: {
    headerDept: "हरियाणा पुलिस",
    policeStation: "थाना शहर पानीपत",
    district: "जिला पानीपत",
    complaintNo: "128/2026",
    issueDate: "18.09.2026",
    sectionsOfLaw: "धारा 318(4), 316(2) BNS, 2023",
    docTitle: "फर्द निशानदेही मौका/स्थान (Pointing Out Memo)",
    docSubTitle: "Accused Pointing Out & Demarcation Proforma",
    noticeeName: "विकास शर्मा",
    noticeeFather: "रमेश चंद शर्मा",
    noticeeAddress: "मकान न0 412, सेक्टर 7, अर्बन एस्टेट, पानीपत",
    noticeeRole: "अभियुक्त",
    pointingOutPlace: "मकान न0 412, सेक्टर 7, अर्बन एस्टेट, पानीपत (जहां अभियुक्त ने ठगी की राशि व लैपटॉप छिपाया था)",
    pointingOutBoundaries: {
      east: "मकान न0 411 (पड़ोसी)",
      west: "मकान न0 413 (पड़ोसी)",
      north: "मुख्य गली (20 फीट चौड़ी सड़क)",
      south: "खाली प्लॉट",
    },
    statutoryClarification: "आज दिनांक 18.09.2026 को वक्त दोपहर 02:00 बजे अभियुक्त विकास शर्मा पुलिस पार्टी व उपस्थित स्वतंत्र गवाहान को साथ लेकर अपने बताए अनुसार उक्त स्थान पर पहुंचा तथा अपनी उंगली से इशारा करके निशानदेही कराई कि 'यही वह कमरा व अलमारी है जहां मैंने ठगी के रुपये व लैपटॉप छिपाकर रखे हैं।' जिस पर उपस्थित गवाहान ने तस्दीक की।",
    witnessSign1: "बलजीत सिंह सुपुत्र हरनाम सिंह, पानीपत (स्वतंत्र गवाह)",
    witnessSign2: "रमेश लाल सुपुत्र वेद प्रकाश, पानीपत (स्वतंत्र गवाह)",
    officerName: "सुरेंद्र पाल",
    officerRank: "उप-निरीक्षक (SI)",
    officerPno: "04291885",
    officerPhone: "9812034567",
  },

  fard_inkeshaf: {
    headerDept: "हरियाणा पुलिस",
    policeStation: "थाना शहर पानीपत",
    district: "जिला पानीपत",
    complaintNo: "128/2026",
    issueDate: "18.09.2026",
    sectionsOfLaw: "धारा 318(4), 316(2) BNS, 2023",
    docTitle: "फर्द इंकिशाफ / इकबालिया बयान अभियुक्त",
    docSubTitle: "अंतर्गत धारा 23(2) भारतीय साक्ष्य अधिनियम, 2023 / धारा 27 भारतीय साक्ष्य अधिनियम, 1872",
    noticeeName: "विकास शर्मा",
    noticeeFather: "रमेश चंद शर्मा",
    noticeeAddress: "मकान न0 412, सेक्टर 7, अर्बन एस्टेट, पानीपत",
    noticeeRole: "अभियुक्त (Accused in Police Custody)",
    disclosureStatement: `बयान दिया कि मैंने अपने साथी के साथ मिलकर परिवादी से 4,50,000/- रुपये की धोखाधड़ी की थी। उस राशि में से मैंने 1,20,000/- रुपये नकदी तथा धोखाधड़ी में इस्तेमाल किया गया लैपटॉप अपने घर (मकान न0 412, सेक्टर 7, अर्बन एस्टेट) के अंदर वाले शयनकक्ष की लकड़ी की अलमारी के गुप्त खाने में छिपाकर रखे हुए हैं, जो मेरे अलावा किसी अन्य को मालूम नहीं हैं। मैं चलकर पुलिस पार्टी को वह स्थान बताकर उक्त रुपये व लैपटॉप बरामद करवा सकता हूँ।`,
    witnessSign1: "बलजीत सिंह सुपुत्र हरनाम सिंह, पानीपत (गवाह बयान)",
    witnessSign2: "रमेश लाल सुपुत्र वेद प्रकाश, पानीपत (गवाह बयान)",
    officerName: "सुरेंद्र पाल",
    officerRank: "उप-निरीक्षक (SI)",
    officerPno: "04291885",
    officerPhone: "9812034567",
    statutoryClarification: "अभियुक्त ने उक्त बयान पुलिस हिरासत में स्वतंत्र गवाहान के समक्ष बिना किसी भय, प्रलोभन अथवा जोर-जबरदस्ती के स्वेच्छा से दिया है। बयान सुनाकर सही मानकर अभियुक्त ने हस्ताक्षर किए।",
  },

  medical_letter: {
    headerDept: "कार्यालय थाना प्रबंधक / अनुसंधान अधिकारी",
    policeStation: "थाना शहर पानीपत",
    district: "जिला पानीपत",
    complaintNo: "128/2026",
    issueDate: "18.09.2026",
    dispatchNo: "1482/R",
    hospitalName: "सामान्य अस्पताल (Civil Hospital), पानीपत",
    medicalOfficerName: "वरिष्ठ चिकित्सा अधिकारी (SMO / Medical Officer In-charge)",
    docTitle: "प्रार्थना पत्र बाबत डाक्टरी मुलाहिजा / चिकित्सीय परीक्षण अभियुक्त",
    docSubTitle: "अंतर्गत धारा 51 भारतीय नागरिक सुरक्षा संहिता (BNSS), 2023 / धारा 53 व 54 दंड प्रक्रिया संहिता",
    noticeeName: "विकास शर्मा",
    noticeeFather: "रमेश चंद शर्मा",
    noticeeAge: "34 वर्ष",
    noticeeAddress: "मकान न0 412, सेक्टर 7, अर्बन एस्टेट, पानीपत",
    noticeeRole: "गिरफ्तार अभियुक्त",
    arrestDate: "18.09.2026",
    arrestTime: "11:30 प्रात:",
    escortConstable1: "EHC सुरजीत सिंह, No. 418/पानीपत",
    escortConstable2: "कांस. नरेश कुमार, No. 892/पानीपत",
    medicalChecklistInjuries: "अभियुक्त के शरीर पर कोई ताजा अथवा पुरानी जाहिरा चोट है या नहीं, इसका विस्तृत विवरण दिया जावे।",
    medicalChecklistFitness: "क्या अभियुक्त पुलिस हिरासत में रखे जाने तथा न्यायालय में पेशी हेतु शारीरिक व मानसिक रूप से स्वस्थ (Fit) है?",
    medicalChecklistSubstance: "क्या अभियुक्त किसी प्रकार के नशीले पदार्थ अथवा शराब के प्रभाव में है?",
    officerName: "सुरेंद्र पाल",
    officerRank: "उप-निरीक्षक (SI)",
    officerPno: "04291885",
    officerPhone: "9812034567",
    statutoryClarification: "निवेदन है कि उपरोक्त अभियोग में गिरफ्तार अभियुक्त विकास शर्मा को डाक्टरी मुलाहिजा हेतु बहमराह पुलिस कर्मचारी भेजा जा रहा है। कृपया अभियुक्त का नियमानुसार मेडिकल परीक्षण कर मुलाहिजा पर्चा (MLR) जारी करने की कृपा करें।",
  },

  peshi_remand: {
    headerDept: "हरियाणा पुलिस",
    policeStation: "थाना शहर पानीपत",
    district: "जिला पानीपत",
    complaintNo: "128/2026",
    issueDate: "21.09.2026",
    sectionsOfLaw: "धारा 318(4), 316(2), 351(2) BNS, 2023",
    courtName: "माननीय इलाका मजिस्ट्रेट / मुख्य न्यायिक दंडाधिकारी महोदय",
    courtDistrict: "पानीपत",
    docTitle: "प्रार्थना पत्र बाबत पेशी अभियुक्त व भेजने न्यायिक हिरासत (जेल)",
    docSubTitle: "अंतर्गत धारा 187 भारतीय नागरिक सुरक्षा संहिता (BNSS), 2023 / धारा 167 दंड प्रक्रिया संहिता",
    noticeeName: "विकास शर्मा",
    noticeeFather: "रमेश चंद शर्मा",
    noticeeAge: "34 वर्ष",
    noticeeAddress: "मकान न0 412, सेक्टर 7, अर्बन एस्टेट, पानीपत",
    noticeeRole: "अभियुक्त",
    remandDays: "3 दिन",
    remandFromDate: "18.09.2026",
    remandToDate: "21.09.2026",
    judicialRemandGrounds: `1. अभियुक्त का 3 दिन का पुलिस रिमांड माननीय न्यायालय द्वारा दिनांक 18.09.2026 को मंजूर किया गया था, जिसकी अवधि आज दिनांक 21.09.2026 को समाप्त हो रही है।
2. पुलिस रिमांड के दौरान अभियुक्त से ठगी के 1,20,000/- रुपये, लैपटॉप व फर्जी मुहरें बरामद कर ली गई हैं तथा फर्द निशानदेही मुकम्मल की जा चुकी है।
3. अब अभियुक्त से पुलिस हिरासत में अन्य कोई पूछताछ अथवा बरामदगी शेष नहीं है।
4. अभियुक्त का सिविल अस्पताल से पुनः डाक्टरी परीक्षण करवा लिया गया है और मेडिकल रिपोर्ट साथ संलग्न है।
5. अभियुक्त संज्ञेय व गंभीर अपराध का आरोपी है, यदि इसे जमानत पर रिहा किया गया तो यह फरार हो सकता है अथवा साक्षियों को प्रभावित कर सकता है।`,
    officerName: "सुरेंद्र पाल",
    officerRank: "उप-निरीक्षक (SI)",
    officerPno: "04291885",
    officerPhone: "9812034567",
    statutoryClarification: "अतः श्रीमान जी से सविनय प्रार्थना है कि अभियुक्त विकास शर्मा को 14 दिन की न्यायिक हिरासत (Judicial Custody - जिला कारागार पानीपत) में भेजने के आदेश जारी फरमाए जावें।",
  },
};

function ArrestDocsContent() {
  const { currentUser } = useAuth();
  const searchParams = useSearchParams();
  const firIdParam = searchParams.get("firId");

  const [firs, setFirs] = useState<FIRItem[]>([]);
  const [selectedFirId, setSelectedFirId] = useState<string>(firIdParam || "");
  const [selectedTemplate, setSelectedTemplate] = useState<ArrestDocTemplateType>("arrest_memo");
  const [formData, setFormData] = useState<ArrestDocsFormData>(DEFAULT_SAMPLE_DATA["arrest_memo"]);

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

  // Sync active FIR with current template
  useEffect(() => {
    const baseSample = DEFAULT_SAMPLE_DATA[selectedTemplate] || DEFAULT_SAMPLE_DATA.arrest_memo;
    if (!activeFir) {
      setFormData(baseSample);
      return;
    }

    const primaryAccused = activeFir.accusedList?.[0];

    setFormData({
      ...baseSample,
      policeStation: activeFir.policeStation || baseSample.policeStation,
      district: activeFir.district || baseSample.district,
      complaintNo: activeFir.firNumber || baseSample.complaintNo,
      issueDate: activeFir.firDate || formatDate(new Date()),
      incidentDate: (activeFir as any)?.incidentDate || activeFir.incidentDateFrom || baseSample.incidentDate,
      sectionsOfLaw: activeFir.actsAndSections || baseSample.sectionsOfLaw,
      complainantName: activeFir.complainantName || baseSample.complainantName,
      complainantAddress: (activeFir as any)?.complainantAddress || baseSample.complainantAddress,

      noticeeName: primaryAccused?.name || baseSample.noticeeName,
      noticeeFather: primaryAccused?.relativeName || primaryAccused?.fatherName || baseSample.noticeeFather,
      noticeeAge: (primaryAccused as any)?.age ? `${(primaryAccused as any).age} वर्ष` : baseSample.noticeeAge,
      noticeeAddress: primaryAccused?.address || baseSample.noticeeAddress,
      noticeePhone: primaryAccused?.phone || baseSample.noticeePhone,
      noticeeAlias1: primaryAccused?.alias || baseSample.noticeeAlias1,
      accusedGender: (primaryAccused as any)?.gender || baseSample.accusedGender,

      officerName: activeFir.assignedIoName || currentUser.name || baseSample.officerName,
      officerRank: activeFir.assignedIoRank || currentUser.rank || baseSample.officerRank,
      officerPno: activeFir.assignedIoBeltNumber || currentUser.pno || baseSample.officerPno,
      officerPhone: activeFir.assignedIoPhone || (currentUser as any)?.phone || baseSample.officerPhone,
      arrestPoliceStation: activeFir.policeStation || baseSample.policeStation,
      arrestDistrict: activeFir.district || baseSample.district,
      casePs: activeFir.policeStation || baseSample.policeStation,
    });
  }, [activeFir, selectedTemplate, currentUser]);

  const handleFieldChange = (field: keyof ArrestDocsFormData, val: any) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  const handleResetSample = () => {
    const base = DEFAULT_SAMPLE_DATA[selectedTemplate];
    if (base) {
      setFormData(base);
    }
  };

  // Dynamic Witnesses actions
  const handleAddWitnessRow = () => {
    const cur = formData.arrestWitnesses || [];
    const nextSr = String(cur.length + 1);
    const updated = [...cur, { id: `wit_${Date.now()}`, srNo: nextSr, name: "", address: "", signature: "" }];
    handleFieldChange("arrestWitnesses", updated);
  };

  const handleUpdateWitnessRow = (index: number, key: string, val: string) => {
    const cur = formData.arrestWitnesses || [];
    const updated = cur.map((w, idx) => (idx === index ? { ...w, [key]: val } : w));
    handleFieldChange("arrestWitnesses", updated);
  };

  const handleDeleteWitnessRow = (index: number) => {
    const cur = formData.arrestWitnesses || [];
    if (cur.length <= 1) return;
    const updated = cur.filter((_, idx) => idx !== index).map((w, idx) => ({ ...w, srNo: String(idx + 1) }));
    handleFieldChange("arrestWitnesses", updated);
  };

  // Dynamic Jama Talashi actions
  const handleAddJamaTalashiRow = () => {
    const cur = formData.jamaTalashiItems || [];
    const nextSr = `${cur.length + 1}.`;
    const updated = [...cur, { id: `jt_${Date.now()}`, srNo: nextSr, description: "", quantity: "1" }];
    handleFieldChange("jamaTalashiItems", updated);
  };

  const handleUpdateJamaTalashiRow = (index: number, key: string, val: string) => {
    const cur = formData.jamaTalashiItems || [];
    const updated = cur.map((item, idx) => (idx === index ? { ...item, [key]: val } : item));
    handleFieldChange("jamaTalashiItems", updated);
  };

  const handleDeleteJamaTalashiRow = (index: number) => {
    const cur = formData.jamaTalashiItems || [];
    if (cur.length <= 1) return;
    const updated = cur.filter((_, idx) => idx !== index).map((item, idx) => ({ ...item, srNo: `${idx + 1}.` }));
    handleFieldChange("jamaTalashiItems", updated);
  };

  // Dynamic Recovery items actions
  const handleAddRecoveryRow = () => {
    const cur = formData.recoveryItems || [];
    const nextSr = `${cur.length + 1}.`;
    const updated = [
      ...cur,
      { id: `rec_${Date.now()}`, srNo: nextSr, description: "", quantity: "1", sealDetails: "सील मोहर 'SP'" },
    ];
    handleFieldChange("recoveryItems", updated);
  };

  const handleUpdateRecoveryRow = (index: number, key: string, val: string) => {
    const cur = formData.recoveryItems || [];
    const updated = cur.map((item, idx) => (idx === index ? { ...item, [key]: val } : item));
    handleFieldChange("recoveryItems", updated);
  };

  const handleDeleteRecoveryRow = (index: number) => {
    const cur = formData.recoveryItems || [];
    if (cur.length <= 1) return;
    const updated = cur.filter((_, idx) => idx !== index).map((item, idx) => ({ ...item, srNo: `${idx + 1}.` }));
    handleFieldChange("recoveryItems", updated);
  };

  const handlePrint = () => {
    const title = `${selectedTemplate.toUpperCase()}_FIR_${formData.complaintNo || "Case"}`;
    printA4Element("arrest-printable-doc", title);
  };

  const handleDownload = () => {
    const title = `${selectedTemplate.toUpperCase()}_FIR_${formData.complaintNo || "Case"}`;
    const docTitle = TEMPLATE_CONFIG[selectedTemplate]?.label || "Arrest Document";
    downloadA4DocumentAsHtml("arrest-printable-doc", title, docTitle);
  };

  const handleCopy = () => {
    const el = document.getElementById("arrest-printable-doc");
    if (el) {
      navigator.clipboard.writeText(el.innerText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-700">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-black text-[#0b192c] tracking-tight">
              Arrest & Custody Documentation (गिरफ्तारी प्रपत्र)
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Statutory arrest memos, searches, grounds, remand applications & recovery proformas under BNSS 2023 & BSA 2023
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handlePrint}
            className="bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs gap-1.5 shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            Print A4 Document
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleDownload}
            className="border-slate-300 text-slate-700 font-bold text-xs gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            Download A4
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
              Select Arrest Document Proforma *
            </label>
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value as ArrestDocTemplateType)}
              className="w-full text-xs p-2.5 rounded-lg border border-rose-300 bg-rose-50/40 font-bold text-rose-950"
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
                    fontSize === sz ? "bg-white text-rose-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
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
                  voiceLang === "hi-IN" ? "bg-rose-900 text-white" : "text-slate-600"
                }`}
              >
                हिन्दी
              </button>
              <button
                type="button"
                onClick={() => setVoiceLang("en-IN")}
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  voiceLang === "en-IN" ? "bg-rose-900 text-white" : "text-slate-600"
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

      {/* Fully Editable Official Legal Document Canvas */}
      <div className="flex justify-center">
        <div
          id="arrest-printable-doc"
          className={`w-full max-w-4xl bg-white border border-slate-400 p-6 sm:p-12 transition-all text-slate-950 font-serif ${
            fontSize === "compact" ? "text-xs" : fontSize === "large" ? "text-base" : "text-sm"
          }`}
          style={{ minHeight: "1050px", lineHeight: "1.7" }}
        >
          {/* ================= 1. ARREST MEMO FORM 26.8(1) (4 PAGES OFFICIAL) ================= */}
          {selectedTemplate === "arrest_memo" && (
            <div className="space-y-10">
              {/* PAGE 1 */}
              <div className="border border-slate-400 p-6 sm:p-8 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-300">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    पृष्ठ 1 / 4: गिरफ्तारी/ न्यायालय में समर्पण फार्म - भाग-1 (फार्म संख्या 26.8(1))
                  </span>
                  <span className="font-mono text-xs font-bold text-slate-700">v3.0 dt 07.04.2025</span>
                </div>

                <div className="text-center space-y-0.5 py-1">
                  <h3 className="font-bold text-base sm:text-lg text-slate-950 underline underline-offset-4">
                    गिरफ्तारी/ न्यायालय में समर्पण फार्म
                  </h3>
                  <h4 className="font-bold text-sm text-slate-900">भाग-1 फार्म संख्या 26.8(1)</h4>
                  <p className="text-xs text-slate-700 font-medium">(प्रत्येक अभियुक्त के लिए अलग अलग फार्म)</p>
                </div>

                {/* Point 1 */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold">1. जिला:</span>
                    <input
                      type="text"
                      value={formData.district || ""}
                      onChange={(e) => handleFieldChange("district", e.target.value)}
                      className="font-bold text-slate-950 border-b border-dotted border-slate-700 px-1 outline-none min-w-[140px]"
                    />
                    <span className="font-bold">थाना:</span>
                    <input
                      type="text"
                      value={formData.policeStation || ""}
                      onChange={(e) => handleFieldChange("policeStation", e.target.value)}
                      className="font-bold text-slate-950 border-b border-dotted border-slate-700 px-1 outline-none min-w-[140px]"
                    />
                    <span className="font-bold">वर्ष:</span>
                    <input
                      type="text"
                      value={formData.arrestYear || "2026"}
                      onChange={(e) => handleFieldChange("arrestYear", e.target.value)}
                      className="font-bold text-slate-950 border-b border-dotted border-slate-700 px-1 outline-none w-20"
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-2 pl-4">
                    <span className="font-bold">FIR/ रोजनामचा रपट संख्या:</span>
                    <input
                      type="text"
                      value={formData.complaintNo || ""}
                      onChange={(e) => handleFieldChange("complaintNo", e.target.value)}
                      className="font-bold text-slate-950 border-b border-dotted border-slate-700 px-1 outline-none min-w-[180px]"
                    />
                    <span className="font-bold">दिनांक:</span>
                    <input
                      type="text"
                      value={formData.issueDate || ""}
                      onChange={(e) => handleFieldChange("issueDate", e.target.value)}
                      className="font-bold text-slate-950 border-b border-dotted border-slate-700 px-1 outline-none w-28"
                    />
                  </div>
                </div>

                {/* Point 2: Sections */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="font-bold">2. धारा/ धाराएं:</span>
                  <input
                    type="text"
                    value={formData.sectionsOfLaw || ""}
                    onChange={(e) => handleFieldChange("sectionsOfLaw", e.target.value)}
                    className="font-bold text-slate-950 border-b border-dotted border-slate-700 px-1 outline-none flex-1 min-w-[260px]"
                  />
                </div>

                {/* Point 3: Arrest/Surrender Date Time */}
                <div className="space-y-1 pt-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold">3. (i) गिरफ्तारी/ न्यायालय में समर्पण की तिथि:</span>
                    <input
                      type="text"
                      value={formData.arrestDate || ""}
                      onChange={(e) => handleFieldChange("arrestDate", e.target.value)}
                      className="font-bold text-slate-950 border-b border-dotted border-slate-700 px-1 outline-none w-32"
                    />
                    <span className="font-bold">समय:</span>
                    <input
                      type="text"
                      value={formData.arrestTime || ""}
                      onChange={(e) => handleFieldChange("arrestTime", e.target.value)}
                      className="font-bold text-slate-950 border-b border-dotted border-slate-700 px-1 outline-none w-28"
                    />
                    <span className="font-bold">रपट न0:</span>
                    <input
                      type="text"
                      value={formData.arrestGdNo || ""}
                      onChange={(e) => handleFieldChange("arrestGdNo", e.target.value)}
                      className="font-bold text-slate-950 border-b border-dotted border-slate-700 px-1 outline-none w-28"
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-2 pl-4">
                    <span className="font-bold">(ii) गिरफ्तारी/ समर्पण का स्थान:</span>
                    <input
                      type="text"
                      value={formData.arrestPlace || ""}
                      onChange={(e) => handleFieldChange("arrestPlace", e.target.value)}
                      className="font-bold text-slate-950 border-b border-dotted border-slate-700 px-1 outline-none flex-1 min-w-[240px]"
                    />
                  </div>
                </div>

                {/* Point 4: Personal Info */}
                <div className="space-y-1.5 pt-1 border-t border-slate-200">
                  <span className="font-bold block">4. गिरफ्तार/समर्पण किए गए व्यक्ति का विवरण:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-4">
                    <div className="flex items-center gap-2">
                      <span className="w-28 text-xs font-semibold">नाम:</span>
                      <input
                        type="text"
                        value={formData.noticeeName || ""}
                        onChange={(e) => handleFieldChange("noticeeName", e.target.value)}
                        className="font-bold border-b border-dotted border-slate-700 px-1 outline-none flex-1"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-28 text-xs font-semibold">उपनाम/उर्फ:</span>
                      <input
                        type="text"
                        value={formData.noticeeAlias1 || ""}
                        onChange={(e) => handleFieldChange("noticeeAlias1", e.target.value)}
                        className="border-b border-dotted border-slate-700 px-1 outline-none flex-1"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-28 text-xs font-semibold">पिता का नाम:</span>
                      <input
                        type="text"
                        value={formData.noticeeFather || ""}
                        onChange={(e) => handleFieldChange("noticeeFather", e.target.value)}
                        className="font-bold border-b border-dotted border-slate-700 px-1 outline-none flex-1"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-28 text-xs font-semibold">उम्र / लिंग:</span>
                      <input
                        type="text"
                        value={`${formData.noticeeAge || ""} / ${formData.accusedGender || ""}`}
                        onChange={(e) => handleFieldChange("noticeeAge", e.target.value)}
                        className="border-b border-dotted border-slate-700 px-1 outline-none flex-1"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-28 text-xs font-semibold">पहचान पत्र/आधार:</span>
                      <input
                        type="text"
                        value={formData.userIdentificationNo || formData.accusedAadhaar || ""}
                        onChange={(e) => handleFieldChange("userIdentificationNo", e.target.value)}
                        className="border-b border-dotted border-slate-700 px-1 outline-none flex-1"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-28 text-xs font-semibold">मोबाइल फोन:</span>
                      <input
                        type="text"
                        value={formData.noticeePhone || formData.mobileNo || ""}
                        onChange={(e) => handleFieldChange("noticeePhone", e.target.value)}
                        className="border-b border-dotted border-slate-700 px-1 outline-none flex-1"
                      />
                    </div>
                  </div>
                  <div className="flex items-start gap-2 pl-4 pt-1">
                    <span className="w-28 text-xs font-semibold shrink-0">स्थायी पता:</span>
                    <input
                      type="text"
                      value={formData.noticeeAddress || ""}
                      onChange={(e) => handleFieldChange("noticeeAddress", e.target.value)}
                      className="border-b border-dotted border-slate-700 px-1 outline-none flex-1"
                    />
                  </div>
                </div>

                {/* Point 5: Physical Condition */}
                <div className="pt-2">
                  <span className="font-bold block">5. गिरफ्तारी के समय शारीरिक दशा / जाहिरा चोट:</span>
                  <input
                    type="text"
                    value={formData.physicalConditionOrInjuries || "शारीरिक दशा सामान्य है। कोई जाहिरा चोट नहीं है।"}
                    onChange={(e) => handleFieldChange("physicalConditionOrInjuries", e.target.value)}
                    className="w-full border-b border-dotted border-slate-700 px-1 outline-none mt-1"
                  />
                </div>

                {/* Point 6: Witnesses */}
                <div className="pt-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold">6. गिरफ्तारी के स्वतंत्र गवाहान:</span>
                    <button
                      type="button"
                      onClick={handleAddWitnessRow}
                      className="no-print text-xs text-rose-700 hover:underline flex items-center gap-1 font-sans"
                    >
                      <Plus className="w-3.5 h-3.5" /> गवाह जोड़ें
                    </button>
                  </div>
                  <table className="w-full border-collapse border border-slate-400 text-xs">
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="border border-slate-400 p-1.5 w-10 text-center">क्र0</th>
                        <th className="border border-slate-400 p-1.5 text-left">गवाह का नाम व वल्दियत</th>
                        <th className="border border-slate-400 p-1.5 text-left">पूरा पता</th>
                        <th className="border border-slate-400 p-1.5 w-32 text-center">हस्ताक्षर/निशान अंगूठा</th>
                        <th className="no-print border border-slate-400 p-1.5 w-10 text-center"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {(formData.arrestWitnesses || []).map((w, idx) => (
                        <tr key={w.id || idx}>
                          <td className="border border-slate-400 p-1.5 text-center">{idx + 1}</td>
                          <td className="border border-slate-400 p-1.5">
                            <input
                              type="text"
                              value={w.name}
                              onChange={(e) => handleUpdateWitnessRow(idx, "name", e.target.value)}
                              className="w-full bg-transparent outline-none"
                              placeholder="नाम व पिता का नाम"
                            />
                          </td>
                          <td className="border border-slate-400 p-1.5">
                            <input
                              type="text"
                              value={w.address}
                              onChange={(e) => handleUpdateWitnessRow(idx, "address", e.target.value)}
                              className="w-full bg-transparent outline-none"
                              placeholder="पता"
                            />
                          </td>
                          <td className="border border-slate-400 p-1.5 text-center font-bold">
                            <input
                              type="text"
                              value={w.signature || w.name.split(" ")[0]}
                              onChange={(e) => handleUpdateWitnessRow(idx, "signature", e.target.value)}
                              className="w-full text-center bg-transparent outline-none font-bold"
                            />
                          </td>
                          <td className="no-print border border-slate-400 p-1.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteWitnessRow(idx)}
                              className="text-red-500 hover:text-red-700"
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

              {/* PAGE 2 */}
              <div className="border border-slate-400 p-6 sm:p-8 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-300">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    पृष्ठ 2 / 4: गिरफ्तारी सूचना, धारा 47 BNSS आधार व जामातलाशी
                  </span>
                  <span className="font-mono text-xs font-bold text-slate-700">फार्म संख्या 26.8(1) भाग-2</span>
                </div>

                {/* Relative Intimation */}
                <div className="space-y-1.5">
                  <span className="font-bold block underline">
                    7. रिश्तेदार/मित्र को सूचना (धारा 48 BNSS / धारा 50A Cr.P.C.):
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-4 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-32">सूचित व्यक्ति का नाम:</span>
                      <input
                        type="text"
                        value={formData.relativeName || ""}
                        onChange={(e) => handleFieldChange("relativeName", e.target.value)}
                        className="font-bold border-b border-dotted border-slate-700 px-1 outline-none flex-1"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-24">रिश्ता:</span>
                      <input
                        type="text"
                        value={formData.relativeRelation || ""}
                        onChange={(e) => handleFieldChange("relativeRelation", e.target.value)}
                        className="border-b border-dotted border-slate-700 px-1 outline-none flex-1"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-32">सूचना दिनांक व समय:</span>
                      <input
                        type="text"
                        value={`${formData.intimationDate || ""} ${formData.intimationTime || ""}`}
                        onChange={(e) => handleFieldChange("intimationDate", e.target.value)}
                        className="border-b border-dotted border-slate-700 px-1 outline-none flex-1"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-24">मोबाइल नंबर:</span>
                      <input
                        type="text"
                        value={formData.relativeMobile || ""}
                        onChange={(e) => handleFieldChange("relativeMobile", e.target.value)}
                        className="border-b border-dotted border-slate-700 px-1 outline-none flex-1"
                      />
                    </div>
                  </div>
                </div>

                {/* Grounds under Section 47 BNSS */}
                <div className="space-y-1.5 pt-2">
                  <span className="font-bold block underline">
                    8. गिरफ्तारी के आधार (धारा 47 BNSS / धारा 50 Cr.P.C.):
                  </span>
                  <textarea
                    rows={3}
                    value={formData.grounds47Other || formData.groundsBrief || ""}
                    onChange={(e) => handleFieldChange("grounds47Other", e.target.value)}
                    className="w-full text-xs p-2 border border-slate-400 outline-none leading-relaxed"
                  />
                </div>

                {/* Jama Talashi Table */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold underline">
                      9. जामातलाशी का विवरण (धारा 50 BNSS / धारा 51 Cr.P.C.):
                    </span>
                    <button
                      type="button"
                      onClick={handleAddJamaTalashiRow}
                      className="no-print text-xs text-rose-700 hover:underline flex items-center gap-1 font-sans"
                    >
                      <Plus className="w-3.5 h-3.5" /> सामान जोड़ें
                    </button>
                  </div>
                  <table className="w-full border-collapse border border-slate-400 text-xs">
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="border border-slate-400 p-1.5 w-10 text-center">क्र0</th>
                        <th className="border border-slate-400 p-1.5 text-left">सामान/नकदी का विवरण</th>
                        <th className="border border-slate-400 p-1.5 w-28 text-center">तादाद/रकम</th>
                        <th className="no-print border border-slate-400 p-1.5 w-10 text-center"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {(formData.jamaTalashiItems || []).map((it, idx) => (
                        <tr key={it.id || idx}>
                          <td className="border border-slate-400 p-1.5 text-center">{idx + 1}</td>
                          <td className="border border-slate-400 p-1.5">
                            <input
                              type="text"
                              value={it.description}
                              onChange={(e) => handleUpdateJamaTalashiRow(idx, "description", e.target.value)}
                              className="w-full bg-transparent outline-none"
                            />
                          </td>
                          <td className="border border-slate-400 p-1.5 text-center">
                            <input
                              type="text"
                              value={it.quantity}
                              onChange={(e) => handleUpdateJamaTalashiRow(idx, "quantity", e.target.value)}
                              className="w-full text-center bg-transparent outline-none"
                            />
                          </td>
                          <td className="no-print border border-slate-400 p-1.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteJamaTalashiRow(idx)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Signatures Row */}
                <div className="pt-8 flex justify-between items-end text-xs border-t border-slate-200">
                  <div className="space-y-1">
                    <p className="font-bold">हस्ताक्षर/अंगूठा निशानी अभियुक्त:</p>
                    <p className="border-b border-slate-400 w-44 pt-4"></p>
                    <p className="text-[11px] text-slate-600">({formData.noticeeName})</p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="font-bold">हस्ताक्षर अनुसंधान अधिकारी (IO):</p>
                    <p className="border-b border-slate-400 w-48 pt-4 ml-auto"></p>
                    <p className="font-bold">{formData.officerName}</p>
                    <p className="text-[11px] text-slate-600">
                      {formData.officerRank}, No. {formData.officerPno}
                    </p>
                    <p className="text-[11px] text-slate-600">{formData.policeStation}</p>
                  </div>
                </div>
              </div>

              {/* PAGE 3: PHYSICAL DESCRIPTION */}
              <div className="border border-slate-400 p-6 sm:p-8 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-300">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    पृष्ठ 3 / 4: अभियुक्त पहचान पत्र व शारीरिक हुलिया (18 लक्षण)
                  </span>
                  <span className="font-mono text-xs font-bold text-slate-700">धारा 54 BNSS</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="font-bold block text-slate-700">1. कद (Height):</span>
                    <input
                      type="text"
                      value={formData.heightCm || "173 सेमी"}
                      onChange={(e) => handleFieldChange("heightCm", e.target.value)}
                      className="w-full border-b border-dotted border-slate-700 outline-none"
                    />
                  </div>
                  <div>
                    <span className="font-bold block text-slate-700">2. रंग (Complexion):</span>
                    <input
                      type="text"
                      value={formData.colorBloodGroup || "गेहुंआ"}
                      onChange={(e) => handleFieldChange("colorBloodGroup", e.target.value)}
                      className="w-full border-b border-dotted border-slate-700 outline-none"
                    />
                  </div>
                  <div>
                    <span className="font-bold block text-slate-700">3. शारीरिक गठन (Build):</span>
                    <input
                      type="text"
                      value={formData.bodyBuild || "मध्यम"}
                      onChange={(e) => handleFieldChange("bodyBuild", e.target.value)}
                      className="w-full border-b border-dotted border-slate-700 outline-none"
                    />
                  </div>
                  <div>
                    <span className="font-bold block text-slate-700">4. आंखें (Eyes):</span>
                    <input
                      type="text"
                      value={formData.eyes || "काली"}
                      onChange={(e) => handleFieldChange("eyes", e.target.value)}
                      className="w-full border-b border-dotted border-slate-700 outline-none"
                    />
                  </div>
                  <div>
                    <span className="font-bold block text-slate-700">5. बाल (Hair):</span>
                    <input
                      type="text"
                      value={formData.hair || "काले छोटे"}
                      onChange={(e) => handleFieldChange("hair", e.target.value)}
                      className="w-full border-b border-dotted border-slate-700 outline-none"
                    />
                  </div>
                  <div>
                    <span className="font-bold block text-slate-700">6. दांत (Teeth):</span>
                    <input
                      type="text"
                      value={formData.teeth || "सामान्य"}
                      onChange={(e) => handleFieldChange("teeth", e.target.value)}
                      className="w-full border-b border-dotted border-slate-700 outline-none"
                    />
                  </div>
                  <div>
                    <span className="font-bold block text-slate-700">7. तिल का निशान (Mole):</span>
                    <input
                      type="text"
                      value={formData.moleMarks || "बाएं गाल पर काला तिल"}
                      onChange={(e) => handleFieldChange("moleMarks", e.target.value)}
                      className="w-full border-b border-dotted border-slate-700 outline-none"
                    />
                  </div>
                  <div>
                    <span className="font-bold block text-slate-700">8. कटे/घाव के निशान (Scar):</span>
                    <input
                      type="text"
                      value={formData.identMarks || "दाहिनी भौंह पर कट का निशान"}
                      onChange={(e) => handleFieldChange("identMarks", e.target.value)}
                      className="w-full border-b border-dotted border-slate-700 outline-none"
                    />
                  </div>
                  <div>
                    <span className="font-bold block text-slate-700">9. टैटू / गोदना (Tattoo):</span>
                    <input
                      type="text"
                      value={formData.tattooMarks || "दाहिने हाथ पर ॐ"}
                      onChange={(e) => handleFieldChange("tattooMarks", e.target.value)}
                      className="w-full border-b border-dotted border-slate-700 outline-none"
                    />
                  </div>
                  <div>
                    <span className="font-bold block text-slate-700">10. बोली/भाषा (Language):</span>
                    <input
                      type="text"
                      value={formData.languageDialect || "हिन्दी / हरियाणवी"}
                      onChange={(e) => handleFieldChange("languageDialect", e.target.value)}
                      className="w-full border-b border-dotted border-slate-700 outline-none"
                    />
                  </div>
                  <div>
                    <span className="font-bold block text-slate-700">11. पहनावा (Dress):</span>
                    <input
                      type="text"
                      value={formData.dress || "जींस व शर्ट"}
                      onChange={(e) => handleFieldChange("dress", e.target.value)}
                      className="w-full border-b border-dotted border-slate-700 outline-none"
                    />
                  </div>
                  <div>
                    <span className="font-bold block text-slate-700">12. फिंगरप्रिंट दर्ज:</span>
                    <input
                      type="text"
                      value={formData.fingerprintsTaken || "हाँ"}
                      onChange={(e) => handleFieldChange("fingerprintsTaken", e.target.value)}
                      className="w-full border-b border-dotted border-slate-700 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* PAGE 4: MHC RECORD */}
              <div className="border border-slate-400 p-6 sm:p-8 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-300">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    पृष्ठ 4 / 4: मालखाना मोहर्रिर (MHC) सुपुर्दगी व न्यायालयी कार्यवाही
                  </span>
                  <span className="font-mono text-xs font-bold text-slate-700">थाना मालखाना रिकॉर्ड</span>
                </div>

                <div className="space-y-3 text-xs leading-relaxed">
                  <div>
                    <span className="font-bold block">10. जामातलाशी का सामान मालखाना जमा करवाने का विवरण:</span>
                    <textarea
                      rows={2}
                      value={formData.articlesHandedOverToMhc || ""}
                      onChange={(e) => handleFieldChange("articlesHandedOverToMhc", e.target.value)}
                      className="w-full border border-slate-400 p-2 outline-none mt-1"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <span className="font-bold block text-slate-700">MHC का नाम व पद:</span>
                      <input
                        type="text"
                        value={formData.mhcSignRankPno || ""}
                        onChange={(e) => handleFieldChange("mhcSignRankPno", e.target.value)}
                        className="w-full border-b border-dotted border-slate-700 outline-none font-bold"
                      />
                    </div>
                    <div>
                      <span className="font-bold block text-slate-700">मालखाना जमा तिथि:</span>
                      <input
                        type="text"
                        value={formData.mhcDepositDate || ""}
                        onChange={(e) => handleFieldChange("mhcDepositDate", e.target.value)}
                        className="w-full border-b border-dotted border-slate-700 outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-8 flex justify-between items-end text-xs border-t border-slate-200">
                  <div className="space-y-1">
                    <p className="font-bold">हस्ताक्षर MHC (मालखाना मोहर्रिर):</p>
                    <p className="border-b border-slate-400 w-44 pt-4"></p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="font-bold">हस्ताक्षर अनुसंधान अधिकारी (IO):</p>
                    <p className="border-b border-slate-400 w-44 pt-4 ml-auto"></p>
                    <p className="font-bold">{formData.officerName}</p>
                    <p className="text-[11px] text-slate-600">{formData.officerRank}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= 2. FARD JAMATALASHI (धारा 50 BNSS) ================= */}
          {selectedTemplate === "fard_jamatalashi" && (
            <div className="space-y-6">
              {/* Header */}
              <div className="text-center space-y-1 pb-2 border-b border-slate-400">
                <h2 className="text-xl font-bold tracking-wide underline underline-offset-4">
                  {formData.docTitle || "फर्द जामातलाशी अभियुक्त"}
                </h2>
                <p className="text-xs font-semibold text-slate-700">
                  {formData.docSubTitle || "अंतर्गत धारा 50 भारतीय नागरिक सुरक्षा संहिता (BNSS), 2023"}
                </p>
              </div>

              {/* Station Row */}
              <div className="flex justify-between items-baseline text-xs font-bold gap-4">
                <div>
                  थाना: <span className="border-b border-dotted border-slate-700 px-2">{formData.policeStation}</span>
                </div>
                <div>
                  जिला: <span className="border-b border-dotted border-slate-700 px-2">{formData.district}</span>
                </div>
                <div>
                  मुकदमा सं0:{" "}
                  <span className="border-b border-dotted border-slate-700 px-2 font-black">{formData.complaintNo}</span>
                </div>
                <div>
                  दिनांक: <span className="border-b border-dotted border-slate-700 px-2">{formData.issueDate}</span>
                </div>
              </div>

              {/* Sections */}
              <div className="text-xs font-bold">
                धारा/धाराएं:{" "}
                <span className="border-b border-dotted border-slate-700 px-2">{formData.sectionsOfLaw}</span>
              </div>

              {/* Narrative */}
              <p className="text-xs leading-relaxed text-justify">
                आज दिनांक <strong>{formData.arrestDate || formData.issueDate}</strong> को वक्त{" "}
                <strong>{formData.arrestTime || "11:30 बजे"}</strong> पर स्थान{" "}
                <strong>{formData.arrestPlace || "मौका"}</strong> से उपरोक्त मुकदमा में गिरफ्तार अभियुक्त श्री{" "}
                <strong className="underline">{formData.noticeeName}</strong> सुपुत्र श्री{" "}
                <strong>{formData.noticeeFather}</strong>, उम्र लगभग <strong>{formData.noticeeAge}</strong>, साकिन{" "}
                <strong>{formData.noticeeAddress}</strong> की गिरफ्तारी के तुरंत बाद नियमानुसार व स्वतंत्र गवाहान की
                उपस्थिति में जिस्मानी जामातलाशी ली गई। जामातलाशी के दौरान अभियुक्त के कब्जे व पहने हुए कपड़ों से
                निम्नलिखित सामान, नकदी व व्यक्तिगत दस्तावेज बरामद हुए:
              </p>

              {/* Items Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold underline">बरामदशुदा जामातलाशी सामान की सूची:</span>
                  <button
                    type="button"
                    onClick={handleAddJamaTalashiRow}
                    className="no-print text-xs text-rose-700 hover:underline flex items-center gap-1 font-sans"
                  >
                    <Plus className="w-3.5 h-3.5" /> सामान जोड़ें
                  </button>
                </div>
                <table className="w-full border-collapse border border-slate-400 text-xs">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="border border-slate-400 p-2 w-12 text-center font-bold">क्र0 सं0</th>
                      <th className="border border-slate-400 p-2 text-left font-bold">विवरण सामान / नकदी / दस्तावेज</th>
                      <th className="border border-slate-400 p-2 w-28 text-center font-bold">तादाद / रकम</th>
                      <th className="border border-slate-400 p-2 w-36 text-left font-bold">पहचान / विशेष चिन्ह</th>
                      <th className="no-print border border-slate-400 p-1.5 w-10 text-center"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {((formData.jamaTalashiItems || []) as JamaTalashiItem[]).map((it, idx) => (
                      <tr key={it.id || idx}>
                        <td className="border border-slate-400 p-2 text-center">{idx + 1}</td>
                        <td className="border border-slate-400 p-2">
                          <input
                            type="text"
                            value={it.description}
                            onChange={(e) => handleUpdateJamaTalashiRow(idx, "description", e.target.value)}
                            className="w-full bg-transparent outline-none"
                          />
                        </td>
                        <td className="border border-slate-400 p-2 text-center">
                          <input
                            type="text"
                            value={it.quantity}
                            onChange={(e) => handleUpdateJamaTalashiRow(idx, "quantity", e.target.value)}
                            className="w-full text-center bg-transparent outline-none font-bold"
                          />
                        </td>
                        <td className="border border-slate-400 p-2">
                          <input
                            type="text"
                            value={it.identification || ""}
                            onChange={(e) => handleUpdateJamaTalashiRow(idx, "identification", e.target.value)}
                            className="w-full bg-transparent outline-none text-slate-700"
                            placeholder="पहचान चिन्ह"
                          />
                        </td>
                        <td className="no-print border border-slate-400 p-1.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteJamaTalashiRow(idx)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Receipt Clause */}
              <div className="text-xs p-3 border border-slate-300 bg-slate-50 space-y-1">
                <p className="font-bold">रसीद व सुपुर्दगी की पुष्टि (धारा 50(2) BNSS):</p>
                <p>
                  जामातलाशी में बरामद उपरोक्त संपूर्ण सामान को कब्जा पुलिस में लिया गया तथा फर्द जामातलाशी की एक प्रति
                  अभियुक्त को निःशुल्क प्रदान कर दी गई है। अभियुक्त व उपस्थित दोनों स्वतंत्र गवाहान ने फर्द को सही मानकर
                  अपने-अपने हस्ताक्षर किए।
                </p>
              </div>

              {/* Signatures */}
              <div className="pt-8 grid grid-cols-3 gap-4 text-xs">
                <div>
                  <p className="font-bold">गवाह 1:</p>
                  <p className="border-b border-slate-400 pt-4"></p>
                  <input
                    type="text"
                    value={formData.witnessSign1 || ""}
                    onChange={(e) => handleFieldChange("witnessSign1", e.target.value)}
                    className="w-full text-[11px] outline-none pt-1"
                  />
                </div>
                <div className="text-center">
                  <p className="font-bold">हस्ताक्षर/अंगूठा अभियुक्त:</p>
                  <p className="border-b border-slate-400 pt-4"></p>
                  <p className="text-[11px] text-slate-600 pt-1">({formData.noticeeName})</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">अनुसंधान अधिकारी (IO):</p>
                  <p className="border-b border-slate-400 pt-4"></p>
                  <p className="font-bold pt-1">{formData.officerName}</p>
                  <p className="text-[11px] text-slate-600">
                    {formData.officerRank}, No. {formData.officerPno}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ================= 3. GROUNDS OF ARREST (धारा 47 BNSS) ================= */}
          {selectedTemplate === "grounds_of_arrest" && (
            <div className="space-y-6">
              <div className="text-center space-y-1 pb-2 border-b border-slate-400">
                <h2 className="text-xl font-bold tracking-wide underline underline-offset-4">
                  {formData.docTitle || "गिरफ्तारी के आधार की लिखित सूचना (Grounds of Arrest)"}
                </h2>
                <p className="text-xs font-semibold text-slate-700">
                  अंतर्गत धारा 47 भारतीय नागरिक सुरक्षा संहिता (BNSS), 2023 एवं भारतीय संविधान का अनुच्छेद 22(1)
                </p>
              </div>

              {/* Case Details */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-bold border-b border-slate-200 pb-2">
                <div>
                  थाना: <span className="font-normal">{formData.policeStation}</span>
                </div>
                <div>
                  जिला: <span className="font-normal">{formData.district}</span>
                </div>
                <div>
                  मुकदमा सं0: <span className="font-black">{formData.complaintNo}</span>
                </div>
                <div>
                  दिनांक: <span className="font-normal">{formData.issueDate}</span>
                </div>
              </div>

              <div className="text-xs leading-relaxed space-y-3">
                <div className="border border-slate-300 p-3 bg-slate-50">
                  <p className="font-bold">प्रति (To),</p>
                  <p>
                    अभियुक्त श्री <strong>{formData.noticeeName}</strong> सुपुत्र श्री <strong>{formData.noticeeFather}</strong>
                  </p>
                  <p>साकिन: {formData.noticeeAddress}</p>
                </div>

                <p className="text-justify">
                  आपको एतद्द्वारा धारा 47 BNSS, 2023 के प्रावधानों के अंतर्गत लिखित रूप में सूचित किया जाता है कि आपको
                  उपरोक्त अभियोग संख्या <strong>{formData.complaintNo}</strong> थाना <strong>{formData.policeStation}</strong> में
                  दिनांक <strong>{formData.arrestDate || formData.issueDate}</strong> को वक्त{" "}
                  <strong>{formData.arrestTime || "11:30 बजे"}</strong> पर निम्नलिखित संज्ञेय अपराध एवं ठोस आधारों पर
                  गिरफ्तार किया गया है:
                </p>

                <div className="space-y-2 border-l-2 border-slate-700 pl-4">
                  <div>
                    <span className="font-bold">1. अभियोग की धाराएं:</span>
                    <input
                      type="text"
                      value={formData.grounds47Sections || formData.sectionsOfLaw || ""}
                      onChange={(e) => handleFieldChange("grounds47Sections", e.target.value)}
                      className="w-full font-bold border-b border-dotted border-slate-700 outline-none"
                    />
                  </div>
                  <div>
                    <span className="font-bold">2. अपराध में आपकी विशिष्ट भूमिका (Specific Role):</span>
                    <textarea
                      rows={2}
                      value={formData.grounds47Role || ""}
                      onChange={(e) => handleFieldChange("grounds47Role", e.target.value)}
                      className="w-full border border-slate-300 p-1.5 outline-none"
                    />
                  </div>
                  <div>
                    <span className="font-bold">3. आपके विरुद्ध प्राथमिक साक्ष्य (Prima Facie Evidence):</span>
                    <textarea
                      rows={2}
                      value={formData.grounds47Evidence || ""}
                      onChange={(e) => handleFieldChange("grounds47Evidence", e.target.value)}
                      className="w-full border border-slate-300 p-1.5 outline-none"
                    />
                  </div>
                  <div>
                    <span className="font-bold">4. गिरफ्तारी की अपरिहार्य आवश्यकता व वैधानिक आधार:</span>
                    <textarea
                      rows={3}
                      value={formData.grounds47Other || ""}
                      onChange={(e) => handleFieldChange("grounds47Other", e.target.value)}
                      className="w-full border border-slate-300 p-1.5 outline-none"
                    />
                  </div>
                </div>

                {/* Statutory Rights */}
                <div className="border border-slate-400 p-3 space-y-1.5">
                  <p className="font-bold underline">गिरफ्तार व्यक्ति के वैधानिक अधिकार (Statutory Legal Rights):</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>
                      <strong>धारा 38 BNSS:</strong> आपको पूछताछ के दौरान अपनी पसंद के अधिवक्ता से मिलने व परामर्श लेने का
                      अधिकार है।
                    </li>
                    <li>
                      <strong>निःशुल्क विधिक सहायता:</strong> यदि आप अधिवक्ता रखने में असमर्थ हैं, तो जिला विधिक सेवा
                      प्राधिकरण (DLSA) द्वारा सरकारी खर्च पर अधिवक्ता उपलब्ध करवाया जाएगा।
                    </li>
                    <li>
                      <strong>धारा 48 BNSS:</strong> आपकी गिरफ्तारी की सूचना आपके परिवारजन / मित्र को तत्काल दी गई है।
                    </li>
                    <li>
                      <strong>धारा 51 BNSS:</strong> आपका सक्षम सरकारी चिकित्सक से डाक्टरी परीक्षण (MLR) करवाया जाएगा।
                    </li>
                  </ul>
                </div>

                {/* Accused Receipt Acknowledgment */}
                <div className="border border-slate-300 p-3 bg-slate-50 space-y-2">
                  <p className="font-bold">अभियुक्त की पावती (Receipt & Acknowledgment):</p>
                  <p className="italic text-[11px]">
                    "मुझे गिरफ्तारी के उपरोक्त सभी कारण व आधार मेरी मातृभाषा (सरल हिन्दी) में पढ़कर सुना व समझा दिए गए
                    हैं तथा इस सूचना-पत्र की एक मूल प्रति मुझे प्राप्त हो गई है।"
                  </p>
                  <div className="flex justify-between items-end pt-3">
                    <div>
                      <p className="border-b border-slate-400 w-44"></p>
                      <p className="pt-1 font-bold">हस्ताक्षर/निशान अंगूठा अभियुक्त</p>
                    </div>
                    <div className="text-right">
                      <p>
                        दिनांक: <strong>{formData.issueDate}</strong> समय: <strong>{formData.arrestTime || "11:45 बजे"}</strong>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* IO Sign */}
              <div className="pt-4 text-right text-xs">
                <p className="font-bold">हस्ताक्षर अनुसंधान अधिकारी (IO):</p>
                <p className="border-b border-slate-400 w-48 ml-auto pt-4"></p>
                <p className="font-bold pt-1">{formData.officerName}</p>
                <p className="text-[11px] text-slate-600">
                  {formData.officerRank}, No. {formData.officerPno}
                </p>
                <p className="text-[11px] text-slate-600">{formData.policeStation}</p>
              </div>
            </div>
          )}

          {/* ================= 4. PEHCHAN PATR FORMAT (धारा 54 BNSS) ================= */}
          {selectedTemplate === "pehchan_patr" && (
            <div className="space-y-6">
              <div className="text-center space-y-1 pb-2 border-b border-slate-400">
                <h2 className="text-xl font-bold tracking-wide underline underline-offset-4">
                  {formData.docTitle || "अभियुक्त पहचान पत्र व शारीरिक हुलिया प्रपत्र"}
                </h2>
                <p className="text-xs font-semibold text-slate-700">
                  Accused Identification & Descriptive Roll (अंतर्गत धारा 54 BNSS / धारा 9 भारतीय साक्ष्य अधिनियम)
                </p>
              </div>

              {/* Accused Photo Box + Basic Info */}
              <div className="flex flex-col sm:flex-row gap-4 border border-slate-400 p-4">
                <div className="w-32 h-40 border-2 border-dashed border-slate-400 flex flex-col items-center justify-center text-center p-2 shrink-0 bg-slate-50 text-[11px] text-slate-500">
                  <User className="w-8 h-8 text-slate-400 mb-1" />
                  <span>अभियुक्त का नवीनतम फोटो चस्पा करें</span>
                </div>

                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="font-bold">थाना:</span> {formData.policeStation}
                  </div>
                  <div>
                    <span className="font-bold">जिला:</span> {formData.district}
                  </div>
                  <div>
                    <span className="font-bold">FIR सं0:</span> {formData.complaintNo}
                  </div>
                  <div>
                    <span className="font-bold">दिनांक:</span> {formData.issueDate}
                  </div>
                  <div className="sm:col-span-2">
                    <span className="font-bold">नाम अभियुक्त:</span>{" "}
                    <input
                      type="text"
                      value={formData.noticeeName || ""}
                      onChange={(e) => handleFieldChange("noticeeName", e.target.value)}
                      className="font-bold border-b border-dotted border-slate-700 outline-none w-48 px-1"
                    />{" "}
                    उर्फ:{" "}
                    <input
                      type="text"
                      value={formData.noticeeAlias1 || ""}
                      onChange={(e) => handleFieldChange("noticeeAlias1", e.target.value)}
                      className="border-b border-dotted border-slate-700 outline-none w-32 px-1"
                    />
                  </div>
                  <div>
                    <span className="font-bold">पिता का नाम:</span> {formData.noticeeFather}
                  </div>
                  <div>
                    <span className="font-bold">उम्र व लिंग:</span> {formData.noticeeAge} / {formData.accusedGender}
                  </div>
                  <div className="sm:col-span-2">
                    <span className="font-bold">स्थायी पता:</span> {formData.noticeeAddress}
                  </div>
                </div>
              </div>

              {/* 18 Features Table */}
              <div className="space-y-1">
                <span className="text-xs font-bold underline">18 विशिष्ट शारीरिक पहचान लक्षण (Descriptive Roll):</span>
                <table className="w-full border-collapse border border-slate-400 text-xs">
                  <tbody>
                    <tr>
                      <td className="border border-slate-400 p-2 font-bold bg-slate-50 w-44">1. कद (Height):</td>
                      <td className="border border-slate-400 p-2">{formData.heightCm || "173 सेमी"}</td>
                      <td className="border border-slate-400 p-2 font-bold bg-slate-50 w-44">2. रंग (Complexion):</td>
                      <td className="border border-slate-400 p-2">{formData.colorBloodGroup || "गेहुंआ"}</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-400 p-2 font-bold bg-slate-50">3. शारीरिक गठन:</td>
                      <td className="border border-slate-400 p-2">{formData.bodyBuild || "मध्यम"}</td>
                      <td className="border border-slate-400 p-2 font-bold bg-slate-50">4. आंखें (Eyes):</td>
                      <td className="border border-slate-400 p-2">{formData.eyes || "काली"}</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-400 p-2 font-bold bg-slate-50">5. बाल (Hair):</td>
                      <td className="border border-slate-400 p-2">{formData.hair || "काले छोटे"}</td>
                      <td className="border border-slate-400 p-2 font-bold bg-slate-50">6. दांत (Teeth):</td>
                      <td className="border border-slate-400 p-2">{formData.teeth || "सामान्य"}</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-400 p-2 font-bold bg-slate-50">7. कटे/घाव के निशान:</td>
                      <td className="border border-slate-400 p-2" colSpan={3}>
                        <input
                          type="text"
                          value={formData.identMarks || ""}
                          onChange={(e) => handleFieldChange("identMarks", e.target.value)}
                          className="w-full bg-transparent outline-none"
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-slate-400 p-2 font-bold bg-slate-50">8. तिल का निशान (Mole):</td>
                      <td className="border border-slate-400 p-2" colSpan={3}>
                        <input
                          type="text"
                          value={formData.moleMarks || ""}
                          onChange={(e) => handleFieldChange("moleMarks", e.target.value)}
                          className="w-full bg-transparent outline-none"
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-slate-400 p-2 font-bold bg-slate-50">9. टैटू / गोदना:</td>
                      <td className="border border-slate-400 p-2" colSpan={3}>
                        <input
                          type="text"
                          value={formData.tattooMarks || ""}
                          onChange={(e) => handleFieldChange("tattooMarks", e.target.value)}
                          className="w-full bg-transparent outline-none"
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-slate-400 p-2 font-bold bg-slate-50">10. बोली/भाषा:</td>
                      <td className="border border-slate-400 p-2">{formData.languageDialect || "हिन्दी"}</td>
                      <td className="border border-slate-400 p-2 font-bold bg-slate-50">11. पहनावा (Dress):</td>
                      <td className="border border-slate-400 p-2">{formData.dress || "सामान्य"}</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-400 p-2 font-bold bg-slate-50">12. शिक्षा व व्यवसाय:</td>
                      <td className="border border-slate-400 p-2">{formData.educationalQualification} / {formData.profession}</td>
                      <td className="border border-slate-400 p-2 font-bold bg-slate-50">13. फिंगरप्रिंट दर्ज:</td>
                      <td className="border border-slate-400 p-2">{formData.fingerprintsTaken || "हाँ"}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Signatures */}
              <div className="pt-8 flex justify-between items-end text-xs">
                <div>
                  <p className="font-bold">पहचानकर्ता गवाह:</p>
                  <p className="border-b border-slate-400 w-44 pt-4"></p>
                  <p className="text-[11px] text-slate-600 pt-1">1. {formData.witnessSign1?.split(",")[0]}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">सत्यापनकर्ता अनुसंधान अधिकारी (IO):</p>
                  <p className="border-b border-slate-400 w-48 ml-auto pt-4"></p>
                  <p className="font-bold pt-1">{formData.officerName}</p>
                  <p className="text-[11px] text-slate-600">
                    {formData.officerRank}, No. {formData.officerPno}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ================= 5. FARD BARAMADGI (धारा 23(2) BSA / 27 IEA) ================= */}
          {selectedTemplate === "fard_baramadgi" && (
            <div className="space-y-6">
              <div className="text-center space-y-1 pb-2 border-b border-slate-400">
                <h2 className="text-xl font-bold tracking-wide underline underline-offset-4">
                  {formData.docTitle || "फर्द बरामदगी / जब्ती सूची (Seizure Memo)"}
                </h2>
                <p className="text-xs font-semibold text-slate-700">
                  {formData.docSubTitle || "अंतर्गत धारा 23(2) भारतीय साक्ष्य अधिनियम, 2023 / धारा 27 भारतीय साक्ष्य अधिनियम"}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-bold border-b border-slate-200 pb-2">
                <div>थाना: {formData.policeStation}</div>
                <div>जिला: {formData.district}</div>
                <div>मुकदमा सं0: {formData.complaintNo}</div>
                <div>दिनांक: {formData.issueDate}</div>
              </div>

              <p className="text-xs leading-relaxed text-justify">
                आज दिनांक <strong>{formData.issueDate}</strong> को मुकदमा उपरोक्त में गिरफ्तार अभियुक्त श्री{" "}
                <strong className="underline">{formData.noticeeName}</strong> सुपुत्र श्री{" "}
                <strong>{formData.noticeeFather}</strong>, साकिन <strong>{formData.noticeeAddress}</strong> द्वारा पुलिस
                हिरासत में दिए गए इकबालिया बयान (फर्द इंकिशाफ) के आधार पर अभियुक्त की स्वयं की निशानदेही पर स्थान{" "}
                <strong>{formData.recoveryPlace}</strong> से उपस्थित स्वतंत्र पंच गवाहान के समक्ष निम्नलिखित
                सामान/मशरूका/नकदी बरामद की गई:
              </p>

              {/* Recovery Items Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold underline">बरामदशुदा माल का विस्तृत विवरण (Inventory):</span>
                  <button
                    type="button"
                    onClick={handleAddRecoveryRow}
                    className="no-print text-xs text-rose-700 hover:underline flex items-center gap-1 font-sans"
                  >
                    <Plus className="w-3.5 h-3.5" /> बरामदगी जोड़ें
                  </button>
                </div>
                <table className="w-full border-collapse border border-slate-400 text-xs">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="border border-slate-400 p-2 w-12 text-center font-bold">क्र0 सं0</th>
                      <th className="border border-slate-400 p-2 text-left font-bold">बरामदशुदा सामान/नकदी का विवरण</th>
                      <th className="border border-slate-400 p-2 w-28 text-center font-bold">तादाद / संख्या</th>
                      <th className="border border-slate-400 p-2 w-44 text-left font-bold">मोहर व सीलबंद पार्सल</th>
                      <th className="no-print border border-slate-400 p-1.5 w-10 text-center"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {(formData.recoveryItems || []).map((it, idx) => (
                      <tr key={it.id || idx}>
                        <td className="border border-slate-400 p-2 text-center">{idx + 1}</td>
                        <td className="border border-slate-400 p-2">
                          <input
                            type="text"
                            value={it.description}
                            onChange={(e) => handleUpdateRecoveryRow(idx, "description", e.target.value)}
                            className="w-full bg-transparent outline-none"
                          />
                        </td>
                        <td className="border border-slate-400 p-2 text-center">
                          <input
                            type="text"
                            value={it.quantity}
                            onChange={(e) => handleUpdateRecoveryRow(idx, "quantity", e.target.value)}
                            className="w-full text-center bg-transparent outline-none font-bold"
                          />
                        </td>
                        <td className="border border-slate-400 p-2">
                          <input
                            type="text"
                            value={it.sealDetails}
                            onChange={(e) => handleUpdateRecoveryRow(idx, "sealDetails", e.target.value)}
                            className="w-full bg-transparent outline-none"
                          />
                        </td>
                        <td className="no-print border border-slate-400 p-1.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteRecoveryRow(idx)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Sealing Note */}
              <div className="text-xs p-3 border border-slate-300 bg-slate-50 space-y-1">
                <p className="font-bold">सीलबंद कार्यवाही व नमूना मोहर:</p>
                <p className="text-justify">{formData.statutoryClarification}</p>
              </div>

              {/* Signatures */}
              <div className="pt-8 grid grid-cols-3 gap-4 text-xs">
                <div>
                  <p className="font-bold">पंच गवाह 1:</p>
                  <p className="border-b border-slate-400 pt-4"></p>
                  <p className="text-[11px] text-slate-600 pt-1">{formData.witnessSign1?.split(",")[0]}</p>
                </div>
                <div className="text-center">
                  <p className="font-bold">हस्ताक्षर/अंगूठा अभियुक्त:</p>
                  <p className="border-b border-slate-400 pt-4"></p>
                  <p className="text-[11px] text-slate-600 pt-1">({formData.noticeeName})</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">अनुसंधान अधिकारी (IO):</p>
                  <p className="border-b border-slate-400 pt-4"></p>
                  <p className="font-bold pt-1">{formData.officerName}</p>
                  <p className="text-[11px] text-slate-600">{formData.officerRank}</p>
                </div>
              </div>
            </div>
          )}

          {/* ================= 6. REMAND APPLICATION (धारा 187 BNSS) ================= */}
          {selectedTemplate === "remand_application" && (
            <div className="space-y-6">
              <div className="text-center space-y-1 pb-2 border-b border-slate-400">
                <h3 className="text-sm font-bold text-slate-700">न्यायालय (In the Court of):</h3>
                <h2 className="text-lg font-bold">
                  {formData.courtName || "माननीय इलाका मजिस्ट्रेट महोदय"}, {formData.district}
                </h2>
                <p className="text-xs font-semibold text-slate-600">
                  {formData.docTitle} (अंतर्गत धारा 187 BNSS, 2023)
                </p>
              </div>

              {/* Case Title */}
              <div className="border border-slate-300 p-3 bg-slate-50 text-xs space-y-1 font-bold">
                <div className="flex justify-between">
                  <span>हरियाणा राज्य (State)</span>
                  <span>बनाम (Vs)</span>
                  <span>अभियुक्त: {formData.noticeeName}</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-700 font-normal pt-1">
                  <span>मुकदमा सं0: {formData.complaintNo}</span>
                  <span>दिनांक: {formData.issueDate}</span>
                  <span>धारा: {formData.sectionsOfLaw}</span>
                  <span>थाना: {formData.policeStation}</span>
                </div>
              </div>

              {/* Subject */}
              <div className="text-xs font-bold">
                विषय: अभियुक्त <span className="underline">{formData.noticeeName}</span> का{" "}
                <input
                  type="text"
                  value={formData.remandDays || "3 दिन"}
                  onChange={(e) => handleFieldChange("remandDays", e.target.value)}
                  className="font-black border-b border-dotted border-slate-700 outline-none w-16 text-center"
                />{" "}
                का पुलिस हिरासत रिमांड (Police Custody Remand) प्रदान करने बारे।
              </div>

              {/* Remand Reasons Body */}
              <div className="text-xs leading-relaxed space-y-3 text-justify">
                <p><strong>श्रीमान जी,</strong></p>
                <p>
                  निवेदन है कि उपरोक्त अभियोग में अभियुक्त {formData.noticeeName} को दिनांक{" "}
                  {formData.arrestDate || formData.issueDate} को वक्त {formData.arrestTime || "11:30 बजे"} पर गिरफ्तार
                  किया गया है। अभियुक्त से निम्नलिखित महत्वपूर्ण अनुसंधान व साक्ष्यों के संकलन हेतु पुलिस हिरासत रिमांड
                  की सख्त आवश्यकता है:
                </p>

                <div className="border border-slate-400 p-3 bg-white space-y-1">
                  <span className="font-bold underline block mb-1">पुलिस रिमांड के ठोस आधार (Grounds for Police Remand):</span>
                  <textarea
                    rows={6}
                    value={formData.remandReasons || ""}
                    onChange={(e) => handleFieldChange("remandReasons", e.target.value)}
                    className="w-full text-xs outline-none leading-relaxed border-0 resize-y p-0"
                  />
                </div>

                <p className="font-bold pt-1">
                  अतः श्रीमान जी से सविनय प्रार्थना है कि न्यायहित में एवं निष्पक्ष विवेचना हेतु अभियुक्त का{" "}
                  {formData.remandDays || "3 दिन"} का पुलिस हिरासत रिमांड मंजूर फरमाने की कृपा की जावे।
                </p>
              </div>

              {/* Officer Sign */}
              <div className="pt-8 text-right text-xs">
                <p className="font-bold">प्रार्थी / अनुसंधान अधिकारी (IO):</p>
                <p className="border-b border-slate-400 w-48 ml-auto pt-4"></p>
                <p className="font-bold pt-1">{formData.officerName}</p>
                <p className="text-[11px] text-slate-600">
                  {formData.officerRank}, No. {formData.officerPno}
                </p>
                <p className="text-[11px] text-slate-600">{formData.policeStation}</p>
              </div>
            </div>
          )}

          {/* ================= 7. FARD NISHANDEHI ================= */}
          {selectedTemplate === "fard_nishandehi" && (
            <div className="space-y-6">
              <div className="text-center space-y-1 pb-2 border-b border-slate-400">
                <h2 className="text-xl font-bold tracking-wide underline underline-offset-4">
                  {formData.docTitle || "फर्द निशानदेही मौका/स्थान (Pointing Out Memo)"}
                </h2>
                <p className="text-xs font-semibold text-slate-700">Demarcation & Spot Verification Proforma</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-bold border-b border-slate-200 pb-2">
                <div>थाना: {formData.policeStation}</div>
                <div>जिला: {formData.district}</div>
                <div>मुकदमा सं0: {formData.complaintNo}</div>
                <div>दिनांक: {formData.issueDate}</div>
              </div>

              <div className="text-xs leading-relaxed space-y-3 text-justify">
                <p>
                  आज दिनांक <strong>{formData.issueDate}</strong> को मुकदमा उपरोक्त में अभियुक्त श्री{" "}
                  <strong>{formData.noticeeName}</strong> सुपुत्र श्री <strong>{formData.noticeeFather}</strong>, साकिन{" "}
                  <strong>{formData.noticeeAddress}</strong> पुलिस पार्टी व उपस्थित स्वतंत्र गवाहान को साथ लेकर अपने
                  बताए अनुसार स्थान पर पहुंचा और उंगली से इशारा करके निशानदेही की।
                </p>

                <div className="border border-slate-400 p-3 space-y-2">
                  <span className="font-bold block">निशानदेही किए गए स्थान का विवरण:</span>
                  <input
                    type="text"
                    value={formData.pointingOutPlace || ""}
                    onChange={(e) => handleFieldChange("pointingOutPlace", e.target.value)}
                    className="w-full border-b border-dotted border-slate-700 outline-none font-bold"
                  />

                  <div className="pt-2">
                    <span className="font-bold block mb-1">चौहद्दी (Boundaries):</span>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <strong>पूर्व (East):</strong>{" "}
                        <input
                          type="text"
                          value={formData.pointingOutBoundaries?.east || ""}
                          onChange={(e) =>
                            handleFieldChange("pointingOutBoundaries", {
                              ...formData.pointingOutBoundaries,
                              east: e.target.value,
                            })
                          }
                          className="border-b border-dotted border-slate-700 outline-none w-44 px-1"
                        />
                      </div>
                      <div>
                        <strong>पश्चिम (West):</strong>{" "}
                        <input
                          type="text"
                          value={formData.pointingOutBoundaries?.west || ""}
                          onChange={(e) =>
                            handleFieldChange("pointingOutBoundaries", {
                              ...formData.pointingOutBoundaries,
                              west: e.target.value,
                            })
                          }
                          className="border-b border-dotted border-slate-700 outline-none w-44 px-1"
                        />
                      </div>
                      <div>
                        <strong>उत्तर (North):</strong>{" "}
                        <input
                          type="text"
                          value={formData.pointingOutBoundaries?.north || ""}
                          onChange={(e) =>
                            handleFieldChange("pointingOutBoundaries", {
                              ...formData.pointingOutBoundaries,
                              north: e.target.value,
                            })
                          }
                          className="border-b border-dotted border-slate-700 outline-none w-44 px-1"
                        />
                      </div>
                      <div>
                        <strong>दक्षिण (South):</strong>{" "}
                        <input
                          type="text"
                          value={formData.pointingOutBoundaries?.south || ""}
                          onChange={(e) =>
                            handleFieldChange("pointingOutBoundaries", {
                              ...formData.pointingOutBoundaries,
                              south: e.target.value,
                            })
                          }
                          className="border-b border-dotted border-slate-700 outline-none w-44 px-1"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <p>{formData.statutoryClarification}</p>
              </div>

              {/* Signatures */}
              <div className="pt-8 grid grid-cols-3 gap-4 text-xs">
                <div>
                  <p className="font-bold">गवाह 1:</p>
                  <p className="border-b border-slate-400 pt-4"></p>
                  <p className="text-[11px] text-slate-600 pt-1">{formData.witnessSign1?.split(",")[0]}</p>
                </div>
                <div className="text-center">
                  <p className="font-bold">हस्ताक्षर/अंगूठा अभियुक्त:</p>
                  <p className="border-b border-slate-400 pt-4"></p>
                  <p className="text-[11px] text-slate-600 pt-1">({formData.noticeeName})</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">अनुसंधान अधिकारी (IO):</p>
                  <p className="border-b border-slate-400 pt-4"></p>
                  <p className="font-bold pt-1">{formData.officerName}</p>
                  <p className="text-[11px] text-slate-600">{formData.officerRank}</p>
                </div>
              </div>
            </div>
          )}

          {/* ================= 8. FARD INKESHAF (DISCLOSURE STATEMENT) ================= */}
          {selectedTemplate === "fard_inkeshaf" && (
            <div className="space-y-6">
              <div className="text-center space-y-1 pb-2 border-b border-slate-400">
                <h2 className="text-xl font-bold tracking-wide underline underline-offset-4">
                  {formData.docTitle || "फर्द इंकिशाफ / इकबालिया बयान अभियुक्त"}
                </h2>
                <p className="text-xs font-semibold text-slate-700">
                  अंतर्गत धारा 23(2) भारतीय साक्ष्य अधिनियम, 2023 / धारा 27 भारतीय साक्ष्य अधिनियम
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-bold border-b border-slate-200 pb-2">
                <div>थाना: {formData.policeStation}</div>
                <div>जिला: {formData.district}</div>
                <div>मुकदमा सं0: {formData.complaintNo}</div>
                <div>दिनांक: {formData.issueDate}</div>
              </div>

              <div className="text-xs leading-relaxed space-y-4 text-justify">
                <p>
                  आज दिनांक <strong>{formData.issueDate}</strong> को मुकदमा उपरोक्त में पुलिस हिरासत में मौजूद अभियुक्त श्री{" "}
                  <strong>{formData.noticeeName}</strong> सुपुत्र श्री <strong>{formData.noticeeFather}</strong>, उम्र{" "}
                  <strong>{formData.noticeeAge}</strong>, साकिन <strong>{formData.noticeeAddress}</strong> ने उपस्थित
                  स्वतंत्र गवाहान के समक्ष बिना किसी डर, दबाव या प्रलोभन के स्वेच्छा से निम्नलिखित इकबालिया बयान दिया:
                </p>

                <div className="border border-slate-400 p-4 bg-slate-50 italic space-y-2">
                  <p className="font-bold not-italic underline">बयान अभियुक्त (In Disclosure Narrative):</p>
                  <textarea
                    rows={5}
                    value={formData.disclosureStatement || ""}
                    onChange={(e) => handleFieldChange("disclosureStatement", e.target.value)}
                    className="w-full text-xs outline-none leading-relaxed border-0 bg-transparent resize-y p-0 not-italic"
                  />
                </div>

                <div className="border border-slate-300 p-3 bg-white text-[11px] space-y-1">
                  <p className="font-bold">सत्यापन नोट (Verification):</p>
                  <p>{formData.statutoryClarification}</p>
                </div>
              </div>

              {/* Signatures */}
              <div className="pt-8 grid grid-cols-3 gap-4 text-xs">
                <div>
                  <p className="font-bold">गवाह 1:</p>
                  <p className="border-b border-slate-400 pt-4"></p>
                  <p className="text-[11px] text-slate-600 pt-1">{formData.witnessSign1?.split(",")[0]}</p>
                </div>
                <div className="text-center">
                  <p className="font-bold">हस्ताक्षर/अंगूठा अभियुक्त:</p>
                  <p className="border-b border-slate-400 pt-4"></p>
                  <p className="text-[11px] text-slate-600 pt-1">({formData.noticeeName})</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">अनुसंधान अधिकारी (IO):</p>
                  <p className="border-b border-slate-400 pt-4"></p>
                  <p className="font-bold pt-1">{formData.officerName}</p>
                  <p className="text-[11px] text-slate-600">{formData.officerRank}</p>
                </div>
              </div>
            </div>
          )}

          {/* ================= 9. MEDICAL LETTER (धारा 51 BNSS) ================= */}
          {selectedTemplate === "medical_letter" && (
            <div className="space-y-6">
              <div className="text-center space-y-1 pb-2 border-b border-slate-400">
                <h2 className="text-xl font-bold tracking-wide underline underline-offset-4">
                  {formData.docTitle || "प्रार्थना पत्र बाबत डाक्टरी मुलाहिजा / चिकित्सीय परीक्षण अभियुक्त"}
                </h2>
                <p className="text-xs font-semibold text-slate-700">
                  अंतर्गत धारा 51 भारतीय नागरिक सुरक्षा संहिता (BNSS), 2023 / धारा 53-54 Cr.P.C.
                </p>
              </div>

              <div className="flex justify-between items-baseline text-xs font-bold border-b border-slate-200 pb-2">
                <div>क्रमांक: {formData.dispatchNo || "1482/R"}</div>
                <div>थाना: {formData.policeStation}</div>
                <div>दिनांक: {formData.issueDate}</div>
              </div>

              {/* Addressed To */}
              <div className="text-xs space-y-1">
                <p className="font-bold">सेवा में (To),</p>
                <p className="pl-4 font-bold">{formData.medicalOfficerName || "वरिष्ठ चिकित्सा अधिकारी महोदय"}</p>
                <p className="pl-4">{formData.hospitalName || "सामान्य अस्पताल (Civil Hospital)"}</p>
              </div>

              {/* Subject */}
              <div className="text-xs font-bold border-y border-slate-200 py-1.5">
                विषय: गिरफ्तार अभियुक्त श्री <span className="underline">{formData.noticeeName}</span> का डाक्टरी
                मुलाहिजा (Medical Examination) करवाने बाबत।
              </div>

              {/* Content */}
              <div className="text-xs leading-relaxed space-y-3 text-justify">
                <p><strong>श्रीमान जी,</strong></p>
                <p>
                  निवेदन है कि उपरोक्त अभियोग सं0 <strong>{formData.complaintNo}</strong> धारा{" "}
                  <strong>{formData.sectionsOfLaw}</strong> थाना <strong>{formData.policeStation}</strong> में गिरफ्तार
                  अभियुक्त श्री <strong>{formData.noticeeName}</strong> सुपुत्र श्री <strong>{formData.noticeeFather}</strong>, उम्र{" "}
                  <strong>{formData.noticeeAge}</strong>, साकिन <strong>{formData.noticeeAddress}</strong> को बहमराह
                  पुलिस कर्मचारी डाक्टरी मुलाहिजा हेतु आपके समक्ष प्रस्तुत किया जा रहा है।
                </p>

                <div className="border border-slate-400 p-3 space-y-2">
                  <span className="font-bold underline block">चिकित्सीय परीक्षण बिंदु (Medical Examination Requisition):</span>
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex items-start gap-2">
                      <span className="font-bold">1.</span>
                      <span>{formData.medicalChecklistInjuries}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-bold">2.</span>
                      <span>{formData.medicalChecklistFitness}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-bold">3.</span>
                      <span>{formData.medicalChecklistSubstance}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-[11px] pt-1">
                  <div>
                    <span className="font-bold">लाने वाले पुलिस कर्मचारी:</span>
                    <p>1. {formData.escortConstable1}</p>
                    <p>2. {formData.escortConstable2}</p>
                  </div>
                  <div>
                    <span className="font-bold">गिरफ्तारी समय व स्थान:</span>
                    <p>{formData.arrestDate || formData.issueDate} {formData.arrestTime || "11:30 बजे"}</p>
                    <p>{formData.arrestPlace}</p>
                  </div>
                </div>

                <p className="pt-2 font-bold">
                  कृपया अभियुक्त का नियमानुसार मेडिकल परीक्षण कर विस्तृत चोट रिपोर्ट (MLR) जारी करने की कृपा करें।
                </p>
              </div>

              {/* IO Sign */}
              <div className="pt-8 text-right text-xs">
                <p className="font-bold">भवदीय / अनुसंधान अधिकारी (IO):</p>
                <p className="border-b border-slate-400 w-48 ml-auto pt-4"></p>
                <p className="font-bold pt-1">{formData.officerName}</p>
                <p className="text-[11px] text-slate-600">
                  {formData.officerRank}, No. {formData.officerPno}
                </p>
                <p className="text-[11px] text-slate-600">{formData.policeStation}</p>
              </div>
            </div>
          )}

          {/* ================= 10. PESHI REMAND / JUDICIAL CUSTODY ================= */}
          {selectedTemplate === "peshi_remand" && (
            <div className="space-y-6">
              <div className="text-center space-y-1 pb-2 border-b border-slate-400">
                <h3 className="text-sm font-bold text-slate-700">न्यायालय (In the Court of):</h3>
                <h2 className="text-lg font-bold">
                  {formData.courtName || "माननीय इलाका मजिस्ट्रेट महोदय"}, {formData.district}
                </h2>
                <p className="text-xs font-semibold text-slate-600">
                  {formData.docTitle} (अंतर्गत धारा 187 BNSS, 2023)
                </p>
              </div>

              {/* Case Details */}
              <div className="border border-slate-300 p-3 bg-slate-50 text-xs space-y-1 font-bold">
                <div className="flex justify-between">
                  <span>हरियाणा राज्य (State)</span>
                  <span>बनाम (Vs)</span>
                  <span>अभियुक्त: {formData.noticeeName}</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-700 font-normal pt-1">
                  <span>मुकदमा सं0: {formData.complaintNo}</span>
                  <span>दिनांक: {formData.issueDate}</span>
                  <span>धारा: {formData.sectionsOfLaw}</span>
                  <span>थाना: {formData.policeStation}</span>
                </div>
              </div>

              {/* Subject */}
              <div className="text-xs font-bold">
                विषय: अभियुक्त <span className="underline">{formData.noticeeName}</span> को पुलिस रिमांड समाप्ति उपरांत
                पेश अदालत कर न्यायिक हिरासत (जिला कारागार) भेजने बारे।
              </div>

              {/* Body */}
              <div className="text-xs leading-relaxed space-y-3 text-justify">
                <p><strong>श्रीमान जी,</strong></p>

                <div className="border border-slate-400 p-3 bg-white space-y-1">
                  <span className="font-bold underline block mb-1">
                    न्यायिक हिरासत (Judicial Remand) हेतु आधार व विवरण:
                  </span>
                  <textarea
                    rows={6}
                    value={formData.judicialRemandGrounds || ""}
                    onChange={(e) => handleFieldChange("judicialRemandGrounds", e.target.value)}
                    className="w-full text-xs outline-none leading-relaxed border-0 resize-y p-0"
                  />
                </div>

                <p className="font-bold pt-1">
                  अतः श्रीमान जी से सविनय प्रार्थना है कि अभियुक्त विकास शर्मा को 14 दिन की न्यायिक हिरासत (Judicial
                  Custody - जिला जेल) में भेजने के आदेश जारी फरमाए जावें।
                </p>
              </div>

              {/* Officer Sign */}
              <div className="pt-8 text-right text-xs">
                <p className="font-bold">प्रार्थी / अनुसंधान अधिकारी (IO):</p>
                <p className="border-b border-slate-400 w-48 ml-auto pt-4"></p>
                <p className="font-bold pt-1">{formData.officerName}</p>
                <p className="text-[11px] text-slate-600">
                  {formData.officerRank}, No. {formData.officerPno}
                </p>
                <p className="text-[11px] text-slate-600">{formData.policeStation}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ArrestDocsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-sm font-bold text-slate-500">
          Loading Arrest Documentation Studio...
        </div>
      }
    >
      <ArrestDocsContent />
    </Suspense>
  );
}
