"use client";

import React, { useState, useEffect, useRef } from "react";
import { Mic, MicOff } from "lucide-react";

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  currentValue?: string;
  fieldLabel?: string;
  className?: string;
  preferredLang?: "hi-IN" | "en-IN";
}

// Web Speech API based voice input (Chrome / Edge / Safari).
// The button ALWAYS renders — if voice cannot run, clicking it explains why
// (unsupported browser or insecure context) instead of silently vanishing.
export function VoiceInputButton({
  onTranscript,
  currentValue = "",
  fieldLabel = "this field",
  className = "",
  preferredLang = "en-IN",
}: VoiceInputButtonProps) {
  const [isListening, setIsListening] = useState(false);
  const [unsupported, setUnsupported] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setUnsupported(true);
    }
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

  const friendlyError = (code: string): string => {
    const map: Record<string, string> = {
      "not-allowed":
        "Mic permission denied — click the lock icon in the address bar and allow Microphone.",
      "service-not-allowed":
        "Mic service blocked — allow Microphone permission for this site in browser settings.",
      "audio-capture": "No microphone found. Please connect or enable a microphone.",
      network: "Speech service network error — check your internet connection.",
      language: "Selected language not supported by the speech service.",
    };
    return map[code] || `Mic error: ${code}`;
  };

  const toggleListening = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      const secure = (window as any).isSecureContext;
      alert(
        "Voice input needs the Web Speech API (Chrome, Edge or Safari) in a secure context.\n\n" +
          (secure
            ? "This page is secure — your browser does not expose the Web Speech API. Please use Google Chrome or Microsoft Edge."
            : "This page is NOT secure. Open the app via http://localhost:3000 (or HTTPS) in Chrome/Edge — voice input will then work.")
      );
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = preferredLang;

      recognition.onstart = () => {
        setIsListening(true);
        setErrorMsg(null);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript;
        if (transcript) {
          const cleanTranscript = transcript.trim();
          // Smart append or replace
          if (currentValue && currentValue.trim().length > 0) {
            onTranscript(`${currentValue.trim()} ${cleanTranscript}`);
          } else {
            onTranscript(cleanTranscript);
          }
        }
      };

      recognition.onerror = (event: any) => {
        const code = event?.error;
        if (code && code !== "no-speech" && code !== "aborted") {
          setErrorMsg(friendlyError(code));
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      try {
        recognition.start();
      } catch (err: any) {
        // InvalidStateError = an instance is already running — restart cleanly
        try {
          recognition.abort();
          recognition.start();
        } catch {
          setErrorMsg("Could not start the microphone. Please try again.");
          setIsListening(false);
        }
      }
    } catch (err: any) {
      console.error("Speech recognition error:", err);
      setErrorMsg("Could not start the microphone. Please try again.");
      setIsListening(false);
    }
  };

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onClick={toggleListening}
        title={
          isListening
            ? "Listening... Click to stop"
            : unsupported
              ? "Voice input unavailable in this browser/context — click for details"
              : `Click to speak for ${fieldLabel}`
        }
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold transition-all select-none border ${
          isListening
            ? "bg-red-500 text-white border-red-600 shadow-md animate-pulse ring-2 ring-red-300"
            : unsupported
              ? "bg-slate-200 text-slate-500 border-slate-300 hover:bg-slate-300 shadow-2xs"
              : "bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border-slate-200 hover:border-blue-300 shadow-2xs"
        } ${className}`}
      >
        {isListening ? (
          <>
            <MicOff className="w-3 h-3 text-white animate-spin" />
            <span className="font-bold">Listening...</span>
          </>
        ) : (
          <>
            <Mic className={`w-3 h-3 ${unsupported ? "text-slate-500" : "text-blue-600"}`} />
            <span>Voice Input</span>
          </>
        )}
      </button>

      {errorMsg && (
        <span className="absolute top-6 left-0 bg-red-600 text-white text-[10px] px-2 py-0.5 rounded shadow-md whitespace-nowrap z-20">
          {errorMsg}
        </span>
      )}
    </div>
  );
}
