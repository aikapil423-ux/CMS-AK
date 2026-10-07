import { ComplaintItem, ComplaintDocumentItem, ComplaintEvidenceAttachment } from "@/types";

export type EnquiryClassificationType =
  | "FIR_RECOMMENDED"
  | "JAMINI_LAND_DISPUTE"
  | "DIWANI_CIVIL_MONEY"
  | "RAJINAMA_COMPROMISE"
  | "NIVARAK_PREVENTIVE"
  | "NO_COGNIZABLE_OFFENCE";

export interface ComplaintAnalysisResult {
  classification: EnquiryClassificationType;
  titleHindi: string;
  titleEnglish: string;
  badgeColor: {
    bg: string;
    text: string;
    border: string;
  };
  iconName: string;
  rationaleHindi: string;
  rationaleEnglish: string;
  analyzedDocuments: string[];
  findingsGistHindi: string;
  findingsGistEnglish: string;
  substantiatedSections?: string;
  isFirRecommended: boolean;
  recommendedActionText: string;
  proformaFindingsText: {
    standard_4row: string;
    three_column: {
      allegation: string;
      findings: string;
      actionTaken: string;
    }[];
    citizen_detail: {
      satisfaction: string;
      finalReport: string;
    };
    ncr_174: string;
  };
}

/**
 * Intelligent police analysis engine that analyzes the complaint profile overview,
 * category, description, and all uploaded & saved evidence documents to determine
 * the legal nature of the case (Jamini, Diwani, Rajinama, Nivarak, FIR Recommended, No Action).
 */
