"use client";

import React, { useState } from "react";
import {
  Lock,
  AlertTriangle,
  Shield,
  CheckCircle2,
  X,
  User,
  Clock,
  FileCheck2,
} from "lucide-react";
import { GeneralDiaryRecord, GDOfficerParticulars } from "@/types/generalDiary";
import { Button } from "@/components/ui/button";

interface GDVerificationModalProps {
  record: GeneralDiaryRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmLock: (remarks: string) => Promise<void>;
  verifier: GDOfficerParticulars;
}

export function GDVerificationModal({
  record,
  isOpen,
  onClose,
  onConfirmLock,
  verifier,
}: GDVerificationModalProps) {
  const [remarks, setRemarks] = useState("Facts verified with field staff / IO / sentry roster.");
  const [isLocking, setIsLocking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !record) return null;

  const handleConfirm = async () => {
    setIsLocking(true);
    setError(null);
    try {
      await onConfirmLock(remarks);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to verify and lock GD record.");
    } finally {
      setIsLocking(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-xs overflow-y-auto animate-in fade-in-50">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto">
        {/* Header */}
        <div className="p-4 bg-[#0b192c] text-white flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">
                Statutory Human Verification &amp; Lock
              </h3>
              <p className="text-[11px] text-slate-300">
                PPR Rule 22.48 • Final Immutable Entry
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLocking}
            className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Legal Warning Notice */}
          <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl space-y-1.5 text-amber-950">
            <div className="flex items-center gap-2 font-bold text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
              <span>वैधानिक चेतावनी (Legal Notice - PPR 22.48):</span>
            </div>
            <p className="text-[11px] text-amber-900 leading-relaxed">
              एक बार <strong>&ldquo;Verify &amp; Lock&rdquo;</strong> करने के बाद यह प्रविष्टि स्थाई रूप से रोजनामचा आम (Register No. II) में दर्ज हो जाएगी। इसका रपट नंबर, समय, लेखक एवं मूल विवरण कभी भी <strong>संशोधित या डिलीट (Delete/Edit) नहीं किया जा सकेगा</strong>।
            </p>
          </div>

          {/* Record Summary */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-slate-800">
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase block">विषय (Subject):</span>
              <p className="font-bold text-slate-950 text-sm leading-snug">{record.subject}</p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200">
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase block">इंद्राज का प्रकार:</span>
                <span className="font-semibold text-slate-900">{record.typeDisplayHi}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase block">कार्यवाही समय:</span>
                <span className="font-mono font-bold text-slate-900">{record.activityDateTime}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase block">मुलाज़िम मुताल्लिक:</span>
                <span className="font-semibold text-slate-900">{record.entryForOfficer.name} ({record.entryForOfficer.rank})</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase block">तस्दीककर्ता अधिकारी:</span>
                <span className="font-semibold text-slate-900">{verifier.name} ({verifier.rank})</span>
              </div>
            </div>
          </div>

          {/* Verifier Remarks */}
          <div className="space-y-1">
            <label className="block font-bold text-slate-700">
              तस्दीक टिप्पणी / Verification Remarks (Mandatory Audit Note):
            </label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Facts verified with field staff / IO diary"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0b192c]"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isLocking}
            className="text-xs"
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleConfirm}
            disabled={isLocking || !remarks.trim()}
            className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold gap-1.5 cursor-pointer shadow-xs"
          >
            {isLocking ? (
              <span>Locking Entry...</span>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5 text-amber-300" />
                <span>Confirm &amp; Permanently Lock GD</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
