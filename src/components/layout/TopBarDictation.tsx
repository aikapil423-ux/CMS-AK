"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Mic, MicOff } from "lucide-react";
import { supportsWhisperDictation, WhisperRecognition } from "@/lib/whisperRecognition";
import { autoResizeTextarea } from "@/components/ui/auto-resize-textarea";

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
  const [activeFieldName, setActiveFieldName] = useState<string>("");

  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);
  const selectedLangRef = useRef<DictationLanguage>("hi-IN");
  const lastTargetElRef = useRef<HTMLInputElement | HTMLTextAreaElement | HTMLElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  // Real-time cursor & insertion tracking for live "बोलते-बोलते टाइप"
  const prefixRef = useRef<string>("");
  const suffixRef = useRef<string>("");
  const isSyntheticInputRef = useRef(false);

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
        if (recognitionRef.current && "lang" in recognitionRef.current) {
          recognitionRef.current.lang = lang;
        }
      }
    };
    window.addEventListener("cms-dictation-lang-changed", handleLangSync);

    return () => {
      window.removeEventListener("cms-dictation-lang-changed", handleLangSync);
    };
  }, []);

  const isEditableTarget = useCallback((el: any): el is HTMLInputElement | HTMLTextAreaElement | HTMLElement => {
    if (!el || !(el instanceof HTMLElement)) return false;
    if (panelRef.current && panelRef.current.contains(el)) return false;

    if (el instanceof HTMLInputElement) {
      return !["button", "submit", "checkbox", "radio", "file", "image", "reset", "color", "range"].includes(el.type);
    }
    if (el instanceof HTMLTextAreaElement) {
      return true;
    }
    if (el.isContentEditable) {
      return true;
    }
    return false;
  }, []);

  const syncCursorPosition = useCallback((el: HTMLElement) => {
    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
      const start = el.selectionStart ?? el.value.length;
      const end = el.selectionEnd ?? el.value.length;
      prefixRef.current = el.value.slice(0, start);
      suffixRef.current = el.value.slice(end);
    } else if (el.isContentEditable) {
      prefixRef.current = el.innerText || el.textContent || "";
      suffixRef.current = "";
    }
  }, []);

  // Track the most recently focused form input or textarea anywhere on the page
  useEffect(() => {
    const handleTargetCapture = (e: Event) => {
      const target = e.target as HTMLElement;
      if (!isEditableTarget(target)) return;

      lastTargetElRef.current = target;
      syncCursorPosition(target);

      const name =
        target.getAttribute("aria-label") ||
        target.getAttribute("placeholder") ||
        (target as HTMLInputElement).name ||
        target.id ||
        (target.tagName === "TEXTAREA" ? "Textarea" : "Input Field");
      setActiveFieldName(name.slice(0, 30));
    };

    const handleUserEdit = (e: Event) => {
      if (isSyntheticInputRef.current) return;
      const target = e.target as HTMLElement;
      if (target === lastTargetElRef.current && isEditableTarget(target)) {
        syncCursorPosition(target);
      }
    };

    document.addEventListener("focusin", handleTargetCapture, true);
    document.addEventListener("pointerdown", handleTargetCapture, true);
    document.addEventListener("input", handleUserEdit, true);
    document.addEventListener("keyup", handleUserEdit, true);

    return () => {
      document.removeEventListener("focusin", handleTargetCapture, true);
      document.removeEventListener("pointerdown", handleTargetCapture, true);
      document.removeEventListener("input", handleUserEdit, true);
      document.removeEventListener("keyup", handleUserEdit, true);
    };
  }, [isEditableTarget, syncCursorPosition]);

  // Close panel when clicking outside if not currently listening
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        isPanelOpen &&
        panelRef.current &&
        !panelRef.current.contains(e.target as Node)
      ) {
        if (!isListeningRef.current) {
          setIsPanelOpen(false);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isPanelOpen]);

  const getActiveTarget = useCallback((): HTMLElement | null => {
    let el = lastTargetElRef.current;
    if (el && document.body.contains(el)) {
      return el;
    }
    const active = document.activeElement as HTMLElement;
    if (isEditableTarget(active)) {
      lastTargetElRef.current = active;
      syncCursorPosition(active);
      return active;
    }
    return null;
  }, [isEditableTarget, syncCursorPosition]);

  // Insert transcript directly into the target element in real time ("बोलते बोलते टाइप हो")
  const writeTranscript = useCallback((el: HTMLElement, transcript: string, isFinal: boolean) => {
    if (!el || !document.body.contains(el)) return false;

    try {
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
        isSyntheticInputRef.current = true;
        const prefix = prefixRef.current;
        const suffix = suffixRef.current;

        const needPreSpace = prefix.length > 0 && !/\s$/.test(prefix) && !/^\s/.test(transcript);
        const preSpacer = needPreSpace ? " " : "";

        const needPostSpace = isFinal && suffix.length > 0 && !/^\s/.test(suffix);
        const postSpacer = needPostSpace ? " " : "";

        const newPrefix = prefix + preSpacer + transcript;
        const fullVal = newPrefix + postSpacer + suffix;

        // React controlled input setter bypass
        const proto =
          el instanceof HTMLTextAreaElement
            ? window.HTMLTextAreaElement.prototype
            : window.HTMLInputElement.prototype;
        const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
        if (setter) {
          setter.call(el, fullVal);
        } else {
          el.value = fullVal;
        }

        const newPos = newPrefix.length;
        try {
          el.setSelectionRange?.(newPos, newPos);
        } catch {}

        el.dispatchEvent(new Event("input", { bubbles: true }));

        if (el instanceof HTMLTextAreaElement) {
          autoResizeTextarea(el);
        }

        if (isFinal) {
          prefixRef.current = newPrefix + (suffix.length > 0 ? postSpacer : " ");
          el.dispatchEvent(new Event("change", { bubbles: true }));
        }

        isSyntheticInputRef.current = false;
        return true;
      } else if (el.isContentEditable) {
        if (isFinal) {
          el.focus();
          document.execCommand?.("insertText", false, transcript + " ");
          el.dispatchEvent(new Event("input", { bubbles: true }));
        }
        return true;
      }
    } catch (err) {
      console.warn("Failed to insert dictation text:", err);
    } finally {
      isSyntheticInputRef.current = false;
    }
    return false;
  }, []);

  // Cleanup speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort?.() || recognitionRef.current.stop?.();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  const stopListening = useCallback(() => {
    isListeningRef.current = false;
    setIsListening(false);
    setIsTranscribing(false);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop?.();
      } catch {
        // ignore
      }
    }
  }, []);

  const startListening = useCallback(
    (langOverride?: DictationLanguage) => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort?.();
        } catch {}
        recognitionRef.current = null;
      }

      const activeLang = langOverride || selectedLangRef.current;
      setErrorMessage(null);

      // 1. Primary: Native Web Speech API for instantaneous streaming dictation ("बोलते बोलते टाइप होना")
      const SpeechRecognitionClass =
        typeof window !== "undefined"
          ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
          : null;

      if (SpeechRecognitionClass) {
        try {
          const recognition = new SpeechRecognitionClass();
          recognitionRef.current = recognition;
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = activeLang;
          recognition.maxAlternatives = 1;

          recognition.onstart = () => {
            isListeningRef.current = true;
            setIsListening(true);
            setIsTranscribing(false);
            setErrorMessage(null);
          };

          recognition.onresult = (event: any) => {
            let finalPhrase = "";
            let interimPhrase = "";

            for (let i = event.resultIndex; i < event.results.length; ++i) {
              const res = event.results[i];
              const transcript = res[0]?.transcript || "";
              if (res.isFinal) {
                finalPhrase += (finalPhrase ? " " : "") + transcript.trim();
              } else {
                interimPhrase += (interimPhrase ? " " : "") + transcript.trim();
              }
            }

            const el = getActiveTarget();
            if (!el) {
              setErrorMessage("कृपया किसी फ़ील्ड पर क्लिक करें");
              return;
            } else {
              setErrorMessage(null);
            }

            // Real-time commit for final phrases
            if (finalPhrase.trim()) {
              writeTranscript(el, finalPhrase.trim(), true);
            }

            // Real-time streaming preview as you speak ("बोलते बोलते")
            if (interimPhrase.trim()) {
              writeTranscript(el, interimPhrase.trim(), false);
            }
          };

          recognition.onerror = (event: any) => {
            const err = event?.error;
            if (err === "no-speech" || err === "aborted") {
              return;
            }
            if (err === "not-allowed") {
              setErrorMessage("माइक अनुमति नहीं मिली। कृपया ब्राउज़र सेटिंग्स में माइक्रोफ़ोन की अनुमति दें।");
              setIsListening(false);
              isListeningRef.current = false;
            } else if (err === "network") {
              setErrorMessage("नेटवर्क त्रुटि: इंटरनेट जांचें।");
            } else {
              setErrorMessage(`माइक त्रुटि: ${err}`);
            }
          };

          recognition.onend = () => {
            if (isListeningRef.current) {
              try {
                recognition.start();
              } catch {
                setTimeout(() => {
                  if (isListeningRef.current) {
                    try {
                      recognition.start();
                    } catch {}
                  }
                }, 150);
              }
            } else {
              setIsListening(false);
              setIsTranscribing(false);
            }
          };

          recognition.start();
          isListeningRef.current = true;
          setIsListening(true);
          return;
        } catch (err) {
          console.warn("Web Speech API failed, using Whisper fallback:", err);
        }
      }

      // 2. Secondary fallback: Local Whisper STT
      if (!supportsWhisperDictation()) {
        setErrorMessage("वॉइस डिक्टेशन के लिए माइक्रोफ़ोन समर्थित ब्राउज़र की आवश्यकता है।");
        return;
      }

      const recognition = new WhisperRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = true;
      recognition.lang = activeLang;

      recognition.onstart = () => {
        isListeningRef.current = true;
        setIsListening(true);
        setIsTranscribing(false);
        setErrorMessage(null);
      };

      recognition.onresult = ({ results }) => {
        const text = results[0][0].transcript;
        if (text?.trim()) {
          const el = getActiveTarget();
          if (el) {
            writeTranscript(el, text.trim(), true);
            setErrorMessage(null);
          } else {
            setErrorMessage("कृपया किसी फ़ील्ड पर क्लिक करें");
          }
        }
      };

      recognition.onerror = ({ error }) => {
        setErrorMessage(
          error === "not-allowed"
            ? "माइक अनुमति नहीं मिली। कृपया ब्राउज़र सेटिंग्स में माइक्रोफ़ोन की अनुमति दें।"
            : error
        );
      };

      recognition.onend = () => {
        recognitionRef.current = null;
        isListeningRef.current = false;
        setIsListening(false);
        setIsTranscribing(false);
      };

      isListeningRef.current = true;
      setIsListening(true);
      recognition.start();
    },
    [getActiveTarget, writeTranscript]
  );

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

    if (isListeningRef.current) {
      stopListening();
      setTimeout(() => {
        startListening(lang);
      }, 100);
    }
  };

  return (
    <div className="relative inline-flex items-center" ref={panelRef}>
      {/* Icon-Only Top Bar Dictation Trigger Button */}
      <button
        type="button"
        onMouseDown={(e) => {
          // Prevent losing focus from the active input field
          e.preventDefault();
        }}
        onClick={() => {
          if (isListening) {
            stopListening();
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
            ? "डिक्टेशन चालू है (Stop Dictation) — जिस फ़ील्ड में कर्सर है उसमें बोलते-बोलते टाइप होगा"
            : `वॉइस डिक्टेशन चालू करें (${selectedLang === "hi-IN" ? "हिंदी" : "English"})`
        }
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
        <div
          role="dialog"
          aria-label="Voice dictation"
          className="cms-dictation-panel absolute right-0 top-full mt-2 z-50 bg-white border border-slate-200 rounded-xl shadow-xl p-1.5 flex items-center gap-1.5 animate-in fade-in-50"
        >
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            title="हिंदी डिक्टेशन"
            aria-label="Hindi dictation"
            aria-pressed={selectedLang === "hi-IN"}
            onClick={() => handleSelectLang("hi-IN")}
            className={selectedLang === "hi-IN" ? "cms-dictation-selected" : ""}
          >
            <span aria-hidden="true">अ</span>
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            title="English dictation"
            aria-label="English dictation"
            aria-pressed={selectedLang === "en-IN"}
            onClick={() => handleSelectLang("en-IN")}
            className={selectedLang === "en-IN" ? "cms-dictation-selected" : ""}
          >
            <span aria-hidden="true">A</span>
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleToggleListening}
            aria-label={isListening ? "Stop dictation" : "Start dictation"}
            title={errorMessage || (isListening ? "रोकें (Stop)" : "शुरू करें (Start)")}
            className={`cms-dictation-start ${isListening ? "!bg-rose-600 !text-white" : ""}`}
          >
            {isListening ? (
              <MicOff aria-hidden="true" className="w-3.5 h-3.5 text-white" />
            ) : (
              <Mic aria-hidden="true" className={`w-3.5 h-3.5 ${isTranscribing ? "animate-pulse" : ""}`} />
            )}
          </button>

          {/* Active Field Name or Status Hint */}
          {activeFieldName && (
            <span
              className="text-[11px] font-medium text-slate-600 max-w-[140px] truncate px-1 border-l border-slate-200 pl-1.5 select-none"
              title={`सक्रिय फ़ील्ड: ${activeFieldName}`}
            >
              {isListening ? `बोलें... (${activeFieldName})` : activeFieldName}
            </span>
          )}

          {errorMessage && (
            <span role="status" className="text-[10px] text-rose-600 max-w-[150px] truncate pl-1 font-medium">
              {errorMessage}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
