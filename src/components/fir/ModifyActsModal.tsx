"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  X,
  Scale,
  Plus,
  Trash2,
  Search,
  Check,
  ChevronDown,
  AlertCircle,
  Clock,
  FileText,
  Send,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { FIRItem, FIRActSectionEntry, FIRTimelineEvent } from "@/types";
import { firService } from "@/services/firService";
import { GeneralDiaryService } from "@/services/generalDiaryService";
import { getUnifiedActsCatalog, UnifiedActOption } from "@/lib/cctnsActsData";
import { ActsService } from "@/services/actsService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ModifyActsModalProps {
  isOpen: boolean;
  onClose: () => void;
  fir: FIRItem;
  currentUser: {
    id?: string;
    name: string;
    role?: string;
    rankDisplay?: string;
    beltNumber?: string;
    pno?: string;
  };
  onSuccess?: (updatedFir: FIRItem) => void;
}

const PRESET_REASONS = [
  "MLC / मेडिकल रिपोर्ट अनुसार गंभीर चोट (धारा 118(1) BNS इजाफा)",
  "दौरान-ए-तफ्तीश अवैध असलहा / कारतूस बरामदगी (Arms Act sec 25/27 इजाफा)",
  "मौका मुआयना व बयानात गवाहान से आरोप असत्य पाया गया (धारा खारिज / हजफ)",
  "पर्यवेक्षण अधिकारी (DSP / SP) के केस डायरी आदेशानुसार वैधानिक तरमीम",
  "FSL / विधि विज्ञान प्रयोगशाला रिपोर्ट के आधार पर संशोधन",
  "दस्तावेजों की जांच में धोखाधड़ी व कूटकरण पाए जाने पर धारा 318(4), 336(3) BNS इजाफा",
  "घटनास्थल निरीक्षण एवं साक्ष्य संकलन उपरांत उपयुक्त धाराएं तरमीम की गईं",
];

