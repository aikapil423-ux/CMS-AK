"use client";

import React, { useState, useEffect } from "react";
import { X, Search, Plus, Trash2, Check, Scale, BookOpen, AlertCircle } from "lucide-react";
import { FIRActSectionEntry } from "@/types";
import { UnifiedActOption, getUnifiedActsCatalog } from "@/lib/cctnsActsData";
import { ActsService } from "@/services/actsService";
import { Button } from "@/components/ui/button";

export interface ActsSectionsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentList?: FIRActSectionEntry[];
  initialActs?: FIRActSectionEntry[];
  onSave: (updatedList: FIRActSectionEntry[]) => void;
  unifiedActs?: UnifiedActOption[];
}

export const ActsSectionsDialog: React.FC<ActsSectionsDialogProps> = ({
  isOpen,
  onClose,
  currentList,
  initialActs,
  onSave,
  unifiedActs: propUnifiedActs,
}) => {
  const unifiedActs = propUnifiedActs || getUnifiedActsCatalog(ActsService.getAllActs());
  const effectiveInitialList = currentList || initialActs || [];

  // Staging table list inside the dialog
  const [stagedEntries, setStagedEntries] = useState<FIRActSectionEntry[]>([]);

  // Act search and selection
  const [actSearchQuery, setActSearchQuery] = useState("");
  const [selectedActId, setSelectedActId] = useState<string>("act_bns_2023");

  // Section search and multi-selection
  const [sectionSearchQuery, setSectionSearchQuery] = useState("");
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync staging list with parent's list on dialog open
  useEffect(() => {
    if (isOpen) {
      setStagedEntries([...effectiveInitialList]);
      setSelectedSections([]);
      setSectionSearchQuery("");
      setActSearchQuery("");
      setErrorMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Filter available acts
  const filteredActs = unifiedActs.filter((a) => {
    if (!actSearchQuery.trim()) return true;
    const q = actSearchQuery.toLowerCase().trim();
    return (
      a.name.toLowerCase().includes(q) ||
      a.title.toLowerCase().includes(q) ||
      a.category.toLowerCase().includes(q)
    );
  });

  const activeActObj = unifiedActs.find((a) => a.id === selectedActId) || unifiedActs[0];
  const availableSections = activeActObj?.sections || [];

  // Filter sections of current act
  const filteredSections = availableSections.filter((s) => {
    if (!sectionSearchQuery.trim()) return true;
    const q = sectionSearchQuery.toLowerCase().trim();
    return (
      s.sectionNumber.toLowerCase().includes(q) ||
      (s.title && s.title.toLowerCase().includes(q))
    );
  });

  const handleToggleSection = (secNum: string) => {
    setSelectedSections((prev) =>
      prev.includes(secNum) ? prev.filter((s) => s !== secNum) : [...prev, secNum]
    );
  };

  const handleRemoveSelectedSection = (secNum: string) => {
    setSelectedSections((prev) => prev.filter((s) => s !== secNum));
  };

  const handleAddCustomSection = (rawInput: string) => {
    const trimmed = rawInput.trim().replace(/^Sec(tion)?\.?\s*/i, "");
    if (!trimmed) return;
    if (!selectedSections.includes(trimmed)) {
      setSelectedSections((prev) => [...prev, trimmed]);
    }
    setSectionSearchQuery("");
  };

  // Add selection into the dialog's staging table
  const handleAddSelectionToStaging = () => {
    setErrorMessage(null);
    const finalSections = [...selectedSections];
    if (sectionSearchQuery.trim()) {
      const typed = sectionSearchQuery.trim().replace(/^Sec(tion)?\.?\s*/i, "");
      if (typed && !finalSections.includes(typed)) {
        finalSections.push(typed);
      }
    }

    if (finalSections.length === 0) {
      setErrorMessage("Please select or add at least one section number.");
      return;
    }

    const actName = activeActObj?.name || "Bharatiya Nyaya Sanhita, 2023 (BNS)";

    // Prevent duplicate Act entry - if exists, merge sections instead of creating duplicate row
    const existingIndex = stagedEntries.findIndex(
      (e) => e.act.trim().toLowerCase() === actName.trim().toLowerCase()
    );

    if (existingIndex >= 0) {
      // Merge unique sections
      const existingSecs = stagedEntries[existingIndex].sections
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const merged = Array.from(new Set([...existingSecs, ...finalSections]));
      const updated = [...stagedEntries];
      updated[existingIndex] = {
        ...updated[existingIndex],
        sections: merged.join(", "),
      };
      setStagedEntries(updated);
    } else {
      const newEntry: FIRActSectionEntry = {
        id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        srNo: stagedEntries.length + 1,
        act: actName,
        sections: finalSections.join(", "),
      };
      setStagedEntries([...stagedEntries, newEntry]);
    }

    // Reset section picker
    setSelectedSections([]);
    setSectionSearchQuery("");
  };

  const handleDeleteStagedEntry = (idx: number) => {
    const updated = stagedEntries.filter((_, i) => i !== idx).map((item, i) => ({
      ...item,
      srNo: i + 1,
    }));
    setStagedEntries(updated);
  };

  const handleSaveAndClose = () => {
    onSave(stagedEntries);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in-50">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden text-slate-800">
        {/* Header */}
        <div className="px-5 py-3.5 bg-[#0b192c] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-600/30 border border-red-400/40 flex items-center justify-center text-red-200">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight">Add Acts and Sections</h2>
              <p className="text-[11px] text-slate-300">
                Select applicable statutory bare acts, choose section/sub-section numbers, and add to FIR
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4 text-xs">
          {/* Act Search & Selection Box */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              <div className="sm:col-span-5 space-y-1">
                <label className="font-bold text-slate-700 block">Search Acts by Name / Keyword</label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="e.g. Excise, NDPS, Arms, BNS..."
                    value={actSearchQuery}
                    onChange={(e) => setActSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs focus:ring-2 focus:ring-[#0b192c]"
                  />
                </div>
              </div>

              <div className="sm:col-span-7 space-y-1">
                <label className="font-bold text-slate-700 block">
                  Select Act ({filteredActs.length} available) <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedActId}
                  onChange={(e) => {
                    setSelectedActId(e.target.value);
                    setSelectedSections([]);
                    setSectionSearchQuery("");
                  }}
                  className="w-full p-2 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-[#0b192c]"
                >
                  {Array.from(new Set(filteredActs.map((a) => a.category))).map((cat) => (
                    <optgroup key={cat} label={cat}>
                      {filteredActs
                        .filter((a) => a.category === cat)
                        .map((act) => (
                          <option key={act.id} value={act.id}>
                            {act.name} ({act.sections.length} Sections)
                            {act.isCustom ? " • [Custom Bare Act]" : ""}
                          </option>
                        ))}
                    </optgroup>
                  ))}
                </select>
              </div>
            </div>

            {/* Section & Subsection Picker Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1 border-t border-slate-200/60">
              {/* Left: Section Search & List */}
              <div className="sm:col-span-7 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700 block">
                    Sections &amp; Sub-sections for {activeActObj?.name}
                  </label>
                  <span className="text-[10px] text-slate-500">Click to select multiple</span>
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search section number (e.g. 103(1), 303(2), 61)..."
                    value={sectionSearchQuery}
                    onChange={(e) => setSectionSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (sectionSearchQuery.trim()) handleAddCustomSection(sectionSearchQuery);
                      }
                    }}
                    className="w-full pl-8 pr-16 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-mono placeholder:font-sans focus:ring-2 focus:ring-[#0b192c]"
                  />
                  {sectionSearchQuery.trim() && (
                    <button
                      type="button"
                      onClick={() => handleAddCustomSection(sectionSearchQuery)}
                      className="absolute right-1 top-1 px-2 py-0.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold"
                    >
                      + Add
                    </button>
                  )}
                </div>

                <div className="max-h-44 overflow-y-auto divide-y divide-slate-100 border border-slate-200 bg-white rounded-lg p-1">
                  {filteredSections.length > 0 ? (
                    filteredSections.map((sec) => {
                      const isSelected = selectedSections.includes(sec.sectionNumber);
                      return (
                        <div
                          key={sec.sectionNumber}
                          onClick={() => handleToggleSection(sec.sectionNumber)}
                          className={`p-1.5 flex items-center justify-between cursor-pointer rounded transition-colors ${
                            isSelected
                              ? "bg-blue-50 text-blue-950 font-bold"
                              : "hover:bg-slate-50 text-slate-700"
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div
                              className={`w-3.5 h-3.5 rounded flex items-center justify-center shrink-0 text-[10px] border ${
                                isSelected
                                  ? "bg-blue-600 text-white border-blue-600 font-bold"
                                  : "border-slate-300 text-transparent"
                              }`}
                            >
                              ✓
                            </div>
                            <div className="min-w-0">
                              <span className="font-mono font-bold text-blue-900 mr-1.5">
                                Sec {sec.sectionNumber}
                              </span>
                              {sec.title && (
                                <span className="text-[11px] text-slate-500 font-normal truncate">
                                  — {sec.title}
                                </span>
                              )}
                            </div>
                          </div>
                          {isSelected && (
                            <span className="text-[10px] text-blue-700 font-bold shrink-0">Selected</span>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-3 text-center text-slate-500 text-xs">
                      <p>No section matching &ldquo;{sectionSearchQuery}&rdquo;.</p>
                      <button
                        type="button"
                        onClick={() => handleAddCustomSection(sectionSearchQuery)}
                        className="mt-1 text-[11px] text-blue-700 font-bold bg-blue-50 border border-blue-200 px-2 py-0.5 rounded hover:bg-blue-100"
                      >
                        + Add &ldquo;{sectionSearchQuery}&rdquo; as Section Number
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Selected Chips & Add to Staging */}
              <div className="sm:col-span-5 flex flex-col justify-between space-y-2 bg-white p-3 rounded-lg border border-slate-200">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-bold text-slate-700 block">
                      Selected Sections ({selectedSections.length})
                    </label>
                    {selectedSections.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedSections([])}
                        className="text-[10px] text-red-600 hover:underline"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  {selectedSections.length > 0 ? (
                    <div className="flex flex-wrap gap-1 max-h-36 overflow-y-auto p-1 bg-slate-50 rounded border border-slate-100 min-h-[70px]">
                      {selectedSections.map((sec) => (
                        <span
                          key={sec}
                          className="inline-flex items-center gap-1 bg-[#0b192c] text-white px-2 py-0.5 rounded text-[11px] font-mono font-bold"
                        >
                          <span>Sec {sec}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSelectedSection(sec)}
                            className="hover:text-red-300 ml-0.5 p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 rounded border border-dashed border-slate-200 text-center text-slate-400 min-h-[70px] flex items-center justify-center">
                      <span>Click sections from left to select</span>
                    </div>
                  )}
                </div>

                <Button
                  type="button"
                  onClick={handleAddSelectionToStaging}
                  disabled={selectedSections.length === 0 && !sectionSearchQuery.trim()}
                  className="w-full bg-[#0b192c] hover:bg-slate-800 disabled:bg-slate-300 text-white text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add to Staging Table Below
                </Button>
              </div>
            </div>

            {errorMessage && (
              <p className="text-red-600 font-semibold text-xs flex items-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errorMessage}
              </p>
            )}
          </div>

          {/* Staging Table: S. No., Acts, Sections, Delete */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-xs">
                Acts &amp; Sections to be Added to FIR ({stagedEntries.length})
              </h3>
              <span className="text-[11px] text-slate-500">
                Entries are checked for duplicates and merged automatically
              </span>
            </div>

            {stagedEntries.length > 0 ? (
              <div className="border border-slate-200 rounded-lg overflow-x-auto shadow-2xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5 w-14">S. No.</th>
                      <th className="p-2.5">Acts</th>
                      <th className="p-2.5">Sections</th>
                      <th className="p-2.5 w-20 text-center">Delete</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {stagedEntries.map((row, idx) => (
                      <tr key={row.id} className="hover:bg-slate-50">
                        <td className="p-2.5 font-bold text-slate-500">{row.srNo || idx + 1}</td>
                        <td className="p-2.5 font-semibold text-slate-900">{row.act}</td>
                        <td className="p-2.5 font-mono text-blue-900 font-bold">{row.sections}</td>
                        <td className="p-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteStagedEntry(idx)}
                            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                            title="Delete Row"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 text-center border border-dashed border-slate-200 rounded-lg text-slate-400">
                No Acts &amp; Sections in staging list. Select Act and Sections above and click &ldquo;Add to Staging Table&rdquo;.
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions: Save and Close */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <Button type="button" variant="outline" size="sm" onClick={onClose} className="text-xs">
            Close
          </Button>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              onClick={handleSaveAndClose}
              className="bg-[#0b192c] hover:bg-slate-800 text-white text-xs flex items-center gap-1.5 px-5 font-bold"
            >
              <Check className="w-3.5 h-3.5" />
              Save Acts &amp; Sections to FIR
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
