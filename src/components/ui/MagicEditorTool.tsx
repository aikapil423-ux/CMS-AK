"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Move,
  Undo2,
  Save,
  RotateCcw,
  Check,
  Layers,
  X,
  Sliders,
  Maximize2,
  Minimize2,
  Type,
  Plus,
  Minus,
} from "lucide-react";
import { usePathname } from "next/navigation";

interface PositionRule {
  type: "FREE_POSITION" | "SIZE_CONTROL";
  url: string;
  elementText: string;
  tagName: string;
  classes: string;
  left?: string;
  top?: string;
  position?: string;
  zIndex?: string;
  width?: string;
  height?: string;
  fontSize?: string;
}

export function MagicEditorTool() {
  const pathname = usePathname();
  const [isActive, setIsActive] = useState(false);
  const [isMergeMode, setIsMergeMode] = useState(false);
  const [selectedButtons, setSelectedButtons] = useState<HTMLElement[]>([]);
  const [pendingRules, setPendingRules] = useState<PositionRule[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showMergeDialog, setShowMergeDialog] = useState(false);
  const [mergeTitle, setMergeTitle] = useState("Actions");

  // Selected element for direct Resizing & Font Control
  const [selectedElement, setSelectedElement] = useState<HTMLElement | null>(null);
  const [elementWidth, setElementWidth] = useState<number>(0);
  const [elementHeight, setElementHeight] = useState<number>(0);
  const [elementFontSize, setElementFontSize] = useState<number>(14);

  const hoveredElementRef = useRef<HTMLElement | null>(null);

  // Mouse Dragging State for Freeform Moving
  const isDraggingRef = useRef(false);
  const activeDragElementRef = useRef<HTMLElement | null>(null);
  const dragStartPosRef = useRef({ x: 0, y: 0 });
  const elementStartPosRef = useRef({ left: 0, top: 0 });

  // 1. Load and apply saved layout rules on mount & route change
  useEffect(() => {
    const applySavedLayout = async () => {
      try {
        const res = await fetch("/api/dev/magic-editor");
        if (!res.ok) return;
        const data = await res.json();
        const rules = data.rules || [];

        rules.forEach((rule: PositionRule) => {
          if (!rule.elementText) return;

          const elements = Array.from(
            document.querySelectorAll("button, a, th, td, tr, li, h1, h2, h3, h4, p, div, span, [role='button'], table")
          );

          const matched = elements.find((el) => {
            const htmlEl = el as HTMLElement;
            if (htmlEl.closest("[data-magic-editor-ui='true']")) return false;
            if (htmlEl.closest("[data-magic-eraser-ui='true']")) return false;
            const text = htmlEl.innerText?.trim() || "";
            return text.length > 2 && (text === rule.elementText || text.includes(rule.elementText));
          }) as HTMLElement | undefined;

          if (matched) {
            if (rule.left || rule.top) {
              matched.style.position = rule.position || "relative";
              if (rule.left) matched.style.left = rule.left;
              if (rule.top) matched.style.top = rule.top;
              matched.style.zIndex = rule.zIndex || "20";
            }
            if (rule.width) matched.style.width = rule.width;
            if (rule.height) matched.style.height = rule.height;
            if (rule.fontSize) matched.style.fontSize = rule.fontSize;
            matched.setAttribute("data-magic-modified", "true");
          }
        });
      } catch (err) {
        console.warn("Could not apply saved magic editor layout:", err);
      }
    };

    applySavedLayout();
  }, [pathname]);

  const clearHover = (el: HTMLElement | null) => {
    if (el && el !== selectedElement) {
      el.style.removeProperty("outline");
      el.style.removeProperty("outline-offset");
      el.style.removeProperty("cursor");
      el.removeAttribute("data-magic-editor-hovered");
    }
  };

  const toggleEditor = () => {
    setIsActive((prev) => {
      const next = !prev;
      if (!next) {
        setIsMergeMode(false);
        setSelectedButtons([]);
        setShowMergeDialog(false);
        if (selectedElement) {
          clearHover(selectedElement);
          setSelectedElement(null);
        }
      }
      return next;
    });
  };

  // Helper: record size change
  const recordSizeChange = (el: HTMLElement, newW?: string, newH?: string, newFont?: string) => {
    const text = el.innerText?.trim() || "";
    const rule: PositionRule = {
      type: "SIZE_CONTROL",
      url: pathname,
      elementText: text.slice(0, 80),
      tagName: el.tagName.toLowerCase(),
      classes: typeof el.className === "string" ? el.className : "",
      width: newW || el.style.width,
      height: newH || el.style.height,
      fontSize: newFont || el.style.fontSize,
      left: el.style.left,
      top: el.style.top,
      position: el.style.position,
    };

    setPendingRules((prev) => [...prev, rule]);
  };

  // Adjust width
  const adjustWidth = (delta: number) => {
    if (!selectedElement) return;
    const currentW = selectedElement.offsetWidth;
    const newW = Math.max(30, currentW + delta);
    selectedElement.style.width = `${newW}px`;
    setElementWidth(newW);
    recordSizeChange(selectedElement, `${newW}px`);
  };

  // Adjust height
  const adjustHeight = (delta: number) => {
    if (!selectedElement) return;
    const currentH = selectedElement.offsetHeight;
    const newH = Math.max(20, currentH + delta);
    selectedElement.style.height = `${newH}px`;
    setElementHeight(newH);
    recordSizeChange(selectedElement, undefined, `${newH}px`);
  };

  // Adjust Font Size (Headers, Labels, Buttons)
  const adjustFontSize = (delta: number) => {
    if (!selectedElement) return;
    const computed = parseFloat(window.getComputedStyle(selectedElement).fontSize) || 14;
    const newFont = Math.max(8, computed + delta);
    selectedElement.style.fontSize = `${newFont}px`;
    setElementFontSize(newFont);
    recordSizeChange(selectedElement, undefined, undefined, `${newFont}px`);
  };

  // Undo last action
  const handleUndo = () => {
    if (pendingRules.length === 0) return;
    const last = pendingRules[pendingRules.length - 1];

    const elements = Array.from(document.querySelectorAll("[data-magic-modified='true'], [data-magic-moved='true']"));
    const matched = elements.find((el) => {
      const text = (el as HTMLElement).innerText?.trim() || "";
      return text.includes(last.elementText);
    }) as HTMLElement | undefined;

    if (matched) {
      matched.style.removeProperty("position");
      matched.style.removeProperty("left");
      matched.style.removeProperty("top");
      matched.style.removeProperty("z-index");
      matched.style.removeProperty("width");
      matched.style.removeProperty("height");
      matched.style.removeProperty("font-size");
      matched.removeAttribute("data-magic-modified");
      matched.removeAttribute("data-magic-moved");
    }

    setPendingRules((prev) => prev.slice(0, -1));
  };

  // Save changes to backend and source code
  const handleSave = async () => {
    if (pendingRules.length === 0 && selectedButtons.length === 0) return;
    try {
      setIsSaving(true);

      const res = await fetch("/api/dev/magic-editor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actions: pendingRules }),
      });

      if (res.ok) {
        alert("All sizes, widths, heights, and positions successfully saved permanently!");
        setPendingRules([]);
      }
    } catch (err) {
      console.error("Failed to save layout:", err);
      alert("Error saving layout. Please check console.");
    } finally {
      setIsSaving(false);
    }
  };

  // Reset entire page layout to default
  const handleResetLayout = async () => {
    if (!confirm("Are you sure you want to reset all positions and sizes on this page to default?")) return;
    try {
      await fetch(`/api/dev/magic-editor?url=${encodeURIComponent(pathname)}`, {
        method: "DELETE",
      });
      window.location.reload();
    } catch (err) {
      console.error("Failed to reset layout:", err);
    }
  };

  // Confirm Merge Selected Buttons into Dropdown
  const handleConfirmMerge = () => {
    if (selectedButtons.length < 2) return;

    const firstBtn = selectedButtons[0];
    const parent = firstBtn.parentElement;
    if (!parent) return;

    const dropdownWrapper = document.createElement("div");
    dropdownWrapper.className = "relative inline-block text-left magic-editor-merged-dropdown";
    dropdownWrapper.setAttribute("data-magic-merged", "true");

    const mainBtn = document.createElement("button");
    mainBtn.type = "button";
    mainBtn.className =
      "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 shadow-sm transition";
    mainBtn.innerHTML = `<span>${mergeTitle}</span> <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>`;

    const menu = document.createElement("div");
    menu.className =
      "hidden absolute right-0 z-50 mt-1.5 w-44 origin-top-right rounded-xl bg-white p-1.5 shadow-xl ring-1 ring-slate-200 focus:outline-none flex flex-col gap-1";

    mainBtn.onclick = (e) => {
      e.stopPropagation();
      menu.classList.toggle("hidden");
    };

    selectedButtons.forEach((btn) => {
      const itemWrapper = document.createElement("div");
      itemWrapper.className = "w-full text-left";
      btn.style.width = "100%";
      btn.style.justifyContent = "flex-start";
      itemWrapper.appendChild(btn);
      menu.appendChild(itemWrapper);
    });

    dropdownWrapper.appendChild(mainBtn);
    dropdownWrapper.appendChild(menu);

    parent.insertBefore(dropdownWrapper, firstBtn);

    document.addEventListener("click", () => {
      menu.classList.add("hidden");
    });

    setSelectedButtons([]);
    setShowMergeDialog(false);
    setIsMergeMode(false);
  };

  // Target element finder (buttons, table headers, columns, rows, cards, text)
  const isEligibleTarget = (target: HTMLElement | null): HTMLElement | null => {
    if (!target) return null;
    if (target.closest("[data-magic-editor-ui='true']")) return null;
    if (target.closest("[data-magic-eraser-ui='true']")) return null;

    const element = target.closest(
      "button, a, th, td, tr, li, h1, h2, h3, h4, p, span, [role='button'], .card, .badge"
    ) as HTMLElement | null;

    return element;
  };

  // Main interaction listener (Hover, Click, Drag, Resize)
  useEffect(() => {
    if (!isActive) {
      if (hoveredElementRef.current) {
        clearHover(hoveredElementRef.current);
        hoveredElementRef.current = null;
      }
      return;
    }

    const handleMouseOver = (e: MouseEvent) => {
      if (isDraggingRef.current) return;
      const target = isEligibleTarget(e.target as HTMLElement);
      if (!target) return;

      if (hoveredElementRef.current && hoveredElementRef.current !== target) {
        clearHover(hoveredElementRef.current);
      }

      hoveredElementRef.current = target;
      target.style.outline = isMergeMode ? "2px dashed #8b5cf6" : "2px dashed #2563eb";
      target.style.outlineOffset = "2px";
      target.style.cursor = isMergeMode ? "pointer" : "move";
      target.setAttribute("data-magic-editor-hovered", "true");
    };

    const handleMouseOut = (e: MouseEvent) => {
      if (isDraggingRef.current) return;
      const target = isEligibleTarget(e.target as HTMLElement);
      if (!target) return;
      clearHover(target);
      if (hoveredElementRef.current === target) {
        hoveredElementRef.current = null;
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (isMergeMode || e.button !== 0) return;
      const target = isEligibleTarget(e.target as HTMLElement);
      if (!target) return;

      e.preventDefault();
      e.stopPropagation();

      isDraggingRef.current = true;
      activeDragElementRef.current = target;
      dragStartPosRef.current = { x: e.clientX, y: e.clientY };

      if (window.getComputedStyle(target).position === "static") {
        target.style.position = "relative";
      }

      const currentLeft = parseFloat(target.style.left) || 0;
      const currentTop = parseFloat(target.style.top) || 0;
      elementStartPosRef.current = { left: currentLeft, top: currentTop };

      target.style.zIndex = "1000";
      target.style.outline = "2px solid #2563eb";

      // Also set as selected element for size/font tuning
      if (selectedElement && selectedElement !== target) {
        clearHover(selectedElement);
      }
      setSelectedElement(target);
      setElementWidth(target.offsetWidth);
      setElementHeight(target.offsetHeight);
      const computedFont = parseFloat(window.getComputedStyle(target).fontSize) || 14;
      setElementFontSize(computedFont);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || !activeDragElementRef.current) return;

      e.preventDefault();
      const el = activeDragElementRef.current;
      const deltaX = e.clientX - dragStartPosRef.current.x;
      const deltaY = e.clientY - dragStartPosRef.current.y;

      const newLeft = elementStartPosRef.current.left + deltaX;
      const newTop = elementStartPosRef.current.top + deltaY;

      el.style.left = `${newLeft}px`;
      el.style.top = `${newTop}px`;
      el.setAttribute("data-magic-moved", "true");
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (!isDraggingRef.current || !activeDragElementRef.current) return;

      const el = activeDragElementRef.current;
      const deltaX = e.clientX - dragStartPosRef.current.x;
      const deltaY = e.clientY - dragStartPosRef.current.y;

      if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
        const text = el.innerText?.trim() || "";
        const rule: PositionRule = {
          type: "FREE_POSITION",
          url: pathname,
          elementText: text.slice(0, 80),
          tagName: el.tagName.toLowerCase(),
          classes: typeof el.className === "string" ? el.className : "",
          left: el.style.left,
          top: el.style.top,
          position: el.style.position,
          zIndex: el.style.zIndex,
        };

        setPendingRules((prev) => [...prev, rule]);
      }

      el.style.zIndex = "20";
      isDraggingRef.current = false;
      activeDragElementRef.current = null;
    };

    const handleClick = (e: MouseEvent) => {
      const target = isEligibleTarget(e.target as HTMLElement);
      if (!target) return;

      // Always block navigation / button actions in Magic Editor mode!
      e.preventDefault();
      e.stopPropagation();

      if (isMergeMode) {
        setSelectedButtons((prev) => {
          if (prev.includes(target)) {
            target.style.removeProperty("background");
            return prev.filter((el) => el !== target);
          } else {
            target.style.background = "#ede9fe";
            return [...prev, target];
          }
        });
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsActive(false);
        setSelectedElement(null);
      } else if ((e.ctrlKey || e.metaKey) && (e.key === "z" || e.key === "Z")) {
        e.preventDefault();
        handleUndo();
      }
    };

    window.addEventListener("mouseover", handleMouseOver, true);
    window.addEventListener("mouseout", handleMouseOut, true);
    window.addEventListener("mousedown", handleMouseDown, true);
    window.addEventListener("mousemove", handleMouseMove, true);
    window.addEventListener("mouseup", handleMouseUp, true);
    window.addEventListener("click", handleClick, true);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("mouseover", handleMouseOver, true);
      window.removeEventListener("mouseout", handleMouseOut, true);
      window.removeEventListener("mousedown", handleMouseDown, true);
      window.removeEventListener("mousemove", handleMouseMove, true);
      window.removeEventListener("mouseup", handleMouseUp, true);
      window.removeEventListener("click", handleClick, true);
      window.removeEventListener("keydown", handleKeyDown);

      if (hoveredElementRef.current) {
        clearHover(hoveredElementRef.current);
        hoveredElementRef.current = null;
      }
    };
  }, [isActive, isMergeMode, selectedElement, pendingRules, pathname]);

  return (
    <>
      {/* Merge Buttons Dialogue Modal */}
      {showMergeDialog && (
        <div
          data-magic-editor-ui="true"
          className="fixed inset-0 z-[100000] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-sm w-full p-5 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Merge Buttons into Dropdown</h3>
                  <p className="text-[11px] text-slate-500">{selectedButtons.length} buttons selected</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowMergeDialog(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Dropdown Menu Title:</label>
              <input
                type="text"
                value={mergeTitle}
                onChange={(e) => setMergeTitle(e.target.value)}
                placeholder="e.g. More Actions ▾"
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowMergeDialog(false)}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmMerge}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-sm transition"
              >
                Merge & Create Dropdown
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Magic Editor Toolbar */}
      <div
        data-magic-editor-ui="true"
        className="fixed bottom-6 left-44 z-[9999] flex flex-col gap-2 select-none"
      >
        {/* Sub-bar: Sizing & Font Controls (When an element is clicked/selected) */}
        {isActive && selectedElement && (
          <div className="flex items-center gap-2 bg-slate-900/95 text-white border border-indigo-400/50 shadow-2xl rounded-2xl p-2 px-3 backdrop-blur-lg animate-in fade-in slide-in-from-bottom-1 text-xs">
            <span className="font-bold text-indigo-300 truncate max-w-[100px] border-r border-slate-700 pr-2">
              &lt;{selectedElement.tagName.toLowerCase()}&gt; {selectedElement.innerText?.slice(0, 15) || "Item"}
            </span>

            {/* Width Controls */}
            <div className="flex items-center gap-1 bg-slate-800 px-2 py-1 rounded-lg border border-slate-700">
              <span className="text-[10px] text-slate-400 font-semibold">Width:</span>
              <button
                type="button"
                onClick={() => adjustWidth(-20)}
                title="Decrease width (-20px)"
                className="p-0.5 hover:bg-slate-700 rounded text-slate-300"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="text-[11px] font-mono font-bold text-indigo-300 min-w-[35px] text-center">
                {elementWidth}px
              </span>
              <button
                type="button"
                onClick={() => adjustWidth(20)}
                title="Increase width (+20px)"
                className="p-0.5 hover:bg-slate-700 rounded text-slate-300"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>

            {/* Height Controls */}
            <div className="flex items-center gap-1 bg-slate-800 px-2 py-1 rounded-lg border border-slate-700">
              <span className="text-[10px] text-slate-400 font-semibold">Height:</span>
              <button
                type="button"
                onClick={() => adjustHeight(-10)}
                title="Decrease height (-10px)"
                className="p-0.5 hover:bg-slate-700 rounded text-slate-300"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="text-[11px] font-mono font-bold text-indigo-300 min-w-[35px] text-center">
                {elementHeight}px
              </span>
              <button
                type="button"
                onClick={() => adjustHeight(10)}
                title="Increase height (+10px)"
                className="p-0.5 hover:bg-slate-700 rounded text-slate-300"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>

            {/* Font Size Controls (Headers, Titles, Text) */}
            <div className="flex items-center gap-1 bg-slate-800 px-2 py-1 rounded-lg border border-slate-700">
              <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-0.5">
                <Type className="w-3 h-3" /> Font:
              </span>
              <button
                type="button"
                onClick={() => adjustFontSize(-1)}
                title="Decrease text/header size (-1px)"
                className="p-0.5 hover:bg-slate-700 rounded text-slate-300"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="text-[11px] font-mono font-bold text-indigo-300 min-w-[25px] text-center">
                {Math.round(elementFontSize)}px
              </span>
              <button
                type="button"
                onClick={() => adjustFontSize(1)}
                title="Increase text/header size (+1px)"
                className="p-0.5 hover:bg-slate-700 rounded text-slate-300"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setSelectedElement(null)}
              title="Close element size bar"
              className="text-slate-400 hover:text-slate-200 ml-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Main Floating Tool Bar */}
        {!isActive ? (
          <button
            type="button"
            onClick={toggleEditor}
            title="Magic Editor: Drag to move, resize rows/columns & adjust header font sizes"
            className="flex items-center gap-2 bg-white/95 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 border border-slate-300 shadow-lg hover:shadow-xl rounded-full px-3.5 py-2.5 transition-all text-xs font-semibold backdrop-blur-md group"
          >
            <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <Move className="w-3.5 h-3.5" />
            </div>
            <span>Magic Editor</span>
            {pendingRules.length > 0 && (
              <span className="bg-indigo-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {pendingRules.length}
              </span>
            )}
          </button>
        ) : (
          <div className="flex items-center gap-2 bg-slate-900/95 text-white border border-indigo-500/40 shadow-2xl rounded-2xl p-2 px-3 backdrop-blur-lg animate-in fade-in slide-in-from-bottom-2 duration-200">
            {/* Status indicator */}
            <div className="flex items-center gap-2 pr-2 border-r border-slate-700">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
              </span>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-indigo-400 flex items-center gap-1">
                  <Move className="w-3 h-3" /> Magic Editor
                </span>
                <span className="text-[10px] text-slate-400">Drag to move • Click to resize</span>
              </div>
            </div>

            {/* Changes Counter */}
            <span className="text-[11px] font-semibold bg-slate-800 text-indigo-300 px-2 py-1 rounded-md border border-slate-700">
              {pendingRules.length} modified
            </span>

            {/* Merge Buttons Toggle Mode */}
            <button
              type="button"
              onClick={() => {
                if (isMergeMode && selectedButtons.length >= 2) {
                  setShowMergeDialog(true);
                } else {
                  setIsMergeMode((prev) => !prev);
                  setSelectedButtons([]);
                }
              }}
              title="Click to select multiple buttons to merge into a single dropdown menu"
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg border transition ${
                isMergeMode
                  ? "bg-purple-600 text-white border-purple-500 shadow-sm"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-700"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>
                {isMergeMode
                  ? selectedButtons.length >= 2
                    ? `Merge (${selectedButtons.length}) ▾`
                    : "Pick 2+ Buttons"
                  : "Merge Buttons"}
              </span>
            </button>

            {/* Undo Last Action */}
            <button
              type="button"
              onClick={handleUndo}
              disabled={pendingRules.length === 0}
              title="Undo last position or size change (Ctrl+Z)"
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded-lg border border-slate-700 transition"
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span>Undo</span>
            </button>

            {/* Reset to Default */}
            <button
              type="button"
              onClick={handleResetLayout}
              title="Reset all positions and sizes on this page back to original"
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-slate-800 hover:bg-rose-950/70 hover:text-rose-300 text-slate-300 rounded-lg border border-slate-700 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>

            {/* Save Button (Writes to backend & source code) */}
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || pendingRules.length === 0}
              title="Save all changes (sizes, widths, heights, positions) permanently into backend & source code"
              className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-lg shadow-sm transition"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? "Saving..." : "Save"}</span>
            </button>

            {/* Done / Exit */}
            <button
              type="button"
              onClick={toggleEditor}
              title="Done editing (Esc)"
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Done</span>
            </button>
          </div>
        )}
      </div>

      {/* Global Indicator Banner when active */}
      {isActive && (
        <div
          data-magic-editor-ui="true"
          className="fixed top-2 left-1/2 -translate-x-1/2 z-[9999] bg-indigo-600 text-white px-4 py-1.5 rounded-full shadow-lg text-xs font-medium flex items-center gap-2 pointer-events-none select-none border border-indigo-400"
        >
          <Move className="w-3.5 h-3.5 animate-pulse" />
          <span>
            {isMergeMode
              ? "Merge Mode Active: Click 2 or more buttons to group them into a single dropdown menu."
              : selectedElement
              ? `Selected: <${selectedElement.tagName.toLowerCase()}> - Use Toolbar controls (+ / -) to change Width, Height, and Font Size!`
              : "Magic Editor Active: Drag to move any element OR Click on any table column, row, button or header to adjust its Width, Height & Font Size!"}
          </span>
        </div>
      )}
    </>
  );
}
