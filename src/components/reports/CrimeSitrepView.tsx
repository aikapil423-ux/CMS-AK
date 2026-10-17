"use client";

import React, { useState, useEffect } from "react";
import {
  CrimeSitrepData,
  SitrepFirEntry,
  SitrepArrestEntry,
  SitrepRecoveryEntry,
  SitrepSectionModification,
  SitrepDisposalEntry,
  SitrepReopenedCase,
  SitrepRukkaEntry,
  SitrepUploadSummary,
  SitrepHeadCount,
} from "@/types/reports";
import {
  Printer,
  Download,
  Search,
  Plus,
  Trash2,
  Edit2,
  Save,
  CheckCircle,
  Sparkles,
  RefreshCw,
  X,
  FileText,
  BookmarkCheck,
  History,
  Calendar,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Sliders,
  RotateCcw,
  GripVertical,
} from "lucide-react";
import { printA4Element } from "@/utils/printElement";
import { ReportsService, formatDisplayDateIn } from "@/services/reportsService";
import { downloadElementAsPdf } from "@/utils/sitrepPdfGenerator";

interface CrimeSitrepViewProps {
  data: CrimeSitrepData;
  onGenerateAndSave?: () => Promise<void>;
  onSaveReport?: (updated: CrimeSitrepData) => void;
  onNavigateToSaved?: () => void;
}

const DEFAULT_SECTION_ORDER = [
  "summary",
  "sec_1",
  "sec_2",
  "sec_3",
  "sec_4",
  "sec_5",
  "sec_6",
  "sec_10",
  "sec_11",
];

const DEFAULT_SECTION_TITLES: Record<string, string> = {
  summary: "Crime Summary — Page 1",
  sec_1: "Section I: Registration of FIR (Pages 2–6)",
  sec_2: "Section II: Accused arrested (Pages 7–8)",
  sec_3: "Section III: Case Property Recovered/Seized (Pages 8–12)",
  sec_4: "Section IV: Modification of sections (Pages 12–13)",
  sec_5: "Section V: Disposal of Cases (Pages 13–16)",
  sec_6: "Section VI: Cases reopened for investigation (Page 16)",
  sec_10: "Section X: Rukka issued (Pages 16–19)",
  sec_11: "Section XI: FIR Upload Summary Report (Page 19)",
};

// Downloads a standalone styled HTML preview of the report
function downloadSitrepPreviewHtml(elementId: string, filename: string) {
  try {
    if (typeof window === "undefined") return;
    const el = document.getElementById(elementId);
    if (!el) return;

    const clone = el.cloneNode(true) as HTMLElement;

    // Convert inputs, textareas, selects into plain text spans for preview FIRST before modifying DOM tree
    const origInputs = el.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
      "input, textarea, select"
    );
    const cloneInputs = clone.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
      "input, textarea, select"
    );
    for (let i = 0; i < origInputs.length; i++) {
      const orig = origInputs[i];
      const dest = cloneInputs[i];
      if (!dest) continue;
      const span = document.createElement("span");
      span.textContent = orig.value || "--";
      span.className = "font-medium text-slate-900";
      dest.parentNode?.replaceChild(span, dest);
    }

    // Now remove interactive/print:hidden elements safely
    const hiddenElements = clone.querySelectorAll(".print\\:hidden");
    hiddenElements.forEach((h) => h.remove());

    const htmlContent = `<!DOCTYPE html>
<html lang="hi">
<head>
  <meta charset="UTF-8">
  <title>${filename}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      @page { size: A4; margin: 8mm; }
    }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; background: #f8fafc; padding: 20px; }
    .page-container { background: #ffffff; max-width: 1050px; margin: 0 auto; padding: 32px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="page-container">
    ${clone.innerHTML}
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.html`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      a.remove();
      URL.revokeObjectURL(url);
    }, 300);
  } catch (err) {
    console.error("Failed to generate or download preview HTML:", err);
  }
}

