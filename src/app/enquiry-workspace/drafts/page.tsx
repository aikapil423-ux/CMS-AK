"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  FileCheck2,
  Printer,
  Copy,
  Check,
  RotateCcw,
  Shield,
  Download,
  ArrowLeft,
  Save,
  CheckCircle2,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Sliders,
  Table,
  FileText,
  BadgeAlert,
  UserCheck,
  UploadCloud,
  Loader2,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { VoiceInputButton } from "@/components/ui/voice-input-button";
import { ComplaintService } from "@/services/complaintService";
import { ComplaintItem } from "@/types";
import {
  generateHaryanaPoliceProformaHtml,
  HaryanaPoliceProformaData,
} from "@/utils/documentHtmlGenerators";

export type EnquiryProformaType =
  | "standard_4row" // PDF 1, 2, 5: परिवादी / परिवाद का सार / उत्तरवादी / जांच स्थिति
  | "three_column" // PDF 3: आरोप बिन्दूवार / जांच का विवरण / पुलिस कार्यवाही
  | "citizen_detail" // PDF 4: DEPARTMENT / CITIZEN DETAIL / CITIZEN SATISFACTION
  | "ncr_174"; // NCR u/s 174 BNSS

export interface ProformaRowState {
  id: string;
  label: string;
  cells: string[];
}

interface FormatTemplate {
  name: string;
  badge: string;
  icon: any;
  headerLeft: string;
  headerRight: string;
  subHeaderLeft: string;
  title: string;
  subTitle: string;
  columns: string[]; // empty if 2-column key-value
  rows: ProformaRowState[];
  closingLine: string;
  officerName: string;
  officerRank: string;
  officerLocation: string;
}

