"use client";

import React from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ConfirmActionDialogProps {
  isOpen: boolean;
  title: string;
  description?: string;
  message?: string;
  confirmLabel?: string;
  confirmText?: string;
  cancelLabel?: string;
  cancelText?: string;
  variant?: "primary" | "danger" | "warning" | "default" | "destructive";
  confirmVariant?: "primary" | "danger" | "outline";
  iconType?: "warning" | "danger" | "info";
  onConfirm: () => void;
  onCancel?: () => void;
  onClose?: () => void;
}

export const ConfirmActionDialog: React.FC<ConfirmActionDialogProps> = ({
  isOpen,
  title,
  description,
  message,
  confirmLabel,
  confirmText,
  cancelLabel,
  cancelText = "Cancel",
  variant = "primary",
  confirmVariant,
  iconType,
  onConfirm,
  onCancel,
  onClose,
}) => {
  if (!isOpen) return null;

  const displayMessage = description || message || "";
  const displayConfirm = confirmLabel || confirmText || "Confirm";
  const displayCancel = cancelLabel || cancelText || "Cancel";
  const handleDismiss = onClose || onCancel || (() => {});

  const isDestructive = variant === "danger" || variant === "destructive" || confirmVariant === "danger";
  const effectiveIconType = iconType || (isDestructive ? "danger" : variant === "warning" ? "warning" : "info");

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in-50">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden text-slate-800 animate-in zoom-in-95">
        <div className="p-5 flex items-start gap-3.5">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              effectiveIconType === "danger"
                ? "bg-red-100 text-red-600"
                : effectiveIconType === "warning"
                ? "bg-amber-100 text-amber-700"
                : "bg-blue-100 text-blue-600"
            }`}
          >
            {effectiveIconType === "danger" ? (
              <AlertCircle className="w-5 h-5" />
            ) : effectiveIconType === "warning" ? (
              <AlertTriangle className="w-5 h-5" />
            ) : (
              <CheckCircle2 className="w-5 h-5" />
            )}
          </div>
          <div className="space-y-1.5 flex-1">
            <h3 className="font-bold text-sm text-slate-900">{title}</h3>
            <p className="text-xs text-slate-600 leading-relaxed">{displayMessage}</p>
          </div>
        </div>

        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={handleDismiss} className="text-xs">
            {displayCancel}
          </Button>
          <Button
            type="button"
            variant={isDestructive ? "danger" : "primary"}
            size="sm"
            onClick={onConfirm}
            className={`text-xs font-bold ${
              isDestructive
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-[#0b192c] hover:bg-slate-800 text-white"
            }`}
          >
            {displayConfirm}
          </Button>
        </div>
      </div>
    </div>
  );
};
