"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Mic,
  MicOff,
  Languages,
  Copy,
  Check,
  Trash2,
  X,
  CornerDownLeft,
  ChevronDown,
  Volume2,
  Sparkles,
  Info,
} from "lucide-react";

export type DictationLanguage = "hi-IN" | "en-IN";

interface TopBarDictationProps {
  isMobile?: boolean;
}

export function TopBarDictation({ isMobile = false }: TopBarDictationProps) {
  const [isSupported, setIsSupported] = useState(true);
  const [selectedLang, setSelectedLang] = useState<DictationLanguage>("hi-IN");
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState("");
  const [accumulatedText, setAccumulatedText] = useState("");
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [insertedNotice, setInsertedNotice] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeFieldName, setActiveFieldName] = useState<string>("");

  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);
  const selectedLangRef = useRef<DictationLanguage>("hi-IN");
  const lastTargetElRef = useRef<HTMLInputElement | HTMLTextAreaElement | HTMLElement | null>(null);
  const lastFinalTranscriptRef = useRef("");
  const panelRef = useRef<HTMLDivElement | null>(null);

  // Sync ref with state
  useEffect(() => {
    selectedLangRef.current = selectedLang;
  }, [selectedLang]);

  // Load language preference from localStorage
  useEffect(() => {
    try {
      const savedLang = localStorage.getItem("cms_dictation_lang") as DictationLanguage;
      if (savedLang === "hi-IN" || savedLang === "en-IN") {
        setSelectedLang(savedLang);
        selectedLangRef.current = savedLang;
      }
    } catch {
      // ignore
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
    }
  }, []);

  // Track the most recently focused form input or textarea anywhere on the page
  useEffect(() => {
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      // Ignore focus within our own dictation scratchpad
      if (panelRef.current && panelRef.current.contains(target)) {
        return;
      }

      if (
        (target.tagName === "INPUT" &&
          !["button", "submit", "checkbox", "radio", "file"].includes(
            (target as HTMLInputElement).type
          )) ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        lastTargetElRef.current = target;
        const name =
          target.getAttribute("aria-label") ||
          target.getAttribute("placeholder") ||
          (target as HTMLInputElement).name ||
          target.id ||
          (target.tagName === "TEXTAREA" ? "Textarea" : "Input Field");
        setActiveFieldName(name.slice(0, 35));
      }
    };

    document.addEventListener("focusin", handleFocusIn);
    return () => document.removeEventListener("focusin", handleFocusIn);
  }, []);

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        isPanelOpen &&
        panelRef.current &&
        !panelRef.current.contains(e.target as Node)
      ) {
        // Only close if not listening
        if (!isListeningRef.current) {
          setIsPanelOpen(false);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isPanelOpen]);

  // Safely insert text into focused DOM input/textarea with React synthetic event triggering
  const insertTextIntoActiveElement = useCallback((textToInsert: string) => {
    const el = lastTargetElRef.current;
    if (!el || !document.body.contains(el)) return false;

    try {
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
        el.focus();
        const start = el.selectionStart ?? el.value.length;
        const end = el.selectionEnd ?? el.value.length;
        const currentVal = el.value || "";

        // Check if whitespace is needed between existing and new text
        const needSpace =
          start > 0 &&
          !/\s$/.test(currentVal.slice(0, start)) &&
          !/^\s/.test(textToInsert);
        const prefix = needSpace ? " " : "";
        const nextVal =
          currentVal.slice(0, start) + prefix + textToInsert + currentVal.slice(end);

        // React 16+ controlled input bypass: call prototype setter
        const proto =
          el instanceof HTMLTextAreaElement
            ? window.HTMLTextAreaElement.prototype
            : window.HTMLInputElement.prototype;
        const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
        if (setter) {
          setter.call(el, nextVal);
        } else {
          el.value = nextVal;
        }

        const newPos = start + prefix.length + textToInsert.length;
        el.setSelectionRange?.(newPos, newPos);

        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
        return true;
      } else if (el.isContentEditable) {
        el.focus();
        document.execCommand?.("insertText", false, textToInsert);
        return true;
      }
    } catch (err) {
      console.warn("Failed to insert text into active element:", err);
    }
    return false;
  }, []);

  // Cleanup speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  // Start speech recognition
  const startListening = useCallback(
    (langOverride?: DictationLanguage) => {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (!SpeechRecognition) {
        setIsSupported(false);
        alert(
          "वॉइस डिक्टेशन के लिए Web Speech API समर्थित ब्राउज़र (Google Chrome या Microsoft Edge) की आवश्यकता है।"
        );
        return;
      }

      // Stop previous instance if running
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
        recognitionRef.current = null;
      }

      setErrorMessage(null);
      lastFinalTranscriptRef.current = "";

      const langToUse = langOverride || selectedLangRef.current;

      try {
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = langToUse;

        recognition.onstart = () => {
          setIsListening(true);
          isListeningRef.current = true;
          setErrorMessage(null);
        };

        recognition.onresult = (event: any) => {
          let currentInterim = "";
          let finalChunk = "";

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0]?.transcript || "";
            if (event.results[i].isFinal) {
              finalChunk += " " + transcript;
            } else {
              currentInterim += " " + transcript;
            }
          }

          setInterimText(currentInterim.trim());

          if (finalChunk.trim()) {
            const cleanFinal = finalChunk.trim();
            if (cleanFinal !== lastFinalTranscriptRef.current) {
              lastFinalTranscriptRef.current = cleanFinal;

              // Append to accumulated text in scratchpad
              setAccumulatedText((prev) => (prev ? prev + " " + cleanFinal : cleanFinal));

              // Direct insertion into active input field
              const inserted = insertTextIntoActiveElement(cleanFinal);
              if (inserted) {
                setInsertedNotice(true);
                setTimeout(() => setInsertedNotice(false), 2500);
              }
            }
          }
        };

        recognition.onerror = (event: any) => {
          const code = event?.error;
          if (code === "no-speech") {
            // Keep listening, do not abort
            return;
          }
          if (code === "aborted") {
            return;
          }
          if (code === "not-allowed") {
            setErrorMessage(
              "माइक्रोफ़ोन अनुमति नहीं मिली। कृपया ब्राउज़र सेटिंग्स में माइक्रोफ़ोन की अनुमति दें।"
            );
          } else if (code === "network") {
            setErrorMessage("नेटवर्क त्रुटि: इंटरनेट कनेक्शन की जाँच करें।");
          } else {
            setErrorMessage(`माइक त्रुटि: ${code}`);
          }
          setIsListening(false);
          isListeningRef.current = false;
        };

        recognition.onend = () => {
          // If still meant to be listening (user didn't click stop), restart for continuous dictation
          if (isListeningRef.current) {
            try {
              recognition.start();
            } catch {
              setIsListening(false);
              isListeningRef.current = false;
            }
          } else {
            setIsListening(false);
            setInterimText("");
          }
        };

        recognition.start();
        setIsListening(true);
        isListeningRef.current = true;
      } catch (err) {
        console.error("Speech recognition start failed:", err);
        setIsListening(false);
        isListeningRef.current = false;
      }
    },
    [insertTextIntoActiveElement]
  );

  // Stop speech recognition
  const stopListening = useCallback(() => {
    isListeningRef.current = false;
    setIsListening(false);
    setInterimText("");
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
  }, []);

  // Toggle listening state
  const handleToggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      setIsPanelOpen(true);
      startListening();
    }
  };

  // Change language: Hindi / English
  const handleSelectLang = (lang: DictationLanguage) => {
    setSelectedLang(lang);
    selectedLangRef.current = lang;
    try {
      localStorage.setItem("cms_dictation_lang", lang);
    } catch {
      // ignore
    }

    // If currently listening, seamlessly switch language by restarting recognition
    if (isListeningRef.current) {
      stopListening();
      setTimeout(() => {
        startListening(lang);
      }, 150);
    }
  };

  // Copy text to clipboard
  const handleCopy = () => {
    const textToCopy = (accumulatedText + " " + interimText).trim();
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Manual insertion into currently active field
  const handleManualInsert = () => {
    const textToInsert = (accumulatedText + " " + interimText).trim();
    if (!textToInsert) return;
    const ok = insertTextIntoActiveElement(textToInsert);
    if (ok) {
      setInsertedNotice(true);
      setTimeout(() => setInsertedNotice(false), 2500);
    } else {
      alert("कृपया पहले किसी इनपुट या विवरण फ़ील्ड (Textarea) पर क्लिक करें।");
    }
  };

  // Clear scratchpad
  const handleClear = () => {
    setAccumulatedText("");
    setInterimText("");
    lastFinalTranscriptRef.current = "";
  };

  return (
    <div className="relative inline-flex items-center" ref={panelRef}>
      {/* Top Bar Dictation Controls */}
      <div className="flex items-center gap-1 bg-slate-100/90 hover:bg-slate-100 p-0.5 rounded-lg border border-slate-200/80 transition-all shadow-2xs">
        {/* Language Selector Pill: Hindi / English */}
        <div className="flex items-center rounded-md bg-white p-0.5 border border-slate-200/60 shadow-2xs">
          <button
            type="button"
            onClick={() => handleSelectLang("hi-IN")}
            className={`px-2 py-0.5 text-[11px] font-semibold rounded transition-all cursor-pointer ${
              selectedLang === "hi-IN"
                ? "bg-amber-500 text-slate-950 font-bold shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
            title="हिंदी वॉइस इनपुट (Hindi Voice Input)"
          >
            हिंदी
          </button>
          <button
            type="button"
            onClick={() => handleSelectLang("en-IN")}
            className={`px-2 py-0.5 text-[11px] font-semibold rounded transition-all cursor-pointer ${
              selectedLang === "en-IN"
                ? "bg-slate-900 text-white font-bold shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
            title="English Voice Input"
          >
            EN
          </button>
        </div>

        {/* Dictation Mic Action Button */}
        <button
          type="button"
          onClick={handleToggleListening}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
            isListening
              ? "bg-red-600 text-white shadow-xs ring-2 ring-red-400/40 animate-pulse"
              : "bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200/70"
          }`}
          title={
            isListening
              ? "डिक्टेशन रोकें (Stop Dictation)"
              : `डिक्टेशन शुरू करें (${selectedLang === "hi-IN" ? "हिंदी" : "English"})`
          }
        >
          {isListening ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
              </span>
              <Mic className="w-3.5 h-3.5 text-white animate-bounce" />
              {!isMobile && (
                <span className="text-[11px] font-bold tracking-tight">
                  {selectedLang === "hi-IN" ? "बोलिए..." : "Listening..."}
                </span>
              )}
            </>
          ) : (
            <>
              <Mic className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-900" />
              {!isMobile && (
                <span className="text-[11px] font-medium text-slate-700">
                  {selectedLang === "hi-IN" ? "डिक्टेशन" : "Dictate"}
                </span>
              )}
            </>
          )}
        </button>

        {/* Panel Toggle Icon Button */}
        <button
          type="button"
          onClick={() => setIsPanelOpen(!isPanelOpen)}
          className={`p-1 rounded-md text-slate-500 hover:text-slate-800 hover:bg-white/80 transition-colors cursor-pointer ${
            isPanelOpen ? "bg-white text-slate-900 shadow-2xs" : ""
          }`}
          title="डिक्टेशन नोटपैड खोलें / बंद करें"
        >
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-200 ${
              isPanelOpen ? "rotate-180 text-slate-800" : ""
            }`}
          />
        </button>
      </div>

      {/* Dropdown Floating Dictation Panel / Scratchpad */}
      {isPanelOpen && (
        <div
          className={`absolute top-full mt-2 z-50 bg-white rounded-xl shadow-2xl border border-slate-200/90 overflow-hidden transition-all duration-150 animate-in fade-in slide-in-from-top-2 ${
            isMobile
              ? "right-0 w-[calc(100vw-2rem)] max-w-sm"
              : "right-0 w-96 max-w-[95vw]"
          }`}
        >
          {/* Panel Header */}
          <div className="px-3.5 py-2.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2 min-w-0">
              <div
                className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${
                  isListening ? "bg-red-600 animate-pulse" : "bg-slate-800"
                }`}
              >
                <Mic className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-bold tracking-tight truncate">
                    पुलिस डिक्टेशन (Voice Typing)
                  </h4>
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold uppercase tracking-wider ${
                      selectedLang === "hi-IN"
                        ? "bg-amber-400 text-slate-950"
                        : "bg-blue-400 text-slate-950"
                    }`}
                  >
                    {selectedLang === "hi-IN" ? "हिंदी (hi-IN)" : "English (en-IN)"}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 truncate">
                  {isListening
                    ? selectedLang === "hi-IN"
                      ? "माइक चालू है — साफ़-साफ़ बोलें"
                      : "Microphone active — speak clearly"
                    : "माइक बंद है — शुरू करने के लिए बटन दबाएँ"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsPanelOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                title="बंद करें"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="px-3 py-2 bg-red-50 border-b border-red-200 text-red-800 text-[11px] flex items-start gap-1.5">
              <Info className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Active Target Field Indicator */}
          <div className="px-3.5 py-1.5 bg-slate-50 border-b border-slate-200/70 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5 text-slate-700 min-w-0">
              <span className="font-semibold text-slate-500">🎯 फ़ोकस:</span>
              <span className="font-medium text-slate-900 truncate">
                {activeFieldName || "कोई फ़ील्ड चयनित नहीं"}
              </span>
            </div>
            {insertedNotice && (
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 animate-in fade-in">
                ✓ फ़ील्ड में लिखा गया!
              </span>
            )}
          </div>

          {/* Live Transcript Display Box */}
          <div className="p-3">
            <div className="relative">
              <textarea
                value={
                  accumulatedText +
                  (interimText ? (accumulatedText ? " " : "") + interimText : "")
                }
                onChange={(e) => setAccumulatedText(e.target.value)}
                rows={4}
                placeholder={
                  selectedLang === "hi-IN"
                    ? "यहाँ आपकी बोली गई बात टाइप होगी... (पेज पर किसी भी इनपुट या टेक्स्ट फ़ील्ड पर क्लिक करके बोलें तो वहाँ भी अपने आप टाइप होगा)"
                    : "Your spoken text appears here... (Click any input or textarea on the page to type directly into it)"
                }
                className="w-full text-xs font-normal p-2.5 rounded-lg border border-slate-200 bg-slate-50/60 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none resize-none leading-relaxed text-slate-800 placeholder:text-slate-400"
              />
              {interimText && (
                <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[10px] font-medium text-amber-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                  लाइव ट्रांसक्रिप्शन...
                </div>
              )}
            </div>

            {/* Language Quick Switcher Inside Panel */}
            <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-slate-100">
              <div className="flex items-center gap-1 text-[11px] text-slate-500">
                <Languages className="w-3.5 h-3.5 text-slate-400" />
                <span>भाषा (Language):</span>
                <button
                  type="button"
                  onClick={() => handleSelectLang("hi-IN")}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer transition-colors ${
                    selectedLang === "hi-IN"
                      ? "bg-amber-400 text-slate-950"
                      : "hover:bg-slate-100 text-slate-700"
                  }`}
                >
                  हिंदी
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectLang("en-IN")}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer transition-colors ${
                    selectedLang === "en-IN"
                      ? "bg-slate-900 text-white"
                      : "hover:bg-slate-100 text-slate-700"
                  }`}
                >
                  English
                </button>
              </div>

              {/* Clear Button */}
              {(accumulatedText || interimText) && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="flex items-center gap-1 text-[11px] text-red-600 hover:text-red-700 hover:bg-red-50 px-1.5 py-0.5 rounded cursor-pointer"
                  title="टेक्स्ट साफ़ करें"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>साफ़ करें</span>
                </button>
              )}
            </div>
          </div>

          {/* Action Footer */}
          <div className="px-3.5 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              {/* Copy Button */}
              <button
                type="button"
                onClick={handleCopy}
                disabled={!accumulatedText && !interimText}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  copied
                    ? "bg-emerald-600 text-white"
                    : "bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
                }`}
                title="कॉपी करें"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>कॉपी हुआ!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>कॉपी</span>
                  </>
                )}
              </button>

              {/* Insert to Active Field Button */}
              <button
                type="button"
                onClick={handleManualInsert}
                disabled={!accumulatedText && !interimText}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                title="सक्रिय फ़ील्ड में डालें"
              >
                <CornerDownLeft className="w-3.5 h-3.5 text-blue-600" />
                <span>फ़ील्ड में भरें</span>
              </button>
            </div>

            {/* Mic Start / Stop Button */}
            <button
              type="button"
              onClick={handleToggleListening}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer ${
                isListening
                  ? "bg-red-600 hover:bg-red-700 text-white ring-2 ring-red-400/30"
                  : "bg-slate-900 hover:bg-slate-800 text-white"
              }`}
            >
              {isListening ? (
                <>
                  <MicOff className="w-3.5 h-3.5" />
                  <span>रोकें (Stop)</span>
                </>
              ) : (
                <>
                  <Mic className="w-3.5 h-3.5" />
                  <span>बोलें (Start)</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
