export interface WebsiteRouteInfo {
  path: string;
  title: string;
  category: "General Diary" | "Complaints" | "FIR & Investigation" | "Enquiry" | "Legal & Reference" | "Administration" | "Prosecution" | "Intelligence" | "Supervision";
  description: string;
  supportedActions: string[];
  requiredRoles?: string[];
  primaryApis: string[];
  databaseEntities: string[];
}

export interface ModuleDefinition {
  id: string;
  title: string;
  titleHi: string;
  path: string;
  category: "General Diary" | "Complaints" | "FIR & Investigation" | "Enquiry" | "Legal & Reference" | "Administration" | "Prosecution" | "Intelligence" | "Supervision";
  description: string;
  aliases: string[];
  subRoutes?: Array<{
    path: string;
    title: string;
    description: string;
    aliases: string[];
    supportedActions: string[];
  }>;
  supportedActions: string[];
  primaryApis: string[];
  databaseEntities: string[];
}

/**
 * 8 Core Operational Modules of Haryana Police CMS
 * Fully registered with Hindi/English aliases, sub-routes, and system capabilities.
 */
export const CORE_POLICE_MODULES: ModuleDefinition[] = [
  {
    id: "COMPLAINTS",
    title: "Citizen Complaints & Enquiry Desk",
    titleHi: "शिकायत रजिस्टर एवं जांच कार्यक्षेत्र",
    path: "/complaints",
    category: "Complaints",
    description: "नागरिक दरख्वास्त, शिकायत पंजीकरण, जांच अधिकारी (EO) असाइनमेंट, धारा 174 BNSS गैर-संज्ञेय रिपोर्ट व जांच आख्या।",
    aliases: ["complaint", "complaints", "shikayat", "शिकायत", "दरख्वास्त", "citizen complaint", "enquiry desk", "जांच डेस्क"],
    subRoutes: [
      {
        path: "/complaints/register",
        title: "नई शिकायत पंजीकरण (New Complaint Registration)",
        description: "नागरिक की नई शिकायत दर्ज करने का फॉर्म व साक्ष्य अपलोड।",
        aliases: ["register complaint", "nayi shikayat", "नई शिकायत", "darj complaint", "complaint form"],
        supportedActions: ["नई शिकायत दर्ज करना", "साक्ष्य संलग्न करना", "रसीद निर्गत करना"],
      },
      {
        path: "/enquiry-workspace/drafts",
        title: "जांच पत्रावली एवं आख्या ड्राफ्ट्स (Enquiry Reports & Drafts)",
        description: "जांच अधिकारी द्वारा तैयार की जा रही जांच रिपोर्ट एवं निष्कर्ष।",
        aliases: ["enquiry draft", "janch aakhya", "जांच आख्या", "enquiry workspace"],
        supportedActions: ["जांच रिपोर्ट ड्राफ्ट करना", "निष्कर्ष जोड़ना"],
      },
      {
        path: "/enquiry-workspace/ncr",
        title: "असंज्ञेय रिपोर्ट (Non-Cognizable Report NCR - 174 BNSS)",
        description: "धारा 174 BNSS के अंतर्गत असंज्ञेय अपराधों का पंजीकरण व न्यायालय प्रेषण।",
        aliases: ["ncr", "asangey", "असंज्ञेय", "174 bnss", "ncr form"],
        supportedActions: ["NCR दर्ज करना", "A4 प्रपत्र प्रिंट करना"],
      },
    ],
    supportedActions: ["शिकायत खोजना", "नई शिकायत दर्ज करना", "EO असाइन करना", "स्टेटस फिल्टर करना"],
    primaryApis: ["/api/complaints", "/api/complaints/summary"],
    databaseEntities: ["Complaint"],
  },
  {
    id: "ROZNAMCHA",
    title: "Smart General Diary (Roznamcha Aam)",
    titleHi: "स्मार्ट रोजनामचा आम (दैनिक डिजिटल डायरी)",
    path: "/general-diary",
    category: "General Diary",
    description: "थाने का 24x7 वैधानिक डिजिटल रोजनामचा (PPR 22.48 / BNSS)। पक्की लॉक्ड रपटें एवं AI ऑटो-सुझाव ड्राफ्ट्स।",
    aliases: ["general diary", "roznamcha", "रोजनामचा", "रपट", "gd", "gd register", "mhc desk", "मुंशी रोजनामचा"],
    subRoutes: [
      {
        path: "/general-diary/new",
        title: "नया रोजनामचा इंद्राज (New GD Entry Form)",
        description: "54 वैधानिक श्रेणियों में नया GD इंद्राज करने का फॉर्म।",
        aliases: ["new gd", "nayi rapat", "नया रोजनामचा", "gd form", "gd entry"],
        supportedActions: ["रपट दर्ज करना", "वॉयस से लिखना", "अधिकारी व गवाह चुनना"],
      },
      {
        path: "/general-diary?tab=SUGGESTIONS_DRAFTS",
        title: "रोजनामचा ऑटो-सुझाव व ड्राफ्ट्स (Smart GD Suggestions)",
        description: "सिस्टम इवेंट्स एवं केस गतिविधियों से स्वतः उत्पन्न रपटें जिन्हें MHC वेरीफाई व लॉक करता है।",
        aliases: ["gd suggestion", "gd draft", "सुझाव रपट", "auto rapat", "drafts tab"],
        supportedActions: ["Verify & Lock", "ड्राफ्ट एडिट करना", "ड्राफ्ट खारिज करना"],
      },
    ],
    supportedActions: ["रपट खोजना", "नया इंद्राज करना", "सुझाव वेरीफाई करना", "A4 दैनिक डायरी प्रिंट"],
    primaryApis: ["/api/general-diary", "/api/general-diary/extract"],
    databaseEntities: ["GDRecord", "GeneralDiaryEntry"],
  },
  {
    id: "FIR",
    title: "FIR & Investigation Suite",
    titleHi: "प्राथमिकी (FIR) एवं अनुसंधान कार्यक्षेत्र",
    path: "/fir",
    category: "FIR & Investigation",
    description: "प्रथम सूचना रिपोर्ट पंजीकरण, केस विश्लेषण, अभियुक्त गिरफ़्तारी 6-प्रपत्र मुसन्ना, केस डायरी (ज़िमनी) व कलंदरा।",
    aliases: ["fir", "firs", "mukaddma", "मुकदमा", "मुकद्दमा", "investigation", "तफ्तीश", "अनुसंधान"],
    subRoutes: [
      {
        path: "/fir/register",
        title: "नई प्राथमिकी पंजीकरण (New FIR Registration Form)",
        description: "विस्तृत BNS/BNSS धाराओं सहित नई FIR पंजीकरण फॉर्म।",
        aliases: ["new fir", "nayi fir", "नई प्राथमिकी", "fir form", "fir darj"],
        supportedActions: ["FIR दर्ज करना", "धाराएं जोड़ना", "आरोपी व गवाह विवरण"],
      },
      {
        path: "/fir-workspace/arrest-docs",
        title: "गिरफ़्तारी प्रपत्र 26.8 एवं मुसन्ना (Arrest Dossier Suite)",
        description: "धारा 35(3) BNSS, गिरफ़्तारी मेमो, मेडिकल मेमो, जामातालाशी व कानूनी सहायता प्रपत्र।",
        aliases: ["arrest docs", "girftari memo", "गिरफ़्तारी", "jamatalashi", "26.8", "arrest dossier"],
        supportedActions: ["6 प्रपत्र तैयार करना", "A4 प्रिंट", "GD दाखिला सुझाव भेजना"],
      },
      {
        path: "/fir-workspace/zimni",
        title: "केस डायरी ज़िमनी (Case Diary Zimni - 192 BNSS)",
        description: "दैनिक तफ्तीश पर्चा, गवाहां बयान (180 BNSS), नक्शा मौका व विवेचना विवरण।",
        aliases: ["zimni", "case diary", "ज़िमनी", "parcha", "तफ्तीश पर्चा", "192 bnss"],
        supportedActions: ["ज़िमनी लिखना", "बयान जोड़ना", "निरीक्षण विवरण"],
      },
      {
        path: "/fir-workspace/kalandra",
        title: "कलंदरा वर्कस्पेस (Kalandra Preparation Suite)",
        description: "107/151, 107/150, 217/248 BNS विनियामक कलंदरा एवं न्यायालय अग्रेषण पत्रावली।",
        aliases: ["kalandra", "कलंदरा", "107/151", "107 151", "preventive action"],
        supportedActions: ["कलंदरा तैयार करना", "न्यायालय पैकेज प्रिंट"],
      },
    ],
    supportedActions: ["FIR खोजना", "केस प्रोफाइल खोलना", "गिरफ़्तारी प्रपत्र बनाना", "ज़िमनी दर्ज करना"],
    primaryApis: ["/api/fir", "/api/fir/records", "/api/fir/accused-chargesheet"],
    databaseEntities: ["FIRItem", "FIRRecord"],
  },
  {
    id: "REGISTRATIONS",
    title: "Police Special Registrations",
    titleHi: "विशेष पंजीकरण रजिस्टर (UIDB / गुमशुदगी / संपत्ति)",
    path: "/registrations",
    category: "General Diary",
    description: "लावारिस लाश (UIDB), गुमशुदा व्यक्ति (Missing Person), पशु गुमशुदगी (Missing Cattle) व खोया सामान (Lost Property)।",
    aliases: ["registrations", "registration", "पंजीकरण", "uidb", "ud", "missing person", "गुमशुदा", "लापता", "missing cattle", "पशु गुमशुदगी", "lost property", "खोया सामान", "लावारिस लाश"],
    supportedActions: ["UIDB रिकॉर्ड खोजना", "गुमशुदा व्यक्ति खोजना", "खोया सामान दर्ज करना", "क्षेत्राधिकार फिल्टर"],
    primaryApis: ["/api/general-diary"],
    databaseEntities: ["GDRecord"],
  },
  {
    id: "REPORTS",
    title: "Executive Reports & Briefings",
    titleHi: "उच्चाधिकारी रिपोर्ट एवं दैनिक ब्रीफिंग",
    path: "/reports",
    category: "Supervision",
    description: "IGP/SP उच्चाधिकारी दैनिक ब्रीफिंग, साप्ताहिक डायरी (Weekly Diary Workbook) व थाने के समग्र सांख्यिकीय आंकड़े।",
    aliases: ["report", "reports", "रिपोर्ट", "igp briefing", "आईजीपी ब्रीफिंग", "weekly diary", "साप्ताहिक डायरी", "statistics", "आंकड़े"],
    supportedActions: ["IGP ब्रीफिंग जनरेट करना", "साप्ताहिक डायरी देखना", "अपराध समीक्षा डाउनलोड"],
    primaryApis: ["/api/reports/igp-briefing", "/api/reports/weekly-diary"],
    databaseEntities: ["GDRecord", "FIRItem", "Complaint"],
  },
  {
    id: "PROSECUTION",
    title: "Prosecution & Court Management",
    titleHi: "अभियोजन एवं न्यायालय कार्यप्रणाली",
    path: "/prosecution",
    category: "Prosecution",
    description: "अदालत में प्रस्तुत किए जाने वाले जवाब, जमानत आपत्ति (Bail Reply), स्टेटस रिपोर्ट, हलफनामा व केस स्क्रूटनी।",
    aliases: ["prosecution", "अभियोजन", "court", "अदालत", "court affidavit", "हलफनामा", "bail reply", "जमानत जवाब", "status report", "scrutiny", "स्क्रूटनी"],
    supportedActions: ["जमानत जवाब तैयार करना", "हलफनामा जनरेट करना", "केस स्क्रूटनी देखना", "अदालती तारीख ट्रैक करना"],
    primaryApis: ["/api/prosecution/court-affidavits", "/api/prosecution/scrutiny"],
    databaseEntities: ["BailReplyRecord", "CourtStatusReportRecord"],
  },
  {
    id: "TELECOM",
    title: "Telecom CDR & Tower Intelligence",
    titleHi: "दूरसंचार सीडीआर एवं टावर विश्लेषण",
    path: "/telecom",
    category: "Intelligence",
    description: "कॉल डिटेल रिकॉर्ड (CDR), आईपी डिटेल (IPDR), टावर डंप विश्लेषण, आईएमईआई ट्रैकिंग व संदिग्ध मोबाइल सहसंबंध।",
    aliases: ["telecom", "दूरसंचार", "cdr", "ipdr", "tower dump", "कॉल डिटेल", "टावर डंप", "suspect tracking", "cell id", "imei"],
    supportedActions: ["CDR अपलोड व विश्लेषण", "टावर डंप मैचिंग", "कॉमन नंबर सर्च", "फाइंडिंग रिपोर्ट डाउनलोड"],
    primaryApis: ["/api/telecom", "/api/telecom/finding"],
    databaseEntities: ["TelecomFinding"],
  },
  {
    id: "AUDITS",
    title: "Audits & Inspection Console",
    titleHi: "ऑडिट, निरीक्षण एवं केस पेंडेंसी समीक्षा",
    path: "/audits",
    category: "Supervision",
    description: "समस्त केसों की समय-सीमा पेंडेंसी, अधिकारी कार्यभार, डेटा विसंगतियां, निरीक्षण सत्र व प्रमाणित CSV/XLSX रिपोर्ट।",
    aliases: ["audit", "audits", "inspection", "ऑडिट", "निरीक्षण", "case pendency", "pendency", "पेंडेंसी", "लंबित मामले", "officer workload", "discrepancies", "inspection session"],
    supportedActions: ["पेंडेंसी ऑडिट देखना", "कार्यभार समीक्षा", "विसंगतियां खोजना", "निरीक्षण सत्र फाइनल करना", "एक्सेल/पीडीएफ निर्यात"],
    primaryApis: ["/api/audits"],
    databaseEntities: ["AuditSnapshot", "AuditRequirement"],
  },
  {
    id: "MALKHANA",
    title: "Malkhana & Seized Property Ledger",
    titleHi: "मालखाना रजिस्टर एवं ज़ब्त संपत्ति",
    path: "/malkhana",
    category: "General Diary",
    description: "मुद्द नंबर (Mud No.) रजिस्टर, सील-बंद हथियार, एनडीपीएस माल, ज़ब्त वाहन, मालखाना इंद्राज व कोर्ट निस्तारण।",
    aliases: ["malkhana", "मालखाना", "मुद्द नंबर", "mud no", "seized property", "जब्त संपत्ति", "case property", "मुद संख्या"],
    supportedActions: ["मुद्द नंबर दर्ज करना", "मालखाना रजिस्टर देखना", "कोर्ट डिस्पोज़ल ट्रैक करना"],
    primaryApis: ["/api/general-diary"],
    databaseEntities: ["MalkhanaRecord"],
  },
  {
    id: "SUMMONS_WARRANTS",
    title: "Summons & Warrants Tracking Desk",
    titleHi: "समन व गैर-जमानती वारंट तामील डेस्क",
    path: "/summons-warrants",
    category: "Prosecution",
    description: "जमानती वारंट (BW), गैर-जमानती वारंट (NBW), धारा 84/85 BNSS भगोड़ा उद्घोषणा, कुर्की व समन तामील रिपोर्ट।",
    aliases: ["summons", "warrants", "समन", "वारंट", "गैर जमानती वारंट", "nbw", "bailable warrant", "proclamation", "कुर्की", "84 bnss", "85 bnss"],
    supportedActions: ["समन तामील दर्ज करना", "NBW सूची देखना", "कुर्की आदेश ट्रैक करना"],
    primaryApis: ["/api/prosecution"],
    databaseEntities: ["WarrantRecord"],
  },
  {
    id: "CHARGESHEET",
    title: "Chargesheet & Final Form Generator",
    titleHi: "मुकम्मल चालान / चार्जशीट जनरेटर (धारा 193 BNSS)",
    path: "/fir-workspace/chargesheet",
    category: "FIR & Investigation",
    description: "7-खंडीय मुकम्मल अभियोग पत्र (Chargesheet), गवाहान फेहरिस्त, दस्तावेजी साक्ष्य सूची व एफएसएल लिंकिंग।",
    aliases: ["chargesheet", "चार्जशीट", "चालान", "अभियोग पत्र", "193 bnss", "final report", "173 crpc", "chalan"],
    supportedActions: ["चार्जशीट ड्राफ्ट करना", "स्क्रूटनी चेक करना", "कोर्ट चालान A4 प्रिंट"],
    primaryApis: ["/api/fir/final-reports", "/api/fir"],
    databaseEntities: ["FIRItem", "FinalReportRecord"],
  },
  {
    id: "CYBER_CELL",
    title: "Cyber Crime & Mule Account Desk",
    titleHi: "साइबर अपराध एवं म्यूल बैंक खाता अन्वेषण",
    path: "/cyber-cell",
    category: "Intelligence",
    description: "1930 हेल्पलाइन पोर्टल, म्यूल खाते, धारा 106 BNSS बैंक फ्रीजिंग नोटिस, आईएमईआई ब्लैकलिस्टिंग व डिजिटल साक्ष्य।",
    aliases: ["cyber cell", "साइबर सेल", "1930 portal", "mule account", "म्यूल अकाउंट", "online fraud", "डिजिटल फ्रॉड", "106 bnss", "cyber crime"],
    supportedActions: ["बैंक फ्रीजिंग नोटिस", "म्यूल खाता खोजना", "फिशिंग लिंक रिपोर्ट"],
    primaryApis: ["/api/telecom"],
    databaseEntities: ["CyberIncident"],
  },
  {
    id: "CRIME_INTELLIGENCE",
    title: "Crime Intelligence & History Sheeters",
    titleHi: "ग्राम अपराध पुस्तिका एवं हिस्ट्री-शीटर निगरानी",
    path: "/crime-intelligence",
    category: "Supervision",
    description: "थाना रजिस्टर नंबर 9 (Village Crime Diary) व रजिस्टर नंबर 10 (Bad Characters), पैरोल जंपर्स व बीट निगरानी।",
    aliases: ["crime intelligence", "अपराध इंटेलिजेंस", "history sheeter", "हिस्ट्री शीटर", "register 9", "register 10", "ग्राम अपराध", "bad characters", "bc register"],
    supportedActions: ["हिस्ट्री-शीटर प्रोफाइल", "बीट गश्त रूट मैप", "पैरोल ट्रैकर"],
    primaryApis: ["/api/users"],
    databaseEntities: ["HistorySheeterRecord"],
  },
];

