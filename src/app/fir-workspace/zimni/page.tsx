"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Printer,
  Copy,
  Check,
  Download,
  ScrollText,
  Plus,
  Trash2,
  RotateCcw,
  Save,
  ArrowUpDown,
  Eye,
  EyeOff,
  Layers,
  Sparkles,
  FileText,
  CheckCircle2,
  Calendar,
  Clock,
  User,
  Shield,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { firService } from "@/services/firService";
import { FIRItem } from "@/types";
import { FIRWorkspaceNav } from "@/components/fir-workspace/FIRWorkspaceNav";
import { VoiceInputButton } from "@/components/ui/voice-input-button";
import { AutoSuggestField } from "@/components/ui/auto-suggest-field";
import { formatDate } from "@/lib/utils";
import { printA4Element, downloadA4DocumentAsHtml } from "@/utils/printElement";

interface HeaderLine {
  id: string;
  text: string;
}

interface ZimniEntryRow {
  id: string;
  dateTime: string;
  srNo: string;
  narration: string;
  hasBottomBorder?: boolean;
}

interface AdditionalSignature {
  id: string;
  title: string;
  officerNameRank: string;
  post: string;
  date: string;
}

interface VerticalBordersConfig {
  outerLeft: boolean;
  col1ToCol2: boolean;
  col2ToCol3: boolean;
  outerRight: boolean;
}

interface HorizontalBordersConfig {
  outerTop: boolean;
  headerBottom: boolean;
  caseHeadingBottom: boolean;
  closingTop: boolean;
  outerBottom: boolean;
}

interface ZimniProformaData {
  formNumberText: string;
  reportTitleText: string;
  showHeader: boolean;
  borderStyle: "box" | "thin" | "none";
  borderWidth: "1px" | "2px" | "3px";
  verticalBorders: VerticalBordersConfig;
  horizontalBorders: HorizontalBordersConfig;
  leftHeaderLines: HeaderLine[];
  rightHeaderLines: HeaderLine[];
  col1Title: string;
  col2Title: string;
  col3Title: string;
  showCaseHeading: boolean;
  stateLine: string;
  accusedLine: string;
  ioLine: string;
  salutation: string;
  entries: ZimniEntryRow[];
  closingText: string;
  officerNameRank: string;
  officerPost: string;
  signDate: string;
  hasSignatureGraphic: boolean;
  additionalSignatures: AdditionalSignature[];
}

