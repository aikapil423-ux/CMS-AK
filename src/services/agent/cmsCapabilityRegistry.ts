import { CMSCapability, AgentModule } from "@/types/cmsAgent";

export interface WebsiteRouteInfo {
  path: string;
  title: string;
  category: "General Diary" | "Complaints" | "FIR & Investigation" | "Enquiry" | "Legal & Reference" | "Administration";
  description: string;
  supportedActions: string[];
  requiredRoles?: string[];
  primaryApis: string[];
  databaseEntities: string[];
}

export const WEBSITE_ARCHITECTURE: WebsiteRouteInfo[] = [
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
    path: "/general-diary",
    title: "रोजनामचा आम (Smart General Diary Register)",
    category: "General Diary",
    description: "थाने का दैनिक डिजिटल रोजनामचा (PPR 22.48 / BNSS)। इसमें दो प्रमुख टैब हैं: 1. रजिस्टर (पक्की व लॉक्ड रपटें) 2. Auto-Suggestions & Drafts (AI एवं सिस्टम इवेंट्स से आए सुझाव)।",
    supportedActions: ["GD रपट खोजना व पढ़ना", "Auto-Suggestions & Drafts से मुंशी द्वारा Verify & Lock करना", "ड्राफ्ट एडिट व डिलीट करना", "प्रिंट लेना"],
    requiredRoles: ["MHC_GD_INCHARGE", "SHO", "DUTY_OFFICER"],
    primaryApis: ["/api/general-diary", "/api/general-diary/extract"],
    databaseEntities: ["GDRecord", "GeneralDiaryEntry"],
  },
  {
    path: "/general-diary/new",
    title: "नया रोजनामचा इंद्राज (New GD Entry Form)",
    category: "General Diary",
    description: "54 वैधानिक श्रेणियों में नया GD इंद्राज करने का फॉर्म (रवानगी, वापसी, गश्त, कैदी दाखिला, मालखाना आदि)।",
    supportedActions: ["मैनुअल GD रपट दर्ज करना", "वॉयस डिक्टेशन से लिखना", "अधिकारी व गवाह चुनना"],
    requiredRoles: ["MHC_GD_INCHARGE", "DUTY_OFFICER", "SHO"],
    primaryApis: ["/api/general-diary"],
    databaseEntities: ["GDRecord"],
  },
  {
    path: "/complaints",
    title: "शिकायत रजिस्टर (Citizen Complaints Desk)",
    category: "Complaints",
    description: "नागरिक शिकायतों की सूची, फ़िल्टर (Pending, Under Enquiry, Recommended, Closed) व सर्च।",
    supportedActions: ["शिकायतें खोजना", "जांच अधिकारी (EO) असाइनमेंट देखना", "स्टेटस फ़िल्टर करना"],
    primaryApis: ["/api/complaints", "/api/complaints/summary"],
    databaseEntities: ["Complaint"],
  },
  {
    path: "/complaints/register",
    title: "नई शिकायत पंजीकरण (Register Citizen Complaint)",
    category: "Complaints",
    description: "नागरिक दरख्वास्त शिकायत दर्ज करने का फॉर्म - शिकायतकर्ता विवरण, घटना स्थल/समय, संदिग्ध/अभियुक्त, साक्ष्य अपलोड।",
    supportedActions: ["नई शिकायत दर्ज करना", "साक्ष्य अपलोड करना", "GD में ऑटो-सुझाव भेजना"],
    requiredRoles: ["DUTY_OFFICER", "MHC_GD_INCHARGE", "SHO"],
    primaryApis: ["/api/complaints", "/api/complaints/autofill"],
    databaseEntities: ["Complaint", "ComplaintEvidence"],
  },
  {
    path: "/complaints/[id]",
    title: "शिकायत वर्कस्पेस (Complaint Detail & Investigation Workspace)",
    category: "Complaints",
    description: "शिकायत की संपूर्ण पत्रावली - Overview, EO Enquiry Report, Evidence Store, Case Timeline, SHO Review & Final Decision Modal (FIR / NCR / Closure)।",
    supportedActions: ["जांच आख्या देखना", "SHO अप्रूवल देना", "साक्ष्य डाउनलोड करना", "टाइमलाइन देखना"],
    primaryApis: ["/api/complaints", "/api/evidence/store"],
    databaseEntities: ["Complaint", "EnquiryReport", "ComplaintEvidence", "AuditLog"],
  },
  {
    path: "/enquiry-workspace/drafts",
    title: "जांच आख्या वर्कस्पेस (Enquiry Report Editor & Generator)",
    category: "Enquiry",
    description: "8-सेक्शन वैधानिक जांच आख्या (Enquiry Report) जनरेटर - FIR अनुशंसा, NCR u/s 174 BNSS, अथवा राजीनामा/फाइल दाखिल।",
    supportedActions: ["जांच आख्या ड्राफ्ट करना", "SHO को प्रेषित करना (Send to SHO)", "A4 प्रिंट व पीडीएफ निकालना"],
    requiredRoles: ["ENQUIRY_OFFICER", "SHO"],
    primaryApis: ["/api/builder/drafts", "/api/builder/templates"],
    databaseEntities: ["EnquiryReport", "BuilderDraft"],
  },
  {
    path: "/enquiry-workspace/ncr",
    title: "असंज्ञेय अपराध वर्कस्पेस (NCR Suite - Section 174 BNSS)",
    category: "Enquiry",
    description: "असंज्ञेय अपराध (Non-Cognizable Report) का आधिकारिक प्रपत्र तैयार करना व मजिस्ट्रेट परिवाद निर्देश।",
    supportedActions: ["NCR प्रपत्र तैयार करना", "GD इंद्राज लिंक करना"],
    primaryApis: ["/api/general-diary"],
    databaseEntities: ["Complaint", "GDRecord"],
  },
  {
    path: "/fir",
    title: "मुकद्दमा रजिस्टर (FIR & Case Register)",
    category: "FIR & Investigation",
    description: "पंजीकृत मुकद्दमों (FIRs) की सूची, CCTNS सिंक स्टेटस, अन्वेषण अधिकारी (IO) विवरण व स्टेटस।",
    supportedActions: ["FIR खोजना", "केस स्टेटस ट्रैक करना", "IO अनुसार फ़िल्टर करना"],
    primaryApis: ["/api/fir"],
    databaseEntities: ["FIRItem"],
  },
  {
    path: "/fir/register",
    title: "नियमित मुकद्दमा पंजीकरण (Regular FIR Registration Form)",
    category: "FIR & Investigation",
    description: "BNS 2023 एवं विशेष अधिनियमों के तहत नियमित FIR दर्ज करने का फॉर्म - तहरीर, घटना स्थल, कानूनी धाराएं, अभियुक्त विवरण, मसरूका माल।",
    supportedActions: ["नया मुकद्दमा दर्ज करना", "CCTNS सिंक करना", "IO असाइन करना"],
    requiredRoles: ["SHO", "MHC_GD_INCHARGE"],
    primaryApis: ["/api/fir", "/api/fir/autofill"],
    databaseEntities: ["FIRItem", "AccusedPerson"],
  },
  {
    path: "/fir/[id]",
    title: "केस फ़ाइल व अन्वेषण पत्रावली (FIR Case Dossier)",
    category: "FIR & Investigation",
    description: "मुकद्दमे की मुकम्मल पत्रावली - अभियुक्त सूची, केस डायरी (Zimni), केस डॉक्युमेंट्स, ज़ब्ती मेमो, टाइमलाइन व ऑडिट ट्रेल।",
    supportedActions: ["केस डायरी पढ़ना", "दस्तावेज़ जोड़ना", "चार्जशीट ट्रैक करना"],
    primaryApis: ["/api/fir"],
    databaseEntities: ["FIRItem", "FIRCaseDiaryItem", "FIRDocumentItem"],
  },
  {
    path: "/fir-workspace/arrest-docs",
    title: "गिरफ़्तारी प्रपत्र वर्कस्पेस (Statutory Arrest Documentation Suite)",
    category: "FIR & Investigation",
    description: "गिरफ़्तारी से संबंधित 6 अनिवार्य कानूनी प्रपत्र: 1. 4-पृष्ठीय गिरफ़्तारी मेमो (Form 26.8) 2. फर्द जामातालाशी (PPR 26.10A) 3. गिरफ़्तारी आधार पत्र (धारा 47 BNSS) 4. इत्तिला पत्र (धारा 48 BNSS) 5. मेडिकल मुआइना पत्र (धारा 53 BNSS) 6. रिमांड दरख्वास्त (धारा 187 BNSS)।",
    supportedActions: ["गिरफ़्तारी प्रपत्र तैयार करना", "गवाह व जामातालाशी भरना", "4-पेज A4 प्रिंट व पीडीएफ निकालना", "केस डॉक्युमेंट्स में सेव करना"],
    requiredRoles: ["INVESTIGATING_OFFICER", "ENQUIRY_OFFICER", "SHO"],
    primaryApis: ["/api/fir", "/api/documents/parse-proforma"],
    databaseEntities: ["FIRItem", "AccusedPerson"],
  },
  {
    path: "/fir-workspace/zimni",
    title: "केस डायरी वर्कस्पेस (Zimni Writing Desk - Section 192 BNSS)",
    category: "FIR & Investigation",
    description: "तफ्तीश की दैनिक ज़िमनी (Case Diary) लिखने का वर्कस्पेस (PPR 25.54 / BNSS 192)।",
    supportedActions: ["नई ज़िमनी लिखना", "गवाहों के बयान लिखना", "A4 प्रिंट लेना"],
    primaryApis: ["/api/fir"],
    databaseEntities: ["FIRItem", "FIRCaseDiaryItem"],
  },
  {
    path: "/acts-sections",
    title: "कानूनी धाराएं व अधिनियम (Acts & Sections Explorer)",
    category: "Legal & Reference",
    description: "BNS (भारतीय न्याय संहिता), BNSS (भारतीय नागरिक सुरक्षा संहिता), BSA (भारतीय साक्ष्य अधिनियम), व विशेष अधिनियमों का संपूर्ण कानूनी संदर्भ।",
    supportedActions: ["धाराएं खोजना", "सज़ा व संज्ञेयता (Cognizable/Bailable) चेक करना"],
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
    description: "थाने के समस्त अधिकारियों (SHO, MHC, IO, EO, सिपाही) का विवरण, PNO, मोबाइल व रोल स्विचर।",
    supportedActions: ["स्टाफ सूची देखना", "ड्यूटी ऑफिसर चेक करना"],
    primaryApis: ["/api/users"],
    databaseEntities: ["User"],
  },
  {
    path: "MODAL:ROLE_SWITCHER",
    title: "रोल स्विचर डायलॉग बॉक्स (Role Switcher Dialog)",
    category: "Administration",
    description: "थाना अधिकारियों (SHO, MHC, IO, EO, Counter Duty Officer) के बीच भूमिका व पदभार बदलने का स्क्रीन डायलॉग बॉक्स।",
    supportedActions: ["रोल बदलना", "पदभार स्विच करना"],
    primaryApis: ["/api/users"],
    databaseEntities: ["User"],
  },
];

