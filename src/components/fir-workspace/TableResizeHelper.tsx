"use client";

import React, { useState, useCallback } from "react";
import { MoveHorizontal, MoveVertical, RotateCcw } from "lucide-react";

export interface UseTableResizeOptions {
  initialColWidths?: Record<number, number>;
  initialRowHeights?: Record<number, number>;
  minColWidth?: number;
  minRowHeight?: number;
}

export function useTableResize(options: UseTableResizeOptions = {}) {
  const {
    initialColWidths = {},
    initialRowHeights = {},
    minColWidth = 35,
    minRowHeight = 26,
  } = options;

  const [colWidths, setColWidths] = useState<Record<number, number>>(initialColWidths);
  const [rowHeights, setRowHeights] = useState<Record<number, number>>(initialRowHeights);
  const [isResizing, setIsResizing] = useState(false);

  const startColResize = useCallback(
    (colIndex: number, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsResizing(true);

      const startX = e.clientX;
      // Find the cell or column width
      const cellEl = e.currentTarget.parentElement;
      const initialWidth = colWidths[colIndex] || (cellEl ? cellEl.getBoundingClientRect().width : 120);

      const onMouseMove = (moveEvt: MouseEvent) => {
        const delta = moveEvt.clientX - startX;
        const nextWidth = Math.max(minColWidth, Math.round(initialWidth + delta));
        setColWidths((prev) => ({ ...prev, [colIndex]: nextWidth }));
      };

      const onMouseUp = () => {
        setIsResizing(false);
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
      };

      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    },
    [colWidths, minColWidth]
  );

  const startRowResize = useCallback(
    (rowIndex: number, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsResizing(true);

      const startY = e.clientY;
      const rowEl = e.currentTarget.closest("tr");
      const initialHeight = rowHeights[rowIndex] || (rowEl ? rowEl.getBoundingClientRect().height : 36);

      const onMouseMove = (moveEvt: MouseEvent) => {
        const delta = moveEvt.clientY - startY;
        const nextHeight = Math.max(minRowHeight, Math.round(initialHeight + delta));
        setRowHeights((prev) => ({ ...prev, [rowIndex]: nextHeight }));
      };

      const onMouseUp = () => {
        setIsResizing(false);
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
      };

      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    },
    [rowHeights, minRowHeight]
  );

  const resetSizes = useCallback(() => {
    setColWidths(initialColWidths);
    setRowHeights(initialRowHeights);
  }, [initialColWidths, initialRowHeights]);

  const hasCustomSizes =
    Object.keys(colWidths).length > 0 || Object.keys(rowHeights).length > 0;

  return {
    colWidths,
    rowHeights,
    setColWidths,
    setRowHeights,
    startColResize,
    startRowResize,
    resetSizes,
    hasCustomSizes,
    isResizing,
  };
}

export function TableColResizer({
  onResize,
  title = "कॉलम चौड़ाई बदलें (Drag to resize column width)",
}: {
  onResize: (e: React.MouseEvent) => void;
  title?: string;
}) {
  return (
    <div
      onMouseDown={onResize}
      title={title}
      className="no-print absolute top-0 right-0 bottom-0 w-3 -mr-1.5 cursor-col-resize z-20 group flex items-center justify-center select-none"
    >
      <div className="w-[3px] h-full bg-transparent group-hover:bg-blue-600 active:bg-blue-700 transition-colors rounded" />
    </div>
  );
}

export function TableRowResizer({
  onResize,
  title = "पंक्ति लंबाई/ऊंचाई बदलें (Drag to resize row height)",
}: {
  onResize: (e: React.MouseEvent) => void;
  title?: string;
}) {
  return (
    <div
      onMouseDown={onResize}
      title={title}
      className="no-print absolute bottom-0 left-0 right-0 h-3 -mb-1.5 cursor-row-resize z-20 group flex items-center justify-center select-none"
    >
      <div className="h-[3px] w-full bg-transparent group-hover:bg-blue-600 active:bg-blue-700 transition-colors rounded" />
    </div>
  );
}

export function TableResizeToolbar({
  hasCustomSizes,
  onReset,
  label = "कॉलम व पंक्ति का आकार (चौड़ाई / लंबाई) बॉर्डर खींचकर बदल सकते हैं",
}: {
  hasCustomSizes: boolean;
  onReset: () => void;
  label?: string;
}) {
  return (
    <div className="no-print flex items-center justify-between text-[11px] text-slate-500 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-2 py-1 rounded mb-1.5 transition-colors">
      <div className="flex items-center gap-1.5">
        <span className="flex items-center text-blue-600 font-semibold gap-1">
          <MoveHorizontal className="w-3.5 h-3.5" />
          <MoveVertical className="w-3.5 h-3.5" />
        </span>
        <span className="text-slate-600">{label}</span>
      </div>
      {hasCustomSizes && (
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1 text-[10px] text-blue-700 hover:text-blue-900 bg-white hover:bg-blue-50 border border-blue-200 px-2 py-0.5 rounded shadow-xs font-medium cursor-pointer transition-colors"
          title="आकार रीसेट करें (Reset custom width/height)"
        >
          <RotateCcw className="w-3 h-3" />
          <span>आकार रीसेट (Reset)</span>
        </button>
      )}
    </div>
  );
}
