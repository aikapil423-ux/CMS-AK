"use client";

import React, { useState } from "react";
import { Send, X, AlertCircle, FileText, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ComplaintItem } from "@/types";

export type EOCategoryOption = "NCR" | "FIR_RECOMMEND" | "CLOSURE";

interface EoSendingToShoModalProps {
  complaint: ComplaintItem | null;
  selectedReport?: any | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    recommendedCategory: EOCategoryOption;
    remarks: string;
  }) => Promise<void> | void;
  isLoading?: boolean;
}

export function EoSendingToShoModal({
  complaint,
  selectedReport,
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}: EoSendingToShoModalProps) {
  // Preselect based on selected report, complaint recommendation, or default to unselected
  const [selectedCategory, setSelectedCategory] = useState<EOCategoryOption | "">(() => {
    if (selectedReport) {
      if (selectedReport.isFirRecommended || selectedReport.recommendationType === "FIR" || selectedReport.recommendationType === "FIR_RECOMMENDED") {
        return "FIR_RECOMMEND";
      }
      if (selectedReport.recommendationType === "NCR") {
        return "NCR";
      }
      if (
        selectedReport.recommendationType === "GAMINI" ||
        selectedReport.recommendationType === "DIWANI" ||
        selectedReport.recommendationType === "RAZINAMA" ||
        selectedReport.recommendationType === "JAMINI_LAND_DISPUTE" ||
        selectedReport.recommendationType === "DIWANI_CIVIL_MONEY" ||
        selectedReport.recommendationType === "RAJINAMA_COMPROMISE"
      ) {
        return "CLOSURE";
      }
    }
    if (!complaint) return "";
    if (complaint.eoOutcome === "FIR Recommend" || complaint.isRecommendedForFir) {
      return "FIR_RECOMMEND";
    }
    if (complaint.eoRecommendedCategory) {
      const c = String(complaint.eoRecommendedCategory).toUpperCase();
      if (c === "NCR") return "NCR";
      if (c === "CLOSURE" || c === "CLOSE") return "CLOSURE";
      if (c.includes("FIR")) return "FIR_RECOMMEND";
    }
    return "";
  });

  const [remarks, setRemarks] = useState("");

  if (!isOpen || !complaint) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory) return;
    onSubmit({
      recommendedCategory: selectedCategory,
      remarks: remarks.trim(),
    });
  };

  const CATEGORY_CHOICES: {
    value: EOCategoryOption;
    label: string;
    subtext: string;
    badgeClass: string;
  }[] = [
    {
      value: "NCR",
      label: "1. NCR",
      subtext: "Non-Cognizable Offence (असंज्ञेय अपराध) — NCR दर्ज करने की सिफारिश",
      badgeClass: "bg-blue-50 text-blue-800 border-blue-200",
    },
    {
      value: "FIR_RECOMMEND",
      label: "2. FIR Recommend",
      subtext: "Cognizable Offence (संज्ञेय अपराध) — नियमित FIR दर्ज करने की सिफारिश",
      badgeClass: "bg-red-50 text-red-800 border-red-200",
    },
    {
      value: "CLOSURE",
      label: "3. Closure",
      subtext: "Matter Settled / Civil Nature / Unsubstantiated — मामला बंद / निस्तारण की सिफारिश",
      badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 bg-[#0b192c] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Send className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-bold text-sm">Send Complaint Report to SHO</h3>
              <p className="text-[11px] text-slate-300">
                Select your recommended category before dispatching
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs overflow-y-auto">
          {/* Complaint Details Card */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                #{complaint.complaintNumber}
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                Stage: {complaint.workflowState || "Enquiry Complete"}
              </span>
            </div>
            <p className="text-slate-800">
              <strong>Complainant:</strong> {complaint.complainantName}
            </p>
            <p className="text-slate-700 truncate">
              <strong>Subject:</strong> {complaint.subject || complaint.complaintSubject || "Enquiry Report"}
            </p>
            {selectedReport && (
              <div className="pt-1 border-t border-slate-200 mt-1 flex items-center justify-between text-[11px]">
                <span className="text-slate-500 font-medium">Selected Report:</span>
                <span className="font-bold text-slate-900 truncate max-w-[240px]">
                  {selectedReport.title || "Official Enquiry Report"}
                </span>
              </div>
            )}
          </div>

          {/* Mandatory Category Selection */}
          <div className="space-y-2">
            <label className="block font-bold text-slate-800 text-xs flex items-center justify-between">
              <span>Select Recommended Category (अनिवार्य):</span>
              <span className="text-[11px] font-normal text-rose-600 font-semibold">
                * Required to Send
              </span>
            </label>

            <div className="space-y-2">
              {CATEGORY_CHOICES.map((choice) => {
                const isSelected = selectedCategory === choice.value;
                return (
                  <label
                    key={choice.value}
                    className={`flex items-start gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer select-none ${
                      isSelected
                        ? "border-blue-600 bg-blue-50/70 shadow-2xs"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="eoRecommendationCategory"
                      value={choice.value}
                      checked={isSelected}
                      onChange={() => setSelectedCategory(choice.value)}
                      className="mt-0.5 w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                    />
                    <div className="flex-1 space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-xs">
                          {choice.label}
                        </span>
                        {isSelected && (
                          <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.2 rounded-full">
                            Selected
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-600 leading-normal">
                        {choice.subtext}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Explanation note */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px] leading-relaxed flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              <strong>Note:</strong> Your selected category will be submitted as the EO Recommendation to the Station House Officer (SHO). It will <strong>NOT</strong> become the final category until the SHO reviews and approves it.
            </span>
          </div>

          {/* Remarks */}
          <div className="space-y-1">
            <label className="block font-semibold text-slate-700">
              Remarks / Submission Note for SHO (Optional)
            </label>
            <textarea
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Enquiry completed as per facts. Forwarded for SHO decision..."
              className="w-full p-2.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#0b192c] focus:outline-none"
            />
          </div>

          {/* Modal Footer */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isLoading}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={!selectedCategory || isLoading}
              className={`text-xs font-bold gap-1.5 shadow-xs cursor-pointer ${
                selectedCategory
                  ? "bg-[#0b192c] hover:bg-slate-800 text-white"
                  : "bg-slate-300 text-slate-500 cursor-not-allowed"
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isLoading ? "Sending..." : "Send to SHO"}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
