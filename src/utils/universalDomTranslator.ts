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

// Tags that should NEVER be translated
const EXCLUDED_TAGS = new Set([
  "SCRIPT",
  "STYLE",
  "INPUT",
  "TEXTAREA",
  "PRE",
  "CODE",
  "NOSCRIPT",
  "SVG",
  "PATH",
]);

/**
 * Check if a node or any of its parents has opted out of translation
 */
function isExcluded(node: Node): boolean {
  let el: Element | null =
    node.nodeType === Node.ELEMENT_NODE ? (node as Element) : node.parentElement;
  while (el) {
    if (EXCLUDED_TAGS.has(el.tagName)) return true;
    if (el.getAttribute("data-no-translate") === "true") return true;
    if (el.getAttribute("contenteditable") === "true") return true;
    el = el.parentElement;
  }
  return false;
}

/**
 * Translate a single string from English to Hindi using dictionary
 */
export function translateStringToHindi(text: string): string {
  if (!text || text.trim().length === 0) return text;

  const trimmed = text.trim();
  if (CMS_DICTIONARY[trimmed]) {
    return text.replace(trimmed, CMS_DICTIONARY[trimmed]);
  }

  let result = text;
  for (const [en, hi] of SORTED_ENTRIES) {
    if (result.includes(en)) {
      result = result.split(en).join(hi);
    }
  }
  return result;
}

/**
 * Translate a single string from Hindi back to English
 */
export function translateStringToEnglish(text: string): string {
  if (!text || text.trim().length === 0) return text;

  const trimmed = text.trim();
  if (REVERSE_DICTIONARY[trimmed]) {
    return text.replace(trimmed, REVERSE_DICTIONARY[trimmed]);
  }

  let result = text;
  for (const [hi, en] of SORTED_REVERSE_ENTRIES) {
    if (result.includes(hi)) {
      result = result.split(hi).join(en);
    }
  }
  return result;
}

/**
 * Translate an individual text node
 */
function translateNode(node: Text, toLang: "hi" | "en") {
  if (isExcluded(node)) return;

  const currentVal = node.nodeValue || "";
  if (!currentVal.trim()) return;

  if (toLang === "hi") {
    if (!originalTextMap.has(node)) {
      originalTextMap.set(node, currentVal);
    }
    const orig = originalTextMap.get(node) || currentVal;
    const translated = translateStringToHindi(orig);
    if (translated !== currentVal) {
      node.nodeValue = translated;
    }
  } else {
    // Revert to English
    if (originalTextMap.has(node)) {
      const orig = originalTextMap.get(node);
      if (orig !== undefined && orig !== currentVal) {
        node.nodeValue = orig;
      }
    } else {
      const englishVal = translateStringToEnglish(currentVal);
      if (englishVal !== currentVal) {
        node.nodeValue = englishVal;
        originalTextMap.set(node, englishVal);
      }
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
    if (toLang === "hi") {
      if (!el.hasAttribute(origKey)) {
        el.setAttribute(origKey, val);
      }
      const orig = el.getAttribute(origKey) || val;
      const translated = translateStringToHindi(orig);
      if (translated !== val) {
        el.setAttribute(attr, translated);
      }
    } else {
      if (el.hasAttribute(origKey)) {
        const orig = el.getAttribute(origKey);
        if (orig !== null && orig !== val) {
          el.setAttribute(attr, orig);
        }
      } else {
        const englishVal = translateStringToEnglish(val);
        if (englishVal !== val) {
          el.setAttribute(attr, englishVal);
        }
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