export function analyzeComplaintForEnquiry(complaint: ComplaintItem): ComplaintAnalysisResult {
  const cat = complaint.category || "";
  const sub = (complaint.subject || "").toLowerCase();
  const desc = (complaint.complaintDescription || "").toLowerCase();
  const inc = (complaint.incidentDetails || "").toLowerCase();
  const allText = `${sub} ${desc} ${inc} ${complaint.incidentPlace || ""}`.toLowerCase();

  // 1. Gather all document names and descriptions
  const docs: (ComplaintDocumentItem | ComplaintEvidenceAttachment)[] = [
    ...(complaint.documents || []),
    ...(complaint.attachments || []),
  ];

  const analyzedDocuments: string[] = [];
  const docKeywords: string[] = [];

  docs.forEach((d) => {
    const name = ("fileName" in d ? d.fileName : d.name) || "";
    const desc = d.description || "";
    const category = ("fileCategory" in d ? d.fileCategory : d.category) || "";
    analyzedDocuments.push(name ? `${name} (${category || "DOC"})` : "Uploaded Evidence");
    docKeywords.push(name.toLowerCase(), desc.toLowerCase(), category.toLowerCase());
  });

  // Notes inspection
  (complaint.enquiryNotes || []).forEach((n) => {
    docKeywords.push((n.content || "").toLowerCase());
    if (n.attachment?.name) {
      analyzedDocuments.push(`${n.attachment.name} (NOTE EVIDENCE)`);
      docKeywords.push(n.attachment.name.toLowerCase());
    }
  });

  const allDocText = docKeywords.join(" ");
  const combinedContext = `${allText} ${allDocText}`;

  // Helper check functions
  const hasKeyword = (keywords: string[]) => keywords.some((kw) => combinedContext.includes(kw));

  // 2. Intelligence Classification Logic
  // A. Check for Rajinama / Compromise / Amicable Accord first
  const rajinamaKeywords = [
    "raazi nama",
    "raazinama",
    "rajinama",
    "samjhota",
    "samjhauta",
    "compromise",
    "settlement deed",
    "iqrarnama",
    "aapsi samjhauta",
    "aapsi samjhota",
    "mutual accord",
    "withdrawn",
    "dono paksh sahmat",
    "raaji nama",
    "apology",
    "sulahnama",
  ];
  const isRajinama = hasKeyword(rajinamaKeywords);

  // B. Check for FIR Recommended (Cognizable offence, MLR, Medico-legal, grievous injury, forgery, cyber cheating > 50k, weapon, molestation)
  const firKeywords = [
    "mlr",
    "medico-legal",
    "medico legal",
    "fracture",
    "grievous",
    "lathi",
    "danda",
    "iron rod",
    "knife",
    "weapon",
    "forged signature",
    "forged registry",
    "fake deed",
    "forgery",
    "extortion",
    "molestation",
    "sexual",
    "dowry cruelty",
    "stolen vehicle",
    "theft",
    "burglary",
    "318(4)",
    "338",
    "115(2)",
    "117",
    "109",
    "351",
    "chot",
    "hospital",
    "fsl",
    "medical examination",
  ];
  const isFirLikely =
    !isRajinama &&
    (hasKeyword(firKeywords) ||
      cat === "PHYSICAL_ASSAULT_AFFRAY" ||
      cat === "PROPERTY_THEFT_BURGLARY" ||
      cat === "NARCOTICS_DRUGS_INFO" ||
      (cat === "CYBER_CRIME" && (hasKeyword(["fraud", "transferred", "otp", "upi", "hacked"]) || desc.length > 50)));

  // C. Check for Jamini / Land / Revenue Demarcation Dispute
  const jaminiKeywords = [
    "jamini",
    "jamin",
    "khasra",
    "killa",
    "khatoni",
    "patwari",
    "tehsildar",
    "nishandehi",
    "demarcation",
    "boundary wall",
    "medh",
    "aks shajra",
    "aks latha",
    "kabja",
    "possession",
    "partition",
    "bantwara",
    "intkal",
    "mutation",
    "passage dispute",
    "gali rasta",
    "revenue court",
    "agricultural land",
  ];
  const isJamini =
    !isRajinama &&
    !isFirLikely &&
    (cat === "LAND_PROPERTY_DISPUTE" || hasKeyword(jaminiKeywords));

  // D. Check for Diwani / Civil Money / Financial Business Dispute
  const diwaniKeywords = [
    "diwani",
    "udhar",
    "lene dene",
    "monetary",
    "loan",
    "cheque bounce",
    "balance payment",
    "business partner",
    "contractual",
    "construction bill",
    "promissory note",
    "bahi khata",
    "ledger",
    "bank statement",
    "invoice",
    "commercial dispute",
    "hisab kitab",
  ];
  const isDiwani =
    !isRajinama &&
    !isFirLikely &&
    !isJamini &&
    (cat === "FINANCIAL_FRAUD_CHEATING" || hasKeyword(diwaniKeywords));

  // E. Check for Nivarak Karyavahi (Preventive Proceedings u/s 126/129/170 BNSS)
  const nivarakKeywords = [
    "nivarak",
    "kalandra",
    "126",
    "170",
    "107/151",
    "breach of peace",
    "shanti bhang",
    "heated argument",
    "gali galoch",
    "tu tu main main",
    "tension in locality",
    "padosi vivad",
    "neighbor quarrel",
    "public nuisance",
    "bound down",
  ];
  const isNivarak =
    !isRajinama &&
    !isFirLikely &&
    !isJamini &&
    !isDiwani &&
    (cat === "PUBLIC_NUISANCE" || hasKeyword(nivarakKeywords));

  // Decision determination
  let classification: EnquiryClassificationType = "NO_COGNIZABLE_OFFENCE";
  if (isRajinama) {
    classification = "RAJINAMA_COMPROMISE";
  } else if (isFirLikely) {
    classification = "FIR_RECOMMENDED";
  } else if (isJamini) {
    classification = "JAMINI_LAND_DISPUTE";
  } else if (isDiwani) {
    classification = "DIWANI_CIVIL_MONEY";
  } else if (isNivarak) {
    classification = "NIVARAK_PREVENTIVE";
  } else {
    classification = "NO_COGNIZABLE_OFFENCE";
  }

  const compNo = complaint.complaintNumber;
  const complainantName = complaint.complainantName;
  const oppositeParty = complaint.accusedList?.[0]?.name || "Opposite Party";
  const docSummaryText =
    analyzedDocuments.length > 0
      ? `दस्तावेज संलग्न (${analyzedDocuments.slice(0, 3).join(", ")})`
      : "शिकायत विवरण व प्राथमिक कथनों";

  // Build Results
  switch (classification) {
    case "FIR_RECOMMENDED": {
      const sections =
        cat === "PHYSICAL_ASSAULT_AFFRAY"
          ? "Sec. 115(2), 117(2), 351(2), 3(5) BNS, 2023"
          : cat === "CYBER_CRIME" || cat === "FINANCIAL_FRAUD_CHEATING"
          ? "Sec. 318(4), 336(3), 340(2), 61(2) BNS, 2023"
          : cat === "DOMESTIC_VIOLENCE_DOWRY"
          ? "Sec. 85, 86, 351(2) BNS, 2023"
          : "Sec. 115(2), 351(2), 3(5) BNS, 2023";

      return {
        classification: "FIR_RECOMMENDED",
        titleHindi: "संज्ञेय अपराध - एफआईआर की सिफारिश",
        titleEnglish: "Cognizable Offence (FIR Recommended)",
        badgeColor: {
          bg: "bg-red-50",
          text: "text-red-700",
          border: "border-red-300",
        },
        iconName: "ShieldAlert",
        rationaleHindi: `शिकायत के तथ्यों, घटना स्थल के निरीक्षण एवं संलग्न ${docSummaryText} के अवलोकन से संज्ञेय अपराध (Cognizable Offence) का घटित होना प्रमाणित पाया गया है। मामले में नियमित प्राथमिकी (FIR) दर्ज कर वैधानिक अनुसंधान की सिफारिश की जाती है।`,
        rationaleEnglish: `Preliminary enquiry, spot verification and analysis of ${analyzedDocuments.length > 0 ? analyzedDocuments.join(", ") : "case facts"} substantiate prima facie commission of cognizable penal offences under BNS, 2023. Regular FIR registration is imperative.`,
        analyzedDocuments,
        findingsGistHindi: `जांच में संज्ञेय अपराध प्रमाणित। विपक्षी के विरुद्ध BNS धाराओं में नियमित एफआईआर दर्ज करने हेतु रिपोर्ट SHO को प्रेषित।`,
        findingsGistEnglish: `Cognizable penal offence substantiated. Recommended for immediate registration of formal FIR under BNS.`,
        substantiatedSections: sections,
        isFirRecommended: true,
        recommendedActionText: "Send to SHO ID for FIR Registration",
        proformaFindingsText: {
          standard_4row: `FINAL REPORT & FINDINGS (COGNIZABLE OFFENCE SUBSTANTIATED):\nRespected Sir, the preliminary enquiry into Complaint No. ${compNo} lodged by ${complainantName} was conducted by me. Statements of complainant, eye-witnesses and local residents were recorded, and spot inspection was carried out.\n\nScrutiny of verified facts and medical/documentary records (${analyzedDocuments.length > 0 ? analyzedDocuments.join(", ") : "evidence on docket"}) substantiates prima facie commission of cognizable offences under ${sections} against opposite party ${oppositeParty}.\n\nCustodial interrogation, site plan inspection, and formal evidence collection under Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023 are indispensable to bring the perpetrators to justice.\n\nRECOMMENDATION: It is respectfully recommended that a regular First Information Report (FIR) under ${sections} be registered at Police Station ${complaint.policeStation || "concerned"} and formal investigation be assigned to an Investigating Officer.\nReport is submitted for approval and registration of FIR.`,
          three_column: [
            {
              allegation: `Allegations of cognizable hurt/fraud/criminal threats leveled by ${complainantName} against ${oppositeParty}.`,
              findings: `Field verification, witness testimony and documentary evidence (${analyzedDocuments.join(", ") || "on record"}) substantiate the allegations. Medico-legal / financial records confirm prima facie commission of offence.`,
              actionTaken: `Preliminary enquiry completed. Regular FIR under ${sections} strongly recommended. Case docket submitted to SHO for FIR registration.`,
            },
          ],
          citizen_detail: {
            satisfaction: "UNSATISFIED PENDING POLICE ACTION - Cognizable offence made out. Case forwarded for FIR registration.",
            finalReport: `Inquiry conducted into Complaint No. ${compNo}. Allegations of physical altercation/fraud verified through witness testimonies and evidence documents. Cognizable offence established under BNS. Recommended for registration of regular FIR.`,
          },
          ncr_174: `Enquiry conducted. Cognizable elements substantiated. Matter transferred from NCR to regular FIR registration docket under orders of SHO.`,
        },
      };
    }

    case "JAMINI_LAND_DISPUTE": {
      return {
        classification: "JAMINI_LAND_DISPUTE",
        titleHindi: "ज़मीनी / राजस्व सीमा विवाद (दीवानी मामला)",
        titleEnglish: "Land & Revenue Demarcation Dispute",
        badgeColor: {
          bg: "bg-amber-50",
          text: "text-amber-800",
          border: "border-amber-300",
        },
        iconName: "Landmark",
        rationaleHindi: `शिकायत व संलग्न ${docSummaryText} से स्पष्ट है कि यह मामला कृषि भूमि / प्लाट की सीमांकन (निशानदेही), खसरा नंबर पर कब्जे अथवा मेढ़ से संबंधित राजस्व दीवानी विवाद है। इसमें कोई संज्ञेय अपराध नहीं बनता।`,
        rationaleEnglish: `Enquiry and documentary verification establish that the dispute pertains to land demarcation, Khasra boundaries and possession. No cognizable police offence made out. Remedy lies with the Revenue Court / Halqa Patwari.`,
        analyzedDocuments,
        findingsGistHindi: `विवाद भूमि सीमांकन (निशानदेही) से संबंधित राजस्व दीवानी प्रकृति का है। कोई संज्ञेय अपराध नहीं। दाखिल दफ्तर की सिफारिश।`,
        findingsGistEnglish: `Purely civil revenue dispute regarding land demarcation. No police cognizance. Recommended for file closure (Dakhil Daftarr).`,
        isFirRecommended: false,
        recommendedActionText: "Dispose as Civil Revenue Matter (Dakhil Daftarr)",
        proformaFindingsText: {
          standard_4row: `FINAL REPORT & PROCEEDINGS (REVENUE / LAND DISPUTE):\nRespected Sir, preliminary field enquiry into Complaint No. ${compNo} lodged by ${complainantName} was conducted on the spot. Both the complainant and opposite party ${oppositeParty} were joined in the enquiry and their statements were recorded.\n\nScrutiny of land revenue records, Patwari demarcation reports, and local inquiries reveal that this dispute is fundamentally over the boundary line, Khasra demarcation, and passage between adjacent plots. Neither party has caused any cognizable hurt, nor is there any criminal trespass with penal intent established.\n\nThe subject matter falls squarely within the jurisdiction of the Revenue Authorities (Tehsildar / Halqa Patwari) under the Haryana Land Revenue Act and the competent Civil Court.\n\nRECOMMENDATION: As no cognizable criminal offence is made out, parties have been advised to obtain formal demarcation through Revenue authorities. Matter is recommended to be consigned to the record room (दाखिल दफ्तर).`,
          three_column: [
            {
              allegation: `Allegations regarding illegal encroachment and land dispute on plot/khasra by opposite party ${oppositeParty}.`,
              findings: `Field enquiry and revenue verification indicate a boundary demarcation dispute between adjoining landowners. No criminal force or cognizable trespass found.`,
              actionTaken: `Parties directed to Revenue Tehsildar for lawful demarcation. No police interference warranted. Complaint consigned to records.`,
            },
          ],
          citizen_detail: {
            satisfaction: "INFORMED & EXPLAINED - Advised to approach Tehsildar for revenue demarcation.",
            finalReport: `Inquiry conducted into Complaint No. ${compNo}. The matter is of purely civil revenue nature regarding land demarcation. No cognizable offence made out. Both parties informed of lawful revenue remedy. Matter disposed of.`,
          },
          ncr_174: `Enquiry into complaint ${compNo} completed. Matter found to be civil boundary dispute. No cognizable offense. Entry recorded in Daily Diary and consigned.`,
        },
      };
    }

    case "DIWANI_CIVIL_MONEY": {
      return {
        classification: "DIWANI_CIVIL_MONEY",
        titleHindi: "दीवानी / पैसों का लेन-देन / व्यापारिक विवाद",
        titleEnglish: "Civil Monetary & Contractual Dispute",
        badgeColor: {
          bg: "bg-blue-50",
          text: "text-blue-800",
          border: "border-blue-300",
        },
        iconName: "Banknote",
        rationaleHindi: `बैंक खातों, बही-खातों एवं संलग्न ${docSummaryText} के विश्लेषण से स्पष्ट है कि यह दो पक्षों के बीच व्यापारिक उधारी अथवा अनुबंध के भुगतान का दीवानी विवाद है। इसमें शुरुआत से कोई धोखाधड़ी या संज्ञेय अपराध प्रमाणित नहीं है।`,
        rationaleEnglish: `Scrutiny of accounts, statements and transaction records demonstrates that the dispute pertains to contractual business dues and monetary loan recovery. No dishonest inducement ab-initio or cognizable offence established.`,
        analyzedDocuments,
        findingsGistHindi: `पैसों के लेन-देन व व्यापारिक उधारी का दीवानी विवाद। कोई संज्ञेय अपराध नहीं बनता। न्यायालय में दावा दायर करने की सलाह।`,
        findingsGistEnglish: `Commercial / monetary transaction dispute. No cognizable cheating established. Civil court remedy available.`,
        isFirRecommended: false,
        recommendedActionText: "Dispose as Civil Contractual Matter (Dakhil Daftarr)",
        proformaFindingsText: {
          standard_4row: `FINAL REPORT & PROCEEDINGS (CIVIL MONETARY TRANSACTION):\nRespected Sir, enquiry into Complaint No. ${compNo} lodged by ${complainantName} was conducted. Both parties appeared and furnished their account details, receipts, and mutual financial claims.\n\nEnquiry establishes that the dispute centers around pending business dues, work contract payments, and monetary reconciliation between the parties. The initial monetary transaction was conducted by mutual consent, and there is no evidence of fraudulent dishonest inducement from inception or forgery of documents.\n\nThe dispute is of purely civil nature for recovery of money, governed by the Law of Contract and Civil Procedure Code, 1908. The Hon'ble Supreme Court has repeatedly held that civil recovery proceedings cannot be converted into criminal prosecution.\n\nRECOMMENDATION: No cognizable criminal offence is substantiated. Parties advised to approach the competent Civil Court for recovery. Recommended for file closure / consigned to record room (दाखिल दफ्तर दीवानी मामला).`,
          three_column: [
            {
              allegation: `Allegation of non-payment of balance money and cheating leveled against ${oppositeParty}.`,
              findings: `Accounts scrutiny and statements show an ongoing commercial dispute regarding pending contractual bills. No criminal intent to cheat ab-initio.`,
              actionTaken: `Parties advised to settle accounts through civil litigation. Police intervention closed as civil matter.`,
            },
          ],
          citizen_detail: {
            satisfaction: "INFORMED - Advised to seek civil recovery through competent court.",
            finalReport: `Enquiry conducted into Complaint No. ${compNo}. Matter pertained to financial business accounts and unpaid dues. No cognizable cheating made out. Disposed of as civil matter.`,
          },
          ncr_174: `Inquiry into complaint ${compNo} completed. Established to be civil financial claim. Recorded in Station General Diary and consigned.`,
        },
      };
    }

    case "RAJINAMA_COMPROMISE": {
      return {
        classification: "RAJINAMA_COMPROMISE",
        titleHindi: "राजीनामा / आपसी समझौता (सहमति पत्र)",
        titleEnglish: "Mutual Accord & Amicable Settlement",
        badgeColor: {
          bg: "bg-emerald-50",
          text: "text-emerald-800",
          border: "border-emerald-300",
        },
        iconName: "Handshake",
        rationaleHindi: `दस्तावेजों में उपलब्ध राजीनामा / समझौता पत्र (Iqrarnama) एवं दोनों पक्षों के बयानों से प्रमाणित है कि मौजिज व्यक्तियों के समक्ष आपसी सहमति से विवाद शांतिपूर्वक सुलझ चुका है। प्रार्थी आगे कोई कानूनी कार्रवाई नहीं चाहता।`,
        rationaleEnglish: `Written compromise deed (Iqrarnama / Raazinama) and statements on docket demonstrate that both parties have amicably resolved all misunderstandings in the presence of respectables. Complainant does not press charges.`,
        analyzedDocuments,
        findingsGistHindi: `दोनों पक्षों में मौजिज व्यक्तियों के समक्ष सम्मानपूर्वक राजीनामा संपन्न। प्रार्थी पूर्णतः संतुष्ट। पत्रावली दाखिल दफ्तर।`,
        findingsGistEnglish: `Voluntary compromise deed executed between parties. Complainant fully satisfied. File disposed on mutual accord.`,
        isFirRecommended: false,
        recommendedActionText: "Dispose on Mutual Accord / Rajinama",
        proformaFindingsText: {
          standard_4row: `FINAL REPORT & PROCEEDINGS (MUTUAL ACCORD & RAJINAMA):\nRespected Sir, the enquiry into Complaint No. ${compNo} lodged by ${complainantName} was conducted. Complainant ${complainantName} and opposite party ${oppositeParty} appeared along with respectable members of their village/community and Panchayat.\n\nBoth parties discussed their grievances and mutually sorted out all differences and misunderstandings amicably without any threat, coercion, undue influence or greed. A written compromise deed (Iqrarnama / Raazinama) has been voluntarily executed and submitted on record along with signatures of respectable witnesses.\n\nThe complainant has furnished a written statement stating that she/he has no subsisting grudge or grievance against the opposite party and voluntarily withdraws the complaint, requesting file closure.\n\nRECOMMENDATION: In view of the genuine written compromise deed and voluntary statements of satisfaction placed on record, the matter has been peacefully resolved. Recommended that the complaint be disposed of on mutual accord and consigned to the record room (दाखिल दफ्तर राजीनामा).`,
          three_column: [
            {
              allegation: `Dispute and mutual grievances leveled between ${complainantName} and ${oppositeParty}.`,
              findings: `Parties convened at Police Station Helpdesk in presence of Panchayat. Voluntary compromise deed executed amicably. Complainant furnished satisfaction statement.`,
              actionTaken: `Compromise deed (Iqrarnama) placed on file. Complainant satisfied. Matter disposed of on mutual accord.`,
            },
          ],
          citizen_detail: {
            satisfaction: "SATISFIED (YES) - Dispute amicably resolved before respectables. Written compromise furnished.",
            finalReport: `Enquiry conducted into Complaint No. ${compNo}. Both parties appeared and settled all disputes amicably. Written compromise deed placed on record. Complainant expressed complete satisfaction. Matter disposed of.`,
          },
          ncr_174: `Inquiry into complaint ${compNo} completed. Both parties executed written settlement. Entered in Station Roznamcha and consigned.`,
        },
      };
    }

    case "NIVARAK_PREVENTIVE": {
      return {
        classification: "NIVARAK_PREVENTIVE",
        titleHindi: "निवारक कार्रवाई (BNSS धारा 126/129/170)",
        titleEnglish: "Preventive Action u/s 126/129/170 BNSS",
        badgeColor: {
          bg: "bg-purple-50",
          text: "text-purple-800",
          border: "border-purple-300",
        },
        iconName: "ShieldAlert",
        rationaleHindi: `मौका मुआयना तथा पड़ोसियों के बयानों से ज्ञात हुआ कि दोनों पक्षों में पुरानी रंजिश के कारण कहासुनी व शांति भंग होने (Breach of Peace) की प्रबल आशंका है। कानून-व्यवस्था बनाए रखने हेतु निवारक कार्रवाई कलंदरा तैयार किया गया है।`,
        rationaleEnglish: `Enquiry reveals tension and heated altercations between parties leading to imminent apprehension of breach of peace and public tranquility. Preventive proceedings under BNSS initiated.`,
        analyzedDocuments,
        findingsGistHindi: `शांति भंग होने की आशंका के दृष्टिगत धारा 126/129/170 BNSS के तहत निवारक कलंदरा तैयार। कार्यपालक मजिस्ट्रेट को प्रेषित।`,
        findingsGistEnglish: `Preventive kalandra proceedings initiated under BNSS Sections 126/129/170 to bind down parties before Magistrate.`,
        isFirRecommended: false,
        recommendedActionText: "Initiate Preventive Kalandra Proceedings (BNSS 126/170)",
        proformaFindingsText: {
          standard_4row: `FINAL REPORT & PREVENTIVE PROCEEDINGS (BNSS 126 / 129 / 170):\nRespected Sir, enquiry into Complaint No. ${compNo} lodged by ${complainantName} was conducted on the spot. Statements of both parties and independent local neighbors were recorded.\n\nEnquiry reveals that minor altercations and heated verbal arguments take place between the parties due to previous petty disputes. While no cognizable physical violence or serious criminal offence has taken place so far, there is a clear, imminent apprehension of breach of peace and disturbance of public tranquility in the locality.\n\nTo prevent any escalation or commission of cognizable offence, preventive proceedings under Sections 126 / 129 / 170 of Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023 have been initiated against both sides vide Station Daily Diary (GD) Entry.\n\nRECOMMENDATION: Preventive Kalandra is being submitted before the Learned Executive Magistrate for binding down both parties with sureties to maintain good behavior and public peace. Complaint file may be consigned to record room.`,
          three_column: [
            {
              allegation: `Repeated altercations, verbal abuse and threat of breach of peace between neighbors.`,
              findings: `No major cognizable hurt found, but tension exists creating apprehension of breach of peace and public tranquility.`,
              actionTaken: `Preventive Kalandra proceedings initiated under Sections 126/170 BNSS, 2023. Parties warned and bound down before Executive Magistrate.`,
            },
          ],
          citizen_detail: {
            satisfaction: "WARNED & BOUND DOWN - Preventive proceedings initiated to ensure peace in locality.",
            finalReport: `Inquiry conducted into Complaint No. ${compNo}. Both parties were warned and preventive proceedings under Section 126/170 BNSS initiated to avert breach of peace. Matter disposed of.`,
          },
          ncr_174: `Inquiry completed into complaint ${compNo}. Entered in Roznamcha under Section 174 BNSS read with preventive provisions 126 BNSS.`,
        },
      };
    }

    case "NO_COGNIZABLE_OFFENCE":
    default: {
      return {
        classification: "NO_COGNIZABLE_OFFENCE",
        titleHindi: "कोई संज्ञेय अपराध नहीं (निराधार शिकायत / दाखिल दफ्तर)",
        titleEnglish: "No Cognizable Offence (Unsubstantiated / Consigned)",
        badgeColor: {
          bg: "bg-slate-50",
          text: "text-slate-700",
          border: "border-slate-300",
        },
        iconName: "FileX2",
        rationaleHindi: `जांच, मौका मुआयना व स्थानीय गवाहों के बयानों से शिकायत में लगाए गए आरोपों की पुष्टि नहीं हुई। आरोप अतिरंजित व मनगढ़ंत पाए गए हैं। मामले में कोई संज्ञेय पुलिस कार्रवाई नहीं बनती।`,
        rationaleEnglish: `Independent spot verification and witness statements demonstrate that the allegations leveled are unsubstantiated and lack corroboration. No cognizable police offence made out. Recommended for closure.`,
        analyzedDocuments,
        findingsGistHindi: `जांच में आरोप निराधार पाए गए। कोई संज्ञेय अपराध घटित नहीं हुआ। शिकायत दाखिल दफ्तर करने की सिफारिश।`,
        findingsGistEnglish: `Allegations unsubstantiated during enquiry. No cognizable offence established. File consigned to records.`,
        isFirRecommended: false,
        recommendedActionText: "Consign to Record Room / No Action (दाखिल दफ्तर)",
        proformaFindingsText: {
          standard_4row: `FINAL REPORT & PROCEEDINGS (UNSUBSTANTIATED ALLEGATIONS):\nRespected Sir, the preliminary enquiry into Complaint No. ${compNo} lodged by ${complainantName} was conducted. During the enquiry, the complainant, opposite party ${oppositeParty}, and independent local eyewitnesses were examined.\n\nThe complainant failed to produce any corroborating witness or documentary evidence to substantiate the allegations. Spot inspection and independent statements revealed that the allegations were leveled under emotional exaggeration or trivial rancor without substance.\n\nNo cognizable offence is disclosed against the opposite party. No further police intervention is lawful or justified.\n\nRECOMMENDATION: It is respectfully recommended that the complaint be consigned to the record room (दाखिल दफ्तर) and the applicant be informed accordingly.`,
          three_column: [
            {
              allegation: `Allegations leveled by complainant ${complainantName} against opposite party ${oppositeParty}.`,
              findings: `Field verification and statements of independent neighbors reveal allegations are unsubstantiated and exaggerated. No offence substantiated.`,
              actionTaken: `No cognizable offence disclosed. Complainant informed. Complaint consigned to record room.`,
            },
          ],
          citizen_detail: {
            satisfaction: "EXPLAINED & INFORMED - Allegations found unsubstantiated during spot enquiry.",
            finalReport: `Inquiry conducted into Complaint No. ${compNo}. Allegations could not be substantiated during spot inquiry. No cognizable offence made out. Complaint closed.`,
          },
          ncr_174: `Inquiry into complaint ${compNo} completed. No cognizable offence established. Entered into Daily Diary Roznamcha under Section 174 BNSS and consigned.`,
        },
      };
    }
  }
}
