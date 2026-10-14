"use client";

import React, { useState } from "react";
import { Languages, Globe } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface TopBarLanguageSwitcherProps {
  isMobile?: boolean;
}

export function TopBarLanguageSwitcher({ isMobile = false }: TopBarLanguageSwitcherProps) {
  const { language, toggleLanguage, isHindi } = useLanguage();
  const [justToggled, setJustToggled] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleLanguage();
    setJustToggled(true);
    setTimeout(() => setJustToggled(false), 800);
  };

  const titleText = isHindi
    ? "भाषा: हिन्दी (English में बदलने के लिए क्लिक करें)"
    : "Language: English (Click to switch to हिन्दी)";

  if (isMobile) {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={`relative p-1.5 rounded-md border transition-all active:scale-95 flex items-center justify-center ${
          isHindi
            ? "bg-amber-50/80 border-amber-300 text-amber-900 hover:bg-amber-100"
            : "bg-blue-50/80 border-blue-300 text-blue-900 hover:bg-blue-100"
        }`}
        title={titleText}
        aria-label={titleText}
      >
        <Languages className="w-4 h-4" />
        <span
          className={`absolute -bottom-1 -right-1 text-[8px] font-black px-1 leading-none rounded shadow-2xs border ${
            isHindi
              ? "bg-amber-600 text-white border-amber-700"
              : "bg-blue-600 text-white border-blue-700"
          }`}
        >
          {isHindi ? "हिं" : "EN"}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`relative p-2 rounded-lg border transition-all active:scale-95 flex items-center justify-center group shadow-2xs ${
        isHindi
          ? "bg-amber-50/70 hover:bg-amber-100/80 border-amber-200 text-amber-900"
          : "bg-blue-50/70 hover:bg-blue-100/80 border-blue-200 text-blue-900"
      }`}
      title={titleText}
      aria-label={titleText}
    >
      <Languages
        className={`w-4 h-4 transition-transform group-hover:scale-110 ${
          justToggled ? "rotate-180 transition-transform duration-300" : ""
        } ${isHindi ? "text-amber-800" : "text-blue-800"}`}
      />
      <span
        className={`absolute -top-1 -right-1 text-[9px] font-black px-1 py-0.2 rounded-full border shadow-2xs tracking-tighter ${
          isHindi
            ? "bg-amber-600 text-white border-amber-700"
            : "bg-blue-600 text-white border-blue-700"
        }`}
      >
        {isHindi ? "हिं" : "EN"}
      </span>
    </button>
  );
}
