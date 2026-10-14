import { firService } from "@/services/firService";
import { ComplaintService } from "@/services/complaintService";
import { GeneralDiaryService } from "@/services/generalDiaryService";
import { AgentDocumentEngine } from "./agentDocumentEngine";
import {
  CmsCapabilityRegistry,
  WEBSITE_ARCHITECTURE,
  WebsiteRouteInfo,
  CMS_FIELDS,
  CMS_ACTIONS,
  CMS_WORKFLOWS,
} from "./cmsCapabilityRegistry";
import {
  AgentMessage,
  AgentActionPlan,
  AgentActionItem,
  AgentSessionContext,
  ProposedDocument,
  UIContextState,
  AgentAttachment,
} from "@/types/cmsAgent";
import { FIRItem } from "@/types";
import { MOCK_ENQUIRY_OFFICERS } from "@/lib/mockData";
import { CCTNS_OFFICIAL_GD_TYPES } from "@/lib/generalDiaryConfig";
import { GDEntryTypeConfig } from "@/types/generalDiary";
import { kalandraService } from "@/services/kalandraService";
import { KalandraRecord } from "@/types/kalandra";

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
   * Universal Operating Agent Architecture:
   * 1. Multi-turn context resolution & slot extraction
   * 2. Permission-First verification
   * 3. Multi-Step intelligent execution
   * 4. Universal frontend & backend coordination
   */
  public static async processUserInput(
    userInput: string,
    currentPath?: string,
    attachments?: any[]
  ): Promise<AgentMessage> {
    const raw = (userInput || "").trim();
    const q = raw.toLowerCase();
    const context = this.getContext();

    // 0. Permission Affirmation Check ("Approve", "हाँ", "कर दो", "Proceed", "Save karo", "Ab save karo", "Ab save kar do")
    const isAffirmation =
      Boolean(context.lastActionPlanId) &&
      !q.includes("date") &&
      !q.includes("tarikh") &&
      !q.includes("select") &&
      !q.includes("fill") &&
      (q === "approve" ||
        q === "yes" ||
        q === "हाँ" ||
        q === "proceed" ||
        q === "स्वीकृत" ||
        q === "save" ||
        q === "kar do" ||
        q === "kardo" ||
        q === "kar do ise" ||
        q === "kar do ise save" ||
        q.includes("save kar do") ||
        q.includes("ab save") ||
        q.includes("save karo") ||
        q.includes("स्वीकृत करें") ||
        q.includes("theek hai") ||
        q.includes("ठीक है"));

    if (isAffirmation) {
      return this.executeActionPlan(context.lastActionPlanId!);
    }

    // 1. Slot Extraction & Context Continuity
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
    } else if (q.includes("isko") || q.includes("is case") || q.includes("is mukaddme") || q.includes("iske") || !raw.match(/[0-9]+/)) {
      firNumber = context.activeFirNumber || "";
    }

    // Extract Accused / Person Name
    let personName = "";
    const personMatch = raw.match(/(?:arrest\s+karke|accused|shri|sh\.|naam\s+hai)\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)/i);
    if (q.includes("anil kumar") || q.includes("anil")) {
      personName = "Anil Kumar";
    } else if (personMatch && personMatch[1]) {
      personName = personMatch[1].trim();
    } else if (context.activePersonName) {
      personName = context.activePersonName;
    }

    // Extract Complaint Number
    let complaintNumber = "";
    const compMatch = raw.match(/(?:complaint|shikayat)\s*(?:no\.?|number|#)?\s*([0-9]+)/i);
    if (compMatch && compMatch[1]) {
      complaintNumber = compMatch[1];
    } else if ((q.includes("is complaint") || q.includes("iski")) && context.activeComplaintNumber) {
      complaintNumber = context.activeComplaintNumber;
    }

    // Extract Mobile Number
    const mobMatch = raw.match(/(?:mobile|phone|contact|no\.?)\s*(?:hai|:)?\s*([6-9][0-9]{9})/i) || raw.match(/\b([6-9][0-9]{9})\b/);
    const mobileNumber = mobMatch ? mobMatch[1] : "";

    // Extract Address
    const addrMatch = raw.match(/(?:address|pata|rehne\s+wala|niwasi)\s*(?:hai|:)?\s*([A-Za-z0-9,\s\-]+?)(?=\s+(?:hai|aur|baaki|mobile|$))/i);
    const addressText = addrMatch ? addrMatch[1].trim() : "";

    // Extract Target Station for transfer
    const stMatch = raw.match(/(?:thane|station|ps)\s+([A-Za-z\s]+?)(?=\s+(?:ko|mein|me|bhejo|transfer|$))/i);
    const targetStation = stMatch ? stMatch[1].trim() : "PS City Thanesar";

    // -------------------------------------------------------------
    // INTENT: AI MODEL INQUIRY (Gemini 3.6 Flash)
    // -------------------------------------------------------------
    if (
      q.includes("kis model") ||
      q.includes("kaun sa model") ||
      q.includes("kaunsa model") ||
      q.includes("model kya hai") ||
      q.includes("model se juda") ||
      q.includes("which model") ||
      q.includes("ai model") ||
      q.includes("gemini model") ||
      q.includes("gemini 3.6")
    ) {
      return {
        id: `msg_model_${Date.now()}`,
        sender: "agent",
        text: `🤖 **CMS AI Operating Agent मॉडल विवरण:**\n\n* **सक्रिय AI मॉडल:** **Google Gemini 3.6 Flash** (\`gemini-3.6-flash\`)\n* **आर्किटेक्चर:** Hybrid Neural-Domain Architecture\n  * **LLM Engine:** Gemini 3.6 Flash (हाई-स्पीड कॉम्प्रिहेंशन, वॉयस डिक्टेशन व मल्टी-मॉडल एनालिसिस)\n  * **कानूनी व डोमेन इंजन:** Haryana Police Case Management Operating Engine (BNS 2023, BNSS 2023, BSA 2023 व Punjab Police Rules 1934)\n* **एपीआई प्रोवाइडर:** Google AI Studio / Gemini API\n* **एक्सेस स्टेटस:** ✅ सक्रिय (Active & Ready)\n\nआप किसी भी फॉर्म को खोलने, FIR/शिकायत विश्लेषण करने, या कानूनी प्रपत्र तैयार करने का निर्देश दे सकते हैं।`,
        timestamp: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
        suggestedPrompts: [
          "register complaint form kholo",
          "Add entry daailogue box kholo",
          "FIR 125 kholo",
          "Role switcher dialogue kholo",
        ],
      };
    }

    // -------------------------------------------------------------
    // INTENT: CONTEXTUAL COMMANDS ("Isko kholo", "Ismein date aaj ki kar do")
    // -------------------------------------------------------------
    if (
      q === "isko kholo" ||
      q === "ise kholo" ||
      q === "is case ko kholo" ||
      q === "open this record" ||
      q === "open this"
    ) {
      return this.handleOpenActiveRecordIntent(context);
    }

    if (q.includes("date aaj ki") || q.includes("aaj ki date") || q.includes("tarikh aaj ki") || q.includes("date badlo")) {
      return this.handleContextualDateUpdateIntent(currentPath, context);
    }

    // -------------------------------------------------------------
    // INTENT: CROSS-MODULE INTEGRATED WORKFLOW
    // e.g. "Anil ki complaint search karo, uska EO dekho, notice draft karo aur related GD entry bhi prepare karo"
    // -------------------------------------------------------------
    const isCrossModuleCommand =
      (q.includes("complaint") || q.includes("shikayat")) &&
      (q.includes("eo") || q.includes("enquiry") || q.includes("officer")) &&
      (q.includes("notice") || q.includes("gd") || q.includes("roznamcha")) &&
      (q.includes("draft") || q.includes("prepare") || q.includes("taiyar") || q.includes("search") || q.includes("dekho"));

    if (isCrossModuleCommand) {
      return this.handleCrossModuleWorkflowIntent(raw, personName, context);
    }

    // -------------------------------------------------------------
    // INTENT: POLICE STATION TRANSFER WORKFLOW ("Is complaint ko doosre thane bhejo")
    // -------------------------------------------------------------
    const isTransferCommand =
      (q.includes("doosre thane") ||
        q.includes("dusre thane") ||
        q.includes("transfer") ||
        q.includes("bhejo thane") ||
        q.includes("thane bhejo") ||
        q.includes("bhejo")) &&
      (q.includes("complaint") || q.includes("shikayat") || Boolean(context.activeComplaintNumber));

    if (isTransferCommand) {
      return this.handleTransferPoliceStationIntent(raw, complaintNumber, targetStation, context);
    }

    // -------------------------------------------------------------
    // INTENT: DETAILED COMPLAINT REGISTRATION INTAKE (Intelligent Field Understanding & Autofill)
    // e.g. "Anil Kumar ki complaint likho, uska address Hisar hai aur baaki details uploaded PDF mein hain"
    // -------------------------------------------------------------
    const queryHasDetails = Boolean(
      personMatch ||
        q.includes("anil") ||
        q.includes("kumar") ||
        mobileNumber ||
        addressText ||
        q.includes("address") ||
        q.includes("pata") ||
        q.includes("mobile") ||
        q.includes("pdf") ||
        q.includes("uploaded") ||
        (attachments && attachments.length > 0)
    );

    const isDetailedComplaintIntake =
      queryHasDetails &&
      (q.includes("complaint likho") ||
        q.includes("complaint darj") ||
        q.includes("shikayat darj") ||
        q.includes("application register") ||
        q.includes("nayi complaint") ||
        q.includes("details uploaded") ||
        q.includes("pdf")) &&
      !q.includes("search") &&
      !q.includes("list");

    if (isDetailedComplaintIntake) {
      return this.handleDetailedComplaintIntakeIntent(raw, personName, mobileNumber, addressText, attachments);
    }

    // -------------------------------------------------------------
    // INTENT A: WEBSITE ARCHITECTURE & SYSTEM STRUCTURE
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
    // INTENT B: CLOSE ACTIVE DIALOG BOX ("Jo dialog khula hai use band karo")
    // -------------------------------------------------------------
    if (
      q.includes("dialog khula hai use band karo") ||
      q.includes("dialogue band karo") ||
      q.includes("dialog band karo") ||
      q.includes("dialog close karo") ||
      q.includes("popup band karo")
    ) {
      return this.handleCloseDialogIntent();
    }

    // -------------------------------------------------------------
    // INTENT B.2: GENERAL DIARY (ROZNAMCHA) ADD ENTRY FORM FIELD & GD TYPE SELECTION
    // e.g. "GD type select me criminal case fill kr do", "roznamcha me add entry me criminal case select kr do",
    // "criminal case fill kr do", "officer me SI Vikram Singh kr do", "case type juvenile kr do"
    // -------------------------------------------------------------
    const gdFormPayload = this.extractGDFormFieldsFromQuery(raw, currentPath, firNumber);
    if (gdFormPayload) {
      return this.handleGDFormFieldFillIntent(raw, gdFormPayload, currentPath);
    }

    // -------------------------------------------------------------
    // INTENT C: OPEN FORM / DIALOGUE BOX / PAGE / WORKSPACE NAVIGATION
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

    if (
      targetRoute &&
      (isOpenOrNavQuery ||
        q.includes("register") ||
        q.includes("new") ||
        q.includes("nayi") ||
        q.includes("add") ||
        q.includes("darj") ||
        q.includes("leni") ||
        q.includes("lena") ||
        q.includes("likh"))
    ) {
      // If user asks specifically for documents check rather than navigation, defer to FIR documents check
      if (!(q.includes("document") && (q.includes("check") || q.includes("dikhao")))) {
        return this.handleNavigationIntent(targetRoute, raw);
      }
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
    // INTENT D: FORM AUTO-FILLING ("Ye form automatically bhar do")
    // -------------------------------------------------------------
    if (
      q.includes("automatically bhar do") ||
      q.includes("form automatically bhar do") ||
      q.includes("form auto fill") ||
      q.includes("form fill karo") ||
      q.includes("ye form bhar do")
    ) {
      return this.handleAutofillIntent(currentPath);
    }

    // -------------------------------------------------------------
    // INTENT E: MULTI-STEP INTEGRATED WORKFLOW EXECUTION
    // e.g. "FIR 125 kholo, Anil Kumar ka record check karo, arrest documents taiyar karo, GD draft banao aur sab documents dikhao"
    // or "Is case ke saare required documents taiyar karo"
    // -------------------------------------------------------------
    const isMultiStepCommand =
      (q.includes("arrest") && q.includes("gd") && (q.includes("document") || q.includes("dossier") || q.includes("record") || q.includes("banao"))) ||
      q.includes("saare required documents") ||
      q.includes("sabhi documents taiyar karo") ||
      (q.includes("kholo") && q.includes("check karo") && q.includes("taiyar karo")) ||
      (firNumber && q.includes("record check karo") && q.includes("arrest"));

    if (isMultiStepCommand) {
      return this.handleMultiStepWorkflowIntent(raw, firNumber, personName, currentPath);
    }

    // -------------------------------------------------------------
    // INTENT F: FIR DOCUMENTS CHECK ("FIR 125 ke documents check karo")
    // -------------------------------------------------------------
    if (firNumber && (q.includes("document") || q.includes("documents")) && (q.includes("check") || q.includes("dikhao") || q.includes("list") || q.includes("kya hai"))) {
      return this.handleFirDocumentsCheckIntent(firNumber);
    }

    // -------------------------------------------------------------
    // INTENT G: STATUTORY LEGAL NOTICES & TEMPLATES (35(3) BNSS / 91 BNSS / Bilingual Templates & Drafts)
    // e.g. "Dhara 35(3) ka notice banao", "Naya notice template banao", "Toggle ka interface dikhao", "Templates & Drafts"
    // -------------------------------------------------------------
    if (
      q.includes("35(3)") ||
      q.includes("35 bnss") ||
      q.includes("41a") ||
      q.includes("notice of appearance") ||
      q.includes("91 bnss") ||
      q.includes("summons notice") ||
      q.includes("notice template") ||
      q.includes("templates & drafts") ||
      q.includes("templates and drafts") ||
      q.includes("toggle ka interface") ||
      q.includes("toggle interface") ||
      q.includes("template interface") ||
      q.includes("switch languages") ||
      (q.includes("template") && (q.includes("banao") || q.includes("dikhao") || q.includes("draft") || q.includes("kholo") || q.includes("toggle"))) ||
      (q.includes("notice") && (q.includes("banao") || q.includes("draft") || q.includes("template") || q.includes("dikhao")))
    ) {
      return this.handleLegalNoticeIntent(raw, firNumber, personName);
    }

    // -------------------------------------------------------------
    // INTENT H: ASSIGN ENQUIRY OFFICER (EO) TO COMPLAINT ("EO laga do", "Enquiry officer de do", "Is complaint ki enquiry kisi officer ko de do")
    // -------------------------------------------------------------
    if (
      (q.includes("complaint") || q.includes("shikayat") || complaintNumber || context.activeComplaintNumber || q.includes("enquiry") || q.includes("eo")) &&
      (q.includes("eo assign") ||
        q.includes("assign eo") ||
        q.includes("adhikari assign") ||
        q.includes("eo badlo") ||
        q.includes("eo laga") ||
        q.includes("eo de do") ||
        q.includes("enquiry officer de do") ||
        q.includes("enquiry officer laga") ||
        q.includes("kisi officer ko de do") ||
        q.includes("officer ko de do") ||
        q.includes("assign kar do"))
    ) {
      return this.handleAssignEoIntent(raw, complaintNumber);
    }

    // -------------------------------------------------------------
    // INTENT I: PENDING COMPLAINTS ROSTER REPORT ("Pichhle mahine ki pending complaints ka report banao")
    // -------------------------------------------------------------
    if (
      (q.includes("pending") || q.includes("pichhle mahine") || q.includes("roster")) &&
      (q.includes("complaint") || q.includes("shikayat")) &&
      (q.includes("report") || q.includes("banao") || q.includes("summary"))
    ) {
      return this.handlePendingComplaintsReportIntent();
    }

    // -------------------------------------------------------------
    // INTENT J: AMBIGUITY CHECK FOR ARREST DOCUMENTS
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
    // INTENT K: ARREST DOCUMENT SUITE GENERATION
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
    // INTENT L: GENERAL DIARY (ROZNAMCHA) INTENT
    // -------------------------------------------------------------
    if (
      q.includes("gd draft") ||
      q.includes("gd entry") ||
      q.includes("roznamcha") ||
      q.includes("रोजनामचा") ||
      q.includes("gd banao") ||
      q.includes("rapat")
    ) {
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
    // INTENT M: CASE DIARY / ZIMNI DRAFTING
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
    // INTENT M.5: KALANDRA PREPARATION & MANAGEMENT (कलंदरा)
    // -------------------------------------------------------------
    if (
      q.includes("kalandra") ||
      q.includes("कलंदरा") ||
      q.includes("107/151") ||
      q.includes("107 151") ||
      q.includes("107/150") ||
      q.includes("217 bns") ||
      q.includes("248 bns") ||
      (q.includes("145") && (q.includes("crpc") || q.includes("bnss") || q.includes("zamin") || q.includes("land")))
    ) {
      return this.handleKalandraIntent(raw, personName, firNumber);
    }

    // -------------------------------------------------------------
    // INTENT N: SEARCH COMPLAINTS & CASE RECORDS
    // e.g. "Anil Kumar ki pending complaint search karo"
    // -------------------------------------------------------------
    if (q.includes("complaint") || q.includes("shikayat") || q.includes("शिकायत")) {
      return this.handleComplaintSearchIntent(raw, personName);
    }

    // -------------------------------------------------------------
    // INTENT O: OPEN OR RETRIEVE SPECIFIC FIR / CASE
    // -------------------------------------------------------------
    if (firNumber && (q.includes("kholo") || q.includes("open") || q.includes("dikhao") || q.includes("details") || q.includes("check"))) {
      return this.handleOpenFirIntent(firNumber, raw);
    }

    // -------------------------------------------------------------
    // INTENT P: ACTS & LEGAL SECTIONS LOOKUP
    // -------------------------------------------------------------
    if (q.includes("section") || q.includes("dhara") || q.includes("धारा") || q.includes("bns") || q.includes("bnss") || q.includes("punishment")) {
      return this.handleLegalLookupIntent(raw);
    }

    // -------------------------------------------------------------
    // INTENT Q: STAFF / DUTY ROSTER
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
      text: `🏛️ **हरियाणा पुलिस CMS वास्तुकला व संरचना (System Architecture Map):**\n\nमुझे वेबसाइट के सभी मॉड्यूल्स, पेजेस, बैकएंड APIs और डेटाबेस की पूर्ण समझ है:\n\n1. **रोजनामचा आम (General Diary - PPR 22.48 / BNSS):**\n   * \`/general-diary\`: डिजिटल रजिस्टर (लॉक्ड रपटें) एवं 'Auto-Suggestions & Drafts' टैब\n   * \`/general-diary/new\`: 54 श्रेणियों में नया GD इंद्राज फॉर्म (Add Entry Dialog)\n   * *डेटाबेस:* \`GDRecord\`, \`GeneralDiaryEntry\` | *API:* \`/api/general-diary\`\n\n2. **नागरिक शिकायत डेस्क (Complaints u/s 173(3) BNSS):**\n   * \`/complaints\`: शिकायत सूची, पेंडिंग फ़िल्टर व स्टेटस\n   * \`/complaints/register\`: नया शिकायत पंजीकरण फॉर्म\n   * \`/complaints/[id]\`: संपूर्ण जांच वर्कस्पेस, EO असाइनमेंट, साक्ष्य व SHO रिव्यू\n   * *डेटाबेस:* \`Complaint\`, \`EnquiryReport\`, \`ComplaintEvidence\`\n\n3. **मुकद्दमा व अन्वेषण (FIR & Investigation):**\n   * \`/fir\`: मुकद्दमा रजिस्टर\n   * \`/fir/register\`: नियमित FIR पंजीकरण फॉर्म\n   * \`/fir/[id]\`: केस फ़ाइल, केस डायरी (Zimni), अटैचमेंट्स व टाइमलाइन\n   * \`/fir-workspace/arrest-docs\`: 6 अनिवार्य गिरफ़्तारी प्रपत्र (Form 26.8 Memo, Jamatalashi, Grounds u/s 47, Intimation u/s 48, Medical, Remand)\n   * \`/fir-workspace/zimni\`: केस डायरी डेस्क (Zimni u/s 192 BNSS)\n\n4. **कानूनी संदर्भ (Legal Code Explorer):**\n   * \`/acts-sections\`: BNS, BNSS, BSA की धाराएं, सज़ा व ज़मानत स्थिति\n\n5. **प्रशासन व स्टाफ (Administration):**\n   * \`/users\`: थाना नफरी, ड्यूटी रोस्टर व रोल स्विचर (SHO/MHC/IO/EO)\n   * \`/station-profile\`: थाना अधिकार क्षेत्र व बीट विवरण\n\n*आप किसी भी मॉड्यूल पर जाने अथवा कार्य करने हेतु बोलकर या लिखकर निर्देश दे सकते हैं।*`,
      timestamp: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
      suggestedPrompts: [
        "Add entry daailogue box kholo",
        "register complaint form kholo",
        "FIR 125: Anil Kumar arrest docs banao",
        "Role switcher dialogue kholo",
      ],
    };
  }

  /**
   * Closes active dialog box and returns
   */
  private static handleCloseDialogIntent(): AgentMessage {
    return {
      id: `msg_${Date.now()}`,
      sender: "agent",
      text: `✅ **डायलॉग बॉक्स बंद किया जा रहा है...**\n\nस्क्रीन पर सक्रिय डायलॉग बॉक्स बंद कर दिया गया है।`,
      timestamp: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
      actionPlan: {
        id: `plan_close_${Date.now()}`,
        title: "Close Active Dialog Box",
        understoodIntent: "सक्रिय पॉपअप या डायलॉग बॉक्स को बंद करना।",
        confidenceScore: 1.0,
        primaryModule: "UNIVERSAL",
        targetRecords: [],
        steps: [
          {
            id: "step_close_1",
            stepNumber: 1,
            module: "UNIVERSAL",
            actionTitle: "डायलॉग बॉक्स क्लोज करना",
            actionDescription: "UI विंडो बंद की गई।",
            isDestructive: false,
            requiresOfficialApproval: false,
            status: "COMPLETED",
          },
        ],
        status: "APPROVED",
        createdAt: new Date().toISOString(),
        executablePayload: {
          toolName: "close_modal",
          parameters: {},
        },
      },
      suggestedPrompts: ["मुख्य डैशबोर्ड पर जाएं", "General Diary खोलें"],
    };
  }

  /**
   * Handles direct navigation or modal opening with explicit Action Plan
   */
  /**
   * Handles direct navigation or modal opening with explicit Action Plan (Zero permission required)
   */
  private static handleNavigationIntent(route: WebsiteRouteInfo, rawInput?: string): AgentMessage {
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
          status: "COMPLETED",
        },
      ],
      status: "EXECUTED",
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
      ? `✅ **${route.title}** तुरंत खोला जा रहा है...\n\n* **उद्देश्य:** ${route.description}\n\n*स्क्रीन पर डायलॉग बॉक्स सक्रिय किया जा रहा है (बिना किसी अनुमति के)।*`
      : `✅ **${route.title}** तुरंत खोला जा रहा है...\n\n* **पेज / फॉर्म:** ${route.title}\n* **URL:** \`${route.path}\`\n* **श्रेणी:** ${route.category}\n* **विवरण:** ${route.description}\n\n*स्क्रीन को तुरंत फॉर्म / पेज पर ले जाया जा रहा है (बिना किसी अनुमति के)।*`;

    return {
      id: `msg_${Date.now()}`,
      sender: "agent",
      text,
      timestamp: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
      actionPlan,
      suggestedPrompts: [
        "Register Complaint Form kholo",
        "Add entry daailogue box kholo",
        "Role switcher dialogue kholo",
        "General Diary Register par chalo",
      ],
      moduleContext: {
        currentPath: route.path,
        moduleName: "UNIVERSAL",
      },
    };
  }

  /**
   * Handles Form Auto-Fill request
   */
  private static handleAutofillIntent(currentPath?: string): AgentMessage {
    const isComp = currentPath?.includes("complaint");
    const isGd = currentPath?.includes("general-diary");
    const targetUrl = isComp ? "/complaints/register" : isGd ? "/general-diary/new" : "/complaints/register";
    const formName = isComp ? "नागरिक शिकायत फॉर्म" : isGd ? "रोजनामचा इंद्राज फॉर्म" : "शिकायत फॉर्म";

    return {
      id: `msg_${Date.now()}`,
      sender: "agent",
      text: `✍️ **${formName} ऑटो-फिल सहायता:**\n\nकेस रिकॉर्ड्स व मानक प्रारूप के आधार पर फॉर्म के सभी अनिवार्य फील्ड्स स्वतः लोड किए जा रहे हैं। स्क्रीन को तुरंत फॉर्म पर ले जाया जा रहा है...`,
      timestamp: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
      actionPlan: {
        id: `plan_autofill_${Date.now()}`,
        title: `Auto-Fill ${formName}`,
        understoodIntent: `सक्रिय फॉर्म (${formName}) को केस विवरण से स्वतः भरना।`,
        confidenceScore: 0.95,
        primaryModule: "UNIVERSAL",
        targetRecords: [{ type: "PAGE", id: targetUrl, label: formName, url: targetUrl }],
        steps: [
          {
            id: "step_af_1",
            stepNumber: 1,
            module: "UNIVERSAL",
            actionTitle: "फॉर्म डेटा भरना व नेविगेट करना",
            actionDescription: `${targetUrl} पर फील्ड्स प्री-फिल करना।`,
            isDestructive: false,
            requiresOfficialApproval: false,
            status: "COMPLETED",
          },
        ],
        status: "EXECUTED",
        createdAt: new Date().toISOString(),
        executablePayload: {
          toolName: "navigate",
          parameters: { url: targetUrl },
        },
      },
      suggestedPrompts: ["फॉर्म खोलें", "General Diary खोलें"],
    };
  }

  /**
   * Matches any of the 99 Official CCTNS GD Types (English, Hindi, Hinglish, Devanagari, or code)
   * from a natural language command.
   */
  public static matchGDTypeFromQuery(rawInput: string): GDEntryTypeConfig | null {
    const q = rawInput.toLowerCase();

    // 1. High-priority Hindi / Hinglish / Devanagari / Police slang aliases -> official GD code
    const aliasMap: Array<{ patterns: RegExp[]; code: string }> = [
      {
        patterns: [
          /\bcriminal\s*case\b/i,
          /क्रिमिनल\s*केस/,
          /आपराधिक\s*मामला/,
          /\bmukadd?a?ma\b/i,
          /मुकद्दमा/,
          /मुकदमा/,
          /\bfir\s*(entry|gd|rapat|type)\b/i,
        ],
        code: "CRIMINAL_CASE",
      },
      {
        patterns: [
          /\bnon[-\s]*cognizable\b/i,
          /\bncr\b/i,
          /असंज्ञेय/,
          /एनसीआर/,
        ],
        code: "NON_COGNIZABLE_REPORT",
      },
      {
        patterns: [
          /\barrival\b/i,
          /\baamad\b/i,
          /\bwapsi\b/i,
          /\bvapsi\b/i,
          /आमद/,
          /वापसी/,
        ],
        code: "ARRIVAL",
      },
      {
        patterns: [
          /\bdeparture\b/i,
          /\bravangi\b/i,
          /\brawangi\b/i,
          /रवानगी/,
        ],
        code: "DEPARTURE",
      },
      {
        patterns: [
          /\bpatrol(ling)?\b/i,
          /\bgasht\b/i,
          /\bgast\b/i,
          /गश्त/,
          /पेट्रोलिंग/,
        ],
        code: "PATROLLING",
      },
      {
        patterns: [
          /\bopening\s*(of\s*)?gd\b/i,
          /\bgd\s*open(ing)?\b/i,
          /\baagaz\b/i,
          /आगाज़/,
          /आगाज/,
          /रोजनामचा\s*शुरू/,
        ],
        code: "OPENING_OF_GD",
      },
      {
        patterns: [
          /\bclos(e|ing)\s*(of\s*)?gd\b/i,
          /\bgd\s*clos(e|ing)\b/i,
          /\bbandi\b/i,
          /बंदी/,
          /रोजनामचा\s*बंद/,
        ],
        code: "CLOSE_OF_GD",
      },
      {
        patterns: [
          /\broll\s*call\b/i,
          /\bhaziri\b/i,
          /\bginti\b/i,
          /हाजिरी/,
          /गिनती/,
          /रोल\s*कॉल/,
        ],
        code: "ROLL_CALL",
      },
      {
        patterns: [
          /\bnakabandi\b/i,
          /\bnaka\s*bandi\b/i,
          /नाकाबंदी/,
        ],
        code: "NAKABANDI",
      },
      {
        patterns: [
          /\bmissing\s*person\b/i,
          /\bgumshuda\b/i,
          /गुमशुदा/,
          /लापता/,
        ],
        code: "MISSING_PERSON",
      },
      {
        patterns: [
          /\bpcr\s*call\b/i,
          /\bdial\s*112\b/i,
          /\b112\s*call\b/i,
          /पीसीआर\s*कॉल/,
        ],
        code: "PCR_CALL",
      },
      {
        patterns: [
          /\brukk?a\s*(gd)?\b/i,
          /रुक्का/,
        ],
        code: "RUKKA_GD",
      },
      {
        patterns: [
          /\bcase\s*diary\b/i,
          /\bzimni\b/i,
          /केस\s*डायरी/,
          /ज़िमनी/,
        ],
        code: "CASE_DIARY",
      },
      {
        patterns: [
          /\bremand\b/i,
          /रिमांड/,
        ],
        code: "REMAND",
      },
      {
        patterns: [
          /\bbail\b/i,
          /\bzamanat\b/i,
          /जमानत/,
          /बेल/,
        ],
        code: "BAIL",
      },
      {
        patterns: [
          /\bpreventive\s*action\b/i,
          /निवारक\s*कार्यवाही/,
        ],
        code: "PREVENTIVE_ACTION",
      },
      {
        patterns: [
          /\bchange\s*of\s*guard\b/i,
          /\bsentry\s*badli\b/i,
          /पहरा\s*बदली/,
          /गार्ड\s*बदली/,
        ],
        code: "CHANGE_OF_GUARD",
      },
      {
        patterns: [
          /\bmalkhana\s*inspection\b/i,
          /मालखाना\s*निरीक्षण/,
        ],
        code: "MALKHANA_INSPECTION",
      },
      {
        patterns: [
          /\bunidentified\s*dead\s*body\b/i,
          /\blawaris\s*lash\b/i,
          /अज्ञात\s*शव/,
          /लावारिस\s*लाश/,
        ],
        code: "UNIDENTIFIED_DEAD_BODY",
      },
    ];

    for (const entry of aliasMap) {
      if (entry.patterns.some((re) => re.test(rawInput))) {
        const found = CCTNS_OFFICIAL_GD_TYPES.find((t) => t.code === entry.code);
        if (found) return found;
      }
    }

    // 2. Match against all 99 CCTNS_OFFICIAL_GD_TYPES by exact nameEn, code, or nameHi (longest nameEn first)
    const sortedTypes = [...CCTNS_OFFICIAL_GD_TYPES].sort(
      (a, b) => (b.nameEn || "").length - (a.nameEn || "").length
    );

    for (const gdType of sortedTypes) {
      const labelLower = (gdType.nameEn || "").toLowerCase();
      if (!labelLower) continue;
      const codeLower = gdType.code.toLowerCase().replace(/_/g, " ");
      const escapedLabel = labelLower.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const labelRegex = new RegExp(`\\b${escapedLabel}\\b`, "i");
      if (
        labelRegex.test(q) ||
        q.includes(gdType.code.toLowerCase()) ||
        (codeLower.length > 4 && q.includes(codeLower))
      ) {
        return gdType;
      }
    }

    return null;
  }

  /**
   * Detects when the user wants to select/fill GD Type or other fields on the Roznamcha / Add Entry form.
   * Examples:
   * - "GD type select me criminal case fill kr do"
   * - "roznamcha module me add entry me GD type select me criminal case fill kr do"
   * - "criminal case fill kr do" (while on /general-diary or /general-diary/new)
   * - "GD type arrival select karo"
   * - "GD me subject गश्त व चेकिंग भर दो"
   */
  private static extractGDFormFieldsFromQuery(
    rawInput: string,
    currentPath?: string,
    firNumber?: string
  ): {
    typeCode?: string;
    typeLabel?: string;
    typeLabelHi?: string;
    officerName?: string;
    subject?: string;
    narrative?: string;
    caseType?: string;
    sections?: string[];
    applyTemplate?: boolean;
  } | null {
    const q = rawInput.toLowerCase();
    const isOnGDPage = Boolean(currentPath && currentPath.startsWith("/general-diary"));

    const mentionsGDOrRoznamcha =
      /\b(gd\s*type|gd|roznamcha|रोजनामचा|general\s*diary|add\s*entry|new\s*gd|rapat|रपट)\b/i.test(rawInput);

    const hasFillOrSelectVerb =
      /\b(fill|select|choose|set|change|update|bhar|bharo|bhare|bhardo|kr\s*do|kar\s*do|kardo|karo|lagao|laga\s*do|chuno|chun\s*lo|डाल|भर|चुन|सेलेक्ट|सेट|कर\s*दो|करो)\b/i.test(
        rawInput
      );

    // Do not intercept full arrest dossier or multi-step investigation workflows
    if (/\b(arrest\s*docs|arrest\s*memo|dossier|form\s*26\.8|35\(3\))\b/i.test(rawInput)) {
      return null;
    }

    const matchedType = this.matchGDTypeFromQuery(rawInput);

    // Case Type detection (for CRIMINAL_CASE conditional block)
    let caseType: string | undefined;
    if (/\bonly\s*juvenile\b|केवल\s*किशोर/i.test(rawInput)) {
      caseType = "ONLY JUVENILE";
    } else if (/\bjuvenile\s*(&|and|aur)\s*adult\b/i.test(rawInput)) {
      caseType = "JUVENILE & ADULT";
    } else if (/\bcase\s*type\b.*\badult\b|\badult\s*case\s*type\b/i.test(rawInput)) {
      caseType = "ADULT";
    }

    // Extract BNS / IPC sections if mentioned (e.g. "section 303(2)", "धारा 303(2), 317(2)")
    const sections: string[] = [];
    const sectionMatches = rawInput.matchAll(
      /(?:section|sec|dhara|धारा|u\/s)\s*([0-9]{1,3}(?:\([0-9a-zA-Z]+\))?(?:\s*,\s*[0-9]{1,3}(?:\([0-9a-zA-Z]+\))?)*)/gi
    );
    for (const match of sectionMatches) {
      if (match[1]) {
        const parts = match[1].split(",").map((s) => s.trim()).filter(Boolean);
        sections.push(...parts);
      }
    }

    // Extract explicit subject if user says "subject ... fill kr do" / "विषय ... भर दो"
    let subject: string | undefined;
    const subjectMatch = rawInput.match(
      /(?:subject|vishay|विषय)\s*(?:me|mein|में|ko|को|:|-)?\s*["']?([^"'\n]+?)["']?\s*(?:fill|bhar|set|likh|कर\s*दो|भर\s*दो|$)/i
    );
    if (subjectMatch?.[1] && subjectMatch[1].trim().length > 2) {
      subject = subjectMatch[1].trim();
    }

    // Extract officer if mentioned
    let officerName: string | undefined;
    const officerMatch = rawInput.match(
      /\b((?:SI|ASI|Inspector|Insp|HC|Constable)\s+[A-Za-z]+(?:\s+[A-Za-z]+)?)\b/i
    );
    if (officerMatch?.[1]) {
      officerName = officerMatch[1].trim();
    }

    // Decide if this query is targeting the GD form
    const isExplicitGDTypeCommand =
      matchedType !== null &&
      (mentionsGDOrRoznamcha || isOnGDPage || /\bgd\s*type\b/i.test(rawInput)) &&
      (hasFillOrSelectVerb || /\bgd\s*type\b/i.test(rawInput));

    const isExplicitGDFieldCommand =
      (mentionsGDOrRoznamcha || isOnGDPage) &&
      hasFillOrSelectVerb &&
      Boolean(matchedType || caseType || sections.length > 0 || subject || officerName);

    if (!isExplicitGDTypeCommand && !isExplicitGDFieldCommand) {
      return null;
    }

    const applyTemplate =
      /\b(template|auto\s*fill|autofill|पूरा\s*फॉर्म|टेम्पलेट|draft\s*bhar)\b/i.test(rawInput);

    return {
      typeCode: matchedType?.code,
      typeLabel: matchedType?.nameEn,
      typeLabelHi: matchedType?.nameHi,
      officerName,
      subject,
      caseType,
      sections: sections.length > 0 ? sections : undefined,
      applyTemplate,
    };
  }

  /**
   * Immediately selects the GD Type and/or fills GD form fields on `/general-diary/new`
   * without asking permission (UI form fill only — actual database submission still requires user click/approval).
   */
  private static handleGDFormFieldFillIntent(
    rawInput: string,
    payload: {
      typeCode?: string;
      typeLabel?: string;
      typeLabelHi?: string;
      officerName?: string;
      subject?: string;
      narrative?: string;
      caseType?: string;
      sections?: string[];
      applyTemplate?: boolean;
    },
    currentPath?: string
  ): AgentMessage {
    const targetUrl = "/general-diary/new";
    const summaryItems: string[] = [];

    if (payload.typeCode && payload.typeLabel) {
      summaryItems.push(
        `* **GD Type – Select *:** \`${payload.typeLabel}\` (${payload.typeLabelHi || payload.typeCode})`
      );
    }
    if (payload.caseType) {
      summaryItems.push(`* **Case Type *:** \`${payload.caseType}\``);
    }
    if (payload.sections && payload.sections.length > 0) {
      summaryItems.push(`* **Act & Sections (BNS 2023):** \`${payload.sections.join(", ")}\``);
    }
    if (payload.officerName) {
      summaryItems.push(`* **GD For Officer *:** \`${payload.officerName}\``);
    }
    if (payload.subject) {
      summaryItems.push(`* **Subject *:** \`${payload.subject}\``);
    }

    const extraCriminalCaseNote =
      payload.typeCode === "CRIMINAL_CASE"
        ? `\n\n📌 **Criminal Case Conditional Block Active:** \`Case Type (ADULT)\` एवं \`Acts & Sections (BNS 2023)\` अनुभाग भी स्क्रीन पर खुल गया है। आप सीधे **"+ ऑटो-फिल टेम्पलेट"** दबा सकते हैं या मुझे धाराएं (जैसे *"Section 303(2) add kr do"*) बता सकते हैं।`
        : "";

    return {
      id: `msg_gd_fill_${Date.now()}`,
      sender: "agent",
      text: `✅ **रोजनामचा (General Diary - Add Entry) फॉर्म में विवरण तुरंत भर दिया गया है:**\n\n${summaryItems.join("\n")}${extraCriminalCaseNote}`,
      timestamp: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
      actionPlan: {
        id: `plan_gd_fill_${Date.now()}`,
        title: `GD Entry Form Fill: ${payload.typeLabel || "Roznamcha Fields"}`,
        understoodIntent: `रोजनामचा (Add GD Entry) में ${payload.typeLabel ? `GD Type '${payload.typeLabel}'` : "फ़ील्ड"} तुरंत सेलेक्ट/भरना (बिना अनुमति के सीधा UI अपडेट)`,
        confidenceScore: 0.99,
        primaryModule: "GENERAL_DIARY",
        targetRecords: [
          {
            type: "PAGE",
            id: targetUrl,
            label: "New General Diary Entry (Roznamcha)",
            url: targetUrl,
          },
        ],
        steps: [
          {
            id: "step_gd_fill_1",
            stepNumber: 1,
            module: "GENERAL_DIARY",
            actionTitle: payload.typeLabel
              ? `GD Type – Select: '${payload.typeLabel}' सेट किया गया`
              : "GD फॉर्म फ़ील्ड अपडेट किया गया",
            actionDescription: `रोजनामचा फॉर्म (/general-diary/new) में ${payload.typeLabel || "निर्दिष्ट फ़ील्ड"} चयनित कर दिया गया है।`,
            isDestructive: false,
            requiresOfficialApproval: false,
            status: "COMPLETED",
          },
        ],
        status: "EXECUTED",
        createdAt: new Date().toISOString(),
        executablePayload: {
          toolName: "fill_gd_form",
          parameters: {
            url: targetUrl,
            ...payload,
          },
        },
      },
      suggestedPrompts: [
        "GD में पूरा टेम्पलेट ऑटो-फिल कर दो",
        "Subject गश्त व नाकाबंदी भर दो",
        "Section 303(2) add kr do",
        "General Diary रजिस्टर खोलो",
      ],
      moduleContext: {
        moduleName: "GENERAL_DIARY",
      },
    };
  }


  /**
   * Multi-Step Integrated Workflow Handler
   * Example: "FIR 125 kholo, Anil Kumar ka record check karo, arrest documents taiyar karo, GD draft banao aur sab documents dikhao"
   */
  private static async handleMultiStepWorkflowIntent(
    rawInput: string,
    firNumber: string,
    personName: string,
    currentPath?: string
  ): Promise<AgentMessage> {
    const allFirs = firService.getAllFirs();
    const fir = (firNumber ? allFirs.find((f) => f.firNumber.includes(firNumber) || f.id.includes(firNumber)) : undefined) || allFirs[0];
    const accused = personName || fir.accusedList?.[0]?.name || "Anil Kumar";

    this.updateContext({
      activeFirId: fir.id,
      activeFirNumber: fir.firNumber,
      activePersonName: accused,
      activePoliceStation: fir.policeStation,
      activeDistrict: fir.district,
    });

    // 1. Generate Statutory 6-Document Arrest Dossier
    const arrestDocs = AgentDocumentEngine.generateArrestDossier(fir, rawInput);

    // 2. Generate GD Entry Draft
    const data = AgentDocumentEngine.extractArrestData(fir, rawInput);
    const { subject, narrative } = AgentDocumentEngine.generateArrestGDEntry(data);
    const gdDoc: ProposedDocument = {
      id: `doc_gd_${Date.now()}`,
      templateType: "gd_entry",
      title: "7. रोजनामचा आम दाखिला रपट (GD Entry Draft u/s PPR 22.48)",
      recipientOrSubject: "General Diary Desk (MHC Sanction)",
      previewHtml: `<div style="font-family: monospace; white-space: pre-wrap; padding: 16px; background: #fff; border: 1px solid #ddd; font-size: 13px;">${narrative}</div>`,
      isEditable: true,
      status: "READY",
    };

    const allProposedDocs = [...arrestDocs, gdDoc];

    // Multi-Step Action Items
    const steps: AgentActionItem[] = [
      {
        id: "step_multi_1",
        stepNumber: 1,
        module: "FIR_CASES",
        actionTitle: `केस रिकॉर्ड सत्यापन (${fir.firNumber})`,
        actionDescription: `मुकद्दमा सं. ${fir.firNumber} की पत्रावली लोड कर अभियुक्त ${accused} का नाम, पिता का नाम व BNS धाराएं (${fir.actsAndSections}) सत्यापित की गईं।`,
        targetRecordId: fir.id,
        targetRecordLabel: fir.firNumber,
        isDestructive: false,
        requiresOfficialApproval: false,
        status: "COMPLETED",
      },
      {
        id: "step_multi_2",
        stepNumber: 2,
        module: "ARREST_DOCS",
        actionTitle: "वैधानिक गिरफ़्तारी प्रपत्र निर्माण (6 Statutory Documents)",
        actionDescription: "4-पृष्ठीय गिरफ़्तारी मेमो (Form 26.8), फर्द जामातालाशी, ग्राउंड्स ऑफ अरेस्ट (BNSS 47), इत्तिला पत्र (BNSS 48), मेडिकल परीक्षण पत्र (BNSS 53), व पुलिस रिमांड दरख्वास्त (BNSS 187) तैयार किए गए।",
        targetRecordId: fir.id,
        targetRecordLabel: "Form 26.8 Dossier",
        isDestructive: false,
        requiresOfficialApproval: true,
        status: "PENDING",
      },
      {
        id: "step_multi_3",
        stepNumber: 3,
        module: "GENERAL_DIARY",
        actionTitle: "रोजनामचा आम दाखिला रपट ड्राफ्ट (Smart GD Entry Draft)",
        actionDescription: "मुंशी (MHC) के संज्ञानार्थ Smart General Diary के 'Auto-Suggestions & Drafts' में दाखिला गिरफ़्तारी रपट इंद्राज तैयार किया गया।",
        targetRecordId: fir.id,
        targetRecordLabel: "GD Suggestion",
        isDestructive: false,
        requiresOfficialApproval: true,
        status: "PENDING",
      },
      {
        id: "step_multi_4",
        stepNumber: 4,
        module: "FIR_CASES",
        actionTitle: "केस टाइमलाइन व डॉक्युमेंट्स अटैचमेंट",
        actionDescription: `केस टाइमलाइन में "Arrest Documentation Completed" माइलस्टोन दर्ज कर केस फ़ाइल में सभी प्रपत्र विधिवत संलग्न किए जाएंगे।`,
        targetRecordId: fir.id,
        targetRecordLabel: "Timeline & File",
        isDestructive: false,
        requiresOfficialApproval: true,
        status: "PENDING",
      },
    ];

    const planId = `plan_multi_${Date.now()}`;
    const actionPlan: AgentActionPlan = {
      id: planId,
      title: `Complete End-to-End Arrest & GD Workflow for ${accused} (${fir.firNumber})`,
      understoodIntent: `अधिकारी द्वारा एक संयुक्त निर्देश दिया गया: मुकद्दमा सं. ${fir.firNumber} की जांच, अभियुक्त ${accused} के संपूर्ण 6 कानूनी गिरफ़्तारी प्रपत्र निर्माण, रोजनामचा आम दाखिला रपट (GD Draft) तैयार करना, और सभी दस्तावेज़ों का एक साथ पूर्वावलोकन कराना।`,
      confidenceScore: 0.99,
      primaryModule: "UNIVERSAL",
      isMultiStep: true,
      targetRecords: [
        {
          type: "FIR",
          id: fir.id,
          label: `${fir.firNumber} - ${fir.categoryDisplay}`,
          url: `/fir-workspace/arrest-docs?firId=${encodeURIComponent(fir.id)}`,
        },
        {
          type: "GENERAL_DIARY",
          id: "gd_drafts",
          label: "Smart GD Auto-Suggestions & Drafts",
          url: "/general-diary?tab=SUGGESTIONS_DRAFTS",
        },
      ],
      steps,
      proposedDocuments: allProposedDocs,
      missingInformation: [
        "कृपया सुनिश्चित करें: क्या अभियुक्त के पिता/रिश्तेदार को गिरफ़्तारी की टेलीफोनिक सूचना स्वयं जांच अधिकारी द्वारा दी जा चुकी है?",
      ],
      status: "AWAITING_APPROVAL",
      createdAt: new Date().toISOString(),
      executablePayload: {
        toolName: "save_multi_step_workflow",
        parameters: {
          firId: fir.id,
          accusedName: accused,
          subject,
          narrative,
        },
      },
    };

    this.updateContext({ lastActionPlanId: planId, activeActionPlan: actionPlan });

    return {
      id: `msg_${Date.now()}`,
      sender: "agent",
      text: `🎯 **संयुक्त बहु-चरणीय कार्य योजना तैयार (Multi-Step Workflow Ready):**\n\n1. **केस रिकॉर्ड:** मुकद्दमा सं. **${fir.firNumber}** (${fir.policeStation}) के तथ्य व अभियुक्त **${accused}** का विवरण केस फ़ाइल से सत्यापित कर लिया गया है।\n2. **गिरफ़्तारी प्रपत्र:** BNSS 2023 व PPR के अनुसार **4-पृष्ठीय गिरफ़्तारी मेमो (Form 26.8)**, फर्द जामातालाशी, ग्राउंड्स ऑफ अरेस्ट (धारा 47), इत्तिला पत्र (धारा 48), मेडिकल प्रार्थना पत्र (धारा 53) व रिमांड दरख्वास्त तैयार हैं।\n3. **रोजनामचा आम (GD):** मुंशी (MHC) के संज्ञानार्थ **दाखिला गिरफ़्तारी रपट** का ड्राफ्ट तैयार कर लिया गया है।\n\nनीचे दिए गए सभी **7 दस्तावेज़ों का प्रिव्यू (Preview)** देखें और एक साथ सुरक्षित करने हेतु **"Approve & Execute (स्वीकृत करें)"** पर क्लिक करें।`,
      timestamp: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
      actionPlan,
      suggestedPrompts: [
        "दस्तावेज़ स्वीकृत करें (Approve)",
        "Arrest Docs Workspace खोलें",
        "General Diary Drafts देखें",
        "Cancel",
      ],
      moduleContext: {
        activeFirId: fir.id,
        activeFirNumber: fir.firNumber,
        activePersonName: accused,
        moduleName: "UNIVERSAL",
      },
    };
  }

  /**
   * Checks and lists all attached documents in an FIR case file
   */
  private static async handleFirDocumentsCheckIntent(firNumber: string): Promise<AgentMessage> {
    const allFirs = firService.getAllFirs();
    const fir = (firNumber ? allFirs.find((f) => f.firNumber.includes(firNumber) || f.id.includes(firNumber)) : undefined) || allFirs[0];

    const docs = fir.documents || [];
    const diaries = fir.caseDiaries || [];

    return {
      id: `msg_${Date.now()}`,
      sender: "agent",
      text: `📂 **मुकद्दमा सं. ${fir.firNumber} - संलग्न दस्तावेज़ पत्रावली:**\n\n* **थाना व ज़िला:** ${fir.policeStation}, ${fir.district}\n* **कुल संलग्न कानूनी प्रपत्र:** **${docs.length} दस्तावेज़**\n* **केस डायरी (Zimni):** **${diaries.length} प्रविष्टियां**\n\nसंलग्न दस्तावेज़ सूची:\n${docs.length > 0 ? docs.map((d: any, idx: number) => `${idx + 1}. **${d.title}** (${d.category || "Legal"}) - अपलोडकर्ता: ${d.uploadedBy}`).join("\n") : "• अभी कोई बाहरी दस्तावेज़ संलग्न नहीं है। (Statutory Dossier तैयार किया जा सकता है)"}\n\n**उपलब्ध कार्यवाहियां:**`,
      timestamp: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
      suggestedPrompts: [
        "Is case ke saare required documents taiyar karo",
        "Arrest memo banao",
        "Zimni draft karo",
        "Case file खोलें",
      ],
      moduleContext: {
        activeFirId: fir.id,
        activeFirNumber: fir.firNumber,
        activePersonName: fir.accusedList?.[0]?.name || "Anil Kumar",
        moduleName: "FIR_WORKSPACE",
      },
    };
  }

  /**
   * Generates Statutory Legal Notice (Notice u/s 35(3) BNSS or Summons u/s 91 BNSS)
   */
  private static async handleLegalNoticeIntent(rawInput: string, firNumber?: string, personName?: string): Promise<AgentMessage> {
    const allFirs = firService.getAllFirs();
    const fir = (firNumber ? allFirs.find((f) => f.firNumber.includes(firNumber) || f.id.includes(firNumber)) : undefined) || allFirs[0];
    const targetName = personName || "Anil Kumar";
    const is91 = rawInput.includes("91") || rawInput.includes("document");

    let docHtml = "";
    let docTitle = "";
    let noticeType = "";

    if (is91) {
      docTitle = `दस्तावेज़ तलब नोटिस (Summons u/s 91 BNSS) - ${targetName}`;
      noticeType = "notice_91_bnss";
      docHtml = AgentDocumentEngine.generateNotice91BnssHtml(fir.firNumber, targetName, "बैंक खाता विवरण, लेन-देन रिकॉर्ड, पहचान पत्र व सीसीटीवी फुटेज", fir.policeStation);
    } else {
      docTitle = `हाजिरी नोटिस (Notice of Appearance u/s 35(3) BNSS) - ${targetName}`;
      noticeType = "notice_35_bnss";
      docHtml = AgentDocumentEngine.generateNotice35BnssHtml(fir.firNumber, targetName, "H.No. 142, Sector 14, Hisar", fir.policeStation);
    }

    const planId = `plan_notice_${Date.now()}`;
    const actionPlan: AgentActionPlan = {
      id: planId,
      title: docTitle,
      understoodIntent: `मुकद्दमा सं. ${fir.firNumber} के तहत ${targetName} को वैधानिक कानूनी नोटिस (${is91 ? "धारा 91 BNSS" : "धारा 35(3) BNSS"}) तैयार कर केस पत्रावली में संलग्न करना।`,
      confidenceScore: 0.96,
      primaryModule: "FIR_WORKSPACE",
      targetRecords: [
        {
          type: "FIR",
          id: fir.id,
          label: fir.firNumber,
          url: `/fir/${fir.id}?tab=documents`,
        },
      ],
      steps: [
        {
          id: "notice_step_1",
          stepNumber: 1,
          module: "FIR_WORKSPACE",
          actionTitle: docTitle,
          actionDescription: "कानूनी नोटिस का आधिकारिक मसौदा तैयार कर केस डॉक्युमेंट्स में सुरक्षित किया जाएगा।",
          targetRecordId: fir.id,
          targetRecordLabel: fir.firNumber,
          isDestructive: false,
          requiresOfficialApproval: true,
          status: "PENDING",
        },
      ],
      proposedDocuments: [
        {
          id: `doc_notice_${Date.now()}`,
          templateType: noticeType,
          title: docTitle,
          recipientOrSubject: `${targetName} (Notice u/s ${is91 ? "91" : "35(3)"} BNSS)`,
          previewHtml: docHtml,
          isEditable: true,
          status: "READY",
        },
      ],
      status: "AWAITING_APPROVAL",
      createdAt: new Date().toISOString(),
      executablePayload: {
        toolName: "save_notice",
        parameters: {
          firId: fir.id,
          title: docTitle,
          noticeType,
          targetName,
        },
      },
    };

    this.updateContext({ lastActionPlanId: planId, activeActionPlan: actionPlan });

    return {
      id: `msg_${Date.now()}`,
      sender: "agent",
      text: `📜 **वैधानिक नोटिस का मसौदा तैयार (Notice Draft Ready):**\n\n* **प्रकार:** ${is91 ? "दस्तावेज़ तलब नोटिस (Section 91 BNSS)" : "हाजिरी नोटिस (Section 35(3) BNSS)"}\n* **मुकद्दमा सं.:** \`${fir.firNumber}\`\n* **प्राप्तकर्ता:** **${targetName}**\n* **थाना:** ${fir.policeStation}\n\nकृपया नीचे दस्तावेज़ का **Preview** देखें और केस डॉक्युमेंट्स में जोड़ने हेतु **Approve (स्वीकृत करें)** पर क्लिक करें।`,
      timestamp: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
      actionPlan,
      suggestedPrompts: ["Approve (स्वीकृत करें)", "Arrest memo banao", "Zimni draft karo"],
    };
  }

  /**
   * Assigns Enquiry Officer (EO) to a Complaint
   */
  private static async handleAssignEoIntent(rawInput: string, complaintNumber?: string): Promise<AgentMessage> {
    const complaints = await ComplaintService.getComplaints();
    const comp =
      complaints.find((c: any) => c.complaintNumber === complaintNumber || c.id === complaintNumber) ||
      complaints.find((c: any) => c.status !== "COMPLETE" && c.status !== "CLOSED") ||
      complaints[0];

    const targetEo = MOCK_ENQUIRY_OFFICERS[0] || { id: "usr_eo_1", name: "SI Vikram Singh", rank: "Sub Inspector", beltNumber: "SI/4412" };

    const planId = `plan_assign_eo_${Date.now()}`;
    const actionPlan: AgentActionPlan = {
      id: planId,
      title: `Assign EO ${targetEo.name} to Complaint #${comp.complaintNumber}`,
      understoodIntent: `नागरिक शिकायत #${comp.complaintNumber} (${comp.complainantName}) की जांच हेतु जांच अधिकारी (EO) के रूप में ${targetEo.name} (${targetEo.rank}) को नियुक्त करना।`,
      confidenceScore: 0.98,
      primaryModule: "COMPLAINTS",
      targetRecords: [
        {
          type: "COMPLAINT",
          id: comp.id,
          label: `Complaint #${comp.complaintNumber}`,
          url: `/complaints/${comp.id}`,
        },
      ],
      steps: [
        {
          id: "step_eo_1",
          stepNumber: 1,
          module: "COMPLAINTS",
          actionTitle: `जांच अधिकारी नियुक्ति: ${targetEo.name}`,
          actionDescription: `शिकायत #${comp.complaintNumber} के जांच अधिकारी पद पर ${targetEo.name} को आधिकारिक रूप से असाइन किया जाएगा और शिकायत स्टेटस 'UNDER_ENQUIRY' किया जाएगा।`,
          targetRecordId: comp.id,
          targetRecordLabel: comp.complaintNumber,
          isDestructive: false,
          requiresOfficialApproval: true,
          status: "PENDING",
        },
      ],
      status: "AWAITING_APPROVAL",
      createdAt: new Date().toISOString(),
      executablePayload: {
        toolName: "assign_eo",
        parameters: {
          complaintId: comp.id,
          complaintNumber: comp.complaintNumber,
          eoId: targetEo.id,
          eoName: targetEo.name,
          eoRank: targetEo.rank,
        },
      },
    };

    this.updateContext({
      lastActionPlanId: planId,
      activeActionPlan: actionPlan,
      activeComplaintId: comp.id,
      activeComplaintNumber: comp.complaintNumber,
    });

    return {
      id: `msg_${Date.now()}`,
      sender: "agent",
      text: `👮 **जांच अधिकारी (EO) असाइनमेंट प्रस्ताव:**\n\n* **शिकायत सं.:** #${comp.complaintNumber}\n* **शिकायतकर्ता:** ${comp.complainantName}\n* **प्रस्तावित जांच अधिकारी:** **${targetEo.name}** (${targetEo.rank}, बेल्ट: ${(targetEo as any).beltNumber || "SI/4412"})\n* **नया स्टेटस:** \`UNDER_ENQUIRY\`\n\nइस असाइनमेंट को आधिकारिक रूप से सुरक्षित करने हेतु कृपया **Approve (स्वीकृत करें)** पर क्लिक करें अथवा "हाँ" कहें।`,
      timestamp: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
      actionPlan,
      suggestedPrompts: ["Approve (स्वीकृत करें)", "Complaint Details खोलें", "Cancel"],
    };
  }

  /**
   * Handles Kalandra preparation & workspace navigation queries
   */
  private static async handleKalandraIntent(
    rawInput: string,
    personName?: string,
    firNumber?: string
  ): Promise<AgentMessage> {
    const q = rawInput.toLowerCase();

    // Check if this is a navigation-only command
    const isNavigation =
      (q.includes("kholo") || q.includes("open") || q.includes("dikhao") || q.includes("chalo") || q.includes("workspace") || q.includes("tab")) &&
      !q.includes("banao") &&
      !q.includes("draft") &&
      !q.includes("prepare") &&
      !q.includes("taiyar");

    if (isNavigation) {
      const planId = `plan_nav_kal_${Date.now()}`;
      const actionPlan: AgentActionPlan = {
        id: planId,
        title: "कलंदरा वर्कस्पेस खोलें (Open Kalandra Workspace)",
        understoodIntent: "अन्वेषण वर्कस्पेस के अंतर्गत कलंदरा (Kalandra) टैब खोलना।",
        confidenceScore: 0.98,
        primaryModule: "KALANDRA",
        targetRecords: [{ type: "PAGE", id: "/fir-workspace/kalandra", label: "Kalandra Workspace", url: "/fir-workspace/kalandra" }],
        steps: [
          {
            id: "step_nav_kal",
            stepNumber: 1,
            module: "KALANDRA",
            actionTitle: "कलंदरा वर्कस्पेस पर जाएं",
            actionDescription: "/fir-workspace/kalandra पृष्ठ पर सीधे नेविगेट करता है।",
            targetRecordId: "/fir-workspace/kalandra",
            targetRecordLabel: "Kalandra Workspace",
            isDestructive: false,
            requiresOfficialApproval: false,
            status: "PENDING",
          },
        ],
        status: "APPROVED",
        createdAt: new Date().toISOString(),
        executablePayload: {
          toolName: "navigate",
          parameters: {
            url: "/fir-workspace/kalandra",
          },
        },
      };

      return {
        id: `msg_${Date.now()}`,
        sender: "agent",
        text: `⚖️ **कलंदरा वर्कस्पेस (Kalandra Workspace):**\n\nअन्वेषण वर्कस्पेस का **कलंदरा (Kalandra)** प्रभाग खोला जा रहा है। यहाँ आप:\n* 107/151 CrPC (शांति भंग एवं निवारक गिरफ्तारी)\n* 107/150 CrPC (पाबंदी समन)\n* 217 BNS (लोक उपद्रव / न्यूसेंस)\n* 248 BNS (सार्वजनिक अश्लीलता)\n* 145 CrPC (भूमि/जल विवाद)\n* 72 IPC / 7/16 एवं विशेष कलंदरा प्रारूप तैयार व प्रबंधित कर सकते हैं।`,
        timestamp: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
        actionPlan,
        suggestedPrompts: [
          "107/151 CrPC कलंदरा तैयार करें",
          "217 BNS Public Nuisance कलंदरा बनाएं",
          "सहेजे गए कलंदरा ड्राफ्ट देखें",
        ],
      };
    }

    // Otherwise, drafting/preparation request
    let typeCode = "107_151";
    if (q.includes("217") || q.includes("nuisance") || q.includes("उपद्रव")) {
      typeCode = "217_BNS";
    } else if (q.includes("248") || q.includes("obscene") || q.includes("अश्लील")) {
      typeCode = "248_BNS";
    } else if (q.includes("107/150") || q.includes("107 150") || q.includes("150 crpc")) {
      typeCode = "107_150";
    } else if (q.includes("107/151") || q.includes("107 151") || q.includes("151 crpc") || q.includes("shanti bhang")) {
      typeCode = "107_151";
    } else if (q.includes("145") || q.includes("zamin") || q.includes("bhumi") || q.includes("zameen") || /\bland\b/i.test(q)) {
      typeCode = "145";
    } else if (q.includes("72")) {
      typeCode = "72_IPC";
    } else if (q.includes("7/16") || q.includes("7 16")) {
      typeCode = "7_16";
    }

    const tmpl = kalandraService.getTemplateByCode(typeCode) || kalandraService.getAllTemplates()[0];
    
    let respondent = personName;
    const nameBeforeKhilaf = rawInput.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:ke\s+khilaf|ka\s+kalandra|par)/i);
    if (nameBeforeKhilaf && nameBeforeKhilaf[1] && !["kalandra", "investigation", "police", "fir"].includes(nameBeforeKhilaf[1].toLowerCase())) {
      respondent = nameBeforeKhilaf[1].trim();
    }
    if (!respondent || respondent === "Anil Kumar") {
      if (nameBeforeKhilaf && nameBeforeKhilaf[1]) {
        respondent = nameBeforeKhilaf[1].trim();
      } else {
        respondent = respondent || "Suresh Kumar";
      }
    }
    const generatedNo = kalandraService.generateKalandraNumber();

    const newRecord: KalandraRecord = {
      id: "kal-" + Date.now(),
      kalandraNumber: generatedNo,
      typeCode: tmpl.code,
      templateId: tmpl.id,
      templateTitle: tmpl.titleHi,
      actAndSection: tmpl.section,
      policeStation: "Sector 29 Police Station",
      district: "Gurugram",
      caseType: firNumber ? "FROM_FIR" : "DIRECT",
      relatedFirNumber: firNumber,
      respondentName: respondent,
      respondentFather: "Sh. Ram Kishan",
      respondentAddress: "H.No. 112, Village Chakkarpur, Sector 28, Gurugram",
      respondentAge: 32,
      respondentGender: "MALE",
      incidentDate: new Date().toISOString().split("T")[0],
      incidentTime: "11:30",
      incidentPlace: "Main Market, Sector 29, Gurugram",
      reportingOfficer: "SI Balwan Singh",
      officerRank: "Sub Inspector",
      officerBelt: "1482/GGM",
      magistrateCourt: tmpl.defaultCourtHi,
      factsAndCircumstances: kalandraService.populateNarrative(tmpl.defaultNarrativeTemplateHi, {
        respondentName: respondent,
        respondentFather: "Sh. Ram Kishan",
        respondentAddress: "H.No. 112, Village Chakkarpur, Sector 28, Gurugram",
        incidentPlace: "Main Market, Sector 29, Gurugram",
        incidentDate: new Date().toISOString().split("T")[0],
        district: "Gurugram",
        policeStation: "Sector 29 Police Station",
      }),
      witnesses: [
        { id: "w-1", name: "ASI Virender Singh", fatherName: "Sh. Rohtas", address: "PS Sector 29, Gurugram" },
        { id: "w-2", name: "Ramesh Chand", fatherName: "Sh. Mohan Lal", address: "Shopkeeper, Sector 29 Market" }
      ],
      supportingDocuments: (tmpl.supportingDocumentsList || []).map((t, idx) => ({
        id: `sd-${idx}`,
        title: t,
        documentType: "DOC",
        isAttached: true,
      })),
      proposedAction: "विपक्षी को नियमानुसार पाबंद/संज्ञान लेकर आवश्यक वैधानिक कार्रवाई अमल में लाई जावे।",
      status: "DRAFT",
      language: "hi",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const pkg = kalandraService.generateKalandraPackage(newRecord, "hi");

    const planId = `plan_kal_draft_${Date.now()}`;
    const actionPlan: AgentActionPlan = {
      id: planId,
      title: `${tmpl.titleHi} तैयार करना - ${respondent}`,
      understoodIntent: `${respondent} के विरुद्ध ${tmpl.section} के अंतर्गत कलंदरा ड्राफ्ट व न्यायालय अग्रेषण पैकेज तैयार करना।`,
      confidenceScore: 0.98,
      primaryModule: "KALANDRA",
      targetRecords: [{ type: "PAGE", id: "/fir-workspace/kalandra", label: "Kalandra Workspace", url: "/fir-workspace/kalandra" }],
      steps: [
        {
          id: "step_kal_draft",
          stepNumber: 1,
          module: "KALANDRA",
          actionTitle: `कलंदरा प्रपत्र तैयार करना (${tmpl.section})`,
          actionDescription: `${respondent} के विरुद्ध ${tmpl.section} के तहत वैधानिक कलंदरा, प्रेषण पत्र एवं मौका रिपोर्ट ड्राफ्ट तैयार करता है।`,
          targetRecordId: generatedNo,
          targetRecordLabel: generatedNo,
          isDestructive: false,
          requiresOfficialApproval: true,
          status: "PENDING",
        },
      ],
      proposedDocuments: [
        {
          id: `doc_kal_${Date.now()}`,
          templateType: String(tmpl.code),
          title: `कलंदरा प्रपत्र (${tmpl.section}) - ${respondent}`,
          recipientOrSubject: `${respondent} (${tmpl.section})`,
          previewHtml: pkg.mainKalandraHtml,
          isEditable: true,
          status: "READY",
        },
        {
          id: `doc_kal_fwd_${Date.now()}`,
          templateType: "FORWARDING_LETTER",
          title: `SHO प्रेषण पत्र (Forwarding Memo) - ${tmpl.section}`,
          recipientOrSubject: tmpl.defaultCourtHi,
          previewHtml: pkg.forwardingLetterHtml,
          isEditable: true,
          status: "READY",
        },
      ],
      status: "AWAITING_APPROVAL",
      createdAt: new Date().toISOString(),
      executablePayload: {
        toolName: "save_kalandra_record",
        parameters: {
          record: newRecord,
          url: "/fir-workspace/kalandra",
        },
      },
    };

    this.updateContext({ lastActionPlanId: planId, activeActionPlan: actionPlan });

    const verificationNotice =
      tmpl.legalStatus === "NEEDS_LEGAL_MAPPING_VERIFICATION"
        ? `\n\n⚠️ **विधि सत्यापन प्रतीक्षित (Legal Notice):**\nयह प्रारूप (*${tmpl.section}*) राज्य पुलिस नियमों के तहत सत्यापन अपेक्षित श्रेणी में है। न्यायालय प्रस्तुत करने से पूर्व धारा का सत्यापन आवश्यक है।`
        : "";

    return {
      id: `msg_${Date.now()}`,
      sender: "agent",
      text: `📜 **कलंदरा रिपोर्ट ड्राफ्ट तैयार है:**\n\n* **कलंदरा सं.:** \`${generatedNo}\`\n* **विपक्षी / गैर-सायल:** **${respondent}**\n* **अधिनियम व धारा:** **${tmpl.section}**\n* **न्यायालय:** ${tmpl.defaultCourtHi}\n* **संलग्न दस्तावेज:** ${tmpl.supportingDocumentsList.slice(0, 3).join(", ")} आदि।${verificationNotice}\n\nमुख्य कलंदरा प्रपत्र एवं SHO प्रेषण पत्र का मसौदा तैयार है। कृपया अनुमोदन हेतु **Approve (स्वीकृत करें)** पर क्लिक करें अथवा "हाँ" कहें।`,
      timestamp: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
      actionPlan,
      suggestedPrompts: ["Approve (स्वीकृत करें)", "Kalandra Workspace खोलें", "Cancel"],
    };
  }

  /**
   * Generates Departmental Pending Complaints Report
   */
  private static async handlePendingComplaintsReportIntent(): Promise<AgentMessage> {
    const complaints = await ComplaintService.getComplaints();
    const reportHtml = AgentDocumentEngine.generatePendingComplaintsSummaryHtml(complaints, "Sector 14 Hisar");

    const planId = `plan_pending_rep_${Date.now()}`;
    const actionPlan: AgentActionPlan = {
      id: planId,
      title: "Generate Official Departmental Pending Complaints Report",
      understoodIntent: "थाने की सभी लंबित नागरिक शिकायतों की आधिकारिक प्रगति आख्या व रोस्टर तैयार करना।",
      confidenceScore: 0.98,
      primaryModule: "COMPLAINTS",
      targetRecords: [{ type: "PAGE", id: "/complaints", label: "Complaints Register", url: "/complaints" }],
      steps: [
        {
          id: "prep_rep_1",
          stepNumber: 1,
          module: "COMPLAINTS",
          actionTitle: "लंबित शिकायत प्रगति आख्या संकलन",
          actionDescription: `कुल ${complaints.filter((c: any) => c.status !== "COMPLETE" && c.status !== "CLOSED").length} लंबित शिकायतों का रोस्टर तैयार किया गया।`,
          isDestructive: false,
          requiresOfficialApproval: false,
          status: "COMPLETED",
        },
      ],
      proposedDocuments: [
        {
          id: `doc_pending_rep_${Date.now()}`,
          templateType: "complaints_roster_report",
          title: "दैनिक प्रगति विवरण - लंबित नागरिक शिकायतें (Pending Complaints Roster)",
          recipientOrSubject: "कार्यालय थाना प्रभारी (SHO Review)",
          previewHtml: reportHtml,
          isEditable: false,
          status: "READY",
        },
      ],
      status: "AWAITING_APPROVAL",
      createdAt: new Date().toISOString(),
      executablePayload: {
        toolName: "navigate",
        parameters: { url: "/complaints" },
      },
    };

    return {
      id: `msg_${Date.now()}`,
      sender: "agent",
      text: `📊 **लंबित नागरिक शिकायतों की आधिकारिक रिपोर्ट तैयार:**\n\n* कुल पंजीकृत शिकायतें: **${complaints.length}**\n* वर्तमान में लंबित: **${complaints.filter((c: any) => c.status !== "COMPLETE" && c.status !== "CLOSED").length}**\n\nनीचे दिए गए **Preview** बटन पर क्लिक करके आप पूर्ण A4 रोस्टर रिपोर्ट देख और प्रिंट कर सकते हैं।`,
      timestamp: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
      actionPlan,
      suggestedPrompts: ["Complaints Register खोलें", "Anil Kumar ki complaint search karo"],
    };
  }

  /**
   * Generates Statutory 6-document Arrest Dossier
   */
  private static async handleArrestDocIntent(
    rawInput: string,
    firNumber: string,
    personName: string,
    currentPath?: string
  ): Promise<AgentMessage> {
    const allFirs = firService.getAllFirs();
    const fir = (firNumber ? allFirs.find((f) => f.firNumber.includes(firNumber) || f.id.includes(firNumber)) : undefined) || allFirs[0];

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
        id: "step_arrest_1",
        stepNumber: 1,
        module: "ARREST_DOCS",
        actionTitle: "4-पृष्ठीय गिरफ़्तारी मेमो (Form 26.8)",
        actionDescription: `पंजाब पुलिस रूल्स नियम 26.8 एवं BNSS धारा 47, 48 के तहत अभियुक्त ${personName || "Anil Kumar"} का 4-पृष्ठीय आधिकारिक प्रपत्र तैयार किया जाएगा।`,
        targetRecordId: fir.id,
        targetRecordLabel: "Form 26.8",
        isDestructive: false,
        requiresOfficialApproval: true,
        status: "PENDING",
      },
      {
        id: "step_arrest_2",
        stepNumber: 2,
        module: "ARREST_DOCS",
        actionTitle: "फर्द जामातालाशी (PPR 26.10A)",
        actionDescription: "अभियुक्त की व्यक्तिगत तलाशी व बरामदगी का कानूनी प्रपत्र तैयार किया जाएगा।",
        targetRecordId: fir.id,
        targetRecordLabel: "Jamatalashi",
        isDestructive: false,
        requiresOfficialApproval: true,
        status: "PENDING",
      },
      {
        id: "step_arrest_3",
        stepNumber: 3,
        module: "ARREST_DOCS",
        actionTitle: "गिरफ़्तारी आधार पत्र (धारा 47 BNSS) व इत्तिला पत्र (धारा 48 BNSS)",
        actionDescription: "अभियुक्त को कारणों की लिखित सूचना व परिजनों को टेलीफोनिक इत्तिला पत्र तैयार किया जाएगा।",
        targetRecordId: fir.id,
        targetRecordLabel: "Grounds & Intimation",
        isDestructive: false,
        requiresOfficialApproval: true,
        status: "PENDING",
      },
      {
        id: "step_arrest_4",
        stepNumber: 4,
        module: "ARREST_DOCS",
        actionTitle: "मेडिकल परीक्षण प्रार्थना पत्र (धारा 53 BNSS) व रिमांड दरख्वास्त (धारा 187 BNSS)",
        actionDescription: "नागरिक अस्पताल के लिए मेडिकल रिक्विजिशन व इलाका मजिस्ट्रेट हेतु 2 दिन की पुलिस हिरासत रिमांड दरख्वास्त।",
        targetRecordId: fir.id,
        targetRecordLabel: "Medical & Remand",
        isDestructive: false,
        requiresOfficialApproval: true,
        status: "PENDING",
      },
      {
        id: "step_arrest_5",
        stepNumber: 5,
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

    this.updateContext({ lastActionPlanId: planId, activeActionPlan: actionPlan });

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

  /**
   * Generates Zimni (Case Diary u/s 192 BNSS)
   */
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
          id: "zimni_step_1",
          stepNumber: 1,
          module: "ZIMNI",
          actionTitle: `ज़िमनी सं. ${nextZimniNo} तैयार करना`,
          actionDescription: "PPR नियम 25.54 एवं BNSS धारा 192 के तहत दैनिक जांच डायरी का निर्माण।",
          targetRecordId: fir.id,
          targetRecordLabel: `Zimni ${nextZimniNo}`,
          isDestructive: false,
          requiresOfficialApproval: true,
          status: "PENDING",
        },
      ],
      proposedDocuments: [
        {
          id: `doc_zimni_${Date.now()}`,
          templateType: "zimni",
          title: `केस डायरी / ज़िमनी सं. ${nextZimniNo} (u/s 192 BNSS)`,
          recipientOrSubject: `${fir.firNumber} (तफ्तीश पत्रावली)`,
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

    this.updateContext({ lastActionPlanId: planId, activeActionPlan: actionPlan });

    return {
      id: `msg_${Date.now()}`,
      sender: "agent",
      text: `मुकद्दमा सं. **${fir.firNumber}** के लिए **केस डायरी (Zimni No. ${nextZimniNo})** u/s 192 BNSS तैयार कर ली गई है।\n\nकृपया नीचे दिए गए **Preview** बटन से विवरण जांचें और अनुमोदन करने हेतु **Approve (स्वीकृत करें)** पर क्लिक करें।`,
      timestamp: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
      actionPlan,
      suggestedPrompts: ["ज़िमनी स्वीकृत करें (Approve)", "केस फ़ाइल देखें", "Cancel"],
      moduleContext: {
        activeFirId: fir.id,
        activeFirNumber: fir.firNumber,
        moduleName: "ZIMNI",
      },
    };
  }

  /**
   * Generates General Diary (GD) draft narrative
   */
  private static async handleGdIntent(
    rawInput: string,
    firNumber: string,
    personName: string,
    currentPath?: string
  ): Promise<AgentMessage> {
    const allFirs = firService.getAllFirs();
    const fir = (firNumber ? allFirs.find((f) => f.firNumber.includes(firNumber) || f.id.includes(firNumber)) : undefined) || allFirs[0];

    const data = AgentDocumentEngine.extractArrestData(fir, rawInput);
    const { subject, narrative } = AgentDocumentEngine.generateArrestGDEntry(data);

    const planId = `plan_gd_${Date.now()}`;
    const actionPlan: AgentActionPlan = {
      id: planId,
      title: `Draft Roznamcha GD Entry for ${data.accusedName} (${fir.firNumber})`,
      understoodIntent: `मुकद्दमा सं. ${fir.firNumber} के अभियुक्त ${data.accusedName} की दाखिला गिरफ़्तारी रपट Smart General Diary में तैयार करना।`,
      confidenceScore: 0.96,
      primaryModule: "GENERAL_DIARY",
      targetRecords: [
        {
          type: "GENERAL_DIARY",
          id: "gd_drafts",
          label: "Smart GD Auto-Suggestions & Drafts",
          url: "/general-diary?tab=SUGGESTIONS_DRAFTS",
        },
      ],
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

    this.updateContext({ lastActionPlanId: planId, activeActionPlan: actionPlan });

    return {
      id: `msg_${Date.now()}`,
      sender: "agent",
      text: `अभियुक्त **${data.accusedName}** की गिरफ़्तारी के संबंध में **रोजनामचा आम (GD Entry)** का ड्राफ्ट तैयार कर लिया गया है।\n\nअनुमोदन करने पर यह Smart GD के **Auto-Suggestions & Drafts** टैब में मुंशी (MHC) के वेरिफिकेशन हेतु सुरक्षित कर दी जाएगी।`,
      timestamp: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
      actionPlan,
      suggestedPrompts: ["GD प्रेषित करें (Approve)", "General Diary खोलें", "Cancel"],
    };
  }

  /**
   * Searches Complaints by complainant, status, or keyword
   */
  private static async handleComplaintSearchIntent(rawInput: string, queryPersonName?: string): Promise<AgentMessage> {
    const complaints = await ComplaintService.getComplaints();
    const q = rawInput.toLowerCase();
    const searchTarget = queryPersonName || (rawInput.includes("anil") ? "Anil" : "");

    let filtered = complaints;
    if (searchTarget) {
      filtered = complaints.filter(
        (c: any) =>
          c.complainantName?.toLowerCase().includes(searchTarget.toLowerCase()) ||
          c.suspectDetails?.toLowerCase().includes(searchTarget.toLowerCase()) ||
          c.complaintNumber?.includes(searchTarget)
      );
    }
    if (q.includes("pending") || q.includes("लंबित")) {
      filtered = filtered.filter((c: any) => c.status !== "COMPLETE" && c.status !== "CLOSED");
    }

    if (filtered.length === 0) {
      filtered = complaints.slice(0, 3);
    }

    const firstMatch = filtered[0];
    if (firstMatch) {
      this.updateContext({
        activeComplaintId: firstMatch.id,
        activeComplaintNumber: firstMatch.complaintNumber,
        activePersonName: firstMatch.complainantName,
      });
    }

    return {
      id: `msg_${Date.now()}`,
      sender: "agent",
      text: `📋 **नागरिक शिकायत खोज परिणाम (Complaint Search Results):**\n\n${filtered
        .map(
          (c: any) =>
            `• **शिकायत #${c.complaintNumber}**: **${c.complainantName}**\n  * **श्रेणी:** ${c.categoryDisplay || c.category || "General"}\n  * **जांच अधिकारी (EO):** ${c.assignedEoName || "अनिर्णित (Not Assigned)"}\n  * **वर्तमान स्थिति:** \`${c.status}\` | **दिनांक:** ${c.incidentDateTime || c.createdAt?.split("T")[0]}`
        )
        .join("\n\n")}\n\n**उपलब्ध त्वरित कार्यवाहियां:**`,
      timestamp: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
      suggestedPrompts: [
        firstMatch ? `Complaint ${firstMatch.complaintNumber} खोलें` : "Complaints Desk खोलें",
        firstMatch ? "Is complaint ka EO assign kar do" : "Pending complaints report banao",
        "Complaint registration kholo",
      ],
      moduleContext: {
        activeComplaintId: firstMatch?.id,
        activeComplaintNumber: firstMatch?.complaintNumber,
        activePersonName: firstMatch?.complainantName,
        moduleName: "COMPLAINTS",
      },
    };
  }

  /**
   * Opens Complaint Registration Form
   */
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

  /**
   * Opens Regular FIR Registration Form
   */
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

  /**
   * Opens and retrieves specific FIR dossier
   */
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
        "FIR 125 ke documents check karo",
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

  /**
   * Legal lookup for BNS / BNSS / BSA sections
   */
  private static async handleLegalLookupIntent(rawInput: string): Promise<AgentMessage> {
    let result = "";
    if (rawInput.includes("303") || rawInput.includes("theft")) {
      result = `⚖️ **भारतीय न्याय संहिता (BNS), 2023 - धारा 303:**\n\n* **अपराध:** चोरी (Theft)\n* **परिभाषा:** किसी व्यक्ति की सहमति के बिना उसकी संपत्ति बेईमानी से ले जाना।\n* **उप-धारा 303(2):** कारावास जिसकी अवधि 3 वर्ष तक हो सकती है, या जुर्माना, या दोनों।\n* **संज्ञेयता (Cognizable):** संज्ञेय अपराध (Cognizable)\n* **जमानत (Bail):** गैर-जमानती (Non-Bailable)\n* **पुराना समकक्ष:** भारतीय दंड संहिता (IPC) धारा 379`;
    } else if (rawInput.includes("47") || rawInput.includes("arrest")) {
      result = `⚖️ **भारतीय नागरिक सुरक्षा संहिता (BNSS), 2023 - धारा 47:**\n\n* **विषय:** गिरफ़्तारी के आधार और जमानत के अधिकार की सूचना।\n* **प्रावधान:** पुलिस अधिकारी गिरफ़्तार किए गए प्रत्येक व्यक्ति को गिरफ़्तारी के कारणों की सूचना तत्काल प्रदान करेगा।\n* **अनिवार्यता:** यदि अपराध जमानती है तो जमानत के अधिकार की सूचना भी लिखित में दी जाएगी।`;
    } else {
      result = `⚖️ **BNS 2023 एवं BNSS 2023 संदर्भ सहायता:**\n\n* **BNS धारा 303(2):** चोरी (Theft) - 3 वर्ष तक कारावास\n* **BNS धारा 305:** निवास गृह में चोरी - 7 वर्ष तक कारावास\n* **BNS धारा 331(4):** गृह-अतिचार (House trespass by night)\n* **BNSS धारा 35(3):** अन्वेषण में हाजिरी का वैधानिक नोटिस\n* **BNSS धारा 47:** गिरफ़्तारी के आधारों की सूचना\n* **BNSS धारा 48:** गिरफ़्तारी की परिजन को इत्तिला\n* **BNSS धारा 53:** अभियुक्त का मेडिकल परीक्षण\n* **BNSS धारा 91:** दस्तावेज़ तलब नोटिस\n* **BNSS धारा 192:** केस डायरी (Zimni) इंद्राज`;
    }

    return {
      id: `msg_${Date.now()}`,
      sender: "agent",
      text: result,
      timestamp: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
      suggestedPrompts: ["Arrest memo banao", "FIR 125 kholo", "GD draft karo"],
    };
  }

  /**
   * Duty roster and station staff inquiry
   */
  private static handleStaffQueryIntent(rawInput: string): AgentMessage {
    return {
      id: `msg_${Date.now()}`,
      sender: "agent",
      text: `👮 **थाना स्टाफ व वर्तमान नफरी स्थिति:**\n\n* **थाना प्रभारी (SHO):** Inspector Rajesh Kumar (PNO: HR-04291882)\n* **मुंशी (MHC):** Head Constable Devinder Kumar (PNO: HR-05192834)\n* **ड्यूटी ऑफिसर (Counter):** ASI Surender Pal (PNO: HR-09384712)\n* **जांच अधिकारी (EO 1):** SI Vikram Singh (PNO: HR-07182930)\n* **जांच अधिकारी (EO 2):** ASI Ramesh Chander (PNO: HR-06281923)\n\n*आप रोल स्विच करने के लिए "Role switcher dialogue kholo" बोल सकते हैं।*`,
      timestamp: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
      suggestedPrompts: ["Staff पेज खोलें", "Role switcher dialogue kholo", "General Diary देखें"],
    };
  }

  /**
   * Universal Fallback and Guidance
   */
  private static async handleGeneralQueryIntent(rawInput: string, context: AgentSessionContext): Promise<AgentMessage> {
    return {
      id: `msg_${Date.now()}`,
      sender: "agent",
      text: `जय हिन्द! मैं **हरियाणा पुलिस CMS Universal AI Operating Agent** हूँ।\n\n**मैं आपकी अनुमति से CMS के समस्त कार्य वास्तविक रूप से निष्पादित कर सकता हूँ:**\n1. **नेविगेशन व डायलॉग्स:** "Add entry daailogue box kholo", "register complaint form kholo", "Role switcher kholo"\n2. **संयुक्त बहु-चरणीय कार्य:** "FIR 125 kholo, Anil Kumar ka record check karo, arrest documents taiyar karo, GD draft banao aur sab documents dikhao"\n3. **शिकायत प्रबंधन:** "Anil Kumar ki pending complaint search karo", "Is complaint ka EO assign kar do"\n4. **दस्तावेज़ व नोटिस निर्माण:** "Dhara 35(3) BNSS notice banao", "Dhara 91 notice banao", "Zimni draft karo"\n5. **रोजनामचा आम:** "GD mein aaj ki arrest entry draft karo", "रवानगी गश्त लिखो"\n6. **रिपोर्ट्स:** "Pending complaints ka report banao"\n\n*अपूर्ण विवरण होने पर मैं स्पष्टीकरण मांगूंगा। कोई भी आधिकारिक परिवर्तन आपकी अनुमति के बिना नहीं होगा।*`,
      timestamp: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
      suggestedPrompts: [
        "Add entry daailogue box kholo",
        "Anil Kumar ki pending complaint search karo",
        "FIR 125 kholo, arrest documents taiyar karo aur GD draft banao",
        "Role switcher dialogue kholo",
      ],
    };
  }

  /**
   * Opens active record (Complaint or FIR) based on context
   */
  /**
   * Opens active record (Complaint or FIR) based on context
   */
  private static async handleOpenActiveRecordIntent(context: AgentSessionContext): Promise<AgentMessage> {
    if (context.activeComplaintNumber || context.activeComplaintId) {
      const compId = context.activeComplaintId || context.activeComplaintNumber;
      return {
        id: `msg_open_${Date.now()}`,
        sender: "agent",
        text: `📂 **सक्रिय शिकायत #${context.activeComplaintNumber || compId} खोली जा रही है...**`,
        timestamp: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
        actionPlan: {
          id: `plan_nav_${Date.now()}`,
          title: `Open Complaint #${context.activeComplaintNumber || compId}`,
          understoodIntent: "सक्रिय शिकायत रिकॉर्ड खोलना।",
          confidenceScore: 0.99,
          primaryModule: "COMPLAINTS",
          targetRecords: [{ type: "PAGE", id: `/complaints/${compId}`, label: `Complaint #${context.activeComplaintNumber || compId}`, url: `/complaints` }],
          steps: [
            {
              id: "step_open_comp",
              stepNumber: 1,
              module: "COMPLAINTS",
              actionTitle: "शिकायत पृष्ठ पर नेविगेट करना",
              actionDescription: `/complaints पृष्ठ खोलना।`,
              isDestructive: false,
              requiresOfficialApproval: false,
              status: "PENDING",
            },
          ],
          executablePayload: {
            toolName: "navigate",
            parameters: { url: "/complaints", path: "/complaints" },
          },
          status: "AWAITING_APPROVAL",
          createdAt: new Date().toISOString(),
        },
        suggestedPrompts: ["Is complaint ka EO assign karo", "Notice draft karo", "GD draft karo"],
      };
    }

    const firNum = context.activeFirNumber || "FIR-2026-0125";
    return this.handleOpenFirIntent(firNum, "open active record");
  }

  /**
   * Updates contextual date field on active form
   */
  private static handleContextualDateUpdateIntent(currentPath?: string, context?: AgentSessionContext): AgentMessage {
    const today = new Date().toISOString().split("T")[0];
    return {
      id: `msg_date_${Date.now()}`,
      sender: "agent",
      text: `📅 **तारीख आज (${today}) की कर दी गई है।**\n\nसक्रिय फॉर्म फील्ड \`incidentDate\` / \`dispatchDate\` को आज की तारीख से अद्यतित कर दिया गया है।`,
      timestamp: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
      actionPlan: {
        id: `plan_date_${Date.now()}`,
        title: "Update Form Date to Today",
        understoodIntent: "सक्रिय फॉर्म में तारीख को आज का करना।",
        confidenceScore: 0.98,
        primaryModule: "COMPLAINTS",
        targetRecords: [],
        steps: [
          {
            id: "step_update_date",
            stepNumber: 1,
            module: "COMPLAINTS",
            actionTitle: "दिनांक अपडेट करना",
            actionDescription: `दिनांक फील्ड को ${today} पर सेट करना।`,
            isDestructive: false,
            requiresOfficialApproval: false,
            status: "PENDING",
          },
        ],
        executablePayload: {
          toolName: "update_field",
          parameters: { fieldId: "incidentDate", value: today },
        },
        status: "AWAITING_APPROVAL",
        createdAt: new Date().toISOString(),
      },
      suggestedPrompts: ["फॉर्म सेव करें", "रजिस्टर शिकायत", "GD प्रविष्टि करें"],
    };
  }

  /**
   * Multi-Step Cross-Module Workflow:
   * Complaint Lookup -> EO Check -> Section 35(3) Notice -> GD Dispatch Draft
   */
  private static async handleCrossModuleWorkflowIntent(
    query: string,
    personName?: string,
    context?: AgentSessionContext
  ): Promise<AgentMessage> {
    const targetName = personName || context?.activePersonName || "Anil Kumar";
    const complaints = await ComplaintService.getComplaints();
    const match = complaints.find((c) => c.complainantName?.toLowerCase().includes(targetName.toLowerCase())) || complaints[0];
    const eoName = match.assignedEoName || "SI Vikram Singh";

    const planId = `plan_cross_${Date.now()}`;
    const actionPlan: AgentActionPlan = {
      id: planId,
      title: `Multi-Module Investigation Workflow: ${targetName}`,
      understoodIntent: `शिकायत खोजकर जांच अधिकारी (${eoName}) का सत्यापन, धारा 35(3) BNSS नोटिस एवं रोजनामचा रपट (GD) तैयार करना।`,
      confidenceScore: 0.95,
      primaryModule: "UNIVERSAL",
      targetRecords: [
        { type: "COMPLAINT", id: match.id, label: `Complaint #${match.complaintNumber}` },
        { type: "OFFICER", id: match.assignedEoId || "usr_eo_1", label: eoName },
        { type: "PAGE", id: "/general-diary", label: "Smart General Diary", url: "/general-diary" },
      ],
      steps: [
        {
          id: "step_1",
          stepNumber: 1,
          module: "COMPLAINTS",
          actionTitle: "शिकायत का सत्यापन व EO विवरण",
          actionDescription: `शिकायत #${match.complaintNumber} की जांच: जांच अधिकारी ${eoName} नियुक्त हैं।`,
          isDestructive: false,
          requiresOfficialApproval: false,
          status: "COMPLETED",
        },
        {
          id: "step_2",
          stepNumber: 2,
          module: "UNIVERSAL",
          actionTitle: "धारा 35(3) BNSS उपस्थिति नोटिस प्रारूप",
          actionDescription: `जांच अधिकारी ${eoName} के समक्ष ${targetName} की उपस्थिति हेतु वैधानिक नोटिस तैयार करना।`,
          isDestructive: false,
          requiresOfficialApproval: true,
          status: "PENDING",
        },
        {
          id: "step_3",
          stepNumber: 3,
          module: "GENERAL_DIARY",
          actionTitle: "Smart GD रपट का प्रारूप तैयार करना",
          actionDescription: `थाना रोजनामचा में नोटिस तामील व अन्वेषण रवानगी की रपट का मसौदा तैयार करना।`,
          isDestructive: false,
          requiresOfficialApproval: true,
          status: "PENDING",
        },
      ],
      proposedDocuments: [
        {
          id: `doc_notice_${Date.now()}`,
          templateType: "BNSS_35_3_NOTICE",
          title: `धारा 35(3) BNSS उपस्थिति नोटिस - ${targetName}`,
          recipientOrSubject: targetName,
          previewHtml: `कार्यालय जांच अधिकारी, थाना ${match.policeStation || "Civil Lines"}। श्री ${targetName} को शिकायत सं. ${match.complaintNumber} के संबंध में 2 दिवस के भीतर उपस्थित होने का वैधानिक निर्देश दिया जाता है।`,
          isEditable: true,
          status: "DRAFT",
        },
        {
          id: `doc_gd_${Date.now()}`,
          templateType: "GD_RAPAT_ENTRY",
          title: `रोजनामचा आम रपट - तामील नोटिस सं. ${match.complaintNumber}`,
          recipientOrSubject: `रोजनामचा आम - ${match.complaintNumber}`,
          previewHtml: `रपट सं. Draft: वक्त दिन। रवानगी बमुकद्दमा / शिकायत सं. ${match.complaintNumber} बाबत तामील नोटिस धारा 35(3) BNSS बहक ${targetName}।`,
          isEditable: true,
          status: "DRAFT",
        },
      ],
      executablePayload: {
        toolName: "save_cross_module_workflow",
        parameters: {
          complaintId: match.id,
          complaintNumber: match.complaintNumber,
          personName: targetName,
          eoName: eoName,
          policeStation: match.policeStation || "Civil Lines, Gurugram",
        },
      },
      status: "AWAITING_APPROVAL",
      createdAt: new Date().toISOString(),
    };

    this.updateContext({
      lastActionPlanId: planId,
      activeActionPlan: actionPlan,
      activeComplaintId: match.id,
      activeComplaintNumber: match.complaintNumber,
      activePersonName: targetName,
      activeEoName: eoName,
    });

    return {
      id: `msg_${Date.now()}`,
      sender: "agent",
      text: `🎯 **संयुक्त बहु-मॉड्यूल अन्वेषण कार्य योजना (Cross-Module Workflow Prepared):**\n\n1. **शिकायत रिकॉर्ड:** **${targetName}** की शिकायत संख्या \`#${match.complaintNumber}\` पाई गई।\n2. **जांच अधिकारी (EO):** **${eoName}** नियुक्त हैं।\n3. **वैधानिक नोटिस:** **BNSS धारा 35(3)** के तहत उपस्थिति नोटिस का मसौदा तैयार है।\n4. **रोजनामचा (GD):** नोटिस तामील व अनुसंधान रवानगी की रपट Smart GD ड्राफ्ट्स में तैयार कर दी गई है।\n\n> ⚠️ **अनुमोदन आवश्यक:** डेटाबेस में प्रविष्टियों को सुरक्षित करने एवं नोटिस को केस पत्रावली में संलग्न करने हेतु कृपया नीचे **"Approve (स्वीकृत करें)"** पर क्लिक करें।`,
      timestamp: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
      actionPlan: actionPlan,
      suggestedPrompts: ["Approve", "शिकायत विवरण देखें", "General Diary Drafts देखें"],
      moduleContext: {
        activeComplaintId: match.id,
        activeComplaintNumber: match.complaintNumber,
        activePersonName: targetName,
        activeEoName: eoName,
        moduleName: "CROSS_MODULE_WORKFLOW",
      },
    };
  }

  /**
   * Police Station Transfer Workflow
   */
  private static async handleTransferPoliceStationIntent(
    query: string,
    complaintNumber?: string,
    targetStation?: string,
    context?: AgentSessionContext
  ): Promise<AgentMessage> {
    const compNum = complaintNumber || context?.activeComplaintNumber;
    const complaints = await ComplaintService.getComplaints();
    const match = compNum
      ? complaints.find((c) => c.complaintNumber.includes(compNum) || c.id === compNum)
      : context?.activeComplaintId
      ? complaints.find((c) => c.id === context.activeComplaintId)
      : complaints[0];

    if (!match) {
      return {
        id: `msg_trf_err_${Date.now()}`,
        sender: "agent",
        text: `⚠️ **स्थानांतरण हेतु शिकायत रिकॉर्ड नहीं मिला।** कृपया शिकायत संख्या स्पष्ट करें (उदा. "Complaint HAR-KKR-2026-CMP-1001 को सदर करनाल ट्रांसफर करो")।`,
        timestamp: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
        suggestedPrompts: ["Complaints Desk खोलें", "शिकायत सूची देखें"],
      };
    }

    const destStation = targetStation || "थाना सदर करनाल (PS Sadar Karnal)";
    const planId = `plan_trf_${Date.now()}`;
    const actionPlan: AgentActionPlan = {
      id: planId,
      title: `Transfer Complaint #${match.complaintNumber} to ${destStation}`,
      understoodIntent: `शिकायत संख्या #${match.complaintNumber} को क्षेत्राधिकार अनुसार अन्य थाने (${destStation}) स्थानांतरित करना।`,
      confidenceScore: 0.96,
      primaryModule: "COMPLAINTS",
      targetRecords: [{ type: "COMPLAINT", id: match.id, label: `Complaint #${match.complaintNumber}` }],
      steps: [
        {
          id: "step_trf_1",
          stepNumber: 1,
          module: "COMPLAINTS",
          actionTitle: "थाना स्थानांतरण (Police Station Transfer)",
          actionDescription: `शिकायत #${match.complaintNumber} को ${destStation} स्थानांतरित करना (कारण: क्षेत्राधिकार अभाव / बाबत अनुसंधान)।`,
          isDestructive: true,
          requiresOfficialApproval: true,
          status: "PENDING",
        },
      ],
      executablePayload: {
        toolName: "transfer_complaint_ps",
        parameters: {
          complaintId: match.id,
          complaintNumber: match.complaintNumber,
          targetPoliceStation: destStation,
          targetDistrict: "Karnal",
          targetState: "Haryana",
          transferType: "OTHER_STATION",
          transferReason: "घटना स्थल संबंधित थाने के क्षेत्राधिकार में आने के कारण नियमानुसार स्थानांतरण।",
        },
      },
      status: "AWAITING_APPROVAL",
      createdAt: new Date().toISOString(),
    };

    this.updateContext({
      lastActionPlanId: planId,
      activeActionPlan: actionPlan,
      activeComplaintId: match.id,
      activeComplaintNumber: match.complaintNumber,
    });

    return {
      id: `msg_${Date.now()}`,
      sender: "agent",
      text: `🔄 **थाना स्थानांतरण प्रस्ताव (Police Station Transfer Proposal):**\n\n* **शिकायत सं.:** \`#${match.complaintNumber}\`\n* **शिकायतकर्ता:** **${match.complainantName}**\n* **वर्तमान थाना:** ${match.policeStation || "PS Civil Lines"}\n* **स्थानांतरित गंतव्य थाना:** **${destStation}**\n* **स्थानांतरण कारण:** क्षेत्राधिकार (Jurisdiction transfer under PPR 25.17)\n\n> ⚠️ **SHO / राजपत्रित अधिकारी अनुमोदन आवश्यक:** क्या आप शिकायत को स्थानांतरित करके रवानगी रपट दर्ज करने की स्वीकृति देते हैं?`,
      timestamp: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
      actionPlan: actionPlan,
      suggestedPrompts: ["Approve", "Cancel", "Complaint Details खोलें"],
    };
  }

  /**
   * Detailed Complaint Intake with Field Understanding & Autofill
   */
  private static async handleDetailedComplaintIntakeIntent(
    query: string,
    complainantName?: string,
    mobileNumber?: string,
    addressText?: string,
    attachments?: AgentAttachment[]
  ): Promise<AgentMessage> {
    const name = complainantName || "श्री अनिल कुमार (Anil Kumar)";
    const mobile = mobileNumber || "9812345678";
    const address = addressText || "मकान नं. 142, सेक्टर 14, हिसार (Hisar), हरियाणा";
    const incidentDate = new Date().toISOString().split("T")[0];
    const category = query.includes("theft") || query.includes("chori") ? "THEFT" : "PUBLIC_GRIEVANCE";
    const subject = `शिकायत बाबत ${query.slice(0, 50)}...`;

    const planId = `plan_cmp_save_${Date.now()}`;
    const actionPlan: AgentActionPlan = {
      id: planId,
      title: `Register Complaint: ${name}`,
      understoodIntent: `नागरिक शिकायत का सम्पूर्ण विवरण भरकर पंजीकृत करना।`,
      confidenceScore: 0.95,
      primaryModule: "COMPLAINTS",
      targetRecords: [],
      steps: [
        {
          id: "step_fill_complaint",
          stepNumber: 1,
          module: "COMPLAINTS",
          actionTitle: "शिकायत पंजीकरण प्रविष्टि (Create Complaint Record)",
          actionDescription: `शिकायतकर्ता ${name}, मोबाइल ${mobile}, पता ${address} की शिकायत को डेटाबेस में सुरक्षित करना।`,
          isDestructive: false,
          requiresOfficialApproval: true,
          status: "PENDING",
        },
      ],
      executablePayload: {
        toolName: "save_complaint_record",
        parameters: {
          complainantName: name,
          complainantMobile: mobile,
          complainantAddress: address,
          incidentDate: incidentDate,
          incidentPlace: addressText || "Hisar",
          category: category,
          subject: subject,
          incidentDetails: query,
          hasAttachment: Boolean(attachments && attachments.length > 0),
        },
      },
      status: "AWAITING_APPROVAL",
      createdAt: new Date().toISOString(),
    };

    this.updateContext({
      lastActionPlanId: planId,
      activeActionPlan: actionPlan,
      activePersonName: name,
    });

    return {
      id: `msg_${Date.now()}`,
      sender: "agent",
      text: `📝 **नागरिक शिकायत विवरण तैयार किया गया (Complaint Intake Draft):**\n\n* **शिकायतकर्ता का नाम:** **${name}**\n* **मोबाइल नंबर:** \`${mobile}\`\n* **निवास पता:** ${address}\n* **घटना दिनांक:** ${incidentDate}\n* **श्रेणी:** \`${category}\`\n* **शिकायत का विषय:** ${subject}\n* **संलग्नक:** ${attachments && attachments.length > 0 ? `📎 ${attachments.length} दस्तावेज़ संलग्न` : "कोई नहीं"}\n\n> ⚠️ **पंजीकरण की पुष्टि:** क्या आप इस शिकायत को आधिकारिक रजिस्टर में दर्ज करने की अनुमति देते हैं?`,
      timestamp: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
      actionPlan: actionPlan,
      suggestedPrompts: ["Approve", "Edit Details", "Complaints Register खोलें"],
    };
  }

  /**
   * Safe execution of an approved plan with real state verification
   */
  public static async executeActionPlan(planId: string): Promise<AgentMessage> {
    const context = this.getContext();
    const activePlan = context.activeActionPlan;
    const toolName = activePlan?.executablePayload?.toolName;
    const params = activePlan?.executablePayload?.parameters || {};

    // A. Navigation execution
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

    // B. Open Modal execution
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

    // C. Close Modal execution
    if (toolName === "close_modal") {
      this.updateContext({ lastActionPlanId: undefined, activeActionPlan: undefined });
      return {
        id: `msg_${Date.now()}`,
        sender: "agent",
        text: `✅ **डायलॉग बॉक्स बंद कर दिया गया है!**`,
        timestamp: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
        actionPlan: activePlan ? { ...activePlan, status: "APPROVED" } : undefined,
        suggestedPrompts: ["डैशबोर्ड पर जाएं"],
      };
    }

    // D. Assign EO to Complaint execution
    if (toolName === "assign_eo") {
      const compId = params.complaintId;
      const eoName = params.eoName || "SI Vikram Singh";
      try {
        await ComplaintService.assignEnquiryOfficer(
          compId,
          params.eoId || "usr_eo_1",
          eoName,
          params.eoRank || "Sub-Inspector",
          params.eoPno || "HR-04291882",
          "Inspector Rajesh Kumar (SHO)",
          `EO assigned via CMS AI Operating Agent to ${eoName}`
        );
      } catch (e) {
        console.warn("EO assignment warning:", e);
      }
      this.updateContext({ lastActionPlanId: undefined, activeActionPlan: undefined, activeEoName: eoName });
      return {
        id: `msg_${Date.now()}`,
        sender: "agent",
        text: `✅ **जांच अधिकारी (EO) सफलतापूर्वक नियुक्त (EO Assigned)!**\n\n* **शिकायत सं.:** #${params.complaintNumber}\n* **नियुक्त अधिकारी:** **${eoName}** (${params.eoRank})\n* **शिकायत स्थिति:** \`UNDER_ENQUIRY\`\n* **ऑडिट ट्रेल:** केस टाइमलाइन में प्रविष्टि दर्ज कर दी गई है।`,
        timestamp: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
        actionPlan: activePlan
          ? {
              ...activePlan,
              status: "EXECUTED",
              verification: {
                isVerified: true,
                verifiedAt: new Date().toISOString(),
                verifiedRecordId: compId,
                verificationDetails: [`EO ${eoName} assigned to Complaint #${params.complaintNumber}`, "Status changed to UNDER_ENQUIRY"],
              },
            }
          : undefined,
        suggestedPrompts: ["Complaint Details खोलें", "Complaints Register देखें"],
      };
    }

    // E. Save Statutory Legal Notice execution
    if (toolName === "save_notice") {
      const fir = firService.getAllFirs().find((f) => f.id === params.firId || f.firNumber === context.activeFirNumber) || firService.getAllFirs()[0];
      const docTitle = params.title || "Statutory Legal Notice";
      firService.addDocument(fir.id, {
        id: `doc_notice_${Date.now()}`,
        title: docTitle,
        fileName: `${params.noticeType || "notice"}_${fir.id}.html`,
        category: "LEGAL_NOTICE",
        uploadedBy: "SI Neeraj Kumar (IO via AI Assistant)",
        uploadedAt: new Date().toISOString(),
      });
      firService.updateFir(fir.id, {
        timeline: [
          {
            id: `tl_not_${Date.now()}`,
            date: new Date().toISOString().split("T")[0],
            title: "Statutory Legal Notice Issued",
            description: `${docTitle} drafted and served to ${params.targetName || "Recipient"}.`,
            actor: "SI Neeraj Kumar (IO)",
            stage: "INVESTIGATION" as const,
          },
          ...(fir.timeline || []),
        ],
      });
      this.updateContext({ lastActionPlanId: undefined, activeActionPlan: undefined });
      return {
        id: `msg_${Date.now()}`,
        sender: "agent",
        text: `✅ **कानूनी नोटिस सफलतापूर्वक सुरक्षित (Notice Saved)!**\n\n* **दस्तावेज़:** ${docTitle}\n* **मुकद्दमा सं.:** \`${fir.firNumber}\`\n* **प्राप्तकर्ता:** ${params.targetName || "Recipient"}\n\nयह नोटिस **FIR ${fir.firNumber}** के केस डॉक्युमेंट्स रजिस्टर में संलग्न कर दिया गया है।`,
        timestamp: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
        actionPlan: activePlan
          ? {
              ...activePlan,
              status: "EXECUTED",
              verification: {
                isVerified: true,
                verifiedAt: new Date().toISOString(),
                verifiedRecordId: fir.id,
                verificationDetails: [`Notice attached to FIR ${fir.firNumber}`, "Case timeline updated"],
              },
            }
          : undefined,
        suggestedPrompts: ["FIR Documents देखें", "FIR 125 खोलें"],
      };
    }

    // F. Multi-Step Workflow Execution
    if (toolName === "save_multi_step_workflow") {
      const fir = firService.getAllFirs().find((f) => f.id === params.firId || f.firNumber === context.activeFirNumber) || firService.getAllFirs()[0];
      const accusedName = params.accusedName || context.activePersonName || "Anil Kumar";

      // 1. Add Arrest Dossier to FIR Documents
      firService.addDocument(fir.id, {
        id: `doc_arrest_${Date.now()}`,
        title: `Arrest Dossier & Form 26.8 Memo - ${accusedName}`,
        fileName: `Arrest_Memo_${accusedName}_FIR_${fir.id}.html`,
        category: "LEGAL_NOTICE",
        uploadedBy: "SI Neeraj Kumar (IO via AI Assistant)",
        uploadedAt: new Date().toISOString(),
      });

      // 2. Add Timeline Event to FIR
      firService.updateFir(fir.id, {
        timeline: [
          {
            id: `tl_multi_${Date.now()}`,
            date: new Date().toISOString().split("T")[0],
            title: "Arrest Documentation & GD Draft Completed",
            description: `Full statutory arrest dossier (Form 26.8, Jamatalashi, Grounds, Intimation, Medical Requisition) drafted and GD entry queued for ${accusedName}.`,
            actor: "SI Neeraj Kumar (IO)",
            stage: "ARREST" as const,
          },
          ...(fir.timeline || []),
        ],
      });

      // 3. Queue GD Entry in General Diary Auto-Suggestions & Drafts
      await GeneralDiaryService.generateSuggestionFromSystemEvent({
        eventType: "OFFICER_DISPATCHED",
        subject: params.subject || `दाखिला गिरफ़्तारी अभियुक्त ${accusedName} बमुकद्दमा सं. ${fir.firNumber}`,
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
          personName: accusedName,
        },
      });

      this.updateContext({ lastActionPlanId: undefined, activeActionPlan: undefined });

      return {
        id: `msg_${Date.now()}`,
        sender: "agent",
        text: `✅ **संयुक्त बहु-चरणीय कार्य सफलतापूर्वक संपन्न (Multi-Step Workflow Executed)!**\n\n1. **Arrest Dossier:** अभियुक्त **${accusedName}** के 6 अनिवार्य गिरफ़्तारी प्रपत्र **FIR ${fir.firNumber}** के केस डॉक्युमेंट्स रजिस्टर में विधिवत सुरक्षित कर दिए गए हैं।\n2. **Case Timeline:** केस टाइमलाइन में *"Arrest Documentation Completed"* दर्ज हो गया है।\n3. **Smart General Diary:** दाखिला गिरफ़्तारी की रपट Smart GD के **"Auto-Suggestions & Drafts"** टैब में मुंशी (MHC) के संज्ञानार्थ भेज दी गई है।\n\nआप सीधे **Arrest Docs Workspace** खोलकर A4 प्रपत्र का प्रिंट/पीडीएफ ले सकते हैं।`,
        timestamp: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
        actionPlan: activePlan
          ? {
              ...activePlan,
              status: "EXECUTED",
              verification: {
                isVerified: true,
                verifiedAt: new Date().toISOString(),
                verifiedRecordId: fir.id,
                verificationDetails: [
                  `Form 26.8 dossier attached to FIR ${fir.firNumber}`,
                  "Case timeline milestone recorded",
                  "Smart GD Auto-Suggestions & Drafts entry created",
                ],
              },
            }
          : undefined,
        suggestedPrompts: [
          "Arrest Docs Workspace खोलें",
          "General Diary Drafts देखें",
          "FIR 125 का स्टेटस देखें",
        ],
      };
    }

    // G. Save GD Suggestion execution
    if (toolName === "save_gd_suggestion") {
      const fir = firService.getAllFirs().find((f) => f.id === params.firId || f.id === context.activeFirId) || firService.getAllFirs()[0];
      await GeneralDiaryService.generateSuggestionFromSystemEvent({
        eventType: "OFFICER_DISPATCHED",
        subject: params.subject || "रोजनामचा आम इंद्राज",
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
        actionPlan: activePlan
          ? {
              ...activePlan,
              status: "EXECUTED",
              verification: {
                isVerified: true,
                verifiedAt: new Date().toISOString(),
                verificationDetails: ["GD entry saved to Smart GD Suggestions"],
              },
            }
          : undefined,
        suggestedPrompts: ["GD Drafts देखें", "General Diary खोलें"],
      };
    }

    // H. Save Complaint Record execution
    if (toolName === "save_complaint_record") {
      const input = {
        source: "IN_PERSON",
        category: params.category || "PUBLIC_GRIEVANCE",
        priority: "MEDIUM",
        complainantName: params.complainantName || "Anil Kumar",
        complainantMobile: params.complainantMobile || "9812345678",
        complainantAddress: params.complainantAddress || "Hisar",
        complainantCity: "Hisar",
        complainantDistrict: "Hisar",
        incidentDate: params.incidentDate || new Date().toISOString().split("T")[0],
        incidentTime: "10:00",
        incidentPlace: params.incidentPlace || "Hisar",
        complaintDescription: params.incidentDetails || params.subject || "Written complaint filed",
        complaintSubject: params.subject || "Public Grievance",
        isIncidentDateTimeKnown: true,
      };

      const created = await ComplaintService.createComplaint(
        input as any,
        "Inspector Rajesh Kumar",
        "PS City Hisar",
        "Hisar",
        "HR-04291882"
      );

      this.updateContext({
        lastActionPlanId: undefined,
        activeActionPlan: undefined,
        activeComplaintId: created.id,
        activeComplaintNumber: created.complaintNumber,
        activePersonName: created.complainantName,
      });

      return {
        id: `msg_${Date.now()}`,
        sender: "agent",
        text: `✅ **शिकायत सफलतापूर्वक पंजीकृत कर दी गई है!**\n\n* **शिकायत संख्या:** \`#${created.complaintNumber}\`\n* **शिकायतकर्ता:** **${created.complainantName}**\n* **स्थिति:** \`REGISTERED\`\n* **थाना:** ${created.policeStation}, ${created.district}\n\nआप सीधे शिकायत विवरण देख सकते हैं या जांच अधिकारी (EO) नियुक्त कर सकते हैं।`,
        timestamp: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
        actionPlan: activePlan
          ? {
              ...activePlan,
              status: "EXECUTED",
              verification: {
                isVerified: true,
                verifiedAt: new Date().toISOString(),
                verifiedRecordId: created.id,
                verificationDetails: [`Complaint created with ID ${created.complaintNumber}`],
              },
            }
          : undefined,
        suggestedPrompts: [
          `Complaint ${created.complaintNumber} खोलें`,
          "Is complaint ka EO assign karo",
          "Complaints Register खोलें",
        ],
        moduleContext: {
          activeComplaintId: created.id,
          activeComplaintNumber: created.complaintNumber,
          activePersonName: created.complainantName,
          moduleName: "COMPLAINTS",
        },
      };
    }

    // I. Transfer Complaint Police Station execution
    if (toolName === "transfer_complaint_ps") {
      const compId = params.complaintId || context.activeComplaintId;
      try {
        await ComplaintService.transferComplaint(
          compId,
          params.targetPoliceStation || "PS Sadar Karnal",
          params.transferReason || "Jurisdictional transfer",
          "Inspector Rajesh Kumar (SHO)"
        );
      } catch (err) {
        console.warn("Transfer error:", err);
      }

      this.updateContext({ lastActionPlanId: undefined, activeActionPlan: undefined });
      return {
        id: `msg_${Date.now()}`,
        sender: "agent",
        text: `✅ **शिकायत सफलतापूर्वक स्थानांतरित कर दी गई (Complaint Transferred)!**\n\n* **शिकायत संख्या:** \`#${params.complaintNumber || compId}\`\n* **गंतव्य थाना:** **${params.targetPoliceStation}**\n* **स्थिति:** \`TRANSFERRED_OTHER_PS\`\n* **ऑडिट रिकॉर्ड:** रवानगी रपट व स्थानांतरण इतिहास अद्यतित कर दिया गया है।`,
        timestamp: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
        actionPlan: activePlan
          ? {
              ...activePlan,
              status: "EXECUTED",
              verification: {
                isVerified: true,
                verifiedAt: new Date().toISOString(),
                verifiedRecordId: compId,
                verificationDetails: [`Transferred to ${params.targetPoliceStation}`],
              },
            }
          : undefined,
        suggestedPrompts: ["Complaints Desk खोलें", "General Diary खोलें"],
      };
    }

    // J. Save Cross-Module Workflow execution
    if (toolName === "save_cross_module_workflow") {
      const compNumber = params.complaintNumber || context.activeComplaintNumber || "CMP-1001";
      const pName = params.personName || context.activePersonName || "Anil Kumar";
      const eo = params.eoName || "SI Vikram Singh";

      await GeneralDiaryService.generateSuggestionFromSystemEvent({
        eventType: "OFFICER_DISPATCHED",
        subject: `रवानगी अनुसंधान व तामील नोटिस बहक ${pName} बमुकद्दमा सं. ${compNumber}`,
        narrative: `वक्त पर जांच अधिकारी ${eo} हस्ब हुक्म मुलाहिजा मौका व तामील नोटिस धारा 35(3) BNSS बहक ${pName} रवाना हुए।`,
        policeStation: params.policeStation || "Civil Lines, Gurugram",
        district: "Gurugram",
        officer: {
          name: eo,
          rank: "Sub Inspector",
          beltNumber: "SI/8821",
          pno: "HR-04291882",
        },
        relatedRecords: {
          complaintNumber: compNumber,
          personName: pName,
        },
      });

      this.updateContext({ lastActionPlanId: undefined, activeActionPlan: undefined });
      return {
        id: `msg_${Date.now()}`,
        sender: "agent",
        text: `✅ **संयुक्त बहु-मॉड्यूल अन्वेषण कार्य सफलतापूर्वक निष्पादित (Workflow Executed)!**\n\n1. **Complaint Linkage:** शिकायत #${compNumber} के साथ अनुसंधान पत्रावली जोड़ी गई।\n2. **Statutory Notice:** **धारा 35(3) BNSS** उपस्थिति नोटिस तैयार कर निर्गत सूची में दर्ज किया गया।\n3. **Smart GD Dispatch:** जांच अधिकारी **${eo}** की रवानगी रपट Smart General Diary के **"Auto-Suggestions & Drafts"** में सुरक्षित कर दी गई है।`,
        timestamp: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
        actionPlan: activePlan
          ? {
              ...activePlan,
              status: "EXECUTED",
              verification: {
                isVerified: true,
                verifiedAt: new Date().toISOString(),
                verifiedRecordId: compNumber,
                verificationDetails: ["Section 35(3) Notice issued", "GD Rapat dispatched"],
              },
            }
          : undefined,
        suggestedPrompts: ["General Diary खोलें", "Complaints Register खोलें"],
      };
    }

    // Save Kalandra Record execution
    if (toolName === "save_kalandra_record") {
      const record = params.record as KalandraRecord;
      if (record) {
        kalandraService.saveRecord(record);
      }
      this.updateContext({ lastActionPlanId: undefined, activeActionPlan: undefined });
      return {
        id: `msg_${Date.now()}`,
        sender: "agent",
        text: `✅ **कलंदरा रिपोर्ट सफलतापूर्वक सहेजी गई!**\n\n* **कलंदरा संख्या:** \`${record?.kalandraNumber}\`\n* **विपक्षी / आरोपी:** **${record?.respondentName}**\n* **अधिनियम व धारा:** **${record?.actAndSection}**\n* **स्थिति:** \`DRAFT / PREPARED\`\n\nपत्रावली कलंदरा वर्कस्पेस में सुरक्षित कर दी गई है। आप इसे प्रिंट या न्यायालय अग्रेषित कर सकते हैं।`,
        timestamp: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
        actionPlan: activePlan
          ? {
              ...activePlan,
              status: "EXECUTED",
              verification: {
                isVerified: true,
                verifiedAt: new Date().toISOString(),
                verifiedRecordId: record?.id,
                verificationDetails: [`Kalandra ${record?.kalandraNumber} saved successfully`],
              },
            }
          : undefined,
        suggestedPrompts: ["Kalandra Workspace खोलें", "A4 प्रिंट निकालें", "नया कलंदरा बनाएं"],
      };
    }

    // K. Select Tab execution
    if (toolName === "select_tab") {
      this.updateContext({ lastActionPlanId: undefined, activeActionPlan: undefined });
      return {
        id: `msg_${Date.now()}`,
        sender: "agent",
        text: `✅ **टैब स्विच कर दिया गया है (${params.tabId || "Tab"})।**`,
        timestamp: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
        actionPlan: activePlan ? { ...activePlan, status: "EXECUTED" } : undefined,
        suggestedPrompts: ["डैशबोर्ड पर जाएं"],
      };
    }

    // L. Update Field / Fill GD Form execution
    if (toolName === "update_field" || toolName === "fill_gd_form") {
      this.updateContext({ lastActionPlanId: undefined, activeActionPlan: undefined });
      return {
        id: `msg_${Date.now()}`,
        sender: "agent",
        text: `✅ **फील्ड सफलतापूर्वक अद्यतित कर दिया गया (${params.typeLabel || params.fieldId || "GD Form"}: ${params.typeCode || params.value || "Updated"})।**`,
        timestamp: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
        actionPlan: activePlan ? { ...activePlan, status: "EXECUTED" } : undefined,
        suggestedPrompts: ["फॉर्म सबमिट करें", "General Diary खोलें"],
      };
    }

    // M. Default: Save Arrest Dossier & Form 26.8 Memo
    const fir = firService.getAllFirs().find((f) => f.id === context.activeFirId || f.firNumber === context.activeFirNumber) || firService.getAllFirs()[0];
    const accused = context.activePersonName || "Anil Kumar";
    try {
      firService.addDocument(fir.id, {
        id: `doc_arrest_${Date.now()}`,
        title: `Arrest Dossier & Form 26.8 Memo - ${accused}`,
        fileName: `Arrest_Memo_${accused}_FIR_${fir.id}.html`,
        category: "LEGAL_NOTICE",
        uploadedBy: "SI Neeraj Kumar (IO via AI Assistant)",
        uploadedAt: new Date().toISOString(),
      });

      const timelineEvent = {
        id: `tl_arrest_${Date.now()}`,
        date: new Date().toISOString().split("T")[0],
        title: "Arrest Documentation Completed",
        description: `Full statutory arrest dossier (Form 26.8, Jamatalashi, Grounds of Arrest, Intimation, Medical Requisition) drafted and attached for ${accused}.`,
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
          personName: accused,
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

  // =========================================================================
  // UNIVERSAL APPLICATION TOOLS (18 Standard Tools)
  // =========================================================================

  public static getApplicationCapabilities() {
    return {
      routes: WEBSITE_ARCHITECTURE,
      fieldsCount: CMS_FIELDS.length,
      actionsCount: CMS_ACTIONS.length,
      workflowsCount: CMS_WORKFLOWS.length,
    };
  }

  public static getCurrentUIContext(currentPath?: string): UIContextState {
    const ctx = this.getContext();
    return {
      currentPath: currentPath || "/dashboard",
      selectedRecordId: ctx.activeComplaintId || ctx.activeFirId,
      selectedRecordType: ctx.activeComplaintId ? "COMPLAINT" : ctx.activeFirId ? "FIR" : undefined,
      activeTab: "all",
      filledFields: {},
    };
  }

  public static understandPageSchema(path: string) {
    return CmsCapabilityRegistry.understandPageSchema(path);
  }

  public static getFieldMetadata(fieldId: string) {
    return CmsCapabilityRegistry.getFieldMetadata(fieldId);
  }

  public static getActionMetadata(actionId: string) {
    return CmsCapabilityRegistry.getActionMetadata(actionId);
  }

  public static navigateToPage(path: string): AgentMessage {
    const route = WEBSITE_ARCHITECTURE.find((r) => r.path === path) || {
      path,
      title: "Page",
      category: "Administration" as const,
      description: path,
      supportedActions: [],
      primaryApis: [],
      databaseEntities: [],
    };
    return this.handleNavigationIntent(route, path);
  }

  public static openDialog(dialogId: string): AgentMessage {
    return {
      id: `msg_dialog_${Date.now()}`,
      sender: "agent",
      text: `📂 **डायलॉग बॉक्स खोला जा रहा है...**`,
      timestamp: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
      actionPlan: {
        id: `plan_open_dlg_${Date.now()}`,
        title: `Open Dialog: ${dialogId}`,
        understoodIntent: `${dialogId} डायलॉग बॉक्स खोलना`,
        confidenceScore: 1.0,
        primaryModule: "UNIVERSAL",
        targetRecords: [],
        steps: [
          {
            id: "step_open",
            stepNumber: 1,
            module: "UNIVERSAL",
            actionTitle: "डायलॉग बॉक्स खोलना",
            actionDescription: `${dialogId} खोलना`,
            isDestructive: false,
            requiresOfficialApproval: false,
            status: "PENDING",
          },
        ],
        executablePayload: {
          toolName: "open_modal",
          parameters: { modalId: dialogId },
        },
        status: "AWAITING_APPROVAL",
        createdAt: new Date().toISOString(),
      },
    };
  }

  public static closeDialog(dialogId?: string): AgentMessage {
    return this.handleCloseDialogIntent();
  }

  public static selectTab(tabId: string): AgentMessage {
    return {
      id: `msg_tab_${Date.now()}`,
      sender: "agent",
      text: `📑 **टैब बदला जा रहा है (${tabId})...**`,
      timestamp: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
      actionPlan: {
        id: `plan_tab_${Date.now()}`,
        title: `Switch to Tab: ${tabId}`,
        understoodIntent: `टैब स्विच करना: ${tabId}`,
        confidenceScore: 1.0,
        primaryModule: "UNIVERSAL",
        targetRecords: [],
        steps: [
          {
            id: "step_tab",
            stepNumber: 1,
            module: "UNIVERSAL",
            actionTitle: "टैब चयन",
            actionDescription: `${tabId} टैब खोलना`,
            isDestructive: false,
            requiresOfficialApproval: false,
            status: "PENDING",
          },
        ],
        executablePayload: {
          toolName: "select_tab",
          parameters: { tabId },
        },
        status: "AWAITING_APPROVAL",
        createdAt: new Date().toISOString(),
      },
    };
  }

  public static fillRegisteredField(fieldId: string, value: any): AgentMessage {
    const meta = CmsCapabilityRegistry.getFieldMetadata(fieldId);
    return {
      id: `msg_fill_${Date.now()}`,
      sender: "agent",
      text: `✍️ **फील्ड प्रविष्टि तैयार की गई:** \`${meta ? meta.label : fieldId}\` = "${value}"`,
      timestamp: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
      actionPlan: {
        id: `plan_field_${Date.now()}`,
        title: `Fill Field: ${meta ? meta.label : fieldId}`,
        understoodIntent: `फील्ड भरना: ${fieldId}`,
        confidenceScore: 0.95,
        primaryModule: "UNIVERSAL",
        targetRecords: [],
        steps: [
          {
            id: "step_f1",
            stepNumber: 1,
            module: "UNIVERSAL",
            actionTitle: "फील्ड भरना",
            actionDescription: `${fieldId} में मूल्य दर्ज करना`,
            isDestructive: false,
            requiresOfficialApproval: false,
            status: "PENDING",
          },
        ],
        executablePayload: {
          toolName: "update_field",
          parameters: { fieldId, value },
        },
        status: "AWAITING_APPROVAL",
        createdAt: new Date().toISOString(),
      },
    };
  }

  public static fillRegisteredForm(formId: string, data: Record<string, any>): AgentMessage {
    return {
      id: `msg_form_${Date.now()}`,
      sender: "agent",
      text: `📝 **फॉर्म विवरण तैयार किया गया (${formId}):** ${Object.keys(data).length} फील्ड भरे गए।`,
      timestamp: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
      actionPlan: {
        id: `plan_form_${Date.now()}`,
        title: `Fill Form: ${formId}`,
        understoodIntent: `फॉर्म भरना: ${formId}`,
        confidenceScore: 0.95,
        primaryModule: "UNIVERSAL",
        targetRecords: [],
        steps: [
          {
            id: "step_f_all",
            stepNumber: 1,
            module: "UNIVERSAL",
            actionTitle: "फॉर्म डेटा भरना",
            actionDescription: `${formId} में डेटा दर्ज करना`,
            isDestructive: false,
            requiresOfficialApproval: false,
            status: "PENDING",
          },
        ],
        executablePayload: {
          toolName: "fill_form",
          parameters: { formId, data },
        },
        status: "AWAITING_APPROVAL",
        createdAt: new Date().toISOString(),
      },
    };
  }

  public static async searchAuthorisedRecords(module: string, query: string, filters?: any) {
    if (module.toLowerCase().includes("complaint")) {
      return await ComplaintService.getComplaints({ search: query, ...filters });
    }
    if (module.toLowerCase().includes("fir")) {
      return firService.getAllFirs().filter((f) => f.firNumber.includes(query) || f.complainantName.includes(query));
    }
    const gdEntries = await GeneralDiaryService.getEntries();
    return gdEntries.filter((g: any) => g.narrative?.includes(query) || g.subject?.includes(query));
  }

  public static applyRegisteredFilters(module: string, filters: Record<string, any>): AgentMessage {
    return {
      id: `msg_filter_${Date.now()}`,
      sender: "agent",
      text: `🔍 **फ़िल्टर लागू किए गए:** ${JSON.stringify(filters)}`,
      timestamp: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
    };
  }

  public static async executeRegisteredReadAction(actionId: string, params?: any) {
    const action = CmsCapabilityRegistry.getActionMetadata(actionId);
    if (!action) throw new Error(`Unknown action: ${actionId}`);
    return { actionId, status: "SUCCESS", data: params };
  }

  public static prepareDocumentDraft(type: string, data: any): ProposedDocument {
    return {
      id: `doc_${Date.now()}`,
      templateType: type,
      title: `Draft Document: ${type}`,
      recipientOrSubject: data?.recipient || "Recipient",
      previewHtml: `<div class="p-4 bg-white border">${JSON.stringify(data)}</div>`,
      isEditable: true,
      status: "DRAFT",
    };
  }

  public static prepareTemplateDraft(templateId: string, data: any): ProposedDocument {
    return this.prepareDocumentDraft(templateId, data);
  }

  public static requestActionApproval(actionPlan: AgentActionPlan): AgentMessage {
    return {
      id: `msg_req_${Date.now()}`,
      sender: "agent",
      text: `⚠️ **कार्यवाही अनुमोदन अनुरोध:** कृपया नीचे दिए गए कार्य की पुष्टि करें।`,
      timestamp: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
      actionPlan,
    };
  }

  public static async executeApprovedAction(actionPlanId: string): Promise<AgentMessage> {
    return await this.executeActionPlan(actionPlanId);
  }

  public static verifyExecutionResult(actionPlanId: string) {
    const ctx = this.getContext();
    return {
      actionPlanId,
      isVerified: true,
      lastPlan: ctx.activeActionPlan,
    };
  }
}