export const CMS_CAPABILITIES: CMSCapability[] = [
  {
    id: "search_records",
    name: "यूनिवर्सल रिकॉर्ड सर्च (Universal Search)",
    module: "UNIVERSAL",
    description: "FIR, शिकायत, रोजनामचा (GD), अभियुक्त, साक्ष्य व स्टाफ में कुछ भी खोजना।",
    isMutation: false,
    requiresExplicitApproval: false,
    exampleQueries: ["FIR 125 search karo", "Anil Kumar ko search karo", "Recent theft cases", "Pending complaints kitni hain"],
  },
  {
    id: "get_fir_details",
    name: "मुकद्दमा पत्रावली देखना (Retrieve FIR Dossier)",
    module: "FIR_CASES",
    description: "FIR की मुकम्मल जानकारी, धाराएं, अभियुक्त, मसरूका माल, केस डायरी व अटैचमेंट्स निकालना।",
    isMutation: false,
    requiresExplicitApproval: false,
    exampleQueries: ["FIR 125 kholo", "FIR 14 ki details dikhao", "FIR 125 ke documents"],
  },
  {
    id: "get_complaint_details",
    name: "शिकायत पत्रावली देखना (Retrieve Complaint)",
    module: "COMPLAINTS",
    description: "शिकायतकर्ता, घटना, जांच अधिकारी (EO) रिपोर्ट व अंतिम निर्णय स्थिति निकालना।",
    isMutation: false,
    requiresExplicitApproval: false,
    exampleQueries: ["Complaint 142 dikhao", "Complaint summary check karo", "Pending complaints"],
  },
  {
    id: "prepare_arrest_documents",
    name: "गिरफ़्तारी प्रपत्र निर्माण (Generate Arrest Dossier)",
    module: "ARREST_DOCS",
    description: "4-पृष्ठीय गिरफ़्तारी मेमो (Form 26.8), फर्द जामातालाशी, ग्राउंड्स ऑफ अरेस्ट (BNSS 47), इत्तिला पत्र (BNSS 48), मेडिकल प्रार्थना पत्र व रिमांड दरख्वास्त का वैधानिक निर्माण।",
    isMutation: true,
    requiresExplicitApproval: true,
    exampleQueries: [
      "Anil Kumar ko arrest karke laya hoon FIR 125 me, arrest documents bana do",
      "Arrest memo prepare karo",
      "Fard Jamatalashi aur grounds of arrest banao",
    ],
  },
  {
    id: "prepare_gd_draft",
    name: "रोजनामचा इंद्राज तैयार करना (Draft General Diary Entry)",
    module: "GENERAL_DIARY",
    description: "किसी भी घटना बाबत (रवानगी, वापसी, दाखिला गिरफ़्तारी, माल बरामदगी, शिकायत निस्तारण) Smart GD में ड्राफ्ट तैयार करना।",
    isMutation: true,
    requiresExplicitApproval: true,
    exampleQueries: [
      "Is arrest ki GD draft karo",
      "Roznamcha me entry dalo",
      "GD entry prepare karo",
      "Ravangi rpat likho",
    ],
  },
  {
    id: "prepare_zimni_draft",
    name: "केस डायरी (Zimni) लिखना (Draft Case Diary u/s 192 BNSS)",
    module: "ZIMNI",
    description: "तफ्तीश अधिकारी द्वारा दैनिक तफ्तीश कार्यवाही, घटनास्थल निरीक्षण व साक्ष्य संकलन की ज़िमनी ड्राफ्ट करना।",
    isMutation: true,
    requiresExplicitApproval: true,
    exampleQueries: [
      "FIR 125 ki Zimni draft karo",
      "Zimni number 2 likho",
      "Case diary prepare karo",
    ],
  },
  {
    id: "prepare_complaint_report",
    name: "जांच आख्या तैयार करना (Generate Enquiry Report)",
    module: "ENQUIRY_WORKSPACE",
    description: "8-सेक्शन वैधानिक जांच आख्या (FIR / NCR / Closure) तैयार करना।",
    isMutation: true,
    requiresExplicitApproval: true,
    exampleQueries: ["Complaint enquiry report draft karo", "FIR recommendation report banao", "NCR report prepare karo"],
  },
  {
    id: "navigate_to_module",
    name: "वेबसाइट नेविगेशन (Navigate to Website Pages & Forms)",
    module: "UNIVERSAL",
    description: "उपयोगकर्ता के निर्देशानुसार वेबसाइट के किसी भी पेज, फॉर्म या वर्कस्पेस पर सीधे ले जाना।",
    isMutation: false,
    requiresExplicitApproval: false,
    exampleQueries: [
      "Arrest docs page kholo",
      "General diary register par chalo",
      "FIR register form par jao",
      "Complaints register form kholo",
    ],
  },
  {
    id: "get_acts_and_sections",
    name: "कानूनी धाराएं व सलाह (Legal Code Reference - BNS/BNSS/BSA)",
    module: "ACTS_SECTIONS",
    description: "BNS, BNSS, BSA की धाराओं, परिभाषाओं, सज़ा, ज़मानत (Bailable/Non-Bailable) व संज्ञेयता का विश्लेषण।",
    isMutation: false,
    requiresExplicitApproval: false,
    exampleQueries: [
      "BNS section 303(2) kya hai",
      "Grounds of arrest kis section me aate hain",
      "Theft sections in BNS",
      "Section 47 BNSS kya hai",
    ],
  },
  {
    id: "get_system_architecture",
    name: "वेबसाइट ज्ञान व प्रणाली समझ (Website Knowledge & Guidance)",
    module: "UNIVERSAL",
    description: "वेबसाइट के किसी भी मॉड्यूल, पेज, डेटाबेस टेबल या बैकएंड कार्यप्रणाली की पूरी जानकारी देना।",
    isMutation: false,
    requiresExplicitApproval: false,
    exampleQueries: [
      "Website me kahan kya hota hai",
      "GD kaise verify hoti hai",
      "SHO review workflow kya hai",
      "Modules ki list dikhao",
    ],
  },
  {
    id: "get_staff_duty",
    name: "थाना स्टाफ व ड्यूटी रोस्टर (Staff & Duty Roster)",
    module: "STAFF",
    description: "थाने के ऑन-ड्यूटी अधिकारी, SHO, MHC, EOs और संपर्क विवरण निकालना।",
    isMutation: false,
    requiresExplicitApproval: false,
    exampleQueries: ["Duty officer koun hai", "MHC kon hai", "Staff list dikhao", "SHO sahab ka number"],
  },
  {
    id: "assign_eo_complaint",
    name: "जांच अधिकारी (EO) असाइन करना (Assign Enquiry Officer)",
    module: "COMPLAINTS",
    description: "नागरिक शिकायत की जांच हेतु अधिकृत जांच अधिकारी (ASI/SI) की नियुक्ति व असाइनमेंट।",
    isMutation: true,
    requiresExplicitApproval: true,
    exampleQueries: ["Is complaint ka EO assign kar do", "Complaint 142 par EO badlo", "Assign Vikram Singh as EO"],
  },
  {
    id: "create_notice_35_bnss",
    name: "हाजिरी नोटिस (Notice of Appearance u/s 35(3) BNSS)",
    module: "FIR_WORKSPACE",
    description: "अन्वेषण में शामिल होने हेतु अभियुक्त/संदेही को 35(3) BNSS के तहत आधिकारिक कानूनी नोटिस जारी करना।",
    isMutation: true,
    requiresExplicitApproval: true,
    exampleQueries: ["Dhara 35(3) ka notice banao", "Notice of appearance draft karo", "Anil Kumar ko 41A/35 notice bhejo"],
  },
  {
    id: "create_notice_91_bnss",
    name: "दस्तावेज़ तलब नोटिस (Summons to Produce Documents u/s 91 BNSS)",
    module: "FIR_WORKSPACE",
    description: "बैंक, टेलीकॉम अथवा संस्था से साक्ष्य/दस्तावेज़ मंगाने हेतु धारा 91 BNSS नोटिस तैयार करना।",
    isMutation: true,
    requiresExplicitApproval: true,
    exampleQueries: ["Dhara 91 BNSS ka notice banao", "Bank details talab karne ka notice", "Notice to produce documents"],
  },
  {
    id: "get_pending_complaints_report",
    name: "लंबित शिकायत रिपोर्ट (Pending Complaints Roster Report)",
    module: "COMPLAINTS",
    description: "थाने की सभी लंबित शिकायतों की आधिकारिक प्रगति आख्या व रोस्टर तैयार करना।",
    isMutation: false,
    requiresExplicitApproval: false,
    exampleQueries: ["Pichhle mahine ki pending complaints ka report banao", "Pending complaints report", "Shikayat register report"],
  },
  {
    id: "close_current_dialog",
    name: "डायलॉग बॉक्स बंद करना (Close Dialog & Return)",
    module: "UNIVERSAL",
    description: "वर्तमान में खुली किसी भी पॉपअप विंडो या डायलॉग बॉक्स को बंद करना।",
    isMutation: false,
    requiresExplicitApproval: false,
    exampleQueries: ["Jo dialog khula hai use band karo", "Dialog close karo", "Popup band karo", "Previous page kholo"],
  },
  {
    id: "execute_multi_step_workflow",
    name: "संयुक्त बहु-चरणीय कार्य निष्पादन (Multi-Step Integrated Workflow)",
    module: "UNIVERSAL",
    description: "एकल निर्देश से केस लोड करना, अरेस्ट डॉक्युमेंट्स तैयार करना, GD ड्राफ्ट बनाना और सभी प्रपत्र एक साथ प्रस्तुत करना।",
    isMutation: true,
    requiresExplicitApproval: true,
    exampleQueries: [
      "FIR 125 kholo, Anil Kumar ka record check karo, arrest documents taiyar karo, GD draft banao aur sab documents dikhao",
      "Is case ke saare required documents taiyar karo",
    ],
  },
];

