"use client";

import React, {
  useEffect,
  useRef,
  useCallback,
  TextareaHTMLAttributes,
  forwardRef,
} from "react";
import { cn } from "@/lib/utils";

/**
 * Automatically adjusts the height of a textarea element so that all content
 * is vertically visible without inner vertical clipping or cut-off text.
 */
export function autoResizeTextarea(textarea: HTMLTextAreaElement | null | undefined): void {
  if (!textarea || typeof window === "undefined") return;
  if (textarea.dataset.noAutoResize === "true") return;
  if (!textarea.isConnected) return;

  // Don't calculate if the element is currently hidden (e.g. unopened modal/tab)
  if (textarea.offsetParent === null && textarea.scrollHeight === 0) return;

  const style = window.getComputedStyle(textarea);
  if (style.display === "none" || style.visibility === "hidden") return;

  // Determine minimum height from minHeight style or rows attribute
  let minHeight = parseFloat(style.minHeight) || 0;
  if (!minHeight) {
    const rows = textarea.rows || 3;
    const lineHeight = parseFloat(style.lineHeight) || 20;
    const paddingTop = parseFloat(style.paddingTop) || 8;
    const paddingBottom = parseFloat(style.paddingBottom) || 8;
    const borderTop = parseFloat(style.borderTopWidth) || 1;
    const borderBottom = parseFloat(style.borderBottomWidth) || 1;
    minHeight = rows * lineHeight + paddingTop + paddingBottom + borderTop + borderBottom;
  }
  if (!minHeight || isNaN(minHeight)) minHeight = 60;

  // Temporarily reset height to auto to recalculate true scrollHeight (handles shrink on backspace/deletion)
  textarea.style.height = "auto";
  const newHeight = Math.max(textarea.scrollHeight, minHeight);

  textarea.style.height = `${newHeight}px`;
  // Ensure typed content is never clipped or hidden behind an inner vertical scrollbar
  textarea.style.overflowY = "hidden";
}

/**
 * React hook to attach automatic vertical resizing to any textarea ref
 */
export function useAutoResizeTextarea<T extends HTMLTextAreaElement = HTMLTextAreaElement>(
  value?: any,
  minRows?: number
) {
  const ref = useRef<T | null>(null);

  const resize = useCallback(() => {
    if (ref.current) {
      if (minRows && !ref.current.rows) {
        ref.current.rows = minRows;
      }
      autoResizeTextarea(ref.current);
    }
  }, [minRows]);

  useEffect(() => {
    resize();
  }, [value, resize]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handleInput = () => autoResizeTextarea(el);
    el.addEventListener("input", handleInput);
    el.addEventListener("focus", handleInput);

    // Initial resize on mount
    const timer = setTimeout(resize, 0);

    return () => {
      clearTimeout(timer);
      el.removeEventListener("input", handleInput);
      el.removeEventListener("focus", handleInput);
    };
  }, [resize]);

  return { ref, resize };
}

export interface AutoResizeTextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  minRows?: number;
  autoResize?: boolean;
}

/**
 * Drop-in <AutoResizeTextarea> component.
 * Expands vertically automatically as you type so text is never hidden.
 */
export const AutoResizeTextarea = forwardRef<HTMLTextAreaElement, AutoResizeTextareaProps>(
  ({ className, minRows = 3, autoResize = true, value, onChange, onInput, rows, ...props }, forwardedRef) => {
    const internalRef = useRef<HTMLTextAreaElement | null>(null);

    const setRefs = useCallback(
      (node: HTMLTextAreaElement | null) => {
        internalRef.current = node;
        if (typeof forwardedRef === "function") {
          forwardedRef(node);
        } else if (forwardedRef) {
          (forwardedRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = node;
        }
      },
      [forwardedRef]
    );

    const handleResize = useCallback(() => {
      if (autoResize && internalRef.current) {
        autoResizeTextarea(internalRef.current);
      }
    }, [autoResize]);

    useEffect(() => {
      handleResize();
    }, [value, handleResize]);

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (autoResize) {
        autoResizeTextarea(e.target);
      }
      onChange?.(e);
    };

    const handleInputEvent = (e: React.FormEvent<HTMLTextAreaElement>) => {
      if (autoResize) {
        autoResizeTextarea(e.currentTarget);
      }
      onInput?.(e as any);
    };

    return (
      <textarea
        ref={setRefs}
        rows={rows || minRows}
        value={value}
        onChange={handleInputChange}
        onInput={handleInputEvent}
        className={cn(
          "w-full transition-[height] duration-75 ease-out resize-none leading-relaxed",
          className
        )}
        {...props}
      />
    );
  }
);
AutoResizeTextarea.displayName = "AutoResizeTextarea";

