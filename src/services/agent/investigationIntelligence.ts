/**
 * Investigation Intelligence & Scrutiny Sub-Engine
 * Handles:
 * 1. Chargesheet 7-Part Scrutiny before court submission (Section 193 BNSS)
 * 2. Speech-to-Zimni (Case Diary) narrative synthesizer (Section 192 BNSS)
 * 3. Modus Operandi (MO) Criminal Pattern Matching
 */

export interface ChargesheetScrutinyResult {
  firNumber: string;
  isReadyForCourt: boolean;
  score: number; // 0 to 100
  passedChecks: string[];
  deficiencies: Array<{ item: string; priority: "BLOCKER" | "WARNING" | "INFO"; remedy: string }>;
  evidenceReadiness: {
    medicalReport: boolean;
    fslForensicReport: boolean;
    seizureMemos: boolean;
    sitePlanMap: boolean;
    witnessStatements180Bnss: boolean;
    criminalAntecedentsSheet: boolean;
  };
}

export class InvestigationIntelligence {
  /**
   * Pre-submission Scrutiny of Chargesheet under Section 193 BNSS
   */
  public static scrutinizeChargesheetReadiness(params: {
    firNumber: string;
    offenseSections: string;
    witnessCount: number;
    hasMlCOrPostMortem?: boolean;
    hasFslReport?: boolean;
    hasSeizureMemo?: boolean;
    hasSitePlanNaksha?: boolean;
    hasAntecedentsList?: boolean;
    isPublicServantAccused?: boolean;
    hasGovtSanction?: boolean;
  }): ChargesheetScrutinyResult {
    const {
      firNumber,
      offenseSections,
      witnessCount,
      hasMlCOrPostMortem,
      hasFslReport,
      hasSeizureMemo,
      hasSitePlanNaksha,
      hasAntecedentsList,
      isPublicServantAccused,
      hasGovtSanction,
    } = params;

    const passedChecks: string[] = [];
    const deficiencies: ChargesheetScrutinyResult["deficiencies"] = [];
    let score = 0;

    // 1. Witness Statements check
    if (witnessCount >= 2) {
      score += 20;
      passedChecks.push(`गवाहान के बयान (धारा 180 BNSS): ${witnessCount} गवाह संकलित हैं।`);
    } else {
      deficiencies.push({
        item: "कम गवाहान (धारा 180 BNSS)",
        priority: "BLOCKER",
        remedy: "कम से कम 2 स्वतंत्र/प्रत्यक्षदर्शी गवाहों के बयान कलमबद्ध करें।",
      });
    }

    // 2. Site Plan (Naksha Mauka)
    if (hasSitePlanNaksha) {
      score += 20;
      passedChecks.push("नक्शा मौका (Site Plan) पत्रावली में संलग्न है।");
    } else {
      deficiencies.push({
        item: "नक्शा मौका अनुपस्थित",
        priority: "BLOCKER",
        remedy: "घटना स्थल का नज़री/पैमाइशी नक्शा मौका बनाकर I.O. के हस्ताक्षर से संलग्न करें।",
      });
    }

    // 3. Seizure Memo (Fard Zabti)
    if (hasSeizureMemo !== false) {
      score += 20;
      passedChecks.push("फर्द ज़ब्ती व मसरूका मालखाना इंद्राज पूर्ण है।");
    } else {
      deficiencies.push({
        item: "ज़ब्ती प्रपत्र (Seizure Memo)",
        priority: "WARNING",
        remedy: "माल बरामदगी की फर्द व 2 स्वतंत्र गवाहान के हस्ताक्षर संलग्न करें।",
      });
    }

    // 4. Medical / Forensic requirements
    const needsMedical = /injury|murder|assault|103|105|106|115|118|rape|64/i.test(offenseSections);
    if (needsMedical) {
      if (hasMlCOrPostMortem) {
        score += 20;
        passedChecks.push("मेडिकल परीक्षण रिपोर्ट (MLC/PM Report) संलग्न है।");
      } else {
        deficiencies.push({
          item: "मेडिकल/पोस्टमार्टम आख्या नदारद",
          priority: "BLOCKER",
          remedy: "अस्पताल से एमएलसी या डॉक्टर की अंतिम राय (Final Opinion on Injury) प्राप्त कर संलग्न करें।",
        });
      }
    } else {
      score += 20;
      passedChecks.push("गैर-शारीरिक अपराध; एमएलसी की आवश्यकता नहीं।");
    }

    // 5. FSL / Ballistics check
    const needsFsl = /arms|gun|pistol|knife|poison|ndps|cyber/i.test(offenseSections);
    if (needsFsl) {
      if (hasFslReport) {
        score += 10;
        passedChecks.push("FSL / बैलिस्टिक रासायनिक जांच रिपोर्ट संलग्न है।");
      } else {
        deficiencies.push({
          item: "FSL रिपोर्ट लंबित",
          priority: "WARNING",
          remedy: "यदि FSL रिपोर्ट अभी नहीं आई है तो धारा 193(9) BNSS के तहत पूरक चालान (Supplementary Report) का नोट लगाएं।",
        });
      }
    } else {
      score += 10;
    }

    // 6. Public servant sanction
    if (isPublicServantAccused) {
      if (hasGovtSanction) {
        score += 10;
        passedChecks.push("सक्षम प्राधिकारी से अभियोजन स्वीकृति (धारा 218 BNSS) प्राप्त है।");
      } else {
        deficiencies.push({
          item: "अभियोजन स्वीकृति (Sanction u/s 218 BNSS)",
          priority: "BLOCKER",
          remedy: "लोक सेवक के विरुद्ध सक्षम सरकार/विभाग से आधिकारिक अभियोजन आदेश प्राप्त किए बिना चालान पेश न करें।",
        });
      }
    } else {
      score += 10;
    }

    const hasBlockers = deficiencies.some((d) => d.priority === "BLOCKER");

    return {
      firNumber,
      isReadyForCourt: !hasBlockers && score >= 75,
      score: Math.min(100, score),
      passedChecks,
      deficiencies,
      evidenceReadiness: {
        medicalReport: !!hasMlCOrPostMortem,
        fslForensicReport: !!hasFslReport,
        seizureMemos: hasSeizureMemo !== false,
        sitePlanMap: !!hasSitePlanNaksha,
        witnessStatements180Bnss: witnessCount >= 2,
        criminalAntecedentsSheet: !!hasAntecedentsList,
      },
    };
  }

