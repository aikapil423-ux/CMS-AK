"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Maximize2,
  Minimize2,
  Mic,
  MicOff,
  Send,
  Sparkles,
  Paperclip,
  CheckCircle2,
  AlertCircle,
  FileText,
  Printer,
  Shield,
  Loader2,
  RotateCcw,
  Bot,
  ExternalLink,
  ChevronRight,
  Eye,
  Check,
  Volume2,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { CmsAgentService } from "@/services/agent/cmsAgentService";
import { AgentMessage, ProposedDocument } from "@/types/cmsAgent";
import { printA4Element } from "@/utils/printElement";
import { InteractiveTemplateDraftCard } from "./InteractiveTemplateDraftCard";

interface CmsAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  anchorPosition: { x: number; y: number };
}

export function CmsAgentModal({ isOpen, onClose }: CmsAgentModalProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser } = useAuth();

  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechLang, setSpeechLang] = useState<"hi-IN" | "en-IN">("hi-IN");
  const [previewDoc, setPreviewDoc] = useState<ProposedDocument | null>(null);
  const [executingPlanId, setExecutingPlanId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = speechLang;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);

      recognition.onresult = (event: any) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (event.results[0].isFinal) {
          setInputText(transcript);
          // Auto submit if clear voice command
          if (transcript.trim().length > 3) {
            handleSendMessage(transcript.trim());
          }
        } else {
          setInputText(transcript);
        }
      };

      recognitionRef.current = recognition;
    }
  }, [speechLang]);

  // Initial welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: "welcome_msg",
          sender: "agent",
          text: `जय हिन्द! मैं **हरियाणा पुलिस CMS Universal AI Operating Agent (संचालित: Gemini 3.6 Flash)** हूँ। मुझे इस वेबसाइट के संपूर्ण फ्रंटएंड (मॉड्यूल्स, पेजेस, फॉर्म्स), बैकएंड APIs और डेटाबेस की पूर्ण समझ है।\n\nआप किसी भी केस, FIR, गिरफ़्तारी, ज़िमनी, रोजनामचा (GD), शिकायत, या कानूनी धाराओं के संबंध में बोलकर अथवा लिखकर निर्देश दे सकते हैं।\n\n* **फॉर्म / डायलॉग खोलना:** सीधे बोलें, यह बिना किसी अनुमति के तुरंत खुल जाएगा।\n* **कानूनी दस्तावेज़ तैयार करना:** आपकी स्पष्ट स्वीकृति (Approval) के बाद ही सुरक्षित किया जाएगा।*`,
          timestamp: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
          suggestedPrompts: [
            "Register complaint form kholo",
            "Add entry daailogue box kholo",
            "FIR 125: Anil Kumar arrest docs banao",
            "Role switcher dialogue kholo",
          ],
        },
      ]);
    }
  }, []);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Voice recognition is not supported in this browser. Please use Chrome/Edge.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.lang = speechLang;
        recognitionRef.current.start();
      } catch (err) {
        console.error("Speech recognition error:", err);
      }
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend !== undefined ? textToSend : inputText;
    if (!text.trim() || isLoading) return;

    const userMsg: AgentMessage = {
      id: `usr_${Date.now()}`,
      sender: "user",
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsLoading(true);

    try {
      const response = await CmsAgentService.processUserInput(text.trim(), pathname);
      setMessages((prev) => [...prev, response]);

      // Immediate auto-execution for Form Field Fill, Navigation, or Modal Open/Close commands (Zero Permission Required)
      const plan = response.actionPlan;
      if (plan) {
        const toolName = plan.executablePayload?.toolName;
        const params = plan.executablePayload?.parameters || {};
        const targetUrl = params.url || plan.targetRecords?.[0]?.url;

        if (toolName === "fill_gd_form" || toolName === "update_field") {
          try {
            sessionStorage.setItem("cms_agent_pending_gd_autofill", JSON.stringify(params));
          } catch {
            // ignore storage errors
          }
          window.dispatchEvent(new CustomEvent("cms-agent-gd-autofill", { detail: params }));
          window.dispatchEvent(new CustomEvent("cms-agent-fill-field", { detail: params }));

          if (params.url && pathname !== params.url) {
            setTimeout(() => {
              router.push(params.url);
            }, 250);
          }
        } else if (toolName === "navigate" || (plan.status === "EXECUTED" && targetUrl && !targetUrl.startsWith("MODAL:"))) {
          if (targetUrl) {
            setTimeout(() => {
              router.push(targetUrl);
              onClose();
            }, 400);
          }
        } else if (toolName === "open_modal" || targetUrl === "MODAL:ROLE_SWITCHER") {
          const modalEvent = params.modalEvent || "cms-open-role-switcher";
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent(modalEvent));
            onClose();
          }, 400);
        } else if (toolName === "close_modal") {
          setTimeout(() => {
            onClose();
          }, 400);
        }
      }
    } catch (err) {
      console.error("Agent error:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          sender: "agent",
          text: "माफ़ करें, निर्देश को प्रोसेस करने में समस्या हुई। कृपया दोबारा प्रयास करें।",
          timestamp: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprovePlan = async (planId: string, actionPlan?: any) => {
    const toolName = actionPlan?.executablePayload?.toolName;
    const params = actionPlan?.executablePayload?.parameters || {};
    const targetUrl = params.url || actionPlan?.targetRecords?.[0]?.url;

    if (toolName === "fill_gd_form" || toolName === "update_field") {
      try {
        sessionStorage.setItem("cms_agent_pending_gd_autofill", JSON.stringify(params));
      } catch {
        // ignore
      }
      window.dispatchEvent(new CustomEvent("cms-agent-gd-autofill", { detail: params }));
      window.dispatchEvent(new CustomEvent("cms-agent-fill-field", { detail: params }));
      if (params.url && pathname !== params.url) {
        router.push(params.url);
      }
      return;
    }

    if (toolName === "open_modal" || targetUrl === "MODAL:ROLE_SWITCHER") {
      const modalEvent = params.modalEvent || "cms-open-role-switcher";
      window.dispatchEvent(new CustomEvent(modalEvent));
      onClose();
      return;
    }

    if (toolName === "navigate") {
      if (targetUrl) {
        router.push(targetUrl);
        onClose();
        return;
      }
    }

    setExecutingPlanId(planId);
    setIsLoading(true);
    try {
      const resultMsg = await CmsAgentService.executeActionPlan(planId);
      setMessages((prev) => [...prev, resultMsg]);
      const resTool = resultMsg.actionPlan?.executablePayload?.toolName;
      const resParams = resultMsg.actionPlan?.executablePayload?.parameters || {};
      if (resTool === "fill_gd_form" || resTool === "update_field") {
        window.dispatchEvent(new CustomEvent("cms-agent-gd-autofill", { detail: resParams }));
        window.dispatchEvent(new CustomEvent("cms-agent-fill-field", { detail: resParams }));
      } else if (resTool === "navigate") {
        const dest = resParams.url;
        if (dest) {
          router.push(dest);
          onClose();
        }
      } else if (resTool === "open_modal") {
        window.dispatchEvent(new CustomEvent("cms-open-role-switcher"));
        onClose();
      }
    } catch (err) {
      console.error("Plan execution error:", err);
    } finally {
      setIsLoading(false);
      setExecutingPlanId(null);
    }
  };

  const handleCancelPlan = (planId: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `cancel_${Date.now()}`,
        sender: "agent",
        text: "प्रस्तावित एक्शन प्लान को रद्द कर दिया गया है। कोई भी बदलाव नहीं किया गया। आप नया निर्देश दे सकते हैं।",
        timestamp: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
        suggestedPrompts: ["FIR 125 kholo", "GD Draft karo", "Search Complaints"],
      },
    ]);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const isAudio = file.type.startsWith("audio/");

    handleSendMessage(`[Uploaded ${isAudio ? "Audio File" : "Document"}: ${file.name}] कृपया इस फ़ाइल के आधार पर केस रिकॉर्ड्स का विश्लेषण करें।`);
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed z-50 transition-all duration-300 ease-out flex flex-col bg-white border border-slate-300 shadow-2xl rounded-2xl overflow-hidden ${
        isExpanded
          ? "inset-4 sm:inset-8 max-w-6xl mx-auto"
          : "right-4 sm:right-6 bottom-4 sm:bottom-6 w-[94vw] sm:w-[480px] h-[85vh] max-h-[720px]"
      }`}
    >
      {/* Header Bar */}
      <div className="bg-[#081225] text-white p-3.5 flex items-center justify-between border-b border-indigo-900/50 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center border border-blue-400/40 shadow-sm">
            <Bot className="w-4.5 h-4.5 text-blue-100" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-xs tracking-tight">Haryana Police CMS AI Agent</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-500/30 text-blue-200 border border-blue-400/30 font-mono">
                Gemini 3.6 Flash
              </span>
            </div>
            <p className="text-[10px] text-slate-300 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {currentUser?.stationName || "Police Station"} • {currentUser?.district || "Haryana"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Language Toggle for Voice */}
          <button
            type="button"
            onClick={() => setSpeechLang((prev) => (prev === "hi-IN" ? "en-IN" : "hi-IN"))}
            className="text-[10px] font-semibold px-2 py-1 rounded bg-slate-800 text-blue-200 hover:bg-slate-700 transition cursor-pointer border border-slate-700"
            title="Toggle Voice Input Language"
          >
            {speechLang === "hi-IN" ? "हिंदी (Voice)" : "English"}
          </button>

          {/* Expand/Collapse Toggle */}
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
            title={isExpanded ? "Collapse to compact" : "Expand workspace"}
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Workspace Area */}
      <div className="flex-1 flex overflow-hidden bg-slate-50">
        {/* Chat Stream Column */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.sender === "agent" && (
                  <div className="w-6 h-6 rounded-md bg-[#081225] flex items-center justify-center shrink-0 border border-slate-300 mt-0.5">
                    <Shield className="w-3.5 h-3.5 text-blue-400" />
                  </div>
                )}

                <div
                  className={`max-w-[88%] rounded-2xl p-3.5 shadow-xs leading-relaxed ${
                    msg.sender === "user"
                      ? "bg-blue-700 text-white rounded-tr-xs"
                      : "bg-white text-slate-800 border border-slate-200 rounded-tl-xs"
                  }`}
                >
                  {/* Text Body */}
                  <div className="whitespace-pre-wrap font-sans text-xs space-y-1">
                    {msg.text.split("\n\n").map((para, i) => (
                      <p key={i}>{para}</p>
                    ))}
                  </div>

                  {/* ACTION PLAN CARD */}
                  {msg.actionPlan && (
                    <div className="mt-3.5 pt-3 border-t border-slate-200 space-y-3 bg-slate-50/80 -mx-3.5 -mb-3.5 p-3.5 rounded-b-2xl">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[11px] text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                          Proposed Action Plan
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                          Awaiting Explicit Approval
                        </span>
                      </div>

                      {/* Intent Understood */}
                      <div className="p-2.5 bg-blue-50/70 rounded-xl border border-blue-200 text-blue-950 space-y-1">
                        <span className="font-bold text-[10px] text-blue-800 uppercase block">
                          AI ने क्या समझा (Understood Intent):
                        </span>
                        <p className="text-[11px] leading-snug">{msg.actionPlan.understoodIntent}</p>
                      </div>

                      {/* Proposed Documents Suite */}
                      {msg.actionPlan.proposedDocuments && msg.actionPlan.proposedDocuments.length > 0 && (() => {
                        const noticeDoc = msg.actionPlan!.proposedDocuments!.find(
                          (d) =>
                            d.templateType?.toLowerCase().includes("notice") ||
                            d.templateType?.toLowerCase().includes("summons") ||
                            d.title?.toLowerCase().includes("notice") ||
                            d.templateType === "BNSS_35_3_NOTICE"
                        );
                        const otherDocs = noticeDoc
                          ? msg.actionPlan!.proposedDocuments!.filter((d) => d.id !== noticeDoc.id)
                          : msg.actionPlan!.proposedDocuments!;

                        return (
                          <div className="space-y-2">
                            {/* Interactive Template & Draft Card with bilingual toggle */}
                            {noticeDoc && (
                              <div className="my-1.5">
                                <InteractiveTemplateDraftCard
                                  initialComplainantName={
                                    msg.moduleContext?.activePersonName ||
                                    (noticeDoc.recipientOrSubject?.replace(/\(.*?\)/g, "").trim()) ||
                                    "Anil Kumar"
                                  }
                                  initialCaseNumber={
                                    msg.moduleContext?.activeFirNumber ||
                                    msg.moduleContext?.activeComplaintNumber ||
                                    "125/2026"
                                  }
                                  templateType={noticeDoc.templateType}
                                  templateTitle={noticeDoc.title}
                                  policeStation={currentUser?.stationName || "Sector 14 Hisar"}
                                  onApproveAndSave={() => handleApprovePlan(msg.actionPlan!.id, msg.actionPlan)}
                                />
                              </div>
                            )}

                            {otherDocs.length > 0 && (
                              <div className="space-y-1.5">
                                <span className="font-bold text-[10px] text-slate-700 uppercase block">
                                  {noticeDoc
                                    ? `अन्य संलग्न विधिक प्रपत्र (${otherDocs.length} Documents):`
                                    : `तैयार किए जाने वाले कानूनी दस्तावेज़ (${otherDocs.length} Documents):`}
                                </span>
                                <div className="grid grid-cols-1 gap-1.5">
                                  {otherDocs.map((doc) => (
                                    <div
                                      key={doc.id}
                                      className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200 hover:border-blue-400 transition"
                                    >
                                      <div className="flex items-center gap-2 overflow-hidden">
                                        <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                        <div className="min-w-0">
                                          <p className="font-bold text-slate-900 text-[11px] truncate">
                                            {doc.title}
                                          </p>
                                          <p className="text-[10px] text-slate-500 truncate">
                                            {doc.recipientOrSubject}
                                          </p>
                                        </div>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => setPreviewDoc(doc)}
                                        className="px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-[10px] font-semibold shrink-0 flex items-center gap-1 cursor-pointer border border-blue-200"
                                      >
                                        <Eye className="w-3 h-3" />
                                        Preview
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* Missing Information Notice if any */}
                      {msg.actionPlan.missingInformation && msg.actionPlan.missingInformation.length > 0 && (
                        <div className="p-2 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 text-[10px] space-y-0.5">
                          <span className="font-bold flex items-center gap-1 text-amber-800">
                            <AlertCircle className="w-3 h-3 text-amber-600" />
                            सत्यापन हिदायत (Verification Notice):
                          </span>
                          {msg.actionPlan.missingInformation.map((info, idx) => (
                            <p key={idx}>• {info}</p>
                          ))}
                        </div>
                      )}

                      {/* Action Plan Approval Buttons */}
                      <div className="pt-2 flex items-center gap-2 flex-wrap">
                        {(() => {
                          const toolName = msg.actionPlan!.executablePayload?.toolName;
                          const targetUrl =
                            msg.actionPlan!.executablePayload?.parameters?.url ||
                            msg.actionPlan!.targetRecords?.[0]?.url;
                          const isModal =
                            toolName === "open_modal" ||
                            targetUrl === "MODAL:ROLE_SWITCHER" ||
                            targetUrl?.startsWith("MODAL:");
                          const isNavigation =
                            toolName === "navigate" ||
                            (Boolean(targetUrl) && !isModal);

                          return (
                            <>
                              {msg.actionPlan!.status === "EXECUTED" ? (
                                <div className="flex items-center justify-between w-full p-2 bg-emerald-50 rounded-xl border border-emerald-200">
                                  <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                    {isModal ? "डायलॉग बॉक्स खोला गया (Executed)" : isNavigation ? "पेज / फॉर्म खोला गया (Opened)" : "कार्यवाही पूर्ण (Executed & Saved)"}
                                  </span>
                                  {targetUrl && !isModal && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        router.push(targetUrl);
                                        onClose();
                                      }}
                                      className="py-1 px-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-[11px] transition flex items-center gap-1 cursor-pointer"
                                    >
                                      <ExternalLink className="w-3 h-3" />
                                      पेज पर जाएं
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <>
                                  {isNavigation || isModal ? (
                                    <button
                                      type="button"
                                      onClick={() => handleApprovePlan(msg.actionPlan!.id, msg.actionPlan)}
                                      className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                                    >
                                      <ExternalLink className="w-3.5 h-3.5" />
                                      {isModal
                                        ? "डायलॉग बॉक्स खोलें (Open Dialog) ➜"
                                        : "फॉर्म / पेज अभी खोलें (Open Form Now) ➜"}
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleApprovePlan(msg.actionPlan!.id, msg.actionPlan)}
                                      disabled={isLoading}
                                      className="flex-1 py-2 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                                    >
                                      {executingPlanId === msg.actionPlan!.id ? (
                                        <>
                                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                          सुरक्षित किया जा रहा है...
                                        </>
                                      ) : (
                                        <>
                                          <CheckCircle2 className="w-3.5 h-3.5" />
                                          Approve (स्वीकृत करें)
                                        </>
                                      )}
                                    </button>
                                  )}

                                  {targetUrl && !isModal && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        router.push(targetUrl);
                                        onClose();
                                      }}
                                      className="py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-xl font-semibold text-xs transition flex items-center gap-1 cursor-pointer border border-blue-300"
                                      title="Open directly and close modal"
                                    >
                                      <ExternalLink className="w-3.5 h-3.5" />
                                      पेज पर जाएं
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => handleCancelPlan(msg.actionPlan!.id)}
                                    className="py-2 px-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-semibold text-xs transition cursor-pointer"
                                  >
                                    Cancel (रद्द करें)
                                  </button>
                                </>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  )}

                  {/* Suggestion Chips */}
                  {msg.suggestedPrompts && (
                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center gap-1.5 flex-wrap">
                      {msg.suggestedPrompts.map((chip, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handleSendMessage(chip)}
                          className="px-2 py-0.5 rounded-full bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 border border-slate-200 text-[10px] font-medium transition cursor-pointer"
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                  )}

                  <span className="block text-[9px] text-right mt-1 opacity-60">
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2 items-center text-slate-500 text-xs italic">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                <span>AI Agent केस रिकॉर्ड्स का विश्लेषण कर रहा है...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input & Voice Controls Bar */}
          <div className="p-3 bg-white border-t border-slate-200 space-y-2 shrink-0">
            {/* Live voice status notice */}
            {isListening && (
              <div className="p-1.5 bg-red-50 border border-red-200 rounded-lg text-red-700 text-[11px] flex items-center justify-between animate-pulse">
                <span className="flex items-center gap-1.5 font-semibold">
                  <Mic className="w-3.5 h-3.5 text-red-600" />
                  आवाज़ सुनी जा रही है ({speechLang === "hi-IN" ? "हिंदी" : "English"})... बोलिए...
                </span>
                <button
                  type="button"
                  onClick={toggleListening}
                  className="text-xs text-red-800 underline font-bold cursor-pointer"
                >
                  Stop
                </button>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              {/* File Attachment Hidden Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*,.pdf,.docx,.png,.jpg"
                className="hidden"
                onChange={handleFileUpload}
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                title="Attach Audio or Document"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              {/* Live Microphone Button */}
              <button
                type="button"
                onClick={toggleListening}
                className={`p-2 rounded-xl transition cursor-pointer ${
                  isListening
                    ? "bg-red-600 text-white animate-pulse"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
                title={isListening ? "Stop listening" : "Click to speak (Voice input)"}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              {/* Text Input */}
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="निर्देश दें (उदा. FIR 125: Anil Kumar arrest memo banao)..."
                disabled={isLoading}
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/40 focus:border-blue-600"
              />

              {/* Send Button */}
              <button
                type="submit"
                disabled={!inputText.trim() || isLoading}
                className="p-2 bg-[#081225] hover:bg-blue-900 text-white rounded-xl transition disabled:opacity-40 cursor-pointer shadow-xs"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* DOCUMENT PREVIEW DRAWER (If User Clicks Preview) */}
        {previewDoc && (
          <div className="w-full sm:w-[500px] border-l border-slate-300 bg-white flex flex-col shrink-0 shadow-lg animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-3 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2 overflow-hidden">
                <FileText className="w-4 h-4 text-blue-300 shrink-0" />
                <span className="font-bold text-xs truncate">{previewDoc.title}</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    const printBox = document.getElementById("agent-doc-preview-content");
                    if (printBox) {
                      printA4Element(printBox, previewDoc.title);
                    }
                  }}
                  className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-semibold flex items-center gap-1 cursor-pointer"
                  title="Print A4 Document"
                >
                  <Printer className="w-3 h-3" />
                  Print
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="p-1 text-slate-300 hover:text-white rounded hover:bg-white/10"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Document Content View */}
            <div
              id="agent-doc-preview-content"
              className="flex-1 overflow-y-auto p-4 bg-slate-100"
            >
              <div
                className="bg-white p-6 shadow-xs border border-slate-200 min-h-[500px] text-xs leading-relaxed"
                dangerouslySetInnerHTML={{ __html: previewDoc.previewHtml || "<p>दस्तावेज़ उपलब्ध नहीं।</p>" }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
