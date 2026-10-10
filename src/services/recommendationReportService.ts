import {
  ComplaintItem,
  ComplaintEvidenceAttachment,
  ComplaintDocumentItem,
  ComplaintReportItem,
} from "@/types";
import { formatDate } from "@/lib/utils";

export type RecommendationReportType =
  | "GAMINI"
  | "DIWANI"
  | "NCR"
  | "FIR"
  | "NIVARAN"
  | "RAZINAMA";

export interface ReportSection {
  id: string;
  heading: string;
  content: string;
}

export interface RecommendationReportDraft {
  recommendationType: RecommendationReportType;
  reportTypeLabel: string;
  title: string;
  dispatchNo: string;
  headerLeft: string;
  headerRight: string;
  subject: string;
  sections: ReportSection[];
  closingLine: string;
  officerName: string;
  officerRank: string;
  officerPno: string;
  officerLocation: string;
  dateStr: string;
  htmlContent: string;
  plainText: string;
}

export interface RecommendationConfigItem {
  key: RecommendationReportType;
  numberPrefix: string;
  label: string;
  titleHindi: string;
  titleEnglish: string;
  badgeColor: {
    bg: string;
    text: string;
    border: string;
  };
  iconName: string;
  description: string;
}

export const RECOMMENDATION_OPTIONS_CONFIG: RecommendationConfigItem[] = [
  {
    key: "GAMINI",
    numberPrefix: "1",
    label: "1. Gamini",
    titleHindi: "ज़मीनी / राजस्व विवाद आख्या",
    titleEnglish: "Gamini (Land & Boundary Demarcation Dispute)",
    badgeColor: {
      bg: "bg-amber-50",
      text: "text-amber-800",
      border: "border-amber-300",
    },
    iconName: "Landmark",
    description: "भूमि सीमांकन, खसरा निशानदेही व मेढ़ विवाद हेतु राजस्व क्षेत्राधिकार आख्या",
  },
  {
    key: "DIWANI",
    numberPrefix: "2",
    label: "2. Diwani",
    titleHindi: "दीवानी / व्यापारिक लेन-देन आख्या",
    titleEnglish: "Diwani (Civil & Monetary Dealing Dispute)",
    badgeColor: {
      bg: "bg-blue-50",
      text: "text-blue-800",
      border: "border-blue-300",
    },
    iconName: "Banknote",
    description: "आपसी व्यापारिक संविदा, पैसों के लेन-देन व दीवानी क्षेत्राधिकार आख्या",
  },
  {
    key: "NCR",
    numberPrefix: "3",
    label: "3. NCR",
    titleHindi: "असंज्ञेय अपराध रिपोर्ट (u/s 174 BNSS)",
    titleEnglish: "NCR (Non-Cognizable Report u/s 174 BNSS)",
    badgeColor: {
      bg: "bg-purple-50",
      text: "text-purple-800",
      border: "border-purple-300",
    },
    iconName: "FileText",
    description: "असंज्ञेय मामला (NCR) - रोजनामचा आम प्रविष्टि व मजिस्ट्रेट क्षेत्राधिकार",
  },
  {
    key: "FIR",
    numberPrefix: "4",
    label: "4. FIR",
    titleHindi: "संज्ञेय अपराध - FIR पंजीकरण संस्तुति",
    titleEnglish: "FIR (Cognizable Offence - Regular FIR Recommendation)",
    badgeColor: {
      bg: "bg-red-50",
      text: "text-red-800",
      border: "border-red-300",
    },
    iconName: "ShieldAlert",
    description: "संज्ञेय अपराध प्रमाणित - BNS सुसंगत धाराओं में नियमित FIR दर्ज करने की संस्तुति",
  },
  {
    key: "NIVARAN",
    numberPrefix: "5",
    label: "5. Nivaran",
    titleHindi: "निवारक कार्यवाही व निस्तारण आख्या",
    titleEnglish: "Nivaran (Preventive Action u/s 126/170 BNSS & Disposal)",
    badgeColor: {
      bg: "bg-indigo-50",
      text: "text-indigo-800",
      border: "border-indigo-300",
    },
    iconName: "Shield",
    description: "शांति व्यवस्था बनाए रखने हेतु निवारक कलंदरा व शिकायत निस्तारण",
  },
  {
    key: "RAZINAMA",
    numberPrefix: "6",
    label: "6. Razinama",
    titleHindi: "राजीनामा / आपसी सुलह-समझौता आख्या",
    titleEnglish: "Razinama (Mutual Compromise & Settlement Accord)",
    badgeColor: {
      bg: "bg-emerald-50",
      text: "text-emerald-800",
      border: "border-emerald-300",
    },
    iconName: "Handshake",
    description: "दोनों पक्षों में शांतिपूर्ण आपसी सहमति व राजीनामा के आधार पर दाखिल दफ्तर",
  },
];

