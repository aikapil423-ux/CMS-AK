"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { getGDSuggestion, type GDChainState } from "@/lib/gdSuggestions";

interface AutoSuggestFieldProps {
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
  required?: boolean;
  disabled?: boolean;
  "data-testid"?: string;
}

/**
 * AutoSuggestField
 * ----------------
 * Renders the real input/textarea with a transparent background and layers a
 * "ghost" layer behind it that shows the predicted continuation in light grey.
 *
 * - TAB  -> accepts the prediction and types it in.
 * - Any other key -> the officer's own character is typed and the ghost is
 *   recomputed, so their own word always wins.
 * - ESC  -> dismisses the current prediction without changing the value.
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
  required,
  disabled,
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

  /** Prediction for the current value, taking any active chain into account. */
  const suggestion = useMemo(
    () => getGDSuggestion(value, entryType, chain),
    [value, entryType, chain]
  );

  /**
   * Set when the officer presses ESC. Any subsequent change to `value`
   * clears it again, so the ghost comes back on the next keystroke.
   */
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setDismissed(false);
  }, [value]);

  const activeSuggestion = dismissed ? null : suggestion;

  /**
   * Applies the prediction.
   *
   * When the prediction came from a sequence, the chain is ADVANCED to the next
   * fragment so the following TAB offers the next piece. The chain is cleared
   * whenever the officer types their own word, because then their text - not
   * ours - is the source of truth (exactly how a real keyboard behaves).
   */
  const accept = useCallback(() => {
    if (!activeSuggestion) return;

    const head = value.slice(0, value.length - activeSuggestion.replaceLength);
    onChange(head + activeSuggestion.text);
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
  }, [activeSuggestion, chain, value, onChange]);

  /**
   * Any real typing breaks the chain: the officer's own word takes over.
   * (Called from onChange, before updating the value.)
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setChain(null);
    setDismissed(false);
    onChange(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.key === "Escape") {
      if (activeSuggestion) {
        e.preventDefault();
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
      : "whitespace-nowrap overflow-hidden"
  );

  const ghostText = activeSuggestion ? activeSuggestion.text : "";

  /** Transparent spacer + light-grey prediction, sitting behind the real control. */
  const ghostLayer = (
    <div
      ref={ghostRef}
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 z-0 text-slate-300 select-none", layerRecipe)}
    >
      {/* Invisible copy of the typed text so the prediction starts at the caret. */}
      <span className="invisible">{value}</span>
      {ghostText && <span>{ghostText}</span>}
    </div>
  );

  const controlProps = {
    id,
    value,
    required,
    disabled,
    "data-testid": dataTestId,
    placeholder,
    onChange: handleChange,
    onKeyDown: handleKeyDown,
    onScroll: syncScroll,
    // Hide the native placeholder while a ghost hint is on screen.
    className: cn(
      sharedClasses,
      "relative z-10 bg-slate-50/0",
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
          className={cn(controlProps.className, "resize-y min-h-[120px]")}
        />
      ) : (
        <input
          {...controlProps}
          type="text"
          ref={controlRef as React.RefObject<HTMLInputElement>}
        />
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
