"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { setUniversalLanguage, cleanBilingualForHindi, cleanBilingualForEnglish } from "@/utils/universalDomTranslator";
import { CMS_DICTIONARY, REVERSE_DICTIONARY } from "@/utils/cmsTranslationDictionary";

export type AppLanguage = "hi" | "en";

interface LanguageContextType {
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  toggleLanguage: () => void;
  isHindi: boolean;
  isEnglish: boolean;
  t: (textOrHi: string, enFallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LANGUAGE_STORAGE_KEY = "cms_app_language";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>("en");
  const [mounted, setMounted] = useState(false);
  const languageRef = useRef<AppLanguage>("en");

  // Keep ref synchronized with latest state
  useEffect(() => {
    languageRef.current = language;
  }, [language]);

  // Initialize from localStorage or default to "en"
  useEffect(() => {
    let initialLang: AppLanguage = "en";
    try {
      const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY) as AppLanguage | null;
      if (saved === "hi" || saved === "en") {
        initialLang = saved;
      }
    } catch {
      // ignore
    }

    setLanguageState(initialLang);
    languageRef.current = initialLang;

    if (typeof document !== "undefined") {
      document.documentElement.lang = initialLang;
    }
    setMounted(true);
    setUniversalLanguage(initialLang);
  }, []);

  // Update DOM and HTML lang attribute whenever language state changes
  useEffect(() => {
    if (!mounted) return;

    if (typeof document !== "undefined") {
      document.documentElement.lang = language;
    }
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch {
      // ignore
    }

    // Apply translation immediately
    setUniversalLanguage(language);

    // Re-apply on next animation frame after React commits DOM changes
    const rAF = requestAnimationFrame(() => {
      setUniversalLanguage(language);
    });

    return () => cancelAnimationFrame(rAF);
  }, [language, mounted]);

  const applyLanguageChange = useCallback((nextLang: AppLanguage) => {
    setLanguageState(nextLang);
    languageRef.current = nextLang;

    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLang);
      if (typeof document !== "undefined") {
        document.documentElement.lang = nextLang;
      }
    } catch {
      // ignore
    }

    // Immediate DOM translation
    setUniversalLanguage(nextLang);

    // Frame-delayed DOM translation for React render reconciliation
    if (typeof window !== "undefined") {
      requestAnimationFrame(() => {
        setUniversalLanguage(nextLang);
      });
      window.dispatchEvent(
        new CustomEvent("cms-language-changed", {
          detail: { language: nextLang, source: "internal" },
        })
      );
    }
  }, []);

  const setLanguage = useCallback((lang: AppLanguage) => {
    applyLanguageChange(lang);
  }, [applyLanguageChange]);

  const toggleLanguage = useCallback(() => {
    const nextLang: AppLanguage = languageRef.current === "hi" ? "en" : "hi";
    applyLanguageChange(nextLang);
  }, [applyLanguageChange]);

  // Listen for storage events (cross-tab sync) and external custom events
  useEffect(() => {
    const handleCustomEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ language?: AppLanguage; source?: string }>;
      if (customEvent.detail?.source === "internal") {
        // Dispatched by our own toggleLanguage / setLanguage; ignore to avoid loop
        return;
      }
      if (
        customEvent.detail?.language &&
        (customEvent.detail.language === "hi" || customEvent.detail.language === "en")
      ) {
        const extLang = customEvent.detail.language;
        setLanguageState(extLang);
        languageRef.current = extLang;
        setUniversalLanguage(extLang);
      }
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === LANGUAGE_STORAGE_KEY && (e.newValue === "hi" || e.newValue === "en")) {
        const extLang = e.newValue as AppLanguage;
        setLanguageState(extLang);
        languageRef.current = extLang;
        setUniversalLanguage(extLang);
      }
    };

    window.addEventListener("cms-language-changed", handleCustomEvent);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("cms-language-changed", handleCustomEvent);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const t = useCallback(
    (textOrHi: string, enFallback?: string) => {
      if (enFallback !== undefined) {
        return language === "hi"
          ? cleanBilingualForHindi(textOrHi)
          : cleanBilingualForEnglish(enFallback);
      }
      if (language === "hi") {
        const val = CMS_DICTIONARY[textOrHi] || textOrHi;
        return cleanBilingualForHindi(val);
      }
      // English mode
      if (REVERSE_DICTIONARY[textOrHi]) {
        return cleanBilingualForEnglish(REVERSE_DICTIONARY[textOrHi]);
      }
      return cleanBilingualForEnglish(textOrHi);
    },
    [language]
  );

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        toggleLanguage,
        isHindi: language === "hi",
        isEnglish: language === "en",
        t,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    return {
      language: "en" as AppLanguage,
      setLanguage: () => {},
      toggleLanguage: () => {},
      isHindi: false,
      isEnglish: true,
      t: (textOrHi: string, enFallback?: string) => {
        if (enFallback !== undefined) return cleanBilingualForEnglish(enFallback);
        return cleanBilingualForEnglish(REVERSE_DICTIONARY[textOrHi] || textOrHi);
      },
    };
  }
  return context;
}
