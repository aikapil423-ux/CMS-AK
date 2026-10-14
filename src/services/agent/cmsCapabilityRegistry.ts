import {
  CMSCapability,
  AgentModule,
  FieldMetadata,
  ActionMetadata,
  WorkflowMetadata,
  OperationClassification,
  CandidateCapabilityMatch,
  PageSchema,
} from "@/types/cmsAgent";

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

// ============================================================================
// 1. COMPLETE CMS APPLICATION ROUTE & PAGE ARCHITECTURE
// ============================================================================
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
    supportedActions: ["जांच आख्या देखना", "SHO अप्रूवल देना", "साक्ष्य डाउनलोड करना", "टाइमलाइन देखना", "EO असाइन करना", "थाना ट्रांसफर करना"],
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
    path: "/fir-workspace/kalandra",
    title: "कलंदरा वर्कस्पेस (Kalandra Preparation & Court Dossier Suite)",
    category: "FIR & Investigation",
    description: "निवारक एवं विनियामक कलंदरा प्रपत्र (107/151, 107/150, 217 BNS, 248 BNS, 145, 72 IPC, 7/16, Other), SHO प्रेषण पत्र, गवाहान सूची व न्यायालय अग्रेषण पत्रावली।",
    supportedActions: ["कलंदरा तैयार करना", "ड्राफ्ट सहेजना", "FIR/Complaint/GD से ऑटो-फिल करना", "न्यायालय पैकेज व A4 प्रिंट निकालना", "टेम्पलेट कस्टमाइज़ करना"],
    requiredRoles: ["INVESTIGATING_OFFICER", "ENQUIRY_OFFICER", "SHO"],
    primaryApis: ["/api/kalandra", "/api/fir"],
    databaseEntities: ["KalandraRecord", "KalandraTemplate"],
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