/**
 * Utility / Common Routes
 */
export const UTILITY_MODULES: WebsiteRouteInfo[] = [
  {
    path: "/",
    title: "मुख्य डैशबोर्ड (Home Dashboard)",
    category: "Administration",
    description: "थाने का मुख्य सारांश डैशबोर्ड - दैनिक आंकड़े, लंबित केस, आज की रवानगी/वापसी व त्वरित लिंक्स।",
    supportedActions: ["दैनिक आंकड़े देखना", "त्वरित मॉड्यूल्स में जाना", "अलर्ट्स चेक करना"],
    primaryApis: ["/api/general-diary", "/api/complaints", "/api/fir"],
    databaseEntities: ["GDRecord", "Complaint", "FIRItem"],
  },
  {
    path: "/acts-sections",
    title: "कानूनी धाराएं व अधिनियम (Acts & Sections Explorer)",
    category: "Legal & Reference",
    description: "BNS, BNSS, BSA व विशेष अधिनियमों का संपूर्ण कानूनी संदर्भ।",
    supportedActions: ["धाराएं खोजना", "सज़ा व संज्ञेयता चेक करना"],
    primaryApis: ["/api/acts/process"],
    databaseEntities: ["ActsReference"],
  },
  {
    path: "/station-profile",
    title: "थाना प्रोफाइल व अधिकार क्षेत्र (Station Profile & Beats)",
    category: "Administration",
    description: "थाने का अधिकार क्षेत्र, बीट विवरण, नफरी (Sanctioned Strength), संपर्क सूत्र।",
    supportedActions: ["बीट चेक करना", "थाना संपर्क विवरण देखना"],
    primaryApis: ["/api/general-diary"],
    databaseEntities: ["PoliceUnit"],
  },
  {
    path: "/users",
    title: "थाना स्टाफ व नफरी (Staff & Duty Roster)",
    category: "Administration",
    description: "थाने के समस्त अधिकारियों (SHO, MHC, IO, EO) का विवरण, PNO, मोबाइल व रोस्टर।",
    supportedActions: ["स्टाफ सूची देखना", "ड्यूटी ऑफिसर चेक करना"],
    primaryApis: ["/api/users"],
    databaseEntities: ["User"],
  },
  {
    path: "/record-transfers",
    title: "केस व रिकॉर्ड स्थानांतरण (Record Transfers Desk)",
    category: "Administration",
    description: "अंतर-थाना व अनुभाग केस फाइल स्थानांतरण एवं कस्टडी हैंडओवर।",
    supportedActions: ["ट्रांसफर सूची देखना", "कस्टडी स्वीकार करना"],
    primaryApis: ["/api/record-transfers"],
    databaseEntities: ["RecordTransfer"],
  },
  {
    path: "/settings",
    title: "सिस्टम सेटिंग्स (System Settings)",
    category: "Administration",
    description: "थाने की सिस्टम सेटिंग्स एवं स्टोरेज ऑप्टिमाइज़ेशन।",
    supportedActions: ["स्टोरेज ऑप्टिमाइज़ेशन", "बैकअप सेटिंग्स"],
    primaryApis: ["/api/settings"],
    databaseEntities: ["SystemSettings"],
  },
  {
    path: "/settings/storage-optimization",
    title: "स्टोरेज ऑप्टिमाइज़ेशन (Storage Optimization)",
    category: "Administration",
    description: "सिस्टम डेटा स्टोरेज, कम्प्रेशन व कैश क्लीनिंग।",
    supportedActions: ["कैश साफ करना", "साक्ष्य कम्प्रेशन"],
    primaryApis: ["/api/evidence/compress"],
    databaseEntities: ["EvidenceStorage"],
  },
  {
    path: "/tada",
    title: "यात्रा व दैनिक भत्ता (TA/DA Allowance Suite)",
    category: "Administration",
    description: "थाना पुलिस अधिकारियों का यात्रा भत्ता (TA) व दैनिक भत्ता (DA) बिलिंग।",
    supportedActions: ["TA/DA बिल तैयार करना", "स्वीकृति स्टेटस"],
    primaryApis: ["/api/tada"],
    databaseEntities: ["TadaRecord"],
  },
];