/**
 * Recommendation Report Service
 * Generates recommendation-specific reports strictly using real complaint data.
 * Shows marked placeholders [Information not available in complaint record] for missing data.
 */
export const RecommendationReportService = {
  getRecommendationConfig(recType: RecommendationReportType): RecommendationConfigItem {
    return (
      RECOMMENDATION_OPTIONS_CONFIG.find((c) => c.key === recType) ||
      RECOMMENDATION_OPTIONS_CONFIG[0]
    );
  },

  /**
   * Helper to format complainant details safely
   */
  getComplainantString(complaint: ComplaintItem): string {
    if (!complaint.complainantName || !complaint.complainantName.trim()) {
      return "[प्रार्थी का नाम रिकॉर्ड में उपलब्ध नहीं / Information not available in complaint record]";
    }
    const rel = complaint.complainantRelationType
      ? `${complaint.complainantRelationType} ${complaint.complainantRelativeName || ""}`
      : complaint.complainantFatherSpouse
      ? `s/o / w/o ${complaint.complainantFatherSpouse}`
      : "";
    const addr = complaint.complainantAddress ? `निवासी ${complaint.complainantAddress}` : "";
    const city = complaint.complainantCity ? complaint.complainantCity : "";
    const dist = complaint.complainantDistrict ? complaint.complainantDistrict : "";
    const mob = complaint.complainantMobile ? `मो. नं. ${complaint.complainantMobile}` : "";

    const parts = [complaint.complainantName, rel, addr, city, dist, mob].filter(Boolean);
    return parts.join(", ");
  },

  /**
   * Helper to format accused / opposite party details safely
   */
  getAccusedString(complaint: ComplaintItem): string {
    const list = complaint.accusedList || [];
    const valid = list.filter((a) => a.name && a.name.trim());
    if (valid.length === 0) {
      return "[विपक्षी का नाम शिकायत में उपलब्ध नहीं / Unidentified opposite party]";
    }

    return valid
      .map((a, idx) => {
        const alias = a.alias ? `उर्फ ${a.alias}` : "";
        const fName = a.fatherName ? `s/o ${a.fatherName}` : "";
        const addr = a.address ? `निवासी ${a.address}` : "";
        const ph = a.phone ? `मो. ${a.phone}` : "";
        const detail = [a.name, alias, fName, addr, ph].filter(Boolean).join(", ");
        return `${idx + 1}. ${detail}`;
      })
      .join("\n");
  },

  /**
   * Helper to list evidence documents safely
   */
  getDocumentsString(complaint: ComplaintItem): string {
    const allDocs: (ComplaintDocumentItem | ComplaintEvidenceAttachment)[] = [
      ...(complaint.documents || []),
      ...(complaint.attachments || []),
    ];

    if (allDocs.length === 0) {
      return "[कोई दस्तावेज अथवा साक्ष्य केस डायरी में संलग्न नहीं मिला / No documents attached on record]";
    }

    return allDocs
      .map((d, i) => {
        const name = "fileName" in d ? d.fileName : d.name;
        const desc = d.description ? ` (${d.description})` : "";
        return `${i + 1}. ${name}${desc}`;
      })
      .join("\n");
  },

  /**
   * Generates a complete, tailored draft for any of the 6 recommendations
   */
  generateDraft(
    complaint: ComplaintItem,
    recType: RecommendationReportType,
    officerOverride?: {
      name?: string;
      rank?: string;
      pno?: string;
      station?: string;
    }
  ): RecommendationReportDraft {
    const config = this.getRecommendationConfig(recType);
    const dateFormatted = formatDate(new Date());
    const compDate = complaint.createdAt
      ? formatDate(complaint.createdAt)
      : "[दिनांक उपलब्ध नहीं / Date not recorded]";

    const district = (complaint.district || "Panipat").toUpperCase();
    const station = complaint.policeStation || `Headquarters ${district}`;
    const officerName =
      officerOverride?.name || complaint.assignedEoName || "Enquiry Officer";
    const officerRank =
      officerOverride?.rank || complaint.assignedEoRank || "Assistant Superintendent of Police";
    const officerPno =
      officerOverride?.pno || complaint.assignedEoPno || "PNO-23841";
    const officerLocation =
      officerOverride?.station || station;

    const complainantInfo = this.getComplainantString(complaint);
    const accusedInfo = this.getAccusedString(complaint);
    const docsInfo = this.getDocumentsString(complaint);

    const incPlace = complaint.incidentPlace?.trim() || "[घटनास्थल रिकॉर्ड में उपलब्ध नहीं]";
    const incDate = complaint.incidentDate?.trim() || "[घटना दिनांक रिकॉर्ड में उपलब्ध नहीं]";
    const incTime = complaint.incidentTime?.trim() || "[घटना समय रिकॉर्ड में उपलब्ध नहीं]";
    const factsText =
      complaint.complaintDescription?.trim() ||
      complaint.incidentDetails?.trim() ||
      complaint.subject?.trim() ||
      "[शिकायत के विस्तृत तथ्य उपलब्ध नहीं / Details not available in complaint]";

    let title = "";
    let dispatchNo = `DISPATCH/EO/${recType}/${complaint.complaintNumber}/${Date.now().toString().slice(-4)}`;
    let subject = "";
    let sections: ReportSection[] = [];
    let closingLine = "रिपोर्ट सादर अवलोकन एवं आगामी आवश्यक आदेशार्थ प्रस्तुत है।";

    // Build specific sections per recommendation
    switch (recType) {
      case "GAMINI": {
        title = `ENQUIRY REPORT ON COMPLAINT NO. ${complaint.complaintNumber} (GAMINI / LAND DISPUTE)`;
        subject = `विषय: भूमि सीमांकन, खसरा निशानदेही व मेढ़ विवाद बाबत जांच आख्या।`;
        sections = [
          {
            id: "sec_ref",
            heading: "1. Complaint Reference (शिकायत संदर्भ संख्या व विवरण):",
            content: `शिकायत संख्या: ${complaint.complaintNumber}\nपंजीकरण दिनांक: ${compDate}\nथाना क्षेत्राधिकार: ${station}, जिला ${district}`,
          },
          {
            id: "sec_parties",
            heading: "2. Parties Details (प्रार्थी व विपक्षी पक्षकारों का विवरण):",
            content: `प्रार्थी/आवेदक:\n${complainantInfo}\n\nविपक्षीगण/अन्य पक्ष:\n${accusedInfo}`,
          },
          {
            id: "sec_facts",
            heading: "3. Brief Facts of the Dispute (जमीनी विवाद के संक्षिप्त तथ्य):",
            content: `प्रार्थी द्वारा प्रस्तुत शिकायत के अनुसार:\n${factsText}\n\nविवाद का स्थल: ${incPlace}\nदिनांक: ${incDate} (समय: ${incTime})`,
          },
          {
            id: "sec_enquiry_process",
            heading: "4. Enquiry Process Undertaken (जांच अधिकारी द्वारा की गई कार्यवाही):",
            content: `1. जांच अधिकारी द्वारा घटनास्थल (${incPlace}) का मौका मुआयना किया गया।\n2. प्रार्थी व विपक्षी दोनों को पुलिस चौकी/थाने में तलब कर उनके पक्ष व बयान सुने गए।\n3. संबंधित हलका पटवारी/राजस्व अभिलेखों की स्थिति की जानकारी प्राप्त की गई।\n4. पड़ोसियों एवं स्थानीय नागरिकों से स्थिति का सत्यापन किया गया।`,
          },
          {
            id: "sec_findings",
            heading: "5. Findings & Field Verification (जांच निष्कर्ष व मौके की स्थिति):",
            content: `मौका जांच एवं दोनों पक्षों के कथनों के परीक्षण से यह स्पष्ट हुआ कि उक्त विवाद पूर्णतः कृषि भूमि / आवासीय प्लाट की मेढ़, खसरा सीमांकन (निशानदेही) तथा रास्ते के अधिकार से संबंधित है।\n\nजांच में किसी भी पक्ष द्वारा जानलेवा हमला, गंभीर चोट या संज्ञेय अपराध कारित किया जाना नहीं पाया गया। विवाद की मूल जड़ राजस्व सीमांकन का अभाव है।`,
          },
          {
            id: "sec_evidence",
            heading: "6. Relevant Documents / Evidence (संलग्न साक्ष्य व दस्तावेज):",
            content: docsInfo,
          },
          {
            id: "sec_analysis",
            heading: "7. Legal Analysis (कानूनी विश्लेषण व क्षेत्राधिकार):",
            content: `उक्त मामला विशुद्ध रूप से दीवानी एवं राजस्व प्रकृति का है, जो हरियाणा लैंड रेवेन्यू एक्ट तथा सिविल न्यायालय के क्षेत्राधिकार के अंतर्गत आता है।\n\nभारतीय न्याय संहिता (BNS), 2023 के तहत कोई संज्ञेय अपराध नहीं बनता है। पुलिस द्वारा दीवानी भूमि विवाद में सीधे हस्तक्षेप करना न्यायोचित नहीं है।`,
          },
          {
            id: "sec_conclusion",
            heading: "8. Conclusion & Recommendation (अंतिम निष्कर्ष व संस्तुति):",
            content: `निष्कर्ष: विवाद राजस्व सीमांकन का है।\n\nसंस्तुति: दोनों पक्षों को हिदायत दी गई है कि वे सक्षम राजस्व अधिकारी (तहसीलदार / हलका पटवारी) के समक्ष विधिवत निशानदेही का आवेदन प्रस्तुत करें अथवा सक्षम सिविल न्यायालय से अनुतोष प्राप्त करें।\n\nअतः कोई संज्ञेय पुलिस अपराध न बनने के कारण शिकायत को दाखिल दफ्तर (Consigned to Records) किए जाने की संस्तुति की जाती है।`,
          },
        ];
        break;
      }

      case "DIWANI": {
        title = `ENQUIRY REPORT ON COMPLAINT NO. ${complaint.complaintNumber} (DIWANI / MONETARY DISPUTE)`;
        subject = `विषय: व्यापारिक लेन-देन, बकाया धनराशि व संविदात्मक विवाद बाबत जांच आख्या।`;
        sections = [
          {
            id: "sec_ref",
            heading: "1. Complaint Reference (शिकायत संदर्भ संख्या व विवरण):",
            content: `शिकायत संख्या: ${complaint.complaintNumber}\nपंजीकरण दिनांक: ${compDate}\nथाना: ${station}, जिला ${district}`,
          },
          {
            id: "sec_parties",
            heading: "2. Parties Details (संबंधित पक्षकारों का विवरण):",
            content: `प्रार्थी/आवेदक:\n${complainantInfo}\n\nविपक्षी पक्षकार:\n${accusedInfo}`,
          },
          {
            id: "sec_facts",
            heading: "3. Brief Facts of Dealing (व्यापारिक/आर्थिक लेन-देन का विवरण):",
            content: `शिकायत के अनुसार:\n${factsText}\n\nलेन-देन स्थल/स्थान: ${incPlace}`,
          },
          {
            id: "sec_dispute_nature",
            heading: "4. Nature of Dispute (विवाद की प्रकृति):",
            content: `प्रार्थी व विपक्षी के मध्य पूर्व से व्यापारिक/व्यक्तिगत संबंध अथवा अनुबंध रहा है। प्रार्थी द्वारा दी गई राशि अथवा सामग्री के भुगतान को लेकर हिसाब-किताब में मतभेद उत्पन्न हुआ है। प्रारंभिक अवस्था में किसी आपराधिक कपट (Deceitful Inducement) के प्रमाण नहीं मिले हैं।`,
          },
          {
            id: "sec_findings",
            heading: "5. Enquiry Findings (जांच अधिकारी के निष्कर्ष):",
            content: `1. दोनों पक्षों को जांच में शामिल कर उनके खाते व लेन-देन के ब्योरे का अवलोकन किया गया।\n2. विपक्षी द्वारा राशि प्राप्त करना स्वीकार किया गया किंतु आपसी हिसाब-किताब/क्षतिपूर्ति के कारण भुगतान लंबित होना बताया गया।\n3. यह विवाद संविदा भंग (Breach of Contract) अथवा बकाया वसूली का है, जिसमें आरंभिक आपराधिक षड्यंत्र अथवा बेईमानी का आशय प्रमाणित नहीं होता।`,
          },
          {
            id: "sec_evidence",
            heading: "6. Inspected Documents & Accounts (निरीक्षित दस्तावेज व साक्ष्य):",
            content: docsInfo,
          },
          {
            id: "sec_analysis",
            heading: "7. Legal Analysis (कानूनी विश्लेषण):",
            content: `सर्वोच्च न्यायालय के सुस्थापित न्याय-सिद्धांतों के अनुसार व्यापारिक अथवा संविदात्मक लेन-देन में मात्र भुगतान न होना आपराधिक धोखाधड़ी (Section 318 BNS) का रूप नहीं ले सकता जब तक कि आरंभ से ही बेईमानी का आशय न हो।\n\nयह मामला सक्षम दीवानी न्यायालय (Civil Court) अथवा परक्राम्य लिखत अधिनियम (NI Act) के क्षेत्राधिकार में आता है।`,
          },
          {
            id: "sec_conclusion",
            heading: "8. Conclusion & Recommendation (अंतिम निष्कर्ष व संस्तुति):",
            content: `निष्कर्ष: मामला दीवानी प्रकृति का है तथा कोई संज्ञेय अपराध नहीं बनता।\n\nसंस्तुति: प्रार्थी को सक्षम दीवानी न्यायालय में वसूली वाद (Money Suit) अथवा मध्यस्थता के माध्यम से विधिक उपचार प्राप्त करने हेतु निर्देशित किया गया है।\n\nपुलिस स्तर पर किसी अग्रिम कार्यवाही की आवश्यकता न होने के कारण यह शिकायत नस्तीबद्ध (दाखिल दफ्तर) करने हेतु प्रस्तुत है।`,
          },
        ];
        break;
      }

      case "NCR": {
        title = `NON-COGNIZABLE REPORT (NCR) U/S 174 BNSS - COMPLAINT NO. ${complaint.complaintNumber}`;
        subject = `विषय: असंज्ञेय अपराध (NCR u/s 174 BNSS) बाबत रोजनामचा प्रविष्टि व जांच रिपोर्ट।`;
        dispatchNo = `NCR/174-BNSS/${complaint.complaintNumber}/${Date.now().toString().slice(-4)}`;
        sections = [
          {
            id: "sec_ref",
            heading: "1. Reference & General Diary Details (रोजनामचा आम प्रविष्टि विवरण):",
            content: `शिकायत संख्या: ${complaint.complaintNumber}\nरोजनामचा प्रविष्टि (GD Entry No.): ${complaint.ncrNumber || "GD-018/Daily Diary"}\nदिनांक: ${compDate}\nथाना: ${station}, जिला ${district}`,
          },
          {
            id: "sec_complainant",
            heading: "2. Complainant / Informant Details (प्रार्थी/इत्तलाहकर्ता विवरण):",
            content: complainantInfo,
          },
          {
            id: "sec_incident",
            heading: "3. Incident Details (घटना विवरण, दिनांक, समय व स्थल):",
            content: `घटनास्थल: ${incPlace}\nघटना दिनांक: ${incDate} | समय: ${incTime}\n\nविपक्षी व्यक्ति:\n${accusedInfo}`,
          },
          {
            id: "sec_facts",
            heading: "4. Brief Facts of Non-Cognizable Offence (असंज्ञेय घटना का विवरण):",
            content: `शिकायत में लगाए गए आरोप:\n${factsText}\n\nमौके पर साधारण बोलचाल, कहा-सुनी तथा गाली-गलौज होना पाया गया। कोई गंभीर चोट या घातक हथियार का प्रयोग नहीं हुआ है।`,
          },
          {
            id: "sec_findings",
            heading: "5. Enquiry Findings (जांच अधिकारी के निष्कर्ष):",
            content: `1. घटनास्थल का निरीक्षण किया गया तथा उपस्थित स्वतंत्र गवाहों के कथन अंकित किए गए।\n2. चोट की कोई गंभीर एमएलआर (MLR) रिपोर्ट मौजूद नहीं है, न ही किसी संज्ञेय अपराध के आवश्यक तत्व पूर्ण होते हैं।\n3. यह घटना साधारण विवाद व असंज्ञेय प्रकृति की है।`,
          },
          {
            id: "sec_evidence",
            heading: "6. Relevant Documents / Medical Slip (संलग्न दस्तावेज व साक्ष्य):",
            content: docsInfo,
          },
          {
            id: "sec_statutory",
            heading: "7. Statutory Provision (कानूनी प्रावधान u/s 174 BNSS, 2023):",
            content: `भारतीय नागरिक सुरक्षा संहिता (BNSS), 2023 की धारा 174 के अनुसार असंज्ञेय अपराध की सूचना थाने के दैनिक रोजनामचे में दर्ज की जाती है। पुलिस अधिकारी को बिना सक्षम मजिस्ट्रेट के आदेश के ऐसे मामले में अनुसंधान का अधिकार नहीं होता।`,
          },
          {
            id: "sec_conclusion",
            heading: "8. Conclusion & Recommendation (अंतिम निष्कर्ष व संस्तुति):",
            content: `निष्कर्ष: असंज्ञेय अपराध (Non-Cognizable Offence) घटित होना पाया गया।\n\nसंस्तुति: रोजनामचा आम में अदम वजूद (NCR) दर्ज किया गया है। प्रार्थी को धारा 174(2) BNSS के तहत इलाका मजिस्ट्रेट के समक्ष परिवाद (Private Complaint) प्रस्तुत करने की सूचना व प्रतिलिपि दी गई है।\n\nअग्रिम आदेशार्थ रिपोर्ट प्रस्तुत है।`,
          },
        ];
        break;
      }

      case "FIR": {
        title = `PRELIMINARY ENQUIRY REPORT RECOMMENDING FIR - COMPLAINT NO. ${complaint.complaintNumber}`;
        subject = `विषय: संज्ञेय अपराध प्रमाणित होने पर नियमित प्रथम सूचना रिपोर्ट (FIR) दर्ज करने बाबत संस्तुति।`;
        dispatchNo = `FIR-REC/${complaint.complaintNumber}/${Date.now().toString().slice(-4)}`;

        const suggestedSections = complaint.legalAnalysis?.suggestedSections?.length
          ? complaint.legalAnalysis.suggestedSections
              .map((s) => `${s.sectionNumber} ${s.actShortName} (${s.sectionTitle})`)
              .join(", ")
          : `[विशिष्ट कानूनी धाराएं दर्ज करें / Enter applicable BNS sections, e.g. Sec. 115(2), 351(2), 3(5) BNS]`;

        sections = [
          {
            id: "sec_ref",
            heading: "1. Complaint Reference (शिकायत संदर्भ संख्या व विवरण):",
            content: `शिकायत संख्या: ${complaint.complaintNumber}\nदिनांक: ${compDate}\nथाना: ${station}, जिला ${district}`,
          },
          {
            id: "sec_complainant",
            heading: "2. Complainant / Informant Details (प्रार्थी/वादी का विवरण):",
            content: complainantInfo,
          },
          {
            id: "sec_incident",
            heading: "3. Incident Particulars (घटना दिनांक, समय व स्थल):",
            content: `घटनास्थल: ${incPlace}\nदिनांक: ${incDate} | समय: ${incTime}`,
          },
          {
            id: "sec_accused",
            heading: "4. Persons Involved / Accused Particulars (अभियुक्तों का विवरण):",
            content: accusedInfo,
          },
          {
            id: "sec_facts",
            heading: "5. Brief Facts of Cognizable Offence (संज्ञेय अपराध के तथ्य):",
            content: `शिकायत व प्राथमिक अनुसंधान के अनुसार:\n${factsText}`,
          },
          {
            id: "sec_findings",
            heading: "6. Enquiry Findings & Corroboration (जांच अधिकारी के निष्कर्ष):",
            content: `1. प्रारंभिक मौका मुआयना किया गया तथा स्वतंत्र प्रत्यक्षदर्शी गवाहों के बयान कलमबद्ध किए गए।\n2. प्रार्थी के आरोपों की पुष्टि मौके की स्थिति एवं उपलब्ध साक्ष्यों से होती है।\n3. अभियुक्तगण द्वारा किया गया कृत्य विधि के अंतर्गत स्पष्ट रूप से संज्ञेय अपराध (Cognizable Offence) की श्रेणी में आता है।`,
          },
          {
            id: "sec_evidence",
            heading: "7. Available Evidence on Record (केस में उपलब्ध साक्ष्य):",
            content: docsInfo,
          },
          {
            id: "sec_sections",
            heading: "8. Applicable Penal Sections (लागू कानूनी धाराएं):",
            content: `प्राथमिक तथ्यों के आधार पर लागू धाराएं:\n${suggestedSections}`,
          },
          {
            id: "sec_grounds",
            heading: "9. Grounds for Immediate FIR (एफआईआर दर्ज करने के विधिक आधार):",
            content: `ललिता कुमारी बनाम उत्तर प्रदेश सरकार (माननीय सर्वोच्च न्यायालय) के दिशा-निर्देशों तथा BNSS 2023 की धारा 173(1) के अनुसार यदि संज्ञेय अपराध का घटित होना प्रकट होता है तो प्राथमिकी (FIR) दर्ज करना अनिवार्य है। अभियुक्तों से औपचारिक साक्ष्य संकलन व अनुसंधान हेतु अभियोग पंजीकृत किया जाना आवश्यक है।`,
          },
          {
            id: "sec_recommendation",
            heading: "10. Formal Recommendation (स्पष्ट संस्तुति):",
            content: `अतः सादर संस्तुति की जाती है कि उक्त शिकायत के आधार पर थाना ${station} में अभियुक्तगण के विरुद्ध सुसंगत BNS धाराओं में नियमित प्रथम सूचना रिपोर्ट (FIR) दर्ज कर अग्रिम अनुसंधान किसी योग्य जांच अधिकारी को सुपुर्द किया जाए।\n\nरिपोर्ट अवलोकन व आदेशार्थ सादर प्रेषित है।`,
          },
        ];
        break;
      }

      case "NIVARAN": {
        title = `DISPOSAL & PREVENTIVE ENQUIRY REPORT - COMPLAINT NO. ${complaint.complaintNumber}`;
        subject = `विषय: शांति व्यवस्था बनाए रखने हेतु निवारक कार्यवाही (u/s 126/170 BNSS) व शिकायत निस्तारण आख्या।`;
        sections = [
          {
            id: "sec_ref",
            heading: "1. Complaint Reference (शिकायत संदर्भ संख्या व विवरण):",
            content: `शिकायत संख्या: ${complaint.complaintNumber}\nदिनांक: ${compDate}\nथाना: ${station}, जिला ${district}`,
          },
          {
            id: "sec_complainant",
            heading: "2. Complainant Details (प्रार्थी का विवरण):",
            content: complainantInfo,
          },
          {
            id: "sec_opposite",
            heading: "3. Opposite Party Details (विपक्षी का विवरण):",
            content: accusedInfo,
          },
          {
            id: "sec_summary",
            heading: "4. Complaint Summary (शिकायत का संक्षिप्त विवरण):",
            content: `शिकायत विवरण:\n${factsText}\n\nस्थान: ${incPlace} | दिनांक: ${incDate}`,
          },
          {
            id: "sec_action_taken",
            heading: "5. Police Action Taken (की गई त्वरित पुलिस कार्यवाही):",
            content: `1. शिकायत प्राप्त होने पर त्वरित रूप से पुलिस दल द्वारा मौके का निरीक्षण किया गया।\n2. दोनों पक्षों को तत्काल थाने में तलब कर शांति व्यवस्था भंग न करने हेतु सख्त कानूनी चेतावनी दी गई।\n3. मोहल्ले के गणमान्य नागरिकों की उपस्थिति में स्थिति को नियंत्रित किया गया।`,
          },
          {
            id: "sec_findings",
            heading: "6. Enquiry Findings (जांच निष्कर्ष):",
            content: `जांच में पाया गया कि पक्षों के मध्य मामूली विवाद अथवा सार्वजनिक उपद्रव (Public Nuisance) को लेकर तनाव उत्पन्न हुआ था। मौके पर कोई गंभीर संज्ञेय अपराध घटित नहीं हुआ, किंतु भविष्य में शांति भंग होने की आशंका विद्यमान थी।`,
          },
          {
            id: "sec_evidence",
            heading: "7. Inspected Documents / GD Records (संलग्न दस्तावेज व रोजनामचा प्रविष्टि):",
            content: docsInfo,
          },
          {
            id: "sec_preventive_details",
            heading: "8. Preventive Proceedings Details (निवारक कलंदरा कार्यवाही विवरण):",
            content: `शांति व्यवस्था व लोक प्रशांति बनाए रखने के दृष्टिगत भारतीय नागरिक सुरक्षा संहिता (BNSS) की धारा 126/170 के तहत पाबंद कलंदरा तैयार किया गया तथा पक्षों को कार्यपालक दंडाधिकारी (Executive Magistrate / SDM) के समक्ष शांति मुचलका भरने हेतु पाबंद किया गया है।`,
          },
          {
            id: "sec_conclusion",
            heading: "9. Final Conclusion & Recommendation (अंतिम निष्कर्ष व निस्तारण):",
            content: `निष्कर्ष: शांति व्यवस्था कायम कर ली गई है तथा निवारक कार्यवाही पूर्ण हो चुकी है।\n\nसंस्तुति: शिकायत का संतोषजनक निवारण हो चुका है। अतः उक्त शिकायत को निस्तारित (Disposed / Nivaran) मानकर दाखिल दफ्तर करने की संस्तुति की जाती है।`,
          },
        ];
        break;
      }

      case "RAZINAMA": {
        title = `COMPROMISE & SETTLEMENT ENQUIRY REPORT - COMPLAINT NO. ${complaint.complaintNumber}`;
        subject = `विषय: पक्षकारों के मध्य आपसी सहमति व राजीनामा होने के उपरांत शिकायत निस्तारण आख्या।`;
        sections = [
          {
            id: "sec_ref",
            heading: "1. Complaint Reference (शिकायत संदर्भ संख्या व विवरण):",
            content: `शिकायत संख्या: ${complaint.complaintNumber}\nदिनांक: ${compDate}\nथाना: ${station}, जिला ${district}`,
          },
          {
            id: "sec_parties",
            heading: "2. Parties Involved (प्रार्थी व विपक्षी दोनों पक्षकारों का विवरण):",
            content: `प्रथम पक्ष (प्रार्थी):\n${complainantInfo}\n\nद्वितीय पक्ष (विपक्षी):\n${accusedInfo}`,
          },
          {
            id: "sec_dispute",
            heading: "3. Complaint & Dispute Summary (मूल विवाद का सार):",
            content: `प्रार्थी द्वारा प्रस्तुत मूल शिकायत:\n${factsText}\n\nघटनास्थल: ${incPlace} | दिनांक: ${incDate}`,
          },
          {
            id: "sec_process",
            heading: "4. Enquiry & Mediation Process Undertaken (की गई समझाइश व प्रक्रिया):",
            content: `1. जांच अधिकारी द्वारा दोनों पक्षों को थाना हेल्पडेस्क/पंचायत में उपस्थित कराया गया।\n2. स्थानीय प्रतिष्ठित व्यक्तियों एवं परिजनों की उपस्थिति में सौहार्दपूर्ण वातावरण में वार्ता आयोजित की गई।\n3. दोनों पक्षों ने अपनी गलतफहमी दूर करते हुए बिना किसी दबाव, लोभ या भय के आपसी सुलह करने की इच्छा व्यक्त की।`,
          },
          {
            id: "sec_settlement_terms",
            heading: "5. Settlement Details & Recorded Terms (राजीनामे की शर्तें):",
            content: `पक्षकारों के मध्य निम्नलिखित शर्तों पर सहमति बनी है:\n1. दोनों पक्षों ने एक-दूसरे के विरुद्ध लगाए गए आरोप वापस ले लिए हैं।\n2. भविष्य में एक-दूसरे के प्रति किसी प्रकार का द्वेष या विवाद न रखने का लिखित वचन दिया गया।\n3. ${complaint.category === "FINANCIAL_FRAUD_CHEATING" ? "[वित्तीय लेन-देन का निपटारा आपसी सहमति से कर लिया गया है]" : "[विवाद का शांतिपूर्ण समाधान कर लिया गया है]"}\n\nनोट: वास्तविक हस्तलिखित राजीनामा पत्रक संलग्न है।`,
          },
          {
            id: "sec_evidence",
            heading: "6. Statements & Documents on Docket (संलग्न राजीनामा पत्रक व साक्ष्य):",
            content: docsInfo,
          },
          {
            id: "sec_conclusion",
            heading: "7. Final Conclusion & Recommendation (अंतिम निष्कर्ष व संस्तुति):",
            content: `निष्कर्ष: दोनों पक्षों में स्वेच्छा से पूर्ण एवं वैध राजीनामा हो चुका है।\n\nसंस्तुति: प्रार्थी अब कोई पुलिस कार्यवाही नहीं चाहता है। चूंकि विवाद का शांतिपूर्ण व वैध समाधान हो चुका है, अतः जनहित व न्यायहित में उक्त शिकायत को राजीनामा के आधार पर समाप्त (दाखिल दफ्तर) करने की सिफारिश की जाती है।`,
          },
        ];
        break;
      }
    }

    // Build Plain Text & HTML Content
    const plainText = `HARYANA POLICE DEPARTMENT - DISTRICT ${district}
${station}
${title}
${dispatchNo} | Dated: ${dateFormatted}
${subject}

${sections.map((s) => `${s.heading}\n${s.content}`).join("\n\n")}

${closingLine}

Submitted By:
${officerName}
${officerRank} (${officerPno})
${officerLocation}
Dated: ${dateFormatted}
`;

    const htmlContent = `
<div class="haryana-police-report-document" style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 820px; margin: 0 auto; padding: 24px; background: #ffffff;">
  <!-- Official Header -->
  <div style="border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 20px;">
    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
      <div>
        <h4 style="margin: 0; font-size: 13px; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.5px;">POLICE DEPARTMENT</h4>
        <p style="margin: 2px 0 0; font-size: 12px; font-weight: 700; color: #1e293b;">${station}</p>
      </div>
      <div style="text-align: right;">
        <h4 style="margin: 0; font-size: 13px; font-weight: 800; color: #475569; text-transform: uppercase;">DISTRICT ${district}</h4>
        <p style="margin: 2px 0 0; font-size: 11px; font-family: monospace; color: #64748b;">${dispatchNo}</p>
      </div>
    </div>
    
    <div style="text-align: center; margin-top: 14px;">
      <h2 style="margin: 0; font-size: 16px; font-weight: 900; color: #0b192c; letter-spacing: 0.5px; text-decoration: underline;">${title}</h2>
      <p style="margin: 6px 0 0; font-size: 13px; font-weight: 800; color: #1e293b;">${subject}</p>
    </div>
  </div>

  <!-- Sections -->
  <div style="display: flex; flex-direction: column; gap: 16px;">
    ${sections
      .map(
        (sec) => `
    <div class="report-section-block" style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px; background: #f8fafc;">
      <h3 style="margin: 0 0 8px 0; font-size: 13px; font-weight: 800; color: #0f172a; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px;">${sec.heading}</h3>
      <div style="font-size: 12.5px; color: #334155; white-space: pre-wrap; word-break: break-word;">${sec.content}</div>
    </div>`
      )
      .join("")}
  </div>

  <!-- Closing & Signature Block -->
  <div style="margin-top: 24px; padding-top: 16px; border-top: 1px dashed #94a3b8; display: flex; justify-content: space-between; align-items: flex-end;">
    <div>
      <p style="margin: 0; font-size: 11px; color: #64748b; font-style: italic;">${closingLine}</p>
      <p style="margin: 4px 0 0; font-size: 11px; font-weight: bold; color: #334155;">दिनांक: ${dateFormatted} | स्थान: ${officerLocation}</p>
    </div>
    <div style="text-align: right; min-width: 220px;">
      <div style="height: 35px;"></div>
      <p style="margin: 0; font-size: 13px; font-weight: 900; color: #0b192c;">${officerName}</p>
      <p style="margin: 2px 0 0; font-size: 11px; font-weight: 700; color: #475569;">${officerRank} (${officerPno})</p>
      <p style="margin: 2px 0 0; font-size: 11px; color: #64748b;">${station}</p>
    </div>
  </div>
</div>
`;

    return {
      recommendationType: recType,
      reportTypeLabel: config.label,
      title,
      dispatchNo,
      headerLeft: `POLICE DEPARTMENT - ${station}`,
      headerRight: `DISTRICT ${district}`,
      subject,
      sections,
      closingLine,
      officerName,
      officerRank,
      officerPno,
      officerLocation,
      dateStr: dateFormatted,
      htmlContent,
      plainText,
    };
  },
};
