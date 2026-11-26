"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";

export default function SegmentErrorBoundary({
  error,
  retry,
  reset,
}: {
  error: Error & { digest?: string };
  retry?: () => void;
  reset?: () => void;
}) {
  useEffect(() => {
    console.error("Segment boundary caught error:", error);
  }, [error]);

  const handleRetry = () => {
    if (typeof retry === "function") retry();
    else if (typeof reset === "function") reset();
    else if (typeof window !== "undefined") window.location.reload();
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4 sm:p-8">
      <div className="max-w-lg w-full bg-white dark:bg-[#101e38] border border-red-200 dark:border-red-900 rounded-xl shadow-sm p-6 sm:p-8 text-center space-y-4">
        <div className="w-12 h-12 mx-auto rounded-full bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 flex items-center justify-center text-red-600 dark:text-red-300">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div className="space-y-1.5">
          <p className="text-xs font-mono font-bold uppercase tracking-widest text-red-600 dark:text-red-400">
            Haryana Police CMS • Runtime Recovery
          </p>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">
            Unable to Load This View
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
            An unexpected display or network error occurred. No official record has been discarded.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleRetry}
            className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2 bg-[#203c88] hover:bg-[#172e70] text-white text-xs sm:text-sm font-semibold cursor-pointer transition-colors"
          >
            <RotateCcw className="w-4 h-4 shrink-0" />
            <span>Try Again</span>
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2 bg-slate-100 dark:bg-[#172747] hover:bg-slate-200 dark:hover:bg-[#233760] text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-[#273b63] text-xs sm:text-sm font-semibold transition-colors"
          >
            <Home className="w-4 h-4 shrink-0" />
            <span>Modules Portal</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