const DEFAULT_IMAGE_ZIMNI_DATA: ZimniProformaData = {
  formNumberText: "पुलिस फार्म संख्या 25.54 (1) भाग (1)",
  reportTitleText: "रिपोर्ट जिमनी",
  showHeader: true,
  borderStyle: "box",
  borderWidth: "2px",
  verticalBorders: {
    outerLeft: true,
    col1ToCol2: true,
    col2ToCol3: true,
    outerRight: true,
  },
  horizontalBorders: {
    outerTop: true,
    headerBottom: true,
    caseHeadingBottom: false,
    closingTop: true,
    outerBottom: true,
  },
  leftHeaderLines: [
    { id: "lh_1", text: "थाना सैक्टर 20 पंचकूला" },
    { id: "lh_2", text: "मु०नं० 137 दिनांक 24.08.2024" },
    { id: "lh_3", text: "घटना स्थल:- गांव अभयपुर सैक्टर 19 पंचकूला" },
    { id: "lh_4", text: "घटना तिथि:- 01.05.2024 से 01.06.2024 तक" },
    { id: "lh_5", text: "अपराध:- 06 पोक्सो एक्ट & 376(3), 506 IPC" },
  ],
  rightHeaderLines: [
    { id: "rh_1", text: "पुलिस आयुक्तालय पंचकूला" },
    { id: "rh_2", text: "जिमनी न० 17" },
    { id: "rh_3", text: "प्राप्ति तिथी...." },
    { id: "rh_4", text: "रवानगी तिथी...." },
  ],
  col1Title: "तिथि व समय",
  col2Title: "क्रं. स.",
  col3Title: "अनुसंधान का विवरण",
  showCaseHeading: true,
  stateLine:
    "राज्य द्वारा:- ललिता देवी पत्नी श्री फूतुपाला निवासी वार्ड न. 2 दरभंगा थाना कलियानपुर जिला समस्तीपुर बिहार। हाल निवासी मकान न. 357 गांव अभयपुर सैक्टर 19 पंचकूला थाना सैक्टर 20 पंचकूला।",
  accusedLine:
    "बनाम:- ------------------------*--------------------------*--------------------------",
  ioLine:
    "अनुसन्धानकर्ता:- स.उप.नि. जसबीर सिंह न. 128/पंचकूला पुलिस चौकी सैक्टर 19 पंचकूला।",
  salutation: "श्रीमान जी,",
  entries: [
    {
      id: "entry_1",
      dateTime: "दिनांक\n11.11.2024\nसमय\n07.00.ए.एम.",
      srNo: "1.",
      narration:
        "बा सिलसिला रिपोर्ट जिमनी पूर्व लिखित खुद के पश्चात निवेदन है कि समय गैर होने के कारण जिमनी हजा को बंद किया गया था जो अभियोग में नामजद आरोपी रोशन पुत्र सरजू वासी गांव मिशरौली माफी जिला अमेठी यू.पी. की गिरफ्तारी बकाया है जिसकी तलाश आरोपी रोशन के मोबाईल नम्बर की लोकेशन मुताबिक फेस 2 तलोजा, नवी मुंबई जिला महाराष्ट्र में की गई थी लेकिन सुराग नहीं चला था जो साईबर सेल से आरोपी रोशन के मोबाईल नम्बर 8528471236 की लोकेशन एन.आर.आप सागरी जिला नवी मुंबई के आस पास की होनी पाई गई है जो आरोपी की तलाश की जानी है जो बराए तलाश मन स.उप.नि. मय साथी कर्मचारी सि. अंकित न. 173/पंचकूला, HGH प्रदीप कुमार न. 6618/पंचकूला के बा सवारी गाड़ी प्राईवेट के रवाना थाना एन.आर.आय सागरी जिला नवी मुंबई का होता हूं।",
      hasBottomBorder: false,
    },
    {
      id: "entry_2",
      dateTime: "",
      srNo: "2.",
      narration:
        "इस समय मन स.उप.नि. मय साथी कर्मचारियों के बा सवारी गाड़ी प्राईवेट के थाना एन.आर.आय सागरी जिला नवी मुंबई महाराष्ट्र पहुंचा हूं जहां पर MHC थाना हाजिर मिले जिनको हालात अभियोग बतलाकर अभियोग की तफ्तीश में आने जाने बारे आमद रवानगी करवाई गई जो आरोपी रोशन की तलाश की गई लेकिन कोई सुराग नहीं चल सका है जो आरोपी रोशन के भाई दीपक के मोबाईल नम्बर 6394482571 के मुताबिक दीपक पुत्र सरजू प्रसाद वासी गांव मिसरोली थाना संग्रामपुर जिला अमेठी उत्तर प्रदेश हाल गांव खूनी थाना मानपाडा जिला ठाणे मुंबई पाया गया है जो मन स.उप.नि. मय साथी कर्मचारियों के प्राईवेट गाड़ी के रवाना गांव खूनी थाना मानपाडा जिला ठाणे मुंबई का होता हूं।",
      hasBottomBorder: false,
    },
    {
      id: "entry_3",
      dateTime: "",
      srNo: "3.",
      narration:
        "इस समय मन स.उप.नि. मय साथी कर्मचारियों के प्राईवेट गाड़ी के गांव खूनी थाना मानपाडा जिला ठाणे मुंबई पहुंचा हूं जहां पर दीपक पुत्र सरजू प्रसाद गांव खूनी थाना मानपाडा जिला ठाणे मुंबई हाजिर मिला है जिसका हालात अभियोग बतलाकर शामिल तफ्तीश पूछताछ में व्यस्त होता हूं।",
      hasBottomBorder: false,
    },
    {
      id: "entry_4",
      dateTime: "पुछताछ",
      srNo: "4.",
      narration:
        "इस समय मेरी पुछताछ पर दीपक पुत्र सरजू प्रसाद वासी गांव मिसरोली थाना संग्रामपुर जिला अमेठी उत्तर प्रदेश हाल गांव खूनी थाना मानपाडा जिला ठाणे मुंबई ने बतलाया कि मैं उपरोक्त पते का रहने वाला हूं और मैं पेन्ट का काम करता हूं जो रोशन मेरा छोटा भाई है जो मेरे घर से पता चला था कि काम के सिलसिले में मेरा भाई रोशन करीब 5-6 दिनों से मुम्बई आया हुआ है लेकिन वह मेरे घर पर नहीं आया, लेकिन मेरे को उसके बारे कुछ नहीं पता कि वह कहां पर रह रहा है और ना ही मैं उसके बारे में कुछ जानता हूं।",
      hasBottomBorder: false,
    },
    {
      id: "entry_5",
      dateTime: "",
      srNo: "5.",
      narration:
        "इस समय तक शामलात तफ्तीश से पुछताछ होती रही है जो शामलात तफ्तीश दीपक पुत्र सरजू प्रसाद वासी गांव मिसरोली थाना संग्रामपुर जिला अमेठी उत्तर प्रदेश हाल गांव खूनी थाना मानपाडा जिला ठाणे मुंबई को उसके भाई रोशन को पेश करने के लिए एक नोटिस 35 BNS लिखकर दिया गया व नोटिस की एक कापी पर रिसीव ली गई जिसने अपने भाई रोशन को पुलिस चौकी सैक्टर 19 पंचकूला में पेश करने का वादा किया है व इसी समय वहां पर राजबीर पुत्र श्री मिश्री राज वासी कोटा राजस्थान नाम का ठेकेदार हाजिर मिला जिसको हालात अभियोग बतलाकर पुछताछ में व्यस्त होता हूं।",
      hasBottomBorder: false,
    },
    {
      id: "entry_6",
      dateTime: "पुछताछ",
      srNo: "6.",
      narration:
        "इस समय मेरी पुछताछ पर राजबीर पुत्र श्री मिश्री राज वासी कोटा राजस्थान ने बतलाया कि मैं उपरोक्त नाम पते का रहने वाला हूं और पेन्ट का ठेकेदार हूं जो मेरे पास काफी व्यक्ति पेन्ट का काम करते हैं और मेरा एक साथी राहुल नाम का ठेकेदार मेरा दोस्त है जो पनवेल नई मुम्बई ठेकेदारी का काम करते हैं जिसके पास काफी लड़के काम करते हैं वहां पर काफी लड़के यू.पी. के आए हुए हैं शायद उनके रोशन नाम का लड़का वहीं पर काम करता होगा।",
      hasBottomBorder: false,
    },
    {
      id: "entry_7",
      dateTime: "",
      srNo: "7.",
      narration:
        "इस समय तक शामलात तफ्तीश से पुछताछ होती रही है जो शामलात तफ्तीश को बाद हिदायत फारिग करके मन स.उप.नि. मय साथी कर्मचारियों के बा सवारी गाड़ी प्राईवेट के रवाना पनवेल करंजाडे नई मुम्बई का रवाना होता हूं।",
      hasBottomBorder: false,
    },
    {
      id: "entry_8",
      dateTime: "",
      srNo: "8.",
      narration:
        "इस समय मन स.उप.नि. मय साथी कर्मचारियों के बा सवारी गाड़ी प्राईवेट के पनवेल करंजाडे नई मुम्बई पहुंचा हूं जहां पर राहुल शेखावत पुत्र श्री हुकम सिंह शेखावत... अजब कुमार पुत्र जवाहर लाल गांव रूपेपुर थाना अन्तु जिला प्रतापगढ़ यू.पी. हाजिर मिला जिनको हालात अभियोग बतलाकर पुछताछ में व्यस्त होता हूं।",
      hasBottomBorder: false,
    },
    {
      id: "entry_9",
      dateTime: "पुछताछ",
      srNo: "9.",
      narration:
        "इस समय मेरी पुछताछ पर राहुल शेखावत पुत्र श्री हुकम सिंह शेखावत ने बतलाया कि मैं उपरोक्त पते का रहने वाला हूं और मेरे पास काफी व्यक्ति पेन्ट का काम करते हैं जो आप रोशन बारे पूछ रहे हो वह लड़का रोशन मेरे से करीब 2 दिनों पहले यहां से चला गया था क्योंकि उसका वजन 38 किलो था इस मारे कंपनी ने उस व्यक्ति को काम पर नहीं रखा। उसके बाद मेरे को ना तो रोशन मिला और ना ही उसका पता कि वह कहां पर रहता है।",
      hasBottomBorder: false,
    },
    {
      id: "entry_10",
      dateTime: "पुछताछ",
      srNo: "10.",
      narration:
        "इस समय मेरी पुछताछ पर अजब कुमार पुत्र जवाहर लाल गांव रूपेपुर थाना अन्तु जिला प्रतापगढ़ यू.पी. ने बतलाया कि मैं उपरोक्त पते का रहने वाला हूं और मेरे पास काफी व्यक्ति पेन्ट का काम करते हैं जो आप रोशन बारे पूछ रहे हो वह मेरी बुआ जी का लड़का है जो मुझे गांव से ही पता चला था कि रोशन भी काम के सिलसिले में मुंबई आया हुआ है लेकिन मैं उसका पता नहीं जानता कि वह कहां पर रह रहा है यदि मुझे उसके पते बारे कुछ पता चला तो मैं आपको बतला दूंगा।",
      hasBottomBorder: false,
    },
    {
      id: "entry_11",
      dateTime: "",
      srNo: "11.",
      narration:
        "इस समय तक शामलात तफ्तीश से पुछताछ होती रही है जो शामलात तफ्तीश को बाद हिदायत फारिग किया गया जो समय गैर हो चुका है जो आईन्दा अभियोग में रोशन के शामिल तफ्तीश होने पर आगामी कार्यवाही अमल में लाई जाएगी। हालात अभियोग बारे इन्चार्ज चौकी थाना प्रबन्धक थाना को बजरिया फोन बतलाए गए। मन स.उप.नि. साथी कर्मचारियों के रवाना पंचकूला का होता हूं।",
      hasBottomBorder: false,
    },
  ],
  closingText: "रिपोर्ट जिमनी लिखी सेवा में प्रस्तुत है।",
  officerNameRank: "स.उप.नि. जसबीर सिंह न. 128/पंचकूला",
  officerPost: "पुलिस चौकी सैक्टर 19 पंचकूला",
  signDate: "दिनांक - 11.11.2024",
  hasSignatureGraphic: true,
  additionalSignatures: [],
};

