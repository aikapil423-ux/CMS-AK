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

  // Voice input buttons on form fields hidden as per user requirement
  return null;
}
