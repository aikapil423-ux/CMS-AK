"use client";
import {blankTemplateFacts,recordedCalendarDate} from "@/lib/dataIntegrity";


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
  Save,
  Eye,
  CheckCircle2,
  Loader2,
  ExternalLink,
  X,
  Globe,
  Languages,
  Lock,
  AlertTriangle,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { Button } from "@/components/ui/button";
import { persistentFirService as firService } from "@/services/persistentFirService";
import { GeneralDiaryService } from "@/services/generalDiaryService";
import { universalEvidenceService } from "@/services/universalEvidenceService";
import { evidenceBlobStore } from "@/services/evidenceBlobStore";
import {
  ArrestMemoForm268,
  generateArrestMemo4PageHtml,
} from "@/components/fir-workspace/ArrestMemoForm268";
import { FIRItem, NoticeFormData, FIRDocumentItem } from "@/types";
import { FIRWorkspaceNav } from "@/components/fir-workspace/FIRWorkspaceNav";
import { formatDate } from "@/lib/utils";
import { printA4Element, downloadA4DocumentAsHtml } from "@/utils/printElement";
import {
  useTableResize,
  TableColResizer,
  TableRowResizer,
  TableResizeToolbar,
} from "@/components/fir-workspace/TableResizeHelper";

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

  // Haryana Police Fard Specific Fields (Templates 2, 5, 7, 8 matching photo format)
  policePost?: string;
  districtHeader?: string;
  complainantLine?: string;
  accusedLine?: string;
  firDetailsLine?: string;
  fardTitle?: string;
  accusedSign?: string;
  accusedLabel?: string;
  accusedLineSign?: string;
  gazettedOfficerSign?: string;
  gazettedOfficerLabel?: string;
  stampThanaName?: string;
  stampDistrictName?: string;
  ioSign?: string;
  ioStationLabel?: string;
  ioDistrictLabel?: string;
  ioDate?: string;

  // Form 26.8(1) Specific Fields
  headerVersion?: string;
  arrestYear?: string;
  arrestGdNo?: string;
  arrestPlace?: string;
  arrestThana?: string;
  arrestDistrict?: string;
  courtNameSurrender?: string;
  accusedGender?: string;
  userIdentificationNo?: string;
  occupation?: string;
  noticeeCity?: string;
  noticeeDistrict?: string;
  noticeeState?: string;
  permanentAddress?: string;
  permanentCity?: string;
  permanentDistrict?: string;
  permanentState?: string;
  custodyIntimationDate?: string;
  custodyIntimationTime?: string;
  custodyPlace?: string;
  warisanName?: string;
  warisanRelation?: string;
  warisanDate?: string;
  warisanTime?: string;
  warisanMobile?: string;
  familyMember1?: string;
  familyMember2?: string;
  familyMember3?: string;
  groundsSections?: string;
  groundsRole?: string;
  groundsEvidence?: string;
  groundsOther?: string;
  accusedSign1?: string;
  witnessSign1?: string;
  witnessSign2?: string;
  accusedSign2?: string;
  signPlace?: string;
  signDate?: string;
  pehchanThana?: string;
  pehchanDistrict?: string;
  accusedPhotoUrl?: string;
  stateVsName?: string;
  caseYear?: string;
  caseSections?: string;
  caseThana?: string;
  caseBanam?: string;
  trait1Height?: string;
  trait2Build?: string;
  trait3Color?: string;
  trait4Eyes?: string;
  trait5Hair?: string;
  trait6BeardMustache?: string;
  trait7Nose?: string;
  trait8Face?: string;
  trait9Teeth?: string;
  trait10Mole?: string;
  trait11Scars?: string;
  trait12Deformities?: string;
  trait13Tattoo?: string;
  trait14Language?: string;
  trait15Dress?: string;
  trait16Habits?: string;
  trait17Voice?: string;
  trait18PehchanChinh?: string;
  otherTraitsDetails?: string;
  fingerprintsTaken?: string;
  livingStandard?: string;
  education?: string;
  socioOccupation?: string;
  incomeGroup?: string;
  isDangerous?: string;
  escapedBailEarlier?: string;
  carriesWeapon?: string;
  activeWithAssociates?: string;
  isListedCriminal?: string;
  isHabitualCriminal?: string;
  escapeRiskDuringBail?: string;
  threatRiskAfterBail?: string;
  wantedInOtherCrime?: string;
  caseReferenceIfYes?: string;
  previousRecord1?: string;
  previousRecord2?: string;
  previousRecord3?: string;
  eagleCriminalId?: string;
  mhcName?: string;
  mhcRank?: string;
  mhcBeltNo?: string;
  articlesHandedOverToMhc?: string;
  mhcSignRankPno?: string;
  mhcDepositDate?: string;
  grounds47Other?: string;

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

  [key: string]: any;
};

export type TemplateLanguage = "hi" | "en";

const TEMPLATE_CONFIG: Record<
  ArrestDocTemplateType,
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
  arrest_memo: {
    labelHi: "1. गिरफ्तारी/ न्यायालय समर्पण फार्म संख्या 26.8(1) (4 पृष्ठ)",
    labelEn: "1. Arrest / Surrender in Court Memo Form 26.8(1) (4 Pages)",
    label: "1. गिरफ्तारी/ न्यायालय समर्पण फार्म संख्या 26.8(1) (4 पृष्ठ)",
    badge: "फार्म 26.8(1)",
    subTitle: "गिरफ्तारी/न्यायालय समर्पण फार्म भाग-1 व 2, धारा 47 BNSS, जामा तलाशी, पहचान पत्र व 18-शारीरिक लक्षण",
    description: "Statutory 4-page memo recording arrest, intimation to family, Section 47 BNSS grounds, Jama Talashi & MHC records",
    icon: ShieldAlert,
    color: "text-rose-600",
  },
  fard_jamatalashi: {
    labelHi: "2. फर्द जामातलाशी अभियुक्त (धारा 50 BNSS / 51 CrPC)",
    labelEn: "2. Personal Search Memo - Fard Jamatalashi (Sec 50 BNSS / 51 CrPC)",
    label: "2. फर्द जामातलाशी अभियुक्त (धारा 50 BNSS / 51 CrPC)",
    badge: "धारा 50 BNSS",
    subTitle: "फर्द जामातलाशी अभियुक्त (Search of Arrested Person & Inventory of Seized Personal Effects)",
    description: "Personal search memo recording all articles, cash, documents and personal effects seized from accused",
    icon: ClipboardList,
    color: "text-amber-600",
  },
  grounds_of_arrest: {
    labelHi: "3. गिरफ्तारी के आधार की लिखित सूचना (धारा 47 BNSS / Art 22(1))",
    labelEn: "3. Notice of Grounds of Arrest (Sec 47 BNSS / Art 22(1))",
    label: "3. गिरफ्तारी के आधार की लिखित सूचना (धारा 47 BNSS / Art 22(1))",
    badge: "धारा 47 BNSS",
    subTitle: "गिरफ्तारी के आधार की लिखित सूचना एवं कानूनी अधिकारों की पावती (Notice of Grounds of Arrest)",
    description: "Statutory notice communicating specific grounds of arrest, bailable/non-bailable nature and legal aid rights",
    icon: FileText,
    color: "text-blue-600",
  },
  pehchan_patr: {
    labelHi: "4. पहचान पत्र व शारीरिक हुलिया प्रपत्र (Accused Identification Memo)",
    labelEn: "4. Accused Identification Memo & Descriptive Roll (Sec 54 BNSS)",
    label: "4. पहचान पत्र व शारीरिक हुलिया प्रपत्र (Accused Identification Memo)",
    badge: "धारा 54 BNSS",
    subTitle: "अभियुक्त पहचान पत्र व 18 शारीरिक हुलिया/पहचान चिन्ह प्रपत्र (Identification & Descriptive Roll)",
    description: "Formal identification roll recording physical traits, scars, moles, build, photo box & identity witnesses",
    icon: User,
    color: "text-purple-600",
  },
  fard_baramadgi: {
    labelHi: "5. फर्द बरामदगी / जब्ती सूची (धारा 23(2) BSA / 27 Evidence Act)",
    labelEn: "5. Seizure & Recovery Memo upon Disclosure (Sec 23(2) BSA / 27 Evidence Act)",
    label: "5. फर्द बरामदगी / जब्ती सूची (धारा 23(2) BSA / 27 Evidence Act)",
    badge: "धारा 23(2) BSA",
    subTitle: "फर्द बरामदगी / जब्ती सूची मय सीलबंद नमूना मोहर (Seizure & Recovery Memo upon Disclosure)",
    description: "Official recovery memo of weapon/stolen property/incriminating items recovered upon accused's disclosure statement",
    icon: Layers,
    color: "text-emerald-600",
  },
  remand_application: {
    labelHi: "6. पुलिस हिरासत रिमांड प्रार्थना पत्र (धारा 187 BNSS / 167 CrPC)",
    labelEn: "6. Police Custody Remand Application (Sec 187 BNSS / 167 CrPC)",
    label: "6. पुलिस हिरासत रिमांड प्रार्थना पत्र (धारा 187 BNSS / 167 CrPC)",
    badge: "धारा 187 BNSS",
    subTitle: "प्रार्थना पत्र बाबत हासिल करने पुलिस हिरासत रिमांड (Application for Police Custody Remand)",
    description: "Application before Judicial Magistrate requesting police custody remand with specific justification points",
    icon: Scale,
    color: "text-red-600",
  },
  fard_nishandehi: {
    labelHi: "7. फर्द निशानदेही मौका/स्थान (Pointing Out & Demarcation Memo)",
    labelEn: "7. Pointing Out & Demarcation Memo (Fard Nishandehi)",
    label: "7. फर्द निशानदेही मौका/स्थान (Pointing Out & Demarcation Memo)",
    badge: "निशानदेही प्रपत्र",
    subTitle: "फर्द निशानदेही मौका-ए-वारदात अथवा माल मसरूका छिपाने का स्थान (Pointing Out Memo)",
    description: "Demarcation memo where accused leads police party and points out scene of crime or hidden articles",
    icon: MapPin,
    color: "text-teal-600",
  },
  fard_inkeshaf: {
    labelHi: "8. फर्द इंकिशाफ / इकबालिया बयान (धारा 23(2) BSA / 27 Evidence Act)",
    labelEn: "8. Voluntary Disclosure Statement Memo (Sec 23(2) BSA / 27 Evidence Act)",
    label: "8. फर्द इंकिशाफ / इकबालिया बयान (धारा 23(2) BSA / 27 Evidence Act)",
    badge: "धारा 23(2) BSA",
    subTitle: "फर्द इंकिशाफ / इकबालिया बयान अभियुक्त (Voluntary Disclosure Statement Leading to Recovery)",
    description: "Voluntary statement made in police custody disclosing hidden weapon/articles known exclusively to accused",
    icon: FileCheck2,
    color: "text-indigo-600",
  },
  medical_letter: {
    labelHi: "9. चिकित्सीय परीक्षण पत्र / MLR Request (धारा 51 BNSS / 53-54 CrPC)",
    labelEn: "9. Accused Medical Examination Request (MLR - Sec 51 BNSS / 53-54 CrPC)",
    label: "9. चिकित्सीय परीक्षण पत्र / MLR Request (धारा 51 BNSS / 53-54 CrPC)",
    badge: "धारा 51 BNSS",
    subTitle: "प्रार्थना पत्र बाबत डाक्टरी मुलाहिजा / चिकित्सीय परीक्षण (Request for Accused Medical Examination)",
    description: "Formal requisition addressed to Medical Officer/Civil Hospital for mandatory medical examination of arrested accused",
    icon: Activity,
    color: "text-sky-600",
  },
  peshi_remand: {
    labelHi: "10. पेशी रिमांड / न्यायिक हिरासत प्रार्थना पत्र (Judicial Remand)",
    labelEn: "10. Judicial Custody Remand Application (Peshi Remand - Jail)",
    label: "10. पेशी रिमांड / न्यायिक हिरासत प्रार्थना पत्र (Judicial Remand)",
    badge: "न्यायिक हिरासत",
    subTitle: "प्रार्थना पत्र बाबत पेशी अभियुक्त व भेजने न्यायिक हिरासत (जिला कारागार) (Judicial Custody Application)",
    description: "Application for production of accused after police remand requesting dispatch to Judicial Custody (Jail)",
    icon: Scale,
    color: "text-slate-700",
  },
};