const TEMPLATE_PRESETS: Record<EnquiryProformaType, FormatTemplate> = {
  // 1. PDF 1, 2, 5: मानक 4-रो जांच रिपोर्ट
  standard_4row: {
    name: "मानक जांच रिपोर्ट (PDF 1, 2, 5)",
    badge: "Official Haryana Police Standard",
    icon: Shield,
    headerLeft: "पुलिस विभाग",
    headerRight: "जिला पानीपत",
    subHeaderLeft: "",
    title: "जांच रिपोर्ट परिवाद नम्बरी 128-SPL-III DT 10.02.2026",
    subTitle: "",
    columns: [],
    rows: [
      {
        id: "row_complainant",
        label: "परिवादी",
        cells: [
          "बबली देवी पत्नी गुरदयाल सिंह वासी जौंसी रोड समालखा पानीपत (मो0 9812033441)",
        ],
      },
      {
        id: "row_gist",
        label: "परिवाद का सार",
        cells: ["मारपीट करने व जान से मारने की धमकी देने बारे"],
      },
      {
        id: "row_accused",
        label: "उत्तरवादी का विवरण",
        cells: [
          "चन्द्रपाल वासी जौंसी रोड समालखा पानीपत (मो0 9812044551)",
        ],
      },
      {
        id: "row_findings",
        label: "जांच की स्थिती का विवरण",
        cells: [
          "अन्तिम रिपोर्ट (फाइनल रिपोर्ट) तथा की गई कार्यवाही- श्रीमान जी परिवाद नम्बरी 128-SPL-III DT 10.02.2026 अजाने बबली देवी पत्नी गुरदयाल सिंह वासी जौंसी रोड समालखा पानीपत की जांच मेरे द्वारा अमल में लाई गई। दौरान जांच परिवाद का अध्ययन किया गया।\n\nदौरान जांच परिवादिया व उत्तरवादी को शामिल जांच करके पूछताछ की गई। परिवादिया ने अपनी शिकायत मे लगाये गये कोई भी साक्ष्य व गवाह पेश नही किए। मौका पर जाकर आमजन व पड़ोसियों को शामिल जांच करके पूछताछ की गई व उनके कथन अंकित किए गए।\n\nउत्तरवादी को भी शामिल जांच किया गया तथा कथन अंकित किए गए। मौका की पूछताछ व गवाहों के बयानात से पाया गया कि बबली देवी द्वारा जो आरोप लगाए गए हैं उनमे कोई सच्चाई नही है बल्कि बार-बार झूठे आरोप लगाकर दरखास्तें देती रहती है। उत्तरवादी के खिलाफ निवारक कार्यवाही अमल में लाई गई है। अतः उक्त परिवाद पर किसी कानूनी कार्यवाही की आवश्यकता नहीं है। परिवाद को दफ्तर दाखिल करने के सादर आदेश फरमाए जाएं।",
        ],
      },
    ],
    closingLine: "रिपोर्ट सेवा में पेश है।",
    officerName: "(सतीश कुमार ह.पु.से.)",
    officerRank: "उप पुलिस अधीक्षक",
    officerLocation: "मुख्यालय पानीपत",
  },

  // 2. PDF 3: 3-स्तंभीय आरोप-वार तुलनात्मक जांच रिपोर्ट
  three_column: {
    name: "बिन्दुवार तुलनात्मक रिपोर्ट (PDF 3)",
    badge: "3-Column Proforma",
    icon: Table,
    headerLeft: "पुलिस विभाग",
    headerRight: "जिला पानीपत",
    subHeaderLeft: "श्रीमान जी,",
    title:
      "परिवाद नम्बरी 1736-पेशी दिनांक 19.12.2025 शिकायतकर्ता सम्पदा अधिकारी ह.श.वि.प्रा. पानीपत जांच हेतु प्राप्त हुई",
    subTitle: "परिवाद की जांच रिपोर्ट इस प्रकार है -",
    columns: [
      "शिकायतकर्ता द्वारा लगाये गये आरोप (बिन्दूवार)",
      "जांच का विवरण (सही/गलत) बिन्दूवार कारण सहित",
      "स्थानीय पुलिस/ एस.एच.ओ. द्वारा की गई कार्यवाही",
    ],
    rows: [
      {
        id: "row_col_1",
        label: "आरोप 1",
        cells: [
          "सम्पदा अधिकारी ह.श.वि.प्रा. पानीपत की अनुमति के बिना व गलत हस्ताक्षर करके प्लाट नम्बर 118 सैक्टर-25-PI पानीपत, प्लाट नम्बर 11 सैक्टर 29-PII पानीपत व प्लाट नंबर 51 सैक्टर-29 P-II पानीपत के अलाटमैन्ट लैटर जारी करने व डिस्पैच रजिस्टर में इन्द्राज करके प्लाट धारको को देने बारे।",
          "अभी तक की जांच मे प्लाट धारको श्री लक्की अरोडा, मैसर्स प्रदीप एक्सपोर्ट, विजय मोटर्स निवासी सैक्टर 25 द्वारा हुडा विभाग के कर्मचारियों से मिलीभगत करके बिना अनुमति फर्जी हस्ताक्षर से अलाटमैन्ट लैटर जारी करवाकर डिस्पैच रजिस्टर में इन्द्राज करना पाया गया है।",
          "श्रीमान जी, परिवाद की जांच मेरे द्वारा की गई। जांच के दौरान सम्पदा अधिकारी, रिकॉर्ड क्लर्क व सम्बंधित पार्टीज को नोटिस जारी कर तलब किया गया। बैंक व हुडा रिकॉर्ड का गहन निरीक्षण किया गया। प्रथम दृष्टया अपराध धारा 318(4), 338, 336(3), 340(2), 61(2) BNS घटित होना पाया गया है। अभियोग अंकित करने की सिफारिश की जाती है।",
        ],
      },
      {
        id: "row_col_2",
        label: "आरोप 2",
        cells: [
          "विभागीय डिस्पैच रजिस्टर में कूटरचित प्रविष्टि करके अनाधिकृत पत्राचार करना।",
          "जांच के दौरान डिस्पैच क्लर्क के बयान अंकित किए गए। मूल डिस्पैच रजिस्टर जब्त कर एफएसएल मधुबन भेजा गया है।",
          "थाना संबंधित को आवश्यक सुबूत एकत्र कर कानूनी कार्रवाई हेतु दिशा-निर्देश जारी किए गए।",
        ],
      },
    ],
    closingLine: "रिपोर्ट सेवा में प्रस्तुत है।",
    officerName: "हर्षित गोयल भा.पु.से.",
    officerRank: "सहायक पुलिस अधीक्षक",
    officerLocation: "पानीपत",
  },

  // 3. PDF 4: सीएम विंडो / नागरिक शिकायत जांच रिपोर्ट
  citizen_detail: {
    name: "नागरिक शिकायत / CM Window (PDF 4)",
    badge: "Citizen Satisfaction Docket",
    icon: UserCheck,
    headerLeft: "DEPARTMENT- POLICE",
    headerRight: "DISTRICT PANIPAT",
    subHeaderLeft: "",
    title: "CITIZEN GRIEVANCE ENQUIRY & SATISFACTION REPORT",
    subTitle: "",
    columns: [],
    rows: [
      {
        id: "row_citizen_detail",
        label: "CITIZEN DETAIL-",
        cells: [
          "NAME- दीपक पुत्र ओमप्रकाश\nMOBILE NO.- 9992998522\nADDRESS- दीपक पुत्र ओमप्रकाश, गांव जासोर पानीपत",
        ],
      },
      {
        id: "row_allegation",
        label: "शिकायत मे लगाये गये आरोप-",
        cells: [
          "जाति सूचक शब्द बोलने, जान से मारने की धमकी देने व कार्य कराने के पैसे ना देने बारे।",
        ],
      },
      {
        id: "row_report_date",
        label: "DATE OF REPORT-",
        cells: [new Date().toLocaleDateString("en-GB").replace(/\//g, ".")],
      },
      {
        id: "row_satisfaction",
        label: "CITIZEN SATISFACTION- YES/NO -",
        cells: [
          "SATISFIED (संतुष्ट) - दोनों पक्षों को आमने-सामने बैठाकर वार्ता कराई गई। परिवादी ने स्वीकार किया कि हिसाब-किताब का विवाद था जो सुलझा लिया गया है।",
        ],
      },
      {
        id: "row_final_report",
        label: "FINAL REPORT ON THE ENQUIRY CONDUCTED BY THE INVESTIGATING -",
        cells: [
          "जांच रिपोर्ट परिवाद नम्बरी 71-DCR DT 19.01.2026 अजाने दीपक पुत्र ओमप्रकाश वासी जासोर की जांच मेरे द्वारा अमल में लाई गई।\n\nदौरान जांच परिवादी व उत्तरवादी को शामिल जांच करके पूछताछ की गई व कथन अंकित किए गए। उत्तरवादी प्रमोद ने बताया कि कम्पनी के ठेके के तहत नाला निर्माण में भुगतान का विवाद था।\n\nजांच उपरांत दोनों पक्षों को आमने-सामने किया गया तो सच्चाई सामने आई कि कोई मारपीट या जातिसूचक गाली-गलौज नहीं हुआ था। मामला केवल पैसों के लेनदेन का था, जिसका निपटारा हो चुका है। परिवादी ने अपनी लिखित रजामंदी पेश की है। अतः परिवाद को दफ्तर दाखिल करने के सादर आदेश फरमाए जाएं।",
        ],
      },
    ],
    closingLine: "रिपोर्ट सेवा में पेश है।",
    officerName: "सहायक पुलिस अधीक्षक,",
    officerRank: "समालखा पानीपत",
    officerLocation: "",
  },

  // 4. NCR u/s 174 BNSS
  ncr_174: {
    name: "असंज्ञेय अपराध रिपोर्ट (NCR u/s 174 BNSS)",
    badge: "Non-Cognizable Report Proforma",
    icon: BadgeAlert,
    headerLeft: "पुलिस विभाग (थाना दैनिकी रोजनामचा)",
    headerRight: "जिला पानीपत",
    subHeaderLeft: "श्रीमान जी,",
    title: "प्रथम सूचना असंज्ञेय अपराध रिपोर्ट (NCR) जेर धारा 174 BNSS, 2023",
    subTitle: "थाना रोजनामचा जनरल डायरी प्रविष्टि संख्या 018",
    columns: [],
    rows: [
      {
        id: "row_ncr_complainant",
        label: "परिवादी / सूचनाकर्ता का विवरण",
        cells: [
          "संजीव कुमार वासी 116/5 हंस एन्कलेव गुरुग्राम (मो0 9991155540)",
        ],
      },
      {
        id: "row_ncr_gist",
        label: "घटना व असंज्ञेय अपराध का सार",
        cells: [
          "मानसिक प्रताड़ित करने, साधारण गाली-गलौच व जान से मारने की धमकी देने बारे।",
        ],
      },
      {
        id: "row_ncr_accused",
        label: "उत्तरवादी / संदेही का विवरण",
        cells: [
          "विनोद पुत्र ओमप्रकाश, सुनीता पत्नी विनोद, रामनिवास पुत्र राजबीर, अनिल पुत्र लक्ष्मीदत्त वासीयान वासी गांव डाहौला पानीपत",
        ],
      },
      {
        id: "row_ncr_findings",
        label: "जांच की स्थिती व जीडी प्रविष्टि का विवरण",
        cells: [
          "जांच रिपोर्ट- परिवाद नम्बरी 789-SPR DT 07.03.2026 अजाने संजीव कुमार वासी गुरुग्राम की जांच मेरे द्वारा अमल में लाई गई।\n\nदौरान जांच परिवाद का अध्ययन किया गया व परिवादी के मोबाईल न0 पर सम्पर्क किया गया। परिवादी ने बतलाया कि इसी संदर्भ में एक परिवाद थाना सेक्टर 29 पानीपत में चली हुई है, मेरी परिवाद को भी वहीं भिजवाया जाए। परिवादी ने अपनी स्टेटमेंट व्हाट्सअप के माध्यम से भेजी जो साथ संलग्न है।\n\nअतः उक्त असंज्ञेय परिवाद को आगामी कानूनी कार्यवाही व रोजनामचा प्रविष्टि हेतु संबंधित पर्यवेक्षण अधिकारी के पास भिजवाया जाए।",
        ],
      },
    ],
    closingLine: "रिपोर्ट सेवा में पेश है।",
    officerName: "सहायक पुलिस अधीक्षक,",
    officerRank: "समालखा पानीपत",
    officerLocation: "",
  },
};

function EnquiryDraftsContent() {
  const { currentUser } = useAuth();
  const searchParams = useSearchParams();
  const complaintIdParam = searchParams.get("complaintId");
  const categoryParam = searchParams.get("category");

  const initialFormat: EnquiryProformaType =
    categoryParam && TEMPLATE_PRESETS[categoryParam as EnquiryProformaType]
      ? (categoryParam as EnquiryProformaType)
      : categoryParam?.includes("ncr") || categoryParam?.includes("assault")
      ? "ncr_174"
      : categoryParam?.includes("citizen") || categoryParam?.includes("cyber")
      ? "citizen_detail"
      : categoryParam?.includes("col") || categoryParam?.includes("three")
      ? "three_column"
      : "standard_4row";

  const [activeFormat, setActiveFormat] = useState<EnquiryProformaType>(initialFormat);
  const [complaint, setComplaint] = useState<ComplaintItem | null>(null);

  // Editable Proforma Document State
  const [headerLeft, setHeaderLeft] = useState(TEMPLATE_PRESETS[initialFormat].headerLeft);
  const [headerRight, setHeaderRight] = useState(TEMPLATE_PRESETS[initialFormat].headerRight);
  const [subHeaderLeft, setSubHeaderLeft] = useState(TEMPLATE_PRESETS[initialFormat].subHeaderLeft);
  const [title, setTitle] = useState(TEMPLATE_PRESETS[initialFormat].title);
  const [subTitle, setSubTitle] = useState(TEMPLATE_PRESETS[initialFormat].subTitle);
  const [columns, setColumns] = useState<string[]>(TEMPLATE_PRESETS[initialFormat].columns);
  const [rows, setRows] = useState<ProformaRowState[]>(TEMPLATE_PRESETS[initialFormat].rows);
  const [closingLine, setClosingLine] = useState(TEMPLATE_PRESETS[initialFormat].closingLine);
  const [officerName, setOfficerName] = useState(TEMPLATE_PRESETS[initialFormat].officerName);
  const [officerRank, setOfficerRank] = useState(TEMPLATE_PRESETS[initialFormat].officerRank);
  const [officerLocation, setOfficerLocation] = useState(TEMPLATE_PRESETS[initialFormat].officerLocation);
  const [reportDate, setReportDate] = useState(`दिनांक ${new Date().toLocaleDateString("en-GB").replace(/\//g, ".")}`);

  // Appearance & Border Controls
  const [borderStyle, setBorderStyle] = useState<"solid" | "double" | "light" | "none">("solid");
  const [showHeader, setShowHeader] = useState(true);
  const [showSubHeader, setShowSubHeader] = useState(true);
  const [showClosingLine, setShowClosingLine] = useState(true);
  const [showSignatures, setShowSignatures] = useState(true);

  const [voiceLang, setVoiceLang] = useState<"hi-IN" | "en-IN">("hi-IN");
  const [copied, setCopied] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadSuccessMessage, setUploadSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const documentRef = useRef<HTMLDivElement>(null);

  // Upload Document and Convert to Editable Proforma
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadLoading(true);
    setUploadSuccessMessage(null);

    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("targetType", "enquiry_report");

      const res = await fetch("/api/documents/parse-proforma", {
        method: "POST",
        body: fd,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "दस्तावेज़ प्रोसेस करने में त्रुटि हुई");
      }

      const pData = data.proformaData;
      if (pData) {
        if (pData.headerLeft !== undefined) setHeaderLeft(pData.headerLeft);
        if (pData.headerRight !== undefined) setHeaderRight(pData.headerRight);
        if (pData.subHeaderLeft !== undefined) {
          setSubHeaderLeft(pData.subHeaderLeft);
          setShowSubHeader(Boolean(pData.subHeaderLeft));
        }
        if (pData.title) setTitle(pData.title);
        if (pData.subTitle !== undefined) setSubTitle(pData.subTitle);
        if (Array.isArray(pData.columns)) setColumns(pData.columns);
        if (Array.isArray(pData.rows) && pData.rows.length > 0) {
          setRows(
            pData.rows.map((r: any, idx: number) => ({
              id: r.id || `row_${idx + 1}`,
              label: r.label || `पंक्ति ${idx + 1}`,
              cells: Array.isArray(r.cells) ? r.cells : [r.cells || ""],
            }))
          );
        }
        if (pData.closingLine !== undefined) {
          setClosingLine(pData.closingLine);
          setShowClosingLine(Boolean(pData.closingLine));
        }
        if (pData.officerName) setOfficerName(pData.officerName);
        if (pData.officerRank) setOfficerRank(pData.officerRank);
        if (pData.officerLocation !== undefined) setOfficerLocation(pData.officerLocation);
        if (pData.reportDate) setReportDate(pData.reportDate);
        if (pData.borderStyle) setBorderStyle(pData.borderStyle);

        setUploadSuccessMessage(
          `दस्तावेज़ (${file.name}) सफलतापूर्वक प्रोसेस हुआ! सभी टेबल कॉलम व फील्ड्स सीधे एडिट करें।`
        );
        setTimeout(() => setUploadSuccessMessage(null), 6000);
      }
    } catch (err: any) {
      console.error("Upload parse error:", err);
      alert(`दस्तावेज़ प्रोसेस करने में त्रुटि: ${err.message || "कृपया पुनः प्रयास करें"}`);
    } finally {
      setUploadLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Load complaint if complaintIdParam exists
  useEffect(() => {
    if (!complaintIdParam) return;
    async function loadComplaint() {
      try {
        const found = await ComplaintService.getComplaintById(complaintIdParam!);
        if (found) {
          setComplaint(found);
          const districtName = found.district || currentUser.district || "पानीपत";
          setHeaderRight(`जिला ${districtName}`);
          setTitle(`जांच रिपोर्ट परिवाद नम्बरी ${found.complaintNumber} DT ${new Date().toLocaleDateString("en-GB").replace(/\//g, ".")}`);

          const primaryAccused = found.accusedList?.[0] || {};
          const complainantInfo = `${found.complainantName}${found.complainantFatherSpouse ? ` पुत्र/पत्नी ${found.complainantFatherSpouse}` : ""}${found.complainantAddress ? ` वासी ${found.complainantAddress}` : ""}${found.complainantMobile ? ` (मो0 ${found.complainantMobile})` : ""}`;
          const accusedInfo = `${primaryAccused.name || "अज्ञात"}${primaryAccused.fatherName ? ` पुत्र ${primaryAccused.fatherName}` : ""}${primaryAccused.address ? ` वासी ${primaryAccused.address}` : ""}${primaryAccused.phone ? ` (मो0 ${primaryAccused.phone})` : ""}`;

          setRows((prev) =>
            prev.map((r) => {
              if (r.id === "row_complainant") return { ...r, cells: [complainantInfo] };
              if (r.id === "row_gist") return { ...r, cells: [found.subject || found.complaintDescription || r.cells[0]] };
              if (r.id === "row_accused") return { ...r, cells: [accusedInfo] };
              if (r.id === "row_findings") {
                return {
                  ...r,
                  cells: [
                    `अन्तिम रिपोर्ट (फाइनल रिपोर्ट) तथा की गई कार्यवाही- श्रीमान जी परिवाद नम्बरी ${found.complaintNumber} अजाने ${found.complainantName} की जांच मेरे द्वारा अमल में लाई गई। दौरान जांच परिवाद का अध्ययन किया गया व दोनों पक्षों को शामिल जांच कर पूछताछ की गई...\n\nरिपोर्ट सादर सेवा में प्रस्तुत है।`,
                  ],
                };
              }
              return r;
            })
          );

          if (found.assignedEoName || currentUser.name) {
            setOfficerName(`(${found.assignedEoName || currentUser.name})`);
            setOfficerRank(found.assignedEoRank || currentUser.rankDisplay || "सहायक पुलिस अधीक्षक");
            setOfficerLocation(found.policeStation || `मुख्यालय ${districtName}`);
          }
        }
      } catch (err) {
        console.error("Error loading complaint:", err);
      }
    }
    loadComplaint();
  }, [complaintIdParam]);

  // Switch Format Template
  const handleSelectFormat = (formatKey: EnquiryProformaType) => {
    setActiveFormat(formatKey);
    const tmpl = TEMPLATE_PRESETS[formatKey];
    setHeaderLeft(tmpl.headerLeft);
    setHeaderRight(tmpl.headerRight);
    setSubHeaderLeft(tmpl.subHeaderLeft);
    setTitle(tmpl.title);
    setSubTitle(tmpl.subTitle);
    setColumns(tmpl.columns);
    setRows(tmpl.rows);
    setClosingLine(tmpl.closingLine);
    setOfficerName(tmpl.officerName);
    setOfficerRank(tmpl.officerRank);
    setOfficerLocation(tmpl.officerLocation);
    setShowSubHeader(Boolean(tmpl.subHeaderLeft));
  };

  // Row operations
  const handleUpdateRowLabel = (id: string, newLabel: string) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, label: newLabel } : r)));
  };

  const handleUpdateCell = (rowId: string, cellIndex: number, value: string) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== rowId) return r;
        const newCells = [...r.cells];
        newCells[cellIndex] = value;
        return { ...r, cells: newCells };
      })
    );
  };

  const handleDeleteRow = (id: string) => {
    if (rows.length <= 1) {
      alert("कम से कम एक पंक्ति (Row) अवश्य रहनी चाहिए।");
      return;
    }
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const handleMoveRow = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === rows.length - 1) return;
    const target = direction === "up" ? index - 1 : index + 1;
    const updated = [...rows];
    const temp = updated[index];
    updated[index] = updated[target];
    updated[target] = temp;
    setRows(updated);
  };

  const handleAddRow = (presetLabel?: string, presetValue?: string) => {
    const newId = `row_${Date.now()}`;
    const cellCount = columns.length > 0 ? columns.length : 1;
    const defaultCells = Array(cellCount).fill(presetValue || "");
    const newRow: ProformaRowState = {
      id: newId,
      label: presetLabel || `पंक्ति ${rows.length + 1}`,
      cells: defaultCells,
    };
    setRows((prev) => [...prev, newRow]);
  };

  // Column operations (for multi-column table)
  const handleAddColumn = () => {
    const newColName = prompt("नये कॉलम का शीर्षक (Column Title) दर्ज करें:", `कॉलम ${columns.length + 1}`);
    if (!newColName) return;
    setColumns((prev) => [...prev, newColName]);
    setRows((prev) => prev.map((r) => ({ ...r, cells: [...r.cells, ""] })));
  };

  const handleDeleteColumn = (colIndex: number) => {
    if (columns.length <= 1) {
      alert("कम से कम एक कॉलम अवश्य रहना चाहिए।");
      return;
    }
    if (!confirm(`क्या आप '${columns[colIndex]}' कॉलम को हटाना चाहते हैं?`)) return;
    setColumns((prev) => prev.filter((_, i) => i !== colIndex));
    setRows((prev) =>
      prev.map((r) => ({
        ...r,
        cells: r.cells.filter((_, i) => i !== colIndex),
      }))
    );
  };

  const handleUpdateColumnTitle = (colIndex: number, newTitle: string) => {
    setColumns((prev) => {
      const copy = [...prev];
      copy[colIndex] = newTitle;
      return copy;
    });
  };

  // Construct Data for HTML Generator
  const getProformaData = (): HaryanaPoliceProformaData => ({
    headerLeft: showHeader ? headerLeft : undefined,
    headerRight: showHeader ? headerRight : undefined,
    subHeaderLeft: showSubHeader ? subHeaderLeft : undefined,
    title,
    subTitle: subTitle || undefined,
    columns: columns.length > 0 ? columns : undefined,
    rows: rows.map((r) => ({
      id: r.id,
      label: r.label,
      cells: r.cells,
    })),
    closingLine: showClosingLine ? closingLine : undefined,
    officerName: showSignatures ? officerName : undefined,
    officerRank: showSignatures ? officerRank : undefined,
    officerLocation: showSignatures ? officerLocation : undefined,
    reportDate: showSignatures ? reportDate : undefined,
    borderStyle,
  });

  const handlePrint = () => {
    window.print();
  };

  const handleCopyReport = () => {
    if (!documentRef.current) return;
    const text = documentRef.current.innerText;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadReport = () => {
    const data = getProformaData();
    const html = generateHaryanaPoliceProformaHtml(data);
    const filename = `${(title || "POLICE_ENQUIRY_REPORT").replace(/[\/\\?%*:|"<> ]/g, "_")}.html`;
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

  const handleSaveToComplaint = async () => {
    if (!complaint?.id) return;
    setSaveLoading(true);
    try {
      const data = getProformaData();
      const reportHtml = generateHaryanaPoliceProformaHtml(data);
      const docText = documentRef.current?.innerText || "";
      const reportTitle = `${title} - ${complaint.complaintNumber}`;

      await ComplaintService.addComplaintReport(complaint.id, {
        title: reportTitle,
        reportType: activeFormat,
        reportTypeLabel: TEMPLATE_PRESETS[activeFormat]?.name || "जांच रिपोर्ट",
        dispatchNo: title,
        generatedDate: new Date().toISOString().split("T")[0],
        officerName: officerName || currentUser.name || "जांच अधिकारी",
        officerRank: officerRank || currentUser.rankDisplay || "सहायक पुलिस अधीक्षक",
        officerPno: currentUser.pno || "PNO-23841",
        conclusionSummary: rows[rows.length - 1]?.cells[0]?.substring(0, 200) || "जांच पूर्ण",
        content: docText,
        contentHtml: reportHtml,
        fileName: `${title.replace(/[\/\\?%*:|"<> ]/g, "_")}.html`,
        fileSize: `${Math.round(reportHtml.length / 1024) || 4} KB`,
        fileFormat: "HTML",
        dataUrl: `data:text/html;charset=utf-8,${encodeURIComponent(reportHtml)}`,
        isUploaded: false,
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      console.error("Failed to save report to complaint:", err);
      alert("रिपोर्ट सुरक्षित करने में त्रुटि हुई। कृपया पुनः प्रयास करें।");
    } finally {
      setSaveLoading(false);
    }
  };

  const isMultiCol = columns.length > 0;

  return (
    <div className="space-y-5 animate-in fade-in-50 pb-20">
      {/* ================= 1. TOP HEADER & WORKSPACE TOOLBAR (NO-PRINT) ================= */}
      <div className="no-print space-y-3">
        {/* Navigation & Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                हरियाणा पुलिस आधिकारिक जांच रिपोर्ट प्रपत्र (Exact Police Proforma)
              </span>
              {complaint && (
                <span className="text-[11px] font-bold font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {complaint.complaintNumber}
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-[#0b192c] tracking-tight mt-1 flex items-center gap-2">
              <Shield className="w-6 h-6 text-red-600" />
              <span>पुलिस जांच रिपोर्ट व एनसीआर ड्राफ्ट्स</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              असली पुलिस जांच रिपोर्ट (PDF) के हुबहू प्रपत्र में सीधा संपादन: सभी कॉलम, हेडर, बॉर्डर, विवरण जोड़ें अथवा हटाएं।
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {complaint ? (
              <Link href={`/complaints/${complaint.id}`}>
                <Button variant="outline" size="sm" className="text-xs gap-1.5 border-slate-300">
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>परिवाद प्रोफाइल पर वापस जाएं</span>
                </Button>
              </Link>
            ) : (
              <Link href="/enquiry-workspace">
                <Button variant="outline" size="sm" className="text-xs gap-1.5 border-slate-300">
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>जांच कार्यक्षेत्र</span>
                </Button>
              </Link>
            )}

            {complaint && (
              <Button
                onClick={handleSaveToComplaint}
                disabled={saveLoading}
                variant="primary"
                size="sm"
                className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                {saveSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <span>रिपोर्ट सुरक्षित हुई!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{saveLoading ? "सहेज रहे हैं..." : "परिवाद में सहेजें (Save)"}</span>
                  </>
                )}
              </Button>
            )}

            {/* Upload Document to Draft Button */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".pdf,.png,.jpg,.jpeg,.webp,.txt"
              className="hidden"
            />
            <Button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadLoading}
              variant="outline"
              size="sm"
              className="text-xs font-bold text-indigo-700 bg-indigo-50/80 hover:bg-indigo-100 hover:text-indigo-900 border-indigo-300 flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              {uploadLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                  <span>दस्तावेज़ पढ़ रहे हैं (OCR)...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-3.5 h-3.5 text-indigo-600" />
                  <span>दस्तावेज़ अपलोड करें (Upload Document)</span>
                </>
              )}
            </Button>

            <Button
              onClick={handleDownloadReport}
              variant="outline"
              size="sm"
              className="text-xs font-semibold text-slate-700 hover:text-slate-950 flex items-center gap-1.5 border-slate-300 shadow-2xs"
            >
              <Download className="w-4 h-4 text-blue-700" />
              <span>डाउनलोड (.html)</span>
            </Button>

            <Button
              onClick={handleCopyReport}
              variant="outline"
              size="sm"
              className="text-xs font-semibold text-slate-700 hover:text-slate-950 flex items-center gap-1.5 border-slate-300 shadow-2xs"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? "कॉपी हुआ!" : "कॉपी टेक्स्ट"}</span>
            </Button>

            <Button
              onClick={handlePrint}
              variant="primary"
              size="sm"
              className="bg-[#0b192c] hover:bg-slate-900 text-white flex items-center gap-1.5 shadow-xs font-bold"
            >
              <Printer className="w-4 h-4" />
              <span>प्रिंट (A4 Print)</span>
            </Button>
          </div>
        </div>

        {/* Upload Processing Indicator */}
        {uploadLoading && (
          <div className="p-3 bg-indigo-50 border border-indigo-300 rounded-xl flex items-center gap-2.5 text-xs text-indigo-900 animate-in fade-in-50">
            <Loader2 className="w-4 h-4 text-indigo-600 animate-spin shrink-0" />
            <div>
              <span className="font-bold">AI OCR दस्तावेज़ का विश्लेषण कर रहा है... </span>
              <span className="text-indigo-700">तालिका, कॉलम, हेडर व पूरा मजमून हुबहू निकाला जा रहा है।</span>
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
              बंद करें
            </button>
          </div>
        )}

        {/* Success Alert */}
        {saveSuccess && complaint && (
          <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between text-xs text-emerald-900 animate-in fade-in-50">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              <span className="font-bold">
                जांच रिपोर्ट परिवाद {complaint.complaintNumber} के &ldquo;Reports&rdquo; डॉकेट में सफलतापूर्वक सहेजी गई!
              </span>
            </div>
            <Link
              href={`/complaints/${complaint.id}`}
              className="text-xs font-bold text-emerald-800 underline hover:text-emerald-950"
            >
              रिपोर्ट डॉकेट खोलें &rarr;
            </Link>
          </div>
        )}

        {/* Format Selector Bar (The 4 Real Haryana Police Formats from User's PDFs) */}
        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-red-600" />
              पुलिस जांच प्रारूप चुनें (Select Police Proforma Format):
            </span>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 font-medium">बोलकर लिखें (Voice):</span>
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded border border-slate-200">
                <button
                  type="button"
                  onClick={() => setVoiceLang("hi-IN")}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    voiceLang === "hi-IN" ? "bg-[#0b192c] text-white" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  हिन्दी
                </button>
                <button
                  type="button"
                  onClick={() => setVoiceLang("en-IN")}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    voiceLang === "en-IN" ? "bg-[#0b192c] text-white" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  English
                </button>
              </div>
              <button
                type="button"
                onClick={() => handleSelectFormat(activeFormat)}
                className="px-2 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded text-xs font-semibold flex items-center gap-1"
                title="वर्तमान प्रारूप को मूल रूप में रीसेट करें"
              >
                <RotateCcw className="w-3 h-3 text-slate-500" />
                <span>प्रारूप रीसेट</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {(Object.keys(TEMPLATE_PRESETS) as EnquiryProformaType[]).map((fmtKey) => {
              const tmpl = TEMPLATE_PRESETS[fmtKey];
              const Icon = tmpl.icon;
              const isActive = activeFormat === fmtKey;
              return (
                <button
                  key={fmtKey}
                  type="button"
                  onClick={() => handleSelectFormat(fmtKey)}
                  className={`px-3 py-2.5 rounded-lg text-xs font-bold transition-all flex items-start gap-2.5 border text-left cursor-pointer ${
                    isActive
                      ? "bg-[#0b192c] text-white border-[#0b192c] shadow-xs"
                      : "bg-slate-50/80 text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-950"
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${isActive ? "text-amber-400" : "text-slate-600"}`} />
                  <div>
                    <div className="font-bold leading-tight">{tmpl.name}</div>
                    <div className={`text-[10px] mt-0.5 ${isActive ? "text-slate-300" : "text-slate-500"}`}>
                      {tmpl.badge}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Proforma Customization & Control Toolbar */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-slate-700 flex items-center gap-1">
              <Sliders className="w-3.5 h-3.5 text-blue-600" />
              कस्टमाइज़ेशन टूलबार:
            </span>

            {/* Border Style */}
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded px-2 py-1">
              <span className="text-[11px] text-slate-500 font-medium">बॉर्डर (Border):</span>
              <select
                value={borderStyle}
                onChange={(e) => setBorderStyle(e.target.value as any)}
                className="text-[11px] font-bold bg-transparent border-0 outline-none cursor-pointer text-slate-900"
              >
                <option value="solid">ठोस काला (Solid Black - PDF)</option>
                <option value="double">डबल बॉर्डर (Double)</option>
                <option value="light">हल्का धूसर (Light Gray)</option>
                <option value="none">कोई बॉर्डर नहीं (None)</option>
              </select>
            </div>

            {/* Toggle Header */}
            <button
              type="button"
              onClick={() => setShowHeader(!showHeader)}
              className={`px-2.5 py-1 rounded border text-[11px] font-bold transition-all ${
                showHeader
                  ? "bg-blue-50 text-blue-800 border-blue-200"
                  : "bg-white text-slate-500 border-slate-200"
              }`}
            >
              {showHeader ? "✓ हेडर (पुलिस विभाग) सक्रिय" : "✕ हेडर छिपा हुआ"}
            </button>

            {/* Toggle Sub-Header */}
            <button
              type="button"
              onClick={() => setShowSubHeader(!showSubHeader)}
              className={`px-2.5 py-1 rounded border text-[11px] font-bold transition-all ${
                showSubHeader
                  ? "bg-blue-50 text-blue-800 border-blue-200"
                  : "bg-white text-slate-500 border-slate-200"
              }`}
            >
              {showSubHeader ? "✓ 'श्रीमान जी' सक्रिय" : "✕ 'श्रीमान जी' छिपा हुआ"}
            </button>

            {/* Toggle Signatures */}
            <button
              type="button"
              onClick={() => setShowSignatures(!showSignatures)}
              className={`px-2.5 py-1 rounded border text-[11px] font-bold transition-all ${
                showSignatures
                  ? "bg-blue-50 text-blue-800 border-blue-200"
                  : "bg-white text-slate-500 border-slate-200"
              }`}
            >
              {showSignatures ? "✓ हस्ताक्षर ब्लॉक सक्रिय" : "✕ हस्ताक्षर छिपा हुआ"}
            </button>
          </div>

          {/* Table Row & Column Add Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {isMultiCol && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddColumn}
                className="text-xs bg-white hover:bg-slate-100 text-blue-700 font-bold border-blue-200"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ नया कॉलम जोड़ें (Add Column)</span>
              </Button>
            )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleAddRow()}
              className="text-xs bg-white hover:bg-slate-100 text-emerald-700 font-bold border-emerald-200"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ नई पंक्ति जोड़ें (Add Row)</span>
            </Button>
          </div>
        </div>
      </div>

      {/* ================= 2. THE DOCUMENT SHEET (EXACT HARYANA POLICE A4 PROFORMA) ================= */}
      <div className="w-full max-w-4xl mx-auto space-y-4">
        <div
          ref={documentRef}
          className="bg-white border-2 border-slate-300 rounded-2xl p-6 sm:p-14 shadow-lg text-black font-sans transition-all space-y-4"
          style={{
            minHeight: "1050px",
            lineHeight: "1.65",
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", "Mangal", "Nirmala UI", Roboto, sans-serif',
          }}
        >
          {/* Header Row: Top Left (पुलिस विभाग) & Top Right (जिला पानीपत) */}
          {showHeader && (
            <div className="flex items-center justify-between text-sm sm:text-base font-bold pb-2 border-b border-transparent">
              <div className="flex items-center gap-1 group relative">
                <input
                  type="text"
                  value={headerLeft}
                  onChange={(e) => setHeaderLeft(e.target.value)}
                  className="font-bold text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent hover:border-slate-300 focus:border-blue-500 rounded px-1.5 py-0.5 text-sm sm:text-base"
                  placeholder="पुलिस विभाग"
                />
                <button
                  type="button"
                  onClick={() => setHeaderLeft("")}
                  className="no-print opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 text-xs"
                  title="हेडर हटाएं"
                >
                  ✕
                </button>
              </div>

              <div className="flex items-center gap-1 group relative">
                <input
                  type="text"
                  value={headerRight}
                  onChange={(e) => setHeaderRight(e.target.value)}
                  className="font-bold text-slate-950 text-right bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent hover:border-slate-300 focus:border-blue-500 rounded px-1.5 py-0.5 text-sm sm:text-base"
                  placeholder="जिला पानीपत"
                />
                <button
                  type="button"
                  onClick={() => setHeaderRight("")}
                  className="no-print opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 text-xs"
                  title="जिला हटाएं"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Sub Header: 'श्रीमान जी' */}
          {showSubHeader && subHeaderLeft && (
            <div className="pt-1 flex items-center gap-1 group">
              <input
                type="text"
                value={subHeaderLeft}
                onChange={(e) => setSubHeaderLeft(e.target.value)}
                className="font-bold text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent hover:border-slate-300 focus:border-blue-500 rounded px-1.5 py-0.5 text-sm sm:text-base w-40"
              />
              <button
                type="button"
                onClick={() => setSubHeaderLeft("")}
                className="no-print opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 text-xs"
                title="हटाएं"
              >
                ✕
              </button>
            </div>
          )}

          {/* Report Title Center (उदा: जांच रिपोर्ट परिवाद नम्बरी 128-SPL-III DT 10.02.2026) */}
          <div className="my-2 text-center space-y-1">
            <div className="relative group">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-center text-sm sm:text-base font-black tracking-wide text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent hover:border-slate-300 focus:border-blue-500 rounded px-2 py-1"
                placeholder="जांच रिपोर्ट परिवाद नम्बरी..."
              />
            </div>

            {subTitle !== undefined && (
              <div className="relative group">
                <input
                  type="text"
                  value={subTitle}
                  onChange={(e) => setSubTitle(e.target.value)}
                  className="w-full text-center text-xs sm:text-sm font-bold text-slate-800 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent hover:border-slate-300 focus:border-blue-500 rounded px-2 py-0.5"
                  placeholder="परिवाद की जांच रिपोर्ट इस प्रकार है -"
                />
              </div>
            )}
          </div>

          {/* ================= THE OFFICIAL PROFORMA TABLE ================= */}
          <div className="pt-1">
            <table
              className="w-full border-collapse"
              style={{
                border:
                  borderStyle === "none"
                    ? "none"
                    : borderStyle === "light"
                    ? "1px solid #cbd5e1"
                    : borderStyle === "double"
                    ? "3px double #000000"
                    : "1.5px solid #000000",
              }}
            >
              {/* Optional Table Header (Multi-Column Format - PDF 3) */}
              {isMultiCol && (
                <thead>
                  <tr className="bg-slate-50/80">
                    {columns.map((colTitle, colIdx) => (
                      <th
                        key={colIdx}
                        className="p-2 sm:p-2.5 text-left text-xs sm:text-sm font-black text-black align-top relative group"
                        style={{
                          border:
                            borderStyle === "none"
                              ? "none"
                              : borderStyle === "light"
                              ? "1px solid #cbd5e1"
                              : "1.5px solid #000000",
                        }}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <textarea
                            rows={2}
                            value={colTitle}
                            onChange={(e) => handleUpdateColumnTitle(colIdx, e.target.value)}
                            className="w-full font-black text-xs sm:text-sm bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-slate-300 focus:border-blue-500 rounded p-1 leading-snug resize-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleDeleteColumn(colIdx)}
                            className="no-print opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-600 p-0.5 text-[10px]"
                            title="इस कॉलम को हटाएं"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
              )}

              {/* Table Body Rows */}
              <tbody>
                {rows.map((row, rowIdx) => (
                  <tr key={row.id} className="group/row">
                    {/* If Multi-Column (like PDF 3) */}
                    {isMultiCol ? (
                      columns.map((_, colIdx) => (
                        <td
                          key={colIdx}
                          className="p-2 sm:p-2.5 text-xs sm:text-sm text-black align-top relative"
                          style={{
                            border:
                              borderStyle === "none"
                                ? "none"
                                : borderStyle === "light"
                                ? "1px solid #cbd5e1"
                                : "1.5px solid #000000",
                          }}
                        >
                          <div className="relative">
                            <textarea
                              rows={Math.max(4, Math.min(18, (row.cells[colIdx]?.match(/\n/g) || []).length + 3))}
                              value={row.cells[colIdx] || ""}
                              onChange={(e) => handleUpdateCell(row.id, colIdx, e.target.value)}
                              className="w-full text-xs sm:text-sm text-black bg-transparent hover:bg-slate-50/50 focus:bg-white border border-transparent hover:border-slate-300 focus:border-blue-500 rounded p-1.5 leading-relaxed font-sans focus:outline-none"
                              placeholder="विवरण दर्ज करें..."
                            />

                            {/* Cell Voice Button */}
                            <div className="no-print absolute top-1 right-1 opacity-0 group-hover/row:opacity-100 transition-opacity">
                              <VoiceInputButton
                                preferredLang={voiceLang}
                                fieldLabel={`कॉलम ${colIdx + 1}`}
                                currentValue={row.cells[colIdx] || ""}
                                onTranscript={(val) => handleUpdateCell(row.id, colIdx, val)}
                              />
                            </div>
                          </div>

                          {/* Row Controls on Last Column */}
                          {colIdx === columns.length - 1 && (
                            <div className="no-print absolute -right-9 top-2 flex flex-col gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity">
                              <button
                                type="button"
                                disabled={rowIdx === 0}
                                onClick={() => handleMoveRow(rowIdx, "up")}
                                className="p-1 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 disabled:opacity-20 shadow-xs"
                                title="ऊपर ले जाएं"
                              >
                                <ChevronUp className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                disabled={rowIdx === rows.length - 1}
                                onClick={() => handleMoveRow(rowIdx, "down")}
                                className="p-1 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 disabled:opacity-20 shadow-xs"
                                title="नीचे ले जाएं"
                              >
                                <ChevronDown className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteRow(row.id)}
                                className="p-1 rounded bg-white hover:bg-red-50 border border-slate-200 text-slate-400 hover:text-red-600 shadow-xs"
                                title="पंक्ति हटाएं"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </td>
                      ))
                    ) : (
                      /* Standard 2-Column Official Proforma (like PDF 1, 2, 5) */
                      <>
                        {/* Col 1: Label / शीर्षक (उदा: परिवादी, परिवाद का सार, उत्तरवादी का विवरण, जांच की स्थिती का विवरण) */}
                        <td
                          className="w-32 sm:w-44 p-2 sm:p-2.5 text-xs sm:text-sm font-black text-black align-top relative group"
                          style={{
                            border:
                              borderStyle === "none"
                                ? "none"
                                : borderStyle === "light"
                                ? "1px solid #cbd5e1"
                                : "1.5px solid #000000",
                          }}
                        >
                          <div className="flex items-start justify-between gap-1">
                            <input
                              type="text"
                              value={row.label}
                              onChange={(e) => handleUpdateRowLabel(row.id, e.target.value)}
                              className="w-full font-black text-xs sm:text-sm text-black bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent hover:border-slate-300 focus:border-blue-500 rounded px-1.5 py-0.5"
                              placeholder="लेबल"
                            />
                          </div>

                          {/* Row Position and Reorder */}
                          <div className="no-print absolute -left-7 top-2 flex flex-col gap-0.5 opacity-0 group-hover/row:opacity-100 transition-opacity">
                            <button
                              type="button"
                              disabled={rowIdx === 0}
                              onClick={() => handleMoveRow(rowIdx, "up")}
                              className="p-0.5 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 disabled:opacity-20"
                              title="ऊपर ले जाएं"
                            >
                              <ChevronUp className="w-2.5 h-2.5" />
                            </button>
                            <button
                              type="button"
                              disabled={rowIdx === rows.length - 1}
                              onClick={() => handleMoveRow(rowIdx, "down")}
                              className="p-0.5 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 disabled:opacity-20"
                              title="नीचे ले जाएं"
                            >
                              <ChevronDown className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        </td>

                        {/* Col 2: Value / विस्तृत विवरण */}
                        <td
                          className="p-2 sm:p-2.5 text-xs sm:text-sm text-black align-top relative"
                          style={{
                            border:
                              borderStyle === "none"
                                ? "none"
                                : borderStyle === "light"
                                ? "1px solid #cbd5e1"
                                : "1.5px solid #000000",
                          }}
                        >
                          <div className="relative">
                            <textarea
                              rows={Math.max(2, Math.min(18, (row.cells[0]?.match(/\n/g) || []).length + 2))}
                              value={row.cells[0] || ""}
                              onChange={(e) => handleUpdateCell(row.id, 0, e.target.value)}
                              className="w-full text-xs sm:text-sm text-black bg-transparent hover:bg-slate-50/50 focus:bg-white border border-transparent hover:border-slate-300 focus:border-blue-500 rounded p-1.5 leading-relaxed font-sans focus:outline-none"
                              placeholder="विवरण दर्ज करें..."
                            />

                            {/* Voice Button & Delete Row Button */}
                            <div className="no-print absolute top-1 right-1 flex items-center gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity">
                              <VoiceInputButton
                                preferredLang={voiceLang}
                                fieldLabel={row.label}
                                currentValue={row.cells[0] || ""}
                                onTranscript={(val) => handleUpdateCell(row.id, 0, val)}
                              />
                              <button
                                type="button"
                                onClick={() => handleDeleteRow(row.id)}
                                className="p-1 rounded bg-white hover:bg-red-50 border border-slate-200 text-slate-400 hover:text-red-600 shadow-2xs"
                                title="यह पंक्ति हटाएं"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Preset Quick Row Adders (No-print) */}
          <div className="no-print pt-2 pb-1 border-t border-dashed border-slate-300 flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase mr-1">
              + त्वरित पंक्ति जोड़ें:
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                handleAddRow(
                  "गवाहों के बयान",
                  "1. गवाह श्री ... वासी ... के बयान अंकित किए गए।\n2. मौके के स्वतंत्र गवाह श्री ... ने बयान दिया कि ..."
                )
              }
              className="text-[11px] h-7 bg-white hover:bg-slate-100 text-slate-700"
            >
              + गवाहों के बयान
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                handleAddRow(
                  "मौका मुआयना व पंचनामा",
                  "दिनांक ... को मौका पर जाकर स्वतंत्र पंच गवाहों की मौजूदगी में मुआयना किया गया। मौके पर पाई गई स्थिति: ..."
                )
              }
              className="text-[11px] h-7 bg-white hover:bg-slate-100 text-slate-700"
            >
              + मौका मुआयना
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                handleAddRow(
                  "राजीनामा व समझौता",
                  "दोनों पक्षों ने आपसी रजामंदी से मौजिज व्यक्तियों के समक्ष समझौता कर लिया है। किसी पक्ष को कोई शिकायत शेष नहीं है।"
                )
              }
              className="text-[11px] h-7 bg-white hover:bg-slate-100 text-slate-700"
            >
              + राजीनामा
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                handleAddRow(
                  "दस्तावेजी साक्ष्य",
                  "1. बैंक खाता विवरण एवं लेन-देन रसीद\n2. शिकायतकर्ता द्वारा प्रस्तुत मूल साक्ष्य प्रति"
                )
              }
              className="text-[11px] h-7 bg-white hover:bg-slate-100 text-slate-700"
            >
              + दस्तावेजी साक्ष्य
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleAddRow()}
              className="text-[11px] h-7 bg-[#0b192c] text-white hover:bg-slate-800 font-bold"
            >
              + कस्टम पंक्ति (Add Row)
            </Button>
          </div>

          {/* Closing Line: 'रिपोर्ट सेवा में पेश है।' */}
          {showClosingLine && (
            <div className="pt-2 flex items-center justify-between text-sm sm:text-base font-bold">
              <div className="flex items-center gap-1 group">
                <input
                  type="text"
                  value={closingLine}
                  onChange={(e) => setClosingLine(e.target.value)}
                  className="font-bold text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent hover:border-slate-300 focus:border-blue-500 rounded px-1.5 py-0.5 text-sm sm:text-base w-72"
                  placeholder="रिपोर्ट सेवा में पेश है।"
                />
                <button
                  type="button"
                  onClick={() => setShowClosingLine(false)}
                  className="no-print opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 text-xs"
                  title="हटाएं"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* ================= OFFICER SIGNATURE & SEAL BLOCK (RIGHT-ALIGNED) ================= */}
          {showSignatures && (
            <div className="pt-6 flex justify-end">
              <div className="w-64 text-right space-y-1">
                {/* Hand Signature Stamp Placeholder */}
                <div className="h-12 flex items-end justify-end pb-1 pr-4">
                  <svg width="120" height="38" viewBox="0 0 120 38" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M10 28C25 12 45 6 70 18C90 26 85 8 110 10"
                      stroke="#1e293b"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>

                <input
                  type="text"
                  value={officerName}
                  onChange={(e) => setOfficerName(e.target.value)}
                  className="w-full text-right font-black text-slate-950 text-sm sm:text-base bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent hover:border-slate-300 focus:border-blue-500 rounded px-1.5 py-0.5"
                  placeholder="(सतीश कुमार ह.पु.से.)"
                />

                <input
                  type="text"
                  value={officerRank}
                  onChange={(e) => setOfficerRank(e.target.value)}
                  className="w-full text-right font-bold text-slate-900 text-xs sm:text-sm bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent hover:border-slate-300 focus:border-blue-500 rounded px-1.5 py-0.5"
                  placeholder="उप पुलिस अधीक्षक"
                />

                {officerLocation && (
                  <input
                    type="text"
                    value={officerLocation}
                    onChange={(e) => setOfficerLocation(e.target.value)}
                    className="w-full text-right font-medium text-slate-800 text-xs sm:text-sm bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent hover:border-slate-300 focus:border-blue-500 rounded px-1.5 py-0.5"
                    placeholder="मुख्यालय पानीपत"
                  />
                )}

                <input
                  type="text"
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                  className="w-full text-right font-bold text-slate-900 text-xs sm:text-sm bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent hover:border-slate-300 focus:border-blue-500 rounded px-1.5 py-0.5"
                  placeholder="दिनांक 17.03.2026"
                />
              </div>
            </div>
          )}
        </div>

        {/* Bottom Floating Save Action if complaint linked */}
        {complaint && (
          <div className="no-print p-4 bg-white border border-slate-200 rounded-xl shadow-md flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-emerald-600" />
              <div>
                <p className="text-xs font-bold text-slate-900">
                  परिवाद {complaint.complaintNumber} के साथ इस जांच रिपोर्ट को लिंक करें?
                </p>
                <p className="text-[11px] text-slate-500">
                  सहेजने पर यह असली पुलिस प्रपत्र परिवाद प्रोफाइल के &ldquo;Reports&rdquo; डॉकेट में लाइव सुरक्षित हो जाएगा।
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link href={`/complaints/${complaint.id}`}>
                <Button variant="outline" size="sm" className="text-xs">
                  वापस जाएं
                </Button>
              </Link>
              <Button
                onClick={handleSaveToComplaint}
                disabled={saveLoading}
                variant="primary"
                size="sm"
                className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5"
              >
                {saveSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <span>सहेजा गया!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{saveLoading ? "सहेज रहे हैं..." : "रिपोर्ट सहेजें"}</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function EnquiryDraftsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs text-slate-500">
          पुलिस जांच रिपोर्ट व एनसीआर ड्राफ्ट लोड हो रहा है...
        </div>
      }
    >
      <EnquiryDraftsContent />
    </Suspense>
  );
}
