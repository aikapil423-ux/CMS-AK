"use client";

import { supportsWhisperDictation, WhisperRecognition } from "@/lib/whisperRecognition";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Mic, MicOff } from "lucide-react";

export type DictationLanguage = "hi-IN" | "en-IN";

interface TopBarDictationProps {
  isMobile?: boolean;
}

export function TopBarDictation({ isMobile = false }: TopBarDictationProps) {
  const [selectedLang, setSelectedLang] = useState<DictationLanguage>("hi-IN");
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const recognitionRef = useRef<WhisperRecognition | null>(null);
  const isListeningRef = useRef(false);
  const selectedLangRef = useRef<DictationLanguage>("hi-IN");
  const lastTargetElRef = useRef<HTMLInputElement | HTMLTextAreaElement | HTMLElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  // Sync ref with state
  useEffect(() => {
    selectedLangRef.current = selectedLang;
  }, [selectedLang]);

  // Load language preference from localStorage & listen for cross-component changes
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

    const handleLangSync = (e: any) => {
      const lang = e.detail?.lang as DictationLanguage;
      if (lang === "hi-IN" || lang === "en-IN") {
        setSelectedLang(lang);
        selectedLangRef.current = lang;
        if (recognitionRef.current) recognitionRef.current.lang = lang;
      }
    };
    window.addEventListener("cms-dictation-lang-changed", handleLangSync);

    return () => {
      window.removeEventListener("cms-dictation-lang-changed", handleLangSync);
    };
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

  const startListening = useCallback(() => {
    if (recognitionRef.current) return;
    if (!supportsWhisperDictation()) {
      setErrorMessage("वॉइस डिक्टेशन के लिए HTTPS या localhost पर माइक रिकॉर्डिंग समर्थित ब्राउज़र की आवश्यकता है।");
      return;
    }

    const recognition = new WhisperRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = true;
    recognition.lang = selectedLangRef.current;
    recognition.onresult = ({ results }) => {
      const text = results[0][0].transcript;
      if (!insertTextIntoActiveElement(text)) {
        setErrorMessage("Select an editable field before dictating.");
      } else {
        setErrorMessage(null);
      }
    };
    recognition.onerror = ({ error }) => {
      setErrorMessage(error === "not-allowed"
        ? "माइक्रोफ़ोन अनुमति नहीं मिली। कृपया ब्राउज़र सेटिंग्स में माइक्रोफ़ोन की अनुमति दें।"
        : error);
    };
    recognition.onend = () => {
      recognitionRef.current = null;
      isListeningRef.current = false;
      setIsListening(false);
      setIsTranscribing(false);
    };

    setErrorMessage(null);
    isListeningRef.current = true;
    setIsListening(true);
    recognition.start();
  }, [insertTextIntoActiveElement]);

  const stopListening = useCallback(() => {
    if (!isListeningRef.current) return;
    isListeningRef.current = false;
    setIsListening(false);
    setIsTranscribing(true);
    recognitionRef.current?.stop();
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
      window.dispatchEvent(
        new CustomEvent("cms-dictation-lang-changed", { detail: { lang } })
      );
    } catch {
      // ignore
    }

  };

  return (
    <div className="relative inline-flex items-center" ref={panelRef}>
      {/* Icon-Only Top Bar Dictation Trigger Button */}
      <button
        type="button"
        onClick={() => {
          if (isListening) {
            stopListening();
          } else if (isPanelOpen) {
            setIsPanelOpen(false);
          } else {
            setIsPanelOpen(true);
            startListening();
          }
        }}
        className={`cms-dictation-trigger relative rounded-lg border transition-all active:scale-95 flex items-center justify-center cursor-pointer shadow-2xs select-none ${
          isMobile ? "w-8 h-8 p-1.5" : "w-8.5 h-8.5 p-2"
        } ${
          isListening
            ? "bg-rose-50 border-rose-300 text-rose-600 ring-2 ring-rose-400/40 animate-pulse"
            : isPanelOpen
            ? "bg-slate-900 text-white border-slate-900 shadow-sm"
            : "bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 border-slate-200/90 hover:border-slate-300"
        }`}
        title={
          isListening
            ? "डिक्टेशन रोकें (Stop Dictation)"
            : `वॉइस डिक्टेशन (${selectedLang === "hi-IN" ? "हिंदी" : "English"})`
        }
        disabled={isTranscribing}
        aria-label="Voice Dictation"
        aria-expanded={isPanelOpen}
      >
        {isListening ? (
          <>
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600"></span>
            </span>
            <Mic className="w-4 h-4 text-rose-600 animate-bounce" />
          </>
        ) : (
          <>
            <Mic className={`w-4 h-4 ${isPanelOpen ? "text-white" : "text-slate-700"}`} />
            {/* Subtle language badge in corner */}
            <span
              className="cms-dictation-language-badge absolute -bottom-1 -right-1 text-[10px] font-bold px-0.5 leading-none rounded border border-slate-300 bg-white text-slate-900 shadow-2xs"
              style={{ backgroundColor: "#ffffff", color: "#172b4d" }}
            >
              {selectedLang === "hi-IN" ? "हिं" : "EN"}
            </span>
          </>
        )}
      </button>

      {isPanelOpen && (
        <div role="dialog" aria-label="Voice dictation" className="cms-dictation-panel absolute right-0 top-full mt-2 z-50 bg-white border border-slate-200 rounded-xl shadow-xl p-1.5 flex items-center gap-1">
          <button type="button" title="हिंदी" aria-label="Hindi dictation" aria-pressed={selectedLang === "hi-IN"} onClick={() => handleSelectLang("hi-IN")} className={selectedLang === "hi-IN" ? "cms-dictation-selected" : ""}><span aria-hidden="true">अ</span></button>
          <button type="button" title="English" aria-label="English dictation" aria-pressed={selectedLang === "en-IN"} onClick={() => handleSelectLang("en-IN")} className={selectedLang === "en-IN" ? "cms-dictation-selected" : ""}><span aria-hidden="true">A</span></button>
          <button type="button" onClick={handleToggleListening} disabled={isTranscribing} aria-label={isTranscribing ? "Processing dictation" : isListening ? "Stop dictation" : "Start dictation"} title={errorMessage || (isTranscribing ? "Processing…" : isListening ? "Stop" : "Start")} className="cms-dictation-start">
            {isListening ? <MicOff aria-hidden="true" className="w-3.5 h-3.5" /> : <Mic aria-hidden="true" className={`w-3.5 h-3.5 ${isTranscribing ? "animate-pulse" : ""}`} />}
          </button>
          <span role="status" className="sr-only">{errorMessage}</span>
        </div>
      )}
    </div>
  );
}
