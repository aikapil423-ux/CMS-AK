"use client";

import React, { useState } from "react";

interface LawMapping {
  newSection: string;
  newAct: "BNS" | "BNSS" | "BSA";
  oldSection: string;
  oldAct: "IPC" | "CrPC" | "IEA";
  titleEn: string;
  titleHi: string;
}

const LAW_DICTIONARY: Record<string, LawMapping> = {
  // BNS -> IPC (Substantive Crime)
  "303(2)": {
    newSection: "BNS 303(2)",
    newAct: "BNS",
    oldSection: "IPC Sec 379",
    oldAct: "IPC",
    titleEn: "Theft / Snatching",
    titleHi: "चोरी का अपराध",
  },
  "303": {
    newSection: "BNS 303",
    newAct: "BNS",
    oldSection: "IPC Sec 378/379",
    oldAct: "IPC",
    titleEn: "Theft",
    titleHi: "चोरी",
  },
  "304": {
    newSection: "BNS 304",
    newAct: "BNS",
    oldSection: "IPC Sec 379/382",
    oldAct: "IPC",
    titleEn: "Snatching",
    titleHi: "झपटमारी / स्नैचिंग",
  },
  "304(2)": {
    newSection: "BNS 304(2)",
    newAct: "BNS",
    oldSection: "IPC Sec 379/356",
    oldAct: "IPC",
    titleEn: "Snatching by force",
    titleHi: "बलपूर्वक झपटमारी",
  },
  "103": {
    newSection: "BNS 103",
    newAct: "BNS",
    oldSection: "IPC Sec 302",
    oldAct: "IPC",
    titleEn: "Murder",
    titleHi: "हत्या",
  },
  "109": {
    newSection: "BNS 109",
    newAct: "BNS",
    oldSection: "IPC Sec 307",
    oldAct: "IPC",
    titleEn: "Attempt to murder",
    titleHi: "हत्या का प्रयास",
  },
  "115": {
    newSection: "BNS 115",
    newAct: "BNS",
    oldSection: "IPC Sec 323",
    oldAct: "IPC",
    titleEn: "Voluntarily causing hurt",
    titleHi: "स्वेच्छा से चोट पहुँचाना",
  },
  "126": {
    newSection: "BNS 126",
    newAct: "BNS",
    oldSection: "IPC Sec 341",
    oldAct: "IPC",
    titleEn: "Wrongful restraint",
    titleHi: "रास्ता रोकना",
  },
  "316": {
    newSection: "BNS 316",
    newAct: "BNS",
    oldSection: "IPC Sec 406",
    oldAct: "IPC",
    titleEn: "Criminal breach of trust",
    titleHi: "अमानत में खयानत",
  },
  "318": {
    newSection: "BNS 318",
    newAct: "BNS",
    oldSection: "IPC Sec 420",
    oldAct: "IPC",
    titleEn: "Cheating",
    titleHi: "धोखाधड़ी / चीटिंग",
  },
  "351": {
    newSection: "BNS 351",
    newAct: "BNS",
    oldSection: "IPC Sec 506",
    oldAct: "IPC",
    titleEn: "Criminal intimidation",
    titleHi: "जान से मारने की धमकी",
  },

  // BNSS -> CrPC (Procedural Law)
  "173": {
    newSection: "BNSS 173",
    newAct: "BNSS",
    oldSection: "CrPC Sec 154",
    oldAct: "CrPC",
    titleEn: "FIR Registration",
    titleHi: "प्रथम सूचना रिपोर्ट (FIR) दर्ज करना",
  },
  "173(3)": {
    newSection: "BNSS 173(3)",
    newAct: "BNSS",
    oldSection: "Preliminary Inquiry",
    oldAct: "CrPC",
    titleEn: "Preliminary Spot Verification (14-day window)",
    titleHi: "प्राथमिक जाँच (14 दिन की समय-सीमा)",
  },
  "175": {
    newSection: "BNSS 175",
    newAct: "BNSS",
    oldSection: "CrPC Sec 156(3)",
    oldAct: "CrPC",
    titleEn: "Magistrate Investigation Direction",
    titleHi: "मजिस्ट्रेट द्वारा तफ्तीश का आदेश",
  },
  "176": {
    newSection: "BNSS 176",
    newAct: "BNSS",
    oldSection: "CrPC Sec 157",
    oldAct: "CrPC",
    titleEn: "Procedure for investigation & spot visit",
    titleHi: "मौका मुआयना एवं तफ्तीश की प्रक्रिया",
  },
  "187": {
    newSection: "BNSS 187",
    newAct: "BNSS",
    oldSection: "CrPC Sec 167",
    oldAct: "CrPC",
    titleEn: "24-hr Remand & Police/Judicial Custody",
    titleHi: "24-घंटे में रिमांड व पुलिस हिरासत",
  },
  "193": {
    newSection: "BNSS 193",
    newAct: "BNSS",
    oldSection: "CrPC Sec 173(2)",
    oldAct: "CrPC",
    titleEn: "Final Report / Chargesheet (60/90 Days)",
    titleHi: "अंतिम रिपोर्ट / चालान (60/90 दिन)",
  },

  // BSA -> IEA (Evidence Law)
  "63": {
    newSection: "BSA 63",
    newAct: "BSA",
    oldSection: "IEA Sec 65B",
    oldAct: "IEA",
    titleEn: "Electronic Evidence Certificate",
    titleHi: "इलेक्ट्रॉनिक साक्ष्य प्रमाण पत्र (पूर्व 65B)",
  },
};

interface LawSectionTooltipProps {
  sectionText: string;
  className?: string;
  showBadge?: boolean;
}

export function LawSectionTooltip({ sectionText, className = "", showBadge = false }: LawSectionTooltipProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Extract section numbers like 303(2), 173, etc.
  const cleanMatch = sectionText.match(/(\d+(\(\d+\))?)/);
  const key = cleanMatch ? cleanMatch[1] : "";
  const mapping = LAW_DICTIONARY[key];

  if (!mapping) {
    return <span className={className}>{sectionText}</span>;
  }

  return (
    <span
      className="relative inline-block group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span
        className={`cursor-help border-b border-dotted border-blue-600 transition-colors ${
          showBadge
            ? "px-1.5 py-0.5 rounded bg-blue-50 text-blue-900 border border-blue-200 font-mono text-[11px] font-semibold"
            : className || "text-blue-900 font-semibold"
        }`}
      >
        {sectionText}
      </span>

      {isHovered && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-50 w-64 p-2.5 bg-slate-900 text-white rounded-xl shadow-2xl text-left border border-slate-700 animate-in fade-in-50 zoom-in-95 pointer-events-none">
          <span className="block text-[10px] font-mono text-amber-300 font-bold uppercase tracking-wider">
            New Law (नया कानून)
          </span>
          <span className="block text-xs font-bold text-white mt-0.5">
            {mapping.newSection} — {mapping.titleEn}
          </span>
          <span className="block text-[11px] text-slate-300 font-medium">
            {mapping.titleHi}
          </span>

          <span className="block my-1.5 border-t border-slate-700/80"></span>

          <span className="block text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider">
            Earlier Equivalent (पुराना कानून)
          </span>
          <span className="block text-xs font-semibold text-emerald-200 mt-0.5">
            {mapping.oldSection} ({mapping.oldAct})
          </span>
          <span className="block text-[9px] text-slate-400 mt-1">
            Hover to view Indian legal code alignment
          </span>
        </span>
      )}
    </span>
  );
}
