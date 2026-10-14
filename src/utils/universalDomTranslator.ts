/**
 * Universal Client-side DOM Text Translator for Haryana Police CMS.
 * Translates visible UI text, buttons, links, navigation, placeholders, and tooltips
 * between English and authentic police Hindi instantly and bidirectionally without modifying form state.
 */

import { CMS_DICTIONARY, REVERSE_DICTIONARY } from "./cmsTranslationDictionary";

// Sort dictionary phrases by length descending to match longest multi-word phrases first
const SORTED_ENTRIES = Object.entries(CMS_DICTIONARY).sort(
  (a, b) => b[0].length - a[0].length
);

const SORTED_REVERSE_ENTRIES = Object.entries(REVERSE_DICTIONARY).sort(
  (a, b) => b[0].length - a[0].length
);

// Cache for original text node contents
const originalTextMap = new WeakMap<Node, string>();

let observer: MutationObserver | null = null;
let currentLanguage: "hi" | "en" = "en";
let isTranslating = false;

// Tags that should NEVER be translated (inputs, forms, scripts, raw code, canvases)
const EXCLUDED_TAGS = new Set([
  "SCRIPT",
  "STYLE",
  "INPUT",
  "TEXTAREA",
  "SELECT",
  "PRE",
  "CODE",
  "NOSCRIPT",
  "SVG",
  "PATH",
  "CANVAS",
  "IFRAME",
]);

/**
 * Check if a node or any of its parents has opted out of translation.
 * Strictly preserves auto-filled data, processed case text, user content, official CCTNS sheets, and print documents.
 */
function isExcluded(node: Node): boolean {
  let el: Element | null =
    node.nodeType === Node.ELEMENT_NODE ? (node as Element) : node.parentElement;
  while (el) {
    if (EXCLUDED_TAGS.has(el.tagName)) return true;
    if (
      el.getAttribute("data-no-translate") === "true" ||
      el.getAttribute("data-processed") === "true" ||
      el.getAttribute("data-autofill") === "true" ||
      el.getAttribute("data-user-content") === "true" ||
      el.getAttribute("contenteditable") === "true"
    ) {
      return true;
    }

    const id = el.id || "";
    if (
      id.includes("proforma") ||
      id.includes("official-sheet") ||
      id.includes("cctns") ||
      id.includes("print-canvas")
    ) {
      return true;
    }

    const cls = el.className;
    if (
      typeof cls === "string" &&
      (cls.includes("user-content") ||
        cls.includes("user-data") ||
        cls.includes("auto-filled") ||
        cls.includes("processed-data") ||
        cls.includes("case-data") ||
        cls.includes("verbatim") ||
        cls.includes("prose") ||
        cls.includes("page-sheet") ||
        cls.includes("print-sheet") ||
        cls.includes("no-translate"))
    ) {
      return true;
    }

    el = el.parentElement;
  }
  return false;
}

/**
 * Strip or extract language-specific parts from bilingual strings:
 * Pattern 1: Devanagari text followed by (English text) -> "तालिका स्वरूप (Table)" or "क्र.सं. (Sr. No.)"
 * Pattern 2: English text followed by (Devanagari text) -> "Complaints (शिकायतें)" or "Table (तालिका)"
 *
 * NOTE: Only operates on short UI strings (<= 120 chars). Long narratives or processed data are preserved as-is.
 */

/**
 * Strip or extract language-specific parts from standalone bilingual UI strings:
 * Only transforms strings where the ENTIRE string is a known standalone bilingual label.
 * Never touches addresses, multi-word case narratives, or user data.
 */

export function cleanBilingualForHindi(text: string): string {
  if (!text) return text;
  const trimmed = text.trim();

  // Pattern 1: Devanagari (Latin) -> keep Devanagari (e.g. "तालिका स्वरूप (Table)" -> "तालिका स्वरूप")
  const biMatch1 = trimmed.match(/^([\u0900-\u097F\s.,&/\-–—]+)\s*\(([a-zA-Z0-9\s.,&/\-–—]+)\)$/);
  if (biMatch1) {
    return text.replace(trimmed, biMatch1[1].trim());
  }

  // Pattern 2: Latin (Devanagari) -> keep Devanagari (e.g. "Complaints (शिकायतें)" -> "शिकायतें")
  const biMatch2 = trimmed.match(/^([a-zA-Z0-9\s.,&/\-–—]+)\s*\(([\u0900-\u097F\s.,&/\-–—]+)\)$/);
  if (biMatch2) {
    return text.replace(trimmed, biMatch2[2].trim());
  }

  // Pattern 3: Trailing English abbreviation in parentheses on short UI label (e.g. "रोजनामचा आम (GD)" -> "रोजनामचा आम")
  if (trimmed.length < 50) {
    const abbrevMatch = trimmed.match(/^([\u0900-\u097F\s.,&/\-–—]+)\s*\([a-zA-Z0-9\s.,&/\-–—]+\)$/);
    if (abbrevMatch) {
      return text.replace(trimmed, abbrevMatch[1].trim());
    }
  }

  return text;
}