let isGlobalInterceptorInitialized = false;

/**
 * Initializes global event delegation and prototype hooks so that EVERY textarea
 * throughout the entire portal (inputs, forms, dialogs, templates, voice dictations)
 * automatically resizes vertically to fit all entered content without clipping.
 */
export function initGlobalAutoResize(): () => void {
  if (typeof window === "undefined" || isGlobalInterceptorInitialized) {
    return () => {};
  }
  isGlobalInterceptorInitialized = true;

  // 1. Resize all visible textareas currently in the DOM
  const resizeAllVisible = () => {
    const textareas = document.querySelectorAll<HTMLTextAreaElement>("textarea");
    textareas.forEach((ta) => {
      if (ta.offsetParent !== null || ta.scrollHeight > 0) {
        autoResizeTextarea(ta);
      }
    });
  };

  // 2. Document event listeners for user input, paste, and focus
  const onInputOrChange = (e: Event) => {
    const target = e.target;
    if (target instanceof HTMLTextAreaElement) {
      autoResizeTextarea(target);
    }
  };

  document.addEventListener("input", onInputOrChange, { capture: true, passive: true });
  document.addEventListener("change", onInputOrChange, { capture: true, passive: true });
  document.addEventListener("focusin", onInputOrChange, { capture: true, passive: true });
  window.addEventListener("resize", resizeAllVisible, { passive: true });

  // Custom app event trigger
  const onCustomTrigger = () => {
    requestAnimationFrame(resizeAllVisible);
  };
  window.addEventListener("cms-textarea-autoresize", onCustomTrigger);

  // 3. MutationObserver for dynamically rendered textareas (e.g., Modals, Tab switches, New forms)
  let rafId: number | null = null;
  const observer = new MutationObserver((mutations) => {
    let hasRelevantMutation = false;
    for (const m of mutations) {
      if (m.type === "childList" && m.addedNodes.length > 0) {
        hasRelevantMutation = true;
        break;
      }
      if (m.type === "attributes" && (m.attributeName === "class" || m.attributeName === "style")) {
        hasRelevantMutation = true;
        break;
      }
    }

    if (hasRelevantMutation) {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        resizeAllVisible();
      });
    }
  });

  if (document.body) {
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class", "style", "data-state", "open"],
    });
  }

  // 4. Intercept HTMLTextAreaElement.prototype.value setter to catch programmatic
  // updates (e.g., React controlled state changes, AI Agent autofills, Voice dictations)
  try {
    const valueDescriptor = Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      "value"
    );

    if (valueDescriptor && valueDescriptor.set) {
      const originalSet = valueDescriptor.set;
      Object.defineProperty(HTMLTextAreaElement.prototype, "value", {
        get() {
          return valueDescriptor.get?.call(this);
        },
        set(val) {
          originalSet.call(this, val);
          const el = this as HTMLTextAreaElement;
          requestAnimationFrame(() => {
            if (el.isConnected && (el.offsetParent !== null || el.scrollHeight > 0)) {
              autoResizeTextarea(el);
            }
          });
        },
        configurable: true,
      });
    }
  } catch (err) {
    console.warn("CMS AutoResize: Could not patch HTMLTextAreaElement.prototype.value", err);
  }

  // Initial pass
  setTimeout(resizeAllVisible, 100);

  return () => {
    document.removeEventListener("input", onInputOrChange, { capture: true });
    document.removeEventListener("change", onInputOrChange, { capture: true });
    document.removeEventListener("focusin", onInputOrChange, { capture: true });
    window.removeEventListener("resize", resizeAllVisible);
    window.removeEventListener("cms-textarea-autoresize", onCustomTrigger);
    if (rafId) cancelAnimationFrame(rafId);
    observer.disconnect();
    isGlobalInterceptorInitialized = false;
  };
}

import { suggestionStore } from "@/lib/suggestionStore";

/**
 * Universal Global Component mounted in layout to activate auto-resizing
 * across all major fields (description, brief facts, statements, notes, etc.)
 * and bootstrap dynamic suggestion dictionary harvested from uploaded files.
 */
export function GlobalAutoResizeTextareas() {
  useEffect(() => {
    const cleanup = initGlobalAutoResize();
    void suggestionStore.ensureLoaded();
    return cleanup;
  }, []);

  return null;
}
