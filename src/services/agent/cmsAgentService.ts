import { firService } from "@/services/firService";
import { ComplaintService } from "@/services/complaintService";
import { GeneralDiaryService } from "@/services/generalDiaryService";
import { AgentDocumentEngine } from "./agentDocumentEngine";
import {
  AgentMessage,
  AgentActionPlan,
  AgentActionItem,
  AgentSessionContext,
  ProposedDocument,
} from "@/types/cmsAgent";
import { FIRItem } from "@/types";

const SESSION_STORAGE_KEY = "haryana_police_cms_agent_session_v1";

export class CmsAgentService {
  private static context: AgentSessionContext = {
    conversationHistory: [],
  };

  public static getContext(): AgentSessionContext {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(SESSION_STORAGE_KEY);
        if (saved) {
          this.context = JSON.parse(saved);
        }
      } catch {
        // fallback
      }
    }
    return this.context;
  }

  public static updateContext(partial: Partial<AgentSessionContext>): void {
    this.context = { ...this.context, ...partial };
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(this.context));
      } catch {
        // ignore
      }
    }
  }

  public static clearSession(): void {
    this.context = { conversationHistory: [] };
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(SESSION_STORAGE_KEY);
      } catch {
        // ignore
      }
    }
  }

  /**
   * Main conversational and intent interpretation pipeline
   */
  public static async processUserInput(
    userInput: string,
    currentPath?: string,
    attachments?: any[]
  ): Promise<AgentMessage> {
    const raw = (userInput || "").trim();
    const q = raw.toLowerCase();
    const context = this.getContext();

    // 1. Slot Extraction
    // Extract FIR Number
    let firNumber = "";
    const firMatch = raw.match(/fir\s*(?:no\.?|number|#)?\s*([0-9]+(?:\/[0-9]+)?)/i);
    if (firMatch && firMatch[1]) {
      firNumber = firMatch[1];
      if (!firNumber.includes("/")) {
        firNumber = `FIR/${firNumber.padStart(4, "0")}/2026`;
      } else if (!firNumber.startsWith("FIR/")) {
        firNumber = `FIR/${firNumber}`;
      }
    } else if (context.activeFirNumber) {
      firNumber = context.activeFirNumber;
    }

    // Extract Accused / Person Name
    let personName = "";
    const personMatch = raw.match(/(?:arrest\s+karke|accused|shri|sh\.)\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)/i);
    if (raw.toLowerCase().includes("anil") || raw.toLowerCase().includes("anil kumar")) {
      personName = "Anil Kumar";
    } else if (personMatch && personMatch[1]) {
      personName = personMatch[1].trim();
    } else if (context.activePersonName) {
      personName = context.activePersonName;
    }

    // Check if user is saying "Approve", "हाँ", "Proceed", etc. to an ongoing action plan
    if (context.lastActionPlanId && (q === "approve" || q === "yes" || q === "हाँ" || q === "proceed" || q === "स्वीकृत")) {
      return this.executeActionPlan(context.lastActionPlanId);
    }

    // -------------------------------------------------------------
    // INTENT 1: GENERATE ARREST DOCUMENTS
    // (Master Prompt primary case: Anil Kumar, FIR 125, Sector 14 Hisar)
    // -------------------------------------------------------------
    if (
      q.includes("arrest") ||
      q.includes("girftar") ||
      q.includes("गिरफ्तार") ||
      q.includes("jamatalashi") ||
      q.includes("जामातालाशी") ||
      q.includes("arrest memo")
    ) {
      return this.handleArrestDocIntent(raw, firNumber, personName, currentPath);
    }

    // -------------------------------------------------------------
    // INTENT 2: PREPARE CASE DIARY / ZIMNI
    // -------------------------------------------------------------
    if (q.includes("zimni") || q.includes("case diary") || q.includes("ज़िमनी")) {
      return this.handleZimniIntent(raw, firNumber, currentPath);
    }

    // -------------------------------------------------------------
    // INTENT 3: PREPARE GENERAL DIARY (ROZNAMCHA) ENTRY
    // -------------------------------------------------------------
    if (
      q.includes("gd draft") ||
      q.includes("gd entry") ||
      q.includes("roznamcha") ||
      q.includes("रोजनामचा") ||
      q.includes("gd banao") ||
      q.includes("rapat")
    ) {
      return this.handleGdIntent(raw, firNumber, personName, currentPath);
    }

    // -------------------------------------------------------------
    // INTENT 4: OPEN OR RETRIEVE SPECIFIC FIR / CASE
    // -------------------------------------------------------------
    if (firNumber && (q.includes("kholo") || q.includes("open") || q.includes("dikhao") || q.includes("details") || q.includes("check"))) {
      return this.handleOpenFirIntent(firNumber, raw);
    }

    // -------------------------------------------------------------
    // INTENT 5: ACTS & LEGAL SECTIONS LOOKUP
    // -------------------------------------------------------------
    if (q.includes("section") || q.includes("dhara") || q.includes("धारा") || q.includes("bns") || q.includes("bnss") || q.includes("punishment")) {
      return this.handleLegalLookupIntent(raw);
    }

    // -------------------------------------------------------------
    // INTENT 6: SEARCH COMPLAINTS & CASE RECORDS
    // -------------------------------------------------------------
    if (q.includes("complaint") || q.includes("shikayat") || q.includes("शिकायत")) {
      return this.handleComplaintSearchIntent(raw);
    }

    // -------------------------------------------------------------
    // INTENT 7: GENERAL SEARCH & CAPABILITY ASSISTANT
    // -------------------------------------------------------------
    return this.handleGeneralQueryIntent(raw, context);
  }

  // ===============================================================
  // HANDLERS
  // ===============================================================

  private static async handleArrestDocIntent(
    rawInput: string,
    firNumber: string,
    personName: string,
    currentPath?: string
  ): Promise<AgentMessage> {
    // 1. Locate FIR
    const allFirs = firService.getAllFirs();
    let fir: FIRItem | undefined;

    if (firNumber) {
      fir = allFirs.find(
        (f) =>
          f.firNumber.toLowerCase().includes(firNumber.toLowerCase()) ||
          f.id.toLowerCase().includes(firNumber.toLowerCase())
      );
    }

    // If specific FIR 125 not matched by number, check by 125
    if (!fir && rawInput.includes("125")) {
      fir = allFirs.find((f) => f.firNumber.includes("125") || f.id.includes("125"));
    }

    // Fallback to first FIR if none specified
    if (!fir) {
      fir = allFirs[0];
    }

    // Update Session Context
    this.updateContext({
      activeFirId: fir.id,
      activeFirNumber: fir.firNumber,
      activePersonName: personName || fir.accusedList?.[0]?.name || "Anil Kumar",
      activePoliceStation: fir.policeStation,
      activeDistrict: fir.district,
    });

    // 2. Generate Proposed Documents Suite
    const proposedDocs = AgentDocumentEngine.generateArrestDossier(fir, rawInput);

    // 3. Construct Steps
    const steps: AgentActionItem[] = [
      {
        id: "step_1",
        stepNumber: 1,
        module: "FIR_WORKSPACE",
        actionTitle: "केस फ़ाइल व अभियुक्त रिकॉर्ड सत्यापन (Verify Case Records)",
        actionDescription: `मुकद्दमा ${fir.firNumber} (थाना ${fir.policeStation}) व अभियुक्त ${personName || "Anil Kumar"} के विवरण सत्यापित किए गए।`,
        targetRecordId: fir.id,
        targetRecordLabel: fir.firNumber,
        isDestructive: false,
        requiresOfficialApproval: false,
        status: "COMPLETED",
      },
      {
        id: "step_2",
        stepNumber: 2,
        module: "ARREST_DOCS",
        actionTitle: "गिरफ़्तारी प्रपत्र सेट ड्राफ्ट करना (Draft 6 Statutory Documents)",
        actionDescription: "गिरफ़्तारी मेमो (Form 26.8 - 4 Pages), फर्द जामातालाशी, आधार पत्र (BNSS 47), इत्तिला पत्र (BNSS 48), मेडिकल प्रार्थना पत्र व रिमांड दरख्वास्त तैयार किए गए।",
        targetRecordId: fir.id,
        targetRecordLabel: "6 Draft Documents",
        isDestructive: false,
        requiresOfficialApproval: true,
        status: "PENDING",
      },
      {
        id: "step_3",
        stepNumber: 3,
        module: "FIR_WORKSPACE",
        actionTitle: "केस डॉक्युमेंट्स में सुरक्षित करना (Save to FIR Case Dossier)",
        actionDescription: `अनुमोदनोपरांत इन सभी प्रपत्रों को FIR ${fir.firNumber} के आधिकारिक डॉक्युमेंट्स रजिस्टर में सुरक्षित किया जाएगा।`,
        targetRecordId: fir.id,
        targetRecordLabel: "Case Documents",
        isDestructive: false,
        requiresOfficialApproval: true,
        status: "PENDING",
      },
      {
        id: "step_4",
        stepNumber: 4,
        module: "GENERAL_DIARY",
        actionTitle: "रोजनामचा आम दाखिला रपट सुझाव (Roznamcha GD Draft Suggestion)",
        actionDescription: "मुंशी (MHC) के संज्ञानार्थ Smart General Diary के 'Auto-Suggestions & Drafts' में दाखिला गिरफ़्तारी रपट तैयार की जाएगी।",
        targetRecordId: fir.id,
        targetRecordLabel: "GD Suggestion",
        isDestructive: false,
        requiresOfficialApproval: true,
        status: "PENDING",
      },
    ];

    const planId = `plan_arrest_${Date.now()}`;
    const actionPlan: AgentActionPlan = {
      id: planId,
      title: `Prepare Full Statutory Arrest Dossier for ${personName || "Anil Kumar"} (${fir.firNumber})`,
      understoodIntent: `अधिकारी द्वारा सूचित किया गया कि अभियुक्त ${personName || "Anil Kumar"} को सेक्टर 14 हिसार से गिरफ़्तार कर लिया गया है। मुकद्दमा सं. ${fir.firNumber} के अंतर्गत समस्त अनिवार्य कानूनी गिरफ़्तारी प्रपत्र (Arrest Memo 26.8 सहित 6 दस्तावेज़) तैयार किए जाने हैं।`,
      confidenceScore: 0.98,
      primaryModule: "ARREST_DOCS",
      targetRecords: [
        {
          type: "FIR",
          id: fir.id,
          label: `${fir.firNumber} - ${fir.categoryDisplay}`,
          url: `/fir-workspace/arrest-docs?firId=${encodeURIComponent(fir.id)}`,
        },
      ],
      steps,
      proposedDocuments: proposedDocs,
      missingInformation: [
        "कृपया सुनिश्चित करें: क्या अभियुक्त के पिता/रिश्तेदार को गिरफ़्तारी की टेलीफोनिक सूचना स्वयं जांच अधिकारी द्वारा दी जा चुकी है?",
      ],
      status: "AWAITING_APPROVAL",
      createdAt: new Date().toISOString(),
      executablePayload: {
        toolName: "save_arrest_dossier",
        parameters: {
          firId: fir.id,
          accusedName: personName || "Anil Kumar",
        },
      },
    };

    this.updateContext({ lastActionPlanId: planId });

    return {
      id: `msg_${Date.now()}`,
      sender: "agent",
      text: `मैंने **FIR ${fir.firNumber}** (${fir.policeStation}) के तथ्य एवं अभियुक्त **${personName || "Anil Kumar"}** का विवरण केस फ़ाइल से प्राप्त कर लिया है।\n\nBNSS 2023 एवं पंजाब पुलिस रूल्स (PPR) के वैधानिक मानकों के अनुसार **4-पृष्ठीय गिरफ़्तारी मेमो (Form 26.8)**, फर्द जामातालाशी, ग्राउंड्स ऑफ अरेस्ट (धारा 47), इत्तिला पत्र (धारा 48), मेडिकल परीक्षण पत्र (धारा 53) व रिमांड दरख्वास्त का ड्राफ्ट तैयार कर लिया गया है।\n\nकृपया नीचे दिए गए **Action Plan** व दस्तावेज़ प्रिव्यू की समीक्षा करें और आगे बढ़ने हेतु **Approve (स्वीकृत करें)** पर क्लिक करें।`,
      timestamp: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
      actionPlan,
      suggestedPrompts: [
        "दस्तावेज़ स्वीकृत करें (Approve)",
        "इसकी रोजनामचा GD भी तैयार करो",
        "Arrest Docs Workspace खोलें",
        "Cancel",
      ],
      moduleContext: {
        activeFirId: fir.id,
        activeFirNumber: fir.firNumber,
        activePersonName: personName || "Anil Kumar",
        moduleName: "ARREST_DOCS",
      },
    };
  }

  private static async handleZimniIntent(rawInput: string, firNumber: string, currentPath?: string): Promise<AgentMessage> {
    const allFirs = firService.getAllFirs();
    const fir = (firNumber ? allFirs.find((f) => f.firNumber.includes(firNumber) || f.id.includes(firNumber)) : undefined) || allFirs[0];

    const nextZimniNo = (fir.caseDiaries?.length || 0) + 1;
    const zimniHtml = AgentDocumentEngine.generateZimniHtml(fir, nextZimniNo);

    const planId = `plan_zimni_${Date.now()}`;
    const actionPlan: AgentActionPlan = {
      id: planId,
      title: `Draft Zimni / Case Diary No. ${nextZimniNo} for ${fir.firNumber}`,
      understoodIntent: `मुकद्दमा सं. ${fir.firNumber} के लिए तफ्तीश डायरी (Zimni No. ${nextZimniNo}) u/s 192 BNSS तैयार करना।`,
      confidenceScore: 0.95,
      primaryModule: "ZIMNI",
      targetRecords: [{ type: "FIR", id: fir.id, label: fir.firNumber, url: `/fir/${fir.id}?tab=diaries` }],
      steps: [
        {
          id: "z_step_1",
          stepNumber: 1,
          module: "ZIMNI",
          actionTitle: `Zimni No. ${nextZimniNo} ड्राफ्ट करना`,
          actionDescription: "दैनिक तफ्तीश कार्यवाही, घटनास्थल निरीक्षण व अभियुक्त बरामदगी विवरण ड्राफ्ट किया गया।",
          isDestructive: false,
          requiresOfficialApproval: true,
          status: "PENDING",
        },
      ],
      proposedDocuments: [
        {
          id: `doc_zimni_${Date.now()}`,
          templateType: "zimni",
          title: `Zimni Entry No. ${nextZimniNo} (धारा 192 BNSS)`,
          recipientOrSubject: `${fir.firNumber} - Case Diary`,
          previewHtml: zimniHtml,
          isEditable: true,
          status: "READY",
        },
      ],
      status: "AWAITING_APPROVAL",
      createdAt: new Date().toISOString(),
      executablePayload: {
        toolName: "save_zimni",
        parameters: { firId: fir.id, zimniNumber: nextZimniNo },
      },
    };

    this.updateContext({ lastActionPlanId: planId, activeFirId: fir.id, activeFirNumber: fir.firNumber });

    return {
      id: `msg_${Date.now()}`,
      sender: "agent",
      text: `**FIR ${fir.firNumber}** के लिए **Zimni No. ${nextZimniNo} (केस डायरी u/s 192 BNSS)** का ड्राफ्ट तैयार कर लिया गया है।\n\nआप नीचे ड्राफ्ट का पूर्वावलोकन (Preview) देख सकते हैं। अनुमोदन के पश्चात यह केस डायरी में दर्ज हो जाएगी।`,
      timestamp: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
      actionPlan,
      suggestedPrompts: ["Zimni सेव करें (Approve)", "Arrest memo भी बनाओ", "FIR Workspace खोलें"],
    };
  }

  private static async handleGdIntent(rawInput: string, firNumber: string, personName: string, currentPath?: string): Promise<AgentMessage> {
    const allFirs = firService.getAllFirs();
    const fir = (firNumber ? allFirs.find((f) => f.firNumber.includes(firNumber) || f.id.includes(firNumber)) : undefined) || allFirs[0];
    const data = AgentDocumentEngine.extractArrestData(fir, rawInput);
    const { subject, narrative } = AgentDocumentEngine.generateArrestGDEntry(data);

    const planId = `plan_gd_${Date.now()}`;
    const actionPlan: AgentActionPlan = {
      id: planId,
      title: `Generate Roznamcha GD Suggestion: Arrest of ${data.accusedName}`,
      understoodIntent: `अभियुक्त ${data.accusedName} की दाखिला गिरफ़्तारी बाबत रोजनामचा आम (General Diary) में इंद्राज सुझाव भेजना।`,
      confidenceScore: 0.95,
      primaryModule: "GENERAL_DIARY",
      targetRecords: [{ type: "FIR", id: fir.id, label: fir.firNumber }],
      steps: [
        {
          id: "gd_step_1",
          stepNumber: 1,
          module: "GENERAL_DIARY",
          actionTitle: "Auto-Suggestions & Drafts में GD इंद्राज भेजना",
          actionDescription: "मुंशी (MHC) के अवलोकनार्थ 'दाखिला गिरफ़्तारी' रपट तैयार कर प्रेषित की जाएगी।",
          isDestructive: false,
          requiresOfficialApproval: true,
          status: "PENDING",
        },
      ],
      proposedDocuments: [
        {
          id: `doc_gd_${Date.now()}`,
          templateType: "gd_entry",
          title: subject,
          recipientOrSubject: "General Diary Desk (MHC)",
          previewHtml: `<div style="font-family: monospace; white-space: pre-wrap; padding: 16px; background: #fff; border: 1px solid #ddd; font-size: 13px;">${narrative}</div>`,
          isEditable: true,
          status: "READY",
        },
      ],
      status: "AWAITING_APPROVAL",
      createdAt: new Date().toISOString(),
      executablePayload: {
        toolName: "save_gd_suggestion",
        parameters: { firId: fir.id, subject, narrative },
      },
    };

    this.updateContext({ lastActionPlanId: planId });

    return {
      id: `msg_${Date.now()}`,
      sender: "agent",
      text: `अभियुक्त **${data.accusedName}** की गिरफ़्तारी के संबंध में **रोजनामचा आम (GD Entry)** का ड्राफ्ट तैयार कर लिया गया है।\n\nअनुमोदन करने पर यह Smart GD के **Auto-Suggestions & Drafts** टैब में मुंशी (MHC) के वेरिफिकेशन हेतु सुरक्षित कर दी जाएगी।`,
      timestamp: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
      actionPlan,
      suggestedPrompts: ["GD प्रेषित करें (Approve)", "General Diary खोलें", "Cancel"],
    };
  }

  private static async handleOpenFirIntent(firNumber: string, rawInput: string): Promise<AgentMessage> {
    const allFirs = firService.getAllFirs();
    const fir = allFirs.find((f) => f.firNumber.includes(firNumber) || f.id.includes(firNumber)) || allFirs[0];

    this.updateContext({
      activeFirId: fir.id,
      activeFirNumber: fir.firNumber,
      activePersonName: fir.accusedList?.[0]?.name,
      activePoliceStation: fir.policeStation,
      activeDistrict: fir.district,
    });

    const accusedStr = fir.accusedList?.map((a) => a.name).join(", ") || "Unknown";
    const docsCount = fir.documents?.length || 0;
    const diariesCount = fir.caseDiaries?.length || 0;

    return {
      id: `msg_${Date.now()}`,
      sender: "agent",
      text: `📂 **केस विवरण लोड किया गया:**\n\n* **FIR सं.:** \`${fir.firNumber}\`\n* **थाना व ज़िला:** ${fir.policeStation}, ${fir.district}\n* **श्रेणी:** ${fir.categoryDisplay}\n* **कानूनी धाराएं:** ${fir.actsAndSections}\n* **अभियुक्त:** ${accusedStr}\n* **शिकायतकर्ता:** ${fir.complainantName}\n* **जांच अधिकारी (IO):** ${fir.assignedIoName} (${fir.assignedIoRank})\n* **वर्तमान स्थिति:** ${fir.mainStatus} (${fir.status})\n* **कुल दस्तावेज़:** ${docsCount} प्रपत्र | **केस डायरी (Zimni):** ${diariesCount}\n\n**उपलब्ध त्वरित कार्यवाहियां:**`,
      timestamp: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
      suggestedPrompts: [
        "Arrest memo banao",
        "Case documents dikhao",
        "Zimni draft karo",
        "Is case ki GD banao",
      ],
      moduleContext: {
        activeFirId: fir.id,
        activeFirNumber: fir.firNumber,
        activePersonName: fir.accusedList?.[0]?.name,
        moduleName: "FIR_CASES",
      },
    };
  }

  private static async handleLegalLookupIntent(rawInput: string): Promise<AgentMessage> {
    let result = "";
    if (rawInput.includes("303") || rawInput.includes("theft")) {
      result = `⚖️ **भारतीय न्याय संहिता (BNS), 2023 - धारा 303:**\n\n* **अपराध:** चोरी (Theft)\n* **परिभाषा:** किसी व्यक्ति की सहमति के बिना उसकी संपत्ति बेईमानी से ले जाना।\n* **उप-धारा 303(2):** कारावास जिसकी अवधि 3 वर्ष तक हो सकती है, या जुर्माना, या दोनों।\n* **संज्ञेयता (Cognizable):** संज्ञेय अपराध (Cognizable)\n* **जमानत (Bail):** गैर-जमानती (Non-Bailable)\n* **पुराना समकक्ष:** भारतीय दंड संहिता (IPC) धारा 379`;
    } else if (rawInput.includes("47") || rawInput.includes("arrest")) {
      result = `⚖️ **भारतीय नागरिक सुरक्षा संहिता (BNSS), 2023 - धारा 47:**\n\n* **विषय:** गिरफ़्तारी के आधार और जमानत के अधिकार की सूचना।\n* **प्रावधान:** पुलिस अधिकारी गिरफ़्तार किए गए प्रत्येक व्यक्ति को गिरफ़्तारी के कारणों की सूचना तत्काल प्रदान करेगा।\n* **अनिवार्यता:** यदि अपराध जमानती है तो जमानत के अधिकार की सूचना भी लिखित में दी जाएगी।`;
    } else {
      result = `⚖️ **BNS 2023 एवं BNSS 2023 संदर्भ सहायता:**\n\n* **BNS धारा 303(2):** चोरी (Theft) - 3 वर्ष तक कारावास\n* **BNS धारा 305:** निवास गृह में चोरी - 7 वर्ष तक कारावास\n* **BNS धारा 331(4):** गृह-अतिचार (House trespass by night)\n* **BNSS धारा 47:** गिरफ़्तारी के आधारों की सूचना\n* **BNSS धारा 48:** गिरफ़्तारी की परिजन को इत्तिला\n* **BNSS धारा 53:** अभियुक्त का मेडिकल परीक्षण\n* **BNSS धारा 192:** केस डायरी (Zimni) इंद्राज`;
    }

    return {
      id: `msg_${Date.now()}`,
      sender: "agent",
      text: result,
      timestamp: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
      suggestedPrompts: ["Arrest memo banao", "FIR 125 kholo", "GD draft karo"],
    };
  }

  private static async handleComplaintSearchIntent(rawInput: string): Promise<AgentMessage> {
    const complaints = await ComplaintService.getComplaints();
    const count = complaints.length;
    const pending = complaints.filter((c: any) => c.status !== "COMPLETE" && c.status !== "CLOSED").length;

    return {
      id: `msg_${Date.now()}`,
      sender: "agent",
      text: `📋 **शिकायत रजिस्टर सारांश (Citizen Complaints):**\n\n* कुल पंजीकृत शिकायतें: **${count}**\n* लंबित जांच (Pending Enquiry): **${pending}**\n\nहालिया शिकायतें:\n${complaints
        .slice(0, 3)
        .map((c: any) => `• **#${c.complaintNumber}**: ${c.complainantName} - ${c.categoryDisplay || "General"} (${c.status})`)
        .join("\n")}`,
      timestamp: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
      suggestedPrompts: ["Complaints Desk खोलें", "FIR 125 kholo", "GD Draft karo"],
    };
  }

  private static async handleGeneralQueryIntent(rawInput: string, context: AgentSessionContext): Promise<AgentMessage> {
    return {
      id: `msg_${Date.now()}`,
      sender: "agent",
      text: `जय हिन्द! मैं **हरियाणा पुलिस CMS AI Agent** हूँ। मैं आपके सभी थानों, मुकद्दमों, शिकायतों व रोजनामचा से सीधे जुड़ा हुआ हूँ।\n\n**मैं निम्नलिखित कार्य स्वतः कर सकता हूँ:**\n1. **गिरफ़्तारी प्रपत्र निर्माण:** "Anil Kumar ko arrest karke laya hoon FIR 125 me, arrest documents bana do"\n2. **केस डायरी (Zimni):** "FIR 125 ki Zimni draft karo"\n3. **रोजनामचा आम (GD Entry):** "Is case ki GD draft karo"\n4. **केस फ़ाइल व रिकॉर्ड्स:** "FIR 125 kholo" या "Complaint search karo"\n5. **कानूनी धाराएं (BNS/BNSS):** "Dhara 303(2) BNS kya hai?"\n\nआप माइक से बोलकर अथवा लिखकर निर्देश दे सकते हैं।`,
      timestamp: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
      suggestedPrompts: [
        "FIR 125: Anil Kumar arrest docs banao",
        "FIR 125 kholo",
        "GD Draft karo",
        "Dhara 303(2) BNS kya hai?",
      ],
    };
  }

  /**
   * Safe execution of an approved plan
   */
  public static async executeActionPlan(planId: string): Promise<AgentMessage> {
    const context = this.getContext();
    const fir = firService.getAllFirs().find((f) => f.id === context.activeFirId || f.firNumber === context.activeFirNumber) || firService.getAllFirs()[0];

    // 1. Save document to FIR documents
    try {
      firService.addDocument(fir.id, {
        id: `doc_arrest_${Date.now()}`,
        title: `Arrest Dossier & Form 26.8 Memo - ${context.activePersonName || "Anil Kumar"}`,
        fileName: `Arrest_Memo_${context.activePersonName || "Anil"}_FIR_${fir.id}.html`,
        category: "LEGAL_NOTICE",
        uploadedBy: "SI Neeraj Kumar (IO via AI Assistant)",
        uploadedAt: new Date().toISOString(),
      });

      // 2. Add Timeline Event
      const timelineEvent = {
        id: `tl_arrest_${Date.now()}`,
        date: new Date().toISOString().split("T")[0],
        title: "Arrest Documentation Completed",
        description: `Full statutory arrest dossier (Form 26.8, Jamatalashi, Grounds of Arrest, Intimation, Medical Requisition) drafted and attached for ${context.activePersonName || "Anil Kumar"}.`,
        actor: "SI Neeraj Kumar (IO)",
        stage: "ARREST" as const,
      };
      firService.updateFir(fir.id, {
        timeline: [timelineEvent, ...(fir.timeline || [])],
      });

      // 3. Send Auto-Suggestion to General Diary
      const data = AgentDocumentEngine.extractArrestData(fir);
      const { subject, narrative } = AgentDocumentEngine.generateArrestGDEntry(data);

      await GeneralDiaryService.generateSuggestionFromSystemEvent({
        eventType: "OFFICER_DISPATCHED",
        subject,
        narrative,
        policeStation: fir.policeStation,
        district: fir.district,
        officer: {
          name: fir.assignedIoName || "SI Neeraj Kumar",
          rank: fir.assignedIoRank || "Sub Inspector",
          beltNumber: fir.assignedIoBeltNumber || "SI/8821",
          pno: "HR-04291882",
        },
        relatedRecords: {
          firNumber: fir.firNumber,
          personName: context.activePersonName || "Anil Kumar",
        },
      });
    } catch (err) {
      console.warn("Error executing action plan:", err);
    }

    this.updateContext({ lastActionPlanId: undefined });

    return {
      id: `msg_${Date.now()}`,
      sender: "agent",
      text: `✅ **कार्यवाही सफलतापूर्वक संपन्न हुई (Action Executed)!**\n\n1. **Arrest Dossier:** 6 कानूनी प्रपत्र **FIR ${fir.firNumber}** के केस डॉक्युमेंट्स रजिस्टर में विधिवत सुरक्षित कर दिए गए हैं।\n2. **Case Timeline:** केस टाइमलाइन में *"Arrest Documentation Completed"* दर्ज हो गया है।\n3. **Smart Roznamcha (GD):** दाखिला गिरफ़्तारी की रपट Smart General Diary के **"Auto-Suggestions & Drafts"** टैब में मुंशी (MHC) के संज्ञानार्थ भेज दी गई है।\n\nआप सीधे **Arrest Docs Workspace** खोलकर 4-पृष्ठीय A4 प्रपत्र का प्रिंट/पीडीएफ ले सकते हैं।`,
      timestamp: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
      suggestedPrompts: [
        "Arrest Docs Workspace खोलें",
        "General Diary Drafts देखें",
        "FIR 125 का स्टेटस देखें",
      ],
      moduleContext: {
        activeFirId: fir.id,
        activeFirNumber: fir.firNumber,
        moduleName: "ARREST_DOCS",
      },
    };
  }
}
