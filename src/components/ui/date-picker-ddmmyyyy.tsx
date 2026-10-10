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

// Convert DD/MM/YYYY to YYYY-MM-DD
function ddmmyyyyToIso(dmy: string): string {
  if (!dmy) return "";
  const parts = dmy.trim().split(/[-/.]/);
  if (parts.length === 3) {
    const dd = parts[0].padStart(2, "0");
    const mm = parts[1].padStart(2, "0");
    const yyyy = parts[2];
    if (yyyy.length === 4 && Number(mm) >= 1 && Number(mm) <= 12 && Number(dd) >= 1 && Number(dd) <= 31) {
      return `${yyyy}-${mm}-${dd}`;
    }
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(dmy)) {
    return dmy.slice(0, 10);
  }
  return "";
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

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/[^0-9/]/g, "");

    // Automatically format typing: e.g. "10" -> "10/", "10/10" -> "10/10/"
    if (raw.length === 2 && !raw.includes("/")) {
      raw = raw + "/";
    } else if (raw.length === 5 && raw.split("/").length === 2) {
      raw = raw + "/";
    }
    if (raw.length > 10) {
      raw = raw.slice(0, 10);
    }

    setDisplayText(raw);

    const iso = ddmmyyyyToIso(raw);
    if (iso) {
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
      setDisplayText(isoToDdmmyyyy(iso));
      triggerChange(iso);
    } else {
      // Revert to previous valid value
      setDisplayText(isoToDdmmyyyy(value));
    }
  };

  const openPicker = () => {
    if (disabled) return;
    try {
      hiddenDateRef.current?.showPicker();
    } catch {
      hiddenDateRef.current?.focus();
    }
  };

  const isoMin = min ? (min.includes("/") ? ddmmyyyyToIso(min) : min) : undefined;
  const isoMax = max ? (max.includes("/") ? ddmmyyyyToIso(max) : max) : undefined;
  const currentIso = ddmmyyyyToIso(displayText) || (value ? (value.includes("/") ? ddmmyyyyToIso(value) : value) : "");

  const heightClass = size === "sm" ? "h-8 text-xs py-1" : size === "lg" ? "h-11 text-base py-2.5" : "h-9 text-xs sm:text-sm py-1.5";

  return (
    <div className={`relative inline-flex items-center w-full ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}>
      {/* Hidden native input for calendar pop-up */}
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
          const pickedIso = e.target.value;
          if (pickedIso) {
            setDisplayText(isoToDdmmyyyy(pickedIso));
            triggerChange(pickedIso);
          } else {
            setDisplayText("");
            triggerChange("");
          }
        }}
        className="sr-only pointer-events-none"
      />

      {/* Visible Input strictly showing DD/MM/YYYY */}
      <input
        id={inputId}
        name={name}
        type="text"
        inputMode="numeric"
        placeholder={placeholder}
        value={displayText}
        onChange={handleTextChange}
        onBlur={handleBlur}
        disabled={disabled}
        required={required}
        title={title || "Enter date in DD/MM/YYYY format or pick from calendar"}
        className={`w-full pl-3 pr-8 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0b192c] focus:border-transparent transition-all placeholder:font-sans placeholder:font-normal placeholder:text-slate-400 ${heightClass} ${className}`}
      />

      {/* Calendar Button */}
      <button
        type="button"
        tabIndex={-1}
        onClick={openPicker}
        disabled={disabled}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-blue-700 hover:bg-slate-200/60 rounded transition-colors cursor-pointer"
        title="Open calendar picker"
        aria-label="Open calendar"
      >
        <Calendar className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