function matchesAlias(q: string, alias: string): boolean {
  const a = alias.toLowerCase().trim();
  if (a.length <= 3) {
    const escaped = a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(?:^|[^\\p{L}\\p{N}])${escaped}(?:$|[^\\p{L}\\p{N}])`, 'u');
    return regex.test(q);
  }
  return q.includes(a);
}

/**
 * Dynamic Module & Route Registry
 * Allows dynamic extension so whenever a new module is added,
 * both the CMS Agent and Jarvis voice copilot immediately learn its routes and actions.
 */
class DynamicModuleRegistryClass {
  private modules: Map<string, ModuleDefinition> = new Map();
  private dynamicRoutes: Map<string, WebsiteRouteInfo> = new Map();

  constructor() {
    // Register initial core modules
    CORE_POLICE_MODULES.forEach(m => this.registerModule(m));
    // Register utility routes
    UTILITY_MODULES.forEach(r => this.registerRoute(r));
  }

  /**
   * Register a new or updated module dynamically
   */
  public registerModule(module: ModuleDefinition): void {
    this.modules.set(module.id.toUpperCase(), module);
    // Add primary route
    this.registerRoute({
      path: module.path,
      title: `${module.titleHi} (${module.title})`,
      category: module.category,
      description: module.description,
      supportedActions: module.supportedActions,
      primaryApis: module.primaryApis,
      databaseEntities: module.databaseEntities,
    });
    // Add sub-routes if any
    module.subRoutes?.forEach(sub => {
      this.registerRoute({
        path: sub.path,
        title: sub.title,
        category: module.category,
        description: sub.description,
        supportedActions: sub.supportedActions,
        primaryApis: module.primaryApis,
        databaseEntities: module.databaseEntities,
      });
    });
  }

  /**
   * Register a single route
   */
  public registerRoute(route: WebsiteRouteInfo): void {
    this.dynamicRoutes.set(route.path, route);
  }

  /**
   * Returns all active operational modules (8 core + any dynamically added)
   */
  public getAllModules(): ModuleDefinition[] {
    return Array.from(this.modules.values());
  }

  /**
   * Returns all registered routes (for Agent navigation and Jarvis toolset)
   */
  public getAllRoutes(): WebsiteRouteInfo[] {
    return Array.from(this.dynamicRoutes.values());
  }

  /**
   * Auto-discovers any new route detected at runtime
   */
  public autoDiscoverRoute(path: string, suggestedTitle?: string): WebsiteRouteInfo {
    const existing = this.dynamicRoutes.get(path);
    if (existing) return existing;

    const cleanPath = path.split("?")[0];
    const segments = cleanPath.split("/").filter(Boolean);
    const title = suggestedTitle || segments.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(" ") || "Home";

    const newRoute: WebsiteRouteInfo = {
      path,
      title: `${title} (Auto-Discovered)`,
      category: "Administration",
      description: `गतिशील रूप से खोजा गया पृष्ठ (${path})।`,
      supportedActions: ["पृष्ठ देखना", "नेविगेट करना"],
      primaryApis: [],
      databaseEntities: [],
    };
    this.dynamicRoutes.set(path, newRoute);
    return newRoute;
  }

  /**
   * Match natural language query (Hindi/English/Hinglish) to appropriate route
   */
  public matchIntentToRoute(userInput: string): WebsiteRouteInfo | null {
    const q = (userInput || "").toLowerCase().trim();

    let bestMatch: { route: WebsiteRouteInfo; score: number } | null = null;

    // Check each registered module and its sub-routes
    for (const mod of this.modules.values()) {
      // 1. Check module sub-routes (more specific, get boost)
      if (mod.subRoutes) {
        for (const sub of mod.subRoutes) {
          for (const alias of sub.aliases) {
            if (matchesAlias(q, alias)) {
              const score = alias.length + 15;
              if (!bestMatch || score > bestMatch.score) {
                const route = this.dynamicRoutes.get(sub.path);
                if (route) bestMatch = { route, score };
              }
            }
          }
        }
      }
      // 2. Check main module aliases
      for (const alias of mod.aliases) {
        if (matchesAlias(q, alias)) {
          const score = alias.length;
          if (!bestMatch || score > bestMatch.score) {
            const route = this.dynamicRoutes.get(mod.path);
            if (route) bestMatch = { route, score };
          }
        }
      }
    }

    if (bestMatch) {
      return bestMatch.route;
    }

    // 3. Check utility routes
    if (q.includes("acts") || q.includes("dhara") || q.includes("धारा") || q.includes("bns") || q.includes("bnss")) {
      return this.dynamicRoutes.get("/acts-sections") || null;
    }
    if (q.includes("station profile") || q.includes("thana profile") || q.includes("beat")) {
      return this.dynamicRoutes.get("/station-profile") || null;
    }
    if (q.includes("users") || q.includes("staff") || q.includes("nafri") || q.includes("roster")) {
      return this.dynamicRoutes.get("/users") || null;
    }
    if (q.includes("transfer") || q.includes("स्थानांतरण")) {
      return this.dynamicRoutes.get("/record-transfers") || null;
    }
    if (q.includes("storage") || q.includes("settings") || q.includes("सेटिंग")) {
      return this.dynamicRoutes.get("/settings") || null;
    }
    if (q.includes("tada") || q.includes("भत्ता") || q.includes("allowance")) {
      return this.dynamicRoutes.get("/tada") || null;
    }
    if (q.includes("home") || q.includes("dashboard") || q.includes("मुख्य पेज")) {
      return this.dynamicRoutes.get("/") || null;
    }

    return null;
  }
}

export const DynamicModuleRegistry = new DynamicModuleRegistryClass();
