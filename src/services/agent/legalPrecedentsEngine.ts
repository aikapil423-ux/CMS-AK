/**
 * Legal Precedents & Bail Opposition Intelligence Engine
 * Indexed Supreme Court & High Court landmark rulings, statutory opposition grounds,
 * and prosecution objections generation for Haryana Police CMS.
 */

export interface LegalPrecedent {
  citation: string;
  bench: string;
  year: number;
  court: "Supreme Court of India" | "Punjab & Haryana High Court";
  topic: string;
  rulingSummary: string;
  applicableSections: string[];
  keyQuote: string;
}

export const LANDMARK_POLICE_PRECEDENTS: LegalPrecedent[] = [
  {
    citation: "Arnesh Kumar v. State of Bihar, (2014) 8 SCC 273",
    bench: "Chandramauli Kr. Prasad, Pinaki Chandra Ghose, JJ.",
    year: 2014,
    court: "Supreme Court of India",
    topic: "No Mechanical Arrest in offenses up to 7 years",
    rulingSummary: "7 वर्ष तक की सजा वाले अपराधों में गिरफ्तारी अनिवार्य नहीं है; धारा 35(3) BNSS / 41A CrPC का नोटिस देकर उपस्थिति सुनिश्चित की जानी चाहिए।",
    applicableSections: ["Section 35(3) BNSS", "Section 41A CrPC", "BNS Offenses <= 7 Years"],
    keyQuote: "Police officers shall not arrest the accused unnecessarily and magistrate shall not authorize detention casually.",
  },
  {
    citation: "Satender Kumar Antil v. CBI, (2022) 10 SCC 51",
    bench: "Sanjay Kishan Kaul, M.M. Sundresh, JJ.",
    year: 2022,
    court: "Supreme Court of India",
    topic: "Bail Categorization & Compliance Guidelines",
    rulingSummary: "अपराधों की 4 श्रेणियां (A, B, C, D) निर्धारित कर ज़मानत प्रक्रिया का सरलीकरण व 41A नोटिस का कठोर पालन।",
    applicableSections: ["Section 480 BNSS", "Section 483 BNSS", "Section 439 CrPC"],
    keyQuote: "Jails in India are flooded with undertrial prisoners. The arrest is a draconian measure which needs to be used sparingly.",
  },
  {
    citation: "State of Kerala v. Rajesh, (2020) 12 SCC 122",
    bench: "Indira Banerjee, M.R. Shah, JJ.",
    year: 2020,
    court: "Supreme Court of India",
    topic: "Rigorous Dual Conditions for Bail under Section 37 NDPS",
    rulingSummary: "वाणिज्यिक मात्रा (Commercial Quantity) के एनडीपीएस मामलों में जब तक कोर्ट संतुष्ट न हो कि अभियुक्त निर्दोष है और दोबारा अपराध नहीं करेगा, ज़मानत नहीं दी जा सकती।",
    applicableSections: ["NDPS Act Section 37", "Commercial Quantity", "Section 483 BNSS"],
    keyQuote: "The satisfaction of the court about the accused not being guilty is a mandatory condition precedent for granting bail.",
  },
  {
    citation: "Prasanta Kumar Sarkar v. Ashis Chatterjee, (2010) 14 SCC 496",
    bench: "D.K. Jain, H.L. Dattu, JJ.",
    year: 2010,
    court: "Supreme Court of India",
    topic: "Factors to be considered before granting Regular Bail in Heinous Crimes",
    rulingSummary: "जमानत तय करते समय: अपराध की गंभीरता, अभियुक्त का आपराधिक इतिहास (Antecedents), गवाहों को धमकाने की संभावना, और समाज पर प्रभाव देखना अनिवार्य है।",
    applicableSections: ["Section 103 BNS", "Section 310 BNS", "Section 483 BNSS"],
    keyQuote: "The court must examine whether there is any prima facie or reasonable ground to believe that the accused had committed the offence, danger of the accused absconding or fleeing, and likelihood of the offence being repeated.",
  },
  {
    citation: "Shafhi Mohammad v. State of Himachal Pradesh, (2018) 2 SCC 801",
    bench: "Adarsh Kumar Goel, U.U. Lalit, JJ.",
    year: 2018,
    court: "Supreme Court of India",
    topic: "Videography and Electronic Evidence at Crime Scene",
    rulingSummary: "अपराध स्थल के निरीक्षण व जब्ती की वीडियोग्राफी/फोटोग्राफी साक्ष्य की विश्वसनीयता को पुख्ता करती है (अब धारा 105 BNSS में वैधानिक रूप से अनिवार्य)।",
    applicableSections: ["Section 105 BNSS", "Section 63 BSA", "Electronic Records"],
    keyQuote: "Use of videography in the investigation is useful for appreciating evidence and preventing false accusations.",
  },
];

