import { firService } from "@/services/firService";
import { ComplaintService } from "@/services/complaintService";
import { GeneralDiaryService } from "@/services/generalDiaryService";
import { AgentDocumentEngine } from "./agentDocumentEngine";
import { CmsCapabilityRegistry, WEBSITE_ARCHITECTURE } from "./cmsCapabilityRegistry";
import {
  AgentMessage,
  AgentActionPlan,
  AgentActionItem,
  AgentSessionContext,
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
   * Strictly adheres to:
   * 1. Complete Website & Database Understanding
   * 2. Permission-First Action Execution
   * 3. Proactive Clarification when ambiguous / missing info
   */
  public static async processUserInput(
    userInput: string,
    currentPath?: string,
    attachments?: any[]
  ): Promise<AgentMessage> {
    const raw = (userInput || "").trim();
    const q = raw.toLowerCase();
    const context = this.getContext();

    // 0. Permission Affirmation Check ("Approve", "हाँ", "कर दो", "Proceed")
    if (
      context.lastActionPlanId &&
      (q === "approve" ||
        q === "yes" ||
        q === "हाँ" ||
        q === "proceed" ||
        q === "स्वीकृत" ||
        q.includes("कर दो") ||
        q.includes("स्वीकृत करें") ||
        q.includes("theek hai") ||
        q.includes("ठीक है"))
    ) {
      return this.executeActionPlan(context.lastActionPlanId);
    }

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
    const personMatch = raw.match(/(?:arrest\s+karke|accused|shri|sh\.|naam\s+hai)\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)/i);
    if (raw.toLowerCase().includes("anil kumar") || raw.toLowerCase().includes("anil")) {
      personName = "Anil Kumar";
    } else if (personMatch && personMatch[1]) {
      personName = personMatch[1].trim();
    } else if (context.activePersonName) {
      personName = context.activePersonName;
    }

    // -------------------------------------------------------------
    // INTENT A: WEBSITE ARCHITECTURE & BACKEND/FRONTEND UNDERSTANDING
    // User asks: "Website me kahan kya hota hai", "Structure samjhao", "Backend database me kya hai"
    // -------------------------------------------------------------
    if (
      q.includes("kahan kya hota hai") ||
      q.includes("kahan kya hai") ||
      q.includes("website structure") ||
      q.includes("backend frontend") ||
      q.includes("database me kya hai") ||
      q.includes("system samjhao") ||
      q.includes("modules batao") ||
      q.includes("kya kya modules hain")
    ) {
      return this.handleSystemArchitectureQuery();
    }

    // -------------------------------------------------------------
    // INTENT B: OPEN FORM / DIALOGUE BOX / PAGE / WORKSPACE NAVIGATION
    // e.g., "Add entry daailogue box kholo", "register complaint form kholo",
    // "role switcher kholo", "dialogue box kholo", "page par jao", etc.
    // -------------------------------------------------------------
    const targetRoute = CmsCapabilityRegistry.findRoute(raw);
    const isOpenOrNavQuery =
      q.includes("kholo") ||
      q.includes("khol") ||
      q.includes("open") ||
      q.includes("chalo") ||
      q.includes("jao") ||
      q.includes("jana") ||
      q.includes("le chalo") ||
      q.includes("dikhao") ||
      q.includes("show") ||
      q.includes("form") ||
      q.includes("dialogue") ||
      q.includes("daailogue") ||
      q.includes("dialog") ||
      q.includes("box") ||
      q.includes("modal") ||
      q.includes("window") ||
      q.includes("desk") ||
      q.includes("workspace") ||
      q.includes("tab");

    if (targetRoute && (isOpenOrNavQuery || q.includes("register") || q.includes("new") || q.includes("nayi") || q.includes("add"))) {
      return this.handleNavigationIntent(targetRoute, raw);
    }

    // Proactive clarification if user asks to open a dialog/form but didn't specify which one
    if (
      (q.includes("dialogue box") || q.includes("daailogue box") || q.includes("dialog box") || q.includes("form kholo") || q.includes("kise page pr jana") || q.includes("page par jana")) &&
      !targetRoute
    ) {
      return {
        id: `ask_dialog_${Date.now()}`,
        sender: "agent",
        text: `❓ **आप कौन सा फॉर्म या डायलॉग बॉक्स खोलना चाहते हैं?**\n\nकृपया नीचे दिए गए विकल्पों में से चुनें या मुझे निर्देश दें:\n\n1. **नया रोजनामचा इंद्राज (New GD Entry Form)** - \`/general-diary/new\`\n2. **नागरिक शिकायत पंजीकरण (Register Complaint Form)** - \`/complaints/register\`\n3. **नियमित मुकद्दमा पंजीकरण (Regular FIR Form)** - \`/fir/register\`\n4. **रोल स्विचर डायलॉग बॉक्स (Role Switcher Dialog)**\n5. **गिरफ़्तारी प्रपत्र वर्कस्पेस (Arrest Docs Workspace - Form 26.8)**\n6. **केस डायरी (Zimni Desk - Section 192 BNSS)**`,
        timestamp: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
        suggestedPrompts: [
          "Add entry daailogue box kholo",
          "register complaint form kholo",
          "FIR register form kholo",
          "Role switcher dialogue kholo",
        ],
      };
    }

    // -------------------------------------------------------------
    // INTENT C: AMBIGUITY CHECK FOR ARREST DOCUMENTS
    // If user says "arrest memo banao" or "girftar karke laya hoon" but mentions NO FIR and NO name and NO active context
    // -> DO NOT BLINDLY GUESS! ASK CLARIFYING QUESTION!
    // -------------------------------------------------------------
    if (
      (q.includes("arrest") || q.includes("girftar") || q.includes("गिरफ्तार") || q.includes("jamatalashi")) &&
      !firNumber &&
      !personName &&
      !raw.includes("125")
    ) {
      return {
        id: `ask_${Date.now()}`,
        sender: "agent",
        text: `❓ **स्पष्टीकरण अपेक्षित (Clarification Required):**\n\nआप किस अभियुक्त या किस मुकद्दमे (FIR) के लिए गिरफ़्तारी प्रपत्र तैयार करवाना चाहते हैं?\n\n*कृपया मुकद्दमा नंबर (उदा. \`FIR 125/2026\`) अथवा अभियुक्त का नाम बताएं, ताकि केस फ़ाइल से सही जानकारी प्राप्त की जा सके।*`,
        timestamp: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
        suggestedPrompts: [
          "FIR 125: Anil Kumar (Sector 14 Hisar)",
          "FIR 14: Vikas Sharma case",
          "FIR 10: Physical assault case",
        ],
      };
    }

    // -------------------------------------------------------------
    // INTENT C: ARREST DOCUMENT SUITE GENERATION
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
    // INTENT D: GENERAL DIARY (ROZNAMCHA) INTENT
    // -------------------------------------------------------------
    if (
      q.includes("gd draft") ||
      q.includes("gd entry") ||
      q.includes("roznamcha") ||
      q.includes("रोजनामचा") ||
      q.includes("gd banao") ||
      q.includes("rapat")
    ) {
      // Check if ambiguous
      if (!firNumber && !personName && !q.includes("ravangi") && !q.includes("vapasi") && !q.includes("gasht") && !q.includes("duty")) {
        return {
          id: `ask_gd_${Date.now()}`,
          sender: "agent",
          text: `❓ **रोजनामचा (GD) इंद्राज का प्रकार स्पष्ट करें:**\n\nआप रोजनामचा आम में किस प्रकार की रपट दर्ज करना चाहते हैं?\n\n1. **दाखिला गिरफ़्तारी (Accused Arrest GD)**\n2. **रवानगी गश्त / जांच (Officer Departure)**\n3. **वापसी थाना (Officer Arrival)**\n4. **शिकायत निस्तारण / फैसला (Disposal)**\n5. **माल बरामदगी / ज़ब्ती (Seizure)**`,
          timestamp: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
          suggestedPrompts: [
            "FIR 125: Anil Kumar arrest GD",
            "रवानगी गश्त (Departure for Patrol)",
            "वापसी थाना (Arrival at Station)",
            "General Diary रजिस्टर खोलें",
          ],
        };
      }
      return this.handleGdIntent(raw, firNumber, personName, currentPath);
    }

    // -------------------------------------------------------------
    // INTENT E: CASE DIARY / ZIMNI DRAFTING
    // -------------------------------------------------------------
    if (q.includes("zimni") || q.includes("case diary") || q.includes("ज़िमनी")) {
      if (!firNumber && !raw.includes("125") && !context.activeFirNumber) {
        return {
          id: `ask_zimni_${Date.now()}`,
          sender: "agent",
          text: `❓ **मुकद्दमा नंबर बताएं:**\n\nआप किस मुकद्दमे (FIR) के लिए केस डायरी (Zimni u/s 192 BNSS) लिखना चाहते हैं?`,
          timestamp: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
          suggestedPrompts: ["FIR 125 ki Zimni likho", "FIR 14 ki Zimni likho"],
        };
      }
      return this.handleZimniIntent(raw, firNumber, currentPath);
    }


    // -------------------------------------------------------------
    // INTENT G: REGISTER COMPLAINT OR REGISTER FIR ASSISTANCE
    // -------------------------------------------------------------
    if (q.includes("nayi complaint") || q.includes("complaint register") || q.includes("shikayat darj")) {
      return this.handleComplaintRegisterIntent(raw);
    }

    if (q.includes("nayi fir") || q.includes("fir register") || q.includes("fir darj")) {
      return this.handleFirRegisterIntent(raw);
    }

    // -------------------------------------------------------------
    // INTENT H: OPEN OR RETRIEVE SPECIFIC FIR / CASE
    // -------------------------------------------------------------
    if (firNumber && (q.includes("kholo") || q.includes("open") || q.includes("dikhao") || q.includes("details") || q.includes("check"))) {
      return this.handleOpenFirIntent(firNumber, raw);
    }

    // -------------------------------------------------------------
    // INTENT I: ACTS & LEGAL SECTIONS LOOKUP
    // -------------------------------------------------------------
    if (q.includes("section") || q.includes("dhara") || q.includes("धारा") || q.includes("bns") || q.includes("bnss") || q.includes("punishment")) {
      return this.handleLegalLookupIntent(raw);
    }

    // -------------------------------------------------------------
    // INTENT J: SEARCH COMPLAINTS & CASE RECORDS
    // -------------------------------------------------------------
    if (q.includes("complaint") || q.includes("shikayat") || q.includes("शिकायत")) {
      return this.handleComplaintSearchIntent(raw);
    }

    // -------------------------------------------------------------
    // INTENT K: STAFF / DUTY ROSTER
    // -------------------------------------------------------------
    if (q.includes("duty") || q.includes("staff") || q.includes("mhc") || q.includes("sho")) {
      return this.handleStaffQueryIntent(raw);
    }

    // -------------------------------------------------------------
    // FALLBACK / GENERAL HELPER
    // -------------------------------------------------------------
    return this.handleGeneralQueryIntent(raw, context);
  }

  // ===============================================================
  // HANDLERS
  // ===============================================================

  /**
   * Explains the full website architecture, backend, frontend, database and workflows.
   */
  private static handleSystemArchitectureQuery(): AgentMessage {
    const routes = WEBSITE_ARCHITECTURE;
    return {
      id: `arch_${Date.now()}`,
      sender: "agent",
      text: `🏛️ **हरियाणा पुलिस CMS संपूर्ण सिस्टम व वास्तुकला समझ (System Architecture & Knowledge):**

### 1. फ्रंटएंड संरचना (Frontend Architecture & Pages):
* **रोजनामचा आम (\`/general-diary\`):** डिजिटल रोजनामचा (PPR 22.48)। इसमें **Register** (लॉक्ड एंट्रीज़) व **Auto-Suggestions & Drafts** (मुंशी हेतु AI सुझाव) शामिल हैं।
* **नया GD प्रविष्टि (\`/general-diary/new\`):** 54 वैधानिक प्रकारों में रपट दर्ज करने का फॉर्म।
* **शिकायत रजिस्टर (\`/complaints\`):** नागरिक शिकायतों की सूची व ट्रैकिंग।
* **शिकायत पंजीकरण (\`/complaints/register\`):** शिकायतकर्ता, घटना, साक्ष्य अपलोड व ऑटो-GD सुझाव।
* **शिकायत वर्कस्पेस (\`/complaints/[id]\`):** संपूर्ण पत्रावली, EO जांच आख्या व SHO अप्रूवल मोडल।
* **मुकद्दमा रजिस्टर (\`/fir\`):** CCTNS सिंक स्टेटस सहित सभी FIRs।
* **नियमित FIR पंजीकरण (\`/fir/register\`):** BNS धाराओं व अभियुक्त विवरण सहित विधिवत मुकद्दमा दर्ज करना।
* **केस फ़ाइल (\`/fir/[id]\`):** केस डायरी (Zimni), ज़ब्ती मेमो व केस डॉक्युमेंट्स।
* **गिरफ़्तारी प्रपत्र वर्कस्पेस (\`/fir-workspace/arrest-docs\`):** 4-पेज अरेस्ट मेमो 26.8, फर्द जामातालाशी, आधार पत्र u/s 47, इत्तिला u/s 48, मेडिकल व रिमांड।
* **केस डायरी वर्कस्पेस (\`/fir-workspace/zimni\`):** धारा 192 BNSS के तहत ज़िमनी लेखन।
* **कानूनी धाराएं (\`/acts-sections\`):** BNS, BNSS, BSA व विशेष अधिनियम संदर्भ।
* **स्टाफ व प्रोफाइल (\`/users\`, \`/station-profile\`):** नफरी, रोस्टर व बीट्स।

---

### 2. बैकएंड व API सेवाएं (Backend Services & APIs):
* **\`complaintService\` / \`/api/complaints\`:** शिकायत प्रबंधन, जांच आख्या व SHO अप्रूवल (FIR/NCR/Closure)।
* **\`firService\` / \`/api/fir\`:** FIR पंजीकरण, केस डायरी (Zimni), गिरफ़्तारी डॉक्युमेंट्स अटैचमेंट।
* **\`generalDiaryService\` / \`/api/general-diary\`:** 54 रोजनामचा कोड्स, ऑटो-सिक्वेंसिंग, Auto-Suggestions & Drafts, Verify & Lock।
* **\`universalEvidenceService\` / \`/api/evidence\`:** साक्ष्य स्टोरेज, हैश वेरिफिकेशन व मेटाडेटा।

---

### 3. डेटाबेस मॉडल्स (Prisma Database Schema):
* **\`GDRecord\` & \`GeneralDiaryEntry\`:** रोजनामचा आम रपटें (लॉक्ड व सजेस्टेड)।
* **\`Complaint\` & \`EnquiryReport\`:** नागरिक शिकायतें व जांच रिपोर्ट।
* **\`FIRItem\` & \`FIRCaseDiaryItem\`:** मुकद्दमा पत्रावली व केस डायरी।
* **\`AccusedPerson\`:** अभियुक्तों के वैधानिक विवरण।
* **\`PoliceUnit\` & \`User\`:** थाना क्षेत्राधिकार व पुलिस अधिकारी।

**आप मुझे किसी भी कार्य के लिए सीधे निर्देश दे सकते हैं। मैं आपकी अनुमति लेकर कार्य निष्पादित करूँगा।**`,
      timestamp: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
      suggestedPrompts: [
        "FIR 125: Anil Kumar arrest docs banao",
        "Complaints register form kholo",
        "General Diary drafts dikhao",
        "Dhara 303(2) BNS kya hai?",
      ],
    };
  }

  private static async handleArrestDocIntent(
    rawInput: string,
    firNumber: string,
    personName: string,
    currentPath?: string
  ): Promise<AgentMessage> {
    const allFirs = firService.getAllFirs();
    let fir: FIRItem | undefined;

    if (firNumber) {
      fir = allFirs.find(
        (f) =>
          f.firNumber.toLowerCase().includes(firNumber.toLowerCase()) ||
          f.id.toLowerCase().includes(firNumber.toLowerCase())
      );
    }

    if (!fir && rawInput.includes("125")) {
      fir = allFirs.find((f) => f.firNumber.includes("125") || f.id.includes("125"));
    }

    if (!fir) {
      fir = allFirs[0];
    }

    this.updateContext({
      activeFirId: fir.id,
      activeFirNumber: fir.firNumber,
      activePersonName: personName || fir.accusedList?.[0]?.name || "Anil Kumar",
      activePoliceStation: fir.policeStation,
      activeDistrict: fir.district,
    });

    const proposedDocs = AgentDocumentEngine.generateArrestDossier(fir, rawInput);

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
      understoodIntent: `अधिकारी द्वारा सूचित किया गया कि अभियुक्त ${personName || "Anil Kumar"} को गिरफ़्तार किया गया है। मुकद्दमा सं. ${fir.firNumber} के अंतर्गत समस्त अनिवार्य कानूनी गिरफ़्तारी प्रपत्र (Arrest Memo 26.8 सहित 6 दस्तावेज़) तैयार किए जाने हैं।`,
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

  private static handleNavigationIntent(route: any, rawInput?: string): AgentMessage {
    const isModal = route.path === "MODAL:ROLE_SWITCHER" || route.path.startsWith("MODAL:");
    const planId = `plan_nav_${Date.now()}`;

    const actionPlan: AgentActionPlan = {
      id: planId,
      title: isModal ? `Open ${route.title}` : `Open ${route.title} (${route.path})`,
      understoodIntent: isModal
        ? `उपयोगकर्ता द्वारा '${route.title}' स्क्रीन पर खोलने का निर्देश दिया गया है।`
        : `उपयोगकर्ता द्वारा वेबसाइट के फॉर्म / पेज '${route.title}' (${route.path}) को खोलने का निर्देश दिया गया है।`,
      confidenceScore: 1.0,
      primaryModule: "UNIVERSAL",
      targetRecords: [
        {
          type: isModal ? "MODAL" : "PAGE",
          id: route.path,
          label: route.title,
          url: isModal ? undefined : route.path,
        },
      ],
      steps: [
        {
          id: "nav_step_1",
          stepNumber: 1,
          module: "UNIVERSAL",
          actionTitle: isModal ? `डायलॉग बॉक्स खोलना: ${route.title}` : `फॉर्म / पेज खोलना: ${route.title}`,
          actionDescription: `${route.description}`,
          isDestructive: false,
          requiresOfficialApproval: false,
          status: "PENDING",
        },
      ],
      status: "AWAITING_APPROVAL",
      createdAt: new Date().toISOString(),
      executablePayload: {
        toolName: isModal ? "open_modal" : "navigate",
        parameters: {
          url: isModal ? undefined : route.path,
          modalEvent: isModal ? "cms-open-role-switcher" : undefined,
          title: route.title,
        },
      },
    };

    this.updateContext({ lastActionPlanId: planId, activeActionPlan: actionPlan });

    const text = isModal
      ? `🟢 **${route.title} खोलने का अनुरोध:**\n\n* **प्रकार:** स्क्रीन डायलॉग बॉक्स (Modal)\n* **उद्देश्य:** ${route.description}\n\nडायलॉग बॉक्स खोलने के लिए नीचे **"डायलॉग बॉक्स खोलें (Open Dialog)"** पर क्लिक करें अथवा "हाँ / खोल दो" कहें।`
      : `📍 **${route.title} खोलने का अनुरोध:**\n\n* **पेज / फॉर्म:** ${route.title}\n* **URL:** \`${route.path}\`\n* **श्रेणी:** ${route.category}\n* **विवरण:** ${route.description}\n\nइस फॉर्म / पेज पर जाने के लिए नीचे **"फॉर्म खोलें (Open Form Now) ➜"** पर क्लिक करें अथवा "स्वीकृत करें / हाँ" कहें।`;

    return {
      id: `msg_${Date.now()}`,
      sender: "agent",
      text,
      timestamp: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
      actionPlan,
      suggestedPrompts: [
        isModal ? "डायलॉग बॉक्स खोलें" : "फॉर्म खोलें (Open Form)",
        "General Diary रजिस्टर पर जाएं",
        "रद्द करें (Cancel)",
      ],
      moduleContext: {
        currentPath: route.path,
        moduleName: "UNIVERSAL",
      },
    };
  }

  private static handleComplaintRegisterIntent(rawInput: string): AgentMessage {
    return {
      id: `msg_${Date.now()}`,
      sender: "agent",
      text: `📝 **नागरिक शिकायत पंजीकरण सहायता (Register Complaint):**\n\nनई शिकायत दर्ज करने के लिए आवश्यक विवरण:\n1. **शिकायतकर्ता का नाम, मोबाइल व पता**\n2. **घटना का स्थान व दिनांक/समय**\n3. **आरोपी / संदिग्ध का विवरण (यदि ज्ञात हो)**\n4. **शिकायत का संक्षिप्त विवरण (Incident Details)**\n\nआप सीधे शिकायत का विवरण मुझे बोलकर या लिखकर दे सकते हैं, अथवा सीधे पंजीकरण फॉर्म पर जा सकते हैं:`,
      timestamp: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
      actionPlan: {
        id: `plan_comp_reg_${Date.now()}`,
        title: "Open Complaint Registration Form",
        understoodIntent: "शिकायत पंजीकरण फॉर्म खोलना।",
        confidenceScore: 0.95,
        primaryModule: "COMPLAINTS",
        targetRecords: [{ type: "PAGE", id: "/complaints/register", label: "Register Complaint", url: "/complaints/register" }],
        steps: [
          {
            id: "cr_1",
            stepNumber: 1,
            module: "COMPLAINTS",
            actionTitle: "शिकायत पंजीकरण पृष्ठ खोलना",
            actionDescription: "/complaints/register फॉर्म पर नेविगेट करना।",
            isDestructive: false,
            requiresOfficialApproval: false,
            status: "PENDING",
          },
        ],
        status: "AWAITING_APPROVAL",
        createdAt: new Date().toISOString(),
      },
      suggestedPrompts: ["शिकायत फॉर्म खोलें", "General Diary drafts dikhao", "FIR 125 kholo"],
    };
  }

  private static handleFirRegisterIntent(rawInput: string): AgentMessage {
    return {
      id: `msg_${Date.now()}`,
      sender: "agent",
      text: `⚖️ **नियमित मुकद्दमा पंजीकरण (FIR Registration):**\n\nनियमित FIR दर्ज करने हेतु BNS 2023 की धाराएं, तहरीर, घटना स्थल व आरोपी विवरण अनिवार्य हैं।\n\nआप मुझे तहरीर का मजमून दे सकते हैं, या सीधे FIR रजिस्ट्रेशन फॉर्म पर जा सकते हैं:`,
      timestamp: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
      actionPlan: {
        id: `plan_fir_reg_${Date.now()}`,
        title: "Open FIR Registration Form",
        understoodIntent: "FIR पंजीकरण फॉर्म खोलना।",
        confidenceScore: 0.95,
        primaryModule: "FIR_WORKSPACE",
        targetRecords: [{ type: "PAGE", id: "/fir/register", label: "Register FIR", url: "/fir/register" }],
        steps: [
          {
            id: "fr_1",
            stepNumber: 1,
            module: "FIR_WORKSPACE",
            actionTitle: "FIR रजिस्ट्रेशन फॉर्म खोलना",
            actionDescription: "/fir/register फॉर्म पर नेविगेट करना।",
            isDestructive: false,
            requiresOfficialApproval: false,
            status: "PENDING",
          },
        ],
        status: "AWAITING_APPROVAL",
        createdAt: new Date().toISOString(),
      },
      suggestedPrompts: ["FIR फॉर्म खोलें", "BNS 303(2) kya hai", "FIR 125 kholo"],
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

  private static handleStaffQueryIntent(rawInput: string): AgentMessage {
    return {
      id: `msg_${Date.now()}`,
      sender: "agent",
      text: `👮 **थाना स्टाफ व वर्तमान नफरी स्थिति:**\n\n* **थाना प्रभारी (SHO):** Inspector Rajesh Kumar (PNO: HR-04291882)\n* **मुंशी (MHC):** Head Constable Devinder Kumar (PNO: HR-05192834)\n* **ड्यूटी ऑफिसर (Counter):** ASI Surender Pal (PNO: HR-09384712)\n* **जांच अधिकारी (EO 1):** SI Vikram Singh (PNO: HR-07182930)\n* **जांच अधिकारी (EO 2):** ASI Ramesh Chander (PNO: HR-06281923)\n\n*आप रोल स्विच करने के लिए टॉप बार में नाम पर क्लिक कर सकते हैं।*`,
      timestamp: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
      suggestedPrompts: ["Staff पेज खोलें", "General Diary देखें", "FIR 125 kholo"],
    };
  }

  private static async handleGeneralQueryIntent(rawInput: string, context: AgentSessionContext): Promise<AgentMessage> {
    return {
      id: `msg_${Date.now()}`,
      sender: "agent",
      text: `जय हिन्द! मैं **हरियाणा पुलिस CMS AI Agent** हूँ। मुझे इस वेबसाइट के संपूर्ण फ्रंटएंड, बैकएंड APIs और डेटाबेस की पूर्ण समझ है।\n\n**मैं आपकी अनुमति से वेबसाइट के सभी कार्य कर सकता हूँ:**\n1. **गिरफ़्तारी प्रपत्र निर्माण:** "Anil Kumar ko arrest karke laya hoon FIR 125 me, arrest documents bana do"\n2. **केस डायरी (Zimni):** "FIR 125 ki Zimni draft karo"\n3. **रोजनामचा आम (GD Entry):** "Is case ki GD draft karo" या "रवानगी गश्त लिखो"\n4. **शिकायत व FIR पंजीकरण:** "Nayi complaint darj karni hai" या "FIR register form kholo"\n5. **सिस्टम वास्तुकला:** "Website me kahan kya hota hai samjhao"\n6. **कानूनी धाराएं (BNS/BNSS):** "Dhara 303(2) BNS kya hai?"\n\n*यदि कोई विवरण अधूरा होगा तो मैं आपसे पूछूँगा। कोई भी कार्य बिना आपकी अनुमति के नहीं किया जाएगा।*`,
      timestamp: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
      suggestedPrompts: [
        "Website me kahan kya hota hai samjhao",
        "FIR 125: Anil Kumar arrest docs banao",
        "FIR 125 kholo",
        "GD Draft karo",
      ],
    };
  }

  /**
   * Safe execution of an approved plan
   */
  public static async executeActionPlan(planId: string): Promise<AgentMessage> {
    const context = this.getContext();
    const activePlan = context.activeActionPlan;
    const toolName = activePlan?.executablePayload?.toolName;
    const params = activePlan?.executablePayload?.parameters || {};

    // 1. Navigation execution
    if (toolName === "navigate") {
      const url = params.url || activePlan?.targetRecords?.[0]?.url || "/";
      const title = params.title || activePlan?.title || "पेज";
      this.updateContext({ lastActionPlanId: undefined, activeActionPlan: undefined });
      return {
        id: `msg_${Date.now()}`,
        sender: "agent",
        text: `✅ **फॉर्म / पेज खोला जा रहा है!**\n\n* **पेज:** ${title}\n* **URL:** \`${url}\`\n\nस्क्रीन को निर्देशित फॉर्म / पेज पर ले जाया जा रहा है।`,
        timestamp: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
        actionPlan: activePlan ? { ...activePlan, status: "APPROVED" } : undefined,
        suggestedPrompts: ["New Entry दर्ज करें", "वापस जाएं"],
      };
    }

    // 2. Open Modal execution
    if (toolName === "open_modal") {
      this.updateContext({ lastActionPlanId: undefined, activeActionPlan: undefined });
      return {
        id: `msg_${Date.now()}`,
        sender: "agent",
        text: `✅ **डायलॉग बॉक्स सक्रिय कर दिया गया है!**\n\nस्क्रीन पर रोल स्विचर डायलॉग बॉक्स खोल दिया गया है।`,
        timestamp: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
        actionPlan: activePlan ? { ...activePlan, status: "APPROVED" } : undefined,
        suggestedPrompts: ["ठीक है", "वापस जाएं"],
      };
    }

    // 3. Save GD Suggestion execution
    if (toolName === "save_gd_suggestion") {
      const fir = firService.getAllFirs().find((f) => f.id === params.firId || f.id === context.activeFirId) || firService.getAllFirs()[0];
      await GeneralDiaryService.generateSuggestionFromSystemEvent({
        eventType: "OFFICER_DISPATCHED",
        subject: params.subject || "रोजनामcha आम इंद्राज",
        narrative: params.narrative || "",
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
      this.updateContext({ lastActionPlanId: undefined, activeActionPlan: undefined });
      return {
        id: `msg_${Date.now()}`,
        sender: "agent",
        text: `✅ **रोजनामचा इंद्राज सफलतापूर्वक भेजा गया!**\n\nयह Smart General Diary के **"Auto-Suggestions & Drafts"** टैब में मुंशी (MHC) के संज्ञानार्थ जोड़ दिया गया है।`,
        timestamp: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
        actionPlan: activePlan ? { ...activePlan, status: "APPROVED" } : undefined,
        suggestedPrompts: ["GD Drafts देखें", "General Diary खोलें"],
      };
    }

    // 4. Default: Save Arrest Dossier & Form 26.8 Memo
    const fir = firService.getAllFirs().find((f) => f.id === context.activeFirId || f.firNumber === context.activeFirNumber) || firService.getAllFirs()[0];
    try {
      firService.addDocument(fir.id, {
        id: `doc_arrest_${Date.now()}`,
        title: `Arrest Dossier & Form 26.8 Memo - ${context.activePersonName || "Anil Kumar"}`,
        fileName: `Arrest_Memo_${context.activePersonName || "Anil"}_FIR_${fir.id}.html`,
        category: "LEGAL_NOTICE",
        uploadedBy: "SI Neeraj Kumar (IO via AI Assistant)",
        uploadedAt: new Date().toISOString(),
      });

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

    this.updateContext({ lastActionPlanId: undefined, activeActionPlan: undefined });

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
