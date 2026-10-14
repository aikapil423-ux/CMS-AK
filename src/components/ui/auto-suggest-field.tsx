"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { getGDSuggestions, type GDChainState, type GDSuggestion } from "@/lib/gdSuggestions";
import { autoResizeTextarea } from "@/components/ui/auto-resize-textarea";
import { suggestionStore } from "@/lib/suggestionStore";

export interface AutoSuggestFieldProps {
  value: string;
  onChange: (value: string) => void;
  /** Visual variant: single-line `<input>` or multi-line `<textarea>`. */
  as?: "input" | "textarea";
  /** Only used when `as === "textarea"`. */
  rows?: number;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  /** Feeds entry-type aware opening templates into the engine. */
  entryType?: string;
  id?: string;
  name?: string;
  maxLength?: number;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  enableGhost?: boolean;
  showAcceptBadge?: boolean;
  style?: React.CSSProperties;
  "data-testid"?: string;
}

/**
 * AutoSuggestField
 * ----------------
 * Renders the real input/textarea with a transparent background and layers a
 * "ghost" layer behind it that shows the predicted continuation in light grey.
 *
 * - TAB or RIGHT ARROW (at end) -> accepts the prediction and types it in.
 * - Any other key -> the officer's own character is typed and the ghost is
 *   recomputed, so their own word always wins.
 * - ESC  -> dismisses the current prediction without changing the value.
 * - Clickable Badge -> allows tapping to accept on touchscreens.
 */
