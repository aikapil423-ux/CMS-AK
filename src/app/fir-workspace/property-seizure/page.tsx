"use client";

import React, { useState, useEffect, Suspense, useRef } from "react";
import { useSearchParams } from "next/navigation";
import {
  Printer,
  Download,
  Save,
  Eye,
  Plus,
  Trash2,
  RotateCcw,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  ExternalLink,
  X,
  PackageCheck,
  Check,
  Languages,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { Button } from "@/components/ui/button";
import { firService } from "@/services/firService";
import { universalEvidenceService } from "@/services/universalEvidenceService";
import { evidenceBlobStore } from "@/services/evidenceBlobStore";
import { FIRItem, FIRDocumentItem } from "@/types";
import { FIRWorkspaceNav } from "@/components/fir-workspace/FIRWorkspaceNav";
import { formatDate } from "@/lib/utils";
import { printA4Element, downloadA4DocumentAsHtml } from "@/utils/printElement";

// Witness Row Item
export interface PropertyWitnessItem {
  id: string;
  name: string;
  addressAndPhone: string;
  signatureText?: string;
  signatureImg?: string;
}

// Seized Article Row Item (Detailed Inventory Table 12)
export interface SeizedArticleItem {
  id: string;
  srNo: string;
  description: string;
  sealDetails: string;
  photoUrl?: string;
}

// Property Seizure Form Data
export interface PropertySeizureFormData {
  pageNumber: string;
  district: string;
  policeStation: string;
  year: string;
  firNumber: string;
  firDate: string;
  actsAndSections: string;

  // Property types (checkboxes)
  propertyTypeArms: boolean;
  propertyTypeFakeNotes: boolean;
  propertyTypeExplosive: boolean;
  propertyTypeNarcotics: boolean;
  propertyTypeGoldSilver: boolean;
  propertyTypeOther: boolean;
  propertyTypeOtherText: string;

  // Seizure Date, Time, Place
  seizureDate: string;
  seizureTime: string;
  seizurePlace: string;

  // Person Details
  personName: string;
  fatherName: string;
  gender: string;
  age: string;
  occupation: string;
  address: string;
  presenterDetails: string;
  isProfessionalReceiver: "हाँ" | "नहीं" | "Yes" | "No";

  // Witnesses (Table 6)
  witnesses: PropertyWitnessItem[];

  // Identification (Section 7)
  isIdentificationRequired: "हाँ" | "नहीं" | "Yes" | "No";
  identificationDetails: string;

  // Estimated Value (Section 8)
  estimatedValue: string;

  // Summary Movable / Immovable Property (Section 9)
  propertySummaryLines: { id: string; text: string }[];

  // Grounds & Circumstances (Section 10)
  seizureGrounds: { id: string; text: string }[];

  // Packing & Delivery clause (Section 11)
  deliveryClauseText: string;
  sealSampleDescription: string;
  copyHandedToPerson: string;
  stampThanaName: string;
  stampDistrictName: string;
  stampImg?: string;

  // Detailed Seized Articles (Section 12)
  seizedArticles: SeizedArticleItem[];

  // Person from whom seized Signature
  accusedSignText: string;
  accusedSignImg?: string;
  accusedSignPlace: string;
  accusedSignDate: string;

  // IO Details (Section 13)
  ioName: string;
  ioRank: string;
  ioBeltNo: string;
  ioPoliceStation: string;
  ioSignText: string;
  ioSignImg?: string;
}

const DEFAULT_SAMPLE_HI: PropertySeizureFormData = {
  pageNumber: "89",
  district: "पानीपत",
  policeStation: "साईबर क्राईम",
  year: "2025",
  firNumber: "60",
  firDate: "04.06.25",
  actsAndSections: "318(4), 61(2) BNS",

  propertyTypeArms: false,
  propertyTypeFakeNotes: false,
  propertyTypeExplosive: false,
  propertyTypeNarcotics: false,
  propertyTypeGoldSilver: false,
  propertyTypeOther: true,
  propertyTypeOtherText: "चुराई हुई / गैरकानूनी कब्जा / संलिप्त निक्षीपयत (वारदात की राशि)",

  seizureDate: "11.06.25",
  seizureTime: "8:50",
  seizurePlace: "BPC कालोनी रोहतक",

  personName: "पवन",
  fatherName: "धर्मवीर",
  gender: "पुरुष",
  age: "45",
  occupation: "कारोबार",
  address: "गाँव रिवासा जींद",
  presenterDetails: "-",
  isProfessionalReceiver: "नहीं",

  witnesses: [
    {
      id: "wit_1",
      name: "ASI दीपक",
      addressAndPhone: "थाना साईबर क्राईम, पानीपत",
      signatureText: "दीपक",
    },
    {
      id: "wit_2",
      name: "HC मनिन्दर नं. 1630/PPT",
      addressAndPhone: "थाना साईबर क्राईम, पानीपत",
      signatureText: "मनिन्दर",
    },
  ],

  isIdentificationRequired: "नहीं",
  identificationDetails: "भारतीय करंसी नोटों की क्रमबद्ध गिनती व मिलान",

  estimatedValue: "51,500/- (इक्यावन हजार पांच सौ रुपये)",

  propertySummaryLines: [
    { id: "sum_1", text: "भारतीय करंसी नोट 51500 रुपये (103 x 500)" },
    { id: "sum_2", text: "कुल 51500 रुपये" },
  ],

  seizureGrounds: [
    { id: "gr_1", text: "अनुसंधान के दौरान आरोपी द्वारा बरामद करवाने पर" },
    { id: "gr_2", text: "अभियुक्त के इकबालिया बयान के आधार पर निशानदेही उपरांत बरामदगी" },
  ],

  deliveryClauseText:
    "उपरोक्त उल्लेख की गई सम्पत्ति को कानूनी सम्मत व उपरोक्त दर्शाए गए गवाहान की मौजूदगी में जब्त किया गया और जब्ती फार्म की एक प्रति उस व्यक्ति को / जगह के निवासी को दी गई:",
  sealSampleDescription: "KS / 1 (थाना मोहर)",
  copyHandedToPerson: "पवन पुत्र धर्मवीर (पावती प्राप्त)",
  stampThanaName: "PS. CYBER CRIME",
  stampDistrictName: "PANIPAT",

  seizedArticles: [
    {
      id: "art_1",
      srNo: "1.",
      description: "51500 कुल भारतीय करेंसी नोट (103 नोट 500 रुपये के)",
      sealDetails: "KS / 1",
    },
    {
      id: "art_2",
      srNo: "2.",
      description: "सफेद लिफाफा जिसमें उपरोक्त 103 नोट सीलबंद किए गए",
      sealDetails: "KS / 1",
    },
  ],

  accusedSignText: "पवन",
  accusedSignPlace: "रोहतक",
  accusedSignDate: "11.06.25",

  ioName: "कृष्ण कुमार",
  ioRank: "ASI",
  ioBeltNo: "123/PPT",
  ioPoliceStation: "साईबर क्राईम पानीपत",
  ioSignText: "कृष्ण कुमार",
};

const DEFAULT_SAMPLE_EN: PropertySeizureFormData = {
  pageNumber: "89",
  district: "PANIPAT",
  policeStation: "CYBER CRIME",
  year: "2025",
  firNumber: "60",
  firDate: "04.06.2025",
  actsAndSections: "Section 318(4), 61(2) BNS",

  propertyTypeArms: false,
  propertyTypeFakeNotes: false,
  propertyTypeExplosive: false,
  propertyTypeNarcotics: false,
  propertyTypeGoldSilver: false,
  propertyTypeOther: true,
  propertyTypeOtherText: "Stolen / Unlawful Possession / Crime Proceeds",

  seizureDate: "11.06.2025",
  seizureTime: "08:50 AM",
  seizurePlace: "BPC Colony, Rohtak",

  personName: "Pawan",
  fatherName: "Dharamveer",
  gender: "Male",
  age: "45",
  occupation: "Trader / Business",
  address: "Village Riwasa, District Jind",
  presenterDetails: "-",
  isProfessionalReceiver: "No",

  witnesses: [
    {
      id: "wit_1",
      name: "ASI Deepak",
      addressAndPhone: "Police Station Cyber Crime, Panipat",
      signatureText: "Deepak",
    },
    {
      id: "wit_2",
      name: "HC Moninder No.1630/PPT",
      addressAndPhone: "Police Station Cyber Crime, Panipat",
      signatureText: "Moninder",
    },
  ],

  isIdentificationRequired: "No",
  identificationDetails: "Serial numbers and denomination counting of Indian currency notes",

  estimatedValue: "Rs. 51,500/- (Fifty One Thousand Five Hundred Only)",

  propertySummaryLines: [
    { id: "sum_1", text: "Indian currency notes totaling Rs. 51,500/- (103 notes of denomination 500)" },
    { id: "sum_2", text: "Total Rs. 51,500/-" },
  ],

  seizureGrounds: [
    { id: "gr_1", text: "Recovered during custodial investigation at the instance of accused" },
    { id: "gr_2", text: "Effected on pointing out pursuant to voluntary confession statement" },
  ],

  deliveryClauseText:
    "The aforementioned property was seized in accordance with statutory procedure in the presence of the witnesses cited above, and a carbon copy of this seizure form was delivered to the person / occupant of the place:",
  sealSampleDescription: "KS / 1 (Police Station Seal)",
  copyHandedToPerson: "Pawan s/o Dharamveer (Receipt acknowledged)",
  stampThanaName: "PS. CYBER CRIME",
  stampDistrictName: "PANIPAT",

  seizedArticles: [
    {
      id: "art_1",
      srNo: "1.",
      description: "Indian Currency Notes Rs. 51,500/- (103 notes of denomination Rs. 500/-)",
      sealDetails: "KS / 1",
    },
    {
      id: "art_2",
      srNo: "2.",
      description: "White envelope packaging containing the above sealed currency notes",
      sealDetails: "KS / 1",
    },
  ],

  accusedSignText: "Pawan",
  accusedSignPlace: "Rohtak",
  accusedSignDate: "11.06.2025",

  ioName: "Krishan Kumar",
  ioRank: "ASI",
  ioBeltNo: "123/PPT",
  ioPoliceStation: "Cyber Crime Police Station, Panipat",
  ioSignText: "Krishan Kumar",
};

function PropertySeizurePageContent() {
  const searchParams = useSearchParams();
  const firIdParam = searchParams.get("firId");
  const { currentUser } = useAuth();
  const { language: globalLang, setLanguage: setGlobalLanguage } = useLanguage();

  const [firs, setFirs] = useState<FIRItem[]>([]);
  const [selectedFirId, setSelectedFirId] = useState<string>(firIdParam || "");
  const [templateLang, setTemplateLang] = useState<"hi" | "en">(globalLang === "en" ? "en" : "hi");
  const [formData, setFormData] = useState<PropertySeizureFormData>(
    globalLang === "en" ? DEFAULT_SAMPLE_EN : DEFAULT_SAMPLE_HI
  );

  const [isSavingToFir, setIsSavingToFir] = useState(false);
  const [saveSuccessInfo, setSaveSuccessInfo] = useState<{
    firId: string;
    firNumber: string;
    docTitle: string;
  } | null>(null);

  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string>("");

  // Hidden file inputs for upload
  const accusedSignInputRef = useRef<HTMLInputElement>(null);
  const ioSignInputRef = useRef<HTMLInputElement>(null);
  const stampImgInputRef = useRef<HTMLInputElement>(null);
  const [articleRowPhotoUploadId, setArticleRowPhotoUploadId] = useState<string | null>(null);
  const articlePhotoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const allFirs = firService.getAllFirs();
    setFirs(allFirs);
    if (firIdParam && allFirs.some((f) => f.id === firIdParam || f.firNumber === firIdParam)) {
      setSelectedFirId(firIdParam);
    }
  }, [firIdParam]);

  const activeFir = firs.find((f) => f.id === selectedFirId || f.firNumber === selectedFirId);

  // Auto-fill case details when activeFir changes
  useEffect(() => {
    if (!activeFir) return;

    setFormData((prev) => {
      const accusedList = activeFir.accusedList || [];
      const firstAccused = accusedList[0];

      return {
        ...prev,
        district: activeFir.district || prev.district,
        policeStation: activeFir.policeStation || prev.policeStation,
        year: activeFir.firDate ? activeFir.firDate.split("-")[0] || prev.year : prev.year,
        firNumber: activeFir.firNumber || prev.firNumber,
        firDate: activeFir.firDate || prev.firDate,
        actsAndSections: activeFir.actsAndSections || prev.actsAndSections,

        personName: firstAccused?.name || prev.personName,
        fatherName: firstAccused?.fatherName || firstAccused?.relativeName || prev.fatherName,
        gender: (firstAccused as any)?.gender || prev.gender,
        age: (firstAccused as any)?.age ? `${(firstAccused as any).age}` : prev.age,
        address: firstAccused?.address || prev.address,

        accusedSignText: firstAccused?.name || prev.accusedSignText,
        ioName: activeFir.assignedIoName || currentUser.name || prev.ioName,
        ioRank: activeFir.assignedIoRank || currentUser.rank || prev.ioRank,
        ioBeltNo: activeFir.assignedIoBeltNumber || currentUser.pno || prev.ioBeltNo,
        ioPoliceStation: activeFir.policeStation || prev.ioPoliceStation,
      };
    });
  }, [activeFir, currentUser]);

  // Handle language switch
  const handleToggleLanguage = (newLang: "hi" | "en", syncGlobal = true) => {
    setTemplateLang(newLang);
    if (syncGlobal && setGlobalLanguage) {
      setGlobalLanguage(newLang);
    }
    const targetBase = newLang === "hi" ? DEFAULT_SAMPLE_HI : DEFAULT_SAMPLE_EN;
    const currentBase = newLang === "hi" ? DEFAULT_SAMPLE_EN : DEFAULT_SAMPLE_HI;

    // If viewing official sample case (or no active FIR chosen), swap all fields to target language
    if (!selectedFirId) {
      setFormData((prev) => ({
        ...targetBase,
        accusedSignImg: prev.accusedSignImg,
        ioSignImg: prev.ioSignImg,
        stampImg: prev.stampImg,
      }));
      return;
    }

    // If an active FIR is selected, translate clauses, options, and boilerplate items
    setFormData((prev) => {
      const updated = { ...prev };

      // Option fields (Yes / No, Gender)
      if (prev.isProfessionalReceiver === "हाँ" || prev.isProfessionalReceiver === "Yes") {
        updated.isProfessionalReceiver = newLang === "hi" ? "हाँ" : "Yes";
      } else {
        updated.isProfessionalReceiver = newLang === "hi" ? "नहीं" : "No";
      }

      if (prev.isIdentificationRequired === "हाँ" || prev.isIdentificationRequired === "Yes") {
        updated.isIdentificationRequired = newLang === "hi" ? "हाँ" : "Yes";
      } else {
        updated.isIdentificationRequired = newLang === "hi" ? "नहीं" : "No";
      }

      if (prev.gender === "Male" || prev.gender === "पुरुष") {
        updated.gender = newLang === "hi" ? "पुरुष" : "Male";
      } else if (prev.gender === "Female" || prev.gender === "महिला") {
        updated.gender = newLang === "hi" ? "महिला" : "Female";
      }

      // Boilerplate legal texts and stamp labels
      updated.deliveryClauseText = targetBase.deliveryClauseText;
      updated.stampDistrictName = targetBase.stampDistrictName;
      updated.stampThanaName = targetBase.stampThanaName;

      // Smart swap for default texts if user hasn't typed custom values
      if (prev.propertyTypeOtherText === currentBase.propertyTypeOtherText || !prev.propertyTypeOtherText) {
        updated.propertyTypeOtherText = targetBase.propertyTypeOtherText;
      }
      if (prev.identificationDetails === currentBase.identificationDetails || !prev.identificationDetails) {
        updated.identificationDetails = targetBase.identificationDetails;
      }
      if (prev.estimatedValue === currentBase.estimatedValue || !prev.estimatedValue) {
        updated.estimatedValue = targetBase.estimatedValue;
      }
      if (prev.sealSampleDescription === currentBase.sealSampleDescription || !prev.sealSampleDescription) {
        updated.sealSampleDescription = targetBase.sealSampleDescription;
      }
      if (prev.copyHandedToPerson === currentBase.copyHandedToPerson || !prev.copyHandedToPerson) {
        updated.copyHandedToPerson = targetBase.copyHandedToPerson;
      }
      if (prev.accusedSignPlace === currentBase.accusedSignPlace || !prev.accusedSignPlace) {
        updated.accusedSignPlace = targetBase.accusedSignPlace;
      }

      // Lists: witnesses, propertySummaryLines, seizureGrounds, seizedArticles
      if (
        !prev.witnesses ||
        prev.witnesses.length === 0 ||
        JSON.stringify(prev.witnesses.map((w) => w.name)) === JSON.stringify(currentBase.witnesses.map((w) => w.name))
      ) {
        updated.witnesses = targetBase.witnesses;
      }

      if (
        !prev.propertySummaryLines ||
        prev.propertySummaryLines.length === 0 ||
        JSON.stringify(prev.propertySummaryLines.map((s) => s.text)) === JSON.stringify(currentBase.propertySummaryLines.map((s) => s.text))
      ) {
        updated.propertySummaryLines = targetBase.propertySummaryLines;
      }

      if (
        !prev.seizureGrounds ||
        prev.seizureGrounds.length === 0 ||
        JSON.stringify(prev.seizureGrounds.map((g) => g.text)) === JSON.stringify(currentBase.seizureGrounds.map((g) => g.text))
      ) {
        updated.seizureGrounds = targetBase.seizureGrounds;
      }

      if (
        !prev.seizedArticles ||
        prev.seizedArticles.length === 0 ||
        JSON.stringify(prev.seizedArticles.map((a) => a.description)) === JSON.stringify(currentBase.seizedArticles.map((a) => a.description))
      ) {
        updated.seizedArticles = targetBase.seizedArticles.map((art, idx) => ({
          ...art,
          photoUrl: prev.seizedArticles?.[idx]?.photoUrl || art.photoUrl,
        }));
      }

      return updated;
    });
  };

  // Synchronize when global navbar language changes
  useEffect(() => {
    if (globalLang === "hi" || globalLang === "en") {
      if (globalLang !== templateLang) {
        handleToggleLanguage(globalLang, false);
      }
    }
  }, [globalLang]);

  const handleFieldChange = (field: keyof PropertySeizureFormData, val: any) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  const handleSelectFir = (firId: string) => {
    setSelectedFirId(firId);
    if (!firId) {
      const base = templateLang === "hi" ? DEFAULT_SAMPLE_HI : DEFAULT_SAMPLE_EN;
      setFormData({
        ...base,
        accusedSignImg: formData.accusedSignImg,
        ioSignImg: formData.ioSignImg,
        stampImg: formData.stampImg,
      });
    }
  };

  const handleResetSample = () => {
    const base = templateLang === "hi" ? DEFAULT_SAMPLE_HI : DEFAULT_SAMPLE_EN;
    setSelectedFirId("");
    setFormData({ ...base });
  };

  // Image Upload Helpers
  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "accusedSignImg" | "ioSignImg" | "stampImg"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        handleFieldChange(field, reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleArticlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !articleRowPhotoUploadId) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        const updated = (formData.seizedArticles || []).map((art) =>
          art.id === articleRowPhotoUploadId ? { ...art, photoUrl: reader.result as string } : art
        );
        handleFieldChange("seizedArticles", updated);
        setArticleRowPhotoUploadId(null);
      }
    };
    reader.readAsDataURL(file);
  };

  // Witness Row Actions
  const handleAddWitness = () => {
    const cur = formData.witnesses || [];
    const nextSr = `${cur.length + 1}`;
    const newWit: PropertyWitnessItem = {
      id: `wit_${Date.now()}`,
      name: "",
      addressAndPhone: "",
      signatureText: "",
    };
    handleFieldChange("witnesses", [...cur, newWit]);
  };

  const handleUpdateWitness = (id: string, key: keyof PropertyWitnessItem, val: string) => {
    const cur = formData.witnesses || [];
    const updated = cur.map((w) => (w.id === id ? { ...w, [key]: val } : w));
    handleFieldChange("witnesses", updated);
  };

  const handleDeleteWitness = (id: string) => {
    const cur = formData.witnesses || [];
    handleFieldChange(
      "witnesses",
      cur.filter((w) => w.id !== id)
    );
  };

  // Summary Lines Actions (Section 9)
  const handleAddSummaryLine = () => {
    const cur = formData.propertySummaryLines || [];
    const newLine = { id: `sum_${Date.now()}`, text: "" };
    handleFieldChange("propertySummaryLines", [...cur, newLine]);
  };

  const handleUpdateSummaryLine = (id: string, text: string) => {
    const cur = formData.propertySummaryLines || [];
    const updated = cur.map((l) => (l.id === id ? { ...l, text } : l));
    handleFieldChange("propertySummaryLines", updated);
  };

  const handleDeleteSummaryLine = (id: string) => {
    const cur = formData.propertySummaryLines || [];
    handleFieldChange(
      "propertySummaryLines",
      cur.filter((l) => l.id !== id)
    );
  };

  // Seizure Grounds Actions (Section 10)
  const handleAddGround = () => {
    const cur = formData.seizureGrounds || [];
    const newGround = { id: `gr_${Date.now()}`, text: "" };
    handleFieldChange("seizureGrounds", [...cur, newGround]);
  };

  const handleUpdateGround = (id: string, text: string) => {
    const cur = formData.seizureGrounds || [];
    const updated = cur.map((g) => (g.id === id ? { ...g, text } : g));
    handleFieldChange("seizureGrounds", updated);
  };

  const handleDeleteGround = (id: string) => {
    const cur = formData.seizureGrounds || [];
    handleFieldChange(
      "seizureGrounds",
      cur.filter((g) => g.id !== id)
    );
  };

  // Detailed Seized Articles Actions (Section 12)
  const handleAddArticle = () => {
    const cur = formData.seizedArticles || [];
    const nextSr = `${cur.length + 1}.`;
    const newArt: SeizedArticleItem = {
      id: `art_${Date.now()}`,
      srNo: nextSr,
      description: "",
      sealDetails: formData.sealSampleDescription || "KS / 1",
    };
    handleFieldChange("seizedArticles", [...cur, newArt]);
  };

  const handleUpdateArticle = (id: string, key: keyof SeizedArticleItem, val: string) => {
    const cur = formData.seizedArticles || [];
    const updated = cur.map((a) => (a.id === id ? { ...a, [key]: val } : a));
    handleFieldChange("seizedArticles", updated);
  };

  const handleDeleteArticle = (id: string) => {
    const cur = formData.seizedArticles || [];
    handleFieldChange(
      "seizedArticles",
      cur.filter((a) => a.id !== id)
    );
  };

  // Print & Download
  const handlePrint = () => {
    const title = `PROPERTY_SEIZURE_IIF_IV_FIR_${formData.firNumber || "Case"}`;
    printA4Element("property-seizure-printable", title);
  };

  const handleDownload = () => {
    const title = `PROPERTY_SEIZURE_IIF_IV_FIR_${formData.firNumber || "Case"}`;
    const docTitle =
      templateLang === "hi"
        ? "सम्पत्ति तलाशी एवं जब्ती फॉर्म (IIF-IV)"
        : "Property Search & Seizure Form (IIF-IV)";
    downloadA4DocumentAsHtml("property-seizure-printable", title, docTitle);
  };

  const handleOpenPreview = () => {
    const el = document.getElementById("property-seizure-printable");
    setPreviewHtml(
      `<!DOCTYPE html><html lang="${templateLang}"><head><meta charset="utf-8"/><title>Property Seizure Form IIF-IV</title><style>body{font-family:serif;padding:24px;color:#000;background:#fff;}table{width:100%;border-collapse:collapse;}th,td{border:1px solid #333;padding:6px;}</style></head><body>${el?.innerHTML || ""}</body></html>`
    );
    setIsPreviewModalOpen(true);
  };

  // Save to FIR Documents Module
  const handleSaveToFir = async () => {
    if (!activeFir) {
      alert("कृपया पहले एक सक्रिय FIR केस चुनें।");
      return;
    }

    setIsSavingToFir(true);
    try {
      const el = document.getElementById("property-seizure-printable");
      const htmlContent = `<!DOCTYPE html><html lang="${templateLang}"><head><meta charset="utf-8"/><title>सम्पत्ति तलाशी एवं जब्ती फॉर्म (IIF-IV)</title><style>body{font-family:serif;padding:24px;color:#000;background:#fff;}table{width:100%;border-collapse:collapse;}th,td{border:1px solid #333;padding:6px;}</style></head><body>${el?.innerHTML || ""}</body></html>`;

      const docTitle =
        templateLang === "hi"
          ? `सम्पत्ति जब्ती फॉर्म (IIF-IV) - ${formData.personName || "अभियुक्त"}`
          : `Property Seizure Form (IIF-IV) - ${formData.personName || "Accused"}`;
      const docFileBase = `property_seizure_iif4_${(formData.personName || "accused").toLowerCase().replace(/\s+/g, "_")}`;

      const docId = `doc-${Date.now()}`;
      const dataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`;
      const fileName = `${docFileBase}_${Date.now()}.html`;

      // 1. IndexedDB Blob Store
      if (typeof window !== "undefined") {
        await evidenceBlobStore.put(docId, dataUrl, { mimeType: "text/html", fileName });
      }

      // 2. Universal Evidence AI Analysis
      await universalEvidenceService.registerAndProcess({
        dataUrl,
        fileName,
        fileId: docId,
        caseId: activeFir.id,
        caseNumber: activeFir.firNumber,
        module: "FIR",
        uploadedBy: currentUser.name || "IO",
      });

      // 3. Register in FIR documents
      const newDoc: FIRDocumentItem = {
        id: docId,
        title: docTitle,
        fileName,
        category: "SEIZURE_MEMO",
        uploadedBy: `${currentUser.name || "IO"} (${currentUser.rank || "ASI"})`,
        uploadedAt: new Date().toISOString().replace("T", " ").slice(0, 16),
        dataUrl,
        fileSize: `${(htmlContent.length / 1024).toFixed(1)} KB`,
      };

      firService.addDocument(activeFir.id, newDoc);

      // 4. Audit Trail record
      firService.addAuditRecord(
        activeFir.id,
        "SEIZURE_FORM_SAVED",
        `${docTitle} generated and saved to FIR Documents by ${currentUser.name}`,
        currentUser.name,
        currentUser.rank
      );

      setSaveSuccessInfo({
        firId: activeFir.id,
        firNumber: activeFir.firNumber,
        docTitle,
      });
    } catch (err: any) {
      console.error("Save to FIR failed:", err);
      alert("दस्तावेज सहेजने में समस्या: " + (err.message || "अज्ञात त्रुटि"));
    } finally {
      setIsSavingToFir(false);
    }
  };

  return (
    <div className="space-y-4 font-sans pb-16">
      {/* Top Navigation Bar */}
      <FIRWorkspaceNav firId={selectedFirId} />

      {/* Control Action Toolbar */}
      <div className="no-print bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">
              {templateLang === "hi" ? "सक्रिय FIR केस:" : "Active FIR Case:"}
            </span>
            <select
              value={selectedFirId}
              onChange={(e) => handleSelectFir(e.target.value)}
              className="text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 outline-none focus:border-teal-500 max-w-xs"
            >
              <option value="">{templateLang === "hi" ? "-- नमूना केस (FIR 60) --" : "-- Sample Case (FIR 60) --"}</option>
              {firs.map((f) => (
                <option key={f.id} value={f.id}>
                  FIR #{f.firNumber} - PS {f.policeStation} ({f.actsAndSections || "Offence"})
                </option>
              ))}
            </select>
          </div>

          {/* Language Toggle */}
          <div className="flex items-center gap-1 border border-slate-200 rounded-lg p-0.5 bg-slate-50">
            <button
              type="button"
              onClick={() => handleToggleLanguage("hi")}
              className={`px-2.5 py-1 text-xs font-bold rounded-md transition-colors ${
                templateLang === "hi" ? "bg-teal-700 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              हिन्दी
            </button>
            <button
              type="button"
              onClick={() => handleToggleLanguage("en")}
              className={`px-2.5 py-1 text-xs font-bold rounded-md transition-colors ${
                templateLang === "en" ? "bg-teal-700 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              English
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap ml-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetSample}
            className="text-xs font-bold text-slate-700 cursor-pointer"
            title="Reset to official sample"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1" />
            {templateLang === "hi" ? "रीसेट नमूना" : "Reset Sample"}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenPreview}
            className="text-xs font-bold text-slate-700 cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 mr-1" />
            {templateLang === "hi" ? "पूर्वावलोकन" : "Preview"}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="text-xs font-bold text-slate-700 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 mr-1" />
            {templateLang === "hi" ? "डाउनलोड" : "Download"}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="text-xs font-bold text-slate-700 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 mr-1" />
            {templateLang === "hi" ? "प्रिंट (A4)" : "Print (A4)"}
          </Button>

          <Button
            size="sm"
            onClick={handleSaveToFir}
            disabled={isSavingToFir}
            className="text-xs font-bold bg-teal-700 hover:bg-teal-800 text-white cursor-pointer shadow-xs"
          >
            <Save className="w-3.5 h-3.5 mr-1" />
            {isSavingToFir
              ? templateLang === "hi"
                ? "सहेज रहे हैं..."
                : "Saving..."
              : templateLang === "hi"
              ? "FIR में सहेजें"
              : "Save to FIR"}
          </Button>
        </div>
      </div>

      {/* Success Notification */}
      {saveSuccessInfo && (
        <div className="no-print bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-3 rounded-xl flex items-center justify-between gap-3 text-xs shadow-xs animate-in fade-in-50">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>सफलतापूर्वक सहेजा गया:</strong> {saveSuccessInfo.docTitle} FIR #{saveSuccessInfo.firNumber} के
              Documents Panel में सुरक्षित कर दिया गया है।
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/fir/${saveSuccessInfo.firId}?tab=documents`}
              className="text-emerald-700 underline font-bold flex items-center gap-1 hover:text-emerald-900"
            >
              दस्तावेज देखें <ExternalLink className="w-3 h-3" />
            </Link>
            <button
              onClick={() => setSaveSuccessInfo(null)}
              className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Hidden File Inputs for Signatures & Stamp Upload */}
      <input
        type="file"
        ref={accusedSignInputRef}
        accept="image/*"
        className="hidden"
        onChange={(e) => handleImageUpload(e, "accusedSignImg")}
      />
      <input
        type="file"
        ref={ioSignInputRef}
        accept="image/*"
        className="hidden"
        onChange={(e) => handleImageUpload(e, "ioSignImg")}
      />
      <input
        type="file"
        ref={stampImgInputRef}
        accept="image/*"
        className="hidden"
        onChange={(e) => handleImageUpload(e, "stampImg")}
      />
      <input
        type="file"
        ref={articlePhotoInputRef}
        accept="image/*"
        className="hidden"
        onChange={handleArticlePhotoUpload}
      />

      {/* Main A4 Document Canvas */}
      <div className="flex justify-center">
        <div
          id="property-seizure-printable"
          className="w-full max-w-4xl bg-white border border-slate-300 p-6 sm:p-12 text-slate-950 font-serif shadow-sm space-y-8 leading-relaxed"
          style={{ minHeight: "1150px" }}
        >
          {/* ================= PAGE 1 ================= */}
          <div className="space-y-6">
            {/* Top Header & Page Corner Number */}
            <div className="relative border-b-2 border-slate-900 pb-3 text-center">
              <span className="absolute right-0 top-0 text-sm font-mono font-bold text-slate-600 border border-slate-400 rounded px-1.5 py-0.5">
                {formData.pageNumber || "89"}
              </span>
              <h1 className="text-xl sm:text-2xl font-black tracking-wide text-slate-950 underline uppercase">
                {templateLang === "hi"
                  ? "सम्पत्ति तलाशी एवं जब्ती फॉर्म"
                  : "PROPERTY SEARCH & SEIZURE FORM (IIF-IV)"}
              </h1>
              <p className="text-xs sm:text-sm font-semibold text-slate-700 pt-1">
                {templateLang === "hi"
                  ? "(तलाशी / पेशी / बरामदगी फार्म ज़ेर धारा 51 / 102 / 165 दं.प्र.सं. एवं धारा 50 / 106 / 185 BNSS, 2023)"
                  : "(Search / Production / Seizure Form u/s 51 / 102 / 165 Cr.P.C. & Section 50 / 106 / 185 BNSS, 2023)"}
              </p>
            </div>

            {/* 1. केस एवं थाना विवरण (Case & Police Station Details) */}
            <div className="space-y-2 text-xs sm:text-sm">
              <div className="flex items-baseline flex-wrap gap-x-4 gap-y-2">
                <span className="font-bold text-slate-900">1.</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold">{templateLang === "hi" ? "जिला:" : "District:"}</span>
                  <input
                    type="text"
                    value={formData.district}
                    onChange={(e) => handleFieldChange("district", e.target.value)}
                    className="border-b border-dotted border-slate-500 font-semibold px-1 py-0.5 outline-none w-28 bg-transparent"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold">{templateLang === "hi" ? "थाना:" : "Police Station:"}</span>
                  <input
                    type="text"
                    value={formData.policeStation}
                    onChange={(e) => handleFieldChange("policeStation", e.target.value)}
                    className="border-b border-dotted border-slate-500 font-semibold px-1 py-0.5 outline-none w-36 bg-transparent"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold">{templateLang === "hi" ? "वर्ष:" : "Year:"}</span>
                  <input
                    type="text"
                    value={formData.year}
                    onChange={(e) => handleFieldChange("year", e.target.value)}
                    className="border-b border-dotted border-slate-500 font-semibold px-1 py-0.5 outline-none w-16 text-center bg-transparent"
                  />
                </div>
              </div>

              <div className="flex items-baseline flex-wrap gap-x-4 gap-y-2 pl-4">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold">
                    {templateLang === "hi" ? "FIR / रोजनामचा रपट संख्या:" : "FIR / GD Entry No.:"}
                  </span>
                  <input
                    type="text"
                    value={formData.firNumber}
                    onChange={(e) => handleFieldChange("firNumber", e.target.value)}
                    className="border-b border-dotted border-slate-500 font-bold px-1 py-0.5 outline-none w-28 bg-transparent"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold">{templateLang === "hi" ? "दिनांक:" : "Dated:"}</span>
                  <input
                    type="text"
                    value={formData.firDate}
                    onChange={(e) => handleFieldChange("firDate", e.target.value)}
                    className="border-b border-dotted border-slate-500 font-semibold px-1 py-0.5 outline-none w-28 bg-transparent"
                  />
                </div>
              </div>
            </div>

            {/* 2. अधिनियम व धाराएं (Acts & Sections) */}
            <div className="flex items-baseline gap-2 text-xs sm:text-sm">
              <span className="font-bold text-slate-900">2.</span>
              <span className="font-bold shrink-0">{templateLang === "hi" ? "अधिनियम व धाराएं:" : "Acts & Sections:"}</span>
              <input
                type="text"
                value={formData.actsAndSections}
                onChange={(e) => handleFieldChange("actsAndSections", e.target.value)}
                className="w-full border-b border-dotted border-slate-500 font-bold px-1 py-0.5 outline-none bg-transparent"
                placeholder={templateLang === "hi" ? "धाराएं दर्ज करें" : "Enter sections of law"}
              />
            </div>

            {/* 3. जब्त सम्पत्ति का प्रकार (Type of Seized Property) */}
            <div className="space-y-2 text-xs sm:text-sm">
              <div className="flex items-baseline gap-2">
                <span className="font-bold text-slate-900">3.</span>
                <span className="font-bold">{templateLang === "hi" ? "जब्त सम्पत्ति का प्रकार:" : "Type of Seized Property:"}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pl-4 text-xs font-medium">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.propertyTypeArms}
                    onChange={(e) => handleFieldChange("propertyTypeArms", e.target.checked)}
                    className="w-4 h-4 rounded border-slate-400 text-teal-700"
                  />
                  <span>{templateLang === "hi" ? "आयुध / हथियार" : "Arms / Weapons"}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.propertyTypeFakeNotes}
                    onChange={(e) => handleFieldChange("propertyTypeFakeNotes", e.target.checked)}
                    className="w-4 h-4 rounded border-slate-400 text-teal-700"
                  />
                  <span>{templateLang === "hi" ? "जाली नोट" : "Counterfeit Currency"}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.propertyTypeExplosive}
                    onChange={(e) => handleFieldChange("propertyTypeExplosive", e.target.checked)}
                    className="w-4 h-4 rounded border-slate-400 text-teal-700"
                  />
                  <span>{templateLang === "hi" ? "विस्फोटक" : "Explosives"}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.propertyTypeNarcotics}
                    onChange={(e) => handleFieldChange("propertyTypeNarcotics", e.target.checked)}
                    className="w-4 h-4 rounded border-slate-400 text-teal-700"
                  />
                  <span>{templateLang === "hi" ? "नशीली वस्तु" : "Narcotics / Drugs"}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.propertyTypeGoldSilver}
                    onChange={(e) => handleFieldChange("propertyTypeGoldSilver", e.target.checked)}
                    className="w-4 h-4 rounded border-slate-400 text-teal-700"
                  />
                  <span>{templateLang === "hi" ? "सोना / चाँदी" : "Gold / Silver"}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.propertyTypeOther}
                    onChange={(e) => handleFieldChange("propertyTypeOther", e.target.checked)}
                    className="w-4 h-4 rounded border-slate-400 text-teal-700"
                  />
                  <span>{templateLang === "hi" ? "अन्य (संलिप्त/चुराई हुई)" : "Other (Stolen/Involved)"}</span>
                </label>
              </div>
              <div className="flex items-center gap-2 pl-4">
                <span className="font-bold text-xs">{templateLang === "hi" ? "अन्य विवरण:" : "Other Details:"}</span>
                <input
                  type="text"
                  value={formData.propertyTypeOtherText}
                  onChange={(e) => handleFieldChange("propertyTypeOtherText", e.target.value)}
                  className="w-full border-b border-dotted border-slate-400 text-xs px-1 py-0.5 outline-none bg-transparent"
                />
              </div>
            </div>

            {/* 4. सम्पत्ति जब्त / बरामदगी विवरण (Search & Seizure Details) */}
            <div className="space-y-1.5 text-xs sm:text-sm">
              <div className="flex items-baseline flex-wrap gap-x-4 gap-y-2">
                <span className="font-bold text-slate-900">4.</span>
                <span className="font-bold">
                  {templateLang === "hi" ? "सम्पत्ति जब्त / बरामदगी विवरण:" : "Seizure Particulars:"}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold">{templateLang === "hi" ? "दिनांक:" : "Date:"}</span>
                  <input
                    type="text"
                    value={formData.seizureDate}
                    onChange={(e) => handleFieldChange("seizureDate", e.target.value)}
                    className="border-b border-dotted border-slate-500 font-semibold px-1 py-0.5 outline-none w-24 bg-transparent"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold">{templateLang === "hi" ? "समय:" : "Time:"}</span>
                  <input
                    type="text"
                    value={formData.seizureTime}
                    onChange={(e) => handleFieldChange("seizureTime", e.target.value)}
                    className="border-b border-dotted border-slate-500 font-semibold px-1 py-0.5 outline-none w-20 bg-transparent"
                  />
                </div>
                <div className="flex items-center gap-1.5 grow">
                  <span className="font-bold">{templateLang === "hi" ? "स्थान:" : "Place:"}</span>
                  <input
                    type="text"
                    value={formData.seizurePlace}
                    onChange={(e) => handleFieldChange("seizurePlace", e.target.value)}
                    className="w-full border-b border-dotted border-slate-500 font-semibold px-1 py-0.5 outline-none bg-transparent"
                  />
                </div>
              </div>
            </div>

            {/* 5. व्यक्ति जिससे सम्पत्ति जब्त की गई उसका विवरण */}
            <div className="space-y-2 text-xs sm:text-sm">
              <div className="flex items-baseline flex-wrap gap-x-3 gap-y-1.5">
                <span className="font-bold text-slate-900">5.</span>
                <span className="font-bold">
                  {templateLang === "hi"
                    ? "व्यक्ति जिससे सम्पत्ति जब्त / बरामद की गई है:"
                    : "Person from whom property seized:"}
                </span>
                <div className="flex items-center gap-1">
                  <span className="font-bold">{templateLang === "hi" ? "नाम:" : "Name:"}</span>
                  <input
                    type="text"
                    value={formData.personName}
                    onChange={(e) => handleFieldChange("personName", e.target.value)}
                    className="border-b border-dotted border-slate-500 font-bold px-1 py-0.5 outline-none w-32 bg-transparent"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-bold">
                    {templateLang === "hi" ? "पिता/पति/संरक्षक:" : "Father/Husband:"}
                  </span>
                  <input
                    type="text"
                    value={formData.fatherName}
                    onChange={(e) => handleFieldChange("fatherName", e.target.value)}
                    className="border-b border-dotted border-slate-500 font-semibold px-1 py-0.5 outline-none w-32 bg-transparent"
                  />
                </div>
              </div>

              <div className="flex items-baseline flex-wrap gap-x-3 gap-y-1.5 pl-4">
                <div className="flex items-center gap-1">
                  <span className="font-bold">{templateLang === "hi" ? "लिंग:" : "Gender:"}</span>
                  <input
                    type="text"
                    value={formData.gender}
                    onChange={(e) => handleFieldChange("gender", e.target.value)}
                    className="border-b border-dotted border-slate-500 font-semibold px-1 py-0.5 outline-none w-16 text-center bg-transparent"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-bold">{templateLang === "hi" ? "आयु:" : "Age:"}</span>
                  <input
                    type="text"
                    value={formData.age}
                    onChange={(e) => handleFieldChange("age", e.target.value)}
                    className="border-b border-dotted border-slate-500 font-semibold px-1 py-0.5 outline-none w-14 text-center bg-transparent"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-bold">{templateLang === "hi" ? "पेशा:" : "Occupation:"}</span>
                  <input
                    type="text"
                    value={formData.occupation}
                    onChange={(e) => handleFieldChange("occupation", e.target.value)}
                    className="border-b border-dotted border-slate-500 font-semibold px-1 py-0.5 outline-none w-24 bg-transparent"
                  />
                </div>
                <div className="flex items-center gap-1 grow">
                  <span className="font-bold">{templateLang === "hi" ? "पता:" : "Address:"}</span>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => handleFieldChange("address", e.target.value)}
                    className="w-full border-b border-dotted border-slate-500 font-semibold px-1 py-0.5 outline-none bg-transparent"
                  />
                </div>
              </div>

              <div className="flex items-baseline flex-wrap gap-x-3 gap-y-1 pl-4 text-xs">
                <span className="font-bold">
                  {templateLang === "hi"
                    ? "क्या चुराई हुई सम्पत्ति का प्राप्तकर्ता पेशेवर है:--"
                    : "Is recipient a habitual / professional receiver:--"}
                </span>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="isProfReceiver"
                      value={templateLang === "hi" ? "हाँ" : "Yes"}
                      checked={formData.isProfessionalReceiver === "हाँ" || formData.isProfessionalReceiver === "Yes"}
                      onChange={() => handleFieldChange("isProfessionalReceiver", templateLang === "hi" ? "हाँ" : "Yes")}
                    />
                    <span>{templateLang === "hi" ? "हाँ" : "Yes"}</span>
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="isProfReceiver"
                      value={templateLang === "hi" ? "नहीं" : "No"}
                      checked={formData.isProfessionalReceiver === "नहीं" || formData.isProfessionalReceiver === "No"}
                      onChange={() => handleFieldChange("isProfessionalReceiver", templateLang === "hi" ? "नहीं" : "No")}
                    />
                    <span>{templateLang === "hi" ? "नहीं" : "No"}</span>
                  </label>
                </div>
              </div>
            </div>

            {/* 6. गवाहों का नाम और पता (तालिका) */}
            <div className="space-y-2 text-xs sm:text-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-baseline gap-2">
                  <span className="font-bold text-slate-900">6.</span>
                  <span className="font-bold">
                    {templateLang === "hi"
                      ? "गवाहों का नाम और पता (कम से कम दो गवाह आवश्यक हैं**):"
                      : "Names & Addresses of Witnesses (Minimum 2 witnesses required**):"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleAddWitness}
                  className="no-print text-xs text-teal-700 hover:text-teal-900 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {templateLang === "hi" ? "+ गवाह जोड़ें" : "+ Add Witness"}
                </button>
              </div>

              <table className="w-full border-collapse border border-slate-700 text-xs">
                <thead>
                  <tr className="bg-slate-100 font-bold text-slate-900">
                    <th className="border border-slate-700 p-2 w-12 text-center">
                      {templateLang === "hi" ? "क्र. सं." : "Sr."}
                    </th>
                    <th className="border border-slate-700 p-2 w-44 text-left">
                      {templateLang === "hi" ? "नाम" : "Name"}
                    </th>
                    <th className="border border-slate-700 p-2 text-left">
                      {templateLang === "hi" ? "पूरा पता व मोबाईल नम्बर आदि सहित" : "Complete Address & Phone"}
                    </th>
                    <th className="border border-slate-700 p-2 w-32 text-center">
                      {templateLang === "hi" ? "हस्ताक्षर" : "Signature"}
                    </th>
                    <th className="no-print border border-slate-700 p-1 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody>
                  {(formData.witnesses || []).map((w, idx) => (
                    <tr key={w.id}>
                      <td className="border border-slate-700 p-2 text-center font-bold">{idx + 1}</td>
                      <td className="border border-slate-700 p-1.5">
                        <input
                          type="text"
                          value={w.name}
                          onChange={(e) => handleUpdateWitness(w.id, "name", e.target.value)}
                          className="w-full bg-transparent outline-none font-bold"
                          placeholder={templateLang === "hi" ? "गवाह का नाम" : "Witness name"}
                        />
                      </td>
                      <td className="border border-slate-700 p-1.5">
                        <input
                          type="text"
                          value={w.addressAndPhone}
                          onChange={(e) => handleUpdateWitness(w.id, "addressAndPhone", e.target.value)}
                          className="w-full bg-transparent outline-none"
                          placeholder={templateLang === "hi" ? "पता व मोबाइल" : "Address & contact"}
                        />
                      </td>
                      <td className="border border-slate-700 p-1.5 text-center">
                        <input
                          type="text"
                          value={w.signatureText || w.name.split(" ")[0]}
                          onChange={(e) => handleUpdateWitness(w.id, "signatureText", e.target.value)}
                          className="w-full text-center font-serif italic font-bold bg-transparent outline-none text-slate-900"
                          placeholder="हस्ताक्षर"
                        />
                      </td>
                      <td className="no-print border border-slate-700 p-1 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteWitness(w.id)}
                          className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                          title="Delete Witness"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 7. जब्त सम्पत्ति की पहचान (Identification) */}
            <div className="space-y-1.5 text-xs sm:text-sm">
              <div className="flex items-baseline flex-wrap gap-x-3 gap-y-1">
                <span className="font-bold text-slate-900">7.</span>
                <span className="font-bold">
                  {templateLang === "hi"
                    ? "क्या सम्पत्ति की पहचान की आवश्यकता है? (हां / नहीं):"
                    : "Is identification of property required? (Yes / No):"}
                </span>
                <div className="flex items-center gap-4 font-semibold">
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="isIdentReq"
                      value={templateLang === "hi" ? "हाँ" : "Yes"}
                      checked={formData.isIdentificationRequired === "हाँ" || formData.isIdentificationRequired === "Yes"}
                      onChange={() => handleFieldChange("isIdentificationRequired", templateLang === "hi" ? "हाँ" : "Yes")}
                    />
                    <span>{templateLang === "hi" ? "हाँ" : "Yes"}</span>
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="isIdentReq"
                      value={templateLang === "hi" ? "नहीं" : "No"}
                      checked={formData.isIdentificationRequired === "नहीं" || formData.isIdentificationRequired === "No"}
                      onChange={() => handleFieldChange("isIdentificationRequired", templateLang === "hi" ? "नहीं" : "No")}
                    />
                    <span>{templateLang === "hi" ? "नहीं" : "No"}</span>
                  </label>
                </div>
              </div>
              <div className="flex items-center gap-2 pl-4">
                <span className="font-bold text-xs">{templateLang === "hi" ? "विवरण:--" : "Details:--"}</span>
                <input
                  type="text"
                  value={formData.identificationDetails}
                  onChange={(e) => handleFieldChange("identificationDetails", e.target.value)}
                  className="w-full border-b border-dotted border-slate-400 text-xs px-1 py-0.5 outline-none bg-transparent"
                />
              </div>
            </div>

            {/* 8. सम्पत्ति का अनुमानित मूल्य (Estimated Value) */}
            <div className="flex items-baseline gap-2 text-xs sm:text-sm">
              <span className="font-bold text-slate-900">8.</span>
              <span className="font-bold shrink-0">
                {templateLang === "hi"
                  ? "सम्पत्ति का अनुमानित मूल्य (गुम / बरामदगी) (जब्त / थथगद):"
                  : "Estimated value of seized property (in Rs.):"}
              </span>
              <input
                type="text"
                value={formData.estimatedValue}
                onChange={(e) => handleFieldChange("estimatedValue", e.target.value)}
                className="w-full border-b border-dotted border-slate-500 font-bold px-1 py-0.5 outline-none bg-transparent"
              />
            </div>

            {/* 9. जब्त / बरामद की गई चल / अचल सम्पत्ति का विवरण */}
            <div className="space-y-1.5 text-xs sm:text-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-baseline gap-2">
                  <span className="font-bold text-slate-900">9.</span>
                  <span className="font-bold">
                    {templateLang === "hi"
                      ? "जब्त / बरामद की गई चल / अचल सम्पत्ति का विवरण (यदि आवश्यक हो तो अलग शीट संलग्न करें):"
                      : "Details of seized movable/immovable property:"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleAddSummaryLine}
                  className="no-print text-xs text-teal-700 hover:text-teal-900 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {templateLang === "hi" ? "+ पंक्ति जोड़ें" : "+ Add Line"}
                </button>
              </div>

              <div className="space-y-1 pl-4">
                {(formData.propertySummaryLines || []).map((line, idx) => (
                  <div key={line.id} className="flex items-center gap-2">
                    <span className="font-bold w-6">{idx === 0 ? "i." : idx === 1 ? "ii." : `${idx + 1}.`}</span>
                    <input
                      type="text"
                      value={line.text}
                      onChange={(e) => handleUpdateSummaryLine(line.id, e.target.value)}
                      className="w-full border-b border-dotted border-slate-500 font-semibold px-1 py-0.5 outline-none bg-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => handleDeleteSummaryLine(line.id)}
                      className="no-print text-red-500 hover:text-red-700 p-1 cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* 10. सम्पत्ति जब्त / वसूली करने की परिस्थितियां / आधार */}
            <div className="space-y-1.5 text-xs sm:text-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-baseline gap-2">
                  <span className="font-bold text-slate-900">10.</span>
                  <span className="font-bold">
                    {templateLang === "hi"
                      ? "सम्पत्ति जब्त / वसूली करने की परिस्थितियां / आधार (विवरण सहित):"
                      : "Circumstances & Grounds of Seizure (with details):"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleAddGround}
                  className="no-print text-xs text-teal-700 hover:text-teal-900 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {templateLang === "hi" ? "+ आधार जोड़ें" : "+ Add Ground"}
                </button>
              </div>

              <div className="space-y-1 pl-4">
                {(formData.seizureGrounds || []).map((gr, idx) => (
                  <div key={gr.id} className="flex items-center gap-2">
                    <span className="font-bold w-6">{idx === 0 ? "i)" : idx === 1 ? "ii)" : `${idx + 1})`}</span>
                    <input
                      type="text"
                      value={gr.text}
                      onChange={(e) => handleUpdateGround(gr.id, e.target.value)}
                      className="w-full border-b border-dotted border-slate-500 font-semibold px-1 py-0.5 outline-none bg-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => handleDeleteGround(gr.id)}
                      className="no-print text-red-500 hover:text-red-700 p-1 cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* 11. पैकिंग, सील एवं प्रति देने का विवरण & Official Stamp */}
            <div className="space-y-3 pt-2 text-xs sm:text-sm">
              <div className="flex items-baseline gap-2">
                <span className="font-bold text-slate-900">11.</span>
                <textarea
                  rows={2}
                  value={formData.deliveryClauseText}
                  onChange={(e) => handleFieldChange("deliveryClauseText", e.target.value)}
                  className="w-full font-medium border-b border-dotted border-slate-500 outline-none resize-y bg-transparent"
                  style={{ textAlign: "justify" }}
                />
              </div>

              {/* Rubber Stamp and Receipt Line */}
              <div className="flex items-center justify-between gap-6 pl-4 pt-2">
                <div className="space-y-2 grow">
                  <div className="flex items-center gap-2">
                    <span className="font-bold">
                      {templateLang === "hi" ? "सील का नमूना / मोहर विवरण:" : "Specimen Seal Details:"}
                    </span>
                    <input
                      type="text"
                      value={formData.sealSampleDescription}
                      onChange={(e) => handleFieldChange("sealSampleDescription", e.target.value)}
                      className="border-b border-dotted border-slate-500 font-bold px-1 py-0.5 outline-none w-48 bg-transparent"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">
                      {templateLang === "hi" ? "पावती प्राप्तकर्ता का नाम:" : "Copy Received By:"}
                    </span>
                    <input
                      type="text"
                      value={formData.copyHandedToPerson}
                      onChange={(e) => handleFieldChange("copyHandedToPerson", e.target.value)}
                      className="border-b border-dotted border-slate-500 font-semibold px-1 py-0.5 outline-none w-64 bg-transparent"
                    />
                  </div>
                </div>

                {/* Circular Stamp from Image */}
                <div className="relative flex flex-col items-center justify-center shrink-0">
                  {formData.stampImg ? (
                    <div className="relative group w-28 h-28">
                      <img
                        src={formData.stampImg}
                        alt="Stamp"
                        className="w-full h-full object-contain rounded-full border border-indigo-900/40"
                      />
                      <button
                        type="button"
                        onClick={() => handleFieldChange("stampImg", "")}
                        className="no-print absolute top-0 right-0 bg-red-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove stamp"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div
                      className="w-28 h-28 rounded-full border-2 p-1 flex items-center justify-center relative shadow-xs"
                      style={{
                        transform: "rotate(-3deg)",
                        borderColor: "#1e295d",
                        color: "#1e295d",
                      }}
                    >
                      <div className="w-full h-full rounded-full border border-dashed border-indigo-900/60 flex flex-col items-center justify-center text-center p-1 relative overflow-hidden">
                        <div className="text-[7px] font-black tracking-widest uppercase">POLICE STATION</div>
                        <div className="my-0.5 text-center">
                          <input
                            type="text"
                            value={formData.stampThanaName}
                            onChange={(e) => handleFieldChange("stampThanaName", e.target.value.toUpperCase())}
                            className="text-[9px] font-black uppercase text-center w-20 bg-transparent border-none outline-none tracking-wider text-indigo-950"
                          />
                        </div>
                        <div className="text-[7px] font-bold tracking-wider uppercase">
                          ★ {formData.stampDistrictName} ★
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => stampImgInputRef.current?.click()}
                    className="no-print text-[10px] text-teal-700 hover:text-teal-900 font-bold underline mt-1 cursor-pointer flex items-center gap-1"
                  >
                    <Upload className="w-2.5 h-2.5" />
                    {templateLang === "hi" ? "मुहर फोटो बदलें" : "Upload Stamp"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ================= PAGE BREAK / PAGE 2 ================= */}
          <div className="border-t-4 border-double border-slate-700 pt-8 space-y-6">
            {/* Heading 12: विस्तृत चल/अचल सम्पत्ति सीलबंद सूची */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-baseline gap-2">
                  <span className="font-bold text-slate-900 text-sm">12.</span>
                  <h2 className="font-bold text-sm sm:text-base text-slate-950 underline">
                    {templateLang === "hi"
                      ? "निम्नलिखित चल / अचल सम्पत्ति पैक / सील की गई और उन पर / सम्पत्ति पर गवाहान के हस्ताक्षर लिए गए।"
                      : "Detailed list of seized movable/immovable property packed & sealed under witness signatures:"}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={handleAddArticle}
                  className="no-print text-xs text-teal-700 hover:text-teal-900 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {templateLang === "hi" ? "+ वस्तु जोड़ें" : "+ Add Article"}
                </button>
              </div>

              {/* Table from Image 2 */}
              <table className="w-full border-collapse border border-slate-700 text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-100 font-bold text-slate-900">
                    <th className="border border-slate-700 p-2 w-14 text-center">
                      {templateLang === "hi" ? "क्रम सं." : "Sr. No."}
                    </th>
                    <th className="border border-slate-700 p-2 text-left">
                      {templateLang === "hi"
                        ? "सम्पत्ति का विवरण (चल / अचल / मूल्यांकन / सील / नष्ट / मॉडल / मार्का / रंग / कम्पनी का नाम / नम्बर आदि)"
                        : "Description of Property (Movable / Immovable / Valuation / Model / Color / Make / Details)"}
                    </th>
                    <th className="border border-slate-700 p-2 w-48 text-left">
                      {templateLang === "hi"
                        ? "पैकेट पर लगाई गई सील / मोहर का विवरण"
                        : "Seal Particulars Applied on Packet"}
                    </th>
                    <th className="no-print border border-slate-700 p-2 w-28 text-center">
                      {templateLang === "hi" ? "फोटो / रसीद" : "Photo / Attachment"}
                    </th>
                    <th className="no-print border border-slate-700 p-1 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody>
                  {(formData.seizedArticles || []).map((art, idx) => (
                    <tr key={art.id}>
                      <td className="border border-slate-700 p-2 text-center font-bold">{idx + 1}.</td>
                      <td className="border border-slate-700 p-2">
                        <textarea
                          rows={2}
                          value={art.description}
                          onChange={(e) => handleUpdateArticle(art.id, "description", e.target.value)}
                          className="w-full bg-transparent outline-none font-medium resize-y"
                          placeholder={templateLang === "hi" ? "सम्पत्ति का विवरण दर्ज करें..." : "Enter property description..."}
                        />
                      </td>
                      <td className="border border-slate-700 p-2">
                        <input
                          type="text"
                          value={art.sealDetails}
                          onChange={(e) => handleUpdateArticle(art.id, "sealDetails", e.target.value)}
                          className="w-full bg-transparent outline-none font-bold text-slate-800"
                          placeholder={templateLang === "hi" ? "मोहर मार्का" : "Seal mark"}
                        />
                      </td>
                      <td className="no-print border border-slate-700 p-2 text-center">
                        {art.photoUrl ? (
                          <div className="relative group w-14 h-14 mx-auto">
                            <img
                              src={art.photoUrl}
                              alt="Item"
                              className="w-full h-full object-cover rounded border border-slate-300"
                            />
                            <button
                              type="button"
                              onClick={() => handleUpdateArticle(art.id, "photoUrl", "")}
                              className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100"
                              title="Delete photo"
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setArticleRowPhotoUploadId(art.id);
                              articlePhotoInputRef.current?.click();
                            }}
                            className="text-[11px] text-teal-700 hover:text-teal-900 font-bold underline flex items-center justify-center gap-1 mx-auto cursor-pointer"
                          >
                            <ImageIcon className="w-3 h-3" />
                            {templateLang === "hi" ? "फोटो जोड़ें" : "Upload"}
                          </button>
                        )}
                      </td>
                      <td className="no-print border border-slate-700 p-1 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteArticle(art.id)}
                          className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                          title="Delete Row"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Divider Line */}
            <div className="border-t-2 border-dotted border-slate-400 pt-4" />

            {/* Signatures Layout: Left Accused, Right Investigating Officer (IO) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-start pt-2">
              {/* Left Column: जिस व्यक्ति से सम्पत्ति जब्त की गई, उसके हस्ताक्षर */}
              <div className="space-y-3">
                <span className="font-bold underline text-xs sm:text-sm text-slate-900 block">
                  {templateLang === "hi"
                    ? "जिस व्यक्ति से सम्पत्ति जब्त की गई, उसके हस्ताक्षर"
                    : "Signature of person from whom property was seized:"}
                  <span className="text-[11px] font-normal block text-slate-600">
                    {templateLang === "hi" ? "(यदि उपस्थित हो)" : "(If present on spot)"}
                  </span>
                </span>

                {/* Accused Signature Box */}
                <div className="pt-2">
                  {formData.accusedSignImg ? (
                    <div className="relative group w-44 h-16">
                      <img
                        src={formData.accusedSignImg}
                        alt="Accused Signature"
                        className="w-full h-full object-contain border-b border-slate-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleFieldChange("accusedSignImg", "")}
                        className="no-print absolute top-0 right-0 bg-red-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100"
                        title="Remove sign"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={formData.accusedSignText}
                      onChange={(e) => handleFieldChange("accusedSignText", e.target.value)}
                      className="font-serif italic text-lg sm:text-xl font-black border-b border-dotted border-slate-600 outline-none w-48 bg-transparent text-slate-900"
                      placeholder={templateLang === "hi" ? "हस्ताक्षर अभियुक्त" : "Accused Signature"}
                    />
                  )}

                  <button
                    type="button"
                    onClick={() => accusedSignInputRef.current?.click()}
                    className="no-print text-[10px] text-teal-700 hover:text-teal-900 font-bold underline mt-1 block cursor-pointer"
                  >
                    {templateLang === "hi" ? "हस्ताक्षर फोटो अपलोड करें" : "Upload Signature Image"}
                  </button>
                </div>

                <div className="flex items-center gap-2 text-xs pt-1">
                  <span className="font-bold">{templateLang === "hi" ? "स्थान:" : "Place:"}</span>
                  <input
                    type="text"
                    value={formData.accusedSignPlace}
                    onChange={(e) => handleFieldChange("accusedSignPlace", e.target.value)}
                    className="border-b border-dotted border-slate-500 font-semibold px-1 py-0.5 outline-none w-36 bg-transparent"
                  />
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="font-bold">{templateLang === "hi" ? "दिनांक:" : "Date:"}</span>
                  <input
                    type="text"
                    value={formData.accusedSignDate}
                    onChange={(e) => handleFieldChange("accusedSignDate", e.target.value)}
                    className="border-b border-dotted border-slate-500 font-semibold px-1 py-0.5 outline-none w-36 bg-transparent"
                  />
                </div>
              </div>

              {/* Right Column: जांच अधिकारी का विवरण (Section 13) */}
              <div className="space-y-3 sm:text-right">
                <span className="font-bold text-xs sm:text-sm text-slate-900 block">
                  {templateLang === "hi" ? "(जांच अधिकारी के हस्ताक्षर)" : "(Signature of Investigating Officer):"}
                </span>

                {/* IO Signature Box */}
                <div className="pt-2 sm:flex sm:flex-col sm:items-end">
                  {formData.ioSignImg ? (
                    <div className="relative group w-44 h-16">
                      <img
                        src={formData.ioSignImg}
                        alt="IO Signature"
                        className="w-full h-full object-contain border-b border-slate-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleFieldChange("ioSignImg", "")}
                        className="no-print absolute top-0 right-0 bg-red-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100"
                        title="Remove sign"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={formData.ioSignText}
                      onChange={(e) => handleFieldChange("ioSignText", e.target.value)}
                      className="font-serif italic text-lg sm:text-xl font-black border-b border-dotted border-slate-600 outline-none w-48 bg-transparent text-slate-900 sm:text-right"
                      placeholder={templateLang === "hi" ? "हस्ताक्षर IO" : "IO Signature"}
                    />
                  )}

                  <button
                    type="button"
                    onClick={() => ioSignInputRef.current?.click()}
                    className="no-print text-[10px] text-teal-700 hover:text-teal-900 font-bold underline mt-1 block cursor-pointer"
                  >
                    {templateLang === "hi" ? "IO हस्ताक्षर फोटो अपलोड करें" : "Upload IO Sign Image"}
                  </button>
                </div>

                <div className="flex items-center sm:justify-end gap-2 text-xs pt-1">
                  <span className="font-bold">{templateLang === "hi" ? "नाम:" : "Name:"}</span>
                  <input
                    type="text"
                    value={formData.ioName}
                    onChange={(e) => handleFieldChange("ioName", e.target.value)}
                    className="border-b border-dotted border-slate-500 font-bold px-1 py-0.5 outline-none w-44 bg-transparent sm:text-right"
                  />
                </div>

                <div className="flex items-center sm:justify-end gap-2 text-xs">
                  <span className="font-bold">{templateLang === "hi" ? "पद:" : "Rank:"}</span>
                  <input
                    type="text"
                    value={formData.ioRank}
                    onChange={(e) => handleFieldChange("ioRank", e.target.value)}
                    className="border-b border-dotted border-slate-500 font-semibold px-1 py-0.5 outline-none w-20 bg-transparent sm:text-right"
                  />
                  <span className="font-bold">{templateLang === "hi" ? "न.:" : "No.:"}</span>
                  <input
                    type="text"
                    value={formData.ioBeltNo}
                    onChange={(e) => handleFieldChange("ioBeltNo", e.target.value)}
                    className="border-b border-dotted border-slate-500 font-semibold px-1 py-0.5 outline-none w-24 bg-transparent sm:text-right"
                  />
                </div>

                <div className="flex items-center sm:justify-end gap-2 text-xs">
                  <span className="font-bold">{templateLang === "hi" ? "थाना:" : "Police Station:"}</span>
                  <input
                    type="text"
                    value={formData.ioPoliceStation}
                    onChange={(e) => handleFieldChange("ioPoliceStation", e.target.value)}
                    className="border-b border-dotted border-slate-500 font-semibold px-1 py-0.5 outline-none w-48 bg-transparent sm:text-right"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {isPreviewModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-3.5 border-b border-slate-200 bg-slate-50">
              <span className="font-bold text-sm text-slate-800">
                {templateLang === "hi"
                  ? "दस्तावेज पूर्वावलोकन (Property Seizure IIF-IV)"
                  : "Document Preview (Property Seizure IIF-IV)"}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={handlePrint}
                  className="text-xs font-bold bg-teal-700 hover:bg-teal-800 text-white cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 mr-1" />
                  {templateLang === "hi" ? "प्रिंट करें" : "Print"}
                </Button>
                <button
                  onClick={() => setIsPreviewModalOpen(false)}
                  className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-4 overflow-y-auto grow bg-slate-100 flex justify-center">
              <iframe
                srcDoc={previewHtml}
                title="Preview"
                className="w-full bg-white shadow-md border border-slate-300 min-h-[750px] rounded"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PropertySeizurePage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs font-bold text-slate-500">
          प्रॉपर्टी जब्ती प्रपत्र लोड हो रहा है...
        </div>
      }
    >
      <PropertySeizurePageContent />
    </Suspense>
  );
}