// ============================================================================
// 2. COMPLETE CMS FORM FIELD METADATA KNOWLEDGE GRAPH
// ============================================================================
export const CMS_FIELDS: FieldMetadata[] = [
  // --- Citizen Complaint Registration Form ---
  {
    id: "comp_complainant_name",
    formId: "complaint_register_form",
    fieldName: "complainantName",
    label: "शिकायतकर्ता का नाम (Complainant Name)",
    semanticMeaning: "नागरिक या पीड़ित व्यक्ति जिसने थाने में दरख्वास्त या शिकायत प्रस्तुत की है।",
    dataType: "string",
    isRequired: true,
    validationRules: ["कम से कम 3 अक्षर होने चाहिए", "केवल अक्षरों व सामान्य विराम चिह्नों की अनुमति"],
    databaseMapping: { entity: "Complaint", field: "complainantName" },
    aiAutofillable: true,
    requiresOfficerVerification: false,
    synonyms: ["shikayatkarta", "complainant", "prarthi", "muddayi", "applicant", "naam"],
  },
  {
    id: "comp_complainant_phone",
    formId: "complaint_register_form",
    fieldName: "complainantPhone",
    label: "शिकायतकर्ता मोबाइल नंबर (Mobile Number)",
    semanticMeaning: "शिकायतकर्ता का 10-अंकीय संपर्क नंबर जिससे SMS अपडेट व IO द्वारा संपर्क किया जा सके।",
    dataType: "string",
    validFormat: "^[6-9][0-9]{9}$",
    isRequired: true,
    validationRules: ["10 अंक का वैध भारतीय मोबाइल नंबर"],
    databaseMapping: { entity: "Complaint", field: "complainantPhone" },
    aiAutofillable: true,
    requiresOfficerVerification: false,
    synonyms: ["mobile", "phone", "contact", "number", "sampark"],
  },
  {
    id: "comp_complainant_address",
    formId: "complaint_register_form",
    fieldName: "complainantAddress",
    label: "पता (Address)",
    semanticMeaning: "शिकायतकर्ता का वर्तमान व स्थायी निवास स्थान (मकान सं., गली, गांव/शहर, जिला)।",
    dataType: "string",
    isRequired: true,
    validationRules: ["पता खाली नहीं होना चाहिए"],
    databaseMapping: { entity: "Complaint", field: "complainantAddress" },
    aiAutofillable: true,
    requiresOfficerVerification: false,
    synonyms: ["address", "pata", "niwas", "mohalla", "gao", "city"],
  },
  {
    id: "comp_incident_date",
    formId: "complaint_register_form",
    fieldName: "incidentDate",
    label: "घटना की तारीख व समय (Date & Time of Incident)",
    semanticMeaning: "घटना घटित होने की दिनांक व समय जब अपराध या विवाद हुआ।",
    dataType: "datetime",
    isRequired: true,
    validationRules: ["भविष्य की तारीख नहीं हो सकती (Cannot be future date)"],
    databaseMapping: { entity: "Complaint", field: "incidentDate" },
    aiAutofillable: true,
    requiresOfficerVerification: true,
    synonyms: ["incident date", "ghatna tarikh", "waqt", "samay", "date"],
  },
  {
    id: "comp_incident_place",
    formId: "complaint_register_form",
    fieldName: "incidentPlace",
    label: "घटना स्थल (Place of Incident)",
    semanticMeaning: "वह भौतिक स्थान, बीट अथवा इलाका जहां घटना घटी। बीट व थाना क्षेत्राधिकार तय करने हेतु अनिवार्य।",
    dataType: "string",
    isRequired: true,
    validationRules: ["घटना स्थल का स्पष्ट विवरण अनिवार्य है"],
    databaseMapping: { entity: "Complaint", field: "incidentPlace" },
    aiAutofillable: true,
    requiresOfficerVerification: true,
    synonyms: ["place of incident", "ghatna sthal", "mauka", "location", "area"],
  },
  {
    id: "comp_category",
    formId: "complaint_register_form",
    fieldName: "category",
    label: "शिकायत की श्रेणी (Category)",
    semanticMeaning: "अपराध या शिकायत का विधिक वर्गीकरण (चोरी, साइबर, ज़मीनी विवाद, धोखाधड़ी आदि)।",
    dataType: "select",
    optionsSource: "THEFT | CYBER_FRAUD | PROPERTY_DISPUTE | ASSAULT | HARASSMENT | MISSING_PERSON | OTHER",
    isRequired: true,
    defaultValue: "THEFT",
    validationRules: ["मान्य श्रेणियों में से एक होना अनिवार्य"],
    databaseMapping: { entity: "Complaint", field: "category" },
    aiAutofillable: true,
    requiresOfficerVerification: false,
    synonyms: ["category", "shreni", "kism", "matter type", "apradh prakar"],
  },
  {
    id: "comp_subject",
    formId: "complaint_register_form",
    fieldName: "subject",
    label: "विषय (Subject)",
    semanticMeaning: "शिकायत का संक्षिप्त एक-पंक्ति विषय सारांश।",
    dataType: "string",
    isRequired: true,
    validationRules: ["विषय 10 से 150 अक्षरों के बीच होना चाहिए"],
    databaseMapping: { entity: "Complaint", field: "subject" },
    aiAutofillable: true,
    requiresOfficerVerification: false,
    synonyms: ["subject", "vishay", "khulasa", "shikayat vishay", "title"],
  },
  {
    id: "comp_narrative",
    formId: "complaint_register_form",
    fieldName: "narrative",
    label: "मजमून / विस्तृत विवरण (Detailed Narrative)",
    semanticMeaning: "नागरिक द्वारा दी गई तहरीर या घटना का सिलसिलेवार संपूर्ण विवरण।",
    dataType: "string",
    isRequired: true,
    validationRules: ["विस्तृत विवरण न्यूनतम 20 अक्षर"],
    databaseMapping: { entity: "Complaint", field: "narrative" },
    aiAutofillable: true,
    requiresOfficerVerification: false,
    synonyms: ["narrative", "majmoon", "tahreer", "bayan", "description", "details"],
  },

  // --- Regular FIR Registration Form ---
  {
    id: "fir_number",
    formId: "fir_register_form",
    fieldName: "firNumber",
    label: "मुकद्दमा नंबर (FIR Number)",
    semanticMeaning: "थाने के FIR रजिस्टर का क्रमबद्ध आधिकारिक नंबर, प्रारूप FIR/XXXX/YYYY।",
    dataType: "string",
    validFormat: "^FIR/[0-9]{4}/[0-9]{4}$",
    isRequired: true,
    validationRules: ["अद्वितीय होना चाहिए, चालू वर्ष में पूर्व दर्ज नहीं"],
    databaseMapping: { entity: "FIRItem", field: "firNumber" },
    aiAutofillable: true,
    requiresOfficerVerification: true,
    synonyms: ["fir no", "mukaddma number", "case no", "fir sankhya"],
  },
  {
    id: "fir_acts_sections",
    formId: "fir_register_form",
    fieldName: "actsAndSections",
    label: "अधिनियम व धाराएं (Acts & Sections)",
    semanticMeaning: "BNS, BNSS, विशेष अधिनियमों की कानूनी धाराएं जिनके तहत मुकद्दमा दर्ज किया गया।",
    dataType: "string",
    isRequired: true,
    validationRules: ["मान्य कानूनी धाराएं (जैसे BNS 303(2), 305)"],
    databaseMapping: { entity: "FIRItem", field: "actsAndSections" },
    aiAutofillable: true,
    requiresOfficerVerification: true,
    synonyms: ["sections", "dhara", "acts", "bns sections", "kanuni dharayein"],
  },
  {
    id: "fir_accused_name",
    formId: "fir_register_form",
    fieldName: "accusedName",
    label: "अभियुक्त / नामजद का नाम (Accused Name)",
    semanticMeaning: "मुकद्दमे में आरोपित या गिरफ़्तार व्यक्ति का नाम।",
    dataType: "string",
    isRequired: false,
    defaultValue: "Unknown / नामजद नहीं",
    validationRules: ["यदि ज्ञात हो तो पूरा नाम"],
    databaseMapping: { entity: "AccusedPerson", field: "name" },
    aiAutofillable: true,
    requiresOfficerVerification: true,
    synonyms: ["accused", "abhiyukt", "aaropi", "mulzim", "suspect"],
  },
  {
    id: "fir_io_id",
    formId: "fir_register_form",
    fieldName: "assignedIoId",
    label: "अन्वेषण अधिकारी (Investigating Officer - IO)",
    semanticMeaning: "मुकद्दमे की तफ्तीश हेतु SHO द्वारा नियुक्त सब-इंस्पेक्टर अथवा सहायक सब-इंस्पेक्टर।",
    dataType: "select",
    optionsSource: "STATION_STAFF_ACTIVE_ROSTER",
    isRequired: true,
    validationRules: ["थाने का अधिकृत IO अधिकारी होना चाहिए"],
    databaseMapping: { entity: "FIRItem", field: "assignedIoId" },
    aiAutofillable: true,
    requiresOfficerVerification: true,
    synonyms: ["io", "investigating officer", "tafteesh adhikari", "assigned io"],
  },

  // --- General Diary Entry Form ---
  {
    id: "gd_type_code",
    formId: "gd_new_entry_form",
    fieldName: "typeCode",
    label: "रोजनामचा मद / प्रकार (GD Type Category)",
    semanticMeaning: "PPR 22.48 के अनुसार 54 वैधानिक श्रेणियों में से रपट का प्रकार (रवानगी, वापसी, गश्त आदि)।",
    dataType: "select",
    optionsSource: "PPR_GD_CATEGORIES",
    isRequired: true,
    validationRules: ["मान्य 54 श्रेणियों में से एक होना अनिवार्य"],
    databaseMapping: { entity: "GDRecord", field: "typeCode" },
    aiAutofillable: true,
    requiresOfficerVerification: false,
    synonyms: ["gd type", "rapat type", "category", "kism rapat", "mad"],
  },
  {
    id: "gd_activity_date",
    formId: "gd_new_entry_form",
    fieldName: "activityDate",
    label: "इंद्राज दिनांक (Activity Date)",
    semanticMeaning: "वह वास्तविक तारीख जब पुलिस कार्यवाही संपन्न हुई।",
    dataType: "date",
    validFormat: "YYYY-MM-DD",
    isRequired: true,
    validationRules: ["वर्तमान या भूतकाल की तिथि; भविष्य की अनुमति नहीं"],
    databaseMapping: { entity: "GDRecord", field: "activityDate" },
    aiAutofillable: true,
    requiresOfficerVerification: false,
    synonyms: ["gd date", "rapat tarikh", "activity date", "tarikh"],
  },
  {
    id: "gd_officer_id",
    formId: "gd_new_entry_form",
    fieldName: "selectedOfficerId",
    label: "संबंधित अधिकारी (Officer Concerned)",
    semanticMeaning: "जिस पुलिस अधिकारी के आवागमन, गश्त या आदेश बाबत रपट दर्ज की जा रही है।",
    dataType: "select",
    optionsSource: "STATION_OFFICERS",
    isRequired: true,
    validationRules: ["थाना नफरी का सदस्य होना चाहिए"],
    databaseMapping: { entity: "GDRecord", field: "officerId" },
    aiAutofillable: true,
    requiresOfficerVerification: false,
    synonyms: ["officer", "adhikari", "police karmchari", "sentry", "patrol officer"],
  },
  {
    id: "gd_narrative",
    formId: "gd_new_entry_form",
    fieldName: "narrative",
    label: "रपट का मजमून (GD Narrative Text)",
    semanticMeaning: "रोजनामचा आम में दर्ज की जाने वाली आधिकारिक रपट की विस्तृत इबारत।",
    dataType: "string",
    isRequired: true,
    validationRules: ["रपट का विवरण खाली नहीं हो सकता"],
    databaseMapping: { entity: "GDRecord", field: "narrative" },
    aiAutofillable: true,
    requiresOfficerVerification: true,
    synonyms: ["rapat", "gd text", "majmoon", "ibarat", "rapat content"],
  },

  // --- Supervisory Actions (EO Assignment) ---
  {
    id: "eo_assignment_officer",
    formId: "assign_eo_form",
    fieldName: "eoId",
    label: "जांच अधिकारी (Enquiry Officer - EO)",
    semanticMeaning: "शिकायत की प्रारंभिक जांच (Section 173(3) BNSS) हेतु SHO द्वारा नियुक्त अधिकारी।",
    dataType: "select",
    optionsSource: "MOCK_ENQUIRY_OFFICERS",
    isRequired: true,
    validationRules: ["अधिकृत EO होना अनिवार्य"],
    databaseMapping: { entity: "Complaint", field: "assignedEoId" },
    aiAutofillable: true,
    requiresOfficerVerification: true,
    synonyms: ["eo", "enquiry officer", "janch adhikari", "investigator"],
  },
];

