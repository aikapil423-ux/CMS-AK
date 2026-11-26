"use client";

import React, { useState, useEffect, useRef, useId } from "react";
import { Calendar } from "lucide-react";
import { toDDMMYYYY } from "@/lib/gdDateTime";

export interface DatePickerDDMMYYYYProps {
  value?: string;
  onChange?: (e: { target: { value: string; name?: string } }) => void;
  onValueChange?: (value: string) => void;
  name?: string;
  id?: string;
  placeholder?: string;
  min?: string;
  max?: string;
  allowFutureDates?: boolean;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  title?: string;
  size?: "sm" | "md" | "lg";
}

// Convert YYYY-MM-DD to DD/MM/YYYY
function isoToDdmmyyyy(iso: string): string {
  if (!iso) return "";
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return `${match[3]}/${match[2]}/${match[1]}`;
  }
  return toDDMMYYYY(iso);
}

// Convert DD/MM/YYYY to YYYY-MM-DD (rejects impossible calendar dates like 31/02/2026)
function ddmmyyyyToIso(dmy: string): string {
  if (!dmy) return "";
  const parts = dmy.trim().split(/[-/.]/);
  if (parts.length === 3) {
    const ddStr = parts[0].padStart(2, "0");
    const mmStr = parts[1].padStart(2, "0");
    const yyyyStr = parts[2];
    if (yyyyStr.length === 4) {
      const dd = Number(ddStr);
      const mm = Number(mmStr);
      const yyyy = Number(yyyyStr);
      if (yyyy >= 1900 && yyyy <= 2100 && mm >= 1 && mm <= 12 && dd >= 1 && dd <= 31) {
        const dt = new Date(yyyy, mm - 1, dd);
        if (dt.getFullYear() === yyyy && dt.getMonth() === mm - 1 && dt.getDate() === dd) {
          return `${yyyyStr}-${mmStr}-${ddStr}`;
        }
      }
    }
    return "";
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(dmy)) {
    const [yyyyStr, mmStr, ddStr] = dmy.slice(0, 10).split("-");
    const yyyy = Number(yyyyStr);
    const mm = Number(mmStr);
    const dd = Number(ddStr);
    const dt = new Date(yyyy, mm - 1, dd);
    if (dt.getFullYear() === yyyy && dt.getMonth() === mm - 1 && dt.getDate() === dd) {
      return dmy.slice(0, 10);
    }
  }
  return "";
}

function getTodayIso(): string {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
  } catch {
    return new Date().toISOString().split("T")[0];
  }
}