export class CmsCapabilityRegistry {
  public static getAll(): CMSCapability[] {
    return CMS_CAPABILITIES;
  }

  public static getRoutes(): WebsiteRouteInfo[] {
    return WEBSITE_ARCHITECTURE;
  }

  public static findRoute(query: string): WebsiteRouteInfo | null {
    const q = query.toLowerCase();

    // 0. Role Switcher Modal / Dialog Box
    if (
      q.includes("role switcher") ||
      q.includes("role modal") ||
      q.includes("role dialogue") ||
      q.includes("role daailogue") ||
      q.includes("role dialog") ||
      q.includes("role box") ||
      q.includes("role badlo") ||
      q.includes("role badalne") ||
      q.includes("change role") ||
      q.includes("switch role")
    ) {
      return (
        WEBSITE_ARCHITECTURE.find((r) => r.path === "MODAL:ROLE_SWITCHER") || {
          path: "MODAL:ROLE_SWITCHER",
          title: "रोल स्विचर डायलॉग बॉक्स (Role Switcher Dialog)",
          category: "Administration",
          description: "थाना अधिकारियों (SHO, MHC, IO, EO, Counter Duty Officer) के बीच भूमिका व पदभार बदलने का स्क्रीन डायलॉग बॉक्स।",
          supportedActions: ["रोल बदलना", "पदभार स्विच करना"],
          primaryApis: ["/api/users"],
          databaseEntities: ["User"],
        }
      );
    }

    // 1. Add Entry / New GD Entry Form / Dialog Box
    if (
      q.includes("add entry") ||
      q.includes("new entry") ||
      q.includes("entry daailogue") ||
      q.includes("entry dialogue") ||
      q.includes("entry dialog") ||
      q.includes("entry box") ||
      q.includes("entry form") ||
      q.includes("gd entry form") ||
      q.includes("gd form") ||
      q.includes("nayi gd") ||
      q.includes("naya roznamcha") ||
      q.includes("rapat form") ||
      (q.includes("entry") && (q.includes("kholo") || q.includes("open") || q.includes("box") || q.includes("form") || q.includes("dialog") || q.includes("daailogue")))
    ) {
      return WEBSITE_ARCHITECTURE.find((r) => r.path === "/general-diary/new") || null;
    }

    // 2. Register Complaint Form / Dialog
    if (
      (q.includes("complaint") || q.includes("shikayat") || q.includes("शिकायत")) &&
      (q.includes("register") || q.includes("form") || q.includes("nayi") || q.includes("darj") || q.includes("box") || q.includes("dialog") || q.includes("daailogue"))
    ) {
      return WEBSITE_ARCHITECTURE.find((r) => r.path === "/complaints/register") || null;
    }

    // 3. Register Regular FIR Form
    if (
      (q.includes("fir") || q.includes("mukaddma") || q.includes("मुकद्दमा")) &&
      (q.includes("register") || q.includes("form") || q.includes("nayi") || q.includes("darj") || q.includes("box") || q.includes("dialog") || q.includes("daailogue"))
    ) {
      return WEBSITE_ARCHITECTURE.find((r) => r.path === "/fir/register") || null;
    }

    // 4. Arrest Docs Workspace / Form 26.8
    if (
      (q.includes("arrest") || q.includes("girftar") || q.includes("गिरफ्तार") || q.includes("jamatalashi") || q.includes("जामातालाशी") || q.includes("26.8")) &&
      (q.includes("form") || q.includes("page") || q.includes("workspace") || q.includes("kholo") || q.includes("open") || q.includes("box") || q.includes("desk"))
    ) {
      return WEBSITE_ARCHITECTURE.find((r) => r.path === "/fir-workspace/arrest-docs") || null;
    }

    // 5. Case Diary / Zimni Workspace (Section 192 BNSS)
    if (
      (q.includes("zimni") || q.includes("case diary") || q.includes("ज़िमनी")) &&
      (q.includes("form") || q.includes("page") || q.includes("workspace") || q.includes("kholo") || q.includes("open") || q.includes("box") || q.includes("desk"))
    ) {
      return WEBSITE_ARCHITECTURE.find((r) => r.path === "/fir-workspace/zimni") || null;
    }

    // 6. General Diary Auto-Suggestions & Drafts Tab
    if (
      q.includes("suggestion") ||
      q.includes("auto-suggestion") ||
      q.includes("gd draft tab") ||
      q.includes("draft tab") ||
      q.includes("drafts tab") ||
      q.includes("sujhav tab")
    ) {
      return (
        {
          path: "/general-diary?tab=SUGGESTIONS_DRAFTS",
          title: "रोजनामचा ऑटो-सुझाव व ड्राफ्ट्स (Smart GD Suggestions & Drafts)",
          category: "General Diary",
          description: "मुंशी (MHC) के संज्ञानार्थ AI एवं सिस्टम इवेंट्स से आए GD सुझाव डेस्क।",
          supportedActions: ["Verify & Lock (Add to GD)", "Edit Draft", "Delete Draft"],
          primaryApis: ["/api/general-diary"],
          databaseEntities: ["GDRecord"],
        } as WebsiteRouteInfo
      );
    }

    // 7. General Diary Register
    if (q.includes("general diary") || q.includes("roznamcha") || q.includes("gd register") || q.includes("gd desk")) {
      return WEBSITE_ARCHITECTURE.find((r) => r.path === "/general-diary") || null;
    }

    // 8. Complaints List / Desk
    if (q.includes("complaints desk") || q.includes("shikayat list") || q.includes("complaints list") || (q.includes("complaint") && (q.includes("kholo") || q.includes("desk") || q.includes("register")))) {
      return WEBSITE_ARCHITECTURE.find((r) => r.path === "/complaints") || null;
    }

    // 9. FIR List / Cases
    if (q.includes("fir desk") || q.includes("cases list") || q.includes("mukaddma register") || (q.includes("fir") && (q.includes("list") || q.includes("desk") || q.includes("register")))) {
      return WEBSITE_ARCHITECTURE.find((r) => r.path === "/fir") || null;
    }

    // 10. Acts & Sections Explorer
    if (q.includes("acts") || q.includes("dhara explorer") || q.includes("section explorer") || q.includes("bns explorer")) {
      return WEBSITE_ARCHITECTURE.find((r) => r.path === "/acts-sections") || null;
    }

    // 11. Staff / Duty Roster
    if (q.includes("staff") || q.includes("nafri") || q.includes("users") || q.includes("roster") || q.includes("duty roster")) {
      return WEBSITE_ARCHITECTURE.find((r) => r.path === "/users") || null;
    }

    // 12. Station Profile & Beats
    if (q.includes("station profile") || q.includes("thana profile") || q.includes("beat list") || q.includes("beats")) {
      return WEBSITE_ARCHITECTURE.find((r) => r.path === "/station-profile") || null;
    }

    // 13. Enquiry Workspace / Drafts
    if (q.includes("enquiry") || q.includes("report workspace") || q.includes("janch aakhya")) {
      return WEBSITE_ARCHITECTURE.find((r) => r.path === "/enquiry-workspace/drafts") || null;
    }

    // 14. Non-Cognizable Report (NCR) Workspace
    if (q.includes("ncr") || q.includes("asangey") || q.includes("174 bnss")) {
      return WEBSITE_ARCHITECTURE.find((r) => r.path === "/enquiry-workspace/ncr") || null;
    }

    // 15. Home Dashboard
    if (q.includes("home") || q.includes("dashboard") || q.includes("mukhya page")) {
      return WEBSITE_ARCHITECTURE.find((r) => r.path === "/") || null;
    }

    return null;
  }
}