// ============================================================================
// 3. COMPLETE ACTION & BUTTON METADATA KNOWLEDGE GRAPH
// ============================================================================
export const CMS_ACTIONS: ActionMetadata[] = [
  // --- READ-ONLY NAVIGATION & OPENING ACTIONS (Zero Permission Required) ---
  {
    id: "act_nav_complaint_register",
    label: "शिकायत पंजीकरण फॉर्म खोलें",
    module: "COMPLAINTS",
    route: "/complaints/register",
    operationType: "READ_ONLY",
    description: "नागरिक नई शिकायत दर्ज करने का फॉर्म स्क्रीन पर तुरंत खोलता है।",
    invokes: { handler: "router.push", service: "NavigationService" },
    backendEffects: "कोई बैकएंड म्यूटेशन नहीं। केवल UI व्यू लोड होता है।",
    databaseEntities: ["Complaint"],
    confirmationRequired: false,
    synonyms: ["register complaint form kholo", "nayi shikayat form", "complaint registration kholo", "open complaint form"],
  },
  {
    id: "act_nav_fir_register",
    label: "नियमित मुकद्दमा फॉर्म खोलें",
    module: "FIR_WORKSPACE",
    route: "/fir/register",
    operationType: "READ_ONLY",
    description: "नियमित FIR दर्ज करने का स्क्रीन फॉर्म खोलता है।",
    invokes: { handler: "router.push", service: "NavigationService" },
    backendEffects: "कोई डेटाबेस बदलाव नहीं।",
    databaseEntities: ["FIRItem"],
    confirmationRequired: false,
    synonyms: ["fir register form kholo", "nayi fir kholo", "regular fir form", "open fir register"],
  },
  {
    id: "act_nav_gd_new",
    label: "Add Entry GD फॉर्म खोलें",
    module: "GENERAL_DIARY",
    route: "/general-diary/new",
    operationType: "READ_ONLY",
    description: "रोजनामचा आम में नई रपट दर्ज करने का फॉर्म या डायलॉग बॉक्स खोलता है।",
    invokes: { handler: "router.push", service: "NavigationService" },
    backendEffects: "कोई डेटाबेस बदलाव नहीं।",
    databaseEntities: ["GDRecord"],
    confirmationRequired: false,
    synonyms: ["add entry daailogue box kholo", "add entry dialogue box kholo", "nayi gd entry kholo", "rapat entry form kholo"],
  },
  {
    id: "act_open_role_switcher",
    label: "रोल स्विचर डायलॉग बॉक्स खोलें",
    module: "UNIVERSAL",
    route: "MODAL:ROLE_SWITCHER",
    operationType: "READ_ONLY",
    description: "थाना पदभार व भूमिकाएं (SHO, MHC, IO, EO) बदलने का पॉपअप स्क्रीन पर खोलता है।",
    invokes: { handler: "window.dispatchEvent('cms-open-role-switcher')", service: "AuthContext" },
    backendEffects: "कोई डेटाबेस म्यूटेशन नहीं।",
    databaseEntities: ["User"],
    confirmationRequired: false,
    synonyms: ["role switcher dialogue kholo", "role modal kholo", "change role dialog", "switch persona dialog"],
  },
  {
    id: "act_close_dialog",
    label: "सक्रिय डायलॉग बंद करें",
    module: "UNIVERSAL",
    route: "CURRENT_ACTIVE_MODAL",
    operationType: "READ_ONLY",
    description: "वर्तमान में खुली किसी भी स्क्रीन विंडो या डायलॉग बॉक्स को बंद करता है।",
    invokes: { handler: "onClose", service: "UIModalController" },
    backendEffects: "UI विंडो बंद होती है।",
    databaseEntities: [],
    confirmationRequired: false,
    synonyms: ["dialog band karo", "close dialog", "popup band karo", "dialogue close karo"],
  },
  {
    id: "act_nav_general_diary",
    label: "रोजनामचा आम रजिस्टर खोलें",
    module: "GENERAL_DIARY",
    route: "/general-diary",
    operationType: "READ_ONLY",
    description: "थाने का डिजिटल रोजनामचा रजिस्टर खोलता है।",
    invokes: { handler: "router.push", service: "NavigationService" },
    backendEffects: "रीड-ओनली।",
    databaseEntities: ["GDRecord"],
    confirmationRequired: false,
    synonyms: ["general diary register par chalo", "roznamcha kholo", "gd desk dikhao", "general diary page"],
  },
  {
    id: "act_nav_arrest_docs",
    label: "गिरफ़्तारी प्रपत्र वर्कस्पेस खोलें",
    module: "ARREST_DOCS",
    route: "/fir-workspace/arrest-docs",
    operationType: "READ_ONLY",
    description: "4-पृष्ठीय गिरफ़्तारी मेमो व प्रपत्र वर्कस्पेस खोलता है।",
    invokes: { handler: "router.push", service: "NavigationService" },
    backendEffects: "रीड-ओनली।",
    databaseEntities: ["FIRItem"],
    confirmationRequired: false,
    synonyms: ["arrest docs workspace kholo", "arrest memo page", "form 26.8 desk", "arrest documents kholo"],
  },
  {
    id: "act_nav_zimni",
    label: "केस डायरी वर्कस्पेस खोलें",
    module: "ZIMNI",
    route: "/fir-workspace/zimni",
    operationType: "READ_ONLY",
    description: "केस डायरी (Zimni) लिखने का वर्कस्पेस खोलता है।",
    invokes: { handler: "router.push", service: "NavigationService" },
    backendEffects: "रीड-ओनली।",
    databaseEntities: ["FIRCaseDiaryItem"],
    confirmationRequired: false,
    synonyms: ["zimni desk kholo", "case diary workspace", "zimni likhne ka page", "open zimni"],
  },
  {
    id: "act_nav_kalandra",
    label: "कलंदरा वर्कस्पेस खोलें",
    module: "KALANDRA",
    route: "/fir-workspace/kalandra",
    operationType: "READ_ONLY",
    description: "निवारक एवं विनियामक कलंदरा प्रपत्र (107/151, 107/150, 217/248 BNS, 145 आदि) तैयार करने का वर्कस्पेस खोलता है।",
    invokes: { handler: "router.push", service: "NavigationService" },
    backendEffects: "रीड-ओनली।",
    databaseEntities: ["KalandraRecord", "KalandraTemplate"],
    confirmationRequired: false,
    synonyms: ["kalandra workspace kholo", "kalandra tab par chalo", "107 151 kalandra desk", "kalandra dikhao", "open kalandra"],
  },

  // --- PREPARATION ACTIONS (Drafts, Pre-fills, Document Generation - Explicit Approval Required) ---
  {
    id: "act_prepare_arrest_docs",
    label: "गिरफ़्तारी प्रपत्र तैयार करें (Form 26.8)",
    module: "ARREST_DOCS",
    route: "/fir-workspace/arrest-docs",
    operationType: "PREPARATION",
    description: "अभियुक्त के 6 वैधानिक गिरफ़्तारी प्रपत्र तैयार करता है और प्रिव्यू प्रस्तुत करता है।",
    invokes: { handler: "AgentDocumentEngine.generateArrestDossierHtml", service: "AgentDocumentEngine" },
    backendEffects: "ड्राफ्ट तैयार करता है। जब तक उपयोगकर्ता स्वीकृत न करे तब तक केस फाइल में सेव नहीं होता।",
    databaseEntities: ["FIRDocumentItem", "AccusedPerson"],
    confirmationRequired: true,
    synonyms: ["arrest memo banao", "arrest documents taiyar karo", "form 26.8 banao", "jamatalashi memo banao"],
  },
  {
    id: "act_prepare_gd_draft",
    label: "रोजनामचा इंद्राज ड्राफ्ट बनाएं",
    module: "GENERAL_DIARY",
    route: "/general-diary?tab=SUGGESTIONS_DRAFTS",
    operationType: "PREPARATION",
    description: "Smart GD के ड्राफ्ट्स व सुझाव टैब में नई रपट का ड्राफ्ट तैयार करता है।",
    invokes: { handler: "GeneralDiaryService.addSuggestionDraft", service: "GeneralDiaryService" },
    backendEffects: "GD Auto-Suggestions टैब में अनलॉक्ड ड्राफ्ट सेव करता है जिसे मुंशी वेरीफाई करता है।",
    databaseEntities: ["GDRecord"],
    confirmationRequired: true,
    synonyms: ["gd draft karo", "roznamcha me entry draft karo", "gd suggestion banao", "rapat draft karo"],
  },
  {
    id: "act_prepare_zimni_draft",
    label: "केस डायरी (Zimni) ड्राफ्ट बनाएं",
    module: "ZIMNI",
    route: "/fir-workspace/zimni",
    operationType: "PREPARATION",
    description: "धारा 192 BNSS के तहत दैनिक तफ्तीश ज़िमनी का ड्राफ्ट तैयार करता है।",
    invokes: { handler: "AgentDocumentEngine.generateZimniHtml", service: "AgentDocumentEngine" },
    backendEffects: "केस डायरी ड्राफ्ट बनाता है।",
    databaseEntities: ["FIRCaseDiaryItem"],
    confirmationRequired: true,
    synonyms: ["zimni draft karo", "case diary likho", "zimni entry banao", "tafteesh zimni draft"],
  },
  {
    id: "act_prepare_kalandra_draft",
    label: "कलंदरा ड्राफ्ट तैयार करें",
    module: "KALANDRA",
    route: "/fir-workspace/kalandra",
    operationType: "PREPARATION",
    description: "शांति भंग की आशंका (107/151 CrPC), लोक न्यूसेंस (217 BNS) या भूमि विवाद (145 CrPC) बाबत सम्पूर्ण कलंदरा रिपोर्ट व न्यायालय अग्रेषण पैकेज तैयार करता है।",
    invokes: { handler: "kalandraService.saveRecord", service: "KALANDRA" },
    backendEffects: "कलंदरा ड्राफ्ट तैयार करता है।",
    databaseEntities: ["KalandraRecord"],
    confirmationRequired: true,
    synonyms: ["kalandra draft karo", "107 151 kalandra banao", "217 bns kalandra taiyar karo", "kalandra generate karo", "shanti bhang kalandra"],
  },
  {
    id: "act_prepare_notice_35",
    label: "हाजिरी नोटिस तैयार करें (धारा 35(3) BNSS)",
    module: "FIR_WORKSPACE",
    route: "/fir/[id]",
    operationType: "PREPARATION",
    description: "अन्वेषण में हाजिरी हेतु धारा 35(3) BNSS नोटिस का कानूनी ड्राफ्ट तैयार करता है।",
    invokes: { handler: "AgentDocumentEngine.generateNotice35BnssHtml", service: "AgentDocumentEngine" },
    backendEffects: "नोटिस ड्राफ्ट तैयार करता है।",
    databaseEntities: ["FIRDocumentItem"],
    confirmationRequired: true,
    synonyms: ["dhara 35 notice banao", "35(3) bnss notice", "notice of appearance banao", "41a crpc / 35 bnss notice"],
  },
  {
    id: "act_prepare_notice_91",
    label: "दस्तावेज़ तलब नोटिस तैयार करें (धारा 91 BNSS)",
    module: "FIR_WORKSPACE",
    route: "/fir/[id]",
    operationType: "PREPARATION",
    description: "दस्तावेज़/रिकॉर्ड प्रस्तुत करने हेतु धारा 91 BNSS नोटिस तैयार करता है।",
    invokes: { handler: "AgentDocumentEngine.generateNotice91BnssHtml", service: "AgentDocumentEngine" },
    backendEffects: "दस्तावेज़ तलब नोटिस ड्राफ्ट तैयार करता है।",
    databaseEntities: ["FIRDocumentItem"],
    confirmationRequired: true,
    synonyms: ["dhara 91 notice banao", "document talab notice", "summons u/s 91 bnss", "bank statement talab notice"],
  },

  // --- STATE-CHANGING ACTIONS (Strict User Approval Required) ---
  {
    id: "act_assign_eo",
    label: "जांच अधिकारी (EO) नियुक्त करें",
    module: "COMPLAINTS",
    route: "/complaints/[id]",
    operationType: "STATE_CHANGING",
    description: "शिकायत पर नए जांच अधिकारी (EO) का आधिकारिक आवंटन करता है।",
    invokes: { handler: "ComplaintService.assignEnquiryOfficer", service: "ComplaintService", apiEndpoint: "/api/complaints" },
    backendEffects: "शिकायत डेटाबेस में `assignedEoId`, `assignedEoName` अपडेट करता है, स्टेटस `UNDER_ENQUIRY` करता है व ऑडिट लॉग दर्ज करता है।",
    databaseEntities: ["Complaint", "AuditLog"],
    requiredRoles: ["SHO", "SUPER_ADMIN"],
    confirmationRequired: true,
    synonyms: ["eo assign karo", "enquiry officer allot karo", "is complaint ko eo do", "janch adhikari niyukt karo"],
  },
  {
    id: "act_execute_multi_step_workflow",
    label: "संयुक्त बहु-चरणीय कार्य निष्पादन",
    module: "UNIVERSAL",
    route: "/fir/[id]",
    operationType: "STATE_CHANGING",
    description: "केस लोड, अरेस्ट प्रपत्र जनरेशन, GD ड्राफ्ट और केस फ़ाइल अपडेट एक साथ निष्पादित करता है।",
    invokes: { handler: "CmsAgentService.executeActionPlan", service: "CmsAgentService" },
    backendEffects: "बहु-टेबल म्यूटेशन: FIR दस्तावेज संग्रह व General Diary सुझाव में प्रविष्टियां सुरक्षित करता है।",
    databaseEntities: ["FIRItem", "FIRDocumentItem", "GDRecord", "AuditLog"],
    confirmationRequired: true,
    requiresOfficialApproval: true,
    synonyms: ["saare required documents taiyar karo", "arrest docs aur gd draft banao", "composite case workflow"],
  },
  {
    id: "act_comp_create",
    label: "नागरिक शिकायत दर्ज करें",
    module: "COMPLAINTS",
    route: "/complaints/register",
    operationType: "STATE_CHANGING",
    description: "नागरिक की नई शिकायत को आधिकारिक रिकॉर्ड में दर्ज करता है।",
    invokes: { handler: "ComplaintService.createComplaint", service: "ComplaintService", apiEndpoint: "/api/complaints" },
    backendEffects: "डेटाबेस में नई Complaint आईडी बनाता है और स्टेटस REGISTERED करता है।",
    databaseEntities: ["Complaint", "AuditLog"],
    confirmationRequired: true,
    requiresOfficialApproval: true,
    synonyms: ["register complaint", "shikayat darj karo", "complaint likho", "save complaint"],
  },
  {
    id: "act_comp_transfer",
    label: "शिकायत थाना स्थानांतरण",
    module: "COMPLAINTS",
    route: "/complaints/[id]",
    operationType: "STATE_CHANGING",
    description: "शिकायत को क्षेत्राधिकार अनुसार अन्य थाने में स्थानांतरित करता है।",
    invokes: { handler: "ComplaintService.transferComplaint", service: "ComplaintService", apiEndpoint: "/api/complaints" },
    backendEffects: "शिकायत की स्थिति TRANSFERRED_OTHER_PS करता है और स्थानांतरण इतिहास दर्ज करता है।",
    databaseEntities: ["Complaint", "AuditLog"],
    requiredRoles: ["SHO", "SUPER_ADMIN"],
    confirmationRequired: true,
    requiresOfficialApproval: true,
    synonyms: ["transfer complaint", "doosre thane bhejo", "dusre thane bhejo", "sadar thane bhejo", "sadar karnal transfer", "thane transfer karo", "transfer"],
  },
];

