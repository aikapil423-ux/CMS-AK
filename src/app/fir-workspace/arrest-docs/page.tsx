"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Printer,
  Copy,
  Check,
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
  FileText,
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

export interface DynamicPointItem {
  id: string;
  text: string;
}

export interface CustomClauseItem {
  id: string;
  heading: string;
  text: string;
}

export interface TraitItem {
  id: string;
  label: string;
  value: string;
}

export interface BoundaryItem {
  id: string;
  direction: string;
  detail: string;
}

export interface EscortOfficerItem {
  id: string;
  name: string;
  beltNo: string;
  thana: string;
}

export type ArrestDocsFormData = Omit<Partial<NoticeFormData>, "arrestWitnesses" | "jamaTalashiItems"> & {
  // Generic Editable Headings & Narrative
  courtName?: string;
  courtDistrict?: string;
  subjectTitle?: string;
  introNarrative?: string;
  conclusionNarrative?: string;
  receiptClauseText?: string;
  verificationClauseText?: string;
  disclosureNarrative?: string;
  remandDays?: string;
  remandFromDate?: string;
  remandToDate?: string;
  recoveryPlace?: string;
  recoveryDisclosureDate?: string;
  pointingOutPlace?: string;
  hospitalName?: string;
  medicalOfficerName?: string;

  // Dynamic Lists with Add & Delete
  groundsPoints?: DynamicPointItem[];
  rightsPoints?: DynamicPointItem[];
  remandPoints?: DynamicPointItem[];
  medicalPoints?: DynamicPointItem[];
  peshiPoints?: DynamicPointItem[];
  boundariesList?: BoundaryItem[];
  escortOfficers?: EscortOfficerItem[];
  traitsList?: TraitItem[];
  customClauses?: CustomClauseItem[];
  recoveryItems?: RecoveryItem[];
  arrestWitnesses?: ArrestWitnessItem[];
  jamaTalashiItems?: JamaTalashiItem[];
};

const TEMPLATE_CONFIG: Record<
  ArrestDocTemplateType,
  { label: string; badge: string; subTitle: string; description: string; icon: any; color: string }