export function cleanBilingualForEnglish(text: string): string {
  if (!text) return text;
  const trimmed = text.trim();

  // Check reverse dictionary first
  if (REVERSE_DICTIONARY[trimmed]) {
    return text.replace(trimmed, REVERSE_DICTIONARY[trimmed]);
  }

  // Pattern 1: Devanagari (Latin) -> keep Latin (e.g. "तालिका स्वरूप (Table)" -> "Table View" or "Table")
  const biMatch1 = trimmed.match(/^([\u0900-\u097F\s.,&/\-–—]+)\s*\(([a-zA-Z0-9\s.,&/\-–—]+)\)$/);
  if (biMatch1) {
    const latin = biMatch1[2].trim();
    return text.replace(trimmed, REVERSE_DICTIONARY[trimmed] || latin);
  }

  // Pattern 2: Latin (Devanagari) -> keep Latin (e.g. "Complaints (शिकायतें)" -> "Complaints")
  const biMatch2 = trimmed.match(/^([a-zA-Z0-9\s.,&/\-–—]+)\s*\(([\u0900-\u097F\s.,&/\-–—]+)\)$/);
  if (biMatch2) {
    return text.replace(trimmed, biMatch2[1].trim());
  }

  return text;
}

/**
 * Translate a single string from English to Hindi using dictionary & exact phrase matching.
 * User-entered case data, addresses, names, statements, and numbers are 100% preserved.
 */
export function translateStringToHindi(text: string): string {
  if (!text || text.trim().length === 0) return text;
  const trimmed = text.trim();

  // 1. Direct exact match in CMS_DICTIONARY
  if (CMS_DICTIONARY[trimmed]) {
    return text.replace(trimmed, CMS_DICTIONARY[trimmed]);
  }

  // 2. Colon suffix match (e.g. "Full Name:", "Address:", "Date:", "Subject:")
  if (trimmed.endsWith(":")) {
    const base = trimmed.slice(0, -1).trim();
    if (CMS_DICTIONARY[base]) {
      return text.replace(trimmed, CMS_DICTIONARY[base] + ":");
    }
  }

  // 3. Numbered prefix match (e.g. "1. Complainant Particulars", "2. Incident Facts & Statement")
  const numMatch = trimmed.match(/^(\d+\.\s*)(.+)$/);
  if (numMatch) {
    const prefix = numMatch[1];
    const base = numMatch[2].trim();
    if (CMS_DICTIONARY[base]) {
      return text.replace(trimmed, prefix + CMS_DICTIONARY[base]);
    }
  }

  // 4. Standalone bilingual UI patterns
  const cleaned = cleanBilingualForHindi(text);
  if (cleaned !== text) return cleaned;

  // Otherwise: NEVER touch or alter (preserves user data, addresses, names, statements)
  return text;
}

/**
 * Translate a single string from Hindi back to English using dictionary & exact phrase matching.
 * User-entered case data, addresses, names, statements, and numbers are 100% preserved.
 */
export function translateStringToEnglish(text: string): string {
  if (!text || text.trim().length === 0) return text;
  const trimmed = text.trim();

  // 1. Direct exact match in REVERSE_DICTIONARY
  if (REVERSE_DICTIONARY[trimmed]) {
    return text.replace(trimmed, REVERSE_DICTIONARY[trimmed]);
  }

  // 2. Colon suffix match (e.g. "पूरा नाम:", "पता:", "दिनांक:", "विषय:")
  if (trimmed.endsWith(":")) {
    const base = trimmed.slice(0, -1).trim();
    if (REVERSE_DICTIONARY[base]) {
      return text.replace(trimmed, REVERSE_DICTIONARY[base] + ":");
    }
  }

  // 3. Numbered prefix match (e.g. "1. परिवादी / शिकायतकर्ता विवरण")
  const numMatch = trimmed.match(/^(\d+\.\s*)(.+)$/);
  if (numMatch) {
    const prefix = numMatch[1];
    const base = numMatch[2].trim();
    if (REVERSE_DICTIONARY[base]) {
      return text.replace(trimmed, prefix + REVERSE_DICTIONARY[base]);
    }
  }

  // 4. Standalone bilingual UI patterns
  const cleaned = cleanBilingualForEnglish(text);
  if (cleaned !== text) return cleaned;

  // Otherwise: NEVER touch or alter (preserves user data, addresses, names, statements)
  return text;
}