// ============================================================================
// 4. COMPLETE MULTI-STEP WORKFLOW METADATA KNOWLEDGE GRAPH
// ============================================================================
export const CMS_WORKFLOWS: WorkflowMetadata[] = [
  {
    id: "wf_arrest_and_gd",
    title: "गिरफ़्तारी प्रपत्र व रोजनामचा इंद्राज संयुक्त प्रवाह (Arrest Dossier & GD Workflow)",
    description: "अभियुक्त की गिरफ़्तारी पर आवश्यक सभी 6 कानूनी प्रपत्र (Form 26.8, फर्द जामातालाशी, BNSS 47, 48, 53, 187) तैयार करना और थाने के GD में दाखिला रपट ड्राफ्ट करना।",
    primaryModule: "ARREST_DOCS",
    prerequisites: ["वैध FIR नंबर", "अभियुक्त का नाम"],
    synonyms: [
      "arrest documents aur gd banao",
      "arrest memo aur roznamcha entry",
      "anil kumar arrest docs aur gd",
      "is case ke saare required documents taiyar karo",
    ],
    steps: [
      {
        stepNumber: 1,
        actionId: "act_search_records",
        description: "केस फ़ाइल व अभियुक्त रिकॉर्ड सत्यापन",
        isStateChanging: false,
        handler: "firService.getAllFirs",
      },
      {
        stepNumber: 2,
        actionId: "act_prepare_arrest_docs",
        description: "4-पृष्ठीय गिरफ़्तारी मेमो व जामातालाशी फर्द तैयार करना",
        isStateChanging: false,
        handler: "AgentDocumentEngine.generateArrestDossierHtml",
      },
      {
        stepNumber: 3,
        actionId: "act_prepare_gd_draft",
        description: "रोजनामचा दाखिला गिरफ़्तारी रपट ड्राफ्ट तैयार करना",
        isStateChanging: false,
        handler: "GeneralDiaryService.addSuggestionDraft",
      },
      {
        stepNumber: 4,
        actionId: "act_execute_multi_step_workflow",
        description: "अधिकारी की स्वीकृति के पश्चात केस फाइल व GD में सेव करना",
        isStateChanging: true,
        handler: "CmsAgentService.executeActionPlan",
      },
    ],
  },
  {
    id: "wf_complaint_to_eo",
    title: "नागरिक शिकायत पंजीकरण से EO आवंटन प्रवाह (Complaint Intake & EO Assignment)",
    description: "नागरिक दरख्वास्त का सत्यापन, संज्ञेयता जांच, शिकायत पंजीकरण और उपयुक्त जांच अधिकारी (EO) का आवंटन।",
    primaryModule: "COMPLAINTS",
    prerequisites: ["शिकायतकर्ता का नाम", "मोबाइल नंबर", "घटना विवरण"],
    synonyms: [
      "shikayat darj karke eo assign karo",
      "nayi complaint lo aur eo lagao",
      "intake complaint and assign eo",
    ],
    steps: [
      {
        stepNumber: 1,
        actionId: "act_nav_complaint_register",
        description: "शिकायत पंजीकरण फॉर्म लोड करना",
        isStateChanging: false,
        handler: "router.push",
      },
      {
        stepNumber: 2,
        actionId: "act_autofill_form",
        description: "शिकायतकर्ता व घटना विवरण प्री-फिल करना",
        isStateChanging: false,
        handler: "CmsAgentService.fillRegisteredForm",
      },
      {
        stepNumber: 3,
        actionId: "act_assign_eo",
        description: "जांच अधिकारी (EO) का आवंटन करना",
        isStateChanging: true,
        handler: "ComplaintService.assignEnquiryOfficer",
      },
    ],
  },
  {
    id: "wf_legal_notice_issuance",
    title: "वैधानिक नोटिस निर्गमन प्रवाह (Statutory Legal Notice Issuance)",
    description: "केस रिकॉर्ड्स से अभियुक्त/गवाह को धारा 35(3) या 91 BNSS का नोटिस तैयार करना व केस पत्रावली में संलग्न करना।",
    primaryModule: "FIR_WORKSPACE",
    prerequisites: ["सक्रिय FIR", "लक्षित व्यक्ति का नाम"],
    synonyms: [
      "notice banao aur dispatch karo",
      "35 bnss notice dispatch",
      "dhara 91 notice dispatch",
    ],
    steps: [
      {
        stepNumber: 1,
        actionId: "act_prepare_notice_35",
        description: "कानूनी प्रारूप के अनुसार नोटिस तैयार करना",
        isStateChanging: false,
        handler: "AgentDocumentEngine.generateNotice35BnssHtml",
      },
      {
        stepNumber: 2,
        actionId: "act_save_notice",
        description: "स्वीकृति पश्चात केस पत्रावली में संलग्न करना",
        isStateChanging: true,
        handler: "firService.addDocument",
      },
    ],
  },
  {
    id: "wf_transfer_complaint_and_gd",
    title: "थाना स्थानांतरण व रवानगी रपट संयुक्त प्रवाह (Complaint Transfer & GD Dispatch Workflow)",
    description: "शिकायत को क्षेत्राधिकार अनुसार अन्य थाने में स्थानांतरित करना और रोजनामचा में रवानगी प्रविष्टि दर्ज करना।",
    primaryModule: "COMPLAINTS",
    prerequisites: ["शिकायत संख्या", "गंतव्य थाना"],
    synonyms: [
      "complaint transfer aur gd",
      "doosre thane bhejo aur gd draft karo",
      "sadar thane transfer aur rapat",
    ],
    steps: [
      {
        stepNumber: 1,
        actionId: "act_search_records",
        description: "शिकायत रिकॉर्ड का सत्यापन",
        isStateChanging: false,
        handler: "ComplaintService.getComplaints",
      },
      {
        stepNumber: 2,
        actionId: "act_comp_transfer",
        description: "शिकायत का आधिकारिक स्थानांतरण",
        isStateChanging: true,
        handler: "ComplaintService.transferComplaint",
      },
      {
        stepNumber: 3,
        actionId: "act_prepare_gd_draft",
        description: "रोजनामचा रवानगी रपट ड्राफ्ट तैयार करना",
        isStateChanging: false,
        handler: "GeneralDiaryService.addSuggestionDraft",
      },
    ],
  },
];