export function AutoSuggestField({
  value,
  onChange,
  as = "input",
  rows = 6,
  placeholder,
  className,
  inputClassName,
  entryType,
  id,
  name,
  maxLength,
  required,
  disabled,
  readOnly,
  enableGhost = true,
  showAcceptBadge = true,
  style,
  "data-testid": dataTestId,
}: AutoSuggestFieldProps) {
  const ghostRef = useRef<HTMLDivElement | null>(null);
  const controlRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  /**
   * Tracks which fragment of which sequence TAB should offer next.
   * This is what makes repeated TAB presses walk through a sentence piece by
   * piece instead of dumping the whole thing at once.
   */
  const [chain, setChain] = useState<GDChainState | null>(null);

  // Dynamic subscription to suggestion store (personal dictionary, learned weights, uploaded files vocabulary)
  const [storeTick, setStoreTick] = useState(0);

  useEffect(() => {
    void suggestionStore.ensureLoaded();
    const unsubscribe = suggestionStore.subscribe(() => {
      setStoreTick((t) => t + 1);
    });
    return unsubscribe;
  }, []);

  /** Prediction for the current value, using vocabulary harvested from uploaded files and case documents. */
  const suggestion = useMemo(() => {
    if (!enableGhost || readOnly || disabled) return null;
    const options = suggestionStore.getEngineOptions();
    const candidates = getGDSuggestions(value, entryType, chain, options);
    return candidates[0] ?? null;
  }, [value, entryType, chain, enableGhost, readOnly, disabled, storeTick]);

  /**
   * Set when the officer presses ESC. Any subsequent change to `value`
   * clears it again, so the ghost comes back on the next keystroke.
   */
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setDismissed(false);
  }, [value]);

  const adjustHeight = useCallback(() => {
    if (as === "textarea" && controlRef.current) {
      autoResizeTextarea(controlRef.current as HTMLTextAreaElement);
    }
  }, [as]);

  useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

  const activeSuggestion = dismissed ? null : suggestion;

  /**
   * Applies the prediction.
   */
  const accept = useCallback(() => {
    if (!activeSuggestion) return;

    const head = value.slice(0, value.length - activeSuggestion.replaceLength);
    onChange(head + activeSuggestion.text);
    suggestionStore.recordAccept(activeSuggestion.key, entryType);
    setDismissed(false);

    if (activeSuggestion.sequenceIndex >= 0) {
      // Continue from whichever fragment is currently being offered.
      const currentNext =
        chain && chain.sequenceIndex === activeSuggestion.sequenceIndex
          ? chain.next
          : 0;
      setChain({ sequenceIndex: activeSuggestion.sequenceIndex, next: currentNext + 1 });
    } else {
      setChain(null);
    }
  }, [activeSuggestion, chain, value, onChange, entryType]);

  /**
   * Any real typing breaks the chain: the officer's own word takes over.
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setChain(null);
    setDismissed(false);
    onChange(e.target.value);
    if (as === "textarea") {
      autoResizeTextarea(e.target as HTMLTextAreaElement);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.key === "Escape") {
      if (activeSuggestion) {
        e.preventDefault();
        suggestionStore.recordReject(activeSuggestion.key, entryType, "dismiss");
        setDismissed(true);
        setChain(null);
      }
      return;
    }

    if (e.key === "Tab") {
      // Only hijack TAB when there is something to accept, so the officer can
      // still move focus normally on an empty/unmatched field.
      if (!activeSuggestion) return;
      e.preventDefault();
      accept();
      return;
    }

    if (e.key === "ArrowRight") {
      const target = e.currentTarget;
      // If cursor is at the very end of the input, ArrowRight accepts suggestion
      if (target.selectionStart === value.length && target.selectionEnd === value.length) {
        if (!activeSuggestion) return;
        e.preventDefault();
        accept();
      }
    }
  };

  /** Keeps the ghost layer scrolled in lock-step with the real control. */
  const syncScroll = () => {
    const ghost = ghostRef.current;
    const ctrl = controlRef.current;
    if (!ghost || !ctrl) return;
    ghost.scrollTop = ctrl.scrollTop;
    ghost.scrollLeft = ctrl.scrollLeft;
  };

  /** Styles for the real, interactive control. */
  const sharedClasses = cn(
    "w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg",
    "focus:ring-2 focus:ring-[#0b192c] focus:outline-none font-sans",
    inputClassName
  );

  /**
   * Shared visual recipe for BOTH layers. They must match exactly or the ghost
   * text will not line up with the typed text.
   */
  const layerRecipe = cn(
    "font-sans text-xs sm:text-sm px-3 py-2 border border-transparent rounded-lg",
    as === "textarea"
      ? "whitespace-pre-wrap break-words overflow-hidden"
      : "whitespace-nowrap overflow-hidden",
    inputClassName,
    "!border-transparent !shadow-none !ring-0 !outline-none"
  );

  let displayGhost = "";
  let spacerText = value;

  if (activeSuggestion) {
    if (activeSuggestion.replaceLength > 0) {
      const typedPrefix = value.slice(value.length - activeSuggestion.replaceLength);
      if (activeSuggestion.text.toLowerCase().startsWith(typedPrefix.toLowerCase())) {
        displayGhost = activeSuggestion.text.slice(activeSuggestion.replaceLength);
        spacerText = value;
      } else {
        displayGhost = activeSuggestion.text;
        spacerText = value.slice(0, value.length - activeSuggestion.replaceLength);
      }
    } else {
      displayGhost = activeSuggestion.text;
      spacerText = value;
    }
  }

  /** Transparent spacer + light-grey prediction, sitting behind the real control. */
  const ghostLayer = (
    <div
      ref={ghostRef}
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 z-0 text-slate-400 select-none", layerRecipe)}
    >
      {/* Invisible copy of the typed text so the prediction starts right at the caret. */}
      <span className="invisible whitespace-pre-wrap">{spacerText}</span>
      {displayGhost && <span className="text-slate-400/90 font-normal">{displayGhost}</span>}
    </div>
  );

  const controlProps = {
    id,
    name,
    value,
    maxLength,
    required,
    disabled,
    readOnly,
    style,
    "data-testid": dataTestId,
    placeholder,
    onChange: handleChange,
    onKeyDown: handleKeyDown,
    onScroll: syncScroll,
    // Hide the native placeholder while a ghost hint is on screen.
    className: cn(
      sharedClasses,
      "block relative z-10 bg-transparent",
      activeSuggestion && "placeholder-transparent"
    ),
  };

  return (
    <div className={cn("relative w-full", className)}>
      {ghostLayer}
      {as === "textarea" ? (
        <textarea
          {...controlProps}
          rows={rows}
          ref={controlRef as React.RefObject<HTMLTextAreaElement>}
          className={cn(controlProps.className, "resize-none overflow-hidden transition-[height] duration-75")}
        />
      ) : (
        <input
          {...controlProps}
          type="text"
          ref={controlRef as React.RefObject<HTMLInputElement>}
        />
      )}

      {/* Floating Clickable Acceptance Badge for Mobile / Touch & Visual Clarity */}
      {showAcceptBadge && activeSuggestion && (
        <button
          type="button"
          tabIndex={-1}
          onMouseDown={(e) => {
            e.preventDefault();
            accept();
          }}
          className="no-print absolute right-2.5 bottom-2.5 z-20 flex items-center gap-1.5 bg-slate-900/90 hover:bg-slate-950 text-white text-[10px] font-semibold px-2 py-0.5 rounded shadow cursor-pointer select-none transition-all animate-in fade-in border border-slate-700/60"
          title="Press Tab, → or click here to complete"
        >
          <span className="text-slate-300">सुझाव</span>
          <kbd className="px-1 py-0.2 bg-slate-800 rounded text-[9px] font-mono border border-slate-600 text-amber-300">Tab ⇥</kbd>
        </button>
      )}
    </div>
  );
}

/** Small helper so a page can advertise the TAB hint next to a field. */
export function SuggestionHint({ className }: { className?: string }) {
  return (
    <span className={cn("hidden sm:inline text-[10px] font-medium text-slate-400", className)}>
      Tip: press <kbd className="px-1 rounded border border-slate-300 bg-white font-mono">Tab</kbd>{" "}
      to accept a suggestion
    </span>
  );
}