export function ModifyActsModal({
  isOpen,
  onClose,
  fir,
  currentUser,
  onSuccess,
}: ModifyActsModalProps) {
  // Unified Acts Catalog
  const [unifiedActs] = useState<UnifiedActOption[]>(() => {
    return getUnifiedActsCatalog(ActsService.getAllActs());
  });

  // Working list of Acts & Sections
  const [actsAndSectionsList, setActsAndSectionsList] = useState<FIRActSectionEntry[]>([]);
  const [selectedActId, setSelectedActId] = useState<string>("act_bns_2023");
  const [currentAct, setCurrentAct] = useState("Bharatiya Nyaya Sanhita, 2023 (BNS)");
  const [actSearchQuery, setActSearchQuery] = useState("");
  const [isActDropdownOpen, setIsActDropdownOpen] = useState(false);
  const actDropdownRef = useRef<HTMLDivElement | null>(null);
  const actSearchInputRef = useRef<HTMLInputElement | null>(null);

  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [sectionSearchQuery, setSectionSearchQuery] = useState("");
  const [currentSection, setCurrentSection] = useState("");
  const [isSectionDropdownOpen, setIsSectionDropdownOpen] = useState(false);
  const sectionDropdownRef = useRef<HTMLDivElement | null>(null);

  // Mandatory Reason
  const [reason, setReason] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Initialize data on modal open
  useEffect(() => {
    if (!isOpen || !fir) return;

    if (fir.actsAndSectionsList && fir.actsAndSectionsList.length > 0) {
      setActsAndSectionsList(
        fir.actsAndSectionsList.map((item, idx) => ({
          ...item,
          id: item.id || `act-mod-${idx}-${Date.now()}`,
          srNo: idx + 1,
        }))
      );
    } else if (fir.actsAndSections) {
      setActsAndSectionsList([
        {
          id: `act-init-${Date.now()}`,
          srNo: 1,
          act: fir.majorAct || "Bharatiya Nyaya Sanhita, 2023 (BNS)",
          sections: fir.actsAndSections,
        },
      ]);
    } else {
      setActsAndSectionsList([]);
    }

    setReason("");
    setValidationError(null);
    setSelectedSections([]);
    setSectionSearchQuery("");
    setCurrentSection("");
    setIsActDropdownOpen(false);
    setIsSectionDropdownOpen(false);
  }, [isOpen, fir]);

  // Click outside listener for dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (actDropdownRef.current && !actDropdownRef.current.contains(e.target as Node)) {
        setIsActDropdownOpen(false);
      }
      if (sectionDropdownRef.current && !sectionDropdownRef.current.contains(e.target as Node)) {
        setIsSectionDropdownOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Act selection
  const handleSelectAct = (actId: string) => {
    setSelectedActId(actId);
    const found = unifiedActs.find((a) => a.id === actId);
    if (found) setCurrentAct(found.name);
    setSelectedSections([]);
    setSectionSearchQuery("");
  };

  // Toggle section
  const handleToggleSection = (secNum: string) => {
    setSelectedSections((prev) =>
      prev.includes(secNum) ? prev.filter((s) => s !== secNum) : [...prev, secNum]
    );
  };

  // Add custom section
  const handleAddCustomSection = (rawInput: string) => {
    const trimmed = rawInput.trim().replace(/^Sec(tion)?\.?\s*/i, "");
    if (!trimmed) return;
    if (!selectedSections.includes(trimmed)) {
      setSelectedSections((prev) => [...prev, trimmed]);
    }
    setSectionSearchQuery("");
  };

  // Add Act & Section Inline
  const handleAddActSectionInline = () => {
    const finalSections = [...selectedSections];
    if (sectionSearchQuery.trim()) {
      const typed = sectionSearchQuery.trim().replace(/^Sec(tion)?\.?\s*/i, "");
      if (typed && !finalSections.includes(typed)) finalSections.push(typed);
    } else if (currentSection.trim()) {
      const parts = currentSection
        .split(",")
        .map((s) => s.trim().replace(/^Sec(tion)?\.?\s*/i, ""))
        .filter(Boolean);
      for (const p of parts) {
        if (!finalSections.includes(p)) finalSections.push(p);
      }
    }

    if (finalSections.length === 0) {
      setValidationError("कृपया इस अधिनियम के तहत कम से कम एक धारा या उपधारा चुनें अथवा दर्ज करें।");
      return;
    }

    const currentActObj = unifiedActs.find((a) => a.id === selectedActId);
    const actName = currentActObj?.name || currentAct;

    const newEntry: FIRActSectionEntry = {
      id: `act-${Date.now()}`,
      srNo: actsAndSectionsList.length + 1,
      act: actName,
      sections: finalSections.join(", "),
    };

    setActsAndSectionsList((prev) => [...prev, newEntry]);
    setSelectedSections([]);
    setSectionSearchQuery("");
    setCurrentSection("");
    setIsSectionDropdownOpen(false);
    setValidationError(null);
  };

  // Delete Act & Section row
  const handleDeleteRow = (idx: number) => {
    setActsAndSectionsList((prev) =>
      prev.filter((_, i) => i !== idx).map((it, i) => ({ ...it, srNo: i + 1 }))
    );
  };

  // Compute original and modified flat lists for diff
  const originalTokens = useMemo(() => {
    if (!fir) return [];
    if (fir.actsAndSectionsList && fir.actsAndSectionsList.length > 0) {
      return fir.actsAndSectionsList.flatMap((a) =>
        a.sections.split(",").map((s) => `${a.act} Sec ${s.trim()}`)
      );
    }
    if (fir.actsAndSections) {
      return [fir.actsAndSections];
    }
    return [];
  }, [fir]);

  const currentTokens = useMemo(() => {
    return actsAndSectionsList.flatMap((a) =>
      a.sections.split(",").map((s) => `${a.act} Sec ${s.trim()}`)
    );
  }, [actsAndSectionsList]);

  const addedDiff = useMemo(() => {
    return currentTokens.filter((t) => !originalTokens.includes(t));
  }, [currentTokens, originalTokens]);

  const deletedDiff = useMemo(() => {
    return originalTokens.filter((t) => !currentTokens.includes(t));
  }, [currentTokens, originalTokens]);

  // Formatted modified string
  const newActsStr = useMemo(() => {
    if (actsAndSectionsList.length === 0) return "";
    return actsAndSectionsList.map((a) => `${a.act}: Sec ${a.sections}`).join("; ");
  }, [actsAndSectionsList]);

  // Extract BNS section numbers
  const extractBnsSections = (list: FIRActSectionEntry[]): string[] => {
    const bnsItems = list.filter(
      (a) =>
        a.act.toLowerCase().includes("bns") ||
        a.act.toLowerCase().includes("nyaya sanhita")
    );
    const sections: string[] = [];
    bnsItems.forEach((item) => {
      item.sections
        .split(",")
        .map((s) => s.trim().replace(/^Sec(tion)?\.?\s*/i, ""))
        .filter(Boolean)
        .forEach((sec) => {
          if (!sections.includes(sec)) sections.push(sec);
        });
    });
    return sections;
  };

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (actsAndSectionsList.length === 0) {
      setValidationError("कम से कम एक अधिनियम व धारा लागू रहना अनिवार्य है (At least one Act & Section required).");
      return;
    }

    if (!reason.trim()) {
      setValidationError("संशोधन का वैधानिक कारण दर्ज करना अनिवार्य है (Reason for modification is mandatory).");
      return;
    }

    setIsSubmitting(true);

    try {
      const nowStr = new Date().toISOString().replace("T", " ").slice(0, 16);
      const officerLabel = currentUser.name
        ? `${currentUser.name} (${currentUser.rankDisplay || currentUser.role || "Investigating Officer"})`
        : "Investigating Officer";

      const previousActsStr = fir.actsAndSections || "N/A";
      const bnsSections = extractBnsSections(actsAndSectionsList);
      const majorAct = actsAndSectionsList[0]?.act || fir.majorAct || "Bharatiya Nyaya Sanhita, 2023";

      // 1. Create Timeline Event
      const timelineEvent: FIRTimelineEvent = {
        id: `tl-mod-acts-${Date.now()}`,
        firId: fir.id,
        date: nowStr,
        title: "Acts & Sections Modified (धाराओं में वैधानिक तरमीम)",
        description: `धाराएं संशोधित की गईं: [पूर्व: ${previousActsStr}] → [संशोधित: ${newActsStr}]. ${
          addedDiff.length > 0 ? `इजाफा: ${addedDiff.join(", ")}. ` : ""
        }${deletedDiff.length > 0 ? `खारिज/हजफ: ${deletedDiff.join(", ")}. ` : ""}वैधानिक कारण: ${reason.trim()}`,
        actor: officerLabel,
        stage: "INVESTIGATION_PROCESS",
      };

      // 2. Update FIR in firService
      const updatedFir = firService.updateFir(fir.id, {
        actsAndSectionsList,
        actsAndSections: newActsStr,
        majorAct,
        bnsSections,
        timeline: [timelineEvent, ...(fir.timeline || [])],
      });

      // 3. Add Audit Trail
      firService.addAuditRecord(
        fir.id,
        "ACTS_SECTIONS_MODIFIED",
        `Statutory acts and sections modified. Previous: [${previousActsStr}] | Updated: [${newActsStr}]. Reason: ${reason.trim()}`,
        currentUser.name,
        currentUser.role
      );

      // 4. Generate Auto-Suggestion Draft in Roznamcha GD
      await GeneralDiaryService.createFirActionSuggestion({
        actionType: "ACT_SECTION_MODIFIED",
        firId: fir.id,
        firNumber: fir.cctnsFirNumber || fir.firNumber,
        policeStation: fir.policeStation,
        district: fir.district,
        officer: {
          name: currentUser.name || "Investigating Officer",
          rank: currentUser.rankDisplay || currentUser.role,
          beltNumber: currentUser.beltNumber,
          pno: currentUser.pno,
        },
        previousActs: previousActsStr,
        newActs: newActsStr,
        addedActs: addedDiff,
        deletedActs: deletedDiff,
        reason: reason.trim(),
      });

      setToastMsg("धाराएं सफलतापूर्वक संशोधित की गईं और रोजनामचा GD में इंद्राज ड्राफ्ट भेज दिया गया।");

      setTimeout(() => {
        setIsSubmitting(false);
        setToastMsg(null);
        if (updatedFir && onSuccess) {
          onSuccess(updatedFir);
        }
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error("Error modifying acts:", err);
      setValidationError(`त्रुटि: ${err.message || "धाराएं संशोधित करने में समस्या आई।"}`);
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in-50">
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden text-xs">
        {/* Modal Header */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-slate-950 via-slate-900 to-red-950 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-600/30 border border-red-500/40 flex items-center justify-center text-red-400">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold tracking-tight text-white">
                  Modify Statutory Acts &amp; Sections (धाराओं में वैधानिक तरमीम)
                </h2>
                <span className="text-[10px] font-mono font-bold bg-red-600 text-white px-2 py-0.5 rounded">
                  PPR 22.48
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5 font-medium">
                FIR No: <strong className="text-white font-mono">{fir.cctnsFirNumber || fir.firNumber}</strong> • {fir.policeStation}, {fir.district}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Success Toast */}
        {toastMsg && (
          <div className="mx-5 mt-3 p-3 bg-emerald-50 border border-emerald-300 text-emerald-950 rounded-xl text-xs flex items-center gap-2.5 shadow-sm animate-in fade-in">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-bold">{toastMsg}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Current Statutory Offence Banner */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-3">
            <Scale className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                Current Statutory Offence Registered (वर्तमान में दर्ज धाराएं)
              </div>
              <div className="text-xs font-mono font-bold text-slate-900 mt-0.5">
                {fir.actsAndSections || "Sec 173 BNSS"}
              </div>
            </div>
          </div>

          {/* Acts and Sections Repeatable Panel (Replicated from Register FIR Form) */}
          <Card className="border-slate-200 overflow-visible relative z-20">
            <CardHeader className="py-2.5 px-4 bg-slate-50 border-b border-slate-200 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Scale className="w-4 h-4 text-red-600" />
                Acts and Sections Applicable <span className="text-red-600">*</span>
              </CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded border border-red-200">
                  Mandatory *
                </span>
                <span className="text-[11px] font-semibold text-slate-500">
                  {actsAndSectionsList.length} Act(s) Added
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-4 text-xs overflow-visible">
              {/* Inline Acts and Sections Selection */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 grid grid-cols-1 md:grid-cols-12 gap-3 items-end relative overflow-visible z-20">
                {/* 1. Act Selector */}
                <div className="md:col-span-5 relative z-50" ref={actDropdownRef}>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700 block">Select Act</label>
                    {selectedActId && (
                      <span className="text-[10px] text-slate-500 font-medium">
                        {(() => {
                          const act = unifiedActs.find((a) => a.id === selectedActId);
                          return act ? `${act.sections.length} Sections available` : "";
                        })()}
                      </span>
                    )}
                  </div>

                  <div
                    onClick={() => {
                      setIsActDropdownOpen((prev) => {
                        const nextState = !prev;
                        if (nextState) {
                          setIsSectionDropdownOpen(false);
                          setTimeout(() => actSearchInputRef.current?.focus(), 50);
                        }
                        return nextState;
                      });
                    }}
                    className="w-full min-h-[38px] p-2 rounded-lg border border-slate-300 bg-white text-xs cursor-pointer flex items-center justify-between gap-1 shadow-2xs hover:border-slate-400 focus-within:ring-2 focus-within:ring-[#0b192c]"
                  >
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      {(() => {
                        const act = unifiedActs.find((a) => a.id === selectedActId) || unifiedActs[0];
                        if (!act) return <span className="text-slate-400">Select an Act...</span>;
                        return (
                          <div className="flex items-center gap-1.5 min-w-0 truncate">
                            <span className="font-semibold text-slate-800 truncate">
                              {act.name}
                            </span>
                            <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px] font-mono shrink-0">
                              {act.sections.length} Sec
                            </span>
                            {act.isCustom && (
                              <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded text-[9px] font-semibold shrink-0">
                                Custom
                              </span>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${
                        isActDropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  </div>

                  {isActDropdownOpen && (
                    <div
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => e.stopPropagation()}
                      className="absolute left-0 w-full sm:min-w-[420px] md:min-w-[480px] max-w-[calc(100vw-2.5rem)] top-full mt-1.5 bg-white border border-slate-300 rounded-xl shadow-2xl z-50 p-2.5 space-y-2.5"
                    >
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                        <input
                          ref={actSearchInputRef}
                          type="text"
                          placeholder="Type to search Act name or category..."
                          value={actSearchQuery}
                          onChange={(e) => setActSearchQuery(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Escape") {
                              setIsActDropdownOpen(false);
                            }
                          }}
                          className="w-full pl-8 pr-7 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-[#0b192c]"
                        />
                        {actSearchQuery && (
                          <button
                            type="button"
                            onClick={() => setActSearchQuery("")}
                            className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {(() => {
                        const q = actSearchQuery.toLowerCase().trim();
                        const filtered = unifiedActs.filter((a) => {
                          if (!q) return true;
                          return (
                            a.name.toLowerCase().includes(q) ||
                            a.title.toLowerCase().includes(q) ||
                            a.category.toLowerCase().includes(q) ||
                            a.id.toLowerCase().includes(q)
                          );
                        });

                        if (filtered.length === 0) {
                          return (
                            <div className="p-4 text-center text-xs text-slate-500">
                              No matching acts found for &quot;{actSearchQuery}&quot;
                            </div>
                          );
                        }

                        const categories = Array.from(new Set(filtered.map((a) => a.category)));

                        return (
                          <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-lg bg-white">
                            {categories.map((cat) => {
                              const actsInCat = filtered.filter((a) => a.category === cat);
                              return (
                                <div key={cat} className="p-1">
                                  <div className="px-2 py-1 text-[10px] font-bold tracking-wider uppercase text-slate-400 bg-slate-50/80 rounded">
                                    {cat}
                                  </div>
                                  <div className="space-y-0.5 mt-0.5">
                                    {actsInCat.map((act) => {
                                      const isSelected = selectedActId === act.id;
                                      return (
                                        <div
                                          key={act.id}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleSelectAct(act.id);
                                            setIsActDropdownOpen(false);
                                            setActSearchQuery("");
                                          }}
                                          className={`p-2 flex items-center justify-between cursor-pointer text-xs rounded-md transition-colors ${
                                            isSelected
                                              ? "bg-blue-50 text-blue-950 font-semibold border border-blue-200"
                                              : "hover:bg-slate-50 text-slate-700"
                                          }`}
                                        >
                                          <div className="min-w-0 pr-2">
                                            <div className="font-semibold text-slate-800 leading-tight">
                                              {act.name}
                                            </div>
                                            <div className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                                              <span className="font-mono text-blue-700 font-bold">
                                                {act.sections.length} Sections
                                              </span>
                                              {act.isCustom && (
                                                <span className="text-amber-700 font-medium">
                                                  • [Custom Bare Act]
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                          {isSelected && (
                                            <Check className="w-4 h-4 text-blue-600 shrink-0 font-bold" />
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>

                {/* 2. Section & Sub Section Selector */}
                <div className="md:col-span-5 relative z-40" ref={sectionDropdownRef}>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700 block">Select Section &amp; Sub Section</label>
                    {selectedSections.length > 0 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSections([]);
                        }}
                        className="text-[10px] text-red-600 hover:underline font-semibold"
                      >
                        Clear ({selectedSections.length})
                      </button>
                    )}
                  </div>

                  <div
                    onClick={() => {
                      setIsSectionDropdownOpen((prev) => {
                        if (!prev) setIsActDropdownOpen(false);
                        return !prev;
                      });
                    }}
                    className="w-full min-h-[38px] p-1.5 rounded-lg border border-slate-300 bg-white text-xs cursor-pointer flex items-center justify-between gap-1 shadow-2xs hover:border-slate-400 focus-within:ring-2 focus-within:ring-[#0b192c]"
                  >
                    <div className="flex flex-wrap gap-1 items-center flex-1 min-w-0">
                      {selectedSections.length > 0 ? (
                        selectedSections.map((sec) => (
                          <span
                            key={sec}
                            className="inline-flex items-center gap-1 bg-[#0b192c] text-white px-2 py-0.5 rounded text-[11px] font-mono font-bold shrink-0"
                          >
                            <span>Sec {sec}</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleSection(sec);
                              }}
                              className="hover:text-red-300 ml-0.5"
                            >
                              ×
                            </button>
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400">Click to select sections...</span>
                      )}
                    </div>
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  </div>

                  {isSectionDropdownOpen && (
                    <div
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => e.stopPropagation()}
                      className="absolute left-0 w-full sm:min-w-[420px] md:min-w-[480px] max-w-[calc(100vw-2.5rem)] top-full mt-1.5 bg-white border border-slate-300 rounded-xl shadow-2xl z-50 p-2.5 space-y-2.5"
                    >
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                        <input
                          type="text"
                          placeholder="Type to filter or add custom section..."
                          value={sectionSearchQuery}
                          onChange={(e) => setSectionSearchQuery(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              if (sectionSearchQuery.trim()) {
                                handleAddCustomSection(sectionSearchQuery);
                              }
                            }
                          }}
                          className="w-full pl-8 pr-16 py-1.5 rounded-lg border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-[#0b192c]"
                        />
                        {sectionSearchQuery.trim() && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddCustomSection(sectionSearchQuery);
                            }}
                            className="absolute right-1 top-1 px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold"
                          >
                            + Add
                          </button>
                        )}
                      </div>

                      {(() => {
                        const activeObj = unifiedActs.find((a) => a.id === selectedActId) || unifiedActs[0];
                        const secList = activeObj?.sections || [];
                        const q = sectionSearchQuery.toLowerCase().trim();
                        const filtered = secList.filter((s) => {
                          if (!q) return true;
                          return (
                            s.sectionNumber.toLowerCase().includes(q) ||
                            (s.title && s.title.toLowerCase().includes(q))
                          );
                        });

                        return (
                          <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-lg bg-white">
                            {filtered.length > 0 ? (
                              filtered.map((sec, secIdx) => {
                                const isSelected = selectedSections.includes(sec.sectionNumber);
                                return (
                                  <div
                                    key={`${sec.sectionNumber}-${secIdx}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleToggleSection(sec.sectionNumber);
                                    }}
                                    className={`p-2 flex items-center justify-between cursor-pointer text-xs rounded-md transition-colors ${
                                      isSelected
                                        ? "bg-blue-50 text-blue-950 font-semibold border border-blue-200"
                                        : "hover:bg-slate-50 text-slate-700"
                                    }`}
                                  >
                                    <div className="flex items-start gap-2 min-w-0">
                                      <div
                                        className={`w-3.5 h-3.5 mt-0.5 rounded flex items-center justify-center shrink-0 text-[10px] border ${
                                          isSelected
                                            ? "bg-blue-600 text-white border-blue-600 font-bold"
                                            : "border-slate-300"
                                        }`}
                                      >
                                        {isSelected ? "✓" : ""}
                                      </div>
                                      <div className="min-w-0 leading-tight">
                                        <span className="font-mono font-bold text-blue-900 mr-1.5">
                                          {sec.sectionNumber}
                                        </span>
                                        {sec.title && (
                                          <span className="text-[11px] text-slate-600 font-normal">
                                            — {sec.title}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })
                            ) : (
                              <div className="p-3 text-center text-slate-500 text-xs">
                                <p>No section found for &ldquo;{sectionSearchQuery}&rdquo;.</p>
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      <div className="pt-1.5 flex items-center justify-between border-t border-slate-100 text-[11px]">
                        <span className="text-slate-600 font-medium">
                          {selectedSections.length} section(s) selected
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsSectionDropdownOpen(false);
                          }}
                          className="px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold shadow-xs cursor-pointer"
                        >
                          Done
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Add Act Button */}
                <div className="md:col-span-2">
                  <Button
                    type="button"
                    onClick={handleAddActSectionInline}
                    className="w-full bg-[#0b192c] hover:bg-slate-800 text-white text-xs flex items-center justify-center gap-1 h-[38px] cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Act
                  </Button>
                </div>
              </div>

              {/* Table */}
              {actsAndSectionsList.length > 0 ? (
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-2.5 w-14">S.No.</th>
                        <th className="p-2.5">Acts</th>
                        <th className="p-2.5">Sections</th>
                        <th className="p-2.5 w-20 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {actsAndSectionsList.map((row, idx) => (
                        <tr key={row.id} className="hover:bg-slate-50">
                          <td className="p-2.5 font-bold text-slate-500">{row.srNo || idx + 1}</td>
                          <td className="p-2.5 font-semibold text-slate-900">{row.act}</td>
                          <td className="p-2.5 font-mono text-blue-900 font-bold">{row.sections}</td>
                          <td className="p-2.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteRow(idx)}
                              title="Delete this Act"
                              className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded cursor-pointer transition-colors"
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
                <div className="text-center py-4 rounded-lg border border-dashed border-red-300 text-red-700 bg-red-50/50 font-semibold">
                  No acts &amp; sections configured. Please select an Act and Section(s) above and click &quot;Add Act&quot;.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Diff Changes Summary */}
          {(addedDiff.length > 0 || deletedDiff.length > 0) && (
            <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl space-y-2 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-amber-900">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>Summary of Alterations (परिवर्तनों का वैधानिक विवरण):</span>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {addedDiff.map((item, i) => (
                  <span
                    key={`added-${i}`}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-md font-mono font-bold text-[11px]"
                  >
                    <span>+ इजाफा:</span>
                    <span>{item}</span>
                  </span>
                ))}
                {deletedDiff.map((item, i) => (
                  <span
                    key={`deleted-${i}`}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-100 text-rose-900 border border-rose-300 rounded-md font-mono font-bold text-[11px] line-through"
                  >
                    <span>- खारिज/हजफ:</span>
                    <span>{item}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Mandatory Reason for Modification */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <span>Statutory Reason for Modification (धाराएं जोड़ने / हटाने / बदलने का वैधानिक कारण)</span>
                <span className="text-red-600 font-bold">*</span>
              </label>
              <span className="text-[10px] text-slate-500 font-medium">
                Mandatory for Case Diary &amp; Roznamcha GD
              </span>
            </div>

            {/* Quick Fill Chips */}
            <div className="flex flex-wrap gap-1.5">
              {PRESET_REASONS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setReason(preset)}
                  className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-blue-50 hover:text-blue-900 border border-slate-200 text-slate-700 text-[11px] font-medium transition-all text-left cursor-pointer"
                >
                  + {preset}
                </button>
              ))}
            </div>

            <textarea
              rows={3}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (validationError) setValidationError(null);
              }}
              placeholder="विवेचना के दौरान धाराएं जोड़ने / हटाने / तरमीम करने का वैधानिक कारण व साक्ष्य विवरण विस्तारपूर्वक दर्ज करें..."
              className="w-full p-2.5 rounded-lg border border-slate-300 bg-white text-xs focus:ring-2 focus:ring-[#0b192c] focus:outline-hidden"
              required
            />
          </div>

          {/* Validation Error Message */}
          {validationError && (
            <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span className="font-semibold">{validationError}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>इंद्राज रोजनामचा GD ड्राफ्ट स्वतः सृजित होगा (Auto-generates GD draft)</span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
              className="text-xs cursor-pointer border-slate-300"
            >
              Cancel (रद्द करें)
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-red-700 hover:bg-red-800 text-white font-bold text-xs gap-1.5 cursor-pointer shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Processing Modification...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit &amp; Log to Roznamcha GD (संशोधित करें व GD ड्राफ्ट भेजें)</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