// ============================================================================
// 5. APPLICATION CAPABILITIES LIST
// ============================================================================
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
    id: "prepare_kalandra_dossier",
    name: "कलंदरा रिपोर्ट एवं न्यायालय अग्रेषण पैकेज तैयार करना (Draft Kalandra Dossier)",
    module: "KALANDRA",
    description: "107/151 CrPC (BNSS 126/170), 217 BNS (Public Nuisance), 248 BNS, 145 CrPC या 72 IPC/7/16 बाबत सम्पूर्ण कलंदरा पत्रावली, प्रेषण पत्र, मौका आख्या व गवाह सूची तैयार करना।",
    isMutation: true,
    requiresExplicitApproval: true,
    exampleQueries: [
      "107/151 CrPC ka kalandra bana do",
      "Suresh Kumar ke khilaf 107 151 kalandra draft karo",
      "Public nuisance u/s 217 BNS ka kalandra prepare karo",
      "Kalandra workspace kholo",
      "Investigation me kalandra tab dikhao",
    ],
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

// ============================================================================
// 6. CMS CAPABILITY REGISTRY & INTROSPECTION ENGINE
// ============================================================================
export class CmsCapabilityRegistry {
  public static getAll(): CMSCapability[] {
    return CMS_CAPABILITIES;
  }

