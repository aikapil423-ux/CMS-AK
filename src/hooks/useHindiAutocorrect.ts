"use client";

import { useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import { useAuth } from "@/context/AuthContext";

const preferenceEvent = "cms:hindi-autocorrect";
const sessionPreferences = new Map<string, boolean>();

function subscribe(callback: () => void) {
  window.addEventListener(preferenceEvent, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(preferenceEvent, callback);
    window.removeEventListener("storage", callback);
  };
}

export function useHindiAutocorrectPreference() {
  const { sessionUser } = useAuth();
  const key = sessionUser ? `cms:hindi-autocorrect:${sessionUser.id}` : null;
  const enabled = useSyncExternalStore(subscribe, () => {
    if (!key) return false;
    try {
      return localStorage.getItem(key) === "on";
    } catch {
      return sessionPreferences.get(key) ?? false;
    }
  }, () => false);

  return {
    enabled,
    toggle() {
      if (!key) return;
      try {
        localStorage.setItem(key, enabled ? "off" : "on");
      } catch {
        sessionPreferences.set(key, !enabled);
      }
      window.dispatchEvent(new Event(preferenceEvent));
    },
  };
}

const corrections = new Map([
  ["कृप्या", "कृपया"],
  ["क्योकि", "क्योंकि"],
  ["क्योँकि", "क्योंकि"],
  ["किजिए", "कीजिए"],
  ["दिजिए", "दीजिए"],
  ["लिजिए", "लीजिए"],
]);

const reviewedSuggestions = new Map([
  ["करिये", "करिए"],
  ["जाइये", "जाइए"],
]);

const protectedText = 'blockquote, q, [contenteditable="false"], [data-verbatim]';

const wordCharacters = /^[\u0900-\u0963\u0971-\u097F\u200C\u200D]+$/u;
const boundary = /^[ \u00A0।॥,.!?;:]$/u;

export function useHindiReportAutocorrect(protectedDocument: boolean) {
  const { enabled } = useHindiAutocorrectPreference();
  const typed = useRef<{ node: Text; start: number; end: number } | null>(null);

  const [pending, setPending] = useState<{
    editor: HTMLDivElement;
    node: Text;
    snapshot: string;
    start: number;
    end: number;
    replacement: string;
    delimiter: string;
  } | null>(null);

  const onInput = (event: FormEvent<HTMLDivElement>) => {
    setPending(null);
    const input = event.nativeEvent as InputEvent;
    const previous = typed.current;
    typed.current = null;

    if (!enabled || protectedDocument || !input.isTrusted || !input.data) return;
    if (input.inputType !== "insertText" && input.inputType !== "insertCompositionText") return;

    const editor = event.currentTarget;
    const selection = editor.ownerDocument.getSelection();
    const node = selection?.anchorNode;
    if (!selection?.isCollapsed || !(node instanceof Text) || !editor.contains(node)) return;
    if (node.parentElement?.closest(protectedText)) return;

    const end = selection.anchorOffset;
    const insertedAt = end - input.data.length;
    if (insertedAt < 0) return;
    const insertedText = node.data.slice(insertedAt, end);
    if (insertedText !== input.data && !(insertedText === "\u00A0" && input.data === " ")) return;
    const continuesWord = previous?.node === node && previous.end === insertedAt;

    if (wordCharacters.test(input.data)) {
      typed.current = { node, start: continuesWord ? previous.start : insertedAt, end };
      return;
    }

    if (input.isComposing || input.inputType !== "insertText" || !continuesWord || !boundary.test(input.data)) return;
    const word = node.data.slice(previous.start, insertedAt);
    const replacement = corrections.get(word);
    const suggestion = reviewedSuggestions.get(word);
    if ((!replacement && !suggestion) || /^[\p{L}\p{M}\p{N}]/u.test(node.data.slice(end))) return;

    const block = node.parentElement?.closest("p, div, li, td, th, h1, h2, h3, h4, h5, h6") ?? editor;
    if (/["'“”‘’«»「」]/u.test(block.textContent ?? "")) return;
    const prefix = editor.ownerDocument.createRange();
    prefix.selectNodeContents(block);
    prefix.setEnd(node, previous.start);
    if (/[\p{L}\p{M}\p{N}\u200C\u200D]$/u.test(prefix.toString())) return;

    if (!replacement && suggestion) {
      setPending({ editor, node, snapshot: node.data, start: previous.start, end, replacement: suggestion, delimiter: insertedText });
      return;
    }
    if (!replacement) return;

    // The browser's editing command preserves native Undo and the surrounding markup.
    selection.setBaseAndExtent(node, previous.start, node, end);
    if (!editor.ownerDocument.execCommand("insertText", false, replacement + insertedText)) {
      selection.collapse(node, end);
    }
  };

  return {
    onInput,
    suggestion: enabled && !protectedDocument ? pending?.replacement : undefined,
    dismissSuggestion: () => setPending(null),
    acceptSuggestion() {
      setPending(null);
      if (!enabled || protectedDocument || !pending) return;
      const { editor, node, snapshot, start, end, replacement, delimiter } = pending;
      if (!editor.isConnected || !editor.contains(node) || node.data !== snapshot ||
          node.parentElement?.closest(protectedText)) return;

      const selection = editor.ownerDocument.getSelection();
      if (!selection) return;
      editor.focus();
      selection.setBaseAndExtent(node, start, node, end);
      if (!editor.ownerDocument.execCommand("insertText", false, replacement + delimiter)) {
        selection.collapse(node, end);
      }
    },
  };
}
