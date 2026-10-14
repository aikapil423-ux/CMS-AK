"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export type AppLanguage = "hi" | "en";

interface LanguageContextType {
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  toggleLanguage: () => void;
  isHindi: boolean;
  isEnglish: boolean;
  t: (hiText: string, enText: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LANGUAGE_STORAGE_KEY = "cms_app_language";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>("hi");
  const [mounted, setMounted] = useState(false);

  // Initialize from localStorage or default to "hi"
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY) as AppLanguage | null;
      if (saved === "hi" || saved === "en") {
        setLanguageState(saved);
        if (typeof document !== "undefined") {
          document.documentElement.lang = saved;
        }
      } else {
        // default is Hindi
        setLanguageState("hi");
        if (typeof document !== "undefined") {
          document.documentElement.lang = "hi";
        }
      }
    } catch {
      // ignore
    }
    setMounted(true);
  }, []);

  const setLanguage = useCallback((lang: AppLanguage) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
      if (typeof document !== "undefined") {
        document.documentElement.lang = lang;
      }
      // Broadcast to any component / tab
      window.dispatchEvent(
        new CustomEvent("cms-language-changed", { detail: { language: lang } })
      );
    } catch {
      // ignore
    }
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguageState((prev) => {
      const nextLang: AppLanguage = prev === "hi" ? "en" : "hi";
      try {
        localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLang);
        if (typeof document !== "undefined") {
          document.documentElement.lang = nextLang;
        }
        window.dispatchEvent(
          new CustomEvent("cms-language-changed", { detail: { language: nextLang } })
        );
      } catch {
        // ignore
      }
      return nextLang;
    });
  }, []);

  // Listen for storage events or custom events from other parts
  useEffect(() => {
    const handleCustomEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ language?: AppLanguage }>;
      if (customEvent.detail?.language && (customEvent.detail.language === "hi" || customEvent.detail.language === "en")) {
        setLanguageState(customEvent.detail.language);
      }
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === LANGUAGE_STORAGE_KEY && (e.newValue === "hi" || e.newValue === "en")) {
        setLanguageState(e.newValue as AppLanguage);
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
    (hiText: string, enText: string) => {
      return language === "hi" ? hiText : enText;
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
    // Provide a safe fallback if used outside of LanguageProvider
    return {
      language: "hi" as AppLanguage,
      setLanguage: () => {},
      toggleLanguage: () => {},
      isHindi: true,
      isEnglish: false,
      t: (hiText: string, _enText: string) => hiText,
    };
  }
  return context;
}