  public static getRoutes(): WebsiteRouteInfo[] {
    return WEBSITE_ARCHITECTURE;
  }

  public static getFields(): FieldMetadata[] {
    return CMS_FIELDS;
  }

  public static getActions(): ActionMetadata[] {
    return CMS_ACTIONS;
  }

  public static getWorkflows(): WorkflowMetadata[] {
    return CMS_WORKFLOWS;
  }

  public static getFieldMetadata(fieldId: string): FieldMetadata | null {
    return CMS_FIELDS.find((f) => f.id === fieldId || f.fieldName === fieldId) || null;
  }

  public static getActionMetadata(actionId: string): ActionMetadata | null {
    return CMS_ACTIONS.find((a) => a.id === actionId) || null;
  }

  public static getWorkflowMetadata(workflowId: string): WorkflowMetadata | null {
    return CMS_WORKFLOWS.find((w) => w.id === workflowId) || null;
  }

  public static understandPageSchema(routePath: string): PageSchema {
    const route = WEBSITE_ARCHITECTURE.find((r) => r.path === routePath) || WEBSITE_ARCHITECTURE[0];
    const clean = routePath.replace(/\//g, "_").replace(/^_/, "").replace(/s_/, "_");
    const fields = CMS_FIELDS.filter(
      (f) =>
        f.formId.includes(clean) ||
        (routePath.includes("complaint") && f.formId.includes("complaint")) ||
        (routePath.includes("fir") && f.formId.includes("fir")) ||
        (routePath.includes("general-diary") && f.formId.includes("gd"))
    );
    const actions = CMS_ACTIONS.filter(
      (a) =>
        a.route === routePath ||
        (routePath.includes("complaint") && a.module === "COMPLAINTS") ||
        (routePath.includes("fir") && (a.module === "FIR_WORKSPACE" || a.module === "ARREST_DOCS")) ||
        (routePath.includes("general-diary") && a.module === "GENERAL_DIARY")
    );

    return {
      route: route.path,
      title: route.title,
      category: route.category,
      description: route.description,
      forms: [
        {
          formId: `form_${route.path.replace(/\//g, "_")}`,
          title: route.title,
          fields,
        },
      ],
      availableActions: actions,
      supportedRoles: route.requiredRoles,
    };
  }

  public static classifyOperation(actionId: string): OperationClassification {
    const action = this.getActionMetadata(actionId);
    if (action) return action.operationType;
    if (actionId.startsWith("nav_") || actionId.startsWith("get_") || actionId.startsWith("search_")) {
      return "READ_ONLY";
    }
    if (actionId.startsWith("prepare_") || actionId.startsWith("draft_") || actionId.startsWith("autofill_")) {
      return "PREPARATION";
    }
    return "STATE_CHANGING";
  }

  /**
   * Deep Semantic Intent Matching & Candidate Ranking Pipeline
   * Takes user's natural query + current path context and scores all capabilities
   */
  public static semanticMatch(query: string, currentPath?: string): CandidateCapabilityMatch[] {
    const q = (query || "").toLowerCase().trim();
    if (!q) return [];

    const candidates: CandidateCapabilityMatch[] = [];

    // 1. Match against Workflows
    for (const wf of CMS_WORKFLOWS) {
      let score = 0;
      let matchedSyn = "";
      for (const syn of wf.synonyms) {
        if (q.includes(syn.toLowerCase())) {
          score = Math.max(score, 0.95);
          matchedSyn = syn;
        }
      }
      if (score === 0) {
        const tokens = q.split(/\s+/);
        const matchCount = tokens.filter((t) => t.length > 2 && wf.description.toLowerCase().includes(t)).length;
        if (matchCount >= 3) {
          score = Math.min(0.85, 0.5 + matchCount * 0.1);
        }
      }
      if (score > 0.4) {
        candidates.push({
          capabilityId: wf.id,
          type: "WORKFLOW",
          title: wf.title,
          confidenceScore: score,
          matchedSynonym: matchedSyn,
          operationType: "STATE_CHANGING",
          requiresApproval: true,
          reasoning: `Matched multi-step workflow: '${wf.title}' with score ${score.toFixed(2)}`,
        });
      }
    }

    // 2. Match against Actions
    for (const act of CMS_ACTIONS) {
      let score = 0;
      let matchedSyn = "";
      for (const syn of act.synonyms) {
        if (q.includes(syn.toLowerCase())) {
          score = Math.max(score, 0.92);
          matchedSyn = syn;
        }
      }
      if (score === 0) {
        if (q.includes(act.label.toLowerCase())) {
          score = 0.85;
        }
      }
      // Context boost if action matches current route
      if (score > 0 && currentPath && act.route === currentPath) {
        score = Math.min(1.0, score + 0.08);
      }
      if (score > 0.5) {
        candidates.push({
          capabilityId: act.id,
          type: "ACTION",
          title: act.label,
          confidenceScore: score,
          matchedSynonym: matchedSyn,
          operationType: act.operationType,
          requiresApproval: act.confirmationRequired,
          reasoning: `Matched action '${act.label}' (${act.operationType}) with score ${score.toFixed(2)}`,
        });
      }
    }

    // 3. Match against Routes (Navigation)
    const targetRoute = this.findRoute(query);
    if (targetRoute) {
      candidates.push({
        capabilityId: targetRoute.path,
        type: "ROUTE",
        title: targetRoute.title,
        confidenceScore: 0.9,
        operationType: "READ_ONLY",
        requiresApproval: false,
        reasoning: `Matched website page/dialogue route: '${targetRoute.title}' (${targetRoute.path})`,
      });
    }

    // Sort descending by confidenceScore
    return candidates.sort((a, b) => b.confidenceScore - a.confidenceScore);
  }

  /**
   * Fast robust route finder with comprehensive police synonyms and variations
   */
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
      q.includes("switch role") ||
      q.includes("switch persona")
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
      (q.includes("complaint") || q.includes("shikayat") || q.includes("शिकायत") || q.includes("application")) &&
      (q.includes("register") ||
        q.includes("form") ||
        q.includes("nayi") ||
        q.includes("darj") ||
        q.includes("likho") ||
        q.includes("leni") ||
        q.includes("lena") ||
        q.includes("darj karo") ||
        q.includes("box") ||
        q.includes("dialog") ||
        q.includes("daailogue"))
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

    // 5.5 Kalandra Workspace (कलंदरा)
    if (
      q.includes("kalandra") ||
      q.includes("कलंदरा") ||
      q.includes("107/151") ||
      q.includes("107 151") ||
      q.includes("107/150") ||
      q.includes("217 bns") ||
      q.includes("248 bns") ||
      (q.includes("investigation") && q.includes("kalandra"))
    ) {
      return WEBSITE_ARCHITECTURE.find((r) => r.path === "/fir-workspace/kalandra") || null;
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
