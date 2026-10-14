import {
  KalandraLegalStatus,
  KalandraWorkflowStatus,
  KalandraTypeCode,
  KalandraTemplate,
  KalandraRecord,
  KalandraDocumentPackage,
  KalandraWitness,
  KalandraSupportingDoc,
} from "@/types/kalandra";
import { firService } from "./firService";
import { ComplaintService } from "./complaintService";
import { GeneralDiaryService } from "./generalDiaryService";

const KALANDRA_RECORDS_KEY = "haryana_police_cms_kalandras_v1";
const KALANDRA_TEMPLATES_KEY = "haryana_police_cms_kalandra_templates_v1";

export const INITIAL_KALANDRA_TEMPLATES: KalandraTemplate[] = [
  {
    id: "tmpl-107-151",
    code: "107_151",
    titleEn: "Kalandra u/s 107/151 CrPC (Sec 126/170 BNSS) - Breach of Peace & Preventive Arrest",
    titleHi: "कलंदरा जेर दफा 107/151 जा०फौ० (धारा 126/170 BNSS) - शांति भंग की आशंका एवं निवारक गिरफ्तारी",
    actEn: "Code of Criminal Procedure, 1973 / Bharatiya Nagarik Suraksha Sanhita, 2023",
    actHi: "दंड प्रक्रिया संहिता, 1973 / भारतीय नागरिक सुरक्षा संहिता, 2023",
    section: "Sec 107/151 CrPC (Sec 126/170 BNSS)",
    legalStatus: "VERIFIED_STATUTORY",
    proceduralContext: "Preventive proceedings to bind down habitual agitators or disputing parties to keep peace and prevent cognizable breach of tranquility.",
    defaultCourtEn: "Court of Sub-Divisional Magistrate (SDM) / Executive Magistrate",
    defaultCourtHi: "न्यायालय उप-मंडल मजिस्ट्रेट (एस.डी.एम.) / कार्यपालक दंडाधिकारी",
    version: "1.0",
    isApproved: true,
    supportingDocumentsList: [
      "Daily Diary (GD / Roznamcha) Extract",
      "Spot Inspection Memo (मौका मुआयना)",
      "Statements of Respectable Persons / Witnesses (बयान गवाहान)",
      "Criminal History Sheet / Previous Challan Records",
      "Medical Examination Report of Arrested Person"
    ],
    defaultNarrativeTemplateHi: `सेवा में,\nश्रीमान उप-मंडल मजिस्ट्रेट (कार्यपालक दंडाधिकारी),\nजिला {{district}}, हरियाणा।\n\nविषय: कलंदरा जेर दफा 107/151 जा०फौ० (धारा 126/170 BNSS) बाबत शांति भंग की आशंका।\n\nश्रीमान जी,\nनिवेदन यह है कि आज दिनांक {{incidentDate}} को वक्त {{incidentTime}} पर मौजा {{incidentPlace}} से विश्वसनीय सूचना प्राप्त हुई कि विपक्षी {{respondentName}} पुत्र {{respondentFather}} निवासी {{respondentAddress}} सरेआम उत्तेजित होकर गाली-गलौज व मारपीट पर आमादा है जिससे क्षेत्र में शांति भंग होने तथा संज्ञेय अपराध घटित होने का भारी अंदेशा पैदा हो गया है।\n\nमौके पर पुलिस पार्टी के पहुंचने पर उक्त व्यक्ति को शांत रहने की हिदायत दी गई परंतु उसने पुलिस हिदायत की परवाह न करते हुए उग्र रुख अपनाया। शांति व्यवस्था बनाए रखने हेतु उक्त विपक्षी को जेर दफा 151 CrPC (170 BNSS) के तहत हिरासत में लिया गया।\n\nअतः सादर प्रार्थना है कि विपक्षी को जेर दफा 107 CrPC (126 BNSS) के तहत तलब फरमाकर एक वर्ष की अवधि हेतु शांति व्यवस्था बनाए रखने बाबत मुचलका व दो जामिन पाबंद फरमाए जाने का आदेश जारी करने की कृपा करें।`,
    defaultNarrativeTemplateEn: `To,\nThe Learned Sub-Divisional Magistrate / Executive Magistrate,\nDistrict {{district}}, Haryana.\n\nSub: Kalandra u/s 107/151 Cr.P.C. (Sections 126/170 BNSS) regarding apprehension of breach of public peace.\n\nSir,\nIt is respectfully submitted that on {{incidentDate}} at about {{incidentTime}}, reliable information was received from {{incidentPlace}} that respondent {{respondentName}} s/o {{respondentFather}} r/o {{respondentAddress}} was engaged in violent altercations, creating imminent danger of cognizable breach of public peace and tranquility.\n\nUpon reaching the spot, the police party warned the respondent to maintain tranquility; however, the respondent refused and remained aggressive. To avert immediate breach of peace, the respondent was detained u/s 151 Cr.P.C. (170 BNSS).\n\nIt is therefore prayed that respondent be bound down u/s 107 Cr.P.C. (126 BNSS) to execute personal bond with two local sureties for maintaining peace for a period of one year.`,
    fields: [
      { id: "respondentName", name: "respondentName", labelHi: "विपक्षी / गैर-सायल का नाम", labelEn: "Respondent Name", type: "text", isRequired: true },
      { id: "respondentFather", name: "respondentFather", labelHi: "पिता / पति का नाम", labelEn: "Father's / Husband's Name", type: "text", isRequired: true },
      { id: "respondentAddress", name: "respondentAddress", labelHi: "पता", labelEn: "Address", type: "text", isRequired: true },
      { id: "secondPartyName", name: "secondPartyName", labelHi: "द्वितीय पक्ष (यदि लागू हो)", labelEn: "Second Party (if applicable)", type: "text", isRequired: false },
      { id: "incidentPlace", name: "incidentPlace", labelHi: "घटना स्थल / विवाद स्थल", labelEn: "Place of Incident", type: "text", isRequired: true },
      { id: "factsAndCircumstances", name: "factsAndCircumstances", labelHi: "तथ्य एवं परिस्थितियां (कलंदरा विवरण)", labelEn: "Facts & Circumstances", type: "textarea", isRequired: true },
      { id: "proposedAction", name: "proposedAction", labelHi: "प्रार्थना / प्रस्तावित आदेश", labelEn: "Prayer / Proposed Action", type: "textarea", isRequired: true }
    ]
  },
  {
    id: "tmpl-107-150",
    code: "107_150",
    titleEn: "Kalandra u/s 107/150 CrPC (Sec 126/169 BNSS) - Security for Peace (Summons Mode)",
    titleHi: "कलंदरा जेर दफा 107/150 जा०फौ० (धारा 126/169 BNSS) - शांति व्यवस्था मुचलका (समन प्रक्रिया)",
    actEn: "Code of Criminal Procedure, 1973 / BNSS 2023",
    actHi: "दंड प्रक्रिया संहिता, 1973 / भारतीय नागरिक सुरक्षा संहिता, 2023",
    section: "Sec 107/150 CrPC (Sec 126/169 BNSS)",
    legalStatus: "NEEDS_LEGAL_MAPPING_VERIFICATION",
    legalNoticeHi: "विधि सत्यापन प्रतीक्षित: यह प्रारूप धारा 107/150 CrPC (126/169 BNSS) से संबंधित है। गैर-हिरासत समन प्रक्रिया एवं राज्य पुलिस परिपत्रों के अनुसार सत्यापन आवश्यक है।",
    legalNoticeEn: "Needs Legal Mapping Verification: Referenced under CrPC 107/150 (BNSS 126/169) for non-custodial summons procedure. Statutory review pending under state police standing orders.",
    proceduralContext: "Where breach of peace is likely but no instant preventive detention u/s 151 was effected, praying for issuance of summons to respondent.",
    defaultCourtEn: "Court of Executive Magistrate / SDM",
    defaultCourtHi: "न्यायालय कार्यपालक दंडाधिकारी / एस.डी.एम.",
    version: "1.0",
    isApproved: false,
    supportingDocumentsList: [
      "Roznamcha Diary Extract",
      "Public Statements",
      "Local Intelligence Enquiry Report"
    ],
    defaultNarrativeTemplateHi: `सेवा में,\nश्रीमान कार्यपालक दंडाधिकारी / SDM,\nजिला {{district}}, हरियाणा।\n\nविषय: कलंदरा जेर दफा 107/150 जा०फौ० (धारा 126/169 BNSS) बाबत जारी समन पाबंदी अमन।\n\nश्रीमान जी,\nनिवेदन है कि विपक्षी {{respondentName}} पुत्र {{respondentFather}} निवासी {{respondentAddress}} द्वारा मौजा {{incidentPlace}} में तनाव उत्पन्न किया जा रहा है। विपक्षी किसी भी समय शांति भंग कर सकता है।\n\nअतः जेर दफा 107/150 CrPC (126/169 BNSS) के तहत विपक्षी को नोटिस/समन जारी कर हाजिर अदालत तलब फरमाकर पाबंद फरमाया जावे।`,
    defaultNarrativeTemplateEn: `To,\nThe Learned Executive Magistrate / SDM,\nDistrict {{district}}, Haryana.\n\nSub: Report u/s 107/150 CrPC (Sec 126/169 BNSS) for summoning respondent.\n\nSir,\nIt is submitted that respondent {{respondentName}} s/o {{respondentFather}} r/o {{respondentAddress}} is prone to disturbing public tranquility at {{incidentPlace}}. Issuance of summons u/s 107/150 CrPC (126/169 BNSS) is recommended to prevent impending breach of peace.`,
    fields: [
      { id: "respondentName", name: "respondentName", labelHi: "विपक्षी का नाम", labelEn: "Respondent Name", type: "text", isRequired: true },
      { id: "respondentFather", name: "respondentFather", labelHi: "पिता का नाम", labelEn: "Father's Name", type: "text", isRequired: true },
      { id: "respondentAddress", name: "respondentAddress", labelHi: "निवास पता", labelEn: "Address", type: "text", isRequired: true },
      { id: "incidentPlace", name: "incidentPlace", labelHi: "स्थान", labelEn: "Location", type: "text", isRequired: true },
      { id: "factsAndCircumstances", name: "factsAndCircumstances", labelHi: "तथ्य विवरण", labelEn: "Facts & Allegations", type: "textarea", isRequired: true },
      { id: "proposedAction", name: "proposedAction", labelHi: "प्रार्थना", labelEn: "Prayer", type: "textarea", isRequired: true }
    ]
  },
  {
    id: "tmpl-217-bns",
    code: "217_BNS",
    titleEn: "Kalandra u/s 217 Bharatiya Nyaya Sanhita, 2023 - Public Nuisance (Formerly Sec 268/290 IPC)",
    titleHi: "कलंदरा धारा 217 भारतीय न्याय संहिता (BNS 2023) - लोक उपद्रव / न्यूसेंस (पूर्व धारा 268/290 IPC)",
    actEn: "Bharatiya Nyaya Sanhita, 2023",
    actHi: "भारतीय न्याय संहिता, 2023",
    section: "Section 217 BNS (Old Sec 268/290 IPC)",
    legalStatus: "VERIFIED_STATUTORY",
    proceduralContext: "Prosecution kalandra presented before Judicial Magistrate for public nuisance, obstruction, unlawful noise or common injury/annoyance to general public.",
    defaultCourtEn: "Court of Judicial Magistrate First Class (JMFC)",
    defaultCourtHi: "न्यायालय मुख्य न्यायिक दंडाधिकारी / न्यायिक दंडाधिकारी प्रथम श्रेणी",
    version: "1.0",
    isApproved: true,
    supportingDocumentsList: [
      "Roznamcha GD Entry",
      "Spot Inspection / Photography Memo",
      "Witness Statements (स्थानीय नागरिकों के बयान)",
      "Notice / Seizure of Nuisance Causing Apparatus (यदि लागू हो)"
    ],
    defaultNarrativeTemplateHi: `सेवा में,\nश्रीमान न्यायिक दंडाधिकारी प्रथम श्रेणी,\nजिला {{district}}, हरियाणा।\n\nविषय: कलंदरा धारा 217 भारतीय न्याय संहिता, 2023 बाबत लोक न्यूसेंस (Public Nuisance)।\n\nश्रीमान जी,\nनिवेदन है कि आज दिनांक {{incidentDate}} को वक्त {{incidentTime}} पर स्थान {{incidentPlace}} पर आरोपी {{respondentName}} पुत्र {{respondentFather}} निवासी {{respondentAddress}} द्वारा सार्वजनिक मार्ग पर अनुचित बाधा उत्पन्न कर / तीव्र ध्वनि विस्तारक यंत्र बजाकर / खुले में उपद्रव कर आम जनता व राहगीरों हेतु घोर असुविधा व न्यूसेंस पैदा किया गया।\n\nउक्त कृत्य धारा 217 BNS 2023 के तहत दंडनीय अपराध है। आरोपी के विरुद्ध साक्ष्य व गवाहान मौजूद हैं।\n\nअतः प्रार्थना है कि आरोपी के विरुद्ध संज्ञान लेकर नियमानुसार समन/कार्रवाई अमल में लाई जावे।`,
    defaultNarrativeTemplateEn: `To,\nThe Learned Judicial Magistrate First Class,\nDistrict {{district}}, Haryana.\n\nSub: Kalandra under Section 217 Bharatiya Nyaya Sanhita (BNS 2023) - Public Nuisance.\n\nSir,\nIt is submitted that on {{incidentDate}} at {{incidentTime}} at {{incidentPlace}}, the accused {{respondentName}} s/o {{respondentFather}} r/o {{respondentAddress}} committed public nuisance causing common annoyance and obstruction to the general public.\n\nThe act constitutes an offence punishable u/s 217 BNS 2023. It is prayed that cognizance be taken and accused summoned to face trial.`,
    fields: [
      { id: "respondentName", name: "respondentName", labelHi: "आरोपी का नाम", labelEn: "Accused Name", type: "text", isRequired: true },
      { id: "respondentFather", name: "respondentFather", labelHi: "पिता का नाम", labelEn: "Father's Name", type: "text", isRequired: true },
      { id: "respondentAddress", name: "respondentAddress", labelHi: "पता", labelEn: "Address", type: "text", isRequired: true },
      { id: "incidentPlace", name: "incidentPlace", labelHi: "घटना स्थल", labelEn: "Place of Occurrence", type: "text", isRequired: true },
      { id: "factsAndCircumstances", name: "factsAndCircumstances", labelHi: "न्यूसेंस / उपद्रव का पूर्ण विवरण", labelEn: "Details of Public Nuisance", type: "textarea", isRequired: true },
      { id: "proposedAction", name: "proposedAction", labelHi: "प्रार्थना (संज्ञान एवं चालान बाबत)", labelEn: "Relief / Cognizance Prayer", type: "textarea", isRequired: true }
    ]
  },
  {
    id: "tmpl-248-bns",
    code: "248_BNS",
    titleEn: "Kalandra u/s 248 Bharatiya Nyaya Sanhita, 2023 - Obscene Acts & Songs (Formerly Sec 294 IPC)",
    titleHi: "कलंदरा धारा 248 भारतीय न्याय संहिता (BNS 2023) - सार्वजनिक स्थान पर अश्लील कृत्य/गाना (पूर्व धारा 294 IPC)",
    actEn: "Bharatiya Nyaya Sanhita, 2023",
    actHi: "भारतीय न्याय संहिता, 2023",
    section: "Section 248 BNS (Old Sec 294 IPC)",
    legalStatus: "VERIFIED_STATUTORY",
    proceduralContext: "Police complaint/kalandra presented for doing obscene acts, singing obscene songs or uttering obscene words in public place causing annoyance.",
    defaultCourtEn: "Court of Judicial Magistrate First Class (JMFC)",
    defaultCourtHi: "न्यायालय न्यायिक दंडाधिकारी प्रथम श्रेणी",
    version: "1.0",
    isApproved: true,
    supportingDocumentsList: [
      "Daily Diary Roznamcha Entry",
      "Witness Statements (राहगीर/दुकानदार)",
      "Memo of Appearance / Bail Bond (यदि मुचलका पर छोड़ा गया हो)"
    ],
    defaultNarrativeTemplateHi: `सेवा में,\nश्रीमान न्यायिक दंडाधिकारी प्रथम श्रेणी,\nजिला {{district}}, हरियाणा।\n\nविषय: कलंदरा बाबत जुर्म धारा 248 भारतीय न्याय संहिता, 2023।\n\nश्रीमान जी,\nनिवेदन है कि आज दिनांक {{incidentDate}} को स्थान {{incidentPlace}} पर आरोपी {{respondentName}} पुत्र {{respondentFather}} निवासी {{respondentAddress}} सरेआम शराब के नशे में / अश्लील हरकतें व अश्लील टिप्पणियां राहगीरों पर कर रहा था जिससे आम नागरिकों में क्षोभ उत्पन्न हुआ।\n\nआरोपी का उक्त कृत्य धारा 248 BNS 2023 के तहत दंडनीय है। साक्ष्य संलग्न हैं।\n\nअतः प्रार्थना है कि आरोपी के विरुद्ध नियमानुसार संज्ञान लेकर अभियोजन कार्रवाई प्रारंभ करने की कृपा करें।`,
    defaultNarrativeTemplateEn: `To,\nThe Learned Judicial Magistrate First Class,\nDistrict {{district}}, Haryana.\n\nSub: Police Kalandra under Section 248 Bharatiya Nyaya Sanhita, 2023.\n\nSir,\nIt is submitted that on {{incidentDate}} at {{incidentPlace}}, the accused {{respondentName}} s/o {{respondentFather}} r/o {{respondentAddress}} committed obscene acts and uttered obscene words causing substantial annoyance to passersby.\n\nThe accused is liable u/s 248 BNS 2023. Prayer is made for taking statutory cognizance.`,
    fields: [
      { id: "respondentName", name: "respondentName", labelHi: "आरोपी का नाम", labelEn: "Accused Name", type: "text", isRequired: true },
      { id: "respondentFather", name: "respondentFather", labelHi: "पिता का नाम", labelEn: "Father's Name", type: "text", isRequired: true },
      { id: "respondentAddress", name: "respondentAddress", labelHi: "पता", labelEn: "Address", type: "text", isRequired: true },
      { id: "incidentPlace", name: "incidentPlace", labelHi: "घटना स्थल", labelEn: "Place of Incident", type: "text", isRequired: true },
      { id: "factsAndCircumstances", name: "factsAndCircumstances", labelHi: "अश्लील कृत्य का विवरण", labelEn: "Facts of Obscene Act", type: "textarea", isRequired: true },
      { id: "proposedAction", name: "proposedAction", labelHi: "प्रार्थना", labelEn: "Prayer", type: "textarea", isRequired: true }
    ]
  },
  {
    id: "tmpl-145",
    code: "145",
    titleEn: "Kalandra u/s 145 CrPC (Sec 164 BNSS) - Disputes Concerning Land or Water",
    titleHi: "कलंदरा जेर दफा 145 जा०फौ० (धारा 164 BNSS) - भूमि या जल संबंधी विवाद एवं शांति भंग की आशंका",
    actEn: "Code of Criminal Procedure, 1973 / BNSS 2023",
    actHi: "दंड प्रक्रिया संहिता, 1973 / भारतीय नागरिक सुरक्षा संहिता, 2023",
    section: "Sec 145 CrPC (Sec 164 BNSS)",
    legalStatus: "NEEDS_LEGAL_MAPPING_VERIFICATION",
    legalNoticeHi: "विधि सत्यापन प्रतीक्षित: अचल संपत्ति/जमीन विवाद बाबत कलंदरा। BNSS धारा 164 के तहत कार्यपालक दंडाधिकारी के अधिकार क्षेत्र, राजस्व फर्द एवं विवादित संपत्ति के सीमाओं के सत्यापन उपरांत ही आदेश प्राप्त करें।",
    legalNoticeEn: "Needs Legal Mapping Verification: Immovable property dispute. Requires executive magistrate jurisdiction under BNSS 164, revenue records, demarcations and site plans before attachment orders.",
    proceduralContext: "Quasi-judicial police report for executive magistrate inquiry into actual possession and attachment of disputed property to prevent bloodshed.",
    defaultCourtEn: "Court of Sub-Divisional Magistrate (SDM) / Executive Magistrate",
    defaultCourtHi: "न्यायालय उप-मंडल मजिस्ट्रेट (एस.डी.एम.)",
    version: "1.0",
    isApproved: false,
    supportingDocumentsList: [
      "Revenue Jamabandi / Khasra Girdawari Extract",
      "Police Inspection Site Map (मौका नक्शा)",
      "Statements of Numberdar / Sarpanch / Neighbours",
      "Photographs of Disputed Land",
      "Roznamcha GD Extract"
    ],
    defaultNarrativeTemplateHi: `सेवा में,\nश्रीमान उप-मंडल मजिस्ट्रेट,\nजिला {{district}}, हरियाणा।\n\nविषय: कलंदरा जेर दफा 145 जा०फौ० (धारा 164 BNSS) बाबत विवादित भूमि पर शांति व्यवस्था बनाए रखने।\n\nप्रथम पक्ष: {{respondentName}} पुत्र {{respondentFather}} निवासी {{respondentAddress}}\nबनाम\nद्वितीय पक्ष: {{secondPartyName}} पुत्र {{secondPartyFather}} निवासी {{secondPartyAddress}}\n\nश्रीमान जी,\nनिवेदन है कि मौजा {{incidentPlace}} में स्थित विवादित भूमि के मालिकाना हक व कब्जे को लेकर दोनों पक्षों में तीव्र रंजिश चल रही है। दोनों पक्ष लाठी-डंडों व हथियारों से लैस होकर कभी भी गंभीर खून-खराबा कर सकते हैं जिससे इलाके की शांति खतरे में है।\n\nअतः प्रार्थना है कि उक्त विवादित भूमि की बाबत जेर दफा 145 CrPC (164 BNSS) के तहत दोनों पक्षों को तलब फरमाकर विवादित संपत्ति को कुरक (Attach) करने एवं रिसीवर नियुक्त करने की कृपा की जावे।`,
    defaultNarrativeTemplateEn: `To,\nThe Learned Sub-Divisional Magistrate,\nDistrict {{district}}, Haryana.\n\nSub: Kalandra u/s 145 CrPC (Sec 164 BNSS) regarding land dispute likely to cause breach of peace.\n\nParty 1: {{respondentName}} s/o {{respondentFather}} r/o {{respondentAddress}}\nVersus\nParty 2: {{secondPartyName}} s/o {{secondPartyFather}} r/o {{secondPartyAddress}}\n\nSir,\nIt is submitted that a serious dispute exists over possession of land situated at {{incidentPlace}} between the aforesaid parties. There is imminent apprehension of serious violence.\n\nIt is prayed that proceedings u/s 145 CrPC (164 BNSS) be initiated, parties summoned, and disputed property attached pending adjudication.`,
    fields: [
      { id: "respondentName", name: "respondentName", labelHi: "प्रथम पक्ष का नाम", labelEn: "Party 1 Name", type: "text", isRequired: true },
      { id: "respondentFather", name: "respondentFather", labelHi: "प्रथम पक्ष पिता/पति का नाम", labelEn: "Party 1 Father/Husband", type: "text", isRequired: true },
      { id: "respondentAddress", name: "respondentAddress", labelHi: "प्रथम पक्ष का पता", labelEn: "Party 1 Address", type: "text", isRequired: true },
      { id: "secondPartyName", name: "secondPartyName", labelHi: "द्वितीय पक्ष का नाम", labelEn: "Party 2 Name", type: "text", isRequired: true },
      { id: "secondPartyFather", name: "secondPartyFather", labelHi: "द्वितीय पक्ष पिता का नाम", labelEn: "Party 2 Father's Name", type: "text", isRequired: false },
      { id: "secondPartyAddress", name: "secondPartyAddress", labelHi: "द्वितीय पक्ष का पता", labelEn: "Party 2 Address", type: "text", isRequired: false },
      { id: "incidentPlace", name: "incidentPlace", labelHi: "विवादित भूमि / संपत्ति का विवरण व खसरा नंबर", labelEn: "Disputed Land Description & Khasra No.", type: "text", isRequired: true },
      { id: "factsAndCircumstances", name: "factsAndCircumstances", labelHi: "कब्जा विवाद व शांति भंग की आशंका का विवरण", labelEn: "Details of Dispute & Violence Risk", type: "textarea", isRequired: true },
      { id: "proposedAction", name: "proposedAction", labelHi: "प्रार्थना (कुर्की / रिसीवर नियुक्ति बाबत)", labelEn: "Prayer (Attachment / Receiver)", type: "textarea", isRequired: true }
    ]
  },
  {
    id: "tmpl-72-ipc",
    code: "72_IPC",
    titleEn: "Kalandra 72 IPC / Police Act (Needs Legal Mapping Verification)",
    titleHi: "कलंदरा 72 IPC / पुलिस अधिनियम (विधि सत्यापन प्रतीक्षित)",
    actEn: "Colloquial Reference / Relevant State Police Act",
    actHi: "पारंपरिक पुलिस परिपाटी / संबंधित राज्य पुलिस अधिनियम",
    section: "Sec 72 IPC / Police Act / Local Laws",
    legalStatus: "NEEDS_LEGAL_MAPPING_VERIFICATION",
    legalNoticeHi: "विधि सत्यापन प्रतीक्षित: पुलिस शब्दावली में प्रयुक्त '72 IPC' अथवा स्थानीय पुलिस एक्ट। वैधानिक धारा व स्थानीय अधिनियम की पुष्टि उपरांत ही न्यायालय में प्रस्तुत करें।",
    legalNoticeEn: "Needs Legal Mapping Verification: Colloquial police nomenclature ('72 IPC'/Police Act). Must be cross-verified against valid statutory enactments prior to filing.",
    proceduralContext: "Colloquial regulatory kalandra historically used for municipal obstructions, unlicensed street vending or petty police infractions.",
    defaultCourtEn: "Court of Judicial / Executive Magistrate",
    defaultCourtHi: "न्यायालय न्यायिक / कार्यपालक दंडाधिकारी",
    version: "1.0",
    isApproved: false,
    supportingDocumentsList: [
      "GD Roznamcha Sanha",
      "Site Inspection Memo",
      "Witness Statement"
    ],
    defaultNarrativeTemplateHi: `सेवा में,\nश्रीमान दंडाधिकारी महोदय,\nजिला {{district}}, हरियाणा।\n\nविषय: कलंदरा बाबत उल्लंघन/अवज्ञा।\n\nश्रीमान जी,\nनिवेदन है कि मौजा {{incidentPlace}} पर विपक्षी {{respondentName}} पुत्र {{respondentFather}} निवासी {{respondentAddress}} द्वारा नियमों का उल्लंघन किया गया।\n\nअतः नियमानुसार विधिक कार्रवाई अमल में लाई जावे।`,
    defaultNarrativeTemplateEn: `To,\nThe Learned Magistrate,\nDistrict {{district}}, Haryana.\n\nSub: Kalandra regarding violation/infraction.\n\nSir,\nIt is submitted that respondent {{respondentName}} committed infraction at {{incidentPlace}}. Necessary action under statutory rules is prayed.`,
    fields: [
      { id: "respondentName", name: "respondentName", labelHi: "विपक्षी का नाम", labelEn: "Respondent Name", type: "text", isRequired: true },
      { id: "respondentFather", name: "respondentFather", labelHi: "पिता का नाम", labelEn: "Father's Name", type: "text", isRequired: true },
      { id: "respondentAddress", name: "respondentAddress", labelHi: "पता", labelEn: "Address", type: "text", isRequired: true },
      { id: "incidentPlace", name: "incidentPlace", labelHi: "स्थान", labelEn: "Place", type: "text", isRequired: true },
      { id: "factsAndCircumstances", name: "factsAndCircumstances", labelHi: "विवरण", labelEn: "Details", type: "textarea", isRequired: true },
      { id: "proposedAction", name: "proposedAction", labelHi: "प्रार्थना", labelEn: "Prayer", type: "textarea", isRequired: true }
    ]
  },
  {
    id: "tmpl-7-16",
    code: "7_16",
    titleEn: "Kalandra 7/16 (Regulatory Proceeding - Needs Legal Mapping Verification)",
    titleHi: "कलंदरा 7/16 (नियामक कार्यवाही - विधि सत्यापन प्रतीक्षित)",
    actEn: "Special / Local Regulatory Enactment",
    actHi: "विशेष / स्थानीय नियामक अधिनियम",
    section: "Rule / Section 7/16",
    legalStatus: "NEEDS_LEGAL_MAPPING_VERIFICATION",
    legalNoticeHi: "विधि सत्यापन प्रतीक्षित: 7/16 कलंदरा विभागीय अथवा राजस्व/निवारक परिपाटी है। सक्षम प्राधिकारी व वैधानिक उपबंध की पुष्टि प्रतीक्षित है।",
    legalNoticeEn: "Needs Legal Mapping Verification: 7/16 regulatory convention. Formal statutory mapping under BNSS/State Special Acts is required.",
    proceduralContext: "Regulatory compliance proceedings instituted under specialized police conventions or local administrative rules.",
    defaultCourtEn: "Court of Executive Magistrate / Competent Authority",
    defaultCourtHi: "सक्षम प्राधिकारी / कार्यपालक दंडाधिकारी",
    version: "1.0",
    isApproved: false,
    supportingDocumentsList: [
      "Inspection Memo",
      "Notice Copy",
      "Local Panchnama"
    ],
    defaultNarrativeTemplateHi: `सेवा में,\nश्रीमान सक्षम प्राधिकारी / कार्यपालक दंडाधिकारी,\nजिला {{district}}, हरियाणा।\n\nविषय: कलंदरा 7/16 बाबत नियामक अनुपालन।\n\nश्रीमान जी,\nविपक्षी {{respondentName}} पुत्र {{respondentFather}} निवासी {{respondentAddress}} द्वारा स्थान {{incidentPlace}} पर अनुपालन में चूक की गई। रिपोर्ट प्रस्तुत है।`,
    defaultNarrativeTemplateEn: `To,\nThe Competent Authority / Executive Magistrate,\nDistrict {{district}}, Haryana.\n\nSub: Report 7/16 regarding regulatory inspection.\n\nSir,\nRespondent {{respondentName}} committed regulatory lapse at {{incidentPlace}}. Submitted for orders.`,
    fields: [
      { id: "respondentName", name: "respondentName", labelHi: "व्यक्ति/इकाई का नाम", labelEn: "Person/Entity Name", type: "text", isRequired: true },
      { id: "respondentFather", name: "respondentFather", labelHi: "पिता का नाम", labelEn: "Father's Name", type: "text", isRequired: false },
      { id: "respondentAddress", name: "respondentAddress", labelHi: "पता", labelEn: "Address", type: "text", isRequired: true },
      { id: "incidentPlace", name: "incidentPlace", labelHi: "निरीक्षण स्थल", labelEn: "Inspection Site", type: "text", isRequired: true },
      { id: "factsAndCircumstances", name: "factsAndCircumstances", labelHi: "निरीक्षण व तथ्य विवरण", labelEn: "Inspection Findings", type: "textarea", isRequired: true },
      { id: "proposedAction", name: "proposedAction", labelHi: "प्रस्तावित कार्रवाई", labelEn: "Proposed Action", type: "textarea", isRequired: true }
    ]
  },
  {
    id: "tmpl-other",
    code: "OTHER",
    titleEn: "Other Custom Kalandra (User Configured)",
    titleHi: "अन्य विशेष कलंदरा (उपयोगकर्ता विनिर्दिष्ट प्रारूप)",
    actEn: "Special / Local Law / BNSS",
    actHi: "विशेष / स्थानीय विधि / BNSS",
    section: "As Specified",
    legalStatus: "VERIFIED_STATUTORY",
    proceduralContext: "General purpose customizable kalandra format for any preventive, regulatory or statutory proceedings.",
    defaultCourtEn: "Court of Competent Jurisdiction",
    defaultCourtHi: "सक्षम न्यायालय / प्राधिकारी",
    version: "1.0",
    isApproved: true,
    supportingDocumentsList: [
      "GD Extract",
      "Spot Memo",
      "Witness Statements"
    ],
    defaultNarrativeTemplateHi: `सेवा में,\nश्रीमान दंडाधिकारी महोदय,\nजिला {{district}}, हरियाणा।\n\nविषय: कलंदरा बाबत {{actAndSection}}।\n\nश्रीमान जी,\nनिवेदन है कि दिनांक {{incidentDate}} को स्थान {{incidentPlace}} पर गैर-सायल {{respondentName}} पुत्र {{respondentFather}} निवासी {{respondentAddress}} द्वारा नियम विरुद्ध आचरण किया गया।\n\nविवरण: {{factsAndCircumstances}}\n\nअतः नियमानुसार आवश्यक कानूनी कार्रवाई अमल में लाई जावे।`,
    defaultNarrativeTemplateEn: `To,\nThe Learned Magistrate,\nDistrict {{district}}, Haryana.\n\nSub: Kalandra u/s {{actAndSection}}.\n\nSir,\nIt is submitted that on {{incidentDate}} at {{incidentPlace}}, the respondent {{respondentName}} s/o {{respondentFather}} committed infractions as detailed below:\n{{factsAndCircumstances}}\n\nNecessary proceedings under law are prayed for.`,
    fields: [
      { id: "respondentName", name: "respondentName", labelHi: "विपक्षी का नाम", labelEn: "Respondent Name", type: "text", isRequired: true },
      { id: "respondentFather", name: "respondentFather", labelHi: "पिता का नाम", labelEn: "Father's Name", type: "text", isRequired: false },
      { id: "respondentAddress", name: "respondentAddress", labelHi: "पता", labelEn: "Address", type: "text", isRequired: true },
      { id: "incidentPlace", name: "incidentPlace", labelHi: "स्थान", labelEn: "Place", type: "text", isRequired: true },
      { id: "factsAndCircumstances", name: "factsAndCircumstances", labelHi: "विस्तृत विवरण", labelEn: "Detailed Narrative", type: "textarea", isRequired: true },
      { id: "proposedAction", name: "proposedAction", labelHi: "प्रार्थना", labelEn: "Prayer", type: "textarea", isRequired: true }
    ]
  }
];

