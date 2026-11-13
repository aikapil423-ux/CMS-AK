"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Wand2,
  Edit3,
  Trash2,
  Maximize2,
  Plus,
  Minus,
  Check,
  X,
  Undo2,
  RotateCcw,
  Copy,
  Layers,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Move,
  Type,
  Eye,
  EyeOff,
  Sparkles,
  Download,
  ListFilter,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  AlignLeft,
  AlignCenter,
  AlignRight,
  GripHorizontal,
} from "lucide-react";
import { usePathname } from "next/navigation";

export interface MagicModification {
  id: string;
  timestamp: string;
  url: string;
  actionType: "RENAME_TEXT" | "RESIZE" | "DELETE_ELEMENT" | "ADD_BUTTON" | "MOVE_POSITION" | "CUSTOM_STYLE";
  selector?: string;
  tagName: string;
  originalText?: string;
  newText?: string;
  width?: string;
  height?: string;
  fontSize?: string;
  classes?: string;
  styles?: Record<string, string>;
  parentContext?: string;
  isApplied?: boolean;
}

export function MagicEditorTool() {
  const pathname = usePathname();

  // Primary Tool Modes
  const [isActive, setIsActive] = useState(false);
  const [showModificationsList, setShowModificationsList] = useState(false);
  const [activeTab, setActiveTab] = useState<"INSPECTOR" | "MODIFICATIONS">("INSPECTOR");
  const [listScope, setListScope] = useState<"THIS_PAGE" | "ALL_PAGES">("ALL_PAGES");

  // Selection & Inspector State
  const [selectedEl, setSelectedEl] = useState<HTMLElement | null>(null);
  const [selectedMeta, setSelectedMeta] = useState<{
    tagName: string;
    text: string;
    width: number;
    height: number;
    fontSize: number;
    classes: string;
    selector: string;
  } | null>(null);

  // Inspector Form Inputs
  const [inputText, setInputText] = useState("");
  const [inputWidth, setInputWidth] = useState<number>(0);
  const [inputHeight, setInputHeight] = useState<number>(0);
  const [inputFontSize, setInputFontSize] = useState<number>(14);
  const [inputShiftX, setInputShiftX] = useState<number>(0);
  const [inputShiftY, setInputShiftY] = useState<number>(0);
  const [inputTextAlign, setInputTextAlign] = useState<"left" | "center" | "right">("left");

  // Draggable Inspector Toolbar Position State
  const [toolbarPos, setToolbarPos] = useState<{ x: number; y: number } | null>(null);
  const isDraggingToolbarRef = useRef(false);
  const dragStartOffsetRef = useRef({ x: 0, y: 0 });

  // New Button Creation Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newBtnLabel, setNewBtnLabel] = useState("");
  const [newBtnColor, setNewBtnColor] = useState<"blue" | "emerald" | "amber" | "rose" | "purple">("blue");

  // Modifications store & history
  const [modifications, setModifications] = useState<MagicModification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  // Hover tracker
  const hoveredElRef = useRef<HTMLElement | null>(null);

  // 1. Fetch persistent modifications from backend on mount and path change
  const fetchModifications = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/dev/magic-editor");
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data.modifications)) {
        setModifications(data.modifications);
      }
    } catch (err) {
      console.warn("Could not load magic modifications:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchModifications();
  }, [pathname]);

  // 2. Apply modifications to live DOM
  useEffect(() => {
    if (modifications.length === 0) return;

    const applyAll = () => {
      modifications.forEach((mod) => {
        // Apply if mod matches current pathname (accounting for query strings/trailing slash) or is global (*)
        const urlMatches =
          mod.url === "*" ||
          mod.url === pathname ||
          pathname.startsWith(mod.url) ||
          mod.url.startsWith(pathname);
        if (!urlMatches) return;

        // Try finding matching element(s)
        const candidates = Array.from(
          document.querySelectorAll("button, a, h1, h2, h3, h4, h5, p, span, th, td, tr, li, div, [role='button']")
        );

        candidates.forEach((node) => {
          const el = node as HTMLElement;
          if (el.closest("[data-magic-editor-ui='true']")) return;

          const text = (el.innerText || el.textContent || "").trim();
          const matchesText = mod.originalText && text === mod.originalText.trim();
          const matchesNewText = mod.newText && text === mod.newText.trim();
          const matchesSelector = mod.selector && el.matches ? (() => { try { return el.matches(mod.selector!); } catch { return false; } })() : false;

          const isTargetMatch = matchesSelector || matchesText || matchesNewText;

          if (isTargetMatch) {
            if (mod.actionType === "RENAME_TEXT" && mod.newText) {
              if (el.innerText !== mod.newText) {
                el.innerText = mod.newText;
                el.setAttribute("data-magic-edited", "true");
              }
            } else if (mod.actionType === "DELETE_ELEMENT") {
              el.style.display = "none";
              el.setAttribute("data-magic-deleted", "true");
            } else if (mod.actionType === "RESIZE") {
              if (mod.width) {
                el.style.setProperty("width", mod.width, "important");
                el.style.setProperty("min-width", mod.width, "important");
                el.style.setProperty("max-width", mod.width, "important");
              }
              if (mod.height) {
                el.style.setProperty("height", mod.height, "important");
                el.style.setProperty("min-height", mod.height, "important");
                el.style.setProperty("max-height", mod.height, "important");
              }
              el.style.setProperty("box-sizing", "border-box", "important");
              el.style.setProperty("flex-shrink", "0", "important");

              const tag = el.tagName.toLowerCase();
              const isBtn = tag === "button" || el.getAttribute("role") === "button" || el.classList.contains("btn");
              if (isBtn) {
                el.style.setProperty("display", "inline-flex", "important");
                el.style.setProperty("align-items", "center", "important");
                el.style.setProperty("justify-content", "center", "important");
                const hNum = parseInt(mod.height || "0", 10);
                if (hNum > 0 && hNum < 34) {
                  el.style.setProperty("padding-top", "2px", "important");
                  el.style.setProperty("padding-bottom", "2px", "important");
                }
              } else {
                const compDisplay = window.getComputedStyle(el).display;
                if (compDisplay === "inline") {
                  el.style.setProperty("display", "inline-block", "important");
                }
              }

              if (mod.fontSize) {
                el.style.setProperty("font-size", mod.fontSize, "important");
                // Also propagate to direct child spans / svg / text nodes if container was clicked
                el.querySelectorAll("*").forEach((child) => {
                  (child as HTMLElement).style.setProperty("font-size", mod.fontSize!, "important");
                });
              }
              el.setAttribute("data-magic-resized", "true");
            } else if (mod.actionType === "MOVE_POSITION") {
              if (mod.styles?.transform) {
                el.style.transform = mod.styles.transform;
                el.style.display = el.style.display || "inline-block";
                el.setAttribute("data-magic-moved", "true");
              }
            } else if (mod.actionType === "CUSTOM_STYLE") {
              if (mod.styles?.textAlign) {
                el.style.textAlign = mod.styles.textAlign;
                el.setAttribute("data-magic-aligned", "true");
              }
            }
          }
        });
      });
    };

    applyAll();
    const timer = setTimeout(applyAll, 300);
    return () => clearTimeout(timer);
  }, [modifications, pathname]);

  // 3. Hover & Click Inspector Event Listeners when Tool is Active
  useEffect(() => {
    if (!isActive) {
      if (hoveredElRef.current) {
        hoveredElRef.current.style.outline = "";
        hoveredElRef.current = null;
      }
      return;
    }

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target || target.closest("[data-magic-editor-ui='true']")) return;

      if (hoveredElRef.current && hoveredElRef.current !== target && hoveredElRef.current !== selectedEl) {
        hoveredElRef.current.style.outline = "";
      }

      if (target !== selectedEl) {
        target.style.outline = "2px dashed #6366f1";
        target.style.outlineOffset = "2px";
        target.style.cursor = "crosshair";
        hoveredElRef.current = target;
      }
    };

    const handleMouseOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target || target.closest("[data-magic-editor-ui='true']")) return;
      if (target !== selectedEl) {
        target.style.outline = "";
      }
    };

    const handleClick = (e: MouseEvent) => {
      let target = e.target as HTMLElement;
      if (!target || target.closest("[data-magic-editor-ui='true']")) return;

      e.preventDefault();
      e.stopPropagation();

      // If target is inside a button (span, svg, path, etc.), auto-select the button directly
      const parentButton = target.closest("button, [role='button'], a.btn") as HTMLElement | null;
      if (parentButton) {
        target = parentButton;
      }

      // Clear previous selection highlight
      if (selectedEl) {
        selectedEl.style.outline = "";
      }

      // Highlight new selection
      target.style.outline = "3px solid #4f46e5";
      target.style.outlineOffset = "2px";
      setSelectedEl(target);

      const computed = window.getComputedStyle(target);
      const rect = target.getBoundingClientRect();
      let rawText = (target.innerText || target.textContent || "").trim();
      if (!rawText) {
        rawText = target.getAttribute("aria-label") || target.getAttribute("title") || target.getAttribute("placeholder") || "";
      }

      // Smart selector generation
      let selector = "";
      if (target.id) {
        selector = `#${target.id}`;
      } else if (target.getAttribute("aria-label")) {
        selector = `${target.tagName.toLowerCase()}[aria-label="${target.getAttribute("aria-label")}"]`;
      } else if (target.getAttribute("title")) {
        selector = `${target.tagName.toLowerCase()}[title="${target.getAttribute("title")}"]`;
      } else {
        const simpleClass = (target.className || "").toString().split(" ").find((c) => c && !c.includes(":") && !c.includes("[") && !c.includes("/"));
        if (simpleClass) {
          selector = `${target.tagName.toLowerCase()}.${simpleClass}`;
        } else {
          selector = target.tagName.toLowerCase();
        }
      }

      setSelectedMeta({
        tagName: target.tagName.toLowerCase(),
        text: rawText,
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        fontSize: parseInt(computed.fontSize || "14", 10),
        classes: target.className || "",
        selector: selector,
      });

      setInputText(rawText);
      setInputWidth(Math.round(rect.width));
      setInputHeight(Math.round(rect.height));
      setInputFontSize(parseInt(computed.fontSize || "14", 10));
      setInputTextAlign((computed.textAlign as "left" | "center" | "right") || "left");

      // Parse existing transform if any
      const transformVal = target.style.transform || "";
      const matchTranslate = transformVal.match(/translate\((-?\d+)px,\s*(-?\d+)px\)/);
      if (matchTranslate) {
        setInputShiftX(parseInt(matchTranslate[1], 10));
        setInputShiftY(parseInt(matchTranslate[2], 10));
      } else {
        setInputShiftX(0);
        setInputShiftY(0);
      }
    };

    document.addEventListener("mouseover", handleMouseOver, true);
    document.addEventListener("mouseout", handleMouseOut, true);
    document.addEventListener("click", handleClick, true);

    return () => {
      document.removeEventListener("mouseover", handleMouseOver, true);
      document.removeEventListener("mouseout", handleMouseOut, true);
      document.removeEventListener("click", handleClick, true);
      if (hoveredElRef.current) {
        hoveredElRef.current.style.outline = "";
      }
    };
  }, [isActive, selectedEl]);

  // Clean selection on escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (selectedEl) {
          selectedEl.style.outline = "";
          setSelectedEl(null);
          setSelectedMeta(null);
        } else if (isActive) {
          setIsActive(false);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedEl, isActive]);

  // Filtered modifications for drawer display
  const displayedModifications = useMemo(() => {
    if (listScope === "THIS_PAGE") {
      return modifications.filter(
        (m) =>
          m.url === "*" ||
          m.url === pathname ||
          pathname.startsWith(m.url) ||
          m.url.startsWith(pathname)
      );
    }
    return modifications;
  }, [modifications, listScope, pathname]);

  // Navigate to parent element
  const handleSelectParent = () => {
    if (!selectedEl) return;
    const parent = selectedEl.parentElement;
    if (!parent || parent === document.body || parent.closest("[data-magic-editor-ui='true']")) return;

    selectedEl.style.outline = "";
    parent.style.outline = "3px solid #4f46e5";
    parent.style.outlineOffset = "2px";
    setSelectedEl(parent);

    const computed = window.getComputedStyle(parent);
    const rect = parent.getBoundingClientRect();
    let rawText = (parent.innerText || parent.textContent || "").trim();
    if (!rawText) {
      rawText = parent.getAttribute("aria-label") || parent.getAttribute("title") || "";
    }

    let selector = "";
    if (parent.id) {
      selector = `#${parent.id}`;
    } else {
      selector = parent.tagName.toLowerCase();
    }

    setSelectedMeta({
      tagName: parent.tagName.toLowerCase(),
      text: rawText,
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      fontSize: parseInt(computed.fontSize || "14", 10),
      classes: parent.className || "",
      selector: selector,
    });

    setInputText(rawText);
    setInputWidth(Math.round(rect.width));
    setInputHeight(Math.round(rect.height));
    setInputFontSize(parseInt(computed.fontSize || "14", 10));
    setInputTextAlign((computed.textAlign as "left" | "center" | "right") || "left");
  };

  // Save a modification to backend
  const recordModification = async (mod: Omit<MagicModification, "id" | "timestamp" | "url">) => {
    const newEntry: MagicModification = {
      id: `mod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      url: pathname,
      ...mod,
      isApplied: true,
    };

    try {
      const res = await fetch("/api/dev/magic-editor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modification: newEntry }),
      });
      if (res.ok) {
        const data = await res.json();
        setModifications(data.modifications || []);
      }
    } catch (e) {
      console.error("Error saving modification:", e);
    }
  };

  // 1. Text rename handler
  const handleApplyText = () => {
    if (!selectedEl || !selectedMeta || !inputText.trim()) return;
    const oldText = selectedMeta.text;
    selectedEl.innerText = inputText;

    recordModification({
      actionType: "RENAME_TEXT",
      tagName: selectedMeta.tagName,
      originalText: oldText,
      newText: inputText,
      classes: selectedMeta.classes,
    });

    setSelectedMeta((prev) => (prev ? { ...prev, text: inputText } : null));
  };

  // 2. Resize Width / Height
  const handleApplyDimensions = (w: number, h: number) => {
    if (!selectedEl || !selectedMeta) return;

    // Use !important on width, minWidth, maxWidth, height, minHeight
    selectedEl.style.setProperty("width", `${w}px`, "important");
    selectedEl.style.setProperty("min-width", `${w}px`, "important");
    selectedEl.style.setProperty("max-width", `${w}px`, "important");

    selectedEl.style.setProperty("height", `${h}px`, "important");
    selectedEl.style.setProperty("min-height", `${h}px`, "important");
    selectedEl.style.setProperty("max-height", `${h}px`, "important");
    selectedEl.style.setProperty("box-sizing", "border-box", "important");
    selectedEl.style.setProperty("flex-shrink", "0", "important");

    const tag = selectedEl.tagName.toLowerCase();
    const isBtn = tag === "button" || selectedEl.getAttribute("role") === "button" || selectedEl.classList.contains("btn");

    if (isBtn) {
      selectedEl.style.setProperty("display", "inline-flex", "important");
      selectedEl.style.setProperty("align-items", "center", "important");
      selectedEl.style.setProperty("justify-content", "center", "important");
      // If height is smaller than standard button padding (e.g. < 34px), reduce padding so it can shrink
      if (h < 34) {
        selectedEl.style.setProperty("padding-top", "2px", "important");
        selectedEl.style.setProperty("padding-bottom", "2px", "important");
      }
      if (w < 80) {
        selectedEl.style.setProperty("padding-left", "6px", "important");
        selectedEl.style.setProperty("padding-right", "6px", "important");
      }
    } else {
      const compDisplay = window.getComputedStyle(selectedEl).display;
      if (compDisplay === "inline") {
        selectedEl.style.setProperty("display", "inline-block", "important");
      }
    }

    setInputWidth(w);
    setInputHeight(h);

    recordModification({
      actionType: "RESIZE",
      tagName: selectedMeta.tagName,
      selector: selectedMeta.selector,
      originalText: selectedMeta.text,
      width: `${w}px`,
      height: `${h}px`,
      fontSize: `${inputFontSize}px`,
      classes: selectedMeta.classes,
    });
  };

  // 2.1 Reset dimension to auto
  const handleResetDimension = (dim: "width" | "height") => {
    if (!selectedEl || !selectedMeta) return;
    if (dim === "width") {
      selectedEl.style.removeProperty("width");
      selectedEl.style.removeProperty("min-width");
      selectedEl.style.removeProperty("max-width");
      selectedEl.style.removeProperty("padding-left");
      selectedEl.style.removeProperty("padding-right");
    } else {
      selectedEl.style.removeProperty("height");
      selectedEl.style.removeProperty("min-height");
      selectedEl.style.removeProperty("max-height");
      selectedEl.style.removeProperty("padding-top");
      selectedEl.style.removeProperty("padding-bottom");
    }
    const rect = selectedEl.getBoundingClientRect();
    setInputWidth(Math.round(rect.width));
    setInputHeight(Math.round(rect.height));
  };

  // 3. Font size adjustment
  const handleApplyFontSize = (newSize: number) => {
    if (!selectedEl || !selectedMeta) return;
    selectedEl.style.setProperty("font-size", `${newSize}px`, "important");
    // Also propagate to all text children
    selectedEl.querySelectorAll("*").forEach((child) => {
      (child as HTMLElement).style.setProperty("font-size", `${newSize}px`, "important");
    });

    setInputFontSize(newSize);

    recordModification({
      actionType: "RESIZE",
      tagName: selectedMeta.tagName,
      originalText: selectedMeta.text,
      width: `${inputWidth}px`,
      height: `${inputHeight}px`,
      fontSize: `${newSize}px`,
      classes: selectedMeta.classes,
    });
  };

  // 3.1 Position nudge (Shift Up / Down / Left / Right)
  const handleNudgePosition = (deltaX: number, deltaY: number) => {
    if (!selectedEl || !selectedMeta) return;
    const newX = inputShiftX + deltaX;
    const newY = inputShiftY + deltaY;
    setInputShiftX(newX);
    setInputShiftY(newY);

    selectedEl.style.transform = `translate(${newX}px, ${newY}px)`;
    selectedEl.style.display = selectedEl.style.display || "inline-block";

    recordModification({
      actionType: "MOVE_POSITION",
      tagName: selectedMeta.tagName,
      originalText: selectedMeta.text,
      styles: {
        transform: `translate(${newX}px, ${newY}px)`,
      },
      classes: selectedMeta.classes,
    });
  };

  // 3.2 Text alignment (Left, Center, Right)
  const handleApplyAlignment = (align: "left" | "center" | "right") => {
    if (!selectedEl || !selectedMeta) return;
    selectedEl.style.textAlign = align;
    setInputTextAlign(align);

    recordModification({
      actionType: "CUSTOM_STYLE",
      tagName: selectedMeta.tagName,
      originalText: selectedMeta.text,
      styles: {
        textAlign: align,
      },
      classes: selectedMeta.classes,
    });
  };

  // 4. Delete element handler
  const handleDeleteElement = () => {
    if (!selectedEl || !selectedMeta) return;
    selectedEl.style.display = "none";

    recordModification({
      actionType: "DELETE_ELEMENT",
      tagName: selectedMeta.tagName,
      originalText: selectedMeta.text,
      classes: selectedMeta.classes,
    });

    selectedEl.style.outline = "";
    setSelectedEl(null);
    setSelectedMeta(null);
  };

  // 5. Add custom button inside container
  const handleCreateButton = () => {
    if (!newBtnLabel.trim() || !selectedEl) return;

    const newBtn = document.createElement("button");
    const colorClasses = {
      blue: "bg-blue-600 hover:bg-blue-700 text-white",
      emerald: "bg-emerald-600 hover:bg-emerald-700 text-white",
      amber: "bg-amber-600 hover:bg-amber-700 text-white",
      rose: "bg-rose-600 hover:bg-rose-700 text-white",
      purple: "bg-purple-600 hover:bg-purple-700 text-white",
    }[newBtnColor];

    newBtn.className = `px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition inline-flex items-center gap-1.5 ${colorClasses}`;
    newBtn.innerText = newBtnLabel;

    selectedEl.appendChild(newBtn);

    recordModification({
      actionType: "ADD_BUTTON",
      tagName: "button",
      newText: newBtnLabel,
      parentContext: selectedMeta?.text || selectedMeta?.tagName || "container",
      classes: newBtn.className,
    });

    setShowAddModal(false);
    setNewBtnLabel("");
  };

  // 6. Delete / Undo a specific item from modification list
  const handleUndoModification = async (mod: MagicModification) => {
    try {
      const res = await fetch(`/api/dev/magic-editor?id=${encodeURIComponent(mod.id)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        const data = await res.json();
        setModifications(data.modifications || []);

        // Reverse on live DOM
        const candidates = Array.from(document.querySelectorAll("*"));
        candidates.forEach((c) => {
          const el = c as HTMLElement;
          if (el.closest("[data-magic-editor-ui='true']")) return;

          const text = (el.innerText || el.textContent || "").trim();
          if (mod.actionType === "DELETE_ELEMENT" && (text === mod.originalText || el.getAttribute("data-magic-deleted"))) {
            el.style.display = "";
            el.removeAttribute("data-magic-deleted");
          } else if (mod.actionType === "RENAME_TEXT" && text === mod.newText) {
            if (mod.originalText) el.innerText = mod.originalText;
            el.removeAttribute("data-magic-edited");
          } else if (mod.actionType === "RESIZE") {
            el.style.width = "";
            el.style.height = "";
            el.style.fontSize = "";
            el.removeAttribute("data-magic-resized");
          } else if (mod.actionType === "MOVE_POSITION") {
            el.style.transform = "";
            el.removeAttribute("data-magic-moved");
          } else if (mod.actionType === "CUSTOM_STYLE") {
            el.style.textAlign = "";
            el.removeAttribute("data-magic-aligned");
          }
        });
      }
    } catch (e) {
      console.error("Error undoing modification:", e);
    }
  };

  // 7. Clear all modifications for this page
  const handleResetCurrentPage = async () => {
    if (!confirm("Are you sure you want to reset all modifications on this page?")) return;
    try {
      const res = await fetch(`/api/dev/magic-editor?url=${encodeURIComponent(pathname)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        window.location.reload();
      }
    } catch (e) {
      console.error("Error resetting page:", e);
    }
  };

  // 8. Copy JSON Modifications for Antigravity prompt
  const handleCopyForAntigravity = () => {
    const formatted = JSON.stringify(
      {
        instruction: "Please apply the following Magic Editor modifications permanently into the source code:",
        totalModifications: modifications.length,
        modifications: modifications,
      },
      null,
      2
    );

    navigator.clipboard.writeText(formatted);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2500);
  };

  return (
    <>
      {/* Floating Magic Editor Launcher Pill */}
      <div
        data-magic-editor-ui="true"
        className="fixed bottom-6 right-24 z-[9999] flex items-center gap-2 select-none"
      >
        <button
          type="button"
          onClick={() => {
            const next = !isActive;
            setIsActive(next);
            if (!next && selectedEl) {
              selectedEl.style.outline = "";
              setSelectedEl(null);
              setSelectedMeta(null);
            }
          }}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-full font-bold text-xs shadow-2xl transition-all duration-200 border cursor-pointer ${
            isActive
              ? "bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-400 ring-4 ring-indigo-400/30 scale-105"
              : "bg-slate-900/90 hover:bg-slate-900 text-slate-200 border-slate-700 backdrop-blur-md"
          }`}
          title="Magic Editor: Modify buttons, resize, edit text, delete or add elements directly on UI"
        >
          <Wand2 className={`w-4 h-4 ${isActive ? "text-amber-300 animate-spin" : "text-indigo-400"}`} />
          <span>{isActive ? "Magic Editor (Active)" : "Magic Editor"}</span>
          {modifications.length > 0 && (
            <span className="bg-indigo-500/80 text-white font-mono text-[10px] px-1.5 py-0.5 rounded-full">
              {modifications.length}
            </span>
          )}
        </button>

        {/* View Modifications List Button */}
        <button
          type="button"
          onClick={() => setShowModificationsList(!showModificationsList)}
          className={`p-2 rounded-full border shadow-xl transition cursor-pointer ${
            showModificationsList
              ? "bg-purple-600 text-white border-purple-400"
              : "bg-slate-900/90 hover:bg-slate-800 text-slate-300 border-slate-700"
          }`}
          title="Open Modifications List (Inspect, Undo or Export for Antigravity)"
        >
          <Layers className="w-4 h-4" />
        </button>
      </div>

      {/* Floating Element Inspector Toolbar (Appears when an element is clicked) */}
      {isActive && selectedEl && selectedMeta && (
        <div
          data-magic-editor-ui="true"
          style={
            toolbarPos
              ? { left: `${toolbarPos.x}px`, top: `${toolbarPos.y}px`, transform: "none" }
              : undefined
          }
          className={`fixed z-[9999] bg-white text-slate-900 border-2 border-indigo-600 shadow-2xl rounded-2xl p-4 animate-in fade-in flex flex-col gap-3 min-w-[440px] max-w-xl text-xs select-none ${
            !toolbarPos ? "bottom-20 left-1/2 -translate-x-1/2" : ""
          }`}
        >
          {/* Header with Drag Handle */}
          <div
            className="flex items-center justify-between border-b border-slate-200 pb-2.5 cursor-move active:cursor-grabbing bg-slate-50 -m-4 mb-0 p-3 rounded-t-2xl border-b"
            onMouseDown={(e) => {
              isDraggingToolbarRef.current = true;
              const box = (e.currentTarget.parentElement as HTMLElement).getBoundingClientRect();
              dragStartOffsetRef.current = {
                x: e.clientX - box.left,
                y: e.clientY - box.top,
              };

              const handleMouseMove = (moveEvt: MouseEvent) => {
                if (!isDraggingToolbarRef.current) return;
                setToolbarPos({
                  x: Math.max(10, Math.min(window.innerWidth - 450, moveEvt.clientX - dragStartOffsetRef.current.x)),
                  y: Math.max(10, Math.min(window.innerHeight - 250, moveEvt.clientY - dragStartOffsetRef.current.y)),
                });
              };

              const handleMouseUp = () => {
                isDraggingToolbarRef.current = false;
                window.removeEventListener("mousemove", handleMouseMove);
                window.removeEventListener("mouseup", handleMouseUp);
              };

              window.addEventListener("mousemove", handleMouseMove);
              window.addEventListener("mouseup", handleMouseUp);
            }}
          >
            <div className="flex items-center gap-2">
              <GripHorizontal className="w-4 h-4 text-slate-400" />
              <span className="bg-indigo-100 text-indigo-700 border border-indigo-300 px-2 py-0.5 rounded text-[11px] font-mono font-bold">
                &lt;{selectedMeta.tagName}&gt;
              </span>
              {selectedEl.parentElement && selectedEl.parentElement !== document.body && (
                <button
                  type="button"
                  onClick={handleSelectParent}
                  className="px-2 py-0.5 bg-slate-200 hover:bg-indigo-100 hover:text-indigo-700 text-slate-700 rounded text-[10px] font-semibold border border-slate-300 transition cursor-pointer"
                  title={`Select parent container <${selectedEl.parentElement.tagName.toLowerCase()}>`}
                >
                  ↑ Parent &lt;{selectedEl.parentElement.tagName.toLowerCase()}&gt;
                </button>
              )}
              <span className="text-slate-900 font-bold truncate max-w-[180px] text-xs" title={selectedMeta.text}>
                {selectedMeta.text || "Empty Container"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400 font-semibold italic">Drag to move</span>
              <button
                type="button"
                onClick={() => {
                  if (selectedEl) selectedEl.style.outline = "";
                  setSelectedEl(null);
                  setSelectedMeta(null);
                }}
                className="p-1 hover:bg-slate-200 text-slate-500 hover:text-slate-900 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Edit Text */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Edit text content..."
              className="flex-1 bg-slate-50 border-2 border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-indigo-600 focus:bg-white transition"
            />
            <button
              type="button"
              onClick={handleApplyText}
              disabled={inputText === selectedMeta.text}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <Edit3 className="w-4 h-4" />
              <span>Apply</span>
            </button>
          </div>

          {/* Text Alignment & Layout Bar */}
          <div className="flex items-center justify-between bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <span className="text-[11px] text-slate-600 font-bold uppercase tracking-wider">Text / Button Alignment:</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleApplyAlignment("left")}
                className={`p-1.5 rounded-lg border font-semibold flex items-center gap-1 transition ${
                  inputTextAlign === "left"
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                    : "bg-white hover:bg-slate-100 text-slate-700 border-slate-300"
                }`}
                title="Align Left"
              >
                <AlignLeft className="w-3.5 h-3.5" />
                <span className="text-[10px]">Left</span>
              </button>
              <button
                type="button"
                onClick={() => handleApplyAlignment("center")}
                className={`p-1.5 rounded-lg border font-semibold flex items-center gap-1 transition ${
                  inputTextAlign === "center"
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                    : "bg-white hover:bg-slate-100 text-slate-700 border-slate-300"
                }`}
                title="Align Center"
              >
                <AlignCenter className="w-3.5 h-3.5" />
                <span className="text-[10px]">Center</span>
              </button>
              <button
                type="button"
                onClick={() => handleApplyAlignment("right")}
                className={`p-1.5 rounded-lg border font-semibold flex items-center gap-1 transition ${
                  inputTextAlign === "right"
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                    : "bg-white hover:bg-slate-100 text-slate-700 border-slate-300"
                }`}
                title="Align Right"
              >
                <AlignRight className="w-3.5 h-3.5" />
                <span className="text-[10px]">Right</span>
              </button>
            </div>
          </div>

          {/* Resizing, Font & Position Controls */}
          <div className="grid grid-cols-4 gap-2 pt-1 border-t border-slate-200">
            {/* Position (Move / Nudge) */}
            <div className="bg-indigo-50/70 p-2 rounded-xl border border-indigo-200 flex flex-col gap-1 items-center">
              <span className="text-[10px] text-indigo-700 font-bold uppercase tracking-wider flex items-center gap-1">
                <Move className="w-3 h-3" />
                <span>Move</span>
              </span>
              <div className="grid grid-cols-3 gap-1">
                <div />
                <button
                  type="button"
                  onClick={() => handleNudgePosition(0, -4)}
                  title="Shift Up"
                  className="p-1 bg-white hover:bg-indigo-100 text-indigo-800 border border-indigo-300 rounded shadow-xs cursor-pointer active:scale-95"
                >
                  <ArrowUp className="w-3 h-3" />
                </button>
                <div />
                <button
                  type="button"
                  onClick={() => handleNudgePosition(-6, 0)}
                  title="Shift Left"
                  className="p-1 bg-white hover:bg-indigo-100 text-indigo-800 border border-indigo-300 rounded shadow-xs cursor-pointer active:scale-95"
                >
                  <ArrowLeft className="w-3 h-3" />
                </button>
                <div className="text-[9px] font-mono font-bold text-slate-700 flex items-center justify-center">
                  {inputShiftX !== 0 || inputShiftY !== 0 ? `${inputShiftX},${inputShiftY}` : "0"}
                </div>
                <button
                  type="button"
                  onClick={() => handleNudgePosition(6, 0)}
                  title="Shift Right"
                  className="p-1 bg-white hover:bg-indigo-100 text-indigo-800 border border-indigo-300 rounded shadow-xs cursor-pointer active:scale-95"
                >
                  <ArrowRight className="w-3 h-3" />
                </button>
                <div />
                <button
                  type="button"
                  onClick={() => handleNudgePosition(0, 4)}
                  title="Shift Down"
                  className="p-1 bg-white hover:bg-indigo-100 text-indigo-800 border border-indigo-300 rounded shadow-xs cursor-pointer active:scale-95"
                >
                  <ArrowDown className="w-3 h-3" />
                </button>
                <div />
              </div>
            </div>

            {/* Width Controls */}
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-200 flex flex-col gap-1 items-center justify-between">
              <div className="flex items-center justify-between w-full px-0.5">
                <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">Width</span>
                <button
                  type="button"
                  onClick={() => handleResetDimension("width")}
                  className="text-[9px] text-indigo-600 hover:underline cursor-pointer"
                  title="Reset to Auto Width"
                >
                  Auto
                </button>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleApplyDimensions(Math.max(20, inputWidth - 10), inputHeight)}
                  className="p-1 bg-white hover:bg-slate-200 text-slate-700 border border-slate-300 rounded shadow-xs cursor-pointer active:scale-95"
                  title="-10px"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <div className="flex items-center bg-white border border-slate-300 rounded px-1 py-0.5">
                  <input
                    type="number"
                    value={inputWidth}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (!isNaN(val)) handleApplyDimensions(val, inputHeight);
                    }}
                    className="w-10 text-center font-mono font-bold text-slate-900 text-[11px] focus:outline-none"
                  />
                  <span className="text-[9px] text-slate-400 font-mono">px</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleApplyDimensions(inputWidth + 10, inputHeight)}
                  className="p-1 bg-white hover:bg-slate-200 text-slate-700 border border-slate-300 rounded shadow-xs cursor-pointer active:scale-95"
                  title="+10px"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Height Controls */}
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-200 flex flex-col gap-1 items-center justify-between">
              <div className="flex items-center justify-between w-full px-0.5">
                <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">Height</span>
                <button
                  type="button"
                  onClick={() => handleResetDimension("height")}
                  className="text-[9px] text-indigo-600 hover:underline cursor-pointer"
                  title="Reset to Auto Height"
                >
                  Auto
                </button>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleApplyDimensions(inputWidth, Math.max(15, inputHeight - 5))}
                  className="p-1 bg-white hover:bg-slate-200 text-slate-700 border border-slate-300 rounded shadow-xs cursor-pointer active:scale-95"
                  title="-5px"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <div className="flex items-center bg-white border border-slate-300 rounded px-1 py-0.5">
                  <input
                    type="number"
                    value={inputHeight}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (!isNaN(val)) handleApplyDimensions(inputWidth, val);
                    }}
                    className="w-10 text-center font-mono font-bold text-slate-900 text-[11px] focus:outline-none"
                  />
                  <span className="text-[9px] text-slate-400 font-mono">px</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleApplyDimensions(inputWidth, inputHeight + 5)}
                  className="p-1 bg-white hover:bg-slate-200 text-slate-700 border border-slate-300 rounded shadow-xs cursor-pointer active:scale-95"
                  title="+5px"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Font Size Controls */}
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-200 flex flex-col gap-1 items-center justify-between">
              <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">Font</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleApplyFontSize(Math.max(9, inputFontSize - 1))}
                  className="p-1 bg-white hover:bg-slate-200 text-slate-700 border border-slate-300 rounded shadow-xs cursor-pointer active:scale-95"
                  title="-1px"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <div className="flex items-center bg-white border border-slate-300 rounded px-1 py-0.5">
                  <input
                    type="number"
                    value={inputFontSize}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (!isNaN(val)) handleApplyFontSize(val);
                    }}
                    className="w-9 text-center font-mono font-bold text-indigo-700 text-[11px] focus:outline-none"
                  />
                  <span className="text-[9px] text-slate-400 font-mono">px</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleApplyFontSize(inputFontSize + 1)}
                  className="p-1 bg-white hover:bg-slate-200 text-slate-700 border border-slate-300 rounded shadow-xs cursor-pointer active:scale-95"
                  title="+1px"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          {/* Action Row: Delete & Add Child */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl font-semibold transition cursor-pointer"
            >
              <Plus className="w-4 h-4 text-emerald-600" />
              <span>Add Button Here</span>
            </button>

            <button
              type="button"
              onClick={handleDeleteElement}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-sm transition cursor-pointer"
              title="Delete or Hide this element"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete / Hide Element</span>
            </button>
          </div>
        </div>
      )}

      {/* Add New Button Modal */}
      {showAddModal && (
        <div
          data-magic-editor-ui="true"
          className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in"
        >
          <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl p-4 text-white shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="font-bold text-sm text-indigo-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Create New Button</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="text-[11px] text-slate-400 font-medium block mb-1">Button Title / Text</label>
              <input
                type="text"
                value={newBtnLabel}
                onChange={(e) => setNewBtnLabel(e.target.value)}
                placeholder="e.g. Export Summary, Verify, New Action"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 font-medium block mb-1">Button Color Theme</label>
              <div className="flex gap-2">
                {(["blue", "emerald", "amber", "rose", "purple"] as const).map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewBtnColor(color)}
                    className={`w-7 h-7 rounded-full capitalize text-[10px] font-bold border-2 transition ${
                      newBtnColor === color ? "border-white scale-110" : "border-transparent opacity-70"
                    } ${
                      color === "blue"
                        ? "bg-blue-600"
                        : color === "emerald"
                        ? "bg-emerald-600"
                        : color === "amber"
                        ? "bg-amber-600"
                        : color === "rose"
                        ? "bg-rose-600"
                        : "bg-purple-600"
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-3 py-1 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateButton}
                disabled={!newBtnLabel.trim()}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-lg font-bold text-xs shadow-md transition"
              >
                Add Button
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modifications Drawer / Modal (Shows List of all Front-End Changes, Undo & Antigravity Sync) */}
      {showModificationsList && (
        <div
          data-magic-editor-ui="true"
          className="fixed top-14 right-4 z-[9999] w-[420px] max-h-[85vh] bg-white border-2 border-indigo-600 rounded-2xl shadow-2xl flex flex-col text-slate-900 animate-in slide-in-from-right-4 select-none overflow-hidden"
        >
          {/* Header */}
          <div className="p-3 bg-indigo-50 border-b border-indigo-200 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Magic Modifications List</h4>
                  <p className="text-[11px] text-indigo-700 font-semibold">
                    {displayedModifications.length} change(s) shown ({modifications.length} total)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModificationsList(false)}
                className="p-1 hover:bg-indigo-100 text-slate-500 hover:text-slate-900 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scope Filter Tabs */}
            <div className="flex items-center gap-1 bg-indigo-100/70 p-1 rounded-xl text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setListScope("ALL_PAGES")}
                className={`flex-1 py-1 rounded-lg text-center transition cursor-pointer ${
                  listScope === "ALL_PAGES"
                    ? "bg-white text-indigo-900 shadow-xs"
                    : "text-indigo-700 hover:text-indigo-900"
                }`}
              >
                All Pages ({modifications.length})
              </button>
              <button
                type="button"
                onClick={() => setListScope("THIS_PAGE")}
                className={`flex-1 py-1 rounded-lg text-center transition cursor-pointer ${
                  listScope === "THIS_PAGE"
                    ? "bg-white text-indigo-900 shadow-xs"
                    : "text-indigo-700 hover:text-indigo-900"
                }`}
              >
                This Page ({modifications.filter((m) => m.url === "*" || m.url === pathname || pathname.startsWith(m.url) || m.url.startsWith(pathname)).length})
              </button>
            </div>
          </div>

          {/* List Content */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 text-xs bg-slate-50/50">
            {displayedModifications.length === 0 ? (
              <div className="py-12 text-center text-slate-500 space-y-2">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto text-indigo-600">
                  <Wand2 className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-slate-800">No UI modifications yet.</p>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Turn on Magic Editor and click on any text, button or header to edit, move or resize!
                </p>
              </div>
            ) : (
              displayedModifications.map((mod) => (
                <div
                  key={mod.id}
                  className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-indigo-400 space-y-2 transition"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md font-mono uppercase tracking-wider ${
                        mod.actionType === "RENAME_TEXT"
                          ? "bg-blue-100 text-blue-800 border border-blue-300"
                          : mod.actionType === "DELETE_ELEMENT"
                          ? "bg-rose-100 text-rose-800 border border-rose-300"
                          : mod.actionType === "RESIZE"
                          ? "bg-amber-100 text-amber-900 border border-amber-300"
                          : mod.actionType === "MOVE_POSITION"
                          ? "bg-purple-100 text-purple-900 border border-purple-300"
                          : "bg-emerald-100 text-emerald-800 border border-emerald-300"
                      }`}
                    >
                      {mod.actionType.replace("_", " ")}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleUndoModification(mod)}
                      className="flex items-center gap-1 px-2 py-1 text-slate-600 hover:text-rose-700 hover:bg-rose-50 border border-slate-200 hover:border-rose-300 rounded-lg font-semibold transition"
                      title="Undo / Delete this change"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Undo</span>
                    </button>
                  </div>

                  <div className="text-xs text-slate-800 leading-relaxed font-medium">
                    {mod.actionType === "RENAME_TEXT" && (
                      <p>
                        Renamed <span className="line-through text-slate-400">&quot;{mod.originalText}&quot;</span> →{" "}
                        <span className="font-bold text-indigo-700">&quot;{mod.newText}&quot;</span>
                      </p>
                    )}
                    {mod.actionType === "DELETE_ELEMENT" && (
                      <p>
                        Deleted / Hidden &lt;{mod.tagName}&gt;{" "}
                        <span className="font-bold text-rose-700">&quot;{mod.originalText}&quot;</span>
                      </p>
                    )}
                    {mod.actionType === "RESIZE" && (
                      <p>
                        Resized &quot;{mod.originalText}&quot; (W: {mod.width || "auto"}, H: {mod.height || "auto"}, Font:{" "}
                        {mod.fontSize || "auto"})
                      </p>
                    )}
                    {mod.actionType === "MOVE_POSITION" && (
                      <p>
                        Moved &quot;{mod.originalText || mod.tagName}&quot; ({mod.styles?.transform || "shifted"})
                      </p>
                    )}
                    {mod.actionType === "ADD_BUTTON" && (
                      <p>
                        Added new button <span className="font-bold text-emerald-700">&quot;{mod.newText}&quot;</span>
                      </p>
                    )}
                  </div>

                  <div className="text-[10px] text-slate-500 font-mono truncate pt-1 border-t border-slate-100">
                    Page: {mod.url} • Tag: &lt;{mod.tagName}&gt;
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer with Actions (Copy for Antigravity & Reset) */}
          <div className="p-3.5 bg-slate-100 border-t border-slate-200 flex flex-col gap-2.5">
            <button
              type="button"
              onClick={handleCopyForAntigravity}
              disabled={modifications.length === 0}
              className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-sm ${
                copiedSuccess
                  ? "bg-emerald-600 text-white"
                  : "bg-indigo-600 hover:bg-indigo-700 text-white"
              } disabled:opacity-40`}
              title="Copy all changes to give to Antigravity for permanent source code update"
            >
              {copiedSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Copied for Antigravity!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Give Changes to Antigravity</span>
                </>
              )}
            </button>

            <div className="flex items-center justify-between text-xs font-semibold text-slate-600 pt-0.5">
              <button
                type="button"
                onClick={handleResetCurrentPage}
                className="hover:text-rose-600 hover:underline transition"
              >
                Reset this Page
              </button>
              <button
                type="button"
                onClick={fetchModifications}
                className="hover:text-indigo-600 hover:underline transition"
              >
                Refresh List
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Instructions Banner when Editor is Active */}
      {isActive && (
        <div
          data-magic-editor-ui="true"
          className="fixed top-2 left-1/2 -translate-x-1/2 z-[9999] bg-indigo-600 text-white px-4 py-1.5 rounded-full shadow-2xl text-xs font-semibold flex items-center gap-2 select-none border border-indigo-400 animate-in fade-in slide-in-from-top-2"
        >
          <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
          <span>
            {selectedEl
              ? `Inspecting <${selectedMeta?.tagName}>: Use floating toolbar below to edit text, resize, change font or delete!`
              : "Magic Editor Active: Click on any button, text, header, or table column to edit or resize!"}
          </span>
          <button
            type="button"
            onClick={() => {
              if (selectedEl) selectedEl.style.outline = "";
              setSelectedEl(null);
              setSelectedMeta(null);
              setIsActive(false);
            }}
            className="ml-2 hover:bg-indigo-700 p-0.5 rounded"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </>
  );
}
