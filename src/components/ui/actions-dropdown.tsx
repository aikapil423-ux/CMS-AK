"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";

export function ActionsDropdown({ children, label = "Report actions" }: { children: ReactNode; label?: string }) {
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (!position) return;
    const close = () => setPosition(null);
    const outside = (event: PointerEvent) => {
      if (!trigger.current?.contains(event.target as Node) && !panel.current?.contains(event.target as Node)) close();
    };
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") { close(); trigger.current?.focus(); }
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", key);
    window.addEventListener("resize", close);
    window.addEventListener("scroll", close, true);
    panel.current?.querySelector<HTMLButtonElement>("button")?.focus();
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", key);
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [position]);

  return <>
    <button ref={trigger} type="button" aria-expanded={!!position} aria-label={label}
      className="inline-flex items-center gap-1.5 border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-50"
      onClick={() => {
        if (position) { setPosition(null); return; }
        const rect = trigger.current!.getBoundingClientRect();
        setPosition({ top: Math.max(8, Math.min(rect.bottom + 4, window.innerHeight - 230)), left: Math.max(8, Math.min(rect.right - 180, window.innerWidth - 188)) });
      }}>
      Actions <ChevronDown className="h-3.5 w-3.5" />
    </button>
    {position && createPortal(<div ref={panel} role="group" aria-label={label}
      className="cms-report-actions fixed z-[160] flex w-[180px] max-h-[220px] overflow-y-auto flex-col gap-1 border border-slate-300 bg-white p-1.5 shadow-lg"
      style={position}
      onClick={event => { if ((event.target as Element).closest("button, a")) setPosition(null); }}>
      {children}
    </div>, document.body)}
  </>;
}