const INITIAL_MOCK_KALANDRAS: KalandraRecord[] = [
  {
    id: "kal-001",
    kalandraNumber: "KAL/2026/001",
    typeCode: "107_151",
    templateId: "tmpl-107-151",
    templateTitle: "Kalandra u/s 107/151 CrPC (Sec 126/170 BNSS)",
    actAndSection: "Sec 107/151 CrPC / Sec 126/170 BNSS",
    policeStation: "Sector 29 Police Station",
    district: "Gurugram",
    caseType: "DIRECT",
    relatedGdNumber: "GD-0038/14-04-2026",
    respondentName: "Suresh Kumar",
    respondentFather: "Sh. Ram Kishan",
    respondentAddress: "H.No. 112, Village Chakkarpur, Sector 28, Gurugram",
    respondentAge: 32,
    respondentGender: "MALE",
    respondentMobile: "9876543210",
    secondPartyName: "Mahesh Yadav",
    secondPartyFather: "Sh. Dharamvir Yadav",
    secondPartyAddress: "H.No. 118, Village Chakkarpur, Sector 28, Gurugram",
    incidentDate: "2026-04-14",
    incidentTime: "10:30",
    incidentPlace: "Main Market Chowk, Sector 29, Gurugram",
    reportingOfficer: "SI Balwan Singh",
    officerRank: "Sub Inspector",
    officerBelt: "1482/GGM",
    magistrateCourt: "Court of Sub-Divisional Magistrate (SDM), Gurugram",
    factsAndCircumstances: "विपक्षी सुरेश कुमार पुत्र राम किशन द्वारा मुख्य बाजार चौक पर सरेआम लाठी लेकर दूसरे पक्ष महेश यादव के साथ मारपीट पर उतारू होकर गाली-गलौज की जा रही थी। आम जनता भयभीत हो गई। पुलिस द्वारा काफी समझाने के बावजूद विपक्षी अधिक उग्र हो गया तथा संज्ञेय अपराध कारित करने पर आमादा था। शांति बनाए रखने हेतु विपक्षी को जेर दफा 151 CrPC के तहत मौके पर काबू किया गया।",
    witnesses: [
      { id: "w-1", name: "ASI Virender Singh", fatherName: "Sh. Rohtas", address: "PS Sector 29, Gurugram", mobile: "9812000001" },
      { id: "w-2", name: "Ramesh Chand", fatherName: "Sh. Mohan Lal", address: "Shopkeeper, Sector 29 Market, Gurugram", mobile: "9812000002" }
    ],
    supportingDocuments: [
      { id: "sd-1", title: "GD Entry No. 38 (Departure & Arrest Entry)", documentType: "GD_EXTRACT", isAttached: true, referenceNumber: "GD-38" },
      { id: "sd-2", title: "Medical Examination Memo (Civil Hospital GGM)", documentType: "MEDICAL_REPORT", isAttached: true, referenceNumber: "MLC-4421" },
      { id: "sd-3", title: "Spot Panchnama & Witness Statements", documentType: "STATEMENT", isAttached: true }
    ],
    proposedAction: "विपक्षी को जेर दफा 107 CrPC (126 BNSS) के तहत तलब फरमाकर 1 वर्ष की अवधि हेतु 50,000/- रुपये का शांति मुचलका व दो स्थानीय जामिन पाबंद फरमाए जावें।",
    remarks: "आरोपी का पूर्व में भी शांति भंग का रिकॉर्ड रहा है।",
    status: "FINALISED",
    language: "hi",
    createdAt: "2026-04-14T11:00:00Z",
    updatedAt: "2026-04-14T11:45:00Z",
    finalisedAt: "2026-04-14T11:45:00Z"
  },
  {
    id: "kal-002",
    kalandraNumber: "KAL/2026/002",
    typeCode: "217_BNS",
    templateId: "tmpl-217-bns",
    templateTitle: "Kalandra u/s 217 Bharatiya Nyaya Sanhita, 2023 - Public Nuisance",
    actAndSection: "Sec 217 BNS (Old Sec 290 IPC)",
    policeStation: "Sector 29 Police Station",
    district: "Gurugram",
    caseType: "FROM_GD",
    relatedGdNumber: "GD-0044/14-04-2026",
    respondentName: "Anil Mittal",
    respondentFather: "Sh. Omprakash Mittal",
    respondentAddress: "Shop No. 14, Commercial Plaza, Sector 29, Gurugram",
    respondentAge: 44,
    respondentGender: "MALE",
    respondentMobile: "9811122233",
    incidentDate: "2026-04-14",
    incidentTime: "12:15",
    incidentPlace: "Commercial Plaza Footpath & Main Road, Sector 29, Gurugram",
    reportingOfficer: "ASI Rakesh Kumar",
    officerRank: "Assistant Sub Inspector",
    officerBelt: "982/GGM",
    magistrateCourt: "Court of Chief Judicial Magistrate (CJM), Gurugram",
    factsAndCircumstances: "Respondent Anil Mittal illegally stacked heavy commercial iron displays and crates across the pedestrian footpath and public driveway, completely blocking movement of pedestrian traffic and emergency vehicles. Despite multiple prior formal warnings by beat officers, respondent refused to remove obstruction, creating grave public nuisance under Section 217 BNS.",
    witnesses: [
      { id: "w-3", name: "HC Rajesh Kumar", fatherName: "Sh. Satbir Singh", address: "PS Sector 29, Gurugram", mobile: "9812000003" },
      { id: "w-4", name: "Deepak Grover", fatherName: "Sh. KK Grover", address: "President, Market Welfare Association, Sec 29", mobile: "9812000004" }
    ],
    supportingDocuments: [
      { id: "sd-4", title: "Spot Geo-tagged Photographs (4 No.)", documentType: "PHOTOGRAPHS", isAttached: true },
      { id: "sd-5", title: "Notice of Obstruction Removal Memo", documentType: "NOTICE", isAttached: true }
    ],
    proposedAction: "Cognizance be taken under Section 217 BNS 2023 and summons issued to respondent for criminal trial.",
    status: "DRAFT",
    language: "en",
    createdAt: "2026-04-14T12:30:00Z",
    updatedAt: "2026-04-14T12:35:00Z"
  }
];

