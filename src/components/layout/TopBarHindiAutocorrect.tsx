"use client";

import { useHindiAutocorrectPreference } from "@/hooks/useHindiAutocorrect";

export function TopBarHindiAutocorrect() {
  const { enabled, toggle } = useHindiAutocorrectPreference();

  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label="हिंदी Auto-correct"
      title={`हिंदी Auto-correct · ${enabled ? "ON" : "OFF"}`}
      onClick={toggle}
      className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border focus-visible:outline-2 focus-visible:outline-blue-600 ${
        enabled
          ? "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-600 dark:bg-blue-950 dark:text-blue-200"
          : "border-slate-300 bg-white text-slate-600 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300"
      }`}
    >
      <span aria-hidden="true" lang="hi" className="relative text-xl font-bold leading-none">
        अ
        {!enabled && <span className="absolute inset-x-[-2px] top-1/2 h-0.5 -rotate-45 bg-current" />}
      </span>
    </button>
  );
}