function ZimniWorkspaceContent() {
  const { currentUser } = useAuth();
  const searchParams = useSearchParams();
  const urlFirId = searchParams.get("firId");

  const [firs, setFirs] = useState<FIRItem[]>([]);
  const [selectedFirId, setSelectedFirId] = useState<string>("");
  const [data, setData] = useState<ZimniProformaData>(DEFAULT_IMAGE_ZIMNI_DATA);
  const [copied, setCopied] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState<"compact" | "normal" | "large">("normal");

  // Load all FIRs
  useEffect(() => {
    try {
      const allFirs = firService.getAllFirs();
      setFirs(allFirs);
      if (allFirs.length > 0) {
        if (urlFirId && allFirs.some((f) => f.id === urlFirId)) {
          setSelectedFirId(urlFirId);
        } else {
          setSelectedFirId(allFirs[0].id);
        }
      }
    } catch (e) {
      console.error("Failed to load FIRs:", e);
    }
  }, [urlFirId]);

  const activeFir = firs.find((f) => f.id === selectedFirId) || null;

  // Function to autofill / update proforma based on active FIR
  const handleAutoFillFromFir = () => {
    if (!activeFir) return;

    const psName = activeFir.policeStation
      ? activeFir.policeStation.startsWith("थाना")
        ? activeFir.policeStation
        : `थाना ${activeFir.policeStation}`
      : "थाना सैक्टर 20 पंचकूला";

    const firNoStr = `मु०नं० ${activeFir.firNumber || "137"} दिनांक ${
      activeFir.firDate ? formatDate(activeFir.firDate) : formatDate(new Date())
    }`;

    const incidentPlaceStr = `घटना स्थल:- ${
      activeFir.incidentPlace || activeFir.incidentLandmark || "संबंधित क्षेत्र"
    }`;

    const incidentDateStr = `घटना तिथि:- ${
      activeFir.incidentDateFrom
        ? `${formatDate(activeFir.incidentDateFrom)}${
            activeFir.incidentDateTo ? ` से ${formatDate(activeFir.incidentDateTo)} तक` : ""
          }`
        : activeFir.firDate
        ? formatDate(activeFir.firDate)
        : "दिनांक अनुसार"
    }`;

    const offenceStr = `अपराध:- ${activeFir.actsAndSections || "धारा 175 BNSS"}`;

    const distCommStr = activeFir.district
      ? activeFir.district.includes("कमिश्नर") || activeFir.district.includes("आयुक्तालय")
        ? activeFir.district
        : `पुलिस जिला / आयुक्तालय ${activeFir.district}`
      : "पुलिस आयुक्तालय पंचकूला";

    // Complainant state line
    const complainantDetails = `राज्य द्वारा:- ${activeFir.complainantName || "ललिता देवी"}${
      activeFir.complainantFatherSpouse
        ? ` पत्नी/पुत्र ${activeFir.complainantFatherSpouse}`
        : ""
    }${
      activeFir.complainantAddress
        ? ` निवासी ${activeFir.complainantAddress}`
        : ""
    } ${psName}।`;

    // Accused line
    const accusedNames =
      activeFir.accusedList && activeFir.accusedList.length > 0
        ? activeFir.accusedList
            .map(
              (a) =>
                `${a.name}${a.fatherName ? ` पुत्र ${a.fatherName}` : ""}${
                  a.address ? ` वासी ${a.address}` : ""
                }`
            )
            .join("; ")
        : "------------------------*--------------------------*--------------------------";

    const accusedLineStr = `बनाम:- ${accusedNames}`;

    // IO Line
    const ioName = activeFir.assignedIoName || currentUser?.name || "स.उप.नि. जसबीर सिंह";
    const ioRank = activeFir.assignedIoRank || currentUser?.rankDisplay || "स.उप.नि.";
    const ioBelt = activeFir.assignedIoBeltNumber || currentUser?.pno || "नं. 128";
    const ioLineStr = `अनुसन्धानकर्ता:- ${ioRank} ${ioName} ${ioBelt} ${psName}।`;

    setData((prev) => ({
      ...prev,
      leftHeaderLines: [
        { id: `lh_${Date.now()}_1`, text: psName },
        { id: `lh_${Date.now()}_2`, text: firNoStr },
        { id: `lh_${Date.now()}_3`, text: incidentPlaceStr },
        { id: `lh_${Date.now()}_4`, text: incidentDateStr },
        { id: `lh_${Date.now()}_5`, text: offenceStr },
      ],
      rightHeaderLines: [
        { id: `rh_${Date.now()}_1`, text: distCommStr },
        { id: `rh_${Date.now()}_2`, text: `जिमनी न० ${activeFir.caseDiaries?.length ? activeFir.caseDiaries.length + 1 : "1"}` },
        { id: `rh_${Date.now()}_3`, text: "प्राप्ति तिथी...." },
        { id: `rh_${Date.now()}_4`, text: "रवानगी तिथी...." },
      ],
      stateLine: complainantDetails,
      accusedLine: accusedLineStr,
      ioLine: ioLineStr,
      officerNameRank: `${ioRank} ${ioName} ${ioBelt}`,
      officerPost: psName,
      signDate: `दिनांक - ${formatDate(new Date())}`,
    }));

    setSaveStatus("Selected FIR Details Populated!");
    setTimeout(() => setSaveStatus(null), 3000);
  };

  // Restore Default Image Sample
  const handleResetToImageSample = () => {
    setData(DEFAULT_IMAGE_ZIMNI_DATA);
    setSaveStatus("Reset to Official Sample from Image!");
    setTimeout(() => setSaveStatus(null), 3000);
  };

  // Save to LocalStorage
  const handleSaveDraft = () => {
    try {
      const key = `zimni_draft_${selectedFirId || "general"}`;
      localStorage.setItem(key, JSON.stringify(data));
      setSaveStatus("Draft Saved Successfully!");
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (e) {
      console.error(e);
      setSaveStatus("Error saving draft.");
    }
  };

  // Print
  const handlePrint = () => {
    printA4Element("zimni-printable-canvas", `Zimni_${selectedFirId || "Draft"}`);
  };

  // Download
  const handleDownload = () => {
    downloadA4DocumentAsHtml(
      "zimni-printable-canvas",
      `Zimni_${selectedFirId || "Draft"}`,
      `Zimni Case Diary - ${selectedFirId || "Draft"}`
    );
  };

  // Copy Plain Text
  const handleCopy = () => {
    const el = document.getElementById("zimni-printable-canvas");
    if (el) {
      navigator.clipboard.writeText(el.innerText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Header Lines Manipulation
  const handleUpdateLeftHeader = (id: string, text: string) => {
    setData((prev) => ({
      ...prev,
      leftHeaderLines: prev.leftHeaderLines.map((l) => (l.id === id ? { ...l, text } : l)),
    }));
  };

  const handleAddLeftHeader = () => {
    setData((prev) => ({
      ...prev,
      leftHeaderLines: [...prev.leftHeaderLines, { id: `lh_${Date.now()}`, text: "नया विवरण..." }],
    }));
  };

  const handleDeleteLeftHeader = (id: string) => {
    setData((prev) => ({
      ...prev,
      leftHeaderLines: prev.leftHeaderLines.filter((l) => l.id !== id),
    }));
  };

  const handleUpdateRightHeader = (id: string, text: string) => {
    setData((prev) => ({
      ...prev,
      rightHeaderLines: prev.rightHeaderLines.map((l) => (l.id === id ? { ...l, text } : l)),
    }));
  };

  const handleAddRightHeader = () => {
    setData((prev) => ({
      ...prev,
      rightHeaderLines: [...prev.rightHeaderLines, { id: `rh_${Date.now()}`, text: "नया विवरण..." }],
    }));
  };

  const handleDeleteRightHeader = (id: string) => {
    setData((prev) => ({
      ...prev,
      rightHeaderLines: prev.rightHeaderLines.filter((l) => l.id !== id),
    }));
  };

  // Entries / Rows Manipulation
  const handleUpdateEntry = (id: string, field: keyof ZimniEntryRow, val: string) => {
    setData((prev) => ({
      ...prev,
      entries: prev.entries.map((entry) => (entry.id === id ? { ...entry, [field]: val } : entry)),
    }));
  };

  const handleAddEntryRow = (afterIndex?: number) => {
    const nextSr = String(data.entries.length + 1) + ".";
    const newEntry: ZimniEntryRow = {
      id: `entry_${Date.now()}`,
      dateTime: "",
      srNo: nextSr,
      narration: "",
    };

    if (afterIndex !== undefined) {
      const updated = [...data.entries];
      updated.splice(afterIndex + 1, 0, newEntry);
      setData((prev) => ({ ...prev, entries: updated }));
    } else {
      setData((prev) => ({ ...prev, entries: [...prev.entries, newEntry] }));
    }
  };

  const handleDeleteEntryRow = (id: string) => {
    if (data.entries.length <= 1) return;
    setData((prev) => ({
      ...prev,
      entries: prev.entries.filter((e) => e.id !== id),
    }));
  };

  // Additional Signatures
  const handleAddSignatureBlock = () => {
    setData((prev) => ({
      ...prev,
      additionalSignatures: [
        ...prev.additionalSignatures,
        {
          id: `sign_${Date.now()}`,
          title: "पर्यवेक्षण अधिकारी / थाना प्रबंधक",
          officerNameRank: "निरीक्षक प्रबंधक अफसर",
          post: data.officerPost,
          date: data.signDate,
        },
      ],
    }));
  };

  const handleDeleteSignatureBlock = (id: string) => {
    setData((prev) => ({
      ...prev,
      additionalSignatures: prev.additionalSignatures.filter((s) => s.id !== id),
    }));
  };

  // Border Manipulation Handlers
  const handleToggleRowBottomBorder = (rowId: string) => {
    setData((prev) => ({
      ...prev,
      entries: prev.entries.map((e) =>
        e.id === rowId ? { ...e, hasBottomBorder: !e.hasBottomBorder } : e
      ),
    }));
  };

  const handleAddAllHorizontalBorders = () => {
    setData((prev) => ({
      ...prev,
      entries: prev.entries.map((e) => ({ ...e, hasBottomBorder: true })),
    }));
  };

  const handleRemoveAllHorizontalBorders = () => {
    setData((prev) => ({
      ...prev,
      entries: prev.entries.map((e) => ({ ...e, hasBottomBorder: false })),
    }));
  };

  const handleToggleVerticalBorder = (key: keyof VerticalBordersConfig) => {
    setData((prev) => ({
      ...prev,
      verticalBorders: {
        ...prev.verticalBorders,
        [key]: !prev.verticalBorders[key],
      },
    }));
  };

  const handleToggleHorizontalBorder = (key: keyof HorizontalBordersConfig) => {
    setData((prev) => ({
      ...prev,
      horizontalBorders: {
        ...prev.horizontalBorders,
        [key]: !prev.horizontalBorders[key],
      },
    }));
  };

  const handleSetBorderWidth = (w: "1px" | "2px" | "3px") => {
    setData((prev) => ({
      ...prev,
      borderWidth: w,
    }));
  };

  const applyPreset = (preset: "original" | "full_grid" | "none") => {
    if (preset === "original") {
      setData((prev) => ({
        ...prev,
        borderStyle: "box",
        borderWidth: "2px",
        verticalBorders: {
          outerLeft: true,
          col1ToCol2: true,
          col2ToCol3: true,
          outerRight: true,
        },
        horizontalBorders: {
          outerTop: true,
          headerBottom: true,
          caseHeadingBottom: false,
          closingTop: true,
          outerBottom: true,
        },
        entries: prev.entries.map((e) => ({ ...e, hasBottomBorder: false })),
      }));
    } else if (preset === "full_grid") {
      setData((prev) => ({
        ...prev,
        borderStyle: "box",
        borderWidth: "2px",
        verticalBorders: {
          outerLeft: true,
          col1ToCol2: true,
          col2ToCol3: true,
          outerRight: true,
        },
        horizontalBorders: {
          outerTop: true,
          headerBottom: true,
          caseHeadingBottom: true,
          closingTop: true,
          outerBottom: true,
        },
        entries: prev.entries.map((e) => ({ ...e, hasBottomBorder: true })),
      }));
    } else if (preset === "none") {
      setData((prev) => ({
        ...prev,
        borderStyle: "none",
        verticalBorders: {
          outerLeft: false,
          col1ToCol2: false,
          col2ToCol3: false,
          outerRight: false,
        },
        horizontalBorders: {
          outerTop: false,
          headerBottom: false,
          caseHeadingBottom: false,
          closingTop: false,
          outerBottom: false,
        },
        entries: prev.entries.map((e) => ({ ...e, hasBottomBorder: false })),
      }));
    }
  };

  const bw = data.borderWidth || "2px";
  const borderCol = "#0f172a";

  const tableContainerStyle: React.CSSProperties = {
    borderTop: data.horizontalBorders?.outerTop ? `${bw} solid ${borderCol}` : "none",
    borderBottom: data.horizontalBorders?.outerBottom ? `${bw} solid ${borderCol}` : "none",
    borderLeft: data.verticalBorders?.outerLeft ? `${bw} solid ${borderCol}` : "none",
    borderRight: data.verticalBorders?.outerRight ? `${bw} solid ${borderCol}` : "none",
  };

  const col1DividerStyle: React.CSSProperties = {
    borderRight: data.verticalBorders?.col1ToCol2 ? `${bw} solid ${borderCol}` : "none",
  };

  const col2DividerStyle: React.CSSProperties = {
    borderRight: data.verticalBorders?.col2ToCol3 ? `${bw} solid ${borderCol}` : "none",
  };

  const headerBottomStyle: React.CSSProperties = {
    borderBottom: data.horizontalBorders?.headerBottom ? `${bw} solid ${borderCol}` : "none",
  };

  const caseHeadingBottomStyle: React.CSSProperties = {
    borderBottom: data.horizontalBorders?.caseHeadingBottom ? `${bw} solid ${borderCol}` : "none",
  };

  const closingTopStyle: React.CSSProperties = {
    borderTop: data.horizontalBorders?.closingTop ? `${bw} solid ${borderCol}` : "none",
  };

  return (
    <div className="space-y-4 pb-20 animate-in fade-in-50">
      {/* Top Header / Actions Bar */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-800">
            <ScrollText className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-black text-[#0b192c] tracking-tight flex items-center gap-2">
              <span>केस डायरी (रिपोर्ट जिमनी) जनरेटर</span>
              <span className="text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold border border-amber-300">
                फार्म 25.54 (1)
              </span>
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Statutory Case Diary / Zimni under Section 175 BNSS &amp; PPR 25.54 • सम्पूर्ण प्रोफार्मा १००% एडिटेबल (Border, Content, Header)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {saveStatus && (
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg animate-in fade-in">
              {saveStatus}
            </span>
          )}

          <Button
            size="sm"
            onClick={handleSaveDraft}
            variant="outline"
            className="border-slate-300 text-slate-700 font-bold text-xs gap-1.5"
          >
            <Save className="w-3.5 h-3.5 text-blue-600" />
            <span>ड्राफ्ट सहेजें (Save)</span>
          </Button>

          <Button
            size="sm"
            onClick={handleDownload}
            variant="outline"
            className="border-slate-300 text-slate-700 font-bold text-xs gap-1.5"
            title="Download clean offline A4 document"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>डाउनलोड A4</span>
          </Button>

          <Button
            size="sm"
            onClick={handlePrint}
            className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs gap-1.5 shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>प्रिंट / PDF निकालें</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleCopy}
            className="border-slate-300 text-slate-700 font-bold text-xs gap-1.5"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Copied" : "टेक्स्ट कॉपी"}</span>
          </Button>
        </div>
      </div>

      {/* Navigation across IO Workspace */}
      <FIRWorkspaceNav firId={selectedFirId} />

      {/* Configuration & Active FIR Selector Header */}
      <div className="no-print bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-end">
          {/* Active FIR Selector */}
          <div className="lg:col-span-6">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
              Select Active FIR Case (सक्रिय एफ.आई.आर. केस चुनें) *
            </label>
            <select
              value={selectedFirId}
              onChange={(e) => setSelectedFirId(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {firs.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.firNumber} — {f.actsAndSections?.slice(0, 40)} ({f.complainantName || "Complaint"})
                </option>
              ))}
            </select>
          </div>

          {/* Quick Buttons for Auto-Fill and Reset */}
          <div className="lg:col-span-6 flex items-center gap-2 flex-wrap justify-start lg:justify-end">
            <Button
              type="button"
              size="sm"
              onClick={handleAutoFillFromFir}
              className="bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>FIR डेटा लोड करें (Auto-Fill)</span>
            </Button>

            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleResetToImageSample}
              className="border-amber-300 text-amber-900 hover:bg-amber-50 text-xs font-bold gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
              <span>मूल सैंपल लोड करें (Reset to Sample)</span>
            </Button>
          </div>
        </div>

        {/* Visibility Toggles & Font Size */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Toggle Header Visibility */}
            <button
              type="button"
              onClick={() => setData((p) => ({ ...p, showHeader: !p.showHeader }))}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold border transition-colors ${
                data.showHeader
                  ? "bg-amber-50 text-amber-900 border-amber-300"
                  : "bg-slate-50 text-slate-500 border-slate-200 line-through"
              }`}
            >
              {data.showHeader ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span>हेडर ब्लॉक {data.showHeader ? "सक्रिय" : "छिपा हुआ"}</span>
            </button>

            {/* Toggle Case Heading Visibility */}
            <button
              type="button"
              onClick={() => setData((p) => ({ ...p, showCaseHeading: !p.showCaseHeading }))}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold border transition-colors ${
                data.showCaseHeading
                  ? "bg-amber-50 text-amber-900 border-amber-300"
                  : "bg-slate-50 text-slate-500 border-slate-200 line-through"
              }`}
            >
              {data.showCaseHeading ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span>राज्य / बनाम विवरण {data.showCaseHeading ? "दिखाएं" : "छिपाएं"}</span>
            </button>
          </div>

          {/* Font Size Selector */}
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-600 text-[11px]">फॉन्ट आकार:</span>
            {(["compact", "normal", "large"] as const).map((sz) => (
              <button
                key={sz}
                type="button"
                onClick={() => setFontSize(sz)}
                className={`px-2 py-0.5 rounded text-xs font-bold uppercase transition-colors ${
                  fontSize === sz
                    ? "bg-amber-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {sz === "compact" ? "छोटा" : sz === "normal" ? "मध्यम" : "बड़ा"}
              </button>
            ))}
          </div>
        </div>

        {/* ================= GRANULAR BORDER & LINE CONTROLLER (HORIZONTAL & VERTICAL LINES) ================= */}
        <div className="pt-2 border-t border-slate-200 space-y-2.5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-800 flex items-center gap-1">
                <span>📐 बॉर्डर व रेखा नियंत्रक (Border &amp; Line Manager):</span>
              </span>
            </div>

            {/* Presets */}
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-[11px] font-bold text-slate-600">प्रीसेट:</span>
              <button
                type="button"
                onClick={() => applyPreset("original")}
                className="px-2.5 py-1 rounded text-xs font-bold bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 shadow-2xs"
                title="हरियाणा पुलिस मूल प्रारूप (बाहरी बॉक्स + कॉलम रेखाएं, पंक्तियों के बीच रेखाएं नहीं)"
              >
                ★ मूल प्रारूप (Photo Sample)
              </button>
              <button
                type="button"
                onClick={() => applyPreset("full_grid")}
                className="px-2.5 py-1 rounded text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300"
                title="हर पंक्ति में क्षैतिज रेखा चालू करें"
              >
                ▦ पूर्ण ग्रिड (Full Grid)
              </button>
              <button
                type="button"
                onClick={() => applyPreset("none")}
                className="px-2.5 py-1 rounded text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300"
                title="बिना बॉर्डर"
              >
                बिना बॉर्डर (None)
              </button>
            </div>

            {/* Line Thickness */}
            <div className="flex items-center gap-1">
              <span className="text-[11px] font-bold text-slate-600">मोटाई:</span>
              {(["1px", "2px", "3px"] as const).map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => handleSetBorderWidth(w)}
                  className={`px-2 py-0.5 rounded text-xs font-bold transition-colors ${
                    (data.borderWidth || "2px") === w
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {w === "1px" ? "1px (पतली)" : w === "2px" ? "2px (मानक)" : "3px (मोटी)"}
                </button>
              ))}
            </div>
          </div>

          {/* Granular Toggles for Vertical & Horizontal Border Lines */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
            {/* Vertical Lines (खड़ी रेखाएं) */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-700 block">
                खड़ी रेखाएं (Vertical Lines) जोड़ें / हटाएं:
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleToggleVerticalBorder("outerLeft")}
                  className={`px-2.5 py-1 rounded text-xs font-bold border transition-colors ${
                    data.verticalBorders?.outerLeft
                      ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                      : "bg-white text-slate-400 border-slate-200 line-through"
                  }`}
                >
                  | बायां बॉर्डर (Outer Left)
                </button>

                <button
                  type="button"
                  onClick={() => handleToggleVerticalBorder("col1ToCol2")}
                  className={`px-2.5 py-1 rounded text-xs font-bold border transition-colors ${
                    data.verticalBorders?.col1ToCol2
                      ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                      : "bg-white text-slate-400 border-slate-200 line-through"
                  }`}
                >
                  | कॉलम १-२ रेखा (तिथि - क्रं.स.)
                </button>

                <button
                  type="button"
                  onClick={() => handleToggleVerticalBorder("col2ToCol3")}
                  className={`px-2.5 py-1 rounded text-xs font-bold border transition-colors ${
                    data.verticalBorders?.col2ToCol3
                      ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                      : "bg-white text-slate-400 border-slate-200 line-through"
                  }`}
                >
                  | कॉलम २-३ रेखा (क्रं.स. - विवरण)
                </button>

                <button
                  type="button"
                  onClick={() => handleToggleVerticalBorder("outerRight")}
                  className={`px-2.5 py-1 rounded text-xs font-bold border transition-colors ${
                    data.verticalBorders?.outerRight
                      ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                      : "bg-white text-slate-400 border-slate-200 line-through"
                  }`}
                >
                  | दायां बॉर्डर (Outer Right)
                </button>
              </div>
            </div>

            {/* Horizontal Lines (आड़ी / क्षैतिज रेखाएं) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700 block">
                  आड़ी / क्षैतिज रेखाएं (Horizontal Lines) जोड़ें / हटाएं:
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleAddAllHorizontalBorders}
                    className="text-[11px] font-bold text-blue-700 hover:underline px-1"
                    title="सभी प्रविष्टियों के नीचे रेखा जोड़ें"
                  >
                    + सबमें जोड़ें
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={handleRemoveAllHorizontalBorders}
                    className="text-[11px] font-bold text-red-600 hover:underline px-1"
                    title="सभी प्रविष्टियों की रेखाएं हटाएं"
                  >
                    - सब हटाएं (मूल)
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleToggleHorizontalBorder("outerTop")}
                  className={`px-2.5 py-1 rounded text-xs font-bold border transition-colors ${
                    data.horizontalBorders?.outerTop
                      ? "bg-blue-100 text-blue-900 border-blue-300"
                      : "bg-white text-slate-400 border-slate-200 line-through"
                  }`}
                >
                  — ऊपरी आउटर रेखा
                </button>

                <button
                  type="button"
                  onClick={() => handleToggleHorizontalBorder("headerBottom")}
                  className={`px-2.5 py-1 rounded text-xs font-bold border transition-colors ${
                    data.horizontalBorders?.headerBottom
                      ? "bg-blue-100 text-blue-900 border-blue-300"
                      : "bg-white text-slate-400 border-slate-200 line-through"
                  }`}
                >
                  — हेडर के नीचे रेखा
                </button>

                <button
                  type="button"
                  onClick={() => handleToggleHorizontalBorder("caseHeadingBottom")}
                  className={`px-2.5 py-1 rounded text-xs font-bold border transition-colors ${
                    data.horizontalBorders?.caseHeadingBottom
                      ? "bg-blue-100 text-blue-900 border-blue-300"
                      : "bg-white text-slate-400 border-slate-200 line-through"
                  }`}
                >
                  — राज्य/बनाम रेखा
                </button>

                <button
                  type="button"
                  onClick={() => handleToggleHorizontalBorder("closingTop")}
                  className={`px-2.5 py-1 rounded text-xs font-bold border transition-colors ${
                    data.horizontalBorders?.closingTop
                      ? "bg-blue-100 text-blue-900 border-blue-300"
                      : "bg-white text-slate-400 border-slate-200 line-through"
                  }`}
                >
                  — हस्ताक्षर के ऊपर रेखा
                </button>

                <button
                  type="button"
                  onClick={() => handleToggleHorizontalBorder("outerBottom")}
                  className={`px-2.5 py-1 rounded text-xs font-bold border transition-colors ${
                    data.horizontalBorders?.outerBottom
                      ? "bg-blue-100 text-blue-900 border-blue-300"
                      : "bg-white text-slate-400 border-slate-200 line-through"
                  }`}
                >
                  — निचली आउटर रेखा
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================= EDITABLE OFFICIAL ZIMNI LEGAL DOCUMENT CANVAS ================= */}
      <div className="flex justify-center">
        <div
          id="zimni-printable-canvas"
          className={`w-full max-w-4xl bg-white border border-slate-300 shadow-md rounded-xl p-6 sm:p-10 transition-all font-serif text-slate-900 ${
            fontSize === "compact" ? "text-xs" : fontSize === "large" ? "text-base" : "text-sm"
          }`}
          style={{ minHeight: "1050px", lineHeight: "1.6" }}
        >
          {/* HEADER SECTION (पुलिस फार्म संख्या 25.54 (1) भाग (1) / रिपोर्ट जिमनी) */}
          {data.showHeader && (
            <div className="mb-4 space-y-3">
              {/* Center Main Titles */}
              <div className="text-center space-y-1">
                <input
                  type="text"
                  value={data.formNumberText}
                  onChange={(e) => setData((p) => ({ ...p, formNumberText: e.target.value }))}
                  placeholder="पुलिस फार्म संख्या 25.54 (1) भाग (1)"
                  className="w-full text-center font-bold text-base sm:text-lg text-slate-900 bg-transparent hover:bg-amber-50/50 focus:bg-white border border-transparent hover:border-slate-300 focus:border-amber-500 rounded px-2 py-0.5 outline-none tracking-wide"
                />
                <input
                  type="text"
                  value={data.reportTitleText}
                  onChange={(e) => setData((p) => ({ ...p, reportTitleText: e.target.value }))}
                  placeholder="रिपोर्ट जिमनी"
                  className="w-full text-center font-black text-lg sm:text-xl text-slate-950 bg-transparent hover:bg-amber-50/50 focus:bg-white border border-transparent hover:border-slate-300 focus:border-amber-500 rounded px-2 py-0.5 outline-none tracking-wider"
                />
              </div>

              {/* Two Column Header (Left Info vs Right Info) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start pt-1">
                {/* Left Side Header Block (थाना, मु०नं०, घटना स्थल, घटना तिथि, अपराध) */}
                <div className="space-y-1">
                  {data.leftHeaderLines.map((line) => (
                    <div key={line.id} className="group flex items-center gap-1">
                      <input
                        type="text"
                        value={line.text}
                        onChange={(e) => handleUpdateLeftHeader(line.id, e.target.value)}
                        className="w-full font-bold text-slate-900 bg-transparent hover:bg-amber-50/50 focus:bg-white border-b border-transparent hover:border-slate-300 focus:border-amber-500 px-1 py-0.5 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleDeleteLeftHeader(line.id)}
                        title="यह पंक्ति हटाएं"
                        className="no-print opacity-0 group-hover:opacity-100 p-0.5 text-red-500 hover:text-red-700 transition-opacity"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  <div className="no-print pt-1">
                    <button
                      type="button"
                      onClick={handleAddLeftHeader}
                      className="text-[11px] font-bold text-amber-700 hover:text-amber-900 hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>+ नई बायीं पंक्ति जोड़ें</span>
                    </button>
                  </div>
                </div>

                {/* Right Side Header Block (पुलिस आयुक्तालय, जिमनी नं०, प्राप्ति तिथि, रवानगी तिथि) */}
                <div className="space-y-1 sm:text-right">
                  {data.rightHeaderLines.map((line) => (
                    <div key={line.id} className="group flex items-center sm:justify-end gap-1">
                      <input
                        type="text"
                        value={line.text}
                        onChange={(e) => handleUpdateRightHeader(line.id, e.target.value)}
                        className="w-full sm:text-right font-bold text-slate-900 bg-transparent hover:bg-amber-50/50 focus:bg-white border-b border-transparent hover:border-slate-300 focus:border-amber-500 px-1 py-0.5 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleDeleteRightHeader(line.id)}
                        title="यह पंक्ति हटाएं"
                        className="no-print opacity-0 group-hover:opacity-100 p-0.5 text-red-500 hover:text-red-700 transition-opacity"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  <div className="no-print pt-1 flex justify-start sm:justify-end">
                    <button
                      type="button"
                      onClick={handleAddRightHeader}
                      className="text-[11px] font-bold text-amber-700 hover:text-amber-900 hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>+ नई दायीं पंक्ति जोड़ें</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= THE MAIN 3-COLUMN STATUTORY BOX TABLE ================= */}
          <div
            className="w-full rounded-none"
            style={tableContainerStyle}
          >
            {/* Table Header Row (Column Titles) */}
            <div
              className="grid grid-cols-12 font-bold text-slate-950 bg-slate-50/40 text-center"
              style={headerBottomStyle}
            >
              {/* Column 1 Title */}
              <div
                className="col-span-2 p-2 flex items-center justify-center"
                style={col1DividerStyle}
              >
                <input
                  type="text"
                  value={data.col1Title}
                  onChange={(e) => setData((p) => ({ ...p, col1Title: e.target.value }))}
                  className="w-full text-center font-bold bg-transparent outline-none"
                  placeholder="तिथि व समय"
                />
              </div>

              {/* Column 2 Title */}
              <div
                className="col-span-1 p-2 flex items-center justify-center"
                style={col2DividerStyle}
              >
                <input
                  type="text"
                  value={data.col2Title}
                  onChange={(e) => setData((p) => ({ ...p, col2Title: e.target.value }))}
                  className="w-full text-center font-bold bg-transparent outline-none"
                  placeholder="क्रं. स."
                />
              </div>

              {/* Column 3 Title */}
              <div className="col-span-9 p-2 flex items-center justify-center">
                <input
                  type="text"
                  value={data.col3Title}
                  onChange={(e) => setData((p) => ({ ...p, col3Title: e.target.value }))}
                  className="w-full text-center font-bold bg-transparent outline-none"
                  placeholder="अनुसंधान का विवरण"
                />
              </div>
            </div>

            {/* Case Headings Inside Top of Column 3 (राज्य द्वारा, बनाम, अनुसन्धानकर्ता, श्रीमान जी) */}
            {data.showCaseHeading && (
              <div
                className="grid grid-cols-12"
                style={caseHeadingBottomStyle}
              >
                <div
                  className="col-span-2 bg-slate-50/20"
                  style={col1DividerStyle}
                ></div>
                <div
                  className="col-span-1 bg-slate-50/20"
                  style={col2DividerStyle}
                ></div>
                <div className="col-span-9 p-3 space-y-2">
                  {/* State / Complainant Line */}
                  <div className="flex items-start gap-1">
                    <textarea
                      rows={2}
                      value={data.stateLine}
                      onChange={(e) => setData((p) => ({ ...p, stateLine: e.target.value }))}
                      placeholder="राज्य द्वारा:- ..."
                      className="w-full font-bold text-slate-900 bg-transparent hover:bg-amber-50/40 focus:bg-white border border-transparent hover:border-slate-300 focus:border-amber-500 rounded p-1 outline-none resize-y leading-relaxed"
                    />
                    <VoiceInputButton
                      onTranscript={(t) => setData((p) => ({ ...p, stateLine: (p.stateLine ? p.stateLine + " " : "") + t }))}
                      currentValue={data.stateLine}
                      fieldLabel="राज्य द्वारा विवरण"
                      iconOnly
                    />
                  </div>

                  {/* Accused Line */}
                  <div className="flex items-start gap-1">
                    <textarea
                      rows={1}
                      value={data.accusedLine}
                      onChange={(e) => setData((p) => ({ ...p, accusedLine: e.target.value }))}
                      placeholder="बनाम:- ..."
                      className="w-full font-bold text-slate-900 bg-transparent hover:bg-amber-50/40 focus:bg-white border border-transparent hover:border-slate-300 focus:border-amber-500 rounded p-1 outline-none resize-y"
                    />
                    <VoiceInputButton
                      onTranscript={(t) => setData((p) => ({ ...p, accusedLine: (p.accusedLine ? p.accusedLine + " " : "") + t }))}
                      currentValue={data.accusedLine}
                      fieldLabel="बनाम विवरण"
                      iconOnly
                    />
                  </div>

                  {/* IO Line */}
                  <div className="flex items-start gap-1">
                    <textarea
                      rows={1}
                      value={data.ioLine}
                      onChange={(e) => setData((p) => ({ ...p, ioLine: e.target.value }))}
                      placeholder="अनुसन्धानकर्ता:- ..."
                      className="w-full font-bold text-slate-900 bg-transparent hover:bg-amber-50/40 focus:bg-white border border-transparent hover:border-slate-300 focus:border-amber-500 rounded p-1 outline-none resize-y"
                    />
                    <VoiceInputButton
                      onTranscript={(t) => setData((p) => ({ ...p, ioLine: (p.ioLine ? p.ioLine + " " : "") + t }))}
                      currentValue={data.ioLine}
                      fieldLabel="अनुसन्धानकर्ता विवरण"
                      iconOnly
                    />
                  </div>

                  {/* Salutation */}
                  <div className="pt-1 flex items-center justify-between">
                    <input
                      type="text"
                      value={data.salutation}
                      onChange={(e) => setData((p) => ({ ...p, salutation: e.target.value }))}
                      placeholder="श्रीमान जी,"
                      className="font-bold text-slate-950 bg-transparent hover:bg-amber-50/40 focus:bg-white border border-transparent hover:border-slate-300 focus:border-amber-500 rounded px-1 py-0.5 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleToggleHorizontalBorder("caseHeadingBottom")}
                      className="no-print text-[10px] font-bold px-2 py-0.5 rounded border border-slate-300 hover:bg-amber-50 text-slate-600"
                      title="इस विवरण के नीचे क्षैतिज रेखा चालू या बंद करें"
                    >
                      नीचे रेखा: {data.horizontalBorders?.caseHeadingBottom ? "ऑन" : "ऑफ"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ================= ENTRY ROWS (INVESTIGATION NARRATION) ================= */}
            {data.entries.map((entry, index) => (
              <div
                key={entry.id}
                className="grid grid-cols-12 group relative"
                style={{
                  borderBottom: entry.hasBottomBorder
                    ? `${bw} solid ${borderCol}`
                    : "none",
                }}
              >
                {/* Column 1: Date & Time / पुछताछ */}
                <div
                  className="col-span-2 p-2 sm:p-3 align-top flex flex-col justify-start relative group/col1"
                  style={col1DividerStyle}
                >
                  <textarea
                    rows={Math.max(2, (entry.dateTime || "").split("\n").length)}
                    value={entry.dateTime}
                    onChange={(e) => handleUpdateEntry(entry.id, "dateTime", e.target.value)}
                    placeholder={"दिनांक\n..\nसमय\n.."}
                    className="w-full text-xs sm:text-sm font-bold text-slate-900 bg-transparent hover:bg-amber-50/40 focus:bg-white border border-transparent hover:border-slate-300 focus:border-amber-500 rounded p-1 outline-none resize-y leading-tight whitespace-pre-line"
                  />
                  <div className="no-print absolute top-1 right-1 opacity-0 group-hover/col1:opacity-100 transition-opacity">
                    <VoiceInputButton
                      currentValue={entry.dateTime}
                      fieldLabel="तिथि / समय"
                      preferredLang="hi-IN"
                      iconOnly
                      onTranscript={(text) => {
                        const updated = entry.dateTime ? `${entry.dateTime} ${text}` : text;
                        handleUpdateEntry(entry.id, "dateTime", updated);
                      }}
                    />
                  </div>
                </div>

                {/* Column 2: Serial Number */}
                <div
                  className="col-span-1 p-2 sm:p-3 text-center align-top"
                  style={col2DividerStyle}
                >
                  <input
                    type="text"
                    value={entry.srNo}
                    onChange={(e) => handleUpdateEntry(entry.id, "srNo", e.target.value)}
                    placeholder={`${index + 1}.`}
                    className="w-full text-center font-bold text-slate-900 bg-transparent hover:bg-amber-50/40 focus:bg-white border border-transparent hover:border-slate-300 focus:border-amber-500 rounded py-0.5 outline-none"
                  />
                </div>

                {/* Column 3: Narration Details */}
                <div className="col-span-9 p-3 relative space-y-2">
                  <div className="relative">
                    <AutoSuggestField
                      as="textarea"
                      entryType="ZIMNI"
                      rows={Math.max(4, Math.ceil((entry.narration || "").length / 85))}
                      value={entry.narration}
                      onChange={(val) => handleUpdateEntry(entry.id, "narration", val)}
                      placeholder="अनुसंधान का विस्तृत विवरण दर्ज करें..."
                      inputClassName="text-justify text-slate-950 bg-transparent hover:bg-amber-50/40 focus:bg-white border-transparent hover:border-slate-300 focus:border-amber-500 rounded p-1 outline-none resize-y leading-relaxed font-serif"
                    />

                    {/* Hindi / English Voice Typing Support */}
                    <div className="no-print absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <VoiceInputButton
                        currentValue={entry.narration}
                        fieldLabel={`Zimni Entry ${entry.srNo}`}
                        preferredLang="hi-IN"
                        onTranscript={(text) => {
                          const updated = entry.narration ? `${entry.narration} ${text}` : text;
                          handleUpdateEntry(entry.id, "narration", updated);
                        }}
                      />
                    </div>
                  </div>

                  {/* Row Controls Bar (Shown on hover in interactive mode) */}
                  <div className="no-print opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between gap-2 pt-1 border-t border-dashed border-slate-200">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleToggleRowBottomBorder(entry.id)}
                        className={`text-[11px] font-bold px-2 py-0.5 rounded border flex items-center gap-1 transition-colors ${
                          entry.hasBottomBorder
                            ? "bg-slate-900 text-white border-slate-900 shadow-2xs"
                            : "bg-slate-50 text-slate-700 border-slate-300 hover:bg-amber-50"
                        }`}
                        title="इस पंक्ति के नीचे क्षैतिज रेखा जोड़ें या हटाएं"
                      >
                        <span>नीचे रेखा:</span>
                        <span>{entry.hasBottomBorder ? "✓ ऑन" : "✕ ऑफ"}</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleAddEntryRow(index)}
                        className="text-[11px] font-bold text-blue-700 hover:text-blue-900 hover:underline flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>नीचे नई पंक्ति जोड़ें</span>
                      </button>

                      {data.entries.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleDeleteEntryRow(entry.id)}
                          className="text-[11px] font-bold text-red-600 hover:text-red-800 hover:underline flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>पंक्ति हटाएं</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* ================= CLOSING STATEMENT & SIGNATURE BLOCK ================= */}
            <div
              className="grid grid-cols-12"
              style={closingTopStyle}
            >
              <div
                className="col-span-2 bg-slate-50/20"
                style={col1DividerStyle}
              ></div>
              <div
                className="col-span-1 bg-slate-50/20"
                style={col2DividerStyle}
              ></div>
              <div className="col-span-9 p-4 space-y-4">
                {/* Closing Presentation Line */}
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={data.closingText}
                    onChange={(e) => setData((p) => ({ ...p, closingText: e.target.value }))}
                    placeholder="रिपोर्ट जिमनी लिखी सेवा में प्रस्तुत है।"
                    className="w-full font-bold text-slate-900 bg-transparent hover:bg-amber-50/40 focus:bg-white border border-transparent hover:border-slate-300 focus:border-amber-500 rounded px-1 py-0.5 outline-none"
                  />
                  <VoiceInputButton
                    onTranscript={(t) => setData((p) => ({ ...p, closingText: t }))}
                    currentValue={data.closingText}
                    fieldLabel="समापन विवरण"
                    iconOnly
                  />
                </div>

                {/* Primary Officer Signature Block (Aligned Right, matching image) */}
                <div className="flex flex-col items-end text-right space-y-1 pt-2">
                  {/* Handwritten Style Signature Graphic */}
                  {data.hasSignatureGraphic && (
                    <div className="w-36 h-10 border-b border-slate-800 flex items-center justify-center text-blue-900 font-serif italic text-lg select-none">
                      <span>Jasbir Singh</span>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-1 w-full">
                    <input
                      type="text"
                      value={data.officerNameRank}
                      onChange={(e) => setData((p) => ({ ...p, officerNameRank: e.target.value }))}
                      placeholder="स.उप.नि. जसबीर सिंह न. 128/पंचकूला"
                      className="text-right font-bold text-slate-900 bg-transparent hover:bg-amber-50/40 focus:bg-white border border-transparent hover:border-slate-300 focus:border-amber-500 rounded px-1 py-0.5 outline-none w-72"
                    />
                    <VoiceInputButton
                      onTranscript={(t) => setData((p) => ({ ...p, officerNameRank: t }))}
                      currentValue={data.officerNameRank}
                      fieldLabel="अधिकारी का नाम"
                      iconOnly
                    />
                  </div>

                  <div className="flex items-center justify-end gap-1 w-full">
                    <input
                      type="text"
                      value={data.officerPost}
                      onChange={(e) => setData((p) => ({ ...p, officerPost: e.target.value }))}
                      placeholder="पुलिस चौकी सैक्टर 19 पंचकूला"
                      className="text-right font-medium text-slate-800 bg-transparent hover:bg-amber-50/40 focus:bg-white border border-transparent hover:border-slate-300 focus:border-amber-500 rounded px-1 py-0.5 outline-none w-72"
                    />
                    <VoiceInputButton
                      onTranscript={(t) => setData((p) => ({ ...p, officerPost: t }))}
                      currentValue={data.officerPost}
                      fieldLabel="पदस्थापना"
                      iconOnly
                    />
                  </div>

                  <input
                    type="text"
                    value={data.signDate}
                    onChange={(e) => setData((p) => ({ ...p, signDate: e.target.value }))}
                    placeholder="दिनांक - 11.11.2024"
                    className="text-right font-medium text-slate-800 bg-transparent hover:bg-amber-50/40 focus:bg-white border border-transparent hover:border-slate-300 focus:border-amber-500 rounded px-1 py-0.5 outline-none w-72"
                  />
                </div>

                {/* Additional Signatures (if added by user) */}
                {data.additionalSignatures.map((sig) => (
                  <div key={sig.id} className="pt-3 border-t border-dashed border-slate-300 flex flex-col items-end text-right space-y-1">
                    <input
                      type="text"
                      value={sig.title}
                      onChange={(e) =>
                        setData((p) => ({
                          ...p,
                          additionalSignatures: p.additionalSignatures.map((s) =>
                            s.id === sig.id ? { ...s, title: e.target.value } : s
                          ),
                        }))
                      }
                      className="text-right font-bold text-slate-900 bg-transparent outline-none w-72"
                    />
                    <input
                      type="text"
                      value={sig.officerNameRank}
                      onChange={(e) =>
                        setData((p) => ({
                          ...p,
                          additionalSignatures: p.additionalSignatures.map((s) =>
                            s.id === sig.id ? { ...s, officerNameRank: e.target.value } : s
                          ),
                        }))
                      }
                      className="text-right font-medium text-slate-800 bg-transparent outline-none w-72"
                    />
                    <div className="no-print">
                      <button
                        type="button"
                        onClick={() => handleDeleteSignatureBlock(sig.id)}
                        className="text-[11px] text-red-600 hover:underline"
                      >
                        हस्ताक्षर ब्लॉक हटाएं
                      </button>
                    </div>
                  </div>
                ))}

                {/* Button to add extra signature block */}
                <div className="no-print flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={handleAddSignatureBlock}
                    className="text-xs font-bold text-amber-700 hover:text-amber-900 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ अतिरिक्त अधिकारी हस्ताक्षर ब्लॉक जोड़ें</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Bottom Button to Add More Entries */}
          <div className="no-print mt-4 flex items-center justify-center">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleAddEntryRow()}
              className="border-dashed border-amber-400 bg-amber-50/50 hover:bg-amber-100 text-amber-900 font-bold text-xs gap-1.5"
            >
              <Plus className="w-4 h-4 text-amber-700" />
              <span>+ अगली जिमनी प्रविष्टि / पंक्ति जोड़ें (Add Entry)</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ZimniPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-slate-500 font-bold text-sm">
          Loading Case Diary (Zimni) Generator...
        </div>
      }
    >
      <ZimniWorkspaceContent />
    </Suspense>
  );
}
