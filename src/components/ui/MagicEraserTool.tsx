"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Eraser,
  RotateCcw,
  Undo2,
  Check,
  AlertTriangle,
  Trash2,
  X,
  ListChecks,
  Edit3,
  Save,
} from "lucide-react";
import { usePathname } from "next/navigation";

interface QueueEntry {
  id: string;
  element: HTMLElement;
  originalDisplay: string;
  originalVisibility: string;
  originalText: string;
  textSnippet: string;
  tagName: string;
  ariaLabel: string;
  classes: string;
  parentContext: string;
  url: string;
  isSaved?: boolean;
}

interface PermanentRule {
  id: string;
  url: string;
  textSnippet: string;
  tagName: string;
  classes: string;
}

interface PermanentEdit {
  id: string;
  url: string;
  originalText: string;
  newText: string;
  tagName: string;
  classes: string;
}

export function MagicEraserTool() {
  const pathname = usePathname();
  const [isActive, setIsActive] = useState(false);
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [savingIndex, setSavingIndex] = useState<number | null>(null);
  const [permanentRules, setPermanentRules] = useState<PermanentRule[]>([]);
  const [permanentEdits, setPermanentEdits] = useState<PermanentEdit[]>([]);
  const hoveredElementRef = useRef<HTMLElement | null>(null);

  // 1. Fetch permanent rules and permanent text edits from backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [rulesRes, editsRes] = await Promise.all([
          fetch("/api/dev/permanent-eraser"),
          fetch("/api/dev/text-edits"),
        ]);
        if (rulesRes.ok) {
          const rulesData = await rulesRes.json();
          if (Array.isArray(rulesData.rules)) setPermanentRules(rulesData.rules);
        }
        if (editsRes.ok) {
          const editsData = await editsRes.json();
          if (Array.isArray(editsData.edits)) setPermanentEdits(editsData.edits);
        }
      } catch (err) {
        console.warn("Could not load permanent rules/edits:", err);
      }
    };
    fetchData();
  }, [pathname]);

  // 2. Automatically apply permanent text edits on DOM
  useEffect(() => {
    if (permanentEdits.length === 0) return;

    const applyEdits = () => {
      permanentEdits.forEach((edit) => {
        if (!edit.originalText || !edit.newText) return;
        const elements = document.querySelectorAll(edit.tagName || "*");
        elements.forEach((el) => {
          const htmlEl = el as HTMLElement;
          if (htmlEl.hasAttribute("data-magic-eraser-ui")) return;
          if (htmlEl.closest("[data-magic-eraser-ui='true']")) return;

          const text = htmlEl.innerText?.trim() || htmlEl.textContent?.trim() || "";
          if (text === edit.originalText) {
            htmlEl.innerText = edit.newText;
            htmlEl.setAttribute("data-magic-text-edited", "true");
          }
        });
      });
    };

    applyEdits();
    const observer = new MutationObserver(() => applyEdits());
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [permanentEdits, pathname]);

  // 3. Automatically apply permanent deletion rules on DOM
  useEffect(() => {
    if (permanentRules.length === 0) return;

    const applyRules = () => {
      permanentRules.forEach((rule) => {
        if (!rule.textSnippet || rule.textSnippet.length < 3) return;

        // Skip placeholder pseudo-snippets like "<svg> element", "<div> element"
        if (rule.textSnippet.startsWith("<") && rule.textSnippet.endsWith("> element")) return;

        // Route matching: if rule has URL, ensure it applies to matching pathname
        if (rule.url && pathname) {
          const cleanRuleUrl = rule.url.split("?")[0].replace(/\/$/, "");
          const cleanPathname = pathname.split("?")[0].replace(/\/$/, "");
          if (cleanRuleUrl && cleanPathname && cleanRuleUrl !== cleanPathname) {
            return;
          }
        }

        const elements = document.querySelectorAll(rule.tagName || "*");
        elements.forEach((el) => {
          const htmlEl = el as HTMLElement;
          if (htmlEl.hasAttribute("data-magic-eraser-ui")) return;
          if (htmlEl.closest("[data-magic-eraser-ui='true']")) return;

          // Never hide root containers, body, main, modal overlays or full screen wrappers
          if (["BODY", "HTML", "MAIN"].includes(htmlEl.tagName)) return;
          if (htmlEl.id === "root" || htmlEl.id === "__next") return;
          if (htmlEl.classList.contains("fixed") && htmlEl.classList.contains("inset-0")) return;
          if (
            htmlEl.classList.contains("max-w-6xl") ||
            htmlEl.classList.contains("max-w-5xl") ||
            htmlEl.classList.contains("max-w-4xl") ||
            htmlEl.classList.contains("min-h-screen")
          ) return;

          const text = (htmlEl.innerText || htmlEl.textContent || "").trim();
          const normText = text.replace(/\s+/g, " ");
          const normSnippet = (rule.textSnippet || "").trim().replace(/\s+/g, " ");

          // STRICT CHECK: An erased element MUST match its snippet closely in length!
          // Parent containers will have much longer length and must NEVER be matched!
          const lengthDiff = Math.abs(normText.length - normSnippet.length);
          const isDirectMatch = normText === normSnippet;
          const isCloseMatch = lengthDiff <= 10 && normText.includes(normSnippet);

          if (!isDirectMatch && !isCloseMatch) {
            return;
          }

          // If it has children, check if a child is the actual target
          if (htmlEl.children.length > 0) {
            const hasChildMatch = Array.from(htmlEl.children).some((child) => {
              const childText = (child.textContent || "").trim().replace(/\s+/g, " ");
              return childText === normSnippet || (Math.abs(childText.length - normSnippet.length) <= 5 && childText.includes(normSnippet));
            });
            if (hasChildMatch) {
              return; // let the child be erased, not this container!
            }
          }

          htmlEl.style.display = "none";
          htmlEl.setAttribute("data-magic-permanently-erased", "true");
        });
      });
    };

    applyRules();
    const observer = new MutationObserver(() => applyRules());
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [permanentRules, pathname]);

  // Toggle active state
  const toggleEraser = () => {
    setIsActive((prev) => !prev);
    setShowConfirmModal(false);
  };

  // Clear outline helper
  const clearOutline = (el: HTMLElement | null) => {
    if (el) {
      el.style.removeProperty("outline");
      el.style.removeProperty("outline-offset");
      el.style.removeProperty("cursor");
      el.removeAttribute("data-magic-eraser-hovered");
    }
  };

  // Undo last erased item from queue
  const handleUndo = () => {
    if (queue.length === 0) return;
    const last = queue[queue.length - 1];
    if (last && last.element) {
      last.element.style.display = last.originalDisplay || "";
      last.element.style.visibility = last.originalVisibility || "";
      last.element.removeAttribute("data-magic-erased");
    }
    setQueue((prev) => prev.slice(0, -1));
  };

  // Update text snippet in queue
  const handleUpdateQueueItemText = (index: number, newText: string) => {
    setQueue((prev) =>
      prev.map((item, i) => (i === index ? { ...item, textSnippet: newText } : item))
    );
  };

  // SAVE SINGLE EDITED ITEM: Don't delete, restore element with updated text!
  const handleSaveSingleItem = async (index: number) => {
    const item = queue[index];
    if (!item || !item.element) return;

    try {
      setSavingIndex(index);

      // 1. Restore element in DOM with new text (NOT DELETED!)
      item.element.style.display = item.originalDisplay || "";
      item.element.style.visibility = item.originalVisibility || "";
      item.element.removeAttribute("data-magic-erased");
      item.element.innerText = item.textSnippet;
      item.element.setAttribute("data-magic-text-edited", "true");

      // 2. Persist to backend text edits API & physical source code
      await fetch("/api/dev/text-edits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalText: item.originalText,
          newText: item.textSnippet,
          tagName: item.tagName,
          classes: item.classes,
          url: item.url,
        }),
      });

      // Update local state: remove from delete queue since it was saved
      setQueue((prev) => prev.filter((_, i) => i !== index));

      // Refresh permanent edits state
      const editsRes = await fetch("/api/dev/text-edits").then((r) => r.json());
      if (Array.isArray(editsRes.edits)) {
        setPermanentEdits(editsRes.edits);
      }

      if (queue.length <= 1) {
        setShowConfirmModal(false);
      }
    } catch (err) {
      console.warn("Could not save edited item:", err);
    } finally {
      setSavingIndex(null);
    }
  };

  // Remove a specific single item from the queue modal
  const handleRemoveFromQueue = (index: number) => {
    const item = queue[index];
    if (item && item.element) {
      item.element.style.display = item.originalDisplay || "";
      item.element.style.visibility = item.originalVisibility || "";
      item.element.removeAttribute("data-magic-erased");
    }
    setQueue((prev) => prev.filter((_, i) => i !== index));
    if (queue.length <= 1) {
      setShowConfirmModal(false);
    }
  };

  // Restore all elements in queue
  const handleRestoreAll = () => {
    queue.forEach(({ element, originalDisplay, originalVisibility }) => {
      if (element) {
        element.style.display = originalDisplay || "";
        element.style.visibility = originalVisibility || "";
        element.removeAttribute("data-magic-erased");
      }
    });
    setQueue([]);
    setShowConfirmModal(false);
  };

  // Confirm permanent deletion of remaining unsaved queue items
  const handleConfirmPermanentDelete = async () => {
    if (queue.length === 0) return;
    try {
      setIsSyncing(true);

      const payload = queue.map((item) => ({
        textSnippet: item.textSnippet,
        tagName: item.tagName,
        classes: item.classes,
        url: item.url,
      }));

      const res = await fetch("/api/dev/permanent-eraser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      for (const item of queue) {
        await fetch("/api/dev/eraser-log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            textSnippet: item.textSnippet,
            tagName: item.tagName,
            ariaLabel: item.ariaLabel,
            classes: item.classes,
            parentContext: item.parentContext,
            url: item.url,
          }),
        });
      }

      if (res.ok) {
        const updatedRules = await fetch("/api/dev/permanent-eraser").then((r) => r.json());
        if (updatedRules.rules) {
          setPermanentRules(updatedRules.rules);
        }
      }

      setShowConfirmModal(false);
      setIsActive(false);
      setQueue([]);
    } catch (err) {
      console.warn("Failed to sync permanent eraser queue:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    if (!isActive) {
      if (hoveredElementRef.current) {
        clearOutline(hoveredElementRef.current);
        hoveredElementRef.current = null;
      }
      return;
    }

    const handleMouseOver = (e: MouseEvent) => {
      if (showConfirmModal) return;

      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (target.closest("[data-magic-eraser-ui='true']")) return;

      if (hoveredElementRef.current && hoveredElementRef.current !== target) {
        clearOutline(hoveredElementRef.current);
      }

      hoveredElementRef.current = target;
      target.style.outline = "2px dashed #f43f5e";
      target.style.outlineOffset = "2px";
      target.style.cursor = "crosshair";
      target.setAttribute("data-magic-eraser-hovered", "true");
    };

    const handleMouseOut = (e: MouseEvent) => {
      if (showConfirmModal) return;

      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (target.closest("[data-magic-eraser-ui='true']")) return;

      clearOutline(target);
      if (hoveredElementRef.current === target) {
        hoveredElementRef.current = null;
      }
    };

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      if (target.closest("[data-magic-eraser-ui='true']")) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      clearOutline(target);

      const originalDisplay = target.style.display;
      const originalVisibility = target.style.visibility;
      const rawText = target.innerText?.trim() || target.textContent?.trim() || "";
      const textSnippet = rawText.slice(0, 200);
      const tagName = target.tagName.toLowerCase();
      const ariaLabel = target.getAttribute("aria-label") || "";
      const classes = typeof target.className === "string" ? target.className.slice(0, 120) : "";
      const parentContext = target.parentElement?.innerText?.trim().slice(0, 100) || "";

      target.style.display = "none";
      target.setAttribute("data-magic-erased", "true");

      const newEntry: QueueEntry = {
        id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        element: target,
        originalDisplay,
        originalVisibility,
        originalText: rawText,
        textSnippet: textSnippet || `<${tagName}> element`,
        tagName,
        ariaLabel,
        classes,
        parentContext,
        url: window.location.pathname,
      };

      setQueue((prev) => [...prev, newEntry]);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showConfirmModal) {
          setShowConfirmModal(false);
        } else {
          setIsActive(false);
        }
      } else if ((e.ctrlKey || e.metaKey) && (e.key === "z" || e.key === "Z")) {
        if (!showConfirmModal) {
          e.preventDefault();
          handleUndo();
        }
      }
    };

    window.addEventListener("mouseover", handleMouseOver, true);
    window.addEventListener("mouseout", handleMouseOut, true);
    window.addEventListener("click", handleClick, true);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("mouseover", handleMouseOver, true);
      window.removeEventListener("mouseout", handleMouseOut, true);
      window.removeEventListener("click", handleClick, true);
      window.removeEventListener("keydown", handleKeyDown);
      if (hoveredElementRef.current) {
        clearOutline(hoveredElementRef.current);
        hoveredElementRef.current = null;
      }
    };
  }, [isActive, showConfirmModal, queue]);

  return (
    <>
      {/* Confirmation Dialogue Box (YES / NO with Editable Queue & Save Option) */}
      {showConfirmModal && (
        <div
          data-magic-eraser-ui="true"
          className="fixed inset-0 z-[100000] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900">
                  Delete or Edit {queue.length} Item{queue.length > 1 ? "s" : ""}?
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Agar text change karke <b>Save</b> karenge toh pura delete nahi hoga, balki naya text wahi save ho jayega. Warna niche se <b>Delete Permanently</b> karein.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Editable Queue Items List */}
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Queue ({queue.length} selected):
                </span>
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Edit3 className="w-3 h-3 text-slate-400" /> Edit & click Save to replace text
                </span>
              </div>

              {queue.map((item, idx) => {
                const isChanged = item.textSnippet !== item.originalText;
                const isItemSaving = savingIndex === idx;

                return (
                  <div
                    key={item.id}
                    className="bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl p-3 space-y-2 text-xs transition"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[9px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-semibold">
                          #{idx + 1} &lt;{item.tagName}&gt;
                        </span>
                        {item.classes && (
                          <span
                            className="font-mono text-[9px] text-slate-400 truncate max-w-[180px]"
                            title={item.classes}
                          >
                            .{item.classes.split(" ")[0]}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFromQueue(idx)}
                        title="Remove from queue"
                        className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition shrink-0"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Editable Input Box for Field Text */}
                    <input
                      type="text"
                      value={item.textSnippet}
                      onChange={(e) => handleUpdateQueueItemText(idx, e.target.value)}
                      placeholder="Enter new text..."
                      className="w-full bg-white text-slate-800 text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-rose-500 focus:border-rose-500 font-medium"
                    />

                    {/* Action below each item: Save Edit Button */}
                    <div className="flex items-center justify-between pt-0.5">
                      <span className="text-[10px] text-slate-400 italic">
                        {isChanged ? "Modified (Click Save to update)" : "Unmodified"}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleSaveSingleItem(idx)}
                        disabled={isItemSaving}
                        title="Save this edited text into the element instead of deleting"
                        className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg shadow-2xs transition disabled:opacity-50"
                      >
                        <Save className="w-3 h-3 text-emerald-600" />
                        <span>{isItemSaving ? "Saving..." : "Save (Keep with New Text)"}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Action Buttons: YES / NO */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={handleRestoreAll}
                className="text-xs font-medium text-slate-500 hover:text-rose-600 transition"
              >
                Restore all & Exit
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
                >
                  NO (Keep Editing)
                </button>
                <button
                  type="button"
                  onClick={handleConfirmPermanentDelete}
                  disabled={isSyncing || queue.length === 0}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-200 flex items-center gap-1.5 transition disabled:opacity-60"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>YES (Delete Permanently)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Magic Eraser Toolbar */}
      <div
        data-magic-eraser-ui="true"
        className="fixed bottom-6 left-6 z-[9999] flex items-center gap-2 select-none"
      >
        {!isActive ? (
          <button
            type="button"
            onClick={toggleEraser}
            title="Magic Eraser (Remove or edit text, buttons, fields)"
            className="flex items-center gap-2 bg-white/95 hover:bg-rose-50 text-slate-700 hover:text-rose-600 border border-slate-300 shadow-lg hover:shadow-xl rounded-full px-3.5 py-2.5 transition-all text-xs font-semibold backdrop-blur-md group"
          >
            <div className="w-6 h-6 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition-colors">
              <Eraser className="w-3.5 h-3.5" />
            </div>
            <span>Magic Eraser</span>
            {queue.length > 0 && (
              <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {queue.length}
              </span>
            )}
          </button>
        ) : (
          <div className="flex items-center gap-2 bg-slate-900/95 text-white border border-rose-500/40 shadow-2xl rounded-2xl p-2 px-3 backdrop-blur-lg animate-in fade-in slide-in-from-bottom-2 duration-200">
            {/* Active Status Badge */}
            <div className="flex items-center gap-2 pr-2 border-r border-slate-700">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
              </span>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-rose-400 flex items-center gap-1">
                  <Eraser className="w-3 h-3" /> Eraser Active
                </span>
                <span className="text-[10px] text-slate-400">Click elements to add to queue</span>
              </div>
            </div>

            {/* Eraser Queue stats & actions */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold bg-slate-800 text-slate-300 px-2.5 py-1 rounded-md border border-slate-700 flex items-center gap-1">
                <ListChecks className="w-3 h-3 text-rose-400" />
                <span>{queue.length} in Queue</span>
              </span>

              {/* Undo Last */}
              <button
                type="button"
                onClick={handleUndo}
                disabled={queue.length === 0}
                title="Undo last erased element (Ctrl+Z)"
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-slate-200 rounded-lg border border-slate-700 transition"
              >
                <Undo2 className="w-3.5 h-3.5" />
                <span>Undo</span>
              </button>

              {/* Restore All */}
              {queue.length > 0 && (
                <button
                  type="button"
                  onClick={handleRestoreAll}
                  title="Restore all elements"
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 rounded-lg border border-rose-800/60 transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restore All</span>
                </button>
              )}

              {/* Review Queue & Delete Dialogue Trigger */}
              <button
                type="button"
                onClick={() => {
                  if (queue.length > 0) {
                    setShowConfirmModal(true);
                  } else {
                    setIsActive(false);
                  }
                }}
                title={
                  queue.length > 0
                    ? "Review queue & confirm permanent deletion or save edits"
                    : "Done / Exit (Esc)"
                }
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition ml-1 shadow-sm ${
                  queue.length > 0
                    ? "bg-rose-600 hover:bg-rose-500 text-white animate-pulse"
                    : "bg-emerald-600 hover:bg-emerald-500 text-white"
                }`}
              >
                {queue.length > 0 ? (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete / Edit ({queue.length})</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Done</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Global Indicator Banner when active */}
      {isActive && (
        <div
          data-magic-eraser-ui="true"
          className="fixed top-2 left-1/2 -translate-x-1/2 z-[9999] bg-rose-600 text-white px-4 py-1.5 rounded-full shadow-lg text-xs font-medium flex items-center gap-2 pointer-events-none select-none border border-rose-400"
        >
          <Eraser className="w-3.5 h-3.5 animate-pulse" />
          <span>
            Magic Eraser: Click any elements to queue ({queue.length} selected). Click{" "}
            <b>Delete / Edit ({queue.length})</b> when ready.
          </span>
        </div>
      )}
    </>
  );
}
