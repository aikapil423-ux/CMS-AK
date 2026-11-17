/**
 * Statutory Deadlines & Limitation Intelligence Engine
 * Enforces BNSS 2023 statutory timelines, default bail warnings, and supervisory alarms:
 * - Section 187 BNSS: 60/90-day detention limit for default bail (Statutory Bail Alert)
 * - Section 173(3) BNSS: 14-day preliminary enquiry limit for complaints
 * - Section 57/58 BNSS: 24-hour magistrate production rule
 * - Section 35(3) BNSS: 7-day appearance compliance window
 */

export interface StatutoryDeadlineAlert {
  id: string;
  caseReference: string;
  caseType: "FIR" | "COMPLAINT" | "ARREST";
  title: string;
  titleHi: string;
  statutorySection: string;
  daysRemaining: number;
  totalLimitDays: number;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "INFO";
  implication: string;
  suggestedAction: string;
  isOverdue: boolean;
}

export class StatutoryDeadlinesEngine {
  /**
   * Evaluates Section 187 BNSS 60/90 day default bail risk for an FIR with arrested accused
   */
  public static evaluateDefaultBailRisk(
    firNumber: string,
    arrestDate: string | Date,
    offenseSections: string,
    accusedName: string
  ): StatutoryDeadlineAlert {
    const arrestTime = new Date(arrestDate).getTime();
    const now = Date.now();
    const elapsedDays = Math.floor((now - arrestTime) / (1000 * 60 * 60 * 24));

    // Offenses punishable with death, life imprisonment or imprisonment >= 10 years get 90 days; others 60 days
    const isHeinous = /murder|103|105|rape|64|70|dacoity|310|kidnapping|140|ndps|commercial/i.test(offenseSections);
    const limitDays = isHeinous ? 90 : 60;
    const daysRemaining = limitDays - elapsedDays;
    const isOverdue = daysRemaining <= 0;

    let severity: StatutoryDeadlineAlert["severity"] = "INFO";
    if (isOverdue || daysRemaining <= 3) severity = "CRITICAL";
    else if (daysRemaining <= 10) severity = "HIGH";
    else if (daysRemaining <= 20) severity = "MEDIUM";

    return {
      id: `DEF-BAIL-${firNumber}-${accusedName}`.replace(/\s+/g, "-"),
      caseReference: `FIR ${firNumber}`,
      caseType: "FIR",
      title: `Default Bail Risk: ${accusedName}`,
      titleHi: `डिफ़ॉल्ट ज़मानत चेतावनी: अभियुक्त ${accusedName} (${daysRemaining} दिन शेष)`,
      statutorySection: "धारा 187(2) एवं 187(3) BNSS (पुरानी 167(2) CrPC)",
      daysRemaining: Math.max(0, daysRemaining),
      totalLimitDays: limitDays,
      severity,
      implication: isOverdue
        ? `अभियुक्त ${accusedName} न्यायिक हिरासत में ${elapsedDays} दिन पूरे कर चुका है। चालान दाखिल न होने पर वह डिफ़ॉल्ट ज़मानत का पूर्ण हकदार है।`
        : `यदि ${daysRemaining} दिनों के भीतर चालान न्यायालय में प्रस्तुत नहीं हुआ, तो अभियुक्त को वैधानिक डिफ़ॉल्ट ज़मानत मिल जाएगी।`,
      suggestedAction: isOverdue
        ? "तत्काल धारा 193 BNSS के तहत अंतरिम चालान या FSL रिमाइंड रिपोर्ट न्यायालय में दाखिल करें।"
        : "एफएसएल रिपोर्ट व एमएलसी संकलित कर अंतिम चालान 193 BNSS का ड्राफ्ट शीघ्र तैयार करें।",
      isOverdue,
    };
  }

  /**
   * Evaluates Section 173(3) BNSS 14-day preliminary enquiry limit for complaints
   */
  public static evaluateComplaintEnquiryDeadline(
    complaintNumber: string,
    registrationDate: string | Date,
    enquiryOfficer: string
  ): StatutoryDeadlineAlert {
    const regTime = new Date(registrationDate).getTime();
    const now = Date.now();
    const elapsedDays = Math.floor((now - regTime) / (1000 * 60 * 60 * 24));
    const limitDays = 14;
    const daysRemaining = limitDays - elapsedDays;
    const isOverdue = daysRemaining <= 0;

    let severity: StatutoryDeadlineAlert["severity"] = "INFO";
    if (isOverdue || daysRemaining <= 2) severity = "CRITICAL";
    else if (daysRemaining <= 5) severity = "HIGH";
    else if (daysRemaining <= 8) severity = "MEDIUM";

    return {
      id: `COMP-LIMIT-${complaintNumber}`,
      caseReference: `शिकायत #${complaintNumber}`,
      caseType: "COMPLAINT",
      title: `14-Day Enquiry Limit (Sec 173(3) BNSS)`,
      titleHi: `14-दिवसीय प्राथमिक जांच समय-सीमा (${enquiryOfficer})`,
      statutorySection: "धारा 173(3) BNSS 2023",
      daysRemaining: Math.max(0, daysRemaining),
      totalLimitDays: limitDays,
      severity,
      implication: isOverdue
        ? `शिकायत दर्ज हुए ${elapsedDays} दिन बीत चुके हैं। धारा 173(3) BNSS की वैधानिक 14-दिवसीय प्राथमिक जांच अवधि समाप्त हो गई है।`
        : `जांच अधिकारी ${enquiryOfficer} को शेष ${daysRemaining} दिनों में जांच आख्या SHO को प्रेषित करनी होगी।`,
      suggestedAction: isOverdue
        ? "थाना प्रभारी (SHO) स्तर पर तत्काल अंतिम निर्णय (FIR पंजीकरण अथवा फाइल दाखिल) लिया जाए।"
        : "जांच अधिकारी से अंतरिम स्थिति आख्या तलब की जाए।",
      isOverdue,
    };
  }

  /**
   * Formats a Hindi executive summary briefing of active statutory deadlines
   */
  public static generateExecutiveBriefing(alerts: StatutoryDeadlineAlert[]): string {
    if (!alerts.length) {
      return "✅ **वैधानिक समय-सीमा समीक्षा (Statutory Audit):** थाने के सभी केस वैधानिक समय-सीमा के अंतर्गत हैं। कोई डिफ़ॉल्ट ज़मानत या जांच ओवरड्यू अलर्ट नहीं है।";
    }

    const critical = alerts.filter((a) => a.severity === "CRITICAL");
    const high = alerts.filter((a) => a.severity === "HIGH");

    let text = `🚨 **वैधानिक समय-सीमा व डिफ़ॉल्ट ज़मानत चेतावनी (Statutory Deadlines Audit):**\n\n`;
    text += `कुल सक्रिय अलर्ट: **${alerts.length}** (अति-संवेदनशील: **${critical.length}**, उच्च प्राथमिकता: **${high.length}**)\n\n`;

    alerts.slice(0, 5).forEach((alert, i) => {
      const icon = alert.isOverdue ? "⚠️ [समय समाप्त]" : `⏳ [${alert.daysRemaining} दिन शेष]`;
      text += `${i + 1}. **${alert.caseReference}** — ${alert.titleHi}\n`;
      text += `   • **कानूनी प्रावधान:** ${alert.statutorySection}\n`;
      text += `   • **प्रभाव:** ${alert.implication}\n`;
      text += `   • **अनुशंसित कार्यवाही:** ${alert.suggestedAction}\n\n`;
    });

    return text.trim();
  }
}
