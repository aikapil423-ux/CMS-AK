/**
 * Solo Native CMS Voice Engine
 * Haryana Police Crime Management System
 * 
 * Provides 100% self-contained, browser-native voice copilot capabilities:
 * 1. Wake-up word: "Hey CMS" (supports "hey cms", "हे सीएमएस", "cms agent")
 * 2. Hands-free continuous listening loop (no repeated mic clicks)
 * 3. Barge-in / Interruption: Stops speaking immediately when user speaks ("bole par ruke")
 * 4. Understand & Plan: Multi-step intent analysis across all 8 police modules
 * 5. Dynamic Re-planning: Seamlessly adapts and replans when interrupted or corrected
 * 
 * Eliminates all external Jarvis / Python / WebSocket dependencies.
 */

import { DynamicModuleRegistry, ModuleDefinition } from "./dynamicModuleRegistry";
import { LiveWebsiteBridge, OperatorAction, WebsiteSnapshot } from "./websiteOperator";

export type VoiceLanguage = "en-IN" | "hinglish" | "hi-IN";

export type CmsVoiceStatus =
  | "OFF"          // Mic turned off
  | "STANDBY"      // Continuous listening for "Hey CMS" wake word
  | "LISTENING"    // Actively hearing user command
  | "PLANNING"     // Understanding & creating execution plan
  | "EXECUTING"    // Running DOM / router actions
  | "SPEAKING"     // Agent speaking back (barge-in enabled)
  | "INTERRUPTED"  // User spoke while agent was talking; halted speech immediately
  | "ERROR";

export interface ExecutionStep {
  id: string;
  description: string;
  action?: OperatorAction;
  path?: string;
  status: "pending" | "running" | "completed" | "failed" | "cancelled";
}

export interface VoicePlan {
  originalCommand: string;
  cleanIntent: string;
  targetModule?: ModuleDefinition;
  targetPath?: string;
  steps: ExecutionStep[];
  spokenAcknowledgement: string;
  completionSummary: string;
  createdAt: number;
}

export type VoiceStatusListener = (status: CmsVoiceStatus, info?: string) => void;
export type VoiceTranscriptListener = (transcript: { text: string; isFinal: boolean; source: "user" | "agent" }) => void;
export type VoicePlanListener = (plan: VoicePlan | null) => void;

class CmsVoiceEngineClass {
  private status: CmsVoiceStatus = "STANDBY";
  private enabled = true;
  private recognition: any = null;
  private speechSynth: SpeechSynthesis | null = null;
  private statusListeners: Set<VoiceStatusListener> = new Set();
  private transcriptListeners: Set<VoiceTranscriptListener> = new Set();
  private planListeners: Set<VoicePlanListener> = new Set();

  private activePlan: VoicePlan | null = null;
  private isProcessing = false;
  private isCurrentlySpeaking = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private activeSpeakResolver: (() => void) | null = null;
  private liveBridge = new LiveWebsiteBridge();
  private navigateHandler: ((path: string) => void) | null = null;
  private commandCallback: ((cmd: string) => Promise<string>) | null = null;

  // Language setting: en-IN, hinglish, or hi-IN
  private language: VoiceLanguage = "en-IN";

  // Re-start watchdog timer to keep continuous listening alive
  private restartTimeout: any = null;
  private silenceTimer: any = null;
  private lastSpokenInterim = "";

  // Acoustic Echo Cancellation / Self-Hearing Suppression
  private activeSpokenPhrases: Set<string> = new Set();
  private spokenWordsHistory: Set<string> = new Set();
  private lastSpeakingEndTime = 0;
  private isPermissionDenied = false;

  constructor() {
    if (typeof window !== "undefined") {
      try {
        const savedEnabled = localStorage.getItem("cms_voice_enabled");
        if (savedEnabled !== null) {
          this.enabled = savedEnabled === "true";
        }
        const savedLang = localStorage.getItem("cms_voice_lang") as VoiceLanguage;
        if (savedLang && (savedLang === "en-IN" || savedLang === "hinglish" || savedLang === "hi-IN")) {
          this.language = savedLang;
        }
      } catch {}

      if ("speechSynthesis" in window) {
        this.speechSynth = window.speechSynthesis;
      }
    }
  }

  // ==========================================
  // Public Controls & Subscriptions
  // ==========================================

  public setNavigationHandler(handler: (path: string) => void) {
    this.navigateHandler = handler;
  }

  public setCommandCallback(handler: (cmd: string) => Promise<string>) {
    this.commandCallback = handler;
  }