export class LegalPrecedentsEngine {
  /**
   * Search precedents matching offense section or keywords
   */
  public static findRelevantPrecedents(query: string): LegalPrecedent[] {
    const q = query.toLowerCase();
    return LANDMARK_POLICE_PRECEDENTS.filter(
      (p) =>
        p.citation.toLowerCase().includes(q) ||
        p.topic.toLowerCase().includes(q) ||
        p.applicableSections.some((s) => s.toLowerCase().includes(q))
    );
  }

  /**
   * Generates a formal Police Bail Objection Reply citing Supreme Court rulings
   */
  public static generateBailObjectionDraft(params: {
    firNumber: string;
    courtName: string;
    policeStation: string;
    applicantAccused: string;
    offenseSections: string;
    hearingDate?: string;
    hasCriminalAntecedents?: boolean;
    antecedentDetails?: string;
    isCommercialQuantityNdps?: boolean;
    isWitnessTamperingRisk?: boolean;
  }): { title: string; draftHindi: string; citedPrecedents: string[] } {
    const {
      firNumber,
      courtName,
      policeStation,
      applicantAccused,
      offenseSections,
      hasCriminalAntecedents,
      antecedentDetails,
      isCommercialQuantityNdps,
      isWitnessTamperingRisk,
    } = params;

    const cited: string[] = [];
    let objections = "";

    // 1. Seriousness & Gravity objection
    objections += `1. यह कि आरोपी **${applicantAccused}** द्वारा किया गया अपराध अत्यंत गंभीर, समाज-विरोधी व गैर-जमानती प्रकृति का है, जिसमें धाराएं **${offenseSections}** संज्ञेय हैं। माननीय सर्वोच्च न्यायालय ने *Prasanta Kumar Sarkar v. Ashis Chatterjee (2010)* में स्पष्ट अवधारित किया है कि अपराध की गंभीरता और समाज पर पड़ने वाले दुष्प्रभाव को देखे बिना ज़मानत नहीं दी जा सकती।\n\n`;
    cited.push("Prasanta Kumar Sarkar v. Ashis Chatterjee (2010) 14 SCC 496");

    // 2. NDPS specific objection if applicable
    if (isCommercialQuantityNdps || /ndps|chitta|smack|ganja|charas/i.test(offenseSections)) {
      objections += `2. यह कि आरोपी के विरुद्ध एनडीपीएस अधिनियम की वाणिज्यिक मात्रा (Commercial Quantity) का मामला है। धारा 37 एनडीपीएस के तहत द्विपक्षीय कठोर वैधानिक शर्तें लागू हैं। जैसा कि माननीय उच्चतम न्यायालय द्वारा *State of Kerala v. Rajesh (2020)* में व्यवस्था दी गई है, इस स्तर पर अभियुक्त को निर्दोष नहीं माना जा सकता, अतः ज़मानत अस्वीकार योग्य है।\n\n`;
      cited.push("State of Kerala v. Rajesh, (2020) 12 SCC 122");
    }

    // 3. Witness tampering / influence risk
    if (isWitnessTamperingRisk !== false) {
      objections += `3. यह कि मुकद्दमे की तफ्तीश नाजुक दौर में है और मुख्य गवाहान स्थानीय निवासी हैं। यदि आरोपी को इस प्रक्रम पर रिहा किया जाता है तो गवाहों को धमकाने, प्रलोभन देने तथा भौतिक साक्ष्यों से छेड़छाड़ की प्रबल आशंका विद्यमान है।\n\n`;
    }

    // 4. Criminal History
    if (hasCriminalAntecedents) {
      objections += `4. यह कि अभियुक्त का पूर्व आपराधिक इतिहास (Criminal Antecedents) संदिग्ध रहा है (${antecedentDetails || "थाने के अभिलेख में पूर्व अभियोग दर्ज हैं"})। रिहाई के उपरांत आरोपी द्वारा पुनः समान अपराध दोहराने तथा फरार होने की पूरी संभावना है।\n\n`;
    }

    objections += `5. यह कि अनुसंधान पूर्ण होने तक तथा चालान धारा 193 BNSS के तहत न्यायालय में पेश होने तक आरोपी का न्यायिक हिरासत में रहना न्यायहित में अनिवार्य है।\n\n`;

    const draft = `न्यायालय ${courtName || "माननीय मुख्य न्यायिक दंडाधिकारी"}
थाना: ${policeStation || "सदर"}
मुकद्दमा नंबर: FIR ${firNumber}
धाराएं: ${offenseSections}

विषय: अभियुक्त **${applicantAccused}** की ज़मानत अर्जी के विरुद्ध थाना पुलिस की ओर से आधिकारिक आपत्ति-पत्र (Bail Objection Reply)

श्रीमन् जी,

थाना पुलिस की ओर से विनम्र निवेदन निम्नवत है:

${objections}
प्रार्थना:
उपरोक्त आधारों एवं माननीय उच्चतम न्यायालय के विधिक दृष्टांतों के आलोक में आरोपी **${applicantAccused}** की जमानत याचिका को निरस्त (Dismiss) करने की कृपा की जाए।

दिनांक: ${new Date().toLocaleDateString("hi-IN")}
हस्ताक्षर जांच अधिकारी (I.O.)
थाना: ${policeStation}`;

    return {
      title: `Bail Objection Reply - FIR ${firNumber} (${applicantAccused})`,
      draftHindi: draft,
      citedPrecedents: cited,
    };
  }

