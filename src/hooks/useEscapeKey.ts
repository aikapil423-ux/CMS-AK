"use client";

import { useEffect, useRef } from "react";

/**
 * Invokes `onEscape` when the Escape key is pressed while `active` is true.
 * Uses a ref for the callback so callers can pass inline handlers safely.
 */
export function useEscapeKey(active: boolean, onEscape: () => void): void {
  const handlerRef = useRef(onEscape);
  handlerRef.current = onEscape;

  useEffect(() => {
    if (!active) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        handlerRef.current();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [active]);
}