export function CrimeSitrepView({
  data: initialData,
  onGenerateAndSave,
  onSaveReport,
  onNavigateToSaved,
}: CrimeSitrepViewProps) {
  const [data, setData] = useState<CrimeSitrepData>(initialData);
  const [isEditingHeader, setIsEditingHeader] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPs, setSelectedPs] = useState("ALL");
  const [notification, setNotification] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Template Layout Customization State (Arrange position & Size)
  const [sectionOrder, setSectionOrder] = useState<string[]>(() => {
    return initialData.metadata?.sectionOrder || DEFAULT_SECTION_ORDER;
  });
  const [hiddenSections, setHiddenSections] = useState<string[]>(() => {
    return initialData.metadata?.hiddenSections || [];
  });
  const [density, setDensity] = useState<"compact" | "normal" | "spacious">(() => {
    return initialData.metadata?.density || "normal";
  });
  const [sectionTitles, setSectionTitles] = useState<Record<string, string>>(() => {
    return initialData.metadata?.sectionTitles || DEFAULT_SECTION_TITLES;
  });
  const [isCustomizingLayout, setIsCustomizingLayout] = useState(false);
  const [editingTitleKey, setEditingTitleKey] = useState<string | null>(null);

  // Sync state if initialData changes externally
  useEffect(() => {
    setData(initialData);
    if (initialData.metadata?.sectionOrder) {
      setSectionOrder(initialData.metadata.sectionOrder);
    }
    if (initialData.metadata?.hiddenSections) {
      setHiddenSections(initialData.metadata.hiddenSections);
    }
    if (initialData.metadata?.density) {
      setDensity(initialData.metadata.density);
    }
    if (initialData.metadata?.sectionTitles) {
      setSectionTitles(initialData.metadata.sectionTitles);
    }
  }, [initialData]);

  const maxAllowedDate = ReportsService.getLatestAllowedDate();

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Helper to extract YYYY-MM-DD from display date
  const getIsoDateFromDisplay = (displayDate: string): string => {
    if (!displayDate) return "";
    const parts = displayDate.split("/");
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
    }
    const hyphenParts = displayDate.split("-");
    if (hyphenParts.length === 3 && hyphenParts[0].length === 2) {
      return `${hyphenParts[2]}-${hyphenParts[1].padStart(2, "0")}-${hyphenParts[0].padStart(2, "0")}`;
    }
    const isoMatch = displayDate.match(/^\d{4}-\d{2}-\d{2}/);
    if (isoMatch) return isoMatch[0];
    return "";
  };

  // Change Audit / Report Date handler:
  // 1. Report Date cannot exceed latest date (maxAllowedDate).
  // 2. Automatically sets cutoff to previous day (up to midnight 24hrs) and strictly audits that back day's data.
  const handleReportDateChange = async (newDateIso: string) => {
    if (!newDateIso) return;

    if (newDateIso > maxAllowedDate) {
      showToast(`नवीनतम उपलब्ध तारीख ${formatDisplayDateIn(maxAllowedDate)} है। इससे आगे की तारीख का चयन नहीं किया जा सकता।`);
      newDateIso = maxAllowedDate;
    }

    setIsGenerating(true);
    try {
      const updated = await ReportsService.getCrimeSitrep(newDateIso, selectedPs, data.district);
      setData(updated);
      if (onSaveReport) {
        onSaveReport(updated);
      }
      showToast(`रिपोर्ट तारीख: ${updated.reportDate} | स्वतः ऑडिट (पिछला 24 घंटा): ${updated.cutoffTime}`);
    } catch (err) {
      console.error("Failed to audit date", err);
      showToast("तारीख बदलने में त्रुटि आई।");
    } finally {
      setIsGenerating(false);
    }
  };

  // SAVE TO REPORTS HISTORY BUTTON: Saves to saved reports AND downloads preview AND navigates to Saved Reports
  const handleSaveToReportsHistory = async () => {
    setIsGenerating(true);
    try {
      const reportId = `SITREP-${data.district.toUpperCase()}-${Date.now().toString().slice(-6)}`;
      const snapshot: CrimeSitrepData = {
        ...data,
        id: reportId,
        metadata: {
          sectionOrder,
          hiddenSections,
          density,
          sectionTitles,
        },
      };

      await ReportsService.saveReport({
        id: reportId,
        reportType: "CRIME_SITREP",
        reportTitle: "CRIME SITREP",
        district: data.district,
        reportDate: data.reportDate,
        cutoffTime: data.cutoffTime,
        generatedByRole: "Superintendent of Police",
        generatedByName: `SP ${data.district}`,
        generatedAt: new Date().toLocaleString("en-IN"),
        caseCount: data.firEntries.length,
        data: snapshot,
      });

      if (onSaveReport) {
        onSaveReport(snapshot);
      }
      setData(snapshot);

      // Download the full styled PDF matching the police template
      try {
        const filename = `CRIME_SITREP_${data.district}_${data.reportDate.replace(/\//g, "-")}`;
        await downloadElementAsPdf("printable-sitrep-document", filename);
      } catch (dlErr) {
        console.warn("PDF download skipped:", dlErr);
      }

      showToast("रिपोर्ट 'Saved Reports' में सुरक्षित हो गई और PDF डाउनलोड हो गया!");

      // Seamlessly navigate user to Saved Reports tab to view saved report entry
      if (onNavigateToSaved) {
        setTimeout(() => {
          onNavigateToSaved();
        }, 500);
      }
    } catch (err) {
      console.error("Failed to save to reports history", err);
      showToast("रिपोर्ट हिस्ट्री में सेव करने में त्रुटि आई।");
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate button handler
  const handleGenerateCrimeSitrepClick = async () => {
    setIsGenerating(true);
    try {
      const currentIso = getIsoDateFromDisplay(data.reportDate);
      const generated = await ReportsService.generateAndSaveCrimeSitrep(data.district, currentIso);
      setData(generated.data as CrimeSitrepData);
      if (onSaveReport) {
        onSaveReport(generated.data as CrimeSitrepData);
      }
      showToast("सभी थानों का ऑडिट पूरा! नई Crime SITREP जनरेट और Save Reports में सुरक्षित की गई।");
    } finally {
      setIsGenerating(false);
    }
  };

  // Header field change handler with automatic previous day audit when reportDate changes
  const handleHeaderChange = async (field: keyof CrimeSitrepData, value: any) => {
    if (field === "reportDate") {
      const iso = getIsoDateFromDisplay(String(value));
      if (iso) {
        if (iso > maxAllowedDate) {
          showToast(`नवीनतम उपलब्ध तारीख ${formatDisplayDateIn(maxAllowedDate)} है। इससे आगे की तारीख का चयन नहीं किया जा सकता।`);
          return;
        }
        await handleReportDateChange(iso);
        return;
      }
    }
    setData((prev) => ({ ...prev, [field]: value }));
  };

  // Reordering helpers
  const moveSection = (index: number, direction: "up" | "down") => {
    setSectionOrder((prev) => {
      const newOrder = [...prev];
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= newOrder.length) return prev;
      const temp = newOrder[index];
      newOrder[index] = newOrder[targetIndex];
      newOrder[targetIndex] = temp;
      return newOrder;
    });
  };

  const toggleHideSection = (secKey: string) => {
    setHiddenSections((prev) =>
      prev.includes(secKey) ? prev.filter((k) => k !== secKey) : [...prev, secKey]
    );
  };

  const resetLayout = () => {
    setSectionOrder(DEFAULT_SECTION_ORDER);
    setHiddenSections([]);
    setDensity("normal");
    setSectionTitles(DEFAULT_SECTION_TITLES);
    showToast("लेआउट क्रम और शीर्षक डिफ़ॉल्ट पर रीसेट कर दिए गए।");
  };

  const handleTitleChange = (key: string, newTitle: string) => {
    setSectionTitles((prev) => ({ ...prev, [key]: newTitle }));
  };

  // Head counts row edit handler
  const handleHeadCountChange = (index: number, newCount: string | number) => {
    setData((prev) => {
      const updated = [...prev.section1HeadCounts];
      updated[index] = { ...updated[index], totalNumber: newCount };
      return { ...prev, section1HeadCounts: updated };
    });
  };

  const handleHeadNameChange = (index: number, newName: string) => {
    setData((prev) => {
      const updated = [...prev.section1HeadCounts];
      updated[index] = { ...updated[index], head: newName };
      return { ...prev, section1HeadCounts: updated };
    });
  };

  // --- ADD / DELETE / EDIT ROW HANDLERS ---

  // 1. FIR Dossiers
  const handleAddFir = () => {
    const newEntry: SitrepFirEntry = {
      srNo: data.firEntries.length + 1,
      ps: selectedPs !== "ALL" ? selectedPs : "PS City Panipat",
      head: "Snatching",
      ipcSections: "BNS 304",
      firNo: `${100 + data.firEntries.length}/2026`,
      dated: `${data.reportDate} 10:00:00`,
      us: "BNS 304",
      complainant: "Citizen Name, Age 32 R/o Panipat",
      complainantMobile: "9812000000",
      victim: "Citizen Name",
      accused: "Unknown person on motorcycle",
      suspectedPersons: false,
      occurrenceFrom: `${data.reportDate} 08:30:00`,
      occurrenceTo: `${data.reportDate} 08:35:00`,
      totalPropertyAmount: "5000",
      placeOfOccurrence: "Near Market Gate",
      briefFacts: "Complainant stated unknown persons snatched mobile phone.",
      reasonOfDelay: "Nil",
      ioNameRank: "SI Rajesh Kumar",
      ioMobile: "9812033441",
    };
    setData((prev) => ({
      ...prev,
      firEntries: [newEntry, ...prev.firEntries].map((f, i) => ({ ...f, srNo: i + 1 })),
    }));
    showToast("नई एफ.आई.आर जोड़ी गई (New FIR added)");
  };

  const handleDeleteFir = (index: number) => {
    if (confirm("क्या आप इस एफ.आई.आर रिकॉर्ड को हटाना चाहते हैं?")) {
      setData((prev) => ({
        ...prev,
        firEntries: prev.firEntries.filter((_, i) => i !== index).map((f, i) => ({ ...f, srNo: i + 1 })),
      }));
      showToast("एफ.आई.आर रिकॉर्ड हटाया गया");
    }
  };

  const handleFirChange = (index: number, field: keyof SitrepFirEntry, value: any) => {
    setData((prev) => {
      const updated = [...prev.firEntries];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, firEntries: updated };
    });
  };

  // 2. Section II: Arrests
  const handleAddArrest = () => {
    const newEntry: SitrepArrestEntry = {
      srNo: data.arrests.length + 1,
      gdNoArrestTime: "GD-0042\n12:30",
      ps: selectedPs !== "ALL" ? selectedPs : "PS City Panipat",
      firNoAndUs: "102/2026 u/s 304 BNS",
      head: "Snatching",
      firDate: data.reportDate,
      accusedDetails: "Rakesh Kumar @ Kalia (24) S/o Ram Lal R/o Panipat",
      ioDetails: "SI Ramesh Kumar, Sub Inspector (Mob: 9812000001)",
    };
    setData((prev) => ({
      ...prev,
      arrests: [...prev.arrests, newEntry].map((a, i) => ({ ...a, srNo: i + 1 })),
    }));
  };

  const handleDeleteArrest = (index: number) => {
    setData((prev) => ({
      ...prev,
      arrests: prev.arrests.filter((_, i) => i !== index).map((a, i) => ({ ...a, srNo: i + 1 })),
    }));
  };

  const handleArrestChange = (index: number, field: keyof SitrepArrestEntry, value: any) => {
    setData((prev) => {
      const updated = [...prev.arrests];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, arrests: updated };
    });
  };

  // 3. Section III: Recoveries
  const handleAddRecovery = () => {
    const newEntry: SitrepRecoveryEntry = {
      srNo: data.recoveries.length + 1,
      gdNoRecoveryTime: "GD-0048\n14:00",
      ps: selectedPs !== "ALL" ? selectedPs : "PS City Panipat",
      firNoAndUs: "102/2026 u/s 304 BNS",
      head: "Snatching",
      firDate: data.reportDate,
      recoveredItems: "Mobile Phone (Make: OnePlus) Qty: 1 Value: ₹ 22,000",
      ioDetails: "SI Ramesh Kumar, Sub Inspector (Mob: 9812000001)",
    };
    setData((prev) => ({
      ...prev,
      recoveries: [...prev.recoveries, newEntry].map((r, i) => ({ ...r, srNo: i + 1 })),
    }));
  };

  const handleDeleteRecovery = (index: number) => {
    setData((prev) => ({
      ...prev,
      recoveries: prev.recoveries.filter((_, i) => i !== index).map((r, i) => ({ ...r, srNo: i + 1 })),
    }));
  };

  const handleRecoveryChange = (index: number, field: keyof SitrepRecoveryEntry, value: any) => {
    setData((prev) => {
      const updated = [...prev.recoveries];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, recoveries: updated };
    });
  };

  // 4. Section IV: Modifications
  const handleAddModification = () => {
    const newEntry: SitrepSectionModification = {
      srNo: data.modifications.length + 1,
      ps: selectedPs !== "ALL" ? selectedPs : "PS City Panipat",
      firNo: "88/2026",
      firDate: data.reportDate,
      originalSection: "Sec 303(2) BNS",
      sectionAdded: "Sec 304 BNS",
      sectionRemoved: "Nil",
      head: "Snatching",
      dateOfModification: data.reportDate,
      ioDetails: "ASI Sandeep Singh",
    };
    setData((prev) => ({
      ...prev,
      modifications: [...prev.modifications, newEntry].map((m, i) => ({ ...m, srNo: i + 1 })),
    }));
  };

  const handleDeleteModification = (index: number) => {
    setData((prev) => ({
      ...prev,
      modifications: prev.modifications.filter((_, i) => i !== index).map((m, i) => ({ ...m, srNo: i + 1 })),
    }));
  };

  const handleModificationChange = (index: number, field: keyof SitrepSectionModification, value: any) => {
    setData((prev) => {
      const updated = [...prev.modifications];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, modifications: updated };
    });
  };

  // 5a. Section V: Complete Challan
  const handleAddCompleteChallan = () => {
    const newEntry: SitrepDisposalEntry = {
      srNo: data.completeChallans.length + 1,
      ps: selectedPs !== "ALL" ? selectedPs : "PS City Panipat",
      firNo: "21/2026 u/s 304 BNS",
      firDate: data.reportDate,
      head: "Snatching",
      accusedArrested: 1,
      type: "Fresh",
      ioDetails: "SI Ramesh Kumar",
    };
    setData((prev) => ({
      ...prev,
      completeChallans: [...prev.completeChallans, newEntry].map((r, i) => ({ ...r, srNo: i + 1 })),
    }));
  };

  const handleDeleteCompleteChallan = (index: number) => {
    setData((prev) => ({
      ...prev,
      completeChallans: prev.completeChallans.filter((_, i) => i !== index).map((r, i) => ({ ...r, srNo: i + 1 })),
    }));
  };

  const handleCompleteChallanChange = (index: number, field: keyof SitrepDisposalEntry, value: any) => {
    setData((prev) => {
      const updated = [...prev.completeChallans];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, completeChallans: updated };
    });
  };

  // 5b. Section V: Partial Challan
  const handleAddPartialChallan = () => {
    const newEntry: SitrepDisposalEntry = {
      srNo: data.partialChallans.length + 1,
      ps: selectedPs !== "ALL" ? selectedPs : "PS City Panipat",
      firNo: "45/2026 u/s 309 BNS",
      firDate: data.reportDate,
      head: "Robbery",
      accusedArrested: 2,
      type: "Fresh",
      ioDetails: "SI Rajesh Kumar",
      reasonOfPartialChallan: "Co-accused absconding, FSL report pending",
    };
    setData((prev) => ({
      ...prev,
      partialChallans: [...prev.partialChallans, newEntry].map((r, i) => ({ ...r, srNo: i + 1 })),
    }));
  };

  const handleDeletePartialChallan = (index: number) => {
    setData((prev) => ({
      ...prev,
      partialChallans: prev.partialChallans.filter((_, i) => i !== index).map((r, i) => ({ ...r, srNo: i + 1 })),
    }));
  };

  const handlePartialChallanChange = (index: number, field: keyof SitrepDisposalEntry, value: any) => {
    setData((prev) => {
      const updated = [...prev.partialChallans];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, partialChallans: updated };
    });
  };

  // 5c. Section V: Cancellation
  const handleAddCancellation = () => {
    const newEntry: SitrepDisposalEntry = {
      srNo: data.cancellations.length + 1,
      ps: selectedPs !== "ALL" ? selectedPs : "PS City Panipat",
      firNo: "12/2026",
      firDate: data.reportDate,
      head: "Economic Offences",
      reason: "Mistake of Fact",
      ioDetails: "Inspector Surender Singh",
    };
    setData((prev) => ({
      ...prev,
      cancellations: [...prev.cancellations, newEntry].map((r, i) => ({ ...r, srNo: i + 1 })),
    }));
  };

  const handleDeleteCancellation = (index: number) => {
    setData((prev) => ({
      ...prev,
      cancellations: prev.cancellations.filter((_, i) => i !== index).map((r, i) => ({ ...r, srNo: i + 1 })),
    }));
  };

  const handleCancellationChange = (index: number, field: keyof SitrepDisposalEntry, value: any) => {
    setData((prev) => {
      const updated = [...prev.cancellations];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, cancellations: updated };
    });
  };

  // 5d. Section V: Untraced
  const handleAddUntraced = () => {
    const newEntry: SitrepDisposalEntry = {
      srNo: data.untraced.length + 1,
      ps: selectedPs !== "ALL" ? selectedPs : "PS City Panipat",
      firNo: "54/2026",
      firDate: data.reportDate,
      head: "MV Theft",
      byName: "No",
      propertyStolenOrInvolved: "45000",
      ioDetails: "ASI Sandeep Singh",
    };
    setData((prev) => ({
      ...prev,
      untraced: [...prev.untraced, newEntry].map((r, i) => ({ ...r, srNo: i + 1 })),
    }));
  };

  const handleDeleteUntraced = (index: number) => {
    setData((prev) => ({
      ...prev,
      untraced: prev.untraced.filter((_, i) => i !== index).map((r, i) => ({ ...r, srNo: i + 1 })),
    }));
  };

  const handleUntracedChange = (index: number, field: keyof SitrepDisposalEntry, value: any) => {
    setData((prev) => {
      const updated = [...prev.untraced];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, untraced: updated };
    });
  };

  // 6. Section VI: Reopened Cases
  const handleAddReopenedCase = () => {
    const newEntry: SitrepReopenedCase = {
      srNo: data.reopenedCases.length + 1,
      ps: selectedPs !== "ALL" ? selectedPs : "PS City Panipat",
      firNo: "41/2025",
      firDate: "10/11/2025",
      head: "Robbery",
      dateOfLastIif5: "15/01/2026",
      typeOfLastIif5: "Chargesheet (Complete)-UC",
      dateOfReopening: data.reportDate,
      reasonOfReopening: "Because of arrest in the same FIR",
      ioDetails: "SI Rajesh Kumar",
    };
    setData((prev) => ({
      ...prev,
      reopenedCases: [...prev.reopenedCases, newEntry].map((r, i) => ({ ...r, srNo: i + 1 })),
    }));
  };

  const handleDeleteReopenedCase = (index: number) => {
    setData((prev) => ({
      ...prev,
      reopenedCases: prev.reopenedCases.filter((_, i) => i !== index).map((r, i) => ({ ...r, srNo: i + 1 })),
    }));
  };

  const handleReopenedCaseChange = (index: number, field: keyof SitrepReopenedCase, value: any) => {
    setData((prev) => {
      const updated = [...prev.reopenedCases];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, reopenedCases: updated };
    });
  };

  // 7. Section X: Rukka issued
  const handleAddRukka = () => {
    const newEntry: SitrepRukkaEntry = {
      srNo: data.rukkas.length + 1,
      ps: selectedPs !== "ALL" ? selectedPs : "PS City Panipat",
      patientDetails: "Amit Kumar, M, Age 28 S/o Mohan Lal R/o Panipat, Mob: 9812033441",
      rukkaIdHospital: "RUKKA-2026-901, General Hospital Panipat",
      briefDetails: "Assault case, admitted at 09:30 AM, brought by brother.",
    };
    setData((prev) => ({
      ...prev,
      rukkas: [...prev.rukkas, newEntry].map((r, i) => ({ ...r, srNo: i + 1 })),
    }));
  };

  const handleDeleteRukka = (index: number) => {
    setData((prev) => ({
      ...prev,
      rukkas: prev.rukkas.filter((_, i) => i !== index).map((r, i) => ({ ...r, srNo: i + 1 })),
    }));
  };

  const handleRukkaChange = (index: number, field: keyof SitrepRukkaEntry, value: any) => {
    setData((prev) => {
      const updated = [...prev.rukkas];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, rukkas: updated };
    });
  };

  // 8. Section XI: Upload Summaries
  const handleAddUploadSummary = () => {
    const newEntry: SitrepUploadSummary = {
      ps: "PS Sector 29 Panipat",
      registeredPreviousDay: 1,
      uploadedCitizenPortal: 1,
      notUploadedCitizenPortal: 0,
    };
    setData((prev) => ({
      ...prev,
      uploadSummaries: [...prev.uploadSummaries, newEntry],
    }));
  };

  const handleDeleteUploadSummary = (index: number) => {
    setData((prev) => ({
      ...prev,
      uploadSummaries: prev.uploadSummaries.filter((_, i) => i !== index),
    }));
  };

  const handleUploadSummaryChange = (index: number, field: keyof SitrepUploadSummary, value: any) => {
    setData((prev) => {
      const updated = [...prev.uploadSummaries];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, uploadSummaries: updated };
    });
  };

  // Filtered FIRs based on station and search term
  const policeStations = Array.from(new Set(data.firEntries.map((f) => f.ps)));
  const filteredFirs = data.firEntries.filter((f) => {
    const matchPs = selectedPs === "ALL" || f.ps.toLowerCase() === selectedPs.toLowerCase();
    const matchSearch =
      !searchTerm ||
      f.firNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.head.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.complainant.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.accused.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.ioNameRank.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.us.toLowerCase().includes(searchTerm.toLowerCase());
    return matchPs && matchSearch;
  });

  const handlePrint = () => {
    printA4Element("printable-sitrep-document", `CRIME_SITREP_${data.district}_${data.reportDate.replace(/\//g, "-")}`);
  };

  const handleExportCsv = () => {
    const headers = [
      "Sr.No",
      "PS",
      "FIR No",
      "Dated",
      "Crime Head",
      "U/S",
      "Complainant",
      "Complainant Mobile",
      "Victim",
      "Accused",
      "Occurrence From",
      "Occurrence To",
      "Total Property Amount",
      "Place of Occurrence",
      "Brief Facts",
      "Reason of Delay",
      "IO Name & Rank",
      "IO Mobile",
    ];
    const rows = filteredFirs.map((f) => [
      f.srNo,
      `"${f.ps}"`,
      `"${f.firNo}"`,
      `"${f.dated}"`,
      `"${f.head}"`,
      `"${f.us}"`,
      `"${f.complainant}"`,
      `"${f.complainantMobile}"`,
      `"${f.victim}"`,
      `"${f.accused}"`,
      `"${f.occurrenceFrom}"`,
      `"${f.occurrenceTo}"`,
      `"${f.totalPropertyAmount}"`,
      `"${f.placeOfOccurrence}"`,
      `"${f.briefFacts.replace(/"/g, '""')}"`,
      `"${f.reasonOfDelay}"`,
      `"${f.ioNameRank}"`,
      `"${f.ioMobile}"`,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `CRIME_SITREP_${data.district}_${data.reportDate.replace(/\//g, "-")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Dynamic CSS classes based on Density
  const cellPaddingClass = density === "compact" ? "p-1 text-[11px]" : density === "spacious" ? "p-2.5 text-sm" : "p-1.5 text-xs";
  const headerPaddingClass = density === "compact" ? "p-1.5 text-[11px]" : density === "spacious" ? "p-3 text-sm" : "p-2 text-xs";

  // Section Header Component with Reordering and Editable Title
  const renderSectionHeader = (secKey: string, defaultTitle: string, onAddClick?: () => void, addLabel?: string) => {
    const currentTitle = sectionTitles[secKey] || defaultTitle;
    const currentIndex = sectionOrder.indexOf(secKey);

    return (
      <div className="bg-slate-100/90 px-3 py-2 rounded-lg border border-slate-200 mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          {/* Reorder Buttons (Always accessible, hidden in print) */}
          <div className="flex items-center gap-0.5 print:hidden">
            <button
              onClick={() => moveSection(currentIndex, "up")}
              disabled={currentIndex === 0}
              className="p-1 rounded hover:bg-slate-200 text-slate-600 disabled:opacity-20"
              title="Move Section Up (▲)"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => moveSection(currentIndex, "down")}
              disabled={currentIndex === sectionOrder.length - 1}
              className="p-1 rounded hover:bg-slate-200 text-slate-600 disabled:opacity-20"
              title="Move Section Down (▼)"
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Editable Section Title */}
          {editingTitleKey === secKey ? (
            <input
              type="text"
              value={currentTitle}
              autoFocus
              onBlur={() => setEditingTitleKey(null)}
              onChange={(e) => handleTitleChange(secKey, e.target.value)}
              className="text-xs sm:text-sm font-black text-slate-900 bg-white border border-blue-400 rounded px-2 py-0.5 flex-1"
            />
          ) : (
            <div
              onClick={() => setEditingTitleKey(secKey)}
              className="flex items-center gap-1.5 cursor-pointer group/title"
              title="Click to edit section title"
            >
              <h3 className="text-xs sm:text-sm font-black text-slate-900 group-hover/title:text-blue-900">
                {currentTitle}
              </h3>
              <Edit2 className="w-3 h-3 text-slate-400 opacity-0 group-hover/title:opacity-100 print:hidden" />
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 print:hidden">
          {onAddClick && (
            <button
              onClick={onAddClick}
              className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-md shadow-2xs"
            >
              <Plus className="w-3 h-3" />
              <span>{addLabel || "Add Row"}</span>
            </button>
          )}

          <button
            onClick={() => toggleHideSection(secKey)}
            className="p-1 rounded hover:bg-slate-200 text-slate-500 hover:text-slate-800"
            title="Hide this section from document"
          >
            <EyeOff className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  };

  // --- SECTION RENDERERS ---

  // 1. Crime Summary
  const renderSummarySection = () => (
    <section key="summary" className="mb-6">
      {renderSectionHeader("summary", "Crime Summary — Page 1")}
      <div className="overflow-x-auto">
        <table className={`w-full ${cellPaddingClass} border border-slate-300 text-left`}>
          <thead className={`bg-slate-100 font-bold border-b border-slate-300 ${headerPaddingClass}`}>
            <tr>
              <th className="p-2 border-r border-slate-300 w-16 text-center">Sr. No.</th>
              <th className="p-2 border-r border-slate-300">HEAD</th>
              <th className="p-2 w-36 text-center">TOTAL NUMBER</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {data.section1HeadCounts.map((row, idx) => {
              const isTotalRow = row.head.includes("Total");
              return (
                <tr
                  key={row.srNo}
                  className={isTotalRow ? "bg-slate-100/80 font-black text-slate-900" : "hover:bg-slate-50/50"}
                >
                  <td className="p-1.5 border-r border-slate-300 text-center font-mono font-bold">{row.srNo}</td>
                  <td className="p-1.5 border-r border-slate-300 font-medium">
                    <input
                      type="text"
                      value={row.head}
                      onChange={(e) => handleHeadNameChange(idx, e.target.value)}
                      className="w-full bg-transparent border-0 focus:outline-none focus:bg-white focus:ring-1 focus:ring-slate-300 rounded px-1"
                    />
                  </td>
                  <td className="p-1.5 text-center font-mono font-bold">
                    <input
                      type="text"
                      value={row.totalNumber}
                      onChange={(e) => handleHeadCountChange(idx, e.target.value)}
                      className="w-16 text-center bg-transparent border-b border-dotted border-slate-300 focus:outline-none focus:border-slate-800"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );

  // 2. Section I: Registration of FIR
  const renderSec1Firs = () => (
    <section key="sec_1" className="mb-8">
      {renderSectionHeader("sec_1", `Section I: Registration of FIR on ${data.reportDate} (Pages 2–6)`, handleAddFir, "Add FIR Dossier")}
      <div className="space-y-4">
        {filteredFirs.length === 0 ? (
          <div className="p-6 text-center rounded-xl border border-dashed border-slate-300 text-slate-500 bg-slate-50">
            <p className="text-xs font-semibold">कोई एफ.आई.आर दर्ज नहीं है (Nil / No FIR records for selected date/station)</p>
            <button onClick={handleAddFir} className="mt-2 text-xs font-bold text-blue-900 underline print:hidden">
              + मैन्युअल रूप से FIR जोड़ें (Add Manual FIR)
            </button>
          </div>
        ) : (
          filteredFirs.map((f, idx) => (
            <div
              key={f.firNo + f.ps + idx}
              className={`p-4 rounded-xl border border-slate-200 bg-white space-y-2 leading-relaxed relative group hover:border-slate-400 transition-colors ${density === "compact" ? "text-[11px]" : density === "spacious" ? "text-sm" : "text-xs"}`}
            >
              {/* Delete Button */}
              <button
                onClick={() => handleDeleteFir(idx)}
                className="absolute top-3 right-3 p-1.5 rounded-md text-slate-400 hover:text-red-700 hover:bg-red-50 opacity-60 group-hover:opacity-100 transition-all print:hidden"
                title="Delete FIR Dossier"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              {/* Header: Sr, Station, Crime Head, Section */}
              <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-2 pr-8">
                <span className="text-blue-900 font-black text-sm">{f.srNo}.</span>
                <span className="font-bold text-slate-900 uppercase">P.S:</span>
                <input
                  type="text"
                  value={f.ps}
                  onChange={(e) => handleFirChange(idx, "ps", e.target.value)}
                  className="font-bold text-slate-900 uppercase bg-transparent border-b border-transparent hover:border-slate-300 focus:border-slate-800 outline-none px-1"
                />
                <span className="text-slate-400">&mdash;</span>
                <input
                  type="text"
                  value={f.head}
                  onChange={(e) => handleFirChange(idx, "head", e.target.value)}
                  className="font-bold text-red-700 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-slate-800 outline-none px-1"
                />
                <input
                  type="text"
                  value={f.ipcSections || ""}
                  placeholder="Sections"
                  onChange={(e) => handleFirChange(idx, "ipcSections", e.target.value)}
                  className="text-slate-500 font-mono text-[11px] bg-transparent border-b border-transparent hover:border-slate-300 focus:border-slate-800 outline-none px-1"
                />
              </div>

              {/* FIR Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px]">
                <div>
                  <span className="font-bold text-slate-700">FIR No: </span>
                  <input
                    type="text"
                    value={f.firNo}
                    onChange={(e) => handleFirChange(idx, "firNo", e.target.value)}
                    className="font-mono font-bold text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-slate-800 outline-none px-1 w-24"
                  />
                  <span className="font-bold text-slate-700 ml-2">Dated: </span>
                  <input
                    type="text"
                    value={f.dated}
                    onChange={(e) => handleFirChange(idx, "dated", e.target.value)}
                    className="font-mono text-slate-800 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-slate-800 outline-none px-1"
                  />
                </div>
                <div>
                  <span className="font-bold text-slate-700">U/S: </span>
                  <input
                    type="text"
                    value={f.us}
                    onChange={(e) => handleFirChange(idx, "us", e.target.value)}
                    className="font-mono font-bold text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-slate-800 outline-none px-1 w-full"
                  />
                </div>
              </div>

              {/* Complainant, Victim, Accused details */}
              <div className="space-y-1 text-[11px] bg-slate-50/80 p-2.5 rounded-lg border border-slate-200/60">
                <div className="flex items-center gap-1">
                  <span className="font-bold text-slate-700 whitespace-nowrap">Complainant:</span>
                  <input
                    type="text"
                    value={f.complainant}
                    onChange={(e) => handleFirChange(idx, "complainant", e.target.value)}
                    className="w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-slate-800 outline-none px-1"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-bold text-slate-700 whitespace-nowrap">Victim:</span>
                  <input
                    type="text"
                    value={f.victim}
                    onChange={(e) => handleFirChange(idx, "victim", e.target.value)}
                    className="w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-slate-800 outline-none px-1"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-bold text-slate-700 whitespace-nowrap">Accused:</span>
                  <input
                    type="text"
                    value={f.accused}
                    onChange={(e) => handleFirChange(idx, "accused", e.target.value)}
                    className="w-full text-red-950 font-medium bg-transparent border-b border-transparent hover:border-slate-300 focus:border-slate-800 outline-none px-1"
                  />
                </div>
              </div>

              {/* Occurrence & Property */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px] text-slate-700">
                <div className="flex items-center gap-1">
                  <span className="font-semibold whitespace-nowrap">Occurrence From:</span>
                  <input
                    type="text"
                    value={f.occurrenceFrom}
                    onChange={(e) => handleFirChange(idx, "occurrenceFrom", e.target.value)}
                    className="font-mono bg-transparent border-b border-transparent hover:border-slate-300 focus:border-slate-800 outline-none px-1 w-full"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-semibold whitespace-nowrap">Occurrence To:</span>
                  <input
                    type="text"
                    value={f.occurrenceTo}
                    onChange={(e) => handleFirChange(idx, "occurrenceTo", e.target.value)}
                    className="font-mono bg-transparent border-b border-transparent hover:border-slate-300 focus:border-slate-800 outline-none px-1 w-full"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-semibold whitespace-nowrap">Property Amount:</span>
                  <input
                    type="text"
                    value={f.totalPropertyAmount}
                    onChange={(e) => handleFirChange(idx, "totalPropertyAmount", e.target.value)}
                    className="font-mono font-bold bg-transparent border-b border-transparent hover:border-slate-300 focus:border-slate-800 outline-none px-1 w-full"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-semibold whitespace-nowrap">Place:</span>
                  <input
                    type="text"
                    value={f.placeOfOccurrence}
                    onChange={(e) => handleFirChange(idx, "placeOfOccurrence", e.target.value)}
                    className="bg-transparent border-b border-transparent hover:border-slate-300 focus:border-slate-800 outline-none px-1 w-full"
                  />
                </div>
              </div>

              {/* Brief facts */}
              <div className="text-[11px] text-slate-800 pt-1 border-t border-slate-100 flex items-start gap-1">
                <span className="font-bold text-slate-900 whitespace-nowrap">Brief facts:</span>
                <textarea
                  rows={2}
                  value={f.briefFacts}
                  onChange={(e) => handleFirChange(idx, "briefFacts", e.target.value)}
                  className="w-full italic bg-transparent border-b border-transparent hover:border-slate-300 focus:border-slate-800 outline-none px-1 resize-y"
                />
              </div>

              {/* Reason of Delay & IO Contact */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-[11px] border-t border-slate-100 bg-slate-50/50 p-2 rounded">
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-slate-600 whitespace-nowrap">Reason of Delay:</span>
                  <input
                    type="text"
                    value={f.reasonOfDelay}
                    onChange={(e) => handleFirChange(idx, "reasonOfDelay", e.target.value)}
                    className="bg-transparent border-b border-transparent hover:border-slate-300 focus:border-slate-800 outline-none px-1"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-bold text-slate-800 whitespace-nowrap">I.O:</span>
                  <input
                    type="text"
                    value={f.ioNameRank}
                    onChange={(e) => handleFirChange(idx, "ioNameRank", e.target.value)}
                    className="bg-transparent border-b border-transparent hover:border-slate-300 focus:border-slate-800 outline-none px-1"
                  />
                  <input
                    type="text"
                    value={f.ioMobile}
                    placeholder="IO Mob"
                    onChange={(e) => handleFirChange(idx, "ioMobile", e.target.value)}
                    className="font-mono text-slate-500 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-slate-800 outline-none px-1 w-28"
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );

  // 3. Section II: Accused arrested
  const renderSec2Arrests = () => (
    <section key="sec_2" className="mb-8">
      {renderSectionHeader("sec_2", `Section II: Accused arrested on ${data.reportDate} (Pages 7–8)`, handleAddArrest, "Add Arrest")}
      <div className="overflow-x-auto">
        <table className={`w-full ${cellPaddingClass} border border-slate-300 text-left`}>
          <thead className={`bg-slate-100 font-bold border-b border-slate-300 ${headerPaddingClass}`}>
            <tr>
              <th className="p-2 border-r border-slate-300 w-10 text-center">SNo.</th>
              <th className="p-2 border-r border-slate-300 w-28">GD No. / Arrest Time</th>
              <th className="p-2 border-r border-slate-300 w-28">PS</th>
              <th className="p-2 border-r border-slate-300">FIR No. and U/S</th>
              <th className="p-2 border-r border-slate-300">Head</th>
              <th className="p-2 border-r border-slate-300 w-24">FIR Date</th>
              <th className="p-2 border-r border-slate-300">Details of Accused</th>
              <th className="p-2 border-r border-slate-300">Details of IO</th>
              <th className="p-1 w-10 text-center print:hidden">Act</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {data.arrests.length > 0 ? (
              data.arrests.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="p-1.5 border-r border-slate-300 text-center font-mono">{idx + 1}</td>
                  <td className="p-1.5 border-r border-slate-300 font-mono text-[11px]">
                    <textarea
                      rows={2}
                      value={row.gdNoArrestTime}
                      onChange={(e) => handleArrestChange(idx, "gdNoArrestTime", e.target.value)}
                      className="w-full bg-transparent border-0 focus:outline-none focus:bg-white resize-none"
                    />
                  </td>
                  <td className="p-1.5 border-r border-slate-300 font-bold">
                    <input
                      type="text"
                      value={row.ps}
                      onChange={(e) => handleArrestChange(idx, "ps", e.target.value)}
                      className="w-full bg-transparent border-0 focus:outline-none focus:bg-white"
                    />
                  </td>
                  <td className="p-1.5 border-r border-slate-300 font-mono text-[11px]">
                    <input
                      type="text"
                      value={row.firNoAndUs}
                      onChange={(e) => handleArrestChange(idx, "firNoAndUs", e.target.value)}
                      className="w-full bg-transparent border-0 focus:outline-none focus:bg-white"
                    />
                  </td>
                  <td className="p-1.5 border-r border-slate-300">
                    <input
                      type="text"
                      value={row.head}
                      onChange={(e) => handleArrestChange(idx, "head", e.target.value)}
                      className="w-full bg-transparent border-0 focus:outline-none focus:bg-white"
                    />
                  </td>
                  <td className="p-1.5 border-r border-slate-300 font-mono text-[11px]">
                    <input
                      type="text"
                      value={row.firDate}
                      onChange={(e) => handleArrestChange(idx, "firDate", e.target.value)}
                      className="w-full bg-transparent border-0 focus:outline-none focus:bg-white"
                    />
                  </td>
                  <td className="p-1.5 border-r border-slate-300 font-medium">
                    <textarea
                      rows={2}
                      value={row.accusedDetails}
                      onChange={(e) => handleArrestChange(idx, "accusedDetails", e.target.value)}
                      className="w-full bg-transparent border-0 focus:outline-none focus:bg-white resize-none"
                    />
                  </td>
                  <td className="p-1.5 border-r border-slate-300 text-[11px]">
                    <textarea
                      rows={2}
                      value={row.ioDetails}
                      onChange={(e) => handleArrestChange(idx, "ioDetails", e.target.value)}
                      className="w-full bg-transparent border-0 focus:outline-none focus:bg-white resize-none"
                    />
                  </td>
                  <td className="p-1 text-center print:hidden">
                    <button onClick={() => handleDeleteArrest(idx)} className="text-slate-400 hover:text-red-700">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={9} className="p-4 text-center text-slate-500 italic font-medium">
                  Nil (कोई अभियुक्त गिरफ्तार नहीं)
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );

  // 4. Section III: Recoveries
  const renderSec3Recoveries = () => (
    <section key="sec_3" className="mb-8">
      {renderSectionHeader("sec_3", `Section III: Case Property Recovered/Seized on ${data.reportDate} (Pages 8–12)`, handleAddRecovery, "Add Recovery")}
      <div className="overflow-x-auto">
        <table className={`w-full ${cellPaddingClass} border border-slate-300 text-left`}>
          <thead className={`bg-slate-100 font-bold border-b border-slate-300 ${headerPaddingClass}`}>
            <tr>
              <th className="p-2 border-r border-slate-300 w-10 text-center">SNo.</th>
              <th className="p-2 border-r border-slate-300 w-28">GD No. / Recovery Time</th>
              <th className="p-2 border-r border-slate-300 w-28">PS</th>
              <th className="p-2 border-r border-slate-300">FIR No. and U/S</th>
              <th className="p-2 border-r border-slate-300">Head</th>
              <th className="p-2 border-r border-slate-300 w-24">FIR Date</th>
              <th className="p-2 border-r border-slate-300">Recovered Items</th>
              <th className="p-2 border-r border-slate-300">Details of IO</th>
              <th className="p-1 w-10 text-center print:hidden">Act</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {data.recoveries.length > 0 ? (
              data.recoveries.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="p-1.5 border-r border-slate-300 text-center font-mono">{idx + 1}</td>
                  <td className="p-1.5 border-r border-slate-300 font-mono text-[11px]">
                    <textarea
                      rows={2}
                      value={row.gdNoRecoveryTime}
                      onChange={(e) => handleRecoveryChange(idx, "gdNoRecoveryTime", e.target.value)}
                      className="w-full bg-transparent border-0 focus:outline-none focus:bg-white resize-none"
                    />
                  </td>
                  <td className="p-1.5 border-r border-slate-300 font-bold">
                    <input
                      type="text"
                      value={row.ps}
                      onChange={(e) => handleRecoveryChange(idx, "ps", e.target.value)}
                      className="w-full bg-transparent border-0 focus:outline-none focus:bg-white"
                    />
                  </td>
                  <td className="p-1.5 border-r border-slate-300 font-mono text-[11px]">
                    <input
                      type="text"
                      value={row.firNoAndUs}
                      onChange={(e) => handleRecoveryChange(idx, "firNoAndUs", e.target.value)}
                      className="w-full bg-transparent border-0 focus:outline-none focus:bg-white"
                    />
                  </td>
                  <td className="p-1.5 border-r border-slate-300">
                    <input
                      type="text"
                      value={row.head}
                      onChange={(e) => handleRecoveryChange(idx, "head", e.target.value)}
                      className="w-full bg-transparent border-0 focus:outline-none focus:bg-white"
                    />
                  </td>
                  <td className="p-1.5 border-r border-slate-300 font-mono text-[11px]">
                    <input
                      type="text"
                      value={row.firDate}
                      onChange={(e) => handleRecoveryChange(idx, "firDate", e.target.value)}
                      className="w-full bg-transparent border-0 focus:outline-none focus:bg-white"
                    />
                  </td>
                  <td className="p-1.5 border-r border-slate-300 font-medium text-emerald-900">
                    <textarea
                      rows={2}
                      value={row.recoveredItems}
                      onChange={(e) => handleRecoveryChange(idx, "recoveredItems", e.target.value)}
                      className="w-full bg-transparent border-0 focus:outline-none focus:bg-white resize-none text-emerald-900 font-medium"
                    />
                  </td>
                  <td className="p-1.5 border-r border-slate-300 text-[11px]">
                    <textarea
                      rows={2}
                      value={row.ioDetails}
                      onChange={(e) => handleRecoveryChange(idx, "ioDetails", e.target.value)}
                      className="w-full bg-transparent border-0 focus:outline-none focus:bg-white resize-none"
                    />
                  </td>
                  <td className="p-1 text-center print:hidden">
                    <button onClick={() => handleDeleteRecovery(idx)} className="text-slate-400 hover:text-red-700">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={9} className="p-4 text-center text-slate-500 italic font-medium">
                  Nil (कोई संपत्ति बरामद / जब्त नहीं)
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );

  // 5. Section IV: Modifications
  const renderSec4Modifications = () => (
    <section key="sec_4" className="mb-8">
      {renderSectionHeader("sec_4", "Section IV: Modification of sections (Pages 12–13)", handleAddModification, "Add Modification")}
      <div className="overflow-x-auto">
        <table className={`w-full ${cellPaddingClass} border border-slate-300 text-left`}>
          <thead className={`bg-slate-100 font-bold border-b border-slate-300 ${headerPaddingClass}`}>
            <tr>
              <th className="p-1.5 border-r border-slate-300 w-10 text-center">SNo.</th>
              <th className="p-1.5 border-r border-slate-300">PS</th>
              <th className="p-1.5 border-r border-slate-300">FIR No.</th>
              <th className="p-1.5 border-r border-slate-300 w-24">FIR Date</th>
              <th className="p-1.5 border-r border-slate-300">Original Section</th>
              <th className="p-1.5 border-r border-slate-300 text-emerald-800 font-bold">Section Added</th>
              <th className="p-1.5 border-r border-slate-300 text-red-700">Section Removed</th>
              <th className="p-1.5 border-r border-slate-300">Head</th>
              <th className="p-1.5 border-r border-slate-300 w-24">Mod. Date</th>
              <th className="p-1.5 border-r border-slate-300">Details of IO</th>
              <th className="p-1 w-8 text-center print:hidden">Act</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {data.modifications.length > 0 ? (
              data.modifications.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="p-1.5 border-r border-slate-300 text-center font-mono">{idx + 1}</td>
                  <td className="p-1.5 border-r border-slate-300 font-bold">
                    <input
                      type="text"
                      value={row.ps}
                      onChange={(e) => handleModificationChange(idx, "ps", e.target.value)}
                      className="w-full bg-transparent border-0 focus:outline-none focus:bg-white"
                    />
                  </td>
                  <td className="p-1.5 border-r border-slate-300 font-mono">
                    <input
                      type="text"
                      value={row.firNo}
                      onChange={(e) => handleModificationChange(idx, "firNo", e.target.value)}
                      className="w-full bg-transparent border-0 focus:outline-none focus:bg-white"
                    />
                  </td>
                  <td className="p-1.5 border-r border-slate-300 font-mono text-[11px]">
                    <input
                      type="text"
                      value={row.firDate}
                      onChange={(e) => handleModificationChange(idx, "firDate", e.target.value)}
                      className="w-full bg-transparent border-0 focus:outline-none focus:bg-white"
                    />
                  </td>
                  <td className="p-1.5 border-r border-slate-300 font-mono text-[11px]">
                    <input
                      type="text"
                      value={row.originalSection}
                      onChange={(e) => handleModificationChange(idx, "originalSection", e.target.value)}
                      className="w-full bg-transparent border-0 focus:outline-none focus:bg-white"
                    />
                  </td>
                  <td className="p-1.5 border-r border-slate-300 font-mono font-bold text-emerald-800">
                    <input
                      type="text"
                      value={row.sectionAdded}
                      onChange={(e) => handleModificationChange(idx, "sectionAdded", e.target.value)}
                      className="w-full bg-transparent border-0 focus:outline-none focus:bg-white text-emerald-800 font-bold"
                    />
                  </td>
                  <td className="p-1.5 border-r border-slate-300 font-mono text-red-600">
                    <input
                      type="text"
                      value={row.sectionRemoved}
                      onChange={(e) => handleModificationChange(idx, "sectionRemoved", e.target.value)}
                      className="w-full bg-transparent border-0 focus:outline-none focus:bg-white text-red-600"
                    />
                  </td>
                  <td className="p-1.5 border-r border-slate-300">
                    <input
                      type="text"
                      value={row.head}
                      onChange={(e) => handleModificationChange(idx, "head", e.target.value)}
                      className="w-full bg-transparent border-0 focus:outline-none focus:bg-white"
                    />
                  </td>
                  <td className="p-1.5 border-r border-slate-300 font-mono text-[11px]">
                    <input
                      type="text"
                      value={row.dateOfModification}
                      onChange={(e) => handleModificationChange(idx, "dateOfModification", e.target.value)}
                      className="w-full bg-transparent border-0 focus:outline-none focus:bg-white"
                    />
                  </td>
                  <td className="p-1.5 border-r border-slate-300 text-[11px]">
                    <input
                      type="text"
                      value={row.ioDetails}
                      onChange={(e) => handleModificationChange(idx, "ioDetails", e.target.value)}
                      className="w-full bg-transparent border-0 focus:outline-none focus:bg-white"
                    />
                  </td>
                  <td className="p-1 text-center print:hidden">
                    <button onClick={() => handleDeleteModification(idx)} className="text-slate-400 hover:text-red-700">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={11} className="p-4 text-center text-slate-500 italic font-medium">
                  Nil (धाराओं में कोई संशोधन नहीं)
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );

  // 6. Section V: Disposal of Cases
  const renderSec5Disposals = () => (
    <section key="sec_5" className="mb-8 space-y-6">
      {renderSectionHeader("sec_5", "Section V: Disposal of Cases (Pages 13–16)")}

      {/* 5a. Complete Challan */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
            1. Complete Challan (Fresh / Supplementary)
          </h4>
          <button
            onClick={handleAddCompleteChallan}
            className="text-[11px] font-bold text-blue-900 hover:underline print:hidden"
          >
            + Add Complete Challan
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className={`w-full ${cellPaddingClass} border border-slate-300 text-left`}>
            <thead className={`bg-slate-100 font-bold border-b border-slate-300 ${headerPaddingClass}`}>
              <tr>
                <th className="p-1.5 border-r border-slate-300 w-10 text-center">SNo.</th>
                <th className="p-1.5 border-r border-slate-300">PS</th>
                <th className="p-1.5 border-r border-slate-300">FIR No.</th>
                <th className="p-1.5 border-r border-slate-300 w-24">FIR Date</th>
                <th className="p-1.5 border-r border-slate-300">Head</th>
                <th className="p-1.5 border-r border-slate-300 text-center">Accused Arrested</th>
                <th className="p-1.5 border-r border-slate-300 text-center">Challan Type</th>
                <th className="p-1.5 border-r border-slate-300">Details of IO</th>
                <th className="p-1 w-8 text-center print:hidden">Act</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {data.completeChallans.length > 0 ? (
                data.completeChallans.map((c, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="p-1.5 border-r border-slate-300 text-center font-mono">{idx + 1}</td>
                    <td className="p-1.5 border-r border-slate-300 font-bold">
                      <input
                        type="text"
                        value={c.ps}
                        onChange={(e) => handleCompleteChallanChange(idx, "ps", e.target.value)}
                        className="w-full bg-transparent border-0 focus:outline-none focus:bg-white"
                      />
                    </td>
                    <td className="p-1.5 border-r border-slate-300 font-mono">
                      <input
                        type="text"
                        value={c.firNo}
                        onChange={(e) => handleCompleteChallanChange(idx, "firNo", e.target.value)}
                        className="w-full bg-transparent border-0 focus:outline-none focus:bg-white"
                      />
                    </td>
                    <td className="p-1.5 border-r border-slate-300 font-mono text-[11px]">
                      <input
                        type="text"
                        value={c.firDate}
                        onChange={(e) => handleCompleteChallanChange(idx, "firDate", e.target.value)}
                        className="w-full bg-transparent border-0 focus:outline-none focus:bg-white"
                      />
                    </td>
                    <td className="p-1.5 border-r border-slate-300">
                      <input
                        type="text"
                        value={c.head}
                        onChange={(e) => handleCompleteChallanChange(idx, "head", e.target.value)}
                        className="w-full bg-transparent border-0 focus:outline-none focus:bg-white"
                      />
                    </td>
                    <td className="p-1.5 border-r border-slate-300 text-center font-mono font-bold">
                      <input
                        type="number"
                        value={c.accusedArrested || 0}
                        onChange={(e) => handleCompleteChallanChange(idx, "accusedArrested", Number(e.target.value))}
                        className="w-12 text-center bg-transparent border-0 focus:outline-none focus:bg-white"
                      />
                    </td>
                    <td className="p-1.5 border-r border-slate-300 text-center font-semibold text-emerald-800">
                      <input
                        type="text"
                        value={c.type}
                        onChange={(e) => handleCompleteChallanChange(idx, "type", e.target.value)}
                        className="w-16 text-center bg-transparent border-0 focus:outline-none focus:bg-white"
                      />
                    </td>
                    <td className="p-1.5 border-r border-slate-300 text-[11px]">
                      <input
                        type="text"
                        value={c.ioDetails}
                        onChange={(e) => handleCompleteChallanChange(idx, "ioDetails", e.target.value)}
                        className="w-full bg-transparent border-0 focus:outline-none focus:bg-white"
                      />
                    </td>
                    <td className="p-1 text-center print:hidden">
                      <button onClick={() => handleDeleteCompleteChallan(idx)} className="text-slate-400 hover:text-red-700">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="p-2.5 text-center text-slate-500 italic font-medium">Nil</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5b. Partial Challan */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
            2. Partial Challan (Pending Arrests / Reports)
          </h4>
          <button
            onClick={handleAddPartialChallan}
            className="text-[11px] font-bold text-blue-900 hover:underline print:hidden"
          >
            + Add Partial Challan
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className={`w-full ${cellPaddingClass} border border-slate-300 text-left`}>
            <thead className={`bg-slate-100 font-bold border-b border-slate-300 ${headerPaddingClass}`}>
              <tr>
                <th className="p-1.5 border-r border-slate-300 w-10 text-center">SNo.</th>
                <th className="p-1.5 border-r border-slate-300">PS</th>
                <th className="p-1.5 border-r border-slate-300">FIR No.</th>
                <th className="p-1.5 border-r border-slate-300 w-24">FIR Date</th>
                <th className="p-1.5 border-r border-slate-300">Head</th>
                <th className="p-1.5 border-r border-slate-300 text-center">Accused Arrested</th>
                <th className="p-1.5 border-r border-slate-300 text-center">Challan Type</th>
                <th className="p-1.5 border-r border-slate-300">Details of IO</th>
                <th className="p-1.5 border-r border-slate-300">Reason of Partial Challan</th>
                <th className="p-1 w-8 text-center print:hidden">Act</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {data.partialChallans.length > 0 ? (
                data.partialChallans.map((c, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="p-1.5 border-r border-slate-300 text-center font-mono">{idx + 1}</td>
                    <td className="p-1.5 border-r border-slate-300 font-bold">{c.ps}</td>
                    <td className="p-1.5 border-r border-slate-300 font-mono">{c.firNo}</td>
                    <td className="p-1.5 border-r border-slate-300 font-mono text-[11px]">{c.firDate}</td>
                    <td className="p-1.5 border-r border-slate-300">{c.head}</td>
                    <td className="p-1.5 border-r border-slate-300 text-center font-mono">{c.accusedArrested}</td>
                    <td className="p-1.5 border-r border-slate-300 text-center font-semibold text-amber-800">{c.type}</td>
                    <td className="p-1.5 border-r border-slate-300 text-[11px]">{c.ioDetails}</td>
                    <td className="p-1.5 border-r border-slate-300 text-[11px] text-amber-900 font-medium">{c.reasonOfPartialChallan}</td>
                    <td className="p-1 text-center print:hidden">
                      <button onClick={() => handleDeletePartialChallan(idx)} className="text-slate-400 hover:text-red-700">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="p-2.5 text-center text-slate-500 italic font-medium">Nil</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5c. Cancellation */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
            3. Cancellation (False / Mistake of Fact)
          </h4>
          <button
            onClick={handleAddCancellation}
            className="text-[11px] font-bold text-blue-900 hover:underline print:hidden"
          >
            + Add Cancellation
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className={`w-full ${cellPaddingClass} border border-slate-300 text-left`}>
            <thead className={`bg-slate-100 font-bold border-b border-slate-300 ${headerPaddingClass}`}>
              <tr>
                <th className="p-1.5 border-r border-slate-300 w-10 text-center">SNo.</th>
                <th className="p-1.5 border-r border-slate-300">PS</th>
                <th className="p-1.5 border-r border-slate-300">FIR No.</th>
                <th className="p-1.5 border-r border-slate-300 w-24">FIR Date</th>
                <th className="p-1.5 border-r border-slate-300">Head</th>
                <th className="p-1.5 border-r border-slate-300">Name of IO</th>
                <th className="p-1.5 border-r border-slate-300">Reason of Cancellation</th>
                <th className="p-1 w-8 text-center print:hidden">Act</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {data.cancellations.length > 0 ? (
                data.cancellations.map((c, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="p-1.5 border-r border-slate-300 text-center font-mono">{idx + 1}</td>
                    <td className="p-1.5 border-r border-slate-300 font-bold">{c.ps}</td>
                    <td className="p-1.5 border-r border-slate-300 font-mono">{c.firNo}</td>
                    <td className="p-1.5 border-r border-slate-300 font-mono text-[11px]">{c.firDate}</td>
                    <td className="p-1.5 border-r border-slate-300">{c.head}</td>
                    <td className="p-1.5 border-r border-slate-300 text-[11px]">{c.ioDetails}</td>
                    <td className="p-1.5 border-r border-slate-300 font-medium text-red-700">{c.reason}</td>
                    <td className="p-1 text-center print:hidden">
                      <button onClick={() => handleDeleteCancellation(idx)} className="text-slate-400 hover:text-red-700">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="p-2.5 text-center text-slate-500 italic font-medium">Nil</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5d. Untraced */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
            4. Untraced Cases (Unsolved)
          </h4>
          <button
            onClick={handleAddUntraced}
            className="text-[11px] font-bold text-blue-900 hover:underline print:hidden"
          >
            + Add Untraced Row
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className={`w-full ${cellPaddingClass} border border-slate-300 text-left`}>
            <thead className={`bg-slate-100 font-bold border-b border-slate-300 ${headerPaddingClass}`}>
              <tr>
                <th className="p-1.5 border-r border-slate-300 w-10 text-center">SNo.</th>
                <th className="p-1.5 border-r border-slate-300">PS</th>
                <th className="p-1.5 border-r border-slate-300">FIR No.</th>
                <th className="p-1.5 border-r border-slate-300 w-24">FIR Date</th>
                <th className="p-1.5 border-r border-slate-300">Head</th>
                <th className="p-1.5 border-r border-slate-300 text-center">By Name (Yes/No)</th>
                <th className="p-1.5 border-r border-slate-300">Property Amount Stolen/Involved</th>
                <th className="p-1.5 border-r border-slate-300">Details of IO</th>
                <th className="p-1 w-8 text-center print:hidden">Act</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {data.untraced.length > 0 ? (
                data.untraced.map((u, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="p-1.5 border-r border-slate-300 text-center font-mono">{idx + 1}</td>
                    <td className="p-1.5 border-r border-slate-300 font-bold">{u.ps}</td>
                    <td className="p-1.5 border-r border-slate-300 font-mono">{u.firNo}</td>
                    <td className="p-1.5 border-r border-slate-300 font-mono text-[11px]">{u.firDate}</td>
                    <td className="p-1.5 border-r border-slate-300">{u.head}</td>
                    <td className="p-1.5 border-r border-slate-300 text-center font-semibold">{u.byName}</td>
                    <td className="p-1.5 border-r border-slate-300 font-mono">₹ {u.propertyStolenOrInvolved}</td>
                    <td className="p-1.5 border-r border-slate-300 text-[11px]">{u.ioDetails}</td>
                    <td className="p-1 text-center print:hidden">
                      <button onClick={() => handleDeleteUntraced(idx)} className="text-slate-400 hover:text-red-700">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="p-2.5 text-center text-slate-500 italic font-medium">Nil</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );

  // 7. Section VI: Cases reopened for investigation
  const renderSec6Reopened = () => (
    <section key="sec_6" className="mb-8">
      {renderSectionHeader("sec_6", "Section VI: Cases reopened for investigation (Page 16)", handleAddReopenedCase, "Add Reopened Case")}
      <div className="overflow-x-auto">
        <table className={`w-full ${cellPaddingClass} border border-slate-300 text-left`}>
          <thead className={`bg-slate-100 font-bold border-b border-slate-300 ${headerPaddingClass}`}>
            <tr>
              <th className="p-1.5 border-r border-slate-300 w-10 text-center">SNo.</th>
              <th className="p-1.5 border-r border-slate-300">PS</th>
              <th className="p-1.5 border-r border-slate-300">FIR No.</th>
              <th className="p-1.5 border-r border-slate-300 w-24">FIR Date</th>
              <th className="p-1.5 border-r border-slate-300">Head</th>
              <th className="p-1.5 border-r border-slate-300 w-24">Date of Last IIF-5</th>
              <th className="p-1.5 border-r border-slate-300">Type of last IIF-5</th>
              <th className="p-1.5 border-r border-slate-300 w-24">Date of Reopening</th>
              <th className="p-1.5 border-r border-slate-300">Reason of Reopening</th>
              <th className="p-1.5 border-r border-slate-300">Details of IO</th>
              <th className="p-1 w-8 text-center print:hidden">Act</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {data.reopenedCases.length > 0 ? (
              data.reopenedCases.map((r, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="p-1.5 border-r border-slate-300 text-center font-mono">{idx + 1}</td>
                  <td className="p-1.5 border-r border-slate-300 font-bold">{r.ps}</td>
                  <td className="p-1.5 border-r border-slate-300 font-mono">{r.firNo}</td>
                  <td className="p-1.5 border-r border-slate-300 font-mono text-[11px]">{r.firDate}</td>
                  <td className="p-1.5 border-r border-slate-300">{r.head}</td>
                  <td className="p-1.5 border-r border-slate-300 font-mono text-[11px]">{r.dateOfLastIif5}</td>
                  <td className="p-1.5 border-r border-slate-300 text-[11px]">{r.typeOfLastIif5}</td>
                  <td className="p-1.5 border-r border-slate-300 font-mono text-[11px]">{r.dateOfReopening}</td>
                  <td className="p-1.5 border-r border-slate-300 text-[11px] font-medium">{r.reasonOfReopening}</td>
                  <td className="p-1.5 border-r border-slate-300 text-[11px]">{r.ioDetails}</td>
                  <td className="p-1 text-center print:hidden">
                    <button onClick={() => handleDeleteReopenedCase(idx)} className="text-slate-400 hover:text-red-700">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={11} className="p-4 text-center text-slate-500 italic font-medium">
                  Nil (कोई केस पुनः जांच हेतु नहीं खोला गया)
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );

  // 8. Section X: Rukka issued
  const renderSec10Rukkas = () => (
    <section key="sec_10" className="mb-8">
      {renderSectionHeader("sec_10", "Section X: Rukka issued (Pages 16–19)", handleAddRukka, "Add Rukka Row")}
      <div className="overflow-x-auto">
        <table className={`w-full ${cellPaddingClass} border border-slate-300 text-left`}>
          <thead className={`bg-slate-100 font-bold border-b border-slate-300 ${headerPaddingClass}`}>
            <tr>
              <th className="p-2 border-r border-slate-300 w-10 text-center">SNo.</th>
              <th className="p-2 border-r border-slate-300 w-32">PS</th>
              <th className="p-2 border-r border-slate-300">Patient Details</th>
              <th className="p-2 border-r border-slate-300">Rukka ID, Hospital</th>
              <th className="p-2 border-r border-slate-300">Brief details of the incident</th>
              <th className="p-1 w-8 text-center print:hidden">Act</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {data.rukkas.length > 0 ? (
              data.rukkas.map((r, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="p-1.5 border-r border-slate-300 text-center font-mono">{idx + 1}</td>
                  <td className="p-1.5 border-r border-slate-300 font-bold">
                    <input
                      type="text"
                      value={r.ps}
                      onChange={(e) => handleRukkaChange(idx, "ps", e.target.value)}
                      className="w-full bg-transparent border-0 focus:outline-none focus:bg-white"
                    />
                  </td>
                  <td className="p-1.5 border-r border-slate-300 text-[11px]">
                    <textarea
                      rows={2}
                      value={r.patientDetails}
                      onChange={(e) => handleRukkaChange(idx, "patientDetails", e.target.value)}
                      className="w-full bg-transparent border-0 focus:outline-none focus:bg-white resize-none"
                    />
                  </td>
                  <td className="p-1.5 border-r border-slate-300 font-mono text-[10px]">
                    <textarea
                      rows={2}
                      value={r.rukkaIdHospital}
                      onChange={(e) => handleRukkaChange(idx, "rukkaIdHospital", e.target.value)}
                      className="w-full bg-transparent border-0 focus:outline-none focus:bg-white resize-none"
                    />
                  </td>
                  <td className="p-1.5 border-r border-slate-300 text-[11px] italic">
                    <textarea
                      rows={2}
                      value={r.briefDetails}
                      onChange={(e) => handleRukkaChange(idx, "briefDetails", e.target.value)}
                      className="w-full bg-transparent border-0 focus:outline-none focus:bg-white resize-none"
                    />
                  </td>
                  <td className="p-1 text-center print:hidden">
                    <button onClick={() => handleDeleteRukka(idx)} className="text-slate-400 hover:text-red-700">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="p-3 text-center text-slate-500 italic font-medium">
                  Nil (कोई रुक्का / अस्पताल सूचना नहीं)
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );

  // 9. Section XI: Upload Summaries
  const renderSec11Uploads = () => (
    <section key="sec_11" className="mb-8">
      {renderSectionHeader("sec_11", `Section XI: FIR Upload Summary Report on ${data.reportDate} (Page 19)`, handleAddUploadSummary, "Add Station Row")}
      <div className="overflow-x-auto">
        <table className={`w-full ${cellPaddingClass} border border-slate-300 text-left`}>
          <thead className={`bg-slate-100 font-bold border-b border-slate-300 ${headerPaddingClass}`}>
            <tr>
              <th className="p-2 border-r border-slate-300">Police Station</th>
              <th className="p-2 border-r border-slate-300 text-center">FIR Registered on Previous Day</th>
              <th className="p-2 border-r border-slate-300 text-center text-emerald-800">FIR Uploaded on Previous Day</th>
              <th className="p-2 border-r border-slate-300 text-center text-red-700">FIR NOT Uploaded on Previous Day</th>
              <th className="p-1 w-8 text-center print:hidden">Act</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {data.uploadSummaries.length > 0 ? (
              data.uploadSummaries.map((s, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="p-1.5 border-r border-slate-300 font-medium">
                    <input
                      type="text"
                      value={s.ps}
                      onChange={(e) => handleUploadSummaryChange(idx, "ps", e.target.value)}
                      className="w-full bg-transparent border-0 focus:outline-none focus:bg-white"
                    />
                  </td>
                  <td className="p-1.5 border-r border-slate-300 text-center font-mono font-bold">
                    <input
                      type="number"
                      value={s.registeredPreviousDay}
                      onChange={(e) => handleUploadSummaryChange(idx, "registeredPreviousDay", Number(e.target.value))}
                      className="w-16 text-center bg-transparent border-0 focus:outline-none focus:bg-white"
                    />
                  </td>
                  <td className="p-1.5 border-r border-slate-300 text-center font-mono font-bold text-emerald-700">
                    <input
                      type="number"
                      value={s.uploadedCitizenPortal}
                      onChange={(e) => handleUploadSummaryChange(idx, "uploadedCitizenPortal", Number(e.target.value))}
                      className="w-16 text-center bg-transparent border-0 focus:outline-none focus:bg-white text-emerald-700 font-bold"
                    />
                  </td>
                  <td className="p-1.5 border-r border-slate-300 text-center font-mono font-bold text-red-600">
                    <input
                      type="number"
                      value={s.notUploadedCitizenPortal}
                      onChange={(e) => handleUploadSummaryChange(idx, "notUploadedCitizenPortal", Number(e.target.value))}
                      className="w-16 text-center bg-transparent border-0 focus:outline-none focus:bg-white text-red-600 font-bold"
                    />
                  </td>
                  <td className="p-1 text-center print:hidden">
                    <button onClick={() => handleDeleteUploadSummary(idx)} className="text-slate-400 hover:text-red-700">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="p-3 text-center text-slate-500 italic font-medium">
                  Nil (कोई अपलोड रिकॉर्ड नहीं)
                </td>
              </tr>
            )}
            {/* Total Row */}
            {data.uploadSummaries.length > 0 && (
              <tr className="bg-slate-100 font-bold text-slate-900">
                <td className="p-2 border-r border-slate-300 text-right uppercase">Total</td>
                <td className="p-2 border-r border-slate-300 text-center font-mono">
                  {data.uploadSummaries.reduce((acc, s) => acc + s.registeredPreviousDay, 0)}
                </td>
                <td className="p-2 border-r border-slate-300 text-center font-mono text-emerald-700">
                  {data.uploadSummaries.reduce((acc, s) => acc + s.uploadedCitizenPortal, 0)}
                </td>
                <td className="p-2 border-r border-slate-300 text-center font-mono text-red-600">
                  {data.uploadSummaries.reduce((acc, s) => acc + s.notUploadedCitizenPortal, 0)}
                </td>
                <td className="print:hidden"></td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );

  // Mapping of section IDs to render functions
  const sectionRenderMap: Record<string, () => React.ReactNode> = {
    summary: renderSummarySection,
    sec_1: renderSec1Firs,
    sec_2: renderSec2Arrests,
    sec_3: renderSec3Recoveries,
    sec_4: renderSec4Modifications,
    sec_5: renderSec5Disposals,
    sec_6: renderSec6Reopened,
    sec_10: renderSec10Rukkas,
    sec_11: renderSec11Uploads,
  };

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {notification && (
        <div className="bg-emerald-900 text-white px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between shadow-md animate-in fade-in">
          <span className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            {notification}
          </span>
          <button onClick={() => setNotification(null)} className="text-emerald-300 hover:text-white">✕</button>
        </div>
      )}

      {/* Main Operational Action Bar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
          {/* GENERATE CRIMESITREP BUTTON (Centralized database audit for district) */}
          <button
            onClick={handleGenerateCrimeSitrepClick}
            disabled={isGenerating}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs active:scale-95 transition-all"
            title="Scan all police stations in this district for previous day (24 hours) and generate SP Crime SITREP"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isGenerating ? "animate-spin" : ""}`} />
            <span>{isGenerating ? "Auditing Stations..." : "Generate CrimeSITREP"}</span>
          </button>

          {/* SAVE TO REPORTS HISTORY BUTTON (Exact User Request) */}
          <button
            onClick={handleSaveToReportsHistory}
            disabled={isGenerating}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-xs active:scale-95 transition-all"
            title="Save this generated/audited Crime SITREP report into Reports History and download preview"
          >
            <BookmarkCheck className="w-3.5 h-3.5 text-white" />
            <span>Save to Reports History</span>
          </button>

          {/* VIEW REPORTS HISTORY (NAVIGATION) */}
          {onNavigateToSaved && (
            <button
              onClick={onNavigateToSaved}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors"
              title="View all saved historical reports"
            >
              <History className="w-3.5 h-3.5 text-slate-500" />
              <span>View Reports History</span>
            </button>
          )}

          {/* AUDIT DATE PICKER (Selects Report Date, automatically auditing its previous 24 hours) */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs" title="Change Report Date to audit strictly the back day's 24 hours">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-bold text-slate-600 text-[11px] whitespace-nowrap">Report Date:</span>
            <input
              type="date"
              max={maxAllowedDate}
              value={getIsoDateFromDisplay(data.reportDate)}
              onChange={(e) => handleReportDateChange(e.target.value)}
              className="bg-transparent font-semibold text-slate-800 text-xs focus:outline-none cursor-pointer"
            />
          </div>

          {/* 24-hr Audit Window Indicator Badge */}
          <div className="hidden xl:flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-amber-900 bg-amber-50 border border-amber-200 rounded-lg" title="SITREP audits data strictly up to midnight of previous day">
            <span>{data.cutoffTime} (24h Audit)</span>
          </div>

          {/* Search Input */}
          <div className="relative min-w-[160px] max-w-xs">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search FIR, Section, IO..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-800"
            />
          </div>

          {/* Station Filter */}
          <select
            value={selectedPs}
            onChange={(e) => setSelectedPs(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-700"
          >
            <option value="ALL">All Stations ({data.firEntries.length})</option>
            {policeStations.map((ps) => (
              <option key={ps} value={ps}>
                {ps}
              </option>
            ))}
          </select>
        </div>

        {/* Layout & Print Actions */}
        <div className="flex items-center gap-2">
          {/* CUSTOMIZE LAYOUT BUTTON (Reorder sections & table size) */}
          <button
            onClick={() => setIsCustomizingLayout(!isCustomizingLayout)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
              isCustomizingLayout ? "bg-indigo-50 text-indigo-700 border-indigo-300" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            }`}
            title="Arrange positions of sections, tables and adjust sizes"
          >
            <Sliders className="w-3.5 h-3.5 text-indigo-600" />
            <span>{isCustomizingLayout ? "Close Layout Manager" : "Customize Layout & Size"}</span>
          </button>

          <button
            onClick={() => setIsEditingHeader(!isEditingHeader)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
              isEditingHeader ? "bg-amber-100 text-amber-900 border-amber-300" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>{isEditingHeader ? "Close Header" : "Edit Header"}</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={async () => {
              const filename = `CRIME_SITREP_${data.district}_${data.reportDate.replace(/\//g, "-")}`;
              showToast("PDF तैयार हो रहा है... कृपया प्रतीक्षा करें");
              await downloadElementAsPdf("printable-sitrep-document", filename);
              showToast("PDF सफलतापूर्वक डाउनलोड हो गया!");
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg shadow-2xs transition-colors active:scale-95"
            title="Download Crime SITREP as official PDF template"
          >
            <Download className="w-3.5 h-3.5 text-red-600" />
            <span>Download PDF</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-[#0b192c] hover:bg-[#081225] rounded-lg shadow-2xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print A4</span>
          </button>
        </div>
      </div>

      {/* LAYOUT & ORDER CUSTOMIZER DRAWER */}
      {isCustomizingLayout && (
        <div className="bg-slate-50 border border-indigo-200 p-4 rounded-2xl shadow-xs space-y-4 print:hidden animate-in fade-in">
          <div className="flex flex-wrap items-center justify-between border-b border-indigo-100 pb-2.5">
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-600" />
                <span>टेम्पलेट लेआउट, सेक्शन क्रम व टेबल साइज व्यवस्थित करें (Arrange Sections & Sizes)</span>
              </h4>
              <p className="text-[11px] text-slate-500">
                सेक्शन का क्रम ऊपर-नीचे बदलें, अनावश्यक सेक्शन छुपाएं, या टेबल का आकार छोटा/बड़ा करें।
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={resetLayout}
                className="flex items-center gap-1 text-[11px] font-bold text-slate-600 hover:text-slate-900 px-2.5 py-1 rounded border border-slate-300 bg-white"
                title="Reset to default PPR police format"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Default Order</span>
              </button>
              <button
                onClick={() => setIsCustomizingLayout(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Density & Font Sizing */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
              <span className="text-[11px] font-bold text-slate-700 block uppercase tracking-wider">
                टेबल व फॉन्ट साइज (Table Density / Font Scale)
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setDensity("compact")}
                  className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-lg border transition-all ${
                    density === "compact"
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  Compact (A4 Tight)
                </button>
                <button
                  onClick={() => setDensity("normal")}
                  className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-lg border transition-all ${
                    density === "normal"
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  Standard (Normal)
                </button>
                <button
                  onClick={() => setDensity("spacious")}
                  className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-lg border transition-all ${
                    density === "spacious"
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  Spacious (IGP View)
                </button>
              </div>
            </div>

            {/* Reorder Sections Quick List */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
              <span className="text-[11px] font-bold text-slate-700 block uppercase tracking-wider">
                सेक्शन क्रम स्थिति (Section Positions: #{1} to #{sectionOrder.length})
              </span>
              <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1">
                {sectionOrder.map((secKey, idx) => {
                  const isHidden = hiddenSections.includes(secKey);
                  return (
                    <div
                      key={secKey}
                      className={`flex items-center justify-between p-1.5 rounded-lg border text-xs ${
                        isHidden ? "bg-slate-100 text-slate-400 border-slate-200" : "bg-slate-50 text-slate-800 border-slate-200"
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="font-mono font-bold text-[10px] text-slate-400">#{idx + 1}</span>
                        <span className="font-semibold truncate text-[11px]">{sectionTitles[secKey] || secKey}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => moveSection(idx, "up")}
                          disabled={idx === 0}
                          className="p-1 rounded hover:bg-slate-200 disabled:opacity-20 text-slate-700"
                          title="Move Up"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => moveSection(idx, "down")}
                          disabled={idx === sectionOrder.length - 1}
                          className="p-1 rounded hover:bg-slate-200 disabled:opacity-20 text-slate-700"
                          title="Move Down"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => toggleHideSection(secKey)}
                          className="p-1 rounded hover:bg-slate-200 text-slate-600"
                          title={isHidden ? "Show Section" : "Hide Section"}
                        >
                          {isHidden ? <Eye className="w-3 h-3 text-slate-400" /> : <EyeOff className="w-3 h-3 text-slate-700" />}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Official Government SITREP Document (Printable exact replica) */}
      <div
        id="printable-sitrep-document"
        className="bg-white p-6 sm:p-10 rounded-2xl border border-slate-200 shadow-sm text-slate-900 font-sans max-w-5xl mx-auto space-y-6"
      >
        {/* 1. REPORT GENERAL INFORMATION / COVER HEADER */}
        <div className="text-center border-b pb-6 relative">
          <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-slate-900 text-amber-400 flex items-center justify-center font-bold text-lg shadow-xs">
            ह.पु
          </div>
          <h1 className="text-lg sm:text-xl font-black uppercase tracking-wider text-slate-900">
            {data.reportTitle || "CRIME SITREP"} For {data.officeTitle || "Superintendent of Police"},
          </h1>
          <h2 className="text-base sm:text-lg font-bold text-slate-800 tracking-wide uppercase">
            {data.district}
          </h2>
          <p className="text-xs font-semibold text-slate-700 mt-1">
            Report Date: <span className="font-mono">{data.reportDate}</span>
          </p>
          <p className="text-[11px] text-slate-500 font-mono italic">
            {data.cutoffTime}
          </p>

          <div className="mt-2 flex flex-wrap items-center justify-between text-[10px] text-slate-500 font-mono border-t pt-2 border-slate-100">
            <span>Generated: {data.generatedDateTime || new Date().toLocaleString("en-IN")}</span>
            <span className="font-bold text-slate-700">Office: {data.officeLocation || `Superintendent of Police, ${data.district}`}</span>
            <span>Page {data.pageNumber || 1} of {data.totalPages || 19}</span>
          </div>

          {/* Quick Header Editor Drawer */}
          {isEditingHeader && (
            <div className="mt-4 p-4 rounded-xl border border-amber-200 bg-amber-50/60 text-left text-xs space-y-3 print:hidden">
              <div className="flex items-center justify-between font-bold text-amber-900 border-b border-amber-200 pb-1.5">
                <span>संपादित करें: रिपोर्ट की सामान्य जानकारी (Edit General Report Info)</span>
                <button onClick={() => setIsEditingHeader(false)}><X className="w-4 h-4" /></button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-600 block">District Name</label>
                  <input
                    type="text"
                    value={data.district}
                    onChange={(e) => handleHeaderChange("district", e.target.value)}
                    className="w-full mt-1 p-1.5 bg-white border border-slate-300 rounded text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-600 block">Report Date</label>
                  <input
                    type="date"
                    max={maxAllowedDate}
                    value={getIsoDateFromDisplay(data.reportDate)}
                    onChange={(e) => handleReportDateChange(e.target.value)}
                    className="w-full mt-1 p-1.5 bg-white border border-slate-300 rounded text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-600 block">Cutoff Period (Auto Previous Day 24h)</label>
                  <input
                    type="text"
                    value={data.cutoffTime}
                    readOnly
                    className="w-full mt-1 p-1.5 bg-slate-100 border border-slate-300 rounded text-xs text-slate-600 font-mono cursor-not-allowed"
                    title="यह फील्ड रिपोर्ट तारीख के पिछले 24 घंटे के आधार पर स्वतः सेट होती है"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-[10px] font-bold uppercase text-slate-600 block">Control Room Incharge / Office</label>
                  <input
                    type="text"
                    value={data.controlRoomIncharge || ""}
                    onChange={(e) => handleHeaderChange("controlRoomIncharge", e.target.value)}
                    className="w-full mt-1 p-1.5 bg-white border border-slate-300 rounded text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-600 block">Pages Count</label>
                  <input
                    type="number"
                    value={data.totalPages || 19}
                    onChange={(e) => handleHeaderChange("totalPages", Number(e.target.value))}
                    className="w-full mt-1 p-1.5 bg-white border border-slate-300 rounded text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* DYNAMIC ORDERED SECTIONS RENDERING */}
        {sectionOrder.map((secKey) => {
          if (hiddenSections.includes(secKey)) return null;
          const renderer = sectionRenderMap[secKey];
          if (!renderer) return null;
          return <React.Fragment key={secKey}>{renderer()}</React.Fragment>;
        })}

        {/* OFFICIAL SIGNATURE BLOCK */}
        <div className="pt-6 border-t border-slate-300 flex flex-wrap items-center justify-between text-xs gap-4">
          <div className="text-slate-500 text-[11px] font-mono">
            <p>Report ID: {data.id || `SITREP-${data.district}`}</p>
            <p>Verification: Control Room Log Verified</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-slate-900">{data.controlRoomIncharge || `Incharge Control Room, ${data.district}`}</p>
            <p className="font-black text-slate-900 uppercase">{data.officeTitle || "SUPERINTENDENT OF POLICE"}, {data.district}</p>
            <p className="text-[11px] text-slate-500 font-mono mt-0.5">Dated {data.reportDate}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
