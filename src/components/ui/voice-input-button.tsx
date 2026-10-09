"use client";

import React, { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Volume2, Globe } from "lucide-react";

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  currentValue?: string;
  fieldLabel?: string;
  className?: string;
  preferredLang?: "hi-IN" | "en-IN";
  iconOnly?: boolean;
}

export function VoiceInputButton({
  onTranscript,
  currentValue = "",
  fieldLabel = "this field",
  className = "",
  preferredLang = "hi-IN",
  iconOnly = false,
}: VoiceInputButtonProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check Web Speech API support
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  const toggleListening = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Voice input is supported in Chrome, Edge, Safari, and Android browsers.");
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
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
        const transcript = event.results[0][0].transcript;
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
        if (event.error !== "no-speech") {
          setErrorMsg(event.error);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err: any) {
      console.error("Speech recognition error:", err);
      setIsListening(false);
    }
  };

  if (!isSupported) {
    return null;
  }

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onClick={toggleListening}
        title={
          isListening
            ? "Listening... Click to stop"
            : `Click to speak for ${fieldLabel}`
        }
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold transition-all select-none border ${
          isListening
            ? "bg-red-500 text-white border-red-600 shadow-md animate-pulse ring-2 ring-red-300"
            : "bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border-slate-200 hover:border-blue-300 shadow-2xs"
        } ${className}`}
      >
        {isListening ? (
          <>
            <MicOff className="w-3.5 h-3.5 text-white animate-spin" />
            {!iconOnly && <span className="font-bold">Listening...</span>}
          </>
        ) : (
          <>
            <Mic className="w-3.5 h-3.5 text-blue-600" />
            {!iconOnly && <span>Voice Input</span>}
          </>
        )}
      </button>

      {errorMsg && (
        <span className="absolute -top-7 left-0 bg-red-600 text-white text-[10px] px-2 py-0.5 rounded shadow-md whitespace-nowrap z-20">
          Mic: {errorMsg}
        </span>
      )}
    </div>
  );
}