export function DatePickerDDMMYYYY({
  value = "",
  onChange,
  onValueChange,
  name,
  id,
  placeholder = "DD/MM/YYYY",
  min,
  max,
  allowFutureDates = false,
  disabled = false,
  required = false,
  className = "",
  title,
  size = "md",
}: DatePickerDDMMYYYYProps) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const hiddenDateRef = useRef<HTMLInputElement>(null);

  // Derive initial display value (DD/MM/YYYY)
  const [displayText, setDisplayText] = useState(() => isoToDdmmyyyy(value));

  // Sync when prop value changes
  useEffect(() => {
    setDisplayText(isoToDdmmyyyy(value));
  }, [value]);

  const triggerChange = (isoVal: string) => {
    if (onValueChange) {
      onValueChange(isoVal);
    }
    if (onChange) {
      onChange({
        target: {
          value: isoVal,
          name,
        },
      });
    }
  };

  const todayIso = React.useMemo(() => getTodayIso(), []);
  const isoMin = min ? (min.includes("/") ? ddmmyyyyToIso(min) : min) : undefined;
  const userIsoMax = max ? (max.includes("/") ? ddmmyyyyToIso(max) : max) : undefined;
  const isoMax = allowFutureDates
    ? userIsoMax
    : userIsoMax && userIsoMax < todayIso
    ? userIsoMax
    : todayIso;

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/[^0-9/]/g, "");
    const isDeleting = e.target.value.length < displayText.length;

    // Auto-insert '/' only while typing forward so Backspace across '/' never traps the user
    if (!isDeleting) {
      if (raw.length === 2 && !raw.includes("/")) {
        raw = raw + "/";
      } else if (raw.length === 5 && raw.split("/").length === 2) {
        raw = raw + "/";
      }
    }
    if (raw.length > 10) {
      raw = raw.slice(0, 10);
    }

    setDisplayText(raw);

    const iso = ddmmyyyyToIso(raw);
    if (iso) {
      if (isoMax && iso > isoMax) {
        setDisplayText(isoToDdmmyyyy(isoMax));
        triggerChange(isoMax);
        return;
      }
      if (isoMin && iso < isoMin) {
        setDisplayText(isoToDdmmyyyy(isoMin));
        triggerChange(isoMin);
        return;
      }
      triggerChange(iso);
    } else if (!raw.trim()) {
      triggerChange("");
    }
  };

  const handleBlur = () => {
    if (!displayText.trim()) {
      triggerChange("");
      setDisplayText("");
      return;
    }
    const iso = ddmmyyyyToIso(displayText);
    if (iso) {
      if (isoMax && iso > isoMax) {
        setDisplayText(isoToDdmmyyyy(isoMax));
        triggerChange(isoMax);
        return;
      }
      if (isoMin && iso < isoMin) {
        setDisplayText(isoToDdmmyyyy(isoMin));
        triggerChange(isoMin);
        return;
      }
      setDisplayText(isoToDdmmyyyy(iso));
      triggerChange(iso);
    } else {
      // Revert to previous valid value
      setDisplayText(isoToDdmmyyyy(value));
    }
  };

  const openPicker = () => {
    if (disabled || !hiddenDateRef.current) return;
    try {
      hiddenDateRef.current.showPicker();
    } catch {
      try {
        hiddenDateRef.current.focus();
        hiddenDateRef.current.click();
      } catch {
        // ignore
      }
    }
  };

  const currentIso = ddmmyyyyToIso(displayText) || (value ? (value.includes("/") ? ddmmyyyyToIso(value) : value) : "");
  const isInvalidComplete = displayText.trim().length >= 8 && !ddmmyyyyToIso(displayText);

  const heightClass = size === "sm" ? "h-8 text-xs py-1" : size === "lg" ? "h-11 text-base py-2.5" : "h-9 text-xs sm:text-sm py-1.5";

  return (
    <div className={`relative inline-flex items-center w-full ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}>
      {/* Anchored native input for calendar pop-up (avoids clipping behind sticky headers) */}
      <input
        ref={hiddenDateRef}
        type="date"
        tabIndex={-1}
        aria-hidden="true"
        value={currentIso}
        min={isoMin}
        max={isoMax}
        disabled={disabled}
        onChange={(e) => {
          let pickedIso = e.target.value;
          if (pickedIso) {
            if (isoMax && pickedIso > isoMax) {
              pickedIso = isoMax;
            }
            if (isoMin && pickedIso < isoMin) {
              pickedIso = isoMin;
            }
            setDisplayText(isoToDdmmyyyy(pickedIso));
            triggerChange(pickedIso);
          } else {
            setDisplayText("");
            triggerChange("");
          }
        }}
        className="opacity-0 pointer-events-none absolute right-2 top-full mt-1 w-1 h-1 z-[70]"
      />

      {/* Visible Input strictly showing DD/MM/YYYY */}
      <input
        id={inputId}
        name={name}
        type="text"
        inputMode="numeric"
        aria-invalid={isInvalidComplete || undefined}
        placeholder={placeholder}
        value={displayText}
        onChange={handleTextChange}
        onBlur={handleBlur}
        disabled={disabled}
        required={required}
        title={title || "Enter date in DD/MM/YYYY format or pick from calendar"}
        className={`w-full pl-3 pr-9 bg-slate-50 border ${isInvalidComplete ? "border-red-500 ring-1 ring-red-400" : "border-slate-300"} rounded-lg font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0b192c] focus:border-transparent transition-all placeholder:font-sans placeholder:font-normal placeholder:text-slate-400 ${heightClass} ${className}`}
      />

      {/* Keyboard-accessible Calendar Button */}
      <button
        type="button"
        onClick={openPicker}
        disabled={disabled}
        className="absolute right-1.5 top-1/2 -translate-y-1/2 min-w-[28px] min-h-[28px] p-1 flex items-center justify-center text-slate-500 hover:text-blue-700 hover:bg-slate-200/60 rounded transition-colors cursor-pointer"
        title="Open calendar picker"
        aria-label="Open calendar"
      >
        <Calendar className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