  /**
   * Checks whether Sanction for Prosecution is required under Section 218 BNSS (197 CrPC)
   */
  public static checkProsecutionSanctionRequirement(
    offenseSections: string,
    isPublicServant: boolean,
    inLineOfDuty: boolean
  ): { required: boolean; section: string; explanation: string } {
    if (!isPublicServant) {
      return {
        required: false,
        section: "N/A",
        explanation: "अभियुक्त लोक सेवक (Public Servant) नहीं है, अतः अभियोजन स्वीकृति (Sanction) की आवश्यकता नहीं है।",
      };
    }

    if (inLineOfDuty) {
      return {
        required: true,
        section: "धारा 218 BNSS 2023 (पुरानी 197 CrPC)",
        explanation: "कथित कृत्य लोक सेवक द्वारा अपने पदीय कर्तव्यों के निर्वहन के दौरान किया गया प्रतीत होता है। न्यायालय द्वारा संज्ञान (Cognizance) लेने से पूर्व सक्षम प्राधिकारी (Govt/Department) से वैधानिक अभियोजन स्वीकृति अनिवार्य है।",
      };
    }

    return {
      required: false,
      section: "धारा 218 BNSS 2023",
      explanation: "कथित अपराध पदीय कर्तव्य के दायरे से बाहर व्यक्तिगत क्षमता में किया गया प्रतीत होता है, अतः सामान्य परिस्थितियों में पूर्व-स्वीकृति आवश्यक नहीं है।",
    };
  }
}
