import React from "react";
import { AlertCircle, CheckCircle2, FileQuestion, RefreshCw } from "lucide-react";
import { Button } from "./button";

export function EmptyState({
  title = "No records found",
  description = "No entries match your selected criteria or search term.",
  actionLabel,
  onAction,
}: {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-white rounded-xl border border-dashed border-slate-300 my-4">
      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 mb-3">
        <FileQuestion className="w-6 h-6" />
      </div>
      <h4 className="text-base font-semibold text-slate-800">{title}</h4>
      <p className="text-sm text-slate-500 max-w-sm mt-1">{description}</p>
      {actionLabel && onAction && (
        <Button variant="outline" size="sm" onClick={onAction} className="mt-4">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

export function LoadingSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse flex space-x-4 p-4 bg-white rounded-lg border border-slate-200">
          <div className="rounded-full bg-slate-200 h-10 w-10"></div>
          <div className="flex-1 space-y-2 py-1">
            <div className="h-4 bg-slate-200 rounded w-3/4"></div>
            <div className="space-y-1">
              <div className="h-3 bg-slate-200 rounded"></div>
              <div className="h-3 bg-slate-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ErrorBanner({
  title = "An error occurred",
  message = "Failed to load police records. Please retry or contact Station MHC.",
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-900 flex items-start gap-3 my-4">
      <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
      <div className="flex-1">
        <h5 className="font-semibold text-sm">{title}</h5>
        <p className="text-xs text-red-700 mt-0.5">{message}</p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="border-red-300 text-red-800 hover:bg-red-100">
          <RefreshCw className="w-3.5 h-3.5 mr-1" /> Retry
        </Button>
      )}
    </div>
  );
}

export function SuccessFeedback({
  title = "Success",
  message,
  primaryActionLabel,
  onPrimaryAction,
  secondaryActionLabel,
  onSecondaryAction,
}: {
  title?: string;
  message: string;
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
}) {
  return (
    <div className="p-6 text-center bg-white rounded-xl border border-emerald-200 shadow-sm max-w-lg mx-auto">
      <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
        <CheckCircle2 className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-bold text-slate-900">{title}</h3>
      <p className="text-sm text-slate-600 mt-1 mb-6">{message}</p>
      <div className="flex flex-col sm:flex-row gap-2 justify-center">
        {secondaryActionLabel && onSecondaryAction && (
          <Button variant="outline" onClick={onSecondaryAction}>
            {secondaryActionLabel}
          </Button>
        )}
        {primaryActionLabel && onPrimaryAction && (
          <Button variant="primary" onClick={onPrimaryAction}>
            {primaryActionLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