  /**
   * Synthesizes raw officer voice transcript into official Case Diary (Zimni) format u/s 192 BNSS
   */
  public static synthesizeSpeechToZimni(params: {
    firNumber: string;
    zimniNumber: number;
    policeStation: string;
    ioName: string;
    ioRank: string;
    rawNarration: string;
    locationInspected?: string;
    personsInterrogated?: string[];
  }): { header: string; officialNarrativeHindi: string; fullZimniText: string } {
    const {
      firNumber,
      zimniNumber,
      policeStation,
      ioName,
      ioRank,
      rawNarration,
      locationInspected,
      personsInterrogated,
    } = params;

    const dateStr = new Date().toLocaleDateString("hi-IN");
    const timeStr = new Date().toLocaleTimeString("hi-IN", { hour: "2-digit", minute: "2-digit" });

    const header = `पर्चा ज़िमनी नंबर: ${zimniNumber}
मुकद्दमा नंबर: FIR ${firNumber}
थाना: ${policeStation}
दिनांक: ${dateStr} | समय: ${timeStr} बजे
अन्वेषण अधिकारी: ${ioRank} ${ioName}`;

    let narrative = `आज दिनांक ${dateStr} को मैं, ${ioRank} ${ioName}, मय हमराही मुलाजमान बा-सवारी सरकारी वाहन तफ्तीश मुकद्दमा हाज़ा में रवाना हुआ। `;

    if (locationInspected) {
      narrative += `मौका वारदात **${locationInspected}** का मुआइना किया गया तथा मौके पर उपस्थित लोगों से पूछताछ की गई। `;
    }

    narrative += `\n\n**तफ्तीश का सार:**\n${rawNarration.trim()}\n\n`;

    if (personsInterrogated && personsInterrogated.length) {
      narrative += `**पूछताछ व बयान (धारा 180 BNSS):**\nतफ्तीश के दौरान गवाहान/संदिग्ध **${personsInterrogated.join(", ")}** से गहनता से पूछताछ कर उनके बयान अलग से लिपिबद्ध किए गए। `;
    }

    narrative += `\n\nआगामी तफ्तीश मुकद्दमा जारी है। वापसी पर इंद्राज रोजनामचा आम किया जाएगा।`;

    return {
      header,
      officialNarrativeHindi: narrative,
      fullZimniText: `${header}\n\n${narrative}\n\nहस्ताक्षर:\n${ioRank} ${ioName}\nथाना: ${policeStation}`,
    };
  }
}