class KalandraService {
  private getStorage<T>(key: string, fallback: T): T {
    if (typeof window === "undefined") return fallback;
    try {
      const stored = localStorage.getItem(key);
      if (!stored) {
        localStorage.setItem(key, JSON.stringify(fallback));
        return fallback;
      }
      return JSON.parse(stored) as T;
    } catch {
      return fallback;
    }
  }

  private setStorage<T>(key: string, data: T): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.warn("KalandraService: Failed to save to localStorage", e);
    }
  }

  public getAllTemplates(): KalandraTemplate[] {
    const customTemplates = this.getStorage<KalandraTemplate[]>(KALANDRA_TEMPLATES_KEY, []);
    const merged = [...INITIAL_KALANDRA_TEMPLATES];
    for (const c of customTemplates) {
      const idx = merged.findIndex((t) => t.id === c.id);
      if (idx >= 0) merged[idx] = c;
      else merged.push(c);
    }
    return merged.filter((t) => !t.isArchived);
  }

  public getTemplateById(id: string): KalandraTemplate | undefined {
    return this.getAllTemplates().find((t) => t.id === id);
  }

  public getTemplateByCode(code: string): KalandraTemplate | undefined {
    return this.getAllTemplates().find((t) => t.code === code);
  }

  public saveTemplate(template: KalandraTemplate): KalandraTemplate {
    const customTemplates = this.getStorage<KalandraTemplate[]>(KALANDRA_TEMPLATES_KEY, []);
    const idx = customTemplates.findIndex((t) => t.id === template.id);
    if (idx >= 0) {
      customTemplates[idx] = { ...template };
    } else {
      customTemplates.push({ ...template, isCustom: true });
    }
    this.setStorage(KALANDRA_TEMPLATES_KEY, customTemplates);
    return template;
  }

  public getAllRecords(): KalandraRecord[] {
    return this.getStorage<KalandraRecord[]>(KALANDRA_RECORDS_KEY, INITIAL_MOCK_KALANDRAS);
  }

  public getRecordById(id: string): KalandraRecord | undefined {
    return this.getAllRecords().find((r) => r.id === id);
  }

  public saveRecord(record: KalandraRecord): KalandraRecord {
    const records = this.getAllRecords();
    const idx = records.findIndex((r) => r.id === record.id);
    const updated = {
      ...record,
      updatedAt: new Date().toISOString()
    };
    if (idx >= 0) {
      records[idx] = updated;
    } else {
      records.unshift(updated);
    }
    this.setStorage(KALANDRA_RECORDS_KEY, records);
    return updated;
  }

  public deleteRecord(id: string): boolean {
    const records = this.getAllRecords();
    const filtered = records.filter((r) => r.id !== id);
    if (filtered.length !== records.length) {
      this.setStorage(KALANDRA_RECORDS_KEY, filtered);
      return true;
    }
    return false;
  }

  public generateKalandraNumber(): string {
    const year = new Date().getFullYear();
    const records = this.getAllRecords();
    const count = records.length + 1;
    return `KAL/${year}/${String(count).padStart(3, "0")}`;
  }

  public async autofillFromSource(sourceType: "FIR" | "COMPLAINT" | "GD", sourceId: string): Promise<Partial<KalandraRecord> | null> {
    if (sourceType === "FIR") {
      const allFirs = firService.getAllFirs();
      const fir = allFirs.find((f) => f.id === sourceId || f.firNumber === sourceId);
      if (!fir) return null;

      const firstAccused = fir.accusedList?.[0];
      return {
        caseType: "FROM_FIR",
        relatedFirId: fir.id,
        relatedFirNumber: fir.firNumber,
        policeStation: fir.policeStation || "Sector 29 Police Station",
        district: fir.district || "Gurugram",
        incidentDate: fir.incidentDateFrom || new Date().toISOString().split("T")[0],
        incidentTime: fir.incidentTimeFrom || "10:00",
        incidentPlace: fir.incidentPlace || "",
        respondentName: firstAccused?.name || "",
        respondentFather: firstAccused?.fatherName || firstAccused?.relativeName || "",
        respondentAddress: firstAccused?.address || "",
        respondentAge: "",
        respondentGender: "MALE",
        respondentMobile: firstAccused?.phone || "",
        secondPartyName: fir.complainantName || "",
        secondPartyFather: fir.complainantFatherSpouse || "",
        secondPartyAddress: fir.complainantAddress || "",
        reportingOfficer: fir.assignedIoName || "SI Balwan Singh",
        officerRank: fir.assignedIoRank || "Sub Inspector",
        officerBelt: fir.assignedIoBeltNumber || "1482/GGM",
        factsAndCircumstances: `FIR No. ${fir.firNumber} u/s ${fir.actsAndSections || "Relevant Sections"} बाबत घटना स्थल ${fir.incidentPlace || ""}। आरोपी द्वारा शांति भंग एवं संज्ञेय अपराध कारित करने की आशंका।`,
        proposedAction: "विपक्षी को शांति व्यवस्था बनाए रखने हेतु मुचलका व जमानतदार से पाबंद फरमाया जावे।"
      };
    }

    if (sourceType === "COMPLAINT") {
      const complaints = await ComplaintService.getComplaints();
      const comp = complaints.find((c) => c.id === sourceId || c.complaintNumber === sourceId);
      if (!comp) return null;

      return {
        caseType: "FROM_COMPLAINT",
        relatedComplaintId: comp.id,
        relatedComplaintNumber: comp.complaintNumber,
        policeStation: comp.policeStation || "Sector 29 Police Station",
        district: comp.district || "Gurugram",
        incidentDate: comp.incidentDate || new Date().toISOString().split("T")[0],
        incidentTime: comp.incidentTime || "12:00",
        incidentPlace: comp.incidentPlace || "",
        respondentName: comp.accusedList?.[0]?.name || "",
        respondentFather: comp.accusedList?.[0]?.fatherName || comp.accusedList?.[0]?.relativeName || "",
        respondentAddress: comp.accusedList?.[0]?.address || "",
        secondPartyName: comp.complainantName || "",
        secondPartyFather: comp.complainantFatherSpouse || comp.complainantRelativeName || "",
        secondPartyAddress: comp.complainantAddress || "",
        reportingOfficer: comp.assignedEoName || "ASI Rakesh Kumar",
        officerRank: "Assistant Sub Inspector",
        factsAndCircumstances: `शिकायत संख्या ${comp.complaintNumber} के अवलोकन से पाया गया कि विपक्षी द्वारा शांति व्यवस्था में बाधा डाली जा रही है: ${comp.incidentDetails || comp.complaintSubject || ""}`,
        proposedAction: "विपक्षी के विरुद्ध निवारक कलंदरा प्रस्तुत कर पाबंद फरमाया जावे।"
      };
    }

    if (sourceType === "GD") {
      const gdList = await GeneralDiaryService.getEntries();
      const gd = gdList.find((g) => g.id === sourceId || g.gdNumber === sourceId);
      if (!gd) return null;

      const gdDateStr = gd.activityDateTime ? gd.activityDateTime.split("T")[0] : (gd.officialCreationTimestamp ? gd.officialCreationTimestamp.split("T")[0] : new Date().toISOString().split("T")[0]);

      return {
        caseType: "FROM_GD",
        relatedGdNumber: gd.gdNumber,
        policeStation: gd.policeStation || "Sector 29 Police Station",
        district: gd.district || "Gurugram",
        incidentDate: gdDateStr,
        incidentTime: "12:00",
        incidentPlace: gd.subject || "",
        reportingOfficer: gd.entryForOfficer?.name || "SI Balwan Singh",
        officerRank: gd.entryForOfficer?.rank || "Sub Inspector",
        factsAndCircumstances: `रोजनामचा रपट संख्या ${gd.gdNumber} दिनांक ${gdDateStr} के अनुसार: ${gd.narrative || gd.subject || ""}`
      };
    }

    return null;
  }

  public populateNarrative(templateNarrative: string, record: Partial<KalandraRecord>): string {
    let result = templateNarrative;
    const mapping: Record<string, string> = {
      "{{district}}": record.district || "Gurugram",
      "{{policeStation}}": record.policeStation || "Sector 29 Police Station",
      "{{incidentDate}}": record.incidentDate || new Date().toISOString().split("T")[0],
      "{{incidentTime}}": record.incidentTime || "10:00 AM",
      "{{incidentPlace}}": record.incidentPlace || "[घटना स्थल / Place of Incident]",
      "{{respondentName}}": record.respondentName || "[विपक्षी / Respondent]",
      "{{respondentFather}}": record.respondentFather || "[पिता/पति का नाम]",
      "{{respondentAddress}}": record.respondentAddress || "[पता / Address]",
      "{{secondPartyName}}": record.secondPartyName || "[द्वितीय पक्ष / Second Party]",
      "{{secondPartyFather}}": record.secondPartyFather || "[द्वितीय पक्ष पिता / Father]",
      "{{secondPartyAddress}}": record.secondPartyAddress || "[पता / Address]",
      "{{actAndSection}}": record.actAndSection || "[अधिनियम एवं धारा / Act & Section]",
      "{{factsAndCircumstances}}": record.factsAndCircumstances || "",
      "{{proposedAction}}": record.proposedAction || ""
    };

    for (const [key, val] of Object.entries(mapping)) {
      result = result.replaceAll(key, val);
    }
    return result;
  }

  public generateKalandraPackage(record: KalandraRecord, lang: "hi" | "en" = "hi"): KalandraDocumentPackage {
    const isHi = lang === "hi";

    // 1. Main Kalandra HTML
    const mainKalandraHtml = `
      <div style="font-family: 'Noto Sans Devanagari', 'Times New Roman', serif; max-width: 800px; margin: 0 auto; padding: 24px; color: #0f172a; line-height: 1.6;">
        <div style="text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 20px;">
          <h4 style="margin: 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #475569;">
            ${isHi ? "हरियाणा पुलिस" : "HARYANA POLICE"}
          </h4>
          <h2 style="margin: 4px 0; font-size: 20px; font-weight: 800; color: #0f172a;">
            ${isHi ? "कलंदरा / इस्तगासा रिपोर्ट" : "POLICE KALANDRA / PREVENTIVE DOSSIER"}
          </h2>
          <div style="font-size: 12px; font-weight: 600; color: #334155;">
            ${isHi ? "थाना" : "Police Station"}: ${record.policeStation} | ${isHi ? "जिला" : "District"}: ${record.district}
          </div>
          <div style="font-size: 12px; font-weight: 700; color: #1e3a8a; margin-top: 4px;">
            ${isHi ? "कलंदरा संख्या" : "Kalandra No."}: ${record.kalandraNumber} | ${isHi ? "दिनांक" : "Date"}: ${record.createdAt.split("T")[0]}
          </div>
        </div>

        <div style="margin-bottom: 16px; font-weight: 600; font-size: 13px;">
          ${isHi ? "ब-अदालत" : "In the Court of"}: <span style="font-weight: 700;">${record.magistrateCourt}</span>
        </div>

        <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px; margin-bottom: 20px; font-size: 13px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span><strong>${isHi ? "धारा व कानून" : "Act & Section"}:</strong> ${record.actAndSection}</span>
            <span><strong>${isHi ? "स्रोत संदर्भ" : "Source Ref"}:</strong> ${record.caseType} ${record.relatedFirNumber ? `(FIR: ${record.relatedFirNumber})` : record.relatedComplaintNumber ? `(COMP: ${record.relatedComplaintNumber})` : record.relatedGdNumber ? `(GD: ${record.relatedGdNumber})` : ""}</span>
          </div>
          <div style="margin-top: 6px;">
            <strong>${isHi ? "प्रथम पक्ष / गैर-सायल (Respondent)" : "Party 1 / Respondent"}:</strong> ${record.respondentName} ${record.respondentFather ? (isHi ? `पुत्र श्री ${record.respondentFather}` : `s/o Sh. ${record.respondentFather}`) : ""}, ${record.respondentAddress}
          </div>
          ${record.secondPartyName ? `
            <div style="margin-top: 4px;">
              <strong>${isHi ? "बनाम द्वितीय पक्ष" : "Versus Party 2"}:</strong> ${record.secondPartyName} ${record.secondPartyFather ? (isHi ? `पुत्र श्री ${record.secondPartyFather}` : `s/o Sh. ${record.secondPartyFather}`) : ""}, ${record.secondPartyAddress || ""}
            </div>
          ` : ""}
        </div>

        <div style="margin-bottom: 20px;">
          <h4 style="font-size: 14px; font-weight: 700; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 8px;">
            ${isHi ? "घटना एवं स्थल विवरण" : "Occurrence & Scene of Incident"}
          </h4>
          <p style="font-size: 13px; margin: 0 0 6px 0;">
            <strong>${isHi ? "दिनांक व समय" : "Date & Time"}:</strong> ${record.incidentDate} ${record.incidentTime ? `| ${record.incidentTime}` : ""}
          </p>
          <p style="font-size: 13px; margin: 0;">
            <strong>${isHi ? "स्थान" : "Place"}:</strong> ${record.incidentPlace}
          </p>
        </div>

        <div style="margin-bottom: 20px;">
          <h4 style="font-size: 14px; font-weight: 700; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 8px;">
            ${isHi ? "तथ्य एवं परिस्थितियां (कलंदरा विवरण)" : "Facts, Circumstances & Police Grounds"}
          </h4>
          <div style="font-size: 13px; white-space: pre-wrap; text-align: justify; line-height: 1.8;">
            ${record.factsAndCircumstances}
          </div>
        </div>

        <div style="margin-bottom: 20px; background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px;">
          <h4 style="font-size: 13px; font-weight: 700; margin: 0 0 4px 0; color: #92400e;">
            ${isHi ? "प्रार्थना / प्रस्तावित वैधानिक आदेश" : "Prayer / Relief Sought"}
          </h4>
          <p style="font-size: 13px; margin: 0; color: #78350f;">
            ${record.proposedAction}
          </p>
        </div>

        <div style="margin-top: 40px; display: flex; justify-content: space-between; align-items: flex-end; font-size: 12px;">
          <div>
            <div>${isHi ? "स्थान" : "Place"}: ${record.policeStation}</div>
            <div>${isHi ? "दिनांक" : "Date"}: ${new Date().toLocaleDateString("en-IN")}</div>
          </div>
          <div style="text-align: center;">
            <div style="margin-bottom: 40px; border-bottom: 1px dashed #64748b; width: 180px;"></div>
            <div style="font-weight: 700;">${record.reportingOfficer}</div>
            <div>${record.officerRank} ${record.officerBelt ? `(${record.officerBelt})` : ""}</div>
            <div>${record.policeStation}, ${record.district}</div>
          </div>
        </div>
      </div>
    `;

    // 2. Forwarding Letter HTML
    const forwardingLetterHtml = `
      <div style="font-family: 'Noto Sans Devanagari', 'Times New Roman', serif; max-width: 800px; margin: 0 auto; padding: 24px; color: #0f172a; line-height: 1.6;">
        <div style="text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 20px;">
          <h3 style="margin: 0; font-size: 18px; font-weight: 800;">
            ${isHi ? "कार्यालय प्रभारी थाना / प्रेषण पत्र" : "OFFICE OF STATION HOUSE OFFICER / FORWARDING MEMORANDUM"}
          </h3>
          <div style="font-size: 13px; font-weight: 600;">
            ${record.policeStation}, ${record.district}, ${isHi ? "हरियाणा पुलिस" : "Haryana Police"}
          </div>
          <div style="font-size: 12px; color: #475569; margin-top: 4px;">
            ${isHi ? "क्रमांक" : "Memo No."}: ${record.kalandraNumber}/SHO | ${isHi ? "दिनांक" : "Date"}: ${new Date().toLocaleDateString("en-IN")}
          </div>
        </div>

        <div style="margin-bottom: 24px; font-size: 13px;">
          <div>${isHi ? "सेवा में," : "To,"}</div>
          <div style="font-weight: 700; margin-left: 12px;">
            ${record.magistrateCourt},<br/>
            ${record.district}, Haryana.
          </div>
        </div>

        <div style="margin-bottom: 16px; font-size: 13px; font-weight: 700;">
          ${isHi ? "विषय" : "Subject"}: ${isHi ? "कलंदरा रिपोर्ट बाबत धारा" : "Police Kalandra under Section"} ${record.actAndSection} - State vs ${record.respondentName}
        </div>

        <div style="font-size: 13px; text-align: justify; line-height: 1.8; margin-bottom: 24px;">
          ${isHi ? `
            महोदय,<br/><br/>
            उपरोक्त विषयान्तर्गत सादर प्रस्तुत है कि थाना ${record.policeStation} के जांच अधिकारी ${record.reportingOfficer} द्वारा विपक्षी ${record.respondentName} पुत्र श्री ${record.respondentFather || "उपलब्ध नहीं"} निवासी ${record.respondentAddress} के विरुद्ध धारा ${record.actAndSection} के अंतर्गत कलंदरा तैयार किया गया है।<br/><br/>
            उक्त कलंदरा मय सहायक दस्तावेज व गवाहान सूची संलग्न कर अग्रिम न्यायिक कार्रवाई एवं आदेश जारी करने हेतु सादर प्रेषित है।
          ` : `
            Sir,<br/><br/>
            In reference to the subject cited above, the accompanying police kalandra prepared by IO ${record.reportingOfficer} against respondent ${record.respondentName} u/s ${record.actAndSection} is forwarded herewith.<br/><br/>
            All connected documents, site memo, and witness list are enclosed for kind consideration and passing appropriate statutory orders.
          `}
        </div>

        <div style="margin-top: 40px; display: flex; justify-content: flex-end; font-size: 12px;">
          <div style="text-align: center;">
            <div style="margin-bottom: 40px; border-bottom: 1px dashed #64748b; width: 180px;"></div>
            <div style="font-weight: 700;">Station House Officer (SHO)</div>
            <div>${record.policeStation}</div>
            <div>${record.district}</div>
          </div>
        </div>
      </div>
    `;

    // 3. Police Report HTML
    const policeReportHtml = `
      <div style="font-family: 'Noto Sans Devanagari', 'Times New Roman', serif; max-width: 800px; margin: 0 auto; padding: 24px; color: #0f172a; line-height: 1.6;">
        <div style="text-align: center; border-bottom: 1px solid #cbd5e1; padding-bottom: 10px; margin-bottom: 16px;">
          <h3 style="margin: 0; font-size: 16px; font-weight: 800;">
            ${isHi ? "मौका निरीक्षण व जांच अधिकारी आख्या (POLICE REPORT)" : "POLICE INSPECTION & FIELD INVESTIGATION REPORT"}
          </h3>
          <div style="font-size: 12px; color: #64748b;">
            Ref: ${record.kalandraNumber} | IO: ${record.reportingOfficer} (${record.officerRank})
          </div>
        </div>

        <div style="font-size: 13px; line-height: 1.8;">
          <p><strong>1. ${isHi ? "प्राथमिक सूचना का माध्यम" : "Source of Information"}:</strong> ${record.caseType} ${record.relatedGdNumber ? `(GD No. ${record.relatedGdNumber})` : ""}</p>
          <p><strong>2. ${isHi ? "घटना स्थल की भौगोलिक स्थिति" : "Scene of Occurrence"}:</strong> ${record.incidentPlace}</p>
          <p><strong>3. ${isHi ? "विपक्षी का आपराधिक इतिहास / पृष्ठभूमि" : "Criminal Antecedents / Conduct"}:</strong> ${record.remarks || (isHi ? "क्षेत्र में अशांति फैलाने की आदत" : "Prone to creating local unrest")}</p>
          <p><strong>4. ${isHi ? "स्थानीय नागरिकों का मत" : "Local Consensus"}:</strong> ${isHi ? "आसपास के निवासियों एवं दुकानदारों द्वारा शांति व्यवस्था बनाए रखने हेतु कानूनी पाबंदी की मांग की गई है।" : "Local residents and shopkeepers corroborated imminent breach of tranquility."}</p>
          <p><strong>5. ${isHi ? "जांच अधिकारी का निष्कर्ष" : "IO Finding"}:</strong> ${isHi ? "विपक्षी के विरुद्ध निवारक मुचलका पाबंदी अथवा संज्ञान लिया जाना न्यायहित एवं लोक शांति हेतु अत्यंत आवश्यक है।" : "Preventive binding down or statutory trial is indispensable for public peace."}</p>
        </div>
      </div>
    `;

    // 4. Witness List HTML
    const witnessRows = (record.witnesses || [])
      .map(
        (w, i) => `
        <tr style="border-bottom: 1px solid #e2e8f0; font-size: 12px;">
          <td style="padding: 8px; text-align: center;">${i + 1}</td>
          <td style="padding: 8px; font-weight: 600;">${w.name}</td>
          <td style="padding: 8px;">${w.fatherName || "-"}</td>
          <td style="padding: 8px;">${w.address}</td>
          <td style="padding: 8px;">${w.mobile || "-"}</td>
          <td style="padding: 8px; width: 100px;"></td>
        </tr>
      `
      )
      .join("");

    const witnessListHtml = `
      <div style="font-family: 'Noto Sans Devanagari', 'Times New Roman', serif; max-width: 800px; margin: 0 auto; padding: 24px; color: #0f172a; line-height: 1.6;">
        <div style="text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 8px; margin-bottom: 16px;">
          <h3 style="margin: 0; font-size: 16px; font-weight: 800;">
            ${isHi ? "फर्द फेहरिस्त गवाहान (WITNESS MEMO)" : "MEMO OF WITNESSES"}
          </h3>
          <div style="font-size: 12px; color: #475569;">
            ${record.policeStation} | ${record.kalandraNumber}
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-top: 12px;">
          <thead>
            <tr style="background-color: #f1f5f9; border-bottom: 2px solid #cbd5e1; font-size: 12px; text-align: left;">
              <th style="padding: 8px; text-align: center; width: 40px;">#</th>
              <th style="padding: 8px;">${isHi ? "नाम गवाह" : "Witness Name"}</th>
              <th style="padding: 8px;">${isHi ? "पिता का नाम" : "Father's Name"}</th>
              <th style="padding: 8px;">${isHi ? "निवास पता" : "Address"}</th>
              <th style="padding: 8px;">${isHi ? "मोबाईल" : "Mobile"}</th>
              <th style="padding: 8px;">${isHi ? "हस्ताक्षर" : "Signature"}</th>
            </tr>
          </thead>
          <tbody>
            ${witnessRows || `<tr><td colspan="6" style="padding: 12px; text-align: center; font-size: 12px; color: #94a3b8;">${isHi ? "कोई गवाह दर्ज नहीं है।" : "No witnesses recorded."}</td></tr>`}
          </tbody>
        </table>
      </div>
    `;

    // 5. Annexure List HTML
    const docRows = (record.supportingDocuments || [])
      .map(
        (d, i) => `
        <tr style="border-bottom: 1px solid #e2e8f0; font-size: 12px;">
          <td style="padding: 8px; text-align: center;">${i + 1}</td>
          <td style="padding: 8px; font-weight: 600;">${d.title}</td>
          <td style="padding: 8px;">${d.documentType}</td>
          <td style="padding: 8px;">${d.referenceNumber || "-"}</td>
          <td style="padding: 8px; text-align: center;">${d.isAttached ? (isHi ? "संलग्न" : "Attached") : (isHi ? "लंबित" : "Pending")}</td>
        </tr>
      `
      )
      .join("");

    const annexureListHtml = `
      <div style="font-family: 'Noto Sans Devanagari', 'Times New Roman', serif; max-width: 800px; margin: 0 auto; padding: 24px; color: #0f172a; line-height: 1.6;">
        <div style="text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 8px; margin-bottom: 16px;">
          <h3 style="margin: 0; font-size: 16px; font-weight: 800;">
            ${isHi ? "फर्द फेहरिस्त कागजात / संलग्नक (ANNEXURE LIST)" : "LIST OF ANNEXURES & SUPPORTING DOCUMENTS"}
          </h3>
          <div style="font-size: 12px; color: #475569;">
            ${record.policeStation} | ${record.kalandraNumber}
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-top: 12px;">
          <thead>
            <tr style="background-color: #f1f5f9; border-bottom: 2px solid #cbd5e1; font-size: 12px; text-align: left;">
              <th style="padding: 8px; text-align: center; width: 40px;">#</th>
              <th style="padding: 8px;">${isHi ? "दस्तावेज का शीर्षक" : "Document Title"}</th>
              <th style="padding: 8px;">${isHi ? "प्रकार" : "Type"}</th>
              <th style="padding: 8px;">${isHi ? "संदर्भ संख्या" : "Ref Number"}</th>
              <th style="padding: 8px; text-align: center;">${isHi ? "स्थिति" : "Status"}</th>
            </tr>
          </thead>
          <tbody>
            ${docRows || `<tr><td colspan="5" style="padding: 12px; text-align: center; font-size: 12px; color: #94a3b8;">${isHi ? "कोई दस्तावेज संलग्न नहीं है।" : "No documents attached."}</td></tr>`}
          </tbody>
        </table>
      </div>
    `;

    return {
      mainKalandraHtml,
      forwardingLetterHtml,
      policeReportHtml,
      witnessListHtml,
      annexureListHtml
    };
  }
}

export const kalandraService = new KalandraService();