  public setLanguage(lang: VoiceLanguage) {
    this.language = lang;
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("cms_voice_lang", lang);
      } catch {}
    }
    if (this.recognition) {
      this.recognition.lang = lang === "hi-IN" ? "hi-IN" : "en-IN";
    }
  }

  public getLanguage(): VoiceLanguage {
    return this.language;
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (enabled) {
      this.isPermissionDenied = false;
    }
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("cms_voice_enabled", enabled ? "true" : "false");
      } catch {}
    }

    if (enabled) {
      this.startContinuousListening();
    } else {
      this.stopContinuousListening();
      this.stopSpeaking();
      this.setStatus("OFF", "Voice Copilot disabled");
    }
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public getStatus(): CmsVoiceStatus {
    return this.status;
  }

  public getActivePlan(): VoicePlan | null {
    return this.activePlan;
  }

  public subscribeStatus(listener: VoiceStatusListener): () => void {
    this.statusListeners.add(listener);
    listener(this.status);
    return () => this.statusListeners.delete(listener);
  }

  public subscribeTranscript(listener: VoiceTranscriptListener): () => void {
    this.transcriptListeners.add(listener);
    return () => this.transcriptListeners.delete(listener);
  }

  public subscribePlan(listener: VoicePlanListener): () => void {
    this.planListeners.add(listener);
    listener(this.activePlan);
    return () => this.planListeners.delete(listener);
  }

  private setStatus(status: CmsVoiceStatus, info?: string) {
    this.status = status;
    this.statusListeners.forEach((l) => l(status, info));
  }

  private emitTranscript(text: string, isFinal: boolean, source: "user" | "agent") {
    this.transcriptListeners.forEach((l) => l({ text, isFinal, source }));
  }

  private updatePlan(plan: VoicePlan | null) {
    this.activePlan = plan;
    this.planListeners.forEach((l) => l(plan));
  }

  // ==========================================
  // Continuous Listening Loop & Wake Detection
  // ==========================================

  public startContinuousListening(): void {
    if (typeof window === "undefined" || !this.enabled || this.isPermissionDenied) return;

    // Prevent double-start flicker if already listening or active
    if (this.recognition && (this.status === "STANDBY" || this.status === "LISTENING" || this.status === "SPEAKING")) {
      return;
    }

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      this.setStatus("ERROR", "Web Speech API is not supported in this browser. Please use Google Chrome or Microsoft Edge for voice commands; text commands work on all browsers.");
      return;
    }

    // Stop existing instance if running
    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch {}
      this.recognition = null;
    }

    try {
      const recognition = new SpeechRec();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = this.language;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        if (this.status !== "SPEAKING" && this.status !== "PLANNING" && this.status !== "EXECUTING") {
          this.setStatus("STANDBY", "Continuous listening ready: 'Hey Parth'");
        }
      };

      // ── Audio/Speech Start detected ──
      recognition.onspeechstart = () => {
        // Instant hardware speech activity detected while agent is speaking
        if (this.isCurrentlySpeaking) {
          // Flag potential barge-in for immediate responsiveness
          console.log("[CmsVoiceEngine] Mic detected voice activity while speaking");
        }
      };

      recognition.onresult = (event: any) => {
        let interim = "";
        let finalChunk = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          const transcript = item[0]?.transcript || "";
          if (item.isFinal) {
            finalChunk += transcript + " ";
          } else {
            interim += transcript + " ";
          }
        }

        const cleanInterim = interim.trim();
        const cleanFinal = finalChunk.trim();
        const activeText = cleanFinal || cleanInterim;
        if (!activeText) return;

        // ── 1. INSTANT INTERRUPTION KEYWORD DETECTION (interim or final) ──
        // Interruption keywords (ruko, stop, chup, band karo, wait) ALWAYS override echo filter!
        if (this.isInterruptionKeyword(activeText)) {
          this.handleBargeIn("Interruption keyword detected: " + activeText);
          if (cleanFinal) {
            this.emitTranscript(cleanFinal, true, "user");
            if (this.activePlan) {
              this.replan("User stopped: " + cleanFinal);
            } else {
              this.stopSpeaking();
              this.setStatus("STANDBY", "Stopped: " + cleanFinal);
            }
          } else if (cleanInterim) {
            this.emitTranscript(cleanInterim, false, "user");
          }
          return;
        }

        // ── 2. ACTIVE BARGE-IN: User speaks while assistant is speaking ──
        if (this.isCurrentlySpeaking) {
          if (!this.isEchoOfAgent(activeText)) {
            this.handleBargeIn("User spoke during playback: " + activeText);
          } else {
            // Pure acoustic echo from assistant's own speaker, discard
            return;
          }
        }

        // ── 3. ACOUSTIC ECHO SUPPRESSION (trailing audio after playback) ──
        if (cleanInterim && this.isEchoOfAgent(cleanInterim)) {
          return;
        }
        if (cleanFinal && this.isEchoOfAgent(cleanFinal)) {
          return;
        }

        if (cleanInterim) {
          this.lastSpokenInterim = cleanInterim;
          this.emitTranscript(cleanInterim, false, "user");
        }

        if (cleanFinal) {
          this.emitTranscript(cleanFinal, true, "user");
          this.processSpokenText(cleanFinal);
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          this.isPermissionDenied = true;
          this.enabled = false;
          clearTimeout(this.restartTimeout);
          this.setStatus("ERROR", "Microphone access blocked. Please allow microphone permissions in browser settings.");
          return;
        }
        if (event.error === "audio-capture") {
          this.enabled = false;
          clearTimeout(this.restartTimeout);
          this.setStatus("ERROR", "No microphone detected. Please plug in or enable your microphone.");
          return;
        }
        // 'no-speech' is expected during pauses in continuous listening
        if (event.error !== "no-speech" && event.error !== "aborted") {
          console.warn("[CmsVoiceEngine] Recognition note:", event.error);
        }
      };

      recognition.onend = () => {
        // If permission was denied or disabled, do not restart
        if (!this.enabled || this.isPermissionDenied) {
          if (!this.isPermissionDenied) this.setStatus("OFF");
          return;
        }

        // Auto-restart loop with backoff protection
        clearTimeout(this.restartTimeout);
        this.restartTimeout = setTimeout(() => {
          if (this.enabled && !this.isPermissionDenied && this.recognition === recognition) {
            try {
              recognition.start();
            } catch {
              this.startContinuousListening();
            }
          }
        }, 120);
      };

      this.recognition = recognition;
      recognition.start();
    } catch (err: any) {
      console.warn("[CmsVoiceEngine] Start listening note:", err?.message);
      this.setStatus("ERROR", "Microphone access pending or busy");
    }
  }

  public stopContinuousListening(): void {
    clearTimeout(this.restartTimeout);
    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch {}
      this.recognition = null;
    }
  }

  // ==========================================
  // Barge-In & Echo Cancellation Handling
  // ==========================================

  /**
   * Acoustic Echo Cancellation:
   * Detects if an incoming transcript is the agent hearing its own speech from the speakers.
   */
  public isEchoOfAgent(transcript: string): boolean {
    const clean = transcript.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()?"'।]/g, " ").trim();
    if (!clean) return true;

    // Interruption keywords are NEVER treated as echo!
    if (this.isInterruptionKeyword(clean)) {
      return false;
    }

    const isRecentSpeaking = this.isCurrentlySpeaking || (Date.now() - this.lastSpeakingEndTime < 2000);
    if (!isRecentSpeaking) return false;

    // For short utterances (1-3 words), only consider echo if it exactly matches an active phrase
    const words = clean.split(/\s+/).filter((w) => w.length > 1);
    if (words.length <= 3) {
      for (const phrase of this.activeSpokenPhrases) {
        if (phrase === clean) return true;
      }
      return false; // Short phrases that aren't exact whole phrases are genuine user commands!
    }

    // For longer phrases (> 3 words), check substantial containment or high token overlap (>= 75%)
    for (const phrase of this.activeSpokenPhrases) {
      if (phrase.includes(clean) && clean.length > 25) {
        return true;
      }
    }

    let matchCount = 0;
    for (const w of words) {
      if (this.spokenWordsHistory.has(w)) {
        matchCount++;
      }
    }

    const matchRatio = matchCount / words.length;
    return matchRatio >= 0.75;
  }

  public isInterruptionKeyword(text: string): boolean {
    if (!text) return false;
    const clean = text.toLowerCase().trim();

    // 1. Common English and Hinglish interruption keywords
    const keywords = [
      "stop", "halt", "ruko", "ruk", "ruk jao", "rukna", "rukye", "rukiye",
      "chup", "chup raho", "chup ho jao", "quiet", "silence", "be quiet",
      "wait", "ruko zara", "thehro", "bas", "bas karo", "cancel", "radd",
      "nahi", "nahin", "mat karo", "band karo", "mat bolo", "pause", "hold on",
      "shant", "shaant", "shant ho jao", "shut up"
    ];

    for (const kw of keywords) {
      if (clean === kw || clean.startsWith(kw + " ") || clean.endsWith(" " + kw) || clean.includes(" " + kw + " ")) {
        return true;
      }
    }

    // 2. Hindi Devanagari interruption terms
    const hindiKeywords = [
      "रुको", "रुक जाओ", "रुकिए", "रुक", "चुप", "चुप रहो", "चुप हो जाओ",
      "शांत", "शांत हो जाओ", "बंद करो", "मत बोलो", "ठहरो", "बस", "बस करो",
      "रद्द", "नहीं", "मत करो", "रोको"
    ];

    for (const hkw of hindiKeywords) {
      if (clean.includes(hkw)) {
        return true;
      }
    }

    return false;
  }

  public handleBargeIn(reason = "User spoke"): void {
    this.stopSpeaking();
    this.setStatus("INTERRUPTED", "Barge-in: Agent stopped speaking. Listening to you...");

    // If an execution plan was mid-flight and user shouted stop
    if (this.activePlan && this.isInterruptionKeyword(this.lastSpokenInterim)) {
      this.replan("User requested halt");
    }
  }

  public stopSpeaking(): void {
    this.isCurrentlySpeaking = false;
    this.lastSpeakingEndTime = Date.now();

    // 1. Detach utterance handlers so no late callbacks fire
    if (this.currentUtterance) {
      this.currentUtterance.onend = null;
      this.currentUtterance.onerror = null;
      this.currentUtterance = null;
    }

    // 2. Clear speech queue in browser (pause-cancel-resume cycle fixes Chrome Windows deadlock)
    if (this.speechSynth) {
      try {
        this.speechSynth.pause();
        this.speechSynth.cancel();
        this.speechSynth.resume();
      } catch {}
    }

    // 3. Immediately unblock any awaiting speak() Promise!
    if (this.activeSpeakResolver) {
      const resolver = this.activeSpeakResolver;
      this.activeSpeakResolver = null;
      try {
        resolver();
      } catch {}
    }

    if (this.status === "SPEAKING" || this.status === "INTERRUPTED") {
      this.setStatus("STANDBY", "Continuous listening ready: 'Hey Parth'");
    }
  }

  // ==========================================
  // Spoken Text Processing & Intent Planning
  // ==========================================

  private async processSpokenText(spokenText: string) {
    const raw = spokenText.trim();
    if (!raw) return;

    // 0. Explicit interruption keyword ("ruko", "stop", "chup", "band karo", etc.)
    if (this.isInterruptionKeyword(raw)) {
      this.handleBargeIn("Explicit user interruption: " + raw);
      if (this.activePlan) {
        this.replan("User stopped: " + raw);
      } else {
        this.stopSpeaking();
        this.setStatus("STANDBY", "Stopped: " + raw);
      }
      return;
    }

    // 1. Check for Wake-Word: "Hey Parth" / "हे पार्थ" / "Parth" (supports "hey parth", "हे पार्थ", "parth", and "hey cms")
    const wakeRegex = /(?:^|\s)(?:hey|hay|hi|hello|हे|सुनो|नमस्ते|ok|okay)?\s*(?:parth|पार्थ|paarth|part|cms|सी\s*एम\s*एस|सी०एम०एस०|सीएमएस)(?:\s+agent|\s+एजेंट)?(?:\s*[,!?:-]*\s*|$)/i;
    const hasWakeWord = wakeRegex.test(raw);

    // If wake word is present, strip it out to extract the pure command
    let commandText = raw;
    if (hasWakeWord) {
      commandText = raw.replace(wakeRegex, "").trim();
    }

    // If user said ONLY "Hey Parth" / "हे पार्थ" / "Parth" without trailing command:
    if (hasWakeWord && !commandText) {
      this.handleBargeIn();
      this.setStatus("LISTENING", "Wake word recognized! Listening for command...");
      let greeting = "Jai Hind! Yes, I am Parth. I am listening, please give your command.";
      if (this.language === "hi-IN") {
        greeting = "जय हिन्द! मैं पार्थ हूँ, आदेश दें, मैं सुन रहा हूँ।";
      } else if (this.language === "hinglish") {
        greeting = "Jai Hind! Main Parth hoon. Batayein, kya command hai? Main sun raha hoon.";
      }
      await this.speak(greeting);
      return;
    }

    // If active plan is running and user gives new instructions:
    if (this.activePlan) {
      // Dynamic re-planning!
      await this.handleDynamicReplanning(raw);
      return;
    }

    // If wake word was not said, check if user is in active listening or spoke an actionable command
    if (!hasWakeWord) {
      // Check if utterance is an actionable command or user is in active listening mode
      const isActionable = /(?:kholo|open|dikhao|show|batao|search|dhundo|filter|darj|bharo|register|check|fir|complaint|shikayat|gd|rapat|roznamcha|bns|bnss|bail|challan|sho|io|munshi|affidavit|acts|telecom|prosecution|audit|print|save|seizure|arrest|next|back)/i.test(raw);
      if (isActionable || this.status === "LISTENING" || this.status === "STANDBY" || this.status === "INTERRUPTED") {
        commandText = raw;
      } else {
        return;
      }
    }

    // User gave: "Hey CMS <command>"
    this.handleBargeIn();
    await this.formulateAndExecutePlan(commandText);
  }

  // ==========================================
  // Plan Formulation & Multi-Step Execution
  // ==========================================

  private async formulateAndExecutePlan(command: string) {
    this.setStatus("PLANNING", `Planning: "${command}"`);

    // Match across 8 police modules
    const matchedRoute = DynamicModuleRegistry.matchIntentToRoute(command);
    const steps: ExecutionStep[] = [];
    let spokenAck = "";
    let completionSummary = "";

    // Specific Law Section Queries (e.g. BNS 303, BNSS 173)
    const lawMatch = command.match(/\b(?:bns|bnss|धारा|section)\s*(\d+)(?:\((\d+)\))?/i);
    if (lawMatch) {
      const sectionNum = lawMatch[1];
      let lawExplanation = "";
      if (sectionNum === "303") {
        if (this.language === "en-IN") {
          lawExplanation = "Section 303(2) BNS deals with Theft, corresponding to erstwhile Section 379 IPC.";
        } else if (this.language === "hinglish") {
          lawExplanation = "Section 303(2) BNS chori (theft) ke liye hai, jo purani Section 379 IPC ke barabar hai.";
        } else {
          lawExplanation = "धारा 303(2) BNS चोरी (Theft) के लिए है, जो पुरानी धारा 379 IPC के समतुल्य है।";
        }
      } else if (sectionNum === "173") {
        if (this.language === "en-IN") {
          lawExplanation = "Section 173 BNSS provides for the registration of FIR, corresponding to Section 154 CrPC.";
        } else if (this.language === "hinglish") {
          lawExplanation = "Section 173 BNSS FIR darj karne ka niyam hai, jo purani Section 154 CrPC ke barabar hai.";
        } else {
          lawExplanation = "धारा 173 BNSS एफआईआर दर्ज करने का वैधानिक प्रावधान है, जो पुरानी धारा 154 CrPC के समतुल्य है।";
        }
      } else if (sectionNum === "351") {
        if (this.language === "en-IN") {
          lawExplanation = "Section 351 BNS pertains to Criminal Intimidation, corresponding to Section 506 IPC.";
        } else if (this.language === "hinglish") {
          lawExplanation = "Section 351 BNS criminal intimidation (dhamki) ke liye hai, jo purani 506 IPC ke barabar hai.";
        } else {
          lawExplanation = "धारा 351 BNS आपराधिक धमकी (Criminal Intimidation) के लिए है, जो पुरानी 506 IPC के समतुल्य है।";
        }
      } else if (sectionNum === "115") {
        if (this.language === "en-IN") {
          lawExplanation = "Section 115 BNS pertains to voluntarily causing hurt, corresponding to Section 323 IPC.";
        } else if (this.language === "hinglish") {
          lawExplanation = "Section 115 BNS voluntarily hurt (chot pahunchane) ke liye hai, jo purani 323 IPC ke barabar hai.";
        } else {
          lawExplanation = "धारा 115 BNS स्वेच्छा से चोट पहुंचाने (Hurt) के लिए है, जो पुरानी 323 IPC के समतुल्य है।";
        }
      }

      if (lawExplanation) {
        const plan: VoicePlan = {
          originalCommand: command,
          cleanIntent: this.language === "en-IN" ? `Legal explanation for Section ${sectionNum}` : `Section ${sectionNum} legal lookup`,
          steps: [],
          spokenAcknowledgement: lawExplanation,
          completionSummary: lawExplanation,
          createdAt: Date.now(),
        };
        this.updatePlan(plan);
        await this.speak(lawExplanation);
        this.setStatus("STANDBY");
        return;
      }
    }

    // Role-Adaptive Dashboard requests
    if (/(?:sho|थाना प्रभारी)\s*(?:view|dashboard|पेंडेंसी|pendency)/i.test(command)) {
      if (this.language === "en-IN") {
        spokenAck = "Opening SHO Dashboard and 15-day overdue inquiries.";
        completionSummary = "SHO View active. Overdue inquiries and court affidavits displayed.";
      } else if (this.language === "hinglish") {
        spokenAck = "SHO Dashboard aur 15 din purani pendency kholi ja rahi hai.";
        completionSummary = "SHO View active hai. Overdue inquiries aur court affidavits screen par hain.";
      } else {
        spokenAck = "एसएचओ डैशबोर्ड एवं 15 दिन पुरानी पेंडेंसी खोली जा रही है।";
        completionSummary = "SHO View सक्रिय है। 15 दिन से पुरानी पेंडेंसी और कोर्ट एफिडेविट स्क्रीन पर हैं।";
      }
      steps.push({
        id: "nav_home",
        description: "Navigate to Dashboard",
        path: "/",
        status: "pending",
      });
      steps.push({
        id: "switch_sho",
        description: "Switch to SHO View",
        status: "pending",
      });
    } else if (/(?:io|विवेचक|जाँच अधिकारी)\s*(?:view|dashboard|रिमांड|remand)/i.test(command)) {
      if (this.language === "en-IN") {
        spokenAck = "Opening Investigating Officer (IO) view and 24-hour remand deadlines.";
        completionSummary = "IO View active. Active cases and 24-hour remand countdown displayed.";
      } else if (this.language === "hinglish") {
        spokenAck = "IO View aur 24 ghante remand deadline kholi ja rahi hai.";
        completionSummary = "IO View active hai. Aapke cases aur remand countdown screen par hain.";
      } else {
        spokenAck = "जाँच अधिकारी (IO) व्यू और 24-घंटे रिमांड डेडलाइन खोली जा रही है।";
        completionSummary = "IO View सक्रिय है। आपकी 6 विवेचनाएँ और 24-घंटे रिमांड डेडलाइन स्क्रीन पर हैं।";
      }
      steps.push({
        id: "nav_home",
        description: "Navigate to Dashboard",
        path: "/",
        status: "pending",
      });
      steps.push({
        id: "switch_io",
        description: "Switch to IO View",
        status: "pending",
      });
    } else if (/(?:munshi|मुंशी|संतरी|रोजनामचा)\s*(?:view|dashboard|desk)/i.test(command)) {
      if (this.language === "en-IN") {
        spokenAck = "Opening Munshi Desk and daily General Diary rapid entries.";
        completionSummary = "Munshi Desk active. 112 emergency dispatches and fresh complaints ready.";
      } else if (this.language === "hinglish") {
        spokenAck = "Munshi Desk aur roznamcha rapid entries open kar raha hoon.";
        completionSummary = "Munshi desk active hai. 112 dispatch aur new complaints ready hain.";
      } else {
        spokenAck = "मुंशी डेस्क और रोजनामचा त्वरित प्रविष्टियाँ खोली जा रही हैं।";
        completionSummary = "मुंशी डेस्क सक्रिय है। 112 डिस्पैच और नई शिकायतें तैयार हैं।";
      }
      steps.push({
        id: "nav_home",
        description: "Navigate to Dashboard",
        path: "/",
        status: "pending",
      });
      steps.push({
        id: "switch_munshi",
        description: "Switch to Munshi View",
        status: "pending",
      });
    } else if (/(?:60|90|challan|चालान|bail|ज़मानत|डेडलाइन|countdown)/i.test(command)) {
      // BNSS Challan Countdown request
      if (this.language === "en-IN") {
        spokenAck = "Opening BNSS 60/90-day statutory challan countdown and default bail alerts.";
        completionSummary = "Statutory Challan Countdown active. Monitor red alerts to prevent default bail risks.";
      } else if (this.language === "hinglish") {
        spokenAck = "BNSS 60/90 din challan countdown aur default bail alerts open ho rahe hain.";
        completionSummary = "Challan countdown active hai. Red alert cases turant check karein.";
      } else {
        spokenAck = "बीएनएसएस 60/90 दिन चालान डेडलाइन और डिफ़ॉल्ट ज़मानत अलर्ट खोले जा रहे हैं।";
        completionSummary = "चालान समय-सीमा काउंटर सक्रिय है। डिफ़ॉल्ट ज़मानत से बचने के लिए लाल अलर्ट वाले केस तुरंत चेक करें।";
      }
      steps.push({
        id: "nav_fir",
        description: "Navigate to FIR Module",
        path: "/fir",
        status: "pending",
      });
    } else if (matchedRoute) {
      // Matched one of the 8 Core Modules or Sub-routes
      const mod = DynamicModuleRegistry.getAllModules().find((m) => m.path === matchedRoute.path);
      const moduleTitle = this.language === "hi-IN" ? (mod?.titleHi || matchedRoute.title) : matchedRoute.title;
      if (this.language === "en-IN") {
        spokenAck = `Opening ${moduleTitle}...`;
        completionSummary = `${moduleTitle} is now displayed.`;
      } else if (this.language === "hinglish") {
        spokenAck = `${moduleTitle} open kiya ja raha hai...`;
        completionSummary = `${moduleTitle} screen par open ho gaya hai.`;
      } else {
        spokenAck = `${moduleTitle} खोला जा रहा है...`;
        completionSummary = `${moduleTitle} स्क्रीन पर उपलब्ध है।`;
      }

      steps.push({
        id: "navigate_module",
        description: `Navigate to ${moduleTitle} (${matchedRoute.path})`,
        path: matchedRoute.path,
        status: "pending",
      });

      // Check for follow-up actions like Search, Register, or Filter
      if (/(?:register|दर्ज|नई|new|form)/i.test(command)) {
        steps.push({
          id: "open_form",
          description: this.language === "en-IN" ? "Open Registration Form" : "पंजीकरण फॉर्म खोलें",
          status: "pending",
        });
        if (this.language === "en-IN") {
          completionSummary = `Registration form opened in ${moduleTitle}.`;
        } else if (this.language === "hinglish") {
          completionSummary = `${moduleTitle} me registration form open ho gaya hai.`;
        } else {
          completionSummary = `${moduleTitle} में पंजीकरण फॉर्म खोल दिया गया है।`;
        }
      } else if (/(?:search|खोजो|ढूंढो|फिल्टर|pending|पेंडिंग)/i.test(command)) {
        steps.push({
          id: "filter_records",
          description: this.language === "en-IN" ? "Apply search filter" : "सर्च फिल्टर लगाएं",
          status: "pending",
        });
        if (this.language === "en-IN") {
          completionSummary = `Records filtered in ${moduleTitle}.`;
        } else if (this.language === "hinglish") {
          completionSummary = `${moduleTitle} me records filter ho gaye hain.`;
        } else {
          completionSummary = `${moduleTitle} में रिकॉर्ड्स फ़िल्टर कर दिए गए हैं।`;
        }
      }
    } else {
      // Fallback: Custom application command
      if (this.language === "en-IN") {
        spokenAck = "Command acknowledged; executing now.";
        completionSummary = "Task completed.";
      } else if (this.language === "hinglish") {
        spokenAck = "Command samajh liya, execute kar raha hoon.";
        completionSummary = "Kaam complete ho gaya.";
      } else {
        spokenAck = "आदेश समझ लिया गया है, क्रियान्वित कर रहा हूँ।";
        completionSummary = "कार्य पूर्ण हुआ।";
      }
      steps.push({
        id: "general_action",
        description: command,
        status: "pending",
      });
    }

    const plan: VoicePlan = {
      originalCommand: command,
      cleanIntent: matchedRoute?.title || command,
      targetModule: matchedRoute
        ? DynamicModuleRegistry.getAllModules().find((m) => m.path === matchedRoute.path)
        : undefined,
      targetPath: matchedRoute?.path,
      steps,
      spokenAcknowledgement: spokenAck,
      completionSummary,
      createdAt: Date.now(),
    };

    this.updatePlan(plan);

    // Speak acknowledgement (barge-in enabled)
    await this.speak(spokenAck);

    // Execute steps sequentially
    await this.executePlanSteps(plan);
  }

  private async executePlanSteps(plan: VoicePlan) {
    this.setStatus("EXECUTING", `Executing: ${plan.cleanIntent}`);

    // If modal session command handler is attached, run it to execute website operator tasks
    let callbackAnswer = "";
    if (this.commandCallback) {
      try {
        callbackAnswer = await this.commandCallback(plan.originalCommand);
      } catch (err: any) {
        console.warn("[CmsVoiceEngine] Command callback error:", err?.message);
      }
    }

    for (let i = 0; i < plan.steps.length; i++) {
      // If plan was cancelled or replaced during barge-in, break out
      if (this.activePlan !== plan) {
        return;
      }

      const step = plan.steps[i];
      step.status = "running";
      this.updatePlan({ ...plan });

      try {
        if (step.path && this.navigateHandler) {
          this.navigateHandler(step.path);
          await new Promise((r) => setTimeout(r, 450));
        }

        // Handle specific step actions
        if (step.id === "switch_sho" || step.id === "switch_io" || step.id === "switch_munshi") {
          const roleBtn = document.querySelector<HTMLButtonElement>(
            step.id === "switch_sho" ? '[data-role-tab="SHO"]' : step.id === "switch_io" ? '[data-role-tab="IO"]' : '[data-role-tab="MUNSHI"]'
          );
          if (roleBtn) roleBtn.click();
        }

        step.status = "completed";
      } catch (err: any) {
        step.status = "failed";
        console.warn("[CmsVoiceEngine] Step execution note:", err?.message);
      }

      this.updatePlan({ ...plan });
    }

    // Complete summary: speak concise reply
    this.setStatus("SPEAKING", "Summarizing completion");
    const speechReply = callbackAnswer && callbackAnswer.length < 200
      ? callbackAnswer
      : plan.completionSummary;
    await this.speak(speechReply);
    this.emitTranscript("", true, "user"); // Clear input box after voice command execution
    this.setStatus("STANDBY", "Continuous listening ready: 'Hey Parth'");
  }

  // ==========================================
  // Dynamic Re-planning ("phir replan kr ke kaam kre")
  // ==========================================

  public async handleDynamicReplanning(newUtterance: string) {
    this.handleBargeIn("Replanning triggered by user utterance");
    this.setStatus("PLANNING", `Re-planning: "${newUtterance}"`);

    const oldPlan = this.activePlan;
    if (oldPlan) {
      oldPlan.steps.forEach((s) => {
        if (s.status === "pending" || s.status === "running") {
          s.status = "cancelled";
        }
      });
    }

    // Acknowledge change of plan immediately
    const replanAck = this.language.startsWith("hi")
      ? `प्लान बदला: ${newUtterance} के अनुसार काम कर रहा हूँ...`
      : `Plan updated: adjusting to "${newUtterance}"...`;

    await this.speak(replanAck);
    await this.formulateAndExecutePlan(newUtterance);
  }

  public replan(reason = "User cancellation"): void {
    if (this.activePlan) {
      this.activePlan.steps.forEach((s) => {
        if (s.status === "pending" || s.status === "running") {
          s.status = "cancelled";
        }
      });
      this.updatePlan(null);
    }
    this.stopSpeaking();
    this.setStatus("STANDBY", "Plan halted: " + reason);
  }

  // ==========================================
  // Text-to-Speech Audio Playback
  // ==========================================

  public cleanTextForSpeech(text: string): string {
    if (!text) return "";
    let clean = text
      .replace(/\*\*(.*?)\*\*/g, "$1") // Bold
      .replace(/\*(.*?)\*/g, "$1")     // Italic
      .replace(/`([^`]+)`/g, "$1")     // Inline code
      .replace(/```[\s\S]*?```/g, "")  // Code blocks
      .replace(/#+\s+/g, "")           // Headings
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // Links
      .replace(/[-*•]\s+/g, "")        // Bullets
      .replace(/[|>\\]/g, " ")         // Table dividers / quotes
      .replace(/[\u{1F300}-\u{1F9FF}]/gu, "") // Emojis
      .replace(/\s+/g, " ")
      .trim();

    // Limit to natural conversational sentence length (max ~200 characters)
    if (clean.length > 200) {
      const sentenceEnd = clean.search(/[.!?।](?:\s|$)/);
      if (sentenceEnd > 40 && sentenceEnd <= 200) {
        clean = clean.slice(0, sentenceEnd + 1);
      } else {
        const sub = clean.slice(0, 190);
        const lastSpace = sub.lastIndexOf(" ");
        clean = (lastSpace > 40 ? sub.slice(0, lastSpace) : sub) + "...";
      }
    }
    return clean;
  }

  public async speak(text: string): Promise<void> {
    if (!text || typeof window === "undefined" || !this.speechSynth) return;

    // Immediately stop any existing speech and clean up old resolver
    this.stopSpeaking();

    const cleanSpoken = this.cleanTextForSpeech(text);
    if (!cleanSpoken) return;

    this.isCurrentlySpeaking = true;

    // Track active spoken phrase and tokens for acoustic echo suppression
    const norm = cleanSpoken.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()?"'।]/g, " ").trim();
    this.activeSpokenPhrases.add(norm);
    const tokens = norm.split(/\s+/).filter((w) => w.length > 1);
    tokens.forEach((w) => this.spokenWordsHistory.add(w));

    setTimeout(() => {
      this.activeSpokenPhrases.delete(norm);
      if (this.activeSpokenPhrases.size === 0) {
        this.spokenWordsHistory.clear();
      }
    }, 4000);

    this.setStatus("SPEAKING", cleanSpoken);
    this.emitTranscript(cleanSpoken, true, "agent");

    return new Promise((resolve) => {
      this.activeSpeakResolver = resolve;

      const utterance = new SpeechSynthesisUtterance(cleanSpoken);
      this.currentUtterance = utterance;
      utterance.lang = this.language === "hi-IN" ? "hi-IN" : "en-IN";
      utterance.rate = 1.05;
      utterance.pitch = 1.0;

      // Select best voice matching selected language
      try {
        const voices = this.speechSynth?.getVoices() || [];
        let preferredVoice: SpeechSynthesisVoice | undefined;
        if (this.language === "hi-IN") {
          preferredVoice = voices.find(
            (v) => v.lang.includes("hi") || v.name.includes("Hindi") || v.name.includes("Swara") || v.name.includes("Kalpana")
          );
        } else if (this.language === "en-IN") {
          preferredVoice = voices.find(
            (v) => v.lang.includes("en-IN") || v.name.includes("India") || v.name.includes("Heera") || v.name.includes("Ravi")
          ) || voices.find((v) => v.lang.startsWith("en"));
        } else {
          // hinglish: prefer Indian English voice that articulates Hinglish phonetics
          preferredVoice = voices.find(
            (v) => v.lang.includes("en-IN") || v.name.includes("India")
          ) || voices.find((v) => v.lang.includes("hi"));
        }
        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }
      } catch {}

      utterance.onend = () => {
        if (this.currentUtterance === utterance) {
          this.currentUtterance = null;
        }
        this.isCurrentlySpeaking = false;
        this.lastSpeakingEndTime = Date.now();
        if (this.activeSpeakResolver === resolve) {
          this.activeSpeakResolver = null;
        }
        resolve();
      };

      utterance.onerror = () => {
        if (this.currentUtterance === utterance) {
          this.currentUtterance = null;
        }
        this.isCurrentlySpeaking = false;
        this.lastSpeakingEndTime = Date.now();
        if (this.activeSpeakResolver === resolve) {
          this.activeSpeakResolver = null;
        }
        resolve();
      };

      try {
        if (this.speechSynth) {
          this.speechSynth.speak(utterance);
        } else {
          this.isCurrentlySpeaking = false;
          if (this.activeSpeakResolver === resolve) {
            this.activeSpeakResolver = null;
          }
          resolve();
        }
      } catch {
        this.isCurrentlySpeaking = false;
        if (this.activeSpeakResolver === resolve) {
          this.activeSpeakResolver = null;
        }
        resolve();
      }
    });
  }
}

export const CmsVoiceEngine = new CmsVoiceEngineClass();