/**
 * Translate an individual text node.
 * Automatically skips nodes belonging to processed data, auto-fill forms, and long case narratives.
 */
function translateNode(node: Text, toLang: "hi" | "en") {
  if (isExcluded(node)) return;

  const currentVal = node.nodeValue || "";
  if (!currentVal.trim()) return;

  // Processed data, multi-line statements, and paragraphs must be seen exactly as they are
  if (currentVal.length > 120 || currentVal.includes("\n")) return;

  // Always cache the raw initial text node value
  if (!originalTextMap.has(node)) {
    originalTextMap.set(node, currentVal);
  }
  const orig = originalTextMap.get(node) || currentVal;

  if (toLang === "hi") {
    const translated = translateStringToHindi(orig);
    if (translated !== currentVal) {
      node.nodeValue = translated;
    }
  } else {
    // English mode: clean any Hindi or bilingual text
    const translated = translateStringToEnglish(orig);
    if (translated !== currentVal) {
      node.nodeValue = translated;
    }
  }
}

/**
 * Translate attribute values (placeholder, title, aria-label, alt)
 */
function translateAttributes(el: Element, toLang: "hi" | "en") {
  if (isExcluded(el)) return;

  const attrs = ["placeholder", "title", "aria-label", "alt"];
  for (const attr of attrs) {
    const val = el.getAttribute(attr);
    if (!val || !val.trim()) continue;

    const origKey = `data-orig-${attr}`;
    if (!el.hasAttribute(origKey)) {
      el.setAttribute(origKey, val);
    }
    const orig = el.getAttribute(origKey) || val;

    if (toLang === "hi") {
      const translated = translateStringToHindi(orig);
      if (translated !== val) {
        el.setAttribute(attr, translated);
      }
    } else {
      const translated = translateStringToEnglish(orig);
      if (translated !== val) {
        el.setAttribute(attr, translated);
      }
    }
  }
}

/**
 * Perform a full walk of the DOM tree to translate or revert
 */
export function walkAndTranslate(root: Node, toLang: "hi" | "en") {
  if (typeof window === "undefined" || !root) return;
  isTranslating = true;

  try {
    // 1. Walk only text nodes using TreeWalker SHOW_TEXT (never skips container subtrees)
    const walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode(node) {
          if (isExcluded(node)) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        },
      }
    );

    let currentNode = walker.nextNode();
    while (currentNode) {
      translateNode(currentNode as Text, toLang);
      currentNode = walker.nextNode();
    }

    // 2. Translate attributes on all elements with relevant attributes
    if (root.nodeType === Node.ELEMENT_NODE || root.nodeType === Node.DOCUMENT_NODE) {
      const el = root as Element;
      if (el.querySelectorAll) {
        const attrElements = el.querySelectorAll("[placeholder], [title], [aria-label], [alt]");
        attrElements.forEach((targetEl) => {
          translateAttributes(targetEl, toLang);
        });
      }
      if (root.nodeType === Node.ELEMENT_NODE) {
        translateAttributes(el, toLang);
      }
    }
  } catch (err) {
    console.warn("DOM translation notice:", err);
  } finally {
    isTranslating = false;
  }
}

/**
 * Initialize / update universal translator
 */
export function setUniversalLanguage(lang: "hi" | "en") {
  if (typeof window === "undefined") return;
  currentLanguage = lang;

  // Apply immediately across entire document
  if (document.body) {
    walkAndTranslate(document.body, lang);
  }

  // Set up or restart MutationObserver
  if (!observer && typeof MutationObserver !== "undefined") {
    observer = new MutationObserver((mutations) => {
      if (isTranslating) return;

      isTranslating = true;
      try {
        for (const m of mutations) {
          if (m.type === "childList") {
            m.addedNodes.forEach((node) => {
              if (node.nodeType === Node.TEXT_NODE) {
                translateNode(node as Text, currentLanguage);
              } else if (node.nodeType === Node.ELEMENT_NODE) {
                walkAndTranslate(node, currentLanguage);
              }
            });
          } else if (m.type === "characterData") {
            if (m.target.nodeType === Node.TEXT_NODE) {
              translateNode(m.target as Text, currentLanguage);
            }
          }
        }
      } finally {
        isTranslating = false;
      }
    });

    if (document.body) {
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true,
      });
    }
  }
}