const DEFAULT_SAMPLE_DATA_HI: Record<ArrestDocTemplateType, ArrestDocsFormData> = {
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
    arrestThana: "थाना शहर पानीपत",
    arrestDistrict: "पानीपत",
    courtNameSurrender: "लागू नहीं (पुलिस द्वारा हिरासत में लिया गया)",
    noticeeName: "विकास शर्मा",
    noticeeFather: "रमेश चंद शर्मा",
    noticeeAlias1: "विक्की",
    noticeeNationality: "भारतीय",
    noticeeAge: "34 वर्ष",
    noticeeDob: "12.05.1992",
    noticeeBirthPlace: "पानीपत",
    accusedGender: "पुरुष",
    userIdentificationNo: "8492-3810-4921",
    noticeePhone: "9812044551",
    occupation: "दुकानदार / खुदरा व्यापार",
    noticeeAddress: "मकान न0 412, सेक्टर 7",
    noticeeCity: "अर्बन एस्टेट, पानीपत",
    noticeeDistrict: "पानीपत",
    noticeeState: "हरियाणा",
    permanentAddress: "मकान न0 412, सेक्टर 7",
    permanentCity: "अर्बन एस्टेट, पानीपत",
    permanentDistrict: "पानीपत",
    permanentState: "हरियाणा",
    physicalConditionOrInjuries: "शारीरिक दशा सामान्य है। कोई ताजा जाहिरा चोट नहीं है। (सामान्य डाक्टरी मुलाहिजा करवाया गया)",

    custodyIntimationDate: "18.09.2026",
    custodyIntimationTime: "11:30 प्रात:",
    custodyPlace: "रेलवे रोड चौक, पानीपत",

    warisanName: "अमित शर्मा",
    warisanRelation: "भाई",
    warisanDate: "18.09.2026",
    warisanTime: "11:45 प्रात:",
    warisanMobile: "9812099881",
    familyMember1: "रमेश चंद शर्मा (पिता), उम्र 62 वर्ष, निवासी पानीपत",
    familyMember2: "शांति देवी (माता), उम्र 58 वर्ष, निवासी पानीपत",
    familyMember3: "अमित शर्मा (भाई), उम्र 31 वर्ष, मोबाइल 9812099881",

    groundsSections: "धारा 318(4), 316(2), 351(2) BNS, 2023",
    groundsRole: "परिवादी के साथ 4,50,000/- रुपये की धोखाधड़ी करने एवं अमानत में खयानत करने तथा जान से मारने की धमकी देने में मुख्य भूमिका।",
    groundsEvidence: "प्रत्यक्षदर्शी परिवादी का बयान, बैंक खाता ट्रांजेक्शन विवरण व तकनीकी कॉल डिटेल रिकॉर्ड (CDR)",
    groundsOther: "आरोपी द्वारा गवाहों को धमकाने एवं फरार होने की संभावना को रोकने हेतु।",

    arrestWitnesses: [
      { id: "wit_1", name: "बलजीत सिंह सुपुत्र हरनाम सिंह", address: "वार्ड न0 5, पानीपत", signature: "बलजीत सिंह" },
      { id: "wit_2", name: "रमेश लाल सुपुत्र वेद प्रकाश", address: "न्यू बस स्टैंड, पानीपत", signature: "रमेश लाल" },
    ],

    jamaTalashiItems: [
      { id: "jt_1", srNo: "1.", description: "नकदी रुपये 1,450/- (एक हजार चार सौ पचास रुपये)", quantity: "1,450/-" },
      { id: "jt_2", srNo: "2.", description: "एक मोबाइल फोन सैमसंग गैलेक्सी (नीला रंग, चालू हालत)", quantity: "1" },
      { id: "jt_3", srNo: "3.", description: "पर्स चमड़ा भूरा रंग मय आधार कार्ड व ड्राइविंग लाइसेंस", quantity: "1" },
    ],

    accusedSign1: "विकास शर्मा",
    witnessSign1: "बलजीत सिंह",
    witnessSign2: "रमेश लाल",
    accusedSign2: "विकास शर्मा",
    signPlace: "थाना शहर पानीपत",
    signDate: "18.09.2026",

    officerName: "सुरेंद्र पाल",
    officerRank: "उप-निरीक्षक (SI)",
    officerPno: "04291885",
    officerPhone: "9812034567",

    pehchanThana: "थाना शहर पानीपत",
    pehchanDistrict: "पानीपत",
    stateVsName: "सरकार बनाम विकास शर्मा",
    caseYear: "2026",
    caseSections: "धारा 318(4), 316(2), 351(2) BNS, 2023",
    caseThana: "थाना शहर पानीपत",
    caseBanam: "विकास शर्मा सुपुत्र रमेश चंद शर्मा",

    trait1Height: "5 फीट 8 इंच (173 सेमी)",
    trait2Build: "मध्यम मजबूत",
    trait3Color: "गेहुंआ",
    trait4Eyes: "काली",
    trait5Hair: "काले छोटे",
    trait6BeardMustache: "हल्की दाढ़ी व मूंछ",
    trait7Nose: "सीधी मध्यम",
    trait8Face: "गोल-अंडाकार",
    trait9Teeth: "सामान्य सफेद",
    trait10Mole: "बाएं गाल पर काला तिल",
    trait11Scars: "दाहिनी भौंह पर पुराना 1 इंच कट का निशान",
    trait12Deformities: "कोई विकृति नहीं",
    trait13Tattoo: "दाहिने हाथ की कलाई पर 'ॐ' गुदा हुआ",
    trait14Language: "हिन्दी / हरियाणवी",
    trait15Dress: "नीली जींस व सफेद शर्ट",
    trait16Habits: "साधारण / कोई विशेष आदत नहीं",
    trait17Voice: "सामान्य भारी",
    trait18PehchanChinh: "बाएं गाल पर तिल व दाहिनी भौंह पर कट का निशान",
    otherTraitsDetails: "चाल सामान्य, कोई लंगड़ाहट नहीं",

    fingerprintsTaken: "हाँ",
    livingStandard: "मध्यम वर्गीय",
    education: "स्नातक (B.Com)",
    socioOccupation: "दुकानदार / खुदरा व्यापार",
    incomeGroup: "मध्यम आय (वार्षिक आय लगभग ₹ 4-5 लाख)",

    isDangerous: "नही",
    escapedBailEarlier: "नही",
    carriesWeapon: "नही",
    activeWithAssociates: "हाँ",
    isListedCriminal: "नही",
    isHabitualCriminal: "नही",
    escapeRiskDuringBail: "नही",
    threatRiskAfterBail: "हाँ",
    wantedInOtherCrime: "नही",
    caseReferenceIfYes: "लागू नहीं",

    previousRecord1: "कोई पूर्व आपराधिक मामला दर्ज नहीं है (Clean Record)",
    previousRecord2: "-",
    previousRecord3: "-",
    eagleCriminalId: "EAGLE-HR-2026-08492",
    mhcName: "रमेश कुमार",
    mhcRank: "हेड कांस्टेबल (MHC)",
    mhcBeltNo: "23114/पानीपत",

    articlesHandedOverToMhc: "उपरोक्त जामातलाशी का सम्पूर्ण सामान बमुताबिक फर्द थाना मालखाना मोहर्रिर (MHC) को सुरक्षित रखवाया गया।",
    mhcSignRankPno: "MHC HC रमेश कुमार, PNO-23114, थाना शहर पानीपत",
    mhcDepositDate: "18.09.2026",
    stateVs: "हरियाणा राज्य",
    gender: "पुरुष",
    dobOrYear: "12.05.1992",
    bodyBuild: "मध्यम मजबूत",
    heightCm: "173 सेमी (5 फीट 8 इंच)",
    complexionBloodGroup: "गेहुंआ / बी+वे",
    identificationMarks: "बाएं गाल पर तिल व दाहिनी भौंह पर कट का निशान",
    deformities: "कोई विकृति नहीं",
    teeth: "सामान्य सफेद",
    hair: "काले छोटे",
    eyes: "काली",
    habits: "साधारण / कोई विशेष आदत नहीं",
    dress: "नीली जींस व सफेद शर्ट",
    languageDialect: "हिन्दी / हरियाणवी",
    burnMark: "कोई नहीं",
    leukodermaSpots: "कोई नहीं",
    mole: "बाएं गाल पर काला तिल",
    wound: "दाहिनी भौंह पर पुराना 1 इंच कट का निशान",
    tattooMark: "दाहिने हाथ की कलाई पर 'ॐ' गुदा हुआ",
    otherTraitsDesc: "चाल सामान्य, कोई लंगड़ाहट नहीं",
    customClauses: [],
  },

  fard_jamatalashi: {
    headerDept: "हरियाणा पुलिस",
    policePost: "थाना साईबर क्राईम",
    districtHeader: "जिला पानीपत",
    complainantLine: "शिकायतकर्ता- प्रवीन पुत्र सुरेश निवासी गांव डाहर जिला पानीपत ।",
    accusedLine: "विरुद्ध- सावन पुत्र जयकंवर निवासी गांव खानपुर कला तहसील गोहाना जिला सोनीपत ।",
    firDetailsLine: "अभियोग न० 60 दिनांक 04.06.25 धारा 318(4) BNS थाना साईबर क्राईम पानीपत ।",
    fardTitle: "फ़र्द जामातलाशी अभियुक्त सावन",
    docTitle: "फ़र्द जामातलाशी अभियुक्त सावन",
    docSubTitle: "अंतर्गत धारा 50 भारतीय नागरिक सुरक्षा संहिता (BNSS), 2023",
    noticeeName: "सावन",
    noticeeFather: "जयकंवर",
    noticeeAddress: "गांव खानपुर कला तहसील गोहाना जिला सोनीपत",
    complainantName: "प्रवीन",
    complainantFather: "सुरेश",
    complainantAddress: "गांव डाहर जिला पानीपत",
    complaintNo: "60",
    issueDate: "04.06.25",
    sectionsOfLaw: "318(4) BNS",
    policeStation: "थाना साईबर क्राईम पानीपत",
    district: "जिला पानीपत",
    introNarrative: `निम्नलिखित साक्षियों के सामने अभियोग उपरोक्त में पुलिस अभिरक्षा में आरोपी सावन पुत्र जयकंवर निवासी गांव खानपुर कला तहसील गोहाना जिला सोनीपत की जामातलाशी विधिनुसार अमल में लाई गई। दौराने जामातलाशी आरोपी के कब्जा व जिस्मानी जामा से निम्नलिखित सामान, नकदी व मोबाइल बरामद हुए:`,
    jamaTalashiItems: [
      { id: "jt_1", srNo: "1.", description: "नकदी भारतीय मुद्रा कुल ₹2,000/- रुपये (500 के कुल 4 नोट, अपराध की एवज में प्राप्त राशि)", quantity: "2,000/-", identification: "नोट नंबर अंकित" },
      { id: "jt_2", srNo: "2.", description: "एक मोबाइल फोन मार्क वीवो रंग नीला मय सिम कार्ड चालू हालत (वारदात में प्रयुक्त)", quantity: "1", identification: "IMEI: 864920194820194" },
      { id: "jt_3", srNo: "3.", description: "पर्स जिसमें आधार कार्ड (सावन पुत्र जयकंवर) व व्यक्तिगत दस्तावेज", quantity: "1", identification: "पहचान पत्र" },
    ],
    receiptClauseText: "जामातलाशी में बरामद उपरोक्त संपूर्ण सामान को कब्जा पुलिस में लेकर फ़र्द जामातलाशी तैयार की गई। जिस पर आरोपी व साक्षी ने अपने-अपने हस्ताक्षर किए।",
    accusedSign: "सावन",
    accusedLineSign: "आरोपी- सावन पुत्र जयकंवर",
    arrestWitnesses: [
      { id: "wit_1", name: "साक्षी- HC Moninder No.1630/PPT", address: "", signature: "Moninder" },
    ],
    ioSign: "IO Sign",
    ioStationLabel: "थाना साईबर क्राईम",
    ioDistrictLabel: "जिला पानीपत",
    ioDate: "दिनांक 09.06.25",
    stampThanaName: "PS. CYBER CRIME",
    stampDistrictName: "PANIPAT",
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
    policePost: "थाना साईबर क्राईम",
    districtHeader: "जिला पानीपत",
    complainantLine: "शिकायतकर्ता- प्रवीन पुत्र सुरेश निवासी गांव डाहर जिला पानीपत ।",
    accusedLine: "विरुद्ध- सावन पुत्र जयकंवर निवासी गांव खानपुर कला तहसील गोहाना जिला सोनीपत ।",
    firDetailsLine: "अभियोग न० 60 दिनांक 04.06.25 धारा 318(4) BNS थाना साईबर क्राईम पानीपत ।",
    fardTitle: "फ़र्द बरामदगी माल मुकदमा आरोपी सावन",
    docTitle: "फ़र्द बरामदगी माल मुकदमा आरोपी सावन",
    docSubTitle: "अंतर्गत धारा 23(2) भारतीय साक्ष्य अधिनियम, 2023",
    noticeeName: "सावन",
    noticeeFather: "जयकंवर",
    noticeeAddress: "गांव खानपुर कला तहसील गोहाना जिला सोनीपत",
    recoveryPlace: "गामडी मोड़, खानपुर कलां, गोहाना से",
    complainantName: "प्रवीन",
    complainantFather: "सुरेश",
    complainantAddress: "गांव डाहर जिला पानीपत",
    complaintNo: "60",
    issueDate: "04.06.25",
    sectionsOfLaw: "318(4) BNS",
    policeStation: "थाना साईबर क्राईम पानीपत",
    district: "जिला पानीपत",
    introNarrative: `निम्नलिखित साक्षियों के सामने अभियोग उपरोक्त में आरोपी सावन पुत्र जयकंवर निवासी गांव खानपुर कला तहसील गोहाना जिला सोनीपत द्वारा अपने इकबालिया बयान के अनुसार बताए गए स्थान से वारदात में प्रयुक्त सिम कार्ड व नकदी की बरामदगी विधिनुसार अमल में लाई गई:`,
    recoveryItems: [
      { id: "rec_1", srNo: "1.", description: "एक एयरटेल सिम कार्ड मोबाइल न० 9518061533 (साईबर ठगी में प्रयुक्त)", quantity: "1", sealDetails: "डिब्बे में सीलबंद मोहर 'IO'" },
      { id: "rec_2", srNo: "2.", description: "अपराध से प्राप्त नकदी कुल ₹2,000/- रुपये (500 के कुल 4 नोट)", quantity: "2,000/-", sealDetails: "लिफाफे में सीलबंद मोहर 'IO'" },
    ],
    receiptClauseText: "उपरोक्त बरामदशुदा माल को साक्षी के समक्ष सीलबंद किया गया। नमूना मोहर सुरक्षित रखी गई। जिस पर आरोपी व साक्षी ने अपने-अपने हस्ताक्षर किए।",
    accusedSign: "सावन",
    accusedLineSign: "आरोपी- सावन पुत्र जयकंवर",
    arrestWitnesses: [
      { id: "wit_1", name: "साक्षी- HC Moninder No.1630/PPT", address: "", signature: "Moninder" },
    ],
    ioSign: "IO Sign",
    ioStationLabel: "थाना साईबर क्राईम",
    ioDistrictLabel: "जिला पानीपत",
    ioDate: "दिनांक 09.06.25",
    stampThanaName: "PS. CYBER CRIME",
    stampDistrictName: "PANIPAT",
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
    policePost: "थाना साईबर क्राईम",
    districtHeader: "जिला पानीपत",
    complainantLine: "शिकायतकर्ता- प्रवीन पुत्र सुरेश निवासी गांव डाहर जिला पानीपत ।",
    accusedLine: "विरुद्ध- सावन पुत्र जयकंवर निवासी गांव खानपुर कला तहसील गोहाना जिला सोनीपत ।",
    firDetailsLine: "अभियोग न० 60 दिनांक 04.06.25 धारा 318(4) BNS थाना साईबर क्राईम पानीपत ।",
    fardTitle: "फ़र्द निशानदेही मौका आरोपी सावन",
    docTitle: "फ़र्द निशानदेही मौका आरोपी सावन",
    docSubTitle: "अंतर्गत धारा 23(2) भारतीय साक्ष्य अधिनियम, 2023",
    noticeeName: "सावन",
    noticeeFather: "जयकंवर",
    noticeeAddress: "गांव खानपुर कला तहसील गोहाना जिला सोनीपत",
    pointingOutPlace: "गामडी मोड़ बस अड्डा (सिम कार्ड देने व नकदी प्राप्त करने का स्थान)",
    complainantName: "प्रवीन",
    complainantFather: "सुरेश",
    complainantAddress: "गांव डाहर जिला पानीपत",
    complaintNo: "60",
    issueDate: "04.06.25",
    sectionsOfLaw: "318(4) BNS",
    policeStation: "थाना साईबर क्राईम पानीपत",
    district: "जिला पानीपत",
    introNarrative: `निम्नलिखित साक्षियों के सामने आरोपी सावन पुत्र जयकंवर निवासी गांव खानपुर कला तहसील गोहाना जिला सोनीपत ने पुलिस पार्टी व साक्षी को ले जाकर उस स्थान की निशानदेही कराई जहाँ उसने दिपांशु को सिम कार्ड सौंपा था तथा ₹2,000/- नकद लिए थे। उक्त निशानदेही मौका की सीमाएं निम्न प्रकार हैं:`,
    boundariesList: [
      { id: "bd_1", direction: "पूर्व (East)", detail: "मुख्य सड़क गोहाना-पानीपत मार्ग" },
      { id: "bd_2", direction: "पश्चिम (West)", detail: "गामडी बस स्टॉप यात्री शेड" },
      { id: "bd_3", direction: "उत्तर (North)", detail: "चाय की दुकान (मदन लाल)" },
      { id: "bd_4", direction: "दक्षिण (South)", detail: "कृषि भूमि (रामेश्वर)" },
    ],
    verificationClauseText: "उक्त निशानदेही आरोपी सावन ने साक्षी के समक्ष स्वेच्छा से कराई है। मौके पर फर्द निशानदेही तैयार की गई जिस पर आरोपी व साक्षी ने अपने-अपने हस्ताक्षर किए।",
    accusedSign: "सावन",
    accusedLineSign: "आरोपी- सावन पुत्र जयकंवर",
    arrestWitnesses: [
      { id: "wit_1", name: "साक्षी- HC Moninder No.1630/PPT", address: "", signature: "Moninder" },
    ],
    ioSign: "IO Sign",
    ioStationLabel: "थाना साईबर क्राईम",
    ioDistrictLabel: "जिला पानीपत",
    ioDate: "दिनांक 09.06.25",
    stampThanaName: "PS. CYBER CRIME",
    stampDistrictName: "PANIPAT",
    customClauses: [],
  },

  fard_inkeshaf: {
    headerDept: "हरियाणा पुलिस",
    policePost: "थाना साईबर क्राईम",
    districtHeader: "जिला पानीपत",
    complainantLine: "शिकायतकर्ता- प्रवीन पुत्र सुरेश निवासी गांव डाहर जिला पानीपत ।",
    accusedLine: "विरुद्ध- सावन पुत्र जयकंवर निवासी गांव खानपुर कला तहसील गोहाना जिला सोनीपत ।",
    firDetailsLine: "अभियोग न० 60 दिनांक 04.06.25 धारा 318(4) BNS थाना साईबर क्राईम पानीपत ।",
    fardTitle: "अपराध स्वीकार कथन आरोपी सावन",
    docTitle: "अपराध स्वीकार कथन आरोपी सावन (फर्द इंकिशाफ)",
    docSubTitle: "अंतर्गत धारा 23(2) भारतीय साक्ष्य अधिनियम, 2023 / धारा 27 साक्ष्य अधिनियम",
    noticeeName: "सावन",
    noticeeFather: "जयकंवर",
    noticeeAddress: "गांव खानपुर कला तहसील गोहाना जिला सोनीपत",
    complainantName: "प्रवीन",
    complainantFather: "सुरेश",
    complainantAddress: "गांव डाहर जिला पानीपत",
    complaintNo: "60",
    issueDate: "04.06.25",
    sectionsOfLaw: "318(4) BNS",
    policeStation: "थाना साईबर क्राईम पानीपत",
    district: "जिला पानीपत",
    introNarrative: `निम्नलिखित साक्षियो के सामने अभियोग उपरोक्त मे पुलिस अभिरक्षा मे आरोपी सावन पुत्र जयकंवर निवासी गांव खानपुर कला तहसील गोहाना जिला सोनीपत ने अपनी मर्जी से बिना किसी डर भय दबाव लोभ लालच के अपना अपराध स्वीकार कथन अंकित करवाया कि मै उपरोक्त नाम पते का रहने वाला हु व मजदूरी करता हूं। मै अविवाहित हूं। मेरा दिपांशु पुत्र जगपाल निवासी गांव गामडी जो मेरा दोस्त है। गामडी गांव मेरे गांव के साथ लगता ही है। अप्रैल माह मे दिपांशु ने मुझसे कहा कि उसके रोहतक के कुछ यार दोस्त है जो जिसके पास USDT या क्रिप्टोबैरेशी है उसके साथ साईबर फ्राड करके USDT चुराते है। उसने मुझसे कहा कि उन्हे कालिंग के लिये सिमो की आवश्यकता है। उसने मुझसे यह कहा कि अगर मै उसे मेरे नाम पर सिम निकलवाकर दुगां तो उसके बदले मुझे 2000 हजार रुपये मिलेगे। मैने लालच मे आकर मेरे नाम पर एक सिम जिसका नम्बर 9518061533 निकलवाकर अप्रैल माह 2025 मे दिपांशु को दे दी। दिपांशु ने इसके बदले मुझे 2000 रुपये कैश दिये। जो पैसे मुझे सिम बेचने के लिये मिले थे वह मैने खाने पीने में खर्च कर दिये। आज आपने दिपांशु व मुझे एक साथ पकड़ लिया है। मेरा सिम कहा गया है किसके पास गया है उसके बारे मे दिपांशु ही बता सकता है। जो आरोपी सावन पुत्र जयकंवर निवासी गांव खानपुर कला तहसील गोहाना जिला सोनीपत का अपराध स्वीकार कथन अंकित किया गया। जिस पर आरोपी व साक्षी ने अपने हस्ताक्षर किये।`,
    accusedSign: "सावन",
    accusedLineSign: "आरोपी- सावन पुत्र जयकंवर",
    arrestWitnesses: [
      { id: "wit_1", name: "साक्षी- HC Moninder No.1630/PPT", address: "", signature: "Moninder" },
    ],
    ioSign: "IO Sign",
    ioStationLabel: "थाना साईबर क्राईम",
    ioDistrictLabel: "जिला पानीपत",
    ioDate: "दिनांक 09.06.25",
    stampThanaName: "PS. CYBER CRIME",
    stampDistrictName: "PANIPAT",
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

const DEFAULT_SAMPLE_DATA_EN: Record<ArrestDocTemplateType, ArrestDocsFormData> = {
  arrest_memo: {
    headerDept: "HARYANA POLICE",
    headerGovt: "FORM NO. 26.8(1)",
    docTitle: "ARREST / SURRENDER IN COURT MEMO",
    docSubTitle: "Part-1 Form No. 26.8(1) (Separate Form for Each Accused)",
    headerVersion: "v3.0 dt 07.04.2025",
    district: "Panipat",
    policeStation: "PS City Panipat",
    arrestYear: "2026",
    complaintNo: "128/2026",
    issueDate: "18.09.2026",
    incidentDate: "18.09.2026",
    sectionsOfLaw: "Section 318(4), 316(2), 351(2) BNS, 2023",

    arrestDate: "18.09.2026",
    arrestTime: "11:30 AM",
    arrestGdNo: "GD Report No. 24",
    arrestPlace: "Railway Road Chowk, Panipat",
    arrestThana: "PS City Panipat",
    arrestDistrict: "Panipat",
    courtNameSurrender: "Not Applicable (Apprehended by Police)",
    noticeeName: "Vikas Sharma",
    noticeeFather: "Ramesh Chand Sharma",
    noticeeAlias1: "Vicky",
    noticeeNationality: "Indian",
    noticeeAge: "34 Years",
    noticeeDob: "12.05.1992",
    noticeeBirthPlace: "Panipat",
    accusedGender: "Male",
    userIdentificationNo: "8492-3810-4921",
    noticeePhone: "9812044551",
    occupation: "Shopkeeper / Retail Trader",
    noticeeAddress: "House No. 412, Sector 7",
    noticeeCity: "Urban Estate, Panipat",
    noticeeDistrict: "Panipat",
    noticeeState: "Haryana",
    permanentAddress: "House No. 412, Sector 7",
    permanentCity: "Urban Estate, Panipat",
    permanentDistrict: "Panipat",
    permanentState: "Haryana",
    physicalConditionOrInjuries: "Physical condition is normal. No fresh visible external injuries. (Routine medical examination conducted)",

    custodyIntimationDate: "18.09.2026",
    custodyIntimationTime: "11:30 AM",
    custodyPlace: "Railway Road Chowk, Panipat",

    warisanName: "Amit Sharma",
    warisanRelation: "Brother",
    warisanDate: "18.09.2026",
    warisanTime: "11:45 AM",
    warisanMobile: "9812099881",
    familyMember1: "Ramesh Chand Sharma (Father), Age 62 Years, r/o Panipat",
    familyMember2: "Shanti Devi (Mother), Age 58 Years, r/o Panipat",
    familyMember3: "Amit Sharma (Brother), Age 31 Years, Mobile 9812099881",

    groundsSections: "Section 318(4), 316(2), 351(2) BNS, 2023",
    groundsRole: "Active role in defrauding complainant of Rs. 4,50,000/-, criminal breach of trust and extending criminal intimidation.",
    groundsEvidence: "Statement of complainant, bank account statements and Call Detail Records (CDR).",
    groundsOther: "To prevent tampering of evidence, threatening witnesses and flight risk.",

    arrestWitnesses: [
      { id: "wit_1", name: "Baljeet Singh s/o Harnam Singh", address: "Ward No. 5, Panipat", signature: "Baljeet Singh" },
      { id: "wit_2", name: "Ramesh Lal s/o Ved Prakash", address: "New Bus Stand, Panipat", signature: "Ramesh Lal" },
    ],

    jamaTalashiItems: [
      { id: "jt_1", srNo: "1.", description: "Cash Indian Currency Rs. 1,450/- (Two notes of 500, two of 200, one of 50)", quantity: "1,450/-" },
      { id: "jt_2", srNo: "2.", description: "One Samsung Galaxy mobile phone (Blue color, working condition)", quantity: "1" },
      { id: "jt_3", srNo: "3.", description: "Brown leather wallet containing Aadhaar Card & Driving License", quantity: "1" },
    ],

    accusedSign1: "Vikas Sharma",
    witnessSign1: "Baljeet Singh",
    witnessSign2: "Ramesh Lal",
    accusedSign2: "Vikas Sharma",
    signPlace: "PS City Panipat",
    signDate: "18.09.2026",

    officerName: "Surender Pal",
    officerRank: "Sub-Inspector (SI)",
    officerPno: "04291885",
    officerPhone: "9812034567",

    pehchanThana: "PS City Panipat",
    pehchanDistrict: "Panipat",
    stateVsName: "State vs. Vikas Sharma",
    caseYear: "2026",
    caseSections: "Section 318(4), 316(2), 351(2) BNS, 2023",
    caseThana: "PS City Panipat",
    caseBanam: "Vikas Sharma s/o Ramesh Chand Sharma",

    trait1Height: "5 ft 8 in (173 cm)",
    trait2Build: "Medium Athletic",
    trait3Color: "Wheatish",
    trait4Eyes: "Black",
    trait5Hair: "Black Short",
    trait6BeardMustache: "Light Beard & Mustache",
    trait7Nose: "Straight Medium",
    trait8Face: "Round-Oval",
    trait9Teeth: "Regular White",
    trait10Mole: "Black mole on left cheek",
    trait11Scars: "Old 1 inch cut scar above right eyebrow",
    trait12Deformities: "None",
    trait13Tattoo: "Tattoo of 'Om' on right wrist",
    trait14Language: "Hindi / Haryanvi / English",
    trait15Dress: "Blue jeans and white shirt",
    trait16Habits: "None specific",
    trait17Voice: "Normal deep",
    trait18PehchanChinh: "Mole on left cheek & cut scar over right eyebrow",
    otherTraitsDetails: "Normal gait, no limp",

    fingerprintsTaken: "Yes",
    livingStandard: "Middle Class",
    education: "Graduate (B.Com)",
    socioOccupation: "Shopkeeper / Retail Trader",
    incomeGroup: "Middle Income (Annual approx Rs. 4-5 Lakh)",

    isDangerous: "No",
    escapedBailEarlier: "No",
    carriesWeapon: "No",
    activeWithAssociates: "No",
    isListedCriminal: "No",
    isHabitualCriminal: "No",
    escapeRiskDuringBail: "No",
    threatRiskAfterBail: "No",
    wantedInOtherCrime: "No",
    caseReferenceIfYes: "-",

    previousRecord1: "No previous criminal record (Clean Record)",
    previousRecord2: "-",
    previousRecord3: "-",
    eagleCriminalId: "EAGLE-HR-2026-08492",
    mhcName: "Ramesh Kumar",
    mhcRank: "Head Constable (MHC)",
    mhcBeltNo: "23114/Panipat",

    articlesHandedOverToMhc: "All articles recovered in personal search handed over to Malkhana Moharrir (MHC) in safe custody.",
    mhcSignRankPno: "MHC HC Ramesh Kumar, PNO-23114, PS City Panipat",
    mhcDepositDate: "18.09.2026",
    stateVs: "State of Haryana",
    gender: "Male",
    dobOrYear: "12.05.1992",
    bodyBuild: "Medium Athletic",
    heightCm: "173 cm (5 ft 8 in)",
    complexionBloodGroup: "Wheatish / B+ve",
    identificationMarks: "Mole on left cheek & cut scar over right eyebrow",
    deformities: "None",
    teeth: "Regular White",
    hair: "Black Short",
    eyes: "Black",
    habits: "None specific",
    dress: "Blue jeans and white shirt",
    languageDialect: "Hindi / Haryanvi / English",
    burnMark: "None",
    leukodermaSpots: "None",
    mole: "Black mole on left cheek",
    wound: "Old 1 inch cut scar above right eyebrow",
    tattooMark: "Tattoo of 'Om' on right wrist",
    otherTraitsDesc: "Normal gait, no limp",
    customClauses: [],
  },

  fard_jamatalashi: {
    headerDept: "HARYANA POLICE",
    policePost: "POLICE STATION CYBER CRIME",
    districtHeader: "DISTRICT PANIPAT",
    complainantLine: "Complainant- Praveen s/o Suresh r/o Village Dahar, District Panipat .",
    accusedLine: "Accused- Sawan s/o Jaikanwar r/o Village Khanpur Kalan, Tehsil Gohana, District Sonipat .",
    firDetailsLine: "FIR No. 60 Dated 04.06.2025 u/s Section 318(4) BNS Police Station Cyber Crime, Panipat .",
    fardTitle: "PERSONAL SEARCH MEMO (FARD JAMA TALASHI) ACCUSED SAWAN",
    docTitle: "PERSONAL SEARCH MEMO (FARD JAMA TALASHI) ACCUSED SAWAN",
    docSubTitle: "Under Section 50 Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023",
    noticeeName: "Sawan",
    noticeeFather: "Jaikanwar",
    noticeeAddress: "Village Khanpur Kalan, Tehsil Gohana, District Sonipat",
    complainantName: "Praveen",
    complainantFather: "Suresh",
    complainantAddress: "Village Dahar, District Panipat",
    complaintNo: "60",
    issueDate: "04.06.2025",
    sectionsOfLaw: "Section 318(4) BNS",
    policeStation: "Cyber Crime Police Station, Panipat",
    district: "District Panipat",
    introNarrative: `In the presence of the following witnesses, in police custody in the above-mentioned case, personal search of accused Sawan son of Jaikanwar, resident of Village Khanpur Kalan, Tehsil Gohana, District Sonipat was conducted in accordance with statutory procedure. During personal search, the following articles, cash and mobile phone were recovered from his physical possession:`,
    jamaTalashiItems: [
      { id: "jt_1", srNo: "1.", description: "Cash Indian Currency Rs. 2,000/- (4 notes of denomination 500, received in commission of offence)", quantity: "2,000/-", identification: "Currency note numbers noted" },
      { id: "jt_2", srNo: "2.", description: "One Vivo smartphone, blue color, with SIM card in working condition (used in commission of crime)", quantity: "1", identification: "IMEI: 864920194820194" },
      { id: "jt_3", srNo: "3.", description: "Wallet containing Aadhaar card (Sawan s/o Jaikanwar) and personal identity cards", quantity: "1", identification: "Personal identity documents" },
    ],
    receiptClauseText: "All the above articles recovered in personal search were taken into police custody and Personal Search Memo (Fard Jama Talashi) prepared. The accused and witness verified and signed.",
    accusedSign: "Sawan",
    accusedLineSign: "Accused- Sawan s/o Jaikanwar",
    arrestWitnesses: [
      { id: "wit_1", name: "Witness- HC Moninder No.1630/PPT", address: "", signature: "Moninder" },
    ],
    ioSign: "IO Sign",
    ioStationLabel: "Police Station Cyber Crime",
    ioDistrictLabel: "District Panipat",
    ioDate: "Dated 09.06.2025",
    stampThanaName: "PS. CYBER CRIME",
    stampDistrictName: "PANIPAT",
    customClauses: [],
  },

  grounds_of_arrest: {
    headerDept: "HARYANA POLICE",
    policeStation: "PS City Panipat",
    district: "District Panipat",
    complaintNo: "128/2026",
    issueDate: "18.09.2026",
    sectionsOfLaw: "Section 318(4), 316(2), 351(2) BNS, 2023",
    docTitle: "WRITTEN NOTICE OF GROUNDS OF ARREST",
    docSubTitle: "Under Section 47 Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023 & Article 22(1) Constitution of India",
    noticeeName: "Vikas Sharma",
    noticeeFather: "Ramesh Chand Sharma",
    noticeeAddress: "House No. 412, Sector 7, Urban Estate, Panipat",
    introNarrative: `You are hereby informed in writing under the provisions of Section 47 BNSS, 2023 that you have been arrested in FIR No. 128/2026, PS City Panipat on 18.09.2026 at 11:30 AM on the following cognizable offences and specific grounds:`,
    groundsPoints: [
      { id: "gp_1", text: "Nature of Offence: Section 318(4), 316(2), 351(2) BNS, 2023 (Cognizable and Non-Bailable offences)." },
      { id: "gp_2", text: "Your Specific Role: Concrete prima facie evidence found of defrauding the complainant of Rs. 4,50,000/-, criminal breach of trust and extending threats to kill." },
      { id: "gp_3", text: "Primary Evidence: Bank statements, complainant's statement, mobile phone records and WhatsApp chat technical trails." },
      { id: "gp_4", text: "Necessity of Arrest: To prevent further offences, ensure proper investigation, recover cheated funds, and prevent witness intimidation." },
    ],
    rightsPoints: [
      { id: "rp_1", text: "Section 38 BNSS: Right to meet and consult an advocate of your choice during interrogation." },
      { id: "rp_2", text: "Free Legal Aid: If you cannot afford an advocate, one will be provided free of cost by the District Legal Services Authority (DLSA)." },
      { id: "rp_3", text: "Section 48 BNSS: Immediate intimation of your arrest and place of custody has been communicated to your nominated family member." },
      { id: "rp_4", text: "Section 51 BNSS: Mandatory medical examination (MLR) will be conducted by a registered medical practitioner at a government hospital." },
    ],
    receiptClauseText: "The grounds of arrest and legal rights mentioned above have been explained to me in language understood by me, and I have received an original copy of this Notice of Grounds of Arrest.",
    arrestWitnesses: [
      { id: "wit_1", name: "Amit Sharma (Brother)", address: "House No. 412, Sector 7, Panipat" },
    ],
    officerName: "Surender Pal",
    officerRank: "Sub-Inspector (SI)",
    officerPno: "04291885",
    officerPhone: "9812034567",
    customClauses: [],
  },

  pehchan_patr: {
    headerDept: "HARYANA POLICE",
    policeStation: "PS City Panipat",
    district: "District Panipat",
    complaintNo: "128/2026",
    issueDate: "18.09.2026",
    sectionsOfLaw: "Section 318(4), 316(2) BNS, 2023",
    docTitle: "ACCUSED IDENTIFICATION ROLL & DESCRIPTIVE MEMO",
    docSubTitle: "Under Section 54 BNSS, 2023 & Section 9 Bharatiya Sakshya Adhiniyam, 2023",
    noticeeName: "Vikas Sharma",
    noticeeAlias1: "Vicky",
    noticeeFather: "Ramesh Chand Sharma",
    noticeeAge: "34 Years",
    accusedGender: "Male",
    noticeeAddress: "House No. 412, Sector 7, Urban Estate, Panipat",
    traitsList: [
      { id: "tr_1", label: "1. Height", value: "173 cm (5 ft 8 in)" },
      { id: "tr_2", label: "2. Complexion", value: "Wheatish" },
      { id: "tr_3", label: "3. Build", value: "Medium Athletic" },
      { id: "tr_4", label: "4. Eyes", value: "Black" },
      { id: "tr_5", label: "5. Hair", value: "Black Short" },
      { id: "tr_6", label: "6. Teeth", value: "Regular White" },
      { id: "tr_7", label: "7. Mole", value: "Black mole on left cheek" },
      { id: "tr_8", label: "8. Scar", value: "Old 1 inch cut scar above right eyebrow" },
      { id: "tr_9", label: "9. Tattoo", value: "Tattoo of 'Om' on right wrist" },
      { id: "tr_10", label: "10. Language / Accent", value: "Hindi / Haryanvi / English" },
      { id: "tr_11", label: "11. Dress", value: "Blue jeans, white shirt & black shoes" },
      { id: "tr_12", label: "12. Habits", value: "Tea drinker & occasional smoker" },
      { id: "tr_13", label: "13. Education & Profession", value: "Graduate (B.Com) / Retail Trader" },
      { id: "tr_14", label: "14. Fingerprints Taken", value: "Yes (All 10 Digits)" },
    ],
    arrestWitnesses: [
      { id: "wit_1", name: "Baljeet Singh s/o Harnam Singh", address: "Ward No. 5, Panipat" },
      { id: "wit_2", name: "Ramesh Lal s/o Ved Prakash", address: "New Bus Stand, Panipat" },
    ],
    officerName: "Surender Pal",
    officerRank: "Sub-Inspector (SI)",
    officerPno: "04291885",
    officerPhone: "9812034567",
    customClauses: [],
  },

  fard_baramadgi: {
    headerDept: "HARYANA POLICE",
    policePost: "POLICE STATION CYBER CRIME",
    districtHeader: "DISTRICT PANIPAT",
    complainantLine: "Complainant- Praveen s/o Suresh r/o Village Dahar, District Panipat .",
    accusedLine: "Accused- Sawan s/o Jaikanwar r/o Village Khanpur Kalan, Tehsil Gohana, District Sonipat .",
    firDetailsLine: "FIR No. 60 Dated 04.06.2025 u/s Section 318(4) BNS Police Station Cyber Crime, Panipat .",
    fardTitle: "SEIZURE & RECOVERY MEMO (FARD BARAMADGI) ACCUSED SAWAN",
    docTitle: "SEIZURE & RECOVERY MEMO (FARD BARAMADGI) ACCUSED SAWAN",
    docSubTitle: "Under Section 23(2) Bharatiya Sakshya Adhiniyam, 2023",
    noticeeName: "Sawan",
    noticeeFather: "Jaikanwar",
    noticeeAddress: "Village Khanpur Kalan, Tehsil Gohana, District Sonipat",
    recoveryPlace: "Gamdi Mor, Khanpur Kalan, Gohana",
    complainantName: "Praveen",
    complainantFather: "Suresh",
    complainantAddress: "Village Dahar, District Panipat",
    complaintNo: "60",
    issueDate: "04.06.2025",
    sectionsOfLaw: "Section 318(4) BNS",
    policeStation: "Cyber Crime Police Station, Panipat",
    district: "District Panipat",
    introNarrative: `In the presence of the following witnesses, in the above-mentioned case, recovery of the SIM card and cash used in commission of the offence was effected in accordance with statutory procedure from the place disclosed by accused Sawan son of Jaikanwar, resident of Village Khanpur Kalan, Tehsil Gohana, District Sonipat in his voluntary confession:`,
    recoveryItems: [
      { id: "rec_1", srNo: "1.", description: "One Airtel SIM card bearing mobile number 9518061533 (used in cyber fraud)", quantity: "1", sealDetails: "Sealed in parcel box with seal mark 'IO'" },
      { id: "rec_2", srNo: "2.", description: "Crime proceeds cash totaling Rs. 2,000/- (4 notes of denomination 500)", quantity: "2,000/-", sealDetails: "Sealed in envelope with seal mark 'IO'" },
    ],
    receiptClauseText: "The seized articles and proceeds were packed and sealed in the presence of the witness. Specimen seal was preserved. The accused and witness verified and signed.",
    accusedSign: "Sawan",
    accusedLineSign: "Accused- Sawan s/o Jaikanwar",
    arrestWitnesses: [
      { id: "wit_1", name: "Witness- HC Moninder No.1630/PPT", address: "", signature: "Moninder" },
    ],
    ioSign: "IO Sign",
    ioStationLabel: "Police Station Cyber Crime",
    ioDistrictLabel: "District Panipat",
    ioDate: "Dated 09.06.2025",
    stampThanaName: "PS. CYBER CRIME",
    stampDistrictName: "PANIPAT",
    customClauses: [],
  },

  remand_application: {
    headerDept: "HARYANA POLICE",
    policeStation: "PS City Panipat",
    district: "District Panipat",
    complaintNo: "128/2026",
    issueDate: "18.09.2026",
    sectionsOfLaw: "Section 318(4), 316(2), 351(2) BNS, 2023",
    courtName: "In the Court of Illaqa Magistrate / Chief Judicial Magistrate",
    courtDistrict: "Panipat",
    docTitle: "APPLICATION FOR POLICE CUSTODY REMAND",
    docSubTitle: "Under Section 187 Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023 / Section 167 CrPC",
    noticeeName: "Vikas Sharma",
    noticeeFather: "Ramesh Chand Sharma",
    remandDays: "3 Days",
    subjectTitle: "Application for grant of 3 days police custody remand of accused Vikas Sharma.",
    introNarrative: `It is respectfully submitted that accused Vikas Sharma was arrested in the above case on 18.09.2026 at 11:30 AM. Police custody remand of the accused is urgently required on the following specific investigation grounds:`,
    remandPoints: [
      { id: "rem_1", text: "Out of the total defrauded amount of Rs. 4,50,000/-, remaining amount of Rs. 3,30,000/- is yet to be recovered." },
      { id: "rem_2", text: "To recover other electronic devices, forged documents and bank passbooks used in the commission of offence." },
      { id: "rem_3", text: "To trace and arrest co-accused persons and identify their hideouts." },
      { id: "rem_4", text: "To take accused to scene of crime, bank branch and verify demarcation memo." },
      { id: "rem_5", text: "To conduct sustained custodial interrogation to unearth the entire nexus of financial cheating." },
    ],
    conclusionNarrative: "It is therefore prayed that in the interest of justice and for fair investigation, 3 days police custody remand of accused Vikas Sharma (from 18.09.2026 to 21.09.2026) may kindly be granted.",
    officerName: "Surender Pal",
    officerRank: "Sub-Inspector (SI)",
    officerPno: "04291885",
    officerPhone: "9812034567",
    customClauses: [],
  },

  fard_nishandehi: {
    headerDept: "HARYANA POLICE",
    policePost: "POLICE STATION CYBER CRIME",
    districtHeader: "DISTRICT PANIPAT",
    complainantLine: "Complainant- Praveen s/o Suresh r/o Village Dahar, District Panipat .",
    accusedLine: "Accused- Sawan s/o Jaikanwar r/o Village Khanpur Kalan, Tehsil Gohana, District Sonipat .",
    firDetailsLine: "FIR No. 60 Dated 04.06.2025 u/s Section 318(4) BNS Police Station Cyber Crime, Panipat .",
    fardTitle: "POINTING OUT & DEMARCATION MEMO (FARD NISHANDEHI) ACCUSED SAWAN",
    docTitle: "POINTING OUT & DEMARCATION MEMO (FARD NISHANDEHI) ACCUSED SAWAN",
    docSubTitle: "Under Section 23(2) Bharatiya Sakshya Adhiniyam, 2023",
    noticeeName: "Sawan",
    noticeeFather: "Jaikanwar",
    noticeeAddress: "Village Khanpur Kalan, Tehsil Gohana, District Sonipat",
    pointingOutPlace: "Gamdi Mor Bus Stop (Place of handing over SIM and cash transfer)",
    complainantName: "Praveen",
    complainantFather: "Suresh",
    complainantAddress: "Village Dahar, District Panipat",
    complaintNo: "60",
    issueDate: "04.06.2025",
    sectionsOfLaw: "Section 318(4) BNS",
    policeStation: "Cyber Crime Police Station, Panipat",
    district: "District Panipat",
    introNarrative: `In the presence of the following witnesses, accused Sawan son of Jaikanwar, resident of Village Khanpur Kalan, Tehsil Gohana, District Sonipat led the police party and witness to the spot and pointed out the place where he handed over the SIM card to Deepanshu and received Rs. 2,000/- in cash. The boundaries and environs of the said pointing out spot are as follows:`,
    boundariesList: [
      { id: "bd_1", direction: "East", detail: "Main Road Gohana-Panipat Highway" },
      { id: "bd_2", direction: "West", detail: "Gamdi Bus Stop passenger shed" },
      { id: "bd_3", direction: "North", detail: "Tea stall (Madan Lal)" },
      { id: "bd_4", direction: "South", detail: "Agricultural land (Rameshwar)" },
    ],
    verificationClauseText: "The pointing out was voluntarily conducted by accused Sawan in the presence of the witness. The Pointing Out Memo was prepared on the spot and signed by the accused and witness.",
    accusedSign: "Sawan",
    accusedLineSign: "Accused- Sawan s/o Jaikanwar",
    arrestWitnesses: [
      { id: "wit_1", name: "Witness- HC Moninder No.1630/PPT", address: "", signature: "Moninder" },
    ],
    ioSign: "IO Sign",
    ioStationLabel: "Police Station Cyber Crime",
    ioDistrictLabel: "District Panipat",
    ioDate: "Dated 09.06.2025",
    stampThanaName: "PS. CYBER CRIME",
    stampDistrictName: "PANIPAT",
    customClauses: [],
  },

  fard_inkeshaf: {
    headerDept: "HARYANA POLICE",
    policePost: "POLICE STATION CYBER CRIME",
    districtHeader: "DISTRICT PANIPAT",
    complainantLine: "Complainant- Praveen s/o Suresh r/o Village Dahar, District Panipat .",
    accusedLine: "Accused- Sawan s/o Jaikanwar r/o Village Khanpur Kalan, Tehsil Gohana, District Sonipat .",
    firDetailsLine: "FIR No. 60 Dated 04.06.2025 u/s Section 318(4) BNS Police Station Cyber Crime, Panipat .",
    fardTitle: "CONFESSION / DISCLOSURE STATEMENT (FARD INKESHAF) ACCUSED SAWAN",
    docTitle: "CONFESSION / DISCLOSURE STATEMENT (FARD INKESHAF) ACCUSED SAWAN",
    docSubTitle: "Under Section 23(2) Bharatiya Sakshya Adhiniyam, 2023 / Section 27 Indian Evidence Act",
    noticeeName: "Sawan",
    noticeeFather: "Jaikanwar",
    noticeeAddress: "Village Khanpur Kalan, Tehsil Gohana, District Sonipat",
    complainantName: "Praveen",
    complainantFather: "Suresh",
    complainantAddress: "Village Dahar, District Panipat",
    complaintNo: "60",
    issueDate: "04.06.2025",
    sectionsOfLaw: "Section 318(4) BNS",
    policeStation: "Cyber Crime Police Station, Panipat",
    district: "District Panipat",
    introNarrative: `In the presence of the following witnesses, in police custody in the above-mentioned case, accused Sawan son of Jaikanwar, resident of Village Khanpur Kalan, Tehsil Gohana, District Sonipat voluntarily recorded his confession without any fear, pressure, threat or inducement as follows: 'I am a resident of the above address and work as a daily wager. I am unmarried. My friend Deepanshu son of Jagpal is a resident of Village Gamdi, which is adjacent to my village. In the month of April, Deepanshu told me that some of his friends in Rohtak fraudulently steal USDT/cryptocurrency and require SIM cards for calling purposes. He asked me to procure a SIM card in my name in exchange for Rs. 2,000/-. Out of greed, I got a SIM card No. 9518061533 issued in my name and handed it over to Deepanshu in April 2025, for which he gave me Rs. 2,000/- in cash. I spent that money on personal expenses. Today, the police apprehended both Deepanshu and me together. Where the SIM card went and who possesses it can only be stated by Deepanshu.' The confession and disclosure statement of accused Sawan son of Jaikanwar was recorded, read over, and signed by the accused and the witness.`,
    accusedSign: "Sawan",
    accusedLineSign: "Accused- Sawan s/o Jaikanwar",
    arrestWitnesses: [
      { id: "wit_1", name: "Witness- HC Moninder No.1630/PPT", address: "", signature: "Moninder" },
    ],
    ioSign: "IO Sign",
    ioStationLabel: "Police Station Cyber Crime",
    ioDistrictLabel: "District Panipat",
    ioDate: "Dated 09.06.2025",
    stampThanaName: "PS. CYBER CRIME",
    stampDistrictName: "PANIPAT",
    customClauses: [],
  },

  medical_letter: {
    headerDept: "Office of Station House Officer / Investigating Officer",
    policeStation: "PS City Panipat",
    district: "District Panipat",
    complaintNo: "128/2026",
    issueDate: "18.09.2026",
    dispatchNo: "1482/R",
    hospitalName: "Civil Hospital, Panipat",
    medicalOfficerName: "Senior Medical Officer In-charge (SMO)",
    docTitle: "REQUISITION FOR MEDICAL EXAMINATION (MLR) OF ARRESTED ACCUSED",
    docSubTitle: "Under Section 51 Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023 / Section 53 & 54 CrPC",
    noticeeName: "Vikas Sharma",
    noticeeFather: "Ramesh Chand Sharma",
    noticeeAge: "34 Years",
    noticeeAddress: "House No. 412, Sector 7, Urban Estate, Panipat",
    subjectTitle: "Requisition for mandatory medical examination of arrested accused Vikas Sharma u/s 51 BNSS.",
    introNarrative: `It is submitted that arrested accused Vikas Sharma s/o Ramesh Chand Sharma, age 34 years, is produced before you under police escort for mandatory medical examination. Kindly examine the accused and report on the following points:`,
    medicalPoints: [
      { id: "mp_1", text: "Whether there are any fresh or old visible injuries on the person of the accused (Detailed MLR)." },
      { id: "mp_2", text: "Whether the accused is physically and mentally fit for police custody and production before the Hon'ble Court." },
      { id: "mp_3", text: "Whether the accused is under the influence of any intoxicant or alcohol." },
    ],
    escortOfficers: [
      { id: "esc_1", name: "EHC Surjeet Singh", beltNo: "No. 418", thana: "PS City Panipat" },
      { id: "esc_2", name: "Const. Naresh Kumar", beltNo: "No. 892", thana: "PS City Panipat" },
    ],
    conclusionNarrative: "Kindly examine the accused as per statutory protocol and issue Medico-Legal Report (MLR).",
    officerName: "Surender Pal",
    officerRank: "Sub-Inspector (SI)",
    officerPno: "04291885",
    officerPhone: "9812034567",
    customClauses: [],
  },

  peshi_remand: {
    headerDept: "HARYANA POLICE",
    policeStation: "PS City Panipat",
    district: "District Panipat",
    complaintNo: "128/2026",
    issueDate: "21.09.2026",
    sectionsOfLaw: "Section 318(4), 316(2), 351(2) BNS, 2023",
    courtName: "In the Court of Illaqa Magistrate / Chief Judicial Magistrate",
    courtDistrict: "Panipat",
    docTitle: "APPLICATION FOR PRODUCTION OF ACCUSED & REMAND TO JUDICIAL CUSTODY",
    docSubTitle: "Under Section 187 Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023 / Section 167 CrPC",
    noticeeName: "Vikas Sharma",
    noticeeFather: "Ramesh Chand Sharma",
    subjectTitle: "Production of accused Vikas Sharma on expiry of police remand and prayer to commit to Judicial Custody (Jail).",
    introNarrative: `Respected Sir, it is submitted that accused Vikas Sharma was taken on police remand under the orders of this Hon'ble Court, which expires today. The accused is required to be remanded to judicial custody on the following grounds:`,
    peshiPoints: [
      { id: "pp_1", text: "Police remand of the accused expires today on 21.09.2026." },
      { id: "pp_2", text: "During remand, recovery of Rs. 1,20,000/-, laptop and fake stamps has been effected and demarcation memo completed." },
      { id: "pp_3", text: "No further custodial interrogation or recovery is required from the accused at this stage." },
      { id: "pp_4", text: "Medical examination of the accused has been re-conducted at Civil Hospital and MLR is enclosed." },
      { id: "pp_5", text: "Accused is involved in a serious cognizable crime; if released on bail, he may abscond or tamper with prosecution witnesses." },
    ],
    conclusionNarrative: "It is therefore prayed that accused Vikas Sharma may kindly be remanded to 14 days Judicial Custody (District Jail, Panipat).",
    officerName: "Surender Pal",
    officerRank: "Sub-Inspector (SI)",
    officerPno: "04291885",
    officerPhone: "9812034567",
    customClauses: [],
  },
};

// Default export alias for backward compatibility
for(const map of [DEFAULT_SAMPLE_DATA_HI,DEFAULT_SAMPLE_DATA_EN])for(const key of Object.keys(map) as ArrestDocTemplateType[])map[key]=blankTemplateFacts(map[key]);

const DEFAULT_SAMPLE_DATA = DEFAULT_SAMPLE_DATA_HI;

function ArrestDocsContent() {
  const { currentUser } = useAuth();
  const { language: globalLang } = useLanguage();
  const searchParams = useSearchParams();
  const firIdParam = searchParams.get("firId");

  const [firs, setFirs] = useState<FIRItem[]>([]);
  const [selectedFirId, setSelectedFirId] = useState<string>(firIdParam || "");
  const [templateLang, setTemplateLang] = useState<TemplateLanguage>(globalLang || "hi");
  const [selectedTemplate, setSelectedTemplate] = useState<ArrestDocTemplateType>("arrest_memo");
  const [formData, setFormData] = useState<ArrestDocsFormData>(
    (globalLang === "en" ? DEFAULT_SAMPLE_DATA_EN : DEFAULT_SAMPLE_DATA_HI)["arrest_memo"]
  );

  const [fontSize, setFontSize] = useState<"compact" | "standard" | "large">("standard");
  const [copied, setCopied] = useState(false);

  // Accused selection & Save to FIR states
  const [selectedAccusedId, setSelectedAccusedId] = useState<string>("");
  const [isSavingToFir, setIsSavingToFir] = useState<boolean>(false);
  const [saveSuccessInfo, setSaveSuccessInfo] = useState<{
    firId: string;
    firNumber: string;
    docId: string;
    docTitle: string;
  } | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState<boolean>(false);
  const [previewHtml, setPreviewHtml] = useState<string>("");

  const witnessTableResize = useTableResize({
    initialColWidths: { 0: 44, 1: 220, 2: 240, 3: 150, 4: 44 },
  });
  const jamaTalashiTableResize = useTableResize({
    initialColWidths: { 0: 44, 1: 300, 2: 120, 3: 180, 4: 44 },
  });
  const recoveryTableResize = useTableResize({
    initialColWidths: { 0: 44, 1: 280, 2: 100, 3: 180, 4: 44 },
  });
  const traitsTableResize = useTableResize({
    initialColWidths: { 0: 240, 1: 300 },
  });

  // Load all FIRs
  useEffect(() => {
    const list = firService.getAllFirs();
    setFirs(list);

  }, []);

  const activeFir = firs.find((f) => f.id === selectedFirId || f.firNumber === selectedFirId);

  const isCrimeDetailsFilled = Boolean(
    activeFir?.crimeDetailsFilled ||
    (activeFir as any)?.crimeDetailsData ||
    (typeof window !== "undefined" &&
      activeFir?.id &&
      Boolean(window.localStorage?.getItem(`haryana_police_cms_fir_crimedetails_${activeFir.id}`))) ||
    activeFir?.documents?.some(
      (d) =>
        d.title.toLowerCase().includes("crime detail") ||
        d.title.includes("IIF-II") ||
        d.title.includes("अपराध विवरण") ||
        d.category === "CCTNS_IIF2"
    )
  );

  // Sync active FIR with current template and selected accused
  useEffect(() => {
    const baseSource = templateLang === "en" ? DEFAULT_SAMPLE_DATA_EN : DEFAULT_SAMPLE_DATA_HI;
    const baseSample = baseSource[selectedTemplate] || baseSource.arrest_memo;
    if (!activeFir) {
      setFormData(baseSample);
      return;
    }

    const accusedList = activeFir.accusedList || [];
    const matchedAccused = selectedAccusedId
      ? accusedList.find((a, idx) => (a.id || `acc_${idx}`) === selectedAccusedId)
      : accusedList.length===1 ? accusedList[0] : undefined;

    const noticeeName = matchedAccused?.name || baseSample.noticeeName;
    const noticeeFather = matchedAccused?.relativeName || matchedAccused?.fatherName || baseSample.noticeeFather;
    const noticeeAddress = matchedAccused?.address || baseSample.noticeeAddress;

    setFormData({
      ...baseSample,
      policeStation: activeFir.policeStation || baseSample.policeStation,
      district: activeFir.district || baseSample.district,
      complaintNo: activeFir.firNumber || baseSample.complaintNo,
      issueDate: "",
      incidentDate: (activeFir as any)?.incidentDate || activeFir.incidentDateFrom || baseSample.incidentDate,
      sectionsOfLaw: activeFir.actsAndSections || baseSample.sectionsOfLaw,
      complainantName: activeFir.complainantName || baseSample.complainantName,
      complainantAddress: (activeFir as any)?.complainantAddress || baseSample.complainantAddress,

      noticeeName,
      noticeeFather,
      noticeeAge: (matchedAccused as any)?.age
        ? templateLang === "hi" ? `${(matchedAccused as any).age} वर्ष` : `${(matchedAccused as any).age} Years`
        : baseSample.noticeeAge,
      noticeeAddress,
      noticeePhone: matchedAccused?.phone || baseSample.noticeePhone,
      noticeeAlias1: matchedAccused?.alias || baseSample.noticeeAlias1,
      accusedGender: (matchedAccused as any)?.gender || baseSample.accusedGender,

      caseBanam: noticeeName
        ? templateLang === "hi"
          ? `${noticeeName}${noticeeFather ? ` सुपुत्र ${noticeeFather}` : ""}`
          : `${noticeeName}${noticeeFather ? ` s/o ${noticeeFather}` : ""}`
        : baseSample.caseBanam,
      stateVsName: noticeeName
        ? templateLang === "hi" ? `सरकार बनाम ${noticeeName}` : `State vs. ${noticeeName}`
        : baseSample.stateVsName,
      accusedSign1: noticeeName || baseSample.accusedSign1,
      accusedSign2: noticeeName || baseSample.accusedSign2,

      officerName: activeFir.assignedIoName || currentUser.name || baseSample.officerName,
      officerRank: activeFir.assignedIoRank || currentUser.rank || baseSample.officerRank,
      officerPno: activeFir.assignedIoBeltNumber || currentUser.pno || baseSample.officerPno,
      officerPhone: activeFir.assignedIoPhone || (currentUser as any)?.phone || baseSample.officerPhone,
    });
  }, [activeFir, selectedTemplate, selectedAccusedId, currentUser, templateLang]);

  const handleSelectAccused = (accusedId: string) => {
    setSelectedAccusedId(accusedId);
    if (!activeFir) return;
    const accused = activeFir.accusedList?.find((a, idx) => (a.id || `acc_${idx}`) === accusedId);
    if (!accused) return;
    setFormData((prev) => ({
      ...prev,
      noticeeName: accused.name,
      noticeeFather: accused.fatherName || accused.relativeName || prev.noticeeFather,
      noticeeAlias1: accused.alias || prev.noticeeAlias1,
      noticeeAddress: accused.address || prev.noticeeAddress,
      noticeePhone: accused.phone || prev.noticeePhone,
      caseBanam: `${accused.name}${
        accused.fatherName || accused.relativeName
          ? templateLang === "hi"
            ? ` सुपुत्र ${accused.fatherName || accused.relativeName}`
            : ` s/o ${accused.fatherName || accused.relativeName}`
          : ""
      }`,
      stateVsName: templateLang === "hi" ? `सरकार बनाम ${accused.name}` : `State vs. ${accused.name}`,
      accusedSign1: accused.name,
      accusedSign2: accused.name,
    }));
  };

  const handleFieldChange = (field: keyof ArrestDocsFormData, val: any) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  // Toggle template language between Hindi and English
  const handleToggleLanguage = (newLang: TemplateLanguage) => {
    if (newLang === templateLang) return;
    setTemplateLang(newLang);

    const currentBase = (templateLang === "hi" ? DEFAULT_SAMPLE_DATA_HI : DEFAULT_SAMPLE_DATA_EN)[selectedTemplate];
    const targetBase = (newLang === "hi" ? DEFAULT_SAMPLE_DATA_HI : DEFAULT_SAMPLE_DATA_EN)[selectedTemplate];

    setFormData((prev) => {
      const updated = { ...prev };

      // Sync all scalar keys from targetBase if untouched or matching currentBase
      (Object.keys(targetBase) as (keyof ArrestDocsFormData)[]).forEach((key) => {
        if (!prev[key] || prev[key] === (currentBase as any)[key]) {
          (updated as any)[key] = (targetBase as any)[key];
        }
      });

      // Special handling for Yes / No radios
      if (newLang === "en") {
        if (prev.fingerprintsTaken === "हाँ" || prev.fingerprintsTaken === "हां") updated.fingerprintsTaken = "Yes";
        if (prev.fingerprintsTaken === "नहीं" || prev.fingerprintsTaken === "नही") updated.fingerprintsTaken = "No";
        const radioKeys = [
          "isDangerous",
          "escapedBailEarlier",
          "carriesWeapon",
          "activeWithAssociates",
          "isListedCriminal",
          "isHabitualCriminal",
          "escapeRiskDuringBail",
          "threatRiskAfterBail",
          "wantedInOtherCrime",
        ] as const;
        radioKeys.forEach((rk) => {
          if ((prev as any)[rk] === "हाँ" || (prev as any)[rk] === "हां") (updated as any)[rk] = "Yes";
          if ((prev as any)[rk] === "नहीं" || (prev as any)[rk] === "नही") (updated as any)[rk] = "No";
        });
      } else {
        if (prev.fingerprintsTaken === "Yes") updated.fingerprintsTaken = "हाँ";
        if (prev.fingerprintsTaken === "No") updated.fingerprintsTaken = "नही";
        const radioKeys = [
          "isDangerous",
          "escapedBailEarlier",
          "carriesWeapon",
          "activeWithAssociates",
          "isListedCriminal",
          "isHabitualCriminal",
          "escapeRiskDuringBail",
          "threatRiskAfterBail",
          "wantedInOtherCrime",
        ] as const;
        radioKeys.forEach((rk) => {
          if ((prev as any)[rk] === "Yes") (updated as any)[rk] = "हाँ";
          if ((prev as any)[rk] === "No") (updated as any)[rk] = "नही";
        });
      }

      if (prev.stateVsName && prev.noticeeName) {
        updated.stateVsName = newLang === "hi" ? `सरकार बनाम ${prev.noticeeName}` : `State vs. ${prev.noticeeName}`;
      }
      if (prev.caseBanam && prev.noticeeName) {
        updated.caseBanam = prev.noticeeFather
          ? newLang === "hi" ? `${prev.noticeeName} सुपुत्र ${prev.noticeeFather}` : `${prev.noticeeName} s/o ${prev.noticeeFather}`
          : prev.noticeeName;
      }

      // Sync witness and jamaTalashi sample lists if unchanged
      if (
        !prev.arrestWitnesses ||
        JSON.stringify(prev.arrestWitnesses) === JSON.stringify(currentBase.arrestWitnesses)
      ) {
        updated.arrestWitnesses = targetBase.arrestWitnesses;
      }
      if (
        !prev.jamaTalashiItems ||
        JSON.stringify(prev.jamaTalashiItems) === JSON.stringify(currentBase.jamaTalashiItems)
      ) {
        updated.jamaTalashiItems = targetBase.jamaTalashiItems;
      }

      if (targetBase.groundsPoints && (!prev.groundsPoints || prev.groundsPoints === currentBase.groundsPoints)) {
        updated.groundsPoints = targetBase.groundsPoints;
      }
      if (targetBase.rightsPoints && (!prev.rightsPoints || prev.rightsPoints === currentBase.rightsPoints)) {
        updated.rightsPoints = targetBase.rightsPoints;
      }
      if (targetBase.remandPoints && (!prev.remandPoints || prev.remandPoints === currentBase.remandPoints)) {
        updated.remandPoints = targetBase.remandPoints;
      }
      if (targetBase.medicalPoints && (!prev.medicalPoints || prev.medicalPoints === currentBase.medicalPoints)) {
        updated.medicalPoints = targetBase.medicalPoints;
      }
      if (targetBase.peshiPoints && (!prev.peshiPoints || prev.peshiPoints === currentBase.peshiPoints)) {
        updated.peshiPoints = targetBase.peshiPoints;
      }
      if (targetBase.boundariesList && (!prev.boundariesList || prev.boundariesList === currentBase.boundariesList)) {
        updated.boundariesList = targetBase.boundariesList;
      }
      if (targetBase.traitsList && (!prev.traitsList || prev.traitsList === currentBase.traitsList)) {
        updated.traitsList = targetBase.traitsList;
      }
      if (targetBase.recoveryItems && (!prev.recoveryItems || prev.recoveryItems === currentBase.recoveryItems)) {
        updated.recoveryItems = targetBase.recoveryItems;
      }

      // Explicit syncing for templates 2, 5, 7, 8 (Haryana Police Fard documents)
      if (["fard_jamatalashi", "fard_baramadgi", "fard_nishandehi", "fard_inkeshaf"].includes(selectedTemplate)) {
        if (!prev.policePost || prev.policePost === currentBase.policePost) updated.policePost = targetBase.policePost;
        if (!prev.districtHeader || prev.districtHeader === currentBase.districtHeader) updated.districtHeader = targetBase.districtHeader;
        if (!prev.complainantLine || prev.complainantLine === currentBase.complainantLine) updated.complainantLine = targetBase.complainantLine;
        if (!prev.accusedLine || prev.accusedLine === currentBase.accusedLine) updated.accusedLine = targetBase.accusedLine;
        if (!prev.firDetailsLine || prev.firDetailsLine === currentBase.firDetailsLine) updated.firDetailsLine = targetBase.firDetailsLine;
        if (!prev.fardTitle || prev.fardTitle === currentBase.fardTitle) updated.fardTitle = targetBase.fardTitle;
        if (!prev.introNarrative || prev.introNarrative === currentBase.introNarrative) updated.introNarrative = targetBase.introNarrative;
        if (!prev.accusedLineSign || prev.accusedLineSign === currentBase.accusedLineSign) updated.accusedLineSign = targetBase.accusedLineSign;
        if (!prev.accusedSign || prev.accusedSign === currentBase.accusedSign) updated.accusedSign = targetBase.accusedSign;
        if (!prev.accusedLabel || prev.accusedLabel === currentBase.accusedLabel) updated.accusedLabel = targetBase.accusedLabel;
        if (!prev.gazettedOfficerLabel || prev.gazettedOfficerLabel === currentBase.gazettedOfficerLabel) updated.gazettedOfficerLabel = targetBase.gazettedOfficerLabel;
        if (!prev.ioStationLabel || prev.ioStationLabel === currentBase.ioStationLabel) updated.ioStationLabel = targetBase.ioStationLabel;
        if (!prev.ioDistrictLabel || prev.ioDistrictLabel === currentBase.ioDistrictLabel) updated.ioDistrictLabel = targetBase.ioDistrictLabel;
        if (!prev.ioDate || prev.ioDate === currentBase.ioDate) updated.ioDate = targetBase.ioDate;
        if (!prev.receiptClauseText || prev.receiptClauseText === currentBase.receiptClauseText) updated.receiptClauseText = targetBase.receiptClauseText;
        if (!prev.verificationClauseText || prev.verificationClauseText === currentBase.verificationClauseText) updated.verificationClauseText = targetBase.verificationClauseText;
        if (!prev.disclosureNarrative || prev.disclosureNarrative === currentBase.disclosureNarrative) updated.disclosureNarrative = targetBase.disclosureNarrative;
        if (!prev.recoveryPlace || prev.recoveryPlace === currentBase.recoveryPlace) updated.recoveryPlace = targetBase.recoveryPlace;
        if (!prev.pointingOutPlace || prev.pointingOutPlace === currentBase.pointingOutPlace) updated.pointingOutPlace = targetBase.pointingOutPlace;
        if (!prev.stampThanaName || prev.stampThanaName === currentBase.stampThanaName) updated.stampThanaName = targetBase.stampThanaName;
        if (!prev.stampDistrictName || prev.stampDistrictName === currentBase.stampDistrictName) updated.stampDistrictName = targetBase.stampDistrictName;
        if (!prev.arrestWitnesses || JSON.stringify(prev.arrestWitnesses) === JSON.stringify(currentBase.arrestWitnesses)) {
          updated.arrestWitnesses = targetBase.arrestWitnesses;
        }
        if (!prev.jamaTalashiItems || JSON.stringify(prev.jamaTalashiItems) === JSON.stringify(currentBase.jamaTalashiItems)) {
          updated.jamaTalashiItems = targetBase.jamaTalashiItems;
        }
        if (!prev.recoveryItems || JSON.stringify(prev.recoveryItems) === JSON.stringify(currentBase.recoveryItems)) {
          updated.recoveryItems = targetBase.recoveryItems;
        }
        if (!prev.boundariesList || JSON.stringify(prev.boundariesList) === JSON.stringify(currentBase.boundariesList)) {
          updated.boundariesList = targetBase.boundariesList;
        }
      }

      return updated;
    });
  };

  // Sync with global top bar language switcher
  useEffect(() => {
    if (globalLang && globalLang !== templateLang) {
      handleToggleLanguage(globalLang);
    }
  }, [globalLang]);

  const handleResetSample = () => {
    const baseSource = templateLang === "en" ? DEFAULT_SAMPLE_DATA_EN : DEFAULT_SAMPLE_DATA_HI;
    const base = baseSource[selectedTemplate];
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
    if (!activeFir) {
      alert("कृपया पहले एक सक्रिय FIR केस चुनें।");
      return;
    }
    if (!formData.noticeeName?.trim()) {alert("Select or enter the correct accused before saving.");return;}
    if (selectedTemplate === "arrest_memo" && (!formData.arrestDate || !formData.arrestTime)) {alert("Enter the verified arrest date and time before saving the arrest memo.");return;}
    if (!isCrimeDetailsFilled) {
      alert(
        templateLang === "hi"
          ? "⚠️ वैधानिक प्रतिबंध: FIR में अपराध विवरण प्रपत्र (Crime Detail Form IIF-II) दर्ज नहीं है!\n\nBNSS एवं CCTNS नियमों के अनुसार गिरफ़्तारी प्रपत्र (Arrest Docs & IIF-III) तैयार करने से पहले FIR प्रोफ़ाइल में IIF-II भरकर दस्तावेज़ पैनल में सुरक्षित करना अनिवार्य है।"
          : "⚠️ Statutory Pre-requisite: Crime Detail Form (IIF-II) is not yet recorded!\n\nYou must complete and save IIF-II in the FIR Profile before printing Arrest Docs & IIF-III."
      );
      return;
    }
    if (selectedTemplate === "arrest_memo") {
      const html = generateArrestMemo4PageHtml(formData, activeFir, templateLang);
      let iframe = document.getElementById("cms-print-iframe") as HTMLIFrameElement | null;
      if (!iframe) {
        iframe = document.createElement("iframe");
        iframe.id = "cms-print-iframe";
        iframe.style.position = "fixed";
        iframe.style.right = "0";
        iframe.style.bottom = "0";
        iframe.style.width = "0";
        iframe.style.height = "0";
        iframe.style.border = "0";
        iframe.style.visibility = "hidden";
        document.body.appendChild(iframe);
      }
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(html);
        doc.close();
        setTimeout(() => {
          iframe?.contentWindow?.focus();
          iframe?.contentWindow?.print();
        }, 400);
        return;
      }
    }
    const title = `${selectedTemplate.toUpperCase()}_FIR_${formData.complaintNo || "Case"}`;
    printA4Element("arrest-printable-doc", title);
  };

  const handleDownload = () => {
    if (!activeFir) {
      alert("कृपया पहले एक सक्रिय FIR केस चुनें।");
      return;
    }
    if (!isCrimeDetailsFilled) {
      alert(
        templateLang === "hi"
          ? "⚠️ वैधानिक प्रतिबंध: FIR में अपराध विवरण प्रपत्र (Crime Detail Form IIF-II) दर्ज नहीं है!\n\nBNSS एवं CCTNS नियमों के अनुसार गिरफ़्तारी प्रपत्र (Arrest Docs & IIF-III) तैयार करने से पहले FIR प्रोफ़ाइल में IIF-II भरकर दस्तावेज़ पैनल में सुरक्षित करना अनिवार्य है।"
          : "⚠️ Statutory Pre-requisite: Crime Detail Form (IIF-II) is not yet recorded!\n\nYou must complete and save IIF-II in the FIR Profile before downloading Arrest Docs & IIF-III."
      );
      return;
    }
    if (selectedTemplate === "arrest_memo") {
      const html = generateArrestMemo4PageHtml(formData, activeFir, templateLang);
      const blob = new Blob([html], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `arrest_memo_26_8_1_${(formData.noticeeName || "accused").toLowerCase().replace(/\s+/g, "_")}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return;
    }
    const title = `${selectedTemplate.toUpperCase()}_FIR_${formData.complaintNo || "Case"}`;
    const docTitle = TEMPLATE_CONFIG[selectedTemplate]?.label || "Arrest Document";
    downloadA4DocumentAsHtml("arrest-printable-doc", title, docTitle);
  };

  const handleOpenPreview = () => {
    if (!activeFir) {
      alert("कृपया पहले एक सक्रिय FIR केस चुनें।");
      return;
    }
    if (!isCrimeDetailsFilled) {
      alert(
        templateLang === "hi"
          ? "⚠️ वैधानिक प्रतिबंध: FIR में अपराध विवरण प्रपत्र (Crime Detail Form IIF-II) दर्ज नहीं है!\n\nBNSS एवं CCTNS नियमों के अनुसार गिरफ़्तारी प्रपत्र (Arrest Docs & IIF-III) तैयार करने से पहले FIR प्रोफ़ाइल में IIF-II भरकर दस्तावेज़ पैनल में सुरक्षित करना अनिवार्य है।"
          : "⚠️ Statutory Pre-requisite: Crime Detail Form (IIF-II) is not yet recorded!\n\nYou must complete and save IIF-II in the FIR Profile before previewing Arrest Docs & IIF-III."
      );
      return;
    }
    if (selectedTemplate === "arrest_memo") {
      const html = generateArrestMemo4PageHtml(formData, activeFir, templateLang);
      setPreviewHtml(html);
    } else {
      const el = document.getElementById("arrest-printable-doc");
      setPreviewHtml(`<!DOCTYPE html><html lang="${templateLang}"><head><meta charset="utf-8"/><title>${TEMPLATE_CONFIG[selectedTemplate].label}</title><style>body{font-family:serif;padding:24px;color:#000;background:#fff;}table{width:100%;border-collapse:collapse;}th,td{border:1px solid #333;padding:6px;}</style></head><body>${el?.innerHTML || ""}</body></html>`);
    }
    setIsPreviewModalOpen(true);
  };

  const handleSaveToFir = async () => {
    if (!activeFir) {
      alert("कृपया पहले एक सक्रिय FIR केस चुनें।");
      return;
    }

    if (!isCrimeDetailsFilled) {
      alert(
        templateLang === "hi"
          ? "⚠️ वैधानिक प्रतिबंध: FIR में अपराध विवरण प्रपत्र (Crime Detail Form IIF-II) दर्ज नहीं है!\n\nBNSS एवं CCTNS नियमों के अनुसार गिरफ़्तारी प्रपत्र (Arrest Docs & IIF-III) तैयार करने से पहले FIR प्रोफ़ाइल में IIF-II भरकर दस्तावेज़ पैनल में सुरक्षित करना अनिवार्य है।"
          : "⚠️ Statutory Pre-requisite: Crime Detail Form (IIF-II) is not yet recorded!\n\nYou must complete and save IIF-II in the FIR Profile before saving Arrest Docs & IIF-III."
      );
      return;
    }

    setIsSavingToFir(true);
    try {
      let htmlContent = "";
      let docTitle = "";
      let docFileBase = "";

      if (selectedTemplate === "arrest_memo") {
        htmlContent = generateArrestMemo4PageHtml(formData, activeFir, templateLang);
        docTitle =
          templateLang === "hi"
            ? `गिरफ्तारी फार्म संख्या 26.8(1) (4 पृष्ठ) - ${formData.noticeeName || "अभियुक्त"}`
            : `Arrest Memo Form 26.8(1) (4 Pages) - ${formData.noticeeName || "Accused"}`;
        docFileBase = `arrest_memo_26_8_1_${(formData.noticeeName || "accused").toLowerCase().replace(/\s+/g, "_")}`;
      } else {
        const el = document.getElementById("arrest-printable-doc");
        htmlContent = `<!DOCTYPE html><html lang="${templateLang}"><head><meta charset="utf-8"/><title>${TEMPLATE_CONFIG[selectedTemplate].label}</title><style>body{font-family:serif;padding:24px;color:#000;background:#fff;}table{width:100%;border-collapse:collapse;}th,td{border:1px solid #333;padding:6px;}</style></head><body>${el?.innerHTML || ""}</body></html>`;
        docTitle = `${TEMPLATE_CONFIG[selectedTemplate].label} - ${formData.noticeeName || "अभियुक्त"}`;
        docFileBase = `${selectedTemplate}_${(formData.noticeeName || "accused").toLowerCase().replace(/\s+/g, "_")}`;
      }

      const docId = `doc-${Date.now()}`;
      const dataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`;
      const fileName = `${docFileBase}_${Date.now()}.html`;

      // 1. IndexedDB Blob Store persistence
      if (typeof window !== "undefined") {
        await evidenceBlobStore.put(docId, dataUrl, { mimeType: "text/html", fileName });
      }

      // 2. Register & Universal Evidence AI Analysis and indexing
      await universalEvidenceService.registerAndProcess({
        dataUrl,
        fileName,
        fileId: docId,
        caseId: activeFir.id,
        caseNumber: activeFir.firNumber,
        module: "FIR",
        uploadedBy: currentUser.name || "IO",
      });

      // 3. Save to FIR documents
      const newDoc: FIRDocumentItem = {
        id: docId,
        title: docTitle,
        fileName,
        category: "FIELD_REPORT",
        uploadedBy: `${currentUser.name || "IO"} (${currentUser.rank || "SI"})`,
        uploadedAt: new Date().toISOString().replace("T", " ").slice(0, 16),
        dataUrl,
        fileSize: `${(htmlContent.length / 1024).toFixed(1)} KB`,
      };

      if(selectedTemplate === 'arrest_memo'){
        const arrestDate=recordedCalendarDate(formData.arrestDate || '');
        if(!arrestDate)throw new Error('Enter a valid arrest date.');
        const matches=(activeFir.accusedList || []).filter((a,i)=>selectedAccusedId?(a.id || `acc_${i}`)===selectedAccusedId:a.name===formData.noticeeName);
        if(matches.length!==1)throw new Error('Select one accused from this FIR before saving the arrest memo.');
        newDoc.documentType = 'IIF_III';
        newDoc.arrestAccusedId = matches[0].id || `${activeFir.id}-accused-${activeFir.accusedList.indexOf(matches[0]) + 1}`;
        newDoc.arrestFormData = structuredClone(formData);
        await firService.updateFir(activeFir.id,{documents:[newDoc,...(activeFir.documents || [])],accusedList:(activeFir.accusedList || []).map(a=>a===matches[0]?{...a,isArrested:true,arrestDate,arrestTime:formData.arrestTime,arrestGdNo:formData.arrestGdNo}:a)});
      }else await firService.addDocument(activeFir.id, newDoc);

      // 4. Audit Trail entry
      await firService.addAuditRecord(
        activeFir.id,
        "ARREST_DOC_SAVED",
        `${docTitle} generated and saved to FIR Profile Documents by ${currentUser.name}`,
        currentUser.name,
        currentUser.rank
      );

      // 5. Trigger Auto-Suggestion in Roznamcha General Diary (PPR 22.48)
      try {
        await GeneralDiaryService.createFirActionSuggestion({
          actionType: "ARREST_MEMO",
          firId: activeFir.id,
          firNumber: activeFir.firNumber,
          policeStation: activeFir.policeStation,
          district: activeFir.district,
          officer: {
            name: currentUser.name || "IO",
            rank: currentUser.rank || "Sub-Inspector",
            pno: currentUser.pno || "00000000",
            beltNumber: (currentUser as any).beltNo || `${currentUser.pno || "IO"}/FIR`,
          },
          personName: formData.noticeeName || formData.accusedName || "अभियुक्त",
          actsAndSections: activeFir.actsAndSections,
          place: formData.arrestPlace || activeFir.incidentPlace,
          dateTime: formData.arrestDate ? `${formData.arrestDate} ${formData.arrestTime || ""}`.trim() : undefined,
          docTitle,
          details: `Arrest / Surrender memo generated for ${formData.noticeeName || "accused"} under ${activeFir.actsAndSections}`,
        });
      } catch (gdErr) {
        console.warn("Failed to dispatch Roznamcha GD suggestion for Arrest Memo:", gdErr);
      }

      setSaveSuccessInfo({
        firId: activeFir.id,
        firNumber: activeFir.firNumber,
        docId,
        docTitle,
      });
    } catch (err: any) {
      console.error("Save to FIR failed:", err);
      alert("दस्तावेज सहेजने में समस्या: " + (err.message || "अज्ञात त्रुटि"));
    } finally {
      setIsSavingToFir(false);
    }
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
          value={formData.headerDept || (templateLang === "hi" ? "हरियाणा पुलिस" : "HARYANA POLICE")}
          onChange={(e) => handleFieldChange("headerDept", e.target.value)}
          className="text-center font-bold text-base w-full bg-transparent hover:bg-slate-50 focus:bg-white outline-none border-b border-transparent focus:border-slate-400"
          placeholder={templateLang === "hi" ? "विभाग का नाम" : "Department Name"}
        />
        <input
          type="text"
          value={formData.docTitle || ""}
          onChange={(e) => handleFieldChange("docTitle", e.target.value)}
          className="text-center font-black text-xl w-full bg-transparent hover:bg-slate-50 focus:bg-white outline-none border-b border-transparent focus:border-slate-400 underline underline-offset-4"
          placeholder={templateLang === "hi" ? "दस्तावेज का शीर्षक" : "Document Title"}
        />
        <input
          type="text"
          value={formData.docSubTitle || ""}
          onChange={(e) => handleFieldChange("docSubTitle", e.target.value)}
          className="text-center text-xs text-slate-700 font-semibold w-full bg-transparent hover:bg-slate-50 focus:bg-white outline-none border-b border-transparent focus:border-slate-400"
          placeholder={templateLang === "hi" ? "उप-शीर्षक / धाराएं" : "Sub-title / Legal Sections"}
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-bold pt-1">
        <div className="flex items-center gap-1">
          <span className="shrink-0">{templateLang === "hi" ? "थाना:" : "Police Station:"}</span>
          <input
            type="text"
            value={formData.policeStation || ""}
            onChange={(e) => handleFieldChange("policeStation", e.target.value)}
            className="w-full bg-transparent border-b border-dotted border-slate-700 outline-none px-1"
          />
        </div>
        <div className="flex items-center gap-1">
          <span className="shrink-0">{templateLang === "hi" ? "जिला:" : "District:"}</span>
          <input
            type="text"
            value={formData.district || ""}
            onChange={(e) => handleFieldChange("district", e.target.value)}
            className="w-full bg-transparent border-b border-dotted border-slate-700 outline-none px-1"
          />
        </div>
        <div className="flex items-center gap-1">
          <span className="shrink-0">{templateLang === "hi" ? "मुकदमा सं0:" : "FIR / Case No:"}</span>
          <input
            type="text"
            value={formData.complaintNo || ""}
            onChange={(e) => handleFieldChange("complaintNo", e.target.value)}
            className="w-full bg-transparent border-b border-dotted border-slate-700 outline-none px-1 font-black"
          />
        </div>
        <div className="flex items-center gap-1">
          <span className="shrink-0">{templateLang === "hi" ? "दिनांक:" : "Date:"}</span>
          <input
            type="text"
            value={formData.issueDate || ""}
            onChange={(e) => handleFieldChange("issueDate", e.target.value)}
            className="w-full bg-transparent border-b border-dotted border-slate-700 outline-none px-1"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs font-bold pt-1">
        <span className="shrink-0">{templateLang === "hi" ? "धारा/धाराएं:" : "Section(s) of Law:"}</span>
        <input
          type="text"
          value={formData.sectionsOfLaw || ""}
          onChange={(e) => handleFieldChange("sectionsOfLaw", e.target.value)}
          className="w-full bg-transparent border-b border-dotted border-slate-700 outline-none px-1"
          placeholder={templateLang === "hi" ? "धाराएं" : "Sections"}
        />
      </div>
    </div>
  );

  // Reusable Component: Dynamic Custom Clauses
  const renderCustomClausesSection = () => (
    <div className="space-y-3 pt-3 border-t border-slate-300">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-800">
          {templateLang === "hi" ? "अतिरिक्त पैरा / क्लॉज (Custom Editable Sections):" : "Additional Clauses / Custom Editable Sections:"}
        </span>
        <button
          type="button"
          onClick={handleAddCustomClause}
          className="no-print text-xs text-rose-700 hover:text-rose-900 font-bold flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" /> {templateLang === "hi" ? "नया पैरा / क्लॉज जोड़ें" : "Add Clause / Paragraph"}
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
              placeholder={templateLang === "hi" ? "शीर्षक दर्ज करें..." : "Enter heading..."}
            />
            <button
              type="button"
              onClick={() => handleDeleteCustomClause(clause.id)}
              className="no-print text-red-500 hover:text-red-700 shrink-0 p-1"
              title="Remove clause"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <textarea
            rows={2}
            value={clause.text}
            onChange={(e) => handleUpdateCustomClause(clause.id, "text", e.target.value)}
            className="w-full text-xs p-1 outline-none resize-y border-0 bg-transparent leading-relaxed"
            placeholder={templateLang === "hi" ? "इस पैरा का विवरण लिखें..." : "Enter details for this clause..."}
          />
        </div>
      ))}
    </div>
  );

  // Reusable Component: Dynamic Witnesses
  const renderWitnessesSection = () => (
    <div className="space-y-2 pt-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold underline">
          {templateLang === "hi" ? "गवाहान / पंच गवाह (Witnesses):" : "Witnesses / Independent Panch Witnesses:"}
        </span>
        <button
          type="button"
          onClick={handleAddWitnessRow}
          className="no-print text-xs text-rose-700 hover:text-rose-900 font-bold flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" /> {templateLang === "hi" ? "गवाह जोड़ें" : "Add Witness"}
        </button>
      </div>

      <TableResizeToolbar
        hasCustomSizes={witnessTableResize.hasCustomSizes}
        onReset={witnessTableResize.resetSizes}
      />
      <table className="w-full border-collapse border border-slate-400 text-xs">
        <thead>
          <tr className="bg-slate-100">
            <th
              style={{
                width: witnessTableResize.colWidths[0] ? `${witnessTableResize.colWidths[0]}px` : undefined,
              }}
              className="relative border border-slate-400 p-1.5 w-10 text-center"
            >
              {templateLang === "hi" ? "क्र0" : "Sr."}
              <TableColResizer onResize={(e) => witnessTableResize.startColResize(0, e)} />
            </th>
            <th
              style={{
                width: witnessTableResize.colWidths[1] ? `${witnessTableResize.colWidths[1]}px` : undefined,
              }}
              className="relative border border-slate-400 p-1.5 text-left"
            >
              {templateLang === "hi" ? "गवाह का नाम व वल्दियत" : "Witness Name & Parentage"}
              <TableColResizer onResize={(e) => witnessTableResize.startColResize(1, e)} />
            </th>
            <th
              style={{
                width: witnessTableResize.colWidths[2] ? `${witnessTableResize.colWidths[2]}px` : undefined,
              }}
              className="relative border border-slate-400 p-1.5 text-left"
            >
              {templateLang === "hi" ? "पूरा पता व मोबाइल" : "Full Address & Mobile"}
              <TableColResizer onResize={(e) => witnessTableResize.startColResize(2, e)} />
            </th>
            <th
              style={{
                width: witnessTableResize.colWidths[3] ? `${witnessTableResize.colWidths[3]}px` : undefined,
              }}
              className="relative border border-slate-400 p-1.5 w-36 text-center"
            >
              {templateLang === "hi" ? "हस्ताक्षर/निशान अंगूठा" : "Signature / Thumb"}
              <TableColResizer onResize={(e) => witnessTableResize.startColResize(3, e)} />
            </th>
            <th className="no-print border border-slate-400 p-1.5 w-10 text-center"></th>
          </tr>
        </thead>
        <tbody>
          {(formData.arrestWitnesses || []).map((w, idx) => (
            <tr
              key={w.id}
              style={{
                height: witnessTableResize.rowHeights[idx] ? `${witnessTableResize.rowHeights[idx]}px` : undefined,
              }}
            >
              <td className="relative border border-slate-400 p-1.5 text-center">
                {idx + 1}
                <TableRowResizer onResize={(e) => witnessTableResize.startRowResize(idx, e)} />
              </td>
              <td className="border border-slate-400 p-1.5">
                <input
                  type="text"
                  value={w.name}
                  onChange={(e) => handleUpdateWitnessRow(w.id, "name", e.target.value)}
                  className="w-full bg-transparent outline-none"
                  placeholder={templateLang === "hi" ? "नाम व पिता का नाम" : "Name & Father's Name"}
                />
              </td>
              <td className="border border-slate-400 p-1.5">
                <input
                  type="text"
                  value={w.address}
                  onChange={(e) => handleUpdateWitnessRow(w.id, "address", e.target.value)}
                  className="w-full bg-transparent outline-none"
                  placeholder={templateLang === "hi" ? "पता" : "Address"}
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
        <p className="font-bold">{templateLang === "hi" ? "हस्ताक्षर/अंगूठा अभियुक्त:" : "Signature / Thumb Impression of Accused:"}</p>
        <p className="border-b border-slate-400 w-44 pt-4"></p>
        <p className="text-[11px] text-slate-600 pt-1">({formData.noticeeName})</p>
      </div>
      <div className="text-right space-y-0.5">
        <p className="font-bold">{templateLang === "hi" ? "हस्ताक्षर अनुसंधान अधिकारी (IO):" : "Signature of Investigating Officer (IO):"}</p>
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

  // Authentic Haryana Police Fard Memo Document Component (Exact Stationery Layout from Photo media_1792045629238_7e6b9b20.png)
  const renderHaryanaPoliceFardDocument = (templateType: ArrestDocTemplateType) => {
    const isJamatalashi = templateType === "fard_jamatalashi";
    const isBaramadgi = templateType === "fard_baramadgi";
    const isNishandehi = templateType === "fard_nishandehi";
    const isInkeshaf = templateType === "fard_inkeshaf";

    const defaultTitle = isJamatalashi
      ? templateLang === "hi" ? "फ़र्द जामातलाशी अभियुक्त सावन" : "PERSONAL SEARCH MEMO (FARD JAMA TALASHI) ACCUSED SAWAN"
      : isBaramadgi
      ? templateLang === "hi" ? "फ़र्द बरामदगी माल मुकदमा आरोपी सावन" : "SEIZURE & RECOVERY MEMO (FARD BARAMADGI) ACCUSED SAWAN"
      : isNishandehi
      ? templateLang === "hi" ? "फ़र्द निशानदेही मौका आरोपी सावन" : "POINTING OUT & DEMARCATION MEMO (FARD NISHANDEHI) ACCUSED SAWAN"
      : templateLang === "hi" ? "अपराध स्वीकार कथन आरोपी सावन" : "CONFESSION / DISCLOSURE STATEMENT (FARD INKESHAF) ACCUSED SAWAN";

    return (
      <div className="space-y-6 text-slate-900 leading-relaxed font-serif">
        {/* Top Official Line: Thana / Post Name on Left, District on Right (Underlined, exact to photo) */}
        <div className="flex items-center justify-between gap-4 border-b-2 border-slate-900 pb-2">
          <input
            type="text"
            value={formData.policePost ?? (templateLang === "hi" ? "थाना साईबर क्राईम" : "POLICE STATION CYBER CRIME")}
            onChange={(e) => handleFieldChange("policePost", e.target.value)}
            className="font-bold underline text-base sm:text-lg bg-transparent border-none outline-none tracking-wide text-slate-900 w-80"
            placeholder={templateLang === "hi" ? "थाना का नाम" : "Police Station Name"}
          />
          <input
            type="text"
            value={formData.districtHeader ?? (templateLang === "hi" ? "जिला पानीपत" : "DISTRICT PANIPAT")}
            onChange={(e) => handleFieldChange("districtHeader", e.target.value)}
            className="font-bold underline text-base sm:text-lg text-right bg-transparent border-none outline-none tracking-wide text-slate-900 w-64 ml-auto"
            placeholder={templateLang === "hi" ? "जिला का नाम" : "District Name"}
          />
        </div>

        {/* 3 Case Metadata Lines (Left-aligned, underlined / dotted, exact to photo media_1792045629238_7e6b9b20.png) */}
        <div className="space-y-2 pt-1 text-sm sm:text-base font-normal text-slate-900">
          <div className="flex items-center gap-1.5 border-b border-dotted border-slate-400 pb-0.5">
            <input
              type="text"
              value={formData.complainantLine ?? (templateLang === "hi" ? "शिकायतकर्ता- प्रवीन पुत्र सुरेश निवासी गांव डाहर जिला पानीपत ।" : "Complainant- Praveen s/o Suresh r/o Village Dahar, District Panipat .")}
              onChange={(e) => handleFieldChange("complainantLine", e.target.value)}
              className="w-full bg-transparent outline-none text-slate-900 font-medium"
              placeholder={templateLang === "hi" ? "शिकायतकर्ता विवरण..." : "Complainant details..."}
            />
          </div>
          <div className="flex items-center gap-1.5 border-b border-dotted border-slate-400 pb-0.5">
            <input
              type="text"
              value={formData.accusedLine ?? (templateLang === "hi" ? "विरुद्ध- सावन पुत्र जयकंवर निवासी गांव खानपुर कला तहसील गोहाना जिला सोनीपत ।" : "Accused- Sawan s/o Jaikanwar r/o Village Khanpur Kalan, Tehsil Gohana, District Sonipat .")}
              onChange={(e) => handleFieldChange("accusedLine", e.target.value)}
              className="w-full bg-transparent outline-none text-slate-900 font-medium"
              placeholder={templateLang === "hi" ? "विरुद्ध (आरोपी) विवरण..." : "Accused details..."}
            />
          </div>
          <div className="flex items-center gap-1.5 border-b border-dotted border-slate-400 pb-0.5">
            <input
              type="text"
              value={formData.firDetailsLine ?? (templateLang === "hi" ? "अभियोग न० 60 दिनांक 04.06.25 धारा 318(4) BNS थाना साईबर क्राईम पानीपत ।" : "FIR No. 60 Dated 04.06.2025 u/s Section 318(4) BNS Police Station Cyber Crime, Panipat .")}
              onChange={(e) => handleFieldChange("firDetailsLine", e.target.value)}
              className="w-full bg-transparent outline-none text-slate-900 font-medium"
              placeholder={templateLang === "hi" ? "अभियोग विवरण..." : "FIR details..."}
            />
          </div>
        </div>

        {/* Center Title: Underlined Bold Heading (Exact to photo) */}
        <div className="text-center pt-2 pb-1">
          <input
            type="text"
            value={formData.fardTitle || defaultTitle}
            onChange={(e) => handleFieldChange("fardTitle", e.target.value)}
            className="font-black text-center text-lg sm:text-xl underline tracking-wide text-slate-950 bg-transparent border-none outline-none w-full"
          />
        </div>

        {/* Optional Place Line for Baramadgi / Nishandehi */}
        {isBaramadgi && (
          <div className="flex items-center gap-2 text-xs sm:text-sm border-b border-dotted border-slate-400 pb-1">
            <span className="font-bold shrink-0 text-slate-800">
              {templateLang === "hi" ? "बरामदगी का स्थान (Place of Recovery):" : "Place of Recovery:"}
            </span>
            <input
              type="text"
              value={formData.recoveryPlace || ""}
              onChange={(e) => handleFieldChange("recoveryPlace", e.target.value)}
              className="w-full bg-transparent outline-none font-bold text-slate-900"
              placeholder={templateLang === "hi" ? "बरामदगी का स्थान दर्ज करें" : "Enter place of recovery"}
            />
          </div>
        )}

        {isNishandehi && (
          <div className="flex items-center gap-2 text-xs sm:text-sm border-b border-dotted border-slate-400 pb-1">
            <span className="font-bold shrink-0 text-slate-800">
              {templateLang === "hi" ? "निशानदेही का स्थान (Place of Demarcation):" : "Place of Pointing Out / Demarcation:"}
            </span>
            <input
              type="text"
              value={formData.pointingOutPlace || ""}
              onChange={(e) => handleFieldChange("pointingOutPlace", e.target.value)}
              className="w-full bg-transparent outline-none font-bold text-slate-900"
              placeholder={templateLang === "hi" ? "निशानदेही का स्थान दर्ज करें" : "Enter place of demarcation"}
            />
          </div>
        )}

        {/* Official Continuous Police Narrative Paragraph (Typewriter Running Police Memo text) */}
        <div className="space-y-1">
          <textarea
            rows={isInkeshaf ? 14 : isBaramadgi ? 5 : isJamatalashi ? 4 : 4}
            value={formData.introNarrative || ""}
            onChange={(e) => handleFieldChange("introNarrative", e.target.value)}
            className="w-full text-xs sm:text-[13px] leading-relaxed text-slate-950 bg-transparent border border-dashed border-slate-300 hover:border-slate-500 focus:border-slate-800 rounded p-2.5 outline-none resize-y font-normal"
            style={{ textAlign: "justify" }}
            placeholder={templateLang === "hi" ? "यहाँ फर्द का आधिकारिक विवरण लिखें..." : "Enter official narrative here..."}
          />
        </div>

        {/* 1. Specific Items Table for Template 2 (FARD JAMATALASHI) */}
        {isJamatalashi && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold underline text-slate-800">
                {templateLang === "hi" ? "बरामदशुदा जामातलाशी सामान की सूची (Articles Inventory):" : "Inventory of Personal Search Articles:"}
              </span>
              <button
                type="button"
                onClick={handleAddJamaTalashiRow}
                className="no-print text-xs text-rose-700 hover:text-rose-900 font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> {templateLang === "hi" ? "सामान जोड़ें" : "Add Item"}
              </button>
            </div>
            <TableResizeToolbar
              hasCustomSizes={jamaTalashiTableResize.hasCustomSizes}
              onReset={jamaTalashiTableResize.resetSizes}
            />
            <table className="w-full border-collapse border border-slate-400 text-xs">
              <thead>
                <tr className="bg-slate-100">
                  <th
                    style={{
                      width: jamaTalashiTableResize.colWidths[0] ? `${jamaTalashiTableResize.colWidths[0]}px` : undefined,
                    }}
                    className="relative border border-slate-400 p-2 w-12 text-center font-bold"
                  >
                    {templateLang === "hi" ? "क्र0 सं0" : "Sr. No."}
                    <TableColResizer onResize={(e) => jamaTalashiTableResize.startColResize(0, e)} />
                  </th>
                  <th
                    style={{
                      width: jamaTalashiTableResize.colWidths[1] ? `${jamaTalashiTableResize.colWidths[1]}px` : undefined,
                    }}
                    className="relative border border-slate-400 p-2 text-left font-bold"
                  >
                    {templateLang === "hi" ? "विवरण सामान / नकदी / दस्तावेज" : "Description of Articles / Cash / Documents"}
                    <TableColResizer onResize={(e) => jamaTalashiTableResize.startColResize(1, e)} />
                  </th>
                  <th
                    style={{
                      width: jamaTalashiTableResize.colWidths[2] ? `${jamaTalashiTableResize.colWidths[2]}px` : undefined,
                    }}
                    className="relative border border-slate-400 p-2 w-28 text-center font-bold"
                  >
                    {templateLang === "hi" ? "तादाद / रकम" : "Quantity / Amount"}
                    <TableColResizer onResize={(e) => jamaTalashiTableResize.startColResize(2, e)} />
                  </th>
                  <th
                    style={{
                      width: jamaTalashiTableResize.colWidths[3] ? `${jamaTalashiTableResize.colWidths[3]}px` : undefined,
                    }}
                    className="relative border border-slate-400 p-2 w-44 text-left font-bold"
                  >
                    {templateLang === "hi" ? "पहचान / विशेष चिन्ह" : "Identification / Marks"}
                    <TableColResizer onResize={(e) => jamaTalashiTableResize.startColResize(3, e)} />
                  </th>
                  <th className="no-print border border-slate-400 p-1.5 w-10 text-center"></th>
                </tr>
              </thead>
              <tbody>
                {(formData.jamaTalashiItems || []).map((it, idx) => (
                  <tr
                    key={it.id}
                    style={{
                      height: jamaTalashiTableResize.rowHeights[idx] ? `${jamaTalashiTableResize.rowHeights[idx]}px` : undefined,
                    }}
                  >
                    <td className="relative border border-slate-400 p-2 text-center">
                      {idx + 1}
                      <TableRowResizer onResize={(e) => jamaTalashiTableResize.startRowResize(idx, e)} />
                    </td>
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
                        className="text-red-500 hover:text-red-700 cursor-pointer"
                        title="Delete Item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 2. Specific Items Table for Template 5 (FARD BARAMADGI) */}
        {isBaramadgi && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold underline text-slate-800">
                {templateLang === "hi" ? "बरामदशुदा माल का विस्तृत विवरण (Inventory of Seized Property):" : "Inventory of Seized Property:"}
              </span>
              <button
                type="button"
                onClick={handleAddRecoveryRow}
                className="no-print text-xs text-rose-700 hover:text-rose-900 font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> {templateLang === "hi" ? "बरामदगी जोड़ें" : "Add Item"}
              </button>
            </div>
            <TableResizeToolbar
              hasCustomSizes={recoveryTableResize.hasCustomSizes}
              onReset={recoveryTableResize.resetSizes}
            />
            <table className="w-full border-collapse border border-slate-400 text-xs">
              <thead>
                <tr className="bg-slate-100">
                  <th
                    style={{
                      width: recoveryTableResize.colWidths[0] ? `${recoveryTableResize.colWidths[0]}px` : undefined,
                    }}
                    className="relative border border-slate-400 p-2 w-12 text-center font-bold"
                  >
                    {templateLang === "hi" ? "क्र0 सं0" : "Sr. No."}
                    <TableColResizer onResize={(e) => recoveryTableResize.startColResize(0, e)} />
                  </th>
                  <th
                    style={{
                      width: recoveryTableResize.colWidths[1] ? `${recoveryTableResize.colWidths[1]}px` : undefined,
                    }}
                    className="relative border border-slate-400 p-2 text-left font-bold"
                  >
                    {templateLang === "hi" ? "बरामद सामान/नकदी का विवरण" : "Description of Recovered Property / Cash"}
                    <TableColResizer onResize={(e) => recoveryTableResize.startColResize(1, e)} />
                  </th>
                  <th
                    style={{
                      width: recoveryTableResize.colWidths[2] ? `${recoveryTableResize.colWidths[2]}px` : undefined,
                    }}
                    className="relative border border-slate-400 p-2 w-28 text-center font-bold"
                  >
                    {templateLang === "hi" ? "तादाद / संख्या" : "Quantity"}
                    <TableColResizer onResize={(e) => recoveryTableResize.startColResize(2, e)} />
                  </th>
                  <th
                    style={{
                      width: recoveryTableResize.colWidths[3] ? `${recoveryTableResize.colWidths[3]}px` : undefined,
                    }}
                    className="relative border border-slate-400 p-2 w-48 text-left font-bold"
                  >
                    {templateLang === "hi" ? "मोहर व सीलबंद पार्सल" : "Seal & Packaging Particulars"}
                    <TableColResizer onResize={(e) => recoveryTableResize.startColResize(3, e)} />
                  </th>
                  <th className="no-print border border-slate-400 p-1.5 w-10 text-center"></th>
                </tr>
              </thead>
              <tbody>
                {(formData.recoveryItems || []).map((it, idx) => (
                  <tr
                    key={it.id}
                    style={{
                      height: recoveryTableResize.rowHeights[idx] ? `${recoveryTableResize.rowHeights[idx]}px` : undefined,
                    }}
                  >
                    <td className="relative border border-slate-400 p-2 text-center">
                      {idx + 1}
                      <TableRowResizer onResize={(e) => recoveryTableResize.startRowResize(idx, e)} />
                    </td>
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
                        className="text-red-500 hover:text-red-700 cursor-pointer"
                        title="Delete Item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 3. Specific Boundaries Section for Template 7 (FARD NISHANDEHI) */}
        {isNishandehi && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold underline text-slate-800">
                {templateLang === "hi" ? "चौहद्दी व सीमाएं (Boundaries & Environs):" : "Boundaries & Environs:"}
              </span>
              <button
                type="button"
                onClick={handleAddBoundaryRow}
                className="no-print text-xs text-rose-700 hover:text-rose-900 font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> {templateLang === "hi" ? "सीमा बिंदु जोड़ें" : "Add Boundary"}
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {(formData.boundariesList || []).map((bd) => (
                <div key={bd.id} className="flex items-center gap-2 border border-slate-300 p-2 bg-slate-50 rounded">
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
                    className="no-print text-red-500 hover:text-red-700 p-1 cursor-pointer"
                    title="Delete Boundary"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Receipt / Verification Clause (for 2, 5, 7) */}
        {(isJamatalashi || isBaramadgi || isNishandehi) && (
          <div className="space-y-1">
            <textarea
              rows={2}
              value={formData.receiptClauseText || formData.verificationClauseText || ""}
              onChange={(e) => {
                handleFieldChange("receiptClauseText", e.target.value);
                handleFieldChange("verificationClauseText", e.target.value);
              }}
              className="w-full text-xs p-2.5 border border-slate-300 rounded outline-none resize-y italic text-slate-800"
              placeholder={templateLang === "hi" ? "तस्दीक व सत्यापन नोट..." : "Verification note..."}
            />
          </div>
        )}

        {/* Dynamic Custom Clauses (Add/Delete) */}
        {renderCustomClausesSection()}

        {/* ================= EXACT SIGNATURE & RUBBER STAMP ARRANGEMENT FROM PHOTO media_1792045629238_7e6b9b20.png ================= */}
        <div className="pt-6 border-t-2 border-slate-400 space-y-6">
          {/* Row 1: Left Accused, Right Witness(es) */}
          <div className="flex items-start justify-between gap-8">
            {/* Left Column: Accused (आरोपी- सावन पुत्र जयकंवर) */}
            <div className="w-1/2 space-y-2">
              <input
                type="text"
                value={formData.accusedLineSign ?? (templateLang === "hi" ? "आरोपी- सावन पुत्र जयकंवर" : "Accused- Sawan s/o Jaikanwar")}
                onChange={(e) => handleFieldChange("accusedLineSign", e.target.value)}
                className="font-bold underline text-sm sm:text-base text-slate-900 bg-transparent border-none outline-none w-full"
                placeholder={templateLang === "hi" ? "आरोपी- नाम व पिता का नाम" : "Accused- Name & Father"}
              />
              <div className="pl-6 pt-1">
                <input
                  type="text"
                  value={formData.accusedSign ?? (templateLang === "hi" ? "सावन" : "Sawan")}
                  onChange={(e) => handleFieldChange("accusedSign", e.target.value)}
                  className="font-serif italic text-lg sm:text-xl font-black text-slate-900 bg-transparent border-b border-dotted border-slate-400 w-48 outline-none"
                  placeholder={templateLang === "hi" ? "हस्ताक्षर आरोपी" : "Accused Signature"}
                />
              </div>
            </div>

            {/* Right Column: Witness(es) (साक्षी- HC Moninder No.1630/PPT) */}
            <div className="w-1/2 space-y-3">
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleAddWitnessRow}
                  className="no-print text-xs text-rose-700 hover:text-rose-900 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> {templateLang === "hi" ? "साक्षी जोड़ें" : "Add Witness"}
                </button>
              </div>

              {(formData.arrestWitnesses || []).map((w) => (
                <div key={w.id} className="group relative text-right space-y-1">
                  <div className="flex items-center justify-end gap-2">
                    <input
                      type="text"
                      value={w.signature || (templateLang === "hi" ? "Moninder" : "Moninder")}
                      onChange={(e) => handleUpdateWitnessRow(w.id, "signature", e.target.value)}
                      className="text-right font-serif italic text-base sm:text-lg font-bold text-slate-800 bg-transparent border-b border-dotted border-slate-400 w-44 outline-none"
                      placeholder={templateLang === "hi" ? "हस्ताक्षर साक्षी" : "Witness Signature"}
                    />
                    <button
                      type="button"
                      onClick={() => handleDeleteWitnessRow(w.id)}
                      className="no-print text-red-500 hover:text-red-700 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shrink-0"
                      title={templateLang === "hi" ? "साक्षी हटाएं" : "Delete Witness"}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={w.name}
                    onChange={(e) => handleUpdateWitnessRow(w.id, "name", e.target.value)}
                    className="text-right font-bold underline text-sm sm:text-base text-slate-900 bg-transparent border-none outline-none w-full"
                    placeholder={templateLang === "hi" ? "साक्षी- नाम व बेल्ट न०" : "Witness- Name & Belt No."}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Row 2: Spaced Down Right Column: Investigating Officer (IO) Block */}
          <div className="flex justify-end pr-2 pt-4">
            <div className="text-right space-y-1 w-64">
              <input
                type="text"
                value={formData.ioSign || (templateLang === "hi" ? "IO Sign" : "IO Sign")}
                onChange={(e) => handleFieldChange("ioSign", e.target.value)}
                className="text-right font-serif italic text-base font-bold text-slate-800 bg-transparent border-b border-dotted border-slate-400 w-44 ml-auto outline-none"
                placeholder={templateLang === "hi" ? "हस्ताक्षर IO" : "IO Signature"}
              />
              <input
                type="text"
                value={formData.ioStationLabel ?? (templateLang === "hi" ? "थाना साईबर क्राईम" : "Police Station Cyber Crime")}
                onChange={(e) => handleFieldChange("ioStationLabel", e.target.value)}
                className="text-right font-medium text-xs sm:text-sm text-slate-800 bg-transparent border-none outline-none w-full"
                placeholder={templateLang === "hi" ? "थाना का नाम" : "Police Station"}
              />
              <input
                type="text"
                value={formData.ioDistrictLabel ?? (templateLang === "hi" ? "जिला पानीपत" : "District Panipat")}
                onChange={(e) => handleFieldChange("ioDistrictLabel", e.target.value)}
                className="text-right font-medium text-xs sm:text-sm text-slate-800 bg-transparent border-none outline-none w-full"
                placeholder={templateLang === "hi" ? "जिला का नाम" : "District"}
              />
              <input
                type="text"
                value={formData.ioDate ?? (templateLang === "hi" ? "दिनांक 09.06.25" : "Dated 09.06.2025")}
                onChange={(e) => handleFieldChange("ioDate", e.target.value)}
                className="text-right font-medium text-xs sm:text-sm text-slate-700 bg-transparent border-none outline-none w-full"
                placeholder={templateLang === "hi" ? "दिनांक" : "Date"}
              />
            </div>
          </div>

          {/* Row 3: Circular Rubber Stamp (matching photo media_1792045629238_7e6b9b20.png) */}
          <div className="flex flex-col items-center justify-center pt-2 pb-2">
            <div
              className="w-36 h-36 rounded-full border-4 p-1 flex items-center justify-center relative shadow-sm"
              style={{
                transform: "rotate(-3deg)",
                borderColor: "#1e295d",
                color: "#1e295d",
              }}
            >
              <div className="w-full h-full rounded-full border border-dashed border-indigo-900/60 flex flex-col items-center justify-center text-center p-1.5 relative overflow-hidden">
                <div className="text-[9px] font-black tracking-widest uppercase">
                  POLICE STATION
                </div>
                <div className="my-0.5 text-center">
                  <div className="text-xs">★</div>
                  <input
                    type="text"
                    value={formData.stampThanaName || "PS. CYBER CRIME"}
                    onChange={(e) => handleFieldChange("stampThanaName", e.target.value.toUpperCase())}
                    className="text-[11px] font-black uppercase text-center w-28 bg-transparent border-none outline-none tracking-wider text-indigo-950"
                  />
                </div>
                <div className="text-[8px] font-black tracking-wider uppercase">
                  ★ {formData.stampDistrictName || "PANIPAT"} (HARYANA) ★
                </div>
              </div>
            </div>
            <span className="text-[10px] text-slate-400 font-mono pt-1 text-center">
              {templateLang === "hi" ? "(थाना आधिकारिक मुहर - संपादन योग्य)" : "(Police Station Seal - Editable)"}
            </span>
          </div>
        </div>
      </div>
    );
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
              Arrest Docs and IIF-III (गिरफ्तारी प्रपत्र स्टूडियो)
            </h1>

          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Bilingual Language Switcher (Top Action Bar) */}
          <div className="flex items-center bg-white border border-slate-300 rounded-lg p-0.5 shadow-2xs">
            <span className="text-[11px] font-bold text-slate-600 px-2 flex items-center gap-1">
              <Languages className="w-3.5 h-3.5 text-rose-700" />
              <span>भाषा / Lang:</span>
            </span>
            <button
              type="button"
              onClick={() => handleToggleLanguage("hi")}
              className={`px-3 py-1 rounded-md text-xs font-black transition-all cursor-pointer ${
                templateLang === "hi"
                  ? "bg-rose-900 text-white shadow-xs"
                  : "text-slate-600 hover:text-rose-900 hover:bg-slate-100"
              }`}
            >
              हिन्दी
            </button>
            <button
              type="button"
              onClick={() => handleToggleLanguage("en")}
              className={`px-3 py-1 rounded-md text-xs font-black transition-all cursor-pointer ${
                templateLang === "en"
                  ? "bg-rose-900 text-white shadow-xs"
                  : "text-slate-600 hover:text-rose-900 hover:bg-slate-100"
              }`}
            >
              English
            </button>
          </div>

          <Button
            size="sm"
            onClick={handleSaveToFir}
            disabled={isSavingToFir || !isCrimeDetailsFilled}
            className={`font-bold text-xs gap-1.5 shadow-sm transition-all ${
              !isCrimeDetailsFilled
                ? "bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300"
                : "bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer"
            }`}
            title={
              !isCrimeDetailsFilled
                ? "IIF-II प्रपत्र दर्ज न होने के कारण सुरक्षित करना प्रतिबंधित है"
                : "Save this document to FIR Profile Documents with Universal Evidence processing"
            }
          >
            {isSavingToFir ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>{isSavingToFir ? (templateLang === "hi" ? "सहेजा जा रहा है..." : "Saving...") : (templateLang === "hi" ? "FIR Profile में सहेजें" : "Save to FIR")}</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleOpenPreview}
            disabled={!isCrimeDetailsFilled}
            className={`font-bold text-xs gap-1.5 ${
              !isCrimeDetailsFilled
                ? "border-slate-200 text-slate-400 cursor-not-allowed bg-slate-50"
                : "border-blue-300 bg-blue-50/70 hover:bg-blue-100 text-blue-800 cursor-pointer"
            }`}
            title={!isCrimeDetailsFilled ? "IIF-II प्रपत्र दर्ज करना आवश्यक है" : "4-पृष्ठ पूर्वावलोकन (Preview exact 4 A4 pages)"}
          >
            <Eye className="w-3.5 h-3.5 text-blue-700" />
            <span>{templateLang === "hi" ? "4-पृष्ठ पूर्वावलोकन" : "4-Page Preview"}</span>
          </Button>

          <Button
            size="sm"
            onClick={handlePrint}
            disabled={!isCrimeDetailsFilled}
            className={`font-bold text-xs gap-1.5 shadow-sm ${
              !isCrimeDetailsFilled
                ? "bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300"
                : "bg-rose-700 hover:bg-rose-800 text-white cursor-pointer"
            }`}
            title={!isCrimeDetailsFilled ? "IIF-II प्रपत्र दर्ज करना आवश्यक है" : "Print A4 Document"}
          >
            <Printer className="w-3.5 h-3.5" />
            {templateLang === "hi" ? "प्रिंट A4 प्रपत्र" : "Print A4 Document"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleDownload}
            disabled={!isCrimeDetailsFilled}
            className={`font-bold text-xs gap-1.5 ${
              !isCrimeDetailsFilled
                ? "border-slate-200 text-slate-400 cursor-not-allowed bg-slate-50"
                : "border-slate-300 text-slate-700 cursor-pointer"
            }`}
            title={!isCrimeDetailsFilled ? "IIF-II प्रपत्र दर्ज करना आवश्यक है" : "Download A4"}
          >
            <Download className="w-3.5 h-3.5" />
            {templateLang === "hi" ? "डाउनलोड A4" : "Download A4"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCopy}
            className="border-slate-300 text-slate-700 font-bold text-xs gap-1.5"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            {copied
              ? (templateLang === "hi" ? "कॉपी हो गया" : "Copied")
              : (templateLang === "hi" ? "टेक्स्ट कॉपी करें" : "Copy Text")}
          </Button>
        </div>
      </div>

      {/* FIR Module Workspace Navigation */}
      <FIRWorkspaceNav firId={selectedFirId} />

      {/* Statutory Restriction Banner if Crime Detail Form (IIF-II) is not filled */}
      {!isCrimeDetailsFilled && activeFir && (
        <div className="rounded-xl border-2 border-amber-400 bg-gradient-to-r from-amber-50 via-amber-100/70 to-amber-50 p-4 text-amber-950 shadow-md animate-in fade-in-50">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-200 border border-amber-400 flex items-center justify-center text-amber-900 shrink-0">
                <AlertTriangle className="w-5 h-5 animate-bounce" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-amber-950">
                    {templateLang === "hi"
                      ? "⚠️ वैधानिक प्रतिबंध: अपराध विवरण प्रपत्र (Crime Detail Form IIF-II) लंबित है"
                      : "⚠️ Statutory Pre-requisite: Crime Detail Form (IIF-II) is Pending"}
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-300 text-amber-950 border border-amber-400 uppercase">
                    Mandatory
                  </span>
                </div>
                <p className="text-xs text-amber-900 mt-1 max-w-3xl leading-relaxed">
                  {templateLang === "hi"
                    ? `अभियोग (FIR No. ${activeFir.firNumber}) में जब तक 'Crime Details (IIF-II)' फॉर्म भरकर FIR प्रोफ़ाइल के दस्तावेज़ पैनल (Documents Panel) में सेव नहीं हो जाता, तब तक गिरफ़्तारी प्रपत्र (Arrest Docs & IIF-III) जनरेट, प्रिंट या सेव नहीं किए जा सकते। FIR प्रोफ़ाइल में IIF-II का बटन तब तक लगातार चमकता (glow) रहेगा जब तक वह दर्ज न हो जाए।`
                    : `In FIR No. ${activeFir.firNumber}, until Crime Detail Form (IIF-II) is completed and saved into the FIR Profile's Documents panel, Arrest Docs & IIF-III cannot be generated, printed, or saved. The IIF-II button in the FIR profile will continue glowing until completed.`}
                </p>
              </div>
            </div>

            <Link
              href={`/fir/${activeFir.id}?openCrimeDetails=true`}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-sm transition-all hover:scale-[1.02] shrink-0"
            >
              <Sparkles className="w-4 h-4 text-amber-200" />
              <span>
                {templateLang === "hi"
                  ? "FIR प्रोफ़ाइल में IIF-II भरें →"
                  : "Complete IIF-II in FIR Profile →"}
              </span>
            </Link>
          </div>
        </div>
      )}

      {/* Verified Banner when Crime Details IIF-II is already recorded */}
      {isCrimeDetailsFilled && activeFir && (
        <div className="rounded-lg border border-emerald-300 bg-emerald-50/70 p-2.5 text-emerald-900 flex items-center justify-between text-xs shadow-2xs">
          <div className="flex items-center gap-2 font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>
              {templateLang === "hi"
                ? `✓ अपराध विवरण प्रपत्र (IIF-II) FIR दस्तावेज़ पैनल में सत्यापित — गिरफ़्तारी प्रपत्र तैयार करने हेतु अधिकृत`
                : `✓ Crime Detail Form (IIF-II) Verified in FIR Documents — Authorized to generate Arrest Docs`}
            </span>
          </div>
          <Link
            href={`/fir/${activeFir.id}?tab=documents`}
            className="text-[11px] font-bold text-emerald-700 hover:underline flex items-center gap-1"
          >
            <span>{templateLang === "hi" ? "दस्तावेज़ पैनल देखें" : "View Documents Panel"}</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      )}

      {/* Case & Template Selector Header Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
              {templateLang === "hi" ? "सक्रिय अभियोग (FIR) चुनें *" : "Select Active FIR Case *"}
            </label>
            <select
              value={selectedFirId}
              onChange={(e) => setSelectedFirId(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white font-bold text-slate-900"
            >
              {firs.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.firNumber} — {f.actsAndSections.slice(0, 40)} ({f.complainantName})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
              {templateLang === "hi" ? "अभियुक्त चुनें (Select Accused) *" : "Select Accused Person *"}
            </label>
            <select
              value={selectedAccusedId}
              onChange={(e) => handleSelectAccused(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white font-bold text-slate-900"
            >
              {(activeFir?.accusedList && activeFir.accusedList.length > 0) ? (
                activeFir.accusedList.map((acc, idx) => (
                  <option key={acc.id || `acc_${idx}`} value={acc.id || `acc_${idx}`}>
                    {acc.name} {acc.alias ? `(${acc.alias})` : ""} {acc.fatherName ? `s/o ${acc.fatherName}` : ""}
                  </option>
                ))
              ) : (
                <option value="">{formData.noticeeName || (templateLang === "hi" ? "विकास शर्मा (डिफ़ॉल्ट अभियुक्त)" : "Vikas Sharma (Default Accused)")}</option>
              )}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
              {templateLang === "hi" ? "गिरफ्तारी प्रपत्र प्रोफार्मा चुनें *" : "Select Arrest Document Proforma *"}
            </label>
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value as ArrestDocTemplateType)}
              className="w-full text-xs p-2.5 rounded-lg border border-rose-300 bg-rose-50/40 font-bold text-rose-950"
            >
              {Object.entries(TEMPLATE_CONFIG).map(([key, cfg]) => (
                <option key={key} value={key}>
                  {templateLang === "hi" ? cfg.labelHi : cfg.labelEn}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Toolbar: Font Size, Language & Reset */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-semibold text-[11px]">{templateLang === "hi" ? "फॉन्ट आकार:" : "Font Size:"}</span>
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

            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded border border-slate-200">
              <button
                type="button"
                onClick={() => handleToggleLanguage("hi")}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                  templateLang === "hi" ? "bg-white text-rose-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                हिन्दी
              </button>
              <button
                type="button"
                onClick={() => handleToggleLanguage("en")}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                  templateLang === "en" ? "bg-white text-rose-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
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
              <span>{templateLang === "hi" ? "टेम्पलेट रीसेट" : "Reset Template"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Fully Editable Official Legal Document Canvas */}
      <div className="flex justify-center">
        <div
          id="arrest-printable-doc"
          className={`w-full max-w-4xl transition-all ${
            selectedTemplate === "arrest_memo"
              ? "bg-transparent p-0 border-none shadow-none"
              : `bg-white border border-slate-400 p-6 sm:p-12 text-slate-950 font-serif ${
                  fontSize === "compact" ? "text-xs" : fontSize === "large" ? "text-base" : "text-sm"
                }`
          }`}
          style={selectedTemplate === "arrest_memo" ? {} : { minHeight: "1050px", lineHeight: "1.7" }}
        >
          {/* ================= 1. ARREST MEMO FORM 26.8(1) (4 PAGES) ================= */}
          {selectedTemplate === "arrest_memo" && (
            <ArrestMemoForm268
              formData={formData}
              language={templateLang}
              onChangeField={handleFieldChange}
              onUpdateWitness={handleUpdateWitnessRow}
              onAddWitness={handleAddWitnessRow}
              onDeleteWitness={handleDeleteWitnessRow}
              onUpdateJamaTalashi={handleUpdateJamaTalashiRow}
              onAddJamaTalashi={handleAddJamaTalashiRow}
              onDeleteJamaTalashi={handleDeleteJamaTalashiRow}
            />
          )}

          {/* ================= 2. FARD JAMATALASHI ================= */}
          {selectedTemplate === "fard_jamatalashi" && renderHaryanaPoliceFardDocument("fard_jamatalashi")}

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
                  <span className="text-xs font-bold underline">
                    {templateLang === "hi" ? "गिरफ्तारी के ठोस आधार (Specific Grounds of Arrest):" : "Specific Grounds of Arrest:"}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleAddPoint("groundsPoints")}
                    className="no-print text-xs text-rose-700 hover:text-rose-900 font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> {templateLang === "hi" ? "आधार बिंदु जोड़ें" : "Add Ground"}
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
                  <span className="text-xs font-bold underline">
                    {templateLang === "hi" ? "विधिक अधिकार (Statutory Legal Rights):" : "Statutory Legal Rights:"}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleAddPoint("rightsPoints")}
                    className="no-print text-xs text-rose-700 hover:text-rose-900 font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> {templateLang === "hi" ? "अधिकार बिंदु जोड़ें" : "Add Right"}
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
                <span className="text-xs font-bold underline">
                  {templateLang === "hi" ? "अभियुक्त की पावती (Receipt Clause):" : "Accused Receipt Clause:"}
                </span>
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
                <span className="text-xs font-bold underline">
                  {templateLang === "hi" ? "शारीरिक लक्षण व पहचान सूची:" : "Physical Features & Identification Traits:"}
                </span>
                <button
                  type="button"
                  onClick={handleAddTraitRow}
                  className="no-print text-xs text-rose-700 hover:text-rose-900 font-bold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> {templateLang === "hi" ? "लक्षण जोड़ें" : "Add Trait"}
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
          {selectedTemplate === "fard_baramadgi" && renderHaryanaPoliceFardDocument("fard_baramadgi")}

          {/* ================= 6. REMAND APPLICATION ================= */}
          {selectedTemplate === "remand_application" && (
            <div className="space-y-6">
              <div className="text-center space-y-1 pb-2 border-b border-slate-400">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-xs font-bold">{templateLang === "hi" ? "न्यायालय:" : "Court:"}</span>
                  <input
                    type="text"
                    value={formData.courtName || ""}
                    onChange={(e) => handleFieldChange("courtName", e.target.value)}
                    className="font-bold text-sm text-center border-b border-dotted border-slate-700 outline-none w-80"
                  />
                </div>
                <input
                  type="text"
                  value={formData.docTitle || (templateLang === "hi" ? "प्रार्थना पत्र बाबत हासिल करने पुलिस हिरासत रिमांड" : "APPLICATION FOR POLICE CUSTODY REMAND")}
                  onChange={(e) => handleFieldChange("docTitle", e.target.value)}
                  className="text-center font-bold text-base w-full bg-transparent outline-none"
                />
                <input
                  type="text"
                  value={formData.docSubTitle || (templateLang === "hi" ? "अंतर्गत धारा 187 BNSS, 2023" : "Under Section 187 BNSS, 2023")}
                  onChange={(e) => handleFieldChange("docSubTitle", e.target.value)}
                  className="text-center text-xs text-slate-700 w-full bg-transparent outline-none"
                />
              </div>

              {/* Subject */}
              <div className="flex items-center gap-2 text-xs font-bold">
                <span className="shrink-0">{templateLang === "hi" ? "विषय:" : "Subject:"}</span>
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
                  <span className="text-xs font-bold underline">
                    {templateLang === "hi" ? "पुलिस रिमांड के ठोस आधार (Grounds for Police Remand):" : "Specific Grounds for Police Custody Remand:"}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleAddPoint("remandPoints")}
                    className="no-print text-xs text-rose-700 hover:text-rose-900 font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> {templateLang === "hi" ? "रिमांड बिंदु जोड़ें" : "Add Ground"}
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
                <span className="text-xs font-bold underline">
                  {templateLang === "hi" ? "प्रार्थना (Prayer):" : "Prayer:"}
                </span>
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
          {selectedTemplate === "fard_nishandehi" && renderHaryanaPoliceFardDocument("fard_nishandehi")}

          {/* ================= 8. FARD INKESAHF ================= */}
          {selectedTemplate === "fard_inkeshaf" && renderHaryanaPoliceFardDocument("fard_inkeshaf")}

          {/* ================= 9. MEDICAL LETTER ================= */}
          {selectedTemplate === "medical_letter" && (
            <div className="space-y-6">
              {renderOfficialHeader()}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs border border-slate-300 p-3 bg-slate-50">
                <div className="flex items-center gap-2">
                  <span className="font-bold shrink-0">{templateLang === "hi" ? "चिकित्सा अधिकारी:" : "Medical Officer:"}</span>
                  <input
                    type="text"
                    value={formData.medicalOfficerName || ""}
                    onChange={(e) => handleFieldChange("medicalOfficerName", e.target.value)}
                    className="w-full bg-transparent border-b border-dotted border-slate-400 outline-none font-bold"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold shrink-0">{templateLang === "hi" ? "अस्पताल:" : "Hospital:"}</span>
                  <input
                    type="text"
                    value={formData.hospitalName || ""}
                    onChange={(e) => handleFieldChange("hospitalName", e.target.value)}
                    className="w-full bg-transparent border-b border-dotted border-slate-400 outline-none font-bold"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-bold">
                <span className="shrink-0">{templateLang === "hi" ? "विषय:" : "Subject:"}</span>
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
                  <span className="text-xs font-bold underline">
                    {templateLang === "hi" ? "परीक्षण बिंदु (Medical Queries):" : "Medical Examination Queries:"}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleAddPoint("medicalPoints")}
                    className="no-print text-xs text-rose-700 hover:text-rose-900 font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> {templateLang === "hi" ? "बिंदु जोड़ें" : "Add Query"}
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
                  <span className="text-xs font-bold underline">
                    {templateLang === "hi" ? "साथ जाने वाले पुलिस कर्मचारी (Escort Staff):" : "Escort Police Personnel:"}
                  </span>
                  <button
                    type="button"
                    onClick={handleAddEscortRow}
                    className="no-print text-xs text-rose-700 hover:text-rose-900 font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> {templateLang === "hi" ? "कर्मचारी जोड़ें" : "Add Officer"}
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
                        placeholder={templateLang === "hi" ? "नाम व पद" : "Name & Rank"}
                      />
                      <input
                        type="text"
                        value={esc.beltNo}
                        onChange={(e) => handleUpdateEscortRow(esc.id, "beltNo", e.target.value)}
                        className="w-28 bg-transparent outline-none border-b border-dotted border-slate-400"
                        placeholder={templateLang === "hi" ? "बेल्ट न0" : "Belt No."}
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
                <span className="text-xs font-bold underline">
                  {templateLang === "hi" ? "अनुरोध (Request):" : "Requisition / Prayer:"}
                </span>
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
                  <span className="text-xs font-bold">{templateLang === "hi" ? "न्यायालय:" : "Court:"}</span>
                  <input
                    type="text"
                    value={formData.courtName || ""}
                    onChange={(e) => handleFieldChange("courtName", e.target.value)}
                    className="font-bold text-sm text-center border-b border-dotted border-slate-700 outline-none w-80"
                  />
                </div>
                <input
                  type="text"
                  value={formData.docTitle || (templateLang === "hi" ? "प्रार्थना पत्र बाबत पेशी अभियुक्त व भेजने न्यायिक हिरासत (जेल)" : "APPLICATION FOR PRODUCTION OF ACCUSED & REMAND TO JUDICIAL CUSTODY")}
                  onChange={(e) => handleFieldChange("docTitle", e.target.value)}
                  className="text-center font-bold text-base w-full bg-transparent outline-none"
                />
                <input
                  type="text"
                  value={formData.docSubTitle || (templateLang === "hi" ? "अंतर्गत धारा 187 BNSS, 2023" : "Under Section 187 BNSS, 2023")}
                  onChange={(e) => handleFieldChange("docSubTitle", e.target.value)}
                  className="text-center text-xs text-slate-700 w-full bg-transparent outline-none"
                />
              </div>

              <div className="flex items-center gap-2 text-xs font-bold">
                <span className="shrink-0">{templateLang === "hi" ? "विषय:" : "Subject:"}</span>
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
                  <span className="text-xs font-bold underline">
                    {templateLang === "hi" ? "न्यायिक हिरासत के आधार:" : "Grounds for Judicial Remand:"}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleAddPoint("peshiPoints")}
                    className="no-print text-xs text-rose-700 hover:text-rose-900 font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> {templateLang === "hi" ? "बिंदु जोड़ें" : "Add Ground"}
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
                <span className="text-xs font-bold underline">
                  {templateLang === "hi" ? "प्रार्थना:" : "Prayer:"}
                </span>
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

      {/* 4 A4 Pages Preview Modal */}
      {isPreviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-xs" onClick={() => setIsPreviewModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-300 max-w-5xl w-full max-h-[92vh] flex flex-col z-10 overflow-hidden animate-in fade-in-0 zoom-in-95">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold bg-rose-600/30 text-rose-300 px-2 py-0.5 rounded border border-rose-500/40">
                  A4 4-पेज पूर्वावलोकन
                </span>
                <h3 className="font-bold text-sm sm:text-base text-white">
                  {TEMPLATE_CONFIG[selectedTemplate]?.label || "गिरफ्तारी प्रपत्र"} • FIR: {formData.complaintNo}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={handlePrint}
                  className="bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  प्रिंट करें (Print)
                </Button>
                <button
                  type="button"
                  onClick={() => setIsPreviewModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4 sm:p-6 bg-slate-100 flex justify-center">
              <iframe
                title="Arrest Memo 4 Page Preview"
                srcDoc={previewHtml}
                className="w-full min-h-[700px] h-[78vh] bg-white rounded-xl border border-slate-300 shadow-md"
              />
            </div>
          </div>
        </div>
      )}

      {/* Save Success to FIR Profile Modal */}
      {saveSuccessInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setSaveSuccessInfo(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl border border-emerald-200 max-w-lg w-full p-6 space-y-4 z-10 animate-in fade-in-0 zoom-in-95 text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">
                दस्तावेज FIR प्रोफाइल में सुरक्षित सहेजा गया!
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                दस्तावेज को IndexedDB एवं Universal Evidence AI Pipeline में प्रोसेस व इंडेक्स कर दिया गया है। मूल स्वरूप में देखा जा सकता है।
              </p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-left text-xs space-y-1 font-sans">
              <div className="flex justify-between">
                <span className="text-slate-500">दस्तावेज शीर्षक:</span>
                <span className="font-bold text-slate-900 truncate max-w-[240px]">{saveSuccessInfo.docTitle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">FIR सं.:</span>
                <span className="font-bold text-slate-900">{saveSuccessInfo.firNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">दस्तावेज ID:</span>
                <span className="font-mono text-slate-600">{saveSuccessInfo.docId}</span>
              </div>
            </div>

            <div className="p-2.5 bg-purple-50 border border-purple-200 rounded-xl text-left flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-purple-600 mt-0.5 shrink-0" />
              <div className="text-xs text-purple-900">
                <span className="font-bold">रोजनामचा आम (GD) ऑटो-सुझाव तैयार:</span>
                <p className="text-[11px] text-purple-700 mt-0.5 leading-relaxed">
                  इस गिरफ्तारी / समर्पण प्रपत्र का ऑटो-सुझाव रोजनामचा GD के <strong>Suggestions & Drafts</strong> टैब में प्रेषित कर दिया गया है।
                </p>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSaveSuccessInfo(null)}
                className="text-xs font-semibold"
              >
                बंद करें (Close)
              </Button>
              <Link
                href={`/general-diary?tab=SUGGESTIONS_DRAFTS`}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-bold shadow-sm transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>रोजनामचा GD सुझाव देखें</span>
              </Link>
              <Link
                href={`/fir/${saveSuccessInfo.firId}?tab=documents`}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-sm transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>FIR Profile में देखें</span>
              </Link>
            </div>
          </div>
        </div>
      )}
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