> = {
  arrest_memo: {
    label: "1. गिरफ्तारी/ न्यायालय समर्पण फार्म संख्या 26.8(1) (4 पृष्ठ)",
    badge: "फार्म 26.8(1)",
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
    description: "Formal identification roll recording physical traits, scars, moles, build, photo box & identity witnesses",
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
    noticeeName: "विकास शर्मा",
    noticeeFather: "रमेश चंद शर्मा",
    noticeeAlias1: "विक्की",
    noticeeNationality: "भारतीय",
    noticeeAge: "34 वर्ष",
    accusedGender: "पुरुष",
    userIdentificationNo: "8492-3810-4921",
    noticeePhone: "9812044551",
    noticeeAddress: "मकान न0 412, सेक्टर 7, अर्बन एस्टेट, पानीपत",
    physicalConditionOrInjuries: "शारीरिक दशा सामान्य है। कोई ताजा जाहिरा चोट नहीं है। (सामान्य डाक्टरी मुलाहिजा करवाया गया)",

    relativeName: "अमित शर्मा",
    relativeRelation: "भाई",
    intimationDate: "18.09.2026",
    intimationTime: "11:45 प्रात:",
    relativeMobile: "9812099881",
    grounds47Other: "परिवादी के साथ 4,50,000/- रुपये की धोखाधड़ी करने एवं जान से मारने की धमकी देने में मुख्य भूमिका। आरोपी द्वारा गवाहों को धमकाने एवं फरार होने की संभावना को रोकने हेतु।",

    arrestWitnesses: [
      { id: "wit_1", name: "बलजीत सिंह सुपुत्र हरनाम सिंह", address: "वार्ड न0 5, पानीपत", signature: "बलजीत सिंह" },
      { id: "wit_2", name: "रमेश लाल सुपुत्र वेद प्रकाश", address: "न्यू बस स्टैंड, पानीपत", signature: "रमेश लाल" },
    ],

    jamaTalashiItems: [
      { id: "jt_1", srNo: "1.", description: "नकदी रुपये 1,450/- (एक हजार चार सौ पचास रुपये)", quantity: "1,450/-" },
      { id: "jt_2", srNo: "2.", description: "एक मोबाइल फोन सैमसंग (नीला रंग, चालू हालत)", quantity: "1" },
      { id: "jt_3", srNo: "3.", description: "पर्स चमड़ा भूरा रंग मय आधार कार्ड व ड्राइविंग लाइसेंस", quantity: "1" },
    ],

    traitsList: [
      { id: "tr_1", label: "1. कद (Height)", value: "173 सेमी (5 फीट 8 इंच)" },
      { id: "tr_2", label: "2. रंग (Complexion)", value: "गेहुंआ" },
      { id: "tr_3", label: "3. शारीरिक गठन (Build)", value: "मध्यम" },
      { id: "tr_4", label: "4. आंखें (Eyes)", value: "काली" },
      { id: "tr_5", label: "5. बाल (Hair)", value: "काले छोटे" },
      { id: "tr_6", label: "6. दांत (Teeth)", value: "सामान्य" },
      { id: "tr_7", label: "7. तिल का निशान (Mole)", value: "बाएं गाल पर काला तिल" },
      { id: "tr_8", label: "8. कटे/घाव के निशान (Scar)", value: "दाहिनी भौंह पर पुराना 1 इंच कट का निशान" },
      { id: "tr_9", label: "9. टैटू / गोदना (Tattoo)", value: "दाहिने हाथ की कलाई पर 'ॐ' गुदा हुआ" },
      { id: "tr_10", label: "10. बोली/भाषा (Language)", value: "हिन्दी / हरियाणवी" },
      { id: "tr_11", label: "11. पहनावा (Dress)", value: "नीली जींस व सफेद शर्ट" },
      { id: "tr_12", label: "12. फिंगरप्रिंट दर्ज", value: "हाँ (सभी 10 उंगलियां)" },
    ],

    articlesHandedOverToMhc: "उपरोक्त जामातलाशी का सम्पूर्ण सामान बमुताबिक फर्द थाना मालखाना मोहर्रिर (MHC) को सुरक्षित रखवाया गया।",
    mhcSignRankPno: "MHC HC रमेश कुमार, PNO-23114, थाना शहर पानीपत",
    mhcDepositDate: "18.09.2026",

    officerName: "सुरेंद्र पाल",
    officerRank: "उप-निरीक्षक (SI)",
    officerPno: "04291885",
    officerPhone: "9812034567",
    customClauses: [],
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
    introNarrative: `आज दिनांक 18.09.2026 को वक्त 11:30 प्रात: पर स्थान रेलवे रोड चौक, पानीपत से उपरोक्त मुकदमा में गिरफ्तार अभियुक्त श्री विकास शर्मा सुपुत्र श्री रमेश चंद शर्मा, उम्र लगभग 34 वर्ष, साकिन मकान न0 412, सेक्टर 7, अर्बन एस्टेट, पानीपत की गिरफ्तारी के तुरंत बाद नियमानुसार व स्वतंत्र गवाहान की उपस्थिति में जिस्मानी जामातलाशी ली गई। जामातलाशी के दौरान अभियुक्त के कब्जे व पहने हुए कपड़ों से निम्नलिखित सामान, नकदी व व्यक्तिगत दस्तावेज बरामद हुए:`,
    jamaTalashiItems: [
      { id: "jt_1", srNo: "1.", description: "नकदी भारतीय मुद्रा कुल 1,450/- रुपये (500 के दो नोट, 200 के दो नोट, 50 का एक नोट)", quantity: "1,450/-", identification: "नोट नंबर अंकित" },
      { id: "jt_2", srNo: "2.", description: "एक मोबाइल फोन मार्क सैमसंग गैलेक्सी A14, रंग नीला, मय वोडाफोन सिम कार्ड (चालू हालत)", quantity: "1", identification: "IMEI: 358491029481920" },
      { id: "jt_3", srNo: "3.", description: "पर्स चमड़ा भूरा रंग जिसमें आधार कार्ड (8492-3810-4921) व ड्राइविंग लाइसेंस व फोटो", quantity: "1", identification: "व्यक्तिगत दस्तावेज" },
      { id: "jt_4", srNo: "4.", description: "कलाई घड़ी फास्टट्रैक स्टील बेल्ट चालू हालत", quantity: "1", identification: "धातु डायल" },
    ],
    receiptClauseText: "जामातलाशी में बरामद उपरोक्त संपूर्ण सामान को कब्जा पुलिस में लिया गया तथा फर्द जामातलाशी की एक प्रति अभियुक्त को निःशुल्क प्रदान कर दी गई है। अभियुक्त व उपस्थित दोनों स्वतंत्र गवाहान ने फर्द को सही मानकर अपने-अपने हस्ताक्षर किए।",
    arrestWitnesses: [
      { id: "wit_1", name: "बलजीत सिंह सुपुत्र हरनाम सिंह", address: "वार्ड न0 5, पानीपत" },
      { id: "wit_2", name: "रमेश लाल सुपुत्र वेद प्रकाश", address: "न्यू बस स्टैंड, पानीपत" },
    ],
    officerName: "सुरेंद्र पाल",
    officerRank: "उप-निरीक्षक (SI)",
    officerPno: "04291885",
    officerPhone: "9812034567",
    customClauses: [],
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
    noticeeAddress: "मकान न0 412, सेक्टर 7, अर्बन एस्टेट, पानीपत",
    introNarrative: `आपको एतद्द्वारा धारा 47 BNSS, 2023 के प्रावधानों के अंतर्गत लिखित रूप में सूचित किया जाता है कि आपको उपरोक्त अभियोग संख्या 128/2026 थाना शहर पानीपत में दिनांक 18.09.2026 को वक्त 11:30 बजे पर निम्नलिखित संज्ञेय अपराध एवं ठोस आधारों पर गिरफ्तार किया गया है:`,
    groundsPoints: [
      { id: "gp_1", text: "अपराध का स्वरूप: धारा 318(4), 316(2), 351(2) BNS, 2023 (संज्ञेय एवं गैर-जमानती अपराध)।" },
      { id: "gp_2", text: "आपकी भूमिका: परिवादी से धोखाधड़ी कर 4,50,000/- रुपये ऐंठने एवं अमानत में खयानत करने तथा जान से मारने की धमकी देने के ठोस साक्ष्य पाए गए हैं।" },
      { id: "gp_3", text: "प्राथमिक साक्ष्य: बैंक खाता स्टेटमेंट, शिकायतकर्ता का बयान, मोबाइल कॉल व व्हाट्सएप चैट के तकनीकी साक्ष्य।" },
      { id: "gp_4", text: "गिरफ्तारी की आवश्यकता: अग्रिम अपराध को रोकने, मामले की निष्पक्ष विवेचना, राशि की बरामदगी तथा साक्षियों को प्रभावित करने से रोकने हेतु।" },
    ],
    rightsPoints: [
      { id: "rp_1", text: "धारा 38 BNSS: आपको पूछताछ के दौरान अपनी पसंद के अधिवक्ता से मिलने व परामर्श लेने का अधिकार है।" },
      { id: "rp_2", text: "निःशुल्क विधिक सहायता: यदि आप अधिवक्ता रखने में असमर्थ हैं, तो जिला विधिक सेवा प्राधिकरण (DLSA) द्वारा निःशुल्क अधिवक्ता उपलब्ध करवाया जाएगा।" },
      { id: "rp_3", text: "धारा 48 BNSS: आपकी गिरफ्तारी की सूचना आपके परिवारजन / मित्र को तत्काल दे दी गई है।" },
      { id: "rp_4", text: "धारा 51 BNSS: आपका सक्षम सरकारी अस्पताल से नियमानुसार डाक्टरी परीक्षण (MLR) करवाया जाएगा।" },
    ],
    receiptClauseText: "मुझे गिरफ्तारी के उपरोक्त सभी कारण व आधार मेरी मातृभाषा (सरल हिन्दी) में पढ़कर सुना व समझा दिए गए हैं तथा इस सूचना-पत्र की एक मूल प्रति मुझे प्राप्त हो गई है।",
    arrestWitnesses: [
      { id: "wit_1", name: "अमित शर्मा (भाई)", address: "मकान न0 412, सेक्टर 7, पानीपत" },
    ],
    officerName: "सुरेंद्र पाल",
    officerRank: "उप-निरीक्षक (SI)",
    officerPno: "04291885",
    officerPhone: "9812034567",
    customClauses: [],
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
    noticeeAge: "34 वर्ष",
    accusedGender: "पुरुष",
    noticeeAddress: "मकान न0 412, सेक्टर 7, अर्बन एस्टेट, पानीपत",
    traitsList: [
      { id: "tr_1", label: "1. कद (Height)", value: "173 सेमी (5 फीट 8 इंच)" },
      { id: "tr_2", label: "2. रंग (Complexion)", value: "गेहुंआ" },
      { id: "tr_3", label: "3. शारीरिक गठन (Build)", value: "मध्यम, गठीला" },
      { id: "tr_4", label: "4. आंखें (Eyes)", value: "काली" },
      { id: "tr_5", label: "5. बाल (Hair)", value: "काले छोटे" },
      { id: "tr_6", label: "6. दांत (Teeth)", value: "सामान्य" },
      { id: "tr_7", label: "7. तिल का निशान (Mole)", value: "बाएं गाल पर काला तिल" },
      { id: "tr_8", label: "8. कटे/घाव के निशान (Scar)", value: "दाहिनी भौंह के ऊपर 1 इंच पुराना कट का निशान" },
      { id: "tr_9", label: "9. टैटू / गोदना (Tattoo)", value: "दाहिने हाथ की कलाई पर 'ॐ' गुदा हुआ" },
      { id: "tr_10", label: "10. बोली/भाषा (Language)", value: "हिन्दी / हरियाणवी बोली" },
      { id: "tr_11", label: "11. पहनावा (Dress)", value: "नीली जींस, सफेद शर्ट व काले जूते" },
      { id: "tr_12", label: "12. विशेष आदतें (Habits)", value: "चाय व धूम्रपान का आदी" },
      { id: "tr_13", label: "13. शिक्षा व व्यवसाय", value: "स्नातक (B.Com) / दुकानदार" },
      { id: "tr_14", label: "14. फिंगरप्रिंट दर्ज", value: "हाँ (सभी 10 उंगलियां)" },
    ],
    arrestWitnesses: [
      { id: "wit_1", name: "बलजीत सिंह सुपुत्र हरनाम सिंह", address: "वार्ड न0 5, पानीपत" },
      { id: "wit_2", name: "रमेश लाल सुपुत्र वेद प्रकाश", address: "न्यू बस स्टैंड, पानीपत" },
    ],
    officerName: "सुरेंद्र पाल",
    officerRank: "उप-निरीक्षक (SI)",
    officerPno: "04291885",
    officerPhone: "9812034567",
    customClauses: [],
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
    recoveryPlace: "अभियुक्त के रिहायशी मकान न0 412, सेक्टर 7, अर्बन एस्टेट, पानीपत के शयनकक्ष की अलमारी से",
    introNarrative: `आज दिनांक 18.09.2026 को मुकदमा उपरोक्त में गिरफ्तार अभियुक्त श्री विकास शर्मा सुपुत्र श्री रमेश चंद शर्मा, साकिन मकान न0 412, सेक्टर 7, अर्बन एस्टेट, पानीपत द्वारा पुलिस हिरासत में दिए गए इकबालिया बयान (फर्द इंकिशाफ) के आधार पर अभियुक्त की स्वयं की निशानदेही पर अभियुक्त के रिहायशी मकान के शयनकक्ष से उपस्थित स्वतंत्र पंच गवाहान के समक्ष निम्नलिखित सामान/मशरूका/नकदी बरामद की गई:`,
    recoveryItems: [
      { id: "rec_1", srNo: "1.", description: "ठगी की राशि में से नकदी कुल 1,20,000/- रुपये (500-500 के कुल 240 नोट)", quantity: "1,20,000/-", sealDetails: "सफेद कपड़े में सील मोहर 'SP'" },
      { id: "rec_2", srNo: "2.", description: "एक लैपटॉप मार्क डेल (काले रंग का) जिसमें फर्जी एग्रीमेंट व बिलिंग रिकॉर्ड संग्रहित है", quantity: "1", sealDetails: "कपड़े में सील मोहर 'SP'" },
      { id: "rec_3", srNo: "3.", description: "फर्जी लेटरपैड व 2 मोहरें (स्टैम्प) जो धोखाधड़ी में इस्तेमाल की गई", quantity: "2 स्टैम्प", sealDetails: "डिब्बे में सील मोहर 'SP'" },
    ],
    receiptClauseText: "उपरोक्त बरामदशुदा माल को स्वतंत्र पंच गवाहान की उपस्थिति में सफेद कपड़े व डिब्बे में रखकर सील मोहर 'SP' से सीलबंद किया गया। नमूना मोहर अलग से कपड़े के टुकड़े पर सुरक्षित रखा गया। गवाहान व अभियुक्त ने फर्द को पढ़कर सही मानकर हस्ताक्षर किए।",
    arrestWitnesses: [
      { id: "wit_1", name: "बलजीत सिंह सुपुत्र हरनाम सिंह", address: "वार्ड न0 5, पानीपत (स्वतंत्र पंच गवाह)" },
      { id: "wit_2", name: "रमेश लाल सुपुत्र वेद प्रकाश", address: "न्यू बस स्टैंड, पानीपत (स्वतंत्र पंच गवाह)" },
    ],
    officerName: "सुरेंद्र पाल",
    officerRank: "उप-निरीक्षक (SI)",
    officerPno: "04291885",
    officerPhone: "9812034567",
    customClauses: [],
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
    remandDays: "3 दिन",
    subjectTitle: "अभियुक्त विकास शर्मा का 3 दिन का पुलिस हिरासत रिमांड (Police Custody Remand) प्रदान करने बारे।",
    introNarrative: `निवेदन है कि उपरोक्त अभियोग में अभियुक्त विकास शर्मा को दिनांक 18.09.2026 को वक्त 11:30 बजे पर गिरफ्तार किया गया है। अभियुक्त से निम्नलिखित महत्वपूर्ण अनुसंधान व साक्ष्यों के संकलन हेतु पुलिस हिरासत रिमांड की सख्त आवश्यकता है:`,
    remandPoints: [
      { id: "rem_1", text: "अभियोग में कुल ठगी की राशि 4,50,000/- रुपये में से शेष राशि 3,30,000/- रुपये की बरामदगी की जानी शेष है।" },
      { id: "rem_2", text: "अभियुक्त से वारदात में प्रयुक्त अन्य इलेक्ट्रॉनिक उपकरण, फर्जी दस्तावेज एवं बैंक पासबुक बरामद करवाने हैं।" },
      { id: "rem_3", text: "अभियुक्त के अन्य सह-आरोपियों के नाम-पते व छिपने के गुप्त ठिकानों का पता लगाकर उन्हें गिरफ्तार करना है।" },
      { id: "rem_4", text: "अभियुक्त को घटनास्थल, बैंक व संबंधित ठिकानों पर ले जाकर फर्द निशानदेही तस्दीक करवानी है।" },
      { id: "rem_5", text: "अभियुक्त से गहन पूछताछ कर धोखाधड़ी के पूरे नेटवर्क का पर्दाफाश करना न्यायहित में आवश्यक है।" },
    ],
    conclusionNarrative: "अतः श्रीमान जी से सविनय प्रार्थना है कि न्यायहित में एवं निष्पक्ष विवेचना हेतु अभियुक्त विकास शर्मा का 3 दिन का पुलिस हिरासत रिमांड (दिनांक 18.09.2026 से 21.09.2026 तक) मंजूर फरमाने की कृपा की जावे।",
    officerName: "सुरेंद्र पाल",
    officerRank: "उप-निरीक्षक (SI)",
    officerPno: "04291885",
    officerPhone: "9812034567",
    customClauses: [],
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
    pointingOutPlace: "मकान न0 412, सेक्टर 7, अर्बन एस्टेट, पानीपत (जहां अभियुक्त ने ठगी की राशि व लैपटॉप छिपाया था)",
    introNarrative: `आज दिनांक 18.09.2026 को मुकदमा उपरोक्त में अभियुक्त श्री विकास शर्मा सुपुत्र श्री रमेश चंद शर्मा, साकिन मकान न0 412, सेक्टर 7, अर्बन एस्टेट, पानीपत पुलिस पार्टी व उपस्थित स्वतंत्र गवाहान को साथ लेकर अपने बताए अनुसार स्थान पर पहुंचा और उंगली से इशारा करके निशानदेही की कि 'यही वह स्थान है जहां मैंने वारदात का सामान छिपाया है।'`,
    boundariesList: [
      { id: "bd_1", direction: "पूर्व (East)", detail: "मकान न0 411 (पड़ोसी)" },
      { id: "bd_2", direction: "पश्चिम (West)", detail: "मकान न0 413 (पड़ोसी)" },
      { id: "bd_3", direction: "उत्तर (North)", detail: "मुख्य गली (20 फीट चौड़ी सड़क)" },
      { id: "bd_4", direction: "दक्षिण (South)", detail: "खाली प्लॉट / खुला स्थान" },
    ],
    verificationClauseText: "उक्त निशानदेही अभियुक्त ने उपस्थित गवाहान के समक्ष स्वेच्छा से कराई है। गवाहान व अभियुक्त ने फर्द को सही मानकर हस्ताक्षर किए।",
    arrestWitnesses: [
      { id: "wit_1", name: "बलजीत सिंह सुपुत्र हरनाम सिंह", address: "वार्ड न0 5, पानीपत" },
      { id: "wit_2", name: "रमेश लाल सुपुत्र वेद प्रकाश", address: "न्यू बस स्टैंड, पानीपत" },
    ],
    officerName: "सुरेंद्र पाल",
    officerRank: "उप-निरीक्षक (SI)",
    officerPno: "04291885",
    officerPhone: "9812034567",
    customClauses: [],
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
    introNarrative: `आज दिनांक 18.09.2026 को मुकदमा उपरोक्त में पुलिस हिरासत में मौजूद अभियुक्त श्री विकास शर्मा सुपुत्र श्री रमेश चंद शर्मा, उम्र 34 वर्ष, साकिन मकान न0 412, सेक्टर 7, अर्बन एस्टेट, पानीपत ने उपस्थित स्वतंत्र गवाहान के समक्ष बिना किसी डर, दबाव या प्रलोभन के स्वेच्छा से निम्नलिखित इकबालिया बयान दिया:`,
    disclosureNarrative: `बयान दिया कि मैंने अपने साथी के साथ मिलकर परिवादी से 4,50,000/- रुपये की धोखाधड़ी की थी। उस राशि में से मैंने 1,20,000/- रुपये नकदी तथा धोखाधड़ी में इस्तेमाल किया गया लैपटॉप अपने घर (मकान न0 412, सेक्टर 7, अर्बन एस्टेट) के अंदर वाले शयनकक्ष की लकड़ी की अलमारी के गुप्त खाने में छिपाकर रखे हुए हैं, जो मेरे अलावा किसी अन्य को मालूम नहीं हैं। मैं चलकर पुलिस पार्टी को वह स्थान बताकर उक्त रुपये व लैपटॉप बरामद करवा सकता हूँ।`,
    verificationClauseText: "अभियुक्त ने उक्त बयान पुलिस हिरासत में स्वतंत्र गवाहान के समक्ष बिना किसी भय, प्रलोभन अथवा जोर-जबरदस्ती के स्वेच्छा से दिया है। बयान सुनाकर सही मानकर अभियुक्त ने हस्ताक्षर किए।",
    arrestWitnesses: [
      { id: "wit_1", name: "बलजीत सिंह सुपुत्र हरनाम सिंह", address: "वार्ड न0 5, पानीपत" },
      { id: "wit_2", name: "रमेश लाल सुपुत्र वेद प्रकाश", address: "न्यू बस स्टैंड, पानीपत" },
    ],
    officerName: "सुरेंद्र पाल",
    officerRank: "उप-निरीक्षक (SI)",
    officerPno: "04291885",
    officerPhone: "9812034567",
    customClauses: [],
  },

  medical_letter: {
    headerDept: "कार्यालय थाना प्रबंधक / अनुसंधान अधिकारी",
    policeStation: "थाना शहर पानीपत",
    district: "जिला पानीपत",
    complaintNo: "128/2026",
    issueDate: "18.09.2026",
    dispatchNo: "1482/R",
    hospitalName: "सामान्य अस्पताल (Civil Hospital), पानीपत",
    medicalOfficerName: "वरिष्ठ चिकित्सा अधिकारी महोदय (Medical Officer In-charge)",
    docTitle: "प्रार्थना पत्र बाबत डाक्टरी मुलाहिजा / चिकित्सीय परीक्षण अभियुक्त",
    docSubTitle: "अंतर्गत धारा 51 भारतीय नागरिक सुरक्षा संहिता (BNSS), 2023 / धारा 53 व 54 दंड प्रक्रिया संहिता",
    noticeeName: "विकास शर्मा",
    noticeeFather: "रमेश चंद शर्मा",
    noticeeAge: "34 वर्ष",
    noticeeAddress: "मकान न0 412, सेक्टर 7, अर्बन एस्टेट, पानीपत",
    subjectTitle: "गिरफ्तार अभियुक्त विकास शर्मा का धारा 51 BNSS के अंतर्गत डाक्टरी मुलाहिजा (Medical Examination) करवाने बाबत।",
    introNarrative: `निवेदन है कि उपरोक्त अभियोग में गिरफ्तार अभियुक्त विकास शर्मा सुपुत्र रमेश चंद शर्मा, उम्र 34 वर्ष को डाक्टरी मुलाहिजा हेतु बहमराह पुलिस कर्मचारी आपके समक्ष प्रस्तुत किया जा रहा है। कृपया अभियुक्त का नियमानुसार मेडिकल परीक्षण कर निम्नलिखित बिंदुओं पर रिपोर्ट प्रदान करें:`,
    medicalPoints: [
      { id: "mp_1", text: "अभियुक्त के शरीर पर कोई ताजा अथवा पुरानी जाहिरा चोट है या नहीं, इसका विस्तृत विवरण (MLR) दिया जावे।" },
      { id: "mp_2", text: "क्या अभियुक्त पुलिस हिरासत में रखे जाने तथा न्यायालय में पेशी हेतु शारीरिक व मानसिक रूप से स्वस्थ (Fit) है?" },
      { id: "mp_3", text: "क्या अभियुक्त किसी प्रकार के नशीले पदार्थ अथवा शराब के प्रभाव में है?" },
    ],
    escortOfficers: [
      { id: "esc_1", name: "EHC सुरजीत सिंह", beltNo: "No. 418", thana: "थाना शहर पानीपत" },
      { id: "esc_2", name: "कांस. नरेश कुमार", beltNo: "No. 892", thana: "थाना शहर पानीपत" },
    ],
    conclusionNarrative: "कृपया अभियुक्त का नियमानुसार मेडिकल परीक्षण कर विस्तृत चोट रिपोर्ट (MLR) जारी करने की कृपा करें।",
    officerName: "सुरेंद्र पाल",
    officerRank: "उप-निरीक्षक (SI)",
    officerPno: "04291885",
    officerPhone: "9812034567",
    customClauses: [],
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
    subjectTitle: "अभियुक्त विकास शर्मा को पुलिस रिमांड समाप्ति उपरांत पेश अदालत कर न्यायिक हिरासत (जिला कारागार) भेजने बारे।",
    introNarrative: `श्रीमान जी, सविनय निवेदन है कि मुकदमा उपरोक्त में अभियुक्त विकास शर्मा को माननीय न्यायालय के आदेशानुसार पुलिस रिमांड पर लिया गया था, जिसकी अवधि आज समाप्त हो रही है। अतः अभियुक्त को न्यायिक हिरासत में भेजा जाना आवश्यक है:`,
    peshiPoints: [
      { id: "pp_1", text: "अभियुक्त का पुलिस रिमांड आज दिनांक 21.09.2026 को समाप्त हो रहा है।" },
      { id: "pp_2", text: "रिमांड के दौरान अभियुक्त से ठगी के 1,20,000/- रुपये, लैपटॉप व फर्जी मुहरें बरामद कर ली गई हैं तथा फर्द निशानदेही मुकम्मल की जा चुकी है।" },
      { id: "pp_3", text: "अब अभियुक्त से पुलिस हिरासत में अन्य कोई पूछताछ अथवा बरामदगी शेष नहीं है।" },
      { id: "pp_4", text: "अभियुक्त का सिविल अस्पताल से पुनः डाक्टरी परीक्षण करवा लिया गया है और मेडिकल रिपोर्ट साथ संलग्न है।" },
      { id: "pp_5", text: "अभियुक्त संज्ञेय व गंभीर अपराध का आरोपी है, यदि इसे जमानत पर रिहा किया गया तो यह फरार हो सकता है अथवा साक्षियों को प्रभावित कर सकता है।" },
    ],
    conclusionNarrative: "अतः श्रीमान जी से सविनय प्रार्थना है कि अभियुक्त विकास शर्मा को 14 दिन की न्यायिक हिरासत (Judicial Custody - जिला कारागार पानीपत) में भेजने के आदेश जारी फरमाए जावें।",
    officerName: "सुरेंद्र पाल",
    officerRank: "उप-निरीक्षक (SI)",
    officerPno: "04291885",
    officerPhone: "9812034567",
    customClauses: [],
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

  // Generic Dynamic Point Actions (for Grounds, Rights, Remand, Medical, Peshi)
  const handleAddPoint = (field: "groundsPoints" | "rightsPoints" | "remandPoints" | "medicalPoints" | "peshiPoints") => {
    const cur = formData[field] || [];
    const newPoint: DynamicPointItem = { id: `pt_${Date.now()}`, text: "" };
    handleFieldChange(field, [...cur, newPoint]);
  };

  const handleUpdatePoint = (
    field: "groundsPoints" | "rightsPoints" | "remandPoints" | "medicalPoints" | "peshiPoints",
    id: string,
    text: string
  ) => {
    const cur = formData[field] || [];
    const updated = cur.map((item) => (item.id === id ? { ...item, text } : item));
    handleFieldChange(field, updated);
  };

  const handleDeletePoint = (
    field: "groundsPoints" | "rightsPoints" | "remandPoints" | "medicalPoints" | "peshiPoints",
    id: string
  ) => {
    const cur = formData[field] || [];
    handleFieldChange(field, cur.filter((item) => item.id !== id));
  };

  // Custom Clauses / Paragraphs (Available in every template)
  const handleAddCustomClause = () => {
    const cur = formData.customClauses || [];
    const newClause: CustomClauseItem = {
      id: `clause_${Date.now()}`,
      heading: "अतिरिक्त पैरा / विशेष बिंदु",
      text: "",
    };
    handleFieldChange("customClauses", [...cur, newClause]);
  };

  const handleUpdateCustomClause = (id: string, key: "heading" | "text", val: string) => {
    const cur = formData.customClauses || [];
    const updated = cur.map((c) => (c.id === id ? { ...c, [key]: val } : c));
    handleFieldChange("customClauses", updated);
  };

  const handleDeleteCustomClause = (id: string) => {
    const cur = formData.customClauses || [];
    handleFieldChange("customClauses", cur.filter((c) => c.id !== id));
  };

  // Dynamic Witnesses (Available in all templates)
  const handleAddWitnessRow = () => {
    const cur = formData.arrestWitnesses || [];
    const updated = [...cur, { id: `wit_${Date.now()}`, name: "", address: "", signature: "" }];
    handleFieldChange("arrestWitnesses", updated);
  };

  const handleUpdateWitnessRow = (id: string, key: keyof ArrestWitnessItem, val: string) => {
    const cur = formData.arrestWitnesses || [];
    const updated = cur.map((w) => (w.id === id ? { ...w, [key]: val } : w));
    handleFieldChange("arrestWitnesses", updated);
  };

  const handleDeleteWitnessRow = (id: string) => {
    const cur = formData.arrestWitnesses || [];
    handleFieldChange("arrestWitnesses", cur.filter((w) => w.id !== id));
  };

  // Dynamic Jama Talashi items
  const handleAddJamaTalashiRow = () => {
    const cur = formData.jamaTalashiItems || [];
    const nextSr = `${cur.length + 1}.`;
    const updated = [...cur, { id: `jt_${Date.now()}`, srNo: nextSr, description: "", quantity: "1", identification: "" }];
    handleFieldChange("jamaTalashiItems", updated);
  };

  const handleUpdateJamaTalashiRow = (id: string, key: keyof JamaTalashiItem, val: string) => {
    const cur = formData.jamaTalashiItems || [];
    const updated = cur.map((item) => (item.id === id ? { ...item, [key]: val } : item));
    handleFieldChange("jamaTalashiItems", updated);
  };

  const handleDeleteJamaTalashiRow = (id: string) => {
    const cur = formData.jamaTalashiItems || [];
    handleFieldChange("jamaTalashiItems", cur.filter((item) => item.id !== id));
  };

  // Dynamic Recovery items
  const handleAddRecoveryRow = () => {
    const cur = formData.recoveryItems || [];
    const nextSr = `${cur.length + 1}.`;
    const updated = [
      ...cur,
      { id: `rec_${Date.now()}`, srNo: nextSr, description: "", quantity: "1", sealDetails: "सील मोहर 'SP'" },
    ];
    handleFieldChange("recoveryItems", updated);
  };

  const handleUpdateRecoveryRow = (id: string, key: keyof RecoveryItem, val: string) => {
    const cur = formData.recoveryItems || [];
    const updated = cur.map((item) => (item.id === id ? { ...item, [key]: val } : item));
    handleFieldChange("recoveryItems", updated);
  };

  const handleDeleteRecoveryRow = (id: string) => {
    const cur = formData.recoveryItems || [];
    handleFieldChange("recoveryItems", cur.filter((item) => item.id !== id));
  };

  // Dynamic Traits (Pehchan Patr)
  const handleAddTraitRow = () => {
    const cur = formData.traitsList || [];
    const nextLabel = `${cur.length + 1}. नया लक्षण`;
    const updated = [...cur, { id: `tr_${Date.now()}`, label: nextLabel, value: "" }];
    handleFieldChange("traitsList", updated);
  };

  const handleUpdateTraitRow = (id: string, key: "label" | "value", val: string) => {
    const cur = formData.traitsList || [];
    const updated = cur.map((item) => (item.id === id ? { ...item, [key]: val } : item));
    handleFieldChange("traitsList", updated);
  };

  const handleDeleteTraitRow = (id: string) => {
    const cur = formData.traitsList || [];
    handleFieldChange("traitsList", cur.filter((item) => item.id !== id));
  };

  // Dynamic Boundaries (Nishandehi)
  const handleAddBoundaryRow = () => {
    const cur = formData.boundariesList || [];
    const updated = [...cur, { id: `bd_${Date.now()}`, direction: "दिशा / स्थल", detail: "" }];
    handleFieldChange("boundariesList", updated);
  };

  const handleUpdateBoundaryRow = (id: string, key: "direction" | "detail", val: string) => {
    const cur = formData.boundariesList || [];
    const updated = cur.map((item) => (item.id === id ? { ...item, [key]: val } : item));
    handleFieldChange("boundariesList", updated);
  };

  const handleDeleteBoundaryRow = (id: string) => {
    const cur = formData.boundariesList || [];
    handleFieldChange("boundariesList", cur.filter((item) => item.id !== id));
  };

  // Dynamic Escort Officers (Medical Letter)
  const handleAddEscortRow = () => {
    const cur = formData.escortOfficers || [];
    const updated = [...cur, { id: `esc_${Date.now()}`, name: "", beltNo: "", thana: formData.policeStation || "" }];
    handleFieldChange("escortOfficers", updated);
  };

  const handleUpdateEscortRow = (id: string, key: keyof EscortOfficerItem, val: string) => {
    const cur = formData.escortOfficers || [];
    const updated = cur.map((item) => (item.id === id ? { ...item, [key]: val } : item));
    handleFieldChange("escortOfficers", updated);
  };

  const handleDeleteEscortRow = (id: string) => {
    const cur = formData.escortOfficers || [];
    handleFieldChange("escortOfficers", cur.filter((item) => item.id !== id));
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

  // Reusable Component: Editable Header Bar
  const renderOfficialHeader = () => (
    <div className="space-y-2 pb-3 border-b border-slate-400">
      <div className="text-center space-y-1">
        <input
          type="text"
          value={formData.headerDept || "हरियाणा पुलिस"}
          onChange={(e) => handleFieldChange("headerDept", e.target.value)}
          className="text-center font-bold text-base w-full bg-transparent hover:bg-slate-50 focus:bg-white outline-none border-b border-transparent focus:border-slate-400"
          placeholder="विभाग का नाम"
        />
        <input
          type="text"
          value={formData.docTitle || ""}
          onChange={(e) => handleFieldChange("docTitle", e.target.value)}
          className="text-center font-black text-xl w-full bg-transparent hover:bg-slate-50 focus:bg-white outline-none border-b border-transparent focus:border-slate-400 underline underline-offset-4"
          placeholder="दस्तावेज का शीर्षक"
        />
        <input
          type="text"
          value={formData.docSubTitle || ""}
          onChange={(e) => handleFieldChange("docSubTitle", e.target.value)}
          className="text-center text-xs text-slate-700 font-semibold w-full bg-transparent hover:bg-slate-50 focus:bg-white outline-none border-b border-transparent focus:border-slate-400"
          placeholder="उप-शीर्षक / धाराएं"
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-bold pt-1">
        <div className="flex items-center gap-1">
          <span className="shrink-0">थाना:</span>
          <input
            type="text"
            value={formData.policeStation || ""}
            onChange={(e) => handleFieldChange("policeStation", e.target.value)}
            className="w-full bg-transparent border-b border-dotted border-slate-700 outline-none px-1"
          />
        </div>
        <div className="flex items-center gap-1">
          <span className="shrink-0">जिला:</span>
          <input
            type="text"
            value={formData.district || ""}
            onChange={(e) => handleFieldChange("district", e.target.value)}
            className="w-full bg-transparent border-b border-dotted border-slate-700 outline-none px-1"
          />
        </div>
        <div className="flex items-center gap-1">
          <span className="shrink-0">मुकदमा सं0:</span>
          <input
            type="text"
            value={formData.complaintNo || ""}
            onChange={(e) => handleFieldChange("complaintNo", e.target.value)}
            className="w-full bg-transparent border-b border-dotted border-slate-700 outline-none px-1 font-black"
          />
        </div>
        <div className="flex items-center gap-1">
          <span className="shrink-0">दिनांक:</span>
          <input
            type="text"
            value={formData.issueDate || ""}
            onChange={(e) => handleFieldChange("issueDate", e.target.value)}
            className="w-full bg-transparent border-b border-dotted border-slate-700 outline-none px-1"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs font-bold pt-1">
        <span className="shrink-0">धारा/धाराएं:</span>
        <input
          type="text"
          value={formData.sectionsOfLaw || ""}
          onChange={(e) => handleFieldChange("sectionsOfLaw", e.target.value)}
          className="w-full bg-transparent border-b border-dotted border-slate-700 outline-none px-1"
          placeholder="धाराएं"
        />
      </div>
    </div>
  );

  // Reusable Component: Dynamic Custom Clauses
  const renderCustomClausesSection = () => (
    <div className="space-y-3 pt-3 border-t border-slate-300">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-800">अतिरिक्त पैरा / क्लॉज (Custom Editable Sections):</span>
        <button
          type="button"
          onClick={handleAddCustomClause}
          className="no-print text-xs text-rose-700 hover:text-rose-900 font-bold flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" /> नया पैरा / क्लॉज जोड़ें
        </button>
      </div>

      {(formData.customClauses || []).map((clause) => (
        <div key={clause.id} className="border border-slate-300 p-3 space-y-1 relative group bg-white">
          <div className="flex items-center justify-between gap-2">
            <input
              type="text"
              value={clause.heading}
              onChange={(e) => handleUpdateCustomClause(clause.id, "heading", e.target.value)}
              className="font-bold text-xs w-full bg-transparent border-b border-dashed border-slate-400 outline-none"
              placeholder="शीर्षक दर्ज करें..."
            />
            <button
              type="button"
              onClick={() => handleDeleteCustomClause(clause.id)}
              className="no-print text-red-500 hover:text-red-700 shrink-0 p-1"
              title="यह पैरा हटाएं"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <textarea
            rows={2}
            value={clause.text}
            onChange={(e) => handleUpdateCustomClause(clause.id, "text", e.target.value)}
            className="w-full text-xs p-1 outline-none resize-y border-0 bg-transparent leading-relaxed"
            placeholder="इस पैरा का विवरण लिखें..."
          />
        </div>
      ))}
    </div>
  );

  // Reusable Component: Dynamic Witnesses
  const renderWitnessesSection = () => (
    <div className="space-y-2 pt-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold underline">गवाहान / पंच गवाह (Witnesses):</span>
        <button
          type="button"
          onClick={handleAddWitnessRow}
          className="no-print text-xs text-rose-700 hover:text-rose-900 font-bold flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" /> गवाह जोड़ें
        </button>
      </div>

      <table className="w-full border-collapse border border-slate-400 text-xs">
        <thead>
          <tr className="bg-slate-100">
            <th className="border border-slate-400 p-1.5 w-10 text-center">क्र0</th>
            <th className="border border-slate-400 p-1.5 text-left">गवाह का नाम व वल्दियत</th>
            <th className="border border-slate-400 p-1.5 text-left">पूरा पता व मोबाइल</th>
            <th className="border border-slate-400 p-1.5 w-36 text-center">हस्ताक्षर/निशान अंगूठा</th>
            <th className="no-print border border-slate-400 p-1.5 w-10 text-center"></th>
          </tr>
        </thead>
        <tbody>
          {(formData.arrestWitnesses || []).map((w, idx) => (
            <tr key={w.id}>
              <td className="border border-slate-400 p-1.5 text-center">{idx + 1}</td>
              <td className="border border-slate-400 p-1.5">
                <input
                  type="text"
                  value={w.name}
                  onChange={(e) => handleUpdateWitnessRow(w.id, "name", e.target.value)}
                  className="w-full bg-transparent outline-none"
                  placeholder="नाम व पिता का नाम"
                />
              </td>
              <td className="border border-slate-400 p-1.5">
                <input
                  type="text"
                  value={w.address}
                  onChange={(e) => handleUpdateWitnessRow(w.id, "address", e.target.value)}
                  className="w-full bg-transparent outline-none"
                  placeholder="पता"
                />
              </td>
              <td className="border border-slate-400 p-1.5 text-center font-bold">
                <input
                  type="text"
                  value={w.signature || w.name.split(" ")[0]}
                  onChange={(e) => handleUpdateWitnessRow(w.id, "signature", e.target.value)}
                  className="w-full text-center bg-transparent outline-none font-bold"
                />
              </td>
              <td className="no-print border border-slate-400 p-1.5 text-center">
                <button
                  type="button"
                  onClick={() => handleDeleteWitnessRow(w.id)}
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
  );

  // Reusable Component: IO Signature Block
  const renderOfficerSignBlock = () => (
    <div className="pt-6 flex justify-between items-end text-xs border-t border-slate-300">
      <div>
        <p className="font-bold">हस्ताक्षर/अंगूठा अभियुक्त:</p>
        <p className="border-b border-slate-400 w-44 pt-4"></p>
        <p className="text-[11px] text-slate-600 pt-1">({formData.noticeeName})</p>
      </div>
      <div className="text-right space-y-0.5">
        <p className="font-bold">हस्ताक्षर अनुसंधान अधिकारी (IO):</p>
        <p className="border-b border-slate-400 w-48 ml-auto pt-4"></p>
        <input
          type="text"
          value={formData.officerName || ""}
          onChange={(e) => handleFieldChange("officerName", e.target.value)}
          className="text-right font-bold w-48 outline-none border-b border-dotted border-slate-400"
        />
        <div className="flex justify-end gap-1 text-[11px] text-slate-600">
          <input
            type="text"
            value={formData.officerRank || ""}
            onChange={(e) => handleFieldChange("officerRank", e.target.value)}
            className="text-right w-24 outline-none border-b border-dotted border-slate-300"
          />
          <span>, No.</span>
          <input
            type="text"
            value={formData.officerPno || ""}
            onChange={(e) => handleFieldChange("officerPno", e.target.value)}
            className="text-right w-20 outline-none border-b border-dotted border-slate-300"
          />
        </div>
      </div>
    </div>
  );

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
              Arrest & Custody Documentation (गिरफ्तारी प्रपत्र स्टूडियो)
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              100% Fully In-Place Editable • Add/Delete Any Point, Row, Witness or Custom Paragraph
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

        {/* Toolbar: Font Size & Reset */}
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
          {/* ================= 1. ARREST MEMO FORM 26.8(1) (4 PAGES) ================= */}
          {selectedTemplate === "arrest_memo" && (
            <div className="space-y-10">
              {/* PAGE 1 */}
              <div className="border border-slate-400 p-6 sm:p-8 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-300">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    पृष्ठ 1 / 4: गिरफ्तारी/ न्यायालय में समर्पण फार्म - भाग-1 (फार्म संख्या 26.8(1))
                  </span>
                  <input
                    type="text"
                    value={formData.headerVersion || "v3.0 dt 07.04.2025"}
                    onChange={(e) => handleFieldChange("headerVersion", e.target.value)}
                    className="font-mono text-xs font-bold text-slate-700 text-right outline-none bg-transparent"
                  />
                </div>

                <div className="text-center space-y-0.5 py-1">
                  <input
                    type="text"
                    value={formData.docTitle || "गिरफ्तारी/ न्यायालय में समर्पण फार्म"}
                    onChange={(e) => handleFieldChange("docTitle", e.target.value)}
                    className="w-full text-center font-bold text-base sm:text-lg text-slate-950 underline underline-offset-4 bg-transparent outline-none"
                  />
                  <input
                    type="text"
                    value={formData.docSubTitle || "भाग-1 फार्म संख्या 26.8(1)"}
                    onChange={(e) => handleFieldChange("docSubTitle", e.target.value)}
                    className="w-full text-center font-bold text-sm text-slate-900 bg-transparent outline-none"
                  />
                </div>

                {/* Point 1 */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold">1. जिला:</span>
                    <input
                      type="text"
                      value={formData.district || ""}
                      onChange={(e) => handleFieldChange("district", e.target.value)}
                      className="font-bold border-b border-dotted border-slate-700 px-1 outline-none min-w-[140px]"
                    />
                    <span className="font-bold">थाना:</span>
                    <input
                      type="text"
                      value={formData.policeStation || ""}
                      onChange={(e) => handleFieldChange("policeStation", e.target.value)}
                      className="font-bold border-b border-dotted border-slate-700 px-1 outline-none min-w-[140px]"
                    />
                    <span className="font-bold">वर्ष:</span>
                    <input
                      type="text"
                      value={formData.arrestYear || "2026"}
                      onChange={(e) => handleFieldChange("arrestYear", e.target.value)}
                      className="font-bold border-b border-dotted border-slate-700 px-1 outline-none w-20"
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-2 pl-4">
                    <span className="font-bold">FIR/ रोजनामचा रपट संख्या:</span>
                    <input
                      type="text"
                      value={formData.complaintNo || ""}
                      onChange={(e) => handleFieldChange("complaintNo", e.target.value)}
                      className="font-bold border-b border-dotted border-slate-700 px-1 outline-none min-w-[180px]"
                    />
                    <span className="font-bold">दिनांक:</span>
                    <input
                      type="text"
                      value={formData.issueDate || ""}
                      onChange={(e) => handleFieldChange("issueDate", e.target.value)}
                      className="font-bold border-b border-dotted border-slate-700 px-1 outline-none w-28"
                    />
                  </div>
                </div>

                {/* Point 2 */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="font-bold">2. धारा/ धाराएं:</span>
                  <input
                    type="text"
                    value={formData.sectionsOfLaw || ""}
                    onChange={(e) => handleFieldChange("sectionsOfLaw", e.target.value)}
                    className="font-bold border-b border-dotted border-slate-700 px-1 outline-none flex-1 min-w-[260px]"
                  />
                </div>

                {/* Point 3 */}
                <div className="space-y-1 pt-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold">3. गिरफ्तारी की तिथि:</span>
                    <input
                      type="text"
                      value={formData.arrestDate || ""}
                      onChange={(e) => handleFieldChange("arrestDate", e.target.value)}
                      className="font-bold border-b border-dotted border-slate-700 px-1 outline-none w-32"
                    />
                    <span className="font-bold">समय:</span>
                    <input
                      type="text"
                      value={formData.arrestTime || ""}
                      onChange={(e) => handleFieldChange("arrestTime", e.target.value)}
                      className="font-bold border-b border-dotted border-slate-700 px-1 outline-none w-28"
                    />
                    <span className="font-bold">रपट न0:</span>
                    <input
                      type="text"
                      value={formData.arrestGdNo || ""}
                      onChange={(e) => handleFieldChange("arrestGdNo", e.target.value)}
                      className="font-bold border-b border-dotted border-slate-700 px-1 outline-none w-28"
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-2 pl-4">
                    <span className="font-bold">स्थान:</span>
                    <input
                      type="text"
                      value={formData.arrestPlace || ""}
                      onChange={(e) => handleFieldChange("arrestPlace", e.target.value)}
                      className="font-bold border-b border-dotted border-slate-700 px-1 outline-none flex-1 min-w-[240px]"
                    />
                  </div>
                </div>

                {/* Point 4 */}
                <div className="space-y-1.5 pt-1 border-t border-slate-200">
                  <span className="font-bold block">4. अभियुक्त का विवरण:</span>
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
                      <span className="w-28 text-xs font-semibold">उपनाम:</span>
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
                      <span className="w-28 text-xs font-semibold">उम्र:</span>
                      <input
                        type="text"
                        value={formData.noticeeAge || ""}
                        onChange={(e) => handleFieldChange("noticeeAge", e.target.value)}
                        className="border-b border-dotted border-slate-700 px-1 outline-none flex-1"
                      />
                    </div>
                    <div className="flex items-center gap-2 sm:col-span-2">
                      <span className="w-28 text-xs font-semibold">स्थायी पता:</span>
                      <input
                        type="text"
                        value={formData.noticeeAddress || ""}
                        onChange={(e) => handleFieldChange("noticeeAddress", e.target.value)}
                        className="border-b border-dotted border-slate-700 px-1 outline-none flex-1"
                      />
                    </div>
                  </div>
                </div>

                {/* Point 5 */}
                <div className="pt-1">
                  <span className="font-bold block">5. शारीरिक दशा / जाहिरा चोट:</span>
                  <input
                    type="text"
                    value={formData.physicalConditionOrInjuries || ""}
                    onChange={(e) => handleFieldChange("physicalConditionOrInjuries", e.target.value)}
                    className="w-full border-b border-dotted border-slate-700 px-1 outline-none mt-1"
                  />
                </div>

                {/* Point 6: Witnesses */}
                {renderWitnessesSection()}
              </div>

              {/* PAGE 2 */}
              <div className="border border-slate-400 p-6 sm:p-8 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-300">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    पृष्ठ 2 / 4: सूचना, आधार व जामातलाशी
                  </span>
                  <span className="font-mono text-xs font-bold text-slate-700">फार्म संख्या 26.8(1) भाग-2</span>
                </div>

                <div className="space-y-1.5">
                  <span className="font-bold block underline">
                    7. रिश्तेदार को सूचना (धारा 48 BNSS / धारा 50A Cr.P.C.):
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-4 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-32">सूचित व्यक्ति:</span>
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
                      <span className="w-32">दिनांक व समय:</span>
                      <input
                        type="text"
                        value={`${formData.intimationDate || ""} ${formData.intimationTime || ""}`}
                        onChange={(e) => handleFieldChange("intimationDate", e.target.value)}
                        className="border-b border-dotted border-slate-700 px-1 outline-none flex-1"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-24">मोबाइल:</span>
                      <input
                        type="text"
                        value={formData.relativeMobile || ""}
                        onChange={(e) => handleFieldChange("relativeMobile", e.target.value)}
                        className="border-b border-dotted border-slate-700 px-1 outline-none flex-1"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2">
                  <span className="font-bold block underline">
                    8. गिरफ्तारी के आधार (धारा 47 BNSS / धारा 50 Cr.P.C.):
                  </span>
                  <textarea
                    rows={3}
                    value={formData.grounds47Other || ""}
                    onChange={(e) => handleFieldChange("grounds47Other", e.target.value)}
                    className="w-full text-xs p-2 border border-slate-400 outline-none leading-relaxed"
                  />
                </div>

                {/* Jama Talashi Table */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold underline">
                      9. जामातलाशी का विवरण (धारा 50 BNSS):
                    </span>
                    <button
                      type="button"
                      onClick={handleAddJamaTalashiRow}
                      className="no-print text-xs text-rose-700 hover:text-rose-900 font-bold flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> सामान जोड़ें
                    </button>
                  </div>
                  <table className="w-full border-collapse border border-slate-400 text-xs">
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="border border-slate-400 p-1.5 w-10 text-center">क्र0</th>
                        <th className="border border-slate-400 p-1.5 text-left">सामान का विवरण</th>
                        <th className="border border-slate-400 p-1.5 w-28 text-center">तादाद</th>
                        <th className="no-print border border-slate-400 p-1.5 w-10 text-center"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {(formData.jamaTalashiItems || []).map((it, idx) => (
                        <tr key={it.id}>
                          <td className="border border-slate-400 p-1.5 text-center">{idx + 1}</td>
                          <td className="border border-slate-400 p-1.5">
                            <input
                              type="text"
                              value={it.description}
                              onChange={(e) => handleUpdateJamaTalashiRow(it.id, "description", e.target.value)}
                              className="w-full bg-transparent outline-none"
                            />
                          </td>
                          <td className="border border-slate-400 p-1.5 text-center">
                            <input
                              type="text"
                              value={it.quantity}
                              onChange={(e) => handleUpdateJamaTalashiRow(it.id, "quantity", e.target.value)}
                              className="w-full text-center bg-transparent outline-none"
                            />
                          </td>
                          <td className="no-print border border-slate-400 p-1.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteJamaTalashiRow(it.id)}
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

                {renderCustomClausesSection()}
                {renderOfficerSignBlock()}
              </div>

              {/* PAGE 3: PHYSICAL TRAITS */}
              <div className="border border-slate-400 p-6 sm:p-8 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-300">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    पृष्ठ 3 / 4: शारीरिक हुलिया व पहचान लक्षण
                  </span>
                  <button
                    type="button"
                    onClick={handleAddTraitRow}
                    className="no-print text-xs text-rose-700 hover:text-rose-900 font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> लक्षण जोड़ें
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {(formData.traitsList || []).map((tr) => (
                    <div key={tr.id} className="border border-slate-300 p-2 relative group flex items-center gap-2">
                      <input
                        type="text"
                        value={tr.label}
                        onChange={(e) => handleUpdateTraitRow(tr.id, "label", e.target.value)}
                        className="font-bold text-slate-700 w-36 outline-none bg-transparent border-b border-dotted border-slate-400"
                      />
                      <input
                        type="text"
                        value={tr.value}
                        onChange={(e) => handleUpdateTraitRow(tr.id, "value", e.target.value)}
                        className="w-full outline-none bg-transparent"
                      />
                      <button
                        type="button"
                        onClick={() => handleDeleteTraitRow(tr.id)}
                        className="no-print text-red-500 hover:text-red-700 p-1 opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* PAGE 4: MHC */}
              <div className="border border-slate-400 p-6 sm:p-8 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-300">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    पृष्ठ 4 / 4: मालखाना मोहर्रिर (MHC) सुपुर्दगी
                  </span>
                  <span className="font-mono text-xs font-bold text-slate-700">थाना मालखाना रिकॉर्ड</span>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <span className="font-bold block">10. मालखाना जमा करवाने का विवरण:</span>
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
                      <span className="font-bold block text-slate-700">जमा तिथि:</span>
                      <input
                        type="text"
                        value={formData.mhcDepositDate || ""}
                        onChange={(e) => handleFieldChange("mhcDepositDate", e.target.value)}
                        className="w-full border-b border-dotted border-slate-700 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {renderOfficerSignBlock()}
              </div>
            </div>
          )}

          {/* ================= 2. FARD JAMATALASHI ================= */}
          {selectedTemplate === "fard_jamatalashi" && (
            <div className="space-y-6">
              {renderOfficialHeader()}

              <textarea
                rows={4}
                value={formData.introNarrative || ""}
                onChange={(e) => handleFieldChange("introNarrative", e.target.value)}
                className="w-full text-xs leading-relaxed p-2 border border-slate-300 outline-none resize-y"
              />

              {/* Items Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold underline">बरामदशुदा जामातलाशी सामान की सूची:</span>
                  <button
                    type="button"
                    onClick={handleAddJamaTalashiRow}
                    className="no-print text-xs text-rose-700 hover:text-rose-900 font-bold flex items-center gap-1"
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
                    {(formData.jamaTalashiItems || []).map((it, idx) => (
                      <tr key={it.id}>
                        <td className="border border-slate-400 p-2 text-center">{idx + 1}</td>
                        <td className="border border-slate-400 p-2">
                          <input
                            type="text"
                            value={it.description}
                            onChange={(e) => handleUpdateJamaTalashiRow(it.id, "description", e.target.value)}
                            className="w-full bg-transparent outline-none"
                          />
                        </td>
                        <td className="border border-slate-400 p-2 text-center">
                          <input
                            type="text"
                            value={it.quantity}
                            onChange={(e) => handleUpdateJamaTalashiRow(it.id, "quantity", e.target.value)}
                            className="w-full text-center bg-transparent outline-none font-bold"
                          />
                        </td>
                        <td className="border border-slate-400 p-2">
                          <input
                            type="text"
                            value={it.identification || ""}
                            onChange={(e) => handleUpdateJamaTalashiRow(it.id, "identification", e.target.value)}
                            className="w-full bg-transparent outline-none text-slate-700"
                          />
                        </td>
                        <td className="no-print border border-slate-400 p-1.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteJamaTalashiRow(it.id)}
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
              <div className="space-y-1">
                <span className="text-xs font-bold underline">रसीद व सुपुर्दगी की पुष्टि:</span>
                <textarea
                  rows={2}
                  value={formData.receiptClauseText || ""}
                  onChange={(e) => handleFieldChange("receiptClauseText", e.target.value)}
                  className="w-full text-xs p-2 border border-slate-300 outline-none resize-y"
                />
              </div>

              {renderWitnessesSection()}
              {renderCustomClausesSection()}
              {renderOfficerSignBlock()}
            </div>
          )}

          {/* ================= 3. GROUNDS OF ARREST ================= */}
          {selectedTemplate === "grounds_of_arrest" && (
            <div className="space-y-6">
              {renderOfficialHeader()}

              <textarea
                rows={3}
                value={formData.introNarrative || ""}
                onChange={(e) => handleFieldChange("introNarrative", e.target.value)}
                className="w-full text-xs leading-relaxed p-2 border border-slate-300 outline-none resize-y"
              />

              {/* Dynamic Grounds Points */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold underline">गिरफ्तारी के ठोस आधार (Specific Grounds of Arrest):</span>
                  <button
                    type="button"
                    onClick={() => handleAddPoint("groundsPoints")}
                    className="no-print text-xs text-rose-700 hover:text-rose-900 font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> आधार बिंदु जोड़ें
                  </button>
                </div>
                <div className="space-y-2">
                  {(formData.groundsPoints || []).map((pt, idx) => (
                    <div key={pt.id} className="flex items-start gap-2 border border-slate-300 p-2 bg-slate-50/50">
                      <span className="font-bold text-xs pt-0.5">{idx + 1}.</span>
                      <textarea
                        rows={2}
                        value={pt.text}
                        onChange={(e) => handleUpdatePoint("groundsPoints", pt.id, e.target.value)}
                        className="w-full text-xs bg-transparent outline-none resize-y"
                      />
                      <button
                        type="button"
                        onClick={() => handleDeletePoint("groundsPoints", pt.id)}
                        className="no-print text-red-500 hover:text-red-700 p-1 shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dynamic Legal Rights Points */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold underline">विधिक अधिकार (Statutory Legal Rights):</span>
                  <button
                    type="button"
                    onClick={() => handleAddPoint("rightsPoints")}
                    className="no-print text-xs text-rose-700 hover:text-rose-900 font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> अधिकार बिंदु जोड़ें
                  </button>
                </div>
                <div className="space-y-2">
                  {(formData.rightsPoints || []).map((pt, idx) => (
                    <div key={pt.id} className="flex items-start gap-2 border border-slate-300 p-2 bg-slate-50/50">
                      <span className="font-bold text-xs pt-0.5">•</span>
                      <textarea
                        rows={1}
                        value={pt.text}
                        onChange={(e) => handleUpdatePoint("rightsPoints", pt.id, e.target.value)}
                        className="w-full text-xs bg-transparent outline-none resize-y"
                      />
                      <button
                        type="button"
                        onClick={() => handleDeletePoint("rightsPoints", pt.id)}
                        className="no-print text-red-500 hover:text-red-700 p-1 shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Accused Receipt Clause */}
              <div className="space-y-1">
                <span className="text-xs font-bold underline">अभियुक्त की पावती (Receipt Clause):</span>
                <textarea
                  rows={2}
                  value={formData.receiptClauseText || ""}
                  onChange={(e) => handleFieldChange("receiptClauseText", e.target.value)}
                  className="w-full text-xs p-2 border border-slate-300 outline-none resize-y italic"
                />
              </div>

              {renderWitnessesSection()}
              {renderCustomClausesSection()}
              {renderOfficerSignBlock()}
            </div>
          )}

          {/* ================= 4. PEHCHAN PATR FORMAT ================= */}
          {selectedTemplate === "pehchan_patr" && (
            <div className="space-y-6">
              {renderOfficialHeader()}

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs font-bold underline">शारीरिक लक्षण व पहचान सूची:</span>
                <button
                  type="button"
                  onClick={handleAddTraitRow}
                  className="no-print text-xs text-rose-700 hover:text-rose-900 font-bold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> लक्षण जोड़ें
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {(formData.traitsList || []).map((tr) => (
                  <div key={tr.id} className="border border-slate-300 p-2 relative group flex items-center gap-2">
                    <input
                      type="text"
                      value={tr.label}
                      onChange={(e) => handleUpdateTraitRow(tr.id, "label", e.target.value)}
                      className="font-bold text-slate-800 w-40 outline-none bg-transparent border-b border-dotted border-slate-400"
                    />
                    <input
                      type="text"
                      value={tr.value}
                      onChange={(e) => handleUpdateTraitRow(tr.id, "value", e.target.value)}
                      className="w-full outline-none bg-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => handleDeleteTraitRow(tr.id)}
                      className="no-print text-red-500 hover:text-red-700 p-1 opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>

              {renderWitnessesSection()}
              {renderCustomClausesSection()}
              {renderOfficerSignBlock()}
            </div>
          )}

          {/* ================= 5. FARD BARAMADGI ================= */}
          {selectedTemplate === "fard_baramadgi" && (
            <div className="space-y-6">
              {renderOfficialHeader()}

              <div className="flex items-center gap-2 text-xs">
                <span className="font-bold shrink-0">बरामदगी का स्थान:</span>
                <input
                  type="text"
                  value={formData.recoveryPlace || ""}
                  onChange={(e) => handleFieldChange("recoveryPlace", e.target.value)}
                  className="w-full border-b border-dotted border-slate-700 outline-none font-bold"
                />
              </div>

              <textarea
                rows={4}
                value={formData.introNarrative || ""}
                onChange={(e) => handleFieldChange("introNarrative", e.target.value)}
                className="w-full text-xs leading-relaxed p-2 border border-slate-300 outline-none resize-y"
              />

              {/* Recovery Items Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold underline">बरामदशुदा माल का विस्तृत विवरण (Inventory):</span>
                  <button
                    type="button"
                    onClick={handleAddRecoveryRow}
                    className="no-print text-xs text-rose-700 hover:text-rose-900 font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> बरामदगी जोड़ें
                  </button>
                </div>
                <table className="w-full border-collapse border border-slate-400 text-xs">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="border border-slate-400 p-2 w-12 text-center font-bold">क्र0 सं0</th>
                      <th className="border border-slate-400 p-2 text-left font-bold">बरामद सामान/नकदी का विवरण</th>
                      <th className="border border-slate-400 p-2 w-28 text-center font-bold">तादाद / संख्या</th>
                      <th className="border border-slate-400 p-2 w-44 text-left font-bold">मोहर व सीलबंद पार्सल</th>
                      <th className="no-print border border-slate-400 p-1.5 w-10 text-center"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {(formData.recoveryItems || []).map((it, idx) => (
                      <tr key={it.id}>
                        <td className="border border-slate-400 p-2 text-center">{idx + 1}</td>
                        <td className="border border-slate-400 p-2">
                          <input
                            type="text"
                            value={it.description}
                            onChange={(e) => handleUpdateRecoveryRow(it.id, "description", e.target.value)}
                            className="w-full bg-transparent outline-none"
                          />
                        </td>
                        <td className="border border-slate-400 p-2 text-center">
                          <input
                            type="text"
                            value={it.quantity}
                            onChange={(e) => handleUpdateRecoveryRow(it.id, "quantity", e.target.value)}
                            className="w-full text-center bg-transparent outline-none font-bold"
                          />
                        </td>
                        <td className="border border-slate-400 p-2">
                          <input
                            type="text"
                            value={it.sealDetails}
                            onChange={(e) => handleUpdateRecoveryRow(it.id, "sealDetails", e.target.value)}
                            className="w-full bg-transparent outline-none"
                          />
                        </td>
                        <td className="no-print border border-slate-400 p-1.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteRecoveryRow(it.id)}
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
              <div className="space-y-1">
                <span className="text-xs font-bold underline">सीलबंद कार्यवाही व नमूना मोहर:</span>
                <textarea
                  rows={2}
                  value={formData.receiptClauseText || ""}
                  onChange={(e) => handleFieldChange("receiptClauseText", e.target.value)}
                  className="w-full text-xs p-2 border border-slate-300 outline-none resize-y"
                />
              </div>

              {renderWitnessesSection()}
              {renderCustomClausesSection()}
              {renderOfficerSignBlock()}
            </div>
          )}

          {/* ================= 6. REMAND APPLICATION ================= */}
          {selectedTemplate === "remand_application" && (
            <div className="space-y-6">
              <div className="text-center space-y-1 pb-2 border-b border-slate-400">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-xs font-bold">न्यायालय:</span>
                  <input
                    type="text"
                    value={formData.courtName || ""}
                    onChange={(e) => handleFieldChange("courtName", e.target.value)}
                    className="font-bold text-sm text-center border-b border-dotted border-slate-700 outline-none w-80"
                  />
                </div>
                <input
                  type="text"
                  value={formData.docTitle || "प्रार्थना पत्र बाबत हासिल करने पुलिस हिरासत रिमांड"}
                  onChange={(e) => handleFieldChange("docTitle", e.target.value)}
                  className="text-center font-bold text-base w-full bg-transparent outline-none"
                />
                <input
                  type="text"
                  value={formData.docSubTitle || "अंतर्गत धारा 187 BNSS, 2023"}
                  onChange={(e) => handleFieldChange("docSubTitle", e.target.value)}
                  className="text-center text-xs text-slate-700 w-full bg-transparent outline-none"
                />
              </div>

              {/* Subject */}
              <div className="flex items-center gap-2 text-xs font-bold">
                <span className="shrink-0">विषय:</span>
                <input
                  type="text"
                  value={formData.subjectTitle || ""}
                  onChange={(e) => handleFieldChange("subjectTitle", e.target.value)}
                  className="w-full border-b border-dotted border-slate-700 outline-none"
                />
              </div>

              <textarea
                rows={3}
                value={formData.introNarrative || ""}
                onChange={(e) => handleFieldChange("introNarrative", e.target.value)}
                className="w-full text-xs leading-relaxed p-2 border border-slate-300 outline-none resize-y"
              />

              {/* Remand Reasons List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold underline">पुलिस रिमांड के ठोस आधार (Grounds for Police Remand):</span>
                  <button
                    type="button"
                    onClick={() => handleAddPoint("remandPoints")}
                    className="no-print text-xs text-rose-700 hover:text-rose-900 font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> रिमांड बिंदु जोड़ें
                  </button>
                </div>
                <div className="space-y-2">
                  {(formData.remandPoints || []).map((pt, idx) => (
                    <div key={pt.id} className="flex items-start gap-2 border border-slate-300 p-2 bg-slate-50/50">
                      <span className="font-bold text-xs pt-0.5">{idx + 1}.</span>
                      <textarea
                        rows={2}
                        value={pt.text}
                        onChange={(e) => handleUpdatePoint("remandPoints", pt.id, e.target.value)}
                        className="w-full text-xs bg-transparent outline-none resize-y"
                      />
                      <button
                        type="button"
                        onClick={() => handleDeletePoint("remandPoints", pt.id)}
                        className="no-print text-red-500 hover:text-red-700 p-1 shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Prayer */}
              <div className="space-y-1">
                <span className="text-xs font-bold underline">प्रार्थना (Prayer):</span>
                <textarea
                  rows={2}
                  value={formData.conclusionNarrative || ""}
                  onChange={(e) => handleFieldChange("conclusionNarrative", e.target.value)}
                  className="w-full text-xs p-2 border border-slate-300 outline-none resize-y font-bold"
                />
              </div>

              {renderCustomClausesSection()}
              {renderOfficerSignBlock()}
            </div>
          )}

          {/* ================= 7. FARD NISHANDEHI ================= */}
          {selectedTemplate === "fard_nishandehi" && (
            <div className="space-y-6">
              {renderOfficialHeader()}

              <div className="flex items-center gap-2 text-xs">
                <span className="font-bold shrink-0">निशानदेही का स्थान:</span>
                <input
                  type="text"
                  value={formData.pointingOutPlace || ""}
                  onChange={(e) => handleFieldChange("pointingOutPlace", e.target.value)}
                  className="w-full border-b border-dotted border-slate-700 outline-none font-bold"
                />
              </div>

              <textarea
                rows={3}
                value={formData.introNarrative || ""}
                onChange={(e) => handleFieldChange("introNarrative", e.target.value)}
                className="w-full text-xs leading-relaxed p-2 border border-slate-300 outline-none resize-y"
              />

              {/* Dynamic Boundaries */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold underline">चौहद्दी व सीमाएं (Boundaries):</span>
                  <button
                    type="button"
                    onClick={handleAddBoundaryRow}
                    className="no-print text-xs text-rose-700 hover:text-rose-900 font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> सीमा बिंदु जोड़ें
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {(formData.boundariesList || []).map((bd) => (
                    <div key={bd.id} className="flex items-center gap-2 border border-slate-300 p-2 bg-slate-50">
                      <input
                        type="text"
                        value={bd.direction}
                        onChange={(e) => handleUpdateBoundaryRow(bd.id, "direction", e.target.value)}
                        className="font-bold w-28 bg-transparent outline-none border-b border-dotted border-slate-400"
                      />
                      <input
                        type="text"
                        value={bd.detail}
                        onChange={(e) => handleUpdateBoundaryRow(bd.id, "detail", e.target.value)}
                        className="w-full bg-transparent outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleDeleteBoundaryRow(bd.id)}
                        className="no-print text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-bold underline">तस्दीक व सत्यापन नोट:</span>
                <textarea
                  rows={2}
                  value={formData.verificationClauseText || ""}
                  onChange={(e) => handleFieldChange("verificationClauseText", e.target.value)}
                  className="w-full text-xs p-2 border border-slate-300 outline-none resize-y"
                />
              </div>

              {renderWitnessesSection()}
              {renderCustomClausesSection()}
              {renderOfficerSignBlock()}
            </div>
          )}

          {/* ================= 8. FARD INKESAHF ================= */}
          {selectedTemplate === "fard_inkeshaf" && (
            <div className="space-y-6">
              {renderOfficialHeader()}

              <textarea
                rows={3}
                value={formData.introNarrative || ""}
                onChange={(e) => handleFieldChange("introNarrative", e.target.value)}
                className="w-full text-xs leading-relaxed p-2 border border-slate-300 outline-none resize-y"
              />

              <div className="space-y-1">
                <span className="text-xs font-bold underline">बयान अभियुक्त (In Disclosure Narrative):</span>
                <textarea
                  rows={5}
                  value={formData.disclosureNarrative || ""}
                  onChange={(e) => handleFieldChange("disclosureNarrative", e.target.value)}
                  className="w-full text-xs p-3 border border-slate-400 outline-none resize-y leading-relaxed bg-slate-50/40"
                />
              </div>

              <div className="space-y-1">
                <span className="text-xs font-bold underline">सत्यापन नोट (Verification):</span>
                <textarea
                  rows={2}
                  value={formData.verificationClauseText || ""}
                  onChange={(e) => handleFieldChange("verificationClauseText", e.target.value)}
                  className="w-full text-xs p-2 border border-slate-300 outline-none resize-y"
                />
              </div>

              {renderWitnessesSection()}
              {renderCustomClausesSection()}
              {renderOfficerSignBlock()}
            </div>
          )}

          {/* ================= 9. MEDICAL LETTER ================= */}
          {selectedTemplate === "medical_letter" && (
            <div className="space-y-6">
              {renderOfficialHeader()}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs border border-slate-300 p-3 bg-slate-50">
                <div className="flex items-center gap-2">
                  <span className="font-bold shrink-0">चिकित्सा अधिकारी:</span>
                  <input
                    type="text"
                    value={formData.medicalOfficerName || ""}
                    onChange={(e) => handleFieldChange("medicalOfficerName", e.target.value)}
                    className="w-full bg-transparent border-b border-dotted border-slate-400 outline-none font-bold"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold shrink-0">अस्पताल:</span>
                  <input
                    type="text"
                    value={formData.hospitalName || ""}
                    onChange={(e) => handleFieldChange("hospitalName", e.target.value)}
                    className="w-full bg-transparent border-b border-dotted border-slate-400 outline-none font-bold"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-bold">
                <span className="shrink-0">विषय:</span>
                <input
                  type="text"
                  value={formData.subjectTitle || ""}
                  onChange={(e) => handleFieldChange("subjectTitle", e.target.value)}
                  className="w-full border-b border-dotted border-slate-700 outline-none"
                />
              </div>

              <textarea
                rows={3}
                value={formData.introNarrative || ""}
                onChange={(e) => handleFieldChange("introNarrative", e.target.value)}
                className="w-full text-xs leading-relaxed p-2 border border-slate-300 outline-none resize-y"
              />

              {/* Dynamic Medical Points */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold underline">परीक्षण बिंदु (Medical Queries):</span>
                  <button
                    type="button"
                    onClick={() => handleAddPoint("medicalPoints")}
                    className="no-print text-xs text-rose-700 hover:text-rose-900 font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> बिंदु जोड़ें
                  </button>
                </div>
                <div className="space-y-2">
                  {(formData.medicalPoints || []).map((pt, idx) => (
                    <div key={pt.id} className="flex items-start gap-2 border border-slate-300 p-2 bg-slate-50">
                      <span className="font-bold text-xs pt-0.5">{idx + 1}.</span>
                      <textarea
                        rows={1}
                        value={pt.text}
                        onChange={(e) => handleUpdatePoint("medicalPoints", pt.id, e.target.value)}
                        className="w-full text-xs bg-transparent outline-none resize-y"
                      />
                      <button
                        type="button"
                        onClick={() => handleDeletePoint("medicalPoints", pt.id)}
                        className="no-print text-red-500 hover:text-red-700 p-1 shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Escort Staff */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold underline">साथ जाने वाले पुलिस कर्मचारी (Escort Staff):</span>
                  <button
                    type="button"
                    onClick={handleAddEscortRow}
                    className="no-print text-xs text-rose-700 hover:text-rose-900 font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> कर्मचारी जोड़ें
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {(formData.escortOfficers || []).map((esc) => (
                    <div key={esc.id} className="flex items-center gap-2 border border-slate-300 p-2 bg-slate-50">
                      <input
                        type="text"
                        value={esc.name}
                        onChange={(e) => handleUpdateEscortRow(esc.id, "name", e.target.value)}
                        className="w-full bg-transparent outline-none border-b border-dotted border-slate-400"
                        placeholder="नाम व पद"
                      />
                      <input
                        type="text"
                        value={esc.beltNo}
                        onChange={(e) => handleUpdateEscortRow(esc.id, "beltNo", e.target.value)}
                        className="w-28 bg-transparent outline-none border-b border-dotted border-slate-400"
                        placeholder="बेल्ट न0"
                      />
                      <button
                        type="button"
                        onClick={() => handleDeleteEscortRow(esc.id)}
                        className="no-print text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-bold underline">अनुरोध (Request):</span>
                <textarea
                  rows={2}
                  value={formData.conclusionNarrative || ""}
                  onChange={(e) => handleFieldChange("conclusionNarrative", e.target.value)}
                  className="w-full text-xs p-2 border border-slate-300 outline-none resize-y font-bold"
                />
              </div>

              {renderCustomClausesSection()}
              {renderOfficerSignBlock()}
            </div>
          )}

          {/* ================= 10. PESHI REMAND ================= */}
          {selectedTemplate === "peshi_remand" && (
            <div className="space-y-6">
              <div className="text-center space-y-1 pb-2 border-b border-slate-400">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-xs font-bold">न्यायालय:</span>
                  <input
                    type="text"
                    value={formData.courtName || ""}
                    onChange={(e) => handleFieldChange("courtName", e.target.value)}
                    className="font-bold text-sm text-center border-b border-dotted border-slate-700 outline-none w-80"
                  />
                </div>
                <input
                  type="text"
                  value={formData.docTitle || "प्रार्थना पत्र बाबत पेशी अभियुक्त व भेजने न्यायिक हिरासत (जेल)"}
                  onChange={(e) => handleFieldChange("docTitle", e.target.value)}
                  className="text-center font-bold text-base w-full bg-transparent outline-none"
                />
                <input
                  type="text"
                  value={formData.docSubTitle || "अंतर्गत धारा 187 BNSS, 2023"}
                  onChange={(e) => handleFieldChange("docSubTitle", e.target.value)}
                  className="text-center text-xs text-slate-700 w-full bg-transparent outline-none"
                />
              </div>

              <div className="flex items-center gap-2 text-xs font-bold">
                <span className="shrink-0">विषय:</span>
                <input
                  type="text"
                  value={formData.subjectTitle || ""}
                  onChange={(e) => handleFieldChange("subjectTitle", e.target.value)}
                  className="w-full border-b border-dotted border-slate-700 outline-none"
                />
              </div>

              <textarea
                rows={3}
                value={formData.introNarrative || ""}
                onChange={(e) => handleFieldChange("introNarrative", e.target.value)}
                className="w-full text-xs leading-relaxed p-2 border border-slate-300 outline-none resize-y"
              />

              {/* Dynamic Peshi Points */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold underline">न्यायिक हिरासत के आधार:</span>
                  <button
                    type="button"
                    onClick={() => handleAddPoint("peshiPoints")}
                    className="no-print text-xs text-rose-700 hover:text-rose-900 font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> बिंदु जोड़ें
                  </button>
                </div>
                <div className="space-y-2">
                  {(formData.peshiPoints || []).map((pt, idx) => (
                    <div key={pt.id} className="flex items-start gap-2 border border-slate-300 p-2 bg-slate-50">
                      <span className="font-bold text-xs pt-0.5">{idx + 1}.</span>
                      <textarea
                        rows={2}
                        value={pt.text}
                        onChange={(e) => handleUpdatePoint("peshiPoints", pt.id, e.target.value)}
                        className="w-full text-xs bg-transparent outline-none resize-y"
                      />
                      <button
                        type="button"
                        onClick={() => handleDeletePoint("peshiPoints", pt.id)}
                        className="no-print text-red-500 hover:text-red-700 p-1 shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-bold underline">प्रार्थना:</span>
                <textarea
                  rows={2}
                  value={formData.conclusionNarrative || ""}
                  onChange={(e) => handleFieldChange("conclusionNarrative", e.target.value)}
                  className="w-full text-xs p-2 border border-slate-300 outline-none resize-y font-bold"
                />
              </div>

              {renderCustomClausesSection()}
              {renderOfficerSignBlock()}
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
