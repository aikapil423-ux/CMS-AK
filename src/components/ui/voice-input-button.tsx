"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Mic, MicOff } from "lucide-react";

export type VoiceInputLang = "hi-IN" | "en-IN";

export interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  currentValue?: string;
  fieldLabel?: string;
  className?: string;
  preferredLang?: VoiceInputLang;
  iconOnly?: boolean;
  showLangToggle?: boolean;
}

// Web Speech API based voice input (Chrome / Edge / Safari).
// Supports Hindi (hi-IN) and English (en-IN) voice input directly into the field.
export function VoiceInputButton({
  onTranscript,
  currentValue = "",
  fieldLabel = "this field",
  className = "",
  preferredLang = "hi-IN",
  iconOnly = false,
  showLangToggle = true,
}: VoiceInputButtonProps) {
  const [isListening, setIsListening] = useState(false);
  const [unsupported, setUnsupported] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedLang, setSelectedLang] = useState<VoiceInputLang>(preferredLang);

  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);
  const selectedLangRef = useRef<VoiceInputLang>(preferredLang);
  const lastTranscriptRef = useRef<string>("");

  // Keep ref in sync
  useEffect(() => {
    selectedLangRef.current = selectedLang;
  }, [selectedLang]);

  // Load language preference from localStorage and listen to cross-component changes
  useEffect(() => {
    try {
      const savedLang = localStorage.getItem("cms_dictation_lang") as VoiceInputLang;
      if (savedLang === "hi-IN" || savedLang === "en-IN") {
        setSelectedLang(savedLang);
        selectedLangRef.current = savedLang;
      }
    } catch {
      // ignore
    }

    const handleSync = (e: any) => {
      const lang = e.detail?.lang as VoiceInputLang;
      if (lang === "hi-IN" || lang === "en-IN") {
        setSelectedLang(lang);
        selectedLangRef.current = lang;
      }
    };
    window.addEventListener("cms-dictation-lang-changed", handleSync);

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setUnsupported(true);
    }

    return () => {
      window.removeEventListener("cms-dictation-lang-changed", handleSync);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  const friendlyError = (code: string): string => {
    const map: Record<string, string> = {
      "not-allowed": "माइक्रोफ़ोन अनुमति अस्वीकृत — कृपया ब्राउज़र में Mic की अनुमति दें।",
      "service-not-allowed": "माइक्रोफ़ोन सेवा अवरुद्ध है।",
      "audio-capture": "कोई माइक्रोफ़ोन नहीं मिला।",
      network: "नेटवर्क त्रुटि: इंटरनेट कनेक्शन जांचें।",
      language: "चयनित भाषा समर्थित नहीं है।",
    };
    return map[code] || `Mic error: ${code}`;
  };

  // Start speech recognition in specified or currently selected language
  const startRecognition = useCallback(
    (langToUse?: VoiceInputLang) => {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (!SpeechRecognition) {
        const secure = (window as any).isSecureContext;
        alert(
          "वॉइस इनपुट के लिए Google Chrome या Microsoft Edge ब्राउज़र की आवश्यकता है।\n\n" +
            (secure
              ? "यह पेज सुरक्षित है परंतु ब्राउज़र Web Speech API सपोर्ट नहीं करता।"
              : "यह पेज HTTPS या localhost पर नहीं है।")
        );
        return;
      }

      // Stop any existing instance first
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
        recognitionRef.current = null;
      }
      lastTranscriptRef.current = "";

      const activeLang = langToUse || selectedLangRef.current;

      try {
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;

        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.lang = activeLang;

        recognition.onstart = () => {
          setIsListening(true);
          isListeningRef.current = true;
          setErrorMsg(null);
        };

        recognition.onresult = (event: any) => {
          const result = event.results?.[event.resultIndex] ?? event.results?.[0];
          if (!result || !result.isFinal) return;
          const transcript = result[0]?.transcript;
          if (!transcript) return;
          const cleanTranscript = transcript.trim();
          if (!cleanTranscript) return;

          // Deduplication guard
          if (cleanTranscript === lastTranscriptRef.current) return;
          lastTranscriptRef.current = cleanTranscript;

          // Smart append or replace into field
          if (currentValue && currentValue.trim().length > 0) {
            onTranscript(`${currentValue.trim()} ${cleanTranscript}`);
          } else {
            onTranscript(cleanTranscript);
          }
        };

        recognition.onerror = (event: any) => {
          const code = event?.error;
          if (code && code !== "no-speech" && code !== "aborted") {
            setErrorMsg(friendlyError(code));
            setTimeout(() => setErrorMsg(null), 3500);
          }
          if (code !== "no-speech") {
            setIsListening(false);
            isListeningRef.current = false;
          }
        };

        recognition.onend = () => {
          // If still listening, restart recognition (continuous)
          if (isListeningRef.current) {
            try {
              recognition.start();
            } catch {
              setIsListening(false);
              isListeningRef.current = false;
            }
          } else {
            setIsListening(false);
          }
        };

        recognition.start();
        setIsListening(true);
        isListeningRef.current = true;
      } catch (err: any) {
        console.error("Speech recognition error:", err);
        setErrorMsg("माइक शुरू करने में त्रुटि। कृपया पुनः प्रयास करें।");
        setTimeout(() => setErrorMsg(null), 3500);
        setIsListening(false);
        isListeningRef.current = false;
      }
    },
    [currentValue, onTranscript]
  );

  const stopRecognition = useCallback(() => {
    isListeningRef.current = false;
    setIsListening(false);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
  }, []);

  const toggleListening = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isListening) {
      stopRecognition();
    } else {
      startRecognition();
    }
  };

  const handleSelectLang = (e: React.MouseEvent, lang: VoiceInputLang) => {
    e.preventDefault();
    e.stopPropagation();

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

    // If currently listening, seamlessly switch language by restarting
    if (isListeningRef.current) {
      stopRecognition();
      setTimeout(() => {
        startRecognition(lang);
      }, 150);
    }
  };

  return (
    <div className={`relative inline-flex items-center gap-1 ${className}`}>
      <div
        className={`inline-flex items-center gap-0.5 p-0.5 rounded-md border transition-all ${
          isListening
            ? "bg-red-50/80 border-red-300 ring-2 ring-red-400/30"
            : "bg-slate-50 hover:bg-slate-100 border-slate-200/90 shadow-2xs"
        }`}
      >
        {/* Language Switcher Pill (Hindi / English) */}
        {showLangToggle && (
          <div className="flex items-center rounded bg-white p-0.2 border border-slate-200/70 text-[10px] font-bold shadow-2xs">
            <button
              type="button"
              onClick={(e) => handleSelectLang(e, "hi-IN")}
              className={`px-1.5 py-0.2 rounded transition-all cursor-pointer ${
                selectedLang === "hi-IN"
                  ? "bg-amber-400 text-slate-950 font-black shadow-2xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
              title="हिंदी में बोलें (Hindi Voice Input)"
            >
              {iconOnly ? "हिं" : "हिंदी"}
            </button>
            <button
              type="button"
              onClick={(e) => handleSelectLang(e, "en-IN")}
              className={`px-1.5 py-0.2 rounded transition-all cursor-pointer ${
                selectedLang === "en-IN"
                  ? "bg-slate-900 text-white font-black shadow-2xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
              title="English Voice Input"
            >
              EN
            </button>
          </div>
        )}

        {/* Mic Toggle Button */}
        <button
          type="button"
          onClick={toggleListening}
          title={
            isListening
              ? "डिक्टेशन रोकें (Click to stop)"
              : unsupported
                ? "ब्राउज़र में वॉइस इनपुट उपलब्ध नहीं है"
                : `${fieldLabel} में बोलकर टाइप करें (${selectedLang === "hi-IN" ? "हिंदी" : "English"})`
          }
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold transition-all select-none cursor-pointer ${
            isListening
              ? "bg-red-600 text-white shadow-xs animate-pulse"
              : unsupported
                ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                : "bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200/60"
          }`}
        >
          {isListening ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
              </span>
              <MicOff className="w-3.5 h-3.5 text-white animate-bounce" />
              {!iconOnly && (
                <span className="font-bold text-[10px] tracking-tight">
                  {selectedLang === "hi-IN" ? "बोलिए..." : "Listening..."}
                </span>
              )}
            </>
          ) : (
            <>
              <Mic
                className={`w-3.5 h-3.5 ${
                  unsupported ? "text-slate-400" : "text-blue-600"
                }`}
              />
              {!iconOnly && (
                <span className="text-[10px] font-medium">
                  {selectedLang === "hi-IN" ? "बोलें" : "Voice"}
                </span>
              )}
            </>
          )}
        </button>
      </div>

      {/* Floating Error Message Tooltip */}
      {errorMsg && (
        <span className="absolute top-full mt-1 left-0 bg-red-600 text-white text-[10px] px-2 py-0.5 rounded shadow-lg whitespace-nowrap z-30 animate-in fade-in">
          {errorMsg}
        </span>
      )}
    </div>
  );
}
